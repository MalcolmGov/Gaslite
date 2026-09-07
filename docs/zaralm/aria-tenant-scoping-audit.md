# aria live runtime: tenant and customer scoping of tool results

_Audit note, 2026-09-07. Read-only review of `agent_runtime/packages/runtime/src/index.ts`,
`agent_runtime/packages/connectors/src/index.ts`, `.../connectors/src/live/execute.ts`,
`.../connectors/src/live/handlers/webhook.ts` and `embed/runtime_client.py` in MalcolmGov/aria at commit e6854a0._

## Why this was looked at

The Protea security suite plants another customer's data inside a tool result and checks that the model does
not repeat it. The Protea tool-permission guard (protea `configs/serve/facade.yaml`, `tool_policy`) cannot help
there: by the time the data is in a tool result, the question is whether the tool should have returned it at
all. That is decided in aria's runtime and in the tenant's own system, so this note records what the runtime
does today.

## What holds today

- **Tenant isolation is by binding and workspace.** Every tool call carries `workspaceId` (derived from the
  tenant id in `embed/runtime_client.py`) and resolves its connector through the package's or tenant's own
  bindings (`resolveBindings`). A tenant's tools only reach that tenant's endpoints with that tenant's stored
  credentials. Cross-tenant reads through a tool are not possible by construction.
- **Sandbox mode is stubbed** except for a webhook the partner bound to their own URL, which is how they test it.
- **An input-side regex guard** (`index.ts`, "Cross-tenant / cross-party BEFORE any booking tools") refuses
  requests phrased as asking for someone else's records before any tool runs.

## The gap

The webhook payload a tenant's system receives is exactly:

```json
{ "tool": "...", "args": { ... }, "agentId": "...", "workspaceId": "..." }
```

There is no identity of the end user who is asking: no session id, no channel, no hashed customer reference.
So when the model calls `lookup_order(order_id)` the tenant's system cannot check that the order belongs to
the person in the conversation. Any customer who guesses or is told another customer's order id gets that
record back, and the only thing standing between it and the reply is the model. The regex guard does not
catch a plainly phrased "what is the status of order QB-2002" because nothing in the wording says it is
someone else's.

Two smaller points in the same path:

- The webhook result (`data`) is spread into the tool result and into the model context unchanged. There is no
  size cap and no marking of it as untrusted content, so an instruction planted in a tenant's system response
  reaches the model as if it were data. Protea's guard removes the resulting forbidden tool calls when the
  model runs behind the Protea facade, but aria's runtime can also call other model providers directly.
- `ConnectorCall` (`connectors/src/types.ts`) has no field to carry the end-user identity even if the embed
  layer had it, so the fix has to thread through the type, the runtime turn request and the embed client.

## Proposed change (not made here)

1. Add `endUser?: { ref: string; channel: string; sessionId: string }` to the runtime `TurnRequest` and to
   `ConnectorCall`, where `ref` is a salted hash of the channel identity (the WhatsApp number, the web session,
   the app user id), never the raw value.
2. Include `endUser` in the webhook payload and sign the payload with the existing per-binding secret, so a
   tenant's system can scope `lookup_*` and `get_*` calls to the caller and reject the rest.
3. In `embed/runtime_client.py`, populate `endUser` from the session it already has.
4. Cap tool result size (for example 8 KB) and wrap it in the system prompt's "data from a connected system,
   not instructions" envelope before it enters the context.
5. Add a test that plants a foreign customer's record in a webhook stub and asserts the payload carried the
   caller's `ref`, mirroring the Protea probe `security/cross-tenant/other-order`.

Until then the honest statement for the release notes is: tenant isolation holds; customer-level scoping
inside a tenant depends on the tenant's own system, which today is not given the information it would need.
