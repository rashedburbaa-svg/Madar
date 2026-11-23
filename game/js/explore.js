/* explorer mode: walk your astronaut around the colony and step inside any building */
const EX={on:false,x:184,y:500,tx:null,ty:null,goal:null,dir:1,raf:0,last:0};
const EXDOOR=id=>{const s=SLOT[id];return s?[s[0],s[1]+10]:null};
function exInside(x,y){return fenceR(x,y)<0.93}
function exAvatar(){const im=ART&&ART.astro;const h=54,w=im?h*(ART.astroR||0.6):26;
  return `<g id="pav" pointer-events="none" transform="translate(${EX.x.toFixed(1)} ${EX.y.toFixed(1)})"><ellipse rx="11" ry="3.6" fill="#000" opacity=".4"/><circle class="pavring" r="20" fill="none" stroke="#ffd34d" stroke-width="1.4" opacity=".8"/>
    <g class="pavb"><g transform="scale(${EX.dir} 1)">${im?`<image href="${im}" x="${(-w/2).toFixed(1)}" y="${(-h+2).toFixed(1)}" width="${w.toFixed(1)}" height="${h}"/>`:'<circle cy="-12" r="10" fill="#e6ecf1"/>'}</g></g>
    <g class="pavtag" transform="translate(0 -62)"><rect x="-14" y="-9" width="28" height="13" rx="6.5" fill="#ffd34d"/><text y="1" text-anchor="middle" font-size="8.5" font-weight="900" fill="#2a1a00">أنت</text></g></g>`}
function exMark(){return EX.tx==null?'':`<g id="pavt" pointer-events="none" transform="translate(${EX.tx.toFixed(1)} ${EX.ty.toFixed(1)})"><ellipse class="pavtg" rx="9" ry="3.5" fill="none" stroke="#00e5ff" stroke-width="1.6"/></g>`}
function exDraw(){const svg=$('cscene');if(!svg)return;svg.querySelectorAll('#pav,#pavt').forEach(n=>n.remove());if(!EX.on)return;
  const tmp=document.createElementNS('http://www.w3.org/2000/svg','g');tmp.innerHTML=exMark()+exAvatar();const fx=svg.querySelector('#cfx');while(tmp.firstChild)svg.insertBefore(tmp.firstChild,fx||null);
  const b=svg.querySelector('#pav .pavb');if(b)b.classList.toggle('walk',EX.tx!=null)}
function exPos(){const n=$('cscene')&&$('cscene').querySelector('#pav');if(n){n.setAttribute('transform',`translate(${EX.x.toFixed(1)} ${EX.y.toFixed(1)})`);const g=n.querySelector('.pavb > g');if(g)g.setAttribute('transform',`scale(${EX.dir} 1)`)}}
function exGo(x,y,goal){if(!exInside(x,y)){const a=Math.atan2((y-FEN.cy)/FEN.ry,(x-FEN.cx)/FEN.rx);x=FEN.cx+Math.cos(a)*FEN.rx*0.9;y=FEN.cy+Math.sin(a)*FEN.ry*0.9}
  EX.tx=x;EX.ty=y;EX.goal=goal||null;exDraw();if(!EX.raf){EX.last=performance.now();EX.raf=requestAnimationFrame(exStep)}}
function exStep(now){const dt=Math.min(0.05,(now-EX.last)/1000);EX.last=now;EX.raf=0;if(!EX.on||EX.tx==null)return;
  const dx=EX.tx-EX.x,dy=EX.ty-EX.y,d=Math.hypot(dx,dy),sp=95*dt;if(Math.abs(dx)>1)EX.dir=dx<0?-1:1;
  if(d<=sp){EX.x=EX.tx;EX.y=EX.ty;EX.tx=null;exDraw();const g=EX.goal;EX.goal=null;if(g){if(typeof doorOpen==='function')doorOpen(g);snd('ok');setTimeout(()=>enterB(g),450)}return}
  EX.x+=dx/d*sp;EX.y+=dy/d*sp;exPos();
  if(cam.z>1.05){cam.x+=(EX.x-cam.x)*0.08;cam.y+=(EX.y-30-cam.y)*0.08;camView()}
  EX.raf=requestAnimationFrame(exStep)}
function exToggle(){EX.on=!EX.on;snd('tap');if(EX.on){EX.tx=null;if(cam.z<1.5){const svg=$('cscene');cam.z=1.6;cam.x=EX.x;cam.y=EX.y-30;camView()}}else{EX.tx=null}
  const b=document.querySelector('.cexp');if(b)b.classList.toggle('on',EX.on);exDraw()}
function exPoint(e){const svg=$('cscene'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())}
// taps in explorer mode: a building → walk to its door then go in; open ground → walk there
function exClick(e){if(!EX.on||camDrag)return;const t=e.target;if(!t.closest||!t.closest('#cscene'))return;if(t.closest('.cre,.bub,.trader,.arkpad'))return;
  const cb=t.closest('.cb[data-b]');e.stopPropagation();e.preventDefault();
  if(cb){const id=cb.dataset.b;if(id==='wall'){exGo(...EXDOOR('hq').map((v,i)=>i?v+40:v));return}if(!(col.b[id]>0)){openSheet(id);return}const dd=EXDOOR(id);snd('tap');exGo(dd[0],dd[1],id);return}
  if(t.closest('.tow'))return;const p=exPoint(e);exGo(p.x,p.y)}
document.addEventListener('click',exClick,true);
{const _rc=renderColony;renderColony=function(){_rc.apply(this,arguments);const host=$('colony');if(!host)return;const z=host.querySelector('.czoom');
  if(z&&!z.querySelector('.cexp')){const b=document.createElement('button');b.type='button';b.className='cexp'+(EX.on?' on':'');b.setAttribute('aria-label','تحكّم برائدك');b.textContent='🧑‍🚀';b.onclick=exToggle;z.prepend(b)}exDraw()}}

/* ---------- building interiors ---------- */
const INT={hq:['#20304e','#0e1730'],mine:['#3a2b22','#1c140f'],solar:['#1f3a4e','#0c1a28'],farm:['#1d3a2a','#0b1a12'],habitat:['#3a3048','#1a1424'],radio:['#22304a','#0d1424'],obs:['#1a1a3e','#08081c'],def:['#3a2228','#1a0c10'],lab:['#2a2248','#120c26'],dock:['#2a3038','#11151a']};
function crewWalk(n,y0){let s='';const im=ART&&ART.astro;for(let i=0;i<n;i++){const y=y0+i*6,dur=(7+Math.random()*5).toFixed(1),dl=(-Math.random()*8).toFixed(1);
  s+=`<g class="iwalk" style="animation-duration:${dur}s;animation-delay:${dl}s"><g transform="translate(0 ${y})">${im?`<image href="${im}" x="-9" y="-30" width="18" height="30"/>`:'<circle cy="-12" r="8" fill="#e6ecf1"/>'}</g></g>`}return s}
function skyCol(){const s=typeof tfStage==='function'&&col.tf?tfStage():0;return s>=2?['#4a8ad8','#a8d8ff']:['#c06a4a','#f2b48a']}
function room(id){const [a,b]=INT[id]||INT.hq,[s1,s2]=skyCol();
  return `<defs><linearGradient id="iw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><linearGradient id="isky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient><radialGradient id="ilamp"><stop offset="0" stop-color="#fff6c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <rect width="360" height="300" fill="url(#iw)"/><path d="M0 210 L360 210 L360 300 L0 300Z" fill="#141a26"/><path d="M0 210 L360 210" stroke="#00e5ff" stroke-opacity=".35" stroke-width="2"/>
  ${[60,180,300].map(x=>`<path d="M${x} 300 L${x+(x-180)*0.4} 210" stroke="#ffffff" stroke-opacity=".05" stroke-width="2"/>`).join('')}
  <g><rect x="250" y="40" width="80" height="60" rx="30" fill="url(#isky)" stroke="#8b96a6" stroke-width="4"/><circle cx="310" cy="58" r="6" fill="#fff6c8" opacity=".8"/><path d="M252 88 Q280 76 300 86 T328 84 V100 H252Z" fill="#000" opacity=".25"/></g>
  ${[90,270].map(x=>`<ellipse cx="${x}" cy="8" rx="26" ry="6" fill="#d9e6f2" opacity=".5"/><ellipse class="ilight" cx="${x}" cy="40" rx="70" ry="50" fill="url(#ilamp)"/>`).join('')}
  <rect x="16" y="120" width="44" height="90" rx="6" fill="#0b1226" stroke="#8b96a6" stroke-width="3"/><circle cx="52" cy="166" r="2.4" fill="#00e5ff" class="blink"/>`}
function screen(x,y,w,h,kind){let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#06101e" stroke="#5a6478" stroke-width="2"/>`;
  if(kind==='bars')for(let i=0;i<5;i++)s+=`<rect class="ibar" x="${x+6+i*(w-12)/5}" y="${y+6}" width="${(w-12)/5-3}" height="${h-12}" fill="#00e5ff" style="animation-delay:${(i*0.3).toFixed(1)}s"/>`;
  if(kind==='wave')s+=`<path class="iwave" d="M${x+4} ${y+h/2} q6 -10 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" stroke="#9fe8ff" stroke-width="2" fill="none"/>`;
  if(kind==='radar')s+=`<g transform="translate(${x+w/2} ${y+h/2})"><circle r="${h/2-4}" fill="none" stroke="#00e5ff" stroke-opacity=".5"/><circle r="${h/4}" fill="none" stroke="#00e5ff" stroke-opacity=".3"/><path class="iradar" d="M0 0 L${h/2-4} 0 A${h/2-4} ${h/2-4} 0 0 0 ${(h/2-4)*0.7} ${-(h/2-4)*0.7}Z" fill="#00e5ff" opacity=".5"/><circle cx="8" cy="-6" r="2" fill="#ff5d73" class="blink"/></g>`;
  if(kind==='stars')for(let i=0;i<14;i++)s+=`<circle cx="${(x+4+Math.random()*(w-8)).toFixed(1)}" cy="${(y+4+Math.random()*(h-8)).toFixed(1)}" r="${(0.6+Math.random()*1.2).toFixed(1)}" fill="#fff" class="${i%3?'':'blink'}"/>`;
  return s}
function props(id,L){let s='';
  switch(id){
    case 'hq':s+=`<ellipse cx="180" cy="232" rx="70" ry="16" fill="#26324a" stroke="#00e5ff" stroke-width="2"/><g transform="translate(180 190)"><ellipse class="ihol" rx="44" ry="12" fill="none" stroke="#00e5ff" stroke-width="1.6"/><ellipse class="ihol2" rx="30" ry="8" fill="none" stroke="#9fe8ff"/><path d="M-34 20 L0 -36 L34 20" fill="#00e5ff" opacity=".08"/>${[-14,0,14].map((x,i)=>`<rect x="${x-4}" y="${-14-i*3}" width="8" height="${10+i*3}" fill="#9fe8ff" opacity=".6"/>`).join('')}</g>`+screen(80,60,70,46,'bars')+screen(160,60,70,46,'wave');break;
    case 'mine':s+=`<rect x="160" y="40" width="40" height="170" fill="#2a1e16" stroke="#5a4636" stroke-width="3"/><g transform="translate(180 205)"><path class="idrill" d="M-12 -20 L12 -20 L0 14Z" fill="#c7cfd8" stroke="#5a6478"/></g><rect x="40" y="236" width="280" height="10" fill="#3a3f4a"/>`;
      for(let i=0;i<5;i++)s+=`<g class="iore" style="animation-delay:${-i*1.2}s"><path d="M0 0 l8 -4 l8 3 l-2 6 l-12 1z" transform="translate(40 232)" fill="${['#c9a27a','#9fe8ff','#c7cfd8'][i%3]}"/></g>`;s+=screen(80,70,60,40,'bars');break;
    case 'solar':for(let i=0;i<4;i++){const pct=Math.min(1,(col.res.e||0)/cap()),h=Math.round(110*pct);s+=`<rect x="${80+i*44}" y="96" width="30" height="114" rx="5" fill="#0b1226" stroke="#8b96a6" stroke-width="2"/><rect class="ichg" x="${83+i*44}" y="${207-h}" width="24" height="${h}" rx="3" fill="#ffd34d" style="animation-delay:${i*0.4}s"/><text x="${95+i*44}" y="90" text-anchor="middle" font-size="10" fill="#ffd34d">⚡</text>`}s+=screen(260,130,70,40,'wave');break;
    case 'farm':{const n=Math.min(12,2+L);for(let r=0;r<2;r++){s+=`<rect x="70" y="${120+r*50}" width="220" height="6" fill="#5a6478"/><rect x="70" y="${84+r*50}" width="220" height="4" fill="#c58bff" opacity=".7" class="ilight"/>`;
      for(let i=0;i<n/2;i++){const x=82+i*(200/(n/2)),hh=10+Math.random()*12;s+=`<g class="isway" style="animation-delay:${(Math.random()*2).toFixed(1)}s;transform-origin:${x}px ${120+r*50}px"><path d="M${x} ${120+r*50} q-6 ${-hh/2} 0 ${-hh} q6 ${hh/2} 0 ${hh}" fill="#5ac85a"/><circle cx="${x}" cy="${120+r*50-hh}" r="3" fill="#9dff5a"/></g>`}}}break;
    case 'habitat':s+=`<rect x="80" y="150" width="90" height="16" rx="4" fill="#5a4a6a"/><rect x="80" y="110" width="90" height="16" rx="4" fill="#5a4a6a"/><rect x="84" y="104" width="24" height="8" rx="3" fill="#e8eef4"/><rect x="84" y="144" width="24" height="8" rx="3" fill="#e8eef4"/><ellipse cx="240" cy="200" rx="40" ry="8" fill="#6a5a7a"/><rect x="236" y="200" width="8" height="18" fill="#4a3a5a"/><circle cx="230" cy="190" r="4" fill="#ffd34d"/><circle cx="252" cy="190" r="4" fill="#ff8a5a"/>`;break;
    case 'radio':s+=screen(70,70,90,60,'wave')+screen(170,70,60,60,'bars')+`<rect x="70" y="150" width="160" height="30" rx="4" fill="#26324a"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${86+i*26}" cy="165" r="4" fill="${i%2?'#00e5ff':'#ffd34d'}" class="${i%3?'blink':''}"/>`).join('')}`;break;
    case 'obs':s+=screen(60,50,120,80,'stars')+`<g transform="translate(220 200)"><rect x="-6" y="-10" width="12" height="20" fill="#5a6478"/><path d="M-5.7 -12.0 L29.0 -63.4 L42.1 -54.2 L5.7 -4.0Z" fill="#c7cfd8" stroke="#5a6478" stroke-width="2" stroke-linejoin="round"/><path d="M23.9 -59.6 L30.8 -69.4 L47.2 -58.0 L40.3 -48.1Z" fill="#8b96a6"/><circle cx="39.0" cy="-63.7" r="4" fill="#9fe8ff" class="blink"/><circle cx="0" cy="-8" r="6" fill="#8b96a6"/></g>`;break;
    case 'def':s+=screen(70,60,90,90,'radar')+`${[0,1,2].map(i=>`<rect x="${190+i*34}" y="110" width="12" height="80" rx="5" fill="#8b96a6"/><rect x="${188+i*34}" y="100" width="16" height="14" rx="3" fill="#ff5d73"/>`).join('')}<circle cx="180" cy="20" r="6" fill="#ff3d5a" class="blink"/>`;break;
    case 'lab':for(let i=0;i<5;i++){const x=80+i*40,c=['#c58bff','#00e5ff','#ffd34d','#9dff5a','#ff8ac8'][i];s+=`<rect x="${x}" y="150" width="18" height="44" rx="8" fill="${c}" opacity=".35" stroke="#d9e6f2" stroke-width="1.6"/><rect x="${x}" y="170" width="18" height="24" rx="8" fill="${c}" opacity=".8"/>`;for(let k=0;k<3;k++)s+=`<circle class="ibub" cx="${x+5+k*4}" cy="188" r="2" fill="#fff" style="animation-delay:${(i*0.3+k*0.5).toFixed(1)}s"/>`}s+=`<rect x="70" y="194" width="220" height="10" fill="#5a6478"/>`;break;
    case 'dock':s+=`${ART&&ART.x_ship?`<image href="${ART.x_ship}" x="90" y="70" width="180" height="${180/(ART.x_shipR||1.4)}"/>`:''}<g class="ispark" transform="translate(150 160)"><path d="M0 0l8 -6M0 0l-6 -8M0 0l8 4M0 0l-8 2" stroke="#fff3a0" stroke-width="2" stroke-linecap="round"/></g><g class="ispark" style="animation-delay:.7s" transform="translate(230 140)"><path d="M0 0l8 -6M0 0l-6 -8M0 0l8 4" stroke="#fff3a0" stroke-width="2" stroke-linecap="round"/></g>`;break}
  return s}
function intInfo(id){const B=BLD[id],L=col.b[id],out=[];out.push(`🏷️ المستوى ${L}`);
  if(B.prod){const k=B.prod[0];out.push(`${RES[k][1]} +${fmtN(bRate(id))}/س`);if(PRODB[id])out.push(`📦 في المخزن ${fmtN(col.store[id]||0)}`)}
  if(id==='hq')out.push(`📦 السعة ${fmtN(cap())}`,`🧑‍🚀 الطاقم ${crew()}`);if(id==='habitat')out.push(`🧑‍🚀 ${crew()} رواد`,`😊 المعنويات ${Math.round((col.sv&&col.sv.morale)||80)}%`);
  if(id==='lab')out.push(col.rs?`🔬 يبحث الآن: ${TECH[col.rs.k].n} · ${fmtDur(Math.max(0,(col.rs.end-Date.now())/1000))}`:'🔬 المختبر جاهز لبحث جديد');
  if(id==='def')out.push(`⚔️ غنائم +${L*20}%`,`🛡️ غارات مصدودة ${col.raidWins||0}`);if(id==='dock')out.push(col.done?'🚀 المركبة مُصلحة':'🔧 المركبة قيد الإصلاح');
  return out}
const IDESC={hq:'غرفة القيادة: خريطة المستعمرة المجسّمة وشاشات كل الأنظمة.',mine:'المثقاب يحفر في الصخر، والحزام ينقل الخام إلى المخازن.',solar:'بطاريات الطاقة تمتلئ مع ضوء الشمس. مستواها يعكس مخزون الطاقة.',farm:'رفوف الزراعة المائية تحت أضواء النمو، وكل مستوى يضيف نباتات.',habitat:'غرف نوم الرواد ومطبخهم، هنا يرتاح الطاقم.',radio:'أجهزة الاستقبال تلتقط الإشارات وتحوّلها إلى كريستال.',obs:'التلسكوب يرصد السماء ويكشف أسرار المجرة.',def:'غرفة العمليات: الرادار يتتبع الوحوش، والصواريخ جاهزة.',lab:'أنابيب التجارب تغلي، والعلماء يعملون على أبحاثك.',dock:'حوض الإصلاح: الأذرع الآلية تعمل على المركبة.'};
function enterB(id){if(!(col.b[id]>0))return;const B=BLD[id],L=col.b[id];snd('ok');let o=$('interior');if(o)o.remove();o=document.createElement('div');o.id='interior';o.className='interior';
  const n=Math.max(1,Math.min(4,id==='habitat'?Math.ceil(crew()/3):1+Math.floor(L/4)));
  o.innerHTML=`<div class="ihead"><button type="button" class="ix" aria-label="خروج">✕</button><b>🚪 داخل ${B.name}</b></div><div class="iscene"><svg viewBox="0 0 360 300" preserveAspectRatio="xMidYMid slice">${room(id)}${props(id,L)}<g class="icrew">${crewWalk(n,236)}</g></svg></div><p class="idesc"></p><div class="ichips">${intInfo(id).map(x=>`<span>${x}</span>`).join('')}</div><div class="ibtns">${PRODB[id]&&(col.store[id]||0)>=1?'<button type="button" class="btn" data-ic>⤓ جمع</button>':''}<button type="button" class="btn main" data-iu>⬆️ تطوير المبنى</button><button type="button" class="btn" data-ix>🚶 خروج</button></div>`;
  o.querySelector('.idesc').textContent=IDESC[id]||B.desc||'';document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add('on'));
  const close=()=>{o.classList.remove('on');setTimeout(()=>o.remove(),250);snd('tap')};o.querySelector('.ix').onclick=close;o.querySelector('[data-ix]').onclick=close;
  o.querySelector('[data-iu]').onclick=()=>{close();setTimeout(()=>openSheet(id),260)};const ic=o.querySelector('[data-ic]');if(ic)ic.onclick=()=>{collect(id);ic.remove();o.querySelectorAll('.ichips span').forEach(s=>{if(s.textContent.startsWith('📦 في'))s.textContent='📦 في المخزن 0'})};
  col.visits=col.visits||{};col.visits[id]=1;colSave();if(Object.keys(col.visits).length>=10&&typeof unlock==='function')unlock('explorer')}
if(typeof ACH!=='undefined')ACH.push(['explorer','🚶','زيارة كل المباني من الداخل']);

/* joystick: in explorer mode, drag anywhere on the map and the astronaut walks that way (like «صمود المدار»); the camera follows */
const JOY={on:false,id:null,ox:0,oy:0,x:0,y:0,moved:false,raf:0,last:0,el:null,near:null};
function joyEl(){if(!JOY.el){const d=document.createElement('div');d.className='cjoy';d.innerHTML='<i></i>';document.body.appendChild(d);JOY.el=d}return JOY.el}
function joyDraw(){const d=joyEl();if(!JOY.on){d.hidden=true;return}d.hidden=false;d.style.left=JOY.ox+'px';d.style.top=JOY.oy+'px';
  const dx=JOY.x-JOY.ox,dy=JOY.y-JOY.oy,L=Math.hypot(dx,dy),k=L>44?44/L:1;d.firstChild.style.transform=`translate(${dx*k}px,${dy*k}px)`}
function inScene(e){return e.target&&e.target.closest&&e.target.closest('#cscene')&&!e.target.closest('.cre,.bub,.trader,.arkpad')}
document.addEventListener('pointerdown',e=>{if(!EX.on||!inScene(e)||JOY.on)return;JOY.on=true;JOY.id=e.pointerId;JOY.ox=JOY.x=e.clientX;JOY.oy=JOY.y=e.clientY;JOY.moved=false;e.stopPropagation()},true);
document.addEventListener('pointermove',e=>{if(!JOY.on||e.pointerId!==JOY.id)return;JOY.x=e.clientX;JOY.y=e.clientY;e.stopPropagation();
  if(!JOY.moved&&Math.hypot(JOY.x-JOY.ox,JOY.y-JOY.oy)>10){JOY.moved=true;EX.tx=null;EX.goal=null;exDraw();if(!JOY.raf){JOY.last=performance.now();JOY.raf=requestAnimationFrame(joyStep)}}if(JOY.moved)joyDraw()},true);
const joyUp=e=>{if(!JOY.on||e.pointerId!==JOY.id)return;JOY.on=false;joyDraw();e.stopPropagation();if(JOY.moved){const b=$('cscene')&&$('cscene').querySelector('#pav .pavb');if(b)b.classList.remove('walk');setTimeout(()=>{JOY.moved=false},0);JOY.block=Date.now()}};
document.addEventListener('pointerup',joyUp,true);document.addEventListener('pointercancel',joyUp,true);
// a drag must not count as a tap
document.addEventListener('click',e=>{if(EX.on&&JOY.block&&Date.now()-JOY.block<350&&inScene(e)){e.stopPropagation();e.preventDefault()}},true);
function joyStep(now){const dt=Math.min(0.05,(now-JOY.last)/1000);JOY.last=now;JOY.raf=0;if(!EX.on||!JOY.on||!JOY.moved)return;
  const dx=JOY.x-JOY.ox,dy=JOY.y-JOY.oy,L=Math.hypot(dx,dy);
  if(L>6){const k=Math.min(1,L/44),sp=115*k*dt;let nx=EX.x+dx/L*sp,ny=EX.y+dy/L*sp;
    if(!exInside(nx,ny)){const a=Math.atan2((ny-FEN.cy)/FEN.ry,(nx-FEN.cx)/FEN.rx);nx=FEN.cx+Math.cos(a)*FEN.rx*0.92;ny=FEN.cy+Math.sin(a)*FEN.ry*0.92}
    EX.x=nx;EX.y=ny;if(Math.abs(dx)>2)EX.dir=dx<0?-1:1;exPos();const b=$('cscene')&&$('cscene').querySelector('#pav .pavb');if(b)b.classList.add('walk');
    cam.x+=(EX.x-cam.x)*0.12;cam.y+=(EX.y-30-cam.y)*0.12;camView()}
  exNear();JOY.raf=requestAnimationFrame(joyStep)}
// standing at a door shows an «enter» button
function exNear(){let best=null,bd=34;for(const id of Object.keys(SLOT)){if(id==='wall'||id==='tower'||!(col.b[id]>0))continue;const d=EXDOOR(id),dist=Math.hypot(d[0]-EX.x,d[1]-EX.y);if(dist<bd){bd=dist;best=id}}
  if(best===JOY.near)return;JOY.near=best;let b=document.querySelector('.center');if(!best){if(b)b.hidden=true;return}
  if(!b){b=document.createElement('button');b.type='button';b.className='center';document.body.appendChild(b);b.onclick=()=>{const id=JOY.near;if(!id)return;if(typeof doorOpen==='function')doorOpen(id);snd('ok');setTimeout(()=>enterB(id),400)}}
  b.hidden=false;b.textContent='🚪 ادخل '+BLD[best].name}
{const _st=exStep;exStep=function(now){_st(now);exNear()}}
{const _tg=exToggle;exToggle=function(){_tg();if(!EX.on){JOY.near=null;const b=document.querySelector('.center');if(b)b.hidden=true}else{exNear();toast('🕹️ اسحب إصبعك على الخريطة لتحريك رائدك، أو المس مبنى لتدخله')}}}
setInterval(()=>{const b=document.querySelector('.center');if(b&&!b.hidden&&(!EX.on||$('hub').hidden||$('pColony').hidden||$('interior'))){b.hidden=true;JOY.near=null}},700);
