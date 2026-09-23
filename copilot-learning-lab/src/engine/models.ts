/**
 * AI model choice for agents, as documented for Copilot Studio (Microsoft Learn,
 * reviewed 23 Sep 2026). Agent Builder in Microsoft 365 Copilot has no model
 * picker: Microsoft chooses and updates the model. Choosing a model per agent
 * happens in Copilot Studio. Availability shown is for South Africa.
 */

export type ModelTier = 'General' | 'Auto' | 'Deep';

export interface ModelOption {
  id: string;
  name: string;
  tier: ModelTier;
  release: 'Default' | 'GA' | 'Preview';
  provider: string;
  /** Hosted outside Microsoft; an admin must allow the provider first. */
  external: boolean;
  /** Listed as cross-geo for South Africa: data may be processed outside the region. */
  crossGeo: boolean;
}

export const MODELS: ModelOption[] = [
  { id: 'gpt-5.5-chat', name: 'GPT-5.5 Chat', tier: 'General', release: 'Default', provider: 'OpenAI, hosted by Microsoft', external: false, crossGeo: false },
  { id: 'gpt-4.1', name: 'GPT-4.1', tier: 'General', release: 'GA', provider: 'OpenAI, hosted by Microsoft', external: false, crossGeo: true },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6', tier: 'General', release: 'GA', provider: 'Anthropic', external: true, crossGeo: true },
  { id: 'gpt-5-auto', name: 'GPT-5 Auto', tier: 'Auto', release: 'Preview', provider: 'OpenAI, hosted by Microsoft', external: false, crossGeo: true },
  { id: 'gpt-5-reasoning', name: 'GPT-5 Reasoning', tier: 'Deep', release: 'Preview', provider: 'OpenAI, hosted by Microsoft', external: false, crossGeo: true },
  { id: 'claude-opus-4.7', name: 'Claude Opus 4.7', tier: 'Deep', release: 'GA', provider: 'Anthropic', external: true, crossGeo: true },
];

export const TIERS: Record<ModelTier, { bestFor: string; speed: string; cost: string }> = {
  General: { bestFor: 'FAQ answers from documents, summaries, drafting', speed: 'Fastest', cost: 'Lowest' },
  Auto: { bestFor: 'Mixed questions; routes each one to a lighter or deeper model', speed: 'Varies', cost: 'Varies' },
  Deep: { bestFor: 'Multi-step analysis, policy and contract review, long documents', speed: 'Slowest', cost: 'Highest' },
};

export const modelById = (id?: string) => MODELS.find((m) => m.id === id);

/** Copilot Studio billing rates (Copilot Credits), Microsoft Learn, Sep 2026. */
export const RATES = {
  generativeAnswer: 2,
  tenantGraphGrounding: 10,
  /** Reasoning models add "text and generative AI tools (premium)" per 1,000 tokens. */
  premiumPer1kTokens: 10,
};

export interface CostInput {
  tier: ModelTier;
  licensedUsers: number;
  unlicensedUsers: number;
  questionsPerDay: number;
  /** Answers search the organisation's Microsoft 365 data (tenant graph grounding). */
  grounding: boolean;
  /** Assumed reasoning tokens per answer for Deep models. */
  reasoningTokens?: number;
  workdays?: number;
}

export interface CostEstimate {
  /** Credits per answer for an unlicensed user: lowest and highest (they differ only for Auto). */
  perAnswer: [number, number];
  /** Credits per month for all unlicensed users: lowest and highest. */
  monthly: [number, number];
  /** Answers per month for licensed users, which are included in their licence. */
  includedAnswers: number;
}

export function estimateCredits(i: CostInput): CostEstimate {
  const tokens = i.reasoningTokens ?? 1500;
  const days = i.workdays ?? 22;
  const base = RATES.generativeAnswer + (i.grounding ? RATES.tenantGraphGrounding : 0);
  const premium = (tokens / 1000) * RATES.premiumPer1kTokens;
  const perAnswer: [number, number] = i.tier === 'General' ? [base, base] : i.tier === 'Deep' ? [base + premium, base + premium] : [base, base + premium];
  const answers = Math.max(0, i.unlicensedUsers) * Math.max(0, i.questionsPerDay) * days;
  return {
    perAnswer,
    monthly: [perAnswer[0] * answers, perAnswer[1] * answers],
    includedAnswers: Math.max(0, i.licensedUsers) * Math.max(0, i.questionsPerDay) * days,
  };
}
