import { readInstructions } from '../instructions';
import type { Agent, ChatMessage } from '../model';
import { stripCitations } from '../../lib/markdown';
import { newId } from '../../lib/util';
import { policyPack } from './policy';
import { programmePack } from './programme';
import type { KnowledgePack } from './types';

const packs: Record<string, KnowledgePack> = { programme: programmePack, policy: policyPack };

export const readySources = (agent: Agent) => agent.knowledge.filter((k) => k.status === 'ready').map((k) => k.docId);

/**
 * Produce the agent's reply to a question using its *current* configuration:
 * instructions, ready knowledge sources, starter prompts and name.
 */
export function answerAsAgent(agent: Agent, question: string, history: ChatMessage[]): ChatMessage {
  const behaviour = readInstructions(agent.instructions);
  const pack = packs[agent.packId];
  const a = pack.answer({
    question,
    behaviour,
    ready: readySources(agent),
    agentName: agent.name || 'Untitled agent',
    description: agent.description,
    starterPrompts: agent.starterPrompts,
    history,
    onlySpecifiedSources: agent.onlySpecifiedSources,
  });
  const sources = [...new Set([...a.text.matchAll(/\[\[c:([\w-]+)\]\]/g)].map((m) => m[1]))];
  return {
    id: newId('msg'),
    role: 'assistant',
    text: behaviour.cite ? a.text : stripCitations(a.text),
    at: Date.now(),
    intent: a.intent,
    configVersion: agent.configVersion,
    testCase: a.testCase,
    coaching: a.coaching,
    isBriefing: a.isBriefing,
    sources,
  };
}
