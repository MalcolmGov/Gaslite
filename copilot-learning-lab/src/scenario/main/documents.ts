import { settings } from '../../config/settings';
import type { SampleDocument } from '../types';

/**
 * Main scenario: "Prepare the weekly AI programme update".
 *
 * All content is synthetic. Figures, dates, statuses and people are invented
 * for training and do not describe actual MTN Group Fintech operations.
 *
 * Deliberate teaching features:
 *  - doc_overview says training completes 31 Oct; doc_register (newer) says 14 Nov.
 *  - doc_tracker35 is superseded by doc_tracker38 (stale pilot go-live date).
 *  - doc_overview_copy is a duplicate of doc_overview.
 *  - doc_budget is restricted: the learner cannot open it.
 *  - No accessible document contains next year's approved budget.
 */

const SITE = 'SharePoint › AI & Automation Programme › Shared Documents';

export const mainDocuments: SampleDocument[] = [
  {
    id: 'doc_overview',
    title: 'AI Programme Overview',
    fileName: 'AI Programme Overview.docx',
    kind: 'docx',
    version: '2.0',
    owner: 'Thandi Nkosi',
    modified: '2026-08-04',
    location: SITE,
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: 'all',
    summary: 'Programme purpose, workstreams, baseline milestone plan and governance summary.',
    sections: [
      {
        id: 'ovw-purpose',
        heading: '1. Purpose',
        text:
          'The AI and Automation programme helps teams use Microsoft 365 Copilot, custom agents and Copilot Cowork safely and productively. The programme runs from April 2026 to March 2027 and reports weekly to the Programme Leadership Group.',
      },
      {
        id: 'ovw-workstreams',
        heading: '2. Workstreams',
        table: {
          columns: ['Workstream', 'Lead', 'Scope'],
          rows: [
            ['Knowledge Agent pilot', 'Johan van Wyk', 'Agent Builder agents for Finance and Operations FAQs'],
            ['Cowork early adopters', 'Lerato Dlamini', '50 early adopters delegating routine reporting tasks'],
            ['Copilot adoption training', 'Sipho Mahlangu', 'Training for 450 employees in scope'],
            ['Data governance and labelling', 'Aisha Patel', 'Sensitivity labels and permission clean-up on 7 SharePoint sites'],
            ['Merchant support proof of concept', 'Kwame Mensah', 'Copilot Studio proof of concept for merchant support'],
            ['Measurement and benefits', 'Thandi Nkosi', 'Baseline survey and benefits tracking'],
          ],
        },
      },
      {
        id: 'ovw-milestones',
        heading: '3. Baseline milestone plan',
        table: {
          columns: ['Milestone', 'Planned date'],
          rows: [
            ['Knowledge Agent pilot go-live', '25 September 2026'],
            ['Training completion (all 450 employees)', '31 October 2026'],
            ['Merchant support integration test', '16 October 2026'],
            ['Benefits review', '4 December 2026'],
          ],
        },
      },
      {
        id: 'ovw-budget',
        heading: '4. Budget',
        text:
          'The FY2026 programme budget of R6.8 million (sample figure) was approved in March 2026. Budget planning for FY2027 is managed by Finance and is not covered in this document.',
      },
      {
        id: 'ovw-governance',
        heading: '5. Governance',
        text:
          'The Programme Leadership Group meets fortnightly. Leadership communications follow the Programme Governance Guide.',
      },
    ],
  },
  {
    id: 'doc_tracker38',
    title: 'Weekly Delivery Tracker — Week 38',
    fileName: 'Weekly Delivery Tracker.xlsx',
    kind: 'xlsx',
    version: 'Week 38',
    owner: 'Johan van Wyk',
    modified: '2026-09-18',
    location: SITE + ' › Tracking',
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: 'all',
    summary: 'Current workstream status, milestones, risks and changes since last week.',
    sections: [
      {
        id: 'trk38-status',
        heading: 'Workstream status (week ending 18 Sep 2026)',
        table: {
          columns: ['Workstream', 'Status', 'Progress', 'Owner'],
          rows: [
            ['Knowledge Agent pilot', 'Amber', 'Content ready for 2 of 3 libraries', 'Johan van Wyk'],
            ['Cowork early adopters', 'Green', '40 of 50 licences assigned', 'Lerato Dlamini'],
            ['Copilot adoption training', 'Amber', '312 of 450 trained (69%)', 'Sipho Mahlangu'],
            ['Data governance and labelling', 'Red', 'Labels applied on 3 of 7 sites', 'Aisha Patel'],
            ['Merchant support proof of concept', 'Green', 'Design review completed 15 Sep', 'Kwame Mensah'],
            ['Measurement and benefits', 'Green', 'Baseline survey closed: 214 responses', 'Thandi Nkosi'],
          ],
        },
      },
      {
        id: 'trk38-milestones',
        heading: 'Milestones',
        table: {
          columns: ['Milestone', 'Date', 'Status', 'Note'],
          rows: [
            ['Knowledge Agent pilot go-live', '9 Oct 2026', 'At risk', 'Moved from 25 Sep: depends on labelling of Finance FAQ library'],
            ['Cowork usage review', '30 Sep 2026', 'On track', ''],
            ['Labelling complete on priority sites', '2 Oct 2026', 'At risk', '4 sites outstanding'],
            ['Merchant support integration test', '16 Oct 2026', 'On track', ''],
            ['Training completion', '14 Nov 2026', 'On track', 'See Training Attendance Register v3.1'],
          ],
        },
      },
      {
        id: 'trk38-risks',
        heading: 'Risks',
        table: {
          columns: ['ID', 'Risk', 'Rating', 'Owner', 'Mitigation'],
          rows: [
            ['R1', 'Sensitivity labelling is behind schedule on 4 SharePoint sites, delaying the agent pilot', 'High', 'Aisha Patel', 'Prioritise Finance FAQ and Operations Runbook sites; decide on temporary exclusion'],
            ['R2', 'Training attendance in Operations is 48% because of month-end workload', 'Medium', 'Sipho Mahlangu', 'Two recorded sessions and floor-walker support'],
            ['R3', 'No agreed owner for agent content after the pilot', 'Medium', 'Thandi Nkosi', 'Ownership proposal for steering on 1 Oct'],
            ['R4', 'Licence data differs between HR list and admin export', 'Low', 'Lerato Dlamini', 'Weekly reconciliation'],
          ],
        },
      },
      {
        id: 'trk38-changes',
        heading: 'Changes since week 37',
        text:
          '- Pilot go-live moved from 25 Sep to 9 Oct 2026 (labelling dependency).\n- Training completions rose from 268 to 312.\n- Merchant support design review completed on 15 Sep.\n- R1 raised from Medium to High.',
      },
      {
        id: 'trk38-dependencies',
        heading: 'Dependencies',
        text:
          '- Agent pilot depends on labelling of the Finance FAQ library (Data governance workstream).\n- Cowork usage review depends on licence reconciliation (R4).',
      },
    ],
  },
  {
    id: 'doc_tracker35',
    title: 'Weekly Delivery Tracker — Week 35',
    fileName: 'Weekly Delivery Tracker.xlsx',
    kind: 'xlsx',
    version: 'Week 35',
    owner: 'Johan van Wyk',
    modified: '2026-08-28',
    location: SITE + ' › Tracking › Archive',
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: 'all',
    supersededBy: 'doc_tracker38',
    summary: 'Archived copy from week 35. Superseded by the week 38 tracker.',
    sections: [
      {
        id: 'trk35-status',
        heading: 'Workstream status (week ending 28 Aug 2026)',
        table: {
          columns: ['Workstream', 'Status', 'Progress', 'Owner'],
          rows: [
            ['Knowledge Agent pilot', 'Green', 'Content collection in progress', 'Johan van Wyk'],
            ['Copilot adoption training', 'Green', '190 of 450 trained (42%)', 'Sipho Mahlangu'],
            ['Data governance and labelling', 'Amber', 'Labels applied on 2 of 7 sites', 'Aisha Patel'],
          ],
        },
      },
      {
        id: 'trk35-milestones',
        heading: 'Milestones',
        table: {
          columns: ['Milestone', 'Date', 'Status'],
          rows: [
            ['Knowledge Agent pilot go-live', '25 Sep 2026', 'On track'],
            ['Training completion', '31 Oct 2026', 'On track'],
          ],
        },
      },
      {
        id: 'trk35-risks',
        heading: 'Risks',
        text: '- R1 Sensitivity labelling pace (Medium, Aisha Patel).\n- R2 Training attendance in Operations (Medium, Sipho Mahlangu).',
      },
    ],
  },
  {
    id: 'doc_register',
    title: 'Training Attendance Register',
    fileName: 'Training Attendance Register.xlsx',
    kind: 'xlsx',
    version: '3.1',
    owner: 'Sipho Mahlangu',
    modified: '2026-09-19',
    location: SITE + ' › Training',
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: 'all',
    summary: 'Training completions by business unit, upcoming sessions and the revised completion date.',
    sections: [
      {
        id: 'reg-summary',
        heading: 'Summary (as at 19 Sep 2026)',
        text: '312 of 450 employees in scope have completed Copilot adoption training (69%). 41 are booked on sessions before 30 Sep.',
      },
      {
        id: 'reg-by-unit',
        heading: 'Completion by business unit',
        table: {
          columns: ['Business unit', 'In scope', 'Completed', 'Rate'],
          rows: [
            ['Finance', '95', '81', '85%'],
            ['Operations', '140', '67', '48%'],
            ['Technology', '120', '103', '86%'],
            ['Commercial', '95', '61', '64%'],
          ],
        },
      },
      {
        id: 'reg-completion',
        heading: 'Revised completion date',
        text:
          'Revised training completion date: 14 November 2026 (previously 31 October 2026). Approved by the Programme Director on 17 Sep 2026 because of month-end conflicts in Operations.',
      },
      {
        id: 'reg-sessions',
        heading: 'Upcoming sessions',
        text: '- 24 Sep: Copilot Chat essentials (recorded).\n- 29 Sep: Building agents with Agent Builder.\n- 6 Oct: Delegating work with Cowork.',
      },
    ],
  },
  {
    id: 'doc_governance',
    title: 'Programme Governance Guide',
    fileName: 'Programme Governance Guide.pdf',
    kind: 'pdf',
    version: '1.4',
    owner: 'Aisha Patel',
    modified: '2026-06-30',
    location: SITE + ' › Governance',
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: 'all',
    summary: 'Rules for leadership communications, human review of AI output and meeting practice.',
    sections: [
      {
        id: 'gov-comms',
        heading: '3.1 Leadership communications',
        text:
          'Leadership updates are reviewed by the author before distribution. AI-generated drafts must be checked against their sources by a person. Updates state the date of the data they use.',
      },
      {
        id: 'gov-actions',
        heading: '3.2 Actions taken by AI tools',
        text:
          'Outbound actions such as sending email or creating meetings are approved individually by the person responsible. Do not approve an action you have not read.',
      },
      {
        id: 'gov-meetings',
        heading: '3.3 Risk follow-up meetings',
        text: 'Unresolved risks rated High are discussed in a 30-minute follow-up with the risk owner present, within five working days.',
      },
      {
        id: 'gov-data',
        heading: '4. Data handling',
        text: 'Confidential finance documents are not used as agent knowledge. Sharing an agent does not grant access to its knowledge sources.',
      },
    ],
  },
  {
    id: 'doc_steering',
    title: 'Previous Steering Meeting Notes',
    fileName: 'Steering Meeting Notes 2026-09-10.docx',
    kind: 'docx',
    version: 'Final',
    owner: 'Thandi Nkosi',
    modified: '2026-09-10',
    location: 'SharePoint › AI Programme Steering › Meetings',
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: ['grp_plg', 'usr_learner'],
    summary: 'Decisions, open actions and unresolved items from the 10 September steering meeting.',
    sections: [
      {
        id: 'stc-decisions',
        heading: 'Decisions',
        text: '- D1: Approve two additional recorded training sessions.\n- D2: Limit the agent pilot to Finance and Operations FAQs.',
      },
      {
        id: 'stc-actions',
        heading: 'Open actions',
        table: {
          columns: ['Action', 'Owner', 'Due', 'Status'],
          rows: [
            ['Confirm labelling plan for remaining sites', 'Aisha Patel', '17 Sep', 'Open'],
            ['Propose content ownership model for agents', 'Thandi Nkosi', '1 Oct', 'Open'],
            ['Confirm revised pilot go-live date', 'Johan van Wyk', '17 Sep', 'Done'],
          ],
        },
      },
      {
        id: 'stc-unresolved',
        heading: 'Unresolved items',
        text:
          '- Whether unlabelled sites should be excluded from the pilot (linked to R1).\n- Who maintains agent content after the pilot (R3).',
      },
    ],
  },
  {
    id: 'doc_overview_copy',
    title: 'AI Programme Overview (1)',
    fileName: 'AI Programme Overview (1).docx',
    kind: 'docx',
    version: '2.0',
    owner: settings.learner.displayName,
    modified: '2026-08-05',
    location: 'OneDrive › Downloads',
    classification: 'Internal',
    learnerAccess: 'granted',
    readableBy: ['usr_learner'],
    duplicateOf: 'doc_overview',
    summary: 'Downloaded copy of the AI Programme Overview. Other people cannot open files in your OneDrive.',
    sections: [
      {
        id: 'ovwc-note',
        heading: 'Copy',
        text: 'This is a downloaded copy of AI Programme Overview v2.0. It will not receive updates made to the SharePoint original.',
      },
    ],
  },
  {
    id: 'doc_budget',
    title: 'FY2027 Budget Submission — Draft',
    fileName: 'FY2027 Budget Submission - Draft.xlsx',
    kind: 'xlsx',
    version: '0.3',
    owner: 'Nomvula Khumalo',
    modified: '2026-09-15',
    location: 'SharePoint › Finance Planning (Restricted)',
    classification: 'Confidential',
    learnerAccess: 'denied',
    readableBy: ['grp_finance'],
    summary: 'Restricted Finance working file.',
    accessMessage:
      "You don't have access to this file. It's in a restricted Finance site, so it can't be added as a knowledge source. Adding it would not give anyone else access either.",
    sections: [],
  },
];

export const docById = (id: string, docs: SampleDocument[] = mainDocuments) => docs.find((d) => d.id === id);
