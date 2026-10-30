/* ================= game 10: endless survival ================= */
const SurviveGame=(()=>{
  // fixed arena in logical units; the canvas is scaled to the stage width
  const W=360,H=520,WAVE_LEN=30;
  let cv,ctx,raf=0,last=0,st,running=false,paused=true,over=false,joy=null,keys={},statT=0,hitSndT=0,buzzT=0;
  let p,gun,orb,pul,mis,drn,mines,bolts,flT,chT,mnT,beamTg,evo,misT,drnT,novaT,bhT,holes,ms,en,bl,eb,drops,parts,rings,hz,crys,bossKills,t,wave,waveT,spawnT,kills,orbA,pulseT,buff,banner,lv,bossAlive,recordShown;
  const UP=[
    {id:'dmg',em:'💥',name:'ليزر أقوى',d:'زيادة 25% في ضرر كل شعاع',max:8,apply:()=>gun.dmg*=1.25},
    {id:'rate',em:'🔫',name:'إطلاق أسرع',d:'زيادة 20% في سرعة الإطلاق',max:8,apply:()=>gun.rate*=1.2},
    {id:'multi',em:'🔱',name:'شعاع إضافي',d:'تطلق شعاعاً أكثر في كل مرة',max:5,apply:()=>gun.count++},
    {id:'pierce',em:'☄️',name:'ليزر خارق',d:'الشعاع يخترق كائناً إضافياً',max:4,apply:()=>gun.pierce++},
    {id:'orbit',em:'🌑',name:'أقمار دوّارة',d:'قمر صغير إضافي يدور حولك ويصدم الأعداء',max:6,apply:()=>orb++},
    {id:'pulse',em:'💫',name:'نبضة جاذبية',d:'نبضة تضرب الكائنات حولك وتدفعها',max:5,apply:()=>pul++},
    {id:'hp',em:'🧑‍🚀',name:'بدلة أقوى',d:'25 صحة إضافية وإصلاح كامل للبدلة',max:6,apply:()=>{p.max+=25;p.hp=p.max}},
    {id:'speed',em:'🚀',name:'دفع نفّاث',d:'زيادة 12% في سرعة الحركة',max:5,apply:()=>p.spd*=1.12},
    {id:'magnet',em:'🧲',name:'مغناطيس',d:'تجذب الأدوات من مسافة أبعد',max:3,apply:()=>p.mag+=35},
    {id:'missile',em:'🚀',name:'صواريخ موجّهة',d:'صاروخ إضافي يلاحق الكائنات وينفجر',max:5,apply:()=>mis++},
    {id:'drone',em:'🛸',name:'طائرة مسيّرة',d:'طائرة صغيرة ترافقك وتطلق معك',max:3,apply:()=>drn++},
    {id:'beam',em:'🔦',name:'شعاع متواصل',d:'شعاع ليزر يحرق أقرب كائن بلا توقف',max:5,apply:()=>{}},
    {id:'flame',em:'🔥',name:'قاذف لهب',d:'لهب قصير المدى يحرق كل ما أمامك',max:5,apply:()=>{}},
    {id:'chain',em:'🌩️',name:'برق متسلسل',d:'صاعقة تقفز من كائن إلى آخر',max:5,apply:()=>{}},
    {id:'mines',em:'🧨',name:'ألغام فضائية',d:'تزرع لغماً خلفك ينفجر عند اقتراب الكائنات',max:4,apply:()=>{}},
    {id:'armor',em:'🦺',name:'درع مدرّع',d:'يقلل كل ضرر تتلقاه 10%',max:5,apply:()=>{}},
    {id:'regen',em:'💚',name:'تجديد ذاتي',d:'تستعيد صحتك تدريجياً طوال الوقت',max:4,apply:()=>{}},
    {id:'barrier',em:'🔰',name:'حاجز طاقة',d:'حاجز يصدّ ضربة كاملة ثم يعود بعد ثوانٍ',max:4,apply:()=>{p.bar=1;p.barT=0}}
  ];
  // fusions: two weapons that are strong enough merge into a super weapon (offered once, as a golden card)
  const EVO=[
    {id:'blackhole',em:'🕳️',name:'ثقب أسود',d:'دمج الأقمار ونبضة الجاذبية: ثقب يبتلع الكائنات القريبة',need:{orbit:4,pulse:3}},
    {id:'nova',em:'🌟',name:'ليزر نوفا',d:'دمج الليزر القوي والأشعة الإضافية: حلقة من 16 شعاعاً كل 3 ثوانٍ',need:{dmg:4,multi:3}},
    {id:'swarm',em:'🎆',name:'سرب الصواريخ',d:'دمج الصواريخ والمسيّرات: كل مسيّرة تطلق صواريخ أيضاً',need:{missile:3,drone:2}}
  ];
  // astronauts to choose from before a run
  const CHARS={
    scout:{name:'المستكشف',em:'🧑‍🚀',d:'متوازن في كل شيء',visor:['#ffd27a','#d46a00'],hp:1,dmg:1,rate:1,spd:1},
    sniper:{name:'القنّاص',em:'🎯',d:'ضرر أعلى 60% وإطلاق أبطأ',visor:['#ff9aa8','#c0304a'],hp:0.85,dmg:1.6,rate:0.72,spd:1},
    runner:{name:'العدّاء',em:'⚡',d:'أسرع 25% وصحة أقل',visor:['#9ff0ff','#1f8fb0'],hp:0.8,dmg:1,rate:1.1,spd:1.25},
    tank:{name:'المدرّع',em:'🛡️',d:'صحة أكبر 50% وحركة أبطأ',visor:['#c8ff9a','#4a9a2a'],hp:1.5,dmg:1,rate:1,spd:0.85}
  };
  const DROPS={heart:'❤️',rapid:'⚡',shield:'🛡️',bomb:'💣',chip:'⬆️',crys:'💎'};
  const DCOL={heart:'#ff5d73',rapid:'#ffd34d',shield:'#5fc8ff',bomb:'#ff8a3c',chip:'#7ddc5a',crys:'#9ff0ff'},DLBL={heart:'صحة',rapid:'إطلاق سريع',shield:'درع',bomb:'قنبلة',chip:'تطوير',crys:'كريستال'};
  const TYPES={
    grunt:{r:9,hp:20,spd:52,dps:12,col:'#7ddc5a'},
    runner:{r:7,hp:11,spd:92,dps:9,col:'#ff6f9c'},
    tank:{r:15,hp:85,spd:33,dps:20,col:'#7d8a96'},
    spitter:{r:10,hp:28,spd:44,dps:10,col:'#b8c4cf',shoots:2.4},
    boss:{r:26,hp:520,spd:38,dps:28,col:'#b05cff',shoots:2.8,boss:true}
  };
  // enemy toughness grows gently; the weapon levels up with every wave so the two stay in step
  const hpMul=w=>1.1+0.25*(w-1)+0.02*(w-1)*(w-1);
  const wpn=w=>1+0.05*(w-1);
  // one boss per planet; the planet of a boss wave decides which one comes
  const BOSSES=[
    {kind:'golem',name:'حارس الفوهة',r:28,hp:680,spd:30,dps:30,col:'#9aa0aa'},
    {kind:'worm',name:'دودة الرمال',r:17,hp:560,spd:92,dps:26,col:'#d9773f'},
    {kind:'ice',name:'تنين الجليد',r:24,hp:600,spd:46,dps:24,col:'#8fd8ff'},
    {kind:'lava',name:'ملك الحمم',r:27,hp:640,spd:34,dps:30,col:'#ff7a2a'},
    {kind:'octo',name:'الطاغية الأخطبوطي',r:26,hp:600,spd:38,dps:28,col:'#b05cff'},
    {kind:'ship',name:'السفينة الأم',r:32,hp:720,spd:26,dps:30,col:'#c9d3dc'}
  ];
  const bossFor=w=>BOSSES[(w-1)%BOSSES.length];
  function spawnBoss(B){
    const x=W/2+(Math.random()-0.5)*160,y=-B.r-6,hp=B.hp*hpMul(wave);
    en.push({type:'boss',kind:B.kind,name:B.name,x,y,r:B.r,hp,max:hp,spd:B.spd,dps:B.dps*(1.2+Math.min(1.5,wave*0.05)),col:B.col,flash:0,oc:0,ph:Math.random()*9,boss:true,t1:2,t2:5,under:0,trail:[]});
  }
  // boss behaviour: movement plus its own attacks; returns the speed to move with this frame
  function bossAI(e,dt,dx,dy,d){
    e.t1-=dt;e.t2-=dt;const aim=Math.atan2(dy,dx);
    const shot=(a,s,dm,kind)=>eb.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,d:dm,l:4,k:kind||''});
    if(e.kind==='golem'){
      if(e.t1<=0){e.t1=3.2;hz.push({k:'shock',x:e.x,y:e.y,r:e.r,R:230,spd:150,dmg:16,hit:false,l:2});buzz(40);if((e.slams=(e.slams||0)+1)%2===0){spawn('grunt');spawn('grunt')}}
      return e.t1<0.5?0:e.spd}
    if(e.kind==='worm'){
      if(e.under>0){e.under-=dt;if(e.under<=0){hz.push({k:'shock',x:e.x,y:e.y,r:8,R:100,spd:170,dmg:18,hit:false,l:1});buzz(40)}return e.spd*1.9}
      if(e.t2<=0){e.t2=7;e.under=1.7}
      const w=Math.sin(t*5+e.ph)*0.9;e.x+=Math.cos(aim+1.57)*w*40*dt;e.y+=Math.sin(aim+1.57)*w*40*dt;return e.spd}
    if(e.kind==='ice'){
      if(e.t1<=0){e.t1=2.2;for(let k=-2;k<=2;k++)shot(aim+k*0.17,190,8,'ice')}
      return d<150?-e.spd*0.6:d>200?e.spd:0}
    if(e.kind==='lava'){
      if(e.t2<=0){e.t2=1.3;hz.push({k:'lava',x:e.x,y:e.y,r:20,l:5.5})}
      if(e.t1<=0){e.t1=3.4;for(let k=0;k<12;k++)shot(k*0.5236+t,125,11,'fire')}
      return e.spd}
    if(e.kind==='octo'){
      if(e.t1<=0){e.t1=2.8;for(let k=0;k<10;k++)shot(k*0.628+t,130,12)}
      if(e.t2<=0){e.t2=8;for(let k=0;k<3;k++)spawn('grunt')}
      return e.spd}
    // mothership: hangs back, fires aimed bursts and launches saucers
    if(e.t1<=0){e.t1=1.6;for(let k=-1;k<=1;k++)shot(aim+k*0.12,210,10)}
    if(e.t2<=0){e.t2=7;spawn('spitter');spawn('spitter')}
    return d<170?-e.spd*0.5:d>230?e.spd:0;
  }
  function drawBoss(e,a,tt){
    const x=e.x,y=e.y,r=e.r;ctx.lineCap='round';ctx.lineJoin='round';
    if(e.kind==='golem'){
      if(e.t1<0.5){ctx.strokeStyle=`rgba(255,170,90,${1-e.t1*2})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r+8+(0.5-e.t1)*20,0,6.283);ctx.stroke()}
      ctx.fillStyle='#6d7380';ctx.beginPath();for(let k=0;k<10;k++){const aa=k/10*6.283,rr=r*(k%2?0.86:1.06);k?ctx.lineTo(x+Math.cos(aa)*rr,y+Math.sin(aa)*rr):ctx.moveTo(x+Math.cos(aa)*rr,y+Math.sin(aa)*rr)}ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.arc(x-r*0.3,y-r*0.35,r*0.55,0,6.283);ctx.fill();
      ctx.strokeStyle=`rgba(255,150,60,${0.7+0.3*Math.sin(tt*5)})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-r*0.8,y);ctx.lineTo(x-r*0.4,y+r*0.3);ctx.lineTo(x-r*0.1,y+r*0.1);ctx.lineTo(x+r*0.3,y+r*0.5);ctx.moveTo(x+r*0.2,y-r*0.8);ctx.lineTo(x+r*0.5,y-r*0.3);ctx.lineTo(x+r*0.85,y-r*0.2);ctx.stroke();
      eyes(x,y,a,r*0.3,r*0.3,r*0.16,'#ffb347');
    }else if(e.kind==='worm'){
      const tr=e.trail;
      if(e.under>0){ctx.fillStyle='rgba(120,60,30,.8)';ctx.beginPath();ctx.ellipse(x,y,r*1.3,r*0.7,0,0,6.283);ctx.fill();ctx.fillStyle='rgba(200,130,80,.6)';for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(x+Math.cos(tt*9+k)*r,y+Math.sin(tt*7+k)*r*0.5,2,0,6.283);ctx.fill()}return}
      for(let k=tr.length-1;k>=0;k-=6){const s=tr[k],f=1-k/tr.length*0.55,sr=r*0.85*f;ctx.fillStyle=k%12<6?'#b85a2c':'#d9773f';ctx.beginPath();ctx.arc(s[0],s[1],sr,0,6.283);ctx.fill();ctx.strokeStyle='rgba(60,20,8,.5)';ctx.lineWidth=1.2;ctx.stroke()}
      ctx.strokeStyle='#f2d0a0';ctx.lineWidth=3;for(const s of [-1,1]){const ma=a+s*(0.45+0.25*Math.sin(tt*10));ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*0.6,y+Math.sin(a)*r*0.6);ctx.lineTo(x+Math.cos(ma)*r*1.45,y+Math.sin(ma)*r*1.45);ctx.stroke()}
      const gr=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);gr.addColorStop(0,'#f0a060');gr.addColorStop(1,'#a8461e');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
      ctx.fillStyle='#2a0a04';ctx.beginPath();ctx.arc(x+Math.cos(a)*r*0.45,y+Math.sin(a)*r*0.45,r*0.38,0,6.283);ctx.fill();
      eyes(x,y,a,-r*0.1,r*0.55,r*0.15,'#ffe14d');
    }else if(e.kind==='ice'){
      const fl=Math.sin(tt*6)*0.35;ctx.fillStyle='rgba(180,235,255,.75)';
      for(const s of [-1,1]){const wa=a+1.57*s,wx=x+Math.cos(wa)*r*0.5,wy=y+Math.sin(wa)*r*0.5;ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(x+Math.cos(wa-0.5*s+fl*s)*r*2,y+Math.sin(wa-0.5*s+fl*s)*r*2);ctx.lineTo(x+Math.cos(wa+0.6*s)*r*1.6,y+Math.sin(wa+0.6*s)*r*1.6);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke()}
      ctx.beginPath();ctx.moveTo(x-Math.cos(a)*r*0.8,y-Math.sin(a)*r*0.8);ctx.lineTo(x-Math.cos(a)*r*1.9+Math.cos(a+1.57)*Math.sin(tt*4)*6,y-Math.sin(a)*r*1.9+Math.sin(a+1.57)*Math.sin(tt*4)*6);ctx.strokeStyle='#8fd8ff';ctx.lineWidth=6;ctx.stroke();
      const gr=ctx.createLinearGradient(x-r,y-r,x+r,y+r);gr.addColorStop(0,'#e8fbff');gr.addColorStop(1,'#4aa8e0');ctx.fillStyle=gr;ctx.beginPath();for(let k=0;k<6;k++){const aa=a+k*1.047;ctx.lineTo(x+Math.cos(aa)*r*(k===0?1.25:0.95),y+Math.sin(aa)*r*(k===0?1.25:0.95))}ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      eyes(x,y,a,r*0.35,r*0.32,r*0.14,'#1b4f9c');
    }else if(e.kind==='lava'){
      for(let k=0;k<7;k++){const fa=-1.57+(k-3)*0.32,h=r*(0.5+0.25*Math.sin(tt*12+k*1.7));ctx.fillStyle=k%2?'#ffb347':'#ff5a1a';ctx.beginPath();ctx.moveTo(x+Math.cos(fa-0.12)*r*0.85,y+Math.sin(fa-0.12)*r*0.85);ctx.lineTo(x+Math.cos(fa)*(r+h),y+Math.sin(fa)*(r+h));ctx.lineTo(x+Math.cos(fa+0.12)*r*0.85,y+Math.sin(fa+0.12)*r*0.85);ctx.fill()}
      ctx.fillStyle='#2b1d18';ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
      const gr=ctx.createRadialGradient(x,y+r*0.15,1,x,y+r*0.15,r*0.75);gr.addColorStop(0,'#ffe08a');gr.addColorStop(0.5,'#ff6a1a');gr.addColorStop(1,'rgba(120,20,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y+r*0.15,r*0.75,0,6.283);ctx.fill();
      ctx.strokeStyle='#ff8a3c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-r*0.7,y-r*0.2);ctx.lineTo(x-r*0.3,y);ctx.moveTo(x+r*0.7,y-r*0.3);ctx.lineTo(x+r*0.35,y-r*0.05);ctx.stroke();
      eyes(x,y,a,r*0.2,r*0.38,r*0.16,'#ffd27a');
    }else if(e.kind==='ship'){
      const sp=tt*1.5;ctx.fillStyle='rgba(255,236,140,.12)';ctx.beginPath();ctx.ellipse(x,y+r*0.6,r*1.2,r*0.5,0,0,6.283);ctx.fill();
      const gr=ctx.createLinearGradient(x,y-r,x,y+r);gr.addColorStop(0,'#f2f6fa');gr.addColorStop(1,'#5d6b7a');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,y,r*1.6,r*0.62,0,0,6.283);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#3b4654';ctx.beginPath();ctx.ellipse(x,y+r*0.12,r*1.2,r*0.3,0,0,6.283);ctx.fill();
      for(let k=0;k<10;k++){const la=sp+k*0.628,lx=x+Math.cos(la)*r*1.35,ly=y+Math.sin(la)*r*0.45;if(Math.sin(la)<-0.2)continue;ctx.fillStyle=Math.floor(tt*6+k)%3?'#ff5d73':'#ffe14d';ctx.beginPath();ctx.arc(lx,ly,2.2,0,6.283);ctx.fill()}
      ctx.fillStyle='rgba(120,230,255,.85)';ctx.beginPath();ctx.ellipse(x,y-r*0.3,r*0.7,r*0.55,0,3.14,6.283);ctx.fill();
      ctx.fillStyle='#7ddc5a';ctx.beginPath();ctx.arc(x,y-r*0.42,r*0.25,0,6.283);ctx.fill();eyes(x,y-r*0.42,a,r*0.05,r*0.1,r*0.07,'#fff');
    }else{
      ctx.lineWidth=5;for(let k=0;k<8;k++){const ba=k/8*6.283+tt*0.4;ctx.strokeStyle='#6b2a8c';ctx.beginPath();ctx.moveTo(x+Math.cos(ba)*r*0.8,y+Math.sin(ba)*r*0.8);
        for(let j=1;j<=4;j++){const ra=r*(0.8+j*0.28),wa=ba+Math.sin(tt*3+k+j)*0.25*j/2;ctx.lineTo(x+Math.cos(wa)*ra,y+Math.sin(wa)*ra)}ctx.stroke()}
      const gr=ctx.createRadialGradient(x-r*0.35,y-r*0.35,2,x,y,r);gr.addColorStop(0,'#d58cff');gr.addColorStop(1,'#5a1f7a');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.15)';for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(x-r*0.5+k*r*0.25,y-r*0.55+Math.abs(k-2)*r*0.1,r*0.08,0,6.283);ctx.fill()}
      eyes(x,y,a,r*0.25,r*0.42,r*0.2,'#ffe14d');const ex=x+Math.cos(a)*r*0.5,ey=y+Math.sin(a)*r*0.5;ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.arc(ex,ey,r*0.17,0,6.283);ctx.fill();ctx.fillStyle='#0b0b14';ctx.beginPath();ctx.arc(ex+Math.cos(a)*r*0.06,ey+Math.sin(a)*r*0.06,r*0.09,0,6.283);ctx.fill();
    }
  }
  // permanent upgrades bought with crystals between runs
  const META=[
    {id:'hp',em:'🧑‍🚀',name:'بدلة معززة',d:'15 صحة إضافية في بداية كل جولة',max:5,base:25},
    {id:'dmg',em:'💥',name:'ليزر مطوّر',d:'زيادة دائمة 10% في الضرر',max:5,base:30},
    {id:'rate',em:'🔫',name:'مفاعل سريع',d:'زيادة دائمة 8% في سرعة الإطلاق',max:5,base:30},
    {id:'spd',em:'🚀',name:'محركات محسّنة',d:'زيادة دائمة 6% في سرعة الحركة',max:4,base:20},
    {id:'mag',em:'🧲',name:'مغناطيس دائم',d:'تجذب الأدوات من مسافة أبعد',max:3,base:15},
    {id:'luck',em:'🍀',name:'حظ المستكشف',d:'الكائنات تُسقط أدوات أكثر بنسبة 25%',max:3,base:35},
    {id:'shield',em:'🛡️',name:'درع الموجة',d:'درع 3 ثوانٍ في بداية كل موجة',max:3,base:40},
    {id:'moon',em:'🌑',name:'قمر مرافق',d:'تبدأ كل جولة ومعك قمر دوّار',max:1,base:120},
    {id:'choice',em:'🎴',name:'خيار رابع',d:'4 خيارات عند كل تطوير بدل 3',max:1,base:150},
    {id:'revive',em:'💖',name:'فرصة ثانية',d:'تنهض مرة واحدة في الجولة بنصف صحتك',max:1,base:200}
  ];
  const mlv=id=>(st.meta||{})[id]||0;
  const mcost=m=>m.base*(mlv(m.id)+1);
  function openLab(back){
    clearOverlays();const o=document.createElement('div');o.className='overlay picker lab';
    const draw=()=>{
      o.innerHTML='<h3 style="font-size:24px">🔬 مختبر المدار</h3><p></p><div class="upgrades"></div><button class="btn main" type="button">رجوع</button>';
      o.querySelector('p').textContent=`💎 ${st.crys||0} كريستالة · التطويرات هنا تبقى معك في كل الجولات`;
      const box=o.querySelector('.upgrades');
      META.forEach(m=>{const l=mlv(m.id),maxed=l>=m.max,c=mcost(m),b=document.createElement('button');b.type='button';b.className='upc';
        b.innerHTML='<span class="em"></span><span><b></b><small></small></span><i></i>';
        b.querySelector('.em').textContent=m.em;b.querySelector('b').textContent=`${m.name} ${l}/${m.max}`;b.querySelector('small').textContent=m.d;
        b.querySelector('i').textContent=maxed?'✓ مكتمل':'💎 '+c;b.disabled=maxed||(st.crys||0)<c;
        b.onclick=()=>{if(maxed||(st.crys||0)<c)return;st.crys-=c;st.meta=st.meta||{};st.meta[m.id]=l+1;gSave('survive',st);snd('ach');buzz([20,30,20]);
          if(META.every(x=>mlv(x.id)>=x.max))unlock('surv_lab');draw()};box.appendChild(b)});
      o.querySelector('.btn.main').onclick=()=>{o.remove();back()}};
    draw();stage.appendChild(o);o.scrollTop=0;
  }
  // planet surfaces, painted once per wave on an offscreen canvas at 2x; the planet changes every wave
  const BIOMES=[
    {name:'سطح القمر',base:'#8b8b8e',blots:['rgba(160,160,164,A)','rgba(96,96,100,A)','rgba(176,176,180,A)','rgba(110,110,114,A)'],craters:22,crCol:[120,120,124],rock:['#b4b4b8','#5a5a5e'],dots:['#d8d8dc'],vig:.55,amb:'sparkle'},
    {name:'المريخ',base:'#a9492a',blots:['rgba(196,98,56,A)','rgba(120,46,24,A)','rgba(214,128,80,A)','rgba(90,34,18,A)'],ripples:'rgba(80,24,8,.28)',craters:12,crCol:[150,62,34],rock:['#c4704a','#5e2412'],dots:[],vig:.5,amb:'dust'},
    {name:'يوروبا الجليدي',base:'#d3e4ec',blots:['rgba(255,255,255,A)','rgba(176,204,222,A)','rgba(236,244,248,A)','rgba(196,176,160,A)'],lineae:true,craters:5,crCol:[170,196,214],rock:['#9fb4c4','#5d7486'],dots:[],vig:.4,amb:'snow'},
    {name:'آيو البركاني',base:'#c9a239',blots:['rgba(226,196,90,A)','rgba(160,110,30,A)','rgba(240,226,160,A)','rgba(120,70,24,A)'],lava:true,craters:0,rock:['#6b4a1c','#1d140a'],dots:['#ff8a3c'],vig:.5,amb:'embers'},
    {name:'الكوكب الغريب',base:'#2a1d3f',blots:['rgba(76,44,110,A)','rgba(20,60,70,A)','rgba(110,50,120,A)','rgba(18,22,44,A)'],goo:true,flora:true,craters:0,rock:['#5a4a7a','#1c1530'],dots:['#5ff2d6','#ff7ad9'],vig:.6,amb:'spores'},
    {name:'حزام الكويكبات',base:'#05060f',space:true,craters:0,rock:['#8a817a','#2b2622'],dots:[],vig:.3,amb:'stars'}
  ];
  let bg=null,bgOld=null,bgFade=0,biome=0,amb=[];
  function makeBg(bi){
    const B=BIOMES[bi%BIOMES.length],S=2,c=document.createElement('canvas');c.width=W*S;c.height=H*S;const g=c.getContext('2d');g.scale(S,S);const R=Math.random;
    g.fillStyle=B.base;g.fillRect(0,0,W,H);
    const blot=(x,y,r,col,al)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col.replace('A',al));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()};
    if(B.space){
      // nebula clouds, star field and drifting asteroids
      for(let k=0;k<14;k++)blot(R()*W,R()*H,60+R()*110,['rgba(110,40,160,A)','rgba(30,70,170,A)','rgba(190,40,120,A)','rgba(20,120,150,A)'][k%4],0.18+R()*0.12);
      for(let k=0;k<420;k++){const b=R();g.fillStyle=`rgba(255,255,255,${0.2+b*0.8})`;g.beginPath();g.arc(R()*W,R()*H,b>0.97?1.4:b>0.85?0.9:0.5,0,6.283);g.fill()}
      for(let k=0;k<3;k++){const x=R()*W,y=R()*H;g.strokeStyle='rgba(200,220,255,.5)';g.lineWidth=0.6;g.beginPath();g.moveTo(x-5,y);g.lineTo(x+5,y);g.moveTo(x,y-5);g.lineTo(x,y+5);g.stroke()}
      for(let k=0;k<11;k++){const x=R()*W,y=R()*H,r=k<3?16+R()*14:5+R()*8,n=9,pts=[];for(let j=0;j<n;j++){const a=j/n*6.283,rr=r*(0.72+R()*0.35);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr])}
        const gr=g.createRadialGradient(x-r*0.4,y-r*0.4,r*0.1,x,y,r*1.1);gr.addColorStop(0,B.rock[0]);gr.addColorStop(1,B.rock[1]);g.fillStyle=gr;g.beginPath();pts.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.closePath();g.fill();
        for(let j=0;j<Math.max(1,r/6);j++){const cx=x+(R()-0.5)*r,cy=y+(R()-0.5)*r,cr=r*(0.12+R()*0.12);g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.arc(cx,cy,cr,0,6.283);g.fill()}}
      // a distant planet with a ring
      const px=W*(0.15+R()*0.7),py=H*(0.15+R()*0.7),pr=22+R()*14,pg=g.createRadialGradient(px-pr*0.4,py-pr*0.4,2,px,py,pr);pg.addColorStop(0,'#f2c48a');pg.addColorStop(1,'#7a4a2a');
      g.strokeStyle='rgba(230,200,160,.55)';g.lineWidth=3;g.beginPath();g.ellipse(px,py,pr*1.8,pr*0.45,-0.35,3.14,6.283);g.stroke();
      g.fillStyle=pg;g.beginPath();g.arc(px,py,pr,0,6.283);g.fill();
      g.beginPath();g.ellipse(px,py,pr*1.8,pr*0.45,-0.35,0,3.14);g.stroke();
      return c}
    for(let k=0;k<160;k++)blot(R()*W,R()*H,20+R()*60,B.blots[k%4],0.35+R()*0.3);
    if(B.ripples){g.strokeStyle=B.ripples;g.lineCap='round';for(let k=0;k<70;k++){const x=R()*W,y=R()*H,l=30+R()*70;g.lineWidth=1+R()*1.5;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y-6-R()*6,x+l,y);g.stroke()}}
    if(B.lineae){g.lineCap='round';for(let k=0;k<16;k++){let x=R()*W,y=R()*H,a=R()*6.28;g.strokeStyle=k%3?'rgba(160,96,70,.45)':'rgba(120,150,180,.5)';g.lineWidth=1+R()*2.5;g.beginPath();g.moveTo(x,y);for(let j=0;j<8;j++){a+=(R()-0.5)*0.5;x+=Math.cos(a)*30;y+=Math.sin(a)*30;g.lineTo(x,y)}g.stroke()}}
    if(B.lava){g.lineCap='round';g.lineJoin='round';
      for(let k=0;k<6;k++){const x=R()*W,y=R()*H,r=10+R()*16;blot(x,y,r*2.2,'rgba(40,20,10,A)',0.8);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'#ffe08a');gr.addColorStop(0.35,'#ff6a1a');gr.addColorStop(1,'rgba(60,10,0,.9)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}
      for(let k=0;k<7;k++){let x=R()*W,y=R()*H;const pts=[[x,y]];for(let j=0;j<6;j++){x+=(R()-0.5)*60;y+=(R()-0.5)*60;pts.push([x,y])}
        for(const [w,col,bl] of [[7,'rgba(255,90,20,.25)',10],[3,'#ff6a1a',6],[1.2,'#ffd27a',0]]){g.shadowColor='#ff5a00';g.shadowBlur=bl;g.strokeStyle=col;g.lineWidth=w;g.beginPath();pts.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.stroke()}}
      g.shadowBlur=0}
    if(B.goo)for(let k=0;k<6;k++){const x=R()*W,y=R()*H,rx=16+R()*30,ry=rx*(0.5+R()*0.3);g.shadowColor='#3fffd0';g.shadowBlur=12;
      const gr=g.createRadialGradient(x,y,1,x,y,rx);gr.addColorStop(0,'rgba(120,255,220,.85)');gr.addColorStop(1,'rgba(20,120,110,.7)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,R()*3,0,6.283);g.fill();g.shadowBlur=0}
    // craters: dark bowl, lit rim towards the top-left
    for(let k=0;k<(B.craters||0);k++){const x=R()*W,y=R()*H,r=k<3?14+R()*18:3+R()*8,[cr,cg,cb]=B.crCol;
      g.fillStyle=`rgba(${cr+50},${cg+50},${cb+50},.55)`;g.beginPath();g.ellipse(x-r*0.08,y-r*0.08,r*1.08,r*0.98,0,0,6.283);g.fill();
      const gr=g.createRadialGradient(x+r*0.25,y+r*0.25,r*0.1,x,y,r);gr.addColorStop(0,`rgba(${cr-40},${cg-40},${cb-40},.9)`);gr.addColorStop(1,`rgba(${cr-10},${cg-10},${cb-10},.9)`);g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*0.92,0,0,6.283);g.fill();
      g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;g.beginPath();g.arc(x,y,r,0.6,2.6);g.stroke()}
    if(B.flora)for(let k=0;k<26;k++){const x=R()*W,y=R()*H,c1=k%2?'#ff7ad9':'#5ff2d6';g.shadowColor=c1;g.shadowBlur=8;
      if(k%3===0){g.fillStyle='#3b2a55';g.fillRect(x-1,y-2,2,7);g.fillStyle=c1;g.beginPath();g.ellipse(x,y-3,5,3,0,3.14,6.283);g.fill()}
      else{g.strokeStyle=c1;g.lineWidth=1.2;for(let j=0;j<5;j++){const a=-2.6+j*0.5,l=5+R()*5;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*l*0.5,y+Math.sin(a)*l,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();g.fillStyle=c1;g.beginPath();g.arc(x+Math.cos(a)*l,y+Math.sin(a)*l,1.2,0,6.283);g.fill()}}
      g.shadowBlur=0}
    for(let k=0;k<26;k++){const x=R()*W,y=R()*H,r=k<4?5+R()*6:1.5+R()*3,sh=0.7+R()*0.3,rot=R()*3;
      g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x+r*0.25,y+r*0.45,r,r*sh,0,0,6.283);g.fill();
      const gr=g.createRadialGradient(x-r*0.35,y-r*0.35,r*0.1,x,y,r);gr.addColorStop(0,B.rock[0]);gr.addColorStop(1,B.rock[1]);g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*sh,rot,0,6.283);g.fill()}
    for(let k=0;k<45&&B.dots.length;k++){g.fillStyle=B.dots[k%B.dots.length];g.beginPath();g.arc(R()*W,R()*H,0.7+R()*0.8,0,6.283);g.fill()}
    const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${B.vig})`);g.fillStyle=v;g.fillRect(0,0,W,H);
    return c;
  }
  // ambient particles that give each planet its mood
  function makeAmb(bi){const k=BIOMES[bi%BIOMES.length].amb,R=Math.random;amb=[];
    const n={snow:60,embers:40,dust:34,spores:26,sparkle:24,stars:3}[k];
    for(let i=0;i<n;i++)amb.push({x:R()*W,y:R()*H,s:R(),ph:R()*6.28,vx:0})}
  function stepAmb(dt){const k=BIOMES[biome%BIOMES.length].amb;
    for(const a of amb){a.ph+=dt*(1+a.s);
      if(k==='snow'){a.y+=(14+a.s*24)*dt;a.x+=Math.sin(a.ph)*10*dt}
      else if(k==='embers'){a.y-=(14+a.s*26)*dt;a.x+=Math.sin(a.ph*1.3)*10*dt}
      else if(k==='dust'){a.x+=(70+a.s*100)*dt;a.y+=Math.sin(a.ph)*6*dt}
      else if(k==='stars'){a.x+=(-260-a.s*120)*dt;a.y+=(120+a.s*60)*dt;if(a.x<-40||a.y>H+40){a.x=W+20+Math.random()*W;a.y=-20-Math.random()*H*0.5}continue}
      else if(k==='sparkle'){continue}
      else{a.x+=Math.cos(a.ph*0.7)*10*dt;a.y+=Math.sin(a.ph)*8*dt}
      if(a.y>H+5)a.y=-5;if(a.y<-5)a.y=H+5;if(a.x>W+5)a.x=-5;if(a.x<-5)a.x=W+5}}
  function drawAmb(){const k=BIOMES[biome%BIOMES.length].amb;
    for(const a of amb){
      if(k==='snow'){ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(a.x,a.y,0.8+a.s*1.3,0,6.283);ctx.fill()}
      else if(k==='embers'){ctx.fillStyle=`rgba(255,${120+a.s*100|0},40,${0.5+0.5*Math.sin(a.ph*3)**2})`;ctx.beginPath();ctx.arc(a.x,a.y,1+a.s,0,6.283);ctx.fill()}
      else if(k==='dust'){ctx.strokeStyle='rgba(255,190,150,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-8-a.s*10,a.y);ctx.stroke()}
      else if(k==='stars'){ctx.strokeStyle='rgba(255,240,210,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+26,a.y-12);ctx.stroke()}
      else if(k==='sparkle'){const al=Math.max(0,Math.sin(a.ph*2))**4;ctx.fillStyle=`rgba(255,255,255,${al})`;ctx.fillRect(a.x-0.6,a.y-2,1.2,4);ctx.fillRect(a.x-2,a.y-0.6,4,1.2)}
      else{const al=Math.max(0,Math.sin(a.ph*1.5)),c=a.s>0.5?'95,242,214':'255,122,217';ctx.fillStyle=`rgba(${c},${al})`;ctx.beginPath();ctx.arc(a.x,a.y,1.6,0,6.283);ctx.fill();ctx.fillStyle=`rgba(${c},${al*0.2})`;ctx.beginPath();ctx.arc(a.x,a.y,5,0,6.283);ctx.fill()}}}
  function setBiome(bi,fade){biome=bi;if(fade&&bg){bgOld=bg;bgFade=1.2}else bgOld=null;bg=makeBg(bi);makeAmb(bi)}
  // aliens: each type has its own look, eyes always track the astronaut
  function eyes(x,y,a,off,sp,r,col){for(const s of [-1,1]){const ex=x+Math.cos(a)*off+Math.cos(a+1.57)*sp*s,ey=y+Math.sin(a)*off+Math.sin(a+1.57)*sp*s;
    ctx.fillStyle=col||'#fff';ctx.beginPath();ctx.arc(ex,ey,r,0,6.283);ctx.fill();ctx.fillStyle='#0b0b14';ctx.beginPath();ctx.arc(ex+Math.cos(a)*r*0.35,ey+Math.sin(a)*r*0.35,r*0.55,0,6.283);ctx.fill()}}
  function drawAlien(e){
    const a=Math.atan2(p.y-e.y,p.x-e.x),r=e.r,x=e.x,y=e.y,tt=t+e.ph;ctx.lineCap='round';
    if(e.type==='grunt'){ // little green alien with antennae and big almond eyes
      ctx.strokeStyle='#4f9c38';ctx.lineWidth=1.4;for(const s of [-1,1]){const bx=x-Math.cos(a)*r*0.5+Math.cos(a+1.57)*r*0.45*s,by=y-Math.sin(a)*r*0.5+Math.sin(a+1.57)*r*0.45*s,tx=bx-Math.cos(a+0.5*s)*r*0.9,ty=by-Math.sin(a+0.5*s)*r*0.9+Math.sin(tt*6)*1.2;
        ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.stroke();ctx.fillStyle='#d6ff7a';ctx.beginPath();ctx.arc(tx,ty,1.8,0,6.283);ctx.fill()}
      const gr=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);gr.addColorStop(0,'#b4f28a');gr.addColorStop(1,'#4f9c38');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
      for(const s of [-1,1]){const ex=x+Math.cos(a)*r*0.3+Math.cos(a+1.57)*r*0.38*s,ey=y+Math.sin(a)*r*0.3+Math.sin(a+1.57)*r*0.38*s;ctx.fillStyle='#0b0b14';ctx.beginPath();ctx.ellipse(ex,ey,r*0.36,r*0.22,a+0.5*s,0,6.283);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-1,ey-1,1,0,6.283);ctx.fill()}
    }else if(e.type==='runner'){ // fast crawler with scuttling legs
      ctx.strokeStyle='#a8325a';ctx.lineWidth=1.6;for(let k=0;k<6;k++){const la=a+1.57*(k<3?1:-1)+((k%3)-1)*0.6,w=Math.sin(tt*22+k)*0.35;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(la+w)*r*1.7,y+Math.sin(la+w)*r*1.7);ctx.stroke()}
      const gr=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);gr.addColorStop(0,'#ff9cc0');gr.addColorStop(1,'#d23c6e');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,y,r*1.15,r*0.9,a,0,6.283);ctx.fill();
      eyes(x,y,a,r*0.45,r*0.3,r*0.28,'#ffe14d');
    }else if(e.type==='tank'){ // rock golem with glowing cracks and a single eye
      ctx.fillStyle='#55606b';ctx.beginPath();for(let k=0;k<8;k++){const aa=k/8*6.283+0.2,rr=r*(k%2?0.9:1.08);k?ctx.lineTo(x+Math.cos(aa)*rr,y+Math.sin(aa)*rr):ctx.moveTo(x+Math.cos(aa)*rr,y+Math.sin(aa)*rr)}ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(x-r*0.3,y-r*0.3,r*0.55,0,6.283);ctx.fill();
      ctx.strokeStyle=`rgba(95,242,214,${0.6+0.4*Math.sin(tt*4)})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-r*0.7,y+r*0.1);ctx.lineTo(x-r*0.3,y+r*0.4);ctx.lineTo(x,y+r*0.2);ctx.moveTo(x+r*0.4,y-r*0.6);ctx.lineTo(x+r*0.6,y-r*0.1);ctx.stroke();
      const ex=x+Math.cos(a)*r*0.35,ey=y+Math.sin(a)*r*0.35;ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.arc(ex,ey,r*0.3,0,6.283);ctx.fill();ctx.fillStyle='#200';ctx.beginPath();ctx.ellipse(ex+Math.cos(a)*r*0.08,ey+Math.sin(a)*r*0.08,r*0.08,r*0.22,a,0,6.283);ctx.fill();
    }else if(e.type==='spitter'){ // flying saucer with a glass dome and blinking lights
      const hy=y-3+Math.sin(tt*3)*1.5,gr=ctx.createLinearGradient(x,hy-r,x,hy+r);gr.addColorStop(0,'#e6edf3');gr.addColorStop(1,'#6b7a88');
      ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,hy,r*1.45,r*0.62,0,0,6.283);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle='rgba(120,230,255,.85)';ctx.beginPath();ctx.ellipse(x,hy-r*0.25,r*0.62,r*0.5,0,3.14,6.283);ctx.fill();
      ctx.fillStyle='#4f9c38';ctx.beginPath();ctx.arc(x,hy-r*0.35,r*0.22,0,6.283);ctx.fill();
      for(let k=0;k<5;k++){const on=Math.floor(tt*8+k)%5===0;ctx.fillStyle=on?'#ffe14d':'#a35';ctx.beginPath();ctx.arc(x+(k-2)*r*0.55,hy+r*0.2,1.4,0,6.283);ctx.fill()}
    }else drawBoss(e,a,tt);
    if(e.flash>0){ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(x,y,r*1.05,0,6.283);ctx.fill()}
  }
  function drawAstronaut(){
    const x=p.x,y=p.y,r=p.r,a=p.aim;
    ctx.fillStyle='#9aa7b3';ctx.beginPath();ctx.ellipse(x-Math.cos(a)*r*0.8,y-Math.sin(a)*r*0.8,r*0.75,r*0.55,a,0,6.283);ctx.fill();ctx.strokeStyle='#0b1618';ctx.lineWidth=1.5;ctx.stroke();
    ctx.strokeStyle='#3a4652';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*18,y+Math.sin(a)*18);ctx.stroke();
    ctx.strokeStyle='#5ff2d6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*10,y+Math.sin(a)*10);ctx.lineTo(x+Math.cos(a)*18,y+Math.sin(a)*18);ctx.stroke();
    const gr=ctx.createRadialGradient(x-r*0.35,y-r*0.35,1,x,y,r);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,p.hurt>0?'#ff8a8a':'#c9d3dc');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();ctx.strokeStyle='#0b1618';ctx.lineWidth=1.8;ctx.stroke();
    const vx=x+Math.cos(a)*r*0.38,vy=y+Math.sin(a)*r*0.38,vg=ctx.createLinearGradient(vx-r*0.5,vy-r*0.5,vx+r*0.5,vy+r*0.5);const VC=(CHARS[st.char]||CHARS.scout).visor;vg.addColorStop(0,VC[0]);vg.addColorStop(1,VC[1]);
    ctx.fillStyle=vg;ctx.beginPath();ctx.ellipse(vx,vy,r*0.55,r*0.42,a,0,6.283);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(vx-r*0.15,vy-r*0.15,r*0.18,r*0.08,a-0.6,0,6.283);ctx.fill();
  }
  const shadow=(x,y,r)=>{ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(x+r*0.15,y+r*0.75,r*0.95,r*0.42,0,0,6.283);ctx.fill()};
  function resize(){const w=stage.clientWidth;cv.width=Math.round(w*devicePixelRatio);cv.height=Math.round(w*H/W*devicePixelRatio);cv.style.height=(w*H/W)+'px';ctx.setTransform(w/W*devicePixelRatio,0,0,w/W*devicePixelRatio,0,0)}
  function reset(){
    const C=CHARS[st.char]||CHARS.scout,mx=Math.round((100+15*mlv('hp'))*C.hp);
    p={x:W/2,y:H/2,r:11,hp:mx,max:mx,spd:120*(1+0.06*mlv('spd'))*C.spd,mag:40+20*mlv('mag'),aim:-Math.PI/2,hurt:0,slow:0,inv:0,bar:0,barT:0,rev:mlv('revive')};
    gun={dmg:10*(1+0.1*mlv('dmg'))*C.dmg,rate:2.2*(1+0.08*mlv('rate'))*C.rate,count:1,pierce:0,spd:380,cd:0};orb=mlv('moon');pul=0;mis=0;drn=0;evo={};misT=1;drnT=0.5;novaT=3;bhT=4;holes=[];ms=[];mines=[];bolts=[];flT=0;chT=1;mnT=1;beamTg=null;orbA=0;pulseT=3;
    en=[];bl=[];eb=[];drops=[];parts=[];rings=[];hz=[];crys=0;bossKills=0;t=0;wave=1;waveT=0;spawnT=0.6;kills=0;
    buff={rapid:0,shield:3*mlv('shield')};banner={txt:'الموجة 1',sub:BIOMES[0].name,t:2.2};lv={};bossAlive=false;recordShown=false;over=false;
  }
  function spawn(type){
    const T=TYPES[type],side=Math.floor(Math.random()*4),m=T.r+4;
    let x,y;if(side===0){x=Math.random()*W;y=-m}else if(side===1){x=W+m;y=Math.random()*H}else if(side===2){x=Math.random()*W;y=H+m}else{x=-m;y=Math.random()*H}
    // from wave 3 some aliens are elite: bigger, three times tougher, harder hitting, and they drop more
    const elite=type!=='boss'&&wave>=3&&Math.random()<Math.min(0.25,0.03*wave),hp=T.hp*hpMul(wave)*(elite?3:1);
    en.push({type,x,y,r:T.r*(elite?1.35:1),elite,hp,max:hp,spd:T.spd*(1+Math.min(0.8,wave*0.04))*(0.9+Math.random()*0.2),dps:T.dps*(1.05+Math.min(2.5,wave*0.08))*(elite?1.5:1),col:T.col,shoot:T.shoots?T.shoots*(0.5+Math.random()):0,flash:0,oc:0,ph:Math.random()*9,boss:!!T.boss});
  }
  function pickType(){const r=Math.random();
    if(wave>=3&&r<0.15)return 'spitter';if(wave>=2&&r<0.32)return 'tank';if(r<(wave>=2?0.6:0.1))return 'runner';return 'grunt'}
  function startWave(){
    setBiome(wave-1,true);
    const boss=wave%5===0?bossFor(wave):null;
    banner={txt:boss?'الموجة '+wave+' · زعيم قادم!':'الموجة '+wave,sub:boss?boss.name+' · '+BIOMES[(wave-1)%BIOMES.length].name:BIOMES[(wave-1)%BIOMES.length].name,t:2.6};
    buff.shield=Math.max(buff.shield,3*mlv('shield'));
    if(boss){for(let k=0;k<Math.floor(wave/30)+1;k++)spawnBoss(boss);bossAlive=true;snd('err')}
  }
  function avail(){return UP.filter(u=>(lv[u.id]||0)<u.max)}
  function applyUp(u){lv[u.id]=(lv[u.id]||0)+1;u.apply()}
  function chooseUpgrade(){
    let opts=shuffle(avail().slice(),Math.random).slice(0,3+mlv('choice'));
    const ready=EVO.filter(x=>!evo[x.id]&&Object.entries(x.need).every(([k,v])=>(lv[k]||0)>=v));
    if(ready.length){const x=ready[0];opts=[{id:x.id,em:x.em,name:'✨ دمج: '+x.name,d:x.d,max:1,evo:true,apply:()=>{evo[x.id]=1;unlock('surv_evo')}}].concat(opts.slice(0,Math.max(1,opts.length-1)))}
    if(!opts.length){p.hp=p.max;wave++;startWave();return}
    paused=true;const o=document.createElement('div');o.className='overlay';
    o.innerHTML='<h3 style="font-size:24px"></h3><p></p><div class="upgrades"></div>';
    o.querySelector('h3').textContent='أنهيت الموجة '+wave+' 🎉';o.querySelector('p').textContent='👾 الأعداء صاروا أقوى ×'+hpMul(wave+1).toFixed(1)+' · اختر تطويراً واحداً';
    const box=o.querySelector('.upgrades');
    opts.forEach(u=>{const b=document.createElement('button');b.type='button';b.className='upc';
      b.innerHTML='<span class="em"></span><span><b></b><small></small></span><i></i>';if(u.evo)b.classList.add('evo');
      b.querySelector('.em').textContent=u.em;b.querySelector('b').textContent=u.name;b.querySelector('small').textContent=u.d;
      b.querySelector('i').textContent=u.evo?'سلاح خارق':(lv[u.id]||0)+1+'/'+u.max;
      b.onclick=()=>{if(u.evo)u.apply();else applyUp(u);snd('ok');o.remove();wave++;startWave();paused=false;last=performance.now()};box.appendChild(b)});
    stage.appendChild(o);snd('win');buzz([20,30,40]);
  }
  function nearest(){let b=null,bd=1e9;for(const e of en){if(e.under>0)continue;if(e.x<-5||e.x>W+5||e.y<-5||e.y>H+5)continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;b=e}}return b}
  function hurt(e,d){e.hp-=d;e.flash=0.08;if(e.hp<=0&&!e.dead)kill(e)}
  function kill(e){
    e.dead=true;kills++;st.totalKills=(st.totalKills||0)+1;
    for(let k=0;k<(e.boss?24:7);k++){const a=Math.random()*6.28,s=40+Math.random()*120;parts.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0.5,col:e.col})}
    const now=performance.now();if(now-hitSndT>90){snd('hit');hitSndT=now}
    if(e.boss){drop(e.x-12,e.y,'chip');drop(e.x+12,e.y,'chip');drop(e.x,e.y+12,'heart');unlock('surv_boss');bossAlive=en.some(x=>x.boss&&!x.dead);
      bossKills++;crys+=20;toast('👑 هزمت '+(e.name||'الزعيم')+' · 💎 +20','ach');st.bossDone=st.bossDone||{};if(e.kind)st.bossDone[e.kind]=1;gSave('survive',st);if(BOSSES.every(B=>st.bossDone[B.kind]))unlock('surv_all_boss')}
    else if(e.elite){drop(e.x,e.y,Math.random()<0.5?'crys':['heart','rapid','shield','chip'][Math.floor(Math.random()*4)])}
    else if(Math.random()<0.035*(1+0.25*mlv('luck')))drop(e.x,e.y,'crys');
    else if(Math.random()<0.075*(1+0.25*mlv('luck'))){const r=Math.random();drop(e.x,e.y,r<0.4?'heart':r<0.6?'rapid':r<0.75?'shield':r<0.85?'bomb':'chip')}
  }
  function drop(x,y,k){drops.push({x:Math.max(12,Math.min(W-12,x)),y:Math.max(30,Math.min(H-12,y)),k,life:12})}
  function take(d){
    if(d.k==='heart'){p.hp=Math.min(p.max,p.hp+30);toast('❤️ صحة إضافية 30')}
    else if(d.k==='rapid'){buff.rapid=8;toast('⚡ إطلاق مضاعف 8 ثوانٍ')}
    else if(d.k==='shield'){buff.shield=6;toast('🛡️ درع 6 ثوانٍ')}
    else if(d.k==='bomb'){rings.push({x:p.x,y:p.y,r:0,R:Math.max(W,H),l:0.5});en.forEach(e=>{if(!e.dead)hurt(e,e.boss?150:9999)});buzz(80);toast('💣 انفجار!')}
    else if(d.k==='crys'){crys+=5}
    else{const a=avail();if(a.length){const u=a[Math.floor(Math.random()*a.length)];applyUp(u);toast('⬆️ تطوير: '+u.name)}else{p.hp=p.max}}
    snd('ok');
  }
  function hitP(d){if(buff.shield>0||p.inv>0)return false;
    if(p.bar){p.bar=0;p.barT=Math.max(4,12-2*(lv.barrier||0));p.inv=0.8;rings.push({x:p.x,y:p.y,r:0,R:42,l:0.3});snd('rot');buzz(20);return false}
    p.hp-=d*(1-Math.min(0.5,0.1*(lv.armor||0)));p.hurt=0.15;feel();return true}
  function update(dt){
    t+=dt;waveT+=dt;
    // movement: joystick or keyboard
    let mx=0,my=0;
    if(joy){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,L=Math.hypot(dx,dy);if(L>4){const k=Math.min(1,L/40);mx=dx/L*k;my=dy/L*k}}
    if(keys.ArrowLeft||keys.a)mx-=1;if(keys.ArrowRight||keys.d)mx+=1;if(keys.ArrowUp||keys.w)my-=1;if(keys.ArrowDown||keys.s)my+=1;
    const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml}
    const ps=p.spd*(p.slow>0?0.5:1);p.x=Math.max(p.r,Math.min(W-p.r,p.x+mx*ps*dt));p.y=Math.max(p.r,Math.min(H-p.r,p.y+my*ps*dt));
    // spawning
    spawnT-=dt;
    if(spawnT<=0&&en.length<130){const n=1+Math.floor(wave/3);for(let k=0;k<n;k++)spawn(pickType());spawnT=Math.max(0.22,0.95-0.07*wave)}
    // gun
    gun.cd-=dt*(buff.rapid>0?2:1);const tg=nearest();
    if(tg)p.aim=Math.atan2(tg.y-p.y,tg.x-p.x);
    if(gun.cd<=0&&tg){gun.cd=1/gun.rate;const n=gun.count,spr=0.16;
      for(let k=0;k<n;k++){const a=p.aim+(k-(n-1)/2)*spr;bl.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,vx:Math.cos(a)*gun.spd,vy:Math.sin(a)*gun.spd,pierce:gun.pierce,hit:new Set(),l:1.2})}}
    for(const b of bl){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;
      for(const e of en){if(e.dead||e.under>0||b.hit.has(e))continue;if((e.x-b.x)**2+(e.y-b.y)**2<(e.r+3)**2){b.hit.add(e);hurt(e,gun.dmg*wpn(wave));e.x+=b.vx*0.012;e.y+=b.vy*0.012;if(b.pierce--<=0){b.l=0;break}}}}
    // orbit blades
    orbA+=3.2*dt;
    if(orb){const R=48;for(let k=0;k<orb;k++){const a=orbA+k*6.283/orb,bx=p.x+Math.cos(a)*R,by=p.y+Math.sin(a)*R;
      for(const e of en)if(!e.dead&&!(e.under>0)&&e.oc<=0&&(e.x-bx)**2+(e.y-by)**2<(e.r+8)**2){hurt(e,(10+4*orb+gun.dmg*0.4)*wpn(wave));e.oc=0.35}}}
    // shock pulse
    if(pul){pulseT-=dt;if(pulseT<=0){pulseT=Math.max(1.4,4.2-0.5*pul);const R=70+18*pul,dmg=(18+10*pul)*wpn(wave);rings.push({x:p.x,y:p.y,r:0,R,l:0.35});
      for(const e of en){if(e.dead||e.under>0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d<R+e.r){hurt(e,dmg);if(!e.boss&&d>0){e.x+=dx/d*28;e.y+=dy/d*28}}}}}
    // homing missiles (and, with the swarm fusion, from every drone too)
    if(mis){misT-=dt;if(misT<=0){misT=Math.max(0.9,2.4-0.25*mis);const srcs=[[p.x,p.y]];if(evo.swarm)for(let k=0;k<drn;k++){const a=orbA*0.6+k*6.283/drn;srcs.push([p.x+Math.cos(a)*30,p.y+Math.sin(a)*30])}
      const live=en.filter(e=>!e.dead&&!(e.under>0));if(live.length)srcs.forEach(([sx,sy])=>{for(let k=0;k<mis;k++){const tg=live[Math.floor(Math.random()*live.length)];const a=Math.atan2(tg.y-sy,tg.x-sx)+(Math.random()-0.5)*1.4;ms.push({x:sx,y:sy,vx:Math.cos(a)*150,vy:Math.sin(a)*150,tg,l:3})}})}}
    for(const m of ms){if(!m.tg||m.tg.dead){m.tg=nearest()}if(m.tg){const dx=m.tg.x-m.x,dy=m.tg.y-m.y,d=Math.hypot(dx,dy)||1;m.vx+=dx/d*620*dt;m.vy+=dy/d*620*dt}
      const sp=Math.hypot(m.vx,m.vy);if(sp>260){m.vx*=260/sp;m.vy*=260/sp}m.x+=m.vx*dt;m.y+=m.vy*dt;m.l-=dt;if(Math.random()<0.6)parts.push({x:m.x,y:m.y,vx:0,vy:0,l:0.25,col:'#ffb347'});
      if(m.tg&&(m.tg.x-m.x)**2+(m.tg.y-m.y)**2<(m.tg.r+4)**2){m.l=0;rings.push({x:m.x,y:m.y,r:0,R:34,l:0.25});for(const e of en)if(!e.dead&&(e.x-m.x)**2+(e.y-m.y)**2<(34+e.r)**2)hurt(e,22*wpn(wave))}}
    ms=ms.filter(m=>m.l>0);
    // drones circle you and shoot the nearest alien
    if(drn){drnT-=dt;if(drnT<=0){drnT=0.55;const tg=nearest();if(tg)for(let k=0;k<drn;k++){const a=orbA*0.6+k*6.283/drn,dx0=p.x+Math.cos(a)*30,dy0=p.y+Math.sin(a)*30,aa=Math.atan2(tg.y-dy0,tg.x-dx0);
      bl.push({x:dx0,y:dy0,vx:Math.cos(aa)*360,vy:Math.sin(aa)*360,pierce:0,hit:new Set(),l:1,dr:1})}}}
    // continuous beam on the nearest alien in range
    beamTg=null;if(lv.beam){const tg=nearest();if(tg&&Math.hypot(tg.x-p.x,tg.y-p.y)<170+15*lv.beam){beamTg=tg;hurt(tg,(12+9*lv.beam)*wpn(wave)*dt)}}
    // flamethrower: short cone in the aiming direction
    if(lv.flame){flT-=dt;if(flT<=0){flT=0.12;const R=62+8*lv.flame;for(const e of en){if(e.dead||e.under>0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d<R+e.r){let da=Math.abs(Math.atan2(dy,dx)-p.aim);if(da>Math.PI)da=2*Math.PI-da;if(da<0.5)hurt(e,(2+1.6*lv.flame)*wpn(wave))}}
      for(let k=0;k<3;k++){const a=p.aim+(Math.random()-0.5)*0.8,sp=160+Math.random()*120;parts.push({x:p.x+Math.cos(p.aim)*14,y:p.y+Math.sin(p.aim)*14,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:0.3,col:Math.random()<0.5?'#ffb347':'#ff5a1a'})}}}
    // chain lightning jumps between aliens
    if(lv.chain){chT-=dt;if(chT<=0){chT=Math.max(0.7,1.9-0.22*lv.chain);let cur=nearest();if(cur&&Math.hypot(cur.x-p.x,cur.y-p.y)<220){const pts=[[p.x,p.y]],hit=new Set();
      for(let k=0;k<2+lv.chain&&cur;k++){pts.push([cur.x,cur.y]);hit.add(cur);hurt(cur,(14+7*lv.chain)*wpn(wave));let nx=null,nd=95;for(const e of en){if(e.dead||hit.has(e)||e.under>0)continue;const d=Math.hypot(e.x-cur.x,e.y-cur.y);if(d<nd){nd=d;nx=e}}cur=nx}
      bolts.push({pts,l:0.18});snd('hit')}}}
    bolts.forEach(b=>b.l-=dt);bolts=bolts.filter(b=>b.l>0);
    // space mines left behind you
    if(lv.mines){mnT-=dt;if(mnT<=0){mnT=Math.max(1,2.3-0.3*lv.mines);mines.push({x:p.x,y:p.y,arm:0.6,l:14})}}
    for(const m of mines){m.arm-=dt;m.l-=dt;if(m.arm>0)continue;if(en.some(e=>!e.dead&&!(e.under>0)&&(e.x-m.x)**2+(e.y-m.y)**2<(22+e.r)**2)){m.l=0;rings.push({x:m.x,y:m.y,r:0,R:48,l:0.3});for(let k=0;k<10;k++){const a=Math.random()*6.28;parts.push({x:m.x,y:m.y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,l:0.35,col:'#ff8a3c'})}
      for(const e of en)if(!e.dead&&(e.x-m.x)**2+(e.y-m.y)**2<(48+e.r)**2)hurt(e,(40+16*(lv.mines||1))*wpn(wave))}}
    mines=mines.filter(m=>m.l>0);
    // fusion weapons
    if(evo.nova){novaT-=dt;if(novaT<=0){novaT=3;for(let k=0;k<16;k++){const a=k*0.3927;bl.push({x:p.x,y:p.y,vx:Math.cos(a)*340,vy:Math.sin(a)*340,pierce:2,hit:new Set(),l:1.1,nova:1})}snd('hit')}}
    if(evo.blackhole){bhT-=dt;if(bhT<=0){bhT=6;const tg=nearest();if(tg)holes.push({x:tg.x,y:tg.y,l:3.2})}
      for(const h of holes){h.l-=dt;for(const e of en){if(e.dead||e.under>0)continue;const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;if(d<110){if(!e.boss){e.x+=dx/d*Math.min(d,90*dt);e.y+=dy/d*Math.min(d,90*dt)}if(d<40)hurt(e,30*wpn(wave)*dt)}}}
      holes=holes.filter(h=>h.l>0)}
    // enemies
    const shielded=buff.shield>0;let touching=0;
    for(const e of en){if(e.dead)continue;e.flash-=dt;e.oc-=dt;
      const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
      let sp=e.spd;if(e.type==='spitter'&&d<140)sp=-e.spd*0.5;if(e.boss)sp=bossAI(e,dt,dx,dy,d);
      e.x+=dx/d*sp*dt;e.y+=dy/d*sp*dt;
      if(e.boss&&e.y>e.r){e.x=Math.max(e.r,Math.min(W-e.r,e.x));e.y=Math.min(H-e.r,e.y)}
      if(e.kind==='worm'){e.trail.unshift([e.x,e.y]);if(e.trail.length>60)e.trail.pop();
        if(!(e.under>0))for(let k=6;k<e.trail.length;k+=6){const sg=e.trail[k];if((sg[0]-p.x)**2+(sg[1]-p.y)**2<(e.r*0.8+p.r)**2){touching+=e.dps*0.5;break}}}
      if(e.under>0)continue;
      if(e.shoot){e.shoot-=dt;if(e.shoot<=0&&d<320){e.shoot=TYPES[e.type].shoots;
        if(e.boss){for(let k=0;k<10;k++){const a=k*0.628+t;eb.push({x:e.x,y:e.y,vx:Math.cos(a)*130,vy:Math.sin(a)*130,d:12,l:4})}}
        else eb.push({x:e.x,y:e.y,vx:dx/d*170,vy:dy/d*170,d:9,l:3})}}
      if(d<e.r+p.r){touching+=e.dps}}
    // keep enemies from stacking into one blob
    for(let i=0;i<en.length;i++){const a=en[i];if(a.dead)continue;for(let j=i+1;j<en.length;j++){const b=en[j];if(b.dead)continue;
      const dx=b.x-a.x,dy=b.y-a.y,m=a.r+b.r;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;const d=Math.hypot(dx,dy);if(d<m&&d>0.01){const push=(m-d)/2,ux=dx/d,uy=dy/d,wa=a.boss?0.1:1,wb=b.boss?0.1:1;a.x-=ux*push*wa;a.y-=uy*push*wa;b.x+=ux*push*wb;b.y+=uy*push*wb}}}
    for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if((b.x-p.x)**2+(b.y-p.y)**2<(p.r+4)**2){b.l=0;if(hitP(b.d)){if(b.k==='ice'){if(p.slow<=0)toast('🧊 تجمّدت قليلاً!');p.slow=1.6}}}}
    // boss hazards: lava pools burn while you stand in them, shock rings hit once as they pass
    for(const h of hz){h.l-=dt;const hd=Math.hypot(p.x-h.x,p.y-h.y);
      if(h.k==='lava'){if(hd<h.r+p.r*0.5)hitP(18*dt)}
      else{h.r+=h.spd*dt;if(h.r>h.R)h.l=0;else if(!h.hit&&Math.abs(hd-h.r)<10){h.hit=true;hitP(h.dmg)}}}
    hz=hz.filter(h=>h.l>0);p.slow-=dt;
    if(touching)hitP(touching*dt);
    p.inv-=dt;if(lv.barrier&&!p.bar){p.barT-=dt;if(p.barT<=0)p.bar=1}
    if(lv.regen)p.hp=Math.min(p.max,p.hp+0.9*lv.regen*dt);
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
    if(p.hp<=0&&p.rev){p.rev=0;p.hp=p.max/2;buff.shield=3;rings.push({x:p.x,y:p.y,r:0,R:160,l:0.5});en.forEach(e=>{if(e.dead||e.boss)return;const dx=e.x-p.x,dy=e.y-p.y,dd=Math.hypot(dx,dy)||1;if(dd<160){e.x+=dx/dd*60;e.y+=dy/dd*60}});eb=[];snd('ach');toast('💖 فرصة ثانية! نهضت من جديد','ach')}
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
    const earned=crys+Math.floor(kills/5)+wave*2;st.crys=(st.crys||0)+earned;gSave('survive',st);
    addXP(Math.floor(t/6)+bossKills*15);mission('survive',{time:t});
    snd('err');buzz([40,40,80]);
    const show=()=>{const o=document.createElement('div');o.className='overlay';
      o.innerHTML='<h3></h3><p></p><p class="gain"></p><button class="btn main" type="button">جولة جديدة</button><button class="btn" type="button">🔬 مختبر المدار</button><button class="btn" type="button">رجوع إلى القاعة</button><button class="btn share" type="button">📤 مشاركة النتيجة</button>';
      o.querySelector('h3').textContent=rec?'رقم قياسي جديد! 🏆':'سقط رائد الفضاء';o.querySelector('.share').onclick=()=>shareResult({game:'صمود المدار',title:'صمدت '+fmtTime(t),text:`الموجة ${wave} · ${kills} كائن`});
      o.querySelector('p').textContent=`صمدت ${fmtTime(t)} · الموجة ${wave} · ${kills} عدو`+(rec?'':` · رقمك القياسي ${fmtTime(st.bestTime)}`);
      o.querySelector('.gain').textContent=`💎 +${earned} كريستالة · رصيدك ${st.crys}`;
      const [b1,b2,b3]=o.querySelectorAll('button:not(.share)');b1.onclick=()=>begin();b2.onclick=()=>openLab(show);b3.onclick=()=>{o.remove();goHub()};stage.appendChild(o)};
    setTimeout(show,400);
  }
  function stats(){setStat('s1',fmtTime(t));setStat('s2',wave);setStat('s3',kills);setStat('s4',fmtTime(Math.max(st.bestTime||0,over?0:t)))}
  function draw(){
    if(!bg)setBiome(0);ctx.drawImage(bg,0,0,W,H);if(bgOld&&bgFade>0){ctx.globalAlpha=Math.min(1,bgFade/1.2);ctx.drawImage(bgOld,0,0,W,H);ctx.globalAlpha=1}
    for(const e of en)shadow(e.x,e.y,e.r);if(!over)shadow(p.x,p.y,p.r);
    ctx.textAlign='center';ctx.textBaseline='middle';
    // drops: glowing badge with an icon and a short label, gently bobbing; they blink when about to vanish
    for(const d of drops){if(d.life<3&&Math.floor(d.life*6)%2)continue;const y=d.y+Math.sin(t*4+d.x)*2.5,c=DCOL[d.k],pulse=1+0.12*Math.sin(t*6+d.y);
      const gl=ctx.createRadialGradient(d.x,y,2,d.x,y,22*pulse);gl.addColorStop(0,c+'aa');gl.addColorStop(1,c+'00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(d.x,y,22*pulse,0,6.283);ctx.fill();
      ctx.fillStyle='#0b1020';ctx.beginPath();ctx.arc(d.x,y,12,0,6.283);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.stroke();
      ctx.font='15px sans-serif';ctx.fillStyle='#fff';ctx.fillText(DROPS[d.k],d.x,y+1);
      ctx.font='bold 9px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(DLBL[d.k],d.x,y+21);ctx.fillStyle=c;ctx.fillText(DLBL[d.k],d.x,y+21)}
    for(const m of mines){ctx.fillStyle='#2a2f3a';ctx.beginPath();ctx.arc(m.x,m.y,6,0,6.283);ctx.fill();ctx.strokeStyle='#ff8a3c';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=m.arm>0||Math.floor(t*4)%2?'#ff5d73':'#552';ctx.beginPath();ctx.arc(m.x,m.y,2.2,0,6.283);ctx.fill()}
    for(const r of rings){ctx.strokeStyle=`rgba(159,232,255,${Math.max(0,r.l*2)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,Math.min(r.r,r.R),0,6.283);ctx.stroke()}
    for(const h of hz){if(h.k==='lava'){const al=Math.min(1,h.l),gr=ctx.createRadialGradient(h.x,h.y,1,h.x,h.y,h.r);gr.addColorStop(0,`rgba(255,220,120,${al})`);gr.addColorStop(0.5,`rgba(255,90,20,${al*0.9})`);gr.addColorStop(1,'rgba(120,20,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,6.283);ctx.fill()}
      else{ctx.strokeStyle=`rgba(255,170,90,${Math.max(0.15,1-h.r/h.R)})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,6.283);ctx.stroke();ctx.strokeStyle='rgba(255,240,200,.6)';ctx.lineWidth=1.5;ctx.stroke()}}
    for(const h of holes){const gr=ctx.createRadialGradient(h.x,h.y,2,h.x,h.y,40);gr.addColorStop(0,'#000');gr.addColorStop(0.6,'rgba(40,10,80,.85)');gr.addColorStop(1,'rgba(120,60,220,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(h.x,h.y,40,0,6.283);ctx.fill();
      ctx.strokeStyle='rgba(200,150,255,.6)';ctx.lineWidth=1.5;for(let k=0;k<3;k++){const a=t*4+k*2.1;ctx.beginPath();ctx.arc(h.x,h.y,14+k*7,a,a+2);ctx.stroke()}}
    for(const e of en){
      if(e.elite){ctx.strokeStyle='#ffd34d';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(e.x,e.y,e.r+4,0,6.283);ctx.stroke();ctx.setLineDash([])}
      drawAlien(e);
      if(!e.boss&&(e.max>60||e.elite)&&e.hp<e.max){ctx.fillStyle='#00000088';ctx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2,3);ctx.fillStyle='#ff4d6d';ctx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2*e.hp/e.max,3)}
    }
    for(const b of eb){const bc=b.k==='ice'?['rgba(160,225,255,.35)','#a8e6ff']:b.k==='fire'?['rgba(255,120,40,.35)','#ff8a3c']:['rgba(157,255,90,.3)','#9dff5a'];ctx.fillStyle=bc[0];ctx.beginPath();ctx.arc(b.x,b.y,7,0,6.283);ctx.fill();ctx.fillStyle=bc[1];ctx.beginPath();ctx.arc(b.x,b.y,4,0,6.283);ctx.fill();ctx.fillStyle='#efffd8';ctx.beginPath();ctx.arc(b.x,b.y,1.6,0,6.283);ctx.fill()}
    {const lc=buff.rapid>0?'255,110,220':'95,242,214';ctx.lineCap='round';for(const b of bl){const tx=b.x-b.vx*0.03,ty=b.y-b.vy*0.03;ctx.strokeStyle=b.nova?'rgba(255,220,120,.45)':b.dr?'rgba(159,232,255,.35)':`rgba(${lc},.35)`;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(b.x,b.y);ctx.stroke()}}
    for(const m of ms){const a=Math.atan2(m.vy,m.vx);ctx.save();ctx.translate(m.x,m.y);ctx.rotate(a);ctx.fillStyle='#e6ecf1';ctx.fillRect(-6,-2,10,4);ctx.fillStyle='#ff5d73';ctx.beginPath();ctx.moveTo(4,-2);ctx.lineTo(8,0);ctx.lineTo(4,2);ctx.fill();ctx.restore()}
    for(let k=0;k<drn;k++){const a=orbA*0.6+k*6.283/drn,x=p.x+Math.cos(a)*30,y=p.y+Math.sin(a)*30;ctx.fillStyle='#c9d3dc';ctx.beginPath();ctx.ellipse(x,y,7,3.2,0,0,6.283);ctx.fill();ctx.fillStyle='rgba(120,230,255,.9)';ctx.beginPath();ctx.ellipse(x,y-1.5,3,2.4,0,3.14,6.283);ctx.fill();ctx.fillStyle=Math.floor(t*6+k)%2?'#ff5d73':'#ffe14d';ctx.fillRect(x-0.8,y+1.5,1.6,1.6)}
    if(orb){ctx.strokeStyle='rgba(159,232,255,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,48,0,6.283);ctx.stroke();
      for(let k=0;k<orb;k++){const a=orbA+k*6.283/orb,bx=p.x+Math.cos(a)*48,by=p.y+Math.sin(a)*48,gr=ctx.createRadialGradient(bx-2,by-2,0.5,bx,by,6);gr.addColorStop(0,'#f4f6ff');gr.addColorStop(1,'#7f8aa6');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(bx,by,6,0,6.283);ctx.fill();ctx.fillStyle='rgba(60,70,90,.45)';ctx.beginPath();ctx.arc(bx+1.5,by+1,1.6,0,6.283);ctx.arc(bx-2,by+2,1,0,6.283);ctx.fill()}}
    for(const q of parts){ctx.globalAlpha=Math.max(0,q.l*1.6);ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,6.283);ctx.fill()}ctx.globalAlpha=1;
    if(beamTg&&!over){ctx.lineCap='round';ctx.strokeStyle='rgba(95,242,214,.35)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(beamTg.x,beamTg.y);ctx.stroke();ctx.strokeStyle='#e8fffb';ctx.lineWidth=2;ctx.stroke()}
    for(const b of bolts){ctx.strokeStyle=`rgba(255,250,200,${b.l*5})`;ctx.lineWidth=2.5;ctx.beginPath();b.pts.forEach(([x,y],k)=>{if(!k){ctx.moveTo(x,y);return}const [px,py]=b.pts[k-1];const mx2=(x+px)/2+(Math.random()-0.5)*14,my2=(y+py)/2+(Math.random()-0.5)*14;ctx.lineTo(mx2,my2);ctx.lineTo(x,y)});ctx.stroke()}
    if(!over){
      if(p.bar){ctx.strokeStyle=`rgba(95,200,255,${0.6+0.3*Math.sin(t*5)})`;ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<=6;k++){const a=k*1.047+t;ctx.lineTo(p.x+Math.cos(a)*(p.r+9),p.y+Math.sin(a)*(p.r+9))}ctx.stroke()}
      if(buff.shield>0){ctx.strokeStyle='#9fe8ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,p.r+7,0,6.283);ctx.stroke()}
      drawAstronaut();
    }
    drawAmb();
    // HUD: health, wave progress, buffs
    const hw=W-20,r=Math.max(0,p.hp/p.max);
    ctx.fillStyle='#00000080';ctx.fillRect(10,10,hw,10);ctx.fillStyle=r>0.5?'#4fbf6b':r>0.25?'#ffd34d':'#ff4d6d';ctx.fillRect(10,10,hw*r,10);
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.direction='ltr';ctx.fillText(Math.ceil(p.hp)+' / '+p.max,W/2,15.5);ctx.direction='inherit';
    ctx.fillStyle='#00000080';ctx.fillRect(10,24,hw,3);ctx.fillStyle='#ff8a4c';ctx.fillRect(10,24,hw*waveT/WAVE_LEN,3);
    {const bs=en.filter(e=>e.boss);if(bs.length){const b0=bs[0],hp=bs.reduce((a,e)=>a+Math.max(0,e.hp),0),mxh=bs.reduce((a,e)=>a+e.max,0);
      ctx.fillStyle='#00000099';ctx.fillRect(40,H-26,W-80,9);ctx.fillStyle=b0.col;ctx.fillRect(40,H-26,(W-80)*hp/mxh,9);ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(40,H-26,W-80,9);
      ctx.font='bold 11px sans-serif';ctx.fillStyle='#000000aa';ctx.fillText('👑 '+(b0.name||'الزعيم'),W/2+1,H-35);ctx.fillStyle='#fff';ctx.fillText('👑 '+(b0.name||'الزعيم'),W/2,H-36)}}
    ctx.font='bold 11px sans-serif';ctx.textAlign='left';ctx.direction='ltr';ctx.fillStyle='#000000aa';ctx.fillText('💎 '+crys,13,41);ctx.fillStyle='#bfefff';ctx.fillText('💎 '+crys,12,40);ctx.textAlign='center';ctx.direction='inherit';
    if(p.slow>0){ctx.font='13px sans-serif';ctx.fillText('🧊',W-22-(buff.rapid>0?26:0)-(buff.shield>0?26:0),40)}
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
    o.innerHTML='<h3>صمود المدار</h3><p></p><div class="chars"></div><button class="btn main" type="button">ابدأ</button><button class="btn" type="button"></button>';
    const cb=o.querySelector('.chars');Object.entries(CHARS).forEach(([k,c])=>{const b=document.createElement('button');b.type='button';b.className='chr'+((st.char||'scout')===k?' on':'');
      b.innerHTML='<span class="em"></span><b></b><small></small>';b.querySelector('.em').textContent=c.em;b.querySelector('b').textContent=c.name;b.querySelector('small').textContent=c.d;
      b.onclick=()=>{st.char=k;gSave('survive',st);snd('tap');cb.querySelectorAll('.chr').forEach(x=>x.classList.toggle('on',x===b))};cb.appendChild(b)});
    o.querySelector('p').textContent=st.bestTime?`رقمك القياسي ${fmtTime(st.bestTime)} · أعلى موجة ${st.bestWave}`:'حرّك إصبعك على الملعب للمشي، وسلاحك يطلق وحده';
    const [b1,b2]=o.querySelectorAll(':scope > .btn');b1.onclick=()=>begin();b2.textContent='🔬 مختبر المدار · 💎 '+(st.crys||0);b2.onclick=()=>openLab(intro);stage.appendChild(o)}
  const toLocal=ev=>{const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*W/r.width,(ev.clientY-r.top)*H/r.height]};
  return {id:'survive',name:'صمود المدار',region(i,demo){setBiome(i,false);if(demo){for(const k of ['grunt','runner','tank','spitter'])spawn(k);spawnBoss(BOSSES[i%BOSSES.length])}},lab(){openLab(intro)},pauseExt(){if(running&&!over){paused=true;joy=null}},resumeExt(){if(running&&!over&&!stage.querySelector('.overlay')){paused=false;last=performance.now()}},forfeit(){if(running&&!over){clearOverlays();p.hp=0;die();return true}return false},demoWeapons(){evo={blackhole:1,nova:1,swarm:1};mis=2;drn=2;orb=2;Object.assign(lv,{beam:2,flame:2,chain:2,mines:2,barrier:1,regen:1});p.bar=1;['heart','rapid','shield','bomb','chip','crys'].forEach((k,i)=>drop(40+i*56,440,k))},desc:'رائد فضاء ضد غزو الكائنات على كواكب المدار',noDaily:true,
    play(){intro()},
    icon:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#0a0c1c"/><circle cx="12" cy="10" r=".8" fill="#fff"/><circle cx="38" cy="8" r="1" fill="#fff"/><circle cx="41" cy="30" r=".7" fill="#fff"/><circle cx="35" cy="34" r="7" fill="#7ddc5a"/><ellipse cx="32.5" cy="33.5" rx="2.2" ry="1.4" fill="#0b0b14" transform="rotate(30 32.5 33.5)"/><ellipse cx="37.5" cy="33.5" rx="2.2" ry="1.4" fill="#0b0b14" transform="rotate(-30 37.5 33.5)"/><path d="M31 28l-3-5M39 28l3-5" stroke="#7ddc5a" stroke-width="1.4"/><circle cx="17" cy="21" r="8" fill="#e6ecf1" stroke="#0b1618" stroke-width="1.2"/><ellipse cx="19" cy="22.5" rx="4.6" ry="3.4" fill="#f0a030" transform="rotate(35 19 22.5)"/><path d="M22 26l6 5" stroke="#5ff2d6" stroke-width="2.4" stroke-linecap="round"/></svg>',
    help:'أنت رائد فضاء على كواكب المدار وتهاجمك كائنات فضائية. حرّك إصبعك في أي مكان على الملعب لتتحرك، ومسدس الليزر يطلق وحده على أقرب كائن. كل 30 ثانية تنتهي موجة ويرتقي سلاحك مستوى تلقائياً وتختار تطويراً وتنتقل إلى كوكب جديد: القمر، المريخ، يوروبا الجليدي، آيو البركاني، الكوكب الغريب، وحزام الكويكبات. الكائنات تُسقط أحياناً أدوات: ❤️ صحة، ⚡ إطلاق مضاعف، 🛡️ درع، 💣 قنبلة، ⬆️ تطوير فوري. كل خامس موجة يظهر زعيم خاص بالكوكب: حارس الفوهة، دودة الرمال، تنين الجليد، ملك الحمم، الطاغية الأخطبوطي، والسفينة الأم. الأدوات التي تسقط تظهر في دائرة مضيئة ومكتوب تحتها اسمها. الكائنات ذات الحلقة الذهبية «نخبة»: أقوى بثلاث مرات وتُسقط أدوات أكثر. أسلحة إضافية: شعاع متواصل، قاذف لهب، برق متسلسل، ألغام فضائية. دروع: درع مدرّع يقلل الضرر، تجديد ذاتي للصحة، وحاجز طاقة يصدّ ضربة كاملة. قبل كل جولة اختر رائدك: المستكشف المتوازن، أو القنّاص، أو العدّاء، أو المدرّع. من التطويرات صواريخ موجّهة وطائرات مسيّرة، وإذا قوي سلاحان معاً يظهر كرت ذهبي لدمجهما في سلاح خارق: ثقب أسود، أو ليزر نوفا، أو سرب صواريخ. اجمع الكريستالات 💎 من الكائنات والزعماء، وبعد كل جولة اشترِ بها من «مختبر المدار» تطويرات دائمة تبقى معك في كل الجولات. اصمد أطول وقت واكسر رقمك القياسي.',
    progress(){const s=gState('survive');return {level:s.bestWave||1,stars:starTotal(s)}},
    start(){
      st=gState('survive',{bestTime:0,bestWave:1,totalKills:0});
      // one-time gift of crystals (given once per device, on the next visit)
      if(!st.gift1){st.gift1=1;st.crys=(st.crys||0)+1000;gSave('survive',st);setTimeout(()=>{snd('ach');toast('🎁 هدية: 💎 1000 كريستالة في مختبر المدار','ach')},400)}
      reset();running=false;paused=true;
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
      btn('جولة جديدة',IC.reset,()=>{snd('tap');begin()});
      stats();intro();last=performance.now();raf=requestAnimationFrame(step);
    },
    stop(){cancelAnimationFrame(raf);running=false;paused=true;joy=null;keys={};removeEventListener('resize',this.rs);removeEventListener('keydown',this.kd);removeEventListener('keyup',this.ku);document.removeEventListener('visibilitychange',this.vis)}};
})();
