/* ================= مستعمرة المدار — part 4: templates, second builder, tower specialisation, planet guardians, festival, named crew ================= */

/* ---------- two build slots: the second one is a builder robot bought with crystals ---------- */
const BOT2_COST=60;
function building(id){return !!((col.build&&col.build.id===id)||(col.build2&&col.build2.id===id))}
function freeSlot(){if(!col.build)return 'build';if(col.bot2&&!col.build2)return 'build2';return null}
function rush2(){accrue();const b=col.build2;if(!b)return;const left=(b.end-Date.now())/1000,cost=Math.max(1,Math.ceil(left/60));
  if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}
  col.res.c-=cost;b.end=Date.now();accrue();colSave();renderColony()}
function buyBot2(){if(col.bot2)return;if(col.b.hq<4){toast('🔒 القيادة 4');return}
  if(col.res.c<BOT2_COST){snd('err');toast('تحتاج '+BOT2_COST+' 💎');return}
  confirmBox(`🤖 شراء روبوت البناء الثاني بـ ${BOT2_COST} 💎؟ ستتمكن من تطوير مبنيين في نفس الوقت.`,()=>{col.res.c-=BOT2_COST;col.bot2=1;colSave();snd('win');toast('🤖 روبوت البناء الثاني جاهز!','ach');renderColony()})}

/* ---------- stage strip: the four looks of a building, faded until you reach them ---------- */
const STAGES=[1,4,7,10];
function stagesHTML(id,L){
  return `<div class="stages" aria-label="مراحل الشكل">${STAGES.map(s=>{const got=L>=s,cur=got&&(s===10||L<STAGES[STAGES.indexOf(s)+1]);
    return `<span class="stg${got?' got':''}${cur?' cur':''}"><svg viewBox="-52 -64 104 76">${art(id,s)}</svg><small>${got?'✓ ':'🔒 '}م${s}</small></span>`}).join('')}</div>`}

/* ---------- extra rows on a building card ---------- */
function extraCard(id,L){let h='';
  if(id==='hq'){h+=col.bot2?`<p class="cd">🤖 روبوتا بناء يعملان معاً</p>`:`<div class="xrow"><span>🤖 <b>روبوت بناء ثانٍ</b><small>طوّر مبنيين في نفس الوقت</small></span><button class="btn${col.b.hq>=4?' main':''}" type="button" data-bot2>${col.b.hq>=4?BOT2_COST+' 💎':'🔒 القيادة 4'}</button></div>`}
  if(id==='tower'&&L){h+=`<h4 class="xh">🎯 تخصص الأبراج ${L<4?'<small>(يُفتح في المستوى 4)</small>':''}</h4><div class="specs">${Object.entries(SPECS).map(([k,S])=>`<button type="button" class="spec${col.tspec===k?' on':''}" data-spec="${k}" ${L<4?'disabled':''}><b>${S.i} ${S.n}</b><small>${S.d}</small></button>`).join('')}</div>`}
  return h}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#csheet [data-bot2],#csheet [data-spec]');if(!b)return;
  if(b.dataset.bot2!==undefined){buyBot2();return}
  const k=b.dataset.spec;if((col.b.tower||0)<4||col.tspec===k)return;const first=!col.tspec,cost=first?0:10;
  const go=()=>{if(cost){if(col.res.c<cost){snd('err');toast('تحتاج '+cost+' 💎');return}col.res.c-=cost}col.tspec=k;colSave();snd('ok');toast(SPECS[k].i+' تخصص الأبراج: '+SPECS[k].n);renderColony()};
  if(cost)confirmBox(`تغيير التخصص إلى «${SPECS[k].n}» بـ ${cost} 💎؟`,go);else go()});

/* ---------- tower specialisation ---------- */
const SPECS={rapid:{i:'⚡',n:'رشّاش سريع',d:'إطلاق أسرع 35%'},sniper:{i:'🎯',n:'قنّاص',d:'مدى +70 وضرر +2، أبطأ قليلاً'},frost:{i:'❄️',n:'تجميد',d:'كل إصابة تبطئ الوحش 55%'}};
function specApply(){const k=col.tspec;if(!k||(col.b.tower||0)<4)return;
  for(const w of BT.tw){if(w.range<200)continue;
    if(k==='rapid')w.rate*=0.65;else if(k==='sniper'){w.range+=70;w.dmg+=2;w.rate*=1.25}else if(k==='frost')w.frost=1}}
{const _fire=fire;fire=function(w,c){_fire(w,c);if(w.frost&&c&&!c.boss)c.slowU=performance.now()+1500;else if(w.frost&&c&&c.boss)c.slowU=performance.now()+600}}
{const _step=stepCreature;stepCreature=function(c,dt){const sl=c.slowU>performance.now();if(c.el)c.el.classList.toggle('frz',sl);_step(c,sl?dt*0.45:dt)}}

/* ---------- ghost templates for the fence and the tower spots ---------- */
{const _f=fenceSVG;fenceSVG=function(half){if(col.b.wall)return _f(half);col.b.wall=1;let s;try{s=fenceRaw(half)}finally{col.b.wall=0}return `<g class="ghost gfence">${s}</g>`+_f(half)}}
{const _t=towersSVG;towersSVG=function(half){let s=_t(half);const n=towerN(),L=col.b.tower||0;let gh='';
  for(let i=n;i<TDEG.length;i++){const [,y]=fp(TDEG[i]*Math.PI/180);if((half==='back')===(y<FEN.cy))gh+=towerSVG(i,tierOf(Math.max(1,L)),true)}
  if(gh)s+=`<g class="ghost gtowers">${tint(gh,Math.max(1,L)).replace(/class="tow/g,'class="gtow')}</g>`;return s}}

/* ---------- planet hazards and guardians ---------- */
const HAZ=[{b:'wall',L:3,t:'عواصف رملية',need:'السور 3'},{b:'lab',L:3,t:'ضغط الأعماق',need:'المختبر 3'},{b:'farm',L:5,t:'أبواغ سامّة',need:'المزرعة 5'},{b:'solar',L:6,t:'برد قارس',need:'الطاقة 6'},{b:'def',L:6,t:'حمم متطايرة',need:'الدفاع 6'},{b:'hq',L:8,t:'حقل الجاذبية',need:'القيادة 8'}];
const GUARD=[{n:'عقرب زيرون',h:-30},{n:'أخطبوط الأعماق',h:170},{n:'حارس الغابة',h:90},{n:'عملاق الجليد',h:200},{n:'تنين الحمم',h:-60},{n:'ظل النواة',h:250}];
const hazOk=i=>(col.b[HAZ[i].b]||0)>=HAZ[i].L;
{const _claim=expClaim;expClaim=function(){const x=col.exp;if(!x||Date.now()<x.end)return _claim();const i=x.i,first=!col.gal.done[i],ok=hazOk(i);
  if(!ok){const P=PLANETS[i],keep=P.r;P.r=Object.fromEntries(Object.entries(keep).map(([r,n])=>[r,Math.round(n*0.7)]));try{_claim()}finally{P.r=keep}toast(`⚠️ ${HAZ[i].t} قلّلت الغنائم 30% — تحتاج ${HAZ[i].need}`)}else _claim();
  if(first){col.guard=(col.guard||[]).concat(i);colSave();setTimeout(()=>toast(`🤖 نجم: لقد تبعنا ${GUARD[i].n} من ${PLANETS[i].n}! استعد`,'ach'),2500)}}}
{const _gb=galaxyBox;galaxyBox=function(){_gb();const m=document.getElementById('galbox');if(!m)return;
  m.querySelectorAll('.pn').forEach(g=>g.addEventListener('click',()=>{const i=+g.dataset.p,c=m.querySelector('.gcard div');if(!c)return;const sm=document.createElement('small');sm.className='ghaz'+(hazOk(i)?' ok':'');
    sm.textContent=(hazOk(i)?'✅ ':'⚠️ ')+HAZ[i].t+' — '+(hazOk(i)?'مستعمرتك جاهزة':'تحتاج '+HAZ[i].need+' وإلا تقل الغنائم 30%');c.appendChild(sm);
    const g2=document.createElement('small');g2.textContent='👹 الحارس: '+GUARD[i].n;c.appendChild(g2)}))}}
{const _bs=bossSpawn;bossSpawn=function(){const c=BT.boss;if(!c||!c.dead)return;_bs();const q=col.guard&&col.guard[0];
  if(q!==undefined&&q!==null){c.guard=q;c.max=Math.round(c.max*1.6);c.hp=c.max;c.el.style.filter=`hue-rotate(${GUARD[q].h}deg) saturate(1.3)`;toast('👹 '+GUARD[q].n+' يهاجم المستعمرة!','ach')}else{c.guard=null;c.el.style.filter=''}}}
{const _bb=bossBar;bossBar=function(c){_bb(c);if(c&&!c.dead){const b=document.querySelector('#colony .bossbar b');if(b){const t='👹 '+(c.guard!=null?GUARD[c.guard].n:'زعيم الوحوش');if(b.textContent!==t)b.textContent=t}}}}
{const _bt=bossTick;bossTick=function(now){if(col.guard&&col.guard.length&&BT.boss&&BT.boss.dead&&BT.bossAt>now+30000)BT.bossAt=now+20000+Math.random()*20000;_bt(now)}}
{const _bd=bossDown;bossDown=function(c){_bd(c);if(c.guard==null)return;const i=c.guard,cr=15+i*10,m=1000*(i+1);gain('c',cr);gain('m',m);updRes();
  col.guard=(col.guard||[]).filter(x=>x!==i);col.gkill=Object.assign(col.gkill||{},{[i]:1});colSave();
  setTimeout(()=>{const box=storyBox('🏆 هزمت '+GUARD[i].n,`غنيمة الحارس: +${cr} 💎 +${fmtN(m)} ⛏️`,'رائع');celebrate(box.querySelector('.hbox'))},400);c.guard=null;c.el.style.filter=''}}

/* ---------- weekend festival (Friday and Saturday): +25% production ---------- */
function festOn(){const d=new Date().getDay();return d===5||d===6}
function festChip(){return festOn()?'<button type="button" class="cfest" aria-label="مهرجان نهاية الأسبوع">🎉 مهرجان</button>':''}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#colony .cfest')){snd('tap');toast('🎉 مهرجان نهاية الأسبوع: كل الإنتاج +25% يومي الجمعة والسبت')}});

/* ---------- named crew: tap a walker to hear from them ---------- */
const CREWN=[['سارة','مهندسة'],['فهد','طيّار'],['ليلى','عالمة'],['يوسف','مزارع'],['نورة','طبيبة'],['خالد','حارس'],['مها','ملاّحة'],['بدر','ميكانيكي']];
function crewLine(i){const tips=[
  ()=>col.build?`أعمل على ${BLD[col.build.id].name}… قريباً ننتهي!`:'المعدّات جاهزة، ماذا نبني الآن؟',
  ()=>col.exp?'المركبة في رحلة، أراقب الاتصال بها.':(col.done?'المركبة جاهزة لرحلة جديدة في المجرة 🌌':'أحتاج المركبة كاملة لأطير بها!'),
  ()=>col.rs?`البحث جارٍ: ${TECH[col.rs.k].n} 🔬`:'المختبر ينتظر بحثاً جديداً.',
  ()=>'الغذاء يكفي الطاقم؟ المزرعة تحتاج تطويراً دائماً 🌱',
  ()=>`الطاقم بصحة جيدة: ${crew()} رواد في المستعمرة.`,
  ()=>col.tspec?`الأبراج على وضع «${SPECS[col.tspec].n}».`:'الأبراج تحتاج تخصصاً عند المستوى 4 🎯',
  ()=>`أرسم خريطة الكواكب… زرنا ${Object.keys(col.gal.done||{}).length} من 6.`,
  ()=>'الآلات تعمل جيداً، لا تنسَ جمع الموارد ⤓'];return tips[i%tips.length]()}
{const _ci=crewInit;crewInit=function(svg){_ci(svg);CREW.w.forEach((w,i)=>{w.e.style.pointerEvents='auto';w.e.style.cursor='pointer';
  w.e.addEventListener('click',e=>{if(typeof camDrag!=='undefined'&&camDrag)return;e.stopPropagation();const [n,r]=CREWN[i%CREWN.length];snd('tap');toast(`🧑‍🚀 ${n} (${r}): ${crewLine(i)}`);w.wait=2.5})})}}

/* ---------- painted building art (player-generated with Gemini): grows with level, colour shifts between stages, aura at 4/7/10 ---------- */
const IMGHUE=[0,0,14,28,0,16,32,0,18,36,0];
function imgArt(id,L){const r=ART[id+'R']||1,w=78+Math.min(10,L)*2.6,h=w/r,y=-h+12,hue=IMGHUE[Math.min(10,L)]||0;
  let s=`<ellipse cx="0" cy="4" rx="${(w*0.46).toFixed(1)}" ry="${(w*0.12).toFixed(1)}" fill="#000" opacity=".35"/>`;
  if(L>=4)s+=`<ellipse cx="0" cy="0" rx="${(w*0.5).toFixed(1)}" ry="${(w*0.16).toFixed(1)}" fill="none" stroke="${L>=10?'#ffd34d':L>=7?'#c58bff':'#5ff2d6'}" stroke-width="2" opacity=".75" class="aura"/>`;
  s+=`<image href="${ART[id]}" x="${(-w/2).toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMax meet"${hue?` style="filter:hue-rotate(${hue}deg) saturate(1.15)"`:''}/>`;
  if(L>=10)s+=`<path d="M-6 ${(y+4).toFixed(1)} L0 ${(y-40).toFixed(1)} L6 ${(y+4).toFixed(1)}z" fill="#ffd34d" opacity=".35" class="beam"/>`;
  return s}
