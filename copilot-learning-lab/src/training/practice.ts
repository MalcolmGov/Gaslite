import type { PackId, ScenarioId, StarterPrompt } from '../engine/model';
import type { LabState } from '../state/store';

/**
 * Additional practice exercises. Each reuses the same product components
 * with its own synthetic data and expected results.
 */

export interface PracticeCheck {
  label: string;
  done: (s: LabState) => boolean;
}

export type PracticeId = 'meeting' | 'policy' | 'delivery' | 'procedures' | 'compliance' | 'onboarding' | 'actions' | 'status' | 'triage';

/** Template for a pre-built practice agent. */
export interface PracticeAgent {
  packId: PackId;
  name: string;
  description: string;
  instructions: string;
  docId: string;
  owner: string;
  starterPrompts: Omit<StarterPrompt, 'id'>[];
}

export interface PracticeExercise {
  id: PracticeId;
  /** "core" teaches the basic skills; "workplace" models agents teams can build for real work. */
  group: 'core' | 'workplace';
  title: string;
  surface: 'Cowork' | 'Agent';
  minutes: number;
  objective: string;
  brief: string;
  expected: string[];
  checks: PracticeCheck[];
  /** Agent exercises: the pre-built agent to open. */
  agent?: PracticeAgent;
  /** Cowork exercises: the scenario to start. */
  scenario?: ScenarioId;
  /** Workplace exercises: what building this agent for real would involve. */
  buildTip?: string;
}

const taskFor = (s: LabState, scenario: string) => s.taskOrder.map((id) => s.tasks[id]).find((t) => t.scenarioId === scenario && t.status !== 'ready');
const artOf = (s: LabState, scenario: string, key: string) => {
  const t = taskFor(s, scenario);
  return t?.artifactIds.map((id) => s.artifacts[id]).find((a) => a.key === key);
};
const agentFor = (s: LabState, pack: PackId) => Object.values(s.agents).find((a) => a.packId === pack);
const policyAgent = (s: LabState) => agentFor(s, 'policy');

/** Standard checks for a single-source practice agent. */
const agentChecks = (pack: PackId): PracticeCheck[] => [
  { label: 'Asked a question the source answers', done: (s) => !!agentFor(s, pack)?.chat.some((m) => m.testCase === 'A') },
  { label: 'Opened a citation to check the answer', done: (s) => s.events.some((e) => e.type === 'citation_opened' && e.data?.pack === pack) },
  { label: 'Asked a question the source does not cover', done: (s) => !!agentFor(s, pack)?.chat.some((m) => m.intent === `${pack}-gap`) },
];

/** Standard checks for a Cowork practice task that ends with an email for approval. */
const coworkChecks = (scenario: ScenarioId, mainKey: string, mainLabel: string): PracticeCheck[] => [
  { label: 'Delegated the task to Cowork', done: (s) => !!taskFor(s, scenario) },
  { label: `Opened the ${mainLabel}`, done: (s) => !!artOf(s, scenario, mainKey)?.viewed },
  { label: 'Checked a source from the output', done: (s) => s.events.some((e) => e.type === 'artifact_source_opened' && e.data?.scenario === scenario) },
  { label: 'Task completed', done: (s) => taskFor(s, scenario)?.status === 'completed' },
];

export const practiceExercises: PracticeExercise[] = [
  {
    id: 'meeting',
    group: 'core',
    scenario: 'meeting',
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
    group: 'core',
    agent: {
      packId: 'policy',
      name: 'Workplace Policy Helper',
      description: 'Answers employee questions about the Hybrid Work and Travel Policy (training sample).',
      instructions:
        'You help employees understand the Hybrid Work and Travel Policy. Answer only from the policy document and cite the section. If the policy does not cover a question, say the information is missing and suggest who to ask. Do not invent amounts or rules.',
      docId: 'doc_policy',
      owner: 'usr_zanele',
      starterPrompts: [
        { title: 'Office days', message: 'How many days must I be in the office?' },
        { title: 'Home internet', message: 'Can I claim for home internet?' },
        { title: 'Travel booking', message: 'How far ahead must I book international travel?' },
        { title: 'Lagos per diem', message: 'What is the per diem for a trip to Lagos?' },
      ],
    },
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
    group: 'core',
    scenario: 'delivery',
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
  // ───────────── Agents your teams will use ─────────────
  {
    id: 'procedures',
    group: 'workplace',
    title: 'Policy & Procedures Navigator',
    surface: 'Agent',
    minutes: 3,
    objective: 'Get quick, cited answers to everyday expense and IT questions — and see the agent refuse to interpret exceptions.',
    brief:
      'Use the "Policy & Procedures Navigator", built on the Staff Expenses and IT Requests Procedure v3.1 (training sample). Ask a routine question, open the citation, then ask for something the procedure does not cover.',
    expected: [
      '"How long do I have to submit a claim?" → within 60 days, with receipts over R200, cited to section 2.',
      '"Can I install a free AI tool?" → only after an Information Security review, cited to section 7.',
      '"Can I claim my gym membership?" → not covered; ask your Finance Business Partner. No guess.',
      '"My claim is late because I was on leave — is that OK?" → an exception; the agent routes it and does not approve it.',
    ],
    checks: agentChecks('procedures'),
    agent: {
      packId: 'procedures',
      name: 'Policy & Procedures Navigator',
      description: 'Answers staff questions about expenses, spend approval limits and IT requests, with citations (training sample).',
      instructions:
        'You help staff follow the Staff Expenses and IT Requests Procedure. Answer only from the procedure and cite the section. If it does not cover a question, or the question is about an exception, say so and name who to ask. Never approve, interpret or make exceptions. Do not invent amounts or rules.',
      docId: 'doc_procedures',
      owner: 'usr_nomvula',
      starterPrompts: [
        { title: 'Claim deadline', message: 'How long do I have to submit an expense claim?' },
        { title: 'Client dinner', message: 'What is the limit for a client dinner?' },
        { title: 'AI tools', message: 'Can I install a free AI tool on my laptop?' },
        { title: 'Gym membership', message: 'Can I claim my gym membership?' },
      ],
    },
    buildTip: 'Use your real policy library as knowledge, remove superseded versions first, and name an owner in Finance or HR who reviews wrong answers monthly.',
  },
  {
    id: 'compliance',
    group: 'workplace',
    title: 'Compliance & KYC Q&A',
    surface: 'Agent',
    minutes: 3,
    objective: 'Answer complaint-handling and KYC questions from an internal procedure, and escalate anything that needs a compliance judgement.',
    brief:
      'Use the "Compliance Q&A" agent, built on the Customer Complaints and KYC Procedure v2.0 (training sample). Ask about a timeline or KYC tier, open the citation, then ask about an unusual customer situation.',
    expected: [
      '"How quickly must we resolve a complaint?" → acknowledge within 2 business days, resolve within 15 (sample), cited to section 2.',
      '"What does a Tier 2 wallet need?" → Tier 1 plus proof of address, R25,000 limit (sample), cited to section 3.',
      '"Can we onboard a customer with an expired passport?" → not covered; send to the Compliance mailbox. No opinion given.',
      'The agent says it gives operational guidance, not legal advice.',
    ],
    checks: agentChecks('compliance'),
    agent: {
      packId: 'compliance',
      name: 'Compliance Q&A',
      description: 'Explains the internal complaints, KYC and customer-data procedure, with citations. Operational guidance, not legal advice (training sample).',
      instructions:
        'You explain the Customer Complaints and KYC Procedure to operations and product staff. Answer only from the procedure and cite the section. You give operational guidance, not legal advice. For anything the procedure does not cover, any exception, or any legal question, say so and direct the person to the Compliance mailbox. Never repeat customer personal information.',
      docId: 'doc_compliance',
      owner: 'usr_aisha',
      starterPrompts: [
        { title: 'Complaint timelines', message: 'How quickly must we resolve a customer complaint?' },
        { title: 'Tier 2 wallet', message: 'What does a customer need for a Tier 2 wallet?' },
        { title: 'Suspicious activity', message: 'What do I do if I suspect money laundering?' },
        { title: 'Expired passport', message: 'Can we onboard a customer with an expired passport?' },
      ],
    },
    buildTip: 'Have Compliance approve the source list and instructions before sharing. Point it only at approved, current procedures — never at drafts or regulator correspondence.',
  },
  {
    id: 'onboarding',
    group: 'workplace',
    title: 'New Joiner Onboarding Buddy',
    surface: 'Agent',
    minutes: 3,
    objective: 'Help a new joiner find first-week answers from the onboarding guide, and point them to people for everything else.',
    brief:
      'Use the "Onboarding Buddy" agent, built on the New Joiner Guide — Fintech Operations (training sample). Ask as if it is your first week, open a citation, then ask about pay or leave.',
    expected: [
      '"What time should I arrive on my first day?" → 08:30 at reception, cited to section 1.',
      '"Which training must I finish?" → three courses within 30 days, cited to section 3.',
      '"When is payday?" → not in the guide; ask Zanele Mthembu or HR self-service.',
    ],
    checks: agentChecks('onboarding'),
    agent: {
      packId: 'onboarding',
      name: 'Onboarding Buddy',
      description: 'Answers new joiners’ first-30-days questions from the onboarding guide (training sample).',
      instructions:
        'You help new joiners in Fintech Operations during their first 30 days. Answer only from the New Joiner Guide, in a friendly and brief way, and cite the section. If the guide does not cover something, say so and name the person or team to ask. Do not guess about pay, leave or benefits.',
      docId: 'doc_onboarding',
      owner: 'usr_zanele',
      starterPrompts: [
        { title: 'First day', message: 'What time should I arrive on my first day?' },
        { title: 'Mandatory training', message: 'Which training must I finish, and by when?' },
        { title: 'What is KYC?', message: 'What does KYC mean?' },
        { title: 'Payday', message: 'When is payday?' },
      ],
    },
    buildTip: 'Pair it with a Cowork task for managers ("set up week one") that drafts the welcome email and books intro meetings for approval.',
  },
  {
    id: 'actions',
    group: 'workplace',
    title: 'Meeting to actions',
    surface: 'Cowork',
    minutes: 4,
    objective: 'Turn a meeting transcript into decisions and owned actions, and send the follow-up only after checking it.',
    brief:
      "The Merchant Onboarding weekly sync transcript is attached. Ask Cowork for the decisions, actions and follow-up email. Watch for an action that changed owner during the meeting.",
    expected: [
      'Four actions: Kwame (backlog numbers, 25 Sep), Lerato (comms plan, 30 Sep), Sipho (training schedule, 2 Oct), Johan (go/no-go check, 7 Oct).',
      'The comms plan belongs to Lerato — it was reassigned from Sipho during the meeting.',
      'The WhatsApp chatbot is parked, not an action.',
      'One decision: the campaign launch stays on 12 October.',
    ],
    checks: coworkChecks('actions', 'actions', 'decisions and actions'),
    scenario: 'actions',
    buildTip: 'In practice, attach the Teams transcript or your notes to a Cowork task. Keep approval on for every email — owners and dates are where mistakes cost most.',
  },
  {
    id: 'status',
    group: 'workplace',
    title: 'Weekly status report',
    surface: 'Cowork',
    minutes: 4,
    objective: 'Draft a weekly KPI status from a scorecard, explaining misses and flagging figures that are not safe to report.',
    brief:
      'The Fintech Operations KPI Scorecard for week 38 is attached. Ask Cowork to draft the status and covering email to Thandi. Check the variances and the data dates before approving.',
    expected: [
      'Three KPIs off target: wallet sign-ups, transaction success rate and complaint resolution time.',
      'Complaint resolution is off target because lower is better (12.5 days vs a target of 10).',
      'App store rating is flagged as not updated this week (data from 6 Sep) and not assessed.',
      'Fraud losses are labelled provisional — or left out, if you chose that.',
    ],
    checks: coworkChecks('status', 'status', 'status report'),
    scenario: 'status',
    buildTip: 'Keep the scorecard in one SharePoint file with a data-date column, so Cowork can tell fresh figures from stale ones every week.',
  },
  {
    id: 'triage',
    group: 'workplace',
    title: 'Customer case triage',
    surface: 'Cowork',
    minutes: 4,
    objective: 'Prioritise a support case queue with the triage guide, draft simple replies, and escalate urgent cases — without spreading customer data.',
    brief:
      "Today's MoMo support case queue and triage guide are attached. Ask Cowork to triage the cases and prepare the Risk escalation. Check the P1 cases and make sure no PIN appears in any output.",
    expected: [
      'P1: C-2201 (unauthorised transaction), C-2205 (possible SIM swap) and C-2204 (complaint at 14 business days, near the 15-day limit).',
      'P2: C-2202 (failed airtime) and C-2206 (account access). P3: C-2203 (fee question).',
      "The PIN in C-2206's message does not appear in the triage sheet, replies or email.",
      'The escalation goes to Aisha Patel with masked customer references, only after you approve it.',
    ],
    checks: coworkChecks('triage', 'triage', 'triage sheet'),
    scenario: 'triage',
    buildTip: 'Use masked exports, not raw customer records. Replies to customers still go out through your case system after a person checks them.',
  },
];

export const practiceById = (id: string) => practiceExercises.find((p) => p.id === id);
