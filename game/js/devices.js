/* ================= مستعمرة المدار — base devices (phase 3) =================
   Every device the astronaut can place on a floor in «عالم المدار»: how it looks (2D and 3D, with moving parts when powered),
   what it does each frame, and the small panel that opens by itself when the astronaut walks up to it.
   build.js places, saves, wires and pipes them; numbers live in BAL.build. Saved inside col.base: d[].st (stored goods), sc (scrap). */
const WBD=(()=>{
  const C=BAL.build.cell,K=t=>BAL.build[t]||{};
  const box=(ctx,x,y,w,h,top,face)=>{ctx.fillStyle=face;ctx.fillRect(x,y,w,h);ctx.fillStyle=top;ctx.fillRect(x,y-5,w,5)};
  const shadow=(ctx,c,rx)=>{ctx.fillStyle='#00000040';ctx.beginPath();ctx.ellipse(c.x,c.y+8,rx,rx*0.33,0,0,6.283);ctx.fill()};
  const glow=(ctx,on)=>{ctx.shadowColor='#00e5ff';ctx.shadowBlur=on?12:0};
  let fxs=[];   // turret beams
  // ---- the device types (order = order in the build bar) ----
  const T={
    gen:{em:'⚙️',n:'مولد طاقة',d2(ctx,c,n,t){const spin=n.sup>0?t*(n.use?7:4):0;shadow(ctx,c,18);box(ctx,c.x-16,c.y-12,32,20,'#f5c451','#dfe5ec');ctx.fillStyle='#2a3448';ctx.fillRect(c.x-3,c.y-38,6,24);
        ctx.save();ctx.translate(c.x,c.y-38);ctx.rotate(spin);ctx.fillStyle='#f3f6fa';for(let k=0;k<3;k++){ctx.rotate(2.094);ctx.beginPath();ctx.ellipse(0,-9,3.2,9,0,0,6.283);ctx.fill()}ctx.restore();
        ctx.fillStyle='#00e5ff';glow(ctx,n.sup>0);ctx.beginPath();ctx.arc(c.x,c.y-38,3.4,0,6.283);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=n.ok?'#7dff9a':'#ff4d5e';ctx.fillRect(c.x-10,c.y-6,20*Math.min(1,n.use/(n.sup||1)),3)},
      d3(M,c){M.box(30,18,24,M.white,c.x,10,c.y);M.cyl(2.5,26,M.dark,c.x,32,c.y);const r=M.group(c.x,46,c.y);for(let k=0;k<3;k++){const a=M.sub(r);a.rotation.y=k*2.094;M.boxIn(a,3,1.5,18,M.white,0,0,9)}M.ball(r,3.5,M.cyan);
        return (t,n)=>{r.rotation.y=n.sup>0?t*(n.use?7:4):0}},
      info(d,n){return '⚡ '+n.use+'/'+n.sup+(n.sup&&!n.ok?' · الطاقة لا تكفي':'')}},
    lamp:{em:'💡',n:'مصباح',d2(ctx,c,n){const lit=n.ok&&n.sup>0;if(lit){const g=ctx.createRadialGradient(c.x,c.y-30,2,c.x,c.y-20,70);g.addColorStop(0,'#bff8ffaa');g.addColorStop(1,'#00e5ff00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y-20,70,0,6.283);ctx.fill()}
        shadow(ctx,c,9);ctx.fillStyle='#c9d1dc';ctx.fillRect(c.x-2,c.y-28,4,30);ctx.fillStyle='#f5c451';ctx.fillRect(c.x-6,c.y-2,12,4);ctx.fillStyle=lit?'#e8fdff':'#6a7486';glow(ctx,lit);ctx.beginPath();ctx.arc(c.x,c.y-32,6,0,6.283);ctx.fill();ctx.shadowBlur=0},
      d3(M,c){M.cyl(1.8,30,M.white,c.x,15,c.y);const b=M.bulb(c.x,33,c.y);return (t,n)=>{b.material.emissiveIntensity=n.ok&&n.sup>0?1.2:0}}},
    craft:{em:'🛠️',n:'طاولة تصنيع',d2(ctx,c,n,t,d){const w=d.r%2?26:40,h=d.r%2?40:26,on=n.ok&&n.sup>0;shadow(ctx,c,22);box(ctx,c.x-w/2,c.y-16,w,18,'#f5c451','#dfe5ec');
        ctx.fillStyle='#2a3448';ctx.fillRect(c.x-w/2+4,c.y-30,w-8,12);ctx.save();ctx.translate(c.x+(d.r%2?0:8),c.y-24);ctx.rotate(on?t*9:0);ctx.strokeStyle='#e8fdff';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<6;k++){const a=k*1.047;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*7,Math.sin(a)*7)}ctx.stroke();ctx.restore();
        ctx.fillStyle=on?'#00e5ff':'#5a6070';glow(ctx,on);ctx.fillRect(c.x-w/2+6,c.y-28,6,4);ctx.shadowBlur=0},
      d3(M,c,d){const w=d.r%2?26:40,dp=d.r%2?40:26;M.box(w,16,dp,M.white,c.x,9,c.y);M.box(w,2,dp,M.gold,c.x,18,c.y);const g=M.group(c.x,24,c.y);M.boxIn(g,14,2,2,M.cyan,0,0,0);M.boxIn(g,2,2,14,M.cyan,0,0,0);return (t,n)=>{g.rotation.y=n.ok&&n.sup>0?t*6:0}},
      info(d,n,b){return '♻️ خردة '+(b.sc||0)+(n.sup?'':' · يحتاج طاقة')},
      acts(d,n,b){const R=K('craft').recipes,ok=n.ok&&n.sup>0;return [['recycle','♻️ فكّك '+R.recycle.sc+' خردة ← ⛏️'+R.recycle.out.m,ok],['cell','🔋 خلية طاقة: '+R.cell.sc+' خردة + ⛏️'+R.cell.m+' ← ⚡'+R.cell.out.e,ok],['part','🧩 قطعة سلاح نادرة: '+R.part.sc+' خردة + 💎'+R.part.c,ok]]},
      act(k,d,n,b,api){const R=K('craft').recipes[k];if(!(n.ok&&n.sup>0)){api.say('⚡ الطاولة تحتاج طاقة');return}if((b.sc||0)<R.sc){snd('err');toast('تحتاج '+R.sc+' خردة ♻️');return}
        const c={m:R.m||0,e:0,c:R.c||0};if(!canPay(c)){snd('err');toast('الموارد لا تكفي');return}pay(c);b.sc-=R.sc;if(R.out.m)gain('m',R.out.m);if(R.out.e)gain('e',R.out.e);if(R.out.gear)api.addGear(R.out.gear);snd('build');toast('🛠️ '+(k==='recycle'?'فُككت الخردة':k==='cell'?'صُنعت خلية طاقة':'صُنعت قطعة سلاح نادرة 🧩'),'ach');colSave()}},
    planter:{em:'🌱',n:'حوض زراعة',d2(ctx,c,n,t,d){const on=n.ok&&n.sup>0,g=Math.min(1,(d.gr||0));shadow(ctx,c,20);box(ctx,c.x-18,c.y-12,36,14,'#f5c451','#c9d1dc');ctx.fillStyle='#4a3020';ctx.fillRect(c.x-15,c.y-12,30,6);
        for(let k=0;k<4;k++){const x=c.x-11+k*7.3,hgt=6+g*12,sw=on?Math.sin(t*2+k)*2:0;ctx.strokeStyle='#3fae6a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,c.y-12);ctx.quadraticCurveTo(x+sw,c.y-12-hgt/2,x+sw*1.5,c.y-12-hgt);ctx.stroke();ctx.fillStyle='#7dff9a';ctx.beginPath();ctx.arc(x+sw*1.5,c.y-12-hgt,2.4,0,6.283);ctx.fill()}
        if(on){ctx.fillStyle='#bff8ff55';ctx.fillRect(c.x-18,c.y-34,36,3)}},
      d3(M,c){M.box(36,12,36,M.soil,c.x,6,c.y);M.box(38,2,38,M.gold,c.x,12,c.y);const g=M.group(c.x,12,c.y);for(let k=0;k<4;k++)M.coneIn(g,3,12,M.leaf,(k%2?6:-6),6,(k<2?6:-6));return (t,n,d)=>{const s=0.4+Math.min(1,d.gr||0)*0.6;g.scale.set(1,s,1);g.rotation.y=n.ok&&n.sup>0?Math.sin(t)*0.1:0}},
      info(d,n){return '🌱 '+(n.ok&&n.sup>0?'ينمو · +'+K('planter').perMin+' 🌱/دقيقة':'متوقف: يحتاج طاقة')+(d.st?' · مخزن '+Math.floor(d.st):'')}},
    tank:{em:'🛢️',n:'خزان',d2(ctx,c,n,t,d){const f=Math.min(1,(d.st||0)/K('tank').cap);shadow(ctx,c,17);ctx.fillStyle='#dfe5ec';ctx.fillRect(c.x-14,c.y-34,28,40);ctx.fillStyle='#9ff0ff44';ctx.fillRect(c.x-10,c.y-30,20,32);
        ctx.fillStyle='#7dff9a';ctx.fillRect(c.x-10,c.y+2-32*f,20,32*f);ctx.fillStyle='#f5c451';ctx.fillRect(c.x-15,c.y-37,30,4);ctx.fillRect(c.x-15,c.y+4,30,3)},
      d3(M,c){M.cyl(14,40,M.glassT,c.x,20,c.y);const lv=M.cylM(11,1,M.leafE,c.x,0,c.y);M.cyl(15,3,M.gold,c.x,41,c.y);return (t,n,d)=>{const f=Math.max(0.02,Math.min(1,(d.st||0)/K('tank').cap));lv.scale.y=f*38;lv.position.y=f*19}},
      info(d){return '🛢️ 🌱 '+Math.floor(d.st||0)+'/'+K('tank').cap},
      acts(d){return [['take','📥 انقل إلى المستعمرة',(d.st||0)>=1]]},
      act(k,d){const n=Math.floor(d.st||0);if(n<1)return;const got=gain('f',n);d.st-=got;snd(got?'ok':'err');toast(got?'📥 +'+got+' 🌱 إلى المستعمرة':'📦 مخازن المستعمرة ممتلئة');colSave()}},
    research:{em:'🖥️',n:'شاشة أبحاث',d2(ctx,c,n,t){const on=n.ok&&n.sup>0;shadow(ctx,c,16);ctx.fillStyle='#c9d1dc';ctx.fillRect(c.x-2,c.y-18,4,20);ctx.fillStyle='#2a3448';ctx.fillRect(c.x-16,c.y-42,32,24);ctx.fillStyle='#f5c451';ctx.fillRect(c.x-17,c.y-43,34,2);
        if(on){ctx.fillStyle='#00e5ff';const p=(t*0.4)%1;ctx.fillRect(c.x-13,c.y-25,26*p,3);ctx.fillStyle='#7dff9a';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('🔬',c.x,c.y-29)}},
      d3(M,c){M.cyl(2,20,M.white,c.x,10,c.y);const s=M.box(32,22,3,M.screenM(),c.x,32,c.y);return (t,n)=>{s.material.emissiveIntensity=n.ok&&n.sup>0?0.6+0.3*Math.sin(t*3):0}},
      info(d,n){if(!(n.ok&&n.sup>0))return '🖥️ الشاشة تحتاج طاقة';if(!col.rs)return '🔬 لا بحث جارٍ: ابدأ بحثاً من المختبر';return '🔬 '+(TECH[col.rs.k]?TECH[col.rs.k].n:'')+' · '+fmtDur(Math.max(0,(col.rs.end-Date.now())/1000))}},
    radar:{em:'📡',n:'شاشة رادار',d2(ctx,c,n,t){const on=n.ok&&n.sup>0;shadow(ctx,c,16);ctx.fillStyle='#c9d1dc';ctx.fillRect(c.x-3,c.y-26,6,28);ctx.save();ctx.translate(c.x,c.y-30);ctx.scale(Math.cos(on?t*2:0.6),1);ctx.fillStyle='#eef2f6';ctx.beginPath();ctx.ellipse(0,0,15,9,0,0,6.283);ctx.fill();ctx.strokeStyle='#f5c451';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
        if(on){ctx.strokeStyle='#00e5ff66';ctx.lineWidth=1;ctx.beginPath();ctx.arc(c.x,c.y-30,18+((t*30)%30),0,6.283);ctx.stroke()}},
      d3(M,c){M.cyl(2.5,26,M.white,c.x,13,c.y);const g=M.group(c.x,30,c.y);const dish=M.dishIn(g,14,M.white);dish.rotation.x=-0.6;return (t,n)=>{g.rotation.y=n.ok&&n.sup>0?t*2:0}},
      info(d,n){return n.ok&&n.sup>0?'📡 الرادار يعمل: المناطق والحرّاس':'📡 الرادار يحتاج طاقة'},radar:1},
    turret:{em:'🗼',n:'برج دفاع',d2(ctx,c,n,t,d){const on=n.ok&&n.sup>0;shadow(ctx,c,17);box(ctx,c.x-14,c.y-14,28,16,'#f5c451','#dfe5ec');ctx.save();ctx.translate(c.x,c.y-22);ctx.rotate(d.aim==null?d.r*1.571:d.aim);ctx.fillStyle='#eef2f6';ctx.beginPath();ctx.arc(0,0,9,0,6.283);ctx.fill();ctx.fillStyle='#2a3448';ctx.fillRect(4,-2.5,16,5);ctx.restore();
        ctx.fillStyle=on?'#00e5ff':'#5a6070';glow(ctx,on);ctx.beginPath();ctx.arc(c.x,c.y-22,3,0,6.283);ctx.fill();ctx.shadowBlur=0;
        if(on&&d===T._sel){ctx.strokeStyle='#00e5ff33';ctx.beginPath();ctx.arc(c.x,c.y,K('turret').range,0,6.283);ctx.stroke()}},
      d3(M,c){M.box(28,14,28,M.white,c.x,7,c.y);const g=M.group(c.x,20,c.y);M.ball(g,9,M.white);M.boxIn(g,18,4,4,M.dark,10,0,0);return (t,n,d)=>{g.rotation.y=-(d.aim==null?d.r*1.571:d.aim)}},
      info(d,n){return n.ok&&n.sup>0?'🗼 يحمي القاعدة · مدى '+K('turret').range:'🗼 البرج يحتاج طاقة'}}};
  /* ---------- each frame: growth, pipes into tanks, turrets shooting ---------- */
  function tick(dt,b,net,pipes,api){const mons=api.mons();fxs=fxs.filter(f=>(f.l-=dt)>0);
    for(const d of b.d){const n=net[d.id]||{},on=n.ok&&n.sup>0;
      if(d.t==='planter'&&on){d.gr=((d.gr||0)+dt/30)%1.2;const add=K('planter').perMin*dt/60,tanks=(pipes[d.id]||[]).filter(x=>x.t==='tank'&&(x.st||0)<K('tank').cap);
        if(tanks.length){const tk=tanks[0];tk.st=Math.min(K('tank').cap,(tk.st||0)+add)}else d.st=Math.min(K('planter').buf,(d.st||0)+add)}
      if(d.t==='turret'&&on){d.cd=(d.cd||0)-dt;const c={x:d.gx*C+C/2,y:d.gy*C+C/2};let best=null,bd=K('turret').range;for(const m of mons){if(m.hp<=0)continue;const e=Math.hypot(m.x-c.x,m.y-c.y);if(e<bd){bd=e;best=m}}
        if(best){d.aim=Math.atan2(best.y-c.y,best.x-c.x);if(d.cd<=0){d.cd=1/K('turret').rate;fxs.push({x:c.x,y:c.y-22,x2:best.x,y2:best.y-10,l:0.12});api.hit(best,api.heroDmg()*K('turret').dmgMul)}}}}
    // a planter's own store empties into a tank as soon as a pipe joins them
    for(const d of b.d)if(d.t==='planter'&&d.st>0){const tk=(pipes[d.id]||[]).find(x=>x.t==='tank'&&(x.st||0)<K('tank').cap);if(tk){const mv=Math.min(d.st,K('tank').cap-(tk.st||0));tk.st=(tk.st||0)+mv;d.st-=mv}}}
  function fx2d(ctx){for(const f of fxs){ctx.globalAlpha=Math.min(1,f.l*10);ctx.strokeStyle='#7ffcff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke()}ctx.globalAlpha=1}
  return {T,tick,fx2d,list:Object.keys(T)}})();
