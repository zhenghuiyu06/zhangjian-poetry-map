# 张謇诗路 · v3 维护指南

`v3/` 是 [loveeti.top](https://loveeti.top/) 当前使用的站点目录。仓库根目录的 `index.html` 会将访客引导至 `v3/`，并带上原链接的查询参数和锚点。

## 页面与内容文件

下列链接均相对于 `v3/`。本站以原生 HTML、CSS 和 JavaScript 运行，可以直接由静态服务器提供。

| 要改的内容 | 从这里找 |
| --- | --- |
| 首页水墨入场、一级导航、七境导览、诗路护照 | [index.html](index.html)、[intro.css](intro.css)、[js/home-map.js](js/home-map.js) |
| 展览七境地图、地点详情、书架与交通 | [exhibit.html](exhibit.html)、[js/app.js](js/app.js)、[js/data.js](js/data.js)、[js/guide.js](js/guide.js) |
| 街道地图、分区示意图 | [js/street-atlas.js](js/street-atlas.js)、[js/nantong-boundaries.js](js/nantong-boundaries.js)、[assets/district-streets/](assets/district-streets/) |
| 非遗、美食与出处 | [js/culture.js](js/culture.js) |
| 地点照片、走读任务 | [js/place-photos.js](js/place-photos.js)、[assets/place-photos/](assets/place-photos/)、[js/walks.js](js/walks.js) |
| 诗歌影音、阅读札记、年谱影像 | [poetry.html](poetry.html)、[js/poetry-library.js](js/poetry-library.js)、[js/poem-readings.js](js/poem-readings.js)、[js/chronicles.js](js/chronicles.js) |
| 八首诗歌档案、经典诗歌地图 | [shilu.html](shilu.html)、[research.html](research.html)，共用仓库根目录的 [assets/](../assets/) 和 [classic/](../classic/) |
| 小通外观、动画与对话 | [xiaotong.css](xiaotong.css)、[js/xiaotong.js](js/xiaotong.js)、[js/xiaotong-companion.mjs](js/xiaotong-companion.mjs)、[js/xiaotong-guide.js](js/xiaotong-guide.js) |
| 本地记录、数字江海印象 | [js/local-record.js](js/local-record.js)、[js/catalog-profile.js](js/catalog-profile.js)、[js/catalog-profile-core.js](js/catalog-profile-core.js) |
| 交接事项、待核资料 | [handoff.html](handoff.html) |

首页和诗路页面现在直接维护。旧版的 `build-derived.mjs` 会覆盖 `index.html` 和 `shilu.html`，其中涉及新版导航和小通入口，修改前请先查看它生成的差异。

## 内容和链接怎么维护

- 地点、图书和配图更新时，保留现有地点 ID，检查地图落点、地点卡、书架及分享链接是否对应。地点卡展示书名和实际页码。
- 地图深链可直接打开[启东美食](https://loveeti.top/v3/exhibit.html#d=qidong&tab=food)或[狼山风景名胜区](https://loveeti.top/v3/exhibit.html#p=catalog-50)。链中的 `d` 表示地区 ID，`p` 表示地点 ID，`tab` 可指定非遗或美食栏。
- 新增史实、引文和配图时保留出处及许可。将历史地点和今日景点的关系写清，地图落点用于位置参考。
- 原始展表缺项、重复 ISBN、年代和超星链接等核对事项均可从 [资料交接页](handoff.html) 查询。

## 小通和本机记录

小通通过网页内的 3D 模型循环带球奔跑，打开对话时将模型切换到对话头像。设备无法渲染 3D 时显示头像图片。对话从站内数据读取地点和诗文信息，使用浏览器内的规则生成回答。

模型源文件为 [xiaotong-character.mjs](js/xiaotong-character.mjs)，导出脚本为 [build-xiaotong-model.mjs](js/build-xiaotong-model.mjs)。页面直接加载已入库的 GLB 与 Three.js 组件，更新模型时才需要安装脚本依赖并重新生成资源。[Three.js 许可](vendor/three.LICENSE.txt)

新旧页面在同一浏览器、同一网站来源下共用 IndexedDB 库 `zhangjian-poetry-observations-v2`，版本为 `2`，包含 `observations`、`visits`、`profiles`。七境印章键为 `haimen`、`tongzhou`、`rugao`、`rudong`、`haian`、`qidong`、`nantong`。保持这些标识能让更新后的页面继续读取旧记录。

## 本地检查

从完整仓库的根目录启动服务，打开 [本地首页](http://127.0.0.1:8879/v3/)。

```sh
python3 -m http.server 8879 --bind 127.0.0.1
```

安装 Playwright 和可用的 Chromium 后，可以从仓库根目录运行现有检查。需要指定浏览器时可设置 `CHROME`，截图目录由 `QA_OUT` 指定。

```sh
QA_URL=http://127.0.0.1:8879 node v3/qa/check-dual-map.cjs
QA_URL=http://127.0.0.1:8879 node v3/qa/check-culture.cjs
QA_URL=http://127.0.0.1:8879 node v3/qa/check-study-desk.cjs
```

发布前可用桌面和手机宽度打开首页、地图和地点深链。小通需单独点开确认打招呼动作，也可从狼山地点卡点「问小通」，检查回答是否引用对应地点。地图 App 跳转和手机原生分享需要在实际设备上检查。

## 发布与回退

推送到 `main` 后，[GitHub Pages 工作流](../.github/workflows/deploy.yml) 会发布整个仓库的站点文件。发布提交和标签可在 GitHub 找到，完成后再打开线上首页与相关深链抽查。

- [2026-11-24 小通版](RELEASE-2026-11-24-XIAOTONG.md)，标签 `production-2026-11-24-xiaotong`。
- [2026-11-24 首页导航版](RELEASE-2026-11-24.md)，标签 `production-2026-11-24-navigation`，对应提交 `a0e75a5`。
- [2026-11-22 地点影像版](RELEASE-2026-11-22.md) · [2026-11-21 走读书桌版](RELEASE-2026-11-21-STUDY-DESK.md) · [2026-11-19 展览改版](RELEASE-2026-11-19.md)。

如果要撤回小通版，先更新本地 `main` 并取回标签，检查有没有后续提交改动同一批文件。确认后，撤销小通发布提交并推送新提交。

```sh
git revert production-2026-11-24-xiaotong
git push origin main
```
