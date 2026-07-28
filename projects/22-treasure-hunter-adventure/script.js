(function () {
  const NS = 'treasure';
  const canvas = document.getElementById('hunt-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('hunt-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');
  const levelOut = document.getElementById('level-out');
  const gemsOut = document.getElementById('gems-out');
  const movesOut = document.getElementById('moves-out');
  const healthOut = document.getElementById('health-out');

  const GRID = 10;
  const CELL = canvas.width / GRID;

  let level, grid, player, gemsTotal, gemsCollected, moves, health, running;

  function inBounds(x, y) { return x >= 0 && y >= 0 && x < GRID && y < GRID; }

  function bfsReachable(start) {
    const seen = new Set([start.x + ',' + start.y]);
    const q = [start];
    while (q.length) {
      const { x, y } = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        const key = nx + ',' + ny;
        if (inBounds(nx, ny) && !seen.has(key) && grid[ny][nx] !== 'wall') {
          seen.add(key);
          q.push({ x: nx, y: ny });
        }
      });
    }
    return seen;
  }

  function generateLevel() {
    const wallDensity = Math.min(0.12 + level * 0.015, 0.25);
    const gemCount = 4 + Math.min(level, 6);
    const trapCount = 2 + Math.min(level, 5);
    let attempts = 0;
    while (attempts++ < 30) {
      grid = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => 'empty'));
      const start = { x: 0, y: 0 };
      grid[0][0] = 'empty';
      // walls
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
        if ((x === 0 && y === 0)) continue;
        if (Math.random() < wallDensity) grid[y][x] = 'wall';
      }
      const reachable = bfsReachable(start);
      const openCells = [...reachable].filter(k => k !== '0,0').map(k => k.split(',').map(Number));
      if (openCells.length < gemCount + trapCount + 1) continue;
      // shuffle
      for (let i = openCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [openCells[i], openCells[j]] = [openCells[j], openCells[i]];
      }
      let idx = 0;
      for (let i = 0; i < gemCount; i++) { const [x, y] = openCells[idx++]; grid[y][x] = 'gem'; }
      for (let i = 0; i < trapCount; i++) { const [x, y] = openCells[idx++]; grid[y][x] = 'trap'; }
      const [ex, ey] = openCells[idx];
      grid[ey][ex] = 'exit';
      player = { x: 0, y: 0 };
      gemsTotal = gemCount;
      gemsCollected = 0;
      return;
    }
  }

  function render() {
    ctx.fillStyle = '#14181f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const cell = grid[y][x];
        const px = x * CELL, py = y * CELL;
        if (cell === 'wall') { ctx.fillStyle = '#2a3040'; ctx.fillRect(px, py, CELL, CELL); continue; }
        ctx.strokeStyle = 'rgba(232,230,225,0.05)';
        ctx.strokeRect(px, py, CELL, CELL);
        ctx.font = `${CELL * 0.55}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (cell === 'gem') ctx.fillText('💎', px + CELL / 2, py + CELL / 2);
        if (cell === 'trap') ctx.fillText('🕳️', px + CELL / 2, py + CELL / 2);
        if (cell === 'exit') ctx.fillText('🚪', px + CELL / 2, py + CELL / 2);
      }
    }
    ctx.font = `${CELL * 0.6}px sans-serif`;
    ctx.fillText('🧭', player.x * CELL + CELL / 2, player.y * CELL + CELL / 2);
    levelOut.textContent = level;
    gemsOut.textContent = `${gemsCollected}/${gemsTotal}`;
    movesOut.textContent = moves;
    healthOut.textContent = health;
  }

  function tryMove(dx, dy) {
    if (!running) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (!inBounds(nx, ny) || grid[ny][nx] === 'wall') return;
    player.x = nx; player.y = ny;
    moves++;
    const cell = grid[ny][nx];
    if (cell === 'gem') { grid[ny][nx] = 'empty'; gemsCollected++; }
    if (cell === 'trap') {
      grid[ny][nx] = 'empty';
      health--;
      if (health <= 0) { render(); gameOver(false); return; }
    }
    if (cell === 'exit') {
      if (gemsCollected >= gemsTotal) { render(); nextLevel(); return; }
    }
    render();
  }

  function nextLevel() {
    running = false;
    overlayText.textContent = `Level ${level} cleared! Descending further…`;
    overlayBtn.textContent = 'Continue';
    overlay.classList.remove('hidden');
    level++;
  }

  function gameOver(won) {
    running = false;
    overlayText.textContent = won ? 'You made it out!' : 'You ran out of health.';
    overlayBtn.textContent = 'Start over';
    overlay.classList.remove('hidden');
    if (!won) {
      const best = Bench.Storage.get(NS, 'best-level', 1);
      if (level > best) Bench.Storage.set(NS, 'best-level', level);
      level = 1; health = 3; moves = 0;
    }
  }

  function begin() {
    generateLevel();
    moves = 0;
    if (health === undefined || overlayBtn.textContent === 'Start over') health = 3;
    running = true;
    overlay.classList.add('hidden');
    render();
  }

  overlayBtn.addEventListener('click', () => {
    if (overlayBtn.textContent === 'Continue') begin();
    else { level = 1; health = 3; begin(); }
  });

  window.addEventListener('keydown', e => {
    const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    if (map[e.key]) { e.preventDefault(); tryMove(...map[e.key]); }
  });

  level = 1; health = 3; moves = 0;
  generateLevel();
  render();
})();
