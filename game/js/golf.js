/* ================= game 3: mini golf ================= */
const GolfGame=(()=>{
  const W=300,H=420,BR=6,HR=10,CCOL='#ff8a4c',AIM_DELAY=45;
  let st,cv,ctx,L,ball,balls=[],turn=0,raf=0,drag=null,flagA=1,T=0,inFlight=false,cpu=null,turnEl,over=false,ab,vb;
  const vsOn=()=>prefs.golfCpu!==false;
  const ov=(a,b,m)=>a.x-m<b.x+b.w&&a.x+a.w+m>b.x&&a.y-m<b.y+b.h&&a.y+a.h+m>b.y;
  function build(level,seed){
    const R=rng(seed??level*313+7),start={x:150,y:385},hole={x:45+R()*210,y:40+R()*70},walls=[],sand=[],water=[],slopes=[],mills=[],movers=[];
    const zS={x:start.x-30,y:start.y-30,w:60,h:60},zH={x:hole.x-32,y:hole.y-32,w:64,h:64};
    const nW=Math.min(1+level,9);let tries=0;
    const free=(r,m)=>!ov(r,zS,m)&&!ov(r,zH,m)&&!walls.some(o=>ov(r,o,22))&&!mills.some(o=>ov(r,o.box,12))&&!movers.some(o=>ov(r,o.zone,10));
    if(level>=5&&level%2===1){const n=level>=13?2:1;tries=0;while(mills.length<n&&tries++<200){const len=34+R()*10,cx=60+R()*180,cy=150+R()*150;const box={x:cx-len-6,y:cy-len-6,w:2*len+12,h:2*len+12};
      if(!ov(box,zS,10)&&!ov(box,zH,10)&&!mills.some(o=>ov(box,o.box,10)))mills.push({cx,cy,len,ang:R()*3,spd:(0.018+R()*0.02)*(R()<.5?1:-1),box})}}
    if(level>=9){const n=level>=15?2:1;tries=0;while(movers.length<n&&tries++<200){const horiz=R()<.6,amp=35+R()*35,w=horiz?50:12,h=horiz?12:50,x=40+amp+R()*(W-80-2*amp-w),y=130+R()*170;
      const zone={x:horiz?x-amp:x,y:horiz?y:y-amp,w:horiz?w+2*amp:w,h:horiz?h:h+2*amp};
      if(zone.x<12||zone.x+zone.w>W-12||zone.y<60||zone.y+zone.h>H-70)continue;
      if(!ov(zone,zS,12)&&!ov(zone,zH,12)&&!mills.some(o=>ov(zone,o.box,12))&&!movers.some(o=>ov(zone,o.zone,12)))movers.push({bx:x,by:y,w,h,horiz,amp,spd:0.02+R()*0.02,ph:R()*6,zone,x,y,vx:0,vy:0})}}
    tries=0;while(walls.length<nW&&tries++<500){const horiz=R()<.55,len=50+R()*(level<4?90:130);
      const w={x:15+R()*(W-30),y:70+R()*(H-150),w:horiz?len:12,h:horiz?12:len};if(w.x+w.w>W-10)w.x=W-10-w.w;if(w.y+w.h>H-80)w.y=H-80-w.h;
      if(free(w,0))walls.push(w)}
    if(level>=3){const n=level>=8?2:1;for(let k=0;k<n;k++){const s={x:20+R()*(W-120),y:90+R()*(H-200),w:60+R()*50,h:40+R()*40};if(!ov(s,zS,4))sand.push(s)}}
    if(level>=4){const n=level>=11?2:1;tries=0;while(slopes.length<n&&tries++<200){const ang=Math.floor(R()*8)*Math.PI/4,s={x:20+R()*(W-120),y:110+R()*(H-220),w:70+R()*40,h:50+R()*30,dx:Math.cos(ang),dy:Math.sin(ang)};
      if(!ov(s,zS,6)&&!ov(s,zH,6))slopes.push(s)}}
    if(level>=6){tries=0;const n=level>=12?2:1;while(water.length<n&&tries++<200){const w={x:20+R()*(W-110),y:110+R()*(H-230),w:50+R()*50,h:30+R()*30};
      if(ov(w,zS,14)||ov(w,zH,14)||walls.some(o=>ov(w,o,8))||mills.some(o=>ov(w,o.box,6)))continue;water.push(w)}}
    const par=2+Math.floor(nW/4)+(water.length?1:0)+(mills.length?1:0)+(movers.length?1:0);
    return {level,start,hole,walls,sand,water,slopes,mills,movers,par};
  }
  const inR=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
  const BORDERS=[{x:-40,y:-40,w:W+80,h:40},{x:-40,y:H,w:W+80,h:40},{x:-40,y:0,w:40,h:H},{x:W,y:0,w:40,h:H}];
  function resize(){const w=stage.clientWidth;cv.width=Math.round(w*devicePixelRatio);cv.height=Math.round(w*H/W*devicePixelRatio);cv.style.height=(w*H/W)+'px';ctx.setTransform(w/W*devicePixelRatio,0,0,w/W*devicePixelRatio,0,0)}
  function pos(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}

  /* ---- live physics (acts on the global `ball`) ---- */
  function bounce(nx,ny,ex,boost){const dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=(1+ex)*dot*nx;ball.vy-=(1+ex)*dot*ny;if(Math.abs(dot)>1.2)snd('hit')}if(boost){ball.vx+=boost.x;ball.vy+=boost.y;ball.moving=true}}
  function hitRect(w,boost){const cx=Math.max(w.x,Math.min(ball.x,w.x+w.w)),cy=Math.max(w.y,Math.min(ball.y,w.y+w.h));let dx=ball.x-cx,dy=ball.y-cy,d=Math.hypot(dx,dy);
    if(d<BR){if(d===0){dx=-ball.vx||0.01;dy=-ball.vy||-1;d=Math.hypot(dx,dy)}const nx=dx/d,ny=dy/d;ball.x=cx+nx*BR;ball.y=cy+ny*BR;bounce(nx,ny,.8,boost)}}
  function hitSeg(ax,ay,bx,by,boost){const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((ball.x-ax)*vx+(ball.y-ay)*vy)/(vx*vx+vy*vy))),px=ax+vx*t,py=ay+vy*t;let dx=ball.x-px,dy=ball.y-py,d=Math.hypot(dx,dy),R2=BR+3;
    if(d<R2){if(d===0){dx=1;dy=0;d=1}const nx=dx/d,ny=dy/d;ball.x=px+nx*R2;ball.y=py+ny*R2;bounce(nx,ny,.75,boost)}}
  function physicsFor(b){
    ball=b;const sub=b.moving?3:1;
    for(let s=0;s<sub;s++){
      if(b.moving){b.x+=b.vx/3;b.y+=b.vy/3;L.walls.concat(BORDERS).forEach(w=>hitRect(w))}
      L.movers.forEach(o=>hitRect(o,{x:o.vx*0.9,y:o.vy*0.9}));
      L.mills.forEach(m=>{for(let k=0;k<2;k++){const a=m.ang+k*Math.PI/2,c=Math.cos(a)*m.len,sn=Math.sin(a)*m.len,tv=m.spd*m.len,sg=Math.sign(((b.x-m.cx)*Math.cos(a)+(b.y-m.cy)*Math.sin(a))||1);
        hitSeg(m.cx-c,m.cy-sn,m.cx+c,m.cy+sn,{x:-Math.sin(a)*tv*0.6*sg,y:Math.cos(a)*tv*0.6*sg})}});
    }
    if(!b.moving)return;
    L.slopes.forEach(sl=>{if(inR(b,sl)){b.vx+=sl.dx*0.07;b.vy+=sl.dy*0.07}});
    const f=L.sand.some(r=>inR(b,r))?0.93:0.985;b.vx*=f;b.vy*=f;
    const dh=Math.hypot(b.x-L.hole.x,b.y-L.hole.y),sp=Math.hypot(b.vx,b.vy);
    if(dh<HR+3){b.vx+=(L.hole.x-b.x)*0.04;b.vy+=(L.hole.y-b.y)*0.04}
    const onSlope=L.slopes.some(sl=>inR(b,sl));
    if(dh<HR-2&&sp<5.5){b.sunk=true;b.moving=false;b.x=L.hole.x;b.y=L.hole.y;snd('sink');if(!b.cpu)buzz(40);if(b.cpu)toast('🤖 الكمبيوتر أدخل الكرة بـ '+b.strokes+(b.strokes===1?' ضربة':' ضربات'))}
    else if(L.water.some(r=>inR(b,r))){b.moving=false;b.strokes++;b.x=b.lx;b.y=b.ly;b.vx=b.vy=0;snd('splash');if(!b.cpu)buzz(80);toast(b.cpu?'🤖 الثقب الأسود ابتلع كرة الكمبيوتر! +1':'🕳️ ابتلعها الثقب الأسود! +1 ضربة');upd()}
    else{b.slow=sp<0.5?(b.slow||0)+1:0;if((!onSlope&&sp<0.06)||b.slow>50){b.moving=false;b.vx=b.vy=0;b.slow=0}}
  }

  /* ---- prediction for the computer (same rules, moving parts at their future positions) ---- */
  function sim(x,y,vx,vy,T0){
    const col=(cx,cy,r,ex)=>{let dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy);if(d<r){if(d===0){dx=-vx||0.01;dy=-vy||-1;d=Math.hypot(dx,dy)}const nx=dx/d,ny=dy/d;x=cx+nx*r;y=cy+ny*r;const dot=vx*nx+vy*ny;if(dot<0){vx-=(1+ex)*dot*nx;vy-=(1+ex)*dot*ny}}};
    const rects=L.walls.concat(BORDERS);
    for(let f=0;f<300;f++){
      const t=T0+f+1;
      const mv=L.movers.map(o=>{const s=Math.sin(t*o.spd+o.ph)*o.amp;return {x:o.horiz?o.bx+s:o.bx,y:o.horiz?o.by:o.by+s,w:o.w,h:o.h}});
      for(let s=0;s<3;s++){
        x+=vx/3;y+=vy/3;
        for(const w of rects)col(Math.max(w.x,Math.min(x,w.x+w.w)),Math.max(w.y,Math.min(y,w.y+w.h)),BR,.8);
        for(const w of mv)col(Math.max(w.x,Math.min(x,w.x+w.w)),Math.max(w.y,Math.min(y,w.y+w.h)),BR,.8);
        for(const m of L.mills)for(let k=0;k<2;k++){const a=m.ang+m.spd*(t-T)+k*Math.PI/2,c=Math.cos(a)*m.len,sn=Math.sin(a)*m.len,ax=m.cx-c,ay=m.cy-sn,ux=2*c,uy=2*sn,q=Math.max(0,Math.min(1,((x-ax)*ux+(y-ay)*uy)/(ux*ux+uy*uy)));col(ax+ux*q,ay+uy*q,BR+3,.75)}
      }
      const p={x,y};L.slopes.forEach(sl=>{if(inR(p,sl)){vx+=sl.dx*0.07;vy+=sl.dy*0.07}});
      const fr=L.sand.some(r=>inR(p,r))?0.93:0.985;vx*=fr;vy*=fr;
      const dh=Math.hypot(x-L.hole.x,y-L.hole.y),sp=Math.hypot(vx,vy);
      if(dh<HR+3){vx+=(L.hole.x-x)*0.04;vy+=(L.hole.y-y)*0.04}
      if(dh<HR-2&&sp<5.5)return {sunk:true,f,d:0};
      if(L.water.some(r=>inR(p,r)))return {water:true,f,d:dh};
      if(sp<0.06&&!L.slopes.some(sl=>inR(p,sl)))break;
    }
    return {d:Math.hypot(x-L.hole.x,y-L.hole.y)};
  }
  function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
  function planShot(b){
    const T0=T+AIM_DELAY,score=r=>r.sunk?-1000+r.f*0.01:r.water?800+r.d:r.d;let best=null;
    const tryShot=(a,k)=>{const pw=k*10.5,r=sim(b.x,b.y,Math.cos(a)*pw,Math.sin(a)*pw,T0),sc=score(r);if(!best||sc<best.sc)best={sc,a,k}};
    for(let ai=0;ai<90;ai++)for(let pi=1;pi<=9;pi++)tryShot(ai*4*Math.PI/180,pi/9);
    const a0=best.a,k0=best.k;for(let da=-4;da<=4;da++)for(let dk=-3;dk<=3;dk++)tryShot(a0+da*Math.PI/180,Math.min(1,Math.max(0.06,k0+dk*0.03)));
    const lv=L.level,sdA=Math.max(0.8,7-lv*0.4)*Math.PI/180,sdP=Math.max(0.015,0.1-lv*0.005);
    const a=best.a+gauss()*sdA,k=Math.min(1,Math.max(0.06,best.k*(1+gauss()*sdP)));
    return {a,k,vx:Math.cos(a)*k*10.5,vy:Math.sin(a)*k*10.5};
  }

  /* ---- turns ---- */
  function mkBall(isCpu,dx){return {x:L.start.x+dx,y:L.start.y,vx:0,vy:0,moving:false,sunk:false,strokes:0,lx:L.start.x+dx,ly:L.start.y,cpu:isCpu}}
  function shoot(b,vx,vy){b.lx=b.x;b.ly=b.y;b.vx=vx;b.vy=vy;b.moving=true;b.strokes++;inFlight=true;snd('hit');if(!b.cpu)buzz(15);upd();updTurn()}
  function setTurn(i){turn=i;ball=balls[i];cpu=balls[i].cpu?{thinkAt:T+35,plan:null}:null;updTurn()}
  function afterShot(){
    if(over)return;const P=balls[0],C=balls[1];
    if(!C){if(P.sunk)finish();else setTurn(0);return}
    if(!C.sunk&&C.strokes>=Math.max(L.par+5,8)){C.sunk=true;C.gaveUp=true;toast('🤖 الكمبيوتر استسلم في هذه الحفرة')}
    if(P.sunk&&C.sunk){finish();return}
    let next=turn===0?1:0;if(balls[next].sunk)next=turn;setTurn(next);
  }
  const canPlay=()=>!over&&!inFlight&&ball&&!ball.cpu&&!ball.moving&&!ball.sunk;
  function updTurn(){
    if(!turnEl)return;
    if(over){turnEl.innerHTML='';return}
    const C=balls[1];
    if(!C){turnEl.innerHTML='<span class="me">●</span> دورك';return}
    const who=ball.cpu?`<span class="cp">●</span> دور الكمبيوتر${inFlight?'':' … يفكّر'}`:`<span class="me">●</span> دورك`;
    turnEl.innerHTML=`<b>${who}</b><span class="sc">أنت ${balls[0].strokes}${balls[0].sunk?' ✓':''} · الكمبيوتر ${C.gaveUp?'—':C.strokes}${C.sunk&&!C.gaveUp?' ✓':''}</span>`;
  }

  function step(){
    T++;
    L.mills.forEach(m=>m.ang+=m.spd);
    L.movers.forEach(o=>{const s=Math.sin(T*o.spd+o.ph)*o.amp,nx=o.horiz?o.bx+s:o.bx,ny=o.horiz?o.by:o.by+s;o.vx=nx-o.x;o.vy=ny-o.y;o.x=nx;o.y=ny});
    if(!over){
      balls.forEach(b=>{if(!b.sunk)physicsFor(b)});ball=balls[turn];
      if(inFlight&&!ball.moving){inFlight=false;afterShot()}
      if(cpu&&!over){
        if(!cpu.plan&&T>=cpu.thinkAt){cpu.plan=planShot(ball);cpu.fireAt=T+AIM_DELAY}
        else if(cpu.plan&&T>=cpu.fireAt){const p=cpu.plan;cpu=null;shoot(ball,p.vx,p.vy)}
      }
    }
    draw();raf=requestAnimationFrame(step);
  }
  function rr(r,rad){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(r.x,r.y,r.w,r.h,rad);else ctx.rect(r.x,r.y,r.w,r.h)}
  // each hole is played on a planet: the surface is painted once per hole on an offscreen canvas
  const PLANETS=[
    {name:'القمر',ground:'#6c6f77',dust:'#9a9ca3',crater:[110,112,120],wall:'#2b3340',top:'#566377'},
    {name:'المريخ',ground:'#94422a',dust:'#c97a4e',crater:[150,70,44],wall:'#3a2520',top:'#6a443a'},
    {name:'الكوكب الغريب',ground:'#3d2c62',dust:'#7a5ab0',crater:[80,60,120],wall:'#171130',top:'#3d3270'},
    {name:'حزام الكويكبات',ground:'#34302e',dust:'#625850',crater:[70,64,60],wall:'#121010',top:'#3a3532'}
  ];
  let course=null,planet=PLANETS[0];
  function makeCourse(level){
    planet=PLANETS[(level-1)%PLANETS.length];const S=2,c=document.createElement('canvas');c.width=W*S;c.height=H*S;const g=c.getContext('2d');g.scale(S,S);const R=rng(level*131+7),P=planet;
    g.fillStyle=P.ground;g.fillRect(0,0,W,H);g.fillStyle='rgba(255,255,255,.035)';for(let y=0;y<H;y+=40)g.fillRect(0,y,W,20);
    for(let k=0;k<220;k++){g.fillStyle=R()<0.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.12)';g.beginPath();g.arc(R()*W,R()*H,0.6+R()*1.6,0,7);g.fill()}
    const [cr,cg,cb]=P.crater;
    for(let k=0;k<9;k++){const x=R()*W,y=R()*H,r=k<2?14+R()*12:4+R()*7;
      g.fillStyle=`rgba(${cr+50},${cg+50},${cb+50},.35)`;g.beginPath();g.ellipse(x-r*0.08,y-r*0.1,r*1.08,r,0,0,7);g.fill();
      const gr=g.createRadialGradient(x+r*0.25,y+r*0.25,1,x,y,r);gr.addColorStop(0,`rgba(${cr-45},${cg-45},${cb-45},.75)`);gr.addColorStop(1,`rgba(${cr-15},${cg-15},${cb-15},.6)`);g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*0.92,0,0,7);g.fill()}
    const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.4,W/2,H/2,Math.max(W,H)*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=v;g.fillRect(0,0,W,H);
    course=c;
  }
  function blackHole(r){ctx.save();rr(r,14);ctx.clip();
    const cx=r.x+r.w/2,cy=r.y+r.h/2,m=Math.max(r.w,r.h);const gr=ctx.createRadialGradient(cx,cy,2,cx,cy,m*0.75);gr.addColorStop(0,'#000');gr.addColorStop(0.45,'#120624');gr.addColorStop(1,'#4b2390');ctx.fillStyle=gr;ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle='rgba(190,140,255,.45)';ctx.lineWidth=1.5;for(let k=0;k<3;k++){const a=T*0.04+k*2.1;ctx.beginPath();ctx.ellipse(cx,cy,r.w*0.42-k*5,r.h*0.32-k*3,0,a,a+2.2);ctx.stroke()}
    ctx.fillStyle='rgba(255,255,255,.7)';for(let k=0;k<6;k++){const a=T*0.03+k,d=(k*13%Math.max(8,m/2));ctx.fillRect(cx+Math.cos(a)*d,cy+Math.sin(a)*d*0.7,1.2,1.2)}
    ctx.restore();ctx.strokeStyle='rgba(150,100,255,.6)';ctx.lineWidth=1.5;rr(r,14);ctx.stroke()}
  function drawBall(b,color){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.arc(b.x+1.5,b.y+2,BR,0,7);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(b.x,b.y,BR,0,7);ctx.fill();
    if(b===ball&&!over&&!b.moving){ctx.strokeStyle=b.cpu?'rgba(255,138,76,.7)':'rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(b.x,b.y,BR+4+Math.sin(T*.12)*1.5,0,7);ctx.stroke()}}
  function draw(){
    if(!course||course.lv!==L.level){makeCourse(L.level);course.lv=L.level}ctx.drawImage(course,0,0,W,H);
    L.slopes.forEach(sl=>{ctx.fillStyle='rgba(0,0,0,.28)';rr(sl,12);ctx.fill();ctx.save();ctx.beginPath();ctx.rect(sl.x,sl.y,sl.w,sl.h);ctx.clip();
      ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=3;const off=(T*0.6)%22;const a=Math.atan2(sl.dy,sl.dx);
      for(let i=-4;i<10;i++)for(let j=-2;j<5;j++){const cx=sl.x+sl.w/2+Math.cos(a)*(i*22+off-80)-Math.sin(a)*(j*22-40),cy=sl.y+sl.h/2+Math.sin(a)*(i*22+off-80)+Math.cos(a)*(j*22-40);
        ctx.beginPath();ctx.moveTo(cx-Math.cos(a-0.7)*7,cy-Math.sin(a-0.7)*7);ctx.lineTo(cx,cy);ctx.lineTo(cx-Math.cos(a+0.7)*7,cy-Math.sin(a+0.7)*7);ctx.stroke()}ctx.restore()});
    L.sand.forEach(r=>{ctx.fillStyle=planet.dust;rr(r,14);ctx.fill();ctx.fillStyle='rgba(0,0,0,.12)';for(let k=0;k<8;k++){ctx.beginPath();ctx.arc(r.x+((k*37)%Math.max(1,r.w)),r.y+((k*23)%Math.max(1,r.h)),1.5,0,7);ctx.fill()}});
    L.water.forEach(r=>blackHole(r));
    L.walls.forEach(w=>{ctx.fillStyle=planet.wall;rr(w,4);ctx.fill();ctx.fillStyle=planet.top;rr({x:w.x,y:w.y,w:w.w,h:Math.min(w.h,4)},2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';const lng=w.w>w.h;for(let q=8;q<(lng?w.w:w.h)-4;q+=16){ctx.beginPath();ctx.arc(lng?w.x+q:w.x+w.w/2,lng?w.y+w.h/2+1:w.y+q,1,0,7);ctx.fill()}});
    L.movers.forEach(o=>{ctx.fillStyle='#5b6676';rr(o,4);ctx.fill();ctx.fillStyle='#f2b84b';rr({x:o.x,y:o.y,w:o.w,h:Math.min(o.h,3)},2);ctx.fill()});
    ctx.fillStyle='#05040c';ctx.beginPath();ctx.arc(L.hole.x,L.hole.y,HR,0,7);ctx.fill();ctx.strokeStyle=`rgba(95,242,214,${0.45+0.3*Math.sin(T*0.08)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(L.hole.x,L.hole.y,HR+1.5,0,7);ctx.stroke();
    {const live=balls.filter(b=>!b.sunk),dh=live.length?Math.min(...live.map(b=>Math.hypot(b.x-L.hole.x,b.y-L.hole.y))):0,tgt=dh<70?0:1;flagA+=(tgt-flagA)*0.15;
     if(flagA>0.02){ctx.save();ctx.globalAlpha=flagA;const lift=(1-flagA)*14;
      ctx.strokeStyle='#e8f1ee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L.hole.x,L.hole.y-lift);ctx.lineTo(L.hole.x,L.hole.y-34-lift);ctx.stroke();
      ctx.fillStyle='#f2b84b';ctx.beginPath();ctx.moveTo(L.hole.x,L.hole.y-34-lift);ctx.lineTo(L.hole.x+18,L.hole.y-28-lift);ctx.lineTo(L.hole.x,L.hole.y-22-lift);ctx.fill();ctx.restore()}
     else{ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(L.hole.x,L.hole.y,HR+3,0,7);ctx.stroke()}}
    L.mills.forEach(m=>{ctx.strokeStyle='#c9d3dc';ctx.lineWidth=6;ctx.lineCap='round';for(let k=0;k<2;k++){const a=m.ang+k*Math.PI/2,c=Math.cos(a)*m.len,s=Math.sin(a)*m.len;ctx.beginPath();ctx.moveTo(m.cx-c,m.cy-s);ctx.lineTo(m.cx+c,m.cy+s);ctx.stroke()}
      ctx.fillStyle='#5ff2d6';ctx.beginPath();ctx.arc(m.cx,m.cy,6,0,7);ctx.fill();ctx.lineCap='butt'});
    if(cpu&&cpu.plan&&ball){const p=cpu.plan,prog=Math.min(1,1-(cpu.fireAt-T)/AIM_DELAY),len=p.k*130*prog;
      ctx.strokeStyle='rgba(255,138,76,.9)';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(ball.x+Math.cos(p.a)*len*1.2,ball.y+Math.sin(p.a)*len*1.2);ctx.stroke();ctx.setLineDash([])}
    if(drag&&canPlay()){const dx=drag.sx-drag.x,dy=drag.sy-drag.y,len=Math.min(Math.hypot(dx,dy),130);if(len>6){const a=Math.atan2(dy,dx),k=len/130;
      if(prefs.aim){const pw=k*10.5,pts=preview(Math.cos(a)*pw,Math.sin(a)*pw);pts.forEach((q,j)=>{ctx.fillStyle=`rgba(255,255,255,${Math.max(.12,.85-j/pts.length*.75)})`;ctx.beginPath();ctx.arc(q[0],q[1],q[2]?3.4:2.2,0,7);ctx.fill()})}
      ctx.strokeStyle=`rgba(242,184,75,${.5+k*.5})`;ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(ball.x+Math.cos(a)*len*1.2,ball.y+Math.sin(a)*len*1.2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(10,H-16,W-20,6);ctx.fillStyle=k>.8?'#f2a09a':'#f2b84b';ctx.fillRect(10,H-16,(W-20)*k,6)}}
    balls.forEach(b=>{if(!b.sunk&&b!==ball)drawBall(b,b.cpu?CCOL:'#fff')});
    if(ball&&!ball.sunk)drawBall(ball,ball.cpu?CCOL:'#fff');
  }
  function preview(vx,vy){
    const pts=[];let x=ball.x,y=ball.y,bounces=0;const rects=L.walls.concat(BORDERS);
    for(let f=0;f<220;f++){let hit=false;
      for(let s2=0;s2<3;s2++){x+=vx/3;y+=vy/3;
        for(const w of rects){const cx=Math.max(w.x,Math.min(x,w.x+w.w)),cy=Math.max(w.y,Math.min(y,w.y+w.h));let ddx=x-cx,ddy=y-cy,d=Math.hypot(ddx,ddy);
          if(d<BR){if(d===0){ddx=-vx||0.01;ddy=-vy||-1;d=Math.hypot(ddx,ddy)}const nx=ddx/d,ny=ddy/d;x=cx+nx*BR;y=cy+ny*BR;const dot=vx*nx+vy*ny;if(dot<0){vx-=1.8*dot*nx;vy-=1.8*dot*ny;hit=true}}}}
      if(hit)bounces++;
      L.slopes.forEach(sl=>{if(inR({x,y},sl)){vx+=sl.dx*0.07;vy+=sl.dy*0.07}});
      const fr=L.sand.some(r=>inR({x,y},r))?0.93:0.985;vx*=fr;vy*=fr;
      if(f%3===0||hit)pts.push([x,y,hit]);
      if(bounces>=2||Math.hypot(vx,vy)<0.08||L.water.some(r=>inR({x,y},r))||Math.hypot(x-L.hole.x,y-L.hole.y)<HR)break}
    return pts;
  }
  function setStatsFor(){setStats(vsOn()?[['s1','الحفرة'],['s2','ضرباتك'],['s3','الكمبيوتر'],['s4','البار','gold']]:[['s1','الحفرة'],['s2','ضرباتك'],['s3','البار','gold'],['s4','عوائق']])}
  function upd(){
    setStat('s1',mode&&mode.daily?'اليوم':L.level);setStat('s2',balls[0]?balls[0].strokes:0);
    if(vsOn()){const C=balls[1];setStat('s3',C?(C.gaveUp?'—':C.strokes):0);setStat('s4',L.par)}
    else{setStat('s3',L.par);setStat('s4',L.walls.length+L.mills.length+L.movers.length)}
  }
  function finish(){
    over=true;cpu=null;updTurn();const P=balls[0],C=balls[1],d=P.strokes-L.par;let s=d<=0?3:d===1?2:1,beat=false;
    let name=P.strokes===1?'ضربة واحدة! 🏆':d<=-2?'إيغل!':d===-1?'بيردي!':d===0?'بار':d===1?'بوغي':'أكملت الحفرة',text=`${P.strokes} ضربة · البار ${L.par}`;
    if(C){
      if(C.gaveUp||P.strokes<C.strokes){beat=true;name='فزت على الكمبيوتر! 🏆'}
      else if(P.strokes===C.strokes)name='تعادل مع الكمبيوتر';
      else{name='الكمبيوتر فاز 🤖';s=Math.min(s,1)}
      text=`أنت ${P.strokes} · الكمبيوتر ${C.gaveUp?'استسلم':C.strokes} · البار ${L.par}`;
    }
    finishLevel(GolfGame,st,L.level,s,{strokes:P.strokes,par:L.par,beatCpu:beat},name,text);
  }
  function play(level){
    clearOverlays();st=gState('golf');L=mode&&mode.daily?build(10,mode.seed):build(level);flagA=1;T=0;over=false;inFlight=false;cpu=null;drag=null;
    balls=vsOn()?[mkBall(false,-12),mkBall(true,12)]:[mkBall(false,0)];setTurn(0);upd();
    if(!mode||!mode.daily){if(L.slopes.length&&!st.seenSlope){st.seenSlope=1;gSave('golf',st);toast('جديد: المنحدرات تدفع الكرة باتجاه الأسهم')}
      else if(L.mills.length&&!st.seenMill){st.seenMill=1;gSave('golf',st);toast('جديد: طاحونة دوّارة! انتظر اللحظة المناسبة')}
      else if(L.movers.length&&!st.seenMover){st.seenMover=1;gSave('golf',st);toast('جديد: حواجز متحركة')}
      else if(vsOn()&&!st.seenCpu){st.seenCpu=1;gSave('golf',st);toast('🤖 الكمبيوتر ينافسك! تتبادلان الضربات، والأقل ضربات يفوز')}}
  }
  return {id:'golf',name:'جولف المدار',desc:'العب ضد الكمبيوتر على نفس الحفرة',play,
    icon:'<svg viewBox="0 0 48 48"><circle cx="24" cy="38" r="7" fill="#0c1d14"/><path d="M24 38V8" stroke="#e8f1ee" stroke-width="2.5"/><path d="M24 8l13 5-13 5z" fill="#f2b84b"/><circle cx="12" cy="30" r="4.5" fill="#fff"/><circle cx="36" cy="30" r="4.5" fill="#ff8a4c"/></svg>',
    help:'اسحب من أي مكان بعكس اتجاه الضربة (مثل المقلاع) ثم اترك. الكرة البرتقالية للكمبيوتر: تتبادلان الضربات على نفس الحفرة، ومن يُدخلها بضربات أقل يفوز، والكمبيوتر يصبح أدق مع المستويات. كل حفرة على كوكب مختلف. الغبار يبطئ الكرة، والثقب الأسود يبتلعها فتعود ويضيف ضربة، والمنحدرات تدفعها باتجاه الأسهم، والأذرع الدوّارة والحواجز المعدنية تتحرك. زر «ضد الكمبيوتر» يشغّل المنافس أو يوقفه.',
    progress(){const s=gState('golf');return {level:s.level,stars:starTotal(s)}},
    start(){
      st=gState('golf');setStatsFor();
      turnEl=document.createElement('div');turnEl.className='gturn';stage.appendChild(turnEl);
      cv=document.createElement('canvas');stage.appendChild(cv);ctx=cv.getContext('2d');resize();this.rs=()=>resize();addEventListener('resize',this.rs);
      cv.onpointerdown=e=>{if(!canPlay())return;const p=pos(e);drag={sx:p.x,sy:p.y,x:p.x,y:p.y};try{cv.setPointerCapture(e.pointerId)}catch(_){}};
      cv.onpointermove=e=>{if(!drag)return;const p=pos(e);drag.x=p.x;drag.y=p.y};
      cv.onpointerup=cv.onpointercancel=()=>{if(!drag)return;const dx=drag.sx-drag.x,dy=drag.sy-drag.y,len=Math.min(Math.hypot(dx,dy),130);drag=null;
        if(len<8||!canPlay())return;const pw=len/130*10.5,d=Math.hypot(dx,dy);shoot(ball,dx/d*pw,dy/d*pw)};
      vb=btn('ضد الكمبيوتر',null,()=>{prefs.golfCpu=!vsOn();save('arcade-prefs',prefs);vb.classList.toggle('on',vsOn());snd('tap');toast(vsOn()?'🤖 المنافس يعمل':'المنافس متوقف: تلعب وحدك');setStatsFor();play(L.level)});vb.classList.toggle('on',vsOn());
      ab=btn('مساعد التصويب',IC.aim,()=>{prefs.aim=!prefs.aim;save('arcade-prefs',prefs);ab.classList.toggle('on',prefs.aim);snd('tap');toast(prefs.aim?'مساعد التصويب يعمل':'مساعد التصويب متوقف')});ab.classList.toggle('on',prefs.aim);
      btn('إعادة الحفرة',IC.reset,()=>play(L.level));
      play(st.level);raf=requestAnimationFrame(step);
    },
    stop(){cancelAnimationFrame(raf);removeEventListener('resize',this.rs);turnEl=null}};
})();
