from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, glob
W,H=1920,1080
def pick(cands,size):
    for c in cands:
        for d in ["fonts","/usr/share/fonts/truetype/higgsfield","/usr/share/fonts/truetype/liberation","/usr/share/fonts/truetype/dejavu"]:
            p=os.path.join(d,c)
            if os.path.exists(p): return ImageFont.truetype(p,size)
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",size)
F_WM=pick(["Montserrat-ExtraBold.ttf","Metropolis-ExtraBold.ttf"],300)
F_TAG=pick(["Montserrat-Medium.ttf","Montserrat-SemiBold.ttf","Montserrat-Regular.ttf","Montserrat-ExtraBold.ttf"],52)
F_URL=pick(["Montserrat-Medium.ttf","Montserrat-Regular.ttf","Montserrat-ExtraBold.ttf"],30)
BG=(6,11,20); WH=(238,242,251); CY=(0,229,255); VI=(129,140,248); MU=(154,163,189)
def lerp(a,b,t): return tuple(int(round(a[i]+(b[i]-a[i])*t)) for i in range(3))
def grad3(w,h):
    g=Image.new("RGB",(w,h)); px=g.load()
    for x in range(w):
        t=x/max(1,w-1); c=lerp(WH,CY,t/0.55) if t<0.55 else lerp(CY,VI,(t-0.55)/0.45)
        for y in range(h): px[x,y]=c
    return g
A=Image.new("RGBA",(W,H),(0,0,0,0))
mask=Image.new("L",(W,H),0); md=ImageDraw.Draw(mask)
txt="Zara"; bb=md.textbbox((0,0),txt,font=F_WM); tw,th=bb[2]-bb[0],bb[3]-bb[1]
x0=(W-tw)//2-bb[0]; y0=380-bb[1]
md.text((x0,y0),txt,font=F_WM,fill=255)
glow=mask.filter(ImageFilter.GaussianBlur(46))
g_rgba=Image.new("RGBA",(W,H),CY+(0,)); g_rgba.putalpha(glow.point(lambda v:int(v*0.55))); A.alpha_composite(g_rgba)
g=grad3(tw,th).convert("RGBA"); gf=Image.new("RGBA",(W,H),(0,0,0,0)); gf.paste(g,(x0+bb[0],y0+bb[1])); gf.putalpha(mask); A.alpha_composite(gf)
A.save("card_A.png")
Bm=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(Bm)
tag="Describe the problem. We’ll run the business."
tb=d.textbbox((0,0),tag,font=F_TAG); d.text(((W-(tb[2]-tb[0]))//2-tb[0],700-tb[1]),tag,font=F_TAG,fill=WH+(255,))
Bm.paste(grad3(220,2).convert("RGBA"),((W-220)//2,790))
url="zaraai.digital"; sp=7; cw=[d.textlength(ch,font=F_URL) for ch in url]; x=(W-(sum(cw)+sp*(len(url)-1)))/2
for ch,w in zip(url,cw): d.text((x,830),ch,font=F_URL,fill=MU+(255,)); x+=w+sp
Bm.save("card_B.png")
P=Image.new("RGBA",(W,H),BG+(255,)); P.alpha_composite(A); P.alpha_composite(Bm); P.convert("RGB").save("endcard_preview.jpg",quality=90)
print("endcard fonts:",F_WM.path,"|",F_TAG.path)
