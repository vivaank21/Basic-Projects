(function () {
  const NS = 'zombie';
  const canvas = document.getElementById('arena-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('arena-overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayBtn = document.getElementById('overlay-btn');
  const waveOut = document.getElementById('wave-out');
  const healthOut = document.getElementById('health-out');
  const killsOut = document.getElementById('kills-out');
  const bestOut = document.getElementById('best-out');

  let best = Bench.Storage.get(NS, 'best-wave', 1);
  bestOut.textContent = best;

  const PLAYER_R = 12;
  let player, bullets, zombies, keys, mouse, health, wave, kills, running, raf, spawnLeft, lastShot;

  function reset() {
    player = { x: canvas.width / 2, y: canvas.height / 2 };
    bullets = []; zombies = [];
    keys = {}; mouse = { x: canvas.width / 2 + 40, y: canvas.height / 2 };
    health = 100; wave = 1; kills = 0; lastShot = 0;
    healthOut.textContent = health; waveOut.textContent = wave; killsOut.textContent = kills;
    spawnWave();
  }

  function spawnWave() {
    spawnLeft = 4 + wave * 2;
  }

  function spawnZombie() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * canvas.width; y = -20; }
    else if (edge === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
    else { x = -20; y = Math.random() * canvas.height; }
    zombies.push({ x, y, r: 11, speed: 0.6 + wave * 0.06, hp: 1 + Math.floor(wave / 4) });
  }

  let spawnTimer = 0;
  function update() {
    const speed = 3;
    if (keys.w) player.y -= speed;
    if (keys.s) player.y += speed;
    if (keys.a) player.x -= speed;
    if (keys.d) player.x += speed;
    player.x = Math.max(PLAYER_R, Math.min(canvas.width - PLAYER_R, player.x));
    player.y = Math.max(PLAYER_R, Math.min(canvas.height - PLAYER_R, player.y));

    spawnTimer++;
    if (spawnLeft > 0 && spawnTimer > 45) { spawnTimer = 0; spawnZombie(); spawnLeft--; }

    zombies.forEach(z => {
      const dx = player.x - z.x, dy = player.y - z.y;
      const dist = Math.hypot(dx, dy) || 1;
      z.x += (dx / dist) * z.speed;
      z.y += (dy / dist) * z.speed;
    });

    bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
    bullets = bullets.filter(b => b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20);

    bullets.forEach(b => {
      zombies.forEach(z => {
        if (Math.hypot(b.x - z.x, b.y - z.y) < z.r + 3) {
          z.hp--;
          b.hit = true;
        }
      });
    });
    bullets = bullets.filter(b => !b.hit);
    zombies.forEach(z => { if (z.hp <= 0) { z.dead = true; kills++; killsOut.textContent = kills; } });
    zombies = zombies.filter(z => !z.dead);

    zombies.forEach(z => {
      if (Math.hypot(player.x - z.x, player.y - z.y) < PLAYER_R + z.r) {
        z.dead = true;
        health -= 10;
        healthOut.textContent = Math.max(health, 0);
      }
    });
    zombies = zombies.filter(z => !z.dead);

    if (health <= 0) { gameOver(); return; }
    if (spawnLeft === 0 && zombies.length === 0) { wave++; waveOut.textContent = wave; spawnWave(); }
  }

  function draw() {
    ctx.fillStyle = '#171a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(232,230,225,0.06)';
    for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    ctx.fillStyle = '#5ec8bd';
    ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5ec8bd';
    ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();

    ctx.fillStyle = '#f0a868';
    bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); });

    ctx.fillStyle = '#7a8a4a';
    zombies.forEach(z => { ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); });
  }

  function shoot() {
    const now = performance.now();
    if (now - lastShot < 200) return;
    lastShot = now;
    const dx = mouse.x - player.x, dy = mouse.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    bullets.push({ x: player.x, y: player.y, vx: (dx / dist) * 8, vy: (dy / dist) * 8 });
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
    if (wave > best) { best = wave; Bench.Storage.set(NS, 'best-wave', best); bestOut.textContent = best; }
    overlayText.textContent = `Overrun at wave ${wave} — ${kills} kills`;
    overlayBtn.textContent = 'Try again';
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
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(k)) keys[k] = true;
    if (e.key === ' ' && !running) start();
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(k)) keys[k] = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('mousedown', () => { if (running) shoot(); else start(); });

  let touchStart = null;
  canvas.addEventListener('touchstart', e => {
    if (!running) { start(); return; }
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = (t.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (t.clientY - rect.top) * (canvas.height / rect.height);
    shoot();
  });

  reset();
  draw();
})();
