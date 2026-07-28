(function () {
  const NS = 'racing';
  const canvas = document.getElementById('race-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('race-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const speedOut = document.getElementById('speed-out');

  const LANES = 3;
  const ROAD_MARGIN = 30;
  const laneWidth = (canvas.width - ROAD_MARGIN * 2) / LANES;
  const carW = laneWidth * 0.55, carH = 70;

  let best = Bench.Storage.get(NS, 'best', 0);
  bestEl.textContent = best;

  let playerLane, obstacles, score, speed, running, raf, distance;

  function laneX(lane) { return ROAD_MARGIN + lane * laneWidth + laneWidth / 2; }

  function reset() {
    playerLane = 1;
    obstacles = [];
    score = 0;
    speed = 4;
    distance = 0;
    scoreEl.textContent = 0;
    speedOut.textContent = '1.0x';
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANES);
    obstacles.push({ lane, y: -carH, color: ['#e2685f', '#f0a868', '#5ec8bd', '#8b93a1'][Math.floor(Math.random() * 4)] });
  }

  let spawnTimer = 0;
  function update() {
    distance++;
    spawnTimer++;
    const spawnRate = Math.max(40 - Math.floor(speed * 2), 18);
    if (spawnTimer > spawnRate) { spawnObstacle(); spawnTimer = 0; }
    speed = 4 + distance / 500;
    speedOut.textContent = (speed / 4).toFixed(1) + 'x';
    obstacles.forEach(o => (o.y += speed));
    obstacles = obstacles.filter(o => o.y < canvas.height + carH);
    score = Math.floor(distance / 10);
    scoreEl.textContent = score;

    const playerY = canvas.height - carH - 20;
    for (const o of obstacles) {
      if (o.lane === playerLane && o.y + carH > playerY && o.y < playerY + carH) {
        gameOver();
        return;
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#1c2230';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // road lane lines
    ctx.strokeStyle = 'rgba(232,230,225,0.15)';
    ctx.setLineDash([16, 16]);
    ctx.lineWidth = 2;
    for (let l = 1; l < LANES; l++) {
      const x = ROAD_MARGIN + l * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, (distance * -speed) % 32);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // obstacles
    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      roundRect(ctx, laneX(o.lane) - carW / 2, o.y, carW, carH, 8);
    });
    // player
    const playerY = canvas.height - carH - 20;
    ctx.fillStyle = '#5ec8bd';
    roundRect(ctx, laneX(playerLane) - carW / 2, playerY, carW, carH, 8);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    c.fill();
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    if (score > best) { best = score; Bench.Storage.set(NS, 'best', best); bestEl.textContent = best; }
    overlayText.textContent = `Crashed! Score ${score}`;
    overlayBtn.textContent = 'Race again';
    overlay.classList.remove('hidden');
  }

  function start() {
    reset();
    overlay.classList.add('hidden');
    running = true;
    draw();
    raf = requestAnimationFrame(loop);
  }

  overlayBtn.addEventListener('click', start);
  window.addEventListener('keydown', e => {
    if (!running) { if (e.key === ' ') start(); return; }
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) playerLane = Math.max(0, playerLane - 1);
    if (['ArrowRight', 'd', 'D'].includes(e.key)) playerLane = Math.min(LANES - 1, playerLane + 1);
  });

  canvas.addEventListener('pointerdown', e => {
    if (!running) { start(); return; }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) playerLane = Math.max(0, playerLane - 1);
    else playerLane = Math.min(LANES - 1, playerLane + 1);
  });

  reset();
  draw();
})();
