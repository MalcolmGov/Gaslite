import { Button } from '@fluentui/react-components';
import { CheckmarkCircleRegular, CircleRegular, WarningRegular, ChatAddRegular } from '@fluentui/react-icons';
import type { Agent, TestCaseId } from '../../engine/model';
import { useLab } from '../../state/store';
import { askAgent, canTry, newTestChat } from '../../state/agentActions';
import { AgentConversation } from '../agent/AgentConversation';
import { Banner } from '../common';

const CASES: { id: TestCaseId; label: string; q: string; why: string }[] = [
  { id: 'A', label: 'Answerable question', q: 'What are the main programme risks this week?', why: 'Expect a concise, cited answer.' },
  { id: 'B', label: 'Missing information', q: 'What budget has leadership approved for next year?', why: 'No source contains this. Expect an honest gap and a next step.' },
  { id: 'C', label: 'Conflicting information', q: 'What is the training completion date?', why: 'Two sources disagree. Expect the conflict to be explained.' },
];

export function TryTab({ agent }: { agent: Agent }) {
  const hideHints = useLab((s) => s.facilitator.hideHints);
  const busy = useLab((s) => !!s.ui.busy[`reply:${agent.id}:try`]);
  if (!canTry(agent)) {
    return <div className="config-wrap"><Banner tone="info">Add a name, description and instructions on the Configure tab to try your agent.</Banner></div>;
  }
  const results = (c: TestCaseId) => agent.testChat.filter((m) => m.testCase === c);

  return (
    <div className="two-col" style={{ height: '100%', alignItems: 'stretch' }}>
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 220px)', overflow: 'hidden' }}>
        <div className="row-between" style={{ padding: '8px 12px', borderBottom: '1px solid var(--stroke)' }}>
          <span className="small muted">Try it — test your agent before you create or update it</span>
          <Button size="small" appearance="subtle" icon={<ChatAddRegular />} onClick={() => newTestChat(agent.id)}>New chat</Button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <AgentConversation agent={agent} conv="try" coaching />
        </div>
      </div>
      {!hideHints && (
        <aside className="side" aria-label="Test checklist">
          <div className="tcard" data-tour="test-cases">
            <div className="row-between" style={{ marginBottom: 8 }}>
              <strong className="small">Test checklist</strong>
              <span className="tpill">Learning Lab</span>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {CASES.map((c) => {
                const runs = results(c.id);
                const last = runs[runs.length - 1];
                const status = !last ? 'not-run' : last.coaching?.verdict === 'good' ? 'good' : 'needs-work';
                return (
                  <div key={c.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--stroke)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {status === 'good' ? <CheckmarkCircleRegular color="var(--success)" aria-hidden /> : status === 'needs-work' ? <WarningRegular color="var(--warning)" aria-hidden /> : <CircleRegular color="var(--text-3)" aria-hidden />}
                      <strong className="small">{c.id}. {c.label}</strong>
                      <span className="xsmall muted" style={{ marginLeft: 'auto' }}>{status === 'good' ? 'Good' : status === 'needs-work' ? 'Needs work' : 'Not run'}{runs.length > 1 ? ` · ${runs.length} runs` : ''}</span>
                    </div>
                    <p className="small" style={{ margin: '6px 0' }}>"{c.q}"</p>
                    <p className="xsmall muted" style={{ margin: '0 0 8px' }}>{c.why}</p>
                    <button className="tbutton secondary" disabled={busy} onClick={() => askAgent(agent.id, c.q, 'try')}>{runs.length ? 'Run again' : 'Run test'}</button>
                  </div>
                );
              })}
            </div>
            <p className="xsmall muted" style={{ margin: '10px 0 0' }}>Feedback describes evidence, clarity and uncertainty. It doesn't score confidence.</p>
          </div>
        </aside>
      )}
    </div>
  );
}
