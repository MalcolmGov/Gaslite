# Agent-library beat: a designed motion graphic of the real Zara agent library (113 agents / 15 industries),
# rendered frame-by-frame with Pillow and piped to ffmpeg. Usage: python3 library.py out.mp4 [frames_only_N]
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, sys, subprocess
W,H=1920,1080; FPS=24; DUR=11.0; N=int(DUR*FPS); RW,RH=2080,1170
def font(cands,size):
    for c in cands:
        for d in ["fonts","/usr/share/fonts/truetype/higgsfield"]:
            p=os.path.join(d,c)
            if os.path.exists(p): return ImageFont.truetype(p,size)
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",size)
EB=lambda s: font(["Montserrat-ExtraBold.ttf"],s)
MD=lambda s: font(["Montserrat-Medium.ttf","Montserrat-ExtraBold.ttf"],s)
BG=(6,11,20); PANEL=(13,19,34); PANEL2=(10,14,26); LINE=(27,36,64); INK=(238,242,251); MUTED=(154,163,189); FAINT=(107,115,146)
CY=(0,229,255); VI=(129,140,248); GREEN=(67,214,160); BLUE=(37,99,235)
def ease(t): t=max(0.0,min(1.0,t)); return 1-(1-t)**3
def spaced(d,xy,txt,f,fill,sp):
    x,y=xy
    for ch in txt: d.text((x,y),ch,font=f,fill=fill); x+=d.textlength(ch,font=f)+sp
def spaced_w(d,txt,f,sp): return sum(d.textlength(ch,font=f) for ch in txt)+sp*(len(txt)-1)
def wrap(d,txt,f,maxw):
    words=txt.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=f)<=maxw: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines
CATS=[("Support",8),("Bookings",5),("Health",5),("Hospitality",6),("Home",7),("Finance",22),("Insurance",7),("Retail",14),("Sales",3),("HR",7),("IT",11),("Operations",10),("Legal",9),("Education",3),("Office",1)]
CARDS=[("AI CFO","FINANCE","8 tools · 24 evals","Cashflow forecasting, accounts payable runway, bank reconciliation and board reporting.","R140,000 / mo"),
("Accounts Payable Agent","FINANCE","6 tools · 19 evals","Multi-page invoice extraction, 3-way PO matching, duplicate payment detection.","R35,000 / mo"),
("AR & Collections Agent","FINANCE","5 tools · 18 evals","Proactive invoice follow-ups, payment links and overdue ledger chasing.","R28,000 / mo"),
("Invoice Processing Agent","FINANCE","5 tools · 16 evals","Invoice OCR, tax calculation and GL coding in Xero or Sage.","R32,000 / mo"),
("Procurement Agent","OPERATIONS","7 tools · 22 evals","Supplier RFQs, vendor rate-card comparison, spend-limit approvals.","R40,000 / mo"),
("AI Sales Representative","SALES","6 tools · 25 evals","Inbound lead qualification, CRM enrichment and calendar booking.","R45,000 / mo"),
("Customer Service Manager","SUPPORT","6 tools · 28 evals","Ticket triage across channels, sentiment tagging, handoff to a person.","R38,000 / mo"),
("Chief of Staff","EXECUTIVE","9 tools · 30 evals","Executive briefings, action tracking across teams and meeting prep.","R50,000 / mo")]
def layer(w,h): return Image.new("RGBA",(w,h),(0,0,0,0))
def build_header():
    L=layer(RW,300); d=ImageDraw.Draw(L)
    spaced(d,(124,0),"AGENT LIBRARY  ·  ZARA AGENT PLATFORM",MD(20),CY,4)
    d.text((124,44),"113 pre-built agents. 15 industries. No code.",font=EB(60),fill=INK)
    d.text((124,132),"Add one, connect your knowledge, then go live.",font=MD(27),fill=MUTED)
    return L
def build_chips():
    out=[]; f=MD(21); fc=MD(18); x=124; y=0; rowh=46
    for name,n in CATS:
        tw=ImageDraw.Draw(layer(10,10)).textlength(name,font=f); cw=ImageDraw.Draw(layer(10,10)).textlength(str(n),font=fc)
        w=int(tw+cw+52)
        if x+w>RW-124: x=124; y+=rowh+10
        L=layer(w,rowh); d=ImageDraw.Draw(L)
        d.rounded_rectangle((0,0,w-1,rowh-1),radius=23,fill=PANEL,outline=LINE,width=1)
        d.text((18,11),name,font=f,fill=INK); d.text((18+tw+10,13),str(n),font=fc,fill=FAINT)
        out.append((L,x,y)); x+=w+12
    return out
def build_card(c):
    title,cat,meta,desc,save=c; w,h=440,250
    L=layer(w,h); d=ImageDraw.Draw(L)
    d.rounded_rectangle((0,0,w-1,h-1),radius=16,fill=PANEL,outline=LINE,width=1)
    d.rounded_rectangle((20,20,58,58),radius=9,fill=PANEL2,outline=LINE,width=1)
    d.rounded_rectangle((30,30,48,48),radius=4,outline=CY,width=2)
    d.text((72,18),title,font=EB(24),fill=INK)
    fpill=MD(12); pw=int(d.textlength(cat,font=fpill))+18
    d.rounded_rectangle((72,50,72+pw,70),radius=5,fill=(20,26,48),outline=(48,56,96),width=1); d.text((81,53),cat,font=fpill,fill=VI)
    d.text((72+pw+10,50),meta,font=MD(15),fill=MUTED)
    fd=MD(16); y=86
    for ln in wrap(d,desc,fd,w-40)[:2]: d.text((20,y),ln,font=fd,fill=(200,206,226)); y+=22
    d.rounded_rectangle((20,140,w-20,184),radius=8,fill=PANEL2,outline=LINE,width=1)
    spaced(d,(34,154),"ESTIMATED SAVING",MD(12),FAINT,2)
    fs=EB(22); d.text((w-20-14-d.textlength(save,font=fs),150),save,font=fs,fill=GREEN)
    d.rounded_rectangle((20,200,110,232),radius=8,fill=(20,26,48),outline=LINE,width=1); d.text((37,208),"Details",font=MD(15),fill=INK)
    d.rounded_rectangle((w-20-120,200,w-20,232),radius=8,fill=BLUE); d.text((w-20-120+18,208),"Add agent",font=MD(15),fill=INK)
    return L
def build_live():
    L=layer(440,250); d=ImageDraw.Draw(L)
    d.rounded_rectangle((0,0,439,249),radius=16,outline=CY,width=2)
    d.rounded_rectangle((440-20-212,200,440-20,232),radius=8,fill=(8,40,44),outline=GREEN,width=1)
    d.ellipse((440-20-212+14,210,440-20-212+26,222),fill=GREEN); d.text((440-20-212+34,208),"Live · Xero connected",font=MD(15),fill=GREEN)
    return L
def bg_plate():
    P=Image.new("RGBA",(RW,RH),BG+(255,))
    g=layer(RW,RH); gd=ImageDraw.Draw(g)
    gd.ellipse((RW-900,-500,RW+300,500),fill=CY+(28,)); gd.ellipse((-400,RH-600,700,RH+400),fill=VI+(22,))
    g=g.filter(ImageFilter.GaussianBlur(120)); P.alpha_composite(g)
    return P
def paste(dst,src,x,y,alpha):
    if alpha<=0: return
    if alpha<1: src=src.copy(); src.putalpha(src.getchannel("A").point(lambda v:int(v*alpha)))
    dst.alpha_composite(src,(int(x),int(y)))
def main(out,limit=None):
    plate=bg_plate(); header=build_header(); chips=build_chips(); cards=[build_card(c) for c in CARDS]; live=build_live()
    cols=4; cw,ch,gap=440,250,24; gx=(RW-(cols*cw+(cols-1)*gap))//2; gy=470
    if limit is None:
        p=subprocess.Popen(["ffmpeg","-y","-hide_banner","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","libx264","-preset","slow","-crf","15","-pix_fmt","yuv420p",out],stdin=subprocess.PIPE)
    for i in range(N if limit is None else limit):
        t=i/FPS if limit is None else [0.4,3.5,10.5][i%3]
        F=plate.copy()
        paste(F,header,0,96,ease((t-0.15)/0.6))
        for k,(L,x,y) in enumerate(chips): a=ease((t-0.8-k*0.05)/0.45); paste(F,L,x,330+y+18*(1-a),a)
        for k,L in enumerate(cards):
            a=ease((t-1.6-k*0.32)/0.6); r,cc=divmod(k,cols)
            paste(F,L,gx+cc*(cw+gap),gy+r*(ch+gap)+36*(1-a),a)
        paste(F,live,gx,gy,ease((t-7.2)/0.5))
        z=1-0.075*ease(t/DUR); bw,bh=int(RW*z),int(RH*z); bx,by=(RW-bw)//2,(RH-bh)//2
        fr=F.crop((bx,by,bx+bw,by+bh)).resize((W,H),Image.LANCZOS).convert("RGB")
        if limit is None: p.stdin.write(fr.tobytes())
        else: fr.save(f"lib_test_{i}.jpg",quality=90)
    if limit is None: p.stdin.close(); p.wait(); print("rendered",out)
if __name__=="__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv)>2 else None)
