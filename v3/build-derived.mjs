// Rebuild from the repository root versions; do not write outside v3/.
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const write=(p,text)=>writeFileSync(new URL(p,import.meta.url),text);
const assets=text=>text.replace(/(^|[\s'"`=(])(?:\.\/)?assets\//gm,'$1../assets/');
const theme='  <link rel="icon" href="assets/mark.svg" type="image/svg+xml">\n  <link rel="stylesheet" href="derived.css">\n</head>';
let shilu=assets(read('../index.html'))
  .replace(/((?:href|src)=")(v2\.css|profile\.css|fusion\.css|profile-core\.js|profile\.js)/g,'$1../$2')
  .replace('src="v2.js?', 'src="js/v2-derived.js?')
  .replace('</head>', theme)
  .replace(/<body([^>]*)>/,'<body$1><div class="exhibit-return"><a href="index.html">← 返回江海阅潮生展览</a></div>');
let research=assets(read('../research.html'))
  .replace(/(["'])classic\//g,'$1../classic/')
  .replaceAll('index.html#','shilu.html#')
  .replace('</head>', theme)
  .replace('<nav class="research-actions" aria-label="页面切换">','<nav class="research-actions" aria-label="页面切换"><a class="exhibit-home" href="index.html">返回江海阅潮生</a>');
write('shilu.html',shilu);
write('research.html',research);
write('js/v2-derived.js',assets(read('../v2.js')));
