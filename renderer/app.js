const LINES=[
 "It's a beautiful day to break something unbreakable.",
 "It's a beautiful day to make the maths hold.",
 "It's a beautiful day to out-think a quantum computer.",
 "It's a beautiful day to prove it works.",
 "It's a beautiful day to find the flaw first.",
 "It's a beautiful day to build what outlives the attack.",
 "It's a beautiful day to ship something you can defend.",
 "It's a beautiful day to keep a secret properly.",
 "It's a beautiful day to turn noise into signal.",
 "It's a beautiful day to close the gap between the proof and the product."
];
const CLOSERS=[
 "Good work today, Tulsi.",
 "Well done. That's a day.",
 "Solid day. Rest now.",
 "You showed up. That's the whole thing.",
 "Nice work. The threads will keep till morning.",
 "Done and dusted. Proud of the effort.",
 "That's a wrap. Go rest your eyes for real.",
 "Good job. The maths will still be there tomorrow."
];
const KEY="hanami.v1";
const uid=()=>Math.random().toString(36).slice(2,9);
const todayStr=()=>new Date().toISOString().slice(0,10);

function seed(){
 return {
  greetedDate:null, dailyLine:null,
  projects:[
   {id:uid(),name:"PQC radio mesh",leftOff:"drafting the handshake fragmentation budget",nodes:[
     {id:uid(),text:"Spec the fragmentation header",done:false,flag:"progress",reason:"",collapsed:false,children:[
       {id:uid(),text:"Fixed-size piece count",done:false,flag:"none",reason:"",collapsed:true,children:[]},
       {id:uid(),text:"Reed-Solomon parity pieces (k of n)",done:true,flag:"none",reason:"",collapsed:true,children:[]},
     ]},
     {id:uid(),text:"ML-KEM ciphertext size vs 230-byte frame",done:false,flag:"none",reason:"",collapsed:true,children:[]},
     {id:uid(),text:"Confirm frame budget with Sattvik",done:false,flag:"blocked",reason:"waiting on his radio bench numbers",collapsed:true,children:[]},
   ]},
   {id:uid(),name:"PQC in 5G",leftOff:"",nodes:[
     {id:uid(),text:"Outline PQ-SUCI threat model",done:false,flag:"none",reason:"",collapsed:true,children:[]},
   ]},
   {id:uid(),name:"Secure ISAC",leftOff:"",nodes:[]},
   {id:uid(),name:"5G field guide",leftOff:"",nodes:[]},
  ],
  misc:[],
  brainDump:[],
  garden:{date:null,flowers:[]},
  nextStart:null,
  silencedDate:null,
  selected:null,
  settings:{work:40,brk:10,hyd:30,eye:20,autoBreak:true},
  logs:{}
 };
}
// Native (Electron) exposes window.HANAMI_INIT (saved data) and window.hanamiAPI.
// On the web those are undefined and we fall back to localStorage. One codebase, no build-time patching.
const NATIVE = typeof window!=="undefined" && !!window.hanamiAPI;
let S;
try{
  let raw=null;
  if(typeof window!=="undefined" && window.HANAMI_INIT) raw=window.HANAMI_INIT;
  else { try{ const r=localStorage.getItem(KEY); raw=r?JSON.parse(r):null; }catch(e){} }
  S=normalizeState(raw);
}catch(e){ S=seed(); }
// Normalize any saved shape so no missing field can ever break a render.
function normalizeState(s){
 if(!s||typeof s!=="object") s=seed();
 if(!Array.isArray(s.misc)) s.misc=[];
 if(!Array.isArray(s.brainDump)) s.brainDump=[];
 if(!s.garden||typeof s.garden!=="object"||!Array.isArray(s.garden.flowers)) s.garden={date:null,flowers:[]};
 if(!s.logs||typeof s.logs!=="object") s.logs={};
 if(!s.settings||typeof s.settings!=="object") s.settings={};
 const sd=s.settings;
 if(typeof sd.work!=="number") sd.work=40;
 if(typeof sd.brk!=="number") sd.brk=10;
 if(typeof sd.hyd!=="number") sd.hyd=30;
 if(typeof sd.eye!=="number") sd.eye=20;
 if(typeof sd.autoBreak!=="boolean") sd.autoBreak=true;
 if(!Array.isArray(s.projects)) s.projects=[];
 const fixNode=n=>{ if(!n||typeof n!=="object") return null;
   if(!n.id) n.id=uid(); if(typeof n.text!=="string") n.text=""; n.done=!!n.done;
   if(!n.flag) n.flag="none"; if(typeof n.reason!=="string") n.reason=""; n.collapsed=!!n.collapsed;
   if(!Array.isArray(n.children)) n.children=[]; n.children=n.children.map(fixNode).filter(Boolean); return n; };
 s.projects=s.projects.filter(p=>p&&typeof p==="object");
 s.projects.forEach(p=>{ if(!p.id) p.id=uid(); if(typeof p.name!=="string") p.name="untitled"; if(typeof p.leftOff!=="string") p.leftOff=""; if(!Array.isArray(p.nodes)) p.nodes=[]; p.nodes=p.nodes.map(fixNode).filter(Boolean); });
 s.misc=s.misc.filter(m=>m&&typeof m==="object"&&typeof m.text==="string");
 s.brainDump=s.brainDump.filter(b=>b&&typeof b==="object"&&typeof b.text==="string");
 if(!s.selected && s.projects[0]) s.selected=s.projects[0].id;
 return s;
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} try{ if(NATIVE) window.hanamiAPI.save(S); }catch(e){} }

const $=s=>document.querySelector(s);
const el=(t,c)=>{const e=document.createElement(t);if(c)e.className=c;return e;};
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

let navStack=[], renamingId=null;
function go(sel){ if(S.selected!==sel){ navStack.push(S.selected); } S.selected=sel; save(); renderAll(); }
function back(){ if(navStack.length){ S.selected=navStack.pop(); save(); renderAll(); } }

/* ---------------- daily garden ---------------- */
const FLOWERS=["iris","hyacinth","lily","plum","azalea","wish"];
function gardenEnsure(){ if(!S.garden||S.garden.date!==todayStr()){ S.garden={date:todayStr(),flowers:[]}; } }
function makeFlowerSpec(){
 return { type:FLOWERS[Math.floor(Math.random()*FLOWERS.length)], side:Math.random()<0.5?"bottom":"top",
   x:+(3+Math.random()*93).toFixed(1), scale:+(0.75+Math.random()*0.55).toFixed(2),
   rot:+((Math.random()-0.5)*16).toFixed(1), delay:+(Math.random()*5).toFixed(1) };
}
function petals5(cx,cy,r,col){ let s=""; for(let i=0;i<5;i++){ s+=`<ellipse transform="rotate(${i*72} ${cx} ${cy})" cx="${cx}" cy="${(cy-r*0.6).toFixed(1)}" rx="${(r*0.42).toFixed(1)}" ry="${(r*0.6).toFixed(1)}" fill="${col}"/>`; } return s; }
function flowerSVG(type,size){
 const h=Math.round(size*1.4);
 const stem='<path d="M20 56 L20 30" stroke="#6f8a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M20 44 q-7 -3 -11 -9" stroke="#6f8a5a" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
 let bloom="";
 if(type==="plum"){ bloom=petals5(20,18,11,"#f6a8c6")+`<circle cx="20" cy="18" r="2.4" fill="#f6dca0"/>`; }
 else if(type==="azalea"){ bloom=petals5(20,18,11,"#ff9fb2")+`<circle cx="18" cy="15" r="0.9" fill="#b23b57"/><circle cx="22" cy="16" r="0.9" fill="#b23b57"/><circle cx="20" cy="19" r="0.9" fill="#b23b57"/>`; }
 else if(type==="lily"){ let s=""; for(let i=0;i<6;i++){ s+=`<path transform="rotate(${i*60} 20 18)" d="M20 18 C 23 12, 23 2, 20 0 C 17 2, 17 12, 20 18 Z" fill="#ffd6e6"/>`; } bloom=s+`<circle cx="20" cy="18" r="2" fill="#e0a84a"/>`; }
 else if(type==="iris"){ bloom=`<path d="M20 20 C14 14,14 4,20 2 C26 4,26 14,20 20Z" fill="#b48cff"/><path transform="rotate(120 20 18)" d="M20 20 C15 15,13 7,18 6 C22 8,23 15,20 20Z" fill="#9166e0"/><path transform="rotate(240 20 18)" d="M20 20 C15 15,13 7,18 6 C22 8,23 15,20 20Z" fill="#9166e0"/>`; }
 else if(type==="hyacinth"){ let s=""; for(let i=0;i<7;i++){ const yy=5+i*4, xx=20+(i%2?3:-3); s+=`<circle cx="${xx}" cy="${yy}" r="3.3" fill="#9fb0ff"/>`; } bloom=s; }
 else { let s=`<circle cx="20" cy="16" r="2" fill="#d8cfe8"/>`; for(let i=0;i<14;i++){ const a=i/14*6.28, lx=(20+Math.cos(a)*10).toFixed(1), ly=(16+Math.sin(a)*10).toFixed(1); s+=`<line x1="20" y1="16" x2="${lx}" y2="${ly}" stroke="#e9e2f2" stroke-width="0.8"/><circle cx="${lx}" cy="${ly}" r="1.3" fill="#e9e2f2"/>`; } bloom=s; }
 return `<svg width="${size}" height="${h}" viewBox="0 0 40 56" style="opacity:.55;overflow:visible">${stem}${bloom}</svg>`;
}
function renderGarden(){
 const g=$("#garden"); if(!g) return;
 gardenEnsure();
 g.innerHTML="";
 S.garden.flowers.forEach(f=>{
   const w=el("div","gf");
   w.style.left=f.x+"%"; w.style[f.side]="0px"; w.style.animationDelay=f.delay+"s";
   const size=Math.round(46*f.scale);
   w.innerHTML=`<div style="transform:rotate(${f.rot}deg)${f.side==="top"?" scaleY(-1)":""}">${flowerSVG(f.type,size)}</div>`;
   g.appendChild(w);
 });
}
function recordDone(nd,projName,undo){
 gardenEnsure();
 const d=todayStr(); const log=S.logs[d]=S.logs[d]||{}; log.completed=log.completed||[];
 if(undo){ if(log.completed.length) log.completed.pop(); if(S.garden.flowers.length) S.garden.flowers.pop(); }
 else { log.completed.push({text:(nd.text||"(untitled)").slice(0,120),proj:projName||""}); S.garden.flowers.push(makeFlowerSpec()); }
}
function startRename(p){ if(!p) return; renamingId=p.id; renderNav(); }
function fmtTs(ts){ const d=new Date(ts), now=new Date(); const sameDay=d.toDateString()===now.toDateString(); const tm=d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}); return sameDay?tm:(d.toLocaleDateString([],{month:"short",day:"numeric"})+" "+tm); }
function nudgesOff(){ return meetingPaused || S.silencedDate===todayStr(); }

/* ---------------- cherry-blossom animation ---------------- */
let gatePetals=null, closePetals=null;
function buildTree(w,h,depth){
 const branches=[], blooms=[];
 const bark="#5a434a";
 const pale=["#fbe4ec","#f7d3e0","#fcdbe8","#f2c2d5","#ffffff"];
 const P=n=>n.toFixed(1);
 function taper(x,y,ang,len,w0,w1){
   const nx=Math.cos(ang+Math.PI/2), ny=Math.sin(ang+Math.PI/2);
   const x2=x+Math.cos(ang)*len, y2=y+Math.sin(ang)*len;
   const cang=ang-0.05, cl=len*0.5, cx=x+Math.cos(cang)*cl, cy=y+Math.sin(cang)*cl, cw=(w0+w1)/4;
   const d=`M${P(x+nx*w0/2)} ${P(y+ny*w0/2)} Q${P(cx+nx*cw)} ${P(cy+ny*cw)} ${P(x2+nx*w1/2)} ${P(y2+ny*w1/2)} L${P(x2-nx*w1/2)} ${P(y2-ny*w1/2)} Q${P(cx-nx*cw)} ${P(cy-ny*cw)} ${P(x-nx*w0/2)} ${P(y-ny*w0/2)} Z`;
   branches.push(`<path d="${d}" fill="${bark}"/>`);
   return [x2,y2];
 }
 function flower(x,y,r){
   const col=pale[Math.floor(Math.random()*pale.length)];
   let s=`<g transform="translate(${P(x)} ${P(y)}) rotate(${(Math.random()*72)|0})">`;
   for(let i=0;i<5;i++) s+=`<path transform="rotate(${i*72})" d="M0 0 C ${P(0.55*r)} ${P(-0.2*r)}, ${P(0.62*r)} ${P(-0.78*r)}, ${P(0.16*r)} ${P(-0.98*r)} L0 ${P(-0.82*r)} L${P(-0.16*r)} ${P(-0.98*r)} C ${P(-0.62*r)} ${P(-0.78*r)}, ${P(-0.55*r)} ${P(-0.2*r)}, 0 0 Z" fill="${col}"/>`;
   s+=`<circle r="${P(r*0.17)}" fill="#f6dca0"/></g>`;
   return s;
 }
 function bud(x,y,r){ return `<circle cx="${P(x)}" cy="${P(y)}" r="${P(r)}" fill="#e38aad"/>`; }
 function cluster(x,y,sc){
   let s=`<g class="blossom-sway" style="animation-delay:${(Math.random()*6).toFixed(1)}s">`;
   const nf=2+Math.floor(Math.random()*3);
   for(let i=0;i<nf;i++){ const a=Math.random()*6.28,d=Math.random()*9*sc; s+=flower(x+Math.cos(a)*d,y+Math.sin(a)*d,(5+Math.random()*3.5)*sc); }
   const nb=1+Math.floor(Math.random()*3);
   for(let i=0;i<nb;i++){ const a=Math.random()*6.28,d=5+Math.random()*9*sc; s+=bud(x+Math.cos(a)*d,y+Math.sin(a)*d,(1.6+Math.random()*1.3)*sc); }
   blooms.push(s+"</g>");
 }
 function grow(x,y,ang,len,w0,dep){
   const w1=Math.max(1.3,w0*0.62);
   const [x2,y2]=taper(x,y,ang,len,w0,w1);
   if(dep<=0){ cluster(x2,y2,1); return; }
   if(dep<=2&&Math.random()<0.55) cluster((x+x2)/2,(y+y2)/2,0.8);
   const n=2+(Math.random()<0.4?1:0);
   for(let b=0;b<n;b++){
     const spread=0.32+Math.random()*0.3;
     const na=ang+(b===0?-spread:b===1?spread:(Math.random()-0.5)*0.55)-0.03+Math.random()*0.06;
     grow(x2,y2,na,len*(0.72+Math.random()*0.06),w1,dep-1);
   }
 }
 grow(w/2,h,-Math.PI/2+(Math.random()-0.5)*0.08,h*0.2,Math.max(10,w*0.02),depth);
 return {inner:branches.join("")+blooms.join("")};
}
function makePetals(canvas,mult){
 const ctx=canvas.getContext("2d"); let raf=null,running=true;
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 const cols=["#fbe4ec","#f7d3e0","#f9dbe6","#f2c2d5","#ffffff"];
 let W=0,H=0,petals=[];
 const mk=y=>({x:Math.random()*W,y,s:5+Math.random()*7,rot:Math.random()*6.28,rs:(Math.random()-0.5)*0.045,vy:0.3+Math.random()*0.85,ph:Math.random()*6.28,amp:0.4+Math.random()*0.9,flip:Math.random()*6.28,fs:0.02+Math.random()*0.05,col:cols[Math.floor(Math.random()*cols.length)],a:0.55+Math.random()*0.4});
 function resize(){ const r=canvas.getBoundingClientRect(); W=r.width||window.innerWidth; H=r.height||window.innerHeight; canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); const n=Math.min(100,Math.round(Math.min(58,Math.max(16,Math.floor(W/20)))*(mult||1))); petals=[]; for(let i=0;i<n;i++) petals.push(mk(Math.random()*H)); }
 function shape(s){ ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(s*0.55,-s*0.2,s*0.62,-s*0.8,s*0.17,-s*1.0); ctx.lineTo(0,-s*0.8); ctx.lineTo(-s*0.17,-s*1.0); ctx.bezierCurveTo(-s*0.62,-s*0.8,-s*0.55,-s*0.2,0,0); ctx.closePath(); }
 function draw(p){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.scale(Math.cos(p.flip)*0.7+0.25,1); ctx.globalAlpha=p.a; ctx.fillStyle=p.col; shape(p.s); ctx.fill(); ctx.restore(); }
 const t0=performance.now();
 function frame(now){ if(!running) return; const t=now-t0; ctx.clearRect(0,0,W,H); const wind=Math.sin(t*0.0004)*0.75+0.45; petals.forEach(p=>{ p.y+=p.vy; p.ph+=0.02; p.flip+=p.fs; p.x+=wind+Math.sin(p.ph)*p.amp; p.rot+=p.rs; if(p.y>H+24){ p.y=-24; p.x=Math.random()*W; } if(p.x>W+24) p.x=-24; else if(p.x<-24) p.x=W+24; draw(p); }); raf=requestAnimationFrame(frame); }
 resize();
 if(reduce){ ctx.clearRect(0,0,W,H); petals.forEach(draw); }
 else raf=requestAnimationFrame(frame);
 const onR=()=>resize(); window.addEventListener("resize",onR);
 return { stop(){ running=false; if(raf) cancelAnimationFrame(raf); window.removeEventListener("resize",onR); } };
}
function startGateBg(){ const tree=$("#gateTree"); tree.setAttribute("viewBox","0 0 900 520"); tree.innerHTML=buildTree(900,520,4).inner; if(gatePetals) gatePetals.stop(); gatePetals=makePetals($("#gatePetals"),1.6); }
function stopGateBg(){ if(gatePetals){ gatePetals.stop(); gatePetals=null; } }
let zenPetals=null;
function openZen(){ const z=$("#zen"); z.classList.add("on"); const tree=$("#zenTree"); tree.setAttribute("viewBox","0 0 900 560"); tree.innerHTML=buildTree(900,560,4).inner; if(zenPetals) zenPetals.stop(); zenPetals=makePetals($("#zenPetals"),1.7); }
function closeZen(){ $("#zen").classList.remove("on"); if(zenPetals){ zenPetals.stop(); zenPetals=null; } }

/* ---------------- gate / morning ---------------- */
function openGate(){
 $("#gate").style.display="flex";
 startGateBg();
 gateLanding();
}
function gateLanding(){
 const newDay=S.greetedDate!==todayStr();
 if(newDay){
   $("#gateInner").innerHTML=`
     <div class="gate-land">
       <div class="gate-kao">花見</div>
       <button class="gate-enter" id="gateProceed">good morning →</button>
       <div class="gate-hint">or just stay in the blossoms a while</div>
     </div>`;
   $("#gateProceed").addEventListener("click",greetInput);
 } else {
   $("#gateInner").innerHTML=`
     <div class="gate-land">
       <div class="gate-kao">花見</div>
       <div class="gate-h" style="font-size:22px">Hello again, Tulsi</div>
       <div class="gate-sub" style="margin-bottom:2px">want to do some more work today?</div>
       <button class="gate-enter" id="gateProceed">yes, back to it →</button>
       <div class="gate-hint">or just stay in the blossoms a while</div>
       <button class="gate-nextday" id="startNext">start next day (good morning) →</button>
     </div>`;
   $("#gateProceed").addEventListener("click",enterApp);
   $("#startNext").addEventListener("click",()=>{ S.greetedDate=null; save(); greetInput(); });
 }
}
function greetInput(){
 $("#gateInner").innerHTML=`
   <div class="gate-petal">🌸</div>
   <div class="gate-h">good morning, Tulsi</div>
   <div class="gate-sub">say good morning back, and the day opens.</div>
   <input class="gate-input" id="greetIn" placeholder="type your good morning" autocomplete="off">
   <div class="gate-hint">press enter</div>`;
 const inp=$("#greetIn"); inp.focus();
 inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&inp.value.trim()) greetBack(); });
}
function greetBack(){
 S.dailyLine=LINES[Math.floor(Math.random()*LINES.length)];
 S.greetedDate=todayStr(); save();
 const now=new Date();
 const t=now.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
 const d=now.toLocaleDateString([], {weekday:"long",month:"long",day:"numeric"});
 const carry=collectCarry();
 let startHtml = S.nextStart
   ? `<div class="carry" style="border-color:var(--accent-soft)"><div class="carry-h" style="color:var(--accent)">you planned to start with</div><div class="carry-row"><span>${esc(S.nextStart)}</span></div></div>`
   : "";
 let carryHtml = carry.length
   ? `<div class="carry"><div class="carry-h">still open from before</div>`+carry.map(c=>`<div class="carry-row"><span class="carry-proj">${esc(c.proj)}</span><span>${c.flag==="blocked"?"⛔":"◌"} ${esc(c.text)}</span></div>`).join("")+`</div>`
   : `<div class="carry"><div class="carry-h">still open from before</div><div class="carry-none">nothing carried over. clean slate.</div></div>`;
 $("#gateInner").innerHTML=`
     <div class="gate-time">${d} · ${t}</div>
     <div class="gate-line">${esc(S.dailyLine)}</div>
     ${startHtml}
     ${carryHtml}
     <button class="btn btn-solid" id="intoDay">into the day</button>`;
 $("#intoDay").addEventListener("click",enterApp);
}
function collectCarry(){
 const out=[];
 S.projects.forEach(p=>walk(p.nodes,n=>{ if(!n.done && (n.flag==="blocked"||n.flag==="progress")) out.push({proj:p.name,text:n.text,flag:n.flag}); }));
 return out;
}
function enterApp(){ stopGateBg(); $("#gate").style.display="none"; $("#app").style.display="block"; renderAll(); startTimers(); }

/* ---------------- tree helpers ---------------- */
function walk(nodes,fn){ nodes.forEach(n=>{ fn(n); if(n.children) walk(n.children,fn); }); }
function curProj(){ return S.projects.find(p=>p.id===S.selected); }
function countOpen(nodes){ let c=0; walk(nodes,n=>{ if(!n.done) c++; }); return c; }
function newNode(){ return {id:uid(),text:"",done:false,flag:"none",reason:"",collapsed:false,children:[]}; }

/* ---------------- nav ---------------- */
function renderNav(){
 $("#pinMisc").classList.toggle("sel",S.selected==="misc");
 $("#pinJournal").classList.toggle("sel",S.selected==="journal");
 $("#pinBrain").classList.toggle("sel",S.selected==="brain");
 $("#miscCount").textContent=(S.misc||[]).length||"";
 $("#brainCount").textContent=(S.brainDump||[]).length||"";
 const tested=(S.logs[todayStr()]&&S.logs[todayStr()].drill&&S.logs[todayStr()].drill.length)?true:false;
 $("#jrnlDot").style.background=tested?"var(--ok)":"var(--branch-dim)";

 const list=$("#projList"), svg=$("#navSvg");
 const n=S.projects.length, slot=62, top=20;
 const h=Math.max(top+n*slot+30,340);
 svg.setAttribute("height",h); svg.setAttribute("viewBox",`0 0 256 ${h}`);
 let paths=`<path d="M38 ${h-10} Q44 ${h/2} 42 44 Q41 28 46 16" fill="none" stroke="var(--branch)" stroke-width="5" stroke-linecap="round"/>`;
 let blossoms="";
 S.projects.forEach((p,i)=>{
   const y=top+i*slot+20, sel=p.id===S.selected;
   paths+=`<path d="M41 ${y} Q68 ${y-8} 86 ${y-3}" fill="none" stroke="var(--branch)" stroke-width="3" stroke-linecap="round"/>`;
   const r=sel?8:6.5, c1=sel?"var(--blossom-3)":"var(--blossom-2)";
   blossoms+=`<circle cx="86" cy="${y-3}" r="${r}" fill="${c1}"/><circle cx="${86+r+2}" cy="${y-9}" r="${r*0.55}" fill="var(--blossom-1)"/><circle cx="${86+r+1}" cy="${y+5}" r="${r*0.5}" fill="var(--blossom-2)"/>`;
 });
 blossoms+=`<circle cx="46" cy="14" r="6.5" fill="var(--blossom-3)"/><circle cx="56" cy="8" r="4" fill="var(--blossom-2)"/>`;
 svg.innerHTML=paths+blossoms;

 list.style.height=h+"px"; list.innerHTML="";
 S.projects.forEach((p,i)=>{
   const y=top+i*slot+20;
   if(p.id===renamingId){
     const rn=el("div","proj-rename"); rn.style.top=(y-15)+"px";
     const inp=el("input"); inp.value=p.name;
     const commit=()=>{ const v=inp.value.trim(); if(v) p.name=v; renamingId=null; save(); renderAll(); };
     inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); commit(); } else if(e.key==="Escape"){ renamingId=null; renderNav(); } });
     inp.addEventListener("blur",commit);
     rn.appendChild(inp); list.appendChild(rn); setTimeout(()=>{ inp.focus(); inp.select(); },0);
     return;
   }
   const d=el("div","proj"+(p.id===S.selected?" sel":"")); d.style.top=(y-14)+"px";
   const open=countOpen(p.nodes);
   const nm=el("span","proj-name"); nm.textContent=p.name;
   d.appendChild(nm);
   if(open){ const c=el("span","proj-count"); c.textContent=open; d.appendChild(c); }
   const edit=el("button","proj-del"); edit.textContent="✎"; edit.title="rename project";
   edit.addEventListener("click",ev=>{ ev.stopPropagation(); startRename(p); });
   d.appendChild(edit);
   const del=el("button","proj-del"); del.textContent="✕"; del.title="delete project";
   del.addEventListener("click",ev=>{ ev.stopPropagation(); confirmDeleteProj(p,d,y); });
   d.appendChild(del);
   nm.addEventListener("click",()=>go(p.id));
   d.addEventListener("click",ev=>{ if(ev.target===d) go(p.id); });
   list.appendChild(d);
 });
}
function confirmDeleteProj(p,row,y){
 const c=el("div","proj-confirm"); c.style.top=(y-15)+"px";
 c.innerHTML=`delete "${esc(p.name)}"? <button class="yes">delete</button><button class="no">keep</button>`;
 row.style.visibility="hidden";
 $("#projList").appendChild(c);
 c.querySelector(".no").addEventListener("click",()=>{ c.remove(); renderNav(); });
 c.querySelector(".yes").addEventListener("click",()=>{
   S.projects=S.projects.filter(x=>x.id!==p.id);
   if(S.selected===p.id) S.selected=S.projects[0]?S.projects[0].id:"misc";
   save(); renderAll();
 });
}

/* ---------------- main router ---------------- */
function renderMain(){
 if(S.selected==="misc"){ renderMisc(); return; }
 if(S.selected==="journal"){ renderJournal(); return; }
 if(S.selected==="brain"){ renderBrain(); return; }
 renderProject();
}
function headerBits(show){ $("#backBtn").classList.toggle("show",navStack.length>0); $("#leftOffWrap").style.display=show?"flex":"none"; }

function renderProject(){
 headerBits(true);
 const p=curProj();
 if(!p){ $("#mhTitle").textContent="no projects"; $("#mhMeta").textContent=""; $("#treeWrap").innerHTML=""; $("#leftOffWrap").style.display="none"; return; }
 $("#mhTitle").textContent=p.name;
 $("#mhMeta").textContent=`${countOpen(p.nodes)} open`;
 const lo=$("#leftOff"); lo.value=p.leftOff||""; lo.oninput=()=>{ p.leftOff=lo.value; save(); };
 const wrap=$("#treeWrap"); wrap.innerHTML="";
 if(!p.nodes.length){ const e=el("div","empty-proj"); e.textContent="no tasks yet. add the first one."; wrap.appendChild(e); }
 else p.nodes.forEach(nd=>wrap.appendChild(renderNode(nd,p.nodes)));
 const add=el("button","add-child"); add.style.marginLeft="0"; add.textContent="+ add task";
 add.addEventListener("click",()=>{ p.nodes.push(newNode()); save(); renderProject(); renderNav(); focusLast(wrap); });
 wrap.appendChild(add);
}
function renderNode(nd,siblings){
 const node=el("div","node"+(nd.done?" done":""));
 const row=el("div","node-row");
 const hasKids=nd.children&&nd.children.length;
 const caret=el("div","caret"+(hasKids?"":" empty")); caret.textContent=nd.collapsed?"▶":"▼";
 caret.addEventListener("click",()=>{ nd.collapsed=!nd.collapsed; save(); renderProject(); });
 row.appendChild(caret);
 const cb=el("div","cbox"+(nd.done?" on":"")+(nd.flag==="blocked"?" blocked":""));
 cb.addEventListener("click",()=>{ nd.done=!nd.done; const proj=curProj(); recordDone(nd,proj?proj.name:"",!nd.done); save(); renderProject(); renderNav(); renderGarden(); });
 row.appendChild(cb);
 const tx=el("div","ntext"); tx.contentEditable="true"; tx.textContent=nd.text;
 tx.addEventListener("blur",()=>{ nd.text=tx.textContent.trim(); save(); });
 tx.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); tx.blur(); const nn=newNode(); siblings.splice(siblings.indexOf(nd)+1,0,nn); save(); renderProject(); focusLast($("#treeWrap")); } });
 row.appendChild(tx);
 if(nd.flag==="blocked"){ const t=el("span","tag blocked"); t.textContent="blocked"; row.appendChild(t); }
 else if(nd.flag==="progress"){ const t=el("span","tag progress"); t.textContent="in progress"; row.appendChild(t); }
 const tools=el("div","node-tools");
 tools.appendChild(iconBtn("＋","add sub-task",()=>{ nd.children=nd.children||[]; nd.children.push(newNode()); nd.collapsed=false; save(); renderProject(); }));
 tools.appendChild(iconBtn("◐","cycle status",()=>{ nd.flag=nd.flag==="none"?"progress":nd.flag==="progress"?"blocked":"none"; if(nd.flag!=="blocked") nd.reason=""; save(); renderProject(); renderNav(); }));
 tools.appendChild(iconBtn("✕","delete",()=>{ siblings.splice(siblings.indexOf(nd),1); save(); renderProject(); renderNav(); }));
 row.appendChild(tools);
 node.appendChild(row);
 if(nd.flag==="blocked"){
   const r=el("div","blocked-reason");
   r.innerHTML=`⛔ <span contenteditable="true" style="outline:none">${esc(nd.reason)||"why is it blocked?"}</span>`;
   const span=r.querySelector("span");
   span.addEventListener("focus",()=>{ if(!nd.reason) span.textContent=""; });
   span.addEventListener("blur",()=>{ nd.reason=span.textContent.trim(); save(); });
   node.appendChild(r);
 }
 if(hasKids&&!nd.collapsed){ const kids=el("div","children"); nd.children.forEach(k=>kids.appendChild(renderNode(k,nd.children))); node.appendChild(kids); }
 return node;
}
function iconBtn(label,title,fn){ const b=el("button"); b.textContent=label; b.title=title; b.addEventListener("click",fn); return b; }
function focusLast(wrap){ const all=wrap.querySelectorAll(".ntext"); const last=all[all.length-1]; if(last) last.focus(); }

/* ---------------- misc ---------------- */
function renderMisc(){
 headerBits(false);
 $("#mhTitle").textContent="miscellaneous";
 $("#mhMeta").textContent=`${S.misc.length} quick${S.misc.length===1?"":""}`;
 const wrap=$("#treeWrap"); wrap.innerHTML="";
 const note=el("div","misc-note"); note.textContent="loose tasks that don't belong to a project. tick one and it's gone.";
 wrap.appendChild(note);
 const addRow=el("div","misc-add");
 const inp=el("input"); inp.placeholder="add a quick task, press enter";
 addRow.appendChild(inp); wrap.appendChild(addRow);
 inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&inp.value.trim()){ S.misc.push({id:uid(),text:inp.value.trim()}); inp.value=""; save(); renderMisc(); renderNav(); setTimeout(()=>$("#treeWrap").querySelector(".misc-add input").focus(),0); } });
 S.misc.forEach(m=>{
   const it=el("div","misc-item");
   const cb=el("div","cbox");
   const tx=el("span"); tx.style.flex="1"; tx.textContent=m.text;
   cb.addEventListener("click",()=>{ recordDone({text:m.text},"misc",false); it.classList.add("gone"); setTimeout(()=>{ S.misc=S.misc.filter(x=>x.id!==m.id); save(); renderMisc(); renderNav(); renderGarden(); },250); });
   it.appendChild(cb); it.appendChild(tx); wrap.appendChild(it);
 });
 inp.focus();
}

/* ---------------- brain dump ---------------- */
function renderBrain(){
 headerBits(false);
 $("#mhTitle").textContent="brain dump";
 $("#mhMeta").textContent=`${S.brainDump.length} thought${S.brainDump.length===1?"":"s"}`;
 const wrap=$("#treeWrap"); wrap.innerHTML="";
 const note=el("div","bd-note"); note.textContent="empty your head mid-work. each thought is timestamped and saved. not tasks, just thinking.";
 wrap.appendChild(note);
 const add=el("div","bd-add");
 const ta=el("textarea"); ta.placeholder="what's on your mind? (Ctrl+Enter to drop it)";
 const btn=el("button","btn bd-addbtn"); btn.textContent="drop it";
 const commit=()=>{ const v=ta.value.trim(); if(!v) return; S.brainDump.unshift({id:uid(),ts:Date.now(),text:v}); ta.value=""; save(); renderBrain(); renderNav(); };
 btn.addEventListener("click",commit);
 ta.addEventListener("keydown",e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); commit(); } });
 add.appendChild(ta); add.appendChild(btn); wrap.appendChild(add);
 S.brainDump.forEach(b=>{
   const it=el("div","bd-item");
   const tm=el("div","bd-time"); tm.textContent=fmtTs(b.ts);
   const tx=el("div","bd-text"); tx.textContent=b.text;
   const del=el("button","bd-del"); del.textContent="✕"; del.title="delete";
   del.addEventListener("click",()=>{ S.brainDump=S.brainDump.filter(x=>x.id!==b.id); save(); renderBrain(); renderNav(); });
   it.appendChild(tm); it.appendChild(tx); it.appendChild(del); wrap.appendChild(it);
 });
 setTimeout(()=>{ const t=$("#treeWrap").querySelector(".bd-add textarea"); if(t) t.focus(); },0);
}

/* ---------------- journal ---------------- */
function renderJournal(){
 headerBits(false);
 $("#mhTitle").textContent="journal"; $("#mhMeta").textContent="everything you've saved";
 const wrap=$("#treeWrap"); wrap.innerHTML="";
 const note=el("div","save-note");
 note.innerHTML = window.hanamiAPI
   ? "Your days are saved to a file on your computer at <b>%APPDATA%\\Hanami\\hanami-data.json</b>. Back it up by copying that file, or use <b>copy backup</b> below for a clipboard copy."
   : "Your days are saved in this browser only. Clearing browser data, or opening Hanami on another device, starts empty. Use <b>copy backup</b> to keep a copy you control. The installed Windows app saves to a real file on your disk instead.";
 wrap.appendChild(note);
 const tools=el("div","jrnl-tools");
 const bk=el("button","mini"); bk.textContent="copy backup (all data)";
 bk.addEventListener("click",()=>{
   const data=JSON.stringify(S,null,2);
   if(navigator.clipboard&&navigator.clipboard.writeText){
     navigator.clipboard.writeText(data).then(()=>nudge("backup copied","paste it into a file you keep. that's your safe copy.",false)).catch(()=>fallbackCopy(data));
   } else fallbackCopy(data);
 });
 tools.appendChild(bk);
 wrap.appendChild(tools);

 const dates=Object.keys(S.logs).filter(d=>{const l=S.logs[d];return (l.shutdown&&l.shutdown.trim())||(l.drill&&l.drill.length);}).sort().reverse();
 if(!dates.length){ const e=el("div","jrnl-empty"); e.textContent="no closed days yet. your shutdown notes and testing logs will appear here."; wrap.appendChild(e); return; }
 dates.forEach(d=>{
   const l=S.logs[d];
   const card=el("div","jday");
   const dd=new Date(d+"T00:00").toLocaleDateString([], {weekday:"short",month:"short",day:"numeric"});
   const tested=l.drill&&l.drill.length;
   const h=el("div","jday-h");
   h.innerHTML=`<span class="jday-date">${dd}</span><span class="jday-test ${tested?"yes":"no"}">${tested?"tested ✓":"no testing"}</span>`;
   card.appendChild(h);
   if(l.shutdown&&l.shutdown.trim()){ const did=el("div","jday-did"); did.textContent=l.shutdown; card.appendChild(did); }
   if(tested){
     const cols=el("div","jday-cols");
     [["knew","knew it cold"],["shaky","shaky"],["no","didn't know"]].forEach(([k,lab])=>{
       const col=el("div","jcol "+k);
       col.innerHTML=`<div class="jcol-h">${lab}</div>`;
       const items=l.drill.filter(x=>x.verdict===k);
       if(items.length) items.forEach(x=>{ const i=el("div","jcol-item"); i.textContent="· "+x.item; col.appendChild(i); });
       else { const i=el("div","jcol-item"); i.textContent="—"; col.appendChild(i); }
       cols.appendChild(col);
     });
     card.appendChild(cols);
   }
   wrap.appendChild(card);
 });
}
function fallbackCopy(txt){
 const ta=document.createElement("textarea"); ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select();
 try{ document.execCommand("copy"); nudge("backup copied","paste it into a file you keep.",false); }catch(e){ nudge("couldn't copy","select the text manually to back up.",true); }
 ta.remove();
}

function renderTestStatus(){
 const tested=(S.logs[todayStr()]&&S.logs[todayStr()].drill&&S.logs[todayStr()].drill.length)?true:false;
 const s=$("#testStatus");
 s.innerHTML=`<span class="pdot" style="background:${tested?"var(--ok)":"var(--branch-dim)"}"></span><span style="color:${tested?"var(--ok)":"var(--ink-faint)"}">${tested?"today's testing: done":"today's testing: not yet"}</span>`;
 const btn=$("#drillBtn"); btn.classList.toggle("done",tested); btn.textContent=tested?"testing logged ✓ (edit)":"log today's testing";
}
function renderAll(){ renderNav(); renderMain(); renderTestStatus(); updatePomoUI(); renderGarden(); }

/* ---------------- timers ---------------- */
let pomo={phase:"idle",left:0,running:false};
let hyd={left:0}, eye={left:0}, tickInt=null, meetingPaused=false, breakCheckTimer=null;
function startTimers(){
 pomo.left=S.settings.work*60; hyd.left=S.settings.hyd*60; eye.left=S.settings.eye*60;
 if(tickInt) clearInterval(tickInt); tickInt=setInterval(tick,1000);
 updatePomoUI(); updateNudgeUI(); probeNotif();
}
function probeNotif(){
 const stat=$("#notifStat");
 if(NATIVE){ stat.textContent="desktop notifications on"; return; }
 if(!("Notification" in window)){ stat.textContent="this browser blocks desktop notifications. in-app only here; the Windows build reaches you when hidden."; return; }
 if(Notification.permission==="granted"){ stat.textContent="desktop notifications on"; return; }
 if(Notification.permission==="denied"){ stat.textContent="desktop notifications blocked by browser. in-app only here."; return; }
 Notification.requestPermission().then(p=>{ stat.textContent=p==="granted"?"desktop notifications on":"running in-app only here. the Windows build reaches you when hidden."; }).catch(()=>{ stat.textContent="in-app nudges only in this browser."; });
}
function tick(){
 const off=nudgesOff();
 if(pomo.running){ pomo.left--; if(pomo.left<=0) pomoPhaseEnd(); updatePomoUI(); }
 if(!off){
   hyd.left--; if(hyd.left<=0){ nudge("💧 hydrate","a sip of water. 30 minutes passed.",false); hyd.left=S.settings.hyd*60; }
   eye.left--; if(eye.left<=0){ nudge("👁 rest your eyes","look 20 feet away for 20 seconds.",false); eye.left=S.settings.eye*60; }
 }
 updateNudgeUI();
}
function pomoPhaseEnd(){
 if(pomo.phase==="work"){
   if(S.settings.autoBreak){
     pomo.phase="break"; pomo.left=S.settings.brk*60;
     if(!nudgesOff()){ nudge("🌸 break time",`${S.settings.brk} minutes. step away from the screen.`,true); breakCheckTimer=setTimeout(()=>{ if(!nudgesOff()) nudge("still there?","are you sure you actually stopped?",true); },60000); }
   } else {
     pomo={phase:"idle",left:S.settings.work*60,running:false};
     if(!nudgesOff()) nudge("focus done",`nice. ${S.settings.work} minutes in the bag.`,false);
   }
 } else { pomo.phase="work"; pomo.left=S.settings.work*60; if(!nudgesOff()) nudge("back to it",`${S.settings.work}-minute focus block started.`,false); }
}
function updatePomoUI(){
 const m=Math.floor(Math.max(pomo.left,0)/60), s=Math.max(pomo.left,0)%60;
 $("#pomoTime").textContent=`${m}:${String(s).padStart(2,"0")}`;
 const ph=$("#pomoPhase"); ph.className="pomo-phase"+(pomo.phase==="break"?" break":"");
 ph.textContent=pomo.phase==="idle"?"ready when you are":pomo.phase==="work"?(pomo.running?"focus":"paused"):(pomo.running?"break":"paused");
 const b=$("#pomoBtns"); b.innerHTML="";
 if(pomo.phase==="idle") b.appendChild(miniBtn("start focus","go",()=>{ pomo.phase="work"; pomo.left=S.settings.work*60; pomo.running=true; updatePomoUI(); }));
 else {
   b.appendChild(miniBtn(pomo.running?"pause":"resume","",()=>{ pomo.running=!pomo.running; updatePomoUI(); }));
   b.appendChild(miniBtn("+5 min","",()=>{ pomo.left+=300; updatePomoUI(); }));
   b.appendChild(miniBtn("reset","",()=>{ clearTimeout(breakCheckTimer); pomo={phase:"idle",left:S.settings.work*60,running:false}; updatePomoUI(); }));
 }
}
function miniBtn(txt,cls,fn){ const x=el("button","mini"+(cls?" "+cls:"")); x.textContent=txt; x.addEventListener("click",fn); return x; }
function updateNudgeUI(){
 const off=nudgesOff();
 const f=x=>`in ${Math.floor(x/60)}:${String(x%60).padStart(2,"0")}`;
 const lab = meetingPaused ? "paused" : (S.silencedDate===todayStr() ? "off till tomorrow" : null);
 $("#hydNx").textContent=lab||f(Math.max(hyd.left,0));
 $("#eyeNx").textContent=lab||f(Math.max(eye.left,0));
 $("#hydDot").className="dot"+(off?" off":""); $("#eyeDot").className="dot"+(off?" off":"");
}
function nudge(title,body,amber){
 const wrap=$("#toasts"); const t=el("div","toast"+(amber?" amber":""));
 t.innerHTML=`<div class="toast-t">${esc(title)}</div><div class="toast-b">${esc(body)}</div>`;
 const act=el("div","toast-act"); const ok=el("button","mini"); ok.textContent="ok"; ok.addEventListener("click",()=>t.remove());
 act.appendChild(ok); t.appendChild(act); wrap.appendChild(t);
 setTimeout(()=>{ if(t.parentNode) t.remove(); }, amber?20000:9000);
 try{ if(NATIVE){ window.hanamiAPI.notify(title,body); } else if("Notification" in window && Notification.permission==="granted"){ new Notification(title,{body}); } }catch(e){}
}

/* ---------------- modals ---------------- */
function openModal(html){ $("#modalCard").innerHTML=html; $("#modal").style.display="flex"; }
function closeModal(){ $("#modal").style.display="none"; if(closePetals){ closePetals.stop(); closePetals=null; const c=$("#closePetals"); if(c){ const x=c.getContext("2d"); if(x) x.clearRect(0,0,c.width,c.height); } } }
$("#modal").addEventListener("click",e=>{ if(e.target.id==="modal") closeModal(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closeModal(); closeZen(); } });

$("#shutdownBtn").addEventListener("click",()=>{
 const d=todayStr(); const log=S.logs[d]||{}; const completed=log.completed||[];
 const doneHtml = completed.length
   ? `<div class="sd-done"><div class="sd-done-h">completed today (${completed.length})</div>`+completed.map(c=>`<div class="sd-done-row">${c.proj?`<span class="pj">${esc(c.proj)}</span>`:""}<span>✓ ${esc(c.text)}</span></div>`).join("")+`</div>`
   : `<div class="sd-done"><div class="sd-none">no tasks ticked today. that's alright, some days are like that.</div></div>`;
 openModal(`
   <div class="modal-top"><button class="modal-back" id="mBack">←</button><div class="modal-h">closing the day</div></div>
   ${doneHtml}
   <div class="sd-label">anything to note about today?</div>
   <textarea class="ta" id="sdText" style="min-height:88px" placeholder="today I...">${esc(log.shutdown||"")}</textarea>
   <div class="sd-label">tomorrow, start with</div>
   <textarea class="ta" id="sdTom" style="min-height:66px" placeholder="the first thing to pick up tomorrow...">${esc(log.tomorrow||"")}</textarea>
   <div class="modal-sub" style="margin:12px 0 0;font-size:12px">nudges go quiet until your next workday. the garden resets.</div>
   <div class="modal-foot"><button class="btn" id="sdCancel">not yet</button><button class="btn btn-solid" id="sdSave">done for today</button></div>`);
 $("#mBack").addEventListener("click",closeModal);
 $("#sdCancel").addEventListener("click",closeModal);
 $("#sdSave").addEventListener("click",()=>{
   S.logs[d]=S.logs[d]||{};
   S.logs[d].shutdown=$("#sdText").value.trim();
   S.logs[d].tomorrow=$("#sdTom").value.trim();
   S.nextStart=S.logs[d].tomorrow||null;
   S.silencedDate=todayStr();
   S.garden={date:todayStr(),flowers:[]};
   save(); renderGarden(); updateNudgeUI();
   showCloser();
 });
});
function showCloser(){
 const line=CLOSERS[Math.floor(Math.random()*CLOSERS.length)];
 const tree=buildTree(300,180,3).inner;
 openModal(`<div style="text-align:center;padding:8px 6px 14px">
   <svg class="close-tree" viewBox="0 0 300 190" aria-hidden="true">${tree}</svg>
   <div class="modal-h" style="margin-bottom:12px">${esc(line)}</div>
   <div class="modal-sub" style="margin-bottom:20px">saved to your journal. see it any time under journal.</div>
   <button class="btn btn-solid" id="closerOk">goodnight</button>
 </div>`);
 if(closePetals) closePetals.stop();
 closePetals=makePetals($("#closePetals"));
 $("#closerOk").addEventListener("click",()=>{ closeModal(); renderTestStatus(); openGate(); });
}

$("#drillBtn").addEventListener("click",()=>{
 const d=todayStr(); const log=S.logs[d]||{}; let items=(log.drill||[]).slice();
 const buckets={knew:[],shaky:[],no:[]};
 items.forEach(x=>{ if(buckets[x.verdict]) buckets[x.verdict].push(x.item); });
 const col=(k,lab)=>`<div class="dcol ${k}"><div class="dcol-h">${lab}</div>
     <textarea data-k="${k}" placeholder="paste or type, one per line"></textarea>
     <button class="dcol-add" data-add="${k}">add to ${lab.split(" ")[0]}</button>
     <div class="dchips" data-chips="${k}" style="margin-top:8px"></div></div>`;
 openModal(`
   <div class="modal-top"><button class="modal-back" id="mBack">←</button><div class="modal-h">daily testing</div></div>
   <div class="modal-sub">three columns. paste or type your verdicts into each, one item per line, then add.</div>
   <div class="drill-cols">${col("knew","knew it cold")}${col("shaky","shaky, revise")}${col("no","didn't know")}</div>
   <div class="modal-foot"><button class="btn" id="diCancel">cancel</button><button class="btn btn-solid" id="diSave">save log</button></div>`);
 function drawChips(){
   ["knew","shaky","no"].forEach(k=>{
     const box=$(`[data-chips="${k}"]`); box.innerHTML="";
     buckets[k].forEach((t,i)=>{ const c=el("div","dchip"); const s=el("span"); s.textContent=t; const x=el("button"); x.textContent="✕"; x.addEventListener("click",()=>{ buckets[k].splice(i,1); drawChips(); }); c.appendChild(s); c.appendChild(x); box.appendChild(c); });
   });
 }
 drawChips();
 $("#modalCard").querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>{
   const k=btn.dataset.add; const ta=$(`textarea[data-k="${k}"]`);
   ta.value.split("\n").map(s=>s.trim()).filter(Boolean).forEach(line=>buckets[k].push(line));
   ta.value=""; drawChips();
 }));
 $("#mBack").addEventListener("click",closeModal);
 $("#diCancel").addEventListener("click",closeModal);
 $("#diSave").addEventListener("click",()=>{
   const drill=[];
   ["knew","shaky","no"].forEach(k=>buckets[k].forEach(item=>drill.push({item,verdict:k})));
   S.logs[d]=S.logs[d]||{}; S.logs[d].drill=drill; save(); closeModal(); renderTestStatus(); renderNav();
   if(S.selected==="journal") renderJournal();
 });
});

$("#openSettings").addEventListener("click",()=>{
 openModal(`
   <div class="modal-top"><button class="modal-back" id="mBack">←</button><div class="modal-h">timer settings</div></div>
   <div class="modal-sub">adjust the rhythm.</div>
   <div class="set-row"><span>focus block (minutes)</span><input id="sWork" type="number" value="${S.settings.work}"></div>
   <div class="set-row"><span>break (minutes)</span><input id="sBrk" type="number" value="${S.settings.brk}"></div>
   <div class="set-row"><span>hydrate every (minutes)</span><input id="sHyd" type="number" value="${S.settings.hyd}"></div>
   <div class="set-row"><span>rest eyes every (minutes)</span><input id="sEye" type="number" value="${S.settings.eye}"></div>
   <label class="set-check"><input type="checkbox" id="sAuto" ${S.settings.autoBreak?"checked":""} style="width:auto"> take a short break after each focus session</label>
   <div class="modal-foot"><button class="btn" id="setCancel">cancel</button><button class="btn btn-solid" id="setSave">save</button></div>`);
 $("#mBack").addEventListener("click",closeModal);
 $("#setCancel").addEventListener("click",closeModal);
 $("#setSave").addEventListener("click",()=>{
   S.settings.work=Math.max(1,+$("#sWork").value||40); S.settings.brk=Math.max(1,+$("#sBrk").value||10);
   S.settings.hyd=Math.max(1,+$("#sHyd").value||30); S.settings.eye=Math.max(1,+$("#sEye").value||20);
   S.settings.autoBreak=$("#sAuto").checked;
   save(); hyd.left=S.settings.hyd*60; eye.left=S.settings.eye*60; if(pomo.phase==="idle") pomo.left=S.settings.work*60;
   closeModal(); updatePomoUI(); updateNudgeUI();
 });
});

$("#meetingTog").addEventListener("click",()=>{
 meetingPaused=!meetingPaused; $("#meetingTog").classList.toggle("on",meetingPaused);
 $("#meetingTog").textContent=meetingPaused?"nudges paused — resume":"pause all nudges (meeting)"; updateNudgeUI();
});
$("#addProj").addEventListener("click",()=>{ const p={id:uid(),name:"new project",leftOff:"",nodes:[]}; S.projects.push(p); S.selected=p.id; save(); renderAll(); startRename(p); });
$("#pinMisc").addEventListener("click",()=>go("misc"));
$("#pinJournal").addEventListener("click",()=>go("journal"));
$("#pinBrain").addEventListener("click",()=>go("brain"));
$("#backBtn").addEventListener("click",back);
$("#zenOpen").addEventListener("click",openZen);
$("#zenBack").addEventListener("click",closeZen);
$("#mhTitle").addEventListener("dblclick",()=>{ startRename(curProj()); });

/* ---------------- boot ---------------- */
openGate();