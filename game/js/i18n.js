/* language layer: Arabic is the source text; in English mode every visible Arabic text is swapped for its entry in EN (i18n-en.js).
   Numbers become {0},{1}… in the lookup key, so «المستوى 6» and «المستوى 7» share one entry. Untranslated text stays Arabic and is logged. */
const LANG=(()=>{try{return (JSON.parse(localStorage.getItem('arcade-prefs')||'{}').lang)||'ar'}catch(e){return 'ar'}})();
const I18N={on:LANG==='en',miss:new Set(),cache:new Map()};
const AR_RE=/[؀-ۿ]/;
// Arabic short time and rate units left after translation: 5س 3د 2ث, /س
const UNIT=[[/(\d)\s?س(?![؀-ۿ])/g,'$1h'],[/(\d)\s?د(?![؀-ۿ])/g,'$1m'],[/(\d)\s?ث(?![؀-ۿ])/g,'$1s'],[/\/س(?![؀-ۿ])/g,'/h'],[/،/g,','],[/؟/g,'?'],[/«|»/g,'"']];
function trCore(s){
  if(typeof EN==='undefined')return null;
  if(EN[s]!=null)return EN[s];
  const nums=[];const key=s.replace(/\d+(?:[.,]\d+)*/g,m=>{nums.push(m);return '{'+(nums.length-1)+'}'});
  const v=EN[key];if(v!=null)return v.replace(/\{(\d+)\}/g,(m,i)=>nums[+i]!=null?nums[+i]:m);
  // a leading emoji, sign or bullet is kept as is and the rest is looked up
  const pm=s.match(/^([^\u0600-\u06FF\d«"(]+)(.+)$/);if(pm){const r=trCore(pm[2]);if(r!=null)return pm[1]+r}
  // trailing punctuation or separators are kept too
  // a trailing level or time («3/5», «1:20», «×2») stays as is
  const nm=s.match(/^(.*[\u0600-\u06FF].*?)\s+([\d\/:.,×%+\-]+)$/);if(nm){const r=trCore(nm[1]);if(r!=null)return r+' '+nm[2]}
  const sm=s.match(/^(.*?[\u0600-\u06FF\d].*?)([^\u0600-\u06FF\w«"(]+)$/u);if(sm){const r=trCore(sm[1]);if(r!=null)return r+sm[2].replace('؟','?').replace('،',',')}
  return null}
// compound lines are split level by level (lines, sections, label:value, sentences, brackets) and each part is looked up again
const SPLITS=[/(\n)/,/(\s—\s|\s·\s|\s←\s|\s\|\s|\s{2,})/,/(:\s)/,/((?<=[.!؟…])\s)/,/(\s(?=\())/];
function trDeep(s,l){
  const lead=s.match(/^\s*/)[0],tail=s.match(/\s*$/)[0],core=s.trim();if(!core||!AR_RE.test(core))return s;
  const r=trCore(core);if(r!=null)return lead+r+tail;
  for(let k=l;k<SPLITS.length;k++){const parts=core.split(SPLITS[k]);if(parts.length>1)return lead+parts.map((p,i)=>i%2?p:trDeep(p,k+1)).join('')+tail}
  return s}
function tr(s){
  if(!I18N.on||typeof s!=='string'||!AR_RE.test(s))return s;
  const c=I18N.cache.get(s);if(c!=null)return c;
  const out=trDeep(s,0);let fin=out;for(const [re,rep] of UNIT)fin=fin.replace(re,rep);
  if(AR_RE.test(fin)){I18N.miss.add(s.trim().replace(/\d+(?:[.,]\d+)*/g,'{n}'));fin=out}
  if(I18N.cache.size<6000)I18N.cache.set(s,fin);return fin}
const TATTR=['aria-label','title','placeholder','alt'];
function trAttr(el,a){const v=el.getAttribute&&el.getAttribute(a);if(v&&AR_RE.test(v)){const t=tr(v);if(t!==v)el.setAttribute(a,t)}}
function trText(n){const p=n.parentNode;if(!p||p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||p.id==='langBtn')return;const v=tr(n.data);if(v!==n.data)n.data=v}
function trNode(n){
  if(n.nodeType===3)return trText(n);
  if(n.nodeType!==1)return;
  for(const a of TATTR)trAttr(n,a);
  const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let x;
  while((x=w.nextNode())){if(x.nodeType===3)trText(x);else for(const a of TATTR)trAttr(x,a)}}
function setLang(l){try{const p=JSON.parse(localStorage.getItem('arcade-prefs')||'{}');p.lang=l;localStorage.setItem('arcade-prefs',JSON.stringify(p))}catch(e){}location.reload()}
if(I18N.on){
  document.documentElement.lang='en';document.documentElement.dir='ltr';document.documentElement.classList.add('en');
  document.title='Orbit Colony';
  // text drawn on canvases (the battles) goes through the same dictionary
  for(const fn of ['fillText','strokeText','measureText']){const o=CanvasRenderingContext2D.prototype[fn];CanvasRenderingContext2D.prototype[fn]=function(t,...a){return o.call(this,tr(t),...a)}}
  const run=()=>{document.querySelectorAll('[dir=rtl]').forEach(e=>{e.dir='ltr';e.lang='en'});trNode(document.body);new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trText(m.target);else if(m.type==='attributes')trAttr(m.target,m.attributeName);else m.addedNodes.forEach(trNode)}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']})};
  if(document.body)run();else addEventListener('DOMContentLoaded',run);
  // keep the list of untranslated texts for the next translation batch
  setInterval(()=>{if(I18N.miss.size)try{const old=JSON.parse(localStorage.getItem('i18n-miss')||'[]');localStorage.setItem('i18n-miss',JSON.stringify([...new Set([...old,...I18N.miss])].slice(-3000)));I18N.miss.clear()}catch(e){}},3000)}
// the 🌐 button in the header
addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('langBtn');if(b){b.textContent=LANG==='en'?'ع':'EN';b.setAttribute('aria-label',LANG==='en'?'Arabic':'English');b.onclick=()=>setLang(LANG==='en'?'ar':'en')}});
