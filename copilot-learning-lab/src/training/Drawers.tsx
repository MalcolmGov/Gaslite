import { useEffect, useRef, useState } from 'react';
import { Button, Radio, RadioGroup, Switch } from '@fluentui/react-components';
import { CheckmarkCircleRegular, CircleRegular, DismissRegular, ArrowCounterclockwiseRegular } from '@fluentui/react-icons';
import { settings } from '../config/settings';
import { useLab } from '../state/store';
import { setDrawer } from '../state/uiActions';
import { armFailure, loadLessonState, resetAll, restartExercise, setFacilitator, setLesson } from '../state/trainingActions';
import { lessons } from './lessons';
import { GLOSSARY } from './HelpTip';
import { EXPERIENCES } from './StudioDialog';
import type { Speed } from '../lib/scheduler';
import { REFERENCES } from './references';

function Drawer({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <aside className="tdrawer" role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} ref={ref} tabIndex={-1}>
      <header>
        <h2 id={`${id}-title`}><span className="tpill">Learning Lab</span> {title}</h2>
        <button className="icon-btn" aria-label="Close" onClick={() => setDrawer(null)}><DismissRegular /></button>
      </header>
      <div className="body">{children}</div>
    </aside>
  );
}

export function LessonDrawer() {
  const session = useLab((s) => s.session);
  const showNotes = useLab((s) => s.facilitator.showNotes || s.session.mode === 'facilitator' && s.facilitator.showNotes);
  const lesson = lessons.find((l) => l.id === session.lessonId) ?? lessons[0];
  return (
    <Drawer title="Lesson" id="lesson">
      <h3 style={{ marginTop: 0 }}>Current lesson</h3>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{lesson.title}</div>
      <div className="xsmall muted">About {lesson.minutes} minutes</div>
      <h3>Learning objectives</h3>
      <ul style={{ paddingLeft: 18, margin: 0 }}>{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
      {session.mode === 'practice' && (
        <>
          <h3>Your objective</h3>
          <div className="tcard small">{lesson.practiceObjective}</div>
        </>
      )}
      <h3>Steps</h3>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {lesson.steps.map((st) => {
          const done = session.completedSteps.includes(st.id);
          return (
            <li key={st.id} style={{ display: 'flex', gap: 8, margin: '6px 0' }}>
              {done ? <CheckmarkCircleRegular color="var(--success)" aria-hidden /> : <CircleRegular color="var(--text-3)" aria-hidden />}
              <span>{st.title}<span className="sr-only">{done ? ' — done' : ' — not done'}</span></span>
            </li>
          );
        })}
      </ol>
      {showNotes && (
        <>
          <h3>Speaker notes</h3>
          <ul style={{ paddingLeft: 18, margin: 0 }}>{lesson.speakerNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        </>
      )}
      <h3>All lessons</h3>
      <div className="stack" style={{ gap: 6 }}>
        {lessons.map((l, i) => (
          <button key={l.id} className="lesson-row" style={{ cursor: 'pointer', textAlign: 'left', borderColor: l.id === lesson.id ? 'var(--train)' : undefined }} onClick={() => { setLesson(l.id); setDrawer(null); }}>
            <span>{session.completedLessons.includes(l.id) ? <CheckmarkCircleRegular color="var(--success)" aria-label="Complete" /> : <span className="small muted">{i + 1}</span>}</span>
            <span className="small">{l.title}</span>
            <span className="xsmall muted">{l.minutes} min</span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}

export function FacilitatorDrawer() {
  const f = useLab((s) => s.facilitator);
  const current = useLab((s) => s.session.lessonId);
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <Drawer title="Facilitator controls" id="fac">
      <p className="xsmall muted" style={{ marginTop: 0 }}>A local demonstration tool for trainers. It is not an authenticated admin area or a security boundary.</p>
      <h3>Jump to a lesson (known starting state)</h3>
      <div className="stack" style={{ gap: 6 }}>
        {lessons.map((l, i) => (
          <div key={l.id} className="lesson-row">
            <span className="small muted">{i + 1}</span>
            <span className="small">{l.title}{l.id === current && <span className="tpill" style={{ marginLeft: 6 }}>current</span>}</span>
            <Button size="small" onClick={() => loadLessonState(l.id)}>Load</Button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <Button icon={<ArrowCounterclockwiseRegular />} onClick={restartExercise}>Restart current scenario</Button>
      </div>

      <h3>Simulation speed</h3>
      <RadioGroup value={f.speed} onChange={(_, d) => setFacilitator('speed', d.value as Speed)} aria-label="Simulation speed" layout="horizontal">
        <Radio value="instant" label="Instant" />
        <Radio value="fast" label="Fast" />
        <Radio value="normal" label="Normal" />
        <Radio value="realistic" label="Realistic" />
      </RadioGroup>

      <h3>Failure scenarios</h3>
      <Switch checked={f.failures.connectorOnce} onChange={(_, d) => armFailure('connectorOnce', d.checked)} label={`Next email send fails once (connector timeout)${f.failures.connectorOnce && f.consumed.connector ? ' — already used, toggle to re-arm' : ''}`} />
      <Switch checked={f.failures.missingSource} onChange={(_, d) => armFailure('missingSource', d.checked)} label={`Steering notes become inaccessible when added as knowledge${f.failures.missingSource && f.consumed.missingSource ? ' — already used' : ''}`} />
      <p className="xsmall muted">Other failure branches are built into the scenario: restricted Finance file, superseded tracker, ambiguous recipients and the Thursday 10:00 calendar conflict.</p>

      <h3>Presentation</h3>
      <Switch checked={f.showNotes} onChange={(_, d) => setFacilitator('showNotes', d.checked)} label="Show speaker notes (in the Lesson panel)" />
      <Switch checked={f.hideHints} onChange={(_, d) => setFacilitator('hideHints', d.checked)} label="Hide learning hints during a demonstration" />
      <div style={{ marginTop: 8 }}>
        <div className="small" id="ts-label" style={{ fontWeight: 600 }}>Text size for projection</div>
        <RadioGroup value={String(f.textScale)} onChange={(_, d) => setFacilitator('textScale', Number(d.value) as 1 | 1.15 | 1.3)} aria-labelledby="ts-label" layout="horizontal">
          <Radio value="1" label="100%" />
          <Radio value="1.15" label="115%" />
          <Radio value="1.3" label="130%" />
        </RadioGroup>
      </div>

      <h3>Data</h3>
      {!confirmReset ? (
        <Button onClick={() => setConfirmReset(true)}>Reset all training data…</Button>
      ) : (
        <div className="tcard small">
          This clears every agent, task, output and progress record on this device.
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button size="small" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button size="small" appearance="primary" onClick={() => { setConfirmReset(false); setDrawer(null); resetAll(); }}>Reset everything</Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export function InfoDrawer() {
  return (
    <Drawer title="About this training" id="info">
      <div className="tcard" style={{ marginBottom: 12 }}>
        <strong>{settings.labels.infoPanel}</strong>
        <p className="small" style={{ margin: '6px 0 0' }}>
          {settings.appName} is an internal training simulation for {settings.organisation.name}. All people, documents, figures and dates are synthetic. No Microsoft sign-in is used, no data leaves this browser, and no email, Teams message or meeting is ever sent or created.
        </p>
      </div>
      <h3>Chat, agents, Cowork and Copilot Studio</h3>
      {EXPERIENCES.map((e) => (
        <p key={e.name} className="small" style={{ margin: '0 0 8px' }}><strong>{e.name}:</strong> {e.use}</p>
      ))}
      <h3>Key terms</h3>
      {Object.values(GLOSSARY).map((g) => <p key={g.term} className="small" style={{ margin: '0 0 8px' }}><strong>{g.term}:</strong> {g.text}</p>)}
      <h3>What is simulated</h3>
      <p className="small">Answers come from a deterministic simulator that reads your agent's instructions and knowledge sources — not from a live AI model. Layouts follow Microsoft documentation reviewed on the dates below; where no screenshot was available, the layout is an approximation. The facilitator guide lists which behaviours are verified and which are training additions.</p>
      <h3>References reviewed</h3>
      <ul className="small" style={{ paddingLeft: 18 }}>
        {REFERENCES.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> — reviewed {r.reviewed}</li>)}
      </ul>
      <h3>Your data</h3>
      <p className="small">Progress is stored in this browser's local storage under "{settings.storageKey}". Use Reset all training data (Facilitator mode or the Welcome page) to clear it.</p>
    </Drawer>
  );
}
