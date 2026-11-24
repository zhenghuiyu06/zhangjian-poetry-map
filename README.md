# 张謇诗路 · 南通漫游

[打开网站](https://loveeti.top/) · [七境诗歌地图](https://loveeti.top/v3/exhibit.html#map) · [诗歌影音](https://loveeti.top/v3/poetry.html) · [维护指南](v3/README.md)

《张謇诗路》把张謇诗文、南通地方文献和今日景点放在同一张地图上。可以从一首诗找到关联地点，也可以从一处景点查到对应书目和页码。站内的「江海阅潮生」是 2026 年南通市公共图书馆地方文献展的线上导览。

## 从哪里开始

| 入口 | 可以做什么 |
| --- | --- |
| [南通七境首页](https://loveeti.top/) | 从水墨入场进入，按地区或主题选一站，从首屏打开七境诗歌地图。 |
| [七境诗歌地图](https://loveeti.top/v3/exhibit.html#map) | 切换街道地图和分区示意图，查地点、非遗、美食与出行。地点详情关联诗文、书目和页码，可打开导航或分享。 |
| [江海书架](https://loveeti.top/v3/exhibit.html#books) | 按书名、地名或地区查展览书目，从书回到关联地点。 |
| [诗歌影音](https://loveeti.top/v3/poetry.html) | 读诗、听朗读，查看对应的诗画视频、阅读札记或关系图。 |
| [八首诗歌档案](https://loveeti.top/v3/shilu.html#archive) · [经典诗歌地图](https://loveeti.top/v3/research.html) | 按诗题或地点继续读，点选关系图线索，对照原诗。 |
| [我的诗路护照](https://loveeti.top/v3/#passport) | 自记七境到访、回看观察卡。集齐七境后可生成「我的数字江海印象」。 |
| [小通导览](https://loveeti.top/v3/#top) | 点右下角带球奔跑的 3D 小通。小通会挥手打招呼，也可在地图地点卡点「问小通」，直接了解该地点。 |

小通根据站内资料和本地规则回答问题。印章、观察卡和旅人画像保存在当前浏览器。换域名或本地端口时，请回到原来使用的地址查看已有记录。

## 本地预览

从 GitHub 克隆或下载完整仓库，在仓库根目录启动静态服务。

```sh
python3 -m http.server 8879 --bind 127.0.0.1
```

打开 [本地首页](http://127.0.0.1:8879/v3/)。`v3/` 页面会引用上一级目录的原站图片、音视频和脚本，预览时请保留完整目录结构。

## 发布与历史

`main` 分支由 [GitHub Pages 工作流](.github/workflows/deploy.yml) 发布到 [loveeti.top](https://loveeti.top/)。

| 网站版本 | 记录 |
| --- | --- |
| 2026-11-24 · 小通导览 | [版本说明](v3/RELEASE-2026-11-24-XIAOTONG.md) · [发布标签](https://github.com/zhenghuiyu06/zhangjian-poetry-map/tree/production-2026-11-24-xiaotong) |
| 2026-11-24 · 首页导航 | [版本说明](v3/RELEASE-2026-11-24.md) · [上一版回退点](https://github.com/zhenghuiyu06/zhangjian-poetry-map/tree/production-2026-11-24-navigation) |
| 2026-11-22 · 地点影像与诗歌影音 | [版本说明](v3/RELEASE-2026-11-22.md) |
| 更早的版本 | [发布标签](https://github.com/zhenghuiyu06/zhangjian-poetry-map/tags) |

回退前先查看目标版本及其后的提交。通过新的回退提交发布，保留 GitHub 上的版本历史。文件位置、检查步骤和回退示例见 [维护指南](v3/README.md)。

## 资料与素材

各地点的对应书目、页码和诗文可在详情查看，照片来源与许可在相关页面标注。馆方核对事项见 [资料交接页](v3/handoff.html)。

- 濠河夜景，大眼夹摄影，CC BY-SA 3.0。[原图](https://commons.wikimedia.org/wiki/File:Hao_River_in_The_Evening.JPG)
- 南大街街景，4084470 0.smil 摄影，CC BY 4.0。[原图](https://commons.wikimedia.org/wiki/File:Nantong_Bus_Route_G1_at_Nan_Dajie_in_Jiangsu,_China_20260219.jpg)
- 如东小洋口滩涂，Alastair Rae 摄影，CC BY-SA 2.0。[原图](https://commons.wikimedia.org/wiki/File:Xiaoyangkou_(15248630404).jpg)
