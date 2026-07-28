(function () {
  const NS = 'gradient';
  const preview = document.getElementById('gradient-preview');
  const cssOutput = document.getElementById('css-output');
  const schemeSelect = document.getElementById('scheme-select');
  const typeSelect = document.getElementById('type-select');
  const angleRange = document.getElementById('angle-range');
  const angleOut = document.getElementById('angle-out');
  const generateBtn = document.getElementById('generate-btn');
  const copyBtn = document.getElementById('copy-css');
  const saveBtn = document.getElementById('save-gradient');
  const savedGrid = document.getElementById('saved-grid');

  let saved = Bench.Storage.get(NS, 'saved', []);
  let currentCss = '';

  function hsl(h, s, l) { return `hsl(${((h % 360) + 360) % 360}, ${s}%, ${l}%)`; }

  function buildColors(scheme) {
    const base = Math.floor(Math.random() * 360);
    const s = 60 + Math.random() * 25;
    const l1 = 45 + Math.random() * 15;
    if (scheme === 'complementary') return [hsl(base, s, l1), hsl(base + 180, s, l1 - 10)];
    if (scheme === 'triadic') return [hsl(base, s, l1), hsl(base + 120, s, l1), hsl(base + 240, s, l1 - 8)];
    if (scheme === 'mono') return [hsl(base, s, l1 + 15), hsl(base, s, l1 - 10), hsl(base, s, l1 - 25)];
    // analogous
    return [hsl(base - 25, s, l1), hsl(base, s, l1 + 5), hsl(base + 25, s, l1 - 5)];
  }

  function buildCss(colors, type, angle) {
    const stops = colors.join(', ');
    if (type === 'radial') return `radial-gradient(circle, ${stops})`;
    if (type === 'conic') return `conic-gradient(from ${angle}deg, ${stops})`;
    return `linear-gradient(${angle}deg, ${stops})`;
  }

  function generate() {
    const colors = buildColors(schemeSelect.value);
    const css = buildCss(colors, typeSelect.value, angleRange.value);
    currentCss = `background: ${css};`;
    preview.style.background = css;
    cssOutput.textContent = currentCss;
  }

  function renderSaved() {
    savedGrid.innerHTML = saved.map((g, i) => `<div class="saved-swatch" style="background:${g}" data-i="${i}" title="Click to load"></div>`).join('') || '<p style="color:var(--muted-2); font-size:.85rem;">No saved gradients yet.</p>';
  }

  generateBtn.addEventListener('click', generate);
  schemeSelect.addEventListener('change', generate);
  typeSelect.addEventListener('change', generate);
  angleRange.addEventListener('input', () => { angleOut.textContent = angleRange.value; generate(); });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentCss).then(() => Bench.toast('CSS copied', 'success'));
  });

  saveBtn.addEventListener('click', () => {
    saved.unshift(preview.style.background);
    saved = saved.slice(0, 12);
    Bench.Storage.set(NS, 'saved', saved);
    renderSaved();
    Bench.toast('Gradient saved', 'success');
  });

  savedGrid.addEventListener('click', e => {
    const sw = e.target.closest('[data-i]'); if (!sw) return;
    const css = saved[+sw.dataset.i];
    preview.style.background = css;
    currentCss = `background: ${css};`;
    cssOutput.textContent = currentCss;
  });

  generate();
  renderSaved();
})();
