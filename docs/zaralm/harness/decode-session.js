// Decode a dsh session.v3.jsonl.zstd (many independent zstd frames appended) into a readable transcript.
const fs=require("fs"),zlib=require("zlib"),path=require("path");
const [,, root, out] = process.argv;
const files = fs.readdirSync(root,{recursive:true}).map(p=>path.join(root,p)).filter(p=>p.endsWith(".jsonl.zstd"));
let all="";
for (const f of files) {
  const buf=fs.readFileSync(f); let off=0;
  while (off < buf.length) {
    let next = buf.indexOf(Buffer.from([0x28,0xb5,0x2f,0xfd]), off+4);
    if (next<0) next=buf.length;
    try { all += zlib.zstdDecompressSync(buf.subarray(off,next)).toString("utf8"); } catch(e){ console.error("frame fail @",off,e.message); }
    off=next;
  }
}
fs.writeFileSync(out, all);
const lines=all.trim().split("\n").filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return {type:"raw",l}}});
console.log("events:",lines.length);
const kinds={};for(const e of lines){kinds[e.type]=(kinds[e.type]||0)+1;}console.log(kinds);
for(const e of lines){
  const s=JSON.stringify(e);
  if(/tool|message|assistant|user|system|persona|model|request/i.test(e.type||"")) console.log("---",e.type,"\n",s.slice(0,1400));
}
