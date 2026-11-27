import re,os
import os;HERE=os.path.dirname(os.path.abspath(__file__));G=os.path.join(HERE,'..','game');s=open(G+'/index.html',encoding='utf8').read()
s=re.sub(r'<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\n?','',s)
s=re.sub(r"<script>if\('serviceWorker'.*?</script>\n?",'',s)
s=re.sub(r'<link rel="stylesheet" href="style\.css[^"]*">',lambda m:'<style>'+open(G+'/style.css',encoding='utf8').read()+'</style>',s)
s=re.sub(r'<script src="(js/[\w.]+\.js)[^"]*"></script>',lambda m:'<script>'+open(G+'/'+m.group(1),encoding='utf8').read().replace('</script','<\\/script')+'</script>',s)
os.makedirs(os.path.join(HERE,'out'),exist_ok=True)
open(os.path.join(HERE,'out','arcade-store.html'),'w',encoding='utf8').write(s);print('joined',len(s)//1024,'KB')
