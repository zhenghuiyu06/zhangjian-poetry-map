(() => {
  'use strict';

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. 全站轻提示 Toast（可打断、自动收回）
  let toastEl = null;
  let toastTimer = null;
  function toast(message, duration = 2200) {
    if (!message) return;
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'zj-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.append(toastEl);
    }
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, duration);
  }

  // 2. 轻量内容切换过渡（不阻塞、可随时打断重触发）
  function animateSwap(el) {
    if (!el || reducedMotion()) return;
    el.classList.remove('fx-swap');
    // 强制一次轻量回流以重新触发动画
    void el.offsetWidth;
    el.classList.add('fx-swap');
  }

  // 3. 页内丝滑灯箱（查看大图 / 诗歌关系图，不打断正在播放的音频）
  let lightbox = null;
  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement('dialog');
    lightbox.className = 'zj-lightbox';
    lightbox.id = 'zj-lightbox';
    lightbox.setAttribute('aria-label', '图片预览');
    lightbox.innerHTML =
      '<div class="zj-lightbox-bar">' +
        '<span class="zj-lightbox-caption" id="zj-lightbox-caption"></span>' +
        '<div class="zj-lightbox-actions">' +
          '<button type="button" data-lb-zoom>放大查看</button>' +
          '<a target="_blank" rel="noopener" data-lb-raw>打开原图 ↗</a>' +
          '<button type="button" data-lb-close aria-label="关闭大图">关闭</button>' +
        '</div>' +
      '</div>' +
      '<div class="zj-lightbox-body"><img alt=""></div>';
    document.body.append(lightbox);

    const img = lightbox.querySelector('img');
    const zoomBtn = lightbox.querySelector('[data-lb-zoom]');
    const toggleZoom = () => {
      const zoomed = img.classList.toggle('is-zoomed');
      zoomBtn.textContent = zoomed ? '适合屏幕' : '放大查看';
    };
    img.addEventListener('click', toggleZoom);
    zoomBtn.addEventListener('click', toggleZoom);
    lightbox.querySelector('[data-lb-close]').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox || event.target.classList.contains('zj-lightbox-body')) {
        lightbox.close();
      }
    });
    return lightbox;
  }

  function openLightbox(src, caption = '') {
    if (!src) return;
    const dialog = ensureLightbox();
    const img = dialog.querySelector('img');
    const raw = dialog.querySelector('[data-lb-raw]');
    const zoomBtn = dialog.querySelector('[data-lb-zoom]');
    img.classList.remove('is-zoomed');
    zoomBtn.textContent = '放大查看';
    img.src = src;
    img.alt = caption || '大图预览';
    raw.href = src;
    dialog.querySelector('#zj-lightbox-caption').textContent = caption || '点击图片可缩放';
    if (!dialog.open) dialog.showModal();
  }

  // 4. 会丢东西的操作防误碰：两步确认（3.5秒后自动复原）
  function confirmDanger(button, confirmLabel, onConfirm) {
    if (!button) return;
    if (button.dataset.confirming === '1') {
      clearTimeout(Number(button.dataset.confirmTimer));
      delete button.dataset.confirming;
      delete button.dataset.confirmTimer;
      button.classList.remove('is-confirming');
      if (button.dataset.origLabel) button.textContent = button.dataset.origLabel;
      onConfirm();
      return;
    }
    button.dataset.origLabel = button.textContent;
    button.dataset.confirming = '1';
    button.classList.add('is-confirming');
    button.textContent = confirmLabel || '再点一次确认';
    const timer = setTimeout(() => {
      delete button.dataset.confirming;
      button.classList.remove('is-confirming');
      if (button.dataset.origLabel) button.textContent = button.dataset.origLabel;
    }, 3500);
    button.dataset.confirmTimer = String(timer);
  }

  // 5. 全站弹窗点击遮罩即可自然收回（按下去有回应，再按能收回）
  function enableBackdropClose() {
    document.addEventListener('click', event => {
      const target = event.target;
      if (target instanceof HTMLDialogElement && target.open) {
        const rect = target.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inside) target.close();
      }
    });
  }

  enableBackdropClose();

  window.ZJPolish = {
    toast,
    animateSwap,
    openLightbox,
    confirmDanger
  };
})();
