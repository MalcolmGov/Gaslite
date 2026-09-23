import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkRegular,
  ChevronDownRegular,
  DismissRegular,
  PanelRightRegular,
  PauseRegular,
  PlayRegular,
  SparkleRegular,
  StopRegular,
  WarningRegular,
  DocumentTextRegular,
  CircleFilled,
} from '@fluentui/react-icons';
import { useShallow } from 'zustand/react/shallow';
import type { Task, TranscriptItem } from '../../engine/model';
import { scenarios } from '../../engine/cowork/scenarios';
import { useLab } from '../../state/store';
import {
  acceptPlan,
  answerTaskQuestion,
  cancelTask,
  pauseTask,
  resumeTask,
  sendTaskMessage,
  startTask,
  updateReadyTask,
} from '../../state/coworkActions';
import { openCitation, openPicker } from '../../state/uiActions';
import { navigate } from '../../state/router';
import { BRIEF_SOURCE_ID, getDoc } from '../../scenario/registry';
import { fmtDate } from '../../lib/util';
import { Banner, Composer, FileIcon, Markdown, Thinking, useAutoScroll } from '../common';
import { EmailApproval, MeetingApproval } from './Approvals';
import { ArtifactPanel } from './ArtifactPanel';
import { SidePanel } from './SidePanel';
import { TaskStatusBadge } from './CoworkHome';
import { toPlainText } from '../../lib/markdown';

export function TaskPage({ taskId }: { taskId: string }) {
  const task = useLab((s) => s.tasks[taskId]);
  const [panel, setPanel] = useState(() => typeof window === 'undefined' || window.innerWidth > 1180);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [msg, setMsg] = useState('');
  const scroller = useAutoScroll(task ? task.transcript.length + (task.thinking ? 1 : 0) : 0);
  // On narrower screens the side panel overlays the conversation, so close it when the window shrinks.
  useEffect(() => {
    const onResize = () => { if (window.innerWidth <= 1180) setPanel(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!task) {
    return (
      <div className="conv-wrap">
        <Banner tone="warning" title="Task not found.">It may have been removed by a reset.</Banner>
        <p><Button onClick={() => navigate({ name: 'cowork' })}>Go to Cowork</Button></p>
      </div>
    );
  }

  const running = task.status === 'working' || task.status === 'needs_input' || task.status === 'needs_approval' || task.status === 'failed';
  const openBrief = () => openCitation(BRIEF_SOURCE_ID, { taskId: task.id, silent: true });
  const lastAssistant = [...task.transcript].reverse().find((i) => i.kind === 'assistant');

  return (
    <div className="task-layout">
      <div className="task-main">
        <div className="task-head">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
            <h1>{task.title}</h1>
            <TaskStatusBadge status={task.status} />
            <span className="xsmall muted" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }} aria-label="Connection status: connected">
              <CircleFilled fontSize={8} color="var(--success)" aria-hidden /> Connected
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {task.status === 'paused' ? (
              <Button icon={<PlayRegular />} onClick={() => resumeTask(task.id)}>Resume</Button>
            ) : (
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button icon={<PauseRegular />} disabled={!running || task.pauseRequested} iconPosition="before">
                    {task.pauseRequested ? 'Pausing…' : 'Pause'} <ChevronDownRegular fontSize={12} />
                  </Button>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem onClick={() => pauseTask(task.id, 'soft')}>Pause after this step</MenuItem>
                    <MenuItem onClick={() => pauseTask(task.id, 'hard')}>Pause now</MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            )}
            <Button icon={<StopRegular />} disabled={task.status === 'completed' || task.status === 'cancelled' || task.status === 'ready'} onClick={() => setConfirmCancel(true)}>Cancel task</Button>
            <Tooltip content={panel ? 'Hide side panel' : 'Show side panel'} relationship="label">
              <Button appearance="subtle" icon={<PanelRightRegular />} aria-pressed={panel} onClick={() => setPanel((p) => !p)} />
            </Tooltip>
          </div>
        </div>
        {task.statusNote && task.status !== 'working' && (
          <div style={{ padding: '8px 20px 0' }}>
            <Banner tone={task.status === 'failed' ? 'error' : task.status === 'cancelled' ? 'warning' : 'info'}>{task.statusNote}</Banner>
          </div>
        )}
        <div className="task-scroll" ref={scroller}>
          <div className="conv-wrap">
            {task.status === 'ready' && <ReadyComposer task={task} onOpenBrief={openBrief} />}
            {task.transcript.map((i) => (
              <TranscriptView key={i.id} i={i} task={task} stream={i === lastAssistant} onOpenArtifact={setArtifactId} />
            ))}
            {task.thinking && <div className="msg"><Thinking /></div>}
            {task.status === 'working' && !task.thinking && !task.transcript.some((i) => i.kind === 'tool' && i.state === 'running') && task.transcript.length > 0 && (
              <div className="msg"><Thinking label="Working" /></div>
            )}
          </div>
        </div>
        {task.status !== 'ready' && (
          <div className="task-foot">
            <Composer
              label="Message Cowork"
              value={msg}
              onChange={setMsg}
              onSend={() => { sendTaskMessage(task.id, msg); setMsg(''); }}
              placeholder={task.status === 'working' ? 'Send a message — it will be queued' : 'Message Cowork'}
            />
          </div>
        )}
      </div>
      <SidePanel task={task} open={panel} onOpenArtifact={setArtifactId} onOpenBrief={openBrief} />
      {artifactId && <ArtifactPanel artifactId={artifactId} onClose={() => setArtifactId(null)} />}

      {confirmCancel && (
        <Dialog open onOpenChange={(_, d) => { if (!d.open) setConfirmCancel(false); }}>
          <DialogSurface style={{ maxWidth: 480 }}>
            <DialogBody>
              <DialogTitle>Cancel this task?</DialogTitle>
              <DialogContent>
                Cowork stops all pending work. Emails or meetings waiting for approval won't be sent or created. Anything already sent stays sent.
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmCancel(false)}>Keep working</Button>
                <Button appearance="primary" onClick={() => { setConfirmCancel(false); cancelTask(task.id); }}>Cancel task</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
}

/** A task in the Ready state: the learner reviews the objective and context, then sends. */
function ReadyComposer({ task, onOpenBrief }: { task: Task; onOpenBrief: () => void }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>Review your request</h2>
      <p className="small muted" style={{ marginTop: 0 }}>Check the objective and the context Cowork will use, then send.</p>
      <Composer
        tour="cowork-composer"
        label="Task request"
        value={task.prompt}
        onChange={(v) => updateReadyTask(task.id, { prompt: v })}
        onSend={() => startTask(task.id, task.prompt, task.context.files)}
        placeholder="Describe what you need done"
        onAdd={() => openPicker('cowork', task.id)}
        addLabel="Attach cloud files"
      >
        <div className="chips" style={{ margin: '0 0 8px' }} aria-label="Attached context">
          {task.context.brief && (
            <button className="file-chip" style={{ cursor: 'pointer' }} onClick={onOpenBrief}>
              <FileIcon kind="md" size="sm" />
              <span style={{ textAlign: 'left' }}>Programme briefing (reviewed)<br /><span className="meta">From {task.context.brief.agentName} · {fmtDate('2026-09-22')}</span></span>
            </button>
          )}
          {task.context.files.map((id) => {
            const d = getDoc(id)!;
            return (
              <span key={id} className="file-chip">
                <FileIcon kind={d.kind} size="sm" />
                <span>{d.fileName}<br /><span className="meta">{d.version} · Modified {fmtDate(d.modified)} · {d.location.split(' › ').slice(-1)[0]}</span></span>
                <button className="icon-btn" aria-label={`Remove ${d.fileName}`} onClick={() => updateReadyTask(task.id, { files: task.context.files.filter((x) => x !== id) })}><DismissRegular /></button>
              </span>
            );
          })}
        </div>
      </Composer>
      {task.context.brief && (
        <details style={{ marginTop: 10 }}>
          <summary className="small" style={{ cursor: 'pointer' }}>Preview the briefing text Cowork will receive</summary>
          <div className="card small" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{toPlainText(task.context.brief.text)}</div>
        </details>
      )}
    </div>
  );
}

function TranscriptView({ i, task, stream, onOpenArtifact }: { i: TranscriptItem; task: Task; stream: boolean; onOpenArtifact: (id: string) => void }) {
  const artifacts = useLab(useShallow((s) => (i.kind === 'artifacts' ? i.artifactIds.map((id) => s.artifacts[id]) : [])));
  const action = useLab((s) => (i.kind === 'action' ? s.actions[i.actionId] : undefined));
  const onCite = (id: string) => openCitation(id, { taskId: task.id, scenario: task.scenarioId });

  switch (i.kind) {
    case 'user':
      return <div className="msg user"><div className="bubble-user">{i.text}</div></div>;
    case 'assistant':
      return (
        <div className="msg assistant">
          <div className="msg-meta"><SparkleRegular fontSize={16} color="var(--copilot-a)" /> Cowork</div>
          <div className="body"><Markdown text={i.text} stream={stream} onCite={onCite} /></div>
        </div>
      );
    case 'skill':
      return <div className="step-line skill"><DocumentTextRegular aria-hidden /> {i.text}</div>;
    case 'tool':
      return (
        <div className="step-line">
          {i.state === 'running' ? <Spinner size="extra-tiny" /> : i.state === 'interrupted' ? <WarningRegular color="var(--warning)" aria-hidden /> : <CheckmarkRegular color="var(--success)" aria-hidden />}
          <span>{i.text}{i.state === 'interrupted' ? ' — interrupted' : ''}</span>
          {i.state === 'running' && <span className="sr-only">in progress</span>}
        </div>
      );
    case 'notice':
      return <div style={{ margin: '10px 0' }}><Banner tone={i.tone === 'error' ? 'error' : i.tone}><Markdown text={i.text} /></Banner></div>;
    case 'plan':
      return <PlanCard i={i} task={task} />;
    case 'question':
      return <QuestionCard task={task} questionId={i.questionId} answered={i.answered} />;
    case 'artifacts':
      return (
        <div className="chips" style={{ margin: '10px 0' }}>
          {artifacts.filter(Boolean).map((a) => (
            <button key={a.id} className="file-chip" style={{ cursor: 'pointer' }} onClick={() => onOpenArtifact(a.id)} data-tour={a.key === 'update' ? 'output-update' : undefined}>
              <FileIcon kind={a.format} size="sm" />
              <span style={{ textAlign: 'left' }}>{a.title}<br /><span className="meta">{a.baseName}.{a.format} · v{a.versions[a.current].v}{a.stale ? ' · needs regenerating' : ''}</span></span>
            </button>
          ))}
        </div>
      );
    case 'action':
      if (!action) return null;
      return action.kind === 'email' ? <EmailApproval action={action} onOpenArtifact={onOpenArtifact} /> : <MeetingApproval action={action} />;
  }
}

function PlanCard({ i, task }: { i: Extract<TranscriptItem, { kind: 'plan' }>; task: Task }) {
  return (
    <div className="tcard" style={{ margin: '12px 0' }} data-tour="plan-card">
      <div className="row-between" style={{ marginBottom: 6, flexWrap: 'wrap' }}>
        <strong className="small">Proposed plan</strong>
        <span className="tpill">Training aid — not a Cowork screen</span>
      </div>
      <ol className="small" style={{ margin: '0 0 8px', paddingLeft: 20 }}>
        {i.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <p className="xsmall" style={{ margin: '0 0 8px' }}>
        Continuing with a plan is <strong>not</strong> the same as approving an email or meeting. Cowork will still ask before each outbound action.
      </p>
      {i.state === 'pending' ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="tbutton" onClick={() => acceptPlan(task.id)}>Looks good — continue</button>
          <button className="tbutton secondary" onClick={() => pauseTask(task.id, 'hard')}>Pause to rethink</button>
        </div>
      ) : (
        <span className="xsmall muted"><CheckmarkRegular aria-hidden /> Plan accepted</span>
      )}
    </div>
  );
}

/** Clarifying question: arrow keys to move, Space to choose, then Submit — or Skip. */
function QuestionCard({ task, questionId, answered }: { task: Task; questionId: string; answered?: string | null }) {
  const q = scenarios[task.scenarioId].question(questionId, task);
  const [choice, setChoice] = useState<string | null>(null);
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const done = answered !== undefined;
  const move = (d: number) => {
    const n = (focus + d + q.options.length) % q.options.length;
    setFocus(n);
    refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setChoice(q.options[idx].value); }
  };

  if (done) {
    const label = answered === null ? 'Skipped' : q.options.find((o) => o.value === answered)?.label ?? answered;
    return (
      <div className="question" style={{ boxShadow: 'none' }}>
        <div className="small muted">{q.prompt}</div>
        <div className="small" style={{ marginTop: 4 }}><CheckmarkRegular aria-hidden /> {label}</div>
      </div>
    );
  }
  return (
    <div className="question" data-tour="question-card" role="group" aria-labelledby={`q-${questionId}`}>
      <div id={`q-${questionId}`} style={{ fontWeight: 600, marginBottom: 4 }}>{q.prompt}</div>
      {q.detail && <div className="small muted" style={{ marginBottom: 6 }}>{q.detail}</div>}
      <div role="radiogroup" aria-labelledby={`q-${questionId}`}>
        {q.options.map((o, idx) => (
          <div
            key={o.value}
            ref={(el) => { refs.current[idx] = el; }}
            role="radio"
            aria-checked={choice === o.value}
            tabIndex={idx === focus ? 0 : -1}
            className="q-option"
            onClick={() => { setChoice(o.value); setFocus(idx); }}
            onKeyDown={(e) => onKey(e, idx)}
          >
            <span className="q-radio" aria-hidden />
            <span>
              <span>{o.label}</span>
              {o.detail && <span className="xsmall muted" style={{ display: 'block' }}>{o.detail}</span>}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <Button onClick={() => answerTaskQuestion(task.id, questionId, null)}>Skip</Button>
        <Button appearance="primary" disabled={!choice} onClick={() => answerTaskQuestion(task.id, questionId, choice, q.options.find((o) => o.value === choice)?.label)}>Submit</Button>
      </div>
    </div>
  );
}
