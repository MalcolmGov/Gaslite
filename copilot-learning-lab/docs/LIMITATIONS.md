# Remaining fidelity limitations

1. **No pixel-perfect fidelity is claimed.** Agent Builder's new-agent and Configure screens follow official screenshots. The Cowork pages had **no screenshots**, so the Cowork home, task view, approval cards and side panel are built from the written documentation. No organisation screenshots were supplied. If you provide tenant screenshots, the product components in `src/product/` can be adjusted.
2. **No official brand assets.** The Copilot logo isn't bundled (see `settings.brand.copilotLogoUrl`). File-type icons are approximations, and agent icons are generated from initials.
3. **Deterministic simulator, not a model.** Answers come from knowledge packs that read the agent's ready sources and a set of behaviour flags derived from its instructions. Free text is matched against supported intents. Anything else gets an honest explanation of the simulation's scope. A real model responds to instructions in a more nuanced and less predictable way.
4. **Agent Builder's clarifying questions are scripted.** They are the four questions from the training brief. The real product chooses its own questions and suggestions.
5. **Instruction effects are simplified.** For example, removing the citation sentence removes inline citations entirely. Real Copilot usually still shows references. The Configure page states this in "How the simulator reads your instructions".
6. **Some product areas are intentionally inert** and explain why when you hover: web search, org chart, capabilities, search, Automations, Customize, voice input, model picker, uploading from the device, ZIP agent download, and "Always allow" / "Approve all" approvals.
7. **Knowledge limits are not enforced.** The 20-source maximum, sensitivity-label checks and Responsible AI validation are not simulated.
8. **Org-wide sharing and catalog submission** are explained but never enabled.
9. **Cowork plan card** is a training aid and is labelled as such. Real Cowork shows progress as skill and tool steps, not a plan to accept.
10. **Revisions** support four presets (shorter, formal, decisions first, owners and dates) plus free text that maps onto those presets.
11. **Exports** are Markdown, HTML, CSV, iCalendar (.ics), email (.eml, marked unsent) and ZIP. **No DOCX, XLSX or PDF** files are generated, so none are offered.
12. **Timing.** Activity times show the real clock converted to SAST, while scenario dates are fixed around 22 September 2026. This keeps the sample content stable.
13. **Persistence is per browser.** Progress lives in `localStorage` on one device, so prototype agent links only open on that browser. Facilitator mode is not access-controlled.
14. **Screen-reader support** was checked through automated role and name assertions and keyboard walkthroughs. It has not been tested with NVDA, JAWS or VoiceOver users. Text scaling for projection uses CSS `zoom`, which is supported in current Chromium, Edge, Safari and Firefox.
15. **Microsoft behaviour changes frequently.** The references were reviewed on 23 Sep 2026. Recheck them before each training wave.
