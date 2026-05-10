// Portfolio JS — vanilla, no deps.
(() => {
  'use strict';

  // ---- Mobile nav toggle ----------------------------------------------------
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  if (toggle && header) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close menu on link click (mobile UX)
    header.querySelectorAll('.nav__list a').forEach(a => {
      a.addEventListener('click', () => {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Scroll meter (VU-flavored progress bar in inner pages) --------------
  const meter = document.querySelector('.scroll-meter');
  if (meter) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      meter.style.setProperty('--scroll', pct.toFixed(2) + '%');
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  // ---- Reveal on scroll -----------------------------------------------------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // ---- Portfolio filters ----------------------------------------------------
  const filterBar = document.querySelector('.filters');
  if (filterBar) {
    const works = document.querySelectorAll('#works .work');
    filterBar.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.filter');
      if (!btn) return;
      filterBar.querySelectorAll('.filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      works.forEach(w => {
        const tags = (w.dataset.tags || '').split(',').map(s => s.trim());
        const show = f === '*' || tags.includes(f);
        w.classList.toggle('is-hidden', !show);
      });
    });
  }

  // ---- Audio players --------------------------------------------------------
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${r}`;
  };

  let currentAudio = null;
  let currentPlayer = null;

  const stopCurrent = () => {
    if (currentAudio) {
      currentAudio.pause();
      if (currentPlayer) togglePlayerUI(currentPlayer, false);
    }
  };

  const togglePlayerUI = (player, playing) => {
    const playIco  = player.querySelector('.icon-play');
    const pauseIco = player.querySelector('.icon-pause');
    if (playIco)  playIco.style.display  = playing ? 'none' : '';
    if (pauseIco) pauseIco.style.display = playing ? '' : 'none';
    const btn = player.querySelector('.player__btn');
    if (btn) btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  };

  document.querySelectorAll('.player').forEach(player => {
    const src   = player.dataset.src;
    const btn   = player.querySelector('.player__btn');
    const bar   = player.querySelector('.player__bar');
    const prog  = player.querySelector('.player__progress');
    const time  = player.querySelector('.player__time');

    let audio = null;

    const ensureAudio = () => {
      if (audio) return audio;
      audio = new Audio();
      audio.preload = 'metadata';
      audio.src = src;
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        prog.style.width = pct + '%';
        time.textContent = fmt(audio.currentTime);
        bar.setAttribute('aria-valuenow', Math.round(pct));
      });
      audio.addEventListener('loadedmetadata', () => {
        time.textContent = fmt(audio.duration);
      });
      audio.addEventListener('ended', () => {
        togglePlayerUI(player, false);
        prog.style.width = '0%';
        time.textContent = fmt(audio.duration || 0);
      });
      audio.addEventListener('error', () => {
        time.textContent = '—:—';
        btn.disabled = true;
        btn.title = 'Audio non disponibile';
      });
      return audio;
    };

    btn.addEventListener('click', () => {
      const a = ensureAudio();
      if (a.paused) {
        if (currentAudio && currentAudio !== a) stopCurrent();
        a.play().then(() => {
          currentAudio = a;
          currentPlayer = player;
          togglePlayerUI(player, true);
        }).catch(() => {
          // playback blocked or file missing
          togglePlayerUI(player, false);
        });
      } else {
        a.pause();
        togglePlayerUI(player, false);
      }
    });

    const seekFromEvent = (ev) => {
      const a = ensureAudio();
      const rect = bar.getBoundingClientRect();
      const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      if (a.duration) a.currentTime = pct * a.duration;
    };
    bar.addEventListener('click', seekFromEvent);
    bar.addEventListener('keydown', (ev) => {
      const a = ensureAudio();
      if (!a.duration) return;
      if (ev.key === 'ArrowRight') a.currentTime = Math.min(a.duration, a.currentTime + 5);
      if (ev.key === 'ArrowLeft')  a.currentTime = Math.max(0, a.currentTime - 5);
    });
  });

  // ---- Year in footer (defensive, in case PHP is bypassed) ------------------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
