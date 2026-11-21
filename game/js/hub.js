/* ================= hub ================= */

const GAMES=[SurviveGame,PilotGame];
function pilotCard(){const ps=gState('pilot')||{},lock=!(col.b.dock>0),S=typeof PilotGame!=='undefined';if(!S)return '';
  return `<div class="svcard pvcard"><div class="pvhero">${PilotGame.icon}</div><div class="svbody"><h2>طيّار المدار</h2><p>قُد مركبة المستعمرة في المدار، أسقط أساطيل الغزاة واهزم السفينة الأم كل 5 موجات.</p>
    <div class="svstats"><span><b>${(ps.best||0).toLocaleString('en')}</b><small>أعلى نقاط</small></span><span><b>${ps.bestWave||1}</b><small>أعلى موجة</small></span><span><b>${ps.runs||0}</b><small>رحلات</small></span></div>
    <button class="btn main pvplay${lock?' locked':''}" type="button">${lock?'🔒 يحتاج حوض الإصلاح':'🚀 انطلق'}</button></div></div>`}
function renderHub(){
  drawPrefs();drawRank();drawMissions();
  const d=$('daily'),sv=gState('survive')||{},best=col.surv||0,hero=typeof ART!=='undefined'&&ART.splash?`<img class="svhero" src="${ART.splash}" alt="">`:'';
  const bonus=typeof survBonus==='function'?survBonus():null;
  d.innerHTML=`<div class="svcard">${hero}<div class="svbody"><h2>صمود المدار</h2><p>اخرج من القبة وواجه موجات الكائنات. كل ثانية صمود تجلب موارد للمستعمرة.</p>
    <div class="svstats"><span><b>${fmtTime?fmtTime(best):best}</b><small>أطول صمود</small></span><span><b>${col.skills||0}</b><small>أكثر قتلى</small></span><span><b>${col.sboss||0}</b><small>زعماء</small></span><span><b>${col.sruns||0}</b><small>جولات</small></span></div>
    ${bonus?`<div class="svbonus">🏗️ دعم المستعمرة: <b>+${bonus.dmg}%</b> ضرر · <b>+${bonus.hp}</b> صحة · <b>+${bonus.rate}%</b> سرعة إطلاق</div>`:''}
    <button class="btn main svplay" type="button">⚔️ ابدأ جولة</button></div></div>
    ${pilotCard()}`;
  d.querySelector('.svplay').onclick=()=>{snd('tap');openGame(SurviveGame)};
  {const pb=d.querySelector('.pvplay');if(pb)pb.onclick=()=>{if(!(col.b.dock>0)){snd('err');toast('🔒 ابنِ حوض الإصلاح أولاً');showTab('pColony');setTimeout(()=>openSheet('dock'),300);return}snd('tap');openGame(PilotGame)}}
  {const l=document.getElementById('dlist');if(l)l.remove();const sm=document.getElementById('dsum');if(sm)sm.remove()}
  $('dailyDot').hidden=true;
  let total=0;GAMES.forEach(G=>{total+=G.progress().stars});renderColony();
  $('totalStars').textContent=total;
  drawBadges();
}
function drawBadges(){const bs=$('badges');if(!bs)return;bs.innerHTML='';let got=0;
  [...ACH].sort((x,y)=>(!!ach.got[y[0]])-(!!ach.got[x[0]])).forEach(([id,em,label])=>{const on=!!ach.got[id];if(on)got++;const el=document.createElement('div');el.className='badge'+(on?' got':'');el.innerHTML=`<span class="em">${em}</span><small></small>`;el.querySelector('small').textContent=label;bs.appendChild(el)});
  $('achCount').textContent=got+' من '+ACH.length;$('achBar').style.width=Math.round(got/ACH.length*100)+'%'}
let hubTab='pColony';try{const t=localStorage.getItem('arcade-tab');if(['pDaily','pColony','pBadges'].includes(t))hubTab=t}catch(e){}
function showTab(id){hubTab=id;try{localStorage.setItem('arcade-tab',id)}catch(e){}
  ['pDaily','pColony','pBadges'].forEach(p=>{$(p).hidden=p!==id});document.body.classList.toggle('colfull',id==='pColony');if(id==='pColony')renderColony();if(id==='pBadges')drawBadges();else if(typeof closeSheet==='function')closeSheet();
  document.querySelectorAll('#tabbar [role=tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id));scrollTo(0,0)}
document.querySelectorAll('#tabbar [role=tab]').forEach(b=>b.onclick=()=>{if(b.dataset.tab!==hubTab)snd('tap');showTab(b.dataset.tab)});
function openGame(G,m){
  toastQ.length=0;$('toast').hidden=true;
  if(active&&active.stop)active.stop();active=G;mode=m||null;gPaused=false;curLevel=null;
  // remember which level is on screen so «انسحاب» restarts that one
  if(!G._wrapped){const orig=G.play;G.play=function(l){curLevel=l;return orig.apply(this,arguments)};G._wrapped=1}stage.innerHTML='';$('ctrl').innerHTML='';
  $('gTitle').textContent=G.name;$('help').textContent=G.help;$('dailyTag').hidden=!mode;$('lvlBtn').hidden=!!mode;
  document.body.classList.remove('colfull');if(typeof closeSheet==='function')closeSheet();$('hub').hidden=true;$('tabbar').hidden=true;$('play').hidden=false;scrollTo(0,0);G.start();
}
function goHub(){if(active&&active.stop)active.stop();active=null;toastQ.length=0;$('toast').hidden=true;mode=null;stage.innerHTML='';$('play').hidden=true;$('hub').hidden=false;$('tabbar').hidden=false;renderHub();showTab(hubTab)}
$('back').onclick=goHub;
renderHub();showTab(hubTab);
