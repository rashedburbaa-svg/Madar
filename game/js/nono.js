/* ================= game 8: nonogram ================= */
const NonoGame=(()=>{
  let st,g,boardEl,fillB,xB,drag=null,timer=0,paint=1;
  const sizeFor=l=>[5,5,6,6,7,7,8,8,9][l-1]||10;
  const runs=a=>{const r=[];let k=0;a.forEach(v=>{if(v===1)k++;else if(k){r.push(k);k=0}});if(k)r.push(k);return r.length?r:[0]};
  const PC={};
  // hand-drawn pictures (each checked to be solvable by logic alone); filled cells take these colours when solved
  const PICS={"قلب":[".R.R.","RRRRR","RRRRR",".RRR.","..R.."],"نجمة":["..Y..",".YYY.","YYYYY",".YYY.",".Y.Y."],"هلال":[".YYY.","YY...","Y....","YY...",".YYY."],"صاروخ صغير":["..W..",".WWW.",".WBW.","WWWWW",".R.R."],"كائن فضائي":["G....G",".GGGG.","G.GG.G","GGGGGG",".GGGG.",".G..G."],"زحل":["......","..OO..",".OOOO.","YYYYYY",".OOOO.","..OO.."],"صحن طائر":["......","..CC..",".CCCC.","KKKKKK",".YKKY.","..YY.."],"نخلة":["D.DDD.D",".DDDDD.","DD.N.DD","...N...","...N...","..NNN..","SSSSSSS"],"صاروخ":["...W...","..WWW..","..WBW..","..WWW..",".RWWWR.",".R.W.R.","..YOY.."],"نجم لامع":["...Y...","...Y...","YYYYYYY",".YYYYY.","..YYY..",".YY.YY.","YY...YY"],"الأرض":["..BBB..",".BGGBB.","BGGGBBB","BBGBBGB","BBBBGGB",".BBBGB.","..BBB.."],"قلب كبير":[".RR.RR.","RRRRRRR","RRRRRRR","RRRRRRR",".RRRRR.","..RRR..","...R..."],"سفينة بوم":["...W....","...WW...","...WWW..","...WWWW.","...N....","NNNNNNNN",".NNNNNN.","BBBBBBBB"],"رائد فضاء":["..WWWW..",".WWWWWW.",".WOOOOW.",".WOOOOW.","..WWWW..",".WWWWWW.","W.WWWW.W","..W..W.."],"أبراج الكويت":["...B....","..BBB...","..BBB...","...K..B.","...K.BBB","...K..K.","...K..K.","SSSSSSSS"],"فنجان قهوة":["..W.W.W.","...W.W..","NNNNNNN.","NNNNNNNN","NNNNNN.N","NNNNNNNN",".NNNNN..","WWWWWWW."],"كوكب زحل":[".........","...OOO...","..OOOOO..",".OOOOOOO.","YYYYYYYYY",".OOOOOOO.","..OOOOO..","...OOO...","........."],"وجه فضائي":[".G.....G.","..G...G..","..GGGGG..",".GGGGGGG.","GG..G..GG","GGGGGGGGG",".GGGGGGG.",".GG...GG.","..GGGGG.."],"صاروخ كبير":["....R....","...RRR...","...WWW...","..WWBWW..","..WWWWW..","..WWWWW..",".RWWWWWR.","RR.WWW.RR","...OYO..."],"نجمة كبيرة":["....YY....","....YY....","...YYYY...","YYYYYYYYYY",".YYYYYYYY.","..YYYYYY..","..YYYYYY..",".YYY..YYY.",".YY....YY.","YY......YY"],"جمل":["..........",".......NN.","......NNNN","..NN..NN..",".NNNNNNN..","NNNNNNNN..","N.NNNNNN..","..N....N..","..N....N..","..N....N.."]};
  const PCOL={R:'#ff5d73',O:'#ff9a3c',Y:'#ffd34d',G:'#7ddc5a',D:'#3f9a4a',B:'#4aa8ff',C:'#7fe8ff',W:'#eef3f7',K:'#8a96a6',N:'#b07a48',S:'#e3c48a'};
  const PNAMES=Object.keys(PICS);
  function placements(len,clue){
    const key=len+':'+clue.join(',');if(PC[key])return PC[key];const out=[];
    if(clue.length===1&&clue[0]===0)out.push(new Array(len).fill(0));
    else(function rec(idx,pos,arr){
      if(idx===clue.length){const a=arr.slice();for(let k=pos;k<len;k++)a[k]=0;out.push(a);return}
      let rest=0;for(let j=idx+1;j<clue.length;j++)rest+=clue[j]+1;
      for(let s=pos;s+clue[idx]+rest<=len;s++){const a=arr.slice();for(let k=pos;k<s;k++)a[k]=0;for(let k=0;k<clue[idx];k++)a[s+k]=1;let nx=s+clue[idx];if(idx<clue.length-1){a[nx]=0;nx++}rec(idx+1,nx,a)}
    })(0,0,new Array(len).fill(0));
    return PC[key]=out;
  }
  function solvable(sol,n,rc,cc){
    const K=new Array(n*n).fill(-1);let changed=true,guard=0;
    const lineIdx=(t,a)=>Array.from({length:n},(_,b)=>t?b*n+a:a*n+b);
    while(changed&&guard++<60){changed=false;
      for(let t=0;t<2;t++)for(let a=0;a<n;a++){const idx=lineIdx(t,a),kn=idx.map(i=>K[i]);
        const ps=placements(n,t?cc[a]:rc[a]).filter(p=>p.every((v,k)=>kn[k]===-1||kn[k]===v));if(!ps.length)return false;
        for(let k=0;k<n;k++){if(kn[k]!==-1)continue;const v=ps[0][k];if(ps.every(p=>p[k]===v)){K[idx[k]]=v;changed=true}}}}
    return K.every(v=>v!==-1);
  }
  function gen(level,seed){
    const R=rng(seed??level*3331+17),n=sizeFor(level);let sol,rc,cc;
    const cands=PNAMES.filter(k=>PICS[k].length===n);
    if(cands.length){const seen=mode&&mode.daily?[]:(st.pseen||[]),fresh=cands.filter(k=>!seen.includes(k)),pool=fresh.length?fresh:cands,name=pool[Math.floor(R()*pool.length)],rows=PICS[name];
      sol=rows.join('').split('').map(ch=>ch==='.'?0:1);rc=Array.from({length:n},(_,r)=>runs(sol.slice(r*n,r*n+n)));cc=Array.from({length:n},(_,c)=>runs(Array.from({length:n},(_,r)=>sol[r*n+c])));
      g={level,n,sol,rc,cc,pic:name,cur:new Array(n*n).fill(0),helps:0,miss:0,time:0,over:false};return}
    for(let at=0;at<80;at++){const dens=0.52+R()*0.12;sol=Array.from({length:n*n},()=>R()<dens?1:0);
      rc=Array.from({length:n},(_,r)=>runs(sol.slice(r*n,r*n+n)));cc=Array.from({length:n},(_,c)=>runs(Array.from({length:n},(_,r)=>sol[r*n+c])));
      if(solvable(sol,n,rc,cc))break}
    g={level,n,sol,rc,cc,cur:new Array(n*n).fill(0),helps:0,miss:0,time:0,over:false};
  }
  const rowOf=(i)=>g.cur.slice(((i/g.n)|0)*g.n,((i/g.n)|0)*g.n+g.n);
  const colOf=(c)=>Array.from({length:g.n},(_,r)=>g.cur[r*g.n+c]);
  const same=(a,b)=>a.length===b.length&&a.every((v,k)=>v===b[k]);
  function drawCell(i){const n=g.n,r=(i/n)|0,c=i%n,v=g.cur[i],el=g.cellEls[i];
    el.className='ncell'+(v===1?' f':v===2?' x':'')+(c%5===0&&c>0?' b5c':'')+(r%5===0&&r>0?' b5r':'')}
  // a row or column whose numbers are complete gets ✕ in its remaining cells (wrong fills are corrected on the spot, so a complete line is always right)
  function updClues(){const n=g.n,mark=[];
    for(let r=0;r<n;r++){const ok=same(runs(g.cur.slice(r*n,r*n+n).map(v=>v===1?1:0)),g.rc[r]);g.rowEls[r].classList.toggle('done',ok);if(ok)for(let c=0;c<n;c++)mark.push(r*n+c)}
    for(let c=0;c<n;c++){const ok=same(runs(colOf(c).map(v=>v===1?1:0)),g.cc[c]);g.colEls[c].classList.toggle('done',ok);if(ok)for(let r=0;r<n;r++)mark.push(r*n+c)}
    if(g.over)return;mark.forEach(i=>{if(g.cur[i]===0&&!g.sol[i]){g.cur[i]=2;drawCell(i);g.cellEls[i].classList.add('auto')}})}
  function stats(){setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.n+'×'+g.n);setStat('s3',(g.miss||0)+' من 3');setStat('s4',fmtTime(g.time));
    fillB.classList.toggle('on',paint===1);xB.classList.toggle('on',paint===2);fillB.setAttribute('aria-checked',paint===1);xB.setAttribute('aria-checked',paint===2)}
  function persist(){if(mode&&mode.daily)return;st.cur={level:g.level,n:g.n,sol:g.sol,rc:g.rc,cc:g.cc,pic:g.pic,cur:g.cur,helps:g.helps,miss:g.miss||0,time:g.time};gSave('nono',st)}
  function apply(i){if(drag.last===i)return;drag.last=i;if(g.cur[i]===drag.target)return;
    const wrongFill=drag.target===1&&!g.sol[i],wrongX=drag.target===2&&g.sol[i];
    if(wrongFill||wrongX){g.cur[i]=wrongFill?2:1;drawCell(i);const el=g.cellEls[i];el.classList.add('bad');setTimeout(()=>el.classList.remove('bad'),700);
      g.miss=(g.miss||0)+1;drag=null;snd('err');buzz([50,30,50]);updClues();stats();persist();
      if(g.miss>=3){g.over=true;clearInterval(timer);st.cur=null;gSave('nono',st);loseBox({title:'ثلاثة أخطاء',text:'ثلاث خانات في غير مكانها. تبدأ اللوحة من جديد!',onRetry:()=>play(g.level,true)})}
      else toast((wrongFill?'✕ هذه الخانة فارغة':'■ هذه الخانة من الصورة')+' · بقي لك '+(3-g.miss===1?'خطأ واحد':'خطآن'));return}
    g.cur[i]=drag.target;snd(drag.target===1?'tap':'flip');buzz(5);drawCell(i);updClues()}
  function checkWin(){
    const n=g.n;for(let r=0;r<n;r++)if(!same(runs(g.cur.slice(r*n,r*n+n).map(v=>v===1?1:0)),g.rc[r]))return;
    for(let c=0;c<n;c++)if(!same(runs(colOf(c).map(v=>v===1?1:0)),g.cc[c]))return;
    g.over=true;clearInterval(timer);g.cur=g.cur.map(v=>v===1?1:0);g.cellEls.forEach((_,i)=>drawCell(i));
    let title='اكتملت اللوحة!',extra='';
    if(g.pic&&PICS[g.pic]){const flat=PICS[g.pic].join('');boardEl.classList.add('reveal');g.cellEls.forEach((el,i)=>{const ch=flat[i];if(ch&&ch!=='.'){el.style.background=PCOL[ch];el.style.transitionDelay=(((i/g.n)|0)+i%g.n)*25+'ms'}});
      title='رسمت: '+g.pic+'!';if(!(mode&&mode.daily)){st.pseen=st.pseen||[];if(!st.pseen.includes(g.pic))st.pseen.push(g.pic)}extra=` · مجموعتك ${(st.pseen||[]).length}/${PNAMES.length} صورة`}
    const help=g.helps+(g.miss||0),s=help===0?3:help<=2?2:1,daily=mode&&mode.daily,earned=!daily&&g.level%3===0;if(earned)st.hints++;st.cur=null;gSave('nono',st);
    setTimeout(()=>finishLevel(NonoGame,st,g.level,s,{clean:help===0},title,`الوقت ${fmtTime(g.time)} · أخطاء ${g.miss||0} · مساعدات ${g.helps}`+extra+(earned?' · كسبت تلميحاً':'')),g.pic?1500:0);
  }
  function play(level,fresh){
    clearOverlays();clearInterval(timer);st=gState('nono',{hints:3,cur:null});
    if(mode&&mode.daily)gen(7,mode.seed);
    else if(!fresh&&st.cur&&st.cur.level===level)g=Object.assign({},st.cur,{cur:st.cur.cur.slice(),over:false});
    else gen(level);
    const n=g.n;boardEl.innerHTML='';boardEl.classList.remove('reveal');boardEl.style.gridTemplateColumns=`auto repeat(${n},minmax(0,1fr))`;
    boardEl.appendChild(document.createElement('div'));g.colEls=[];g.rowEls=[];g.cellEls=[];
    for(let c=0;c<n;c++){const d=document.createElement('div');d.className='nclue-c';d.innerHTML=g.cc[c].map(v=>`<span>${v}</span>`).join('');boardEl.appendChild(d);g.colEls.push(d)}
    for(let r=0;r<n;r++){const d=document.createElement('div');d.className='nclue-r';d.innerHTML=g.rc[r].map(v=>`<span>${v}</span>`).join('');boardEl.appendChild(d);g.rowEls.push(d);
      for(let c=0;c<n;c++){const b=document.createElement('button');b.type='button';b.dataset.i=r*n+c;b.setAttribute('aria-label','خانة');boardEl.appendChild(b);g.cellEls.push(b)}}
    g.cellEls.forEach((_,i)=>drawCell(i));updClues();stats();persist();
    timer=setInterval(()=>{if(document.hidden||gPaused||g.over)return;g.time++;setStat('s4',fmtTime(g.time));if(g.time%10===0)persist()},1000);
  }
  return {id:'nono',name:'نونوجرام',desc:'اكشف صوراً مخفية من الفضاء والكويت بالأرقام',play,
    icon:'<svg viewBox="0 0 48 48"><g fill="#3fbf9b"><rect x="14" y="14" width="8" height="8" rx="1.5"/><rect x="24" y="14" width="8" height="8" rx="1.5"/><rect x="34" y="24" width="8" height="8" rx="1.5"/><rect x="14" y="34" width="8" height="8" rx="1.5"/><rect x="24" y="24" width="8" height="8" rx="1.5"/></g><g fill="#1d373b"><rect x="34" y="14" width="8" height="8" rx="1.5"/><rect x="14" y="24" width="8" height="8" rx="1.5"/><rect x="24" y="34" width="8" height="8" rx="1.5"/><rect x="34" y="34" width="8" height="8" rx="1.5"/></g><g fill="#f2b84b" font-family="sans-serif" font-size="7" font-weight="700" text-anchor="middle"><text x="18" y="10">2</text><text x="28" y="10">1</text><text x="38" y="10">1</text><text x="8" y="21">2</text></g></svg>',
    help:'اختر من المفتاح فوق اللوحة: «صح» لتلوين خانات الصورة، أو «خطأ» لتحديد الخانات الفارغة بـ ✕. عندما تكتمل أرقام صف أو عمود تُوضع ✕ تلقائياً في باقي خاناته. إذا لوّنت خانة فارغة، أو وضعت ✕ على خانة من الصورة، تُصحَّح فوراً ويُحسب خطأ، والخطأ الثالث يعيد اللوحة من البداية. خلف كل لوحة صورة مرسومة (صاروخ، كوكب، نخلة، أبراج الكويت…) تظهر ملوّنة عندما تحلّها، وتُضاف إلى مجموعتك. الأرقام فوق كل عمود وبجانب كل صف تخبرك بأطوال المجموعات الملوّنة فيه بالترتيب، وبين كل مجموعتين فراغ واحد على الأقل. «تلوين» يلوّن الخانات، و«علامة ✕» تضع إشارة على الخانات الفارغة لتتذكرها. اسحب إصبعك لتلوين عدة خانات معاً. الرقم يبهت عندما يكتمل صفه أو عموده.',
    progress(){const s=gState('nono',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){
      st=gState('nono',{hints:3,cur:null});setStats([['s1','المستوى'],['s2','الحجم','gold'],['s3','أخطاء'],['s4','الوقت']]);paint=1;
      boardEl=document.createElement('div');boardEl.className='nono';stage.appendChild(boardEl);
      boardEl.onpointerdown=e=>{const c=e.target.closest('.ncell');if(!c||g.over)return;e.preventDefault();const i=+c.dataset.i;drag={target:g.cur[i]===paint?0:paint,last:-1};apply(i);try{boardEl.setPointerCapture(e.pointerId)}catch(_){}};
      boardEl.onpointermove=e=>{if(!drag)return;const el=document.elementFromPoint(e.clientX,e.clientY),c=el&&el.closest&&el.closest('.ncell');if(c&&boardEl.contains(c))apply(+c.dataset.i)};
      boardEl.onpointerup=boardEl.onpointercancel=()=>{if(!drag){if(g&&!g.over)checkWin();return}drag=null;persist();checkWin()};
      const sw=document.createElement('div');sw.className='nswitch';sw.setAttribute('role','radiogroup');sw.setAttribute('aria-label','نوع الوضع');
      sw.innerHTML='<button type="button" role="radio"><i class="sq"></i><span>صح: تلوين</span></button><button type="button" role="radio"><i class="xx">✕</i><span>خطأ: خانة فارغة</span></button>';
      [fillB,xB]=sw.children;fillB.onclick=()=>{paint=1;snd('tap');stats()};xB.onclick=()=>{paint=2;snd('tap');stats()};stage.insertBefore(sw,boardEl);
      btn('افحص',IC.check,()=>{if(g.over)return;const bad=g.cur.map((v,i)=>(v===1&&!g.sol[i])||(v===2&&g.sol[i])?i:-1).filter(i=>i>=0);
        g.helps++;stats();persist();snd(bad.length?'err':'ok');toast(bad.length?bad.length+' خانة خاطئة باللون الأحمر':'لا توجد أخطاء حتى الآن');
        bad.forEach(i=>g.cellEls[i].classList.add('bad'));setTimeout(()=>bad.forEach(i=>g.cellEls[i]&&g.cellEls[i].classList.remove('bad')),1600)});
      btn('تلميح',IC.hint,()=>{if(g.over)return;if(!st.hints){toast('لا توجد تلميحات. تكسب واحداً كل 3 مستويات');return}
        const want=i=>g.sol[i]?1:2,cand=g.cur.map((v,i)=>v!==want(i)&&(g.sol[i]||v===1)?i:-1).filter(i=>i>=0);if(!cand.length)return;
        const i=cand[Math.floor(Math.random()*cand.length)];g.cur[i]=want(i);st.hints--;g.helps++;gSave('nono',st);drawCell(i);updClues();stats();persist();snd('ok');
        g.cellEls[i].classList.add('hintflash');checkWin()});
      btn('إعادة',IC.reset,()=>play(g.level,true));
      play(st.level);
    },
    stop(){clearInterval(timer);if(g&&!g.over)persist()}};
})();
