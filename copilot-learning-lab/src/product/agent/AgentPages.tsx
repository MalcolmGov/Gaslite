import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger } from '@fluentui/react-components';
import { EditRegular, MoreHorizontalRegular, PeopleRegular, LockClosedRegular, InfoRegular } from '@fluentui/react-icons';
import { useLab } from '../../state/store';
import { handoffToCowork, startNewAgent } from '../../state/agentActions';
import { navigate } from '../../state/router';
import { groupById, personById } from '../../scenario/people';
import { getDoc } from '../../scenario/registry';
import { AgentIcon, Banner, StatusBadge, afterDialogClose } from '../common';
import { AgentConversation } from './AgentConversation';
import { toPlainText } from '../../lib/markdown';

/** Full conversation with a created agent (the learner's own, or a practice agent). */
export function AgentChatPage({ agentId }: { agentId: string }) {
  const agent = useLab((s) => s.agents[agentId]);
  const [handoffId, setHandoffId] = useState<string | null>(null);
  const [about, setAbout] = useState(false);

  if (!agent) {
    return (
      <div className="conv-wrap">
        <Banner tone="warning" title="This agent isn't available.">The link may point to an agent from another device or a reset session. Prototype links only work in this browser.</Banner>
        <p><Button onClick={() => navigate({ name: 'agents' })}>View all agents</Button></p>
      </div>
    );
  }
  if (agent.status !== 'created') {
    return (
      <div className="conv-wrap">
        <Banner tone="info" title="This agent hasn't been created yet.">Finish it in Agent Builder and select Create before chatting with it.</Banner>
        <p><Button appearance="primary" onClick={() => navigate({ name: 'builder', agentId, tab: 'configure' })}>Open in Agent Builder</Button></p>
      </div>
    );
  }
  const audience = agent.sharing.entries.map((e) => (e.kind === 'group' ? groupById(e.principalId)?.name : personById(e.principalId)?.name)).filter(Boolean);
  const handoffMsg = agent.chat.find((m) => m.id === handoffId);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="row-between" style={{ padding: '8px 20px', borderBottom: '1px solid var(--stroke)', background: '#fff', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
          <AgentIcon name={agent.name} policy={agent.packId === 'policy'} />
          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</strong>
          {audience.length ? <StatusBadge tone="brand" icon={<PeopleRegular />}>Shared with {audience.join(', ')}</StatusBadge> : <StatusBadge tone="neutral" icon={<LockClosedRegular />}>Only you</StatusBadge>}
        </div>
        <Menu>
          <MenuTrigger disableButtonEnhancement><Button appearance="subtle" icon={<MoreHorizontalRegular />} aria-label="Agent options" /></MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<InfoRegular />} onClick={() => setAbout(true)}>About this agent</MenuItem>
              {!agent.prebuilt && <MenuItem icon={<EditRegular />} onClick={() => navigate({ name: 'builder', agentId, tab: 'configure' })}>Edit</MenuItem>}
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgentConversation agent={agent} conv="chat" onHandoff={agent.packId === 'programme' ? setHandoffId : undefined} />
      </div>

      {about && (
        <Dialog open onOpenChange={(_, d) => { if (!d.open) setAbout(false); }}>
          <DialogSurface style={{ maxWidth: 520 }}>
            <DialogBody>
              <DialogTitle>{agent.name}</DialogTitle>
              <DialogContent>
                <p>{agent.description}</p>
                <p className="small"><strong>Knowledge:</strong> {agent.knowledge.filter((k) => k.status === 'ready').map((k) => getDoc(k.docId)?.title).join(', ') || 'none'}</p>
                <p className="small"><strong>Audience:</strong> {audience.join(', ') || 'Only you'}</p>
              </DialogContent>
              <DialogActions><Button appearance="primary" onClick={() => setAbout(false)}>Close</Button></DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}

      {handoffMsg && (
        <Dialog open onOpenChange={(_, d) => { if (!d.open) setHandoffId(null); }}>
          <DialogSurface style={{ maxWidth: 620, borderTop: '4px solid var(--train)' }}>
            <DialogBody>
              <DialogTitle><span className="tpill">Learning Lab</span> Use this briefing in the Cowork exercise</DialogTitle>
              <DialogContent>
                <p style={{ marginTop: 0 }}>
                  This <strong>copies</strong> the briefing you reviewed into a new, simulated Cowork task as context. It is a training step — it does not show a built-in connection between your agent and Cowork.
                </p>
                <div className="card" style={{ maxHeight: 220, overflow: 'auto', background: 'var(--surface-2)', boxShadow: 'none' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, margin: 0 }}>{toPlainText(handoffMsg.text)}</pre>
                </div>
                <p className="small">Check it's the version you want: once copied, later changes in this chat won't update the task.</p>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setHandoffId(null)}>Cancel</Button>
                <button className="tbutton" onClick={() => { const id = handoffMsg.id; setHandoffId(null); afterDialogClose(() => handoffToCowork(agentId, id)); }}>Copy briefing into a new Cowork task</button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
}

export function AgentsListPage() {
  const agents = useLab(useShallow((s) => s.agentOrder.map((id) => s.agents[id]).filter(Boolean)));
  return (
    <div className="conv-wrap">
      <div className="row-between" style={{ margin: '16px 0' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Agents</h1>
        <Button appearance="primary" onClick={() => startNewAgent()}>New agent</Button>
      </div>
      {!agents.length && <p className="muted">You haven't built any agents yet.</p>}
      <div className="stack" style={{ gap: 8 }}>
        {agents.map((a) => (
          <button key={a.id} className="task-list-row" onClick={() => navigate(a.status === 'created' ? { name: 'agent', agentId: a.id } : { name: 'builder', agentId: a.id, tab: a.builder.stage === 'intro' ? 'describe' : 'configure' })}>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
              <AgentIcon name={a.name || 'New Agent'} policy={a.packId === 'policy'} />
              <span style={{ minWidth: 0 }}>
                <strong>{a.name || 'Untitled draft'}</strong>
                <div className="xsmall muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description || 'No description'}</div>
              </span>
            </span>
            <span>{a.status === 'created' ? (a.sharing.entries.length ? <StatusBadge tone="brand">Shared</StatusBadge> : <StatusBadge tone="neutral">Only you</StatusBadge>) : <StatusBadge tone="neutral">Draft</StatusBadge>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
