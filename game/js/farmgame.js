/* «مزرعة المدار»: grow crops in vertical space-farming capsules; harvests feed the colony and fill crew orders */
const FarmGame=(function(){
  const CROPS=[
    {id:'let',em:'🥬',n:'خس'},{id:'tom',em:'🍅',n:'طماطم'},{id:'car',em:'🥕',n:'جزر'},
    {id:'str',em:'🍓',n:'فراولة'},{id:'corn',em:'🌽',n:'ذرة'},{id:'pep',em:'🌶️',n:'فلفل حار'},
    {id:'mel',em:'🍉',n:'بطيخ'},{id:'mush',em:'🍄',n:'فطر المدار'}];CROPS.forEach(c=>Object.assign(c,BAL.farm.crops[c.id]));   // grow seconds, food, xp, level needed, crystal
  const CR=id=>CROPS.find(c=>c.id===id);
  const TRAYS=BAL.farm.trays,XPL=l=>Math.round(BAL.farm.xp.base*Math.pow(BAL.farm.xp.growth,l-1));
  const UPG=[{id:'lamp',em:'💡',n:'مصابيح النمو',d:'نمو أسرع 15% لكل مستوى',max:BAL.farm.up.lamp.max,cost:l=>({m:BAL.farm.up.lamp.m*Math.pow(BAL.farm.up.lamp.growth,l)})},{id:'spr',em:'🚿',n:'رشاشات آلية',d:'تسقي النباتات تلقائياً',max:BAL.farm.up.spr.max,cost:()=>({c:BAL.farm.up.spr.c})},{id:'net',em:'🕸️',n:'شبكة الحماية',d:'الآفات أقل بالنصف',max:BAL.farm.up.net.max,cost:()=>({c:BAL.farm.up.net.c})}];
  let st,iv=0,root=null,pick=null;
  const fl=()=>Math.max(1,col.b.farm||1),ncap=()=>Math.min(BAL.farm.caps.max,BAL.farm.caps.base+Math.ceil((col.b.farm||0)/2));
  const speed=()=>1+BAL.farm.up.lamp.speed*(st.up.lamp||0);
  function init(){st=gState('farm',{caps:[],inv:{},lv:1,xp:0,up:{},orders:[],harv:0,done:0});st.up=st.up||{};st.inv=st.inv||{};while(st.caps.length<ncap())st.caps.push(Array.from({length:TRAYS},()=>null));fillOrders()}
  const save=()=>gSave('farm',st);
  // growth: a crop needs water once it is half grown, and pauses while a pest sits on it
  function grow(now){for(const cap of st.caps)for(const tr of cap){if(!tr)continue;const c=CR(tr.c),dt=Math.max(0,(now-tr.last)/1000);tr.last=now;if(tr.g>=c.t)continue;
      if(st.up.spr&&tr.g>=c.t/2)tr.w=1;if(tr.bug||(tr.g>=c.t/2&&!tr.w)){continue}tr.g=Math.min(c.t,tr.g+dt*speed());
      if(!tr.bug&&tr.g<c.t&&Math.random()<dt*(st.up.net?0.0015:0.003))tr.bug=1}}
  function fillOrders(){const unl=CROPS.filter(c=>c.lv<=st.lv);while(st.orders.length<3){const k=1+Math.floor(Math.random()*Math.min(3,unl.length)),want={};let food=0,cr=0;
      for(let i=0;i<k;i++){const c=unl[Math.floor(Math.random()*unl.length)];const n=1+Math.floor(Math.random()*3);want[c.id]=(want[c.id]||0)+n;food+=c.f*n;cr+=c.c||0}
      const who=CREWN[Math.floor(Math.random()*CREWN.length)];st.orders.push({who:who[0],want,food:Math.round(food*1.6),c:2+Math.round(food/600)+cr})}}
  function addXP_(n){st.xp+=n;let up=false;while(st.xp>=XPL(st.lv)){st.xp-=XPL(st.lv);st.lv++;up=true}if(up){snd('ach');const nu=CROPS.filter(c=>c.lv===st.lv);toast('🌾 مستوى المزرعة '+st.lv+(nu.length?' · بذور جديدة: '+nu.map(c=>c.em+' '+c.n).join('، '):''),'ach');if(st.lv>=5&&typeof unlock==='function')unlock('farm_lv5')}}
  function stg(tr){const c=CR(tr.c),p=tr.g/c.t;return p>=1?3:p>=0.5?2:p>=0.15?1:0}
  function trayHTML(tr,ci,ti){if(!tr)return `<button class="ftray empty" type="button" data-c="${ci}" data-t="${ti}"><span class="fplus">＋</span></button>`;
    const c=CR(tr.c),s=stg(tr),p=Math.min(1,tr.g/c.t),need=!tr.w&&tr.g>=c.t/2&&s<3;
    const em=s===0?'🌰':s===1?'🌱':c.em,left=Math.max(0,(c.t-tr.g)/speed());
    return `<button class="ftray s${s}${need?' thirsty':''}${tr.bug?' bug':''}" type="button" data-c="${ci}" data-t="${ti}"><span class="fpl">${em}</span>${tr.bug?'<span class="fbug">🐛</span>':''}${need?'<span class="fwat">💧</span>':''}
      <span class="fbar"><i style="width:${(p*100).toFixed(0)}%"></i></span><small>${s===3?'✨ جاهز':tr.bug?'آفة!':need?'يحتاج ماء':fmtDur(left)}</small></button>`}
  function render(){if(!root)return;const now=Date.now();grow(now);
    const inv=Object.entries(st.inv).filter(([,n])=>n>0),food=inv.reduce((a,[k,n])=>a+CR(k).f*n,0);
    root.querySelector('.fhead').innerHTML=`<span>🌾 مستوى <b>${st.lv}</b></span><span class="fxp"><i style="width:${(st.xp/XPL(st.lv)*100).toFixed(0)}%"></i></span><span>💡 ×${speed().toFixed(2)}</span><span>🧺 ${st.harv}</span><button class="fupb" type="button" data-upfarm>⬆️ المزرعة ${col.b.farm||0}</button>`;
    root.querySelector('.fcaps').innerHTML=st.caps.map((cap,ci)=>`<div class="fcap"><div class="fcapt">كبسولة ${ci+1}</div><div class="fglass">${cap.map((tr,ti)=>trayHTML(tr,ci,ti)).join('')}</div><div class="fbase"></div></div>`).join('')+(st.caps.length<7?`<div class="fcap locked"><div class="fglass"><span>🔒</span><small>طوّر المزرعة المائية للمستوى ${Math.min(14,(st.caps.length-1)*2+1)}</small></div></div>`:'');
    root.querySelector('.finv').innerHTML=inv.length?inv.map(([k,n])=>`<span>${CR(k).em} ${n}</span>`).join('')+`<button class="btn main" type="button" data-send>📦 أرسل للمستعمرة · 🌱 ${fmtN(food*(1+0.1*fl()))}</button>`:'<small>المخزن فارغ · احصد المحاصيل الناضجة</small>';
    root.querySelector('.forders').innerHTML=st.orders.map((o,i)=>{const ok=Object.entries(o.want).every(([k,n])=>(st.inv[k]||0)>=n);return `<div class="ford${ok?' ok':''}"><b>🧑‍🚀 ${o.who}</b><span>${Object.entries(o.want).map(([k,n])=>`${CR(k).em}×${n}`).join(' ')}</span><small>🌱 ${fmtN(o.food)} · 💎 ${o.c}</small><button class="btn${ok?' main':''}" type="button" data-ord="${i}" ${ok?'':'disabled'}>سلّم</button></div>`}).join('');
    root.querySelector('.fupg').innerHTML=UPG.map(u=>{const l=st.up[u.id]||0,mx=l>=u.max,c=u.cost(l),txt=c.c?'💎 '+c.c:'⛏️ '+fmtN(c.m),can=!mx&&(c.c?col.res.c>=c.c:col.res.m>=c.m);return `<button class="fup${can?' ok':''}" type="button" data-up="${u.id}" ${can?'':'disabled'}><b>${u.em} ${u.n}${u.max>1?' '+l+'/'+u.max:''}</b><small>${u.d}</small><i>${mx?'✅':txt}</i></button>`}).join('');
    save()}
  function seedPicker(ci,ti){const o=document.createElement('div');o.className='fpick';const unl=CROPS;
    o.innerHTML=`<div class="fpk"><h4>🌱 اختر البذرة <small>زراعتها تستهلك طاقة</small></h4><div class="fseeds">${unl.map(c=>{const lock=c.lv>st.lv,e=Math.ceil(c.t/12),ok=!lock&&col.res.e>=e;return `<button type="button" class="fseed${lock?' lock':''}" data-s="${c.id}" ${ok?'':'disabled'}><span>${lock?'🔒':c.em}</span><b>${c.n}</b><small>${lock?'مستوى '+c.lv:`⏱️ ${fmtDur(c.t/speed())} · ⚡ ${e}`}</small><small>🌱 ${fmtN(c.f)}${c.c?' · 💎 '+c.c:''}</small></button>`}).join('')}</div><button class="btn" type="button" data-x>إلغاء</button></div>`;
    root.appendChild(o);o.querySelector('[data-x]').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};
    o.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const c=CR(b.dataset.s),e=Math.ceil(c.t/12);if(col.res.e<e){snd('err');return}col.res.e-=e;colSave();updRes&&updRes();st.caps[ci][ti]={c:c.id,g:0,w:0,last:Date.now()};snd('build');o.remove();render()})}
  function tap(ci,ti,el){const tr=st.caps[ci][ti];if(!tr){seedPicker(ci,ti);return}const c=CR(tr.c);
    if(tr.bug){tr.bug=0;snd('strike');addXP_(1);fx(el,'🐛 ✖');render();return}
    if(!tr.w&&tr.g>=c.t/2&&tr.g<c.t){tr.w=1;snd('ok');fx(el,'💧');render();return}
    if(tr.g>=c.t){st.caps[ci][ti]=null;st.inv[c.id]=(st.inv[c.id]||0)+1;st.harv++;addXP_(c.xp);snd('coin');buzz&&buzz(15);fx(el,'+1 '+c.em);
      if(st.harv===1&&typeof unlock==='function')unlock('farm_first');if(st.harv>=100&&typeof unlock==='function')unlock('farm_100');render();return}
    snd('tap');fx(el,'⏳ '+fmtDur((c.t-tr.g)/speed()))}
  function fx(el,t){if(!el)return;const r=el.getBoundingClientRect(),R=root.getBoundingClientRect(),d=document.createElement('div');d.className='ffx';d.textContent=t;d.style.left=(r.left-R.left+r.width/2)+'px';d.style.top=(r.top-R.top)+'px';root.appendChild(d);setTimeout(()=>d.remove(),1100)}
  function send(){let food=0;for(const [k,n] of Object.entries(st.inv))food+=CR(k).f*n;if(!food)return;food=Math.round(food*(1+0.1*fl()));st.inv={};accrue();gain('f',food);colSave();snd('win');toast('📦 وصل المستعمرة 🌱 +'+fmtN(food),'ach');render()}
  function order(i){const o=st.orders[i];if(!o||!Object.entries(o.want).every(([k,n])=>(st.inv[k]||0)>=n))return;for(const [k,n] of Object.entries(o.want))st.inv[k]-=n;
    accrue();gain('f',o.food);gain('c',o.c);colSave();st.done++;addXP_(10);st.orders.splice(i,1);fillOrders();snd('win');toast(`🧑‍🚀 ${o.who}: شكراً! 🌱 +${fmtN(o.food)} 💎 +${o.c}`,'ach');if(st.done>=10&&typeof unlock==='function')unlock('farm_orders');render()}
  function buyUp(id){const u=UPG.find(x=>x.id===id),l=st.up[id]||0;if(!u||l>=u.max)return;const c=u.cost(l);if(c.c){if(col.res.c<c.c)return snd('err');col.res.c-=c.c}else{if(col.res.m<c.m)return snd('err');col.res.m-=c.m}colSave();st.up[id]=l+1;snd('build');toast(u.em+' '+u.n);render()}
  return {id:'farm',name:'مزرعة المدار',noDaily:true,desc:'ازرع المحاصيل في كبسولات فضائية عمودية',
    help:'ازرع البذور في صواني الكبسولات العمودية (كل زراعة تستهلك طاقة). عندما يصل النبات لنصف نموه يحتاج ماء 💧 فالمسه. أزل الآفات 🐛 بلمسها. احصد الناضج ✨ ثم أرسل المحصول للمستعمرة غذاءً، أو سلّمه لطلبات الطاقم مقابل غذاء وجواهر. طوّر المزرعة المائية في المستعمرة لتفتح كبسولات أكثر.',
    icon:'<svg viewBox="0 0 48 48"><rect x="15" y="4" width="18" height="40" rx="9" fill="#bfefff" fill-opacity=".35" stroke="#9fe8ff" stroke-width="2"/><g font-size="9" text-anchor="middle"><text x="24" y="16">🥬</text><text x="24" y="27">🍅</text><text x="24" y="38">🍓</text></g></svg>',
    progress(){const s=gState('farm',{});return {level:s.lv||1,stars:0}},
    play(){},start(){init();stage.innerHTML='';root=document.createElement('div');root.className='farmg';
      root.innerHTML=`<div class="fhead"></div><div class="fcaps"></div><h4 class="fh">🧺 المخزن</h4><div class="finv"></div><h4 class="fh">📋 طلبات الطاقم</h4><div class="forders"></div><h4 class="fh">🛠️ تطوير المزرعة</h4><div class="fupg"></div>`;
      stage.appendChild(root);root.onclick=e=>{const t=e.target.closest('.ftray');if(t){tap(+t.dataset.c,+t.dataset.t,t);return}if(e.target.closest('[data-send]'))return send();if(e.target.closest('[data-upfarm]')){snd('tap');goHub();setTimeout(()=>{showTab('pColony');openSheet('farm')},250);return}const o=e.target.closest('[data-ord]');if(o)return order(+o.dataset.ord);const u=e.target.closest('[data-up]');if(u)return buyUp(u.dataset.up)};
      render();iv=setInterval(()=>{if(!root.querySelector('.fpick'))render()},1000)},
    stop(){clearInterval(iv);if(st){grow(Date.now());save()}root=null},
    pauseExt(){},resumeExt(){},forfeit(){return false}}})();
GAMES.push(FarmGame);
if(typeof ACH!=='undefined')ACH.push(['farm_first','🥬','أول محصول من الكبسولات'],['farm_100','🧺','100 محصول'],['farm_orders','📋','تسليم 10 طلبات للطاقم'],['farm_lv5','🌾','مزرعة المدار: المستوى 5']);
// the battles tab gets a farm card; the farm building and its interior open the game
function farmCard(){const s=gState('farm',{})||{},lock=!(col.b.farm>0);
  return `<div class="svcard fvcard"><div class="pvhero">${FarmGame.icon}</div><div class="svbody"><h2>مزرعة المدار</h2><p>ازرع الخس والطماطم والفراولة وحتى فطر المدار في كبسولات زراعة عمودية، وأطعم مستعمرتك.</p>
    <div class="svstats"><span><b>${s.lv||1}</b><small>المستوى</small></span><span><b>${s.harv||0}</b><small>محاصيل</small></span><span><b>${s.done||0}</b><small>طلبات</small></span></div>
    <button class="btn main fvplay${lock?' locked':''}" type="button">${lock?'🔒 يحتاج المزرعة المائية':'🌱 ادخل المزرعة'}</button></div></div>`}
{const _rh=renderHub;renderHub=function(){_rh.apply(this,arguments);const d=$('daily');if(!d||d.querySelector('.fvcard'))return;d.insertAdjacentHTML('beforeend',farmCard());
  d.querySelector('.fvplay').onclick=()=>{if(!(col.b.farm>0)){snd('err');toast('🔒 ابنِ المزرعة المائية أولاً');return}snd('tap');openGame(FarmGame)}}}
if(typeof IST!=='undefined'&&IST.farm)IST.farm.push({x:290,em:'🌾',n:'كبسولات مزرعة المدار',free:1,fn:()=>{setTimeout(()=>{const o=$('interior');if(o)o.remove();openGame(FarmGame)},500);return '🌱 إلى «مزرعة المدار»'}});
if(typeof renderHub==='function'&&!$('hub').hidden)try{renderHub()}catch(e){}
