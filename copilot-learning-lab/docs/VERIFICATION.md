# Verification checklist

Verified on 23 Sep 2026 with `npm run typecheck`, `npm test` (41 Vitest unit and state tests) and `npm run e2e` (14 Playwright tests in Chromium). Screenshots were inspected at 1440×900 (laptop), 1920×1080 (presentation) and 390×844 (phone).

**Evidence key:** **U** = unit/state test (`src/**/*.test.ts`), **E** = Playwright test (`e2e/*.spec.ts`), **S** = screenshot reviewed, **P** = one-off scripted browser probe (keyboard/reduced motion, run 23 Sep 2026).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | A new learner can finish the main journey without developer help | ✅ Pass | E `main journey end to end` (Guided mode, UI only); S 01–20 |
| 2 | Agent configuration changes affect simulated answers | ✅ Pass | U "omits citations…", "invents an estimate…", "silently picks the old date…"; E removing "Separate confirmed…" flips Test C to *needs work*, and "Compare with config v1" shows the difference |
| 3 | Source citations resolve to supporting content | ✅ Pass | U "every citation in answers resolves to a real excerpt"; E citation opens *Weekly Delivery Tracker — Week 38* with the Risks excerpt highlighted |
| 4 | Missing information produces an honest response | ✅ Pass | U test case B; E "can't find an approved budget for next year"; E policy practice (Lagos per diem) |
| 5 | Sharing changes the simulated audience and agent availability | ✅ Pass | E share with cohort → "Agent shared", chat link `#/agents/agt_…`, "Shared with AI Training Cohort — Wave 2", agent listed in navigation |
| 6 | The handoff into Cowork is explicit and understandable | ✅ Pass | E handoff dialog ("copies… not a built-in connection") → task in **Ready** state with the briefing chip |
| 7 | Cowork produces useful, editable outputs | ✅ Pass | E leadership update, status table, email, invite; revisions and edits create versions (U `revise`; P: agenda "Make it shorter" → version 2, edited → version 3) |
| 8 | Outbound actions wait for approval | ✅ Pass | U "pauses for approval and executes nothing without it"; E approval cards before any sent item |
| 9 | Rejected actions do not execute | ✅ Pass | U "a rejected (cancelled) action never executes"; E `a rejected action never executes` (Sent items empty, calendar empty) |
| 10 | Retry and refresh do not create duplicates | ✅ Pass | U "retry after a connector failure does not duplicate", "refresh recovery…never re-sends"; E `refresh recovery: nothing is repeated or sent twice` (exactly one sent item) |
| 11 | Failure scenarios can be recovered from | ✅ Pass | E restricted file → alternative offered; stale tracker → replace and regenerate; connector failure → Retry; meeting conflict → first free time; U hard pause, cancel |
| 12 | Progress survives refresh, and reset works | ✅ Pass | E `progress survives refresh and reset clears everything`; E refresh while working → *Paused* with explanation → Resume |
| 13 | Downloads contain the promised content and format | ✅ Pass | E `downloads contain the promised formats` (ZIP signature and file list, ICS with `TZID=Africa/Johannesburg`, CSV header); U ZIP CRC, ICS line folding, footnotes |
| 14 | The visual experience follows the selected Microsoft references | ✅ Pass (within limits) | S new agent screen and Configure layout match the official screenshots; Cowork follows the written docs (see LIMITATIONS) |
| 15 | Training additions are distinguishable from native controls | ✅ Pass | S charcoal toolbar; teal dashed "Learning Lab" cards and pills; plan card labelled "Training aid — not a Cowork screen" |

## Specific checks requested

| Check | Result | Evidence |
|---|---|---|
| Main journey (automated) | ✅ | E `main journey end to end` |
| Rejected action (automated) | ✅ | E `a rejected action never executes` |
| Failed-action retry (automated) | ✅ | E main journey (fail → Retry → one sent item); E refresh recovery |
| Refresh recovery (automated) | ✅ | E `refresh recovery…`, `refresh while Cowork is working…` |
| Edit after approval requires re-approval | ✅ | U; E `undo during the send window and edit-after-approval…` |
| Cancel keeps completed actions and stops pending ones | ✅ | U; E `cancel stops pending work…` |
| Removing a source stops the agent relying on it | ✅ | U "stops relying on a removed source" |
| Restricted resource shows access message and alternative | ✅ | E picker search "budget" → *Access denied* → "Select AI Programme Overview instead" |
| Sharing never implies file access | ✅ | E "Audience can't open" for steering notes; banner in share dialog |
| Org-wide sharing not presented as one-click | ✅ | S toggle disabled, explained as tenant policy |
| SAST / Africa/Johannesburg | ✅ | U ICS; S meeting card "Africa/Johannesburg (SAST, UTC+02:00)" |
| No confidence percentages | ✅ | S coaching shows Evidence, Clarity, Uncertainty only |
| Certificate described as internal | ✅ | S results page; downloaded record labelled "not a Microsoft certification" |
| Practice scenarios have their own data and expected results | ✅ | E project delivery (P-101/103/104 overdue, P-106 excluded); E policy; P meeting preparation (2 open decisions listed, dashboard item excluded with addendum citation, invitation created, Finish enabled) |
| Workplace practice set: six agents and Cowork tasks for everyday staff work | ✅ | U 12 tests in `src/state/workplace.test.ts` (cited answers, routed gaps, reassigned action owner, lower-is-better KPI, stale and provisional figures, P1 triage, PIN never copied, no email when escalation declined); E practice hub groups, compliance gap, case triage |
| Model choice and cost: Agent Builder shows no picker; simulated Copilot Studio picker with admin, preview and cross-geo warnings and a credit estimate | ✅ | U estimator rates (General, Auto range, Deep, no grounding, zero users), model exercise completes only for a GA General model and resets on restart; E choose a model, estimate 158,400 credits for 200 unlicensed users, Claude Opus admin warning, header shows the chosen model |

## Accessibility and presentation

| Check | Result | Evidence |
|---|---|---|
| Keyboard: Cowork question cards (arrows, Space, Submit) | ✅ | E `keyboard: Cowork questions…` |
| Keyboard: start the journey and chat without a mouse; Escape closes drawers | ✅ | P: 12 Tab stops from page load to *Start*, Enter starts, typing + Enter sends a chat message, Escape closes the Lesson drawer. The citation panel also closes on Escape (code). A full keyboard pass of every screen has not been done. |
| Visible focus | ✅ | P: every one of the 12 focused elements had a visible outline or focus ring |
| Accessible names on icon buttons | ✅ | Tooltips with `relationship="label"`; E locates controls by role and name |
| Screen-reader announcements for task changes | ✅ | Polite live region: replies, "Cowork needs your input", approvals, sent/created, lesson completion |
| No dialog leaves the page `aria-hidden` | ✅ | E `no dialog leaves the page hidden…` (regression found and fixed during verification) |
| Reduced motion | ✅ | P with `reducedMotion: 'reduce'`: replies render in full immediately (no streaming) and the spotlight transition is 0s |
| Status not conveyed by colour alone | ✅ | Every badge has a text label |
| Contrast | ✅ | Text colours ≥ 4.5:1 on their backgrounds (e.g. #616161 on #fafafa ≈ 5.9:1; #bc4b09 on #fff9f5 ≈ 4.9:1) |
| Zoom / text size | ✅ | Facilitator 115% and 130%; E 1920×1080 with no horizontal overflow; 390 px with essential actions visible |
| Small screens collapse secondary panels | ✅ | S mobile-390 (navigation and side panel collapse, toolbar compacts to icons) |

## Issues found and fixed during verification

1. Swapping or unmounting open Fluent dialogs left `aria-hidden="true"` on the page. **Fixed:** one dialog per flow, close-then-navigate sequencing, and a safety net. Now covered by a regression test.
2. zustand selectors returning new arrays risked render loops. **Fixed** with `useShallow`.
3. The spotlight could ring elements that were scrolled out of view or covered by a panel. **Fixed** with a hit-test check.
4. The artifact preview hid the side panel's **Replace** control. **Fixed** by adding an in-context replace action, which appears only after the learner has checked the source.
5. Reference chips repeated the same document name. They now include the section.
6. Opening at a narrow width, or resizing to one, left the navigation and side panel open over the content. **Fixed** with resize handling.
