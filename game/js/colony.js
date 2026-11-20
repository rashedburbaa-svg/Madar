/* ================= مستعمرة المدار: the main screen =================
   The ship crashed on an unknown planet. Build the colony, keep it producing (also while the app is closed),
   play the story games as colony tasks for resources, and repair the five parts of the ship. */
const RES={m:['معادن','⛏️','#c9b8a6'],e:['طاقة','⚡','#ffd34d'],f:['غذاء','🌱','#7ddc5a'],c:['كريستال','💎','#9fe8ff']};
const BLD={
  hq:{name:'مركز القيادة',base:[200,150,100],max:10,desc:'قلب المستعمرة: يرفع سعة المخازن، وكل مبنى يمكن أن يسبقه بمستوى واحد فقط.'},
  mine:{name:'منجم المعادن',base:[60,80,30],prod:['m',60],game:'mines',task:'تمشيط حقل التعدين',desc:'يستخرج المعادن من صخور الكوكب.'},
  solar:{name:'محطة الطاقة',base:[80,50,30],prod:['e',60],game:'grid',task:'إصلاح شبكة الطاقة',desc:'ألواح شمسية تمدّ المستعمرة بالطاقة.'},
  farm:{name:'المزرعة المائية',base:[70,70,20],prod:['f',45],desc:'قبة زجاجية تزرع غذاء الروّاد.'},
  habitat:{name:'المساكن',base:[100,80,80],desc:'كل مستوى يستقبل رائدَين، وكل رائد يرفع الإنتاج 4%.'},
  radio:{name:'برج الاتصالات',base:[150,120,40],req:2,prod:['c',0.6],game:'words',task:'فك شفرة إشارة',desc:'يلتقط إشارات غامضة، وينتج قليلاً من الكريستال.'},
  obs:{name:'المرصد',base:[160,140,60],req:2,game:'diff',task:'تحليل صور القمر الصناعي',desc:'يدرس صور الكوكب بحثاً عن أرض خصبة وكنوز.'},
  def:{name:'منظومة الدفاع',base:[220,180,60],req:3,game:'survive',task:'صد غارة الكائنات',desc:'تحمي المستعمرة، وكل مستوى يزيد غنائم الغارات 20%.'},
  dock:{name:'حوض الإصلاح',base:[250,200,80],req:2,desc:'هنا تُصلَح أجزاء المركبة لتنطلق من جديد.'}
};
const BORDER=['hq','mine','solar','farm','habitat','radio','obs','def','dock'];
const PARTS=[['engine','المحرك',[400,400,100,10]],['nav','نظام الملاحة',[650,700,160,20]],['shield','الدرع الحراري',[1000,850,300,30]],['antenna','هوائي الاتصال',[1400,1500,420,45]],['hull','الهيكل',[2200,2000,800,60]]];
const GAMEOF={mines:'mine',grid:'solar',words:'radio',diff:'obs',survive:'def'};
const col=load('arcade-colony',{res:{m:300,e:300,f:200,c:20},b:{hq:1,mine:1,solar:1,farm:1,habitat:1,radio:0,obs:0,def:0,dock:0},build:null,last:Date.now(),q:0,ship:{},intro:0,wins:{},surv:0,done:0});
const colSave=()=>save('arcade-colony',col);
const cap=()=>Math.round(600*Math.pow(1.7,col.b.hq-1));
const crew=()=>3+2*col.b.habitat;
const mult=()=>1+0.04*crew();
function rate(k){let r=0;for(const id of BORDER){const B=BLD[id],L=col.b[id];if(B.prod&&B.prod[0]===k&&L>0)r+=B.prod[1]*L*Math.pow(1.15,L-1)}return r*mult()}
function upCost(id){const L=col.b[id],B=BLD[id],f=Math.pow(1.6,L);return {m:Math.round(B.base[0]*f),e:Math.round(B.base[1]*f),f:Math.round(B.base[2]*f)}}
const upTime=id=>Math.round(20*Math.pow(1.75,col.b[id]));
const canPay=c=>Object.keys(c).every(k=>col.res[k]>=c[k]);
function pay(c){Object.keys(c).forEach(k=>col.res[k]-=c[k])}
function gain(k,n){if(k==='c'){col.res.c+=n;return}const C=cap();col.res[k]=Math.max(col.res[k],Math.min(C,col.res[k]+n))}
const fmtN=n=>{n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(n)};
const fmtDur=s=>{s=Math.max(0,Math.ceil(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+'س '+m+'د':m?m+'د '+x+'ث':x+'ث'};
// production accrues from the last visit, up to 24 hours away
function accrue(){const now=Date.now(),last=col.last||now;col.last=now;let dt=Math.min(24,Math.max(0,(now-last)/3600000));
  if(col.build&&now>=col.build.end){const sp=Math.max(0,(col.build.end-last)/3600000);for(const k of 'mefc')gain(k,rate(k)*Math.min(dt,sp));dt=Math.max(0,dt-sp);finishBuild()}
  for(const k of 'mefc')gain(k,rate(k)*dt)}
function finishBuild(){const b=col.build;if(!b)return;col.build=null;col.b[b.id]++;colSave();snd('ach');buzz([20,30,20]);
  toast('🏗️ '+BLD[b.id].name+' '+col.b[b.id],'ach');if(col.b.hq>=5)unlock('col_hq5');if(BORDER.every(id=>col.b[id]>0))unlock('col_all');questCheck()}
function startBuild(id){accrue();const B=BLD[id],L=col.b[id];
  if(col.build){toast('🏗️ البناء مشغول');return}
  if(B.req&&col.b.hq<B.req){toast('🔒 القيادة '+B.req);return}
  if(id!=='hq'&&L>col.b.hq){toast('🔒 طوّر القيادة أولاً');return}
  if(L>=(B.max||10)){toast('✔️ الأعلى');return}
  const c=upCost(id);if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}
  pay(c);col.build={id,end:Date.now()+upTime(id)*1000,len:upTime(id)};colSave();snd('ok');buzz(15);renderColony()}
function rush(){accrue();if(!col.build)return;const left=(col.build.end-Date.now())/1000,cost=Math.max(1,Math.ceil(left/60));
  if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}
  col.res.c-=cost;col.build.end=Date.now();accrue();colSave();renderColony()}
function repair(i){accrue();const [pid,name,c]=PARTS[i],need={m:c[0],e:c[1],f:c[2],c:c[3]};
  if(col.ship[pid])return;if(i>0&&!col.ship[PARTS[i-1][0]]){toast('أصلح '+PARTS[i-1][1]+' أولاً');return}
  if(col.b.dock<i+1){toast('يحتاج حوض الإصلاح مستوى '+(i+1));return}
  if(!canPay(need)){snd('err');toast('الموارد لا تكفي');return}
  pay(need);col.ship[pid]=Date.now();colSave();snd('win');buzz([20,40,60]);toast('🔧 تم إصلاح '+name,'ach');questCheck();
  if(PARTS.every(p=>col.ship[p[0]])){unlock('col_ship');setTimeout(chapterDone,600)}renderColony()}
/* every win in a story game feeds the colony; the task building's level raises the reward */
function colonyReward(id,stars,info){const bid=GAMEOF[id];if(!bid)return;accrue();info=info||{};const L=Math.max(1,col.b[bid]),k=1+0.3*(L-1);let got=[];
  if(id==='survive'){const t=info.time||0;if(t<10)return;const d=1+0.2*col.b.def;col.surv=Math.max(col.surv||0,t);
    got=[['m',t*1.4*d],['e',t*1.2*d],['f',t*0.9*d],['c',Math.floor(t/30)+(info.boss||0)*5]]}
  else{col.wins[id]=(col.wins[id]||0)+1;const base=(50+30*stars)*k;
    got=id==='mines'?[['m',base*1.4],['c',stars]]:id==='grid'?[['e',base*1.4],['c',stars]]:id==='words'?[['c',2+2*stars],['f',base*0.6]]:[['f',base*1.2],['c',1+stars]]}
  got=got.map(([r,n])=>[r,Math.round(n)]).filter(x=>x[1]>0);got.forEach(([r,n])=>gain(r,n));colSave();questCheck();
  setTimeout(()=>toast(got.map(([r,n])=>'+'+fmtN(n)+' '+RES[r][1]).join('  ')),900)}

/* chapter one: guided objectives told by «نجم», the ship's assistant */
const QUESTS=[
  {b:'mine',t:'طوّر منجم المعادن إلى المستوى 2',ok:()=>col.b.mine>=2,r:{e:120},say:'القائد؟ أنا نجم، مساعد المركبة. تحطّمنا، لكن الطاقم بخير. نحتاج معادن أولاً.'},
  {t:'أصلح شبكة الطاقة: اربح مستوى في «شبكة المدار»',ok:()=>(col.wins.grid||0)>=1,r:{m:150},go:'grid',say:'الشبكة الكهربائية تضررت في الهبوط. وصّل القطع لتضيء المستعمرة.'},
  {b:'hq',t:'طوّر مركز القيادة إلى المستوى 2',ok:()=>col.b.hq>=2,r:{f:150},say:'مركز قيادة أكبر يعني مخازن أكبر ومبانيَ جديدة.'},
  {t:'امسح حقل التعدين: اربح مستوى في «حقل الكويكبات»',ok:()=>(col.wins.mines||0)>=1,r:{e:200},go:'mines',say:'وجدنا عروقاً غنية بالمعادن، لكن حولها صخور متفجرة. امشِ بحذر.'},
  {b:'radio',t:'ابنِ برج الاتصالات',ok:()=>col.b.radio>=1,r:{m:200,c:5},say:'أسمع تشويشاً في اللاسلكي… كأن أحداً يرسل لنا. نحتاج برجاً.'},
  {t:'فك أول شفرة: اربح مستوى في «الكلمات المتقاطعة»',ok:()=>(col.wins.words||0)>=1,r:{c:10},go:'words',say:'الإشارة مشفّرة بالكلمات! حلّ الشبكة لنفهم الرسالة.'},
  {b:'farm',t:'طوّر المزرعة المائية إلى المستوى 3',ok:()=>col.b.farm>=3,r:{m:250,e:250},say:'الرسالة تقول: «لستم أول من سقط هنا». الطاقم جائع وقلق… لنزرع أكثر.'},
  {b:'obs',t:'ابنِ المرصد',ok:()=>col.b.obs>=1,r:{f:250},say:'من المرصد نرى الكوكب كله. ربما نجد حطام من سبقونا.'},
  {t:'حلّل صور القمر الصناعي: اربح مستوى في «أوجد الاختلاف»',ok:()=>(col.wins.diff||0)>=1,r:{c:15},go:'diff',say:'قارن الصورتين: كل اختلاف أثرٌ لشيء يتحرك على السطح.'},
  {b:'hq',t:'طوّر مركز القيادة إلى المستوى 3',ok:()=>col.b.hq>=3,r:{m:400,e:300},say:'الصور كشفت كائنات تقترب من المستعمرة. يجب أن نستعد.'},
  {b:'def',t:'ابنِ منظومة الدفاع',ok:()=>col.b.def>=1,r:{f:300},say:'الدفاع أولاً. إن جاءت الغارة نريد أن نصمد.'},
  {t:'صدّ الغارة: اصمد دقيقتين في «صمود المدار»',ok:()=>(col.surv||0)>=120,r:{c:25},go:'survive',say:'إنهم هنا! اخرج بالبدلة وأبعدهم عن المباني.'},
  {b:'dock',t:'ابنِ حوض الإصلاح',ok:()=>col.b.dock>=1,r:{m:300,e:300},say:'صدّيناهم. حان وقت العمل الحقيقي: إصلاح المركبة والخروج من هنا.'},
  {b:'dock',t:'أصلح محرك المركبة',ok:()=>!!col.ship.engine,r:{c:20},say:'المحرك أهم جزء. بدونه لن نرتفع متراً واحداً.'},
  {b:'habitat',t:'طوّر المساكن إلى المستوى 4',ok:()=>col.b.habitat>=4,r:{m:500,f:400},say:'وصلتنا إشارة استغاثة من ناجين آخرين! سنستقبلهم، وسيساعدوننا في العمل.'},
  {b:'dock',t:'أصلح نظام الملاحة',ok:()=>!!col.ship.nav,r:{c:30},say:'الملاحة تعمل. الإحداثيات تشير إلى مصدر الإشارة الغامضة… خارج هذا الكوكب.'},
  {b:'hq',t:'طوّر مركز القيادة إلى المستوى 5',ok:()=>col.b.hq>=5,r:{e:800,f:500},say:'نحتاج مستعمرة أقوى لنصنع بقية الأجزاء الثقيلة.'},
  {b:'dock',t:'أصلح الدرع الحراري والهوائي',ok:()=>!!(col.ship.shield&&col.ship.antenna),r:{c:40},say:'الدرع يحمينا عند الخروج من الغلاف الجوي، والهوائي يبقينا على اتصال.'},
  {b:'dock',t:'أصلح الهيكل وأكمل المركبة',ok:()=>PARTS.every(p=>col.ship[p[0]]),r:{c:60},say:'آخر جزء! بعدها ننطلق لنكشف سرّ الإشارة.'}
];
function questCheck(){let changed=false;while(col.q<QUESTS.length&&QUESTS[col.q].ok()){const Q=QUESTS[col.q];Object.entries(Q.r).forEach(([k,n])=>gain(k,n));
    toast('✅ '+Object.entries(Q.r).map(([k,n])=>'+'+n+' '+RES[k][1]).join(' '),'ach');col.q++;changed=true;addXP(25)}
  if(changed)colSave();return changed}
function storyBox(title,text,label,fn){const m=document.createElement('div');m.className='hmodal';m.style.zIndex=40;
  m.innerHTML='<div class="hbox cstory"><div class="cav">🤖</div><h3></h3><p></p><button class="btn main" type="button"></button></div>';
  m.querySelector('h3').textContent=title;m.querySelector('p').textContent=text;const b=m.querySelector('button');b.textContent=label;b.onclick=()=>{m.remove();fn&&fn()};document.body.appendChild(m);b.focus();return m}
function chapterDone(){if(col.done)return;col.done=1;colSave();
  const m=storyBox('المركبة جاهزة! 🚀','اكتمل الفصل الأول. الفصل الثاني قريباً.','رائع');celebrate(m.querySelector('.hbox'))}

const ADEFS=`<defs>
<linearGradient id="kMf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aeb9c7"/><stop offset="1" stop-color="#6c7788"/></linearGradient>
<linearGradient id="kMs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7a8c"/><stop offset="1" stop-color="#434b5a"/></linearGradient>
<linearGradient id="kMt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3e9ef"/><stop offset="1" stop-color="#b9c3cf"/></linearGradient>
<linearGradient id="kCyl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset=".45" stop-color="#c7d0da"/><stop offset="1" stop-color="#6a7686"/></linearGradient>
<linearGradient id="kCylH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef2f6"/><stop offset=".55" stop-color="#a9b4c2"/><stop offset="1" stop-color="#5a6575"/></linearGradient>
<radialGradient id="kDome" cx="32%" cy="28%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d6e2ee"/><stop offset=".8" stop-color="#8495ad"/><stop offset="1" stop-color="#5c6b82"/></radialGradient>
<radialGradient id="kGlass" cx="30%" cy="25%" r="85%"><stop offset="0" stop-color="#e8fff6" stop-opacity=".75"/><stop offset=".5" stop-color="#7fe0c8" stop-opacity=".35"/><stop offset="1" stop-color="#2f7f8a" stop-opacity=".5"/></radialGradient>
<linearGradient id="kSolar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8fe8"/><stop offset=".45" stop-color="#1d3f8f"/><stop offset="1" stop-color="#0d1d4a"/></linearGradient>
<linearGradient id="kRock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a08672"/><stop offset="1" stop-color="#4a3a30"/></linearGradient>
<linearGradient id="kDish" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8d9aab"/></linearGradient>
<linearGradient id="kHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset=".5" stop-color="#c3ccd6"/><stop offset="1" stop-color="#6d7887"/></linearGradient>
<linearGradient id="kHullD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8f98"/><stop offset=".5" stop-color="#5d626c"/><stop offset="1" stop-color="#32363e"/></linearGradient>
<radialGradient id="kLamp"><stop offset="0" stop-color="#fff3c0"/><stop offset=".4" stop-color="#ffd36a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></radialGradient>
<radialGradient id="kShield" cx="50%" cy="90%" r="90%"><stop offset=".6" stop-color="#9fe8ff" stop-opacity="0"/><stop offset="1" stop-color="#9fe8ff" stop-opacity=".35"/></radialGradient>
</defs>`;
const _sh=(rx,ry)=>`<ellipse cx="${(rx*0.18).toFixed(1)}" cy="1" rx="${rx}" ry="${ry||rx*0.26}" fill="#000" opacity=".38"/>`;
/* a box seen from the front-left: front face, lit top, shaded right side */
function _box(x,y,w,h,d,front,top,side,stroke){const e=d*0.55,s=stroke?` stroke="${stroke}" stroke-width=".5"`:'';
  return `<path d="M${x+w} ${y} l${d} ${-e} v${-h} l${-d} ${e}Z" fill="${side||'url(#kMs)'}"${s}/><path d="M${x} ${y-h} l${d} ${-e} h${w} l${-d} ${e}Z" fill="${top||'url(#kMt)'}"${s}/><rect x="${x}" y="${y-h}" width="${w}" height="${h}" fill="${front||'url(#kMf)'}"${s}/>`}
const _win=(x,y,n,gap,w,h,c)=>{let s='';for(let i=0;i<n;i++)s+=`<rect x="${x+i*gap}" y="${y}" width="${w}" height="${h}" rx=".6" fill="${c||'#ffd36a'}"/>`;return s};
function _lattice(x0,w0,x1,w1,y0,y1,n,c){let s=`<path d="M${x0} ${y0} L${x1} ${y1} M${x0+w0} ${y0} L${x1+w1} ${y1}" stroke="${c}" stroke-width="1.7" fill="none"/>`,p='';
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,ya=y0+(y1-y0)*t0,yb=y0+(y1-y0)*t1,la=x0+(x1-x0)*t0,lb=x0+(x1-x0)*t1,ra=la+w0+(w1-w0)*t0,rb=lb+w0+(w1-w0)*t1;p+=`M${la} ${ya}L${rb} ${yb}M${ra} ${ya}L${lb} ${yb}M${lb} ${yb}H${rb}`}
  return s+`<path d="${p}" stroke="${c}" stroke-width=".8" fill="none" opacity=".85"/>`}
function art(id,L){L=Math.max(0,L);switch(id){
case 'hq':{let s=_sh(40,9);
  if(L>=3)s+=_box(-48,0,16,10,7)+_win(-46,-7,3,5,3,2.5);
  if(L>=5)s+=_box(30,0,12,26,7)+_win(32,-23,2,5,3,3)+_win(32,-16,2,5,3,3)+_win(32,-9,2,5,3,3);
  s+=_box(-30,0,58,13,10)+`<rect x="-28" y="-10" width="54" height="4" fill="#0b1830"/>${_win(-26,-9.5,9,6,4,3,'#5ff2d6')}<rect x="-6" y="-7" width="10" height="7" fill="#26324a"/><rect x="-5" y="-6" width="8" height="6" fill="#ffd36a" opacity=".85"/>`;
  s+=`<ellipse cx="4" cy="-18" rx="27" ry="4.5" fill="#7c8aa0"/><path d="M-22 -18 A26 25 0 0 1 30 -18 Z" fill="url(#kDome)"/><path d="M4 -43 A9 25 0 0 0 -5 -18 M4 -43 A9 25 0 0 1 13 -18 M-19 -28 Q4 -33 27 -28" stroke="#6e7f98" stroke-width=".7" fill="none" opacity=".8"/><ellipse cx="-6" cy="-32" rx="6" ry="3.2" fill="#fff" opacity=".55" transform="rotate(-30 -6 -32)"/>`;
  s+=`<path d="M4 -43 V-58" stroke="#c9d3dc" stroke-width="1.6"/><path d="M4 -52 l7 -4" stroke="#c9d3dc" stroke-width="1"/><ellipse cx="12" cy="-57" rx="4" ry="2" fill="url(#kDish)" transform="rotate(-30 12 -57)"/><circle cx="4" cy="-59" r="1.8" fill="#ff5d73" class="blink"/>`;
  if(L>=7)s+=`<ellipse cx="4" cy="-18" rx="31" ry="6" fill="none" stroke="#ffd34d" stroke-width="1.2" opacity=".8"/>`;
  return s}
case 'mine':{let s=_sh(34,8);
  s+=`<path d="M14 0 L20 -9 L27 -12 L34 -5 L36 0Z" fill="url(#kRock)"/><path d="M18 -4 l3 -5 l3 4Z M28 -6 l2 -4 l2 4Z" fill="#7fe8ff" opacity=".9"/><path d="M24 -2 l2 -4 l2 4Z" fill="#b47aff"/>`;
  s+=`<path d="M2 -7 L20 -13 L22 -10 L4 -4Z" fill="#2b3240"/><path d="M4 -6 L21 -12" stroke="#5a6475" stroke-width=".6" stroke-dasharray="1.5 2"/>`;
  s+=_box(-28,0,34,6,9,'url(#kMf)','url(#kMt)','url(#kMs)')+`<path d="M-28 -1 h34" stroke="#ffd34d" stroke-width="2" stroke-dasharray="3 3"/>`;
  s+=_box(-26,-6,14,11,6)+`<path d="M-24 -13 h9 M-24 -11 h9 M-24 -9 h9" stroke="#4a5262" stroke-width=".8"/><circle cx="-14" cy="-15" r="1.3" fill="#ffd34d" class="blink"/>`;
  s+=_lattice(-6,14,-1,4,-6,-52,6,'#c7cfd8')+`<rect x="-3" y="-56" width="8" height="5" fill="#ff9a3c"/><path d="M1 -51 V-2" stroke="#8a93a2" stroke-width="1.6"/><path d="M-1 -2 l2 5 l2 -5Z" fill="#9aa4b2"/>`;
  if(L>=4)s+=`<circle cx="-34" cy="-20" r="6" fill="url(#kLamp)"/><path d="M-34 -20 V0" stroke="#7a8494" stroke-width="1.2"/><rect x="-36" y="-22" width="4" height="2.5" fill="#ffe9a8"/>`;
  return s}
case 'solar':{const n=Math.min(6,1+Math.ceil(L/2)),rows=n>3?2:1,per=Math.ceil(n/rows);let s=_sh(36,8);
  s+=_box(-36,0,8,9,5)+`<circle cx="-32" cy="-6" r="1" fill="#7ddc5a" class="blink"/>`;
  for(let r=rows-1;r>=0;r--){const cnt=r===0?n-(rows-1)*per:per,y=r?-11:0,ox=r?6:0;
    for(let k=0;k<cnt;k++){const x=-24+ox+k*16;
      s+=`<path d="M${x+7} ${y} V${y-7}" stroke="#7a8494" stroke-width="1.4"/><path d="M${x} ${y-6} L${x+15} ${y-6} L${x+19} ${y-17} L${x+4} ${y-17}Z" fill="url(#kSolar)" stroke="#c9d6e6" stroke-width=".7"/>`+
        `<path d="M${x+5} ${y-6} L${x+9} ${y-17} M${x+10} ${y-6} L${x+14} ${y-17} M${x+1.3} ${y-9.7} H${x+16.3} M${x+2.7} ${y-13.3} H${x+17.7}" stroke="#9fc4ff" stroke-width=".35" opacity=".8"/>`+
        `<path d="M${x+3} ${y-7} L${x+8} ${y-16}" stroke="#fff" stroke-width="1.6" opacity=".22"/>`}}
  return s}
case 'farm':{let s=_sh(36,8);
  s+=`<rect x="24" y="-17" width="10" height="17" fill="url(#kCylH)"/><ellipse cx="29" cy="-17" rx="5" ry="2" fill="#dfe6ee"/><ellipse cx="29" cy="0" rx="5" ry="2" fill="#5a6575"/><path d="M24 -8 h10" stroke="#5a6575" stroke-width=".6"/>`;
  s+=_box(-30,0,50,3,10,'#8d97a6','#b8c2ce','#5d6776');
  s+=`<path d="M-30 -3 A25 22 0 0 1 20 -3 L30 -8.5 A25 22 0 0 0 -20 -8.5Z" fill="#2c4a3c" opacity=".55"/>`;
  for(let i=0;i<6;i++){const x=-24+i*7.5;s+=`<circle cx="${x}" cy="-7" r="3.2" fill="#3fa654"/><circle cx="${x+1}" cy="-10" r="2.6" fill="#5fd06a"/><circle cx="${x+4}" cy="-12" r="2" fill="#7ddc5a"/>`}
  s+=`<path d="M-30 -3 A25 24 0 0 1 20 -3 Z" fill="url(#kGlass)" stroke="#d8fff0" stroke-width=".8"/><path d="M-20 -8.5 A25 24 0 0 1 30 -8.5" stroke="#d8fff0" stroke-width=".7" fill="none" opacity=".7"/><path d="M-5 -27 L5 -32.5" stroke="#d8fff0" stroke-width=".7"/>`;
  s+=`<path d="M-22 -3 A6 24 0 0 1 -18 -19 M-12 -3 A4 24 0 0 1 -10 -24 M0 -3 V-27 M12 -3 A4 24 0 0 0 10 -24" stroke="#d8fff0" stroke-width=".55" fill="none" opacity=".75"/><path d="M-22 -16 Q-12 -26 0 -26" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`;
  if(L>=5)s+=`<circle cx="-34" cy="-3" r="3" fill="#5fd06a"/><circle cx="-36" cy="-6" r="2.4" fill="#7ddc5a"/>`;
  return s}
case 'habitat':{const n=Math.min(3,1+Math.floor(L/3)),top=L>=8;let s=_sh(14+n*12,8),mods='';
  const mod=(cx,cy,w)=>`<rect x="${cx-w/2}" y="${cy-12}" width="${w}" height="12" rx="6" fill="url(#kCyl)" stroke="#5a6575" stroke-width=".5"/><ellipse cx="${cx+w/2-3}" cy="${cy-6}" rx="2.6" ry="5.4" fill="#8e9aa8"/>`+
    `<circle cx="${cx-w/4}" cy="${cy-6.5}" r="2.2" fill="#26324a"/><circle cx="${cx-w/4}" cy="${cy-6.5}" r="1.5" fill="#ffd36a"/><circle cx="${cx+w/12}" cy="${cy-6.5}" r="2.2" fill="#26324a"/><circle cx="${cx+w/12}" cy="${cy-6.5}" r="1.5" fill="#ffd36a"/>`+
    `<path d="M${cx-w/2+3} ${cy-10} H${cx+w/2-5}" stroke="#fff" stroke-width="1.2" opacity=".55" stroke-linecap="round"/><path d="M${cx-w/3} ${cy} v2 M${cx+w/3} ${cy} v2" stroke="#5a6575" stroke-width="1.5"/>`;
  const W=22,gap=4,tot=n*W+(n-1)*gap;
  for(let k=0;k<n;k++){const cx=-tot/2+W/2+k*(W+gap);if(k)mods+=`<rect x="${cx-W/2-gap-1}" y="-9" width="${gap+2}" height="5" fill="#8e9aa8"/>`;mods+=mod(cx,-2,W)}
  if(top)mods+=`<rect x="-3" y="-17" width="6" height="4" fill="#8e9aa8"/>`+mod(0,-15,20);
  return s+mods}
case 'radio':{let s=_sh(22,6);
  s+=`<path d="M0 -56 L-22 0 M0 -56 L22 0" stroke="#8a93a2" stroke-width=".4" opacity=".7"/>`;
  s+=_box(-14,0,12,7,6)+`<rect x="-12" y="-5" width="3" height="3" fill="#5ff2d6"/>`;
  s+=_lattice(-5,10,-1,2,-1,-56,7,'#c7cfd8');
  s+=`<g transform="translate(-3 -44) rotate(-28)"><path d="M-11 0 A11 5 0 0 0 11 0 Z" fill="url(#kDish)" stroke="#7a8494" stroke-width=".6"/><path d="M-11 0 A11 2.6 0 0 1 11 0" fill="#b8c4d2"/><path d="M0 -1 V-9" stroke="#8a93a2" stroke-width="1"/><circle cx="0" cy="-9.5" r="1.4" fill="#5a6475"/></g>`;
  s+=`<circle cx="0" cy="-57" r="2" fill="#ff5d73" class="blink"/>`;
  if(L)s+=`<path d="M8 -58 a7 7 0 0 1 0 10 M12 -61 a12 12 0 0 1 0 16" stroke="#5ff2d6" stroke-width="1.3" fill="none" class="wave"/>`;
  return s}
case 'obs':{let s=_sh(26,7);
  s+=`<rect x="-18" y="-15" width="36" height="15" fill="url(#kCylH)"/><ellipse cx="0" cy="0" rx="18" ry="3" fill="#5a6575"/><rect x="-14" y="-10" width="5" height="10" fill="#26324a"/><rect x="-13" y="-9" width="3" height="9" fill="#ffd36a" opacity=".8"/>`;
  s+=`<ellipse cx="0" cy="-15" rx="19" ry="3.2" fill="#7c8aa0"/><path d="M-18 -15 A18 18 0 0 1 18 -15 Z" fill="url(#kDome)"/>`;
  s+=`<path d="M-3 -32.8 L4 -32.6 L5 -15 L-1 -15Z" fill="#141b2e"/><g transform="translate(2 -22) rotate(-38)"><rect x="-2" y="-3.5" width="22" height="7" rx="2" fill="url(#kCyl)" stroke="#5a6575" stroke-width=".5"/><rect x="18" y="-4.3" width="4" height="8.6" rx="1" fill="#5a6575"/><circle cx="22" cy="0" r="2.6" fill="#7fe8ff" opacity=".8"/></g>`;
  s+=`<ellipse cx="-8" cy="-26" rx="4" ry="2" fill="#fff" opacity=".6" transform="rotate(-35 -8 -26)"/>`;
  return s}
case 'def':{let s=_sh(30,8);
  s+=`<path d="M-30 -2 A30 34 0 0 1 30 -2 Z" fill="url(#kShield)" stroke="#9fe8ff" stroke-width=".8" stroke-opacity=".5" class="shieldarc"/>`;
  s+=`<path d="M-20 0 L-15 -12 L17 -12 L22 0Z" fill="url(#kMf)" stroke="#434b5a" stroke-width=".6"/><path d="M-15 -12 L-11 -15 L19 -15 L17 -12Z" fill="url(#kMt)"/><path d="M17 -12 L19 -15 L25 -3 L22 0Z" fill="url(#kMs)"/>`;
  s+=`<path d="M-19 -3 H21" stroke="#ffd34d" stroke-width="2.2" stroke-dasharray="3 3"/><path d="M-5 -12 v12 M6 -12 v12" stroke="#434b5a" stroke-width=".6"/>`;
  s+=`<ellipse cx="2" cy="-16" rx="12" ry="3" fill="#434b5a"/><path d="M-9 -16 C-9 -27 13 -27 13 -16Z" fill="url(#kDome)"/>`;
  s+=`<path d="M8 -22 L28 -32 M9 -19 L29 -29" stroke="#5a6575" stroke-width="3" stroke-linecap="round"/><path d="M8 -22 L28 -32 M9 -19 L29 -29" stroke="#c7cfd8" stroke-width="1.2" stroke-linecap="round"/><circle cx="-2" cy="-20" r="1.8" fill="#ff5d73" class="blink"/>`;
  if(L>=5)s+=`<path d="M-24 -1 l-6 -14 h5 l5 14Z" fill="url(#kMs)"/><circle cx="-27" cy="-16" r="2" fill="#9fe8ff"/>`;
  return s}
case 'dock':{const S=k=>col.ship[k],fly=col.done;let s=_sh(48,10);
  if(L>0){s+=_lattice(-44,6,-43,4,0,-46,5,'#aeb8c4')+_lattice(36,6,37,4,0,-46,5,'#aeb8c4')+`<path d="M-44 -46 H42 V-43 H-44Z" fill="url(#kMf)"/><path d="M-6 -43 V-30" stroke="#8a93a2" stroke-width=".8"/><path d="M-9 -30 h6 l-3 4Z" fill="#ffd34d"/>`}
  s+=`<g transform="rotate(${fly?0:-12}) translate(0 ${fly?-6:-4})">`;
  s+=`<path d="M-30 -2 L-38 4 L-34 -6Z M-30 -14 L-38 -22 L-33 -11Z" fill="${S('hull')?'#9aa6b4':'#4c5059'}"/>`;
  s+=`<path d="M-30 -14 C-10 -17 18 -16 30 -8 L33 -6 L30 -4 C18 3 -10 3 -30 0Z" fill="url(#${S('hull')?'kHull':'kHullD'})" stroke="#2a2e3a" stroke-width=".7"/>`;
  s+=`<path d="M22 -13 C28 -11 31 -8 33 -6 C31 -4 28 -1 22 1" stroke="${S('shield')?'#d9772a':'#3a3d45'}" stroke-width="4" fill="none"/>`;
  s+=`<path d="M10 -12 C15 -12 19 -10 21 -8 L10 -8Z" fill="${S('nav')?'#7fe8ff':'#1c2230'}" stroke="#2a2e3a" stroke-width=".5"/>`+(S('nav')?'<path d="M12 -11 l3 0" stroke="#fff" stroke-width=".8" opacity=".8"/>':'');
  s+=`${_win(-20,-10,4,6,3,2.4,S('hull')?'#ffd36a':'#2a2e38')}<path d="M-26 -6 H18" stroke="${S('hull')?'#8e9aa8':'#2e323b'}" stroke-width=".6"/>`;
  s+=`<path d="M-30 -12 L-36 -14 L-36 -2 L-30 -2Z" fill="${S('engine')?'url(#kCylH)':'#3e424b'}"/>`+(S('engine')?`<path d="M-36 -12 L-${fly?54:46} -8 L-36 -4Z" fill="#ff9a3c" class="flame"/><path d="M-36 -10 L-42 -8 L-36 -6Z" fill="#fff3c0"/>`:'');
  s+=`<path d="M-4 -15 L-1 -26" stroke="${S('antenna')?'#e6ecf1':'#4c5059'}" stroke-width="1.2"/><circle cx="-1" cy="-27" r="1.8" fill="${S('antenna')?'#5ff2d6':'#4c5059'}"/>`;
  if(!S('hull'))s+=`<ellipse cx="-8" cy="-8" rx="6" ry="3" fill="#111" opacity=".55"/><ellipse cx="8" cy="-3" rx="4" ry="2" fill="#111" opacity=".5"/><path d="M-14 -13 l4 4 l-3 3 l5 3" stroke="#111" stroke-width=".8" fill="none"/>`;
  if(!fly&&!S('engine'))s+=`<circle cx="-24" cy="-18" r="5" fill="#8889" class="smoke"/><circle cx="-20" cy="-28" r="7" fill="#7778" class="smoke s2"/>`;
  return s+'</g>'}
}return ''}

/* ---------- full-screen scene (360 x 700 world, sliced to fill the phone) ---------- */
const SLOT={radio:[58,338,1.25],farm:[178,330,1.25],habitat:[296,338,1.2],mine:[64,452,1.3],hq:[184,456,1.45],dock:[296,446,1.1],solar:[70,566,1.3],obs:[184,570,1.3],def:[298,566,1.3]};
const ROADS='M184 456 Q120 470 64 452 M184 456 Q240 470 296 446 M184 456 Q130 520 70 566 M184 456 L184 570 M184 456 Q240 520 298 566 M184 456 Q120 400 58 338 M184 456 L178 330 M184 456 Q250 400 296 338';
const PRODB={mine:'m',solar:'e',farm:'f',radio:'c'};
function sceneSVG(){const R=rng(7);let stars='',tw='';
  for(let k=0;k<230;k++){const x=(R()*1000-320).toFixed(0),y=(R()*620-370).toFixed(0),r=(R()*1.2+0.3).toFixed(1),o=(0.3+R()*0.7).toFixed(2);
    if(k%5===0)tw+=`<circle class="tw" style="animation-delay:${(R()*4).toFixed(1)}s" cx="${x}" cy="${y}" r="${(+r+0.4).toFixed(1)}" fill="#fff"/>`;else stars+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`}
  let crat='';for(let k=0;k<44;k++){const x=R()*760-200,y=290+R()*560,r=4+R()*12;crat+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${r.toFixed(1)}" ry="${(r*0.4).toFixed(1)}" fill="url(#cCrat)" opacity=".8"/>`}
  let rocks='';for(let k=0;k<60;k++){const x=R()*760-200,y=286+R()*560,r=1.5+R()*4;rocks+=`<path d="M${(x-r).toFixed(1)} ${y.toFixed(1)} l${(r*0.6).toFixed(1)} ${(-r).toFixed(1)} l${(r*1.1).toFixed(1)} ${(r*0.3).toFixed(1)} l${(r*0.5).toFixed(1)} ${(r*0.7).toFixed(1)}Z" fill="#7a5a6a"/><path d="M${(x-r).toFixed(1)} ${y.toFixed(1)} l${(r*0.6).toFixed(1)} ${(-r).toFixed(1)} l${(r*0.3).toFixed(1)} ${r.toFixed(1)}Z" fill="#a07a8a"/>`}
  let dust='';for(let k=0;k<20;k++)dust+=`<circle class="dust" style="animation-delay:${(R()*9).toFixed(1)}s;animation-duration:${(7+R()*6).toFixed(1)}s" cx="${(R()*360).toFixed(0)}" cy="${(320+R()*360).toFixed(0)}" r="${(0.8+R()*1.4).toFixed(1)}" fill="#ffd9c0"/>`;
  const order=Object.keys(SLOT).sort((a,b)=>SLOT[a][1]-SLOT[b][1]);let g='';
  for(const id of order){const [x,y,base]=SLOT[id],L=col.b[id],bl=col.build&&col.build.id===id,sc=(base*(0.92+Math.min(10,L)*0.02)).toFixed(3);
    g+=`<g class="cb${L?'':' empty'}${bl?' building':''}" data-b="${id}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${BLD[id].name}"><ellipse cx="0" cy="-20" rx="50" ry="46" fill="transparent"/>`;
    if(L||id==='dock')g+=`<g class="bart" transform="scale(${sc})">${art(id,L)}</g>`;
    if(!L&&id!=='dock')g+=`<g class="plot"><ellipse cx="0" cy="-2" rx="30" ry="10" fill="#9fe8ff" opacity=".08" stroke="#9fe8ff" stroke-dasharray="5 4" stroke-width="1.2"/><circle cx="0" cy="-20" r="11" fill="#0b1226cc" stroke="#9fe8ff" stroke-width="1.2"/><path d="M-5 -20h10M0 -25v10" stroke="#9fe8ff" stroke-width="2" stroke-linecap="round"/></g>`;
    if(bl)g+=`<g class="scaf"><path d="M-26 2 V-44 M26 2 V-44 M-26 -14 H26 M-26 -30 H26 M-26 -14 L26 -30 M-26 -44 H34 M30 -44 V-30" stroke="#ffd34d" stroke-width="1.6" fill="none"/><path d="M30 -30 v6" stroke="#ddd" stroke-width=".8"/><rect x="27" y="-24" width="6" height="4" fill="#8f99a8"/>${[0,1,2,3,4].map(i=>`<circle class="spark" style="animation-delay:${i*0.25}s" cx="${-10+i*5}" cy="-18" r="1.2" fill="#fff3c0"/>`).join('')}</g>`;
    if(L)g+=`<g class="lv" transform="translate(${id==='hq'?34:24} ${id==='hq'?-70:-54})"><circle r="8" fill="#0b1226" stroke="#ffd34d" stroke-width="1.4"/><text y="3.2" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ffd34d">${L}</text></g>`;
    g+='</g>'}
  const roverPath='M184 470 Q120 486 64 466 Q40 500 70 580 Q130 600 184 584 Q240 600 298 580 Q330 500 296 462 Q240 486 184 470Z';
  return `<svg class="cscene" id="cscene" viewBox="-20 0 400 780" preserveAspectRatio="xMidYMid slice" aria-label="خريطة المستعمرة">${ADEFS}<defs>
    <linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04061a"/><stop offset=".55" stop-color="#1c1640"/><stop offset=".85" stop-color="#4a2c58"/><stop offset="1" stop-color="#7a4462"/></linearGradient>
    <linearGradient id="cGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5266"/><stop offset=".15" stop-color="#5a4058"/><stop offset="1" stop-color="#1a1224"/></linearGradient>
    <linearGradient id="cHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3350"/><stop offset="1" stop-color="#3a2a44"/></linearGradient>
    <linearGradient id="cHill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2240"/><stop offset="1" stop-color="#3a2a48"/></linearGradient>
    <radialGradient id="cPlanet" cx="35%" cy="35%"><stop offset="0" stop-color="#ffd9a0"/><stop offset=".7" stop-color="#d97a4a"/><stop offset="1" stop-color="#7a3a2a"/></radialGradient>
    <radialGradient id="cNeb" cx="50%" cy="50%"><stop offset="0" stop-color="#b47aff" stop-opacity=".28"/><stop offset="1" stop-color="#b47aff" stop-opacity="0"/></radialGradient>
    <radialGradient id="cNeb2" cx="50%" cy="50%"><stop offset="0" stop-color="#5ff2d6" stop-opacity=".16"/><stop offset="1" stop-color="#5ff2d6" stop-opacity="0"/></radialGradient>
    <radialGradient id="cCrat" cx="40%" cy="35%"><stop offset="0" stop-color="#1a1222"/><stop offset=".8" stop-color="#3a2a44"/><stop offset="1" stop-color="#9a7088"/></radialGradient>
    <linearGradient id="cMeteor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
    <rect x="-700" y="-900" width="1760" height="1250" fill="#04061a"/><rect x="-700" y="-40" width="1760" height="330" fill="url(#cSky)"/><ellipse cx="90" cy="120" rx="140" ry="60" fill="url(#cNeb)"/><ellipse cx="280" cy="210" rx="120" ry="50" fill="url(#cNeb2)"/>${stars}${tw}
    <g class="meteor"><path d="M0 0 L60 0" stroke="url(#cMeteor)" stroke-width="1.6" stroke-linecap="round"/><circle cx="60" cy="0" r="1.8" fill="#fff"/></g>
    <g class="meteor m2"><path d="M0 0 L44 0" stroke="url(#cMeteor)" stroke-width="1.2" stroke-linecap="round"/><circle cx="44" cy="0" r="1.4" fill="#fff"/></g>
    <g class="planet"><circle cx="268" cy="118" r="52" fill="url(#cPlanet)"/><path d="M226 100 Q268 92 312 104 M220 124 Q268 116 318 130" stroke="#a24a2a" stroke-width="5" fill="none" opacity=".35"/><ellipse cx="268" cy="118" rx="84" ry="15" fill="none" stroke="#ffd9a0" stroke-opacity=".5" stroke-width="3" transform="rotate(-14 268 118)"/></g>
    <g class="moon"><circle cx="120" cy="196" r="11" fill="#c9d3dc"/><circle cx="116" cy="193" r="3" fill="#9aa4b2" opacity=".7"/><circle cx="124" cy="200" r="2" fill="#9aa4b2" opacity=".6"/></g>
    <g class="shuttle"><path d="M-10 0 L8 -3 L12 0 L8 3Z" fill="#dfe6ee"/><path d="M-10 -1 L-16 0 L-10 1Z" fill="#ff9a3c"/><circle cx="0" cy="-3" r="1" fill="#ff5d73" class="blink"/></g>
    <path d="M-720 292 L-720 252 L-690 247 L-649 237 L-621 238 L-580 252 L-547 254 L-506 240 L-465 246 L-435 253 L-405 227 L-363 246 L-337 235 L-309 256 L-282 250 L-256 229 L-222 243 L-184 233 L-145 246 L-105 223 L-75 227 L-46 261 L-5 253 L34 231 L69 245 L107 239 L146 239 L182 235 L208 228 L239 234 L275 223 L304 233 L336 237 L370 251 L398 243 L439 258 L467 246 L497 261 L536 231 L565 260 L592 247 L628 240 L662 242 L689 250 L717 258 L744 224 L783 250 L817 256 L844 223 L880 249 L910 226 L948 247 L990 247 L1019 237 L1061 251 L1080 292Z" fill="url(#cHill2)"/>
    <path d="M-720 306 L-720 263 L-681 269 L-648 252 L-620 267 L-578 251 L-548 267 L-519 256 L-486 256 L-444 249 L-403 272 L-368 275 L-336 262 L-306 254 L-266 254 L-235 250 L-201 257 L-160 251 L-124 250 L-84 268 L-55 270 L-27 251 L2 251 L45 272 L80 264 L111 249 L139 273 L173 251 L207 267 L237 272 L265 262 L308 261 L342 264 L382 271 L412 256 L444 271 L473 274 L505 255 L534 273 L574 249 L609 271 L653 275 L692 252 L736 259 L766 252 L797 252 L836 263 L876 270 L904 265 L942 276 L973 270 L1015 268 L1045 267 L1080 306Z" fill="url(#cHill)"/>
    <path d="M-720 286 Q-600 274 -480 284 T-240 280 T0 286 Q60 274 120 284 T240 280 T360 284 T600 280 T1080 284 V1300 H-720Z" fill="url(#cGround)"/>${crat}${rocks}
    <path d="${ROADS}" stroke="#1a1424" stroke-width="9" fill="none" stroke-linecap="round" opacity=".6"/><path d="${ROADS}" stroke="#d0a8bc" stroke-width=".7" fill="none" stroke-dasharray="4 6" opacity=".5"/>
    <g class="rover"><animateMotion dur="26s" repeatCount="indefinite" rotate="auto" path="${roverPath}"/><rect x="-7" y="-5" width="14" height="6" rx="2" fill="#e6ecf1"/><rect x="-3" y="-8" width="6" height="3" rx="1" fill="#9fb0c4"/><circle cx="-5" cy="2" r="2" fill="#2a2e3a"/><circle cx="5" cy="2" r="2" fill="#2a2e3a"/><circle cx="7.5" cy="-3" r="1.3" fill="#fff3c0"/><path d="M8 -3 l14 -4 v8Z" fill="#fff3c0" opacity=".18"/></g>
    ${dust}${g}<g id="cfx"></g>
    <g class="drone"><animateMotion dur="18s" repeatCount="indefinite" path="M-20 300 C80 250 160 330 240 280 S380 300 400 270"/><ellipse cx="0" cy="0" rx="6" ry="2" fill="#c7cfd8"/><path d="M-8 -2h5M3 -2h5" stroke="#9aa4b2" stroke-width="1"/><circle cx="0" cy="1.5" r="1" fill="#5ff2d6" class="blink"/></g>
    </svg>`}
/* camera: the colony opens zoomed out to fit; pinch, drag, mouse wheel or the +/- buttons move it */
const cam={z:1,x:180,y:null};
function camView(){const svg=$('cscene');if(!svg)return;const r=svg.getBoundingClientRect();if(!r.width||!r.height)return;
  const W=460/cam.z,H=W*r.height/r.width,u=W/r.width,bottomPad=120*u,topPad=100*u;
  if(cam.y==null){const lo=262-topPad+H/2,hi=640+bottomPad-H/2;cam.y=lo>hi?hi:Math.max(lo,Math.min(hi,(lo+hi)/2))}
  const mnx=-110+W/2,mxx=470-W/2;cam.x=mnx>mxx?180:Math.max(mnx,Math.min(mxx,cam.x));
  const mny=-260+H/2,mxy=900-H/2;cam.y=mny>mxy?(mny+mxy)/2:Math.max(mny,Math.min(mxy,cam.y));
  svg.setAttribute('viewBox',`${(cam.x-W/2).toFixed(1)} ${(cam.y-H/2).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}`)}
function camZoom(f,px,py){const svg=$('cscene');if(!svg)return;const r=svg.getBoundingClientRect(),W=460/cam.z,H=W*r.height/r.width;
  const ux=cam.x-W/2+((px==null?r.width/2:px-r.left)/r.width)*W,uy=cam.y-H/2+((py==null?r.height/2:py-r.top)/r.height)*H;
  const nz=Math.max(0.8,Math.min(3,cam.z*f)),k=cam.z/nz;cam.x=ux+(cam.x-ux)*k;cam.y=uy+(cam.y-uy)*k;cam.z=nz;camView()}
let camDrag=false;
function camBind(){const svg=$('cscene');if(!svg)return;const pts=new Map();let start=null,pinch=0;camDrag=false;
  svg.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1){start={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};camDrag=false}if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
  svg.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=svg.getBoundingClientRect(),u=(460/cam.z)/r.width;
    if(pts.size===2){const [a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch){camZoom(d/pinch,(a.x+b.x)/2,(a.y+b.y)/2)}pinch=d;camDrag=true;return}
    if(start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!camDrag&&Math.hypot(dx,dy)>8){camDrag=true;try{svg.setPointerCapture(e.pointerId)}catch(_){}}if(camDrag){cam.x=start.cx-dx*u;cam.y=start.cy-dy*u;camView()}}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=0;if(!pts.size){start=null;setTimeout(()=>{camDrag=false},0)}};
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
  svg.addEventListener('wheel',e=>{e.preventDefault();camZoom(e.deltaY<0?1.12:1/1.12,e.clientX,e.clientY)},{passive:false});
  camView()}
addEventListener('resize',()=>camView());
/* floating "+n" over producing buildings, a ring burst on finished builds */
function fxFloat(id,txt,col2){const L=$('cfx');if(!L||!SLOT[id])return;const [x,y]=SLOT[id],t=document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x',x);t.setAttribute('y',y-58);t.setAttribute('text-anchor','middle');t.setAttribute('class','flt');t.setAttribute('fill',col2||'#fff');t.textContent=txt;L.appendChild(t);setTimeout(()=>t.remove(),1900)}
function fxRing(id){const L=$('cfx');if(!L||!SLOT[id])return;const [x,y]=SLOT[id],c=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
  c.setAttribute('cx',x);c.setAttribute('cy',y-4);c.setAttribute('rx',40);c.setAttribute('ry',14);c.setAttribute('class','ring');L.appendChild(c);setTimeout(()=>c.remove(),1200)}

/* ---------- main screen: scene + overlays; buildings open in a bottom sheet ---------- */
function resBar(){return Object.entries(RES).map(([k,[n,em,c]])=>`<div class="cr" style="--c:${c}"><span class="ce">${em}</span><b data-r="${k}">${fmtN(col.res[k])}</b><small>${k==='c'?'+'+rate('c').toFixed(1):'+'+fmtN(rate(k))}/س</small></div>`).join('')}
function costHTML(c){return Object.entries(c).map(([k,n])=>`<span class="cc${col.res[k]>=n?'':' no'}" data-k="${k}" data-n="${n}">${RES[k][1]} ${fmtN(n)}</span>`).join('')}
function cardHTML(id){const B=BLD[id],L=col.b[id],locked=B.req&&col.b.hq<B.req,max=L>=(B.max||10),G=B.game&&GAMES.find(x=>x.id===B.game),c=upCost(id);
  const info=B.prod&&L?`${RES[B.prod[0]][1]} +${B.prod[0]==='c'?(B.prod[1]*L*Math.pow(1.15,L-1)*mult()).toFixed(1):fmtN(B.prod[1]*L*Math.pow(1.15,L-1)*mult())}/س`:id==='hq'?`📦 ${fmtN(cap())}`:id==='habitat'?`🧑‍🚀 ${crew()}`:id==='def'&&L?`غنائم +${col.b.def*20}%`:'';
  let h=`<div class="cbc${locked?' locked':''}"><div class="ch"><span class="ci"><svg viewBox="-52 -64 104 76">${art(id,Math.max(1,L))}</svg></span><span class="ctt"><b>${B.name}</b><small>${locked?'<span class="golink" data-to="b:hq" role="button" tabindex="0">🔒 القيادة '+B.req+' ‹</span>':L?'مستوى '+L+(info?' · '+info:''):'غير مبني'}</small></span></div>`;
  if(col.build&&col.build.id===id)h+=`<p class="cd">🏗️ قيد البناء…</p>`;
  else if(!locked&&!max&&id!=='hq'&&L>col.b.hq)h+='<button class="cd need" type="button" data-to="b:hq">🔒 يحتاج القيادة '+L+' ‹</button>';
  else if(!locked&&!max)h+=`<div class="ccost">${costHTML(c)}<span class="cc time">⏱️ ${fmtDur(upTime(id))}</span></div><button class="btn${L?'':' main'}" type="button" data-up="${id}">${L?'⬆️ مستوى '+(L+1):'🏗️ بناء'}</button>`;
  else if(max)h+='<p class="cd">✔️ الأعلى</p>';
  if(G&&L)h+=`<button class="btn task" type="button" data-go="${B.game}" aria-label="${B.task}">🎮 مهمة</button>`;
  if(id==='dock'&&L){h+='<div class="parts">'+PARTS.map(([pid,pn,pc],i)=>{const done=col.ship[pid];return `<div class="part${done?' ok':''}"><span>${done?'✅':'🔧'} ${pn}</span>${done?'':`<span class="ccost">${costHTML({m:pc[0],e:pc[1],f:pc[2],c:pc[3]})}</span><button class="btn" type="button" data-fix="${i}">${col.b.dock<i+1?'🔒 '+(i+1):'🔧'}</button>`}</div>`}).join('')+'</div>'}
  return h+'</div>'}
function bindActions(root){
  root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>startBuild(b.dataset.up));
  root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const G=GAMES.find(x=>x.id===b.dataset.go);if(G){closeSheet();openGame(G)}});
  root.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>repair(+b.dataset.fix));
  root.querySelectorAll('[data-to]').forEach(el=>{const go=()=>goTo(el.dataset.to);el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go()}})}
let sheetId=null;
function openSheet(id){sheetId=id;let m=$('csheet');if(!m){m=document.createElement('div');m.id='csheet';m.className='csheet';m.innerHTML='<div class="csb"></div><div class="csp" role="dialog" aria-modal="true"><button class="csx" type="button" aria-label="إغلاق">✕</button><div class="csc"></div></div>';document.body.appendChild(m);
    m.querySelector('.csb').onclick=closeSheet;m.querySelector('.csx').onclick=closeSheet}
  renderSheet();m.hidden=false;requestAnimationFrame(()=>m.classList.add('on'))}
function renderSheet(){const m=$('csheet');if(!m||!sheetId)return;const c=m.querySelector('.csc');c.innerHTML=cardHTML(sheetId);bindActions(c)}
function closeSheet(){const m=$('csheet');sheetId=null;if(!m)return;m.classList.remove('on');setTimeout(()=>{if(!sheetId)m.hidden=true},250)}
function rankChip(){try{const i=rankOf(prof.xp);return `<span class="crk">${RANKS[i][2]} ${RANKS[i][1]}</span>`}catch(e){return ''}}
function renderColony(){const host=$('colony');if(!host)return;accrue();questCheck();const Q=QUESTS[col.q];
  let h=`<div class="cscene-wrap">${sceneSVG()}</div><div class="ctop"><div class="cres">${resBar()}</div><div class="crow">${rankChip()}</div></div><div class="cbot">`;
  if(col.build){const B=BLD[col.build.id],left=(col.build.end-Date.now())/1000,pc=Math.min(100,100-left/col.build.len*100);
    h+=`<div class="cbuild"><span>🏗️ <b>${B.name}</b> ← ${col.b[col.build.id]+1}</span><span class="ct" data-t>${fmtDur(left)}</span><button class="btn" type="button" data-rush aria-label="إنهاء الآن">⚡ 💎 <span data-rc>${Math.max(1,Math.ceil(left/60))}</span></button><i><u data-p style="width:${pc}%"></u></i></div>`}
  if(Q)h+=`<button class="qt" type="button" data-to="${Q.go?'g:'+Q.go:'b:'+Q.b}"><span class="qi">🎯</span><b></b><span class="qr">${Object.entries(Q.r).map(([k,n])=>'+'+n+' '+RES[k][1]).join(' ')}</span><i class="qa" aria-hidden="true">‹</i></button>`;
  else h+=`<div class="qt"><span class="qi">🚀</span><b>الفصل الثاني قريباً</b></div>`;
  h+='</div><div class="czoom"><button type="button" data-z="in" aria-label="تكبير">＋</button><button type="button" data-z="out" aria-label="تصغير">－</button><button type="button" data-z="fit" aria-label="عرض الكل">⤢</button></div>';host.innerHTML=h;
  if(Q)host.querySelector('.qt b').textContent=Q.t;
  host.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{snd('tap');const z=b.dataset.z;if(z==='fit'){cam.z=1;cam.x=180;cam.y=null;camView()}else camZoom(z==='in'?1.3:1/1.3)});camBind();
  bindActions(host);const rb=host.querySelector('[data-rush]');if(rb)rb.onclick=rush;
  host.querySelectorAll('.cb').forEach(g=>{const go=()=>{if(camDrag)return;snd('tap');g.classList.remove('tap');void g.getBoundingClientRect();g.classList.add('tap');openSheet(g.dataset.b)};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter')go()}});
  renderSheet();colSave();
  if(!col.intro){col.intro=1;colSave();storyBox('تحطّمت المركبة!','ابنِ المستعمرة وأصلح المركبة. كل فوز في الألعاب يجلب موارد.','لنبدأ')}
}
/* tapping a written task takes you to it: a game opens, a building opens its sheet */
function focusB(id){snd('tap');openSheet(id)}
function goTo(to){const [k,v]=(to||'').split(':');if(k==='g'){const G=GAMES.find(x=>x.id===v);if(G){closeSheet();openGame(G)}return}
  if(k==='b'){const B=BLD[v];if(v!=='hq'&&B&&B.req&&col.b.hq<B.req){toast('🔒 القيادة '+B.req);focusB('hq');return}focusB(v)}}
// live numbers once a second while the colony is on screen; every 4 s the producers show what they made
let fxT=0;
setInterval(()=>{const host=$('colony');if(!host||$('hub').hidden||$('pColony').hidden||document.hidden)return;
  const had=col.build&&col.build.id;accrue();if(had&&!col.build){renderColony();fxRing(had);return}
  document.querySelectorAll('#colony [data-r]').forEach(e=>{e.textContent=fmtN(col.res[e.dataset.r])});
  document.querySelectorAll('#colony .cc[data-k],#csheet .cc[data-k]').forEach(e=>e.classList.toggle('no',col.res[e.dataset.k]<+e.dataset.n));
  if(col.build){const left=(col.build.end-Date.now())/1000,t=host.querySelector('[data-t]'),p=host.querySelector('[data-p]'),rc=host.querySelector('[data-rc]');
    if(t)t.textContent=fmtDur(left);if(p)p.style.width=Math.min(100,100-left/col.build.len*100)+'%';if(rc)rc.textContent=Math.max(1,Math.ceil(left/60))}
  if(++fxT%4===0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const ids=Object.keys(PRODB).filter(id=>col.b[id]>0),id=ids[(fxT/4)%ids.length|0];
    if(id){const k=PRODB[id],B=BLD[id],L=col.b[id],v=B.prod[1]*L*Math.pow(1.15,L-1)*mult()/900;fxFloat(id,'+'+(v<10?v.toFixed(1):Math.round(v))+' '+RES[k][1],RES[k][2])}}
  if(Date.now()%10000<1000)colSave()},1000);
addEventListener('pagehide',()=>{accrue();colSave()});
