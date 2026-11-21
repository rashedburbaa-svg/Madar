/* ================= 3D spaceship models for «طيّار المدار» — rendered once with three.js into cached sprites ================= */
const Ship3D=(function(){
  let R=null,scene,cam,failed=false;const cache={};
  function init(){try{if(typeof THREE==='undefined')throw 0;R=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});R.setPixelRatio(1);R.setClearColor(0,0);R.outputColorSpace=THREE.SRGBColorSpace;
    scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(26,1,.1,100);
    scene.add(new THREE.HemisphereLight(0xe6eeff,0x2a2040,1.15));const k=new THREE.DirectionalLight(0xffffff,2.3);k.position.set(-3,8,4);scene.add(k);
    const r=new THREE.DirectionalLight(0x7ffcf0,1.1);r.position.set(4,3,-5);scene.add(r)}catch(e){failed=true;R=null}}
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.15},o||{}));
  const glowM=c=>M(c,{emissive:c,emissiveIntensity:2});
  function box(w,h,d,m,x,y,z){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x||0,y||0,z||0);return b}
  function cone(r,l,m,seg){const c=new THREE.Mesh(new THREE.ConeGeometry(r,l,seg||12),m);c.rotation.x=-Math.PI/2;return c}
  /* every model's nose points to -Z (up on screen); enemies are turned around afterwards */
  function fighter(){const g=new THREE.Group(),w=M(0xf2f4f8,{roughness:.45}),gold=M(0xf2bd4e,{metalness:.4,roughness:.3,emissive:0x3a2600,emissiveIntensity:.4}),dk=M(0x0b1530,{metalness:.9,roughness:.1,emissive:0x0a3a4a,emissiveIntensity:.5}),cy=glowM(0x5ff2d6);
    const nose=cone(.36,1.5,w,16);nose.position.z=-.95;g.add(nose);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.36,.42,1.3,16),w);body.rotation.x=Math.PI/2;body.position.z=.4;g.add(body);
    const cp=new THREE.Mesh(new THREE.SphereGeometry(.3,18,12),dk);cp.scale.set(.85,.7,1.6);cp.position.set(0,.28,-.35);g.add(cp);
    const wing=new THREE.Shape();wing.moveTo(0,-.5);wing.lineTo(1.45,.45);wing.lineTo(1.45,.75);wing.lineTo(0,.7);
    const wg=new THREE.ExtrudeGeometry(wing,{depth:.08,bevelEnabled:false});
    for(const s of [-1,1]){const m=new THREE.Mesh(wg,w);m.rotation.x=Math.PI/2;m.scale.x=s;m.position.set(0,.04,.05);g.add(m);
      const edge=box(.08,.1,.5,gold,1.42*s,.06,.6);g.add(edge);const tip=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),cy);tip.position.set(1.42*s,.1,.35);g.add(tip);
      const gun=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.7,8),gold);gun.rotation.x=Math.PI/2;gun.position.set(.7*s,.1,-.05);g.add(gun);
      const fin=box(.06,.45,.45,gold,.3*s,.32,.85);fin.rotation.z=-.25*s;g.add(fin);
      const eng=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.5,12),M(0x9aa6b4));eng.rotation.x=Math.PI/2;eng.position.set(.42*s,0,1.05);g.add(eng);
      const fl=new THREE.Mesh(new THREE.CircleGeometry(.15,14),cy);fl.position.set(.42*s,0,1.31);g.add(fl)}
    const stripe=box(.12,.02,1.2,gold,0,.38,.3);g.add(stripe);return g}
  function scout(){const g=new THREE.Group(),r=M(0xd8344f,{roughness:.4}),dk=M(0x2a2e3a,{metalness:.6,roughness:.3}),y=glowM(0xffe14d);
    const n=cone(.3,1.3,r,4);n.rotation.y=Math.PI/4;n.position.z=-.5;g.add(n);
    for(const s of [-1,1]){const wv=box(1.1,.07,.5,dk,.55*s,0,.25);wv.rotation.y=.45*s;g.add(wv);const t=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),y);t.position.set(1.0*s,.05,.55);g.add(t)}
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),y);eye.position.set(0,.2,-.2);g.add(eye);return g}
  function bomber(){const g=new THREE.Group(),p=M(0x7a4bd6,{roughness:.45}),dk=M(0x2a2240,{metalness:.5}),gl=glowM(0xff5df2);
    const b=new THREE.Mesh(new THREE.SphereGeometry(.85,20,14),p);b.scale.set(1.2,.45,1);g.add(b);
    for(const s of [-1,1]){const pod=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,1.3,12),dk);pod.rotation.x=Math.PI/2;pod.position.set(1.15*s,0,0);g.add(pod);
      const l=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),gl);l.position.set(1.15*s,.05,-.7);g.add(l)}
    const core=new THREE.Mesh(new THREE.SphereGeometry(.3,14,10),gl);core.position.set(0,.3,-.2);g.add(core);return g}
  function diver(){const g=new THREE.Group(),o=M(0xff8a3c,{roughness:.4}),dk=M(0x3a2a20,{metalness:.5}),gl=glowM(0xffd34d);
    const n=cone(.38,1.9,o,3);n.position.z=-.2;g.add(n);for(const s of [-1,1]){const f=box(.9,.06,.35,dk,.45*s,0,.5);f.rotation.y=-.6*s;g.add(f)}
    const e=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),gl);e.position.set(0,0,.75);g.add(e);return g}
  function boss(){const g=new THREE.Group(),h=M(0x8a93a2,{metalness:.55,roughness:.35}),dk=M(0x2a2e3a,{metalness:.6,roughness:.3}),red=glowM(0xff3d5a),gold=M(0xf2bd4e,{metalness:.5,roughness:.3});
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(2.6,3,.6,40),h);g.add(disc);const top=new THREE.Mesh(new THREE.SphereGeometry(1.2,24,14,0,Math.PI*2,0,Math.PI/2),dk);top.position.y=.3;g.add(top);
    const core=new THREE.Mesh(new THREE.SphereGeometry(.55,18,12),red);core.position.set(0,.55,-.9);g.add(core);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.8,.12,8,48),gold);ring.rotation.x=Math.PI/2;g.add(ring);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,c=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,.7,10),dk);c.position.set(Math.cos(a)*2.2,.45,Math.sin(a)*2.2);g.add(c);
      const l=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),red);l.position.set(Math.cos(a)*2.2,.85,Math.sin(a)*2.2);g.add(l)}
    for(const s of [-1,1]){const gun=box(.35,.3,1.6,dk,1.2*s,.2,-2.2);g.add(gun)}return g}
  function stealth(){const g=new THREE.Group(),dk=M(0x5a6080,{metalness:.35,roughness:.35,emissive:0x15102a,emissiveIntensity:.5}),pu=M(0xa070ff,{metalness:.4,roughness:.35}),vi=M(0x0b1530,{metalness:.9,roughness:.08,emissive:0x3a1a6a,emissiveIntensity:.8}),gl=glowM(0xb98cff);
    const sh=new THREE.Shape();sh.moveTo(0,-1.7);sh.lineTo(1.55,.9);sh.lineTo(.5,.6);sh.lineTo(0,1.0);sh.lineTo(-.5,.6);sh.lineTo(-1.55,.9);sh.closePath();
    const wing=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.18,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1}),dk);wing.rotation.x=Math.PI/2;wing.position.y=.12;g.add(wing);
    const cp=new THREE.Mesh(new THREE.SphereGeometry(.28,16,10),vi);cp.scale.set(.8,.6,1.8);cp.position.set(0,.25,-.4);g.add(cp);
    for(const s of [-1,1]){const st=box(.08,.03,1.2,pu,.75*s,.16,.1);st.rotation.y=-.5*s;g.add(st);const e=new THREE.Mesh(new THREE.CircleGeometry(.13,12),gl);e.position.set(.3*s,.05,1.0);g.add(e);const tp=new THREE.Mesh(new THREE.SphereGeometry(.06,8,8),gl);tp.position.set(1.5*s,.1,.85);g.add(tp)}return g}
  function heavy(){const g=new THREE.Group(),w=M(0xe8e2d4,{roughness:.5}),rd=M(0xc8452f,{roughness:.4}),gold=M(0xf2bd4e,{metalness:.4,roughness:.3,emissive:0x3a2600,emissiveIntensity:.4}),dk=M(0x0b1530,{metalness:.9,roughness:.1,emissive:0x0a3a4a,emissiveIntensity:.5}),cy=glowM(0xffb347);
    const body=box(1.0,.55,2.6,w,0,0,.1);g.add(body);const nose=cone(.5,.9,rd,4);nose.rotation.y=Math.PI/4;nose.position.z=-1.6;g.add(nose);
    const cp=box(.5,.25,.6,dk,0,.38,-.6);g.add(cp);const wg=box(3.0,.12,1.0,w,0,0,.4);g.add(wg);
    for(const s of [-1,1]){g.add(box(.2,.14,1.05,rd,1.45*s,.02,.4));for(const k of [.55,1.05]){const eng=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.7,12),gold);eng.rotation.x=Math.PI/2;eng.position.set(k*s,-.05,1.2);g.add(eng);const f=new THREE.Mesh(new THREE.CircleGeometry(.16,12),cy);f.position.set(k*s,-.05,1.56);g.add(f)}
      const can=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1.1,8),gold);can.rotation.x=Math.PI/2;can.position.set(1.2*s,.12,-.3);g.add(can)}return g}
  function star(){const g=new THREE.Group(),w=M(0xf2f6fa,{roughness:.45}),cyM=M(0x2fc7b4,{roughness:.35}),dk=M(0x0b1530,{metalness:.9,roughness:.08,emissive:0x0a4a4a,emissiveIntensity:.6}),gl=glowM(0x5ff2d6);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,2.4,12),w);body.rotation.x=Math.PI/2;g.add(body);const n=cone(.22,.7,cyM,12);n.position.z=-1.5;g.add(n);
    const cp=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),dk);cp.scale.set(.9,.7,1.6);cp.position.set(0,.22,-.35);g.add(cp);
    for(const sx of [-1,1])for(const sy of [-1,1]){const wg=box(1.5,.06,.38,w,.8*sx,.12*sy,.55);wg.rotation.z=.32*sx*sy;g.add(wg);const st=box(1.5,.07,.08,cyM,.8*sx,.12*sy+.0,.38);st.rotation.z=.32*sx*sy;g.add(st);
      const gun=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.0,8),M(0x9aa6b4));gun.rotation.x=Math.PI/2;gun.position.set(1.5*sx,.12*sy+.45*sy*.4,.2);g.add(gun);const tp=new THREE.Mesh(new THREE.SphereGeometry(.06,8,8),gl);tp.position.set(1.5*sx,.12*sy+.18*sy,-.3);g.add(tp)}
    const e=new THREE.Mesh(new THREE.CircleGeometry(.24,14),gl);e.position.set(0,0,1.21);g.add(e);return g}
  const MK={fighter,scout,bomber,diver,boss,stealth,heavy,star};
  const SPAN={fighter:3.6,scout:2.6,bomber:3.2,diver:2.4,boss:7,stealth:3.6,heavy:3.8,star:3.6};
  /* returns a canvas with the model, or null when WebGL is unavailable */
  function sprite(kind,px,bank){const key=kind+'|'+px+'|'+(bank||0);if(cache[key])return cache[key];if(failed)return null;if(!R)init();if(!R)return null;
    const g=MK[kind]();if(!['fighter','stealth','heavy','star'].includes(kind))g.rotation.y=Math.PI;g.rotation.z=(bank||0)*0.32;scene.add(g);
    const sp=SPAN[kind];cam.position.set(0,sp*2.7,sp*0.9);cam.lookAt(0,0,0);R.setSize(px,px,false);R.render(scene,cam);
    const c=document.createElement('canvas');c.width=c.height=px;c.getContext('2d').drawImage(R.domElement,0,0);scene.remove(g);
    g.traverse(o=>{if(o.geometry)o.geometry.dispose()});cache[key]=c;return c}
  return {sprite,ok:()=>!failed&&typeof THREE!=='undefined'}})();
