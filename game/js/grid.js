/* ================= game 1: orbit grid ================= */
const GridGame=(()=>{
  const N=1,E=2,S=4,W=8,DIRS=[[N,0,-1,S],[E,1,0,W],[S,0,1,N],[W,-1,0,E]];
  const rot=m=>((m<<1)|(m>>3))&15,rotK=(m,k)=>{for(let i=0;i<k;i++)m=rot(m);return m};
  let st,g,board,ub,hb;
  const sizeFor=l=>Math.min(4+Math.floor((l-1)/3),9);
  function nb(x,y,dx,dy,n,wrap){let nx=x+dx,ny=y+dy;if(wrap){nx=(nx+n)%n;ny=(ny+n)%n}else if(nx<0||ny<0||nx>=n||ny>=n)return -1;return ny*n+nx}
  function build(level,seed){
    const n=sizeFor(level),R=rng(seed??level*7919+13),wrap=level>=10&&level%2===0,sol=new Array(n*n).fill(0),seen=new Array(n*n).fill(false);
    const src=Math.floor(n/2)*n+Math.floor(n/2),front=[src];seen[src]=true;
    while(front.length){const idx=R()<(level<6?0.75:0.5)?front.length-1:Math.floor(R()*front.length);const c=front[idx],x=c%n,y=(c/n)|0;
      const opts=DIRS.filter(([,dx,dy])=>{const k=nb(x,y,dx,dy,n,wrap);return k>=0&&!seen[k]});
      if(!opts.length){front.splice(idx,1);continue}
      const [b,dx,dy,ob]=opts[Math.floor(R()*opts.length)],nc=nb(x,y,dx,dy,n,wrap);sol[c]|=b;sol[nc]|=ob;seen[nc]=true;front.push(nc)}
    const r=sol.map(()=>Math.floor(R()*4)),locked=new Array(n*n).fill(false);
    if(level>=7){const k=Math.min(Math.floor(n*n*0.08),7);const cand=shuffle([...Array(n*n).keys()].filter(i=>i!==src),R).slice(0,k);cand.forEach(i=>{locked[i]=true;r[i]=0})}
    if(r.every((k,i)=>rotK(sol[i],k)===sol[i])){const i=[...Array(n*n).keys()].find(i=>!locked[i]&&i!==src&&rotK(sol[i],1)!==sol[i]);if(i!=null)r[i]=1}
    return {n,sol,rot:r,src,locked,wrap,moves:0,hist:[],angle:r.map(k=>k*90),level};
  }
  const cur=i=>rotK(g.sol[i],g.rot[i]);
  function minRot(i){const c=cur(i);for(let k=0;k<4;k++)if(rotK(c,k)===g.sol[i])return k;return 0}
  function lit(){const n=g.n,L=new Set([g.src]),q=[g.src];while(q.length){const c=q.shift(),x=c%n,y=(c/n)|0,m=cur(c);
    for(const [b,dx,dy,ob] of DIRS){if(!(m&b))continue;const nc=nb(x,y,dx,dy,n,g.wrap);if(nc<0)continue;if(!L.has(nc)&&(cur(nc)&ob)){L.add(nc);q.push(nc)}}}return L}
  function svg(mask,isSrc){
    const P={[N]:[50,0],[E]:[100,50],[S]:[50,100],[W]:[0,50]};
    const arms=[N,E,S,W].filter(b=>mask&b).map(b=>`<line class="arm" x1="50" y1="50" x2="${P[b][0]}" y2="${P[b][1]}"/>`).join('');
    const leaf=[N,E,S,W].filter(b=>mask&b).length===1;
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${arms}${isSrc?'<path class="gstar" d="M50 22c3 17 11 25 28 28-17 3-25 11-28 28-3-17-11-25-28-28 17-3 25-11 28-28z"/>':leaf?'<circle class="node" cx="50" cy="50" r="17"/>':'<circle class="hub" cx="50" cy="50" r="9"/>'}</svg>`;
  }
  function refresh(){const L=lit();[...board.children].forEach((c,i)=>c.classList.toggle('lit',L.has(i)));
    setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.moves);setStat('s3',g.par);setStat('s4',st.hints);
    ub.disabled=!g.hist.length;hb.disabled=!st.hints;return L.size===g.sol.length}
  function turn(i,rec=true){
    if(g.locked[i]){const el=board.children[i];el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');snd('err');buzz(30);return}
    g.rot[i]=(g.rot[i]+1)%4;g.angle[i]+=90;board.children[i].firstChild.style.transform=`rotate(${g.angle[i]}deg)`;if(rec){g.moves++;g.hist.push(i)}snd('rot');buzz(8);
    if(refresh()){g.over=true;done()}}
  function done(){const m=g.moves,p=g.par,s=m<=p?3:m<=Math.ceil(p*1.5)?2:1;const earned=!(mode&&mode.daily)&&g.level%3===0;if(earned){st.hints++;gSave('grid',st)}
    finishLevel(GridGame,st,g.level,s,{n:g.n,wrap:g.wrap},s===3?'مثالي!':'اكتمل المدار!',`${m} حركة (الحد الأدنى ${p})`+(earned?' · كسبت تلميحاً':'')+(!(mode&&mode.daily)&&sizeFor(g.level+1)>g.n?' · اللوحة تكبر':''))}
  function play(level){
    clearOverlays();st=gState('grid',{hints:3});
    g=mode&&mode.daily?build(13,mode.seed):build(level);g.par=g.sol.reduce((a,_,i)=>a+minRot(i),0);
    board.className='gboard'+(g.wrap?' wrapmode':'');board.style.gridTemplateColumns=`repeat(${g.n},1fr)`;board.innerHTML='';
    g.sol.forEach((m,i)=>{const c=document.createElement('button');c.type='button';c.className='cell'+(g.locked[i]?' locked':'');c.dataset.i=i;c.setAttribute('aria-label',g.locked[i]?'قطعة مقفلة':'قطعة');c.innerHTML=svg(m,i===g.src);c.firstChild.style.transform=`rotate(${g.angle[i]}deg)`;board.appendChild(c)});
    refresh();if(g.wrap&&!(mode&&mode.daily)&&!st.wrapSeen){st.wrapSeen=1;gSave('grid',st);toast('شبكة ملتفّة: الأطراف متصلة بالجهة المقابلة')}
  }
  return {id:'grid',name:'شبكة المدار',desc:'دوّر القطع حتى تضيء الشبكة كلها',play,
    icon:'<svg viewBox="0 0 48 48"><g stroke="#3fbf9b" stroke-width="5" stroke-linecap="round" fill="none"><path d="M24 24V8M24 24h16M24 24v16M24 24H10"/></g><path fill="#f2b84b" d="M24 14c1.6 6.5 3.5 8.4 10 10-6.5 1.6-8.4 3.5-10 10-1.6-6.5-3.5-8.4-10-10 6.5-1.6 8.4-3.5 10-10z"/></svg>',
    help:'اضغط أي قطعة لتدويرها، ووصّل كل الأنابيب بالنجمة حتى تضيء كل النقاط. زر «افحص» يلوّن بالأحمر القطع التي لا تتصل بجيرانها. القطع الداكنة مقفلة وفي مكانها الصحيح. اللوحة ذات الإطار الذهبي المتقطع «ملتفّة»: ما يخرج من طرف يدخل من الطرف المقابل.',
    progress(){const s=gState('grid',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('grid',{hints:3});setStats([['s1','المستوى'],['s2','حركاتك'],['s3','الحد الأدنى','gold'],['s4','تلميحات']]);
      board=document.createElement('div');board.className='gboard';stage.appendChild(board);
      board.onclick=e=>{const c=e.target.closest('.cell');if(c&&!g.over)turn(+c.dataset.i)};
      ub=btn('تراجع',IC.undo,()=>{if(!g.hist.length||g.over)return;const i=g.hist.pop();g.rot[i]=(g.rot[i]+3)%4;g.angle[i]-=90;g.moves--;board.children[i].firstChild.style.transform=`rotate(${g.angle[i]}deg)`;snd('tap');refresh()});
      hb=btn('تلميح',IC.hint,()=>{if(!st.hints||g.over)return;const L=lit(),n=g.n,wrong=g.sol.map((_,i)=>i).filter(i=>!g.locked[i]&&minRot(i)>0);if(!wrong.length)return;
        const near=wrong.filter(i=>DIRS.some(([,dx,dy])=>{const k=nb(i%n,(i/n)|0,dx,dy,n,g.wrap);return k>=0&&L.has(k)}));
        const i=(near.length?near:wrong)[0];st.hints--;gSave('grid',st);const el=board.children[i];el.classList.remove('hintflash');void el.offsetWidth;el.classList.add('hintflash');
        const k=minRot(i);for(let j=0;j<k&&!g.over;j++)turn(i)});
      btn('افحص',IC.check,()=>{if(g.over)return;const n=g.n,bad=[];
        g.sol.forEach((_,i)=>{const x=i%n,y=(i/n)|0,m=cur(i);let wrong=false;
          for(const [b,dx,dy,ob] of DIRS){const k=nb(x,y,dx,dy,n,g.wrap);const mine=!!(m&b),theirs=k>=0&&!!(cur(k)&ob);if(mine!==theirs||(mine&&k<0)){wrong=true;break}}
          if(wrong)bad.push(i)});
        [...board.children].forEach((c,i)=>{c.classList.remove('badc','okc');c.classList.add(bad.includes(i)?'badc':'okc')});snd(bad.length?'err':'ok');
        toast(bad.length?bad.length+' قطعة اتصالها غير مكتمل':'كل الاتصالات سليمة');
        clearTimeout(this.ck);this.ck=setTimeout(()=>[...board.children].forEach(c=>c.classList.remove('badc','okc')),1800)});
      btn('إعادة',IC.reset,()=>play(g.level));play(st.level)},
    stop(){}};
})();
