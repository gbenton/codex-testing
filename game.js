const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const goldEl = document.getElementById('gold');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const restartBtn = document.getElementById('restart');

const path = [
  { x: -40, y: 110 },
  { x: 240, y: 110 },
  { x: 240, y: 230 },
  { x: 520, y: 230 },
  { x: 520, y: 380 },
  { x: 790, y: 380 },
  { x: 790, y: 160 },
  { x: 950, y: 160 }
];

const state = {
  gold: 150,
  lives: 20,
  wave: 0,
  enemies: [],
  towers: [],
  bullets: [],
  spawning: false,
  gameOver: false,
  win: false,
  waveCount: 8
};

const towerCost = 50;

function resetGame() {
  state.gold = 150;
  state.lives = 20;
  state.wave = 0;
  state.enemies.length = 0;
  state.towers.length = 0;
  state.bullets.length = 0;
  state.spawning = false;
  state.gameOver = false;
  state.win = false;
  overlay.classList.add('hidden');
  nextWave();
}

function nextWave() {
  if (state.wave >= state.waveCount) {
    state.win = true;
    state.gameOver = true;
    showOverlay('You Win!', 'All waves defeated. Great defense!');
    return;
  }

  state.wave += 1;
  state.spawning = true;

  const enemiesToSpawn = 5 + state.wave * 2;
  let spawned = 0;

  const timer = setInterval(() => {
    state.enemies.push(makeEnemy(state.wave));
    spawned += 1;
    if (spawned >= enemiesToSpawn) {
      clearInterval(timer);
      state.spawning = false;
    }
  }, Math.max(260, 560 - state.wave * 40));
}

function makeEnemy(wave) {
  return {
    x: path[0].x,
    y: path[0].y,
    speed: 0.8 + wave * 0.14 + Math.random() * 0.2,
    hp: 24 + wave * 10,
    maxHp: 24 + wave * 10,
    reward: 10 + wave,
    waypoint: 1,
    radius: 12
  };
}

function placeTower(x, y) {
  if (state.gold < towerCost || state.gameOver) return;
  const onPath = pointNearPath(x, y, 40);
  if (onPath) return;

  const tooClose = state.towers.some((tower) => distance(tower.x, tower.y, x, y) < 42);
  if (tooClose) return;

  state.gold -= towerCost;
  state.towers.push({
    x,
    y,
    range: 135,
    cooldown: 0,
    fireRate: 35,
    damage: 16
  });
}

function update() {
  if (state.gameOver) return;

  for (const enemy of state.enemies) {
    moveEnemy(enemy);
  }

  for (const tower of state.towers) {
    tower.cooldown -= 1;
    if (tower.cooldown <= 0) {
      const target = findTarget(tower);
      if (target) {
        tower.cooldown = tower.fireRate;
        state.bullets.push({
          x: tower.x,
          y: tower.y,
          target,
          speed: 5.2,
          damage: tower.damage
        });
      }
    }
  }

  for (const bullet of state.bullets) {
    if (!state.enemies.includes(bullet.target)) continue;
    const dx = bullet.target.x - bullet.x;
    const dy = bullet.target.y - bullet.y;
    const len = Math.hypot(dx, dy) || 1;
    bullet.x += (dx / len) * bullet.speed;
    bullet.y += (dy / len) * bullet.speed;

    if (distance(bullet.x, bullet.y, bullet.target.x, bullet.target.y) < bullet.target.radius) {
      bullet.target.hp -= bullet.damage;
      bullet.hit = true;
    }
  }

  state.bullets = state.bullets.filter((b) => !b.hit && state.enemies.includes(b.target));

  const before = state.enemies.length;
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0 && !enemy.reachedEnd);
  const defeated = before - state.enemies.length;
  state.gold += defeated * (8 + state.wave);

  if (state.lives <= 0) {
    state.gameOver = true;
    showOverlay('Game Over', 'Your base was overrun. Try a new strategy.');
  }

  if (!state.spawning && state.enemies.length === 0 && !state.gameOver) {
    nextWave();
  }

  syncHud();
}

function moveEnemy(enemy) {
  const waypoint = path[enemy.waypoint];
  if (!waypoint) {
    enemy.reachedEnd = true;
    state.lives -= 1;
    return;
  }

  const dx = waypoint.x - enemy.x;
  const dy = waypoint.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;

  if (len < enemy.speed) {
    enemy.x = waypoint.x;
    enemy.y = waypoint.y;
    enemy.waypoint += 1;
    return;
  }

  enemy.x += (dx / len) * enemy.speed;
  enemy.y += (dy / len) * enemy.speed;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPath();
  drawTowers();
  drawEnemies();
  drawBullets();
}

function drawBackground() {
  ctx.fillStyle = '#192536';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#223048';
  for (let y = 0; y < canvas.height; y += 52) {
    for (let x = 0; x < canvas.width; x += 52) {
      ctx.fillRect(x + 1, y + 1, 50, 50);
    }
  }
}

function drawPath() {
  ctx.strokeStyle = '#6f6251';
  ctx.lineWidth = 34;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i += 1) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#93816b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i += 1) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
}

function drawTowers() {
  for (const tower of state.towers) {
    ctx.fillStyle = '#a2d7ff';
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#144166';
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    ctx.fillStyle = '#f67676';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    const hpWidth = 24;
    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#2f2f38';
    ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - 18, hpWidth, 4);
    ctx.fillStyle = '#6dff8d';
    ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - 18, hpWidth * hpRatio, 4);
  }
}

function drawBullets() {
  ctx.fillStyle = '#ffe07c';
  for (const bullet of state.bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function findTarget(tower) {
  let best = null;
  let furthestProgress = -1;

  for (const enemy of state.enemies) {
    if (distance(tower.x, tower.y, enemy.x, enemy.y) <= tower.range) {
      const progress = enemy.waypoint + enemy.x / canvas.width;
      if (progress > furthestProgress) {
        best = enemy;
        furthestProgress = progress;
      }
    }
  }

  return best;
}

function pointNearPath(x, y, threshold) {
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const nearest = projectPointToSegment(x, y, a.x, a.y, b.x, b.y);
    if (distance(x, y, nearest.x, nearest.y) < threshold) {
      return true;
    }
  }
  return false;
}

function projectPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const magSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / magSq));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

function syncHud() {
  goldEl.textContent = String(state.gold);
  livesEl.textContent = String(state.lives);
  waveEl.textContent = `${state.wave}/${state.waveCount}`;
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove('hidden');
}

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  placeTower(x, y);
  syncHud();
});

restartBtn.addEventListener('click', resetGame);

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

resetGame();
syncHud();
gameLoop();
