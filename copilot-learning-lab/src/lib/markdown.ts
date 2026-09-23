/**
 * Tiny Markdown subset used for simulated answers and artifacts.
 * Supports: #/##/### headings, paragraphs, "- " bullets, "1. " numbered lists,
 * pipe tables, "> " callouts, "---" rules, **bold**, and citation tokens
 * written as [[c:sectionId]].
 */

export type Inline = { t: 'text'; v: string } | { t: 'bold'; v: string } | { t: 'cite'; id: string };

export type Block =
  | { type: 'h'; level: 1 | 2 | 3; inl: Inline[] }
  | { type: 'p'; inl: Inline[] }
  | { type: 'ul'; items: Inline[][] }
  | { type: 'ol'; items: Inline[][] }
  | { type: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { type: 'callout'; inl: Inline[] }
  | { type: 'hr' };

const CITE_RE = /\[\[c:([a-zA-Z0-9_-]+)\]\]/g;

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*)|(\[\[c:[a-zA-Z0-9_-]+\]\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1]) out.push({ t: 'bold', v: m[1].slice(2, -2) });
    else out.push({ t: 'cite', id: m[2].slice(4, -2) });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

const splitRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ type: 'h', level: h[1].length as 1 | 2 | 3, inl: parseInline(h[2]) }); i++; continue; }
    if (/^---+\s*$/.test(line)) { blocks.push({ type: 'hr' }); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push({ type: 'callout', inl: parseInline(buf.join(' ')) });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(parseInline(lines[i++].replace(/^\s*[-*]\s+/, '')));
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(parseInline(lines[i++].replace(/^\s*\d+\.\s+/, '')));
      blocks.push({ type: 'ol', items });
      continue;
    }
    if (line.trim().startsWith('|')) {
      const rowsRaw: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rowsRaw.push(lines[i++]);
      const cells = rowsRaw.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map(splitRow);
      const [head, ...rows] = cells;
      blocks.push({ type: 'table', head: head.map(parseInline), rows: rows.map((r) => r.map(parseInline)) });
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>|\s*[-*]\s+|\s*\d+\.\s+|\||---)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push({ type: 'p', inl: parseInline(buf.join(' ')) });
  }
  return blocks;
}

/** Ordered unique citation ids in a Markdown string. */
export function citationIds(src: string): string[] {
  const ids: string[] = [];
  for (const m of src.matchAll(CITE_RE)) if (!ids.includes(m[1])) ids.push(m[1]);
  return ids;
}

export const stripCitations = (src: string) => src.replace(/\s?\[\[c:[a-zA-Z0-9_-]+\]\]/g, '');

/** Plain-text rendering (for email bodies, clipboard, .eml). */
export function toPlainText(src: string): string {
  return stripCitations(src)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^>\s?/gm, '');
}
