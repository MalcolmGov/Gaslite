import subprocess, json
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode().strip())
# beat order: cold open, the ask, agent synthesis, agent library, boardroom, connectors, execution, globe, resolve
CL=[("s1.mp4",1.207),("s2.mp4",1.0),("s3.mp4",1.0),("s9.mp4",1.0),("s4.mp4",1.0),("s5.mp4",1.0),("s6.mp4",1.136),("s8.mp4",1.0),("s7.mp4",1.0)]
TR=[0,0.5,0,0,0.5,0,0.5,0.5]
L=[dur(f)*k for f,k in CL]
TAILFADE=0.6; ENDCARD=8.4
starts=[0.0]; cum=L[0]; offs=[]
for i,t in enumerate(TR):
    o=cum-t; offs.append(o); starts.append(o); cum=cum+L[i+1]-t
o_end=cum-TAILFADE; TOTAL=round(o_end+ENDCARD,3); tail=TOTAL-o_end; S=starts
VO=[("vo1.mp3",0.6),("vo2a.mp3",S[1]+0.4),("vo2b.mp3",S[1]+4.0),("vo3.mp3",S[2]+0.6),("vo9.mp3",S[3]+0.4),("vo4.mp3",S[4]-0.5),("vo5.mp3",S[5]+2.0),("vo6.mp3",S[6]+0.3),("vo8.mp3",S[7]+0.9),("vo7.mp3",S[8]+0.6),("vo10.mp3",o_end+1.5)]
TITLES=[("t1.png",S[2]+3.6,3.6),("t2.png",S[5]+6.9,3.0),("t3.png",S[6]+1.9,5.2),("t4.png",S[7]+2.6,4.2)]
CARDS=[("card_A.png",o_end+0.9,0.9),("card_B.png",o_end+1.9,0.8),("card_C.png",o_end+3.2,0.8)]
NC=len(CL); I_COLOR=NC; I_T=NC+1; I_CARD=I_T+len(TITLES); I_VO=I_CARD+len(CARDS); I_BED=I_VO+len(VO)
f=[]
for i,(fn,k) in enumerate(CL):
    pre=f"setpts={k}*PTS,minterpolate=fps=24:mi_mode=blend," if k!=1.0 else "fps=24,"
    f.append(f"[{i}:v]{pre}scale=1920:1080,setsar=1,format=yuv420p,settb=1/24[v{i}]")
prev="v0"
for i,t in enumerate(TR):
    if t==0: f.append(f"[{prev}][v{i+1}]concat=n=2:v=1:a=0,settb=1/24[x{i+1}]")
    else: f.append(f"[{prev}][v{i+1}]xfade=transition=fade:duration={t}:offset={offs[i]:.3f}[x{i+1}]")
    prev=f"x{i+1}"
f.append(f"[{I_COLOR}:v]format=yuv420p,settb=1/24[vc]")
f.append(f"[{prev}][vc]xfade=transition=fade:duration={TAILFADE}:offset={o_end:.3f}[base]")
cur="base"
for j,(fn,at,d) in enumerate(TITLES):
    f.append(f"[{I_T+j}:v]format=rgba,fade=t=in:st={at:.3f}:d=0.5:alpha=1,fade=t=out:st={at+d-0.5:.3f}:d=0.5:alpha=1[tt{j}]"); f.append(f"[{cur}][tt{j}]overlay=0:0[o{j}]"); cur=f"o{j}"
for j,(fn,at,d) in enumerate(CARDS):
    f.append(f"[{I_CARD+j}:v]format=rgba,fade=t=in:st={at:.3f}:d={d}:alpha=1[cc{j}]"); f.append(f"[{cur}][cc{j}]overlay=0:0[p{j}]"); cur=f"p{j}"
f.append(f"[{cur}]fade=t=out:st={TOTAL-0.8:.3f}:d=0.8,format=yuv420p[vout]")
names=[]
for k,(fn,at) in enumerate(VO):
    ms=int(round(at*1000)); f.append(f"[{I_VO+k}:a]loudnorm=I=-16:TP=-1.5:LRA=7,aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms}[a{k}]"); names.append(f"[a{k}]")
f.append("".join(names)+f"amix=inputs={len(VO)}:normalize=0,asplit=2[vo_sc][vo_mix]")
f.append(f"[{I_BED}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.28,afade=t=out:st={TOTAL-2.0:.3f}:d=2.0[bed0]")
f.append("[bed0][vo_sc]sidechaincompress=threshold=0.02:ratio=6:attack=25:release=700:makeup=1[bed]")
f.append("[vo_mix][bed]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=false[aout]")
open("fc.txt","w").write(";\n".join(f)+"\n")
inputs=" ".join(f"-i {fn}" for fn,_ in CL)+f' -f lavfi -i "color=c=0x060B14:s=1920x1080:r=24:d={tail:.3f}"'+"".join(f" -loop 1 -framerate 24 -t {TOTAL} -i {fn}" for fn,_,_ in TITLES)+"".join(f" -loop 1 -framerate 24 -t {TOTAL} -i {fn}" for fn,_,_ in CARDS)+"".join(f" -i {fn}" for fn,_ in VO)+" -i bed.wav"
open("inputs.txt","w").write(inputs); open("total.txt","w").write(f"{TOTAL:.3f}")
open("score_params.env","w").write(f"TOTAL={TOTAL:.2f}\nDROP={S[4]-0.15:.2f}\nSWELL={S[4]+0.05:.2f}\nRISER={S[4]-4.6:.2f}\nPULSE={S[6]:.2f}\n")
json.dump({"clip_lengths":L,"beat_starts":S,"endcard_at":o_end,"total":TOTAL,"vo":VO,"titles":TITLES},open("timeline_v2.json","w"),indent=1)
print("lengths",[round(x,2) for x in L]); print("beat starts",[round(x,2) for x in S]); print("endcard",round(o_end,2),"TOTAL",TOTAL)
