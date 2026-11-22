/* DE-MAX A1: postavlja oznaku desno i, po potrebi, ton za tačan/netačan odgovor. */
(function(){
"use strict";
const source=document.currentScript;
const enableAnswerTones=source?.dataset?.feedbackSound!=="off";
function placeBrand(){
 const header=document.querySelector("header,.header,.topbar,.top");
 if(!header)return;
 if(header.querySelector(".right-heading"))return; // već je desno
 header.classList.add("demax-a1-brand-host");
 const existing=[...header.querySelectorAll(".brand,.logo,.brand-name,.brandName,.logo-text")]
   .find(x=>/DE[\s\u2010-\u2015-]?MAX/i.test(x.textContent||""));
 if(existing){existing.classList.add("demax-a1-brand-original");return;}
 if(/DE[\s\u2010-\u2015-]?MAX/i.test(header.textContent||"")){
   const label=header.querySelector("b,strong,h1,.title");
   if(label&&/DE[\s\u2010-\u2015-]?MAX/i.test(label.textContent||"")){label.classList.add("demax-a1-brand-original");return;}
 }
 const badge=document.createElement("span");
 badge.className="demax-a1-brand-added";
 badge.textContent="DE-MAX";
 badge.setAttribute("aria-label","DE-MAX Tutin");
 header.appendChild(badge);
}
placeBrand();
if(!enableAnswerTones)return;
const Ctx=window.AudioContext||window.webkitAudioContext;
if(!Ctx)return;
let ctx=null;
function unlockAudio(){
 try{if(!ctx)ctx=new Ctx();if(ctx.state==="suspended")void ctx.resume().catch(()=>{});}catch(e){}
}
function playTone(correct){
 try{
  if(!ctx)return;
  const start=ctx.currentTime+.012;
  const notes=correct?[[523.25,0,.11],[659.25,.12,.11],[783.99,.24,.17]]:[[294,0,.15],[220,.17,.19]];
  for(const [freq,delay,duration] of notes){
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=correct?"sine":"triangle";
   osc.frequency.setValueAtTime(freq,start+delay);
   gain.gain.setValueAtTime(.001,start+delay);
   gain.gain.exponentialRampToValueAtTime(correct?.085:.07,start+delay+.014);
   gain.gain.exponentialRampToValueAtTime(.001,start+delay+duration);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(start+delay);osc.stop(start+delay+duration+.01);
  }
 }catch(e){}
}
const selector=".feedback,[id*='feedback'],[id^='fb-'],[id^='fb'],.result-message,.result-msg,.answer-feedback,.check-result,.message,.notice,.toast";
const feedbackNodes=()=>[...document.querySelectorAll(selector)].filter(n=>!n.closest(".stat,.stats,.scorebox,.progress,.score"));
const status=(node)=>{
 const value=(node.textContent||"").trim().slice(0,280);
 if(!value)return null;
 const cls=typeof node.className==="string"?node.className.toLowerCase():"";
 if(/\b(?:bad|wrong|incorrect|error|no)\b/.test(cls)||/(?:nije\s+ta[čc]no|neta[čc]n|pogre[sš]n|falsch|incorrect|wrong|✗|❌|gre[sš]k|poku[sš]aj\s+ponovo|ta[čc]an\s+odgovor|ta[čc]no\s+re[sš]enje)/i.test(value))return false;
 if(/\b(?:ok|good|correct|success)\b/.test(cls)||/(?:\bta[čc]no\b|\brichtig\b|\bcorrect\b|\bbravo\b|odli[čc]no|✓|✔|✅)/i.test(value))return true;
 return null;
};
let pending=null;
function stopPending(){
 if(pending?.observer)pending.observer.disconnect();
 if(pending?.timer)clearTimeout(pending.timer);
 pending=null;
}
function checkPending(){
 if(!pending)return;
 for(const n of feedbackNodes()){
  const current=((n.textContent||"").trim())+"|"+(typeof n.className==="string"?n.className:"");
  if(!current.trim()||current===pending.before.get(n))continue;
  const answer=status(n);
  if(answer!==null){playTone(answer);stopPending();return;}
 }
}
document.addEventListener("click",(ev)=>{
 const target=ev.target.closest?.("button,[role='button'],input[type='submit'],.option,.opt,.choice,.answer,.answerBtn,.word,.token,.tile");
 if(!target||target.disabled)return;
 const txt=(target.textContent||"").trim().slice(0,60);
 if(/^(?:nazad|slede[cć]|ponovo|reset|resetuj|novo\b|start|po[čc]ni|prika[zž]i|re[sš]enje|🔊|slu[sš]aj|listen|lautst|muzika)/i.test(txt))return;
 unlockAudio();
 stopPending();
 const before=new WeakMap();
 for(const n of feedbackNodes())before.set(n,((n.textContent||"").trim())+"|"+(typeof n.className==="string"?n.className:""));
 const observer=new MutationObserver(checkPending);
 pending={before,observer,timer:null};
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class"]});
 pending.timer=setTimeout(stopPending,1200);
 setTimeout(checkPending,35);
},true);
window.addEventListener("pagehide",stopPending);
})();
