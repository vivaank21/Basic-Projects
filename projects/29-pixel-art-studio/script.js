(function () {
  const NS = 'pixelart';
  const canvas = document.getElementById('pixel-canvas');
  const ctx = canvas.getContext('2d');
  const gridSizeSel = document.getElementById('grid-size');
  const paletteSwatches = document.getElementById('palette-swatches');
  const customColor = document.getElementById('custom-color');
  const clearBtn = document.getElementById('clear-canvas');
  const downloadBtn = document.getElementById('download-art');
  const toolPencil = document.getElementById('tool-pencil');
  const toolEraser = document.getElementById('tool-eraser');
  const toolFill = document.getElementById('tool-fill');

  const PALETTE = ['#12151c', '#e8e6e1', '#f0a868', '#5ec8bd', '#e2685f', '#8b93a1', '#4fd18a', '#7c5cff'];
  paletteSwatches.innerHTML = PALETTE.map((c, i) => `<button style="background:${c}" data-c="${c}" class="${i === 2 ? 'is-active' : ''}"></button>`).join('');

  let n = +gridSizeSel.value;
  let cell = canvas.width / n;
  let currentColor = PALETTE[2];
  let tool = 'pencil';
  let painting = false;
  let data = loadOrCreate();

  function loadOrCreate() {
    const saved = Bench.Storage.get(NS, 'grid-' + n, null);
    if (saved && saved.length === n) return saved;
    return Array.from({ length: n }, () => Array(n).fill(null));
  }

  function save() { Bench.Storage.set(NS, 'grid-' + n, data); }

  function render() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (data[y][x]) { ctx.fillStyle = data[y][x]; ctx.fillRect(x * cell, y * cell, cell, cell); }
        else {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#f2f2f2' : '#e8e8e8';
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.floor((clientX - rect.left) / (rect.width / n));
    const y = Math.floor((clientY - rect.top) / (rect.height / n));
    return { x, y };
  }

  function floodFill(sx, sy, target, replacement) {
    if (target === replacement) return;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= n || y >= n) continue;
      if (data[y][x] !== target) continue;
      data[y][x] = replacement;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  function paint(x, y, erase) {
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    if (tool === 'fill' && !erase) { floodFill(x, y, data[y][x], currentColor); }
    else data[y][x] = erase ? null : currentColor;
    render();
  }

  canvas.addEventListener('mousedown', e => { painting = true; const { x, y } = cellFromEvent(e); paint(x, y, e.button === 2 || tool === 'eraser'); });
  canvas.addEventListener('mousemove', e => { if (!painting || tool === 'fill') return; const { x, y } = cellFromEvent(e); paint(x, y, tool === 'eraser'); });
  window.addEventListener('mouseup', () => { if (painting) { painting = false; save(); } });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('touchstart', e => { e.preventDefault(); painting = true; const { x, y } = cellFromEvent(e); paint(x, y, tool === 'eraser'); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!painting || tool === 'fill') return; const { x, y } = cellFromEvent(e); paint(x, y, tool === 'eraser'); }, { passive: false });
  window.addEventListener('touchend', () => { if (painting) { painting = false; save(); } });

  paletteSwatches.addEventListener('click', e => {
    const btn = e.target.closest('[data-c]'); if (!btn) return;
    currentColor = btn.dataset.c;
    [...paletteSwatches.children].forEach(b => b.classList.toggle('is-active', b === btn));
  });
  customColor.addEventListener('input', () => { currentColor = customColor.value; [...paletteSwatches.children].forEach(b => b.classList.remove('is-active')); });

  function setTool(t, btn) {
    tool = t;
    [toolPencil, toolEraser, toolFill].forEach(b => b.dataset.active = 'false');
    btn.dataset.active = 'true';
  }
  toolPencil.addEventListener('click', () => setTool('pencil', toolPencil));
  toolEraser.addEventListener('click', () => setTool('eraser', toolEraser));
  toolFill.addEventListener('click', () => setTool('fill', toolFill));

  clearBtn.addEventListener('click', () => { data = Array.from({ length: n }, () => Array(n).fill(null)); save(); render(); });

  gridSizeSel.addEventListener('change', () => {
    n = +gridSizeSel.value;
    cell = canvas.width / n;
    data = loadOrCreate();
    render();
  });

  downloadBtn.addEventListener('click', () => {
    const out = document.createElement('canvas');
    out.width = n; out.height = n;
    const octx = out.getContext('2d');
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      octx.fillStyle = data[y][x] || 'rgba(0,0,0,0)';
      if (data[y][x]) octx.fillRect(x, y, 1, 1);
    }
    const a = document.createElement('a');
    a.download = 'pixel-art.png';
    a.href = out.toDataURL('image/png');
    a.click();
  });

  render();
})();
