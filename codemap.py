# يولّد CODEMAP.md (في جذر المستودع): خريطة مختصرة للدوال والثوابت بأرقام الأسطر، ليقرأ Claude الجزء المطلوب فقط.
import re,os,glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'game'))
SKIP={'artdata.js':'الصور فقط (base64) — لا تقرأه؛ ابحث بـ grep عن ART.اسم','three.min.js':'مكتبة three.js — لا تقرأه','sfxdata.js':'الأصوات (base64) — لا تقرأه','i18n-en.js':'جدول الترجمة الإنجليزية — ابحث فيه بـ grep فقط'}
DEF=re.compile(r'(?:^|[;{}\s])(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\(|function|\{|\[|[A-Za-z_$][\w$]*\s*=>|\(\)\s*=>))')
out=['# خريطة الكود — مستعمرة المدار','','مولّدة آلياً بـ `python3 codemap.py`. اقرأ هذا الملف أولاً، ثم افتح الأسطر المطلوبة فقط (`sed -n` أو Read مع offset).','']
for f in sorted(glob.glob('js/*.js'))+['style.css','index.html','sw.js']:
    b=os.path.basename(f);n=sum(1 for _ in open(f,encoding='utf8'));kb=os.path.getsize(f)//1024
    if b in SKIP:out.append(f'## {f} — {kb}KB — {SKIP[b]}');out.append('');continue
    out.append(f'## {f} — {n} سطر، {kb}KB')
    if f.endswith('.js'):
        items=[]
        for i,l in enumerate(open(f,encoding='utf8'),1):
            for m in DEF.finditer(l):
                k=m.group(1) or m.group(2)
                if len(k)>1 and k not in [x[0] for x in items[-6:]]:items.append((k,i))
        line=' · '.join(f'{k}:{i}' for k,i in items)
        out.append(line if line else '—')
    out.append('')
open('../CODEMAP.md','w',encoding='utf8').write('\n'.join(out))
print(len('\n'.join(out)))
