# 小渡 · AI 产品经理

小渡的个人网站，记录关于 AI、产品与创造的探索。

**在线访问：https://nepheloovo.github.io/**

## 本地预览

静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。直接打开 `dist/index.html`，或运行：

```sh
python3 -m http.server 4173 --directory dist
```

访问 http://localhost:4173 。

## 修改内容

- `dist/index.html`：个人介绍、作品、联系方式。
- `dist/style.css`：样式和响应式布局。
- `dist/script.js`：思考标签页、作品详情、版权年份。
- `dist/favicon.svg`：网站图标。

真实作品和联系方式待补充；除名字与职业外，介绍与思考内容为首版建议文案。

## 发布更新

将修改提交并推送至 `main` 分支，GitHub Actions 会自动部署 `dist/` 到 GitHub Pages。可在仓库 **Actions** 查看发布结果，在 **Settings → Pages** 查看访问地址。

```sh
git add dist
git commit -m "Update personal website"
git push
```

部署流程：`.github/workflows/pages.yml`。
