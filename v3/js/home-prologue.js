(() => {
  const gallery = document.getElementById('prologue-gallery');
  if (!gallery) return;

  const titles = [
    '跟着状元公张謇游南通', '江海有情，南通有请', '没有他，就没有今天的南通',
    '敢为人先：张謇的十个全国第一', '一城四味，跟着状元公张謇游南通',
    '崇川 · 主城文博', '海门 · 状元故里', '通州 · 盐河古镇',
    '如皋 · 名园长寿', '如东 · 海堤牧渔', '海安 · 江海文脉', '启东 · 日出海港',
    '唐闸工业遗存', '南通博物苑', '张謇纪念馆', '南通江岸', '啬园',
    '沿海风光与垦牧记忆', '颐生酒厂的历史文化', '烽烟江海，红色足迹', '奇案探秘，长寿福地',
    '南通美食', '风物入诗', '退翁榭食鱼，三味入诗', '一桌江海风味', '老街小吃',
    '三天两晚游南通', '南通一年四季怎么玩', '非遗手作', '江海特产', '南通，等你来悦读'
  ];
  const image = document.getElementById('prologue-image');
  const imageButton = document.getElementById('prologue-slide');
  const pageNumber = document.getElementById('prologue-page');
  const play = document.getElementById('prologue-play');
  const status = document.getElementById('prologue-announcement');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let requested = 0;
  let requestId = 0;
  let timer;
  let playing = !reducedMotion.matches;
  let visible = true;

  const pathFor = (i) => 'assets/prologue/slides/slide-' + String(i + 1).padStart(2, '0') + '.webp';
  const wrap = (i) => (i + titles.length) % titles.length;

  function updatePlay() {
    play.innerHTML = playing ? 'Ⅱ <span>暂停</span>' : '▶ <span>播放</span>';
    play.setAttribute('aria-label', playing ? '暂停自动播放' : '开始自动播放');
  }

  function schedule() {
    clearTimeout(timer);
    const opening = document.documentElement.classList.contains('intro') &&
      !document.documentElement.classList.contains('intro-done');
    if (playing && visible && !document.hidden && !opening) {
      timer = setTimeout(() => show(index + 1, false), 8000);
    }
  }

  function preload(i) {
    const next = new Image();
    next.src = pathFor(wrap(i));
  }

  async function show(nextIndex, manual) {
    clearTimeout(timer);
    requested = wrap(nextIndex);
    const target = requested;
    const thisRequest = ++requestId;
    const next = new Image();
    next.src = pathFor(target);
    try {
      await next.decode();
    } catch {
      if (thisRequest !== requestId) return;
      requested = index;
      status.textContent = '图片未载入，请再次翻页。';
      schedule();
      return;
    }
    if (thisRequest !== requestId) return;
    index = target;
    image.src = next.src;
    image.alt = titles[index];
    pageNumber.textContent = (index + 1) + ' / ' + titles.length;
    if (manual) status.textContent = '第 ' + (index + 1) + ' 页，' + titles[index];
    preload(index + 1);
    schedule();
  }

  imageButton.addEventListener('click', () => show(requested + 1, true));
  document.getElementById('prologue-prev').addEventListener('click', () => show(requested - 1, true));
  document.getElementById('prologue-next').addEventListener('click', () => show(requested + 1, true));
  play.addEventListener('click', () => {
    playing = !playing;
    updatePlay();
    schedule();
  });
  gallery.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    show(requested + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { threshold: 0.15 }).observe(imageButton);
  }
  const introObserver = new MutationObserver(schedule);
  introObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  reducedMotion.addEventListener('change', (event) => {
    playing = !event.matches;
    updatePlay();
    schedule();
  });
  updatePlay();
  preload(1);
  schedule();
})();
