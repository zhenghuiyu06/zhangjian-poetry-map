(() => {
  'use strict';
  const D = window.JIANGHAI_DATA, G = window.JIANGHAI_GUIDE;
  if (!D || !G) return;
  const $ = id => document.getElementById(id);
  const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const attr = esc;
  const link = ([name, url], label = name) => `<a href="${attr(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  const source = s => s ? `<p class="source">${link(s)}</p>` : '';
  const district = id => G.districts.find(d => d.id === id);
  const regionName = id => district(id)?.name || '序厅';
  const details = (title, html) => `<details><summary>${esc(title)}</summary><div>${html}</div></details>`;
  const intro = id => {const i = D.intros[id]; return `<blockquote>${esc(i.tagline)}</blockquote><p class="entry-text">${esc(i.body)}</p>${i.note ? `<p class="source">${esc(i.note)}</p>` : ''}${(i.footnotes||[]).map(t=>`<p class="source">${esc(t)}</p>`).join('')}`;};
  const places = D.places.map(p => ({...p, area:G.introDistrict[p.id] || p.district, coords:G.geo[p.id]?.slice(0,2)}));
  const byPlace = Object.fromEntries(places.map(p=>[p.id,p]));
  const byBook = Object.fromEntries(D.books.map(b=>[b.id,b]));
  const transit = G.transit.map(([id,name,description,x,y,area,...citations])=>({id,name,description,area,coords:[x,y],citations,transit:true}));
  const byTransit = Object.fromEntries(transit.map(p=>[p.id,p]));
  const firstIds = new Set(G.firsts.map(r=>r[4]).filter(Boolean));
  const layers = [['all','全部'],['intro','序厅十处'],['firsts','十个“第一”'],['travel','铁路与过江']];
  const tabs = [['foot','足迹与文献'],['heritage','非遗'],['food','味道'],['access','怎么去']];
  const state = {area:'',layer:'all',tab:'foot',place:'',limit:16};
  const deep = (key, id) => `#${key}=${encodeURIComponent(id)}`;
  const toPlace = (p,label=p.name) => `<a href="${deep('p',p.id)}" data-place="${attr(p.id)}">${esc(label)}</a>`;
  const regionLink = id => `<a href="${deep('d',id)}" data-region="${attr(id)}">${esc(regionName(id))}</a>`;
  const navigation = p => {
    const outside = p.id === 'haian-4';
    const name = p.name.replace(/\s+/g, ' ');
    const k = encodeURIComponent(`${outside ? '南京' : '南通 '+(p.area && p.area!=='intro' ? regionName(p.area) : '')} ${name}`.trim());
    return [
      ['高德',`https://uri.amap.com/search?keyword=${k}&callnative=1`],
      ['百度',`https://api.map.baidu.com/place/search?query=${k}&region=${encodeURIComponent(outside?'南京':'南通')}&output=html`],
      ['腾讯',`https://apis.map.qq.com/uri/v1/search?keyword=${k}&region=${encodeURIComponent(outside?'南京':'南通')}&referer=jianghai-guide`]
    ].map(s=>`<a class="button" href="${attr(s[1])}" target="_blank" rel="noopener noreferrer">${esc(s[0])} ↗</a>`).join('');
  };
  const edition = b => {
    const c = D.chaoxing, override = (b.isbn||[]).map(isbn=>c.overrides[isbn]).find(Boolean);
    const url = b.chaoxing || override || (c.searchTemplate ? c.searchTemplate.replace('{query}',encodeURIComponent(b.title)) : c.portal);
    return `<a class="button" href="${attr(url)}" target="_blank" rel="noopener noreferrer">在超星找这本书 ↗</a>${b.chaoxing||override||c.searchTemplate?'':`<button class="button" data-copy="${attr(b.title)}">复制书名</button>`}`;
  };
  const bodyNote = (id, k) => (district(id)[k]||[]).map(([title,note,s])=>`<article><h3>${esc(title)}</h3><p>${esc(note)}</p>${source(s)}</article>`).join('');
  const fa = (els, name, value) => els.map(([k,v])=>`<button type="button" data-${name}="${k}" aria-pressed="${value===k}">${esc(v)}</button>`).join('');
  $('intro-text').insertAdjacentHTML('beforeend', `<div>${intro('intro')}</div>`);
  $('ribbons').innerHTML = G.districts.map((d,i)=>`<a class="ribbon" href="${deep('d',d.id)}" data-region="${d.id}" style="--tint:${d.color}"><i>0${i+1}</i><strong>${esc(d.name)}</strong><small>${esc(D.intros[d.id].theme)}</small></a>`).join('');
  $('layers').innerHTML = fa(layers,'layer','all');
  $('districts').innerHTML = fa([['','全域'],...G.districts.map(d=>[d.id,d.name])],'region','');
  $('station-tabs').innerHTML = tabs.map(([k,v])=>`<button type="button" role="tab" id="tab-${k}" data-station-tab="${k}" aria-controls="station-body">${v}</button>`).join('');

  const updateURL = (hash, mode='push') => history[`${mode}State`](null,'',hash);
  const scrollMap = () => $('map').scrollIntoView({block:'start'});
  const filtered = () => {
    const valid = p => !state.area || state.area===p.area || (!p.transit && p.sections.includes(state.area));
    if (state.layer==='travel') return transit.filter(valid);
    return places.filter(p => valid(p) && (state.layer==='all' || (state.layer==='intro' ? p.sections.includes('intro') : firstIds.has(p.id))));
  };

  const NS='http://www.w3.org/2000/svg', W=760, H=490;
  function svg(name, attrs, text) {
    const s=document.createElementNS(NS,name);
    for(const [k,v] of Object.entries(attrs)) s.setAttribute(k,v);
    if(text) s.textContent=text;
    return s;
  }
  // Local equirectangular distance: x = Δlongitude cos(32°), y = Δlatitude.
  function drawMap() {
    const el=$('atlas');
    const [west,south,east,north]=district(state.area)?.box || [120.02,31.60,122.05,32.75];
    const cos=Math.cos(32*Math.PI/180), scale=Math.min((W-58)/((east-west)*cos),(H-54)/(north-south));
    const project=([x,y])=>[W/2+(x-(east+west)/2)*cos*scale,H/2-(y-(north+south)/2)*scale];
    const line=(coords)=>coords.map((c,i)=>`${i?'L':'M'}${project(c).map(n=>n.toFixed(1)).join(' ')}`).join(' ');
    el.replaceChildren(svg('title',{},'南通七境示意图'),svg('desc',{},'浅色区块可放大地区，圆点可查看文献。下方按钮和旁边的地点列表也可操作。'));
    for(let y=45;y<H;y+=45)el.append(svg('path',{d:`M0 ${y}H760`,stroke:'#a4c4be','stroke-opacity':'.48','stroke-width':1}));
    for(let x=48;x<W;x+=48)el.append(svg('path',{d:`M${x} 0V490`,stroke:'#a4c4be','stroke-opacity':'.48','stroke-width':1}));
    for(const d of G.districts) {
      const active=!state.area || d.id===state.area;
      const path=svg('path',{d:line(d.shape)+' Z',fill:d.color,opacity:active?'1':'.54',class:'geo-region',role:'button',tabindex:state.area===d.id?'-1':'0','aria-label':`放大${d.name}`,'data-region':d.id});
      el.append(path);
    }
    el.append(svg('path',{d:line([[120.14,32.08],[120.40,32.02],[120.69,31.95],[120.98,31.82],[121.25,31.74],[121.62,31.69],[121.95,31.60]]),stroke:'#80b7ad','stroke-opacity':'.6','stroke-width':state.area?22:17,'stroke-linecap':'round',fill:'none','aria-hidden':'true'}));
    for(const [title,c] of [['黄海',[121.7,32.52]],['长江',[120.97,31.77]]]){
      const [x,y]=project(c);el.append(svg('text',{x,y,class:'geo-water','aria-hidden':'true','text-anchor':'middle'},title));
    }
    if(state.layer==='travel') {
      for(const coords of [[[120.46,32.53],[120.6,32.33],[120.76,32.10],[120.71,31.95]],[[120.46,32.53],[120.76,32.28],[120.88,32.10],[121.17,31.94],[121.65,31.87]]])el.append(svg('path',{d:line(coords),fill:'none',stroke:'#42658c','stroke-dasharray':'7 5','stroke-width':2,'aria-hidden':'true'}));
    }
    for(const d of G.districts){const [x,y]=project(d.center);if(x<50||x>W-50||y<46||y>H-22)continue;el.append(svg('text',{x,y,'text-anchor':'middle','font-size':state.area?23:18,class:'geo-label','aria-hidden':'true'},d.name));}
    el.append(svg('text',{x:27,y:34,class:'geo-label','font-size':'15','aria-hidden':'true'},'↑ 北'));
    const anchors=filtered().filter(p=>p.coords).map(p=>({p,anchor:project(p.coords)})).filter(({anchor:[x,y]})=>x>=0&&x<=W&&y>=0&&y<=H);
    const drawn=[];
    const min=state.area?56:40;
    const fits=(x,y)=>x>25&&x<W-25&&y>25&&y<H-25&&drawn.every(v=>Math.hypot(v.x-x,v.y-y)>=min);
    for(const {p,anchor:[ax,ay]} of anchors){
      let x=ax,y=ay,located=fits(x,y);
      for(let r=min;!located&&r<=min*8;r+=min){
        for(let s=0;s<16;s++){
          const angle=(s/16)*2*Math.PI;
          const xx=ax+r*Math.cos(angle),yy=ay+r*Math.sin(angle);
          if(fits(xx,yy)){x=xx;y=yy;located=true;break;}
        }
      }
      if(located)drawn.push({p,x,y,ax,ay});
    }
    for(const {x,y,ax,ay} of drawn)if(Math.hypot(x-ax,y-ay)>1)el.append(svg('path',{d:`M${ax} ${ay}L${x} ${y}`,stroke:'#365c62','stroke-width':1.1,opacity:'.65','pointer-events':'none','aria-hidden':'true'}),svg('circle',{cx:ax,cy:ay,r:2,fill:'#365c62','pointer-events':'none','aria-hidden':'true'}));
    for(const {p,x,y} of drawn){
      const gp=svg('g',{class:'geo-point',role:'button',tabindex:'0',transform:`translate(${x},${y})`,'aria-label':`查看${p.name}`,'data-place':p.id,'aria-current':String(p.id===state.place)});
      gp.append(svg('title',{},p.name),svg('circle',{r:min/2,fill:'transparent'}),svg('circle',{r:state.area?10:7,class:'marker'}));
      el.append(gp);
    }
  }

  function drawStation() {
    const d=district(state.area), layerName=layers.find(([k])=>k===state.layer)[1];
    $('station-header').innerHTML = `<p class="eyebrow">${esc(d ? '七境 / '+D.intros[d.id].theme : '江海全域 / '+layerName)}</p><h3>${esc(d?.name || '从序厅出发')}</h3>${d?.id==='rudong'?'<p class="warning">如东展陈图书表待补</p>':''}`;
    for(const el of $('station-tabs').children){const active=state.tab===el.dataset.stationTab;el.setAttribute('aria-selected',String(active));el.tabIndex=active?0:-1;}
    $('station-body').setAttribute('aria-labelledby',`tab-${state.tab}`);
    const group=state.area ? [d] : G.districts;
    let body='';
    if(state.tab==='foot'){
      const items=filtered();
      const shownIntro=d ? details('读这一境的引言',intro(d.id)) : '';
      body=`${shownIntro}<p class="muted">${items.length} 条地点${state.layer==='travel'?'':'与文献入口'} · 也可直接点击列表</p><ul class="place-list">${items.map(p=>`<li>${toPlace(p)}${p.coords?'':'<small>位置待核</small>'}</li>`).join('')}</ul>${items.length?'':'<p>此图层在当前地区暂无条目。</p>'}`;
    } else if(state.tab==='heritage' || state.tab==='food'){
      body=group.map(item=>`${d?'':`<p class="eyebrow">${esc(item.name)}</p>`}${bodyNote(item.id,state.tab)}`).join('');
    } else {
      body=group.map(item=>`<article>${d?'':`<h3>${esc(item.name)}</h3>`}<p>${esc(item.access)}</p>${item.sources.map(source).join('')}</article>`).join('')+'<p>出发前请查 12306。</p>';
    }
    $('station-body').innerHTML=body;
    $('station-body').scrollTop=0;
  }
  const draw = () => {
    for(const el of $('layers').children)el.setAttribute('aria-pressed',String(el.dataset.layer===state.layer));
    for(const el of $('districts').children)el.setAttribute('aria-pressed',String(el.dataset.region===state.area));
    drawMap();drawStation();
  };

  const reference = r => {
    const b=byBook[r.book];
    return `<li><h3>《${esc(b.title)}》</h3><p class="muted">ISBN：${esc(r.isbn||'展表未列')} · ${esc(r.pages||'页码待补')}</p>${b.warnings.map(t=>`<p class="warning">${esc(t)}</p>`).join('')}${r.description?`<p class="entry-text">${esc(r.description)}</p>`:'<p class="warning">展表未填知识点。</p>'}${r.quotes.map(q=>`<blockquote>${esc(q.text)}</blockquote><p class="source">张謇原话（${esc(q.status)}）：${esc(q.source)}</p>`).join('')}<p class="source">${esc(r.source)}</p><div class="actions">${edition(b)}</div></li>`;
  };
  const placeDialog=$('place-dialog');
  let priorHash='',placeTrigger;
  function renderPlace(p) {
    const d=district(p.area);
    const refs=(p.refs||[]).map(i=>D.records[i]);
    const region=d?`<p class="muted">同境非遗：${esc(d.heritage.map(row=>row[0]).join('、'))}；地方味道：${esc(d.food.map(row=>row[0]).join('、'))}。这是地区导览，不表示该地点提供此体验。</p>`:'';
    const placeBounds=!p.coords?'展表保留此条线索，位置待核，未在地图上标点。':'地图是参考位置，请用地点名称查询并核对入口。';
    $('place-content').innerHTML=`<p class="eyebrow">${esc(p.transit?'交通线索':regionName(p.area)+' / 地点与文献')}</p><h2 id="place-title">${esc(p.name)}</h2>${p.description?`<p>${esc(p.description)}</p>`:''}${p.transit?p.citations.map(source).join(''):''}<p class="muted">${placeBounds}</p><div class="actions">${navigation(p)}<button class="button" data-share="${p.id}">发给朋友</button></div><p class="source" id="share-status" role="status"></p>${region}${refs.length?`<h3>看对应书页</h3><ul class="reference-list">${refs.map(reference).join('')}</ul>${refs.some(r=>r.quotes.length)?'':'<p class="source">无独立可引用的张謇原话字段；保留展表叙述。</p>'}`:!p.transit?`<p class="warning">${p.area==='rudong'?'图书表待补；未补写引文、ISBN 或页码。':'展表尚未提供书页。'}</p>${source(original)}`:''}`;
    if(!placeDialog.open){placeDialog.showModal();placeDialog.querySelector('.close').focus();}
  }
  function openPlace(id, change=true, trigger) {
    const p=byPlace[id]||byTransit[id]; if(!p)return;
    if(change){priorHash=location.hash||'#map';placeTrigger=trigger;updateURL(deep('p',id));}
    state.place=id;
    if(p.area && p.area!=='intro')state.area=p.area;
    else state.area='';
    state.layer=p.transit?'travel':state.layer==='travel' || (state.layer==='intro'&&!p.sections.includes('intro')) || (state.layer==='firsts'&&!firstIds.has(p.id)) ? 'all':state.layer;
    state.tab='foot';draw();renderPlace(p);
  }
  placeDialog.addEventListener('close',()=>{
    state.place='';
    if(location.hash.startsWith('#p='))updateURL(priorHash|| (state.area?deep('d',state.area):'#map'),'replace');
    if(placeTrigger?.isConnected)placeTrigger.focus();else $('districts').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
    priorHash='';placeTrigger=null;
  });
  const showDistrict=(id,change=true,scroll=true)=>{
    if(id && !district(id))return;
    if(placeDialog.open)placeDialog.close();
    state.area=id;state.place='';state.tab='foot';draw();
    if(change)updateURL(id?deep('d',id):'#map');
    if(scroll)scrollMap();
  };
  function syncHash() {
    const param = new URLSearchParams(location.hash.slice(1));
    const id=param.get('p'),area=param.get('d');
    if(id && (byPlace[id]||byTransit[id])){openPlace(id,false);scrollMap();}
    else if(area && district(area))showDistrict(area,false);
    else if(placeDialog.open)placeDialog.close();
  }
  window.addEventListener('hashchange',syncHash);

  const currentBookList=()=>{
    const raw=$('book-query').value.trim().toLowerCase().replace(/^《|》$/g,'');
    const region=$('book-region').value, topic=$('book-topic').value;
    const all=[...D.books.map(b=>({...b,topic:'exhibit',isbn:b.isbn.filter(Boolean)})),...G.foodBooks.map(b=>({...b,topic:'food',isbn:[],warnings:[],refs:[]}))];
    return all.filter(b=>(region==='all'||b.districts.includes(region))&&(topic==='all'||b.topic===topic)&&(!raw||[b.title,b.note,...b.isbn,...b.districts.map(regionName),...b.refs.map(i=>byPlace[D.records[i].place]?.name)].filter(Boolean).some(v=>v.toLowerCase().includes(raw))));
  };
  function drawBooks(){
    const books=currentBookList();
    $('book-count').textContent=books.length ? `找到 ${books.length} 种${books.length>state.limit?` · 已展示前 ${state.limit} 种`:''}`:'没有匹配书目。试试书名、地名或 ISBN。';
    $('book-grid').innerHTML=books.slice(0,state.limit).map(b=>{
      const entries=[...new Set(b.refs.map(i=>D.records[i].place))].map(id=>byPlace[id]).filter(Boolean);
      return `<article class="book-card"><p class="eyebrow">${esc(b.topic==='food'?'地方饮食线索':b.districts.map(regionName).join(' · '))}</p><h3>《${esc(b.title)}》</h3><p class="muted">${b.isbn.length?'ISBN '+esc(b.isbn.join(' / ')):'ISBN 待核'}</p>${b.note?`<p>${esc(b.note)}</p>`:''}${source(b.source)}${b.warnings.map(t=>`<p class="warning">${esc(t)}</p>`).join('')}${entries.length?`<p class="muted">${entries.map(p=>toPlace(p)).join(' · ')}</p>`:''}<div class="actions">${edition(b)}</div></article>`;
    }).join('');
    $('book-more').hidden=state.limit>=books.length;
  }
  $('book-region').innerHTML=[['all','全部'],['intro','序厅'],...G.districts.map(d=>[d.id,d.name])].map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('');
  for(const [id,ev] of [['book-query','input'],['book-region','change'],['book-topic','change']])$(id).addEventListener(ev,()=>{state.limit=16;drawBooks();});
  $('book-more').addEventListener('click',()=>{state.limit+=16;drawBooks();});
  $('timeline-list').innerHTML=G.timeline.map(([year,title,text,id,s])=>`<li><b>${esc(year)}</b><h3>${esc(title)}</h3><p>${esc(text)}</p>${id?toPlace(byPlace[id],'对应地点 ↗'):''}${source(s)}</li>`).join('');
  $('first-list').innerHTML=G.firsts.map(([name,year,quote,note,id,s],i)=>`<article class="first-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(year)}</p><h3>${esc(name)}</h3>${quote?`<blockquote>${esc(quote)}</blockquote>`:'<p class="warning">“第一”称谓待核</p>'}<p>${esc(note)}</p>${id?toPlace(byPlace[id],'地图相关地点 ↗'):''}${source(s)}</article>`).join('');
  $('travel-list').innerHTML=transit.map(p=>`<article class="travel-card"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${toPlace(p,'在图上看 ↗')}${p.citations.map(source).join('')}</article>`).join('');

  const quiz=['《古镇余西》对应哪一处？',['余西古镇','军山','小洋口滩涂'],0,'余西古镇。可以到书架打开《古镇余西》，也可以从地图的通州栏找它。'];
  $('quiz').innerHTML=`<p>${esc(quiz[0])}</p><div class="quiz-options">${quiz[1].map((a,i)=>`<button class="button" data-answer="${i}">${esc(a)}</button>`).join('')}</div>`;
  const stamps=new Set();
  let dbPromise;
  function db(){
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open('zhangjian-poetry-observations-v2',2);
      req.onupgradeneeded=()=>{for(const [name,keyPath] of [['observations','id'],['visits','key'],['profiles','id']])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath});};
      req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();dbPromise=null;};resolve(req.result);};
      req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('本机记录正在由其他页面使用'));
    }).catch(e=>{dbPromise=null;throw e;});
    return dbPromise;
  }
  async function visits(op){
    const conn=await db();
    return new Promise((resolve,reject)=>{
      const tx=conn.transaction('visits',op?'readwrite':'readonly');
      const store=tx.objectStore('visits');
      if(op){if(op.checked)store.put({key:op.key,checkedAt:Date.now()});else store.delete(op.key);}
      const req=store.getAll();
      tx.oncomplete=()=>resolve(req.result);
      tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  }
  const paintStamps=()=>{
    for(const el of $('stamps').children){const marked=stamps.has(el.dataset.stamp);el.setAttribute('aria-pressed',String(marked));el.setAttribute('aria-label',`${marked?'取消':'盖'}${regionName(el.dataset.stamp)}印章`);}
    $('stamp-count').textContent=`已收集 ${stamps.size} / 7 枚${stamps.size===7?' · 江海旅人画像已解锁':''}`;
  };
  $('stamps').innerHTML=G.districts.map(d=>`<button disabled type="button" data-stamp="${d.id}" aria-pressed="false">${esc(d.name)}</button>`).join('');
  async function readStamps(op){
    try{
      const rows=await visits(op);stamps.clear();for(const r of rows)if(district(r.key))stamps.add(r.key);
      paintStamps();for(const el of $('stamps').children)el.disabled=false;
    }catch{$('stamp-count').textContent='未能读取或保存本机记录；请重新打开页面再试。';}
  }
  readStamps();
  window.addEventListener('pageshow',e=>{if(e.persisted)readStamps();});
  window.addEventListener('focus',()=>readStamps());

  async function copy(text,status){
    try{await navigator.clipboard.writeText(text);status.textContent='已复制。';}
    catch{status.innerHTML=`<label>可手动复制 <input readonly value="${attr(text)}"></label>`;const input=status.querySelector('input');input.focus();input.select();}
  }
  document.addEventListener('click',async e=>{
    const el=e.target.closest('[data-region],[data-place],[data-layer],[data-station-tab],[data-answer],[data-stamp],[data-share],[data-copy],#reset-map');if(!el)return;
    if(el.tagName==='A'&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;
    if('region' in el.dataset || el.id==='reset-map'){
      e.preventDefault();const id=el.dataset.region||'';
      showDistrict(id,true,el.tagName==='A');
      if(el instanceof SVGElement)$('districts').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
    }else if('place' in el.dataset){e.preventDefault();openPlace(el.dataset.place,true,el);}
    else if('layer' in el.dataset){state.layer=el.dataset.layer;state.tab='foot';draw();}
    else if('stationTab' in el.dataset){state.tab=el.dataset.stationTab;drawStation();}
    else if('answer' in el.dataset){$('quiz-result').textContent=Number(el.dataset.answer)===quiz[2]?'答对了！'+quiz[3]:'再试一次。提示：先去通州。';}
    else if('stamp' in el.dataset){el.disabled=true;await readStamps({key:el.dataset.stamp,checked:!stamps.has(el.dataset.stamp)});el.disabled=false;el.focus({preventScroll:true});}
    else if('share' in el.dataset){const id=el.dataset.share,p=byPlace[id]||byTransit[id],url=new URL(deep('p',id),location.href).href;
      if(navigator.share){try{await navigator.share({title:`${p.name} · 江海阅潮生`,url});return;}catch(err){if(err.name==='AbortError')return;}}
      await copy(url,$('share-status'));
    }else if('copy' in el.dataset){
      let status=el.parentElement.nextElementSibling;
      if(!status||!status.classList.contains('copy-status')){status=document.createElement('p');status.className='copy-status source';status.setAttribute('role','status');el.parentElement.after(status);}
      await copy(el.dataset.copy,status);
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.target instanceof SVGElement && e.target.matches('[role=button]') && ['Enter',' '].includes(e.key)){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
    if(e.target.matches('[data-station-tab]') && ['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();const nodes=[...$('station-tabs').children], i=nodes.indexOf(e.target);
      const next=nodes[e.key==='Home'?0:e.key==='End'?nodes.length-1:(i+(e.key==='ArrowLeft'?-1:1)+nodes.length)%nodes.length];next.click();next.focus();
    }
  });
  draw();drawBooks();syncHash();
})();
