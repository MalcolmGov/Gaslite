"""Extract film assets from the 4K key frames in MalcolmGov/AI-Careers-platform/public/images.

Usage: python3 prep_assets.py /path/to/AI-Careers-platform/public/images

Only the app window is kept: the baked-in titles, eyebrow labels and bottom captions
(e.g. "0% hallucination") are cropped away. Bounds were measured at the window's inner
edge, inside the bezel/outline.
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CROPS = {
    "search.png": ("06_recruiter_candidate_sourcing_flow.png", (495, 270, 3345, 1857)),
    "client.png": ("07_client_submission_portal_pearl.png", (1419, 321, 2419, 1754)),
    "evidence.png": ("08_client_submission_evidence_detail.png", (1252, 315, 2589, 1738)),
}


def key_emblem(src):
    """3D 'Z' emblem on near-black -> transparent PNG (luminance key, colour un-premultiplied)."""
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    bg = np.median(np.concatenate([rgb[:12].reshape(-1, 3), rgb[-12:].reshape(-1, 3)]), axis=0)
    lift = np.clip(rgb - bg, 0, None).max(axis=2)
    alpha = np.clip((lift - 14) / 70, 0, 1) ** 0.9
    col = np.where(alpha[..., None] > 0.01, bg + (rgb - bg) / np.maximum(alpha[..., None], 0.01), 0)
    out = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())


def main(images_dir):
    out = os.path.join(HERE, "assets")
    for name, (src, box) in CROPS.items():
        Image.open(os.path.join(images_dir, src)).convert("RGB").crop(box).save(os.path.join(out, name))
        print(name, box[2] - box[0], "x", box[3] - box[1])
    logo = key_emblem(os.path.join(images_dir, "zara-emblem.png"))
    logo.save(os.path.join(out, "logo.png"))
    print("logo.png", logo.size)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
