# DeepSeek Harness × Protea — minimal-profile test

_2026-09-19. Read-only against `MalcolmGov/protea` at `556b0b5` (main, 2026-09-16). No Protea or Gaslite code
was changed; everything needed to repeat this lives under `docs/zaralm/harness/`._

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

## Next steps

1. Same profile, real facade: point `facade.sh` at the vLLM engine on a GPU host (Qwen3-4B or 8B at the pinned
   revisions) and rerun the two tasks; that is the number that says whether a Protea model can drive a coding agent
   at all.
2. Repeat with the Zara guardrail prompt merged in (drop the `system_prompt_file` omission from
   `facade-harness.yaml`) to measure what the product framing costs on tool use.
3. Port a handful of ZaraBench `tool_calling` and `failure_recovery` tasks to harness tasks, so the same model is
   scored by ZaraBench and exercised by an independent agent loop on the same inputs.
4. Add a required-argument check to the guard or to the `tool_calling` scorer (finding 3), and a "no interactive
   editors" line to the guardrail prompt (finding 5).
5. Report the headless-preset gap upstream to `deepseek-ai/deepseek-harness`.
