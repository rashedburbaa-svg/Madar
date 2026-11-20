/* ================= game 6: 2048 ================= */
const Game2048=(()=>{
  const EMO2={2:'🪨',4:'🌑',8:'🌙',16:'🌍',32:'🪐',64:'⭐',128:'🌟',256:'☀️',512:'💫',1024:'🌌',2048:'🕳️',4096:'✨'};
  const PAL={2:['#2a3540','#e8f1ee'],4:['#2c3a52','#e8f1ee'],8:['#3b3a5e','#fff4c8'],16:['#173f72','#e6f5ff'],32:['#4a3420','#ffe9c4'],64:['#4a3d12','#fff1b8'],128:['#5c4a10','#fff3c0'],256:['#6a2a10','#ffe0b0'],512:['#123c5c','#d8f6ff'],1024:['#3a1f66','#f3e2ff'],2048:['#2a0d0d','#ffd28a'],4096:['#5a1250','#ffe0f6']};
  // celestial art for each tile value, drawn as inline SVG (100x100) sharing one set of gradients
  const DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
    '<radialGradient id="a2rock" cx="35%" cy="30%"><stop offset="0" stop-color="#b9b2aa"/><stop offset="1" stop-color="#4c4641"/></radialGradient>'+
    '<radialGradient id="a2moon" cx="35%" cy="30%"><stop offset="0" stop-color="#d9dde4"/><stop offset=".7" stop-color="#7d8594"/><stop offset="1" stop-color="#3d4350"/></radialGradient>'+
    '<radialGradient id="a2cres" cx="35%" cy="30%"><stop offset="0" stop-color="#fff6cf"/><stop offset="1" stop-color="#e8c25a"/></radialGradient>'+
    '<radialGradient id="a2earth" cx="35%" cy="30%"><stop offset="0" stop-color="#7fd0ff"/><stop offset=".75" stop-color="#2468c9"/><stop offset="1" stop-color="#0f2f6e"/></radialGradient>'+
    '<radialGradient id="a2sat" cx="35%" cy="30%"><stop offset="0" stop-color="#ffe4b5"/><stop offset=".75" stop-color="#d49a56"/><stop offset="1" stop-color="#7a4d22"/></radialGradient>'+
    '<radialGradient id="a2glow" cx="50%" cy="50%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#ffe27a" stop-opacity=".65"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient>'+
    '<radialGradient id="a2sun" cx="40%" cy="35%"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#ffb02e"/><stop offset="1" stop-color="#e2541b"/></radialGradient>'+
    '<radialGradient id="a2halo" cx="50%" cy="50%"><stop offset=".45" stop-color="#ff9a2e" stop-opacity=".7"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>'+
    '<radialGradient id="a2comet" cx="50%" cy="50%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#9fe8ff"/><stop offset="1" stop-color="#3aa0ff" stop-opacity="0"/></radialGradient>'+
    '<linearGradient id="a2tail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fe8ff" stop-opacity="0"/><stop offset="1" stop-color="#bff4ff" stop-opacity=".95"/></linearGradient>'+
    '<radialGradient id="a2gal" cx="50%" cy="50%"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#ffd1f4"/><stop offset="1" stop-color="#8a4dff" stop-opacity="0"/></radialGradient>'+
    '<radialGradient id="a2disk" cx="50%" cy="50%"><stop offset=".55" stop-color="#ffcf6b"/><stop offset=".8" stop-color="#ff6a2b"/><stop offset="1" stop-color="#ff3d1f" stop-opacity="0"/></radialGradient>'+
    '<radialGradient id="a2nova" cx="50%" cy="50%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#ffd0f0"/><stop offset=".6" stop-color="#ff6fa8" stop-opacity=".7"/><stop offset="1" stop-color="#7a3cff" stop-opacity="0"/></radialGradient>'+
    '</defs></svg>';
  const rays=(n,r1,r2,c,w)=>{let d='';for(let k=0;k<n;k++){const a=k*Math.PI*2/n;d+=`M${50+Math.cos(a)*r1} ${50+Math.sin(a)*r1}L${50+Math.cos(a)*r2} ${50+Math.sin(a)*r2}`}return `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`};
  const star=(n,R,r,f)=>{let d='';for(let k=0;k<n*2;k++){const a=k*Math.PI/n-Math.PI/2,q=k%2?r:R;d+=(k?'L':'M')+(50+Math.cos(a)*q).toFixed(1)+' '+(50+Math.sin(a)*q).toFixed(1)}return `<path d="${d}Z" fill="${f}"/>`};
  const ART={
    2:'<path d="M28 38 L46 22 L70 28 L80 50 L70 74 L44 80 L24 64 Z" fill="url(#a2rock)"/><circle cx="48" cy="44" r="6" fill="#5a534d" opacity=".7"/><circle cx="62" cy="62" r="4" fill="#5a534d" opacity=".6"/><circle cx="38" cy="62" r="3" fill="#5a534d" opacity=".5"/>',
    4:'<circle cx="50" cy="50" r="32" fill="url(#a2moon)"/><circle cx="40" cy="40" r="7" fill="#5c6372" opacity=".55"/><circle cx="60" cy="58" r="9" fill="#5c6372" opacity=".5"/><circle cx="42" cy="64" r="4" fill="#5c6372" opacity=".5"/><circle cx="64" cy="36" r="4" fill="#5c6372" opacity=".45"/>',
    8:'<path d="M60 18 A33 33 0 1 0 60 82 A26 26 0 1 1 60 18 Z" fill="url(#a2cres)"/><circle cx="36" cy="44" r="4" fill="#d9b24f" opacity=".6"/><circle cx="34" cy="62" r="3" fill="#d9b24f" opacity=".5"/>',
    16:'<circle cx="50" cy="50" r="32" fill="url(#a2earth)"/><path d="M30 38 C38 30 48 34 46 42 C44 50 36 48 34 56 C32 62 24 54 24 48 Z M56 26 C64 26 72 34 70 40 C66 44 58 38 56 32 Z M54 56 C62 52 74 58 72 66 C68 74 58 76 54 70 C50 64 50 60 54 56 Z" fill="#4fc46a"/><ellipse cx="40" cy="36" rx="12" ry="5" fill="#fff" opacity=".35" transform="rotate(-25 40 36)"/>',
    32:'<path d="M14 58 A38 12 -18 0 1 86 42" stroke="#e8c690" stroke-width="5" fill="none" opacity=".55"/><circle cx="50" cy="50" r="26" fill="url(#a2sat)"/><path d="M27 44 Q50 38 73 46 M26 54 Q50 48 74 56" stroke="#b07a3e" stroke-width="3" fill="none" opacity=".5"/><path d="M86 42 A38 12 -18 0 1 14 58" stroke="#f3dcb0" stroke-width="5" fill="none"/>',
    64:'<circle cx="50" cy="50" r="40" fill="url(#a2glow)"/>'+star(4,40,9,'#fff3c4')+'<circle cx="50" cy="50" r="9" fill="#fff"/>',
    128:'<circle cx="50" cy="50" r="44" fill="url(#a2glow)"/>'+star(8,42,12,'#ffe58a')+star(4,30,8,'#fff')+'<circle cx="50" cy="50" r="8" fill="#fff"/>',
    256:'<circle cx="50" cy="50" r="46" fill="url(#a2halo)"/>'+rays(12,34,44,'#ffcf5a',4)+'<circle cx="50" cy="50" r="28" fill="url(#a2sun)"/><circle cx="42" cy="42" r="5" fill="#fff6c8" opacity=".55"/>',
    512:'<path d="M12 12 L56 46 L46 56 Z" fill="url(#a2tail)"/><path d="M22 8 L58 44 L52 50 Z" fill="url(#a2tail)" opacity=".6"/><circle cx="58" cy="58" r="24" fill="url(#a2comet)"/><circle cx="58" cy="58" r="8" fill="#fff"/>',
    1024:'<circle cx="50" cy="50" r="44" fill="url(#a2gal)" opacity=".7"/><path d="M50 50 C50 30 76 30 78 48 C80 64 62 74 50 68 M50 50 C50 70 24 70 22 52 C20 36 38 26 50 32" stroke="#e8c8ff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/><path d="M50 50 C56 40 70 42 70 52 M50 50 C44 60 30 58 30 48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="7" fill="#fff"/>',
    2048:'<ellipse cx="50" cy="50" rx="46" ry="16" fill="url(#a2disk)" transform="rotate(-16 50 50)"/><circle cx="50" cy="50" r="22" fill="#ff8a3d" opacity=".45"/><circle cx="50" cy="50" r="19" fill="#05030a"/><path d="M8 56 A46 16 -16 0 0 92 44" stroke="#ffe0a0" stroke-width="5" fill="none" transform="rotate(0 50 50)" opacity=".9"/>',
    4096:'<circle cx="50" cy="50" r="46" fill="url(#a2nova)"/>'+rays(16,22,46,'#ffd6f2',3)+star(6,30,12,'#fff')
  };
  const artFor=v=>ART[v]||ART[4096];
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
    const n=g.n;boardEl.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`;boardEl.style.gridTemplateRows=`repeat(${n},minmax(0,1fr))`;
    if(boardEl.children.length!==n*n){boardEl.innerHTML='';for(let i=0;i<n*n;i++)boardEl.appendChild(document.createElement('div'))}
    const w=(boardEl.clientWidth||320)/n;
    g.cells.forEach((v,i)=>{const d=boardEl.children[i];d.className='t2'+(v===-1?' rock':'')+(i===news?' new':'')+(merged&&merged.includes(i)?' mrg':'');
      if(v>0){const p=PAL[v]||PAL[4096],dg=String(v).length;d.style.background=`radial-gradient(circle at 50% 38%,${p[0]}ee,#0a0f1c 92%)`;d.style.color=p[1];d.style.setProperty('--tg',p[1]);
        if(d.dataset.v!=String(v)){d.innerHTML='<svg class="art" viewBox="0 0 100 100" aria-hidden="true">'+artFor(v)+'</svg><b>'+v+'</b>';d.dataset.v=v}d.style.fontSize=Math.round(w*(dg<=2?.3:dg===3?.25:.2))+'px';d.classList.toggle('hot',v>=128)}
      else if(v===-1){d.style.background='';d.style.color='';if(d.dataset.v!=='r'){d.innerHTML='<svg class="art boulder" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 42 L38 16 L68 20 L86 44 L80 76 L50 88 L20 74 Z" fill="#5a504a"/><path d="M18 42 L38 16 L68 20 L86 44 L60 46 L36 56 Z" fill="#7a6e66"/><circle cx="58" cy="64" r="8" fill="#3e3632"/><circle cx="36" cy="68" r="4" fill="#3e3632"/></svg>';d.dataset.v='r'}}
      else{d.style.background='';d.style.color='';d.textContent='';delete d.dataset.v}});
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
      boardEl=document.createElement('div');boardEl.className='b2048';stage.appendChild(boardEl);if(!document.getElementById('a2rock'))document.body.insertAdjacentHTML('beforeend',DEFS);
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
