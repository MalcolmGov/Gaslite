# Facilitator guide — suggested 45-minute session

**Audience:** non-technical employees at MTN Group Fintech who have Microsoft 365 Copilot or are about to get it.
**Format:** each learner at a laptop, with the facilitator projecting. Also works as a live demonstration.
**Setup (5 minutes before):** open the Learning Lab on the projector machine. Choose **Facilitator** mode, open **Facilitator**, set speed to **Fast**, and set text size to **115%** or **130%** for the room. Learners open the same URL and choose **Guided**.

> The Learning Lab is an internal training simulation with sample data. It is not a live Microsoft service. Please say this at the start: nothing learners do sends a real email or touches real files.

## Timings

| Time | Segment | Lesson(s) | What learners do | Facilitator notes |
|---|---|---|---|---|
| 0–5 | Understand Chat, agents and Cowork | 1 | Ask Copilot Chat "What's the difference between an agent and Cowork?" | Use the comparison in the answer. Open **Agent Builder › … › When to use Copilot Studio** to explain the optional advanced route. Stress that an Agent Builder agent answers from instructions and knowledge. It does not run workflows or connect to other systems by itself. |
| 5–17 | Create and test the agent | 2–3 | Describe the agent, answer the four questions, pick knowledge, review Configure, then run tests A/B/C and improve and rerun | In the picker, two files are both named *Weekly Delivery Tracker.xlsx*. Ask the room which to choose and why (week 38, 18 Sep). Have someone try the restricted Finance file. Test B has no answer in any accessible file. Test C shows two conflicting dates: ask the room which source is newer. Then remove "Separate confirmed information…" and rerun C to show that instructions matter. |
| 17–22 | Share and engage | 4–5 | Create, share with **AI Training Cohort — Wave 2**, open the agent, ask for a briefing and two follow-ups | Point out the "Audience can't open" line for the steering notes: sharing never grants access to files. Org-wide sharing depends on admin policy. The "Use this briefing in the Cowork exercise" button is a training handoff that copies the text. It is not a built-in integration. |
| 22–37 | Delegate, review and approve | 6–7 | Send the task, accept the plan, answer the two questions, open the leadership update, check its milestone source, replace the week 35 tracker, regenerate, then send the email (it fails once, then retry) and fix the meeting conflict before creating it | Before anyone presses Send, ask: "What date is on the attached tracker?" Accepting the plan is not approving an action. The first send fails on purpose, and **Retry** never duplicates. Thursday 10:00 clashes with the Programme Director's Exco preparation. Finish in **Sent items & calendar** to confirm exactly one email and one meeting. |
| 37–45 | Independent practice and discussion | Practice | Each learner picks one exercise: meeting preparation, policy knowledge or project delivery | Debrief: Where did the tool help? Where did you have to check its work? What would you never approve without reading? Point learners to **See your results** for their personal feedback. |

If time is short, load a later lesson from **Facilitator › Jump to a lesson**. Each lesson has a known starting state.

## Facilitator controls

Open these with **Facilitator** in the toolbar. You must be in Facilitator mode.

| Control | Use |
|---|---|
| Jump to a lesson — **Load** | Resets product data and builds a known starting state. For example, *Review and approve* opens a task that is already waiting for approvals, with the stale tracker attached. |
| Restart current scenario | Same as **Restart exercise** in the toolbar. |
| Simulation speed | Instant / Fast / Normal / Realistic. Instant is good for rehearsal, Normal or Realistic for demonstrating progress. |
| Next email send fails once | Default **on**. Toggle to re-arm after it has been used. |
| Steering notes become inaccessible | When on, adding the steering notes as knowledge produces "Couldn't access" with **Retry** and **Remove**. |
| Show speaker notes | Adds these notes to the **Lesson** panel. |
| Hide learning hints | Removes the coach marks, the test checklist and coaching cards for a clean demonstration. |
| Text size | 100 / 115 / 130% for projection. |
| Reset all training data | Clears everything on this device. |

Facilitator mode is a local convenience. It is **not** a secure admin area: anyone can switch to it from the toolbar.

## Failure branches to demonstrate

| Branch | How to trigger | Recovery |
|---|---|---|
| Inaccessible knowledge source | Add *FY2027 Budget Submission – Draft* (always denied), or turn on the steering-notes failure | Choose another source; Retry or Remove |
| Outdated document | The week 35 tracker (picker, or pre-attached in Cowork) | Replace with week 38 and regenerate |
| Ambiguous recipient | Built into the Cowork task | Answer the question, or Skip and then check the To line |
| Meeting conflict | Choose Thu 24 Sep 10:00 | "Use first free time", or Edit |
| Connector failure | On by default (first email send) | Retry, which is idempotent |
| Cancel before execution | Select **Send**, then **Undo** within a few seconds, or **Cancel task** | Nothing is sent. Completed actions stay visible. |
| Refresh mid-task | Reload the browser while Cowork is working | The task is paused with an explanation. Approved but unsent actions return to *Needs approval*. |

## Discussion prompts

- "The agent said it couldn't find next year's budget. Is that a failure?"
- "Who can see the steering notes after you share the agent?"
- "What would have gone to leadership if you hadn't checked the milestone source?"
- "Which of today's tasks would you delegate to Cowork at work, and which approvals would you never skip?"
