from PIL import Image, ImageDraw, ImageFont
import os
W,H=1920,1080
def font(c,s):
    for d in ["fonts","/usr/share/fonts/truetype/higgsfield"]:
        p=os.path.join(d,c)
        if os.path.exists(p): return ImageFont.truetype(p,s)
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",s)
INK=(238,242,251); CY=(0,229,255); BG=(6,11,20)
TITLES={"t1":["PLUG-AND-PLAY AGENTS   ·   NO CODE"],"t2":["SECURE   ·   COMPLIANT"],
        "t3":["OVERNIGHT:  14 RECEIPTS PROCESSED   ·   SUPPLIER ANOMALY FLAGGED","OVERDUE CLIENT CHASED   ·   EVERY STEP TRACKED"],
        "t4":["LIVE ON FIVE CONTINENTS"]}
def sw(d,t,f,sp): return sum(d.textlength(ch,font=f) for ch in t)+sp*(len(t)-1)
def spaced(d,xy,t,f,fill,sp):
    x,y=xy
    for ch in t: d.text((x,y),ch,font=f,fill=fill); x+=d.textlength(ch,font=f)+sp
for k,lines in TITLES.items():
    L=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(L)
    f=font("Montserrat-Medium.ttf",30 if len(lines)==1 else 25); sp=4; lh=f.size+14
    w=max(sw(d,t,f,sp) for t in lines); h=lh*len(lines)
    x0,y0=120,H-124-h
    d.rounded_rectangle((x0-24,y0-16,x0+w+28,y0+h+8),radius=10,fill=BG+(175,))
    d.rectangle((x0-24,y0-16,x0-20,y0+h+8),fill=CY+(255,))
    for i,t in enumerate(lines): spaced(d,(x0,y0+i*lh),t,f,INK+(255,),sp)
    L.save(f"{k}.png")
print("titles ok")
