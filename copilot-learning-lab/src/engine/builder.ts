import type { Agent, BuilderState, ChatMessage, QuickReply, StarterPrompt } from './model';
import { newId, normalise } from '../lib/util';

/**
 * Agent Builder "Describe" flow: natural-language creation with clarifying
 * questions. Each answer updates the agent's name, description and
 * instructions, which the learner can then edit on the Configure tab.
 */

export const STARTING_INSTRUCTION =
  'Create an AI Programme Knowledge Agent that helps our team understand programme progress, milestones, risks and training activity using approved programme documents.';

export const DEFAULT_STARTERS: Omit<StarterPrompt, 'id'>[] = [
  { title: 'This week', message: 'What changed in the programme this week?' },
  { title: 'Milestones at risk', message: 'Which milestones are at risk?' },
  { title: 'Training progress', message: 'Summarise training progress.' },
  { title: 'Leadership briefing', message: 'Prepare a short leadership briefing.' },
];

export const starterPrompts = (): StarterPrompt[] => DEFAULT_STARTERS.map((s) => ({ ...s, id: newId('sp') }));

type Key = 'audience' | 'knowledge' | 'include' | 'gaps';

interface Question {
  key: Key;
  text: string;
  replies: QuickReply[];
  multi?: boolean;
  action?: ChatMessage['builderAction'];
}

export const QUESTIONS: Question[] = [
  {
    key: 'audience',
    text: 'Who will use this agent?',
    replies: [
      { label: 'The AI and Automation programme team', value: 'the AI and Automation programme team', recommended: true },
      { label: 'Programme leadership', value: 'programme leadership' },
      { label: 'Everyone in the organisation', value: 'everyone in the organisation' },
    ],
  },
  {
    key: 'knowledge',
    text: 'What information should it reference? Choose the approved programme documents it should use.',
    replies: [{ label: 'Choose programme documents', value: '__picker', recommended: true }],
    action: 'open-picker',
  },
  {
    key: 'include',
    text: 'What should its answers include? Select all that apply.',
    multi: true,
    replies: [
      { label: 'Citations to the source', value: 'cite', recommended: true },
      { label: 'Confirmed facts separated from assumptions', value: 'separate', recommended: true },
      { label: 'Progress, milestones, dependencies and risks', value: 'delivery', recommended: true },
      { label: 'Training activity', value: 'training', recommended: true },
      { label: 'Short answers only', value: 'concise' },
    ],
  },
  {
    key: 'gaps',
    text: 'What should it do when information is unavailable?',
    replies: [
      { label: "Say it's missing and suggest a next step", value: 'admit', recommended: true },
      { label: 'Give a best estimate', value: 'estimate' },
      { label: 'Answer from general knowledge', value: 'general' },
    ],
  },
];

export function composeInstructions(answers: BuilderState['answers']): string {
  const audience = answers.audience?.trim() || 'the AI and Automation programme team';
  const include = (answers.include ?? 'cite,separate,delivery,training').split(',');
  const gaps = answers.gaps ?? 'admit';
  const parts: string[] = [`You support ${audience.replace(/\.$/, '')}.`, 'Answer using the selected programme documents.'];
  if (include.includes('cite')) parts.push('Cite the relevant source when making factual claims.');
  if (include.includes('separate')) parts.push('Separate confirmed information from assumptions.');
  if (gaps === 'admit') parts.push('If the information is missing, say so.');
  if (gaps === 'estimate') parts.push('If a figure or date is not available, give your best estimate.');
  if (gaps === 'general') parts.push("If the documents don't cover a question, answer from general knowledge.");
  const topics: string[] = [];
  if (include.includes('delivery')) topics.push('delivery progress, upcoming milestones, dependencies and risks');
  if (include.includes('training')) topics.push(topics.length ? 'training activity' : 'training activity');
  if (topics.length) parts.push(`Summarise ${topics.join(', and ')} in clear business language.`);
  if (include.includes('concise')) parts.push('Keep answers concise.');
  if (gaps === 'admit') parts.push('Do not invent dates, budgets, approvals or owners.');
  return parts.join(' ');
}

export function composeDescription(audience?: string): string {
  const who = audience?.trim() ? audience.trim().replace(/^the /i, 'the ') : 'the programme team';
  return `Helps ${who} understand programme progress, milestones, risks and training activity using approved programme documents.`;
}

const msg = (text: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id: newId('msg'),
  role: 'builder',
  text,
  at: Date.now(),
  ...extra,
});

export function questionMessage(i: number): ChatMessage {
  const q = QUESTIONS[i];
  return msg(q.text, { quickReplies: q.replies, multiSelect: q.multi, builderAction: q.action });
}

function classifyInclude(text: string): string {
  const t = normalise(text);
  const out: string[] = [];
  if (/cit|source|reference/.test(t)) out.push('cite');
  if (/assum|confirm|separate|conflict/.test(t)) out.push('separate');
  if (/progress|milestone|risk|depend|delivery/.test(t)) out.push('delivery');
  if (/train/.test(t)) out.push('training');
  if (/short|concise|brief/.test(t)) out.push('concise');
  return out.join(',');
}

function classifyGaps(text: string): string {
  const t = normalise(text);
  if (/estimat|guess|assume/.test(t)) return 'estimate';
  if (/general|internet|web|own knowledge/.test(t)) return 'general';
  return 'admit';
}

export interface BuilderResult {
  messages: ChatMessage[];
  patch: Partial<Pick<Agent, 'name' | 'description' | 'instructions'>>;
  builder: Partial<BuilderState>;
  openPicker?: boolean;
  starters?: boolean;
}

/** Handle the learner's first description of the agent. */
export function startFromDescription(text: string): BuilderResult {
  const t = normalise(text);
  if (t.length < 12) {
    return {
      messages: [msg(`Tell me what you'd like the agent to do. For example: "${STARTING_INSTRUCTION}"`)],
      patch: {},
      builder: {},
    };
  }
  if (!/(programme|program|project|milestone|risk|training|delivery|knowledge)/.test(t)) {
    return {
      messages: [
        msg(
          `In this training simulation, Agent Builder is set up for the AI programme scenario, so I can't build that agent here. Try describing a programme knowledge agent, for example:\n\n> ${STARTING_INSTRUCTION}`,
        ),
      ],
      patch: {},
      builder: {},
    };
  }
  const named = /(?:create|build|make)\s+(?:an?\s+)?(.+?\bagent)\b/i.exec(text);
  let name = named ? named[1].replace(/^(an?|the)\s+/i, '') : 'AI Programme Knowledge Agent';
  name = name.replace(/\b\w/g, (ch) => ch.toUpperCase()).replace(/\bAi\b/, 'AI');
  if (name.length > 30) name = 'AI Programme Knowledge Agent';
  return {
    messages: [
      msg(`I've started an agent called **${name}**. I'll ask a few questions so it gives accurate, well-sourced answers. You can change anything later on the **Configure** tab.`),
      questionMessage(0),
    ],
    patch: { name, description: composeDescription(), instructions: composeInstructions({}) },
    builder: { stage: 'clarifying', question: 0 },
    starters: true,
  };
}

/** Handle an answer to the current clarifying question (quick reply value or free text). */
export function answerQuestion(state: BuilderState, value: string, knowledgeCount: number): BuilderResult {
  const q = QUESTIONS[state.question];
  if (!q) return refine(value);
  const answers = { ...state.answers };

  if (q.key === 'knowledge') {
    if (value === '__picker' || knowledgeCount === 0) {
      return { messages: [], patch: {}, builder: {}, openPicker: true };
    }
    answers.knowledge = value;
  } else if (q.key === 'include') {
    const v = /^[a-z,]+$/.test(value) ? value : classifyInclude(value);
    answers.include = v || 'cite,separate,delivery,training';
  } else if (q.key === 'gaps') {
    answers.gaps = ['admit', 'estimate', 'general'].includes(value) ? value : classifyGaps(value);
  } else {
    answers.audience = value;
  }

  const patch: BuilderResult['patch'] = { instructions: composeInstructions(answers) };
  if (q.key === 'audience') patch.description = composeDescription(answers.audience);

  const next = state.question + 1;
  const messages: ChatMessage[] = [];
  if (q.key === 'gaps' && answers.gaps !== 'admit') {
    messages.push(
      msg(
        answers.gaps === 'estimate'
          ? `Noted. Be aware: estimates can look like facts to readers. You'll see how this behaves when you test a question the documents can't answer.`
          : `Noted. Answers from general knowledge won't be grounded in your programme documents. You'll see how this behaves when you test it.`,
      ),
    );
  }
  if (next < QUESTIONS.length) {
    messages.push(msg('Updated the instructions.'), questionMessage(next));
    return { messages, patch, builder: { answers, question: next } };
  }
  messages.push(
    msg(
      `Your agent is set up. Review the name, description, instructions, knowledge and suggested prompts on the **Configure** tab, then test it on **Try it** before you select **Create**.`,
      { builderAction: 'go-configure' },
    ),
  );
  return { messages, patch, builder: { answers, question: next, stage: 'done' } };
}

/** After the questions: simple natural-language refinements. */
export function refine(text: string, agent?: Agent): BuilderResult {
  const t = normalise(text);
  const rename = /(?:call it|rename (?:it )?to|name it)\s+["“]?([^"”]+)["”]?/i.exec(text);
  if (rename) {
    const name = rename[1].trim().slice(0, 30);
    return { messages: [msg(`Renamed the agent to **${name}**.`)], patch: { name }, builder: {} };
  }
  if (/(shorter|concise|brief)/.test(t) && agent) {
    if (/keep answers concise/i.test(agent.instructions)) return { messages: [msg('The instructions already ask for concise answers.')], patch: {}, builder: {} };
    return { messages: [msg('Added "Keep answers concise." to the instructions.')], patch: { instructions: agent.instructions.trim() + ' Keep answers concise.' }, builder: {} };
  }
  if (/(add|include).*(source|file|document|knowledge)/.test(t)) {
    return { messages: [msg('Choose the documents to add.')], patch: {}, builder: {}, openPicker: true };
  }
  return {
    messages: [
      msg(
        'In this simulation I can rename the agent ("Call it …"), make answers more concise, or add knowledge sources. For other changes, edit the fields on the **Configure** tab.',
      ),
    ],
    patch: {},
    builder: {},
  };
}
