// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lab, initialState, useLab, mutate } from './store';
import {
  acceptPlan,
  answerTaskQuestion,
  approveAction,
  cancelAction,
  cancelTask,
  createReadyTask,
  editAction,
  pauseTask,
  recoverAfterReload,
  regenerateAffected,
  replaceTaskFile,
  resumeTask,
  retryAction,
  startTask,
} from './coworkActions';
import { MAIN_PROMPT } from '../engine/cowork/scenarios';
import { runSynchronously, cancelAll } from '../lib/scheduler';

function runToApprovals() {
  const id = createReadyTask('main', MAIN_PROMPT, ['doc_tracker35'], { text: 'brief', agentName: 'Agent', at: 0 });
  runSynchronously(() => {
    startTask(id, MAIN_PROMPT, ['doc_tracker35']);
    acceptPlan(id);
    answerTaskQuestion(id, 'recipients', 'plg');
    answerTaskQuestion(id, 'slot', 'thu10');
  });
  return id;
}
const actionsOf = (id: string) => lab().tasks[id].actionIds.map((a) => lab().actions[a]);
const email = (id: string) => actionsOf(id).find((a) => a.kind === 'email')!;
const meeting = (id: string) => actionsOf(id).find((a) => a.kind === 'meeting')!;

beforeEach(() => {
  cancelAll();
  useLab.setState(() => initialState());
  mutate((s) => { s.facilitator.failures.connectorOnce = false; });
});

describe('Cowork task flow', () => {
  it('pauses for approval and executes nothing without it', () => {
    const id = runToApprovals();
    expect(lab().tasks[id].status).toBe('needs_approval');
    expect(actionsOf(id).map((a) => a.state)).toEqual(['needs_approval', 'needs_approval']);
    expect(lab().mailbox).toHaveLength(0);
    expect(lab().calendar).toHaveLength(0);
    expect(lab().tasks[id].artifactIds.length).toBe(4);
  });

  it('a rejected (cancelled) action never executes', () => {
    const id = runToApprovals();
    runSynchronously(() => cancelAction(email(id).id));
    expect(email(id).state).toBe('cancelled');
    expect(lab().mailbox).toHaveLength(0);
  });

  it('sends exactly once after approval', () => {
    const id = runToApprovals();
    runSynchronously(() => approveAction(email(id).id));
    expect(email(id).state).toBe('done');
    expect(lab().mailbox).toHaveLength(1);
    // A second approval attempt is a no-op.
    runSynchronously(() => approveAction(email(id).id));
    expect(lab().mailbox).toHaveLength(1);
  });

  it('retry after a connector failure does not duplicate', () => {
    mutate((s) => { s.facilitator.failures.connectorOnce = true; s.facilitator.consumed = {}; });
    const id = runToApprovals();
    runSynchronously(() => approveAction(email(id).id));
    expect(email(id).state).toBe('failed');
    expect(lab().tasks[id].status).toBe('failed');
    expect(lab().mailbox).toHaveLength(0);
    runSynchronously(() => retryAction(email(id).id));
    expect(email(id).state).toBe('done');
    runSynchronously(() => retryAction(email(id).id));
    expect(lab().mailbox).toHaveLength(1);
    expect(lab().events.some((e) => e.type === 'error_recovered')).toBe(true);
  });

  it('editing after approval requires fresh approval', () => {
    vi.useFakeTimers();
    const id = runToApprovals();
    approveAction(email(id).id); // queued, not yet executed
    expect(email(id).state).toBe('queued');
    const e = email(id).email!;
    editAction(email(id).id, { email: { ...e, subject: e.subject + ' (revised)' } });
    expect(email(id).state).toBe('needs_approval');
    expect(email(id).changedAfterApproval).toBe(true);
    vi.advanceTimersByTime(10000);
    expect(lab().mailbox).toHaveLength(0);
    vi.useRealTimers();
  });

  it('refresh recovery pauses work and never re-sends', () => {
    vi.useFakeTimers();
    const id = runToApprovals();
    runSynchronously(() => approveAction(meeting(id).id));
    approveAction(email(id).id); // queued at the moment of "refresh"
    cancelAll(); // timers do not survive a reload
    recoverAfterReload();
    expect(email(id).state).toBe('needs_approval');
    expect(meeting(id).state).toBe('done');
    expect(lab().calendar).toHaveLength(1);
    recoverAfterReload();
    expect(lab().calendar).toHaveLength(1);
    vi.useRealTimers();
  });

  it('working tasks become paused after refresh and resume safely', () => {
    vi.useFakeTimers();
    const id = createReadyTask('main', MAIN_PROMPT, ['doc_tracker38']);
    startTask(id, MAIN_PROMPT, ['doc_tracker38']);
    expect(lab().tasks[id].status).toBe('working');
    cancelAll();
    recoverAfterReload();
    expect(lab().tasks[id].status).toBe('paused');
    expect(lab().tasks[id].statusNote).toMatch(/refreshed/);
    runSynchronously(() => resumeTask(id));
    expect(lab().tasks[id].status).toBe('needs_input'); // plan card
    vi.useRealTimers();
  });

  it('hard pause stops pending work', () => {
    vi.useFakeTimers();
    const id = createReadyTask('main', MAIN_PROMPT, ['doc_tracker38']);
    startTask(id, MAIN_PROMPT, ['doc_tracker38']);
    pauseTask(id, 'hard');
    const cursor = lab().tasks[id].cursor;
    vi.advanceTimersByTime(20000);
    expect(lab().tasks[id].cursor).toBe(cursor);
    expect(lab().tasks[id].status).toBe('paused');
    vi.useRealTimers();
  });

  it('cancel keeps completed actions and stops pending ones', () => {
    const id = runToApprovals();
    runSynchronously(() => approveAction(email(id).id));
    runSynchronously(() => cancelTask(id));
    expect(email(id).state).toBe('done');
    expect(meeting(id).state).toBe('cancelled');
    expect(lab().tasks[id].statusNote).toMatch(/Already completed before cancelling: the email/);
    expect(lab().calendar).toHaveLength(0);
  });

  it('replacing the stale tracker regenerates outputs and resets approval', () => {
    const id = runToApprovals();
    const upd = () => lab().tasks[id].artifactIds.map((a) => lab().artifacts[a]).find((a) => a.key === 'update')!;
    expect(upd().versions[0].content).toContain('25 Sep 2026');
    replaceTaskFile(id, 'doc_tracker35', 'doc_tracker38');
    expect(upd().stale).toBe(true);
    runSynchronously(() => regenerateAffected(id));
    expect(upd().versions[upd().current].content).toContain('9 Oct 2026');
    expect(email(id).email!.body).toContain('9 Oct 2026');
    expect(lab().events.some((e) => e.type === 'stale_corrected')).toBe(true);
  });

  it('completes after all actions are resolved', () => {
    const id = runToApprovals();
    runSynchronously(() => { approveAction(email(id).id); cancelAction(meeting(id).id); });
    expect(lab().tasks[id].status).toBe('completed');
    expect(lab().tasks[id].artifactIds.map((a) => lab().artifacts[a].key)).toContain('summary');
  });
});
