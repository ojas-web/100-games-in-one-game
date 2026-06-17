const { randomUUID } = require('crypto');
const express = require('express');
const { readJson, updateJson } = require('../utils/storage');
const router = express.Router();
const USER_RE = /^[A-Za-z0-9_]{3,20}$/;
const today = () => new Date().toISOString().slice(0, 10);
function sanitize(username='') { return String(username).trim(); }
function achievementsFor(user) {
  const a = new Set(user.achievements || []); a.add('First Login');
  const total = user.totalScore || 0, played = user.gamesPlayed || 0;
  [[100,'100 Points'],[500,'500 Points'],[1000,'1000 Points'],[5000,'5000 Points'],[10000,'10000 Points']].forEach(([n,b])=>{ if(total>=n)a.add(b); });
  [[10,'10 Games Played'],[50,'50 Games Played'],[100,'100 Games Played']].forEach(([n,b])=>{ if(played>=n)a.add(b); });
  if ((user.highestScore || 0) > 0) a.add('First Win');
  return [...a];
}
router.post('/signup', async (req, res) => {
  const username = sanitize(req.body.username);
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!USER_RE.test(username)) return res.status(400).json({ error: 'Use 3-20 letters, numbers, or underscores only' });
  const users = readJson('users.json');
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: 'Username already exists' });
  const user = { id: randomUUID(), username, joinDate: new Date().toISOString(), lastLogin: new Date().toISOString(), totalScore: 0, gamesPlayed: 0, highestScore: 0, favoriteGame: '', favorites: [], recentGames: [], xp: 0, level: 1, badges: [], achievements: ['First Login'], isAdmin: users.length === 0 };
  await updateJson('users.json', u => [...u, user]);
  await updateJson('gameStats.json', s => { s.dailyActiveUsers[today()] = [...new Set([...(s.dailyActiveUsers[today()] || []), username])]; return s; });
  res.json({ user });
});
router.post('/login', async (req, res) => {
  const username = sanitize(req.body.username);
  const users = readJson('users.json');
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found. Please sign up first.' });
  user.lastLogin = new Date().toISOString(); user.achievements = achievementsFor(user);
  await updateJson('users.json', all => all.map(u => u.id === user.id ? user : u));
  await updateJson('gameStats.json', s => { s.dailyActiveUsers[today()] = [...new Set([...(s.dailyActiveUsers[today()] || []), user.username])]; return s; });
  res.json({ user });
});
router.get('/profile/:username', (req, res) => {
  const user = readJson('users.json').find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const leaderboard = readJson('leaderboard.json');
  const ranking = leaderboard.findIndex(e => e.username === user.username) + 1 || null;
  res.json({ user: { ...user, achievements: achievementsFor(user), ranking } });
});
router.patch('/profile/:username', async (req, res) => {
  const allowed = ['favoriteGame','favorites','recentGames','theme'];
  let updated;
  await updateJson('users.json', users => users.map(u => {
    if (u.username !== req.params.username) return u;
    updated = { ...u }; allowed.forEach(k => { if (req.body[k] !== undefined) updated[k] = req.body[k]; }); return updated;
  }));
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ user: updated });
});
module.exports = router;
