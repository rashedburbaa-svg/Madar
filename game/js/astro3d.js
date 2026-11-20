/* ================= 3D astronaut for «صمود المدار» (three.js, rendered small and drawn onto the 2D game canvas) ================= */
const Astro3D=(function(){
  let R=null,scene,cam,root,parts={},mats=[],failed=false,size=0,tint='';
  function mat(c,o){const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.05},o||{}));mats.push(m);return m}
  function build(){
    scene=new THREE.Scene();
    cam=new THREE.PerspectiveCamera(30,1,0.1,50);cam.position.set(0,7.2,5.6);cam.lookAt(0,0.95,0);
    scene.add(new THREE.HemisphereLight(0xdfe8ff,0x3a2a40,1.1));
    const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(-3,6,4);scene.add(key);
    const rim=new THREE.DirectionalLight(0x7ffcf0,1.2);rim.position.set(3,3,-4);scene.add(rim);
    const white=mat(0xf3f4f7,{roughness:.6}),gold=mat(0xf2bd4e,{metalness:.35,roughness:.35,emissive:0x3a2600,emissiveIntensity:.4}),grey=mat(0x9aa6b4,{roughness:.5}),
      visor=mat(0x0b1530,{metalness:.9,roughness:.08,emissive:0x0a3a4a,emissiveIntensity:.6}),glow=mat(0x5ff2d6,{emissive:0x5ff2d6,emissiveIntensity:1.6}),dark=mat(0x3a4652,{roughness:.4,metalness:.4});
    parts.white=white;parts.visor=visor;
    root=new THREE.Group();scene.add(root);const body=new THREE.Group();root.add(body);parts.body=body;
    const cap=(r,l,m)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,l,6,14),m);
    const torso=cap(.42,.42,white);torso.position.y=1.05;body.add(torso);
    const belt=new THREE.Mesh(new THREE.TorusGeometry(.42,.05,8,24),gold);belt.rotation.x=Math.PI/2;belt.position.y=.86;body.add(belt);
    const chest=new THREE.Mesh(new THREE.BoxGeometry(.32,.2,.08),grey);chest.position.set(0,1.18,.4);body.add(chest);
    const light=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),glow);light.position.set(.09,1.2,.45);body.add(light);
    const pack=new THREE.Mesh(new THREE.BoxGeometry(.62,.72,.3),white);pack.position.set(0,1.1,-.44);body.add(pack);
    const packG=new THREE.Mesh(new THREE.BoxGeometry(.64,.08,.32),gold);packG.position.set(0,1.32,-.44);body.add(packG);
    const head=new THREE.Group();head.position.y=1.78;body.add(head);parts.head=head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.56,28,20),white));
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.4,.07,10,28),gold);ring.rotation.x=Math.PI/2;ring.position.y=-.45;head.add(ring);
    const v=new THREE.Mesh(new THREE.SphereGeometry(.5,28,20,0,Math.PI*2,0,Math.PI*.55),visor);v.rotation.x=Math.PI/2;v.position.set(0,.02,.12);v.scale.set(.92,1,.92);head.add(v);
    const vr=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,8,28),gold);vr.position.set(0,.02,.38);head.add(vr);
    for(const s of [-1,1]){const ear=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.08,16),gold);ear.rotation.z=Math.PI/2;ear.position.set(.56*s,0,0);head.add(ear)}
    const ant=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.3,6),grey);ant.position.set(.28,.55,-.1);head.add(ant);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),glow);tip.position.set(.28,.72,-.1);head.add(tip);
    const limb=(x,y,r,l,m,bootM)=>{const g=new THREE.Group();g.position.set(x,y,0);const c=cap(r,l,m);c.position.y=-(l/2+r*.6);g.add(c);
      if(bootM){const b=new THREE.Mesh(new THREE.BoxGeometry(r*2.1,r*1.3,r*2.8),bootM);b.position.set(0,-(l+r*1.4),r*.4);g.add(b)}body.add(g);return g};
    parts.legL=limb(-.2,.62,.17,.3,white,gold);parts.legR=limb(.2,.62,.17,.3,white,gold);
    parts.armL=limb(-.52,1.32,.13,.42,white);parts.armR=limb(.52,1.32,.13,.42,white);
    const gun=new THREE.Group();const g1=new THREE.Mesh(new THREE.BoxGeometry(.16,.18,.62),dark);g1.position.z=.2;gun.add(g1);
    const g2=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.22,12),glow);g2.rotation.x=Math.PI/2;g2.position.z=.58;gun.add(g2);
    gun.position.set(0,-.62,.12);parts.armR.add(gun);
    const sab=new THREE.Group(),hilt=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.24,10),grey),blade=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1.2,10),mat(0xffe6fd,{emissive:0xff5df2,emissiveIntensity:2.2}));
    blade.position.y=.72;sab.add(hilt,blade);sab.rotation.x=Math.PI/2;sab.position.set(0,-.62,.1);sab.visible=false;parts.armL.add(sab);parts.saber=sab;parts.armR.rotation.x=-1.25;parts.armL.rotation.x=-.9;parts.armL.rotation.z=.45;
  }
  function init(px){try{if(typeof THREE==='undefined')throw 0;R=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
      R.setPixelRatio(1);size=px;R.setSize(px,px,false);R.setClearColor(0x000000,0);R.outputColorSpace=THREE.SRGBColorSpace;build()}catch(e){failed=true;R=null}}
  /* x,y: feet position on the 2D canvas; h: on-screen height; aim: radians in screen space; moving: bool; t: seconds */
  function draw(ctx,x,y,h,aim,moving,t,hurt,visorCol,saber){if(failed)return false;const px=Math.min(256,Math.max(96,Math.round(h*2.2*(window.devicePixelRatio||1))));if(!R)init(px);if(!R)return false;
    root.rotation.y=Math.atan2(Math.cos(aim),Math.sin(aim));
    const s=moving?Math.sin(t*11):0;parts.legL.rotation.x=s*.7;parts.legR.rotation.x=-s*.7;parts.armL.rotation.x=-.9-s*.35;
    parts.body.position.y=moving?Math.abs(Math.cos(t*11))*.06:Math.sin(t*2)*.02;parts.head.rotation.z=moving?Math.sin(t*5.5)*.05:0;
    parts.white.emissive.setHex(hurt>0?0xff3040:0x000000);parts.white.emissiveIntensity=hurt>0?Math.min(1,hurt*5):0;
    if(visorCol&&visorCol!==tint){tint=visorCol;try{parts.visor.emissive.set(visorCol);parts.visor.emissiveIntensity=.16}catch(e){}}
    parts.saber.visible=!!saber;R.render(scene,cam);const S=h*1.9;ctx.drawImage(R.domElement,x-S/2,y-S*0.78,S,S);return true}
  return {draw,ok:()=>!failed&&typeof THREE!=='undefined'}})();
