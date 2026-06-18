class RacingGame extends BaseGame {
  reset() { this.player = { x: this.w / 2, y: this.h - 70, r: 16 }; this.obstacles = []; }
  update(dt) { this.move(4.2); if (Math.random() < .04) this.obstacles.push({ x: Math.random() * this.w, y: -20, w: 28, h: 48, speed: 2 + Math.random() * 4 }); this.obstacles.forEach(o => o.y += o.speed * dt / 16); this.obstacles = this.obstacles.filter(o => o.y < this.h + 60); this.obstacles.forEach(o => { if (Math.abs(o.x - this.player.x) < 28 && Math.abs(o.y - this.player.y) < 40) this.score = Math.max(0, this.score - 1); }); this.score += .12; }
  draw() { this.grid(); const c = this.ctx; c.strokeStyle = '#ffffff55'; c.setLineDash([20, 18]); c.beginPath(); c.moveTo(this.w / 2, 0); c.lineTo(this.w / 2, this.h); c.stroke(); c.setLineDash([]); this.circle(this.player); c.fillStyle = '#ff2bd6'; this.obstacles.forEach(o => c.fillRect(o.x, o.y, o.w, o.h)); this.title(); }
}
window.RacingGame = RacingGame;
