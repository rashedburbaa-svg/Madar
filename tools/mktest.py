import json
seed=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'seed.json')))
html=open('out/arcade-store.html',encoding='utf8').read()
head="""<script>/* نسخة تجريبية: تبدأ بكل التطويرات مكتملة */(function(){var S=%s,V='madar-test-3';try{if(localStorage.getItem('madar-test')!==V){for(var k in S)localStorage.setItem(k,S[k]);localStorage.setItem('madar-test',V)}}catch(e){}})();</script>""" % json.dumps(seed,ensure_ascii=False)
panel="""<style>#tpB{position:fixed;left:8px;bottom:84px;z-index:9999;width:44px;height:44px;border-radius:50%;border:1px solid #f5c451;background:#0e1632ee;color:#fff;font-size:22px}
#tpP{position:fixed;inset:auto 8px 136px 8px;z-index:9999;background:#0b1226f5;border:1px solid #f5c451;border-radius:16px;padding:12px;color:#dfe7ff;font:14px system-ui;direction:rtl;max-height:70vh;overflow:auto}
#tpP h4{margin:0 0 8px;color:#f5c451}#tpP button{display:block;width:100%;margin:6px 0;padding:10px;border-radius:10px;border:1px solid #3a4c8a;background:#16214a;color:#fff;font:inherit;text-align:right}
#tpP button.on{border-color:#00e5ff;background:#0c3a4a}</style>
<button id="tpB" type="button" aria-label="لوحة التجربة">🧪</button><div id="tpP" hidden></div>
<script>(function(){
function maxAll(){for(var k in BLD)col.b[k]=BLD[k].max||10;col.tech=col.tech||{};for(var t in TECH)col.tech[t]=tMax(t);col.rs=null;col.build=null;col.build2=null;
 col.ship=col.ship||{};PARTS.forEach(function(p){col.ship[p[0]]=1});col.done=1;col.intro=1;col.ark={};ARK.forEach(function(a){col.ark[a[0]]=1});col.arkB=null;
 col.wm=col.wm||{u:{},at:0,mat:{},lm:{},gear:{},mt:Date.now()};for(var i=0;i<6;i++){col.wm.u[i]=1;col.wm.lm[i]=3}['alloy','ice','magma','quartz','spore','gas'].forEach(function(k){col.wm.mat[k]=Math.max(col.wm.mat[k]||0,300)});
 col.res.m=Math.max(col.res.m,900000);col.res.e=Math.max(col.res.e,900000);col.res.f=Math.max(col.res.f,900000);col.res.c=Math.max(col.res.c,50000);col.last=Date.now()}
function go(fn){try{fn();maxAll();colSave()}catch(e){alert(e.message)}location.reload()}
var P=document.getElementById('tpP');
function draw(){var h='<h4>🧪 لوحة التجربة</h4><small>الكوكب الحالي: '+PLN[col.wm?col.wm.at||0:0].em+' '+PLN[col.wm?col.wm.at||0:0].n+'</small>';
 PLN.forEach(function(p,i){h+='<button type="button" data-pg="'+i+'" class="'+((col.wm?col.wm.at||0:0)===i?'on':'')+'">'+p.em+' انتقل إلى '+p.n+'</button>'});
 h+='<button type="button" data-max>⬆️ أكمل كل التطويرات من جديد</button><button type="button" data-reset>♻️ ابدأ التجربة من الصفر</button>';P.innerHTML=h;
 P.querySelectorAll('[data-pg]').forEach(function(b){b.onclick=function(){var i=+b.dataset.pg;go(function(){col.wm.at=i})}});
 P.querySelector('[data-max]').onclick=function(){go(function(){})};
 P.querySelector('[data-reset]').onclick=function(){localStorage.removeItem('madar-test');location.reload()}}
document.getElementById('tpB').onclick=function(){P.hidden=!P.hidden;if(!P.hidden)draw()};
})();</script>"""
i=html.find('<head>')+6
html=html[:i]+head+html[i:]
j=html.rfind('</body>')
html=html[:j]+panel+html[j:]
html=html.replace('<title>','<title>🧪 تجربة · ',1)
open('out/madar-test-full.html','w',encoding='utf8').write(html);print(len(html)//1024,'KB')
