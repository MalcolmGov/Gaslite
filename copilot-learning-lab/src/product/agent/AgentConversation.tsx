import { useState } from 'react';
import { Tooltip } from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  CopyRegular,
  ThumbDislikeRegular,
  ThumbLikeRegular,
  ArrowForwardRegular,
  CheckmarkCircleRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import type { Agent, ChatMessage } from '../../engine/model';
import { useLab } from '../../state/store';
import { askAgent, rerun } from '../../state/agentActions';
import { openCitation } from '../../state/uiActions';
import { AgentIcon, Composer, Markdown, References, Thinking, useAutoScroll } from '../common';

const FOLLOW_UPS = ['Make the briefing shorter.', 'Show the source for this risk.', 'Separate completed work from next steps.', 'Turn this into a leadership-ready summary.'];

interface Props {
  agent: Agent;
  conv: 'try' | 'chat';
  /** Training coaching cards under test answers. */
  coaching?: boolean;
  onHandoff?: (messageId: string) => void;
  header?: React.ReactNode;
}

/** Conversation with an agent — used by the Try it pane and the full agent chat. */
export function AgentConversation({ agent, conv, coaching, onHandoff, header }: Props) {
  const busy = useLab((s) => !!s.ui.busy[`reply:${agent.id}:${conv}`]);
  const hideHints = useLab((s) => s.facilitator.hideHints);
  const [text, setText] = useState('');
  const list = conv === 'try' ? agent.testChat : agent.chat;
  const scroller = useAutoScroll(list.length + (busy ? 1 : 0));
  const send = (t = text) => { askAgent(agent.id, t, conv); setText(''); };
  const lastAssistant = [...list].reverse().find((m) => m.role === 'assistant');
  const cite = (id: string) => openCitation(id, { pack: agent.packId });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={scroller} style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div className="conv-wrap">
          {header}
          {!list.length && (
            <div style={{ textAlign: 'center', margin: '6vh 0 20px' }}>
              <AgentIcon name={agent.name || 'Agent'} size="lg" policy={agent.packId === 'policy'} />
              <h2 style={{ margin: '12px 0 4px', fontSize: 22 }}>{agent.name || 'New Agent'}</h2>
              <p className="muted small" style={{ maxWidth: 520, margin: '0 auto' }}>{agent.description}</p>
            </div>
          )}
          {list.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="msg user"><div className="bubble-user">{m.text}</div></div>
            ) : (
              <AnswerView
                key={m.id}
                m={m}
                agent={agent}
                conv={conv}
                list={list}
                stream={m === lastAssistant}
                onCite={cite}
                coaching={coaching && !hideHints}
                onHandoff={onHandoff}
                latest={m === lastAssistant}
                onFollowUp={send}
                busy={busy}
              />
            ),
          )}
          {busy && <div className="msg"><Thinking /></div>}
        </div>
      </div>
      <div className="conv-wrap" style={{ paddingTop: 4 }}>
        {agent.starterPrompts.length > 0 && !list.length && (
          <div className="chips" data-tour="agent-starters" aria-label="Suggested prompts">
            {agent.starterPrompts.filter((p) => p.message.trim()).map((p) => (
              <button key={p.id} className="chip" onClick={() => send(p.message)} disabled={busy} title={p.message}>{p.title}</button>
            ))}
          </div>
        )}
        <Composer
          tour={conv === 'try' ? 'try-composer' : 'agent-composer'}
          label={`Message ${agent.name || 'agent'}`}
          value={text}
          onChange={setText}
          onSend={() => send()}
          busy={busy}
          placeholder={`Message ${agent.name || 'your agent'}`}
        />
      </div>
    </div>
  );
}

function AnswerView({
  m, agent, conv, list, stream, onCite, coaching, onHandoff, latest, onFollowUp, busy,
}: {
  m: ChatMessage; agent: Agent; conv: 'try' | 'chat'; list: ChatMessage[]; stream: boolean; onCite: (id: string) => void;
  coaching?: boolean; onHandoff?: (id: string) => void; latest: boolean; onFollowUp: (t: string) => void; busy: boolean;
}) {
  const [liked, setLiked] = useState<null | 'up' | 'down'>(null);
  const [compare, setCompare] = useState(false);
  const [copied, setCopied] = useState(false);
  // The previous answer to the same question, from an earlier configuration version.
  const idx = list.indexOf(m);
  const question = [...list.slice(0, idx)].reverse().find((x) => x.role === 'user')?.text;
  const previous = question
    ? list.slice(0, idx).filter((x, i, arr) => x.role === 'assistant' && arr[i - 1]?.role === 'user' && arr[i - 1].text === question && x.configVersion !== m.configVersion).pop()
    : undefined;

  return (
    <div className="msg assistant">
      <div className="msg-meta">
        <AgentIcon name={agent.name || 'Agent'} policy={agent.packId === 'policy'} /> {agent.name || 'Agent'}
        {conv === 'try' && m.configVersion !== undefined && <span className="xsmall muted" style={{ fontWeight: 400 }}>· config v{m.configVersion}</span>}
      </div>
      <div className="body">
        <Markdown text={m.text} stream={stream} onCite={onCite} />
        <References text={m.text} onCite={onCite} />
      </div>
      <div className="msg-actions">
        <Tooltip content={copied ? 'Copied' : 'Copy'} relationship="label">
          <button className="icon-btn" onClick={() => { navigator.clipboard?.writeText(m.text.replace(/\[\[c:[\w-]+\]\]/g, '')).catch(() => {}); setCopied(true); }}><CopyRegular /></button>
        </Tooltip>
        {conv === 'chat' && (
          <>
            <Tooltip content="Like" relationship="label"><button className="icon-btn" aria-pressed={liked === 'up'} onClick={() => setLiked('up')}><ThumbLikeRegular /></button></Tooltip>
            <Tooltip content="Dislike" relationship="label"><button className="icon-btn" aria-pressed={liked === 'down'} onClick={() => setLiked('down')}><ThumbDislikeRegular /></button></Tooltip>
          </>
        )}
        {conv === 'try' && (
          <Tooltip content="Ask the same question again with the current configuration" relationship="description">
            <button className="chip" style={{ padding: '3px 10px' }} onClick={() => rerun(agent.id, m.id, conv)} disabled={busy}><ArrowClockwiseRegular /> Rerun</button>
          </Tooltip>
        )}
        {previous && (
          <button className="chip" style={{ padding: '3px 10px' }} aria-expanded={compare} onClick={() => setCompare((c) => !c)}>
            {compare ? 'Hide' : 'Compare with'} config v{previous.configVersion}
          </button>
        )}
      </div>
      {compare && previous && (
        <div className="card" style={{ marginTop: 8, background: 'var(--surface-2)' }}>
          <div className="xsmall muted" style={{ marginBottom: 6 }}>Previous answer (config v{previous.configVersion})</div>
          <Markdown text={previous.text} onCite={onCite} />
        </div>
      )}
      {coaching && m.coaching && <CoachingCard m={m} />}
      {latest && conv === 'chat' && m.isBriefing && onHandoff && (
        <div className="tcard" style={{ marginTop: 10 }} data-tour="handoff">
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <span className="small"><span className="tpill">Learning Lab</span> Reviewed this briefing? Carry it into the Cowork exercise.</span>
            <button className="tbutton" onClick={() => onHandoff(m.id)}><ArrowForwardRegular /> Use this briefing in the Cowork exercise</button>
          </div>
        </div>
      )}
      {latest && conv === 'chat' && agent.packId === 'programme' && (
        <div className="chips" data-tour="agent-followups" aria-label="Follow-up suggestions">
          {FOLLOW_UPS.map((f) => <button key={f} className="chip" onClick={() => onFollowUp(f)} disabled={busy}>{f}</button>)}
        </div>
      )}
    </div>
  );
}

function CoachingCard({ m }: { m: ChatMessage }) {
  const c = m.coaching!;
  const good = c.verdict === 'good';
  return (
    <div className="tcard" style={{ marginTop: 10 }} role="note" aria-label={`Test ${m.testCase} feedback`}>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <strong className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {good ? <CheckmarkCircleRegular color="var(--success)" aria-hidden /> : <WarningRegular color="var(--warning)" aria-hidden />}
          Test {m.testCase}: {good ? 'good behaviour' : 'needs work'}
        </strong>
        <span className="tpill">Learning Lab feedback</span>
      </div>
      <dl className="kv small" style={{ gridTemplateColumns: '90px minmax(0,1fr)' }}>
        <dt>Evidence</dt><dd>{c.evidence}</dd>
        <dt>Clarity</dt><dd>{c.clarity}</dd>
        <dt>Uncertainty</dt><dd>{c.uncertainty}</dd>
      </dl>
      {c.tip && <p className="small" style={{ margin: '8px 0 0' }}><strong>Next:</strong> {c.tip}</p>}
    </div>
  );
}
