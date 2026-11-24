/* ================= «عالم المدار»: open world. Walk the six regions with the joystick, gather materials, fight monsters
   and each region's guardian. One simulation, two views: top-down 2D (painted art) and third-person 3D (three.js). ================= */
const WORLD={
  RW:1200,                                    // size unit for spawn bands (a region is about 1200 units across)
  size:{w:3600,h:2400},                       // the planet surface
  // organic map: each region grows from a seed; w = its size weight. Borders are warped so they look natural, not square.
  //   orbit (home, the biggest: building zone) · ice NW · lava NE · crystal S · green forest SW · nebula SE
  seeds:[{x:1800,y:820,w:1.35},{x:560,y:600,w:1.0},{x:3050,y:620,w:1.0},{x:1820,y:1960,w:0.92},{x:620,y:1880,w:1.12},{x:3060,y:1900,w:0.88}],
  base:{x:1800,y:560,r:150},                  // the colony dome, centre of Orbit-1
  ground:['#4a3654','#9fbfd6','#3a2420','#ad9cc8','#1e4733','#170f2c'],
  spot:['#5e4670','#c9e2f2','#5a2e22','#d6c8ee','#2f6b47','#2a1d4a'],
  fog:[0x2a2040,0xbcd6ea,0x4a1a10,0xc9bde0,0x10301f,0x0a0618],
  mon:BAL.hero.mon,
  guard:{hp:BAL.hero.guard.hp,lvOver:BAL.hero.guard.lvOver,spd:BAL.hero.guard.spd,dmg:BAL.hero.guard.dmg,r:BAL.hero.guard.r,cd:BAL.world.guard.respawnS*1000,kills:BAL.world.guard.fastKills},   // a beaten guardian returns after 5 min, or sooner after 25 kills in its region
  player:BAL.hero.player,
  moon:{x:1480,y:930,h:150},                  // the moon-zone diorama inside Orbit-1
  nodes:14,nodeCd:120000,poi:{c:15,mat:20},maxMon:BAL.world.enemy.maxActive,
  spawn:{rate:3.2,min:BAL.world.enemy.packMin,max:BAL.world.enemy.packMax,d0:520,d1:780},  // packs per second (chance), pack size, spawn ring around the hero
  // XP Hero style: the hero levels up from kills; each region has a monster level band and a gate (previous guardian + hero level)
  LV:BAL.world.enemy.zoneLv,hpGrow:BAL.hero.hpGrow,dmgGrow:BAL.hero.dmgGrow,heroDmg:BAL.hero.heroDmg,heroHp:BAL.hero.heroHp,xpNext:lv=>Math.round(BAL.hero.xpBase*Math.pow(lv,BAL.hero.xpPow)),
  xp:BAL.hero.xp,
  WEAP:[{id:'rifle',n:'بندقية الطاقة',em:'🔫',kind:'shot',mat:'alloy'},
    {id:'spread',n:'القاذف الثلاثي',em:'💥',kind:'spread',mat:'ice'},
    {id:'saber',n:'سيف البلازما',em:'🗡️',kind:'slash',mat:'magma'},
    {id:'chain',n:'مدفع البرق',em:'⚡',kind:'chain',mat:'quartz'},
    {id:'nova',n:'نجمة السديم',em:'🌟',kind:'nova',mat:'gas'}].map(w=>Object.assign(w,BAL.hero.weap[w.id])),   // rate, damage multiplier, range and unlock cost come from BAL.hero.weap
  upCost:l=>({c:BAL.hero.weapUp.gem*l,m:BAL.hero.weapUp.mat*l})};   // weapon upgrade l→l+1: 💎 15·l and the weapon's material 8·l

/* full phone screen while the open world runs */
document.head.insertAdjacentHTML('beforeend','<style>body.wfull{overflow:hidden;overscroll-behavior:none}body.wfull #play .stats,body.wfull #play .controls,body.wfull #play .help{display:none}body.wfull #play .stage.wstage{position:fixed;left:0;right:0;bottom:0;top:56px;width:auto;border-radius:0;z-index:20}body.wfull #play .stage.wstage>canvas{height:100%!important}body.wfull #play .topbar{position:relative;z-index:21}body.wfull .wview,body.wfull .wforgeb{bottom:calc(14px + env(safe-area-inset-bottom))}</style>');
const WorldGame=(()=>{
  const W=432,{RW}=WORLD,WW=WORLD.size.w,WH=WORLD.size.h;
  let H=624,cv,ctx,c3,raf=0,last=0,st,running=false,joy=null,keys={},hud,mini,t=0,saveT=0,msgT=0,view='2d',R3=null,iv=0;
  let bot={x:0,y:0,cd:0},bshots=[],evT=0,evN=0,mets=[],p,mons=[],shots=[],eshots=[],nodes=[],props=[],pools=[],parts=[],guards=[],pois=[],orbs=[],fx=[],cam={x:0,y:0,yaw:-Math.PI/2};
  const IMG={};const img=k=>{if(typeof ART==='undefined'||!ART[k])return null;if(!IMG[k]){const i=new Image();i.src=ART[k];IMG[k]=i}return IMG[k].complete&&IMG[k].naturalWidth?IMG[k]:null};
  /* ---------- organic region map: weighted seeds + a smooth warp, so regions touch with natural borders and different sizes ---------- */
  const SD=WORLD.seeds;
  const regAt=(x,y)=>{if(x<0||y<0||x>WW||y>WH)return -1;const wx=x+90*Math.sin(y/240+0.7)+45*Math.sin((x+y)/130),wy=y+90*Math.cos(x/260+1.1)+45*Math.cos((x-y)/150);
    let b=0,bd=1e9;for(let i=0;i<6;i++){const d=Math.hypot(wx-SD[i].x,wy-SD[i].y)/SD[i].w;if(d<bd){bd=d;b=i}}return b};
  // region outlines (traced once by walking out from each seed), their bounding boxes and areas
  let POLY=null,P2D=null,BOX=null,AREA=null;
  function regTrace(){POLY=[];P2D=[];BOX=[];AREA=[];const N=160;
    for(let i=0;i<6;i++){const o=SD[i],pts=[];for(let k=0;k<N;k++){const a=k/N*6.2832,ca=Math.cos(a),sa=Math.sin(a);let r=10;
        while(r<2600){const x=o.x+ca*r,y=o.y+sa*r;if(x<0||y<0||x>WW||y>WH||regAt(x,y)!==i)break;r+=10}r-=5;pts.push([Math.max(0,Math.min(WW,o.x+ca*r)),Math.max(0,Math.min(WH,o.y+sa*r))])}
      POLY[i]=pts;const P=new Path2D();pts.forEach(([x,y],k)=>k?P.lineTo(x,y):P.moveTo(x,y));P.closePath();P2D[i]=P;
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,A=0;pts.forEach(([x,y],k)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);const q=pts[(k+1)%N];A+=x*q[1]-q[0]*y});BOX[i]={x0,y0,x1,y1};AREA[i]=Math.abs(A)/2}}
  const regPos=i=>{if(!BOX)regTrace();return {x:BOX[i].x0,y:BOX[i].y0}};
  const regMid=i=>({x:SD[i].x,y:SD[i].y});
  // a random point well inside region i (margin m from its border)
  function regRand(i,R,m){if(!BOX)regTrace();const B=BOX[i];for(let k=0;k<200;k++){const x=B.x0+R()*(B.x1-B.x0),y=B.y0+R()*(B.y1-B.y0);
      if(regAt(x,y)===i&&regAt(x+m,y)===i&&regAt(x-m,y)===i&&regAt(x,y+m)===i&&regAt(x,y-m)===i)return {x,y}}return {x:SD[i].x,y:SD[i].y}}
  const open=i=>i===0||(typeof regOpen==='function'&&regOpen(i));
  const gateOk=i=>i===0||(((st.gk||{})[i-1]>0)&&(st.lv||1)>=WORLD.LV[i]);
  const gateTxt=i=>{const L=[];if(!((st.gk||{})[i-1]>0))L.push('👑 حارس '+PLN[i-1].n);if((st.lv||1)<WORLD.LV[i])L.push('⭐ المستوى '+WORLD.LV[i]);return L.join(' · ')};
  function discover(reg){col.wm.u[reg]=1;colSave();snd('win');addMat(REG[reg].mat,10);toast(`🗺️ اكتشفت ${PLN[reg].em} ${PLN[reg].n}!`,'ach');const n=Object.keys(col.wm.u).length;if(n>=3)unlock('wm3');if(n>=6)unlock('wm6');R3&&R3.unlockReg(reg)}
  // «ادخل المنطقة» on the panorama: step just inside the border nearest to the hero, and the region opens
  function enterReg(i){if(!p)return;const S=SD[i];for(let k=0;k<60&&regAt(p.x,p.y)!==i;k++){const d=Math.hypot(S.x-p.x,S.y-p.y)||1,st2=Math.min(d,40);p.x+=(S.x-p.x)/d*st2;p.y+=(S.y-p.y)/d*st2}{const d=Math.hypot(S.x-p.x,S.y-p.y)||1;p.x+=(S.x-p.x)/d*Math.min(d,70);p.y+=(S.y-p.y)/d*Math.min(d,70)}p.safe=2;if(!open(i))discover(i)}   // 2 s of safety after stepping in
  // a gate that is ready now: the panorama the first time, a toast after that
  function gateReady(i){if(typeof regionPanorama==='function'&&!panoSeen(i))regionPanorama(i,()=>enterReg(i));else toast('🔓 '+PLN[i].n+' مفتوحة الآن، امشِ إليها')}
  const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function seeded(s){return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}}
  /* ---------- the world: props, lava pools, material nodes, guardians, signals (same every visit) ---------- */
  function buildWorld(){props=[];pools=[];nodes=[];guards=[];pois=[];
    regTrace();for(let i=0;i<6;i++){const R=seeded(97+i*131),far=(x,y)=>Math.hypot(x-WORLD.base.x,y-WORLD.base.y)>WORLD.base.r+60,sz=AREA[i]/(RW*RW),rp=m=>regRand(i,R,m);
      const kinds=[['debris','crater'],['spike','frost'],['rock','vent'],['crystal','shard'],['shroom','fern'],['float','star']][i];
      for(let k=0;k<Math.round(70*sz);k++){const {x,y}=rp(20);if(far(x,y)&&Math.hypot(x-WORLD.moon.x,y-WORLD.moon.y)>140)props.push({x,y,k:kinds[k%2],s:0.7+R()*0.8,reg:i})}
      if(i===2)for(let k=0;k<9;k++){const {x,y}=rp(110);pools.push({x,y,r:40+R()*36})}
      for(let k=0;k<Math.round(WORLD.nodes*Math.max(0.7,sz));k++){const {x,y}=rp(60);if(far(x,y))nodes.push({x,y,reg:i,cd:0,prog:0})}
      let g=rp(160);if(i===0)for(let k=0;k<40;k++){const q=rp(160);if(Math.hypot(q.x-WORLD.base.x,q.y-WORLD.base.y)>Math.hypot(g.x-WORLD.base.x,g.y-WORLD.base.y))g=q}   // the home guardian lives as far from the dome (and the building zone) as possible
      guards.push({reg:i,x:g.x,y:g.y,hx:g.x,hy:g.y});const q=rp(150);pois.push({reg:i,x:q.x,y:q.y})}}
  /* ---------- player stats come from the colony and the gear workshop ---------- */
  const weap=()=>WORLD.WEAP.find(w=>w.id===(st.wp||'rifle'))||WORLD.WEAP[0],wLv=id=>(st.wu||{})[id]||1;
  function stats(){const B=typeof survBonus==='function'?survBonus():{dmg:0,hp:0,rate:0},P=WORLD.player,lv=st.lv||1,w=weap();
    return {max:Math.round(P.hp+WORLD.heroHp*(lv-1)+B.hp),dmg:P.dmg*Math.pow(WORLD.heroDmg,lv-1)*(1+B.dmg/100)*w.mul*(1+0.25*(wLv(w.id)-1)),rate:w.rate*(1+B.rate/100)}}
  function restat(full){const s=stats(),r=p.hp/p.max;p.max=s.max;p.dmg=s.dmg;p.rate=s.rate;p.hp=full?s.max:Math.max(1,Math.round(s.max*r))}
  function newPlayer(){const s=stats(),b=WORLD.base;let x=st.x||b.x,y=st.y||b.y+b.r+30;const r0=regAt(x,y);if(r0<0||!open(r0)){x=b.x;y=b.y+b.r+30}   // the map changed shape (Nov 2026): a saved spot in a closed region goes home
    return {x,y,hp:s.max,max:s.max,dmg:s.dmg,rate:s.rate,cd:0,aim:-Math.PI/2,moving:false,hurt:0,dead:0,r:14}}
  /* ---------- monsters ---------- */
  function monStats(reg,big,lv){const M=big?WORLD.mon.big:WORLD.mon.small;lv=lv||WORLD.LV[reg];return {lv,hp:Math.round(M.hp*Math.pow(WORLD.hpGrow,lv-1)),dmg:M.dmg*Math.pow(WORLD.dmgGrow,lv-1),spd:M.spd,r:M.r}}
  // monsters get stronger the farther they are from the dome inside their band
  const bandLv=(reg,x,y)=>{const d=Math.hypot(x-WORLD.base.x,y-WORLD.base.y)/RW;return WORLD.LV[reg]+Math.min(4,Math.floor(Math.random()*2+(reg?d-0.5:d*3)))};
  function spawnMon(){if(mons.filter(m=>!m.guard).length>=WORLD.maxMon)return;
    for(let tries=0;tries<6;tries++){const SP=WORLD.spawn,a=Math.random()*6.283,d=rnd(SP.d0,SP.d1),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d,reg=regAt(x,y);
      if(reg<0||!open(reg)||Math.hypot(x-WORLD.base.x,y-WORLD.base.y)<WORLD.base.r+120)continue;
      const n=SP.min+Math.floor(Math.random()*(SP.max-SP.min+1));for(let k=0;k<n;k++){const big=k===0&&Math.random()<0.45,lv=Math.max(1,bandLv(reg,x,y)+(big?1:0)),s=monStats(reg,big,lv);
        mons.push({x:x+rnd(-40,40),y:y+rnd(-40,40),reg,big,lv,hp:s.hp,max:s.hp,dmg:s.dmg,spd:s.spd*rnd(0.85,1.15),r:s.r,wx:0,wy:0,wt:0,hit:0,fl:0})}return}}
  function wakeGuard(g){const now=Date.now(),cd=(st.gd||{})[g.reg]||0;if(g.alive||now<cd||!open(g.reg))return;
    const lv=WORLD.LV[g.reg]+WORLD.guard.lvOver,hp=Math.round(WORLD.guard.hp*Math.pow(WORLD.hpGrow,lv-1)),dmg=WORLD.guard.dmg*Math.pow(WORLD.dmgGrow,lv-1);g.alive=true;mons.push({guard:g,lv,x:g.hx,y:g.hy,reg:g.reg,big:true,hp,max:hp,dmg,spd:WORLD.guard.spd,r:WORLD.guard.r,t1:2.5,t2:6,hit:0,fl:0})}
  /* ---------- update ---------- */
  function input(){let mx=0,my=0;if(keys.ArrowLeft||keys.a)mx--;if(keys.ArrowRight||keys.d)mx++;if(keys.ArrowUp||keys.w)my--;if(keys.ArrowDown||keys.s)my++;
    if(joy&&joy.on){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,L=Math.hypot(dx,dy);if(L>8){mx=dx/Math.max(L,40);my=dy/Math.max(L,40)}}
    const L=Math.hypot(mx,my);if(L>1){mx/=L;my/=L}
    if(view==='3d'){const f={x:Math.cos(cam.yaw),y:Math.sin(cam.yaw)},r={x:-f.y,y:f.x};return {x:f.x*-my+r.x*mx,y:f.y*-my+r.y*mx,fw:-my}}
    return {x:mx,y:my,fw:0}}
  function say(s){if(t<msgT)return;msgT=t+2.5;toast(s)}
  function update(dt){t+=dt;if(p.dead>0){p.dead-=dt;if(p.dead<=0){const b=WORLD.base;p.x=b.x;p.y=b.y+b.r+30;p.hp=p.max;p.hurt=0}return}
    const mv=input(),sp=WORLD.player.spd*(1+(typeof shipFx==='function'?shipFx('drive'):0));p.moving=Math.hypot(mv.x,mv.y)>0.05;
    if(p.moving){let nx=p.x+mv.x*sp*dt,ny=p.y+mv.y*sp*dt;nx=clamp(nx,10,WW-10);ny=clamp(ny,10,WH-10);const reg=regAt(nx,ny);
      if(reg>=0&&!open(reg)){ // walking into a closed region: discover it if the colony is ready, else bounce
        if(gateOk(reg)){discover(reg);if(typeof regionPanorama==='function'&&!panoSeen(reg))regionPanorama(reg)}
        else{say('🔒 '+PLN[reg].n+': '+gateTxt(reg));nx=p.x;ny=p.y}}
      if(typeof WB!=='undefined'){const q={x:nx,y:ny};WB.push(q,p.r*0.8,0,true);nx=q.x;ny=q.y}   // base walls block the hero
      p.x=nx;p.y=ny;p.face=Math.atan2(mv.y,mv.x);if(view==='2d'||mv.fw>0.3)p.aim=p.face}
    if(view==='3d'&&p.moving&&mv.fw>-0.2){const target=Math.atan2(mv.y,mv.x);let d=target-cam.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));cam.yaw+=d*Math.min(1,dt*1.6)}
    // dome: rest and heal; lava: burns
    const inBase=Math.hypot(p.x-WORLD.base.x,p.y-WORLD.base.y)<WORLD.base.r;if(inBase)p.hp=Math.min(p.max,p.hp+30*dt);
    for(const q of pools)if(Math.hypot(p.x-q.x,p.y-q.y)<q.r*0.85){hitP(14*dt,true);say('🔥 الحمم تحرقك!')}
    // auto-fire at the nearest monster
    p.cd-=dt;let tg=null,bd=WORLD.player.range;for(const m of mons){const d=Math.hypot(m.x-p.x,m.y-p.y)-m.r;if(d<bd){bd=d;tg=m}}
    if(tg&&p.cd<=0){const w=weap();p.cd=1/p.rate;const a=Math.atan2(tg.y-p.y,tg.x-p.x);if(view==='2d'||!p.moving)p.aim=a;
      const shot=b=>shots.push({x:p.x+Math.cos(b)*16,y:p.y+Math.sin(b)*16,vx:Math.cos(b)*560,vy:Math.sin(b)*560,l:0.6});
      if(w.kind==='shot')shot(a);else if(w.kind==='spread'){shot(a-0.22);shot(a);shot(a+0.22)}
      else if(w.kind==='slash'||w.kind==='nova'){if(bd>w.range&&w.kind==='slash'){p.cd=0.05}else{fx.push({k:w.kind,x:p.x,y:p.y,a,r:w.range,l:0.18});for(const m of mons){if(m.hp<=0)continue;const dd=Math.hypot(m.x-p.x,m.y-p.y)-m.r;if(dd>w.range)continue;if(w.kind==='slash'&&Math.abs(Math.atan2(Math.sin(Math.atan2(m.y-p.y,m.x-p.x)-a),Math.cos(Math.atan2(m.y-p.y,m.x-p.x)-a)))>1.1)continue;m.hp-=p.dmg;m.fl=0.08;if(m.hp<=0)kill(m)}}}
      else if(w.kind==='chain'){let cur=tg,hit=new Set(),px=p.x,py=p.y;for(let j=0;j<4&&cur;j++){hit.add(cur);fx.push({k:'bolt',x:px,y:py,x2:cur.x,y2:cur.y-cur.r,l:0.12});cur.hp-=p.dmg*(1-0.15*j);cur.fl=0.08;px=cur.x;py=cur.y;const was=cur;if(cur.hp<=0)kill(cur);
        let nb=null,nd=130;for(const m of mons){if(m.hp<=0||hit.has(m))continue;const d2=Math.hypot(m.x-was.x,m.y-was.y);if(d2<nd){nd=d2;nb=m}}cur=nb}}
      if(Math.random()<0.4)snd(w.kind==='slash'?'hit':'shoot')}
    for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.l-=dt;for(const m of mons){if(m.hp<=0)continue;if((m.x-s.x)**2+(m.y-s.y)**2<(m.r+4)**2){m.hp-=p.dmg;m.fl=0.08;s.l=0;if(m.hp<=0)kill(m);break}}}
    shots=shots.filter(s=>s.l>0);
    // monsters
    const E=BAL.world.enemy;for(const m of mons){if(m.hp<=0)continue;m.fl=Math.max(0,m.fl-dt);const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1;let vx=0,vy=0;
      if(m.guard){const hd=Math.hypot(m.x-m.guard.hx,m.y-m.guard.hy);
        if(d<420){vx=dx/d*m.spd;vy=dy/d*m.spd;m.t1-=dt;m.t2-=dt;
          if(!m.p2&&m.hp<=m.max*BAL.world.guard.phase2At){m.p2=1;snd('err');buzz([60,40,60]);toast('😡 '+'حارس '+PLN[m.reg].n+' غاضب!');fx.push({k:'rage',x:m.x,y:m.y,r:120,l:0.6})}
          if(m.t1<=0){m.t1=2.6/(m.p2?BAL.world.guard.fireMul:1);for(let k=0;k<10;k++){const a=k*0.628+t;eshots.push({x:m.x,y:m.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,l:2.4,dmg:m.dmg*0.6})}snd('err')}
          if(m.t2<=0){m.t2=7;for(let k=0;k<3+(m.p2?BAL.world.guard.summonBonus:0);k++){const s=monStats(m.reg,false,WORLD.LV[m.reg]),a=Math.random()*6.283;mons.push({x:m.x+Math.cos(a)*50,y:m.y+Math.sin(a)*50,reg:m.reg,big:false,lv:s.lv,hp:s.hp,max:s.hp,dmg:s.dmg,spd:s.spd,r:s.r,wt:0,hit:0,fl:0})}}}
        else if(hd>8){vx=(m.guard.hx-m.x)/hd*m.spd;vy=(m.guard.hy-m.y)/hd*m.spd;m.hp=Math.min(m.max,m.hp+m.max*0.05*dt)}}
      else if(m.st==='wind'){m.sT-=dt;if(m.sT<=0){m.st='lunge';m.sT=E.lungeMs/1000;m.hitDone=0}}
      else if(m.st==='lunge'){m.sT-=dt;vx=m.lx*m.spd*E.lungeMul;vy=m.ly*m.spd*E.lungeMul;if(!m.hitDone&&d<m.r+p.r+4){m.hitDone=1;hitP(m.dmg*E.hitMul,false)}if(m.sT<=0){m.st='rec';m.sT=E.recoverMs/1000}}
      else if(m.st==='rec'){m.sT-=dt;vx=dx/d*m.spd*0.35;vy=dy/d*m.spd*0.35;if(m.sT<=0)m.st=''}
      else if(d<m.r+p.r+E.reach){m.st='wind';m.sT=E.windupMs/1000;m.lx=dx/d;m.ly=dy/d}   // crouch and flash, then lunge where the hero WAS
      else if(m.raid&&d>220){const tx=m.tx-m.x,ty=m.ty-m.y,td=Math.hypot(tx,ty)||1;vx=tx/td*m.spd;vy=ty/td*m.spd;if(td<34)raidSteal(m)}   // raiders march on the base unless the hero is close
      else if(d<340){vx=dx/d*m.spd;vy=dy/d*m.spd}
      else{m.wt-=dt;if(m.wt<=0){m.wt=rnd(1.5,3.5);const a=Math.random()*6.283;m.wx=Math.cos(a)*m.spd*0.35;m.wy=Math.sin(a)*m.spd*0.35}vx=m.wx;vy=m.wy}
      let nx=m.x+vx*dt,ny=m.y+vy*dt;if(regAt(nx,ny)!==m.reg&&!m.guard){m.wt=0;nx=m.x;ny=m.y}
      const bd2=Math.hypot(nx-WORLD.base.x,ny-WORLD.base.y);if(bd2<WORLD.base.r+m.r){nx=m.x;ny=m.y}
      if(typeof WB!=='undefined'&&!m.guard){const q={x:nx,y:ny};WB.push(q,m.r*0.7,m.dmg*BAL.build.monDmg*dt);nx=q.x;ny=q.y}   // monsters stopped by a base piece claw at it
      const mvd=Math.hypot(nx-m.x,ny-m.y);m.mv=mvd>dt*4;m.ph=(m.ph||0)+mvd/(m.r*0.55);if(Math.abs(nx-m.x)>0.3)m.fx=nx<m.x?-1:1;
      m.x=nx;m.y=ny;if(m.guard&&d<m.r+p.r)hitP(m.dmg*dt,false)}
    mons=mons.filter(m=>m.hp>0&&(m.guard||m.raid||Math.hypot(m.x-p.x,m.y-p.y)<1300));
    for(const s of eshots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.l-=dt;if((s.x-p.x)**2+(s.y-p.y)**2<(p.r+5)**2){s.l=0;hitP(s.dmg,false)}}eshots=eshots.filter(s=>s.l>0);
    for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}parts=parts.filter(q=>q.l>0);for(const f of fx)f.l-=dt;fx=fx.filter(f=>f.l>0);
    // XP gems fly to the hero
    for(const o of orbs){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);if(d<110||o.pull){o.pull=1;const v=Math.min(520,180+(110-Math.min(110,d))*6);o.x+=dx/d*v*dt;o.y+=dy/d*v*dt}if(d<16){o.l=0;if(o.gp){st.gp=(st.gp||0)+1;snd('ach');float(p.x,p.y-40,'🧩 قطعة سلاح نادرة');toast('🧩 قطعة سلاح نادرة! تخفّض كلفة تطوير سلاح في الورشة');gSave('world',st)}else gainXP(o.v)}o.t=(o.t||0)+dt;if(o.t>40&&!o.gp)o.l=0}orbs=orbs.filter(o=>o.l!==0);
    // material nodes: stand on one to gather it
    const now=Date.now();for(const n of nodes){if(n.cd>now){n.prog=0;continue}const d=Math.hypot(n.x-p.x,n.y-p.y);if(d<30){n.prog+=dt;if(n.prog>=0.9){n.prog=0;n.cd=now+WORLD.nodeCd;const q=2+Math.floor(Math.random()*3);addMat(REG[n.reg].mat,q);st.mat=(st.mat||0)+q;snd('coin');float(n.x,n.y,'+'+q+' '+REG[n.reg].me);dirty()}}else n.prog=Math.max(0,n.prog-dt)}
    // signals: one-time story finds
    for(const o of pois){if((st.poi||{})[o.reg]||!open(o.reg))continue;if(Math.hypot(o.x-p.x,o.y-p.y)<34){st.poi=st.poi||{};st.poi[o.reg]=1;addMat(REG[o.reg].mat,WORLD.poi.mat);gain('c',WORLD.poi.c);addXP(40);snd('win');
      storyBox('📡 إشارة قديمة في '+PLN[o.reg].n,POIS[o.reg]+' · +'+WORLD.poi.mat+' '+REG[o.reg].me+' · +'+WORLD.poi.c+' 💎','رائع');dirty()}}
    for(const g of guards)if(!g.alive&&Math.hypot(g.hx-p.x,g.hy-p.y)<480)wakeGuard(g);
    if(Math.random()<dt*WORLD.spawn.rate)spawnMon();
    worldEvent(dt);raidTick(dt);
    {const B=BAL.world.bot,tx=p.x-26,ty=p.y-34,k=Math.min(1,dt*5);bot.x+=(tx-bot.x)*k;bot.y+=(ty-bot.y)*k;bot.cd-=dt;   // companion drone follows and helps
      if(bot.cd<=0&&p.dead<=0){let tg=null,bd=B.range;for(const m of mons){const d=Math.hypot(m.x-bot.x,m.y-bot.y)-m.r;if(d<bd){bd=d;tg=m}}
        if(tg){bot.cd=1/B.rate;const a=Math.atan2(tg.y-bot.y,tg.x-bot.x);bshots.push({x:bot.x,y:bot.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,l:0.6})}}
      for(const s of bshots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.l-=dt;for(const m of mons){if(m.hp<=0)continue;if((m.x-s.x)**2+(m.y-s.y)**2<(m.r+4)**2){m.hp-=p.dmg*B.dmgMul;m.fl=0.08;s.l=0;if(m.hp<=0)kill(m);break}}}bshots=bshots.filter(s=>s.l>0)}
    p.safe=Math.max(0,(p.safe||0)-dt);p.hurt=Math.max(0,p.hurt-dt);saveT-=dt;if(saveT<=0){saveT=4;st.x=Math.round(p.x);st.y=Math.round(p.y);gSave('world',st);if(st._d){st._d=0;colSave()}}
    hudTick()}
  const dirty=()=>{st._d=1};
  /* random world events: a monster invasion or a meteor shower; meteors mark the ground first so the hero walks out of them */
  /* ---------- raids on the built base: warning (longer with a powered radar) → a wave marches on the base → reward or losses ---------- */
  const RD={ph:'idle',t:BAL.build.raid.firstS,x:0,y:0,left:0,end:0};window.WRAID=RD;
  function raidTick(dt){const Rb=BAL.build.raid,c=typeof WB!=='undefined'&&WB.center();if(!c){RD.ph='idle';return}const b=col.base,lv=b.rl||0;
    if(RD.ph==='idle'){RD.t-=dt;if(RD.t>0)return;
      for(let k=0;k<24;k++){const a=Math.random()*6.283,x=c.x+Math.cos(a)*Rb.dist,y=c.y+Math.sin(a)*Rb.dist;if(regAt(x,y)===0&&Math.hypot(x-WORLD.base.x,y-WORLD.base.y)>WORLD.base.r+80){RD.x=x;RD.y=y;break}if(k===23){RD.t=20;return}}
      RD.radar=WB.radarOn();RD.ph='warn';RD.t=(RD.radar?Rb.warnRadar:Rb.warnBase)*(1+(typeof shipFx==='function'?shipFx('radar'):0));snd('err');buzz([40,60,40]);toast('⚠️ غارة تقترب من القاعدة!'+(RD.radar?' الرادار يحدد اتجاهها':''));return}
    if(RD.ph==='warn'){RD.t-=dt;if(RD.t>0)return;const n=Math.min(Rb.maxN,Rb.n0+lv*Rb.perLv),L0=WORLD.LV[0]+1+Math.floor(lv/2);
      for(let k=0;k<n;k++){const a=Math.random()*6.283,x=RD.x+Math.cos(a)*rnd(10,70),y=RD.y+Math.sin(a)*rnd(10,70),big=k%4===3,s=monStats(0,big,L0+(big?1:0));
        mons.push({x,y,reg:0,big,lv:L0+(big?1:0),hp:s.hp,max:s.hp,dmg:s.dmg,spd:s.spd*0.9,r:s.r,wx:0,wy:0,wt:0,hit:0,fl:0,raid:1,tx:c.x+rnd(-30,30),ty:c.y+rnd(-30,30)})}
      RD.ph='on';RD.end=Rb.timeoutS;RD.lost=0;snd('hit');toast('👾 الغارة بدأت: '+n+' وحوش تتجه إلى القاعدة');return}
    if(RD.ph==='on'){RD.end-=dt;const live=mons.filter(m=>m.raid&&m.hp>0);RD.left=live.length;
      if(!live.length){const W2=Rb.win,ok=!RD.lost;b.rl=lv+1;if(ok){col.res.c+=W2.c+lv;b.sc=(b.sc||0)+W2.sc;snd('win');toast('🛡️ صمدت القاعدة! +'+(W2.c+lv)+' 💎 +'+W2.sc+' ♻️','ach')}else{snd('ok');toast('🛡️ انتهت الغارة · نُهب '+RD.lost+' مرة. قوِّ الجدران والأبراج')}
        colSave();RD.ph='idle';RD.t=Rb.everyS;return}
      if(RD.end<=0){live.forEach(m=>{m.raid=0});RD.ph='idle';RD.t=Rb.everyS}}}
  function raidSteal(m){const S=BAL.build.raid.steal;m.hp=0;RD.lost=(RD.lost||0)+1;const tk={m:Math.min(S.m,Math.floor(col.res.m)),f:Math.min(S.f,Math.floor(col.res.f))};col.res.m-=tk.m;col.res.f-=tk.f;
    snd('err');buzz(30);say('💸 وحش نهب القاعدة: −'+tk.m+' ⛏️ −'+tk.f+' 🌱');for(let k=0;k<8&&parts.length<240;k++){const a=Math.random()*6.283;parts.push({x:m.x,y:m.y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,l:0.4,c:'#ff4d5e'})}}
  // the raid banner and the arrow toward the raid (the arrow needs a powered radar)
  function raidHud(){const el=hud&&hud.querySelector('.wraid');if(!el)return;if(RD.ph==='idle'){el.hidden=true;return}el.hidden=false;
    const near=RD.ph==='on'?mons.filter(m=>m.raid&&m.hp>0).sort((a,c)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(c.x-p.x,c.y-p.y))[0]:null,tx=near?near.x:RD.x,ty=near?near.y:RD.y;
    el.querySelector('span').textContent=RD.ph==='warn'?'⚠️ غارة على القاعدة بعد '+Math.ceil(RD.t)+'ث':'👾 غارة: '+RD.left+' متبقية';
    const ar=el.querySelector('i');ar.hidden=!RD.radar||Math.hypot(tx-p.x,ty-p.y)<120;if(!ar.hidden){const a=Math.atan2(ty-p.y,tx-p.x),th=view==='3d'?a-cam.yaw-Math.PI/2:a;ar.style.transform=`rotate(${th}rad)`}}
  function worldEvent(dt){const V=BAL.world.events,inB=Math.hypot(p.x-WORLD.base.x,p.y-WORLD.base.y)<WORLD.base.r+60;
    for(const q of mets){q.w-=dt;if(q.w<=0&&!q.hit){q.hit=1;fx.push({k:'boom',x:q.x,y:q.y,r:q.r,l:0.35});snd('hit');buzz(30);if(Math.hypot(p.x-q.x,p.y-q.y)<q.r)hitP(p.max*V.meteorDmg,false);if(typeof WB!=='undefined')WB.blast(q.x,q.y,q.r,BAL.build.meteorDmg);
      for(const m of mons)if(!m.guard&&m.hp>0&&Math.hypot(m.x-q.x,m.y-q.y)<q.r){m.hp-=p.dmg*2;m.fl=0.08;if(m.hp<=0)kill(m)}}}
    mets=mets.filter(q=>!q.hit);
    evT+=dt;if(evT<V.everyS||inB)return;evT=0;const reg=regAt(p.x,p.y);if(reg<0||!open(reg))return;const kind=V.types[evN++%V.types.length];
    if(kind==='invasion'){snd('err');toast('👾 غزو وحوش! '+V.invasionExtra+' وحوش تهاجم');for(let k=0;k<V.invasionExtra;k++){const a=k/V.invasionExtra*6.283,d=rnd(300,380),x=clamp(p.x+Math.cos(a)*d,10,WW-10),y=clamp(p.y+Math.sin(a)*d,10,WH-10);if(regAt(x,y)!==reg)continue;
      const big=k%4===0,lv=Math.max(1,bandLv(reg,x,y)+(big?1:0)),s=monStats(reg,big,lv);mons.push({x,y,reg,big,lv,hp:s.hp,max:s.hp,dmg:s.dmg,spd:s.spd,r:s.r,wx:0,wy:0,wt:0,hit:0,fl:0})}}
    else{snd('err');toast('☄️ مطر نيازك! ابتعد عن الدوائر الحمراء');for(let k=0;k<V.meteorN;k++){const a=Math.random()*6.283,d=k===0?0:rnd(60,260);mets.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,r:V.meteorR,w:V.meteorWarnMs/1000+k*0.18,w0:V.meteorWarnMs/1000+k*0.18})}}}
  function gainXP(n){st.xp=(st.xp||0)+n;st.lv=st.lv||1;let up=false;while(st.xp>=WORLD.xpNext(st.lv)){st.xp-=WORLD.xpNext(st.lv);st.lv++;up=true}
    if(up){restat(true);snd('ach');buzz([30,40,60]);float(p.x,p.y-50,'⬆️ المستوى '+st.lv);fx.push({k:'lvl',x:p.x,y:p.y,r:90,l:0.6});if(st.lv>=10)unlock('w_lv10');if(st.lv>=25)unlock('w_lv25');
      for(let i=1;i<6;i++)if(st.lv===WORLD.LV[i]&&(st.gk||{})[i-1]>0&&!open(i))gateReady(i);gSave('world',st)}}
  function hitP(n,quiet){if(p.dead>0||p.safe>0)return;if(typeof shipFx==='function')n*=1-shipFx('armor');p.hp-=n;if(!quiet)p.hurt=0.2;if(p.hp<=0){p.hp=0;p.dead=3;snd('lose');toast('💫 سقطت! تعود إلى القاعدة…');mons=mons.filter(m=>m.guard);eshots=[]}}
  function float(x,y,txt){parts.push({x,y,vx:0,vy:-40,l:1.1,txt})}
  function kill(m){m.hp=0;st.kills=(st.kills||0)+1;if(typeof WB!=='undefined')WB.onKill(m);for(let k=0;k<10&&parts.length<240;k++){const a=Math.random()*6.283;parts.push({x:m.x,y:m.y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,l:0.4,c:m.guard?'#ffd34d':'#ff9a6a'})}
    if(m.guard){const g=m.guard;g.alive=false;st.gd=st.gd||{};st.gd[g.reg]=Date.now()+WORLD.guard.cd;st.gq=st.gq||{};st.gq[g.reg]=0;const first=!(st.gk||{})[g.reg];st.gk=st.gk||{};st.gk[g.reg]=(st.gk[g.reg]||0)+1;
      const q=first?40:15,c=first?30:10;addMat(REG[g.reg].mat,q);gain('c',c);addXP(first?120:40);snd('win');buzz([40,60,80]);
      const nx=g.reg+1,ready=nx<6&&!open(nx)&&gateOk(nx);storyBox('🏆 هزمت حارس '+PLN[g.reg].n,'+'+q+' '+REG[g.reg].me+' '+REG[g.reg].mn+' · +'+c+' 💎'+(first?'':' · يعود بعد 5 دقائق أو بقتل '+WORLD.guard.kills+' وحشاً في منطقته'),'رائع',ready?()=>gateReady(nx):null);
      unlock('w_guard1');if(Object.keys(st.gk).length>=6)unlock('w_guard6');if(nx<6&&!open(nx)&&!ready)toast('🚪 بوابة '+PLN[nx].n+': '+gateTxt(nx))}
    else{guardTick(m.reg);const k=m.big?2:1;gain('m',Math.round(12*k*(1+m.reg)));gain('e',Math.round(8*k*(1+m.reg)));if(Math.random()<0.25){addMat(REG[m.reg].mat,1);float(m.x,m.y-10,'+1 '+REG[m.reg].me)}}
    {const v=Math.round((m.guard?WORLD.xp.guard:m.big?WORLD.xp.big:WORLD.xp.small)*(1+0.12*((m.lv||1)-1)));const n=m.guard?8:m.big?2:1;for(let j=0;j<n;j++)orbs.push({x:m.x+rnd(-14,14),y:m.y+rnd(-14,14),v:Math.ceil(v/n)})}
    {const G=BAL.world.gear,tier=((col.b&&col.b.hq)||1)+m.reg,ch=m.guard?G.guard:G.base+G.perTier*tier;if(Math.random()<ch)orbs.push({x:m.x,y:m.y-6,v:0,gp:1})}
    if(st.kills>=100)unlock('w_kill100');dirty()}
  // a sleeping guardian wakes early once enough monsters fall in its region
  function guardTick(reg){if(!((st.gd||{})[reg]>Date.now()))return;st.gq=st.gq||{};st.gq[reg]=(st.gq[reg]||0)+1;
    if(st.gq[reg]>=WORLD.guard.kills){st.gd[reg]=0;st.gq[reg]=0;snd('err');toast('👑 حارس '+PLN[reg].n+' استيقظ!')}}
  /* ---------- HUD (shared by both views) ---------- */
  function hudBuild(){hud=document.createElement('div');hud.className='whud';hud.innerHTML=`<div class="whp"><i></i><b></b></div><div class="whlv"><b></b><i><u></u></i></div><div class="whreg"></div><div class="whmat"></div><div class="wgd" hidden><small></small><i><u></u></i></div>
    <button type="button" class="wview" aria-label="تبديل المنظور">🎥 3D</button><button type="button" class="wforgeb" hidden>⚒️ ورشة الأسلحة</button><div class="wforge" hidden></div><canvas class="wmini" width="120" height="80"></canvas><div class="wjoy" hidden><i></i></div><div class="wraid" hidden><i aria-hidden="true">➤</i><span></span></div>`;stage.appendChild(hud);mini=hud.querySelector('.wmini');
    hud.querySelector('.wview').onclick=e=>{e.stopPropagation();setView(view==='2d'?'3d':'2d')};
    hud.querySelector('.wforgeb').onclick=e=>{e.stopPropagation();snd('tap');forge(true)};
    hud.querySelector('.wforge').addEventListener('pointerdown',e=>e.stopPropagation());
    hud.querySelector('.wforge').onclick=e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;const id=b.dataset.id,w=WORLD.WEAP.find(x=>x.id===id);
      if(b.dataset.x==='close'){forge(false);return}st.wo=st.wo||{rifle:1};st.wu=st.wu||{};
      if(b.dataset.x==='make'){for(const [k,n] of Object.entries(w.cost))if(matN(k)<n){snd('err');toast(`تحتاج ${n} ${matIcon(k)} ${matName(k)}`);return}for(const [k,n] of Object.entries(w.cost))col.wm.mat[k]-=n;st.wo[id]=1;st.wp=id;snd('win');toast('⚒️ صنعت '+w.n,'ach');if(Object.keys(st.wo).length>=5)unlock('w_weap5')}
      if(b.dataset.x==='eq'){st.wp=id;snd('tap')}
      if(b.dataset.x==='up'){const l=wLv(id),c=Object.assign({},WORLD.upCost(l)),usePart=(st.gp||0)>0;if(usePart)c.c=Math.ceil(c.c*(1-BAL.world.gear.discount));if(l>=5)return;if(col.res.c<c.c||matN(w.mat)<c.m){snd('err');toast(`تحتاج 💎 ${c.c} و${matIcon(w.mat)} ${c.m}`);return}col.res.c-=c.c;col.wm.mat[w.mat]-=c.m;if(usePart)st.gp--;st.wu[id]=l+1;snd('build');toast('⬆️ '+w.n+' · المستوى '+(l+1),'ach')}
      restat(false);gSave('world',st);colSave();forge(true)}}
  let forgeOn=false;
  function forge(on){forgeOn=on;const f=hud.querySelector('.wforge');f.hidden=!on;if(!on)return;st.wo=st.wo||{rifle:1};
    let h=`<div class="wfh"><b>⚒️ ورشة الأسلحة</b><button type="button" data-x="close" aria-label="إغلاق">✕</button></div><small>💎 ${fmtN(col.res.c)} · ${REG.map(R=>R.me+' '+matN(R.mat)).join(' ')}</small>`;
    if(st.gp)h+=`<small>🧩 ${st.gp} قطعة نادرة: كل قطعة تخفّض 💎 تطوير واحد ${Math.round(BAL.world.gear.discount*100)}%</small>`;
    for(const w of WORLD.WEAP){const own=st.wo[w.id],l=wLv(w.id),eq=(st.wp||'rifle')===w.id,c=Object.assign({},WORLD.upCost(l));if(st.gp)c.c=Math.ceil(c.c*(1-BAL.world.gear.discount));
      h+=`<div class="wfw${eq?' on':''}"><span class="ae">${w.em}</span><span class="an"><b>${w.n}${own?' · '+l+'/5':''}</b><small>${WTXT[w.kind]}</small>${own?'':`<small>${Object.entries(w.cost).map(([k,n])=>`${matIcon(k)} ${matN(k)}/${n}`).join(' · ')}</small>`}</span>
        ${own?`${eq?'<b class="ok">✅</b>':`<button type="button" class="btn" data-x="eq" data-id="${w.id}">جهّز</button>`}${l<5?`<button type="button" class="btn main" data-x="up" data-id="${w.id}">⬆️ 💎${c.c} ${matIcon(w.mat)}${c.m}</button>`:''}`:`<button type="button" class="btn main" data-x="make" data-id="${w.id}">اصنع</button>`}</div>`}
    f.innerHTML=h}
  const WTXT={shot:'طلقة واحدة سريعة على أقرب وحش',spread:'ثلاث طلقات مروحية',slash:'ضربة قريبة قوية تصيب كل من أمامك',chain:'برق يقفز بين أربعة وحوش',nova:'موجة حولك تصيب كل القريبين'};
  let hudLast='';function hudTick(){if(!hud)return;const r=Math.max(0,regAt(p.x,p.y));
    const lv=st.lv||1;hud.querySelector('.whlv b').textContent='⭐ '+lv;hud.querySelector('.whlv u').style.width=(100*(st.xp||0)/WORLD.xpNext(lv))+'%';
    const fb=hud.querySelector('.wforgeb'),inB=Math.hypot(p.x-WORLD.base.x,p.y-WORLD.base.y)<WORLD.base.r;if(fb.hidden===inB)fb.hidden=!inB;
    hud.querySelector('.whp i').style.width=(100*p.hp/p.max)+'%';hud.querySelector('.whp b').textContent=Math.min(p.max,Math.ceil(p.hp))+' / '+p.max;
    const line=PLN[r].em+' '+PLN[r].n;if(hudLast!==line){hudLast=line;hud.querySelector('.whreg').textContent=line}
    const gw=(st.gd||{})[r]-Date.now(),gs=gw>0?'  👑 '+Math.floor(gw/60000)+':'+String(Math.floor(gw/1000)%60).padStart(2,'0')+' · '+((st.gq||{})[r]||0)+'/'+WORLD.guard.kills:'';
    hud.querySelector('.whmat').textContent=REG[r].me+' '+matN(REG[r].mat)+'  ⚔️ '+(st.kills||0)+gs;
    const g=mons.find(m=>m.guard&&Math.hypot(m.x-p.x,m.y-p.y)<520),gb=hud.querySelector('.wgd');gb.hidden=!g;if(g){gb.querySelector('small').textContent='👑 حارس '+PLN[g.reg].n;gb.querySelector('u').style.width=(100*g.hp/g.max)+'%'}
    const j=hud.querySelector('.wjoy');if(joy&&joy.on){j.hidden=false;const rc=stage.getBoundingClientRect();j.style.left=(joy.ox-rc.left)+'px';j.style.top=(joy.oy-rc.top)+'px';const dx=joy.x-joy.ox,dy=joy.y-joy.oy,L=Math.min(36,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);j.firstChild.style.transform=`translate(${Math.cos(a)*L}px,${Math.sin(a)*L}px)`}else j.hidden=true;
    raidHud();if((t*4|0)%2===0)drawMini()}
  function drawMini(){const m=mini.getContext('2d'),k=120/WW;m.clearRect(0,0,120,80);
    if(!POLY)regTrace();m.save();m.scale(k,k);for(let i=0;i<6;i++){m.fillStyle=open(i)?WORLD.ground[i]:'#111';m.fill(P2D[i])}m.restore();
    m.strokeStyle='#ffffff40';m.strokeRect(0.5,0.5,119,79);m.fillStyle='#00e5ff';m.beginPath();m.arc(WORLD.base.x*k,WORLD.base.y*k,3,0,6.283);m.fill();
    for(const g of guards)if(open(g.reg)&&!((st.gd||{})[g.reg]>Date.now())){m.fillStyle='#ffd34d';m.fillRect(g.hx*k-2,g.hy*k-2,4,4)}
    for(const o of pois)if(open(o.reg)&&!(st.poi||{})[o.reg]){m.fillStyle='#ff7ad9';m.fillRect(o.x*k-1.5,o.y*k-1.5,3,3)}
    if(RD.ph!=='idle'&&RD.radar){m.fillStyle='#ff4d5e';m.globalAlpha=0.5+0.5*Math.sin(t*8);m.beginPath();m.arc(RD.x*k,RD.y*k,4,0,6.283);m.fill();m.globalAlpha=1;for(const q of mons)if(q.raid&&q.hp>0)m.fillRect(q.x*k-1,q.y*k-1,2,2)}
    m.fillStyle='#fff';m.beginPath();m.arc(p.x*k,p.y*k,2.6,0,6.283);m.fill()}
  /* ---------- 2D view ---------- */
  const PAT={},PROP={};
  function pat(i){if(PAT[i])return PAT[i];const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),R=seeded(11+i);g.fillStyle=WORLD.ground[i];g.fillRect(0,0,256,256);
    for(let k=0;k<70;k++){g.globalAlpha=0.18+R()*0.3;g.fillStyle=WORLD.spot[i];g.beginPath();g.ellipse(R()*256,R()*256,4+R()*22,3+R()*12,R()*3,0,6.283);g.fill()}
    if(i===5){g.globalAlpha=1;for(let k=0;k<40;k++){g.fillStyle='#fff';g.globalAlpha=0.3+R()*0.7;g.fillRect(R()*256,R()*256,1.4,1.4)}}
    if(i===1){g.globalAlpha=0.35;g.strokeStyle='#ffffff';for(let k=0;k<8;k++){g.beginPath();g.moveTo(R()*256,R()*256);g.lineTo(R()*256,R()*256);g.stroke()}}
    g.globalAlpha=1;return PAT[i]=ctx.createPattern(c,'repeat')}
  function propSpr(k){if(PROP[k])return PROP[k];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,56);
    const tri=(w,h,f,s)=>{g.fillStyle=f;g.beginPath();g.moveTo(-w,0);g.lineTo(0,-h);g.lineTo(w,0);g.closePath();g.fill();if(s){g.fillStyle=s;g.beginPath();g.moveTo(0,-h);g.lineTo(w,0);g.lineTo(0,0);g.fill()}};
    ({debris(){g.fillStyle='#8d8aa0';g.fillRect(-14,-10,22,10);g.fillStyle='#5d5a70';g.fillRect(-6,-18,10,8);g.fillStyle='#00e5ff';g.fillRect(-10,-7,4,2)},
      crater(){g.fillStyle='#00000040';g.beginPath();g.ellipse(0,-4,18,7,0,0,6.283);g.fill();g.strokeStyle='#ffffff30';g.lineWidth=2;g.stroke()},
      spike(){tri(9,40,'#e8f6ff','#9fd0ee');tri(6,26,'#d4efff','#8ac4e6')},
      frost(){g.strokeStyle='#5a8aa8';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(0,-34);g.stroke();g.fillStyle='#dff3ff';for(let k=0;k<4;k++){g.beginPath();g.ellipse(0,-14-k*7,14-k*3,5,0,0,6.283);g.fill()}},
      rock(){g.fillStyle='#2a1c1a';g.beginPath();g.moveTo(-16,0);g.lineTo(-10,-18);g.lineTo(6,-22);g.lineTo(16,0);g.fill();g.strokeStyle='#ff6a1f';g.lineWidth=1.5;g.beginPath();g.moveTo(-6,-4);g.lineTo(0,-14);g.lineTo(6,-6);g.stroke()},
      vent(){g.fillStyle='#3a2622';g.beginPath();g.ellipse(0,-4,14,6,0,0,6.283);g.fill();g.fillStyle='#ff7a2a';g.beginPath();g.ellipse(0,-5,7,3,0,0,6.283);g.fill()},
      crystal(){tri(8,38,'#e6dcff','#b9a2ee');g.translate(-9,0);tri(5,24,'#f0e8ff','#c8b4f4');g.translate(18,0);tri(5,20,'#f0e8ff','#c8b4f4')},
      shard(){tri(6,18,'#fff','#d0c4f0')},
      shroom(){g.fillStyle='#d8e8c0';g.fillRect(-4,-28,8,28);g.fillStyle='#3fae6a';g.beginPath();g.ellipse(0,-30,20,10,0,Math.PI,0);g.fill();g.fillStyle='#9affc0';g.globalAlpha=.7;g.beginPath();g.arc(-6,-33,2,0,6.283);g.arc(6,-31,2,0,6.283);g.fill()},
      fern(){g.strokeStyle='#2f8a52';g.lineWidth=3;for(const a of [-0.6,-0.2,0.2,0.6]){g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(a*30,-20,a*40,-30);g.stroke()}},
      float(){g.fillStyle='#4a3c6a';g.beginPath();g.ellipse(0,-26,14,9,0.3,0,6.283);g.fill();g.fillStyle='#00000040';g.beginPath();g.ellipse(0,-2,10,3,0,0,6.283);g.fill()},
      star(){g.fillStyle='#ff9ad8';g.globalAlpha=.8;g.beginPath();g.arc(0,-20,3,0,6.283);g.fill();g.globalAlpha=.3;g.beginPath();g.arc(0,-20,9,0,6.283);g.fill()}})[k]();
    return PROP[k]=c}
  const MATC={alloy:'#c8d0dc',ice:'#8fe0ff',magma:'#ff7a2a',quartz:'#d8b8ff',spore:'#7dffb0',gas:'#ff8ad8'};
  function draw2d(){const S=cv.width/W;ctx.setTransform(S,0,0,S,0,0);cam.x=p.x-W/2;cam.y=p.y-H*0.55;ctx.fillStyle='#05060f';ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(-cam.x,-cam.y);
    // organic ground: the region under the hero fills the screen, then every visible region is painted inside its own outline
    if(!POLY)regTrace();{const here=Math.max(0,regAt(p.x,p.y));ctx.fillStyle=pat(here);ctx.fillRect(Math.max(0,cam.x),Math.max(0,cam.y),Math.min(WW,cam.x+W)-Math.max(0,cam.x),Math.min(WH,cam.y+H)-Math.max(0,cam.y));
      for(let i=0;i<6;i++){const B=BOX[i];if(B.x0>cam.x+W||B.x1<cam.x||B.y0>cam.y+H||B.y1<cam.y)continue;ctx.fillStyle=pat(i);ctx.fill(P2D[i])}
      ctx.lineWidth=14;ctx.globalAlpha=0.28;for(let i=0;i<6;i++){const B=BOX[i];if(B.x0>cam.x+W||B.x1<cam.x||B.y0>cam.y+H||B.y1<cam.y)continue;ctx.strokeStyle=WORLD.spot[i];ctx.stroke(P2D[i])}ctx.globalAlpha=1}
    if(typeof WB!=='undefined')WB.floor2d(ctx,cam,W,H);
    for(const q of pools){if(Math.abs(q.x-p.x)>W||Math.abs(q.y-p.y)>H)continue;ctx.fillStyle='#ff5a1f';ctx.globalAlpha=0.85+0.1*Math.sin(t*3+q.x);ctx.beginPath();ctx.ellipse(q.x,q.y,q.r,q.r*0.62,0,0,6.283);ctx.fill();ctx.fillStyle='#ffd34d';ctx.globalAlpha=0.5;ctx.beginPath();ctx.ellipse(q.x,q.y,q.r*0.5,q.r*0.3,0,0,6.283);ctx.fill();ctx.globalAlpha=1}
    // base dome
    const b=WORLD.base,hq=img('hq');ctx.fillStyle='#00e5ff14';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();ctx.strokeStyle='#00e5ff88';ctx.lineWidth=2;ctx.stroke();
    if(hq){const w=120,h=w/(ART.hqR||1),c=sprC('hq',h);ctx.drawImage(c||hq,b.x-w/2,b.y-h*0.7,w,h)}
    // y-sorted things
    const L=[];const vis=(x,y)=>x>cam.x-80&&x<cam.x+W+80&&y>cam.y-80&&y<cam.y+H+120;
    for(const q of props)if(vis(q.x,q.y))L.push([q.y,()=>{const s=propSpr(q.k),z=q.s;ctx.drawImage(s,q.x-32*z,q.y-56*z,64*z,64*z)}]);
    for(let i=0;i<6;i++){const s=(col.wm&&col.wm.lm[i])||0;if(!s)continue;const k='pl'+i+'_s'+s,im=img(k),m=i===0?{x:b.x+260,y:b.y-40}:regMid(i);if(im&&vis(m.x,m.y)){const h=i===5&&s===3?170:120,w=h*(ART[k+'R']||1);L.push([m.y,()=>ctx.drawImage(sprC(k,h)||im,m.x-w/2,m.y-h,w,h)])}}
    const now=Date.now();for(const n of nodes)if(n.cd<now&&open(n.reg)&&vis(n.x,n.y))L.push([n.y,()=>{const c=MATC[REG[n.reg].mat];ctx.fillStyle='#00000050';ctx.beginPath();ctx.ellipse(n.x,n.y,12,4,0,0,6.283);ctx.fill();
      ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(n.x,n.y-26-2*Math.sin(t*3+n.x));ctx.lineTo(n.x+8,n.y-10);ctx.lineTo(n.x,n.y);ctx.lineTo(n.x-8,n.y-10);ctx.fill();ctx.shadowBlur=0;
      if(n.prog>0){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(n.x,n.y-12,18,-1.57,-1.57+6.283*n.prog/0.9);ctx.stroke()}}]);
    for(const o of pois)if(open(o.reg)&&!(st.poi||{})[o.reg]&&vis(o.x,o.y))L.push([o.y,()=>{ctx.font='26px sans-serif';ctx.textAlign='center';ctx.fillText('📡',o.x,o.y);ctx.strokeStyle='#ff7ad9';ctx.globalAlpha=0.5+0.5*Math.sin(t*4);ctx.beginPath();ctx.arc(o.x,o.y-8,22+6*Math.sin(t*4),0,6.283);ctx.stroke();ctx.globalAlpha=1}]);
    {const M=WORLD.moon,im=img('zone_moon');if(im&&vis(M.x,M.y)){const w=M.h*(ART.zone_moonR||1.5);L.push([M.y,()=>ctx.drawImage(sprC('zone_moon',M.h)||im,M.x-w/2,M.y-M.h*0.8,w,M.h)])}}
    if(typeof WB!=='undefined')WB.items2d(L,vis,ctx,t);
    for(const m of mons)if(vis(m.x,m.y))L.push([m.y,()=>drawMon(m)]);
    L.push([bot.y+40,drawBot]);
    L.push([p.y,drawPlayer]);L.sort((a,b)=>a[0]-b[0]);for(const x of L)x[1]();if(typeof WB!=='undefined')WB.roof2d(ctx,vis,t);
    for(const q of mets){const k=1-q.w/q.w0;ctx.strokeStyle='#ff4a3a';ctx.lineWidth=2;ctx.fillStyle='#ff4a3a33';ctx.beginPath();ctx.ellipse(q.x,q.y,q.r,q.r*0.62,0,0,6.283);ctx.fill();ctx.stroke();ctx.fillStyle='#ff4a3a66';ctx.beginPath();ctx.ellipse(q.x,q.y,q.r*k,q.r*0.62*k,0,0,6.283);ctx.fill();
      if(q.w<0.45){const hy=q.w*700;ctx.fillStyle='#ffb04a';ctx.beginPath();ctx.arc(q.x+hy*0.3,q.y-hy,7,0,6.283);ctx.fill()}}
    for(const o of orbs){if(o.gp){ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText('🧩',o.x,o.y+6+2*Math.sin(t*5));continue}ctx.fillStyle='#7dff9a';ctx.shadowColor='#7dff9a';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(o.x,o.y-6);ctx.lineTo(o.x+4,o.y);ctx.lineTo(o.x,o.y+6);ctx.lineTo(o.x-4,o.y);ctx.fill();ctx.shadowBlur=0}
    for(const f of fx){ctx.globalAlpha=Math.min(1,f.l*6);if(f.k==='slash'){ctx.strokeStyle='#ffe27a';ctx.lineWidth=6;ctx.beginPath();ctx.arc(f.x,f.y-10,f.r*0.85,f.a-1.1,f.a+1.1);ctx.stroke()}
      else if(f.k==='boom'||f.k==='rage'){ctx.fillStyle=f.k==='boom'?'#ffb04a':'#ff3a3a';ctx.globalAlpha=Math.min(0.7,f.l*3);ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*(1.2-f.l),f.r*0.62*(1.2-f.l),0,0,6.283);ctx.fill()}
      else if(f.k==='nova'||f.k==='lvl'){ctx.strokeStyle=f.k==='lvl'?'#7dff9a':'#ff8ad8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y-8,Math.max(0,f.r*(1-f.l*2)),0,6.283);ctx.stroke()}
      else if(f.k==='bolt'){ctx.strokeStyle='#bfe9ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y-14);ctx.lineTo((f.x+f.x2)/2+rnd(-8,8),(f.y+f.y2)/2+rnd(-8,8));ctx.lineTo(f.x2,f.y2);ctx.stroke()}ctx.globalAlpha=1}
    ctx.fillStyle='#7ffcff';for(const s of shots){ctx.beginPath();ctx.arc(s.x,s.y,3.2,0,6.283);ctx.fill()}
    ctx.fillStyle='#ff5a8a';for(const s of eshots){ctx.beginPath();ctx.arc(s.x,s.y,5,0,6.283);ctx.fill()}
    for(const q of parts){if(q.txt){ctx.globalAlpha=Math.min(1,q.l*2);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(q.txt,q.x,q.y)}else{ctx.globalAlpha=q.l*2;ctx.fillStyle=q.c;ctx.fillRect(q.x-2,q.y-2,4,4)}ctx.globalAlpha=1}
    // closed regions sit under a dark fog
    let lab=null,labD=260;for(let i=0;i<6;i++){if(open(i))continue;for(const [x,y] of POLY[i]){const d=Math.hypot(x-p.x,y-p.y);if(d<labD){labD=d;const S=SD[i],e=Math.hypot(S.x-x,S.y-y)||1;lab=[i,x+(S.x-x)/e*60,y+(S.y-y)/e*60]}}}
    for(let i=0;i<6;i++){if(open(i))continue;ctx.fillStyle='#000000b0';ctx.fill(P2D[i]);
      const cx=lab&&lab[1],cy=lab&&lab[2];if(lab&&lab[0]===i){ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('🔒 '+PLN[i].n,cx,cy);ctx.font='12px sans-serif';ctx.fillStyle='#ffd34d';ctx.fillText(gateOk(i)?'🚪 مفتوحة، ادخل':gateTxt(i),cx,cy+18)}}
    ctx.restore();if(p.dead>0){ctx.fillStyle='#000a';ctx.fillRect(0,0,W,H)}}
  /* pinned sprite canvases: every painting is drawn once at its on-screen pixel size (4px buckets) and reused every frame.
     The hit flash is baked in too, so no ctx.filter per frame (slow on phones). */
  const SC=new Map();
  function sprC(k,h,flash){const im=img(k);if(!im)return null;const S=cv.width/W,ph=Math.max(8,Math.ceil(h*S/4)*4),key=k+'|'+ph+(flash?'f':'');let c=SC.get(key);if(c)return c;
    const R=ART[k+'R']||im.naturalWidth/im.naturalHeight;c=document.createElement('canvas');c.height=ph;c.width=Math.max(4,Math.round(ph*R));const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,c.width,ph);
    if(flash){g.globalCompositeOperation='source-atop';g.fillStyle='#ffffffb0';g.fillRect(0,0,c.width,ph)}if(SC.size>400)SC.clear();SC.set(key,c);return c}
  // creatures painted in the air get real legs so everything walks on the ground
  const c2=k=>!!(ART[k+'_w1']&&ART[k+'_w2']);   // two walking frames from Gemini replace the split-leg trick
  const LEGS={pl0_small:1,pl3_small:1,pl5_small:1,pl5_big:1};   // ART.<key>Legs=1 (art with painted legs) switches these off
  function legs(w,h,lh,ph,mv,col){const st=mv?Math.sin(ph):0,lw=Math.max(2,h*0.075);ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of [-1,1]){const sw=st*s,hx=s*w*0.13,hy=-lh,fx=hx+sw*w*0.16,fy=-Math.max(0,sw)*lh*0.35,kx=(hx+fx)/2+w*0.07,ky=(hy+fy)/2;
      ctx.strokeStyle=s<0?'#1b2030':col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(kx,ky);ctx.lineTo(fx,fy);ctx.stroke();
      ctx.fillStyle=s<0?'#1b2030':col;ctx.beginPath();ctx.ellipse(fx+lw*0.5,fy-lw*0.2,lw*0.9,lw*0.5,0,0,6.283);ctx.fill()}}
  const monKey=m=>{if(m.sk===undefined)m.sk=m.reg===0&&!m.big&&!m.guard&&ART.pl0_spider&&Math.random()<0.5?'pl0_spider':'';return m.sk||'pl'+m.reg+'_'+(m.big?'big':'small')};   // space spider = second small monster of المدار-1
  function drawMon(m){const k=monKey(m),R=ART[k+'R']||1,h=m.guard?m.r*3.4:m.r*2.8,w=h*R,flip=(m.fx||(p.x>m.x?1:-1))>0,c=sprC(k,h,m.fl>0);
    const ph=m.ph||0,mv=!!m.mv&&m.st!=='wind',bob=mv?Math.abs(Math.cos(ph))*h*0.05:(1+Math.sin(t*2.2+m.x))*h*0.008,tilt=mv?Math.sin(ph)*0.05:0,leg=LEGS[k]&&!ART[k+'Legs']&&!c2(k)?h*0.3:0;
    ctx.fillStyle='#00000066';ctx.beginPath();ctx.ellipse(m.x,m.y,w*0.3*(1-bob/h),4.5,0,0,6.283);ctx.fill();
    if(m.st==='wind'){const k=1-m.sT/(BAL.world.enemy.windupMs/1000);ctx.strokeStyle='#ff4a3a';ctx.lineWidth=2;ctx.globalAlpha=0.5+0.5*k;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x+m.lx*(m.r+BAL.world.enemy.reach)*k,m.y+m.ly*(m.r+BAL.world.enemy.reach)*k);ctx.stroke();ctx.beginPath();ctx.ellipse(m.x,m.y,w*0.38,7,0,0,6.283);ctx.stroke();ctx.globalAlpha=1}
    if(m.p2){ctx.strokeStyle='#ff3a3a';ctx.globalAlpha=0.4+0.3*Math.sin(t*8);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(m.x,m.y,w*0.5,12,0,0,6.283);ctx.stroke();ctx.globalAlpha=1}
    if(m.guard){ctx.strokeStyle='#ffd34d';ctx.globalAlpha=0.6;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(m.x,m.y,w*0.45,10,0,0,6.283);ctx.stroke();ctx.globalAlpha=1}
    ctx.save();ctx.translate(m.x,m.y);if(flip)ctx.scale(-1,1);if(m.st==='wind')ctx.scale(1.08,0.88);else if(m.st==='lunge')ctx.scale(0.92,1.1);
    if(!c){ctx.fillStyle='#c060ff';ctx.beginPath();ctx.arc(0,-m.r,m.r,0,6.283);ctx.fill()}
    else if(c2(k)){const f=sprC(k+'_w'+(mv?(Math.sin(ph)>0?1:2):1),h,m.fl>0)||c;ctx.translate(0,-bob);ctx.rotate(tilt);ctx.drawImage(f,-w/2,-h,w,h)}
    else if(leg){legs(w,h,leg+bob,ph,mv,WORLD.spot[m.reg]);ctx.translate(0,-leg-bob);ctx.rotate(tilt);ctx.drawImage(c,-w/2,-h*0.92,w,h*0.92)}
    else{const cw=c.width,ch=c.height,cut=0.68,lift=mv?h*0.09:0,fw=mv?Math.cos(ph)*w*0.05:0,a=mv?Math.max(0,Math.sin(ph)):0,b=mv?Math.max(0,-Math.sin(ph)):0,lb=h*(1-cut);
      // lower band split in two: each half is a leg group that lifts and swings in turn
      ctx.drawImage(c,0,ch*cut,cw/2,ch*(1-cut),-w/2+fw,-lb-a*lift,w/2,lb);
      ctx.drawImage(c,cw/2,ch*cut,cw/2,ch*(1-cut),-fw,-lb-b*lift,w/2,lb);
      ctx.translate(0,-lb);ctx.rotate(tilt);const ov=0.07;ctx.drawImage(c,0,0,cw,ch*(cut+ov),-w/2,-h*cut-bob,w,h*(cut+ov))}
    ctx.restore();const top=m.y-h-leg-bob;
    if(m.hp<m.max&&!m.guard){ctx.fillStyle='#0008';ctx.fillRect(m.x-14,top-8,28,4);ctx.fillStyle='#ff5a6a';ctx.fillRect(m.x-14,top-8,28*m.hp/m.max,4)}
    if(m.lv){const lv=st.lv||1;ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle=m.lv>lv+3?'#ff5a6a':m.lv>lv?'#ffd34d':'#ffffffcc';ctx.fillText('Lv'+m.lv,m.x,top-11)}}
  function drawBot(){if(p.dead>0)return;const im=img('bot'),h=24,w=h*(ART.botR||1),z=Math.sin(t*3)*3;ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(bot.x,bot.y+30,8,3,0,0,6.283);ctx.fill();
    if(im)ctx.drawImage(sprC('bot',h)||im,bot.x-w/2,bot.y-h/2+z,w,h);else{ctx.fillStyle='#f3f4f7';ctx.beginPath();ctx.arc(bot.x,bot.y+z,9,0,6.283);ctx.fill()}
    ctx.fillStyle='#7ffcff';for(const s of bshots){ctx.beginPath();ctx.arc(s.x,s.y,2.4,0,6.283);ctx.fill()}}
  function drawPlayer(){if(p.dead>0)return;if(typeof Astro3D!=='undefined'&&Astro3D.draw(ctx,p.x,p.y+p.r*0.6,p.r*4.4,p.aim,p.moving,t,p.hurt,'#00e5ff',false))return;
    ctx.fillStyle='#f3f4f7';ctx.beginPath();ctx.arc(p.x,p.y-14,12,0,6.283);ctx.fill();ctx.fillStyle='#0b1530';ctx.beginPath();ctx.arc(p.x+Math.cos(p.aim)*4,p.y-15,6,0,6.283);ctx.fill()}
  /* ---------- 3D view (three.js): same world, camera behind the astronaut ---------- */
  function make3D(){if(typeof THREE==='undefined')return null;let R;try{R=new THREE.WebGLRenderer({canvas:c3,antialias:false,powerPreference:'low-power'})}catch(e){return null}
    R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.2;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(56,1,1,3000);
    // depth without washing out: the fog starts far and keeps the region's colour, deepened toward the navy UI tone
    const deep=c=>new THREE.Color(c).lerp(new THREE.Color(0x070b16),0.35);scene.fog=new THREE.Fog(deep(WORLD.fog[0]),620,1750);scene.background=deep(WORLD.fog[0]);
    // Pixar-like light: soft sky/ground fill, a warm key light and a cyan rim from behind
    const hemi=new THREE.HemisphereLight(0xd8ecff,0x3a2a4a,0.85);scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xfff0d8,1.9);scene.add(sun);scene.add(sun.target);
    const rim=new THREE.DirectionalLight(0x6fe9ff,0.7);scene.add(rim);scene.add(rim.target);
    const TX={},tex=k=>{if(TX[k])return TX[k];const im=img(k);if(!im)return null;const T=new THREE.Texture(im);T.needsUpdate=true;T.colorSpace&&(T.colorSpace=THREE.SRGBColorSpace);return TX[k]=T};
    // sky dome with a gradient and stars (not fogged), it follows the camera
    const sky=(()=>{const c=document.createElement('canvas');c.width=4;c.height=256;const g=c.getContext('2d'),G=g.createLinearGradient(0,0,0,256);G.addColorStop(0,'#04060f');G.addColorStop(0.45,'#0d1530');G.addColorStop(0.62,'#2a2250');G.addColorStop(0.72,'#6a5a9a');G.addColorStop(1,'#1a1428');g.fillStyle=G;g.fillRect(0,0,4,256);
      const T=new THREE.CanvasTexture(c);T.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.SphereGeometry(2400,24,16),new THREE.MeshBasicMaterial({map:T,side:THREE.BackSide,fog:false,depthWrite:false}));m.renderOrder=-2;scene.add(m);
      const P=[],R2=seeded(77);for(let k=0;k<500;k++){const a=R2()*6.283,e=0.15+R2()*1.3;P.push(Math.cos(a)*Math.cos(e)*2300,Math.sin(e)*2300,Math.sin(a)*Math.cos(e)*2300)}
      const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));const st2=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:3,sizeAttenuation:false,fog:false,transparent:true,opacity:0.85,depthWrite:false}));m.add(st2);return m})();
    // soft round shadow used under the astronaut, the drone and the monsters (no real shadow maps: cheap on phones)
    const blobT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),G=g.createRadialGradient(32,32,2,32,32,31);G.addColorStop(0,'rgba(0,0,0,.55)');G.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=G;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
    const blobM=new THREE.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false}),blobG=new THREE.PlaneGeometry(1,1);
    const blob=(w)=>{const m=new THREE.Mesh(blobG,blobM);m.rotation.x=-Math.PI/2;m.scale.set(w,w*0.7,1);m.position.y=0.35;m.renderOrder=-1;scene.add(m);return m};
    // organic ground: one shape per region outline, with a richer painted texture (blotches, speckles, small craters)
    if(!POLY)regTrace();{const u=new THREE.Mesh(new THREE.PlaneGeometry(WW,WH),new THREE.MeshLambertMaterial({color:WORLD.ground[0]}));u.rotation.x=-Math.PI/2;u.position.set(WW/2,-0.6,WH/2);scene.add(u)}
    const gmat=[];for(let i=0;i<6;i++){const cnv=document.createElement('canvas');cnv.width=cnv.height=512;const g=cnv.getContext('2d'),R2=seeded(301+i*17);g.fillStyle=pat(i);g.fillRect(0,0,512,512);
      for(let k=0;k<26;k++){const x=R2()*512,y=R2()*512,r=30+R2()*90,G=g.createRadialGradient(x,y,1,x,y,r),dark=R2()<0.5;G.addColorStop(0,dark?'rgba(0,0,0,.22)':WORLD.spot[i]+'88');G.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=G;
        for(const [ox,oy] of [[0,0],[512,0],[-512,0],[0,512],[0,-512]]){g.save();g.translate(ox,oy);g.fillRect(x-r,y-r,r*2,r*2);g.restore()}}
      for(let k=0;k<900;k++){g.fillStyle=R2()<0.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.12)';const s2=1+R2()*2.5;g.fillRect(R2()*512,R2()*512,s2,s2)}
      for(let k=0;k<7;k++){const x=40+R2()*432,y=40+R2()*432,r=6+R2()*14;g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=2.5;g.beginPath();g.ellipse(x,y,r,r*0.7,0,0,6.283);g.stroke();g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=1.2;g.beginPath();g.ellipse(x,y+1.5,r,r*0.7,0,0.2,2.9);g.stroke()}
      const T=new THREE.CanvasTexture(cnv);T.colorSpace=THREE.SRGBColorSpace;T.wrapS=T.wrapT=THREE.RepeatWrapping;T.repeat.set(1/240,1/240);T.anisotropy=Math.min(4,R.capabilities.getMaxAnisotropy());
      const M=new THREE.MeshStandardMaterial({map:T,roughness:0.95,metalness:0,color:open(i)?0xffffff:0x222222});gmat[i]=M;
      const sh=new THREE.Shape();POLY[i].forEach(([x,y],k)=>k?sh.lineTo(x,-y):sh.moveTo(x,-y));const pl=new THREE.Mesh(new THREE.ShapeGeometry(sh),M);pl.rotation.x=-Math.PI/2;scene.add(pl)}
    // props: faceted low-poly meshes (flat shading), each instance with its own size, tilt and shade; crystals grow in clusters and glow
    const rockG=(()=>{const g=new THREE.IcosahedronGeometry(14,0),P2=g.attributes.position,R2=seeded(5);for(let k=0;k<P2.count;k++)P2.setXYZ(k,P2.getX(k)*(0.8+R2()*0.4),P2.getY(k)*(0.6+R2()*0.35),P2.getZ(k)*(0.8+R2()*0.4));g.computeVertexNormals();return g})();
    const GEO={spike:new THREE.ConeGeometry(8,40,5),crystal:new THREE.OctahedronGeometry(10,0),shard:new THREE.ConeGeometry(5,20,4),rock:rockG,debris:new THREE.BoxGeometry(24,10,16),
      frost:new THREE.ConeGeometry(12,34,6),shroom:new THREE.CylinderGeometry(20,5,22,9),fern:new THREE.ConeGeometry(11,28,6),float:new THREE.DodecahedronGeometry(13,0),vent:new THREE.CylinderGeometry(12,15,5,10),crater:new THREE.TorusGeometry(16,3,5,14),star:new THREE.OctahedronGeometry(4,0)};
    GEO.crystal.scale(0.8,2.2,0.8);
    const COLR={spike:0xe8f6ff,crystal:0xc9b4ff,shard:0xf2eaff,rock:0x4a3a3e,debris:0xa8b0c0,frost:0xd6f0ff,shroom:0x45c47a,fern:0x2f9a58,float:0x5a4c80,vent:0xff6a1f,crater:0x5a4466,star:0xff9ad8};
    const GLOWK={vent:1,star:1,crystal:1,shard:1,spike:0.25,frost:0.2},CLUST={crystal:3,shard:3,spike:2,frost:2,fern:2};
    const dummy=new THREE.Object3D(),tint=new THREE.Color();for(const k of Object.keys(GEO)){const L=props.filter(q=>q.k===k);if(!L.length)continue;const em=GLOWK[k]||0,n=CLUST[k]||1,R2=seeded(k.length*97);
      const M=new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true,roughness:em?0.25:0.85,metalness:em?0.15:0.05,emissive:em?COLR[k]:0x000000,emissiveIntensity:em?0.45*em:0});const I=new THREE.InstancedMesh(GEO[k],M,L.length*n);let j=0;
      for(const q of L)for(let c2=0;c2<n;c2++){const s2=q.s*(c2?0.45+R2()*0.35:1),ox=c2?(R2()-0.5)*26*q.s:0,oz=c2?(R2()-0.5)*20*q.s:0,hgt=k==='float'?26:k==='crater'?1:k==='vent'?2.5:k==='rock'?6*s2:(GEO[k].parameters.height||24)/2*s2*(k==='crystal'?2.2:1);
        dummy.position.set(q.x+ox,hgt,q.y+oz);dummy.rotation.set(k==='crater'?Math.PI/2:(R2()-0.5)*(c2?0.7:0.25),R2()*6.283,(R2()-0.5)*(c2?0.6:0.2));dummy.scale.setScalar(s2);dummy.updateMatrix();I.setMatrixAt(j,dummy.matrix);
        tint.setHex(COLR[k]).offsetHSL((R2()-0.5)*0.04,(R2()-0.5)*0.1,(R2()-0.5)*0.12);I.setColorAt(j,tint);j++}
      scene.add(I)}
    for(const q of pools){const m=new THREE.Mesh(new THREE.CircleGeometry(q.r,20),new THREE.MeshBasicMaterial({color:0xff5a1f}));m.rotation.x=-Math.PI/2;m.scale.y=0.62;m.position.set(q.x,0.6,q.y);scene.add(m)}
    // the dome and the HQ
    const b=WORLD.base;{const dg=new THREE.SphereGeometry(b.r,32,14,0,Math.PI*2,0,Math.PI/2);const glass=new THREE.Mesh(dg,new THREE.MeshStandardMaterial({color:0x9ff0ff,transparent:true,opacity:0.12,roughness:0.1,metalness:0.2,depthWrite:false}));glass.position.set(b.x,0,b.y);scene.add(glass);
      const wire=new THREE.Mesh(dg,new THREE.MeshBasicMaterial({color:0x00e5ff,wireframe:true,transparent:true,opacity:0.22}));wire.position.copy(glass.position);scene.add(wire);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(b.r,3,8,48),new THREE.MeshStandardMaterial({color:0xf5c451,metalness:0.6,roughness:0.35}));ring.rotation.x=Math.PI/2;ring.position.set(b.x,1.5,b.y);scene.add(ring)}
    const spr=(k,h)=>{const T=tex(k);if(!T)return null;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:T,transparent:true,alphaTest:0.1}));const w=h*(ART[k+'R']||1);s.scale.set(w,h,1);s.center.set(0.5,0);return s};
    const hq=spr('hq',90);if(hq){hq.position.set(b.x,0,b.y);scene.add(hq)}
    for(let i=0;i<6;i++){const s=(col.wm&&col.wm.lm[i])||0;if(!s)continue;const m=i===0?{x:b.x+260,y:b.y-40}:regMid(i),L=spr('pl'+i+'_s'+s,i===5&&s===3?170:120);if(L){L.position.set(m.x,0,m.y);scene.add(L)}}
    {const L=spr('zone_moon',WORLD.moon.h);if(L){L.position.set(WORLD.moon.x,0,WORLD.moon.y);scene.add(L)}}
    const B3=spr('bot',20);if(B3)scene.add(B3);
    if(typeof WB!=='undefined')WB.make3d(scene);
    // nodes, signals
    const NM={};for(const n of nodes){const c=new THREE.Color(MATC[REG[n.reg].mat]);const m=new THREE.Mesh(new THREE.OctahedronGeometry(9,0),new THREE.MeshLambertMaterial({color:c,emissive:c,emissiveIntensity:0.6}));m.position.set(n.x,14,n.y);m.scale.y=1.6;scene.add(m);n.m3=m}
    for(const o of pois){const m=new THREE.Mesh(new THREE.TorusGeometry(16,2.5,6,20),new THREE.MeshBasicMaterial({color:0xff7ad9}));m.position.set(o.x,20,o.y);scene.add(m);o.m3=m}
    // the astronaut: rounded suit with gold trims, a glossy visor with a cyan glow, jointed limbs on pivots and a detailed backpack
    const A=new THREE.Group(),SM=(c,r,m,e,ei)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,emissive:e||0,emissiveIntensity:ei||0});
    const wm=SM(0xf4f6fa,0.45,0.05),gm=SM(0xf5c451,0.32,0.65),vm=SM(0x0b1530,0.08,0.4,0x00e5ff,0.22),cm=SM(0x00e5ff,0.3,0,0x00e5ff,1.4),dk=SM(0x2a3448,0.6,0.2);
    const part=(geo,m,x,y,z,par)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);(par||A).add(o);return o},piv=(x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);A.add(g);return g};
    const torso=part(new THREE.CapsuleGeometry(7.4,7,6,16),wm,0,19.5,0);part(new THREE.TorusGeometry(7.5,1,8,24),gm,0,14.5,0).rotation.x=Math.PI/2;
    part(new THREE.CylinderGeometry(2.2,2.2,0.8,14),cm,0,21,7.1).rotation.x=Math.PI/2;part(new THREE.TorusGeometry(2.8,0.5,6,16),gm,0,21,7.2);
    const head=new THREE.Group();head.position.set(0,33,0);A.add(head);part(new THREE.SphereGeometry(8.6,20,16),wm,0,0,0,head);
    part(new THREE.SphereGeometry(6.6,18,12),vm,0,0.4,3.6,head).scale.set(1,0.8,0.68);part(new THREE.TorusGeometry(6.6,0.7,6,22),gm,0,-6.5,0,head).rotation.x=Math.PI/2;
    part(new THREE.CylinderGeometry(0.5,0.5,6,6),dk,5.5,7,-1,head);part(new THREE.SphereGeometry(1.2,10,8),cm,5.5,10.2,-1,head);
    part(new THREE.SphereGeometry(1.8,10,8),gm,-8.4,0.5,0,head);part(new THREE.SphereGeometry(1.8,10,8),gm,8.4,0.5,0,head);
    // backpack: rounded pack, twin gold tanks, cyan lights
    const pack=new THREE.Group();pack.position.set(0,21,-8);A.add(pack);part(new THREE.CapsuleGeometry(4.2,5,6,12),wm,0,0,0,pack).scale.set(1.55,1,0.8);
    part(new THREE.CylinderGeometry(1.7,1.7,10,12),gm,-3.6,0.5,-2,pack);part(new THREE.CylinderGeometry(1.7,1.7,10,12),gm,3.6,0.5,-2,pack);
    part(new THREE.BoxGeometry(5,1,0.6),cm,0,3,-3.2,pack);part(new THREE.BoxGeometry(5,1,0.6),cm,0,0.6,-3.2,pack);
    // limbs hang from shoulder / hip pivots so they swing from the joint
    const limb=(px,py,arm)=>{const P2=piv(px,py,0),r=arm?2.5:3,L1=arm?4.5:4,up=part(new THREE.CapsuleGeometry(r,L1,4,10),wm,0,-L1/2-r*0.6,0,P2);part(new THREE.SphereGeometry(r*1.05,10,8),gm,0,0,0,P2);
      const J=new THREE.Group();J.position.set(0,-L1-r*1.5,0);P2.add(J);part(new THREE.SphereGeometry(r*0.95,10,8),wm,0,0,0,J);part(new THREE.CapsuleGeometry(r*0.92,L1,4,10),wm,0,-L1/2-r*0.5,0,J);
      if(arm){part(new THREE.SphereGeometry(r*1.15,10,8),wm,0,-L1-r*1.3,0,J);part(new THREE.TorusGeometry(r*1.05,0.55,6,14),gm,0,-L1-r*0.4,0,J).rotation.x=Math.PI/2}
      else{const boot=part(new THREE.CapsuleGeometry(r*1.05,3,4,10),wm,0,-L1-r*1.3,1.2,J);boot.rotation.x=Math.PI/2;part(new THREE.BoxGeometry(r*2.1,0.9,7),gm,0,-L1-r*2.25,1.2,J)}return [P2,J]};
    const [armL,elL]=limb(-9.6,25,1),[armR,elR]=limb(9.6,25,1),[legL,knL]=limb(-3.7,12.5,0),[legR,knR]=limb(3.7,12.5,0);scene.add(A);
    const shP=blob(30),shB=blob(18);
    const pool={},bul=[],ebul=[];const bm=new THREE.MeshBasicMaterial({color:0x7ffcff}),em=new THREE.MeshBasicMaterial({color:0xff5a8a}),bg=new THREE.SphereGeometry(3,6,4),eg=new THREE.SphereGeometry(5,6,4);
    function sync(arr,list,geo,mat,h){while(arr.length<list.length){const m=new THREE.Mesh(geo,mat);scene.add(m);arr.push(m)}arr.forEach((m,j)=>{const s=list[j];m.visible=!!s;if(s)m.position.set(s.x,h,s.y)})}
    let fogReg=0;const FOGC=WORLD.fog.map(deep),SPOOL={},live=new Set();   // cached fog colours; monster sprite pool
    // phones: if frames stay slow (>24 ms) for 2 s, lower the render resolution a step (down to 1×)
    let lastF=0,slowT=0,pr=Math.min(devicePixelRatio,1.5);
    function draw(){const nowF=performance.now(),dF=lastF?nowF-lastF:16;lastF=nowF;if(dF>24&&dF<200)slowT+=dF/1000;else slowT=Math.max(0,slowT-0.004);if(slowT>2&&pr>1){pr=Math.max(1,pr-0.25);R.setPixelRatio(pr);slowT=0}
      const w=c3.clientWidth,h=c3.clientHeight;if(c3.width!==Math.round(w*R.getPixelRatio())||c3.height!==Math.round(h*R.getPixelRatio())){R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
      const reg=Math.max(0,regAt(p.x,p.y));if(reg!==fogReg){fogReg=reg}const fc=FOGC[reg];scene.fog.color.lerp(fc,0.05);scene.background.lerp(fc,0.05);hemi.groundColor.lerp(fc,0.02);
      A.position.set(p.x,0,p.y);A.rotation.y=Math.atan2(Math.cos(p.aim),Math.sin(p.aim));A.visible=p.dead<=0;shP.visible=A.visible;shP.position.set(p.x,0.35,p.y);
      const sw=p.moving?Math.sin(t*11):0,bob=p.moving?Math.abs(Math.cos(t*11))*1.2:Math.sin(t*2)*0.25;A.position.y=bob;
      legL.rotation.x=sw*0.7;legR.rotation.x=-sw*0.7;knL.rotation.x=Math.max(0,-sw)*0.9;knR.rotation.x=Math.max(0,sw)*0.9;armL.rotation.x=-sw*0.55;armR.rotation.x=sw*0.55;elL.rotation.x=-0.35-Math.max(0,sw)*0.3;elR.rotation.x=-0.35-Math.max(0,-sw)*0.3;
      head.rotation.z=p.moving?Math.sin(t*5.5)*0.04:0;torso.scale.y=1+Math.sin(t*2)*0.015;
      wm.emissive.setHex(p.hurt>0?0x661020:0x000000);if(B3){B3.position.set(bot.x,22+3*Math.sin(t*3),bot.y);B3.visible=p.dead<=0;shB.position.set(bot.x,0.4,bot.y);shB.visible=B3.visible;const k2=1-0.08*Math.sin(t*3);shB.scale.set(18*k2,12.6*k2,1)}
      const f={x:Math.cos(cam.yaw),y:Math.sin(cam.yaw)};camera.position.set(p.x-f.x*125,72,p.y-f.y*125);camera.lookAt(p.x+f.x*70,18,p.y+f.y*70);
      sky.position.set(p.x,0,p.y);sun.position.set(p.x+380,640,p.y+260);sun.target.position.set(p.x,0,p.y);rim.position.set(p.x-f.x*-300,220,p.y-f.y*-300);rim.target.position.set(p.x,10,p.y);
      const now=Date.now();for(const n of nodes){n.m3.visible=n.cd<now&&open(n.reg);if(n.m3.visible){n.m3.rotation.y=t*1.5;n.m3.position.y=14+2*Math.sin(t*3+n.x)}}
      for(const o of pois){o.m3.visible=open(o.reg)&&!(st.poi||{})[o.reg];o.m3.rotation.y=t*2}
      // monsters are billboards of the painted creatures
      // monster billboards come from a pool per painting (no new materials while playing); each has a soft shadow
      for(const o of live)o.userData.seen=0;
      for(const m of mons){let s=m.s3;if(!s||!s.parent){const k=monKey(m),h2=m.guard?m.r*3.4:m.r*2.8,pk=k+'|'+Math.round(h2),P3=SPOOL[pk]||(SPOOL[pk]=[]);s=P3.pop()||spr(k,h2);if(!s){s=new THREE.Sprite(new THREE.SpriteMaterial({color:0xc060ff}));s.scale.set(20,20,1)}
          s.userData.pk=pk;s.userData.sh=s.userData.sh||blob(m.r*2.6);s.userData.sh.scale.set(m.r*2.6,m.r*1.8,1);s.userData.sh.visible=true;scene.add(s);m.s3=s;live.add(s)}
        s.userData.seen=1;s.position.set(m.x,m.mv?Math.abs(Math.cos(m.ph||0))*m.r*0.18:0,m.y);s.material.rotation=m.mv?Math.sin(m.ph||0)*0.07:0;s.material.color.setHex(m.st==='wind'?0xff8a7a:m.p2?0xffb0b0:0xffffff);if(m.fl>0)s.material.color.setRGB(2,2,2);
        s.userData.sh.position.set(m.x,0.3,m.y)}
      for(const o of live)if(!o.userData.seen){scene.remove(o);o.userData.sh.visible=false;live.delete(o);(SPOOL[o.userData.pk]||(SPOOL[o.userData.pk]=[])).push(o)}
      sync(met3,mets,mg,mm,1);met3.forEach(o=>{o.rotation.x=-Math.PI/2;o.scale.set(1,0.62,1)});sync(bul,shots.concat(bshots),bg,bm,16);sync(ebul,eshots,eg,em,16);sync(orb3,orbs,og,om,8);
      const FX=fx.filter(f=>f.k!=='bolt');sync(fx3,FX,rg,rm,6);fx3.forEach((m,j)=>{const f=FX[j];if(f){m.rotation.x=-Math.PI/2;const k=f.k==='slash'?f.r*0.85:f.r*(1-f.l*2);m.scale.set(k/20,k/20,1)}});if(typeof WB!=='undefined')WB.draw3d(t);R.render(scene,camera)}
    const met3=[],mg=new THREE.RingGeometry(BAL.world.events.meteorR-4,BAL.world.events.meteorR,28),mm=new THREE.MeshBasicMaterial({color:0xff4a3a,side:THREE.DoubleSide}),orb3=[],fx3=[],og=new THREE.OctahedronGeometry(4,0),om=new THREE.MeshBasicMaterial({color:0x7dff9a}),rg=new THREE.TorusGeometry(20,1.2,4,32),rm=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.8});
    function unlockReg(i){if(gmat[i])gmat[i].color.setHex(0xffffff)}
    function dispose(){try{R.dispose();R.forceContextLoss&&R.forceContextLoss()}catch(e){}}
    return {draw,unlockReg,dispose}}
  function setView(v){view=v;st.view=v;gSave('world',st);const b=hud&&hud.querySelector('.wview');
    if(v==='3d'){if(!R3)R3=make3D();if(!R3){view='2d';toast('⚠️ جهازك لا يدعم المنظور الثلاثي');}}
    cv.hidden=view!=='2d';c3.hidden=view!=='3d';if(b)b.textContent=view==='2d'?'🎥 3D':'🗺️ 2D';if(view==='2d')cam.yaw=-Math.PI/2}
  /* ---------- loop, input, lifecycle ---------- */
  function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(0.05,(now-last)/1000);last=now;if(!running)return;if(!forgeOn&&!document.querySelector('.hmodal')){update(dt);if(typeof WB!=='undefined')WB.update(dt,t)}if(view==='3d'&&R3)R3.draw();else draw2d()}
  function resize(){const tb=document.querySelector('#play .topbar'),top=tb?Math.round(tb.getBoundingClientRect().bottom)+4:0;stage.style.top=top+'px';
    const w=stage.clientWidth||innerWidth,h=Math.max(300,innerHeight-top);H=Math.round(W*h/w);SC.clear();cv.width=Math.round(w*devicePixelRatio);cv.height=Math.round(h*devicePixelRatio);cv.style.height=h+'px';c3.style.height=h+'px';stage.style.height=h+'px'}
  const pd=e=>{if(e.target.closest&&e.target.closest('button'))return;joy={on:true,id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY};e.preventDefault()},
    pm=e=>{if(joy&&joy.on&&e.pointerId===joy.id){joy.x=e.clientX;joy.y=e.clientY}},pu=e=>{if(joy&&e.pointerId===joy.id)joy.on=false},
    kd=e=>{keys[e.key]=true},ku=e=>{keys[e.key]=false};
  const POIS=['حطام قمر صناعي قديم يحمل خريطة للمناطق المجاورة.','تحت الجليد جهاز يبث نفس الإشارة الغامضة.','داخل البركان بقايا محطة تعدين لم يعد منها أحد.','الكريستال هنا يغنّي حين تلمسه… ويحفظ أصوات من مرّوا قبلك.','في قلب الغابة بذرة عملاقة تنبض بضوء أخضر.','في السديم بوابة نجمية صغيرة مطفأة… من بناها؟'];
  if(location.hostname==='localhost')window.__wd={get mons(){return mons},get p(){return p},ready:i=>gateReady(i)};   // test hook
  return {id:'world',name:'عالم المدار',noDaily:true,desc:'عالم مفتوح: امشِ بين المناطق الست واجمع المواد وقاتل الوحوش والحرّاس',
    help:'حرّك الرائد بإصبعك في أي مكان على الشاشة (عصا تحكم). يطلق الرائد النار تلقائياً على أقرب وحش. قف فوق البلورات المضيئة لتجمع مادة المنطقة. 📡 إشارة قديمة في كل منطقة لها مكافأة مرة واحدة، و👑 حارس قوي في كل منطقة يعود بعد 5 دقائق من هزيمته، أو أسرع إذا قتلت 25 وحشاً في منطقته. داخل قبة القاعدة تُشفى بسرعة، والحمم تحرقك. زر 🎥 يبدّل بين المنظور العلوي والثلاثي الأبعاد. كل وحش تقتله يُسقط جواهر خبرة خضراء ترفع مستواك وقوتك. كل منطقة لها مستوى وحوش، وبوابتها تنفتح بهزيمة حارس المنطقة السابقة وبلوغ مستواها. داخل القبة تجد ⚒️ ورشة الأسلحة لتصنع وتطوّر خمسة أسلحة بمواد المناطق. قوتك تزيد أيضاً بدعم المستعمرة ومعدات الورشة. الوحوش تنحني وتومض بخط أحمر قبل أن تنقضّ، فابتعد عن اتجاهها. الحارس يغضب عند نصف صحته. أحياناً يهجم غزو وحوش أو يسقط مطر نيازك: اخرج من الدوائر الحمراء. 🧩 القطع النادرة تخفّض كلفة تطوير الأسلحة. 🤖 الروبوت المرافق يتبعك ويطلق على أقرب وحش.',
    icon:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#1e4733"/><path d="M4 24h40M24 4v40" stroke="#ffffff30"/><circle cx="17" cy="18" r="6" fill="#9fbfd6"/><circle cx="32" cy="30" r="7" fill="#ad9cc8"/><text x="24" y="31" font-size="16" text-anchor="middle">🧑‍🚀</text></svg>',
    progress(){const s=gState('world',{});return {level:Object.keys(s.gk||{}).length+1,stars:0}},play(){},
    start(){st=gState('world',{kills:0});buildWorld();p=newPlayer();mons=[];mets=[];evT=0;bshots=[];bot={x:p.x-26,y:p.y-34,cd:0};shots=[];eshots=[];parts=[];t=0;stage.innerHTML='';stage.classList.add('wstage');document.body.classList.add('wfull');
      cv=document.createElement('canvas');c3=document.createElement('canvas');c3.className='w3';stage.appendChild(cv);stage.appendChild(c3);ctx=cv.getContext('2d');hudBuild();if(typeof WB!=='undefined')WB.start({hud,stage,regAt,base:WORLD.base,moon:WORLD.moon,player:()=>p,say,open,mons:()=>mons,mini:()=>mini,
        hit:(m,n)=>{if(m.hp<=0)return;m.hp-=n;m.fl=0.08;if(m.hp<=0)kill(m)},heroDmg:()=>p.dmg,addGear:n=>{st.gp=(st.gp||0)+n;gSave('world',st)},gear:()=>st.gp||0});resize();
      setView(st.view==='3d'?'3d':'2d');stage.addEventListener('pointerdown',pd);addEventListener('pointermove',pm);addEventListener('pointerup',pu);addEventListener('pointercancel',pu);addEventListener('keydown',kd);addEventListener('keyup',ku);addEventListener('resize',resize);
      RD.ph='idle';RD.t=BAL.build.raid.firstS;running=true;last=performance.now();raf=requestAnimationFrame(frame);snd('win')},
    stop(){running=false;cancelAnimationFrame(raf);if(typeof WB!=='undefined')WB.stop();if(st&&p){st.x=Math.round(p.x);st.y=Math.round(p.y);delete st._d;gSave('world',st);colSave()}stage.removeEventListener('pointerdown',pd);removeEventListener('pointermove',pm);removeEventListener('pointerup',pu);removeEventListener('pointercancel',pu);removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('resize',resize);
      if(R3){R3.dispose();R3=null}stage.classList.remove('wstage');document.body.classList.remove('wfull');stage.style.height='';stage.style.top='';hud=null},
    pauseExt(){running=false},resumeExt(){running=true;last=performance.now()},forfeit(){return false}}})();
if(typeof ACH!=='undefined')ACH.push(['w_lv10','⭐','عالم المدار: المستوى 10'],['w_lv25','🌟','عالم المدار: المستوى 25'],['w_weap5','⚒️','اصنع كل الأسلحة الخمسة'],['w_kill100','⚔️','عالم المدار: 100 وحش'],['w_guard1','👑','هزمت أول حارس منطقة'],['w_guard6','🌟','هزمت حرّاس المناطق الست']);
/* entry points: a card in the battles tab and a button in the map */
function worldCard(){const s=gState('world',{})||{};return `<div class="svcard wvcard"><div class="pvhero">${WorldGame.icon}</div><div class="svbody"><h2>عالم المدار</h2><p>عالم مفتوح: امشِ بين المناطق الست، اجمع موادها، وقاتل وحوشها وحرّاسها. بمنظور علوي أو ثلاثي الأبعاد.</p>
  <div class="svstats"><span><b>${s.lv||1}</b><small>المستوى</small></span><span><b>${s.kills||0}</b><small>وحوش</small></span><span><b>${Object.keys(s.gk||{}).length}/6</b><small>حرّاس</small></span><span><b>${Object.keys(s.poi||{}).length}/6</b><small>إشارات</small></span></div>
  <button class="btn main wvplay" type="button">🧑‍🚀 ادخل العالم</button></div></div>`}
{const _rh=renderHub;renderHub=function(){_rh.apply(this,arguments);const d=$('daily');if(!d||d.querySelector('.wvcard'))return;d.insertAdjacentHTML('afterbegin',worldCard());d.querySelector('.wvplay').onclick=()=>{snd('tap');openGame(WorldGame)}}}
{const _mh=mapHTML;mapHTML=function(){return _mh().replace('<div class="wtabs">','<button type="button" class="btn main wwalk" data-wwalk>🧑‍🚀 ادخل عالم المدار سيراً</button><div class="wtabs">')}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-wwalk]')){const m=document.getElementById('galbox');if(m)m.remove();snd('tap');openGame(WorldGame)}});
