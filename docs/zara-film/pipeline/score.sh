#!/bin/bash
# Synthesized ambient tech bed (placeholder score) — 60s, 48k stereo. Drop lands on the Boardroom cut (~22.5s).
set -e
R="-r 48000 -c 2 -b 16"
sox -n $R padA.wav synth 60 sine 55 sine 82.41 sine 110.2 sine 164.8 lowpass 420 tremolo 0.08 25 fade t 6 60 6 norm -14
sox -n $R padB.wav synth 60 sawtooth 110 sawtooth 110.7 sawtooth 220.4 lowpass 650 tremolo 0.12 30 fade t 3 60 6 norm -24
sox -n $R shim.wav synth 60 sine 440 sine 659.3 sine 880 tremolo 0.2 50 fade t 10 60 8 norm -30
sox -n $R riser.wav synth 4.5 pinknoise lowpass 1400 fade t 4.2 4.5 0.3 norm -20
sox riser.wav riser18.wav pad 18
sox -n $R imp.wav synth 3 sine 44-28 fade 0 3 2.7 norm -4
sox -n $R nz.wav synth 1.6 brownnoise lowpass 600 fade 0 1.6 1.5 norm -16
sox -m imp.wav nz.wav impact.wav
sox impact.wav impact22.wav pad 22.45
sox -n $R swell.wav synth 30 sine 82.41 sine 123.5 sine 164.8 sine 246.9 lowpass 900 tremolo 0.1 20 fade t 2.5 30 8 norm -16
sox swell.wav swell22.wav pad 22.6
sox -n $R pulse.wav synth 7 sine 220 tremolo 4 90 fade t 1 7 2 norm -24
sox pulse.wav pulse40.wav pad 40
sox --norm=-3 -m padA.wav padB.wav shim.wav riser18.wav impact22.wav swell22.wav pulse40.wav bed_raw.wav
sox bed_raw.wav bed.wav reverb 40 50 100 trim 0 60 fade t 0 60 3 norm -3
sox bed.wav -n stats 2>&1 | egrep "Pk lev|RMS lev|Length"
