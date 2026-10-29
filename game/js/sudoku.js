/* ================= game 2: sudoku ================= */
const SudokuGame=(()=>{
  // 9×9 with 3×3 boxes, plus a 6×6 beginner board with 2×3 boxes
  const DIFFS={mini:['مبتدئ 6×6',null],auto:['تلقائي',null],easy:['سهل',42],medium:['متوسط',34],hard:['صعب',28],expert:['خبير',24]},ORDER=['auto','mini','easy','medium','hard','expert'];
  let st,p,boardEl,padEl,afEl,ub,filling=false,sel=-1,notesMode=false,nb2,db,timer=0,hist=[];
  const geo=n=>n===6?{n:6,br:2,bc:3}:{n:9,br:3,bc:3};
  const PC={};
  function peersOf(n,i){const key=n+':'+i;if(PC[key])return PC[key];const {br,bc}=geo(n),r=(i/n)|0,c=i%n,r0=r-r%br,c0=c-c%bc,o=[];
    for(let k=0;k<n;k++){o.push(r*n+k,k*n+c,(r0+((k/bc)|0))*n+c0+k%bc)}return PC[key]=o}
  const peers=i=>peersOf(p.n||9,i);
  function solve(b,n,limit,R){
    const {br,bc}=geo(n),N2=n*n,full=((1<<(n+1))-2),rows=new Array(n).fill(0),cols=new Array(n).fill(0),box=new Array(n).fill(0);let count=0;
    const bx=(r,c)=>((r/br)|0)*(n/bc)+((c/bc)|0);
    for(let i=0;i<N2;i++)if(b[i]){const r=(i/n)|0,c=i%n,m=1<<b[i];rows[r]|=m;cols[c]|=m;box[bx(r,c)]|=m}
    (function rec(){let best=-1,bm=0,bn=n+1;
      for(let i=0;i<N2;i++)if(!b[i]){const r=(i/n)|0,c=i%n,m=~(rows[r]|cols[c]|box[bx(r,c)])&full;let k=0;for(let d=1;d<=n;d++)if(m&(1<<d))k++;if(k<bn){bn=k;best=i;bm=m;if(!k)return}}
      if(best<0){count++;return}
      const r=(best/n)|0,c=best%n,bi=bx(r,c);let ds=[...Array(n)].map((_,k)=>k+1);if(R)ds=shuffle(ds,R);
      for(const d of ds){if(!(bm&(1<<d)))continue;const m=1<<d;b[best]=d;rows[r]|=m;cols[c]|=m;box[bi]|=m;rec();if(count>=limit)return;b[best]=0;rows[r]&=~m;cols[c]&=~m;box[bi]&=~m}
    })();return count}
  function generate(level,diff,seed){
    const n=diff==='mini'?6:9,N2=n*n,R=rng(seed??(level*1013+ORDER.indexOf(diff)*7+77)),full=new Array(N2).fill(0);solve(full,n,1,R);
    const target=n===6?Math.max(12,18-Math.floor(level/4)):(DIFFS[diff][1]??Math.max(24,44-level)),puz=full.slice(),order=shuffle([...Array(N2).keys()],R);let clues=N2;
    for(const i of order){if(clues<=target)break;const k=puz[i];puz[i]=0;if(solve(puz.slice(),n,2)!==1)puz[i]=k;else clues--}
    return {level,diff,n,sol:full,giv:puz,cur:puz.slice(),notes:new Array(N2).fill(0),mistakes:0,hints:0,time:0,daily:mode&&mode.daily?mode.key:0};
  }
  function persist(){if(mode&&mode.daily){st.dailyCur=p}else st.cur=p;gSave('sudoku',st)}
  function layout(){
    const n=p.n,N2=n*n;boardEl.className='sboard'+(n===6?' s6':'');padEl.className='pad'+(n===6?' p6':'');
    if(boardEl.children.length!==N2){boardEl.innerHTML='';for(let i=0;i<N2;i++){const c=document.createElement('button');c.type='button';c.dataset.i=i;boardEl.appendChild(c)}}
    if(padEl.children.length!==n){padEl.innerHTML='';for(let d=1;d<=n;d++){const b=document.createElement('button');b.type='button';b.innerHTML=d+'<small></small>';b.onclick=()=>put(d);padEl.appendChild(b)}}
  }
  function render(){
    const n=p.n,N2=n*n,{br,bc}=geo(n),cells=boardEl.children,sv=sel>=0?p.cur[sel]:0,pr=sel>=0?new Set(peers(sel)):new Set();
    // a wrong digit lights up the cells it collides with
    const clash=new Set();for(let i=0;i<N2;i++){const v=p.cur[i];if(v&&v!==p.sol[i])peers(i).forEach(j=>{if(j!==i&&p.cur[j]===v)clash.add(j)})}
    for(let i=0;i<N2;i++){const c=cells[i],v=p.cur[i],r=(i/n)|0,col=i%n;
      c.className='sc'+(p.giv[i]?' g':'')+((col%bc===bc-1&&col<n-1)?' bR':'')+((r%br===br-1&&r<n-1)?' bB':'')+(pr.has(i)?' peer':'')+(sv&&v===sv?' same':'')+(i===sel?' sel':'')+(v&&v!==p.sol[i]?' bad':'')+(clash.has(i)?' clash':'');
      if(v)c.textContent=v;else if(p.notes[i]){c.innerHTML='<div class="notes">'+[...Array(n)].map((_,k)=>`<span>${p.notes[i]&(1<<(k+1))?k+1:''}</span>`).join('')+'</div>'}else c.textContent=''}
    const cnt=new Array(n+1).fill(0);p.cur.forEach((v,i)=>{if(v&&v===p.sol[i])cnt[v]++});
    [...padEl.children].forEach((b,k)=>{const left=n-cnt[k+1];b.disabled=left<=0;b.lastChild.textContent=left>0?left:''});
    setStat('s1',mode&&mode.daily?'اليوم':p.level);setStat('s2',fmtTime(p.time));setStat('s3',p.mistakes);setStat('s4',st.hints);
    // when every unsolved cell needs the same digit, offer to fill them all at once
    const left=[];for(let i=0;i<N2;i++)if(p.cur[i]!==p.sol[i])left.push(i);
    const one=!p.over&&!filling&&left.length>0&&left.every(i=>p.sol[i]===p.sol[left[0]]);
    afEl.hidden=!one;if(one)afEl.lastChild.textContent=`تعبئة تلقائية: الرقم ${p.sol[left[0]]} في ${left.length===1?'خانة واحدة':left.length===2?'خانتين':left.length+' خانات'}`;
    nb2.classList.toggle('on',notesMode);ub.disabled=!hist.length||p.over;db.lastChild.textContent='الصعوبة: '+DIFFS[st.diff][0];db.disabled=!!(mode&&mode.daily);
  }
  const snap=()=>{hist.push({cur:p.cur.slice(),notes:p.notes.slice()});if(hist.length>150)hist.shift()};
  function undo(){if(!hist.length||p.over||filling)return;const h=hist.pop();p.cur=h.cur;p.notes=h.notes;snd('rot');render();persist()}
  function put(d){
    if(sel<0||p.giv[sel]||p.over||filling)return;
    if(notesMode&&d){if(p.cur[sel])return;snap();p.notes[sel]^=(1<<d);snd('tap');render();persist();return}
    if(!d){if(!p.cur[sel]&&!p.notes[sel])return;snap();p.cur[sel]=0;p.notes[sel]=0;snd('tap');render();persist();return}
    if(p.cur[sel]===d)return;snap();p.cur[sel]=d;p.notes[sel]=0;
    if(d!==p.sol[sel]){p.mistakes++;snd('err');buzz(60);toast('رقم غير صحيح · الخانات المتعارضة باللون الأحمر')}else{snd('ok');buzz(8);peers(sel).forEach(j=>{p.notes[j]&=~(1<<d)})}
    render();persist();
    if(p.cur.every((v,i)=>v===p.sol[i]))finish();
  }
  function autoFill(){
    if(filling||p.over)return;const left=[];for(let i=0;i<p.cur.length;i++)if(p.cur[i]!==p.sol[i])left.push(i);if(!left.length)return;
    filling=true;afEl.hidden=true;let k=0;
    const stepF=()=>{if(!boardEl.isConnected){filling=false;return}const i=left[k++];p.cur[i]=p.sol[i];p.notes[i]=0;sel=i;snd('ok');buzz(8);render();
      if(k<left.length)setTimeout(stepF,140);else{filling=false;persist();if(p.cur.every((v,j)=>v===p.sol[j]))finish()}};
    stepF()}
  function finish(){p.over=true;clearInterval(timer);const s=p.mistakes===0&&p.hints===0?3:p.mistakes+p.hints<=2?2:1;const daily=mode&&mode.daily;
    const earned=!daily&&p.level%2===0;if(earned)st.hints++;
    const key=daily?'daily':p.diff;const prevBest=st.bestTime[key];const rec=!prevBest||p.time<prevBest;if(rec)st.bestTime[key]=Math.floor(p.time);
    st.solved=st.solved||{};st.solved[key]=(st.solved[key]||0)+1;if(p.mistakes===0&&p.hints===0)st.clean=(st.clean||0)+1;
    if(daily)st.dailyCur=null;else st.cur=null;gSave('sudoku',st);render();
    finishLevel(SudokuGame,st,p.level,s,{clean:p.mistakes===0&&p.hints===0,time:p.time},rec?'رقم قياسي!':'أحسنت!',`الوقت ${fmtTime(p.time)}`+(prevBest&&!rec?` · الأفضل ${fmtTime(prevBest)}`:'')+` · أخطاء ${p.mistakes}`+(earned?' · كسبت تلميحاً':''))}
  function showStats(){
    clearOverlays();const o=document.createElement('div');o.className='overlay picker';
    const rows=[...ORDER,'daily'].map(k=>{const nm=k==='daily'?'تحدي اليوم':DIFFS[k][0],b=st.bestTime[k],c=(st.solved||{})[k]||0;
      return `<tr><td>${nm}</td><td>${c}</td><td>${b?fmtTime(b):'—'}</td></tr>`}).join('');
    const total=Object.values(st.solved||{}).reduce((a,b)=>a+b,0);
    o.innerHTML=`<h3 style="font-size:24px">📊 إحصائياتك</h3><p>${total} لغز محلول · ${st.clean||0} بلا أخطاء ولا تلميحات</p><table class="stab"><thead><tr><th>الصعوبة</th><th>محلول</th><th>أفضل وقت</th></tr></thead><tbody>${rows}</tbody></table><button class="btn main" type="button">إغلاق</button>`;
    o.querySelector('.btn').onclick=()=>o.remove();stage.appendChild(o)}
  function play(level,fresh){
    clearOverlays();clearInterval(timer);filling=false;hist=[];st=gState('sudoku',{hints:3,cur:null,dailyCur:null,diff:'auto',bestTime:{},solved:{}});
    if(!DIFFS[st.diff])st.diff='auto';
    if(mode&&mode.daily){p=st.dailyCur&&st.dailyCur.daily===mode.key&&!st.dailyCur.over?st.dailyCur:generate(16,'medium',mode.seed);p.level=16}
    else if(!fresh&&st.cur&&st.cur.level===level&&st.cur.diff===st.diff&&!st.cur.over)p=st.cur;
    else p=generate(level,st.diff);
    p.n=p.n||9;layout();persist();sel=p.cur.findIndex(v=>!v);notesMode=false;render();
    timer=setInterval(()=>{if(document.hidden||p.over)return;p.time+=1;setStat('s2',fmtTime(p.time));if(Math.floor(p.time)%5===0)persist()},1000);
  }
  return {id:'sudoku',name:'سودوكو',desc:'شبكة النجوم: املأ 1-9 بدون تكرار',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="5" fill="none" stroke="#3a5853" stroke-width="2.5"/><path d="M18 6v36M30 6v36M6 18h36M6 30h36" stroke="#3a5853" stroke-width="2"/><text x="12" y="16" font-size="9" fill="#e8f1ee" font-family="sans-serif" text-anchor="middle">5</text><text x="24" y="28" font-size="9" fill="#3fbf9b" font-family="sans-serif" text-anchor="middle">3</text><text x="36" y="40" font-size="9" fill="#f2b84b" font-family="sans-serif" text-anchor="middle">9</text></svg>',
    help:'كل صف وعمود ومربع يحتوي كل الأرقام مرة واحدة. اضغط خانة ثم رقماً. الرقم الخاطئ يظهر بالأحمر مع الخانات التي يتعارض معها. «تراجع» يلغي آخر خطوة. «ملاحظات» لكتابة الاحتمالات بنفسك، و«احتمالات» يكتبها كلها تلقائياً. عندما يتبقى رقم واحد فقط يظهر زر «تعبئة تلقائية». «الصعوبة» تختار بين التلقائي، ولوحة المبتدئ 6×6 (أرقام 1-6 ومربعات 2×3)، أو مستوى ثابت. «إحصائيات» تعرض أفضل أوقاتك وعدد ما حللته.',
    progress(){const s=gState('sudoku',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('sudoku',{hints:3,cur:null,dailyCur:null,diff:'auto',bestTime:{},solved:{}});setStats([['s1','المستوى'],['s2','الوقت','gold'],['s3','أخطاء'],['s4','تلميحات']]);
      boardEl=document.createElement('div');boardEl.className='sboard';
      boardEl.onclick=e=>{const c=e.target.closest('button');if(!c)return;sel=+c.dataset.i;snd('tap');render()};
      padEl=document.createElement('div');padEl.className='pad';
      afEl=document.createElement('button');afEl.type='button';afEl.className='btn main autofill';afEl.hidden=true;afEl.innerHTML='<span aria-hidden="true">✨</span><span></span>';afEl.onclick=autoFill;
      stage.append(boardEl,afEl,padEl);
      btn('مسح',IC.erase,()=>put(0));ub=btn('تراجع',IC.undo,undo);nb2=btn('ملاحظات',IC.pen,()=>{notesMode=!notesMode;render()});
      btn('تلميح',IC.hint,()=>{if(!st.hints||p.over)return;let i=sel>=0&&p.cur[sel]!==p.sol[sel]?sel:p.cur.findIndex((v,j)=>v!==p.sol[j]);if(i<0)return;
        st.hints--;p.hints++;sel=i;const m=notesMode;notesMode=false;p.cur[i]=0;put(p.sol[i]);notesMode=m;gSave('sudoku',st);render()});
      btn('احتمالات',IC.list,()=>{if(p.over)return;snap();const n=p.n;for(let i=0;i<n*n;i++){if(p.cur[i])continue;const used=new Set(peers(i).map(j=>p.cur[j]).filter(v=>v));let m=0;for(let d=1;d<=n;d++)if(!used.has(d))m|=1<<d;p.notes[i]=m}
        snd('ok');render();persist();toast('كُتبت الاحتمالات في كل الخانات الفارغة')});
      btn('إحصائيات',IC.gauge,showStats);
      db=btn('الصعوبة',IC.gauge,()=>{if(mode&&mode.daily)return;st.diff=ORDER[(ORDER.indexOf(st.diff)+1)%ORDER.length];st.cur=null;gSave('sudoku',st);toast('الصعوبة: '+DIFFS[st.diff][0]);play(p.level,true)});
      db.style.flexBasis='100%';
      document.addEventListener('keydown',this.key=e=>{const k=+e.key;if(k>=1&&k<=(p?p.n:9))put(k);if(e.key==='Backspace'||e.key==='Delete')put(0);if((e.ctrlKey||e.metaKey)&&e.key==='z')undo()});
      setTimeout(()=>play(st.level),20)},
    stop(){clearInterval(timer);if(p&&!p.over)persist();document.removeEventListener('keydown',this.key)}};
})();
