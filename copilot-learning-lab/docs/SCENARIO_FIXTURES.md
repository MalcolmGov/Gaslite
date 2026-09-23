# Editing the scenario fixtures

All scenario content is plain TypeScript data. Edit it, then run `npm test` to confirm the answers and outputs still hold together.

| File | What it holds |
|---|---|
| `src/config/settings.ts` | Organisation name, learner profile, email domain (always `*.example`), scenario date (`2026-09-22`), time zone (Africa/Johannesburg, SAST), labels, storage key |
| `src/scenario/main/documents.ts` | The main scenario's documents: sections, tables, owners, versions, dates, classifications, access |
| `src/scenario/practice/documents.ts` | Core practice documents: policy, working-group notes, delivery tracker |
| `src/scenario/practice/workplaceDocuments.ts` | Workplace practice documents: expenses and IT procedure, complaints and KYC procedure, new joiner guide, meeting transcript, KPI scorecard, support case queue |
| `src/scenario/people.ts` | Fictional people, distribution groups and sample calendar events |
| `src/training/lessons.ts` | Lessons, objectives, speaker notes and guided steps, with their completion predicates |
| `src/training/practice.ts` | Practice exercises, expected results and checks |

## Documents

Each `SampleDocument` has:

- `id`: stable identifier. Citations use section ids, so keep those stable too.
- `title`, `fileName`, `kind` (`docx`, `xlsx`, `pdf`…), `version`, `owner`, `modified` (ISO date), `location`, `classification`.
- `learnerAccess`: `'denied'` makes it a restricted file. Adding it to an agent produces *Access denied* with `accessMessage`.
- `readableBy`: groups that can open the file. This drives the sharing dialog's "Audience can't open" check.
- `supersededBy`: marks a file as outdated and points to its replacement.
- `duplicateOf`: marks a copy of another file.
- `sections`: `{ id, heading, text | table }`. Each section can be cited with the token `[[c:<section id>]]`.

### Built-in teaching features

| Feature | Where |
|---|---|
| Conflicting dates (31 Oct vs 14 Nov) | `doc_overview` › `ovw-milestones` vs `doc_register` › `reg-completion` |
| Outdated file with a stale milestone (pilot go-live 25 Sep vs 9 Oct) | `doc_tracker35` (superseded by `doc_tracker38`) |
| Duplicate | `doc_overview_copy` in OneDrive |
| Restricted resource | `doc_budget` (Finance, Confidential) |
| Missing information | No accessible document contains the FY2027 approved budget |
| Source the cohort can't open | `doc_steering` is readable only by the Programme Leadership Group |
| Ambiguous recipients | `grp_plg` "Programme Leadership Group" vs `grp_leads` "AI Programme Leads" |
| Calendar conflict | Thandi Nkosi, Thu 24 Sep 10:00–11:00 SAST |

## How answers use the fixtures

- **Agent answers** (`src/engine/packs/programme.ts`) read table rows from the documents that are *ready* in the agent's knowledge. For example, the risks answer lists the rows of `trk38-risks`, so editing that table changes the answer. Remove a document from the agent and its facts disappear from the answers.
- **Cowork outputs** (`src/engine/cowork/scenarios.ts`) are generated from the files attached to the task (week 35 or week 38 tracker), the answers to clarifying questions, and the briefing that was carried over.

If you rename a section id, search for `[[c:<old id>]]` and update it. The unit test *"every citation in answers resolves to a real excerpt"* catches missed references.

### Workplace practice set ("Agents your teams will use")

| Exercise | Surface | Source | What it tests |
|---|---|---|---|
| Policy & Procedures Navigator | Agent | `doc_procedures` | Cited answers; gym membership and late-claim *exceptions* are routed to Finance, not answered |
| Compliance & KYC Q&A | Agent | `doc_compliance` | Cited timelines and KYC tiers; expired passport and legal questions go to the Compliance mailbox |
| New Joiner Onboarding Buddy | Agent | `doc_onboarding` | First-week answers; pay and leave go to People & Culture |
| Meeting to actions | Cowork | `doc_sync_transcript` | Comms plan reassigned from Sipho to Lerato mid-meeting; WhatsApp chatbot is parked, not an action |
| Weekly status report | Cowork | `doc_kpi_scorecard` | Complaint resolution is lower-is-better; app rating data is stale (6 Sep); fraud losses are provisional |
| Customer case triage | Cowork | `doc_case_queue` | P1s are C-2201, C-2204 (14 of 15 days) and C-2205; the PIN in C-2206 never appears in any output |

Agent answers for this set come from rule tables in `src/engine/packs/workplace.ts`; Cowork outputs come from `src/engine/cowork/workplace.ts`, which reads the fixture tables, so editing a row changes the output.

## Adding a practice exercise

1. Add documents to `src/scenario/practice/documents.ts` or `workplaceDocuments.ts`.
2. Add either a `CoworkScenario` (see `src/engine/cowork/workplace.ts`) and register it in `scenarios` and `detectScenario` in `src/engine/cowork/scenarios.ts`, or a `KnowledgePack` (see `makePack` in `src/engine/packs/workplace.ts`) and register it in `src/engine/packs/index.ts`.
3. Register the exercise in `src/training/practice.ts` with its expected results and checks. Set `agent` (a pre-built agent template) or `scenario`; `startPractice` uses whichever is set.
