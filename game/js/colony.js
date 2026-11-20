/* ================= مستعمرة المدار: the main screen =================
   The ship crashed on an unknown planet. Build the colony, keep it producing (also while the app is closed),
   play the story games as colony tasks for resources, and repair the five parts of the ship. */
const RES={m:['معادن','⛏️','#c9b8a6'],e:['طاقة','⚡','#ffd34d'],f:['غذاء','🌱','#7ddc5a'],c:['كريستال','💎','#9fe8ff']};
const BLD={
  hq:{name:'مركز القيادة',base:[200,150,100],max:10,desc:'قلب المستعمرة: يرفع سعة المخازن، وكل مبنى يمكن أن يسبقه بمستوى واحد فقط.'},
  mine:{name:'منجم المعادن',base:[60,80,30],prod:['m',60],desc:'يستخرج المعادن من صخور الكوكب.'},
  solar:{name:'محطة الطاقة',base:[80,50,30],prod:['e',60],desc:'ألواح شمسية تمدّ المستعمرة بالطاقة.'},
  farm:{name:'المزرعة المائية',base:[70,70,20],prod:['f',45],desc:'قبة زجاجية تزرع غذاء الروّاد.'},
  habitat:{name:'المساكن',base:[100,80,80],desc:'كل مستوى يستقبل رائدَين، وكل رائد يرفع الإنتاج 4%.'},
  radio:{name:'برج الاتصالات',base:[150,120,40],req:2,prod:['c',0.6],desc:'يلتقط إشارات غامضة، وينتج قليلاً من الكريستال.'},
  obs:{name:'المرصد',base:[160,140,60],req:2,desc:'يدرس صور الكوكب بحثاً عن أرض خصبة وكنوز.'},
  def:{name:'منظومة الدفاع',base:[220,180,60],req:3,game:'survive',task:'صد غارة الكائنات',desc:'تحمي المستعمرة، وكل مستوى يزيد غنائم الغارات 20%.'},
  tower:{name:'أبراج الدفاع',base:[160,140,40],req:2,desc:'أبراج على السور تقتل الوحوش؛ كل مستوى يضيف برجاً ويقوّي السلاح.'},
  wall:{name:'السور',base:[90,70,20],desc:'يحمي المستعمرة من الكائنات، وكل مستوى يرفع الإنتاج 3%.'},
  lab:{name:'المختبر',base:[220,200,90],req:3,desc:'أبحاث تقوّي الإنتاج والدفاع والبناء.'},
  dock:{name:'حوض الإصلاح',base:[250,200,80],req:2,game:'pilot',task:'دورية فضائية',desc:'هنا تُصلَح أجزاء المركبة لتنطلق من جديد.'}
};
const BORDER=['hq','wall','tower','mine','solar','farm','habitat','radio','obs','def','lab','dock'];
const PARTS=[['engine','المحرك',[400,400,100,10]],['nav','نظام الملاحة',[650,700,160,20]],['shield','الدرع الحراري',[1000,850,300,30]],['antenna','هوائي الاتصال',[1400,1500,420,45]],['hull','الهيكل',[2200,2000,800,60]]];
const GAMEOF={survive:'def',pilot:'dock'};
const col=load('arcade-colony',{res:{m:300,e:300,f:200,c:20},b:{hq:1,mine:1,solar:1,farm:1,habitat:1,radio:0,obs:0,def:0,dock:0},build:null,last:Date.now(),q:0,ship:{},intro:0,wins:{},surv:0,done:0});
const colSave=()=>save('arcade-colony',col);
const cap=()=>Math.round(600*Math.pow(1.7,col.b.hq-1)*(1+0.15*((col.tech&&col.tech.store)||0)));
const crew=()=>3+2*col.b.habitat;
if(col.b.wall==null)col.b.wall=0;if(col.b.tower==null)col.b.tower=0;if(col.b.lab==null)col.b.lab=0;
const techLv=k=>(col.tech&&col.tech[k])||0,TK={m:'mine',e:'power',f:'agri'},tMul=k=>1+0.1*(TK[k]?techLv(TK[k]):0);
const mult=()=>1+(typeof festOn==='function'&&festOn()?0.25:0)+0.04*crew()+0.03*(col.b.wall||0)+(typeof artCount==='function'?0.05*artCount():0);
function rate(k){let r=0;for(const id of BORDER){const B=BLD[id],L=col.b[id];if(B.prod&&B.prod[0]===k&&L>0)r+=B.prod[1]*L*Math.pow(1.15,L-1)}return r*mult()*tMul(k)}
function upCost(id){const L=col.b[id],B=BLD[id],f=Math.pow(1.6,L);return {m:Math.round(B.base[0]*f),e:Math.round(B.base[1]*f),f:Math.round(B.base[2]*f)}}
const upTime=id=>Math.round(20*Math.pow(1.85,col.b[id])*(1-0.08*techLv('build')));
const canPay=c=>Object.keys(c).every(k=>col.res[k]>=c[k]);
function pay(c){Object.keys(c).forEach(k=>col.res[k]-=c[k])}
function gain(k,n){if(k==='c'){col.res.c+=n;return}const C=cap();col.res[k]=Math.max(col.res[k],Math.min(C,col.res[k]+n))}
const fmtN=n=>{n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(n)};
const fmtDur=s=>{s=Math.max(0,Math.ceil(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+'س '+m+'د '+x+'ث':m?m+'د '+x+'ث':x+'ث'};
// production accrues from the last visit, up to 24 hours away
function accrue(){const now=Date.now(),last=col.last||now;col.last=now;let dt=Math.min(24,Math.max(0,(now-last)/3600000));
  if(col.build&&now>=col.build.end){const sp=Math.max(0,(col.build.end-last)/3600000);fillStores(Math.min(dt,sp));dt=Math.max(0,dt-sp);finishBuild()}
  if(col.build2&&now>=col.build2.end){const b=col.build2,keep=col.build;col.build2=null;col.build=b;finishBuild();col.build=keep}
  fillStores(dt);if(typeof researchTick==='function')researchTick()}
function finishBuild(){const b=col.build;if(!b)return;col.build=null;col.b[b.id]++;colSave();snd('ach');buzz([20,30,20]);
  toast('🏗️ '+BLD[b.id].name+' '+col.b[b.id],'ach');if(typeof dtask==='function')dtask('upgrade',1);if(col.b.hq>=5)unlock('col_hq5');if(BORDER.every(id=>col.b[id]>0))unlock('col_all');questCheck()}
function startBuild(id){accrue();const B=BLD[id],L=col.b[id];
  if(building(id)){toast('🏗️ قيد البناء');return}
  if(!freeSlot()){toast(col.bot2?'🏗️ الروبوتان مشغولان':'🏗️ البناء مشغول');return}
  if(B.req&&col.b.hq<B.req){toast('🔒 القيادة '+B.req);return}
  if(id!=='hq'&&L>col.b.hq){toast('🔒 طوّر القيادة أولاً');return}
  if(L>=(B.max||10)){toast('✔️ الأعلى');return}
  const c=upCost(id);if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}
  pay(c);col[freeSlot()]={id,end:Date.now()+upTime(id)*1000,len:upTime(id)};colSave();snd('ok');buzz(15);renderColony()}
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
  if(id==='pilot'){const sc=info.score||0;if(sc<200)return;col.pbest=Math.max(col.pbest||0,sc);col.pruns=(col.pruns||0)+1;if(typeof dtask==='function')dtask('mission',1);
    got=[['m',sc*0.12*k],['e',sc*0.1*k],['f',sc*0.06*k],['c',(info.crys||0)+Math.floor((info.wave||0)/2)]]}
  else if(id==='survive'){const t=info.time||0;if(t>=60&&raidSoon()){col.raid.mine=1;setTimeout(()=>toast('🛡️ صددت الغارة القادمة!','ach'),1800)}if(t<10)return;const d=1+0.2*col.b.def;col.surv=Math.max(col.surv||0,t);col.skills=Math.max(col.skills||0,info.kills||0);col.sboss=(col.sboss||0)+(info.boss||0);col.sruns=(col.sruns||0)+1;if(typeof dtask==='function')dtask('mission',1);
    got=[['m',t*1.4*d],['e',t*1.2*d],['f',t*0.9*d],['c',Math.floor(t/30)+(info.boss||0)*5]]}
  else{col.wins[id]=(col.wins[id]||0)+1;if(typeof dtask==='function')dtask('mission',1);const base=(50+30*stars)*k;
    got=id==='mines'?[['m',base*1.4],['c',stars]]:id==='grid'?[['e',base*1.4],['c',stars]]:id==='words'?[['c',2+2*stars],['f',base*0.6]]:[['f',base*1.2],['c',1+stars]]}
  if(id!=='survive'){if(!col.streak)col.streak={};col.streak[id]=(col.streak[id]||0)+1}const sk=id==='survive'?0:Math.min(5,(col.streak[id]||1)-1);
  got=got.map(([r,n])=>[r,Math.round(n*(1+0.1*sk))]).filter(x=>x[1]>0);got.forEach(([r,n])=>gain(r,n));colSave();questCheck();
  setTimeout(()=>toast((sk?`🔥×${sk+1} +${sk*10}% `:'')+got.map(([r,n])=>'+'+fmtN(n)+' '+RES[r][1]).join('  ')),900)}

/* chapter one: guided objectives told by «نجم», the ship's assistant */
const QUESTS=[
  {b:'mine',t:'طوّر منجم المعادن إلى المستوى 2',ok:()=>col.b.mine>=2,r:{e:120},say:'القائد؟ أنا نجم، مساعد المركبة. تحطّمنا، لكن الطاقم بخير. نحتاج معادن أولاً.'},
  {t:'تدرّب على القتال: اصمد 30 ثانية في «صمود المدار»',ok:()=>(col.surv||0)>=30,r:{m:150},go:'survive',say:'الكائنات تحوم حول المستعمرة. ارتدِ البدلة واخرج للتدريب — اصمد 30 ثانية فقط.'},
  {b:'hq',t:'طوّر مركز القيادة إلى المستوى 2',ok:()=>col.b.hq>=2,r:{f:150},say:'مركز قيادة أكبر يعني مخازن أكبر ومبانيَ جديدة.'},
  {t:'نظّف حقل التعدين: اقتل 40 كائناً في جولة واحدة',ok:()=>(col.skills||0)>=40,r:{e:200},go:'survive',say:'الكائنات تعشش قرب عروق المعادن. نظّف المنطقة حتى نحفر بأمان.'},
  {b:'radio',t:'ابنِ برج الاتصالات',ok:()=>col.b.radio>=1,r:{m:200,c:5},say:'أسمع تشويشاً في اللاسلكي… كأن أحداً يرسل لنا. نحتاج برجاً.'},
  {t:'احمِ الهوائي: اصمد 60 ثانية في «صمود المدار»',ok:()=>(col.surv||0)>=60,r:{c:10},go:'survive',say:'إشارة البرج تجذب الكائنات. اصمد دقيقة كاملة حتى نلتقط الرسالة.'},
  {b:'farm',t:'طوّر المزرعة المائية إلى المستوى 3',ok:()=>col.b.farm>=3,r:{m:250,e:250},say:'الرسالة تقول: «لستم أول من سقط هنا». الطاقم جائع وقلق… لنزرع أكثر.'},
  {b:'obs',t:'ابنِ المرصد',ok:()=>col.b.obs>=1,r:{f:250},say:'من المرصد نرى الكوكب كله. ربما نجد حطام من سبقونا.'},
  {t:'استطلاع خطير: اهزم أول زعيم في «صمود المدار»',ok:()=>(col.sboss||0)>=1,r:{c:15},go:'survive',say:'المرصد كشف زعيماً ضخماً يقود الكائنات. اصمد حتى الموجة الخامسة واهزمه.'},
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
  m.innerHTML='<div class="hbox cstory"><div class="cav">'+(typeof ART!=='undefined'&&ART.najm?'<img class="najm" src="'+ART.najm+'" alt="نجم">':'🤖')+'</div><h3></h3><p></p><button class="btn main" type="button"></button></div>';
  m.querySelector('h3').textContent=title;m.querySelector('p').textContent=text;const b=m.querySelector('button');b.textContent=label;b.onclick=()=>{m.remove();fn&&fn()};document.body.appendChild(m);b.focus();return m}
function chapterDone(){if(col.done)return;col.done=1;colSave();
  const m=storyBox('المركبة جاهزة! 🚀','اكتمل الفصل الأول. افتح خريطة المجرة 🌌 وابدأ الفصل الثاني.','لنستكشف',()=>galaxyBox());if(typeof ART!=='undefined'&&ART.city){const c=m.querySelector('.cstory'),i=document.createElement('img');i.className='shero wide';i.src=ART.city;i.alt='';c.prepend(i);const av=c.querySelector('.cav');if(av)av.remove();const p=c.querySelector('p');p.textContent='اكتمل الفصل الأول. هذه رؤية نجم لمدينة المدار التي سنبنيها بين الكواكب — افتح خريطة المجرة 🌌 وابدأ الفصل الثاني.'}celebrate(m.querySelector('.hbox'))}

/* every level gets its own metal colour: silver, copper, jade, steel, royal blue, violet, crimson, amber, gold, platinum */
const TINT=[null,null,'#c8743a','#2fb07a','#3a8fd0','#3a52d8','#9a52e0','#d8404f','#ff8a2a','#f2c040','#dff6ff'];
const TNAME=['','فضّي','نحاسي','يشمي','فولاذي','ملكي','بنفسجي','قرمزي','كهرماني','ذهبي','بلاتيني'];
const _mix=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const GSET={Mf:['l',[['0','#aeb9c7'],['1','#6c7788']]],Ms:['l',[['0','#6f7a8c'],['1','#434b5a']]],Mt:['h',[['0','#e3e9ef'],['1','#b9c3cf']]],
  Cyl:['l',[['0','#f4f7fa'],['.45','#c7d0da'],['1','#6a7686']]],CylH:['h',[['0','#eef2f6'],['.55','#a9b4c2'],['1','#5a6575']]],
  Dome:['r',[['0','#ffffff'],['.35','#d6e2ee'],['.8','#8495ad'],['1','#5c6b82']]],Wall:['l',[['0','#c7d0da'],['.5','#7d8898'],['1','#4a5262']]],Panel:['l',[['0','#8a93a2'],['1','#4f5868']]]};
function tintDefs(){let d='<defs>';for(let L=2;L<=10;L++){const T=TINT[L],k=L===10?0.32:L===9?0.55:0.46;
  for(const [n,[type,stops]] of Object.entries(GSET)){const st=stops.map(([o,c],i)=>`<stop offset="${o}" stop-color="${_mix(c,T,i===0&&(n==='Dome'||n==='Mt')?k*0.45:k)}"/>`).join('');
    d+=type==='r'?`<radialGradient id="k${n}${L}" cx="32%" cy="28%" r="80%">${st}</radialGradient>`:type==='h'?`<linearGradient id="k${n}${L}" x1="0" y1="0" x2="1" y2="0">${st}</linearGradient>`:`<linearGradient id="k${n}${L}" x1="0" y1="0" x2="0" y2="1">${st}</linearGradient>`}}
  return d+'</defs>'}
const tint=(svg,L)=>!L||L<2?svg:svg.replace(/url\(#k(Mf|Mt|Ms|CylH|Cyl|Dome|Wall|Panel)\)/g,(m,k)=>`url(#k${k}${Math.min(10,L)})`);
const lvBadge=(L,x,y)=>`<g class="lv" transform="translate(${x} ${y})"><circle r="8" fill="#0b1226" stroke="${TINT[L]||'#d6dee8'}" stroke-width="1.8"/><text y="3.2" text-anchor="middle" font-size="9.5" font-weight="700" fill="${L>=9?'#ffd34d':'#fff'}">${L}</text></g>`;
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
<linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7d0da"/><stop offset=".5" stop-color="#7d8898"/><stop offset="1" stop-color="#4a5262"/></linearGradient>
<linearGradient id="kPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a93a2"/><stop offset="1" stop-color="#4f5868"/></linearGradient>
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
function art(id,L){return tint(artRaw(id,L),L)}
function artRaw(id,L){L=Math.max(0,L);if(id!=='dock'&&typeof ART!=='undefined'&&ART[id]&&ART[id+'R'])return imgArt(id,L);switch(id){
case 'hq':{if(typeof ART!=='undefined'&&ART.hq)return imgArt('hq',L);let s=_sh(40,9);
  if(L>=4)s+=_box(-48,0,16,10,7)+_win(-46,-7,3,5,3,2.5);
  if(L>=7)s+=_box(30,0,12,26,7)+_win(32,-23,2,5,3,3)+_win(32,-16,2,5,3,3)+_win(32,-9,2,5,3,3);
  s+=_box(-30,0,58,13,10)+`<rect x="-28" y="-10" width="54" height="4" fill="#0b1830"/>${_win(-26,-9.5,9,6,4,3,'#5ff2d6')}<rect x="-6" y="-7" width="10" height="7" fill="#26324a"/><rect x="-5" y="-6" width="8" height="6" fill="#ffd36a" opacity=".85"/>`;
  s+=`<ellipse cx="4" cy="-18" rx="27" ry="4.5" fill="#7c8aa0"/><path d="M-22 -18 A26 25 0 0 1 30 -18 Z" fill="url(#kDome)"/><path d="M4 -43 A9 25 0 0 0 -5 -18 M4 -43 A9 25 0 0 1 13 -18 M-19 -28 Q4 -33 27 -28" stroke="#6e7f98" stroke-width=".7" fill="none" opacity=".8"/><ellipse cx="-6" cy="-32" rx="6" ry="3.2" fill="#fff" opacity=".55" transform="rotate(-30 -6 -32)"/>`;
  s+=`<path d="M4 -43 V-58" stroke="#c9d3dc" stroke-width="1.6"/><path d="M4 -52 l7 -4" stroke="#c9d3dc" stroke-width="1"/><ellipse cx="12" cy="-57" rx="4" ry="2" fill="url(#kDish)" transform="rotate(-30 12 -57)"/><circle cx="4" cy="-59" r="1.8" fill="#ff5d73" class="blink"/>`;
  if(L>=7)s+=`<ellipse cx="4" cy="-18" rx="31" ry="6" fill="none" stroke="#ffd34d" stroke-width="1.2" opacity=".8"/>`;
  if(L>=10)s+=`<g transform="translate(-44 12)"><ellipse rx="15" ry="4.4" fill="#3a4250"/><ellipse rx="11" ry="3" fill="none" stroke="#ffd34d" stroke-width="1"/><g transform="translate(1 -7)"><path d="M-9 0 L7 -2.4 L11 0 L7 2.4Z" fill="#eef2f6"/><path d="M-9 -1 L-12 -4 L-10 0 L-12 4 L-9 1Z" fill="#9aa4b2"/><circle cx="4" cy="-1" r="1.1" fill="#7fe8ff"/></g></g><path d="M20 -34 V-52 M26 -30 V-46" stroke="#c9d3dc" stroke-width="1.3"/><circle cx="20" cy="-53" r="1.8" fill="#5ff2d6" class="blink"/><circle cx="26" cy="-47" r="1.5" fill="#ffd34d" class="blink"/><path d="M4 -60 L-10 -120 L18 -120Z" fill="#5ff2d6" opacity=".08" class="glowp"/>`;
  return s}
case 'mine':{let s=_sh(34,8);
  s+=`<path d="M14 0 L20 -9 L27 -12 L34 -5 L36 0Z" fill="url(#kRock)"/><path d="M18 -4 l3 -5 l3 4Z M28 -6 l2 -4 l2 4Z" fill="#7fe8ff" opacity=".9"/><path d="M24 -2 l2 -4 l2 4Z" fill="#b47aff"/>`;
  s+=`<path d="M2 -7 L20 -13 L22 -10 L4 -4Z" fill="#2b3240"/><path d="M4 -6 L21 -12" stroke="#5a6475" stroke-width=".6" stroke-dasharray="1.5 2"/>`;
  s+=_box(-28,0,34,6,9,'url(#kMf)','url(#kMt)','url(#kMs)')+`<path d="M-28 -1 h34" stroke="#ffd34d" stroke-width="2" stroke-dasharray="3 3"/>`;
  s+=_box(-26,-6,14,11,6)+`<path d="M-24 -13 h9 M-24 -11 h9 M-24 -9 h9" stroke="#4a5262" stroke-width=".8"/><circle cx="-14" cy="-15" r="1.3" fill="#ffd34d" class="blink"/>`;
  s+=_lattice(-6,14,-1,4,-6,-52,6,'#c7cfd8')+`<rect x="-3" y="-56" width="8" height="5" fill="#ff9a3c"/><path d="M1 -51 V-2" stroke="#8a93a2" stroke-width="1.6"/><path d="M-1 -2 l2 5 l2 -5Z" fill="#9aa4b2"/>`;
  if(L>=4)s+=`<circle cx="-34" cy="-20" r="6" fill="url(#kLamp)"/><path d="M-34 -20 V0" stroke="#7a8494" stroke-width="1.2"/><rect x="-36" y="-22" width="4" height="2.5" fill="#ffe9a8"/>`;
  if(L>=7)s+=_lattice(30,10,33,4,0,-38,5,'#aeb8c4')+`<rect x="31" y="-42" width="7" height="5" fill="#ff9a3c"/><g transform="translate(-30 9)"><path d="M-9 -7 l2 -4 h8 l1 4" fill="#8a6a5a"/><rect x="-9" y="-7" width="11" height="6" fill="#ffb02e"/><path d="M2 -7 h5 l3 3 v3 h-8z" fill="#e8962a"/><rect x="3" y="-6" width="3" height="2" fill="#7fe8ff"/><circle cx="-5" cy="0" r="2" fill="#222"/><circle cx="6" cy="0" r="2" fill="#222"/></g>`;
  if(L>=10)s+=`<g transform="translate(-46 0)"><rect x="-6" y="-28" width="12" height="28" fill="url(#kCylH)"/><ellipse cx="0" cy="-28" rx="6" ry="2" fill="#dfe6ee"/><rect x="-4" y="-22" width="8" height="13" rx="2" fill="#7fe8ff" class="glowp"/><path d="M6 -14 h10" stroke="#8a93a2" stroke-width="2"/><circle cx="0" cy="-15" r="9" fill="url(#kLamp)" opacity=".5"/></g>`;
  return s}
case 'solar':{const n=Math.min(6,1+Math.ceil(L/2)),rows=n>3?2:1,per=Math.ceil(n/rows);let s=_sh(36,8);
  s+=_box(-36,0,8,9,5)+`<circle cx="-32" cy="-6" r="1" fill="#7ddc5a" class="blink"/>`;
  for(let r=rows-1;r>=0;r--){const cnt=r===0?n-(rows-1)*per:per,y=r?-11:0,ox=r?6:0;
    for(let k=0;k<cnt;k++){const x=-24+ox+k*16;
      s+=`<path d="M${x+7} ${y} V${y-7}" stroke="#7a8494" stroke-width="1.4"/><path d="M${x} ${y-6} L${x+15} ${y-6} L${x+19} ${y-17} L${x+4} ${y-17}Z" fill="url(#kSolar)" stroke="#c9d6e6" stroke-width=".7"/>`+
        `<path d="M${x+5} ${y-6} L${x+9} ${y-17} M${x+10} ${y-6} L${x+14} ${y-17} M${x+1.3} ${y-9.7} H${x+16.3} M${x+2.7} ${y-13.3} H${x+17.7}" stroke="#9fc4ff" stroke-width=".35" opacity=".8"/>`+
        `<path d="M${x+3} ${y-7} L${x+8} ${y-16}" stroke="#fff" stroke-width="1.6" opacity=".22"/>`}}
  if(L>=4)s+=_box(28,2,12,8,5)+'<rect x="30" y="-4" width="2" height="4" fill="#7ddc5a"/><rect x="33" y="-4" width="2" height="4" fill="#7ddc5a"/><rect x="36" y="-4" width="2" height="4" fill="#ffd34d" class="blink"/>';
  if(L>=10)s+=`<g transform="translate(44 0)">${_lattice(-3,6,-1,2,0,-48,5,'#c7cfd8')}<circle cx="0" cy="-50" r="12" fill="url(#kLamp)"/><circle cx="0" cy="-50" r="4.5" fill="#fff3c0" class="glowp"/></g>`;
  return s}
case 'farm':{let s=_sh(36,8);
  s+=`<rect x="24" y="-17" width="10" height="17" fill="url(#kCylH)"/><ellipse cx="29" cy="-17" rx="5" ry="2" fill="#dfe6ee"/><ellipse cx="29" cy="0" rx="5" ry="2" fill="#5a6575"/><path d="M24 -8 h10" stroke="#5a6575" stroke-width=".6"/>`;
  s+=_box(-30,0,50,3,10,'#8d97a6','#b8c2ce','#5d6776');
  s+=`<path d="M-30 -3 A25 22 0 0 1 20 -3 L30 -8.5 A25 22 0 0 0 -20 -8.5Z" fill="#2c4a3c" opacity=".55"/>`;
  for(let i=0;i<6;i++){const x=-24+i*7.5;s+=`<circle cx="${x}" cy="-7" r="3.2" fill="#3fa654"/><circle cx="${x+1}" cy="-10" r="2.6" fill="#5fd06a"/><circle cx="${x+4}" cy="-12" r="2" fill="#7ddc5a"/>`}
  s+=`<path d="M-30 -3 A25 24 0 0 1 20 -3 Z" fill="url(#kGlass)" stroke="#d8fff0" stroke-width=".8"/><path d="M-20 -8.5 A25 24 0 0 1 30 -8.5" stroke="#d8fff0" stroke-width=".7" fill="none" opacity=".7"/><path d="M-5 -27 L5 -32.5" stroke="#d8fff0" stroke-width=".7"/>`;
  s+=`<path d="M-22 -3 A6 24 0 0 1 -18 -19 M-12 -3 A4 24 0 0 1 -10 -24 M0 -3 V-27 M12 -3 A4 24 0 0 0 10 -24" stroke="#d8fff0" stroke-width=".55" fill="none" opacity=".75"/><path d="M-22 -16 Q-12 -26 0 -26" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`;
  if(L>=4)s+=`<circle cx="-34" cy="-3" r="3" fill="#5fd06a"/><circle cx="-36" cy="-6" r="2.4" fill="#7ddc5a"/>`;
  if(L>=7)s+=`<g transform="translate(-36 8) scale(.55)"><rect x="-24" y="-3" width="48" height="3" fill="#8d97a6"/><path d="M-22 -3 A22 20 0 0 1 22 -3Z" fill="url(#kGlass)" stroke="#d8fff0" stroke-width="1.2"/><circle cx="-8" cy="-8" r="4" fill="#5fd06a"/><circle cx="4" cy="-9" r="4.4" fill="#3fa654"/><circle cx="13" cy="-7" r="3" fill="#7ddc5a"/></g>`;
  if(L>=10)s+=`<g transform="translate(44 0)"><rect x="-6" y="-42" width="12" height="42" fill="url(#kGlass)" stroke="#d8fff0" stroke-width=".8"/>${[0,1,2,3,4].map(k=>`<rect x="-5" y="${-39+k*8}" width="10" height="3" fill="${k%2?'#3fa654':'#5fd06a'}"/>`).join('')}<path d="M-7 -42 h14" stroke="#c7cfd8" stroke-width="2"/><circle cx="0" cy="-45" r="2" fill="#ff9ad6" class="blink"/></g>`;
  return s}
case 'habitat':{const n=Math.min(3,1+Math.floor(L/3)),top=L>=8;let s=_sh(14+n*12,8),mods='';
  const mod=(cx,cy,w)=>`<rect x="${cx-w/2}" y="${cy-12}" width="${w}" height="12" rx="6" fill="url(#kCyl)" stroke="#5a6575" stroke-width=".5"/><ellipse cx="${cx+w/2-3}" cy="${cy-6}" rx="2.6" ry="5.4" fill="#8e9aa8"/>`+
    `<circle cx="${cx-w/4}" cy="${cy-6.5}" r="2.2" fill="#26324a"/><circle cx="${cx-w/4}" cy="${cy-6.5}" r="1.5" fill="#ffd36a"/><circle cx="${cx+w/12}" cy="${cy-6.5}" r="2.2" fill="#26324a"/><circle cx="${cx+w/12}" cy="${cy-6.5}" r="1.5" fill="#ffd36a"/>`+
    `<path d="M${cx-w/2+3} ${cy-10} H${cx+w/2-5}" stroke="#fff" stroke-width="1.2" opacity=".55" stroke-linecap="round"/><path d="M${cx-w/3} ${cy} v2 M${cx+w/3} ${cy} v2" stroke="#5a6575" stroke-width="1.5"/>`;
  const W=22,gap=4,tot=n*W+(n-1)*gap;
  for(let k=0;k<n;k++){const cx=-tot/2+W/2+k*(W+gap);if(k)mods+=`<rect x="${cx-W/2-gap-1}" y="-9" width="${gap+2}" height="5" fill="#8e9aa8"/>`;mods+=mod(cx,-2,W)}
  if(top)mods+=`<rect x="-3" y="-17" width="6" height="4" fill="#8e9aa8"/>`+mod(0,-15,20);
  if(L>=4)mods+=`<path d="M-6 -14 v-8" stroke="#c9d3dc" stroke-width="1"/><circle cx="-6" cy="-23" r="1.4" fill="#ff5d73" class="blink"/>`;
  if(L>=10)mods+=`<path d="M${-tot/2} -1 H${tot/2}" stroke="#ffd36a" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round" class="glowp"/><g transform="translate(0 -30)"><path d="M-8 0 A8 7 0 0 1 8 0Z" fill="url(#kGlass)" stroke="#d8fff0" stroke-width=".7"/><circle cx="-2" cy="-2" r="2" fill="#5fd06a"/><circle cx="3" cy="-2.5" r="2" fill="#7ddc5a"/></g>`;
  return s+mods}
case 'radio':{let s=_sh(22,6);
  s+=`<path d="M0 -56 L-22 0 M0 -56 L22 0" stroke="#8a93a2" stroke-width=".4" opacity=".7"/>`;
  s+=_box(-14,0,12,7,6)+`<rect x="-12" y="-5" width="3" height="3" fill="#5ff2d6"/>`;
  s+=_lattice(-5,10,-1,2,-1,-56,7,'#c7cfd8');
  s+=`<g transform="translate(-3 -44) rotate(-28)"><path d="M-11 0 A11 5 0 0 0 11 0 Z" fill="url(#kDish)" stroke="#7a8494" stroke-width=".6"/><path d="M-11 0 A11 2.6 0 0 1 11 0" fill="#b8c4d2"/><path d="M0 -1 V-9" stroke="#8a93a2" stroke-width="1"/><circle cx="0" cy="-9.5" r="1.4" fill="#5a6475"/></g>`;
  s+=`<circle cx="0" cy="-57" r="2" fill="#ff5d73" class="blink"/>`;
  if(L)s+=`<path d="M8 -58 a7 7 0 0 1 0 10 M12 -61 a12 12 0 0 1 0 16" stroke="#5ff2d6" stroke-width="1.3" fill="none" class="wave"/>`;
  if(L>=4)s+=`<g transform="translate(3 -24) rotate(32) scale(.7)"><path d="M-11 0 A11 5 0 0 0 11 0 Z" fill="url(#kDish)" stroke="#7a8494" stroke-width=".6"/><path d="M0 -1 V-8" stroke="#8a93a2"/><circle cx="0" cy="-8.5" r="1.3" fill="#5a6475"/></g>`;
  if(L>=7)s+=`<ellipse cx="0" cy="-18" rx="6" ry="1.8" fill="none" stroke="#5ff2d6" stroke-width="1.1" class="blink"/><ellipse cx="0" cy="-34" rx="4" ry="1.3" fill="none" stroke="#5ff2d6" stroke-width="1.1" class="blink"/><ellipse cx="0" cy="-48" rx="2.6" ry="1" fill="none" stroke="#5ff2d6" stroke-width="1"/>`;
  if(L>=10)s+=`<g transform="translate(26 0)"><path d="M-3 0 L0 -12 L3 0Z" fill="#8a93a2"/><g transform="translate(0 -14) rotate(-35)"><path d="M-15 0 A15 7 0 0 0 15 0Z" fill="url(#kDish)" stroke="#7a8494" stroke-width=".7"/><path d="M0 -1 V-12" stroke="#8a93a2"/><circle cx="0" cy="-12.5" r="1.8" fill="#5ff2d6" class="blink"/></g></g><path d="M0 -58 L-9 -150 L9 -150Z" fill="#5ff2d6" opacity=".1" class="glowp"/>`;
  return s}
case 'obs':{let s=_sh(26,7);
  s+=`<rect x="-18" y="-15" width="36" height="15" fill="url(#kCylH)"/><ellipse cx="0" cy="0" rx="18" ry="3" fill="#5a6575"/><rect x="-14" y="-10" width="5" height="10" fill="#26324a"/><rect x="-13" y="-9" width="3" height="9" fill="#ffd36a" opacity=".8"/>`;
  s+=`<ellipse cx="0" cy="-15" rx="19" ry="3.2" fill="#7c8aa0"/><path d="M-18 -15 A18 18 0 0 1 18 -15 Z" fill="url(#kDome)"/>`;
  s+=`<path d="M-3 -32.8 L4 -32.6 L5 -15 L-1 -15Z" fill="#141b2e"/><g transform="translate(2 -22) rotate(-38)"><rect x="-2" y="-3.5" width="22" height="7" rx="2" fill="url(#kCyl)" stroke="#5a6575" stroke-width=".5"/><rect x="18" y="-4.3" width="4" height="8.6" rx="1" fill="#5a6575"/><circle cx="22" cy="0" r="2.6" fill="#7fe8ff" opacity=".8"/></g>`;
  s+=`<ellipse cx="-8" cy="-26" rx="4" ry="2" fill="#fff" opacity=".6" transform="rotate(-35 -8 -26)"/>`;
  if(L>=4)s+=`<rect x="-16" y="-2" width="8" height="2" fill="#8a93a2"/><rect x="-15" y="0" width="6" height="2" fill="#6a7486"/><circle cx="-17" cy="-12" r="1.3" fill="#ffd34d" class="blink"/><circle cx="-6" cy="-12" r="1.3" fill="#ffd34d" class="blink"/>`;
  if(L>=7)s+=`<g transform="translate(28 2) scale(.55)"><rect x="-18" y="-15" width="36" height="15" fill="url(#kCylH)"/><ellipse cx="0" cy="-15" rx="19" ry="3.2" fill="#7c8aa0"/><path d="M-18 -15 A18 18 0 0 1 18 -15 Z" fill="url(#kDome)"/><path d="M0 -24 L16 -38" stroke="#8f99a8" stroke-width="5" stroke-linecap="round"/></g>`;
  if(L>=10)s+=`<path d="M-18 -15 A18 18 0 0 1 18 -15" stroke="#ffd34d" stroke-width="1.4" fill="none"/><path d="M17 -36 L80 -150" stroke="#ff9a3c" stroke-width="1.3" opacity=".7" class="glowp"/><circle cx="80" cy="-150" r="2.2" fill="#ffd34d" class="blink"/>`;
  return s}
case 'def':{let s=_sh(30,8);
  s+=`<path d="M-30 -2 A30 34 0 0 1 30 -2 Z" fill="url(#kShield)" stroke="#9fe8ff" stroke-width=".8" stroke-opacity=".5" class="shieldarc"/>`;
  s+=`<path d="M-20 0 L-15 -12 L17 -12 L22 0Z" fill="url(#kMf)" stroke="#434b5a" stroke-width=".6"/><path d="M-15 -12 L-11 -15 L19 -15 L17 -12Z" fill="url(#kMt)"/><path d="M17 -12 L19 -15 L25 -3 L22 0Z" fill="url(#kMs)"/>`;
  s+=`<path d="M-19 -3 H21" stroke="#ffd34d" stroke-width="2.2" stroke-dasharray="3 3"/><path d="M-5 -12 v12 M6 -12 v12" stroke="#434b5a" stroke-width=".6"/>`;
  s+=`<ellipse cx="2" cy="-16" rx="12" ry="3" fill="#434b5a"/><path d="M-9 -16 C-9 -27 13 -27 13 -16Z" fill="url(#kDome)"/>`;
  s+=`<path d="M8 -22 L28 -32 M9 -19 L29 -29" stroke="#5a6575" stroke-width="3" stroke-linecap="round"/><path d="M8 -22 L28 -32 M9 -19 L29 -29" stroke="#c7cfd8" stroke-width="1.2" stroke-linecap="round"/><circle cx="-2" cy="-20" r="1.8" fill="#ff5d73" class="blink"/>`;
  if(L>=4)s+=`<path d="M-24 -1 l-6 -14 h5 l5 14Z" fill="url(#kMs)"/><circle cx="-27" cy="-16" r="2" fill="#9fe8ff"/>`;
  if(L>=7)s+=`<g transform="translate(26 -2)"><path d="M0 0 V-16" stroke="#8a93a2" stroke-width="1.4"/><g transform="translate(0 -18)"><path class="radar" d="M-8 0 A8 3.2 0 0 0 8 0Z" fill="url(#kDish)" stroke="#7a8494" stroke-width=".5"/></g><circle cx="0" cy="-20" r="1.2" fill="#5ff2d6" class="blink"/></g>`;
  if(L>=10)s+=`<path d="M-36 -2 A36 42 0 0 1 36 -2 Z" fill="url(#kShield)" stroke="#9fe8ff" stroke-width="1.6" stroke-opacity=".9" class="shieldarc"/><path d="M-4 -21 L-22 -32 M-3 -18 L-21 -29" stroke="#5a6575" stroke-width="3" stroke-linecap="round"/><path d="M-4 -21 L-22 -32 M-3 -18 L-21 -29" stroke="#c7cfd8" stroke-width="1.2" stroke-linecap="round"/>`;
  return s}
case 'tower':{const t=tierOf(Math.max(1,L));return _sh(16,5)+_lattice(-9,18,-6,12,0,-34,4,'#aeb8c4')+_box(-11,-32,22,7,6)+`<g transform="translate(3 -44) rotate(-20) scale(1.5)">${HEAD[t]}</g>`+(L>=4?'<circle cx="-8" cy="-36" r="1.6" fill="#ff5d73" class="blink"/>':'')}
case 'wall':{const st=fenceStyle(Math.max(1,L)),h=st.h*1.8;let s=_sh(40,6);
  if(L>=3)s+=`<path d="M-36 0 L36 0 L36 ${-h} L-36 ${-h}Z" fill="${st.fill}" stroke="#2a2e3a" stroke-width=".6"/><path d="M-12 0 V${-h} M12 0 V${-h}" stroke="#3a4250" stroke-width=".6"/>`;else s+=`<path d="M-36 -5 H36 M-36 -10 H36" stroke="#b8c2cc" stroke-width="1"/>`;
  for(const x of [-36,-12,12,36])s+=`<rect x="${x-2}" y="${-h-5}" width="4" height="${h+5}" fill="${st.post}"/><rect x="${x-2.6}" y="${-h-6.5}" width="5.2" height="2.2" fill="${st.cap}"/>`;
  if(L>=6)s+=`<path d="M-36 ${-h-2} H36" stroke="#5ff2d6" stroke-width="1.6" class="efence"/>`;
  if(L>=6)s+=`<g transform="translate(26 0)">${_lattice(-4,8,-3,6,0,-36,4,'#aeb8c4')}${_box(-6,-36,12,7,4)}<circle cx="0" cy="-46" r="2" fill="#ff5d73" class="blink"/></g>`;
  return s}
case 'lab':return labArt(L);
case 'dock':{const S=k=>col.ship[k],fly=col.done;let s=_sh(48,10);
  if(L>0){s+=_lattice(-44,6,-43,4,0,-46,5,'#aeb8c4')+_lattice(36,6,37,4,0,-46,5,'#aeb8c4')+`<path d="M-44 -46 H42 V-43 H-44Z" fill="url(#kMf)"/><path d="M-6 -43 V-30" stroke="#8a93a2" stroke-width=".8"/><path d="M-9 -30 h6 l-3 4Z" fill="#ffd34d"/>`}
  if(L>=4)s+=`<g transform="translate(-56 0)"><rect x="-5" y="-20" width="10" height="20" rx="5" fill="url(#kCylH)"/><rect x="-5" y="-11" width="10" height="2" fill="#ff5d73"/></g><g transform="translate(-46 2)"><rect x="-4" y="-14" width="8" height="14" rx="4" fill="url(#kCylH)"/></g>`;
  if(L>=7)s+=`<path d="M-44 -46 H42" stroke="#ffd34d" stroke-width="1" stroke-dasharray="3 3"/><circle cx="-44" cy="-49" r="1.8" fill="#ff5d73" class="blink"/><circle cx="42" cy="-49" r="1.8" fill="#ff5d73" class="blink"/>`;
  if(L>=10)s+=`<path d="M-42 -44 L-22 2 L-8 2Z M40 -44 L20 2 L6 2Z" fill="#fff3c0" opacity=".14"/>`;
  if(col.exp)return s+'<text x="0" y="-14" text-anchor="middle" font-size="12">🚀…</text>';
  if(typeof ART!=='undefined'&&ART.x_ship){const w=78,h=w/ART.x_shipR;return s+`<g class="pship${fly?' fixed':''}"><image href="${ART.x_ship}" x="${-w/2}" y="${(-h+6).toFixed(1)}" width="${w}" height="${h.toFixed(1)}"/></g>`}
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
const SLOT={wall:[178,648,1],tower:[-6,530,1],lab:[118,396,1.2],radio:[58,338,1.25],farm:[178,330,1.25],habitat:[296,338,1.2],mine:[64,452,1.3],hq:[184,456,1.45],dock:[296,446,1.1],solar:[70,566,1.3],obs:[184,570,1.3],def:[298,566,1.3]};
const ROADS='M184 456 Q120 470 64 452 M184 456 Q240 470 296 446 M184 456 Q130 520 70 566 M184 456 L184 570 M184 456 Q240 520 298 566 M184 456 Q150 420 118 396 M118 396 Q80 370 58 338 M184 456 L178 330 M184 456 Q250 400 296 338';
const PRODB={mine:'m',solar:'e',farm:'f',radio:'c'};
/* ---------- the fence around the base, and the creatures roaming outside it ---------- */
const FEN={cx:178,cy:468,rx:196,ry:180};
const fp=a=>[FEN.cx+FEN.rx*Math.cos(a),FEN.cy+FEN.ry*Math.sin(a)];
function fenceStyle(L){return L>=9?{h:14,fill:'url(#kWall)',post:'#c7cfd8',cap:'#9fe8ff'}:L>=6?{h:11,fill:'url(#kWall)',post:'#aeb8c4',cap:'#5ff2d6'}:L>=3?{h:9,fill:'url(#kPanel)',post:'#9aa4b2',cap:'#ffd34d'}:{h:7,fill:'none',post:'#8a93a2',cap:'#ffd34d'}}
/* half = 'back' (upper arc, drawn behind the buildings) or 'front' (lower arc, drawn over them) */
function fenceSVG(half){return tint(fenceRaw(half),col.b.wall||0)}
function fenceRaw(half){const L=col.b.wall||0,N=44,gap=0.17,st=fenceStyle(L);let seg='',posts='',strand='',tow='';
  if(!L){let d='';for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,[x,y]=fp(a),back=y<FEN.cy;if((half==='back')!==back)continue;d+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.2" fill="#9fe8ff" opacity=".45"/>`}return d}
  for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2,mid=(a0+a1)/2;if(Math.abs(((mid-Math.PI/2+Math.PI*3)%(Math.PI*2))-Math.PI)<gap)continue;
    const [x0,y0]=fp(a0),[x1,y1]=fp(a1),back=(y0+y1)/2<FEN.cy;if((half==='back')!==back)continue;const h=st.h;
    if(L>=3)seg+=`<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x1.toFixed(1)} ${(y1-h).toFixed(1)} L${x0.toFixed(1)} ${(y0-h).toFixed(1)}Z" fill="${st.fill}" stroke="#2a2e3a" stroke-width=".4"/>`;
    else seg+=`<path d="M${x0.toFixed(1)} ${(y0-2.5).toFixed(1)} L${x1.toFixed(1)} ${(y1-2.5).toFixed(1)} M${x0.toFixed(1)} ${(y0-5.5).toFixed(1)} L${x1.toFixed(1)} ${(y1-5.5).toFixed(1)}" stroke="#b8c2cc" stroke-width=".7"/>`;
    if(L>=6)strand+=`M${x0.toFixed(1)} ${(y0-h-1).toFixed(1)} L${x1.toFixed(1)} ${(y1-h-1).toFixed(1)}`;
    posts+=`<rect x="${(x0-1.3).toFixed(1)}" y="${(y0-h-3).toFixed(1)}" width="2.6" height="${h+3}" fill="${st.post}"/><rect x="${(x0-1.7).toFixed(1)}" y="${(y0-h-4).toFixed(1)}" width="3.4" height="1.6" fill="${st.cap}"/>`}
  if(L>=6)for(const deg of [215,325,145,35]){const a=deg*Math.PI/180,[x,y]=fp(a);if((half==='back')!==(y<FEN.cy))continue;
    tow+=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><ellipse cx="2" cy="1" rx="9" ry="3" fill="#000" opacity=".35"/>${_lattice(-5,10,-4,8,0,-30,4,'#aeb8c4')}${_box(-7,-30,14,8,5)}<rect x="-5" y="-36" width="10" height="6" fill="#26324a"/><rect x="-4" y="-35" width="8" height="3" fill="#5ff2d6" opacity=".8"/><circle cx="0" cy="-40" r="1.8" fill="#ff5d73" class="blink"/><path d="M0 -38 L-26 -60 L-18 -64Z" fill="#fff3c0" opacity=".1" class="sweep"/></g>`}
  return seg+posts+(strand?`<path d="${strand}" stroke="${L>=9?'#9fe8ff':'#5ff2d6'}" stroke-width="${L>=9?2:1.4}" fill="none" class="efence"/>`:'')+tow}
function gateSVG(){return tint(gateRaw(),col.b.wall||0)}
function gateRaw(){const L=col.b.wall||0,[x,y]=fp(Math.PI/2),st=fenceStyle(Math.max(1,L));
  return `<g class="cb${L?'':' empty'}${building('wall')?' building':''}" data-b="wall" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" role="button" tabindex="0" aria-label="${BLD.wall.name}"><ellipse cx="0" cy="-12" rx="44" ry="26" fill="transparent"/>
    ${L?`<g class="bart">${_box(-36,0,9,st.h+12,5)}${_box(27,0,9,st.h+12,5)}<path d="M-32 ${-st.h-14} Q0 ${-st.h-30} 32 ${-st.h-14}" stroke="${st.post}" stroke-width="3" fill="none"/><circle cx="0" cy="${-st.h-22}" r="2.4" fill="${L>=6?'#5ff2d6':'#ffd34d'}" class="blink"/>${L>=6?`<path d="M-27 -4 H27 M-27 -10 H27" stroke="#5ff2d6" stroke-width=".8" opacity=".5" class="efence"/>`:''}</g>`:`<g class="plot"><circle cx="0" cy="-16" r="11" fill="#0b1226cc" stroke="#9fe8ff" stroke-width="1.2"/><path d="M-5 -16h10M0 -21v10" stroke="#9fe8ff" stroke-width="2" stroke-linecap="round"/></g>`}
    ${L?lvBadge(L,30,-st.h-30):''}</g>`}
/* creatures: little green aliens, a six-legged crawler, a horned beast, a tentacled blob and a saucer */
const MDEFS=`<defs>
<radialGradient id="mAH" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#d8ffc0"/><stop offset=".45" stop-color="#7fd86a"/><stop offset="1" stop-color="#2f7a3a"/></radialGradient>
<linearGradient id="mAS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a6a8a"/><stop offset="1" stop-color="#1c2a40"/></linearGradient>
<radialGradient id="mEye" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#3a3a5a"/><stop offset=".6" stop-color="#0a0a16"/><stop offset="1" stop-color="#000"/></radialGradient>
<radialGradient id="mBug" cx="35%" cy="25%" r="80%"><stop offset="0" stop-color="#ffb070"/><stop offset=".4" stop-color="#b8582a"/><stop offset="1" stop-color="#4a1c10"/></radialGradient>
<radialGradient id="mBugH" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#d07040"/><stop offset="1" stop-color="#3a160c"/></radialGradient>
<radialGradient id="mBeast" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="#c79af0"/><stop offset=".45" stop-color="#7a44b0"/><stop offset="1" stop-color="#2e1450"/></radialGradient>
<linearGradient id="mBelly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6ac8" stop-opacity="0"/><stop offset="1" stop-color="#d8c0f0"/></linearGradient>
<linearGradient id="mHorn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a7a5a"/><stop offset="1" stop-color="#fff4d8"/></linearGradient>
<radialGradient id="mGlowY" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd34d"/><stop offset="1" stop-color="#ff9a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="mGlowR" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe0e0"/><stop offset=".45" stop-color="#ff3d3d"/><stop offset="1" stop-color="#ff0000" stop-opacity="0"/></radialGradient>
<radialGradient id="mBlob" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ff9aa8" stop-opacity=".95"/><stop offset=".5" stop-color="#e0304a" stop-opacity=".9"/><stop offset="1" stop-color="#6a0a1a" stop-opacity=".95"/></radialGradient>
<radialGradient id="mCore" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd0d8"/><stop offset=".6" stop-color="#ff6a80" stop-opacity=".6"/><stop offset="1" stop-color="#ff6a80" stop-opacity="0"/></radialGradient>
<linearGradient id="mUfo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0f4f8"/><stop offset=".5" stop-color="#9aa6b6"/><stop offset="1" stop-color="#4a5464"/></linearGradient>
<radialGradient id="mUfoG" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#e8fff8" stop-opacity=".95"/><stop offset=".6" stop-color="#5ff2d6" stop-opacity=".55"/><stop offset="1" stop-color="#1a6a7a" stop-opacity=".8"/></radialGradient>
<linearGradient id="mBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fffb8" stop-opacity=".5"/><stop offset="1" stop-color="#9fffb8" stop-opacity="0"/></linearGradient>
</defs>`;
const CRE={
  alien:`<ellipse cx="1" cy="1" rx="9" ry="2.4" fill="#000" opacity=".4"/>
    <g class="lg la"><path d="M-2 -14 L-4 -6 L-3 0" stroke="#1c2a40" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-6 0 h5" stroke="#2a2e3a" stroke-width="2.4" stroke-linecap="round"/></g>
    <g class="lg lb"><path d="M2 -14 L3 -6 L2 0" stroke="#2a3c58" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0 h5" stroke="#3a3e4a" stroke-width="2.4" stroke-linecap="round"/></g>
    <path d="M-6 -14 C-7 -20 -5 -26 0 -26 C5 -26 7 -20 6 -14 Z" fill="url(#mAS)"/><path d="M-5.5 -15.5 H5.5" stroke="#ffd34d" stroke-width="1.4"/><circle cx="0" cy="-20" r="1.8" fill="#5ff2d6" class="chest"/><path d="M-4 -24 C-2 -25.5 2 -25.5 4 -24" stroke="#8aa8c8" stroke-width=".8" fill="none"/>
    <g class="garm"><path d="M5 -23 C9 -21 10 -18 12 -18" stroke="#2a3c58" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M11 -20.5 h7 v3 h-3 l-1 2 h-2 l0 -2 h-1Z" fill="#c7cfd8" stroke="#3a4250" stroke-width=".4"/><circle cx="18.5" cy="-19" r="1.3" fill="#ff5d73" class="chest"/></g>
    <path d="M-5 -23 C-8 -21 -9 -18 -8 -15" stroke="#1c2a40" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="-8" cy="-14.5" r="1.4" fill="#6fc05a"/>
    <rect x="-1.4" y="-29" width="2.8" height="4" fill="#5fb05a"/>
    <path d="M0 -50 C9 -50 12 -43 10 -37 C8 -32 4 -29 0 -29 C-4 -29 -8 -32 -10 -37 C-12 -43 -9 -50 0 -50 Z" fill="url(#mAH)" stroke="#2f6a34" stroke-width=".5"/>
    <path d="M-7 -46 C-4 -49 1 -49.5 4 -48" stroke="#fff" stroke-width="1.4" fill="none" opacity=".55" stroke-linecap="round"/>
    <g class="eyes"><path d="M1.5 -41 C4 -44 9 -43.5 9.5 -40 C9 -37.5 5 -36.5 2.5 -38 Z" fill="url(#mEye)"/><path d="M-1.5 -41 C-4 -44 -8 -43.5 -8 -40 C-7.5 -37.5 -4 -36.5 -2 -38 Z" fill="url(#mEye)"/><circle cx="6" cy="-41.5" r="1" fill="#fff"/><circle cx="7.5" cy="-39.4" r=".5" fill="#9fe8ff"/><circle cx="-4" cy="-41.5" r=".9" fill="#fff"/></g>
    <path d="M1 -33 Q3 -32 5 -33.5" stroke="#1f4a24" stroke-width=".8" fill="none" stroke-linecap="round"/><ellipse cx="7" cy="-35" rx="1.6" ry=".8" fill="#ff9ab0" opacity=".35"/>
    <path d="M-3 -49 C-5 -54 -7 -57 -8 -59 M3 -49 C5 -54 6 -57 8 -59" stroke="#5fb05a" stroke-width="1" fill="none"/><circle cx="-8" cy="-59.5" r="2" fill="url(#mGlowY)" class="tip"/><circle cx="8" cy="-59.5" r="2" fill="url(#mGlowY)" class="tip"/>`,
  bug:`<ellipse cx="0" cy="1" rx="16" ry="3" fill="#000" opacity=".4"/>
    ${[[-9,'la'],[-3,'lb']].map(([x,c])=>`<g class="lg ${c}"><path d="M${x} -6 L${x-4} -11 L${x-7} 0" stroke="#3a160c" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M${x-7} 0 l-1.5 .5" stroke="#1a0a06" stroke-width="1.4"/></g>`).join('')}
    ${[[2,'lb'],[7,'la']].map(([x,c])=>`<g class="lg ${c}"><path d="M${x} -6 L${x+5} -11 L${x+9} 0" stroke="#3a160c" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M${x+9} 0 l1.5 .5" stroke="#1a0a06" stroke-width="1.4"/></g>`).join('')}
    <path d="M-17 -7 C-22 -9 -24 -15 -20 -17 C-18 -14 -17 -12 -14 -11" fill="url(#mBugH)" stroke="#2a0e06" stroke-width=".5"/><path d="M-20 -17 l-2 -3 l3 1Z" fill="#ffd8a0"/>
    <path d="M-15 -6 C-17 -16 -6 -20 2 -18 C8 -17 9 -10 8 -6 Z" fill="url(#mBug)" stroke="#2a0e06" stroke-width=".6"/>
    <path d="M-10 -17.5 C-11 -12 -10 -8 -9 -6 M-4 -19 C-5 -13 -4 -9 -3 -6 M2 -18.5 C1.5 -13 2 -9 2.5 -6" stroke="#4a1c10" stroke-width=".9" fill="none"/>
    <path d="M-11 -16 C-6 -19.5 0 -19 4 -17" stroke="#ffd0a0" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>
    <path d="M6 -14 C12 -16 16 -12 15 -7 C14 -4 9 -4 7 -6 Z" fill="url(#mBugH)" stroke="#2a0e06" stroke-width=".5"/>
    <circle cx="12.5" cy="-11" r="1.5" fill="url(#mGlowR)" class="tip"/><circle cx="10" cy="-12" r="1.1" fill="url(#mGlowR)" class="tip"/>
    <g class="jaw"><path d="M15 -8 C19 -9 20 -6 18 -4 M15 -6 C18 -5 19 -2 16.5 -1.5" stroke="#1a0a06" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>
    <path d="M13 -13 C16 -18 19 -19 22 -20 M11 -13.5 C12 -19 14 -21 16 -23" stroke="#3a160c" stroke-width=".8" fill="none"/>`,
  beast:`<ellipse cx="2" cy="1" rx="22" ry="4" fill="#000" opacity=".42"/>
    <g class="lg lb"><path d="M-13 -14 C-15 -8 -15 -4 -14 0" stroke="#2e1450" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-17 0 l2 -2 l1 2 l1 -2 l1 2" fill="#e8dcc0"/></g>
    <g class="lg la"><path d="M8 -14 C9 -8 9 -4 9 0" stroke="#2e1450" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M6 0 l2 -2 l1 2 l1 -2 l1 2" fill="#e8dcc0"/></g>
    <path d="M-20 -16 C-28 -16 -32 -10 -30 -4 C-29 -1 -27 0 -26 -2" stroke="#5a2c90" stroke-width="3" fill="none" stroke-linecap="round" class="tail"/>
    <path d="M-22 -15 C-23 -27 -8 -33 4 -31 C14 -30 19 -24 18 -16 C17 -10 12 -8 4 -8 C-6 -8 -20 -8 -22 -15 Z" fill="url(#mBeast)" stroke="#24103c" stroke-width=".7"/>
    <path d="M-18 -11 C-10 -8 2 -8 14 -11" stroke="url(#mBelly)" stroke-width="5" fill="none" opacity=".6"/>
    ${[-17,-11,-5,1,7].map((x,i)=>`<path d="M${x} ${-28+Math.abs(i-2)*1.4} l3 -${7-Math.abs(i-2)} l3 ${7-Math.abs(i-2)}Z" fill="#e8dcc0" stroke="#8a7a5a" stroke-width=".4"/>`).join('')}
    <path d="M-16 -24 C-8 -29 2 -29 8 -27" stroke="#d8b8ff" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/>
    <g class="lg la"><path d="M-8 -12 C-9 -7 -9 -3 -9 0" stroke="#3e1c68" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M-12 0 l2 -2 l1 2 l1 -2 l1 2" fill="#fff4d8"/></g>
    <g class="lg lb"><path d="M13 -12 C15 -7 15 -3 15 0" stroke="#3e1c68" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M12 0 l2 -2 l1 2 l1 -2 l1 2" fill="#fff4d8"/></g>
    <g class="head"><path d="M14 -24 C22 -30 32 -26 32 -19 C32 -15 30 -13 27 -13 L18 -12 C15 -14 13 -19 14 -24 Z" fill="url(#mBeast)" stroke="#24103c" stroke-width=".7"/>
      <path d="M17 -25 C15 -33 17 -38 22 -41 C20 -36 21 -31 22 -27 Z" fill="url(#mHorn)" stroke="#6a5a3a" stroke-width=".4"/><path d="M23 -27 C24 -34 28 -37 32 -38 C29 -34 28 -30 27 -26 Z" fill="url(#mHorn)" stroke="#6a5a3a" stroke-width=".4"/>
      <circle cx="25" cy="-21" r="3.6" fill="url(#mGlowY)" class="tip"/><circle cx="25.5" cy="-21" r="1.2" fill="#3a1a00"/>
      <g class="jaw"><path d="M19 -14 C24 -11 30 -11 32 -14 L31 -16 L19 -16 Z" fill="#2a0c3a"/><path d="M21 -16 l1 2 l1 -2 M25 -16 l1 2 l1 -2 M29 -16 l1 2 l1 -2" fill="#fff" stroke="#fff" stroke-width=".4"/></g>
      <circle cx="31" cy="-18.5" r=".8" fill="#24103c"/></g>`,
  blob:`<ellipse cx="0" cy="1" rx="15" ry="3.2" fill="#000" opacity=".4"/>
    <g class="ooze"><path d="M-15 0 C-17 -10 -13 -22 -4 -26 C4 -29 13 -24 15 -14 C17 -6 16 -2 15 0 Q12 -2 10 1 Q7 -2 4 1 Q1 -2 -2 1 Q-5 -2 -8 1 Q-11 -2 -15 0 Z" fill="url(#mBlob)" stroke="#5a0a18" stroke-width=".6"/>
      <circle cx="-1" cy="-11" r="7" fill="url(#mCore)"/>
      <circle class="bubl" cx="-7" cy="-6" r="1.4" fill="#ffc0c8" opacity=".7"/><circle class="bubl b2" cx="7" cy="-8" r="1" fill="#ffc0c8" opacity=".7"/><circle class="bubl b3" cx="2" cy="-4" r=".8" fill="#ffc0c8" opacity=".7"/>
      <path d="M-11 -18 C-8 -24 -1 -26 4 -25" stroke="#fff" stroke-width="2.2" fill="none" opacity=".55" stroke-linecap="round"/><circle cx="-12" cy="-13" r="1.1" fill="#fff" opacity=".6"/>
      <path d="M-6 0 q0 4 1.5 5 q1.5 -1 1 -5" fill="#c0203a" class="drip"/>
      <g class="eyes"><circle cx="-4" cy="-17" r="4" fill="#fff"/><circle cx="6" cy="-18" r="3.3" fill="#fff"/><circle cx="1" cy="-23.5" r="2.4" fill="#fff"/>
        <g class="pupils"><circle cx="-3" cy="-16.5" r="2" fill="#1a0006"/><circle cx="7" cy="-17.6" r="1.7" fill="#1a0006"/><circle cx="1.8" cy="-23.2" r="1.2" fill="#1a0006"/></g>
        <circle cx="-4.6" cy="-18.2" r=".8" fill="#fff"/><circle cx="5.4" cy="-19.1" r=".6" fill="#fff"/></g>
      <path d="M-4 -9 C-1 -6 4 -6 7 -9 C5 -7.5 -2 -7.5 -4 -9 Z" fill="#3a0010"/><path d="M-2 -8.2 l.8 1.2 l.8 -1.2 M2 -8.2 l.8 1.2 l.8 -1.2" fill="#fff" stroke="#fff" stroke-width=".3"/></g>`,
  ufo:`<g class="hover"><path d="M-8 6 L-20 46 L20 46 L8 6 Z" fill="url(#mBeam)" class="beam"/>
    <ellipse cx="0" cy="6" rx="10" ry="2.6" fill="#9fffb8" opacity=".6" class="tip"/>
    <path d="M-22 3 C-22 7 22 7 22 3 C18 9 -18 9 -22 3 Z" fill="#3a4250"/>
    <ellipse cx="0" cy="2.6" rx="22" ry="5.2" fill="url(#mUfo)" stroke="#2a3040" stroke-width=".5"/>
    <path d="M-20 2 C-12 -0.5 12 -0.5 20 2" stroke="#fff" stroke-width=".9" fill="none" opacity=".7"/>
    <g class="ufol">${[-16,-8,0,8,16].map((x,i)=>`<circle cx="${x}" cy="${4.2+Math.abs(x)*-0.04}" r="1.3" fill="${['#ffd34d','#ff5d73','#5ff2d6','#ff5d73','#ffd34d'][i]}" class="ul u${i}"/>`).join('')}</g>
    <path d="M-10 0 C-10 -11 10 -11 10 0 Z" fill="url(#mUfoG)" stroke="#bff8ee" stroke-width=".5"/>
    <g opacity=".85"><ellipse cx="0" cy="-3.6" rx="2.6" ry="3.2" fill="#3a8a4a"/><ellipse cx="-1" cy="-4.4" rx=".9" ry="1.2" fill="#000"/><ellipse cx="1.2" cy="-4.4" rx=".9" ry="1.2" fill="#000"/><path d="M-3 0 C-3 -2 3 -2 3 0" fill="#2a6a3a"/></g>
    <path d="M-6 -6 C-4 -8 0 -8.6 2 -8.2" stroke="#fff" stroke-width="1.2" fill="none" opacity=".75" stroke-linecap="round"/></g>`};
const CTOP={alien:-66,bug:-27,beast:-46,blob:-33,ufo:-14};
const ROAM=[
  ['alien','M-55 700 C20 684 90 716 150 700',17],['beast','M-50 340 C-38 420 -56 500 -42 590',30],
  ['blob','M406 360 C396 430 412 500 400 590',26],['bug','M415 736 C360 716 300 750 230 728',13],
  ['alien','M-45 728 C30 710 100 742 160 728',19],['alien','M402 640 C380 670 330 690 290 708',15],
  ['ufo','M-40 236 C60 200 140 250 220 214 S360 230 420 210',22],['bug','M-58 620 C-40 650 0 680 30 702',14],
  ['beast','M300 762 C240 750 140 772 60 758',34]];
/* ---------- defence towers on the fence, and the live battle with the creatures outside ---------- */
const TDEG=[160,20,200,340,128,52,236,304];
const towerN=()=>Math.min(TDEG.length,col.b.tower||0);
const tierOf=L=>L>=7?'plasma':L>=4?'laser':'gun';
const WNAME={gun:'رشاش',laser:'ليزر',plasma:'صواريخ بلازما'};
const HEAD={
  gun:'<rect x="-5" y="-4.5" width="10" height="9" rx="2.5" fill="#5a6475"/><rect x="3" y="-2.6" width="12" height="2" fill="#c7cfd8"/><rect x="3" y=".6" width="12" height="2" fill="#c7cfd8"/><circle cx="-1" cy="0" r="1.6" fill="#ffd34d"/>',
  laser:'<ellipse cx="0" cy="0" rx="6.5" ry="5.5" fill="url(#kDome)"/><rect x="3" y="-1.4" width="15" height="2.8" rx="1.2" fill="#8e9aa8"/><circle cx="18.5" cy="0" r="2" fill="#5ff2d6" class="blink"/>',
  plasma:'<rect x="-6" y="-6" width="12" height="12" rx="3" fill="#4a3a6a"/><rect x="2" y="-5.5" width="11" height="4.4" rx="2" fill="#b47aff"/><rect x="2" y="1.1" width="11" height="4.4" rx="2" fill="#b47aff"/><circle cx="13" cy="-3.3" r="1.3" fill="#ffd6ff"/><circle cx="13" cy="3.3" r="1.3" fill="#ffd6ff"/>'};
function towerSVG(i,tier,big){const [x,y]=fp(TDEG[i]*Math.PI/180),s=big?1.4:0.85;
  return `<g class="tow${big?'':' wg'}" data-b="tower" data-t="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})" role="button" tabindex="0" aria-label="${BLD.tower.name}"><ellipse cx="2" cy="1" rx="11" ry="3.4" fill="#000" opacity=".38"/>${big&&typeof ART!=='undefined'&&ART.x_tower?towerImg(tier):(big?_lattice(-6,12,-4,8,0,-20,3,'#aeb8c4')+_box(-8,-18,16,5,5):_box(-4,0,8,14,4))+`<g class="thead" transform="translate(${big?2:0} ${big?-26:-18})">${HEAD[tier]}</g>`}</g>`}
function towersSVG(half){return tint(towersRaw(half),col.b.tower||0)}
function towersRaw(half){let s='';const L=col.b.tower||0,n=towerN(),t=tierOf(L);
  for(let i=0;i<n;i++){const [,y]=fp(TDEG[i]*Math.PI/180);if((half==='back')===(y<FEN.cy))s+=towerSVG(i,t,true)}
  if((col.b.wall||0)>=4)for(const deg of [180,0,112,68]){const [,y]=fp(deg*Math.PI/180);if((half==='back')===(y<FEN.cy))s+=`<g class="wgun" data-deg="${deg}" transform="translate(${fp(deg*Math.PI/180).map(v=>v.toFixed(1)).join(' ')})"><g class="thead" transform="translate(0 ${-fenceStyle(col.b.wall).h-5})">${HEAD.gun}</g></g>`}
  return s}
/* creatures move under script control so the towers can aim at them */
const CHP={alien:3,bug:2,blob:7,beast:12,ufo:9};
/* how many creatures live outside: grows with the colony; they come back in packs */
const CTYPES=['alien','beast','bug','alien','blob','ufo','bug','alien','beast','bug','alien','blob','bug','alien','beast','alien','bug','blob','alien','ufo','bug','alien','beast','bug'];
const crType=i=>CTYPES[i%CTYPES.length];
const popN=()=>Math.min(CTYPES.length,5+col.b.hq+Math.round((col.b.tower||0)*1.2)+(col.b.def?2:0));
function creaturesSVG(){const n=popN();let s='';
  for(let i=0;i<n;i++){const t=crType(i);s+=`<g class="cre" data-i="${i}" data-cre="${t}" role="button" tabindex="0" aria-label="كائن فضائي"><g class="cflip"><g transform="scale(${t==='ufo'?1.2:1.05})"><ellipse cx="0" cy="${CTOP[t]/2}" rx="${t==='beast'?30:20}" ry="${-CTOP[t]/2+4}" fill="transparent"/>${CRE[t]}</g></g><g class="hpb" opacity="0"><rect x="-12" y="${Math.round(CTOP[t]*(t==='ufo'?1.2:1.05))-7}" width="24" height="3.4" rx="1.7" fill="#0008"/><rect class="hpf" x="-12" y="${Math.round(CTOP[t]*(t==='ufo'?1.2:1.05))-7}" width="24" height="3.4" rx="1.7" fill="#7ddc5a"/></g></g>`}
  return s+bossSVG()+'<g id="cshots"></g>'}
const BT={cr:[],tw:[],shots:[],raf:0,last:0,pos:{}};
/* free roaming: each creature picks its own destinations outside the fence, wanders, pauses, sometimes tests the fence */
const SPEED={alien:15,bug:28,beast:10,blob:7,ufo:32};
const fenceR=(x,y)=>Math.hypot((x-FEN.cx)/FEN.rx,(y-FEN.cy)/FEN.ry);
function okSpot(t,x,y){if(t==='ufo')return x>-100&&x<460&&y>150&&y<300;return x>-95&&x<455&&y>300&&y<770&&fenceR(x,y)>1.1}
function spawnPt(t){for(let k=0;k<60;k++){const x=-95+Math.random()*550,y=t==='ufo'?150+Math.random()*150:300+Math.random()*470;if(okSpot(t,x,y))return {x,y,t}}return {x:-80,y:700,t}}
function pickTarget(c){if(c.t!=='ufo'&&Math.random()<0.25){const a=Math.random()*Math.PI*2,x=FEN.cx+Math.cos(a)*FEN.rx*1.13,y=FEN.cy+Math.sin(a)*FEN.ry*1.13;if(okSpot(c.t,x,y)){c.tx=x;c.ty=y;return}}
  for(let k=0;k<30;k++){const r=c.t==='ufo'?200:40+Math.random()*130,a=Math.random()*Math.PI*2,x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r*(c.t==='ufo'?0.3:0.7);if(okSpot(c.t,x,y)){c.tx=x;c.ty=y;return}}const p=spawnPt(c.t);c.tx=p.x;c.ty=p.y}
function stepCreature(c,dt){if(c.wait>0){c.wait-=dt;c.el.classList.add('idle');return}c.el.classList.remove('idle');
  const dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy);if(d<3){c.wait=c.t==='ufo'?0.3+Math.random():0.6+Math.random()*2.6;pickTarget(c);return}
  let nx=c.x+dx/d*c.sp*dt,ny=c.y+dy/d*c.sp*dt;
  if(c.t!=='ufo'&&fenceR(nx,ny)<1.1){const a=Math.atan2((ny-FEN.cy)/FEN.ry,(nx-FEN.cx)/FEN.rx),side=((dx*-Math.sin(a)+dy*Math.cos(a))>=0?1:-1)*0.04;nx=FEN.cx+Math.cos(a+side)*FEN.rx*1.1;ny=FEN.cy+Math.sin(a+side)*FEN.ry*1.1}
  if(Math.abs(nx-c.x)>0.05)c.face=nx>c.x?1:-1;c.x=nx;c.y=ny}
function battleInit(){const svg=$('cscene');BT.cr=[];BT.tw=[];BT.shots=[];if(!svg)return;
  svg.querySelectorAll('.cre:not(.boss)').forEach(el=>{const i=+el.dataset.i,t=crType(i),max=CHP[t]+col.b.hq,keep=BT.pos[i],p=keep&&keep.t===t?keep:spawnPt(t);
    const c={el,t,i,hp:max,max,dead:0,x:p.x,y:p.y,tx:p.x,ty:p.y,wait:Math.random()*2,face:1,sp:SPEED[t]*(0.8+Math.random()*0.4),flip:el.querySelector('.cflip'),hpb:el.querySelector('.hpb'),hpf:el.querySelector('.hpf')};pickTarget(c);BT.cr.push(c)});
  {const el=svg.querySelector('.cre.boss'),old=BT.boss;const c={el,t:'beast',i:'boss',boss:1,hp:old&&!old.dead?old.hp:1,max:old?old.max:1,dead:old&&!old.dead?0:1e15,born:old?old.born:0,x:old?old.x:-90,y:old?old.y:600,tx:old?old.tx:0,ty:old?old.ty:0,wait:0,face:1,sp:6,flip:el.querySelector('.cflip'),hpb:el.querySelector('.hpb'),hpf:el.querySelector('.hpf')};if(!c.dead)el.classList.remove('gone');BT.boss=c;BT.cr.push(c)}
  const L=col.b.tower||0,tier=tierOf(L);
  svg.querySelectorAll('.tow:not(.wg)').forEach(el=>{const i=+el.dataset.t,[x,y]=fp(TDEG[i]*Math.PI/180);BT.tw.push({x:x+2*1.4,y:y-26*1.4,head:el.querySelector('.thead'),tier,dmg:1+Math.floor(L/3)+(tier==='plasma'?1:0)+techLv('dmg'),cd:i*0.37,rate:(tier==='gun'?0.45:tier==='laser'?1.1:1.6)*(1-0.08*techLv('rate')),range:tier==='plasma'?240:200,ox:2,oy:-26,ang:0})});
  svg.querySelectorAll('.wgun').forEach(el=>{const d=+el.dataset.deg,[x,y]=fp(d*Math.PI/180),h=fenceStyle(col.b.wall).h+5;BT.tw.push({x,y:y-h,head:el.querySelector('.thead'),tier:'gun',dmg:1,cd:d/180,rate:0.9,range:150,ox:0,oy:-h,ang:0})});
  crewInit(svg);specApply();
  if(!BT.raf){BT.last=performance.now();BT.raf=requestAnimationFrame(battleTick)}}
function crPos(c,now){let u=((now/1000+c.off)/c.dur)%1;const fwd=u<0.5;u=fwd?u*2:2-u*2;const pt=c.p.getPointAtLength(u*c.len);return {x:pt.x,y:pt.y,fwd}}
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e}
/* a pack of the fallen returns together from one edge of the map */
function spawnPack(list){const side=Math.floor(Math.random()*3);let px,py;for(let k=0;k<40;k++){px=side===0?-88:side===1?448:-80+Math.random()*520;py=side===2?760:330+Math.random()*420;if(okSpot('alien',px,py))break}
  list.forEach((c,j)=>{c.dead=0;c.hp=c.max;c.hpb.setAttribute('opacity','0');c.hpf.setAttribute('width','24');c.hpf.setAttribute('fill','#7ddc5a');
    if(c.t==='ufo'){const p=spawnPt('ufo');c.x=p.x;c.y=p.y}else{c.x=px+(Math.random()-0.5)*26;c.y=py+(Math.random()-0.5)*18;if(!okSpot(c.t,c.x,c.y)){c.x=px;c.y=py}}
    c.wait=j*0.25;const a=Math.atan2(c.y-FEN.cy,c.x-FEN.cx);c.tx=FEN.cx+Math.cos(a)*FEN.rx*1.14;c.ty=Math.max(305,FEN.cy+Math.sin(a)*FEN.ry*1.14);if(!okSpot(c.t,c.tx,c.ty))pickTarget(c);c.el.classList.remove('gone')})}
function battleTick(now){BT.raf=requestAnimationFrame(battleTick);const dt=Math.min(0.05,(now-BT.last)/1000);BT.last=now;
  if(BT.cr.length){const pop=BT.cr.filter(c=>!c.boss),dead=pop.filter(c=>c.dead),alive=pop.length-dead.length;if(!BT.wave)BT.wave=now+9000;
    if(dead.length&&(now>BT.wave||alive<=Math.ceil(pop.length/3))){spawnPack(dead.sort(()=>Math.random()-0.5).slice(0,Math.min(dead.length,2+Math.floor(Math.random()*4))));BT.wave=now+8000+Math.random()*9000}}
  if($('hub').hidden||$('pColony').hidden||document.hidden||!$('cscene'))return;bossTick(now);meteorTick(now);traderTick(now);const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const c of BT.cr){if(!c.el.isConnected)continue;
    if(c.dead)continue;
    if(!calm)stepCreature(c,dt);BT.pos[c.i]={x:c.x,y:c.y,t:c.t};c.el.setAttribute('transform',`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`);c.flip.setAttribute('transform',c.face<0?'scale(-1 1)':'')}
  if(calm)return;crewTick(dt);
  for(const w of BT.tw){w.cd-=dt;let best=null,bd=1e9;for(const c of BT.cr){if(c.dead||!c.el.isConnected)continue;const d=Math.hypot(c.x-w.x,c.y-12-w.y);if(d<w.range&&d<bd){bd=d;best=c}}
    if(!best)continue;const ang=Math.atan2(best.y-12-w.y,best.x-w.x)*180/Math.PI;w.ang+=((ang-w.ang+540)%360-180)*Math.min(1,dt*8);w.head.setAttribute('transform',`translate(${w.ox} ${w.oy}) rotate(${w.ang.toFixed(1)})`);
    if(w.cd<=0){w.cd=w.rate*(0.8+Math.random()*0.4);fire(w,best)}}
  const L=$('cshots');for(let i=BT.shots.length-1;i>=0;i--){const s=BT.shots[i];s.t+=dt;
    if(s.kind==='orb'){const k=Math.min(1,s.t/s.T),x=s.x0+(s.c.x-s.x0)*k,y=s.y0+(s.c.y-12-s.y0)*k-Math.sin(k*Math.PI)*18;s.el.setAttribute('cx',x.toFixed(1));s.el.setAttribute('cy',y.toFixed(1));s.tr.setAttribute('cx',(x-(s.c.x-s.x0)*0.04).toFixed(1));s.tr.setAttribute('cy',(y-(s.c.y-s.y0)*0.04).toFixed(1));
      if(k>=1){s.el.remove();s.tr.remove();BT.shots.splice(i,1);boom(x,y,'#d78aff',14);hurt(s.c,s.dmg)}}
    else if(s.t>s.T){s.el.remove();BT.shots.splice(i,1)}}}
function fire(w,c){const L=$('cshots');if(!L)return;const a=w.ang*Math.PI/180,mx=w.x+Math.cos(a)*14,my=w.y+Math.sin(a)*14,tx=c.x+(Math.random()-0.5)*6,ty=c.y-12+(Math.random()-0.5)*6;
  if(w.tier==='gun'){const e=svgEl('line',{x1:mx,y1:my,x2:tx,y2:ty,stroke:'#ffe27a','stroke-width':1.6,'stroke-dasharray':'6 60','stroke-linecap':'round',class:'tracer'});L.appendChild(e);BT.shots.push({el:e,t:0,T:0.14});
    const f=svgEl('circle',{cx:mx,cy:my,r:3,fill:'#fff3c0',class:'mflash'});L.appendChild(f);BT.shots.push({el:f,t:0,T:0.07});hurt(c,w.dmg);spark(tx,ty,'#ffd34d')}
  else if(w.tier==='laser'){const e=svgEl('line',{x1:mx,y1:my,x2:tx,y2:ty,stroke:'#7ffcf0','stroke-width':2.2,class:'beam2','stroke-linecap':'round'});const e2=svgEl('line',{x1:mx,y1:my,x2:tx,y2:ty,stroke:'#fff','stroke-width':.8});L.appendChild(e);L.appendChild(e2);BT.shots.push({el:e,t:0,T:0.16},{el:e2,t:0,T:0.12});hurt(c,w.dmg);spark(tx,ty,'#5ff2d6')}
  else{const tr=svgEl('circle',{cx:mx,cy:my,r:3.6,fill:'#b47aff',opacity:.4}),e=svgEl('circle',{cx:mx,cy:my,r:2.6,fill:'#ffd6ff',class:'orb'});L.appendChild(tr);L.appendChild(e);BT.shots.push({kind:'orb',el:e,tr,t:0,T:0.55,x0:mx,y0:my,c,dmg:w.dmg})}}
function spark(x,y,c){const L=$('cshots');if(!L)return;const e=svgEl('circle',{cx:x,cy:y,r:2.4,fill:c,class:'hitfx'});L.appendChild(e);BT.shots.push({el:e,t:0,T:0.2})}
function boom(x,y,c,r){const L=$('cshots');if(!L)return;const g=svgEl('g',{transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`});
  g.innerHTML=`<circle r="${r}" fill="${c}" class="bm1"/><circle r="${r*0.55}" fill="#fff" class="bm2"/>`+[0,1,2,3,4,5,6,7].map(k=>{const a=k*Math.PI/4+Math.random()*0.4,d=r*1.6;return `<circle r="1.6" fill="${c}" class="bmp" style="--dx:${(Math.cos(a)*d).toFixed(1)}px;--dy:${(Math.sin(a)*d).toFixed(1)}px"/>`}).join('');
  L.appendChild(g);BT.shots.push({el:g,t:0,T:0.7})}
function hurt(c,d){if(c.dead)return;c.hp-=d;c.hpb.setAttribute('opacity','1');c.hpf.setAttribute('width',Math.max(0,24*c.hp/c.max).toFixed(1));c.hpf.setAttribute('fill',c.hp/c.max>0.5?'#7ddc5a':c.hp/c.max>0.25?'#ffd34d':'#ff5d73');
  c.el.classList.remove('hit');void c.el.getBoundingClientRect();c.el.classList.add('hit');
  if(c.hp<=0){c.dead=1e15;dtask('kills',1);if(c.boss){c.el.classList.add('gone');boom(c.x,c.y-30,'#b47aff',34);bossDown(c);return}c.el.classList.add('gone');c.hpb.setAttribute('opacity','0');boom(c.x,c.y-10,c.t==='blob'?'#ff5d73':c.t==='beast'?'#b47aff':c.t==='ufo'?'#9fe8ff':'#7ddc5a',c.t==='beast'||c.t==='ufo'?18:12);
    col.kills=(col.kills||0)+1;if(prefs.sound&&Math.random()<0.5)snd('hit');
    if(Math.random()<0.15&&(BT.loot=(BT.loot||0)+1)<=40){const k=Math.random()<0.15?'c':'m',n=k==='c'?1:Math.round(2+col.b.hq);gain(k,n);fxAt(c.x,c.y-30,'+'+n+' '+RES[k][1],RES[k][2]);updRes()}
    if(col.kills%10===0)colSave()}}
function fxAt(x,y,txt,colr){const L=$('cfx');if(!L)return;const t=svgEl('text',{x,y,'text-anchor':'middle',class:'flt',fill:colr||'#fff'});t.textContent=txt;L.appendChild(t);setTimeout(()=>t.remove(),1900)}
function zapSVG(){if((col.b.wall||0)<3)return '';let s='';for(const [deg,d] of [[160,0],[20,2.6],[200,5.1],[95,7.4],[340,9.3]]){const [x,y]=fp(deg*Math.PI/180),h=fenceStyle(col.b.wall).h;
  s+=`<g class="zap" style="animation-delay:${d}s" transform="translate(${x.toFixed(1)} ${(y-h/2).toFixed(1)})"><circle r="7" fill="#9fe8ff" opacity=".35"/><path d="M-6 -4 L-1 -1 L-4 2 L3 0 L0 4 L6 1" stroke="#fff" stroke-width="1.1" fill="none"/></g>`}return s}
function sceneSVG(){const R=rng(7);let stars='',tw='';
  for(let k=0;k<230;k++){const x=(R()*1000-320).toFixed(0),y=(R()*620-370).toFixed(0),r=(R()*1.2+0.3).toFixed(1),o=(0.3+R()*0.7).toFixed(2);
    if(k%5===0)tw+=`<circle class="tw" style="animation-delay:${(R()*4).toFixed(1)}s" cx="${x}" cy="${y}" r="${(+r+0.4).toFixed(1)}" fill="#fff"/>`;else stars+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`}
  let crat='';for(let k=0;k<44;k++){const x=R()*760-200,y=290+R()*560,r=4+R()*12;crat+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${r.toFixed(1)}" ry="${(r*0.4).toFixed(1)}" fill="url(#cCrat)" opacity=".8"/>`}
  let rocks='';for(let k=0;k<60;k++){const x=R()*760-200,y=286+R()*560,r=1.5+R()*4;rocks+=`<path d="M${(x-r).toFixed(1)} ${y.toFixed(1)} l${(r*0.6).toFixed(1)} ${(-r).toFixed(1)} l${(r*1.1).toFixed(1)} ${(r*0.3).toFixed(1)} l${(r*0.5).toFixed(1)} ${(r*0.7).toFixed(1)}Z" fill="#7a5a6a"/><path d="M${(x-r).toFixed(1)} ${y.toFixed(1)} l${(r*0.6).toFixed(1)} ${(-r).toFixed(1)} l${(r*0.3).toFixed(1)} ${r.toFixed(1)}Z" fill="#a07a8a"/>`}
  let dust='';for(let k=0;k<20;k++)dust+=`<circle class="dust" style="animation-delay:${(R()*9).toFixed(1)}s;animation-duration:${(7+R()*6).toFixed(1)}s" cx="${(R()*360).toFixed(0)}" cy="${(320+R()*360).toFixed(0)}" r="${(0.8+R()*1.4).toFixed(1)}" fill="#ffd9c0"/>`;
  const order=Object.keys(SLOT).filter(k=>k!=='wall'&&k!=='tower').sort((a,b)=>SLOT[a][1]-SLOT[b][1]);let g='';
  for(const id of order){const [x,y,base]=SLOT[id],L=col.b[id],bl=building(id),lk=BLD[id].req&&col.b.hq<BLD[id].req,sc=(base*(0.92+Math.min(10,L)*0.02)).toFixed(3);
    g+=`<g class="cb${L?'':' empty'}${bl?' building':''}" data-b="${id}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${BLD[id].name}"><ellipse cx="0" cy="-20" rx="50" ry="46" fill="transparent"/>`;
    if(L>=10)g+=`<ellipse class="aura" cx="0" cy="-6" rx="${46*base}" ry="${16*base}" fill="url(#kLamp)"/>`;
    if(L||id==='dock')g+=`<g class="bart" transform="scale(${sc})">${art(id,L)}</g>`;
    if(!L&&id!=='dock')g+=`<g class="ghost${lk?' glock':''}" transform="scale(${sc})">${art(id,1)}</g><g class="plot"><ellipse cx="0" cy="-2" rx="30" ry="10" fill="#9fe8ff" opacity=".08" stroke="#9fe8ff" stroke-dasharray="5 4" stroke-width="1.2"/><circle cx="0" cy="-20" r="11" fill="#0b1226cc" stroke="${lk?'#8a93a2':'#9fe8ff'}" stroke-width="1.2"/>${lk?`<text y="-16" text-anchor="middle" font-size="11">🔒</text>`:'<path d="M-5 -20h10M0 -25v10" stroke="#9fe8ff" stroke-width="2" stroke-linecap="round"/>'}</g>`;
    if(bl)g+=`<g class="scaf"><path d="M-26 2 V-44 M26 2 V-44 M-26 -14 H26 M-26 -30 H26 M-26 -14 L26 -30 M-26 -44 H34 M30 -44 V-30" stroke="#ffd34d" stroke-width="1.6" fill="none"/><path d="M30 -30 v6" stroke="#ddd" stroke-width=".8"/><rect x="27" y="-24" width="6" height="4" fill="#8f99a8"/>${[0,1,2,3,4].map(i=>`<circle class="spark" style="animation-delay:${i*0.25}s" cx="${-10+i*5}" cy="-18" r="1.2" fill="#fff3c0"/>`).join('')}</g>`;
    if(L)g+=lvBadge(L,id==='hq'?34:24,id==='hq'?-70:-54);
    g+='</g>'}
  const roverPath='M184 470 Q120 486 64 466 Q40 500 70 580 Q130 600 184 584 Q240 600 298 580 Q330 500 296 462 Q240 486 184 470Z';
  return `<svg class="cscene ${phase()}${raidSoon()?' raid':''}" id="cscene" viewBox="-20 0 400 780" preserveAspectRatio="xMidYMid slice" aria-label="خريطة المستعمرة">${ADEFS}${tintDefs()}${MDEFS}<defs>
    <linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[phase()][0]}"/><stop offset=".55" stop-color="${SKY[phase()][1]}"/><stop offset=".85" stop-color="${SKY[phase()][2]}"/><stop offset="1" stop-color="${SKY[phase()][3]}"/></linearGradient>
    <linearGradient id="cGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5266"/><stop offset=".15" stop-color="#5a4058"/><stop offset="1" stop-color="#1a1224"/></linearGradient>
    <linearGradient id="cHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3350"/><stop offset="1" stop-color="#3a2a44"/></linearGradient>
    <linearGradient id="cHill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2240"/><stop offset="1" stop-color="#3a2a48"/></linearGradient>
    <radialGradient id="cPlanet" cx="35%" cy="35%"><stop offset="0" stop-color="#ffd9a0"/><stop offset=".7" stop-color="#d97a4a"/><stop offset="1" stop-color="#7a3a2a"/></radialGradient>
    <radialGradient id="cNeb" cx="50%" cy="50%"><stop offset="0" stop-color="#b47aff" stop-opacity=".28"/><stop offset="1" stop-color="#b47aff" stop-opacity="0"/></radialGradient>
    <radialGradient id="cNeb2" cx="50%" cy="50%"><stop offset="0" stop-color="#5ff2d6" stop-opacity=".16"/><stop offset="1" stop-color="#5ff2d6" stop-opacity="0"/></radialGradient>
    <radialGradient id="cCrat" cx="40%" cy="35%"><stop offset="0" stop-color="#1a1222"/><stop offset=".8" stop-color="#3a2a44"/><stop offset="1" stop-color="#9a7088"/></radialGradient>
    <linearGradient id="cMeteor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
    <rect x="-700" y="-900" width="1760" height="1250" fill="${SKY[phase()][0]}"/><rect x="-700" y="-40" width="1760" height="330" fill="url(#cSky)"/><ellipse cx="90" cy="120" rx="140" ry="60" fill="url(#cNeb)"/><ellipse cx="280" cy="210" rx="120" ry="50" fill="url(#cNeb2)"/>${stars}${tw}
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
    ${dust}${fenceSVG('back')}${towersSVG('back')}${g}${fenceSVG('front')}${towersSVG('front')}${gateSVG()}${traderSVG()}${creaturesSVG()}${zapSVG()}${nightLights()}${guideSVG()}${bubbleSVG()}<g id="cfx"></g>
    <g class="drone"><animateMotion dur="18s" repeatCount="indefinite" path="M-20 300 C80 250 160 330 240 280 S380 300 400 270"/><ellipse cx="0" cy="0" rx="6" ry="2" fill="#c7cfd8"/><path d="M-8 -2h5M3 -2h5" stroke="#9aa4b2" stroke-width="1"/><circle cx="0" cy="1.5" r="1" fill="#5ff2d6" class="blink"/></g>
    </svg>`}
/* camera: the colony opens zoomed out to fit; pinch, drag, mouse wheel or the +/- buttons move it */
const cam={z:1,x:180,y:null};
function camView(){const svg=$('cscene');if(!svg)return;const r=svg.getBoundingClientRect();if(!r.width||!r.height)return;
  const W=500/cam.z,H=W*r.height/r.width,u=W/r.width,bottomPad=118*u,topPad=100*u;
  if(cam.y==null){const lo=262-topPad+H/2,hi=748+bottomPad-H/2;cam.y=lo>hi?hi:Math.max(lo,Math.min(hi,(lo+hi)/2))}
  const mnx=-130+W/2,mxx=490-W/2;cam.x=mnx>mxx?180:Math.max(mnx,Math.min(mxx,cam.x));
  const mny=-260+H/2,mxy=900-H/2;cam.y=mny>mxy?(mny+mxy)/2:Math.max(mny,Math.min(mxy,cam.y));
  svg.setAttribute('viewBox',`${(cam.x-W/2).toFixed(1)} ${(cam.y-H/2).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}`)}
function camZoom(f,px,py){const svg=$('cscene');if(!svg)return;const r=svg.getBoundingClientRect(),W=500/cam.z,H=W*r.height/r.width;
  const ux=cam.x-W/2+((px==null?r.width/2:px-r.left)/r.width)*W,uy=cam.y-H/2+((py==null?r.height/2:py-r.top)/r.height)*H;
  const nz=Math.max(0.8,Math.min(3,cam.z*f)),k=cam.z/nz;cam.x=ux+(cam.x-ux)*k;cam.y=uy+(cam.y-uy)*k;cam.z=nz;camView()}
let camDrag=false;
function camBind(){const svg=$('cscene');if(!svg)return;const pts=new Map();let start=null,pinch=0;camDrag=false;
  svg.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1){start={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};camDrag=false}if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
  svg.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=svg.getBoundingClientRect(),u=(500/cam.z)/r.width;
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
  const info=B.prod&&L?`${RES[B.prod[0]][1]} +${B.prod[0]==='c'?(B.prod[1]*L*Math.pow(1.15,L-1)*mult()).toFixed(1):fmtN(B.prod[1]*L*Math.pow(1.15,L-1)*mult())}/س`:id==='hq'?`📦 ${fmtN(cap())}`:id==='habitat'?`🧑‍🚀 ${crew()}`:id==='wall'&&L?`إنتاج +${3*L}%`:id==='tower'&&L?`🗼 ${towerN()} · ${WNAME[tierOf(L)]}`:id==='def'&&L?`غنائم +${col.b.def*20}%`:'';
  let h=`<div class="cbc${locked?' locked':''}"><div class="ch"><span class="ci"><svg viewBox="-52 -64 104 76">${art(id,Math.max(1,L))}</svg></span><span class="ctt"><b>${B.name}</b><small>${locked?'<span class="golink" data-to="b:hq" role="button" tabindex="0">🔒 القيادة '+B.req+' ‹</span>':L?`مستوى ${L} <i class="tchip" style="--t:${TINT[L]||'#d6dee8'}">${TNAME[L]}</i>`+(info?' · '+info:''):'غير مبني'}</small></span></div>`;
  h+=stagesHTML(id,L);
  if(building(id))h+=`<p class="cd">🏗️ قيد البناء…</p>`;
  else if(!locked&&!max&&id!=='hq'&&L>col.b.hq)h+='<button class="cd need" type="button" data-to="b:hq">🔒 يحتاج القيادة '+L+' ‹</button>';
  else if(!locked&&!max)h+=`<div class="ccost">${costHTML(c)}<span class="cc time">⏱️ ${fmtDur(upTime(id))}</span></div><button class="btn${L?'':' main'}" type="button" data-up="${id}">${L?'⬆️ مستوى '+(L+1)+' <i class="tdot" style="--t:'+(TINT[L+1]||'#d6dee8')+'"></i>':'🏗️ بناء'}</button>`;
  else if(max)h+='<p class="cd">✔️ الأعلى</p>';
  if(G&&L){const pr=G.progress?G.progress():{};h+=`<p class="cd rec">🏆 ${B.game==='survive'?'أطول صمود '+fmtDur(col.surv||0):'انتصارات '+(col.wins[B.game]||0)+' · المستوى '+(pr.level||1)}${col.streak&&col.streak[B.game]?' · 🔥 سلسلة '+col.streak[B.game]:''}</p>`}
  if(G&&L)h+=`<button class="btn task" type="button" data-go="${B.game}" aria-label="${B.task}">🎮 مهمة</button>`;
  h+=extraCard(id,L);
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
function renderSheet(){const m=$('csheet');if(!m||!sheetId)return;const c=m.querySelector('.csc');
  if(sheetId==='trader'){c.innerHTML=traderHTML();c.querySelectorAll('[data-trade]').forEach(b=>b.onclick=()=>trade(+b.dataset.trade));return}
  if(sheetId==='tasks'){c.innerHTML=tasksHTML();c.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>claimTask(+b.dataset.claim));return}
  if(sheetId==='lab'){c.innerHTML=cardHTML('lab')+labHTML();bindActions(c);c.querySelectorAll('[data-tech]').forEach(b=>b.onclick=()=>startResearch(b.dataset.tech));return}
  if(sheetId==='list'){c.innerHTML=listHTML();c.querySelectorAll('[data-open]').forEach(r=>r.onclick=e=>{if(e.target.closest('[data-up]'))return;snd('tap');openSheet(r.dataset.open)})}else c.innerHTML=cardHTML(sheetId);bindActions(c)}
/* every building in one list: you choose what to build next */
function listHTML(){let h=`<h3 class="lh">🏗️ المباني <small>${!freeSlot()?'البناء مشغول':'اختر ما تريد تطويره'}${col.bot2?' · 🤖×2':''}</small></h3><div class="blist">`;
  for(const id of BORDER){const B=BLD[id],L=col.b[id],locked=B.req&&col.b.hq<B.req,max=L>=(B.max||10),needHq=!locked&&!max&&id!=='hq'&&L>col.b.hq,c=upCost(id),ok=!locked&&!max&&!needHq&&canPay(c)&&!!freeSlot()&&!building(id);
    const st=locked?`🔒 القيادة ${B.req}`:max?'✔️ الأعلى':building(id)?'🏗️ قيد البناء':needHq?`🔒 القيادة ${L}`:costHTML(c);
    h+=`<div class="brow${ok?' ok':''}" data-open="${id}" role="button" tabindex="0"><span class="bi"><svg viewBox="-52 -64 104 76">${art(id,Math.max(1,L))}</svg></span><span class="bt"><b>${B.name}</b><small>${L?`مستوى ${L} <i class="tchip" style="--t:${TINT[L]||'#d6dee8'}">${TNAME[L]}</i>`:'غير مبني'}</small><span class="bc">${st}</span></span>${!locked&&!max&&!needHq&&!building(id)?`<button class="btn${ok?' main':''}" type="button" data-up="${id}">${L?'⬆️ '+(L+1):'🏗️'}</button>`:''}</div>`}
  return h+'</div>'}
function closeSheet(){const m=$('csheet');sheetId=null;if(!m)return;m.classList.remove('on');setTimeout(()=>{if(!sheetId)m.hidden=true},250)}
function rankChip(){try{const i=rankOf(prof.xp);return `<span class="crk">${RANKS[i][2]} ${RANKS[i][1]}</span>`}catch(e){return ''}}
function renderColony(){const host=$('colony');if(!host)return;accrue();raidCheck();questCheck();const Q=QUESTS[col.q];
  let h=`<div class="cscene-wrap">${sceneSVG()}</div><div class="ctop"><div class="cres">${resBar()}</div><div class="crow">${rankChip()}${typeof festChip==='function'?festChip():''}${galOpen()?`<button class="cgalb${col.exp&&Date.now()>=col.exp.end?' ready':''}" type="button" data-gal aria-label="خريطة المجرة">🌌</button>`:''}<button class="ctaskb" type="button" aria-label="مهام اليوم">📋<i ${tasksReady()?'':'hidden'}>${tasksReady()}</i></button>${col.intro&&chestReady()?'<button class="cchestb" type="button" aria-label="مكافأة اليوم">🎁</button>':''}</div></div><div class="cbot"><div class="cbrow"><button class="cbtn" type="button" data-list aria-label="كل المباني">🏗️ المباني</button><button class="ccall" type="button" hidden>⤓ جمع الكل</button></div>${raidSoon()?`<div class="craid"><span>⚠️ غارة بعد <b data-raid>${fmtDur((col.raid.at-Date.now())/1000)}</b></span><button class="btn" type="button" data-go="survive">🛡️ دافع</button></div>`:''}`;
  if(col.rs){const left=(col.rs.end-Date.now())/1000,pc=Math.min(100,100-left/col.rs.len*100);h+=`<div class="cbuild crs"><span>🔬 <b>${TECH[col.rs.k].n}</b> ← ${(col.tech[col.rs.k]||0)+1}</span><span class="ct" data-rt>${fmtDur(left)}</span><button class="btn" type="button" data-rrush aria-label="إنهاء البحث الآن">⚡ 💎 <span data-rrc>${Math.max(1,Math.ceil(left/60))}</span></button><i><u data-rp style="width:${pc}%"></u></i></div>`}
  if(col.build){const B=BLD[col.build.id],left=(col.build.end-Date.now())/1000,pc=Math.min(100,100-left/col.build.len*100);
    h+=`<div class="cbuild"><span>🏗️ <b>${B.name}</b> ← ${col.b[col.build.id]+1}</span><span class="ct" data-t>${fmtDur(left)}</span><button class="btn" type="button" data-rush aria-label="إنهاء الآن">⚡ 💎 <span data-rc>${Math.max(1,Math.ceil(left/60))}</span></button><i><u data-p style="width:${pc}%"></u></i></div>`}
  if(col.build2){const B=BLD[col.build2.id],left=(col.build2.end-Date.now())/1000,pc=Math.min(100,100-left/col.build2.len*100);
    h+=`<div class="cbuild b2"><span>🤖 <b>${B.name}</b> ← ${col.b[col.build2.id]+1}</span><span class="ct" data-t2>${fmtDur(left)}</span><button class="btn" type="button" data-rush2 aria-label="إنهاء الآن">⚡ 💎 <span data-rc2>${Math.max(1,Math.ceil(left/60))}</span></button><i><u data-p2 style="width:${pc}%"></u></i></div>`}
  if(Q&&col.qhide)h+=`<button class="qmini" type="button" data-qshow aria-label="إظهار الهدف">🎯</button>`;
  else if(Q)h+=`<div class="qwrap"><button class="qhide" type="button" data-qhide aria-label="إخفاء الهدف">✕</button><button class="qt" type="button" data-to="${Q.go?'g:'+Q.go:'b:'+Q.b}"><span class="qi">🎯</span><b></b><span class="qr">${Object.entries(Q.r).map(([k,n])=>'+'+n+' '+RES[k][1]).join(' ')}</span><i class="qa" aria-hidden="true">‹</i></button></div>`;
  else h+=`<button class="qt" type="button" data-gal><span class="qi">🌌</span><b>الفصل الثاني: أرسل المركبة لاستكشاف المجرة</b><span class="qr">${artCount()}/6 🏺</span><i class="qa">‹</i></button>`;
  h+='</div><div class="czoom"><button type="button" data-z="in" aria-label="تكبير">＋</button><button type="button" data-z="out" aria-label="تصغير">－</button><button type="button" data-z="fit" aria-label="عرض الكل">⤢</button></div>';host.innerHTML=h;
  {const qb=host.querySelector('.qt b');if(Q&&qb)qb.textContent=Q.t}
  host.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{snd('tap');const z=b.dataset.z;if(z==='fit'){cam.z=1;cam.x=180;cam.y=null;camView()}else camZoom(z==='in'?1.3:1/1.3)});camBind();battleInit();
  bindActions(host);const rb=host.querySelector('[data-rush]');if(rb)rb.onclick=rush;const rb2=host.querySelector('[data-rush2]');if(rb2)rb2.onclick=rush2;
  host.querySelectorAll('.cb').forEach(g=>{const go=()=>{if(camDrag)return;snd('tap');g.classList.remove('tap');void g.getBoundingClientRect();g.classList.add('tap');openSheet(g.dataset.b)};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter')go()}});
  host.querySelectorAll('.tow').forEach(t=>{const go=()=>{if(camDrag)return;snd('tap');openSheet('tower')};t.onclick=go;t.onkeydown=e=>{if(e.key==='Enter')go()}});
  host.querySelectorAll('.cre').forEach(el=>{const go=e=>{if(camDrag)return;e&&e.stopPropagation&&e.stopPropagation();const c=BT.cr.find(x=>x.el===el);if(c)strike(c)};el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button===0){el._pd=1}});el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go()}});
  host.querySelectorAll('.bub').forEach(b=>{const go=e=>{if(camDrag)return;e&&e.stopPropagation();collect(b.dataset.c)};b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter')go(e)}});
  const ca=host.querySelector('.ccall');if(ca)ca.onclick=collectAll;
  host.querySelectorAll('[data-gal]').forEach(b=>b.onclick=()=>{snd('tap');galaxyBox()});host.querySelectorAll('.trader').forEach(t=>t.onclick=()=>{if(camDrag)return;snd('tap');openSheet('trader')});
  const tb=host.querySelector('.ctaskb');if(tb)tb.onclick=()=>{snd('tap');openSheet('tasks')};const rr=host.querySelector('[data-rrush]');if(rr)rr.onclick=rushResearch;
  const lb=host.querySelector('[data-list]');if(lb)lb.onclick=()=>{snd('tap');openSheet('list')};
  const qh=host.querySelector('[data-qhide]');if(qh)qh.onclick=()=>{col.qhide=1;colSave();snd('tap');renderColony()};const qs=host.querySelector('[data-qshow]');if(qs)qs.onclick=()=>{col.qhide=0;colSave();snd('tap');renderColony()};const cb=host.querySelector('.cchestb');if(cb)cb.onclick=()=>{snd('tap');chestBox()};
  updBubbles();raidShow();
  renderSheet();colSave();
  if(!col.intro){col.intro=1;colSave();const m=storyBox('تحطّمت المركبة!','ابنِ المستعمرة وأصلح المركبة. كل فوز في الألعاب يجلب موارد.','لنبدأ');if(typeof ART!=='undefined'&&m){const c=m.querySelector('.cstory'),i=document.createElement('img');i.className='shero';i.src=ART.splash;i.alt='';if(c){c.prepend(i);const av=c.querySelector('.cav');if(av)av.remove()}}}
}
/* ================= pro layer: collecting, guide arrow, day/night, daily chest, raids, splash, ambience ================= */
/* --- collecting: producers fill their own store (up to 8 hours); tap the bubble to bring it home --- */
if(!col.store)col.store={mine:40,solar:40,farm:30};
const bRate=id=>{const B=BLD[id],L=col.b[id];return B.prod&&L>0?B.prod[1]*L*Math.pow(1.15,L-1)*mult()*tMul(B.prod[0]):0};
const bCap=id=>Math.max(1,bRate(id)*(8+2*techLv('offline')));
function fillStores(dt){for(const id of Object.keys(PRODB)){const r=bRate(id);if(r>0)col.store[id]=Math.min(bCap(id),(col.store[id]||0)+r*dt)}}
const bubMin=id=>Math.max(id==='radio'?0.5:3,bRate(id)*0.02);
function collect(id,quiet){const k=PRODB[id],have=col.store[id]||0;if(have<1&&!(k==='c'&&have>=0.5))return 0;
  let take=k==='c'?Math.floor(have):Math.floor(have);if(k!=='c'){const room=Math.max(0,cap()-col.res[k]);take=Math.min(take,Math.floor(room))}
  if(take<=0){if(!quiet){snd('err');toast('📦 المخازن ممتلئة — طوّر مركز القيادة');focusB('hq')}return 0}
  col.store[id]=have-take;col.res[k]+=take;colSave();dtask('collect',1);
  if(!quiet){snd('ok');buzz(12)}flyRes(id,k,take);updBubbles();updRes();return take}
function collectAll(){let n=0;for(const id of Object.keys(PRODB))if(col.b[id]>0)n+=collect(id,true)>0?1:0;if(n){snd('win');buzz([15,30,15])}else toast('لا يوجد شيء للجمع')}
function bubbleSVG(){let s='';for(const id of Object.keys(PRODB)){if(!col.b[id])continue;const [x,y,sc]=SLOT[id],k=PRODB[id];
  s+=`<g class="bub" data-c="${id}" transform="translate(${x} ${y-62*sc})" role="button" tabindex="0" aria-label="جمع ${RES[k][0]}" style="display:none"><g class="bubi"><path d="M0 14 l-5 -6 h10Z" fill="#0b1226"/><circle r="13" fill="#0b1226" stroke="${RES[k][2]}" stroke-width="2"/><circle class="bfull" r="15.5" fill="none" stroke="${RES[k][2]}" stroke-width="1.4" opacity="0"/><text y="5" text-anchor="middle" font-size="13">${RES[k][1]}</text></g></g>`}return s}
function updBubbles(){document.querySelectorAll('#colony .bub').forEach(b=>{const id=b.dataset.c,v=col.store[id]||0,show=v>=bubMin(id);b.style.display=show?'':'none';b.classList.toggle('full',v>=bCap(id)*0.98)});
  const any=Object.keys(PRODB).some(id=>col.b[id]&&(col.store[id]||0)>=bubMin(id)),ca=document.querySelector('#colony .ccall');if(ca)ca.hidden=!any}
function updRes(){document.querySelectorAll('#colony [data-r]').forEach(e=>{e.textContent=fmtN(col.res[e.dataset.r])})}
/* icons fly from the building to the resource counter */
function flyRes(id,k,n){const svg=$('cscene'),chip=document.querySelector(`#colony [data-r="${k}"]`);if(!svg||!chip)return;
  const [x,y,sc]=SLOT[id],pt=svg.createSVGPoint();pt.x=x;pt.y=y-62*sc;const m=svg.getScreenCTM();if(!m)return;const p=pt.matrixTransform(m),t=chip.getBoundingClientRect();
  fxFloat(id,'+'+fmtN(n)+' '+RES[k][1],RES[k][2]);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  for(let i=0;i<Math.min(7,2+Math.ceil(Math.log10(n+1)*2));i++){const e=document.createElement('span');e.className='flyr';e.textContent=RES[k][1];document.body.appendChild(e);
    const sx=p.x+(Math.random()-0.5)*30,sy=p.y+(Math.random()-0.5)*20;e.style.left=sx+'px';e.style.top=sy+'px';
    const a=e.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:0},{transform:'translate(-50%,-50%) scale(1.2)',opacity:1,offset:.2},{transform:`translate(${t.left+t.width/2-sx}px,${t.top+t.height/2-sy}px) translate(-50%,-50%) scale(.7)`,opacity:.9}],{duration:650+i*70,easing:'cubic-bezier(.5,0,.7,1)',delay:i*40,fill:'forwards'});
    a.onfinish=()=>{e.remove();chip.parentElement.classList.remove('pop');void chip.offsetWidth;chip.parentElement.classList.add('pop')}}}

/* --- day and night follow the real clock --- */
function phase(){const h=new Date().getHours()+new Date().getMinutes()/60;return h>=19.5||h<5?'night':h<7?'dawn':h<17?'day':'dusk'}
const SKY={night:['#04061a','#1c1640','#4a2c58','#7a4462'],dawn:['#1a1a48','#5a3a78','#d0708a','#ffb38a'],day:['#2a4a8a','#5a6ab0','#b48ac8','#e8b0b8'],dusk:['#140c30','#4a2458','#b0506a','#ff9a6a']};
function nightLights(){if(phase()==='day')return '';let s='<rect class="nightveil" x="-700" y="-900" width="1760" height="2400" fill="#060a24" opacity="'+(phase()==='night'?.34:.18)+'"/>';
  for(const id of Object.keys(SLOT)){if(id==='wall'||id==='tower'||!col.b[id])continue;const [x,y,sc]=SLOT[id];s+=`<ellipse class="glow" cx="${x+4}" cy="${y-14*sc}" rx="${34*sc}" ry="${22*sc}" fill="url(#kLamp)" opacity=".55"/>`}
  if(col.b.wall>=3)for(const deg of [215,325,145,35])if(col.b.wall>=6){const [x,y]=fp(deg*Math.PI/180);s+=`<ellipse cx="${x}" cy="${y-34}" rx="16" ry="12" fill="url(#kLamp)" opacity=".7"/>`}
  return s}

/* --- guide: a bouncing arrow over where the current objective is done --- */
function guideSVG(){const Q=QUESTS[col.q];if(!Q||col.qhide)return '';if(Q.go==='survive')return '';const id=Q.b||GAMEOF[Q.go];if(!id||!SLOT[id])return '';const B=BLD[id];const tgt=(B&&B.req&&col.b.hq<B.req)?'hq':id;const [x,y,sc]=SLOT[tgt];
  return `<g class="guide" transform="translate(${x} ${y-(tgt==='wall'?52:80*sc)})" aria-hidden="true"><g class="gbounce"><path d="M-9 -16 h18 v10 h8 L0 8 L-17 -6 h8Z" fill="#ffd34d" stroke="#7a5a10" stroke-width="1.4" stroke-linejoin="round"/></g></g>`}

/* --- daily chest: 7-day streak --- */
const DAILY=[{m:150,e:150},{f:200,c:5},{m:300,e:300},{c:12},{m:500,e:500,f:300},{c:20},{m:900,e:900,f:600,c:40}];
const dayKey=d=>{d=d||new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()};
function chestReady(){if(!col.dly)col.dly={k:0,s:0};return col.dly.k!==dayKey()}
function chestBox(){const y=new Date();y.setDate(y.getDate()-1);const cont=col.dly.k===dayKey(y),s=cont?col.dly.s%7:0;
  const m=document.createElement('div');m.className='hmodal';m.style.zIndex=40;
  m.innerHTML=`<div class="hbox cchest"><h3>🎁 مكافأة اليوم</h3><div class="dtrack">${DAILY.map((r,i)=>`<div class="dd${i<s?' got':''}${i===s?' now':''}"><small>${i+1}</small><span>${i===6?'👑':i<s?'✅':'🎁'}</span></div>`).join('')}</div><p class="drew">${Object.entries(DAILY[s]).map(([k,n])=>'+'+n+' '+RES[k][1]).join('  ')}</p><button class="btn main" type="button">استلام</button></div>`;
  document.body.appendChild(m);const b=m.querySelector('button');b.focus();
  b.onclick=()=>{Object.entries(DAILY[s]).forEach(([k,n])=>gain(k,n));col.dly={k:dayKey(),s:s+1};colSave();snd('win');buzz([20,40,20]);celebrate(m.querySelector('.hbox'));b.disabled=true;setTimeout(()=>{m.remove();renderColony()},900)}}

/* --- raids: every few hours the creatures attack; fence and defence decide, or you defend in person --- */
const raidsOn=()=>col.b.def>0||col.q>=10;
const raidPower=()=>10+col.b.hq*10+5*(col.raidWins||0);
const defPower=()=>col.b.wall*9+col.b.def*14+(col.b.tower||0)*12+crew();
function raidPlan(from){const first=!col.raidN;col.raid={at:(from||Date.now())+(3+Math.random()*3)*3600000,str:Math.round(raidPower()*(0.85+Math.random()*0.35)*(first?0.5:1)),mine:0,first};colSave();if(first)setTimeout(()=>toast('🤖 نجم: أول غارة ستكون ضعيفة — جهّز السور والأبراج','ach'),1500)}
function raidCheck(){if(!raidsOn())return;if(!col.raid)raidPlan();const now=Date.now();
  if(now>=col.raid.at){const R=col.raid,won=R.mine||defPower()>=R.str;let txt;
    col.raidN=(col.raidN||0)+1;if(won)col.raidWins=(col.raidWins||0)+1;
    if(won){const c=5+col.b.hq+(R.mine?10:0),mm=Math.round(R.str*6);gain('c',c);gain('m',mm);txt=(R.mine?'صددت الغارة بنفسك! ':'السور والدفاع صدّا الغارة! ')+`+${c} 💎 +${mm} ⛏️`;if(R.mine)unlock&&0}
    else{const lost={};for(const k of 'mef'){lost[k]=Math.floor(col.res[k]*0.12);col.res[k]-=lost[k]}txt=`اخترقت الكائنات السور وسرقت: ${Object.entries(lost).map(([k,n])=>'-'+fmtN(n)+' '+RES[k][1]).join(' ')}. طوّر السور والدفاع.`}
    col.raidLog={won,txt,seen:0};raidPlan(now);colSave()}}
function raidSoon(){return raidsOn()&&col.raid&&!col.raid.mine&&col.raid.at-Date.now()<20*60000}
function raidShow(){const L=col.raidLog;if(!L||L.seen)return;L.seen=1;colSave();const m=storyBox(L.won?'🛡️ صددنا الغارة':'⚠️ غارة ناجحة',L.txt,'حسناً');if(L.won)celebrate(m.querySelector('.hbox'));else{snd('err');buzz([60,40,60])}}

/* --- splash on first open of the session --- */
(function splash(){try{if(sessionStorage.getItem('madar-splash'))return;sessionStorage.setItem('madar-splash','1')}catch(e){}
  const s=document.createElement('div');s.id='splash';s.innerHTML='<div class="spl"><svg viewBox="-60 -60 120 120" width="140" height="140"><defs><radialGradient id="spP" cx="35%" cy="35%"><stop offset="0" stop-color="#ffd9a0"/><stop offset=".7" stop-color="#d97a4a"/><stop offset="1" stop-color="#7a3a2a"/></radialGradient></defs><circle r="34" fill="url(#spP)"/><ellipse rx="56" ry="11" fill="none" stroke="#5ff2d6" stroke-width="3" transform="rotate(-18)" class="spring"/><circle cx="40" cy="-30" r="3" fill="#fff"/></svg><h1>مستعمرة <span>المدار</span></h1><i class="spbar"><u></u></i></div>';
  const art=typeof ART!=='undefined'&&ART.splash;if(art){s.classList.add('art');s.innerHTML='<img src="'+ART.splash+'" alt=""><div class="splt"><h1>مستعمرة <span>المدار</span></h1><p>اضغط للبدء</p></div>'}
  document.body.appendChild(s);const end=()=>{s.classList.add('out');setTimeout(()=>s.remove(),500)};s.onclick=end;setTimeout(end,art?3200:1600)})();

/* --- quiet ambience while the colony is on screen (only with sound on) --- */
let AMB=null;
function ambStart(){if(AMB||!prefs.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
  const g=AC.createGain();g.gain.value=0;g.connect(AC.destination);const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=700;f.connect(g);
  const os=[55,82.4,110.3].map((fr,i)=>{const o=AC.createOscillator();o.type=i===2?'triangle':'sine';o.frequency.value=fr;const lg=AC.createGain();lg.gain.value=i===2?0.25:0.5;o.connect(lg);lg.connect(f);o.start();return o});
  const lfo=AC.createOscillator(),lg2=AC.createGain();lfo.frequency.value=0.07;lg2.gain.value=260;lfo.connect(lg2);lg2.connect(f.frequency);lfo.start();
  g.gain.linearRampToValueAtTime(0.035,AC.currentTime+2.5);
  const ch=setInterval(()=>{if(!AMB)return;const o=AC.createOscillator(),gg=AC.createGain(),n=[660,784,880,988,1175][Math.floor(Math.random()*5)];o.type='sine';o.frequency.value=n;gg.gain.setValueAtTime(0.0001,AC.currentTime);gg.gain.exponentialRampToValueAtTime(0.018,AC.currentTime+0.05);gg.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+2.2);o.connect(gg);gg.connect(AC.destination);o.start();o.stop(AC.currentTime+2.3)},6500);
  AMB={g,os:[...os,lfo],ch}}catch(e){AMB=null}}
function ambStop(){if(!AMB)return;const a=AMB;AMB=null;clearInterval(a.ch);try{a.g.gain.cancelScheduledValues(AC.currentTime);a.g.gain.linearRampToValueAtTime(0,AC.currentTime+0.6);setTimeout(()=>a.os.forEach(o=>{try{o.stop()}catch(e){}}),700)}catch(e){}}
function ambSync(){const on=prefs.sound&&!$('hub').hidden&&!$('pColony').hidden&&!document.hidden;if(on)ambStart();else ambStop()}
addEventListener('pointerdown',()=>ambSync(),{passive:true});document.addEventListener('visibilitychange',ambSync);

/* tapping a written task takes you to it: a game opens, a building opens its sheet */
function focusB(id){snd('tap');openSheet(id)}
function goTo(to){const [k,v]=(to||'').split(':');if(k==='g'){const G=GAMES.find(x=>x.id===v);if(G){closeSheet();openGame(G)}return}
  if(k==='b'){const B=BLD[v];if(v!=='hq'&&B&&B.req&&col.b.hq<B.req){toast('🔒 القيادة '+B.req);focusB('hq');return}focusB(v)}}
// live numbers once a second while the colony is on screen; every 4 s the producers show what they made
let fxT=0;
let lastPhase=null,lastRaid=null;
setInterval(()=>{try{ambSync()}catch(e){}const host=$('colony');if(!host||$('hub').hidden||$('pColony').hidden||document.hidden)return;
  const had=col.build&&col.build.id,had2=col.build2&&col.build2.id;accrue();if(had&&!col.build){renderColony();fxRing(had);return}if(had2&&!col.build2){renderColony();fxRing(had2);return}
  if(col.build2){const left=(col.build2.end-Date.now())/1000,t=host.querySelector('[data-t2]'),p=host.querySelector('[data-p2]'),rc=host.querySelector('[data-rc2]');if(t)t.textContent=fmtDur(left);if(p)p.style.width=Math.min(100,100-left/col.build2.len*100)+'%';if(rc)rc.textContent=Math.max(1,Math.ceil(left/60))}
  document.querySelectorAll('#colony [data-r]').forEach(e=>{e.textContent=fmtN(col.res[e.dataset.r])});
  document.querySelectorAll('#colony .cc[data-k],#csheet .cc[data-k]').forEach(e=>e.classList.toggle('no',col.res[e.dataset.k]<+e.dataset.n));
  if(col.build){const left=(col.build.end-Date.now())/1000,t=host.querySelector('.cbuild:not(.b2) [data-t]'),p=host.querySelector('.cbuild:not(.b2) [data-p]'),rc=host.querySelector('.cbuild:not(.b2) [data-rc]');
    if(t)t.textContent=fmtDur(left);if(p)p.style.width=Math.min(100,100-left/col.build.len*100)+'%';if(rc)rc.textContent=Math.max(1,Math.ceil(left/60))}
  if(col.rs){if(Date.now()>=col.rs.end){researchTick();renderColony();return}const left=(col.rs.end-Date.now())/1000,t=host.querySelector('[data-rt]'),p2=host.querySelector('[data-rp]'),rc=host.querySelector('[data-rrc]');if(t)t.textContent=fmtDur(left);if(p2)p2.style.width=Math.min(100,100-left/col.rs.len*100)+'%';if(rc)rc.textContent=Math.max(1,Math.ceil(left/60))}
  if(col.exp){const gb=document.getElementById('galbox');if(gb){const gt=gb.querySelector('.gt');if(Date.now()>=col.exp.end&&gt)galaxyBox();else if(gt)gt.textContent=fmtDur((col.exp.end-Date.now())/1000)}if(Date.now()>=col.exp.end&&!col.exp.told){col.exp.told=1;toast('🚀 عادت المركبة! افتح 🌌 لاستلام الغنائم','ach');renderColony();return}}
  updBubbles();raidCheck();const rs=raidSoon();if(lastPhase&&(lastPhase!==phase()||lastRaid!==rs||(col.raidLog&&!col.raidLog.seen))){lastPhase=phase();lastRaid=rs;renderColony();return}lastPhase=phase();lastRaid=rs;
  if(rs){const e=host.querySelector('[data-raid]');if(e)e.textContent=fmtDur((col.raid.at-Date.now())/1000)}
  if(Date.now()%10000<1000)colSave()},1000);
addEventListener('pagehide',()=>{accrue();colSave()});
