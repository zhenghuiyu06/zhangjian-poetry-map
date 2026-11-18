/* Location coordinates are editorial reference points, not turn-by-turn navigation. */
(() => {
  const scenic = ['南通市地方志办公室 · 风景名胜','https://www.nantong.gov.cn/ntsrmzf/fjms2018/content/a63b4b34-da31-4522-8598-fae910934e77.html'];
  const haimen = ['海门区人民政府 · 张謇文化旅游景区','https://www.haimen.gov.cn/hmsrmzf/fjms/content/48c31a44-c3e8-4c90-81c0-9085ae2f6366.html'];
  const ich = ['中国非物质文化遗产网 · 国家级代表性项目名录','https://www.ihchina.cn/project.html'];
  const cabinet = ['国务院 · 第一批国家级非物质文化遗产名录','https://www.gov.cn/zwgk/2006-06/02/content_297946.htm'];
  const rail = ['铁路 12306 · 实时车次','https://www.12306.cn/'];
  const exhibit = ['馆方展陈资料','handoff.html#materials'];
  const original = ['原站考察资料','../index.html#route'];
  const transport = ['南通轨道交通 · 运营信息','https://www.ntrailway.com/'];
  const city = ['南通市人民政府 · 市情','https://www.nantong.gov.cn/ntsrmzf/sq/sq.html'];
  const series2 = ['国务院 · 第二批国家级非遗名录','https://www.gov.cn/zhengce/content/2008-06/16/content_5835.htm'];
  const series3 = ['国务院 · 第三批国家级非遗名录','https://www.gov.cn/zwgk/2011-06/09/content_1880635.htm'];
  const series4 = ['国务院 · 第四批国家级非遗名录及扩展名录','https://www.gov.cn/zhengce/content/2014-12/03/content_9286.htm'];
  const goat = ['海门区乡村振兴局 · 海门山羊种质资源','https://www.haimen.gov.cn/hmsrmzf/wdzsk/content/b38e0bf0-87b1-4cfc-8f0e-442872c065bd.html'];
  const cultivation = ['南通市档案馆 · 通海垦牧公司复建档案','https://daj.nantong.gov.cn/ntsdaj/bmdt/content/12241475-875a-492e-8ba1-198c16f69250.html'];
  const normalSchool = ['南通师范高等专科学校 · 师范教育的使命坚守','https://www.ntnc.edu.cn/2014/0519/c879a27492/page.htm'];
  const museum = ['南通市地方志办公室 · 历史遗存','https://www.nantong.gov.cn/ntsrmzf/lsyc2018/content/c07d14f8-6e49-4710-8699-aaba40f264d2.html'];
  const textile = ['南通大学 · 校史（1912）','https://www.ntu.edu.cn/2023/0809/c8043a217715/page.htm'];
  const embroider = ['南通市文化广电和旅游局 · 女红传习所旧址','https://wglj.nantong.gov.cn/ntswgxj/whyc/content/626cab87-98be-4c58-82fb-980075ed1e09.html'];
  const hhu = ['河海大学 · 学校简介','https://www.hhu.edu.cn/xxjj_23318/list.htm'];
  const blind = ['南通市档案馆 · 南通特殊教育中心','https://daj.nantong.gov.cn/ntsdaj/dfwh/content/e10cdc53-9c91-4c50-be4d-7edc04f9cda7.html'];
  const weather = ['中国气象局 · 智慧气象的前世今生','https://www.cma.gov.cn/2011xzt/2018zt/20180323/2018032307/201803/t20180320_464540_1.html'];
  const opera = ['南通市人民政府 · 南通伶工学社','https://www.nantong.gov.cn/ntsrmzf/bmyw/content/38001bdd-55be-4b39-956a-aa5ae7158045.html'];
  const west = ['南通市人民政府 · 沪苏通铁路开通运营4周年','https://www.nantong.gov.cn/ntsrmzf/sxcz/content/d5fdaf28-dbb8-4d04-a1ea-1fe4ccffe69a.html'];
  const ningqi = ['澎湃政务 · 宁启铁路二期启东段开通','https://www.thepaper.cn/newsDetail_forward_2820078'];
  const rugaoSouth = ['经济日报 · 盐通高铁开通运营','https://news.sina.com.cn/c/2020-12-30/doc-iiznctke9251696.shtml'];
  const subway1 = ['国际在线 · 南通轨道交通1号线','https://js.cri.cn/2022-11-08/ba13cd4d-1a22-bbeb-4c5c-46b12a923beb.html'];
  const subway2 = ['中国交通报 · 南通轨道交通2号线','https://www.zgjtb.com/zhitong/2023-12/29/content_393603.html'];
  const sutong = ['中国江苏网 · 苏通大桥建成通车','https://jsnews.jschina.com.cn/zt2019/70/zhuangli70/lizanxinzhongguo/201909/t20190927_2397087.shtml'];
  const chongqi = ['中国广播网 · 崇启大桥建成通车','https://news.ifeng.com/c/7fb6ng2P56m'];
  const districts = [
    {id:'haimen',name:'海门',color:'#92d2d7',center:[121.25,31.94],box:[121.03,31.80,121.55,32.09],shape:[[121.08,31.93],[121.12,32.08],[121.34,32.10],[121.53,32.08],[121.51,31.89],[121.23,31.83]],heritage:[['海门山歌','级别待核',exhibit]],food:[['海门山羊','地方风味线索',original]],access:'往张謇纪念馆，请搜索「海门常乐镇 张謇纪念馆」；可将海门站作为铁路换乘查询入口。',sources:[haimen,rail]},
    {id:'tongzhou',name:'通州',color:'#9bc8e4',center:[121.04,32.105],box:[120.87,31.99,121.43,32.27],shape:[[120.84,32.10],[120.89,32.25],[121.17,32.24],[121.39,32.31],[121.39,32.16],[121.34,32.10],[121.12,32.08],[121.08,31.93],[120.93,31.98]],heritage:[['童子戏','地方线索 · 申报地与级别待核',ich]],food:[['西亭脆饼','地方风味线索',original]],access:'余西古镇、石港镇分开搜索；如果从城区出发，可分别比较公交和驾车，不把两个古镇当作同一站。',sources:[scenic]},
    {id:'rugao',name:'如皋',color:'#a7c8e1',center:[120.57,32.25],box:[120.33,32.02,120.82,32.41],shape:[[120.23,32.12],[120.26,32.39],[120.61,32.42],[120.75,32.32],[120.89,32.25],[120.84,32.10],[120.69,32.06],[120.49,32.04]],heritage:[['如皋盆景','地方传统 · 项目正式名称与级别待核',scenic]],food:[['如皋萝卜干','地方风味线索',original]],access:'园林方向可搜索「水绘园」；铁路可查询如皋南站或如皋站，注意区分站名。',sources:[scenic,rail]},
    {id:'rudong',name:'如东',color:'#abc2e6',center:[121.12,32.37],box:[120.90,32.22,121.56,32.59],shape:[[120.89,32.25],[120.75,32.32],[120.86,32.48],[121.03,32.57],[121.27,32.54],[121.43,32.48],[121.56,32.37],[121.39,32.31],[121.17,32.24]],heritage:[['如东农民画','地方艺术 · 名录级别待核',original]],food:[['文蛤','沿海风味线索',scenic]],access:'赶海与观潮可查「小洋口旅游度假区」，大豫垦殖另搜「大豫镇」。临海地点以开放区域为准。',sources:[scenic,rail]},
    {id:'haian',name:'海安',color:'#b8bde5',center:[120.45,32.52],box:[120.12,32.37,120.75,32.68],shape:[[120.13,32.58],[120.27,32.69],[120.60,32.65],[120.72,32.55],[120.86,32.48],[120.75,32.32],[120.61,32.42],[120.26,32.39],[120.14,32.43]],heritage:[['海安花鼓','地方舞蹈 · 级别待核',exhibit]],food:[['海安麻虾酱','地方风味线索 · 待核',exhibit]],access:'韩国钧故居与青墩遗址应分别搜索。铁路可查询海安站，以购票页面和接驳线路为准。',sources:[scenic,rail]},
    {id:'qidong',name:'启东',color:'#cbb7de',center:[121.65,31.97],box:[121.41,31.70,122.02,32.20],shape:[[121.39,32.16],[121.59,32.25],[121.72,32.16],[121.92,32.03],[121.98,31.79],[121.82,31.70],[121.62,31.80],[121.51,31.89],[121.53,32.08]],heritage:[['启东版画','地方艺术 · 不据此认定非遗级别',exhibit]],food:[['吕四海鲜','沿海风味线索',original]],access:'查「通海垦牧博物馆」或「吕四渔港」，两处不是同一站；铁路可先查询启东站。',sources:[scenic,rail]},
    {id:'nantong',name:'南通城区',color:'#debecf',center:[120.83,31.99],box:[120.64,31.85,121.00,32.13],shape:[[120.49,32.04],[120.69,32.06],[120.84,32.10],[120.93,31.98],[121.08,31.93],[120.96,31.86],[120.69,31.93]],heritage:[['南通蓝印花布印染技艺','国家级 · Ⅷ—24',cabinet]],food:[['南通缸爿','地方小吃线索 · 待核',exhibit]],access:'濠河与博物苑适合合在一次城区漫游里；狼山、唐闸另查接驳。轨道交通 1、2 号线详见运营信息。',sources:[scenic,transport]}
  ];
  const regionalNotes = {
    haimen:{heritage:[['海门山歌','国家级 · Ⅱ—94',series2]],food:[['海门山羊','地方风味',goat]]},
    tongzhou:{heritage:[['南通僮子戏','南通地方戏曲；通州具体保护点及申报单位待核',['南通史志网 · 南通僮子戏','https://www.ntszw.gov.cn/?a=show&c=index&id=2391']]],food:[['石港窨糕','石港风味',city]]},
    rugao:{heritage:[['盆景技艺（如皋盆景）','国家级扩展项目 · Ⅶ—94',series4]],food:[['林梓潮糕','地方小吃',city]]},
    rudong:{heritage:[['跳马伕','国家级 · Ⅲ—97',series3]],food:[['文蛤','小洋口沿海风味',scenic]]},
    haian:{heritage:[['海安花鼓','地方非遗 · 名录级别待核',['海安市人民政府 · 海安花鼓展演','https://www.haian.gov.cn/hasrmzf/xxbs/content/642e5079-f75f-4077-ab0c-631c4dccc939.html']]],food:[['麻虾炖蛋','南通江海风味 · 海安地方口径待核',city]]},
    qidong:{heritage:[['吕四渔民号子','省级 · 据南通史志网',['南通史志网 · 吕四渔民号子','https://www.ntszw.gov.cn/?a=show&c=index&id=1975']]],food:[['吕四海鲜','地方风味线索',original]]},
    nantong:{food:[['缸爿和草鞋底','地方小吃',city]]}
  };
  districts.forEach(d=>Object.assign(d,regionalNotes[d.id]));
  // Longitude, latitude. Unlocated or broad historical entries intentionally remain in the list.
  const geo = {
    'intro-2':[120.922,31.948,'nantong'],'intro-3':[120.802,32.062,'nantong'],'intro-4':[121.695,32.062,'qidong'],'intro-5':[120.872,32.006,'nantong'],'intro-7':[120.864,32.012,'nantong'],'intro-9':[120.889,31.950,'nantong'],'intro-10':[120.858,32.006,'nantong'],'intro-11':[120.883,32.008,'nantong'],'rugao-6-shared':[120.580,32.397,'rugao'],
    'haimen-2':[121.2515,31.9331],'haimen-3':[121.252,31.933],'haimen-4':[121.30,31.88],'haimen-5':[121.32,31.90],'haimen-6':[121.32,31.90],'haimen-7':[121.31,31.84],
    'tongzhou-2':[121.07,32.06],'tongzhou-4':[121.0744572,32.0787752],'tongzhou-5':[121.19,32.06],'tongzhou-6':[121.0744572,32.0787752],'tongzhou-7':[121.095,32.135],'tongzhou-8':[121.345,32.20],'tongzhou-9':[121.20,32.055],'tongzhou-10':[120.994,32.225],
    'nantong-2-shared':[120.873,32.009],'rugao-3':[120.577,32.395],'rugao-4':[120.579,32.394],'rugao-5':[120.579,32.393],'rugao-6':[120.583,32.394],'rugao-7':[120.582,32.389],'rugao-10':[120.580,32.397],'rugao-11':[120.580,32.397],'rugao-12':[120.580,32.397],'rugao-18':[120.760,32.225],
    'haian-3':[120.465,32.551],'haian-8':[120.469,32.539],'haian-9':[120.27,32.58],
    'qidong-2':[121.698,32.057],'qidong-3':[121.695,32.062],'qidong-4':[121.698,32.057],'qidong-5':[121.60266,32.05992],'qidong-8':[121.91,31.86],'qidong-10':[121.54,31.88],
    'nantong-2':[120.875,32.016],'nantong-3':[120.88813,31.94928],'nantong-5':[120.802,32.062],'nantong-6':[120.860,32.019],'nantong-7':[120.862,32.018],'nantong-8':[120.856,32.025],'nantong-9':[120.887,32.008],'nantong-10':[120.860,32.008],'nantong-11':[120.901,31.965],
    'rudong-1':[121.31,32.29],'rudong-2':[121.038,32.568],'rudong-3':[121.06,32.57]
  };
  const introDistrict = {'intro-2':'nantong','intro-3':'nantong','intro-4':'qidong','intro-5':'nantong','intro-7':'nantong','intro-8':'nantong','intro-9':'nantong','intro-10':'nantong','intro-11':'nantong'};
  // The third column is a verbatim attribution only when supported by the linked source.
  const firsts = [
    ['通海垦牧公司','1901','中国最早的农业股份制公司','此处采用南通市档案馆复建报道的股份制口径。','qidong-3',cultivation],
    ['通州师范','1902','我国首所独立设置的师范学校','指张謇创办的通州民立师范学校；不与今日通州区的师范学校混同。','',normalSchool],
    ['南通博物苑','1905','中国人自办的第一座公共博物馆','限定为中国人自办、公共博物馆。','nantong-2-shared',museum],
    ['通州女子师范','1905','','校方发布的纪实文章写南通女子师范学校创办于 1905 年；与候选表 1906 年不同。校名、创办与正式开学口径待比对。','',normalSchool],
    ['南通纺织专门学校','1912／1913','中国最早独立设置的纺织专科院校','1912 年前身创办并改称南通纺织学校，次年正式定名。地图指向展表相关的纺织博物馆。','intro-11',textile],
    ['女红传习所','1914','','市文旅局记创办于 1914 年、旧址教学楼建于 1916 年，仅称「我国早期培养刺绣人才的学校」。','',embroider],
    ['河海工程专门学校','1915','中国第一所培养水利人才的高等学府','据河海大学校史；异地线索，不在南通绘点。','',hhu],
    ['狼山盲哑学校','1916','中国第一所由国人自办自教的特殊教育学校','市档案馆记原址在狼山北麓；地图指向展表中的狼山，不是校址。','nantong-3',blind],
    ['军山气象台','1916／1917','中国历史上最早的私人气象台','展表记 1916 年，中国气象局所刊资料记 1917 年；筹建、建成与开展观测的时间口径待对读。','intro-2',weather],
    ['伶工学社','1919','中国第一所新型戏剧学校','采用南通市政府发布的限定语。','intro-10',opera]
  ];
  const timeline = [
    ['1853','生于海门常乐','海门引言据《啬翁自订年谱》等材料整理。','haimen-2',exhibit],
    ['1894','殿试中状元','海门引言及如皋展陈材料所记同一年。','haimen-3',exhibit],
    ['1901','垦牧事业','读海复镇、通海垦牧公司的展陈文献。','qidong-3',exhibit],
    ['1902','创办通州师范','通州民立师范学校；回看近代师范教育。','',normalSchool],
    ['1905','创办南通博物苑','从早期展览、教育与收藏线索入手。','nantong-2-shared',exhibit],
    ['1916／1917','营建军山气象台','展表与气象局刊文采用不同年份，时间口径待对读。','intro-2',weather],
    ['1919','兴办伶工学社','沿展览书目回看近代戏剧教育。','intro-10',opera]
  ];
  const transit = [
    ['nt-west','南通西站','随沪苏通铁路于 2020 年 7 月 1 日开通运营。',120.76,32.10,'tongzhou',west],
    ['hm-station','海门站','宁启铁路二期车站；2019 年 1 月 5 日，南通至启东段开通运营。',121.17,31.94,'haimen',ningqi],
    ['qd-station','启东站','宁启铁路二期车站；2019 年 1 月 5 日，南通至启东段开通运营。',121.65,31.87,'qidong',ningqi],
    ['rg-south','如皋南站','盐通高铁车站；盐通高铁于 2020 年 12 月 30 日开通运营。',120.60,32.33,'rugao',rugaoSouth],
    ['rd-station','如东站','海洋铁路；开通日期及当前客运情况以官方查询为准。',121.03,32.34,'rudong',rail],
    ['ha-station','海安站','铁路换乘参考；运营车次以 12306 为准。',120.49,32.53,'haian',rail],
    ['metro','南通轨道交通 1、2 号线','1 号线于 2022 年 11 月 10 日、2 号线于 2023 年 12 月 27 日开通运营。此落点为城区接驳示意。',120.87,32.026,'nantong',subway1,subway2],
    ['sutong','苏通大桥','过江公路通道；2008 年 6 月 30 日建成通车。',121.00,31.79,'',sutong],
    ['husutong','沪苏通大桥','长江公铁大桥；2020 年 7 月 1 日与沪苏通铁路同步开通运营。',120.71,31.95,'',west],
    ['chongqi','崇启大桥','连接启东和上海崇明；2011 年 12 月 24 日建成通车。',121.72,31.68,'qidong',chongqi]
  ];
  const foodBooks = [
    {id:'food-1',title:'如皋美食',note:'线索为「江海文化丛书」；责任者、出版社、出版年和 ISBN 待查馆藏书目。',districts:['rugao']},
    {id:'food-2',title:'南黄海渔事',note:'版本、责任者及 ISBN 待查馆藏书目。',districts:['rudong']},
    {id:'food-3',title:'江海食脉',note:'线索责任者为巫乃宗；书名、出版社、出版年和 ISBN 待核。',districts:[]},
    {id:'food-4',title:'千年海门一品山羊',note:'市委老干部局公开资料记杨洪兴应邀撰写；出版社、出版年和 ISBN 待查版权页。',districts:['haimen'],source:['南通市委老干部局 · 杨洪兴事迹','https://lgbj.nantong.gov.cn/zgntswlgbj/dyfc/content/e080b5ce-9b8b-48ad-9732-fc3c4e81cfa8.html']}
  ];
  window.JIANGHAI_GUIDE = {districts,geo,introDistrict,firsts,timeline,transit,foodBooks,sources:{scenic,haimen,ich,cabinet,rail,exhibit,original,transport}};
})();
