/* ================= hub ================= */

const GAMES=[GridGame,SudokuGame,WordsGame,NonoGame,MinesGame,Game2048,GolfGame,DiffGame,MemoryGame];
function renderHub(){
  drawPrefs();
  const k=todayKey(),doneToday=daily.done[k]||{},alive=daily.last===k||daily.last===yesterdayKey(),streak=alive?daily.streak:0;
  const d=$('daily');
  const DAYS=['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];let week='';
  for(let back=6;back>=0;back--){const dt=new Date();dt.setDate(dt.getDate()-back);const kk=todayKey(dt),on=daily.done[kk]&&Object.keys(daily.done[kk]).length;
    week+=`<span class="${on?'on ':''}${back===0?'today':''}"><i>${on?'🔥':''}</i>${back===0?'اليوم':DAYS[dt.getDay()]}</span>`}
  const DG=GAMES.filter(G=>!G.noDaily),nDone=DG.filter(G=>doneToday[G.id]).length;
  d.innerHTML=`<div class="top"><b>تحدي اليوم</b><span class="streak">🔥 ${streak} ${streak===1?'يوم':'أيام'}</span></div><small style="color:var(--muted)">لغز جديد كل يوم في كل لعبة. حلّ واحداً على الأقل يومياً لتحافظ على السلسلة.</small><div class="week">${week}</div>`;
  let list=document.getElementById('dlist');if(!list){list=document.createElement('div');list.id='dlist';list.className='dlist';d.after(list)}list.innerHTML='';
  DG.forEach((G,i)=>{const s=doneToday[G.id];const b=document.createElement('button');b.type='button';b.className='drow'+(s?' done':'');
    b.innerHTML=`<span class="gi">${G.icon}</span><span class="t"><b></b><small></small></span><span class="go">${s?'★'.repeat(s)+'☆'.repeat(3-s):'العب'}</span>`;
    b.querySelector('b').textContent=G.name;b.querySelector('small').textContent=s?(s<3?'أُنجز · أعد اللعب لتحصل على 3 نجوم':'أُنجز بإتقان'):'لم يُحل بعد';
    b.setAttribute('aria-label','تحدي اليوم: '+G.name);b.onclick=()=>openGame(G,{daily:true,key:k,seed:k*97+i*7});list.appendChild(b)});
  let sum=document.getElementById('dsum');if(!sum){sum=document.createElement('p');sum.id='dsum';sum.className='dsum';list.after(sum)}
  sum.textContent=nDone===DG.length?'👑 أنهيت كل تحديات اليوم! عُد غداً لتحديات جديدة.':`أنجزت ${nDone} من ${DG.length} تحديات اليوم`;
  $('dailyDot').hidden=nDone>0;
  let total=0;const cards=$('cards');cards.innerHTML='';
  GAMES.forEach(G=>{const p=G.progress();total+=p.stars;const c=document.createElement('button');c.type='button';c.className='gcard';
    c.innerHTML=`<span class="gi">${G.icon}</span><b></b><small></small><span class="prog"><span>المستوى ${p.level}</span><em>★ ${p.stars}</em></span>`;
    c.querySelector('b').textContent=G.name;c.querySelector('small').textContent=G.desc;c.onclick=()=>openGame(G);cards.appendChild(c)});
  $('totalStars').textContent=total;
  const bs=$('badges');bs.innerHTML='';let got=0;
  ACH.forEach(([id,em,label])=>{const on=!!ach.got[id];if(on)got++;const el=document.createElement('div');el.className='badge'+(on?' got':'');el.innerHTML=`<span class="em">${em}</span><small></small>`;el.querySelector('small').textContent=label;bs.appendChild(el)});
  $('achCount').textContent=got+' من '+ACH.length;$('achBar').style.width=Math.round(got/ACH.length*100)+'%';
}
let hubTab='pGames';try{const t=localStorage.getItem('arcade-tab');if(['pDaily','pGames','pBadges'].includes(t))hubTab=t}catch(e){}
function showTab(id){hubTab=id;try{localStorage.setItem('arcade-tab',id)}catch(e){}
  ['pDaily','pGames','pBadges'].forEach(p=>{$(p).hidden=p!==id});
  document.querySelectorAll('#tabbar [role=tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id));scrollTo(0,0)}
document.querySelectorAll('#tabbar [role=tab]').forEach(b=>b.onclick=()=>{if(b.dataset.tab!==hubTab)snd('tap');showTab(b.dataset.tab)});
function openGame(G,m){
  toastQ.length=0;$('toast').hidden=true;
  if(active&&active.stop)active.stop();active=G;mode=m||null;stage.innerHTML='';$('ctrl').innerHTML='';
  $('gTitle').textContent=G.name;$('help').textContent=G.help;$('dailyTag').hidden=!mode;$('lvlBtn').hidden=!!mode;
  $('hub').hidden=true;$('tabbar').hidden=true;$('play').hidden=false;scrollTo(0,0);G.start();
}
function goHub(){if(active&&active.stop)active.stop();active=null;toastQ.length=0;$('toast').hidden=true;mode=null;stage.innerHTML='';$('play').hidden=true;$('hub').hidden=false;$('tabbar').hidden=false;renderHub();showTab(hubTab)}
$('back').onclick=goHub;
renderHub();showTab(hubTab);
