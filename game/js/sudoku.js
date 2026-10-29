/* ================= game 2: sudoku ================= */
const SudokuGame=(()=>{
  const DIFFS={auto:['تلقائي',null],easy:['سهل',42],medium:['متوسط',34],hard:['صعب',28],expert:['خبير',24]},ORDER=['auto','easy','medium','hard','expert'];
  let st,p,boardEl,padEl,sel=-1,notesMode=false,nb2,db,timer=0;
  const peers=i=>{const r=(i/9)|0,c=i%9,br=r-r%3,bc=c-c%3,o=[];for(let k=0;k<9;k++){o.push(r*9+k,k*9+c,(br+((k/3)|0))*9+bc+k%3)}return o};
  function solve(b,limit,R){
    const rows=new Array(9).fill(0),cols=new Array(9).fill(0),box=new Array(9).fill(0);let count=0;
    for(let i=0;i<81;i++)if(b[i]){const r=(i/9)|0,c=i%9,m=1<<b[i];rows[r]|=m;cols[c]|=m;box[(r/3|0)*3+(c/3|0)]|=m}
    (function rec(){let best=-1,bm=0,bn=10;
      for(let i=0;i<81;i++)if(!b[i]){const r=(i/9)|0,c=i%9,m=~(rows[r]|cols[c]|box[(r/3|0)*3+(c/3|0)])&0x3FE;let n=0;for(let d=1;d<10;d++)if(m&(1<<d))n++;if(n<bn){bn=n;best=i;bm=m;if(!n)return}}
      if(best<0){count++;return}
      const r=(best/9)|0,c=best%9,bx=(r/3|0)*3+(c/3|0);let ds=[1,2,3,4,5,6,7,8,9];if(R)ds=shuffle(ds,R);
      for(const d of ds){if(!(bm&(1<<d)))continue;const m=1<<d;b[best]=d;rows[r]|=m;cols[c]|=m;box[bx]|=m;rec();if(count>=limit)return;b[best]=0;rows[r]&=~m;cols[c]&=~m;box[bx]&=~m}
    })();return count}
  function generate(level,diff,seed){
    const R=rng(seed??(level*1013+ORDER.indexOf(diff)*7+77)),full=new Array(81).fill(0);solve(full,1,R);
    const target=DIFFS[diff][1]??Math.max(24,44-level),puz=full.slice(),order=shuffle([...Array(81).keys()],R);let clues=81;
    for(const i of order){if(clues<=target)break;const k=puz[i];puz[i]=0;if(solve(puz.slice(),2)!==1)puz[i]=k;else clues--}
    return {level,diff,sol:full,giv:puz,cur:puz.slice(),notes:new Array(81).fill(0),mistakes:0,hints:0,time:0,daily:mode&&mode.daily?mode.key:0};
  }
  function persist(){if(mode&&mode.daily){st.dailyCur=p}else st.cur=p;gSave('sudoku',st)}
  function render(){
    const cells=boardEl.children,sv=sel>=0?p.cur[sel]:0,pr=sel>=0?new Set(peers(sel)):new Set();
    for(let i=0;i<81;i++){const c=cells[i],v=p.cur[i];
      c.className='sc'+(p.giv[i]?' g':'')+((i%9===2||i%9===5)?' bR':'')+((((i/9)|0)===2||((i/9)|0)===5)?' bB':'')+(pr.has(i)?' peer':'')+(sv&&v===sv?' same':'')+(i===sel?' sel':'')+(v&&v!==p.sol[i]?' bad':'');
      if(v)c.textContent=v;else if(p.notes[i]){c.innerHTML='<div class="notes">'+[1,2,3,4,5,6,7,8,9].map(d=>`<span>${p.notes[i]&(1<<d)?d:''}</span>`).join('')+'</div>'}else c.textContent=''}
    const cnt=new Array(10).fill(0);p.cur.forEach((v,i)=>{if(v&&v===p.sol[i])cnt[v]++});
    [...padEl.children].forEach((b,k)=>{const left=9-cnt[k+1];b.disabled=left<=0;b.lastChild.textContent=left>0?left:''});
    setStat('s1',mode&&mode.daily?'اليوم':p.level);setStat('s2',fmtTime(p.time));setStat('s3',p.mistakes);setStat('s4',st.hints);
    nb2.classList.toggle('on',notesMode);db.lastChild.textContent='الصعوبة: '+DIFFS[st.diff][0];db.disabled=!!(mode&&mode.daily);
  }
  function put(d){
    if(sel<0||p.giv[sel]||p.over)return;
    if(notesMode&&d){if(p.cur[sel])return;p.notes[sel]^=(1<<d);snd('tap');render();persist();return}
    if(!d){p.cur[sel]=0;p.notes[sel]=0;snd('tap');render();persist();return}
    p.cur[sel]=d;p.notes[sel]=0;
    if(d!==p.sol[sel]){p.mistakes++;snd('err');buzz(60);toast('رقم غير صحيح')}else{snd('ok');buzz(8);peers(sel).forEach(j=>{p.notes[j]&=~(1<<d)})}
    render();persist();
    if(p.cur.every((v,i)=>v===p.sol[i]))finish();
  }
  function finish(){p.over=true;clearInterval(timer);const s=p.mistakes===0&&p.hints===0?3:p.mistakes+p.hints<=2?2:1;const daily=mode&&mode.daily;
    const earned=!daily&&p.level%2===0;if(earned)st.hints++;
    const key=daily?'daily':st.diff;const prevBest=st.bestTime[key];const rec=!prevBest||p.time<prevBest;if(rec)st.bestTime[key]=Math.floor(p.time);
    if(daily)st.dailyCur=null;else st.cur=null;gSave('sudoku',st);
    finishLevel(SudokuGame,st,p.level,s,{clean:p.mistakes===0&&p.hints===0,time:p.time},rec?'رقم قياسي!':'أحسنت!',`الوقت ${fmtTime(p.time)}`+(prevBest&&!rec?` · الأفضل ${fmtTime(prevBest)}`:'')+` · أخطاء ${p.mistakes}`+(earned?' · كسبت تلميحاً':''))}
  function play(level,fresh){
    clearOverlays();clearInterval(timer);st=gState('sudoku',{hints:3,cur:null,dailyCur:null,diff:'auto',bestTime:{}});
    if(mode&&mode.daily){p=st.dailyCur&&st.dailyCur.daily===mode.key&&!st.dailyCur.over?st.dailyCur:generate(16,'medium',mode.seed);p.level=16}
    else if(!fresh&&st.cur&&st.cur.level===level&&st.cur.diff===st.diff&&!st.cur.over)p=st.cur;
    else p=generate(level,st.diff);
    persist();sel=p.cur.findIndex(v=>!v);notesMode=false;render();
    timer=setInterval(()=>{if(document.hidden||p.over)return;p.time+=1;setStat('s2',fmtTime(p.time));if(Math.floor(p.time)%5===0)persist()},1000);
  }
  return {id:'sudoku',name:'سودوكو',desc:'شبكة النجوم: املأ 1-9 بدون تكرار',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="5" fill="none" stroke="#3a5853" stroke-width="2.5"/><path d="M18 6v36M30 6v36M6 18h36M6 30h36" stroke="#3a5853" stroke-width="2"/><text x="12" y="16" font-size="9" fill="#e8f1ee" font-family="sans-serif" text-anchor="middle">5</text><text x="24" y="28" font-size="9" fill="#3fbf9b" font-family="sans-serif" text-anchor="middle">3</text><text x="36" y="40" font-size="9" fill="#f2b84b" font-family="sans-serif" text-anchor="middle">9</text></svg>',
    help:'كل صف وعمود ومربع 3×3 يحتوي الأرقام 1-9 مرة واحدة. اضغط خانة ثم رقماً. «ملاحظات» لكتابة الاحتمالات بنفسك، و«احتمالات» يكتبها كلها تلقائياً، وتُحذف وحدها كلما وضعت رقماً صحيحاً. «الصعوبة» تختار بين التلقائي (يصعب مع المستويات) أو مستوى ثابت.',
    progress(){const s=gState('sudoku',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('sudoku',{hints:3,cur:null,dailyCur:null,diff:'auto',bestTime:{}});setStats([['s1','المستوى'],['s2','الوقت','gold'],['s3','أخطاء'],['s4','تلميحات']]);
      boardEl=document.createElement('div');boardEl.className='sboard';for(let i=0;i<81;i++){const c=document.createElement('button');c.type='button';c.dataset.i=i;boardEl.appendChild(c)}
      boardEl.onclick=e=>{const c=e.target.closest('button');if(!c)return;sel=+c.dataset.i;snd('tap');render()};
      padEl=document.createElement('div');padEl.className='pad';
      for(let d=1;d<=9;d++){const b=document.createElement('button');b.type='button';b.innerHTML=d+'<small></small>';b.onclick=()=>put(d);padEl.appendChild(b)}
      stage.append(boardEl,padEl);
      btn('مسح',IC.erase,()=>put(0));nb2=btn('ملاحظات',IC.pen,()=>{notesMode=!notesMode;render()});
      btn('تلميح',IC.hint,()=>{if(!st.hints||p.over)return;let i=sel>=0&&p.cur[sel]!==p.sol[sel]?sel:p.cur.findIndex((v,j)=>v!==p.sol[j]);if(i<0)return;
        st.hints--;p.hints++;sel=i;const m=notesMode;notesMode=false;p.cur[i]=0;put(p.sol[i]);notesMode=m;gSave('sudoku',st);render()});
      btn('احتمالات',IC.list,()=>{if(p.over)return;for(let i=0;i<81;i++){if(p.cur[i])continue;const used=new Set(peers(i).map(j=>p.cur[j]).filter(v=>v));let m=0;for(let d=1;d<=9;d++)if(!used.has(d))m|=1<<d;p.notes[i]=m}
        snd('ok');render();persist();toast('كُتبت الاحتمالات في كل الخانات الفارغة')});
      db=btn('الصعوبة',IC.gauge,()=>{if(mode&&mode.daily)return;st.diff=ORDER[(ORDER.indexOf(st.diff)+1)%ORDER.length];st.cur=null;gSave('sudoku',st);toast('الصعوبة: '+DIFFS[st.diff][0]);play(p.level,true)});
      db.style.flexBasis='100%';
      document.addEventListener('keydown',this.key=e=>{if(/^[1-9]$/.test(e.key))put(+e.key);if(e.key==='Backspace'||e.key==='Delete')put(0)});
      setTimeout(()=>play(st.level),20)},
    stop(){clearInterval(timer);if(p&&!p.over)persist();document.removeEventListener('keydown',this.key)}};
})();
