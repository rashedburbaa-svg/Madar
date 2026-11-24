/* ================= مستعمرة المدار — colony layout editor =================
   The player moves the buildings on an isometric 3/4 grid inside the fence and the glass corridors follow by themselves.
   Saved in the colony save (arcade-colony) as col.lay = {pos:{id:[x,y]}, corr:[[a,b],…], auto:1}; no col.lay = the original layout.
   The dome (wall) and the defence towers stay where they are: the dome covers the whole base and the towers stand on the fence. */
const LAY={on:false,mode:'move',sel:null,drag:null};
const LAY_DEF=JSON.parse(JSON.stringify(SLOT));
const LAY_IDS=Object.keys(SLOT).filter(k=>k!=='wall'&&k!=='tower');
const LAY_G={ox:184,oy:456,sx:28,sy:16};              // grid: x = 184 + 28·m, y = 456 + 16·n, with m and n of the same parity (diamond cells)
const LAY_B={cx:178,cy:468,rx:186,ry:172};             // allowed ground: inside the fence ellipse
const layValid=p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1])&&((p[0]-178)/186)**2+((p[1]-468)/172)**2<=1.02;   // a saved spot is used only if it is a real point inside the fence
function layApply(){if(col.lay&&(typeof col.lay!=='object'||Array.isArray(col.lay)))delete col.lay;for(const id of LAY_IDS){let p=col.lay&&col.lay.pos&&col.lay.pos[id];if(p&&!layValid(p)){delete col.lay.pos[id];p=null}const d=LAY_DEF[id];SLOT[id][0]=p?p[0]:d[0];SLOT[id][1]=p?p[1]:d[1]}}
layApply();
function laySnap(x,y){let m=Math.round((x-LAY_G.ox)/LAY_G.sx),n=Math.round((y-LAY_G.oy)/LAY_G.sy);
  if((m+n)&1){const c=[[m+1,n],[m-1,n],[m,n+1],[m,n-1]].map(([a,b])=>[a,b,Math.hypot(LAY_G.ox+a*LAY_G.sx-x,LAY_G.oy+b*LAY_G.sy-y)]).sort((a,b)=>a[2]-b[2])[0];m=c[0];n=c[1]}
  return [LAY_G.ox+m*LAY_G.sx,LAY_G.oy+n*LAY_G.sy]}
// a spot is free when it is inside the fence and no other building's footprint overlaps it
function layOk(id,x,y){const B=LAY_B;if(((x-B.cx)/B.rx)**2+((y-B.cy)/B.ry)**2>1)return false;
  {const [gx,gy]=LAY_DEF.wall;if(((x-gx)/70)**2+((y-gy)/40)**2<1)return false}   // keep the gate free
  for(const o of LAY_IDS){if(o===id)continue;const [ox,oy,os]=SLOT[o],k=(SLOT[id][2]+os)/2.6;if(((x-ox)/(64*k))**2+((y-oy)/(44*k))**2<1)return false}return true}
// the default corridors: everything hangs from the HQ, the radio tower from the lab
const LAY_PAIRS=()=>(typeof CORR!=='undefined'?CORR.map(c=>[c[0],c[1]]):[]);
function layPath(a,b){const [x1,y1]=SLOT[a],[x2,y2]=SLOT[b],dx=x2-x1;if(Math.abs(dx)<6)return `M${x1} ${y1} L${x2} ${y2}`;
  return `M${x1} ${y1} Q${((x1+x2)/2).toFixed(0)} ${((y1+y2)/2+Math.min(40,Math.abs(dx)*0.13)).toFixed(0)} ${x2} ${y2}`}
function corrList(){if(!col.lay)return CORR;return (Array.isArray(col.lay.corr)?col.lay.corr:LAY_PAIRS()).filter(c=>Array.isArray(c)).filter(([a,b])=>SLOT[a]&&SLOT[b]).map(([a,b])=>[a,b,layPath(a,b)])}
// automatic corridors: a shortest tree that starts at the HQ, so every building is linked with the least glass
function layAuto(){const done=['hq'],left=LAY_IDS.filter(k=>k!=='hq'),out=[];
  while(left.length){let best=null;for(const a of done)for(const b of left){const d=Math.hypot(SLOT[a][0]-SLOT[b][0],(SLOT[a][1]-SLOT[b][1])*1.6);if(!best||d<best[2])best=[a,b,d]}
    out.push([best[0],best[1]]);done.push(best[1]);left.splice(left.indexOf(best[1]),1)}return out}
function layEnsure(){if(!col.lay)col.lay={pos:{},corr:LAY_PAIRS(),auto:0};col.lay.pos=col.lay.pos||{};if(!col.lay.corr)col.lay.corr=LAY_PAIRS()}
const layHas=(a,b)=>col.lay&&col.lay.corr.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
function layToggle(a,b){layEnsure();col.lay.auto=0;if(layHas(a,b)){col.lay.corr=col.lay.corr.filter(([x,y])=>!((x===a&&y===b)||(x===b&&y===a)));toast('✂️ أُزيل الممر')}
  else{col.lay.corr.push([a,b]);toast('🔗 أُضيف ممر')}colSave();snd('tap');renderColony()}
// grid, allowed ground and the tap targets of the corridors, drawn under the buildings while editing
function layGridSVG(){if(!LAY.on)return '';const B=LAY_B,G=LAY_G;let l='';
  for(let k=-16;k<=16;k++){const px=G.ox+k*G.sx,py=G.oy+k*G.sy,qx=G.ox-k*G.sx,qy=G.oy+k*G.sy;
    l+=`M${px-20*G.sx} ${py+20*G.sy}L${px+20*G.sx} ${py-20*G.sy}M${qx-20*G.sx} ${qy-20*G.sy}L${qx+20*G.sx} ${qy+20*G.sy}`}
  let hit='';if(LAY.mode==='corr')for(const [a,b,d] of corrList())hit+=`<path class="lhit" data-a="${a}" data-b="${b}" d="${d}"/>`;
  return `<g class="lgrid"><defs><clipPath id="lclip"><ellipse cx="${B.cx}" cy="${B.cy}" rx="${B.rx}" ry="${B.ry}"/></clipPath></defs><ellipse cx="${B.cx}" cy="${B.cy}" rx="${B.rx}" ry="${B.ry}" fill="#00e5ff" fill-opacity=".05" stroke="#00e5ff" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="7 5"/><path d="${l}" clip-path="url(#lclip)" stroke="#9fe8ff" stroke-opacity=".22" stroke-width=".8" fill="none"/></g>${hit?`<g class="lhits">${hit}</g>`:''}`}
function layToolbar(){return `<div class="laybar" role="toolbar"><p class="layhint">${LAY.mode==='move'?'اسحب أي مبنى إلى مكان جديد على الشبكة، والممرات تتبعه':'المس مبنيين لإضافة ممر بينهما أو إزالته، أو المس ممراً لإزالته'}</p>
  <div class="laybtns"><button type="button" data-lay="move" class="${LAY.mode==='move'?'on':''}">✋ <span>تحريك</span></button><button type="button" data-lay="corr" class="${LAY.mode==='corr'?'on':''}">🔗 <span>الممرات</span></button><button type="button" data-lay="auto">✨ <span>توصيل تلقائي</span></button><button type="button" data-lay="reset">↺ <span>الافتراضي</span></button><button type="button" data-lay="done" class="main">✔ <span>تم</span></button></div></div>`}
function layOpen(on){LAY.on=on;LAY.sel=null;LAY.mode='move';if(on&&typeof cam!=='undefined'){cam.z=Math.max(cam.z,1.35);cam.x=178;cam.y=470}if(on&&typeof EX!=='undefined'&&EX.on&&typeof exToggle==='function')exToggle();document.body.classList.toggle('layedit',on);snd('tap');renderColony()}
function laySvgPt(svg,e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):{x:0,y:0}}
function layBind(host){const svg=host.querySelector('#cscene');if(!svg)return;svg.classList.add('lay');
  host.insertAdjacentHTML('beforeend',layToolbar());if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(host.querySelector('.laybar'));
  host.querySelectorAll('[data-lay]').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.lay;
    if(k==='done')return layOpen(false);
    if(k==='move'||k==='corr'){LAY.mode=k;LAY.sel=null;snd('tap');return renderColony()}
    if(k==='auto'){layEnsure();col.lay.corr=layAuto();col.lay.auto=1;colSave();snd('win');toast('✨ وُصلت المباني بأقصر الممرات');return renderColony()}
    if(k==='reset'){confirmBox('إعادة المباني والممرات إلى الترتيب الافتراضي؟',()=>{delete col.lay;layApply();colSave();snd('ok');renderColony()})}});
  svg.querySelectorAll('.cb').forEach(g=>{const id=g.dataset.b,s=SLOT[id][2];
    g.insertAdjacentHTML('afterbegin',`<ellipse class="lfoot" cx="0" cy="-2" rx="${(34*s).toFixed(0)}" ry="${(14*s).toFixed(0)}"/>`);
    if(LAY.sel===id)g.classList.add('lsel');
    g.addEventListener('pointerdown',e=>{if(LAY.mode!=='move'||LAY.drag||!e.isPrimary)return;e.preventDefault();const p0=laySvgPt(svg,e);
      LAY.drag={id,g,x0:SLOT[id][0],y0:SLOT[id][1],px:p0.x,py:p0.y,x:SLOT[id][0],y:SLOT[id][1],ok:true,moved:false};try{g.setPointerCapture(e.pointerId)}catch(_){}g.classList.add('ldrag')});
    g.addEventListener('pointermove',e=>{const D=LAY.drag;if(!D||D.g!==g)return;const p=laySvgPt(svg,e),[x,y]=laySnap(D.x0+p.x-D.px,D.y0+p.y-D.py);
      if(x===D.x&&y===D.y)return;D.x=x;D.y=y;D.moved=true;D.ok=layOk(id,x,y);g.setAttribute('transform',`translate(${x} ${y})`);g.classList.toggle('lbad',!D.ok);
      // corridors attached to this building follow it while it moves
      const keep=[SLOT[id][0],SLOT[id][1]];SLOT[id][0]=x;SLOT[id][1]=y;const c=svg.querySelector('.corr');if(c&&typeof corridorsSVG==='function'){const t=document.createElementNS('http://www.w3.org/2000/svg','g');t.innerHTML=corridorsSVG().replace(/^[\s\S]*?(<g class="corr")/,'$1');const n=t.querySelector('.corr');if(n)c.replaceWith(n)}SLOT[id][0]=keep[0];SLOT[id][1]=keep[1]});
    const end=()=>{const D=LAY.drag;if(!D||D.g!==g)return;LAY.drag=null;LAY.pend=0;g.classList.remove('ldrag','lbad');
      if(D.moved&&D.ok){layEnsure();col.lay.pos[id]=[D.x,D.y];SLOT[id][0]=D.x;SLOT[id][1]=D.y;if(col.lay.auto)col.lay.corr=layAuto();colSave();snd('ok');buzz(12)}
      else if(D.moved){toast('🚫 لا يمكن وضعه هنا');snd('err')}
      renderColony()};
    g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end)});
  svg.querySelectorAll('.lhit').forEach(p=>p.addEventListener('click',e=>{e.stopPropagation();layToggle(p.dataset.a,p.dataset.b)}))}
// taps on the map do editing instead of opening sheets while the editor is on
function layClick(e){if(!LAY.on)return;const host=$('colony');if(!host||!host.contains(e.target)||e.target.closest('.laybar,.czoom'))return;const g=e.target.closest('#cscene .cb');
  if(e.target.closest('#cscene .lhit'))return;
  if(!e.target.closest('#cscene .cb,#cscene .tow,#cscene .trader'))return;e.stopPropagation();e.preventDefault();
  if(LAY.mode!=='corr'||!g)return;const id=g.dataset.b;
  if(!LAY.sel){LAY.sel=id;snd('tap');toast('🔗 اختر المبنى الثاني');renderColony()}else if(LAY.sel===id){LAY.sel=null;renderColony()}else{const a=LAY.sel;LAY.sel=null;layToggle(a,id)}}
document.addEventListener('click',layClick,true);
// a second finger stops a drag (the camera pinches instead)
function layCancel(){const D=LAY.drag;if(!D)return;LAY.drag=null;D.g.classList.remove('ldrag','lbad');renderColony()}
// a re-render in the middle of a drag (a build ends, night falls, a raid) waits for the finger to lift
{const _rc=renderColony;renderColony=function(){if(LAY.drag){LAY.pend=1;return}_rc.apply(this,arguments);const host=$('colony');if(!host)return;
  const z=host.querySelector('.czoom');if(z&&!z.querySelector('.clay')){const b=document.createElement('button');b.type='button';b.className='clay'+(LAY.on?' on':'');b.setAttribute('aria-label','تخطيط المستعمرة');b.textContent='📐';b.onclick=()=>layOpen(!LAY.on);z.appendChild(b)}
  if(LAY.on)layBind(host)}}
