class BaseGame {
  constructor(canvas, game, callbacks = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.game = game; this.cb = callbacks;
    this.running = false; this.paused = false; this.score = 0; this.high = Number(localStorage.getItem(`high_${game.id}`) || 0);
    this.keys = {}; this.pointer = { x: 0, y: 0, down: false }; this.dir = { x: 1, y: 0 }; this.last = 0; this.tick = 0;
    this.resize(); this.reset(); this.bind();
  }
  resize() { const dpr = Math.min(devicePixelRatio || 1, 2), r = this.canvas.getBoundingClientRect(); this.canvas.width = Math.max(320, r.width * dpr); this.canvas.height = Math.max(240, r.height * dpr); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.w = r.width; this.h = r.height; }
  reset() { this.player = { x: this.w * .5, y: this.h * .5, vx: 0, vy: 0, r: 14 }; this.items = []; this.obstacles = []; this.tick = 0; }
  bind() {
    addEventListener('resize', () => { this.resize(); this.reset(); });
    addEventListener('keydown', e => { this.keys[e.key.toLowerCase()] = true; this.keyMove(e.key.toLowerCase()); });
    addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    let sx = 0, sy = 0; const pos = e => { const t = e.touches?.[0] || e.changedTouches?.[0] || e, r = this.canvas.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    this.canvas.addEventListener('pointerdown', e => { this.pointer = { ...pos(e), down: true }; this.tap(this.pointer); });
    this.canvas.addEventListener('pointermove', e => { if (this.pointer.down) this.pointer = { ...pos(e), down: true }; });
    this.canvas.addEventListener('pointerup', () => { this.pointer.down = false; });
    this.canvas.addEventListener('touchstart', e => { document.body.classList.add('playing'); sx = e.touches[0].clientX; sy = e.touches[0].clientY; e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchend', e => { const t = e.changedTouches[0]; this.swipe(t.clientX - sx, t.clientY - sy); e.preventDefault(); }, { passive: false });
  }
  keyMove(k) { if (k === 'arrowup' || k === 'w') this.dir = { x: 0, y: -1 }; if (k === 'arrowdown' || k === 's') this.dir = { x: 0, y: 1 }; if (k === 'arrowleft' || k === 'a') this.dir = { x: -1, y: 0 }; if (k === 'arrowright' || k === 'd') this.dir = { x: 1, y: 0 }; }
  swipe(dx, dy) { if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) this.dir = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) }; }
  tap() {}
  control(a) { const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }; if (m[a]) this.dir = { x: m[a][0], y: m[a][1] }; if (a === 'fire' || a === 'jump') this.action(); }
  action() { this.score += 1; }
  start() { this.running = true; this.paused = false; this.score = 0; this.reset(); requestAnimationFrame(t => this.loop(t)); }
  pause() { this.paused = !this.paused; if (!this.paused) requestAnimationFrame(t => this.loop(t)); }
  restart() { this.start(); }
  loop(t) { if (!this.running || this.paused) return; const dt = Math.min(32, t - this.last || 16); this.last = t; this.tick += dt; this.update(dt); this.draw(); if (this.score > this.high) { this.high = Math.floor(this.score); localStorage.setItem(`high_${this.game.id}`, this.high); } this.cb.onScore?.(Math.floor(this.score), this.high); requestAnimationFrame(n => this.loop(n)); }
  move(speed = 3) { this.player.x += this.dir.x * speed; this.player.y += this.dir.y * speed; this.player.x = Math.max(this.player.r, Math.min(this.w - this.player.r, this.player.x)); this.player.y = Math.max(this.player.r, Math.min(this.h - this.player.r, this.player.y)); }
  update(dt) { this.move(); this.score += dt / 600; }
  grid() { const c = this.ctx; c.fillStyle = '#061027'; c.fillRect(0, 0, this.w, this.h); c.strokeStyle = '#00f5ff22'; for (let x = 0; x < this.w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.h); c.stroke(); } for (let y = 0; y < this.h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(this.w, y); c.stroke(); } }
  circle(p, color = '#00f5ff') { const c = this.ctx; c.shadowColor = color; c.shadowBlur = 16; c.fillStyle = color; c.beginPath(); c.arc(p.x, p.y, p.r || 12, 0, 7); c.fill(); c.shadowBlur = 0; }
  title() { this.ctx.fillStyle = '#fff'; this.ctx.font = '700 18px sans-serif'; this.ctx.fillText(`${this.game.name} • ${this.game.type}`, 18, 28); }
  draw() { this.grid(); this.circle(this.player); this.title(); }
}
window.BaseGame = BaseGame;
