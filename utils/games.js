const categories = ['Arcade','Puzzle','Action','Adventure','Sports','Racing','Platformer','Shooter','Retro','Board Games','Strategy','Educational','Idle Games','Multiplayer Ready','Classic Games'];
const required = ['Snake','Tetris','Pong','Breakout','Flappy Bird','2048','Minesweeper','Sudoku','Memory Match','Simon Says','Connect Four','Chess','Checkers','Tic Tac Toe','Rock Paper Scissors','Whack A Mole','Space Shooter','Asteroids','Pacman Clone','Doodle Jump Clone','Endless Runner','Fruit Ninja Clone','Tower Defense','Brick Breaker','Hangman','Word Search','Typing Speed Test','Color Match','Reaction Test','Quiz Game','Car Racing','Bike Racing','Penalty Shootout','Basketball Toss','Air Hockey','Pinball','Bubble Shooter','Crossword','Platform Adventure','Zombie Survival'];
const extra = ['Neon Dash','Galaxy Defender','Cyber Runner','Dungeon Escape','Robot Arena','Orbital Drift','Crystal Match','Math Blaster','Word Wizard','Mini Golf','Soccer Juggle','Tennis Rally','Snowboard Rush','Skate Park','Monster Truck','Kart Circuit','Rocket Landing','Lunar Lander','Alien Invaders','Laser Duel','Ninja Jump','Pirate Quest','Treasure Maze','Island Builder','City Tycoon','Farm Idle','Cookie Clicker','Merge Gems','Card Solitaire','Blackjack Trainer','Dominoes','Battleship','Reversi','Mahjong Tiles','Jigsaw Blitz','Pipe Connect','Laser Mirrors','Block Puzzle','Hex Strategy','Kingdom Defense','War Tactics','Space Colony','Typing Zombies','Trivia Master','Flag Quiz','Animal Facts','Code Breaker','Music Tiles','Rhythm Tap','Dance Beats','Fishing Frenzy','Cooking Rush','Pet Care','Hospital Dash','Airport Control','Train Switch','Traffic Manager','Parking Pro','Moto Trials','BMX Tricks','Baseball Hit','Cricket Smash','Volleyball Spike','Bowling King','Darts Pro','Archery Aim','Boxing Ring','Karate Clash','Wizard Duel','Dragon Flight','Castle Climb','Cave Runner','Jungle Swing','Snow Quest','Fire And Ice','Gravity Flip','Portal Puzzle','Time Sprint','Meteor Miner','Ocean Explorer','Submarine Dive','Tank Battle','Mech Shooter','Battle Royale Lite','Co-op Maze','Capture Flag','Party Brawl','Classic Frogger','Retro Racer','Pixel Bomber','8 Bit Golf','Neon Pinball'];
const controlTypes = ['swipe','tap','joystick','aim','drag'];
const allNames = [...required, ...extra];
const games = allNames.slice(0, 112).map((name, i) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  name,
  category: categories[i % categories.length],
  tags: [categories[i % categories.length], i % 3 === 0 ? 'Popular' : 'New', i % 4 === 0 ? 'Trending' : 'Casual'],
  description: `Play ${name} with responsive desktop controls and native-feeling Android touch controls.`,
  featured: i < 8,
  trending: i % 4 === 0,
  isNew: i > 92,
  controlType: controlTypes[i % controlTypes.length],
  instructions: 'Press Start, score points, pause anytime, and submit your best run to the global leaderboard.'
}));
module.exports = { games, categories };
