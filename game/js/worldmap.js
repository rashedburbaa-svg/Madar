/* ---------- خريطة المدار: the six planets become regions of one map. The colony stays;
   you explore regions, gather each region's material, grow its landmark and craft gear for the battles. ---------- */
const REG=[
  {mat:'alloy',mn:'سبائك مدارية',me:'🔩',hq:BAL.regions.list[0].hq,story:0,scout:BAL.regions.list[0].scout,bonus:BAL.regions.list[0].bonus,bd:'كل الإنتاج',
   adv:[{n:'جمع الخردة المدارية',em:'🛰️',t:15,q:[5,9],r:{m:400}},{n:'إنقاذ قمر صناعي تائه',em:'📡',t:45,q:[14,22],r:{c:6},risk:1}]},
  {mat:'ice',mn:'جليد أزرق',me:'🧊',hq:BAL.regions.list[1].hq,story:2,scout:BAL.regions.list[1].scout,bonus:BAL.regions.list[1].bonus,bd:'إنتاج الطاقة',
   adv:[{n:'حفر الجليد الأزرق',em:'⛏️',t:20,q:[6,10],r:{e:600}},{n:'تتبّع الوحوش الجليدية',em:'🐾',t:60,q:[16,26],r:{c:8},risk:1}]},
  {mat:'magma',mn:'صهارة',me:'🔥',hq:BAL.regions.list[2].hq,story:3,scout:BAL.regions.list[2].scout,bonus:BAL.regions.list[2].bonus,bd:'إنتاج المعادن',
   adv:[{n:'جمع الصهارة',em:'🌋',t:20,q:[6,10],r:{m:800}},{n:'عبور نهر الحمم',em:'🔥',t:60,q:[16,26],r:{c:8},risk:1}]},
  {mat:'quartz',mn:'كوارتز',me:'💠',hq:BAL.regions.list[3].hq,story:1,ship:1,scout:BAL.regions.list[3].scout,bonus:BAL.regions.list[3].bonus,bd:'إنتاج الكريستال',
   adv:[{n:'قطف الكوارتز',em:'💎',t:25,q:[6,10],r:{f:800}},{n:'عشّ الطيور البلورية',em:'🪽',t:75,q:[18,28],r:{c:10},risk:1}]},
  {mat:'spore',mn:'أبواغ',me:'🍄',hq:BAL.regions.list[4].hq,story:4,ship:1,ark:1,scout:BAL.regions.list[4].scout,bonus:BAL.regions.list[4].bonus,bd:'إنتاج الغذاء',
   adv:[{n:'جمع الأبواغ المضيئة',em:'🍄',t:25,q:[6,10],r:{f:1200}},{n:'الوصول إلى قلب الغابة',em:'🌳',t:90,q:[20,30],r:{c:12},risk:1}]},
  {mat:'gas',mn:'غاز السديم',me:'🌌',hq:BAL.regions.list[5].hq,story:5,ship:1,ark:1,scout:BAL.regions.list[5].scout,bonus:BAL.regions.list[5].bonus,bd:'كل الإنتاج',
   adv:[{n:'حصاد غاز السديم',em:'🌫️',t:30,q:[6,10],r:{e:1500}},{n:'مطاردة الأشباح الفضائية',em:'👻',t:120,q:[22,34],r:{c:15},risk:1}]}];
const LMCOST=BAL.regions.landmark.cost;   // x = the region's own material
const LMRATE=BAL.regions.landmark.rate;                                                                 // material per hour from the landmark
const GEAR=[
  {id:'g_ice',g:'s',n:'درع زيفيروس',em:'🛡️',d:'صحة +25 في «صمود المدار»',c:{ice:40,alloy:20},b:{hp:25}},
  {id:'g_magma',g:'s',n:'نواة الحمم',em:'🔥',d:'ضرر +12% في «صمود المدار»',c:{magma:40,alloy:20},b:{dmg:12}},
  {id:'g_quartz',g:'s',n:'عدسة الكوارتز',em:'🔭',d:'سرعة إطلاق +12% في «صمود المدار»',c:{quartz:40,ice:20},b:{rate:12}},
  {id:'g_cannon',g:'p',n:'مدفع الصهارة',em:'💥',d:'ضرر +12% في «طيّار المدار»',c:{magma:50,quartz:25},b:{dmg:12}},
  {id:'g_hull',g:'p',n:'هيكل الأبواغ الحيّ',em:'🍄',d:'هيكل +30 في «طيّار المدار»',c:{spore:50,ice:25},b:{hull:30}},
  {id:'g_neb',g:'p',n:'محرّك السديم',em:'🌌',d:'ضرر +8% وهيكل +15 في «طيّار المدار»',c:{gas:50,spore:25},b:{dmg:8,hull:15}}];

/* save: col.wm = {u: unlocked regions, at: region you are standing in, mat, lm: landmark stage, trip, gear, mt} */
(function(){if(!col.wm){const P=col.pg||0,u={};for(let i=0;i<=Math.min(P,5);i++)u[i]=1;col.wm={u,at:Math.min(P,5),mat:{},lm:{},trip:null,gear:{},mt:Date.now()}}
  const w=col.wm;w.u=w.u||{0:1};w.u[0]=1;w.mat=w.mat||{};w.lm=w.lm||{};w.gear=w.gear||{};w.mt=w.mt||Date.now()})();
const WM=()=>col.wm,RAT=()=>Math.min(5,WM().at||0),regName=i=>PLN[i].n,regEm=i=>PLN[i].em;
const matN=k=>Math.floor(WM().mat[k]||0),matIcon=k=>(REG.find(r=>r.mat===k)||{}).me||'',matName=k=>(REG.find(r=>r.mat===k)||{}).mn||k;
const regOpen=i=>!!WM().u[i];
function regReq(i){const R=REG[i],out=[];out.push([`🏛️ القيادة ${R.hq}`,col.b.hq>=R.hq]);if(R.ship)out.push(['🔧 المركبة الأولى مُصلحة',!!col.done]);if(R.ark)out.push([`🚀 سفينة الاستكشاف ${arkN()}/${ARK.length}`,arkN()===ARK.length]);if(i>0)out.push(['🗺️ المنطقة السابقة مكتشفة',regOpen(i-1)]);return out}
const regReady=i=>regReq(i).every(x=>x[1]);

/* landmark bonuses feed production */
function wmBonus(k){let b=0;REG.forEach((R,i)=>{const s=WM().lm[i]||0;if(s&&(R.bonus[0]===k||R.bonus[0]==='all'))b+=R.bonus[1]*s});return b}
{const _t=tMul;tMul=function(k){return _t(k)*(1+wmBonus(k))}}
/* gear feeds the battles */
const gearOn=id=>!!WM().gear[id];
{const _s=survBonus;survBonus=function(){const b=_s();for(const g of GEAR)if(g.g==='s'&&gearOn(g.id))for(const k in g.b)b[k]=(b[k]||0)+g.b[k];return b}}
{const _p=pilotBonus;pilotBonus=function(){const b=_p();for(const g of GEAR)if(g.g==='p'&&gearOn(g.id))for(const k in g.b)b[k]=(b[k]||0)+g.b[k];return b}}

/* the team: one trip at a time (scouting a new region or an adventure) */
function tripDur(min){return Math.round(min*60*(1-BAL.techIon*techLv('ion')))}
function tripStart(kind,i,a){const w=WM();if(w.trip){toast('🧑‍🚀 الفريق في مهمة الآن');return}
  if(kind==='scout'){const R=REG[i];if(!regReady(i)){toast('🔒 الشروط لم تكتمل');return}const c={...R.scout};delete c.t;if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}accrue();pay(c);w.trip={k:'scout',i,end:Date.now()+tripDur(R.scout.t)*1000,len:tripDur(R.scout.t)}}
  else{const A=REG[i].adv[a];w.trip={k:'adv',i,a,end:Date.now()+tripDur(A.t)*1000,len:tripDur(A.t)}}
  colSave();snd('win');buzz([20,40]);toast('🧑‍🚀 انطلق الفريق','ach');updRes();mapRender()}
function tripRush(){const t=WM().trip;if(!t)return;const cost=Math.max(1,Math.ceil((t.end-Date.now())/(BAL.regions.rushSecPerGem*1000)));if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}col.res.c-=cost;t.end=Date.now();tripTick();updRes()}
function addMat(k,n){const w=WM();w.mat[k]=(w.mat[k]||0)+n}
function tripTick(){const w=WM(),t=w.trip,now=Date.now();
  // landmarks produce their region's material while you are away too
  const hrs=(now-w.mt)/3600000;if(hrs>0.01){REG.forEach((R,i)=>{const s=w.lm[i]||0;if(s)addMat(R.mat,LMRATE[s]*hrs)});w.mt=now}
  if(!t||now<t.end)return;w.trip=null;const R=REG[t.i];
  if(t.k==='scout'){w.u[t.i]=1;addMat(R.mat,10);addXP(60);colSave();snd('win');
    if(typeof regionPanorama==='function'&&!panoSeen(t.i))regionPanorama(t.i,()=>regGo(t.i));else{const m=storyBox(`🗺️ اكتشفت ${regEm(t.i)} ${regName(t.i)}!`,`وجد الفريق ${R.mn} ${R.me} وكائنات لم نرها من قبل. انتقل إلى المنطقة لترى أرضها، وابنِ معلمها لتجمع ${R.mn} باستمرار.`,'رائع');try{celebrate(m.querySelector('.hbox'))}catch(e){}}
    const n=Object.keys(w.u).length;if(typeof unlock==='function'){if(n>=3)unlock('wm3');if(n>=6)unlock('wm6')}}
  else{const A=R.adv[t.a],sc=1+BAL.techScan*techLv('scan');let ok=true,f=1;
    if(A.risk){const ch=Math.min(0.95,0.55+0.04*(col.b.def||0)+0.05*(w.lm[t.i]||0));ok=Math.random()<ch;f=ok?1:0.4}
    const q=Math.round((A.q[0]+Math.random()*(A.q[1]-A.q[0]))*f*sc);addMat(R.mat,q);const got=['+'+q+' '+R.me+' '+R.mn];
    for(const [k,n] of Object.entries(A.r)){const v=Math.round(n*f*(k==='c'?1:1+BAL.regions.hqBonus*col.b.hq));gain(k,v);got.push('+'+fmtN(v)+' '+RES[k][1])}
    if(!ok&&col.sv)col.sv.morale=Math.max(0,col.sv.morale-5);addXP(ok?25:10);colSave();snd(ok?'win':'err');
    storyBox(`${A.em} ${ok?'نجحت المغامرة':'عاد الفريق مصاباً'}: ${A.n}`,(ok?'':'واجه الفريق خطراً وعاد بجزء من الغنائم (المعنويات −5) · ')+got.join(' · '),'حسناً')}
  updRes();mapRender();if(!$('pColony').hidden)renderColony()}
setInterval(tripTick,3000);setTimeout(tripTick,1500);

/* landmark and gear */
function lmBuild(i){const w=WM(),s=w.lm[i]||0;if(s>=3)return;const c=LMCOST[s],R=REG[i];if(matN(R.mat)<c.x){snd('err');toast(`تحتاج ${c.x} ${R.me} ${R.mn}`);return}if(!canPay({m:c.m,e:c.e})){snd('err');toast('الموارد لا تكفي');return}
  accrue();pay({m:c.m,e:c.e});w.mat[R.mat]-=c.x;w.lm[i]=s+1;colSave();snd('build');toast(`🏗️ معلم ${regName(i)} · المرحلة ${s+1}`,'ach');updRes();mapRender();if(RAT()===i&&!$('pColony').hidden)renderColony()}
function gearMake(id){const g=GEAR.find(x=>x.id===id),w=WM();if(!g||w.gear[id])return;for(const [k,n] of Object.entries(g.c))if(matN(k)<n){snd('err');toast(`تحتاج ${n} ${matIcon(k)} ${matName(k)}`);return}
  for(const [k,n] of Object.entries(g.c))w.mat[k]-=n;w.gear[id]=1;colSave();snd('win');toast(`🛠️ صنعت ${g.n}`,'ach');const n=Object.keys(w.gear).length;if(n>=3&&typeof unlock==='function')unlock('gear3');mapRender()}
function regGo(i){if(!regOpen(i)||RAT()===i)return;closeMap();
  confirmBox(`📍 الانتقال إلى ${regName(i)}؟ ستبقى مستعمرتك كما هي، وتتغيّر السماء والكائنات حولها.`,()=>{WM().at=i;colSave();flight({n:regName(i),em:regEm(i),tint:PLN[i].tint},()=>location.reload())})}

/* ---------- the map window ---------- */
let MAPV={v:'map',i:0};
const closeMap=()=>{const m=document.getElementById('galbox');if(m)m.remove()};
function mapBox(v,i){if(v)MAPV={v,i:i||0};let m=document.getElementById('galbox');
  if(!m){m=document.createElement('div');m.id='galbox';m.className='hmodal galm wmap';document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove()}}
  mapRender()}
function tripLine(){const t=WM().trip;if(!t)return '';const left=Math.max(0,(t.end-Date.now())/1000),R=REG[t.i];
  return `<div class="wtrip">🧑‍🚀 ${t.k==='scout'?'استكشاف '+regName(t.i):R.adv[t.a].n} · <b class="gt">${fmtDur(left)}</b><button type="button" class="btn" data-wrush>⚡ 💎 ${Math.max(1,Math.ceil(left/BAL.regions.rushSecPerGem))}</button></div>`}
function shipLine(){const x=col.exp;if(!x)return '';const left=(x.end-Date.now())/1000;
  return `<div class="wtrip">🚀 ${PLANETS[x.i].n} · ${left<=0?'<button type="button" class="btn main" data-gclaim>استلم الغنائم</button>':`<b class="gt">${fmtDur(left)}</b><button type="button" class="btn" data-grush>⚡ 💎 ${Math.max(1,Math.ceil(left/BAL.galaxy.rushSecPerGem))}</button>`}</div>`}
function matBar(){return `<div class="wmats">${REG.map((R,i)=>`<span class="${regOpen(i)?'':'off'}">${R.me} <b>${matN(R.mat)}</b></span>`).join('')}</div>`}
function mapHTML(){let h=`<h3>🗺️ خريطة المدار</h3><small class="gsub">مستعمرتك في ${regEm(RAT())} ${regName(RAT())} · الآثار ${artCount()}/6</small>${matBar()}${tripLine()}${shipLine()}
  <div class="wtabs"><button type="button" class="on">🗺️ المناطق</button><button type="button" data-wv="gear">🛠️ ورشة المعدات</button></div><div class="wlist">`;
  REG.forEach((R,i)=>{const open=regOpen(i),here=RAT()===i,img=typeof ART!=='undefined'&&ART['pl'+i+'_land'],s=WM().lm[i]||0;
    h+=`<button type="button" class="wreg${open?'':' lock'}${here?' here':''}" data-wr="${i}">${img?`<img src="${img}" alt="">`:''}<span class="wrt"><b>${regEm(i)} ${regName(i)}</b><small>${open?`${R.me} ${R.mn} · المعلم ${s}/3`:'🔒 '+(regReady(i)?'جاهزة للاستكشاف':'مغلقة')}${here?' · 📍 أنت هنا':''}</small></span></button>`});
  return h+'</div>'}
function regHTML(i){const R=REG[i],open=regOpen(i),s=WM().lm[i]||0,img=typeof ART!=='undefined'&&ART['pl'+i+'_land'],busy=!!WM().trip;
  let h=`<button type="button" class="wback" data-wv="map">→ الخريطة</button><div class="wban">${img?`<img src="${img}" alt="">`:''}<b>${regEm(i)} ${regName(i)}</b></div>`;
  if(!open){h+=`<p class="wnote">منطقة لم يكتشفها أحد. أرسل الفريق ليستكشفها ويفتحها.</p><div class="pgreq">${regReq(i).map(([t,ok])=>`<span class="${ok?'ok':''}">${t}</span>`).join('')}</div>`;
    if(R.ark&&arkN()<ARK.length)h+=arkHTML();
    const c=R.scout;h+=`<button type="button" class="btn${regReady(i)&&!busy?' main':''}" data-wscout="${i}" ${regReady(i)&&!busy?'':'disabled'}>🔭 استكشف · ⛏️ ${fmtN(c.m)} ⚡ ${fmtN(c.e)}${c.f?' 🌱 '+fmtN(c.f):''} · ${c.t}د</button>`;return h}
  h+=`<div class="wrow"><span>${R.me} ${R.mn}: <b>${matN(R.mat)}</b></span>${RAT()===i?'<span class="ok">📍 أنت هنا</span>':`<button type="button" class="btn" data-wgo="${i}">📍 انتقل إلى هنا</button>`}</div>`;
  // landmark
  const lk='pl'+i+'_s'+Math.max(1,s);h+=`<h4>🏗️ معلم المنطقة · المرحلة ${s}/3</h4><div class="wlm">${typeof ART!=='undefined'&&ART[lk]?`<img src="${ART[lk]}" alt="" class="${s?'':'ghost'}">`:''}<div><small>كل مرحلة: ${R.bd} +${Math.round(R.bonus[1]*100)}% · ينتج ${R.me} ${LMRATE[Math.min(3,s+ (s<3?1:0))]} في الساعة${s?` (الآن ${LMRATE[s]})`:''}</small>`;
  if(s<3){const c=LMCOST[s],ok=matN(R.mat)>=c.x&&canPay({m:c.m,e:c.e});h+=`<button type="button" class="btn${ok?' main':''}" data-wlm="${i}">🔧 المرحلة ${s+1} · ${R.me} ${c.x} ⛏️ ${fmtN(c.m)} ⚡ ${fmtN(c.e)}</button>`}else h+='<b class="ok">✅ اكتمل المعلم</b>';
  h+='</div></div><h4>🧭 المغامرات</h4>';
  R.adv.forEach((A,a)=>{h+=`<div class="wadv"><span class="ae">${A.em}</span><span class="an"><b>${A.n}</b><small>⏱️ ${fmtDur(tripDur(A.t))} · ${R.me} ${A.q[0]}–${A.q[1]} · ${Object.entries(A.r).map(([k,n])=>'+'+fmtN(n)+RES[k][1]).join(' ')}${A.risk?' · ⚠️ خطرة':''}</small></span><button type="button" class="btn${busy?'':' main'}" data-wadv="${i}:${a}" ${busy?'disabled':''}>انطلق</button></div>`});
  // the old galaxy story trip now lives in its region
  const P=PLANETS[R.story],j=R.story,sopen=galOpen(),sx=col.exp;
  h+=`<div class="wadv story"><span class="ae">🚀</span><span class="an"><b>رحلة المركبة: ${P.n}</b><small>${sopen?`⏱️ ${fmtDur(expDur(j))} · ${Object.entries(P.r).map(([k,n])=>'+'+fmtN(n)+RES[k][1]).join(' ')}${col.gal.art[j]?' · 🏺 ✅':' · 🏺 '+P.art}`:'🔒 أصلح المركبة أولاً'}</small></span><button type="button" class="btn${sopen&&!sx?' main':''}" data-wexp="${j}" ${sopen&&!sx?'':'disabled'}>${sx&&sx.i===j?'في الطريق':'انطلق'}</button></div>`;
  return h}
function gearHTML(){let h=`<button type="button" class="wback" data-wv="map">→ الخريطة</button><h3>🛠️ ورشة المعدات</h3>${matBar()}<p class="wnote">اصنع معدات دائمة من مواد المناطق، تعمل تلقائياً في المعارك.</p>`;
  for(const [g,t] of [['s','⚔️ صمود المدار'],['p','✈️ طيّار المدار']]){h+=`<h4>${t}</h4>`;
    for(const G of GEAR.filter(x=>x.g===g)){const own=gearOn(G.id),ok=!own&&Object.entries(G.c).every(([k,n])=>matN(k)>=n);
      h+=`<div class="wadv${own?' done':''}"><span class="ae">${G.em}</span><span class="an"><b>${G.n}</b><small>${G.d}</small><small>${Object.entries(G.c).map(([k,n])=>`${matIcon(k)} ${matN(k)}/${n}`).join(' · ')}</small></span>${own?'<b class="ok">✅</b>':`<button type="button" class="btn${ok?' main':''}" data-wgear="${G.id}" ${ok?'':'disabled'}>اصنع</button>`}</div>`}}
  return h}
function mapRender(){const m=document.getElementById('galbox');if(!m||!m.classList.contains('wmap'))return;const st=m.querySelector('.hbox')?m.querySelector('.hbox').scrollTop:0;
  const body=MAPV.v==='reg'?regHTML(MAPV.i):MAPV.v==='gear'?gearHTML():mapHTML();
  m.innerHTML=`<div class="hbox galx wbox"><button class="csx" type="button" aria-label="إغلاق">✕</button>${body}</div>`;m.querySelector('.hbox').scrollTop=MAPV.v==='map'?st:0;
  const on=(sel,fn)=>m.querySelectorAll(sel).forEach(b=>b.onclick=e=>{e.stopPropagation();snd('tap');fn(b)});
  on('.csx',()=>m.remove());on('[data-wv]',b=>{MAPV={v:b.dataset.wv,i:0};mapRender()});on('[data-wr]',b=>{MAPV={v:'reg',i:+b.dataset.wr};mapRender()});
  on('[data-wscout]',b=>tripStart('scout',+b.dataset.wscout));on('[data-wadv]',b=>{const [i,a]=b.dataset.wadv.split(':').map(Number);tripStart('adv',i,a)});
  on('[data-wlm]',b=>lmBuild(+b.dataset.wlm));on('[data-wgear]',b=>gearMake(b.dataset.wgear));on('[data-wgo]',b=>regGo(+b.dataset.wgo));on('[data-wrush]',tripRush);
  on('[data-wexp]',b=>expStart(+b.dataset.wexp));on('[data-gclaim]',()=>{m.remove();expClaim()});on('[data-grush]',()=>{rushExp()});
  on('[data-ark]',b=>arkBuild(b.dataset.ark));on('[data-arkr]',arkRush)}
setInterval(()=>{const m=document.getElementById('galbox');if(m&&m.classList.contains('wmap'))m.querySelectorAll('.gt').forEach(()=>{});},1000);

/* the old entry points open the map: galaxy button, relaunch chip, launch pad, ship trips */
galaxyBox=function(){const m=document.getElementById('galbox');if(m&&m.classList.contains('wmap')){mapRender();return}mapBox(MAPV.v==='reg'?'reg':'map',MAPV.i)};
planetOpen=function(j){const i=REG.findIndex(R=>R.story===j);return i>=0&&regOpen(i)};
{const _st=expStart;expStart=function(j){if(!planetOpen(j)){toast('🔒 اكتشف المنطقة أولاً');return}_st(j)}}
{const _rs=renderSheet;renderSheet=function(){if(sheetId==='prestige'){closeSheet();mapBox('map');return}_rs()}}
{const _fc=festChip;festChip=function(){return _fc().replace(/<button class="cpg[^]*?<\/button>/,'')}}
if(typeof ACH!=='undefined')ACH.push(['wm3','🗺️','استكشف 3 مناطق'],['wm6','🌌','استكشف كل المناطق'],['gear3','🛠️','اصنع 3 معدات']);
/* a 1-second refresh of the trip timer while the map is open */
setInterval(()=>{const m=document.getElementById('galbox');if(!m||!m.classList.contains('wmap'))return;const t=WM().trip,g=m.querySelector('.wtrip .gt');if(t&&g)g.textContent=fmtDur(Math.max(0,(t.end-Date.now())/1000))},1000);
