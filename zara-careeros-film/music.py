"""Placeholder score: soft opening pulse, lift through product scenes, clean resolve. 48k stereo."""
import numpy as np, wave, sys
SR=48000; D=30.0; n=int(SR*D); t=np.arange(n)/SR
BPM=96; beat=60/BPM
def env(x,a,b): return np.clip((x-a)/(b-a),0,1)
def lp(x,alpha):
    y=np.empty_like(x); acc=0.0
    for i in range(0,len(x)): acc+=alpha*(x[i]-acc); y[i]=acc
    return y
rng=np.random.default_rng(3)
def pad(freqs,start,end,level):
    out=np.zeros(n); s,e=int(start*SR),int(end*SR); tt=t[s:e]-start
    for f in freqs:
        for det in (-0.12,0.0,0.12):
            ph=rng.uniform(0,6.28)
            out[s:e]+=np.sin(2*np.pi*f*(1+det/100)*tt+ph)+0.3*np.sin(2*np.pi*2*f*(1+det/100)*tt+ph)
    a=np.minimum(1,tt/0.9)*np.minimum(1,(end-start-tt)/0.9)
    out[s:e]*=a*level/len(freqs)
    return out
N=lambda m:440*2**((m-69)/12)
chords=[(0,5,[50,57,62,64,69]),(5,10,[47,54,62,64,66]),(10,15,[43,50,59,62,66]),(15,20,[45,52,57,61,64]),
        (20,25,[47,54,62,64,69]),(25,30.0,[50,57,62,66,69,74])]
mix=np.zeros(n)
for a,b,notes in chords: mix+=pad([N(m) for m in notes],max(0,a-0.4),min(D,b+0.4),0.22)
# pulse: soft sub thump on each beat
kick=np.zeros(n)
for k in np.arange(0,25.5,beat):
    s=int(k*SR); L=int(0.35*SR); tt=np.arange(L)/SR
    kick[s:s+L][:max(0,min(L,n-s))]+=(np.sin(2*np.pi*(45+60*np.exp(-tt*30))*tt)*np.exp(-tt*9))[:max(0,min(L,n-s))]
mix+=kick*0.33
# arp pluck 5s-25s, 8ths, rising filter = lift
arp=np.zeros(n); seq=[74,76,78,81,78,76]
for i,k in enumerate(np.arange(5,25,beat/2)):
    s=int(k*SR); L=int(0.4*SR); tt=np.arange(L)/SR; f=N(seq[i%len(seq)])
    arp[s:s+L]+=np.sin(2*np.pi*f*tt)*np.exp(-tt*10)*(0.5+0.5*env(k,5,20))
mix+=arp*0.10
# hat ticks 10-25
noise=rng.standard_normal(n); hp=noise-lp(noise,0.3)
hat=np.zeros(n)
for k in np.arange(10+beat/2,25,beat):
    s=int(k*SR); L=int(0.05*SR); hat[s:s+L]+=hp[s:s+L]*np.exp(-np.arange(L)/SR*80)
mix+=hat*0.05
# transition swells before each cut (subtle)
for c in (5,10,15,20,25):
    s=int((c-0.6)*SR); L=int(0.6*SR); w=lp(rng.standard_normal(L),0.05); mix[s:s+L]+=w*np.linspace(0,1,L)**2*0.35
# resolve: final chord bloom + fade last 1.2s
mix*=np.clip((D-t)/1.2,0,1)
mix*=np.minimum(1,t/0.4)
mix=np.tanh(mix*1.2); mix/=np.abs(mix).max()/0.5
st=np.stack([mix, np.roll(mix,int(0.012*SR))],1)
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes())
