(function () {
  const NS = 'snake';
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const GRID = 20;
  const CELLS = canvas.width / GRID;
  const overlay = document.getElementById('snake-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const skinSel = document.getElementById('skin');
  const soundBtn = document.getElementById('sound-toggle');
  const boardList = document.getElementById('leaderboard-list');

  let snake, dir, nextDir, food, score, best, running, loopId, soundOn = true;
  let audioCtx;

  best = Bench.Storage.get(NS, 'best', 0);
  bestEl.textContent = best;
  let board = Bench.Storage.get(NS, 'leaderboard', []);
  const skins = {
    teal: { head: '#5ec8bd', body: '#3f9089' },
    amber: { head: '#f0a868', body: '#c98a54' },
    stripe: { head: '#e8e6e1', body: '#5b6270' },
  };
  skinSel.value = Bench.Storage.get(NS, 'skin', 'teal');
  soundOn = Bench.Storage.get(NS, 'sound', true);
  soundBtn.textContent = soundOn ? '🔊 Sound' : '🔇 Muted';

  function beep(freq, dur) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = freq;
      o.type = 'square';
      g.gain.value = 0.05;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* noop */ }
  }

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    scoreEl.textContent = score;
    placeFood();
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function draw() {
    ctx.fillStyle = '#0c0e13';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const skin = skins[skinSel.value] || skins.teal;
    ctx.fillStyle = '#e2685f';
    ctx.beginPath();
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2.6, 0, Math.PI * 2);
    ctx.fill();
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? skin.head : (skinSel.value === 'stripe' && i % 2 === 0 ? skin.body : skin.head);
      ctx.fillRect(s.x * GRID + 1, s.y * GRID + 1, GRID - 2, GRID - 2);
    });
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS || snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      beep(660, 0.08);
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    beep(140, 0.3);
    if (score > best) { best = score; Bench.Storage.set(NS, 'best', best); bestEl.textContent = best; }
    board.push({ score, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);
    Bench.Storage.set(NS, 'leaderboard', board);
    renderBoard();
    overlayText.textContent = `Game over — score ${score}`;
    overlayBtn.textContent = 'Play again';
    overlay.classList.remove('hidden');
  }

  function renderBoard() {
    boardList.innerHTML = board.map(b => `<li>${b.score} pts — ${b.date}</li>`).join('') || '<li>No runs yet.</li>';
  }

  function start() {
    reset();
    overlay.classList.add('hidden');
    running = true;
    clearInterval(loopId);
    loopId = setInterval(tick, 110);
    draw();
  }

  overlayBtn.addEventListener('click', start);
  window.addEventListener('keydown', e => {
    const map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
    if (map[e.key]) {
      e.preventDefault();
      const d = map[e.key];
      if (dir.x + d.x !== 0 || dir.y + d.y !== 0) nextDir = d;
    }
    if (e.key === ' ' && !running) start();
  });

  // touch swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; });
  canvas.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.clientX;
    const dy = e.changedTouches[0].clientY - touchStart.clientY;
    if (Math.abs(dx) > Math.abs(dy)) nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    else nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
  });

  skinSel.addEventListener('change', () => Bench.Storage.set(NS, 'skin', skinSel.value));
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    Bench.Storage.set(NS, 'sound', soundOn);
    soundBtn.textContent = soundOn ? '🔊 Sound' : '🔇 Muted';
  });

  reset();
  draw();
  renderBoard();
})();
