/* ================= game 5: memory ================= */
const MemoryGame=(()=>{
  const SYM=['🪐','🌍','🌙','☄️','🚀','🛸','👽','⭐','☀️','🛰️','🌌','👨‍🚀','🔭','🌠','🌑','📡','🪨','💫'];
  let st,g,boardEl,lock=false,pk,turnEl,vsB,cpuT=0;
  const vsOn=()=>!!prefs.memCpu&&!(mode&&mode.daily);
  // special single cards (solo only): 🔦 matches a random pair for you, 🌀 shuffles every closed card
  const SPEC={reveal:'🔦',shuffle:'🌀'};
  function build(level,seed){const R=rng(seed??level*541+3),pairs=Math.min(5+level,18),syms=shuffle(SYM.slice(),R).slice(0,pairs);
    let cards=syms.concat(syms).map(s=>({s,done:false}));
    if(!vsOn()&&!(mode&&mode.daily)){if(level>=5)cards.push({s:SPEC.reveal,sp:'reveal',done:false});if(level>=8)cards.push({s:SPEC.shuffle,sp:'shuffle',done:false})}
    return {level,pairs,cards:shuffle(cards,R),open:[],moves:0,found:0,turn:0,me:0,cpu:0,mem:new Map()}}
  function fit(){if(!g||!boardEl)return;const n=g.cards.length,gap=6,ratio=1.25,top=boardEl.getBoundingClientRect().top,availW=stage.clientWidth,availH=Math.max(220,innerHeight-Math.max(top,0)-110);
    let best={w:0,c:4};for(let c=3;c<=8;c++){const r=Math.ceil(n/c),w=Math.min((availW-gap*(c-1))/c,((availH-gap*(r-1))/r)/ratio);if(w>best.w)best={w,c}}
    const w=Math.floor(best.w),h=Math.floor(w*ratio);boardEl.style.gridTemplateColumns=`repeat(${best.c},${w}px)`;boardEl.style.gridAutoRows=h+'px';boardEl.style.width=(best.c*w+gap*(best.c-1))+'px';boardEl.style.setProperty('--sym',Math.round(w*0.5)+'px')}
  const goal=()=>Math.round(g.pairs*1.6);
  function upd(){
    if(vsOn()){setStat('s1',g.level);setStat('s2',g.me);setStat('s3',g.cpu);setStat('s4',g.found+'/'+g.pairs);
      turnEl.hidden=false;turnEl.innerHTML=g.turn?'<b class="cp">● دور الكمبيوتر …</b>':'<b class="me">● دورك</b>';turnEl.insertAdjacentHTML('beforeend',`<span class="sc">أنت ${g.me} · الكمبيوتر ${g.cpu}</span>`)}
    else{turnEl.hidden=true;setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.moves);setStat('s3',g.found+'/'+g.pairs);setStat('s4',goal())}
    vsB.classList.toggle('on',vsOn());vsB.disabled=!!(mode&&mode.daily)}
  function card(c){const b=document.createElement('button');b.type='button';b.className='mc'+(c.sp?' sp':'')+(c.done?' done up':'');b.setAttribute('aria-label','بطاقة');
    b.innerHTML=`<div class="in"><div class="b"><svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke="#3fbf9b" stroke-width="6" transform="rotate(-30 50 50)"/><path fill="#f2b84b" d="M50 28c2.6 13 9 19.4 22 22-13 2.6-19.4 9-22 22-2.6-13-9-19.4-22-22 13-2.6 19.4-9 22-22z"/></svg></div><div class="f">${c.s}</div></div>`;return b}
  function drawBoard(){boardEl.innerHTML='';g.cards.forEach((c,i)=>{const b=card(c);if(g.open.includes(i))b.classList.add('up');b.onclick=()=>{if(!vsOn()||g.turn===0)flip(i)};boardEl.appendChild(b)});fit()}
  // the computer remembers what it has seen, but forgets more at low levels
  const remember=i=>{if(!vsOn())return;const keep=Math.min(0.95,0.55+g.level*0.04);if(Math.random()<keep)g.mem.set(i,g.cards[i].s)};
  function special(i){const c=g.cards[i];c.done=true;const el=boardEl.children[i];el.classList.add('up','done');g.open=g.open.filter(k=>k!==i);snd('ach');buzz([20,30,20]);
    if(c.sp==='reveal'){const left=[...new Set(g.cards.filter((x,k)=>!x.done&&!x.sp&&!g.open.includes(k)).map(x=>x.s))];if(left.length){const sy=left[Math.floor(Math.random()*left.length)];
      g.cards.forEach((x,k)=>{if(x.s===sy&&!x.done){x.done=true;boardEl.children[k].classList.add('up','done')}});g.found++;toast('🔦 كشفت زوجاً '+sy)}}
    else{const idx=g.cards.map((x,k)=>!x.done&&!g.open.includes(k)?k:-1).filter(k=>k>=0),vals=shuffle(idx.map(k=>g.cards[k]),Math.random);idx.forEach((k,j)=>g.cards[k]=vals[j]);
      toast('🌀 خلط! تبدّلت أماكن البطاقات المغلقة');setTimeout(()=>{drawBoard();lock=false},500);lock=true}
    checkEnd()}
  function checkEnd(){if(g.found<g.pairs||g.over)return;g.over=true;
    if(vsOn()){if(g.me>g.cpu){const s=g.cpu<=g.pairs/4?3:2;finishLevel(MemoryGame,st,g.level,s,{perfect:false,beatCpu:true},'فزت على الكمبيوتر! 🏆',`أنت ${g.me} · الكمبيوتر ${g.cpu}`)}
      else if(g.me===g.cpu)finishLevel(MemoryGame,st,g.level,1,{},'تعادل مع الكمبيوتر',`أنت ${g.me} · الكمبيوتر ${g.cpu}`);
      else loseBox({title:'الكمبيوتر فاز 🤖',text:`أنت ${g.me} · الكمبيوتر ${g.cpu}. حاول مرة أخرى!`,onRetry:()=>play(g.level)});return}
    const s=g.moves<=goal()?3:g.moves<=Math.round(g.pairs*2.3)?2:1;finishLevel(MemoryGame,st,g.level,s,{perfect:g.moves<=g.pairs+1},'ذاكرة قوية!',`${g.moves} محاولة لـ ${g.pairs} أزواج`)}
  function flip(i){if(lock||g.over)return;const c=g.cards[i],el=boardEl.children[i];if(c.done||g.open.includes(i))return;
    el.classList.add('up');snd('flip');if(c.sp){special(i);upd();return}
    g.open.push(i);remember(i);
    if(g.open.length===2){g.moves++;const [a,b]=g.open;
      if(g.cards[a].s===g.cards[b].s){g.cards[a].done=g.cards[b].done=true;boardEl.children[a].classList.add('done');boardEl.children[b].classList.add('done');g.open=[];g.found++;snd('ok');buzz(15);
        g.mem.delete(a);g.mem.delete(b);if(vsOn()){if(g.turn)g.cpu++;else g.me++}upd();checkEnd();if(vsOn()&&g.turn&&!g.over)cpuTurn()}
      else{lock=true;setTimeout(()=>{boardEl.children[a].classList.remove('up');boardEl.children[b].classList.remove('up');g.open=[];lock=false;
        if(vsOn()){g.turn=1-g.turn;upd();if(g.turn)cpuTurn()}},750)}}
    upd()}
  function cpuTurn(){clearTimeout(cpuT);if(g.over)return;
    const hidden=g.cards.map((c,i)=>!c.done?i:-1).filter(i=>i>=0),unknown=hidden.filter(i=>!g.mem.has(i));
    const pairOf=(i)=>[...g.mem].find(([k,s])=>k!==i&&s===g.cards[i].s&&!g.cards[k].done);
    let first=null,second=null;for(const [k,s] of g.mem){if(g.cards[k].done)continue;const m=[...g.mem].find(([k2,s2])=>k2!==k&&s2===s&&!g.cards[k2].done);if(m){first=k;second=m[0];break}}
    if(first==null)first=unknown.length?unknown[Math.floor(Math.random()*unknown.length)]:hidden[0];
    cpuT=setTimeout(()=>{if(g.over||!boardEl.isConnected)return;flip(first);
      if(second==null){const m=pairOf(first);second=m?m[0]:null;if(second==null){const rest=hidden.filter(i=>i!==first&&!g.mem.has(i));second=rest.length?rest[Math.floor(Math.random()*rest.length)]:hidden.find(i=>i!==first)}}
      cpuT=setTimeout(()=>{if(g.over||!boardEl.isConnected)return;flip(second)},650)},700)}
  function play(level){clearOverlays();clearTimeout(cpuT);st=gState('memory');g=mode&&mode.daily?build(8,mode.seed):build(level);g.peek=vsOn()?0:1;if(pk)pk.disabled=vsOn();lock=false;
    setStats(vsOn()?[['s1','المستوى'],['s2','أزواجك','gold'],['s3','الكمبيوتر'],['s4','الأزواج']]:[['s1','المستوى'],['s2','محاولات'],['s3','أزواج','gold'],['s4','هدف 3 نجوم']]);
    drawBoard();upd();
    const lv=mode&&mode.daily?8:level;if(lv<=4&&!vsOn()){lock=true;[...boardEl.children].forEach(b=>b.classList.add('up'));setTimeout(()=>{[...boardEl.children].forEach(b=>b.classList.remove('up'));lock=false},1200+lv*250)}
    if(g.cards.some(c=>c.sp))toast(g.cards.some(c=>c.sp==='shuffle')?'بين البطاقات 🔦 تكشف زوجاً و🌀 تخلط البطاقات':'بين البطاقات بطاقة 🔦 تكشف لك زوجاً')}
  return {id:'memory',name:'الذاكرة',desc:'اقلب البطاقات وطابق أزواج الكواكب والمركبات',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="5" y="9" width="17" height="24" rx="3" fill="#16292d" stroke="#3fbf9b" stroke-width="2"/><rect x="26" y="15" width="17" height="24" rx="3" fill="#e9f3ef"/><path fill="#f2b84b" d="M34 20c1 4.5 2.4 5.9 7 7-4.6 1-6 2.4-7 7-1-4.6-2.4-6-7-7 4.6-1.1 6-2.5 7-7z"/></svg>',
    help:'اقلب بطاقتين في كل محاولة، وإذا تطابقتا تبقيان مفتوحتين. في المستويات الأولى ترى البطاقات لحظة في البداية، ثم يزيد عدد الأزواج وتختفي المساعدة. «نظرة سريعة» تكشف كل البطاقات لثانية مرة واحدة في كل مستوى، مقابل محاولتين. من المستوى 5 تظهر بطاقة 🔦 تكشف لك زوجاً، ومن المستوى 8 بطاقة 🌀 تخلط البطاقات المغلقة. «ضد الكمبيوتر» تتناوبان على القلب، ومن يطابق زوجاً يلعب مرة أخرى، ومن يجمع أزواجاً أكثر يفوز. ذاكرة الكمبيوتر تقوى مع المستويات.',
    progress(){const s=gState('memory');return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('memory');
      turnEl=document.createElement('div');turnEl.className='gturn';boardEl=document.createElement('div');boardEl.className='mboard';stage.append(turnEl,boardEl);
      pk=btn('نظرة سريعة',IC.eye,()=>{if(lock||g.over||!g.peek)return;g.peek--;g.moves+=2;pk.disabled=true;lock=true;snd('flip');
        g.open.forEach(i=>boardEl.children[i].classList.remove('up'));g.open=[];
        [...boardEl.children].forEach((b,i)=>{if(!g.cards[i].done)b.classList.add('up')});
        setTimeout(()=>{[...boardEl.children].forEach((b,i)=>{if(!g.cards[i].done)b.classList.remove('up')});lock=false},1100);upd();toast('+2 محاولة')});
      btn('إعادة',IC.reset,()=>play(g.level));vsB=btn('ضد الكمبيوتر',null,()=>{if(mode&&mode.daily)return;prefs.memCpu=!prefs.memCpu;save('arcade-prefs',prefs);toast(prefs.memCpu?'🤖 تلعب الآن ضد الكمبيوتر':'تلعب الآن وحدك');play(g.level)});
      play(st.level);this.rs=()=>fit();addEventListener('resize',this.rs)},
    stop(){clearTimeout(cpuT);removeEventListener('resize',this.rs)}};
})();
