import re,hashlib,os,sys
import os;HERE=os.path.dirname(os.path.abspath(__file__));G=os.path.join(HERE,'..','game');p=G+'/index.html';s=open(p,encoding='utf8').read()
def h(f):return hashlib.md5(open(os.path.join(G,f),'rb').read()).hexdigest()[:8]
s=re.sub(r'src="(js/[\w.]+\.js)(\?v=\w+)?"',lambda m:f'src="{m.group(1)}?v={h(m.group(1))}"',s)
s=re.sub(r'href="(style\.css)(\?v=\w+)?"',lambda m:f'href="{m.group(1)}?v={h(m.group(1))}"',s)
open(p,'w',encoding='utf8').write(s);print('stamped')
