(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* 隐私模式下忽略 */ } },
  };

  $('#year').textContent = new Date().getFullYear();
  const main = $('#main');

  /* ---------- 开机页：每个会话一次，约 1.6 秒后自动进站，可随时跳过 ---------- */
  const boot = $('#boot');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let bootTimer;
  const enter = () => {
    if (boot.hidden || boot.classList.contains('is-gone')) return;
    clearTimeout(bootTimer);
    boot.classList.add('is-gone');
    store.set('xiaodu-booted', '1');
    document.removeEventListener('keydown', enter);
    setTimeout(() => { boot.hidden = true; }, 450);
  };
  if (store.get('xiaodu-booted') || location.hash || reduce) {
    boot.hidden = true;
  } else {
    bootTimer = setTimeout(enter, 1700);
    boot.addEventListener('click', enter);
    document.addEventListener('keydown', enter);
  }

  /* ---------- 面板切换（hash 路由） ---------- */
  const panels = $$('.panel');
  const navLinks = $$('[data-nav]');
  const ids = panels.map((p) => p.id);
  const names = Object.fromEntries(navLinks.map((a) => [a.dataset.nav, a.textContent.trim()]));
  const crumb = $('#crumb');

  const show = (id) => {
    if (!ids.includes(id)) id = 'about';
    panels.forEach((p) => p.classList.toggle('is-active', p.id === id));
    navLinks.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    crumb.textContent = `~/ ${names[id]}`;
    // 浏览器会按锚点把 section 滚进视野，这里统一回到顶部
    const top = () => { main.scrollTop = 0; window.scrollTo(0, 0); };
    top();
    requestAnimationFrame(top);
  };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!ids.includes(id)) return;
    e.preventDefault();
    if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    show(id);
  });
  window.addEventListener('popstate', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));

  /* ---------- 筛选 ---------- */
  $$('[data-filter-group]').forEach((group) => {
    const items = $$(':scope > [data-tags]', $(`[data-filter-items="${group.dataset.filterGroup}"]`));
    if (group.hasAttribute('data-auto')) {
      // 文章标签按出现次数自动生成
      const count = {};
      items.forEach((it) => it.dataset.tags.split(',').forEach((t) => { count[t] = (count[t] || 0) + 1; }));
      const tags = Object.keys(count).sort((a, b) => count[b] - count[a]);
      group.innerHTML = `<button type="button" class="is-on" data-filter="all">全部<small>${items.length}</small></button>` +
        tags.map((t) => `<button type="button" data-filter="${t}">${t}<small>${count[t]}</small></button>`).join('');
      if (tags.length < 2) group.hidden = true;
    }
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const f = btn.dataset.filter;
      $$('[data-filter]', group).forEach((b) => b.classList.toggle('is-on', b === btn));
      items.forEach((it) => { it.hidden = f !== 'all' && !it.dataset.tags.split(',').includes(f); });
    });
  });

  /* ---------- 公众号二维码 ---------- */
  const qr = $('#qr');
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-qr]')) qr.showModal();
    else if (e.target === qr) qr.close();
  });
})();
