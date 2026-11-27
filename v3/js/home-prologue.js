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
  const status = document.getElementById('prologue-announcement');
  const viewer = document.getElementById('prologue-viewer');
  const openViewerButton = document.getElementById('prologue-open');
  const viewerImage = document.getElementById('prologue-viewer-image');
  const viewerStage = document.getElementById('prologue-viewer-stage');
  const viewerPage = document.getElementById('prologue-viewer-page');
  const prev = document.getElementById('prologue-viewer-prev');
  const next = document.getElementById('prologue-viewer-next');
  let viewerIndex = 0;
  let viewerRequested = 0;
  let viewerRequestId = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let requested = 0;
  let requestId = 0;
  let timer;
  let visible = true;

  const pathFor = (i) => 'assets/prologue/slides/slide-' + String(i + 1).padStart(2, '0') + '.webp';
  const wrap = (i) => (i + titles.length) % titles.length;

  function schedule() {
    clearTimeout(timer);
    const opening = document.documentElement.classList.contains('intro') &&
      !document.documentElement.classList.contains('intro-done');
    if (!reducedMotion.matches && visible && !document.hidden && !opening && !viewer.open) {
      timer = setTimeout(() => show(index + 1, false), 3000);
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
    if (manual) status.textContent = '第 ' + (index + 1) + ' 页，' + titles[index];
    preload(index + 1);
    schedule();
  }

  function updateViewer() {
    viewerPage.textContent = (viewerIndex + 1) + ' / ' + titles.length;
    const focused = document.activeElement;
    prev.disabled = viewerIndex === 0;
    next.disabled = viewerIndex === titles.length - 1;
    if ((focused === prev && prev.disabled) || (focused === next && next.disabled)) {
      viewerStage.focus({ preventScroll: true });
    }
    viewerStage.setAttribute('aria-label', next.disabled ? '已到最后一页' : '点击图片查看下一页');
  }

  async function showViewer(nextIndex) {
    viewerRequested = Math.max(0, Math.min(nextIndex, titles.length - 1));
    if (viewerRequested === viewerIndex) {
      ++viewerRequestId;
      return;
    }
    const target = viewerRequested;
    const thisRequest = ++viewerRequestId;
    const upcoming = new Image();
    upcoming.src = pathFor(target);
    try {
      await upcoming.decode();
    } catch {
      if (thisRequest === viewerRequestId) {
        viewerRequested = viewerIndex;
        viewerPage.textContent = '图片未载入，请重试';
      }
      return;
    }
    if (thisRequest !== viewerRequestId || !viewer.open) return;
    viewerIndex = target;
    viewerImage.src = upcoming.src;
    viewerImage.alt = titles[target];
    updateViewer();
    if (target < titles.length - 1) preload(target + 1);
  }

  function openViewer() {
    if (viewer.open) return;
    clearTimeout(timer);
    // Cancel an in-flight automatic change before entering manual reading.
    ++requestId;
    requested = index;
    ++viewerRequestId;
    viewerIndex = viewerRequested = 0;
    viewerImage.src = pathFor(0);
    viewerImage.alt = titles[0];
    updateViewer();
    viewer.showModal();
    preload(1);
  }

  openViewerButton.addEventListener('click', openViewer);
  document.getElementById('prologue-viewer-close').addEventListener('click', () => viewer.close());
  viewerStage.addEventListener('click', () => showViewer(viewerRequested + 1));
  prev.addEventListener('click', () => showViewer(viewerRequested - 1));
  next.addEventListener('click', () => showViewer(viewerRequested + 1));
  document.addEventListener('keydown', (event) => {
    if (!viewer.open || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? titles.length - 1 :
      viewerRequested + (event.key === 'ArrowRight' ? 1 : -1);
    showViewer(target);
  });
  viewer.addEventListener('close', () => {
    ++viewerRequestId;
    openViewerButton.focus({ preventScroll: true });
    schedule();
  });
  if (typeof viewer.showModal === 'function') openViewerButton.hidden = false;

  imageButton.addEventListener('click', () => show(requested + 1, true));
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
  reducedMotion.addEventListener('change', schedule);
  preload(1);
  schedule();
})();
