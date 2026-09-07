# Builds the ffmpeg filter graph from measured clip durations. Timeline: 7 shots, 3 dissolves + 3 hard cuts, fade to end card, 60.0s total.
import subprocess, json
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode().strip())
clips=[f"s{i}.mp4" for i in range(1,8)]
L=[dur(c) for c in clips]
trans=[0,0.5,0,0.5,0,0.5]   # 0 = hard cut (concat), >0 = dissolve (xfade)     # 1>2 cut, 2>3 dissolve, 3>4 cut, 4>5 dissolve, 5>6 cut, 6>7 dissolve
TOTAL=60.0; TAILFADE=0.6
starts=[0.0]; cum=L[0]; offs=[]
for i,t in enumerate(trans):
    o=cum-t; offs.append(o); starts.append(o); cum=cum+L[i+1]-t
o7=cum-TAILFADE; tail=TOTAL-o7
VO=[("vo1.mp3",1.0),("vo2a.mp3",7.5),("vo2b.mp3",10.9),("vo3.mp3",15.2),("vo4.mp3",22.1),("vo5.mp3",32.0),("vo6.mp3",40.6),("vo7.mp3",47.4),("vo8.mp3",53.8)]
TA,TB=53.0,54.0
f=[]
for i in range(7): f.append(f"[{i}:v]fps=24,scale=1920:1080,setsar=1,format=yuv420p,settb=1/24[v{i}]")
prev="v0"
for i,t in enumerate(trans):
    if t==0: f.append(f"[{prev}][v{i+1}]concat=n=2:v=1:a=0,settb=1/24[x{i+1}]")
    else:    f.append(f"[{prev}][v{i+1}]xfade=transition=fade:duration={t}:offset={offs[i]:.3f}[x{i+1}]")
    prev=f"x{i+1}"
f.append("[9:v]format=yuv420p,settb=1/24[vc]")
f.append(f"[{prev}][vc]xfade=transition=fade:duration={TAILFADE}:offset={o7:.3f}[x7]")
f.append(f"[7:v]format=rgba,fade=t=in:st={TA}:d=0.9:alpha=1[ca]")
f.append(f"[8:v]format=rgba,fade=t=in:st={TB}:d=0.8:alpha=1[cb]")
f.append("[x7][ca]overlay=0:0[y1]"); f.append("[y1][cb]overlay=0:0[y2]")
f.append("[y2]fade=t=out:st=59.2:d=0.8,format=yuv420p[vout]")
names=[]
for k,(_,at) in enumerate(VO):
    ms=int(round(at*1000)); f.append(f"[{10+k}:a]loudnorm=I=-16:TP=-1.5:LRA=7,aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms}[a{k}]"); names.append(f"[a{k}]")
f.append("".join(names)+f"amix=inputs={len(VO)}:normalize=0,asplit=2[vo_sc][vo_mix]")
f.append("[19:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.28,afade=t=out:st=58.3:d=1.7[bed0]")
f.append("[bed0][vo_sc]sidechaincompress=threshold=0.02:ratio=6:attack=25:release=700:makeup=1[bed]")
f.append("[vo_mix][bed]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=false[aout]")
open("fc.txt","w").write(";\n".join(f)+"\n")
json.dump({"clip_durations":L,"shot_starts":starts,"xfade_offsets":offs,"endcard_offset":o7,"tail":tail,"vo":VO},open("timeline.json","w"),indent=1)
print("durations",[round(x,3) for x in L]); print("shot starts",[round(x,2) for x in starts]); print("endcard at",round(o7,2),"tail",round(tail,3))
open("tail.txt","w").write(f"{tail:.3f}")
