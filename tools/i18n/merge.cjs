// merges a TSV (arabic<TAB>english) into game/js/i18n-en.js
const fs=require('fs'),P=require('path').join(__dirname,'..','..','game','js','i18n-en.js');
const src=fs.readFileSync(P,'utf8');const EN=new Function(src+';return EN')();
let n=0;for(const f of process.argv.slice(2))for(const line of fs.readFileSync(f,'utf8').split('\n')){const i=line.indexOf('\t');if(i<1)continue;const k=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(k&&v){if(EN[k]!==v)n++;EN[k]=v}}
const body=Object.keys(EN).map(k=>JSON.stringify(k)+':'+JSON.stringify(EN[k])).join(',\n');
fs.writeFileSync(P,'/* English dictionary: Arabic source text → English. Numbers in keys are written {0},{1}… Untranslated texts stay Arabic. */\nconst EN={\n'+body+'\n};\n');
console.log('entries',Object.keys(EN).length,'changed',n);
