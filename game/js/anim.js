/* living buildings: small looping effects drawn over each painted building (smoke, lights, signals, sparks) */
function bfx(id,L,w,h,y){const top=y,mid=y+h*0.45,R=(a,b)=>(a+Math.random()*(b-a)).toFixed(1),d=i=>`style="animation-delay:${(i*0.7+Math.random()*0.4).toFixed(2)}s"`;let s='';
  const puff=(x,yy,n,col)=>{for(let i=0;i<n;i++)s+=`<circle class="fx-smk" cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${R(5,8)}" fill="${col}" ${d(i)}/>`};
  const rise=(x,yy,n,col,cls)=>{for(let i=0;i<n;i++)s+=`<circle class="${cls||'fx-bub'}" cx="${(x+(Math.random()-0.5)*w*0.25).toFixed(1)}" cy="${yy.toFixed(1)}" r="${R(2.2,3.6)}" fill="${col}" ${d(i)}/>`};
  const lights=(n,col)=>{for(let i=0;i<n;i++)s+=`<rect class="fx-win" x="${R(-w*0.3,w*0.25)}" y="${R(top+h*0.35,top+h*0.75)}" width="5" height="4" rx="1" filter="url(#fxGlow)" fill="${col}" ${d(i)}/>`};
  switch(id){
    case 'hq':s+=`<circle class="fx-ping" cx="0" cy="${(top+6).toFixed(1)}" r="6" fill="none" stroke="#5ff2d6" stroke-width="2.4"/><circle class="fx-ping" cx="0" cy="${(top+6).toFixed(1)}" r="6" fill="none" stroke="#5ff2d6" stroke-width="2.4" style="animation-delay:1.2s"/>`;lights(5,'#ffe9a8');break;
    case 'mine':puff(-w*0.22,top+h*0.22,3,'#cfc6bb');s+=`<g class="fx-spark" transform="translate(${(w*0.12).toFixed(1)} ${(top+h*0.82).toFixed(1)})"><path d="M0 0l4 -3M0 0l-3 -4M0 0l4 2" stroke="#ffd34d" stroke-width="1.2" stroke-linecap="round"/></g>`;break;
    case 'solar':s+=`<rect class="fx-glint" x="${(-w*0.42).toFixed(1)}" y="${(top+h*0.3).toFixed(1)}" width="7" height="${(h*0.45).toFixed(1)}" fill="#fff" transform="skewX(-25)"/>`;break;
    case 'farm':rise(0,top+h*0.35,4,'#9dff5a');break;
    case 'habitat':lights(6,'#ffe9a8');puff(w*0.18,top+h*0.2,2,'#e8eef4');break;
    case 'radio':for(let i=0;i<3;i++)s+=`<circle class="fx-sig" cx="0" cy="${(top+h*0.12).toFixed(1)}" r="5" fill="none" stroke="#9fe8ff" stroke-width="2.2" style="animation-delay:${i*0.8}s"/>`;break;
    case 'obs':s+=`<g transform="translate(0 ${(top+h*0.18).toFixed(1)})"><path class="fx-beam" d="M0 0 L-12 -70 L12 -70Z" fill="url(#fxBeam)"/></g>`;break;
    case 'def':s+=`<g transform="translate(0 ${(top+h*0.2).toFixed(1)})"><circle r="11" fill="none" stroke="#5ff2d6" stroke-width=".8" opacity=".5"/><path class="fx-radar" d="M0 0 L11 0 A11 11 0 0 0 7.8 -7.8Z" fill="#5ff2d6" opacity=".55"/><circle r="1.6" fill="#ff5d73" class="blink"/></g>`;break;
    case 'lab':rise(0,top+h*0.25,5,'#c58bff');rise(0,top+h*0.3,2,'#5ff2d6');lights(3,'#b8ffef');break;
    case 'dock':for(let i=0;i<3;i++)s+=`<g class="fx-spark" transform="translate(${R(-w*0.25,w*0.25)} ${R(mid,mid+h*0.25)})" ${d(i)}><path d="M0 0l4 -3M0 0l-3 -4M0 0l4 2M0 0l-4 1" stroke="#fff3a0" stroke-width="1.1" stroke-linecap="round"/></g>`;break}
  return s?`<g class="bfx" pointer-events="none">${s}</g>`:''}
{const _ia=imgArt;imgArt=function(id,L){const out=_ia(id,L);if(!L)return out;const r=ART[id+'R']||1,w=(60+Math.min(10,L)*2.4)*Math.sqrt(r)*(id==='hq'?1.18:1),h=w/r;return out+bfx(id,L,w,h,-h+12)}}
// the observatory beam needs a soft gradient; add it once to the scene defs
{const _sv=sceneSVG;sceneSVG=function(){return _sv.apply(this,arguments).replace('<defs>','<defs><filter id="fxGlow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="fxBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient>')}}
