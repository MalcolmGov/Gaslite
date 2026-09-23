import { Button, Spinner, Tooltip } from '@fluentui/react-components';
import { ArrowDownloadRegular, ArrowSwapRegular, ArrowSyncRegular, CheckmarkRegular, DocumentTextRegular, EyeRegular, WarningRegular } from '@fluentui/react-icons';
import { useShallow } from 'zustand/react/shallow';
import type { Task } from '../../engine/model';
import { scenarios } from '../../engine/cowork/scenarios';
import { useLab } from '../../state/store';
import { regenerateAffected, replaceTaskFile } from '../../state/coworkActions';
import { artifactFiles, download, zipOf } from '../../engine/exports';
import { logDownload } from '../../state/uiActions';
import { getDoc } from '../../scenario/registry';
import { fmtDate, slugify } from '../../lib/util';
import { FileIcon } from '../common';

export function taskProgress(t: Task): number {
  if (t.status === 'completed') return 100;
  if (t.status === 'ready') return 0;
  const steps = scenarios[t.scenarioId].steps(t).filter((s) => !('when' in s && s.when && !s.when(t)));
  const all = scenarios[t.scenarioId].steps(t);
  const done = all.slice(0, t.cursor).filter((s) => !('when' in s && s.when && !s.when(t))).length;
  return Math.min(99, Math.round((done / Math.max(1, steps.length)) * 100));
}

/** Cowork side panel: progress, input and output folders, skills, permissions. */
export function SidePanel({ task, open, onOpenArtifact, onOpenBrief }: { task: Task; open: boolean; onOpenArtifact: (id: string) => void; onOpenBrief: () => void }) {
  const artifacts = useLab(useShallow((s) => task.artifactIds.map((id) => s.artifacts[id]).filter(Boolean)));
  const actions = useLab(useShallow((s) => task.actionIds.map((id) => s.actions[id]).filter(Boolean)));
  const regenerating = useLab((s) => !!s.ui.busy[`regen:${task.id}`]);
  const pct = taskProgress(task);
  const log = task.transcript.filter((i) => i.kind === 'tool' || i.kind === 'skill');
  const anyStale = artifacts.some((a) => a.stale);
  const email = actions.find((a) => a.kind === 'email')?.email;
  const meeting = actions.find((a) => a.kind === 'meeting')?.meeting;

  const filesFor = (id: string) => {
    const a = artifacts.find((x) => x.id === id)!;
    return artifactFiles(a, {
      email: a.key === 'email' || a.key === 'escalation' ? email : undefined,
      meeting: a.key === 'invite' ? meeting : undefined,
      attachmentNames: email?.attachments.map((x) => artifacts.find((y) => y.id === x)?.title ?? '').filter(Boolean),
      briefText: task.context.brief?.text,
    });
  };
  const downloadAll = () => {
    const files = artifacts.flatMap((a) => filesFor(a.id));
    const name = `${slugify(task.title)}-outputs.zip`;
    download({ name, mime: 'application/zip', content: zipOf(files) });
    logDownload(name);
  };

  return (
    <aside className={`side-panel ${open ? '' : 'closed'}`} aria-label="Task details" hidden={!open}>
      <section>
        <h2>Progress <span className="xsmall muted">{pct}%</span></h2>
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Task progress"><span style={{ width: `${pct}%` }} /></div>
        <ol style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', maxHeight: 180, overflow: 'auto' }}>
          {log.map((i) => (
            <li key={i.id} className="step-line small" style={{ margin: '4px 0' }}>
              {i.kind === 'tool' ? (i.state === 'running' ? <Spinner size="extra-tiny" /> : i.state === 'interrupted' ? <WarningRegular color="var(--warning)" /> : <CheckmarkRegular color="var(--success)" />) : <DocumentTextRegular color="var(--text-3)" />}
              <span>{i.text}{i.kind === 'tool' && i.state === 'interrupted' ? ' (interrupted)' : ''}</span>
            </li>
          ))}
          {!log.length && <li className="xsmall muted">Steps appear here as Cowork works.</li>}
        </ol>
      </section>

      <section data-tour="input-folder">
        <h2>Input folder</h2>
        {task.context.brief && (
          <button className="file-chip" style={{ width: '100%', cursor: 'pointer', marginBottom: 6 }} onClick={onOpenBrief}>
            <FileIcon kind="md" size="sm" />
            <span style={{ textAlign: 'left' }}>Programme briefing<br /><span className="meta">From {task.context.brief.agentName}</span></span>
          </button>
        )}
        {task.context.files.map((id) => {
          const d = getDoc(id);
          if (!d) return null;
          const newer = d.supersededBy ? getDoc(d.supersededBy) : undefined;
          return (
            <div key={id} className={`file-chip ${newer ? 'warn' : ''}`} style={{ width: '100%', flexWrap: 'wrap', marginBottom: 6 }}>
              <FileIcon kind={d.kind} size="sm" />
              <span style={{ flex: 1, minWidth: 0 }}>{d.fileName}<br /><span className="meta">{d.version} · {fmtDate(d.modified)} · {d.location.split(' › ').slice(-1)[0]}</span></span>
              {newer && task.status !== 'ready' && (
                <div style={{ width: '100%' }}>
                  <div className="xsmall" style={{ color: 'var(--warning)', margin: '4px 0' }}>Superseded by {newer.version} ({fmtDate(newer.modified)}).</div>
                  <Button size="small" icon={<ArrowSwapRegular />} onClick={() => replaceTaskFile(task.id, id, newer.id)} disabled={task.status === 'cancelled'}>Replace with {newer.version}</Button>
                </div>
              )}
            </div>
          );
        })}
        {!task.context.files.length && !task.context.brief && <p className="xsmall muted">No files attached.</p>}
        {anyStale && (
          <Button appearance="primary" size="small" icon={regenerating ? <Spinner size="extra-tiny" /> : <ArrowSyncRegular />} disabled={regenerating || task.status === 'cancelled'} onClick={() => regenerateAffected(task.id)} style={{ marginTop: 4 }}>
            Regenerate affected outputs
          </Button>
        )}
      </section>

      <section>
        <h2>
          Output folder
          {artifacts.length > 0 && <Button size="small" appearance="subtle" icon={<ArrowDownloadRegular />} onClick={downloadAll}>Download all (.zip)</Button>}
        </h2>
        {!artifacts.length && <p className="xsmall muted">Files Cowork creates appear here.</p>}
        {artifacts.map((a) => (
          <div key={a.id} className="ks-row" style={{ padding: '6px 0' }} data-tour={a.key === 'update' ? 'output-update' : undefined}>
            <FileIcon kind={a.format} size="sm" />
            <div className="info">
              <div className="name small">{a.title}</div>
              <div className="meta">v{a.versions[a.current].v}{a.stale ? ' · needs regenerating' : ''}{a.viewed ? '' : ' · not opened'}</div>
            </div>
            <Tooltip content={`Preview ${a.title}`} relationship="label">
              <button className="icon-btn" onClick={() => onOpenArtifact(a.id)}><EyeRegular /></button>
            </Tooltip>
            <Tooltip content={`Download ${filesFor(a.id)[0].name}`} relationship="label">
              <button className="icon-btn" onClick={() => { const f = filesFor(a.id)[0]; download(f); logDownload(f.name); }}><ArrowDownloadRegular /></button>
            </Tooltip>
          </div>
        ))}
      </section>

      <section>
        <h2>Skills</h2>
        <div className="chips" style={{ margin: 0 }}>
          {task.skills.length ? task.skills.map((s) => <span key={s} className="chip" style={{ cursor: 'default' }}>{s}</span>) : <span className="xsmall muted">None loaded yet.</span>}
        </div>
      </section>

      <section>
        <h2>Permissions</h2>
        <p className="xsmall muted" style={{ margin: 0 }}>No "don't ask again" permissions. In this training every email and meeting needs your individual approval.</p>
      </section>
    </aside>
  );
}
