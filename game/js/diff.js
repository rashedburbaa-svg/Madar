/* ================= game 4: spot the difference (drawn scenes) ================= */
const DiffGame=(()=>{
  const W=400,H=260;let st,g,cA,cB,xA,xB,wA,wB,zb,Z=1,downAt=null,wrongMark=null,timer=0,cb,flicking=false;
  const col=c=>`hsl(${c.h} ${c.s}% ${c.l}%)`;
  const KINDS={
    space:{bands:{sky:['planet','planet','star','star','comet','ufo','satellite','moonc'],ground:['rocket','astronaut','astronaut','rover','flagp','alien','alien','rocket']}},
    garden:{bands:{sky:['sun','cloud','cloud','bird','bird','butterfly'],ground:['tree','tree','flower','flower','flower','bush','mushroom','mushroom','butterfly']}},
    street:{bands:{sky:['cloud','cloud','bird','sun'],ground:['house','house','car','car','lamp','tree','sign','bush']}},
    room:{bands:{sky:['frame','frame','clock','shelfbook','window'],ground:['plant','lampr','chair','cup','books','plant','ball']}},
    station:{bands:{sky:['porthole','porthole','cpanel','screen','screen','clock'],ground:['astronaut','robot','robot','crate','crate','plant','helmet']}},
    souq:{bands:{sky:['lantern','lantern','lantern','sign'],ground:['dallah','rug','basket','basket','jar','jar','cushion']}},
    beach:{bands:{sky:['sun','cloud','cloud','bird','bird'],ground:['umbrella','umbrella','ball','bucket','shell','shell','boat','palm','crab']}}
  };
  const BASE={porthole:20,cpanel:22,screen:20,robot:18,crate:14,helmet:13,lantern:16,dallah:16,rug:22,basket:14,jar:14,cushion:14,umbrella:24,bucket:12,shell:11,boat:24,palm:26,crab:13,planet:22,star:12,comet:20,ufo:22,satellite:20,moonc:15,rocket:26,astronaut:18,rover:22,flagp:18,alien:15,sun:22,cloud:22,bird:12,butterfly:12,tree:26,flower:13,bush:16,mushroom:13,house:30,car:24,lamp:20,sign:16,frame:20,clock:17,shelfbook:18,window:24,plant:18,lampr:20,chair:20,cup:12,books:16,ball:12};
  const VAR={porthole:1,cpanel:1,screen:1,robot:1,lantern:1,dallah:1,rug:1,jar:1,umbrella:1,shell:1,palm:1,planet:1,star:1,ufo:1,rocket:1,flagp:1,alien:1,house:1,lamp:1,lampr:1,clock:1,mushroom:1,window:1,butterfly:1};
  const FLIP={boat:1,crab:1,helmet:1,comet:1,satellite:1,astronaut:1,rover:1,moonc:1,car:1,bird:1,chair:1,cup:1,sign:1};
  function build(level,seed){
    const R=rng(seed??level*977+5),theme=['space','garden','station','street','souq','room','beach'][(level-1)%7],M=Math.min(9+level,20),D=Math.min(3+Math.floor(level/2),8),subtle=level>=7;
    const hue=()=>[4,24,45,90,150,190,210,260,300,335][Math.floor(R()*10)];
    const objs=[];const bands=KINDS[theme].bands;let tries=0;
    while(objs.length<M&&tries++<900){
      const band=R()<0.3?'sky':'ground',list=bands[band],kind=list[Math.floor(R()*list.length)];
      if(kind==='sun'&&objs.some(o=>o.kind==='sun'))continue;
      const s=0.75+R()*0.5,r=BASE[kind]*s;
      const indoor=theme==='room'||theme==='station',y=band==='sky'?(indoor?40+R()*70:22+R()*60):(indoor?170+R()*55:theme==='beach'?170+R()*62:150+R()*80);
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
    if(g.theme==='space'){const sk=ctx.createLinearGradient(0,0,0,150);sk.addColorStop(0,'#070a22');sk.addColorStop(1,'#20164a');ctx.fillStyle=sk;ctx.fillRect(0,0,W,H);
      const R=rng(g.level*977+11);for(let k=0;k<80;k++){ctx.fillStyle=`rgba(255,255,255,${0.3+R()*0.7})`;ctx.fillRect(R()*W,R()*140,R()<0.15?2:1,R()<0.15?2:1)}
      ctx.fillStyle='#8c8f97';ctx.beginPath();ctx.moveTo(0,148);ctx.quadraticCurveTo(W/2,128,W,148);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
      for(let k=0;k<7;k++){const x=R()*W,y=160+R()*90,r=6+R()*14;ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(x-1,y-1,r,r*0.35,0,0,7);ctx.fill();ctx.fillStyle='rgba(40,40,50,.35)';ctx.beginPath();ctx.ellipse(x,y,r*0.9,r*0.3,0,0,7);ctx.fill()}
      return}
    if(g.theme==='station'){const wl=ctx.createLinearGradient(0,0,0,170);wl.addColorStop(0,'#46546a');wl.addColorStop(1,'#2c3646');ctx.fillStyle=wl;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,165);ctx.stroke()}for(let y=30;y<165;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      ctx.fillStyle='#1d232c';ctx.fillRect(0,165,W,H-165);for(let x=0;x<W;x+=20){ctx.fillStyle=(x/20)%2?'#f2b84b':'#222';ctx.fillRect(x,162,20,5)}return}
    if(g.theme==='souq'){ctx.fillStyle='#d8b384';ctx.fillRect(0,0,W,H);ctx.fillStyle='#b88c5c';for(let x=10;x<W;x+=100){ctx.beginPath();ctx.moveTo(x,140);ctx.lineTo(x,40);ctx.quadraticCurveTo(x+40,0,x+80,40);ctx.lineTo(x+80,140);ctx.fill()}
      ctx.fillStyle='#c4955f';ctx.fillRect(0,140,W,H-140);ctx.strokeStyle='rgba(0,0,0,.12)';for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,140);ctx.lineTo(x-15,H);ctx.stroke()}return}
    if(g.theme==='beach'){ctx.fillStyle='#a8dcf5';ctx.fillRect(0,0,W,H);ctx.fillStyle='#3a9fd6';ctx.fillRect(0,118,W,44);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;
      for(let x=0;x<W;x+=40){ctx.beginPath();ctx.arc(x+20,160,12,Math.PI*1.1,Math.PI*1.9);ctx.stroke()}ctx.fillStyle='#f0d9a0';ctx.fillRect(0,160,W,H-160);ctx.fillStyle='rgba(180,140,80,.25)';for(let k=0;k<40;k++)ctx.fillRect((k*97)%W,165+(k*53)%90,2,2);return}
    if(g.theme==='garden'){ctx.fillStyle='#bfe3f5';ctx.fillRect(0,0,W,H);ctx.fillStyle='#9fd38a';ctx.beginPath();ctx.ellipse(110,150,180,40,0,0,7);ctx.fill();ctx.fillStyle='#7cc46a';ctx.fillRect(0,140,W,H-140);ctx.fillStyle='#8fd07a';for(let i=0;i<W;i+=26)ctx.fillRect(i,150+(i%3)*25,12,3)}
    else if(g.theme==='street'){ctx.fillStyle='#cde8f7';ctx.fillRect(0,0,W,H);ctx.fillStyle='#d9d2c5';ctx.fillRect(0,135,W,95);ctx.fillStyle='#5c6166';ctx.fillRect(0,222,W,38);ctx.fillStyle='#e8e2c8';for(let i=10;i<W;i+=50)ctx.fillRect(i,239,26,4)}
    else{ctx.fillStyle=`hsl(${g.bgH} 35% 86%)`;ctx.fillRect(0,0,W,H);ctx.fillStyle='#b88a5e';ctx.fillRect(0,175,W,H-175);ctx.strokeStyle='#a2774f';ctx.lineWidth=1;for(let i=0;i<W;i+=50){ctx.beginPath();ctx.moveTo(i,175);ctx.lineTo(i-20,H);ctx.stroke()}ctx.fillStyle='#fff';ctx.fillRect(0,170,W,6)}
  }
  function obj(ctx,o){
    if(o.gone)return;ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.s*(o.f?-1:1),o.s);const C=col(o.c),dark='#3b2f2a';
    const circ=(x,y,r,f)=>{ctx.fillStyle=f;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()};
    const rect=(x,y,w,h,f)=>{ctx.fillStyle=f;ctx.fillRect(x,y,w,h)};
    switch(o.kind){
      case 'planet':circ(0,0,14,C);ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.ellipse(-2,-5,12,3,0,0,7);ctx.fill();ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(1,5,12,3,0,0,7);ctx.fill();
        if(o.v){ctx.strokeStyle='#efe2b4';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,24,6,-0.3,0,7);ctx.stroke()}break;
      case 'star':{const n=o.v?6:5,f=`hsl(${o.c.h} 85% 75%)`;ctx.fillStyle=f;ctx.beginPath();for(let k=0;k<n*2;k++){const rr2=k%2?5:12,an=k*Math.PI/n-Math.PI/2;ctx.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2)}ctx.fill();break}
      case 'comet':{ctx.globalAlpha=0.75;ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(8,-6);ctx.lineTo(-24,0);ctx.lineTo(8,6);ctx.fill();ctx.globalAlpha=1;circ(8,0,6,'#f4f8ff');break}
      case 'ufo':if(o.v){ctx.fillStyle='rgba(255,236,140,.35)';ctx.beginPath();ctx.moveTo(-8,3);ctx.lineTo(8,3);ctx.lineTo(16,26);ctx.lineTo(-16,26);ctx.fill()}
        ctx.fillStyle='rgba(150,230,255,.9)';ctx.beginPath();ctx.ellipse(0,-4,8,7,0,Math.PI,0);ctx.fill();ctx.fillStyle=C;ctx.beginPath();ctx.ellipse(0,0,22,6.5,0,0,7);ctx.fill();[-11,0,11].forEach(x=>circ(x,1,2,'#ffe27a'));break;
      case 'satellite':rect(-5,-5,10,10,'#d4d8de');rect(-22,-3,15,6,C);rect(7,-3,15,6,C);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;[-17,-12,12,17].forEach(x=>{ctx.beginPath();ctx.moveTo(x,-3);ctx.lineTo(x,3);ctx.stroke()});
        ctx.strokeStyle='#d4d8de';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,-12);ctx.stroke();circ(0,-13,2.5,'#d4d8de');break;
      case 'moonc':ctx.fillStyle=`hsl(${o.c.h} 55% 82%)`;ctx.beginPath();ctx.arc(0,0,13,-Math.PI/2,Math.PI/2,true);ctx.ellipse(0,0,6,13,0,Math.PI/2,Math.PI*1.5,false);ctx.fill();break;
      case 'rocket':if(o.v){ctx.fillStyle='#ffb347';ctx.beginPath();ctx.moveTo(-5,12);ctx.lineTo(5,12);ctx.lineTo(0,25);ctx.fill()}
        ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-8,4);ctx.lineTo(-14,16);ctx.lineTo(-8,12);ctx.fill();ctx.beginPath();ctx.moveTo(8,4);ctx.lineTo(14,16);ctx.lineTo(8,12);ctx.fill();
        ctx.fillStyle='#eef2f7';ctx.beginPath();ctx.moveTo(0,-22);ctx.quadraticCurveTo(8,-12,8,-6);ctx.lineTo(8,12);ctx.lineTo(-8,12);ctx.lineTo(-8,-6);ctx.quadraticCurveTo(-8,-12,0,-22);ctx.fill();
        ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(0,-22);ctx.quadraticCurveTo(6,-15,7,-11);ctx.lineTo(-7,-11);ctx.quadraticCurveTo(-6,-15,0,-22);ctx.fill();circ(0,-2,3.5,'#5fb8e8');break;
      case 'astronaut':rect(-9,0,4,10,'#aab3bd');rect(-6,1,12,12,'#e8ecf0');rect(-5,13,4,7,'#e8ecf0');rect(1,13,4,7,'#e8ecf0');rect(6,3,6,3,'#e8ecf0');rect(-6,6,12,2,C);
        circ(0,-6,7,'#f4f6f8');ctx.fillStyle='#f0a030';ctx.beginPath();ctx.ellipse(2,-6,4.2,3.2,0,0,7);ctx.fill();break;
      case 'rover':rect(-16,-8,32,9,C);rect(-14,-12,18,3,'#2e4a7a');ctx.strokeStyle='#ccc';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(9,-8);ctx.lineTo(9,-18);ctx.stroke();rect(6,-21,7,4,'#ddd');[-11,0,11].forEach(x=>circ(x,4,5,'#333'));break;
      case 'flagp':rect(-1,-20,2,32,'#cfd4da');rect(1,-20,17,11,C);if(o.v)circ(9.5,-14.5,2.4,'#fff');break;
      case 'alien':circ(0,5,8,C);circ(0,-7,8,C);ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(-3,-7,2.4,3.4,0.3,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(3,-7,2.4,3.4,-0.3,0,7);ctx.fill();
        ctx.strokeStyle=C;ctx.lineWidth=1.5;(o.v?[-4,4]:[0]).forEach(x=>{ctx.beginPath();ctx.moveTo(x*0.6,-14);ctx.lineTo(x,-20);ctx.stroke();circ(x,-21,2,'#ffe27a')});break;
      case 'porthole':circ(0,0,15,'#9aa5b4');circ(0,0,11,'#0a0f2a');ctx.fillStyle='#fff';ctx.fillRect(-6,-5,1,1);ctx.fillRect(5,-7,1,1);circ(3,2,5,o.v?'#4aa8ff':'#d8d8dc');if(o.v)circ(1,1,2,'#7ddc5a');ctx.strokeStyle=C;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.stroke();break;
      case 'cpanel':rect(-20,-12,40,24,'#232b37');for(let k=0;k<6;k++)circ(-14+k*5.6,-5,2,k%2?C:'#5ff2d6');rect(-14,2,28,6,o.v?'#1f6f5a':'#5a2a2a');rect(-14,2,9,6,C);break;
      case 'screen':rect(-18,-13,36,25,'#14181f');rect(-15,-10,30,19,C);if(o.v){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-12,4);ctx.lineTo(-5,-3);ctx.lineTo(1,2);ctx.lineTo(10,-6);ctx.stroke()}else{rect(-12,-6,10,2,'rgba(255,255,255,.7)');rect(-12,-1,16,2,'rgba(255,255,255,.7)')}break;
      case 'crate':rect(-12,-12,24,22,C);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;ctx.strokeRect(-12,-12,24,22);ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(12,10);ctx.stroke();break;
      case 'robot':rect(-9,-6,18,15,C);rect(-7,-17,14,11,'#cfd6de');circ(-3,-12,1.8,'#111');circ(3,-12,1.8,'#111');circ(-6,11,3,'#333');circ(6,11,3,'#333');if(o.v){ctx.strokeStyle='#cfd6de';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(0,-23);ctx.stroke();circ(0,-24,2,'#ff5d73')}break;
      case 'helmet':circ(0,0,11,'#eef2f6');ctx.fillStyle=C;ctx.beginPath();ctx.ellipse(3,0,6,5,0,0,7);ctx.fill();rect(-11,8,22,3,'#9aa5b4');break;
      case 'lantern':ctx.strokeStyle='#5a4028';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(0,-12);ctx.stroke();if(o.v){ctx.fillStyle='rgba(255,220,120,.35)';ctx.beginPath();ctx.arc(0,0,16,0,7);ctx.fill()}
        ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-6,-12);ctx.lineTo(6,-12);ctx.lineTo(9,6);ctx.lineTo(-9,6);ctx.fill();rect(-10,6,20,3,'#5a4028');rect(-4,-15,8,3,'#5a4028');rect(-1,-9,2,13,o.v?'#ffe27a':'rgba(0,0,0,.25)');break;
      case 'dallah':ctx.fillStyle=C;ctx.beginPath();ctx.ellipse(0,4,9,10,0,0,7);ctx.fill();rect(-4,-12,8,8,C);ctx.beginPath();ctx.moveTo(-3,-14);ctx.lineTo(0,-20);ctx.lineTo(3,-14);ctx.fill();
        ctx.strokeStyle=C;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(8,0);ctx.quadraticCurveTo(16,-4,18,-12);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(-10,2,5,1.6,4.7);ctx.stroke();
        if(o.v){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;[[-2,-24],[3,-27]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x,y+4);ctx.quadraticCurveTo(x+3,y,x,y-4);ctx.stroke()})}break;
      case 'rug':rect(-22,-7,44,15,C);ctx.strokeStyle='#f6e7c8';ctx.lineWidth=1.5;ctx.strokeRect(-19,-4,38,9);if(o.v){ctx.fillStyle='#f6e7c8';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(6,0.5);ctx.lineTo(0,5);ctx.lineTo(-6,0.5);ctx.fill()}
        ctx.strokeStyle='#f6e7c8';ctx.lineWidth=1;for(let x=-21;x<=21;x+=4){ctx.beginPath();ctx.moveTo(x,8);ctx.lineTo(x,11);ctx.stroke()}break;
      case 'basket':ctx.fillStyle=C;ctx.beginPath();ctx.arc(0,-1,10,Math.PI,0);ctx.fill();rect(-12,-2,24,12,'#8a5a32');ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;for(let x=-10;x<12;x+=4){ctx.beginPath();ctx.moveTo(x,-2);ctx.lineTo(x,10);ctx.stroke()}break;
      case 'jar':ctx.fillStyle=C;ctx.beginPath();ctx.ellipse(0,3,10,11,0,0,7);ctx.fill();rect(-4,-12,8,6,C);rect(-6,-13,12,2,C);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-9,2);ctx.lineTo(9,2);ctx.stroke();
        if(o.v){ctx.strokeStyle=C;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(10,-3,5,-1.4,1.4);ctx.stroke()}break;
      case 'cushion':ctx.fillStyle=C;if(ctx.roundRect){ctx.beginPath();ctx.roundRect(-14,-8,28,16,6);ctx.fill()}else rect(-14,-8,28,16,C);circ(0,0,3,'rgba(255,255,255,.6)');break;
      case 'umbrella':rect(-1,-12,2,30,'#7a5232');const st2=o.v?6:4;for(let k=0;k<st2;k++){ctx.fillStyle=k%2?'#fff':C;ctx.beginPath();ctx.moveTo(0,-14);ctx.arc(0,-6,22,Math.PI+k*Math.PI/st2,Math.PI+(k+1)*Math.PI/st2);ctx.fill()}break;
      case 'bucket':ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-9,-6);ctx.lineTo(9,-6);ctx.lineTo(7,9);ctx.lineTo(-7,9);ctx.fill();ctx.strokeStyle=C;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-6,9,Math.PI,0);ctx.stroke();break;
      case 'shell':ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(0,8);for(let k=0;k<=6;k++){const a=Math.PI+k*Math.PI/6;ctx.lineTo(Math.cos(a)*11,Math.sin(a)*11+2)}ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;
        for(let k=1;k<6;k++){const a=Math.PI+k*Math.PI/6;ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10+2);ctx.stroke()}if(o.v)circ(0,6,2.5,'#fff');break;
      case 'boat':ctx.fillStyle=C;ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(22,0);ctx.lineTo(15,9);ctx.lineTo(-15,9);ctx.fill();rect(-1,-24,2,24,'#5a3a26');ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(1,-22);ctx.lineTo(15,-3);ctx.lineTo(1,-3);ctx.fill();break;
      case 'palm':ctx.strokeStyle='#8a5a32';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,22);ctx.quadraticCurveTo(-5,5,2,-12);ctx.stroke();ctx.strokeStyle=C;ctx.lineWidth=4;ctx.lineCap='round';
        [-2.6,-2,-1.2,-0.5].forEach(a=>{ctx.beginPath();ctx.moveTo(2,-12);ctx.quadraticCurveTo(2+Math.cos(a)*10,-12+Math.sin(a)*14,2+Math.cos(a)*20,-6+Math.sin(a)*8);ctx.stroke()});ctx.lineCap='butt';if(o.v){circ(-1,-9,2.8,'#6b4422');circ(4,-8,2.8,'#6b4422')}break;
      case 'crab':ctx.strokeStyle=C;ctx.lineWidth=2;for(const s2 of [-1,1])for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(s2*6,2+k*2);ctx.lineTo(s2*13,6+k*3);ctx.stroke()}
        ctx.fillStyle=C;ctx.beginPath();ctx.ellipse(0,2,10,6,0,0,7);ctx.fill();circ(-12,-6,4,C);circ(12,-4,3,C);circ(-3,-4,1.6,'#111');circ(3,-4,1.6,'#111');break;
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
  function size(c,x){const w=stage.clientWidth*Z;c.width=Math.round(w*devicePixelRatio);c.height=Math.round(w*H/W*devicePixelRatio);c.style.width=w+'px';c.style.height=(w*H/W)+'px';c.style.touchAction=Z>1?'pan-x pan-y':'none';x.setTransform(w/W*devicePixelRatio,0,0,w/W*devicePixelRatio,0,0)}
  // zoom doubles both pictures; drag inside either one to look around, the other follows
  function setZoom(z){const cx=(wA.scrollLeft+wA.clientWidth/2)/(cA.clientWidth||1),cy=(wA.scrollTop+wA.clientHeight/2)/(cA.clientHeight||1);Z=z;size(cA,xA);size(cB,xB);draw();
    wA.classList.toggle('zoomed',Z>1);wB.classList.toggle('zoomed',Z>1);const L=cx*cA.clientWidth-wA.clientWidth/2,T2=cy*cA.clientHeight-wA.clientHeight/2;[wA,wB].forEach(w=>{w.scrollLeft=L;w.scrollTop=T2});
    zb.lastChild.textContent=Z>1?'تصغير':'تكبير';snd('tap')}
  let syncing=false;const sync=(a,b)=>()=>{if(syncing)return;syncing=true;b.scrollLeft=a.scrollLeft;b.scrollTop=a.scrollTop;requestAnimationFrame(()=>{syncing=false})};
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
    timer=setInterval(()=>{if(document.hidden||gPaused||g.over)return;g.time++;setStat('s4',fmtTime(g.time))},1000)}
  return {id:'diff',name:'أوجد الاختلاف',desc:'الفضاء ومحطة الفضاء والسوق والشاطئ وغيرها: اكتشف الفروق',play,
    icon:'<svg viewBox="0 0 48 48"><rect x="4" y="8" width="18" height="32" rx="4" fill="#bfe3f5"/><rect x="26" y="8" width="18" height="32" rx="4" fill="#bfe3f5"/><rect x="4" y="26" width="18" height="14" rx="3" fill="#7cc46a"/><rect x="26" y="26" width="18" height="14" rx="3" fill="#7cc46a"/><circle cx="13" cy="24" r="5" fill="#3fbf9b"/><circle cx="35" cy="24" r="5" fill="#f2b84b"/></svg>',
    help:'الصورتان متشابهتان إلا في بعض التفاصيل: لون، أو حجم، أو شيء مفقود، أو نافذة مضيئة، أو سيارة بالاتجاه المعاكس. اضغط مكان الاختلاف في أي صورة. الضغط الخاطئ يُحسب خطأ. «تكبير» يضاعف حجم الصورتين، فاسحب داخل أي صورة لتتنقل فيها وتتحرك الأخرى معها. زر «قارن» يبدّل الصورة الأصلية بالمعدّلة بسرعة في مكانها، فتلاحظ ما يتغيّر (مرتان في كل مستوى).',
    progress(){const s=gState('diff',{hints:3});return {level:s.level,stars:starTotal(s)}},
    start(){st=gState('diff',{hints:3,bestTime:{}});setStats([['s1','المستوى'],['s2','وجدت','gold'],['s3','أخطاء'],['s4','الوقت']]);
      const la=document.createElement('div');la.className='difflabel';la.textContent='الصورة الأصلية';const lb=document.createElement('div');lb.className='difflabel';lb.textContent='الصورة المعدّلة';
      cA=document.createElement('canvas');cB=document.createElement('canvas');xA=cA.getContext('2d');xB=cB.getContext('2d');Z=1;
      wA=document.createElement('div');wA.className='dz';wA.appendChild(cA);wB=document.createElement('div');wB.className='dz';wB.appendChild(cB);
      stage.append(la,wA,lb,wB);size(cA,xA);size(cB,xB);wA.onscroll=sync(wA,wB);wB.onscroll=sync(wB,wA);
      // a tap counts only if the finger didn't move (so dragging a zoomed picture never costs a mistake)
      [cA,cB].forEach(c=>{c.onpointerdown=e=>{downAt={x:e.clientX,y:e.clientY,c}};c.onpointercancel=()=>{downAt=null};
        c.onpointerup=e=>{if(downAt&&downAt.c===c&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<10)tap(e,c);downAt=null}});this.rs=()=>{size(cA,xA);size(cB,xB);draw()};addEventListener('resize',this.rs);
      btn('تلميح',IC.hint,()=>{if(!st.hints||g.over)return;const d=g.diffs.find(d=>!d.found&&!d.hint);if(!d)return;d.hint=true;g.hints++;st.hints--;gSave('diff',st);snd('tap');draw();upd();toast('تلميحات متبقية: '+st.hints)});
      cb=btn('قارن',IC.flip,()=>{if(g.over||flicking||!g.flips)return;g.flips--;flicking=true;cb.lastChild.textContent='قارن ('+g.flips+')';cb.disabled=!g.flips;snd('tap');
        let f=0;const iv=setInterval(()=>{f++;paint(xA,f%2?g.B:g.A);if(f>=8){clearInterval(iv);flicking=false;draw()}},320);
        cA.scrollIntoView({block:'nearest',behavior:'smooth'})});
      btn('إعادة',IC.reset,()=>play(g.level));zb=btn('تكبير',IC.check,()=>setZoom(Z>1?1:2));play(st.level)},
    stop(){clearInterval(timer);removeEventListener('resize',this.rs)}};
})();
