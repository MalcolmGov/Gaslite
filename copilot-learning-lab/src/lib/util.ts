import { settings } from '../config/settings';

/** Stable, readable identifiers: prefix + time + counter + random suffix. */
let counter = 0;
export function newId(prefix: string): string {
  counter = (counter + 1) % 1296;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(2, '0')}${Math.random().toString(36).slice(2, 6)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parse "YYYY-MM-DD" as a calendar date (no time-zone shifting). */
function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

/** "18 Sep 2026" */
export function fmtDate(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "Thursday, 24 September 2026" */
export function fmtDateLong(iso: string): string {
  const { y, m, d, dow } = parts(iso);
  return `${DAYS_LONG[dow]}, ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "Thu 24 Sep" */
export function fmtDateShort(iso: string): string {
  const { m, d, dow } = parts(iso);
  return `${DAYS[dow]} ${d} ${MONTHS[m - 1]}`;
}

/** "10:00" from "YYYY-MM-DDTHH:mm" */
export const timeOf = (local: string) => local.slice(11, 16);

const sastFmt = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: settings.scenario.timeZone });
  } catch {
    return null;
  }
})();

/** Wall-clock time of a real event, shown in the scenario time zone (SAST). */
export function clockTime(ms: number): string {
  if (sastFmt) return sastFmt.format(new Date(ms));
  const t = new Date(ms + 2 * 3600000);
  return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
}

/** Days between two ISO dates. */
export function daysBetween(a: string, b: string): number {
  const pa = parts(a), pb = parts(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export const normalise = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

export function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
