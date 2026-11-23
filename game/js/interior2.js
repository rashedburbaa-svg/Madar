/* richer interiors: your astronaut walks inside, each building has interactive stations with rewards, the crew talks, and rooms grow with level */
const ICD=20*60000; // a station can be used once every 20 minutes
const TIERC=L=>L>=10?'#ffd34d':L>=7?'#c58bff':L>=4?'#00e5ff':'#8b96a6';
const TIERN=L=>L>=10?'ذهبي':L>=7?'متقدّم':L>=4?'مطوّر':'أساسي';
function iGain(k,n){if(n>0){gain(k,n);updRes();return '+'+fmtN(n)+' '+RES[k][1]}return ''}
// stations: x position on the floor, label, and what using it does (returns a short result text)
const IST={
  hq:[{x:180,em:'🗺️',n:'اجتماع القيادة',fn:L=>{const sv=svInit();sv.morale=Math.min(100,sv.morale+4);return '😊 معنويات +4% · '+iGain('m',20*L)}},{x:120,em:'📊',n:'تقارير الإنتاج',fn:()=>{collectAll();return '⤓ جمعت كل المخازن'}}],
  mine:[{x:180,em:'⛏️',n:'تشغيل المثقاب بأقصى قوة',fn:L=>iGain('m',Math.round(20*L*(1+L/5)))}],
  solar:[{x:200,em:'🔋',n:'معايرة البطاريات',fn:L=>iGain('e',Math.round(20*L*(1+L/5)))}],
  farm:[{x:180,em:'🧺',n:'حصاد النباتات الناضجة',fn:L=>iGain('f',Math.round(17*L*(1+L/5)))}],
  habitat:[{x:240,em:'🍲',n:'وجبة جماعية للطاقم',fn:L=>{const sv=svInit();sv.morale=Math.min(100,sv.morale+6+L);return '😊 معنويات +'+(6+L)+'%'}}],
  radio:[{x:120,em:'📡',n:'فك تشفير إشارة',fn:L=>{const n=1+Math.floor(Math.random()*(1+L/3));return iGain('c',n)+' من إشارة غامضة'}}],
  obs:[{x:220,em:'🔭',n:'مسح السماء',fn:L=>{const r=Math.random();if(r<0.35){return iGain('c',1+Math.floor(L/4))+' · رصدت شهاباً بلورياً'}if(col.raid&&col.raid.at>Date.now())return '🛰️ الغارة القادمة بعد '+fmtDur((col.raid.at-Date.now())/1000)+' · قوتها '+col.raid.str;return '🌌 السماء هادئة · '+iGain('e',15*L)}}],
  def:[{x:115,em:'🎯',n:'رماية تدريبية',fn:L=>{const c=(BT.cr||[]).find(x=>!x.dead);if(c&&typeof strike==='function'){strike(c);return '💥 ضربة مدارية على وحش خارج القبة'}return '🛡️ لا وحوش قريبة · '+iGain('m',15*L)}},{x:240,em:'🚀',n:'فحص الصواريخ',fn:L=>iGain('e',12*L)+' · المنظومة جاهزة'}],
  lab:[{x:180,em:'🧪',n:'تجربة سريعة',fn:L=>{if(col.rs){const left=col.rs.end-Date.now(),cut=Math.round(left*Math.min(0.5,0.1+0.03*L));col.rs.end-=cut;colSave();return '⏩ البحث أسرع بـ '+fmtDur(cut/1000)}return iGain('c',1)+' · نتيجة تجربة'}}],
  dock:[{x:180,em:'🔧',n:'ضبط المحركات',fn:L=>iGain('m',15*L)+' '+iGain('e',15*L)},{x:290,em:'✈️',n:'طلعة تدريبية',fn:()=>{const G=typeof PilotGame!=='undefined'?PilotGame:null;if(G)setTimeout(()=>{const o=$('interior');if(o)o.remove();openGame(G)},500);return '🚀 إلى «طيّار المدار»'}}]};
const iReady=(id,i)=>Date.now()>=((col.ist||{})[id+i]||0);
// extra equipment by tier, a coloured trim, and a plaque
{const _pr=props;props=function(id,L){let s=_pr(id,L);const c=TIERC(L);
  s+=`<rect x="0" y="206" width="360" height="4" fill="${c}" opacity=".8"/><rect x="0" y="0" width="360" height="5" fill="${c}" opacity=".6"/>`;
  if(L>=4)s+=`<g opacity=".9"><rect x="300" y="128" width="40" height="70" rx="6" fill="#0b1226" stroke="${c}" stroke-width="2"/>${[0,1,2,3].map(i=>`<rect class="ibar" x="${306+i*8}" y="140" width="5" height="50" fill="${c}" style="animation-delay:${i*0.25}s"/>`).join('')}</g>`;
  if(L>=7)s+=`<g transform="translate(70 30)"><circle r="14" fill="none" stroke="${c}" stroke-width="2"/><circle class="ihol" r="9" fill="none" stroke="${c}" stroke-dasharray="4 3"/><circle r="3" fill="${c}"/></g><g class="iwalk" style="animation-duration:14s"><g transform="translate(0 120)"><circle r="7" fill="#c7cfd8"/><circle r="3" fill="${c}"/><path d="M-10 0h-6M10 0h6" stroke="#8b96a6" stroke-width="2"/></g></g>`;
  if(L>=10)s+=`<path d="M180 14 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#ffd34d" class="blink"/><rect x="0" y="206" width="360" height="4" fill="#fff6c8" opacity=".5" class="ilight"/>`;
  return s}}
function iStations(id,L){return (IST[id]||[]).map((st,i)=>{const ok=iReady(id,i);return `<g class="ist${ok?' ok':''}" data-st="${i}" transform="translate(${st.x} 250)"><rect x="-28" y="-76" width="56" height="88" fill="#fff" fill-opacity="0"/><ellipse rx="24" ry="7" fill="${ok?'#ffd34d':'#5a6478'}" opacity="${ok?.35:.25}"/><circle class="${ok?'istp':''}" r="10" cy="-58" fill="${ok?'#ffd34d':'#3a4250'}" stroke="#fff" stroke-width="1.2"/><text y="-54" text-anchor="middle" font-size="11">${st.em}</text></g>`}).join('')}
function iPlayer(){const im=ART&&ART.astro;return `<g id="ipl" transform="translate(40 262)"><ellipse rx="12" ry="3.5" fill="#000" opacity=".4"/><g class="iplb"><g class="iplf">${im?`<image href="${im}" x="-14" y="-46" width="28" height="46"/>`:'<circle cy="-16" r="12" fill="#e6ecf1"/>'}</g></g><g transform="translate(0 -56)"><rect x="-13" y="-8" width="26" height="12" rx="6" fill="#ffd34d"/><text y="1.5" text-anchor="middle" font-size="8" font-weight="900" fill="#2a1a00">أنت</text></g></g>`}
{const _eb=enterB;enterB=function(id){_eb(id);const o=$('interior');if(!o)return;const L=col.b[id],svg=o.querySelector('.iscene svg');if(!svg)return;
  o.querySelector('.ihead b').innerHTML=`🚪 <span>داخل</span> <span>${BLD[id].name}</span> <i class="itier" style="--t:${TIERC(L)}">${TIERN(L)} · ${L}</i>`;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML=iStations(id,L)+iPlayer();svg.appendChild(g);
  const pl=svg.querySelector('#ipl');let px=40,py=262,raf=0,busy=false,dir=1;
  const tip=document.createElement('div');tip.className='itip';tip.textContent=(IST[id]&&IST[id].length)?'👆 المس محطة متوهجة ليمشي رائدك ويستخدمها، أو المس الأرض للتجوّل':'👆 المس الأرض للتجوّل';o.querySelector('.iscene').appendChild(tip);
  const out=document.createElement('div');out.className='iout';o.querySelector('.iscene').appendChild(out);
  const say=t=>{out.textContent=t;out.classList.remove('on');void out.offsetWidth;out.classList.add('on')};
  const walk=(tx,ty,then)=>{cancelAnimationFrame(raf);const b=pl.querySelector('.iplb');b.classList.add('walk');let last=performance.now();
    const step=now=>{const dt=Math.min(0.05,(now-last)/1000);last=now;const dx=tx-px,dy=ty-py,d=Math.hypot(dx,dy),sp=110*dt;if(Math.abs(dx)>1)dir=dx<0?-1:1;
      if(d<=sp){px=tx;py=ty;b.classList.remove('walk');upd();if(then)then();return}px+=dx/d*sp;py+=dy/d*sp;upd();raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)};
  const upd=()=>{pl.setAttribute('transform',`translate(${px.toFixed(1)} ${py.toFixed(1)})`);pl.querySelector('.iplf').setAttribute('transform',`scale(${dir} 1)`)};
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  svg.addEventListener('click',e=>{tip.remove();const st=e.target.closest('.ist');
    if(st){const i=+st.dataset.st,S=IST[id][i];walk(S.x-22,262,()=>{if(busy)return;if(!S.free&&!iReady(id,i)){say('⏳ جاهزة بعد '+fmtDur((((col.ist||{})[id+i])-Date.now())/1000));snd('err');return}
      busy=true;col.ist=col.ist||{};if(!S.free)col.ist[id+i]=Date.now()+ICD;const r=S.fn(L);colSave();snd('win');buzz&&buzz([20,30,20]);say(S.em+' '+S.n+'\n'+r);st.classList.remove('ok');st.querySelector('ellipse').setAttribute('fill','#5a6478');const c=st.querySelector('circle');c.setAttribute('fill','#3a4250');c.classList.remove('istp');
      col.iuse=(col.iuse||0)+1;if(col.iuse>=20&&typeof unlock==='function')unlock('worker');setTimeout(()=>{busy=false},400)});return}
    const cw=e.target.closest('.iwalk');if(cw&&cw.closest('.icrew')){const i=[...svg.querySelectorAll('.icrew .iwalk')].indexOf(cw)+Object.keys(BLD).indexOf(id);const [n,r]=CREWN[i%CREWN.length];snd('tap');say(`🧑‍🚀 ${n} (${r}): ${crewLine(i)}`);return}
    const p=pt(e);walk(Math.max(30,Math.min(340,p.x)),Math.max(232,Math.min(290,p.y)))});
  // room status chips get the tier and station timers
  const ch=o.querySelector('.ichips');if(ch&&IST[id])IST[id].forEach((S,i)=>{const sp=document.createElement('span');const left=((col.ist||{})[id+i]||0)-Date.now();sp.textContent=S.em+' '+S.n+(left>0?' · ⏳ '+fmtDur(left/1000):' · ✨ جاهزة');ch.appendChild(sp)})}}
if(typeof ACH!=='undefined')ACH.push(['worker','🛠️','استخدام محطات المباني 20 مرة']);

/* a live status screen hanging in every room: what the building does, its output, and the colony's energy and food balance */
const IROLE={hq:'يدير المستعمرة ويحدد سعة المخازن',mine:'يستخرج المعادن للبناء والأبحاث',solar:'يولّد الطاقة لتشغيل المستعمرة',farm:'يزرع الغذاء لإطعام الطاقم',habitat:'يسكن الطاقم ويرفع الإنتاج',radio:'يلتقط الإشارات ويحوّلها إلى جواهر',obs:'يرصد الفضاء ويكشف الأخطار',def:'يحمي المستعمرة ويزيد غنائم المعارك',lab:'يطوّر الأبحاث ويحسّن كل شيء',dock:'يصلح المركبة ويجهّز الطيران'};
function ecoNow(){let pe=0,pf=0,pm=0,pc=0;for(const b of Object.keys(BLD)){const r=bRate(b);if(r>0){const k=BLD[b].prod[0];if(k==='e')pe+=r;else if(k==='f')pf+=r;else if(k==='m')pm+=r;else if(k==='c')pc+=r}}
  const c=crew(),N=typeof NEED!=='undefined'?NEED:{f:2,e:1.5};return {pe,pf,pm,pc,ce:N.e*c,cf:N.f*c,cap:cap()}}
function iScreenSVG(id){return `<g id="iscr"><rect x="0" y="-100" width="360" height="102" fill="#0a0f1c"/><path d="M60 -100 V-92 M300 -100 V-92" stroke="#5a6478" stroke-width="2"/>
  <rect x="12" y="-93" width="336" height="88" rx="7" fill="#030a14" stroke="#5a6478" stroke-width="2.4"/><rect x="16" y="-89" width="328" height="80" rx="5" fill="url(#iscrG)"/>
  <defs><linearGradient id="iscrG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062033"/><stop offset="1" stop-color="#03111c"/></linearGradient></defs>
  <g direction="${typeof I18N!=='undefined'&&I18N.on?'ltr" text-anchor="end':'rtl'}"><text id="is1" x="336" y="-75" font-size="10.5" font-weight="900" fill="#00e5ff"></text><text id="is5" x="336" y="-62" font-size="8.6" fill="#a9b6d6"></text><text id="is2" x="336" y="-48" font-size="9.2" fill="#e8ecff"></text>
  <text id="is3" x="336" y="-33" font-size="9.2" fill="#ffd34d"></text><text id="is4" x="336" y="-18" font-size="9.2" fill="#9dff5a"></text></g>
  <path d="M104 -84 V-14" stroke="#ffffff22"/>
  <g transform="translate(22 -82)" direction="ltr">${[['E','⚡','#ffd34d',0],['F','🌱','#9dff5a',22],['M','⛏️','#c9a27a',44]].map(([k,em,c,y])=>`<text x="0" y="${y+8}" font-size="8">${em}</text><rect x="13" y="${y+1}" width="62" height="8" rx="4" fill="#1a2436"/><rect id="isb${k}" x="13" y="${y+1}" width="0" height="8" rx="4" fill="${c}"/><text id="isv${k}" x="44" y="${y+19}" text-anchor="middle" font-size="7" fill="#8b96a6"></text>`).join('')}</g>
  <rect class="iscan" x="16" y="-89" width="328" height="3" fill="#00e5ff" opacity=".12"/></g>`}
function iScreenUpd(id,svg){const B=BLD[id],L=col.b[id],E=ecoNow(),t=(i,s)=>{const n=svg.querySelector('#is'+i);if(n)n.textContent=s},sg=v=>(v>=0?'+':'−')+fmtN(Math.abs(v));
  t(1,`🖥️ ${B.name} · المستوى ${L}`);t(5,IROLE[id]||'');
  let l2='';if(B.prod){const k=B.prod[0];l2=`📈 ${RES[k][1]} +${fmtN(bRate(id))}/س`+(PRODB[id]?` · 📦 ${fmtN(col.store[id]||0)}`:'')}
  else if(id==='hq')l2=`📦 السعة ${fmtN(E.cap)} · 🧑‍🚀 ${crew()} رواد`;else if(id==='habitat')l2=`🧑‍🚀 ${crew()} رواد · 😊 ${Math.round((col.sv&&col.sv.morale)||80)}%`;
  else if(id==='lab')l2=col.rs?`🔬 ${TECH[col.rs.k].n} · ${fmtDur(Math.max(0,(col.rs.end-Date.now())/1000))}`:'🔬 جاهز لبحث جديد';else if(id==='def')l2=`⚔️ غنائم +${L*20}% · 🛡️ صدّ ${col.raidWins||0}`;
  else if(id==='obs')l2=col.raid&&col.raid.at>Date.now()?`🛰️ غارة بعد ${fmtDur((col.raid.at-Date.now())/1000)}`:'🛰️ لا غارات قريبة';else if(id==='dock')l2=col.done?'🚀 المركبة جاهزة':'🔧 قيد الإصلاح';
  t(2,l2);const ne=E.pe-E.ce,nf=E.pf-E.cf;
  t(3,`⚡ طاقة +${fmtN(E.pe)} −${fmtN(E.ce)} = ${sg(ne)}/س`);t(4,`🌱 غذاء +${fmtN(E.pf)} −${fmtN(E.cf)} = ${sg(nf)}/س`);
  const n3=svg.querySelector('#is3'),n4=svg.querySelector('#is4');if(n3)n3.setAttribute('fill',ne<0?'#ff5d73':'#ffd34d');if(n4)n4.setAttribute('fill',nf<0?'#ff5d73':'#9dff5a');
  const bar=(k,v)=>{const n=svg.querySelector('#isb'+k);if(n)n.setAttribute('width',(62*Math.max(0,Math.min(1,v/E.cap))).toFixed(1));const m=svg.querySelector('#isv'+k);if(m)m.textContent=fmtN(v)+' / '+fmtN(E.cap)};bar('E',col.res.e);bar('F',col.res.f);bar('M',col.res.m)}
{const _eb2=enterB;enterB=function(id){_eb2(id);const o=$('interior');if(!o)return;const svg=o.querySelector('.iscene svg');if(!svg)return;
  svg.setAttribute('viewBox','0 -100 360 400');o.querySelector('.iscene').classList.add('tall');
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML=iScreenSVG(id);svg.insertBefore(g,svg.firstChild.nextSibling);
  iScreenUpd(id,svg);const iv=setInterval(()=>{if(!document.body.contains(o)){clearInterval(iv);return}accrue();iScreenUpd(id,svg)},1000)}}
