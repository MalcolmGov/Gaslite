// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { lab, initialState, useLab } from './store';
import { answerTaskQuestion, createReadyTask, startTask } from './coworkActions';
import { startPractice } from './trainingActions';
import { scenarios, detectScenario } from '../engine/cowork/scenarios';
import { answerAsAgent } from '../engine/packs';
import { practiceExercises } from '../training/practice';
import { runSynchronously, cancelAll } from '../lib/scheduler';
import type { ScenarioId } from '../engine/model';

beforeEach(() => {
  cancelAll();
  useLab.setState(() => initialState());
});

function run(scenario: ScenarioId, answer: string) {
  const sc = scenarios[scenario];
  const id = createReadyTask(scenario, sc.defaultPrompt, sc.defaultFiles);
  const qid = sc.steps(lab().tasks[id]).find((s) => s.kind === 'question');
  runSynchronously(() => {
    startTask(id, sc.defaultPrompt, sc.defaultFiles);
    if (qid && 'id' in qid) answerTaskQuestion(id, qid.id, answer);
  });
  const t = lab().tasks[id];
  const art = (key: string) => t.artifactIds.map((a) => lab().artifacts[a]).find((a) => a.key === key)!;
  const actions = t.actionIds.map((a) => lab().actions[a]);
  return { t, art, actions };
}

describe('workplace practice agents', () => {
  const agentFor = (id: string) => {
    startPractice(id as never);
    return Object.values(lab().agents).find((a) => a.packId === id)!;
  };
  const ask = (id: string, q: string) => {
    const a = agentFor(id);
    return answerAsAgent(a, q, []);
  };

  it('answers routine procedure questions with a citation', () => {
    const r = ask('procedures', 'How long do I have to submit an expense claim?');
    expect(r.testCase).toBe('A');
    expect(r.text).toContain('60 days');
    expect(r.sources).toContain('proc-claims');
  });

  it('routes procedure exceptions instead of answering them', () => {
    expect(ask('procedures', 'Can I claim my gym membership?').intent).toBe('procedures-gap');
    const late = ask('procedures', 'My claim is late because I was on leave, is that OK?');
    expect(late.intent).toBe('procedures-gap');
    expect(late.text).toMatch(/can't approve or interpret/);
  });

  it('keeps "app" questions from matching "approve"', () => {
    expect(ask('procedures', 'Who approves a R40,000 purchase?').intent).toBe('proc-authority');
  });

  it('compliance agent cites timelines and escalates unusual cases', () => {
    expect(ask('compliance', 'How quickly must we resolve a customer complaint?').text).toContain('15 business days');
    expect(ask('compliance', 'What does a customer need for a Tier 2 wallet?').sources).toContain('cmp-kyc');
    const gap = ask('compliance', 'Can we onboard a customer with an expired passport?');
    expect(gap.intent).toBe('compliance-gap');
    expect(gap.text).toContain('Compliance mailbox');
  });

  it('onboarding agent answers first-week questions and sends pay questions to HR', () => {
    expect(ask('onboarding', 'What time should I arrive on my first day?').text).toContain('08:30');
    expect(ask('onboarding', 'What does KYC mean?').intent).toBe('onb-glossary');
    const pay = ask('onboarding', 'When is payday?');
    expect(pay.intent).toBe('onboarding-gap');
    expect(pay.text).toContain('Zanele Mthembu');
  });

  it('every practice exercise has an agent or a scenario to start', () => {
    for (const p of practiceExercises) expect(!!p.agent || !!p.scenario).toBe(true);
  });
});

describe('workplace Cowork scenarios', () => {
  it('meeting to actions: reassigned owner, parked idea, one approval', () => {
    const { t, art, actions } = run('actions', 'all');
    const content = art('actions').versions[0].content;
    expect(content).toMatch(/communications plan[^|]*\| Lerato Dlamini/);
    expect(content).not.toMatch(/communications plan[^|]*\| Sipho/);
    expect(content).toMatch(/## Parked[\s\S]*WhatsApp chatbot/);
    expect(content.split('## Parked')[0]).not.toContain('WhatsApp');
    expect(t.status).toBe('needs_approval');
    expect(actions).toHaveLength(1);
    expect(actions[0].email!.to.map((r) => r.name)).toEqual(['Johan van Wyk', 'Sipho Mahlangu', 'Lerato Dlamini', 'Kwame Mensah']);
    expect(lab().mailbox).toHaveLength(0);
  });

  it('weekly status: lower-is-better KPIs, stale data and provisional figures', () => {
    const { art } = run('status', 'label');
    const report = art('status').versions[0].content;
    const off = report.split('## Off target')[1].split('## On target')[0];
    expect(off).toContain('New wallet sign-ups');
    expect(off).toContain('Transaction success rate');
    expect(off).toContain('Average complaint resolution');
    expect(off).not.toContain('App store rating');
    expect(report).toContain('3 of 5 KPIs assessed');
    expect(report).toMatch(/App store rating\*\* was not updated/);
    expect(report).toContain('Fraud losses (R thousand) (provisional)');
    expect(art('table').versions[0].content.split('\r\n')).toHaveLength(7);
  });

  it('weekly status can leave provisional figures out', () => {
    const { art } = run('status', 'omit');
    expect(art('status').versions[0].content).not.toContain('(provisional)');
    expect(art('table').versions[0].content).not.toContain('Fraud losses');
  });

  it('case triage: P1s, no PIN anywhere, escalation to Risk', () => {
    const { art, actions } = run('triage', 'yes');
    const sheet = art('triage').versions[0].content;
    const p1 = sheet.split('\n').filter((l) => l.includes('| P1 |')).map((l) => l.split('|')[1].trim());
    expect(p1.sort()).toEqual(['C-2201', 'C-2204', 'C-2205']);
    for (const key of ['triage', 'reply', 'escalation']) expect(art(key).versions[0].content).not.toContain('4821');
    expect(actions[0].email!.to[0].name).toBe('Aisha Patel');
    expect(actions[0].email!.body).not.toContain('4821');
  });

  it('case triage without escalation creates no email', () => {
    const { t, actions } = run('triage', 'no');
    expect(actions).toHaveLength(0);
    expect(t.artifactIds.map((a) => lab().artifacts[a].key)).not.toContain('escalation');
  });

  it('detects the new scenarios from attached files', () => {
    expect(detectScenario('help', ['doc_sync_transcript'])).toBe('actions');
    expect(detectScenario('help', ['doc_kpi_scorecard'])).toBe('status');
    expect(detectScenario('help', ['doc_case_queue'])).toBe('triage');
    expect(detectScenario('Draft the weekly leadership update from the tracker', ['doc_tracker35'])).toBe('main');
  });
});

describe('model choice and cost', () => {
  it('General models cost the same per answer; Deep adds reasoning tokens', async () => {
    const { estimateCredits } = await import('../engine/models');
    const base = { licensedUsers: 20, unlicensedUsers: 100, questionsPerDay: 3, grounding: true };
    const general = estimateCredits({ ...base, tier: 'General' });
    expect(general.perAnswer).toEqual([12, 12]);
    expect(general.monthly).toEqual([12 * 100 * 3 * 22, 12 * 100 * 3 * 22]);
    expect(general.includedAnswers).toBe(20 * 3 * 22);
    expect(estimateCredits({ ...base, tier: 'Deep' }).perAnswer).toEqual([27, 27]);
    expect(estimateCredits({ ...base, tier: 'Auto' }).perAnswer).toEqual([12, 27]);
    expect(estimateCredits({ ...base, tier: 'General', grounding: false }).perAnswer).toEqual([2, 2]);
    expect(estimateCredits({ ...base, tier: 'General', unlicensedUsers: 0 }).monthly).toEqual([0, 0]);
  });

  it('the model exercise completes only for a GA General model, and restarting clears it', async () => {
    const { setAgentModel } = await import('./agentActions');
    const { practiceById } = await import('../training/practice');
    const p = practiceById('models')!;
    startPractice('models');
    const agent = Object.values(lab().agents).find((a) => a.packId === 'procedures')!;
    const modelCheck = p.checks[2];
    setAgentModel(agent.id, 'gpt-5-reasoning');
    expect(modelCheck.done(lab())).toBe(false);
    setAgentModel(agent.id, 'gpt-5-auto');
    expect(modelCheck.done(lab())).toBe(false);
    setAgentModel(agent.id, 'gpt-5.5-chat');
    expect(modelCheck.done(lab())).toBe(true);
    startPractice('models');
    expect(lab().agents[agent.id].model).toBeUndefined();
  });
});
