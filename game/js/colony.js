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
  toast('🏗️ اكتمل: '+BLD[b.id].name+' · المستوى '+col.b[b.id],'ach');if(col.b.hq>=5)unlock('col_hq5');if(BORDER.every(id=>col.b[id]>0))unlock('col_all');questCheck()}
function startBuild(id){accrue();const B=BLD[id],L=col.b[id];
  if(col.build){toast('فريق البناء مشغول بـ'+BLD[col.build.id].name);return}
  if(B.req&&col.b.hq<B.req){toast('يحتاج مركز القيادة مستوى '+B.req);return}
  if(id!=='hq'&&L>col.b.hq){toast('طوّر مركز القيادة أولاً');return}
  if(L>=(B.max||10)){toast('وصل إلى أعلى مستوى');return}
  const c=upCost(id);if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}
  pay(c);col.build={id,end:Date.now()+upTime(id)*1000,len:upTime(id)};colSave();snd('ok');buzz(15);renderColony()}
function rush(){accrue();if(!col.build)return;const left=(col.build.end-Date.now())/1000,cost=Math.max(1,Math.ceil(left/60));
  if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎 لإنهاء البناء الآن');return}
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
  setTimeout(()=>toast('🏠 للمستعمرة: '+got.map(([r,n])=>'+'+fmtN(n)+' '+RES[r][1]).join('  ')),900)}

/* chapter one: guided objectives told by «نجم», the ship's assistant */
const QUESTS=[
  {t:'طوّر منجم المعادن إلى المستوى 2',ok:()=>col.b.mine>=2,r:{e:120},say:'القائد؟ أنا نجم، مساعد المركبة. تحطّمنا، لكن الطاقم بخير. نحتاج معادن أولاً.'},
  {t:'أصلح شبكة الطاقة: اربح مستوى في «شبكة المدار»',ok:()=>(col.wins.grid||0)>=1,r:{m:150},go:'grid',say:'الشبكة الكهربائية تضررت في الهبوط. وصّل القطع لتضيء المستعمرة.'},
  {t:'طوّر مركز القيادة إلى المستوى 2',ok:()=>col.b.hq>=2,r:{f:150},say:'مركز قيادة أكبر يعني مخازن أكبر ومبانيَ جديدة.'},
  {t:'امسح حقل التعدين: اربح مستوى في «حقل الكويكبات»',ok:()=>(col.wins.mines||0)>=1,r:{e:200},go:'mines',say:'وجدنا عروقاً غنية بالمعادن، لكن حولها صخور متفجرة. امشِ بحذر.'},
  {t:'ابنِ برج الاتصالات',ok:()=>col.b.radio>=1,r:{m:200,c:5},say:'أسمع تشويشاً في اللاسلكي… كأن أحداً يرسل لنا. نحتاج برجاً.'},
  {t:'فك أول شفرة: اربح مستوى في «الكلمات المتقاطعة»',ok:()=>(col.wins.words||0)>=1,r:{c:10},go:'words',say:'الإشارة مشفّرة بالكلمات! حلّ الشبكة لنفهم الرسالة.'},
  {t:'طوّر المزرعة المائية إلى المستوى 3',ok:()=>col.b.farm>=3,r:{m:250,e:250},say:'الرسالة تقول: «لستم أول من سقط هنا». الطاقم جائع وقلق… لنزرع أكثر.'},
  {t:'ابنِ المرصد',ok:()=>col.b.obs>=1,r:{f:250},say:'من المرصد نرى الكوكب كله. ربما نجد حطام من سبقونا.'},
  {t:'حلّل صور القمر الصناعي: اربح مستوى في «أوجد الاختلاف»',ok:()=>(col.wins.diff||0)>=1,r:{c:15},go:'diff',say:'قارن الصورتين: كل اختلاف أثرٌ لشيء يتحرك على السطح.'},
  {t:'طوّر مركز القيادة إلى المستوى 3',ok:()=>col.b.hq>=3,r:{m:400,e:300},say:'الصور كشفت كائنات تقترب من المستعمرة. يجب أن نستعد.'},
  {t:'ابنِ منظومة الدفاع',ok:()=>col.b.def>=1,r:{f:300},say:'الدفاع أولاً. إن جاءت الغارة نريد أن نصمد.'},
  {t:'صدّ الغارة: اصمد دقيقتين في «صمود المدار»',ok:()=>(col.surv||0)>=120,r:{c:25},go:'survive',say:'إنهم هنا! اخرج بالبدلة وأبعدهم عن المباني.'},
  {t:'ابنِ حوض الإصلاح',ok:()=>col.b.dock>=1,r:{m:300,e:300},say:'صدّيناهم. حان وقت العمل الحقيقي: إصلاح المركبة والخروج من هنا.'},
  {t:'أصلح محرك المركبة',ok:()=>!!col.ship.engine,r:{c:20},say:'المحرك أهم جزء. بدونه لن نرتفع متراً واحداً.'},
  {t:'طوّر المساكن إلى المستوى 4',ok:()=>col.b.habitat>=4,r:{m:500,f:400},say:'وصلتنا إشارة استغاثة من ناجين آخرين! سنستقبلهم، وسيساعدوننا في العمل.'},
  {t:'أصلح نظام الملاحة',ok:()=>!!col.ship.nav,r:{c:30},say:'الملاحة تعمل. الإحداثيات تشير إلى مصدر الإشارة الغامضة… خارج هذا الكوكب.'},
  {t:'طوّر مركز القيادة إلى المستوى 5',ok:()=>col.b.hq>=5,r:{e:800,f:500},say:'نحتاج مستعمرة أقوى لنصنع بقية الأجزاء الثقيلة.'},
  {t:'أصلح الدرع الحراري والهوائي',ok:()=>!!(col.ship.shield&&col.ship.antenna),r:{c:40},say:'الدرع يحمينا عند الخروج من الغلاف الجوي، والهوائي يبقينا على اتصال.'},
  {t:'أصلح الهيكل وأكمل المركبة',ok:()=>PARTS.every(p=>col.ship[p[0]]),r:{c:60},say:'آخر جزء! بعدها ننطلق لنكشف سرّ الإشارة.'}
];
function questCheck(){let changed=false;while(col.q<QUESTS.length&&QUESTS[col.q].ok()){const Q=QUESTS[col.q];Object.entries(Q.r).forEach(([k,n])=>gain(k,n));
    toast('✅ هدف مكتمل: '+Q.t+' · '+Object.entries(Q.r).map(([k,n])=>'+'+n+' '+RES[k][1]).join(' '),'ach');col.q++;changed=true;addXP(25)}
  if(changed)colSave();return changed}
function storyBox(title,text,label,fn){const m=document.createElement('div');m.className='hmodal';m.style.zIndex=40;
  m.innerHTML='<div class="hbox cstory"><div class="cav">🤖</div><h3></h3><p></p><button class="btn main" type="button"></button></div>';
  m.querySelector('h3').textContent=title;m.querySelector('p').textContent=text;const b=m.querySelector('button');b.textContent=label;b.onclick=()=>{m.remove();fn&&fn()};document.body.appendChild(m);b.focus();return m}
function chapterDone(){if(col.done)return;col.done=1;colSave();
  const m=storyBox('الفصل الأول: اكتمل! 🚀','المركبة جاهزة للإقلاع. الإحداثيات تشير إلى مصدر الإشارة في مجرة قريبة. الفصل الثاني «خريطة المجرة» قادم في التحديث القادم — واصل تطوير مستعمرتك حتى ذلك الحين.','رائع');celebrate(m.querySelector('.hbox'))}

/* ---------- scene: the base drawn as SVG; each building is a tappable group ---------- */
const SLOT={radio:[42,150],farm:[112,148],habitat:[214,146],dock:[304,150],mine:[58,214],hq:[168,206],solar:[272,214],obs:[96,272],def:[236,272]};
function art(id,L){const on=L>0;switch(id){
  case 'hq':return `<ellipse cx="0" cy="0" rx="34" ry="7" fill="#0006"/><rect x="-30" y="-14" width="60" height="14" rx="3" fill="#5b6a86"/><path d="M-26 -14 A26 24 0 0 1 26 -14Z" fill="url(#cDome)"/><rect x="-24" y="-10" width="48" height="4" fill="#5ff2d6" opacity=".85"/><path d="M0 -38v-12" stroke="#c9d3dc" stroke-width="2"/><circle cx="0" cy="-51" r="2.5" fill="#ff5d73" class="blink"/>${L>=4?'<rect x="-40" y="-10" width="10" height="10" rx="2" fill="#4a5875"/><rect x="30" y="-10" width="10" height="10" rx="2" fill="#4a5875"/>':''}${L>=7?'<path d="M-14 -36 A14 8 0 0 1 14 -36" stroke="#ffd34d" stroke-width="2" fill="none"/>':''}`;
  case 'mine':return `<ellipse cx="0" cy="0" rx="28" ry="6" fill="#0006"/><path d="M-22 0 L-8 -12 L6 -4 L20 -10 L26 0Z" fill="#7a6a5a"/><path d="M-6 0 L0 -40 L6 0" stroke="#c9b8a6" stroke-width="3" fill="none"/><path d="M-4 -14h8M-3 -26h6" stroke="#c9b8a6" stroke-width="2"/><rect x="-5" y="-46" width="10" height="7" rx="1.5" fill="#ff9a3c"/><circle cx="16" cy="-6" r="3" fill="#b8a48e"/><circle cx="-14" cy="-6" r="2.5" fill="#9fe8ff" opacity=".8"/>${L>=4?'<path d="M10 -2 L28 -14" stroke="#8f99a8" stroke-width="3"/>':''}`;
  case 'solar':{let p='';const n=Math.min(5,1+Math.ceil(L/2));for(let k=0;k<n;k++){const x=-24+k*12;p+=`<path d="M${x-5} -4 L${x+4} -4 L${x+7} -16 L${x-2} -16Z" fill="url(#cPanel)" stroke="#9fd0ff" stroke-width=".6"/><path d="M${x} -4v4" stroke="#8f99a8" stroke-width="1.5"/>`}return `<ellipse cx="0" cy="0" rx="32" ry="6" fill="#0006"/>${p}`}
  case 'farm':return `<ellipse cx="0" cy="0" rx="26" ry="6" fill="#0006"/><path d="M-22 0 A22 22 0 0 1 22 0Z" fill="#9dffc8" opacity=".25" stroke="#bfffe0" stroke-width="1.2"/><path d="M-11 0 A22 22 0 0 1 -6 -20 M11 0 A22 22 0 0 0 6 -20 M-22 0h44" stroke="#bfffe0" stroke-width=".8" fill="none" opacity=".7"/><path d="M-12 0c0-6 3-9 4-12M-2 0c0-8 2-11 3-14M8 0c0-5 3-7 4-10" stroke="#5fd06a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  case 'habitat':{const n=Math.min(3,1+Math.floor(L/3));let p='';for(let k=0;k<n;k++){const x=-18*(n-1)/2*1+k*18-(n>1?0:0);p+=`<rect x="${x-9}" y="-18" width="18" height="18" rx="8" fill="#d9e2ea"/><circle cx="${x}" cy="-10" r="3" fill="#ffd36a"/>`}return `<ellipse cx="0" cy="0" rx="${12+n*10}" ry="6" fill="#0006"/>${n>1?`<rect x="${-9*(n-1)}" y="-12" width="${18*(n-1)}" height="6" fill="#aab6c2"/>`:''}${p}`}
  case 'radio':return `<ellipse cx="0" cy="0" rx="16" ry="5" fill="#0006"/><path d="M-10 0 L0 -50 L10 0 M-7 -14h14M-4 -30h8" stroke="#aab6c2" stroke-width="2" fill="none"/><path d="M-12 -46 A12 12 0 0 0 4 -58" stroke="#e6ecf1" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="0" cy="-52" r="2.5" fill="#5ff2d6" class="blink"/>${on?'<path d="M10 -58 a8 8 0 0 1 0 10 M14 -61 a13 13 0 0 1 0 16" stroke="#5ff2d6" stroke-width="1.5" fill="none" class="wave"/>':''}`;
  case 'obs':return `<ellipse cx="0" cy="0" rx="24" ry="6" fill="#0006"/><rect x="-18" y="-10" width="36" height="10" fill="#6b7890"/><path d="M-18 -10 A18 18 0 0 1 18 -10Z" fill="#c9d3dc"/><path d="M-3 -27 L3 -27 L3 -10 L-3 -10Z" fill="#26304a"/><path d="M0 -18 L16 -34" stroke="#8f99a8" stroke-width="5" stroke-linecap="round"/>`;
  case 'def':return `<ellipse cx="0" cy="0" rx="24" ry="6" fill="#0006"/><path d="M-30 -4 A30 30 0 0 1 30 -4" stroke="#9fe8ff" stroke-width="2" fill="none" opacity=".45" class="shieldarc"/><rect x="-14" y="-12" width="28" height="12" rx="3" fill="#4a5875"/><circle cx="0" cy="-16" r="9" fill="#6b7890"/><path d="M4 -20 L22 -30" stroke="#c9d3dc" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-16" r="3" fill="#ff5d73"/>`;
  case 'dock':{const S=k=>col.ship[k];return `<ellipse cx="0" cy="2" rx="40" ry="8" fill="#0007"/>${L>0?'<path d="M-36 2 L-30 -30 M36 2 L30 -30 M-30 -30h60" stroke="#8f99a8" stroke-width="2" fill="none"/>':''}
    <g transform="rotate(${col.done?0:-24}) translate(0 -6)">
    <path d="M-30 -6 C-30 -16 10 -18 26 -9 L30 -6 L26 -3 C10 6 -30 4 -30 -6Z" fill="${S('hull')?'url(#cHull)':'#6b6f7a'}" stroke="#2a2e3a" stroke-width="1"/>
    <path d="M14 -12 C20 -10 24 -8 26 -6" stroke="${S('shield')?'#ffb43a':'#4a4e5a'}" stroke-width="3" fill="none"/>
    <ellipse cx="12" cy="-7" rx="5" ry="3" fill="${S('nav')?'#7fe8ff':'#2a3040'}"/>
    <path d="M-30 -11 L-38 -16 L-34 -6 L-38 4 L-30 -1Z" fill="${S('engine')?'#c9d3dc':'#555a66'}"/>${S('engine')?'<path d="M-38 -9 L-48 -6 L-38 -3Z" fill="#ff9a3c" class="flame"/>':''}
    <path d="M-6 -15 L-2 -26" stroke="${S('antenna')?'#e6ecf1':'#555a66'}" stroke-width="1.5"/><circle cx="-2" cy="-27" r="2" fill="${S('antenna')?'#5ff2d6':'#555a66'}"/>
    ${!col.done&&!S('engine')?'<circle cx="-20" cy="-14" r="5" fill="#8889" class="smoke"/><circle cx="-16" cy="-24" r="7" fill="#7778" class="smoke s2"/>':''}</g>`}
}return ''}
function sceneSVG(){let stars='';const R=rng(7);for(let k=0;k<40;k++)stars+=`<circle cx="${(R()*360).toFixed(0)}" cy="${(R()*100).toFixed(0)}" r="${(R()*1.1+0.3).toFixed(1)}" fill="#fff" opacity="${(0.3+R()*0.7).toFixed(2)}"/>`;
  let crat='';for(let k=0;k<14;k++){const x=R()*360,y=120+R()*180,r=3+R()*9;crat+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${r.toFixed(1)}" ry="${(r*0.4).toFixed(1)}" fill="#0003"/>`}
  const order=Object.keys(SLOT).sort((a,b)=>SLOT[a][1]-SLOT[b][1]);let g='';
  for(const id of order){const [x,y]=SLOT[id],L=col.b[id],bl=col.build&&col.build.id===id,sc=(0.92+Math.min(10,L)*0.025).toFixed(3);
    g+=`<g class="cb${L?'':' empty'}${bl?' building':''}" data-b="${id}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${BLD[id].name}"><rect x="-38" y="-58" width="76" height="66" fill="transparent"/>`;
    if(L||id==='dock')g+=`<g transform="scale(${sc})">${art(id,L)}</g>`;
    if(!L&&id!=='dock')g+=`<ellipse cx="0" cy="-2" rx="22" ry="8" fill="none" stroke="#9fe8ff" stroke-dasharray="4 3" opacity=".7"/><text x="0" y="-12" text-anchor="middle" font-size="16" fill="#9fe8ff">+</text>`;
    if(bl)g+='<path d="M-20 0 L-20 -30 M20 0 L20 -30 M-20 -10 L20 -10 M-20 -22 L20 -22 M-20 -10 L20 -22" stroke="#ffd34d" stroke-width="1.6" opacity=".9"/>';
    if(L)g+=`<g transform="translate(18 -40)"><circle r="7.5" fill="#0b1226" stroke="#ffd34d" stroke-width="1.4"/><text y="3" text-anchor="middle" font-size="9" font-weight="700" fill="#ffd34d">${L}</text></g>`;
    g+='</g>'}
  return `<svg class="cscene" viewBox="0 0 360 300" aria-label="خريطة المستعمرة"><defs>
    <linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f2a"/><stop offset="1" stop-color="#3a2350"/></linearGradient>
    <linearGradient id="cGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a5e"/><stop offset=".25" stop-color="#4e3a52"/><stop offset="1" stop-color="#241a30"/></linearGradient>
    <radialGradient id="cPlanet" cx="35%" cy="35%"><stop offset="0" stop-color="#ffd9a0"/><stop offset=".7" stop-color="#d97a4a"/><stop offset="1" stop-color="#7a3a2a"/></radialGradient>
    <radialGradient id="cDome" cx="40%" cy="30%"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#7f93b3"/></radialGradient>
    <linearGradient id="cPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a7bd5"/><stop offset="1" stop-color="#1a2f6e"/></linearGradient>
    <linearGradient id="cHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset="1" stop-color="#9aa7b3"/></linearGradient></defs>
    <rect width="360" height="300" fill="url(#cSky)"/>${stars}<circle cx="300" cy="44" r="30" fill="url(#cPlanet)"/><ellipse cx="300" cy="44" rx="48" ry="9" fill="none" stroke="#ffd9a0" stroke-opacity=".45" stroke-width="2" transform="rotate(-14 300 44)"/><circle cx="62" cy="30" r="9" fill="#c9d3dc" opacity=".8"/>
    <path d="M0 118 Q40 104 90 114 T190 110 T290 116 T360 108 V300 H0Z" fill="url(#cGround)"/><path d="M0 118 Q40 104 90 114 T190 110 T290 116 T360 108" stroke="#9a6a7e" stroke-width="1.5" fill="none" opacity=".6"/>${crat}
    <path d="M58 214 Q110 232 168 206 M168 206 Q220 232 272 214 M168 206 Q150 240 96 272 M168 206 Q200 250 236 272 M168 206 Q190 170 214 146 M168 206 Q130 170 112 148 M112 148 Q80 152 42 150 M214 146 Q260 160 304 150" stroke="#ffffff14" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${g}</svg>`}

/* ---------- main screen ---------- */
function resBar(){return Object.entries(RES).map(([k,[n,em,c]])=>`<div class="cr" style="--c:${c}"><span class="ce">${em}</span><b data-r="${k}">${fmtN(col.res[k])}</b><small>${k==='c'?'+'+rate('c').toFixed(1)+'/س':'+'+fmtN(rate(k))+'/س'}</small></div>`).join('')}
function costHTML(c){return Object.entries(c).map(([k,n])=>`<span class="cc${col.res[k]>=n?'':' no'}" data-k="${k}" data-n="${n}">${RES[k][1]} ${fmtN(n)}</span>`).join('')}
function renderColony(){const host=$('colony');if(!host)return;accrue();questCheck();const Q=QUESTS[col.q];
  let h=`<div class="cres">${resBar()}</div><div class="capline">سعة المخازن ${fmtN(cap())} · الطاقم ${crew()} 🧑‍🚀 · إنتاج +${Math.round((mult()-1)*100)}%</div>`;
  h+=`<div class="cscene-wrap">${sceneSVG()}</div>`;
  if(col.build){const B=BLD[col.build.id],left=(col.build.end-Date.now())/1000,pc=Math.min(100,100-left/col.build.len*100);
    h+=`<div class="cbuild"><span>🏗️ يُبنى: <b>${B.name}</b> ← المستوى ${col.b[col.build.id]+1}</span><span class="ct" data-t>${fmtDur(left)}</span><i><u data-p style="width:${pc}%"></u></i><button class="btn" type="button" data-rush>إنهاء الآن 💎 <span data-rc>${Math.max(1,Math.ceil(left/60))}</span></button></div>`}
  if(Q){const G=Q.go&&GAMES.find(x=>x.id===Q.go);
    h+=`<div class="cquest"><div class="qh"><span>🤖 نجم</span><small>هدف ${col.q+1} من ${QUESTS.length}</small></div><p class="say"></p><div class="qt"><b></b><span class="qr">${Object.entries(Q.r).map(([k,n])=>'+'+n+' '+RES[k][1]).join(' ')}</span></div>${G?'<button class="btn main" type="button" data-go="'+Q.go+'">🎮 ابدأ المهمة</button>':''}</div>`}
  else h+=`<div class="cquest"><div class="qh"><span>🤖 نجم</span></div><p class="say">أكملت الفصل الأول! الفصل الثاني قادم قريباً.</p></div>`;
  h+='<h3 class="sec">المباني</h3><div class="clist">';
  for(const id of BORDER){const B=BLD[id],L=col.b[id],locked=B.req&&col.b.hq<B.req,max=L>=(B.max||10),G=B.game&&GAMES.find(x=>x.id===B.game),c=upCost(id);
    const info=B.prod&&L?`${RES[B.prod[0]][1]} +${B.prod[0]==='c'?(B.prod[1]*L*Math.pow(1.15,L-1)*mult()).toFixed(1):fmtN(B.prod[1]*L*Math.pow(1.15,L-1)*mult())}/س`:id==='hq'?`📦 ${fmtN(cap())}`:id==='habitat'?`🧑‍🚀 ${crew()}`:id==='def'&&L?`غنائم +${col.b.def*20}%`:'';
    h+=`<div class="cbc${locked?' locked':''}" id="cb-${id}"><div class="ch"><span class="ci"><svg viewBox="-40 -62 80 72">${art(id,Math.max(1,L))}</svg></span><span class="ctt"><b>${B.name}</b><small>${locked?'🔒 يحتاج مركز القيادة '+B.req:L?'المستوى '+L+(info?' · '+info:''):'غير مبني'}</small></span></div><p class="cd">${B.desc}</p>`;
    if(!locked&&!max&&id!=='hq'&&L>col.b.hq)h+='<p class="cd need">⬆️ طوّر مركز القيادة إلى '+(L)+' لتطوير هذا المبنى</p>';
    else if(!locked&&!max)h+=`<div class="ccost">${costHTML(c)}<span class="cc time">⏱️ ${fmtDur(upTime(id))}</span></div><button class="btn${L?'':' main'}" type="button" data-up="${id}">${L?'تطوير إلى '+(L+1):'بناء'}</button>`;
    else if(max)h+='<p class="cd">✔️ أعلى مستوى</p>';
    if(G&&L)h+=`<button class="btn task" type="button" data-go="${B.game}">🎮 ${B.task}</button>`;
    if(id==='dock'&&L){h+='<div class="parts">'+PARTS.map(([pid,pn,pc],i)=>{const done=col.ship[pid];return `<div class="part${done?' ok':''}"><span>${done?'✅':'🔧'} ${pn}</span>${done?'<small>تم</small>':`<span class="ccost">${costHTML({m:pc[0],e:pc[1],f:pc[2],c:pc[3]})}</span><button class="btn" type="button" data-fix="${i}">إصلاح${col.b.dock<i+1?' (حوض '+(i+1)+')':''}</button>`}</div>`}).join('')+'</div>'}
    h+='</div>'}
  h+='</div>';host.innerHTML=h;
  if(Q)host.querySelector('.say').textContent=Q.say,host.querySelector('.qt b').textContent=Q.t;
  host.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>startBuild(b.dataset.up));
  host.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const G=GAMES.find(x=>x.id===b.dataset.go);if(G)openGame(G)});
  host.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>repair(+b.dataset.fix));
  const rb=host.querySelector('[data-rush]');if(rb)rb.onclick=rush;
  host.querySelectorAll('.cb').forEach(g=>{const go=()=>{const el=$('cb-'+g.dataset.b);if(!el)return;snd('tap');el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter')go()}});
  colSave();
  if(!col.intro){col.intro=1;colSave();storyBox('تحطّمت المركبة!','هبطت مركبة «المدار» اضطرارياً على كوكب مجهول. الطاقم نجا، لكن المركبة محطّمة. ابنِ مستعمرة، اجمع الموارد، وأصلح المركبة لتكشف سرّ الإشارة التي أسقطتكم. كل لعبة تفوز بها تمدّ المستعمرة بالموارد.','لنبدأ')}
}
// live numbers once a second while the colony is on screen
setInterval(()=>{const host=$('colony');if(!host||$('hub').hidden||$('pColony').hidden||document.hidden)return;
  const had=col.build&&col.build.id;accrue();if(had&&!col.build){renderColony();return}
  host.querySelectorAll('[data-r]').forEach(e=>{e.textContent=fmtN(col.res[e.dataset.r])});
  host.querySelectorAll('.cc[data-k]').forEach(e=>e.classList.toggle('no',col.res[e.dataset.k]<+e.dataset.n));
  if(col.build){const left=(col.build.end-Date.now())/1000,t=host.querySelector('[data-t]'),p=host.querySelector('[data-p]'),rc=host.querySelector('[data-rc]');
    if(t)t.textContent=fmtDur(left);if(p)p.style.width=Math.min(100,100-left/col.build.len*100)+'%';if(rc)rc.textContent=Math.max(1,Math.ceil(left/60))}
  if(Date.now()%10000<1000)colSave()},1000);
addEventListener('pagehide',()=>{accrue();colSave()});
