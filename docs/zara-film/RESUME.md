# Resume here — Zara Marketplace Film, v2 in progress (paused 2026-09-07 ~18:10 UTC)

## Where things stand

**v1 is delivered** (60 s, 1080p + 4K, Callan VO). Links in `deliverables.md`. Draft PR #24 carries this folder.

**v2 rewrites the film to name the offering** after feedback that v1 never said what Zara *is*. Everything for v2 is
generated; the final assembly was rendering when we paused (it uploads itself to the Higgsfield library on completion).

### v2 script (Callan; founder line by Vesper)
1. Every business runs on a thousand decisions a day. Most of them still wait for you — after hours, by hand, at a cost.
2. But what if you could just… say the problem? / *"We're losing customers after the first order."*
3. Zara hears it — and builds the agent for it. No code.
4. **(agent library beat)** Or pick from over a hundred pre-built agents — finance, sales, support, operations, legal, HR — plug and play, across every industry.
5. Then it convenes a boardroom. A CFO. Sales. Legal. Operations. They deliberate — and agree on one plan.
6. A plan that reaches into the systems you already run — Xero, Salesforce, HubSpot. Secure. Compliant.
7. You approve. It executes — overnight, at a fraction of the cost, with no manual work. Every step tracked.
8. **(globe beat)** Zara. The agentic marketplace for business. Live on five continents.
9. This isn't software you operate. It's a business that runs itself.
10. End card: Zara. Describe the problem. We'll run the business. — with the line THE AGENTIC MARKETPLACE FOR BUSINESS and the proof strip
    PLUG-AND-PLAY AGENTS · NO CODE · SECURE · COMPLIANT · FIVE CONTINENTS.

Kinetic titles: shot 3 "PLUG-AND-PLAY AGENTS · NO CODE"; shot 5 "SECURE · COMPLIANT"; shot 6 the Ghost-Executive overnight line
(14 receipts processed · supplier anomaly flagged · overdue client chased · every step tracked); globe "LIVE ON FIVE CONTINENTS".

### v2 beats (≈81.6 s total)
| Beat | Source | Length |
|---|---|---|
| 1 Cold open | v1 shot 1, slowed to 8.5 s | 8.5 |
| 2 The ask | v1 shot 2 | 8.0 |
| 3 Voice → agent | v1 shot 3 | 8.0 |
| **4 Agent library** | designed motion graphic `pipeline/v2/library.py` (113 agents / 15 industries, 8 flagship cards with Rand savings, AI CFO goes Live) | 11.0 |
| 5 Boardroom (score drop) | v1 shot 4 | 8.0 |
| 6 Connectors | v1 shot 5 | 10.0 |
| 7 Execution | v1 shot 6, slowed to 8.0 s | 8.0 |
| **8 Globe** | NEW Cinema Studio 3.0 i2v, job `dff4100e-c4aa-4cc5-932b-279ed762f2c8` (still `a723e721-5cd0-446c-a3c9-8cba78268cca`) | 8.0 |
| 9 Resolve | v1 shot 7 | 6.0 |
| End card | 3 layers (`pipeline/v2/endcard.py`) | 8.4 |

### v2 VO job IDs (ElevenLabs via text2speech_v2)
new: L1 `ada3e09b-3286-457d-8248-b1b10b296c78`, L3 `66cf5395-56f8-428a-9dc3-ee3c8de6a0cf`, L4-library `cd8c1231-1ba1-4cd0-b0fe-56254760ead7`,
L6 `e8b07533-23fd-425b-a29b-074494dc27fd` (retake), L7 `8e76ed41-3f83-4d65-8908-e4b14ad39a4a`, L8-globe `43060325-9551-4ed7-ba0a-c76e9ca2c7da` (retake).
reused from v1: L2 `8232ef57…`, founder `a872a011…`, L5 `3eb51451…`, L9 `ac6e6a18…`, tagline `11d804c7…`.
Rejected: first L6 take (`e17655c8…`, "in compliance" was hearable as "incompliance") and first L8 take (`0e136c51…`, muddy "agentic").

### v2 outputs (Higgsfield media slots, uploaded by the assembly when it finishes)
- 1080p master → media `6df6a06e-5fb7-47e5-b5d7-64811f969bb9` (https://d2ol7oe51mr4n9.cloudfront.net/user_3GrMsDfiBxcEyh4GFU0dUj59sqy/6df6a06e-5fb7-47e5-b5d7-64811f969bb9.mp4)
- review copy → media `23a2f190-e2c3-4915-82ba-7ff9b62aa143`
- 20-frame cut sheet → media `d3f6a89d-f703-4ad1-b6c8-e8fde28d50ba`
If those were confirmed before the pause, they show in the library; if not, run `media_confirm` (type video / image) first.

## To finish v2 tomorrow
1. Review the v2 cut sheet + review copy (links above). Check the four titles, the library beat, the globe, the end card.
2. Topaz 2160p upscale of the v2 master (`upscale_video`, provider topaz, video_id = the master media id; ~1 cr/s ≈ 55–80 cr).
3. Send the review copy in chat; update the brief artifact (`https://claude.ai/code/artifact/5075ec19-a0dc-44cb-a884-4135589786a8`) status + links
   (generator: scratch `make_artifact.py` pattern — results section + status; embed the new cut sheet as a data URI).
4. Update `deliverables.md`, `ledger.md`, `README.md` for v2; commit on `claude/zara-marketplace-film-pmyf3p`; PR #24 picks it up.
5. Open items carried from v1: score is still a synthesized placeholder; 4K is an upscale; shot 2 lips are not synced.

## Credits
Opening 1198 → 514 after v1 (684 used). v2 so far: 6 + 2 VO lines (~2.6), globe still (2), globe i2v (80) → balance ≈ 429 before the v2 4K upscale.

## Gotchas learned (keep)
- A one-frame `xfade` truncates the chain in ffmpeg 5.1 → hard cuts must be `concat`, and `concat` output needs `settb=1/24` before the next `xfade`.
- Reusing an upload slot makes CloudFront serve the *first* upload; always request a fresh `media_upload` slot for a re-upload.
- The sandbox dies ~10 s after a foreground call; a background `sleep` holds a 15-minute lease so multi-call setups survive.
- Sandbox tool calls cap at 60 s wall-clock; keep polls short and put long work in `background:true`.
- Cinema Studio 3.0 sometimes returns a preset recommendation instead of a job; resubmit with `declined_preset_id`.
