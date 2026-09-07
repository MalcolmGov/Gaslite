# Protea / ZaraLM — status and how to resume

_Last updated 2026-09-07. All twelve phase PRs are merged; the CPU dress rehearsal has run end to end and the tool-permission guard is in._

## Where the work lives

Nothing is deployed. Every phase is merged to `main` in its repository (merge commits, stack order); the PR
numbers below are the review history.

| Repo | PR | Branch | Phase |
|---|---|---|---|
| MalcolmGov/Gaslite | #14 | `claude/zaralm-v0-build-spec-z0mk40` | 0 — spec review, audit, roadmap (these docs) |
| MalcolmGov/protea | #1 | `phase-1-foundation` | 1 — provider abstraction, configs, registries |
| MalcolmGov/protea | #2 | `phase-2-data-pipeline` | 2 — data pipeline, scanners, golden guard |
| MalcolmGov/protea | #3 | `phase-3-zarabench` | 3 — ZaraBench, judge, release gate |
| MalcolmGov/protea | #4 | `phase-4-training` | 4 — trainer, run dirs, remote GPU adapters |
| MalcolmGov/protea | #5 | `phase-5-inference` | 5 — vLLM engine container, facade, validation gate |
| MalcolmGov/protea | #6 | `phase-7-router` | 7 — model router, canary, confidence, events |
| MalcolmGov/protea | #7 | `phase-10-hardening` | 10 — security suite, release pipeline, load test, economics; also the baselines |
| MalcolmGov/aria | #534 | `phase-6-agent-compiler` | 6 — Agent Compiler v3 behind `ZARA_AGENT_COMPILER=v3` |
| MalcolmGov/aria | #535 | `phase-8-voice-copilot` | 8 — copilot → collector → compiler → draft, `ZARA_COPILOT=v3` |
| MalcolmGov/aria | #536 | `phase-9-observability` | 9 — per-call model fields, feedback, redaction, dashboard APIs |
| MalcolmGov/aria | #537 | `phase-10-security-tests` | 10 — injection / unauthorised-tool / cross-tenant tests |

Work after the merge continues on short-lived branches from `main`: `rehearsal-cpu` in protea (draft PR #8)
carries the local Hugging Face provider, the CPU rehearsal (training config, model card, registry entry,
ZaraBench 0.1.1 and security reports), per-task progress lines for long runs, and a router fix (security-probe
reports were being read as capability evidence). Not merged: waiting for the word.

## What has been measured

ZaraBench 0.1.0 frontier baseline, Claude Sonnet 5 with Claude Opus 5 as judge (report committed under
`evaluation/reports/zarabench-0.1.0/` on protea `phase-10-hardening`): ZaraScore 81%, strict 47%. The failures
were mostly benchmark strictness, fixed in ZaraBench 0.1.1 (same branch). API spend so far: about USD 7.35.

CPU dress rehearsal (protea `rehearsal-cpu`, no GPU, no API spend): `protea-agent-0.0.1` = Qwen2.5-0.5B-Instruct
+ LoRA r16, 150 steps on 400 real examples, 46 min of training on 4 CPU cores (train loss 0.754, eval loss 0.547,
token accuracy 0.90). ZaraBench 0.1.1 without a judge: ZaraScore 51%, strict 26%, 206/206 tasks, no errors
(five hours on CPU). Security probes: strict 38%, only the PII family clean. `protea release check` passes
train and validate, fails zarabench and security, and `release promote --to candidate` is refused with both
blockers, which is exactly the behaviour the pipeline is meant to have for a model this small. Every stage
(train, card, registry, benchmark, probes, gate, promotion, capability matrix) ran end to end with no manual step.

Follow-ups on the same branch (2026-09-07, still free): the untrained base Qwen2.5-0.5B scored 42.6% on an even
30-task sample where the trained adapter scores 45.9% on the same tasks (structured output +48 points, business
reasoning +28, agent generation −52 because long specs hit the 1,500-token cap used for the CPU run). A
tool-permission guard now wraps every model the facade serves (`tool_policy` in `configs/serve/facade.yaml`):
denied tool patterns, amount limits that turn into escalations, confidential system-prompt lines that never come
back out. Behind it the same adapter's security strict score goes from 38% to 78%; what remains (injection via
tool results, cross-tenant data inside tool results) is the model's and aria's tenant scoping to fix. CPU
benchmark runs are about 2.5× faster after the thread fix; `evaluate run --per-category N` gives a quick read.

## To resume

1. Open https://claude.ai/code, pick the **Gaslite** repository in the sidebar, and continue the session named
   "ZaraLM v0 build specification review" — it has the full history — or start a new session on
   **MalcolmGov/protea**, branch `rehearsal-cpu`, and paste: "Read docs/README.md and the Gaslite
   docs/zaralm/STATUS.md, then continue from the next steps."
2. Re-enable the hourly PR check-in routine ("Hourly check-in: protea PRs #1–#7, aria #534–#537, Gaslite #14")
   in the Routines list if you want the PRs babysat again; it was paused with the work.
3. Credentials: the cloud environment "Malcolm" holds `PROTEA_ANTHROPIC_API_KEY` (the bare `ANTHROPIC_API_KEY`
   name is reserved by Claude Code sandboxes and dropped). Rotate it at https://console.anthropic.com/settings/keys
   if in doubt; never paste it into chat.

## Next steps, in order (each paid one waits for an explicit yes)

1. Re-baseline Claude Sonnet 5 on ZaraBench 0.1.1 — about USD 4.50 with the judge. Gives the comparable
   frontier number the release gate uses.
2. Untrained Qwen3-8B baseline on a rented GPU (RunPod L40S/A100, about USD 1 for an hour, 16 GB download on
   that host) — the second number in the comparison; shows which task types a small model is already close on.
3. Decide the synthetic-data teacher policy (docs/data-governance.md in protea), build the training set
   (`protea dataset build`), first QLoRA run with `protea train remote --confirm` (about USD 2 on an A100).
4. Serve the adapter behind the facade, run ZaraBench + the security suite, `protea release check`, then
   canary via the routing policy (`protea release promote --to canary`).
5. Free, any time: say "merge" for protea PR #8 and Gaslite PR #22 once CI is green; refresh
   `configs/economics/zara-v0.yaml` with real volumes; run `protea serve loadtest` against the mock facade.
6. (done) All phase PRs merged 2026-09-06; CPU rehearsal completed the same night.

## Economics reminder

`protea economics report` with the committed forecast says self-hosting costs about USD 1,060/month more than
frontier tokens today; break-even is roughly 2.1× the forecast volume, below the kill multiple of 3. Refresh
`configs/economics/zara-v0.yaml` with real volumes before deciding to train.
