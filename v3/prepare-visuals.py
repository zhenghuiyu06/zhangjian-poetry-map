"""Generate PDF-derived web images and an OFL title-only Noto Serif SC subset."""
import re
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from io import BytesIO
from PIL import Image
from fontTools.ttLib import TTFont

base = Path(__file__).resolve().parent
art = Image.open(sys.argv[1]).convert('RGB')
for width in (1400, 860):
    size = (width, round(art.height * width / art.width))
    art.resize(size, Image.Resampling.LANCZOS).save(base / f'assets/hero-{width}.webp', quality=86, method=6)

# Only headings and text styled as display titles, not the exhibit prose.
html = (base / 'index.html').read_text() + (base / 'handoff.html').read_text()
titles = re.findall(r'<h[123][^>]*>(.*?)</h[123]>', html, re.S)
titles += [
    '潮 海门通州如皋如东海安启东南通城区 从序厅出发',
    '《》“”铁路与过江 南通西站 海门站 启东站 如皋南站 如东站 海安站 南通轨道交通 苏通大桥 沪苏通大桥 崇启大桥',
    '生于海门常乐 殿试中状元 垦牧事业 创办通州师范 创办南通博物苑 营建军山气象台 兴办伶工学社',
    '通海垦牧公司 通州师范 南通博物苑 通州女子师范 南通纺织专门学校 女红传习所 河海工程专门学校 狼山盲哑学校 军山气象台 伶工学社',
    '看对应书页 如皋美食 南黄海渔事 江海食脉 千年海门一品山羊 南通僮子戏',
]
from json import loads
d = loads((base / 'js/data.js').read_text().split('=',1)[1].strip().removesuffix(';'))
titles += [p['name'] for p in d['places']] + [b['title'] for b in d['books']]
titles += re.findall(r"\['([^']{2,28})','(?:地方|沿海|国家级|省级|候选|保护|传统)", (base/'js/guide.js').read_text())
text = ''.join(sorted(set(re.sub(r'<[^>]*>', '', ''.join(titles)).replace('\n','')))) + '0123456789、·()！│'
query = urlencode({'family':'Noto Serif SC:wght@700','text':text, 'display':'swap'})
headers = {'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'}
css = urlopen(Request('https://fonts.googleapis.com/css2?'+query,headers=headers), timeout=30).read().decode()
url = re.search(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css).group(1)
font = TTFont(BytesIO(urlopen(url,timeout=40).read()))
font.flavor = 'woff'
font.save(base/'assets/jianghai-title.woff')
print('Title subset:',len(font.getBestCmap()),'glyph mappings')
