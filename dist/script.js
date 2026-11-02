(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* 隐私模式下忽略 */ } },
  };

  $('#year').textContent = new Date().getFullYear();

  /* ---------- 开机页：每个会话只出现一次，带锚点的直达链接跳过 ---------- */
  const boot = $('#boot');
  const enter = () => {
    if (boot.classList.contains('is-gone')) return;
    boot.classList.add('is-gone');
    boot.setAttribute('aria-hidden', 'true');
    store.set('xiaodu-booted', '1');
    document.removeEventListener('keydown', onBootKey);
    setTimeout(() => { boot.hidden = true; main.focus({ preventScroll: true }); }, 500);
  };
  const onBootKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); enter(); }
  };
  if (store.get('xiaodu-booted') || location.hash) {
    boot.hidden = true;
  } else {
    document.addEventListener('keydown', onBootKey);
    boot.addEventListener('click', enter);
    $('#bootEnter').focus();
  }

  /* ---------- 面板切换（hash 路由） ---------- */
  const panels = $$('.panel');
  const navLinks = $$('[data-nav]');
  const main = $('#main');
  const ids = panels.map((p) => p.id);

  const show = (id, focus) => {
    if (!ids.includes(id)) id = 'about';
    panels.forEach((p) => p.classList.toggle('is-active', p.id === id));
    navLinks.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'page'); a.scrollIntoView({ block: 'nearest', inline: 'center' }); }
      else a.removeAttribute('aria-current');
    });
    main.scrollTop = 0;
    if (focus) $('h2', $('#' + id))?.focus?.();
    const c = $('#' + id + ' [data-carousel]');
    if (c) c.refresh?.();
  };

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

  /* ---------- 轮播 ---------- */
  $$('[data-carousel]').forEach((root) => {
    const track = $('.track', root);
    const slides = $$('.slide', root);
    const prev = $('[data-prev]', root);
    const next = $('[data-next]', root);
    const count = $('[data-count]', root);
    const bar = $('[data-progress]', root);
    const pad = (n) => String(n).padStart(2, '0');
    let current = 0;

    const setCurrent = (i) => {
      current = i;
      slides.forEach((s, k) => s.classList.toggle('is-current', k === i));
      count.textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
      bar.style.width = `${((i + 1) / slides.length) * 100}%`;
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };
    const goTo = (i) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      const s = slides[i];
      track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' });
      setCurrent(i);
    };
    const nearest = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      slides.forEach((s, k) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = k; }
      });
      return best;
    };

    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { const n = nearest(); if (n !== current) setCurrent(n); });
    }, { passive: true });
    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    slides.forEach((s, k) => s.addEventListener('click', (e) => {
      if (k !== current && !e.target.closest('a')) { e.preventDefault(); goTo(k); }
    }));

    document.addEventListener('keydown', (e) => {
      if (!root.closest('.panel').classList.contains('is-active') || !boot.hidden) return;
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });

    root.refresh = () => requestAnimationFrame(() => {
      const s = slides[current];
      track.scrollLeft = s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2;
      setCurrent(current);
    });
    root.refresh();
  });
})();
