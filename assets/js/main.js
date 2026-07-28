/* ==========================================================================
   THE BENCH — hub script
   Catalog data + render + filter/search + GSAP entrance + tilt + theme
   ========================================================================== */

Bench.catalog = [
  { n: 1,  id: 'todo-list',            title: 'Task Board',        cat: 'Productivity', desc: 'Categorized tasks, priority tags, drag-to-reorder, and saved filters.', accent: 'amber' },
  { n: 2,  id: 'calculator',           title: 'Calculator',        cat: 'Utility',       desc: 'Standard and scientific modes with a running history drawer.', accent: 'teal' },
  { n: 3,  id: 'snake-game',           title: 'Snake',             cat: 'Game',          desc: 'Canvas arcade snake with skins, sound toggle, and a local high-score table.', accent: 'amber' },
  { n: 4,  id: 'registration-form',    title: 'Sign-Up Flow',      cat: 'Form',          desc: 'Multi-step registration with live validation and a password-strength meter.', accent: 'teal' },
  { n: 5,  id: 'image-slider',         title: 'Hero Slider',       cat: 'Media',         desc: 'Touch-swipe slider with autoplay, captions, and thumbnail rail.', accent: 'amber' },
  { n: 6,  id: 'bmi-calculator',       title: 'BMI Gauge',         cat: 'Utility',       desc: 'Interactive sliders feeding a live gauge and saved history log.', accent: 'teal' },
  { n: 7,  id: 'password-generator',   title: 'Password Smith',    cat: 'Utility',       desc: 'Entropy-rated passwords with a small saved vault.', accent: 'amber' },
  { n: 8,  id: 'color-generator',      title: 'Palette Forge',     cat: 'Utility',       desc: 'Lock colors, convert HEX/RGB/HSL, and export a saved palette.', accent: 'teal' },
  { n: 9,  id: 'counter-app',          title: 'Counter Bank',      cat: 'Productivity', desc: 'Multiple named counters with step size, targets, and history.', accent: 'amber' },
  { n: 10, id: 'qr-code-generator',    title: 'QR Bench',          cat: 'Utility',       desc: 'Custom QR codes with color, size control, and a scan history log.', accent: 'teal' },
  { n: 11, id: 'weather-app',          title: 'Weather Bench',     cat: 'Data',          desc: 'City search with a 5-day outlook and saved favorite locations.', accent: 'amber' },
  { n: 12, id: 'expense-tracker',      title: 'Ledger',            cat: 'Finance',       desc: 'Income vs. expense bars, category filters, and monthly summaries.', accent: 'teal' },
  { n: 13, id: 'quiz-master',          title: 'Quiz Master',       cat: 'Game',          desc: 'Timed trivia with card-flip reveals and a top-scores board.', accent: 'amber' },
  { n: 14, id: 'pomodoro-timer',       title: 'Focus Timer',       cat: 'Productivity', desc: 'Configurable work/break cycles with streak tracking.', accent: 'teal' },
  { n: 15, id: 'memory-game',          title: 'Memory Flip',       cat: 'Game',          desc: '3D flipping match game across three grid sizes with a move counter.', accent: 'amber' },
  { n: 16, id: 'markdown-notes',       title: 'Markdown Bench',    cat: 'Productivity', desc: 'Live-preview note editor with tags, word count, and export.', accent: 'teal' },
  { n: 17, id: 'typing-speed-test',    title: 'Typing Trial',      cat: 'Game',          desc: 'WPM and accuracy trainer with a live results graph.', accent: 'amber' },
  { n: 18, id: 'recipe-finder',        title: 'Recipe Box',        cat: 'Data',          desc: 'Ingredient filters, cook timers, and bookmarked favorites.', accent: 'teal' },
  { n: 19, id: 'unit-converter',       title: 'Unit Bench',        cat: 'Utility',       desc: 'Currency, length, weight, temperature, and speed conversions.', accent: 'amber' },
  { n: 20, id: 'music-player',         title: 'Sound Deck',        cat: 'Media',         desc: 'Playlist player with an animated visualizer and equalizer.', accent: 'teal' },
  { n: 21, id: 'car-racing-game',      title: 'Car Racing',        cat: 'Game',          desc: 'Lane-dodging racer that speeds up the longer you survive.', accent: 'amber' },
  { n: 22, id: 'treasure-hunter-adventure', title: 'Treasure Hunter', cat: 'Game',       desc: 'Procedural dungeon crawl — grab the gems, dodge the traps.', accent: 'teal' },
  { n: 23, id: 'space-defender',       title: 'Space Defender',     cat: 'Game',          desc: 'Wave-based invader shooter with escalating enemy fire.', accent: 'amber' },
  { n: 24, id: 'zombie-survival-arena', title: 'Zombie Arena',      cat: 'Game',          desc: 'Twin-stick survival against endless waves of the horde.', accent: 'teal' },
  { n: 25, id: 'tower-defense',        title: 'Tower Defense',      cat: 'Game',          desc: 'Place towers, hold the path, survive escalating waves.', accent: 'amber' },
  { n: 26, id: 'ai-gradient-generator', title: 'Gradient Generator', cat: 'Creative',      desc: 'Color-theory palettes turned into ready CSS gradients.', accent: 'teal' },
  { n: 27, id: 'logo-maker',           title: 'Logo Maker',         cat: 'Creative',      desc: 'Emblem, name, and layout combined into an exportable logo.', accent: 'amber' },
  { n: 28, id: 'poster-designer',      title: 'Poster Designer',    cat: 'Creative',      desc: 'Drag-to-place headline and subtitle over a custom background.', accent: 'teal' },
  { n: 29, id: 'pixel-art-studio',     title: 'Pixel Art Studio',   cat: 'Creative',      desc: 'Grid-based pixel painter with fill tool and PNG export.', accent: 'amber' },
  { n: 30, id: 'social-media-post-creator', title: 'Social Post Creator', cat: 'Creative', desc: 'Square, story, or landscape posts, ready to export.', accent: 'teal' },
  { n: 31, id: 'receipt-generator',    title: 'Receipt Generator',  cat: 'Business',      desc: 'Itemized receipts with tax, ready to print or save as PDF.', accent: 'amber' },
  { n: 32, id: 'invoice-generator',    title: 'Invoice Generator',  cat: 'Business',      desc: 'Client invoices with line items, tax, and due dates.', accent: 'teal' },
  { n: 33, id: 'gst-billing-system',   title: 'GST Billing',        cat: 'Business',      desc: 'Indian GST invoices with automatic CGST/SGST/IGST split.', accent: 'amber' },
  { n: 34, id: 'quotation-estimate-maker', title: 'Quotation Maker', cat: 'Business',      desc: 'Client estimates with validity dates and clear terms.', accent: 'teal' },
  { n: 35, id: 'expense-invoice-tracker', title: 'Biz Tracker',      cat: 'Business',      desc: 'Invoiced, collected, pending, and expenses in one view.', accent: 'amber' },
];

(function () {
  const grid = document.getElementById('catalog-grid');
  const search = document.getElementById('catalog-search');
  const filterBar = document.getElementById('catalog-filters');
  const countLabel = document.getElementById('catalog-count');
  let activeFilter = 'All';
  let activeQuery = '';

  function cardHTML(item) {
    const num = String(item.n).padStart(2, '0');
    return `
      <a class="tool-card glass tool-tag reveal" href="projects/${num}-${item.id}/index.html" data-cat="${item.cat}" data-tilt>
        <div class="tool-card-top">
          <span class="tag-number">#${num}</span>
          <span class="tool-card-cat" data-accent="${item.accent}">${item.cat}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <span class="tool-card-go" data-accent="${item.accent}">Open tool &rarr;</span>
      </a>`;
  }

  function render() {
    const q = activeQuery.trim().toLowerCase();
    const items = Bench.catalog.filter((i) => {
      const matchesFilter = activeFilter === 'All' || i.cat === activeFilter;
      const matchesQuery = !q || i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.cat.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    grid.innerHTML = items.map(cardHTML).join('') || `<p class="catalog-empty">No tools match “${activeQuery}.” Try another search or filter.</p>`;
    countLabel.textContent = `${items.length} of ${Bench.catalog.length} tools`;
    initReveal();
    initTilt();
  }

  if (search) {
    search.addEventListener('input', Bench.debounce((e) => {
      activeQuery = e.target.value;
      render();
    }, 150));
  }

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filterBar.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.filter;
      render();
    });
  }

  function initReveal() {
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  }

  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${px * 8}deg`);
        card.style.setProperty('--rx', `${py * -8}deg`);
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--ry', `0deg`);
        card.style.setProperty('--rx', `0deg`);
      });
      card.classList.add('tilt');
    });
  }

  if (grid) render();

  /* -- parallax hero glows follow scroll -- */
  const glows = document.querySelectorAll('.glow');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    glows.forEach((g, i) => {
      g.style.transform = `translateY(${y * (0.08 + i * 0.05)}px)`;
    });
  }, { passive: true });

  /* -- theme switcher: workshop-dark (default) <-> workshop-light -- */
  const themeToggle = document.getElementById('theme-toggle');
  const THEME_KEY = 'hub-theme';
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) themeToggle.textContent = theme === 'light' ? '☀️ Light' : '🌙 Dark';
  }
  const savedTheme = Bench.Storage.get('hub', 'theme', 'dark');
  applyTheme(savedTheme);
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      Bench.Storage.set('hub', 'theme', next);
    });
  }

  /* -- entrance animation (GSAP if present, CSS fallback otherwise) -- */
  window.addEventListener('DOMContentLoaded', () => {
    if (window.gsap) {
      gsap.from('.hero-eyebrow', { y: 16, opacity: 0, duration: .6, ease: 'power2.out' });
      gsap.from('.hero-title span', { y: 40, opacity: 0, duration: .8, stagger: .05, ease: 'power3.out', delay: .1 });
      gsap.from('.hero-desc', { y: 16, opacity: 0, duration: .6, delay: .5, ease: 'power2.out' });
      gsap.from('.hero-stats .stat', { y: 16, opacity: 0, duration: .5, stagger: .08, delay: .65, ease: 'power2.out' });
    }
  });
})();
