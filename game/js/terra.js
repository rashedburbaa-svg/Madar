/* ================= مستعمرة المدار — الاستصلاح: turn the dead red planet into a living green world (inspired by terraforming games) =================
   Four planetary values grow from machines you build: heat 🔥, pressure ⛰️, oxygen 🌬️, biomass 🌳.
   Their sum is the Terraform Index (TI). Each stage changes how the planet looks around the colony and gives a reward. */
const TFM=[
  {id:'heater',em:'🔥',n:'سخّان كوكبي',d:'يرفع الحرارة',k:'heat',rate:30,cost:{m:400,e:300},need:0},
  {id:'vent',em:'⛰️',n:'حفّار الغازات',d:'يرفع الضغط الجوي',k:'pres',rate:30,cost:{m:600,e:200},need:0},
  {id:'oxy',em:'🌬️',n:'مولّد الأكسجين',d:'نباتات مجهرية تطلق الأكسجين',k:'o2',rate:32,cost:{e:500,f:350},need:500},
  {id:'tree',em:'🌳',n:'باذر الأشجار',d:'يزرع الغابات حول المستعمرة',k:'bio',rate:40,cost:{f:900,c:5},need:2500}];
const TFS=[
  {at:0,n:'كوكب قاحل',say:'كوكب صخري أحمر بلا هواء. لنبدأ الاستصلاح!'},
  {at:300,n:'دفء أول',say:'الحرارة ترتفع… الجليد عند القطبين بدأ يذوب.',r:{c:5}},
  {at:1000,n:'سماء زرقاء',say:'الغلاف الجوي يتكثف، والسماء صارت تميل للزرقة!',r:{c:8,m:800}},
  {at:2500,n:'غيوم ومطر',say:'تشكلت الغيوم الأولى… أول قطرات مطر منذ ملايين السنين!',r:{c:10,e:1200}},
  {at:5000,n:'طحالب',say:'بقع خضراء من الطحالب تنتشر على الصخور.',r:{c:12,f:1500}},
  {at:9000,n:'بحيرات',say:'الماء يتجمع في الفوهات وصارت عندنا بحيرات!',r:{c:15,m:3000}},
  {at:15000,n:'عشب وأزهار',say:'العشب والأزهار تغطي الأرض حول السور.',r:{c:18,e:4000}},
  {at:24000,n:'غابات',say:'الأشجار تنمو… الكوكب يتنفس!',r:{c:22,f:5000}},
  {at:36000,n:'حياة برية',say:'فراشات وطيور! الحياة عادت للكوكب.',r:{c:28,m:8000}},
  {at:52000,n:'جنّة المدار',say:'أكملت استصلاح الكوكب. هذه جنتنا الآن أيها القائد 🌍',r:{c:50}}];
function tfInit(){if(!col.tf)col.tf={heat:0,pres:0,o2:0,bio:0,m:{},st:0,last:Date.now()};col.tf.m=col.tf.m||{};return col.tf}
const tfTI=()=>{const t=tfInit();return Math.floor(t.heat+t.pres+t.o2+t.bio)};
const tfStage=()=>{const ti=tfTI();let s=0;TFS.forEach((x,i)=>{if(ti>=x.at)s=i});return s};
const tfOpen=()=>col.b.hq>=3;
function tfCost(f){const n=tfInit().m[f.id]||0;return Object.fromEntries(Object.entries(f.cost).map(([r,v])=>[r,Math.round(v*Math.pow(1.45,n))]))}
function tfRates(){const t=tfInit(),r={heat:0,pres:0,o2:0,bio:0};TFM.forEach(f=>{r[f.k]+=(t.m[f.id]||0)*f.rate});const boost=1+0.03*techLv('power');Object.keys(r).forEach(k=>r[k]*=boost);return r}
function tfTick(){const t=tfInit(),now=Date.now(),h=Math.min(24,Math.max(0,(now-(t.last||now))/3600000));t.last=now;if(h<=0)return;const r=tfRates();Object.keys(r).forEach(k=>t[k]+=r[k]*h);
  const s=tfStage();if(s>(t.st||0)){const got={};for(let i=(t.st||0)+1;i<=s;i++){const S=TFS[i];if(S.r)Object.entries(S.r).forEach(([k,v])=>{gain(k,v);got[k]=(got[k]||0)+v})}
    const S=TFS[s],jumped=s-(t.st||0);t.st=s;colSave();clearTimeout(tfTick.tm);
    tfTick.tm=setTimeout(()=>{document.querySelectorAll('.hmodal.tfbox').forEach(m=>m.remove());const box=storyBox('🌍 مرحلة جديدة: '+S.n,'🤖 نجم: '+S.say+(jumped>1?'\n(تقدّمت '+jumped+' مراحل)':'')+'\nالمكافأة: '+Object.entries(got).map(([k,v])=>fmtN(v)+' '+RES[k][1]).join(' '),'رائع');
      try{box.classList.add('tfbox');celebrate(box.querySelector('.hbox'))}catch(e){}if(typeof renderColony==='function')renderColony()},700)}}
function terraBonus(){return 0.02*tfStage()}
function terraBtn(){return tfOpen()?`<button class="cterra" type="button" aria-label="استصلاح الكوكب">🌍<i>${tfStage()}</i></button>`:''}
function terraHTML(){const t=tfInit(),ti=tfTI(),s=tfStage(),nx=TFS[s+1],r=tfRates(),pc=nx?Math.min(100,(ti-TFS[s].at)/(nx.at-TFS[s].at)*100):100;
  const bar=(k,em,n)=>`<div class="tfv"><span>${em} ${n}</span><b>${fmtN(t[k])}</b><small>+${fmtN(r[k])}/س</small></div>`;
  let h=`<h3 class="lh">🌍 استصلاح الكوكب <small>المرحلة ${s}: ${TFS[s].n}</small></h3>
    <div class="tfti"><b>${fmtN(ti)}</b><small>مؤشر الاستصلاح${nx?' · التالي «'+nx.n+'» عند '+fmtN(nx.at):''}</small><i><u style="width:${pc}%"></u></i></div>
    <div class="tfgrid">${bar('heat','🔥','الحرارة')}${bar('pres','⛰️','الضغط')}${bar('o2','🌬️','الأكسجين')}${bar('bio','🌳','الحياة')}</div>
    <p class="cd">كل مرحلة تغيّر شكل الكوكب حول المستعمرة وتعطيك مكافأة، وتزيد الإنتاج ${s?'(+'+Math.round(terraBonus()*100)+'% الآن)':'2% لكل مرحلة'}.</p><div class="tfm">`;
  TFM.forEach(f=>{const n=t.m[f.id]||0,lock=ti<f.need,c=tfCost(f),ok=!lock&&canPay(c);
    h+=`<div class="tfr${lock?' lock':''}"><span class="te">${f.em}</span><span class="tn"><b>${f.n} <small>×${n}</small></b><small>${lock?'🔒 يُفتح عند مؤشر '+fmtN(f.need):f.d+' · +'+f.rate+'/س لكل آلة'}</small></span>
      <button class="btn${ok?' main':''}" type="button" data-tfb="${f.id}" ${ok?'':'disabled'}>${lock?'🔒':costHTML(c)}</button></div>`});
  h+=`</div><div class="tfstages">${TFS.map((x,i)=>`<span class="${i<=s?'got':''}${i===s?' cur':''}" title="${x.n}">${i<=s?'✓':i}</span>`).join('')}</div>`;return h}
function tfBuy(id){const f=TFM.find(x=>x.id===id),c=tfCost(f);if(tfTI()<f.need||!canPay(c)){snd('err');return}tfTick();pay(c);const t=tfInit();t.m[id]=(t.m[id]||0)+1;colSave();snd('build');toast(f.em+' '+f.n+' ×'+t.m[id]);renderSheet();updRes()}
{const _rs=renderSheet;renderSheet=function(){if(sheetId==='terra'){const c=$('csheet').querySelector('.csc');tfTick();c.innerHTML=terraHTML();c.querySelectorAll('[data-tfb]').forEach(b=>b.onclick=()=>tfBuy(b.dataset.tfb));return}_rs()}}
{const _ac=accrue;accrue=function(){_ac.apply(this,arguments);try{tfTick()}catch(e){}}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#colony .cterra')){snd('tap');openSheet('terra')}});

/* ---------- how the planet looks: colours blend from red desert to green world, features appear by stage ---------- */
function mixHex(a,b,k){const p=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')}
function tfLook(svg){const s=tfStage();if(!s)return svg;const g=Math.min(1,s/8),sky=Math.min(1,s/3);
  const swap=(from,to,k)=>{svg=svg.split(from).join(mixHex(from,to,k))};
  // ground & hills: purple-red → olive → green
  swap('#7a5266','#6f8a4a',g);swap('#5a4058','#4a6a3a',g);swap('#1a1224','#16241a',g*0.8);swap('#4a3350','#3f6a44',g);swap('#3a2a44','#2e523a',g);swap('#2e2240','#2a4a46',g);swap('#3a2a48','#2f5244',g);
  swap('#7a5a6a','#6a6a5a',g);swap('#a07a8a','#9a9a7a',g);swap('#9a7088','#5a8a70',g);
  // daytime sky turns blue
  if(phase()==='day'){swap('#2a4a8a','#2f6fd6',sky);swap('#5a6ab0','#5aa6e8',sky);swap('#b48ac8','#a6dcf4',sky);swap('#e8b0b8','#e6f4ff',sky)}
  let air='',land='';const R=rng(11);
  if(s>=3){for(let i=0;i<7;i++){const x=R()*700-200,y=150+R()*110,w=40+R()*60;air+=`<g class="tfcloud" style="animation-delay:-${(R()*40).toFixed(1)}s"><ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w*0.28).toFixed(0)}" fill="#fff" opacity="${phase()==='night'?.12:.5}"/><ellipse cx="${(x+w*0.4).toFixed(0)}" cy="${(y-w*0.16).toFixed(0)}" rx="${(w*0.55).toFixed(0)}" ry="${(w*0.26).toFixed(0)}" fill="#fff" opacity="${phase()==='night'?.12:.55}"/></g>`}}
  if(s>=4){for(let i=0;i<70;i++){const x=R()*760-200,y=300+R()*540;land+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(4+R()*10).toFixed(1)}" ry="${(2+R()*3).toFixed(1)}" fill="#6fae4a" opacity="${(0.35+0.04*s).toFixed(2)}"/>`}}
  if(s>=5){for(const [x,y,w] of [[-120,380,70],[-60,720,90],[430,400,80],[470,700,70],[180,800,110],[-150,560,50]]){land+=`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w*0.32}" fill="#2b6a8a"/><ellipse cx="${x}" cy="${y-2}" rx="${w*0.9}" ry="${w*0.26}" fill="#4aa6d0"/><ellipse class="tfshine" cx="${x-w*0.3}" cy="${y-5}" rx="${w*0.25}" ry="${w*0.05}" fill="#dff6ff" opacity=".6"/>`}}
  if(s>=6){for(let i=0;i<90;i++){const x=R()*760-200,y=300+R()*540;if(x>-30&&x<390&&y>280&&y<660&&R()<.8)continue;const c=['#ff7ab0','#ffd34d','#ffffff','#b98cff'][i%4];
      land+=`<path d="M${x.toFixed(0)} ${y.toFixed(0)} q1 -6 0 -9 M${(x+3).toFixed(0)} ${y.toFixed(0)} q-1 -5 1 -8" stroke="#4a9a3a" stroke-width="1.2" fill="none"/>${i%3?'':`<circle cx="${x.toFixed(0)}" cy="${(y-9).toFixed(0)}" r="1.8" fill="${c}"/>`}`}}
  if(s>=7){for(let i=0;i<34;i++){let x=R()*760-200,y=300+R()*560;if(x>-40&&x<400&&y>270&&y<680)x+=x<180?-260:260;const h=14+R()*14;
      land+=`<g class="tftree"><ellipse cx="${x.toFixed(0)}" cy="${(y+1).toFixed(0)}" rx="${(h*0.4).toFixed(0)}" ry="${(h*0.12).toFixed(0)}" fill="#000" opacity=".25"/><rect x="${(x-1.5).toFixed(1)}" y="${(y-h*0.5).toFixed(1)}" width="3" height="${(h*0.5).toFixed(1)}" fill="#6a4a2a"/><circle cx="${x.toFixed(0)}" cy="${(y-h*0.65).toFixed(1)}" r="${(h*0.38).toFixed(1)}" fill="#3f8a3a"/><circle cx="${(x-h*0.12).toFixed(1)}" cy="${(y-h*0.75).toFixed(1)}" r="${(h*0.22).toFixed(1)}" fill="#5fb04a"/></g>`}}
  if(s>=8){for(let i=0;i<10;i++){const x=R()*360,y=320+R()*340;land+=`<g class="tfbfly" style="animation-delay:-${(R()*8).toFixed(1)}s;--dx:${(R()*80-40).toFixed(0)}px"><path d="M${x.toFixed(0)} ${y.toFixed(0)} l-3 -2 l0 4z M${x.toFixed(0)} ${y.toFixed(0)} l3 -2 l0 4z" fill="${['#ffd34d','#ff7ab0','#7ff2ff'][i%3]}"/></g>`}}
  if(air)svg=svg.replace('<path d="M-720 292 ',air+'<path d="M-720 292 ');
  if(land)svg=svg.replace('<g class="rover">',land+'<g class="rover">');
  return svg}
{const _sc=sceneSVG;sceneSVG=function(){return tfLook(_sc())}}
