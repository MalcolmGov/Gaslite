"""Time the Helena VO to the scene table and mix it over the music. 48k stereo out.

Usage: python3 mix.py VO_FILE MUSIC_WAV OUT_WAV

VO_FILE is one continuous take of the six README lines (any format ffmpeg reads).
The take is split at its five longest pauses, and each line is placed at its scene
start + LEAD. A line longer than its slot is sped up by at most MAX_TEMPO; anything
beyond that fails loudly rather than overlapping the next scene. Music is ducked
under speech, then the mix is loudness-normalised to -14 LUFS / -1 dBTP.
"""
import os, subprocess, sys
import numpy as np
import imageio_ffmpeg

SR = 48000
DUR = 30.0
SCENE_STARTS = [0, 5, 10, 15, 20, 25]
LEAD = [0.6, 0.35, 0.35, 0.35, 0.35, 0.6]  # s6 names the brand as the lockup fades in
SLOT_END = [4.8, 9.8, 14.8, 19.8, 24.8, 29.7]  # leave air before each cut / the fade
MAX_TEMPO = 1.08
DUCK_DB = -9.0
FF = imageio_ffmpeg.get_ffmpeg_exe()


def decode(path, mono):
    ch = "1" if mono else "2"
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-f", "f32le", "-ac", ch, "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32)
    return a if mono else a.reshape(-1, 2)


def tempo(x, factor):
    if abs(factor - 1) < 1e-3:
        return x
    p = subprocess.run([FF, "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", f"atempo={factor:.4f}", "-f", "f32le", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32)


def split_lines(vo, n=6):
    """Return n (start, end) sample ranges, cutting at the n-1 longest pauses."""
    hop = int(0.01 * SR)
    frames = len(vo) // hop
    rms = np.sqrt(np.mean(vo[:frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    voiced = db > db.max() - 40
    idx = np.flatnonzero(voiced)
    first, last = idx[0], idx[-1]
    gaps, i = [], first
    while i <= last:
        if not voiced[i]:
            j = i
            while j <= last and not voiced[j]:
                j += 1
            gaps.append((j - i, i, j))
            i = j
        else:
            i += 1
    if len(gaps) < n - 1:
        sys.exit(f"VO has only {len(gaps) + 1} phrases; expected {n}. Check the take.")
    cuts = sorted(sorted(gaps, reverse=True)[:n - 1], key=lambda g: g[1])
    bounds, s = [], first
    for _, g0, g1 in cuts:
        bounds.append((s, g0))
        s = g1
    bounds.append((s, last + 1))
    pad = int(0.04 * SR)  # keep breath tails / consonant onsets
    return [(max(0, a * hop - pad), min(len(vo), b * hop + pad)) for a, b in bounds]


def envelope(x, attack, release):
    out = np.empty_like(x)
    acc = 0.0
    ka, kr = np.exp(-1 / (attack * SR / 64)), np.exp(-1 / (release * SR / 64))
    blocks = np.abs(x[:len(x) // 64 * 64]).reshape(-1, 64).max(1)
    env = np.empty_like(blocks)
    for i, v in enumerate(blocks):
        k = ka if v > acc else kr
        acc = k * acc + (1 - k) * v
        env[i] = acc
    out[:] = np.interp(np.arange(len(x)), np.arange(len(env)) * 64, env)
    return out


def main(vo_path, music_path, out_path):
    vo = decode(vo_path, mono=True)
    music = decode(music_path, mono=False)
    n = int(DUR * SR)
    music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]

    track = np.zeros(n, np.float32)
    report = []
    for k, (a, b) in enumerate(split_lines(vo)):
        line = vo[a:b]
        start = SCENE_STARTS[k] + LEAD[k]
        room = SLOT_END[k] - start
        need = len(line) / SR
        f = max(1.0, need / room)
        if f > MAX_TEMPO:
            sys.exit(f"Line {k + 1} is {need:.2f}s; slot allows {room:.2f}s (needs x{f:.2f} > x{MAX_TEMPO}). "
                     "Re-take that line a little faster.")
        line = tempo(line, f)
        s = int(start * SR)
        track[s:s + len(line)] += line[:n - s]
        report.append(f"  line {k + 1}: {start:5.2f}-{start + len(line) / SR:5.2f}s"
                      f" (slot ends {SLOT_END[k]:.1f}s{', tempo x%.3f' % f if f > 1 else ''})")
    print("VO placement:\n" + "\n".join(report))

    # duck music under speech
    env = envelope(track, attack=0.08, release=0.45)
    env /= max(env.max(), 1e-9)
    gain = 10 ** (DUCK_DB * np.clip(env * 4, 0, 1) / 20)
    mix = music * gain[:, None] + np.stack([track, track], 1) * 0.9

    tmp = out_path + ".pre.f32"
    mix.astype(np.float32).tofile(tmp)
    try:
        subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", tmp,
                        "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", str(SR), "-c:a", "pcm_s24le",
                        "-t", str(DUR), out_path], check=True)
    finally:
        os.remove(tmp)
    track_path = os.path.join(os.path.dirname(out_path), "vo_timed.wav")
    subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "pcm_s24le", track_path], input=track.tobytes(), check=True)
    print(out_path)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
