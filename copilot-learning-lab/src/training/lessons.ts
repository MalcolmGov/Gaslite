import type { LabState, Route } from '../state/store';
import type { Agent, LearningEventType, Task } from '../engine/model';

/**
 * Lesson catalogue for the main journey.
 *
 * Every step's completion is a predicate over real application state and
 * learning events — nothing is ticked off by pressing "Next".
 * `target` is a data-tour attribute value used by the spotlight.
 */

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  target?: string;
  done: (s: LabState) => boolean;
  /** Where the learner needs to be for this step. */
  where?: (s: LabState) => Route | null;
  optional?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  objectives: string[];
  practiceObjective: string;
  speakerNotes: string[];
  steps: LessonStep[];
}

// ───────────── helpers ─────────────

export const mainAgent = (s: LabState): Agent | undefined => (s.session.mainAgentId ? s.agents[s.session.mainAgentId] : undefined);
export const mainTask = (s: LabState): Task | undefined => (s.session.mainTaskId ? s.tasks[s.session.mainTaskId] : undefined);

const ev = (s: LabState, type: LearningEventType, pred: (d: Record<string, unknown>) => boolean = () => true) =>
  s.events.some((e) => e.type === type && pred(e.data ?? {}));
const evCount = (s: LabState, type: LearningEventType, pred: (d: Record<string, unknown>) => boolean = () => true) =>
  s.events.filter((e) => e.type === type && pred(e.data ?? {})).length;

const agentRoute = (tab: 'describe' | 'configure' | 'try') => (s: LabState): Route | null => {
  const a = mainAgent(s);
  return a ? { name: 'builder', agentId: a.id, tab } : null;
};

const taskArtifact = (s: LabState, key: string) => {
  const t = mainTask(s);
  return t?.artifactIds.map((id) => s.artifacts[id]).find((a) => a?.key === key);
};
const taskAction = (s: LabState, kind: 'email' | 'meeting') => {
  const t = mainTask(s);
  return t?.actionIds.map((id) => s.actions[id]).find((a) => a?.kind === kind);
};

// ───────────── lessons ─────────────

export const lessons: Lesson[] = [
  {
    id: 'intro',
    title: 'Chat, agents and Cowork',
    minutes: 5,
    objectives: [
      'Tell the difference between Copilot Chat, an agent and Cowork.',
      'Know when Copilot Studio is the right tool instead.',
    ],
    practiceObjective: 'Ask Copilot Chat how agents and Cowork differ, then start a new agent.',
    speakerNotes: [
      'Chat is for ad hoc questions and drafting; you bring the context each time.',
      'Agents package instructions and approved knowledge so the team gets consistent, sourced answers.',
      'Cowork carries out multi-step work and asks before it sends or schedules anything.',
      'Copilot Studio is for advanced agents: actions, external systems, automated flows. We only explain it today.',
    ],
    steps: [
      {
        id: 'intro-ask',
        title: 'Ask Copilot Chat a question',
        instruction: 'In Copilot Chat, ask: "What\'s the difference between an agent and Cowork?"',
        hint: 'Select the suggestion under the message box, or type your own question and press Enter.',
        target: 'chat-composer',
        done: (s) => ev(s, 'chat_asked'),
        where: () => ({ name: 'chat' }),
      },
      {
        id: 'intro-new-agent',
        title: 'Start a new agent',
        instruction: 'Select New agent in the left navigation to open Agent Builder.',
        hint: 'New agent is under Agents in the navigation pane.',
        target: 'nav-new-agent',
        done: (s) => ev(s, 'builder_started'),
        where: () => ({ name: 'chat' }),
      },
    ],
  },
  {
    id: 'create',
    title: 'Create your agent',
    minutes: 7,
    objectives: [
      'Describe an agent in natural language and answer clarifying questions.',
      'Choose appropriate knowledge sources and notice outdated, duplicate and restricted files.',
      'Review the generated name, description, instructions and suggested prompts.',
    ],
    practiceObjective: 'Create an AI Programme Knowledge Agent that answers from approved, current programme documents.',
    speakerNotes: [
      'Point out that the description and instructions update as the learner answers each question.',
      'In the file picker, two files are both called "Weekly Delivery Tracker.xlsx". Ask the room which one to use and why.',
      'Encourage someone to try the restricted Finance file: access is denied, and sharing the agent would not change that.',
    ],
    steps: [
      {
        id: 'create-describe',
        title: 'Describe the agent',
        instruction: 'Describe the agent you want in the message box and send it.',
        hint: 'Use the suggested description: "Create an AI Programme Knowledge Agent that helps our team understand programme progress, milestones, risks and training activity using approved programme documents."',
        target: 'builder-composer',
        done: (s) => { const a = mainAgent(s); return !!a && a.builder.stage !== 'intro'; },
        where: agentRoute('describe'),
      },
      {
        id: 'create-audience',
        title: 'Say who will use it',
        instruction: 'Answer Agent Builder\'s first question: who will use this agent?',
        hint: 'The agent is for the AI and Automation programme team.',
        target: 'builder-replies',
        done: (s) => !!mainAgent(s)?.builder.answers.audience || (mainAgent(s)?.builder.stage === 'skipped'),
        where: agentRoute('describe'),
      },
      {
        id: 'create-knowledge',
        title: 'Choose knowledge sources',
        instruction: 'Add the current programme documents as knowledge. Check dates, versions and access before you add a file.',
        hint: 'Good choices: AI Programme Overview, Weekly Delivery Tracker (Week 38, 18 Sep), Training Attendance Register, Programme Governance Guide and the steering notes. Avoid the Week 35 archive copy and the duplicate in your Downloads.',
        target: 'knowledge-picker',
        done: (s) => {
          const a = mainAgent(s);
          if (!a) return false;
          const ready = a.knowledge.filter((k) => k.status === 'ready').map((k) => k.docId);
          return ready.includes('doc_tracker38') && ready.length >= 3;
        },
        where: agentRoute('describe'),
      },
      {
        id: 'create-include',
        title: 'Decide what answers include',
        instruction: 'Choose what the agent\'s answers should include, then submit.',
        hint: 'Citations and separating confirmed facts from assumptions make answers easier to check.',
        target: 'builder-replies',
        done: (s) => !!mainAgent(s)?.builder.answers.include || mainAgent(s)?.builder.stage === 'skipped',
        where: agentRoute('describe'),
      },
      {
        id: 'create-gaps',
        title: 'Handle missing information',
        instruction: 'Tell Agent Builder what the agent should do when information is unavailable.',
        hint: 'Saying information is missing, and suggesting who to ask, is safer than estimating.',
        target: 'builder-replies',
        done: (s) => !!mainAgent(s)?.builder.answers.gaps || mainAgent(s)?.builder.stage === 'skipped',
        where: agentRoute('describe'),
      },
      {
        id: 'create-review',
        title: 'Review the configuration',
        instruction: 'Open the Configure tab and review the name, description, instructions, knowledge and suggested prompts.',
        hint: 'Configure is in the tab switcher at the top of Agent Builder.',
        target: 'tab-configure',
        done: (s) => ev(s, 'purpose_defined', (d) => d.via === 'configure'),
        where: agentRoute('configure'),
      },
    ],
  },
  {
    id: 'test',
    title: 'Test your agent',
    minutes: 5,
    objectives: [
      'Test an answerable question and check its citations.',
      'Test a question the sources cannot answer.',
      'Test conflicting sources, then improve the instructions and compare.',
    ],
    practiceObjective: 'Prove the agent answers accurately, admits gaps and handles conflicting dates. Improve its instructions if it doesn\'t.',
    speakerNotes: [
      'Test B has no answer in any accessible document — that is deliberate. A good agent says so.',
      'Test C: the overview (4 Aug) says 31 Oct; the register (19 Sep) says 14 Nov. Watch whether the agent merges them.',
      'Try removing the "Separate confirmed information…" sentence and rerun C to show how instructions steer behaviour.',
    ],
    steps: [
      {
        id: 'test-open',
        title: 'Open Try it',
        instruction: 'Switch to the Try it tab.',
        hint: 'Try it is next to Configure at the top.',
        target: 'tab-try',
        done: (s) => s.route.name === 'builder' && s.route.tab === 'try' || ev(s, 'test_run'),
        where: agentRoute('configure'),
      },
      {
        id: 'test-a',
        title: 'Test A — an answerable question',
        instruction: 'Ask: "What are the main programme risks this week?"',
        hint: 'Select test A in the test checklist, or type the question.',
        target: 'test-cases',
        done: (s) => ev(s, 'test_run', (d) => d.case === 'A' && d.conv === 'try'),
        where: agentRoute('try'),
      },
      {
        id: 'test-cite',
        title: 'Check the evidence',
        instruction: 'Select a citation number in the answer to open the supporting excerpt.',
        hint: 'Citations appear as small numbers after a claim.',
        target: 'citation',
        done: (s) => ev(s, 'citation_opened'),
        where: agentRoute('try'),
      },
      {
        id: 'test-b',
        title: 'Test B — missing information',
        instruction: 'Ask: "What budget has leadership approved for next year?"',
        hint: 'None of the documents you can use contain this. A good answer says so and suggests a next step.',
        target: 'test-cases',
        done: (s) => ev(s, 'test_run', (d) => d.case === 'B' && d.conv === 'try'),
        where: agentRoute('try'),
      },
      {
        id: 'test-c',
        title: 'Test C — conflicting sources',
        instruction: 'Ask: "What is the training completion date?"',
        hint: 'Two documents give different dates. Check whether the agent explains which is newer.',
        target: 'test-cases',
        done: (s) => ev(s, 'test_run', (d) => d.case === 'C' && d.conv === 'try'),
        where: agentRoute('try'),
      },
      {
        id: 'test-improve',
        title: 'Improve and rerun',
        instruction: 'Edit the instructions on Configure, then rerun a test and compare the answers.',
        hint: 'For example, add "Keep answers concise." or remove the citation sentence, then use Rerun on a test answer.',
        target: 'instructions-field',
        done: (s) => {
          const firstVersion = s.events.find((e) => e.type === 'test_run')?.data?.version as number | undefined;
          return firstVersion !== undefined && ev(s, 'test_run', (d) => (d.version as number) > firstVersion);
        },
        where: agentRoute('configure'),
      },
    ],
  },
  {
    id: 'share',
    title: 'Create and share',
    minutes: 3,
    objectives: [
      'Create the agent and understand it starts private.',
      'Share it with a training group and understand that source permissions still apply.',
    ],
    practiceObjective: 'Create the agent and share it with your training cohort only.',
    speakerNotes: [
      'Sharing grants access to the agent, not to its knowledge. People without access to a file get no answers from it.',
      'Org-wide sharing depends on tenant policy and admin controls — it is disabled in this lab.',
    ],
    steps: [
      {
        id: 'share-create',
        title: 'Create the agent',
        instruction: 'Select Create in the top right of Agent Builder.',
        hint: 'Create is enabled once the agent has a name, description and instructions.',
        target: 'create-button',
        done: (s) => mainAgent(s)?.status === 'created',
        where: agentRoute('try'),
      },
      {
        id: 'share-share',
        title: 'Share with your cohort',
        instruction: 'Select Share and add the "AI Training Cohort — Wave 2" group. Review the knowledge sources before sharing.',
        hint: 'Groups can only be added with "Can chat" access.',
        target: 'share-button',
        done: (s) => !!mainAgent(s)?.sharing.sharedAt,
        where: agentRoute('try'),
      },
      {
        id: 'share-open',
        title: 'Open the agent',
        instruction: 'Select Open agent to start using it.',
        hint: 'You can also find it under Agents in the navigation pane.',
        target: 'open-agent',
        done: (s) => ev(s, 'agent_opened'),
        where: agentRoute('try'),
      },
    ],
  },
  {
    id: 'engage',
    title: 'Use your agent',
    minutes: 4,
    objectives: ['Ask the agent for a briefing and refine it with follow-up requests.', 'Carry a reviewed briefing into Cowork.'],
    practiceObjective: 'Get a leadership-ready briefing from your agent, check a source, and carry the briefing into Cowork.',
    speakerNotes: [
      'Follow-ups keep the same instructions and sources — that\'s the value of an agent over a one-off chat.',
      'The Cowork handoff is a training step: we copy the briefing into a new task. It is not a native agent-to-Cowork integration.',
    ],
    steps: [
      {
        id: 'engage-brief',
        title: 'Ask for a briefing',
        instruction: 'Select the suggested prompt "Prepare a short leadership briefing."',
        hint: 'Suggested prompts appear above the message box.',
        target: 'agent-starters',
        done: (s) => ev(s, 'agent_followup', (d) => !!d.briefing),
        where: (s) => (mainAgent(s) ? { name: 'agent', agentId: mainAgent(s)!.id } : null),
      },
      {
        id: 'engage-followup',
        title: 'Refine it',
        instruction: 'Ask two follow-ups, for example "Show the source for this risk." and "Turn this into a leadership-ready summary."',
        hint: 'Follow-up suggestions appear under the latest answer.',
        target: 'agent-followups',
        done: (s) => evCount(s, 'agent_followup') >= 3,
        where: (s) => (mainAgent(s) ? { name: 'agent', agentId: mainAgent(s)!.id } : null),
      },
      {
        id: 'engage-handoff',
        title: 'Carry the briefing into Cowork',
        instruction: 'On the briefing you want to use, select "Use this briefing in the Cowork exercise".',
        hint: 'This training button copies the reviewed briefing into a new Cowork task.',
        target: 'handoff',
        done: (s) => ev(s, 'handoff'),
        where: (s) => (mainAgent(s) ? { name: 'agent', agentId: mainAgent(s)!.id } : null),
      },
    ],
  },
  {
    id: 'cowork',
    title: 'Delegate with Cowork',
    minutes: 7,
    objectives: ['Give Cowork a clear objective with context.', 'Answer its clarifying questions.', 'Follow progress and open the outputs.'],
    practiceObjective: 'Delegate the weekly update to Cowork and get reviewable drafts.',
    speakerNotes: [
      'Point out the attached tracker chip — it says Week 35, 28 Aug. Does anyone notice before sending?',
      'The plan card is a training aid. Cowork shows progress as skill and tool steps.',
      '"Programme leadership group" matches two lists — that\'s why Cowork asks.',
    ],
    steps: [
      {
        id: 'cowork-send',
        title: 'Check the context and send',
        instruction: 'Review the task and its attached context, then send it.',
        hint: 'Look at the file chips. You can remove or replace a file before sending.',
        target: 'cowork-composer',
        done: (s) => ev(s, 'task_started', (d) => d.scenario === 'main'),
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : { name: 'cowork' }),
      },
      {
        id: 'cowork-plan',
        title: 'Review the plan',
        instruction: 'Read the proposed plan and continue.',
        hint: 'Approving the plan is not the same as approving an email or meeting.',
        target: 'plan-card',
        done: (s) => ev(s, 'plan_accepted'),
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'cowork-questions',
        title: 'Answer Cowork\'s questions',
        instruction: 'Choose who receives the email and when the follow-up should happen.',
        hint: 'Use the arrow keys and Space to choose, then Submit. Skip is available but means Cowork guesses.',
        target: 'question-card',
        done: (s) => evCount(s, 'question_answered', (d) => d.taskId === s.session.mainTaskId) >= 2,
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'cowork-open',
        title: 'Open the leadership update',
        instruction: 'When the drafts are ready, open the leadership update from the Output folder.',
        hint: 'Outputs appear in the chat and in the side panel.',
        target: 'output-update',
        done: (s) => !!taskArtifact(s, 'update')?.viewed,
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
    ],
  },
  {
    id: 'review',
    title: 'Review and approve',
    minutes: 8,
    objectives: [
      'Check outputs against their sources and fix a stale source.',
      'Review and approve (or reject) each outbound action.',
      'Recover from a failed action without creating duplicates.',
    ],
    practiceObjective: 'Send an accurate update and create a conflict-free meeting — only after checking sources, recipients and times.',
    speakerNotes: [
      'The update shows the pilot "on track for 25 Sep". The briefing says 9 Oct. Open the citation: the source is dated 28 Aug and superseded.',
      'The first send fails on purpose (simulated connector timeout). Retry does not duplicate the email.',
      'Thursday 10:00 clashes with the Programme Director\'s Exco preparation.',
    ],
    steps: [
      {
        id: 'review-source',
        title: 'Check a milestone\'s source',
        instruction: 'In the leadership update, select the citation next to the milestones and check the source date.',
        hint: 'Compare the pilot go-live date with your briefing.',
        target: 'artifact-preview',
        done: (s) => ev(s, 'artifact_source_opened'),
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'review-stale',
        title: 'Fix the outdated source',
        instruction: 'Replace the Week 35 tracker with the current one in the Input folder, then regenerate the affected outputs.',
        hint: 'The Input folder is in the side panel. Use Replace, then Regenerate affected outputs.',
        target: 'input-folder',
        done: (s) => ev(s, 'stale_corrected') || !mainTask(s)?.context.files.includes('doc_tracker35') && !!mainTask(s)?.artifactIds.length,
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'review-email',
        title: 'Review and send the email',
        instruction: 'Check the email\'s recipients, content and attachments, then select Send.',
        hint: 'Use Edit to change recipients or wording. You can undo for a few seconds after Send.',
        target: 'approval-email',
        done: (s) => { const a = taskAction(s, 'email'); return !!a && (a.state === 'done' || a.state === 'cancelled' || a.state === 'failed'); },
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'review-recover',
        title: 'Recover from the failure',
        instruction: 'If the send fails, read the error and select Retry. Check that only one email is sent.',
        hint: 'Retry reuses your approved content. It never sends twice.',
        target: 'approval-email',
        done: (s) => { const a = taskAction(s, 'email'); return !!a && (a.state === 'done' || a.state === 'cancelled'); },
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'review-meeting',
        title: 'Resolve the conflict and create the meeting',
        instruction: 'Check the meeting for conflicts, change the time if needed, then Create — or Cancel it.',
        hint: 'Use the suggested free time, or Edit the start and end time.',
        target: 'approval-meeting',
        done: (s) => { const a = taskAction(s, 'meeting'); return !!a && (a.state === 'done' || a.state === 'cancelled'); },
        where: (s) => (mainTask(s) ? { name: 'task', taskId: mainTask(s)!.id } : null),
      },
      {
        id: 'review-sent',
        title: 'Check the results',
        instruction: 'Open Sent items and calendar to confirm what actually happened.',
        hint: 'The simulated mailbox is under "Sent items & calendar" in the navigation.',
        target: 'nav-mail',
        done: (s) => s.route.name === 'mail' || ev(s, 'download'),
        where: () => ({ name: 'mail', tab: 'sent' }),
      },
    ],
  },
];

export const lessonById = (id: string) => lessons.find((l) => l.id === id);
export const allSteps = lessons.flatMap((l) => l.steps.map((st) => ({ ...st, lessonId: l.id })));
