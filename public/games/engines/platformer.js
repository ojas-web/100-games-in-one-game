class PlatformerGame extends BaseGame {
  reset() { this.player = { x: 80, y: this.h - 80, vx: 0, vy: 0, r: 15 }; }
  action() { this.player.vy = -10; }
  update(dt) { this.player.vy += .45; if (this.keys.w || this.keys.arrowup || this.dir.y < 0) this.player.vy = Math.min(this.player.vy, -7); this.player.x += (this.dir.x * 3 + (this.keys.a ? -3 : 0) + (this.keys.d ? 3 : 0)) * dt / 16; this.player.y += this.player.vy * dt / 16; if (this.player.y > this.h - 32) { this.player.y = this.h - 32; this.player.vy = -9; this.score += 2; } this.player.x = (this.player.x + this.w) % this.w; }
  draw() { this.grid(); const c = this.ctx; c.fillStyle = '#1f8fff'; c.fillRect(0, this.h - 18, this.w, 18); for (let x = 40; x < this.w; x += 130) c.fillRect(x, this.h - 95 - (x % 3) * 20, 85, 12); this.circle(this.player, '#ffd166'); this.title(); }
}
window.PlatformerGame = PlatformerGame;
