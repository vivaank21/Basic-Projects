(function () {
  const NS = 'towerdefense';
  const canvas = document.getElementById('td-canvas');
  const ctx = canvas.getContext('2d');
  const goldOut = document.getElementById('gold-out');
  const livesOut = document.getElementById('lives-out');
  const waveOut = document.getElementById('wave-out');
  const waveBtn = document.getElementById('wave-btn');
  const towerPicker = document.getElementById('tower-picker');
  const overlay = document.getElementById('td-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');

  const GRID = 11;
  const CELL = canvas.width / GRID;

  // zigzag path in grid coords
  const PATH = [];
  (function buildPath() {
    let y = 0;
    for (let x = 0; x < GRID; x++) PATH.push({ x, y });
    for (let i = 1; i <= 2; i++) PATH.push({ x: GRID - 1, y: i });
    y = 2;
    for (let x = GRID - 1; x >= 0; x--) PATH.push({ x, y });
    for (let i = 3; i <= 4; i++) PATH.push({ x: 0, y: i });
    y = 4;
    for (let x = 0; x < GRID; x++) PATH.push({ x, y });
    for (let i = 5; i <= 6; i++) PATH.push({ x: GRID - 1, y: i });
    y = 6;
    for (let x = GRID - 1; x >= 0; x--) PATH.push({ x, y });
    for (let i = 7; i <= 10; i++) PATH.push({ x: 0, y: i });
  })();
  const pathSet = new Set(PATH.map(p => p.x + ',' + p.y));

  const TOWER_DEFS = {
    basic: { cost: 25, range: 2.4, dmg: 1, rate: 500, color: '#5ec8bd', splash: 0 },
    sniper: { cost: 50, range: 5, dmg: 3, rate: 900, color: '#f0a868', splash: 0 },
    splash: { cost: 70, range: 2, dmg: 1, rate: 700, color: '#e2685f', splash: 1.2 },
  };

  let gold, lives, wave, towers, enemies, projectiles, selectedTower, running, raf, waveActive, spawnQueue, spawnTimer;

  function reset() {
    gold = 100; lives = 10; wave = 1;
    towers = []; enemies = []; projectiles = [];
    selectedTower = 'basic';
    waveActive = false; spawnQueue = []; spawnTimer = 0;
    goldOut.textContent = gold; livesOut.textContent = lives; waveOut.textContent = wave;
    updateTowerButtons();
  }

  function updateTowerButtons() {
    [...towerPicker.children].forEach(b => {
      const def = TOWER_DEFS[b.dataset.tower];
      b.disabled = gold < def.cost;
      b.classList.toggle('is-active', b.dataset.tower === selectedTower);
    });
  }

  towerPicker.addEventListener('click', e => {
    const btn = e.target.closest('[data-tower]'); if (!btn) return;
    selectedTower = btn.dataset.tower;
    updateTowerButtons();
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((e.clientX - rect.left) / (rect.width / GRID));
    const gy = Math.floor((e.clientY - rect.top) / (rect.height / GRID));
    if (pathSet.has(gx + ',' + gy)) return;
    if (towers.some(t => t.gx === gx && t.gy === gy)) return;
    const def = TOWER_DEFS[selectedTower];
    if (gold < def.cost) { Bench.toast('Not enough gold', 'warn'); return; }
    gold -= def.cost;
    goldOut.textContent = gold;
    towers.push({ gx, gy, type: selectedTower, lastShot: 0, x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2 });
    updateTowerButtons();
  });

  function sendWave() {
    if (waveActive) return;
    waveActive = true;
    const count = 5 + wave * 2;
    const hp = 2 + Math.floor(wave * 1.4);
    spawnQueue = Array.from({ length: count }, () => ({ hp, maxHp: hp, speed: 0.9 + wave * 0.04, pathIndex: 0, progress: 0 }));
    spawnTimer = 0;
  }

  waveBtn.addEventListener('click', sendWave);

  function update() {
    if (spawnQueue.length) {
      spawnTimer++;
      if (spawnTimer > 30) { spawnTimer = 0; enemies.push(spawnQueue.shift()); }
    }

    enemies.forEach(en => {
      en.progress += en.speed;
      if (en.progress >= CELL) {
        en.progress = 0;
        en.pathIndex++;
      }
      if (en.pathIndex >= PATH.length - 1) {
        en.dead = true;
        lives--;
        livesOut.textContent = lives;
        if (lives <= 0) { gameOver(); }
      } else {
        const a = PATH[en.pathIndex], b = PATH[en.pathIndex + 1];
        const t = en.progress / CELL;
        en.x = (a.x + (b.x - a.x) * t) * CELL + CELL / 2;
        en.y = (a.y + (b.y - a.y) * t) * CELL + CELL / 2;
      }
    });
    enemies = enemies.filter(e => !e.dead);

    const now = performance.now();
    towers.forEach(t => {
      const def = TOWER_DEFS[t.type];
      const target = enemies.find(en => Math.hypot(en.x - t.x, en.y - t.y) < def.range * CELL);
      if (target && now - t.lastShot > def.rate) {
        t.lastShot = now;
        projectiles.push({ x: t.x, y: t.y, target, dmg: def.dmg, splash: def.splash, color: def.color });
      }
    });

    projectiles.forEach(p => {
      if (p.target.dead) { p.hit = true; return; }
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        p.hit = true;
        if (p.splash > 0) {
          enemies.forEach(en => { if (Math.hypot(en.x - p.target.x, en.y - p.target.y) < p.splash * CELL) damageEnemy(en, p.dmg); });
        } else {
          damageEnemy(p.target, p.dmg);
        }
      } else {
        p.x += (dx / dist) * 6;
        p.y += (dy / dist) * 6;
      }
    });
    projectiles = projectiles.filter(p => !p.hit);

    if (waveActive && !spawnQueue.length && enemies.length === 0) {
      waveActive = false;
      wave++;
      waveOut.textContent = wave;
      gold += 20 + wave * 2;
      goldOut.textContent = gold;
      updateTowerButtons();
      Bench.toast(`Wave cleared! +gold`, 'success');
    }
  }

  function damageEnemy(en, dmg) {
    en.hp -= dmg;
    if (en.hp <= 0 && !en.dead) {
      en.dead = true;
      gold += 3;
      goldOut.textContent = gold;
      updateTowerButtons();
    }
  }

  function draw() {
    ctx.fillStyle = '#1a1f2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2a3040';
    PATH.forEach(p => ctx.fillRect(p.x * CELL, p.y * CELL, CELL, CELL));
    ctx.strokeStyle = 'rgba(232,230,225,0.05)';
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }
    towers.forEach(t => {
      ctx.fillStyle = TOWER_DEFS[t.type].color;
      ctx.beginPath(); ctx.arc(t.x, t.y, CELL * 0.32, 0, Math.PI * 2); ctx.fill();
    });
    enemies.forEach(en => {
      ctx.fillStyle = '#e2685f';
      ctx.beginPath(); ctx.arc(en.x, en.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#12151c';
      ctx.fillRect(en.x - 10, en.y - 16, 20, 3);
      ctx.fillStyle = '#5ec8bd';
      ctx.fillRect(en.x - 10, en.y - 16, 20 * (en.hp / en.maxHp), 3);
    });
    projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
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
    const best = Bench.Storage.get(NS, 'best-wave', 1);
    if (wave > best) Bench.Storage.set(NS, 'best-wave', wave);
    overlayText.textContent = `Base overrun at wave ${wave}`;
    overlay.classList.remove('hidden');
  }

  overlayBtn.addEventListener('click', () => {
    reset();
    overlay.classList.add('hidden');
    running = true;
    draw();
    raf = requestAnimationFrame(loop);
  });

  reset();
  running = true;
  draw();
  raf = requestAnimationFrame(loop);
})();
