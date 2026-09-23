import { settings } from '../../config/settings';
import { getDoc, sectionText, tableRows, BRIEF_SOURCE_ID } from '../../scenario/registry';
import { fmtDate, fmtDateLong, fmtDateShort, normalise } from '../../lib/util';
import type { Artifact, EmailPayload, MeetingPayload, Recipient, ScenarioId, Task, TaskQuestion } from '../model';
import { firstFreeSlot, recipientFor } from './common';
import { actionsScenario, CASES, KPI, statusScenario, SYNC, triageScenario } from './workplace';

/**
 * Cowork scenario definitions: the scripted steps a task runs through, the
 * clarifying questions it asks, and generators for its outputs.
 * Outputs are generated from the fixture documents attached to the task, so
 * changing the attached files (or the fixtures) changes the outputs.
 */

export type Step =
  | { kind: 'think'; ms: number }
  | { kind: 'say'; text: (t: Task) => string }
  | { kind: 'plan' }
  | { kind: 'question'; id: string; when?: (t: Task) => boolean }
  | { kind: 'skill'; skill: string; text: string; when?: (t: Task) => boolean }
  | { kind: 'tool'; text: string; ms: number; when?: (t: Task) => boolean; check?: 'source-dates' }
  | { kind: 'artifacts'; keys: Artifact['key'][] }
  | { kind: 'actions' }
  | { kind: 'finish' };

export interface ArtifactSpec {
  key: Artifact['key'];
  title: string;
  baseName: string;
  format: Artifact['format'];
  editable: boolean;
}

export interface CoworkScenario {
  id: ScenarioId;
  title: string;
  defaultPrompt: string;
  defaultFiles: string[];
  parseRequest(prompt: string): Task['requested'];
  steps(t: Task): Step[];
  question(id: string, t: Task): TaskQuestion;
  artifactSpecs(t: Task): ArtifactSpec[];
  generate(key: Artifact['key'], t: Task, extra: GenerateExtra): string;
  /** Build outbound actions once outputs exist. */
  actions(t: Task, artifactIdByKey: Record<string, string>): { email?: EmailPayload; meeting?: MeetingPayload };
  planSteps(t: Task): string[];
  summaryIntro(t: Task): string;
}

export interface GenerateExtra {
  /** Resolved state of actions, for the completion summary. */
  actionOutcomes?: string[];
}

const L = settings.learner;
const TODAY = settings.scenario.today;
const TZ = settings.scenario.timeZone;
const TZL = settings.scenario.timeZoneLabel;

// ─────────────────────────── Main scenario ───────────────────────────

export const MAIN_PROMPT =
  'Using the reviewed programme briefing and weekly tracker, prepare a one-page leadership update, draft an email to the programme leadership group, and propose a 30-minute follow-up meeting for unresolved risks. Let me review the outputs before any communication is sent.';

function trackerId(t: Task): 'doc_tracker38' | 'doc_tracker35' | null {
  if (t.context.files.includes('doc_tracker38')) return 'doc_tracker38';
  if (t.context.files.includes('doc_tracker35')) return 'doc_tracker35';
  return null;
}

interface ProgrammeView {
  trackerId: string | null;
  stale: boolean;
  dataDate: string;
  status: string[][];
  milestones: string[][];
  risks: { id: string; text: string; rating: string; owner: string; mitigation: string }[];
  statusCite: string;
  milestoneCite: string;
  riskCite: string;
  pilotDate: string;
  pilotStatus: string;
  trainingLine: string;
}

function programmeView(t: Task): ProgrammeView {
  const id = trackerId(t);
  if (id === 'doc_tracker35') {
    return {
      trackerId: id,
      stale: true,
      dataDate: '28 Aug 2026',
      status: tableRows(id, 'trk35-status'),
      milestones: tableRows(id, 'trk35-milestones').map((r) => [r[0], r[1], r[2], '']),
      risks: [
        { id: 'R1', text: 'Sensitivity labelling pace', rating: 'Medium', owner: 'Aisha Patel', mitigation: 'Monitor weekly' },
        { id: 'R2', text: 'Training attendance in Operations', rating: 'Medium', owner: 'Sipho Mahlangu', mitigation: 'Recorded sessions' },
      ],
      statusCite: '[[c:trk35-status]]',
      milestoneCite: '[[c:trk35-milestones]]',
      riskCite: '[[c:trk35-risks]]',
      pilotDate: '25 Sep 2026',
      pilotStatus: 'On track',
      trainingLine: '190 of 450 employees trained (42%)',
    };
  }
  const tid = 'doc_tracker38';
  const has = id === tid;
  const ms = tableRows(tid, 'trk38-milestones');
  return {
    trackerId: has ? tid : null,
    stale: false,
    dataDate: '18 Sep 2026',
    status: has ? tableRows(tid, 'trk38-status') : [],
    milestones: has ? ms : [],
    risks: has
      ? tableRows(tid, 'trk38-risks').map((r) => ({ id: r[0], text: r[1], rating: r[2], owner: r[3], mitigation: r[4] }))
      : [],
    statusCite: has ? '[[c:trk38-status]]' : `[[c:${BRIEF_SOURCE_ID}]]`,
    milestoneCite: has ? '[[c:trk38-milestones]]' : `[[c:${BRIEF_SOURCE_ID}]]`,
    riskCite: has ? '[[c:trk38-risks]]' : `[[c:${BRIEF_SOURCE_ID}]]`,
    pilotDate: '9 Oct 2026',
    pilotStatus: 'At risk',
    trainingLine: '312 of 450 employees trained (69%)',
  };
}

const RECIPIENT_OPTIONS: Record<string, string[]> = {
  plg: ['grp_plg'],
  leads: ['grp_leads'],
  both: ['grp_plg', 'grp_leads'],
};

function recipients(t: Task): Recipient[] {
  const a = t.answers['recipients'];
  const ids = a && RECIPIENT_OPTIONS[a] ? RECIPIENT_OPTIONS[a] : ['grp_plg'];
  return ids.map((id) => recipientFor(id)!).filter(Boolean);
}

const SLOT_OPTIONS: Record<string, { date: string; start: string; end: string }> = {
  thu10: { date: '2026-09-24', start: '10:00', end: '10:30' },
  thu1130: { date: '2026-09-24', start: '11:30', end: '12:00' },
  fri11: { date: '2026-09-25', start: '11:00', end: '11:30' },
};

function meetingSlot(t: Task): { date: string; start: string; end: string } {
  const a = t.answers['slot'];
  if (a && SLOT_OPTIONS[a]) return SLOT_OPTIONS[a];
  if (a === 'first-free') {
    const base: MeetingPayload = { title: '', attendees: meetingAttendees(t), date: '2026-09-24', start: '09:00', end: '09:30', timeZone: TZ, agenda: '', teamsLink: true };
    return firstFreeSlot(base, ['2026-09-23', '2026-09-24', '2026-09-25']) ?? SLOT_OPTIONS.thu1130;
  }
  // Skipped: Cowork proposes the first option and flags it for review.
  return SLOT_OPTIONS.thu10;
}

function meetingAttendees(t: Task): Recipient[] {
  const rs = recipients(t);
  // Governance guide 3.3: the risk owner must attend. R1 owner is Aisha Patel.
  const hasAisha = rs.some((r) => r.id === 'grp_plg' || r.id === 'usr_aisha');
  return hasAisha ? rs : [...rs, recipientFor('usr_aisha')!];
}

export const slotLabel = (m: { date: string; start: string; end: string }) => `${fmtDateShort(m.date)}, ${m.start}–${m.end} ${TZL}`;

function leadershipUpdate(t: Task): string {
  const v = programmeView(t);
  const brief = t.context.brief;
  const briefCite = brief ? ` [[c:${BRIEF_SOURCE_ID}]]` : '';
  const slot = meetingSlot(t);
  const r1 = v.risks[0];
  return [
    `# AI Programme — Weekly Leadership Update`,
    `**Week ending ${v.dataDate}** · Prepared ${fmtDate(TODAY)} by ${L.displayName} · Draft for review`,
    ``,
    `## Summary`,
    v.stale
      ? `Overall status **Green**. The Knowledge Agent pilot is on track for **${v.pilotDate}** and training stands at ${v.trainingLine}. ${v.milestoneCite}`
      : `Overall status **Amber**. Training and the merchant support proof of concept are progressing well, but the Knowledge Agent pilot go-live has moved to **${v.pilotDate}** because sensitivity labelling is behind schedule. ${v.milestoneCite}${briefCite}`,
    ``,
    `## Programme status`,
    `| Workstream | Status | Progress | Owner |`,
    `|---|---|---|---|`,
    ...v.status.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} |`),
    ``,
    `Source: Weekly Delivery Tracker, ${v.stale ? 'Week 35' : 'Week 38'} (${v.dataDate}). ${v.statusCite}`,
    ``,
    `## Milestones`,
    `| Milestone | Date | Status |`,
    `|---|---|---|`,
    ...v.milestones.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} |`),
    ``,
    `${v.milestoneCite}`,
    ``,
    `## Risks needing attention`,
    ...v.risks.filter((r) => r.rating !== 'Low').map((r) => `- **${r.id} (${r.rating}):** ${r.text}. Owner: ${r.owner}. ${v.riskCite}`),
    ``,
    `## Decisions requested`,
    v.stale
      ? `- None identified in the attached tracker.`
      : `- Agree whether unlabelled sites are excluded from the pilot (${r1?.id ?? 'R1'}).${briefCite}\n- Confirm who maintains agent content after the pilot (R3).${briefCite}`,
    ``,
    `## Next steps`,
    `- 30-minute follow-up on unresolved risks proposed for ${slotLabel(slot)}.`,
    `- Update the AI Programme Overview, which still shows baseline dates.`,
    ``,
    `---`,
    `Sources: ${brief ? `programme briefing from ${brief.agentName} (reviewed ${fmtDate(TODAY)}); ` : ''}Weekly Delivery Tracker ${v.stale ? 'Week 35 (28 Aug 2026)' : 'Week 38 (18 Sep 2026)'}.`,
  ].join('\n');
}

function statusCsv(t: Task): string {
  const v = programmeView(t);
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const rows = [
    ['Workstream', 'Status', 'Progress', 'Owner', 'Source', 'Data date'],
    ...v.status.map((r) => [r[0], r[1], r[2], r[3], `Weekly Delivery Tracker ${v.stale ? 'Week 35' : 'Week 38'}`, v.dataDate]),
  ];
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

function emailBody(t: Task): string {
  const v = programmeView(t);
  const slot = meetingSlot(t);
  const lines = [
    `Hi all,`,
    ``,
    `Please find attached this week's AI programme leadership update (data as at ${v.dataDate}).`,
    ``,
    `Headlines:`,
    v.stale
      ? `- The Knowledge Agent pilot is on track for go-live on ${v.pilotDate}.`
      : `- The Knowledge Agent pilot go-live is now ${v.pilotDate} (was 25 Sep) because sensitivity labelling is behind schedule.`,
    v.stale ? `- Training: ${v.trainingLine}.` : `- Training: ${v.trainingLine}; completion is now planned for 14 Nov 2026.`,
    v.stale ? `- No risks are rated High.` : `- Risk R1 (labelling delays) is now rated High.`,
    ``,
  ];
  if (!v.stale) {
    lines.push(`Decisions needed:`, `- Whether unlabelled sites are excluded from the pilot.`, `- Who maintains agent content after the pilot.`, ``);
  }
  lines.push(
    `I've proposed a 30-minute follow-up on the unresolved risks for ${slotLabel(slot)} — an invitation will follow.`,
    ``,
    `Kind regards,`,
    `${L.displayName}`,
    `${L.jobTitle}, ${settings.organisation.team.replace(' (training version)', '')}`,
  );
  return lines.join('\n');
}

function meetingAgenda(t: Task): string {
  const v = programmeView(t);
  if (v.stale) {
    return `1. Sensitivity labelling pace (Aisha Patel) — 15 min\n2. Operations training attendance (Sipho Mahlangu) — 10 min\n3. Actions and owners — 5 min`;
  }
  return `1. R1 — Sensitivity labelling delays: decide whether unlabelled sites are excluded from the pilot (Aisha Patel) — 15 min\n2. R3 — Owner for agent content after the pilot (Thandi Nkosi) — 10 min\n3. Agree actions, owners and dates — 5 min`;
}

function mainMeeting(t: Task): MeetingPayload {
  const slot = meetingSlot(t);
  return {
    title: 'Follow-up: unresolved AI programme risks',
    attendees: meetingAttendees(t),
    date: slot.date,
    start: slot.start,
    end: slot.end,
    timeZone: TZ,
    agenda: meetingAgenda(t),
    teamsLink: true,
  };
}

function inviteText(t: Task): string {
  const m = mainMeeting(t);
  return [
    `# ${m.title}`,
    `**When:** ${fmtDateLong(m.date)}, ${m.start}–${m.end} ${TZL} (${TZ})`,
    `**Attendees:** ${m.attendees.map((a) => a.name).join('; ')}`,
    `**Location:** Microsoft Teams meeting (simulated link)`,
    ``,
    `## Agenda`,
    m.agenda,
    ``,
    `> Follow-up required by the Programme Governance Guide for High-rated unresolved risks. [[c:gov-meetings]]`,
  ].join('\n');
}

function completionSummary(t: Task, extra: GenerateExtra): string {
  const v = programmeView(t);
  return [
    `# Task summary`,
    `**Task:** ${t.title}`,
    `**Completed:** ${fmtDate(TODAY)}`,
    ``,
    `## Outputs`,
    `- One-page leadership update (Markdown and HTML).`,
    `- Programme status table (CSV).`,
    t.requested.email ? `- Email to the programme leadership group.` : '',
    t.requested.meeting ? `- Follow-up meeting invitation (ICS).` : '',
    ``,
    `## Actions`,
    ...(extra.actionOutcomes?.length ? extra.actionOutcomes.map((o) => `- ${o}`) : ['- No outbound actions were requested.']),
    ``,
    `## Sources used`,
    t.context.brief ? `- Programme briefing from ${t.context.brief.agentName}.` : '',
    `- Weekly Delivery Tracker ${v.stale ? 'Week 35 (28 Aug 2026) — superseded' : 'Week 38 (18 Sep 2026)'}.`,
    `- Programme Governance Guide v1.4 (meeting rules).`,
    ``,
    `## Check before sharing further`,
    v.stale ? `- The tracker used is superseded. Replace it and regenerate the outputs.` : `- Dates match the week 38 tracker and the reviewed briefing.`,
    `- The AI Programme Overview still shows baseline dates; ask its owner to update it.`,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

export const mainScenario: CoworkScenario = {
  id: 'main',
  title: 'Weekly AI programme update',
  defaultPrompt: MAIN_PROMPT,
  defaultFiles: ['doc_tracker35'],
  parseRequest(prompt) {
    const p = normalise(prompt);
    return {
      update: /(update|report|one-page|one page|summary|document|briefing pack)/.test(p),
      email: /(email|e-mail|mail|message to)/.test(p),
      meeting: /(meeting|invite|invitation|calendar|call|follow-up|follow up)/.test(p),
      reviewFirst: /(review|before .*(sent|send)|approv|check (it|them|with me)|let me see)/.test(p),
    };
  },
  planSteps(t) {
    const s = ['Read the reviewed programme briefing and the attached tracker', 'Compare source dates and flag differences'];
    if (t.requested.update) s.push('Prepare a one-page leadership update and status table');
    if (t.requested.email) s.push('Draft an email to the programme leadership group');
    if (t.requested.meeting) s.push('Check sample calendars and propose a 30-minute follow-up');
    s.push('Pause for your approval before sending anything');
    return s;
  },
  steps() {
    return [
      { kind: 'think', ms: 900 },
      {
        kind: 'say',
        text: (t) => {
          const outs = [
            t.requested.update && 'a one-page leadership update (with a status table)',
            t.requested.email && 'a draft email to the programme leadership group',
            t.requested.meeting && 'a proposed 30-minute follow-up meeting',
          ].filter(Boolean);
          return `I'll prepare ${outs.join(', ')}. ${t.requested.reviewFirst ? "You'll review everything before anything is sent." : "I'll still ask for your approval before sending or scheduling anything."}`;
        },
      },
      { kind: 'plan' },
      { kind: 'question', id: 'recipients', when: (t) => t.requested.email || t.requested.meeting },
      { kind: 'question', id: 'slot', when: (t) => t.requested.meeting },
      { kind: 'tool', text: 'Reviewing the programme briefing', ms: 900 },
      { kind: 'tool', text: 'Reviewing the programme tracker', ms: 1100 },
      { kind: 'tool', text: 'Comparing source dates', ms: 900, check: 'source-dates' },
      { kind: 'skill', skill: 'Word', text: 'Preparing to create Word documents', when: (t) => t.requested.update },
      { kind: 'tool', text: 'Preparing the leadership update', ms: 1400, when: (t) => t.requested.update },
      { kind: 'skill', skill: 'Excel', text: 'Preparing to create Excel spreadsheets', when: (t) => t.requested.update },
      { kind: 'tool', text: 'Building the programme status table', ms: 800, when: (t) => t.requested.update },
      { kind: 'skill', skill: 'Email', text: 'Preparing to compose emails', when: (t) => t.requested.email },
      { kind: 'tool', text: 'Drafting the email', ms: 1100, when: (t) => t.requested.email },
      { kind: 'skill', skill: 'Scheduling', text: 'Preparing to schedule meetings', when: (t) => t.requested.meeting },
      { kind: 'tool', text: 'Checking sample calendar availability', ms: 1000, when: (t) => t.requested.meeting },
      { kind: 'artifacts', keys: ['update', 'table', 'email', 'invite'] },
      {
        kind: 'say',
        text: (t) =>
          `Your drafts are ready in the **Output folder**. Review them before approving anything:\n\n` +
          [
            t.requested.update && '- **Leadership update** — check the milestone dates against their sources.',
            t.requested.update && '- **Programme status table** — CSV for your records.',
            t.requested.email && '- **Email** — check recipients and content, then Send or Cancel.',
            t.requested.meeting && '- **Meeting invitation** — check attendees, time and conflicts, then Create or Cancel.',
          ]
            .filter(Boolean)
            .join('\n'),
      },
      { kind: 'actions' },
      { kind: 'finish' },
    ];
  },
  question(id, t) {
    if (id === 'outputs') {
      return {
        id,
        prompt: "I couldn't tell which outputs you want. What should I prepare?",
        options: [
          { value: 'update', label: 'Leadership update only' },
          { value: 'update-email', label: 'Leadership update and email' },
          { value: 'all', label: 'Update, email and follow-up meeting' },
        ],
      };
    }
    if (id === 'recipients') {
      return {
        id,
        prompt: '"Programme leadership group" matches two distribution lists. Who should receive the email?',
        detail: 'I found both in the directory. The meeting will use the same people, plus the owner of risk R1.',
        options: [
          { value: 'plg', label: 'Programme Leadership Group', detail: 'Programme Director and workstream leads (4 people)' },
          { value: 'leads', label: 'AI Programme Leads', detail: 'Delivery leads only (3 people) — no Programme Director' },
          { value: 'both', label: 'Both lists', detail: '7 people' },
        ],
      };
    }
    const base: MeetingPayload = { title: '', attendees: meetingAttendees(t), date: '', start: '', end: '', timeZone: TZ, agenda: '', teamsLink: true };
    const free = firstFreeSlot(base, ['2026-09-23', '2026-09-24', '2026-09-25']);
    return {
      id,
      prompt: 'When should the 30-minute follow-up happen?',
      detail: `Times are in ${TZL} (${TZ}). The governance guide asks for follow-up within five working days.`,
      options: [
        { value: 'thu10', label: slotLabel(SLOT_OPTIONS.thu10) },
        { value: 'thu1130', label: slotLabel(SLOT_OPTIONS.thu1130) },
        { value: 'fri11', label: slotLabel(SLOT_OPTIONS.fri11) },
        { value: 'first-free', label: 'First time everyone is free', detail: free ? `Currently ${slotLabel(free)}` : undefined },
      ],
    };
  },
  artifactSpecs(t) {
    const s: ArtifactSpec[] = [];
    if (t.requested.update) {
      s.push({ key: 'update', title: 'Leadership update', baseName: 'AI-programme-leadership-update', format: 'md', editable: true });
      s.push({ key: 'table', title: 'Programme status table', baseName: 'programme-status', format: 'csv', editable: false });
    }
    if (t.requested.email) s.push({ key: 'email', title: 'Email to programme leadership', baseName: 'leadership-update-email', format: 'eml', editable: true });
    if (t.requested.meeting) s.push({ key: 'invite', title: 'Meeting invitation', baseName: 'risk-follow-up-invite', format: 'ics', editable: false });
    return s;
  },
  generate(key, t, extra) {
    switch (key) {
      case 'update':
        return leadershipUpdate(t);
      case 'table':
        return statusCsv(t);
      case 'email':
        return emailBody(t);
      case 'invite':
        return inviteText(t);
      case 'summary':
        return completionSummary(t, extra);
      default:
        return '';
    }
  },
  actions(t, ids) {
    const out: { email?: EmailPayload; meeting?: MeetingPayload } = {};
    if (t.requested.email) {
      out.email = {
        to: recipients(t),
        cc: [],
        subject: `AI programme weekly update — week ending ${programmeView(t).dataDate}`,
        body: emailBody(t),
        attachments: [ids.update, ids.table].filter(Boolean),
      };
    }
    if (t.requested.meeting) out.meeting = mainMeeting(t);
    return out;
  },
  summaryIntro(t) {
    return `Done. Here's a summary of "${t.title}".`;
  },
};

// ─────────────────────────── Practice: meeting preparation ───────────────────────────

const WG = 'doc_wg_notes';

export const meetingScenario: CoworkScenario = {
  id: 'meeting',
  title: 'Prepare the working group agenda',
  defaultPrompt:
    "Review the Operations Automation Working Group notes, identify the decisions that are still open, and prepare a 30-minute agenda for Thursday's follow-up meeting. Let me review it before anything is sent.",
  defaultFiles: [WG],
  parseRequest(prompt) {
    const p = normalise(prompt);
    return { update: true, email: false, meeting: /(invite|invitation|schedule|calendar)/.test(p), reviewFirst: /(review|before|approv)/.test(p) };
  },
  planSteps: () => ['Read the working group notes and addendum', 'List decisions that are still open', 'Prepare a 30-minute agenda', 'Ask before creating any meeting'],
  steps() {
    return [
      { kind: 'think', ms: 700 },
      { kind: 'say', text: () => "I'll review the notes, find the decisions that are still open, and draft a 30-minute agenda." },
      { kind: 'question', id: 'invite' },
      { kind: 'tool', text: 'Reviewing the working group notes', ms: 1000 },
      { kind: 'tool', text: 'Checking the addendum for later decisions', ms: 800 },
      { kind: 'skill', skill: 'Meetings', text: 'Preparing meeting intelligence' },
      { kind: 'tool', text: 'Preparing the agenda', ms: 1000 },
      { kind: 'skill', skill: 'Scheduling', text: 'Preparing to schedule meetings', when: (t) => t.answers['invite'] === 'yes' },
      { kind: 'tool', text: 'Checking sample calendar availability', ms: 800, when: (t) => t.answers['invite'] === 'yes' },
      { kind: 'artifacts', keys: ['agenda'] },
      { kind: 'say', text: () => 'The agenda is in the **Output folder**. Check it against the notes — including the addendum — before you use it.' },
      { kind: 'actions' },
      { kind: 'finish' },
    ];
  },
  question() {
    return {
      id: 'invite',
      prompt: 'Should I also prepare the meeting invitation?',
      options: [
        { value: 'no', label: 'Agenda only' },
        { value: 'yes', label: 'Agenda and an invitation for my approval', detail: 'Thursday 24 Sep, 11:30–12:00 SAST' },
      ],
    };
  },
  artifactSpecs: () => [{ key: 'agenda', title: 'Meeting agenda', baseName: 'working-group-agenda', format: 'md', editable: true }],
  generate(key) {
    if (key === 'summary') return `# Task summary\n\n- Agenda prepared from the 15 Sep notes and 17 Sep addendum.`;
    const open = sectionText(WG, 'wg-open').split('\n').map((l) => l.replace(/^- /, ''));
    return [
      `# Operations Automation Working Group — Follow-up`,
      `**Thursday 24 Sep 2026 · 30 minutes · Chair: Pieter Botha**`,
      ``,
      `## Decisions still open`,
      `1. ${open[0]} — 12 min [[c:wg-open]]`,
      `2. ${open[2]} — 12 min [[c:wg-open]]`,
      ``,
      `## Actions review — 6 min`,
      `- Kwame: call-centre effort estimate (due 29 Sep). [[c:wg-actions]]`,
      `- Aisha: risk criteria for refund preparation (due 24 Sep). [[c:wg-actions]]`,
      ``,
      `> Not on the agenda: dashboard ownership was agreed in the 17 Sep addendum (Platform team). [[c:wg-addendum]]`,
    ].join('\n');
  },
  actions(t) {
    if (t.answers['invite'] !== 'yes') return {};
    return {
      meeting: {
        title: 'Operations Automation Working Group — follow-up',
        attendees: ['usr_pieter', 'usr_kwame', 'usr_sipho', 'usr_aisha', 'usr_johan'].map((id) => recipientFor(id)!),
        date: '2026-09-24',
        start: '11:30',
        end: '12:00',
        timeZone: TZ,
        agenda: '1. Refund preparation decision\n2. Call-centre extension decision\n3. Actions review',
        teamsLink: true,
      },
    };
  },
  summaryIntro: () => 'Done. The agenda is ready for your review.',
};

// ─────────────────────────── Practice: project delivery ───────────────────────────

const PAY = 'doc_payments_tracker';

function overdueRows(): string[][] {
  return tableRows(PAY, 'pay-tasks').filter((r) => r[3] < TODAY && r[4] !== 'Done');
}

export const deliveryScenario: CoworkScenario = {
  id: 'delivery',
  title: 'Escalate overdue payments work',
  defaultPrompt:
    'Summarise the Payments Platform Upgrade tracker, identify overdue work, and draft an escalation email to the project sponsor for my review.',
  defaultFiles: [PAY],
  parseRequest: () => ({ update: true, email: true, meeting: false, reviewFirst: true }),
  planSteps: () => ['Read the delivery tracker', `Find work items past their due date (today is ${fmtDate(TODAY)})`, 'Summarise impact on go-live', 'Draft an escalation email for your approval'],
  steps() {
    return [
      { kind: 'think', ms: 700 },
      { kind: 'say', text: () => "I'll summarise the tracker, list overdue work, and draft an escalation email. Nothing will be sent without your approval." },
      { kind: 'question', id: 'cc' },
      { kind: 'tool', text: 'Reviewing the delivery tracker', ms: 1000 },
      { kind: 'tool', text: 'Comparing due dates with today', ms: 800 },
      { kind: 'skill', skill: 'Communications', text: 'Preparing to draft stakeholder communications' },
      { kind: 'tool', text: 'Drafting the escalation email', ms: 1000 },
      { kind: 'artifacts', keys: ['overdue', 'escalation'] },
      { kind: 'say', text: () => 'The summary and escalation draft are ready. Check the overdue list against the tracker before approving the email.' },
      { kind: 'actions' },
      { kind: 'finish' },
    ];
  },
  question() {
    return {
      id: 'cc',
      prompt: 'Should I copy the owners of the overdue items?',
      options: [
        { value: 'yes', label: 'Yes, copy the owners' },
        { value: 'no', label: 'No, sponsor and delivery lead only' },
      ],
    };
  },
  artifactSpecs: () => [
    { key: 'overdue', title: 'Overdue work summary', baseName: 'overdue-work', format: 'md', editable: true },
    { key: 'escalation', title: 'Escalation email', baseName: 'escalation-email', format: 'eml', editable: true },
  ],
  generate(key) {
    const rows = overdueRows();
    if (key === 'overdue') {
      return [
        `# Payments Platform Upgrade — Overdue work`,
        `**As at ${fmtDate(TODAY)} · Go-live target 30 Oct 2026** [[c:pay-roles]]`,
        ``,
        `| ID | Work item | Owner | Due | Status | Days overdue |`,
        `|---|---|---|---|---|---|`,
        ...rows.map((r) => {
          const d = Math.round((Date.parse(TODAY) - Date.parse(r[3])) / 86400000);
          return `| ${r[0]} | ${r[1]} | ${r[2]} | ${fmtDate(r[3])} | ${r[4]} | ${d} |`;
        }),
        ``,
        `[[c:pay-tasks]]`,
        ``,
        `## Impact`,
        `- P-104 (data migration dry run) is blocked by P-103 (security review), and go-live depends on both. [[c:pay-blockers]]`,
        `- P-106 (rollback runbook) was due 19 Sep but is **done**, so it is not overdue.`,
      ].join('\n');
    }
    if (key === 'escalation') return escalationBody();
    return `# Task summary\n\n- ${rows.length} overdue items identified; escalation drafted for approval.`;
  },
  actions(t, ids) {
    const cc = t.answers['cc'] === 'yes' ? ['usr_kwame', 'usr_aisha'].map((id) => recipientFor(id)!) : [];
    return {
      email: {
        to: [recipientFor('usr_pieter')!],
        cc: [recipientFor('usr_johan')!, ...cc],
        subject: 'Escalation: overdue work on the Payments Platform Upgrade',
        body: escalationBody(),
        attachments: [ids.overdue].filter(Boolean),
      },
    };
  },
  summaryIntro: () => 'Done. Here is what happened.',
};

function escalationBody(): string {
  const rows = overdueRows();
  return [
    `Hi Pieter,`,
    ``,
    `Three work items on the Payments Platform Upgrade are overdue as at ${fmtDate(TODAY)}:`,
    ``,
    ...rows.map((r) => `- ${r[0]} ${r[1]} (${r[2]}) — due ${fmtDate(r[3])}, ${r[4].toLowerCase()}`),
    ``,
    `The security review (P-103) is the critical item: the data migration dry run is blocked until it is signed off, and the 30 Oct go-live depends on both.`,
    ``,
    `Could you help us secure a security review slot this week?`,
    ``,
    `Kind regards,`,
    `${L.displayName}`,
  ].join('\n');
}

export const scenarios: Record<ScenarioId, CoworkScenario> = {
  main: mainScenario,
  meeting: meetingScenario,
  delivery: deliveryScenario,
  actions: actionsScenario,
  status: statusScenario,
  triage: triageScenario,
};

/** Detect which scenario a free-text Cowork request belongs to. */
export function detectScenario(prompt: string, files: string[]): ScenarioId | null {
  const p = normalise(prompt);
  if (files.includes(SYNC) || /(transcript|action items)/.test(p)) return 'actions';
  if (files.includes(KPI) || /(kpi|scorecard)/.test(p)) return 'status';
  if (files.includes(CASES) || /(case queue|triage|support cases)/.test(p)) return 'triage';
  if (files.includes(WG) || /(working group|agenda)/.test(p)) return 'meeting';
  if (files.includes(PAY) || /(payments|overdue|escalat)/.test(p)) return 'delivery';
  if (/(leadership|programme|program|weekly update|briefing|tracker)/.test(p) || files.some((f) => f.startsWith('doc_tracker'))) return 'main';
  return null;
}

export const docLabel = (id: string) => {
  const d = getDoc(id);
  return d ? `${d.fileName} · ${d.version} · ${fmtDate(d.modified)}` : id;
};
