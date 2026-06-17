class SnakeGame extends BaseGame {
  reset() { this.cell = 22; this.cols = 24; this.rows = 16; this.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]; this.food = { x: 14, y: 8 }; this.dir = { x: 1, y: 0 }; this.tick = 0; }
  update() { if (this.tick < 115) return; this.tick = 0; const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y }; if (head.x < 0 || head.y < 0 || head.x >= this.cols || head.y >= this.rows || this.snake.some(s => s.x === head.x && s.y === head.y)) return this.reset(); this.snake.unshift(head); if (head.x === this.food.x && head.y === this.food.y) { this.score += 50; this.food = { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) }; } else this.snake.pop(); }
  draw() { this.grid(); const c = this.ctx, cell = Math.min(this.w / this.cols, this.h / this.rows); c.fillStyle = '#ff2bd6'; c.fillRect(this.food.x * cell, this.food.y * cell, cell, cell); c.fillStyle = '#65ff8f'; this.snake.forEach(s => c.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2)); this.title(); }
}
window.SnakeGame = SnakeGame;
