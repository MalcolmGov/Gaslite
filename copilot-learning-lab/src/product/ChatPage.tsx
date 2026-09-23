import { useState, type ReactNode } from 'react';
import { DismissRegular, SparkleFilled, BotSparkleRegular, DocumentSearchRegular, BranchForkRegular } from '@fluentui/react-icons';
import { settings } from '../config/settings';
import { useLab } from '../state/store';
import { copilotChatSend, setChatAttachments } from '../state/agentActions';
import { openCitation, openPicker } from '../state/uiActions';
import { getDoc } from '../scenario/registry';
import { Composer, FileIcon, Markdown, References, Thinking, useAutoScroll } from './common';
import { fmtDate } from '../lib/util';

const SUGGESTIONS: { prompt: string; title: string; sub: string; icon: ReactNode; color: string }[] = [
  { prompt: "What's the difference between an agent and Cowork?", title: 'Agents vs Cowork', sub: "What's the difference between an agent and Cowork?", icon: <BotSparkleRegular fontSize={18} />, color: 'linear-gradient(135deg,#4f6bed,#8a5cf6)' },
  { prompt: 'Summarise the attached weekly tracker', title: 'Summarise a file', sub: 'Attach the weekly tracker with + and ask for a summary.', icon: <DocumentSearchRegular fontSize={18} />, color: 'linear-gradient(135deg,#0f7b6c,#2c7be5)' },
  { prompt: 'When should I use Copilot Studio instead of Agent Builder?', title: 'Choose the right tool', sub: 'When should I use Copilot Studio instead of Agent Builder?', icon: <BranchForkRegular fontSize={18} />, color: 'linear-gradient(135deg,#d45fa6,#8a5cf6)' },
];

export const AiAvatar = () => <span className="ai-avatar" aria-hidden><SparkleFilled fontSize={13} /></span>;

/** Copilot Chat: ad hoc questions over whatever is attached to this conversation. */
export function ChatPage() {
  const chat = useLab((s) => s.copilotChat);
  const busy = useLab((s) => !!s.ui.busy['reply:chat']);
  const [text, setText] = useState('');
  const scroller = useAutoScroll(chat.messages.length + (busy ? 1 : 0));
  const send = (t = text) => { copilotChatSend(t); setText(''); };
  const last = chat.messages[chat.messages.length - 1];
  const empty = !chat.messages.length;

  const composer = (
    <Composer
      tour="chat-composer"
      label="Message Copilot"
      value={text}
      onChange={setText}
      onSend={() => send()}
      busy={busy}
      placeholder="Message Copilot"
      onAdd={() => openPicker('chat')}
      addLabel="Add work content"
    >
      {chat.attached.length > 0 && (
        <div className="chips" style={{ margin: '0 0 6px' }}>
          {chat.attached.map((id) => {
            const d = getDoc(id)!;
            return (
              <span key={id} className="file-chip">
                <FileIcon kind={d.kind} size="sm" />
                <span>{d.fileName}<br /><span className="meta">{d.version} · {fmtDate(d.modified)}</span></span>
                <button className="icon-btn" aria-label={`Remove ${d.fileName}`} onClick={() => setChatAttachments(chat.attached.filter((x) => x !== id))}><DismissRegular /></button>
              </span>
            );
          })}
        </div>
      )}
    </Composer>
  );
  const disclaimer = <p className="xsmall muted" style={{ textAlign: 'center', margin: '10px 0 0' }}>Simulated responses from sample data. AI-generated content may be incorrect — check the sources.</p>;

  if (empty) {
    return (
      <div className="home-center">
        <div className="hero">
          <h1>Hi <span className="grad-text">{settings.learner.displayName.split(' ')[0]}</span>, what can I help with?</h1>
          <p>Ask a question, analyse a file you attach, or draft something.</p>
        </div>
        {composer}
        <div className="prompt-grid" aria-label="Suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s.title} className="prompt-card" onClick={() => send(s.prompt)} aria-label={s.prompt}>
              <span className="pc-icon" style={{ background: s.color }} aria-hidden>{s.icon}</span>
              <span className="pc-title">{s.title}</span>
              <span className="pc-sub">{s.sub}</span>
            </button>
          ))}
        </div>
        {disclaimer}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scroller} style={{ flex: 1, overflow: 'auto' }}>
        <div className="conv-wrap">
          {chat.messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="msg user"><div className="bubble-user">{m.text}</div></div>
            ) : (
              <div key={m.id} className="msg assistant">
                <div className="msg-meta"><AiAvatar /> Copilot</div>
                <div className="body">
                  <Markdown text={m.text} stream={m === last} onCite={(id) => openCitation(id)} />
                  <References text={m.text} onCite={(id) => openCitation(id)} />
                </div>
              </div>
            ),
          )}
          {busy && <div className="msg"><Thinking /></div>}
        </div>
      </div>
      <div className="conv-wrap" style={{ paddingTop: 0 }}>
        {composer}
        {disclaimer}
      </div>
    </div>
  );
}
