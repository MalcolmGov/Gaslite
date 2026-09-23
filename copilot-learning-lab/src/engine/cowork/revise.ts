import { normalise } from '../../lib/util';
import type { Artifact } from '../model';

/**
 * Deterministic revision requests for Cowork outputs.
 * Supported: shorter, more formal, lead with decisions, add owners and dates.
 * Anything else returns null so the UI can explain what is supported.
 */

export const REVISION_OPTIONS = [
  { id: 'shorter', label: 'Make it shorter' },
  { id: 'formal', label: 'Use a more formal tone' },
  { id: 'decisions-first', label: 'Lead with the decisions needed' },
  { id: 'owners', label: 'Add owners and dates to next steps' },
] as const;

export type RevisionId = (typeof REVISION_OPTIONS)[number]['id'];

export function classifyRevision(text: string): RevisionId | null {
  const t = normalise(text);
  if (/(short|concise|trim|cut|brief|less)/.test(t)) return 'shorter';
  if (/(formal|professional|tone)/.test(t)) return 'formal';
  if (/(decision).*(first|top|lead|start)|(lead|start|open) with (the )?decision/.test(t)) return 'decisions-first';
  if (/(owner|dates|who and when|accountab)/.test(t)) return 'owners';
  return null;
}

interface Section { head: string; lines: string[] }

function sections(md: string): { pre: string[]; secs: Section[] } {
  const pre: string[] = [];
  const secs: Section[] = [];
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) secs.push({ head: line, lines: [] });
    else if (secs.length) secs[secs.length - 1].lines.push(line);
    else pre.push(line);
  }
  return { pre, secs };
}

const join = (pre: string[], secs: Section[]) => [...pre, ...secs.flatMap((s) => [s.head, ...s.lines])].join('\n');

export function revise(key: Artifact['key'], content: string, rev: RevisionId): string {
  const isEmail = key === 'email' || key === 'escalation';
  if (isEmail) {
    if (rev === 'formal') {
      return content
        .replace(/^Hi all,/m, 'Dear colleagues,')
        .replace(/^Hi (\w+),/m, 'Dear $1,')
        .replace(/Please find attached/, 'Please find attached, for your review,')
        .replace(/Could you help us/, 'I would be grateful if you could help us')
        .replace(/I've proposed/, 'I have proposed')
        .replace(/Kind regards,/, 'Yours sincerely,');
    }
    if (rev === 'shorter') {
      const lines = content.split('\n');
      const bullets = lines.filter((l) => l.startsWith('- '));
      const greeting = lines[0];
      const sign = lines.slice(lines.findIndex((l) => /regards|sincerely/i.test(l)));
      return [greeting, '', 'Key points this week:', ...bullets.slice(0, 3), '', ...sign].join('\n');
    }
    if (rev === 'decisions-first') {
      const idx = content.indexOf('Decisions needed:');
      if (idx < 0) return content;
      const block = content.slice(idx).split('\n\n')[0];
      const rest = content.replace(block + '\n\n', '');
      const [greet, ...others] = rest.split('\n\n');
      return [greet, block, ...others].join('\n\n');
    }
    if (rev === 'owners') {
      return content
        .replace('- Whether unlabelled sites are excluded from the pilot.', '- Whether unlabelled sites are excluded from the pilot (owner: Aisha Patel, by 1 Oct).')
        .replace('- Who maintains agent content after the pilot.', '- Who maintains agent content after the pilot (owner: Thandi Nkosi, by 1 Oct).');
    }
  }

  const { pre, secs } = sections(content);
  if (rev === 'shorter') {
    const keep = secs.filter((s) => /summary|milestone|risk|decision|open/i.test(s.head));
    const trimmed = keep.map((s) => ({ ...s, lines: s.lines.filter((l) => !l.startsWith('Source:')) }));
    return join(pre, trimmed);
  }
  if (rev === 'decisions-first') {
    const d = secs.filter((s) => /decision/i.test(s.head));
    const others = secs.filter((s) => !/decision/i.test(s.head));
    return join(pre, [...d, ...others]);
  }
  if (rev === 'formal') {
    return content
      .replace(/Draft for review/, 'Draft for review — prepared for the Programme Leadership Group')
      .replace(/progressing well/, 'progressing in line with plan')
      .replace(/has slipped/, 'has been rescheduled');
  }
  if (rev === 'owners') {
    return content
      .replace(/(- Agree whether unlabelled sites are excluded from the pilot \(R1\)\.)/, '$1 Owner: Aisha Patel · decision by 1 Oct 2026.')
      .replace(/(- Confirm who maintains agent content after the pilot \(R3\)\.)/, '$1 Owner: Thandi Nkosi · proposal at steering on 1 Oct 2026.')
      .replace(/(- Update the AI Programme Overview, which still shows baseline dates\.)/, '$1 Owner: Thandi Nkosi · by 30 Sep 2026.');
  }
  return content;
}
