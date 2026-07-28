(function () {
  const NS = 'palette';
  const row = document.getElementById('palette-row');
  const shuffleBtn = document.getElementById('shuffle');
  const saveBtn = document.getElementById('save-palette');
  const savedList = document.getElementById('saved-list');

  let colors = Bench.Storage.get(NS, 'current', null) || Array.from({ length: 5 }, randomColor);
  let locked = Bench.Storage.get(NS, 'locked', [false, false, false, false, false]);
  let format = 'hex';
  let saved = Bench.Storage.get(NS, 'saved', []);

  function randomColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 55 + Math.floor(Math.random() * 35);
    const l = 40 + Math.floor(Math.random() * 30);
    return { h, s, l };
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  }

  function label(c) {
    const hex = hslToHex(c.h, c.s, c.l);
    if (format === 'hex') return hex;
    if (format === 'rgb') return hexToRgb(hex);
    return `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
  }

  function textColorFor(l) { return l > 60 ? '#12151c' : '#e8e6e1'; }

  function render() {
    row.innerHTML = colors.map((c, i) => `
      <div class="swatch" style="background:${hslToHex(c.h, c.s, c.l)}; color:${textColorFor(c.l)};" data-i="${i}">
        <span class="lock-icon" data-lock="${i}">${locked[i] ? '🔒' : '🔓'}</span>
        <span class="swatch-code" data-code="${i}">${label(c)}</span>
      </div>`).join('');
    Bench.Storage.set(NS, 'current', colors);
    Bench.Storage.set(NS, 'locked', locked);
  }

  function shuffle() {
    colors = colors.map((c, i) => (locked[i] ? c : randomColor()));
    render();
  }

  row.addEventListener('click', e => {
    const lockEl = e.target.closest('[data-lock]');
    if (lockEl) {
      const i = +lockEl.dataset.lock;
      locked[i] = !locked[i];
      render();
      return;
    }
    const codeEl = e.target.closest('[data-code]');
    if (codeEl) {
      const hex = hslToHex(colors[+codeEl.dataset.code].h, colors[+codeEl.dataset.code].s, colors[+codeEl.dataset.code].l);
      navigator.clipboard.writeText(label(colors[+codeEl.dataset.code])).then(() => Bench.toast(`Copied ${label(colors[+codeEl.dataset.code])}`, 'success'));
    }
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      shuffle();
    }
  });

  shuffleBtn.addEventListener('click', shuffle);

  // cycle format by clicking title area (double-click swatch)
  row.addEventListener('dblclick', () => {
    format = format === 'hex' ? 'rgb' : format === 'rgb' ? 'hsl' : 'hex';
    render();
    Bench.toast(`Showing ${format.toUpperCase()}`, 'info');
  });

  function renderSaved() {
    savedList.innerHTML = saved.map(p => `
      <div class="saved-swatch-row">
        ${p.map(c => `<div style="background:${hslToHex(c.h, c.s, c.l)}"></div>`).join('')}
      </div>`).join('') || '<p style="color:var(--muted-2); font-size:.85rem;">No saved palettes yet — generate one and save it.</p>';
  }

  saveBtn.addEventListener('click', () => {
    saved.unshift(colors.map(c => ({ ...c })));
    saved = saved.slice(0, 8);
    Bench.Storage.set(NS, 'saved', saved);
    renderSaved();
    Bench.toast('Palette saved', 'success');
  });

  render();
  renderSaved();
})();
