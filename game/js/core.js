/* ================= shared ================= */
const $=id=>document.getElementById(id);
function load(k,d){try{const v=localStorage.getItem(k);return v==null?JSON.parse(JSON.stringify(d)):Object.assign(JSON.parse(JSON.stringify(d)),JSON.parse(v))}catch(e){return JSON.parse(JSON.stringify(d))}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,R){for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const toastQ=[];let toastBusy=false;
function toast(t,cls){toastQ.push([t,cls]);if(!toastBusy)nextToast()}
function nextToast(){const it=toastQ.shift();const el=$('toast');if(!it){el.hidden=true;toastBusy=false;return}toastBusy=true;el.textContent=it[0];el.className='toast '+(it[1]||'');el.hidden=false;setTimeout(nextToast,it[1]?2600:1700)}
const STAR='M50 6c5 28 16 39 44 44-28 5-39 16-44 44-5-28-16-39-44-44 28-5 39-16 44-44z';
const starSVG=on=>`<svg viewBox="0 0 100 100"><path class="${on?'on':'off'}" d="${STAR}"/></svg>`;
const fmtTime=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const IC={
  undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l-5 5M15 14l-5-5M15 14H8a5 5 0 0 1 0-10h1"/></svg>',
  hint:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  erase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H9L4 15l10-10 6 6-7 7M8 11l6 6"/></svg>',
  pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11l2 2 4-4"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M8 16h.01"/></svg>',
  aim:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  flip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M8 7H4v10h4M16 7h4v10h-4"/></svg>',
  gauge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18a8 8 0 1 1 16 0M12 18l4-6"/></svg>'
};

/* settings, sound, vibration */
const prefs=load('arcade-prefs',{sound:true,vibe:true,aim:true});
let AC=null;
function snd(type){
  if(!prefs.sound)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
    const seqs={tap:[[620,.04]],rot:[[430,.04]],ok:[[660,.07],[880,.09]],win:[[523,.11],[659,.11],[784,.12],[1047,.25]],err:[[170,.16]],splash:[[260,.1],[150,.2]],hit:[[240,.03]],flip:[[700,.03]],sink:[[880,.07],[660,.07],[990,.18]],ach:[[784,.09],[1175,.09],[1568,.22]]};
    let at=AC.currentTime;(seqs[type]||seqs.tap).forEach(([f,d])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type==='err'?'square':type==='splash'?'triangle':'sine';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(type==='err'?.08:.16,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(AC.destination);o.start(at);o.stop(at+d+.03);at+=d*.85});
  }catch(e){}
}
function buzz(ms){if(prefs.vibe&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}}
function drawPrefs(){$('sndBtn').textContent=prefs.sound?'🔊':'🔇';$('sndBtn').classList.toggle('off',!prefs.sound);$('vibBtn').classList.toggle('off',!prefs.vibe)}
$('sndBtn').onclick=()=>{prefs.sound=!prefs.sound;save('arcade-prefs',prefs);drawPrefs();snd('ok')};
$('vibBtn').onclick=()=>{prefs.vibe=!prefs.vibe;save('arcade-prefs',prefs);drawPrefs();buzz(40)};

/* screen helpers */
const stage=$('stage');let active=null,mode=null;
function setStats(items){$('stats').innerHTML=items.map(([id,label,cls])=>`<div class="stat ${cls||''}"><b id="${id}">-</b><small>${label}</small></div>`).join('')}
function setStat(id,v){const e=$(id);if(e)e.textContent=v}
function btn(label,icon,fn,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.innerHTML=(icon||'')+'<span></span>';b.lastChild.textContent=label;b.onclick=fn;$('ctrl').appendChild(b);return b}
function clearOverlays(){stage.querySelectorAll('.overlay').forEach(o=>o.remove())}
function winBox({title,text,stars,onNext,label}){
  const o=document.createElement('div');o.className='overlay';
  o.innerHTML=`<h3></h3><div class="stars">${[1,2,3].map(k=>starSVG(k<=stars)).join('')}</div><p></p><button class="btn main" type="button"></button>`;
  o.querySelector('h3').textContent=title;o.querySelector('p').textContent=text;const b=o.querySelector('button');b.textContent=label||'المستوى التالي';
  b.onclick=()=>{o.remove();onNext()};setTimeout(()=>{stage.appendChild(o);b.focus()},350);
}

function loseBox({title,text,onRetry}){
  snd('err');buzz([40,40,80]);const o=document.createElement('div');o.className='overlay';
  o.innerHTML='<h3></h3><p></p><button class="btn main" type="button">حاول مرة أخرى</button><button class="btn" type="button">رجوع إلى القاعة</button>';
  o.querySelector('h3').textContent=title;o.querySelector('p').textContent=text;const [b1,b2]=o.querySelectorAll('button');
  b1.onclick=()=>{o.remove();onRetry()};b2.onclick=()=>{o.remove();goHub()};setTimeout(()=>{stage.appendChild(o);b1.focus()},400);
}
/* progress */
function gState(id,extra){return load('arcade-'+id,Object.assign({level:1,best:1,stars:{}},extra||{}))}
function gSave(id,st){save('arcade-'+id,st)}
function starTotal(st){return Object.values(st.stars||{}).reduce((a,b)=>a+b,0)}
function allStars(){return GAMES.reduce((a,G)=>a+starTotal(gState(G.id)),0)}

/* daily */
function todayKey(d){d=d||new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return todayKey(d)}
const daily=load('arcade-daily',{streak:0,last:0,done:{},count:0});
function dailyDone(id){return (daily.done[todayKey()]||{})[id]}

/* achievements */
const ACH=[
  ['first','🎉','أول فوز'],['three','⭐','أول 3 نجوم'],['s50','🌟','50 نجمة'],['s150','💫','150 نجمة'],
  ['grid10','🔗','الشبكة: المستوى 10'],['grid9','🧩','لوحة 9×9'],['wrap','🌀','أول شبكة ملتفّة'],['sud_clean','🧠','سودوكو بلا أخطاء'],
  ['sud_fast','⚡','سودوكو في أقل من 5 دقائق'],['sud10','🔢','سودوكو: المستوى 10'],['ace','🏆','ضربة واحدة في الجولف'],['under','🐦','تحت البار'],['beat_cpu','🤖','فوز على الكمبيوتر في الجولف'],
  ['eagle_eye','🦅','اختلافات بلا أخطاء'],['diff_fast','⏱️','اختلافات في أقل من دقيقة'],['memory','🃏','ذاكرة مثالية'],['allfive','🎮','فوز في كل الألعاب'],
  ['t2048','🔷','الوصول إلى 2048'],['mines_clean','☄️','حقل كويكبات بلا خسارة قلب'],['nono_clean','🖼️','نونوجرام بلا مساعدة'],['words_clean','📝','كلمات متقاطعة بلا أخطاء'],
  ['surv2','🛡️','الصمود دقيقتين'],['surv5','⚔️','الصمود 5 دقائق'],['surv_boss','👹','هزيمة أول زعيم'],['surv_k1000','💀','1000 عدو في الصمود'],['surv_all_boss','🌌','هزيمة زعماء الكواكب الستة'],['surv_lab','🔬','إكمال كل تطويرات المختبر'],
  ['daily1','📅','أول تحدي يومي'],['streak3','🔥','سلسلة 3 أيام'],['streak7','☄️','سلسلة 7 أيام'],['dailyall','👑','كل تحديات اليوم']
];
const ach=load('arcade-ach',{got:{},won:{}});
function unlock(id){if(ach.got[id])return;ach.got[id]=Date.now();save('arcade-ach',ach);const a=ACH.find(x=>x[0]===id);if(a){snd('ach');buzz([30,40,30]);toast('🏅 وسام جديد: '+a[2],'ach')}}
function onWin(id,level,stars,info){
  info=info||{};snd('win');buzz([20,30,60]);
  ach.won[id]=true;save('arcade-ach',ach);
  unlock('first');if(stars===3)unlock('three');
  const tot=allStars();if(tot>=50)unlock('s50');if(tot>=150)unlock('s150');
  if(GAMES.every(G=>ach.won[G.id]))unlock('allfive');
  if(id==='grid'){if(level>=10)unlock('grid10');if(info.n===9)unlock('grid9');if(info.wrap)unlock('wrap')}
  if(id==='sudoku'){if(info.clean)unlock('sud_clean');if(info.time<300)unlock('sud_fast');if(level>=10)unlock('sud10')}
  if(id==='golf'){if(info.strokes===1)unlock('ace');if(info.strokes<info.par)unlock('under');if(info.beatCpu)unlock('beat_cpu')}
  if(id==='diff'){if(info.mistakes===0&&info.hints===0)unlock('eagle_eye');if(info.time<60)unlock('diff_fast')}
  if(id==='memory'&&info.perfect)unlock('memory');
  if(id==='g2048'&&info.max>=2048)unlock('t2048');
  if(id==='mines'&&info.lives===3)unlock('mines_clean');
  if(id==='nono'&&info.clean)unlock('nono_clean');
  if(id==='words'&&info.clean)unlock('words_clean');
  if(mode&&mode.daily){const k=todayKey();const first=!daily.done[k]||!Object.keys(daily.done[k]).length;
    daily.done[k]=daily.done[k]||{};daily.done[k][id]=Math.max(daily.done[k][id]||0,stars);
    if(first){daily.streak=daily.last===yesterdayKey()?daily.streak+1:daily.last===k?daily.streak:1;daily.last=k;daily.count++}
    Object.keys(daily.done).forEach(d=>{if(+d<k-100)delete daily.done[d]});save('arcade-daily',daily);
    unlock('daily1');if(daily.streak>=3)unlock('streak3');if(daily.streak>=7)unlock('streak7');
    if(GAMES.filter(G=>!G.noDaily).every(G=>daily.done[k][G.id]))unlock('dailyall')}
}
/* record + next */
function finishLevel(G,st,level,stars,info,title,text){
  if(mode&&mode.daily){onWin(G.id,level,stars,info);winBox({title,text,stars,label:'رجوع إلى القاعة',onNext:goHub});return}
  st.stars[level]=Math.max(st.stars[level]||0,stars);st.level=Math.max(st.level,level+1);st.best=Math.max(st.best,level+1);gSave(G.id,st);
  onWin(G.id,level,stars,info);
  winBox({title,text,stars,onNext:()=>G.play(level+1)});
}
/* level picker */
function openPicker(){
  if(!active||(mode&&mode.daily))return;const st=gState(active.id);clearOverlays();
  const o=document.createElement('div');o.className='overlay picker';
  o.innerHTML='<h3 style="font-size:24px">اختر المستوى</h3><p>أعد أي مستوى لتحسّن نجومك</p><div class="levels"></div><button class="btn" type="button">إغلاق</button>';
  const box=o.querySelector('.levels');
  for(let l=st.best;l>=1;l--){const b=document.createElement('button');b.type='button';b.className='lv'+(l===st.level?' cur':'');const s=st.stars[l]||0;
    b.innerHTML=`${l}<small>${s?'★'.repeat(s)+'☆'.repeat(3-s):l===st.best?'جديد':'☆☆☆'}</small>`;b.onclick=()=>{o.remove();active.play(l)};box.appendChild(b)}
  o.querySelector('.btn').onclick=()=>o.remove();stage.appendChild(o);o.scrollTop=0;
}
$('lvlBtn').onclick=openPicker;
