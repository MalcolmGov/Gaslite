import { describe, expect, it } from 'vitest';
import { answerAsAgent } from './packs';
import { composeInstructions, STARTING_INSTRUCTION, startFromDescription } from './builder';
import { readInstructions } from './instructions';
import type { Agent } from './model';
import { buildZip, crc32 } from '../lib/zip';
import { meetingToIcs, markdownWithFootnotes } from './exports';
import { mainScenario } from './cowork/scenarios';
import { meetingConflicts } from './cowork/common';
import { revise } from './cowork/revise';
import { citationIds } from '../lib/markdown';
import { resolveCitation } from '../scenario/registry';

const EXAMPLE =
  'You support the AI and Automation programme team. Answer using the selected programme documents. Cite the relevant source when making factual claims. Separate confirmed information from assumptions. If the information is missing, say so.';

function agent(over: Partial<Agent> = {}): Agent {
  return {
    id: 'agt_test',
    packId: 'programme',
    name: 'AI Programme Knowledge Agent',
    description: 'Helps the team.',
    instructions: composeInstructions({ audience: 'the AI and Automation programme team', include: 'cite,separate,delivery,training', gaps: 'admit' }),
    knowledge: ['doc_overview', 'doc_tracker38', 'doc_register', 'doc_governance', 'doc_steering'].map((docId) => ({ docId, status: 'ready', addedAt: 0 })),
    onlySpecifiedSources: true,
    starterPrompts: [],
    configVersion: 1,
    status: 'draft',
    owner: 'usr_learner',
    sharing: { entries: [] },
    builder: { stage: 'done', question: 4, answers: {}, messages: [] },
    testChat: [],
    chat: [],
    ...over,
  };
}

describe('builder', () => {
  it('composes the recommended instructions from the brief', () => {
    const text = composeInstructions({ audience: 'the AI and Automation programme team', include: 'cite,separate,delivery', gaps: 'admit' });
    expect(text.startsWith(EXAMPLE)).toBe(true);
    expect(text).toContain('Do not invent dates, budgets, approvals or owners.');
  });
  it('names the agent from the starting instruction', () => {
    expect(startFromDescription(STARTING_INSTRUCTION).patch.name).toBe('AI Programme Knowledge Agent');
  });
  it('explains scope for unrelated agent requests', () => {
    const r = startFromDescription('Create an agent that plans my holiday recipes and shopping');
    expect(r.messages[0].text).toMatch(/training simulation/);
    expect(r.patch.name).toBeUndefined();
  });
});

describe('instructions drive behaviour', () => {
  it('detects the recommended flags', () => {
    const b = readInstructions(agent().instructions);
    expect(b).toMatchObject({ cite: true, admitGaps: true, noInvent: true, flagConflicts: true, estimates: false });
  });
  it('treats "best estimate" as risky and not as admitting gaps', () => {
    const b = readInstructions(composeInstructions({ gaps: 'estimate' }));
    expect(b.estimates).toBe(true);
    expect(b.admitGaps).toBe(false);
  });
});

describe('test case A — answerable', () => {
  it('cites the week 38 tracker', () => {
    const m = answerAsAgent(agent(), 'What are the main programme risks this week?', []);
    expect(m.testCase).toBe('A');
    expect(m.text).toContain('[[c:trk38-risks]]');
    expect(m.coaching?.verdict).toBe('good');
  });
  it('stops relying on a removed source', () => {
    const a = agent();
    a.knowledge = a.knowledge.map((k) => (k.docId === 'doc_tracker38' ? { ...k, status: 'removed' as const } : k));
    const m = answerAsAgent(a, 'What are the main programme risks this week?', []);
    expect(m.text).not.toContain('trk38');
    expect(m.text).toMatch(/can't find a risk register/);
  });
  it('omits citations when instructions no longer ask for them', () => {
    const a = agent({ instructions: agent().instructions.replace('Cite the relevant source when making factual claims. ', '') });
    const m = answerAsAgent(a, 'What are the main programme risks this week?', []);
    expect(citationIds(m.text)).toHaveLength(0);
    expect(m.coaching?.verdict).toBe('needs-work');
  });
});

describe('test case B — missing information', () => {
  it('admits the gap and suggests a next step', () => {
    const m = answerAsAgent(agent(), 'What budget has leadership approved for next year?', []);
    expect(m.testCase).toBe('B');
    expect(m.text).toMatch(/can't find an approved budget/);
    expect(m.text).toMatch(/next step/i);
    expect(m.text).not.toMatch(/likely/);
    expect(m.coaching?.verdict).toBe('good');
  });
  it('invents an estimate when told to guess, and coaching flags it', () => {
    const m = answerAsAgent(agent({ instructions: composeInstructions({ gaps: 'estimate' }) }), 'What budget has leadership approved for next year?', []);
    expect(m.text).toMatch(/likely/);
    expect(m.coaching?.verdict).toBe('needs-work');
  });
});

describe('test case C — conflicting information', () => {
  it('separates the two dates and names the newer source', () => {
    const m = answerAsAgent(agent(), 'What is the training completion date?', []);
    expect(m.text).toMatch(/two different dates/);
    expect(m.text).toContain('[[c:reg-completion]]');
    expect(m.text).toContain('[[c:ovw-milestones]]');
    expect(m.coaching?.verdict).toBe('good');
  });
  it('silently picks the old date without conflict instructions', () => {
    const m = answerAsAgent(agent({ instructions: 'You support the programme team. Cite the relevant source when making factual claims.' }), 'What is the training completion date?', []);
    expect(m.text).toMatch(/31 October 2026/);
    expect(m.coaching?.verdict).toBe('needs-work');
  });
});

describe('follow-ups', () => {
  it.each([
    ['Make the briefing shorter.', 'briefing-short'],
    ['Show the source for this risk.', 'show-source'],
    ['Separate completed work from next steps.', 'briefing-separated'],
    ['Turn this into a leadership-ready summary.', 'briefing-leadership'],
    ['Prepare a short leadership briefing.', 'briefing'],
    ['Which milestones are at risk?', 'milestones'],
    ['What changed in the programme this week?', 'changes'],
    ['Summarise training progress.', 'training-progress'],
    ['What is the capital of France?', 'out-of-scope'],
  ])('%s → %s', (q, intent) => {
    expect(answerAsAgent(agent(), q, []).intent).toBe(intent);
  });
});

describe('citations', () => {
  it('every citation in answers resolves to a real excerpt', () => {
    const qs = ['Prepare a short leadership briefing.', 'What is the training completion date?', 'Turn this into a leadership-ready summary.', 'Which milestones are at risk?'];
    for (const q of qs) {
      for (const id of citationIds(answerAsAgent(agent(), q, []).text)) {
        const r = resolveCitation(id);
        expect(r.section, id).toBeDefined();
      }
    }
  });
});

describe('cowork outputs', () => {
  const task = (files: string[]) =>
    ({
      id: 't',
      scenarioId: 'main',
      title: '',
      prompt: '',
      createdAt: 0,
      status: 'working',
      context: { files, brief: { text: 'brief', agentName: 'Agent', at: 0 } },
      requested: { update: true, email: true, meeting: true, reviewFirst: true },
      answers: { recipients: 'plg', slot: 'thu10' },
      cursor: 0,
      transcript: [],
      artifactIds: [],
      actionIds: [],
      skills: [],
      queued: [],
    }) as never;

  it('uses the stale milestone when the week 35 tracker is attached', () => {
    const md = mainScenario.generate('update', task(['doc_tracker35']), {});
    expect(md).toContain('25 Sep 2026');
    expect(md).toContain('[[c:trk35-milestones]]');
  });
  it('uses the current milestone after replacing the tracker', () => {
    const md = mainScenario.generate('update', task(['doc_tracker38']), {});
    expect(md).toContain('9 Oct 2026');
    expect(md).not.toContain('trk35');
  });
  it('detects the Thursday 10:00 conflict', () => {
    const acts = mainScenario.actions(task(['doc_tracker38']), {});
    const c = meetingConflicts(acts.meeting!);
    expect(c.map((x) => x.personName)).toContain('Thandi Nkosi');
    expect(acts.meeting!.timeZone).toBe('Africa/Johannesburg');
  });
  it('revises deterministically', () => {
    const md = mainScenario.generate('update', task(['doc_tracker38']), {});
    const d = revise('update', md, 'decisions-first');
    expect(d.indexOf('## Decisions requested')).toBeLessThan(d.indexOf('## Summary'));
  });
  it('produces a status CSV with a header row', () => {
    const csv = mainScenario.generate('table', task(['doc_tracker38']), {});
    expect(csv.split('\r\n')[0]).toBe('Workstream,Status,Progress,Owner,Source,Data date');
    expect(csv.split('\r\n')).toHaveLength(7);
  });
});

describe('exports', () => {
  it('builds a valid ICS in SAST', () => {
    const acts = mainScenario.actions({ context: { files: ['doc_tracker38'] }, requested: { update: true, email: true, meeting: true, reviewFirst: true }, answers: { recipients: 'plg', slot: 'thu1130' } } as never, {});
    const ics = meetingToIcs(acts.meeting!, 'x');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART;TZID=Africa/Johannesburg:20260924T113000');
    expect(ics).toContain('TZNAME:SAST');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
  it('turns citation tokens into numbered footnotes', () => {
    const out = markdownWithFootnotes('A [[c:trk38-risks]] B [[c:ovw-budget]] C [[c:trk38-risks]]');
    expect(out).toContain('A [1] B [2] C [1]');
    expect(out).toContain('## Sources');
  });
  it('builds a zip with correct signatures and CRC', () => {
    expect(crc32(new TextEncoder().encode('hello'))).toBe(0x3610a686);
    const z = buildZip([{ name: 'a.txt', content: 'hello' }]);
    const v = new DataView(z.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(z.length - 22, true)).toBe(0x06054b50);
  });
});
