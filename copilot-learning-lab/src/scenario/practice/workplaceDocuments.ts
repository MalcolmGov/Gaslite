import type { SampleDocument } from '../types';

/**
 * Synthetic documents for the "agents your teams will use" practice set.
 * All names, figures and rules are fictional training samples.
 */

export const proceduresDocument: SampleDocument = {
  id: 'doc_procedures',
  title: 'Staff Expenses and IT Requests Procedure',
  fileName: 'Staff Expenses and IT Requests Procedure v3.1.pdf',
  kind: 'pdf',
  version: '3.1',
  owner: 'Nomvula Khumalo',
  modified: '2026-08-04',
  location: 'SharePoint › Finance › Procedures',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional training procedure covering expense claims, spend approval limits and IT equipment and software requests.',
  sections: [
    { id: 'proc-claims', heading: '2. Submitting expense claims', text: 'Submit claims in the Expenses app within 60 days of the expense, with an itemised receipt for anything over R200 (sample figure). Claims older than 60 days are only paid with written approval from your Finance Business Partner.' },
    { id: 'proc-entertain', heading: '3. Client entertainment', text: 'Client entertainment is capped at R650 per person (sample figure). Any single event above R5,000 needs pre-approval from your head of department before the event. List all attendees on the claim.' },
    { id: 'proc-mileage', heading: '4. Business travel by own car', text: 'Business kilometres are reimbursed at R4.84 per km (sample rate). Travel between home and your usual office is not business travel.' },
    { id: 'proc-authority', heading: '5. Spend approval limits', text: 'Line managers approve spend up to R25,000. Heads of department approve up to R250,000. Anything above R250,000 needs CFO approval (sample limits). You cannot approve your own spend.' },
    { id: 'proc-laptop', heading: '6. Laptops and devices', text: 'Laptops are replaced every four years, or sooner if IT confirms a fault. Request a replacement or repair through the IT Service Portal. Personal devices may only access email through the managed Outlook app.' },
    { id: 'proc-software', heading: '7. Software requests', text: 'Software in the Approved Software Catalogue can be requested through the IT Service Portal and is usually installed within 3 business days. Anything not in the catalogue, including free AI tools and browser extensions, needs an Information Security review before use.' },
  ],
};

export const complianceDocument: SampleDocument = {
  id: 'doc_compliance',
  title: 'Customer Complaints and KYC Procedure',
  fileName: 'Customer Complaints and KYC Procedure v2.0.pdf',
  kind: 'pdf',
  version: '2.0',
  owner: 'Aisha Patel',
  modified: '2026-06-15',
  location: 'SharePoint › Risk & Compliance › Procedures',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional internal procedure for handling customer complaints, wallet KYC tiers, customer data and suspicious activity. Not legal advice.',
  sections: [
    { id: 'cmp-complaints', heading: '2. Complaint timelines', text: 'Acknowledge every complaint within 2 business days. Resolve it within 15 business days (sample timelines). If it cannot be resolved in time, tell the customer why, give a new date, and log the extension. Customers who remain unhappy can be referred to the external ombud; the referral wording is in the complaints template library.' },
    { id: 'cmp-kyc', heading: '3. Wallet KYC tiers', text: 'Tier 1: valid SA ID number or passport and a selfie check. Wallet balance limit R5,000 (sample limit).\nTier 2: Tier 1 plus proof of address not older than 3 months. Wallet balance limit R25,000 (sample limit).\nCustomers can upgrade in the app. Staff never upgrade a tier manually.' },
    { id: 'cmp-data', heading: '4. Customer personal information', text: 'Use only the customer information you need for the case. Never send ID documents, full account numbers or PINs by email or chat. Refer to customers by their masked reference (for example CUS-••4471) in internal messages.' },
    { id: 'cmp-suspicious', heading: '5. Suspicious activity', text: 'If you suspect money laundering or fraud, report it to the Money Laundering Reporting Officer (MLRO) through the internal suspicious activity form within 24 hours. Do not tell the customer that a report has been made.' },
    { id: 'cmp-escalate', heading: '6. When to ask Compliance', text: 'This procedure is operational guidance, not legal advice. Anything it does not cover, or any request for an exception, goes to the Compliance mailbox before you act.' },
  ],
};

export const onboardingDocument: SampleDocument = {
  id: 'doc_onboarding',
  title: 'New Joiner Guide — Fintech Operations',
  fileName: 'New Joiner Guide - Fintech Operations.docx',
  kind: 'docx',
  version: 'Sep 2026',
  owner: 'Zanele Mthembu',
  modified: '2026-09-01',
  location: 'SharePoint › People & Culture › Onboarding',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional first-30-days guide for new joiners in Fintech Operations.',
  sections: [
    { id: 'onb-day1', heading: '1. Your first day', text: 'Arrive at 08:30 at reception, where your manager will meet you. Collect your laptop from the IT Service Desk (ground floor) and your access card from Security. Your first-week plan is sent by your manager the Friday before you start.' },
    { id: 'onb-access', heading: '2. Systems access', text: 'Your email and Teams accounts are ready on day one. Set up multi-factor authentication before 12:00 on day one. Request access to any other system (for example the case management tool or Power BI) through the IT Service Portal; your manager approves the request.' },
    { id: 'onb-training', heading: '3. Mandatory training', text: 'Complete these three courses in the learning portal within 30 days: Protecting Personal Information (POPIA), Anti-Money Laundering Essentials, and Information Security Basics. Your manager can see your completion status.' },
    { id: 'onb-people', heading: '4. Who to ask', text: 'Your onboarding buddy: named in your welcome email.\nPeople & Culture business partner: Zanele Mthembu.\nIT Service Desk: through the IT Service Portal or ext. 4000 (sample).\nFacilities and parking: the Facilities request form.' },
    { id: 'onb-glossary', heading: '5. Glossary', text: 'MoMo — the mobile money wallet and payments service.\nKYC — Know Your Customer identity checks.\nMLRO — Money Laundering Reporting Officer.\nRAID — Risks, Actions, Issues and Decisions log.\nP1 / P2 / P3 — case priority levels, P1 being most urgent.' },
  ],
};

export const syncTranscript: SampleDocument = {
  id: 'doc_sync_transcript',
  title: 'Merchant Onboarding Weekly Sync — Transcript',
  fileName: 'Merchant Onboarding Weekly Sync 2026-09-22 transcript.docx',
  kind: 'docx',
  version: 'Teams transcript',
  owner: 'Johan van Wyk',
  modified: '2026-09-22',
  location: 'Teams › Merchant Onboarding › Recordings',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional transcript of a 30-minute weekly sync, lightly edited for training.',
  sections: [
    { id: 'syn-attendees', heading: 'Attendees', text: `Johan van Wyk (chair), Sipho Mahlangu, Lerato Dlamini, Kwame Mensah, and you.` },
    {
      id: 'syn-part1',
      heading: '09:00 — Onboarding backlog',
      text:
        'Johan: The merchant backlog is at 140 applications. We agreed last week to clear it before the October campaign.\nKwame: The document-check API fix goes live Thursday. That should cut review time in half.\nJohan: Good. Kwame, can you confirm on Friday whether the backlog is actually dropping?\nKwame: Yes, I will send numbers by Friday the 25th.',
    },
    {
      id: 'syn-part2',
      heading: '09:10 — Campaign communications',
      text:
        'Johan: Sipho, can you draft the merchant comms plan for the campaign by 30 September?\nSipho: I can, but I am on the training rollout that week.\nJohan: Fair. Actually, Lerato, can you take the comms plan instead, same date?\nLerato: Yes, I will take it.\nLerato: We should maybe look at a WhatsApp chatbot for merchants one day.\nJohan: Nice idea — park it for the Q1 planning session, no action now.',
    },
    {
      id: 'syn-part3',
      heading: '09:20 — Decisions and next steps',
      text:
        'Johan: So we are agreed: the campaign launch stays on 12 October. Decision made.\nJohan: Sipho, please update the training schedule for the merchant support team by 2 October.\nJohan: I will book a go/no-go check for 7 October. That is on me.\nJohan: Can someone send the notes and actions round today?',
    },
  ],
};

export const kpiScorecard: SampleDocument = {
  id: 'doc_kpi_scorecard',
  title: 'Fintech Operations KPI Scorecard — Week 38',
  fileName: 'Fintech Ops KPI Scorecard W38.xlsx',
  kind: 'xlsx',
  version: 'Week 38',
  owner: 'Pieter Botha',
  modified: '2026-09-21',
  location: 'SharePoint › Operations › Reporting',
  classification: 'Internal',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional weekly KPI scorecard. Figures are sample data.',
  sections: [
    {
      id: 'kpi-table',
      heading: 'KPIs (week ending 20 Sep 2026)',
      table: {
        columns: ['KPI', 'Target', 'This week', 'Last week', 'Better if', 'Data date', 'Note'],
        rows: [
          ['New wallet sign-ups', '12000', '11450', '12300', 'Higher', '2026-09-20', ''],
          ['Transaction success rate (%)', '99.5', '99.1', '99.6', 'Higher', '2026-09-20', 'Switch outage 17 Sep, 42 minutes'],
          ['Average complaint resolution (days)', '10', '12.5', '11', 'Lower', '2026-09-20', ''],
          ['Merchant activations', '800', '910', '760', 'Higher', '2026-09-20', ''],
          ['Fraud losses (R thousand)', '150', '95', '120', 'Lower', '2026-09-20', 'Provisional — Finance to confirm 25 Sep'],
          ['App store rating', '4.5', '4.4', '4.4', 'Higher', '2026-09-06', ''],
        ],
      },
    },
    { id: 'kpi-context', heading: 'Context from owners', text: 'Transaction success: root cause of the 17 Sep switch outage is with the vendor; a fix is scheduled for 29 Sep.\nComplaint resolution: two agents are on training this month, which slowed resolution.' },
  ],
};

export const caseQueue: SampleDocument = {
  id: 'doc_case_queue',
  title: 'MoMo Support Case Queue — 22 Sep',
  fileName: 'MoMo Support Case Queue 2026-09-22.xlsx',
  kind: 'xlsx',
  version: 'Export 07:45',
  owner: 'Pieter Botha',
  modified: '2026-09-22',
  location: 'SharePoint › Customer Operations › Daily queue',
  classification: 'Confidential',
  learnerAccess: 'granted',
  readableBy: 'all',
  summary: 'Fictional daily export of new and ageing support cases, with the triage guide. Customer references are masked.',
  sections: [
    {
      id: 'case-table',
      heading: 'Open cases',
      table: {
        columns: ['Case', 'Customer ref', 'Received', 'Business days open', 'Customer message (summary)'],
        rows: [
          ['C-2201', 'CUS-••4471', '2026-09-22', '0', 'R1,200 left my wallet last night. I did not send it.'],
          ['C-2202', 'CUS-••9032', '2026-09-19', '1', 'Bought airtime, money was deducted but no airtime arrived.'],
          ['C-2203', 'CUS-••1188', '2026-09-21', '0', 'Why was I charged a fee for sending money to my sister?'],
          ['C-2204', 'CUS-••5520', '2026-09-02', '14', 'Still waiting for the refund you promised two weeks ago.'],
          ['C-2205', 'CUS-••7765', '2026-09-22', '0', 'My SIM stopped working yesterday and now I cannot log in to my wallet.'],
          ['C-2206', 'CUS-••3309', '2026-09-22', '0', 'Cannot log in. My PIN is 4821, please fix it.'],
        ],
      },
    },
    {
      id: 'case-guide',
      heading: 'Triage guide',
      text:
        '- P1: suspected fraud or unauthorised transactions, including possible SIM swap. Escalate to Risk the same day.\n- P1: any complaint at 12 or more business days open, because it is close to the 15-day resolution limit.\n- P2: failed or reversed transactions and account access problems. Check within 1 business day.\n- P3: fee and general questions. Reply with the approved template.\n- Never repeat a PIN, password or full ID number in any reply or internal message. Advise the customer to change a PIN they have shared.',
    },
    { id: 'case-fees', heading: 'Approved reply template — fees', text: 'A small fee applies when you send money to another wallet. You can see the fee on the confirmation screen before you approve a payment, and in the fee table in the app under Help › Fees. Sending money to a bank account in your own name is also shown there.' },
  ],
};

export const workplaceDocuments: SampleDocument[] = [proceduresDocument, complianceDocument, onboardingDocument, syncTranscript, kpiScorecard, caseQueue];
