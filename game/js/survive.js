/* ================= game 10: endless survival ================= */
const SurviveGame=(()=>{
  // fixed arena in logical units; the canvas is scaled to the stage width
  const W=360,H=520,WAVE_LEN=30;
  let cv,ctx,raf=0,last=0,st,running=false,paused=true,over=false,joy=null,keys={},statT=0,hitSndT=0,buzzT=0;
  let p,gun,orb,pul,en,bl,eb,drops,parts,rings,t,wave,waveT,spawnT,kills,orbA,pulseT,buff,banner,lv,bossAlive,recordShown;
  const UP=[
    {id:'dmg',em:'💥',name:'رصاص أقوى',d:'زيادة 25% في ضرر كل طلقة',max:8,apply:()=>gun.dmg*=1.25},
    {id:'rate',em:'🔫',name:'إطلاق أسرع',d:'زيادة 20% في سرعة الإطلاق',max:8,apply:()=>gun.rate*=1.2},
    {id:'multi',em:'🔱',name:'طلقة إضافية',d:'تطلق رصاصة أكثر في كل مرة',max:5,apply:()=>gun.count++},
    {id:'pierce',em:'🏹',name:'رصاص خارق',d:'الرصاصة تخترق عدواً إضافياً',max:4,apply:()=>gun.pierce++},
    {id:'orbit',em:'🌀',name:'شفرات دوّارة',d:'شفرة إضافية تدور حولك',max:6,apply:()=>orb++},
    {id:'pulse',em:'💫',name:'موجة صدمة',d:'نبضة تضرب الأعداء حولك وتدفعهم',max:5,apply:()=>pul++},
    {id:'hp',em:'❤️',name:'جسد أقوى',d:'25 صحة إضافية وعلاج كامل',max:6,apply:()=>{p.max+=25;p.hp=p.max}},
    {id:'speed',em:'👟',name:'خفة الحركة',d:'زيادة 12% في سرعة المشي',max:5,apply:()=>p.spd*=1.12},
    {id:'magnet',em:'🧲',name:'مغناطيس',d:'تجذب الأدوات من مسافة أبعد',max:3,apply:()=>p.mag+=35}
  ];
  const DROPS={heart:'❤️',rapid:'⚡',shield:'🛡️',bomb:'💣',chip:'⬆️'};
  const TYPES={
    grunt:{r:9,hp:20,spd:52,dps:12,col:'#a46cff'},
    runner:{r:7,hp:11,spd:92,dps:9,col:'#ff7a45'},
    tank:{r:15,hp:85,spd:33,dps:20,col:'#4fbf6b'},
    spitter:{r:10,hp:28,spd:44,dps:10,col:'#ffd34d',shoots:2.4},
    boss:{r:26,hp:520,spd:38,dps:28,col:'#ff4d6d',shoots:2.8,boss:true}
  };
  const hpMul=w=>1+0.22*(w-1)+0.02*(w-1)*(w-1);
  // ground texture per region, painted once on an offscreen canvas at 2x; the region changes every wave
  const BIOMES=[
    {name:'المرج الأخضر',base:'#34502b',blots:['rgba(70,105,52,A)','rgba(38,60,30,A)','rgba(84,118,58,A)','rgba(30,48,26,A)'],trail:['rgba(92,74,48,.55)','rgba(118,96,62,.6)','rgba(136,112,74,.35)'],patch:'rgba(104,84,56,A)',
      blades:['#4f7a3a','#5f8c44','#2c4723','#6f9a4c','#3d6230'],nBlades:1400,rock:['#a9a59a','#5d5a52'],dots:['#e8e1a0','#f2f2f2','#c9a3e6','#f0b26a'],vig:.5,amb:'pollen'},
    {name:'الصحراء',base:'#c9a26a',blots:['rgba(214,180,124,A)','rgba(176,138,86,A)','rgba(226,196,142,A)','rgba(160,122,74,A)'],ripples:'rgba(140,104,60,.28)',patch:'rgba(150,112,66,A)',
      blades:['#8a6b3c','#6e5530','#9c7c48'],nBlades:160,shrubs:true,rock:['#c79a64','#7d5a36'],dots:[],vig:.4,amb:'dust'},
    {name:'أرض الثلوج',base:'#dfe7ee',blots:['rgba(255,255,255,A)','rgba(190,208,224,A)','rgba(236,242,248,A)','rgba(172,192,212,A)'],ice:true,patch:'rgba(170,196,220,A)',
      blades:['#6b625a','#4d4640'],nBlades:90,rock:['#7d858f','#3e444c'],snowCap:true,dots:[],vig:.35,amb:'snow'},
    {name:'الأرض البركانية',base:'#2b2220',blots:['rgba(60,44,38,A)','rgba(20,14,12,A)','rgba(74,52,42,A)','rgba(40,30,28,A)'],lava:true,patch:'rgba(18,12,10,A)',
      blades:['#4a3a32','#3a2c26'],nBlades:200,rock:['#4b4442','#121010'],dots:['#ff8a3c','#ffb347'],vig:.6,amb:'embers'},
    {name:'المستنقع',base:'#2c3b2b',blots:['rgba(54,72,46,A)','rgba(28,40,30,A)','rgba(70,84,52,A)','rgba(34,52,44,A)'],pools:true,patch:'rgba(40,56,40,A)',
      blades:['#56713e','#3c5530','#6d8448','#2e4428'],nBlades:900,reeds:true,rock:['#6e7466','#3a3f36'],dots:['#d8e06a'],vig:.55,amb:'fireflies'}
  ];
  let bg=null,bgOld=null,bgFade=0,biome=0,amb=[];
  function makeBg(bi){
    const B=BIOMES[bi%BIOMES.length],S=2,c=document.createElement('canvas');c.width=W*S;c.height=H*S;const g=c.getContext('2d');g.scale(S,S);const R=Math.random;
    g.fillStyle=B.base;g.fillRect(0,0,W,H);
    const blot=(x,y,r,col,al)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col.replace('A',al));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()};
    for(let k=0;k<160;k++)blot(R()*W,R()*H,20+R()*60,B.blots[k%4],0.35+R()*0.3);
    if(B.trail){const y0=H*(0.25+R()*0.5),y1=H*(0.25+R()*0.5),c1=(R()-0.5)*200,c2=(R()-0.5)*200;
      [[34,B.trail[0]],[22,B.trail[1]],[10,B.trail[2]]].forEach(([w,col])=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(-20,y0);g.bezierCurveTo(W*0.3,y0+c1,W*0.7,y1+c2,W+20,y1);g.stroke()})}
    if(B.ripples){g.strokeStyle=B.ripples;g.lineCap='round';for(let k=0;k<70;k++){const x=R()*W,y=R()*H,l=30+R()*70;g.lineWidth=1+R()*1.5;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y-6-R()*6,x+l,y);g.stroke()}}
    for(let k=0;k<6;k++)blot(R()*W,R()*H,25+R()*35,B.patch,0.55);
    if(B.ice)for(let k=0;k<7;k++){const x=R()*W,y=R()*H,rx=18+R()*34,ry=rx*(0.4+R()*0.3),a=R()*3;
      const gr=g.createLinearGradient(x-rx,y-ry,x+rx,y+ry);gr.addColorStop(0,'rgba(170,215,240,.75)');gr.addColorStop(1,'rgba(120,175,215,.6)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,a,0,6.283);g.fill();
      g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.beginPath();g.ellipse(x,y,rx,ry,a,3.6,4.9);g.stroke()}
    if(B.pools)for(let k=0;k<6;k++){const x=R()*W,y=R()*H,rx=20+R()*36,ry=rx*(0.45+R()*0.3);
      g.fillStyle='rgba(20,30,24,.55)';g.beginPath();g.ellipse(x,y+2,rx+3,ry+3,0,0,6.283);g.fill();
      const gr=g.createRadialGradient(x-rx*0.3,y-ry*0.3,2,x,y,rx);gr.addColorStop(0,'#3d5a52');gr.addColorStop(1,'#1d2e2a');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,0,0,6.283);g.fill();
      for(let j=0;j<3;j++){const px=x+(R()-0.5)*rx,py=y+(R()-0.5)*ry*0.8,pr=3+R()*3;g.fillStyle='#4f7a3a';g.beginPath();g.arc(px,py,pr,0.4,6.0);g.lineTo(px,py);g.fill()}}
    if(B.lava){g.lineCap='round';g.lineJoin='round';for(let k=0;k<9;k++){let x=R()*W,y=R()*H;const pts=[[x,y]];for(let j=0;j<6;j++){x+=(R()-0.5)*60;y+=(R()-0.5)*60;pts.push([x,y])}
      for(const [w,col,bl] of [[7,'rgba(255,90,20,.25)',10],[3,'#ff6a1a',6],[1.2,'#ffd27a',0]]){g.shadowColor='#ff5a00';g.shadowBlur=bl;g.strokeStyle=col;g.lineWidth=w;g.beginPath();pts.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.stroke()}}
      g.shadowBlur=0;for(let k=0;k<4;k++){const x=R()*W,y=R()*H,r=10+R()*14;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'#ffd27a');gr.addColorStop(0.4,'#ff6a1a');gr.addColorStop(1,'rgba(120,20,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}}
    for(let k=0;k<B.nBlades;k++){const x=R()*W,y=R()*H,l=3+R()*5,an=-1.57+(R()-0.5)*0.9;g.strokeStyle=B.blades[k%B.blades.length];g.globalAlpha=0.5+R()*0.5;g.lineWidth=0.8+R()*0.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(an)*l,y+Math.sin(an)*l);g.stroke()}
    g.globalAlpha=1;
    if(B.shrubs)for(let k=0;k<14;k++){const x=R()*W,y=R()*H;g.strokeStyle='#6e5530';g.lineWidth=1;for(let j=0;j<7;j++){const an=-3.14+R()*3.14,l=4+R()*6;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(an)*l,y+Math.sin(an)*l);g.stroke()}}
    if(B.reeds)for(let k=0;k<16;k++){const x=R()*W,y=R()*H;for(let j=0;j<4;j++){const dx=(R()-0.5)*6,h=10+R()*8;g.strokeStyle='#6d8448';g.lineWidth=1.2;g.beginPath();g.moveTo(x+dx,y);g.quadraticCurveTo(x+dx+2,y-h/2,x+dx+(R()-0.5)*4,y-h);g.stroke();
      if(R()<0.4){g.fillStyle='#5a3e26';g.beginPath();g.ellipse(x+dx,y-h,1.6,3.5,0,0,6.283);g.fill()}}}
    for(let k=0;k<34;k++){const x=R()*W,y=R()*H,r=k<6?6+R()*7:1.5+R()*3,sh=0.7+R()*0.3,rot=R()*3;
      g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x+r*0.25,y+r*0.45,r,r*sh,0,0,6.283);g.fill();
      const gr=g.createRadialGradient(x-r*0.35,y-r*0.35,r*0.1,x,y,r);gr.addColorStop(0,B.rock[0]);gr.addColorStop(1,B.rock[1]);g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*sh,rot,0,6.283);g.fill();
      if(B.snowCap&&r>3){g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.ellipse(x-r*0.1,y-r*0.35,r*0.75,r*sh*0.45,rot,0,6.283);g.fill()}}
    for(let k=0;k<45&&B.dots.length;k++){g.fillStyle=B.dots[k%B.dots.length];g.beginPath();g.arc(R()*W,R()*H,0.9+R()*0.8,0,6.283);g.fill()}
    const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${B.vig})`);g.fillStyle=v;g.fillRect(0,0,W,H);
    return c;
  }
  // ambient particles that give each region its mood
  function makeAmb(bi){const k=BIOMES[bi%BIOMES.length].amb,R=Math.random;amb=[];
    const n={snow:70,embers:40,dust:30,fireflies:22,pollen:18}[k];
    for(let i=0;i<n;i++)amb.push({x:R()*W,y:R()*H,s:R(),ph:R()*6.28})}
  function stepAmb(dt){const k=BIOMES[biome%BIOMES.length].amb;
    for(const a of amb){a.ph+=dt*(1+a.s);
      if(k==='snow'){a.y+=(18+a.s*30)*dt;a.x+=Math.sin(a.ph)*12*dt}
      else if(k==='embers'){a.y-=(14+a.s*26)*dt;a.x+=Math.sin(a.ph*1.3)*10*dt}
      else if(k==='dust'){a.x+=(60+a.s*90)*dt;a.y+=Math.sin(a.ph)*6*dt}
      else{a.x+=Math.cos(a.ph*0.7)*10*dt;a.y+=Math.sin(a.ph)*8*dt}
      if(a.y>H+5)a.y=-5;if(a.y<-5)a.y=H+5;if(a.x>W+5)a.x=-5;if(a.x<-5)a.x=W+5}}
  function drawAmb(){const k=BIOMES[biome%BIOMES.length].amb;
    for(const a of amb){
      if(k==='snow'){ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(a.x,a.y,1+a.s*1.6,0,6.283);ctx.fill()}
      else if(k==='embers'){ctx.fillStyle=`rgba(255,${120+a.s*100|0},40,${0.5+0.5*Math.sin(a.ph*3)**2})`;ctx.beginPath();ctx.arc(a.x,a.y,1+a.s,0,6.283);ctx.fill()}
      else if(k==='dust'){ctx.strokeStyle='rgba(240,220,180,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-8-a.s*10,a.y);ctx.stroke()}
      else if(k==='fireflies'){const al=Math.max(0,Math.sin(a.ph*1.5));ctx.fillStyle=`rgba(220,240,110,${al})`;ctx.beginPath();ctx.arc(a.x,a.y,1.8,0,6.283);ctx.fill();ctx.fillStyle=`rgba(220,240,110,${al*0.2})`;ctx.beginPath();ctx.arc(a.x,a.y,5,0,6.283);ctx.fill()}
      else{ctx.fillStyle='rgba(255,250,210,.45)';ctx.beginPath();ctx.arc(a.x,a.y,1.1,0,6.283);ctx.fill()}}}
  function setBiome(bi,fade){biome=bi;if(fade&&bg){bgOld=bg;bgFade=1.2}else bgOld=null;bg=makeBg(bi);makeAmb(bi)}
  const shadow=(x,y,r)=>{ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(x+r*0.15,y+r*0.75,r*0.95,r*0.42,0,0,6.283);ctx.fill()};
  function resize(){const w=stage.clientWidth;cv.width=Math.round(w*devicePixelRatio);cv.height=Math.round(w*H/W*devicePixelRatio);cv.style.height=(w*H/W)+'px';ctx.setTransform(w/W*devicePixelRatio,0,0,w/W*devicePixelRatio,0,0)}
  function reset(){
    p={x:W/2,y:H/2,r:11,hp:100,max:100,spd:120,mag:40,aim:-Math.PI/2,hurt:0};
    gun={dmg:10,rate:2.2,count:1,pierce:0,spd:380,cd:0};orb=0;pul=0;orbA=0;pulseT=3;
    en=[];bl=[];eb=[];drops=[];parts=[];rings=[];t=0;wave=1;waveT=0;spawnT=0.6;kills=0;
    buff={rapid:0,shield:0};banner={txt:'الموجة 1',sub:BIOMES[0].name,t:2.2};lv={};bossAlive=false;recordShown=false;over=false;
  }
  function spawn(type){
    const T=TYPES[type],side=Math.floor(Math.random()*4),m=T.r+4;
    let x,y;if(side===0){x=Math.random()*W;y=-m}else if(side===1){x=W+m;y=Math.random()*H}else if(side===2){x=Math.random()*W;y=H+m}else{x=-m;y=Math.random()*H}
    const hp=type==='boss'?T.hp*(wave/5)*Math.pow(1.3,wave/5-1):T.hp*hpMul(wave);
    en.push({type,x,y,r:T.r,hp,max:hp,spd:T.spd*(1+Math.min(0.5,wave*0.02))*(0.9+Math.random()*0.2),dps:T.dps*(1+wave*0.04),col:T.col,shoot:T.shoots?T.shoots*(0.5+Math.random()):0,flash:0,oc:0,boss:!!T.boss});
  }
  function pickType(){const r=Math.random();
    if(wave>=4&&r<0.12)return 'spitter';if(wave>=3&&r<0.26)return 'tank';if(wave>=2&&r<0.5)return 'runner';return 'grunt'}
  function startWave(){
    setBiome(wave-1,true);
    banner={txt:wave%5===0?'الموجة '+wave+' · زعيم قادم!':'الموجة '+wave,sub:BIOMES[(wave-1)%BIOMES.length].name,t:2.2};
    if(wave%5===0){for(let k=0;k<Math.floor(wave/10)+1;k++)spawn('boss');bossAlive=true;snd('err')}
  }
  function avail(){return UP.filter(u=>(lv[u.id]||0)<u.max)}
  function applyUp(u){lv[u.id]=(lv[u.id]||0)+1;u.apply()}
  function chooseUpgrade(){
    const opts=shuffle(avail().slice(),Math.random).slice(0,3);
    if(!opts.length){p.hp=p.max;wave++;startWave();return}
    paused=true;const o=document.createElement('div');o.className='overlay';
    o.innerHTML='<h3 style="font-size:24px"></h3><p>اختر تطويراً واحداً</p><div class="upgrades"></div>';
    o.querySelector('h3').textContent='أنهيت الموجة '+wave+' 🎉';
    const box=o.querySelector('.upgrades');
    opts.forEach(u=>{const b=document.createElement('button');b.type='button';b.className='upc';
      b.innerHTML='<span class="em"></span><span><b></b><small></small></span><i></i>';
      b.querySelector('.em').textContent=u.em;b.querySelector('b').textContent=u.name;b.querySelector('small').textContent=u.d;
      b.querySelector('i').textContent=(lv[u.id]||0)+1+'/'+u.max;
      b.onclick=()=>{applyUp(u);snd('ok');o.remove();wave++;startWave();paused=false;last=performance.now()};box.appendChild(b)});
    stage.appendChild(o);snd('win');buzz([20,30,40]);
  }
  function nearest(){let b=null,bd=1e9;for(const e of en){if(e.x<-5||e.x>W+5||e.y<-5||e.y>H+5)continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;b=e}}return b}
  function hurt(e,d){e.hp-=d;e.flash=0.08;if(e.hp<=0&&!e.dead)kill(e)}
  function kill(e){
    e.dead=true;kills++;st.totalKills=(st.totalKills||0)+1;
    for(let k=0;k<(e.boss?24:7);k++){const a=Math.random()*6.28,s=40+Math.random()*120;parts.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0.5,col:e.col})}
    const now=performance.now();if(now-hitSndT>90){snd('hit');hitSndT=now}
    if(e.boss){drop(e.x-12,e.y,'chip');drop(e.x+12,e.y,'chip');drop(e.x,e.y+12,'heart');unlock('surv_boss');bossAlive=en.some(x=>x.boss&&!x.dead)}
    else if(Math.random()<0.075){const r=Math.random();drop(e.x,e.y,r<0.4?'heart':r<0.6?'rapid':r<0.75?'shield':r<0.85?'bomb':'chip')}
  }
  function drop(x,y,k){drops.push({x:Math.max(12,Math.min(W-12,x)),y:Math.max(30,Math.min(H-12,y)),k,life:12})}
  function take(d){
    if(d.k==='heart'){p.hp=Math.min(p.max,p.hp+30);toast('❤️ صحة إضافية 30')}
    else if(d.k==='rapid'){buff.rapid=8;toast('⚡ إطلاق مضاعف 8 ثوانٍ')}
    else if(d.k==='shield'){buff.shield=6;toast('🛡️ درع 6 ثوانٍ')}
    else if(d.k==='bomb'){rings.push({x:p.x,y:p.y,r:0,R:Math.max(W,H),l:0.5});en.forEach(e=>{if(!e.dead)hurt(e,e.boss?150:9999)});buzz(80);toast('💣 انفجار!')}
    else{const a=avail();if(a.length){const u=a[Math.floor(Math.random()*a.length)];applyUp(u);toast('⬆️ تطوير: '+u.name)}else{p.hp=p.max}}
    snd('ok');
  }
  function update(dt){
    t+=dt;waveT+=dt;
    // movement: joystick or keyboard
    let mx=0,my=0;
    if(joy){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,L=Math.hypot(dx,dy);if(L>4){const k=Math.min(1,L/40);mx=dx/L*k;my=dy/L*k}}
    if(keys.ArrowLeft||keys.a)mx-=1;if(keys.ArrowRight||keys.d)mx+=1;if(keys.ArrowUp||keys.w)my-=1;if(keys.ArrowDown||keys.s)my+=1;
    const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml}
    p.x=Math.max(p.r,Math.min(W-p.r,p.x+mx*p.spd*dt));p.y=Math.max(p.r,Math.min(H-p.r,p.y+my*p.spd*dt));
    // spawning
    spawnT-=dt;
    if(spawnT<=0&&en.length<130){const n=1+Math.floor(wave/4);for(let k=0;k<n;k++)spawn(pickType());spawnT=Math.max(0.22,0.95-0.07*wave)}
    // gun
    gun.cd-=dt*(buff.rapid>0?2:1);const tg=nearest();
    if(tg)p.aim=Math.atan2(tg.y-p.y,tg.x-p.x);
    if(gun.cd<=0&&tg){gun.cd=1/gun.rate;const n=gun.count,spr=0.16;
      for(let k=0;k<n;k++){const a=p.aim+(k-(n-1)/2)*spr;bl.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,vx:Math.cos(a)*gun.spd,vy:Math.sin(a)*gun.spd,pierce:gun.pierce,hit:new Set(),l:1.2})}}
    for(const b of bl){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;
      for(const e of en){if(e.dead||b.hit.has(e))continue;if((e.x-b.x)**2+(e.y-b.y)**2<(e.r+3)**2){b.hit.add(e);hurt(e,gun.dmg);e.x+=b.vx*0.012;e.y+=b.vy*0.012;if(b.pierce--<=0){b.l=0;break}}}}
    // orbit blades
    orbA+=3.2*dt;
    if(orb){const R=48;for(let k=0;k<orb;k++){const a=orbA+k*6.283/orb,bx=p.x+Math.cos(a)*R,by=p.y+Math.sin(a)*R;
      for(const e of en)if(!e.dead&&e.oc<=0&&(e.x-bx)**2+(e.y-by)**2<(e.r+8)**2){hurt(e,10+4*orb+gun.dmg*0.4);e.oc=0.35}}}
    // shock pulse
    if(pul){pulseT-=dt;if(pulseT<=0){pulseT=Math.max(1.4,4.2-0.5*pul);const R=70+18*pul,dmg=18+10*pul;rings.push({x:p.x,y:p.y,r:0,R,l:0.35});
      for(const e of en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d<R+e.r){hurt(e,dmg);if(!e.boss&&d>0){e.x+=dx/d*28;e.y+=dy/d*28}}}}}
    // enemies
    const shielded=buff.shield>0;let touching=0;
    for(const e of en){if(e.dead)continue;e.flash-=dt;e.oc-=dt;
      const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
      let sp=e.spd;if(e.type==='spitter'&&d<140)sp=-e.spd*0.5;
      e.x+=dx/d*sp*dt;e.y+=dy/d*sp*dt;
      if(e.shoot){e.shoot-=dt;if(e.shoot<=0&&d<320){e.shoot=TYPES[e.type].shoots;
        if(e.boss){for(let k=0;k<10;k++){const a=k*0.628+t;eb.push({x:e.x,y:e.y,vx:Math.cos(a)*130,vy:Math.sin(a)*130,d:12,l:4})}}
        else eb.push({x:e.x,y:e.y,vx:dx/d*170,vy:dy/d*170,d:9,l:3})}}
      if(d<e.r+p.r){touching+=e.dps}}
    // keep enemies from stacking into one blob
    for(let i=0;i<en.length;i++){const a=en[i];if(a.dead)continue;for(let j=i+1;j<en.length;j++){const b=en[j];if(b.dead)continue;
      const dx=b.x-a.x,dy=b.y-a.y,m=a.r+b.r;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;const d=Math.hypot(dx,dy);if(d<m&&d>0.01){const push=(m-d)/2,ux=dx/d,uy=dy/d,wa=a.boss?0.1:1,wb=b.boss?0.1:1;a.x-=ux*push*wa;a.y-=uy*push*wa;b.x+=ux*push*wb;b.y+=uy*push*wb}}}
    for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if((b.x-p.x)**2+(b.y-p.y)**2<(p.r+4)**2){b.l=0;if(!shielded){p.hp-=b.d;p.hurt=0.15;feel()}}}
    if(touching&&!shielded){p.hp-=touching*dt;p.hurt=0.12;feel()}
    // drops
    for(const d of drops){d.life-=dt;const dx=p.x-d.x,dy=p.y-d.y,dd=Math.hypot(dx,dy);
      if(dd<p.mag&&dd>1){d.x+=dx/dd*220*dt;d.y+=dy/dd*220*dt}
      if(dd<p.r+10){d.life=0;take(d)}}
    for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=0.92;q.vy*=0.92;q.l-=dt}
    for(const r of rings){r.r+=(r.R/0.35)*dt;r.l-=dt}
    en=en.filter(e=>!e.dead);bl=bl.filter(b=>b.l>0&&b.x>-20&&b.x<W+20&&b.y>-20&&b.y<H+20);eb=eb.filter(b=>b.l>0);
    drops=drops.filter(d=>d.life>0);parts=parts.filter(q=>q.l>0);rings=rings.filter(r=>r.l>0);
    buff.rapid=Math.max(0,buff.rapid-dt);buff.shield=Math.max(0,buff.shield-dt);p.hurt-=dt;if(banner.t>0)banner.t-=dt;
    if(t>=60&&!ach.won.survive){ach.won.survive=true;save('arcade-ach',ach);if(GAMES.every(G=>ach.won[G.id]))unlock('allfive')}
    if(t>=120)unlock('surv2');if(t>=300)unlock('surv5');
    if(!recordShown&&st.bestTime>=30&&t>st.bestTime){recordShown=true;toast('🏆 رقم قياسي جديد!','ach')}
    if(p.hp<=0){p.hp=0;die();return}
    if(waveT>=WAVE_LEN){waveT=0;chooseUpgrade()}
  }
  function feel(){const now=performance.now();if(now-buzzT>350){buzz(25);buzzT=now}}
  function die(){
    over=true;paused=true;running=false;
    const rec=t>(st.bestTime||0);st.bestTime=Math.max(st.bestTime||0,t);st.bestWave=Math.max(st.bestWave||1,wave);st.runs=(st.runs||0)+1;
    st.stars={1:(st.bestTime>=60)+(st.bestTime>=180)+(st.bestTime>=300)};st.level=st.bestWave;st.best=st.bestWave;gSave('survive',st);
    if((st.totalKills||0)>=1000)unlock('surv_k1000');
    for(let k=0;k<30;k++){const a=Math.random()*6.28,s=60+Math.random()*160;parts.push({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0.8,col:'#3fd6c0'})}
    stats();
    loseBox({title:rec?'رقم قياسي جديد! 🏆':'سقطت في المعركة',
      text:`صمدت ${fmtTime(t)} · الموجة ${wave} · ${kills} عدو`+(rec?'':` · رقمك القياسي ${fmtTime(st.bestTime)}`),
      onRetry:()=>begin()});
  }
  function stats(){setStat('s1',fmtTime(t));setStat('s2',wave);setStat('s3',kills);setStat('s4',fmtTime(Math.max(st.bestTime||0,over?0:t)))}
  function draw(){
    if(!bg)setBiome(0);ctx.drawImage(bg,0,0,W,H);if(bgOld&&bgFade>0){ctx.globalAlpha=Math.min(1,bgFade/1.2);ctx.drawImage(bgOld,0,0,W,H);ctx.globalAlpha=1}
    for(const e of en)shadow(e.x,e.y,e.r);if(!over)shadow(p.x,p.y,p.r);
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(const d of drops){if(d.life<3&&Math.floor(d.life*6)%2)continue;ctx.font='18px sans-serif';ctx.fillText(DROPS[d.k],d.x,d.y)}
    for(const r of rings){ctx.strokeStyle=`rgba(159,232,255,${Math.max(0,r.l*2)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,Math.min(r.r,r.R),0,6.283);ctx.stroke()}
    for(const e of en){
      ctx.fillStyle=e.flash>0?'#fff':e.col;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,6.283);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=1.5;ctx.stroke();
      const a=Math.atan2(p.y-e.y,p.x-e.x),eo=e.r*0.35;ctx.fillStyle='#0b1618';
      for(const s of [-1,1]){const ex=e.x+Math.cos(a)*eo*0.9+Math.cos(a+1.57)*eo*s,ey=e.y+Math.sin(a)*eo*0.9+Math.sin(a+1.57)*eo*s;ctx.beginPath();ctx.arc(ex,ey,Math.max(1.6,e.r*0.16),0,6.283);ctx.fill()}
      if(e.max>60&&e.hp<e.max){ctx.fillStyle='#00000088';ctx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2,3);ctx.fillStyle='#ff4d6d';ctx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2*e.hp/e.max,3)}
    }
    ctx.fillStyle='#ff5d73';for(const b of eb){ctx.beginPath();ctx.arc(b.x,b.y,4,0,6.283);ctx.fill()}
    ctx.fillStyle=buff.rapid>0?'#9fe8ff':'#ffd34d';ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;for(const b of bl){ctx.beginPath();ctx.arc(b.x,b.y,3,0,6.283);ctx.fill();ctx.stroke()}
    if(orb){ctx.fillStyle='#9fe8ff';for(let k=0;k<orb;k++){const a=orbA+k*6.283/orb,bx=p.x+Math.cos(a)*48,by=p.y+Math.sin(a)*48;
      ctx.save();ctx.translate(bx,by);ctx.rotate(orbA*3);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(4,0);ctx.lineTo(0,8);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.restore()}}
    for(const q of parts){ctx.globalAlpha=Math.max(0,q.l*1.6);ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,6.283);ctx.fill()}ctx.globalAlpha=1;
    if(!over){
      if(buff.shield>0){ctx.strokeStyle='#9fe8ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,p.r+7,0,6.283);ctx.stroke()}
      ctx.strokeStyle='#e9f3ef';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(p.aim)*17,p.y+Math.sin(p.aim)*17);ctx.stroke();
      ctx.fillStyle=p.hurt>0?'#ff8a8a':'#3fd6c0';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();
      ctx.strokeStyle='#0b1618';ctx.lineWidth=2;ctx.stroke();
    }
    drawAmb();
    // HUD: health, wave progress, buffs
    const hw=W-20,r=Math.max(0,p.hp/p.max);
    ctx.fillStyle='#00000080';ctx.fillRect(10,10,hw,10);ctx.fillStyle=r>0.5?'#4fbf6b':r>0.25?'#ffd34d':'#ff4d6d';ctx.fillRect(10,10,hw*r,10);
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.fillText(Math.ceil(p.hp)+' / '+p.max,W/2,15.5);
    ctx.fillStyle='#00000080';ctx.fillRect(10,24,hw,3);ctx.fillStyle='#ff8a4c';ctx.fillRect(10,24,hw*waveT/WAVE_LEN,3);
    let bx=W-22;ctx.font='13px sans-serif';
    for(const [k,em] of [['rapid','⚡'],['shield','🛡️']])if(buff[k]>0){ctx.fillText(em,bx,40);ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.fillText(Math.ceil(buff[k]),bx,53);ctx.font='13px sans-serif';bx-=26}
    if(banner.t>0){ctx.globalAlpha=Math.min(1,banner.t*1.5);ctx.font='bold 24px sans-serif';ctx.fillStyle='#000000aa';ctx.fillText(banner.txt,W/2+1,H*0.32+2);ctx.fillStyle=banner.txt.includes('زعيم')?'#ff4d6d':'#ffd34d';ctx.fillText(banner.txt,W/2,H*0.32);if(banner.sub){ctx.font='bold 15px sans-serif';ctx.fillStyle='#000000aa';ctx.fillText('📍 '+banner.sub,W/2+1,H*0.32+29);ctx.fillStyle='#fff';ctx.fillText('📍 '+banner.sub,W/2,H*0.32+28)}ctx.globalAlpha=1}
    if(joy){ctx.strokeStyle='#ffffff40';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,40,0,6.283);ctx.stroke();
      const dx=joy.x-joy.ox,dy=joy.y-joy.oy,L=Math.hypot(dx,dy),k=L>40?40/L:1;ctx.fillStyle='#ffffff55';ctx.beginPath();ctx.arc(joy.ox+dx*k,joy.oy+dy*k,16,0,6.283);ctx.fill()}
  }
  function step(now){
    const dt=Math.min(0.05,(now-last)/1000||0);last=now;
    if(bgFade>0)bgFade-=dt;if(!paused||!running)stepAmb(dt);
    if(running&&!paused)update(dt);else if(over){for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}parts=parts.filter(q=>q.l>0)}
    statT-=dt;if(statT<=0&&st){statT=0.25;stats()}
    draw();raf=requestAnimationFrame(step);
  }
  function begin(){clearOverlays();reset();setBiome(0);running=true;paused=false;last=performance.now();stats()}
  function pause(){if(!running||paused||over)return;paused=true;joy=null;
    const o=document.createElement('div');o.className='overlay';o.innerHTML='<h3>متوقف مؤقتاً</h3><p></p><button class="btn main" type="button">متابعة</button>';
    o.querySelector('p').textContent=`${fmtTime(t)} · الموجة ${wave} · ${kills} عدو`;
    o.querySelector('button').onclick=()=>{o.remove();paused=false;last=performance.now()};stage.appendChild(o)}
  function intro(){
    const o=document.createElement('div');o.className='overlay';
    o.innerHTML='<h3>صمود المدار</h3><p></p><button class="btn main" type="button">ابدأ</button>';
    o.querySelector('p').textContent=st.bestTime?`رقمك القياسي ${fmtTime(st.bestTime)} · أعلى موجة ${st.bestWave}`:'حرّك إصبعك على الملعب للمشي، وسلاحك يطلق وحده';
    o.querySelector('button').onclick=()=>begin();stage.appendChild(o)}
  const toLocal=ev=>{const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*W/r.width,(ev.clientY-r.top)*H/r.height]};
  return {id:'survive',name:'صمود المدار',region(i){setBiome(i,false)},desc:'اصمد أطول وقت وطوّر سلاحك',noDaily:true,
    play(){intro()},
    icon:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#0f1f22"/><circle cx="24" cy="26" r="6" fill="#3fd6c0"/><path d="M24 26L35 15" stroke="#e9f3ef" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="11" r="2" fill="#ffd34d"/><circle cx="11" cy="13" r="4.5" fill="#a46cff"/><circle cx="10" cy="37" r="3.5" fill="#ff7a45"/><circle cx="37" cy="36" r="5.5" fill="#4fbf6b"/></svg>',
    help:'حرّك إصبعك في أي مكان على الملعب لتمشي، وسلاحك يطلق وحده على أقرب عدو. كل 30 ثانية تنتهي موجة وتختار تطويراً: رصاص أقوى أو أسرع، طلقات أكثر، شفرات دوّارة، موجة صدمة وغيرها. الأعداء يُسقطون أحياناً أدوات: ❤️ صحة، ⚡ إطلاق مضاعف، 🛡️ درع، 💣 قنبلة، ⬆️ تطوير فوري. كل خامس موجة يظهر زعيم. هدفك أن تصمد أطول وقت وتكسر رقمك القياسي.',
    progress(){const s=gState('survive');return {level:s.bestWave||1,stars:starTotal(s)}},
    start(){
      st=gState('survive',{bestTime:0,bestWave:1,totalKills:0});reset();running=false;paused=true;
      setStats([['s1','الوقت'],['s2','الموجة','gold'],['s3','الأعداء'],['s4','الرقم القياسي']]);$('lvlBtn').hidden=true;
      cv=document.createElement('canvas');stage.appendChild(cv);ctx=cv.getContext('2d');resize();
      this.rs=()=>resize();addEventListener('resize',this.rs);
      cv.addEventListener('pointerdown',ev=>{if(!running||paused)return;const [x,y]=toLocal(ev);joy={ox:x,oy:y,x,y,id:ev.pointerId};try{cv.setPointerCapture(ev.pointerId)}catch(e){}ev.preventDefault()});
      cv.addEventListener('pointermove',ev=>{if(!joy||ev.pointerId!==joy.id)return;const [x,y]=toLocal(ev);joy.x=x;joy.y=y});
      const end=ev=>{if(joy&&ev.pointerId===joy.id)joy=null};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
      this.kd=ev=>{const k=ev.key.length===1?ev.key.toLowerCase():ev.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)){keys[k]=true;ev.preventDefault()}if(k==='p'||k==='Escape')pause()};
      this.ku=ev=>{const k=ev.key.length===1?ev.key.toLowerCase():ev.key;keys[k]=false};
      addEventListener('keydown',this.kd);addEventListener('keyup',this.ku);
      this.vis=()=>{if(document.hidden)pause()};document.addEventListener('visibilitychange',this.vis);
      btn('إيقاف مؤقت',null,pause);
      btn('جولة جديدة',IC.reset,()=>{snd('tap');begin()});
      stats();intro();last=performance.now();raf=requestAnimationFrame(step);
    },
    stop(){cancelAnimationFrame(raf);running=false;paused=true;joy=null;keys={};removeEventListener('resize',this.rs);removeEventListener('keydown',this.kd);removeEventListener('keyup',this.ku);document.removeEventListener('visibilitychange',this.vis)}};
})();
