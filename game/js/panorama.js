/* ================= مستعمرة المدار — new-region panorama ================= */
/* A layered parallax scene built only from art already in the game (no new images):
   far: the region landscape pl<i>_land · mid: its landmark pl<i>_s3 · near: its big monster pl<i>_big.
   Layers move with transform: translate3d in one requestAnimationFrame loop that stops when the screen closes.
   Shown once per region when its gate opens (col.wm.pv). It is a .hmodal, so عالم المدار pauses while it is open. */
function panoSeen(i){try{return !!(col.wm.pv||{})[i]}catch(e){return false}}
function regionPanorama(i,onEnter,onLater){
  if(typeof REG==='undefined'||!REG[i]||document.querySelector('.pano'))return null;
  try{col.wm.pv=col.wm.pv||{};col.wm.pv[i]=1;colSave()}catch(e){}
  const R=REG[i],P=PLN[i]||{},A=typeof ART!=='undefined'?ART:{},tint=P.tint||'#00e5ff';
  const im=(k,c)=>A[k]?`<img class="${c}" src="${A[k]}" alt="" draggable="false">`:'';
  const m=document.createElement('div');m.className='hmodal pano';m.style.zIndex=45;m.style.setProperty('--pt',tint);
  m.innerHTML=`<div class="pscene" aria-hidden="true">
      <div class="pl pfar">${A['pl'+i+'_land']?`<div class="pland" style="background-image:url(${A['pl'+i+'_land']})"></div>`:''}</div>
      <div class="pglow"></div><div class="pstars"></div>
      <div class="pl pmid">${im('pl'+i+'_s3','pmark')}</div>
      <div class="pl pnear">${im('pl'+i+'_big','pmon')}</div>
      <div class="phaze"></div></div>
    <div class="pcard" role="dialog" aria-modal="true">
      <span class="pbadge">🔓 <span>منطقة جديدة</span></span>
      <h3><span>${P.em||''}</span> <span>${P.n||''}</span></h3>
      <div class="prow"><span class="pic">${R.me}</span><div><small>المادة الأساسية</small><b>${R.mn}</b></div></div>
      <div class="prow"><span class="pic">✨</span><div><small>المكافأة الدائمة</small><b>كل مرحلة: ${R.bd} +${Math.round(R.bonus[1]*100)}%</b></div></div>
      <button class="btn main penter" type="button">🚀 <span>ادخل المنطقة</span></button>
      <button class="plater" type="button">لاحقاً</button></div>`;
  document.body.appendChild(m);if(typeof trNode==='function'&&typeof I18N!=='undefined'&&I18N.on)trNode(m);
  const L=[...m.querySelectorAll('.pl')],amp=[16,9,4],calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf=0,t0=performance.now(),tx=0,ty=0,gx=0,gy=0;
  // the layers drift slowly; a finger drag tilts the depth a little
  const tick=now=>{raf=requestAnimationFrame(tick);if(document.hidden)return;const t=(now-t0)/1000;gx+=(tx-gx)*0.06;gy+=(ty-gy)*0.06;
    L.forEach((el,k)=>{const d=amp[k]||4,x=(Math.sin(t*0.22+k)*d+gx*d*1.4).toFixed(1),y=(Math.cos(t*0.17+k*2)*d*0.35+gy*d*0.6+(k===2?Math.abs(Math.sin(t*1.6))*-3:0)).toFixed(1);
      el.style.transform=`translate3d(${x}px,${y}px,0)`})};
  if(!calm)raf=requestAnimationFrame(tick);
  const mv=e=>{tx=Math.max(-1,Math.min(1,(e.clientX/innerWidth-0.5)*2));ty=Math.max(-1,Math.min(1,(e.clientY/innerHeight-0.5)*2))};
  m.addEventListener('pointermove',mv);
  const close=fn=>{cancelAnimationFrame(raf);raf=0;m.removeEventListener('pointermove',mv);m.remove();fn&&fn()};
  m.querySelector('.penter').onclick=()=>{typeof snd==='function'&&snd('win');close(onEnter)};
  m.querySelector('.plater').onclick=()=>{typeof snd==='function'&&snd('tap');close(onLater)};
  typeof snd==='function'&&snd('ach');typeof buzz==='function'&&buzz([20,40,20]);m.querySelector('.penter').focus();
  return m}
