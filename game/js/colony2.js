/* ================= مستعمرة المدار — part 2: research lab, orbital strike, boss, daily tasks, meteor shower ================= */

/* ---------- research lab ---------- */
const TECH={
  mine:{n:'تعدين متقدم',i:'⛏️',d:L=>`+${10*L}% معادن`,base:[200,150,60]},
  power:{n:'خلايا شمسية فائقة',i:'⚡',d:L=>`+${10*L}% طاقة`,base:[150,200,60]},
  agri:{n:'زراعة مائية',i:'🌱',d:L=>`+${10*L}% غذاء`,base:[150,150,100]},
  store:{n:'مخازن مضغوطة',i:'📦',d:L=>`+${15*L}% سعة`,base:[260,200,80]},
  build:{n:'روبوتات بناء',i:'🤖',d:L=>`-${8*L}% وقت البناء`,base:[240,240,100]},
  offline:{n:'أتمتة المباني',i:'🕒',d:L=>`+${2*L} ساعة تخزين`,base:[200,220,120]},
  dmg:{n:'ذخيرة متطورة',i:'🎯',d:L=>`+${L} ضرر للأبراج`,base:[300,220,80]},
  rate:{n:'تبريد المدافع',i:'🔥',d:L=>`+${10*L}% سرعة إطلاق`,base:[260,300,80]},
  strike:{n:'الضربة المدارية',i:'☄️',d:L=>`+${50*L}% قوة ضربتك`,base:[220,320,60]}};
const TMAX=5;
if(!col.tech)col.tech={};
const techCost=k=>{const L=col.tech[k]||0,f=Math.pow(1.85,L),b=TECH[k].base;return {m:Math.round(b[0]*f),e:Math.round(b[1]*f),f:Math.round(b[2]*f),c:3+L*3}};
const techTime=k=>Math.round(45*Math.pow(2.1,col.tech[k]||0)*(1-0.04*(col.b.lab||0)));
function researchTick(){const r=col.rs;if(!r||Date.now()<r.end)return;col.rs=null;col.tech[r.k]=(col.tech[r.k]||0)+1;colSave();snd('ach');buzz([20,30,20]);toast('🔬 '+TECH[r.k].n+' '+col.tech[r.k],'ach');questCheck&&questCheck();if(!$('hub').hidden)setTimeout(()=>{renderColony();renderSheet()},0)}
function startResearch(k){accrue();if(col.rs){toast('🔬 المختبر مشغول');return}const L=col.tech[k]||0;if(L>=TMAX){toast('✔️ الأعلى');return}
  if(L>=(col.b.lab||0)){toast('🔒 طوّر المختبر إلى '+(L+1));return}const c=techCost(k);if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}
  pay(c);col.rs={k,end:Date.now()+techTime(k)*1000,len:techTime(k)};colSave();snd('ok');buzz(15);dtask('research',1);renderColony()}
function rushResearch(){if(!col.rs)return;const left=(col.rs.end-Date.now())/1000,cost=Math.max(1,Math.ceil(left/60));if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}
  col.res.c-=cost;col.rs.end=Date.now();researchTick();renderColony()}
function labHTML(){if(!col.b.lab)return '<p class="cd">ابنِ المختبر لتبدأ الأبحاث.</p>';
  let h=`<h3 class="lh">🔬 الأبحاث <small>${col.rs?'يجري: '+TECH[col.rs.k].n:'اختر بحثاً · مستوى البحث لا يتجاوز مستوى المختبر'}</small></h3><div class="blist">`;
  for(const [k,T] of Object.entries(TECH)){const L=col.tech[k]||0,max=L>=TMAX,lock=!max&&L>=col.b.lab,busy=col.rs&&col.rs.k===k,c=techCost(k),ok=!max&&!lock&&!col.rs&&canPay(c);
    h+=`<div class="brow tech${ok?' ok':''}"><span class="ti">${T.i}</span><span class="bt"><b>${T.n} <i class="tlv">${L}/${TMAX}</i></b><small>${max?T.d(L):L?T.d(L)+' ← '+T.d(L+1):'التالي: '+T.d(1)}</small><span class="bc">${max?'✔️ الأعلى':busy?'🔬 قيد البحث':lock?'🔒 المختبر '+(L+1):costHTML(c)+`<span class="cc time">⏱️ ${fmtDur(techTime(k))}</span>`}</span></span>${!max&&!lock&&!busy?`<button class="btn${ok?' main':''}" type="button" data-tech="${k}">🔬</button>`:''}</div>`}
  return h+'</div>'}

/* ---------- daily colony tasks ---------- */
const DPOOL=[['collect','اجمع الموارد من المباني',12],['kills','اقتل وحوشاً خارج السور',40],['strike','اضرب الوحوش بالضربة المدارية',15],['upgrade','طوّر مبانيَ',2],['mission','اربح مهام في الألعاب',2],['research','ابدأ أبحاثاً في المختبر',1],['boss','اهزم زعيم الوحوش',1],['meteor','التقط شهباً',8]];
function dtasks(){const k=dayKey();if(!col.dt||col.dt.k!==k){const R=rng(k*7+3),pool=DPOOL.filter(p=>p[0]!=='research'||col.b.lab).slice();const pick=[];
    while(pick.length<3){const i=Math.floor(R()*pool.length);pick.push(pool.splice(i,1)[0])}
    col.dt={k,t:pick.map(([id,t,n],i)=>({id,t,n,p:0,c:0,r:i===2?{c:12}:i===1?{m:300+col.b.hq*120,e:300+col.b.hq*120}:{c:6,f:200+col.b.hq*80}}))};colSave()}return col.dt.t}
function dtask(id,n){const ts=dtasks();let ch=false;for(const t of ts)if(t.id===id&&t.p<t.n){t.p=Math.min(t.n,t.p+n);ch=true;if(t.p>=t.n){toast('📋 مهمة يومية جاهزة: '+t.t,'ach');snd('ok')}}if(ch){colSave();updTaskBadge()}}
const tasksReady=()=>dtasks().filter(t=>t.p>=t.n&&!t.c).length;
function updTaskBadge(){const b=document.querySelector('#colony .ctaskb i');if(b){const n=tasksReady();b.textContent=n;b.hidden=!n}}
function tasksHTML(){const ts=dtasks(),left=fmtDur((new Date().setHours(24,0,0,0)-Date.now())/1000);
  return `<h3 class="lh">📋 مهام اليوم <small>تتجدد بعد ${left}</small></h3><div class="blist">`+ts.map((t,i)=>`<div class="brow task${t.c?' done':t.p>=t.n?' ok':''}"><span class="ti">${t.c?'✅':t.p>=t.n?'🎁':'📋'}</span><span class="bt"><b>${t.t}</b><small>${Math.min(t.p,t.n)} / ${t.n} · ${Object.entries(t.r).map(([k,n])=>'+'+n+' '+RES[k][1]).join(' ')}</small><i class="tbar"><u style="width:${Math.min(100,t.p/t.n*100)}%"></u></i></span>${!t.c&&t.p>=t.n?`<button class="btn main" type="button" data-claim="${i}">استلام</button>`:''}</div>`).join('')+'</div>'}
function claimTask(i){const t=dtasks()[i];if(!t||t.c||t.p<t.n)return;t.c=1;Object.entries(t.r).forEach(([k,n])=>gain(k,n));addXP(20);colSave();snd('win');buzz([15,30,15]);
  if(dtasks().every(x=>x.c)){gain('c',10);toast('🏆 أنجزت كل مهام اليوم! +10 💎','ach')}renderColony();renderSheet()}

/* ---------- orbital strike: tap a creature ---------- */
let strikeReady=0;
function strike(c){const now=performance.now();if(now<strikeReady||c.dead)return;strikeReady=now+550;const L=$('cshots');if(!L)return;
  const top=c.y-420,beam=svgEl('g',{class:'strike'});beam.innerHTML=`<path d="M${c.x-7} ${top} L${c.x-2} ${c.y-12} L${c.x+2} ${c.y-12} L${c.x+7} ${top}Z" fill="#ffe27a" opacity=".35"/><path d="M${c.x} ${top} L${c.x} ${c.y-12}" stroke="#fff" stroke-width="2.4"/><circle cx="${c.x}" cy="${c.y-12}" r="9" fill="#fff3c0"/>`;
  L.appendChild(beam);BT.shots.push({el:beam,t:0,T:0.3});boom(c.x,c.y-10,'#ffd34d',16);snd('hit');buzz(18);
  const d=Math.round((3+col.b.def+col.b.hq*0.5)*(1+0.5*(col.tech.strike||0)));const was=c.dead;hurt(c,d);fxAt(c.x,c.y-48,'-'+d,'#ffe27a');dtask('strike',1)}

/* ---------- boss: a giant beast that comes every few minutes ---------- */
const BOSS_HP=()=>140+col.b.hq*45+(col.b.tower||0)*20;
function bossSVG(){return `<g class="cre boss gone" data-i="boss" data-cre="beast" role="button" tabindex="0" aria-label="زعيم الوحوش"><g class="cflip"><g transform="scale(2.3)"><ellipse cx="0" cy="-23" rx="32" ry="26" fill="transparent"/>${CRE.beast}</g></g><g class="hpb" opacity="0"><rect class="hpf" width="0" height="0"/></g></g>`}
function bossBar(c){let b=document.querySelector('#colony .bossbar');if(!c||c.dead){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.className='bossbar';b.innerHTML='<b>👹 زعيم الوحوش</b><i><u></u></i><small></small>';const t=document.querySelector('#colony .ctop');if(t)t.appendChild(b)}
  b.querySelector('u').style.width=Math.max(0,c.hp/c.max*100)+'%';b.querySelector('small').textContent=Math.max(0,Math.ceil(c.hp))+' / '+c.max}
function bossSpawn(){const c=BT.boss;if(!c||!c.dead)return;c.max=BOSS_HP();c.hp=c.max;c.dead=0;c.born=performance.now();const p=spawnPt('beast');c.x=p.x<180?-90:450;c.y=Math.max(420,Math.min(720,p.y));
  const a=Math.atan2(c.y-FEN.cy,c.x-FEN.cx);c.tx=FEN.cx+Math.cos(a)*FEN.rx*1.16;c.ty=FEN.cy+Math.sin(a)*FEN.ry*1.16;c.wait=0;c.el.classList.remove('gone');
  toast('🤖 نجم: زعيم الوحوش قادم! اضربه بالضربة المدارية','ach');snd('err');buzz([60,40,60]);bossBar(c)}
function bossTick(now){const c=BT.boss;if(!c)return;if(!BT.bossAt)BT.bossAt=now+(col.b.hq>=2?90000+Math.random()*120000:1e15);
  if(c.dead){if(now>BT.bossAt&&col.b.hq>=2)bossSpawn();return}
  bossBar(c);if(fenceR(c.x,c.y)<1.22&&now>(c.hitAt||0)){c.hitAt=now+1600;boom(c.x+(FEN.cx-c.x)*0.06,c.y-12,'#ff5d73',12);const svg=$('cscene');if(svg){svg.classList.remove('quake');void svg.getBoundingClientRect();svg.classList.add('quake')}}
  if(now-c.born>120000){c.dead=1e15;c.el.classList.add('gone');bossBar(null);BT.bossAt=now+240000+Math.random()*180000;toast('👹 هرب الزعيم… سيعود')}}
function bossDown(c){bossBar(null);BT.bossAt=performance.now()+300000+Math.random()*240000;const cr=10+col.b.hq*2,m=150*col.b.hq;gain('c',cr);gain('m',m);updRes();
  toast(`🏆 هزمت زعيم الوحوش! +${cr} 💎 +${fmtN(m)} ⛏️`,'ach');snd('win');buzz([30,40,30,40,60]);dtask('boss',1);col.bosses=(col.bosses||0)+1;colSave();
  const host=document.querySelector('#colony .ctop');if(host)celebrate(document.querySelector('#colony'))}

/* ---------- meteor shower: tap the falling stars ---------- */
const MET={on:0,end:0,next:0,got:0};
function meteorTick(now){if(!MET.next)MET.next=now+60000+Math.random()*120000;
  if(!MET.on&&now>MET.next){MET.on=1;MET.end=now+26000;MET.got=0;MET.spawn=0;metBanner(true);snd('ach');toast('🤖 نجم: زخة شهب! التقطها بسرعة')}
  if(MET.on){if(now>MET.end){MET.on=0;MET.next=now+420000+Math.random()*420000;metBanner(false);return}
    if(now>MET.spawn){MET.spawn=now+650+Math.random()*500;metSpawn()}}}
function metBanner(on){let b=document.querySelector('#colony .metb');if(!on){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.className='metb';b.textContent='☄️ زخة شهب! اضغط الشهب لتجمع الكريستال';const t=document.querySelector('#colony .ctop');if(t)t.appendChild(b)}}
function metSpawn(){const L=$('cfx'),svg=$('cscene');if(!L||!svg)return;const vb=svg.viewBox.baseVal,x0=vb.x+Math.random()*vb.width*0.9,y0=vb.y+vb.height*0.08,x1=x0-60-Math.random()*80,y1=y0+150+Math.random()*90;
  const g=svgEl('g',{class:'met',role:'button'});g.innerHTML='<circle r="16" fill="transparent"/><path d="M0 0 L46 -30" stroke="url(#cMeteor)" stroke-width="5" stroke-linecap="round" transform="scale(-1 1)"/><circle r="5.5" fill="#bff8ff"/><circle r="9" fill="#9fe8ff" opacity=".35"/><circle r="2.4" fill="#fff"/>';
  L.appendChild(g);const an=g.animate([{transform:`translate(${x0}px,${y0}px)`},{transform:`translate(${x1}px,${y1}px)`,opacity:1,offset:.9},{transform:`translate(${x1-6}px,${y1+4}px)`,opacity:0}],{duration:2600,easing:'linear'});
  an.onfinish=()=>g.remove();
  g.addEventListener('pointerdown',e=>{e.stopPropagation();if(g.dataset.hit)return;g.dataset.hit=1;const m=new DOMMatrix(getComputedStyle(g).transform);an.cancel();g.remove();
    const n=MET.got<20?(Math.random()<0.25?2:1):0;MET.got+=n;if(n){gain('c',n);fxAt(m.e,m.f-12,'+'+n+' 💎','#9fe8ff');updRes()}boom(m.e,m.f,'#9fe8ff',10);snd('ok');buzz(10);dtask('meteor',1)})}

/* ---------- lab art (4 stages) ---------- */
function labArt(L){let s=_sh(36,8);
  if(L>=7)s+=`<g transform="translate(-34 0)">${_box(-8,0,16,16,6)}<path d="M-6 -16 V-30" stroke="#c9d3dc" stroke-width="1.2"/><g transform="translate(-6 -32) rotate(-30)"><path d="M-8 0 A8 3.6 0 0 0 8 0Z" fill="url(#kDish)" stroke="#7a8494" stroke-width=".5"/></g></g>`;
  s+=_box(-24,0,44,16,10)+`<rect x="-22" y="-12" width="40" height="5" fill="#0b1830"/>${_win(-20,-11.5,7,5.6,3.4,3,'#b47aff')}`;
  s+=`<ellipse cx="3" cy="-21" rx="15" ry="3" fill="#7c8aa0"/><path d="M-12 -21 A15 14 0 0 1 18 -21 Z" fill="url(#kGlass)" stroke="#e6d8ff" stroke-width=".8"/><circle cx="3" cy="-26" r="4.5" fill="#b47aff" opacity=".8" class="glowp"/><ellipse cx="-3" cy="-30" rx="4" ry="2" fill="#fff" opacity=".5" transform="rotate(-25 -3 -30)"/>`;
  s+=`<g transform="translate(26 0)"><rect x="-4" y="-18" width="8" height="18" rx="4" fill="url(#kCylH)"/><rect x="-3" y="-14" width="6" height="10" rx="3" fill="#7ddc5a" class="glowp"/></g>`;
  if(L>=4)s+=`<g transform="translate(-30 2)"><rect x="-3" y="-26" width="6" height="26" rx="3" fill="url(#kGlass)" stroke="#d8fff0" stroke-width=".6"/><circle cx="0" cy="-8" r="1.2" fill="#9fffb8" class="bubl"/><circle cx="0" cy="-14" r="1" fill="#9fffb8" class="bubl b2"/><rect x="-4" y="-28" width="8" height="3" fill="#8a93a2"/></g>`;
  if(L>=10)s+=`<g transform="translate(3 -44)"><circle r="9" fill="url(#kLamp)"/><circle r="5" fill="#d8b8ff" class="glowp"/><ellipse rx="10" ry="3" fill="none" stroke="#b47aff" stroke-width="1" class="spinr"/><ellipse rx="3" ry="10" fill="none" stroke="#5ff2d6" stroke-width=".8" class="spinr"/></g><path d="M3 -36 V-22" stroke="#b47aff" stroke-width="1.4" opacity=".7"/>`;
  return s}
