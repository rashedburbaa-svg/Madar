/* ================= مستعمرة المدار — sound layer: recorded effects on colony events ================= */
function withSnd(fn,k,when){return function(){sfxHold++;let r;try{r=fn.apply(this,arguments)}finally{sfxHold--}if(!when||when.apply(this,[r].concat([...arguments])))snd(k);return r}}
{const _f=fire;fire=function(w,c){_f(w,c);if(!document.hidden)snd(w.tier==='plasma'?'plasma':'laser')}}
{const _h=hurt;hurt=function(c,d){const was=c.dead;_h(c,d);if(!was&&c.dead&&!c.boss)snd('boom')}}
startBuild=withSnd(startBuild,'build',function(){return !!building(arguments[1])});
finishBuild=withSnd(finishBuild,'done');
collect=withSnd(collect,'coin',function(r,id,quiet){return !quiet});
collectAll=withSnd(collectAll,'coin');
strike=withSnd(strike,'strike');
bossDown=withSnd(bossDown,'bigboom');
metSpawn=withSnd(metSpawn,'meteor',()=>Math.random()<0.35);
{const _rs=raidShow;raidShow=function(){const L=col.raidLog,show=L&&!L.seen;_rs();if(show)snd(L.won?'win':'alarm')}}
{let warned=0;setInterval(()=>{try{const s=raidSoon();if(s&&!warned&&!$('hub').hidden){warned=1;snd('alarm')}if(!s)warned=0}catch(e){}},5000)}
