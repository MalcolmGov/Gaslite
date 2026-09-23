import { useEffect, useLayoutEffect, useState } from 'react';
import { ChevronDownRegular, CheckmarkCircleRegular, LightbulbRegular } from '@fluentui/react-icons';
import { mutate, useLab } from '../state/store';
import { navigate } from '../state/router';
import { nextLesson } from '../state/trainingActions';
import { lessons, type LessonStep } from './lessons';
import { prefersReducedMotion } from '../product/common';
import { useDock } from './dock';

interface Rect { top: number; left: number; width: number; height: number }

const nextLessonTitle = (id: string) => lessons[lessons.findIndex((l) => l.id === id) + 1]?.title;

/** Is the element actually visible — not clipped by a scroll area or covered by a panel? */
function isOnScreen(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  const points: [number, number][] = [
    [r.left + r.width / 2, r.top + r.height / 2],
    [r.left + Math.min(12, r.width / 2), r.top + Math.min(12, r.height / 2)],
  ];
  return points.some(([x, y]) => {
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
    // Ignore the coach card itself, which may sit over its target.
    const hit = document.elementsFromPoint(x, y).find((h) => !h.closest('.coach'));
    return !!hit && (el === hit || el.contains(hit));
  });
}

/** Find the first element for a data-tour target that the learner can actually see. */
function findTarget(target?: string): HTMLElement | null {
  if (!target) return null;
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
  return els.find(isOnScreen) ?? null;
}

function useTargetRect(target?: string, active = true) {
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    if (!active) { setRect(null); return; }
    let raf = 0;
    const measure = () => {
      const el = findTarget(target);
      if (!el) { setRect((r) => (r ? null : r)); return; }
      const r = el.getBoundingClientRect();
      setRect((prev) => (prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.left - r.left) < 1 && prev.width === r.width && prev.height === r.height ? prev : { top: r.top, left: r.left, width: r.width, height: r.height }));
    };
    measure();
    const id = window.setInterval(measure, 400);
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, true);
    return () => { clearInterval(id); window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true); cancelAnimationFrame(raf); };
  }, [target, active]);
  return rect;
}

/**
 * Guided-mode coach mark and spotlight. It highlights the control for the
 * current step without blocking the page; the learner must actually perform
 * the action — the step completes from real application events.
 */
export function Coach() {
  const session = useLab((s) => s.session);
  const route = useLab((s) => s.route);
  const hideHints = useLab((s) => s.facilitator.hideHints);
  const hintOpen = useLab((s) => s.ui.hintOpen);
  const collapsed = useLab((s) => s.ui.coachCollapsed);
  const drawer = useLab((s) => s.ui.drawer);
  const state = useLab((s) => s);

  const lesson = lessons.find((l) => l.id === session.lessonId) ?? lessons[0];
  const idx = lesson.steps.findIndex((st) => !session.completedSteps.includes(st.id));
  const step: LessonStep | undefined = idx >= 0 ? lesson.steps[idx] : undefined;
  const guided = session.mode === 'guided' || session.mode === 'facilitator';
  const showSpot = guided && !hideHints && !!step && !collapsed && !session.practiceId;
  const rect = useTargetRect(step?.target, showSpot || (hintOpen && !!step));
  const [announced, setAnnounced] = useState('');
  const dock = useDock();

  useEffect(() => {
    if (step && step.id !== announced) setAnnounced(step.id);
  }, [step, announced]);

  if (session.practiceId || route.name === 'welcome' || route.name === 'complete' || route.name === 'practice') return null;
  // Practice mode: show the business objective only; step guidance appears when the learner asks for a hint.
  if (!guided && !hintOpen && !hideHints) {
    const lessonDoneP = !step;
    if (collapsed) {
      return (
        <button className="tbar-collapsed" style={{ bottom: 60 }} onClick={() => mutate((s) => { s.ui.coachCollapsed = false; })}>
          <LightbulbRegular /> Objective: {lesson.title}
        </button>
      );
    }
    return (
      <section className="coach" style={dock.style} aria-label="Practice objective">
        <div className="head">
          <span>Practice · {lesson.title}</span>
          <button className="icon-btn" style={{ color: '#fff', width: 24, height: 24 }} aria-label="Minimise objective" onClick={() => mutate((s) => { s.ui.coachCollapsed = true; })}>
            <ChevronDownRegular />
          </button>
        </div>
        <div className="content">
          <p style={{ margin: 0 }}><strong>Objective:</strong> {lesson.practiceObjective}</p>
          <p className="xsmall muted" style={{ margin: '6px 0 0' }}>{lessonDoneP ? 'Objective met.' : `${lesson.steps.filter((st) => session.completedSteps.includes(st.id)).length} of ${lesson.steps.length} checkpoints reached.`}</p>
        </div>
        <div className="foot">
          {lessonDoneP ? (
            <button className="tbutton" onClick={nextLesson}>{nextLessonTitle(lesson.id) ? `Next: ${nextLessonTitle(lesson.id)}` : 'See your results'}</button>
          ) : (
            <button className="tbutton secondary" onClick={() => mutate((s) => { s.ui.hintOpen = true; })}><LightbulbRegular /> Show hint</button>
          )}
        </div>
      </section>
    );
  }
  if (hideHints && !hintOpen) return null;

  const where = step?.where?.(state);
  const elsewhere = where && JSON.stringify({ ...where, tab: undefined }) !== JSON.stringify({ ...route, tab: undefined }) && !rect;
  const lessonDone = !step;
  const nextL = lessons[lessons.findIndex((l) => l.id === lesson.id) + 1];

  // Card position: next to the target when visible; otherwise docked bottom-right.
  let style: React.CSSProperties = dock.style;
  if (rect && !collapsed && !drawer) {
    const w = Math.min(360, window.innerWidth - 24);
    const below = rect.top + rect.height + 12;
    const spaceBelow = window.innerHeight - below;
    const left = Math.max(12, Math.min(window.innerWidth - w - 12, rect.left + rect.width / 2 - w / 2));
    style = spaceBelow > 220 ? { top: below, left } : rect.top > 240 ? { bottom: window.innerHeight - rect.top + 12, left } : { right: 16, bottom: 16 };
  }

  if (collapsed || (dock.compact && !rect)) {
    return (
      <button className="tbar-collapsed" style={{ bottom: 60, ...(dock.compact ? { right: 'auto', left: 16 } : {}) }} onClick={() => mutate((s) => { s.ui.coachCollapsed = false; })}>
        <LightbulbRegular /> {lessonDone ? 'Lesson complete' : `Step ${idx + 1}: ${step?.title}`}
      </button>
    );
  }

  return (
    <>
      {showSpot && rect && (
        <div
          className="spot-ring"
          aria-hidden
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8, transition: prefersReducedMotion() ? 'none' : undefined }}
        />
      )}
      <section className="coach" style={style} aria-label="Learning Lab guidance" aria-live="polite">
        <div className="head">
          <span>{lessonDone ? 'Lesson complete' : `${guided && !hideHints ? 'Guided' : 'Hint'} · Step ${idx + 1} of ${lesson.steps.length}`}</span>
          <button className="icon-btn" style={{ color: '#fff', width: 24, height: 24 }} aria-label="Minimise guidance" onClick={() => mutate((s) => { s.ui.coachCollapsed = true; s.ui.hintOpen = false; })}>
            <ChevronDownRegular />
          </button>
        </div>
        <div className="content">
          {lessonDone ? (
            <>
              <h4 style={{ display: 'flex', gap: 6, alignItems: 'center' }}><CheckmarkCircleRegular color="var(--success)" aria-hidden /> {lesson.title}</h4>
              <p style={{ margin: 0 }}>You've completed every step in this lesson.</p>
            </>
          ) : (
            <>
              <h4>{step!.title}</h4>
              <p style={{ margin: 0 }}>{step!.instruction}</p>
              {(hintOpen || !guided) && <div className="hint"><strong>Hint:</strong> {step!.hint}</div>}
              {elsewhere && <p className="xsmall" style={{ margin: '8px 0 0' }}>This step happens on another screen.</p>}
            </>
          )}
        </div>
        <div className="foot">
          {!lessonDone && !hintOpen && guided && (
            <button className="tbutton secondary" onClick={() => mutate((s) => { s.ui.hintOpen = true; })}><LightbulbRegular /> Show hint</button>
          )}
          {elsewhere && where && <button className="tbutton secondary" onClick={() => navigate(where)}>Take me there</button>}
          {lessonDone && (
            <button className="tbutton" onClick={nextLesson}>{nextL ? `Next: ${nextL.title}` : 'See your results'}</button>
          )}
          {!lessonDone && <span className="xsmall muted" style={{ alignSelf: 'center' }}>Do the step to continue</span>}
        </div>
      </section>
    </>
  );
}
