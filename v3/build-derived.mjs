// Rebuild from the repository root versions; do not write outside v3/.
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const write=(p,text)=>writeFileSync(new URL(p,import.meta.url),text);
const assets=text=>text.replace(/(^|[\s'"`=(])(?:\.\/)?assets\//gm,'$1../assets/');
const theme='  <link rel="stylesheet" href="derived.css">\n</head>';
const mapNav='<a href="research.html" class="topnav-research">诗歌地图 ↗</a>';
const legacyExhibitHashes='<script src="js/legacy-exhibit-link.js"></script>';
const entry=read('exhibit-entry.html').trimEnd();
const guide=read('home-guide.html').trimEnd();
function replaceRequired(page, pattern, replacement) {
  const result=page.replace(pattern,replacement);
  if(result===page)throw new Error('Original layout did not match: '+pattern);
  return result;
}
let shilu=assets(read('../index.html'))
  .replace('  <!-- Stable public entry; the original HTML remains the no-JavaScript fallback. -->\n  <script>location.replace(\'./v3/\' + location.search + location.hash);</script>\n','')
  .replace(/((?:href|src)=")(v2\.css|profile\.css|fusion\.css|profile-core\.js|profile\.js)/g,'$1../$2')
  .replace('src="v2.js?', 'src="js/v2-derived.js?')
  .replace('</head>', theme)
  .replace(/<body([^>]*)>/,'<body$1><div class="exhibit-return"><a href="index.html">← 返回江海阅潮生展览</a></div>');
let home=shilu
  .replace('</head>', '  <link rel="stylesheet" href="intro.css">\n  <script defer src="js/home-map.js"></script>\n</head>')
  .replace('setTimeout(function(){leave(false)},3200)', 'setTimeout(function(){leave(false)},4700)')
  .replace('<head>', '<head>\n  '+legacyExhibitHashes)
  .replace('<div class="exhibit-return"><a href="index.html">← 返回江海阅潮生展览</a></div>','')
  .replace(mapNav+'</nav>', '<a href="#jianghai">地方文献展</a></nav>')
  .replace('<nav class="topnav" aria-label="主要导航">','<nav class="topnav" aria-label="主要导航">'+mapNav)
  .replace('  <link rel="canonical" href="https://loveeti.top/">\n','')
  .replace('  <meta property="og:url" content="https://loveeti.top/">\n','');
// P1: keep the original cover and ink animation; simplify the choices below the title.
home=replaceRequired(home, '<p>故里、文脉、园林、滩涂、考古、海岸与城市。先选一境认识今天的南通，再沿张謇的足迹与诗歌线索继续读下去。</p>',
  '<p>在七境地图上找张謇足迹、查展览书目。想看今天的南通，也可以从七境里选一站，再去读诗或听朗读。</p>');
home=replaceRequired(home, /<div class="tour-hero-actions">[^\n]+<\/div>/,
  '<div class="tour-hero-actions"><a class="hero-primary" href="exhibit.html#map">打开七境地图</a><a class="hero-secondary" href="#seven-gates">开始七境漫游</a></div>');
home=replaceRequired(home,'<a class="tour-scroll" href="#seven-gates">向下，选择第一站','<a class="tour-scroll" href="#two-views">向下，看看从哪开始');
// P2: replace the existing exploration cards instead of adding a second set of entrances.
home=replaceRequired(home, /    <section class="section mode-section" id="two-views"[\s\S]*?<\/section>/,entry);
home=replaceRequired(home,'    <section class="seven-gates"',guide+'\n\n    <section class="seven-gates"');
// P3: add navigation beside the original reading, station and local check-in actions.
home=replaceRequired(home, '拍照、记录与打卡</button></div>', '记录这首诗的观察</button></div><div class="jianghai-next poem-next" aria-label="继续读与走"></div>');
home=replaceRequired(home, "        content.querySelector('#startActivity').addEventListener", `        const next=content.querySelector('.poem-next');
        for(const [target,label] of [['video','看这首诗的影像'],['graph','看诗句关系']]){
          if(target==='video'&&!poemVideos.has(p.id))continue;
          const button=document.createElement('button');button.type='button';button.className='ghost';button.textContent=label;
          button.addEventListener('click',()=>showPoemView(target));next.append(button);
        }
        content.querySelector('#startActivity').addEventListener`);
home=replaceRequired(home, '<div class="station-dialog-actions">',
  '<div class="jianghai-next station-next" aria-label="到站与继续探索"><a id="stationTravel" class="ghost" target="_blank" rel="noopener noreferrer">在高德查怎么去</a><a id="stationExhibit" class="ghost">查看这一境的文献与出行</a><a id="stationPassport" class="ghost" href="#passport">查看我的诗路护照</a></div><div class="station-dialog-actions">');
home=replaceRequired(home, '      showStationDialogPhoto(s.photo);', `      showStationDialogPhoto(s.photo);
      document.getElementById('stationExhibit').href='exhibit.html#d='+encodeURIComponent(key);
      document.getElementById('stationPassport').onclick=()=>stationDialog.close();`);
home=replaceRequired(home,'    function showStationDialogPhoto(photo){',`    function showStationDialogPhoto(photo){
      const mapSearch=new URL('https://uri.amap.com/search');
      mapSearch.searchParams.set('keyword','南通 '+photo.place);
      mapSearch.searchParams.set('callnative','1');
      document.getElementById('stationTravel').href=mapSearch.href;`);
home=replaceRequired(home,'去七境地图选择下一站 <span aria-hidden="true">↗</span>','选择下一站');
home=replaceRequired(home,'<small>自记打卡不是定位验证或景区认证；','<a href="#archive" class="passport-link">回诗歌档案写观察</a><small>自记打卡不是定位验证或景区认证；');
write('index.html',home);
write('shilu.html',shilu.replace('href="index.html">← 返回江海阅潮生展览','href="index.html">← 返回张謇诗路首页'));
write('js/v2-derived.js',assets(read('../v2.js')));
