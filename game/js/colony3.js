/* ================= مستعمرة المدار — part 3: Chapter 2 galaxy expeditions, space trader ================= */

/* ---------- galaxy: six planets reached by the repaired ship ---------- */
const PLANETS=[
  {n:'القمر',d:'صخور رمادية وفوهات عميقة',c:['#f0f0f2','#9a9aa0','#3a3a40'],t:20*60,r:{m:900,e:700,c:8},art:'حجر القمر',say:'تحت فوهة القمر آثار مستعمرة قديمة… من بناها؟'},
  {n:'المريخ',d:'صحراء حمراء تعصف بها الرياح',c:['#ffb070','#c8502a','#5a1a0a'],t:60*60,r:{e:1800,f:1400,c:14},art:'بلورة المريخ',say:'في رمال المريخ أبراج تبث نفس الإشارة الغامضة!'},
  {n:'أوروبا',d:'جليد أبدي فوق محيط خفي',c:['#f0fbff','#8ac8e8','#2a5a7a'],t:2*3600,r:{f:3200,m:2000,c:20},art:'لؤلؤة أوروبا',say:'تحت الجليد سفينة مجمّدة… تشبه سفينتنا تماماً!'},
  {n:'آيو',d:'براكين وأنهار من الحمم',c:['#ffd070','#ff4a1a','#4a0a0a'],t:4*3600,r:{m:4500,e:4000,c:30},art:'جمرة آيو',say:'المخلوقات هنا تخاف شيئاً في السماء…'},
  {n:'الغابة الفضائية',d:'غابات عملاقة ومخلوقات مضيئة',c:['#d8a0ff','#6a3aa0','#1a0a3a'],t:8*3600,r:{m:8000,e:7000,f:5000,c:45},art:'بذرة الحياة',say:'الإحداثيات الأخيرة تشير إلى حزام الكويكبات… إلى مصدر الإشارة.'},
  {n:'حزام الكويكبات',d:'مصدر الإشارة الغامضة',c:['#d8d0c8','#7a7068','#1a1614'],t:12*3600,r:{c:120,m:12000,e:12000,f:9000},art:'مفتاح الحزام',say:'الإشارة لم تكن نداء استغاثة… كانت دعوة. الفصل الثالث قريباً.'}
];
if(!col.gal)col.gal={done:{},art:{}};
const galOpen=()=>!!col.done;
const artCount=()=>Object.keys(col.gal.art||{}).length;
const expDur=i=>Math.round(PLANETS[i].t*(1-BAL.techIon*techLv('ion')));
const planetOpen=i=>i===0||!!col.gal.done[i-1];
function expStart(i){if(col.exp){toast('🚀 المركبة في رحلة');return}if(!planetOpen(i)){toast('🔒 زر الكوكب السابق أولاً');return}
  const P=PLANETS[i],T=expDur(i);col.exp={i,end:Date.now()+T*1000,len:T};colSave();snd('win');buzz([20,40,60]);toast('🚀 انطلقت المركبة نحو '+P.n,'ach');renderColony();galaxyBox()}
function expClaim(){const x=col.exp;if(!x||Date.now()<x.end)return;const P=PLANETS[x.i],first=!col.gal.done[x.i],k=1+0.08*col.b.hq;
  const sc=1+BAL.techScan*techLv('scan'),got=Object.entries(P.r).map(([r,n])=>[r,Math.round(n*(first?1.5:1)*(r==='c'?1:k)*sc)]);got.forEach(([r,n])=>gain(r,n));
  col.gal.done[x.i]=(col.gal.done[x.i]||0)+1;if(first)col.gal.art[x.i]=1;col.exp=null;addXP(first?80:30);colSave();
  const m=storyBox(`🪐 عادت المركبة من ${P.n}`,(first?P.say+' — ':'')+got.map(([r,n])=>'+'+fmtN(n)+' '+RES[r][1]).join('  ')+(first?`  · أثر جديد: ${P.art} (+5% لكل الإنتاج)`:''),'رائع');celebrate(m.querySelector('.hbox'));if(first&&x.i===PLANETS.length-1)unlock&&0;renderColony()}
function rushExp(){const x=col.exp;if(!x)return;const left=(x.end-Date.now())/1000,cost=Math.max(1,Math.ceil(left/120));if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}
  col.res.c-=cost;x.end=Date.now();colSave();galaxyBox()}
function planetSVG(P,r){return `<defs><radialGradient id="pg${P.n.length}${r}" cx="35%" cy="30%"><stop offset="0" stop-color="${P.c[0]}"/><stop offset=".6" stop-color="${P.c[1]}"/><stop offset="1" stop-color="${P.c[2]}"/></radialGradient></defs><circle r="${r}" fill="url(#pg${P.n.length}${r})"/><ellipse cx="${-r*0.3}" cy="${-r*0.35}" rx="${r*0.35}" ry="${r*0.18}" fill="#fff" opacity=".3" transform="rotate(-25)"/>`}
function galaxyBox(){let m=document.getElementById('galbox');if(!m){m=document.createElement('div');m.id='galbox';m.className='hmodal galm';document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove()}}
  const x=col.exp;let stars='';const R=rng(11);for(let k=0;k<120;k++)stars+=`<circle cx="${(R()*360).toFixed(0)}" cy="${(R()*560).toFixed(0)}" r="${(R()*1.2+0.2).toFixed(1)}" fill="#fff" opacity="${(0.3+R()*0.7).toFixed(2)}"/>`;
  const pos=[[70,480],[250,410],[110,320],[260,230],[100,140],[220,60]];let path='M'+pos.map(p=>p.join(' ')).join(' L');
  let nodes=PLANETS.map((P,i)=>{const [px,py]=pos[i],open=planetOpen(i),done=col.gal.done[i],on=x&&x.i===i;
    return `<g class="pn${open?'':' lock'}${on?' on':''}" data-p="${i}" transform="translate(${px} ${py})" role="button" tabindex="0">${planetSVG(P,i===5?30:22)}${i===5?'<circle r="40" fill="none" stroke="#b47aff" stroke-width="1.5" class="spinr" stroke-dasharray="4 6"/>':''}<text y="${i===5?52:40}" text-anchor="middle" font-size="12" font-weight="700" fill="${open?'#fff':'#8a93a2'}">${open?P.n:'🔒 '+P.n}</text>${done?`<text x="${i===5?30:22}" y="-${i===5?26:18}" font-size="13">${col.gal.art[i]?'🏺':'✅'}</text>`:''}</g>`}).join('');
  let ship='';if(x){const [ax,ay]=[180,560],[bx,by]=pos[x.i],k=Math.min(1,1-(x.end-Date.now())/1000/x.len);ship=`<g transform="translate(${ax+(bx-ax)*k} ${ay+(by-ay)*k}) rotate(${Math.atan2(by-ay,bx-ax)*180/Math.PI})"><path d="M-9 -3 L7 -3 L12 0 L7 3 L-9 3Z" fill="#eef2f6"/><path d="M-9 -2 L-16 0 L-9 2Z" fill="#ff9a3c" class="flame"/></g>`}
  const left=x?(x.end-Date.now())/1000:0;
  m.innerHTML=`<div class="hbox galx"><button class="csx" type="button" aria-label="إغلاق">✕</button><h3>🌌 خريطة المجرة</h3><small class="gsub">الفصل الثاني · الآثار: ${artCount()}/6 (+${artCount()*5}% إنتاج)</small>
    <svg viewBox="0 0 360 600" class="gmap"><rect width="360" height="600" fill="#05071a"/><ellipse cx="180" cy="300" rx="200" ry="120" fill="url(#gneb)"/><defs><radialGradient id="gneb"><stop offset="0" stop-color="#5a2a9a" stop-opacity=".45"/><stop offset="1" stop-color="#5a2a9a" stop-opacity="0"/></radialGradient></defs>${stars}<path d="M180 560 L70 480 ${path.slice(1).replace(/^[^L]*/,'')}" stroke="#00e5ff" stroke-width="1.2" stroke-dasharray="4 6" fill="none" opacity=".5"/><g transform="translate(180 560)"><circle r="14" fill="#7a5266"/><text y="4" text-anchor="middle" font-size="12">🏠</text></g>${nodes}${ship}</svg>
    <div class="gpanel">${x?(Date.now()>=x.end?`<p>🚀 عادت المركبة من <b>${PLANETS[x.i].n}</b>!</p><button class="btn main" data-gclaim>استلام الغنائم</button>`:`<p>🚀 في الطريق إلى <b>${PLANETS[x.i].n}</b> · <b class="gt">${fmtDur(left)}</b></p><button class="btn" data-grush>⚡ 💎 ${Math.max(1,Math.ceil(left/120))}</button>`):'<p>اختر كوكباً لترسل المركبة في رحلة.</p>'}</div><div class="gsel"></div></div>`;
  m.querySelector('.csx').onclick=()=>m.remove();const gc=m.querySelector('[data-gclaim]');if(gc)gc.onclick=()=>{m.remove();expClaim()};const gr=m.querySelector('[data-grush]');if(gr)gr.onclick=rushExp;
  m.querySelectorAll('.pn').forEach(g=>g.onclick=()=>{snd('tap');const i=+g.dataset.p,P=PLANETS[i],open=planetOpen(i),sel=m.querySelector('.gsel');
    sel.innerHTML=`<div class="gcard"><svg viewBox="-30 -30 60 60" width="54" height="54">${planetSVG(P,26)}</svg><div><b>${P.n}</b><small>${P.d}</small><small>⏱️ ${fmtDur(expDur(PLANETS.indexOf(P)))} · ${Object.entries(P.r).map(([r,n])=>'+'+fmtN(n)+RES[r][1]).join(' ')}${col.gal.art[i]?'':' · 🏺 '+P.art}</small></div>${open&&!x?`<button class="btn main" data-go2="${i}">🚀 انطلاق</button>`:''}</div>`;
    const b=sel.querySelector('[data-go2]');if(b)b.onclick=()=>expStart(i)})}

/* ---------- space trader: lands for a few minutes with three offers ---------- */
const TRD={on:0,end:0,next:0,offers:[]};
function traderTick(now){if(col.b.hq<3)return;if(!TRD.next)TRD.next=now+150000+Math.random()*200000;
  if(!TRD.on&&now>TRD.next){TRD.on=1;TRD.end=now+180000;const C=cap(),q=n=>Math.max(50,Math.round(C*n/50)*50);
    TRD.offers=[{give:{m:q(.18)},get:{c:6+col.b.hq}},{give:{c:8+col.b.hq},get:{e:q(.3),f:q(.2)}},{give:{f:q(.2)},get:{m:q(.22)}},{give:{e:q(.2)},get:{c:5+col.b.hq}}].sort(()=>Math.random()-0.5).slice(0,3);
    toast('🤖 نجم: تاجر فضائي هبط عند البوابة 🛸','ach');snd('ach');if(!$('hub').hidden)renderColony()}
  if(TRD.on&&now>TRD.end){TRD.on=0;TRD.next=now+900000+Math.random()*900000;closeSheet&&sheetId==='trader'&&closeSheet();if(!$('hub').hidden)renderColony()}}
function traderSVG(){if(!TRD.on)return '';const [x,y]=fp(Math.PI/2);return `<g class="trader" transform="translate(${x+46} ${y+40})" role="button" tabindex="0" aria-label="التاجر"><ellipse cx="0" cy="4" rx="22" ry="5" fill="#000" opacity=".35"/><path d="M-16 0 L-20 6 M16 0 L20 6" stroke="#8a93a2" stroke-width="1.6"/><ellipse cx="0" cy="-2" rx="20" ry="6" fill="url(#mUfo)"/><path d="M-9 -4 C-9 -15 9 -15 9 -4Z" fill="#ffd34d" opacity=".8"/><text y="-6" text-anchor="middle" font-size="9">💰</text><circle cx="-14" cy="-1" r="1.4" fill="#ffd34d" class="blink"/><circle cx="14" cy="-1" r="1.4" fill="#ffd34d" class="blink"/><g class="tsign" transform="translate(0 -26)"><rect x="-18" y="-8" width="36" height="14" rx="7" fill="#2a1a00" stroke="#ffd34d"/><text y="3" text-anchor="middle" font-size="8.5" fill="#ffd34d" font-weight="700">تاجر</text></g></g>`}
function traderHTML(){const left=fmtDur((TRD.end-performance.now())/1000);
  return `<h3 class="lh">🛸 التاجر الفضائي <small>يغادر بعد ${left}</small></h3><div class="blist">`+TRD.offers.map((o,i)=>{const ok=!o.done&&canPay(o.give);return `<div class="brow${ok?' ok':''}${o.done?' done':''}"><span class="ti">💱</span><span class="bt"><b>${Object.entries(o.give).map(([k,n])=>fmtN(n)+' '+RES[k][1]).join(' + ')} ← ${Object.entries(o.get).map(([k,n])=>fmtN(n)+' '+RES[k][1]).join(' + ')}</b><small>${o.done?'✔️ تمت':'تعطي ما على اليمين وتأخذ ما على اليسار'}</small></span>${o.done?'':`<button class="btn${ok?' main':''}" type="button" data-trade="${i}">تبادل</button>`}</div>`}).join('')+'</div>'}
function trade(i){const o=TRD.offers[i];if(!o||o.done)return;if(!canPay(o.give)){snd('err');toast('الموارد لا تكفي');return}pay(o.give);Object.entries(o.get).forEach(([k,n])=>gain(k,n));o.done=1;colSave();snd('win');buzz([15,30,15]);updRes();renderSheet()}

/* crew: little astronauts strolling between built structures inside the fence */
const CREW={w:[]};
function crewPts(){return Object.keys(SLOT).filter(k=>k!=='wall'&&k!=='tower'&&col.b[k]>0).map(k=>({x:SLOT[k][0]+(Math.random()-0.5)*30,y:SLOT[k][1]+14+Math.random()*8}))}
function crewInit(svg){const sh=svg.querySelector('#cshots');if(!sh)return;let g=svg.querySelector('#ccrew');if(!g){g=svgEl('g',{id:'ccrew'});sh.before(g)}g.innerHTML='';CREW.w=[];
  const n=Math.min(8,Math.max(0,crew()-2)),pts=crewPts();if(pts.length<2)return;
  const suits=['#f2f5fb','#ffd34d','#7ffcf0','#ff9f6b','#b9a4ff'];
  for(let i=0;i<n;i++){const p=pts[i%pts.length],e=svgEl('g',{class:'astro'});const su=suits[i%suits.length];
    e.innerHTML=`<ellipse cy="0.5" rx="4" ry="1.3" fill="#0005"/><g class="aflip"><rect x="-2.6" y="-7" width="5.2" height="6" rx="2" fill="${su}"/><rect x="-3.9" y="-6.4" width="1.6" height="4" rx=".8" fill="#9aa6bd"/><circle cy="-9.4" r="3.1" fill="${su}"/><path d="M-.6 -10.6 h2.6 a1.3 1.3 0 0 1 0 2.6 h-2.6z" fill="#2a3a7a"/><circle cx="1.6" cy="-10" r=".5" fill="#9ff"/><rect class="al1" x="-2" y="-1.4" width="1.6" height="2.4" rx=".7" fill="#9aa6bd"/><rect class="al2" x=".4" y="-1.4" width="1.6" height="2.4" rx=".7" fill="#9aa6bd"/></g>`;
    if(typeof ART!=='undefined'&&ART.astro){const h=21,w=h*ART.astroR,hue=[0,140,200,280,330,60,100,240][i%8];e.innerHTML=`<ellipse cy="0.5" rx="4" ry="1.3" fill="#0005"/><g class="aflip"><g class="aimg"><image href="${ART.astro}" x="${(-w/2).toFixed(1)}" y="${-h}" width="${w.toFixed(1)}" height="${h}"${hue?` style="filter:hue-rotate(${hue}deg)"`:''}/></g></g>`}
    g.appendChild(e);const q=pts[(i*3+1)%pts.length];CREW.w.push({e,f:e.firstChild.nextSibling,x:p.x,y:p.y,tx:q.x,ty:q.y,wait:Math.random()*3,sp:9+Math.random()*5})}
  CREW.w.forEach(w=>w.e.setAttribute('transform',`translate(${w.x.toFixed(1)} ${w.y.toFixed(1)}) scale(1.25)`))}
function crewTick(dt){if(!CREW.w.length)return;let pts=null;
  for(const w of CREW.w){if(!w.e.isConnected)continue;if(w.wait>0){w.wait-=dt;w.e.classList.remove('walk');continue}
    const dx=w.tx-w.x,dy=w.ty-w.y,d=Math.hypot(dx,dy);
    if(d<2){pts=pts||crewPts();const q=pts[Math.floor(Math.random()*pts.length)];w.tx=q.x;w.ty=q.y;w.wait=1.5+Math.random()*4;continue}
    w.x+=dx/d*w.sp*dt;w.y+=dy/d*w.sp*dt;w.e.classList.add('walk');w.f.setAttribute('transform',dx<0?'scale(-1 1)':'');
    w.e.setAttribute('transform',`translate(${w.x.toFixed(1)} ${w.y.toFixed(1)}) scale(1.25)`)}}
