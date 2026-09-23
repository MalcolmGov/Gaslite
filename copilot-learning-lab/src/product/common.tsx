import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Tooltip } from '@fluentui/react-components';
import {
  AddRegular,
  ArrowUpRegular,
  CheckmarkCircleFilled,
  ErrorCircleRegular,
  InfoRegular,
  MicRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import { citationIds, parseMarkdown, type Block, type Inline } from '../lib/markdown';
import { resolveCitation } from '../scenario/registry';
import type { FileKind } from '../scenario/types';
import { useLab } from '../state/store';

// ───────────── Markdown with citations ─────────────

interface MdProps {
  text: string;
  onCite?: (id: string) => void;
  /** Reveal text progressively (streaming effect) — ignored for reduced motion. */
  stream?: boolean;
}

export function Markdown({ text, onCite, stream }: MdProps) {
  const shown = useStream(text, !!stream);
  const ids = useMemo(() => citationIds(text), [text]);
  const blocks = useMemo(() => parseMarkdown(shown), [shown]);
  return <div className="md">{blocks.map((b, i) => <BlockView key={i} b={b} ids={ids} onCite={onCite} />)}</div>;
}

function InlineView({ inl, ids, onCite }: { inl: Inline[]; ids: string[]; onCite?: (id: string) => void }) {
  return (
    <>
      {inl.map((x, i) => {
        if (x.t === 'text') return <span key={i}>{x.v}</span>;
        if (x.t === 'bold') return <strong key={i}>{x.v}</strong>;
        const n = ids.indexOf(x.id) + 1;
        const r = resolveCitation(x.id);
        const label = r.pseudo ? r.pseudo.title : `${r.doc?.title ?? 'Source'} — ${r.section?.heading ?? ''}`;
        return (
          <button key={i} type="button" className="cite" data-tour="citation" aria-label={`Citation ${n}: ${label}`} title={label} onClick={() => onCite?.(x.id)}>
            {n}
          </button>
        );
      })}
    </>
  );
}

function BlockView({ b, ids, onCite }: { b: Block; ids: string[]; onCite?: (id: string) => void }) {
  const I = (inl: Inline[]) => <InlineView inl={inl} ids={ids} onCite={onCite} />;
  switch (b.type) {
    case 'h':
      return b.level === 1 ? <h1>{I(b.inl)}</h1> : b.level === 2 ? <h2>{I(b.inl)}</h2> : <h3>{I(b.inl)}</h3>;
    case 'p':
      return <p>{I(b.inl)}</p>;
    case 'ul':
      return <ul>{b.items.map((it, i) => <li key={i}>{I(it)}</li>)}</ul>;
    case 'ol':
      return <ol>{b.items.map((it, i) => <li key={i}>{I(it)}</li>)}</ol>;
    case 'callout':
      return <blockquote>{I(b.inl)}</blockquote>;
    case 'hr':
      return <hr />;
    case 'table':
      return (
        <table>
          <thead><tr>{b.head.map((h, i) => <th key={i} scope="col">{I(h)}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{I(c)}</td>)}</tr>)}</tbody>
        </table>
      );
  }
}

/** Reference chips listing each cited source once, in citation order. */
export function References({ text, onCite }: { text: string; onCite: (id: string) => void }) {
  const ids = citationIds(text);
  if (!ids.length) return null;
  return (
    <div className="refs" aria-label="References">
      {ids.map((id, i) => {
        const r = resolveCitation(id);
        const section = r.section?.heading.replace(/^[\d.]+\s*/, '').replace(/\s*\(.*\)$/, '');
        const title = r.pseudo ? r.pseudo.title : `${r.doc?.title ?? id}${section ? ` · ${section}` : ''}`;
        return (
          <button key={id} type="button" className="ref-chip" onClick={() => onCite(id)} aria-label={`Open reference ${i + 1}: ${title}`}>
            <span className="num">{i + 1}</span>
            {r.doc && <FileIcon kind={r.doc.kind} size="sm" />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function useStream(text: string, enabled: boolean): string {
  const speed = useLab((s) => s.facilitator.speed);
  const [n, setN] = useState(enabled ? 0 : text.length);
  const started = useRef(false);
  useEffect(() => {
    if (!enabled || speed === 'instant' || prefersReducedMotion()) { setN(text.length); return; }
    if (started.current) { setN(text.length); return; }
    started.current = true;
    let i = 0;
    const step = Math.max(6, Math.round(text.length / 40));
    const h = setInterval(() => {
      i = Math.min(text.length, i + step);
      setN(i);
      if (i >= text.length) clearInterval(h);
    }, 30);
    return () => { clearInterval(h); setN(text.length); };
  }, [text, enabled, speed]);
  if (!enabled) return text;
  // Avoid cutting inside a citation token or table row.
  let cut = text.slice(0, n);
  const open = cut.lastIndexOf('[[');
  if (open > cut.lastIndexOf(']]')) cut = cut.slice(0, open);
  return cut;
}

// ───────────── File icons (approximated Microsoft 365 treatments) ─────────────

const KIND: Record<FileKind, { color: string; label: string; name: string }> = {
  docx: { color: '#185abd', label: 'W', name: 'Word document' },
  xlsx: { color: '#107c41', label: 'X', name: 'Excel workbook' },
  pptx: { color: '#c43e1c', label: 'P', name: 'PowerPoint presentation' },
  pdf: { color: '#d13438', label: 'PDF', name: 'PDF document' },
  txt: { color: '#616161', label: 'TXT', name: 'Text file' },
};

export function FileIcon({ kind, size }: { kind: FileKind | 'md' | 'csv' | 'eml' | 'ics'; size?: 'sm' }) {
  const map: Record<string, { color: string; label: string; name: string }> = {
    ...KIND,
    md: { color: '#185abd', label: 'MD', name: 'Markdown document' },
    csv: { color: '#107c41', label: 'CSV', name: 'CSV table' },
    eml: { color: '#0f6cbd', label: '✉', name: 'Email message' },
    ics: { color: '#0f6cbd', label: 'CAL', name: 'Calendar invitation' },
  };
  const k = map[kind];
  return (
    <span className={`fileicon ${size ?? ''}`} role="img" aria-label={k.name}>
      <span className="page" />
      <span className="badge" style={{ background: k.color }}>{k.label}</span>
    </span>
  );
}

// ───────────── Status badge ─────────────

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export function StatusBadge({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: ReactNode }) {
  return <span className={`status ${tone}`}>{icon}{children}</span>;
}

export function Banner({ tone, children, title }: { tone: 'info' | 'warning' | 'error' | 'success'; children: ReactNode; title?: string }) {
  const Icon = tone === 'success' ? CheckmarkCircleFilled : tone === 'error' ? ErrorCircleRegular : tone === 'warning' ? WarningRegular : InfoRegular;
  const color = tone === 'success' ? 'var(--success)' : tone === 'error' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)' : 'var(--brand)';
  return (
    <div className={`banner ${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon className="icon" fontSize={18} color={color} aria-hidden />
      <div>{title && <strong>{title} </strong>}{children}</div>
    </div>
  );
}

// ───────────── Composer ─────────────

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  busy?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  addMenu?: ReactNode;
  children?: ReactNode;
  tour?: string;
  label: string;
  footerLeft?: ReactNode;
}

export function Composer({ value, onChange, onSend, placeholder, disabled, busy, onAdd, addLabel, addMenu, children, tour, label, footerLeft }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(240, el.scrollHeight) + 'px';
  }, [value]);
  const canSend = !!value.trim() && !disabled && !busy;
  return (
    <div className="composer" data-tour={tour}>
      {children}
      <label className="sr-only" htmlFor={`cmp-${tour ?? label}`}>{label}</label>
      <textarea
        id={`cmp-${tour ?? label}`}
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
      />
      <div className="row">
        <div className="left">
          {addMenu ??
            (onAdd && (
              <Tooltip content={addLabel ?? 'Add'} relationship="label">
                <button type="button" className="icon-btn" onClick={onAdd} disabled={disabled}><AddRegular fontSize={20} /></button>
              </Tooltip>
            ))}
          {footerLeft}
        </div>
        <div className="right">
          <Tooltip content="Voice input isn't available in this training simulation" relationship="label">
            <button type="button" className="icon-btn" aria-disabled="true" onClick={(e) => e.preventDefault()}><MicRegular fontSize={20} /></button>
          </Tooltip>
          <Tooltip content={busy ? 'Waiting for the response' : 'Send'} relationship="label">
            <button type="button" className="send-btn" disabled={!canSend} onClick={onSend}><ArrowUpRegular fontSize={18} /></button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function Thinking({ label = 'Thinking' }: { label?: string }) {
  return (
    <span className="thinking" role="status" aria-live="polite">
      <i /><i /><i /> <span>{label}…</span>
    </span>
  );
}

export function AgentIcon({ name, size, policy }: { name: string; size?: 'lg'; policy?: boolean }) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A';
  return <span className={`agent-icon ${size ?? ''} ${policy ? 'policy' : ''}`} aria-hidden>{letters}</span>;
}

/** Scroll a container to the bottom when its content grows. */
export function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [dep]);
  return ref;
}

/**
 * Run fn after a Fluent dialog has finished closing. Swapping or unmounting an
 * open modal in the same render can leave aria-hidden on the page behind it.
 */
export function afterDialogClose(fn: () => void) {
  setTimeout(fn, 220);
}

/**
 * Safety net: when no dialog is open, nothing that contains the main content
 * should be hidden from assistive technology.
 */
export function clearStaleAriaHidden() {
  if (document.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"]')) return;
  const main = document.getElementById('main-content');
  if (!main) return;
  document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
    if (el.contains(main)) el.removeAttribute('aria-hidden');
  });
}
