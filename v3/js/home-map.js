const catalogue=window.JIANGHAI_CATALOG;
const stations=Object.fromEntries(window.JIANGHAI_DISTRICTS.map(d=>[d.id,d]));
const $home=id=>document.getElementById(id);
const mapUrl=id=>'exhibit.html#p='+id;
const regionUrl=id=>'exhibit.html#d='+id;
let selected='haimen';
const districtPictures={rugao:['public/station-rugao.jpg','如皋水绘园 · Howhowforever · CC BY-SA 3.0'],haian:['public/station-haian.jpg','海安青墩遗址 · Howhowforever · CC BY-SA 3.0'],haimen:['zhangjian-memorial.webp','张謇纪念馆'],nantong:['langshan.webp','狼山风景名胜区']};
function selectStation(id){
  selected=id;
  const entries=catalogue.filter(p=>p.area===id),p=entries[0];
  for(const node of document.querySelectorAll('[data-station]')) {node.classList.toggle('active',node.dataset.station===id);node.setAttribute('aria-pressed',String(node.dataset.station===id));}
  const taskPlace=window.JIANGHAI_FEATURED_WALKS[id];
  const taskText=window.JIANGHAI_WALKS[taskPlace].question;
  $home('stationTask').textContent=taskText;
  $home('stationTaskLink').href=mapUrl(taskPlace)+'&walk=1';
  $home('stationNo').textContent=String(Object.keys(stations).indexOf(id)+1).padStart(2,'0');
  $home('stationName').textContent=p.region;
  $home('stationKeyword').textContent='地方文献展';
  const picture=districtPictures[id]||['../../v3/assets/hero-860.webp','江海阅潮生 · 地方文献展主视觉'];$home('stationPhoto').hidden=false;
  if(picture){$home('stationPhotoImage').src='../assets/scenic/'+picture[0];$home('stationPhotoImage').alt=picture[1];$home('stationPhotoCaption').textContent=picture[1];}
  const credits={"rugao": ["https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:%E6%B0%B4%E7%BB%98%E5%9B%AD.jpg"], "haian": ["https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:%E9%9D%92%E5%A2%A9%E9%81%97%E5%9D%80.jpg"]};
  if(credits[id]?.length){const link=document.createElement('a');link.href=credits[id][1];link.textContent=' · 原图';const license=document.createElement('a');license.href=credits[id][0];license.textContent=' · 许可';$home('stationPhotoCaption').append(link,license);}
  $home('stationPoems').textContent=entries.length;$home('stationStatus').textContent=new Set(entries.map(r=>r.title)).size;
  $home('stationNote').textContent=p.description.split('。')[0]+'。';
  $home('stationFeature').onclick=()=>location.assign(mapUrl(p.id));
  $home('stationOpen').onclick=()=>location.assign(regionUrl(id));
  $home('storyTitle').textContent='从'+p.region+'读起';$home('storyType').textContent=p.name;
  $home('storyTrace').textContent=p.description.split('。').slice(0,2).join('。')+'。';
  $home('storyToday').textContent='《'+p.title+'》'+(p.pages?' · '+p.pages:'');
  $home('storyPlaces').replaceChildren(...entries.map(r=>{const a=document.createElement('a');a.href=mapUrl(r.id);a.textContent=r.name;return a;}));
  $home('storyRelation').textContent='资料据《参展图书目录增补完善修订版》。';
}
document.querySelectorAll('[data-entrance-station]').forEach(a=>a.onclick=()=>selectStation(a.dataset.entranceStation));
document.querySelectorAll('[data-station]').forEach(n=>{
  n.onclick=()=>selectStation(n.dataset.station);
  if(n instanceof SVGElement)n.onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();selectStation(n.dataset.station);}};
});
$home('todayBtn').onclick=()=>selectStation(Object.keys(stations)[Math.floor(Math.random()*7)]);
$home('searchJump').onclick=()=>location.assign('exhibit.html#search');
const routes={city:[50,51,42],haimen:[2,1,3],coast:[45,49,48]};
const pictures={city:['langshan.webp','狼山'],haimen:['zhangjian-memorial.webp','张謇纪念馆'],coast:['public/nantong-museum-historical-building.jpg','南通博物苑']};
function selectRoute(id){
  const entries=routes[id].map(n=>catalogue[n-1]),p=entries[0],pic=pictures[id];
  for(const b of document.querySelectorAll('[data-guide]')){const active=b.dataset.guide===id;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));}
  $home('guideTitle').textContent=p.name;$home('guideDescription').textContent=p.description.split('。').slice(0,2).join('。')+'。';
  $home('guideImage').src='../assets/scenic/'+pic[0];$home('guideImage').alt=pic[1];$home('guideCaption').textContent=pic[1];$home('guideCredit').hidden=id!=='coast';$home('guideCredit').innerHTML="<div class=\"photo-credit\"><span>© Peter Potrowl</span><details><summary>图片来源</summary><div class=\"credit-links\"><a href=\"https://creativecommons.org/licenses/by/3.0\" target=\"_blank\" rel=\"noopener noreferrer\">CC BY 3.0</a> · <a href=\"https://commons.wikimedia.org/wiki/File:Nantong_Museum_-_historical_building_1.jpg\" target=\"_blank\" rel=\"noopener noreferrer\">Wikimedia Commons 原图</a></div></details></div>";
  $home('guideSteps').replaceChildren(...entries.map(r=>{const link=document.createElement('a');link.href=mapUrl(r.id);link.textContent=r.name;return link;}));
  $home('guidePlace').onclick=()=>location.assign(mapUrl(p.id));$home('guidePoem').onclick=()=>location.assign(regionUrl(p.area));
}
document.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>selectRoute(b.dataset.guide));
selectRoute('city');selectStation(selected);
const passportPhotos = new Set();
async function refreshVisitMarkers(){
  try{
    const records=await localRecord('visits','readonly','getAll'),keys=new Set(records.map(r=>r.key));
    const notes=(await localRecord('observations','readonly','getAll')).filter(r=>catalogue.some(p=>p.id===r.id));
    $home('visitCount').textContent=Object.keys(stations).filter(k=>keys.has(k)).length;
    const count=$home('observationCount');if(count)count.textContent=notes.length;
    $home('passportStamps').replaceChildren(...Object.values(stations).map(d=>{
      const b=document.createElement('button');b.className='passport-stamp'+(keys.has(d.id)?' visited':'');const mark=document.createElement('span');mark.className='passport-stamp-mark';mark.textContent=keys.has(d.id)?'已访':String(Object.keys(stations).indexOf(d.id)+1).padStart(2,'0');const name=document.createElement('strong');name.textContent=d.name;const label=document.createElement('small');label.textContent=keys.has(d.id)?'取消印章':'自记到访';b.append(mark,name,label);b.setAttribute('aria-pressed',String(keys.has(d.id)));
      b.onclick=async()=>{b.disabled=true;try{await localRecord('visits','readwrite',keys.has(d.id)?'delete':'put',keys.has(d.id)?d.id:{key:d.id,checkedAt:Date.now()});await refreshVisitMarkers();}finally{b.disabled=false;}};return b;
    }));
    for (const url of passportPhotos) URL.revokeObjectURL(url);
    passportPhotos.clear();
    $home('passportNotes').replaceChildren(...notes.map(r=>{
      const card=document.createElement('article');
      card.className='passport-observation';
      const place=catalogue.find(p=>p.id===r.id);
      const link=document.createElement('a');
      link.href=mapUrl(r.id)+'&note=1';
      link.textContent=place.region+' · '+place.name;
      const note=document.createElement('p');
      note.textContent=r.note;
      card.append(link,note);
      if(r.photo instanceof Blob && r.photo.type.startsWith('image/')){
        const photo=document.createElement('img');
        photo.loading='lazy';
        photo.alt=place.name+' · 我的走读照片';
        photo.src=URL.createObjectURL(r.photo);
        passportPhotos.add(photo.src);
        card.append(photo);
      }
      return card;
    }));
    if(!notes.length)$home('passportNotes').textContent='在地点详情中填写观察卡，保存后可在这里重读。';
  }catch{$home('passportStamps').textContent='当前浏览器未启用本机记录。';}
}
refreshVisitMarkers();
window.addEventListener('pageshow',()=>refreshVisitMarkers());

const worksList=$home('worksList');
for(const [placeId,[title,,creator,teacher]] of window.JIANGHAI_FILMS){
  const place=catalogue.find(p=>p.id===placeId);
  const link=document.createElement('a');
  link.href=mapUrl(placeId);
  const heading=document.createElement('strong');
  heading.textContent='《'+title+'》';
  const location=document.createElement('span');
  location.textContent=place.region+' · '+place.name;
  const credit=document.createElement('small');
  credit.textContent='制作 '+creator+'　指导 '+teacher;
  link.append(heading,location,credit);
  worksList.append(link);
}

// A reading stop in each district, with the quotation reproduced in its catalogue entry.
const trailReadings = [
  ['catalog-43','《题大生纱厂》题联','乐工兴事，厚其生谓生。'],
  ['catalog-05','《第三纺织厂开工祀土礼成有作》','十千吉贝资维耦，五万飞轳跂报章。'],
  ['catalog-07','《过排河观》','钟声随鸟远，河势趁林回。'],
  ['catalog-23','《盆松》','青苍一撮土，蟠郁百年根。'],
  ['catalog-24','《沈堤》','堤下潮痕堤上草，未妨早晚有高低。'],
  ['catalog-31','《过太平桥》','林月濛濛天影压，岸风飒飒涨痕消。'],
  ['catalog-40','《垦牧乡小学校歌》','新世界，垦牧乡。新少年，小学生。']
];
const trailSelect = $home('trail-place');
const trailDraft = $home('trail-copy-text');
const trailStatus = $home('trail-status');
const trailDrafts = new Map();
for (const [id] of trailReadings) {
  const place = catalogue.find(item => item.id === id);
  trailSelect.add(new Option(place.region + ' · ' + place.name, id));
}
function showTrailStop() {
  const id = trailSelect.value;
  const place = catalogue.find(item => item.id === id);
  const [, work, quote] = trailReadings.find(row => row[0] === id);
  $home('trail-verse').textContent = '“' + quote + '”　' + work;
  $home('trail-read').href = mapUrl(id);
  $home('trail-map').href = regionUrl(place.area);
  $home('trail-note').href = mapUrl(id) + '&note=1';
  trailDraft.value = trailDrafts.get(id) ?? (place.region + ' · ' + place.name + '\n“' + quote + '”——张謇' + work + '\n展表所列书目：《' + place.title + '》' + (place.pages ? '，' + place.pages : ''));
  trailStatus.textContent = '';
}
const returnStop = new URLSearchParams(location.search).get('trail');
if (trailReadings.some(([id]) => id === returnStop)) trailSelect.value = returnStop;
trailSelect.addEventListener('change', showTrailStop);
trailDraft.oninput = () => trailDrafts.set(trailSelect.value, trailDraft.value);
$home('trail-share-link').onclick = event => {
  event.preventDefault();
  $home('trail-share').open = true;
  trailDraft.focus();
};
$home('trail-add-note').onclick = async () => {
  const id = trailSelect.value;
  try {
    const saved = await localRecord('observations','readonly','get',id);
    if (id !== trailSelect.value) return;
    if (!saved?.note) { trailStatus.textContent = '这站还没有笔记。点「观察」填写并保存后，就能加入分享稿。'; return; }
    const passage = '我的现场观察：' + saved.note;
    if (!trailDraft.value.includes(passage)) trailDraft.value += '\n' + passage;
    trailDrafts.set(id, trailDraft.value);
    trailStatus.textContent = '笔记已加入草稿，可编辑后复制。';
  } catch { trailStatus.textContent = '当前浏览器无法读取本机笔记，可以直接填写分享文字。'; }
};
$home('trail-copy').onclick = async () => {
  try { await navigator.clipboard.writeText(trailDraft.value); trailStatus.textContent = '文字已复制，可以发给朋友。'; }
  catch { trailDraft.focus(); trailDraft.select(); trailStatus.textContent = '已选中文字，请使用系统的复制操作。'; }
};
showTrailStop();
