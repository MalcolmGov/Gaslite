/**
 * Domain model for the simulator. Kept free of React so engines can be unit-tested.
 * All identifiers are stable strings created with newId().
 */

// ───────────────────────── Agents ─────────────────────────

export type KnowledgeStatus = 'preparing' | 'ready' | 'denied' | 'error' | 'removed';

export interface KnowledgeRef {
  docId: string;
  status: KnowledgeStatus;
  addedAt: number;
  removedAt?: number;
  /** Explanation shown for denied / error states. */
  message?: string;
}

export interface StarterPrompt {
  id: string;
  title: string;
  message: string;
}

export type PackId = 'programme' | 'policy' | 'procedures' | 'compliance' | 'onboarding';

export interface ShareEntry {
  principalId: string;
  kind: 'person' | 'group';
  role: 'chat' | 'edit';
}

export interface BuilderState {
  stage: 'intro' | 'clarifying' | 'done' | 'skipped';
  /** Index of the next clarifying question. */
  question: number;
  answers: Partial<Record<'audience' | 'knowledge' | 'include' | 'gaps', string>>;
  messages: ChatMessage[];
}

export interface Agent {
  id: string;
  packId: PackId;
  name: string;
  description: string;
  instructions: string;
  knowledge: KnowledgeRef[];
  onlySpecifiedSources: boolean;
  starterPrompts: StarterPrompt[];
  /** Increments on every configuration edit, so answers can be compared across versions. */
  configVersion: number;
  status: 'draft' | 'created';
  createdAt?: number;
  /** Configuration changed after Create: the learner must select Update. */
  hasUnpublishedChanges?: boolean;
  owner: string;
  sharing: { entries: ShareEntry[]; sharedAt?: number };
  builder: BuilderState;
  testChat: ChatMessage[];
  chat: ChatMessage[];
  /** Pre-built practice agents are not editable in Agent Builder. */
  prebuilt?: boolean;
  /** Model chosen in Copilot Studio (simulated). Unset = managed by Microsoft, as in Agent Builder. */
  model?: string;
}

// ───────────────────────── Conversations ─────────────────────────

export type ChatRole = 'user' | 'assistant' | 'builder';

export interface QuickReply {
  label: string;
  value: string;
  recommended?: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Markdown with [[c:sectionId]] citation tokens. */
  text: string;
  at: number;
  intent?: string;
  /** For answers: which config version produced it, and which test case it answers. */
  configVersion?: number;
  testCase?: TestCaseId;
  coaching?: Coaching;
  quickReplies?: QuickReply[];
  multiSelect?: boolean;
  /** Action chips shown under builder messages. */
  builderAction?: 'open-picker' | 'go-configure' | 'go-try';
  /** True when this answer can be carried into Cowork as a briefing. */
  isBriefing?: boolean;
  /** Source docs the answer relied on. */
  sources?: string[];
}

export type TestCaseId = 'A' | 'B' | 'C';

export interface Coaching {
  verdict: 'good' | 'needs-work';
  evidence: string;
  clarity: string;
  uncertainty: string;
  tip?: string;
}

// ───────────────────────── Cowork ─────────────────────────

export type TaskStatus =
  | 'ready'
  | 'working'
  | 'needs_input'
  | 'needs_approval'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ScenarioId = 'main' | 'meeting' | 'delivery' | 'actions' | 'status' | 'triage';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  kind: 'person' | 'group';
}

export interface EmailPayload {
  to: Recipient[];
  cc: Recipient[];
  subject: string;
  body: string;
  attachments: string[]; // artifact ids
}

export interface MeetingPayload {
  title: string;
  attendees: Recipient[];
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  timeZone: string;
  agenda: string;
  teamsLink: boolean;
}

export type ActionState = 'needs_approval' | 'queued' | 'executing' | 'done' | 'failed' | 'cancelled';

export interface ActionHistory {
  at: number;
  text: string;
}

export interface OutboundAction {
  id: string;
  taskId: string;
  kind: 'email' | 'meeting';
  state: ActionState;
  email?: EmailPayload;
  meeting?: MeetingPayload;
  /** Hash of the payload the learner approved. Execution requires it to match. */
  approvedHash?: string;
  /** Set when content changed after approval, requiring fresh approval. */
  changedAfterApproval?: boolean;
  /** Epoch ms when the queued action will execute. */
  executeAt?: number;
  attempts: number;
  /** Id of the sent item / calendar event once executed. Guards against duplicates. */
  resultId?: string;
  error?: string;
  viewed?: boolean;
  history: ActionHistory[];
}

export interface ArtifactVersion {
  v: number;
  content: string;
  at: number;
  reason: string;
  /** Source doc ids this version was generated from. */
  sources: string[];
}

export type ArtifactFormat = 'md' | 'csv' | 'eml' | 'ics';

export interface Artifact {
  id: string;
  taskId: string;
  key: 'update' | 'table' | 'email' | 'invite' | 'summary' | 'agenda' | 'overdue' | 'escalation' | 'actions' | 'status' | 'triage' | 'reply';
  title: string;
  baseName: string;
  format: ArtifactFormat;
  versions: ArtifactVersion[];
  current: number;
  editable: boolean;
  /** Generated from a source that has since been replaced. */
  stale?: boolean;
  viewed?: boolean;
}

export type TranscriptItem =
  | { id: string; kind: 'user'; text: string; at: number }
  | { id: string; kind: 'assistant'; text: string; at: number }
  | { id: string; kind: 'skill'; text: string; skill: string; at: number }
  | { id: string; kind: 'tool'; text: string; at: number; state: 'running' | 'done' | 'interrupted' }
  | { id: string; kind: 'plan'; at: number; steps: string[]; state: 'pending' | 'accepted' }
  | { id: string; kind: 'question'; at: number; questionId: string; answered?: string | null }
  | { id: string; kind: 'artifacts'; at: number; artifactIds: string[] }
  | { id: string; kind: 'action'; at: number; actionId: string }
  | { id: string; kind: 'notice'; at: number; tone: 'info' | 'warning' | 'error' | 'success'; text: string };

export interface TaskQuestion {
  id: string;
  prompt: string;
  detail?: string;
  options: { value: string; label: string; detail?: string }[];
  allowFreeText?: boolean;
}

export interface Task {
  id: string;
  scenarioId: ScenarioId;
  title: string;
  prompt: string;
  createdAt: number;
  status: TaskStatus;
  /** Explanation for paused / failed / cancelled states. */
  statusNote?: string;
  context: {
    brief?: { text: string; agentName: string; at: number };
    files: string[];
    replacedFiles?: { from: string; to: string }[];
  };
  /** Outputs requested in the prompt. */
  requested: { update: boolean; email: boolean; meeting: boolean; reviewFirst: boolean };
  answers: Record<string, string | null>;
  /** Index into the scenario script. */
  cursor: number;
  pauseRequested?: boolean;
  transcript: TranscriptItem[];
  artifactIds: string[];
  actionIds: string[];
  skills: string[];
  /** Messages the learner queued while the task was working. */
  queued: string[];
  unread?: boolean;
  /** Transient "thinking" indicator. */
  thinking?: boolean;
  /** Warns once that the attached tracker is older than the briefing. */
  staleNoticeShown?: boolean;
}

// ───────────────────────── Simulated Microsoft 365 data ─────────────────────────

export interface SentItem {
  id: string;
  actionId: string;
  taskId: string;
  at: number;
  email: EmailPayload;
}

export interface CreatedEvent {
  id: string;
  actionId: string;
  taskId: string;
  at: number;
  meeting: MeetingPayload;
}

// ───────────────────────── Learning ─────────────────────────

export type LearningEventType =
  | 'chat_asked'
  | 'model_picker_opened'
  | 'model_selected'
  | 'cost_estimated'
  | 'builder_started'
  | 'builder_answered'
  | 'purpose_defined'
  | 'source_added'
  | 'source_removed'
  | 'source_denied'
  | 'source_previewed'
  | 'superseded_avoided'
  | 'config_edited'
  | 'test_run'
  | 'citation_opened'
  | 'agent_created'
  | 'agent_shared'
  | 'agent_opened'
  | 'agent_followup'
  | 'handoff'
  | 'task_started'
  | 'objective_checked'
  | 'question_answered'
  | 'plan_accepted'
  | 'artifact_viewed'
  | 'artifact_source_opened'
  | 'artifact_edited'
  | 'artifact_revised'
  | 'stale_corrected'
  | 'recipients_checked'
  | 'action_viewed'
  | 'action_approved'
  | 'action_cancelled'
  | 'action_edited'
  | 'action_failed'
  | 'action_retried'
  | 'conflict_resolved'
  | 'task_paused'
  | 'task_cancelled'
  | 'task_completed'
  | 'error_recovered'
  | 'download'
  | 'practice_completed';

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  at: number;
  data?: Record<string, string | number | boolean | undefined>;
}
