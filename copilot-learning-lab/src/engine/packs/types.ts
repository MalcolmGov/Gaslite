import type { Behaviour } from '../instructions';
import type { ChatMessage, Coaching, StarterPrompt, TestCaseId } from '../model';

export interface AnswerContext {
  question: string;
  behaviour: Behaviour;
  /** Documents whose knowledge status is "ready". */
  ready: string[];
  agentName: string;
  description: string;
  starterPrompts: StarterPrompt[];
  history: ChatMessage[];
  onlySpecifiedSources: boolean;
}

export interface AgentAnswer {
  text: string;
  intent: string;
  isBriefing?: boolean;
  testCase?: TestCaseId;
  coaching?: Coaching;
}

export interface KnowledgePack {
  id: string;
  answer(ctx: AnswerContext): AgentAnswer;
}
