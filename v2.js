// 漫游提案属于今日体验设计；不把现代景点写成诗歌的创作原址。
const tourGuides = {
  city: {
    kicker: '诗歌地点直接对应 × 今日同城延伸',
    title: '从狼山，读到一座城',
    description: '先在诗中读到狼山，再到今天的山水中寻找“江月白翻翻”。想继续走，可自选博物苑、濠河或商圈，给旅程一个不同的尾声。',
    steps: ['读《狼山三元宫近斥僧挽词》', '看狼山今日山水', '自选博物苑、濠河或商圈'],
    caveat: '',
    image: 'assets/scenic/langshan.webp',
    imageAlt: '狼山国家森林公园现代实景',
    caption: '今日狼山实景',
    credit: '',
    station: 'nantong',
    poem: 1,
    placeLabel: '查看城区地点',
    poemLabel: '读狼山诗'
  },
  haimen: {
    kicker: '同镇人文关联',
    title: '常乐慢读：从《盆松》到纪念馆',
    description: '《盆松》的地点记录与张謇纪念馆同在海门常乐镇。到馆看看松木、建筑和庭院，再带着眼前的细节读一遍诗。',
    steps: ['读《盆松》', '看张謇纪念馆的今日空间', '拍一处松、木构或庭院细节'],
    caveat: '纪念馆是今日人文景点；诗作的具体创作位置仍不推断。',
    image: 'assets/scenic/zhangjian-memorial.webp',
    imageAlt: '海门常乐镇张謇纪念馆现代实景',
    caption: '今日张謇纪念馆实景',
    credit: '',
    station: 'haimen',
    poem: 3,
    placeLabel: '查看纪念馆',
    poemLabel: '读《盆松》'
  },
  coast: {
    kicker: '吕四文本线索 × 启东沿海延伸',
    title: '读一场落日，去看今日海岸',
    description: '从吕四归途诗开始，去观察今日启东海岸的海天光影。照片摄于东部海堤观潮台，与吕四并非同一地点。',
    steps: ['读吕四归途诗', '看东部海堤的今日海景', '记录自己见到的光线与颜色'],
    caveat: '',
    image: 'assets/scenic/public/qidong-seawall-viewing-platform.jpg',
    imageAlt: '启东东部海堤观潮台现代实景',
    caption: '启东东部海堤观潮台 · Wangcheni97 / CC BY-SA 4.0',
    credit: '照片：Wangcheni97，CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:%E5%90%AF%E4%B8%9C%E5%B8%82%E4%B8%9C%E9%83%A8%E6%B5%B7%E5%A0%A4%E8%A7%82%E6%BD%AE%E5%8F%B0.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/4.0/',
    station: 'qidong',
    poem: 2,
    placeLabel: '查看启东地点',
    poemLabel: '读吕四诗'
  }
};

const guideImage = document.getElementById('guideImage');
const guideFallback = document.getElementById('guideImageFallback');
let selectedTourGuide = 'city';

guideImage.addEventListener('load', () => {
  guideImage.hidden = false;
  guideFallback.hidden = true;
});
guideImage.addEventListener('error', () => {
  guideImage.hidden = true;
  guideFallback.hidden = false;
});

function selectTourGuide(key) {
  const guide = tourGuides[key];
  if (!guide) return;
  selectedTourGuide = key;
  document.querySelectorAll('.guide-option').forEach(button => {
    const active = button.dataset.guide === key;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.getElementById('guideKicker').textContent = guide.kicker;
  document.getElementById('guideTitle').textContent = guide.title;
  document.getElementById('guideDescription').textContent = guide.description;
  const caveat = document.getElementById('guideCaveat');
  caveat.hidden = !guide.caveat;
  caveat.textContent = guide.caveat;
  document.getElementById('guideCaption').textContent = guide.caption;
  const credit = document.getElementById('guideCredit');
  credit.hidden = !guide.photoSource;
  credit.replaceChildren(document.createTextNode(guide.credit));
  if (guide.photoSource) {
    const sourceLink = document.createElement('a');
    sourceLink.href = guide.photoSource;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = '原图';
    const licenseLink = document.createElement('a');
    licenseLink.href = guide.license;
    licenseLink.target = '_blank';
    licenseLink.rel = 'noopener noreferrer';
    licenseLink.textContent = '许可';
    credit.append(' · ', sourceLink, ' · ', licenseLink);
  }
  document.getElementById('guidePlace').textContent = guide.placeLabel;
  document.getElementById('guidePoem').textContent = guide.poemLabel;
  guideFallback.hidden = true;
  guideImage.hidden = false;
  guideImage.alt = guide.imageAlt;
  guideImage.src = guide.image;
  if (guideImage.complete && !guideImage.naturalWidth) {
    guideImage.hidden = true;
    guideFallback.hidden = false;
  }
  const steps = document.getElementById('guideSteps');
  steps.replaceChildren();
  guide.steps.forEach((line, index) => {
    const row = document.createElement('div');
    row.className = 'guide-step';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('b');
    label.textContent = line;
    row.append(number, label);
    steps.append(row);
  });
}

document.querySelectorAll('.guide-option').forEach(button => {
  button.addEventListener('click', () => selectTourGuide(button.dataset.guide));
});
document.getElementById('guidePlace').addEventListener('click', () => {
  const key = tourGuides[selectedTourGuide].station;
  setStation(key);
  openStation(key);
});
document.getElementById('guidePoem').addEventListener('click', () => {
  openPoem(tourGuides[selectedTourGuide].poem);
});
selectTourGuide('city');

let passportRenderId = 0;
async function renderTourPassport() {
  const currentRender = ++passportRenderId;
  const stampGrid = document.getElementById('passportStamps');
  const notesBox = document.getElementById('passportNotes');
  try {
    const [visits, observations] = await Promise.all([
      localRecord('visits', 'readonly', 'getAll'),
      localRecord('observations', 'readonly', 'getAll')
    ]);
    if (currentRender !== passportRenderId) return;
    const visitedKeys = new Set(visits.filter(item => item && stations[item.key]).map(item => item.key));
    const savedNotes = observations.filter(item => item && poems.some(poem => poem.id === item.id) && typeof item.note === 'string' && item.note.trim());
    document.getElementById('visitCount').textContent = String(visitedKeys.size);
    document.getElementById('observationCount').textContent = String(savedNotes.length);
    stampGrid.replaceChildren();
    Object.entries(stations).forEach(([key, station]) => {
      const visited = visitedKeys.has(key);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'passport-stamp' + (visited ? ' visited' : '');
      button.setAttribute('aria-label', `${station.name}，${visited ? '已自记到访' : '尚未自记到访'}；打开地点卡`);
      const mark = document.createElement('span');
      mark.className = 'passport-stamp-mark';
      mark.textContent = visited ? '已访' : station.no;
      const name = document.createElement('strong');
      name.textContent = station.name;
      const status = document.createElement('small');
      status.textContent = visited ? '个人行旅记录' : '点开这一站';
      button.append(mark, name, status);
      button.addEventListener('click', () => {
        setStation(key);
        openStation(key);
      });
      stampGrid.append(button);
    });
    notesBox.replaceChildren();
    if (!savedNotes.length) {
      const empty = document.createElement('p');
      empty.textContent = '保存一首诗的观察后，会在这里出现。';
      notesBox.append(empty);
      return;
    }
    const list = document.createElement('div');
    list.className = 'passport-notes-list';
    savedNotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 3).forEach(record => {
      const poem = poems.find(item => item.id === record.id);
      const button = document.createElement('button');
      button.className = 'passport-note';
      button.type = 'button';
      const title = document.createElement('b');
      title.textContent = `《${poem.title}》`;
      const excerpt = document.createElement('span');
      excerpt.textContent = record.note.trim();
      button.append(title, excerpt);
      button.addEventListener('click', () => {
        openPoem(poem.id);
        showPoemView('activity');
      });
      list.append(button);
    });
    notesBox.append(list);
  } catch {
    if (currentRender !== passportRenderId) return;
    document.getElementById('visitCount').textContent = '—';
    document.getElementById('observationCount').textContent = '—';
    stampGrid.replaceChildren();
    const message = document.createElement('p');
    message.className = 'passport-loading';
    message.textContent = '当前浏览器无法读取本机护照；诗歌和地点仍可正常浏览。';
    stampGrid.append(message);
    notesBox.textContent = '请检查浏览器的隐私或存储设置。';
  }
}

const originalRefreshVisitMarkers = refreshVisitMarkers;
refreshVisitMarkers = async function () {
  await originalRefreshVisitMarkers();
  await renderTourPassport();
};
document.getElementById('poemDialog').addEventListener('close', renderTourPassport);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderTourPassport();
});
renderTourPassport();

document.querySelectorAll('.scenic-card img').forEach(image => {
  const showImageError = () => {
    const card = image.closest('.scenic-card');
    if (!card || card.classList.contains('photo-unavailable')) return;
    card.classList.add('photo-unavailable');
    image.hidden = true;
    const message = document.createElement('p');
    message.className = 'scenic-photo-error';
    message.textContent = '景点照片暂时无法加载，仍可阅读地点介绍。';
    card.prepend(message);
  };
  image.addEventListener('error', showImageError);
  if (image.complete && !image.naturalWidth) showImageError();
});
