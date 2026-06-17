class SportsGame extends BaseGame {
  reset() { this.balls = []; this.target = { x: this.w * .78, y: this.h * .35, r: 42 }; }
  tap(p) { this.balls.push({ x: p.x, y: p.y, vx: (this.target.x - p.x) / 35, vy: (this.target.y - p.y) / 35, r: 9 }); }
  swipe(dx, dy) { super.swipe(dx, dy); this.score += Math.max(5, Math.floor(Math.hypot(dx, dy) / 4)); }
  update() { this.balls.forEach(b => { b.x += b.vx; b.y += b.vy; if (Math.hypot(b.x - this.target.x, b.y - this.target.y) < this.target.r) { b.hit = true; this.score += 25; } }); this.balls = this.balls.filter(b => !b.hit && b.x < this.w + 20 && b.y < this.h + 20); }
  draw() { this.grid(); this.circle({ x: this.w * .22, y: this.h * .72, r: 18 }, '#00f5ff'); const c = this.ctx; c.strokeStyle = '#ff2bd6'; c.lineWidth = 5; c.beginPath(); c.arc(this.target.x, this.target.y, this.target.r, 0, 7); c.stroke(); this.balls.forEach(b => this.circle(b, '#ffd166')); this.title(); }
}
window.SportsGame = SportsGame;
