import { normalise } from '../../lib/util';
import type { AgentAnswer, AnswerContext, KnowledgePack } from './types';

/** Practice exercise: answer employee questions from a fictional policy. */

const POL = 'doc_policy';

function gap(c: AnswerContext, topic: string, next: string): AgentAnswer {
  return {
    intent: 'policy-gap',
    testCase: 'B',
    text: c.behaviour.admitGaps
      ? `The Hybrid Work and Travel Policy doesn't include ${topic}. ${next}`
      : `I'm not sure about ${topic}.`,
  };
}

export const policyPack: KnowledgePack = {
  id: 'policy',
  answer(c) {
    const q = normalise(c.question);
    if (!c.ready.includes(POL)) {
      return { intent: 'no-sources', text: `I don't have the policy document available, so I can't answer policy questions reliably.` };
    }
    if (/^(hi|hello|help)|what can you/.test(q)) {
      return { intent: 'help', text: `I answer questions about the **Hybrid Work and Travel Policy v4.2** (training sample). Ask about office days, home office equipment, travel booking, approvals or allowances.` };
    }
    if (/(lagos|nairobi|accra|dubai|london|international|abroad|overseas).*(per ?diem|allowance|daily)|(per ?diem|allowance|daily).*(lagos|nairobi|accra|dubai|london|international|abroad|overseas)/.test(q)) {
      return gap(
        c,
        'the international daily allowance amounts',
        `It says international allowances follow the separate **Finance allowance schedule**. [[c:pol-allowances]] Check that schedule or ask the Travel Desk — I won't guess an amount.`,
      );
    }
    if (/(office|anchor).*(day|days)|days.*(office|in the office)|how many days|hybrid/.test(q)) {
      return { intent: 'policy-hybrid', testCase: 'A', text: `Hybrid employees work from the office **at least two days per week**, on anchor days agreed with their manager. Fully remote arrangements need HR approval. [[c:pol-hybrid]]` };
    }
    if (/(internet|wifi|wi-fi|data|electricity|power)/.test(q)) {
      return { intent: 'policy-internet', testCase: 'A', text: `No. Home internet and electricity are **not reimbursed** under the policy. [[c:pol-equipment]] The once-off home office allowance covers equipment, with receipts.` };
    }
    if (/(equipment|chair|desk|monitor|allowance for home|home office)/.test(q)) {
      return { intent: 'policy-equipment', testCase: 'A', text: `Hybrid employees can claim a once-off home office allowance of **up to R3,500 (sample figure) every three years**, with receipts. [[c:pol-equipment]]` };
    }
    if (/(book|booking|travel desk|how far in advance|notice)/.test(q)) {
      return { intent: 'policy-booking', testCase: 'A', text: `Book through the **Travel Desk** — at least **7 days** ahead for domestic trips and **14 days** for international trips, unless your manager approves an exception. [[c:pol-booking]]` };
    }
    if (/(approv|who signs|sign off|permission).*(travel|trip)|(travel|trip).*(approv|sign)/.test(q)) {
      return { intent: 'policy-approval', testCase: 'A', text: `Domestic travel is approved by your **line manager**. International travel needs approval from an **executive committee member** before booking. [[c:pol-approval]]` };
    }
    if (/(hotel|accommodation|per ?diem|daily allowance|meal)/.test(q)) {
      return { intent: 'policy-allowance', testCase: 'A', text: `For domestic travel, accommodation is capped at **R1,800 per night** and the daily allowance is **R450** (sample figures). [[c:pol-allowances]] International allowances are in the separate Finance allowance schedule.` };
    }
    if (/(parental|leave|maternity|sick|bonus|salary|pension|medical aid)/.test(q)) {
      return gap(c, 'that topic', `It only covers hybrid work, home office equipment and business travel. Check the relevant HR policy or ask People & Culture.`);
    }
    return {
      intent: 'out-of-scope',
      text: `That isn't covered by the Hybrid Work and Travel Policy. I can answer questions about office days, home office equipment, travel booking, approvals and allowances.`,
    };
  },
};
