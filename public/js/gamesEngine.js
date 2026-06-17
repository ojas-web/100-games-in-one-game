class GameEngine {
  constructor(canvas, game, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.cb = callbacks;
    this.running = false;
    this.paused = false;
    this.score = 0;
    this.high = Number(localStorage.getItem(`high_${game.id}`) || 0);
    this.keys = {};
    this.pointer = { x: 0, y: 0, down: false };
    this.last = 0;
    this.resize();
    this.resetWorld();
    this.bind();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(320, rect.width * dpr);
    this.canvas.height = Math.max(240, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  resetWorld() {
    this.dir = { x: 1, y: 0 };
    this.player = { x: this.w * 0.3, y: this.h * 0.5, vx: 0, vy: 0, r: 14 };
    this.player2 = { x: this.w * 0.7, y: this.h * 0.5, vx: 0, vy: 0, r: 14 };
    this.ball = { x: this.w / 2, y: this.h / 2, vx: 3, vy: 2, r: 10 };
    this.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
    this.food = { x: 14, y: 8 };
    this.tiles = Array.from({ length: 16 }, (_, i) => ({ value: i % 8, open: false, hit: false }));
    this.items = [];
    this.obstacles = [];
    this.cooldown = 0;
    this.tick = 0;
  }

  bind() {
    addEventListener('resize', () => { this.resize(); this.resetWorld(); });
    addEventListener('keydown', event => { this.keys[event.key.toLowerCase()] = true; this.keyMove(event.key.toLowerCase()); });
    addEventListener('keyup', event => { this.keys[event.key.toLowerCase()] = false; });
    let sx = 0;
    let sy = 0;
    const pos = event => {
      const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
      const rect = this.canvas.getBoundingClientRect();
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };
    this.canvas.addEventListener('pointerdown', event => { this.pointer = { ...pos(event), down: true }; this.tap(this.pointer); });
    this.canvas.addEventListener('pointermove', event => { if (this.pointer.down) this.pointer = { ...pos(event), down: true }; });
    this.canvas.addEventListener('pointerup', () => { this.pointer.down = false; });
    this.canvas.addEventListener('touchstart', event => { document.body.classList.add('playing'); sx = event.touches[0].clientX; sy = event.touches[0].clientY; event.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', event => event.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - sx;
      const dy = touch.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) this.swipe(dx, dy);
      event.preventDefault();
    }, { passive: false });
  }

  keyMove(key) {
    if (key === 'arrowup' || key === 'w') this.dir = { x: 0, y: -1 };
    if (key === 'arrowdown' || key === 's') this.dir = { x: 0, y: 1 };
    if (key === 'arrowleft' || key === 'a') this.dir = { x: -1, y: 0 };
    if (key === 'arrowright' || key === 'd') this.dir = { x: 1, y: 0 };
    if (key === ' ') this.fire(this.player);
  }

  swipe(dx, dy) {
    this.dir = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    if (this.game.type === 'sports') this.score += Math.max(5, Math.floor(Math.hypot(dx, dy) / 4));
  }

  tap(point) {
    if (['puzzle', 'board', 'strategy'].includes(this.game.type)) {
      const col = Math.floor(point.x / (this.w / 4));
      const row = Math.floor(point.y / (this.h / 4));
      const tile = this.tiles[row * 4 + col];
      if (tile && !tile.hit) { tile.open = !tile.open; tile.hit = true; this.score += 20; }
      return;
    }
    this.fire({ x: point.x, y: point.y, r: 8 });
  }

  control(action) {
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    if (map[action]) this.dir = { x: map[action][0], y: map[action][1] };
    if (action === 'fire' || action === 'jump') this.fire(this.player);
  }

  fire(origin) {
    this.items.push({ kind: 'shot', x: origin.x, y: origin.y, vx: 7, vy: 0, r: 5, life: 90 });
    this.score += 3;
  }

  start() {
    this.running = true;
    this.paused = false;
    this.score = 0;
    this.resetWorld();
    requestAnimationFrame(time => this.loop(time));
  }

  pause() {
    this.paused = !this.paused;
    if (!this.paused) requestAnimationFrame(time => this.loop(time));
  }

  restart() { this.start(); }

  loop(time) {
    if (!this.running || this.paused) return;
    const dt = Math.min(32, time - this.last || 16);
    this.last = time;
    this.update(dt);
    this.draw();
    this.cb.onScore?.(Math.floor(this.score), this.high);
    requestAnimationFrame(next => this.loop(next));
  }

  update(dt) {
    this.tick += dt;
    const updater = {
      snake: () => this.updateSnake(), pong: () => this.updatePong(dt), puzzle: () => this.updatePuzzle(),
      racing: () => this.updateRacing(dt), shooter: () => this.updateShooter(dt), platformer: () => this.updatePlatformer(dt),
      sports: () => this.updateSports(dt), board: () => this.updatePuzzle(), strategy: () => this.updateStrategy(),
      multiplayer: () => this.updateMultiplayer(dt), arcade: () => this.updateArcade(dt)
    }[this.game.type] || (() => this.updateArcade(dt));
    updater();
    this.items.forEach(item => { item.x += item.vx || 0; item.y += item.vy || 0; item.life--; });
    this.items = this.items.filter(item => item.life > 0 && item.x > -20 && item.x < this.w + 20 && item.y > -20 && item.y < this.h + 20);
    if (this.score > this.high) { this.high = Math.floor(this.score); localStorage.setItem(`high_${this.game.id}`, this.high); }
  }

  movePlayer(player, speed = 3) {
    if (this.keys.a) player.x -= speed;
    if (this.keys.d) player.x += speed;
    if (this.keys.w) player.y -= speed;
    if (this.keys.s) player.y += speed;
    if (this.keys.arrowleft) player.x -= speed;
    if (this.keys.arrowright) player.x += speed;
    if (this.keys.arrowup) player.y -= speed;
    if (this.keys.arrowdown) player.y += speed;
    player.x += this.dir.x * speed * 0.45;
    player.y += this.dir.y * speed * 0.45;
    player.x = Math.max(player.r, Math.min(this.w - player.r, player.x));
    player.y = Math.max(player.r, Math.min(this.h - player.r, player.y));
  }

  updateSnake() {
    if (this.tick < 115) return;
    this.tick = 0;
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= 24 || head.y >= 16 || this.snake.some(cell => cell.x === head.x && cell.y === head.y)) {
      this.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      this.score = Math.max(0, this.score - 25);
      return;
    }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 50;
      this.food = { x: Math.floor(Math.random() * 24), y: Math.floor(Math.random() * 16) };
    } else this.snake.pop();
  }

  updatePong(dt) {
    const paddleY = this.pointer.down ? this.pointer.y : this.player.y;
    this.player.y += (paddleY - this.player.y) * 0.2;
    this.player2.y += (this.ball.y - this.player2.y) * 0.06;
    this.ball.x += this.ball.vx * dt / 16;
    this.ball.y += this.ball.vy * dt / 16;
    if (this.ball.y < 10 || this.ball.y > this.h - 10) this.ball.vy *= -1;
    if (Math.abs(this.ball.x - 30) < 15 && Math.abs(this.ball.y - this.player.y) < 55) { this.ball.vx = Math.abs(this.ball.vx) + 0.2; this.score += 12; }
    if (Math.abs(this.ball.x - (this.w - 30)) < 15 && Math.abs(this.ball.y - this.player2.y) < 55) this.ball.vx = -Math.abs(this.ball.vx) - 0.1;
    if (this.ball.x < 0 || this.ball.x > this.w) this.ball = { x: this.w / 2, y: this.h / 2, vx: this.ball.x < 0 ? 3 : -3, vy: 2, r: 10 };
  }

  updatePuzzle() { if (this.tiles.every(tile => tile.hit)) { this.tiles.forEach(tile => { tile.hit = false; tile.open = false; }); this.score += 100; } }

  updateRacing(dt) {
    this.movePlayer(this.player, 4.2);
    if (Math.random() < 0.04) this.obstacles.push({ x: Math.random() * this.w, y: -20, w: 28, h: 48, speed: 2 + Math.random() * 4 });
    this.obstacles.forEach(o => { o.y += o.speed * dt / 16; });
    this.obstacles = this.obstacles.filter(o => o.y < this.h + 60);
    this.obstacles.forEach(o => { if (Math.abs(o.x - this.player.x) < 28 && Math.abs(o.y - this.player.y) < 40) this.score = Math.max(0, this.score - 1); });
    this.score += 0.12;
  }

  updateShooter(dt) {
    this.movePlayer(this.player, 3.2);
    if (this.pointer.down && this.cooldown-- <= 0) { this.fire(this.player); this.cooldown = 10; }
    if (Math.random() < 0.035) this.obstacles.push({ x: this.w + 20, y: Math.random() * this.h, w: 24, h: 24, speed: 2 + Math.random() * 3 });
    this.obstacles.forEach(o => { o.x -= o.speed * dt / 16; });
    this.items.filter(i => i.kind === 'shot').forEach(shot => this.obstacles.forEach(o => { if (Math.hypot(shot.x - o.x, shot.y - o.y) < 24) { o.hit = true; shot.life = 0; this.score += 30; } }));
    this.obstacles = this.obstacles.filter(o => !o.hit && o.x > -50);
  }

  updatePlatformer(dt) {
    this.player.vy += 0.45;
    if (this.keys.w || this.keys.arrowup || this.dir.y < 0) this.player.vy = Math.min(this.player.vy, -7);
    this.player.x += (this.dir.x * 3 + (this.keys.a ? -3 : 0) + (this.keys.d ? 3 : 0)) * dt / 16;
    this.player.y += this.player.vy * dt / 16;
    if (this.player.y > this.h - 32) { this.player.y = this.h - 32; this.player.vy = -9; this.score += 2; }
    this.player.x = (this.player.x + this.w) % this.w;
  }

  updateSports() {
    const target = { x: this.w * 0.78, y: this.h * 0.35 };
    if (this.items.some(i => Math.hypot(i.x - target.x, i.y - target.y) < 40)) this.score += 25;
  }

  updateStrategy() {
    if (this.tick > 900) { this.tick = 0; this.score += 10 + this.tiles.filter(t => t.hit).length * 3; }
  }

  updateMultiplayer(dt) {
    const speed = 3.4;
    if (this.keys.a) this.player.x -= speed;
    if (this.keys.d) this.player.x += speed;
    if (this.keys.w) this.player.y -= speed;
    if (this.keys.s) this.player.y += speed;
    if (this.keys.arrowleft) this.player2.x -= speed;
    if (this.keys.arrowright) this.player2.x += speed;
    if (this.keys.arrowup) this.player2.y -= speed;
    if (this.keys.arrowdown) this.player2.y += speed;
    this.player.x += this.dir.x * speed * 0.4;
    this.player.y += this.dir.y * speed * 0.4;
    this.player.x = Math.max(14, Math.min(this.w - 14, this.player.x));
    this.player.y = Math.max(14, Math.min(this.h - 14, this.player.y));
    this.player2.x = Math.max(14, Math.min(this.w - 14, this.player2.x));
    this.player2.y = Math.max(14, Math.min(this.h - 14, this.player2.y));
    if (Math.hypot(this.player.x - this.player2.x, this.player.y - this.player2.y) < 35) this.score += 0.4;
    this.score += 0.04 * dt / 16;
  }

  updateArcade(dt) {
    this.movePlayer(this.player, 3);
    if (Math.random() < 0.025) this.items.push({ kind: 'gem', x: Math.random() * this.w, y: Math.random() * this.h, r: 10, life: 220 });
    this.items.filter(i => i.kind === 'gem').forEach(i => { if (Math.hypot(i.x - this.player.x, i.y - this.player.y) < i.r + 14) { i.life = 0; this.score += 25; } });
    this.score += 0.04 * dt / 16;
  }

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    c.fillStyle = '#061027';
    c.fillRect(0, 0, this.w, this.h);
    this.drawGrid(c);
    const drawer = {
      snake: () => this.drawSnake(c), pong: () => this.drawPong(c), puzzle: () => this.drawPuzzle(c),
      racing: () => this.drawRacing(c), shooter: () => this.drawShooter(c), platformer: () => this.drawPlatformer(c),
      sports: () => this.drawSports(c), board: () => this.drawPuzzle(c), strategy: () => this.drawPuzzle(c),
      multiplayer: () => this.drawMultiplayer(c), arcade: () => this.drawArcade(c)
    }[this.game.type] || (() => this.drawArcade(c));
    drawer();
    c.fillStyle = '#fff';
    c.font = '700 18px sans-serif';
    c.fillText(`${this.game.name} • ${this.game.type}`, 18, 28);
  }

  drawGrid(c) {
    c.strokeStyle = '#00f5ff22';
    for (let x = 0; x < this.w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.h); c.stroke(); }
    for (let y = 0; y < this.h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(this.w, y); c.stroke(); }
  }

  glow(c, color = '#00f5ff') { c.shadowColor = color; c.shadowBlur = 18; c.fillStyle = color; }
  noGlow(c) { c.shadowBlur = 0; }

  drawPlayer(c, player, color = '#00f5ff') { this.glow(c, color); c.beginPath(); c.arc(player.x, player.y, player.r, 0, 7); c.fill(); this.noGlow(c); }
  drawSnake(c) { const cell = Math.min(this.w / 24, this.h / 16); c.fillStyle = '#ff2bd6'; c.fillRect(this.food.x * cell, this.food.y * cell, cell, cell); c.fillStyle = '#65ff8f'; this.snake.forEach(s => c.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2)); }
  drawPong(c) { c.fillStyle = '#00f5ff'; c.fillRect(22, this.player.y - 46, 12, 92); c.fillStyle = '#ff2bd6'; c.fillRect(this.w - 34, this.player2.y - 46, 12, 92); this.drawPlayer(c, this.ball, '#ffd166'); }
  drawPuzzle(c) { const tw = this.w / 4, th = this.h / 4; this.tiles.forEach((tile, i) => { c.fillStyle = tile.open || tile.hit ? '#00f5ff88' : '#111a36'; c.fillRect((i % 4) * tw + 8, Math.floor(i / 4) * th + 8, tw - 16, th - 16); c.fillStyle = '#fff'; c.font = '800 24px sans-serif'; c.fillText(tile.open || tile.hit ? tile.value : '?', (i % 4) * tw + tw / 2 - 8, Math.floor(i / 4) * th + th / 2); }); }
  drawRacing(c) { c.strokeStyle = '#ffffff55'; c.setLineDash([20, 18]); c.beginPath(); c.moveTo(this.w / 2, 0); c.lineTo(this.w / 2, this.h); c.stroke(); c.setLineDash([]); this.drawPlayer(c, this.player, '#00f5ff'); c.fillStyle = '#ff2bd6'; this.obstacles.forEach(o => c.fillRect(o.x, o.y, o.w, o.h)); }
  drawShooter(c) { this.drawPlayer(c, this.player, '#65ff8f'); c.fillStyle = '#ffd166'; this.items.forEach(i => c.fillRect(i.x, i.y, 12, 4)); c.fillStyle = '#ff2bd6'; this.obstacles.forEach(o => c.fillRect(o.x, o.y, o.w, o.h)); }
  drawPlatformer(c) { c.fillStyle = '#1f8fff'; c.fillRect(0, this.h - 18, this.w, 18); for (let x = 40; x < this.w; x += 130) c.fillRect(x, this.h - 95 - (x % 3) * 20, 85, 12); this.drawPlayer(c, this.player, '#ffd166'); }
  drawSports(c) { this.drawPlayer(c, { x: this.w * 0.22, y: this.h * 0.72, r: 18 }, '#00f5ff'); c.strokeStyle = '#ff2bd6'; c.lineWidth = 5; c.beginPath(); c.arc(this.w * 0.78, this.h * 0.35, 42, 0, 7); c.stroke(); this.items.forEach(i => this.drawPlayer(c, i, '#ffd166')); }
  drawMultiplayer(c) { this.drawPlayer(c, this.player, '#00f5ff'); this.drawPlayer(c, this.player2, '#ff2bd6'); c.strokeStyle = '#ffd166'; c.beginPath(); c.moveTo(this.player.x, this.player.y); c.lineTo(this.player2.x, this.player2.y); c.stroke(); }
  drawArcade(c) { this.drawPlayer(c, this.player, '#00f5ff'); this.items.filter(i => i.kind === 'gem').forEach(i => this.drawPlayer(c, i, '#ff2bd6')); }
}

window.GameEngine = GameEngine;
