/* relaunch (prestige): leave a grown colony for a harder new planet, keeping permanent bonuses */
const PLN=[{n:'المدار-1',em:'🔴',tint:null},{n:'زيفيروس الجليدي',em:'❄️',tint:'#6fc4ff'},{n:'كوكب الحمم',em:'🌋',tint:'#ff5a1f'},{n:'كوكب الكريستال',em:'💠',tint:'#b77dff'},{n:'العملاق الأخضر',em:'🟢',tint:'#4fc85a'},{n:'سديم المدار',em:'🌸',tint:'#ff5da8'}];
const PG=()=>col.pg||0,PLANET=()=>PLN[Math.min(PG(),PLN.length-1)];
const PREQ=()=>({hq:8+Math.min(2,PG()),ship:true});
const pgReady=()=>col.b.hq>=PREQ().hq&&!!col.done;
// permanent bonus: +15% production per relaunch; the planet fights back harder
{const _mb=moraleBonus;moraleBonus=function(){return _mb()+0.15*PG()}}
if(typeof NEED!=='undefined'&&PG()){NEED.f*=1+0.2*PG();NEED.e*=1+0.2*PG()}
{const _rp=raidPlan;raidPlan=function(){_rp.apply(this,arguments);if(col.raid&&PG()){col.raid.str=Math.round(col.raid.str*(1+0.3*PG()));colSave()}}}
function pgHTML(){const P=PG(),nx=PLN[Math.min(P+1,PLN.length-1)],q=PREQ(),ok=pgReady();
  return `<h3 class="lh">🚀 إعادة الانطلاق</h3><div class="pgcard"><div class="pgnow">${PLANET().em} أنت الآن على <b>${PLANET().n}</b> · انطلاقة رقم <b>${P+1}</b></div>
  <p>عندما تكبر مستعمرتك، حمّل الطاقم في المركبة وانطلق إلى كوكب جديد أصعب. تبدأ البناء من جديد، لكنك تحمل معك مكافآت دائمة.</p>
  <div class="pgcols"><div><b>✅ تحتفظ بـ</b><ul><li>💎 كل الجواهر</li><li>🏺 القطع الأثرية والآثار</li><li>🤖 روبوت البناء الثاني</li><li>🏅 الأوسمة والرتبة</li><li>🚀 المركبة والقصة والمعارك</li></ul></div>
  <div><b>🔄 يبدأ من جديد</b><ul><li>المباني والموارد</li><li>الأبحاث</li><li>الاستصلاح</li></ul></div></div>
  <div class="pgnext"><b>${nx.em} الكوكب التالي: ${nx.n}</b><ul><li>📈 إنتاج دائم <b>+${15*(P+1)}%</b></li><li>💎 هدية انطلاق <b>+${50*(P+1)}</b></li><li>📦 موارد بداية ×${P+2}</li><li>⚠️ غارات أقوى +${30*(P+1)}% واستهلاك الطاقم +${20*(P+1)}%</li></ul></div>
  <div class="pgreq"><span class="${col.b.hq>=q.hq?'ok':''}">🏛️ القيادة ${col.b.hq}/${q.hq}</span><span class="${col.done?'ok':''}">🚀 ${col.done?'المركبة مُصلحة':'أصلح المركبة أولاً'}</span></div>
  <button type="button" class="btn${ok?' main':''}" data-pg ${ok?'':'disabled'}>${ok?'🚀 انطلق إلى '+nx.n:'🔒 لم تكتمل الشروط'}</button></div>`}
function pgGo(){if(!pgReady())return;const P=PG(),nx=PLN[Math.min(P+1,PLN.length-1)];
  confirmBox(`🚀 الانطلاق إلى ${nx.n}؟ ستبدأ المباني والموارد والأبحاث والاستصلاح من جديد، وتحتفظ بالجواهر والقطع الأثرية والأوسمة، وتحصل على +${15*(P+1)}% إنتاج دائم.`,()=>{
    const N=P+1,k=N+1;col.pg=N;col.pgAt=Date.now();
    col.b={hq:1,mine:1,solar:1,farm:1,habitat:1,radio:0,obs:0,def:0,dock:0,wall:0,tower:0,lab:0};
    col.res={m:300*k,e:300*k,f:200*k,c:(col.res.c||0)+50*N};col.store={mine:40,solar:40,farm:30};col.build=null;col.build2=null;col.rs=null;col.tech={};delete col.tf;delete col.tspec;
    if(col.sv){col.sv.morale=85;col.sv.storm=0}col.raid=null;col.raidN=0;col.qhide=1;col.last=Date.now();colSave();
    if(typeof unlock==='function'){unlock('pg1');if(N>=3)unlock('pg3');if(N>=5)unlock('pg5')}
    snd('win');try{celebrate&&celebrate()}catch(e){}toast(`🚀 وصلت إلى ${nx.n}! ابدأ مستعمرتك الجديدة`,'ach');setTimeout(()=>location.reload(),1600)})}
{const _rs=renderSheet;renderSheet=function(){if(sheetId==='prestige'){const c=$('csheet').querySelector('.csc');c.innerHTML=pgHTML();const b=c.querySelector('[data-pg]');if(b)b.onclick=pgGo;return}_rs()}}
{const _fc=festChip;festChip=function(){const show=col.b.hq>=6||PG()>0;return (show?`<button class="cpg${pgReady()?' ready':''}" type="button" aria-label="إعادة الانطلاق">${PLANET().em}${PG()?`<i>${PG()+1}</i>`:''}</button>`:'')+_fc()}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.cpg')){snd('tap');openSheet('prestige')}});
// each planet tints the ground in its own colour
{const _sv=sceneSVG;sceneSVG=function(){const s=_sv.apply(this,arguments),t=PLANET().tint;if(!t)return s;let i=s.indexOf('<g class="corr"');if(i<0)i=s.indexOf('<g class="cb');if(i<0)return s;return s.slice(0,i)+`<rect x="-700" y="225" width="1760" height="1100" fill="${t}" opacity=".38" style="mix-blend-mode:color" pointer-events="none"/>`+s.slice(i)}}
if(typeof ACH!=='undefined')ACH.push(['pg1','🌍','أول إعادة انطلاق'],['pg3','🌋','الوصول للكوكب الرابع'],['pg5','🌸','سديم المدار']);
