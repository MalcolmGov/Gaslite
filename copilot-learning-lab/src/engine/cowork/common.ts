import { calendarEvents, groupById, groups, people, personById } from '../../scenario/people';
import { overlaps } from '../../lib/util';
import type { MeetingPayload, Recipient } from '../model';

export const recipientFor = (id: string): Recipient | undefined => {
  const p = personById(id);
  if (p) return { id: p.id, name: p.name, email: p.email, kind: 'person' };
  const g = groupById(id);
  if (g) return { id: g.id, name: g.name, email: g.email, kind: 'group' };
  return undefined;
};

/** Directory search used by recipient pickers. */
export function searchDirectory(q: string): Recipient[] {
  const t = q.trim().toLowerCase();
  const all: Recipient[] = [
    ...groups.filter((g) => g.id !== 'grp_finance').map((g) => ({ id: g.id, name: g.name, email: g.email, kind: 'group' as const })),
    ...people.filter((p) => p.id !== 'usr_learner').map((p) => ({ id: p.id, name: p.name, email: p.email, kind: 'person' as const })),
  ];
  if (!t) return all;
  return all.filter((r) => r.name.toLowerCase().includes(t) || r.email.toLowerCase().includes(t));
}

/** Individual people behind a list of recipients (groups expanded). */
export function expandRecipients(rs: Recipient[]): string[] {
  const ids = new Set<string>();
  for (const r of rs) {
    if (r.kind === 'person') ids.add(r.id);
    else groupById(r.id)?.memberIds.forEach((m) => ids.add(m));
  }
  return [...ids];
}

export interface Conflict {
  personId: string;
  personName: string;
  title: string;
  start: string;
  end: string;
}

export function meetingConflicts(m: MeetingPayload): Conflict[] {
  const s = `${m.date}T${m.start}`;
  const e = `${m.date}T${m.end}`;
  const who = new Set([...expandRecipients(m.attendees), 'usr_learner']);
  return calendarEvents
    .filter((ev) => who.has(ev.personId) && overlaps(s, e, ev.start, ev.end))
    .map((ev) => ({ personId: ev.personId, personName: personById(ev.personId)?.name ?? ev.personId, title: ev.title, start: ev.start, end: ev.end }));
}

/** First 30-minute slot on the given days (09:00–16:30) with no conflicts. */
export function firstFreeSlot(m: MeetingPayload, days: string[]): { date: string; start: string; end: string } | null {
  for (const date of days) {
    for (let mins = 9 * 60; mins <= 16 * 60 + 30; mins += 30) {
      const start = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      const endM = mins + 30;
      const end = `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;
      if (!meetingConflicts({ ...m, date, start, end }).length) return { date, start, end };
    }
  }
  return null;
}
