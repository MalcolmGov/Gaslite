import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button, Dropdown, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Option, Spinner, Tooltip } from '@fluentui/react-components';
import { ArrowDownloadRegular, DismissRegular, EditRegular, SparkleRegular, ThumbDislikeRegular, ThumbLikeRegular, ArrowSyncRegular, ArrowSwapRegular } from '@fluentui/react-icons';
import { useLab } from '../../state/store';
import { editArtifact, regenerateAffected, replaceTaskFile, requestRevision, selectArtifactVersion, viewArtifact } from '../../state/coworkActions';
import { openCitation, logDownload } from '../../state/uiActions';
import { artifactFiles, download } from '../../engine/exports';
import { classifyRevision, REVISION_OPTIONS } from '../../engine/cowork/revise';
import { clockTime, fmtDate } from '../../lib/util';
import { getDoc } from '../../scenario/registry';
import { Banner, FileIcon, Markdown } from '../common';

function CsvTable({ csv }: { csv: string }) {
  const rows = csv.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map((r) => r.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')).filter((_, i, a) => i < a.length - 1 || a.length === 1));
  const [head, ...body] = rows;
  return (
    <div className="md">
      <table>
        <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
        <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Split-view preview of a Cowork output with versions, editing, revisions and honest downloads. */
export function ArtifactPanel({ artifactId, onClose }: { artifactId: string; onClose: () => void }) {
  const a = useLab((s) => s.artifacts[artifactId]);
  const task = useLab((s) => (a ? s.tasks[a.taskId] : undefined));
  const action = useLab(useShallow((s) => (task ? task.actionIds.map((id) => s.actions[id]) : [])));
  const artifacts = useLab((s) => s.artifacts);
  const revising = useLab((s) => !!s.ui.busy[`revise:${artifactId}`]);
  const regenerating = useLab((s) => (task ? !!s.ui.busy[`regen:${task.id}`] : false));
  const checkedSource = useLab((s) => !!task && s.events.some((e) => e.type === 'artifact_source_opened' && e.data?.taskId === task.id));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [freeText, setFreeText] = useState('');
  const [revNote, setRevNote] = useState('');
  const [rating, setRating] = useState<null | 'up' | 'down'>(null);

  useEffect(() => { viewArtifact(artifactId); setEditing(false); setRevNote(''); }, [artifactId]);
  if (!a || !task) return null;
  const v = a.versions[a.current];
  const email = action.find((x) => x.kind === 'email')?.email;
  const meeting = action.find((x) => x.kind === 'meeting')?.meeting;
  const files = artifactFiles(a, {
    email: a.key === 'email' || a.key === 'escalation' ? email : undefined,
    meeting: a.key === 'invite' ? meeting : undefined,
    attachmentNames: email?.attachments.map((id) => artifacts[id]?.title).filter(Boolean) as string[],
    briefText: task.context.brief?.text,
  });
  const onCite = (id: string) => openCitation(id, { taskId: task.id, scenario: task.scenarioId });
  const outdated = v.sources
    .map((id) => getDoc(id))
    .filter((d): d is NonNullable<typeof d> => !!d?.supersededBy)
    .map((doc) => ({ doc, newer: getDoc(doc.supersededBy!)! }));
  const canRevise = a.editable && a.key !== 'summary';

  const submitFree = () => {
    const r = classifyRevision(freeText);
    if (!r) { setRevNote('In this simulation Cowork can make an output shorter, more formal, lead with decisions, or add owners and dates. Try one of those.'); return; }
    setRevNote('');
    requestRevision(a.id, r);
    setFreeText('');
  };

  return (
    <aside className="panel wide" aria-labelledby="art-title" data-tour="artifact-preview">
      <div className="panel-head">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
          <FileIcon kind={a.format} />
          <div style={{ minWidth: 0 }}>
            <h2 id="art-title">{a.title}</h2>
            <div className="xsmall muted">Version {v.v} of {a.versions.length} · {v.reason} · {clockTime(v.at)}</div>
          </div>
        </div>
        <Button appearance="subtle" icon={<DismissRegular />} aria-label="Close preview" onClick={onClose} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--stroke)', flexWrap: 'wrap', alignItems: 'center' }}>
        {a.versions.length > 1 && (
          <Dropdown
            aria-label="Version"
            size="small"
            value={`Version ${v.v}`}
            selectedOptions={[String(a.current)]}
            onOptionSelect={(_, d) => selectArtifactVersion(a.id, Number(d.optionValue))}
          >
            {a.versions.map((x, i) => <Option key={i} value={String(i)} text={`Version ${x.v}`}>Version {x.v} — {x.reason}</Option>)}
          </Dropdown>
        )}
        {a.editable && !editing && (
          <Button size="small" icon={<EditRegular />} onClick={() => { setDraft(v.content); setEditing(true); }}>Edit</Button>
        )}
        {canRevise && (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button size="small" icon={revising ? <Spinner size="extra-tiny" /> : <SparkleRegular />} disabled={revising}>Request a revision</Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {REVISION_OPTIONS.map((r) => <MenuItem key={r.id} onClick={() => requestRevision(a.id, r.id)}>{r.label}</MenuItem>)}
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button size="small" icon={<ArrowDownloadRegular />}>Download</Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {files.map((f) => (
                <MenuItem key={f.name} onClick={() => { download(f); logDownload(f.name); }}>{f.label} — {f.name}</MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
        <span style={{ marginLeft: 'auto', display: 'flex' }}>
          <Tooltip content="Helpful" relationship="label"><button className="icon-btn" aria-pressed={rating === 'up'} onClick={() => setRating('up')}><ThumbLikeRegular /></button></Tooltip>
          <Tooltip content="Not helpful" relationship="label"><button className="icon-btn" aria-pressed={rating === 'down'} onClick={() => setRating('down')}><ThumbDislikeRegular /></button></Tooltip>
        </span>
      </div>
      <div className="panel-body">
        {a.stale && (
          <div style={{ marginBottom: 12 }}>
            <Banner tone="warning" title="Based on a replaced source.">
              This output was generated from a file you've since replaced.
              <div style={{ marginTop: 6 }}>
                <Button size="small" appearance="primary" icon={regenerating ? <Spinner size="extra-tiny" /> : <ArrowSyncRegular />} disabled={regenerating} onClick={() => regenerateAffected(task.id)}>Regenerate affected outputs</Button>
              </div>
            </Banner>
          </div>
        )}
        {!a.stale && checkedSource && a.current === a.versions.length - 1 && outdated.map(({ doc, newer }) => (
          <div key={doc.id} className="tcard small" style={{ marginBottom: 12 }}>
            <div className="row-between" style={{ marginBottom: 4 }}>
              <strong>You checked the source: it's outdated</strong>
              <span className="tpill">Learning Lab</span>
            </div>
            This version uses {doc.title} ({doc.version}, {fmtDate(doc.modified)}), which is superseded by {newer.version} ({fmtDate(newer.modified)}). Replace the input file, then regenerate.
            {task.context.files.includes(doc.id) && task.status !== 'cancelled' && (
              <div style={{ marginTop: 8 }}>
                <Button size="small" icon={<ArrowSwapRegular />} onClick={() => replaceTaskFile(task.id, doc.id, newer.id)}>Replace with {newer.version}</Button>
              </div>
            )}
          </div>
        ))}
        {a.current < a.versions.length - 1 && <div style={{ marginBottom: 12 }}><Banner tone="info">You're viewing an earlier version. The latest is version {a.versions.length}.</Banner></div>}
        {editing ? (
          <div className="stack" style={{ gap: 8 }}>
            <label className="field-label" htmlFor="art-edit">Edit {a.title.toLowerCase()}</label>
            <textarea id="art-edit" className="textarea" rows={22} value={draft} onChange={(e) => setDraft(e.target.value)} style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13 }} />
            {(a.key === 'email' || a.key === 'escalation') && <Banner tone="info">Saving updates the email waiting for approval. If you already approved it, you'll need to approve the changed version.</Banner>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
              <Button appearance="primary" onClick={() => { editArtifact(a.id, draft); setEditing(false); }}>Save as new version</Button>
            </div>
          </div>
        ) : a.format === 'csv' ? (
          <CsvTable csv={v.content} />
        ) : a.format === 'eml' ? (
          <div>
            {email && (
              <dl className="kv small" style={{ marginBottom: 8 }}>
                <dt>To</dt><dd>{email.to.map((r) => r.name).join('; ')}</dd>
                {email.cc.length > 0 && (<><dt>Cc</dt><dd>{email.cc.map((r) => r.name).join('; ')}</dd></>)}
                <dt>Subject</dt><dd>{email.subject}</dd>
              </dl>
            )}
            <div className="email-body" style={{ maxHeight: 'none' }}>{v.content}</div>
          </div>
        ) : (
          <Markdown text={v.content} onCite={onCite} />
        )}
        {canRevise && !editing && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--stroke)', paddingTop: 12 }}>
            <label className="small" htmlFor="rev-free" style={{ fontWeight: 600 }}>Describe a change</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <Input id="rev-free" value={freeText} onChange={(_, d) => setFreeText(d.value)} placeholder='e.g. "Make it shorter"' style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter' && freeText.trim()) submitFree(); }} />
              <Button disabled={!freeText.trim() || revising} onClick={submitFree}>Revise</Button>
            </div>
            {revNote && <p className="small" role="status" style={{ color: 'var(--warning)' }}>{revNote}</p>}
          </div>
        )}
        <p className="xsmall muted" style={{ marginTop: 16 }}>Generated from: {v.sources.length ? v.sources.map((id) => { const d = getDoc(id); return d ? `${d.title} (${d.version})` : id; }).join('; ') : 'task context'}. Downloads are generated in your browser in the format named — no Word or PDF files are produced.</p>
      </div>
    </aside>
  );
}
