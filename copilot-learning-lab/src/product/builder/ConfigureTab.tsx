import { Button, Spinner, Switch, Tooltip } from '@fluentui/react-components';
import {
  AddRegular,
  ArrowCounterclockwiseRegular,
  ArrowSwapRegular,
  CheckmarkCircleRegular,
  DeleteRegular,
  ErrorCircleRegular,
  InfoRegular,
  LockClosedRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import type { Agent, KnowledgeRef } from '../../engine/model';
import { describeBehaviour, readInstructions } from '../../engine/instructions';
import { removeKnowledge, replaceKnowledge, restoreKnowledge, retryKnowledge, updateAgentField, updateStarterPrompts } from '../../state/agentActions';
import { openPicker } from '../../state/uiActions';
import { getDoc } from '../../scenario/registry';
import { fmtDate, newId } from '../../lib/util';
import { AgentIcon, FileIcon, StatusBadge } from '../common';
import { HelpTip } from '../../training/HelpTip';

export function ConfigureTab({ agent }: { agent: Agent }) {
  const active = agent.knowledge.filter((k) => k.status !== 'removed');
  const removed = agent.knowledge.filter((k) => k.status === 'removed');
  const behaviour = readInstructions(agent.instructions);

  return (
    <div className="two-col">
      <div className="stack">
        <div className="card">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <AgentIcon name={agent.name || 'New Agent'} size="lg" />
            <div className="stack" style={{ flex: 1, gap: 10 }}>
              <div>
                <label className="field-label" htmlFor="ag-name">Name</label>
                <input id="ag-name" className="input" maxLength={30} value={agent.name} placeholder="Name your agent" onChange={(e) => updateAgentField(agent.id, 'name', e.target.value)} />
                <div className="xsmall muted" style={{ textAlign: 'right' }}>{agent.name.length}/30</div>
              </div>
              <div>
                <label className="field-label" htmlFor="ag-desc">Description</label>
                <textarea id="ag-desc" className="textarea" rows={2} maxLength={1000} value={agent.description} placeholder="Describe what the agent does and who it's for" onChange={(e) => updateAgentField(agent.id, 'description', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" data-tour="instructions-field">
          <label className="field-label" htmlFor="ag-instr">
            Instructions
            <Tooltip content="Instructions tell the agent how to behave: its purpose, what to include, and what to do when information is missing." relationship="description">
              <InfoRegular aria-label="About instructions" />
            </Tooltip>
          </label>
          <textarea id="ag-instr" className="textarea" rows={8} maxLength={8000} value={agent.instructions} onChange={(e) => updateAgentField(agent.id, 'instructions', e.target.value)} placeholder="What should this agent do? How should it behave?" />
          <div className="xsmall muted" style={{ textAlign: 'right' }}>{agent.instructions.length}/8,000</div>
        </div>

        <div className="card">
          <div className="row-between">
            <h3>
              Knowledge
              <HelpTip term="knowledge" />
            </h3>
            <Button icon={<AddRegular />} onClick={() => openPicker('agent', agent.id)} data-tour="add-knowledge">Add knowledge</Button>
          </div>
          <p className="sub">Choose the sources your agent will use to generate responses.</p>
          {!active.length && <p className="small muted">No knowledge sources yet. Without sources, the agent can't give grounded answers.</p>}
          <div>{active.map((k) => <KnowledgeRow key={k.docId} agent={agent} k={k} />)}</div>
          {removed.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary className="small" style={{ cursor: 'pointer' }}>Removed ({removed.length}) — the agent no longer uses these</summary>
              {removed.map((k) => <KnowledgeRow key={k.docId} agent={agent} k={k} />)}
            </details>
          )}
          <div style={{ borderTop: '1px solid var(--stroke)', marginTop: 10, paddingTop: 6 }}>
            <div className="toggle-row">
              <span>Search all websites</span>
              <Tooltip content="Web content is turned off in this training tenant." relationship="description">
                <Switch checked={false} disabled aria-label="Search all websites (unavailable)" />
              </Tooltip>
            </div>
            <div className="toggle-row">
              <span>Only use specified sources</span>
              <Switch checked={agent.onlySpecifiedSources} onChange={(_, d) => updateAgentField(agent.id, 'onlySpecifiedSources', d.checked)} aria-label="Only use specified sources" />
            </div>
            <div className="toggle-row">
              <span>Reference org chart and profile info</span>
              <Tooltip content="Not used in this exercise." relationship="description">
                <Switch checked={false} disabled aria-label="Reference org chart (unavailable)" />
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Capabilities</h3>
          <div className="toggle-row">
            <div>
              <div>Create documents, charts, and code</div>
              <div className="xsmall muted">Not used in this exercise — the agent answers questions from documents.</div>
            </div>
            <Switch checked={false} disabled aria-label="Create documents, charts, and code (unavailable)" />
          </div>
          <div className="toggle-row">
            <div>
              <div>Create images</div>
              <div className="xsmall muted">Not used in this exercise.</div>
            </div>
            <Switch checked={false} disabled aria-label="Create images (unavailable)" />
          </div>
        </div>

        <div className="card">
          <h3>Suggested prompts</h3>
          <p className="sub">Starter prompts help people understand what the agent can do.</p>
          <div className="prompt-row xsmall muted" aria-hidden><span className="ptitle">Title</span><span>Message</span><span /></div>
          {agent.starterPrompts.map((p, i) => (
            <div key={p.id} className="prompt-row">
              <input className="input ptitle" aria-label={`Prompt ${i + 1} title`} value={p.title} onChange={(e) => updateStarterPrompts(agent.id, agent.starterPrompts.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))} />
              <input className="input" aria-label={`Prompt ${i + 1} message`} value={p.message} onChange={(e) => updateStarterPrompts(agent.id, agent.starterPrompts.map((x) => (x.id === p.id ? { ...x, message: e.target.value } : x)))} />
              <Tooltip content="Delete prompt" relationship="label">
                <button className="icon-btn" onClick={() => updateStarterPrompts(agent.id, agent.starterPrompts.filter((x) => x.id !== p.id))}><DeleteRegular /></button>
              </Tooltip>
            </div>
          ))}
          <Button icon={<AddRegular />} disabled={agent.starterPrompts.length >= 6} onClick={() => updateStarterPrompts(agent.id, [...agent.starterPrompts, { id: newId('sp'), title: 'New prompt', message: '' }])}>
            Add prompt
          </Button>
        </div>
      </div>

      <aside className="side stack" aria-label="Learning Lab guidance">
        <div className="tcard">
          <div className="row-between" style={{ marginBottom: 6 }}>
            <strong className="small">How the simulator reads your instructions</strong>
            <span className="tpill">Learning Lab</span>
          </div>
          <p className="xsmall" style={{ margin: '0 0 8px' }}>
            This training simulator looks for these behaviours in your instructions. Edit them and rerun a test to see the effect. A real agent is steered by instructions in a similar — but less predictable — way.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="small">
            {describeBehaviour(behaviour).map((b) => (
              <li key={b.label} style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0' }}>
                {b.on ? <CheckmarkCircleRegular color={b.label.includes('risky') ? 'var(--warning)' : 'var(--success)'} aria-hidden /> : <span aria-hidden style={{ width: 16, height: 16, border: '1.5px solid var(--stroke-strong)', borderRadius: 8, display: 'inline-block' }} />}
                <span>{b.label}</span>
                <span className="sr-only">{b.on ? 'detected' : 'not detected'}</span>
              </li>
            ))}
          </ul>
          <p className="xsmall muted" style={{ margin: '8px 0 0' }}>Configuration version {agent.configVersion}</p>
        </div>
        <div className="tcard small">
          <div className="row-between" style={{ marginBottom: 6 }}><strong>Terms</strong><span className="tpill">Learning Lab</span></div>
          <p style={{ margin: '0 0 6px' }}><strong>Grounding</strong> — basing answers on specific sources, so claims can be checked. <HelpTip term="grounding" /></p>
          <p style={{ margin: 0 }}><strong>Permissions</strong> — people only get answers from sources they can open themselves. <HelpTip term="permissions" /></p>
        </div>
      </aside>
    </div>
  );
}

function KnowledgeRow({ agent, k }: { agent: Agent; k: KnowledgeRef }) {
  const d = getDoc(k.docId);
  if (!d) return null;
  const newer = d.supersededBy ? getDoc(d.supersededBy) : undefined;
  const original = d.duplicateOf ? getDoc(d.duplicateOf) : undefined;
  return (
    <div className="ks-row">
      <FileIcon kind={d.kind} />
      <div className="info">
        <div className="name" style={k.status === 'removed' ? { textDecoration: 'line-through', color: 'var(--text-3)' } : undefined}>{d.fileName}</div>
        <div className="meta">{d.version} · Modified {fmtDate(d.modified)} · {d.owner} · {d.classification}</div>
        {k.message && <div className="xsmall" style={{ color: 'var(--danger)', marginTop: 2 }}>{k.message}</div>}
        {k.status === 'ready' && newer && (
          <div className="xsmall" style={{ color: 'var(--warning)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <WarningRegular aria-hidden /> Superseded by {newer.version} ({fmtDate(newer.modified)}).
            <Button size="small" appearance="transparent" icon={<ArrowSwapRegular />} onClick={() => replaceKnowledge(agent.id, d.id, newer.id)}>Replace with newer version</Button>
          </div>
        )}
        {k.status === 'ready' && original && (
          <div className="xsmall" style={{ color: 'var(--warning)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <WarningRegular aria-hidden /> Possible duplicate of the SharePoint original.
            <Button size="small" appearance="transparent" icon={<ArrowSwapRegular />} onClick={() => replaceKnowledge(agent.id, d.id, original.id)}>Use the original</Button>
          </div>
        )}
      </div>
      <KnowledgeStatus k={k} />
      {k.status === 'removed' ? (
        <Tooltip content="Undo remove" relationship="label">
          <button className="icon-btn" onClick={() => restoreKnowledge(agent.id, d.id)}><ArrowCounterclockwiseRegular /></button>
        </Tooltip>
      ) : (
        <>
          {k.status === 'error' && <Button size="small" onClick={() => retryKnowledge(agent.id, d.id)}>Retry</Button>}
          {k.status === 'denied' && <Button size="small" onClick={() => { removeKnowledge(agent.id, d.id); openPicker('agent', agent.id); }}>Choose another</Button>}
          <Tooltip content={`Remove ${d.fileName}`} relationship="label">
            <button className="icon-btn" onClick={() => removeKnowledge(agent.id, d.id)}><DeleteRegular /></button>
          </Tooltip>
        </>
      )}
    </div>
  );
}

export function KnowledgeStatus({ k }: { k: KnowledgeRef }) {
  switch (k.status) {
    case 'preparing':
      return <StatusBadge tone="brand" icon={<Spinner size="extra-tiny" />}>Preparing</StatusBadge>;
    case 'ready':
      return <StatusBadge tone="success" icon={<CheckmarkCircleRegular />}>Ready</StatusBadge>;
    case 'denied':
      return <StatusBadge tone="danger" icon={<LockClosedRegular />}>Access denied</StatusBadge>;
    case 'error':
      return <StatusBadge tone="danger" icon={<ErrorCircleRegular />}>Couldn't access</StatusBadge>;
    case 'removed':
      return <StatusBadge tone="neutral">Removed</StatusBadge>;
  }
}

