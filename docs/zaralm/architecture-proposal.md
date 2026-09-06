# ZaraLM v0 — Architecture Proposal

**Date:** 2026-09-06 · **Status:** proposed (Phase 0) · **Depends on:** `repository-audit.md`, `data-risk-assessment.md`

## 1. Where ZaraLM lives

**Decision (updated 2026-09-06, supersedes the first draft):** the model platform is its own repository, **`MalcolmGov/protea`**, and the product is named **Protea**. "ZaraLM" remains the name used in the original specification and in these Phase 0 documents. Zara-specific logic stays in `aria`. See `protea/docs/adr/ADR-001-repository-split.md`.

Why a separate repository, not `aria` or `Gaslite`:

- The owner intends to call the model from projects outside Zara (Gaslite, the CRM and others). A model platform embedded in the Zara monolith would force every consumer to import `aria`.
- GPU tooling (torch, vLLM, training extras) must not enter the 4 GB VPS deploy pipeline of `aria`.
- `Gaslite` is an unrelated product; these Phase 0 documents live here only because it is the designated working branch.

What goes where:

| `protea` (project-agnostic) | `aria` (Zara-specific) |
|---|---|
| data pipeline, dataset + model registries, experiment tracking | Agent Compiler pipeline and validation gate |
| evaluation framework (ZaraBench is the Zara suite inside it) | AgentSpec v3 schema and converters |
| training (SFT / LoRA / QLoRA), remote GPU adapters | tool, skill and connector registries; context builder |
| serving container (vLLM), `ModelProvider` interface + adapters, client SDK | requirements/completeness engine, Copilot and voice wiring |
| router, fallback, confidence engine, model cards | Zara facade endpoints (`/v1/agent/*`, `/v1/workflow/*`, `/v1/tools/select`) |

Datasets reference `aria` and `miai-agents` as pinned sources (repository + commit); the catalogue is never a runtime dependency of Protea. `aria` pins the `protea` package version.

Layout of `protea` (adapting §6 of the brief):

```
protea/
├── README.md · pyproject.toml · .env.example · LICENSE (proprietary)
├── protea/                        # package: cli, doctor (implemented); schemas, providers, router, data_pipeline,
│                                  #   registry, evaluation, training, inference, observability, security (planned)
├── configs/{models,training,inference,evaluation}/
├── protea_data/                   # versioned datasets + manifests + cards (object storage; golden/ read-only)
├── deployment/                    # Dockerfile.train, Dockerfile.infer, compose.gpu.yml, runpod/, azure/ (generated only)
├── docs/                          # Phase 0 documents, adr/, planned reference docs
└── tests/                         # everything runs without a GPU
```

## 2. Integration points (reuse, do not rewrite)

| ZaraLM component | Reuses from `aria` | Change required |
|---|---|---|
| **ModelProvider abstraction** | `llm/*_provider.py` (Claude, OpenAI, Gemini), `server.py::_cost_aware_complete` (Ollama tiers), `embed/llm.py` (fixed-model + usage_out), `commands/admin.log_api_usage` (cost table) | New `zaralm/providers/base.py` interface (`generate`, `stream`, `generate_structured`, `health`) with adapters that *wrap* the existing provider modules; `ZaraLMProvider` speaks OpenAI-compatible HTTP to vLLM. `embed/llm.reply` and `copilot.py` migrate to it behind a feature flag (`ZARALM_PROVIDER_LAYER=1`). |
| **Catalogue runtime (TypeScript)** | `agent_runtime/packages/runtime` `GatewayModelAdapter` | None for v0: `MIAI_MODEL_MODE=gateway`, `MIAI_MODEL_GATEWAY_URL=<vllm>/v1` serves catalogue agents from ZaraLM. Add `MODEL_MAP` alias `zaralm-agent`. |
| **Agent Compiler** | `agent_platform/copilot._diagnose_and_architect_solution` (pipeline), `agent_platform/compiler.compile_agent_specification` (17-facet schema), `dependencies`, `dna`, `requirements` (+`nbq`), `connectors.detect_archetype`, `embed/agentspec`, `embed/agent_builder_v2` | `zaralm/compiler/` orchestrates the same stages; ZaraLM (or a frontier provider) replaces the keyword steps: requirement understanding, objective extraction, capability planning, workflow generation, guardrail generation. Deterministic stages (dependency graph, registries, validation, readiness) stay deterministic. Output lands as a **draft** deployment, never `live`. |
| **Requirement Completeness Engine** | `agent_platform/requirements.RequirementsGraph` + `nbq` | Extend the confidence matrix with the §30 fields (trigger, inputs, outputs, approvals, escalations, frequency, success criteria); expose `{score, missing[], can_generate}`. |
| **Schema** | `agent_platform/compiler.AgentSpecification` (17 facets), `embed/agentspec.AgentSpec` | Define `AgentSpec v3` in `zaralm/schemas/` covering §45 blocks; provide lossless converters to both existing shapes and to `zara.agent-package/v1` so nothing downstream breaks. JSON Schema exported for constrained decoding. |
| **Tool / connector / skill registries** | `embed/tool_registry`, `embed/skills_registry`, `embed/connectors_v2`, `agent_runtime` connectors + presets | Registry *readers* in `zaralm/context/`; add missing §41 fields (`risk`, `requires_confirmation`, `required_permissions`, `tenant_scoped`, `audited`) as defaults where absent. Registry becomes the single source the context builder and validators use. |
| **Workflow** | `embed/workflow_engine.WorkflowStep` node types, `compiler.WorkflowNode` | Workflow-generation dataset targets the `WorkflowStep` schema (trigger/agent/tool/condition/approval/wait/end); add `retry`, `timeout`, `compensation`, `loop` fields in v3. |
| **Validation gate** | `miai-agents/tools/validate.py`, `scripts/marketplace/validate_package.py`, `compiler.ReadinessScore` | `zaralm/compiler/validate.py`: JSON Schema → business rules → security rules (tool risk vs autonomy) → connector exists → tool exists → deployment eligibility. |
| **Evaluation** | `agent_runtime/scripts/run-evals.mjs`, `miai-agents/tools/run_evals.py` (LLM judge, repeat voting), `agents/*/evals.jsonl` expectation grammar | ZaraBench reuses the `expect` grammar for tool-calling tasks and the Python harness structure; adds schema-validity, workflow-validity, hallucination and safety scorers and the weighted `ZaraScore`. |
| **Observability** | Sentry, `api_usage` table (tokens, cost, latency, model, channel, user), `audit_events`, `ROUTE` logs | Add request_id/model_version/validation_result/fallback columns; privacy-safe logging default; feedback table linked to model version (§36–§37). |
| **Security** | Bearer/pak_/aps_ auth, `partner_id` scoping, `cryptox`, guardrails regexes, `security_pack.py` | ZaraLM inference endpoint is internal-only (token + private network); tool execution remains deterministic application logic in `embed/actions.py` and the runtime. |
| **Deployment** | Docker Compose on Hetzner, Railway, GitHub Actions deploy gate | GPU services are new: `deployment/zaralm/` (RunPod template, Azure Bicep for NC-series/Container Apps GPU, generic SSH). The VPS only hosts the router/provider layer and calls out. |

## 3. Runtime request path (v0)

```mermaid
flowchart LR
  U[Console / Voice Copilot / Embed] --> RC[Requirement Collector\nRequirementsGraph + completeness]
  RC --> AC[Agent Compiler]
  AC --> CB[Context Builder\nrelevant tools · skills · connectors · schema]
  CB --> MR[Model Router\ntask · complexity · privacy · cost · capability]
  MR -->|zaralm| Z[ZaraLM via vLLM\nOpenAI-compatible, JSON-schema constrained]
  MR -->|frontier| F[Anthropic / OpenAI / Google / Azure]
  Z --> V[Validation gate\nschema → rules → security → connectors → tools → eligibility]
  F --> V
  V -->|pass| D[Draft AgentSpec v3 → agent_platform.store]
  V -->|fail| FB[Fallback: frontier model → re-validate]
  FB --> V
  V --> O[Observability\nrequest_id · model_version · validation · fallback · cost]
  FB --> O
  O --> FE[Fallback events → review queue → dataset candidates]
```

## 4. Training path (v0)

```mermaid
flowchart TD
  A[aria/data/agents + miai-agents + registries + routing corpus] --> B[Discovery + allowlist extractors]
  B --> C[Classifier: SAFE / REVIEW / RAG_ONLY / DO_NOT_TRAIN / SECRET / PII / LICENSE]
  C --> D[Secret + PII + brand scrub · contamination check]
  D --> E[Normalize to AgentSpec v3 / tool-call / connector / workflow examples]
  E --> F[Family-aware dedup + split: train / validation / test / golden]
  F --> G[Dataset registry v0.x + Dataset Card]
  G --> H[Synthetic generation: frontier models → schema → safety → dedup → quality → LLM judge → rules → sample review]
  H --> G
  G --> I[ZaraBench baseline: base model + frontier models]
  I --> J[QLoRA SFT on cloud GPU · checkpoints · MLflow]
  J --> K[ZaraBench post-train · compare base vs ZaraLM]
  K --> L[Model registry: experimental → candidate → staging → canary → production]
  L --> M[vLLM serving · quantized AWQ/FP8 · OpenAI-compatible]
```

## 5. Provider interface (Python, mirrors §3.2)

```python
class GenerationRequest(BaseModel):
    messages: list[Message]; tools: list[ToolSchema] | None = None
    response_schema: dict | None = None      # JSON Schema for constrained decoding
    max_tokens: int = 1024; temperature: float = 0.2
    metadata: RequestMeta                     # request_id, tenant_ref (hashed), agent_id, task_type

class ModelProvider(Protocol):
    name: str; model_id: str
    async def generate(self, req: GenerationRequest) -> GenerationResponse: ...
    async def stream(self, req: GenerationRequest) -> AsyncIterator[ModelChunk]: ...
    async def generate_structured(self, req: GenerationRequest, schema: type[T]) -> T: ...
    async def health(self) -> ModelHealth: ...
```

Adapters: `ZaraLMProvider` (vLLM `/v1/chat/completions` with `response_format`/guided JSON), `AnthropicProvider`, `OpenAIProvider`, `GoogleProvider`, `AzureOpenAIProvider`, `OpenAICompatibleProvider` (Ollama, gateways), `MockProvider` (tests). Every call records usage through the existing `log_api_usage` path with `model_version` added.

## 6. Model Router and fallback (v0 scope)

- Inputs: `task_type` (agent_generation, workflow_generation, tool_select, connector_select, repair, optimize, chat), complexity estimate (input length, connector count, financial actions), privacy flag (tenant setting), cost policy, capability matrix (ZaraBench category scores per model version), latency budget, availability.
- Policy: ZaraLM is eligible only for task types where its ZaraBench category score ≥ threshold (config). Everything else routes to the configured frontier provider. Version pinning per agent (`provider:zaralm`, `model:zaralm-agent-0.1`) honoured (§57).
- Fallback: ZaraLM → validate → on failure frontier → validate; every fallback recorded (`fallback=true`, reason). Canary percentage is a config value evaluated per tenant hash (§56).
- Confidence: computed from schema validity, validator outcomes, tool/connector existence, retrieval coverage, benchmark category score and historical success rate — never from model self-report (§34).

## 7. Serving

- **Engine:** vLLM (OpenAI-compatible, guided JSON via `response_format`/outlines/xgrammar, LoRA adapter hot-loading, AWQ/FP8 quantization). ADR-001 will record alternatives (TGI, SGLang, llama.cpp for edge).
- **Endpoints:** `/v1/chat/completions` (vLLM native) plus Zara-specific FastAPI facade in `aria` (`/v1/agent/generate`, `/v1/agent/repair`, `/v1/agent/optimize`, `/v1/workflow/generate`, `/v1/tools/select`) that runs the compiler + validation gate around the model.
- **Hosting:** RunPod (pods or serverless) for v0 experiments, Azure NC-series/Container Apps GPU for the partner-facing path (Bicep generated, not applied), generic SSH GPU box adapter. The Hetzner VPS (4 GB RAM) cannot host inference.

## 8. Security architecture for ZaraLM

- Inference endpoint private (token + allowlisted egress from the VPS); no tenant documents leave the RAG layer.
- Model output is data: tool calls pass the deterministic risk/approval path (`tool_registry.requires_approval`, `approval_center`) before execution.
- Prompt construction separates system / developer / user / retrieved / tool-output segments with explicit delimiters and injection tests in ZaraBench Safety.
- Training data access: `zaralm_data/` readable by the pipeline only; golden set write-protected and hash-pinned in CI.
- Artifact access: model registry entries carry SHA-256 of adapters and configs; downloads gated by RBAC on the console.

## 9. Architecture decisions to record as ADRs in Phase 1

| ADR | Decision (proposed) |
|---|---|
| ADR-001 model serving | vLLM with OpenAI-compatible API and guided JSON |
| ADR-002 training framework | Hugging Face TRL + PEFT (QLoRA via bitsandbytes), Unsloth optional for speed; Axolotl considered |
| ADR-003 dataset format | JSONL chat-messages with tool-call blocks (OpenAI function-call shape) + per-example metadata envelope |
| ADR-004 model routing | Policy table + capability matrix from ZaraBench, canary by tenant hash |
| ADR-005 model registry | File/JSON registry versioned in git + MLflow model registry when available |
| ADR-006 ZaraLM location | superseded — recorded as `protea` ADR-001: own repository, Zara-specific logic stays in `aria` |
| ADR-007 AgentSpec v3 | Pydantic v3 schema with converters to package v1, AgentSpec v2 and 17-facet spec |
