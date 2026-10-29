/* ================= game 6: 2048 ================= */
const Game2048=(()=>{
  const PAL={2:['#20393b','#e8f1ee'],4:['#25474a','#e8f1ee'],8:['#2b6a5c','#fff'],16:['#2f866d','#fff'],32:['#36a583','#fff'],64:['#3fbf9b','#062019'],128:['#cdb35c','#2a1c00'],256:['#e2b552','#2a1c00'],512:['#f2b84b','#2a1c00'],1024:['#f59e42','#2a1c00'],2048:['#ff8a4c','#2a1c00'],4096:['#ff6f61','#fff']};
  const DIRN=['يسار ⬅️','يمين ➡️','أعلى ⬆️','أسفل ⬇️'];
  let st,g,boardEl,ub;
  const conf=l=>l<=5?{n:4,target:[128,256,512,1024,2048][l-1],rocks:0}:{n:5,target:2048,rocks:Math.min(l-5,5)};
  function spawn(){const e=[];g.cells.forEach((v,i)=>{if(v===0)e.push(i)});if(!e.length)return -1;const i=e[Math.floor(g.R()*e.length)];g.cells[i]=g.R()<0.9?2:4;return i}
  function build(level,seed){const c=conf(level),base=seed??level*2203+11,R0=rng(base),n=c.n,cells=new Array(n*n).fill(0);
    shuffle([...Array(n*n).keys()],R0).slice(0,c.rocks).forEach(i=>cells[i]=-1);
    g={level,n,target:c.target,cells,base,R:R0,moves:0,undos:0,hints:0,hist:[],over:false};spawn();spawn()}
  function lines(n,dir){const L=[];for(let a=0;a<n;a++){const line=[];for(let b=0;b<n;b++){let r,c;if(dir<2){r=a;c=dir===0?b:n-1-b}else{c=a;r=dir===2?b:n-1-b}line.push(r*n+c)}L.push(line)}return L}
  function slide(cells,n,dir){
    const out=cells.slice();let moved=false,gain=0;const merged=[];
    for(const line of lines(n,dir)){let seg=[];
      const flush=()=>{const vals=seg.map(i=>out[i]).filter(v=>v>0),res=[];
        for(let k=0;k<vals.length;k++){if(k+1<vals.length&&vals[k]===vals[k+1]){res.push(vals[k]*2);gain+=vals[k]*2;merged.push(seg[res.length-1]);k++}else res.push(vals[k])}
        seg.forEach((idx,j)=>{const v=res[j]||0;if(out[idx]!==v)moved=true;out[idx]=v});seg=[]};
      for(const i of line){if(out[i]===-1)flush();else seg.push(i)}flush()}
    return {cells:out,moved,gain,merged};
  }
  const maxTile=()=>Math.max(0,...g.cells);
  const canMove=()=>[0,1,2,3].some(d=>slide(g.cells,g.n,d).moved);
  function render(news,merged){
    const n=g.n;boardEl.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`;
    if(boardEl.children.length!==n*n){boardEl.innerHTML='';for(let i=0;i<n*n;i++)boardEl.appendChild(document.createElement('div'))}
    const w=(boardEl.clientWidth||320)/n;
    g.cells.forEach((v,i)=>{const d=boardEl.children[i];d.className='t2'+(v===-1?' rock':'')+(i===news?' new':'')+(merged&&merged.includes(i)?' mrg':'');
      if(v>0){const p=PAL[v]||['#c2477e','#fff'],dg=String(v).length;d.style.background=p[0];d.style.color=p[1];d.textContent=v;d.style.fontSize=Math.round(w*(dg<=2?.4:dg===3?.32:.25))+'px'}
      else{d.style.background='';d.style.color='';d.textContent=''}});
    setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.target);setStat('s3',maxTile());setStat('s4',g.moves);ub.disabled=!g.hist.length||g.over;
  }
  function persist(){if(mode&&mode.daily)return;st.cur={level:g.level,n:g.n,target:g.target,cells:g.cells,base:g.base,moves:g.moves,undos:g.undos,hints:g.hints};gSave('g2048',st)}
  function move(d){
    if(!g||g.over)return;const r=slide(g.cells,g.n,d);if(!r.moved){buzz(10);return}
    g.hist.push({cells:g.cells.slice(),moves:g.moves});if(g.hist.length>20)g.hist.shift();
    g.cells=r.cells;g.moves++;const ni=spawn();snd(r.gain?'ok':'tap');if(r.gain>=128)buzz(15);render(ni,r.merged);persist();
    if(maxTile()>=g.target){g.over=true;const help=g.undos+g.hints,s=help===0?3:help<=3?2:1;st.cur=null;gSave('g2048',st);render();
      finishLevel(Game2048,st,g.level,s,{max:maxTile()},'وصلت إلى '+g.target+'!',`${g.moves} حركة · تراجع ${g.undos} · تلميحات ${g.hints}`);return}
    if(!canMove()){g.over=true;st.cur=null;gSave('g2048',st);render();loseBox({title:'انتهت الحركات',text:'أكبر رقم وصلت إليه '+maxTile()+'. حاول مرة أخرى!',onRetry:()=>play(g.level,true)})}
  }
  function score(cells,n){
    let empty=0,mono=0;cells.forEach(v=>{if(v===0)empty++});
    const lg=v=>v>0?Math.log2(v):0;
    for(let a=0;a<n;a++){let i1=0,d1=0,i2=0,d2=0;for(let b=0;b<n-1;b++){const x=cells[a*n+b],y=cells[a*n+b+1],p=cells[b*n+a],q=cells[(b+1)*n+a];
      if(x>=0&&y>=0){if(x>y)d1+=lg(x)-lg(y);else i1+=lg(y)-lg(x)}if(p>=0&&q>=0){if(p>q)d2+=lg(p)-lg(q);else i2+=lg(q)-lg(p)}}mono-=Math.min(i1,d1)+Math.min(i2,d2)}
    const mx=Math.max(...cells),corner=[0,n-1,n*(n-1),n*n-1].some(i=>cells[i]===mx)?lg(mx)*8:0;
    return empty*27+mono*10+corner;
  }
  function play(level,fresh){
    clearOverlays();st=gState('g2048',{cur:null});
    if(mode&&mode.daily)build(3,mode.seed);
    else if(!fresh&&st.cur&&st.cur.level===level){const c=st.cur;g=Object.assign({},c,{cells:c.cells.slice(),R:rng(c.base+c.moves*7919+1),hist:[],over:false})}
    else build(level);
    boardEl.innerHTML='';render();persist();
  }
  return {id:'g2048',name:'2048',desc:'ادمج الأرقام المتشابهة حتى تصل للهدف',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="5" y="5" width="18" height="18" rx="4" fill="#3fbf9b"/><rect x="25" y="5" width="18" height="18" rx="4" fill="#25474a"/><rect x="5" y="25" width="18" height="18" rx="4" fill="#25474a"/><rect x="25" y="25" width="18" height="18" rx="4" fill="#f2b84b"/><text x="14" y="18" font-size="10" font-weight="700" fill="#062019" font-family="sans-serif" text-anchor="middle">2</text><text x="34" y="38" font-size="8" font-weight="700" fill="#2a1c00" font-family="sans-serif" text-anchor="middle">2048</text></svg>',
    help:'اسحب بإصبعك يميناً أو يساراً أو لأعلى أو لأسفل، فتتحرك كل المربعات، وكل مربعين متساويين يندمجان في مربع واحد. الهدف يكبر مع المستويات، ومن المستوى 6 تصبح اللوحة 5×5 وفيها صخور ثابتة. «تلميح» يقترح أفضل اتجاه.',
    progress(){const s=gState('g2048');return {level:s.level,stars:starTotal(s)}},
    start(){
      st=gState('g2048',{cur:null});setStats([['s1','المستوى'],['s2','الهدف','gold'],['s3','أكبر رقم'],['s4','حركات']]);
      boardEl=document.createElement('div');boardEl.className='b2048';stage.appendChild(boardEl);
      let sx=0,sy=0,act=false;
      boardEl.onpointerdown=e=>{sx=e.clientX;sy=e.clientY;act=true;try{boardEl.setPointerCapture(e.pointerId)}catch(_){}};
      boardEl.onpointerup=e=>{if(!act)return;act=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))move(dx<0?0:1);else move(dy<0?2:3)};
      boardEl.onpointercancel=()=>{act=false};
      document.addEventListener('keydown',this.key=e=>{const m={ArrowLeft:0,ArrowRight:1,ArrowUp:2,ArrowDown:3}[e.key];if(m!=null){e.preventDefault();move(m)}});
      ub=btn('تراجع',IC.undo,()=>{if(!g.hist.length||g.over)return;const h=g.hist.pop();g.cells=h.cells;g.moves=h.moves;g.undos++;snd('tap');render();persist()});
      btn('تلميح',IC.hint,()=>{if(g.over)return;let best=-1,bs=-Infinity;for(let d=0;d<4;d++){const r=slide(g.cells,g.n,d);if(!r.moved)continue;const sc=score(r.cells,g.n)+r.gain*0.5;if(sc>bs){bs=sc;best=d}}
        if(best<0)return;g.hints++;persist();snd('tap');toast('أفضل حركة الآن: '+DIRN[best])});
      btn('إعادة',IC.reset,()=>play(g.level,true));
      this.rs=()=>render();addEventListener('resize',this.rs);
      play(st.level);
    },
    stop(){document.removeEventListener('keydown',this.key);removeEventListener('resize',this.rs)}};
})();
