import { useState } from 'react';
import { AiAvatar } from '../ChatPage';
import { Button } from '@fluentui/react-components';
import { ArrowRightRegular, CheckmarkRegular } from '@fluentui/react-icons';
import type { Agent, ChatMessage } from '../../engine/model';
import { useLab } from '../../state/store';
import { builderReply, builderSend, setBuilderTab, skipToConfigure } from '../../state/agentActions';
import { openPicker } from '../../state/uiActions';
import { STARTING_INSTRUCTION } from '../../engine/builder';
import { getDoc } from '../../scenario/registry';
import { AgentIcon, Composer, Markdown, Thinking, useAutoScroll } from '../common';

/** Natural-language creation with clarifying questions. */
export function DescribeTab({ agent }: { agent: Agent }) {
  const busy = useLab((s) => !!s.ui.busy[`builder:${agent.id}`]);
  const hideHints = useLab((s) => s.facilitator.hideHints);
  const [text, setText] = useState('');
  const msgs = agent.builder.messages;
  const scroller = useAutoScroll(msgs.length + (busy ? 1 : 0));
  const send = () => { builderSend(agent.id, text); setText(''); };
  const intro = agent.builder.stage === 'intro' && !msgs.length;
  const lastBuilder = [...msgs].reverse().find((m) => m.role === 'builder');

  if (intro) {
    return (
      <div className="conv-wrap" style={{ maxWidth: 900 }}>
        <div className="hero" style={{ marginTop: '12vh', marginBottom: '10vh' }}>
          <h1>What can I take off your hands today?</h1>
        </div>
        <Composer
          tour="builder-composer"
          label="Describe your agent"
          value={text}
          onChange={setText}
          onSend={send}
          placeholder="Type your message ..."
          onAdd={() => openPicker('agent', agent.id)}
          addLabel="Add knowledge"
        />
        <div className="row-between" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {!hideHints ? (
            <button className="chip" onClick={() => setText(STARTING_INSTRUCTION)} style={{ maxWidth: 620 }}>
              <span className="tpill">Learning Lab</span> Use the exercise description
            </button>
          ) : <span />}
          <Button appearance="transparent" icon={<ArrowRightRegular />} iconPosition="after" onClick={() => skipToConfigure(agent.id)}>
            Skip to configure
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="two-col">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 230px)' }}>
        <div ref={scroller} style={{ flex: 1 }}>
          {msgs.map((m) => <BuilderMessage key={m.id} m={m} agent={agent} latest={m === lastBuilder} busy={busy} />)}
          {busy && <div className="msg"><Thinking label="Updating your agent" /></div>}
        </div>
        <div style={{ position: 'sticky', bottom: 0, paddingTop: 16, paddingBottom: 8, background: 'linear-gradient(180deg, rgba(250,250,250,0) 0%, var(--bg) 35%)' }}>
          <Composer
            tour="builder-composer"
            label="Message Agent Builder"
            value={text}
            onChange={setText}
            onSend={send}
            busy={busy}
            placeholder={agent.builder.stage === 'done' ? 'Describe a change, e.g. "Make answers more concise"' : 'Type your answer ...'}
            onAdd={() => openPicker('agent', agent.id)}
            addLabel="Add knowledge"
          />
        </div>
      </div>
      <aside className="side" aria-label="Agent preview">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="xsmall muted">Preview · updates as you chat</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <AgentIcon name={agent.name || 'New Agent'} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{agent.name || 'New Agent'}</div>
              <div className="small muted">{agent.description || 'No description yet'}</div>
            </div>
          </div>
          <div className="small" style={{ marginTop: 12 }}>
            <strong>Knowledge:</strong>{' '}
            {agent.knowledge.filter((k) => k.status !== 'removed').length
              ? agent.knowledge.filter((k) => k.status !== 'removed').map((k) => `${getDoc(k.docId)?.title} (${k.status === 'ready' ? 'ready' : k.status === 'preparing' ? 'preparing…' : 'no access'})`).join(', ')
              : 'none yet'}
          </div>
          {agent.instructions && (
            <details style={{ marginTop: 10 }}>
              <summary className="small" style={{ cursor: 'pointer' }}>Instructions</summary>
              <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{agent.instructions}</p>
            </details>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Button size="small" onClick={() => setBuilderTab(agent.id, 'configure')}>Open Configure</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function BuilderMessage({ m, agent, latest, busy }: { m: ChatMessage; agent: Agent; latest: boolean; busy: boolean }) {
  const [multi, setMulti] = useState<string[]>(() => m.quickReplies?.filter((q) => q.recommended).map((q) => q.value) ?? []);
  if (m.role === 'user') return <div className="msg user"><div className="bubble-user">{m.text}</div></div>;
  const active = latest && !busy;
  return (
    <div className="msg assistant">
      <div className="msg-meta"><AiAvatar /> Agent Builder</div>
      <div className="body"><Markdown text={m.text} /></div>
      {m.quickReplies && active && !m.multiSelect && (
        <div className="chips" data-tour="builder-replies" role="group" aria-label="Suggested answers">
          {m.quickReplies.map((q) => (
            <button key={q.value} className="chip" onClick={() => builderReply(agent.id, q.label, q.value)}>
              {q.label}
            </button>
          ))}
          {m.builderAction === 'open-picker' && agent.knowledge.some((k) => k.status === 'ready' || k.status === 'preparing') && (
            <button className="chip" onClick={() => builderReply(agent.id, 'Continue with the selected sources', agent.knowledge.map((k) => k.docId).join(','))}>
              Continue with the selected sources
            </button>
          )}
        </div>
      )}
      {m.quickReplies && active && m.multiSelect && (
        <div data-tour="builder-replies">
          <div className="chips" role="group" aria-label="Select all that apply">
            {m.quickReplies.map((q) => {
              const on = multi.includes(q.value);
              return (
                <button key={q.value} className="chip" aria-pressed={on} onClick={() => setMulti((x) => (on ? x.filter((v) => v !== q.value) : [...x, q.value]))}>
                  {on && <CheckmarkRegular />} {q.label}
                </button>
              );
            })}
          </div>
          <Button appearance="primary" size="small" disabled={!multi.length} onClick={() => builderReply(agent.id, m.quickReplies!.filter((q) => multi.includes(q.value)).map((q) => q.label).join(', '), multi.join(','))}>
            Submit
          </Button>
        </div>
      )}
      {m.builderAction === 'go-configure' && latest && (
        <div className="chips">
          <button className="chip" onClick={() => setBuilderTab(agent.id, 'configure')}>Review on Configure</button>
          <button className="chip" onClick={() => setBuilderTab(agent.id, 'try')}>Test on Try it</button>
        </div>
      )}
    </div>
  );
}
