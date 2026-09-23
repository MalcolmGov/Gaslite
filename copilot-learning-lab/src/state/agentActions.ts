import { answerAsAgent } from '../engine/packs';
import { answerQuestion, refine, startFromDescription, starterPrompts } from '../engine/builder';
import type { Agent, ChatMessage, KnowledgeRef, ShareEntry, StarterPrompt } from '../engine/model';
import { copilotChatReply } from '../engine/copilotChat';
import { MAIN_PROMPT } from '../engine/cowork/scenarios';
import { getDoc } from '../scenario/registry';
import { schedule } from '../lib/scheduler';
import { newId } from '../lib/util';
import { settings } from '../config/settings';
import { announce, lab, logEvent, mutate, type LabState } from './store';
import { navigate } from './router';

// ───────────── helpers ─────────────

export function newAgent(partial: Partial<Agent> = {}): Agent {
  return {
    id: newId('agt'),
    packId: 'programme',
    name: '',
    description: '',
    instructions: '',
    knowledge: [],
    onlySpecifiedSources: true,
    starterPrompts: [],
    configVersion: 1,
    status: 'draft',
    owner: settings.learner.id,
    sharing: { entries: [] },
    builder: { stage: 'intro', question: 0, answers: {}, messages: [] },
    testChat: [],
    chat: [],
    ...partial,
  };
}

const userMsg = (text: string): ChatMessage => ({ id: newId('msg'), role: 'user', text, at: Date.now() });

/** Bump the config version only if answers exist for the current version, so reruns can be compared. */
function touchConfig(s: LabState, a: Agent) {
  const tested = [...a.testChat, ...a.chat].some((m) => m.role === 'assistant' && m.configVersion === a.configVersion);
  if (tested) {
    a.configVersion += 1;
    logEvent(s, 'config_edited', { agentId: a.id, version: a.configVersion });
  }
  if (a.status === 'created') a.hasUnpublishedChanges = true;
}

export const canTry = (a: Agent) => !!(a.name.trim() && a.description.trim() && a.instructions.trim());

// ───────────── creation & builder ─────────────

export function startNewAgent(): string {
  const a = newAgent();
  mutate((s) => {
    s.agents[a.id] = a;
    s.agentOrder.unshift(a.id);
    if (!s.session.mainAgentId || !s.agents[s.session.mainAgentId]) s.session.mainAgentId = a.id;
    logEvent(s, 'builder_started', { agentId: a.id });
  });
  navigate({ name: 'builder', agentId: a.id, tab: 'describe' });
  return a.id;
}

function applyBuilderResult(agentId: string, r: ReturnType<typeof startFromDescription>) {
  mutate((s) => {
    const a = s.agents[agentId];
    if (!a) return;
    a.builder.messages.push(...r.messages);
    Object.assign(a.builder, r.builder);
    let changed = false;
    for (const [k, v] of Object.entries(r.patch)) {
      if (v !== undefined && (a as unknown as Record<string, unknown>)[k] !== v) {
        (a as unknown as Record<string, unknown>)[k] = v;
        changed = true;
      }
    }
    if (r.starters && !a.starterPrompts.length) a.starterPrompts = starterPrompts();
    if (changed) touchConfig(s, a);
    if (r.openPicker) s.ui.pickerOpen = { purpose: 'agent', targetId: agentId };
    if (a.builder.stage === 'done' && a.name && a.instructions) logEvent(s, 'purpose_defined', { agentId, via: 'describe' });
    delete s.ui.busy[`builder:${agentId}`];
  });
  const last = r.messages[r.messages.length - 1];
  if (last) announce('Agent Builder: ' + last.text.replace(/\*\*/g, '').slice(0, 140));
}

export function builderSend(agentId: string, text: string) {
  const a = lab().agents[agentId];
  if (!a || !text.trim()) return;
  mutate((s) => {
    s.agents[agentId].builder.messages.push(userMsg(text));
    s.ui.busy[`builder:${agentId}`] = true;
    logEvent(s, 'builder_answered', { agentId, stage: a.builder.stage, question: a.builder.question });
  });
  schedule(`builder:${agentId}`, 900, () => {
    const cur = lab().agents[agentId];
    const readyish = cur.knowledge.filter((k) => k.status === 'ready' || k.status === 'preparing').length;
    const r =
      cur.builder.stage === 'intro' || cur.builder.stage === 'skipped'
        ? startFromDescription(text)
        : cur.builder.stage === 'clarifying'
          ? answerQuestion(cur.builder, text, readyish)
          : refine(text, cur);
    applyBuilderResult(agentId, r);
  });
}

/** Quick reply chips (value may differ from the visible label). */
export function builderReply(agentId: string, label: string, value: string) {
  const a = lab().agents[agentId];
  if (!a) return;
  if (value === '__picker') {
    mutate((s) => { s.ui.pickerOpen = { purpose: 'agent', targetId: agentId }; });
    return;
  }
  mutate((s) => {
    s.agents[agentId].builder.messages.push(userMsg(label));
    s.ui.busy[`builder:${agentId}`] = true;
    logEvent(s, 'builder_answered', { agentId, question: a.builder.question, value });
  });
  schedule(`builder:${agentId}`, 700, () => {
    const cur = lab().agents[agentId];
    const readyish = cur.knowledge.filter((k) => k.status === 'ready' || k.status === 'preparing').length;
    applyBuilderResult(agentId, answerQuestion(cur.builder, value, readyish));
  });
}

/** Called when knowledge is added while the builder is waiting on the knowledge question. */
function builderKnowledgeAdded(agentId: string, docIds: string[]) {
  const a = lab().agents[agentId];
  if (!a || a.builder.stage !== 'clarifying' || a.builder.question !== 1) return;
  const names = docIds.map((id) => getDoc(id)?.title).filter(Boolean).join(', ');
  mutate((s) => { s.agents[agentId].builder.messages.push(userMsg(`Added knowledge: ${names}`)); });
  schedule(`builder:${agentId}`, 600, () => {
    const cur = lab().agents[agentId];
    applyBuilderResult(agentId, answerQuestion(cur.builder, names, cur.knowledge.length));
  });
}

export function skipToConfigure(agentId: string) {
  mutate((s) => {
    const a = s.agents[agentId];
    a.builder.stage = 'skipped';
    if (!a.starterPrompts.length) a.starterPrompts = starterPrompts();
  });
  navigate({ name: 'builder', agentId, tab: 'configure' });
}

export function setBuilderTab(agentId: string, tab: 'describe' | 'configure' | 'try') {
  navigate({ name: 'builder', agentId, tab });
  if (tab === 'configure') {
    const a = lab().agents[agentId];
    if (a && canTry(a)) mutate((s) => logEvent(s, 'purpose_defined', { agentId, via: 'configure' }));
  }
}

// ───────────── configuration ─────────────

type EditableField = 'name' | 'description' | 'instructions' | 'onlySpecifiedSources';

export function updateAgentField(agentId: string, field: EditableField, value: string | boolean) {
  mutate((s) => {
    const a = s.agents[agentId];
    if (!a || a[field] === value) return;
    (a as unknown as Record<string, unknown>)[field] = value;
    touchConfig(s, a);
  });
}

export function updateStarterPrompts(agentId: string, prompts: StarterPrompt[]) {
  mutate((s) => {
    const a = s.agents[agentId];
    a.starterPrompts = prompts;
    touchConfig(s, a);
  });
}

// ───────────── knowledge ─────────────

function prepare(agentId: string, docId: string) {
  schedule(`knowledge:${agentId}:${docId}`, 1400, () => {
    mutate((s) => {
      const a = s.agents[agentId];
      const k = a?.knowledge.find((x) => x.docId === docId);
      if (!k || k.status !== 'preparing') return;
      const inject = s.facilitator.failures.missingSource && !s.facilitator.consumed.missingSource && docId === 'doc_steering';
      if (inject) {
        s.facilitator.consumed.missingSource = true;
        k.status = 'error';
        k.message = "Couldn't access this file. It may have been moved, or its permissions changed after you selected it.";
        logEvent(s, 'source_denied', { agentId, docId, reason: 'moved' });
      } else {
        k.status = 'ready';
        k.message = undefined;
      }
      touchConfig(s, a);
    });
    const k = lab().agents[agentId]?.knowledge.find((x) => x.docId === docId);
    announce(`${getDoc(docId)?.title}: ${k?.status === 'ready' ? 'ready' : "couldn't be accessed"}`);
  });
}

export function addKnowledge(agentId: string, docIds: string[]) {
  const added: string[] = [];
  mutate((s) => {
    const a = s.agents[agentId];
    if (!a) return;
    for (const id of docIds) {
      const doc = getDoc(id);
      if (!doc) continue;
      const existing = a.knowledge.find((k) => k.docId === id);
      const ref: KnowledgeRef = existing ?? { docId: id, status: 'preparing', addedAt: Date.now() };
      if (existing && existing.status !== 'removed' && existing.status !== 'error') continue;
      if (doc.learnerAccess === 'denied') {
        ref.status = 'denied';
        ref.message = doc.accessMessage;
        logEvent(s, 'source_denied', { agentId, docId: id });
      } else {
        ref.status = 'preparing';
        ref.message = undefined;
        ref.removedAt = undefined;
        added.push(id);
        logEvent(s, 'source_added', { agentId, docId: id, superseded: !!doc.supersededBy, duplicate: !!doc.duplicateOf });
      }
      if (!existing) a.knowledge.push(ref);
    }
    touchConfig(s, a);
  });
  added.forEach((id) => prepare(agentId, id));
  if (added.length) builderKnowledgeAdded(agentId, added);
}

export function removeKnowledge(agentId: string, docId: string) {
  mutate((s) => {
    const a = s.agents[agentId];
    const k = a?.knowledge.find((x) => x.docId === docId);
    if (!k) return;
    if (k.status === 'denied') {
      a.knowledge = a.knowledge.filter((x) => x.docId !== docId);
    } else {
      k.status = 'removed';
      k.removedAt = Date.now();
    }
    const doc = getDoc(docId);
    logEvent(s, 'source_removed', { agentId, docId, superseded: !!doc?.supersededBy, duplicate: !!doc?.duplicateOf });
    touchConfig(s, a);
  });
  announce(`Removed ${getDoc(docId)?.title}. The agent no longer uses it.`);
}

export function restoreKnowledge(agentId: string, docId: string) {
  mutate((s) => {
    const k = s.agents[agentId]?.knowledge.find((x) => x.docId === docId);
    if (k) { k.status = 'preparing'; k.removedAt = undefined; }
  });
  prepare(agentId, docId);
}

export function retryKnowledge(agentId: string, docId: string) {
  mutate((s) => {
    const k = s.agents[agentId]?.knowledge.find((x) => x.docId === docId);
    if (k) { k.status = 'preparing'; k.message = undefined; logEvent(s, 'error_recovered', { what: 'knowledge', docId }); }
  });
  prepare(agentId, docId);
}

export function replaceKnowledge(agentId: string, fromId: string, toId: string) {
  removeKnowledge(agentId, fromId);
  addKnowledge(agentId, [toId]);
  mutate((s) => logEvent(s, 'superseded_avoided', { agentId, fromId, toId }));
}

// ───────────── conversations ─────────────

type Conv = 'try' | 'chat';

export function askAgent(agentId: string, text: string, conv: Conv) {
  const a = lab().agents[agentId];
  if (!a || !text.trim()) return;
  const key = `reply:${agentId}:${conv}`;
  if (lab().ui.busy[key]) return;
  mutate((s) => {
    const ag = s.agents[agentId];
    (conv === 'try' ? ag.testChat : ag.chat).push(userMsg(text));
    s.ui.busy[key] = true;
  });
  schedule(key, 1300, () => {
    const cur = lab().agents[agentId];
    const history = conv === 'try' ? cur.testChat : cur.chat;
    const reply = answerAsAgent(cur, text, history);
    mutate((s) => {
      const ag = s.agents[agentId];
      (conv === 'try' ? ag.testChat : ag.chat).push(reply);
      delete s.ui.busy[key];
      if (reply.testCase) logEvent(s, 'test_run', { agentId, case: reply.testCase, verdict: reply.coaching?.verdict, version: reply.configVersion, conv });
      if (conv === 'chat') logEvent(s, 'agent_followup', { agentId, intent: reply.intent, briefing: !!reply.isBriefing });
    });
    announce(`${cur.name || 'Agent'} replied.`);
  });
}

/** Rerun the question that produced an earlier answer, using the current configuration. */
export function rerun(agentId: string, messageId: string, conv: Conv) {
  const a = lab().agents[agentId];
  const list = conv === 'try' ? a.testChat : a.chat;
  const idx = list.findIndex((m) => m.id === messageId);
  const q = [...list.slice(0, idx)].reverse().find((m) => m.role === 'user');
  if (q) askAgent(agentId, q.text, conv);
}

export function newTestChat(agentId: string) {
  mutate((s) => { s.agents[agentId].testChat = []; });
}

// ───────────── create, update, share ─────────────

export function createAgent(agentId: string) {
  const a = lab().agents[agentId];
  if (!a || !canTry(a)) return;
  mutate((s) => { s.ui.busy[`create:${agentId}`] = true; });
  schedule(`create:${agentId}`, 1600, () => {
    mutate((s) => {
      const ag = s.agents[agentId];
      ag.status = 'created';
      ag.createdAt = Date.now();
      ag.hasUnpublishedChanges = false;
      delete s.ui.busy[`create:${agentId}`];
      logEvent(s, 'agent_created', { agentId, sources: ag.knowledge.filter((k) => k.status === 'ready').length });
    });
    announce('Agent created. It is private and only available to you.');
  });
}

export function publishUpdate(agentId: string) {
  mutate((s) => { s.ui.busy[`create:${agentId}`] = true; });
  schedule(`create:${agentId}`, 1200, () => {
    mutate((s) => {
      s.agents[agentId].hasUnpublishedChanges = false;
      delete s.ui.busy[`create:${agentId}`];
    });
    announce('Agent updated.');
  });
}

export function shareAgent(agentId: string, entries: ShareEntry[], notify: boolean) {
  mutate((s) => { s.ui.busy[`share:${agentId}`] = true; });
  schedule(`share:${agentId}`, 1400, () => {
    mutate((s) => {
      const a = s.agents[agentId];
      a.sharing = { entries, sharedAt: Date.now() };
      delete s.ui.busy[`share:${agentId}`];
      logEvent(s, 'agent_shared', {
        agentId,
        groups: entries.filter((e) => e.kind === 'group').map((e) => e.principalId).join(','),
        people: entries.filter((e) => e.kind === 'person').length,
        editors: entries.filter((e) => e.role === 'edit').length,
        notify,
      });
    });
    announce('Agent shared.');
  });
}

export function openAgent(agentId: string) {
  mutate((s) => logEvent(s, 'agent_opened', { agentId }));
  navigate({ name: 'agent', agentId });
}

/** Training-layer handoff: copies a reviewed briefing into a new Cowork task. */
export function handoffToCowork(agentId: string, messageId: string): string | null {
  const a = lab().agents[agentId];
  const m = a?.chat.find((x) => x.id === messageId);
  if (!a || !m) return null;
  // Imported lazily to avoid a circular import at module load.
  const taskId = createReadyTaskRef.current?.('main', MAIN_PROMPT, ['doc_tracker35'], { text: m.text, agentName: a.name, at: Date.now() });
  mutate((s) => logEvent(s, 'handoff', { agentId, messageId, intent: m.intent }));
  if (taskId) navigate({ name: 'task', taskId });
  return taskId ?? null;
}

/** Filled in by coworkActions to break the import cycle. */
export const createReadyTaskRef: {
  current?: (scenario: 'main' | 'meeting' | 'delivery', prompt: string, files: string[], brief?: { text: string; agentName: string; at: number }) => string;
} = {};

// ───────────── Copilot Chat ─────────────

export function copilotChatSend(text: string) {
  if (!text.trim()) return;
  mutate((s) => {
    s.copilotChat.messages.push(userMsg(text));
    s.ui.busy['reply:chat'] = true;
    logEvent(s, 'chat_asked', { attached: s.copilotChat.attached.length });
  });
  schedule('reply:chat', 1100, () => {
    const attached = lab().copilotChat.attached;
    const reply: ChatMessage = { id: newId('msg'), role: 'assistant', text: copilotChatReply(text, attached), at: Date.now() };
    mutate((s) => {
      s.copilotChat.messages.push(reply);
      delete s.ui.busy['reply:chat'];
    });
    announce('Copilot replied.');
  });
}

export function setChatAttachments(docIds: string[]) {
  mutate((s) => { s.copilotChat.attached = docIds; });
}
