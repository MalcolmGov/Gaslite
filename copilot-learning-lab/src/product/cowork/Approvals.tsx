import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button, Checkbox, Dropdown, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Option, Spinner, Tooltip } from '@fluentui/react-components';
import { CalendarLtrRegular, ChevronDownRegular, DismissRegular, MailRegular, PeopleTeamRegular, WarningRegular } from '@fluentui/react-icons';
import type { EmailPayload, MeetingPayload, OutboundAction, Recipient } from '../../engine/model';
import { useLab } from '../../state/store';
import { approveAction, cancelAction, editAction, markActionViewed, retryAction, undoQueued } from '../../state/coworkActions';
import { navigate } from '../../state/router';
import { expandRecipients, firstFreeSlot, meetingConflicts, searchDirectory } from '../../engine/cowork/common';
import { groupById, personById } from '../../scenario/people';
import { settings } from '../../config/settings';
import { clockTime, fmtDateLong, fmtDateShort, timeOf } from '../../lib/util';
import { Banner, FileIcon, StatusBadge } from '../common';
import { HelpTip } from '../../training/HelpTip';

/** Marks an approval as reviewed once it has been on screen for a couple of seconds. */
function useViewed(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { markActionViewed(id); return; }
    let t: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) t = setTimeout(() => markActionViewed(id), 1800);
      else if (t) clearTimeout(t);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); if (t) clearTimeout(t); };
  }, [id]);
  return ref;
}

function useCountdown(until?: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const h = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(h);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

function StateBadge({ a }: { a: OutboundAction }) {
  switch (a.state) {
    case 'needs_approval':
      return <StatusBadge tone="warning">Needs approval</StatusBadge>;
    case 'queued':
      return <StatusBadge tone="brand">Approved — waiting to run</StatusBadge>;
    case 'executing':
      return <StatusBadge tone="brand" icon={<Spinner size="extra-tiny" />}>{a.kind === 'email' ? 'Sending' : 'Creating'}</StatusBadge>;
    case 'done':
      return <StatusBadge tone="success">{a.kind === 'email' ? 'Sent (simulated)' : 'Created (simulated)'}</StatusBadge>;
    case 'failed':
      return <StatusBadge tone="danger">Failed</StatusBadge>;
    case 'cancelled':
      return <StatusBadge tone="neutral">Cancelled — not {a.kind === 'email' ? 'sent' : 'created'}</StatusBadge>;
  }
}

function RecipientChips({ rs, onRemove }: { rs: Recipient[]; onRemove?: (id: string) => void }) {
  return (
    <>
      {rs.map((r) => (
        <span key={r.id} className="recipient" title={r.email}>
          {r.kind === 'group' && <PeopleTeamRegular aria-hidden />}
          {r.name}
          {r.kind === 'group' && <span className="xsmall muted">({groupById(r.id)?.memberCount})</span>}
          {onRemove && <button className="icon-btn" style={{ width: 20, height: 20 }} aria-label={`Remove ${r.name}`} onClick={() => onRemove(r.id)}><DismissRegular fontSize={12} /></button>}
        </span>
      ))}
    </>
  );
}

function RecipientAdder({ onAdd, exclude }: { onAdd: (r: Recipient) => void; exclude: string[] }) {
  const [q, setQ] = useState('');
  const results = q.trim() ? searchDirectory(q).filter((r) => !exclude.includes(r.id)).slice(0, 5) : [];
  return (
    <div style={{ position: 'relative', marginTop: 4 }}>
      <Input size="small" placeholder="Add a name or group" aria-label="Add recipient" value={q} onChange={(_, d) => setQ(d.value)} style={{ width: '100%' }} />
      {results.length > 0 && (
        <div className="card" role="listbox" aria-label="Directory results" style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: 30, padding: 4 }}>
          {results.map((r) => (
            <button key={r.id} role="option" aria-selected={false} className="nav-item" onClick={() => { onAdd(r); setQ(''); }}>
              <span className="grow">{r.name} <span className="xsmall muted">{r.email}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared footer: explicit, per-action approval. Session-wide "always allow" is intentionally disabled. */
function ApprovalFooter({ a, verb, onEdit }: { a: OutboundAction; verb: 'Send' | 'Create'; onEdit: () => void }) {
  const seconds = useCountdown(a.state === 'queued' ? a.executeAt : undefined);
  if (a.state === 'needs_approval') {
    return (
      <div className="a-foot">
        <span className="xsmall muted">Nothing happens until you approve this {a.kind === 'email' ? 'email' : 'meeting'}.</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => { markActionViewed(a.id); onEdit(); }}>Edit</Button>
          <Button onClick={() => cancelAction(a.id)}>Cancel</Button>
          <div style={{ display: 'inline-flex' }}>
            <Button appearance="primary" onClick={() => approveAction(a.id)} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>{verb}</Button>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button appearance="primary" icon={<ChevronDownRegular />} aria-label="More approval options" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minWidth: 32, borderLeft: '1px solid rgba(255,255,255,.4)' }} />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => approveAction(a.id)}>{verb} (this time only)</MenuItem>
                  <Tooltip content="Turned off in this training: approve each outbound action individually." relationship="description">
                    <MenuItem disabled>Always allow for this session</MenuItem>
                  </Tooltip>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
      </div>
    );
  }
  if (a.state === 'queued') {
    return (
      <div className="a-foot" role="status">
        <span className="small">{verb === 'Send' ? 'Sending' : 'Creating'} in {seconds}s…</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={onEdit}>Edit</Button>
          <Button appearance="primary" onClick={() => undoQueued(a.id)}>Undo</Button>
        </div>
      </div>
    );
  }
  if (a.state === 'failed') {
    return (
      <div className="a-foot">
        <span className="small" style={{ color: 'var(--danger)' }}>Nothing was {a.kind === 'email' ? 'sent' : 'created'}.</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={onEdit}>Edit</Button>
          <Button onClick={() => cancelAction(a.id)}>Cancel</Button>
          <Button appearance="primary" onClick={() => retryAction(a.id)}>Retry</Button>
        </div>
      </div>
    );
  }
  if (a.state === 'done') {
    return (
      <div className="a-foot">
        <span className="small">{a.kind === 'email' ? 'Sent' : 'Created'} at {clockTime(a.history[a.history.length - 1].at)} {settings.scenario.timeZoneLabel} — simulated, nothing left this device.</span>
        <Button size="small" onClick={() => navigate({ name: 'mail', tab: a.kind === 'email' ? 'sent' : 'calendar' })}>{a.kind === 'email' ? 'View in Sent items' : 'View in calendar'}</Button>
      </div>
    );
  }
  if (a.state === 'executing') return <div className="a-foot"><span className="small">Working…</span></div>;
  return <div className="a-foot"><span className="small muted">Cancelled. This {a.kind === 'email' ? 'email was not sent' : 'meeting was not created'}.</span></div>;
}

function History({ a }: { a: OutboundAction }) {
  return (
    <details className="xsmall" style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer' }}>Activity ({a.history.length})</summary>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {a.history.map((h, i) => <li key={i}>{clockTime(h.at)} — {h.text}</li>)}
      </ul>
    </details>
  );
}

// ───────────── Email ─────────────

export function EmailApproval({ action, onOpenArtifact }: { action: OutboundAction; onOpenArtifact: (id: string) => void }) {
  const artifacts = useLab((s) => s.artifacts);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EmailPayload>(action.email!);
  const [params, setParams] = useState(false);
  const e = action.email!;
  useEffect(() => { if (!editing) setDraft(action.email!); }, [action.email, editing]);
  const viewRef = useViewed(action.id);
  const allArtifacts = useLab(useShallow((s) => s.tasks[action.taskId].artifactIds.map((id) => s.artifacts[id]).filter((x) => ['update', 'table', 'overdue', 'actions', 'status', 'triage'].includes(x.key))));

  const people = expandRecipients(e.to).length + expandRecipients(e.cc).length;

  return (
    <div className="approval" data-tour="approval-email" role="group" aria-label="Email approval" ref={viewRef}>
      <div className="a-head">
        <strong style={{ display: 'flex', gap: 8, alignItems: 'center' }}><MailRegular aria-hidden /> Send email <HelpTip term="approval" /></strong>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {action.changedAfterApproval && action.state === 'needs_approval' && <StatusBadge tone="warning">Changed after approval — approve again</StatusBadge>}
          <StateBadge a={action} />
        </span>
      </div>
      <div className="a-body">
        {action.state === 'failed' && action.error && <div style={{ marginBottom: 10 }}><Banner tone="error">{action.error}</Banner></div>}
        {!editing ? (
          <>
            <dl className="kv">
              <dt>To</dt><dd><RecipientChips rs={e.to} /> <span className="xsmall muted">{people} people</span></dd>
              {e.cc.length > 0 && (<><dt>Cc</dt><dd><RecipientChips rs={e.cc} /></dd></>)}
              <dt>Subject</dt><dd><strong>{e.subject}</strong></dd>
              <dt>Attachments</dt>
              <dd>
                {e.attachments.length ? e.attachments.map((id) => artifacts[id] && (
                  <button key={id} className="file-chip" style={{ cursor: 'pointer', marginRight: 6, marginBottom: 4 }} onClick={() => onOpenArtifact(id)}>
                    <FileIcon kind={artifacts[id].format} size="sm" /> {artifacts[id].title} <span className="meta">v{artifacts[id].versions[artifacts[id].current].v}</span>
                  </button>
                )) : <span className="muted">None</span>}
              </dd>
            </dl>
            <div className="email-body" aria-label="Message">{e.body}</div>
            <button className="chip" style={{ marginTop: 8, padding: '3px 10px' }} aria-expanded={params} onClick={() => setParams((p) => !p)}>{params ? 'Hide parameters' : 'Show parameters'}</button>
            {params && (
              <pre className="xsmall" style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, overflow: 'auto' }}>
                {JSON.stringify({ action: 'email.send', to: e.to.map((r) => r.email), cc: e.cc.map((r) => r.email), subject: e.subject, attachments: e.attachments.map((id) => artifacts[id]?.baseName), simulated: true }, null, 2)}
              </pre>
            )}
            <History a={action} />
          </>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            <div>
              <div className="field-label">To</div>
              <RecipientChips rs={draft.to} onRemove={(id) => setDraft({ ...draft, to: draft.to.filter((r) => r.id !== id) })} />
              <RecipientAdder exclude={[...draft.to, ...draft.cc].map((r) => r.id)} onAdd={(r) => setDraft({ ...draft, to: [...draft.to, r] })} />
            </div>
            <div>
              <div className="field-label">Cc</div>
              <RecipientChips rs={draft.cc} onRemove={(id) => setDraft({ ...draft, cc: draft.cc.filter((r) => r.id !== id) })} />
              <RecipientAdder exclude={[...draft.to, ...draft.cc].map((r) => r.id)} onAdd={(r) => setDraft({ ...draft, cc: [...draft.cc, r] })} />
            </div>
            <div>
              <label className="field-label" htmlFor={`sub-${action.id}`}>Subject</label>
              <input id={`sub-${action.id}`} className="input" value={draft.subject} onChange={(ev) => setDraft({ ...draft, subject: ev.target.value })} />
            </div>
            <div>
              <div className="field-label">Attachments</div>
              {allArtifacts.map((a) => (
                <Checkbox key={a.id} label={a.title} checked={draft.attachments.includes(a.id)} onChange={(_, d) => setDraft({ ...draft, attachments: d.checked ? [...draft.attachments, a.id] : draft.attachments.filter((x) => x !== a.id) })} />
              ))}
            </div>
            <div>
              <label className="field-label" htmlFor={`body-${action.id}`}>Message</label>
              <textarea id={`body-${action.id}`} className="textarea" rows={12} value={draft.body} onChange={(ev) => setDraft({ ...draft, body: ev.target.value })} />
            </div>
            {!draft.to.length && <Banner tone="warning">Add at least one recipient.</Banner>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => { setDraft(action.email!); setEditing(false); }}>Discard changes</Button>
              <Button appearance="primary" disabled={!draft.to.length || !draft.subject.trim()} onClick={() => { editAction(action.id, { email: draft }); setEditing(false); }}>Save changes</Button>
            </div>
          </div>
        )}
      </div>
      {!editing && <ApprovalFooter a={action} verb="Send" onEdit={() => setEditing(true)} />}
    </div>
  );
}

// ───────────── Meeting ─────────────

const DAYS = ['2026-09-23', '2026-09-24', '2026-09-25', '2026-09-28', '2026-09-29'];
const SLOTS = Array.from({ length: 16 }, (_, i) => { const m = 9 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; });
const plus30 = (t: string) => { const [h, m] = t.split(':').map(Number); const x = h * 60 + m + 30; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

export function MeetingApproval({ action }: { action: OutboundAction }) {
  const [editing, setEditing] = useState(false);
  const m = action.meeting!;
  const [draft, setDraft] = useState<MeetingPayload>(m);
  useEffect(() => { if (!editing) setDraft(action.meeting!); }, [action.meeting, editing]);
  const viewRef = useViewed(action.id);
  const conflicts = useMemo(() => meetingConflicts(m), [m]);
  const free = useMemo(() => (conflicts.length ? firstFreeSlot(m, [m.date, ...DAYS.filter((d) => d > m.date)]) : null), [conflicts, m]);
  const draftConflicts = useMemo(() => meetingConflicts(draft), [draft]);
  const tz = `${settings.scenario.timeZone} (${settings.scenario.timeZoneLabel}, UTC${settings.scenario.utcOffset})`;
  const final = action.state === 'done' || action.state === 'cancelled';

  return (
    <div className="approval" data-tour="approval-meeting" role="group" aria-label="Meeting approval" ref={viewRef}>
      <div className="a-head">
        <strong style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CalendarLtrRegular aria-hidden /> Create meeting</strong>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {action.changedAfterApproval && action.state === 'needs_approval' && <StatusBadge tone="warning">Changed after approval — approve again</StatusBadge>}
          <StateBadge a={action} />
        </span>
      </div>
      <div className="a-body">
        {!editing ? (
          <>
            <dl className="kv">
              <dt>Title</dt><dd><strong>{m.title}</strong></dd>
              <dt>Attendees</dt><dd><RecipientChips rs={m.attendees} /></dd>
              <dt>Date</dt><dd>{fmtDateLong(m.date)}</dd>
              <dt>Time</dt><dd>{m.start}–{m.end} ({settings.scenario.timeZoneLabel})</dd>
              <dt>Time zone</dt><dd>{tz}</dd>
              <dt>Location</dt><dd>Microsoft Teams meeting (simulated link)</dd>
              <dt>Agenda</dt><dd><div className="email-body" style={{ marginTop: 0 }}>{m.agenda}</div></dd>
              <dt>Conflicts</dt>
              <dd>
                {conflicts.length ? (
                  <div className="stack" style={{ gap: 6 }}>
                    {conflicts.map((c) => (
                      <div key={c.personId + c.start} className="small" style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--warning)' }}>
                        <WarningRegular aria-hidden /> <span><strong>{c.personName}</strong> is busy: {c.title}, {timeOf(c.start)}–{timeOf(c.end)}</span>
                      </div>
                    ))}
                    {free && !final && (
                      <div>
                        <Button size="small" onClick={() => editAction(action.id, { meeting: { ...m, date: free.date, start: free.start, end: free.end } })}>
                          Use first free time: {fmtDateShort(free.date)}, {free.start}–{free.end}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="small" style={{ color: 'var(--success)' }}>No conflicts in sample calendars.</span>
                )}
              </dd>
            </dl>
            <History a={action} />
          </>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            <div>
              <div className="field-label">Attendees</div>
              <RecipientChips rs={draft.attendees} onRemove={(id) => setDraft({ ...draft, attendees: draft.attendees.filter((r) => r.id !== id) })} />
              <RecipientAdder exclude={draft.attendees.map((r) => r.id)} onAdd={(r) => setDraft({ ...draft, attendees: [...draft.attendees, r] })} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div className="field-label" id={`d-${action.id}`}>Date</div>
                <Dropdown aria-labelledby={`d-${action.id}`} value={fmtDateShort(draft.date)} selectedOptions={[draft.date]} onOptionSelect={(_, d) => setDraft({ ...draft, date: d.optionValue! })}>
                  {DAYS.map((d) => <Option key={d} value={d}>{fmtDateShort(d)}</Option>)}
                </Dropdown>
              </div>
              <div>
                <div className="field-label" id={`t-${action.id}`}>Start ({settings.scenario.timeZoneLabel})</div>
                <Dropdown aria-labelledby={`t-${action.id}`} value={draft.start} selectedOptions={[draft.start]} onOptionSelect={(_, d) => setDraft({ ...draft, start: d.optionValue!, end: plus30(d.optionValue!) })}>
                  {SLOTS.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Dropdown>
              </div>
              <div>
                <div className="field-label">End</div>
                <div style={{ padding: '6px 0' }}>{draft.end} (30 minutes)</div>
              </div>
            </div>
            {draftConflicts.length ? (
              <Banner tone="warning">{draftConflicts.map((c) => `${c.personName}: ${c.title} ${timeOf(c.start)}–${timeOf(c.end)}`).join('; ')}</Banner>
            ) : (
              <Banner tone="success">No conflicts at this time.</Banner>
            )}
            <div>
              <label className="field-label" htmlFor={`ag-${action.id}`}>Agenda</label>
              <textarea id={`ag-${action.id}`} className="textarea" rows={5} value={draft.agenda} onChange={(ev) => setDraft({ ...draft, agenda: ev.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => { setDraft(action.meeting!); setEditing(false); }}>Discard changes</Button>
              <Button appearance="primary" disabled={!draft.attendees.length} onClick={() => { editAction(action.id, { meeting: draft }); setEditing(false); }}>Save changes</Button>
            </div>
          </div>
        )}
      </div>
      {!editing && <ApprovalFooter a={action} verb="Create" onEdit={() => setEditing(true)} />}
    </div>
  );
}

export const personName = (id: string) => personById(id)?.name ?? id;
