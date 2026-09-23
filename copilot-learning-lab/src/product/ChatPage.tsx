import { useState } from 'react';
import { DismissRegular, SparkleRegular } from '@fluentui/react-icons';
import { settings } from '../config/settings';
import { useLab } from '../state/store';
import { copilotChatSend, setChatAttachments } from '../state/agentActions';
import { openCitation, openPicker } from '../state/uiActions';
import { getDoc } from '../scenario/registry';
import { Composer, FileIcon, Markdown, References, Thinking, useAutoScroll } from './common';
import { fmtDate } from '../lib/util';

const SUGGESTIONS = [
  "What's the difference between an agent and Cowork?",
  'Summarise the attached weekly tracker',
  'When should I use Copilot Studio instead of Agent Builder?',
];

/** Copilot Chat: ad hoc questions over whatever is attached to this conversation. */
export function ChatPage() {
  const chat = useLab((s) => s.copilotChat);
  const busy = useLab((s) => !!s.ui.busy['reply:chat']);
  const [text, setText] = useState('');
  const scroller = useAutoScroll(chat.messages.length + (busy ? 1 : 0));
  const send = (t = text) => { copilotChatSend(t); setText(''); };
  const last = chat.messages[chat.messages.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scroller} style={{ flex: 1, overflow: 'auto' }}>
        <div className="conv-wrap">
          {!chat.messages.length && (
            <div className="hero">
              <h1>Hi {settings.learner.displayName.split(' ')[0]}, what can I help with?</h1>
              <p>Ask a question, analyse a file you attach, or draft something.</p>
            </div>
          )}
          {chat.messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="msg user"><div className="bubble-user">{m.text}</div></div>
            ) : (
              <div key={m.id} className="msg assistant">
                <div className="msg-meta"><SparkleRegular fontSize={16} color="var(--copilot-a)" /> Copilot</div>
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
        {!chat.messages.length && (
          <div className="chips" aria-label="Suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
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
        <p className="xsmall muted" style={{ textAlign: 'center', margin: '8px 0 0' }}>Simulated responses from sample data. AI-generated content may be incorrect — check the sources.</p>
      </div>
    </div>
  );
}
