(() => {
  'use strict';
  const places = window.JIANGHAI_CATALOG;
  const districts = window.JIANGHAI_DISTRICTS;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const byPlace = new Map(places.map(p => [p.id,p]));
  const district = id => districts.find(d => d.id === id);
  const state = {area:'',layer:'all',tab:'foot',place:''};
  const stampKeys = new Set();
  const query = (p, term) => [p.name,p.title,p.region,p.description].some(s => s.includes(term));
  // Only redirect old IDs when the revised catalogue still lists the same place.
  const legacyNumbers = {
    'intro-2':51,'intro-3':43,'intro-4':36,'intro-5':49,'intro-7':52,'intro-10':53,'intro-11':54,
    'haimen-2':1,'haimen-3':2,'haimen-4':3,'haimen-5':5,'haimen-7':4,
    'tongzhou-3':7,'tongzhou-5':11,'tongzhou-6':8,'tongzhou-7':10,'tongzhou-8':12,'tongzhou-9':13,'tongzhou-10':9,
    'rugao-6-shared':15,'rugao-4':19,'rugao-6':14,'rugao-9':23,'rugao-14':16,'rugao-18':17,
    'haian-3':33,'haian-9':30,'haian-11':31,
    'qidong-3':36,'qidong-5':37,'qidong-6':35,'qidong-7':38,'qidong-8':39,
    'nantong-2-shared':45,'nantong-2':42,'nantong-3':50,'nantong-5':47,'nantong-6':46,'nantong-9':56,'nantong-10':48,'nantong-11':55,
    'poem-3':23,'poem-4':7
  };
  const layers = [['all','全部'],['verse','诗文题咏'],['heritage','非遗风物'],['history','近代实业']];
  const literaryEntries = new Set([1,3,4,5,7,8,9,10,11,12,13,15,17,19,21,22,23,24,26,27,30,31,33,35,36,37,38,40,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56]);
  const tests = {all:()=>true,verse:p=>literaryEntries.has(p.number),heritage:p=>/非遗|非物质文化遗产/.test(p.description),history:p=>/实业|纱厂|纺织|盐垦|盐业|垦牧|码头/.test(p.description)};
  const filtered = () => places.filter(p=>(!state.area || p.area===state.area) && tests[state.layer](p) && query(p,$('map-query').value.trim()));
  const action = (k,v,label) => '<button type="button" data-'+k+'="'+esc(v)+'">'+esc(label)+'</button>';
  const toPlace = p => '<a data-place="'+p.id+'" href="#p='+p.id+'">'+esc(p.name)+'</a>';
  function placeLink(p){
    return '<a class="place-link" data-place="'+p.id+'" href="#p='+p.id+'" aria-label="查看地点：'+esc(p.name)+'">查看地点 <span aria-hidden="true">→</span></a>';
  }
  const poemFilms = new Map([
    ['catalog-01', ['田家', 'tianjia', '樊萌', '蒋华']],
    ['catalog-04', ['青龙港', 'qinglonggang', '江琳', '蒋华']],
    ['catalog-07', ['过排河观', 'guopaiheguan', '张梦颖', '徐毅']],
    ['catalog-10', ['中秋宋宅楼中对月', 'songzhai', '梁佳琪', '徐毅']],
    ['catalog-23', ['盆松', 'pensong', '宋若琳', '徐毅']],
    ['catalog-50', ['琅山', 'langshan', '樊萌', '蒋华']]
  ]);
  function poemFilm(p){
    const film=poemFilms.get(p.id);
    if(!film)return '';
    const [title,file,creator,teacher]=film;
    const base='assets/poem-films/'+file;
    return '<figure class="poem-film"><figcaption><h3>《'+title+'》诗画视频</h3><small>制作 · '+creator+'　指导 · '+teacher+'</small></figcaption>'+
      '<video controls playsinline preload="none" poster="'+base+'.jpg" aria-label="播放《'+title+'》诗画视频" src="'+base+'.mp4"></video></figure>';
  }
  const hrefRegion = d => '#d='+d.id;
  const scrollMap = () => $('map').scrollIntoView({block:'start'});
  const areaItems = id => places.filter(p=>p.area===id);
  $('ribbons').innerHTML=districts.map((d,i)=>'<a class="ribbon" data-region="'+d.id+'" href="'+hrefRegion(d)+'" style="--tint:'+d.color+'"><i>0'+(i+1)+'</i><strong>'+d.name+'</strong><small>'+areaItems(d.id).length+' 处地点</small></a>').join('');
  $('districts').innerHTML=action('region','','全域')+districts.map(d=>action('region',d.id,d.name)).join('');
  $('layers').innerHTML=layers.map(([id,name])=>action('layer',id,name)).join('');
  const tabs=[['foot','足迹与文献'],['heritage','非遗'],['food','味道'],['access','怎么去']];
  $('station-tabs').innerHTML=tabs.map(([id,name])=>'<button type="button" role="tab" data-tab="'+id+'" id="tab-'+id+'" aria-controls="station-body">'+name+'</button>').join('');

  const street=$('street-map');
  let mode='street';
  const atlas=window.createStreetAtlas(street,id=>openPlace(id,true,street),$('atlas-status'));
  function setMode(next){
    mode=next;
    for(const button of $('map-modes').children)button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
    updateStreet();
  }
  $('map-modes').onclick=event=>{
    const button=event.target.closest('button[data-mode]');
    if(button)setMode(button.dataset.mode);
  };
  const mapDialog=$('place-dialog');
  let returnHash='#map', trigger=null;
  const directions=p=>'https://uri.amap.com/search?keyword='+encodeURIComponent('南通 '+p.region+' '+p.name)+'&callnative=1';
  function updateStreet(){
    atlas.update(filtered(),state.area,mode,Boolean($('map-query').value.trim()) || state.layer!=='all');
  }
  function draw(){
    for(const el of $('districts').children) el.setAttribute('aria-pressed',String(el.dataset.region===state.area));
    for(const el of $('layers').children) el.setAttribute('aria-pressed',String(el.dataset.layer===state.layer));
    for(const el of $('station-tabs').children){el.setAttribute('aria-selected',String(el.dataset.tab===state.tab));el.tabIndex=el.dataset.tab===state.tab?0:-1;}
    $('station-body').setAttribute('aria-labelledby','tab-'+state.tab);
    let items=filtered();
    if(state.tab==='heritage')items=items.filter(tests.heritage);
    if(state.tab==='food')items=items.filter(p=>/名产|名点|酿酒|酒业|酒厂|茶干|羊肉|脆饼|海鲜|带鱼/.test(p.description));
    $('station-header').innerHTML='<p class="eyebrow">江海阅潮生 / 地方文献展</p><h3>'+esc(district(state.area)?.name||'从序厅出发')+'</h3>';
    $('station-body').innerHTML='<p class="muted">'+items.length+' 条地点 · '+(state.tab==='access'?'按地名查询出行':'点选查看展览文献')+'</p><ul class="place-list">'+items.map(p=>'<li>'+toPlace(p)+(state.tab==='access'?' <a target="_blank" rel="noopener" href="'+directions(p)+'">查路线 ↗</a>':'')+'</li>').join('')+'</ul>';
    updateStreet();
  }
  function externalLink(url, label){
    return '<a class="button" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(label)+' ↗</a>';
  }
  function bookActions(p){
    const search='https://www.duxiu.com/';
    const topic=p.id==='catalog-13' ? externalLink('https://mooc1.chaoxing.com/mooc-ans/ztnodedetailcontroller/visitnodedetail?courseId=218394166&knowledgeId=436829279','超星专题') : '';
    return '<div class="actions">'+externalLink(search,'在超星读秀找这本书')+topic+
      '<button type="button" class="button" data-copy-title="'+esc(p.title)+'">复制书名</button></div><div class="source" role="status"></div>';
  }
  function mapActions(p){
    const keyword=encodeURIComponent('南通 '+p.region+' '+p.name);
    return externalLink(directions(p),'高德地图')+
      externalLink('https://api.map.baidu.com/place/search?query='+keyword+'&region='+encodeURIComponent('南通')+'&output=html','百度地图')+
      externalLink('https://apis.map.qq.com/uri/v1/search?keyword='+keyword+'&region='+encodeURIComponent('南通')+'&referer=jianghai-guide','腾讯地图');
  }
  async function copyValue(value,status,success){
    try{
      await navigator.clipboard.writeText(value);status.textContent=success;
    }catch{
      const field=document.createElement('input');
      field.readOnly=true;field.value=value;field.setAttribute('aria-label','手动复制');
      status.replaceChildren('可手动复制：',field);field.focus();field.select();
    }
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-copy-title]');
    if(button)copyValue(button.dataset.copyTitle,button.parentElement.nextElementSibling,'书名已复制。');
  });
  function renderPlace(p){
    state.place=p.id;
    $('place-content').innerHTML='<p class="eyebrow">'+esc(p.region)+' / 地点与文献</p><h2 id="place-title">'+esc(p.name)+'</h2>'+
      '<p class="muted">'+esc(p.positionNote||'地图为地点参考位置')+'。</p>'+
      '<div class="place-actions"><button type="button" class="button" id="jump-book">查看书目与页码</button>'+
      '<button type="button" class="button" id="travel-toggle" aria-expanded="false" aria-controls="place-maps">前往此地<span aria-hidden="true">▾</span></button>'+
      '<button type="button" class="button" id="share-place">分享给朋友</button></div>'+
      '<div id="place-maps" role="group" aria-label="选择地图平台" hidden>'+mapActions(p)+'</div><div class="source" role="status" id="share-status"></div>'+
      '<p class="entry-text">'+esc(p.description)+'</p>'+poemFilm(p)+'<ul class="reference-list"><li><h3 tabindex="-1" id="place-book">《'+esc(p.title)+'》</h3>'+
      (p.pages?'<p class="muted">'+esc(p.pages)+'</p>':'')+bookActions(p)+'</li></ul>';
    $('jump-book').onclick=()=>{$('place-book').focus();$('place-book').scrollIntoView({block:'nearest'});};
    $('travel-toggle').onclick=event=>{
      const panel=$('place-maps');
      panel.hidden=!panel.hidden;
      event.currentTarget.setAttribute('aria-expanded',String(!panel.hidden));
    };
    $('share-place').onclick=async()=>{
      const url=new URL('#p='+p.id, location.href).href;
      if(navigator.share){
        try{await navigator.share({title:p.name+' · 江海阅潮生',url});return;}
        catch(error){if(error.name==='AbortError')return;}
      }
      await copyValue(url,$('share-status'),'地点链接已复制，可分享给朋友。');
    };
    attachPlaceNote(p,$('place-content')); if(!mapDialog.open)mapDialog.showModal();
  }
  function openPlace(id,change=true,origin){
    const p=byPlace.get(id); if(!p)return;
    if(change){returnHash=location.hash||'#map';trigger=origin;history.pushState(null,'','#p='+id);}
    renderPlace(p);
  }
  mapDialog.addEventListener('close',()=>{
    $('place-content').querySelector('video')?.pause();
    if(location.hash.startsWith('#p=')) history.replaceState(null,'',returnHash);
    state.place=''; if(trigger?.isConnected) trigger.focus({preventScroll:true});trigger=null;
  });
  function route(){
    const hash=location.hash,param=new URLSearchParams(hash.slice(1));
    const oldId=param.get('p'), number=Object.hasOwn(legacyNumbers,oldId)?legacyNumbers[oldId]:0;
    const alias=number?'catalog-'+String(number).padStart(2,'0'):'';
    if(alias){history.replaceState(null,'','#p='+alias);param.set('p',alias);}
    const place=byPlace.get(param.get('p'));
    if(place){if(!mapDialog.open){state.area=place.area;draw();}scrollMap();renderPlace(place);return;}
    if(mapDialog.open)mapDialog.close();
    if(hash==='#search'){scrollMap();$('map-query').focus();return;}
    if(hash==='#map' ||param.has('d')||param.has('p')){
      state.area=district(param.get('d'))?.id||''; state.layer='all';state.tab='foot';
      $('map-bookmark-status').hidden=!param.has('p');
      if(param.has('p'))history.replaceState(null,'','#map');
      $('map-query').value='';draw();scrollMap();
    }
  }
  window.addEventListener('hashchange',route);
  const grouped=new Map();
  for(const p of places){if(!grouped.has(p.title))grouped.set(p.title,[]);grouped.get(p.title).push(p);}
  let limit=16;
  $('book-region').innerHTML='<option value="">全部</option>'+districts.map(d=>'<option value="'+d.id+'">'+d.name+'</option>').join('');
  function drawBooks(){
    const term=$('book-query').value.trim(),area=$('book-region').value;
    const matched=[...grouped].map(([title,entries])=>[title,entries.filter(p=>(!area||area===p.area)&&query(p,term))]).filter(([,entries])=>entries.length);
    $('book-count').textContent='找到 '+matched.length+' 种书目';
    $('book-grid').innerHTML=matched.slice(0,limit).map(([title,entries])=>'<article class="book-card"><p class="eyebrow">'+[...new Set(entries.map(p=>p.region))].join(' · ')+'</p><h3>《'+esc(title)+'》</h3>'+entries.map(p=>'<p>'+toPlace(p)+' · '+esc(p.pages||'目录未列页码')+'</p>').join('')+bookActions(entries[0])+'</article>').join('');
    $('book-more').hidden=limit>=matched.length;
  }
  $('book-query').oninput=$('book-region').onchange=()=>{limit=16;drawBooks();};
  $('book-more').onclick=()=>{limit+=16;drawBooks();};
  $('map-query').oninput=draw;
  $('first-list').innerHTML=places.flatMap(p=>{
    const line=p.description.split('。').find(t=>/第一[家所座个]|首座|最早的/.test(t));
    if(!line)return [];
    return ['<article class="first-card"><p class="eyebrow">'+esc(p.region)+'</p><h3>'+esc(p.name)+'</h3><blockquote>'+esc(line)+'。</blockquote>'+placeLink(p)+'</article>'];
  }).join('');
  $('travel-list').innerHTML=districts.map(d=>'<article class="travel-card"><h3>'+d.name+'</h3><p>'+areaItems(d.id).slice(0,3).map(toPlace).join(' · ')+'</p><a data-region="'+d.id+'" href="'+hrefRegion(d)+'">在地图上查看 ↗</a></article>').join('');
  $('timeline-list').innerHTML=[[1853,1],[1901,36],[1904,44],[1905,45],[1915,49],[1916,51],[1919,53],[1921,5]].map(([year,n])=>{
    const p=places[n-1];
    const entry=p.description.split('。').find(s=>s.includes(String(year)));
    return '<li><b>'+year+'</b><h3>'+esc(p.name)+'</h3>'+(entry?'<p>'+esc(entry)+'。</p>':'')+placeLink(p)+'</li>';
  }).join('');
  $('quiz').innerHTML='<p>展览目录在哪一处引用了《盆松》？</p><div class="quiz-options">'+[23,2,50].map(n=>action('answer',n,places[n-1].name)).join('')+'</div>';
  $('stamps').innerHTML=districts.map(d=>action('stamp',d.id,d.name)).join('');
  async function stamps(change){
    try{
      if(change) await localRecord('visits','readwrite',stampKeys.has(change)?'delete':'put',stampKeys.has(change)?change:{key:change,checkedAt:Date.now()});
      const records=await localRecord('visits','readonly','getAll');stampKeys.clear();
      for(const r of records)if(district(r.key))stampKeys.add(r.key);
      for(const el of $('stamps').children)el.setAttribute('aria-pressed',String(stampKeys.has(el.dataset.stamp)));
      $('stamp-count').textContent='已收集 '+stampKeys.size+' / 7 枚';
    }catch{$('stamp-count').textContent='当前浏览器未启用本机记录。';}
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-place],[data-region],[data-layer],[data-tab],[data-answer],[data-stamp],#reset-map');
    if(!el||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(el.dataset.place){openPlace(el.dataset.place,true,el);return;}
    if(el.dataset.answer){$('quiz-result').textContent=el.dataset.answer==='23'?'答对了。目录第 23 条是如皋花木大世界。':'再看看如皋的花木盆景。';return;}
    if(el.dataset.stamp){stamps(el.dataset.stamp);return;}
    if(el.dataset.layer)state.layer=el.dataset.layer;
    if(el.dataset.tab)state.tab=el.dataset.tab;
    if('region' in el.dataset||el.id==='reset-map'){
      state.area=el.dataset.region||'';
      if(el.id==='reset-map'){state.layer='all';state.tab='foot';$('map-query').value='';atlas.reset();}
      history.pushState(null,'',state.area?'#d='+state.area:'#map');if(el.tagName==='A')scrollMap();
    }
    draw();
  });
  document.addEventListener('keydown',e=>{
    if(e.target instanceof SVGElement && e.target.matches('[role=button]') && ['Enter',' '].includes(e.key)){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
    if(e.target.matches('[data-tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      const nodes=[...$('station-tabs').children],i=nodes.indexOf(e.target);
      const next=nodes[e.key==='Home'?0:e.key==='End'?nodes.length-1:(i+(e.key==='ArrowLeft'?-1:1)+nodes.length)%nodes.length];e.preventDefault();next.click();next.focus();
    }
  });
  draw();drawBooks();stamps();route();
  window.addEventListener('focus',()=>stamps());
})();

function attachPlaceNote(place,container){
  const box=document.createElement('details');
  box.innerHTML='<summary>我的地点观察</summary><div><label>现场笔记<textarea rows="3"></textarea></label><label>添加照片（可选）<input type="file" accept="image/*"></label><div class="actions"><button type="button" class="button">保存到本机</button><button type="button" class="button">删除本条观察</button></div><p role="status" class="source"></p></div>';
  container.append(box);
  const note=box.querySelector('textarea'),file=box.querySelector('input'),[save,remove]=box.querySelectorAll('button'),status=box.querySelector('[role=status]');
  let prior=null;
  save.disabled=true;remove.disabled=true;note.disabled=true;
  localRecord('observations','readonly','get',place.id).then(r=>{
    prior=r;note.value=r?.note||'';if(r?.photo)status.textContent='已保存一张照片。';
    note.disabled=false;save.disabled=false;remove.disabled=!r;
  }).catch(()=>status.textContent='当前浏览器未启用本机记录。');
  save.onclick=async()=>{
    if(!note.value.trim()){status.textContent='请先写一句观察。';return;}
    save.disabled=true;remove.disabled=true;
    const updated={id:place.id,note:note.value.trim(),photo:file.files[0]||prior?.photo||null,updatedAt:Date.now()};
    try{await localRecord('observations','readwrite','put',updated);prior=updated;file.value='';status.textContent='已保存在当前浏览器。';}
    catch{status.textContent='保存失败，请检查本机存储空间。';}finally{save.disabled=false;remove.disabled=!prior;}
  };
  remove.onclick=async()=>{remove.disabled=true;save.disabled=true;try{await localRecord('observations','readwrite','delete',place.id);prior=null;note.value='';file.value='';status.textContent='本条观察已删除。';}catch{status.textContent='删除失败，请重试。';}finally{save.disabled=false;remove.disabled=!prior;}};
}
