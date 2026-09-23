import { useState } from 'react';
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, Tooltip } from '@fluentui/react-components';
import { ChevronRightRegular, MoreHorizontalRegular, PeopleRegular, ShareRegular, LockClosedRegular } from '@fluentui/react-icons';
import { useLab } from '../../state/store';
import { canTry, createAgent, publishUpdate, setBuilderTab } from '../../state/agentActions';
import { navigate } from '../../state/router';
import { StatusBadge } from '../common';
import { DescribeTab } from './DescribeTab';
import { ConfigureTab } from './ConfigureTab';
import { TryTab } from './TryTab';
import { CreatedDialog, ShareDialog } from './ShareDialog';
import { StudioDialog } from '../../training/StudioDialog';
import { getDoc } from '../../scenario/registry';
import { Banner, afterDialogClose } from '../common';

export function AgentBuilder({ agentId, tab }: { agentId: string; tab?: 'describe' | 'configure' | 'try' }) {
  const agent = useLab((s) => s.agents[agentId]);
  const creating = useLab((s) => !!s.ui.busy[`create:${agentId}`]);
  const [createdOpen, setCreatedOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [preCheck, setPreCheck] = useState(false);

  if (!agent) {
    return (
      <div className="conv-wrap">
        <Banner tone="warning" title="Agent not found.">This agent doesn't exist in your training data. It may have been reset.</Banner>
        <p><Button onClick={() => navigate({ name: 'agents' })}>View all agents</Button></p>
      </div>
    );
  }
  if (agent.prebuilt) {
    return (
      <div className="conv-wrap">
        <Banner tone="info" title="Read-only practice agent.">This practice agent was built for you and can't be edited in this exercise.</Banner>
        <p><Button onClick={() => navigate({ name: 'agent', agentId })}>Open agent</Button></p>
      </div>
    );
  }

  const active = tab ?? (agent.builder.stage === 'intro' ? 'describe' : 'configure');
  const showTabs = agent.builder.stage !== 'intro' || agent.status === 'created';
  const ready = canTry(agent);
  const issues = agent.knowledge.filter((k) => k.status === 'ready' && (getDoc(k.docId)?.supersededBy || getDoc(k.docId)?.duplicateOf));
  const problems = agent.knowledge.filter((k) => k.status === 'denied' || k.status === 'error');

  const doCreate = () => {
    if ((issues.length || problems.length) && !preCheck) { setPreCheck(true); return; }
    setPreCheck(false);
    createAgent(agentId);
    setCreatedOpen(true);
  };

  const sharedCount = agent.sharing.entries.length;

  return (
    <div className="builder">
      <div className="builder-head">
        <div className="crumb">
          <span>Agent Builder</span>
          <ChevronRightRegular fontSize={14} aria-hidden />
          <strong>{agent.name || 'New Agent'}</strong>
          {agent.status === 'created' ? (
            sharedCount ? <StatusBadge tone="brand" icon={<PeopleRegular />}>Shared</StatusBadge> : <StatusBadge tone="neutral" icon={<LockClosedRegular />}>Only you</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Draft</StatusBadge>
          )}
          {agent.hasUnpublishedChanges && <StatusBadge tone="warning">Unpublished changes</StatusBadge>}
        </div>
        {showTabs && (
          <div className="seg square" role="tablist" aria-label="Agent Builder views">
            {(['describe', 'configure', 'try'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={active === t}
                data-tour={`tab-${t}`}
                disabled={t === 'try' && !ready}
                title={t === 'try' && !ready ? 'Add a name, description and instructions first' : undefined}
                onClick={() => setBuilderTab(agentId, t)}
              >
                {t === 'describe' ? 'Describe' : t === 'configure' ? 'Configure' : 'Try it'}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {agent.status === 'created' && (
            <Button icon={<ShareRegular />} onClick={() => setShareOpen(true)} data-tour="share-button">Share</Button>
          )}
          {agent.status === 'created' ? (
            <Tooltip content={agent.hasUnpublishedChanges ? 'Make your changes available to people using the agent' : 'No unpublished changes'} relationship="description">
              <Button appearance="primary" disabled={!agent.hasUnpublishedChanges || creating} onClick={() => publishUpdate(agentId)} icon={creating ? <Spinner size="tiny" /> : undefined}>
                Update
              </Button>
            </Tooltip>
          ) : (
            <Tooltip content={ready ? 'Create the agent. It will be private to you until you share it.' : 'Add a name, description and instructions first'} relationship="description">
              <Button appearance="primary" disabled={!ready || creating} onClick={doCreate} data-tour="create-button" icon={creating ? <Spinner size="tiny" /> : undefined}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </Tooltip>
          )}
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button appearance="subtle" icon={<MoreHorizontalRegular />} aria-label="More options" />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {agent.status === 'created' && <MenuItem onClick={() => navigate({ name: 'agent', agentId })}>Open agent</MenuItem>}
                <MenuItem onClick={() => setStudioOpen(true)}>When to use Copilot Studio (training note)</MenuItem>
                <MenuItem disabled>Download .zip file — not available in this simulation</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      {preCheck && (
        <div style={{ padding: '0 20px' }}>
          <Banner tone="warning" title="Check your knowledge before creating.">
            {issues.map((k) => `${getDoc(k.docId)?.fileName} (${getDoc(k.docId)?.version}) is ${getDoc(k.docId)?.supersededBy ? 'superseded' : 'a possible duplicate'}. `).join('')}
            {problems.map((k) => `${getDoc(k.docId)?.fileName} can't be accessed. `).join('')}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button size="small" onClick={() => { setPreCheck(false); setBuilderTab(agentId, 'configure'); }}>Review knowledge</Button>
              <Button size="small" appearance="primary" onClick={doCreate}>Create anyway</Button>
            </div>
          </Banner>
        </div>
      )}

      <div className="builder-body">
        {active === 'describe' && <DescribeTab agent={agent} />}
        {active === 'configure' && <ConfigureTab agent={agent} />}
        {active === 'try' && <TryTab agent={agent} />}
      </div>

      {createdOpen && agent.status === 'created' && (
        <CreatedDialog agent={agent} onClose={() => setCreatedOpen(false)} onShare={() => { setCreatedOpen(false); afterDialogClose(() => setShareOpen(true)); }} />
      )}
      {shareOpen && <ShareDialog agent={agent} onClose={() => setShareOpen(false)} />}
      {studioOpen && <StudioDialog onClose={() => setStudioOpen(false)} />}
    </div>
  );
}
