function createGameInstance(canvas, game, callbacks) {
  const classes = {
    snake: SnakeGame,
    pong: PongGame,
    puzzle: PuzzleGame,
    board: PuzzleGame,
    racing: RacingGame,
    shooter: ShooterGame,
    platformer: PlatformerGame,
    sports: SportsGame,
    strategy: StrategyGame,
    multiplayer: MultiplayerGame,
    arcade: ArcadeGame
  };
  return new (classes[game.type] || ArcadeGame)(canvas, game, callbacks);
}
window.createGameInstance = createGameInstance;
window.GameEngine = ArcadeGame;
