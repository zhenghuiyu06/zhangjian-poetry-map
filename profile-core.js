// 江海旅人画像只描述本次行旅选择，不推断稳定人格或历史事实。
(function (root) {
  'use strict';

  const types = [
    { id: 'sea', name: '山海寻光者', motif: '海天与江月', description: '你更愿意循着山水、海风和天光认识南通。', next: '再读《落日九月十五歸自吕四途中》，对照今日启东海岸的光线；海堤并非诗作原址。', poemId: 2 },
    { id: 'heritage', name: '故里寻脉者', motif: '故里与人文', description: '你更在意地点背后的故事，也愿意花时间辨明它与诗歌的关系。', next: '再读《盆松》，看看海门常乐镇的今日纪念空间；纪念馆与诗歌是同镇关联。', poemId: 3 },
    { id: 'poetry', name: '诗境采样者', motif: '诗句与观察', description: '你喜欢把眼前的细节和诗句放在一起，留下自己的当代注释。', next: '打开《八月十三夜曼寿堂看月》的“月影采样”，记录一处真实看见的树影或水波。', poemId: 6 },
    { id: 'city', name: '城巷漫游者', motif: '街巷与日常', description: '你也从街巷、水岸和今天的生活节奏中读这座城。', next: '再读《千龄观消寒第五集闻粤事稍平》，再自选濠河或商圈作为今日同城延伸；这些地方不等于诗作原址。', poemId: 8 }
  ];
  const questions = [
    { title: '七境里，你最想留住哪种画面？', options: [
      { type: 'sea', label: '水面、日落与天光' }, { type: 'heritage', label: '故居、遗址与馆舍' },
      { type: 'poetry', label: '能回应一句诗的细节' }, { type: 'city', label: '街巷里正在发生的日常' }
    ] },
    { title: '来到新的一站，你通常先做什么？', options: [
      { type: 'sea', label: '抬头看地形、天气和光线' }, { type: 'heritage', label: '读现场介绍，弄清来历' },
      { type: 'poetry', label: '找一句诗，对照眼前景象' }, { type: 'city', label: '随意走走，感受当地生活' }
    ] },
    { title: '如果只分享一份记录，你会选哪种？', options: [
      { type: 'sea', label: '一张山海风景照' }, { type: 'heritage', label: '一处建筑或展陈细节' },
      { type: 'poetry', label: '一张照片加一句自己的观察' }, { type: 'city', label: '一段街巷漫游的瞬间' }
    ] },
    { title: '下一次，你想怎样继续探索南通？', options: [
      { type: 'sea', label: '再追一次江海的光' }, { type: 'heritage', label: '再访一处人文地点' },
      { type: 'poetry', label: '带着诗句做一次现场采样' }, { type: 'city', label: '换一条城中慢逛路线' }
    ] }
  ];
  const ids = types.map(type => type.id);

  function evaluate(answers) {
    if (!Array.isArray(answers) || answers.length !== questions.length || answers.some((answer, index) => !questions[index].options.some(option => option.type === answer))) return null;
    const scores = Object.fromEntries(ids.map(id => [id, 0]));
    answers.forEach(answer => { scores[answer] += 1; });
    const ranked = [...types].sort((a, b) =>
      scores[b.id] - scores[a.id]
      || Number(b.id === answers[3]) - Number(a.id === answers[3])
      || Number(b.id === answers[0]) - Number(a.id === answers[0])
      || ids.indexOf(a.id) - ids.indexOf(b.id)
    );
    return { primary: ranked[0].id, secondary: scores[ranked[1].id] ? ranked[1].id : null, scores };
  }

  function story(profile, favoriteName, observationCount) {
    const result = evaluate(profile?.answers);
    if (!result || typeof favoriteName !== 'string' || !favoriteName) return null;
    const type = types.find(item => item.id === result.primary);
    const memorableScene = questions[0].options.find(option => option.type === profile.answers[0]).label;
    const firstAction = questions[1].options.find(option => option.type === profile.answers[1]).label;
    const nextDirection = questions[3].options.find(option => option.type === profile.answers[3]).label;
    const observation = observationCount > 0
      ? `你还在 ${observationCount} 首诗里留下了自己的当代观察。`
      : '你还没有保存诗境观察；下次可以从一首诗、一张照片和一句话开始。';
    return `在个人自记的七境里，你最想重访${favoriteName}。你想留住“${memorableScene}”，到站先“${firstAction}”，下一次想“${nextDirection}”。${type.description}${observation}`;
  }

  function shareText(profile, favoriteName, observationCount) {
    const result = evaluate(profile?.answers);
    if (!result) return '';
    const type = types.find(item => item.id === result.primary);
    const secondary = result.secondary ? ` · 也带着${types.find(item => item.id === result.secondary).motif}的兴趣` : '';
    return `我的江海旅人画像：${type.name}${secondary}\n${story(profile, favoriteName, observationCount)}\n再读／再看：${type.next}\n七境印章为个人自记；画像只描述本次行旅偏好。`;
  }

  const core = { types, questions, evaluate, story, shareText };
  root.JourneyProfileCore = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof globalThis !== 'undefined' ? globalThis : this);
