# Copilot & Cowork — Interactive Learning Lab

An interactive training simulation for **Microsoft 365 Copilot Chat, Agent Builder and Copilot Cowork**, configured for **MTN Group Fintech**.

Learners build an AI Programme Knowledge Agent, give it approved knowledge, test its answers, share it with a training cohort, use it, and then delegate a realistic multi-step task to Cowork. They review the outputs and approve each simulated action themselves.

The **Practice exercises** page adds nine shorter exercises. Three repeat the core skills on new data. Six model agents and Cowork tasks staff can build for their own work: a policy and procedures navigator, a compliance and KYC Q&A agent, a new joiner onboarding buddy, meeting-to-actions follow-up, a weekly KPI status report, and customer case triage.

> **Training simulation · Sample data.** This is an internal training experience, not a live Microsoft service. It needs no Microsoft sign-in, API keys, tenant access or AI service. Every person, document, figure and date is synthetic. No email, Teams message or meeting is ever sent or created.

## Quick start

```bash
cd copilot-learning-lab
npm install
npm run dev        # http://localhost:5173
```

Production build (static files in `dist/`, served from any sub-path):

```bash
npm run build
npx vite preview   # http://localhost:4173
```

Requires Node.js 18 or later. The app works offline once built.

## Checks

```bash
npm run typecheck  # TypeScript
npm test           # 53 unit and state tests (Vitest)
npm run e2e        # Playwright journeys; builds and serves the app itself
```

The Playwright config uses a pre-installed Chromium at `/opt/pw-browsers` if one exists. Otherwise run `npx playwright install chromium` once. To save screenshots during the e2e run, use `SCREENSHOTS=/some/dir npm run e2e`.

## Using it

1. Open the app and choose a mode: **Guided**, **Practice** or **Facilitator**.
2. Select **Start the main journey**. The charcoal Learning Lab toolbar at the top shows the lesson, progress, hints, **Restart exercise** and **Exit lesson**. Everything below the toolbar is the simulated product.
3. Progress is saved in the browser. Reopen the app to continue (**Resume session**). Use **Reset all training data** on the Welcome page, or in Facilitator mode, to start again.

For session plans and trainer controls, see [`docs/FACILITATOR_GUIDE.md`](docs/FACILITATOR_GUIDE.md).

## Project layout

```
src/
  config/settings.ts        Organisation name, learner profile, scenario date & time zone, labels
  scenario/                 Editable fixtures: documents, people, groups, calendars (see docs/SCENARIO_FIXTURES.md)
  engine/                   Pure logic, no React
    instructions.ts         Reads agent instructions into behaviour flags
    packs/                  Deterministic answer engines per agent (programme, policy)
    builder.ts              Agent Builder "Describe" conversation
    copilotChat.ts          Plain Copilot Chat responder
    cowork/                 Task scripts, clarifying questions, output generators, revisions
    exports.ts              Honest exports: .md, .html, .csv, .ics, .eml, .zip
    model.ts                Domain types (agents, tasks, actions, artifacts, learning events)
  state/                    Zustand store + action modules (agent, cowork, training, router)
  product/                  Product-like UI (Copilot shell, Agent Builder, agent chat, Cowork, simulated Outlook)
  training/                 Training layer (toolbar, coach marks, drawers, lessons, feedback, practice)
  lib/                      Markdown subset, cancellable scheduler, ZIP writer, utilities
e2e/                        Playwright journeys
docs/                       References, feature map, facilitator guide, verification, limitations
```

The layers are kept apart on purpose:

- **Product UI** (`src/product`) never imports training components. The only exception is small `Learning Lab` cards, which are clearly styled as training.
- **Engines** (`src/engine`) are plain TypeScript with unit tests.
- **Future integration points** sit behind interfaces: `KnowledgePack` (answers), `CoworkScenario` (task execution), and the `download`/`artifactFiles` export functions. A live Microsoft Graph or model connection would replace these. None is implemented.

## Deliverables

| Document | Contents |
|---|---|
| [docs/REFERENCES.md](docs/REFERENCES.md) | Official sources reviewed, with dates |
| [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) | Verified product behaviour vs. training additions |
| [docs/SCENARIO_FIXTURES.md](docs/SCENARIO_FIXTURES.md) | How to edit the sample data |
| [docs/FACILITATOR_GUIDE.md](docs/FACILITATOR_GUIDE.md) | 45-minute session plan and facilitator controls |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | Completed verification checklist |
| [docs/LIMITATIONS.md](docs/LIMITATIONS.md) | Remaining fidelity limitations |
| [docs/screenshots/](docs/screenshots) | Laptop (1440×900) and presentation (1920×1080) captures |

## Brand assets

The official Microsoft 365 Copilot logo is **not** bundled, and no replacement logo was invented. If your organisation is licensed to use the official asset, put it in `public/` and set `brand.copilotLogoUrl` in `src/config/settings.ts`. File-type icons are simple approximations built from coloured letter badges, not Microsoft's icon artwork.
