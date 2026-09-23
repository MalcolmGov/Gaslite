import type { SampleDocument } from '../types';
import { workplaceDocuments } from './workplaceDocuments';

/** Synthetic documents for the three shorter practice exercises. */

export const policyDocument: SampleDocument = {
  id: 'doc_policy',
  title: 'Hybrid Work and Travel Policy',
  fileName: 'Hybrid Work and Travel Policy.pdf',
  kind: 'pdf',
  version: '4.2',
  owner: 'Zanele Mthembu',
  modified: '2026-07-01',
  location: 'SharePoint › People & Culture › Policies',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional training policy covering hybrid work, equipment and business travel.',
  sections: [
    { id: 'pol-hybrid', heading: '2. Hybrid work', text: 'Employees in hybrid roles work from the office at least two days per week. Teams agree their anchor days with their manager. Fully remote arrangements need HR approval.' },
    { id: 'pol-equipment', heading: '3. Home office equipment', text: 'Hybrid employees may claim a once-off home office allowance of up to R3,500 (sample figure) every three years, with receipts. Home internet and electricity are not reimbursed.' },
    { id: 'pol-booking', heading: '5. Booking travel', text: 'Book all business travel through the Travel Desk. Domestic trips are booked at least 7 days ahead and international trips at least 14 days ahead, unless your manager approves an exception.' },
    { id: 'pol-approval', heading: '6. Travel approval', text: 'Domestic travel is approved by your line manager. International travel is approved by an executive committee member before booking.' },
    { id: 'pol-allowances', heading: '7. Accommodation and allowances', text: 'Domestic accommodation is capped at R1,800 per night (sample figure). The domestic daily allowance is R450. International daily allowances follow the Finance allowance schedule, which is published separately.' },
  ],
};

export const workingGroupNotes: SampleDocument = {
  id: 'doc_wg_notes',
  title: 'Operations Automation Working Group — Notes',
  fileName: 'Ops Automation Working Group Notes 2026-09-15.docx',
  kind: 'docx',
  version: 'Final + addendum',
  owner: 'Pieter Botha',
  modified: '2026-09-17',
  location: 'SharePoint › Operations › Automation Working Group',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Notes from the 15 September working group, with a 17 September addendum.',
  sections: [
    { id: 'wg-attendees', heading: 'Attendees', text: 'Pieter Botha (chair), Kwame Mensah, Sipho Mahlangu, Aisha Patel, Johan van Wyk.' },
    { id: 'wg-decided', heading: 'Decisions made', text: '- Use Copilot Cowork for the weekly exceptions report from October.\n- Keep the refund FAQ agent limited to internal staff.' },
    {
      id: 'wg-open',
      heading: 'Items not decided',
      text:
        '- Whether refund approvals under R5,000 (sample figure) can be prepared automatically for human sign-off. Needs Risk view (Aisha Patel).\n- Which team owns the automation monitoring dashboard.\n- Whether to extend the pilot to the call centre in Q1. Needs capacity estimate (Sipho Mahlangu).',
    },
    { id: 'wg-actions', heading: 'Actions', text: '- Kwame: estimate effort for call-centre extension by 29 Sep.\n- Aisha: draft risk criteria for refund preparation by 24 Sep.' },
    { id: 'wg-addendum', heading: 'Addendum — 17 September', text: 'Dashboard ownership agreed by email: the Platform team (Kwame Mensah) owns the automation monitoring dashboard. No further discussion needed.' },
  ],
};

export const deliveryTracker: SampleDocument = {
  id: 'doc_payments_tracker',
  title: 'Payments Platform Upgrade — Delivery Tracker',
  fileName: 'Payments Platform Upgrade Tracker.xlsx',
  kind: 'xlsx',
  version: 'Sprint 14',
  owner: 'Johan van Wyk',
  modified: '2026-09-21',
  location: 'SharePoint › Payments Platform › Delivery',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional project tracker. Sponsor: Pieter Botha. Delivery lead: Johan van Wyk.',
  sections: [
    { id: 'pay-roles', heading: 'Project roles', text: 'Sponsor: Pieter Botha. Delivery lead: Johan van Wyk. Go-live target: 30 Oct 2026.' },
    {
      id: 'pay-tasks',
      heading: 'Work items (as at 21 Sep 2026)',
      table: {
        columns: ['ID', 'Work item', 'Owner', 'Due', 'Status'],
        rows: [
          ['P-101', 'Load-test settlement service', 'Kwame Mensah', '2026-09-11', 'In progress'],
          ['P-102', 'Update merchant onboarding API docs', 'Sipho Mahlangu', '2026-09-30', 'In progress'],
          ['P-103', 'Security review sign-off', 'Aisha Patel', '2026-09-15', 'Not started'],
          ['P-104', 'Data migration dry run', 'Johan van Wyk', '2026-09-18', 'Blocked'],
          ['P-105', 'Customer communication plan', 'Lerato Dlamini', '2026-10-05', 'Not started'],
          ['P-106', 'Rollback runbook', 'Kwame Mensah', '2026-09-19', 'Done'],
        ],
      },
    },
    { id: 'pay-blockers', heading: 'Blockers', text: 'P-104 is blocked until the security review (P-103) is signed off. Go-live depends on both.' },
  ],
};

export const practiceDocuments: SampleDocument[] = [policyDocument, workingGroupNotes, deliveryTracker, ...workplaceDocuments];
