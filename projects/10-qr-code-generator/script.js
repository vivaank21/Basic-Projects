(function () {
  const NS = 'qr';
  const textIn = document.getElementById('qr-text');
  const sizeIn = document.getElementById('qr-size');
  const sizeOut = document.getElementById('size-out');
  const fgIn = document.getElementById('qr-fg');
  const bgIn = document.getElementById('qr-bg');
  const host = document.getElementById('qr-canvas-host');
  const historyList = document.getElementById('qr-history-list');
  const downloadPngBtn = document.getElementById('qr-download-png');
  const downloadSvgBtn = document.getElementById('qr-download-svg');

  let qr = null;
  let history = Bench.Storage.get(NS, 'history', []);

  function render() {
    host.innerHTML = '';
    const text = textIn.value.trim() || ' ';
    qr = new QRCode(host, {
      text,
      width: +sizeIn.value,
      height: +sizeIn.value,
      colorDark: fgIn.value,
      colorLight: bgIn.value,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function pushHistory() {
    const text = textIn.value.trim();
    if (!text) return;
    history = [text, ...history.filter(h => h !== text)].slice(0, 8);
    Bench.Storage.set(NS, 'history', history);
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = history.map(h => `<li>${h.length > 50 ? h.slice(0, 50) + '…' : h}</li>`).join('') || '<li style="cursor:default;">Nothing generated yet.</li>';
  }

  historyList.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    const idx = [...historyList.children].indexOf(li);
    if (history[idx]) { textIn.value = history[idx]; render(); }
  });

  const debouncedRender = Bench.debounce(() => { render(); pushHistory(); }, 400);
  textIn.addEventListener('input', debouncedRender);
  sizeIn.addEventListener('input', () => { sizeOut.textContent = sizeIn.value; render(); });
  fgIn.addEventListener('input', render);
  bgIn.addEventListener('input', render);

  downloadPngBtn.addEventListener('click', () => {
    const canvas = host.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'qr-code.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  downloadSvgBtn.addEventListener('click', () => {
    const canvas = host.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const size = +sizeIn.value;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><image width="${size}" height="${size}" href="${dataUrl}"/></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.download = 'qr-code.svg';
    a.href = URL.createObjectURL(blob);
    a.click();
  });

  render();
  renderHistory();
})();
