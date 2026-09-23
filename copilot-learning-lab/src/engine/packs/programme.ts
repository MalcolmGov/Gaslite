import { getDoc, tableRows } from '../../scenario/registry';
import { fmtDate, normalise } from '../../lib/util';
import type { AgentAnswer, AnswerContext, KnowledgePack } from './types';

/**
 * Knowledge pack for the "AI Programme Knowledge Agent".
 *
 * Answers are composed from the fixture documents the agent can currently use
 * (status "ready"). Removing a source removes its facts from answers.
 * Instruction flags (cite, admitGaps, flagConflicts, concise...) change the
 * shape of the answer so learners can see the effect of their configuration.
 */

const T38 = 'doc_tracker38';
const T35 = 'doc_tracker35';
const OVW = 'doc_overview';
const REG = 'doc_register';
const GOV = 'doc_governance';
const STC = 'doc_steering';

interface Ctx extends AnswerContext {
  has: (id: string) => boolean;
}

/** Which tracker is available, preferring the current one. */
function tracker(c: Ctx): { id: string; stale: boolean } | null {
  if (c.has(T38)) return { id: T38, stale: false };
  if (c.has(T35)) return { id: T35, stale: true };
  return null;
}

const staleWarning = (c: Ctx) =>
  c.behaviour.flagConflicts || c.behaviour.admitGaps
    ? `\n\n> The only tracker I can use is **Week 35 (28 Aug 2026)**, which is marked as superseded by the Week 38 tracker. These details may be out of date. Add the current tracker as a knowledge source.`
    : '';

function sourcesList(c: Ctx) {
  const names = c.ready.map((id) => getDoc(id)?.title).filter(Boolean);
  return names.length ? names.join(', ') : 'no knowledge sources';
}

function noSources(c: Ctx): AgentAnswer | null {
  if (c.ready.length) return null;
  return {
    intent: 'no-sources',
    text: c.behaviour.admitGaps
      ? `I don't have any programme documents to work from yet. Add knowledge sources such as the **Weekly Delivery Tracker** so I can answer from approved information.`
      : `I don't have programme documents available, so I can't give a grounded answer. Add knowledge sources in the Configure tab.`,
  };
}

// ───────────── intents ─────────────

function risks(c: Ctx): AgentAnswer {
  const t = tracker(c);
  if (!t) {
    return {
      intent: 'risks',
      testCase: 'A',
      text: c.behaviour.admitGaps
        ? `I can't find a risk register in my sources (${sourcesList(c)}). The Weekly Delivery Tracker holds the programme risks — add it as a knowledge source and ask again.`
        : `No risks are listed in the documents I can use.`,
    };
  }
  let text: string;
  if (!t.stale) {
    const rows = tableRows(T38, 'trk38-risks');
    const shown = c.behaviour.concise ? rows.filter((r) => r[2] !== 'Low').slice(0, 2) : rows.filter((r) => r[2] !== 'Low');
    text =
      `The main programme risks in the week 38 tracker (18 Sep 2026) are:\n\n` +
      shown.map((r) => `- **${r[0]} · ${r[2]}:** ${r[1]}. Owner: ${r[3]}. Mitigation: ${r[4].charAt(0).toLowerCase() + r[4].slice(1)}. [[c:trk38-risks]]`).join('\n');
    if (c.has(STC) && !c.behaviour.concise) {
      text += `\n\nTwo of these still need a leadership decision: whether to exclude unlabelled sites from the pilot (R1) and who owns agent content after the pilot (R3). [[c:stc-unresolved]]`;
    }
    const low = rows.find((r) => r[2] === 'Low');
    if (low && !c.behaviour.concise) text += `\n\nThere is also one low-rated risk (${low[0]}: licence data reconciliation).`;
  } else {
    text =
      `The tracker I can use lists these risks:\n\n- **R1 (Medium):** Sensitivity labelling pace. Owner: Aisha Patel. [[c:trk35-risks]]\n- **R2 (Medium):** Training attendance in Operations. Owner: Sipho Mahlangu. [[c:trk35-risks]]` +
      staleWarning(c);
  }
  return { intent: 'risks', testCase: 'A', text };
}

function budget(c: Ctx, q: string): AgentAnswer {
  const future = /(next year|2027|fy ?27|fy2027|coming year|following year)/.test(q);
  const hasOverview = c.has(OVW);
  if (!future) {
    return {
      intent: 'budget-current',
      text: hasOverview
        ? `The FY2026 programme budget was **R6.8 million (sample figure)**, approved in March 2026. [[c:ovw-budget]]`
        : c.behaviour.admitGaps
          ? `None of my sources (${sourcesList(c)}) include budget information.`
          : `I don't have budget details.`,
    };
  }
  // Test case B: the answer is not in any accessible source.
  if (c.behaviour.estimates && hasOverview) {
    return {
      intent: 'budget-next',
      testCase: 'B',
      text: `Leadership approved a programme budget of **R6.8 million** [[c:ovw-budget]], so next year's budget is likely to be similar — roughly R6.8–7.5 million, allowing for growth.`,
    };
  }
  if (c.behaviour.admitGaps) {
    return {
      intent: 'budget-next',
      testCase: 'B',
      text:
        `I can't find an approved budget for next year in my sources.` +
        (hasOverview
          ? ` The AI Programme Overview only states the FY2026 budget and says FY2027 planning is managed by Finance. [[c:ovw-budget]]`
          : ` None of the documents I can use (${sourcesList(c)}) mention the FY2027 budget.`) +
        `\n\n**Suggested next step:** ask the Finance Business Partner (Nomvula Khumalo) or the Programme Director whether an FY2027 budget has been approved. I won't estimate a figure.`,
    };
  }
  if (c.behaviour.noInvent) {
    return {
      intent: 'budget-next',
      testCase: 'B',
      text: `The documents don't state next year's budget.`,
    };
  }
  // No gap handling and no ban on invention: answers a different question.
  return {
    intent: 'budget-next',
    testCase: 'B',
    text: hasOverview
      ? `Leadership approved **R6.8 million** for the programme. [[c:ovw-budget]]`
      : `The programme budget isn't something I have details on, but budgets for similar programmes are usually approved annually by leadership.`,
  };
}

function trainingDate(c: Ctx): AgentAnswer {
  const baseline = c.has(OVW);
  const newer = c.has(REG) ? 'reg' : c.has(T38) ? 't38' : null;
  const newerCite = newer === 'reg' ? '[[c:reg-completion]]' : '[[c:trk38-milestones]]';
  const newerName = newer === 'reg' ? 'Training Attendance Register v3.1 (19 Sep 2026)' : 'Weekly Delivery Tracker, week 38 (18 Sep 2026)';

  if (baseline && newer) {
    if (c.behaviour.flagConflicts) {
      return {
        intent: 'training-date',
        testCase: 'C',
        text:
          `My sources give **two different dates**, so I've kept them separate:\n\n` +
          `- **14 November 2026** — ${newerName}. ${newer === 'reg' ? 'It records a revised date approved by the Programme Director on 17 Sep because of month-end conflicts in Operations.' : 'The tracker points to the Training Attendance Register v3.1.'} ${newerCite}\n` +
          `- **31 October 2026** — AI Programme Overview v2.0 (4 Aug 2026), the original baseline plan. [[c:ovw-milestones]]\n\n` +
          `The newer source is the ${newer === 'reg' ? 'register' : 'tracker'}, so **14 November 2026** is the current date. The overview appears not to have been updated. You may want to ask Thandi Nkosi to update it.`,
      };
    }
    // Silent pick of the first-listed source: the teaching failure.
    return {
      intent: 'training-date',
      testCase: 'C',
      text: `Training is due to be completed by **31 October 2026**. [[c:ovw-milestones]]`,
    };
  }
  if (newer) {
    return {
      intent: 'training-date',
      testCase: 'C',
      text: `The current training completion date is **14 November 2026** (revised from 31 October). ${newerCite}`,
    };
  }
  if (baseline) {
    return {
      intent: 'training-date',
      testCase: 'C',
      text:
        `The baseline plan sets training completion for **31 October 2026**. [[c:ovw-milestones]]` +
        (c.behaviour.flagConflicts || c.behaviour.admitGaps
          ? `\n\n> This comes from the programme overview dated 4 Aug 2026. I don't have a more recent training source, so check whether the date has changed.`
          : ''),
    };
  }
  return {
    intent: 'training-date',
    testCase: 'C',
    text: c.behaviour.admitGaps ? `None of my sources (${sourcesList(c)}) include the training completion date.` : `I don't know the training completion date.`,
  };
}

function changes(c: Ctx): AgentAnswer {
  if (c.has(T38)) {
    return {
      intent: 'changes',
      text:
        `Changes since week 37 (tracker dated 18 Sep 2026):\n\n` +
        `- Knowledge Agent pilot go-live **moved from 25 Sep to 9 Oct 2026** because of the labelling dependency. [[c:trk38-changes]]\n` +
        `- Training completions rose from **268 to 312**. [[c:trk38-changes]]\n` +
        `- Merchant support design review **completed on 15 Sep**. [[c:trk38-changes]]\n` +
        `- Risk R1 (sensitivity labelling) **raised from Medium to High**. [[c:trk38-changes]]`,
    };
  }
  if (c.has(T35)) {
    return {
      intent: 'changes',
      text: `I can't tell what changed this week. The only tracker I can use is from week 35 (28 Aug 2026) and it has no change log for this week. [[c:trk35-status]]` + staleWarning(c),
    };
  }
  return { intent: 'changes', text: `I don't have a delivery tracker in my sources, so I can't report this week's changes. Sources I can use: ${sourcesList(c)}.` };
}

function milestones(c: Ctx): AgentAnswer {
  const t = tracker(c);
  if (!t) {
    if (c.has(OVW)) {
      return {
        intent: 'milestones',
        text: `I only have the baseline milestone plan from the AI Programme Overview (4 Aug 2026). It doesn't show current status, so I can't say which milestones are at risk. [[c:ovw-milestones]]`,
      };
    }
    return { intent: 'milestones', text: `I don't have milestone information in my sources (${sourcesList(c)}).` };
  }
  if (t.stale) {
    return {
      intent: 'milestones',
      text: `In the week 35 tracker, no milestones are marked at risk: pilot go-live 25 Sep 2026 (on track) and training completion 31 Oct 2026 (on track). [[c:trk35-milestones]]` + staleWarning(c),
    };
  }
  const rows = tableRows(T38, 'trk38-milestones');
  const atRisk = rows.filter((r) => r[2] === 'At risk');
  return {
    intent: 'milestones',
    text:
      `${atRisk.length} milestones are at risk in the week 38 tracker:\n\n` +
      atRisk.map((r) => `- **${r[0]} — ${r[1]}.** ${r[3]}. [[c:trk38-milestones]]`).join('\n') +
      (c.behaviour.concise ? '' : `\n\nThe other milestones are on track: ${rows.filter((r) => r[2] !== 'At risk').map((r) => `${r[0]} (${r[1]})`).join(', ')}.`),
  };
}

function trainingProgress(c: Ctx): AgentAnswer {
  if (c.has(REG)) {
    const units = tableRows(REG, 'reg-by-unit');
    return {
      intent: 'training-progress',
      text:
        `**312 of 450** employees in scope have completed Copilot adoption training (69%), and 41 more are booked before 30 Sep. [[c:reg-summary]]\n\n` +
        (c.behaviour.concise
          ? `Operations is lowest at 48%. [[c:reg-by-unit]]`
          : `| Business unit | Completed | Rate |\n|---|---|---|\n` + units.map((u) => `| ${u[0]} | ${u[2]} of ${u[1]} | ${u[3]} |`).join('\n') + `\n\nOperations is lowest at 48% because of month-end workload [[c:reg-by-unit]]; the completion date was revised to 14 Nov 2026. [[c:reg-completion]]`),
    };
  }
  if (c.has(T38)) {
    return { intent: 'training-progress', text: `312 of 450 employees are trained (69%). [[c:trk38-status]] For a breakdown by business unit, add the Training Attendance Register as a knowledge source.` };
  }
  if (c.has(T35)) return { intent: 'training-progress', text: `190 of 450 employees are trained (42%). [[c:trk35-status]]` + staleWarning(c) };
  return { intent: 'training-progress', text: `I don't have training information in my sources (${sourcesList(c)}).` };
}

// ───────────── briefings ─────────────

type BriefVariant = 'full' | 'short' | 'separated' | 'leadership';

function briefing(c: Ctx, variant: BriefVariant): AgentAnswer {
  const t = tracker(c);
  if (!t) {
    return {
      intent: 'briefing',
      text: `I can't prepare a reliable briefing without the Weekly Delivery Tracker. My current sources are: ${sourcesList(c)}. Add the tracker and ask again.`,
    };
  }
  if (t.stale) {
    return {
      intent: 'briefing',
      isBriefing: true,
      text:
        `**AI programme briefing (based on week 35 data)**\n\n- Knowledge Agent pilot: on track for 25 Sep 2026. [[c:trk35-milestones]]\n- Training: 190 of 450 trained (42%). [[c:trk35-status]]\n- Risks: labelling pace and Operations attendance (both Medium). [[c:trk35-risks]]` +
        staleWarning(c),
    };
  }
  const risksRows = tableRows(T38, 'trk38-risks');
  const r1 = risksRows[0];
  const hasSteer = c.has(STC);
  const hasReg = c.has(REG);
  const conflictNote =
    c.behaviour.flagConflicts && c.has(OVW)
      ? `\n\n> **Confirmed vs outdated:** dates here come from the week 38 tracker (18 Sep). The AI Programme Overview (4 Aug) still shows the baseline dates of 25 Sep and 31 Oct. [[c:ovw-milestones]]`
      : '';

  if (variant === 'short') {
    return {
      intent: 'briefing-short',
      isBriefing: true,
      text:
        `**AI programme — week 38 in brief**\n\n` +
        `- Pilot go-live moved to **9 Oct** (labelling dependency). [[c:trk38-milestones]]\n` +
        `- Training at **69%** (312 of 450); completion now 14 Nov. [[c:trk38-status]]\n` +
        `- Top risk: **${r1[1]}** (High, ${r1[3]}). [[c:trk38-risks]]` +
        (hasSteer ? `\n- Decision needed: exclude unlabelled sites from the pilot? [[c:stc-unresolved]]` : ''),
    };
  }

  if (variant === 'separated') {
    return {
      intent: 'briefing-separated',
      isBriefing: true,
      text:
        `**Completed this week**\n\n` +
        `- Merchant support design review completed on 15 Sep. [[c:trk38-changes]]\n` +
        `- 44 more employees trained (268 → 312). [[c:trk38-changes]]\n` +
        (hasSteer ? `- Revised pilot go-live date confirmed by Johan van Wyk. [[c:stc-actions]]\n` : '') +
        `\n**Next steps**\n\n` +
        `- Complete labelling on the Finance FAQ library to protect the 9 Oct go-live (Aisha Patel). [[c:trk38-dependencies]]\n` +
        `- Run two recorded sessions for Operations (Sipho Mahlangu). [[c:trk38-risks]]\n` +
        (hasSteer ? `- Present the content ownership proposal at steering on 1 Oct (Thandi Nkosi). [[c:stc-actions]]\n` : `- Agree an owner for agent content after the pilot (Thandi Nkosi). [[c:trk38-risks]]\n`) +
        `- Cowork usage review on 30 Sep (Lerato Dlamini). [[c:trk38-milestones]]`,
    };
  }

  if (variant === 'leadership') {
    return {
      intent: 'briefing-leadership',
      isBriefing: true,
      text:
        `## AI Programme — Leadership Summary (week ending 18 Sep 2026)\n\n` +
        `**Overall:** Amber. Good progress on training and the merchant support proof of concept; the Knowledge Agent pilot has slipped two weeks. [[c:trk38-status]]\n\n` +
        `**Key messages**\n\n` +
        `1. Pilot go-live is now **9 Oct 2026** (was 25 Sep) because sensitivity labelling is behind on 4 of 7 sites. [[c:trk38-milestones]]\n` +
        `2. Training has reached **69%** (312 of 450); the completion date is now **14 Nov 2026**. [[c:trk38-status]]${hasReg ? ' [[c:reg-completion]]' : ''}\n` +
        `3. Risk **R1 is now High** — labelling delays could push the pilot further. [[c:trk38-risks]]\n\n` +
        `**Decisions requested from leadership**\n\n` +
        (hasSteer
          ? `- Agree whether unlabelled sites are excluded from the pilot. [[c:stc-unresolved]]\n- Confirm who owns agent content after the pilot. [[c:stc-unresolved]]`
          : `- Decide on temporary exclusion of unlabelled sites (R1 mitigation). [[c:trk38-risks]]`) +
        `\n\n**Data date:** Weekly Delivery Tracker, 18 Sep 2026.` +
        conflictNote,
    };
  }

  // full
  const milestonesRows = tableRows(T38, 'trk38-milestones');
  return {
    intent: 'briefing',
    isBriefing: true,
    text:
      `**Weekly AI programme briefing — week ending 18 Sep 2026**\n\n` +
      `**Headline:** Most workstreams are on track, but the Knowledge Agent pilot go-live has moved to **9 Oct 2026** because sensitivity labelling is behind schedule. [[c:trk38-milestones]]\n\n` +
      `### Progress\n\n` +
      `- Training: 312 of 450 employees trained (69%), up from 268 last week. [[c:trk38-changes]]\n` +
      `- Merchant support proof of concept: design review completed on 15 Sep. [[c:trk38-status]]\n` +
      `- Cowork early adopters: 40 of 50 licences assigned. [[c:trk38-status]]\n\n` +
      `### Milestones\n\n| Milestone | Date | Status |\n|---|---|---|\n` +
      milestonesRows.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} |`).join('\n') +
      ` \n\n[[c:trk38-milestones]]\n\n` +
      `### Top risks\n\n` +
      risksRows
        .filter((r) => r[2] !== 'Low')
        .map((r) => `- **${r[0]} (${r[2]}):** ${r[1]}. Owner: ${r[3]}. [[c:trk38-risks]]`)
        .join('\n') +
      `\n\n### Decisions needed\n\n` +
      (hasSteer
        ? `- Whether unlabelled sites are excluded from the pilot (R1). [[c:stc-unresolved]]\n- Who maintains agent content after the pilot (R3). [[c:stc-unresolved]]`
        : `- Whether to temporarily exclude unlabelled sites (R1 mitigation). [[c:trk38-risks]]`) +
      conflictNote,
  };
}

function lastBriefingVariant(c: Ctx): boolean {
  return c.history.some((m) => m.role === 'assistant' && m.isBriefing);
}

function showSource(c: Ctx): AgentAnswer {
  const t = tracker(c);
  if (!t) return { intent: 'show-source', text: `I don't have a risk source available. My sources are: ${sourcesList(c)}.` };
  const doc = getDoc(t.id)!;
  const rows = t.stale ? [] : tableRows(T38, 'trk38-risks');
  const r1 = rows[0];
  return {
    intent: 'show-source',
    text: t.stale
      ? `The risks come from **${doc.title}** (${doc.fileName}, version ${doc.version}, updated ${fmtDate(doc.modified)}, owner ${doc.owner}). Select the citation to open the excerpt. [[c:trk35-risks]]` + staleWarning(c)
      : `The top risk (R1) comes from the **Risks** table in **${doc.title}** — version ${doc.version}, updated ${fmtDate(doc.modified)}, owner ${doc.owner}. [[c:trk38-risks]]\n\n> "${r1[1]}" — rated ${r1[2]}, owner ${r1[3]}.\n\nSelect the citation number to open the supporting excerpt and check the date before you share it.`,
  };
}

function dependencies(c: Ctx): AgentAnswer {
  if (!c.has(T38)) return { intent: 'dependencies', text: `Dependencies are recorded in the current Weekly Delivery Tracker, which isn't one of my sources. I can use: ${sourcesList(c)}.` };
  return {
    intent: 'dependencies',
    text: `Key dependencies:\n\n- The agent pilot depends on labelling of the **Finance FAQ library** (Data governance workstream). [[c:trk38-dependencies]]\n- The Cowork usage review depends on **licence reconciliation** (R4). [[c:trk38-dependencies]]`,
  };
}

function owners(c: Ctx): AgentAnswer {
  if (c.has(OVW)) {
    const rows = tableRows(OVW, 'ovw-workstreams');
    return {
      intent: 'owners',
      text: `Workstream leads:\n\n` + rows.map((r) => `- **${r[0]}:** ${r[1]}`).join('\n') + ` [[c:ovw-workstreams]]`,
    };
  }
  if (c.has(T38)) {
    const rows = tableRows(T38, 'trk38-status');
    return { intent: 'owners', text: `Workstream owners in the tracker:\n\n` + rows.map((r) => `- **${r[0]}:** ${r[3]}`).join('\n') + ` [[c:trk38-status]]` };
  }
  return { intent: 'owners', text: `I don't have ownership information in my sources (${sourcesList(c)}).` };
}

function governance(c: Ctx): AgentAnswer {
  if (!c.has(GOV)) return { intent: 'governance', text: `The Programme Governance Guide isn't one of my sources, so I can't confirm the rules. Add it as a knowledge source.` };
  return {
    intent: 'governance',
    text:
      `From the Programme Governance Guide v1.4:\n\n- Leadership updates are reviewed by the author before distribution, and AI-generated drafts are checked against their sources by a person. [[c:gov-comms]]\n- Outbound actions such as sending email or creating meetings are approved individually. [[c:gov-actions]]\n- High-rated unresolved risks get a 30-minute follow-up with the risk owner within five working days. [[c:gov-meetings]]`,
  };
}

function steering(c: Ctx): AgentAnswer {
  if (!c.has(STC)) {
    return {
      intent: 'steering',
      text: c.behaviour.admitGaps
        ? `The steering meeting notes aren't in my sources, so I can't report decisions or actions from that meeting. I can use: ${sourcesList(c)}.`
        : `I don't have information on steering decisions.`,
    };
  }
  return {
    intent: 'steering',
    text: `From the 10 Sep steering meeting:\n\n**Decisions:** two extra recorded training sessions approved; the agent pilot is limited to Finance and Operations FAQs. [[c:stc-decisions]]\n\n**Still open:** whether unlabelled sites are excluded from the pilot, and who maintains agent content afterwards. [[c:stc-unresolved]]`,
  };
}

function help(c: Ctx): AgentAnswer {
  return {
    intent: 'help',
    text:
      `I'm **${c.agentName}**. ${c.description || 'I answer questions about the AI programme.'}\n\nI use these sources: ${sourcesList(c)}.\n\nYou could ask:\n` +
      c.starterPrompts.slice(0, 4).map((p) => `- ${p.message}`).join('\n'),
  };
}

function outOfScope(c: Ctx): AgentAnswer {
  return {
    intent: 'out-of-scope',
    text:
      `That isn't covered by my programme documents (${sourcesList(c)}), so I can't answer it reliably.` +
      (c.onlySpecifiedSources ? '' : `\n\n> General guidance isn't available in this training simulation, and web search is off.`) +
      `\n\nI can help with programme progress, milestones, risks, dependencies, training activity and briefings. Try: ` +
      c.starterPrompts.slice(0, 3).map((p) => `"${p.message}"`).join(', ') +
      `.`,
  };
}

// ───────────── coaching ─────────────

function withCoaching(a: AgentAnswer, c: Ctx): AgentAnswer {
  if (!a.testCase) return a;
  const cited = /\[\[c:/.test(a.text) && c.behaviour.cite;
  const usedStale = /trk35-/.test(a.text);
  if (a.testCase === 'A') {
    const good = cited && !usedStale && c.has(T38);
    a.coaching = {
      verdict: good ? 'good' : 'needs-work',
      evidence: !c.behaviour.cite
        ? 'No citations: your instructions no longer ask the agent to cite sources, so readers cannot check the claims.'
        : usedStale
          ? 'The answer relies on the superseded week 35 tracker. Replace it with the week 38 tracker.'
          : cited
            ? 'Each risk is cited to the week 38 tracker. Open a citation to check the excerpt.'
            : 'No source contains the risks. Add the Weekly Delivery Tracker.',
      clarity: 'Risks are listed with rating, owner and mitigation — easy to scan.',
      uncertainty: usedStale ? 'The answer flags that data may be outdated.' : 'Not needed: the facts are in the sources.',
      tip: good ? undefined : 'Fix the sources or instructions, then rerun this test.',
    };
  }
  if (a.testCase === 'B') {
    const invented = /likely|roughly|approved \*\*R6\.8 million\*\* for the programme/.test(a.text);
    const good = !invented && /(can't find|don't state|won't estimate)/.test(a.text);
    a.coaching = {
      verdict: good ? 'good' : 'needs-work',
      evidence: invented
        ? 'The answer uses the FY2026 figure to answer a question about next year. The cited source does not support that claim.'
        : 'No source contains next year\'s budget, and the answer does not pretend otherwise.',
      clarity: good && /next step/i.test(a.text) ? 'It suggests a practical next step: who to ask.' : 'It does not suggest what to do next.',
      uncertainty: good
        ? 'The gap is stated plainly.'
        : 'Add an instruction such as "If the information is missing, say so. Do not invent budgets." then rerun.',
      tip: good ? undefined : 'Edit the instructions on the Configure tab and rerun this test.',
    };
  }
  if (a.testCase === 'C') {
    const conflictShown = /two different dates/.test(a.text);
    const silentOld = /by \*\*31 October 2026\*\*/.test(a.text) && !conflictShown;
    const bothAvailable = c.has(OVW) && (c.has(REG) || c.has(T38));
    const good = conflictShown || (!bothAvailable && !silentOld);
    a.coaching = {
      verdict: good ? 'good' : 'needs-work',
      evidence: conflictShown
        ? 'Both sources are cited with their dates, so the reader can see why 14 November is current.'
        : silentOld
          ? 'The answer silently used the older overview (4 Aug). A newer source (19 Sep) gives a different date.'
          : 'Only one source with this date is selected, so no conflict is visible.',
      clarity: conflictShown ? 'Keeps the two dates separate instead of merging them.' : 'Gives a single date without context.',
      uncertainty: conflictShown
        ? 'Explains which source is newer and suggests updating the overview.'
        : 'Add an instruction such as "Separate confirmed information from assumptions and point out conflicting sources." then rerun.',
      tip: good ? undefined : 'Edit the instructions, then rerun this test to compare.',
    };
  }
  return a;
}

// ───────────── router ─────────────

export const programmePack: KnowledgePack = {
  id: 'programme',
  answer(ctx) {
    const c: Ctx = { ...ctx, has: (id) => ctx.ready.includes(id) };
    const q = normalise(ctx.question);
    const empty = noSources(c);
    let a: AgentAnswer;

    if (empty && !/^(hi|hello|hey|help|what can you do)/.test(q)) a = empty;
    else if (/^(hi|hello|hey)\b|what can you (do|help)|^help\b|who are you/.test(q)) a = help(c);
    else if (/(source|evidence|where does|where did|prove|show me where).*(risk|this|that)|show (the |me the )?source/.test(q)) a = showSource(c);
    else if (/(shorter|shorten|condense|too long|tl;?dr|make it brief|briefer|cut it down)/.test(q)) a = briefing(c, 'short');
    else if (/(separate|split).*(complete|done)|completed work|done (vs|versus|and) next|next steps/.test(q)) a = briefing(c, 'separated');
    else if (/(leadership[- ]ready|executive|exec summary|turn (this|it) into|polish|for (the )?leadership (group|team)|board)/.test(q)) a = briefing(c, 'leadership');
    else if (/(budget|funding|spend|cost|money|capex|opex)/.test(q)) a = budget(c, q);
    else if (/(training).*(complet|finish|end date|deadline|due|date)|completion date|when (will|does|is) training/.test(q)) a = trainingDate(c);
    else if (/(briefing|brief me|weekly update|status update|summary of the programme|summarise the programme|summarize the programme|overview of progress)/.test(q)) a = briefing(c, 'full');
    else if (/milestone|deadline|slip|delay|go-?live/.test(q)) a = milestones(c);
    else if (/risk|issue|concern|threat/.test(q)) a = risks(c);
    else if (/(what changed|changes|what's new|what is new|since last week|this week)/.test(q)) a = changes(c);
    else if (/(training|attendance|trained|learners|sessions)/.test(q)) a = trainingProgress(c);
    else if (/depend|blocker|blocked/.test(q)) a = dependencies(c);
    else if (/(owner|who (owns|leads|is responsible)|lead for|responsible)/.test(q)) a = owners(c);
    else if (/(govern|approval rule|approve|policy|review before|rules)/.test(q)) a = governance(c);
    else if (/(steering|decision|decided|action items|open actions)/.test(q)) a = steering(c);
    else if (/(summar|progress|status|how is|how are)/.test(q)) a = lastBriefingVariant(c) ? briefing(c, 'short') : briefing(c, 'full');
    else a = outOfScope(c);

    return withCoaching(a, c);
  },
};
