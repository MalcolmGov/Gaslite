# Feature map: verified product behaviour vs. training additions

Every interaction falls into one of three categories:

- **Verified**: matches behaviour or wording in the official references (see [REFERENCES.md](REFERENCES.md)), and the layout follows an official screenshot where one exists.
- **Approximated**: the behaviour is documented, but no screenshot shows the exact visual design, so the layout is our interpretation.
- **Training addition**: exists only for teaching. It is styled with the Learning Lab visual language (teal, dashed borders, "Learning Lab" or "Training aid" pill) or lives in the charcoal toolbar and its drawers.

## Copilot shell and Chat

| Interaction | Category | Notes |
|---|---|---|
| Top **Chat \| Cowork** toggle | Verified (text) / Approximated (visual) | Cowork docs: "Select Cowork in the top toggle next to Chat". |
| Left navigation with New chat, Agents, New agent, All agents | Approximated | Agent Builder docs describe *New agent* in the navigation pane and managing agents from the left pane. |
| Copilot Chat answers questions about attached files | Approximated | Simulated responder with a small set of supported questions. Anything else gets an explanation of what the simulation supports. |
| "Search", Automations, Customize, voice input, model picker | Shown but disabled, with an explanation | These exist in the product but are outside this training. Hovering explains why each is unavailable. |
| "Simulated Outlook" (Sent items & calendar) | Training addition | Lets learners confirm what their approvals did. Clearly labelled as simulated. |

## Agent Builder

| Interaction | Category | Notes |
|---|---|---|
| New agent screen: "What can I take off your hands today?", composer, **Skip to configure** | Verified (screenshot) | |
| Describing the agent in natural language, with clarifying questions that update name, description and instructions | Verified (behaviour) / Approximated (visual) | The four questions come from the training brief. The real Agent Builder decides its own questions. |
| Describe / Configure / Try it tabs | Verified (names) / Approximated (visual) | The screenshot shows a Configure/Try It segmented control, and the docs name a Describe tab too. |
| Configure fields: name (30 characters), description (1,000), instructions (8,000), knowledge, suggested prompts (title + message) | Verified | Limits match the documentation. |
| Knowledge toggles: Only use specified sources (works), Search all websites / org chart (disabled with an explanation) | Verified (labels) | "Search all websites" is off, as if disabled by tenant policy. |
| Capabilities toggles (documents/charts/code, images) | Verified (labels), disabled | Not used in this exercise. The reason is shown. |
| Try it becomes available once name, description and instructions are filled | Verified | |
| **Create** → "private and only available to you" → **Share** | Verified | |
| Share dialog: *Add a name, group, or email*, Can chat / Can edit (groups can only chat), Send notification, org-wide toggle disabled by policy, Copy chat link | Verified (behaviour) / Approximated (visual) | Org-wide sharing is explained, never enabled. |
| "Sharing doesn't grant access to knowledge sources", with per-source audience access check | Verified (principle) / Training addition (per-source table) | The table makes the permission rule visible. |
| **Update** after editing a created agent | Verified | |
| File picker with Recent / site / OneDrive locations, search, preview, metadata | Approximated | No official screenshot of the picker was available. |
| Source states: preparing, ready, access denied, couldn't access, removed (with undo) | Approximated | "Superseded" and "possible duplicate" flags are training additions. |
| **Test checklist** (A/B/C), coaching cards, "Compare with config vN" | Training addition | Feedback covers evidence, clarity and uncertainty. No confidence percentages. |
| "How the simulator reads your instructions" panel | Training addition | Explains the deterministic simulator honestly. |
| Instructions change answers (citations, gaps, conflicts, concision, estimates) | Training approximation | A real model is steered by instructions, but less predictably. |

## Using the agent

| Interaction | Category | Notes |
|---|---|---|
| Agent chat with starter prompts, citations, references, copy and thumbs | Approximated | |
| Citations open the exact supporting excerpt in its document | Training approximation | The real product links to sources. The lab highlights the cited section. |
| Follow-ups (shorter, show source, separate, leadership-ready) | Simulated | The answers are generated from the current configuration and sources. |
| **"Use this briefing in the Cowork exercise"** | Training addition | Explicit handoff. It copies the reviewed briefing into a new task. This is not a native agent-to-Cowork integration. |

## Cowork

| Interaction | Category | Notes |
|---|---|---|
| Home page: composer, **+** (Add work context / Upload images and files / Attach cloud files), suggested prompts, My tasks with filters | Verified (behaviour) / Approximated (visual) | Uploading from the device is disabled, with an explanation. |
| "Ready" state for a task created by the handoff, with editable prompt and context chips | Training addition | Makes the learner check the objective and context before sending. |
| **Plan card** | Training addition, labelled "Training aid — not a Cowork screen" | Shows that accepting a plan is different from approving an action. |
| Thinking indicator, skill messages ("Preparing to create Word documents"), tool steps, streaming reply, connection status | Verified (behaviour) / Approximated (visual) | |
| Clarifying questions (arrow keys, Space, Submit, Skip) | Verified | Ambiguous recipients and meeting timing. |
| Side panel: Progress %, step log, Input folder, Output folder (Preview / Download / Download all .zip), Skills chips, Permissions | Verified (sections) / Approximated (visual) | Schedule is omitted because automations aren't used. |
| Pause after this step / Pause now / Resume / Cancel | Verified | |
| Queuing a message while Cowork works | Verified (concept) / Simulated | The simulation acknowledges the message and explains its limits. |
| Approval cards with preview, **Send** / **Create**, dropdown, **Cancel**, **Show parameters** | Verified | "Always allow for this session" is shown but disabled. The training requires each action to be approved individually. |
| **Approve all (n)** | Not shown | Training default: each action is approved on its own. |
| **Edit** before approving; editing after approval requires a new approval | Training addition (safety pattern) | Uses a payload hash to detect changes. |
| Short "Sending in n s… Undo" window after approval | Training addition | Lets learners practise catching a mistake before an action runs. |
| Simulated connector failure with **Retry** (never duplicates) | Training addition | Facilitator can turn it on or off. |
| Meeting conflicts with "Use first free time" | Training addition | Built on sample calendars. Times are in SAST (Africa/Johannesburg). |
| Output preview with versions, Edit, **Request a revision**, Download | Verified (preview/download) / Training addition (revision presets) | Downloads are real .md, .html, .csv, .ics, .eml and .zip files. No DOCX or PDF is offered. |
| Replace a superseded input file, then **Regenerate affected outputs** | Training addition | Exercise for spotting a stale milestone. |

## Training layer (never product UI)

The following all sit in the charcoal toolbar or teal-styled training surfaces:

- The toolbar itself: organisation label, lesson, progress, mode switch, **Show hint**, **Restart exercise**, **Facilitator**, info, **Exit lesson**, the persistent "Training simulation · Sample data" label, and collapse.
- Guided coach marks and the spotlight ring.
- The Lesson, Facilitator and Info drawers.
- Learning Lab help pop-ups (grounding, knowledge sources, permissions, approvals, citations).
- The Welcome, Results and Practice pages, and the practice objective card.
- The completion record, which is labelled as an internal training completion record and not a Microsoft certification.
