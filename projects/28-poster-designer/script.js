(function () {
  const canvas = document.getElementById('poster-canvas');
  const ctx = canvas.getContext('2d');
  const titleIn = document.getElementById('poster-title');
  const subtitleIn = document.getElementById('poster-subtitle');
  const bgStyleSel = document.getElementById('bg-style');
  const colorA = document.getElementById('color-a');
  const colorB = document.getElementById('color-b');
  const textColor = document.getElementById('text-color');
  const titleSize = document.getElementById('title-size');
  const sizeOut = document.getElementById('size-out');
  const imageUpload = document.getElementById('image-upload');
  const downloadBtn = document.getElementById('download-poster');

  const W = canvas.width, H = canvas.height;
  let titlePos = { x: W / 2, y: H * 0.6 };
  let subPos = { x: W / 2, y: H * 0.6 + 50 };
  let bgImage = null;
  let dragging = null;

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '', lines = [];
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    });
    lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  function draw() {
    if (bgStyleSel.value === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, colorA.value);
      g.addColorStop(1, colorB.value);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = colorA.value;
    }
    ctx.fillRect(0, 0, W, H);

    if (bgImage) {
      const scale = Math.max(W / bgImage.width, H / bgImage.height);
      const iw = bgImage.width * scale, ih = bgImage.height * scale;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(bgImage, (W - iw) / 2, (H - ih) / 2, iw, ih);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor.value;
    ctx.font = `700 ${titleSize.value}px "Space Grotesk", sans-serif`;
    wrapText(titleIn.value.toUpperCase(), titlePos.x, titlePos.y, W * 0.85, +titleSize.value * 1.1);

    ctx.font = `16px "JetBrains Mono", monospace`;
    ctx.fillStyle = textColor.value;
    ctx.globalAlpha = 0.85;
    ctx.fillText(subtitleIn.value, subPos.x, subPos.y);
    ctx.globalAlpha = 1;
  }

  [titleIn, subtitleIn, bgStyleSel, colorA, colorB, textColor].forEach(el => el.addEventListener('input', draw));
  titleSize.addEventListener('input', () => { sizeOut.textContent = titleSize.value; draw(); });

  imageUpload.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => { bgImage = img; draw(); };
    img.src = URL.createObjectURL(file);
  });

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (W / rect.width), y: (clientY - rect.top) * (H / rect.height) };
  }

  function startDrag(e) {
    const p = canvasPos(e);
    const dt = Math.hypot(p.x - titlePos.x, p.y - titlePos.y);
    const ds = Math.hypot(p.x - subPos.x, p.y - subPos.y);
    if (dt < 50) dragging = 'title';
    else if (ds < 40) dragging = 'sub';
  }
  function moveDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = canvasPos(e);
    if (dragging === 'title') titlePos = p; else subPos = p;
    draw();
  }
  function endDrag() { dragging = null; }

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', endDrag);
  canvas.addEventListener('touchstart', startDrag);
  canvas.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', endDrag);

  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'poster.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
