import { settings } from '../config/settings';
import { citationIds, parseMarkdown, stripCitations, toPlainText, type Block, type Inline } from '../lib/markdown';
import { resolveCitation } from '../scenario/registry';
import { buildZip } from '../lib/zip';
import { fmtDate } from '../lib/util';
import type { Artifact, EmailPayload, MeetingPayload } from './model';

/**
 * Honest exports. Every download is generated in the browser in the format
 * its extension claims: Markdown, HTML, CSV, RFC 5545 iCalendar (.ics),
 * RFC 5322 message (.eml) and ZIP. No DOCX/PDF is offered because none is generated.
 */

export interface ExportFile {
  name: string;
  mime: string;
  content: string | Uint8Array;
  label: string;
}

const FOOTER = `${settings.labels.persistent}. ${settings.labels.infoPanel}`;

/** Replace [[c:id]] tokens with [n] and append a numbered source list. */
export function markdownWithFootnotes(md: string, briefText?: string): string {
  const ids = citationIds(md);
  if (!ids.length) return md;
  let out = md;
  ids.forEach((id, i) => {
    out = out.split(`[[c:${id}]]`).join(`[${i + 1}]`);
  });
  const refs = ids.map((id, i) => {
    const r = resolveCitation(id, briefText);
    if (r.pseudo) return `${i + 1}. ${r.pseudo.title} — ${r.pseudo.subtitle}`;
    return `${i + 1}. ${r.doc?.title ?? id}, ${r.section?.heading ?? ''} (version ${r.doc?.version}, ${r.doc ? fmtDate(r.doc.modified) : ''})`;
  });
  return `${out}\n\n## Sources\n\n${refs.join('\n')}\n`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineHtml(inl: Inline[], ids: string[]): string {
  return inl
    .map((x) => (x.t === 'text' ? esc(x.v) : x.t === 'bold' ? `<strong>${esc(x.v)}</strong>` : `<sup>[${ids.indexOf(x.id) + 1}]</sup>`))
    .join('');
}

function blocksHtml(blocks: Block[], ids: string[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h':
          return `<h${b.level}>${inlineHtml(b.inl, ids)}</h${b.level}>`;
        case 'p':
          return `<p>${inlineHtml(b.inl, ids)}</p>`;
        case 'ul':
          return `<ul>${b.items.map((i) => `<li>${inlineHtml(i, ids)}</li>`).join('')}</ul>`;
        case 'ol':
          return `<ol>${b.items.map((i) => `<li>${inlineHtml(i, ids)}</li>`).join('')}</ol>`;
        case 'callout':
          return `<blockquote>${inlineHtml(b.inl, ids)}</blockquote>`;
        case 'hr':
          return '<hr>';
        case 'table':
          return `<table><thead><tr>${b.head.map((h) => `<th>${inlineHtml(h, ids)}</th>`).join('')}</tr></thead><tbody>${b.rows
            .map((r) => `<tr>${r.map((c) => `<td>${inlineHtml(c, ids)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`;
      }
    })
    .join('\n');
}

export function markdownToHtmlDocument(title: string, md: string, briefText?: string): string {
  const ids = citationIds(md);
  const refs = ids
    .map((id, i) => {
      const r = resolveCitation(id, briefText);
      const label = r.pseudo ? `${r.pseudo.title} — ${r.pseudo.subtitle}` : `${r.doc?.title}, ${r.section?.heading} (v${r.doc?.version}, ${r.doc ? fmtDate(r.doc.modified) : ''})`;
      return `<li id="src-${i + 1}">${esc(label)}</li>`;
    })
    .join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
body{font-family:"Segoe UI Variable","Segoe UI",system-ui,-apple-system,sans-serif;color:#242424;max-width:820px;margin:40px auto;padding:0 20px;line-height:1.5}
h1{font-size:26px;font-weight:600}h2{font-size:18px;font-weight:600;margin-top:28px}
table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #d1d1d1;padding:6px 10px;text-align:left;font-size:14px}th{background:#f5f5f5}
blockquote{border-left:3px solid #0f6cbd;background:#f0f6ff;margin:12px 0;padding:8px 14px}
sup{color:#0f6cbd}footer{margin-top:40px;color:#616161;font-size:12px;border-top:1px solid #e0e0e0;padding-top:12px}
</style></head><body>
${blocksHtml(parseMarkdown(md), ids)}
${refs ? `<h2>Sources</h2><ol>${refs}</ol>` : ''}
<footer>${esc(FOOTER)}</footer>
</body></html>`;
}

// ───────────── iCalendar ─────────────

const icsEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  out.push(rest);
  return out.join('\r\n');
}

export function meetingToIcs(m: MeetingPayload, uid: string): string {
  const dt = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Learning Lab//Training Simulation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    'TZID:Africa/Johannesburg',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0200',
    'TZNAME:SAST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}@learning-lab.training.example`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Africa/Johannesburg:${dt(m.date, m.start)}`,
    `DTEND;TZID=Africa/Johannesburg:${dt(m.date, m.end)}`,
    `SUMMARY:${icsEsc(m.title)}`,
    `DESCRIPTION:${icsEsc(`${m.agenda}\n\n${FOOTER}`)}`,
    ...m.attendees.map((a) => `ATTENDEE;CN=${icsEsc(a.name)};ROLE=REQ-PARTICIPANT:mailto:${a.email}`),
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

// ───────────── Email ─────────────

export function emailToEml(e: EmailPayload, attachmentNames: string[]): string {
  const addr = (rs: EmailPayload['to']) => rs.map((r) => `"${r.name}" <${r.email}>`).join(', ');
  const d = settings.organisation.emailDomain;
  return [
    `From: "${settings.learner.displayName}" <alex.mokoena@${d}>`,
    `To: ${addr(e.to)}`,
    e.cc.length ? `Cc: ${addr(e.cc)}` : '',
    `Subject: ${e.subject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Unsent: 1',
    '',
    toPlainText(e.body),
    '',
    attachmentNames.length ? `[Attachments in the simulation: ${attachmentNames.join(', ')}]` : '',
    '',
    `-- ${FOOTER}`,
    '',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === '' && i > 9))
    .join('\r\n');
}

// ───────────── Per-artifact files ─────────────

export function artifactFiles(a: Artifact, ctx: { email?: EmailPayload; meeting?: MeetingPayload; attachmentNames?: string[]; briefText?: string }): ExportFile[] {
  const content = a.versions[a.current].content;
  const vSuffix = a.current > 0 ? `-v${a.versions[a.current].v}` : '';
  const base = a.baseName + vSuffix;
  switch (a.format) {
    case 'md':
      return [
        { name: `${base}.md`, mime: 'text/markdown', content: markdownWithFootnotes(content, ctx.briefText), label: 'Markdown (.md)' },
        { name: `${base}.html`, mime: 'text/html', content: markdownToHtmlDocument(a.title, content, ctx.briefText), label: 'Web page (.html)' },
      ];
    case 'csv':
      return [{ name: `${base}.csv`, mime: 'text/csv', content: '\ufeff' + content, label: 'CSV (.csv)' }];
    case 'eml': {
      const email = ctx.email ?? { to: [], cc: [], subject: a.title, body: content, attachments: [] };
      return [
        { name: `${base}.eml`, mime: 'message/rfc822', content: emailToEml({ ...email, body: content }, ctx.attachmentNames ?? []), label: 'Email message (.eml)' },
        { name: `${base}.txt`, mime: 'text/plain', content: stripCitations(content), label: 'Plain text (.txt)' },
      ];
    }
    case 'ics':
      return [
        ...(ctx.meeting ? [{ name: `${base}.ics`, mime: 'text/calendar', content: meetingToIcs(ctx.meeting, a.id), label: 'Calendar invitation (.ics)' }] : []),
        { name: `${base}.md`, mime: 'text/markdown', content: markdownWithFootnotes(content, ctx.briefText), label: 'Markdown (.md)' },
      ];
  }
}

export function zipOf(files: ExportFile[]): Uint8Array {
  return buildZip(files.map((f) => ({ name: f.name, content: f.content })));
}

/** Trigger a browser download. */
export function download(file: { name: string; mime: string; content: string | Uint8Array }) {
  const blob = new Blob([file.content as BlobPart], { type: file.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
