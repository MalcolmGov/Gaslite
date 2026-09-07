# Deliverables — Zara Marketplace Film v1 (2026-09-07)

All assets live in the Higgsfield library of the malcolm@movedigital.africa account (Plus). CDN links below are the
library copies; treat the Higgsfield library as the durable source.

| Asset | Link / ID |
|---|---|
| **1080p master** (1920×1080, 24 fps, H.264 CRF 15, AAC 192k, 60.0 s, −16.5 LUFS) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GrMsDfiBxcEyh4GFU0dUj59sqy/4b3b4972-024f-4ff8-a6c6-cc642e56a675.mp4 (media `4b3b4972-024f-4ff8-a6c6-cc642e56a675`) |
| **4K master** (Topaz 2160p upscale of the 1080p master) | https://d8j0ntlcm91z4.cloudfront.net/user_3GrMsDfiBxcEyh4GFU0dUj59sqy/hf_20260907_173636_66a7f414-1cae-4240-bd37-a5a08633f1ae.mp4 (job `66a7f414-1cae-4240-bd37-a5a08633f1ae`, 3840×2160 HEVC) |
| Review copy (1080p, 20 MB) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GrMsDfiBxcEyh4GFU0dUj59sqy/4be89be2-3e49-4d2b-ae65-6811be70268a.mp4 |
| Cut sheet (16 frames) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GrMsDfiBxcEyh4GFU0dUj59sqy/e991fb2e-3936-409b-b47f-9e2aef3a4477.jpg |
| End card layers | rendered by `pipeline/endcard.py` (Montserrat ExtraBold wordmark, Montserrat Medium tagline) |

## Source generations (Higgsfield job IDs)

| Shot | Job ID | Model / mode | Length |
|---|---|---|---|
| 1 Cold open | `c3e4c9f3-3b6e-4a38-8af4-5ee0e2a6679c` | Cinema Studio 3.0, image-to-video from still `a13d85c8-1644-4348-9ecb-39d19557f16b` | 7 s |
| 2 The ask | `caa3646a-4026-4c69-84be-03d7bb46ea4a` | Cinema Studio 3.0, image-to-video from still `a38b2cf8-9aec-46ed-bdeb-e516771676f1` (founder anchor) | 8 s |
| 3 Voice → agent | `4409e40f-63d4-4903-87dd-08084850fd68` | Cinema Studio 3.0, image-to-video from still `dd7632e1-c482-4fd9-b484-8bca72b32397` (retake; text-to-video `92d76358-7601-4c77-b129-63d5f482de88` rejected) | 8 s |
| 4 Boardroom | `b8db5085-88e9-48aa-b4f6-cd4df1140287` | Cinema Studio 3.0, text-to-video (cost test, kept) | 8 s |
| 5 Connectors | `2d320943-be76-49a8-b210-fdd633c7f925` | Cinema Studio 3.0, image-to-video from still `dc411479-66d0-41f2-88e0-f09a9d601f1d` | 10 s |
| 6 Execution | `26004953-e84b-4bb7-84f5-63f6f40e57c2` | Cinema Studio 3.0, image-to-video from still `df96af11-1d13-4716-983c-f37cb48c8845` | 7 s |
| 7 Resolve | `8cd510a0-c379-4ae3-9e14-4f63543f0419` | Cinema Studio 3.0, image-to-video from still `981011c8-07a7-4858-a6e9-53fb14ebdbf8` | 6 s |

Voiceover (ElevenLabs via Text to Speech V2, voice Callan; founder line by Vesper):
`3c70499d…` L1, `8232ef57…` L2 narrator, `a872a011…` L2 founder line, `c2fd4dab…` L3 (retake), `3eb51451…` L4,
`0ea4bdb0…` L5, `a5e1abe2…` L6, `ac6e6a18…` L7, `11d804c7…` tagline. Full IDs are in `pipeline/clips.env`.

## Known limitations of v1

- **Score is a synthesized placeholder** (no music model on Higgsfield). Replace before external release.
- Shot 2's lip motion is not synced to the VO; the orb rings carry the "speech".
- The 4K master is an upscale, not native 4K (native would have cost ~1,344 credits, above the balance).
- Founder continuity is strong but not pixel-identical between shots 1, 2 and 7 (reference-image generation).
