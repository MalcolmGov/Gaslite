import { useRef, useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components';
import type { Agent } from '../../engine/model';
import { MODELS, TIERS, estimateCredits, modelById, RATES, type ModelTier } from '../../engine/models';
import { setAgentModel } from '../../state/agentActions';
import { logEvent, mutate } from '../../state/store';
import { Banner, StatusBadge } from '../common';

const MANAGED = 'managed';
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const range = ([a, b]: [number, number]) => (a === b ? fmt(a) : `${fmt(a)}–${fmt(b)}`);

/**
 * Simulated Copilot Studio step: choose an agent's primary model and estimate
 * what it costs. Agent Builder itself has no model picker.
 */
export function ModelDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [choice, setChoice] = useState(agent.model ?? MANAGED);
  const [licensed, setLicensed] = useState(20);
  const [unlicensed, setUnlicensed] = useState(100);
  const [perDay, setPerDay] = useState(3);
  const [grounding, setGrounding] = useState(true);
  const logged = useRef(false);

  const selected = modelById(choice);
  const tier: ModelTier = selected?.tier ?? 'General';
  const est = estimateCredits({ tier, licensedUsers: licensed, unlicensedUsers: unlicensed, questionsPerDay: perDay, grounding });

  const touchEstimate = () => {
    if (logged.current) return;
    logged.current = true;
    mutate((s) => logEvent(s, 'cost_estimated', { agentId: agent.id }));
  };
  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { set(Math.max(0, Number(e.target.value) || 0)); touchEstimate(); };

  const save = () => { setAgentModel(agent.id, choice === MANAGED ? undefined : choice); onClose(); };

  return (
    <Dialog open onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: 780 }}>
        <DialogBody>
          <DialogTitle>
            Choose a model for {agent.name || 'this agent'} <span className="tpill" style={{ marginLeft: 6 }}>Copilot Studio · simulated</span>
          </DialogTitle>
          <DialogContent>
            <div className="stack" style={{ gap: 12 }}>
              <Banner tone="info" title="Agent Builder doesn't offer a model choice.">
                Microsoft picks and updates the model for Agent Builder agents. To choose one, the agent is managed in Copilot Studio. This lab simulates that step: answers here don't change with the model, but in real use quality, speed and cost do.
              </Banner>

              <fieldset className="model-list">
                <legend className="field-label">Primary model</legend>
                <label className={`model-opt ${choice === MANAGED ? 'on' : ''}`}>
                  <input type="radio" name="model" value={MANAGED} checked={choice === MANAGED} onChange={() => setChoice(MANAGED)} />
                  <span className="mo-main">
                    <strong>Managed by Microsoft</strong>
                    <span className="xsmall muted">What Agent Builder uses. No choice, no admin setup.</span>
                  </span>
                </label>
                {(['General', 'Auto', 'Deep'] as ModelTier[]).map((t) => (
                  <div key={t} role="group" aria-label={`${t} models`}>
                    <div className="model-tier">
                      <strong>{t}</strong>
                      <span className="xsmall muted">{TIERS[t].bestFor} · Speed: {TIERS[t].speed} · Cost: {TIERS[t].cost}</span>
                    </div>
                    {MODELS.filter((m) => m.tier === t).map((m) => (
                      <label key={m.id} className={`model-opt ${choice === m.id ? 'on' : ''}`}>
                        <input type="radio" name="model" value={m.id} checked={choice === m.id} onChange={() => setChoice(m.id)} />
                        <span className="mo-main">
                          <strong>{m.name}</strong>
                          <span className="xsmall muted">{m.provider}</span>
                        </span>
                        <span className="mo-tags">
                          {m.release === 'Default' && <StatusBadge tone="success">Default</StatusBadge>}
                          {m.release === 'Preview' && <StatusBadge tone="warning">Preview</StatusBadge>}
                          {m.external && <StatusBadge tone="neutral">External · admin must allow</StatusBadge>}
                          {m.crossGeo && <StatusBadge tone="neutral">Cross-geo</StatusBadge>}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </fieldset>

              {selected?.release === 'Preview' && (
                <Banner tone="warning" title="Preview model.">Microsoft doesn't support preview models for production use. Quality, speed and availability can change.</Banner>
              )}
              {selected?.external && (
                <Banner tone="warning" title="Needs admin approval.">
                  An admin must allow {selected.provider} in the Microsoft 365 admin center and turn on external models in the Power Platform admin center. {selected.provider} models are hosted outside Microsoft, under {selected.provider}'s terms.
                </Banner>
              )}
              {selected?.crossGeo && (
                <Banner tone="warning" title="Data may leave South Africa.">
                  This model is listed as cross-geo for South Africa. Ask Compliance to review it, including POPIA, before the agent handles personal or customer data.
                </Banner>
              )}

              <section className="card" style={{ boxShadow: 'none' }} aria-labelledby="cost-h">
                <h3 id="cost-h" style={{ marginTop: 0 }}>Estimate the monthly cost</h3>
                <div className="cost-inputs">
                  <label>Staff with a Microsoft 365 Copilot licence<input className="input" type="number" min={0} value={licensed} onChange={num(setLicensed)} /></label>
                  <label>Staff without the licence<input className="input" type="number" min={0} value={unlicensed} onChange={num(setUnlicensed)} /></label>
                  <label>Questions per person per day<input className="input" type="number" min={0} value={perDay} onChange={num(setPerDay)} /></label>
                </div>
                <Checkbox checked={grounding} onChange={(_, d) => { setGrounding(!!d.checked); touchEstimate(); }} label="Answers search organisation-wide Microsoft 365 data (tenant graph grounding)" />
                <div className="cost-out" aria-live="polite">
                  <div><span className="xsmall muted">Licensed staff</span><b>Included</b><span className="xsmall">{fmt(est.includedAnswers)} answers a month, within fair-use limits</span></div>
                  <div><span className="xsmall muted">Staff without the licence</span><b>{range(est.monthly)} credits</b><span className="xsmall">a month · {range(est.perAnswer)} per answer</span></div>
                </div>
                <p className="xsmall muted" style={{ margin: '8px 0 0' }}>
                  Copilot Credits, 22 working days. {RATES.generativeAnswer} per generated answer{grounding ? ` + ${RATES.tenantGraphGrounding} for organisation-wide search` : ''}
                  {tier !== 'General' ? ` + ${RATES.premiumPer1kTokens} per 1,000 reasoning tokens (assumed 1,500 per answer${tier === 'Auto' ? ', only when Auto routes to reasoning' : ''})` : ''}.
                  Rates from Microsoft Learn, reviewed 23 Sep 2026. Check your own agreement before budgeting.
                </p>
              </section>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button appearance="primary" onClick={save}>Use this model</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

/** Short label for where an agent's model comes from. */
export function modelLabel(agent: Agent): string {
  const m = modelById(agent.model);
  return m ? `${m.name} · ${m.tier}` : 'Managed by Microsoft';
}
