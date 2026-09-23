/**
 * Reads an agent's free-text instructions into behaviour flags.
 *
 * This is a deterministic training approximation of how instructions steer a
 * real model. It looks for the intent of a sentence rather than exact wording,
 * so learners can phrase things their own way. The flags drive the simulated
 * answers, so editing instructions visibly changes behaviour.
 */
export interface Behaviour {
  /** Cite sources for factual claims. */
  cite: boolean;
  /** Say when information is missing. */
  admitGaps: boolean;
  /** Explicitly forbidden from inventing dates, budgets, owners... */
  noInvent: boolean;
  /** Point out conflicting sources / separate confirmed facts from assumptions. */
  flagConflicts: boolean;
  /** Prefer short answers. */
  concise: boolean;
  /** Invites a "best estimate" when information is missing (a risky instruction). */
  estimates: boolean;
  /** Mentions who the agent supports. */
  audience?: string;
}

const has = (t: string, re: RegExp) => re.test(t);

export function readInstructions(text: string): Behaviour {
  const t = text.toLowerCase();
  const negatedCite = has(t, /(do not|don't|never|no need to)\s+(cite|include (citations|sources)|reference sources)/);
  const estimates = has(t, /(best (estimate|guess)|estimate (it|a figure|the (value|number))|make a reasonable assumption|fill (in )?the gaps?)/);
  const audienceMatch = /you (support|help|assist|serve) ([^.]+)\./i.exec(text);
  return {
    cite: !negatedCite && has(t, /\b(cite|citation|citations|reference the (relevant )?source|name the source|link to the source|show (the |your )?sources?)\b/),
    admitGaps:
      !estimates &&
      has(t, /(missing|unavailable|not available|isn't available|is not available|say so|say you don't know|don't know|do not know|not in the (documents|sources)|can't find|cannot find|no information)/),
    noInvent: has(t, /(do not|don't|never|must not)\s+(invent|guess|make up|fabricate|speculate)/),
    flagConflicts: has(t, /(conflict|contradict|separate confirmed|confirmed information from assumptions|assumption|newer|newest|most recent|latest version|which source is)/),
    concise: has(t, /\b(concise|brief|short|succinct|one paragraph)\b/),
    estimates,
    audience: audienceMatch ? audienceMatch[2].trim() : undefined,
  };
}

/** Plain-language list of what the simulator detected, for learner feedback. */
export function describeBehaviour(b: Behaviour): { label: string; on: boolean }[] {
  return [
    { label: 'Cites sources for factual claims', on: b.cite },
    { label: 'Says when information is missing', on: b.admitGaps },
    { label: 'Must not invent dates, budgets or owners', on: b.noInvent },
    { label: 'Flags conflicting or outdated sources', on: b.flagConflicts },
    { label: 'Keeps answers concise', on: b.concise },
    { label: 'Allowed to estimate missing values (risky)', on: b.estimates },
  ];
}
