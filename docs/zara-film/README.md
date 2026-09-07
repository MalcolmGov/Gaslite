# Zara Marketplace Film — production log (v1, 2026-09-07)

60-second cinematic brand film for the Business Agent Marketplace ("Describe the problem. Zara runs the business."),
fully AI-generated on Higgsfield from the production brief artifact. This folder is the reproducible record:
prompts, job IDs, the assembly pipeline, and the credit ledger.

## Deliverables

| Asset | Where |
|---|---|
| 1080p master (H.264, AAC, 60.0 s, 24 fps) | Higgsfield media (see `deliverables.md`) |
| 4K master (Topaz upscale to 3840×2160) | Higgsfield media (see `deliverables.md`) |
| Contact sheet of the cut | `deliverables.md` |
| Shot prompts (final) | `shot-prompts.md` / `shot-prompts.json` |
| Assembly pipeline | `pipeline/` (`assemble.sh`, `build.py`, `endcard.py`, `score.sh`, `clips.env`) |

## Pipeline

1. **Prompt refinement** — a lens-panel workflow (cinematographer / motion-VFX / brand lenses) drafted every shot,
   one judge per shot merged the best ideas, and a continuity critic locked one verbatim founder description
   and a shared light vocabulary across all seven shots.
2. **Keyframe stills first** (Nano Banana Pro, 2 credits each) — the founder anchor still (shot 2) was generated
   from text; shots 1 and 7 were generated with that still as an image reference so the founder is the same
   person in every appearance. Stills were cropped of the model's pillar/letterbox bars before use.
3. **Shots** — Cinema Studio Video 3.0 (`cinematic_studio_3_0`), 16:9, 1080p, sized to each VO line.
   Shots 1, 2, 5, 6, 7 are image-to-video from their stills; shot 4 (hero) is text-to-video; shot 3 was
   retaken as image-to-video after the text-to-video pass produced an anatomy-scan figure with pseudo-text HUD.
4. **Voiceover** — ElevenLabs via Text to Speech V2, voice **Callan** (narrator) and **Vesper** (the founder's
   quoted line in shot 2). Every line was transcribed back with Whisper to catch glitches (line 3 repeated a
   sentence on the first take and was regenerated).
5. **Score** — Higgsfield exposes no standalone music model, so the bed is a synthesized ambient tech drone
   (`pipeline/score.sh`, sox) with a riser into the Boardroom cut and an impact on it. **Placeholder**: swap for a
   licensed or ElevenLabs Music track before external release.
6. **Assembly** — ffmpeg in the Higgsfield sandbox (`pipeline/assemble.sh`): hard cuts via `concat`, dissolves via
   `xfade`, VO lines loudness-normalized and placed on the timeline, score side-chain ducked under the VO,
   end card (gradient wordmark, tagline, URL) composited as two alpha-faded layers, mix limited and
   verified with EBU R128.
7. **4K** — Topaz Video upscale of the finished 1080p master to 2160p (1 credit per second).

Note: the brief planned higgsedit for assembly; ffmpeg was used instead because the live-editor hand-off tool is
not exposed in this session and ffmpeg gave deterministic, verifiable output. A one-frame `xfade` "cut" truncates
the chain in ffmpeg 5.1 (everything after it renders black) — hard cuts must be `concat`.

## Timeline (seconds)

| Shot | Start | Clip | Transition in | VO |
|---|---|---|---|---|
| 1 Cold open | 0.00 | 7.04 s | — | L1 @ 1.0 |
| 2 The ask | 7.04 | 8.04 s | cut | L2 narrator @ 7.5, founder line @ 10.9 |
| 3 Voice → agent | 14.58 | 8.04 s | 0.5 s dissolve | L3 @ 15.2 |
| 4 Boardroom (hero) | 22.63 | 8.04 s | cut (score drop) | L4 @ 22.1 |
| 5 Connectors | 30.17 | 10.04 s | 0.5 s dissolve | L5 @ 32.0 |
| 6 Execution | 40.21 | 7.04 s | cut | L6 @ 40.6 |
| 7 Resolve | 46.75 | 6.04 s | 0.5 s dissolve | L7 @ 47.4 |
| End card | 52.19 | to 60.0 | 0.6 s fade | tagline @ 53.8 |

## Credits ledger

See `ledger.md`.
