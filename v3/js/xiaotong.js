(() => {
  'use strict';
  const scriptFolder = new URL('.', document.currentScript.src);
  const pageFolder = new URL('../', scriptFolder);
  const chatKey = 'xiaotong-demo-chat-v1';
  const positionKey = 'xiaotong-demo-position-v1';
  const avatarUrl = new URL('assets/xiaotong-wolf-avatar.png', pageFolder).href;
  const portrait = '<span class="xt-avatar" aria-hidden="true"><img src="' + avatarUrl +
    '" width="256" height="256" alt="" draggable="false"></span>';
  const starterPrompts = ['启东有半天，想看海', '如皋有什么非遗？', '《盆松》跟哪里有关？'];
  const greeting = { text: '你好，我是小通！今天想怎么逛南通？告诉我有多少时间、想去哪里，或者想看什么。', links: [] };
  const dataFiles = [
    ['JIANGHAI_CATALOG', 'data.js'], ['JIANGHAI_DISTRICTS', 'guide.js'],
    ['JIANGHAI_POEM_READINGS', 'poem-readings.js'], ['JIANGHAI_CULTURE', 'culture.js'],
    ['XiaotongGuide', 'xiaotong-guide.js']
  ];

  function read(store, key) {
    try { return JSON.parse(window[store].getItem(key)); } catch { return null; }
  }
  function write(store, key, value) {
    try {
      if (value === null) window[store].removeItem(key);
      else window[store].setItem(key, JSON.stringify(value));
    } catch { /* The guide also works with browser storage disabled. */ }
  }

  const widget = document.createElement('div');
  widget.className = 'xiaotong';
  widget.innerHTML =
    '<button type="button" class="xt-launcher" aria-label="打开小通导览" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home" aria-haspopup="dialog" aria-controls="xiaotong-chat" title="点开聊聊，按住可拖动">' +
      portrait + '<span class="xt-name">小通</span></button>' +
    '<dialog id="xiaotong-chat" class="xt-dialog" aria-labelledby="xt-title">' +
    '<header class="xt-header">' + portrait +
      '<div class="xt-heading"><h2 id="xt-title" tabindex="-1" autofocus>小通</h2><p>南通导览 · 站内资料演示</p></div>' +
      '<button type="button" class="xt-new">重开对话</button><button type="button" class="xt-close" aria-label="关闭小通导览">×</button></header>' +
    '<div class="xt-log" role="log" aria-label="导览对话" aria-live="polite" tabindex="0"></div>' +
    '<div class="xt-prompts" aria-label="可以问小通的问题"></div>' +
    '<form class="xt-form"><label class="xt-sr" for="xt-question">问小通</label>' +
      '<input id="xt-question" type="text" maxlength="150" placeholder="说说你想怎么玩…" enterkeyhint="send" autocomplete="off" required>' +
      '<button type="submit">发送</button></form></dialog>';
  document.body.append(widget);
  widget.querySelectorAll('.xt-avatar img').forEach(img => {
    const showFallback = () => {
      const parent = img.parentElement;
      if (!parent || parent.querySelector('.xt-avatar-fallback')) return;
      img.hidden = true;
      const badge = document.createElement('span');
      badge.className = 'xt-avatar-fallback';
      badge.textContent = '通';
      parent.append(badge);
    };
    img.addEventListener('error', showFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) showFallback();
  });

  const find = selector => widget.querySelector(selector);
  const launcher = find('.xt-launcher');
  const dialog = find('.xt-dialog');
  const launcherAvatar = launcher.querySelector('.xt-avatar');
  const chatAvatar = dialog.querySelector('.xt-avatar');
  const log = find('.xt-log');
  const prompts = find('.xt-prompts');
  const form = find('.xt-form');
  const input = find('#xt-question');
  const sendButton = form.querySelector('button');
  let current = read('sessionStorage', chatKey) || { context: {}, messages: [] };
  let placement = read('localStorage', positionKey);
  let loadPromise;
  let busy = false;
  let opener = launcher;
  let pagePlace = '';
  let companion;

  function loadGuide() {
    if (!loadPromise) {
      loadPromise = Promise.all(dataFiles.map(([global, filename]) => {
        if (window[global]) return Promise.resolve();
        return new Promise((resolve, reject) => {
          const tag = document.createElement('script');
          tag.src = new URL(filename, scriptFolder);
          tag.onload = resolve;
          tag.onerror = () => { tag.remove(); reject(new Error('未能读取导览资料')); };
          document.head.append(tag);
        });
      })).catch(error => { loadPromise = null; throw error; });
    }
    return loadPromise;
  }

  function create(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function showMessage(message) {
    const isUser = message.user;
    const row = create('div', 'xt-message' + (isUser ? ' is-user' : ''));
    row.append(create('span', 'xt-sr', isUser ? '你：' : '小通：'));
    row.append(create('p', 'xt-bubble', message.text));
    for (const link of message.links || []) {
      const card = create('a', 'xt-card');
      card.href = new URL(link.href, pageFolder);
      if (link.photo) {
        const photo = create('img', 'xt-thumb');
        photo.src = new URL(link.photo, pageFolder);
        photo.alt = '';
        photo.loading = 'lazy';
        photo.addEventListener('error', () => photo.remove(), { once: true });
        card.append(photo);
      }
      const caption = create('span', 'xt-card-caption');
      caption.append(create('small', '', link.detail), create('strong', '', link.label));
      const arrow = create('span', 'xt-arrow', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      card.append(caption, arrow);
      card.addEventListener('click', () => dialog.close());
      row.append(card);
    }
    log.append(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function remember(message) {
    current.messages = [...current.messages, message].slice(-24);
    write('sessionStorage', chatKey, current);
    showMessage(message);
  }

  function pageContext() {
    const raw = new URLSearchParams(location.hash.slice(1));
    return {
      place: pagePlace || raw.get('p'),
      area: raw.get('d') || document.querySelector('#districts [aria-pressed="true"]')?.dataset.region
    };
  }

  function updatePrompts(questions) {
    prompts.replaceChildren(...questions.map(question => {
      const button = create('button', '', question);
      button.type = 'button';
      button.addEventListener('click', () => send(question));
      return button;
    }));
  }

  function receiptPrompts(context) {
    if (context.place) return ['怎么去？', '附近吃什么？', '附近有什么非遗？'];
    if (context.area) return ['给我推荐一站', '附近吃什么？', '附近有什么非遗？'];
    return starterPrompts;
  }

  async function send(question) {
    const text = question.trim().slice(0, 150);
    if (!text || busy) return;
    busy = true;
    sendButton.disabled = true;
    find('.xt-new').disabled = true;
    input.value = '';
    remember({ user: true, text });
    const loading = showMessage({ text: '正在查站内资料…' });
    companion?.react('thinking');
    try {
      await loadGuide();
      const response = window.XiaotongGuide.answer(text, current.context, pageContext());
      current.context = response.context;
      loading.remove();
      remember({ text: response.text, links: response.links });
      updatePrompts(receiptPrompts(current.context));
      if (dialog.open) companion?.react('reply');
    } catch {
      loading.remove();
      remember({ text: '站内导览资料暂时没打开。可以重试，也可以直接逛七境地图。', links: [
        { label: '打开七境地图', detail: '地点、诗歌与出行', href: 'exhibit.html#map' }
      ] });
    } finally {
      busy = false;
      sendButton.disabled = false;
      find('.xt-new').disabled = false;
    }
  }

  function renderChat() {
    log.replaceChildren();
    showMessage(greeting);
    current.messages.forEach(showMessage);
    updatePrompts(receiptPrompts(current.context));
  }
  renderChat();
  const resetBtn = find('.xt-new');
  resetBtn.addEventListener('click', () => {
    const doReset = () => {
      current = { context: {}, messages: [] };
      write('sessionStorage', chatKey, null);
      form.reset();
      renderChat();
      find('#xt-title').focus();
      window.ZJPolish?.toast('已开启新对话');
    };
    if (current.messages.length > 0 && window.ZJPolish?.confirmDanger) {
      window.ZJPolish.confirmDanger(resetBtn, '再点确认重开', doReset);
    } else {
      doReset();
    }
  });
  find('.xt-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    companion?.show(launcherAvatar);
    if (opener.isConnected) opener.focus({ preventScroll: true });
  });
  form.addEventListener('submit', event => { event.preventDefault(); send(input.value); });

  function position(x, y) {
    const edge = 8;
    const limitX = Math.max(edge, window.innerWidth - launcher.offsetWidth - edge);
    const limitY = Math.max(edge, window.innerHeight - launcher.offsetHeight - edge);
    const left = Math.max(edge, Math.min(x, limitX));
    const top = Math.max(edge, Math.min(y, limitY));
    launcher.style.inset = top + 'px auto auto ' + left + 'px';
    return { x: left, y: top };
  }

  let drag = null;
  let suppressClick = false;
  launcher.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    const bounds = launcher.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top, moved: false };
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) {
      if (event.pointerType === 'mouse' && companion) {
        const bounds = launcherAvatar.getBoundingClientRect();
        companion.look((event.clientX - bounds.left) / bounds.width * 2 - 1,
          (event.clientY - bounds.top) / bounds.height * 2 - 1);
      }
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 7) return;
    drag.moved = true;
    launcher.classList.add('is-dragging');
    placement = position(drag.left + dx, drag.top + dy);
  });
  function endDrag(event) {
    if (drag?.id !== event.pointerId) return;
    suppressClick = drag.moved;
    if (drag.moved) write('localStorage', positionKey, placement);
    drag = null;
    launcher.classList.remove('is-dragging');
  }
  launcher.addEventListener('pointerup', endDrag);
  launcher.addEventListener('pointercancel', endDrag);
  launcher.addEventListener('lostpointercapture', endDrag);
  launcher.addEventListener('pointerleave', () => companion?.look(0, 0));
  function openChat(button = launcher) {
    if (dialog.open) return;
    opener = button;
    pagePlace = button.dataset.xtAsk || '';
    dialog.showModal();
    companion?.show(chatAvatar);
    companion?.react('hello');
    updatePrompts(pagePlace ? ['介绍一下这里', '这里怎么去？', '这里有什么非遗？'] : receiptPrompts(current.context));
    log.scrollTop = log.scrollHeight;
    loadGuide().catch(() => {});
  }
  launcher.addEventListener('click', event => {
    if (suppressClick && event.detail > 0) { suppressClick = false; return; }
    openChat();
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-xt-ask]');
    if (button) openChat(button);
  });
  launcher.addEventListener('keydown', event => {
    if (event.key === 'Home') {
      event.preventDefault();
      placement = null;
      launcher.style.removeProperty('inset');
      write('localStorage', positionKey, null);
      return;
    }
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const step = directions[event.key];
    if (!step) return;
    event.preventDefault();
    const bounds = launcher.getBoundingClientRect();
    placement = position(bounds.left + 20 * step[0], bounds.top + 20 * step[1]);
    write('localStorage', positionKey, placement);
  });

  function keepInView() {
    if (Number.isFinite(placement?.x) && Number.isFinite(placement?.y)) position(placement.x, placement.y);
  }
  function adaptToKeyboard() {
    const view = window.visualViewport;
    if (!view) return;
    dialog.style.setProperty('--xt-viewport-height', view.height + 'px');
    dialog.style.setProperty('--xt-keyboard-inset', Math.max(0, window.innerHeight - view.height - view.offsetTop) + 'px');
  }
  keepInView();
  adaptToKeyboard();
  window.addEventListener('resize', keepInView);
  window.visualViewport?.addEventListener('resize', adaptToKeyboard);
  window.visualViewport?.addEventListener('scroll', adaptToKeyboard);
  import(new URL('xiaotong-companion.mjs?v=dribble', scriptFolder).href)
    .then(({ makeCompanion }) => makeCompanion(launcherAvatar, chatAvatar, dialog))
    .then(result => {
      companion = result;
      companion?.react('hello');
    })
    .catch(() => { /* Keep the illustrated avatar and chat usable if 3D is unavailable. */ });
})();
