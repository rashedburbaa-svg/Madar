/* ================= مستعمرة المدار — عالم المدار: terrain, weather, day & clock, edge fog, story =================
   world.js calls WX.start / update / ground2d / items2d / edge2d / overlay / make3d / draw3d / push / stop.
   Saved in arcade-world (new fields only): day, tod (time of day 0..1), wx {k,t} weather, sq (story step). Numbers: BAL.world.time / weather / story. */
const WXFX={gen:1,farm:1,raid:1,v:0};   // live effects of time and weather (read by build.js, devices.js, world.js); all 1 outside the world
const WX=(()=>{
  let A=null,feats=[],hash={},crS={},hillS={},ov=null,og=null,parts=[],hudEl=null,storyEl=null,last={},m3=null,G3=null,fogWalls=[],stT=0;
  const T=()=>BAL.world.time,WT=()=>BAL.world.weather;
  /* ---------- terrain: hills and mesas block the way, craters are shallow dips you can cross ---------- */
  function genTerrain(){feats=[];hash={};const b=A.base,m=A.moon;
    for(let i=0;i<6;i++){const R=A.seeded(700+i*37),n=BAL.world.terrain.perRegion[i];
      for(let k=0,tries=0;k<n&&tries<400;tries++){const x=A.X0+R()*(A.X1-A.X0),y=A.Y0+R()*(A.Y1-A.Y0);if(A.regAt(x,y)!==i)continue;
        const kind=R()<0.42?'crater':R()<0.6?'mesa':'hill',r=kind==='crater'?50+R()*70:kind==='mesa'?40+R()*45:70+R()*85;
        if(Math.hypot(x-b.x,y-b.y)<b.r+r+260||Math.hypot(x-m.x,y-m.y)<r+160)continue;
        if(x>1560-r&&x<2060+r&&y>700-r&&y<1080+r)continue;   // keep the first base plot free
        if(feats.some(f=>Math.hypot(f.x-x,f.y-y)<f.r+r+60))continue;
        if(Object.keys((col.base&&col.base.f)||{}).some(k=>{const [a,c]=k.split(',');return Math.hypot(+a*48+24-x,+c*48+24-y)<r+90}))continue;   // never on top of what the player built
        const f={x,y,r,kind,reg:i,h:kind==='mesa'?40+R()*30:kind==='hill'?r*0.5:0,sx:0.85+R()*0.3,rot:R()*6.283};feats.push(f);k++;
        if(kind!=='crater'){const gx=Math.floor(x/400),gy=Math.floor(y/400);for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++)(hash[(gx+a)+','+(gy+c)]=hash[(gx+a)+','+(gy+c)]||[]).push(f)}}}}
  function push(q,r){const L=hash[Math.floor(q.x/400)+','+Math.floor(q.y/400)];if(!L)return;for(const f of L){const R2=f.r*(f.kind==='mesa'?0.92:0.8)+r,dx=q.x-f.x,dy=(q.y-f.y)/f.sx,d=Math.hypot(dx,dy);if(d<R2&&d>0.01){q.x=f.x+dx/d*R2;q.y=f.y+dy/d*R2*f.sx}}}
  function blocked(x,y,r){const L=hash[Math.floor(x/400)+','+Math.floor(y/400)];return !!L&&L.some(f=>Math.hypot(x-f.x,(y-f.y)/f.sx)<f.r*0.85+r)}
  // pre-painted sprites (once per region and kind), so the 2D view only copies images each frame
  function hillSprite(f){const key=f.kind+f.reg;if(hillS[key])return hillS[key];const c=document.createElement('canvas');c.width=256;c.height=200;const g=c.getContext('2d'),col=A.ground[f.reg],sp=A.spot[f.reg];
    if(f.kind==='hill'){const G=g.createRadialGradient(108,92,8,128,118,124);G.addColorStop(0,sp);G.addColorStop(0.45,col);G.addColorStop(1,'#00000000');g.fillStyle=G;g.beginPath();g.ellipse(128,120,124,78,0,0,6.283);g.fill();
      g.globalAlpha=0.35;g.fillStyle='#000';g.beginPath();g.ellipse(140,150,110,40,0,0,6.283);g.fill();g.globalAlpha=0.5;g.fillStyle='#ffffff';g.beginPath();g.ellipse(100,78,40,16,-0.3,0,6.283);g.fill()}
    else{g.fillStyle='#00000055';g.beginPath();g.ellipse(128,170,110,28,0,0,6.283);g.fill();g.fillStyle=col;g.beginPath();g.moveTo(22,166);g.lineTo(42,58);g.lineTo(214,58);g.lineTo(234,166);g.closePath();g.fill();
      g.fillStyle='#00000033';g.fillRect(128,58,106,108);g.fillStyle=sp;g.beginPath();g.ellipse(128,58,86,26,0,0,6.283);g.fill();g.strokeStyle='#ffffff55';g.lineWidth=3;g.beginPath();g.ellipse(128,58,86,26,0,3.3,6.1);g.stroke();
      g.strokeStyle='#00000040';g.lineWidth=2;for(let k=0;k<5;k++){g.beginPath();g.moveTo(50+k*36,70);g.lineTo(44+k*38,160);g.stroke()}}
    return hillS[key]=c}
  function craterSprite(reg){if(crS[reg])return crS[reg];const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const G=g.createRadialGradient(64,70,4,64,64,62);G.addColorStop(0,'rgba(0,0,0,.45)');G.addColorStop(0.75,'rgba(0,0,0,.2)');G.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=G;g.beginPath();g.ellipse(64,64,62,44,0,0,6.283);g.fill();g.strokeStyle=A.spot[reg];g.globalAlpha=0.7;g.lineWidth=6;g.beginPath();g.ellipse(64,64,56,38,0,0.15,3.0);g.stroke();g.strokeStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(64,62,56,38,0,3.3,6.1);g.stroke();return crS[reg]=c}
  function ground2d(ctx,cam,W,H){for(const f of feats){if(f.kind!=='crater'||f.x+f.r<cam.x||f.x-f.r>cam.x+W||f.y+f.r<cam.y||f.y-f.r>cam.y+H)continue;ctx.drawImage(craterSprite(f.reg),f.x-f.r,f.y-f.r*0.75,f.r*2,f.r*1.5)}}
  function items2d(L,vis,ctx){for(const f of feats){if(f.kind==='crater'||!vis(f.x,f.y))continue;const w=f.r*2.1,h=w*0.78;L.push([f.y+f.r*0.4,()=>ctx.drawImage(hillSprite(f),f.x-w/2,f.y-h*0.62,w,h)])}}
  // the planet's edge fades into fog instead of stopping at a hard line
  function edge2d(ctx,cam,W,H){const F=BAL.world.edgeFog,c='11,16,34';const band=(x,y,w,h,x1,y1,x2,y2)=>{const G=ctx.createLinearGradient(x1,y1,x2,y2);G.addColorStop(0,`rgba(${c},0)`);G.addColorStop(1,`rgba(${c},0.97)`);ctx.fillStyle=G;ctx.fillRect(x,y,w,h)};
    const e={l:A.X0+F,r:A.X1-F,t:A.Y0+F,b:A.Y1-F};
    if(cam.x<e.l)band(cam.x-10,cam.y-10,e.l-cam.x+10,H+20,e.l,0,A.X0+90,0);if(cam.x+W>e.r)band(e.r,cam.y-10,cam.x+W-e.r+10,H+20,e.r,0,A.X1-90,0);
    if(cam.y<e.t)band(cam.x-10,cam.y-10,W+20,e.t-cam.y+10,0,e.t,0,A.Y0+90);if(cam.y+H>e.b)band(cam.x-10,e.b,W+20,cam.y+H-e.b+10,0,e.b,0,A.Y1-90)}
  /* ---------- day and clock ---------- */
  const night=tod=>tod<0.21||tod>0.83,light=tod=>{const s=Math.sin((tod-0.25)*Math.PI*2);return Math.max(0,Math.min(1,0.5+s*0.85))};   // 0 night … 1 noon
  function clockTxt(st){const h=Math.floor(st.tod*24),m=Math.floor((st.tod*24-h)*60);return (h<10?'0':'')+h+':'+(m<10?'0':'')+m}
  /* ---------- weather: clear or a storm whose look depends on the region you stand in ---------- */
  const STORM={0:['🌪️','عاصفة غبار','#c9b49a'],1:['❄️','عاصفة ثلجية','#eaf6ff'],2:['🔥','مطر جمر','#ff8a3a'],3:['✨','غبار بلّوري','#d9c8ff'],4:['🍄','سحابة أبواغ','#9dff9a'],5:['🌌','شفق السديم','#ff8ad8']};
  function wxTick(dt,st){const W2=WT();st.wx=st.wx||{k:'clear',t:W2.minS};st.wx.t-=dt;if(st.wx.t>0)return;const was=st.wx.k;st.wx.k=Math.random()<W2.stormP?'storm':'clear';st.wx.t=W2.minS+Math.random()*(W2.maxS-W2.minS);
    if(st.wx.k!==was){const r=Math.max(0,A.regAt(A.player().x,A.player().y)),S=STORM[r];toast(st.wx.k==='storm'?S[0]+' '+S[1]+': المولدات −'+Math.round((1-W2.storm.gen)*100)+'% والزراعة −'+Math.round((1-W2.storm.farm)*100)+'%':'☀️ صفا الجو')}}
  function fxCalc(st){const W2=WT(),n=night(st.tod),s=st.wx&&st.wx.k==='storm';const g=(s?W2.storm.gen:1)*(n?T().nightGen:1),f=(s?W2.storm.farm:n?1:W2.clearFarm);
    if(Math.abs(g-WXFX.gen)>0.001||Math.abs(f-WXFX.farm)>0.001){WXFX.gen=g;WXFX.farm=f;WXFX.v++;if(typeof WB!=='undefined'&&WB.refresh)WB.refresh()}WXFX.raid=n?T().nightRaid:1}
  /* ---------- story: one journey from the first base to the finished ship ---------- */
  const S=()=>{const b=col.base||{},u=(col.wm&&col.wm.u)||{},sp=b.sp||{},p=A.player();return {b,u,sp,p,st:A.st()}};
  const STEPS=[
    ['📖 الفصل 1 · النجاة','اخرج من القبة واستكشف ما حولها',x=>Math.hypot(x.p.x-A.base.x,x.p.y-A.base.y)>A.base.r+160,'ORBIT: الهواء هنا رقيق والوحوش قريبة. لنبدأ بالنجاة: كل شيء يبدأ بخطوة خارج القبة.'],
    ['📖 الفصل 1 · النجاة','شغّل مولداً في قاعدتك (🔨 ثم وصّله بسلك)',x=>(x.b.d||[]).some(d=>d.t==='gen')&&(x.b.wi||[]).length>0,'ORBIT: الطاقة تعني الحياة. المولد يدير الأجهزة، والفائض يذهب للمستعمرة.'],
    ['📖 الفصل 1 · النجاة','انجُ حتى صباح اليوم الثاني',x=>(x.st.day||1)>=2,'ORBIT: الليل أخطر: الغارات أسرع والمولدات أضعف. المصابيح والأبراج صديقتك.'],
    ['📖 الفصل 1 · النجاة','اصمد أمام أول غارة على القاعدة',x=>(x.b.rl||0)>=1,'ORBIT: صمدت! الجدران والأبراج والرادار هي ما يبقينا أحياء.'],
    ['📖 الفصل 1 · النجاة','ضع منصة تجميع المركبة 🛸 وركّب أول جزء',x=>Object.keys(x.sp).length>=1,'ORBIT: أول جزء من المركبة! الطريق إلى المدار يمر بالمناطق الست.'],
    ['🧭 الفصل 2 · الاستكشاف','افتح زيفيروس الجليدي (اهزم حارس المدار-1)',x=>!!x.u[1],'ORBIT: الجليد يخبئ ما نحتاجه لمنظومة الدفع.'],
    ['🧭 الفصل 2 · الاستكشاف','افتح كوكب الحمم',x=>!!x.u[2],'ORBIT: الصهارة هنا تصنع نواة الطاقة.'],
    ['🧭 الفصل 2 · الاستكشاف','افتح كوكب الكريستال',x=>!!x.u[3],'ORBIT: الكوارتز يكمل مصفوفة الرادار.'],
    ['🧭 الفصل 2 · الاستكشاف','ركّب أربعة أجزاء للمركبة',x=>Object.keys(x.sp).length>=4,'ORBIT: المركبة شبه جاهزة. بقيت الملاحة النهائية.'],
    ['🚀 الفصل 3 · العودة إلى المدار','افتح العملاق الأخضر',x=>!!x.u[4],'ORBIT: الغابة حيّة… انتبه للأبواغ.'],
    ['🚀 الفصل 3 · العودة إلى المدار','افتح سديم المدار',x=>!!x.u[5],'ORBIT: هنا مصدر الإشارة الغامضة، وغاز السديم للملاحة.'],
    ['🚀 الفصل 3 · العودة إلى المدار','ركّب وحدة الملاحة النهائية 🧭',x=>!!x.sp.nav,'ORBIT: اكتملت المركبة. المدار ينتظرك يا رائد.']];
  function storyTick(){const x=S(),st=x.st;if(st.sq==null){st.sq=0;A.save();storyBox('🧑‍🚀 ORBIT','تحطمت المركبة على كوكب غريب. القبة تحمينا الآن، لكن لنعود إلى المدار نحتاج قاعدة وطاقة وأجزاء المركبة الخمسة من المناطق الست.','لنبدأ')}
    if(st.sq>=STEPS.length){storyEl.hidden=true;return}const P=STEPS[st.sq];
    if(P[2](x)){const rw=BAL.world.story.gems+st.sq;col.res.c+=rw;st.sq++;A.save();colSave();snd('ach');storyBox(P[0],'✅ '+P[1]+'\n\n'+P[3]+'\n\n+'+rw+' 💎','تابع');return storyDraw()}}
  function storyDraw(){if(!storyEl)return;const st=A.st(),i=st.sq||0;if(i>=STEPS.length){storyEl.hidden=true;return}const P=STEPS[i];storyEl.hidden=false;
    storyEl.innerHTML=`<small>${P[0]} · ${i+1}/${STEPS.length}</small><b>${P[1]}</b>`;if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(storyEl)}
  /* ---------- overlay: weather particles, storm haze and (in 2D) the night with lit circles ---------- */
  function overlay(view){if(!ov||!A)return;const st=A.st(),w=ov.clientWidth,h=ov.clientHeight;if(ov.width!==w||ov.height!==h){ov.width=w;ov.height=h}const g=og;g.clearRect(0,0,w,h);
    const lt=light(st.tod),storm=st.wx&&st.wx.k==='storm',r=Math.max(0,A.regAt(A.player().x,A.player().y)),SC=STORM[r];
    if(view==='2d'&&lt<0.85){g.fillStyle=`rgba(7,11,30,${(0.85-lt)*0.72})`;g.fillRect(0,0,w,h);g.globalCompositeOperation='destination-out';const p=A.player(),cam=A.cam,k=w/A.W();
      const hole=(x,y,rad)=>{const G=g.createRadialGradient(x,y,4,x,y,rad);G.addColorStop(0,'rgba(0,0,0,.9)');G.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=G;g.fillRect(x-rad,y-rad,rad*2,rad*2)};
      hole((p.x-cam.x)*k,(p.y-cam.y)*k,110*k);for(const d of ((col.base&&col.base.d)||[])){if(d.t!=='lamp'&&d.t!=='gen')continue;const x=(d.gx*48+24-cam.x)*k,y=(d.gy*48+24-cam.y)*k;if(x>-80&&y>-80&&x<w+80&&y<h+80)hole(x,y,(d.t==='lamp'?95:45)*k)}
      g.globalCompositeOperation='source-over'}
    if(storm){g.fillStyle=SC[2]+'22';g.fillRect(0,0,w,h)}
    const want=storm?BAL.world.weather.particles:12;while(parts.length<want)parts.push({x:Math.random()*w,y:Math.random()*h,s:0.5+Math.random(),a:Math.random()*6.283});if(parts.length>want)parts.length=want;
    const col2=storm?SC[2]:'#ffffff',dx=storm?(r===1?-40:r===2?10:r===4?14:-120):6,dy=storm?(r===1?80:r===2?-50:r===4?-18:20):-8,dt=1/60;g.fillStyle=col2;
    for(const q of parts){q.x+=dx*q.s*dt*(storm?1:0.4)+Math.sin(q.a+=dt)*0.3;q.y+=dy*q.s*dt*(storm?1:0.4);if(q.x<-10)q.x=w+10;if(q.x>w+10)q.x=-10;if(q.y<-10)q.y=h+10;if(q.y>h+10)q.y=-10;
      g.globalAlpha=storm?0.55:0.25;if(storm&&(r===0||r===3)){g.fillRect(q.x,q.y,6*q.s,1.4)}else{g.beginPath();g.arc(q.x,q.y,storm?1.6*q.s+0.6:1,0,6.283);g.fill()}}g.globalAlpha=1}
  /* ---------- 3D: hills, mesas, craters, edge fog walls; light follows the time of day ---------- */
  function make3d(scene,L){m3=L;G3=new THREE.Group();const geoH=new THREE.SphereGeometry(1,14,9,0,Math.PI*2,0,Math.PI/2),geoM=new THREE.CylinderGeometry(0.78,1,1,9),geoC=new THREE.TorusGeometry(1,0.12,6,20),geoD=new THREE.CircleGeometry(1,20),darkM=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3,depthWrite:false}),mats={};
    const mat=(i,k)=>mats[i+k]||(mats[i+k]=new THREE.MeshStandardMaterial({color:new THREE.Color(k==='top'?A.spot[i]:A.ground[i]).multiplyScalar(k==='top'?1.5:1.3),roughness:0.92,flatShading:true}));
    for(const f of feats){if(f.kind==='hill'){const o=new THREE.Mesh(geoH,mat(f.reg,'b'));o.scale.set(f.r,f.h,f.r*f.sx);o.position.set(f.x,0,f.y);o.rotation.y=f.rot;G3.add(o)}
      else if(f.kind==='mesa'){const o=new THREE.Mesh(geoM,mat(f.reg,'b'));o.scale.set(f.r,f.h,f.r*f.sx);o.position.set(f.x,f.h/2,f.y);o.rotation.y=f.rot;G3.add(o);const tp=new THREE.Mesh(new THREE.CylinderGeometry(0.78,0.78,0.06,9),mat(f.reg,'top'));tp.scale.set(f.r,f.h,f.r*f.sx);tp.position.set(f.x,f.h,f.y);tp.rotation.y=f.rot;G3.add(tp)}
      else{const o=new THREE.Mesh(geoC,mat(f.reg,'top'));o.rotation.x=Math.PI/2;o.scale.set(f.r,f.r*0.72,f.r*0.35);o.position.set(f.x,1,f.y);G3.add(o);const d=new THREE.Mesh(geoD,darkM);d.rotation.x=-Math.PI/2;d.scale.set(f.r*0.95,f.r*0.68,1);d.position.set(f.x,0.6,f.y);G3.add(d)}}
    // fog walls at the edge of the world (a soft gradient, never a hard line)
    const c=document.createElement('canvas');c.width=4;c.height=64;const g=c.getContext('2d'),Gr=g.createLinearGradient(0,0,0,64);Gr.addColorStop(0,'rgba(11,16,34,0)');Gr.addColorStop(1,'rgba(11,16,34,1)');g.fillStyle=Gr;g.fillRect(0,0,4,64);const tex=new THREE.CanvasTexture(c);
    const fm=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide}),F=BAL.world.edgeFog,W2=A.X1-A.X0,H2=A.Y1-A.Y0;
    const wall=(w,x,z,ry)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,F),fm);o.rotation.x=-Math.PI/2;o.rotation.z=ry;o.position.set(x,2,z);G3.add(o)};
    wall(W2,(A.X0+A.X1)/2,A.Y0+F/2,0);wall(W2,(A.X0+A.X1)/2,A.Y1-F/2,Math.PI);wall(H2,A.X0+F/2,(A.Y0+A.Y1)/2,-Math.PI/2);wall(H2,A.X1-F/2,(A.Y0+A.Y1)/2,Math.PI/2);
    scene.add(G3)}
  const NC=new THREE.Color(0x7d8cff),DC=new THREE.Color(0xfff0d8);
  function draw3d(t,p){if(!m3||!A)return;const st=A.st(),lt=light(st.tod),storm=st.wx&&st.wx.k==='storm';
    m3.sun.intensity=0.35+1.6*lt*(storm?0.6:1);m3.sun.color.copy(NC).lerp(DC,lt);m3.hemi.intensity=0.45+0.45*lt;m3.rim.intensity=0.5+0.4*(1-lt);m3.R.toneMappingExposure=0.75+0.5*lt;
    const sc=m3.R&&m3.sun.parent;if(sc&&sc.fog){const k=storm?0.5:1;sc.fog.near+=(620*k-sc.fog.near)*0.03;sc.fog.far+=(1750*k-sc.fog.far)*0.03}}
  /* ---------- HUD: clock + weather pill, story pill ---------- */
  function hudDraw(){if(!hudEl)return;const st=A.st(),n=night(st.tod),storm=st.wx&&st.wx.k==='storm',r=Math.max(0,A.regAt(A.player().x,A.player().y));
    const txt=`${n?'🌙':'☀️'} يوم ${st.day||1} · ${clockTxt(st)}${storm?' · '+STORM[r][0]:''}`;if(last.h!==txt){last.h=txt;hudEl.textContent=txt;hudEl.title=storm?STORM[r][1]:''}}
  /* ---------- 🏛️ colony panel: the colony's economy lives inside the world now (resources, buildings, lab, ship, tasks, trader) ---------- */
  let cpEl=null,cpBtn=null,cpT=0;
  const CPB=[['list','🏗️','المباني'],['lab','🧪','المختبر'],['dock','🛸','المركبة'],['tasks','📋','المهام'],['trader','🛒','التاجر'],['farm','🌾','المزرعة']];
  function cpRes(){if(!cpEl||cpEl.hidden)return;accrue();const C=cap(),bl=col.build,r=k=>`<span><i>${{m:'🔩',e:'⚡',f:'🍎',c:'💎'}[k]}</i><b>${fmtN(col.res[k])}</b>${k!=='c'?'<small>/'+fmtN(C)+'</small>':''}${k!=='c'?'<em>+'+fmtN(rate(k))+'/س</em>':''}</span>`;
    const h=`<div class="wcres">${['m','e','f','c'].map(r).join('')}</div>${bl?`<div class="wcbld">🔨 ${BLD[bl.id].name} ← مستوى ${col.b[bl.id]+1} · ${fmtDur((bl.end-Date.now())/1000)}</div>`:''}`;
    const top=cpEl.querySelector('.wctop');if(top.innerHTML!==h){top.innerHTML=h;if(typeof trNode==='function'&&I18N.on)trNode(top)}}
  function cpOpen(v){if(!cpEl)return;cpEl.hidden=!v;cpBtn.classList.toggle('on',v);if(v){snd('tap');cpRes()}}
  function cpBuild(){cpBtn=document.createElement('button');cpBtn.type='button';cpBtn.className='wcolb';cpBtn.setAttribute('aria-label','المستعمرة');cpBtn.textContent='🏛️';A.hud.appendChild(cpBtn);
    cpEl=document.createElement('div');cpEl.className='wcol';cpEl.hidden=true;cpEl.innerHTML=`<div class="wchd"><b>🏛️ المستعمرة</b><button type="button" class="wcx" aria-label="إغلاق">✕</button></div><div class="wctop"></div><div class="wcgrid">${CPB.map(([id,em,n])=>`<button type="button" data-cs="${id}"><i>${em}</i>${n}</button>`).join('')}<button type="button" data-cs="hub"><i>🎮</i>الألعاب</button></div>`;
    A.hud.appendChild(cpEl);if(typeof trNode==='function'&&I18N.on)trNode(cpEl);
    for(const ev of ['pointerdown','touchstart'])cpEl.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
    cpBtn.onclick=e=>{e.stopPropagation();cpOpen(cpEl.hidden)};cpEl.querySelector('.wcx').onclick=e=>{e.stopPropagation();cpOpen(false)};
    cpEl.querySelectorAll('[data-cs]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.cs;snd('tap');if(id==='hub'){goHub();return}
      if(id==='farm'&&!(col.b.farm>0)){toast('🔒 ابنِ المزرعة المائية أولاً');return}cpOpen(false);openSheet(id)})}
  /* ---------- lifecycle ---------- */
  function start(api){A=api;const st=A.st();st.day=st.day||1;if(st.tod==null)st.tod=T().startTod;genTerrain();parts=[];last={};
    ov=document.createElement('canvas');ov.className='wxov';A.stage.appendChild(ov);og=ov.getContext('2d');
    hudEl=document.createElement('div');hudEl.className='wclock';A.hud.appendChild(hudEl);storyEl=document.createElement('div');storyEl.className='wstory';A.hud.appendChild(storyEl);storyDraw();cpBuild();fxCalc(st)}
  function update(dt){if(!A)return;const st=A.st(),before=night(st.tod);st.tod+=dt/T().dayS;if(st.tod>=1){st.tod-=1;st.day=(st.day||1)+1;snd('ok');toast('🌅 بدأ اليوم '+st.day);A.save()}
    if(!before&&night(st.tod))toast('🌙 حلّ الليل: الغارات أسرع والمولدات أضعف، والمصابيح تنير الطريق');wxTick(dt,st);fxCalc(st);hudDraw();stT-=dt;if(stT<=0){stT=0.8;storyTick()}cpT-=dt;if(cpT<=0){cpT=1;cpRes()}}
  function stop(){if(ov)ov.remove();ov=og=null;hudEl=storyEl=cpEl=cpBtn=null;A=null;m3=null;G3=null;WXFX.gen=1;WXFX.farm=1;WXFX.raid=1;WXFX.v++}
  return {start,update,stop,push,blocked,ground2d,items2d,edge2d,overlay,make3d,draw3d,feats:()=>feats}})();

/* عالم المدار is the home screen: the app opens straight into it (the old colony screen stays one tap away under 🏛️ → 🎮, so saves and mini-games are untouched) */
{let tries=0;const go=()=>{try{if(typeof WorldGame==='undefined'||/[?&]hub\b/.test(location.search))return;const h=document.getElementById('hub');if(!h||h.hidden)return;
  if(document.querySelector('.hmodal')||document.querySelector('#csheet.on')){if(++tries<240)setTimeout(go,500);return}openGame(WorldGame)}catch(e){console.warn(e)}};setTimeout(go,60)}
