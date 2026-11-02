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

- `dist/index.html`：全部内容。五个面板：关于我、个人项目、技能与工具、文章、联系我。
- `dist/style.css`：样式、配色（`:root` 变量）和手机适配。
- `dist/script.js`：开机页、侧栏切换、项目轮播。
- `dist/assets/covers/`：项目与文章封面。

**新增文章**：在 `#writing` 面板里复制一个 `<a class="article">` 块，换链接、标题、日期和封面图；同时更新状态栏和开机页里的文章数量。

**新增中文标题字**：大标题用的 `display-zh.woff2` 只包含本站用到的字。加了新标题后，用下面的命令重新生成（在仓库根目录执行）：

```sh
TEXT=$(python3 -c "import urllib.parse;s=open('dist/index.html',encoding='utf-8').read();print(urllib.parse.quote(''.join(sorted(set(c for c in s if ord(c)>0x2E80)))))")
URL=$(curl -s -A "Mozilla/5.0 Chrome/130" "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&text=$TEXT" | grep -oE 'https://[^)]+' | head -1)
curl -s -o dist/assets/display-zh.woff2 "$URL"
```

## 发布更新

将修改提交并推送至 `main` 分支，GitHub Actions 会自动部署 `dist/` 到 GitHub Pages。可在仓库 **Actions** 查看发布结果，在 **Settings → Pages** 查看访问地址。

```sh
git add dist
git commit -m "Update personal website"
git push
```

部署流程：`.github/workflows/pages.yml`。
