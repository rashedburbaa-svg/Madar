/* ================= game 5: memory ================= */
const MemoryGame=(()=>{
  const SYM=['🍎','🍋','🍇','🍉','🥝','🍒','🌙','⭐','🐪','🦅','🐬','🌴','⚓','🎯','🔑','🚀','🌵','🦋'];
  let st,g,boardEl,lock=false,pk;
  function build(level,seed){const R=rng(seed??level*541+3),pairs=Math.min(5+level,18),syms=shuffle(SYM.slice(),R).slice(0,pairs);
    return {level,pairs,cards:shuffle(syms.concat(syms),R).map(s=>({s,done:false})),open:[],moves:0,found:0}}
  function fit(){if(!g||!boardEl)return;const n=g.cards.length,gap=6,ratio=1.25,top=boardEl.getBoundingClientRect().top,availW=stage.clientWidth,availH=Math.max(220,innerHeight-Math.max(top,0)-110);
    let best={w:0,c:4};for(let c=3;c<=8;c++){const r=Math.ceil(n/c),w=Math.min((availW-gap*(c-1))/c,((availH-gap*(r-1))/r)/ratio);if(w>best.w)best={w,c}}
    const w=Math.floor(best.w),h=Math.floor(w*ratio);boardEl.style.gridTemplateColumns=`repeat(${best.c},${w}px)`;boardEl.style.gridAutoRows=h+'px';boardEl.style.width=(best.c*w+gap*(best.c-1))+'px';boardEl.style.setProperty('--sym',Math.round(w*0.5)+'px')}
  const goal=()=>Math.round(g.pairs*1.6);
  function upd(){setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.moves);setStat('s3',g.found+'/'+g.pairs);setStat('s4',goal())}
  function flip(i){if(lock||g.over)return;const c=g.cards[i],el=boardEl.children[i];if(c.done||g.open.includes(i))return;
    el.classList.add('up');g.open.push(i);snd('flip');
    if(g.open.length===2){g.moves++;const [a,b]=g.open;
      if(g.cards[a].s===g.cards[b].s){g.cards[a].done=g.cards[b].done=true;boardEl.children[a].classList.add('done');boardEl.children[b].classList.add('done');g.open=[];g.found++;snd('ok');buzz(15);
        if(g.found===g.pairs){g.over=true;const s=g.moves<=goal()?3:g.moves<=Math.round(g.pairs*2.3)?2:1;
          finishLevel(MemoryGame,st,g.level,s,{perfect:g.moves<=g.pairs+1},'ذاكرة قوية!',`${g.moves} محاولة لـ ${g.pairs} أزواج`)}}
      else{lock=true;setTimeout(()=>{boardEl.children[a].classList.remove('up');boardEl.children[b].classList.remove('up');g.open=[];lock=false},750)}}
    upd()}
  function play(level){clearOverlays();st=gState('memory');g=mode&&mode.daily?build(8,mode.seed):build(level);g.peek=1;if(pk)pk.disabled=false;lock=false;boardEl.innerHTML='';
    g.cards.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='mc';b.setAttribute('aria-label','بطاقة');
      b.innerHTML=`<div class="in"><div class="b"><svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke="#3fbf9b" stroke-width="6" transform="rotate(-30 50 50)"/><path fill="#f2b84b" d="M50 28c2.6 13 9 19.4 22 22-13 2.6-19.4 9-22 22-2.6-13-9-19.4-22-22 13-2.6 19.4-9 22-22z"/></svg></div><div class="f">${c.s}</div></div>`;
      b.onclick=()=>flip(i);boardEl.appendChild(b)});fit();upd();
    const lv=mode&&mode.daily?8:level;if(lv<=4){lock=true;[...boardEl.children].forEach(b=>b.classList.add('up'));setTimeout(()=>{[...boardEl.children].forEach(b=>b.classList.remove('up'));lock=false},1200+lv*250)}}
  return {id:'memory',name:'الذاكرة',desc:'اقلب البطاقات وطابق الأزواج',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="5" y="9" width="17" height="24" rx="3" fill="#16292d" stroke="#3fbf9b" stroke-width="2"/><rect x="26" y="15" width="17" height="24" rx="3" fill="#e9f3ef"/><path fill="#f2b84b" d="M34 20c1 4.5 2.4 5.9 7 7-4.6 1-6 2.4-7 7-1-4.6-2.4-6-7-7 4.6-1.1 6-2.5 7-7z"/></svg>',
    help:'اقلب بطاقتين في كل محاولة، وإذا تطابقتا تبقيان مفتوحتين. في المستويات الأولى ترى البطاقات لحظة في البداية، ثم يزيد عدد الأزواج وتختفي المساعدة. «نظرة سريعة» تكشف كل البطاقات لثانية مرة واحدة في كل مستوى، مقابل محاولتين.',
    progress(){const s=gState('memory');return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('memory');setStats([['s1','المستوى'],['s2','محاولات'],['s3','أزواج','gold'],['s4','هدف 3 نجوم']]);
      boardEl=document.createElement('div');boardEl.className='mboard';stage.appendChild(boardEl);
      pk=btn('نظرة سريعة',IC.eye,()=>{if(lock||g.over||!g.peek)return;g.peek--;g.moves+=2;pk.disabled=true;lock=true;snd('flip');
        g.open.forEach(i=>boardEl.children[i].classList.remove('up'));g.open=[];
        [...boardEl.children].forEach((b,i)=>{if(!g.cards[i].done)b.classList.add('up')});
        setTimeout(()=>{[...boardEl.children].forEach((b,i)=>{if(!g.cards[i].done)b.classList.remove('up')});lock=false},1100);upd();toast('+2 محاولة')});
      btn('إعادة',IC.reset,()=>play(g.level));play(st.level);this.rs=()=>fit();addEventListener('resize',this.rs)},
    stop(){removeEventListener('resize',this.rs)}};
})();
