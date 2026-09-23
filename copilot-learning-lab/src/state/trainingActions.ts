import { settings } from '../config/settings';
import { composeDescription, composeInstructions, starterPrompts, STARTING_INSTRUCTION } from '../engine/builder';
import { answerAsAgent } from '../engine/packs';
import { copilotChatReply } from '../engine/copilotChat';
import { MAIN_PROMPT, scenarios } from '../engine/cowork/scenarios';
import type { Agent, ChatMessage } from '../engine/model';
import { cancelAll, runSynchronously, setSpeed, type Speed } from '../lib/scheduler';
import { newId } from '../lib/util';
import { lessons, allSteps } from '../training/lessons';
import { practiceById, practiceExercises, type PracticeId } from '../training/practice';
import { newAgent } from './agentActions';
import { acceptPlan, answerTaskQuestion, createReadyTask, recoverAfterReload, startTask } from './coworkActions';
import { announce, initialState, lab, logEvent, mutate, useLab, type Mode } from './store';
import { navigate } from './router';

// ───────────── session ─────────────

export function startSession(mode: Mode) {
  mutate((s) => {
    s.session.started = true;
    s.session.mode = mode;
    s.session.startedAt ??= Date.now();
    s.session.practiceId = undefined;
    s.facilitator.hideHints = false;
    if (!s.session.completedLessons.length && !s.session.completedSteps.length) s.session.lessonId = 'intro';
    s.ui.toolbarCollapsed = false;
  });
  goToCurrentStep();
}

export function setMode(mode: Mode) {
  mutate((s) => { s.session.mode = mode; if (mode !== 'facilitator' && s.ui.drawer === 'facilitator') s.ui.drawer = null; });
}

/** Navigate to where the current lesson's next step happens. */
export function goToCurrentStep() {
  const s = lab();
  const lesson = lessons.find((l) => l.id === s.session.lessonId) ?? lessons[0];
  const step = lesson.steps.find((st) => !s.session.completedSteps.includes(st.id)) ?? lesson.steps[lesson.steps.length - 1];
  const r = step.where?.(s);
  if (r) navigate(r);
}

export function setLesson(lessonId: string) {
  mutate((s) => { s.session.lessonId = lessonId; s.session.practiceId = undefined; s.ui.hintOpen = false; });
  goToCurrentStep();
}

/** Record newly completed steps and lessons. Called on every state change. */
export function syncProgress() {
  const s = lab();
  if (!s.session.started) return;
  const newly = allSteps.filter((st) => !s.session.completedSteps.includes(st.id) && safe(() => st.done(s)));
  if (!newly.length) return;
  let finished: string | undefined;
  mutate((d) => {
    for (const st of newly) d.session.completedSteps.push(st.id);
    for (const l of lessons) {
      if (!d.session.completedLessons.includes(l.id) && l.steps.filter((x) => !x.optional).every((x) => d.session.completedSteps.includes(x.id))) {
        d.session.completedLessons.push(l.id);
        if (l.id === d.session.lessonId) finished = l.id;
      }
    }
    d.ui.hintOpen = false;
    // Move straight on to the next lesson; the last lesson waits for the learner.
    const i = lessons.findIndex((l) => l.id === finished);
    if (finished && i >= 0 && i < lessons.length - 1 && !d.session.practiceId) d.session.lessonId = lessons[i + 1].id;
  });
  if (finished) announce(`Lesson complete: ${lessons.find((l) => l.id === finished)?.title}.`);
}

const safe = (fn: () => boolean) => { try { return fn(); } catch { return false; } };

export function nextLesson() {
  const s = lab();
  const i = lessons.findIndex((l) => l.id === s.session.lessonId);
  const next = lessons[i + 1];
  if (next) setLesson(next.id);
  else navigate({ name: 'complete' });
}

export function exitLesson() {
  mutate((s) => { s.ui.drawer = null; s.ui.hintOpen = false; });
  navigate({ name: 'welcome' });
}

// ───────────── facilitator ─────────────

export function setFacilitator<K extends keyof ReturnType<typeof lab>['facilitator']>(key: K, value: ReturnType<typeof lab>['facilitator'][K]) {
  mutate((s) => { (s.facilitator as unknown as Record<string, unknown>)[key] = value; });
  if (key === 'speed') setSpeed(value as Speed);
}

export function armFailure(kind: 'connectorOnce' | 'missingSource', on: boolean) {
  mutate((s) => {
    s.facilitator.failures[kind] = on;
    if (kind === 'connectorOnce') s.facilitator.consumed.connector = false;
    else s.facilitator.consumed.missingSource = false;
  });
}

// ───────────── known starting states ─────────────

function recommendedAgent(): Agent {
  const answers = {
    audience: 'the AI and Automation programme team',
    include: 'cite,separate,delivery,training',
    gaps: 'admit',
    knowledge: 'programme documents',
  };
  const a = newAgent({
    name: 'AI Programme Knowledge Agent',
    description: composeDescription(answers.audience),
    instructions: composeInstructions(answers),
    starterPrompts: starterPrompts(),
    knowledge: ['doc_overview', 'doc_tracker38', 'doc_register', 'doc_governance', 'doc_steering'].map((docId) => ({ docId, status: 'ready' as const, addedAt: Date.now() })),
  });
  a.builder = {
    stage: 'done',
    question: 4,
    answers,
    messages: [
      { id: newId('msg'), role: 'user', text: STARTING_INSTRUCTION, at: Date.now() },
      { id: newId('msg'), role: 'builder', text: 'Your agent is set up. Review it on the **Configure** tab, then test it on **Try it**. (Loaded by the facilitator as a known starting state.)', at: Date.now(), builderAction: 'go-configure' },
    ],
  };
  return a;
}

const lessonIndex = (id: string) => lessons.findIndex((l) => l.id === id);

/** Reset product data and build the known starting state for a lesson. */
export function loadLessonState(lessonId: string) {
  cancelAll();
  const keep = lab();
  const idx = lessonIndex(lessonId);
  const priorSteps = lessons.slice(0, idx).flatMap((l) => l.steps.map((st) => st.id));
  useLab.setState(() => ({
    ...initialState(),
    session: {
      ...keep.session,
      started: true,
      lessonId,
      completedSteps: priorSteps,
      completedLessons: lessons.slice(0, idx).map((l) => l.id),
      mainAgentId: undefined,
      mainTaskId: undefined,
      practiceId: undefined,
    },
    facilitator: { ...keep.facilitator, consumed: {} },
    ui: { ...keep.ui, drawer: keep.ui.drawer, citation: null, busy: {}, pickerOpen: null },
  }));

  if (idx <= 0) return goToCurrentStep();
  if (lessonId === 'create') {
    mutate((s) => { s.events.push({ id: newId('evt'), type: 'chat_asked', at: Date.now() }); });
    return navigate({ name: 'chat' });
  }

  const agent = recommendedAgent();
  if (idx >= lessonIndex('share')) {
    mutate((s) => { logEvent(s, 'purpose_defined', { agentId: agent.id, via: 'configure' }); });
  }
  if (idx >= lessonIndex('engage')) {
    agent.status = 'created';
    agent.createdAt = Date.now();
    agent.sharing = { entries: [{ principalId: 'grp_cohort', kind: 'group', role: 'chat' }], sharedAt: Date.now() };
  }
  let briefing: ChatMessage | undefined;
  if (idx >= lessonIndex('cowork')) {
    const q: ChatMessage = { id: newId('msg'), role: 'user', text: 'Prepare a short leadership briefing.', at: Date.now() };
    briefing = answerAsAgent(agent, q.text, []);
    agent.chat = [q, briefing];
  }
  mutate((s) => {
    s.agents[agent.id] = agent;
    s.agentOrder.unshift(agent.id);
    s.session.mainAgentId = agent.id;
  });

  if (lessonId === 'test' || lessonId === 'share') {
    return navigate({ name: 'builder', agentId: agent.id, tab: lessonId === 'test' ? 'configure' : 'try' });
  }
  if (lessonId === 'engage') return navigate({ name: 'agent', agentId: agent.id });

  const taskId = createReadyTask('main', MAIN_PROMPT, ['doc_tracker35'], { text: briefing!.text, agentName: agent.name, at: Date.now() });
  if (lessonId === 'review') {
    runSynchronously(() => {
      startTask(taskId, MAIN_PROMPT, ['doc_tracker35']);
      acceptPlan(taskId);
      answerTaskQuestion(taskId, 'recipients', 'plg', 'Programme Leadership Group');
      answerTaskQuestion(taskId, 'slot', 'thu10', 'Thu 24 Sep, 10:00–10:30 SAST');
    });
    mutate((s) => {
      const t = s.tasks[taskId];
      const upd = t.artifactIds.map((id) => s.artifacts[id]).find((a) => a.key === 'update');
      if (upd) upd.viewed = true;
    });
  }
  navigate({ name: 'task', taskId });
  answerTaskPending();
}

export function restartExercise() {
  const s = lab();
  if (s.session.practiceId) return startPractice(s.session.practiceId as PracticeId);
  loadLessonState(s.session.lessonId);
}

export function resetAll() {
  cancelAll();
  try { window.localStorage.removeItem(settings.storageKey); } catch { /* storage unavailable */ }
  useLab.setState(() => initialState());
  setSpeed('fast');
  navigate({ name: 'welcome' });
}

// ───────────── practice ─────────────

export function startPractice(id: PracticeId) {
  const p = practiceById(id);
  if (!p) return;
  cancelAll();
  mutate((s) => {
    s.session.started = true;
    s.session.practiceId = id;
    s.ui.drawer = null;
  });
  if (p.agent) {
    const t = p.agent;
    let agent = Object.values(lab().agents).find((a) => a.packId === t.packId);
    if (!agent) {
      agent = newAgent({
        packId: t.packId,
        name: t.name,
        description: t.description,
        instructions: t.instructions,
        knowledge: [{ docId: t.docId, status: 'ready', addedAt: Date.now() }],
        starterPrompts: t.starterPrompts.map((sp) => ({ id: newId('sp'), ...sp })),
        status: 'created',
        createdAt: Date.now(),
        prebuilt: true,
        owner: t.owner,
        sharing: { entries: [{ principalId: 'grp_cohort', kind: 'group', role: 'chat' }], sharedAt: Date.now() },
      });
      const a = agent;
      mutate((s) => { s.agents[a.id] = a; s.agentOrder.push(a.id); });
    } else {
      const a = agent;
      mutate((s) => { s.agents[a.id].chat = []; });
    }
    return navigate({ name: 'agent', agentId: agent.id });
  }
  const sc = scenarios[p.scenario!];
  const taskId = createReadyTask(sc.id, sc.defaultPrompt, sc.defaultFiles);
  navigate({ name: 'task', taskId });
}

export function completePractice(id: string) {
  mutate((s) => {
    if (!s.session.completedPractice.includes(id)) s.session.completedPractice.push(id);
    logEvent(s, 'practice_completed', { id });
    s.session.practiceId = undefined;
  });
  navigate({ name: 'practice' });
}

export const practiceList = practiceExercises;

// ───────────── startup ─────────────

/** After a refresh, answer any question whose reply was still pending. */
function answerTaskPending() {
  const s = lab();
  for (const a of Object.values(s.agents)) {
    for (const conv of ['testChat', 'chat'] as const) {
      const list = a[conv];
      const last = list[list.length - 1];
      if (last?.role === 'user') {
        const reply = answerAsAgent(a, last.text, list);
        mutate((d) => { d.agents[a.id][conv].push(reply); });
      }
    }
  }
  const chat = s.copilotChat.messages;
  if (chat[chat.length - 1]?.role === 'user') {
    mutate((d) => { d.copilotChat.messages.push({ id: newId('msg'), role: 'assistant', text: copilotChatReply(chat[chat.length - 1].text, s.copilotChat.attached), at: Date.now() }); });
  }
}

export function onAppLoad() {
  setSpeed(lab().facilitator.speed);
  recoverAfterReload();
  answerTaskPending();
}
