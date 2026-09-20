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
`AgentPresets.mount()`, which the Web session controller does and the headless runner does not. The plugin's own
`agent/created` listener just logs a warning that the agent "was published without joining an agent preset", and
the session then runs on the host's full tool roster. The first two runs below went through exactly that and were
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

Note what is *not* established: whether the workspace is actually writable under that sandbox. No correctly-formed
write was ever attempted in either run, so the question is open. The observed no-op is fully explained by the
regex.

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

### Loose end worth pulling

`logs/eval-20260916T141350Z.log` carries the same `CUDA unknown error` warning that finding 6 describes, and then
runs at roughly ten minutes per task, reaching 2 of 206 — against about 21 s per task in `eval-20260915T085509Z`.
That reads like the 2026-09-16 B0 baseline scoring on CPU without saying so. Worth confirming before that number is
used for anything.

## Next steps

1. **Re-run `fix` with the two prompt lines the runs have earned**, before reaching for a bigger model. Add "you
   already have permission to edit files in this workspace; act without asking" (which is what stopped the 4B) and
   "if an edit appears not to have taken effect, re-read your own command before assuming the environment blocked
   it" (which is what cost the 8B four steps). This is the cheapest experiment on the list and the most likely to
   turn the task green.
2. **Suppress the `landlock-run` warning from tool results**, or move it somewhere the model does not read as
   signal (finding 4). It is one line and it demonstrably steered both `list` and `fix`.
3. **Establish whether the workspace is writable under the harness sandbox at all** (see the note at the end of
   the 8B section). A one-line task — `echo x > t.txt && cat t.txt` — settles it, and nothing else in this
   document can be interpreted confidently until it is settled.
4. Repeat with the Zara guardrail prompt merged in (set `system_prompt_file` to
   `configs/evaluation/guardrail-system-prompt.md`) to measure what the product framing costs on tool use.
5. Port a handful of ZaraBench `tool_calling` and `failure_recovery` tasks to harness tasks, so the same model is
   scored by ZaraBench and exercised by an independent agent loop on the same inputs.
6. Scorer and executor changes: a required-argument check in the guard or the `tool_calling` scorer (CPU finding
   3); "no interactive editors" in the guardrail prompt (CPU finding 5); and returning *effects* rather than exit
   codes from a shell tool (finding 3 above).
7. Confirm whether the 2026-09-16 B0 eval scored on CPU (see "Loose end worth pulling"), and re-run it if so.
8. Report the headless-preset gap upstream to `deepseek-ai/deepseek-harness`.
