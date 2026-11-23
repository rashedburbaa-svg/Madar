/* ================= «عالم المدار»: open world. Walk the six regions with the joystick, gather materials, fight monsters
   and each region's guardian. One simulation, two views: top-down 2D (painted art) and third-person 3D (three.js). ================= */
const WORLD={
  RW:1200,                                    // one region is 1200×1200 world units
  GRID:[[1,0,2],[4,3,5]],                     // region index at [row][col]: ice · orbit · lava / green · crystal · nebula
  base:{x:1800,y:560,r:150},                  // the colony dome, centre of Orbit-1
  ground:['#4a3654','#9fbfd6','#3a2420','#ad9cc8','#1e4733','#170f2c'],
  spot:['#5e4670','#c9e2f2','#5a2e22','#d6c8ee','#2f6b47','#2a1d4a'],
  fog:[0x2a2040,0xbcd6ea,0x4a1a10,0xc9bde0,0x10301f,0x0a0618],
  mon:{small:{hp:26,dmg:8,spd:84,r:13},big:{hp:95,dmg:16,spd:56,r:20},grow:0.8,dgrow:0.5},
  guard:{hp:1400,grow:1,dmg:22,r:44,cd:5*60000,kills:25},   // a beaten guardian returns after 5 min, or sooner after 25 kills in its region
  player:{hp:120,dmg:12,rate:2.6,spd:150,range:270},
  nodes:14,nodeCd:120000,poi:{c:15,mat:20},maxMon:55,
  spawn:{rate:3.2,min:3,max:6,d0:520,d1:780},  // packs per second (chance), pack size, spawn ring around the hero
  // XP Hero style: the hero levels up from kills; each region has a monster level band and a gate (previous guardian + hero level)
  LV:[1,5,10,15,20,25],hpGrow:1.15,dmgGrow:1.1,heroDmg:1.1,heroHp:12,xpNext:lv=>Math.round(20*Math.pow(lv,1.5)),
  xp:{small:4,big:10,guard:120},
  WEAP:[{id:'rifle',n:'بندقية الطاقة',em:'🔫',kind:'shot',rate:2.6,mul:1,mat:'alloy',cost:null},
    {id:'spread',n:'القاذف الثلاثي',em:'💥',kind:'spread',rate:2.0,mul:0.75,mat:'ice',cost:{ice:20,alloy:20}},
    {id:'saber',n:'سيف البلازما',em:'🗡️',kind:'slash',rate:1.5,mul:2.2,range:72,mat:'magma',cost:{magma:20,alloy:20}},
    {id:'chain',n:'مدفع البرق',em:'⚡',kind:'chain',rate:1.8,mul:1.05,mat:'quartz',cost:{quartz:25,ice:15}},
    {id:'nova',n:'نجمة السديم',em:'🌟',kind:'nova',rate:0.9,mul:1.6,range:150,mat:'gas',cost:{gas:25,spore:25}}],
  upCost:l=>({c:15*l,m:8*l})};   // weapon upgrade l→l+1: 💎 15·l and the weapon's material 8·l

/* full phone screen while the open world runs */
document.head.insertAdjacentHTML('beforeend','<style>body.wfull{overflow:hidden;overscroll-behavior:none}body.wfull #play .stats,body.wfull #play .controls,body.wfull #play .help{display:none}body.wfull #play .stage.wstage{position:fixed;left:0;right:0;bottom:0;top:56px;width:auto;border-radius:0;z-index:20}body.wfull #play .stage.wstage>canvas{height:100%!important}body.wfull #play .topbar{position:relative;z-index:21}body.wfull .wview,body.wfull .wforgeb{bottom:calc(14px + env(safe-area-inset-bottom))}</style>');
const WorldGame=(()=>{
  const W=432,{RW,GRID}=WORLD,WW=RW*3,WH=RW*2;
  let H=624,cv,ctx,c3,raf=0,last=0,st,running=false,joy=null,keys={},hud,mini,t=0,saveT=0,msgT=0,view='2d',R3=null,iv=0;
  let p,mons=[],shots=[],eshots=[],nodes=[],props=[],pools=[],parts=[],guards=[],pois=[],orbs=[],fx=[],cam={x:0,y:0,yaw:-Math.PI/2};
  const IMG={};const img=k=>{if(typeof ART==='undefined'||!ART[k])return null;if(!IMG[k]){const i=new Image();i.src=ART[k];IMG[k]=i}return IMG[k].complete&&IMG[k].naturalWidth?IMG[k]:null};
  const regAt=(x,y)=>{const c=Math.floor(x/RW),r=Math.floor(y/RW);return c<0||r<0||c>2||r>1?-1:GRID[r][c]};
  const regPos=i=>{for(let r=0;r<2;r++)for(let c=0;c<3;c++)if(GRID[r][c]===i)return {x:c*RW,y:r*RW};return {x:0,y:0}};
  const regMid=i=>{const o=regPos(i);return {x:o.x+RW/2,y:o.y+RW/2}};
  const open=i=>i===0||(typeof regOpen==='function'&&regOpen(i));
  const gateOk=i=>i===0||(((st.gk||{})[i-1]>0)&&(st.lv||1)>=WORLD.LV[i]);
  const gateTxt=i=>{const L=[];if(!((st.gk||{})[i-1]>0))L.push('👑 حارس '+PLN[i-1].n);if((st.lv||1)<WORLD.LV[i])L.push('⭐ المستوى '+WORLD.LV[i]);return L.join(' · ')};
  const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function seeded(s){return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}}
  /* ---------- the world: props, lava pools, material nodes, guardians, signals (same every visit) ---------- */
  function buildWorld(){props=[];pools=[];nodes=[];guards=[];pois=[];
    for(let i=0;i<6;i++){const o=regPos(i),R=seeded(97+i*131),far=(x,y)=>Math.hypot(x-WORLD.base.x,y-WORLD.base.y)>WORLD.base.r+60;
      const kinds=[['debris','crater'],['spike','frost'],['rock','vent'],['crystal','shard'],['shroom','fern'],['float','star']][i];
      for(let k=0;k<70;k++){const x=o.x+20+R()*(RW-40),y=o.y+20+R()*(RW-40);if(far(x,y))props.push({x,y,k:kinds[k%2],s:0.7+R()*0.8,reg:i})}
      if(i===2)for(let k=0;k<9;k++){const x=o.x+120+R()*(RW-240),y=o.y+120+R()*(RW-240);pools.push({x,y,r:40+R()*36})}
      for(let k=0;k<WORLD.nodes;k++){const x=o.x+60+R()*(RW-120),y=o.y+60+R()*(RW-120);if(far(x,y))nodes.push({x,y,reg:i,cd:0,prog:0})}
      const m=regMid(i),gx=i===0?o.x+RW*0.84:m.x+(R()-0.5)*300,gy=i===0?o.y+RW*0.9:m.y+(R()-0.5)*300;guards.push({reg:i,x:gx,y:gy,hx:gx,hy:gy});
      pois.push({reg:i,x:o.x+150+R()*(RW-300),y:o.y+150+R()*(RW-300)})}}
  /* ---------- player stats come from the colony and the gear workshop ---------- */
  const weap=()=>WORLD.WEAP.find(w=>w.id===(st.wp||'rifle'))||WORLD.WEAP[0],wLv=id=>(st.wu||{})[id]||1;
  function stats(){const B=typeof survBonus==='function'?survBonus():{dmg:0,hp:0,rate:0},P=WORLD.player,lv=st.lv||1,w=weap();
    return {max:Math.round(P.hp+WORLD.heroHp*(lv-1)+B.hp),dmg:P.dmg*Math.pow(WORLD.heroDmg,lv-1)*(1+B.dmg/100)*w.mul*(1+0.25*(wLv(w.id)-1)),rate:w.rate*(1+B.rate/100)}}
  function restat(full){const s=stats(),r=p.hp/p.max;p.max=s.max;p.dmg=s.dmg;p.rate=s.rate;p.hp=full?s.max:Math.max(1,Math.round(s.max*r))}
  function newPlayer(){const s=stats(),b=WORLD.base;return {x:st.x||b.x,y:st.y||b.y+b.r+30,hp:s.max,max:s.max,dmg:s.dmg,rate:s.rate,cd:0,aim:-Math.PI/2,moving:false,hurt:0,dead:0,r:14}}
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
    const lv=WORLD.LV[g.reg]+5,hp=Math.round(520*Math.pow(WORLD.hpGrow,lv-1)),dmg=WORLD.guard.dmg*Math.pow(WORLD.dmgGrow,lv-1);g.alive=true;mons.push({guard:g,lv,x:g.hx,y:g.hy,reg:g.reg,big:true,hp,max:hp,dmg,spd:46,r:WORLD.guard.r,t1:2.5,t2:6,hit:0,fl:0})}
  /* ---------- update ---------- */
  function input(){let mx=0,my=0;if(keys.ArrowLeft||keys.a)mx--;if(keys.ArrowRight||keys.d)mx++;if(keys.ArrowUp||keys.w)my--;if(keys.ArrowDown||keys.s)my++;
    if(joy&&joy.on){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,L=Math.hypot(dx,dy);if(L>8){mx=dx/Math.max(L,40);my=dy/Math.max(L,40)}}
    const L=Math.hypot(mx,my);if(L>1){mx/=L;my/=L}
    if(view==='3d'){const f={x:Math.cos(cam.yaw),y:Math.sin(cam.yaw)},r={x:-f.y,y:f.x};return {x:f.x*-my+r.x*mx,y:f.y*-my+r.y*mx,fw:-my}}
    return {x:mx,y:my,fw:0}}
  function say(s){if(t<msgT)return;msgT=t+2.5;toast(s)}
  function update(dt){t+=dt;if(p.dead>0){p.dead-=dt;if(p.dead<=0){const b=WORLD.base;p.x=b.x;p.y=b.y+b.r+30;p.hp=p.max;p.hurt=0}return}
    const mv=input(),sp=WORLD.player.spd;p.moving=Math.hypot(mv.x,mv.y)>0.05;
    if(p.moving){let nx=p.x+mv.x*sp*dt,ny=p.y+mv.y*sp*dt;nx=clamp(nx,10,WW-10);ny=clamp(ny,10,WH-10);const reg=regAt(nx,ny);
      if(reg>=0&&!open(reg)){ // walking into a closed region: discover it if the colony is ready, else bounce
        if(gateOk(reg)){col.wm.u[reg]=1;colSave();snd('win');addMat(REG[reg].mat,10);toast(`🗺️ اكتشفت ${PLN[reg].em} ${PLN[reg].n}!`,'ach');const n=Object.keys(col.wm.u).length;if(n>=3)unlock('wm3');if(n>=6)unlock('wm6');R3&&R3.unlockReg(reg)}
        else{say('🔒 '+PLN[reg].n+': '+gateTxt(reg));nx=p.x;ny=p.y}}
      p.x=nx;p.y=ny;if(view==='2d'||mv.fw>0.3)p.aim=Math.atan2(mv.y,mv.x)}
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
    for(const m of mons){if(m.hp<=0)continue;m.fl=Math.max(0,m.fl-dt);const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1;let vx=0,vy=0;
      if(m.guard){const hd=Math.hypot(m.x-m.guard.hx,m.y-m.guard.hy);
        if(d<420){vx=dx/d*m.spd;vy=dy/d*m.spd;m.t1-=dt;m.t2-=dt;
          if(m.t1<=0){m.t1=2.6;for(let k=0;k<10;k++){const a=k*0.628+t;eshots.push({x:m.x,y:m.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,l:2.4,dmg:m.dmg*0.6})}snd('err')}
          if(m.t2<=0){m.t2=7;for(let k=0;k<3;k++){const s=monStats(m.reg,false,WORLD.LV[m.reg]),a=Math.random()*6.283;mons.push({x:m.x+Math.cos(a)*50,y:m.y+Math.sin(a)*50,reg:m.reg,big:false,lv:s.lv,hp:s.hp,max:s.hp,dmg:s.dmg,spd:s.spd,r:s.r,wt:0,hit:0,fl:0})}}}
        else if(hd>8){vx=(m.guard.hx-m.x)/hd*m.spd;vy=(m.guard.hy-m.y)/hd*m.spd;m.hp=Math.min(m.max,m.hp+m.max*0.05*dt)}}
      else if(d<340){vx=dx/d*m.spd;vy=dy/d*m.spd}
      else{m.wt-=dt;if(m.wt<=0){m.wt=rnd(1.5,3.5);const a=Math.random()*6.283;m.wx=Math.cos(a)*m.spd*0.35;m.wy=Math.sin(a)*m.spd*0.35}vx=m.wx;vy=m.wy}
      let nx=m.x+vx*dt,ny=m.y+vy*dt;if(regAt(nx,ny)!==m.reg&&!m.guard){m.wt=0;nx=m.x;ny=m.y}
      const bd2=Math.hypot(nx-WORLD.base.x,ny-WORLD.base.y);if(bd2<WORLD.base.r+m.r){nx=m.x;ny=m.y}
      const mvd=Math.hypot(nx-m.x,ny-m.y);m.mv=mvd>dt*4;m.ph=(m.ph||0)+mvd/(m.r*0.55);if(Math.abs(nx-m.x)>0.3)m.fx=nx<m.x?-1:1;
      m.x=nx;m.y=ny;if(d<m.r+p.r)hitP(m.dmg*dt,false)}
    mons=mons.filter(m=>m.hp>0&&(m.guard||Math.hypot(m.x-p.x,m.y-p.y)<1300));
    for(const s of eshots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.l-=dt;if((s.x-p.x)**2+(s.y-p.y)**2<(p.r+5)**2){s.l=0;hitP(s.dmg,false)}}eshots=eshots.filter(s=>s.l>0);
    for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}parts=parts.filter(q=>q.l>0);for(const f of fx)f.l-=dt;fx=fx.filter(f=>f.l>0);
    // XP gems fly to the hero
    for(const o of orbs){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);if(d<110||o.pull){o.pull=1;const v=Math.min(520,180+(110-Math.min(110,d))*6);o.x+=dx/d*v*dt;o.y+=dy/d*v*dt}if(d<16){o.l=0;gainXP(o.v)}o.t=(o.t||0)+dt;if(o.t>40)o.l=0}orbs=orbs.filter(o=>o.l!==0);
    // material nodes: stand on one to gather it
    const now=Date.now();for(const n of nodes){if(n.cd>now){n.prog=0;continue}const d=Math.hypot(n.x-p.x,n.y-p.y);if(d<30){n.prog+=dt;if(n.prog>=0.9){n.prog=0;n.cd=now+WORLD.nodeCd;const q=2+Math.floor(Math.random()*3);addMat(REG[n.reg].mat,q);st.mat=(st.mat||0)+q;snd('coin');float(n.x,n.y,'+'+q+' '+REG[n.reg].me);dirty()}}else n.prog=Math.max(0,n.prog-dt)}
    // signals: one-time story finds
    for(const o of pois){if((st.poi||{})[o.reg]||!open(o.reg))continue;if(Math.hypot(o.x-p.x,o.y-p.y)<34){st.poi=st.poi||{};st.poi[o.reg]=1;addMat(REG[o.reg].mat,WORLD.poi.mat);gain('c',WORLD.poi.c);addXP(40);snd('win');
      storyBox('📡 إشارة قديمة في '+PLN[o.reg].n,POIS[o.reg]+' · +'+WORLD.poi.mat+' '+REG[o.reg].me+' · +'+WORLD.poi.c+' 💎','رائع');dirty()}}
    for(const g of guards)if(!g.alive&&Math.hypot(g.hx-p.x,g.hy-p.y)<480)wakeGuard(g);
    if(Math.random()<dt*WORLD.spawn.rate)spawnMon();
    p.hurt=Math.max(0,p.hurt-dt);saveT-=dt;if(saveT<=0){saveT=4;st.x=Math.round(p.x);st.y=Math.round(p.y);gSave('world',st);if(st._d){st._d=0;colSave()}}
    hudTick()}
  const dirty=()=>{st._d=1};
  function gainXP(n){st.xp=(st.xp||0)+n;st.lv=st.lv||1;let up=false;while(st.xp>=WORLD.xpNext(st.lv)){st.xp-=WORLD.xpNext(st.lv);st.lv++;up=true}
    if(up){restat(true);snd('ach');buzz([30,40,60]);float(p.x,p.y-50,'⬆️ المستوى '+st.lv);fx.push({k:'lvl',x:p.x,y:p.y,r:90,l:0.6});if(st.lv>=10)unlock('w_lv10');if(st.lv>=25)unlock('w_lv25');
      for(let i=1;i<6;i++)if(st.lv===WORLD.LV[i]&&(st.gk||{})[i-1]>0&&!open(i))toast('🔓 '+PLN[i].n+' مفتوحة الآن، امشِ إليها');gSave('world',st)}}
  function hitP(n,quiet){if(p.dead>0)return;p.hp-=n;if(!quiet)p.hurt=0.2;if(p.hp<=0){p.hp=0;p.dead=3;snd('lose');toast('💫 سقطت! تعود إلى القاعدة…');mons=mons.filter(m=>m.guard);eshots=[]}}
  function float(x,y,txt){parts.push({x,y,vx:0,vy:-40,l:1.1,txt})}
  function kill(m){m.hp=0;st.kills=(st.kills||0)+1;for(let k=0;k<10;k++){const a=Math.random()*6.283;parts.push({x:m.x,y:m.y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,l:0.4,c:m.guard?'#ffd34d':'#ff9a6a'})}
    if(m.guard){const g=m.guard;g.alive=false;st.gd=st.gd||{};st.gd[g.reg]=Date.now()+WORLD.guard.cd;st.gq=st.gq||{};st.gq[g.reg]=0;const first=!(st.gk||{})[g.reg];st.gk=st.gk||{};st.gk[g.reg]=(st.gk[g.reg]||0)+1;
      const q=first?40:15,c=first?30:10;addMat(REG[g.reg].mat,q);gain('c',c);addXP(first?120:40);snd('win');buzz([40,60,80]);
      storyBox('🏆 هزمت حارس '+PLN[g.reg].n,'+'+q+' '+REG[g.reg].me+' '+REG[g.reg].mn+' · +'+c+' 💎'+(first?'':' · يعود بعد 5 دقائق أو بقتل '+WORLD.guard.kills+' وحشاً في منطقته'),'رائع');
      unlock('w_guard1');if(Object.keys(st.gk).length>=6)unlock('w_guard6');const nx=g.reg+1;if(nx<6&&!open(nx))toast('🚪 '+(gateOk(nx)?PLN[nx].n+' مفتوحة الآن، امشِ إليها':'بوابة '+PLN[nx].n+': '+gateTxt(nx)))}
    else{guardTick(m.reg);const k=m.big?2:1;gain('m',Math.round(12*k*(1+m.reg)));gain('e',Math.round(8*k*(1+m.reg)));if(Math.random()<0.25){addMat(REG[m.reg].mat,1);float(m.x,m.y-10,'+1 '+REG[m.reg].me)}}
    {const v=Math.round((m.guard?WORLD.xp.guard:m.big?WORLD.xp.big:WORLD.xp.small)*(1+0.12*((m.lv||1)-1)));const n=m.guard?8:m.big?2:1;for(let j=0;j<n;j++)orbs.push({x:m.x+rnd(-14,14),y:m.y+rnd(-14,14),v:Math.ceil(v/n)})}
    if(st.kills>=100)unlock('w_kill100');dirty()}
  // a sleeping guardian wakes early once enough monsters fall in its region
  function guardTick(reg){if(!((st.gd||{})[reg]>Date.now()))return;st.gq=st.gq||{};st.gq[reg]=(st.gq[reg]||0)+1;
    if(st.gq[reg]>=WORLD.guard.kills){st.gd[reg]=0;st.gq[reg]=0;snd('err');toast('👑 حارس '+PLN[reg].n+' استيقظ!')}}
  /* ---------- HUD (shared by both views) ---------- */
  function hudBuild(){hud=document.createElement('div');hud.className='whud';hud.innerHTML=`<div class="whp"><i></i><b></b></div><div class="whlv"><b></b><i><u></u></i></div><div class="whreg"></div><div class="whmat"></div><div class="wgd" hidden><small></small><i><u></u></i></div>
    <button type="button" class="wview" aria-label="تبديل المنظور">🎥 3D</button><button type="button" class="wforgeb" hidden>⚒️ ورشة الأسلحة</button><div class="wforge" hidden></div><canvas class="wmini" width="120" height="80"></canvas><div class="wjoy" hidden><i></i></div>`;stage.appendChild(hud);mini=hud.querySelector('.wmini');
    hud.querySelector('.wview').onclick=e=>{e.stopPropagation();setView(view==='2d'?'3d':'2d')};
    hud.querySelector('.wforgeb').onclick=e=>{e.stopPropagation();snd('tap');forge(true)};
    hud.querySelector('.wforge').addEventListener('pointerdown',e=>e.stopPropagation());
    hud.querySelector('.wforge').onclick=e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;const id=b.dataset.id,w=WORLD.WEAP.find(x=>x.id===id);
      if(b.dataset.x==='close'){forge(false);return}st.wo=st.wo||{rifle:1};st.wu=st.wu||{};
      if(b.dataset.x==='make'){for(const [k,n] of Object.entries(w.cost))if(matN(k)<n){snd('err');toast(`تحتاج ${n} ${matIcon(k)} ${matName(k)}`);return}for(const [k,n] of Object.entries(w.cost))col.wm.mat[k]-=n;st.wo[id]=1;st.wp=id;snd('win');toast('⚒️ صنعت '+w.n,'ach');if(Object.keys(st.wo).length>=5)unlock('w_weap5')}
      if(b.dataset.x==='eq'){st.wp=id;snd('tap')}
      if(b.dataset.x==='up'){const l=wLv(id),c=WORLD.upCost(l);if(l>=5)return;if(col.res.c<c.c||matN(w.mat)<c.m){snd('err');toast(`تحتاج 💎 ${c.c} و${matIcon(w.mat)} ${c.m}`);return}col.res.c-=c.c;col.wm.mat[w.mat]-=c.m;st.wu[id]=l+1;snd('build');toast('⬆️ '+w.n+' · المستوى '+(l+1),'ach')}
      restat(false);gSave('world',st);colSave();forge(true)}}
  let forgeOn=false;
  function forge(on){forgeOn=on;const f=hud.querySelector('.wforge');f.hidden=!on;if(!on)return;st.wo=st.wo||{rifle:1};
    let h=`<div class="wfh"><b>⚒️ ورشة الأسلحة</b><button type="button" data-x="close" aria-label="إغلاق">✕</button></div><small>💎 ${fmtN(col.res.c)} · ${REG.map(R=>R.me+' '+matN(R.mat)).join(' ')}</small>`;
    for(const w of WORLD.WEAP){const own=st.wo[w.id],l=wLv(w.id),eq=(st.wp||'rifle')===w.id,c=WORLD.upCost(l);
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
    if((t*4|0)%2===0)drawMini()}
  function drawMini(){const m=mini.getContext('2d'),k=120/WW;m.clearRect(0,0,120,80);
    for(let r=0;r<2;r++)for(let c=0;c<3;c++){const i=GRID[r][c];m.fillStyle=open(i)?WORLD.ground[i]:'#111';m.fillRect(c*40,r*40,40,40)}
    m.strokeStyle='#ffffff40';m.strokeRect(0.5,0.5,119,79);m.fillStyle='#00e5ff';m.beginPath();m.arc(WORLD.base.x*k,WORLD.base.y*k,3,0,6.283);m.fill();
    for(const g of guards)if(open(g.reg)&&!((st.gd||{})[g.reg]>Date.now())){m.fillStyle='#ffd34d';m.fillRect(g.hx*k-2,g.hy*k-2,4,4)}
    for(const o of pois)if(open(o.reg)&&!(st.poi||{})[o.reg]){m.fillStyle='#ff7ad9';m.fillRect(o.x*k-1.5,o.y*k-1.5,3,3)}
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
    for(let r=0;r<2;r++)for(let c=0;c<3;c++){const i=GRID[r][c],x0=c*RW,y0=r*RW;if(x0>cam.x+W||x0+RW<cam.x||y0>cam.y+H||y0+RW<cam.y)continue;
      ctx.fillStyle=pat(i);ctx.fillRect(Math.max(x0,cam.x),Math.max(y0,cam.y),Math.min(x0+RW,cam.x+W)-Math.max(x0,cam.x),Math.min(y0+RW,cam.y+H)-Math.max(y0,cam.y))}
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
    for(const m of mons)if(vis(m.x,m.y))L.push([m.y,()=>drawMon(m)]);
    L.push([p.y,drawPlayer]);L.sort((a,b)=>a[0]-b[0]);for(const x of L)x[1]();
    for(const o of orbs){ctx.fillStyle='#7dff9a';ctx.shadowColor='#7dff9a';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(o.x,o.y-6);ctx.lineTo(o.x+4,o.y);ctx.lineTo(o.x,o.y+6);ctx.lineTo(o.x-4,o.y);ctx.fill();ctx.shadowBlur=0}
    for(const f of fx){ctx.globalAlpha=Math.min(1,f.l*6);if(f.k==='slash'){ctx.strokeStyle='#ffe27a';ctx.lineWidth=6;ctx.beginPath();ctx.arc(f.x,f.y-10,f.r*0.85,f.a-1.1,f.a+1.1);ctx.stroke()}
      else if(f.k==='nova'||f.k==='lvl'){ctx.strokeStyle=f.k==='lvl'?'#7dff9a':'#ff8ad8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y-8,f.r*(1-f.l*2),0,6.283);ctx.stroke()}
      else if(f.k==='bolt'){ctx.strokeStyle='#bfe9ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y-14);ctx.lineTo((f.x+f.x2)/2+rnd(-8,8),(f.y+f.y2)/2+rnd(-8,8));ctx.lineTo(f.x2,f.y2);ctx.stroke()}ctx.globalAlpha=1}
    ctx.fillStyle='#7ffcff';for(const s of shots){ctx.beginPath();ctx.arc(s.x,s.y,3.2,0,6.283);ctx.fill()}
    ctx.fillStyle='#ff5a8a';for(const s of eshots){ctx.beginPath();ctx.arc(s.x,s.y,5,0,6.283);ctx.fill()}
    for(const q of parts){if(q.txt){ctx.globalAlpha=Math.min(1,q.l*2);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(q.txt,q.x,q.y)}else{ctx.globalAlpha=q.l*2;ctx.fillStyle=q.c;ctx.fillRect(q.x-2,q.y-2,4,4)}ctx.globalAlpha=1}
    // closed regions sit under a dark fog
    let lab=null,labD=260;for(let r=0;r<2;r++)for(let c=0;c<3;c++){const i=GRID[r][c];if(open(i))continue;const x0=c*RW,y0=r*RW,cx=clamp(p.x,x0+60,x0+RW-60),cy=clamp(p.y,y0+40,y0+RW-40),d=Math.hypot(cx-p.x,cy-p.y);if(d<labD){labD=d;lab=[i,cx,cy]}}
    for(let r=0;r<2;r++)for(let c=0;c<3;c++){const i=GRID[r][c];if(open(i))continue;const x0=c*RW,y0=r*RW;ctx.fillStyle='#000000b0';ctx.fillRect(x0,y0,RW,RW);
      const cx=lab&&lab[1],cy=lab&&lab[2];if(lab&&lab[0]===i){ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('🔒 '+PLN[i].n,cx,cy);ctx.font='12px sans-serif';ctx.fillStyle='#ffd34d';ctx.fillText(gateOk(i)?'🚪 مفتوحة، ادخل':gateTxt(i),cx,cy+18)}}
    ctx.restore();if(p.dead>0){ctx.fillStyle='#000a';ctx.fillRect(0,0,W,H)}}
  /* pinned sprite canvases: every painting is drawn once at its on-screen pixel size (4px buckets) and reused every frame.
     The hit flash is baked in too, so no ctx.filter per frame (slow on phones). */
  const SC=new Map();
  function sprC(k,h,flash){const im=img(k);if(!im)return null;const S=cv.width/W,ph=Math.max(8,Math.ceil(h*S/4)*4),key=k+'|'+ph+(flash?'f':'');let c=SC.get(key);if(c)return c;
    const R=ART[k+'R']||im.naturalWidth/im.naturalHeight;c=document.createElement('canvas');c.height=ph;c.width=Math.max(4,Math.round(ph*R));const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,c.width,ph);
    if(flash){g.globalCompositeOperation='source-atop';g.fillStyle='#ffffffb0';g.fillRect(0,0,c.width,ph)}if(SC.size>400)SC.clear();SC.set(key,c);return c}
  // creatures painted in the air get real legs so everything walks on the ground
  const LEGS={pl0_small:1,pl3_small:1,pl5_small:1,pl5_big:1};
  function legs(w,h,lh,ph,mv,col){const st=mv?Math.sin(ph):0,lw=Math.max(2,h*0.075);ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of [-1,1]){const sw=st*s,hx=s*w*0.13,hy=-lh,fx=hx+sw*w*0.16,fy=-Math.max(0,sw)*lh*0.35,kx=(hx+fx)/2+w*0.07,ky=(hy+fy)/2;
      ctx.strokeStyle=s<0?'#1b2030':col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(kx,ky);ctx.lineTo(fx,fy);ctx.stroke();
      ctx.fillStyle=s<0?'#1b2030':col;ctx.beginPath();ctx.ellipse(fx+lw*0.5,fy-lw*0.2,lw*0.9,lw*0.5,0,0,6.283);ctx.fill()}}
  function drawMon(m){const k='pl'+m.reg+'_'+(m.big?'big':'small'),R=ART[k+'R']||1,h=m.guard?m.r*3.4:m.r*2.8,w=h*R,flip=(m.fx||(p.x>m.x?1:-1))>0,c=sprC(k,h,m.fl>0);
    const ph=m.ph||0,mv=!!m.mv,bob=mv?Math.abs(Math.cos(ph))*h*0.05:(1+Math.sin(t*2.2+m.x))*h*0.008,tilt=mv?Math.sin(ph)*0.05:0,leg=LEGS[k]?h*0.3:0;
    ctx.fillStyle='#00000066';ctx.beginPath();ctx.ellipse(m.x,m.y,w*0.3*(1-bob/h),4.5,0,0,6.283);ctx.fill();
    if(m.guard){ctx.strokeStyle='#ffd34d';ctx.globalAlpha=0.6;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(m.x,m.y,w*0.45,10,0,0,6.283);ctx.stroke();ctx.globalAlpha=1}
    ctx.save();ctx.translate(m.x,m.y);if(flip)ctx.scale(-1,1);
    if(!c){ctx.fillStyle='#c060ff';ctx.beginPath();ctx.arc(0,-m.r,m.r,0,6.283);ctx.fill()}
    else if(leg){legs(w,h,leg+bob,ph,mv,WORLD.spot[m.reg]);ctx.translate(0,-leg-bob);ctx.rotate(tilt);ctx.drawImage(c,-w/2,-h*0.92,w,h*0.92)}
    else{const cw=c.width,ch=c.height,cut=0.68,lift=mv?h*0.09:0,fw=mv?Math.cos(ph)*w*0.05:0,a=mv?Math.max(0,Math.sin(ph)):0,b=mv?Math.max(0,-Math.sin(ph)):0,lb=h*(1-cut);
      // lower band split in two: each half is a leg group that lifts and swings in turn
      ctx.drawImage(c,0,ch*cut,cw/2,ch*(1-cut),-w/2+fw,-lb-a*lift,w/2,lb);
      ctx.drawImage(c,cw/2,ch*cut,cw/2,ch*(1-cut),-fw,-lb-b*lift,w/2,lb);
      ctx.translate(0,-lb);ctx.rotate(tilt);const ov=0.07;ctx.drawImage(c,0,0,cw,ch*(cut+ov),-w/2,-h*cut-bob,w,h*(cut+ov))}
    ctx.restore();const top=m.y-h-leg-bob;
    if(m.hp<m.max&&!m.guard){ctx.fillStyle='#0008';ctx.fillRect(m.x-14,top-8,28,4);ctx.fillStyle='#ff5a6a';ctx.fillRect(m.x-14,top-8,28*m.hp/m.max,4)}
    if(m.lv){const lv=st.lv||1;ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle=m.lv>lv+3?'#ff5a6a':m.lv>lv?'#ffd34d':'#ffffffcc';ctx.fillText('Lv'+m.lv,m.x,top-11)}}
  function drawPlayer(){if(p.dead>0)return;if(typeof Astro3D!=='undefined'&&Astro3D.draw(ctx,p.x,p.y+p.r*0.6,p.r*4.4,p.aim,p.moving,t,p.hurt,'#00e5ff',false))return;
    ctx.fillStyle='#f3f4f7';ctx.beginPath();ctx.arc(p.x,p.y-14,12,0,6.283);ctx.fill();ctx.fillStyle='#0b1530';ctx.beginPath();ctx.arc(p.x+Math.cos(p.aim)*4,p.y-15,6,0,6.283);ctx.fill()}
  /* ---------- 3D view (three.js): same world, camera behind the astronaut ---------- */
  function make3D(){if(typeof THREE==='undefined')return null;let R;try{R=new THREE.WebGLRenderer({canvas:c3,antialias:false,powerPreference:'low-power'})}catch(e){return null}
    R.setPixelRatio(Math.min(devicePixelRatio,1.5));const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,1,2400);
    scene.fog=new THREE.Fog(WORLD.fog[0],380,1100);scene.background=new THREE.Color(WORLD.fog[0]);
    scene.add(new THREE.HemisphereLight(0xe8f0ff,0x302838,1.0));const sun=new THREE.DirectionalLight(0xffffff,1.4);sun.position.set(300,600,200);scene.add(sun);
    const TX={},tex=k=>{if(TX[k])return TX[k];const im=img(k);if(!im)return null;const T=new THREE.Texture(im);T.needsUpdate=true;T.colorSpace&&(T.colorSpace=THREE.SRGBColorSpace);return TX[k]=T};
    // ground: one plane per region with its painted pattern
    const gmat=[];for(let r=0;r<2;r++)for(let c=0;c<3;c++){const i=GRID[r][c];const cnv=document.createElement('canvas');cnv.width=cnv.height=256;const g=cnv.getContext('2d');g.fillStyle=pat(i);g.fillRect(0,0,256,256);
      const T=new THREE.CanvasTexture(cnv);T.wrapS=T.wrapT=THREE.RepeatWrapping;T.repeat.set(10,10);const M=new THREE.MeshLambertMaterial({map:T,color:open(i)?0xffffff:0x222222});gmat[i]=M;
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(RW,RW),M);pl.rotation.x=-Math.PI/2;pl.position.set(c*RW+RW/2,0,r*RW+RW/2);scene.add(pl)}
    // props as low-poly meshes, instanced per kind
    const GEO={spike:new THREE.ConeGeometry(9,40,5),crystal:new THREE.ConeGeometry(9,38,4),shard:new THREE.ConeGeometry(5,18,4),rock:new THREE.DodecahedronGeometry(14,0),debris:new THREE.BoxGeometry(24,12,16),
      frost:new THREE.ConeGeometry(14,36,6),shroom:new THREE.CylinderGeometry(20,4,30,8),fern:new THREE.ConeGeometry(12,26,5),float:new THREE.DodecahedronGeometry(13,0),vent:new THREE.CylinderGeometry(12,14,4,10),crater:new THREE.TorusGeometry(16,3,4,12),star:new THREE.SphereGeometry(3,6,4)};
    const COLR={spike:0xe8f6ff,crystal:0xd6c4ff,shard:0xf2eaff,rock:0x2e201c,debris:0x8d8aa0,frost:0xcfeaff,shroom:0x3fae6a,fern:0x2f8a52,float:0x4a3c6a,vent:0xff6a1f,crater:0x5a4466,star:0xff9ad8};
    const dummy=new THREE.Object3D();for(const k of Object.keys(GEO)){const L=props.filter(q=>q.k===k);if(!L.length)continue;const em=k==='vent'||k==='star'||k==='crystal'||k==='shard';
      const M=new THREE.MeshLambertMaterial({color:COLR[k],emissive:em?COLR[k]:0x000000,emissiveIntensity:em?0.35:0});const I=new THREE.InstancedMesh(GEO[k],M,L.length);
      L.forEach((q,j)=>{const hgt=k==='float'?26:k==='crater'?1:k==='vent'?2:(GEO[k].parameters.height||24)/2*q.s;dummy.position.set(q.x,hgt,q.y);dummy.rotation.set(k==='crater'?Math.PI/2:0,q.x%6,0);dummy.scale.setScalar(q.s);dummy.updateMatrix();I.setMatrixAt(j,dummy.matrix)});scene.add(I)}
    for(const q of pools){const m=new THREE.Mesh(new THREE.CircleGeometry(q.r,20),new THREE.MeshBasicMaterial({color:0xff5a1f}));m.rotation.x=-Math.PI/2;m.scale.y=0.62;m.position.set(q.x,0.6,q.y);scene.add(m)}
    // the dome and the HQ
    const b=WORLD.base,dome=new THREE.Mesh(new THREE.SphereGeometry(b.r,24,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:0x00e5ff,wireframe:true,transparent:true,opacity:0.35}));dome.position.set(b.x,0,b.y);scene.add(dome);
    const spr=(k,h)=>{const T=tex(k);if(!T)return null;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:T,transparent:true,alphaTest:0.1}));const w=h*(ART[k+'R']||1);s.scale.set(w,h,1);s.center.set(0.5,0);return s};
    const hq=spr('hq',90);if(hq){hq.position.set(b.x,0,b.y);scene.add(hq)}
    for(let i=0;i<6;i++){const s=(col.wm&&col.wm.lm[i])||0;if(!s)continue;const m=i===0?{x:b.x+260,y:b.y-40}:regMid(i),L=spr('pl'+i+'_s'+s,i===5&&s===3?170:120);if(L){L.position.set(m.x,0,m.y);scene.add(L)}}
    // nodes, signals
    const NM={};for(const n of nodes){const c=new THREE.Color(MATC[REG[n.reg].mat]);const m=new THREE.Mesh(new THREE.OctahedronGeometry(9,0),new THREE.MeshLambertMaterial({color:c,emissive:c,emissiveIntensity:0.6}));m.position.set(n.x,14,n.y);m.scale.y=1.6;scene.add(m);n.m3=m}
    for(const o of pois){const m=new THREE.Mesh(new THREE.TorusGeometry(16,2.5,6,20),new THREE.MeshBasicMaterial({color:0xff7ad9}));m.position.set(o.x,20,o.y);scene.add(m);o.m3=m}
    // the astronaut
    const A=new THREE.Group(),wm=new THREE.MeshLambertMaterial({color:0xf3f4f7}),gm=new THREE.MeshLambertMaterial({color:0xf2bd4e}),vm=new THREE.MeshLambertMaterial({color:0x0b1530,emissive:0x0a4a5a,emissiveIntensity:0.8});
    const part=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);A.add(o);return o};
    part(new THREE.CapsuleGeometry(7,9,4,10),wm,0,19,0);const head=part(new THREE.SphereGeometry(7.5,14,10),wm,0,33,0);part(new THREE.SphereGeometry(5,12,8),vm,0,33.5,4.2).scale.set(1,0.8,0.6);
    part(new THREE.BoxGeometry(10,11,5),gm,0,21,-7);const legL=part(new THREE.CapsuleGeometry(2.8,7,4,8),wm,-3.5,7,0),legR=part(new THREE.CapsuleGeometry(2.8,7,4,8),wm,3.5,7,0);
    const armL=part(new THREE.CapsuleGeometry(2.4,7,4,8),wm,-9,20,0),armR=part(new THREE.CapsuleGeometry(2.4,7,4,8),wm,9,20,0);scene.add(A);
    const pool={},bul=[],ebul=[];const bm=new THREE.MeshBasicMaterial({color:0x7ffcff}),em=new THREE.MeshBasicMaterial({color:0xff5a8a}),bg=new THREE.SphereGeometry(3,6,4),eg=new THREE.SphereGeometry(5,6,4);
    function sync(arr,list,geo,mat,h){while(arr.length<list.length){const m=new THREE.Mesh(geo,mat);scene.add(m);arr.push(m)}arr.forEach((m,j)=>{const s=list[j];m.visible=!!s;if(s)m.position.set(s.x,h,s.y)})}
    let fogReg=0;
    function draw(){const w=c3.clientWidth,h=c3.clientHeight;if(c3.width!==Math.round(w*R.getPixelRatio())||c3.height!==Math.round(h*R.getPixelRatio())){R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
      const reg=Math.max(0,regAt(p.x,p.y));if(reg!==fogReg){fogReg=reg}const fc=new THREE.Color(WORLD.fog[reg]);scene.fog.color.lerp(fc,0.05);scene.background.lerp(fc,0.05);
      A.position.set(p.x,0,p.y);A.rotation.y=Math.atan2(Math.cos(p.aim),Math.sin(p.aim));A.visible=p.dead<=0;const sw=p.moving?Math.sin(t*11):0;legL.rotation.x=sw*0.7;legR.rotation.x=-sw*0.7;armL.rotation.x=-sw*0.5;armR.rotation.x=sw*0.5;
      wm.emissive.setHex(p.hurt>0?0x661020:0x000000);
      const f={x:Math.cos(cam.yaw),y:Math.sin(cam.yaw)};camera.position.set(p.x-f.x*120,78,p.y-f.y*120);camera.lookAt(p.x+f.x*70,14,p.y+f.y*70);
      const now=Date.now();for(const n of nodes){n.m3.visible=n.cd<now&&open(n.reg);if(n.m3.visible){n.m3.rotation.y=t*1.5;n.m3.position.y=14+2*Math.sin(t*3+n.x)}}
      for(const o of pois){o.m3.visible=open(o.reg)&&!(st.poi||{})[o.reg];o.m3.rotation.y=t*2}
      // monsters are billboards of the painted creatures
      const used=new Set();for(const m of mons){let s=m.s3;if(!s){const k='pl'+m.reg+'_'+(m.big?'big':'small');s=spr(k,m.guard?m.r*3.4:m.r*2.8);if(!s){s=new THREE.Sprite(new THREE.SpriteMaterial({color:0xc060ff}));s.scale.set(20,20,1)}scene.add(s);m.s3=s}
        s.position.set(m.x,m.mv?Math.abs(Math.cos(m.ph||0))*m.r*0.18:0,m.y);s.material.rotation=m.mv?Math.sin(m.ph||0)*0.07:0;s.material.color.setHex(m.fl>0?0xffffff:0xdddddd);if(m.fl>0)s.material.color.setRGB(2,2,2);used.add(s)}
      scene.children.filter(o=>o.isSprite&&o.userData.mon&&!used.has(o)).forEach(o=>{scene.remove(o);o.material.dispose()});used.forEach(s=>s.userData.mon=1);
      sync(bul,shots,bg,bm,16);sync(ebul,eshots,eg,em,16);sync(orb3,orbs,og,om,8);
      sync(fx3,fx.filter(f=>f.k!=='bolt'),rg,rm,6);fx3.forEach((m,j)=>{const f=fx.filter(q=>q.k!=='bolt')[j];if(f){m.rotation.x=-Math.PI/2;const k=f.k==='slash'?f.r*0.85:f.r*(1-f.l*2);m.scale.set(k/20,k/20,1)}});R.render(scene,camera)}
    const orb3=[],fx3=[],og=new THREE.OctahedronGeometry(4,0),om=new THREE.MeshBasicMaterial({color:0x7dff9a}),rg=new THREE.TorusGeometry(20,1.2,4,32),rm=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.8});
    function unlockReg(i){if(gmat[i])gmat[i].color.setHex(0xffffff)}
    function dispose(){try{R.dispose();R.forceContextLoss&&R.forceContextLoss()}catch(e){}}
    return {draw,unlockReg,dispose}}
  function setView(v){view=v;st.view=v;gSave('world',st);const b=hud&&hud.querySelector('.wview');
    if(v==='3d'){if(!R3)R3=make3D();if(!R3){view='2d';toast('⚠️ جهازك لا يدعم المنظور الثلاثي');}}
    cv.hidden=view!=='2d';c3.hidden=view!=='3d';if(b)b.textContent=view==='2d'?'🎥 3D':'🗺️ 2D';if(view==='2d')cam.yaw=-Math.PI/2}
  /* ---------- loop, input, lifecycle ---------- */
  function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(0.05,(now-last)/1000);last=now;if(!running)return;if(!forgeOn&&!document.querySelector('.hmodal'))update(dt);if(view==='3d'&&R3)R3.draw();else draw2d()}
  function resize(){const tb=document.querySelector('#play .topbar'),top=tb?Math.round(tb.getBoundingClientRect().bottom)+4:0;stage.style.top=top+'px';
    const w=stage.clientWidth||innerWidth,h=Math.max(300,innerHeight-top);H=Math.round(W*h/w);SC.clear();cv.width=Math.round(w*devicePixelRatio);cv.height=Math.round(h*devicePixelRatio);cv.style.height=h+'px';c3.style.height=h+'px';stage.style.height=h+'px'}
  const pd=e=>{if(e.target.closest&&e.target.closest('button'))return;joy={on:true,id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY};e.preventDefault()},
    pm=e=>{if(joy&&joy.on&&e.pointerId===joy.id){joy.x=e.clientX;joy.y=e.clientY}},pu=e=>{if(joy&&e.pointerId===joy.id)joy.on=false},
    kd=e=>{keys[e.key]=true},ku=e=>{keys[e.key]=false};
  const POIS=['حطام قمر صناعي قديم يحمل خريطة للمناطق المجاورة.','تحت الجليد جهاز يبث نفس الإشارة الغامضة.','داخل البركان بقايا محطة تعدين لم يعد منها أحد.','الكريستال هنا يغنّي حين تلمسه… ويحفظ أصوات من مرّوا قبلك.','في قلب الغابة بذرة عملاقة تنبض بضوء أخضر.','في السديم بوابة نجمية صغيرة مطفأة… من بناها؟'];
  return {id:'world',name:'عالم المدار',noDaily:true,desc:'عالم مفتوح: امشِ بين المناطق الست واجمع المواد وقاتل الوحوش والحرّاس',
    help:'حرّك الرائد بإصبعك في أي مكان على الشاشة (عصا تحكم). يطلق الرائد النار تلقائياً على أقرب وحش. قف فوق البلورات المضيئة لتجمع مادة المنطقة. 📡 إشارة قديمة في كل منطقة لها مكافأة مرة واحدة، و👑 حارس قوي في كل منطقة يعود بعد 5 دقائق من هزيمته، أو أسرع إذا قتلت 25 وحشاً في منطقته. داخل قبة القاعدة تُشفى بسرعة، والحمم تحرقك. زر 🎥 يبدّل بين المنظور العلوي والثلاثي الأبعاد. كل وحش تقتله يُسقط جواهر خبرة خضراء ترفع مستواك وقوتك. كل منطقة لها مستوى وحوش، وبوابتها تنفتح بهزيمة حارس المنطقة السابقة وبلوغ مستواها. داخل القبة تجد ⚒️ ورشة الأسلحة لتصنع وتطوّر خمسة أسلحة بمواد المناطق. قوتك تزيد أيضاً بدعم المستعمرة ومعدات الورشة.',
    icon:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#1e4733"/><path d="M4 24h40M24 4v40" stroke="#ffffff30"/><circle cx="17" cy="18" r="6" fill="#9fbfd6"/><circle cx="32" cy="30" r="7" fill="#ad9cc8"/><text x="24" y="31" font-size="16" text-anchor="middle">🧑‍🚀</text></svg>',
    progress(){const s=gState('world',{});return {level:Object.keys(s.gk||{}).length+1,stars:0}},play(){},
    start(){st=gState('world',{kills:0});buildWorld();p=newPlayer();mons=[];shots=[];eshots=[];parts=[];t=0;stage.innerHTML='';stage.classList.add('wstage');document.body.classList.add('wfull');
      cv=document.createElement('canvas');c3=document.createElement('canvas');c3.className='w3';stage.appendChild(cv);stage.appendChild(c3);ctx=cv.getContext('2d');hudBuild();resize();
      setView(st.view==='3d'?'3d':'2d');stage.addEventListener('pointerdown',pd);addEventListener('pointermove',pm);addEventListener('pointerup',pu);addEventListener('pointercancel',pu);addEventListener('keydown',kd);addEventListener('keyup',ku);addEventListener('resize',resize);
      running=true;last=performance.now();raf=requestAnimationFrame(frame);snd('win')},
    stop(){running=false;cancelAnimationFrame(raf);if(st&&p){st.x=Math.round(p.x);st.y=Math.round(p.y);delete st._d;gSave('world',st);colSave()}stage.removeEventListener('pointerdown',pd);removeEventListener('pointermove',pm);removeEventListener('pointerup',pu);removeEventListener('pointercancel',pu);removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('resize',resize);
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
