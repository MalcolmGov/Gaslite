import type { LabState } from '../state/store';
import { mainAgent, mainTask } from './lessons';

/**
 * Evaluates demonstrated skills from recorded application events.
 * Feedback is specific to what the learner actually did.
 */

export type SkillStatus = 'done' | 'partial' | 'not-yet';

export interface SkillResult {
  id: string;
  label: string;
  status: SkillStatus;
  feedback: string;
  lessonId: string;
}

export function evaluateSkills(s: LabState): SkillResult[] {
  const has = (type: string, pred: (d: Record<string, unknown>) => boolean = () => true) =>
    s.events.some((e) => e.type === type && pred(e.data ?? {}));
  const agent = mainAgent(s);
  const task = mainTask(s);
  const ready = agent?.knowledge.filter((k) => k.status === 'ready').map((k) => k.docId) ?? [];
  const actions = task ? task.actionIds.map((id) => s.actions[id]) : [];
  const email = actions.find((a) => a.kind === 'email');
  const meeting = actions.find((a) => a.kind === 'meeting');
  const out: SkillResult[] = [];

  // 1. Purpose
  {
    const defined = has('purpose_defined');
    const clear = !!agent && agent.description.length > 30 && /you (support|help|assist)/i.test(agent.instructions);
    out.push({
      id: 'purpose',
      label: 'Defined a clear agent purpose',
      lessonId: 'create',
      status: defined && clear ? 'done' : defined ? 'partial' : 'not-yet',
      feedback:
        defined && clear
          ? `Your agent's description and instructions say who it supports and what it answers.`
          : defined
            ? `Your instructions don't say who the agent supports. Add a sentence such as "You support the AI and Automation programme team."`
            : `You haven't reviewed an agent configuration yet.`,
    });
  }

  // 2. Sources
  {
    const stale = ready.includes('doc_tracker35');
    const dup = ready.includes('doc_overview_copy');
    const current = ready.includes('doc_tracker38');
    const triedRestricted = has('source_denied', (d) => d.docId === 'doc_budget');
    out.push({
      id: 'sources',
      label: 'Chose appropriate sources',
      lessonId: 'create',
      status: current && !stale && !dup ? 'done' : current ? 'partial' : 'not-yet',
      feedback:
        !agent || !ready.length
          ? `Your agent has no ready knowledge sources yet.`
          : stale
            ? `Your agent still uses the superseded Week 35 tracker (28 Aug). Remove it so answers use the Week 38 data.`
            : dup
              ? `Your agent uses the downloaded copy of the programme overview from your OneDrive. Colleagues can't open it and it won't receive updates — use the SharePoint original.`
              : !current
                ? `Your agent doesn't use the current Weekly Delivery Tracker, so it can't report risks or milestones accurately.`
                : `You chose current, shared sources${triedRestricted ? ' and saw that a restricted Finance file cannot be added' : ''}.`,
    });
  }

  // 3–4. Tests
  const testRun = (c: string) => s.events.filter((e) => e.type === 'test_run' && e.data?.case === c);
  {
    const runs = testRun('A');
    out.push({
      id: 'test-answerable',
      label: 'Tested an answerable question',
      lessonId: 'test',
      status: runs.some((r) => r.data?.verdict === 'good') ? 'done' : runs.length ? 'partial' : 'not-yet',
      feedback: runs.some((r) => r.data?.verdict === 'good')
        ? `You tested the risks question and got a cited answer from current sources.`
        : runs.length
          ? `You tested the risks question, but the answer lacked citations or used an outdated source. Fix it and rerun.`
          : `Ask the agent "What are the main programme risks this week?" on the Try it tab.`,
    });
  }
  {
    const runs = testRun('B');
    out.push({
      id: 'test-missing',
      label: 'Tested missing information',
      lessonId: 'test',
      status: runs.some((r) => r.data?.verdict === 'good') ? 'done' : runs.length ? 'partial' : 'not-yet',
      feedback: runs.some((r) => r.data?.verdict === 'good')
        ? `You confirmed the agent admits when an answer isn't in its sources.`
        : runs.length
          ? `Your agent answered the budget question with a figure for the wrong year. Add "If the information is missing, say so. Do not invent budgets." and rerun.`
          : `Ask the agent about next year's approved budget to see how it handles missing information.`,
    });
  }

  // 5. Evidence
  {
    const agentCite = has('citation_opened');
    const viewedUpdate = has('artifact_viewed', (d) => d.key === 'update');
    const openedSource = has('artifact_source_opened');
    out.push({
      id: 'evidence',
      label: 'Reviewed evidence',
      lessonId: 'review',
      status: agentCite && openedSource ? 'done' : agentCite || openedSource ? 'partial' : 'not-yet',
      feedback:
        viewedUpdate && !openedSource
          ? `You reviewed the draft but did not open its supporting source. Check the source date before sharing the update.`
          : !agentCite
            ? `You haven't opened a citation in your agent's answers. Citations show the exact excerpt a claim relies on.`
            : openedSource
              ? `You checked citations in both the agent's answers and Cowork's draft.`
              : `You checked the agent's citations. Do the same for Cowork's outputs before approving anything.`,
    });
  }

  // 6. Sharing audience
  {
    const shared = s.events.filter((e) => e.type === 'agent_shared').pop();
    const groups = String(shared?.data?.groups ?? '');
    const editors = Number(shared?.data?.editors ?? 0);
    out.push({
      id: 'sharing',
      label: 'Selected an appropriate sharing audience',
      lessonId: 'share',
      status: !shared ? 'not-yet' : groups.includes('grp_cohort') && editors <= 1 ? 'done' : 'partial',
      feedback: !shared
        ? `You haven't shared your agent yet.`
        : groups.includes('grp_cohort')
          ? editors > 1
            ? `You shared with the cohort, but gave edit rights to ${editors} people. Most colleagues only need "Can chat".`
            : `You shared with the training cohort as chat users — a small, appropriate audience.`
          : `You shared the agent, but not with the training cohort. Share with the smallest group that needs it.`,
    });
  }

  // 7. Cowork objective
  {
    const o = s.events.filter((e) => e.type === 'objective_checked').pop()?.data;
    const complete = !!o && o.update && o.email && o.meeting;
    out.push({
      id: 'objective',
      label: 'Provided a clear Cowork objective',
      lessonId: 'cowork',
      status: !o ? 'not-yet' : complete && o.reviewFirst ? 'done' : 'partial',
      feedback: !o
        ? `You haven't delegated a task to Cowork yet.`
        : !complete
          ? `Your request didn't name all the outputs (update, email and meeting), so Cowork had to ask or leave something out.`
          : !o.reviewFirst
            ? `Your request named the outputs but didn't ask to review them before sending. Say so explicitly.`
            : `Your request named each output, supplied context, and asked to review before sending.`,
    });
  }

  // 8. Recipients and outputs
  {
    const recipients = has('recipients_checked');
    const viewedEmail = !!email?.viewed;
    out.push({
      id: 'recipients',
      label: 'Checked recipients and outputs',
      lessonId: 'review',
      status: recipients && viewedEmail ? 'done' : recipients || viewedEmail ? 'partial' : 'not-yet',
      feedback:
        recipients && viewedEmail
          ? `You chose the recipients deliberately and reviewed the email before acting on it.`
          : has('question_answered', (d) => d.questionId === 'recipients' && !!d.skipped)
            ? `You skipped the recipient question, so Cowork guessed. Check the To line on the email card before sending.`
            : `Open the email approval card and check the recipients before you send.`,
    });
  }

  // 9. Approvals
  {
    const approved = s.events.filter((e) => e.type === 'action_approved');
    const blind = approved.some((e) => !e.data?.viewed);
    const withConflict = approved.some((e) => e.data?.kind === 'meeting' && Number(e.data?.conflicts) > 0);
    const decided = !!email && ['done', 'cancelled'].includes(email.state) && (!meeting || ['done', 'cancelled'].includes(meeting.state));
    out.push({
      id: 'approval',
      label: 'Handled an approval correctly',
      lessonId: 'review',
      status: !approved.length && !has('action_cancelled') ? 'not-yet' : decided && !blind && !withConflict ? 'done' : 'partial',
      feedback: withConflict
        ? `You created the meeting while it still clashed with an attendee's calendar. Pick a free time before approving.`
        : blind
          ? `You approved an action without opening its details first. Read the preview before you approve.`
          : !decided
            ? `Some actions are still waiting for a decision. Approve or cancel each one.`
            : `You reviewed each action and decided explicitly — approving or cancelling each one.`,
    });
  }

  // 10. Recovery
  {
    const recovered = has('error_recovered');
    const failed = has('action_failed') || has('source_denied');
    out.push({
      id: 'recovery',
      label: 'Recovered from an error',
      lessonId: 'review',
      status: recovered ? 'done' : failed ? 'partial' : 'not-yet',
      feedback: recovered
        ? `You recovered from a problem — ${has('stale_corrected') ? 'replacing an outdated source and regenerating the outputs' : 'retrying without creating duplicates'}.`
        : failed
          ? `Something failed and hasn't been recovered yet. Read the error and use Retry, Replace or Cancel.`
          : `You haven't met an error yet. Your facilitator can trigger one.`,
    });
  }

  void task;
  return out;
}
