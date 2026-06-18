const categories = [
  'Arcade', 'Puzzle', 'Action', 'Adventure', 'Sports', 'Racing', 'Platformer', 'Shooter', 'Retro',
  'Board Games', 'Strategy', 'Educational', 'Idle Games', 'Multiplayer Ready', 'Classic Games'
];

const required = [
  'Snake', 'Tetris', 'Pong', 'Breakout', 'Flappy Bird', '2048', 'Minesweeper', 'Sudoku', 'Memory Match',
  'Simon Says', 'Connect Four', 'Chess', 'Checkers', 'Tic Tac Toe', 'Rock Paper Scissors', 'Whack A Mole',
  'Space Shooter', 'Asteroids', 'Pacman Clone', 'Doodle Jump Clone', 'Endless Runner', 'Fruit Ninja Clone',
  'Tower Defense', 'Brick Breaker', 'Hangman', 'Word Search', 'Typing Speed Test', 'Color Match',
  'Reaction Test', 'Quiz Game', 'Car Racing', 'Bike Racing', 'Penalty Shootout', 'Basketball Toss',
  'Air Hockey', 'Pinball', 'Bubble Shooter', 'Crossword', 'Platform Adventure', 'Zombie Survival'
];

const extra = [
  'Neon Dash', 'Galaxy Defender', 'Cyber Runner', 'Dungeon Escape', 'Robot Arena', 'Orbital Drift',
  'Crystal Match', 'Math Blaster', 'Word Wizard', 'Mini Golf', 'Soccer Juggle', 'Tennis Rally',
  'Snowboard Rush', 'Skate Park', 'Monster Truck', 'Kart Circuit', 'Rocket Landing', 'Lunar Lander',
  'Alien Invaders', 'Laser Duel', 'Ninja Jump', 'Pirate Quest', 'Treasure Maze', 'Island Builder',
  'City Tycoon', 'Farm Idle', 'Cookie Clicker', 'Merge Gems', 'Card Solitaire', 'Blackjack Trainer',
  'Dominoes', 'Battleship', 'Reversi', 'Mahjong Tiles', 'Jigsaw Blitz', 'Pipe Connect', 'Laser Mirrors',
  'Block Puzzle', 'Hex Strategy', 'Kingdom Defense', 'War Tactics', 'Space Colony', 'Typing Zombies',
  'Trivia Master', 'Flag Quiz', 'Animal Facts', 'Code Breaker', 'Music Tiles', 'Rhythm Tap', 'Dance Beats',
  'Fishing Frenzy', 'Cooking Rush', 'Pet Care', 'Hospital Dash', 'Airport Control', 'Train Switch',
  'Traffic Manager', 'Parking Pro', 'Moto Trials', 'BMX Tricks', 'Baseball Hit', 'Cricket Smash',
  'Volleyball Spike', 'Bowling King', 'Darts Pro', 'Archery Aim', 'Boxing Ring', 'Karate Clash',
  'Wizard Duel', 'Dragon Flight', 'Castle Climb', 'Cave Runner', 'Jungle Swing', 'Snow Quest',
  'Fire And Ice', 'Gravity Flip', 'Portal Puzzle', 'Time Sprint', 'Meteor Miner', 'Ocean Explorer',
  'Submarine Dive', 'Tank Battle', 'Mech Shooter', 'Battle Royale Lite', 'Co-op Maze', 'Capture Flag',
  'Party Brawl', 'Classic Frogger', 'Retro Racer', 'Pixel Bomber', '8 Bit Golf', 'Neon Pinball'
];

function inferType(name, category) {
  const text = `${name} ${category}`.toLowerCase();
  if (/co-op|capture|party|duel|battle royale|multiplayer/.test(text)) return 'multiplayer';
  if (/snake/.test(text)) return 'snake';
  if (/pong|air hockey|tennis/.test(text)) return 'pong';
  if (/tetris|2048|sudoku|minesweeper|crossword|word|match|jigsaw|pipe|block|mahjong|quiz|trivia|code/.test(text)) return 'puzzle';
  if (/racing|racer|kart|drift|parking|traffic|truck|moto|bike|car|snowboard|skate|runner|dash/.test(text)) return 'racing';
  if (/shooter|asteroids|invaders|laser|zombie|tank|mech|boxing|karate|wizard|battle/.test(text)) return 'shooter';
  if (/platform|jump|climb|frogger|adventure|doodle|flappy|gravity|portal|cave|jungle/.test(text)) return 'platformer';
  if (/basketball|penalty|soccer|golf|cricket|volleyball|bowling|darts|archery|baseball|sports/.test(text)) return 'sports';
  if (/chess|checkers|tic tac toe|connect|reversi|dominoes|battleship|card|blackjack|board/.test(text)) return 'board';
  if (/idle|tycoon|builder|farm|cookie|colony|kingdom|defense|strategy|tactics/.test(text)) return 'strategy';
  return 'arcade';
}

function controlForType(type) {
  return {
    snake: 'swipe', pong: 'drag', puzzle: 'tap', racing: 'buttons', shooter: 'aim', platformer: 'joystick',
    sports: 'swipe', board: 'tap', strategy: 'tap', multiplayer: 'dual', arcade: 'tap'
  }[type] || 'tap';
}

function instructionsForType(type) {
  return {
    snake: 'Swipe or use arrow keys to steer, collect neon food, and avoid crashing into the arena walls.',
    pong: 'Move the paddle with mouse, touch drag, W/S, or on-screen arrows. Rally as long as possible.',
    puzzle: 'Tap, drag, or click tiles to solve the puzzle objective and build a score streak.',
    racing: 'Steer with left/right controls, accelerate through gates, and avoid traffic hazards.',
    shooter: 'Move with joystick/WASD, aim by touch or mouse, and fire at incoming targets.',
    platformer: 'Use the virtual joystick or keyboard to run, jump, collect gems, and stay on platforms.',
    sports: 'Swipe or tap to aim shots with timing-based power and accuracy scoring.',
    board: 'Tap or click cells/pieces to make strategic moves against the local AI.',
    strategy: 'Tap generators and deploy defenses to grow resources while waves become stronger.',
    multiplayer: 'Local multiplayer mode: Player 1 uses WASD/left pad and Player 2 uses arrow keys/right pad.',
    arcade: 'Tap, click, or use keyboard controls to collect points while avoiding hazards.'
  }[type];
}

const allNames = [...required, ...extra];
const games = allNames.slice(0, 112).map((name, i) => {
  const category = categories[i % categories.length];
  const type = inferType(name, category);
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name,
    category,
    type,
    multiplayer: type === 'multiplayer' || category === 'Multiplayer Ready',
    tags: [category, type, i % 3 === 0 ? 'Popular' : 'New', i % 4 === 0 ? 'Trending' : 'Casual'],
    description: `Play ${name} as a ${type.replace('-', ' ')} game with desktop controls and native-feeling Android touch controls.`,
    featured: i < 8,
    trending: i % 4 === 0,
    isNew: i > 92,
    controlType: controlForType(type),
    instructions: instructionsForType(type)
  };
});

module.exports = { games, categories, inferType };
