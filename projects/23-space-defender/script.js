(function () {
  const NS = 'defender';
  const canvas = document.getElementById('defender-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('defender-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');
  const scoreEl = document.getElementById('score');
  const waveOut = document.getElementById('wave-out');
  const livesOut = document.getElementById('lives-out');
  const bestEl = document.getElementById('best');

  let best = Bench.Storage.get(NS, 'best', 0);
  bestEl.textContent = best;

  const SHIP_W = 36, SHIP_H = 24;
  let ship, bullets, enemies, enemyBullets, score, wave, lives, running, raf, keys = {};
  let lastShot = 0, enemyDir = 1, enemyStepTimer = 0;

  function reset() {
    ship = { x: canvas.width / 2 - SHIP_W / 2, y: canvas.height - 50 };
    bullets = []; enemyBullets = [];
    score = 0; wave = 1; lives = 3;
    scoreEl.textContent = 0; waveOut.textContent = 1; livesOut.textContent = 3;
    spawnWave();
  }

  function spawnWave() {
    enemies = [];
    const cols = 6, rows = Math.min(2 + Math.floor(wave / 2), 5);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        enemies.push({ x: 30 + c * 52, y: 30 + r * 40, alive: true, w: 30, h: 22 });
      }
    }
    enemyDir = 1;
  }

  function shoot() {
    const now = performance.now();
    if (now - lastShot < 250) return;
    lastShot = now;
    bullets.push({ x: ship.x + SHIP_W / 2 - 2, y: ship.y, w: 4, h: 12 });
  }

  function update() {
    if (keys.left) ship.x -= 5;
    if (keys.right) ship.x += 5;
    ship.x = Math.max(0, Math.min(canvas.width - SHIP_W, ship.x));

    bullets.forEach(b => (b.y -= 8));
    bullets = bullets.filter(b => b.y > -20);
    enemyBullets.forEach(b => (b.y += 5));
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);

    // enemy movement (invader-style side-step)
    enemyStepTimer++;
    const speed = Math.max(30 - wave * 2, 8);
    if (enemyStepTimer > speed) {
      enemyStepTimer = 0;
      let hitEdge = false;
      enemies.forEach(e => {
        if (!e.alive) return;
        e.x += enemyDir * 8;
        if (e.x < 5 || e.x > canvas.width - e.w - 5) hitEdge = true;
      });
      if (hitEdge) {
        enemyDir *= -1;
        enemies.forEach(e => (e.y += 14));
      }
    }

    // random enemy fire
    if (Math.random() < 0.02 + wave * 0.003) {
      const alive = enemies.filter(e => e.alive);
      if (alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        enemyBullets.push({ x: shooter.x + shooter.w / 2 - 2, y: shooter.y + shooter.h, w: 4, h: 10 });
      }
    }

    // bullet-enemy collision
    bullets.forEach(b => {
      enemies.forEach(e => {
        if (e.alive && b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          e.alive = false;
          b.y = -100;
          score += 10;
          scoreEl.textContent = score;
        }
      });
    });

    // enemy bullet-ship collision
    enemyBullets.forEach(b => {
      if (b.x < ship.x + SHIP_W && b.x + b.w > ship.x && b.y < ship.y + SHIP_H && b.y + b.h > ship.y) {
        b.y = canvas.height + 100;
        loseLife();
      }
    });

    // enemy reaches ship
    if (enemies.some(e => e.alive && e.y + e.h >= ship.y)) {
      loseLife();
      enemies.forEach(e => (e.y = 30));
    }

    if (enemies.every(e => !e.alive)) {
      wave++;
      waveOut.textContent = wave;
      spawnWave();
    }
  }

  function loseLife() {
    lives--;
    livesOut.textContent = lives;
    if (lives <= 0) gameOver();
  }

  function draw() {
    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#5ec8bd';
    ctx.fillRect(ship.x, ship.y, SHIP_W, SHIP_H);
    ctx.fillStyle = '#f0a868';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = '#e2685f';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = '#8b93a1';
    enemies.forEach(e => { if (e.alive) ctx.fillRect(e.x, e.y, e.w, e.h); });
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
    overlayText.textContent = `Ship destroyed — score ${score}`;
    overlayBtn.textContent = 'Launch again';
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
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = true;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = true;
    if (e.key === ' ') { e.preventDefault(); shoot(); }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = false;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
  });

  canvas.addEventListener('pointerdown', e => {
    if (!running) { start(); return; }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (y < rect.height * 0.3) shoot();
    else if (x < rect.width / 2) keys.left = true;
    else keys.right = true;
  });
  canvas.addEventListener('pointerup', () => { keys.left = false; keys.right = false; });

  reset();
  draw();
})();
