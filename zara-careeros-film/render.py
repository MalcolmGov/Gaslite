"""Zara CareerOS 30s launch film — 4K compositor.

Real product screenshots are composited as fixed layers (never regenerated).
Titles and wordmark are typeset here, not generated.
Usage: python3 render.py [--preview]   (preview = 960x540 @ 15fps)
"""
import math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda p: os.path.join(HERE, "assets", p)
PREVIEW = "--preview" in sys.argv
W, H = (960, 540) if PREVIEW else (3840, 2160)
FPS = 15 if PREVIEW else 30
DUR = 30.0
K = W / 3840.0  # layout scale

NAVY = (7, 10, 26)
PEARL = (244, 245, 250)
VIOLET = (124, 92, 255)
CYAN = (56, 208, 232)

F_BOLD = A("inter-latin-700-normal.ttf")
F_SEMI = A("inter-latin-600-normal.ttf")
F_REG = A("inter-latin-400-normal.ttf")


def font(path, px):
    return ImageFont.truetype(path, max(8, int(px * K)))


def ease(t):  # smooth cubic in-out
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def ramp(t, a, b):
    return ease((t - a) / (b - a)) if b > a else float(t >= a)


# ---------- assets ----------
def load_screen(name, upscale):
    im = Image.open(A(name)).convert("RGB")
    if not PREVIEW and im.width < 2000:  # native 4K captures are used as-is
        im = im.resize((int(im.width * upscale), int(im.height * upscale)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return im


SCREENS = {}


def screen(name):
    if name not in SCREENS:
        SCREENS[name] = load_screen(name, 2.4)
    return SCREENS[name]


def optional(name):
    return name if os.path.exists(A(name)) else None


# ---------- backgrounds ----------
def radial(w, h, cx, cy, r, col, strength):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - cx) / r) ** 2 + ((y - cy) / r) ** 2)
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    return a[..., None] * np.array(col, np.float32)[None, None]


def studio_bg():
    base = np.zeros((H, W, 3), np.float32) + np.array(NAVY, np.float32)
    # vertical falloff: darker ceiling, faint floor plane
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    base *= 0.75 + 0.35 * yy
    base += radial(W, H, W * 0.5, H * 0.55, W * 0.55, VIOLET, 0.18)
    base += radial(W, H, W * 0.85, H * 0.9, W * 0.35, CYAN, 0.05)
    # floor horizon line + faint architectural grid lines
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img, "RGBA")
    hz = int(H * 0.80)
    for i, yv in enumerate([hz, hz + int(80 * K), hz + int(200 * K), hz + int(380 * K)]):
        d.line([(0, yv), (W, yv)], fill=(150, 140, 255, 26 - i * 4), width=max(1, int(2 * K)))
    return img


def pearl_bg():
    base = np.zeros((H, W, 3), np.float32) + np.array(PEARL, np.float32)
    base -= radial(W, H, W * 0.5, H * 1.25, W * 0.8, (40, 40, 60), 0.35)
    base += radial(W, H, W * 0.5, H * 0.45, W * 0.45, (255, 255, 255), 0.6)
    base -= radial(W, H, W * 0.15, H * 0.5, W * 0.3, (60, 50, -40), 0.10)
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


BG_STUDIO = studio_bg()
BG_PEARL = pearl_bg()


# ---------- drawing helpers ----------
def shadow_for(size, radius, opacity, dark=True):
    w, h = size
    pad = int(radius * 3)
    sh = Image.new("L", (w + pad * 2, h + pad * 2), 0)
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + radius // 2, pad + w, pad + h + radius // 2],
                                         radius=int(28 * K), fill=int(255 * opacity))
    return sh.filter(ImageFilter.GaussianBlur(radius)), pad


def rounded_mask(size, r):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=r, fill=255)
    return m


def place(canvas, src, cx, cy, width, alpha=1.0, glow=None, reflect=False, shadow=0.55,
          persp=0.0, crop=None):
    """Composite a screen centred at (cx,cy) with given display width.
    persp: 0 = frontal, >0 = rotated about the vertical axis (right edge further away)."""
    if alpha <= 0.003:
        return
    if crop:
        src = src.crop(crop)
    width = max(4, int(width))
    height = int(width * src.height / src.width)
    im = src.resize((width, height), Image.BILINEAR if not PREVIEW else Image.BILINEAR)
    r = max(2, int(22 * K * width / (2700 * K)))
    mask = rounded_mask(im.size, r)
    x0, y0 = int(cx - width / 2), int(cy - height / 2)

    if persp > 0.001:
        # right edge shrinks vertically and shifts left: simple keystone
        k = persp
        dst = [(0, 0), (width * (1 - 0.10 * k), height * 0.07 * k),
               (width * (1 - 0.10 * k), height * (1 - 0.07 * k)), (0, height)]
        coeffs = _persp_coeffs(dst, [(0, 0), (width, 0), (width, height), (0, height)])
        im = im.transform(im.size, Image.PERSPECTIVE, coeffs, Image.BILINEAR)
        mask = mask.transform(mask.size, Image.PERSPECTIVE, coeffs, Image.BILINEAR)

    if glow:
        gcol, gstr = glow
        g = Image.new("RGBA", (width + int(240 * K), height + int(240 * K)), gcol + (0,))
        gm = Image.new("L", g.size, 0)
        off = int(120 * K)
        gm.paste(mask, (off, off))
        gm = gm.filter(ImageFilter.GaussianBlur(int(70 * K) + 1)).point(lambda v: int(v * gstr * alpha))
        g.putalpha(gm)
        canvas.alpha_composite(g, (x0 - off, y0 - off))

    if shadow > 0:
        sh, pad = shadow_for(im.size, int(60 * K) + 1, shadow * alpha)
        layer = Image.new("RGBA", sh.size, (0, 0, 0, 0))
        layer.putalpha(sh)
        canvas.alpha_composite(layer, (x0 - pad, y0 - pad + int(30 * K)))

    if reflect:
        ref_h = int(height * 0.28)
        ref = im.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, width, ref_h))
        grad = Image.linear_gradient("L").resize((width, ref_h)).point(lambda v: int((255 - v) * 0.16 * alpha))
        rm = mask.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, width, ref_h))
        grad = Image.fromarray((np.asarray(grad, np.float32) * np.asarray(rm, np.float32) / 255).astype(np.uint8))
        ref = ref.filter(ImageFilter.GaussianBlur(max(1, int(6 * K)))).convert("RGBA")
        ref.putalpha(grad)
        canvas.alpha_composite(ref, (x0, y0 + height + int(18 * K)))

    m = mask if alpha >= 0.999 else mask.point(lambda v: int(v * alpha))
    rgba = im.convert("RGBA")
    rgba.putalpha(m)
    canvas.alpha_composite(rgba, (x0, y0))
    # hairline glass edge
    edge = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle([0, 0, width - 1, height - 1], radius=r,
                                           outline=(255, 255, 255, int(40 * alpha)), width=max(1, int(2 * K)))
    if persp <= 0.001:
        canvas.alpha_composite(edge, (x0, y0))


def _persp_coeffs(pa, pb):
    m = []
    for p1, p2 in zip(pa, pb):
        m.append([p1[0], p1[1], 1, 0, 0, 0, -p2[0] * p1[0], -p2[0] * p1[1]])
        m.append([0, 0, 0, p1[0], p1[1], 1, -p2[1] * p1[0], -p2[1] * p1[1]])
    A_ = np.array(m, float)
    B = np.array(pb, float).reshape(8)
    return np.linalg.solve(A_, B).tolist()


def text_c(canvas, s, y, px, alpha, color=(255, 255, 255), fpath=F_BOLD, track=0, rise=0.0):
    if alpha <= 0.003:
        return
    f = font(fpath, px)
    d = ImageDraw.Draw(canvas)
    bbox = d.textbbox((0, 0), s, font=f)
    tw = bbox[2] - bbox[0]
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text(((W - tw) / 2 - bbox[0], y * K + rise * K), s, font=f,
                               fill=color + (int(255 * alpha),))
    canvas.alpha_composite(layer)


def light_sweep(canvas, pos, strength, angle=-0.35, width_px=380, col=VIOLET):
    """Narrow soft band of light travelling across frame; pos 0..1."""
    if strength <= 0.003:
        return
    y, x = np.mgrid[0:H:4, 0:W:4].astype(np.float32)
    cx = (-0.2 + 1.4 * pos) * W
    d = (x - cx) + (y - H / 2) * angle
    a = np.exp(-(d / (width_px * K)) ** 2) * strength
    a = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
    layer = Image.new("RGBA", (W, H), col + (0,))
    layer.putalpha(a)
    canvas.alpha_composite(layer)


def screen_add_sheen(canvas, pos, strength):
    light_sweep(canvas, pos, strength, angle=-0.5, width_px=220, col=(255, 255, 255))


# ---------- layout constants (at 3840 wide) ----------
TITLE_Y = 150
SCREEN_CY = 1240
SCREEN_W = 2760


# ---------- titles ----------
TITLES = {
    1: ("Meet Zara CareerOS.", (1.6, 2.4), (255, 255, 255)),
    2: ("Discover your next move.", (0.3, 1.0), (255, 255, 255)),
    3: ("Find talent. See the fit.", (0.3, 1.0), (255, 255, 255)),
    4: ("Clarity at every step.", (0.3, 1.0), (14, 18, 40)),
    5: ("Your brand. Your hiring experience.", (0.3, 1.0), (255, 255, 255)),
}


def title(c, n, t, color=None):
    s, (a, b), col = TITLES[n]
    text_c(c, s, TITLE_Y, 150, ramp(t, a, b), color=color or col, rise=24 * (1 - ramp(t, a, b)) if n == 1 else 0.0)


# ---------- AI plates ----------
# Optional assets/plate_s{n}.jpg: a generated cinematic shot that opens scene n full-bleed
# (slow push-in), then softens into a blurred, toned backdrop as the real screen arrives.
# Plates carry no text or UI; the product itself is only ever shown via real screenshots.
PLATE_IN = (1.2, 1.9)  # full-bleed -> backdrop crossfade, scene-local seconds
STAGE = {"bg": None}


def _cover(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * s + 0.5), int(im.height * s + 0.5)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def _plate(n):
    path = optional(f"plate_s{n}.jpg") or optional(f"plate_s{n}.png")
    if not path:
        return None
    src = Image.open(A(path)).convert("RGB")
    ow, oh = int(W * 1.12), int(H * 1.12)  # headroom for the push-in
    sharp = _cover(src, ow, oh)
    soft = sharp.filter(ImageFilter.GaussianBlur(max(2, int(28 * K))))
    tone = PEARL if n == 4 else NAVY
    soft = Image.blend(soft, Image.new("RGB", soft.size, tone), 0.55 if n == 4 else 0.5)
    return sharp.convert("RGBA"), soft.convert("RGBA")


PLATES = {n: _plate(n) for n in range(1, 6)}


def plate_frame(n, t, soft):
    sharp_im, soft_im = PLATES[n]
    im = soft_im if soft else sharp_im
    z = 1.12 - 0.10 * ease(t / 5.0)  # slow push-in across the scene
    w, h = int(W * z), int(H * z)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h)).resize((W, H), Image.BILINEAR)


def stage(default):
    return STAGE["bg"].copy() if STAGE["bg"] is not None else default.convert("RGBA")


def with_plate(n, fn, t):
    if PLATES.get(n) is None:
        return fn(t)
    mix = ramp(t, *PLATE_IN)
    STAGE["bg"] = plate_frame(n, t, soft=True)
    try:
        comp = fn(t) if mix > 0 else None
    finally:
        STAGE["bg"] = None
    if mix >= 1:
        return comp
    full = plate_frame(n, t, soft=False)
    light = n == 4  # pearl scene: light plate, dark title
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shade).rectangle([0, 0, W, int(420 * K)], fill=(255, 255, 255, 90) if light else (0, 0, 0, 115))
    full.alpha_composite(shade.filter(ImageFilter.GaussianBlur(int(120 * K) + 1)))  # title legibility
    title(full, n, t)
    return full if comp is None else Image.blend(full, comp, ease(mix))


# ---------- scenes ----------
def s1_reveal(t):  # 0-5
    c = stage(BG_STUDIO)
    sw = ramp(t, 0.0, 2.2)
    light_sweep(c, sw, 0.55 * (1 - ramp(t, 2.0, 3.2)) + 0.05, width_px=260)
    k = 1 - ramp(t, 0.3, 3.6)
    w = (SCREEN_W * (0.84 + 0.16 * ramp(t, 0.3, 3.6)))
    a = ramp(t, 0.25, 1.2)
    place(c, screen("cand.png"), W / 2 + 120 * K * k, SCREEN_CY * K, w * K, alpha=a, persp=0.9 * k,
          glow=(VIOLET, 0.35), reflect=True)
    screen_add_sheen(c, ramp(t, 1.0, 3.2), 0.10 * (1 - ramp(t, 3.0, 3.4)))
    title(c, 1, t)
    return c


# Job card location inside cand.png (fraction of its size), measured from the crop
CARD_BOX = (917 / 2850, 853 / 1608, 1817 / 2850, 1095 / 1608)


def s2_opportunities(t):  # 5-10, t local 0-5
    c = stage(BG_STUDIO)
    src = screen("cand.png")
    z = ease(min(t / 3.2, 1))
    # interpolate from full frame to a crop centred on the job card
    cx0, cy0, cx1, cy1 = CARD_BOX
    fx, fy = (cx0 + cx1) / 2, (cy0 + cy1) / 2
    zoom = 1 + 1.25 * z
    vw, vh = src.width / zoom, src.height / zoom
    cxp = 0.5 + (fx - 0.5) * z
    cyp = 0.5 + (fy - 0.5) * z
    x0 = min(max(cxp * src.width - vw / 2, 0), src.width - vw)
    y0 = min(max(cyp * src.height - vh / 2, 0), src.height - vh)
    view = (int(x0), int(y0), int(x0 + vw), int(y0 + vh))
    card_a = ramp(t, 2.6, 3.4)
    place(c, src, W / 2, SCREEN_CY * K, SCREEN_W * K, alpha=1.0, crop=view, glow=(VIOLET, 0.3),
          reflect=(z < 0.05))
    if card_a > 0:
        # dim the dashboard, lift the crisp card asset forward with a cyan accent
        dim = Image.new("RGBA", (W, H), NAVY + (int(150 * card_a),))
        c.alpha_composite(dim)
        grow = 1 + 0.03 * ramp(t, 3.0, 5.0)
        place(c, screen("card.png"), W / 2, SCREEN_CY * K, 2700 * K * grow, alpha=card_a,
              glow=(CYAN, 0.55), shadow=0.7)
        screen_add_sheen(c, ramp(t, 3.2, 4.6), 0.08)
    title(c, 2, t)
    return c


def s3_sourcing(t):  # 10-15
    c = stage(BG_STUDIO)
    rec, src2 = screen("rec.png"), optional("search.png")
    if src2:
        # lateral move: cockpit slides left, search slides in from the right
        p = ramp(t, 2.1, 2.9)
        off = 3400 * K
        place(c, rec, W / 2 - off * p, SCREEN_CY * K, SCREEN_W * K * (1 + 0.02 * t / 5),
              glow=(VIOLET, 0.3), alpha=1 - 0.4 * p)
        place(c, screen("search.png"), W / 2 + off * (1 - p), SCREEN_CY * K,
              SCREEN_W * K * (1 + 0.02 * max(0, t - 2.5) / 2.5), glow=(VIOLET, 0.3))
    else:
        drift = ramp(t, 0, 5)
        place(c, rec, W / 2 + 60 * K * (1 - drift), SCREEN_CY * K, SCREEN_W * K * (1 + 0.05 * drift),
              glow=(VIOLET, 0.3), reflect=True)
    title(c, 3, t)
    return c


def s4_client(t):  # 15-20
    c = stage(BG_PEARL)
    name = optional("client.png")
    if name:
        src = screen(name)
        z = ramp(t, 0.2, 5.0)
        # fit a window of the portal inside the stage box, then push in and drift down the page
        box_w, box_h = (1430, 1640) if src.height > src.width else (SCREEN_W, 1640)
        zoom = 1 + 0.18 * z
        vw = src.width / zoom
        vh = min(src.height, vw * box_h / box_w)
        x0 = (src.width - vw) / 2
        y0 = (src.height - vh) * 0.5 * z
        place(c, src, W / 2, (SCREEN_CY + 50) * K, box_w * K, crop=(int(x0), int(y0), int(x0 + vw), int(y0 + vh)),
              shadow=0.18, glow=(VIOLET, 0.12))
        ev = optional("evidence.png")
        if ev:
            # push resolves onto the evidence close-up, lifted forward on the pearl stage
            ea = ramp(t, 2.4, 3.1)
            if ea > 0:
                c.alpha_composite(Image.new("RGBA", (W, H), PEARL + (int(170 * ea),)))
                esrc = screen(ev)
                ew = min(2600, 1640 * esrc.width / esrc.height) * K
                place(c, esrc, W / 2, (SCREEN_CY + 50) * K, ew * (1 + 0.03 * ramp(t, 2.8, 5.0)), alpha=ea,
                      shadow=0.25, glow=(VIOLET, 0.18))
    else:
        # placeholder frame until the supplied client submission screen is added
        ph = Image.new("RGB", (1500, 857), (255, 255, 255))
        d = ImageDraw.Draw(ph)
        d.rectangle([0, 0, 1499, 856], outline=(210, 210, 225), width=4)
        d.text((60, 400), "PLACEHOLDER - client submission screen (awaiting asset)",
               font=ImageFont.truetype(F_SEMI, 44), fill=(150, 150, 170))
        place(c, ph, W / 2, SCREEN_CY * K, SCREEN_W * K * 0.9, shadow=0.18)
    title(c, 4, t)
    return c


def s5_whitelabel(t):  # 20-25
    c = stage(BG_STUDIO)
    a = ramp(t, 0.0, 0.5)
    sw = 1780
    drift = ramp(t, 0, 5)
    place(c, screen("cand.png"), W / 2 - 945 * K, 1260 * K, sw * K * (1 + 0.03 * drift), alpha=a,
          glow=(VIOLET, 0.3), reflect=True)
    place(c, screen("rec.png"), W / 2 + 945 * K, 1260 * K, sw * K * (1 + 0.03 * drift), alpha=a,
          glow=(CYAN, 0.22), reflect=True)
    light_sweep(c, ramp(t, 0.8, 3.6), 0.22, width_px=200)
    title(c, 5, t)
    return c


def s6_invitation(t):  # 25-30
    c = stage(BG_STUDIO)
    r = ramp(t, 0.0, 1.8)
    if r < 1:
        sw = 1780 * (1 - 0.35 * r)
        a = 1 - r
        place(c, screen("cand.png"), W / 2 - 945 * K * (1 - 0.3 * r), (1260 - 120 * r) * K, sw * K,
              alpha=a, glow=(VIOLET, 0.3 * a))
        place(c, screen("rec.png"), W / 2 + 945 * K * (1 - 0.3 * r), (1260 - 120 * r) * K, sw * K,
              alpha=a, glow=(CYAN, 0.22 * a))
    # closing lockup: fully settled by 27.0s and held still to 30.0s
    la = ramp(t, 1.2, 2.0)
    if LOGO is not None:
        # official emblem above the typeset wordmark; settles with a small rise
        lh = int(460 * K)
        lg = LOGO.resize((int(lh * LOGO.width / LOGO.height), lh), Image.LANCZOS)
        lg.putalpha(lg.getchannel("A").point(lambda v: int(v * la)))
        rise = int(30 * K * (1 - la))
        c.alpha_composite(lg, (int((W - lg.width) / 2), int(430 * K - lh / 2) + rise))
        wordmark(c, 870, la)
    else:
        wordmark(c, 820, la)
    dy = 50 if LOGO is not None else 0
    text_c(c, "From possibility to placement.", 1060 + dy, 92, ramp(t, 1.5, 2.0), color=(214, 218, 240), fpath=F_REG)
    cta_a = ramp(t, 1.7, 2.0)
    pill(c, "Book a private demo.", 1330 + dy, cta_a)
    return c


LOGO = Image.open(A("logo.png")).convert("RGBA") if os.path.exists(A("logo.png")) else None


def wordmark(c, y, a):
    """Typeset 'Zara CareerOS' wordmark (stand-in until the official logo file is supplied)."""
    if a <= 0.003:
        return
    f = font(F_BOLD, 200)
    d = ImageDraw.Draw(c)
    p1, p2 = "Zara ", "CareerOS"
    w1 = d.textlength(p1, font=f)
    w2 = d.textlength(p2, font=f)
    x = (W - (w1 + w2)) / 2
    layer = Image.new("RGBA", c.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.text((x, y * K - 120 * K), p1, font=f, fill=(255, 255, 255, int(255 * a)))
    ld.text((x + w1, y * K - 120 * K), p2, font=f, fill=(150, 170, 255, int(255 * a)))
    c.alpha_composite(layer)


def pill(c, s, y, a):
    if a <= 0.003:
        return
    f = font(F_SEMI, 70)
    d = ImageDraw.Draw(c)
    tw = d.textlength(s, font=f)
    padx, h = 90 * K, 150 * K
    x0 = (W - tw) / 2 - padx
    layer = Image.new("RGBA", c.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([x0, y * K, x0 + tw + 2 * padx, y * K + h], radius=h / 2,
                         fill=VIOLET + (int(235 * a),))
    ld.text(((W - tw) / 2, y * K + h / 2), s, font=f, fill=(255, 255, 255, int(255 * a)), anchor="lm")
    c.alpha_composite(layer)


SCENES = [(0, 5, s1_reveal), (5, 10, s2_opportunities), (10, 15, s3_sourcing),
          (15, 20, s4_client), (20, 25, s5_whitelabel), (25, 30, s6_invitation)]
XF = 0.3  # short dissolve between scenes (s1->s2 is a match cut: identical framing)


def frame(t):
    for i, (a, b, fn) in enumerate(SCENES):
        if a <= t < b or (i == len(SCENES) - 1 and t >= a):
            img = with_plate(i + 1, fn, t - a)
            if i > 0 and t - a < XF and (i != 1 or PLATES.get(2) is not None):
                prev = with_plate(i, SCENES[i - 1][2], t - SCENES[i - 1][0])
                img = Image.blend(prev, img, ease((t - a) / XF))
            return img.convert("RGB")


def main():
    out = os.path.join(HERE, "out", "preview.mp4" if PREVIEW else "video_4k.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    only = [float(x) for x in os.environ.get("STILLS", "").split(",") if x]
    if only:
        for t in only:
            frame(t).save(os.path.join(HERE, "out", f"still_{t:05.2f}.png"))
        return
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium" if PREVIEW else "slow",
           "-crf", "23" if PREVIEW else "14", "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(DUR * FPS)
    for i in range(n):
        p.stdin.write(frame(i / FPS).tobytes())
        if i % FPS == 0:
            print(f"{i / FPS:.0f}s", flush=True)
    p.stdin.close()
    p.wait()
    print(out)


if __name__ == "__main__":
    main()
