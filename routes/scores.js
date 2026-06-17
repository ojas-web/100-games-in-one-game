const { randomUUID } = require('crypto');
const express = require('express');
const { readJson, updateJson } = require('../utils/storage');
const { games } = require('../utils/games');
const router = express.Router();
function achievementsFor(user) { const a = new Set(user.achievements || ['First Login']); const total=user.totalScore||0, played=user.gamesPlayed||0; [[100,'100 Points'],[500,'500 Points'],[1000,'1000 Points'],[5000,'5000 Points'],[10000,'10000 Points']].forEach(([n,b])=>{if(total>=n)a.add(b)}); [[10,'10 Games Played'],[50,'50 Games Played'],[100,'100 Games Played']].forEach(([n,b])=>{if(played>=n)a.add(b)}); if((user.highestScore||0)>0)a.add('First Win'); return [...a]; }
router.post('/', async (req, res) => {
  const username = String(req.body.username || '').trim(); const gameId = String(req.body.gameId || '').trim(); const score = Number(req.body.score);
  const game = games.find(g => g.id === gameId); const user = readJson('users.json').find(u => u.username === username);
  if (!user || !game) return res.status(400).json({ error: 'Valid user and game are required' });
  if (!Number.isFinite(score) || score < 0 || score > 10000000) return res.status(400).json({ error: 'Invalid score submission' });
  const entry = { id: randomUUID(), username, gameId, gameName: game.name, score: Math.floor(score), date: new Date().toISOString() };
  await updateJson('scores.json', s => [...s, entry]);
  await updateJson('leaderboard.json', l => [...l, entry].sort((a,b)=>b.score-a.score).slice(0,500));
  await updateJson('users.json', users => users.map(u => u.username === username ? { ...u, totalScore: (u.totalScore||0)+entry.score, gamesPlayed: (u.gamesPlayed||0)+1, highestScore: Math.max(u.highestScore||0, entry.score), xp: (u.xp||0)+Math.floor(entry.score/10)+10, level: Math.floor(((u.xp||0)+Math.floor(entry.score/10)+10)/100)+1, recentGames: [game.name, ...(u.recentGames||[]).filter(x=>x!==game.name)].slice(0,8), achievements: achievementsFor({ ...u, totalScore: (u.totalScore||0)+entry.score, gamesPlayed: (u.gamesPlayed||0)+1, highestScore: Math.max(u.highestScore||0, entry.score) }) } : u));
  await updateJson('gameStats.json', st => { st.gamePlays[game.name] = (st.gamePlays[game.name] || 0) + 1; st.recentActivity.unshift(entry); st.recentActivity = st.recentActivity.slice(0,50); return st; });
  res.json({ entry });
});
router.get('/leaderboard', (req,res)=>res.json({ leaderboard: readJson('leaderboard.json').sort((a,b)=>b.score-a.score) }));
module.exports = router;
