class ArcadeGame extends BaseGame {
  reset() { super.reset(); this.gems = []; }
  update(dt) { this.move(3); if (Math.random() < .025) this.gems.push({ x: Math.random() * this.w, y: Math.random() * this.h, r: 10, life: 220 }); this.gems.forEach(g => { g.life--; if (Math.hypot(g.x - this.player.x, g.y - this.player.y) < g.r + 14) { g.life = 0; this.score += 25; } }); this.gems = this.gems.filter(g => g.life > 0); this.score += .04 * dt / 16; }
  draw() { this.grid(); this.circle(this.player, '#00f5ff'); this.gems.forEach(g => this.circle(g, '#ff2bd6')); this.title(); }
}
window.ArcadeGame = ArcadeGame;
