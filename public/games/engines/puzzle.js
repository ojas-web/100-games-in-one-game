class PuzzleGame extends BaseGame {
  reset() { this.tiles = Array.from({ length: 16 }, (_, i) => ({ value: i % 8, open: false, hit: false })); }
  tap(p) { const col = Math.floor(p.x / (this.w / 4)), row = Math.floor(p.y / (this.h / 4)), tile = this.tiles[row * 4 + col]; if (tile && !tile.hit) { tile.open = true; tile.hit = true; this.score += 20; } }
  update() { if (this.tiles.every(t => t.hit)) { this.tiles.forEach(t => { t.hit = false; t.open = false; }); this.score += 100; } }
  draw() { this.grid(); const c = this.ctx, tw = this.w / 4, th = this.h / 4; this.tiles.forEach((t, i) => { c.fillStyle = t.open ? '#00f5ff88' : '#111a36'; c.fillRect((i % 4) * tw + 8, Math.floor(i / 4) * th + 8, tw - 16, th - 16); c.fillStyle = '#fff'; c.font = '800 24px sans-serif'; c.fillText(t.open ? t.value : '?', (i % 4) * tw + tw / 2 - 8, Math.floor(i / 4) * th + th / 2); }); this.title(); }
}
window.PuzzleGame = PuzzleGame;
