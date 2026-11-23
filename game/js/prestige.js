/* relaunch (prestige): leave a grown colony for a harder new planet, keeping permanent bonuses */
const PLN=[{n:'المدار-1',em:'🔴',tint:null},{n:'زيفيروس الجليدي',em:'❄️',tint:'#6fc4ff'},{n:'كوكب الحمم',em:'🌋',tint:'#ff5a1f'},{n:'كوكب الكريستال',em:'💠',tint:'#b77dff'},{n:'العملاق الأخضر',em:'🟢',tint:'#4fc85a'},{n:'سديم المدار',em:'🌸',tint:'#ff5da8'}];
const PG=()=>col.pg||0,PLANET=()=>PLN[Math.min(PG(),PLN.length-1)];
const PREQ=()=>({hq:8+Math.min(2,PG()),ship:true});
const ARK=[['hull','هيكل السفينة','🛸',[3000,2500,800]],['engine','محركات الدفع','🔥',[2500,3500,600]],['fuel','خزانات الوقود','⛽',[2000,4000,1000]],['pods','كبسولات الطاقم','🧑‍🚀',[2500,2000,2500]],['nav','الملاحة الكوكبية','🧭',[3500,3000,1200]]];
const ARKMIN=20;
const arkCost=p=>{const f=1+0.6*PG();return {m:Math.round(p[3][0]*f),e:Math.round(p[3][1]*f),f:Math.round(p[3][2]*f)}};
const arkN=()=>ARK.filter(p=>col.ark&&col.ark[p[0]]).length;
const pgReady=()=>col.b.hq>=PREQ().hq&&!!col.done&&arkN()===ARK.length;
function arkTick(){const b=col.arkB;if(b&&Date.now()>=b.end){col.ark=col.ark||{};col.ark[b.k]=1;col.arkB=null;colSave();const p=ARK.find(x=>x[0]===b.k);snd('win');toast('🚀 اكتمل: '+(p?p[1]:''),'ach');if(sheetId==='prestige')renderSheet();if(!$('pColony').hidden)renderColony()}}
setInterval(arkTick,3000);
function arkBuild(k){const p=ARK.find(x=>x[0]===k);if(!p||col.arkB||(col.ark&&col.ark[k]))return;if(col.b.hq<PREQ().hq){toast('🔒 القيادة '+PREQ().hq);return}const c=arkCost(p);if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}
  accrue();pay(c);col.arkB={k,end:Date.now()+ARKMIN*60000};colSave();snd('build');renderSheet();updRes()}
function arkRush(){const b=col.arkB;if(!b)return;const cost=Math.max(1,Math.ceil((b.end-Date.now())/60000));if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}col.res.c-=cost;b.end=Date.now();arkTick();renderSheet();updRes()}
function arkHTML(){let h=`<div class="arkl"><b>🛠️ بناء سفينة الانطلاق ${arkN()}/${ARK.length}</b>`;
  for(const p of ARK){const done=col.ark&&col.ark[p[0]],cur=col.arkB&&col.arkB.k===p[0],c=arkCost(p),ok=!done&&!col.arkB&&col.b.hq>=PREQ().hq&&canPay(c);
    h+=`<div class="arkr${done?' done':''}"><span class="ae">${p[2]}</span><span class="an"><b>${p[1]}</b><small>${done?'✅ جاهز':cur?'⏳ قيد البناء · '+fmtDur(Math.max(0,(col.arkB.end-Date.now())/1000)):`⛏️ ${fmtN(c.m)} ⚡ ${fmtN(c.e)} 🌱 ${fmtN(c.f)} · ${ARKMIN}د`}</small></span>${done?'':cur?`<button type="button" class="btn" data-arkr>⚡ 💎 ${Math.max(1,Math.ceil((col.arkB.end-Date.now())/60000))}</button>`:`<button type="button" class="btn${ok?' main':''}" data-ark="${p[0]}" ${ok?'':'disabled'}>🔧 ابنِ</button>`}</div>`}
  return h+'</div>'}
// permanent bonus: +15% production per relaunch; the planet fights back harder
{const _mb=moraleBonus;moraleBonus=function(){return _mb()+0.15*PG()}}
if(typeof NEED!=='undefined'&&PG()){NEED.f*=1+0.2*PG();NEED.e*=1+0.2*PG()}
{const _rp=raidPlan;raidPlan=function(){_rp.apply(this,arguments);if(col.raid&&PG()){col.raid.str=Math.round(col.raid.str*(1+0.3*PG()));colSave()}}}
function pgHTML(){const P=PG(),nx=PLN[Math.min(P+1,PLN.length-1)],q=PREQ(),ok=pgReady();
  return `<h3 class="lh">🚀 إعادة الانطلاق</h3><div class="pgcard"><div class="pgnow">${PLANET().em} أنت الآن على <b>${PLANET().n}</b> · انطلاقة رقم <b>${P+1}</b></div>
  <p>ابنِ سفينة الانطلاق على المنصة خارج القبة، ثم حمّل الطاقم وطِر إلى كوكب جديد أصعب. تبدأ البناء من جديد، لكنك تحمل معك مكافآت دائمة.</p>
  <div class="pgcols"><div><b>✅ تحتفظ بـ</b><ul><li>💎 كل الجواهر</li><li>🏺 القطع الأثرية والآثار</li><li>🤖 روبوت البناء الثاني</li><li>🏅 الأوسمة والرتبة</li><li>🚀 المركبة والقصة والمعارك</li></ul></div>
  <div><b>🔄 يبدأ من جديد</b><ul><li>المباني والموارد</li><li>الأبحاث</li><li>الاستصلاح</li></ul></div></div>
  <div class="pgnext"><b>${nx.em} الكوكب التالي: ${nx.n}</b><ul><li>📈 إنتاج دائم <b>+${15*(P+1)}%</b></li><li>💎 هدية انطلاق <b>+${50*(P+1)}</b></li><li>📦 موارد بداية ×${P+2}</li><li>⚠️ غارات أقوى +${30*(P+1)}% واستهلاك الطاقم +${20*(P+1)}%</li></ul></div>
  <div class="pgreq"><span class="${col.b.hq>=q.hq?'ok':''}">🏛️ القيادة ${col.b.hq}/${q.hq}</span><span class="${col.done?'ok':''}">🔧 ${col.done?'المركبة الأولى مُصلحة':'أصلح المركبة أولاً'}</span><span class="${arkN()===ARK.length?'ok':''}">🚀 السفينة ${arkN()}/${ARK.length}</span></div>${arkHTML()}
  <button type="button" class="btn${ok?' main':''}" data-pg ${ok?'':'disabled'}>${ok?'🚀 انطلق إلى '+nx.n:'🔒 لم تكتمل الشروط'}</button></div>`}
function pgGo(){if(!pgReady())return;const P=PG(),nx=PLN[Math.min(P+1,PLN.length-1)];
  confirmBox(`🚀 الانطلاق إلى ${nx.n}؟ ستبدأ المباني والموارد والأبحاث والاستصلاح من جديد، وتحتفظ بالجواهر والقطع الأثرية والأوسمة، وتحصل على +${15*(P+1)}% إنتاج دائم.`,()=>{
    closeSheet();flight(nx,()=>doRelaunch(P,nx))})}
function doRelaunch(P,nx){{
    const N=P+1,k=N+1;col.pg=N;col.ark={};col.arkB=null;col.pgAt=Date.now();
    col.b={hq:1,mine:1,solar:1,farm:1,habitat:1,radio:0,obs:0,def:0,dock:0,wall:0,tower:0,lab:0};
    col.res={m:300*k,e:300*k,f:200*k,c:(col.res.c||0)+50*N};col.store={mine:40,solar:40,farm:30};col.build=null;col.build2=null;col.rs=null;col.tech={};delete col.tf;delete col.tspec;
    if(col.sv){col.sv.morale=85;col.sv.storm=0}col.raidAll=(col.raidAll||0)+(col.raidWins||0);col.raidWins=0;col.raid=null;col.raidN=0;col.qhide=1;col.last=Date.now();colSave();
    if(typeof unlock==='function'){unlock('pg1');if(N>=3)unlock('pg3');if(N>=5)unlock('pg5')}
    snd('win');try{celebrate&&celebrate()}catch(e){}toast(`🚀 وصلت إلى ${nx.n}! ابدأ مستعمرتك الجديدة`,'ach');setTimeout(()=>location.reload(),1600)}}
{const _rs=renderSheet;renderSheet=function(){if(sheetId==='prestige'){const c=$('csheet').querySelector('.csc');c.innerHTML=pgHTML();const b=c.querySelector('[data-pg]');if(b)b.onclick=pgGo;c.querySelectorAll('[data-ark]').forEach(x=>x.onclick=()=>arkBuild(x.dataset.ark));const r=c.querySelector('[data-arkr]');if(r)r.onclick=arkRush;return}_rs()}}
{const _fc=festChip;festChip=function(){const show=col.b.hq>=6||PG()>0;return (show?`<button class="cpg${pgReady()?' ready':''}" type="button" aria-label="إعادة الانطلاق">${PLANET().em}${PG()?`<i>${PG()+1}</i>`:''}</button>`:'')+_fc()}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.cpg')){snd('tap');openSheet('prestige')}});
// each planet tints the ground in its own colour
{const _sv=sceneSVG;sceneSVG=function(){const s=_sv.apply(this,arguments),t=PLANET().tint;if(!t)return s;let i=s.indexOf('<g class="corr"');if(i<0)i=s.indexOf('<g class="cb');if(i<0)return s;return s.slice(0,i)+`<rect x="-700" y="225" width="1760" height="1100" fill="${t}" opacity=".38" style="mix-blend-mode:color" pointer-events="none"/>`+s.slice(i)}}
if(typeof ACH!=='undefined')ACH.push(['pg1','🌍','أول إعادة انطلاق'],['pg3','🌋','الوصول للكوكب الرابع'],['pg5','🌸','سديم المدار']);

function flight(nx,done){const o=document.createElement('div');o.className='flight';const im=ART&&ART.x_ship;
  o.innerHTML=`<div class="fstars"></div><div class="fplanet" style="--pc:${nx.tint||'#c06a4a'}"></div><div class="fship">${im?`<img src="${im}" alt="">`:'🚀'}<i class="fflame"></i></div><div class="ftxt">🚀 السفينة تنطلق...</div>`;
  document.body.appendChild(o);snd('bigboom');try{buzz([40,60,40,60,80])}catch(e){}
  setTimeout(()=>{o.querySelector('.ftxt').textContent='✨ عبور الفضاء العميق'},1600);
  setTimeout(()=>{o.classList.add('arrive');o.querySelector('.ftxt').textContent=nx.em+' الوصول إلى '+nx.n;snd('win')},3200);
  setTimeout(()=>{done()},5000)}
// the launch pad and the ship under construction, outside the dome
function padSVG(){if(!(col.b.hq>=6||PG()>0))return '';const n=arkN(),full=n===ARK.length,im=ART&&ART.x_ship,x=338,y=712,bl=!!col.arkB;
  let s=`<g class="arkpad" transform="translate(${x} ${y})" role="button" aria-label="سفينة الانطلاق"><ellipse rx="40" ry="12" fill="#2a2e3a" stroke="#8b96a6" stroke-width="2"/><ellipse rx="28" ry="8" fill="none" stroke="#ffd34d" stroke-width="1.4" stroke-dasharray="4 4"/>`;
  if(im)s+=`<g transform="translate(0 -38) rotate(-90)"><image href="${im}" x="-40" y="-20" width="80" height="${(80/(ART.x_shipR||1.6)).toFixed(1)}" style="${full?'':'filter:grayscale(.8) brightness(1.1)'}" opacity="${(0.3+0.7*n/ARK.length).toFixed(2)}"/></g>`;
  if(!full)s+=`<path d="M-22 0 V-80 M22 0 V-80 M-22 -26 H22 M-22 -52 H22 M-22 -26 L22 -52 M-22 -80 H22" stroke="#ffd34d" stroke-width="1.6" fill="none" opacity=".85"/>${bl?'<g class="fx-spark"><path d="M8 -40l5 -4M8 -40l-4 -5M8 -40l5 3" stroke="#fff3a0" stroke-width="1.4" stroke-linecap="round"/></g>':''}`;
  else s+=`<ellipse class="arkglow" cy="-4" rx="20" ry="6" fill="#ffb347" opacity=".5"/>`;
  s+=`<g transform="translate(0 22)"><rect x="-26" y="-9" width="52" height="16" rx="8" fill="#0b1226cc" stroke="${full?'#00e5ff':'#ffd34d'}"/><text y="3" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">🚀 ${n}/${ARK.length}</text></g></g>`;return s}
{const _sv3=sceneSVG;sceneSVG=function(){const s=_sv3.apply(this,arguments);const i=s.indexOf('<g class="cb');return i<0?s:s.slice(0,i)+padSVG()+s.slice(i)}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.arkpad')&&!(typeof camDrag!=='undefined'&&camDrag)){snd('tap');openSheet('prestige')}});
