// 七境终章：所有计算、图片制作与私人记录均留在当前浏览器。
(function () {
  'use strict';
  const core = globalThis.JourneyProfileCore;
  if (!core) return;
  const gate = document.getElementById('profileGate');
  const gateText = document.getElementById('profileGateText');
  const progressFill = document.getElementById('profileProgressFill');
  const entry = document.getElementById('profileEntry');
  const dialog = document.getElementById('profileDialog');
  const content = document.getElementById('profileContent');
  const status = document.getElementById('profileStatus');
  const shortcut = document.createElement('button');
  shortcut.type = 'button';
  shortcut.id = 'stationProfileShortcut';
  shortcut.className = 'ghost';
  shortcut.textContent = '七境已集齐 · 生成我的画像';
  shortcut.hidden = true;
  document.querySelector('.station-checkin').append(shortcut);

  let visits = [];
  let observations = [];
  let savedProfile = null;
  let selectedShare = null;
  let previewUrl = null;
  let fallbackUrl = null;
  let unlocked = false;
  let refreshId = 0;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const stationKeys = Object.keys(stations);
  const validObservation = record => record && poems.some(poem => poem.id === record.id) && typeof record.note === 'string' && record.note.trim();
  const typeById = id => core.types.find(type => type.id === id);
  const favoriteName = () => stations[savedProfile?.favoriteStation]?.name || '';
  const noteCount = () => observations.filter(validObservation).length;
  const setStatus = message => { status.textContent = message || ''; };
  function releasePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  function releaseFallback() {
    if (fallbackUrl) URL.revokeObjectURL(fallbackUrl);
    fallbackUrl = null;
  }
  function clearGeneratedPreview() {
    releaseFallback();
    document.getElementById('profileDownloadFallback')?.remove();
  }
  function profileIsValid(record) {
    return record && record.id === 'current' && stationKeys.includes(record.favoriteStation) && core.evaluate(record.answers);
  }

  async function refreshProfile() {
    const current = ++refreshId;
    try {
      const [visitRows, noteRows, record] = await Promise.all([
        localRecord('visits', 'readonly', 'getAll'),
        localRecord('observations', 'readonly', 'getAll'),
        localRecord('profiles', 'readonly', 'get', 'current')
      ]);
      if (current !== refreshId) return;
      const distinct = new Map(visitRows.filter(item => item && stationKeys.includes(item.key)).map(item => [item.key, item]));
      visits = [...distinct.values()];
      observations = noteRows.filter(validObservation);
      savedProfile = profileIsValid(record) ? record : null;
      unlocked = visits.length === stationKeys.length;
      gate.classList.toggle('is-ready', unlocked);
      progressFill.style.width = `${Math.round(visits.length / stationKeys.length * 100)}%`;
      gateText.textContent = unlocked
        ? savedProfile ? '七境印章已集齐。你的江海画像保存在这个浏览器里，可随时重看或重测。' : '七境印章已集齐。用四个轻巧的选择，给这次旅程留下一张专属画像。'
        : `已自记 ${visits.length} / ${stationKeys.length} 境；再收集 ${stationKeys.length - visits.length} 枚印章，就能解锁画像。`;
      entry.hidden = !unlocked;
      entry.textContent = savedProfile ? '查看我的江海画像' : '生成我的江海画像';
      shortcut.hidden = !unlocked;
      shortcut.textContent = savedProfile ? '七境已集齐 · 查看我的画像' : '七境已集齐 · 生成我的画像';
      if (!unlocked && dialog.open) dialog.close();
    } catch {
      if (current !== refreshId) return;
      unlocked = false;
      gateText.textContent = '当前浏览器无法读取本机护照，暂时不能核对七境或生成画像。请检查存储设置；若同时开着旧版预览，请关闭后刷新。其他内容仍可浏览。';
      progressFill.style.width = '0%';
      entry.hidden = true;
      shortcut.hidden = true;
      if (dialog.open) dialog.close();
    }
  }

  const previousRefreshVisitMarkers = refreshVisitMarkers;
  refreshVisitMarkers = async function () {
    await previousRefreshVisitMarkers();
    await refreshProfile();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshProfile(); });
  document.getElementById('poemDialog').addEventListener('close', refreshProfile);
  refreshProfile();

  async function openProfile() {
    await refreshProfile();
    if (!unlocked) return;
    selectedShare = null; // 私人素材只在本次主动确认后加入，刷新或重开都恢复默认。
    releasePreview();
    clearGeneratedPreview();
    setStatus('');
    if (savedProfile) renderResult();
    else renderQuiz();
    dialog.showModal();
  }
  entry.addEventListener('click', openProfile);
  shortcut.addEventListener('click', () => {
    document.getElementById('stationDialog').close();
    document.getElementById('passport').scrollIntoView({ behavior: 'smooth' });
    openProfile();
  });
  document.getElementById('profileDialogClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { releasePreview(); clearGeneratedPreview(); selectedShare = null; });

  function renderQuiz() {
    content.replaceChildren();
    setStatus('');
    const form = make('form', 'profile-form');
    form.noValidate = true;
    core.questions.forEach((question, index) => {
      const fieldset = make('fieldset', 'profile-question');
      fieldset.append(make('legend', '', `${String(index + 1).padStart(2, '0')} / ${question.title}`));
      const options = make('div', 'profile-options');
      question.options.forEach(option => {
        const label = make('label', 'profile-option');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `profileQuestion${index}`;
        input.value = option.type;
        input.checked = savedProfile?.answers[index] === option.type;
        label.append(input, make('span', '', option.label));
        options.append(label);
      });
      fieldset.append(options);
      form.append(fieldset);
    });
    const favoriteLabel = make('label', 'profile-favorite', '七境里，你最想重访哪一站？');
    favoriteLabel.htmlFor = 'profileFavorite';
    const select = make('select', 'profile-select');
    select.id = 'profileFavorite';
    select.append(new Option('请选择一站', ''));
    stationKeys.forEach(key => select.append(new Option(stations[key].name, key)));
    select.value = savedProfile?.favoriteStation || '';
    form.append(favoriteLabel, select);
    const actions = make('div', 'profile-form-actions');
    const submit = make('button', 'primary', '查看我的江海画像');
    submit.type = 'submit';
    actions.append(submit);
    if (savedProfile) {
      const back = make('button', 'ghost', '返回原画像');
      back.type = 'button';
      back.addEventListener('click', renderResult);
      actions.append(back);
    }
    form.append(actions, make('p', 'profile-disclaimer', '这些选择只描述本次行旅偏好，不是心理测评；没有标准答案。'));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const answers = core.questions.map((_, index) => form.querySelector(`input[name="profileQuestion${index}"]:checked`)?.value || '');
      const missing = answers.findIndex(answer => !answer);
      if (missing !== -1) {
        setStatus(`请先选择第 ${missing + 1} 题。`);
        form.querySelector(`input[name="profileQuestion${missing}"]`)?.focus();
        return;
      }
      if (!stationKeys.includes(select.value)) {
        setStatus('请从七境中选出最想重访的一站。');
        select.focus();
        return;
      }
      const record = { id: 'current', profileVersion: 1, answers, favoriteStation: select.value, updatedAt: Date.now() };
      submit.disabled = true;
      setStatus('正在保存到当前浏览器…');
      try {
        await localRecord('profiles', 'readwrite', 'put', record);
        savedProfile = record;
        selectedShare = null;
        await refreshProfile();
        renderResult();
        setStatus('画像已保存在当前浏览器。分享图片默认不含私人观察。');
      } catch {
        setStatus('保存失败：当前浏览器无法写入本机记录。你的选择仍在页面上，可以稍后重试。');
        submit.disabled = false;
      }
    });
    content.append(form);
  }

  function renderResult() {
    if (!savedProfile) return renderQuiz();
    content.replaceChildren();
    setStatus('');
    const result = core.evaluate(savedProfile.answers);
    const type = typeById(result.primary);
    const card = make('article', 'profile-result-card');
    card.setAttribute('aria-label', '我的江海旅人画像结果');
    card.append(make('div', 'profile-result-kicker', '这一程的我'));
    card.append(make('h3', '', type.name));
    if (result.secondary) card.append(make('span', 'profile-secondary', `也带着${typeById(result.secondary).motif}的兴趣`));
    card.append(make('p', '', core.story(savedProfile, favoriteName(), noteCount())));
    const stamps = make('div', 'profile-stamp-row');
    stamps.setAttribute('aria-label', '七境个人自记印章');
    stationKeys.forEach(key => stamps.append(make('span', '', stations[key].name)));
    card.append(stamps);
    const next = make('div', 'profile-recommendation');
    next.append(make('b', '', '再读／再看'), document.createTextNode(type.next));
    card.append(next);
    content.append(card);
    const actions = make('div', 'profile-result-actions');
    const revisit = make('button', 'ghost', '打开推荐诗歌');
    revisit.type = 'button';
    revisit.addEventListener('click', () => { dialog.close(); openPoem(type.poemId); });
    const save = make('button', 'primary', '下载我的类型卡 PNG');
    save.type = 'button';
    save.addEventListener('click', () => downloadCard(save));
    const copy = make('button', 'ghost', '复制结果文字');
    copy.type = 'button';
    copy.addEventListener('click', copyResult);
    const retake = make('button', 'ghost', '重新选择');
    retake.type = 'button';
    retake.addEventListener('click', () => { selectedShare = null; releasePreview(); clearGeneratedPreview(); renderQuiz(); });
    const remove = make('button', 'ghost', '删除本机画像');
    remove.type = 'button';
    let armed = false;
    remove.addEventListener('click', async () => {
      if (!armed) { armed = true; remove.textContent = '再点一次，确认删除'; setStatus('只删除画像和四题答案；七境印章与诗歌观察会保留。'); return; }
      remove.disabled = true;
      try {
        await localRecord('profiles', 'readwrite', 'delete', 'current');
        savedProfile = null;
        selectedShare = null;
        await refreshProfile();
        renderQuiz();
        setStatus('本机画像已删除；七境印章与诗歌观察未删除。');
      } catch { remove.disabled = false; armed = false; remove.textContent = '删除本机画像'; setStatus('删除失败，请稍后重试。'); }
    });
    actions.append(revisit, save, copy, retake, remove);
    content.append(actions);
    renderPrivatePanel();
    const details = make('details', 'profile-explanation');
    details.append(make('summary', '', '这张画像如何生成？'), make('p', '', '七境印章只负责解锁；主类型按四题选择次数确定。并列时依次参考第四题、第一题。最想重访的站点和已存观察数量用于撰写本次行旅回顾，不用于推断人格。印章均为个人自记。'));
    content.append(details);
  }

  function renderPrivatePanel() {
    document.querySelector('.profile-private-panel')?.remove();
    releasePreview();
    const panel = make('section', 'profile-private-panel');
    panel.append(make('h4', '', '可选：让图片带上你的观察'));
    panel.append(make('p', '', '默认的 PNG 不含任何私人照片或观察原文。请先挑选、预览，再明确确认；卡片展示文字摘录与所选照片，只改变本次下载内容。'));
    const available = observations.filter(validObservation).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!available.length) {
      panel.append(make('p', '', '当前没有已保存的诗境观察；仍可下载不含私人内容的类型卡。'));
    } else {
      const label = make('label', 'profile-favorite', '选择一条本机观察');
      label.htmlFor = 'profilePrivateSelect';
      const select = make('select', 'profile-private-select');
      select.id = 'profilePrivateSelect';
      select.append(new Option('先不加入私人内容', ''));
      available.forEach(record => {
        const poem = poems.find(item => item.id === record.id);
        select.append(new Option(`《${poem.title}》${record.photo ? ' · 含照片' : ' · 文字'}`, String(record.id)));
      });
      const preview = make('div', 'profile-private-preview');
      preview.hidden = true;
      const actions = make('div', 'profile-private-actions');
      const inspect = make('button', 'ghost', '预览这条观察');
      inspect.type = 'button';
      const confirm = make('button', 'primary', '确认加入本次图片');
      confirm.type = 'button';
      confirm.hidden = true;
      const clear = make('button', 'ghost', '不加入私人内容');
      clear.type = 'button';
      clear.hidden = !selectedShare;
      const applied = make('p', 'profile-private-applied', '本次下载将加入所选观察；关闭画像后自动恢复为默认不加入。');
      applied.hidden = !selectedShare;
      inspect.addEventListener('click', () => {
        releasePreview();
        const record = available.find(item => String(item.id) === select.value);
        if (!record) { setStatus('请先选择一条观察，或保持默认的不加入状态。'); return; }
        preview.replaceChildren(make('strong', '', `《${poems.find(item => item.id === record.id).title}》`), make('span', '', record.note.trim()));
        if (record.photo instanceof Blob) {
          previewUrl = URL.createObjectURL(record.photo);
          const image = document.createElement('img');
          image.src = previewUrl;
          image.alt = '即将加入分享图片的个人现场照片';
          preview.append(image);
        }
        preview.hidden = false;
        confirm.hidden = false;
        confirm.dataset.id = String(record.id);
        setStatus('预览仅在本机显示；确认后才会加入本次下载的图片。');
      });
      select.addEventListener('change', () => {
        selectedShare = null;
        clearGeneratedPreview();
        preview.hidden = true;
        confirm.hidden = true;
        clear.hidden = true;
        applied.hidden = true;
        releasePreview();
        setStatus('已撤销上一条观察的分享确认；新选项须重新预览并确认。');
      });
      confirm.addEventListener('click', () => {
        selectedShare = available.find(item => String(item.id) === confirm.dataset.id) || null;
        if (!selectedShare) return;
        clearGeneratedPreview();
        clear.hidden = false;
        confirm.hidden = true;
        applied.hidden = false;
        setStatus('已选择一条私人观察。只有点击“下载我的类型卡”才会写入图片；网页不会上传它。');
      });
      clear.addEventListener('click', () => { selectedShare = null; clearGeneratedPreview(); select.value = ''; preview.hidden = true; confirm.hidden = true; clear.hidden = true; applied.hidden = true; releasePreview(); setStatus('已恢复默认：下载图片不含私人内容。'); });
      actions.append(inspect, confirm, clear);
      panel.append(label, select, preview, actions, applied);
      if (selectedShare) {
        select.value = String(selectedShare.id);
      }
    }
    document.querySelector('.profile-result-actions').after(panel);
  }

  async function copyResult() {
    const value = core.shareText(savedProfile, favoriteName(), noteCount());
    try {
      await navigator.clipboard.writeText(value);
      setStatus('结果文字已复制；不包含私人照片或观察原文。');
    } catch {
      let fallback = document.getElementById('profileCopyFallback');
      if (!fallback) {
        fallback = make('textarea', 'profile-copy-fallback');
        fallback.id = 'profileCopyFallback';
        fallback.readOnly = true;
        fallback.setAttribute('aria-label', '可手动复制的画像文字');
        document.querySelector('.profile-result-actions').after(fallback);
      }
      fallback.value = value;
      fallback.focus();
      fallback.select();
      setStatus('自动复制不可用；已选中下方文字，可以手动复制。');
    }
  }

  function wrapCanvas(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const lines = [];
    let line = '';
    for (const character of Array.from(text)) {
      if (character === '\n') {
        lines.push(line); line = '';
      } else if (ctx.measureText(line + character).width > maxWidth && line) {
        lines.push(line); line = character;
      } else line += character;
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      const characters = Array.from(visible[maxLines - 1]);
      while (characters.length && ctx.measureText(characters.join('') + '…').width > maxWidth) characters.pop();
      visible[maxLines - 1] = characters.join('') + '…';
    }
    visible.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
    return y + visible.length * lineHeight;
  }

  async function loadPersonalPhoto(blob) {
    if (!(blob instanceof Blob)) return null;
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      return image;
    } finally { URL.revokeObjectURL(url); }
  }

  async function drawCard(share) {
    await document.fonts?.ready;
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('当前浏览器无法制作图片');
    const result = core.evaluate(savedProfile.answers);
    const type = typeById(result.primary);
    const shade = ctx.createLinearGradient(0, 0, 1080, 1600);
    shade.addColorStop(0, '#edf5f0'); shade.addColorStop(.47, '#fffaf0'); shade.addColorStop(1, '#f1e7d8');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, 1080, 1600);
    ctx.strokeStyle = '#a9c2bf'; ctx.lineWidth = 3;
    for (let radius = 145; radius <= 410; radius += 88) { ctx.beginPath(); ctx.arc(995, 80, radius, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#c7bba9'; ctx.lineWidth = 2; ctx.strokeRect(48, 48, 984, 1504);
    ctx.fillStyle = '#a54632'; ctx.font = '700 27px "PingFang SC",sans-serif'; ctx.fillText('张謇诗路 · 南通漫游', 95, 122);
    ctx.fillStyle = '#52646b'; ctx.font = '24px "PingFang SC",sans-serif'; ctx.fillText('我的江海旅人画像 · 个人自记', 95, 174);
    ctx.fillStyle = '#173d4b'; ctx.font = '600 84px "Songti SC",serif'; ctx.fillText(type.name, 90, 290);
    ctx.fillStyle = '#945039'; ctx.font = '30px "PingFang SC",sans-serif';
    if (result.secondary) ctx.fillText(`也带着${typeById(result.secondary).motif}的兴趣`, 96, 347);
    ctx.fillStyle = '#2d5059'; ctx.font = '600 32px "Songti SC",serif'; ctx.fillText(`最想重访：${favoriteName()}`, 96, 423);
    ctx.fillStyle = '#344b52'; ctx.font = '30px "PingFang SC",sans-serif';
    wrapCanvas(ctx, core.story(savedProfile, favoriteName(), noteCount()), 96, 491, 888, 49, 6);
    ctx.fillStyle = '#9a523b'; ctx.font = '700 25px "PingFang SC",sans-serif'; ctx.fillText('七境印章 · 个人自记', 96, 805);
    stationKeys.forEach((key, index) => {
      const x = 96 + (index % 4) * 222, y = 841 + Math.floor(index / 4) * 70;
      ctx.fillStyle = '#f8ebdf'; ctx.fillRect(x, y, 198, 48);
      ctx.strokeStyle = '#ba866d'; ctx.strokeRect(x, y, 198, 48);
      ctx.fillStyle = '#95503b'; ctx.font = '23px "PingFang SC",sans-serif'; ctx.fillText(stations[key].name, x + 18, y + 33);
    });
    ctx.fillStyle = '#e6efeb'; ctx.fillRect(95, 1006, 890, 218);
    ctx.fillStyle = '#a54632'; ctx.fillRect(95, 1006, 8, 218);
    ctx.fillStyle = '#1b4552'; ctx.font = '700 31px "Songti SC",serif'; ctx.fillText('再读／再看', 128, 1054);
    ctx.fillStyle = '#334d54'; ctx.font = '27px "PingFang SC",sans-serif';
    wrapCanvas(ctx, type.next, 128, 1101, 818, 44, 3);
    if (share) {
      ctx.fillStyle = '#a54632'; ctx.font = '700 25px "PingFang SC",sans-serif'; ctx.fillText('我主动加入的一条当代观察摘录', 96, 1287);
      const photo = await loadPersonalPhoto(share.photo).catch(() => null);
      const noteWidth = photo ? 550 : 865;
      ctx.fillStyle = '#354e54'; ctx.font = '26px "PingFang SC",sans-serif';
      wrapCanvas(ctx, share.note.trim(), 96, 1335, noteWidth, 42, 4);
      if (photo) {
        const box = { x: 690, y: 1287, width: 282, height: 188 };
        const scale = Math.max(box.width / photo.width, box.height / photo.height);
        const drawWidth = photo.width * scale, drawHeight = photo.height * scale;
        ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.width, box.height); ctx.clip();
        ctx.drawImage(photo, box.x + (box.width - drawWidth) / 2, box.y + (box.height - drawHeight) / 2, drawWidth, drawHeight); ctx.restore();
      }
    }
    ctx.fillStyle = '#687477'; ctx.font = '22px "PingFang SC",sans-serif';
    ctx.fillText('本次行旅偏好 · 非心理测评 · 非景区到访认证', 96, 1520);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片生成失败')), 'image/png'));
  }

  async function downloadCard(button) {
    button.disabled = true;
    const share = selectedShare;
    const privatePanel = document.querySelector('.profile-private-panel');
    if (privatePanel) privatePanel.inert = true;
    setStatus('正在本机制作类型卡…');
    try {
      const blob = await drawCard(share);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `江海旅人画像-${typeById(core.evaluate(savedProfile.answers).primary).name}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setStatus(share ? '图片已在本机生成，包含你刚才明确选择的私人观察。' : '图片已在本机生成，不含私人照片或观察原文。');
      // 部分移动浏览器会显示图片而非自动下载，保留一个长按保存的后备入口。
      clearGeneratedPreview();
      fallbackUrl = URL.createObjectURL(blob);
      let fallback = document.getElementById('profileDownloadFallback');
      if (!fallback) {
        fallback = make('div', 'profile-download-fallback');
        fallback.id = 'profileDownloadFallback';
        document.querySelector('.profile-result-actions').after(fallback);
      }
      fallback.replaceChildren(make('p', '', '如果没有自动保存，可点击下方链接另存；手机也可长按预览图保存。'));
      const saveAgain = make('a', 'profile-save-again', '另存这张 PNG');
      saveAgain.href = fallbackUrl;
      saveAgain.download = link.download;
      fallback.append(saveAgain);
      const image = document.createElement('img'); image.src = fallbackUrl; image.alt = '刚生成的江海旅人画像 PNG';
      fallback.append(image);
    } catch (error) {
      setStatus(`${error.message || '图片生成失败'}；上方文字结果仍可查看或复制。`);
    } finally { button.disabled = false; if (privatePanel) privatePanel.inert = false; }
  }
})();
