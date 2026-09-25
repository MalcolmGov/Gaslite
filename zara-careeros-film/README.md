# Zara CareerOS — 30s launch film

Audience: recruitment agencies, job platforms, white-label partners. Delivery: 16:9, 3840×2160, ≤30s.

Real product screenshots are composited as fixed layers; titles and the end card are typeset in `render.py`,
never generated. `zara_careeros_preview_draft.mp4` is the current 540p timing draft (placeholder music, no VO).

## Render

```bash
pip install pillow numpy imageio-ffmpeg
./build.sh path/to/helena_vo.wav        # music -> VO timing + mix -> 4K -> out/zara_careeros_30s_4k.mp4
MUSIC=licensed.wav ./build.sh vo.wav     # use a licensed track instead of the placeholder score
python3 render.py --preview             # 960x540 @15fps -> out/preview.mp4
STILLS=1,7,12 python3 render.py --preview   # spot-check frames
```

`mix.py` takes the Helena VO as one continuous take and splits it at its five longest pauses. It places each line
at its scene start (+0.35s; line 1 at 0.6s, line 6 at 25.3s as the screens recede into the lockup) and speeds up any line
that overruns its slot, by at most 8%. If a line needs more than that, it stops with an error rather than let the
line run into the next scene. Music ducks 9 dB under speech, the voice is levelled to sit 9 dB above it, and the mix is normalised to -14 LUFS / -1 dBTP.
It also writes `out/vo_timed.wav` (VO only) for review.

## Timeline

| Time | Scene | Screen asset | Title | VO |
|---|---|---|---|---|
| 0–5 | Reveal: violet sweep, angled → frontal | `cand.png` | Meet Zara CareerOS. | Great careers. Exceptional talent. One intelligent connection. |
| 5–10 | Match cut, push to job card | `cand.png` → `card.png` | Discover your next move. | Help candidates discover opportunities that fit their ambitions. |
| 10–15 | Recruiter workspace, lateral move | `rec.png` → `search.png` | Find talent. See the fit. | Help recruiters uncover talent and build stronger shortlists. |
| 15–20 | Pearl-white, push to evidence | `client.png` → `evidence.png` | Clarity at every step. | Bring candidate insights, conversations and client decisions together. |
| 20–25 | Candidate + recruiter side by side | `cand.png` + `rec.png` | Your brand. Your hiring experience. | All in an experience built around your brand. |
| 25–30 | Recede to lockup, hold 27–30 | `logo.png` (or typeset wordmark) | Zara CareerOS / From possibility to placement. / Book a private demo. | Zara CareerOS. From possibility to placement. Book your demo. |

Voice: ElevenLabs **Jessica** (voice_id `cgSgspJ2msm6clMCkdW9`, bright/upbeat female), generated per line through the Zara app's
`POST /api/v1/ai/voice-tts` (server-side key; check the `X-Voice-Engine` header is ElevenLabs, not the OpenAI fallback).
The six lines are joined with 1s gaps into `out/vo/jessica_take.wav`; the pauses inside line 6 are tightened to ~0.24s.
Music: `music.py` generates an upbeat 144 BPM placeholder (3 bars per scene, so each cut lands on a downbeat).

## Still needed (drop into `assets/`)

- `search.png` — recruiter "Agency Talent Pool & Rediscovery" screen (Scene 3). Crop the app window only.
- `client.png` — client submission portal (Scene 4). Until supplied, Scene 4 renders a labelled placeholder.
- `evidence.png` — evidence close-up (Scene 4, from ~17.4s). Optional; without it Scene 4 holds on the portal push.
- `logo.png` — official Zara CareerOS logo, transparent PNG (Scene 6).
- All screens now come from the native 4K key frames (`prep_assets.py`); no upscaling.

Crop screenshots to the app window, excluding the baked-in marketing titles/captions (they contain claims such
as "0% hallucination" that the brief excludes). The white-label generator screen is intentionally not used: its
tenant presets show real third-party brands (Stripe, J.P. Morgan, Monzo…), which would read as partnership claims.
