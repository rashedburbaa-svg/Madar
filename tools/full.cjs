const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const errs=[];
async function run(label,seed){const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Kuwait'});const p=await c.newPage();
p.on('pageerror',e=>errs.push(label+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts.g|net::/.test(m.text()))errs.push(label+' c: '+m.text())});
await p.addInitScript(s=>{if(s)localStorage.setItem('arcade-colony',JSON.stringify(s))},seed);await p.goto('http://localhost:8772/game/');await p.waitForTimeout(3000);
const step=async(n,f)=>{try{await p.evaluate(f);await p.waitForTimeout(350)}catch(e){errs.push(label+' '+n+': '+e.message.split('\n')[0])}};
await step('clean',()=>document.querySelectorAll('.overlay,.modal,.hmodal,.dlg').forEach(x=>x.remove()));await p.mouse.click(200,420);
for(const sh of ['list','shop','prestige','terra','adv','galaxy','lab','hq','mine','wall','tower','def','dock'])await step('sheet '+sh,new Function(`openSheet('${sh}')`));
await step('close',()=>closeSheet());
for(const id of ['hq','mine','solar','farm','habitat','radio','obs','def','lab','dock'])await step('enter '+id,new Function(`if(col.b['${id}']>0){enterB('${id}');const i=document.getElementById('interior');if(i)i.remove()}`));
await step('explore',()=>{exToggle();exGo(150,520)});await p.waitForTimeout(1200);await step('explore off',()=>exToggle());
await step('tabs',()=>{showTab('pBadges');showTab('pDaily');showTab('pColony')});await step('collectAll',()=>collectAll());await step('raid',()=>{col.raid&&(col.raid.at=Date.now()-1);raidCheck()});
for(const G of ['SurviveGame','PilotGame','FarmGame']){await step('open '+G,new Function(`openGame(${G})`));await p.waitForTimeout(600);await p.evaluate(()=>document.querySelectorAll('.hmodal').forEach(x=>x.remove()));if(G!=='FarmGame'&&await p.$('.overlay .btn.main')){await p.click('.overlay .btn.main');await p.waitForTimeout(4000)}
 await step('end '+G,new Function(`${G}.forfeit&&${G}.forfeit();goHub()`));await p.waitForTimeout(800)}
await c.close()}
await run('new',null);
await run('mid',{b:{hq:5,mine:4,solar:4,farm:4,habitat:3,radio:2,obs:2,def:3,lab:2,dock:2,wall:4,tower:2},intro:1,q:12,res:{m:2000,e:2000,f:2000,c:100}});
await run('late',{b:{hq:9,mine:9,solar:9,farm:9,habitat:9,radio:8,obs:8,def:9,lab:8,dock:8,wall:10,tower:9},intro:1,q:19,done:1,res:{m:90000,e:90000,f:90000,c:900},bot2:1,pg:2,ark:{hull:1}});
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close()})();
