(() => {
  'use strict';
  const places = window.JIANGHAI_CATALOG;
  const districts = window.JIANGHAI_DISTRICTS;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const byPlace = new Map(places.map(p => [p.id,p]));
  const district = id => districts.find(d => d.id === id);
  const state = {area:'',layer:'all',tab:'foot',place:''};
  const culture = window.JIANGHAI_CULTURE;
  const inCulture = () => Object.hasOwn(culture,state.tab);
  const regionLabel = id => district(id)?.name || '南通全域';
  const cultureItems = () => culture[state.tab].filter(item =>
    (!state.area || item.areas.includes(state.area)) &&
    [item.title,item.kind,...item.areas.map(regionLabel),byPlace.get(item.place)?.name]
      .some(value=>value?.includes($('map-query').value.trim())));
  const stampKeys = new Set();
  const readings = window.JIANGHAI_POEM_READINGS;
  const mediaByTitle = new Map(window.JIANGHAI_POETRY_MEDIA.map(work => [work.title, work]));
  const query = (p, term) => [p.name,p.title,p.region,p.description].some(s => s.includes(term))
    || Boolean(readings[p.id]?.some(poem => poem.title.includes(term) || poem.lines.some(line => line.includes(term))));
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
  const readingNotes = {
    'catalog-23': ['展览配诗', '看如皋盆景时可配读《盆松》。校注将此诗系于张謇少年在家乡私塾读书期间。', '1'],
    'catalog-10': ['诗中地点', '诗题点明宋宅，校注将宋宅系于今通州区西亭镇。这里标到镇，宅楼的今址仍待考。', '2'],
    'catalog-07': ['沿河走读', '在运盐河可配读《过排河观》。校注记排河观遗址在金沙镇南，张謇从常乐前往西亭宋宅途中曾经过此处。观址与今日河岸的距离仍待核。', '3–4']
  };
  function readingNote(p) {
    const record = readingNotes[p.id];
    if (!record) return '';
    return '<aside class="poem-context"><h3>诗与此地 · '+record[0]+'</h3><p>'+record[1]+'</p><small>参照《张謇诗编年校注》上册，第'+record[2]+'页。</small></aside>';
  }
  function verseReader() {
    const pairs = [
      ['青苍撮土', '青苍一撮土'],
      ['斧痕创鳞', '创鳞见斧痕'],
      ['梁栋之材', '梁栋与谁论']
    ];
    return '<section class="verse-reader"><h3>《盆松》意象与诗句</h3><p>点开一个意象，读对应的诗句。</p>'+
      pairs.map(([tag,line])=>'<details><summary>'+tag+'</summary><blockquote>'+line+'</blockquote></details>').join('')+
      '<small>据《张謇诗编年校注》上册第1页，引句节选，转为简体。</small></section>';
  }
  function poemReadings(p) {
    const items = readings[p.id];
    if (!items) return '';
    const base = 'assets/poem-readings/';
    return items.map(poem => {
      const pictures = (poem.pictures || []).map(([file, description]) =>
        '<img loading="lazy" decoding="async" src="'+base+file+'.webp" alt="'+esc(description)+'">'
      ).join('');
      const text = '<blockquote>'+poem.lines.map(esc).join('<br>')+'</blockquote>';
      const normalizeVerse = value => value.replace(/[\s\p{P}]/gu,'');
      const inIntroduction = normalizeVerse(p.description).includes(normalizeVerse(poem.lines.join('')));
      const verse = poem.lines.length > 8 || inIntroduction
        ? '<details class="poem-full"><summary>'+(inIntroduction ? '分行读诗' : '展开诗文')+'</summary>'+text+'</details>'
        : text;
      const annotations = Object.entries(poem.annotations || {}).filter(([heading]) => heading !== '创作背景').map(([heading, paragraphs]) => {
        const body = paragraphs.filter(line => line.trim() && !/[:：]\s*$/.test(line))
          .map(line => '<p>'+esc(line)+'</p>').join('');
        return body ? '<details class="poem-annotation"><summary>'+esc(heading)+'</summary>'+body+'</details>' : '';
      }).join('');
      const audio = poem.podcast ? '<div class="reading-audio"><strong>听诗歌播客</strong><span>'+esc(poem.podcast[1])+
        '</span><audio controls preload="none" aria-label="'+esc(poem.podcast[1])+'" src="'+base+poem.podcast[0]+'.mp3"></audio></div>' : '';
      return '<section class="place-reading"><header><small>'+esc(poem.relation || '诗歌选读')+'</small><h3>《'+esc(poem.title)+'》'+esc(poem.selection || '')+'</h3></header>'+
        (poem.note ? '<p>'+esc(poem.note)+'</p>' : '')+verse+
        (poem.source ? '<small>'+esc(poem.source)+'</small>' : '')+
        (pictures ? '<figure><div class="reading-pictures">'+pictures+'</div><figcaption>诗意配图 · 《张謇诗画人生》</figcaption></figure>' : '')+audio+
        (poem.relation ? (mediaByTitle.get(poem.title)?.films || []).map(film =>
          relatedVideo('《'+poem.title+'》诗画视频', film.credit, film.src, film.poster)
        ).join('') : '')+
        (annotations ? '<div class="poem-notes"><h4>项目阅读札记</h4>'+annotations+'</div>' : '')+'</section>';
    }).join('');
  }
  function poemFilm(p){
    const film=window.JIANGHAI_FILMS.get(p.id);
    if(!film)return '';
    const [title,file,creator,teacher]=film;
    const base='assets/poem-films/'+file;
    return '<figure class="poem-film"><figcaption><h3>《'+title+'》诗画视频</h3><small>视频制作　<strong>'+creator+'</strong>　指导教师　<strong>'+teacher+'</strong></small></figcaption>'+
      '<video controls playsinline preload="none" poster="'+base+'.jpg" aria-label="播放《'+title+'》诗画视频" src="'+base+'.mp4"></video></figure>';
  }
  function relatedVideo(title, caption, src, poster) {
    return '<figure class="poem-film"><figcaption><h3>'+esc(title)+'</h3><small>'+esc(caption)+'</small></figcaption>'+
      '<video controls playsinline preload="none"'+(poster?' poster="'+esc(poster)+'"':'')+' aria-label="'+esc(title)+'" src="'+esc(src)+'"></video></figure>';
  }
  function chronicleFilms(p) {
    return window.JIANGHAI_CHRONICLES.filter(clip => clip.places[p.id]).map(clip => {
      const path = 'assets/poetry-library/'+clip.file;
      return relatedVideo(clip.title, clip.places[p.id], path+'.mp4', path+'.jpg');
    }).join('');
  }
  const hrefRegion = d => '#d='+d.id;
  const scrollMap = () => $('map').scrollIntoView({block:'start'});
  const areaItems = id => places.filter(p=>p.area===id);
  $('ribbons').innerHTML=districts.map((d,i)=>'<a class="ribbon" data-region="'+d.id+'" href="'+hrefRegion(d)+'" style="--tint:'+d.color+'"><i>0'+(i+1)+'</i><strong>'+d.name+'</strong><small>'+areaItems(d.id).length+' 处地点</small></a>').join('');
  $('districts').innerHTML=action('region','','全域')+districts.map(d=>action('region',d.id,d.name)).join('');
  $('layers').innerHTML=layers.map(([id,name])=>action('layer',id,name)).join('');
  const tabs=[['foot','足迹与文献'],['heritage','非遗'],['food','美食'],['access','怎么去']];
  $('station-tabs').innerHTML=tabs.map(([id,name])=>'<button type="button" role="tab" data-tab="'+id+'" id="tab-'+id+'" aria-controls="station-body">'+name+'</button>').join('');

  const street=$('street-map');
  let mode='street';
  const atlas=window.createStreetAtlas(street,id=>{
    if(inCulture()){
      const card=[...$('station-body').querySelectorAll('[data-culture-anchor]')].find(el=>el.dataset.cultureAnchor===id);
      if(card){
        card.open=true;
        const summary=card.querySelector('summary');
        summary.focus({preventScroll:true});
        if(card.getBoundingClientRect().top>window.innerHeight-80)summary.scrollIntoView({block:'nearest'});
        return;
      }
    }
    openPlace(id,true,street);
  },$('atlas-status'));
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
    if(inCulture()){
      const anchors=[...new Set(cultureItems().map(item=>item.place))].map(id=>byPlace.get(id)).filter(Boolean);
      atlas.update(anchors,state.area,mode,true,true);
      return;
    }
    atlas.update(filtered(),state.area,mode,Boolean($('map-query').value.trim()) || state.layer!=='all');
  }
  function drawCulture(){
    const items=cultureItems(), heritage=state.tab==='heritage';
    const label=heritage?'非遗':'美食';
    const regionOptions=[['','南通全域'],...districts.map(d=>[d.id,d.name])];
    $('station-body').innerHTML='<div class="culture-panel" data-theme="'+state.tab+'">'+
      '<div class="culture-panel-tools"><p><strong>'+label+'精选</strong></p>'+
      '<label><span class="culture-sr">筛选地区</span><select data-culture-region aria-label="筛选地区">'+
      regionOptions.map(([id,name])=>'<option value="'+esc(id)+'"'+(id===state.area?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label></div>'+
      '<a class="culture-map-jump" href="#map-modes">查看地图</a>'+
      (items.length?'<div class="culture-list">'+items.map(item=>{
        const place=byPlace.get(item.place);
        return '<details class="culture-card"'+(place?' data-culture-anchor="'+esc(place.id)+'"':'')+'><summary>'+
          '<span class="culture-card-top"><span class="culture-type">'+esc(item.kind)+'</span><span>'+esc(state.area?regionLabel(state.area):item.areas.map(regionLabel).join('、'))+'</span></span>'+
          '<span class="culture-card-title">'+esc(item.title)+'</span><span class="culture-card-summary">'+esc(item.summary)+'</span>'+
          '<span class="culture-card-toggle"><span class="culture-open-text">查看详情</span><span class="culture-close-text">收起详情</span></span></summary>'+
          '<div class="culture-detail"><p>'+esc(item.detail)+'</p>'+
          (item.recognition?'<p class="culture-recognition">'+esc(item.recognition)+'</p>':'')+
          (place?'<p class="culture-location"><strong>'+(item.anchor==='region'?'风味地域':'关联地点')+'</strong>'+
          '<span>'+esc(place.name)+'</span></p><a class="button culture-place" data-place="'+esc(place.id)+'" href="#p='+esc(place.id)+'">'+(item.anchor==='region'?'了解这个地方':'查看地点卡')+'</a>':'')+
          '<details class="culture-sources"><summary>资料来源</summary><ul>'+
          item.sources.map(([name,url])=>'<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(name)+'</a></li>').join('')+
          '</ul></details></div></details>';
      }).join('')+'</div>':'<div class="culture-empty">没有匹配的'+label+'。试试其他关键词或地区。</div>')+'</div>';
  }
  function draw(){
    for(const el of $('districts').children) el.setAttribute('aria-pressed',String(el.dataset.region===state.area));
    for(const el of $('layers').children) el.setAttribute('aria-pressed',String(el.dataset.layer===state.layer));
    for(const el of $('station-tabs').children){el.setAttribute('aria-selected',String(el.dataset.tab===state.tab));el.tabIndex=el.dataset.tab===state.tab?0:-1;}
    $('station-body').setAttribute('aria-labelledby','tab-'+state.tab);
    const isCulture=inCulture();
    $('layers').hidden=isCulture;
    $('map-query-label').textContent=isCulture?(state.tab==='heritage'?'查找非遗':'查找美食'):'查找地点';
    $('map-query').placeholder=isCulture?'项目名、地区或关联地名':'地名、书名或诗句';
    $('station-header').innerHTML='<p class="eyebrow">江海阅潮生 / 地方文献展</p><h3>'+esc(district(state.area)?.name||(isCulture?'南通全域':'从序厅出发'))+'</h3>';
    if(isCulture){drawCulture();updateStreet();return;}
    const items=filtered();
    $('station-body').innerHTML=items.length?'<ul class="place-list">'+items.map(p=>'<li>'+toPlace(p)+(state.tab==='access'?' <a target="_blank" rel="noopener" href="'+directions(p)+'">查路线</a>':'')+'</li>').join('')+'</ul>':'<p class="muted">没有找到相关地点。</p>';
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
  const favoritePrefix='zhangjian.favorite.';
  function showFavorites() {
    const list=$('favorite-list');
    const button=$('toggle-favorite');
    try {
      const saved=places.filter(p=>localStorage.getItem(favoritePrefix+p.id)==='1');
      list.innerHTML=saved.length?saved.map(toPlace).join(' · '):'还没有收藏。可在地点详情中收藏想重访的地点。';
      if(button){
        const active=saved.some(p=>p.id===state.place);
        button.setAttribute('aria-pressed',String(active));
        button.textContent=active?'取消收藏':'收藏此地点';
      }
    } catch {
      list.textContent='当前浏览器无法读取本机收藏。';
      if(button)button.disabled=true;
    }
  }
  window.addEventListener('storage',showFavorites);
  window.addEventListener('pageshow',showFavorites);
  showFavorites();
  function showPlacePhotos(p){
    const photos = window.placePhotos?.[p.id];
    if (!photos?.length) return;
    const figure = document.createElement('figure');
    figure.className = 'place-photos';
    figure.innerHTML = '<a class="place-photo-view" target="_blank" rel="noopener"><img loading="lazy" decoding="async" alt=""></a>' +
      '<figcaption><span class="place-photo-label">展览配图</span><span class="place-photo-caption" aria-live="polite"></span></figcaption>';
    const link = figure.querySelector('a');
    const img = link.querySelector('img');
    const caption = figure.querySelector('.place-photo-caption');
    let index = 0;
    function display(){
      const photo = photos[index];
      link.href = 'assets/place-photos/' + photo.file;
      link.setAttribute('aria-label', '查看大图：' + photo.caption + '（新窗口）');
      img.width = photo.width;
      img.height = photo.height;
      img.alt = photo.caption;
      img.src = link.href;
      caption.textContent = (photos.length > 1 ? (index + 1) + ' / ' + photos.length + '　' : '') + photo.caption;
    }
    if (photos.length > 1){
      const controls = document.createElement('div');
      controls.className = 'place-photo-controls';
      for (const [name, step] of [['上一张', -1], ['下一张', 1]]){
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        button.onclick = () => {
          index = (index + step + photos.length) % photos.length;
          display();
        };
        controls.append(button);
      }
      figure.querySelector('figcaption').append(controls);
    }
    display();
    $('place-content').querySelector('.entry-text').after(figure);
  }
  function renderPlace(p){
    $('place-content').querySelectorAll('audio, video').forEach(media => media.pause());
    state.place=p.id;
    $('place-content').innerHTML='<p class="eyebrow">'+esc(p.region)+' / 地点与文献</p><h2 id="place-title" class="site-heading">'+esc(p.name)+'</h2>'+
      '<div class="place-actions"><button type="button" class="button" id="jump-book">查看书目与页码</button>'+
      '<button type="button" class="button" id="travel-toggle" aria-expanded="false" aria-controls="place-maps">前往此地<span aria-hidden="true">▾</span></button>'+
      '<button type="button" class="button" id="share-place">分享给朋友</button></div>'+
      '<div id="place-maps" role="group" aria-label="选择地图平台" hidden>'+mapActions(p)+'</div><div class="source" role="status" id="share-status"></div>'+
      '<p class="entry-text">'+esc(p.description)+'</p>'+readingNote(p)+poemReadings(p)+(p.id==='catalog-23'?verseReader():'')+poemFilm(p)+chronicleFilms(p)+'<ul class="reference-list"><li><h3 tabindex="-1" id="place-book">《'+esc(p.title)+'》</h3>'+
      (p.pages?'<p class="muted">'+esc(p.pages)+'</p>':'')+bookActions(p)+'</li></ul>';
    showPlacePhotos(p);
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
    const favorite=document.createElement('button');
    favorite.type='button';
    favorite.className='button';
    favorite.id='toggle-favorite';
    favorite.onclick=()=>{
      try {
        if(localStorage.getItem(favoritePrefix+p.id)==='1')localStorage.removeItem(favoritePrefix+p.id);
        else localStorage.setItem(favoritePrefix+p.id,'1');
        showFavorites();
      } catch { $('share-status').textContent='当前浏览器无法保存收藏。'; }
    };
    $('place-content').append(favorite);
    showFavorites();
    const noteBox=attachPlaceNote(p,$('place-content'));
    if(!mapDialog.open)mapDialog.showModal();
    const jump=document.createElement('button');
    jump.type='button';
    jump.className='walk-jump';
    jump.textContent='查看学生走读任务 ↓';
    const goToWalk=()=>{
      const heading=$('walk-heading');
      heading.focus({preventScroll:true});
      heading.scrollIntoView({block:'start'});
    };
    jump.onclick=goToWalk;
    const noteJump=document.createElement('button');
    noteJump.type='button';
    noteJump.className='walk-jump';
    noteJump.textContent='填写观察卡 ↓';
    noteJump.setAttribute('aria-controls',noteBox.id);
    noteJump.onclick=()=>{
      noteBox.open=true;
      noteBox.scrollIntoView({block:'nearest'});
      (noteBox.querySelector('textarea:enabled')||noteBox.querySelector('summary')).focus();
    };
    const actions=document.createElement('div');
    actions.className='walk-actions';
    const askGuide=document.createElement('button');
    askGuide.type='button';
    askGuide.className='walk-jump';
    askGuide.dataset.xtAsk=p.id;
    askGuide.textContent='问小通';
    actions.append(jump,noteJump,askGuide);
    $('place-content').querySelector('.entry-text').before(actions);
    const destination=new URLSearchParams(location.hash.slice(1));
    if(destination.get('walk')==='1')goToWalk();
    if(destination.get('note')==='1')noteJump.click();

  }
  function openPlace(id,change=true,origin){
    const p=byPlace.get(id); if(!p)return;
    if(change){returnHash=location.hash||'#map';trigger=origin;history.pushState(null,'','#p='+id);}
    renderPlace(p);
  }
  mapDialog.addEventListener('play',event=>{
    mapDialog.querySelectorAll('audio, video').forEach(media => {
      if (media !== event.target) media.pause();
    });
  },true);
  mapDialog.addEventListener('close',()=>{
    $('place-content').querySelectorAll('audio, video').forEach(media => media.pause());
    if(location.hash.startsWith('#p=')) history.replaceState(null,'',returnHash);
    state.place=''; if(trigger?.isConnected) trigger.focus({preventScroll:true});trigger=null;
  });
  function route(){
    const hash=location.hash,param=new URLSearchParams(hash.slice(1));
    const oldId=param.get('p'), number=Object.hasOwn(legacyNumbers,oldId)?legacyNumbers[oldId]:0;
    const alias=number?'catalog-'+String(number).padStart(2,'0'):'';
    if(alias){param.set('p',alias);history.replaceState(null,'','#'+param);}
    const place=byPlace.get(param.get('p'));
    if(place){if(!mapDialog.open){state.area=place.area;draw();}scrollMap();renderPlace(place);return;}
    if(mapDialog.open)mapDialog.close();
    if(hash==='#search'){scrollMap();$('map-query').focus();return;}
    if(hash==='#map' ||param.has('d')||param.has('p')||(culture&&param.has('tab'))){
      state.area=district(param.get('d'))?.id||''; state.layer='all';
      state.tab=culture&&Object.hasOwn(culture,param.get('tab'))?param.get('tab'):'foot';
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
    $('book-grid').innerHTML=matched.slice(0,limit).map(([title,entries])=>'<article class="book-card"><p class="eyebrow">'+[...new Set(entries.map(p=>p.region))].join(' · ')+'</p><h3>《'+esc(title)+'》</h3>'+entries.map(p=>'<p>'+toPlace(p)+(p.pages?' · '+esc(p.pages):'')+'</p>').join('')+bookActions(entries[0])+'</article>').join('');
    $('book-more').hidden=limit>=matched.length;
  }
  $('book-query').oninput=$('book-region').onchange=()=>{limit=16;drawBooks();};
  $('book-more').onclick=()=>{limit+=16;drawBooks();};
  $('map-query').oninput=draw;
  function setRegion(id){
    state.area=id;
    const params=new URLSearchParams();
    if(id)params.set('d',id);
    if(inCulture())params.set('tab',state.tab);
    history.pushState(null,'',params.size?'#'+params:'#map');
  }
  $('station-body').addEventListener('change',event=>{
    const select=event.target.closest('[data-culture-region]');
    if(!select)return;
    setRegion(select.value);
    draw();
    $('station-body').querySelector('[data-culture-region]')?.focus({preventScroll:true});
  });
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
  const films=window.JIANGHAI_FILMS;
  const askForm=$('catalog-question');
  askForm.addEventListener('submit',event=>{
    event.preventDefault();
    const input=askForm.elements.question.value.trim().replace(/[《》？?，。、\s]/g,'');
    const result=$('catalog-answer');
    result.replaceChildren();
    const matches=places.filter(p=>input.includes(p.name.replace(/\s/g,'')) || (films.has(p.id) && input.includes(films.get(p.id)[0])));
    if(matches.length!==1){
      result.textContent=matches.length?'请一次查询一处地点或一首诗。':'请输入完整的地名或诗名。';
      return;
    }
    const p=matches[0];
    const title=films.get(p.id)?.[0];
    let intent=input.replace(p.name.replace(/\s/g,''),'');
    if(title)intent=intent.replace(title,'');
    intent=intent.replace(/^(请问|我想查|想查|查一下|查)/,'').replace(/[的呢吗呀]/g,'');
    let answer;
    if(/^(书目与页码|书目|对应书目|参考书|对应哪本书|出自哪本书|在哪本书|页码|在第几页|第几页|在哪一页)$/.test(intent)){
      answer='《'+p.title+'》'+(p.pages?'，'+p.pages:'')+'。';
    } else if(/^(配在哪里|在哪个地点|对应哪个地点|对应地点|展览配诗地点)$/.test(intent) && title){
      answer='游览'+p.region+'的'+p.name+'时，可以配读《'+title+'》。';
    } else if(/^(诗地关系|诗与地点关系|与地点关系)$/.test(intent) && readingNotes[p.id]){
      answer=readingNotes[p.id][1]+' 参照《张謇诗编年校注》上册第'+readingNotes[p.id][2]+'页。';
    }
    const paragraph=document.createElement('p');
    paragraph.textContent=answer||'可以打开地点卡，查看介绍和对应书目。';
    const source=document.createElement('a');
    source.href='#p='+p.id;
    source.dataset.place=p.id;
    source.textContent='查看'+p.name;
    result.append(paragraph,source);
  });
  $('quiz').innerHTML='<p>展览中，哪一处地点配读《盆松》？</p><div class="quiz-options">'+[23,2,50].map(n=>action('answer',n,places[n-1].name)).join('')+'</div>';
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
    if(el.dataset.answer){$('quiz-result').textContent=el.dataset.answer==='23'?'答对了：《盆松》与如皋花木大世界相连。':'提示：找找如皋的盆景。';return;}
    if(el.dataset.stamp){stamps(el.dataset.stamp);return;}
    if(el.dataset.layer)state.layer=el.dataset.layer;
    if(el.dataset.tab){
      const wasCulture=inCulture();
      state.tab=el.dataset.tab;
      if(wasCulture||inCulture()){
        $('map-query').value='';
        const params=new URLSearchParams();
        if(state.area)params.set('d',state.area);
        if(inCulture())params.set('tab',state.tab);
        history.replaceState(null,'',params.size?'#'+params:'#map');
      }
    }
    if('region' in el.dataset||el.id==='reset-map'){
      if(el.id==='reset-map'){state.layer='all';if(!inCulture())state.tab='foot';$('map-query').value='';atlas.reset();}
      setRegion(el.dataset.region||'');if(el.tagName==='A')scrollMap();
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
  box.innerHTML='<summary>填写观察卡</summary><div><label>现场笔记<textarea rows="3"></textarea></label><label>添加照片（可选）<input type="file" accept="image/*"></label><div class="actions"><button type="button" class="button">保存到本机</button><button type="button" class="button">删除这张观察卡</button></div><p role="status" class="source"></p></div>';
  container.append(box);
  box.id='walk-note';
  const passportLink=document.createElement('a');
  passportLink.href='index.html?trail='+encodeURIComponent(place.id)+'#passport';
  passportLink.textContent='回诗路护照看记录 →';
  box.querySelector('.actions').after(passportLink);
  const task=window.JIANGHAI_WALKS[place.id];
  const section=document.createElement('section');
  section.className='walk-checklist';
  section.setAttribute('aria-labelledby','walk-heading');
  section.innerHTML='<h3 id="walk-heading" tabindex="-1">学生走读任务</h3><p class="walk-question"></p><p class="source walk-source"></p><fieldset><legend>现场观察、核对草稿、写给游客</legend></fieldset><details class="walk-ai-help"><summary>想用自己的 AI 再试一次？</summary><p>把地点卡中的一条资料和你的导览词发给 AI，问它：“哪几个字能从资料里找到依据？哪几个字是我的现场观察？请指出你拿不准的地方。”回看原文，由你决定保留哪种说法。</p></details><div class="walk-footer"><span role="status"></span></div>';
  section.querySelector('.walk-question').textContent=task.question;
  const pages=place.pages?.trim();
  section.querySelector('.walk-source').textContent='约 5–10 分钟 · 《'+place.title+'》'+(pages?' · '+pages:'');
  const steps=[['see','到场看一眼'],['verify','你来核对'],['record','写给下一位游客']];
  const progressStatus=section.querySelector('[role=status]');
  const fieldset=section.querySelector('fieldset');
  function updateProgress(){
    progressStatus.textContent='已勾选 '+fieldset.querySelectorAll('input:checked').length+' / 3 · 仅存本机';
  }
  for(const [key,title] of steps){
    const label=document.createElement('label');
    const checkbox=document.createElement('input');
    checkbox.type='checkbox';
    const storageKey='zhangjian.walk.v1.'+place.id+'.'+key;
    try { checkbox.checked=localStorage.getItem(storageKey)==='1'; }
    catch { checkbox.disabled=true; }
    checkbox.onchange=()=>{
      try {
        if(checkbox.checked)localStorage.setItem(storageKey,'1');
        else localStorage.removeItem(storageKey);
        updateProgress();
      } catch {
        checkbox.checked=!checkbox.checked;
        progressStatus.textContent='此浏览器暂时无法保存勾选进度。';
      }
    };
    const text=document.createElement('span');
    const heading=document.createElement('strong');
    heading.textContent=title;
    text.append(heading);
    if(key==='verify'){
      const draft=document.createElement('span');
      draft.className='walk-ai-example';
      const caption=document.createElement('b');
      caption.textContent='模拟 AI 草稿 · 待核对';
      draft.append(caption,document.createTextNode(task.ai));
      text.append(draft);
    }
    text.append(document.createTextNode(task[key]));
    label.append(checkbox,text);
    fieldset.append(label);
  }
  updateProgress();
  if(fieldset.querySelector('input:disabled'))progressStatus.textContent='此浏览器暂时无法保存勾选进度。';
  container.insertBefore(section,box);
  const note=box.querySelector('textarea'),file=box.querySelector('input'),[save,remove]=box.querySelectorAll('button'),status=box.querySelector('[role=status]');
  note.placeholder='写一两句给游客的话。可以记下你看到的细节，或写出你根据哪句话改了草稿。';
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
  return box;
}
