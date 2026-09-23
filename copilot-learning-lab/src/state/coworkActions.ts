import { scenarios, detectScenario, slotLabel, type Step } from '../engine/cowork/scenarios';
import { meetingConflicts } from '../engine/cowork/common';
import { revise, type RevisionId, REVISION_OPTIONS } from '../engine/cowork/revise';
import type { Artifact, EmailPayload, MeetingPayload, OutboundAction, ScenarioId, Task, TranscriptItem } from '../engine/model';
import { getDoc } from '../scenario/registry';
import { cancel, cancelPrefix, schedule } from '../lib/scheduler';
import { clockTime, hashString, newId } from '../lib/util';
import { announce, lab, logEvent, mutate, type LabState } from './store';
import { createReadyTaskRef } from './agentActions';
import { navigate } from './router';

/**
 * Cowork task engine.
 *
 * A task walks through its scenario script one step at a time. Every delay is
 * a keyed, cancellable timer ("task:<id>:…"), so Pause, Cancel, Restart and
 * Reset stop pending work. Steps that wait for the learner (plan, questions,
 * approvals) set a status and stop until the learner acts.
 *
 * Outbound actions are approved individually. Approval records a hash of the
 * payload; execution only proceeds if the payload still matches. Execution is
 * idempotent: an action that already produced a sent item or calendar event
 * is never executed twice (retry, refresh or double-click).
 */

const taskKey = (id: string, suffix = '') => `task:${id}:${suffix}`;

const payloadHash = (a: OutboundAction) => hashString(JSON.stringify(a.kind === 'email' ? a.email : a.meeting));

const push = (t: Task, item: Omit<TranscriptItem, 'id' | 'at'> & Record<string, unknown>) => {
  const it = { id: newId('itm'), at: Date.now(), ...item } as TranscriptItem;
  t.transcript.push(it);
  return it;
};

function stepsOf(t: Task): Step[] {
  return scenarios[t.scenarioId].steps(t);
}

// ───────────── creation ─────────────

export function createReadyTask(scenarioId: ScenarioId, prompt: string, files: string[], brief?: Task['context']['brief']): string {
  const id = newId('tsk');
  mutate((s) => {
    s.tasks[id] = {
      id,
      scenarioId,
      title: scenarios[scenarioId].title,
      prompt,
      createdAt: Date.now(),
      status: 'ready',
      context: { brief, files: [...files] },
      requested: { update: false, email: false, meeting: false, reviewFirst: false },
      answers: {},
      cursor: 0,
      transcript: [],
      artifactIds: [],
      actionIds: [],
      skills: [],
      queued: [],
    };
    s.taskOrder.unshift(id);
    if (scenarioId === 'main') s.session.mainTaskId = id;
  });
  return id;
}
createReadyTaskRef.current = createReadyTask;

/** Start from the Cowork home composer. Returns the task id. */
export function startFromHome(prompt: string, files: string[]): string {
  const scenario = detectScenario(prompt, files);
  const id = createReadyTask(scenario ?? 'main', prompt, files, lab().coworkDraft.briefFromAgent);
  mutate((s) => { s.coworkDraft = { prompt: '', files: [] }; });
  if (!scenario) {
    // Outside the simulation: explain the supported scope honestly.
    mutate((s) => {
      const t = s.tasks[id];
      t.title = prompt.slice(0, 60);
      push(t, { kind: 'user', text: prompt });
      push(t, {
        kind: 'assistant',
        text:
          "This training simulation doesn't include your real mailbox, calendar or files, so I can't do that here.\n\nSupported tasks:\n- **Weekly AI programme update** — carry a briefing from your agent, or attach the Weekly Delivery Tracker.\n- **Prepare the working group agenda** — attach the Operations Automation Working Group notes.\n- **Escalate overdue payments work** — attach the Payments Platform Upgrade tracker.",
      });
      t.status = 'completed';
      t.statusNote = 'Outside the simulation — no work performed.';
    });
    navigate({ name: 'task', taskId: id });
    return id;
  }
  navigate({ name: 'task', taskId: id });
  startTask(id, prompt, files);
  return id;
}

export function startTask(taskId: string, prompt: string, files: string[]) {
  mutate((s) => {
    const t = s.tasks[taskId];
    if (!t || t.status !== 'ready') return;
    const sc = scenarios[t.scenarioId];
    t.prompt = prompt;
    t.context.files = [...files];
    t.requested = sc.parseRequest(prompt);
    t.status = 'working';
    t.statusNote = undefined;
    push(t, { kind: 'user', text: prompt });
    logEvent(s, 'task_started', { taskId, scenario: t.scenarioId });
    logEvent(s, 'objective_checked', {
      taskId,
      update: t.requested.update,
      email: t.requested.email,
      meeting: t.requested.meeting,
      reviewFirst: t.requested.reviewFirst,
      withBrief: !!t.context.brief,
    });
  });
  const t = lab().tasks[taskId];
  if (t.scenarioId === 'main' && !t.requested.update && !t.requested.email && !t.requested.meeting) {
    mutate((s) => {
      const tt = s.tasks[taskId];
      push(tt, { kind: 'question', questionId: 'outputs' });
      tt.status = 'needs_input';
    });
    announce('Cowork needs your input.');
    return;
  }
  runNext(taskId);
}

export function updateReadyTask(taskId: string, patch: { prompt?: string; files?: string[] }) {
  mutate((s) => {
    const t = s.tasks[taskId];
    if (!t || t.status !== 'ready') return;
    if (patch.prompt !== undefined) t.prompt = patch.prompt;
    if (patch.files) t.context.files = patch.files;
  });
}

// ───────────── runner ─────────────

function advance(taskId: string, delay = 250) {
  mutate((s) => { s.tasks[taskId].cursor += 1; });
  const t = lab().tasks[taskId];
  if (t.pauseRequested) {
    mutate((s) => {
      const tt = s.tasks[taskId];
      tt.status = 'paused';
      tt.pauseRequested = false;
      tt.statusNote = 'Paused after finishing the current step. Select Resume to continue.';
      push(tt, { kind: 'notice', tone: 'info', text: 'Paused. Cowork finished the current step and stopped before the next one.' });
    });
    announce('Task paused.');
    return;
  }
  schedule(taskKey(taskId, 'next'), delay, () => runNext(taskId));
}

export function runNext(taskId: string) {
  const t = lab().tasks[taskId];
  if (!t || t.status !== 'working') return;
  const steps = stepsOf(t);
  const step = steps[t.cursor];
  if (!step) return;
  if (('when' in step && step.when && !step.when(t))) {
    mutate((s) => { s.tasks[taskId].cursor += 1; });
    return runNext(taskId);
  }
  const sc = scenarios[t.scenarioId];

  switch (step.kind) {
    case 'think':
      mutate((s) => { s.tasks[taskId].thinking = true; });
      schedule(taskKey(taskId, 'step'), step.ms, () => {
        mutate((s) => { s.tasks[taskId].thinking = false; });
        advance(taskId, 50);
      });
      return;

    case 'say':
      mutate((s) => { push(s.tasks[taskId], { kind: 'assistant', text: step.text(s.tasks[taskId]) }); });
      return advance(taskId, 600);

    case 'plan': {
      if (t.transcript.some((i) => i.kind === 'plan' && i.state === 'pending')) {
        mutate((s) => { s.tasks[taskId].status = 'needs_input'; });
        return;
      }
      mutate((s) => {
        const tt = s.tasks[taskId];
        push(tt, { kind: 'plan', steps: sc.planSteps(tt), state: 'pending' });
        tt.status = 'needs_input';
        tt.statusNote = 'Review the plan to continue.';
      });
      announce('Cowork proposed a plan. Review it to continue.');
      return;
    }

    case 'question': {
      const existing = t.transcript.find((i) => i.kind === 'question' && i.questionId === step.id);
      if (existing && existing.kind === 'question' && existing.answered !== undefined) return advance(taskId, 50);
      mutate((s) => {
        const tt = s.tasks[taskId];
        if (!existing) push(tt, { kind: 'question', questionId: step.id });
        tt.status = 'needs_input';
        tt.statusNote = 'Cowork has a question for you.';
      });
      announce('Cowork needs your input.');
      return;
    }

    case 'skill':
      mutate((s) => {
        const tt = s.tasks[taskId];
        push(tt, { kind: 'skill', text: step.text, skill: step.skill });
        if (!tt.skills.includes(step.skill)) tt.skills.push(step.skill);
      });
      return advance(taskId, 350);

    case 'tool': {
      const running = t.transcript.find((i) => i.kind === 'tool' && i.text === step.text && i.state !== 'done');
      let itemId = running?.id;
      mutate((s) => {
        const tt = s.tasks[taskId];
        if (running) {
          const r = tt.transcript.find((i) => i.id === running.id);
          if (r && r.kind === 'tool') r.state = 'running';
        } else {
          itemId = push(tt, { kind: 'tool', text: step.text, state: 'running' }).id;
        }
      });
      schedule(taskKey(taskId, 'step'), step.ms, () => {
        mutate((s) => {
          const tt = s.tasks[taskId];
          const it = tt.transcript.find((i) => i.id === itemId);
          if (it && it.kind === 'tool') it.state = 'done';
          if (step.check === 'source-dates') sourceDateCheck(tt);
        });
        advance(taskId, 150);
      });
      return;
    }

    case 'artifacts':
      mutate((s) => {
        const tt = s.tasks[taskId];
        const ids: string[] = [];
        for (const spec of sc.artifactSpecs(tt)) {
          const existing = tt.artifactIds.map((id) => s.artifacts[id]).find((a) => a?.key === spec.key);
          if (existing) { ids.push(existing.id); continue; }
          const a: Artifact = {
            id: newId('art'),
            taskId,
            key: spec.key,
            title: spec.title,
            baseName: spec.baseName,
            format: spec.format,
            editable: spec.editable,
            current: 0,
            versions: [{ v: 1, content: sc.generate(spec.key, tt, {}), at: Date.now(), reason: 'Created by Cowork', sources: [...tt.context.files] }],
          };
          s.artifacts[a.id] = a;
          tt.artifactIds.push(a.id);
          ids.push(a.id);
        }
        if (ids.length) push(tt, { kind: 'artifacts', artifactIds: ids });
      });
      announce('Cowork created files in the Output folder.');
      return advance(taskId, 400);

    case 'actions': {
      if (t.actionIds.length) return settleActions(taskId);
      mutate((s) => {
        const tt = s.tasks[taskId];
        const byKey: Record<string, string> = {};
        tt.artifactIds.forEach((id) => { byKey[s.artifacts[id].key] = id; });
        const payloads = sc.actions(tt, byKey);
        const mk = (kind: 'email' | 'meeting', p: EmailPayload | MeetingPayload) => {
          const act: OutboundAction = {
            id: newId('act'),
            taskId,
            kind,
            state: 'needs_approval',
            ...(kind === 'email' ? { email: p as EmailPayload } : { meeting: p as MeetingPayload }),
            attempts: 0,
            history: [{ at: Date.now(), text: 'Prepared by Cowork. Waiting for your approval.' }],
          };
          s.actions[act.id] = act;
          tt.actionIds.push(act.id);
          push(tt, { kind: 'action', actionId: act.id });
        };
        if (payloads.email) mk('email', payloads.email);
        if (payloads.meeting) mk('meeting', payloads.meeting);
      });
      return settleActions(taskId);
    }

    case 'finish':
      finishTask(taskId);
      return;
  }
}

/** Flags an attached tracker that is older than the briefing or superseded. */
function sourceDateCheck(t: Task) {
  const stale = t.context.files.map(getDoc).find((d) => d?.supersededBy);
  if (!stale || t.staleNoticeShown) {
    if (!stale && !t.staleNoticeShown) {
      push(t, { kind: 'notice', tone: 'success', text: 'Source dates checked: the attached tracker is the current version (Week 38, 18 Sep 2026).' });
    }
    return;
  }
  const newer = getDoc(stale.supersededBy!);
  t.staleNoticeShown = true;
  push(t, {
    kind: 'notice',
    tone: 'warning',
    text: `The attached tracker is **${stale.version} (${stale.modified})** from the Archive folder${t.context.brief ? ', which is older than the briefing you provided' : ''}. A newer version exists: **${newer?.version} (${newer?.modified})**. I'll use the file you attached. Check milestone dates in the outputs, or replace the file in the Input folder and regenerate.`,
  });
}

function finishTask(taskId: string) {
  mutate((s) => {
    const t = s.tasks[taskId];
    const sc = scenarios[t.scenarioId];
    const outcomes = t.actionIds.map((id) => describeOutcome(s.actions[id]));
    const summary: Artifact = {
      id: newId('art'),
      taskId,
      key: 'summary',
      title: 'Task completion summary',
      baseName: 'task-summary',
      format: 'md',
      editable: false,
      current: 0,
      versions: [{ v: 1, content: sc.generate('summary', t, { actionOutcomes: outcomes }), at: Date.now(), reason: 'Created by Cowork', sources: [...t.context.files] }],
    };
    if (t.scenarioId === 'main') {
      s.artifacts[summary.id] = summary;
      t.artifactIds.push(summary.id);
      push(t, { kind: 'artifacts', artifactIds: [summary.id] });
    }
    push(t, { kind: 'assistant', text: `${sc.summaryIntro(t)}\n\n${outcomes.length ? outcomes.map((o) => `- ${o}`).join('\n') : '- No outbound actions were needed.'}` });
    t.status = 'completed';
    t.statusNote = undefined;
    t.unread = s.route.name !== 'task' || (s.route as { taskId?: string }).taskId !== taskId;
    logEvent(s, 'task_completed', { taskId, scenario: t.scenarioId });
  });
  announce('Task completed.');
}

function describeOutcome(a: OutboundAction): string {
  const when = a.history.length ? clockTime(a.history[a.history.length - 1].at) : '';
  if (a.kind === 'email') {
    const to = a.email!.to.map((r) => r.name).join(', ');
    if (a.state === 'done') return `Email "${a.email!.subject}" sent to ${to} at ${when} (simulated).`;
    if (a.state === 'cancelled') return `Email to ${to} was not sent (cancelled).`;
    return `Email to ${to}: ${a.state.replace('_', ' ')}.`;
  }
  const m = a.meeting!;
  if (a.state === 'done') return `Meeting "${m.title}" created for ${slotLabel(m)} (simulated).`;
  if (a.state === 'cancelled') return `Meeting "${m.title}" was not created (cancelled).`;
  return `Meeting: ${a.state.replace('_', ' ')}.`;
}

/** Recompute task status from its actions; advance past the actions step once all are resolved. */
function settleActions(taskId: string) {
  const s = lab();
  const t = s.tasks[taskId];
  if (!t || t.status === 'cancelled' || t.status === 'paused') return;
  const acts = t.actionIds.map((id) => s.actions[id]);
  const steps = stepsOf(t);
  const atActions = steps[t.cursor]?.kind === 'actions';
  if (acts.every((a) => a.state === 'done' || a.state === 'cancelled')) {
    if (atActions) {
      mutate((st) => { st.tasks[taskId].status = 'working'; });
      advance(taskId, 300);
    }
    return;
  }
  mutate((st) => {
    const tt = st.tasks[taskId];
    if (acts.some((a) => a.state === 'failed')) {
      tt.status = 'failed';
      tt.statusNote = 'An action failed. Retry it, edit it, or cancel it.';
    } else if (acts.some((a) => a.state === 'needs_approval')) {
      tt.status = 'needs_approval';
      tt.statusNote = `${acts.filter((a) => a.state === 'needs_approval').length} action(s) waiting for your approval.`;
    } else {
      tt.status = 'working';
      tt.statusNote = undefined;
    }
  });
  if (lab().tasks[taskId].status === 'needs_approval') announce('Cowork is waiting for your approval.');
}

// ───────────── learner inputs ─────────────

export function acceptPlan(taskId: string) {
  mutate((s) => {
    const t = s.tasks[taskId];
    const p = t.transcript.find((i) => i.kind === 'plan' && i.state === 'pending');
    if (!p || p.kind !== 'plan') return;
    p.state = 'accepted';
    t.status = 'working';
    t.statusNote = undefined;
    logEvent(s, 'plan_accepted', { taskId });
  });
  advance(taskId, 200);
}

export function answerTaskQuestion(taskId: string, questionId: string, value: string | null, label?: string) {
  mutate((s) => {
    const t = s.tasks[taskId];
    const q = t.transcript.find((i) => i.kind === 'question' && i.questionId === questionId);
    if (!q || q.kind !== 'question' || q.answered !== undefined) return;
    q.answered = value;
    t.answers[questionId] = value;
    push(t, { kind: 'user', text: value === null ? 'Skip' : label ?? value });
    if (questionId === 'outputs' && value) {
      t.requested = {
        update: true,
        email: value !== 'update',
        meeting: value === 'all',
        reviewFirst: true,
      };
    }
    if (value === null) {
      push(t, {
        kind: 'notice',
        tone: 'info',
        text:
          questionId === 'recipients'
            ? "Skipped. I'll use the **Programme Leadership Group** — check the recipients before you approve the email."
            : questionId === 'slot'
              ? `Skipped. I'll propose Thursday 24 Sep, 10:00–10:30 SAST — check for conflicts before you approve.`
              : 'Skipped. Continuing with the information I have.',
      });
    }
    t.status = 'working';
    t.statusNote = undefined;
    logEvent(s, 'question_answered', { taskId, questionId, skipped: value === null });
    if (questionId === 'recipients' && value !== null) logEvent(s, 'recipients_checked', { taskId, via: 'question' });
  });
  const t = lab().tasks[taskId];
  if (questionId === 'outputs') runNext(taskId);
  else if (t.cursor < stepsOf(t).length) advance(taskId, 200);
}

/** Messages typed while Cowork is busy are queued and acknowledged in order. */
export function sendTaskMessage(taskId: string, text: string) {
  const t = lab().tasks[taskId];
  if (!t || !text.trim()) return;
  mutate((s) => {
    const tt = s.tasks[taskId];
    push(tt, { kind: 'user', text });
    const rev = /(short|formal|decision|owner)/i.test(text);
    push(tt, {
      kind: 'assistant',
      text:
        tt.status === 'completed' || tt.status === 'cancelled'
          ? rev
            ? 'Open a file in the Output folder and use **Request a revision** to change it. I can make it shorter, more formal, lead with decisions, or add owners and dates.'
            : 'This task has finished. Start a new task from the Cowork home page, or open an output to request a revision.'
          : "Noted. In this simulation I can't change direction mid-task from free text. Use the question cards, approval cards, or the Pause and Cancel controls — or request a revision on an output once it's ready.",
    });
  });
}

// ───────────── pause, resume, cancel ─────────────

export function pauseTask(taskId: string, mode: 'soft' | 'hard') {
  const t = lab().tasks[taskId];
  if (!t || ['completed', 'cancelled', 'paused', 'ready'].includes(t.status)) return;
  if (mode === 'soft' && t.status === 'working') {
    mutate((s) => { s.tasks[taskId].pauseRequested = true; s.tasks[taskId].statusNote = 'Pausing after the current step…'; logEvent(s, 'task_paused', { taskId, mode }); });
    announce('Cowork will pause after the current step.');
    return;
  }
  cancelPrefix(taskKey(taskId));
  mutate((s) => {
    const tt = s.tasks[taskId];
    const running = tt.transcript.find((i) => i.kind === 'tool' && i.state === 'running');
    if (running && running.kind === 'tool') running.state = 'interrupted';
    tt.thinking = false;
    // Queued (approved but not yet executed) actions go back to needing approval.
    for (const id of tt.actionIds) {
      const a = s.actions[id];
      if (a.state === 'queued' || (a.state === 'executing' && !a.resultId)) {
        a.state = 'needs_approval';
        a.history.push({ at: Date.now(), text: 'Not sent: the task was paused before this action ran. Approve again when ready.' });
      }
    }
    tt.status = 'paused';
    tt.pauseRequested = false;
    tt.statusNote = running ? `Paused immediately. "${(running as { text: string }).text}" will restart when you resume.` : 'Paused. Select Resume to continue.';
    push(tt, { kind: 'notice', tone: 'info', text: 'Paused immediately.' });
    logEvent(s, 'task_paused', { taskId, mode });
  });
  announce('Task paused.');
}

export function resumeTask(taskId: string) {
  const t = lab().tasks[taskId];
  if (!t || t.status !== 'paused') return;
  mutate((s) => {
    const tt = s.tasks[taskId];
    tt.status = 'working';
    tt.statusNote = undefined;
    push(tt, { kind: 'notice', tone: 'info', text: 'Resumed.' });
  });
  announce('Task resumed.');
  const step = stepsOf(t)[t.cursor];
  if (step?.kind === 'actions' && t.actionIds.length) return settleActions(taskId);
  if (step?.kind === 'question') {
    const q = t.transcript.find((i) => i.kind === 'question' && i.questionId === step.id);
    if (q && q.kind === 'question' && q.answered !== undefined) return advance(taskId, 100);
  }
  runNext(taskId);
}

export function cancelTask(taskId: string) {
  const t = lab().tasks[taskId];
  if (!t || ['completed', 'cancelled'].includes(t.status)) return;
  cancelPrefix(taskKey(taskId));
  for (const id of t.actionIds) cancelPrefix(`action:${id}`);
  mutate((s) => {
    const tt = s.tasks[taskId];
    const running = tt.transcript.find((i) => i.kind === 'tool' && i.state === 'running');
    if (running && running.kind === 'tool') running.state = 'interrupted';
    tt.thinking = false;
    const done: string[] = [];
    const stopped: string[] = [];
    for (const id of tt.actionIds) {
      const a = s.actions[id];
      const label = a.kind === 'email' ? 'the email' : 'the meeting';
      if (a.state === 'done') done.push(label);
      else if (a.state !== 'cancelled') {
        a.state = 'cancelled';
        a.history.push({ at: Date.now(), text: 'Cancelled with the task. Not executed.' });
        stopped.push(label);
      }
    }
    tt.status = 'cancelled';
    tt.statusNote =
      (done.length ? `Already completed before cancelling: ${done.join(' and ')}. ` : '') +
      (stopped.length ? `Not executed: ${stopped.join(' and ')}.` : 'No pending actions were affected.');
    push(tt, { kind: 'notice', tone: 'warning', text: `Task cancelled. ${tt.statusNote}` });
    logEvent(s, 'task_cancelled', { taskId, completedActions: done.length, stoppedActions: stopped.length });
  });
  announce('Task cancelled.');
}

// ───────────── actions: approve, edit, execute, retry, cancel ─────────────

export function markActionViewed(actionId: string) {
  const a = lab().actions[actionId];
  if (!a || a.viewed) return;
  mutate((s) => {
    s.actions[actionId].viewed = true;
    logEvent(s, 'action_viewed', { actionId, kind: a.kind });
  });
}

export function approveAction(actionId: string) {
  const a = lab().actions[actionId];
  if (!a || a.state !== 'needs_approval') return;
  const conflicts = a.kind === 'meeting' ? meetingConflicts(a.meeting!).length : 0;
  mutate((s) => {
    const act = s.actions[actionId];
    act.state = 'queued';
    act.approvedHash = payloadHash(act);
    act.changedAfterApproval = false;
    act.executeAt = Date.now() + 4000;
    act.history.push({ at: Date.now(), text: act.kind === 'email' ? 'Approved: Send.' : 'Approved: Create.' });
    logEvent(s, 'action_approved', { actionId, kind: act.kind, viewed: !!act.viewed, conflicts });
    settleInline(s, act.taskId);
  });
  schedule(`action:${actionId}:execute`, 4000, () => executeAction(actionId));
  announce(a.kind === 'email' ? 'Email approved. Sending in a few seconds — you can still undo.' : 'Meeting approved. Creating in a few seconds — you can still undo.');
}

/** Inline status recompute inside an existing mutation. */
function settleInline(s: LabState, taskId: string) {
  const t = s.tasks[taskId];
  if (!t || t.status === 'cancelled' || t.status === 'paused') return;
  const acts = t.actionIds.map((id) => s.actions[id]);
  if (acts.some((x) => x.state === 'failed')) t.status = 'failed';
  else if (acts.some((x) => x.state === 'needs_approval')) t.status = 'needs_approval';
  else t.status = 'working';
}

export function undoQueued(actionId: string) {
  cancel(`action:${actionId}:execute`);
  mutate((s) => {
    const a = s.actions[actionId];
    if (a.state !== 'queued') return;
    a.state = 'needs_approval';
    a.approvedHash = undefined;
    a.history.push({ at: Date.now(), text: 'Stopped before execution. Nothing was sent.' });
    settleInline(s, a.taskId);
  });
  announce('Stopped. Nothing was sent.');
}

export function executeAction(actionId: string) {
  const a = lab().actions[actionId];
  if (!a || a.state !== 'queued') return;
  if (a.approvedHash !== payloadHash(a)) {
    mutate((s) => {
      const act = s.actions[actionId];
      act.state = 'needs_approval';
      act.changedAfterApproval = true;
      act.history.push({ at: Date.now(), text: 'Content changed after approval. Approve the changed version.' });
      settleInline(s, act.taskId);
    });
    return;
  }
  mutate((s) => {
    const act = s.actions[actionId];
    act.state = 'executing';
    act.attempts += 1;
  });
  schedule(`action:${actionId}:run`, 900, () => {
    let failed = false;
    mutate((s) => {
      const act = s.actions[actionId];
      if (act.state !== 'executing') return;
      // Idempotency: never create a second sent item / event for the same action.
      const already = act.kind === 'email' ? s.mailbox.find((m) => m.actionId === actionId) : s.calendar.find((e) => e.actionId === actionId);
      if (already) {
        act.state = 'done';
        act.resultId = already.id;
        return;
      }
      const inject = act.kind === 'email' && s.facilitator.failures.connectorOnce && !s.facilitator.consumed.connector && s.tasks[act.taskId]?.scenarioId === 'main';
      if (inject) {
        s.facilitator.consumed.connector = true;
        act.state = 'failed';
        act.error = "Couldn't send: the simulated mail connector timed out. Nothing was sent. Retry, edit or cancel.";
        act.history.push({ at: Date.now(), text: 'Failed: connector timeout. Nothing was sent.' });
        logEvent(s, 'action_failed', { actionId, kind: act.kind });
        failed = true;
        return;
      }
      if (act.kind === 'email') {
        const item = { id: newId('msg'), actionId, taskId: act.taskId, at: Date.now(), email: JSON.parse(JSON.stringify(act.email)) };
        s.mailbox.push(item);
        act.resultId = item.id;
        act.history.push({ at: Date.now(), text: 'Sent (simulated). Added to Sent Items.' });
      } else {
        const ev = { id: newId('evt'), actionId, taskId: act.taskId, at: Date.now(), meeting: JSON.parse(JSON.stringify(act.meeting)) };
        s.calendar.push(ev);
        act.resultId = ev.id;
        act.history.push({ at: Date.now(), text: 'Created (simulated). Added to your calendar.' });
      }
      act.state = 'done';
      act.error = undefined;
      if (act.attempts > 1) logEvent(s, 'error_recovered', { what: 'action', actionId });
      const t = s.tasks[act.taskId];
      push(t, { kind: 'notice', tone: 'success', text: act.kind === 'email' ? `Email sent (simulated) to ${act.email!.to.map((r) => r.name).join(', ')}.` : `Meeting created (simulated) for ${slotLabel(act.meeting!)}.` });
    });
    const act = lab().actions[actionId];
    announce(failed ? 'The email could not be sent. Nothing was sent.' : act.kind === 'email' ? 'Email sent (simulated).' : 'Meeting created (simulated).');
    settleActions(act.taskId);
  });
}

export function retryAction(actionId: string) {
  const a = lab().actions[actionId];
  if (!a || a.state !== 'failed') return;
  mutate((s) => {
    const act = s.actions[actionId];
    logEvent(s, 'action_retried', { actionId });
    if (act.resultId) {
      act.state = 'done';
      return;
    }
    act.state = 'queued';
    act.error = undefined;
    act.history.push({ at: Date.now(), text: 'Retrying with the approved content.' });
    settleInline(s, act.taskId);
  });
  if (lab().actions[actionId].state === 'queued') executeAction(actionId);
  else settleActions(a.taskId);
}

export function cancelAction(actionId: string) {
  cancelPrefix(`action:${actionId}`);
  mutate((s) => {
    const a = s.actions[actionId];
    if (!a || a.state === 'done' || a.state === 'cancelled') return;
    a.state = 'cancelled';
    a.history.push({ at: Date.now(), text: 'Cancelled by you. Not executed.' });
    push(s.tasks[a.taskId], { kind: 'notice', tone: 'info', text: a.kind === 'email' ? 'Email cancelled. It was not sent.' : 'Meeting cancelled. It was not created.' });
    logEvent(s, 'action_cancelled', { actionId, kind: a.kind });
  });
  const a = lab().actions[actionId];
  announce(a.kind === 'email' ? 'Email cancelled. Not sent.' : 'Meeting cancelled. Not created.');
  settleActions(a.taskId);
}

export function editAction(actionId: string, patch: { email?: EmailPayload; meeting?: MeetingPayload }) {
  cancel(`action:${actionId}:execute`);
  mutate((s) => {
    const a = s.actions[actionId];
    if (!a || a.state === 'done' || a.state === 'cancelled' || a.state === 'executing') return;
    const before = JSON.stringify(a.kind === 'email' ? a.email : a.meeting);
    if (patch.email) a.email = patch.email;
    if (patch.meeting) a.meeting = patch.meeting;
    const after = JSON.stringify(a.kind === 'email' ? a.email : a.meeting);
    if (before === after) return;
    const wasApproved = a.state === 'queued' || !!a.approvedHash;
    if (a.state === 'queued' || a.state === 'failed') a.state = 'needs_approval';
    if (wasApproved) {
      a.changedAfterApproval = true;
      a.approvedHash = undefined;
    }
    a.history.push({ at: Date.now(), text: wasApproved ? 'Edited after approval. Approve the changed version.' : 'Edited by you.' });
    logEvent(s, 'action_edited', { actionId, kind: a.kind, afterApproval: wasApproved });
    if (patch.email && JSON.stringify(JSON.parse(before).to) !== JSON.stringify(patch.email.to)) logEvent(s, 'recipients_checked', { actionId, via: 'edit' });
    if (patch.meeting) {
      const b = JSON.parse(before) as MeetingPayload;
      if (b.start !== patch.meeting.start || b.date !== patch.meeting.date) {
        if (meetingConflicts(b).length && !meetingConflicts(patch.meeting).length) logEvent(s, 'conflict_resolved', { actionId });
      }
    }
    // Keep the email artifact in step with the action it previews.
    if (a.kind === 'email' && patch.email) {
      const art = s.tasks[a.taskId].artifactIds.map((id) => s.artifacts[id]).find((x) => x.key === 'email' || x.key === 'escalation');
      if (art && art.versions[art.current].content !== patch.email.body) {
        art.versions.push({ v: art.versions.length + 1, content: patch.email.body, at: Date.now(), reason: 'Edited by you', sources: art.versions[art.current].sources });
        art.current = art.versions.length - 1;
      }
    }
    settleInline(s, a.taskId);
  });
}

// ───────────── artifacts ─────────────

export function viewArtifact(artifactId: string) {
  mutate((s) => {
    const a = s.artifacts[artifactId];
    if (!a) return;
    if (!a.viewed) logEvent(s, 'artifact_viewed', { artifactId, key: a.key });
    a.viewed = true;
    s.tasks[a.taskId].unread = false;
  });
}

export function selectArtifactVersion(artifactId: string, index: number) {
  mutate((s) => { s.artifacts[artifactId].current = index; });
}

function syncEmailFromArtifact(s: LabState, art: Artifact) {
  if (art.key !== 'email' && art.key !== 'escalation') return;
  const act = s.tasks[art.taskId].actionIds.map((id) => s.actions[id]).find((x) => x.kind === 'email');
  if (!act || act.state === 'done' || act.state === 'cancelled' || !act.email) return;
  const body = art.versions[art.current].content;
  if (act.email.body === body) return;
  cancel(`action:${act.id}:execute`);
  const wasApproved = act.state === 'queued' || !!act.approvedHash;
  act.email.body = body;
  if (act.state === 'queued' || act.state === 'failed') act.state = 'needs_approval';
  if (wasApproved) { act.changedAfterApproval = true; act.approvedHash = undefined; }
  act.history.push({ at: Date.now(), text: wasApproved ? 'Email content changed after approval. Approve the changed version.' : 'Email content updated.' });
  settleInline(s, art.taskId);
}

export function editArtifact(artifactId: string, content: string) {
  mutate((s) => {
    const a = s.artifacts[artifactId];
    if (!a || !a.editable || a.versions[a.current].content === content) return;
    a.versions.push({ v: a.versions.length + 1, content, at: Date.now(), reason: 'Edited by you', sources: a.versions[a.current].sources });
    a.current = a.versions.length - 1;
    logEvent(s, 'artifact_edited', { artifactId, key: a.key });
    syncEmailFromArtifact(s, a);
  });
  announce('Saved a new version.');
}

export function requestRevision(artifactId: string, revision: RevisionId) {
  const a = lab().artifacts[artifactId];
  if (!a) return;
  const label = REVISION_OPTIONS.find((r) => r.id === revision)!.label;
  mutate((s) => {
    const t = s.tasks[a.taskId];
    push(t, { kind: 'user', text: `${label} — ${a.title}` });
    push(t, { kind: 'tool', text: `Revising ${a.title.toLowerCase()}`, state: 'running' });
    s.ui.busy[`revise:${artifactId}`] = true;
  });
  schedule(`revise:${artifactId}`, 1200, () => {
    mutate((s) => {
      const art = s.artifacts[artifactId];
      const t = s.tasks[art.taskId];
      const tool = [...t.transcript].reverse().find((i) => i.kind === 'tool' && i.state === 'running');
      if (tool && tool.kind === 'tool') tool.state = 'done';
      const next = revise(art.key, art.versions[art.current].content, revision);
      if (next === art.versions[art.current].content) {
        push(t, { kind: 'assistant', text: `I couldn't apply "${label.toLowerCase()}" to ${art.title.toLowerCase()} — it may already be in that form.` });
      } else {
        art.versions.push({ v: art.versions.length + 1, content: next, at: Date.now(), reason: `Revision: ${label.toLowerCase()}`, sources: art.versions[art.current].sources });
        art.current = art.versions.length - 1;
        push(t, { kind: 'assistant', text: `Updated **${art.title}** (version ${art.versions.length}). Compare it with the previous version in the preview.` });
        logEvent(s, 'artifact_revised', { artifactId, revision });
        syncEmailFromArtifact(s, art);
      }
      delete s.ui.busy[`revise:${artifactId}`];
    });
    announce('Revision ready.');
  });
}

/** Replace an input file (e.g. a superseded tracker) and mark affected outputs as stale. */
export function replaceTaskFile(taskId: string, fromId: string, toId: string) {
  mutate((s) => {
    const t = s.tasks[taskId];
    t.context.files = t.context.files.map((f) => (f === fromId ? toId : f));
    if (!t.context.files.includes(toId)) t.context.files.push(toId);
    (t.context.replacedFiles ??= []).push({ from: fromId, to: toId });
    let n = 0;
    for (const id of t.artifactIds) {
      const a = s.artifacts[id];
      if (a.key === 'summary') continue;
      if (a.versions[a.current].sources.includes(fromId)) { a.stale = true; n++; }
    }
    push(t, {
      kind: 'notice',
      tone: 'info',
      text: `Replaced **${getDoc(fromId)?.title}** with **${getDoc(toId)?.title}** in the Input folder. ${n ? `${n} output(s) used the old file — select **Regenerate affected outputs**.` : ''}`,
    });
  });
}

export function regenerateAffected(taskId: string) {
  mutate((s) => { s.ui.busy[`regen:${taskId}`] = true; push(s.tasks[taskId], { kind: 'tool', text: 'Regenerating affected outputs', state: 'running' }); });
  schedule(taskKey(taskId, 'regen'), 1500, () => {
    mutate((s) => {
      const t = s.tasks[taskId];
      const sc = scenarios[t.scenarioId];
      const tool = [...t.transcript].reverse().find((i) => i.kind === 'tool' && i.state === 'running');
      if (tool && tool.kind === 'tool') tool.state = 'done';
      const changed: string[] = [];
      for (const id of t.artifactIds) {
        const a = s.artifacts[id];
        if (!a.stale) continue;
        const content = sc.generate(a.key, t, {});
        a.versions.push({ v: a.versions.length + 1, content, at: Date.now(), reason: 'Regenerated with the replacement source', sources: [...t.context.files] });
        a.current = a.versions.length - 1;
        a.stale = false;
        changed.push(a.title);
      }
      // Update pending actions; approved-but-unsent actions need fresh approval.
      const byKey: Record<string, string> = {};
      t.artifactIds.forEach((id) => { byKey[s.artifacts[id].key] = id; });
      const fresh = sc.actions(t, byKey);
      const sentAlready: string[] = [];
      for (const id of t.actionIds) {
        const a = s.actions[id];
        if (a.state === 'cancelled') continue;
        if (a.state === 'done') { sentAlready.push(a.kind === 'email' ? 'email' : 'meeting'); continue; }
        cancel(`action:${id}:execute`);
        const wasApproved = a.state === 'queued' || !!a.approvedHash;
        if (a.kind === 'email' && fresh.email && a.email) {
          a.email = { ...a.email, subject: fresh.email.subject, body: fresh.email.body };
        }
        if (a.kind === 'meeting' && fresh.meeting && a.meeting) a.meeting = { ...a.meeting, agenda: fresh.meeting.agenda };
        if (a.state === 'queued' || a.state === 'failed') a.state = 'needs_approval';
        if (wasApproved) { a.changedAfterApproval = true; a.approvedHash = undefined; }
        a.history.push({ at: Date.now(), text: 'Updated with regenerated content. Approve the changed version.' });
      }
      push(t, {
        kind: 'assistant',
        text:
          `Regenerated ${changed.length ? changed.map((c) => `**${c}**`).join(', ') : 'nothing — no outputs were affected'} using the replacement source.` +
          (sentAlready.length ? `\n\n> The ${sentAlready.join(' and ')} already went out with the old details. Consider sending a short correction.` : ''),
      });
      logEvent(s, 'stale_corrected', { taskId, regenerated: changed.length });
      logEvent(s, 'error_recovered', { what: 'stale-source', taskId });
      delete s.ui.busy[`regen:${taskId}`];
      settleInline(s, taskId);
    });
    announce('Outputs regenerated. Review the updated versions.');
  });
}

// ───────────── refresh recovery ─────────────

/**
 * Called once after persisted state loads. Timers do not survive a refresh,
 * so running work is paused with an explanation, approved-but-unexecuted
 * actions return to "needs approval", and nothing is executed twice.
 */
export function recoverAfterReload() {
  mutate((s) => {
    for (const t of Object.values(s.tasks)) {
      t.thinking = false;
      for (const id of t.actionIds) {
        const a = s.actions[id];
        const executed = a.kind === 'email' ? s.mailbox.find((m) => m.actionId === id) : s.calendar.find((e) => e.actionId === id);
        if (executed && a.state !== 'done') {
          a.state = 'done';
          a.resultId = executed.id;
        } else if (a.state === 'queued' || a.state === 'executing') {
          a.state = 'needs_approval';
          a.approvedHash = undefined;
          a.history.push({ at: Date.now(), text: 'Not sent: the page was refreshed before this action ran. Approve again when ready.' });
        }
      }
      for (const i of t.transcript) if (i.kind === 'tool' && i.state === 'running') i.state = 'interrupted';
      if (t.status === 'working') {
        t.status = 'paused';
        t.pauseRequested = false;
        t.statusNote = 'Paused because the page was refreshed. Select Resume to continue from where it stopped.';
        push(t, { kind: 'notice', tone: 'info', text: 'The page was refreshed while Cowork was working. The task is paused — nothing was repeated. Select **Resume** to continue.' });
      } else if (t.status === 'needs_approval' || t.status === 'failed') {
        settleInline(s, t.id);
      }
    }
    for (const a of Object.values(s.agents)) {
      for (const k of a.knowledge) if (k.status === 'preparing') k.status = 'ready';
    }
  });
}
