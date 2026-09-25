"""Placeholder score: upbeat dance-pop, 144 BPM so every 5s scene cut lands on a downbeat
(3 bars per scene). D - A - Bm - G. Builds from a riser into four-on-the-floor, lifts at
each cut, big hit at 25s and a final stab that rings out under the end card. 48k stereo.
Usage: python3 music.py OUT_WAV
"""
import sys, wave
import numpy as np

SR = 48000
D = 30.0
N = int(SR * D)
BPM = 144
BEAT = 60 / BPM
BAR = 4 * BEAT
t = np.arange(N) / SR
rng = np.random.default_rng(7)
note = lambda m: 440 * 2 ** ((m - 69) / 12)

# one chord per bar: D, A, Bm, G (root midi, chord tones)
PROG = [(38, [62, 66, 69, 74]), (45, [61, 64, 69, 73]), (47, [62, 66, 71, 74]), (43, [62, 67, 71, 74])]


def chord_at(sec):
    return PROG[int(sec // BAR) % 4]


def saw(f, tt, harmonics):
    out = np.zeros_like(tt)
    for k in range(1, harmonics + 1):
        out += np.sin(2 * np.pi * f * k * tt) / k
    return out


def add(buf, start, sig):
    s = int(start * SR)
    if s >= N:
        return
    e = min(N, s + len(sig))
    buf[s:e] += sig[:e - s]


def env_ad(L, attack, decay):
    tt = np.arange(L) / SR
    return np.minimum(1, tt / max(attack, 1e-4)) * np.exp(-tt * decay)


def smooth_noise(L, k):
    x = rng.standard_normal(L + k)
    return np.convolve(x, np.ones(k) / k, "valid")[:L]


def ramp(a, b):
    return np.clip((t - a) / (b - a), 0, 1)


beats = np.arange(0, D, BEAT)
drums_on = (beats >= BAR) & (beats < 28.3)  # riser owns the first bar

# ---- sidechain pump (ducks pads/bass/stabs on every kick) ----
pump = np.ones(N)
for b in beats[drums_on]:
    s = int(b * SR)
    L = int(BEAT * SR)
    pump[s:s + L] = np.minimum(pump[s:s + L], 1 - 0.7 * np.exp(-np.arange(min(L, N - s)) / SR * 14))

# ---- kick ----
kick = np.zeros(N)
L = int(0.32 * SR)
tt = np.arange(L) / SR
kick_sig = np.sin(2 * np.pi * (48 * tt + 110 / 28 * (1 - np.exp(-tt * 28)))) * np.exp(-tt * 10)
kick_sig += 0.3 * np.exp(-tt * 300) * rng.standard_normal(L)
for b in beats[drums_on]:
    add(kick, b, kick_sig)

# ---- clap on 2 & 4 from scene 2 ----
clap = np.zeros(N)
L = int(0.18 * SR)
cl = rng.standard_normal(L) - smooth_noise(L, 12)
cl_env = sum(np.roll(env_ad(L, 0.0005, 40), int(d * SR)) for d in (0, 0.008, 0.017)) + env_ad(L, 0.001, 18)
for i, b in enumerate(beats):
    if i % 2 == 1 and 5 <= b < 28.3:
        add(clap, b, cl * cl_env)

# ---- hats: offbeat open from 10s, 16th closed from 15s ----
hat = np.zeros(N)
hp = lambda L: rng.standard_normal(L) - smooth_noise(L, 3)
for b in beats:
    if 10 <= b < 28.3:
        L = int(0.12 * SR)
        add(hat, b + BEAT / 2, hp(L) * env_ad(L, 0.001, 30) * 0.8)
    if 15 <= b < 28.3:
        for q in (0.25, 0.75):
            L = int(0.03 * SR)
            add(hat, b + BEAT * q, hp(L) * env_ad(L, 0.0005, 120) * 0.45)

# ---- offbeat bass ----
bass = np.zeros(N)
for b in beats:
    if BAR <= b < 28.3:
        root = chord_at(b)[0]
        L = int(BEAT * 0.45 * SR)
        tt = np.arange(L) / SR
        f = note(root)
        sig = saw(f, tt, 6) * 0.6 + np.sin(2 * np.pi * f / 2 * tt) * 0.8
        add(bass, b + BEAT / 2, sig * env_ad(L, 0.004, 7))

# ---- pad (supersaw-ish, pumped) ----
pad = np.zeros(N)
for bar in range(int(D / BAR) + 1):
    s0 = bar * BAR
    if s0 >= 28.3:
        break
    L = int(BAR * SR) + int(0.05 * SR)
    tt = np.arange(L) / SR
    sig = np.zeros(L)
    for m in chord_at(s0 + 0.01)[1]:
        for det in (-0.08, 0, 0.08):
            sig += saw(note(m) * (1 + det / 100 * 12), tt + rng.uniform(0, 1), 5)
    add(pad, s0, sig * np.minimum(1, tt / 0.02) * np.minimum(1, (L / SR - tt) / 0.03) / 12)

# ---- 16th pluck arp from scene 2 (energy rises through 25s) ----
arp = np.zeros(N)
for i, s16 in enumerate(np.arange(5, 25, BEAT / 4)):
    tones = chord_at(s16)[1]
    m = tones[[0, 1, 2, 3, 2, 1, 3, 2][i % 8]] + 12
    L = int(0.18 * SR)
    tt = np.arange(L) / SR
    arp_sig = saw(note(m), tt, 4) * env_ad(L, 0.001, 22)
    add(arp, s16, arp_sig * (0.6 + 0.4 * min(1, (s16 - 5) / 15)))

# ---- FX: opening riser, pre-cut risers, impacts on cuts ----
fx = np.zeros(N)
L = int(BAR * SR)
tt = np.arange(L) / SR
fx[:L] += smooth_noise(L, 6) * (tt / (L / SR)) ** 2 * 1.2
fx[:L] += np.sin(2 * np.pi * np.cumsum(200 + 1400 * (tt / tt[-1]) ** 2) / SR) * (tt / tt[-1]) ** 3 * 0.25
for cut in (5, 10, 15, 20, 25):
    L = int(BAR / 2 * SR)
    ramp_sig = smooth_noise(L, 4) * np.linspace(0, 1, L) ** 3 * 0.7
    add(fx, cut - L / SR, ramp_sig)
    L = int(1.2 * SR)
    add(fx, cut, rng.standard_normal(L) * env_ad(L, 0.001, 5) * 0.35)  # crash
    add(fx, cut, np.sin(2 * np.pi * 40 * np.arange(L) / SR) * env_ad(L, 0.002, 4) * 0.8)  # sub drop

# ---- final stab at the last full downbeat, ringing out under the end card ----
final = np.zeros(N)
stab_t = 17 * BAR  # 28.33s
L = N - int(stab_t * SR)
tt = np.arange(L) / SR
for m in [50, 62, 66, 69, 74, 78]:
    for det in (-0.1, 0, 0.1):
        final_sig = saw(note(m) * (1 + det / 100 * 12), tt, 5)
        add(final, stab_t, final_sig * env_ad(L, 0.004, 2.2) / 10)
add(final, stab_t, kick_sig * 1.2)

mix = (kick * 0.95 + clap * 0.35 + hat * 0.16 + bass * pump * 0.42 + pad * pump * 0.32
       + arp * 0.12 * pump + fx * 0.5 + final * 0.7)
mix *= np.minimum(1, t / 0.05) * np.clip((D - t) / 0.6, 0, 1)
mix = np.tanh(mix * 1.1)
mix /= np.abs(mix).max() / 0.7
wide = np.roll(pad * pump * 0.32 + arp * 0.12 * pump, int(0.011 * SR)) - (pad * pump * 0.32 + arp * 0.12 * pump)
st = np.stack([mix + wide * 0.25, mix - wide * 0.25], 1)
st /= np.abs(st).max() / 0.63  # leaves ~1 dB true-peak headroom
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
