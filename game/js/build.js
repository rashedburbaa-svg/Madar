/* ================= مستعمرة المدار — free modular building in «عالم المدار» (phase 1) =================
   Fortnite/ARK style: the piece goes on the grid cell in front of the astronaut and snaps by itself.
   Pieces: floor, wall (on a cell edge), power generator, lamp, and wires between devices (power network).
   Saved in the colony save (arcade-colony) as col.base = {f:{"gx,gy":1}, w:{"gx,gy,h|v":1}, d:[{id,t,gx,gy}], wi:[[idA,idB]], n:nextId}.
   Building zone: المدار-1, outside the dome and away from the moon diorama. Numbers: BAL.build. */
const WB=(()=>{
  const C=BAL.build.cell;let api=null,on=false,tool='floor',rot=0,sel=null,dirty=true,net={},bar=null,chip=null,G3=null,blades=[],lamps3=[],pulse=0;
  const B=()=>{if(!col.base||typeof col.base!=='object')col.base={};const b=col.base;b.f=b.f||{};b.w=b.w||{};b.d=Array.isArray(b.d)?b.d:[];b.wi=Array.isArray(b.wi)?b.wi:[];b.n=b.n||1;return b};
  const TOOLS=[['floor','⬜','أرضية'],['wall','🧱','جدار'],['gen','⚙️','مولد طاقة'],['lamp','💡','مصباح'],['wire','🔌','سلك'],['del','🗑️','إزالة']];
  const cost=k=>BAL.build[k]?{m:BAL.build[k].m||0,e:BAL.build[k].e||0}:{m:0,e:0};
  const costTxt=k=>{const c=cost(k);return (c.m?'⛏️'+c.m:'')+(c.e?' ⚡'+c.e:'')};
  const ctr=(gx,gy)=>({x:gx*C+C/2,y:gy*C+C/2});
  const dev=id=>B().d.find(d=>d.id===id);
  const devAt=(gx,gy)=>B().d.find(d=>d.gx===gx&&d.gy===gy);
  // the zone where the base may grow
  function zoneOk(gx,gy){if(!api)return false;const {x,y}=ctr(gx,gy),b=api.base,m=api.moon;return api.regAt(x,y)===0&&api.regAt(x-C/2,y-C/2)===0&&api.regAt(x+C/2,y+C/2)===0&&Math.hypot(x-b.x,y-b.y)>b.r+C*0.75&&Math.hypot(x-m.x,y-m.y)>130}
  // target: the cell in front of the astronaut; a wall takes the edge of that cell that faces the astronaut, turned by «تدوير»
  function target(){const p=api.player(),a=p.face==null?-Math.PI/2:p.face,R=BAL.build.reach,tx=p.x+Math.cos(a)*R,ty=p.y+Math.sin(a)*R,gx=Math.floor(tx/C),gy=Math.floor(ty/C),c=ctr(gx,gy);
    const dx=p.x-c.x,dy=p.y-c.y,auto=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0),r=(auto+rot)%4;
    const edge=r===0?[gx,gy,'h']:r===1?[gx+1,gy,'v']:r===2?[gx,gy+1,'h']:[gx,gy,'v'];return {gx,gy,edge,ek:edge.join(',')}}
  function why(k,T){const b=B(),fk=T.gx+','+T.gy;
    if(k==='del')return devAt(T.gx,T.gy)||b.w[T.ek]||b.f[fk]?'':'لا شيء هنا لإزالته';
    if(k==='wire')return '';
    if(!zoneOk(T.gx,T.gy))return 'ابنِ في المدار-1 خارج القبة';
    if(k==='floor')return b.f[fk]?'هنا أرضية':'';
    if(k==='wall')return b.w[T.ek]?'هنا جدار':'';
    if(!b.f[fk])return 'ضع أرضية أولاً';if(devAt(T.gx,T.gy))return 'المكان مشغول';return ''}
  function pay2(k){const c=cost(k);if(!canPay(c)){snd('err');toast('الموارد لا تكفي: '+costTxt(k));return false}pay(c);return true}
  function refund(k){const c=cost(k),f=BAL.build.refund;if(c.m)gain('m',Math.round(c.m*f));if(c.e)gain('e',Math.round(c.e*f))}
  function changed(){dirty=true;colSave();if(typeof updRes==='function')try{updRes()}catch(e){}if(G3)build3d()}
  function place(){const T=target(),b=B(),k=tool,w=why(k,T),fk=T.gx+','+T.gy;
    if(k==='wire')return wire();
    if(w){snd('err');api.say('🚫 '+w);return}
    if(k==='del'){const d=devAt(T.gx,T.gy);if(d){b.d=b.d.filter(x=>x!==d);b.wi=b.wi.filter(([a,c])=>{const hit=a===d.id||c===d.id;if(hit)refund('wire');return !hit});refund(d.t)}
      else if(b.w[T.ek]){delete b.w[T.ek];refund('wall')}else{delete b.f[fk];refund('floor')}snd('tap');buzz(10);return changed()}
    if(!pay2(k))return;
    if(k==='floor')b.f[fk]=1;else if(k==='wall')b.w[T.ek]=1;else b.d.push({id:b.n++,t:k,gx:T.gx,gy:T.gy});
    snd('build');buzz(12);changed()}
  // wires: stand by a device and tap ✔, then by a second device and tap ✔ again
  function near(){const p=api.player();let best=null,bd=80;for(const d of B().d){const c=ctr(d.gx,d.gy),e=Math.hypot(c.x-p.x,c.y-p.y);if(e<bd){bd=e;best=d}}return best}
  function wire(){const d=near(),b=B();if(!d){snd('err');api.say('🔌 اقترب من مولد أو جهاز');return}
    if(!sel||!dev(sel)){sel=d.id;snd('tap');api.say('🔌 اختر الجهاز الثاني');return paint()}
    if(sel===d.id){sel=null;return paint()}
    const a=dev(sel),ca=ctr(a.gx,a.gy),cb=ctr(d.gx,d.gy);if(Math.hypot(ca.x-cb.x,ca.y-cb.y)>BAL.build.wireMaxCells*C){snd('err');api.say('🔌 السلك لا يصل: الحد '+BAL.build.wireMaxCells+' خانات');return}
    const i=b.wi.findIndex(([x,y])=>(x===sel&&y===d.id)||(x===d.id&&y===sel));
    if(i>=0){b.wi.splice(i,1);refund('wire');toast('✂️ قُطع السلك')}else{if(!pay2('wire'))return;b.wi.push([sel,d.id]);toast('🔌 وُصل السلك')}
    sel=null;snd('ok');changed();paint()}
  // power: devices joined by wires share one network; generators supply, lamps use
  function solve(){if(!dirty)return;dirty=false;net={};const b=B(),par={};const f=x=>par[x]===x?x:(par[x]=f(par[x]));b.d.forEach(d=>par[d.id]=d.id);
    b.wi.forEach(([a,c])=>{if(par[a]!=null&&par[c]!=null)par[f(a)]=f(c)});const sum={};
    b.d.forEach(d=>{const r=f(d.id),s=sum[r]=sum[r]||{sup:0,use:0};if(d.t==='gen')s.sup+=BAL.build.gen.power;if(d.t==='lamp')s.use+=BAL.build.lamp.use});
    b.d.forEach(d=>{const s=sum[f(d.id)];net[d.id]={sup:s.sup,use:s.use,ok:s.sup>0&&s.sup>=s.use}})}
  // walls are solid: push a circle (x,y) of radius r out of every wall segment near it
  function push(q,r){const b=col.base;if(!b||!b.w)return;const gx=Math.floor(q.x/C),gy=Math.floor(q.y/C),R=r+4;
    for(let i=gx-1;i<=gx+2;i++)for(let j=gy-1;j<=gy+2;j++)for(const o of ['h','v']){if(!b.w[i+','+j+','+o])continue;
      const x0=i*C,y0=j*C,x1=o==='h'?x0+C:x0,y1=o==='h'?y0:y0+C,cx=clampN(q.x,Math.min(x0,x1),Math.max(x0,x1)),cy=clampN(q.y,Math.min(y0,y1),Math.max(y0,y1)),dx=q.x-cx,dy=q.y-cy,d=Math.hypot(dx,dy);
      if(d<R){if(d<0.01){if(o==='h')q.y+=q.y<y0?-R:R;else q.x+=q.x<x0?-R:R}else{q.x=cx+dx/d*R;q.y=cy+dy/d*R}}}}
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
  /* ---------- 2D drawing ---------- */
  function floor2d(ctx,cam,W,H){const b=col.base;solve();
    if(b&&b.f){for(const k in b.f){const [gx,gy]=k.split(',').map(Number),x=gx*C,y=gy*C;if(x>cam.x+W||x+C<cam.x||y>cam.y+H||y+C<cam.y)continue;
        ctx.fillStyle='#c9d1dc';ctx.fillRect(x,y,C,C);ctx.fillStyle='#e8edf3';ctx.fillRect(x+2,y+2,C-4,C-4);ctx.strokeStyle='#f5c45188';ctx.lineWidth=1;ctx.strokeRect(x+3.5,y+3.5,C-7,C-7);
        ctx.fillStyle='#00e5ff99';ctx.fillRect(x+C/2-1.5,y+C/2-1.5,3,3)}
      // wires on the ground, with a running light when the network has power
      for(const [a,c] of b.wi||[]){const A=dev(a),Z=dev(c);if(!A||!Z)continue;const p1=ctr(A.gx,A.gy),p2=ctr(Z.gx,Z.gy),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2+14,ok=net[a]&&net[a].ok&&net[a].sup>0;
        ctx.strokeStyle='#1a2033';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p1.x,p1.y+4);ctx.quadraticCurveTo(mx,my,p2.x,p2.y+4);ctx.stroke();ctx.strokeStyle=ok?'#f5c451':'#5a6070';ctx.lineWidth=1.4;ctx.stroke();
        if(ok){const u=(pulse%1),q=1-u;ctx.fillStyle='#00e5ff';ctx.beginPath();ctx.arc(q*q*p1.x+2*q*u*mx+u*u*p2.x,q*q*(p1.y+4)+2*q*u*my+u*u*(p2.y+4),2.6,0,6.283);ctx.fill()}}}
    if(on&&api){const T=target(),k=tool,bad=!!why(k,T),col2=bad?'#ff4d5e':'#00e5ff',p=api.player();
      // a faint grid around the astronaut
      ctx.strokeStyle='#9fe8ff22';ctx.lineWidth=1;const g0x=Math.floor(p.x/C)-4,g0y=Math.floor(p.y/C)-4;ctx.beginPath();for(let i=0;i<=9;i++){ctx.moveTo((g0x+i)*C,g0y*C);ctx.lineTo((g0x+i)*C,(g0y+9)*C);ctx.moveTo(g0x*C,(g0y+i)*C);ctx.lineTo((g0x+9)*C,(g0y+i)*C)}ctx.stroke();
      ctx.strokeStyle=col2;ctx.fillStyle=col2+'33';ctx.lineWidth=2;
      if(k==='wall'){const [i,j,o]=T.edge,x0=i*C,y0=j*C;ctx.lineWidth=7;ctx.globalAlpha=0.55+0.3*Math.sin(pulse*6.283);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(o==='h'?x0+C:x0,o==='h'?y0:y0+C);ctx.stroke();ctx.globalAlpha=1}
      else if(k!=='wire'){ctx.fillRect(T.gx*C,T.gy*C,C,C);ctx.strokeRect(T.gx*C+1,T.gy*C+1,C-2,C-2)}
      if(k==='wire'){const d=near();if(d){const c=ctr(d.gx,d.gy);ctx.strokeStyle='#f5c451';ctx.beginPath();ctx.arc(c.x,c.y-10,26,0,6.283);ctx.stroke()}
        if(sel&&dev(sel)){const a=dev(sel),c=ctr(a.gx,a.gy);ctx.setLineDash([6,5]);ctx.strokeStyle='#00e5ff';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([])}}}}
  function items2d(L,vis,ctx,t){const b=col.base;if(!b)return;
    for(const k in b.w||{}){const [gx,gy,o]=k.split(','),i=+gx,j=+gy,x0=i*C,y0=j*C;if(!vis(x0+C/2,y0+C/2))continue;
      if(o==='h')L.push([y0,()=>{ctx.fillStyle='#00000033';ctx.fillRect(x0,y0,C,5);ctx.fillStyle='#eef2f6';ctx.fillRect(x0,y0-30,C,30);ctx.fillStyle='#d7dde6';ctx.fillRect(x0,y0-8,C,8);ctx.fillStyle='#f5c451';ctx.fillRect(x0,y0-34,C,5);ctx.fillStyle='#00e5ffaa';ctx.fillRect(x0+4,y0-19,C-8,2)}]);
      else L.push([y0+C,()=>{ctx.fillStyle='#d7dde6';ctx.fillRect(x0-4,y0-30,8,C+30);ctx.fillStyle='#f5c451';ctx.fillRect(x0-4,y0-34,8,C);ctx.fillStyle='#00e5ffaa';ctx.fillRect(x0-1,y0-14,2,C)}])}
    for(const d of b.d||[]){const c=ctr(d.gx,d.gy);if(!vis(c.x,c.y))continue;const n=net[d.id]||{};
      if(d.t==='gen')L.push([c.y+6,()=>{const spin=n.sup>0?t*(n.use?7:4):0;ctx.fillStyle='#00000040';ctx.beginPath();ctx.ellipse(c.x,c.y+8,18,6,0,0,6.283);ctx.fill();
        ctx.fillStyle='#dfe5ec';ctx.fillRect(c.x-16,c.y-14,32,22);ctx.fillStyle='#f5c451';ctx.fillRect(c.x-16,c.y-17,32,4);ctx.fillStyle='#2a3448';ctx.fillRect(c.x-3,c.y-38,6,24);
        ctx.save();ctx.translate(c.x,c.y-38);ctx.rotate(spin);ctx.fillStyle='#f3f6fa';for(let k=0;k<3;k++){ctx.rotate(2.094);ctx.beginPath();ctx.ellipse(0,-9,3.2,9,0,0,6.283);ctx.fill()}ctx.restore();
        ctx.fillStyle='#00e5ff';ctx.shadowColor='#00e5ff';ctx.shadowBlur=n.sup>0?10:0;ctx.beginPath();ctx.arc(c.x,c.y-38,3.4,0,6.283);ctx.fill();ctx.shadowBlur=0;
        ctx.fillStyle=n.ok?'#7dff9a':'#ff4d5e';ctx.fillRect(c.x-10,c.y-6,20*Math.min(1,n.use/(n.sup||1)),3)}]);
      if(d.t==='lamp')L.push([c.y+4,()=>{const lit=n.ok&&n.sup>0;if(lit){const g=ctx.createRadialGradient(c.x,c.y-30,2,c.x,c.y-20,70);g.addColorStop(0,'#bff8ffaa');g.addColorStop(1,'#00e5ff00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y-20,70,0,6.283);ctx.fill()}
        ctx.fillStyle='#00000040';ctx.beginPath();ctx.ellipse(c.x,c.y+4,9,3.5,0,0,6.283);ctx.fill();ctx.fillStyle='#c9d1dc';ctx.fillRect(c.x-2,c.y-28,4,30);ctx.fillStyle='#f5c451';ctx.fillRect(c.x-6,c.y-2,12,4);
        ctx.fillStyle=lit?'#e8fdff':'#6a7486';ctx.shadowColor='#00e5ff';ctx.shadowBlur=lit?16:0;ctx.beginPath();ctx.arc(c.x,c.y-32,6,0,6.283);ctx.fill();ctx.shadowBlur=0}])}}
  /* ---------- 3D ---------- */
  let scene3=null;
  function make3d(scene){scene3=scene;build3d()}
  function build3d(){if(!scene3||typeof THREE==='undefined')return;if(G3){scene3.remove(G3);G3.traverse(o=>{if(o.geometry)o.geometry.dispose()})}G3=new THREE.Group();blades=[];lamps3=[];const b=B();
    const white=new THREE.MeshLambertMaterial({color:0xeef2f6}),gold=new THREE.MeshLambertMaterial({color:0xf5c451}),dark=new THREE.MeshLambertMaterial({color:0x2a3448}),cyan=new THREE.MeshBasicMaterial({color:0x00e5ff});
    const fk=Object.keys(b.f);if(fk.length){const I=new THREE.InstancedMesh(new THREE.BoxGeometry(C-2,2,C-2),new THREE.MeshLambertMaterial({color:0xdfe5ec}),fk.length),o=new THREE.Object3D();fk.forEach((k,n)=>{const [gx,gy]=k.split(',').map(Number);o.position.set(gx*C+C/2,1,gy*C+C/2);o.updateMatrix();I.setMatrixAt(n,o.matrix)});G3.add(I)}
    for(const k in b.w){const [gx,gy,o]=k.split(','),x=+gx*C,y=+gy*C,h=o==='h',m=new THREE.Mesh(new THREE.BoxGeometry(h?C:6,32,h?6:C),white);m.position.set(h?x+C/2:x,17,h?y:y+C/2);G3.add(m);
      const cap=new THREE.Mesh(new THREE.BoxGeometry(h?C:7,3,h?7:C),gold);cap.position.set(m.position.x,34,m.position.z);G3.add(cap)}
    for(const d of b.d){const c=ctr(d.gx,d.gy);if(d.t==='gen'){const base=new THREE.Mesh(new THREE.BoxGeometry(30,18,24),white);base.position.set(c.x,10,c.y);G3.add(base);
        const mast=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,26,8),dark);mast.position.set(c.x,32,c.y);G3.add(mast);
        const rot=new THREE.Group();rot.position.set(c.x,46,c.y);for(let k=0;k<3;k++){const bl=new THREE.Mesh(new THREE.BoxGeometry(3,1.5,18),white);bl.position.z=9;const arm=new THREE.Group();arm.rotation.y=k*2.094;arm.add(bl);rot.add(arm)}
        const hub=new THREE.Mesh(new THREE.SphereGeometry(3.5,10,8),cyan);rot.add(hub);G3.add(rot);blades.push([rot,d.id])}
      if(d.t==='lamp'){const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2,30,8),white);pole.position.set(c.x,15,c.y);G3.add(pole);
        const bulb=new THREE.Mesh(new THREE.SphereGeometry(5,12,10),new THREE.MeshLambertMaterial({color:0x6a7486,emissive:0x00e5ff,emissiveIntensity:0}));bulb.position.set(c.x,33,c.y);G3.add(bulb);lamps3.push([bulb,d.id])}}
    for(const [a,z] of b.wi){const A=dev(a),Z=dev(z);if(!A||!Z)continue;const p1=ctr(A.gx,A.gy),p2=ctr(Z.gx,Z.gy),cv=new THREE.QuadraticBezierCurve3(new THREE.Vector3(p1.x,3,p1.y),new THREE.Vector3((p1.x+p2.x)/2,0.6,(p1.y+p2.y)/2),new THREE.Vector3(p2.x,3,p2.y));
      G3.add(new THREE.Mesh(new THREE.TubeGeometry(cv,12,1.2,5,false),gold))}
    scene3.add(G3)}
  function draw3d(t){solve();for(const [r,id] of blades){const n=net[id]||{};r.rotation.y=n.sup>0?t*(n.use?7:4):0}for(const [m,id] of lamps3){const n=net[id]||{};m.material.emissiveIntensity=n.ok&&n.sup>0?1.2:0}}
  /* ---------- HUD: 🔨 button and the build bar ---------- */
  function paint(){if(!bar)return;bar.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t===tool));
    const T=TOOLS.find(x=>x[0]===tool),hint=tool==='wire'?(sel?'اقترب من الجهاز الثاني واضغط ✔ (اضغط على وصلة موجودة لقطعها)':'اقترب من مولد أو جهاز واضغط ✔'):tool==='del'?'وجّه الرائد نحو القطعة واضغط ✔':tool==='wall'?'يلتصق الجدار بحافة الخانة أمامك · ↻ لتغيير الحافة':'تلتصق القطعة بالخانة أمام الرائد';
    bar.querySelector('.bhint').textContent=T[2]+(cost(tool).m?' · '+costTxt(tool):'')+' — '+hint;if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(bar)}
  function open2(v){on=v;sel=null;if(bar)bar.hidden=!on;const b=api&&api.hud.querySelector('.wbuildb');if(b)b.classList.toggle('on',on);if(on)paint();snd('tap')}
  function start(a){api=a;on=false;sel=null;dirty=true;G3=null;scene3=null;const hud=a.hud;
    const btn=document.createElement('button');btn.type='button';btn.className='wbuildb';btn.setAttribute('aria-label','وضع البناء');btn.textContent='🔨';btn.onclick=e=>{e.stopPropagation();open2(!on)};hud.appendChild(btn);
    bar=document.createElement('div');bar.className='wbbar';bar.hidden=true;bar.innerHTML=`<p class="bhint"></p><div class="btools">${TOOLS.map(([k,e,n])=>`<button type="button" data-t="${k}"><b>${e}</b><span>${n}</span>${cost(k).m?`<small>${costTxt(k)}</small>`:''}</button>`).join('')}</div><div class="bacts"><button type="button" data-a="rot">↻ <span>تدوير</span></button><button type="button" data-a="ok" class="main">✔ <span>ضع</span></button><button type="button" data-a="x">✖ <span>إغلاق</span></button></div>`;
    hud.appendChild(bar);bar.addEventListener('pointerdown',e=>e.stopPropagation());
    bar.onclick=e=>{e.stopPropagation();const t2=e.target.closest('[data-t]'),ac=e.target.closest('[data-a]');if(t2){tool=t2.dataset.t;sel=null;snd('tap');paint()}
      if(ac){const k=ac.dataset.a;if(k==='x')open2(false);if(k==='rot'){rot=(rot+1)%4;snd('tap')}if(k==='ok')place()}};
    chip=document.createElement('div');chip.className='wbchip';chip.hidden=true;hud.appendChild(chip)}
  let chipT=0;
  function update(dt,t){pulse=(pulse+dt*0.7)%1;chipT-=dt;if(chipT>0||!chip||!api)return;chipT=0.3;solve();const d=near();
    if(!d){chip.hidden=true;return}const n=net[d.id]||{sup:0,use:0};chip.hidden=false;
    chip.textContent=(d.t==='gen'?'⚙️ مولد طاقة':'💡 مصباح')+' · ⚡ '+n.use+'/'+n.sup+(n.sup&&!n.ok?' · الطاقة لا تكفي':n.sup?'':' · غير موصول بمولد')}
  function stop(){on=false;bar=null;chip=null;G3=null;scene3=null;api=null}
  return {start,stop,update,push,floor2d,items2d,make3d,draw3d}})();
