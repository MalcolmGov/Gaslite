# MyInstantAI White-Label Marketplace — Pre-Migration Audit

**Prepared for:** Move Digital (Malcolm Govender) · **Date:** 2026-08-19
**Scope:** `MalcolmGov/miai-agent-marketplace` @ `abcb056` (main) and `MalcolmGov/miai-agents` @ `636eca7` (main)
**Purpose:** Establish what remains before handing the platform to MyInstantAI and migrating from Railway to their Azure infrastructure — with specific focus on "do all agents work as expected" and "are the evals done and validated".

> **Method.** Both repos were cloned and inspected directly. Local quality gates were executed (`pnpm run ci`, full mock eval suite, catalog readiness, go-live certification, Azure Bicep build, all 51 agent-package validations/bundles). Seven independent audit passes (Azure readiness, eval validity, marketplace correctness, agent-package quality, security & multi-tenancy, E2E coverage, integration/docs truthfulness) were run in parallel, and every "blocker"/"high" finding was put through an adversarial verification pass against the cited source. The live Railway staging deployment was probed to corroborate the security findings. Every claim below carries a `file:line`, a command result, or a CI run id.

---

## 1. Verdict

**Do not represent this platform to MyInstantAI as "migration-ready" or "evals validated" yet.** The engineering underneath is genuinely good — this is not a demo dressed up as a product — but the specific comfort you asked for is not supportable today, for two concrete reasons and a list of hard blockers:

1. **"Evals are done and validated" is not true in the sense that matters.** Not one of the 51 agent packages has ever had its evals run against a real model. The marketplace's headline "100% / catalogue-ready" numbers come from a **mock model that replies by echoing each agent's own knowledge file**, and a `heal:evals` script that **rewrites the eval expectations to match whatever the mock said**. The real-model evidence that exists covers **22 of 551 catalogue SKUs (4%), one prompt each, graded only on "reply is longer than 40 characters"**, and is 16 days old.

2. **The Azure migration has not been rehearsed and cannot succeed as the templates stand.** The Bicep compiles, but a default deploy **crash-loops on boot** (auto-generated secrets are shorter than the app's own security floor), and **there is no pipeline to get a container image onto Azure at all**. Every live integration (auth, wallet/billing, model gateway) flips on for the first time during that deploy.

The agents themselves are the good news: **all 51 packages are real, domain-specific, and well-authored** — none is a template shell. "Do the agents work as expected?" — as *authored artifacts*, yes; as *validated-against-a-real-model behaviour*, that has never been measured.

**Overall migration readiness: ~60–65% built, ~15% verified.** The remaining work is well-scoped and mostly known to the team (their own internal punch-lists are candid), but it is real work, not paperwork.

---

## 2. What is genuinely solid (so this is balanced)

These are real, verified strengths — lead with them in the data room, because they are defensible:

- **The 51 agent packages are authored to a consistent, credible bar.** Domain-specific prompts (559–1,317 words), genuinely grounded knowledge (e.g. `grant-stock-planner` carries the real SASSA payout calendar with dates; `mobile-money` carries a fee/limit table its own evals assert; `remittance` lists corridors and KYC docs), 4–5 valid JSON-schema tools each, injection-resistance + POPIA sections in **all 51** guardrails, and 794 evals with real assertions. All 51 pass `validate.py` and bundle cleanly. Files are byte-unique across agents; cross-agent knowledge similarity median is 0.23 — this is not copy-paste.
- **A real security spine.** Runtime guardrails applied to both mock and live models (not prompt-only), workspace-scoped storage queries (so prompt injection cannot cross tenants), DNS-pinned SSRF guard on crawl/webhooks, AES-256-GCM at rest for new OAuth tokens, PKCE + HMAC-signed OAuth state, per-request CSP nonce with `strict-dynamic`, no committed secrets (gitleaks in CI), and boot hardening that fails closed in genuine production.
- **Real persistence and adapters, not stubs.** Postgres-primary with lazy migrations, read-through stores that are replica-safe for durable data, a real `jose`-based OIDC verifier, a real HTTP wallet adapter, and an OpenAI-compatible gateway model adapter with SSE streaming and tool-calling.
- **CI green on main**, 50 web/wallet/connector unit tests passing, daily staging E2E green through Aug 18, and the Azure Bicep template genuinely defines the full stack (Container Apps, Postgres Flexible Server, Key Vault with RBAC/UAMI, Azure Files, Log Analytics, App Insights) and compiles clean under bicep 0.46.1.
- **Unusually honest internal docs.** Their own `technical-audit-update`, punch-lists, and the eval scoreboard's "honest labeling" section already flag most of what this audit confirms. The gap is follow-through, not self-awareness.

---

## 3. The two claims you specifically asked about

### 3.1 "Are the evals done and validated?" — **No, not in a way you can stand behind.**

| What is claimed | What is actually true | Evidence |
|---|---|---|
| "Full catalogue evals — 100% runtime (3848/3848)" | The committed eval report is **static-only, zero conversations executed**. A fresh full mock run today is **95.5% (8126/8513)**, not 100%. | `docs/MIGRATION_P1.md:41`, `docs/CATALOGUE_READY.md:37` vs `data/reports/eval-results.json` (mode `static-only`); local run today |
| Evals prove agent quality | The mock "runtime" is `MockModelAdapter` — **canned responses assembled from the agent's own knowledge file**. Passing proves the package is self-consistent, not that any model behaves. | `packages/runtime/src/index.ts:596–1675` |
| Pass rates are earned | `heal:evals` **rewrites expectations to match the mock's own output** ("Align expect with what the mock actually said last run"), injects eval phrases into 352 of 551 knowledge files, and deletes failing tool/negative expectations. Pass rate went 49.2% → 100% via this. | `scripts/heal-eval-failures.mjs:115–163`; `docs/reports/eval-gap-2026-07-31.md` |
| CI gates on evals | CI runs `--static-only`, which **executes zero conversations** (mock or real). It checks metadata only. | `.github/workflows/ci.yml:47`; `scripts/eval-suite.mjs:270` |
| Nightly evals run | `eval-nightly.yml` is **syntactically broken** (secrets context in a job-level `if`) and **has never produced a successful run** — 30/30 recent runs failed. Live-LLM evals have never run in CI. | Workflow run history (all `failure`); `eval-nightly.yml:36,68` |
| Real-model coverage | **22 of 551 SKUs (4%)**, all `us-*`, one prompt each, dated 2026-08-03, graded "reply > 40 chars and not an error" — a wrong price or hallucinated policy still passes. | `docs/reports/eval-live-2026-08-03-*.md`; `scripts/eval-live.mjs:169–173` |

**The good news:** the *portable* `miai-agents` repo ships a genuinely well-built live harness (`tools/run_evals.py`: real API calls, tool stubs, LLM-judge for refusals/language, `--repeat` majority voting) covering 794 cases across 51 agents. It has simply **never been run to completion** — no result artifact is committed, and the README itself lists this as the "next step". **This is the single highest-leverage thing to do before handover: actually run it, fix a real pass criterion, and commit the results.**

### 3.2 "Do all agents work as per expectation?"

- **As authored packages:** Yes — 51/51 are real, validate, bundle, and carry substantive prompts/knowledge/tools/guardrails/evals. None sampled (including the "likely weak" late tranche) is a shell.
- **As runtime behaviour on the platform:** **Unverified, and partly overridden.** The shipped image defaults to the mock model (`Dockerfile:41`), and even with a real key, **~22 flagship agents are intercepted by a deterministic scripted-workflow layer** that answers first when its keyword matching claims the turn (`packages/runtime/src/index.ts:2221–2506`) — paying tenants would get canned decision-tree replies, not the advertised LLM, for many interactions. The tool loop can also **fabricate booking/application references** (`BK-3391`, `APP-4821`) when a live tool omits the field (`index.ts:2639–2650`).
- **Count reconciliation for the data room:** the brief says "44 agents"; there are actually **51** authored packages. The storefront catalogue advertises **~601 ids** (500 in `index.json`, incl. `africa-*` variants) — roughly **12× more SKUs than there are source packages**. 49 of 100 "sellable families" have **no source package** in `miai-agents`.

---

## 4. Blockers — must be closed before handing to MyInstantAI / cutting over to Azure

Each was independently verified against source (and, where noted, against the live deployment).

**B1 — Live staging runs mock auth on the public internet; all API authorization is client-header-trusted.**
`/api/health` today returns `authMode: mock, mockRailsAllowed: true` on a real Postgres with a live model. I demonstrated this live: an unauthenticated request with forged `x-roles: owner,operator` and an arbitrary `x-workspace-id` returned **HTTP 200 with wallet balance and the operator ops summary**. Tenant isolation currently reduces to a single operational step at cutover (set `MIAI_AUTH_MODE=oidc`, unset the two `*MOCK_RAILS*` ack flags). If that step is missed or mis-copied into Azure, the production platform is wide open. *Evidence: `apps/web/src/lib/auth.ts:41–83`, `security-flags.ts:24–27`; live probe 2026-08-19.*

**B2 — The OIDC cutover — the only barrier between B1 and a safe production — has no integration test.** No CI/E2E test verifies JWT-against-JWKS, roles→RBAC mapping, or that a token for workspace A is denied workspace B's data. The isolation model the platform advertises is entirely unverified. *Evidence: `apps/web/src/lib/auth.ts:85–117`; only coverage is `api-contract.test.mjs:71–78` (missing-Bearer 401).*

**B3 — No billing or payment integration exists anywhere.** Renting an agent debits nothing (`/api/rent` records `priceUsd` to the audit log only); wallet top-up adds tokens for free in mock mode; the only non-mock path (`HttpWalletAdapter`) targets a MyInstantAI wallet API that, per the code's own comment, **does not exist yet**. MyInstantAI cannot take a paying tenant live until that API is built. *Evidence: `apps/web/src/app/api/rent/route.ts:40–62`; `RentPayPanel.tsx:137,238`; `packages/wallet-adapter/src/index.ts:88–155`.*

**B4 — No real-model eval validation for any agent.** See §3.1. The repo's own ship-ready criterion #3 ("all evals pass against the real primary model") has never been met for any of the 51 agents. *Evidence: `spec/agent-package.md:94`; `README.md:90–91`; no eval report committed anywhere.*

**B5 — `heal:evals` makes pass rates self-fulfilling.** Any handover that presents mock pass rates as quality is presenting a number engineered to be 100%. This must be retired from commercial docs and the healed knowledge files quarantined before customer-facing agents retrieve and quote the injected filler. *Evidence: `scripts/heal-eval-failures.mjs:122–163`; `docs/MIGRATION_P1.md:41`.*

**B6 — Azure deploy crash-loops on first boot.** The Bicep default-generates 13-character `uniqueString()` secrets; with `MIAI_AUTH_MODE=oidc` + `NODE_ENV=production` baked in, the app's own boot hardening rejects secrets < 16 chars and `assertBootHardening()` throws, so health probes never pass. Worse, `uniqueString()` is deterministic from the (non-secret) resource-group id — and embed publishable keys are HMACs under this secret, so a predictable secret makes `mia_pk_` keys **forgeable**. *Evidence: `infra/azure/main.bicep:61–63,309,318`; `apps/web/src/lib/security-flags.ts:35–41`; `docs/MIGRATION_RUNBOOK.md:92–102` (deploy command omits the overrides).*

**B7 — There is no path to get a container image onto Azure.** No GitHub Actions workflow builds/pushes an image; the only thing that builds the Dockerfile is Railway. The example image ref (`ghcr.io/MalcolmGov/...`) is invalid (uppercase in a Docker path) and points at an image that does not exist, and the Container App template configures **no registry credentials**, so even a valid private image cannot be pulled. *Evidence: `.github/workflows/` (only `ci.yml`/`e2e-staging.yml`/`eval-nightly.yml`); `infra/azure/main.bicep:241–292` (no `registries` block); `parameters.example.json:6`.*

**B8 — No server-side per-tenant domain lock on embed/app chat.** The embed key is public by design (visible in every customer's page source), CORS only constrains browsers, and there is no origin check inside the turn handler — so **anyone who lifts a tenant's public key can run live LLM turns billed to that tenant's wallet** (~43k turns/day past the 30/min cap) and drive their agent to `paused_no_tokens`. This persists under OIDC because the embed channel is intentionally unauthenticated. *Evidence: `apps/web/src/lib/agent-js-script.ts:14,213`; `store.ts:458–480`; `lib/channel-turn.ts` (no origin field).*

**B9 — Embed keys cannot be rotated or revoked per tenant.** The key is a pure function of `workspaceId+agentId+global secret`; the only way to invalidate one leaked key is to rotate `EMBED_KEY_SECRET`, which **breaks every other tenant's installed widget simultaneously**. For a white-label platform this is an operational dead end during a compromise. *Evidence: `apps/web/src/lib/store.ts:23–28`.*

**B10 — Every MyInstantAI-side integration input is still unconfirmed.** OIDC issuer/JWKS + sample JWT, wallet API contract, model gateway URL/alias map, Azure subscription/RG/Key Vault access, custom domain/DNS, agent-package import shape, WhatsApp WABA ownership, prepaid-card APIs — **no doc records a single confirmed answer.** Move Digital's own kickoff brief says: "Without items 1–3 in writing (even staging stubs), the first sprint stays infra-documentation only." *Evidence: `docs/PARTNERSHIP_KICKOFF_BRIEF.md:41–57`; `docs/MIGRATION_P0.md:53–61`.*

**B11 — Four mutually incompatible commercial models ship side by side.** (A) the live product charges rent tiers **and** sells prepaid token top-ups; (B) the Aug-3 commercial pack says agents are **free**, tokens-only; (C) `miai-agents` README says monthly tiers with **no prepaid tokens, no top-ups**; (D) `spec/prepaid-cards.md` sells capacity cards with "no tokens anywhere" — with card SKUs **baked into all 551 catalogue manifests** but **zero redemption code**. MyInstantAI must be handed one model, with code and docs reconciled to it. *Evidence: `constants.ts:3–7`; `miai-agents/README.md:85–86`; `spec/prepaid-cards.md:51`; `MONDAY_COMMERCIAL_PACK.md`.*

---

## 5. High priority — should be closed before, or contractually owned at, cutover

- **H1 — All three live rails (OIDC, HTTP wallet, model gateway) flip on for the first time at Azure deploy.** Adapters are real but have never touched a real endpoint. Test each against staging first. Note: `auth.ts:27` defaults JWKS to `{issuer}/.well-known/jwks.json`, which is **wrong for Entra ID** (`{issuer}/discovery/v2.0/keys`) — `MIAI_OIDC_JWKS_URL` override is likely mandatory. There is **no native Azure OpenAI adapter** (api-key header / deployments path / api-version unsupported); Azure OpenAI works only via its OpenAI-compatible surface or a MyInstantAI proxy, and `MIAI_MODEL_PASSTHROUGH=1` sends aliases like `claude-sonnet`/`gpt-4o-mini` **unmapped**. *`infra/azure/main.bicep:318–328`; `packages/runtime/src/index.ts:1983–1985`.*
- **H2 — Bicep allows scale to 5 replicas but provisions no Redis; sessions and rate limits are in-process.** Durable data (rentals/audit/tokens) is replica-safe via Postgres read-through, but chat sessions and rate limiting fall back to per-process memory unless Upstash Redis is configured — and the template neither provisions it nor sets sticky sessions. Container Apps applies a default HTTP scale rule, so scale-out is the default. Set `maxReplicas: 1` for cutover **or** add Redis + session affinity. *`infra/azure/main.bicep:359–362`; `.env.example:73–74`.*
- **H3 — Connector OAuth credentials are entirely absent from the Azure template.** The headline connector feature (Google/Microsoft/Slack/Shopify/HubSpot/Xero/QuickBooks/Calendly/Zendesk) needs ~20 env vars + `WEBHOOK_SINK_SECRET`/`MCP_SINK_TOKEN` that have no Key Vault/container entry — every "Connect" flow fails on Azure until added, and each provider's redirect URI must be re-registered (some have review lead times). *`infra/azure/main.bicep:308–335`.*
- **H4 — Token metering is a character-count estimate; provider usage is never read.** Every wallet debit — the unit you'd bill against — is `max(200, chars/4) × multiplier`, and the system prompt includes up to 40k chars of knowledge, so estimate vs reality diverge systematically. Switch to provider-reported usage before charging anyone. *`packages/wallet-adapter/src/index.ts:181–191`.*
- **H5 — DSAR erasure does not scrub Postgres audit rows.** On the production backend, right-to-erasure leaves `miai_audit` rows (userId/email, sessionId, unredacted `tool_error` args containing harvested customer contact details) in place — `redactWorkspaceAuditDetails` only mutates the in-memory array. A GDPR/POPIA gap. *`apps/web/src/lib/dsar-erase.ts:35`; `store.ts:571–583`.*
- **H6 — The runtime package's 66 unit tests are excluded from CI.** The most behaviour-critical package (turn engine + all flagship workflow logic) is never exercised on merge to main. One-line fix, but it must land so turn-path regressions are caught. *`package.json:31,37`; `ci.yml:41–42`.*
- **H7 — E2E pack validates the demo, not production.** All 83 scenarios run in mock-rails mode (header-trust identity, mock auth/wallet). **No test covers**: payment/top-up success, token debit/exhaustion, an OAuth connect/callback flow, executing `agent.js` on a third-party page, or **multi-tenant isolation** (every test uses one hardcoded workspace). The `apps/runtime` worker has zero coverage at any layer. *`playwright.config.ts:30–34`; `e2e/api/wallet-contract.spec.ts`.*
- **H8 — Docs claim quality that does not exist.** "Nightly evals" (three docs) never ran; "100% runtime (3848/3848)" is contradicted by the committed static-only report. `PLATFORM_INTEGRATION.md` (the "binding agreement" doc) and `TECHNICAL_SPEC.md` still describe a **4-market / 55-family** catalogue vs the shipped **5-market / 100-family** one. Correct these before MyInstantAI inherits them as ground truth. *`README.md:24`; `docs/PLATFORM_INTEGRATION.md:15`; `docs/TECHNICAL_SPEC.md:271–276`.*
- **H9 — Catalogue import is a footgun and the export adapter doesn't exist.** `scripts/import-catalog.mjs` defaults to `../miai-agents-audit/agents` (a path that doesn't exist), and if pointed at the real repo would **overwrite the curated 500-SKU `index.json`** with a 51-entry flat array. The README implies a platform export adapter "(see tools/)" — it does not exist; only canonical `miai.agent-package/v1` bundles do. *`scripts/import-catalog.mjs:8–10,33–56`; `miai-agents/README.md:14–16,81`.*

---

## 6. Medium / Low — acceptable to carry into the post-migration backlog

- Validate-azure.sh only compiles Bicep (no `what-if`/param check); Postgres is public-network + allow-all-Azure firewall, burstable, no HA; custom domain/Front Door/DNS entirely outside the template. *(`infra/azure/main.bicep:206–234`.)*
- `/api/ops` has no role gate (cross-workspace reads in mock mode — corroborated live in B1); OIDC public-path lists diverge (`middleware.ts` vs dead `isPublicApiPath`); admin "narrative" mode can serve fabricated pitch-deck economics — delete before transfer. *(`api/ops/route.ts:8–21`; `insights.ts:284–418`.)*
- OAuth token store still accepts legacy v1/plaintext envelopes on read; strong-secret validation is skipped under mock rails; one global secret encrypts all tenants' tokens. Re-seal to v2 and enforce Key Vault. *(`packages/connectors/src/oauth/tokens.ts:90–113`.)*
- Migrations run lazily on first query with a single-file system (`001_init` hardcoded); 4 routed pages are `ComingSoon` placeholders; `apps/runtime`/`apps/connectors` are honestly-labeled scaffolds — ship or delete, don't hand a partner dead services.
- Wallet balance leaked in unauthenticated embed replies; `/api/ask/chat` rate limit bypassable via client-supplied sessionId; E2E is Chromium-only and mutates shared staging with no teardown; scenario counts stale (README "76", handover doc "78", actual 83); `SECURITY.md` advisory URL points at a nonexistent org path; `apps/web/README.md` is create-next-app boilerplate.
- `configure.py --check` never validates tenant configs against the schema; configured tenant packages copy template evals verbatim (assert fictional fixture facts); `marketing-assistant` is the only agent with no multi-turn eval.

---

## 7. Azure migration runbook — the concrete gap list

The `MIGRATION_RUNBOOK.md` / `MIGRATION_P0.md` are real and accurate as far as they go, but the following must exist and be exercised before a cutover date is credible:

1. **Fix the secret defaults** (B6): require explicit ≥32-char secrets for `oauthTokenSecretParam`/`oauthStateSecretParam`/`embedKeySecretParam`; add them to `parameters.example.json` and the runbook deploy command.
2. **Build an image pipeline** (B7): Actions workflow → build Dockerfile → push to ACR (or lowercase GHCR) on main/tags; fix the invalid image ref.
3. **Give the Container App registry access**: provision ACR + `AcrPull` for the UAMI, or add `configuration.registries` credentials.
4. **Create a deploy pipeline / documented `az` procedure** with a pinned image tag and a `smoke:cutover` gate — nothing deploys to Azure today.
5. **Run `az deployment group what-if` / `validate`** against a real subscription — the template has only ever been *compiled*.
6. **Add all connector + webhook/MCP secrets** to Key Vault + container env (H3), and re-register every OAuth redirect URI to the Azure host.
7. **Decide the scale story** (H2): `maxReplicas=1` for cutover, or Redis + session affinity.
8. **Obtain and test MyInstantAI's three live rails against staging** before cutover (H1), including the Entra-ID JWKS path and the model-alias mapping.
9. **Script/document the custom domain + managed cert + Front Door/DNS** — every OAuth/embed/App URL derives from `APP_BASE_URL` matching the real host.
10. **Harden Postgres** (VNet/private endpoint, production SKU + HA, longer backups) and verify the admin password has no URL-breaking characters (it is string-interpolated into `DATABASE_URL`).
11. **Repoint the daily E2E workflow + `playwright.config.ts` baseURL** at Azure at cutover, and add a Playwright-install retry/cache (the Aug-19 run was cancelled by a 25-min browser-install hang — an infra flake, not a test failure) plus failure alerting (all three E2E jobs are `continue-on-error` and silent today).
12. **Rotate every secret shared with Railway** after cutover.

---

## 8. Open questions MyInstantAI must answer in writing before work starts

1. **OIDC:** issuer, audience, JWKS URL (Entra-ID form), and a sample JWT carrying `workspace_id` / `user_id` / `roles` (incl. `owner`).
2. **Wallet/billing API:** base URL + key, and the `GET /v1/wallets/:id` · `POST /debit` (idempotency-key) · `POST /topup` contract with pause-on-zero semantics — or confirmation that Move Digital builds it.
3. **Model gateway:** URL, key, tool-calling support, and the alias map — or explicit "use Azure OpenAI via its OpenAI-compatible surface".
4. **Azure access:** subscription, resource group, Key Vault, and who owns DNS / Front Door / the custom domain.
5. **Agent-package import shape:** the concrete format their builder/import API expects (today only canonical `miai.agent-package/v1` bundles exist on both sides).
6. **Commercial model:** which of the four (B11) is the real one.
7. **WhatsApp WABA and native-app channel ownership.**
8. **Prepaid-card program:** is it live scope (needs PIN issuance + metering + redemption APIs, none of which exist) or spec-stage?

---

## 9. Recommended sequencing (highest leverage first)

1. **Run the real evals.** `python3 tools/run_evals.py --all --repeat 3 --json` against the primary models with an independent judge, commit the report, add per-agent eval metadata. This directly answers "are the evals validated" and is a day or two of work. *(B4, B5.)*
2. **Get the MyInstantAI answers in writing** (§8) — nothing on the Azure critical path can start without OIDC/wallet/model/DNS. *(B10.)*
3. **Close the security cutover blockers**: OIDC integration test, embed domain lock + key revocation, DSAR Postgres scrub, and a checklist assertion that production never boots in mock rails. *(B1, B2, B8, B9, H5.)*
4. **Make Azure deployable**: secret defaults, image pipeline + registry, deploy pipeline, `what-if`, connector secrets, Redis/scale decision. *(B6, B7, H2, H3.)*
5. **Reconcile the commercial model and the docs** so the data room is internally consistent. *(B11, H8, H9.)*
6. **Then** rehearse a full Azure staging deploy end-to-end and re-run the handover E2E pack against it before naming a cutover date.

---

*Appendix — verification artifacts: local `pnpm run ci` (pass), full mock eval suite 95.5% (8126/8513), `catalog:ready` 551/551, `certify:golive` 100/100, Azure `bicep build` clean (5 warnings), all 51 agent `validate.py`/`bundle.py` clean, live `/api/health` + forged-header probe on Railway staging. CI history: `ci.yml` green on main; `eval-nightly.yml` 30/30 failure; `e2e-staging.yml` green through Aug 18, Aug 19 cancelled (browser-install hang).*
