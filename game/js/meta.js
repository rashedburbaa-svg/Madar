/* meta layer: crystal shop, background music, colony↔battle links, and the wider badge set */

/* ---------- colony support for the dock ship (like survBonus for the astronaut) ---------- */
function pilotBonus(){const b=col.b;return {dmg:Math.min(30,2*(b.def||0)+1*(b.tower||0)+1*(b.wall||0)),hull:Math.min(60,4*(b.habitat||0)+3*(b.wall||0))}}

/* ---------- battles feed the colony: difficulty and the first battle of the day scale the haul ---------- */
const DIFFM={easy:0.7,normal:1,hard:1.5};
{const _cr=colonyReward;colonyReward=function(id,stars,info){info=info||{};const before={...col.res};_cr(id,stars,info);
  const today=new Date().toDateString(),first=col.bday!==today,m=(DIFFM[info.diff]||1)*(first?2:1);
  const got=[];for(const k of ['m','e','f','c']){const d=(col.res[k]||0)-(before[k]||0);if(d>0&&m!==1){const x=Math.round(d*(m-1));if(x>0){gain(k,x);got.push('+'+fmtN(x)+' '+RES[k][1])}}}
  if(got.length||first){if(first&&Object.keys(col.res).some(k=>(col.res[k]||0)>(before[k]||0)))col.bday=today;
    col.bt=col.bt||{};if(info.diff==='hard')col.bt.hard=(col.bt.hard||0)+1;col.bt[id+'D']=today;colSave();
    if(got.length)setTimeout(()=>toast((first?'🌅 أول معركة اليوم ×2':'')+(info.diff==='hard'?' 🔴 صعب ×1.5':info.diff==='easy'?' 🟢 سهل ×0.7':'')+'  '+got.join('  '),'ach'),2400)}
  battleBadges(id,info);if(typeof renderColony==='function'&&!$('pColony').hidden)renderColony()}}

/* ---------- crystal shop ---------- */
const SHOP=[
  {id:'boost',em:'⚡',n:'مضاعفة الإنتاج',d:'+50% لكل الإنتاج لمدة ساعة',c:25},
  {id:'shield',em:'🛡️',n:'درع الغارات',d:'يصدّ أي غارة خلال 8 ساعات',c:30},
  {id:'harvest',em:'📦',n:'حصاد فوري',d:'إنتاج ساعتين يصلك الآن',c:15},
  {id:'morale',em:'🎊',n:'حفلة للطاقم',d:'+25% معنويات فوراً',c:10},
  {id:'adv',em:'🧭',n:'فريق جاهز',d:'المغامرة التالية متاحة الآن',c:12}];
const shopOn=k=>col.shop&&col.shop[k]>Date.now();
{const _mb=moraleBonus;moraleBonus=function(){return _mb()+(shopOn('boost')?0.5:0)}}
function shopHTML(){col.shop=col.shop||{};let h=`<h3 class="lh">🛒 متجر الجواهر <small>💎 ${fmtN(col.res.c)}</small></h3><div class="blist">`;
  for(const s of SHOP){const act=(s.id==='boost'||s.id==='shield')&&shopOn(s.id),why=act?'':shopWhy(s),ok=col.res.c>=s.c&&!act&&!why;
    h+=`<div class="brow${ok?' ok':''}"><span class="bi" style="font-size:26px;display:grid;place-items:center">${s.em}</span><span class="bt"><b>${s.n}</b><small>${act?'✅ مفعّل · باقٍ '+fmtDur((col.shop[s.id]-Date.now())/1000):why?'⛔ '+why:col.res.c<s.c?'تحتاج '+s.c+' 💎':s.d}</small></span><button class="btn${ok?' main':''}" type="button" data-shop="${s.id}" ${ok?'':'disabled'}>💎 ${s.c}</button></div>`}
  return h+'</div><p class="cd">احصل على الجواهر من الراديو، والمهام، والأوسمة (+5 💎 لكل وسام)، والزعماء، والمعارك.</p>'}
function shopWhy(s){if(s.id==='harvest'&&!Object.keys(BLD).some(b=>bRate(b)>0))return 'لا يوجد إنتاج بعد';
  if(s.id==='morale'&&svInit().morale>=100)return 'المعنويات كاملة 100%';
  if(s.id==='adv'&&svInit().adv.cd<=Date.now())return 'المغامرة متاحة الآن، لا حاجة للشراء';return ''}
function shopBuy(id){{const s0=SHOP.find(x=>x.id===id),w=s0&&shopWhy(s0);if(w){snd('err');toast(w);return}}const s=SHOP.find(x=>x.id===id);if(!s||col.res.c<s.c)return snd('err');col.shop=col.shop||{};accrue();
  if(id==='boost'){if(shopOn('boost'))return;col.shop.boost=Date.now()+3600000}
  else if(id==='shield'){if(shopOn('shield'))return;col.shop.shield=Date.now()+8*3600000;shieldTick()}
  else if(id==='harvest'){const got=[];for(const b of Object.keys(BLD)){const r=bRate(b);if(r>0){const k=BLD[b].prod[0],n=Math.round(r*2);gain(k,n);got.push('+'+fmtN(n)+' '+RES[k][1])}}if(!got.length)return snd('err');setTimeout(()=>toast('📦 '+got.join('  ')),300)}
  else if(id==='morale'){const sv=svInit();if(sv.morale>=100)return snd('err');sv.morale=Math.min(100,sv.morale+25)}
  else if(id==='adv'){const sv=svInit();if(sv.adv.cd<=Date.now())return snd('err');sv.adv.cd=0}
  col.res.c-=s.c;col.shopN=(col.shopN||0)+1;colSave();snd('win');toast(s.em+' '+s.n);unlock('shop1');renderSheet();updRes()}
function shieldTick(){if(shopOn('shield')&&col.raid&&!col.raid.mine&&col.raid.at<col.shop.shield){col.raid.mine=1;col.raid.shield=1;colSave();toast('🛡️ درع الغارات سيصدّ الغارة القادمة','ach')}}
setInterval(shieldTick,15000);
{const _rs=renderSheet;renderSheet=function(){if(sheetId==='shop'){const c=$('csheet').querySelector('.csc');c.innerHTML=shopHTML();c.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>shopBuy(b.dataset.shop));return}_rs()}}
{const _fc=festChip;festChip=function(){return `<button class="cshop${shopOn('boost')?' on':''}" type="button" aria-label="متجر الجواهر">🛒${shopOn('boost')?'<i>⚡</i>':shopOn('shield')?'<i>🛡️</i>':''}</button>`+_fc()}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#colony .cshop, .cshop')){snd('tap');openSheet('shop')}});

/* ---------- more badges: every new one also pays +5 💎 and 10 XP ---------- */
ACH.push(
  ['col_hq3','🏢','القيادة: المستوى 3'],['col_hq7','🏰','القيادة: المستوى 7'],['col_hq10','👑','القيادة: المستوى 10'],
  ['col_max1','⭐','أول مبنى بالمستوى 10'],['col_all5','🏙️','كل المباني مستوى 5'],['col_dome5','🫧','نصف القبة الزجاجية'],['col_dome','🔮','اكتمال القبة الزجاجية'],
  ['col_tow','🗼','أبراج البلازما'],['col_tech10','🔬','10 مستويات أبحاث'],['col_techall','🧪','إتمام كل الأبحاث'],['col_crew','🧑‍🚀','طاقم من 15 رائداً'],
  ['col_rich','💰','500 جوهرة في الخزنة'],['col_raid1','🛡️','صدّ أول غارة'],['col_raid10','🏯','صدّ 10 غارات'],
  ['tf_sky','🌤️','سماء زرقاء'],['tf_rain','🌧️','غيوم ومطر'],['tf_forest','🌲','غابات المدار'],['tf_eden','🌳','جنّة المدار'],
  ['sv_adv1','🧭','أول مغامرة'],['sv_adv10','🗺️','10 مغامرات'],['sv_relic','🏺','أول أثر قديم'],['sv_happy','😄','معنويات 100%'],
  ['gal_1','🌌','أول رحلة في المجرة'],['gal_all','🪐','زيارة الكواكب الستة'],
  ['surv10','⏱️','الصمود 10 دقائق'],['surv_w15','🌊','الموجة 15 في الصمود'],['surv_hard','🔥','3 دقائق على «صعب»'],['surv_50','🎖️','50 جولة صمود'],['surv_chars','🎭','اللعب بكل الرواد'],
  ['pilot_w20','🌠','الموجة 20 في طيّار المدار'],['pilot_50k','✈️','50 ألف نقطة طيران'],['pilot_hard','☄️','الموجة 10 على «صعب»'],['pilot_fleet','🛩️','امتلاك كل الطائرات'],
  ['hard1','🔴','أول معركة على «صعب»'],['both','⚔️','المعركتان في يوم واحد'],['shop1','🛒','أول شراء من المتجر'],['rank4','🚀','رتبة قائد مركبة'],['badges25','🏅','25 وساماً']);
{const _u=unlock;unlock=function(id){const had=ach.got[id];_u(id);if(!had&&ach.got[id]&&typeof gain==='function'&&typeof col!=='undefined'){gain('c',5);addXP(10);colSave();if(typeof drawBadges==='function')drawBadges();if(typeof drawRank==='function')drawRank();setTimeout(()=>toast('🏅 مكافأة الوسام: +5 💎'),1300);
  if(Object.keys(ach.got).length>=25&&id!=='badges25')setTimeout(()=>unlock('badges25'),2600)}}}
function battleBadges(id,i){col.bt=col.bt||{};const today=new Date().toDateString();
  if(i.diff==='hard')unlock('hard1');
  if(id==='survive'){const t=i.time||0;if(t>=600)unlock('surv10');if((i.wave||0)>=15)unlock('surv_w15');if(i.diff==='hard'&&t>=180)unlock('surv_hard');if((col.sruns||0)>=50)unlock('surv_50');
    if(i.char){col.bt.chars=col.bt.chars||{};col.bt.chars[i.char]=1;if(Object.keys(col.bt.chars).length>=4)unlock('surv_chars')}}
  if(id==='pilot'){if((i.wave||0)>=20)unlock('pilot_w20');if((i.score||0)>=50000)unlock('pilot_50k');if(i.diff==='hard'&&(i.wave||0)>=10)unlock('pilot_hard');if((i.planes||0)>=4)unlock('pilot_fleet')}
  col.bt[id+'D']=today;if(col.bt.surviveD===today&&col.bt.pilotD===today)unlock('both');colSave()}
function metaBadges(){if(typeof col==='undefined'||!col.b)return;const b=col.b,U=unlock,ids=Object.keys(BLD);
  if(b.hq>=3)U('col_hq3');if(b.hq>=5)U('col_hq5');if(ids.every(k=>(b[k]||0)>=1))U('col_all');if(col.done)U('col_ship');if(b.hq>=7)U('col_hq7');if(b.hq>=10)U('col_hq10');
  if(ids.some(k=>b[k]>=10))U('col_max1');if(ids.every(k=>(b[k]||0)>=5))U('col_all5');
  if(b.wall>=5)U('col_dome5');if(b.wall>=10)U('col_dome');if((b.tower||0)>=7)U('col_tow');
  const tl=Object.values(col.tech||{}).reduce((a,v)=>a+(v||0),0);if(tl>=10)U('col_tech10');if(typeof TECH!=='undefined'&&tl>=Object.keys(TECH).length*5)U('col_techall');
  if(crew()>=15)U('col_crew');if(col.res.c>=500)U('col_rich');{const rw=(col.raidWins||0)+(col.raidAll||0);if(rw>=1)U('col_raid1');if(rw>=10)U('col_raid10')}
  if(typeof tfStage==='function'&&col.tf){const s=tfStage();if(s>=2)U('tf_sky');if(s>=3)U('tf_rain');if(s>=7)U('tf_forest');if(s>=9)U('tf_eden')}
  if(col.sv){const n=Object.values(col.sv.adv.done||{}).reduce((a,v)=>a+v,0);if(n>=1)U('sv_adv1');if(n>=10)U('sv_adv10');if(col.sv.relics>=1)U('sv_relic');if(col.sv.morale>=100)U('sv_happy')}
  if(typeof artCount==='function'&&col.gal){const a=artCount();if(a>=1)U('gal_1');if(a>=6)U('gal_all')}
  if(typeof rankOf==='function'&&rankOf(prof.xp)>=3)U('rank4');
  const s=gState('survive',{}),p=gState('pilot',{});if((s.bestTime||0)>=600)U('surv10');if((s.bestWave||0)>=15)U('surv_w15');if((p.bestWave||0)>=20)U('pilot_w20');if((p.best||0)>=50000)U('pilot_50k');if((p.planes||[]).length>=4)U('pilot_fleet');
  if(Object.keys(ach.got).length>=25)U('badges25')}
setTimeout(metaBadges,4000);setInterval(metaBadges,8000);

/* ---------- background music: a calm generative theme in the colony, a driving one in battle ---------- */
if(prefs.music==null)prefs.music=true;
const MUS={on:null,g:null,t:0,step:0,iv:null};
const NOTE=n=>440*Math.pow(2,(n-69)/12);
// colony: A minor with a Hijaz touch; battle: Am F G E at a faster pulse
const SONG={colony:{bpm:76,ch:[[57,60,64],[50,53,57,62],[52,56,59,64],[57,60,64],[53,57,60],[55,59,62],[52,56,59],[57,60,64]],scale:[57,59,60,62,64,65,68,69,71,72,76],vol:0.05},
  battle:{bpm:124,ch:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],scale:[57,60,62,64,65,67,69,72],vol:0.042}};
function mtone(f,t,d,type,v,dest,cut){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(0.04,d*0.3));g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  if(cut){const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;o.connect(fl);fl.connect(g)}else o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+0.05)}
function mpad(fs,t,d,dest){const g=AC.createGain(),fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=900;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.22,t+d*0.35);g.gain.linearRampToValueAtTime(0.0001,t+d);fl.connect(g);g.connect(dest);
  fs.forEach((f,i)=>{for(const det of [-5,5]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;const og=AC.createGain();og.gain.value=0.12/fs.length;o.connect(og);og.connect(fl);o.start(t);o.stop(t+d+0.05)}})}
function mkick(t,dest){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+0.12);g.gain.setValueAtTime(0.7,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);o.connect(g);g.connect(dest);o.start(t);o.stop(t+0.2)}
function mschedule(){if(!MUS.on||!AC)return;const S=SONG[MUS.on],sp=60/S.bpm/4;
  while(MUS.t<AC.currentTime+0.25){const st=MUS.step,t=MUS.t,bar=Math.floor(st/16),chord=S.ch[bar%S.ch.length],pos=st%16;
    if(MUS.on==='colony'){
      if(pos===0)mpad(chord.map(NOTE),t,sp*16+0.4,MUS.g);
      if(pos===0||pos===8)mtone(NOTE(chord[0]-12),t,sp*7,'triangle',0.32,MUS.g,600);
      if(pos%2===0&&Math.random()<0.55){const n=Math.random()<0.6?chord[Math.floor(Math.random()*chord.length)]+12:S.scale[Math.floor(Math.random()*S.scale.length)]+12;mtone(NOTE(n),t,sp*5,'sine',0.16,MUS.g)}
    }else{
      if(pos%4===0)mkick(t,MUS.g);
      if(pos%2===0)mtone(NOTE(chord[0]-12+(pos%8===6?12:0)),t,sp*1.6,'sawtooth',0.22,MUS.g,520);
      {const arp=[0,1,2,1];mtone(NOTE(chord[arp[pos%4]%chord.length]+12+(pos>=8?12:0)),t,sp*0.9,'square',0.05,MUS.g,2200)}
      if(pos===0)mpad(chord.map(NOTE),t,sp*16,MUS.g);
      if((pos===4||pos===12))mtone(1800,t,0.05,'triangle',0.05,MUS.g,4000)}
    MUS.step++;MUS.t+=sp}}
function mstart(mode){if(MUS.on===mode)return;mstop(true);try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){return}
  const g=AC.createGain();g.gain.setValueAtTime(0.0001,AC.currentTime);g.gain.linearRampToValueAtTime(SONG[mode].vol,AC.currentTime+2);g.connect(AC.destination);
  MUS.g=g;MUS.on=mode;MUS.t=AC.currentTime+0.1;MUS.step=0;MUS.iv=setInterval(mschedule,60);mschedule()}
function mstop(fast){if(!MUS.on)return;clearInterval(MUS.iv);const g=MUS.g;MUS.on=null;MUS.g=null;try{g.gain.cancelScheduledValues(AC.currentTime);g.gain.setValueAtTime(g.gain.value,AC.currentTime);g.gain.linearRampToValueAtTime(0.0001,AC.currentTime+(fast?0.3:0.8));setTimeout(()=>{try{g.disconnect()}catch(e){}},1200)}catch(e){}}
function musSync(){if(!prefs.sound||!prefs.music||document.hidden)return mstop();const play=$('play')&&!$('play').hidden;if(play)return mstart('battle');if(!$('hub').hidden)return mstart('colony');mstop()}
// the music replaces the old drone
ambStart=function(){};ambStop=function(){};ambSync=function(){musSync()};
addEventListener('pointerdown',()=>musSync(),{passive:true});document.addEventListener('visibilitychange',musSync);setInterval(()=>{if(MUS.on||(AC&&AC.state==='running'))musSync()},1000);
{const mb=$('musBtn');if(mb){const draw=()=>{mb.classList.toggle('off',!prefs.music);mb.textContent='🎵'};draw();mb.onclick=()=>{prefs.music=!prefs.music;save('arcade-prefs',prefs);draw();snd('tap');musSync()}}}
