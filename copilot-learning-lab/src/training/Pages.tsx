import { useState } from 'react';
import { Button, Textarea } from '@fluentui/react-components';
import {
  BeakerRegular,
  SparkleFilled,
  CheckmarkCircleRegular,
  CircleRegular,
  ArrowDownloadRegular,
  WarningRegular,
  StarFilled,
  StarRegular,
  PlayRegular,
  LightbulbRegular,
  TargetArrowRegular,
  PersonBoardRegular,
} from '@fluentui/react-icons';
import { useShallow } from 'zustand/react/shallow';
import { settings } from '../config/settings';
import { lab, mutate, useLab, type Mode } from '../state/store';
import { navigate } from '../state/router';
import { completePractice, resetAll, setLesson, startPractice, startSession } from '../state/trainingActions';
import { download } from '../engine/exports';
import { logDownload } from '../state/uiActions';
import { lessons, allSteps } from './lessons';
import { evaluateSkills, type SkillResult } from './feedback';
import { practiceById, practiceExercises } from './practice';
import { fmtDate } from '../lib/util';
import { useDock } from './dock';

const MODE_ICONS: Record<Mode, React.ReactNode> = { guided: <LightbulbRegular fontSize={20} />, practice: <TargetArrowRegular fontSize={20} />, facilitator: <PersonBoardRegular fontSize={20} /> };

const MODES: { id: Mode; title: string; text: string }[] = [
  { id: 'guided', title: 'Guided', text: 'Step-by-step instructions with a spotlight on the right control. You do each action yourself before moving on.' },
  { id: 'practice', title: 'Practice', text: 'A business objective for each lesson and no constant hints. Ask for a hint whenever you need one.' },
  { id: 'facilitator', title: 'Facilitator', text: 'For trainers: jump between lessons, load starting states, change speed, trigger failures and show speaker notes.' },
];

export function WelcomePage() {
  const session = useLab((s) => s.session);
  const [mode, setModeLocal] = useState<Mode>(session.mode);
  const [confirmReset, setConfirmReset] = useState(false);
  const pct = Math.round((session.completedSteps.filter((id) => allSteps.some((s) => s.id === id)).length / allSteps.length) * 100);
  const resuming = session.started && session.completedSteps.length > 0;

  return (
    <div className="tpage">
      <div className="tpage-inner">
        <div className="welcome-hero">
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="tpill"><BeakerRegular /> {settings.shortName}</span>
              <span className="tpill" style={{ background: '#fff' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: settings.organisation.accentColor, display: 'inline-block' }} /> {settings.organisation.name}</span>
              <span className="tpill" style={{ background: '#fff' }}>{settings.labels.persistent}</span>
            </div>
            <h1>Copilot &amp; Cowork<br /><span className="grad-text">Interactive Learning Lab</span></h1>
            <p className="lede">
              Learn by doing. Build an AI Programme Knowledge Agent, give it approved documents, test its answers and share it with your cohort —
              then delegate the weekly programme update to Cowork, reviewing every output and approving each action yourself.
            </p>
            <div className="stat-row">
              <div className="stat"><b>{lessons.length}</b><span>hands-on lessons</span></div>
              <div className="stat"><b>45 min</b><span>with discussion</span></div>
              <div className="stat"><b>{practiceExercises.length}</b><span>practice exercises</span></div>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>{settings.labels.infoPanel} You use a sample profile ({settings.learner.displayName}) — no Microsoft sign-in is needed.</p>
          </div>
          <div className="preview-stack" aria-hidden>
            <div className="preview-card" style={{ top: 0, left: 0, transform: 'rotate(-2deg)' }}>
              <div className="pv-head"><span className="agent-icon">AP</span> AI Programme Knowledge Agent</div>
              <div className="small muted">What are the main programme risks this week?</div>
              <div className="pv-line" style={{ width: '92%' }} /><div className="pv-line" style={{ width: '76%' }} /><div className="pv-line" style={{ width: '84%' }} />
            </div>
            <div className="preview-card" style={{ top: 110, right: 0, transform: 'rotate(1.5deg)' }}>
              <div className="pv-head"><span className="ai-avatar"><SparkleFilled fontSize={12} /></span> Cowork · Needs approval</div>
              <div className="small"><b>Send email</b> to Programme Leadership Group</div>
              <div className="pv-line" style={{ width: '88%' }} /><div className="pv-line" style={{ width: '64%' }} />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                <span className="status neutral">Edit</span><span className="status brand">Send</span>
              </div>
            </div>
            <div className="preview-card" style={{ top: 214, left: 24, width: '62%', transform: 'rotate(-1deg)' }}>
              <div className="pv-head" style={{ marginBottom: 4 }}><CheckmarkCircleRegular color="var(--success)" /> Test B: good behaviour</div>
              <div className="xsmall muted">Missing information handled honestly</div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginTop: 28 }}>Choose how you want to learn</h2>
        <div className="grid3" role="group" aria-label="Learning mode">
          {MODES.map((m) => (
            <button key={m.id} className="mode-card" aria-pressed={mode === m.id} onClick={() => setModeLocal(m.id)}>
              <span className="row-between"><span className="mode-icon" aria-hidden>{MODE_ICONS[m.id]}</span>{mode === m.id ? <CheckmarkCircleRegular color="var(--train)" fontSize={20} aria-hidden /> : <CircleRegular color="var(--text-3)" fontSize={20} aria-hidden />}</span>
              <h3>{m.title}</h3>
              <span>{m.text}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="tbutton" style={{ padding: '10px 18px', fontSize: 15 }} onClick={() => startSession(mode)}>
            <PlayRegular /> {resuming ? `Resume session (${pct}% complete)` : 'Start the main journey'}
          </button>
          <button className="tbutton secondary" onClick={() => { mutate((s) => { s.session.started = true; s.session.mode = mode; }); navigate({ name: 'practice' }); }}>Practice exercises</button>
          {resuming && <button className="tbutton secondary" onClick={() => navigate({ name: 'complete' })}>View results so far</button>}
        </div>

        <h2 style={{ fontSize: 18, marginTop: 32 }}>The main journey · about 45 minutes with discussion</h2>
        <div className="stack" style={{ gap: 8 }}>
          {lessons.map((l, i) => {
            const done = session.completedLessons.includes(l.id);
            return (
              <div key={l.id} className="lesson-row">
                <span>{done ? <CheckmarkCircleRegular color="var(--success)" fontSize={24} aria-label="Complete" /> : <span className="lesson-num">{i + 1}</span>}</span>
                <span>
                  <strong className="small">{l.title}</strong>
                  <div className="xsmall muted">{l.objectives[0]}</div>
                </span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="xsmall muted">{l.minutes} min</span>
                  {session.started && <Button size="small" onClick={() => { mutate((s) => { s.session.mode = mode; }); setLesson(l.id); }}>Go to lesson</Button>}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {!confirmReset ? (
            <Button appearance="subtle" onClick={() => setConfirmReset(true)}>Reset all training data</Button>
          ) : (
            <span className="tcard small" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              Clear every agent, task and progress record on this device?
              <Button size="small" onClick={() => setConfirmReset(false)}>Cancel</Button>
              <Button size="small" appearance="primary" onClick={() => { setConfirmReset(false); resetAll(); }}>Reset</Button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillRow({ r }: { r: SkillResult }) {
  return (
    <div className="skill-row">
      <span>{r.status === 'done' ? <CheckmarkCircleRegular color="var(--success)" fontSize={22} aria-label="Demonstrated" /> : r.status === 'partial' ? <WarningRegular color="var(--warning)" fontSize={22} aria-label="Partly demonstrated" /> : <CircleRegular color="var(--text-3)" fontSize={22} aria-label="Not yet demonstrated" />}</span>
      <span>
        <strong className="small">{r.label}</strong>
        <div className="small" style={{ marginTop: 2 }}>{r.feedback}</div>
      </span>
      <span>{r.status !== 'done' && <Button size="small" onClick={() => setLesson(r.lessonId)}>Repeat</Button>}</span>
    </div>
  );
}

function completionRecord(skills: SkillResult[], rating?: number): string {
  const s = lab();
  const done = skills.filter((x) => x.status === 'done');
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Internal training completion record</title>
<style>body{font-family:"Segoe UI",system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#242424}h1{font-size:26px}.badge{display:inline-block;border:1px solid #7cc4ba;background:#eef8f6;color:#075e55;border-radius:999px;padding:2px 10px;font-size:12px}li{margin:4px 0}footer{margin-top:32px;color:#616161;font-size:12px;border-top:1px solid #ddd;padding-top:10px}</style></head><body>
<span class="badge">${esc(settings.labels.certificate)}</span>
<h1>${esc(settings.appName)}</h1>
<p><strong>${esc(settings.learner.displayName)}</strong> (sample profile) · ${esc(settings.organisation.name)} · ${fmtDate(settings.scenario.today)}</p>
<p>Lessons completed: ${s.session.completedLessons.length} of ${lessons.length}. Practice exercises completed: ${s.session.completedPractice.length} of ${practiceExercises.length}.</p>
<h2>Skills demonstrated (${done.length} of ${skills.length})</h2>
<ul>${skills.map((k) => `<li>${k.status === 'done' ? '✔' : k.status === 'partial' ? '◐' : '○'} ${esc(k.label)} — ${esc(k.feedback)}</li>`).join('')}</ul>
${rating ? `<p>Learner rating of the session: ${rating} / 5</p>` : ''}
<footer>${esc(settings.labels.persistent)}. ${esc(settings.labels.infoPanel)} This record is generated from actions taken in the simulation.</footer>
</body></html>`;
}

export function CompletionPage() {
  const state = useLab(useShallow((s) => ({ events: s.events, session: s.session, agents: s.agents, tasks: s.tasks, actions: s.actions, feedback: s.feedback })));
  const skills = evaluateSkills(lab());
  void state;
  const [rating, setRating] = useState(lab().feedback?.rating ?? 0);
  const [comment, setComment] = useState(lab().feedback?.comment ?? '');
  const [saved, setSaved] = useState(!!lab().feedback);
  const done = skills.filter((s) => s.status === 'done');
  const repeat = skills.filter((s) => s.status !== 'done');

  return (
    <div className="tpage">
      <div className="tpage-inner">
        <span className="tpill"><BeakerRegular /> {settings.shortName} · results</span>
        <h1>{done.length === skills.length ? 'Well done — journey complete' : 'Your progress'}</h1>
        <p className="lede">This summary is based on what you actually did in the simulation — not on time spent or pages visited.</p>

        <div className="grid2" style={{ marginTop: 20, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 17 }}>Skills practised ({done.length})</h2>
            <div className="stack" style={{ gap: 8 }}>{done.length ? done.map((r) => <SkillRow key={r.id} r={r} />) : <p className="muted small">None yet.</p>}</div>
          </div>
          <div>
            <h2 style={{ fontSize: 17 }}>Areas to repeat ({repeat.length})</h2>
            <div className="stack" style={{ gap: 8 }}>{repeat.length ? repeat.map((r) => <SkillRow key={r.id} r={r} />) : <p className="small">Nothing to repeat — every skill was demonstrated.</p>}</div>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 28, alignItems: 'start' }}>
          <div className="tcard">
            <strong>Internal training completion record</strong>
            <p className="small">{settings.labels.certificate}. It lists the skills you demonstrated in this simulation.</p>
            <button className="tbutton" onClick={() => { const name = 'learning-lab-completion-record.html'; download({ name, mime: 'text/html', content: completionRecord(skills, rating || undefined) }); logDownload(name); }}>
              <ArrowDownloadRegular /> Download record (.html)
            </button>
          </div>
          <div className="card">
            <h3>How was this session?</h3>
            <div role="radiogroup" aria-label="Rate this session" style={{ display: 'flex', gap: 4, margin: '6px 0 10px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} out of 5`} className="icon-btn" onClick={() => { setRating(n); setSaved(false); }}>
                  {n <= rating ? <StarFilled color="#c19c00" fontSize={22} /> : <StarRegular fontSize={22} />}
                </button>
              ))}
            </div>
            <label className="small" htmlFor="fb">What would make this training more useful?</label>
            <Textarea id="fb" value={comment} onChange={(_, d) => { setComment(d.value); setSaved(false); }} style={{ width: '100%', marginTop: 4 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <Button appearance="primary" disabled={!rating} onClick={() => { mutate((s) => { s.feedback = { rating, comment, at: Date.now() }; }); setSaved(true); }}>Save feedback</Button>
              {saved && <span className="small" role="status">Saved on this device. Your facilitator collects feedback separately.</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          <button className="tbutton" onClick={() => navigate({ name: 'practice' })}>Try the practice exercises</button>
          <button className="tbutton secondary" onClick={() => navigate({ name: 'welcome' })}>Back to the Learning Lab home</button>
        </div>
      </div>
    </div>
  );
}

const PRACTICE_GROUPS = [
  { id: 'core' as const, title: 'Core skills', sub: 'Practise the basics from the main journey on new data.' },
  { id: 'workplace' as const, title: 'Agents your teams will use', sub: 'Agents and Cowork tasks that take repetitive work off staff: policy questions, compliance, onboarding, meeting follow-up, weekly reporting and case triage.' },
];

export function PracticeHub() {
  const completed = useLab((s) => s.session.completedPractice);
  return (
    <div className="tpage">
      <div className="tpage-inner">
        <span className="tpill"><BeakerRegular /> {settings.shortName} · practice</span>
        <h1>Practice exercises</h1>
        <p className="lede">Short exercises that reuse the same Copilot, agent and Cowork screens with new sample data. Start with the core skills, then try the agents and tasks your teams can build for their own work.</p>
        {PRACTICE_GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`pg-${g.id}`} style={{ marginTop: 24 }}>
            <h2 id={`pg-${g.id}`} style={{ fontSize: 18, margin: '0 0 4px' }}>{g.title}</h2>
            <p className="small muted" style={{ margin: '0 0 12px' }}>{g.sub}</p>
            <div className="grid3">
              {practiceExercises.filter((p) => p.group === g.id).map((p) => (
                <div key={p.id} className="card stack" style={{ gap: 8 }}>
                  <div className="row-between">
                    <span className="tpill">{p.surface} · {p.minutes} min</span>
                    {completed.includes(p.id) && <span className="small" style={{ color: 'var(--success)', display: 'flex', gap: 4, alignItems: 'center' }}><CheckmarkCircleRegular /> Completed</span>}
                  </div>
                  <h3 style={{ fontSize: 17 }}>{p.title}</h3>
                  <p className="small" style={{ margin: 0 }}>{p.objective}</p>
                  <div style={{ marginTop: 'auto' }}>
                    <button className="tbutton" onClick={() => startPractice(p.id)} aria-label={`${completed.includes(p.id) ? 'Practise again' : 'Start'}: ${p.title}`}>{completed.includes(p.id) ? 'Practise again' : 'Start'}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div style={{ marginTop: 24 }}>
          <button className="tbutton secondary" onClick={() => navigate({ name: 'welcome' })}>Back to the Learning Lab home</button>
        </div>
      </div>
    </div>
  );
}

/** Docked objective card for an active practice exercise. */
export function PracticePanel() {
  const id = useLab((s) => s.session.practiceId);
  const route = useLab((s) => s.route.name);
  const state = useLab((s) => s);
  const [open, setOpen] = useState(true);
  const [reveal, setReveal] = useState(false);
  const dock = useDock();
  const p = id ? practiceById(id) : undefined;
  if (!p || route === 'welcome' || route === 'complete' || route === 'practice') return null;
  const checks = p.checks.map((c) => ({ ...c, ok: c.done(state) }));

  if (!open || dock.compact) {
    return <button className="tbar-collapsed" style={{ bottom: 60, ...(dock.compact ? { right: 'auto', left: 16 } : {}) }} onClick={() => setOpen(true)}><BeakerRegular /> Practice: {p.title} · {checks.filter((c) => c.ok).length}/{checks.length}</button>;
  }
  return (
    <section className="coach" style={dock.style} aria-label="Practice exercise">
      <div className="head">
        <span>Practice · {p.title}</span>
        <button className="icon-btn" style={{ color: '#fff', width: 24, height: 24 }} aria-label="Minimise" onClick={() => setOpen(false)}>–</button>
      </div>
      <div className="content">
        <p style={{ marginTop: 0 }}><strong>Objective:</strong> {p.objective}</p>
        <p className="small" style={{ margin: '0 0 8px' }}>{p.brief}</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="small">
          {checks.map((c) => (
            <li key={c.label} style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0' }}>
              {c.ok ? <CheckmarkCircleRegular color="var(--success)" aria-hidden /> : <CircleRegular color="var(--text-3)" aria-hidden />}{c.label}<span className="sr-only">{c.ok ? ' — done' : ' — not yet'}</span>
            </li>
          ))}
        </ul>
        {reveal && (
          <div className="hint">
            <strong>Expected results</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{p.expected.map((e) => <li key={e}>{e}</li>)}</ul>
            {p.buildTip && <p style={{ margin: '6px 0 0' }}><strong>Building it for real:</strong> {p.buildTip}</p>}
          </div>
        )}
      </div>
      <div className="foot">
        <button className="tbutton secondary" onClick={() => setReveal((r) => !r)}>{reveal ? 'Hide expected results' : 'Check against expected results'}</button>
        <button className="tbutton" disabled={!checks.every((c) => c.ok)} onClick={() => completePractice(p.id)}>Finish exercise</button>
      </div>
    </section>
  );
}
