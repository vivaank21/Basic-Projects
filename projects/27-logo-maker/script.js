(function () {
  const NS = 'logo';
  const canvas = document.getElementById('logo-canvas');
  const ctx = canvas.getContext('2d');
  const textIn = document.getElementById('logo-text');
  const taglineIn = document.getElementById('logo-tagline');
  const emblemGrid = document.getElementById('emblem-grid');
  const layoutSel = document.getElementById('logo-layout');
  const shapeSel = document.getElementById('logo-shape');
  const bgIn = document.getElementById('logo-bg');
  const badgeIn = document.getElementById('logo-badge');
  const fgIn = document.getElementById('logo-fg');
  const downloadBtn = document.getElementById('download-logo');

  const EMBLEMS = ['⚙️', '🔧', '🚀', '⭐', '🦁', '🔥', '🌿', '💎', '🛡️', '⚡', '🌊', '🦉'];
  let emblem = EMBLEMS[0];

  emblemGrid.innerHTML = EMBLEMS.map((e, i) => `<button data-e="${e}" class="${i === 0 ? 'is-active' : ''}">${e}</button>`).join('');

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = bgIn.value;
    ctx.fillRect(0, 0, W, H);

    const layout = layoutSel.value;
    const shape = shapeSel.value;
    const text = textIn.value || 'Brand';
    const tagline = taglineIn.value;

    function drawBadge(cx, cy, r) {
      if (shape === 'none') return;
      ctx.fillStyle = badgeIn.value;
      if (shape === 'circle') {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      } else {
        roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.3);
      }
    }
    function roundRect(x, y, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
      ctx.fill();
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    if (layout === 'icon-only') {
      drawBadge(W / 2, H / 2, 110);
      ctx.font = '120px sans-serif';
      ctx.fillText(emblem, W / 2, H / 2 + 6);
    } else if (layout === 'side') {
      drawBadge(110, H / 2, 70);
      ctx.font = '70px sans-serif';
      ctx.fillText(emblem, 110, H / 2 + 4);
      ctx.fillStyle = fgIn.value;
      ctx.font = '600 34px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(text, 200, tagline ? H / 2 - 12 : H / 2);
      if (tagline) {
        ctx.font = '16px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(232,230,225,0.6)';
        ctx.fillText(tagline, 200, H / 2 + 20);
      }
    } else {
      // stack
      drawBadge(W / 2, 150, 85);
      ctx.font = '90px sans-serif';
      ctx.fillText(emblem, W / 2, 156);
      ctx.fillStyle = fgIn.value;
      ctx.font = '600 34px "Space Grotesk", sans-serif';
      ctx.fillText(text, W / 2, 280);
      if (tagline) {
        ctx.font = '16px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(232,230,225,0.6)';
        ctx.fillText(tagline, W / 2, 312);
      }
    }
  }

  emblemGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-e]'); if (!btn) return;
    emblem = btn.dataset.e;
    [...emblemGrid.children].forEach(b => b.classList.toggle('is-active', b === btn));
    draw();
  });

  [textIn, taglineIn, layoutSel, shapeSel, bgIn, badgeIn, fgIn].forEach(el => el.addEventListener('input', draw));

  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `${(textIn.value || 'logo').replace(/\s+/g, '-').toLowerCase()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
