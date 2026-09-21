# Upstream report: agent presets do not compose in a headless session (`@deepseek-ai/dsh` 0.1.5-rc.2)

Drafted for `deepseek-ai/deepseek-harness`. Not filed — it is a public issue on someone else's project and
that is the maintainer's call, not this document's. Everything below was reproduced against a clean install
on 2026-09-21.

## Summary

Mounting `@deepseek-ai/dsh-agent-presets` in a headless profile and selecting a shipped preset has no effect
and no diagnostic. The session runs on the host's full tool roster and the host's prompt, exactly as if the
plugin were not mounted. Nothing in stdout, stderr or the debug log says so.

The package contains a warning for this case —

```
agent "<id>" was published without joining an agent preset; its tools, prompt sections, and skill catalog
resolve against the empty global layer (join through AgentPresets.mount() or composeFrom() in the agent
factory setup)
```

— but it does not fire on the headless path, at any log level tried.

## Reproduction

```bash
npm install --ignore-scripts @deepseek-ai/dsh@0.1.5-rc.2
export DSH_HOME=$PWD/home DSH_TELEMETRY_MODE=DISABLED
./node_modules/.bin/dsh --profile repro --from-default-profile headless --dump-config >/dev/null
```

Add to `$DSH_HOME/profiles/repro/cordis.patch.yml` — the preset plugin, the shipped `minimal` preset, and
any OpenAI-compatible provider:

```yaml
- id: agent-presets
  name: '@deepseek-ai/dsh-agent-presets'
  config:
    default: minimal
- id: llm-pi-ai
  config:
    providers:
      stub:
        apiKeyEnv: STUB_KEY
        api: openai-completions
        baseURL: http://127.0.0.1:8477/v1
        models: [{ id: stub, name: Stub, contextWindow: 8192, maxTokens: 256 }]
- id: agent-default-model
  config: { provider: stub, model: stub }
```

Point the `baseURL` at anything that answers `/v1/chat/completions`, run one task, and look at the `tools`
array of the request that arrives:

```bash
./node_modules/.bin/dsh --profile repro "say ok"
```

## Expected vs actual

`presets/minimal/agent.cordis.yml` composes a `dsh-persona` row with `complete: true` plus one
persistent-shell group, so the agent should see **one** shell tool and the preset's fixed persona.

What the request actually carried:

```
25 tools: ['bash', 'create_goal', 'edit', 'exit_plan_mode', 'get_goal', 'glob', 'grep',
 'interrupt_agent', 'job_kill', 'job_list', 'job_output', 'list_agents', 'ralph', 'read',
 'read_image', 'send_message', 'skill', 'subagent', 'subagent_fork', 'todo_write',
 'update_goal', 'web_fetch', 'web_search', 'workflow', 'write']
```

The host roster, unchanged.

## Where it appears to come from

`.mount()` / `.composeFrom()` are called from `dsh-agent-presets` itself, `dsh-subagent` and
`dsh-api-session-controller`. The headless runner does not appear to go through any of them, so the agent is
created outside the presets layer.

This is an outside reading of a compiled package rather than of the source, so the mechanism is offered as a
lead, not a diagnosis. The reproduction and the 25-tool roster stand on their own either way.

## Why it matters

Silence is the expensive part. A profile that asks for a single-tool composition and instead gets 25 tools
is a large difference in both behaviour and cost — about 6.2k tokens of tool schemas per call against 0.2k in
our measurements — and there is no signal that the request was ignored. Two runs of ours went out in that
state before anyone noticed, and they were kept as a "standard composition" baseline only in hindsight.

Either of these would have been enough:

- let the headless runner join the selected preset, or
- fail the profile load when a preset is named that cannot be applied on this path.

A warning that reaches the operator would be the minimum. The one in the package reads well; it just never
arrives here.

## Environment

| | |
|---|---|
| `@deepseek-ai/dsh` | 0.1.5-rc.2 |
| node | 22.22.2 |
| platform | linux x64 |
| profile | `--from-default-profile headless`, `DSH_PERMISSION_MODE` unset and `workspace-write`, same result |
