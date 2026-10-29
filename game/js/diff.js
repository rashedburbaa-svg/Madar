/* ================= game 4: spot the difference (drawn scenes) ================= */
const DiffGame=(()=>{
  const W=400,H=260;let st,g,cA,cB,xA,xB,wrongMark=null,timer=0,cb,flicking=false;
  const col=c=>`hsl(${c.h} ${c.s}% ${c.l}%)`;
  const KINDS={
    garden:{bands:{sky:['sun','cloud','cloud','bird','bird','butterfly'],ground:['tree','tree','flower','flower','flower','bush','mushroom','mushroom','butterfly']}},
    street:{bands:{sky:['cloud','cloud','bird','sun'],ground:['house','house','car','car','lamp','tree','sign','bush']}},
    room:{bands:{sky:['frame','frame','clock','shelfbook','window'],ground:['plant','lampr','chair','cup','books','plant','ball']}}
  };
  const BASE={sun:22,cloud:22,bird:12,butterfly:12,tree:26,flower:13,bush:16,mushroom:13,house:30,car:24,lamp:20,sign:16,frame:20,clock:17,shelfbook:18,window:24,plant:18,lampr:20,chair:20,cup:12,books:16,ball:12};
  const VAR={house:1,lamp:1,lampr:1,clock:1,mushroom:1,window:1,butterfly:1};
  const FLIP={car:1,bird:1,chair:1,cup:1,sign:1};
  function build(level,seed){
    const R=rng(seed??level*977+5),theme=['garden','street','room'][(level-1)%3],M=Math.min(9+level,20),D=Math.min(3+Math.floor(level/2),8),subtle=level>=7;
    const hue=()=>[4,24,45,90,150,190,210,260,300,335][Math.floor(R()*10)];
    const objs=[];const bands=KINDS[theme].bands;let tries=0;
    while(objs.length<M&&tries++<900){
      const band=R()<0.3?'sky':'ground',list=bands[band],kind=list[Math.floor(R()*list.length)];
      if(kind==='sun'&&objs.some(o=>o.kind==='sun'))continue;
      const s=0.75+R()*0.5,r=BASE[kind]*s;
      const y=band==='sky'?(theme==='room'?40+R()*70:22+R()*60):(theme==='room'?170+R()*55:150+R()*80);
      const x=r+8+R()*(W-2*r-16);
      if(objs.some(o=>Math.hypot(o.x-x,o.y-y)<(o.r+r)*0.95))continue;
      objs.push({kind,x,y,s,r,c:{h:hue(),s:60+R()*25,l:48+R()*12},v:R()<.5?1:0,f:R()<.5?1:0});
    }
    objs.sort((a,b)=>a.y-b.y);
    const B=objs.map(o=>Object.assign({},o,{c:Object.assign({},o.c)}));
    const picks=shuffle(objs.map((_,i)=>i),R).slice(0,D),diffs=[];
    picks.forEach(i=>{const o=B[i],kinds=['color','remove','size'];if(VAR[o.kind])kinds.push('var','var');if(FLIP[o.kind])kinds.push('flip');
      const k=kinds[Math.floor(R()*kinds.length)];
      if(k==='color'){if(subtle)o.c.l=o.c.l>52?o.c.l-18:o.c.l+18;else o.c.h=(o.c.h+110+Math.floor(R()*140))%360}
      else if(k==='remove')o.gone=1;else if(k==='size')o.s*=subtle?(R()<.5?0.78:1.25):(R()<.5?0.62:1.45);else if(k==='var')o.v=1-o.v;else o.f=1-o.f;
      diffs.push({x:objs[i].x,y:objs[i].y,r:Math.max(objs[i].r,BASE[o.kind]*o.s),found:false})});
    return {level,theme,A:objs,B,diffs,mistakes:0,hints:0,time:0,bgH:hue()};
  }
  function bg(ctx){
    if(g.theme==='garden'){ctx.fillStyle='#bfe3f5';ctx.fillRect(0,0,W,H);ctx.fillStyle='#9fd38a';ctx.beginPath();ctx.ellipse(110,150,180,40,0,0,7);ctx.fill();ctx.fillStyle='#7cc46a';ctx.fillRect(0,140,W,H-140);ctx.fillStyle='#8fd07a';for(let i=0;i<W;i+=26)ctx.fillRect(i,150+(i%3)*25,12,3)}
    else if(g.theme==='street'){ctx.fillStyle='#cde8f7';ctx.fillRect(0,0,W,H);ctx.fillStyle='#d9d2c5';ctx.fillRect(0,135,W,95);ctx.fillStyle='#5c6166';ctx.fillRect(0,222,W,38);ctx.fillStyle='#e8e2c8';for(let i=10;i<W;i+=50)ctx.fillRect(i,239,26,4)}
    else{ctx.fillStyle=`hsl(${g.bgH} 35% 86%)`;ctx.fillRect(0,0,W,H);ctx.fillStyle='#b88a5e';ctx.fillRect(0,175,W,H-175);ctx.strokeStyle='#a2774f';ctx.lineWidth=1;for(let i=0;i<W;i+=50){ctx.beginPath();ctx.moveTo(i,175);ctx.lineTo(i-20,H);ctx.stroke()}ctx.fillStyle='#fff';ctx.fillRect(0,170,W,6)}
  }
  function obj(ctx,o){
    if(o.gone)return;ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.s*(o.f?-1:1),o.s);const C=col(o.c),dark='#3b2f2a';
    const circ=(x,y,r,f)=>{ctx.fillStyle=f;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()};
    const rect=(x,y,w,h,f)=>{ctx.fillStyle=f;ctx.fillRect(x,y,w,h)};
    switch(o.kind){
      case 'sun':circ(0,0,15,C);ctx.strokeStyle=C;ctx.lineWidth=3;for(let k=0;k<8;k++){const a=k*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*19,Math.sin(a)*19);ctx.lineTo(Math.cos(a)*26,Math.sin(a)*26);ctx.stroke()}break;
      case 'cloud':{const f=`hsl(${o.c.h} 25% ${92-(o.c.l-48)/3}%)`;circ(-12,4,11,f);circ(2,-3,14,f);circ(16,4,10,f);rect(-12,4,28,10,f);break}
      case 'bird':ctx.strokeStyle=dark;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-11,-2);ctx.quadraticCurveTo(-5,-8,0,0);ctx.quadraticCurveTo(6,-9,12,-3);ctx.stroke();circ(9,0,2,C);break;
      case 'butterfly':circ(-6,-3,6,C);circ(6,-3,6,C);circ(-5,5,4,C);circ(5,5,4,C);if(o.v){circ(-6,-3,2,'#fff');circ(6,-3,2,'#fff')}rect(-1,-7,2,14,dark);break;
      case 'tree':rect(-4,0,8,26,'#7a5232');circ(0,-6,18,C);circ(-12,2,11,C);circ(12,2,11,C);break;
      case 'flower':ctx.strokeStyle='#3f8a3a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,16);ctx.stroke();for(let k=0;k<5;k++){const a=k*Math.PI*2/5;circ(Math.cos(a)*6,Math.sin(a)*6-2,5,C)}circ(0,-2,3.5,'#f4d03f');break;
      case 'bush':{const f=`hsl(${110+(o.c.h%40)} 45% ${o.c.l-12}%)`;circ(-9,4,9,f);circ(0,-3,11,f);circ(10,4,9,f);break}
      case 'mushroom':rect(-3,0,6,11,'#f1e6cf');ctx.fillStyle=C;ctx.beginPath();ctx.arc(0,1,12,Math.PI,0);ctx.fill();if(o.v){circ(-5,-4,2,'#fff');circ(3,-7,2,'#fff');circ(6,-2,1.6,'#fff')}break;
      case 'house':rect(-24,-12,48,34,C);ctx.fillStyle='#7b3b31';ctx.beginPath();ctx.moveTo(-28,-12);ctx.lineTo(0,-34);ctx.lineTo(28,-12);ctx.fill();
        rect(-6,4,12,18,'#5a3a26');const wf=o.v?'#ffe27a':'#3c4a57';rect(-18,-6,9,9,wf);rect(9,-6,9,9,wf);break;
      case 'car':ctx.fillStyle=C;if(ctx.roundRect){ctx.beginPath();ctx.roundRect(-22,-6,44,14,4);ctx.fill();ctx.beginPath();ctx.roundRect(-12,-16,22,12,4);ctx.fill()}else{rect(-22,-6,44,14,C);rect(-12,-16,22,12,C)}
        rect(-8,-13,7,7,'#cfe9f7');rect(1,-13,7,7,'#cfe9f7');circ(-12,9,5,'#222');circ(12,9,5,'#222');rect(18,-3,4,3,'#ffe27a');break;
      case 'lamp':rect(-1.5,-18,3,38,'#444');rect(-8,-22,16,5,'#444');circ(0,-15,4,o.v?'#ffe27a':'#888');if(o.v){ctx.fillStyle='rgba(255,226,122,.25)';ctx.beginPath();ctx.arc(0,-15,10,0,7);ctx.fill()}break;
      case 'sign':rect(-1.5,-6,3,22,'#666');ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-12,-16);ctx.lineTo(8,-16);ctx.lineTo(14,-10);ctx.lineTo(8,-4);ctx.lineTo(-12,-4);ctx.fill();break;
      case 'frame':rect(-20,-15,40,30,'#8a5a32');rect(-16,-11,32,22,C);ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.moveTo(-16,11);ctx.lineTo(-4,-3);ctx.lineTo(4,5);ctx.lineTo(9,0);ctx.lineTo(16,11);ctx.fill();break;
      case 'clock':circ(0,0,15,'#fff');ctx.strokeStyle=C;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.stroke();ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-10);ctx.moveTo(0,0);ctx.lineTo(o.v?8:-8,o.v?2:4);ctx.stroke();break;
      case 'shelfbook':rect(-20,10,40,4,'#8a5a32');[-15,-8,-1,6,12].forEach((x,k)=>rect(x,-8+(k%2)*3,6,18-(k%2)*3,`hsl(${(o.c.h+k*47)%360} 55% 50%)`));break;
      case 'window':rect(-22,-18,44,36,'#fff');rect(-19,-15,38,30,o.v?'#9fd4f2':'#30425a');rect(-1,-15,2,30,'#fff');rect(-19,-1,38,2,'#fff');if(!o.v)circ(10,-7,4,'#f2e6a8');break;
      case 'plant':ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-10,2);ctx.lineTo(10,2);ctx.lineTo(7,18);ctx.lineTo(-7,18);ctx.fill();ctx.fillStyle='#3f8a3a';[-0.6,0,0.6].forEach(a=>{ctx.save();ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,-10,5,12,0,0,7);ctx.fill();ctx.restore()});break;
      case 'lampr':rect(-2,-6,4,22,'#555');rect(-9,15,18,4,'#555');ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-8,-20);ctx.lineTo(8,-20);ctx.lineTo(13,-6);ctx.lineTo(-13,-6);ctx.fill();if(o.v){ctx.fillStyle='rgba(255,226,122,.35)';ctx.beginPath();ctx.moveTo(-13,-6);ctx.lineTo(13,-6);ctx.lineTo(20,14);ctx.lineTo(-20,14);ctx.fill()}break;
      case 'chair':rect(-12,0,24,5,C);rect(8,-20,4,22,C);rect(-11,5,3,15,dark);rect(8,5,3,15,dark);break;
      case 'cup':rect(-7,-6,14,14,C);ctx.strokeStyle=C;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(9,1,4,-1.4,1.4);ctx.stroke();rect(-9,8,18,2,'#ddd');break;
      case 'books':[0,1,2].forEach(k=>rect(-14+k*2,8-k*7,28-k*4,7,`hsl(${(o.c.h+k*70)%360} 55% 50%)`));break;
      case 'ball':circ(0,0,11,C);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,11,-0.5,1.2);ctx.stroke();break;
    }
    ctx.restore();
  }
  function paint(ctx,list){
    bg(ctx);list.forEach(o=>obj(ctx,o));
    g.diffs.forEach(d=>{if(!d.found&&!d.hint)return;ctx.strokeStyle=d.found?'#0f7a62':'#f2b84b';ctx.lineWidth=4;ctx.setLineDash(d.found?[]:[6,5]);ctx.beginPath();ctx.arc(d.x,d.y,d.r+9,0,7);ctx.stroke();ctx.setLineDash([])});
    if(wrongMark){ctx.strokeStyle='#d64545';ctx.lineWidth=5;const {x,y}=wrongMark;ctx.beginPath();ctx.moveTo(x-10,y-10);ctx.lineTo(x+10,y+10);ctx.moveTo(x+10,y-10);ctx.lineTo(x-10,y+10);ctx.stroke()}
  }
  function draw(){paint(xA,g.A);paint(xB,g.B)}
  function size(c,x){const w=stage.clientWidth;c.width=Math.round(w*devicePixelRatio);c.height=Math.round(w*H/W*devicePixelRatio);c.style.height=(w*H/W)+'px';x.setTransform(w/W*devicePixelRatio,0,0,w/W*devicePixelRatio,0,0)}
  function upd(){setStat('s1',mode&&mode.daily?'اليوم':g.level);setStat('s2',g.diffs.filter(d=>d.found).length+'/'+g.diffs.length);setStat('s3',g.mistakes);setStat('s4',fmtTime(g.time))}
  function tap(e,c){if(g.over)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
    const d=g.diffs.filter(d=>!d.found).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
    if(d&&Math.hypot(d.x-x,d.y-y)<d.r+16){d.found=true;d.hint=false;snd('ok');buzz(20)}
    else{g.mistakes++;snd('err');buzz(60);wrongMark={x,y};setTimeout(()=>{wrongMark=null;draw()},500)}
    draw();upd();
    if(g.diffs.every(d=>d.found)){g.over=true;clearInterval(timer);const s=g.mistakes===0&&g.hints===0?3:g.mistakes+g.hints<=2?2:1;const earned=!(mode&&mode.daily)&&g.level%3===0;if(earned){st.hints++;gSave('diff',st)}
      const key=mode&&mode.daily?'daily':'l'+g.level;const prev=st.bestTime[key];if(!prev||g.time<prev){st.bestTime[key]=g.time;gSave('diff',st)}
      finishLevel(DiffGame,st,g.level,s,{mistakes:g.mistakes,hints:g.hints,time:g.time},'وجدتها كلها!',`الوقت ${fmtTime(g.time)} · أخطاء ${g.mistakes}`+(earned?' · كسبت تلميحاً':''))}}
  function play(level){clearOverlays();clearInterval(timer);st=gState('diff',{hints:3,bestTime:{}});g=mode&&mode.daily?build(9,mode.seed):build(level);g.flips=2;flicking=false;if(cb){cb.lastChild.textContent='قارن (2)';cb.disabled=false}draw();upd();
    timer=setInterval(()=>{if(document.hidden||g.over)return;g.time++;setStat('s4',fmtTime(g.time))},1000)}
  return {id:'diff',name:'أوجد الاختلاف',desc:'حديقة وشارع وغرفة: اكتشف الفروق',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="4" y="8" width="18" height="32" rx="4" fill="#bfe3f5"/><rect x="26" y="8" width="18" height="32" rx="4" fill="#bfe3f5"/><rect x="4" y="26" width="18" height="14" rx="3" fill="#7cc46a"/><rect x="26" y="26" width="18" height="14" rx="3" fill="#7cc46a"/><circle cx="13" cy="24" r="5" fill="#3fbf9b"/><circle cx="35" cy="24" r="5" fill="#f2b84b"/></svg>',
    help:'الصورتان متشابهتان إلا في بعض التفاصيل: لون، أو حجم، أو شيء مفقود، أو نافذة مضيئة، أو سيارة بالاتجاه المعاكس. اضغط مكان الاختلاف في أي صورة. الضغط الخاطئ يُحسب خطأ. زر «قارن» يبدّل الصورة الأصلية بالمعدّلة بسرعة في مكانها، فتلاحظ ما يتغيّر (مرتان في كل مستوى).',
    progress(){const s=gState('diff',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('diff',{hints:3,bestTime:{}});setStats([['s1','المستوى'],['s2','وجدت','gold'],['s3','أخطاء'],['s4','الوقت']]);
      const la=document.createElement('div');la.className='difflabel';la.textContent='الصورة الأصلية';const lb=document.createElement('div');lb.className='difflabel';lb.textContent='الصورة المعدّلة';
      cA=document.createElement('canvas');cB=document.createElement('canvas');xA=cA.getContext('2d');xB=cB.getContext('2d');stage.append(la,cA,lb,cB);size(cA,xA);size(cB,xB);
      cA.onpointerdown=e=>tap(e,cA);cB.onpointerdown=e=>tap(e,cB);this.rs=()=>{size(cA,xA);size(cB,xB);draw()};addEventListener('resize',this.rs);
      btn('تلميح',IC.hint,()=>{if(!st.hints||g.over)return;const d=g.diffs.find(d=>!d.found&&!d.hint);if(!d)return;d.hint=true;g.hints++;st.hints--;gSave('diff',st);snd('tap');draw();upd();toast('تلميحات متبقية: '+st.hints)});
      cb=btn('قارن',IC.flip,()=>{if(g.over||flicking||!g.flips)return;g.flips--;flicking=true;cb.lastChild.textContent='قارن ('+g.flips+')';cb.disabled=!g.flips;snd('tap');
        let f=0;const iv=setInterval(()=>{f++;paint(xA,f%2?g.B:g.A);if(f>=8){clearInterval(iv);flicking=false;draw()}},320);
        cA.scrollIntoView({block:'nearest',behavior:'smooth'})});
      btn('إعادة',IC.reset,()=>play(g.level));play(st.level)},
    stop(){clearInterval(timer);removeEventListener('resize',this.rs)}};
})();
