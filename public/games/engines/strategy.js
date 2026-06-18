class StrategyGame extends PuzzleGame {
  reset() { super.reset(); this.resources = 0; }
  tap(p) { super.tap(p); this.resources += 5; }
  update() { if (this.tick > 900) { this.tick = 0; this.resources += this.tiles.filter(t => t.hit).length; this.score += 10 + this.resources; } }
}
window.StrategyGame = StrategyGame;
