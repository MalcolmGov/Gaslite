import type { LabState } from '../state/store';

/**
 * Additional practice exercises. Each reuses the same product components
 * with its own synthetic data and expected results.
 */

export interface PracticeCheck {
  label: string;
  done: (s: LabState) => boolean;
}

export interface PracticeExercise {
  id: 'meeting' | 'policy' | 'delivery';
  title: string;
  surface: 'Cowork' | 'Agent';
  minutes: number;
  objective: string;
  brief: string;
  expected: string[];
  checks: PracticeCheck[];
}

const taskFor = (s: LabState, scenario: string) => s.taskOrder.map((id) => s.tasks[id]).find((t) => t.scenarioId === scenario && t.status !== 'ready');
const artOf = (s: LabState, scenario: string, key: string) => {
  const t = taskFor(s, scenario);
  return t?.artifactIds.map((id) => s.artifacts[id]).find((a) => a.key === key);
};
const policyAgent = (s: LabState) => Object.values(s.agents).find((a) => a.packId === 'policy');

export const practiceExercises: PracticeExercise[] = [
  {
    id: 'meeting',
    title: 'Meeting preparation',
    surface: 'Cowork',
    minutes: 3,
    objective: 'Review the working group notes, identify unresolved decisions and prepare a 30-minute agenda.',
    brief:
      "Pieter Botha chairs Thursday's Operations Automation Working Group follow-up. Ask Cowork to prepare the agenda from the notes attached to the task. Check it before you use it.",
    expected: [
      'The agenda lists two open decisions: refund preparation under R5,000 and the call-centre extension.',
      'Dashboard ownership is NOT on the agenda — it was agreed in the 17 Sep addendum.',
      'Actions due from Kwame and Aisha are reviewed.',
      'If you asked for an invitation, you approved or cancelled it deliberately.',
    ],
    checks: [
      { label: 'Delegated the task to Cowork', done: (s) => !!taskFor(s, 'meeting') },
      { label: 'Opened the agenda', done: (s) => !!artOf(s, 'meeting', 'agenda')?.viewed },
      { label: 'Checked a source in the agenda (e.g. the addendum)', done: (s) => s.events.some((e) => e.type === 'artifact_source_opened' && e.data?.scenario === 'meeting') },
      { label: 'Task completed', done: (s) => taskFor(s, 'meeting')?.status === 'completed' },
    ],
  },
  {
    id: 'policy',
    title: 'Policy knowledge',
    surface: 'Agent',
    minutes: 3,
    objective: 'Answer employee questions from a fictional policy with citations and honest handling of missing information.',
    brief:
      'Use the "Workplace Policy Helper" agent, built on the Hybrid Work and Travel Policy v4.2 (training sample). Ask at least one answerable question and one the policy cannot answer.',
    expected: [
      '"How many days must I be in the office?" → at least two days per week, cited to section 2.',
      '"Can I claim for home internet?" → No, cited to section 3.',
      '"What is the per diem for a trip to Lagos?" → not in the policy; points to the Finance allowance schedule.',
    ],
    checks: [
      { label: 'Asked an answerable policy question', done: (s) => !!policyAgent(s)?.chat.some((m) => m.testCase === 'A') },
      { label: 'Opened a citation', done: (s) => s.events.some((e) => e.type === 'citation_opened' && e.data?.pack === 'policy') },
      { label: 'Asked a question the policy cannot answer', done: (s) => !!policyAgent(s)?.chat.some((m) => m.intent === 'policy-gap') },
    ],
  },
  {
    id: 'delivery',
    title: 'Project delivery',
    surface: 'Cowork',
    minutes: 3,
    objective: 'Summarise a delivery tracker, identify overdue work and draft an escalation message for review.',
    brief:
      'The Payments Platform Upgrade tracker is attached. Ask Cowork to find overdue work and draft an escalation to the sponsor. Review before anything is sent.',
    expected: [
      'Three overdue items: P-101 (load test), P-103 (security review) and P-104 (migration dry run).',
      'P-106 is past its date but Done — it must not be listed.',
      'The escalation goes to Pieter Botha (sponsor), copying Johan van Wyk.',
      'The email is only sent after you open and review it.',
    ],
    checks: [
      { label: 'Delegated the task to Cowork', done: (s) => !!taskFor(s, 'delivery') },
      { label: 'Opened the overdue summary', done: (s) => !!artOf(s, 'delivery', 'overdue')?.viewed },
      {
        label: 'Reviewed the escalation email before deciding',
        done: (s) => {
          const t = taskFor(s, 'delivery');
          const a = t?.actionIds.map((id) => s.actions[id])[0];
          return !!a?.viewed && (a.state === 'done' || a.state === 'cancelled');
        },
      },
    ],
  },
];

export const practiceById = (id: string) => practiceExercises.find((p) => p.id === id);
