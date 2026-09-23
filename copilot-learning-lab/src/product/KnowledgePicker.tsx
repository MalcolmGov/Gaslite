import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Input } from '@fluentui/react-components';
import { CloudRegular, DismissRegular, FolderRegular, HistoryRegular, LockClosedRegular, SearchRegular, GlobeRegular } from '@fluentui/react-icons';
import { mutate, useLab } from '../state/store';
import { closePicker, logPreview } from '../state/uiActions';
import { addKnowledge, setChatAttachments } from '../state/agentActions';
import { updateReadyTask } from '../state/coworkActions';
import { allDocuments, getDoc } from '../scenario/registry';
import type { SampleDocument } from '../scenario/types';
import { fmtDate } from '../lib/util';
import { Banner, FileIcon, StatusBadge } from './common';
import { DocumentView } from './DocumentView';

type Loc = 'recent' | 'programme' | 'sites' | 'onedrive';

const RECENT = ['doc_tracker35', 'doc_overview_copy', 'doc_overview', 'doc_register', 'doc_tracker38', 'doc_steering'];

function inLoc(d: SampleDocument, loc: Loc) {
  if (loc === 'recent') return RECENT.includes(d.id);
  if (loc === 'onedrive') return d.location.startsWith('OneDrive');
  if (loc === 'programme') return d.location.includes('AI & Automation Programme') || d.location.includes('AI Programme Steering');
  return d.location.startsWith('SharePoint') && !d.location.includes('AI & Automation Programme') && !d.location.includes('AI Programme Steering');
}

/** Simulated Microsoft 365 work-file picker used by Agent Builder, Copilot Chat and Cowork. */
export function KnowledgePicker() {
  const picker = useLab((s) => s.ui.pickerOpen);
  const agent = useLab((s) => (picker?.purpose === 'agent' && picker.targetId ? s.agents[picker.targetId] : undefined));
  const chatAttached = useLab((s) => s.copilotChat.attached);
  const task = useLab((s) => (picker?.purpose === 'cowork' && picker.targetId ? s.tasks[picker.targetId] : undefined));
  const draftFiles = useLab((s) => s.coworkDraft.files);
  const [loc, setLoc] = useState<Loc>('recent');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const existing = useMemo(() => {
    if (picker?.purpose === 'agent') return agent?.knowledge.filter((k) => k.status !== 'removed').map((k) => k.docId) ?? [];
    if (picker?.purpose === 'chat') return chatAttached;
    return task?.context.files ?? draftFiles;
  }, [picker, agent, chatAttached, task, draftFiles]);

  useEffect(() => {
    if (picker) { setSel(picker.purpose === 'agent' ? [] : [...existing]); setActive(null); setQ(''); setLoc('recent'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker]);

  if (!picker) return null;
  const docs = allDocuments.filter((d) => (q.trim() ? `${d.title} ${d.fileName} ${d.owner}`.toLowerCase().includes(q.trim().toLowerCase()) : inLoc(d, loc)));
  const ordered = loc === 'recent' && !q ? RECENT.map((id) => docs.find((d) => d.id === id)).filter(Boolean) as SampleDocument[] : docs;
  const activeDoc = active ? getDoc(active) : undefined;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const title = picker.purpose === 'agent' ? 'Add knowledge' : picker.purpose === 'chat' ? 'Add work content' : 'Attach cloud files';

  const confirm = () => {
    if (picker.purpose === 'agent' && picker.targetId) addKnowledge(picker.targetId, sel);
    if (picker.purpose === 'chat') setChatAttachments(sel.filter((id) => getDoc(id)?.learnerAccess === 'granted'));
    const granted = sel.filter((id) => getDoc(id)?.learnerAccess === 'granted');
    if (picker.purpose === 'cowork' && picker.targetId) updateReadyTask(picker.targetId, { files: granted });
    if (picker.purpose === 'cowork' && !picker.targetId) mutate((s) => { s.coworkDraft.files = granted; });
    closePicker();
  };

  const pick = (id: string) => { setActive(id); logPreview(id); };

  return (
    <Dialog open onOpenChange={(_, d) => { if (!d.open) closePicker(); }}>
      <DialogSurface style={{ maxWidth: 1080, width: 'calc(100vw - 32px)', padding: 0 }} aria-describedby={undefined}>
        <DialogBody style={{ gap: 0 }}>
          <DialogTitle
            style={{ padding: '16px 20px' }}
            action={<Button appearance="subtle" aria-label="Close" icon={<DismissRegular />} onClick={closePicker} />}
          >
            {title}
          </DialogTitle>
          <DialogContent style={{ padding: 0 }}>
            <div style={{ padding: '0 20px 12px' }}>
              <Input
                contentBefore={<SearchRegular />}
                placeholder="Search files by name or owner"
                aria-label="Search files"
                value={q}
                onChange={(_, d) => setQ(d.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="picker" data-tour="knowledge-picker">
              <div className="picker-nav" role="tablist" aria-label="Locations">
                {([
                  ['recent', 'Recent', <HistoryRegular key="i" />],
                  ['programme', 'AI & Automation Programme', <FolderRegular key="i" />],
                  ['sites', 'Other SharePoint sites', <GlobeRegular key="i" />],
                  ['onedrive', 'OneDrive', <CloudRegular key="i" />],
                ] as const).map(([id, label, icon]) => (
                  <button key={id} role="tab" aria-selected={loc === id && !q} className="nav-item" aria-current={loc === id && !q ? 'page' : undefined} onClick={() => { setLoc(id); setQ(''); }}>
                    {icon}<span className="grow" style={{ whiteSpace: 'normal' }}>{label}</span>
                  </button>
                ))}
              </div>
              <div className="picker-list" role="list" aria-label="Files">
                {!ordered.length && <p className="muted small" style={{ padding: 8 }}>No files match "{q}".</p>}
                {ordered.map((d) => {
                  const checked = sel.includes(d.id);
                  const already = picker.purpose === 'agent' && existing.includes(d.id);
                  return (
                    <div key={d.id} role="listitem" className={`file-row ${active === d.id ? 'active' : ''}`} onClick={() => pick(d.id)}>
                      <Checkbox
                        checked={checked || already}
                        disabled={already}
                        aria-label={`Select ${d.fileName}, ${d.version}, modified ${fmtDate(d.modified)}`}
                        onChange={() => { toggle(d.id); pick(d.id); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <FileIcon kind={d.kind} />
                      <div style={{ minWidth: 0 }}>
                        <div className="title">{d.fileName}</div>
                        <div className="meta">{d.version} · Modified {fmtDate(d.modified)} · {d.owner}</div>
                        <div className="meta">{d.location}</div>
                        <div className="flags">
                          <StatusBadge tone="neutral">{d.classification}</StatusBadge>
                          {d.learnerAccess === 'denied' && <StatusBadge tone="danger" icon={<LockClosedRegular />}>No access</StatusBadge>}
                          {d.supersededBy && <StatusBadge tone="warning">Superseded</StatusBadge>}
                          {d.duplicateOf && <StatusBadge tone="warning">Possible duplicate</StatusBadge>}
                          {already && <StatusBadge tone="brand">Already added</StatusBadge>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="picker-preview" aria-live="polite">
                {!activeDoc ? (
                  <p className="muted">Select a file to preview its contents, version and access.</p>
                ) : (
                  <PreviewPane doc={activeDoc} onSwap={(from, to) => setSel((s) => [...s.filter((x) => x !== from), to])} selected={sel} />
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions style={{ padding: '12px 20px', borderTop: '1px solid var(--stroke)' }}>
            <span className="small muted" style={{ marginRight: 'auto' }}>
              {picker.purpose === 'agent' ? `${sel.length} selected` : `${sel.length} attached`}
            </span>
            <Button onClick={closePicker}>Cancel</Button>
            <Button appearance="primary" onClick={confirm} disabled={picker.purpose === 'agent' && !sel.length}>
              {picker.purpose === 'agent' ? 'Add' : 'Attach'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

function PreviewPane({ doc, onSwap, selected }: { doc: SampleDocument; onSwap: (from: string, to: string) => void; selected: string[] }) {
  const newer = doc.supersededBy ? getDoc(doc.supersededBy) : undefined;
  const original = doc.duplicateOf ? getDoc(doc.duplicateOf) : undefined;
  return (
    <div className="stack" style={{ gap: 10 }}>
      {doc.learnerAccess === 'denied' ? (
        <>
          <Banner tone="error" title="Access denied.">{doc.accessMessage}</Banner>
          <p className="small">
            <strong>Try another source:</strong> the AI Programme Overview covers the current-year budget and says who manages FY2027 planning.
          </p>
          <Button size="small" onClick={() => onSwap(doc.id, 'doc_overview')} disabled={selected.includes('doc_overview')}>Select AI Programme Overview instead</Button>
        </>
      ) : (
        <>
          {newer && (
            <Banner tone="warning" title="Superseded.">
              A newer version exists: <strong>{newer.version}</strong>, modified {fmtDate(newer.modified)}. Using this file could give outdated answers.
              <div style={{ marginTop: 6 }}><Button size="small" onClick={() => onSwap(doc.id, newer.id)} disabled={selected.includes(newer.id)}>Select the newer version instead</Button></div>
            </Banner>
          )}
          {original && (
            <Banner tone="warning" title="Possible duplicate.">
              This looks like a copy of <strong>{original.fileName}</strong> ({original.location}). Copies in your OneDrive don't get updates and colleagues can't open them.
              <div style={{ marginTop: 6 }}><Button size="small" onClick={() => onSwap(doc.id, original.id)} disabled={selected.includes(original.id)}>Select the original instead</Button></div>
            </Banner>
          )}
          <DocumentView doc={doc} />
        </>
      )}
    </div>
  );
}
