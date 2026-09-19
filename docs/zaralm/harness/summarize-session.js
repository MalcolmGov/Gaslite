// Summarize a decoded dsh session transcript: tools offered, prompt size, per-call usage and latency, the turn log.
const fs=require("fs");
const lines=fs.readFileSync(process.argv[2],"utf8").trim().split("\n").filter(Boolean).map(l=>JSON.parse(l));
const h=lines.find(e=>e.type==="request/header");
console.log("tools offered:", h ? h.data.header.tools.map(t=>t.name).join(", ") : "(none)");
const sys=lines.find(e=>e.type==="system/message");
const sysText=sys?sys.data.message.content.map(c=>c.text).join("\n"):"";
console.log("system prompt chars:", sysText.length);
let prev=null;
for (const e of lines) {
  if (e.type==="step/start") prev=e.time;
  if (e.type==="assistant/message") {
    if(!e.usage){const uc=(e.data.stream||[]).find(c=>c.chunk&&c.chunk.type==="usage"); if(uc) e.usage=uc.chunk.usage;}
    const lat=prev?((e.time-prev)/1000).toFixed(1)+"s":"?";
    const parts=(e.data.message.content||[]).map(c=>c.type==="tool-call"?`CALL ${c.name} ${c.arguments}`:`TEXT ${JSON.stringify(c.text??"")}`);
    console.log(`[step ${e.data.step}] ${lat}  in=${e.usage?.inputTokens??"?"} out=${e.usage?.outputTokens??"?"}  ${parts.join(" | ").slice(0,600)}`);
  }
  if (e.type==="tool/result") {
    const t=(e.data.message.content||[]).map(c=>(c.content||[]).map(x=>x.text??"").join("")).join("");
    console.log(`         RESULT${e.data.message.content?.[0]?.isError?"(error)":""}: ${JSON.stringify(t).slice(0,500)}`);
  }
}
const cb=lines.find(e=>e.type==="request/context"); if(cb) console.log("context window:",cb.data.contextWindow);
