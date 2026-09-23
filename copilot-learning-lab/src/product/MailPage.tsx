import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MailRegular, CalendarLtrRegular } from '@fluentui/react-icons';
import { useLab } from '../state/store';
import { navigate } from '../state/router';
import { calendarEvents, personById } from '../scenario/people';
import { settings } from '../config/settings';
import { clockTime, fmtDateLong, fmtDateShort, timeOf } from '../lib/util';
import { Banner, StatusBadge } from './common';

const DAYS = ['2026-09-23', '2026-09-24', '2026-09-25'];

/** Simulated Outlook: what the learner's approved actions actually did. */
export function MailPage({ tab = 'sent' }: { tab?: 'sent' | 'calendar' }) {
  const mailbox = useLab((s) => s.mailbox);
  const created = useLab((s) => s.calendar);
  const cancelledEmails = useLab(useShallow((s) => Object.values(s.actions).filter((a) => a.kind === 'email' && a.state === 'cancelled')));
  const [selected, setSelected] = useState<string | null>(mailbox[mailbox.length - 1]?.id ?? null);
  const item = mailbox.find((m) => m.id === selected);

  return (
    <div className="conv-wrap" style={{ maxWidth: 1100 }}>
      <div className="row-between" style={{ margin: '12px 0', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Simulated Outlook</h1>
        <div className="seg square" role="tablist" aria-label="Mailbox views">
          <button role="tab" aria-selected={tab === 'sent'} onClick={() => navigate({ name: 'mail', tab: 'sent' })}><MailRegular /> Sent items ({mailbox.length})</button>
          <button role="tab" aria-selected={tab === 'calendar'} onClick={() => navigate({ name: 'mail', tab: 'calendar' })}><CalendarLtrRegular /> Calendar ({created.length})</button>
        </div>
      </div>
      <Banner tone="info">Training simulation. Nothing here was really sent or scheduled — these records show what your approvals would have done.</Banner>

      {tab === 'sent' ? (
        <div className="grid2" style={{ gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', marginTop: 14 }}>
          <div className="stack" style={{ gap: 6 }} role="list" aria-label="Sent items">
            {!mailbox.length && <p className="muted small">No sent items yet.{cancelledEmails.length ? ` ${cancelledEmails.length} email(s) were cancelled and never sent.` : ''}</p>}
            {[...mailbox].reverse().map((m) => (
              <button key={m.id} role="listitem" className="task-list-row" style={selected === m.id ? { borderColor: 'var(--brand)', background: 'var(--brand-bg)' } : undefined} onClick={() => setSelected(m.id)}>
                <span style={{ minWidth: 0 }}>
                  <strong className="small">{m.email.to.map((r) => r.name).join(', ')}</strong>
                  <div className="xsmall" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email.subject}</div>
                </span>
                <span className="xsmall muted">{clockTime(m.at)}</span>
              </button>
            ))}
          </div>
          <div className="card" style={{ minHeight: 300 }}>
            {item ? (
              <>
                <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>{item.email.subject}</h2>
                <dl className="kv small">
                  <dt>From</dt><dd>{settings.learner.displayName}</dd>
                  <dt>To</dt><dd>{item.email.to.map((r) => `${r.name} <${r.email}>`).join('; ')}</dd>
                  {item.email.cc.length > 0 && (<><dt>Cc</dt><dd>{item.email.cc.map((r) => r.name).join('; ')}</dd></>)}
                  <dt>Sent</dt><dd>{clockTime(item.at)} {settings.scenario.timeZoneLabel} <StatusBadge tone="neutral">Simulated</StatusBadge></dd>
                  <dt>Attachments</dt><dd>{item.email.attachments.length} file(s)</dd>
                </dl>
                <div className="email-body" style={{ maxHeight: 'none' }}>{item.email.body}</div>
              </>
            ) : (
              <p className="muted">Select a message.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid3" style={{ marginTop: 14 }}>
          {DAYS.map((d) => {
            const busy = calendarEvents.filter((e) => e.start.startsWith(d));
            const mine = created.filter((e) => e.meeting.date === d);
            return (
              <div key={d} className="card">
                <h3>{fmtDateShort(d)}</h3>
                <p className="xsmall muted" style={{ marginTop: 0 }}>{fmtDateLong(d)} · {settings.scenario.timeZoneLabel}</p>
                {mine.map((e) => (
                  <div key={e.id} style={{ borderLeft: '3px solid var(--brand)', background: 'var(--brand-bg)', padding: '6px 8px', borderRadius: 6, margin: '6px 0' }}>
                    <div className="small"><strong>{e.meeting.start}–{e.meeting.end}</strong> {e.meeting.title}</div>
                    <div className="xsmall muted">{e.meeting.attendees.map((a) => a.name).join(', ')} · created {clockTime(e.at)} (simulated)</div>
                  </div>
                ))}
                {busy.map((e) => (
                  <div key={e.id} style={{ borderLeft: '3px solid var(--stroke-strong)', background: 'var(--surface-2)', padding: '6px 8px', borderRadius: 6, margin: '6px 0' }}>
                    <div className="small">{timeOf(e.start)}–{timeOf(e.end)} {e.title}</div>
                    <div className="xsmall muted">{personById(e.personId)?.name} · sample calendar</div>
                  </div>
                ))}
                {!mine.length && !busy.length && <p className="xsmall muted">Free</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
