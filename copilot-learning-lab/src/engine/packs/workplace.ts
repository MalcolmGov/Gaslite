import { normalise } from '../../lib/util';
import type { AgentAnswer, AnswerContext, KnowledgePack } from './types';

/**
 * Practice agents for everyday staff work. Each is a single-document agent
 * defined by rules: answerable questions (test case A, cited) and gaps the
 * source does not cover (test case B, admitted and routed to the right team).
 */

interface Rule {
  match: RegExp;
  intent: string;
  text: string;
}

interface Gap {
  match: RegExp;
  topic: string;
  next: string;
}

interface PackDef {
  id: string;
  docId: string;
  docName: string;
  help: string;
  /** Checked before answers, so "exception" questions are never answered from a nearby rule. */
  gaps: Gap[];
  rules: Rule[];
  outOfScope: string;
}

function makePack(def: PackDef): KnowledgePack {
  const gapIntent = `${def.id}-gap`;
  const gap = (c: AnswerContext, g: Gap): AgentAnswer => ({
    intent: gapIntent,
    testCase: 'B',
    text: c.behaviour.admitGaps ? `The ${def.docName} doesn't cover ${g.topic}. ${g.next}` : `I'm not sure about ${g.topic}.`,
  });
  return {
    id: def.id,
    answer(c) {
      const q = normalise(c.question);
      if (!c.ready.includes(def.docId)) {
        return { intent: 'no-sources', text: `I don't have the ${def.docName} available, so I can't answer reliably.` };
      }
      if (/^(hi|hello|help)\b|what can you/.test(q)) return { intent: 'help', text: def.help };
      const g = def.gaps.find((x) => x.match.test(q));
      if (g) return gap(c, g);
      const r = def.rules.find((x) => x.match.test(q));
      if (r) return { intent: r.intent, testCase: 'A', text: r.text };
      return { intent: 'out-of-scope', text: def.outOfScope };
    },
  };
}

export const proceduresPack = makePack({
  id: 'procedures',
  docId: 'doc_procedures',
  docName: 'Staff Expenses and IT Requests Procedure',
  help: 'I answer questions about the **Staff Expenses and IT Requests Procedure v3.1** (training sample): expense claims, client entertainment, mileage, spend approval limits, laptops and software requests.',
  gaps: [
    {
      match: /(gym|wellness|fitness|parking fine|traffic fine|speeding|personal phone|cellphone contract|home internet)/,
      topic: 'that type of expense',
      next: `It only lists claims, entertainment, mileage and approval limits. Ask your Finance Business Partner (Nomvula Khumalo) before you spend — I won't guess whether it's claimable. [[c:proc-claims]]`,
    },
    {
      match: /(exception|special case|was on leave|on leave|make an exception|late because|extend the deadline)/,
      topic: 'exceptions to the rules',
      next: `It does say claims older than 60 days need written approval from your Finance Business Partner, so ask them directly — I can't approve or interpret an exception. [[c:proc-claims]]`,
    },
  ],
  rules: [
    { match: /(how long|deadline|days).*(claim|submit)|(claim|submit).*(deadline|how long|days|late|receipt)|receipt/, intent: 'proc-claims', text: `Submit claims in the Expenses app **within 60 days**, with an itemised receipt for anything over **R200** (sample figure). Older claims need written approval from your Finance Business Partner. [[c:proc-claims]]` },
    { match: /(client|entertain|dinner|lunch with|customer lunch)/, intent: 'proc-entertain', text: `Client entertainment is capped at **R650 per person** (sample figure). An event over **R5,000** needs pre-approval from your head of department *before* it happens, and you list all attendees on the claim. [[c:proc-entertain]]` },
    { match: /(mileage|kilomet|\bkm\b|own car|my car|drive)/, intent: 'proc-mileage', text: `Business kilometres are paid at **R4.84 per km** (sample rate). Driving between home and your usual office doesn't count as business travel. [[c:proc-mileage]]` },
    { match: /(approv|sign off|authori[sz]e|limit).*(spend|purchase|invoice|po\b|r\d)|who (can )?approves|(spend|purchase).*(approv|limit)/, intent: 'proc-authority', text: `Line managers approve up to **R25,000**, heads of department up to **R250,000**, and anything larger needs the **CFO** (sample limits). You can't approve your own spend. [[c:proc-authority]]` },
    { match: /(laptop|computer|device|broken|repair|replace)/, intent: 'proc-laptop', text: `Laptops are replaced **every four years**, or sooner if IT confirms a fault. Log a replacement or repair in the **IT Service Portal**. [[c:proc-laptop]]` },
    { match: /(software|install|\bapps?\b|tool|extension|chatgpt|ai tool|licen[cs]e)/, intent: 'proc-software', text: `If it's in the **Approved Software Catalogue**, request it in the IT Service Portal (usually installed within 3 business days). Anything else — including free AI tools and browser extensions — needs an **Information Security review** before you use it. [[c:proc-software]]` },
  ],
  outOfScope: `That isn't covered by the Staff Expenses and IT Requests Procedure. I can help with expense claims, client entertainment, mileage, approval limits, laptops and software requests.`,
});

export const compliancePack = makePack({
  id: 'compliance',
  docId: 'doc_compliance',
  docName: 'Customer Complaints and KYC Procedure',
  help: 'I explain the **Customer Complaints and KYC Procedure v2.0** (training sample): complaint timelines, wallet KYC tiers, handling customer information and reporting suspicious activity. I give operational guidance, not legal advice.',
  gaps: [
    {
      match: /(expired|refugee|asylum|foreign national|minor|under 18|child|deceased|power of attorney)/,
      topic: 'that customer situation',
      next: `It only sets out the standard Tier 1 and Tier 2 requirements. Send the case to the **Compliance mailbox** before you act — I won't give an opinion on an exception. [[c:cmp-escalate]]`,
    },
    {
      match: /(legal|lawful|is it allowed by law|popia fine|sue|court|regulator)/,
      topic: 'legal interpretation',
      next: `This procedure is operational guidance, not legal advice. Ask the **Compliance mailbox**. [[c:cmp-escalate]]`,
    },
  ],
  rules: [
    { match: /(acknowledg|how long|timeline|resolve|resolution|days).*(complain)|complain.*(acknowledg|how long|timeline|resolve|days|deadline)/, intent: 'cmp-complaints', text: `Acknowledge a complaint within **2 business days** and resolve it within **15 business days** (sample timelines). If you can't, tell the customer why, give a new date and log the extension. [[c:cmp-complaints]]` },
    { match: /(ombud|still unhappy|not happy)/, intent: 'cmp-ombud', text: `Customers who remain unhappy can be referred to the external ombud — use the referral wording in the complaints template library. [[c:cmp-complaints]]` },
    { match: /(tier|kyc|limit|upgrade|proof of address|balance)/, intent: 'cmp-kyc', text: `**Tier 1** needs a valid ID or passport and a selfie check, with a **R5,000** balance limit. **Tier 2** adds proof of address (not older than 3 months), with a **R25,000** limit (sample limits). Customers upgrade in the app — staff never upgrade a tier manually. [[c:cmp-kyc]]` },
    { match: /(email|send|share|whatsapp|chat).*(\bid\b|document|account number|\bpin\b|personal)|(\bid\b|personal information|\bpin\b).*(email|send|share)|popia|mask/, intent: 'cmp-data', text: `Never send ID documents, full account numbers or PINs by email or chat, and use only the information the case needs. Refer to customers by their **masked reference** (for example CUS-••4471) internally. [[c:cmp-data]]` },
    { match: /(suspicious|launder|fraud|mlro|report)/, intent: 'cmp-suspicious', text: `Report it to the **MLRO** through the internal suspicious activity form **within 24 hours**. Don't tell the customer a report has been made. [[c:cmp-suspicious]]` },
  ],
  outOfScope: `That isn't covered by the Customer Complaints and KYC Procedure. I can help with complaint timelines, KYC tiers, customer information and suspicious activity reporting. For anything else, ask the Compliance mailbox.`,
});

export const onboardingPack = makePack({
  id: 'onboarding',
  docId: 'doc_onboarding',
  docName: 'New Joiner Guide',
  help: 'I help new joiners with the **New Joiner Guide — Fintech Operations** (training sample): your first day, systems access, mandatory training, who to ask, and common terms.',
  gaps: [
    {
      match: /(payday|salary|paid|payslip|leave balance|annual leave|how much leave|bonus|medical aid|pension)/,
      topic: 'pay or leave details',
      next: `Ask your People & Culture business partner, **Zanele Mthembu**, or check the HR self-service portal. [[c:onb-people]]`,
    },
    {
      match: /(dress code|wear|canteen|lunch|gym)/,
      topic: 'that',
      next: `Your onboarding buddy is the best person to ask — they're named in your welcome email. [[c:onb-people]]`,
    },
  ],
  rules: [
    { match: /(first day|day one|day 1|what time|arrive|where do i go|reception)/, intent: 'onb-day1', text: `Arrive at **08:30** at reception, where your manager meets you. Collect your laptop from the **IT Service Desk** (ground floor) and your access card from **Security**. [[c:onb-day1]]` },
    { match: /(access|power ?bi|system|mfa|multi.factor|password|login|log in)/, intent: 'onb-access', text: `Email and Teams are ready on day one — set up **multi-factor authentication before 12:00**. Request other systems, like the case management tool or Power BI, in the **IT Service Portal**; your manager approves it. [[c:onb-access]]` },
    { match: /(training|course|mandatory|compulsory|learning)/, intent: 'onb-training', text: `Complete three courses in the learning portal **within 30 days**: Protecting Personal Information (POPIA), Anti-Money Laundering Essentials, and Information Security Basics. [[c:onb-training]]` },
    { match: /(who (do|should) i (ask|contact)|buddy|\bhr\b|people (and|&) culture|it desk|service desk|facilities|parking)/, intent: 'onb-people', text: `Your **onboarding buddy** is named in your welcome email. People & Culture: **Zanele Mthembu**. IT: the **IT Service Portal** or ext. 4000 (sample). Facilities and parking: the **Facilities request form**. [[c:onb-people]]` },
    { match: /(what (is|does)|mean|stand for|glossary|kyc|mlro|raid|momo|\bp1\b|\bp2\b|\bp3\b)/, intent: 'onb-glossary', text: `From the glossary: **MoMo** is the mobile money wallet; **KYC** is Know Your Customer checks; **MLRO** is the Money Laundering Reporting Officer; **RAID** is the Risks, Actions, Issues and Decisions log; **P1–P3** are case priorities, P1 most urgent. [[c:onb-glossary]]` },
  ],
  outOfScope: `That isn't in the New Joiner Guide. I can help with your first day, systems access, mandatory training, who to ask, and common terms.`,
});
