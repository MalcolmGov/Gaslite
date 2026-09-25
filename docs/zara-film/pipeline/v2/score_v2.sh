#!/bin/bash
# Placeholder ambient bed sized to the v2 timeline. Reads TOTAL/DROP/SWELL/RISER/PULSE from score_params.env.
set -e; source ./score_params.env; R="-r 48000 -c 2 -b 16"; LEN=$(python3 -c "print(int($TOTAL)+2)")
sox -n $R padA.wav synth $LEN sine 55 sine 82.41 sine 110.2 sine 164.8 lowpass 420 tremolo 0.08 25 fade t 6 $LEN 6 norm -14
sox -n $R padB.wav synth $LEN sawtooth 110 sawtooth 110.7 sawtooth 220.4 lowpass 650 tremolo 0.12 30 fade t 3 $LEN 6 norm -24
sox -n $R shim.wav synth $LEN sine 440 sine 659.3 sine 880 tremolo 0.2 50 fade t 10 $LEN 8 norm -30
sox -n $R riser.wav synth 4.5 pinknoise lowpass 1400 fade t 4.2 4.5 0.3 norm -20; sox riser.wav riserP.wav pad $RISER
sox -n $R imp.wav synth 3 sine 44-28 fade 0 3 2.7 norm -4; sox -n $R nz.wav synth 1.6 brownnoise lowpass 600 fade 0 1.6 1.5 norm -16
sox -m imp.wav nz.wav impact.wav; sox impact.wav impactP.wav pad $DROP
sox -n $R swell.wav synth 40 sine 82.41 sine 123.5 sine 164.8 sine 246.9 lowpass 900 tremolo 0.1 20 fade t 2.5 40 8 norm -16; sox swell.wav swellP.wav pad $SWELL
sox -n $R pulse.wav synth 8 sine 220 tremolo 4 90 fade t 1 8 2 norm -24; sox pulse.wav pulseP.wav pad $PULSE
sox --norm=-3 -m padA.wav padB.wav shim.wav riserP.wav impactP.wav swellP.wav pulseP.wav bed_raw.wav
sox bed_raw.wav bed.wav reverb 40 50 100 trim 0 $TOTAL fade t 0 $TOTAL 3 norm -3
sox bed.wav -n stats 2>&1 | egrep "Pk lev|RMS lev|Length"
