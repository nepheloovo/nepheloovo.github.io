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

- `dist/index.html`：全部内容。五个面板：关于我、项目（可按类别筛选）、能力、文章（可按标签筛选）、联系；宽屏右侧是个人名片栏。
- `dist/style.css`：样式、配色（`:root` 变量，主色克莱因蓝 `#002fa7`）和手机适配（860px 以下变为底部导航）。
- `dist/script.js`：开机页（自动进站、可跳过）、面板切换、筛选、公众号二维码弹窗。
- `dist/assets/wechat-qr.jpg`：公众号二维码。
- `dist/assets/covers/`：项目与文章封面。

**新增文章**（不用改代码）：打开仓库 **Actions → Add WeChat article → Run workflow**，粘贴公众号文章链接，标签和一句话简介可空，点 **Run workflow**。它会抓取标题、发布日期和封面，写入 `dist/articles.json`，按日期从新到旧重新生成 `#writing` 文章区和文章数量，然后自动部署。GitHub 主页 README（`nepheloovo/nepheloovo`）每小时从 `https://nepheloovo.github.io/articles.json` 同步一次文章表格，也可以在那个仓库的 Actions 里手动运行 **Sync articles from website** 立刻同步。

本地也能做同样的事：

```sh
python3 scripts/articles.py add "https://mp.weixin.qq.com/s/..." --tag "AI 热点"
python3 scripts/articles.py render   # 手动改了 articles.json 后重新生成
```

文章区在 `index.html` 的 `<!-- articles:start -->` 和 `<!-- articles:end -->` 之间，由脚本生成，不要手改。

**新增中文标题字**：大标题用的 `display-zh.woff2` 只包含本站用到的字。加了新标题后，用下面的命令重新生成（在仓库根目录执行）：

```sh
TEXT=$(python3 -c "import urllib.parse;s=open('dist/index.html',encoding='utf-8').read();print(urllib.parse.quote(''.join(sorted(set(c for c in s if ord(c)>0x2E80)))))")
URL=$(curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&text=$TEXT" | grep -oE 'https://[^)]+' | head -1)
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
