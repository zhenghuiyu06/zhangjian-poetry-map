"""Regenerate the editable catalogue from the GBK ZIP and converted 海安·引言.txt.

Usage: python3 v3/build-data.py /path/to/extracted-documents
Requires python-docx. Never writes to the source directory.
"""
import collections
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from docx import Document

src = Path(sys.argv[1])
dest = Path(__file__).resolve().parent
sections = {'序厅':'intro','海门':'haimen','通州':'tongzhou','如皋':'rugao',
            '如东':'rudong','海安':'haian','启东':'qidong','城区':'nantong','南通城区':'nantong'}
changes = []
issues = []

def normalize(text, location):
    text = '\n'.join(s.strip() for s in text.splitlines() if s.strip())
    for old, new in [('韩国钓','韩国钧'),('韩国均','韩国钧'),('教裕堂','敦裕堂'),
                     ('补楔图','补禊图'),('中秋元','中状元'),('衣胞','衣胞')]:
        if old != new and old in text:
            changes.append(f'{location}：“{old}”→“{new}”（{text.count(old)}处）')
            text = text.replace(old, new)
    return text

def locate(name):
    return next(src.rglob(name))

def introduction(name):
    notes = []
    if name == '海安':
        paragraphs = locate('海安·引言.txt').read_text(encoding='utf-8-sig').splitlines()
    else:
        doc = Document(locate(name+'·引言.docx'))
        ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        for part in doc.part.package.parts:
            if str(part.partname).endswith('/footnotes.xml'):
                for foot in ET.fromstring(part.blob):
                    n = ''.join(t.text or '' for t in foot.findall('.//w:t', ns)).strip()
                    if n: notes.append(normalize(n, name+'引言脚注'))
        paragraphs = [p.text for p in doc.paragraphs]
    paragraphs = [normalize(p, name+'引言') for p in paragraphs if p.strip()]
    return dict(theme=paragraphs[1].split('【')[-1].rstrip('】'), tagline=paragraphs[2],
                body='\n'.join(paragraphs[3:-1]), note=paragraphs[-1], footnotes=notes)

def isbn_state(isbn):
    m = re.search(r'(?:97[89](?:[ -]?\d){10}|\d(?:[ -]?\d){8}[ -]?[\dX])',isbn, re.I)
    if not m:
        return '未见标准 ISBN' if isbn else '原表未填 ISBN'
    value = re.sub(r'[^\dX]', '', m.group().upper())
    if len(value)==13 and sum(int(d)*(1 if i%2==0 else 3) for i,d in enumerate(value))%10:
        return 'ISBN 校验位待核'
    if len(value)==10 and sum((10-i)*(10 if d=='X' else int(d)) for i,d in enumerate(value))%11:
        return 'ISBN 校验位待核'
    if value == '7806308091': return '三种书共用该 ISBN，待核'
    return ''

def quotes(text):
    out = []
    for m in re.finditer(r'“([^”]+)”\s*[。；，]?\s*[（(](《[^》]+》[^）)]*)[）)]',text):
        lead = re.split(r'[。；]([^”])',text[max(0,m.start()-50):m.start()])[-1]
        if re.search(r'张謇|啬翁|诗歌有云|日记[中载记]|先生[有曾]',lead) and not re.search(r'韩国钧[有记曰云]|相传|后人',lead):
            out.append({'text':m[1], 'source':m[2], 'status':'展表引录，原典待对读'})
    return out

intros = {sections[n]:introduction(n) for n in ('序厅','海门','通州','如皋','如东','海安','启东','南通城区')}
rows, places, books = [], {}, {}
for region in ('序厅','海门','通州','如皋','海安','启东','城区'):
    ident = sections[region]
    file = locate(f'参展图书（{region}）.docx')
    for num, row in enumerate(Document(file).tables[0].rows[1:],2):
        source = f'{file.stem} 第{num}行（含表头）'
        # python-docx resolves vertically merged cells to the originating cell.
        a = [normalize(c.text, f'{source}·{i+1}列') for i,c in enumerate(row.cells)]
        title, isbn, place, desc, pages, image, *tail = a
        if not any(a): continue
        if not (title and place):
            issues.append(f'{source}：缺书名或地点，保留原行。')
        title = re.sub(r'《([^》]+)》',r'\1',title, count=1)
        title = re.sub(r'张謇全集\s*(\d+)','张謇全集第\\1卷',title)
        title = title.replace('\n',' ').strip()
        bookkey = re.sub(r'[\s~～—–：:·（）()《》]','',title)
        if norm_match := re.match(r'(张謇全集第\d+卷)', bookkey): bookkey = norm_match[1]
        bid = books.setdefault(bookkey,dict(id=f'b{len(books)+1:02}',title=title,isbn=[],warnings=[],districts=[],refs=[]))['id']
        book = books[bookkey]
        if isbn not in book['isbn']: book['isbn'].append(isbn)
        state = isbn_state(isbn)
        if state and state not in book['warnings']:
            book['warnings'].append(state)
            issues.append(f'{source} · 《{title}》：{state}（{isbn or "空白"}）。')
        if ident not in book['districts']: book['districts'].append(ident)
        # The duplicated museum and garden retain both rows as source cards.
        loc_key = re.sub(r'\s','',place)
        canonical_id = {'南通博物苑':'nantong','水绘园':'rugao'}.get(loc_key, ident)
        if loc_key == '南通博物苑' and ident=='rugao':
            issues.append(f'{source}：“南通博物苑”与城区重复；合并地图点，保留两条书目。')
        if not desc:
            issues.append(f'{source} · 《{title}》：知识点为空。')
        existing = places.get((canonical_id,loc_key))
        if not existing:
            pid = f'{canonical_id}-{num}' if canonical_id==ident else f'{canonical_id}-{num}-shared'
            existing = places[(canonical_id,loc_key)] = dict(id=pid,name=place,district=canonical_id,sections=[],refs=[])
        if ident not in existing['sections']: existing['sections'].append(ident)
        item = dict(source=source,book=bid,place=existing['id'],district=ident,isbn=isbn,
                    description=desc,pages=pages,imageNote=image,quotes=quotes(desc),poemList=tail[0] if tail else '')
        rows.append(item)
        book['refs'].append(len(rows)-1)
        existing['refs'].append(len(rows)-1)

for i,(name,text) in enumerate([('大豫镇','原站将大豫镇作为南通大豫垦殖公司的地方线索；展陈引言另称大豫盐垦公司。旧址具体范围待核。'),
                                ('小洋口滩涂','原站现地线索：在小洋口观察潮间带的泥滩、水道和湿地。'),
                                ('如东潮间带风电场','原站现地线索：从小洋口观察沿海风电形成的当代景观，不是历史遗址。')],1):
    places[('rudong',name)] = dict(id=f'rudong-{i}',name=name,district='rudong',sections=['rudong'],refs=[],description=text)

chaoxing = dict(searchTemplate='', portal='https://www.duxiu.com/', overrides={
    '9787567231399': 'https://mooc1.chaoxing.com/mooc-ans/ztnodedetailcontroller/visitnodedetail?courseId=218394166&knowledgeId=436829279'
})
data = dict(intros=intros,places=list(places.values()),books=list(books.values()),records=rows,changes=changes,issues=issues,chaoxing=chaoxing)
assert len(set(p['id'] for p in places.values())) == len(places)
(dest/'js/data.js').write_text('// 展陈资料：馆方可直接编辑。记录索引从 0 开始。\nwindow.JIANGHAI_DATA = '+json.dumps(data, ensure_ascii=False, indent=2)+';\n',encoding='utf8')
print(f'{len(rows)} 条书目记录，{len(places)} 处地点，{len(books)} 种书；{len(changes)} 条文字修正。')
