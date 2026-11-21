/* richer interiors: your astronaut walks inside, each building has interactive stations with rewards, the crew talks, and rooms grow with level */
const ICD=20*60000; // a station can be used once every 20 minutes
const TIERC=L=>L>=10?'#ffd34d':L>=7?'#c58bff':L>=4?'#5ff2d6':'#8b96a6';
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
  o.querySelector('.ihead b').innerHTML=`🚪 داخل ${BLD[id].name} <i class="itier" style="--t:${TIERC(L)}">${TIERN(L)} · ${L}</i>`;
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
    if(st){const i=+st.dataset.st,S=IST[id][i];walk(S.x-22,262,()=>{if(busy)return;if(!iReady(id,i)){say('⏳ جاهزة بعد '+fmtDur((((col.ist||{})[id+i])-Date.now())/1000));snd('err');return}
      busy=true;col.ist=col.ist||{};col.ist[id+i]=Date.now()+ICD;const r=S.fn(L);colSave();snd('win');buzz&&buzz([20,30,20]);say(S.em+' '+S.n+'\n'+r);st.classList.remove('ok');st.querySelector('ellipse').setAttribute('fill','#5a6478');const c=st.querySelector('circle');c.setAttribute('fill','#3a4250');c.classList.remove('istp');
      col.iuse=(col.iuse||0)+1;if(col.iuse>=20&&typeof unlock==='function')unlock('worker');setTimeout(()=>{busy=false},400)});return}
    const cw=e.target.closest('.iwalk');if(cw&&cw.closest('.icrew')){const i=[...svg.querySelectorAll('.icrew .iwalk')].indexOf(cw)+Object.keys(BLD).indexOf(id);const [n,r]=CREWN[i%CREWN.length];snd('tap');say(`🧑‍🚀 ${n} (${r}): ${crewLine(i)}`);return}
    const p=pt(e);walk(Math.max(30,Math.min(340,p.x)),Math.max(232,Math.min(290,p.y)))});
  // room status chips get the tier and station timers
  const ch=o.querySelector('.ichips');if(ch&&IST[id])IST[id].forEach((S,i)=>{const sp=document.createElement('span');const left=((col.ist||{})[id+i]||0)-Date.now();sp.textContent=S.em+' '+S.n+(left>0?' · ⏳ '+fmtDur(left/1000):' · ✨ جاهزة');ch.appendChild(sp)})}}
if(typeof ACH!=='undefined')ACH.push(['worker','🛠️','استخدام محطات المباني 20 مرة']);
