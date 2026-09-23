import { settings } from '../../config/settings';
import { tableRows } from '../../scenario/registry';
import { fmtDate } from '../../lib/util';
import { recipientFor } from './common';
import type { CoworkScenario } from './scenarios';

/**
 * Cowork practice scenarios for everyday staff work: meeting follow-up,
 * weekly KPI reporting and support case triage. Outputs are generated from
 * the attached fixture documents.
 */

const L = settings.learner;
const sign = ['', 'Kind regards,', L.displayName];
const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// ─────────────────────────── Meeting to actions ───────────────────────────

export const SYNC = 'doc_sync_transcript';

const syncActions = [
  { action: 'Send backlog numbers to confirm the backlog is dropping', owner: 'Kwame Mensah', due: '2026-09-25', cite: 'syn-part1' },
  { action: 'Draft the merchant communications plan for the campaign', owner: 'Lerato Dlamini', due: '2026-09-30', cite: 'syn-part2' },
  { action: 'Update the training schedule for the merchant support team', owner: 'Sipho Mahlangu', due: '2026-10-02', cite: 'syn-part3' },
  { action: 'Book the go/no-go check', owner: 'Johan van Wyk', due: '2026-10-07', cite: 'syn-part3' },
];

function followUpBody(): string {
  return [
    'Hi all,',
    '',
    'Thanks for the sync today. Notes and actions below.',
    '',
    'Decision: the campaign launch stays on 12 October.',
    '',
    'Actions:',
    ...syncActions.map((a) => `- ${a.owner}: ${a.action} — by ${fmtDate(a.due)}`),
    '',
    'Parked for Q1 planning: a WhatsApp chatbot for merchants (no action now).',
    ...sign,
  ].join('\n');
}

export const actionsScenario: CoworkScenario = {
  id: 'actions',
  title: 'Turn the sync transcript into actions',
  defaultPrompt:
    "Read the Merchant Onboarding weekly sync transcript, list the decisions and the action items with owners and due dates, and draft the follow-up email to the attendees for my review.",
  defaultFiles: [SYNC],
  parseRequest: () => ({ update: true, email: true, meeting: false, reviewFirst: true }),
  planSteps: () => ['Read the meeting transcript', 'Separate decisions, actions and parked ideas', 'Check for actions that were reassigned', 'Draft the follow-up email for your approval'],
  steps() {
    return [
      { kind: 'think', ms: 700 },
      { kind: 'say', text: () => "I'll pull the decisions and action items from the transcript and draft the follow-up email. Nothing is sent without your approval." },
      { kind: 'question', id: 'to' },
      { kind: 'tool', text: 'Reading the meeting transcript', ms: 1000 },
      { kind: 'skill', skill: 'Meetings', text: 'Preparing meeting intelligence' },
      { kind: 'tool', text: 'Checking for actions that changed owner during the meeting', ms: 800 },
      { kind: 'tool', text: 'Drafting the follow-up email', ms: 900 },
      { kind: 'artifacts', keys: ['actions', 'escalation'] },
      { kind: 'say', text: () => 'The notes and follow-up email are ready. Check each owner against the transcript before approving the email.' },
      { kind: 'actions' },
      { kind: 'finish' },
    ];
  },
  question() {
    return {
      id: 'to',
      prompt: 'Who should receive the notes and actions?',
      options: [
        { value: 'all', label: 'All attendees', detail: 'Johan, Sipho, Lerato and Kwame' },
        { value: 'chair', label: 'Johan van Wyk (chair) only' },
      ],
    };
  },
  artifactSpecs: () => [
    { key: 'actions', title: 'Decisions and actions', baseName: 'sync-actions', format: 'md', editable: true },
    { key: 'escalation', title: 'Follow-up email', baseName: 'sync-follow-up', format: 'eml', editable: true },
  ],
  generate(key) {
    if (key === 'escalation') return followUpBody();
    if (key === 'summary') return `# Task summary\n\n- ${syncActions.length} actions and 1 decision captured from the 22 Sep sync.`;
    return [
      '# Merchant Onboarding Weekly Sync — Decisions and actions',
      `**${fmtDate('2026-09-22')} · Chair: Johan van Wyk** [[c:syn-attendees]]`,
      '',
      '## Decisions',
      '- The campaign launch stays on **12 October**. [[c:syn-part3]]',
      '',
      '## Actions',
      '| # | Action | Owner | Due |',
      '|---|---|---|---|',
      ...syncActions.map((a, i) => `| ${i + 1} | ${a.action} | ${a.owner} | ${fmtDate(a.due)} |`),
      '',
      '[[c:syn-part1]] [[c:syn-part2]] [[c:syn-part3]]',
      '',
      '## Parked — no action now',
      '- WhatsApp chatbot for merchants, for the Q1 planning session. [[c:syn-part2]]',
      '',
      '> The comms plan was first asked of Sipho, then reassigned to **Lerato** in the meeting. [[c:syn-part2]]',
    ].join('\n');
  },
  actions(t, ids) {
    const to = t.answers['to'] === 'chair' ? ['usr_johan'] : ['usr_johan', 'usr_sipho', 'usr_lerato', 'usr_kwame'];
    return {
      email: {
        to: to.map((id) => recipientFor(id)!),
        cc: [],
        subject: 'Notes and actions — Merchant Onboarding weekly sync, 22 Sep',
        body: followUpBody(),
        attachments: [ids.actions].filter(Boolean),
      },
    };
  },
  summaryIntro: () => 'Done. Here is what happened.',
};

// ─────────────────────────── Weekly KPI status ───────────────────────────

export const KPI = 'doc_kpi_scorecard';
const WEEK_END = '2026-09-20';

interface KpiRow {
  kpi: string;
  target: number;
  now: number;
  last: number;
  higher: boolean;
  dataDate: string;
  note: string;
  stale: boolean;
  provisional: boolean;
  onTarget: boolean;
}

function kpis(): KpiRow[] {
  return tableRows(KPI, 'kpi-table').map((r) => {
    const [kpi, target, now, last, better, dataDate, note] = r;
    const t = Number(target);
    const n = Number(now);
    const higher = better === 'Higher';
    return {
      kpi, target: t, now: n, last: Number(last), higher, dataDate, note,
      stale: dataDate < WEEK_END,
      provisional: /provisional/i.test(note),
      onTarget: higher ? n >= t : n <= t,
    };
  });
}

const num = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-ZA').replace(/\u00a0/g, ' ') : String(n));
const variance = (k: KpiRow) => {
  const d = +(k.now - k.target).toFixed(2);
  const pct = ((k.now - k.target) / k.target) * 100;
  return `${d > 0 ? '+' : ''}${num(d)} (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)`;
};

function statusReport(omitProvisional: boolean): string {
  const all = kpis();
  const shown = all.filter((k) => !(omitProvisional && k.provisional));
  const assessed = shown.filter((k) => !k.stale);
  const off = assessed.filter((k) => !k.onTarget);
  const on = assessed.filter((k) => k.onTarget);
  const stale = shown.filter((k) => k.stale);
  const row = (k: KpiRow) => `| ${k.kpi}${k.provisional ? ' (provisional)' : ''} | ${num(k.target)} | ${num(k.now)} | ${num(k.last)} | ${variance(k)} |`;
  const head = ['| KPI | Target | This week | Last week | Variance to target |', '|---|---|---|---|---|'];
  const best = on.filter((k) => !k.provisional).sort((a, b) => Math.abs(b.now - b.target) / b.target - Math.abs(a.now - a.target) / a.target)[0];
  return [
    '# Fintech Operations — Weekly status, week 38',
    `**Week ending ${fmtDate(WEEK_END)} · Source: KPI Scorecard W38** [[c:kpi-table]]`,
    '',
    '## Headline',
    `${off.length} of ${assessed.length} KPIs assessed this week are off target.${best ? ` ${best.kpi} beat target (${num(best.now)} vs ${num(best.target)}).` : ''}`,
    '',
    '## Off target',
    ...head,
    ...off.map(row),
    '',
    '- Transaction success: switch outage on 17 Sep (42 minutes). The vendor fix is scheduled for 29 Sep. [[c:kpi-context]]',
    '- Complaint resolution: two agents are on training this month. [[c:kpi-context]]',
    '',
    '## On target',
    ...head,
    ...on.map(row),
    '',
    '## Check before sharing',
    ...stale.map((k) => `- **${k.kpi}** was not updated this week (data date ${fmtDate(k.dataDate)}), so it is not assessed. [[c:kpi-table]]`),
    omitProvisional
      ? '- Fraud losses are left out because the figure is provisional (Finance to confirm 25 Sep). [[c:kpi-table]]'
      : '- Fraud losses are **provisional** until Finance confirms on 25 Sep. [[c:kpi-table]]',
  ].join('\n');
}

function kpiCsv(omitProvisional: boolean): string {
  const rows = kpis().filter((k) => !(omitProvisional && k.provisional));
  return [
    ['KPI', 'Target', 'This week', 'Last week', 'Variance', 'Status', 'Data date', 'Note'].join(','),
    ...rows.map((k) =>
      [k.kpi, String(k.target), String(k.now), String(k.last), String(+(k.now - k.target).toFixed(2)), k.stale ? 'Not assessed (stale data)' : k.onTarget ? 'On target' : 'Off target', k.dataDate, k.note]
        .map(csvCell)
        .join(','),
    ),
  ].join('\r\n');
}

function statusEmail(): string {
  const off = kpis().filter((k) => !k.stale && !k.onTarget);
  return [
    'Hi Thandi,',
    '',
    `Please find attached the Fintech Operations status for the week ending ${fmtDate(WEEK_END)}.`,
    '',
    `${off.length} KPIs are off target:`,
    ...off.map((k) => `- ${k.kpi}: ${num(k.now)} against a target of ${num(k.target)}`),
    '',
    'The app store rating was not updated this week, and fraud losses are provisional until Finance confirms on 25 Sep.',
    ...sign,
  ].join('\n');
}

export const statusScenario: CoworkScenario = {
  id: 'status',
  title: 'Draft the weekly operations status',
  defaultPrompt:
    'Use the Fintech Operations KPI scorecard to draft this week\'s status report: what is off target, why, and anything I should check before it goes to Thandi. Draft the covering email for my review.',
  defaultFiles: [KPI],
  parseRequest: () => ({ update: true, email: true, meeting: false, reviewFirst: true }),
  planSteps: () => ['Read the KPI scorecard', 'Compare each KPI with its target', 'Flag stale or provisional figures', 'Draft the report and covering email for your approval'],
  steps() {
    return [
      { kind: 'think', ms: 700 },
      { kind: 'say', text: () => "I'll compare each KPI with its target, explain the misses from the owners' notes, and flag anything that isn't safe to report yet." },
      { kind: 'question', id: 'provisional' },
      { kind: 'tool', text: 'Reading the KPI scorecard', ms: 1000 },
      { kind: 'tool', text: 'Comparing results with targets', ms: 800 },
      { kind: 'tool', text: 'Checking data dates and provisional figures', ms: 800 },
      { kind: 'skill', skill: 'Documents', text: 'Preparing the status report' },
      { kind: 'artifacts', keys: ['status', 'table', 'escalation'] },
      { kind: 'say', text: () => 'The report, KPI table and covering email are ready. Check the "Check before sharing" section before you approve the email.' },
      { kind: 'actions' },
      { kind: 'finish' },
    ];
  },
  question() {
    return {
      id: 'provisional',
      prompt: 'Some figures are marked provisional. How should I treat them?',
      options: [
        { value: 'label', label: 'Include them, clearly labelled as provisional' },
        { value: 'omit', label: 'Leave them out of the report' },
      ],
    };
  },
  artifactSpecs: () => [
    { key: 'status', title: 'Weekly operations status', baseName: 'weekly-ops-status', format: 'md', editable: true },
    { key: 'table', title: 'KPI variance table', baseName: 'kpi-variance', format: 'csv', editable: false },
    { key: 'escalation', title: 'Covering email', baseName: 'status-covering-email', format: 'eml', editable: true },
  ],
  generate(key, t) {
    const omit = t.answers['provisional'] === 'omit';
    if (key === 'table') return kpiCsv(omit);
    if (key === 'escalation') return statusEmail();
    if (key === 'summary') return '# Task summary\n\n- Weekly status drafted from the week 38 scorecard.';
    return statusReport(omit);
  },
  actions(_t, ids) {
    return {
      email: {
        to: [recipientFor('usr_thandi')!],
        cc: [recipientFor('usr_pieter')!],
        subject: `Fintech Operations weekly status — week ending ${fmtDate(WEEK_END)}`,
        body: statusEmail(),
        attachments: [ids.status, ids.table].filter(Boolean),
      },
    };
  },
  summaryIntro: () => 'Done. Here is what happened.',
};

// ─────────────────────────── Support case triage ───────────────────────────

export const CASES = 'doc_case_queue';

const CATEGORY: Record<string, { category: string; kind: 'fraud' | 'access' | 'failed' | 'fees' | 'complaint' }> = {
  'C-2201': { category: 'Unauthorised transaction reported', kind: 'fraud' },
  'C-2202': { category: 'Failed airtime purchase', kind: 'failed' },
  'C-2203': { category: 'Fee question', kind: 'fees' },
  'C-2204': { category: 'Refund complaint', kind: 'complaint' },
  'C-2205': { category: 'Possible SIM swap', kind: 'fraud' },
  'C-2206': { category: 'Account access (PIN shared in message)', kind: 'access' },
};

interface Triaged { id: string; ref: string; days: number; priority: 'P1' | 'P2' | 'P3'; category: string; next: string }

function triage(): Triaged[] {
  const out = tableRows(CASES, 'case-table').map(([id, ref, , daysOpen]) => {
    const c = CATEGORY[id] ?? { category: 'Unclassified', kind: 'fees' as const };
    const days = Number(daysOpen);
    let priority: Triaged['priority'] = 'P3';
    let next = 'Reply with the approved fees template';
    if (c.kind === 'fraud') { priority = 'P1'; next = 'Escalate to Risk today'; }
    else if (days >= 12) { priority = 'P1'; next = `Resolve or send an extension today — ${15 - days} business day(s) left of 15`; }
    else if (c.kind === 'failed') { priority = 'P2'; next = 'Check the transaction within 1 business day'; }
    else if (c.kind === 'access') { priority = 'P2'; next = 'Check within 1 business day; advise the customer to change their PIN'; }
    const category = c.kind === 'complaint' ? `${c.category} (${days} business days open)` : c.category;
    return { id, ref, days, priority, category, next };
  });
  return out.sort((a, b) => a.priority.localeCompare(b.priority));
}

function triageSheet(): string {
  const rows = triage();
  return [
    '# Support case triage — 22 Sep 2026',
    `**${rows.length} cases · queue export 07:45** [[c:case-table]]`,
    '',
    '| Case | Customer ref | Priority | Category | Next step |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.id} | ${r.ref} | ${r.priority} | ${r.category} | ${r.next} |`),
    '',
    'Rules applied from the triage guide. [[c:case-guide]]',
    '',
    "> C-2206's message included the customer's PIN. It has not been copied into this sheet, the replies or the escalation. [[c:case-guide]]",
  ].join('\n');
}

function customerReplies(): string {
  return [
    '# Draft customer replies — review before sending',
    '',
    '## C-2203 · fee question',
    'Hello,',
    '',
    'Thank you for your message. A small fee applies when you send money to another wallet. You can see the fee on the confirmation screen before you approve a payment, and in the fee table in the app under Help › Fees. [[c:case-fees]]',
    '',
    '## C-2206 · account access',
    'Hello,',
    '',
    "We're looking into your login problem and will update you within 1 business day. For your security, please change your PIN in the app as soon as you can log in, and never share your PIN with anyone — including our staff. [[c:case-guide]]",
  ].join('\n');
}

function riskEmail(): string {
  const p1 = triage().filter((r) => r.priority === 'P1');
  return [
    'Hi Aisha,',
    '',
    `${p1.length} support cases need same-day attention from Risk:`,
    '',
    ...p1.map((r) => `- ${r.id} (${r.ref}): ${r.category}. ${r.next}.`),
    '',
    'Customer references are masked. The case details are in the triage sheet attached.',
    ...sign,
  ].join('\n');
}

export const triageScenario: CoworkScenario = {
  id: 'triage',
  title: "Triage today's support cases",
  defaultPrompt:
    "Triage today's MoMo support case queue using the triage guide: set a priority and next step for each case, draft replies for the simple ones, and prepare the same-day escalation to Risk for my review.",
  defaultFiles: [CASES],
  parseRequest: () => ({ update: true, email: true, meeting: false, reviewFirst: true }),
  planSteps: () => ['Read the case queue and triage guide', 'Set a priority and next step for each case', 'Draft replies for the simple cases', 'Prepare the Risk escalation for your approval'],
  steps() {
    return [
      { kind: 'think', ms: 700 },
      { kind: 'say', text: () => "I'll apply the triage guide to each case. I won't copy PINs or full personal details into anything I draft." },
      { kind: 'question', id: 'escalate' },
      { kind: 'tool', text: 'Reading the case queue', ms: 1000 },
      { kind: 'tool', text: 'Applying the triage guide', ms: 900 },
      { kind: 'tool', text: 'Checking complaint ages against the 15-day limit', ms: 700 },
      { kind: 'skill', skill: 'Communications', text: 'Drafting customer replies' },
      { kind: 'artifacts', keys: ['triage', 'reply', 'escalation'] },
      { kind: 'say', text: () => 'The triage sheet and draft replies are ready. Check the P1 cases against the queue before anything is sent.' },
      { kind: 'actions' },
      { kind: 'finish' },
    ];
  },
  question() {
    return {
      id: 'escalate',
      prompt: 'Should I prepare the same-day escalation email to Risk for the P1 cases?',
      options: [
        { value: 'yes', label: 'Yes — to Aisha Patel, for my approval' },
        { value: 'no', label: 'No, the triage sheet and replies only' },
      ],
    };
  },
  artifactSpecs: (t) => [
    { key: 'triage', title: 'Case triage sheet', baseName: 'case-triage', format: 'md', editable: true },
    { key: 'reply', title: 'Draft customer replies', baseName: 'customer-replies', format: 'md', editable: true },
    ...(t.answers['escalate'] === 'no' ? [] : [{ key: 'escalation' as const, title: 'Risk escalation email', baseName: 'risk-escalation', format: 'eml' as const, editable: true }]),
  ],
  generate(key) {
    if (key === 'reply') return customerReplies();
    if (key === 'escalation') return riskEmail();
    if (key === 'summary') return '# Task summary\n\n- 6 cases triaged; 3 marked P1.';
    return triageSheet();
  },
  actions(t, ids) {
    if (t.answers['escalate'] === 'no') return {};
    return {
      email: {
        to: [recipientFor('usr_aisha')!],
        cc: [],
        subject: 'Same-day escalation: P1 support cases, 22 Sep',
        body: riskEmail(),
        attachments: [ids.triage].filter(Boolean),
      },
    };
  },
  summaryIntro: () => 'Done. Here is what happened.',
};
