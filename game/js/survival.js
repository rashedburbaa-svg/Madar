/* ================= مستعمرة المدار — البقاء والمغامرات =================
   1) دعم الحياة: الطاقم يستهلك غذاءً وطاقة كل ساعة، والمعنويات ترفع أو تخفض الإنتاج.
   2) أحداث البقاء: عواصف، توهجات، نيازك، أمراض، إشارات استغاثة… كل حدث يطلب قراراً منك.
   3) المغامرات: رحلات استكشاف قصيرة على الأقدام بثلاث مراحل واختيارات تعتمد على مستعمرتك. */
function svInit(){if(!col.sv)col.sv={last:Date.now(),morale:80,next:Date.now()+40*60000,storm:0,adv:{cd:0,done:{}},relics:0,log:[]};col.sv.adv=col.sv.adv||{cd:0,done:{}};return col.sv}
const svOn=()=>col.intro&&col.b.hq>=2;
const NEED={f:2,e:1.5};/* per crew member per hour */
function svTarget(){const t=typeof tfStage==='function'?tfStage():0;return Math.min(100,70+2*t+Math.min(10,(col.b.habitat||0))+(typeof festOn==='function'&&festOn()?5:0))}
function moraleBonus(){if(!col.sv)return 0;const sv=col.sv,m=(sv.morale-75)/250,storm=sv.storm>Date.now()?-0.15:0;return Math.max(-0.3,m)+storm+0.02*Math.min(4,sv.relics||0)}
function svTick(){const sv=svInit(),now=Date.now(),h=Math.min(24,Math.max(0,(now-(sv.last||now))/3600000));sv.last=now;if(!svOn()||h<=0)return;
  const c=crew(),nf=NEED.f*c*h,ne=NEED.e*c*h;let short=0;
  if(col.res.f>=nf)col.res.f-=nf;else{short+=(nf-col.res.f)/nf;col.res.f=0}
  if(col.res.e>=ne)col.res.e-=ne;else{short+=(ne-col.res.e)/ne;col.res.e=0}
  if(short>0){sv.morale=Math.max(10,sv.morale-8*h*short);if(!svTick.warned){svTick.warned=1;setTimeout(()=>toast('🤖 نجم: الطاقم جائع! ارفع إنتاج 🌱 و⚡ قبل أن تنهار المعنويات','ach'),1200)}}
  else{svTick.warned=0;const tg=svTarget();sv.morale+=(tg-sv.morale)*Math.min(1,h*0.25)}
  sv.morale=Math.max(0,Math.min(100,sv.morale))}
{const _ac=accrue;accrue=function(){_ac.apply(this,arguments);try{svTick()}catch(e){}}}
const mood=m=>m>=85?'😄':m>=65?'🙂':m>=45?'😐':m>=25?'😟':'😫';

/* ---------- a modal with several choices ---------- */
function choiceBox(title,text,choices,em){const m=document.createElement('div');m.className='hmodal';m.style.zIndex=45;
  m.innerHTML=`<div class="hbox cstory svbox"><div class="cav">${em?`<span class="svem">${em}</span>`:(typeof ART!=='undefined'&&ART.najm?'<img class="najm" src="'+ART.najm+'" alt="">':'🤖')}</div><h3></h3><p></p><div class="svch"></div></div>`;
  m.querySelector('h3').textContent=title;m.querySelector('p').textContent=text;const box=m.querySelector('.svch');
  choices.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='btn'+(c.main?' main':'');b.innerHTML=`<b></b>${c.sub?'<small></small>':''}`;b.querySelector('b').textContent=c.t;if(c.sub)b.querySelector('small').textContent=c.sub;
    if(c.off)b.disabled=true;b.onclick=()=>{m.remove();c.fn&&c.fn()};box.appendChild(b)});document.body.appendChild(m);return m}
function svApply(r){const out=[];for(const [k,v] of Object.entries(r||{})){if(!v)continue;if(k==='morale'){svInit().morale=Math.max(0,Math.min(100,col.sv.morale+v));out.push((v>0?'+':'')+v+' معنويات')}
  else if(k==='pct'){for(const [rk,p] of Object.entries(v)){const n=Math.round(col.res[rk]*p);col.res[rk]=Math.max(0,col.res[rk]+n);out.push((n>0?'+':'')+fmtN(n)+' '+RES[rk][1])}}
  else if(k==='relic'){col.sv.relics=(col.sv.relics||0)+v;out.push('🏺 أثر قديم (+2% إنتاج دائم)')}
  else{if(v>0)gain(k,v);else col.res[k]=Math.max(0,col.res[k]+v);out.push((v>0?'+':'')+fmtN(v)+' '+RES[k][1])}}
  colSave();updRes();try{if(!$('hub').hidden)renderColony()}catch(e){}return out.join('  ')}
function svResult(title,text,r,good){const res=svApply(r);const m=storyBox((good?'✅ ':'⚠️ ')+title,text+(res?'\n'+res:''),'حسناً');snd(good?'ach':'err');return m}

/* ---------- survival events ---------- */
const H=()=>col.b.hq;
const EVENTS=[
  {id:'storm',em:'🌪️',t:'عاصفة رملية تقترب!',d:()=>'جدار من الغبار الأحمر يتجه نحو المستعمرة. الألواح الشمسية والطاقم في خطر.',
    ch:()=>[{t:'أغلق الألواح وانتظر',sub:'الإنتاج -15% لساعتين، بلا أضرار',main:1,fn:()=>{col.sv.storm=Date.now()+2*3600000;svResult('مرّت العاصفة','أغلق الطاقم كل شيء وانتظروا في الملاجئ.',{morale:2},1)}},
      {t:'جازف واستمر بالعمل',sub:col.b.wall>=5?'السور القوي يحميكم (آمن)':'50% خسارة طاقة ومعنويات',fn:()=>{if(col.b.wall>=5||Math.random()<.5)svResult('صمدنا!','العاصفة مرت والسور صدّ الرمال. الطاقم فخور.',{morale:5,e:150*H()},1);else svResult('ضربتنا العاصفة','الرمال حطمت بعض الألواح وأرهقت الطاقم.',{pct:{e:-0.15},morale:-10})}}]},
  {id:'flare',em:'☀️',t:'توهج شمسي هائل!',d:()=>'الشمس أطلقت عاصفة إشعاعية. فرصة لشحن الطاقة… أو خطر على الطاقم.',
    ch:()=>[{t:'افتح المجمعات واشحن',sub:'+طاقة كبيرة، الطاقم يتعرض للإشعاع',main:1,fn:()=>svResult('شحن هائل','امتلأت البطاريات حتى آخرها، لكن الطاقم مرهق.',{e:400*H(),morale:-6},1)},
      {t:'احتموا في الملاجئ',sub:'آمن تماماً',fn:()=>svResult('في أمان','انتهى التوهج ولم يصب أحد.',{morale:2},1)}]},
  {id:'meteor',em:'☄️',t:'نيزك متجه للمخازن!',d:()=>'الرادار رصد نيزكاً كبيراً سيضرب قرب مخازن المعادن خلال دقائق.',
    ch:()=>[{t:'دمّره بالضربة المدارية',sub:'3 💎 — وقد نجمع شظاياه',main:1,off:col.res.c<3,fn:()=>{col.res.c-=3;svResult('أصبنا الهدف!','تفتت النيزك وجمع الطاقم شظاياه البلورية.',{c:6+Math.floor(H()/2),m:200*H()},1)}},
      {t:'اعتمد على الدفاعات',sub:col.b.def>=3?'دفاعاتك قوية (آمن)':'خطر خسارة 12% من المعادن',fn:()=>{if(col.b.def>=3)svResult('صدّته الدروع','حرف الدفاع النيزك عن مساره.',{morale:4},1);else svResult('سقط النيزك','دمر جزءاً من مخزون المعادن.',{pct:{m:-0.12},morale:-5})}}]},
  {id:'sick',em:'🤒',t:'مرض غامض بين الطاقم',d:()=>'ثلاثة من الطاقم يعانون حمّى غريبة. ربما من غبار الكوكب.',
    ch:()=>[{t:'اصنع دواءً في المختبر',sub:col.b.lab?'يكلف غذاءً وطاقة':'يحتاج المختبر',main:1,off:!col.b.lab||col.res.f<100*H()||col.res.e<100*H(),fn:()=>svResult('شُفي الجميع','دواء المختبر نجح، والطاقم ممتن لقائده.',{f:-100*H(),e:-100*H(),morale:10},1)},
      {t:'اعزلهم وانتظر',sub:'المعنويات تنخفض',fn:()=>svResult('تعافوا ببطء','مرت أيام صعبة على الطاقم.',{morale:-15})}]},
  {id:'sos',em:'📡',t:'إشارة استغاثة!',d:()=>'إشارة ضعيفة من مركبة محطمة خلف التلال. قد يكون فيها ناجون… أو فخ.',
    ch:()=>[{t:'أرسل فريق إنقاذ',sub:'يكلف غذاءً — '+Math.round(Math.min(.9,.55+.05*col.b.def)*100)+'% نجاح',main:1,off:col.res.f<150*H(),fn:()=>{col.res.f-=150*H();if(Math.random()<Math.min(.9,.55+.05*col.b.def))svResult('أنقذنا الناجين!','عادوا بالامتنان وبحمولة مركبتهم.',{c:10+H(),m:300*H(),morale:12},1);else svResult('كان فخاً!','كائنات كمنت للفريق، فعادوا مصابين.',{morale:-12})}},
      {t:'تجاهل الإشارة',sub:'الطاقم لن يرضى',fn:()=>svResult('صمت الإشارة','بعض الطاقم لم يغفر هذا القرار.',{morale:-6})}]},
  {id:'water',em:'💧',t:'جيب ماء جوفي!',d:()=>'الحفارات وجدت جيباً من الجليد تحت المستعمرة.',
    ch:()=>[{t:'استخدمه للمزارع',sub:'غذاء كبير',main:1,fn:()=>svResult('محصول وفير','الماء أنعش المزارع.',{f:350*H(),morale:4},1)},
      {t:'حلّله لطاقة هيدروجينية',sub:'طاقة كبيرة',fn:()=>svResult('وقود جديد','الهيدروجين ملأ البطاريات.',{e:350*H()},1)}]},
  {id:'gift',em:'👽',t:'زائر غريب!',d:()=>'كائن مضيء اقترب من البوابة بهدوء ووضع شيئاً على الأرض ثم اختفى.',
    ch:()=>[{t:'افحص الهدية',sub:'غالباً مفيدة…',main:1,fn:()=>{if(Math.random()<.8)svResult('بلورات نادرة!','الهدية صندوق بلورات صافية.',{c:8+H(),morale:5},1);else svResult('خدعة!','الصندوق انفجر بغبار مزعج.',{morale:-4})}},
      {t:'اتركها مكانها',sub:'لا مخاطرة',fn:()=>svResult('حذر','اختفت الهدية بعد ساعة.',{},1)}]}];
function svEvent(){const sv=svInit();if(!svOn())return;if(document.querySelector('.hmodal')||$('hub').hidden||$('pColony').hidden)return;
  const pool=EVENTS.filter(e=>e.id!==sv.lastEv);const E=pool[Math.floor(Math.random()*pool.length)];sv.lastEv=E.id;sv.next=Date.now()+(2.5+Math.random()*2.5)*3600000;colSave();
  snd('alarm');choiceBox(E.em+' '+E.t,E.d(),E.ch(),E.em)}
setInterval(()=>{try{const sv=svInit();if(svOn()&&Date.now()>=sv.next)svEvent()}catch(e){}},15000);

/* ---------- adventures ---------- */
const STAT={def:['⚔️ قتال','def'],lab:['🔬 علم','lab'],crew:['🧑‍🚀 فريق','habitat'],null:['🎲 حظ',null]};
const chance=c=>Math.max(.15,Math.min(.95,c.base+(c.stat?0.05*(col.b[STAT[c.stat][1]]||0):0)));
const ADV=[
  {id:'cave',em:'💎',n:'كهف البلورات',hq:2,cost:{f:120,e:80},d:'كهف عميق تلمع جدرانه بالبلور.',sc:[
    {t:'مدخل الكهف مظلم تماماً، وتسمع صوت أجنحة في الداخل.',c:[{t:'أشعل المشاعل',stat:null,base:.7,ok:'الضوء أبعد الخفافيش الفضائية.',okR:{c:2},bad:'الضوء أيقظ سرباً كاملاً! هربتم بصعوبة.',badR:{morale:-4}},{t:'تقدّم بالرؤية الليلية',stat:'lab',base:.55,ok:'نظارات المختبر كشفت الطريق بأمان.',okR:{c:3},bad:'تعطلت النظارات وتعثّر الفريق.',badR:{morale:-3}}]},
    {t:'جدار ضخم من البلورات الزرقاء يسد الممر.',c:[{t:'استخرج بحذر',stat:'lab',base:.6,ok:'بلورات صافية سليمة!',okR:{c:8},bad:'تشققت البلورات وتفتتت.',badR:{c:2}},{t:'فجّره',stat:'def',base:.55,ok:'انهار الجدار وكشف كنزاً!',okR:{c:10},bad:'انهار جزء من السقف!',badR:{morale:-8}}]},
    {t:'حارس الكهف: كائن بلوري ضخم يستيقظ!',c:[{t:'واجهه',stat:'def',base:.5,ok:'هزمتموه! وتركه قلبه البلوري.',okR:{c:14,morale:6},bad:'كان أقوى منكم… انسحبتم.',badR:{morale:-8}},{t:'تسلل بهدوء',stat:'crew',base:.55,ok:'خرجتم بالغنائم دون أن يشعر.',okR:{c:6},bad:'لمحكم وطاردكم للخارج!',badR:{morale:-5}}]}]},
  {id:'wreck',em:'🛸',n:'حطام سفينة قديمة',hq:3,cost:{f:180,e:150},d:'سفينة فضائية مجهولة سقطت منذ قرون.',sc:[
    {t:'الباب الرئيسي مغلق بقفل إلكتروني غريب.',c:[{t:'اقطعه بالليزر',stat:'def',base:.65,ok:'انفتح الباب بشرارة.',okR:{m:300},bad:'انطلق إنذار قديم وأفزع الفريق.',badR:{morale:-4}},{t:'فك الشفرة',stat:'lab',base:.5,ok:'الشفرة فتحت كل الأبواب… وخزانة إضافية!',okR:{m:300,c:4},bad:'أقفل النظام نفسه، فدخلتم من فتحة ضيقة.',badR:{}}]},
    {t:'غرفة الحمولة مليئة بالصناديق… وبيانات ملاحة.',c:[{t:'خذ المعادن',stat:null,base:.85,ok:'حمولة ممتازة من السبائك.',okR:{m:900},bad:'معظم الصناديق صدئة.',badR:{m:200}},{t:'انسخ البيانات',stat:'lab',base:.6,ok:'خرائط نجمية ثمينة!',okR:{c:9},bad:'البيانات تالفة.',badR:{}}]},
    {t:'المفاعل يسرّب طاقة وقد ينفجر!',c:[{t:'أطفئه',stat:'lab',base:.55,ok:'أخمدتموه وأخذتم خلية طاقته!',okR:{e:1200,morale:6},bad:'انفجار صغير أصاب الفريق.',badR:{morale:-10}},{t:'اهربوا فوراً',stat:'crew',base:.75,ok:'خرجتم قبل الانفجار بثوانٍ.',okR:{},bad:'لفحتكم موجة الانفجار.',badR:{morale:-6}}]}]},
  {id:'lava',em:'🌋',n:'وادي الحمم',hq:4,cost:{f:250,e:200},d:'أنهار من الحمم وحرارة لا تحتمل.',sc:[
    {t:'نهر حمم يقطع الطريق، وعبره صخور متباعدة.',c:[{t:'اقفزوا بين الصخور',stat:'crew',base:.6,ok:'عبرتم كالمحترفين!',okR:{},bad:'سقطت حقيبة إمدادات في الحمم.',badR:{f:-150}},{t:'ابنوا جسراً',stat:null,base:.9,ok:'جسر معدني متين.',okR:{m:-300},bad:'',badR:{}}]},
    {t:'ينابيع حارة تقذف بخاراً كل عدة ثوانٍ.',c:[{t:'احسبوا التوقيت',stat:'lab',base:.6,ok:'مررتم وجمعتم معادن نادرة من الحواف.',okR:{e:500,c:4},bad:'لسعكم البخار.',badR:{morale:-5}},{t:'اركضوا مباشرة',stat:null,base:.45,ok:'حظ رائع!',okR:{e:300},bad:'حروق خفيفة لعدة أفراد.',badR:{morale:-8}}]},
    {t:'دودة نارية عملاقة تخرج من الحمم!',c:[{t:'قاتلوها',stat:'def',base:.45,ok:'سقطت الدودة وتركت بلورات نارية!',okR:{c:16,e:800,morale:8},bad:'تراجعتم مصابين.',badR:{morale:-10}},{t:'ألهوها بالإمدادات',stat:null,base:.8,ok:'التهمت الطعام وتركتكم.',okR:{f:-200,e:400},bad:'لم تنخدع!',badR:{morale:-6}}]}]},
  {id:'ruins',em:'🏛️',n:'الأطلال القديمة',hq:5,cost:{f:350,e:300,c:5},d:'مدينة لحضارة اختفت قبل ملايين السنين.',sc:[
    {t:'بوابة عليها رموز متوهجة تتغير كلما اقتربتم.',c:[{t:'حلّ اللغز',stat:'lab',base:.5,ok:'انفتحت البوابة بنور ذهبي.',okR:{c:6},bad:'أغلقت البوابة، فدخلتم من الأنقاض.',badR:{morale:-3}},{t:'ادفعوها بالقوة',stat:'def',base:.45,ok:'تحركت البوابة الثقيلة!',okR:{},bad:'تفعّل نظام دفاع قديم!',badR:{morale:-8}}]},
    {t:'ممر طويل بأرضية مفخخة.',c:[{t:'تقدموا خطوة خطوة',stat:'crew',base:.6,ok:'عبرتم سالمين.',okR:{c:4},bad:'سقط أحدكم في فخ وأُنقذ بصعوبة.',badR:{morale:-7}},{t:'أرسلوا الطائرة المسيّرة',stat:'lab',base:.65,ok:'المسيّرة كشفت كل الفخاخ.',okR:{c:5},bad:'تحطمت المسيّرة.',badR:{m:-300}}]},
    {t:'قاعة الأثر: تمثال يحمل جوهرة تنبض بالطاقة.',c:[{t:'خذ الأثر',stat:null,base:.6,ok:'أثر قديم يمنح المستعمرة قوة دائمة!',okR:{relic:1,c:20,morale:10},bad:'اهتزت القاعة وانهارت… هربتم ببعض الجواهر.',badR:{c:8,morale:-6}},{t:'انسخ النقوش فقط',stat:'lab',base:.8,ok:'معرفة قديمة سرّعت أبحاثنا.',okR:{c:15,e:1000},bad:'النقوش غير مفهومة.',badR:{c:4}}]}]}];
function advHTML(){const sv=svInit(),cd=Math.max(0,sv.adv.cd-Date.now()),c=crew();
  let h=`<h3 class="lh">🧭 البقاء والمغامرات</h3><div class="svstat"><div><b>${mood(sv.morale)} ${Math.round(sv.morale)}%</b><small>معنويات الطاقم · ${moraleBonus()>=0?'+':''}${Math.round(moraleBonus()*100)}% إنتاج</small></div>
    <div><b>🍽️ ${c} رواد</b><small>يستهلكون ${fmtN(NEED.f*c)} 🌱 و${fmtN(NEED.e*c)} ⚡ كل ساعة</small></div></div>`;
  if(sv.storm>Date.now())h+=`<p class="cd">🌪️ عاصفة رملية: الإنتاج -15% لمدة ${fmtDur((sv.storm-Date.now())/1000)}</p>`;
  if(sv.relics)h+=`<p class="cd">🏺 آثار قديمة: ${sv.relics} (+${2*Math.min(4,sv.relics)}% إنتاج دائم)</p>`;
  h+=`<p class="cd">${cd?'⏳ الفريق يستريح: المغامرة التالية بعد '+fmtDur(cd/1000):'اختر وجهة للفريق. كل قرار يعتمد على مستعمرتك: الدفاع ⚔️ والمختبر 🔬 والمساكن 🧑‍🚀.'}</p><div class="advl">`;
  ADV.forEach(a=>{const lock=col.b.hq<a.hq,ok=!lock&&!cd&&canPay(a.cost),n=sv.adv.done[a.id]||0;
    h+=`<div class="advr${lock?' lock':''}"><span class="ae">${a.em}</span><span class="an"><b>${a.n}${n?` <small>×${n}</small>`:''}</b><small>${lock?'🔒 القيادة '+a.hq:a.d}</small></span><button class="btn${ok?' main':''}" type="button" data-adv="${a.id}" ${ok?'':'disabled'}>${lock?'🔒':costHTML(a.cost)}</button></div>`});
  return h+'</div>'}
function advStart(id){const a=ADV.find(x=>x.id===id),sv=svInit();if(!a||col.b.hq<a.hq||sv.adv.cd>Date.now()||!canPay(a.cost))return;pay(a.cost);sv.adv.cd=Date.now()+30*60000;colSave();closeSheet();snd('tap');
  const loot={};let step=0,story=[];const add=r=>{for(const [k,v] of Object.entries(r||{}))loot[k]=(loot[k]||0)+v};
  const scene=()=>{const S=a.sc[step];choiceBox(`${a.em} ${a.n} — ${step+1}/3`,S.t,S.c.map(c=>({t:c.t,sub:STAT[c.stat][0]+' · '+Math.round(chance(c)*100)+'% نجاح',main:1,fn:()=>{const win=Math.random()<chance(c);add(win?c.okR:c.badR);story.push((win?'✅ ':'❌ ')+(win?c.ok:c.bad));snd(win?'ok':'err');
      const m=storyBox(win?'✅ نجحت!':'❌ لم تنجح',win?c.ok:c.bad,step<2?'تابع':'العودة للمستعمرة',()=>{step++;if(step<3)scene();else finish()})}})),a.em)};
  const finish=()=>{sv.adv.done[a.id]=(sv.adv.done[a.id]||0)+1;const res=svApply(loot);if(typeof dtask==='function')dtask('mission',1);const m=storyBox('🏁 انتهت المغامرة',story.join('\n')+(res?'\n\nالحصيلة: '+res:''),'رائع');try{celebrate(m.querySelector('.hbox'))}catch(e){}};
  scene()}
{const _rs=renderSheet;renderSheet=function(){if(sheetId==='adv'){svTick();const c=$('csheet').querySelector('.csc');c.innerHTML=advHTML();c.querySelectorAll('[data-adv]').forEach(b=>b.onclick=()=>advStart(b.dataset.adv));return}_rs()}}
function advBtn(){if(!svOn())return '';const sv=svInit(),ready=sv.adv.cd<=Date.now();return `<button class="cadv${ready?' ready':''}" type="button" aria-label="البقاء والمغامرات">🧭<i>${mood(sv.morale)}</i></button>`}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#colony .cadv')){snd('tap');openSheet('adv')}});
