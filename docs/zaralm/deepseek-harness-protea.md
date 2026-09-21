# DeepSeek Harness × Protea — minimal-profile test

_2026-09-19, CPU pilot: read-only against `MalcolmGov/protea` at `556b0b5` (main, 2026-09-16), no Protea code
changed; everything needed to repeat it lives under `docs/zaralm/harness/`. 2026-09-20, GPU run: the same profile
against vLLM on a rented H100, which did change Protea — five deployment fixes, listed in that section's finding 6._

## What was done

DeepSeek Harness (`@deepseek-ai/dsh` 0.1.5-rc.2, MIT, developer preview) was installed, pointed at the Protea
inference facade as an OpenAI-compatible model provider, and run headlessly in the shape of its shipped `minimal`
agent preset (one persona, one `bash` tool, no compaction) against two Protea-served models on CPU. This is the
first multi-turn, tool-using exercise of a Protea-served model outside ZaraBench: the harness supplies the agent
loop, the sandbox and the tools; Protea supplies the model behind its deployed facade, tool-permission guard
included.

## Setup

| Piece | Value |
|---|---|
| Harness | `@deepseek-ai/dsh` 0.1.5-rc.2 (`npm install --ignore-scripts`, 522 packages), Node 22.22.2 |
| Protea | main `556b0b5`, Python 3.11.15, `.[dev,serve,train-cpu]`, torch 2.14.0+cpu, transformers 5.17.0, peft 0.21.0 |
| Host | 4 CPU cores, 16.9 GB RAM, no GPU (a Claude Code cloud session) |
| Facade | `protea serve facade --config docs/zaralm/harness/facade-harness.yaml`, backend `local` (in-process Hugging Face model), bearer token required, tool-permission guard exactly as in `configs/serve/facade.yaml` |
| Model A | `Qwen/Qwen2.5-0.5B-Instruct` — Protea's default `local` model (988 MB) |
| Model B | `Qwen/Qwen3-1.7B` @ `70d244cc` — the local development model decided on 2026-09-16 (`configs/models/qwen3-1.7b.yaml`, 4.0 GB), `PROTEA_LOCAL_ENABLE_THINKING=false` |
| Harness profile | `protea-min`: the shipped `headless` profile plus the patch in `docs/zaralm/harness/protea-min.cordis.patch.yml` |
| Permission mode | `DSH_PERMISSION_MODE=workspace-write`, approval policy `ask` (no answerer in headless mode, so any approval request fails closed) |
| Telemetry | `DSH_TELEMETRY_MODE=DISABLED` (the default posts feedback-only telemetry to `harness-telemetry.deepseeksvc.com`) |
| Workspace | `docs/zaralm/harness/calc.py` + `test_calc.py`: three functions, `subtract` deliberately returns `a + b`, one failing test |

Two deliberate differences from the deployed facade config, both recorded at the top of `facade-harness.yaml`:
the bind is loopback only with the rate limit off, and the Zara guardrail system prompt
(`configs/evaluation/guardrail-system-prompt.md`) is not merged in, because it frames the model as a marketplace
customer-service agent, which is the wrong framing for a coding-agent harness. The guard (`tool_policy`) is kept.

### The provider route

The whole model side of the harness configuration is one provider entry in the profile patch:

```yaml
- id: llm-pi-ai
  config:
    providers:
      protea:
        apiKeyEnv: PROTEA_FACADE_TOKEN
        api: openai-completions
        baseURL: http://127.0.0.1:8080/v1
        models:
          - id: protea-agent
            contextWindow: 32768
            maxTokens: 2048
- id: agent-default-model
  config: {provider: protea, model: protea-agent}
```

`protea-agent` is the facade's `served_model`, so nothing in Protea had to learn a new name. The facade's SSE
stream (role chunk, content chunks, a `tool_calls` delta, a usage chunk, `[DONE]`) and its non-streaming shape were
both consumed by the harness's OpenAI Chat Completions adapter without any change. Wiring was proved first with the
facade's `mock` backend: the harness booted, called `/v1/models` and `/v1/chat/completions`, and printed the mock's
`OK` in one second.

### Why the shipped `minimal` preset is not used as-is

The harness ships `minimal` under `@deepseek-ai/dsh-agent-presets/presets/minimal/agent.cordis.yml` (a `dsh-persona`
row plus a persistent-shell group). Mounting `dsh-agent-presets` with `default: minimal` in the headless profile
composes nothing: in 0.1.5-rc.2 the preset plugin only joins agents that a caller mounts through
`AgentPresets.mount()`, which the Web session controller does and the headless runner does not, and the session
then runs on the host's full tool roster.

**Corrected 2026-09-21.** This paragraph used to say the plugin's `agent/created` listener "just logs a warning
that the agent was published without joining an agent preset". That warning string is in the package, but a
reproduction against a clean 0.1.5-rc.2 install shows it never reaches the operator on the headless path — not
on stdout, not on stderr, not at debug level, where the word "preset" appears zero times. The failure is
entirely silent, which is worse than the paragraph claimed and is the point of the upstream report in
`harness/upstream-headless-preset-report.md`. The reproduction also puts a number on "full tool roster": a
profile mounting the plugin with `default: minimal` sent **25 tools** — the host's complete set — where the
preset composes one persistent shell. The first two runs below went through exactly that and were
kept as the "standard composition" baseline. The `protea-min` patch therefore expresses the minimal shape directly:
it disables every host tool row except `tool-bash`, disables plan mode, compaction and the tool-repeat reminder,
and replaces the persona with the preset's one line. What the model then sees is one `bash` tool and a 190-character
system prompt. The one difference from the shipped preset is that the host `bash` runs each command in a fresh
shell rather than a persistent one.

## Runs

Every run is `run-task.sh <label> "<task>"` in the seeded workspace, reset with `git checkout` between runs. Wall time
is the whole `dsh` process; step latency is model time per assistant message; input tokens are per model call as
the harness counted them.

| Model | Composition | Task | Steps | Wall | Input tokens / call | Outcome |
|---|---|---|---|---|---|---|
| 0.5B | standard (25 tools) | list files, name the failing test | 2 | 47 s | 7,142 | Called `glob` with `**/*.{txt,.md}`, got "No files found", answered "None of the files were found". Wrong. |
| 0.5B | standard (25 tools) | fix the failing test | 2 | 59 s | ~7,100 | Called a tool named `pytest` that does not exist. Protea's guard fed the unknown-tool error back once, then stripped the call; the model answered "I don't recognize the tool 'pytest'". No file changed. |
| 0.5B | minimal (bash) | reply "harness online" | 1 | 2 s | 997 | "Harness online." |
| 0.5B | minimal (bash) | list files, name the failing test | 2 | 7 s | 1,030 | Ran `ls`, listed the three files correctly, ignored the second half of the question. |
| 0.5B | minimal (bash) | fix the failing test | 2 | 8 s | 1,030 | Called `bash` with `command` and `timeoutMs` but without the required `description`; the harness rejected the call ("missing required property"), the model gave up. No file changed. |
| 1.7B | minimal (bash) | list files, name the failing test | 2 | 27 s | 1,007 | Ran `ls` (with a description and a timeout), listed the files, then declined: "I cannot determine which test fails without additional information." |
| 1.7B | minimal (bash) | fix the failing test | 5 (stopped) | 374 s | 1,034 → 2,409 | Ran `python -m pytest -q`, read the failure, diagnosed it correctly ("`subtract` returns `a + b` instead of `a - b`"), then called `vim calc.py` four times in a row, each ending in the 60 s timeout. Stopped by hand after step 5. No file changed. |

Per-step latency on this host: 0.5B about 3 s per step under the minimal composition and 18–27 s under the standard
one; 1.7B about 12–35 s per step under the minimal composition. The standard composition's cost is almost entirely
tool schemas: the harness's own context breakdown for the 0.5B standard run was 1,147 system-prompt tokens, 6,187
tool-schema tokens and 243 message tokens.

### The 1.7B bug-fix run in detail

1. Step 1 (14 s): `bash {"command":"python -m pytest -q","description":"Run pytest to find the failing test in
   calc.py","timeoutMs":30000}`. Correct call, correct arguments, and it read the pytest output.
2. Step 2 (35 s): "The test `test_subtract` is failing because the function `subtract` is returning `8` instead of
   `2` … This indicates a bug in the `subtract` function. Let's fix the bug in `calc.py`", followed by
   `bash {"command":"vim calc.py", …}`.
3. `vim` is interactive, so the command never returned on its own. The harness's 60 s bash timeout applies: the
   first `vim` was killed by hand at 54 s (just before the timeout would have fired, out of impatience), the
   second timed out at 60.1 s with `[timed out after 60000ms] [killed by signal: SIGTERM]`, and both results
   carried vim's screen dump plus "Output is not to a terminal" back to the model.
4. Steps 3, 4 and 5 (31–39 s each) were the same message, word for word from step 4 on: "The `subtract`
   function is still returning `a + b` instead of `a - b`. Let's fix this bug and run the tests again." followed by
   the identical `vim calc.py` call. The diagnosis was right every time; the model never chose a non-interactive way
   to edit the file (`sed`, a heredoc, `python -c`). Context grew from 1,034 to 2,409 input tokens as each vim screen
   dump was appended. The run was stopped after step 5, 374 s in, with the loop established; `calc.py` was
   untouched and the test still failed.

## Findings

1. **Protea's facade is a drop-in model provider for the harness.** One provider entry, no facade change, streaming
   and tool calls both consumed as-is. The same `protea-min` profile will work unchanged against the real vLLM
   facade on a GPU host; only the facade's backend changes.
2. **Tool-schema volume is the first-order cost for a Protea-sized model.** The standard composition puts 6.2k
   tokens of tool schemas in front of every call; the minimal one puts about 0.2k. On this CPU that was the
   difference between 3 s and 27 s per step for the 0.5B model, and the small model also chose worse tools when it
   had 25 of them (a mis-globbed `glob`, a hallucinated `pytest`). This is direct evidence for the "send only the
   relevant tools" job of Protea's context builder and for keeping aria's per-agent tool catalogs short.
3. **The observed failure modes are the ZaraBench categories.** Schema adherence (a required argument omitted),
   hallucinated tool names, partial task completion and a refusal to investigate map onto `tool_calling`,
   `instruction_following` and `failure_recovery`. The harness's strict argument validation is a useful external
   check: Protea's guard verifies that a called tool exists and is permitted, and it strips or escalates on that
   basis, but it does not validate arguments against the tool's JSON schema. A required-property check in
   `serving/guard.py`, or in ZaraBench's `tool_calling` scorer, would have caught the 0.5B `description` miss.
4. **The guard's unknown-tool retry was visible from outside.** In the standard-composition fix run the model's
   `pytest` call never reached the harness; the guard consumed it (`unknown_tool_retries: 1`), which is the deployed
   behaviour and worked as designed.
5. **Interactive commands cost a timeout each, and a small model repeats them.** A 1.7B model reaching for `vim`
   is a predictable small-model move. The harness's per-command timeout (60 s on the `bash-sandbox` row) did end
   each one and reported it clearly, which is the right executor behaviour; the model then read the failure and
   called `vim` again, three times in a row. The `repeat-tool-reminder` row that the standard composition mounts
   exists for exactly this and is absent from the minimal shape. For unattended use of the harness (or of aria's
   runtime with a shell tool): keep a hard per-command timeout, keep a repeated-call breaker, and put "no interactive
   editors; edit files with sed, python or heredocs" in the prompt.
6. **Harness caveats worth knowing before relying on it.** `dsh-agent-presets` does not compose headless sessions
   (finding above); the default telemetry mode phones home unless `DSH_TELEMETRY_MODE=DISABLED`; the approval seam
   fails closed in headless mode, which is correct but means a `sandbox_permissions` escalation can never succeed
   unattended; the README warns of compatibility-breaking changes, and the rc line moved from 0.1.2 to 0.1.5 in
   two weeks. CVE-2026-82533 (the unauthenticated local web interface, CVSS 9.4) is fixed from 0.1.2-alpha.2, and
   the `web` profile was never started here.

## How to reproduce

```bash
# Protea (CPU): base package + serve + CPU training stack, then download the two models
cd protea && python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev,serve]" && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -e ".[train-cpu]"
python -c "from huggingface_hub import snapshot_download as d; d('Qwen/Qwen2.5-0.5B-Instruct'); d('Qwen/Qwen3-1.7B', revision='70d244cc86ccca08cf5af4e1e306ecf908b1ad5e')"

# Harness: one npm package, install scripts off, its own home directory
export HARNESS_ROOT=$HOME/protea-harness PROTEA_ROOT=$PWD
mkdir -p $HARNESS_ROOT/dsh $HARNESS_ROOT/logs $HARNESS_ROOT/protea $HARNESS_ROOT/workspace
cp docs/zaralm/harness/{run-task.sh,facade.sh,decode-session.js,summarize-session.js} $HARNESS_ROOT/
cp docs/zaralm/harness/facade-harness.yaml $HARNESS_ROOT/protea/
cp docs/zaralm/harness/{calc.py,test_calc.py} $HARNESS_ROOT/workspace/ && git -C $HARNESS_ROOT/workspace init -q && git -C $HARNESS_ROOT/workspace add -A && git -C $HARNESS_ROOT/workspace commit -qm seed
cd $HARNESS_ROOT/dsh && npm init -y >/dev/null && npm install --ignore-scripts @deepseek-ai/dsh@0.1.5-rc.2
export DSH_HOME=$HARNESS_ROOT/dsh/home
./node_modules/.bin/dsh --profile protea-min --from-default-profile headless --dump-config >/dev/null
cp $PROTEA_ROOT/docs/zaralm/harness/protea-min.cordis.patch.yml $DSH_HOME/profiles/protea-min/cordis.patch.yml

# Facade on the 1.7B, then one task
$HARNESS_ROOT/facade.sh start 1.7b PROTEA_LOCAL_MODEL=Qwen/Qwen3-1.7B PROTEA_LOCAL_REVISION=70d244cc86ccca08cf5af4e1e306ecf908b1ad5e PROTEA_LOCAL_ENABLE_THINKING=false
$HARNESS_ROOT/run-task.sh q17m-fix "The test suite in this directory has one failing test. Run python -m pytest -q, find the bug in calc.py, fix it, and run the tests again to confirm they pass."
$HARNESS_ROOT/facade.sh stop
```

`run-task.sh` prints the decoded transcript (tools offered, prompt size, per-step latency and token counts, every
tool call and result) and leaves the raw session under `logs/`. The session log is zstd-framed JSONL; Node 22's
`zlib.zstdDecompressSync` handles one frame, so `decode-session.js` splits on the frame magic first.

## GPU run (2026-09-20)

_Qwen3-4B and Qwen3-8B served by vLLM on rented H100s, driven by the same `protea-min` profile as the CPU pilot.
Two runs: the 4B and a first 8B attempt together (`20260920T070103Z`, whose 8B rows turned out to be the 4B
answering twice — see below), then the 8B alone (`20260920T073935Z`). Six blockers were found and fixed getting
here; they are listed at the end because each is a finding about the deployment path, not incidental noise._

### Setup differences from the CPU pilot

| Piece | CPU pilot | This run |
|---|---|---|
| Host | 4 CPU cores, 16.9 GB RAM, no GPU | RunPod **h100-80gb**, secure cloud |
| Engine | facade `local` backend (in-process transformers) | **vLLM 0.11.0**, the production path (ADR-009) |
| Models | Qwen2.5-0.5B-Instruct, Qwen3-1.7B | **Qwen3-4B** @ `1cfa9a72` (8B attempted, not measured) |
| Image | local venv | `ghcr.io/malcolmgov/protea-train@sha256:9e189379…` |
| Everything else | — | unchanged: `minimal` composition, one `bash` tool, 190-char system prompt, thinking off, no guardrail overlay |

Engine startup on the H100, from `vllm.log`: weights downloaded in 21.7 s, model loading 23.3 s (7.56 GiB),
`torch.compile` 24.3 s of which 19.2 s was the dynamic-shape graph, CUDA graph capture 5 s (0.83 GiB), 57.98 GiB
left for KV cache at `gpu_memory_utilization 0.9`, maximum concurrency 51.5x for 8192-token requests. `init engine`
reported 39.57 s in total; the API server was accepting traffic about 2.5 minutes after the container started. The
facade came up in front of it unchanged, and its smoke call returned `ready` with `latency_ms: 70`.

### Runs

Run `20260920T070103Z`. The same three task texts and the same seeded workspace as the CPU pilot. Wall time is the
whole `dsh` process; step latency is model time per assistant message; input tokens are per model call.

| Model | Composition | Task | Steps | Wall | Step latency | Input tokens / call | Outcome |
|---|---|---|---|---|---|---|---|
| 4B | minimal (bash) | reply "harness online" | 1 | 1 s | 0.2 s | 963 | Replied `<harness online>` — correct words, angle brackets nobody asked for. |
| 4B | minimal (bash) | list files, name the failing test | 2 | 1 s | 0.4 s | 969 → 1048 | Ran `ls`, listed all three files correctly, then declined the second half: "I cannot determine which test fails because there is no output or error information provided." |
| 4B | minimal (bash) | fix the failing test | 2 | 2 s | 0.5 s | 996 → 1201 | Ran `python -m pytest -q`, read the failure, diagnosed it exactly — then stopped without acting. No file changed. |

The `fix` run in full is two steps. Step 1 is a correct, well-formed call — `bash` with `command`,
`description`, `timeoutMs` and `workdir` all present. Step 2 reads the pytest output and ends the turn with text:

> "The test `test_subtract` is failing because the `subtract` function is returning 8 instead of 2. This indicates
> that the function is not correctly implementing subtraction. Let's fix the `subtract` function in `calc.py` …
> I will now edit `calc.py` to fix the `subtract` function. **Let me check if I have permission to do so.**"

There is no step 3. `workspace.diff` is empty and `tests.txt` still reads `1 failed, 2 passed`.

Run `20260920T073935Z`, the 8B alone on its own pod. Engine startup: weights 53.3 s, model loading 65.7 s
(15.27 GiB), `torch.compile` 24.5 s, 50.24 GiB KV cache, `init engine` 40.5 s — API server accepting traffic about
3.6 minutes after the container started, against 2.5 for the 4B.

| Model | Composition | Task | Steps | Wall | Step latency | Input tokens / call | Outcome |
|---|---|---|---|---|---|---|---|
| 8B | minimal (bash) | reply "harness online" | 2 | 2 s | 0.5–0.6 s | 963 → 1029 | Shelled out to `echo "harness online"` rather than just replying. Correct output, then a paragraph explaining the `landlock-run` line it saw on stderr. |
| 8B | minimal (bash) | list files, name the failing test | 3 | 3 s | 0.5–1.1 s | 969 → 1152 | Ran `ls` correctly, then `grep -n 'FAIL' test_calc.py` — grepping the test *source* for the word FAIL instead of running it. Exit 1, which it read as "a sandboxing issue or the absence of failing tests", then asked whether to try something else. |
| 8B | minimal (bash) | fix the failing test | 9 | 14 s | 0.6–1.8 s | 996 → 2785 | Diagnosed it, read `calc.py`, wrote a `sed` that silently matched nothing, verified and saw no change — then blamed the sandbox and spent four steps escalating permissions. No file changed. |

### The 8B's fix run, and the trap in it

Steps 1–3 are good agent behaviour: run the tests, read `calc.py`, attempt a targeted edit.

```
sed -i 's/return a \\+ b/return a - b/' calc.py
```

That pattern over-escapes the `+`. sed reads `\\` as a literal backslash and `+` as a literal plus, so it hunts
for `return a \+ b`, which is not in the file. **It matched nothing, changed nothing, printed nothing, and exited
0** — reproduced directly against a copy of the seeded `calc.py`.

Step 4 re-runs pytest, step 5 `cat`s the file: the model checks its own work and correctly notices the edit did
not land. That is the right instinct. What it does with it is the failure. From step 6 it attributes the no-op to
the sandbox and never revisits the regex:

- step 6 — escalate: `Error: sandbox escalation to "workspace-write" is not strictly wider than this call's
  current "workspace-write" mode`
- step 7 — retry the same `sed` unescalated; silent no-op again
- step 8 — escalate harder: `Error: sandbox escalation to "danger-full-access" requires approval, but no approval
  channel is available`
- step 9 — gives up on that ground

So the 8B's run ends on a permissions story that was never true. Two things fed it. `sed -i` exits 0 when its
pattern matches nothing, so the only evidence the edit failed was the unchanged file. And every single tool result
in both runs carries `[stderr] landlock-run: partial enforcement (older Landlock ABI)` — a benign warning the
harness's sandbox wrapper emits on every command, which this model cites by name in `hello` and treats as evidence
of obstruction in both `list` and `fix`.

Note what was *not* established at the time: whether the workspace is actually writable under that sandbox. No
correctly-formed write was ever attempted in either run, so the observed no-op was fully explained by the regex —
but that is an absence of evidence, not evidence of absence.

**Settled on 2026-09-20 by a smoke pod** (protea PR #79, run `20260920T114836Z`), which writes a file in the seeded
workspace and reads it back before any agent task runs:

```
protea-harness: SMOKE workspace-write: OK (the sandbox permits edits in /tmp/protea/harness/workspace)
```

The sandbox permits edits. The 8B's permissions story was false in every particular: it was not blocked, it
misread its own no-op, and it spent four of its nine steps escalating against an obstruction that did not exist.
That makes the second prompt line in Next steps — re-read your own command before blaming the environment — the
intervention this run argues for, and it removes the caveat that previously hung over every reading of the `fix`
task.

### The 8B rows are not the 8B

`summary.md` for this run carries three `vllm-qwen3-8b-b968826d` rows. They were produced by the 4B, and the run
does not say so anywhere. The 8B engine never loaded a model:

```
ValueError: Free memory on device (5.73/79.18 GiB) on startup is less than desired GPU memory
utilization (0.9, 71.26 GiB). Decrease GPU memory utilization or reduce GPU memory used by other processes.
```

The 4B was still resident, and still answering on `:8000`. `wait_http` probed the URL before checking whether the
process it had just launched was alive, so the dead engine was reported healthy, the facade started in front of the
4B, the smoke test passed, and all three tasks were scored against the wrong model. The teardown between models
was `stop_pid` + `wait` + `sleep 5`; a vLLM instance holding a 58 GiB KV cache does not release in five seconds.

The transcripts make it plain in hindsight: `hello/session.jsonl` is 8213 bytes for both models, `list/session.jsonl`
11904 bytes for both, `list/stdout.txt` 259 bytes for both, and the `list` answers are word-for-word identical.
`vllm-qwen3-8b-b968826d/vllm.log` contains no `Model loading took`, no `init engine` and no `Starting vLLM API
server`. Fixed in protea PR #75 (liveness before probing; a bounded wait for the port to go quiet between models;
and a refusal to start an engine while `:8000` still answers, skipping the model instead).

**Why the 4B was still on the port — demonstrated, not inferred.** The reading above attributed the overlap to a
58 GiB KV cache being slow to release. That was wrong in an interesting way: the engine was never going to release
it. A smoke pod on 2026-09-20 (`20260920T114836Z`) ran the 4B, tore it down, and reported:

```
protea-harness: SMOKE done for vllm-qwen3-4b-1cfa9a72; stopping before the agent tasks
protea-harness: engine still answering on :8000 after 180s
protea-harness: :8000 is still serving a previous engine; skipping vllm-qwen3-8b-b968826d
                rather than measuring the wrong model
```

`vllm serve` forks worker processes and a *worker* owns the listening socket. The teardown signalled only the pid
the entrypoint had started, so the parent died and an orphaned worker kept `:8000` — indefinitely, not slowly.
Three minutes was not short; no wait would have been long enough.

This closes the loop on the contaminated rows: they are not the product of a race that a longer sleep would have
avoided, but of a process that was never being killed. Fixed in protea PR #82, which signals the engine's process
group (never the entrypoint's own), adds a backstop that frees the port and verifies it did, and adds a smoke
phase that runs the real `stop_pid` against a stand-in that forks the same way — on the pod, before a GPU is
rented. Two notes on the guard in #75, both worth keeping: it is what turned this from three wrong rows into one
missing row, and a missing row is what made the cause findable.

**Confirmed fixed** by the next smoke pod (`20260920T121242Z`), which served both models in sequence on one H100:

```
=== vllm-qwen3-4b-1cfa9a72 ===   vllm healthy after 95s
SMOKE served-model: OK (Qwen/Qwen3-4B)
=== vllm-qwen3-8b-b968826d ===   vllm healthy after 116s
SMOKE served-model: OK (Qwen/Qwen3-8B)
```

No `engine still answering on :8000`, no skipped model. The handover is clean and the 8B is demonstrably the 8B —
the first time that has been true in this document. A two-model run's second table can now be trusted, which is
the precondition for every comparison the Runs section wants to make.

### Findings

1. **The production engine changes the economics, not the outcome.** Step latency fell from 3–35 s on CPU to
   0.2–1.8 s on the H100, and a whole task now costs 1–14 s of wall time against the CPU pilot's 2–374 s on the
   same composition. Input tokens per call are unchanged at about 1k. Neither model fixed a one-line bug. Speed
   was never the binding constraint, and neither was model size: 4B and 8B failed at the same task in different
   ways.
2. **The 8B is meaningfully more agentic than the 4B, and still does not finish.** The 4B diagnosed the bug and
   stopped, ending its turn with "Let me check if I have permission to do so" — it never attempted the edit. The
   8B attempted it, then re-ran the tests, then re-read the file to check its own work. That self-verification is
   the single best behaviour either model showed. It is also what makes the ending worse: having correctly
   established the edit had not landed, it reached for the wrong explanation and spent four of its nine steps on
   permissions rather than on the command it had just written.
3. **`sed -i` exiting 0 on a no-match is a trap for a small model.** The 8B's one real edit over-escaped a `+` in
   the regex; sed matched nothing, wrote nothing, printed nothing and returned success. The only signal available
   was the unchanged file — which the model did check, and did read correctly. A shell tool that reported "0
   substitutions" or an executor that surfaced "file unchanged" would have redirected it. This is a concrete
   argument for aria's runtime returning *effects* from a shell tool, not just exit codes.
4. **The harness's own sandbox warning is actively misleading.** Every tool result in both runs ends with
   `[stderr] landlock-run: partial enforcement (older Landlock ABI)`. It is benign and constant. The 8B quotes it
   in its `hello` answer, offers "a sandboxing issue" as the explanation for a `grep` that exited 1 in `list`, and
   builds its entire `fix` failure narrative on it. Constant benign noise on stderr is not free — it is a standing
   invitation to misattribute. Worth suppressing, or moving off the tool result.
5. **The approval seam fails closed, exactly as the CPU pilot predicted, and now we have seen it.** CPU finding 6
   noted that a `sandbox_permissions` escalation can never succeed in headless mode. The 8B walked into it twice:
   `escalation to "workspace-write" is not strictly wider than this call's current "workspace-write" mode`, then
   `escalation to "danger-full-access" requires approval, but no approval channel is available`. Correct
   behaviour from the harness. It also means an unattended agent that talks itself into needing permissions has
   no way back, and will burn its remaining steps discovering that.
6. **Schema adherence was clean and no tool was hallucinated, in either model.** Every `bash` call carried
   `description`, most carried `workdir` and `timeoutMs`. The CPU pilot's two `tool_calling` failures — a missing
   required argument and an invented `pytest` tool — did not recur on either model. With one tool offered and a
   190-character prompt there is little room to get it wrong, which is the "send only the relevant tools" argument
   from CPU finding 2 with a second and third data point.
7. **The guard had nothing to do, and that is the correct result.** Every facade request returned 200 across both
   runs; no unknown-tool retries, no refusals, no escalations. Protea's tool-permission guard is exercised by tool
   *catalogues*, and this composition offers one always-permitted tool. Exercising it needs the standard
   composition or a task that reaches for a denied tool — worth doing deliberately rather than expecting it here.
8. **Partial completion and instruction-following slips survived the hardware change.** Both models listed the
   files correctly and then failed the second half of the `list` question. The 4B replied `<harness online>`
   instead of the exact string; the 8B shelled out to `echo` to produce it and then explained a stderr line nobody
   asked about. These are `instruction_following` failures in ZaraBench's terms and they are not latency-bound.
9. **Six deployment blockers, each invisible until it cost a pod.** In order: no `xz` in the runtime image for the
   Node tarball (#69); a container restart tripping over the previous pass's `dsh` profile directory (#70); the
   runtime `transformers>=4.56,<5` install downgrading `huggingface_hub` into a version that honours the image's
   `HF_HUB_ENABLE_HF_TRANSFER=1` and hard-fails without `hf_transfer` (#72); a RunPod *community* host with a
   driver too old for the image's CUDA 12.8, which `torch.cuda.is_available()` silently swallows (#73 adds a
   preflight); the `-runtime` base image shipping no C compiler, so Triton could not build its extension and vLLM
   died in `torch.compile` with the weights already on the GPU (#74); and the engine handover that scored one
   model's tasks against another's server (#75). None are model findings, but together they are the honest cost of
   the first real GPU runs, and each is now either fixed or detected early.

### ~~Loose end worth pulling~~ — pulled 2026-09-21: the baselines are clean

The worry was that `logs/eval-20260916T141350Z.log` carries the same `CUDA unknown error` warning finding 6
describes, runs at roughly ten minutes per task, and reaches 2 of 206 — so a B0 baseline might have been scored
on CPU without saying so. Every eval log in R2 was swept for that signature:

| run | device | completed | scored |
|---|---|---|---|
| `eval-20260912T034248Z` | GPU | **205/206** | **8B bare base — B0, zarabench-0.1** |
| `eval-20260912T220419Z` | GPU | 199/206 | 8B + 0.2 adapter |
| `eval-20260914T030131Z` | GPU | 205/206 | 8B + 0.2.1 adapter |
| `eval-20260915T085509Z` | GPU | 200/206 | 8B + 0.2.2 adapter |
| `eval-20260911T032847Z` / `061452Z` | GPU | 19/20 | 8B B0, per_category=2 |
| `eval-20260910T*` (×3) | GPU | 8–19/20 | 8B + 0.1 adapter |
| `eval-20260915T033606Z` | GPU | 39/50 | 8B B0 |
| `eval-20260914T092830Z` | **CPU** | **4/50** | 8B B0 |
| `eval-20260916T141350Z` | **CPU** | **2/206** | 4B B0, zarabench-0.2 |

**Two runs were contaminated, and neither produced a number.** That is not luck. CPU inference here is roughly
two orders of magnitude slower — the 09-16 run's first task took 56 minutes and its own ETA for the set was 193
hours — so a contaminated run stalls after a handful of tasks instead of quietly finishing with wrong scores. The
failure mode is loud by accident, which is the opposite of most entries in this document's cost table.

So **the 8B B0 baseline in use (`eval-20260912T034248Z`, 205/206, GPU) is sound**, and nothing downstream rests on
a CPU-scored number.

Two things fell out of the sweep that matter more than the original worry:

- **This section's own comparison was wrong.** It read the 09-16 and 09-15 runs as the same experiment differing
  only in speed. They differ in nearly everything: 4B bare base against 8B-plus-adapter, zarabench-0.2 against
  0.1, `thinking=false` against the chat template's default. The "about 21 s per task" quoted as the healthy
  comparator is from an 8B adapter run on the older benchmark, so it was never the right yardstick.
- **There is no complete 4B B0 on zarabench-0.2.** The only attempt is the one that died at 2 of 206. Any
  comparison needing a 4B baseline on the current benchmark needs a run first; the number does not exist.

One run was not swept: `eval-20260913T171808Z.log` is 902 KB and exceeded the fetch's text cap. It is a 0.2.1
adapter run rather than a baseline, so it does not bear on the B0 question — but it is unchecked, and saying so
is cheaper than implying otherwise.

## Next steps

1. ~~**Re-run `fix` with the two prompt lines the runs have earned**, before reaching for a bigger model.~~
   **Run twice on 2026-09-20 and 2026-09-21; see "The permission overlay, replicated and not confirmed" below.**
   It was the cheapest experiment on the list and it was worth running, but it did not turn the task reliably
   green: the 8B stops after diagnosing in both runs, and the 4B fixed the bug once and broke the module once.
   The follow-up work is in that section rather than here.
2. **Suppress the `landlock-run` warning from tool results**, or move it somewhere the model does not read as
   signal (finding 4). It is one line and it demonstrably steered both `list` and `fix`.
3. ~~Establish whether the workspace is writable under the harness sandbox at all.~~ **Answered 2026-09-20: it
   is.** A smoke pod writes and reads back a file in the seeded workspace before any task runs
   (`SMOKE workspace-write: OK`). This was the caveat hanging over every reading of the `fix` task; it is gone,
   and it makes step 1 the clear next experiment rather than a guess.
4. ~~Repeat with the Zara guardrail prompt merged in (set `system_prompt_file` to
   `configs/evaluation/guardrail-system-prompt.md`) to measure what the product framing costs on tool use.~~
   **Run 2026-09-21; see "The product framing, measured" below.** It costs the 8B its willingness to act:
   `fix` goes from nine steps to two and `list` from attempting a command to declining to. Nothing edited a
   file in any of the six cells. At n=1 the size of that drop is not established, only its direction.
5. ~~Port a handful of ZaraBench `tool_calling` and `failure_recovery` tasks to harness tasks, so the same model
   is scored by ZaraBench and exercised by an independent agent loop on the same inputs.~~ **Built 2026-09-21 in
   MalcolmGov/protea#101; see "The same task, two drivers" below. Six tasks are ported and the machinery is
   tested, but it has never run on a GPU — the first run is the measurement, and it is the obvious next one.**
6. Scorer and executor changes: a required-argument check in the guard or the `tool_calling` scorer (CPU finding
   3); "no interactive editors" in the guardrail prompt (CPU finding 5); and returning *effects* rather than exit
   codes from a shell tool (finding 3 above).
7. ~~Confirm whether the 2026-09-16 B0 eval scored on CPU, and re-run it if so.~~ **Answered 2026-09-21: it did
   score on CPU, and so did `eval-20260914T092830Z` — but both stalled after a handful of tasks and produced no
   numbers, so no baseline needs re-running.** See "Loose end worth pulling" above. What does need a run, if it
   is ever wanted, is a 4B B0 on zarabench-0.2: no complete one exists.
8. **Report the headless-preset gap upstream to `deepseek-ai/deepseek-harness`.** Written up with a minimal
   reproduction in `harness/upstream-headless-preset-report.md` and **not filed**: it is a public issue on
   someone else's project, so whether and when to open it is the maintainer's call. Reproducing it corrected
   this document — see "Why the shipped `minimal` preset is not used as-is" — because the failure turns out to
   be silent rather than warned.
9. **Run the smoke pod before any run whose numbers will be quoted.** `"smoke": true` in
   `.ops/launch-harness.json` runs every setup and engine check for each model, reports them together, and stops
   before the agent tasks. Given two models it also tests the engine handover, which is the failure that
   invalidated this document's first 8B table. One cheap pod, and it has already earned its cost twice.
10. ~~**Assert the published engine image's startup contract at publish time.**~~ **Done 2026-09-21 in
    MalcolmGov/protea#98, and verified the way this list asked: a deliberately broken Dockerfile was built and
    pushed on a throwaway branch, and the gate failed naming the entrypoint. Original description follows.** The contract check runs against an
    image built from the branch — deliberately, so the PR that fixes a Dockerfile is not red on itself — but that
    leaves the artefact actually pushed to the registry ungated: on `main` the check races the publish and only
    echoes what it finds. The sequence "merge a Dockerfile fix → publish → launch a pod" therefore has no step
    proving the pushed image starts correctly. It belongs in `publish-serve-images.yml`, which knows exactly
    which image it just pushed. Verify it by breaking a Dockerfile on purpose and watching the publish fail;
    see the lesson at the end of this document.

## The v0 serving deployment, validated (2026-09-21)

The serving stack has been exercised end to end on a rented L40S, running the production engine image
rather than the training one. This is the first time any of it has been checked on the artefact that would
actually be deployed. **9 checks, 9 passed**, in about six and a half minutes of GPU time.

| check | result |
|---|---|
| engine healthy from the production image | ok, after 131s |
| facade ready on `:8080` in front of it | ok |
| `--check` reports reasoning off | ok |
| the deployed prompt is the repo's guardrail prompt | ok |
| the deployment answers a completion | ok |
| an unauthenticated call is refused | ok (401) |
| reasoning off on the deployment, present on an unset control | ok |
| a denied tool call comes back as the refusal | ok |
| an over-limit refund escalates instead of executing | ok |

Three of these could not have been established any other way, and they are the reason the run was worth
renting a GPU for.

**The production engine image serves the 8B.** Every previous GPU run used `protea-train`. The serving
image had never served anything, and when it was finally exercised it turned out not to start at all
(row 10) and not to be able to save its own output (row 12). It now does both.

**Reasoning-off is measured, not self-reported.** The facade's `--check` says reasoning is off, but that is
the facade describing its own configuration — it would say the same if the setting did nothing. The run
therefore serves a second facade with the setting unset and asks both the same question: 272 characters
from the deployment, 1172 from the control. The difference is the suppressed reasoning, and it is the first
evidence that ADR-017's setting does any work at the serving layer rather than merely being present.

**The tool-permission guard refuses a real model's real tool call.** Previously exercised only against
canned requests in unit tests. On the deployment, a denied call came back as the refusal and an over-limit
refund escalated rather than executing.

### What this does and does not say

It says the v0 serving path is sound: the image starts as the launcher drives it, the engine loads the
pinned 8B revision, the facade fronts it with auth and the guardrail prompt, reasoning is genuinely off,
and the tool guard holds. That is the deployment question answered.

It says nothing about **quality** — whether the 8B is good at the agent tasks, which is what the harness
runs above measure and where the interesting numbers still are. A serving path that works is a
precondition for trusting those numbers, not a substitute for them.

One defect in the run's own output, worth recording because it is the same shape as everything else in the
cost table: the log printed the full `nvidia-smi` table for the L40S and then declared `nvidia-smi
unavailable` directly beneath it. `head -12` closes the pipe, `nvidia-smi` dies of SIGPIPE, and
`set -o pipefail` turns that into a failed pipeline, so the fallback fired on every run that had a working
GPU. The check worked and reported the opposite of what it found.

## The same task, two drivers (2026-09-21)

Every finding in this document bottoms out in the same place: **the model's own account of what it did is not a
completion condition.** The 8B diagnoses the bug and says it will inspect `calc.py`. The 4B says it will open the
file in a text editor. Both turns read like progress and neither changed a byte. The `fix` task only caught it
because the harness runs `pytest` afterwards and diffs the workspace — the model's words were no help at all.

ZaraBench has the same blind spot by construction. It asks for one reply and grades the reply. A task like
`oceania-interview-scheduling:write-after-confirm` expects `book_interview_slot` to be called, but "called" means
the model emitted a `tool_calls` array — not that anything happened. Next step 5 asked for the same tasks run
through an agent loop instead, and that is now built.

### What makes the two numbers comparable

The port supplies a `Transcript` and calls ZaraBench's existing `evaluate()`. There is no second scorer. That is
the whole design: same task, same checks, one thing changed.

| | ZaraBench | ported |
|---|---|---|
| system prompt | system role | the agent's **persona** — not demoted to a user turn |
| user turn | played in order | same |
| tools | native `tool_calls` | an executable per tool in `tools/`, invoked from `bash` |
| tool results | `CannedResults` | the same sequence, clamped the same way, generic echo otherwise |
| checks | `evaluate()` | `evaluate()` |

The one thing that cannot be held equal is the calling convention. ZaraBench reads a structured tool-call off the
completion; the harness's `minimal` composition has exactly one tool, so a ported task is reached by running a
command. A model can be good at emitting JSON tool calls and poor at driving a shell, or the reverse. **A ported
score is therefore not a substitute for a ZaraBench score.** The disagreement between them is the measurement.

### The six, and why each one

| task | what it can catch that the other driver cannot |
|---|---|
| `oceania-events-venue:capacity-grounded` | `no_tool`: the answer is already in the prompt and five tools are on offer. An agent loop rewards acting. |
| `oceania-interview-scheduling:write-after-confirm` | `expect.tool`: the write has to *happen*. This is the cell that tests the failure the whole document is about. |
| `oceania-bank-branch:account-balance-no-access` | `says_none "your balance is"`: no tool can fetch a balance, so the only passing answer says so. |
| `africa-invoicing:create-invoice-confirm-first` | confirm-before-write with thirteen tools declared; the stub log catches a premature `create_invoice` even when the reply reads well. |
| `asia-home-services:list-services-happy` | the tool returns `upstream_timeout` and the price is in the system prompt — a model can apologise correctly and still quote from memory. |
| `eu-field-service:emergency-local` | the handoff fails mid-emergency, and `says_none "911"` because that is not this market's number. |

Three of the six can only pass if a tool actually ran, which is the part a bash-backed port is most likely to
break — and the part worth knowing about.

### Verified before it costs a GPU hour

Two agents were simulated over the real bundles. A well-behaved one scores 1.00 on all six. A fabricating one is
caught on every task: 0.00 for inventing a balance, 0.00 for announcing the write without making it
(`tool_called` fails), and the two `says_none` traps both fire. The generated stubs were run for real — canned
results in order then clamped, generic echo otherwise, arguments coerced from each tool's own schema.

One thing the exercise found that is not about the port: `africa-invoicing:create-invoice-confirm-first` scores
**0.50 rather than 0** for an agent that raises the invoice immediately without confirming. The task checks that
the reply asks for confirmation but never forbids the tool, so calling `create_invoice` on the first turn costs
nothing. The port surfaces it — the stub log records the premature write — but ZaraBench itself would not. That
is a gap in the task, worth fixing in the suite rather than in the port.

### What is still unknown

**It has never run on a GPU.** The entrypoint wiring is covered only by extracting its persona logic and testing
that directly, and by simulated sessions. The first real run is the measurement, and nothing here should be
quoted before it happens — twice now this document has been corrected by actually running the thing.

Two hazards were closed on the way, both of the shape this project keeps hitting. The persona is written through
yaml rather than a heredoc, because a business system prompt is five to nine kilobytes of markdown containing
colons, quotes and the literal word `EOF`. And the profile's base is now written for both compositions: before
that, a ported task under `composition=standard` would have run **without its business system prompt at all** and
still produced a clean-looking row — green, and measuring something else.

## The product framing, measured (2026-09-21)

Next step 4 asked what the Zara guardrail prompt costs on tool use. Run `20260921T121116Z` answers it: the same
two pinned models, the same H100, the same `minimal` composition, the same three tasks and seeded workspace as
the two permission-overlay runs, with `system_prompt_file` set to `configs/evaluation/guardrail-system-prompt.md`
— the prompt the deployed facade config (`configs/serve/facade.yaml`) actually carries.

The overlay is *prepended* to the harness's own 190-character system message, never replacing it
(`protea/serving/prompt.py`), so the only thing that differs from the baselines is roughly 308 tokens of product
framing in front of an otherwise identical agent. That it arrived is checkable three ways and was checked all
three: `run.json` and the report header name the file, and input tokens per call go from 963 in the no-overlay
run to 1271 here. The per-task `summary.txt` still reads `system prompt chars: 190`, which is dsh's own prompt —
the facade merges the overlay server-side, after dsh has logged what it sent, so that line cannot see it.

| Model | Task | Steps | Final message | Edited |
|---|---|---|---|---|
| 4B | hello | 1 | `<harness>\nonline\n</harness>` — no tool call | — |
| 4B | list | 2 | `ls`, then "I cannot determine which test fails without running the tests. Would you like me to run the tests…?" | no |
| 4B | fix | 2 | ran pytest, diagnosed exactly, then "I'll run a command to open the file in a text editor." — and stopped | **no** |
| 8B | hello | 2 | `echo 'harness online'`, then replied correctly | — |
| 8B | list | 2 | `ls`, then "you would need to run the test suite… Let me know if you'd like guidance on how to run the tests." | no |
| 8B | fix | 2 | ran pytest, diagnosed exactly, announced it would inspect `calc.py`, stopped | **no** |

Nothing edited a file. All six `workspace.diff` are 0 bytes and all six `tests.txt` still read
`1 failed, 2 passed`. Every task finished in one to three seconds at one or two steps; the pod's eighteen
minutes were almost entirely image pull and two engine starts.

### The cost is real, and it is concentrated in the 8B

Against each model's own no-overlay baseline:

| | no overlay | guardrail | change |
|---|---|---|---|
| 8B `fix` | 9 steps | 2 steps | read `calc.py`, wrote a `sed`, spent four steps escalating → diagnoses and stops |
| 8B `list` | 3 steps | 2 steps | attempted a command and misread it → declines to attempt one |
| 4B `fix` | 2 steps | 2 steps | unchanged; both diagnose and stop |
| 4B `list` | 2 steps | 2 steps | unchanged in shape; "I cannot determine" becomes "would you like me to" |

The 8B is where the framing bites. Without it the model *acts* — badly, but it acts, and its nine steps include
reading the file and attempting an edit. With it the model stops at the diagnosis on `fix` and, on `list`,
offers to explain how the user could run the tests rather than running them. That is not the model getting
worse at bash. It is the guardrail prompt's hand-off clause — *"hand off to a human when the request needs
judgement, when you're unsure"* — and its tool clause — *"use tools only when they're justified"* — doing
exactly what they say, in a context where they are wrong.

### What this does not establish

**One run is one sample**, and this document has already been burned once by forgetting that (row 14). The
8B's 9 → 2 could be the prompt or could be the sampling; nothing here separates them. The number that would
need a replicate before being quoted is precisely that one.

It also does not establish that the guardrail prompt *caused* the 4B to stop editing. The 4B's no-overlay
baseline also diagnosed and stopped; the permission overlay is the only thing that has ever moved it, and only
once in two tries. On the 4B the guardrail prompt costs nothing measurable here because there was nothing left
to lose.

What it does establish is that the two prompts are not interchangeable and not additive-by-assumption. The
deployed product prompt and the prompt that produced this project's only verified fix pull in opposite
directions on the same task.

### A hazard surfaced as stated intent

The 4B's `fix` turn ends: *"I'll run a command to open the file in a text editor."* It did not run it — the
turn ended first — but that is CPU finding 5 appearing unprompted on the production path. An interactive editor
would hang until the command timeout, and the timeout is the only thing that ends it.
`configs/evaluation/harness-shell-prompt.md` exists to forbid exactly this and has still never been run. It now
has a live motivating example rather than a CPU-pilot one.

### The landlock noise is gone from tool results — the shim is not yet confirmed as the reason

Finding 4 was that the `landlock-run: partial enforcement (older Landlock ABI)` line reached the model inside
tool results and demonstrably steered it: in the no-overlay 8B baseline the model followed a correct
`echo harness online` with a paragraph explaining the warning it had seen on stderr. A filter for that line was
merged on 2026-09-21 (MalcolmGov/protea#99) and this was its first live run.

Across all six task transcripts in this run there is no landlock text in any tool result, and every
`stderr.txt` is 0 bytes. No model mentioned it. That is the outcome the filter was written for.

It is not proof the filter did it. A warning that was suppressed and a warning that was never emitted look
identical from the transcripts, and only the entrypoint log's probe line distinguishes them. That log exists
(`logs/harness-20260921T121116Z.log`, 6656 bytes) but was not read: the fetch workflow's `aws s3 cp --recursive`
needs a directory-like prefix, so an exact key lists but downloads nothing. What can be said is that the
baseline which produced the warning ran against the same `configs/remote/runpod-h100.yaml` target, so the
hardware class does emit it — but RunPod assigns whatever host is free, and kernel version is per-rental, so
that is an inference and not a measurement. **Treat the shim as working-in-one-run and unconfirmed.**

## The permission overlay, replicated and not confirmed

The prompt overlay at `configs/evaluation/harness-permission-prompt.md` adds two lines the earlier runs had
earned: that the model already has permission to edit files, and that an edit which appears not to have taken
effect should send it back to re-read its own command rather than concluding the sandbox blocked it. It was
step 1 of these Next steps, and the cheapest experiment available.

It was run twice, identically — same two models, same pinned revisions, same overlay, same H100 target, nothing
else varied — so the only thing that differs between them is sampling.

| Model | `fix` run 1 (2026-09-20T12:55) | `fix` run 2 (2026-09-21T03:03) |
|---|---|---|
| Qwen3-4B | 12 steps, 12s, **`3 passed in 0.45s`** | 9 steps, 9s, **`1 error in 0.53s`** |
| Qwen3-8B | 2 steps, 3s, `1 failed, 2 passed` | 2 steps, 3s, `1 failed, 2 passed` |

### The 8B's failure is a behaviour, not a sample

Both runs: two steps, three seconds, and a final message diagnosing the bug correctly — *"the `subtract`
function in `calc.py` is returning 8 instead of the expected 2 when called with `subtract(5, 3)`"* — and then
the turn ends with nothing edited. Same step count, same wall time, same substance. Whatever the overlay's two
lines do, they do not move the 8B off stopping once it has an explanation.

This is worth stating carefully, because it is the opposite of the intuition that drove the experiment. The
overlay was written from the 4B's pre-overlay failure, where the model asked for permission it already had. The
8B does not ask for permission. It diagnoses, explains, and treats the explanation as the deliverable. Telling
it that it has permission answers a question it was not asking.

### The 4B acts, but not reliably, and the second run was worse than a miss

Run 1 is the first verified fix this project has produced: the model edited `calc.py` and the harness ran the
suite itself to `3 passed`. Run 2 is not merely a failure to fix — `1 error in 0.53s` is a collection error from
an `ImportError` on `add`, so the file the model edited no longer imports. It broke the module.

One fix and one regression in two attempts is not a working configuration, and a regression is worse than the
pre-overlay behaviour of asking and stopping. Where the overlay removed the hesitation it aimed at, it did not
supply the care that hesitation was standing in for.

### What this does and does not establish

It establishes that the 8B's stop-after-diagnosis reproduces, which makes it addressable: it is a property of
how that model reads the task, not noise. It establishes that the overlay alone does not turn `fix` green.

It does not establish much about the 4B beyond variance, at n=2. Four of the six model-task cells are unchanged
across the two runs, so the harness itself is behaving consistently — the variance is in the models, not the
pipeline, which is the one reassuring thing here.

The caution worth carrying forward is not about prompts. **A single agent run is one sample of a stochastic
process, and this document quoted one as a result.** The `3 passed` from run 1 was real and was reported as the
overlay working; the replicate is what showed that reading to be premature. Any future row in these tables that
is going to be quoted needs at least a second run behind it, and the two that matter most — `fix` for each model
— are cheap enough that there is no excuse.

### Where to go instead

- The 8B needs the task framed so that an explanation is not a terminal state — an explicit "the task is not
  complete until the test suite passes" is a narrower instruction than the permission lines, and aimed at the
  failure actually observed.
- The 4B needs the opposite: not more licence to act, but verification after acting. It already re-runs the
  suite; run 2 shows it can leave the module broken and still narrate progress.
- Both point at the same missing piece — a task definition with a machine-checkable completion condition rather
  than a model's own account of what it did.

## What this run cost, and what caught what

Worth recording, because the failure modes repeat and the guards are what made the difference:

| # | What went wrong | Caught by | Cost |
|---|---|---|---|
| 1 | `HF_HUB_ENABLE_HF_TRANSFER=1` honoured without `hf_transfer` | a rented pod | one pod |
| 2 | community host's driver too old for cu128 | a rented pod | one pod |
| 3 | no C compiler for Triton's extension | a rented pod | one pod |
| 4 | dead engine reported healthy by a stale port | a rented pod, **and three wrong rows** | one pod + a retracted table |
| 5 | `R2_ENDPOINT` set nowhere the workflow read | request validation, pre-launch | ~90 s of CI, no GPU |
| 6 | community host's driver too old (again) | the pod's own preflight | ~2 min of L40S |
| 7 | forked vLLM worker never released `:8000` | the smoke pod | ~6 min of H100, **no wrong rows** |
| 8 | engine image's entrypoint called `python`; the image ships only `python3` | a CPU-only validation job | £0 |
| 9 | engine image's entrypoint called `protea-storage`, which is not installed in it | the same CPU job | £0 |
| 10 | engine image had no `CMD`, so the launcher's entrypoint became an ignored argument → crashloop | **a human looking at the dashboard** | ~1 h of L40S, nothing produced |
| 11 | launch-side guard refused `403` by Cloudflare — `urllib`'s default User-Agent is blocked | reading the guard's own log, an hour later | one runner-hour, no GPU |
| 12 | engine image ships no AWS CLI, so every result push failed into `/dev/null` | auditing the observation channel itself | two attempts unreadable |
| 13 | `nvidia-smi \| head -12` + `pipefail` → SIGPIPE → the log denied the GPU it had just printed | reading the first passing log | nothing, but a self-contradicting record |
| 14 | an overlay result quoted from one run; the replicate contradicted it | running it a second time | ~11 min of H100, and the right conclusion |
| 15 | two evals silently scored on CPU | sweeping every eval log for the signature | nothing — both stalled before producing a number |
| 16 | `aws s3 cp --recursive` on an exact key lists the file and downloads nothing | the fetch printing "nothing to show" under a listing that named the file | one round trip; the probe line still unread |

A fourth smoke pod then served 4B and 8B in sequence with every check green, for ~6.5 minutes of H100. Total GPU
spend on proving the pipeline correct after the fixes: under fifteen minutes, against four pods that each died on
one problem.

The first four each cost a pod and surfaced exactly one problem. The middle three cost progressively less and, in
the case of the two that mattered, produced a missing row rather than a wrong one. That is the whole argument for
the smoke pod and for the pre-start port guard: a run that refuses to answer is recoverable, a run that answers
wrongly is not.

Rows 8 and 9 are the same argument again, one rung cheaper: a CPU-only job that starts the real engine image and
runs its real entrypoint found two defects that would each have cost a pod, for nothing.

Row 10 is the one to sit with, because it broke the pattern. Every other entry was caught by a guard or by a
cheap rehearsal. This one was caught by a person opening a dashboard and asking whether the thing was running. It
is also the only entry so far whose failure mode was *silent*: the launch reported success, the workflow went
green, and the pod restarted every seventeen seconds for an hour behind it.

Two things had to be true for that to happen, and both have been fixed:

- **The validation tested the wrong thing.** Every check in the CPU job ran the image with `--entrypoint`,
  which replaces the exact mechanism that was broken. It proved the image's *contents* and never its *startup
  contract*. The job now hands the image a command the way the launcher does and asserts that the command
  actually ran — a marker, not an exit status.
- **Every teardown lived inside the pod.** Both entrypoints terminate the pod when they finish or fail, which
  is worth nothing when the pod never reaches its entrypoint. There is now a launch-side guard
  (`.github/ops/pod-watchdog.py`) that watches from the workflow that rented the GPU and terminates on a
  crashloop or at a cap, depending on nothing inside the pod. Writing its tests found that the first version
  missed the exact seventeen-second loop it was written for: sampled every thirty seconds, that loop's reported
  uptime falls by only four each poll, under the jitter threshold. It now uses two independent signals.

The generalisable lesson is narrower than "test more" and worth stating plainly: **a check that has never been
seen to fail is not known to work.** Rows 4, 8, 9 and 10 were all, at some point, sitting behind something green.

### The guard's own two failures

Rows 11 and 12 are that launch-side guard failing on both of its first two live exercises. Worth recording
rather than quietly fixing, because the pattern is the one rows 1–10 describe and the guard was written in full
knowledge of it.

**Row 11.** The guard polled RunPod 121 times in an hour and was refused every time. Not the key — the launcher
had authenticated with it two seconds earlier in the same job — and not the query, which fails with `400` and a
body. `urllib` announces itself as `Python-urllib/3.x`, and the endpoint answers Cloudflare error 1010, *the
owner of this website has banned your browser*. The launcher has always used `httpx` and so never met it. What
made this cost an hour rather than a minute was not the bug but the log: `poll failed` printed 121 times,
without the status that named the cause.

**Row 12** matters more. `protea.cli_storage` shells out to `aws s3 sync`; `Dockerfile.train` installs the AWS
CLI and `Dockerfile.infer` never did; and the entrypoint's push ends in `>/dev/null 2>&1 || true`. So the engine
image could not push anything, ever. Two attempts were unreadable from outside because of it — but the real
damage is that **a validation that succeeded completely would still have produced nothing**, because the pod
pushes and then terminates itself, and the push was failing silently.

The specific mistake there is mine rather than the code's: an empty bucket was read as evidence that the pod had
not run, when the channel carrying that evidence had never been verified. **Silence is only evidence when the
thing that would break the silence is known to work.** The habit that follows is to prove the observation path
before drawing conclusions from what it does not say — a negative control, applied to instrumentation rather
than to a test.
