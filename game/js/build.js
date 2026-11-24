/* ================= مستعمرة المدار — free modular building in «عالم المدار» =================
   Fortnite/ARK style: the piece goes on the grid cell in front of the astronaut and snaps by itself.
   Phase 1: floor, wall, power generator, lamp, wires (power network).
   Phase 2: door, window (cell edges) · roof, glass dome (over a floor) · glass corridor tile · rooms whose roof hides while you are inside ·
            health for every structural piece (monsters and meteors damage it, 🔧 repairs it).
   Saved in the colony save (arcade-colony) as col.base:
     f:{"gx,gy":1|'cor'}  w:{"gx,gy,h|v":1|'door'|'window'} (1 = wall, the phase-1 value)  r:{"gx,gy":'roof'|'dome'}
     d:[{id,t,gx,gy}]  wi:[[idA,idB]]  n:nextId  hp:{key:health} (only damaged pieces; keys: e<edge> r<cell> c<cell>)
   Building zone: المدار-1, outside the dome and away from the moon diorama. Numbers: BAL.build. */
const WB=(()=>{
  const C=BAL.build.cell;let api=null,on=false,tool='floor',rot=0,sel=null,dirty=true,net={},bar=null,chip=null,G3=null,scene3=null,blades=[],lamps3=[],doors3=[],covers3=[],pulse=0;
  let inside=new Set(),inCell='',hpSaveT=0,hpDirty=false;const doorOpen={};
  const B=()=>{if(!col.base||typeof col.base!=='object')col.base={};const b=col.base;for(const k of ['f','w','r','hp'])if(!b[k]||typeof b[k]!=='object')b[k]={};b.d=Array.isArray(b.d)?b.d:[];b.wi=Array.isArray(b.wi)?b.wi:[];b.pi=Array.isArray(b.pi)?b.pi:[];b.n=b.n||1;b.sc=b.sc||0;return b};
  // phase 3: devices come from WBD (devices.js); pipes join devices to tanks like wires join them to generators
  const TOOLS=[['floor','⬜','أرضية'],['cor','🛤️','ممر'],['wall','🧱','جدار'],['door','🚪','باب'],['window','🪟','نافذة'],['roof','🏠','سقف'],['dome','🫧','قبة زجاجية']]
    .concat(WBD.list.map(k=>[k,WBD.T[k].em,WBD.T[k].n]),[['wire','🔌','سلك'],['pipe','🧪','أنبوب'],['fix','🔧','إصلاح'],['del','🗑️','إزالة']]);
  const ISDEV=k=>!!WBD.T[k];let pipes={},anim3=[],panel=null,panelId=null;
  const NAME={wall:'🧱 جدار',door:'🚪 باب',window:'🪟 نافذة',roof:'🏠 سقف',dome:'🫧 قبة زجاجية',cor:'🛤️ ممر'};
  const EDGE={wall:1,door:1,window:1},COVER={roof:1,dome:1};
  const cost=k=>BAL.build[k]?{m:BAL.build[k].m||0,e:BAL.build[k].e||0}:{m:0,e:0};
  const costTxt=k=>{const c=cost(k);return (c.m?'⛏️'+c.m:'')+(c.e?' ⚡'+c.e:'')};
  const ctr=(gx,gy)=>({x:gx*C+C/2,y:gy*C+C/2});
  const dev=id=>B().d.find(d=>d.id===id);
  const devAt=(gx,gy)=>B().d.find(d=>d.gx===gx&&d.gy===gy);
  const eType=v=>v===1||v==='wall'||v===true?'wall':v;           // phase-1 walls were saved as 1
  const maxHp=t=>(BAL.build[t]&&BAL.build[t].hp)||100;
  const hpOf=(key,t)=>{const h=B().hp[key];return typeof h==='number'&&isFinite(h)?Math.min(h,maxHp(t)):maxHp(t)};
  const covered=k=>{const b=col.base;return !!(b&&((b.r&&b.r[k])||(b.f&&b.f[k]==='cor')))};
  function zoneOk(gx,gy){if(!api)return false;const {x,y}=ctr(gx,gy),b=api.base,m=api.moon;return api.regAt(x,y)===0&&api.regAt(x-C/2,y-C/2)===0&&api.regAt(x+C/2,y+C/2)===0&&Math.hypot(x-b.x,y-b.y)>b.r+C*0.75&&Math.hypot(x-m.x,y-m.y)>130}
  // target: the cell in front of the astronaut; an edge piece takes the edge of that cell that faces him, turned by «↻»
  function target(){const p=api.player(),a=p.face==null?-Math.PI/2:p.face,R=BAL.build.reach,tx=p.x+Math.cos(a)*R,ty=p.y+Math.sin(a)*R,gx=Math.floor(tx/C),gy=Math.floor(ty/C),c=ctr(gx,gy);
    const dx=p.x-c.x,dy=p.y-c.y,auto=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0),r=(auto+rot)%4;
    const edge=r===0?[gx,gy,'h']:r===1?[gx+1,gy,'v']:r===2?[gx,gy+1,'h']:[gx,gy,'v'];return {gx,gy,fk:gx+','+gy,edge,ek:edge.join(',')}}
  // the structural piece a ✔ of «🔧» or «🗑️» acts on: device, then cover, then edge, then floor
  function pieceAt(T){const b=B();const d=devAt(T.gx,T.gy);if(d)return {k:'d',d};if(b.r[T.fk])return {k:'r',key:'r'+T.fk,t:b.r[T.fk]};
    if(b.w[T.ek])return {k:'e',key:'e'+T.ek,t:eType(b.w[T.ek])};if(b.f[T.fk])return b.f[T.fk]==='cor'?{k:'f',key:'c'+T.fk,t:'cor'}:{k:'f',t:'floor'};return null}
  function why(k,T){const b=B(),fv=b.f[T.fk];
    if(k==='del')return pieceAt(T)?'':'لا شيء هنا لإزالته';
    if(k==='fix'){const P=pieceAt(T);return P&&P.key&&hpOf(P.key,P.t)<maxHp(P.t)?'':'لا شيء متضرر أمامك'}
    if(k==='wire'||k==='pipe')return '';
    if(!zoneOk(T.gx,T.gy))return 'ابنِ في المدار-1 خارج القبة';
    if(k==='floor'||k==='cor')return fv?'المكان مشغول':'';
    if(EDGE[k])return b.w[T.ek]?'هنا قطعة على هذه الحافة':'';
    if(COVER[k])return fv!==1?'ضع أرضية أولاً':b.r[T.fk]?'هنا سقف':'';
    if(!fv)return 'ضع أرضية أولاً';if(devAt(T.gx,T.gy))return 'المكان مشغول';return ''}
  function pay2(c,txt){if(!canPay(c)){snd('err');toast('الموارد لا تكفي: '+txt);return false}pay(c);return true}
  function refund(k){const c=cost(k),f=BAL.build.refund;if(c.m)gain('m',Math.round(c.m*f));if(c.e)gain('e',Math.round(c.e*f))}
  let cache=null;   // drawing lists, rebuilt only when the base changes (no string splitting every frame)
  function cacheB(){if(cache)return cache;const b=B(),F=[],E=[],V=[];for(const k in b.f){const [gx,gy]=k.split(',').map(Number);F.push({k,x:gx*C,y:gy*C,cor:b.f[k]==='cor'})}
    for(const k in b.w){const [gx,gy,o]=k.split(',');E.push({k,x:+gx*C,y:+gy*C,o,t:eType(b.w[k])})}
    for(const k in b.r){const [gx,gy]=k.split(',').map(Number);V.push({k,gx,gy,t:b.r[k]})}for(const f of F)if(f.cor)V.push({k:f.k,gx:f.x/C,gy:f.y/C,t:'cor'});V.sort((a,c)=>a.gy-c.gy);return cache={F,E,V}}
  function changed(){dirty=true;inCell='';cache=null;colSave();if(typeof updRes==='function')try{updRes()}catch(e){}if(G3)build3d()}
  function place(){const T=target(),b=B(),k=tool,w=why(k,T);
    if(k==='wire'||k==='pipe')return link(k);
    if(w){snd('err');api.say('🚫 '+w);return}
    if(k==='del'){const P=pieceAt(T);
      if(P.k==='d'){b.d=b.d.filter(x=>x!==P.d);for(const [L,kk] of [['wi','wire'],['pi','pipe']])b[L]=b[L].filter(([a,c])=>{const hit=a===P.d.id||c===P.d.id;if(hit)refund(kk);return !hit});refund(P.d.t)}
      else if(P.k==='r'){delete b.r[T.fk];refund(P.t)}else if(P.k==='e'){delete b.w[T.ek];refund(P.t)}
      else{if(devAt(T.gx,T.gy)){api.say('🚫 أزل الجهاز أولاً');return}delete b.f[T.fk];refund(P.t)}
      if(P.key)delete b.hp[P.key];snd('tap');buzz(10);return changed()}
    if(k==='fix'){const P=pieceAt(T),miss=maxHp(P.t)-hpOf(P.key,P.t),c={m:Math.max(1,Math.ceil(miss*BAL.build.repairPerHp)),e:0};if(!pay2(c,'⛏️'+c.m))return;
      delete b.hp[P.key];snd('build');toast('🔧 أُصلح '+NAME[P.t]);return changed()}
    if(!pay2(cost(k),costTxt(k)))return;
    if(k==='floor')b.f[T.fk]=1;else if(k==='cor')b.f[T.fk]='cor';else if(k==='wall')b.w[T.ek]=1;else if(EDGE[k])b.w[T.ek]=k;else if(COVER[k])b.r[T.fk]=k;else b.d.push({id:b.n++,t:k,gx:T.gx,gy:T.gy,r:rot});
    snd('build');buzz(12);changed()}
  // wires: stand by a device and tap ✔, then by a second device and tap ✔ again
  function near(){const p=api.player();let best=null,bd=80;for(const d of B().d){const c=ctr(d.gx,d.gy),e=Math.hypot(c.x-p.x,c.y-p.y);if(e<bd){bd=e;best=d}}return best}
  // links: wires carry power, pipes carry goods (a planter's food into a tank); same two taps for both
  function link(k){const d=near(),b=B(),L=k==='wire'?'wi':'pi',em=k==='wire'?'🔌':'🧪',mx=k==='wire'?BAL.build.wireMaxCells:BAL.build.pipeMaxCells;if(!d){snd('err');api.say(em+' اقترب من مولد أو جهاز');return}
    if(!sel||!dev(sel)){sel=d.id;snd('tap');api.say(em+' اختر الجهاز الثاني');return paint()}
    if(sel===d.id){sel=null;return paint()}
    const a=dev(sel),ca=ctr(a.gx,a.gy),cb=ctr(d.gx,d.gy);if(Math.hypot(ca.x-cb.x,ca.y-cb.y)>mx*C){snd('err');api.say(em+' لا يصل: الحد '+mx+' خانات');return}
    const i=b[L].findIndex(([x,y])=>(x===sel&&y===d.id)||(x===d.id&&y===sel));
    if(i>=0){b[L].splice(i,1);refund(k);toast(k==='wire'?'✂️ قُطع السلك':'✂️ فُك الأنبوب')}else{if(!pay2(cost(k),costTxt(k)))return;b[L].push([sel,d.id]);toast(k==='wire'?'🔌 وُصل السلك':'🧪 وُصل الأنبوب')}
    sel=null;snd('ok');changed();paint()}
  // power: devices joined by wires share one network; generators supply, lamps use
  function solve(){if(!dirty)return;dirty=false;net={};const b=B(),par={};const f=x=>par[x]===x?x:(par[x]=f(par[x]));b.d.forEach(d=>par[d.id]=d.id);
    b.wi.forEach(([a,c])=>{if(par[a]!=null&&par[c]!=null)par[f(a)]=f(c)});const sum={};
    b.d.forEach(d=>{const r=f(d.id),s=sum[r]=sum[r]||{sup:0,use:0};if(d.t==='gen')s.sup+=BAL.build.gen.power;s.use+=(BAL.build[d.t]&&BAL.build[d.t].use)||0});
    b.d.forEach(d=>{const s=sum[f(d.id)];net[d.id]={sup:s.sup,use:s.use,ok:s.sup>0&&s.sup>=s.use}});
    // pipe groups: for each device, the other devices on its pipes
    const pp={};const g=x=>pp[x]===x?x:(pp[x]=g(pp[x]));b.d.forEach(d=>pp[d.id]=d.id);b.pi.forEach(([a,c])=>{if(pp[a]!=null&&pp[c]!=null)pp[g(a)]=g(c)});
    const grp={};b.d.forEach(d=>{(grp[g(d.id)]=grp[g(d.id)]||[]).push(d)});pipes={};b.d.forEach(d=>{pipes[d.id]=grp[g(d.id)].filter(x=>x!==d)})}
  /* ---------- rooms: the covered cells joined to the one under the astronaut (walls and windows close a room, doors do not) ---------- */
  function rooms(){const p=api&&api.player();if(!p)return;const gx=Math.floor(p.x/C),gy=Math.floor(p.y/C),k=gx+','+gy;if(k===inCell&&!dirty)return;inCell=k;inside=new Set();
    const b=col.base;if(!b||!covered(k))return;const solid=ek=>{const v=b.w&&b.w[ek];return v&&eType(v)!=='door'};const Q=[[gx,gy]];inside.add(k);
    while(Q.length&&inside.size<400){const [x,y]=Q.pop();for(const [dx,dy,ek] of [[1,0,(x+1)+','+y+',v'],[-1,0,x+','+y+',v'],[0,1,x+','+(y+1)+',h'],[0,-1,x+','+y+',h']]){const n=(x+dx)+','+(y+dy);if(inside.has(n)||!covered(n)||solid(ek))continue;inside.add(n);Q.push([x+dx,y+dy])}}}
  /* ---------- health: monsters stopped by a piece claw at it, meteors crush what they hit ---------- */
  function damage(key,t,n){const b=B(),h=hpOf(key,t)-n;
    if(h>0){const was=hpOf(key,t);b.hp[key]=h;hpDirty=true;if(G3&&was>=maxHp(t)/2&&h<maxHp(t)/2)build3d();return}
    delete b.hp[key];const id=key.slice(1);if(key[0]==='e')delete b.w[id];else if(key[0]==='r')delete b.r[id];else if(key[0]==='c')delete b.f[id];
    cache=null;snd('hit');buzz(40);toast('💥 تحطّم '+NAME[t]+'!');changed()}
  function blast(x,y,r,n){const b=col.base;if(!b)return;for(const k of Object.keys(b.w||{})){const [i,j,o]=k.split(','),mx=+i*C+(o==='h'?C/2:0),my=+j*C+(o==='v'?C/2:0);if(Math.hypot(mx-x,my-y)<r)damage('e'+k,eType(b.w[k]),n)}
    for(const k of Object.keys(b.r||{})){const c=ctr(...k.split(',').map(Number));if(Math.hypot(c.x-x,c.y-y)<r)damage('r'+k,b.r[k],n)}
    for(const k of Object.keys(b.f||{})){if(b.f[k]!=='cor')continue;const c=ctr(...k.split(',').map(Number));if(Math.hypot(c.x-x,c.y-y)<r)damage('c'+k,'cor',n)}}
  // edge pieces are solid: push a circle out of every one near it (doors let the astronaut through); n = damage dealt if it gets stopped
  function push(q,r,n,isP){const b=col.base;if(!b||!b.w)return;const gx=Math.floor(q.x/C),gy=Math.floor(q.y/C),R=r+4;let hit=null;
    for(let i=gx-1;i<=gx+2;i++)for(let j=gy-1;j<=gy+2;j++)for(const o of ['h','v']){const ek=i+','+j+','+o,v=b.w[ek];if(!v)continue;const t=eType(v);if(isP&&t==='door')continue;
      const x0=i*C,y0=j*C,x1=o==='h'?x0+C:x0,y1=o==='h'?y0:y0+C,cx=clampN(q.x,Math.min(x0,x1),Math.max(x0,x1)),cy=clampN(q.y,Math.min(y0,y1),Math.max(y0,y1)),dx=q.x-cx,dy=q.y-cy,d=Math.hypot(dx,dy);
      if(d<R){if(d<0.01){if(o==='h')q.y+=q.y<y0?-R:R;else q.x+=q.x<x0?-R:R}else{q.x=cx+dx/d*R;q.y=cy+dy/d*R}if(!hit)hit=[ek,t]}}
    if(hit&&n>0)damage('e'+hit[0],hit[1],n)}
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
  /* ---------- 2D drawing ---------- */
  function hpBar(ctx,x,y,f){ctx.fillStyle='#070b16cc';ctx.fillRect(x-17,y-3,34,6);ctx.fillStyle=f>0.5?'#7dff9a':f>0.25?'#ffd34d':'#ff4d5e';ctx.fillRect(x-16,y-2,32*f,4)}
  function showHp(x,y){return on||(api&&Math.hypot(api.player().x-x,api.player().y-y)<200)}
  function floor2d(ctx,cam,W,H){const b=col.base;solve();rooms();
    if(b&&b.f){for(const F of cacheB().F){const x=F.x,y=F.y;if(x>cam.x+W||x+C<cam.x||y>cam.y+H||y+C<cam.y)continue;
        if(F.cor){ctx.fillStyle='#8f99a8';ctx.fillRect(x,y,C,C);ctx.fillStyle='#b9c2ce';ctx.fillRect(x+3,y+3,C-6,C-6);ctx.fillStyle='#00e5ff88';ctx.fillRect(x+C/2-2,y+4,4,C-8);ctx.fillRect(x+4,y+C/2-2,C-8,4);continue}
        ctx.fillStyle='#c9d1dc';ctx.fillRect(x,y,C,C);ctx.fillStyle='#e8edf3';ctx.fillRect(x+2,y+2,C-4,C-4);ctx.strokeStyle='#f5c45188';ctx.lineWidth=1;ctx.strokeRect(x+3.5,y+3.5,C-7,C-7);
        ctx.fillStyle='#00e5ff99';ctx.fillRect(x+C/2-1.5,y+C/2-1.5,3,3)}
      for(const [a,c] of b.pi||[]){const A=dev(a),Z=dev(c);if(!A||!Z)continue;const p1=ctr(A.gx,A.gy),p2=ctr(Z.gx,Z.gy),flow=[A,Z].some(x=>x.t==='planter'&&net[x.id]&&net[x.id].ok&&net[x.id].sup>0);
        ctx.strokeStyle='#8f99a8';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.strokeStyle='#eef2f6';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=flow?'#7dff9a':'#9ff0ff66';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.lineDashOffset=flow?-pulse*48:0;ctx.stroke();ctx.setLineDash([]);ctx.lineCap='butt'}
      for(const [a,c] of b.wi||[]){const A=dev(a),Z=dev(c);if(!A||!Z)continue;const p1=ctr(A.gx,A.gy),p2=ctr(Z.gx,Z.gy),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2+14,ok=net[a]&&net[a].ok&&net[a].sup>0;
        ctx.strokeStyle='#1a2033';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p1.x,p1.y+4);ctx.quadraticCurveTo(mx,my,p2.x,p2.y+4);ctx.stroke();ctx.strokeStyle=ok?'#f5c451':'#5a6070';ctx.lineWidth=1.4;ctx.stroke();
        if(ok){const u=(pulse%1),q=1-u;ctx.fillStyle='#00e5ff';ctx.beginPath();ctx.arc(q*q*p1.x+2*q*u*mx+u*u*p2.x,q*q*(p1.y+4)+2*q*u*my+u*u*(p2.y+4),2.6,0,6.283);ctx.fill()}}}
    if(on&&api){const T=target(),k=tool,bad=!!why(k,T),col2=bad?'#ff4d5e':'#00e5ff',p=api.player();
      ctx.strokeStyle='#9fe8ff22';ctx.lineWidth=1;const g0x=Math.floor(p.x/C)-4,g0y=Math.floor(p.y/C)-4;ctx.beginPath();for(let i=0;i<=9;i++){ctx.moveTo((g0x+i)*C,g0y*C);ctx.lineTo((g0x+i)*C,(g0y+9)*C);ctx.moveTo(g0x*C,(g0y+i)*C);ctx.lineTo((g0x+9)*C,(g0y+i)*C)}ctx.stroke();
      ctx.strokeStyle=col2;ctx.fillStyle=col2+'33';ctx.lineWidth=2;
      if(EDGE[k]){const [i,j,o]=T.edge,x0=i*C,y0=j*C;ctx.lineWidth=7;ctx.globalAlpha=0.55+0.3*Math.sin(pulse*6.283);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(o==='h'?x0+C:x0,o==='h'?y0:y0+C);ctx.stroke();ctx.globalAlpha=1}
      else if(k==='fix'||k==='del'){const P=pieceAt(T);if(P&&P.k==='e'){const [i,j,o]=T.edge;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(i*C,j*C);ctx.lineTo(o==='h'?i*C+C:i*C,o==='h'?j*C:j*C+C);ctx.stroke()}else{ctx.fillRect(T.gx*C,T.gy*C,C,C);ctx.strokeRect(T.gx*C+1,T.gy*C+1,C-2,C-2)}}
      else if(k!=='wire'&&k!=='pipe'){ctx.fillRect(T.gx*C,T.gy*C,C,C);ctx.strokeRect(T.gx*C+1,T.gy*C+1,C-2,C-2);if(ISDEV(k)){ctx.globalAlpha=0.5;WBD.T[k].d2(ctx,ctr(T.gx,T.gy),{sup:0,use:0},pulse*20,{r:rot,gr:0.6,st:0});ctx.globalAlpha=1}}
      if(k==='wire'||k==='pipe'){const d=near();if(d){const c=ctr(d.gx,d.gy);ctx.strokeStyle='#f5c451';ctx.beginPath();ctx.arc(c.x,c.y-10,26,0,6.283);ctx.stroke()}
        if(sel&&dev(sel)){const a=dev(sel),c=ctr(a.gx,a.gy);ctx.setLineDash([6,5]);ctx.strokeStyle='#00e5ff';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([])}}}}
  // one edge piece seen in 3/4 view: h runs along x (its face shows), v runs along y (its top shows)
  function edge2d(ctx,ek,t){const [gx,gy,o]=ek.split(','),x0=+gx*C,y0=+gy*C,key='e'+ek,f=hpOf(key,t)/maxHp(t),p=api.player();
    if(t==='door'){const mx=x0+(o==='h'?C/2:0),my=y0+(o==='v'?C/2:0),near2=Math.hypot(p.x-mx,p.y-my)<56;doorOpen[ek]=clampN((doorOpen[ek]||0)+(near2?0.12:-0.08),0,1)}
    const op=doorOpen[ek]||0;
    if(o==='h'){ctx.fillStyle='#00000033';ctx.fillRect(x0,y0,C,5);
      if(t==='wall'){ctx.fillStyle='#eef2f6';ctx.fillRect(x0,y0-30,C,30);ctx.fillStyle='#d7dde6';ctx.fillRect(x0,y0-8,C,8);ctx.fillStyle='#00e5ffaa';ctx.fillRect(x0+4,y0-19,C-8,2)}
      if(t==='window'){ctx.fillStyle='#eef2f6';ctx.fillRect(x0,y0-10,C,10);ctx.fillStyle='#9ff0ff55';ctx.fillRect(x0+2,y0-28,C-4,18);ctx.strokeStyle='#e8fdff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x0+8,y0-12);ctx.lineTo(x0+16,y0-26);ctx.moveTo(x0+C/2,y0-28);ctx.lineTo(x0+C/2,y0-10);ctx.stroke();ctx.fillStyle='#d7dde6';ctx.fillRect(x0,y0-30,4,30);ctx.fillRect(x0+C-4,y0-30,4,30)}
      if(t==='door'){ctx.fillStyle='#d7dde6';ctx.fillRect(x0,y0-30,7,30);ctx.fillRect(x0+C-7,y0-30,7,30);ctx.globalAlpha=1-op*0.85;ctx.fillStyle='#bfe9f6';ctx.fillRect(x0+7,y0-30+op*24,C-14,30-op*24);ctx.fillStyle='#00e5ff';ctx.fillRect(x0+C/2-1,y0-24+op*20,2,10-op*8);ctx.globalAlpha=1}
      ctx.fillStyle='#f5c451';ctx.fillRect(x0,y0-34,C,5);
      if(f<1){ctx.fillStyle=`rgba(255,77,94,${(1-f)*0.45})`;ctx.fillRect(x0,y0-34,C,34);ctx.strokeStyle='#2a1a22';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0+C*0.3,y0-30);ctx.lineTo(x0+C*0.42,y0-18);ctx.lineTo(x0+C*0.34,y0-8);ctx.stroke()}}
    else{ctx.fillStyle=t==='window'?'#9ff0ff66':'#d7dde6';ctx.fillRect(x0-4,y0-30,8,C+30);
      if(t==='door'){ctx.globalAlpha=1-op*0.9;ctx.fillStyle='#bfe9f6';ctx.fillRect(x0-3,y0-26+6,6,C-12);ctx.globalAlpha=1;ctx.fillStyle='#d7dde6';ctx.fillRect(x0-4,y0-30,8,8);ctx.fillRect(x0-4,y0+C-8,8,8)}
      ctx.fillStyle='#f5c451';ctx.fillRect(x0-4,y0-34,8,C);ctx.fillStyle=t==='door'?'#00e5ff':'#00e5ffaa';ctx.fillRect(x0-1,y0-14,2,C);
      if(f<1){ctx.fillStyle=`rgba(255,77,94,${(1-f)*0.45})`;ctx.fillRect(x0-4,y0-34,8,C+34)}}
    if(f<1&&showHp(x0+C/2,y0))hpBar(ctx,o==='h'?x0+C/2:x0,o==='h'?y0-42:y0+C/2-42,f)}
  function items2d(L,vis,ctx,t){const b=col.base;if(!b||!api)return;
    for(const e of cacheB().E){if(!vis(e.x+C/2,e.y+C/2))continue;L.push([e.o==='h'?e.y:e.y+C,()=>edge2d(ctx,e.k,e.t)])}
    for(const d of b.d||[]){const c=ctr(d.gx,d.gy);if(!vis(c.x,c.y)||!WBD.T[d.t])continue;const n=net[d.id]||{sup:0,use:0};d.r=d.r||0;L.push([c.y+6,()=>WBD.T[d.t].d2(ctx,c,n,t,d)])}}
  // roofs, domes and corridor canopies are drawn above everything; the room you stand in fades away
  function roof2d(ctx,vis,t){const b=col.base;if(!b||!api)return;WBD.fx2d(ctx);
    for(const V of cacheB().V){const k=V.k,ty=V.t,gx=V.gx,gy=V.gy,x=gx*C,y=gy*C;if(!vis(x+C/2,y+C/2))continue;const inn=inside.has(k),key=(ty==='cor'?'c':'r')+k,f=hpOf(key,ty)/maxHp(ty);
      if(ty==='roof'){ctx.globalAlpha=inn?0.12:1;ctx.fillStyle='#c3ccd8';ctx.fillRect(x,y+C-36,C,5);ctx.fillStyle='#e3e8ef';ctx.fillRect(x,y-36,C,C);ctx.strokeStyle='#cfd6e0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+C/2,y-36);ctx.lineTo(x+C/2,y+C-36);ctx.moveTo(x,y-36+C/2);ctx.lineTo(x+C,y-36+C/2);ctx.stroke();
        ctx.strokeStyle='#f5c451';ctx.lineWidth=1.5;ctx.strokeRect(x+1,y-35,C-2,C-2);ctx.fillStyle='#00e5ff';ctx.fillRect(x+C/2-2,y-36+C/2-2,4,4)}
      if(ty==='dome'){const cx=x+C/2,by=y+C-2;ctx.globalAlpha=inn?0.08:1;ctx.fillStyle='#9ff0ff33';ctx.beginPath();ctx.ellipse(cx,by,C/2,C*1.05,0,Math.PI,0);ctx.fill();ctx.strokeStyle='#bff8ffcc';ctx.lineWidth=1.4;ctx.stroke();
        ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,by,C/2-7,C*0.95,0,Math.PI*1.15,Math.PI*1.45);ctx.stroke();ctx.fillStyle='#f5c451';ctx.fillRect(x,by-2,C,3)}
      if(ty==='cor'){const hz=!!(b.f[(gx-1)+','+gy]||b.f[(gx+1)+','+gy]),vt=!!(b.f[gx+','+(gy-1)]||b.f[gx+','+(gy+1)]);ctx.globalAlpha=inn?0.1:1;ctx.fillStyle='#bff8ff2e';ctx.fillRect(x,y-26,C,C);ctx.strokeStyle='#e8fdffaa';ctx.lineWidth=1.3;ctx.beginPath();
        if(hz||!vt){for(let i=0;i<=3;i++){const xx=x+i*C/3;ctx.moveTo(xx,y-26);ctx.lineTo(xx,y-26+C)}}else{for(let i=0;i<=3;i++){const yy=y-26+i*C/3;ctx.moveTo(x,yy);ctx.lineTo(x+C,yy)}}ctx.stroke();ctx.fillStyle='#f5c45199';ctx.fillRect(x,y-27,C,2)}
      ctx.globalAlpha=1;if(f<1){if(!inn){ctx.fillStyle=`rgba(255,77,94,${(1-f)*0.35})`;ctx.fillRect(x,y-36,C,C)}if(showHp(x+C/2,y))hpBar(ctx,x+C/2,y-44,f)}}}
  /* ---------- 3D ---------- */
  function make3d(scene){scene3=scene;build3d()}
  function build3d(){if(!scene3||typeof THREE==='undefined')return;if(G3){scene3.remove(G3);G3.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.userData.own)o.material.dispose()})}
    G3=new THREE.Group();blades=[];lamps3=[];doors3=[];covers3=[];anim3=[];const b=B();
    const white=new THREE.MeshLambertMaterial({color:0xeef2f6}),gold=new THREE.MeshLambertMaterial({color:0xf5c451}),dark=new THREE.MeshLambertMaterial({color:0x2a3448}),cyan=new THREE.MeshBasicMaterial({color:0x00e5ff}),
      glass=new THREE.MeshLambertMaterial({color:0x9ff0ff,transparent:true,opacity:0.35,emissive:0x0a4a5a,emissiveIntensity:0.4});
    const hurt=(key,t)=>{const f=hpOf(key,t)/maxHp(t);if(f>=0.5)return white;const m=new THREE.MeshLambertMaterial({color:0xffb0b8});m.userData.own=1;return m};
    const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);G3.add(o);return o};
    const fk=Object.keys(b.f).filter(k=>b.f[k]===1);if(fk.length){const I=new THREE.InstancedMesh(new THREE.BoxGeometry(C-2,2,C-2),new THREE.MeshLambertMaterial({color:0xdfe5ec}),fk.length),o=new THREE.Object3D();fk.forEach((k,n)=>{const [gx,gy]=k.split(',').map(Number);o.position.set(gx*C+C/2,1,gy*C+C/2);o.updateMatrix();I.setMatrixAt(n,o.matrix)});G3.add(I)}
    for(const k in b.w){const [gx,gy,o]=k.split(','),x=+gx*C,y=+gy*C,h=o==='h',t=eType(b.w[k]),cx=h?x+C/2:x,cz=h?y:y+C/2,L=(w,d)=>h?[w,d]:[d,w],m=hurt('e'+k,t);
      if(t==='wall'){const [a,c]=L(C,6);box(a,32,c,m,cx,17,cz)}
      if(t==='window'){const [a,c]=L(C,6);box(a,10,c,m,cx,6,cz);const [g1,g2]=L(C-4,3);box(g1,20,g2,glass,cx,21,cz)}
      if(t==='door'){const [a,c]=L(6,7),off=C/2-3;box(a,32,c,m,h?cx-off:cx,17,h?cz:cz-off);box(a,32,c,m,h?cx+off:cx,17,h?cz:cz+off);const [p1,p2]=L(C-12,3),panel=box(p1,30,p2,glass,cx,16,cz);doors3.push([panel,k])}
      const [a2,c2]=L(C,7);box(a2,3,c2,gold,cx,34,cz)}
    for(const k in b.f){if(b.f[k]!=='cor')continue;const [gx,gy]=k.split(',').map(Number),cx=gx*C+C/2,cz=gy*C+C/2,hz=!!(b.f[(gx-1)+','+gy]||b.f[(gx+1)+','+gy]);box(C-2,2,C-2,dark,cx,1,cz);
      const mat=glass.clone();mat.userData.own=1;const tube=new THREE.Mesh(new THREE.CylinderGeometry(C/2-2,C/2-2,C,12,1,true,0,Math.PI),mat);tube.rotation.z=Math.PI/2;if(!hz)tube.rotation.y=Math.PI/2;tube.position.set(cx,2,cz);G3.add(tube);covers3.push([mat,k,0.35])}
    for(const k in b.r){const [gx,gy]=k.split(',').map(Number),cx=gx*C+C/2,cz=gy*C+C/2,t=b.r[k];
      if(t==='roof'){const mat=new THREE.MeshLambertMaterial({color:hpOf('r'+k,t)/maxHp(t)<0.5?0xffc0c6:0xe3e8ef,transparent:true,opacity:1});mat.userData.own=1;const o=new THREE.Mesh(new THREE.BoxGeometry(C,3,C),mat);o.position.set(cx,36,cz);G3.add(o);covers3.push([mat,k,1])}
      if(t==='dome'){const mat=glass.clone();mat.userData.own=1;mat.opacity=0.3;const o=new THREE.Mesh(new THREE.SphereGeometry(C*0.62,16,10,0,Math.PI*2,0,Math.PI/2),mat);o.scale.y=1.15;o.position.set(cx,1,cz);G3.add(o);covers3.push([mat,k,0.3])}}
    const own=m=>{m.userData.own=1;return m},M={white,gold,dark,cyan,glassT:glass,soil:new THREE.MeshLambertMaterial({color:0x4a3020}),leaf:new THREE.MeshLambertMaterial({color:0x3fae6a}),leafE:own(new THREE.MeshLambertMaterial({color:0x7dff9a,emissive:0x2a7a3a,emissiveIntensity:0.5})),
      box:(w,h,d,m,x,y,z)=>box(w,h,d,m,x,y,z),cyl:(r,h,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),m);o.position.set(x,y,z);G3.add(o);return o},cylM:(r,h,m,x,y,z)=>M.cyl(r,h,m,x,y,z),
      group:(x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);G3.add(g);return g},sub:g=>{const s2=new THREE.Group();g.add(s2);return s2},
      boxIn:(g,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o},ball:(g,r,m)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),m);g.add(o);return o},
      coneIn:(g,r,h,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.ConeGeometry(r,h,6),m);o.position.set(x,y,z);g.add(o);return o},
      dishIn:(g,r,m)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,8,0,Math.PI*2,0,Math.PI/3),m);g.add(o);return o},
      bulb:(x,y,z)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(5,12,10),own(new THREE.MeshLambertMaterial({color:0x6a7486,emissive:0x00e5ff,emissiveIntensity:0})));o.position.set(x,y,z);G3.add(o);return o},
      screenM:()=>own(new THREE.MeshLambertMaterial({color:0x2a3448,emissive:0x00e5ff,emissiveIntensity:0}))};
    for(const d of b.d){if(!WBD.T[d.t])continue;d.r=d.r||0;const fn=WBD.T[d.t].d3(M,ctr(d.gx,d.gy),d);if(fn)anim3.push([fn,d])}
    for(const [a,z] of b.pi){const A=dev(a),Z=dev(z);if(!A||!Z)continue;const p1=ctr(A.gx,A.gy),p2=ctr(Z.gx,Z.gy),cv=new THREE.LineCurve3(new THREE.Vector3(p1.x,4,p1.y),new THREE.Vector3(p2.x,4,p2.y));G3.add(new THREE.Mesh(new THREE.TubeGeometry(cv,2,3,8,false),white))}
    for(const [a,z] of b.wi){const A=dev(a),Z=dev(z);if(!A||!Z)continue;const p1=ctr(A.gx,A.gy),p2=ctr(Z.gx,Z.gy),cv=new THREE.QuadraticBezierCurve3(new THREE.Vector3(p1.x,3,p1.y),new THREE.Vector3((p1.x+p2.x)/2,0.6,(p1.y+p2.y)/2),new THREE.Vector3(p2.x,3,p2.y));
      G3.add(new THREE.Mesh(new THREE.TubeGeometry(cv,12,1.2,5,false),gold))}
    scene3.add(G3)}
  function draw3d(t){solve();rooms();const p=api&&api.player();for(const [fn,d] of anim3)fn(t,net[d.id]||{sup:0,use:0},d);
    for(const [m,ek] of doors3){const [i,j,o]=ek.split(','),mx=+i*C+(o==='h'?C/2:0),my=+j*C+(o==='v'?C/2:0),op=clampN((doorOpen[ek]||0)+(p&&Math.hypot(p.x-mx,p.y-my)<56?0.12:-0.08),0,1);doorOpen[ek]=op;m.position.y=16+op*28;m.scale.y=1-op*0.8}
    for(const [m,k,base] of covers3)m.opacity=inside.has(k)?Math.min(base,0.08):base}
  /* ---------- HUD: 🔨 button and the build bar ---------- */
  function paint(){if(!bar)return;bar.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t===tool));
    const T=TOOLS.find(x=>x[0]===tool),hint=tool==='pipe'?(sel?'اقترب من الجهاز الثاني واضغط ✔':'الأنابيب تنقل إنتاج الأحواض إلى الخزانات · اقترب من جهاز واضغط ✔'):ISDEV(tool)?'معاينة شبحية أمامك · ↻ للتدوير · يُوضع فوق أرضية':tool==='wire'?(sel?'اقترب من الجهاز الثاني واضغط ✔ (اضغط على وصلة موجودة لقطعها)':'اقترب من مولد أو جهاز واضغط ✔'):tool==='del'?'وجّه الرائد نحو القطعة واضغط ✔':tool==='fix'?'وجّه الرائد نحو قطعة متضررة واضغط ✔':EDGE[tool]?'يلتصق بحافة الخانة أمامك · ↻ لتغيير الحافة':COVER[tool]?'يُوضع فوق أرضية · يختفي حين تكون تحته':'تلتصق القطعة بالخانة أمام الرائد';
    bar.querySelector('.bhint').textContent=T[2]+(cost(tool).m?' · '+costTxt(tool):'')+' — '+hint;if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(bar)}
  function open2(v){on=v;sel=null;if(bar)bar.hidden=!on;const b=api&&api.hud.querySelector('.wbuildb');if(b)b.classList.toggle('on',on);if(on)paint();snd('tap')}
  /* ---------- phase 4: a first base for players who have none (old saves too), sized from the colony's buildings ---------- */
  function starter(){const b=B();if(b.mig||Object.keys(b.f).length||b.d.length)return false;b.mig=1;const L=col.b,x0=35,y0=16,W2=5,H2=4,ok=(gx,gy)=>zoneOk(gx,gy);
    for(let i=0;i<W2;i++)for(let j=0;j<H2;j++)if(ok(x0+i,y0+j)){b.f[(x0+i)+','+(y0+j)]=1;b.r[(x0+i)+','+(y0+j)]='roof'}
    const has=(gx,gy)=>!!b.f[gx+','+gy];
    for(let i=0;i<W2;i++){if(has(x0+i,y0))b.w[(x0+i)+','+y0+',h']=1;if(has(x0+i,y0+H2-1))b.w[(x0+i)+','+(y0+H2)+',h']=i===2?'door':1}
    for(let j=0;j<H2;j++){if(has(x0,y0+j))b.w[x0+','+(y0+j)+',v']=j===1?'window':1;if(has(x0+W2-1,y0+j))b.w[(x0+W2)+','+(y0+j)+',v']=j===1?'window':1}
    const put=(t,gx,gy)=>{if(!has(gx,gy)||b.d.some(d=>d.gx===gx&&d.gy===gy))return null;const d={id:b.n++,t,gx,gy,r:0};b.d.push(d);return d};
    const g1=put('gen',x0,y0),g2=(L.solar||0)>=4?put('gen',x0+1,y0):null,pl=put('planter',x0+2,y0),tk=put('tank',x0+3,y0),lp=put('lamp',x0+4,y0),
      cr=put('craft',x0,y0+3),rs=(L.lab||0)>0?put('research',x0+1,y0+3):null,rd=(L.obs||0)>0?put('radar',x0+3,y0+3):null;
    let tu=null;if((L.tower||0)>0){const gx=x0+W2,gy=y0+H2;if(ok(gx,gy)){b.f[gx+','+gy]=1;tu=put('turret',gx,gy)}}
    const wire=(a,c)=>{if(a&&c)b.wi.push([a.id,c.id])};wire(g1,pl);wire(pl,lp);wire(g1,cr);wire(cr,rs);wire(g2||g1,rd);wire(rd||lp,tu);if(g2)wire(g1,g2);if(pl&&tk)b.pi.push([pl.id,tk.id]);
    b.tut=0;return true}
  /* ---------- phase 4: a short hands-on tutorial (build, wire, pipe, devices, defence) ---------- */
  const TUT=[['🔨','افتح وضع البناء بزر 🔨',()=>on],['⬜','اختر «أرضية» ووجّه الرائد ثم اضغط ✔',b=>Object.keys(b.f).length>tb.f],
    ['🔌','اختر «سلك»: اضغط ✔ قرب مولد ثم قرب جهاز',b=>b.wi.length>tb.wi],['🧪','اختر «أنبوب»: صِل حوض زراعة بخزان ليصل غذاؤه للمستعمرة',b=>b.pi.length>tb.pi],
    ['📋','أغلق البناء واقترب من أي جهاز لتفتح لوحته',()=>panel&&!panel.hidden],['🗼','ضع «برج دفاع» على أرضية ووصّله بمولد ليحمي القاعدة',b=>b.d.some(d=>d.t==='turret'&&net[d.id]&&net[d.id].ok)]];
  let tb={f:0,wi:0,pi:0},tutEl=null,tutT=0;
  function tutBase(){const b=B();tb={f:Object.keys(b.f).length,wi:b.wi.length,pi:b.pi.length}}
  function tutDraw(){if(!tutEl)return;const b=B(),i=b.tut;if(i==null||i>=TUT.length){tutEl.hidden=true;return}const T=TUT[i];tutEl.hidden=false;
    tutEl.innerHTML=`<span class="tn">${i+1}/${TUT.length}</span><b>${T[0]}</b><p>${T[1]}</p><button type="button" class="tsk">تخطَّ</button>`;tutEl.querySelector('.tsk').onclick=e=>{e.stopPropagation();b.tut=99;colSave();tutDraw()};
    if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(tutEl)}
  function tutTick(dt){if(!tutEl)return;tutT-=dt;if(tutT>0)return;tutT=0.4;const b=B();if(b.tut==null||b.tut>=TUT.length)return;solve();
    if(TUT[b.tut][2](b)){b.tut++;tutBase();snd('ok');if(b.tut>=TUT.length){gain('c',BAL.build.tutGems);toast('🎓 أتقنت البناء! +'+BAL.build.tutGems+' 💎','ach')}colSave();tutDraw()}}
  function start(a){api=a;on=false;sel=null;dirty=true;inCell='';cache=null;G3=null;scene3=null;const hud=a.hud;B();
    if(starter()){colSave();setTimeout(()=>toast('🏗️ جهّزنا لك قاعدة أولى جنوب القبة حسب مبانيك. وسّعها بزر 🔨','ach'),900)}
    const btn=document.createElement('button');btn.type='button';btn.className='wbuildb';btn.setAttribute('aria-label','وضع البناء');btn.textContent='🔨';btn.onclick=e=>{e.stopPropagation();open2(!on)};hud.appendChild(btn);
    bar=document.createElement('div');bar.className='wbbar';bar.hidden=true;bar.innerHTML=`<p class="bhint"></p><div class="btools">${TOOLS.map(([k,e,n])=>`<button type="button" data-t="${k}"><b>${e}</b><span>${n}</span>${cost(k).m?`<small>${costTxt(k)}</small>`:''}</button>`).join('')}</div><div class="bacts"><button type="button" data-a="rot">↻ <span>تدوير</span></button><button type="button" data-a="ok" class="main">✔ <span>ضع</span></button><button type="button" data-a="x">✖ <span>إغلاق</span></button></div>`;
    hud.appendChild(bar);bar.addEventListener('pointerdown',e=>e.stopPropagation());
    bar.onclick=e=>{e.stopPropagation();const t2=e.target.closest('[data-t]'),ac=e.target.closest('[data-a]');if(t2){tool=t2.dataset.t;sel=null;snd('tap');paint()}
      if(ac){const k=ac.dataset.a;if(k==='x')open2(false);if(k==='rot'){rot=(rot+1)%4;snd('tap')}if(k==='ok')place()}};
    chip=document.createElement('div');chip.className='wbchip';chip.hidden=true;hud.appendChild(chip);
    panel=document.createElement('div');panel.className='wdpanel';panel.hidden=true;hud.appendChild(panel);panel.addEventListener('pointerdown',e=>e.stopPropagation());panelId=null;
    tutEl=document.createElement('div');tutEl.className='wtut';tutEl.hidden=true;hud.appendChild(tutEl);tutEl.addEventListener('pointerdown',e=>e.stopPropagation());tutBase();tutDraw()}
  // the chip shows the device you stand by, or the health of the piece in front of you
  let chipT=0;
  // the device panel: opens by itself when the astronaut walks up to a device (title, state, actions, radar picture)
  function showPanel(d){if(!panel)return;if(!d){if(!panel.hidden){panel.hidden=true;panelId=null;WBD.T._sel=null}return}const b=B(),n=net[d.id]||{sup:0,use:0},D=WBD.T[d.t];WBD.T._sel=d;
    const acts=D.acts?D.acts(d,n,b):[],sig=d.id+'|'+acts.map(a=>a[2]).join()+'|'+(D.info?D.info(d,n,b,pipes[d.id]):'')+'|'+n.use+'/'+n.sup;if(panelId===sig&&!panel.hidden)return;panelId=sig;
    panel.innerHTML=`<div class="dph"><b>${D.em} ${D.n}</b><small>${(BAL.build[d.t]&&BAL.build[d.t].use)||d.t==='gen'?'⚡ '+n.use+'/'+n.sup+(n.sup?'':' · غير موصول بمولد'):'🧪 '+((pipes[d.id]||[]).length?'موصول بأنبوب':'بلا أنابيب')}</small></div><p>${D.info?D.info(d,n,b,pipes[d.id]):''}</p>${D.radar&&n.ok&&n.sup>0?'<canvas width="200" height="134"></canvas>':''}${acts.length?`<div class="dpa">${acts.map(([k,t2,ok])=>`<button type="button" data-k="${k}" ${ok?'':'disabled'}>${t2}</button>`).join('')}</div>`:''}`;
    panel.hidden=false;panel.querySelectorAll('[data-k]').forEach(x=>x.onclick=e=>{e.stopPropagation();D.act(x.dataset.k,d,n,b,api);panelId=null});
    const cv=panel.querySelector('canvas');if(cv&&api.mini()){const g=cv.getContext('2d');g.fillStyle='#070b16';g.fillRect(0,0,200,134);g.drawImage(api.mini(),0,0,200,134);g.strokeStyle='#00e5ff88';g.strokeRect(0.5,0.5,199,133)}
    if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(panel)}
  function onKill(m){const b=col.base;if(!b)return;b.sc=(b.sc||0)+(m.guard?BAL.build.scrapGuard:BAL.build.scrapPerKill)}
  function update(dt,t){pulse=(pulse+dt*0.7)%1;if(api&&col.base){solve();WBD.tick(dt,B(),net,pipes,api);tutTick(dt)}hpSaveT-=dt;if(hpDirty&&hpSaveT<=0){hpDirty=false;hpSaveT=3;colSave()}chipT-=dt;if(chipT>0||!chip||!api)return;chipT=0.3;solve();const d=near();
    showPanel(on?null:d);if(d&&!on){chip.hidden=true;return}
    if(d){const n=net[d.id]||{sup:0,use:0};chip.hidden=false;chip.textContent=WBD.T[d.t].em+' '+WBD.T[d.t].n+' · ⚡ '+n.use+'/'+n.sup;return}
    const P=pieceAt(target());if(P&&P.key){const h=hpOf(P.key,P.t),M=maxHp(P.t);if(on||h<M){chip.hidden=false;chip.textContent=NAME[P.t]+' · ❤️ '+Math.ceil(h)+'/'+M+(h<M?' · 🔧':'');return}}
    chip.hidden=true}
  function stop(){colSave();on=false;bar=null;chip=null;panel=null;tutEl=null;G3=null;scene3=null;api=null;cache=null}
  return {start,stop,update,push,blast,floor2d,items2d,roof2d,make3d,draw3d,onKill}})();
