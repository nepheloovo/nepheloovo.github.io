#!/usr/bin/env python3
"""公众号文章管理：抓取文章信息、写入 dist/articles.json、重新生成网站文章区。

用法（在仓库根目录执行）：
  python3 scripts/articles.py add <公众号文章链接> [--tag 标签] [--summary 一句话]
  python3 scripts/articles.py render

只用 Python 标准库，GitHub Actions 和本地都能直接运行。
"""
import argparse
import hashlib
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
DATA = DIST / "articles.json"
INDEX = DIST / "index.html"
COVERS = DIST / "assets" / "covers"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
CST = timezone(timedelta(hours=8))
DEFAULT_TAG = "AI 观察"


def fetch(url, referer=None):
    headers = {"User-Agent": UA}
    if referer:
        headers["Referer"] = referer
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as r:
        return r.read()


def meta(page, prop):
    m = re.search(r'<meta property="%s" content="([^"]*)"' % re.escape(prop), page)
    return html.unescape(m.group(1)).strip() if m else ""


def js_var(page, name):
    m = re.search(r'var %s = "([^"]*)"' % re.escape(name), page)
    return m.group(1) if m else ""


def first_summary_sentence(page):
    """正文开头的「摘要：」第一句，用于 og:description 和标题重复时兜底。"""
    m = re.search(r'id="js_content"(.*?)</div>\s*<script', page, re.S)
    if not m:
        return ""
    text = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(1))))
    s = re.search(r"摘要[：:]\s*([^。！？]+[。！？])", text)
    return s.group(1).strip() if s else ""


def scrape(url):
    page = fetch(url).decode("utf-8", "ignore")
    title = meta(page, "og:title")
    if not title:
        sys.exit("没有读到文章标题：微信可能返回了验证页，或者链接不是公众号文章。稍后重试，或在本地运行本脚本。")
    ts = js_var(page, "ct") or js_var(page, "create_time")
    if not ts:
        sys.exit("没有读到发布时间，页面结构可能变了。")
    summary = meta(page, "og:description")
    if not summary or summary == title:
        summary = first_summary_sentence(page)
    mid, idx = js_var(page, "mid"), js_var(page, "idx")
    return {
        "id": f"{mid}_{idx}" if mid else "",
        "url": url,
        "title": title,
        "date": datetime.fromtimestamp(int(ts), CST).strftime("%Y-%m-%d"),
        "summary": summary,
        "image": meta(page, "og:image"),
    }


def load():
    return json.loads(DATA.read_text(encoding="utf-8")) if DATA.exists() else []


def save(articles):
    articles.sort(key=lambda a: a["date"], reverse=True)
    DATA.write_text(json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def add(url, tag, summary):
    info = scrape(url.strip())
    articles = load()
    old = next((a for a in articles if (info["id"] and a.get("id") == info["id"]) or a["url"] == info["url"]), None)
    if old:
        print(f"已存在，更新信息：{info['title']}")
    else:
        old = {}
        articles.append(old)
    cover = old.get("cover")
    if not cover and info["image"]:
        name = "article-%s.jpg" % hashlib.sha1((info["id"] or info["url"]).encode()).hexdigest()[:10]
        (COVERS / name).write_bytes(fetch(info["image"], referer="https://mp.weixin.qq.com/"))
        cover = f"assets/covers/{name}"
    old.update({
        "id": info["id"] or old.get("id", ""),
        "url": old.get("url") or info["url"],
        "title": info["title"],
        "date": info["date"],
        "summary": summary or old.get("summary") or info["summary"],
        "tag": tag or old.get("tag") or DEFAULT_TAG,
        "cover": cover or "",
    })
    save(articles)
    render(articles)
    print(f"已添加：{info['date']} {info['title']}")


def card(a, i):
    e = lambda s: html.escape(s, quote=True)
    if i == 1:
        cover = f'\n                <div class="cover"><img src="{e(a["cover"])}" alt="" loading="lazy"></div>' if a.get("cover") else ""
        summary = f"\n                  <p>{e(a['summary'])}</p>" if a.get("summary") else ""
        return f"""              <a class="article-feature" data-tags="{e(a['tag'])}" href="{e(a['url'])}" target="_blank" rel="noopener">{cover}
                <div class="article-body">
                  <p class="meta"><span class="tag">最新</span><span class="tag tag-line">{e(a['tag'])}</span><span class="date">{a['date']}</span></p>
                  <h3>{e(a['title'])}</h3>{summary}
                  <em>阅读原文<svg class="ic"><use href="#i-arrow"/></svg></em>
                </div>
              </a>"""
    summary = f"\n                <p>{e(a['summary'])}</p>" if a.get("summary") else ""
    return f"""              <a class="article-row" data-tags="{e(a['tag'])}" href="{e(a['url'])}" target="_blank" rel="noopener">
                <span class="no">{i:02d}</span>
                <h3>{e(a['title'])}</h3>{summary}
                <span class="side"><span class="tag tag-line">{e(a['tag'])}</span><span class="date">{a['date']}</span></span>
              </a>"""


def render(articles=None):
    articles = articles if articles is not None else load()
    articles.sort(key=lambda a: a["date"], reverse=True)
    n = len(articles)
    # 最新一篇做大卡，其余为紧凑列表
    cards = [card(a, i) for i, a in enumerate(articles, 1)]
    doc = INDEX.read_text(encoding="utf-8")
    doc, hit = re.subn(r"(<!-- articles:start -->\n).*?(\n\s*<!-- articles:end -->)",
                       lambda m: m.group(1) + "\n".join(cards) + m.group(2), doc, flags=re.S)
    if not hit:
        sys.exit("index.html 里没找到 <!-- articles:start --> / <!-- articles:end --> 标记。")
    doc = re.sub(r'<b id="articleCount">\d+</b>', f'<b id="articleCount">{n}</b>', doc)
    INDEX.write_text(doc, encoding="utf-8")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add", help="添加或更新一篇文章")
    a.add_argument("url")
    a.add_argument("--tag", default="")
    a.add_argument("--summary", default="")
    sub.add_parser("render", help="按 articles.json 重新生成文章区")
    args = p.parse_args()
    if args.cmd == "add":
        add(args.url, args.tag.strip(), args.summary.strip())
    else:
        render()


if __name__ == "__main__":
    main()
