(function () {
  const NS = 'typing';
  const PASSAGES = [
    "The quick brown fox jumps over the lazy dog while the sun sets behind the old wooden workshop full of tools and half finished projects.",
    "Great code is not written once and forgotten, it is shaped slowly through small honest revisions that make the next reader's job easier.",
    "A workshop is not defined by how many tools hang on the wall, but by how often each one gets taken down and actually used.",
    "Practice does not make perfect, it makes permanent, so it is worth typing carefully even when the clock is quietly ticking down.",
    "Every keyboard shortcut you learn today saves a small amount of time tomorrow, and those small amounts add up faster than you expect.",
  ];

  const textDisplay = document.getElementById('text-display');
  const typingInput = document.getElementById('typing-input');
  const customBtn = document.getElementById('custom-text-btn');
  const customInput = document.getElementById('custom-input');
  const wpmEl = document.getElementById('wpm');
  const accEl = document.getElementById('accuracy');
  const timeEl = document.getElementById('time-left');
  const durationSel = document.getElementById('duration');
  const restartBtn = document.getElementById('restart-btn');
  const canvas = document.getElementById('wpm-graph');
  const ctx = canvas.getContext('2d');

  let passage = '';
  let chars = [];
  let pos = 0;
  let mistakes = 0;
  let totalTyped = 0;
  let startTime = null;
  let timer = null;
  let duration = 30;
  let remaining = duration;
  let wpmHistory = [];
  let finished = false;

  function pickPassage() {
    passage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
  }

  function renderPassage() {
    chars = passage.split('');
    textDisplay.innerHTML = chars.map((c, i) => `<span data-i="${i}" class="${i === 0 ? 'current' : ''}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  }

  function reset() {
    clearInterval(timer);
    finished = false;
    duration = +durationSel.value;
    remaining = duration;
    timeEl.textContent = `${remaining}s`;
    pos = 0; mistakes = 0; totalTyped = 0; startTime = null;
    wpmHistory = [];
    wpmEl.textContent = '0';
    accEl.textContent = '100%';
    pickPassage();
    renderPassage();
    typingInput.value = '';
    typingInput.classList.remove('hidden');
    typingInput.focus();
    drawGraph();
  }

  function startTimerIfNeeded() {
    if (startTime) return;
    startTime = Date.now();
    timer = setInterval(() => {
      remaining--;
      timeEl.textContent = `${remaining}s`;
      updateStats();
      wpmHistory.push(+wpmEl.textContent);
      drawGraph();
      if (remaining <= 0) finish();
    }, 1000);
  }

  function updateStats() {
    const elapsedMin = Math.max((Date.now() - startTime) / 60000, 1 / 60);
    const wordsTyped = pos / 5;
    wpmEl.textContent = Math.round(wordsTyped / elapsedMin);
    const acc = totalTyped ? Math.round(((totalTyped - mistakes) / totalTyped) * 100) : 100;
    accEl.textContent = `${Math.max(acc, 0)}%`;
  }

  function finish() {
    clearInterval(timer);
    finished = true;
    typingInput.blur();
    Bench.toast(`Done — ${wpmEl.textContent} WPM at ${accEl.textContent} accuracy`, 'success');
    const best = Bench.Storage.get(NS, 'best-' + duration, 0);
    const wpm = +wpmEl.textContent;
    if (wpm > best) Bench.Storage.set(NS, 'best-' + duration, wpm);
  }

  typingInput.addEventListener('input', () => {
    if (finished) return;
    startTimerIfNeeded();
    const typed = typingInput.value;
    totalTyped++;
    const spans = textDisplay.children;
    for (let i = 0; i < spans.length; i++) spans[i].className = i === typed.length ? 'current' : '';
    let localMistakes = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === chars[i]) spans[i].classList.add('correct');
      else { spans[i].classList.add('incorrect'); localMistakes++; }
    }
    mistakes = localMistakes;
    pos = typed.length;
    updateStats();
    if (typed.length >= chars.length) finish();
  });

  function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(232,230,225,0.08)';
    for (let y = 0; y < canvas.height; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    if (wpmHistory.length < 2) return;
    const max = Math.max(...wpmHistory, 20);
    ctx.strokeStyle = '#f0a868';
    ctx.lineWidth = 2;
    ctx.beginPath();
    wpmHistory.forEach((v, i) => {
      const x = (i / (wpmHistory.length - 1)) * canvas.width;
      const y = canvas.height - (v / max) * (canvas.height - 10) - 5;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  customBtn.addEventListener('click', () => {
    customInput.classList.toggle('hidden');
    customInput.focus();
  });
  customInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (customInput.value.trim()) {
        passage = customInput.value.trim();
        customInput.classList.add('hidden');
        pos = 0; mistakes = 0; totalTyped = 0; startTime = null;
        clearInterval(timer);
        remaining = duration;
        timeEl.textContent = `${remaining}s`;
        renderPassage();
        typingInput.value = '';
        typingInput.focus();
      }
    }
  });

  durationSel.addEventListener('change', reset);
  restartBtn.addEventListener('click', reset);

  reset();
})();
