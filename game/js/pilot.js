/* ================= طيّار المدار — vertical space shooter flown in the colony's repaired ship ================= */
const PilotGame=(function(){
  const W=360,H=640;
  let cv,ctx,raf=0,last=0,st,running=false,paused=true,over=false,drag=null,keys={};
  let P,bul,eb,en,drops,parts,FT,t,wave,queue,gap,score,crys,kills,shk=0,shkA=0,bossOn=null,banner=null,neb=null,stars=[],planet=null;
  const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  /* the colony backs the ship: dock level and repaired parts */
  function shipStats(){const L=(typeof col!=='undefined'&&col.b&&col.b.dock)||0,pr=(typeof col!=='undefined'&&col.ship)?Object.values(col.ship).filter(Boolean).length:0;
    return {hull:100+12*L+10*pr,dmg:1+0.06*L+0.04*pr,L,pr}}
  const EN={scout:{hp:14,r:15,sc:60,px:64},diver:{hp:10,r:14,sc:70,px:60},bomber:{hp:60,r:24,sc:180,px:96},ufo:{hp:30,r:18,sc:120},rock:{hp:24,r:16,sc:40},boss:{hp:900,r:70,sc:3000,px:300}};
  function reset(){const S=shipStats();P={x:W/2,y:H-100,r:13,hp:S.hull,max:S.hull,dm:S.dmg,wl:1,cd:0,mcd:0,inv:0,shield:0,bank:0,vx:0,mag:70,pw:0};
    bul=[];eb=[];en=[];drops=[];parts=[];FT=[];t=0;wave=0;queue=[];gap=1.2;score=0;crys=0;kills=0;bossOn=null;banner=null;shk=0;
    stars=[];for(let i=0;i<90;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:rnd(.2,1)});planet=null}
  function shake(a,d){if(a>=shkA*shk){shkA=a;shk=d}}
  /* ---------- waves ---------- */
  function addQ(dt,fn){queue.push({at:dt,fn})}
  function nextWave(){wave++;const w=wave,boss=w%5===0;queue=[];let at=0.8;
    banner={txt:boss?'⚠️ السفينة الأم!':'الموجة '+w,sub:boss?'اهزمها لتنقذ المدار':['حزام الكويكبات','مدار المريخ','سحابة النيازك','قطاع الحرّاس','أطراف المجرة'][(w-1)%5],l:2.4};
    if(boss){addQ(1.6,()=>spawnBoss());return}
    const pats=['line','v','divers','rocks'];if(w>=2)pats.push('bomber','ufo');if(w>=4)pats.push('swarm');
    const n=3+Math.min(6,Math.floor(w/2));
    for(let i=0;i<n;i++){const p=pats[Math.floor(Math.random()*pats.length)];addQ(at,()=>formation(p,w));at+=rnd(2.2,3.4)-Math.min(1.2,w*0.06)}}
  function mk(k,x,y,o){const T=EN[k],hm=1+0.12*(wave-1);const e=Object.assign({k,x,y,vx:0,vy:60,hp:T.hp*hm,max:T.hp*hm,r:T.r,t:0,sc:T.sc,fire:rnd(1,2.5),ph:Math.random()*6},o||{});en.push(e);return e}
  function formation(p,w){const sp=1+Math.min(0.8,w*0.05);
    if(p==='line'){const n=5;for(let i=0;i<n;i++)mk('scout',40+i*(W-80)/(n-1),-30-i*14,{pat:'sine',vy:70*sp,amp:40})}
    else if(p==='v'){for(let i=0;i<7;i++){const d=Math.abs(i-3);mk('scout',W/2+(i-3)*38,-30-d*30,{pat:'down',vy:85*sp})}}
    else if(p==='divers'){for(let i=0;i<4;i++){const s=i%2?1:-1;mk('diver',s>0?W+20:-20,60+i*30,{pat:'dive',vx:-s*140,vy:20,wait:0.9+i*0.25})}}
    else if(p==='rocks'){for(let i=0;i<5;i++)mk('rock',rnd(20,W-20),-30-i*50,{pat:'rock',vy:rnd(70,120)*sp,vx:rnd(-25,25),rot:rnd(-2,2),sz:rnd(.8,1.3)})}
    else if(p==='bomber'){for(let i=0;i<2;i++)mk('bomber',W*(i?0.7:0.3),-40,{pat:'hover',vy:50,stop:rnd(110,170)})}
    else if(p==='ufo'){for(let i=0;i<3;i++)mk('ufo',W/2,-30-i*40,{pat:'circle',vy:60,cx:W/2,cy:rnd(150,220),rad:rnd(90,130),ang:i*2.1})}
    else if(p==='swarm'){for(let i=0;i<10;i++)mk('scout',rnd(30,W-30),-20-i*25,{pat:'sine',vy:110*sp,amp:rnd(20,60)})}}
  function spawnBoss(){const lvl=wave/5,hp=EN.boss.hp*(1+0.6*(lvl-1));bossOn=mk('boss',W/2,-120,{pat:'boss',vy:40,hp,max:hp,r:70,sc:3000*lvl,phase:0,fire:1.5});shake(4,0.5);snd('alarm')}
  /* ---------- weapons ---------- */
  function fire(){const d=10*P.dm,x=P.x,y=P.y-22,b=(dx,ang,k)=>bul.push({x:x+dx,y,vx:Math.sin(ang)*640,vy:-Math.cos(ang)*640,d:d*(k||1),c:'#5ff2d6'});
    const w=P.wl;if(w===1)b(0,0);else if(w===2){b(-7,0);b(7,0)}else{b(0,0,1.1);b(-9,-0.12);b(9,0.12)}
    if(w>=4){b(-16,-0.3,0.8);b(16,0.3,0.8)}if(w>=6){b(-4,0,1.1);b(4,0,1.1)}snd('laser')}
  function missile(){const tg=nearest(P.x,P.y);bul.push({x:P.x+(Math.random()<.5?-14:14),y:P.y,vx:rnd(-80,80),vy:-200,d:22*P.dm,c:'#ffb347',mis:1,tg})}
  function nearest(x,y){let b=null,bd=1e9;for(const e of en){if(e.dead||e.y<-20)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;b=e}}return b}
  /* ---------- fx ---------- */
  function boom(x,y,col,n,big){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rnd(40,big?260:160);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.3,.7),c:i%4?col:'#fff',s:rnd(1.5,big?4:2.6)})}}
  function kill(e){e.dead=1;kills++;score+=e.sc;const big=e.k==='boss'||e.k==='bomber';boom(e.x,e.y,e.k==='rock'?'#c9a27a':e.k==='boss'?'#ff3d5a':'#ffb347',big?60:16,big);snd(e.k==='boss'?'bigboom':'boom');
    if(e.k==='boss'){shake(10,0.9);bossOn=null;for(let i=0;i<10;i++)drops.push({x:e.x+rnd(-60,60),y:e.y+rnd(-30,30),k:i<6?'gem':i<8?'pow':'hp',vy:rnd(30,70)});if(typeof unlock==='function')unlock('pilot_boss')}
    else{if(big)shake(3,0.2);const r=Math.random();if(r<0.07)drops.push({x:e.x,y:e.y,k:'pow',vy:60});else if(r<0.1)drops.push({x:e.x,y:e.y,k:'hp',vy:60});else if(r<0.13)drops.push({x:e.x,y:e.y,k:'shield',vy:60});else if(r<0.45)drops.push({x:e.x,y:e.y,k:'gem',vy:70})}}
  function hit(e,d){e.hp-=d;e.fl=0.06;e.acc=(e.acc||0)+d;if(!e.accT||t-e.accT>0.25||e.hp<=0){if(FT.length<40)FT.push({x:e.x+rnd(-6,6),y:e.y-e.r*0.6,v:Math.round(e.acc),l:.7,big:e.k==='boss'});e.acc=0;e.accT=t}if(e.hp<=0&&!e.dead)kill(e)}
  function hurtP(d){if(P.inv>0||over)return;if(P.shield>0){P.shield--;P.inv=0.6;snd('err');boom(P.x,P.y,'#9fe8ff',14);return}
    P.hp-=d;P.inv=0.7;shake(Math.min(7,2+d/6),0.25);snd('err');if(typeof buzz==='function')buzz(40);if(P.wl>1&&d>=20)P.wl--;if(P.hp<=0)die()}
  /* ---------- loop ---------- */
  function update(dt){t+=dt;if(banner){banner.l-=dt;if(banner.l<=0)banner=null}
    // move
    let tx=P.x,ty=P.y;if(drag){tx=drag.x+drag.ox;ty=drag.y+drag.oy}const kx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),ky=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
    if(kx||ky){tx=P.x+kx*300*dt;ty=P.y+ky*300*dt}const nx=clamp(P.x+(tx-P.x)*Math.min(1,dt*14),18,W-18),ny=clamp(P.y+(ty-P.y)*Math.min(1,dt*14),70,H-30);
    P.vx=(nx-P.x)/Math.max(dt,1e-3);P.x=nx;P.y=ny;P.bank+=(clamp(P.vx/260,-2,2)-P.bank)*Math.min(1,dt*10);P.inv=Math.max(0,P.inv-dt);
    // shoot
    P.cd-=dt;if(P.cd<=0){P.cd=Math.max(0.09,0.17-0.01*P.wl);fire()}if(P.wl>=5){P.mcd-=dt;if(P.mcd<=0){P.mcd=0.75;missile()}}
    for(const b of bul){if(b.mis){if(!b.tg||b.tg.dead)b.tg=nearest(b.x,b.y);if(b.tg){const a=Math.atan2(b.tg.y-b.y,b.tg.x-b.x);b.vx+=Math.cos(a)*900*dt;b.vy+=Math.sin(a)*900*dt;const s=Math.hypot(b.vx,b.vy);if(s>420){b.vx*=420/s;b.vy*=420/s}}
        if(Math.random()<.6)parts.push({x:b.x,y:b.y,vx:0,vy:0,l:.25,c:'#ffb347',s:1.6})}b.x+=b.vx*dt;b.y+=b.vy*dt;
      for(const e of en){if(e.dead||b.gone)continue;if((e.x-b.x)**2+(e.y-b.y)**2<(e.r+4)**2){b.gone=1;hit(e,b.d);parts.push({x:b.x,y:b.y,vx:rnd(-60,60),vy:rnd(-60,20),l:.2,c:b.c,s:2})}}}
    bul=bul.filter(b=>!b.gone&&b.y>-30&&b.y<H+30&&b.x>-30&&b.x<W+30);
    // waves
    if(!queue.length&&!en.some(e=>!e.dead)){gap-=dt;if(gap<=0){gap=1.6;nextWave()}}else for(const q of queue){q.at-=dt;if(q.at<=0&&!q.done){q.done=1;q.fn()}}
    queue=queue.filter(q=>!q.done);
    // enemies
    for(const e of en){if(e.dead)continue;e.t+=dt;e.fl=Math.max(0,(e.fl||0)-dt);
      if(e.pat==='down'){e.y+=e.vy*dt}
      else if(e.pat==='sine'){e.y+=e.vy*dt;e.x+=Math.cos(e.t*2.4+e.ph)*e.amp*dt*2.4}
      else if(e.pat==='dive'){if(e.wait>0){e.wait-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.wait<=0){const a=Math.atan2(P.y-e.y,P.x-e.x);e.vx=Math.cos(a)*300;e.vy=Math.sin(a)*300}}else{e.x+=e.vx*dt;e.y+=e.vy*dt}}
      else if(e.pat==='rock'){e.x+=e.vx*dt;e.y+=e.vy*dt;e.rotA=(e.rotA||0)+e.rot*dt}
      else if(e.pat==='hover'){if(e.y<e.stop)e.y+=e.vy*dt;else{e.x+=Math.sin(e.t*0.8+e.ph)*40*dt;if(e.t>14)e.y+=60*dt}}
      else if(e.pat==='circle'){if(e.y<e.cy-e.rad*0.4&&!e.orb){e.y+=e.vy*dt}else{e.orb=1;e.ang+=dt*1.3;e.x=e.cx+Math.cos(e.ang)*e.rad;e.y=e.cy+Math.sin(e.ang)*e.rad*0.45;if(e.t>16)e.cy+=50*dt}}
      else if(e.pat==='boss'){if(e.y<130)e.y+=e.vy*dt;else{e.x=W/2+Math.sin(e.t*0.6)*90;bossFire(e,dt)}}
      // enemy shots
      if(e.k==='bomber'||e.k==='ufo'||(e.k==='scout'&&wave>=3)){e.fire-=dt;if(e.fire<=0&&e.y>20&&e.y<H*0.7){e.fire=e.k==='bomber'?rnd(1.2,1.8):e.k==='ufo'?rnd(1.6,2.4):rnd(2.5,4);
        if(e.k==='ufo'){for(let k=-1;k<=1;k++){const a=Math.PI/2+k*0.35;eb.push({x:e.x,y:e.y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:5,c:'#9dff5a'})}}
        else{const a=Math.atan2(P.y-e.y,P.x-e.x),s=e.k==='bomber'?190:160;eb.push({x:e.x,y:e.y+10,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:e.k==='bomber'?6:4,c:'#ff5d73'})}}}
      if(!e.dead&&(e.x-P.x)**2+(e.y-P.y)**2<(e.r*0.8+P.r)**2){if(e.k==='boss')hurtP(30);else{hurtP(e.k==='bomber'?30:e.k==='rock'?18:15);kill(e)}}
      if(e.y>H+60||e.x<-80||e.x>W+80)e.dead=1}
    en=en.filter(e=>!e.dead);
    for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;if((b.x-P.x)**2+(b.y-P.y)**2<(b.r+P.r*0.7)**2){b.gone=1;hurtP(b.big?16:9)}}eb=eb.filter(b=>!b.gone&&b.y<H+20&&b.y>-40&&b.x>-20&&b.x<W+20);
    for(const d of drops){const dx=P.x-d.x,dy=P.y-d.y,dd=Math.hypot(dx,dy);if(dd<P.mag){d.x+=dx/dd*320*dt;d.y+=dy/dd*320*dt}else d.y+=d.vy*dt;
      if(dd<P.r+12){d.gone=1;pick(d.k)}}drops=drops.filter(d=>!d.gone&&d.y<H+20);
    for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=0.94;q.vy*=0.94;q.l-=dt}parts=parts.filter(q=>q.l>0);
    for(const s of stars){s.y+=(30+140*s.z)*dt;if(s.y>H){s.y=-2;s.x=Math.random()*W}}
    if(!planet&&Math.random()<dt*0.04){const ks=['bg1','bg2','bg3','bg4'];planet={k:ks[Math.floor(Math.random()*ks.length)],x:rnd(40,W-40),y:-160,r:rnd(50,110)}}if(planet){planet.y+=22*dt;if(planet.y>H+220)planet=null}
    stats()}
  function bossFire(e,dt){e.fire-=dt;if(e.fire>0)return;e.phase=(e.phase+1)%3;const hp=e.hp/e.max;e.fire=hp<0.4?0.9:1.4;
    if(e.phase===0){for(let k=0;k<14;k++){const a=k/14*Math.PI*2+e.t;eb.push({x:e.x,y:e.y+20,vx:Math.cos(a)*130,vy:Math.sin(a)*130,r:6,c:'#ff3d5a',big:1})}}
    else if(e.phase===1){for(const s of [-1,1]){const a=Math.atan2(P.y-e.y,P.x-(e.x+s*45));for(let k=0;k<3;k++)eb.push({x:e.x+s*45,y:e.y+40,vx:Math.cos(a)*(200+k*30),vy:Math.sin(a)*(200+k*30),r:5,c:'#ffd34d'})}}
    else{for(let k=-3;k<=3;k++){const a=Math.PI/2+k*0.18;eb.push({x:e.x,y:e.y+50,vx:Math.cos(a)*170,vy:Math.sin(a)*170,r:6,c:'#ff5df2',big:1})}}
    if(hp<0.5&&Math.random()<0.3)mk('scout',e.x+rnd(-60,60),e.y+30,{pat:'down',vy:140})}
  function pick(k){if(k==='gem'){crys++;score+=10;snd('coin')}else if(k==='pow'){if(P.wl<6){P.wl++;txt('⚡ سلاح مستوى '+P.wl)}else score+=500;snd('ach')}
    else if(k==='hp'){P.hp=Math.min(P.max,P.hp+P.max*0.3);txt('🔧 إصلاح الهيكل');snd('ok')}else if(k==='shield'){P.shield=Math.min(3,P.shield+1);txt('🛡️ درع');snd('ok')}}
  function txt(s){FT.push({x:P.x,y:P.y-30,v:s,l:1.1,big:1})}
  /* ---------- drawing ---------- */
  function sprite(k,px,bank){return typeof Ship3D!=='undefined'?Ship3D.sprite(k,px,bank):null}
  const IMG={};function img(k){if(typeof ART==='undefined'||!ART[k])return null;let i=IMG[k];if(!i){i=IMG[k]=new Image();i.src=ART[k]}return i.complete&&i.naturalWidth?i:null}
  function makeNeb(){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#0a0620');gr.addColorStop(1,'#050816');g.fillStyle=gr;g.fillRect(0,0,W,H);
    for(const [x,y,r,cl] of [[60,140,180,'120,60,200'],[300,420,220,'40,120,200'],[200,620,160,'200,60,120']]){const n=g.createRadialGradient(x,y,0,x,y,r);n.addColorStop(0,`rgba(${cl},.28)`);n.addColorStop(1,`rgba(${cl},0)`);g.fillStyle=n;g.fillRect(0,0,W,H)}return c}
  function draw(){if(!neb)neb=makeNeb();ctx.save();if(shk>0&&!paused){const a=shkA*shk;ctx.translate(rnd(-a,a),rnd(-a,a))}
    ctx.drawImage(neb,0,0);
    if(planet){const im=img(planet.k);ctx.save();ctx.beginPath();ctx.arc(planet.x,planet.y,planet.r,0,6.283);ctx.clip();if(im)ctx.drawImage(im,planet.x-planet.r,planet.y-planet.r,planet.r*2,planet.r*2);
      const sh=ctx.createRadialGradient(planet.x-planet.r*0.4,planet.y-planet.r*0.4,planet.r*0.2,planet.x,planet.y,planet.r);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,10,.75)');ctx.fillStyle=sh;ctx.fillRect(planet.x-planet.r,planet.y-planet.r,planet.r*2,planet.r*2);ctx.restore()}
    for(const s of stars){ctx.fillStyle=`rgba(255,255,255,${0.3+0.6*s.z})`;ctx.fillRect(s.x,s.y,1+s.z,(1+s.z)*(1+s.z*3))}
    for(const d of drops){const em={gem:'💎',pow:'⚡',hp:'🔧',shield:'🛡️'}[d.k];ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle=d.k==='pow'?'#ffd34d':d.k==='gem'?'#5ff2d6':'#9fe8ff';ctx.beginPath();ctx.arc(d.x,d.y,12+Math.sin(t*6)*2,0,6.283);ctx.fill();ctx.restore();
      ctx.font='16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(em,d.x,d.y)}
    for(const e of en)drawEnemy(e);
    // player
    if(!over){const fl=0.7+Math.random()*0.3;ctx.save();ctx.globalCompositeOperation='lighter';for(const s of [-1,1]){const gx=P.x+s*7,gy=P.y+22;const g=ctx.createRadialGradient(gx,gy,0,gx,gy,14*fl);g.addColorStop(0,'rgba(180,255,250,.95)');g.addColorStop(1,'rgba(95,242,214,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(gx,gy+6,5,14*fl,0,0,6.283);ctx.fill()}ctx.restore();
      if(!(P.inv>0&&Math.floor(t*20)%2)){const b=Math.round(clamp(P.bank,-2,2)),sp=sprite('fighter',160,b);if(sp)ctx.drawImage(sp,P.x-34,P.y-34,68,68);else{ctx.fillStyle='#e6ecf1';ctx.beginPath();ctx.moveTo(P.x,P.y-22);ctx.lineTo(P.x+18,P.y+16);ctx.lineTo(P.x-18,P.y+16);ctx.closePath();ctx.fill()}}
      if(P.shield>0){ctx.strokeStyle=`rgba(159,232,255,${0.5+0.3*Math.sin(t*6)})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(P.x,P.y,26,0,6.283);ctx.stroke()}}
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(const b of bul){if(b.mis){ctx.fillStyle='#ffd8a0';ctx.beginPath();ctx.arc(b.x,b.y,3,0,6.283);ctx.fill();continue}ctx.strokeStyle='rgba(95,242,214,.4)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*0.02,b.y-b.vy*0.02);ctx.stroke();ctx.strokeStyle='#e8fffb';ctx.lineWidth=2;ctx.stroke()}
    for(const b of eb){const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*2);g.addColorStop(0,'#fff');g.addColorStop(0.35,b.c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r*2,0,6.283);ctx.fill()}
    for(const q of parts){ctx.globalAlpha=Math.min(1,q.l*2);ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(q.x,q.y,q.s||2,0,6.283);ctx.fill()}ctx.globalAlpha=1;ctx.restore();
    ctx.restore();
    // ui on top
    ctx.textAlign='center';ctx.lineJoin='round';for(const f of FT){f.y-=26*(paused?0:1/60);f.l-=paused?0:1/60;ctx.globalAlpha=clamp(f.l*2.5,0,1);ctx.font=`900 ${f.big?14:11}px system-ui,sans-serif`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(f.v,f.x,f.y);ctx.fillStyle=f.big?'#ffd34d':'#fff';ctx.fillText(f.v,f.x,f.y)}ctx.globalAlpha=1;FT=FT.filter(f=>f.l>0);
    // hull bar
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(10,10,W-20,8);ctx.fillStyle=P.hp/P.max>0.35?'#5ff2d6':'#ff4d6d';ctx.fillRect(10,10,(W-20)*Math.max(0,P.hp)/P.max,8);
    ctx.font='bold 12px system-ui';ctx.textAlign='left';ctx.direction='ltr';ctx.fillStyle='#fff';ctx.fillText('💎 '+crys+'   ⚡'+P.wl+(P.shield?'   🛡️'+P.shield:''),12,34);
    if(bossOn){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(40,46,W-80,10);ctx.fillStyle='#ff3d5a';ctx.fillRect(40,46,(W-80)*Math.max(0,bossOn.hp)/bossOn.max,10);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('السفينة الأم',W/2,72)}
    if(banner){ctx.globalAlpha=clamp(banner.l,0,1);ctx.textAlign='center';ctx.font='900 26px system-ui';ctx.fillStyle='#ffd34d';ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=4;ctx.strokeText(banner.txt,W/2,H*0.38);ctx.fillText(banner.txt,W/2,H*0.38);
      ctx.font='600 14px system-ui';ctx.fillStyle='#dfe7ff';ctx.fillText(banner.sub,W/2,H*0.38+26);ctx.globalAlpha=1}}
  function drawEnemy(e){const fl=e.fl>0;ctx.save();if(fl)ctx.filter='brightness(2.4)';
    if(e.k==='rock'){ctx.translate(e.x,e.y);ctx.rotate(e.rotA||0);const r=e.r*(e.sz||1);ctx.fillStyle='#6b5a4a';ctx.beginPath();for(let i=0;i<9;i++){const a=i/9*6.283,rr=r*(0.8+0.25*Math.sin(i*2.7+e.ph));i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(-r*0.3,-r*0.3,r*0.45,0,6.283);ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.arc(r*0.25,r*0.2,r*0.2,0,6.283);ctx.fill()}
    else if(e.k==='ufo'){const im=img('cre_ufo');if(im){const h=e.r*2.6,w=h*im.naturalWidth/im.naturalHeight;ctx.drawImage(im,e.x-w/2,e.y-h/2,w,h)}else{ctx.fillStyle='#9fb0c8';ctx.beginPath();ctx.ellipse(e.x,e.y,e.r,e.r*0.45,0,0,6.283);ctx.fill()}}
    else{const T=EN[e.k],sp=sprite(e.k,T.px*2,e.k==='diver'&&e.wait<=0?clamp(Math.round(e.vx/150),-2,2):0);const S=e.k==='boss'?300:e.r*4.6;
      if(sp)ctx.drawImage(sp,e.x-S/2,e.y-S/2,S,S);else{ctx.fillStyle=e.k==='bomber'?'#7a4bd6':e.k==='diver'?'#ff8a3c':'#d8344f';ctx.beginPath();ctx.moveTo(e.x,e.y+e.r);ctx.lineTo(e.x+e.r,e.y-e.r);ctx.lineTo(e.x-e.r,e.y-e.r);ctx.closePath();ctx.fill()}}
    ctx.restore();if(e.hp<e.max&&e.k!=='boss'&&e.max>20){ctx.fillStyle='#0008';ctx.fillRect(e.x-e.r,e.y-e.r-8,e.r*2,3);ctx.fillStyle='#ff4d6d';ctx.fillRect(e.x-e.r,e.y-e.r-8,e.r*2*e.hp/e.max,3)}}
  /* ---------- flow ---------- */
  function step(now){raf=requestAnimationFrame(step);const dt=Math.min(0.05,(now-last)/1000);last=now;if(running&&!paused){update(dt);if(shk>0)shk-=dt}if(ctx)draw()}
  function stats(){setStat('s1',score.toLocaleString('en'));setStat('s2',wave);setStat('s3',Math.max(0,Math.round(P.hp))+'/'+P.max);setStat('s4',(st.best||0).toLocaleString('en'))}
  function resize(){const w=stage.clientWidth,h=Math.min(w*H/W,innerHeight*0.72),sc=h/H;cv.style.width=(W*sc)+'px';cv.style.height=h+'px';cv.width=Math.round(W*sc*devicePixelRatio);cv.height=Math.round(h*devicePixelRatio);ctx.setTransform(sc*devicePixelRatio,0,0,sc*devicePixelRatio,0,0)}
  function toLocal(ev){const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*W/r.width,(ev.clientY-r.top)*H/r.height]}
  function clearOv(){stage.querySelectorAll('.overlay').forEach(o=>o.remove())}
  function overlay(html){clearOv();const o=document.createElement('div');o.className='overlay pov';o.innerHTML=html;stage.appendChild(o);return o}
  function intro(){const S=shipStats();const o=overlay(`<h3>🚀 طيّار المدار</h3><p>${st.best?`رقمك القياسي ${st.best.toLocaleString('en')} · أعلى موجة ${st.bestWave||1}`:'حرّك إصبعك لتقود المركبة، والمدافع تطلق وحدها. اجمع ⚡ لتقوية السلاح.'}</p>
      <div class="svbonus">🛠️ مركبتك: هيكل <b>${S.hull}</b> · ضرر <b>+${Math.round((S.dmg-1)*100)}%</b><br><small>طوّر حوض الإصلاح وأصلح أجزاء المركبة لتقويتها</small></div><button class="btn main" type="button">انطلق</button>`);
    o.querySelector('.btn.main').onclick=()=>{snd('tap');begin()}}
  function begin(){clearOv();reset();running=true;paused=false;over=false;last=performance.now();stats()}
  function die(){over=true;running=false;boom(P.x,P.y,'#ffb347',60,true);shake(9,0.8);snd('bigboom');
    const nb=score>(st.best||0);st.best=Math.max(st.best||0,score);st.bestWave=Math.max(st.bestWave||1,wave);st.runs=(st.runs||0)+1;gSave('pilot',st);if(wave>=10&&typeof unlock==='function')unlock('pilot_w10');
    if(typeof addXP==='function')addXP(Math.floor(score/400)+wave*3);if(typeof colonyReward==='function')colonyReward('pilot',0,{score,wave,crys,kills});
    setTimeout(()=>{const o=overlay(`<h3>${nb?'🏆 رقم قياسي جديد!':'💥 تحطّمت المركبة'}</h3><p>النقاط <b>${score.toLocaleString('en')}</b> · الموجة <b>${wave}</b> · 💎 <b>${crys}</b> · أسقطت <b>${kills}</b></p><button class="btn main" type="button">حلّق مجدداً</button>`);
      o.querySelector('.btn.main').onclick=()=>{snd('tap');begin()}},900)}
  function pause(){if(!running||over)return;paused=true;const o=overlay('<h3>⏸️ متوقف</h3><button class="btn main" type="button">أكمل</button>');o.querySelector('.btn').onclick=()=>{clearOv();paused=false;last=performance.now()}}
  return {id:'pilot',name:'طيّار المدار',noDaily:true,desc:'قُد مركبة المستعمرة ضد أساطيل الغزاة',
    help:'قُد مركبة المستعمرة في مدار الكوكب. حرّك إصبعك في أي مكان لتتحرك المركبة معه، والمدافع تطلق وحدها. اجمع ⚡ لترفع مستوى السلاح حتى 6 (من المستوى 5 تنطلق صواريخ موجّهة)، و🔧 للإصلاح، و🛡️ للدرع، و💎 للكريستال. كل 5 موجات تظهر السفينة الأم. حوض الإصلاح وأجزاء المركبة المصلَحة في المستعمرة تقوّي هيكلها وضررها، والنقاط تجلب موارد للمستعمرة.',
    icon:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#0a0c1c"/><circle cx="10" cy="12" r=".9" fill="#fff"/><circle cx="38" cy="9" r="1" fill="#fff"/><circle cx="40" cy="34" r=".8" fill="#fff"/><path d="M24 8l5 14 10 6-10 2-5 8-5-8-10-2 10-6z" fill="#e6ecf1" stroke="#f2bd4e" stroke-width="1.2"/><circle cx="24" cy="19" r="2.6" fill="#0b1530"/><ellipse cx="21" cy="39" rx="1.6" ry="4" fill="#5ff2d6"/><ellipse cx="27" cy="39" rx="1.6" ry="4" fill="#5ff2d6"/></svg>',
    progress(){const s=gState('pilot');return {level:s.bestWave||1,stars:0}},
    pauseExt(){if(running&&!over)paused=true},resumeExt(){if(running&&!over&&!stage.querySelector('.overlay')){paused=false;last=performance.now()}},
    forfeit(){if(running&&!over){clearOv();P.hp=0;die();return true}return false},
    play(){intro()},
    start(){st=gState('pilot',{best:0,bestWave:1,runs:0});reset();running=false;paused=true;over=false;
      setStats([['s1','النقاط','gold'],['s2','الموجة'],['s3','الهيكل'],['s4','الرقم القياسي']]);$('lvlBtn').hidden=true;
      cv=document.createElement('canvas');cv.className='pcv';stage.appendChild(cv);ctx=cv.getContext('2d');resize();this.rs=()=>resize();addEventListener('resize',this.rs);
      cv.addEventListener('pointerdown',ev=>{if(!running||paused)return;const [x,y]=toLocal(ev);drag={x,y,ox:P.x-x,oy:P.y-y,id:ev.pointerId};try{cv.setPointerCapture(ev.pointerId)}catch(e){}ev.preventDefault()});
      cv.addEventListener('pointermove',ev=>{if(!drag||ev.pointerId!==drag.id)return;const [x,y]=toLocal(ev);drag.x=x;drag.y=y});
      const end=ev=>{if(drag&&ev.pointerId===drag.id)drag=null};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
      this.kd=ev=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(ev.key)){keys[ev.key]=true;ev.preventDefault()}if(ev.key==='p'||ev.key==='Escape')pause()};
      this.ku=ev=>{keys[ev.key]=false};addEventListener('keydown',this.kd);addEventListener('keyup',this.ku);
      this.vis=()=>{if(document.hidden)pause()};document.addEventListener('visibilitychange',this.vis);
      btn('رحلة جديدة',IC.reset,()=>{snd('tap');begin()});
      ['fighter','scout','bomber','diver'].forEach(k=>{try{sprite(k,k==='fighter'?160:EN[k].px*2,0)}catch(e){}});
      stats();intro();last=performance.now();raf=requestAnimationFrame(step)},
    stop(){cancelAnimationFrame(raf);running=false;paused=true;drag=null;keys={};removeEventListener('resize',this.rs);removeEventListener('keydown',this.kd);removeEventListener('keyup',this.ku);document.removeEventListener('visibilitychange',this.vis)}};
})();
