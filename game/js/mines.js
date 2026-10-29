/* ================= game 7: minesweeper ================= */
const MinesGame=(()=>{
  const NUMC=['','#7cc4f2','#3fbf9b','#f2a09a','#c7a0f2','#f2b84b','#5fd3d3','#e8f1ee','#8aa39d'];
  let st,g,boardEl,fb,hb,timer=0,flagMode=false,lp=null,lpFired=false;
  function conf(l){const cols=Math.min(6+Math.floor((l-1)/2),9),rows=Math.min(cols+Math.floor(l/3),12),d=Math.min(0.12+l*0.008,0.2);return {cols,rows,mines:Math.max(4,Math.round(cols*rows*d))}}
  function build(level,seed){const c=conf(level);g=Object.assign({level,R:rng(seed??level*6007+29),started:false,lives:3,hints:0,time:0,over:false},c);
    g.cells=Array.from({length:c.cols*c.rows},()=>({m:0,o:0,f:0,n:0,b:0}))}
  function nb(i){const out=[],r=(i/g.cols)|0,c=i%g.cols;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr>=0&&cc>=0&&rr<g.rows&&cc<g.cols)out.push(rr*g.cols+cc)}return out}
  function place(first){
    const safe=new Set([first,...nb(first)]);
    shuffle([...Array(g.cells.length).keys()].filter(i=>!safe.has(i)),g.R).slice(0,g.mines).forEach(i=>g.cells[i].m=1);
    g.cells.forEach((c,i)=>c.n=nb(i).filter(j=>g.cells[j].m).length);g.started=true;
    clearInterval(timer);timer=setInterval(()=>{if(document.hidden||g.over)return;g.time++;setStat('s4',fmtTime(g.time))},1000);
  }
  function flood(i){const q=[i];while(q.length){const k=q.pop(),c=g.cells[k];if(c.o||c.m)continue;c.o=1;c.f=0;if(c.n===0)nb(k).forEach(j=>{if(!g.cells[j].o&&!g.cells[j].m&&!g.cells[j].f)q.push(j)})}}
  function open(i){const c=g.cells[i];if(c.o||c.f||g.over)return;
    if(c.m){c.o=1;c.b=1;g.lives--;snd('err');buzz([60,40,60]);if(g.lives<=0){lose();return}toast('💥 اصطدمت بكويكب! بقي لك '+g.lives+(g.lives===1?' قلب':' قلبان'))}
    else{flood(i);snd('flip')}}
  function toggleFlag(i){const c=g.cells[i];if(c.o||g.over)return;c.f=c.f?0:1;snd('tap');buzz(25);render()}
  function tap(i){
    if(g.over)return;const c=g.cells[i];
    if(!g.started){if(flagMode){toast('افتح أول خانة أولاً');return}place(i)}
    if(flagMode&&!c.o){toggleFlag(i);return}
    if(c.o&&c.n>0&&!c.m){const ns=nb(i),fl=ns.filter(j=>g.cells[j].f||(g.cells[j].o&&g.cells[j].m)).length;if(fl===c.n)ns.forEach(j=>open(j))}
    else open(i);
    render();checkWin();
  }
  function lose(){g.over=true;clearInterval(timer);g.cells.forEach(c=>{if(c.m)c.o=1});render();loseBox({title:'اصطدمت بآخر كويكب',text:'خسرت قلوبك الثلاثة. حاول مرة أخرى!',onRetry:()=>play(g.level)})}
  function checkWin(){
    if(g.over||!g.cells.every(c=>c.m||c.o))return;
    g.over=true;clearInterval(timer);g.cells.forEach(c=>{if(c.m&&!c.o)c.f=1});render();
    const daily=mode&&mode.daily,earned=!daily&&g.level%3===0;if(earned){st.hints++;gSave('mines',st)}
    finishLevel(MinesGame,st,g.level,g.lives,{lives:g.lives},'نظّفت الحقل!',`الوقت ${fmtTime(g.time)} · قلوب متبقية ${g.lives}`+(earned?' · كسبت تلميحاً':''));
  }
  function render(){
    const flags=g.cells.filter(c=>c.f||(c.o&&c.m)).length;
    g.cells.forEach((c,i)=>{const b=boardEl.children[i];b.className='mcell'+(c.o?' o':'')+(c.b?' boom':'');
      if(c.o){if(c.m)b.textContent=c.b?'💥':'☄️';else{b.textContent=c.n||'';b.style.color=NUMC[c.n]||''}}else{b.textContent=c.f?'🚩':'';b.style.color=''}});
    setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.mines-flags);setStat('s3',g.lives+' ❤️');setStat('s4',fmtTime(g.time));
    fb.classList.toggle('on',flagMode);fb.lastChild.textContent=flagMode?'وضع العلم: يعمل':'وضع العلم';hb.disabled=!st.hints||g.over;
  }
  function play(level){
    clearOverlays();clearInterval(timer);st=gState('mines',{hints:3});
    if(mode&&mode.daily)build(6,mode.seed);else build(level);
    boardEl.style.gridTemplateColumns=`repeat(${g.cols},minmax(0,1fr))`;boardEl.innerHTML='';
    g.cells.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.className='mcell';b.dataset.i=i;b.setAttribute('aria-label','خانة');boardEl.appendChild(b)});
    render();
  }
  return {id:'mines',name:'حقل الكويكبات',desc:'امسح الفضاء وتجنّب الكويكبات بالأرقام',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="8" fill="#1d373b"/><g stroke="#e8f1ee" stroke-width="3" stroke-linecap="round"><path d="M20 12v20M10 22h20M13 15l14 14M27 15L13 29"/></g><circle cx="20" cy="22" r="7.5" fill="#0b1618"/><path d="M33 26v14M33 26l9 4-9 4" fill="#f2a09a" stroke="#f2a09a" stroke-width="2" stroke-linejoin="round"/></svg>',
    help:'اضغط خانة لمسح الفضاء فيها. الرقم يخبرك بعدد الكويكبات ☄️ حولها في الخانات الثماني. ضغطة مطوّلة (أو «وضع العلم») تضع علماً 🚩 على الكويكب. لديك 3 قلوب، والنجوم = القلوب المتبقية. اضغط رقماً اكتملت أعلامه لفتح ما حوله دفعة واحدة. «تلميح» يفتح خانة آمنة.',
    progress(){const s=gState('mines',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){
      st=gState('mines',{hints:3});setStats([['s1','المستوى'],['s2','كويكبات','gold'],['s3','قلوب'],['s4','الوقت']]);flagMode=false;
      boardEl=document.createElement('div');boardEl.className='mboard2';stage.appendChild(boardEl);
      boardEl.addEventListener('pointerdown',e=>{const b=e.target.closest('.mcell');if(!b)return;lpFired=false;clearTimeout(lp);
        lp=setTimeout(()=>{const i=+b.dataset.i;if(g.started&&!g.cells[i].o&&!g.over){lpFired=true;toggleFlag(i)}},420)});
      ['pointerup','pointercancel','pointerleave'].forEach(t=>boardEl.addEventListener(t,()=>clearTimeout(lp)));
      boardEl.addEventListener('click',e=>{const b=e.target.closest('.mcell');if(!b)return;if(lpFired){lpFired=false;return}tap(+b.dataset.i)});
      boardEl.addEventListener('contextmenu',e=>e.preventDefault());
      fb=btn('وضع العلم',IC.pen,()=>{flagMode=!flagMode;snd('tap');render()});
      hb=btn('تلميح',IC.hint,()=>{if(g.over||!st.hints)return;
        if(!g.started){const i=Math.floor(g.rows/2)*g.cols+Math.floor(g.cols/2);place(i);flood(i)}
        else{const cand=g.cells.map((_,i)=>i).filter(i=>!g.cells[i].m&&!g.cells[i].o);if(!cand.length)return;
          const front=cand.filter(i=>nb(i).some(j=>g.cells[j].o&&!g.cells[j].m)),pool=front.length?front:cand;flood(pool[Math.floor(Math.random()*pool.length)])}
        st.hints--;g.hints++;gSave('mines',st);snd('ok');render();checkWin()});
      btn('إعادة',IC.reset,()=>play(g.level));
      play(st.level);
    },
    stop(){clearInterval(timer);clearTimeout(lp)}};
})();
