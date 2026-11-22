(() => {
  'use strict';
  const readings = new Map(Object.values(window.JIANGHAI_POEM_READINGS).flat().map(p => [p.title, p]));
  const media = new Map(window.JIANGHAI_POETRY_MEDIA.map(p => [p.title, p]));
  const titles = new Set([...media.keys(), ...readings.keys()]);
  const works = [...titles].map(title => {
    const reading = readings.get(title) || {};
    const work = { ...media.get(title), ...reading, title };
    if (reading.pictures) {
      work.art = reading.pictures.map(([file, alt]) => ['assets/poem-readings/' + file + '.webp', alt]);
    }
    if (reading.podcast) {
      const [file, caption] = reading.podcast;
      work.talk = ['assets/poem-readings/' + file + '.mp3', caption];
    }
    return work;
  });
  for (const clip of window.JIANGHAI_CHRONICLES) {
    const path = 'assets/poetry-library/' + clip.file;
    works.push({ title: clip.title, chronicle: true, description: clip.description,
      films: [{ src: path+'.mp4', poster: path+'.jpg', label: clip.title }] });
  }
  const byTitle = new Map(works.map(work => [work.title, work]));
  const query = document.querySelector('#library-query');
  const format = document.querySelector('#library-format');
  const list = document.querySelector('#library-titles');
  const reader = document.querySelector('#reader');
  const count = document.querySelector('#result-count');
  let current;
  reader.addEventListener('play', event => {
    for (const control of reader.querySelectorAll('audio,video')) {
      if (control !== event.target) control.pause();
    }
  }, true);

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  }

  function notes(group, paragraphs) {
    if (!paragraphs?.length) return;
    const details = element('details');
    details.append(element('summary', group));
    for (const paragraph of paragraphs) details.append(element('p', paragraph));
    reader.append(details);
  }

  function player(tag, src, caption, poster) {
    const figure = element('figure');
    const control = element(tag);
    control.controls = true;
    control.preload = 'none';
    control.src = src;
    control.setAttribute('aria-label', caption);
    if (poster) control.poster = poster;
    if (tag === 'video') control.playsInline = true;
    figure.append(element('figcaption', caption), control);
    reader.append(figure);
  }

  function picture(src, alt) {
    const image = element('img');
    image.src = src;
    image.alt = alt;
    image.loading = 'lazy';
    const link = element('a');
    link.href = src;
    link.append(image);
    const figure = element('figure');
    figure.append(link);
    reader.append(figure);
  }

  function show(work) {
    if (current === work && reader.hasChildNodes()) return;
    current = work;
    reader.querySelectorAll('audio,video').forEach(control => control.pause());
    reader.replaceChildren();
    if (!work) {
      reader.append(element('p', '没有找到相符的作品。可更换关键词或呈现形式。'));
      return;
    }
    reader.append(element('h2', work.title));
    if (work.selection) reader.append(element('p', work.selection));
    if (work.lines?.length) {
      const verse = element('div');
      verse.className = 'library-verse';
      for (const line of work.lines) verse.append(element('div', line));
      reader.append(verse);
    }
    if (work.description) reader.append(element('p', work.description));
    if (work.source) reader.append(element('p', work.source));
    if (work.audio) {
      reader.append(element('h3', '诗歌朗读'));
      player('audio', work.audio, '《' + work.title + '》朗读');
    }
    if (work.talk) {
      reader.append(element('h3', '播客'));
      player('audio', ...work.talk);
    }
    if (work.films?.length) {
      reader.append(element('h3', work.chronicle ? '年谱影像' : '视频'));
      for (const film of work.films) {
        const caption = [film.label, film.credit].filter(Boolean).join(' · ');
        player('video', film.src, caption, film.poster);
      }
    }
    if (work.art?.length) {
      reader.append(element('h3', '诗画配图'));
      for (const [src, alt] of work.art) picture(src, alt);
    }
    if (work.graph) {
      reader.append(element('h3', '诗歌关系图'));
      picture(work.graph, '《' + work.title + '》关系图');
    }
    if (work.note) notes('阅读提示', [work.note]);
    notes('《张謇诗画人生》选注', work.bookNotes);
    const annotations = Object.entries(work.annotations || {}).filter(([group]) => group !== '创作背景');
    if (annotations.length) reader.append(element('h3', '项目阅读札记'));
    for (const [group, paragraphs] of annotations) notes(group, paragraphs);
  }

  function hashTitle() {
    try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
  }

  function update(preferred) {
    const term = query.value.trim();
    const filtered = works.filter(work => (!format.value || work[format.value]) &&
      (work.title.includes(term) || work.lines?.some(line => line.includes(term)) || work.description?.includes(term)));
    const selected = filtered.includes(preferred) ? preferred : filtered[0];
    const chronicleCount = filtered.filter(work => work.chronicle).length;
    const poemCount = filtered.length - chronicleCount;
    count.textContent = filtered.length ? [
      poemCount && poemCount+' 个诗歌篇目', chronicleCount && chronicleCount+' 段年谱影像'
    ].filter(Boolean).join(' · ') : '没有找到相符的作品';
    const fragment = document.createDocumentFragment();
    for (const work of filtered) {
      const link = element('a', work.title);
      link.href = '#' + encodeURIComponent(work.title);
      if (work === selected) link.setAttribute('aria-current', 'true');
      fragment.append(link);
    }
    list.replaceChildren(fragment);
    show(selected);
  }

  function search() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    update(current);
  }

  function navigate() {
    const requested = byTitle.get(hashTitle());
    if (requested && ![...list.children].some(link => link.textContent === requested.title)) {
      query.value = '';
      format.value = '';
    }
    update(requested);
  }

  list.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    update(byTitle.get(link.textContent));
    reader.focus({ preventScroll: true });
    if (window.matchMedia('(max-width:720px)').matches) reader.scrollIntoView({ block: 'start' });
  });
  window.addEventListener('hashchange', navigate);
  query.addEventListener('input', search);
  format.addEventListener('change', search);
  navigate();
})();
