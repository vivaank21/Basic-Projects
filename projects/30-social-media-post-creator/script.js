(function () {
  const canvas = document.getElementById('post-canvas');
  const ctx = canvas.getContext('2d');
  const formatSelect = document.getElementById('format-select');
  const headlineIn = document.getElementById('post-headline');
  const handleIn = document.getElementById('post-handle');
  const imageInput = document.getElementById('post-image');
  const colorA = document.getElementById('post-color-a');
  const colorB = document.getElementById('post-color-b');
  const downloadBtn = document.getElementById('download-post');

  const SIZES = { square: [400, 400], story: [270, 480], landscape: [480, 270] };
  let bgImage = null;

  function resizeCanvas() {
    const [w, h] = SIZES[formatSelect.value];
    canvas.width = w; canvas.height = h;
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '', lines = [];
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    });
    lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    return lines.length;
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    if (bgImage) {
      const scale = Math.max(W / bgImage.width, H / bgImage.height);
      const iw = bgImage.width * scale, ih = bgImage.height * scale;
      ctx.drawImage(bgImage, (W - iw) / 2, (H - ih) / 2, iw, ih);
      ctx.fillStyle = 'rgba(12,14,19,0.45)';
      ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, colorA.value);
      g.addColorStop(1, colorB.value);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${Math.max(W * 0.075, 20)}px "Space Grotesk", sans-serif`;
    wrapText(headlineIn.value, W * 0.08, H * 0.55, W * 0.84, W * 0.09);

    ctx.font = `${Math.max(W * 0.04, 12)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(handleIn.value, W * 0.08, H * 0.92);

    ctx.fillStyle = colorA.value;
    ctx.fillRect(W * 0.08, H * 0.06, W * 0.16, H * 0.012);
  }

  formatSelect.addEventListener('change', () => { resizeCanvas(); draw(); });
  [headlineIn, handleIn, colorA, colorB].forEach(el => el.addEventListener('input', draw));

  imageInput.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => { bgImage = img; draw(); };
    img.src = URL.createObjectURL(file);
  });

  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `social-post-${formatSelect.value}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  resizeCanvas();
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
