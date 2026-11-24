(() => {
  'use strict';

  const startingPoints = {
    haimen: ['01', '02', '04'],
    tongzhou: ['13', '07', '10'],
    rugao: ['15', '14', '23'],
    rudong: ['25', '24', '26'],
    haian: ['30', '33', '31'],
    qidong: ['41', '37', '36'],
    nantong: ['45', '42', '50']
  };
  const themes = {
    coast: { label: '江海风景', match: /海边|海岸|看海|观海|日出|滩涂|江景|看水|山水|风景|拍照/, area: 'qidong', places: ['41', '37', '25', '50', '42', '18'] },
    poetry: { label: '诗歌', match: /诗歌|读诗|诗句|读一首|朗读|跟着诗|诗画|诗路/, area: 'nantong', places: ['50', '07', '23', '01', '04', '10'] },
    museum: { label: '文博', match: /博物馆|博物苑|室内|下雨|雨天|考古|文博|展馆/, area: 'nantong', places: ['45', '48', '56', '54', '30', '02', '33', '36', '20'] },
    industry: { label: '实业足迹', match: /实业|纱厂|工业|垦牧|盐业|工厂/, area: 'nantong', places: ['43', '54', '05', '03', '36', '38', '26'] }
  };
  const aliases = {
    '张謇故里': '01', '常乐镇': '01', '余西': '13', '花木大世界': '23', '大豫垦区': '26',
    '青墩': '30', '吕四渔港': '37', '吕四': '37', '圆陀角': '41', '濠河': '42',
    '大生纱厂': '43', '博物苑': '45', '沈绣博物馆': '48', '狼山': '50', '蓝印花布博物馆': '56'
  };
  const photos = {
    'catalog-02': '../assets/scenic/zhangjian-memorial.webp',
    'catalog-42': '../assets/scenic/haohe-evening.jpg',
    'catalog-50': '../assets/scenic/langshan.webp'
  };

  const placeLink = place => ({
    label: place.name, detail: place.region + ' · 地点档案', href: 'exhibit.html#p=' + place.id,
    photo: photos[place.id]
  });
  const districtLink = (district, tab) => ({
    label: district ? district.name + (tab === 'food' ? '美食' : tab === 'heritage' ? '非遗' : '地点地图') : '七境诗歌地图',
    detail: '七境地图',
    href: 'exhibit.html#' + (district ? 'd=' + district.id + (tab ? '&tab=' + tab : '') : 'map')
  });
  const poemLink = poem => ({ label: '读《' + poem.title + '》', detail: '诗歌影音', href: 'poetry.html#' + encodeURIComponent(poem.title) });
  const duration = question => {
    if (/半小时|30\s*分钟/.test(question)) return { label: '半小时', stops: 1 };
    if (/半天/.test(question)) return { label: '半天', stops: 2 };
    if (/一天|全天|一整天/.test(question)) return { label: '一天', stops: 3 };
    const hours = question.match(/([1-8一二两三四五六七八])\s*(?:个)?小时/);
    if (!hours) return null;
    const count = Number(hours[1]) || '一二三四五六七八'.indexOf(hours[1].replace('两', '二')) + 1;
    return { label: count + ' 小时', stops: count === 1 ? 1 : count < 5 ? 2 : 3 };
  };

  function answer(question, previous, locationContext = {}) {
    const catalog = window.JIANGHAI_CATALOG;
    const districts = window.JIANGHAI_DISTRICTS;
    const readings = window.JIANGHAI_POEM_READINGS;
    const culture = window.JIANGHAI_CULTURE;
    const byId = id => catalog.find(place => place.id === id);
    const text = question.normalize('NFKC').trim();
    const namedArea = districts.find(d => text.includes(d.name) || (d.id === 'nantong' && /南通市区|南通城区|市中心|市区/.test(text)));
    const poemMatch = Object.entries(readings).flatMap(([id, poems]) => poems.map(poem => ({ id, poem })))
      .filter(({ poem }) => text.includes(poem.title) || poem.lines.some(line => text.includes(line.split(/[，。]/)[0]) && line.split(/[，。]/)[0].length >= 5))
      .sort((a, b) => b.poem.title.length - a.poem.title.length)[0];
    const placeMatch = catalog.filter(p => text.includes(p.name)).sort((a, b) => b.name.length - a.name.length)[0]
      || byId('catalog-' + Object.keys(aliases).find(alias => text.includes(alias)));
    const theme = Object.keys(themes).find(key => themes[key].match.test(text));
    const namedFood = culture.food.find(item => text.includes(item.title));
    const namedHeritage = culture.heritage.find(item => text.includes(item.title));
    const here = /这里|这儿|这一站|这个地方/.test(text);
    const currentPlace = byId(locationContext.place);
    const lastPlace = (here && currentPlace) || byId(previous.place) || currentPlace;
    const pageArea = byId(locationContext.place)?.area || locationContext.area;
    const area = namedArea?.id || placeMatch?.area || (poemMatch && byId(poemMatch.id)?.area)
      || namedFood?.areas[0] || namedHeritage?.areas[0] || (here && pageArea) || previous.area || pageArea || themes[theme]?.area || '';
    const district = districts.find(d => d.id === area);
    const tripTime = duration(text);
    const easy = /少走|走不动|不想走太多|腿脚|带老人|带长辈|带娃|带孩子|亲子/.test(text);
    const focus = placeMatch || (poemMatch && byId(poemMatch.id)) || (lastPlace?.area === area ? lastPlace : null);
    const context = {
      area,
      place: focus?.id || '',
      theme: theme || previous.theme || '',
      time: tripTime || previous.time || null,
      easy: easy || previous.easy || false
    };
    const reply = (message, links = [], nextContext = context) => ({ text: message, links, context: nextContext });

    if (/开门|开放时间|营业|票价|多少钱|门票|预约|人多吗|客流|天气|潮汐|涨潮|退潮|几点日出|实时|路况/.test(text)) {
      return reply('我这里有地点和展览资料。开放时间、票价、预约和潮汐等信息可能变化，出发当天请以景区或当地当天的公告为准。', [focus ? placeLink(focus) : districtLink(district)]);
    }

    const cultureTab = namedFood || /美食|吃什么|吃点|小吃|好吃|风味|海鲜/.test(text) ? 'food'
      : namedHeritage || /非遗|手艺|传统技艺/.test(text) ? 'heritage' : '';
    if (cultureTab) {
      if (!district) return reply('想找哪一带的' + (cultureTab === 'food' ? '美食' : '非遗') + '？比如说「如皋」或「启东」，我可以接着找。', [], { ...context, cultureTab });
      const found = namedFood || namedHeritage;
      const items = found ? [found] : culture[cultureTab].filter(item => item.areas.includes(area)).slice(0, 3);
      const message = items.length
        ? district.name + (cultureTab === 'food' ? '的地方风味，可以从这里尝起。' : '的地方手艺，可以从这里看起。') +
          '\n' + items.map(item => item.title + ' · ' + item.summary).join('\n')
        : '我暂时没找到' + district.name + '对应的站内条目，可以从七境地图继续浏览。';
      return reply(message, [districtLink(district, cultureTab)], { ...context, cultureTab });
    }

    if (namedArea && previous.cultureTab && !theme && !tripTime && !/路线|怎么去|去哪|游览|怎么玩/.test(text)) {
      return answer(text + (previous.cultureTab === 'food' ? '美食' : '非遗'), { ...previous, cultureTab: '' }, locationContext);
    }

    if (/怎么去|怎么走|导航|交通|地址|在哪儿|在哪里/.test(text) && !poemMatch) {
      return reply(focus ? '从' + focus.name + '的地点卡点「前往此地」，就能选择高德、百度或腾讯地图。'
        : '你可以先在地图里选好地点，再点「前往此地」查从你所在位置出发的路线。', [focus ? placeLink(focus) : districtLink(district)]);
    }

    if (poemMatch) {
      const { poem, id } = poemMatch;
      const point = byId(id);
      const pairing = id === 'catalog-23'
        ? '展览在如皋花木大世界配读《盆松》，可以从眼前的盆景回读诗句。这里是展览选读地点，诗作原址仍以校注为准。'
        : '站内把这首诗收在' + point.name + '的阅读卡里，可以对照原句与地点说明。';
      return reply('《' + poem.title + '》里有这样一联：\n“' + poem.lines[0] + '”\n' + pairing, [poemLink(poem), placeLink(point)]);
    }

    const aboutPlace = placeMatch || (here && /介绍|有什么看点|是什么/.test(text) && focus);
    if (aboutPlace && !tripTime && !/路线|怎么玩|推荐|少走|亲子|半天/.test(text)) {
      const excerpt = aboutPlace.description.split('。')[0] + '。';
      const related = readings[aboutPlace.id]?.[0];
      return reply(excerpt + (related ? '\n在这里还可以配读《' + related.title + '》。' : '\n地点卡里可以继续看展览资料和出行入口。'),
        related ? [placeLink(aboutPlace), poemLink(related)] : [placeLink(aboutPlace)]);
    }

    if (theme || tripTime || easy || namedArea || /路线|推荐|攻略|怎么玩|去哪里|去哪|选一站|少走|第一站/.test(text)) {
      const routeArea = area || themes[context.theme]?.area || 'nantong';
      const routeDistrict = districts.find(d => d.id === routeArea);
      const picks = [
        placeMatch?.id,
        ...(themes[context.theme]?.places || []).map(n => 'catalog-' + n),
        ...startingPoints[routeArea].map(n => 'catalog-' + n)
      ].map(byId).filter(p => p?.area === routeArea);
      const stops = [...new Set(picks)].slice(0, context.easy ? 1 : context.time?.stops || 2);
      const start = stops[0];
      const title = (context.time ? context.time.label + '的话，' : '') + '在' + routeDistrict.name + '可以先逛' + start.name + '。';
      const extra = context.easy ? '想少走一点，这次先留这一站。步行距离和无障碍设施可向景区确认。'
        : stops.length > 1 ? '有余裕再挑' + stops.slice(1).map(p => p.name).join('或') + '。点下面的地点卡可以查路线。' : '';
      return reply(title + (extra ? '\n' + extra : ''), stops.map(placeLink),
        { ...context, area: routeArea, place: start.id });
    }

    if (/护照|打卡|印章|画像/.test(text)) {
      return reply('在诗路护照可以自己记下到过的地方。集齐七境印章后，可以生成这一程的江海印象。', [
        { label: '打开诗路护照', detail: '个人自记', href: 'index.html#passport' }
      ]);
    }
    if (/你好|嗨|哈喽|你是谁/.test(text)) return reply('你好，我是小通！告诉我你有多少时间、想去哪里，或者想看海、读诗、找美食。');
    if (/谢谢|多谢/.test(text)) return reply('祝你在南通走得开心。这里还有七境地图可以慢慢逛。', [districtLink(district)]);
    if (focus && /这里|这儿|这一站|这个地方|接着|还有什么/.test(text)) {
      const related = readings[focus.id]?.[0];
      return reply('我们刚刚看到的是' + focus.name + '。' + (related ? '想继续读的话，可以看看《' + related.title + '》。' : '可以打开地点卡看展览资料，或继续问这一带的美食和非遗。'),
        related ? [poemLink(related), placeLink(focus)] : [placeLink(focus)]);
    }
    const followup = district && district.id === previous.area ? '我们可以接着聊' + district.name + '。' : '';
    return reply(followup + '这条我还没在站内资料里对上。试试问「为什么《盆松》跟如皋有关」「启东有半天，想看海」或说一个地名。');
  }

  window.XiaotongGuide = { answer };
})();
