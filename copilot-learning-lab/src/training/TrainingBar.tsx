import { useState } from 'react';
import {
  ArrowCounterclockwiseRegular,
  BeakerRegular,
  BookRegular,
  ChevronUpRegular,
  DoorArrowLeftRegular,
  InfoRegular,
  LightbulbRegular,
  PersonBoardRegular,
} from '@fluentui/react-icons';
import { Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Button } from '@fluentui/react-components';
import { settings } from '../config/settings';
import { mutate, useLab, type Mode } from '../state/store';
import { exitLesson, restartExercise, setMode } from '../state/trainingActions';
import { setDrawer } from '../state/uiActions';
import { lessons, allSteps } from './lessons';
import { practiceById } from './practice';

/**
 * The Learning Lab toolbar. Deliberately styled unlike Microsoft 365
 * (charcoal bar, teal accents) so trainees never mistake it for product UI.
 */
export function TrainingBar() {
  const session = useLab((s) => s.session);
  const drawer = useLab((s) => s.ui.drawer);
  const hintOpen = useLab((s) => s.ui.hintOpen);
  const collapsed = useLab((s) => s.ui.toolbarCollapsed);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const lessonIdx = lessons.findIndex((l) => l.id === session.lessonId);
  const lesson = lessons[lessonIdx] ?? lessons[0];
  const pct = Math.round((session.completedSteps.filter((id) => allSteps.some((s) => s.id === id)).length / allSteps.length) * 100);
  const practice = session.practiceId ? practiceById(session.practiceId) : undefined;

  if (collapsed) {
    return (
      <button className="tbar-collapsed" onClick={() => mutate((s) => { s.ui.toolbarCollapsed = false; })} aria-label="Show Learning Lab toolbar">
        <BeakerRegular /> Learning Lab · {pct}% <span style={{ opacity: .8 }}>· {settings.labels.persistent}</span>
      </button>
    );
  }

  return (
    <div className="tbar" role="region" aria-label="Learning Lab training controls">
      <div className="tbar-brand">
        <span className="flask" aria-hidden><BeakerRegular fontSize={14} /></span>
        {settings.shortName}
        <span className="tbar-org"><span className="dot" aria-hidden />{settings.organisation.name}</span>
      </div>
      <div className="tbar-lesson">
        <span className="title">
          {practice ? <>Practice: <strong>{practice.title}</strong></> : <>{lessonIdx + 1}/{lessons.length} · <strong>{lesson.title}</strong></>}
        </span>
        <span className="tbar-progress" role="progressbar" aria-label="Overall progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></span>
        <span className="xsmall" aria-hidden>{pct}%</span>
      </div>
      <span className="tbar-label">{settings.labels.persistent}</span>
      <label className="sr-only" htmlFor="mode-select">Learning mode</label>
      <select id="mode-select" className="tbar-mode" value={session.mode} onChange={(e) => setMode(e.target.value as Mode)}>
        <option value="guided">Guided</option>
        <option value="practice">Practice</option>
        <option value="facilitator">Facilitator</option>
      </select>
      <div className="tbar-actions">
        <button className="tbar-btn" aria-pressed={drawer === 'lesson'} onClick={() => setDrawer('lesson')}><BookRegular /> <span className="lbl">Lesson</span></button>
        <button className="tbar-btn" aria-pressed={hintOpen} onClick={() => mutate((s) => { s.ui.hintOpen = !s.ui.hintOpen; s.ui.coachCollapsed = false; })}><LightbulbRegular /> <span className="lbl">Show hint</span></button>
        <button className="tbar-btn" onClick={() => setConfirmRestart(true)}><ArrowCounterclockwiseRegular /> <span className="lbl">Restart exercise</span></button>
        {session.mode === 'facilitator' && (
          <button className="tbar-btn" aria-pressed={drawer === 'facilitator'} onClick={() => setDrawer('facilitator')}><PersonBoardRegular /> <span className="lbl">Facilitator</span></button>
        )}
        <button className="tbar-btn" aria-pressed={drawer === 'info'} onClick={() => setDrawer('info')} aria-label="About this training"><InfoRegular /></button>
        <button className="tbar-btn" onClick={exitLesson}><DoorArrowLeftRegular /> <span className="lbl">Exit lesson</span></button>
        <button className="tbar-btn" onClick={() => mutate((s) => { s.ui.toolbarCollapsed = true; })} aria-label="Collapse toolbar"><ChevronUpRegular /></button>
      </div>

      {confirmRestart && (
        <Dialog open onOpenChange={(_, d) => { if (!d.open) setConfirmRestart(false); }}>
          <DialogSurface style={{ maxWidth: 480, borderTop: '4px solid var(--train)' }}>
            <DialogBody>
              <DialogTitle>Restart this exercise?</DialogTitle>
              <DialogContent>
                {practice
                  ? `This restarts the "${practice.title}" practice exercise from its starting state.`
                  : `This loads the known starting state for "${lesson.title}". Work from this lesson onwards is cleared; earlier lessons stay complete.`}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmRestart(false)}>Keep going</Button>
                <Button appearance="primary" onClick={() => { setConfirmRestart(false); restartExercise(); }}>Restart</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
}
