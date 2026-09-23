import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Input,
  Option,
  Spinner,
  Switch,
  Tooltip,
  Avatar,
} from '@fluentui/react-components';
import { CheckmarkCircleFilled, CopyRegular, DismissRegular, LockClosedRegular, PeopleTeamRegular, SearchRegular } from '@fluentui/react-icons';
import type { Agent, ShareEntry } from '../../engine/model';
import { useLab } from '../../state/store';
import { openAgent, shareAgent } from '../../state/agentActions';
import { agentLink } from '../../state/router';
import { searchDirectory } from '../../engine/cowork/common';
import { groupById, personById } from '../../scenario/people';
import { getDoc } from '../../scenario/registry';
import { settings } from '../../config/settings';
import { Banner, FileIcon, StatusBadge, afterDialogClose } from '../common';

const principalName = (e: ShareEntry) => (e.kind === 'group' ? groupById(e.principalId)?.name : personById(e.principalId)?.name) ?? e.principalId;

/** Can the chosen audience open a source themselves? */
function audienceAccess(docId: string, entries: ShareEntry[]): { ok: boolean; note: string } {
  const doc = getDoc(docId);
  if (!doc) return { ok: false, note: '' };
  if (doc.readableBy === 'all') return { ok: true, note: 'Everyone in the organisation can open this file.' };
  const blocked = entries.filter((e) => {
    if (e.kind === 'group') return !(doc.readableBy as string[]).includes(e.principalId);
    const inGroup = (doc.readableBy as string[]).some((g) => groupById(g)?.memberIds.includes(e.principalId));
    return !inGroup && !(doc.readableBy as string[]).includes(e.principalId);
  });
  if (!blocked.length) return { ok: true, note: 'Everyone you selected can open this file.' };
  return { ok: false, note: `${blocked.map(principalName).join(', ')} can't open this file, so they won't get answers based on it.` };
}

export function CreatedDialog({ agent, onClose, onShare }: { agent: Agent; onClose: () => void; onShare: () => void }) {
  return (
    <Dialog open onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: 520 }}>
        <DialogBody>
          <DialogTitle>Your agent is ready</DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '4px 0 12px' }}>
              <CheckmarkCircleFilled color="var(--success)" fontSize={24} aria-hidden />
              <strong>{agent.name}</strong>
            </div>
            <p style={{ margin: '0 0 8px' }}>
              <LockClosedRegular aria-hidden /> This agent is <strong>private and only available to you</strong>. Share it to let colleagues chat with it.
            </p>
            <p className="small muted" style={{ margin: 0 }}>It now appears under Agents in the navigation pane.</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { onClose(); afterDialogClose(() => openAgent(agent.id)); }} data-tour="open-agent">Go to agent</Button>
            <Button appearance="primary" onClick={onShare}>Share</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

export function ShareDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const sharing = useLab((s) => !!s.ui.busy[`share:${agent.id}`]);
  const [entries, setEntries] = useState<ShareEntry[]>(agent.sharing.entries);
  const [q, setQ] = useState('');
  const [notify, setNotify] = useState(true);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const results = useMemo(() => (q.trim() ? searchDirectory(q).filter((r) => !entries.some((e) => e.principalId === r.id)).slice(0, 6) : []), [q, entries]);
  const sources = agent.knowledge.filter((k) => k.status === 'ready');
  const link = agentLink(agent.id);

  const add = (id: string, kind: 'person' | 'group') => { setEntries((e) => [...e, { principalId: id, kind, role: 'chat' }]); setQ(''); };
  const share = () => {
    shareAgent(agent.id, entries, notify);
    setDone(true);
  };

  const showSuccess = done && !sharing && !!agent.sharing.sharedAt;
  return (
    <Dialog open onOpenChange={(_, d) => { if (!d.open && !sharing) onClose(); }}>
      <DialogSurface style={{ maxWidth: showSuccess ? 560 : 680, width: 'calc(100vw - 32px)' }}>
        {showSuccess ? (
        <DialogBody>
            <DialogTitle>Agent shared</DialogTitle>
            <DialogContent>
              <Banner tone="success">
                <strong>{agent.name}</strong> is shared with {agent.sharing.entries.map(principalName).join(', ') || 'no one yet'}.
              </Banner>
              <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>Audience</h3>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                <li>{settings.learner.displayName} — Owner</li>
                {agent.sharing.entries.map((e) => (
                  <li key={e.principalId}>{principalName(e)} — {e.role === 'edit' ? 'Can edit' : 'Can chat'}</li>
                ))}
              </ul>
              <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>Chat link</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={link} readOnly aria-label="Agent chat link" style={{ flex: 1 }} />
                <Button icon={<CopyRegular />} onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); setCopied(true); }}>{copied ? 'Copied' : 'Copy chat link'}</Button>
              </div>
              <p className="xsmall muted">Internal prototype link — it opens this agent in the Learning Lab on this device only.</p>
              {notify && <p className="xsmall muted">Notification: in a real tenant, people would be emailed. No email is sent in this simulation.</p>}
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Close</Button>
              <Button appearance="primary" data-tour="open-agent" onClick={() => { onClose(); afterDialogClose(() => openAgent(agent.id)); }}>Open agent</Button>
            </DialogActions>
          </DialogBody>
        ) : (
        <DialogBody>
          <DialogTitle action={<Button appearance="subtle" aria-label="Close" icon={<DismissRegular />} onClick={onClose} disabled={sharing} />}>
            Share "{agent.name}"
          </DialogTitle>
          <DialogContent>
            <div className="stack" style={{ gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Input
                  contentBefore={<SearchRegular />}
                  placeholder="Add a name, group, or email"
                  aria-label="Add a name, group, or email"
                  value={q}
                  onChange={(_, d) => setQ(d.value)}
                  style={{ width: '100%' }}
                />
                {results.length > 0 && (
                  <div role="listbox" aria-label="Directory results" className="card" style={{ position: 'absolute', left: 0, right: 0, top: 36, zIndex: 5, padding: 4, boxShadow: 'var(--shadow-16)' }}>
                    {results.map((r) => (
                      <button key={r.id} role="option" aria-selected={false} className="nav-item" onClick={() => add(r.id, r.kind)}>
                        {r.kind === 'group' ? <PeopleTeamRegular fontSize={20} /> : <Avatar name={r.name} size={20} />}
                        <span className="grow">{r.name} <span className="muted xsmall">{r.kind === 'group' ? `· group · ${groupById(r.id)?.memberCount} members` : `· ${personById(r.id)?.title}`}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="small" style={{ fontWeight: 600, marginBottom: 4 }}>People with access</div>
                <div className="ks-row" style={{ borderTop: 0 }}>
                  <Avatar name={settings.learner.displayName} size={24} />
                  <div className="info"><div className="name">{settings.learner.displayName} (you)</div></div>
                  <StatusBadge tone="neutral">Owner</StatusBadge>
                </div>
                {entries.map((e) => (
                  <div className="ks-row" key={e.principalId}>
                    {e.kind === 'group' ? <PeopleTeamRegular fontSize={24} /> : <Avatar name={principalName(e)} size={24} />}
                    <div className="info">
                      <div className="name">{principalName(e)}</div>
                      <div className="meta">{e.kind === 'group' ? `Group · ${groupById(e.principalId)?.memberCount} members` : personById(e.principalId)?.title}</div>
                    </div>
                    <Dropdown
                      aria-label={`Access for ${principalName(e)}`}
                      value={e.role === 'edit' ? 'Can edit' : 'Can chat'}
                      selectedOptions={[e.role]}
                      style={{ minWidth: 130 }}
                      onOptionSelect={(_, d) => {
                        if (d.optionValue === 'remove') setEntries((x) => x.filter((y) => y.principalId !== e.principalId));
                        else setEntries((x) => x.map((y) => (y.principalId === e.principalId ? { ...y, role: d.optionValue as 'chat' | 'edit' } : y)));
                      }}
                    >
                      <Option value="chat">Can chat</Option>
                      <Option value="edit" disabled={e.kind === 'group'} text="Can edit">{e.kind === 'group' ? 'Can edit — not available for groups' : 'Can edit'}</Option>
                      <Option value="remove">Remove</Option>
                    </Dropdown>
                  </div>
                ))}
              </div>

              <div className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
                <h3>Before you share</h3>
                <dl className="kv small" style={{ marginBottom: 8 }}>
                  <dt>Agent</dt><dd>{agent.name}</dd>
                  <dt>Audience</dt><dd>{entries.length ? entries.map(principalName).join(', ') : 'Only you'}</dd>
                </dl>
                <div className="small" style={{ fontWeight: 600, margin: '6px 0 2px' }}>Knowledge sources</div>
                {sources.map((k) => {
                  const d = getDoc(k.docId)!;
                  const a = audienceAccess(k.docId, entries);
                  return (
                    <div key={k.docId} className="ks-row" style={{ padding: '6px 0' }}>
                      <FileIcon kind={d.kind} size="sm" />
                      <div className="info">
                        <div className="name small">{d.fileName}</div>
                        <div className="meta">{entries.length ? a.note : 'Only you can use the agent right now.'}</div>
                      </div>
                      {entries.length > 0 && (a.ok ? <StatusBadge tone="success">Audience can open</StatusBadge> : <StatusBadge tone="warning">Audience can't open</StatusBadge>)}
                    </div>
                  );
                })}
                <Banner tone="info">
                  Sharing gives people access to the <strong>agent</strong>, not to its knowledge sources. The agent only uses content each person is already allowed to open.
                </Banner>
              </div>

              <div className="toggle-row">
                <div>
                  <div>Org-wide sharing for chat access</div>
                  <div className="xsmall muted">Depends on your organisation's policy and admin controls. Disabled in this training.</div>
                </div>
                <Tooltip content="Org-wide sharing is controlled by tenant policy and administrators. It isn't available in this simulation." relationship="description">
                  <Switch checked={false} disabled aria-label="Org-wide sharing for chat access (disabled by policy)" />
                </Tooltip>
              </div>
              <Checkbox checked={notify} onChange={(_, d) => setNotify(!!d.checked)} label="Send notification (simulated — no email is sent)" />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={sharing}>Cancel</Button>
            <Button appearance="primary" onClick={share} disabled={!entries.length || sharing} icon={sharing ? <Spinner size="tiny" /> : undefined}>
              {sharing ? 'Sharing…' : 'Share'}
            </Button>
          </DialogActions>
        </DialogBody>
        )}
      </DialogSurface>
    </Dialog>
  );
}
