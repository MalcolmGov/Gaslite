import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Tooltip } from '@fluentui/react-components';
import { AddRegular, CloudRegular, DismissRegular, DocumentAddRegular, PersonBoardRegular, ChevronDownRegular } from '@fluentui/react-icons';
import { mutate, useLab } from '../../state/store';
import { startFromHome } from '../../state/coworkActions';
import { navigate } from '../../state/router';
import { openPicker } from '../../state/uiActions';
import { getDoc } from '../../scenario/registry';
import type { Task, TaskStatus } from '../../engine/model';
import { fmtDate, clockTime } from '../../lib/util';
import { Composer, FileIcon, StatusBadge } from '../common';

const SUGGESTED = [
  { label: 'Catch me up', prompt: 'Catch me up on what I missed this week.' },
  { label: 'Organize my inbox', prompt: 'Organize my inbox and flag anything urgent.' },
  { label: 'Prep for a meeting', prompt: "Prep for Thursday's working group meeting: review the notes and prepare an agenda." },
  { label: 'Plan an event', prompt: 'Plan a team event for next month.' },
];

export const STATUS_LABEL: Record<TaskStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }> = {
  ready: { label: 'Ready', tone: 'neutral' },
  working: { label: 'Working', tone: 'brand' },
  needs_input: { label: 'Needs input', tone: 'warning' },
  needs_approval: { label: 'Needs approval', tone: 'warning' },
  paused: { label: 'Paused', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_LABEL[status];
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}

type Filter = 'all' | 'input' | 'progress' | 'complete' | 'unread';
const FILTERS: { id: Filter; label: string; match: (t: Task) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'input', label: 'Needs your input', match: (t) => t.status === 'needs_input' || t.status === 'needs_approval' || t.status === 'ready' },
  { id: 'progress', label: 'In progress', match: (t) => t.status === 'working' || t.status === 'paused' || t.status === 'failed' },
  { id: 'complete', label: 'Complete', match: (t) => t.status === 'completed' || t.status === 'cancelled' },
  { id: 'unread', label: 'Unread', match: (t) => !!t.unread },
];

export function CoworkHome() {
  const draft = useLab((s) => s.coworkDraft);
  const tasks = useLab(useShallow((s) => s.taskOrder.map((id) => s.tasks[id]).filter(Boolean)));
  const [filter, setFilter] = useState<Filter>('all');
  const [uploadNote, setUploadNote] = useState(false);
  const setPrompt = (v: string) => mutate((s) => { s.coworkDraft.prompt = v; });
  const shown = tasks.filter(FILTERS.find((f) => f.id === filter)!.match);

  const addMenu = (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content="Add attachments" relationship="label">
          <button type="button" className="icon-btn"><AddRegular fontSize={20} /></button>
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem icon={<PersonBoardRegular />} onClick={() => openPicker('cowork')}>Add work context</MenuItem>
          <MenuItem icon={<DocumentAddRegular />} onClick={() => setUploadNote(true)}>Upload images and files</MenuItem>
          <MenuItem icon={<CloudRegular />} onClick={() => openPicker('cowork')}>Attach cloud files</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );

  return (
    <div className="conv-wrap" style={{ maxWidth: 880 }}>
      <div className="hero" style={{ marginTop: '6vh' }}>
        <h1>What should Cowork take on?</h1>
        <p>Describe the outcome you need. Cowork works through the steps and asks before it sends or schedules anything.</p>
      </div>
      <Composer
        tour="cowork-home-composer"
        label="Describe a task for Cowork"
        value={draft.prompt}
        onChange={setPrompt}
        onSend={() => startFromHome(draft.prompt, draft.files)}
        placeholder="Describe what you need done"
        addMenu={addMenu}
        footerLeft={
          <>
            <Tooltip content="Fixed to Auto in this simulation" relationship="description">
              <Button size="small" appearance="subtle" icon={<ChevronDownRegular />} iconPosition="after" aria-disabled="true">Auto</Button>
            </Tooltip>
          </>
        }
      >
        {(draft.files.length > 0 || draft.briefFromAgent) && (
          <div className="chips" style={{ margin: '0 0 6px' }}>
            {draft.files.map((id) => {
              const d = getDoc(id)!;
              return (
                <span key={id} className={`file-chip ${d.supersededBy ? 'warn' : ''}`}>
                  <FileIcon kind={d.kind} size="sm" />
                  <span>{d.fileName}<br /><span className="meta">{d.version} · {fmtDate(d.modified)}</span></span>
                  <button className="icon-btn" aria-label={`Remove ${d.fileName}`} onClick={() => mutate((s) => { s.coworkDraft.files = s.coworkDraft.files.filter((x) => x !== id); })}><DismissRegular /></button>
                </span>
              );
            })}
          </div>
        )}
      </Composer>
      {uploadNote && (
        <p className="small muted" role="status">Uploading from your device is turned off in this training so no real files leave your computer. Use <strong>Attach cloud files</strong> to choose sample files.</p>
      )}
      <div className="chips" aria-label="Suggested prompts">
        {SUGGESTED.map((s) => <button key={s.label} className="chip" onClick={() => setPrompt(s.prompt)}>{s.label}</button>)}
      </div>

      <div className="row-between" style={{ margin: '28px 0 10px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>My tasks</h2>
        <div className="chips" style={{ margin: 0 }} role="group" aria-label="Filter tasks">
          {FILTERS.map((f) => <button key={f.id} className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        </div>
      </div>
      {!shown.length && <p className="muted small">No tasks to show.</p>}
      <div className="stack" style={{ gap: 8 }}>
        {shown.map((t) => (
          <button key={t.id} className="task-list-row" onClick={() => navigate({ name: 'task', taskId: t.id })}>
            <span style={{ minWidth: 0 }}>
              <strong>{t.title}</strong>{t.unread && <span className="sr-only"> (unread)</span>}
              <div className="xsmall muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.statusNote ?? t.prompt}</div>
            </span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="xsmall muted">{clockTime(t.createdAt)}</span>
              <TaskStatusBadge status={t.status} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
