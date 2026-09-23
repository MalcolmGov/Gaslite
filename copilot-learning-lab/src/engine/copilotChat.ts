import { getDoc, tableRows } from '../scenario/registry';
import { normalise } from '../lib/util';

/**
 * Plain Copilot Chat responder for the introduction lesson.
 *
 * Copilot Chat answers ad hoc questions and works with whatever the learner
 * attaches in that conversation. It has no standing instructions or curated
 * knowledge — which is the contrast with an Agent Builder agent.
 */
export function copilotChatReply(question: string, attached: string[]): string {
  const q = normalise(question);

  if (/(difference|compare|what is|what's|explain).*(agent|cowork|chat|studio)|(agent|cowork).*(vs|versus|or)/.test(q)) {
    return (
      `Here's how the three experiences differ:\n\n` +
      `- **Copilot Chat** — ask questions, analyse files you attach, and draft content in a conversation.\n` +
      `- **Agents (Agent Builder)** — reusable assistants with standing instructions and chosen knowledge sources, which you can share with colleagues.\n` +
      `- **Cowork** — delegate a multi-step task. Cowork works through the steps, produces files, and asks for approval before actions such as sending email.\n\n` +
      `**Copilot Studio** is for more advanced agents, such as ones that call external systems or run automated flows.`
    );
  }

  const tracker = attached.find((id) => id === 'doc_tracker38' || id === 'doc_tracker35');
  if (tracker) {
    const doc = getDoc(tracker)!;
    if (tracker === 'doc_tracker35') {
      return `The attached tracker is **week 35 (28 Aug 2026)** from the Archive folder. It shows the Knowledge Agent pilot on track for 25 Sep and training at 42% (190 of 450). [[c:trk35-status]] [[c:trk35-milestones]]\n\n> This file is superseded. Attach the week 38 tracker for current status.`;
    }
    const risks = tableRows('doc_tracker38', 'trk38-risks');
    if (/risk/.test(q)) {
      return `From the attached tracker (${doc.version}):\n\n` + risks.map((r) => `- **${r[0]} (${r[2]}):** ${r[1]}. Owner: ${r[3]}.`).join('\n') + ` [[c:trk38-risks]]`;
    }
    return (
      `Summary of **${doc.title}** (updated 18 Sep 2026):\n\n` +
      `- Pilot go-live moved to **9 Oct 2026** because sensitivity labelling is behind. [[c:trk38-milestones]]\n` +
      `- Training is at **69%** (312 of 450). [[c:trk38-status]]\n` +
      `- Highest risk: **R1 — labelling delays** (High, Aisha Patel). [[c:trk38-risks]]\n\n` +
      `Tip: if your team asks questions like this every week, an agent with the tracker as a knowledge source saves attaching it each time.`
    );
  }

  if (attached.length) {
    const doc = getDoc(attached[0])!;
    return `I've read **${doc.title}** (${doc.version}). ${doc.summary} [[c:${doc.sections[0]?.id}]]\n\nWhat would you like to know about it?`;
  }

  if (/(programme|program|tracker|risk|milestone|training|briefing|weekly update)/.test(q)) {
    return (
      `I don't have your programme documents in this conversation. You can:\n\n` +
      `- Select **+** to attach the Weekly Delivery Tracker and ask again, or\n` +
      `- Build an **agent** that always uses the approved programme documents, so your team doesn't have to attach them each time.`
    );
  }

  if (/(email|draft|write)/.test(q)) {
    return `I can draft that here in Chat. For this training, the drafting exercise happens in Cowork, where you can review and approve the email before anything is sent.`;
  }

  return (
    `In this training simulation, Copilot Chat can:\n\n` +
    `- Explain the difference between Chat, agents and Cowork.\n` +
    `- Summarise a programme file you attach with **+**.\n\n` +
    `Try: "What's the difference between an agent and Cowork?"`
  );
}
