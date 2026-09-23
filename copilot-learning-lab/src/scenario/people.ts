import { settings } from '../config/settings';
import type { CalendarEvent, Group, Person } from './types';

/** Fictional directory for the training tenant. No real people are represented. */
const d = settings.organisation.emailDomain;

export const people: Person[] = [
  { id: 'usr_learner', name: settings.learner.displayName, email: `alex.mokoena@${d}`, title: settings.learner.jobTitle, initials: settings.learner.initials },
  { id: 'usr_thandi', name: 'Thandi Nkosi', email: `thandi.nkosi@${d}`, title: 'Programme Director', initials: 'TN' },
  { id: 'usr_johan', name: 'Johan van Wyk', email: `johan.vanwyk@${d}`, title: 'Delivery Lead', initials: 'JW' },
  { id: 'usr_lerato', name: 'Lerato Dlamini', email: `lerato.dlamini@${d}`, title: 'Head of Data & AI Platforms', initials: 'LD' },
  { id: 'usr_sipho', name: 'Sipho Mahlangu', email: `sipho.mahlangu@${d}`, title: 'Change & Training Lead', initials: 'SM' },
  { id: 'usr_aisha', name: 'Aisha Patel', email: `aisha.patel@${d}`, title: 'Risk & Governance Manager', initials: 'AP' },
  { id: 'usr_kwame', name: 'Kwame Mensah', email: `kwame.mensah@${d}`, title: 'Engineering Lead', initials: 'KM' },
  { id: 'usr_nomvula', name: 'Nomvula Khumalo', email: `nomvula.khumalo@${d}`, title: 'Finance Business Partner', initials: 'NK' },
  { id: 'usr_pieter', name: 'Pieter Botha', email: `pieter.botha@${d}`, title: 'Operations Manager', initials: 'PB' },
  { id: 'usr_zanele', name: 'Zanele Mthembu', email: `zanele.mthembu@${d}`, title: 'HR Business Partner', initials: 'ZM' },
];

export const groups: Group[] = [
  {
    id: 'grp_plg',
    name: 'Programme Leadership Group',
    email: `ai-programme-leadership@${d}`,
    description: 'Programme Director and workstream leads who receive the weekly update.',
    memberIds: ['usr_thandi', 'usr_lerato', 'usr_johan', 'usr_aisha'],
    memberCount: 4,
  },
  {
    id: 'grp_leads',
    name: 'AI Programme Leads',
    email: `ai-programme-leads@${d}`,
    description: 'Delivery leads distribution list (does not include the Programme Director).',
    memberIds: ['usr_johan', 'usr_kwame', 'usr_sipho'],
    memberCount: 3,
  },
  {
    id: 'grp_cohort',
    name: 'AI Training Cohort — Wave 2',
    email: `ai-cohort-wave2@${d}`,
    description: 'Training group for this Learning Lab session.',
    memberIds: ['usr_pieter', 'usr_zanele'],
    memberCount: 14,
  },
  {
    id: 'grp_finance',
    name: 'Finance Planning',
    email: `finance-planning@${d}`,
    description: 'Restricted Finance planning team.',
    memberIds: ['usr_nomvula'],
    memberCount: 6,
  },
];

export const personById = (id: string) => people.find((p) => p.id === id);
export const groupById = (id: string) => groups.find((g) => g.id === id);

/** Sample calendars used for availability checks (all times SAST). */
export const calendarEvents: CalendarEvent[] = [
  { id: 'cal_1', personId: 'usr_thandi', title: 'Exco preparation', start: '2026-09-24T10:00', end: '2026-09-24T11:00' },
  { id: 'cal_2', personId: 'usr_aisha', title: 'Audit walkthrough', start: '2026-09-24T14:00', end: '2026-09-24T15:30' },
  { id: 'cal_3', personId: 'usr_johan', title: 'Sprint review', start: '2026-09-25T09:00', end: '2026-09-25T10:00' },
  { id: 'cal_4', personId: 'usr_lerato', title: 'Vendor call', start: '2026-09-25T14:00', end: '2026-09-25T14:30' },
  { id: 'cal_5', personId: 'usr_learner', title: 'Focus time', start: '2026-09-23T08:00', end: '2026-09-23T10:00' },
];
