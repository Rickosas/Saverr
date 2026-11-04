/* Saverr beta – alle logica van de app.
   Prijzen: open data van Checkjebon.nl (MIT), elke dag ververst door een GitHub Action.
   Jouw gegevens (favorieten, lijstje, besparingen) blijven op je eigen telefoon (localStorage). */
'use strict';

/* ================= winkels & vaste data ================= */
const STORE_INFO = {
  ah:{name:'Albert Heijn',short:'AH',color:'#00a0e2'}, jumbo:{name:'Jumbo',short:'J',color:'#e8b800'},
  lidl:{name:'Lidl',short:'L',color:'#0050aa'}, plus:{name:'PLUS',short:'P',color:'#e2001a'},
  dirk:{name:'Dirk',short:'D',color:'#d7141a'}, hoogvliet:{name:'Hoogvliet',short:'H',color:'#003f8a'},
  dekamarkt:{name:'DekaMarkt',short:'DK',color:'#e30613'}, spar:{name:'SPAR',short:'S',color:'#007a3d'},
  poiesz:{name:'Poiesz',short:'PZ',color:'#c8102e'}, vomar:{name:'Vomar',short:'V',color:'#00843d'},
  aldi:{name:'Aldi',short:'A',color:'#00205b'},
};
let STORES = [];                       // gevuld uit meta.json
const S = id => STORES.find(s=>s.id===id) || {id, name:id, short:'?', color:'#888'};
const SYN = {melk:'melk',halfvolle:'melk','volle melk':'volle-melk',yoghurt:'yoghurt',kwark:'griekse',kaas:'kaas',eieren:'eieren',ei:'eieren',
  vla:'vla',krentenbollen:'krentenbollen',beschuit:'beschuit',banaan:'bananen',bananen:'bananen',appel:'appels',appels:'appels',
  komkommer:'komkommer',tomaat:'tomaten',tomaten:'tomaten',avocado:'avocado',aardappelen:'aardappelen',aardappels:'aardappelen',
  broccoli:'broccoli',paprika:'paprika',wortel:'wortelen',wortelen:'wortelen',winterpeen:'wortelen',ui:'uien',uien:'uien',
  kip:'kipfilet',kipfilet:'kipfilet',gehakt:'gehakt',zalm:'zalm',rookworst:'rookworst',pasta:'penne',penne:'penne',spaghetti:'spaghetti',
  rijst:'rijst',pindakaas:'pindakaas',hagelslag:'hagelslag',olie:'olijfolie',olijfolie:'olijfolie',suiker:'suiker',cola:'cola',
  'cola zero':'cola-zero',sap:'jus',jus:'jus',sinaasappelsap:'jus',koffie:'koffie',water:'spa',spa:'spa',bier:'heineken',heineken:'heineken',
  redbull:'redbull','red bull':'redbull',chips:'chips',friet:'friet',patat:'friet',wc:'wc-papier','wc-papier':'wc-papier',
  toiletpapier:'wc-papier',afwasmiddel:'afwasmiddel',tandpasta:'tandpasta'};
const MONTHS = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const DAYS = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const REWARDS = [{pts:100,eur:1},{pts:500,eur:5},{pts:1000,eur:10}];
const EARN = [['🏷️','Aanbieding gebruiken (Gekocht)','+10'],['🛒','Boodschappenlijst vergelijken','+20 per week'],
  ['🤖','Weekmenu laten maken','+20 per week'],['🎯','Challenges voltooien','+100 tot +500'],['📅','Elke week actief zijn','+50 per week'],['👋','Vrienden uitnodigen','binnenkort']];

/* ================= opslag op je telefoon ================= */
const KEY = 'saverr_beta_v1';
const DEFAULT = {favs:['melk','bananen','kipfilet','hagelslag','koffie','redbull','cola'], cfavs:{}, targets:{}, list:'Melk, kip, rijst, cola, bananen',
  myStores:['ah','jumbo','lidl','dirk'], purchases:[], points:0, pointLog:[], claimed:{}, listPts:'', activeWeeks:[], seen:[], since:null, notif:false};
let st;
try { st = Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY)||'{}')); } catch(e){ st = {...DEFAULT}; }
if(!st.since) st.since = new Date().toISOString().slice(0,10);
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} };

/* ================= helpers ================= */
const $ = s=>document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro = n => '€'+(Math.round(n*100)/100).toFixed(2).replace('.',',');
const pct = (now,was) => Math.round((1-now/was)*100);
const fmtDate = iso => { const d=new Date(iso+'T12:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
function isoWeek(d=new Date()){ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day);
  const y=new Date(Date.UTC(t.getUTCFullYear(),0,1)); return t.getUTCFullYear()+'-W'+String(Math.ceil(((t-y)/864e5+1)/7)).padStart(2,'0'); }
const WEEK = isoWeek(), weekNr = +WEEK.split('W')[1];
const today = new Date();

/* ================= data ================= */
let META=null, PRODUCTS=[], DROPS=[], catalog=null, catalogLoading=false, CMP_STORES=[];
const P = id => PRODUCTS.find(p=>p.id===id);
const has = (p,sid) => p.st[sid]!=null;
const price = (p,sid) => p.st[sid][0];
const was = (p,sid) => p.st[sid][4] || 0;
// aanbieding: [label, min. aantal, prijs per stuk bij dat aantal, geldig t/m]
const okPromo = pr => pr && !(st.lidlPlus===false && /^Lidl Plus/.test(pr[0])) ? pr : null;   // Lidl Plus-prijzen alleen als je de app hebt
const promo = (p,sid) => okPromo(p.st[sid] && p.st[sid][5]);
const unitEff = (p,sid) => { const pr=promo(p,sid); return pr ? pr[2] : price(p,sid); };   // beste prijs per stuk
const regOf = (p,sid) => Math.max(price(p,sid), was(p,sid));                                   // 'normale' prijs bij die winkel
/* wat kost n stuks, rekening houdend met 1+1 gratis, 2 voor €x, enz. */
function costN(reg, pr, n){
  if(!pr) return n*reg;
  const [,m,u]=pr, sets=Math.floor(n/m), rest=n%m;
  let c=sets*m*u + rest*reg;
  if(rest && (sets+1)*m*u <= c+0.001) c=(sets+1)*m*u;   // een extra pak is niet duurder → gratis erbij
  return c;
}
const costAt = (p,sid,n) => costN(price(p,sid), promo(p,sid), n);
const untilTxt = t => t ? ' · t/m '+fmtDate(t) : '';
const promoTxt = pr => pr[1]>1 ? `${pr[0]} (${euro(pr[2])} p.st. bij ${pr[1]})` : pr[0];
const median = p => { const v=Object.values(p.st).map(x=>x[0]).sort((a,b)=>a-b); return v[Math.floor((v.length-1)/2)]; };
const cheapest = p => Object.entries(p.st).sort((a,b)=>unitEff(p,a[0])-unitEff(p,b[0]))[0];
const pDeals = p => Object.keys(p.st).filter(sid=>was(p,sid)||promo(p,sid))
  .map(sid=>({sid,price:unitEff(p,sid),was:regOf(p,sid),label:promo(p,sid)?promo(p,sid)[0]:'Prijsdaling',promo:promo(p,sid)})).sort((a,b)=>a.price-b.price);
// catalogusregel: deal-info
const rowPromo = r => okPromo(r[6]);
/* ---------- productfoto's ---------- */
const AH_IMG = c => `https://static.ah.nl/dam/product/${c}?revLabel=1&rendition=200x200_JPG&fileType=binary`;
const POIESZ_IMG = id => `https://images.poiesz-supermarkten.nl/artikelen/${id}.png?width=200`;
function imgSrc(sid, v, link){
  if(sid==='poiesz' && (v==='P' || /^\d+$/.test(String(v)))) return POIESZ_IMG(/^\d+$/.test(String(v)) ? v : String(link||'').split('/').pop());
  if(!v || v==='P') return '';
  v=String(v);
  if(v.startsWith('AHI_')) return AH_IMG(v);
  if(/web-fileserver\.(dirk|dekamarkt)\.nl/.test(v)) return v.split('?')[0]+'?width=200';   // kleine versie (origineel is soms 2 MB)
  return v;
}
// foto van het product bij één bepaalde winkel (nooit de foto van een andere winkel)
const storeImg = (p,sid) => (p && p.st[sid] && p.st[sid][6]) ? imgSrc(sid, p.st[sid][6], p.st[sid][3]) : '';
const badge = sid => '<span class="sb" style="background:'+S(sid).color+'">'+S(sid).short+'</span>';
const picStore = (src, fallback, sid) => pic(src, fallback).replace(/<\/div>$/, badge(sid)+'</div>');
const rowImg = (r,src) => imgSrc(rowStore(r,src), r[7], r[4]);
/* plaatje met emoji als terugval als de foto niet laadt */
const pic = (src, fallback, extra='') => `<div class="emoji pic" ${extra}>${fallback}${src?`<img src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`:''}</div>`;
const liveDrops = () => DROPS.filter(r=>rowPromo(r)||r[5]);   // zonder Lidl Plus-deals als je die app niet hebt
const rowNow = r => rowPromo(r) ? rowPromo(r)[2] : r[2];
const rowWas = r => rowPromo(r) ? Math.max(r[2], r[5]||0) : r[5];
// catalogusregel: [winkelIndex, naam, prijs, verpakking, link, oudePrijs]
const rowKey = r => r[0]+'|'+r[4];
const rowStore = (r,src) => (src||catalog||DROPS_SRC).stores[r[0]];
let DROPS_SRC = null;
const rowUrl = (r,src) => (src||catalog||DROPS_SRC).urls[r[0]] + r[4];
const cKey = (sid,link) => 'c:'+sid+'|'+link;

async function loadData(){
  const get = f => fetch('data/'+f, {cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(f); return r.json(); });
  const [m,p,d] = await Promise.all([get('meta.json'),get('products.json'),get('drops.json')]);
  META=m; PRODUCTS=p.products; DROPS_SRC=d; DROPS=d.rows;
  STORES = m.stores.map(id=>({id,...STORE_INFO[id]}));
  CMP_STORES = STORES.filter(s=>PRODUCTS.some(p=>has(p,s.id)));   // winkels met gewone prijzen (Aldi alleen aanbiedingen)
  st.myStores = st.myStores.filter(id=>m.stores.includes(id));
}
function loadCatalog(){
  if(catalog||catalogLoading) return; catalogLoading=true;
  fetch('data/catalog.json.gz').then(r=>r.body.pipeThrough(new DecompressionStream('gzip'))).then(s=>new Response(s).text())
    .then(t=>{ catalog=JSON.parse(t); catalog.rows.forEach(r=>{ while(r.length<8) r.push(0); r.push(r[1].toLowerCase()); }); catalogLoading=false; refreshCatalogFavs(); render(); })
    .catch(()=>{ catalog={error:true,rows:[],stores:[],urls:[]}; catalogLoading=false; render(); });
}
// actuele prijs van losse favorieten uit het assortiment
function refreshCatalogFavs(){
  if(!catalog||catalog.error) return;
  const idx = {}; catalog.rows.forEach(r=>{ idx[catalog.stores[r[0]]+'|'+r[4]] = r; });
  Object.entries(st.cfavs).forEach(([k,f])=>{ const r=idx[f.sid+'|'+f.link]; if(r){ f.price=rowNow(r); f.was=rowWas(r)||0; f.promo=rowPromo(r); f.name=r[1]; f.size=r[3]; f.img=r[7]||0; } else f.gone=true; });
  save(); buildAlerts(); notifyNew();
}

/* ================= meldingen ================= */
let alerts = [];
function buildAlerts(){
  alerts = [];
  st.favs.forEach(pid=>{
    const p=P(pid); if(!p) return; const t=st.targets[pid];
    Object.keys(p.st).forEach(sid=>{
      const now=unitEff(p,sid), pr=promo(p,sid), deal = was(p,sid)>0 || !!pr;
      if(t!=null ? now<=t : deal) alerts.push({key:`${pid}|${sid}|${now}`, pid, sid, name:p.name, emoji:p.emoji, price:now, was:regOf(p,sid)>now?regOf(p,sid):0, target:t, label:pr?pr[0]:''});
    });
  });
  Object.entries(st.cfavs).forEach(([k,f])=>{
    if(f.price==null || f.gone) return; const t=st.targets[k];
    if(t!=null ? f.price<=t : f.was>f.price) alerts.push({key:`${k}|${f.price}`, ck:k, sid:f.sid, name:f.name, emoji:'🛍️', price:f.price, was:f.was, target:t, label:f.promo?f.promo[0]:''});
  });
  alerts.sort((a,b)=>(b.was?b.was-b.price:0)-(a.was?a.was-a.price:0));
}
const alertText = a => a.target!=null ? `🔥 ${a.name} is nu ${euro(a.price)} bij ${S(a.sid).name}: onder je gewenste prijs van ${euro(a.target)}!`
  : a.label ? `🔥 ${a.name} is in de aanbieding bij ${S(a.sid).name}: ${a.label}!` : `🔥 ${a.name} is goedkoper bij ${S(a.sid).name}: ${euro(a.price)} (was ${euro(a.was)})`;
const unread = () => alerts.filter(a=>!st.seen.includes(a.key));
async function notifyNew(){
  const fresh = alerts.filter(a=>!st.seen.includes(a.key) && !(st.notified||[]).includes(a.key));
  if(!fresh.length) return;
  st.notified = [...(st.notified||[]), ...fresh.map(a=>a.key)].slice(-300); save();
  const body = fresh.length===1 ? alertText(fresh[0]) : `${fresh.length} van je favorieten zijn goedkoper. O.a. ${fresh[0].name} bij ${S(fresh[0].sid).name}.`;
  push(body, fresh[0]);
  if(st.notif && 'Notification' in window && Notification.permission==='granted'){
    try{ const reg = await navigator.serviceWorker?.ready; (reg ? reg.showNotification('Saverr', {body, icon:'icons/icon-192.png', badge:'icons/icon-192.png', tag:'saverr-deals'})
      : new Notification('Saverr',{body,icon:'icons/icon-192.png'})); }catch(e){}
  }
}
async function enableNotifications(){
  if(!('Notification' in window)) return push(isIOS() && !isStandalone() ? 'Op iPhone werken meldingen pas als je Saverr eerst op je beginscherm zet.' : 'Je browser ondersteunt geen meldingen.');
  const r = await Notification.requestPermission();
  st.notif = r==='granted'; save(); render();
  push(st.notif ? '🔔 Meldingen staan aan. Je hoort het als een favoriet goedkoper wordt.' : 'Meldingen zijn niet toegestaan. Je kunt dit later in de instellingen van je telefoon aanzetten.');
}

/* ================= besparingen & punten ================= */
const weekOf = iso => isoWeek(new Date(iso+'T12:00'));
const sumSaved = arr => arr.reduce((t,x)=>t+x.saved,0);
const buysWeek = (w=WEEK) => st.purchases.filter(x=>weekOf(x.date)===w);
const monthKey = new Date().toISOString().slice(0,7);
function addPoints(n,t){ st.points+=n; st.pointLog.unshift({t,n,d:new Date().toISOString().slice(0,10)}); st.pointLog=st.pointLog.slice(0,60); save(); }
function markBought(o){ // o: {key,name,sid,price,was,cat}
  if(isBought(o.key)) return;
  const saved = Math.round((o.was-o.price)*(o.qty||1)*100)/100;
  st.purchases.unshift({key:o.key,name:o.name,sid:o.sid,saved,pct:1-o.price/o.was,cat:o.cat||'',date:new Date().toISOString().slice(0,10)});
  addPoints(10,'Prijsdaling gebruikt: '+o.name);
  push(`💚 Je bespaarde ${euro(saved)} op ${o.name}. +10 punten!`);
}
const isBought = key => buysWeek().some(x=>x.key===key);
if(!st.activeWeeks.includes(WEEK)){ if(st.activeWeeks.length) addPoints(50,`Actief in week ${weekNr}`); st.activeWeeks.push(WEEK); st.activeWeeks=st.activeWeeks.slice(-30); save(); }
function streak(){ let n=0; const d=new Date(); for(let i=0;i<60;i++){ const w=isoWeek(d); if(st.purchases.some(x=>weekOf(x.date)===w)) n++; else if(i>0) break; d.setDate(d.getDate()-7);} return n; }

function challenges(){
  const b=buysWeek(), cl=st.claimed[WEEK]||[];
  return [
    {id:'c1',ic:'🎯',t:'7 dagen boodschappen besparen',d:'Gebruik deze week minimaal 5 prijsdalingen.',pts:500,cur:b.length,goal:5},
    {id:'c2',ic:'🥦',t:'Groene week',d:'Koop deze week 5 producten uit groente & fruit met korting.',pts:300,cur:b.filter(x=>x.cat==='Groente & fruit').length,goal:5},
    {id:'c3',ic:'🔔',t:'Prijsjager',d:'Stel voor 3 producten een prijsalarm in.',pts:150,cur:Object.keys(st.targets).length,goal:3},
    {id:'c4',ic:'⭐',t:'Ken je klassiekers',d:'Zet minimaal 8 producten in je favorieten.',pts:100,cur:st.favs.length+Object.keys(st.cfavs).length,goal:8},
    {id:'c5',ic:'🛒',t:'Slim plannen',d:'Vergelijk deze week je boodschappenlijstje.',pts:100,cur:st.listPts===WEEK?1:0,goal:1},
  ].map(c=>({...c,cur:Math.min(c.cur,c.goal),done:c.cur>=c.goal,claimed:cl.includes(c.id)}));
}

/* ================= lijstje ================= */
function parseList(){
  const found=[], missing=[];
  st.list.split(/[,\n]/).map(t=>t.trim()).filter(Boolean).forEach(raw=>{
    const m=raw.match(/^(\d+)\s*[x×]\s*(.+)$/i), qty=m?+m[1]:1, t=m?m[2].trim():raw;
    const k=t.toLowerCase(); let id=SYN[k]||SYN[k.replace(/(en|s)$/,'')];
    if(!id){ const m=PRODUCTS.find(p=>p.name.toLowerCase().includes(k)); id=m&&m.id; }
    if(id&&P(id)){ const ex=found.find(f=>f.p.id===id); ex?ex.qty+=qty:found.push({term:t,p:P(id),qty}); } else missing.push(t);
  });
  return {found,missing};
}
function compareList(onlyMine){
  const {found}=parseList();
  return CMP_STORES.filter(s=>!onlyMine||st.myStores.includes(s.id)).map(s=>({s,
    total:found.reduce((t,f)=>t+(has(f.p,s.id)?costAt(f.p,s.id,f.qty):f.qty*median(f.p)),0),
    missing:found.filter(f=>!has(f.p,s.id)).length, drops:found.filter(f=>has(f.p,s.id)&&(was(f.p,s.id)||promo(f.p,s.id))).length}))
    .sort((a,b)=>(a.missing-b.missing)||(a.total-b.total));
}

/* ================= UI-state ================= */
let tab='home', sub=null, cat='Alles', query='', bmode='cmp', listAll=false, listShown=false, dropFilter='mine';
let deferredInstall=null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/* ================= views ================= */
const SRC = () => `<div class="srcnote">💶 Prijzen van ${STORES.length} supermarkten via <a href="https://www.checkjebon.nl" target="_blank" rel="noopener">Checkjebon.nl</a> (stand ${fmtDate(META.updated)}). 🏷️ Aanbiedingen: AH-bonus, Jumbo, Dirk, DekaMarkt, Poiesz, Lidl en Aldi${META.promos_updated?' van '+fmtDate(META.promos_updated):''}, plus prijsdalingen. Alles wordt elke ochtend bijgewerkt.</div>`;

function itemHTML(p){
  const [sid]=cheapest(p), d=pDeals(p), t=st.targets[p.id], now=unitEff(p,sid), reg=regOf(p,sid);
  return `<div class="item" data-open="${p.id}">${picStore(storeImg(p,sid),p.emoji,sid)}
    <div class="info"><div class="name">${esc(p.name)}</div><div class="meta">Goedkoopst bij ${S(sid).name}</div>
      ${d.length?`<span class="deal-tag">🏷️ ${d.length===1?esc(d[0].label)+' bij '+S(d[0].sid).name:'Aanbieding bij '+d.length+' winkels'}</span> `:''}${t!=null?`<span class="alarm-tag">🔔 ≤ ${euro(t)}</span>`:''}</div>
    <div class="price"><b>${euro(now)}</b>${reg>now+0.005?`<s>${euro(reg)}</s>`:''}</div>
    <button class="fav ${st.favs.includes(p.id)?'on':''}" data-fav="${p.id}" aria-label="Favoriet">★</button></div>`;
}
function rowHTML(r,src){
  const sid=rowStore(r,src), s=S(sid), k=cKey(sid,r[4]);
  return `<div class="cat-row" data-row="${esc(sid)}|${esc(r[4])}">${pic(rowImg(r,src),'🛍️').replace('</div>','<span class="sb" style="background:'+s.color+'">'+s.short+'</span></div>')}
    <div class="info"><div class="name">${esc(r[1])}</div><div class="meta">${s.name}${r[3]?' · '+esc(r[3]):''}</div>${rowPromo(r)?`<span class="deal-tag">🏷️ ${esc(rowPromo(r)[0])}</span>`:r[5]?`<span class="deal-tag">−${pct(r[2],r[5])}%</span>`:''}</div>
    <div class="price"><b>${euro(rowNow(r))}</b>${rowWas(r)>rowNow(r)?`<s>${euro(rowWas(r))}</s>`:''}</div>
    <button class="fav sm ${st.cfavs[k]?'on':''}" data-cfav="${esc(sid)}|${esc(r[4])}" aria-label="Favoriet">★</button></div>`;
}
const SIM_NONE = '';

function dealOfDay(){
  const pool = liveDrops().filter(r=>rowNow(r)>=0.5 && (rowPromo(r)?rowPromo(r)[1]===1:true)).slice(0,25); if(!pool.length) return null;
  const day = Math.floor(Date.now()/864e5); return pool[day % pool.length];
}
function bestFavDeal(){
  let best=null;
  st.favs.forEach(pid=>{ const p=P(pid); if(!p) return; pDeals(p).forEach(d=>{ if(d.was<=d.price) return; const sc=(1-d.price/d.was)*100+(d.was-d.price); if(!best||sc>best.sc) best={sc,p,d}; }); });
  return best;
}

function viewHome(){
  const ws=sumSaved(buysWeek());
  const weeks=[]; const d=new Date(); for(let i=5;i>=0;i--){ const x=new Date(d); x.setDate(d.getDate()-7*i); weeks.push(isoWeek(x)); }
  const hist=weeks.map(w=>({w:+w.split('W')[1],v:sumSaved(buysWeek(w)),cur:w===WEEK})), max=Math.max(...hist.map(h=>h.v),1);
  const month=sumSaved(st.purchases.filter(x=>x.date.startsWith(monthKey))), total=sumSaved(st.purchases);
  const dd=dealOfDay(), bd=bestFavDeal(), chs=challenges().filter(c=>!c.claimed).slice(0,2);
  const mine = liveDrops().filter(r=>st.myStores.includes(rowStore(r,DROPS_SRC))).slice(0,5);
  return `${installBanner()}
    <p class="hello">${['Goedenacht','Goedemorgen','Goedemiddag','Goedenavond'][Math.floor(today.getHours()/6)]}! Zo staat je spaarpot ervoor 👇</p>
    <button class="aicta" data-sub="planner"><span class="i">🤖</span><span style="flex:1;text-align:left"><b>Help mij besparen</b><small>${st.plan?'Bekijk je weekmenu':'Maak een weekmenu binnen je budget'}</small></span><span style="font-size:20px">›</span></button>
    <div class="hero" data-sub="week" style="cursor:pointer"><div class="lbl">Deze week bespaard</div><div class="amt">${euro(ws)}</div>
      <span class="trend">${buysWeek().length} prijsdalingen gebruikt · weekoverzicht ›</span>
      <div class="bars">${hist.map(h=>`<div class="${h.cur?'cur':''}"><i style="height:${Math.max(4,h.v/max*48)}px"></i><span>wk ${h.w}</span></div>`).join('')}</div></div>
    <div class="stats">
      <div class="stat"><span class="ico">📅</span><b>${euro(month)}</b><span>bespaard in ${MONTHS[today.getMonth()]}</span></div>
      <div class="stat"><span class="ico">🔥</span><b>${streak()}</b><span>weken op rij bespaard</span></div>
      <div class="stat wide"><div><span class="ico">🏆</span><b>${euro(total)}</b><span>totaal bespaard sinds ${fmtDate(st.since)}</span></div>
        <div style="text-align:right"><b style="font-size:18px">${st.purchases.length}</b><span>deals<br>gebruikt</span></div></div></div>
    ${!st.purchases.length?`<div class="tip"><span class="i">💡</span><div>Zie je een prijsdaling en koop je hem? Tik op <b>Gekocht</b>, dan houdt Saverr bij hoeveel je bespaart.</div></div>`:''}
    ${dd?(()=>{const sid=rowStore(dd,DROPS_SRC); return `<h2>Deal van de dag</h2>
    <div class="dotd"><div class="badge">-${pct(rowNow(dd),rowWas(dd))}%</div>
      <div class="k">🔥 DEAL VAN DE DAG</div><div class="d">${DAYS[today.getDay()]} ${today.getDate()} ${MONTHS[today.getMonth()]}</div>
      <div class="body">${pic(rowImg(dd,DROPS_SRC),'🛍️')}<div><div class="pn">${esc(dd[1])}</div>
        <div class="pp"><s>${euro(rowWas(dd))}</s> → <b>${euro(rowNow(dd))}</b></div>
        <div style="font-size:13px;margin-top:2px">${S(sid).name}${rowPromo(dd)?' · '+esc(rowPromo(dd)[0])+untilTxt(rowPromo(dd)[3]):dd[3]?' · '+esc(dd[3]):''}</div></div></div>
      <button class="btn" data-row="${esc(sid)}|${esc(dd[4])}">Naar aanbieding →</button></div>`})():''}
    <h2>Beste deal op je favorieten</h2>
    ${bd?`<div class="bestdeal" data-open="${bd.p.id}">${picStore(storeImg(bd.p,bd.d.sid),bd.p.emoji,bd.d.sid)}
      <div class="info"><div class="k">⭐ Op jouw favoriet</div><div class="name">${esc(bd.p.name)}</div>
        <span class="store-pill" style="background:${S(bd.d.sid).color}">${S(bd.d.sid).name}</span> <span class="deal-tag">${esc(bd.d.label)}</span></div>
      <div class="pct">-${pct(bd.d.price,bd.d.was)}%<small>${euro(bd.d.price)} <s>${euro(bd.d.was)}</s></small></div></div>`
      :`<div class="empty" style="padding:16px">Geen van je favorieten is nu in de aanbieding. Je krijgt een melding zodra dat verandert.</div>`}
    <div class="linkrow"><h2>Aanbiedingen bij jouw winkels</h2><a data-bmode="drops">Alles ›</a></div>
    <div class="list">${mine.map(r=>rowHTML(r,DROPS_SRC)).join('')||'<div class="empty" style="padding:16px">Nu geen aanbiedingen bij je winkels.</div>'}</div>
    <div class="linkrow"><h2>Challenges</h2><a data-go="challenges">Alles ›</a></div>
    ${chs.map(chHTML).join('')||'<div class="empty">Alle challenges van deze week gehaald! 🎉</div>'}
    ${buysWeek().length?`<h2>Gebruikt deze week</h2><div class="list">${buysWeek().map(x=>`<div class="item static"><div class="emoji">🧾</div><div class="info"><div class="name">${esc(x.name)}</div><div class="meta">${S(x.sid).name} · ${fmtDate(x.date)}</div></div><div class="price"><b style="color:var(--green)">+${euro(x.saved)}</b></div></div>`).join('')}</div>`:''}
    ${SRC()}`;
}

function viewBrowse(){
  const seg=`<div class="seg"><button class="${bmode==='cmp'?'on':''}" data-bmode="cmp">⚖️ Vergeleken</button><button class="${bmode==='drops'?'on':''}" data-bmode="drops">🔥 Aanbiedingen</button><button class="${bmode==='all'?'on':''}" data-bmode="all">🗂️ Alles</button></div>`;
  if(bmode==='all') return seg+viewCatalog();
  if(bmode==='drops'){
    let rows=liveDrops().filter(r=>(dropFilter==='all'||st.myStores.includes(rowStore(r,DROPS_SRC))) && (!query||r[1].toLowerCase().includes(query)));
    return seg+`<div class="chips"><button class="chip ${dropFilter==='mine'?'on':''}" data-dropf="mine">📍 Mijn winkels</button><button class="chip ${dropFilter==='all'?'on':''}" data-dropf="all">Alle supermarkten</button></div>
      <p class="hint">${rows.length} aanbiedingen van ${new Set(rows.map(r=>r[0])).size} supermarkten, plus prijsdalingen (minstens 10% goedkoper dan de afgelopen 4 weken).</p>
      <div class="list">${rows.slice(0,120).map(r=>rowHTML(r,DROPS_SRC)).join('')||'<div class="empty">Geen prijsdalingen gevonden.</div>'}</div>${SRC()}`;
  }
  const cats=['Alles','🔥 Aanbiedingen',...new Set(PRODUCTS.map(p=>p.cat))];
  const list=PRODUCTS.filter(p=>(cat==='Alles'||(cat==='🔥 Aanbiedingen'?pDeals(p).length:p.cat===cat))&&p.name.toLowerCase().includes(query));
  return seg+`<div class="chips">${cats.map(c=>`<button class="chip ${c===cat?'on':''}" data-cat="${c}">${c}</button>`).join('')}</div>
    <p class="hint">${list.length} veelgekochte producten, per supermarkt aan elkaar gekoppeld.</p>
    <div class="list">${list.map(itemHTML).join('')||`<div class="empty">Niet bij de vergeleken producten.<br><button class="btn sm green" data-bmode="all" style="margin-top:10px">Zoek in het hele assortiment</button></div>`}</div>${SRC()}`;
}
function viewCatalog(){
  if(!catalog){ loadCatalog(); return `<div class="empty"><div class="big">⏳</div>Hele assortiment laden…<br><span style="font-size:12px">±${(META.catalog/1000).toFixed(0)}.000 producten (eenmalig ±2 MB)</span></div>`; }
  if(catalog.error) return '<div class="empty">Het assortiment kon niet geladen worden. Heb je internet?</div>';
  const terms=query.split(/\s+/).filter(Boolean);
  if(query.length<2) return `<p class="hint">${catalog.rows.length.toLocaleString('nl-NL')} producten van ${STORES.length} supermarkten. Typ bovenin wat je zoekt, bijvoorbeeld <b>pindakaas</b> of <b>oreo</b>. Tik op ★ om een product te volgen.</p>${SRC()}`;
  const res=catalog.rows.filter(r=>terms.every(t=>r[8].includes(t))).sort((a,b)=>rowNow(a)-rowNow(b));
  return `<p class="hint">${res.length.toLocaleString('nl-NL')} resultaten voor “${esc(query)}”, goedkoopste eerst${res.length>80?' (eerste 80)':''}</p>
    <div class="list">${res.slice(0,80).map(r=>rowHTML(r)).join('')||'<div class="empty">Niets gevonden.</div>'}</div>`;
}

function viewFavs(){
  const list=PRODUCTS.filter(p=>st.favs.includes(p.id)&&p.name.toLowerCase().includes(query));
  const cf=Object.entries(st.cfavs).filter(([,f])=>f.name.toLowerCase().includes(query));
  if(!list.length&&!cf.length) return `<div class="empty"><div class="big">⭐</div>Nog geen favorieten.<br>Tik op de ster bij producten die je vaak koopt. Saverr houdt de prijzen dan voor je in de gaten.</div>`;
  const onDeal=list.filter(p=>alerts.some(a=>a.pid===p.id));
  return `<div class="stats"><div class="stat hl"><b>${alerts.length}</b><span>meldingen op je favorieten</span></div>
      <div class="stat"><b>${list.length+cf.length}</b><span>producten die je volgt</span></div></div>
    <p class="hint">Tik op een product om een <b>prijsalarm</b> in te stellen: dan krijg je alleen een melding als jouw gewenste prijs bereikt is.</p>
    ${list.length?`<h2>Vergeleken producten</h2><div class="list">${[...onDeal,...list.filter(p=>!onDeal.includes(p))].map(itemHTML).join('')}</div>`:''}
    ${cf.length?`<h2>Losse producten</h2><div class="list">${cf.map(([k,f])=>`<div class="cat-row" data-row="${esc(f.sid)}|${esc(f.link)}">${pic(imgSrc(f.sid,f.img,f.link),'🛍️').replace('</div>','<span class="sb" style="background:'+S(f.sid).color+'">'+S(f.sid).short+'</span></div>')}
      <div class="info"><div class="name">${esc(f.name)}</div><div class="meta">${S(f.sid).name}${f.size?' · '+esc(f.size):''}${f.gone?' · niet meer gevonden':''}</div>${f.promo?`<span class="deal-tag">🏷️ ${esc(f.promo[0])}</span> `:f.was>f.price?`<span class="deal-tag">−${pct(f.price,f.was)}%</span> `:''}${st.targets[k]!=null?`<span class="alarm-tag">🔔 ≤ ${euro(st.targets[k])}</span>`:''}</div>
      <div class="price"><b>${f.price!=null?euro(f.price):'…'}</b>${f.was?`<s>${euro(f.was)}</s>`:''}</div>
      <button class="fav sm on" data-cfav="${esc(f.sid)}|${esc(f.link)}">★</button></div>`).join('')}</div>`:''}`;
}

function viewList(){
  const {found,missing}=parseList(), rows=compareList(!listAll), win=rows[0];
  const same=rows.filter(r=>win&&r.missing===win.missing), worst=same[same.length-1];
  return `<h2>Boodschappenlijstje</h2><p class="hint">Typ je boodschappen, gescheiden door komma's. Saverr rekent uit waar je het goedkoopst uit bent.</p>
    <textarea id="listIn" rows="3" placeholder="Melk, kip, rijst, cola, bananen">${esc(st.list)}</textarea>
    <button class="btn green" data-act="compare" style="margin-top:8px">Vergelijk prijzen</button>
    ${missing.length?`<div class="miss">Niet gevonden bij de vergeleken producten: ${esc(missing.join(', '))}. <a data-bmode="all" data-q="${esc(missing[0])}" style="font-weight:600;cursor:pointer">Zoek in assortiment ›</a></div>`:''}
    ${found.length&&listShown&&win?`
      <div class="chips" style="margin-top:14px"><button class="chip ${!listAll?'on':''}" data-act="mine">📍 Mijn winkels (${st.myStores.length})</button><button class="chip ${listAll?'on':''}" data-act="all">Alle supermarkten (${STORES.length})</button></div>
      ${rows.map((r,i)=>`<div class="cmp ${i===0?'win':''}"><span class="dotc" style="background:${r.s.color}"></span>
        <div class="n">${r.s.name}${i===0?'<span class="best-label">GOEDKOOPST</span>':''}<em>${found.length-r.missing}/${found.length} producten${r.drops?` · ${r.drops} in de aanbieding`:''}${r.missing?` · <span style="color:var(--deal)">${r.missing} geschat</span>`:''}</em></div>
        <div class="v">${euro(r.total)}</div></div>`).join('')}
      ${same.length>1?`<div class="verdict">Je bespaart <b>${euro(worst.total-win.total)}</b> door deze producten bij <b>${win.s.name}</b> te kopen.</div>`:''}
      <h2>Jouw lijstje bij ${win.s.name}</h2>
      <div class="list">${found.map(f=>{const ok=has(f.p,win.s.id), pr=ok&&promo(f.p,win.s.id), cst=ok?costAt(f.p,win.s.id,f.qty):0, reg=ok?f.qty*regOf(f.p,win.s.id):0;return `<div class="item" data-open="${f.p.id}">${ok?picStore(storeImg(f.p,win.s.id),f.p.emoji,win.s.id):pic('',f.p.emoji)}
        <div class="info"><div class="name">${f.qty>1?f.qty+'× ':''}${esc(f.p.name)}</div><div class="meta">${ok?esc(f.p.st[win.s.id][1]):'Niet gevonden bij '+win.s.name}</div>${pr?`<span class="deal-tag">🏷️ ${esc(pr[0])}${f.qty<pr[1]?' (koop er '+pr[1]+')':''}</span>`:ok&&was(f.p,win.s.id)?`<span class="deal-tag">🔥 Prijsdaling</span>`:''}</div>
        <div class="price"><b>${ok?euro(cst):'–'}</b>${ok&&reg>cst+0.005?`<s>${euro(reg)}</s>`:''}</div></div>`}).join('')}</div>`
    : found.length?'':'<div class="empty">Voeg producten toe om te vergelijken.</div>'}`;
}

function viewAlerts(){
  return `<h2>Meldingen</h2><p class="hint">Prijsdalingen en prijsalarmen op jouw favorieten.</p>
    ${!st.notif?`<div class="tip"><span class="i">🔔</span><div><b>Zet meldingen aan</b> om het direct te horen.<br><button class="btn sm green" data-act="notif" style="margin-top:8px">Meldingen aanzetten</button></div></div>`:''}
    <div class="list">${alerts.map(a=>`<div class="alert ${st.seen.includes(a.key)?'read':''}" ${a.pid?`data-open="${a.pid}"`:`data-row="${esc(a.ck.slice(2))}"`}>${picStore(a.pid?storeImg(P(a.pid),a.sid):(st.cfavs[a.ck]?imgSrc(a.sid,st.cfavs[a.ck].img,st.cfavs[a.ck].link):""),a.emoji,a.sid)}
      <div class="info"><div class="name">${esc(a.name)}</div><span class="store-pill" style="background:${S(a.sid).color}">${S(a.sid).name}</span>
        ${a.target!=null?` <span class="alarm-tag">🔔 ≤ ${euro(a.target)}</span>`:` <span class="deal-tag">${a.label?'🏷️ '+esc(a.label):'−'+pct(a.price,a.was)+'%'}</span>`}</div>
      <div class="price"><b>${euro(a.price)}</b>${a.was?`<s>${euro(a.was)}</s>`:''}</div></div>`).join('')
      ||'<div class="empty"><div class="big">🔕</div>Nu geen prijsdalingen op je favorieten.</div>'}</div>`;
}

function installBanner(){
  if(isStandalone()) return '';
  if(deferredInstall) return `<div class="install"><span class="i">📲</span><div style="flex:1"><b>Installeer Saverr</b><p>Zet de app op je beginscherm voor snelle toegang en meldingen.</p></div><button class="btn sm green" data-act="install">Installeer</button></div>`;
  if(isIOS()) return `<div class="install"><span class="i">📲</span><div><b>Zet Saverr op je beginscherm</b><p>Tik onderin Safari op <b>Deel</b> (□↑) en kies <b>"Zet op beginscherm"</b>. Daarna werken ook meldingen.</p></div></div>`;
  if(/android/i.test(navigator.userAgent)) return `<div class="install"><span class="i">📲</span><div><b>Installeer Saverr</b><p>Open het menu (⋮) in Chrome en kies <b>"App installeren"</b> of <b>"Toevoegen aan startscherm"</b>.</p></div></div>`;
  return '';
}

function viewMore(){
  const tiles=[['challenges','🎯','Challenges',`${challenges().filter(c=>!c.claimed).length} actief`],['rewards','🎁','Punten',`⚡${st.points}`],
    ['stores','📍','Mijn winkels',st.myStores.map(id=>S(id).name).join(', ')||'Kies je winkels'],['settings','⚙️','Instellingen','Meldingen, gegevens']];
  const soon=[['🏆','Ranglijst met vrienden'],['🧾','Bonnetje scannen'],['💡','Wat kan ik besparen?']];
  return `${installBanner()}<div class="profile"><div class="avatar">🧑</div><div style="flex:1"><b style="font-size:16px">Jouw Saverr</b>
      <div class="meta">Gebruiker sinds ${fmtDate(st.since)} · 🔥 ${streak()} weken streak</div></div>
      <div style="text-align:right"><b style="font-family:'Bricolage Grotesque';font-size:20px;color:#5b3fd1">⚡${st.points}</b><div class="meta">punten</div></div></div>
    <div class="tiles">${tiles.map(t=>`<button class="tile" data-go="${t[0]}"><span class="i">${t[1]}</span><b>${t[2]}</b><span>${esc(t[3])}</span></button>`).join('')}</div>
    <h2>Binnenkort</h2><div class="tiles">${soon.map(t=>`<div class="tile dim"><span class="i">${t[0]}</span><b>${t[1]}</b><span>In een volgende beta</span></div>`).join('')}</div>
    <p class="demo" style="margin-top:16px">Saverr beta · prijzen ${fmtDate(META.updated)} · ${META.catalog.toLocaleString('nl-NL')} producten</p>`;
}
const backBtn='<button class="back" data-act="back">‹ Terug</button>';
function chHTML(c){
  return `<div class="ch ${c.done?'done':''} ${c.claimed?'claimed':''}"><div class="t"><b>${c.ic} ${c.t}</b><span class="pts">+${c.pts}</span></div>
    <p>${c.d}</p><div class="prog"><i style="width:${c.cur/c.goal*100}%"></i></div>
    <div class="foot"><span>${c.cur} / ${c.goal}</span>${c.claimed?'<span>✅ Geclaimd</span>':c.done?`<button class="btn sm green" data-claim="${c.id}">Claim ${c.pts} punten</button>`:'<span>Nog bezig</span>'}</div></div>`;
}
function viewChallenges(){ return `${backBtn}<h2>Challenges · week ${weekNr}</h2><p class="hint">Elke maandag nieuwe kansen. Je hebt <b>⚡${st.points} punten</b>.</p>${challenges().map(chHTML).join('')}`; }
function viewRewards(){
  const next=REWARDS.find(r=>r.pts>st.points)||REWARDS[2];
  return `${backBtn}<h2>Punten & beloningen</h2>
    <div class="hero" style="background:linear-gradient(135deg,#5b3fd1,#3a2596)"><div class="lbl">Jouw punten</div><div class="amt">⚡ ${st.points.toLocaleString('nl-NL')}</div>
      ${st.points<next.pts?`<div class="prog" style="margin-top:12px;background:rgba(255,255,255,.2)"><i style="width:${st.points/next.pts*100}%;background:#c9bcff"></i></div><div style="font-size:12px;opacity:.85;margin-top:5px">Nog ${next.pts-st.points} punten tot ${euro(next.eur)}</div>`:''}</div>
    <h2>Inwisselen <span class="soon">BINNENKORT</span></h2>
    <p class="hint">In de beta spaar je al punten. Inwisselen voor cadeaubonnen komt in een volgende versie.</p>
    ${REWARDS.map(rw=>`<div class="row"><div class="logo-sq" style="background:#5b3fd1;font-size:13px">€${rw.eur}</div><div class="st">${euro(rw.eur)} cadeaubon<em>${rw.pts.toLocaleString('nl-NL')} punten</em></div><span class="soon">${st.points>=rw.pts?'✓ genoeg':'🔒'}</span></div>`).join('')}
    <h2>Zo verdien je punten</h2><div class="list">${EARN.map(e=>`<div class="item static"><div class="emoji">${e[0]}</div><div class="info"><div class="name" style="white-space:normal">${e[1]}</div></div><div class="price"><b style="font-size:13px;color:#5b3fd1">${e[2]}</b></div></div>`).join('')}</div>
    <h2>Geschiedenis</h2><div class="list">${st.pointLog.slice(0,15).map(l=>`<div class="item static" style="padding:9px 12px"><div class="info"><div class="name" style="font-weight:500;font-size:13.5px;white-space:normal">${esc(l.t)}</div><div class="meta">${fmtDate(l.d)}</div></div><div class="price"><b style="font-size:14px;color:var(--green)">+${l.n}</b></div></div>`).join('')||'<div class="empty">Nog geen punten verdiend.</div>'}</div>`;
}
function viewStores(){
  const rows=parseList().found.length?compareList(true):[];
  return `${backBtn}<h2>Mijn winkels</h2><p class="hint">Kies de supermarkten waar jij boodschappen doet. Je lijstje en prijsdalingen worden hierop afgestemd.</p>
    ${rows[0]?`<div class="verdict">🛒 Beste winkel voor jouw boodschappenlijst: <b>${rows[0].s.name}</b> (${euro(rows[0].total)})</div>`:''}
    ${STORES.map(s=>`<div class="row"><div class="logo-sq" style="background:${s.color}">${s.short}</div><div class="st">${s.name}</div>
      <button class="switch ${st.myStores.includes(s.id)?'on':''}" data-store="${s.id}" aria-label="${s.name}"></button></div>`).join('')}
    <p class="demo">Van Aldi tonen we alleen de aanbiedingen (de gewone prijzen zitten niet in de open data). Coop en Vomar zitten er nog niet in.</p>`;
}
function viewSettings(){
  const perm = 'Notification' in window ? Notification.permission : 'niet ondersteund';
  return `${backBtn}<h2>Instellingen</h2>
    <div class="row"><div class="st">Meldingen<em>${st.notif&&perm==='granted'?'Aan':'Uit'}${perm==='denied'?' · geblokkeerd in je telefoon-instellingen':''}</em></div>
      <button class="switch ${st.notif&&perm==='granted'?'on':''}" data-act="${st.notif?'notifoff':'notif'}" aria-label="Meldingen"></button></div>
    <div class="row"><div class="st">Ik heb Lidl Plus<em>Toon Lidl Plus-prijzen als aanbieding</em></div>
      <button class="switch ${st.lidlPlus!==false?'on':''}" data-act="lidlplus" aria-label="Lidl Plus"></button></div>
    <div class="tip"><span class="i">ℹ️</span><div>In deze beta check Saverr de prijzen <b>elke keer dat je de app opent</b>. Meldingen op de achtergrond (terwijl de app dicht is) komen in een volgende versie.</div></div>
    <h2>Over Saverr</h2>
    <div class="tip"><span class="i">💶</span><div>Prijzen komen uit de open data van <a href="https://www.checkjebon.nl" target="_blank" rel="noopener">Checkjebon.nl</a> en worden elke ochtend bijgewerkt. Laatste update: <b>${fmtDate(META.updated)}</b>. Kortingen in de winkel kunnen afwijken.</div></div>
    <div class="tip"><span class="i">🔒</span><div>Je favorieten, lijstje en besparingen worden alleen op deze telefoon bewaard. Er is geen account nodig.</div></div>
    <button class="btn ghost" data-act="reset" style="margin-top:8px">Alle gegevens op deze telefoon wissen</button>`;
}

/* ================= render ================= */
function render(){
  if(!META) return;
  const v = sub ? {challenges:viewChallenges,rewards:viewRewards,stores:viewStores,settings:viewSettings,planner:viewPlanner,week:viewWeek}[sub]
                : {home:viewHome,browse:viewBrowse,favs:viewFavs,list:viewList,alerts:viewAlerts,more:viewMore}[tab];
  $('#main').innerHTML = v();
  $('#searchWrap').style.display = (!sub&&(tab==='browse'||tab==='favs'))?'flex':'none';
  $('#q').placeholder = tab==='browse'&&bmode==='all' ? `Zoek in ±${Math.round(META.catalog/1000)}.000 producten…` : 'Zoek een product…';
  const n=unread().length, dot=$('#bellDot'); dot.textContent=n; dot.style.display=n?'flex':'none';
  $('#ptsVal').textContent=st.points;
  $('#weekLabel').textContent=`Week ${weekNr} · prijzen van ${fmtDate(META.updated)}`;
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
}
function go(t,s=null){ if(t!==tab){ query=''; $('#q').value=''; } tab=t; sub=s; render(); $('#main').scrollTop=0; if(t==='alerts'){ st.seen=[...new Set([...st.seen,...alerts.map(a=>a.key)])].slice(-400); save(); setTimeout(render,1500);} }

/* ---------- product-sheet (vergeleken product) ---------- */
function openProduct(pid){
  const p=P(pid); if(!p) return;
  const rows=Object.entries(p.st).sort((a,b)=>unitEff(p,a[0])-unitEff(p,b[0])), na=CMP_STORES.filter(s=>!has(p,s.id)), t=st.targets[pid];
  sheet(`<div class="sheet-head"><div class="emoji">${p.emoji}</div><div><h3>${esc(p.name)}</h3><div class="meta">${p.cat}</div></div></div>
    <button class="favbtn ${st.favs.includes(pid)?'on':''}" data-fav="${pid}">${st.favs.includes(pid)?'★ Je volgt dit product':'☆ Volgen (favoriet)'}</button>
    ${alarmBox(pid, median(p), t, p.name)}
    <h2 style="font-size:16px">Prijzen per supermarkt</h2>
    ${rows.map(([sid,v],i)=>{const pr=promo(p,sid), now=unitEff(p,sid), reg=regOf(p,sid), key=`${pid}|${sid}|${now}`, deal=reg>now+0.005;return `<div class="row ${i===0?'best':''}">${storeImg(p,sid)?picStore(storeImg(p,sid),p.emoji,sid):`<div class="logo-sq" style="background:${S(sid).color}">${S(sid).short}</div>`}
      <div class="st">${S(sid).name}${i===0?'<span class="best-label">GOEDKOOPST</span>':''}<span class="pn">${esc(v[1])}${v[2]?' · '+esc(v[2]):''}</span>${pr?`<small>🏷️ ${esc(promoTxt(pr))}${untilTxt(pr[3])}</small>`:v[4]?`<small>🔥 Prijsdaling −${pct(v[0],v[4])}%</small>`:''}</div>
      <div class="pr">${euro(now)}${deal?`<s>${euro(reg)}</s>`:''}</div>
      ${deal?`<button class="buy ${isBought(key)?'done':''}" data-buy="${esc(JSON.stringify({key,name:p.name,sid,price:now,was:reg,qty:pr?pr[1]:1,cat:p.cat}))}">${isBought(key)?'✓':'Gekocht'}</button>`:''}
      <a class="go" href="${esc(v[3])}" target="_blank" rel="noopener" aria-label="Bekijk bij ${S(sid).name}">›</a></div>`}).join('')}
    ${na.map(s=>`<div class="row na"><div class="logo-sq" style="background:${s.color}">${s.short}</div><div class="st">${s.name}<em>Niet gevonden in het assortiment</em></div></div>`).join('')}
    <p class="demo">Tik op › om het product bij de winkel te bekijken. Prijzen van ${fmtDate(META.updated)}.</p>`);
  markSeen(a=>a.pid===pid);
}
/* ---------- sheet voor een los product uit het assortiment ---------- */
function openRow(sid, link){
  const src = catalog && !catalog.error ? catalog : null;
  let r=null;
  const si=(src||DROPS_SRC).stores.indexOf(sid);
  r = (src?src.rows:DROPS).find(x=>x[0]===si&&x[4]===link) || (src?null:null);
  const k=cKey(sid,link), f=st.cfavs[k];
  if(!r && f) r=[si,f.name,f.price,f.size,link,f.was||0,f.promo||0,f.img||0,f.name.toLowerCase()];
  if(!r){ loadCatalog(); return push('Product laden…'); }
  const url=(src||DROPS_SRC).urls[si]+link, now=rowNow(r), reg=rowWas(r)||r[2], pr=rowPromo(r), key=k+'|'+now;
  let similar='';
  if(src){ const toks=r[8].split(/\s+/).filter(t=>t.length>3&&!/^\d/.test(t)).slice(0,4);
    if(toks.length>=2){ const sim=src.rows.filter(x=>x[0]!==si&&toks.filter(t=>x[8].includes(t)).length>=Math.min(3,toks.length)&&(!r[3]||!x[3]||x[3].replace(/\D/g,'')===r[3].replace(/\D/g,''))).sort((a,b)=>rowNow(a)-rowNow(b)).slice(0,5);
      if(sim.length) similar=`<h2 style="font-size:16px">Vergelijkbaar bij andere winkels</h2><div class="list">${sim.map(x=>rowHTML(x)).join('')}</div>`; } }
  sheet(`<div class="sheet-head">${pic(imgSrc(sid,r[7],link),'🛍️').replace('</div>','<span class="sb" style="background:'+S(sid).color+'">'+S(sid).short+'</span></div>')}<div><h3>${esc(r[1])}</h3><div class="meta">${S(sid).name}${r[3]?' · '+esc(r[3]):''}</div></div></div>
    <div class="row best"><div class="st" style="font-size:15px">Prijs nu${pr?`<small>🏷️ ${esc(promoTxt(pr))}${untilTxt(pr[3])}</small>`:r[5]?`<small>🔥 Prijsdaling −${pct(r[2],r[5])}% t.o.v. de afgelopen 4 weken</small>`:''}</div><div class="pr" style="font-size:20px">${euro(now)}${reg>now+0.005?`<s>${euro(reg)}</s>`:''}</div></div>
    ${reg>now+0.005?`<button class="btn green" data-buy="${esc(JSON.stringify({key,name:r[1],sid,price:now,was:reg,qty:pr?pr[1]:1}))}" style="margin-bottom:8px" ${isBought(key)?'disabled':''}>${isBought(key)?'✓ Gekocht, besparing opgeslagen':'Ik heb deze gekocht (besparing bijhouden)'}</button>`:''}
    <button class="favbtn ${f?'on':''}" data-cfav="${esc(sid)}|${esc(link)}">${f?'★ Je volgt dit product':'☆ Volgen (favoriet)'}</button>
    ${alarmBox(k, reg, st.targets[k], r[1])}
    <a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:8px">Bekijk bij ${S(sid).name} ›</a>
    ${similar}`);
  markSeen(a=>a.ck===k);
}
function alarmBox(key, normal, t, name){
  return `<div class="alarmbox"><div class="top"><b>🔔 Prijsalarm</b><span>Normale prijs: ${euro(normal)}</span></div>
    <div class="alarmrow"><div class="eur"><span style="white-space:nowrap">⭐ €</span><input id="tIn" type="number" step="0.01" min="0" inputmode="decimal" placeholder="Jouw gewenste prijs" value="${t!=null?t.toFixed(2):''}"></div>
      <button class="btn sm green" data-act="settarget" data-k="${esc(key)}">${t!=null?'Bijwerken':'Instellen'}</button>${t!=null?`<button class="btn sm ghost" data-act="deltarget" data-k="${esc(key)}">✕</button>`:''}</div>
    <div class="meta" style="margin-top:8px">${t!=null?`Je krijgt een melding zodra ${esc(name)} ${euro(t)} of goedkoper is.`:'Stel een gewenste prijs in en krijg alleen een melding als die bereikt wordt.'}</div></div>`;
}
let sheetFn=null;
function sheet(html){ $('#toast').classList.remove('show'); $('#sheet').innerHTML=`<div class="grab"></div><button class="back" data-act="close" style="position:absolute;right:16px;top:10px;font-size:20px;color:var(--muted)" aria-label="Sluiten">✕</button>`+html; $('#sheet').classList.add('show'); $('#scrim').classList.add('show'); $('#sheet').scrollTop=0; }
function closeSheet(){ $('#sheet').classList.remove('show'); $('#scrim').classList.remove('show'); sheetFn=null; render(); }
function markSeen(fn){ alerts.filter(fn).forEach(a=>{ if(!st.seen.includes(a.key)) st.seen.push(a.key); }); save(); }

let toastTimer;
function push(text, a){ $('#toastText').textContent=text; $('#toast').dataset.a = a ? (a.pid?'p:'+a.pid:'c:'+a.ck.slice(2)) : '';
  $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500); }

/* ================= acties ================= */
function toggleFav(pid){ const i=st.favs.indexOf(pid); i>=0?st.favs.splice(i,1):st.favs.push(pid); save(); buildAlerts();
  const a=alerts.find(x=>x.pid===pid); if(i<0&&a) push(alertText(a),a); }
function toggleCFav(sid,link){
  const k=cKey(sid,link);
  if(st.cfavs[k]){ delete st.cfavs[k]; delete st.targets[k]; save(); buildAlerts(); return; }
  const src=catalog&&!catalog.error?catalog:DROPS_SRC, si=src.stores.indexOf(sid), r=(src===catalog?catalog.rows:DROPS).find(x=>x[0]===si&&x[4]===link);
  if(!r) return;
  st.cfavs[k]={sid,link,name:r[1],size:r[3],price:rowNow(r),was:rowWas(r)||0,promo:rowPromo(r),img:r[7]||0}; save(); buildAlerts(); push(`⭐ Je volgt nu ${r[1]} bij ${S(sid).name}.`);
}
function setTarget(k,val){
  if(!(val>0)) return push('Vul een geldige prijs in.');
  st.targets[k]=Math.round(val*100)/100;
  if(!k.startsWith('c:') && !st.favs.includes(k)) st.favs.push(k);
  save(); buildAlerts();
  const a=alerts.find(x=>(x.pid===k||x.ck===k)&&x.target!=null);
  push(a?alertText(a):`🔔 Prijsalarm staat aan op ${euro(st.targets[k])}.`);
}

document.addEventListener('click', e=>{
  const el=s=>e.target.closest(s); let x;
  if(el('a[href]')) return;
  if(x=el('[data-fav]')){ e.stopPropagation(); toggleFav(x.dataset.fav); $('#sheet').classList.contains('show')?openProduct(x.dataset.fav):render(); return; }
  if(x=el('[data-cfav]')){ e.stopPropagation(); const [s,...l]=x.dataset.cfav.split('|'); toggleCFav(s,l.join('|')); $('#sheet').classList.contains('show')?openRow(s,l.join('|')):render(); return; }
  if(x=el('[data-buy]')){ const o=JSON.parse(x.dataset.buy); markBought(o); o.key.includes('c:')||!P(o.key.split('|')[0])?openRow(o.sid,o.key.split('|').slice(1,-1).join('|')):openProduct(o.key.split('|')[0]); return; }
  if(x=el('nav button')){ go(x.dataset.tab); return; }
  if(x=el('[data-go]')){ go('more',x.dataset.go); return; }
  if(x=el('[data-sub]')){ sub=x.dataset.sub; render(); $('#main').scrollTop=0; return; }
  if(x=el('[data-pstep]')){ const [k,d,mn,mx]=x.dataset.pstep.split('|'); planForm[k]=Math.min(+mx,Math.max(+mn,planForm[k]+ +d)); render(); return; }
  if(x=el('[data-pall]')){ planForm.allStores=x.dataset.pall==='1'; render(); return; }
  if(x=el('[data-swap]')){ doPlan(+x.dataset.swap); return; }
  if(x=el('[data-bmode]')){ bmode=x.dataset.bmode; const q=x.dataset.q; tab='browse'; sub=null; if(q){ query=q.toLowerCase(); $('#q').value=q; } else if(!x.closest('.seg')){ query=''; $('#q').value=''; } render(); $('#main').scrollTop=0; return; }
  if(x=el('[data-cat]')){ cat=x.dataset.cat; render(); return; }
  if(x=el('[data-dropf]')){ dropFilter=x.dataset.dropf; render(); return; }
  if(x=el('[data-claim]')){ const c=challenges().find(c=>c.id===x.dataset.claim); (st.claimed[WEEK]=st.claimed[WEEK]||[]).push(c.id); addPoints(c.pts,`Challenge “${c.t}” voltooid`); push(`⚡ +${c.pts} punten!`); render(); return; }
  if(x=el('[data-store]')){ const id=x.dataset.store, i=st.myStores.indexOf(id); i>=0?st.myStores.splice(i,1):st.myStores.push(id); save(); render(); return; }
  if(x=el('[data-act]')){
    const a=x.dataset.act;
    if(a==='back'){ sub=null; render(); }
    else if(a==='close') closeSheet();
    else if(a==='compare'){ st.list=$('#listIn').value; listShown=true; if(st.listPts!==WEEK && parseList().found.length){ st.listPts=WEEK; addPoints(20,'Boodschappenlijst vergeleken'); push('🛒 Lijstje vergeleken! +20 punten.'); } save(); render(); }
    else if(a==='mine'){ listAll=false; render(); } else if(a==='all'){ listAll=true; render(); }
    else if(a==='settarget'){ const k=x.dataset.k; setTarget(k, parseFloat(($('#tIn').value||'').replace(',','.'))); k.startsWith('c:')?openRow(...splitC(k)):openProduct(k); }
    else if(a==='deltarget'){ const k=x.dataset.k; delete st.targets[k]; save(); buildAlerts(); k.startsWith('c:')?openRow(...splitC(k)):openProduct(k); }
    else if(a==='notif') enableNotifications();
    else if(a==='mkplan'){ x.textContent='⏳ Bezig met rekenen…'; setTimeout(()=>doPlan(),30); }
    else if(a==='plan2list'){ const c=planCost(st.plan.ids,st.plan.sid,st.plan.persons); st.list=c.items.map(it=>(it.n>1?it.n+'x ':'')+it.p.name).join(', '); listShown=true; save(); go('list'); push('🛒 Je weekmenu staat op je boodschappenlijst.'); }
    else if(a==='share') shareWeek();
    else if(a==='notifoff'){ st.notif=false; save(); render(); }
    else if(a==='lidlplus'){ st.lidlPlus = st.lidlPlus===false; save(); buildAlerts(); render(); }
    else if(a==='install' && deferredInstall){ deferredInstall.prompt(); deferredInstall.userChoice.finally(()=>{ deferredInstall=null; render(); }); }
    else if(a==='reset'){ if(x.dataset.sure){ localStorage.removeItem(KEY); location.reload(); } else { x.dataset.sure='1'; x.textContent='Zeker weten? Tik nogmaals om alles te wissen'; x.style.color='var(--deal)'; } }
    return;
  }
  if(x=el('[data-open]')){ openProduct(x.dataset.open); return; }
  if(x=el('[data-row]')){ const [s,...l]=x.dataset.row.split('|'); openRow(s,l.join('|')); return; }
  if(el('#bellBtn')){ go('alerts'); return; }
  if(el('#ptsBtn')){ go('more','rewards'); return; }
  if(el('#scrim')){ closeSheet(); return; }
  if(x=el('#toast')){ x.classList.remove('show'); const d=x.dataset.a; if(d.startsWith('p:')) openProduct(d.slice(2)); else if(d.startsWith('c:')) openRow(...splitC('c:'+d.slice(2))); }
});
const splitC = k => { const [s,...l]=k.slice(2).split('|'); return [s,l.join('|')]; };
let qT; $('#q').addEventListener('input', e=>{ query=e.target.value.trim().toLowerCase(); clearTimeout(qT); qT=setTimeout(render, bmode==='all'?250:0); });
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstall=e; render(); });
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') refresh(); });

/* ================= start ================= */
async function refresh(){
  try{ const old=META&&META.built; await loadData(); if(old && old===META.built) return; buildAlerts(); render(); notifyNew();
    if(Object.keys(st.cfavs).length) loadCatalog(); }
  catch(e){ if(!META) $('#main').innerHTML='<div class="empty"><div class="big">📡</div>De prijzen konden niet geladen worden.<br>Controleer je internetverbinding en probeer het opnieuw.</div>'; }
}
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
if(location.hash==='#alerts') tab='alerts';
refresh();
