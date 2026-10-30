/* ================= game 6: 2048 ================= */
const Game2048=(()=>{
  const EMO2={2:'🪨',4:'🌑',8:'🌙',16:'🌍',32:'🪐',64:'⭐',128:'🌟',256:'☀️',512:'💫',1024:'🌌',2048:'🕳️',4096:'✨'};
  const PAL={2:['#20393b','#e8f1ee'],4:['#25474a','#e8f1ee'],8:['#2b6a5c','#fff'],16:['#2f866d','#fff'],32:['#36a583','#fff'],64:['#3fbf9b','#062019'],128:['#cdb35c','#2a1c00'],256:['#e2b552','#2a1c00'],512:['#f2b84b','#2a1c00'],1024:['#f59e42','#2a1c00'],2048:['#ff8a4c','#2a1c00'],4096:['#ff6f61','#fff']};
  const DIRN=['يسار ⬅️','يمين ➡️','أعلى ⬆️','أسفل ⬇️'];
  let st,g,boardEl,ub,bombB,swapB,timeB,tick=0;
  const conf=l=>l<=5?{n:4,target:[128,256,512,1024,2048][l-1],rocks:0}:{n:5,target:2048,rocks:Math.min(l-5,5)};
  function spawn(){const e=[];g.cells.forEach((v,i)=>{if(v===0)e.push(i)});if(!e.length)return -1;const i=e[Math.floor(g.R()*e.length)];g.cells[i]=g.R()<0.9?2:4;return i}
  function build(level,seed){const c=conf(level),base=seed??level*2203+11,R0=rng(base),n=c.n,cells=new Array(n*n).fill(0);
    shuffle([...Array(n*n).keys()],R0).slice(0,c.rocks).forEach(i=>cells[i]=-1);
    g={level,n,target:c.target,cells,base,R:R0,moves:0,undos:0,hints:0,hist:[],over:false};spawn();spawn()}
  function lines(n,dir){const L=[];for(let a=0;a<n;a++){const line=[];for(let b=0;b<n;b++){let r,c;if(dir<2){r=a;c=dir===0?b:n-1-b}else{c=a;r=dir===2?b:n-1-b}line.push(r*n+c)}L.push(line)}return L}
  function slide(cells,n,dir){
    const out=cells.slice();let moved=false,gain=0;const merged=[],from=[];
    for(const line of lines(n,dir)){let seg=[];
      const flush=()=>{const vals=seg.filter(i=>out[i]>0).map(i=>[out[i],i]),res=[];
        for(let k=0;k<vals.length;k++){const dst=seg[res.length];if(k+1<vals.length&&vals[k][0]===vals[k+1][0]){res.push(vals[k][0]*2);gain+=vals[k][0]*2;merged.push(dst);from.push([vals[k][1],dst],[vals[k+1][1],dst]);k++}else{res.push(vals[k][0]);from.push([vals[k][1],dst])}}
        seg.forEach((idx,j)=>{const v=res[j]||0;if(out[idx]!==v)moved=true;out[idx]=v});seg=[]};
      for(const i of line){if(out[i]===-1)flush();else seg.push(i)}flush()}
    return {cells:out,moved,gain,merged,from};
  }
  const maxTile=()=>Math.max(0,...g.cells);
  const canMove=()=>[0,1,2,3].some(d=>slide(g.cells,g.n,d).moved);
  function render(news,merged,from){
    const n=g.n;boardEl.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`;
    if(boardEl.children.length!==n*n){boardEl.innerHTML='';for(let i=0;i<n*n;i++)boardEl.appendChild(document.createElement('div'))}
    const w=(boardEl.clientWidth||320)/n;
    g.cells.forEach((v,i)=>{const d=boardEl.children[i];d.className='t2'+(v===-1?' rock':'')+(i===news?' new':'')+(merged&&merged.includes(i)?' mrg':'');
      if(v>0){const p=PAL[v]||['#c2477e','#fff'],dg=String(v).length;d.style.background=p[0];d.style.color=p[1];d.innerHTML=(EMO2[v]?'<i>'+EMO2[v]+'</i>':'')+v;d.style.fontSize=Math.round(w*(dg<=2?.4:dg===3?.32:.25))+'px'}
      else{d.style.background='';d.style.color='';d.textContent=''}});
    // glide: each tile starts where it was and slides into its new cell
    if(from&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const step=(boardEl.clientWidth-16-(n-1)*8)/n+8;
      from.forEach(([a,b])=>{if(a===b)return;const el=boardEl.children[b],dx=(a%n-b%n)*step,dy=(((a/n)|0)-((b/n)|0))*step;
        el.style.transition='none';el.style.transform=`translate(${dx}px,${dy}px)`;el.style.zIndex=2});
      void boardEl.offsetWidth;from.forEach(([a,b])=>{const el=boardEl.children[b];el.style.transition='transform .11s ease-out';el.style.transform='';setTimeout(()=>{el.style.zIndex=''},130)})}
    bombB.lastChild.textContent='قنبلة × '+(st.pw.bomb||0);swapB.lastChild.textContent='تبديل × '+(st.pw.swap||0);
    bombB.classList.toggle('on',g.power==='bomb');swapB.classList.toggle('on',g.power==='swap');bombB.disabled=!st.pw.bomb||g.over;swapB.disabled=!st.pw.swap||g.over;
    timeB.lastChild.textContent=g.timed?'المستويات':'تحدي الوقت';
    if(g.timed){setStat('s1','⏱️ '+fmtTime(g.tleft));setStat('s2',g.score);setStat('s3',maxTile());setStat('s4',st.timeBest||0);ub.disabled=true;return}
    setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.target);setStat('s3',maxTile());setStat('s4',g.moves);ub.disabled=!g.hist.length||g.over;
  }
  function persist(){if(mode&&mode.daily||g.timed)return;st.cur={level:g.level,n:g.n,target:g.target,cells:g.cells,base:g.base,moves:g.moves,undos:g.undos,hints:g.hints};gSave('g2048',st)}
  function move(d){
    if(!g||g.over)return;const r=slide(g.cells,g.n,d);if(!r.moved){buzz(10);return}
    g.hist.push({cells:g.cells.slice(),moves:g.moves});if(g.hist.length>20)g.hist.shift();
    g.cells=r.cells;g.moves++;g.score=(g.score||0)+r.gain;const ni=spawn();snd(r.gain?'ok':'tap');if(r.gain>=128)buzz(15);render(ni,r.merged,r.from);persist();
    if(g.timed){if(!canMove())endTimed('انتهت الحركات');return}
    if(maxTile()>=g.target){g.over=true;const help=g.undos+g.hints,s=help===0?3:help<=3?2:1;st.cur=null;gSave('g2048',st);render();
      const k=g.R()<0.5?'bomb':'swap';st.pw[k]=(st.pw[k]||0)+1;gSave('g2048',st);
      finishLevel(Game2048,st,g.level,s,{max:maxTile()},'وصلت إلى '+g.target+'!',`${g.moves} حركة · تراجع ${g.undos} · تلميحات ${g.hints} · كسبت ${k==='bomb'?'💣 قنبلة':'🔄 تبديل'}`);return}
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
  // powers: a bomb clears one tile, a swap exchanges two; earned by winning levels
  function usePower(i){
    const v=g.cells[i];if(g.power==='bomb'){if(v<=0){toast('اختر جِرماً لتفجيره');return}g.cells[i]=0;st.pw.bomb--;g.power=null;snd('err');buzz(40);toast('💣 تفجّر '+v);gSave('g2048',st);render();persist();return}
    if(v<=0){toast('اختر جِرماً');return}
    if(g.pick==null){g.pick=i;boardEl.children[i].classList.add('pick');snd('tap');return}
    if(g.pick===i){g.pick=null;render();return}
    const a=g.pick;[g.cells[a],g.cells[i]]=[g.cells[i],g.cells[a]];g.pick=null;g.power=null;st.pw.swap--;gSave('g2048',st);snd('rot');render();persist();toast('🔄 تم التبديل')}
  function setPower(k){if(g.over||!st.pw[k])return;g.power=g.power===k?null:k;g.pick=null;render();if(g.power)toast(k==='bomb'?'💣 اضغط الجِرم الذي تريد تفجيره':'🔄 اضغط جِرمين لتبديلهما')}
  function startTimed(){clearOverlays();clearInterval(tick);setStats([['s1','الوقت المتبقي'],['s2','النقاط','gold'],['s3','أكبر جِرم'],['s4','أفضل نتيجة']]);const R0=rng(Date.now()%100000);g={level:0,n:4,target:0,cells:new Array(16).fill(0),base:0,R:R0,moves:0,undos:0,hints:0,hist:[],over:false,timed:true,tleft:120,score:0};spawn();spawn();
    boardEl.innerHTML='';render();toast('⏱️ دقيقتان: اجمع أكبر نقاط بالدمج');
    tick=setInterval(()=>{if(document.hidden||gPaused||g.over||!g.timed)return;g.tleft--;setStat('s1','⏱️ '+fmtTime(g.tleft));if(g.tleft<=10&&g.tleft>0)snd('tap');if(g.tleft<=0)endTimed('انتهى الوقت')},1000)}
  function endTimed(why){if(g.over)return;g.over=true;clearInterval(tick);const rec=g.score>(st.timeBest||0);if(rec)st.timeBest=g.score;gSave('g2048',st);render();
    if(rec&&g.score>0){snd('win');buzz([20,30,60])}else snd('err');
    const o=document.createElement('div');o.className='overlay';o.innerHTML='<h3></h3><p></p><button class="btn main" type="button">جولة جديدة</button><button class="btn" type="button">رجوع إلى المستويات</button>';
    o.querySelector('h3').textContent=rec?'رقم قياسي جديد! 🏆':why;o.querySelector('p').textContent=`نقاطك ${g.score} · أكبر جِرم ${maxTile()} · أفضل نتيجة ${st.timeBest||0}`;
    const [b1,b2]=o.querySelectorAll('button');b1.onclick=()=>startTimed();b2.onclick=()=>play(st.level);setTimeout(()=>stage.appendChild(o),300)}
  function play(level,fresh){
    clearInterval(tick);setStats([['s1','المستوى'],['s2','الهدف','gold'],['s3','أكبر رقم'],['s4','حركات']]);
    clearOverlays();st=gState('g2048',{cur:null,pw:{bomb:2,swap:2}});st.pw=st.pw||{bomb:2,swap:2};
    if(mode&&mode.daily)build(3,mode.seed);
    else if(!fresh&&st.cur&&st.cur.level===level){const c=st.cur;g=Object.assign({},c,{cells:c.cells.slice(),R:rng(c.base+c.moves*7919+1),hist:[],over:false})}
    else build(level);
    boardEl.innerHTML='';render();persist();
  }
  return {id:'g2048',name:'2048',desc:'ادمج الأجرام: من صخرة إلى كوكب إلى نجم',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="5" y="5" width="18" height="18" rx="4" fill="#3fbf9b"/><rect x="25" y="5" width="18" height="18" rx="4" fill="#25474a"/><rect x="5" y="25" width="18" height="18" rx="4" fill="#25474a"/><rect x="25" y="25" width="18" height="18" rx="4" fill="#f2b84b"/><text x="14" y="18" font-size="10" font-weight="700" fill="#062019" font-family="sans-serif" text-anchor="middle">2</text><text x="34" y="38" font-size="8" font-weight="700" fill="#2a1c00" font-family="sans-serif" text-anchor="middle">2048</text></svg>',
    help:'اسحب بإصبعك يميناً أو يساراً أو لأعلى أو لأسفل، فتتحرك كل المربعات، وكل مربعين متساويين يندمجان في مربع واحد. الهدف يكبر مع المستويات، ومن المستوى 6 تصبح اللوحة 5×5 وفيها صخور ثابتة. «تلميح» يقترح أفضل اتجاه. «قنبلة» 💣 تفجّر جِرماً تختاره، و«تبديل» 🔄 يبادل مكان جِرمين، وتكسب قدرة جديدة مع كل مستوى تفوز به. «تحدي الوقت» ⏱️: دقيقتان لتجمع أكبر نقاط ممكنة بالدمج، ويُحفظ أفضل رقم لك.',
    progress(){const s=gState('g2048');return {level:s.level,stars:starTotal(s)}},
    start(){
      st=gState('g2048',{cur:null});setStats([['s1','المستوى'],['s2','الهدف','gold'],['s3','أكبر رقم'],['s4','حركات']]);
      boardEl=document.createElement('div');boardEl.className='b2048';stage.appendChild(boardEl);
      let sx=0,sy=0,act=false;
      boardEl.onpointerdown=e=>{sx=e.clientX;sy=e.clientY;act=true;try{boardEl.setPointerCapture(e.pointerId)}catch(_){}};
      boardEl.onpointerup=e=>{if(!act)return;act=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24){if(g.power){const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest('.t2');if(t)usePower([...boardEl.children].indexOf(t))}return}if(Math.abs(dx)>Math.abs(dy))move(dx<0?0:1);else move(dy<0?2:3)};
      boardEl.onpointercancel=()=>{act=false};
      document.addEventListener('keydown',this.key=e=>{const m={ArrowLeft:0,ArrowRight:1,ArrowUp:2,ArrowDown:3}[e.key];if(m!=null){e.preventDefault();move(m)}});
      ub=btn('تراجع',IC.undo,()=>{if(!g.hist.length||g.over)return;const h=g.hist.pop();g.cells=h.cells;g.moves=h.moves;g.undos++;snd('tap');render();persist()});
      btn('تلميح',IC.hint,()=>{if(g.over)return;let best=-1,bs=-Infinity;for(let d=0;d<4;d++){const r=slide(g.cells,g.n,d);if(!r.moved)continue;const sc=score(r.cells,g.n)+r.gain*0.5;if(sc>bs){bs=sc;best=d}}
        if(best<0)return;g.hints++;persist();snd('tap');toast('أفضل حركة الآن: '+DIRN[best])});
      btn('إعادة',IC.reset,()=>{if(g.timed)startTimed();else play(g.level,true)});
      bombB=btn('قنبلة',null,()=>setPower('bomb'));bombB.insertAdjacentHTML('afterbegin','<span aria-hidden="true">💣</span>');
      swapB=btn('تبديل',null,()=>setPower('swap'));swapB.insertAdjacentHTML('afterbegin','<span aria-hidden="true">🔄</span>');
      timeB=btn('تحدي الوقت',null,()=>{if(g.timed)play(st.level);else startTimed()});timeB.insertAdjacentHTML('afterbegin','<span aria-hidden="true">⏱️</span>');timeB.style.flexBasis='100%';
      this.rs=()=>render();addEventListener('resize',this.rs);
      play(st.level);
    },
    stop(){clearInterval(tick);document.removeEventListener('keydown',this.key);removeEventListener('resize',this.rs)}};
})();
