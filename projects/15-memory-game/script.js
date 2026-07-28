(function () {
  const NS = 'memory';
  const ICONS = ['🔧', '🔨', '🪛', '🪚', '🧰', '🔩', '⚙️', '🪜', '🧲', '📏', '✂️', '🖌️'];
  const grid = document.getElementById('mem-grid');
  const gridSizeSel = document.getElementById('grid-size');
  const moveCount = document.getElementById('move-count');
  const timeCount = document.getElementById('time-count');
  const starRating = document.getElementById('star-rating');
  const newGameBtn = document.getElementById('new-game');
  const winBanner = document.getElementById('win-banner');
  const winStats = document.getElementById('win-stats');

  let cards = [], flipped = [], matches = 0, moves = 0, timer = null, seconds = 0, lock = false;

  function dims() {
    const [cols, rows] = gridSizeSel.value.split('x').map(Number);
    return { cols, rows };
  }

  function buildDeck() {
    const { cols, rows } = dims();
    const pairCount = (cols * rows) / 2;
    const chosen = ICONS.slice(0, pairCount);
    const deck = [...chosen, ...chosen]
      .map(icon => ({ icon, id: crypto.randomUUID() }))
      .sort(() => Math.random() - 0.5);
    return deck;
  }

  function renderGrid() {
    const { cols } = dims();
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.innerHTML = cards.map(c => `
      <div class="mem-card" data-id="${c.id}">
        <div class="mem-card-inner">
          <div class="mem-face mem-front">?</div>
          <div class="mem-face mem-back">${c.icon}</div>
        </div>
      </div>`).join('');
  }

  function startTimer() {
    clearInterval(timer);
    seconds = 0;
    timeCount.textContent = '00:00';
    timer = setInterval(() => {
      seconds++;
      timeCount.textContent = Bench.formatTime(seconds);
    }, 1000);
  }

  function newGame() {
    cards = buildDeck();
    flipped = []; matches = 0; moves = 0; lock = false;
    moveCount.textContent = '0';
    starRating.textContent = '☆☆☆';
    winBanner.classList.add('hidden');
    renderGrid();
    startTimer();
  }

  grid.addEventListener('click', e => {
    const cardEl = e.target.closest('.mem-card');
    if (!cardEl || lock) return;
    const id = cardEl.dataset.id;
    if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) return;
    cardEl.classList.add('is-flipped');
    flipped.push({ id, el: cardEl });
    if (flipped.length === 2) {
      moves++;
      moveCount.textContent = moves;
      lock = true;
      const [a, b] = flipped;
      const cardA = cards.find(c => c.id === a.id);
      const cardB = cards.find(c => c.id === b.id);
      if (cardA.icon === cardB.icon) {
        a.el.classList.add('is-matched');
        b.el.classList.add('is-matched');
        matches++;
        flipped = [];
        lock = false;
        if (matches === cards.length / 2) finishGame();
      } else {
        setTimeout(() => {
          a.el.classList.remove('is-flipped');
          b.el.classList.remove('is-flipped');
          flipped = [];
          lock = false;
        }, 800);
      }
    }
  });

  function finishGame() {
    clearInterval(timer);
    const pairCount = cards.length / 2;
    const efficiency = pairCount / moves;
    const stars = efficiency > 0.8 ? 3 : efficiency > 0.5 ? 2 : 1;
    starRating.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    winStats.textContent = `${moves} moves · ${Bench.formatTime(seconds)} · ${'★'.repeat(stars)}`;
    winBanner.classList.remove('hidden');
    const best = Bench.Storage.get(NS, 'best-' + gridSizeSel.value, null);
    if (!best || moves < best.moves) {
      Bench.Storage.set(NS, 'best-' + gridSizeSel.value, { moves, seconds });
      Bench.toast('New best score for this size!', 'success');
    }
  }

  newGameBtn.addEventListener('click', newGame);
  gridSizeSel.addEventListener('change', newGame);

  newGame();
})();
