const C='madar-v74';
const ASSETS=['./','./index.html','./manifest.json','./style.css','./js/i18n-en.js','./js/i18n.js','./js/sfxdata.js','./js/artdata.js','./js/artdata2.js','./js/artdata3.js','./js/artdata4.js','./js/artdata5.js','./js/core.js','./js/balance.js','./js/three.min.js','./js/astro3d.js','./js/survive.js','./js/ship3d.js','./js/pilot.js','./js/colony.js','./js/colony2.js','./js/colony3.js','./js/colony4.js','./js/anim.js','./js/terra.js','./js/survival.js','./js/meta.js','./js/explore.js','./js/interior2.js','./js/prestige.js','./js/worldmap.js','./js/sfx.js','./js/hub.js','./js/farmgame.js','./js/world.js','../icon-192.png','../icon-512.png','../icon-maskable-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))))});
// only clear older game caches; the radar's cache on the same site stays untouched
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('madar-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);const font=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin&&!font)return;
  e.respondWith((u.origin===location.origin?fetch(r.mode==='navigate'?r.url+(r.url.includes('?')?'&':'?')+'fresh='+Date.now():r.url,{cache:'no-cache',credentials:'same-origin'}):fetch(r)).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));
});
