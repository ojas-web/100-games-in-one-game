class ShooterGame extends BaseGame {
  reset() { this.player = { x: 70, y: this.h / 2, r: 14 }; this.shots = []; this.enemies = []; this.cooldown = 0; }
  action() { this.shots.push({ x: this.player.x + 12, y: this.player.y, vx: 8, r: 5 }); }
  tap() { this.action(); }
  update(dt) { this.move(3.2); if (this.pointer.down && this.cooldown-- <= 0) { this.action(); this.cooldown = 10; } if (Math.random() < .035) this.enemies.push({ x: this.w + 20, y: Math.random() * this.h, r: 14, speed: 2 + Math.random() * 3 }); this.shots.forEach(s => s.x += s.vx); this.enemies.forEach(e => e.x -= e.speed * dt / 16); this.shots.forEach(s => this.enemies.forEach(e => { if (Math.hypot(s.x - e.x, s.y - e.y) < 22) { e.hit = true; s.hit = true; this.score += 30; } })); this.shots = this.shots.filter(s => !s.hit && s.x < this.w); this.enemies = this.enemies.filter(e => !e.hit && e.x > -30); }
  draw() { this.grid(); this.circle(this.player, '#65ff8f'); const c = this.ctx; c.fillStyle = '#ffd166'; this.shots.forEach(s => c.fillRect(s.x, s.y, 12, 4)); this.enemies.forEach(e => this.circle(e, '#ff2bd6')); this.title(); }
}
window.ShooterGame = ShooterGame;
