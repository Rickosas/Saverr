/* Saverr – weekmenu-planner ("Help mij besparen") en weekoverzicht met deelknop.
   Wordt geladen na app.js en gebruikt de data en helpers daaruit. */
'use strict';

/* ---------- recepten (hoeveelheden voor 4 personen, in verpakkingen) ----------
   Voorbeeld: ['gehakt',1] = 1 pak rundergehakt (500 g); ['uien',.15] = 15% van een zak uien (1 kg). */
const RECIPES = [
  {id:'bolognese', name:'Pasta bolognese', emoji:'🍝', main:'gehakt', ing:[['spaghetti',1],['gehakt',1],['tomatenblokjes',2],['uien',.15],['kaas-geraspt',.5]]},
  {id:'kiprijst', name:'Kip met rijst en paprika', emoji:'🍗', main:'kip', ing:[['kipfilet',1],['rijst',.3],['paprika',1],['uien',.15],['ketjap',.1]]},
  {id:'wraps', name:'Wraps met gehakt', emoji:'🌯', main:'gehakt', ing:[['wraps',1.3],['gehakt',1],['kidneybonen',1],['mais',1],['ijsbergsla',.5],['tomaten',.5],['kaas-geraspt',.5]]},
  {id:'boerenkool', name:'Boerenkoolstamppot met rookworst', emoji:'🥬', main:'worst', ing:[['aardappelen',.5],['boerenkool',1.5],['rookworst',2],['melk',.2]]},
  {id:'hutspot', name:'Hutspot met rookworst', emoji:'🥕', main:'worst', ing:[['aardappelen',.4],['wortelen',1],['uien',.3],['rookworst',2]]},
  {id:'pizza', name:'Pizza-avond met salade', emoji:'🍕', main:'vega', ing:[['pizza-m',3],['ijsbergsla',.5],['komkommer',1]]},
  {id:'nasi', name:'Nasi met kip', emoji:'🍛', main:'kip', ing:[['rijst',.3],['kipfilet',1],['nasigroente',1],['eieren',.4],['ketjap',.15]]},
  {id:'pannenkoeken', name:'Pannenkoeken', emoji:'🥞', main:'vega', ing:[['pannenkoekenmix',1],['melk',1],['eieren',.3],['stroop',.3]]},
  {id:'macaroni', name:'Macaroni met ham en kaas', emoji:'🧀', main:'ham', ing:[['macaroni',1],['hamblokjes',1],['kaas-geraspt',.5],['tomatenblokjes',1],['uien',.1]]},
  {id:'zalm', name:'Zalm met aardappelen en broccoli', emoji:'🐟', main:'vis', ing:[['zalm',2],['aardappelen',.3],['broccoli',1.5]]},
  {id:'gehaktbal', name:'Gehaktballen, aardappelen en sperziebonen', emoji:'🫛', main:'gehakt', ing:[['gehakt',1],['aardappelen',.3],['sperziebonen',1.5]]},
  {id:'chili', name:'Chili con carne', emoji:'🌶️', main:'gehakt', ing:[['gehakt',1],['kidneybonen',2],['tomatenblokjes',2],['uien',.15],['paprika',.66],['rijst',.3]]},
  {id:'carbonara', name:'Pasta carbonara', emoji:'🥓', main:'spek', ing:[['spaghetti',1],['spekjes',1.2],['eieren',.4],['kaas-geraspt',.5]]},
  {id:'ovenkip', name:'Kip met groente uit de oven', emoji:'🥘', main:'kip', ing:[['kipfilet',1],['aardappelen',.3],['paprika',1],['broccoli',1]]},
  {id:'groentepasta', name:'Pasta met groente en kaas', emoji:'🥗', main:'vega', ing:[['spaghetti',1],['tomatenblokjes',2],['paprika',1],['uien',.15],['kaas-geraspt',.7]]},
];

/* normale prijs van een product = mediaan van de normale prijzen (zonder prijsdalingen) over alle winkels */
const normalOf = p => { const v=Object.values(p.st).map(x=>Math.max(x[0],x[4]||0)).sort((a,b)=>a-b); return v[Math.floor((v.length-1)/2)]; };
const recipeOK = r => r.ing.every(([id])=>P(id));
const unitPrice = (p,sid) => has(p,sid) ? price(p,sid) : median(p);

/* boodschappen voor een set recepten bij één winkel */
function planCost(recipeIds, sid, persons){
  const k=persons/4, need={};
  recipeIds.forEach(rid=>RECIPES.find(r=>r.id===rid).ing.forEach(([id,q])=>{ need[id]=(need[id]||0)+q*k; }));
  let total=0, normal=0, missing=0, drops=0; const items=[];
  Object.entries(need).forEach(([id,q])=>{
    const p=P(id), n=Math.max(1,Math.ceil(q-0.05)), up=unitPrice(p,sid), np=normalOf(p);
    if(!has(p,sid)) missing++; if(has(p,sid)&&was(p,sid)) drops++;
    total+=n*up; normal+=n*np; items.push({id,p,n,up,np,ok:has(p,sid),drop:has(p,sid)&&was(p,sid)>0});
  });
  const meals = recipeIds.map(rid=>{ const r=RECIPES.find(x=>x.id===rid); return {r, cost:r.ing.reduce((t,[id,q])=>t+q*k*unitPrice(P(id),sid),0)}; });
  return {sid,total,normal,saved:Math.max(0,normal-total),missing,drops,items:items.sort((a,b)=>b.n*b.up-a.n*a.up),meals};
}

function makePlan({persons,budget,days,allStores}, fixed=null){
  const pool=RECIPES.filter(recipeOK), stores=(allStores||!st.myStores.length?STORES:STORES.filter(s=>st.myStores.includes(s.id))).map(s=>s.id);
  let best=null; const cands=[];
  const score = c => {
    const over=Math.max(0,c.total-budget);
    const mains=new Set(c.meals.map(m=>m.r.main)).size;
    return -over*10 + c.saved + (budget-c.total) + mains - c.missing*3 + Math.random()*2;
  };
  for(let i=0;i<500;i++){
    let ids;
    if(fixed){ ids=[...fixed.ids]; const choices=pool.filter(r=>!ids.includes(r.id)); ids[fixed.swap]=choices[Math.floor(Math.random()*choices.length)].id; }
    else { const sh=[...pool].sort(()=>Math.random()-.5); ids=sh.slice(0,days).map(r=>r.id); }
    // max 2 keer dezelfde hoofdingrediënt
    const cnt={}; if(ids.some(id=>{ const m=RECIPES.find(r=>r.id===id).main; cnt[m]=(cnt[m]||0)+1; return cnt[m]>2; })) continue;
    for(const sid of (fixed?[fixed.sid]:stores)){
      const c=planCost(ids,sid,persons); c.score=score(c); c.ids=ids; cands.push(c);
      if(!best||c.score>best.score) best=c;
    }
  }
  // kies willekeurig uit de bijna-beste menu's, zodat je elke keer iets anders krijgt
  const key=c=>[...c.ids].sort().join()+c.sid, seen=new Set();
  const top=cands.filter(c=>c.score>=best.score-6 && !seen.has(key(c)) && seen.add(key(c)));
  return top[Math.floor(Math.random()*top.length)] || best;
}

let planForm = null;
function viewPlanner(){
  const f = planForm || (planForm = Object.assign({persons:4,budget:60,days:5,allStores:false}, st.planPrefs||{}));
  const plan = st.plan && st.plan.ids ? planCost(st.plan.ids, st.plan.sid, st.plan.persons) : null;
  const start = new Date(st.plan?.created||Date.now());
  const step = (k,min,max,stepv,fmt) => `<div class="row"><div class="st">${{persons:'Aantal personen',budget:'Budget',days:'Aantal avonden'}[k]}</div>
    <button class="btn sm ghost" data-pstep="${k}|${-stepv}|${min}|${max}">−</button><b style="min-width:56px;text-align:center;font-family:'Bricolage Grotesque';font-size:17px">${fmt(f[k])}</b><button class="btn sm ghost" data-pstep="${k}|${stepv}|${min}|${max}">+</button></div>`;
  return `<button class="back" data-act="back">‹ Terug</button>
    <h2>🤖 Help mij besparen</h2>
    <p class="hint">Saverr maakt een weekmenu binnen je budget, met de echte prijzen van vandaag, en zoekt uit bij welke van jouw winkels je het goedkoopst uit bent.</p>
    ${step('persons',1,8,1,v=>v)}
    ${step('budget',15,250,5,v=>'€'+v)}
    ${step('days',2,7,1,v=>v)}
    <div class="chips" style="margin-top:6px"><button class="chip ${!f.allStores?'on':''}" data-pall="0">📍 Mijn winkels</button><button class="chip ${f.allStores?'on':''}" data-pall="1">Alle supermarkten</button></div>
    <button class="btn green" data-act="mkplan">${plan?'🔄 Maak een nieuw weekmenu':'✨ Maak mijn weekmenu'}</button>
    ${plan?planHTML(plan,start):''}`;
}
function planHTML(c,start){
  const p=st.plan, over=c.total>p.budget+0.005;
  return `<h2>🍝 Jouw weekmenu</h2>
    <p class="hint">${p.persons} personen · ${p.ids.length} avonden · alles bij <b>${S(c.sid).name}</b>${c.missing?` · ${c.missing} product(en) daar niet gevonden (geschat)`:''}</p>
    <div class="list">${c.meals.map((m,i)=>{const d=new Date(start); d.setDate(d.getDate()+i); return `<div class="item static">
      <div class="emoji">${m.r.emoji}</div><div class="info"><div class="meta" style="font-weight:600;color:var(--green);text-transform:capitalize">${DAYS[d.getDay()]}</div><div class="name" style="white-space:normal">${m.r.name}</div></div>
      <div class="price"><b>${euro(m.cost)}</b></div><button class="fav sm" data-swap="${i}" title="Ander gerecht" aria-label="Ander gerecht" style="color:var(--green)">🔄</button></div>`}).join('')}</div>
    <div class="savebig" style="margin-top:12px">
      <div class="brk" style="margin-top:0"><div><span>Normaal (gemiddelde supermarkt)</span><b><s style="opacity:.7">${euro(c.normal)}</s></b></div>
        <div><span>Bij ${S(c.sid).name}${c.drops?` (${c.drops} prijsdalingen)`:''}</span><b>${euro(c.total)}</b></div></div>
      <div style="font-size:13px;opacity:.85;margin-top:10px">💰 Bespaard</div><div class="amt">${euro(c.saved)}</div>
      ${c.saved<1?`<div style="font-size:12.5px;opacity:.9;margin-bottom:4px">${S(c.sid).name} is voor dit menu niet goedkoper dan gemiddeld. Tip: zet bij <i>Mijn winkels</i> ook Lidl of Dirk aan, of kies "Alle supermarkten".</div>`:''}
      <div style="font-size:12.5px;opacity:.85">${over?`⚠️ ${euro(c.total-p.budget)} boven je budget van ${euro(p.budget)}. Probeer minder avonden of een hoger budget.`:`✓ Binnen je budget van ${euro(p.budget)} (${euro(p.budget-c.total)} over)`}</div></div>
    <button class="btn green" data-act="plan2list">🛒 Zet op mijn boodschappenlijst</button>
    <h2>Boodschappen (${c.items.length})</h2>
    <div class="list">${c.items.map(it=>`<div class="item" data-open="${it.id}"><div class="emoji">${it.p.emoji}</div>
      <div class="info"><div class="name">${it.n>1?it.n+'× ':''}${esc(it.p.name)}</div><div class="meta">${it.ok?esc(it.p.st[c.sid][1]):'Niet bij '+S(c.sid).name+' (geschat)'}</div>${it.drop?`<span class="deal-tag">🔥 Prijsdaling</span>`:''}</div>
      <div class="price"><b>${euro(it.n*it.up)}</b>${it.np>it.up+0.005?`<s>${euro(it.n*it.np)}</s>`:''}</div></div>`).join('')}</div>
    <p class="demo">Het totaal is voor hele verpakkingen; wat over blijft (zoals uien of ketjap) kun je later gebruiken. Zout, olie en kruiden heb je meestal al in huis. "Normaal" = wat deze boodschappen gemiddeld kosten bij de supermarkten, zonder prijsdalingen.</p>`;
}
function doPlan(swapIndex=null){
  const f=planForm; st.planPrefs={...f};
  const c = swapIndex==null ? makePlan(f) : makePlan({...f,persons:st.plan.persons,budget:st.plan.budget,days:st.plan.ids.length}, {ids:st.plan.ids, swap:swapIndex, sid:st.plan.sid});
  if(!c) return push('Er kon geen weekmenu gemaakt worden.');
  st.plan={ids:c.ids,sid:c.sid,persons:swapIndex==null?f.persons:st.plan.persons,budget:swapIndex==null?f.budget:st.plan.budget,created:swapIndex==null?Date.now():st.plan.created};
  if(swapIndex==null && st.planPts!==WEEK){ st.planPts=WEEK; addPoints(20,'Weekmenu gemaakt'); push(`✨ Weekmenu klaar: ${euro(c.saved)} bespaard! +20 punten.`); }
  save(); render();
}

/* ---------- weekoverzicht ---------- */
function weekStats(w=WEEK){
  const b=buysWeek(w), saved=sumSaved(b);
  const [y,wn]=w.split('-W').map(Number);
  const pts=st.pointLog.filter(l=>l.d && isoWeek(new Date(l.d+'T12:00'))===w).reduce((t,l)=>t+l.n,0);
  const prevW=(()=>{ const d=new Date(); d.setDate(d.getDate()-7); return isoWeek(d); })();
  const prev=sumSaved(buysWeek(prevW));
  const goal=Math.max(10, Math.ceil((Math.max(saved,prev)*1.15+0.01)/5)*5);
  const best=[...b].sort((a,c)=>c.saved-a.saved)[0];
  return {w:wn,y,saved,deals:b.length,pts,streak:streak(),prev,goal,best};
}
function viewWeek(){
  const s=weekStats(), d=new Date(), mon=new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7)); const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  return `<button class="back" data-act="back">‹ Terug</button>
    <h2>📊 Jouw week ${s.w}</h2><p class="hint">${mon.getDate()} ${MONTHS[mon.getMonth()]} t/m ${sun.getDate()} ${MONTHS[sun.getMonth()]}</p>
    <div class="hero"><div class="lbl">💰 Deze week</div><div class="amt">${euro(s.saved)}</div><span class="trend">bespaard${s.prev?` · vorige week ${euro(s.prev)}`:''}</span></div>
    <div class="stats">
      <div class="stat"><span class="ico">🛒</span><b>${s.deals}</b><span>aanbiedingen gebruikt</span></div>
      <div class="stat"><span class="ico">⭐</span><b>+${s.pts}</b><span>punten verdiend</span></div>
      <div class="stat"><span class="ico">🔥</span><b>${s.streak}</b><span>${s.streak===1?'week':'weken'} streak</span></div>
      <div class="stat"><span class="ico">🏆</span><b>${s.best?euro(s.best.saved):'–'}</b><span>${s.best?'beste deal: '+esc(s.best.name):'nog geen deal'}</span></div>
    </div>
    <div class="verdict">🎯 Volgende week ga jij voor <b>${euro(s.goal)}</b>!</div>
    <button class="btn green" data-act="share">📤 Deel op WhatsApp</button>
    <p class="demo">Daag je vrienden uit: deel je weekscore in de groepsapp. Een echte ranglijst met vrienden komt in een volgende versie.</p>`;
}
function weekImage(){
  const s=weekStats(), c=document.createElement('canvas'), W=1080, H=1350; c.width=W; c.height=H; const g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,W,H); grd.addColorStop(0,'#0f7b4f'); grd.addColorStop(1,'#0a4f33'); g.fillStyle=grd; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.06)'; g.font='800 900px "Bricolage Grotesque", Inter, sans-serif'; g.fillText('€',560,1280);
  const T=(t,x,y,size,w='700',col='#fff',al='left')=>{ g.font=`${w} ${size}px "Bricolage Grotesque", Inter, system-ui, sans-serif`; g.fillStyle=col; g.textAlign=al; g.fillText(t,x,y); };
  T('Save',80,140,72,'800'); g.font='800 72px "Bricolage Grotesque", Inter, sans-serif'; const sw=g.measureText('Save').width; T('rr',80+sw,140,72,'800','#9ff0c4');
  T(`Week ${s.w}`,W-80,140,44,'600','rgba(255,255,255,.8)','right');
  T('💰 Deze week bespaard',80,330,46,'600','rgba(255,255,255,.85)');
  T(euro(s.saved),80,500,190,'800');
  const rows=[['🛒',`${s.deals} aanbiedingen gebruikt`],['⭐',`+${s.pts} punten`],['🔥',`${s.streak} ${s.streak===1?'week':'weken'} streak`]];
  rows.forEach((r,i)=>{ g.fillStyle='rgba(255,255,255,.12)'; roundRect(g,80,600+i*130,W-160,104,28); g.fill(); T(r[0],120,670+i*130,50,'400'); T(r[1],200,670+i*130,48,'700'); });
  g.fillStyle='#9ff0c4'; roundRect(g,80,1010,W-160,130,32); g.fill();
  T(`Volgende week ga ik voor ${euro(s.goal)}! 🎯`,W/2,1092,48,'800','#0a4f33','center');
  T('Bespaar mee met Saverr · rickosas.github.io/Saverr',W/2,1250,34,'500','rgba(255,255,255,.75)','center');
  return c;
}
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
async function shareWeek(){
  const s=weekStats(), url='https://rickosas.github.io/Saverr/';
  const text=`💰 Deze week heb ik ${euro(s.saved)} bespaard op mijn boodschappen met Saverr! 🛒 ${s.deals} aanbiedingen · 🔥 ${s.streak} weken streak. Volgende week ga ik voor ${euro(s.goal)}. Kun jij dat verslaan? ${url}`;
  try{
    await document.fonts.ready;
    const blob=await new Promise(r=>weekImage().toBlob(r,'image/png'));
    const file=new File([blob],`saverr-week-${s.w}.png`,{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file],text}); return; }
    if(navigator.share){ await navigator.share({text,url}); return; }
  }catch(e){ if(e && e.name==='AbortError') return; }
  location.href='https://wa.me/?text='+encodeURIComponent(text);
}
