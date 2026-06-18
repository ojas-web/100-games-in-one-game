const { randomUUID } = require('crypto');
const express = require('express');
const { readJson, updateJson } = require('../utils/storage');
const { hashPassword, verifyPassword, validatePassword } = require('../utils/passwords');
const { syncUser } = require('../utils/playfab');
const router = express.Router();
const USER_RE = /^[A-Za-z0-9_]{3,20}$/;
const today = () => new Date().toISOString().slice(0, 10);
function sanitize(username='') { return String(username).trim(); }
function publicUser(user, isAdmin = false) { const { passwordHash, sessionToken, ...safe } = user; if (!isAdmin) delete safe.playFabId; safe.displayName = safe.displayName || safe.username; return safe; }
function achievementsFor(user) {
  const a = new Set(user.achievements || []); a.add('First Login');
  const total = user.totalScore || 0, played = user.gamesPlayed || 0;
  [[100,'100 Points'],[500,'500 Points'],[1000,'1000 Points'],[5000,'5000 Points'],[10000,'10000 Points']].forEach(([n,b])=>{ if(total>=n)a.add(b); });
  [[10,'10 Games Played'],[50,'50 Games Played'],[100,'100 Games Played']].forEach(([n,b])=>{ if(played>=n)a.add(b); });
  if ((user.highestScore || 0) > 0) a.add('First Win');
  return [...a];
}
async function trackLogin(username) { await updateJson('gameStats.json', s => { s.dailyActiveUsers[today()] = [...new Set([...(s.dailyActiveUsers[today()] || []), username])]; return s; }); }
router.post('/signup', async (req, res) => {
  const username = sanitize(req.body.username);
  const passwordError = validatePassword(req.body.password);
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!USER_RE.test(username)) return res.status(400).json({ error: 'Use 3-20 letters, numbers, or underscores only' });
  if (passwordError) return res.status(400).json({ error: passwordError });
  let user;
  try {
    await updateJson('users.json', users => {
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw Object.assign(new Error('Username already exists'), { status: 409 });
      user = { id: randomUUID(), username, displayName: username, createdAt: new Date().toISOString(), passwordHash: hashPassword(req.body.password), sessionToken: randomUUID(), joinDate: new Date().toISOString(), lastLogin: new Date().toISOString(), totalScore: 0, gamesPlayed: 0, highestScore: 0, favoriteGame: '', favorites: [], recentGames: [], xp: 0, level: 1, badges: [], achievements: ['First Login'], isAdmin: users.length === 0 };
      return [...users, user];
    });
  } catch (error) { return res.status(error.status || 500).json({ error: error.message || 'Signup failed' }); }
  await trackLogin(username);
  try {
    const playfab = await syncUser(user);
    if (playfab.playFabId) {
      user.playFabId = playfab.playFabId;
      user.displayName = playfab.displayName || user.username;
      await updateJson('users.json', users => users.map(u => u.id === user.id ? { ...u, playFabId: playfab.playFabId, displayName: playfab.displayName || u.username, playFabNewlyCreated: playfab.newlyCreated } : u));
    }
  } catch (error) { console.warn('PlayFab player creation failed:', error.message); }
  res.json({ user: publicUser(user), sessionToken: user.sessionToken });
});
router.post('/login', async (req, res) => {
  const username = sanitize(req.body.username);
  const password = String(req.body.password || '');
  const token = String(req.body.sessionToken || '');
  let found;
  await updateJson('users.json', users => users.map(u => {
    if (u.username.toLowerCase() !== username.toLowerCase()) return u;
    if (token && u.sessionToken === token) found = u;
    else if (u.passwordHash && verifyPassword(password, u.passwordHash)) found = { ...u, sessionToken: randomUUID() };
    else if (!u.passwordHash && password && !validatePassword(password)) found = { ...u, passwordHash: hashPassword(password), sessionToken: randomUUID() };
    if (!found) return u;
    found.lastLogin = new Date().toISOString(); found.achievements = achievementsFor(found);
    return found;
  }));
  if (!found) return res.status(401).json({ error: 'Invalid username or password' });
  await trackLogin(found.username);
  try {
    const playfab = await syncUser(found);
    if (playfab.playFabId || playfab.displayName) {
      found.playFabId = playfab.playFabId || found.playFabId;
      found.displayName = playfab.displayName || found.username;
      await updateJson('users.json', users => users.map(u => u.id === found.id ? { ...u, playFabId: found.playFabId, displayName: found.displayName } : u));
    }
  } catch (error) { console.warn('PlayFab player sync failed:', error.message); }
  res.json({ user: publicUser(found), sessionToken: found.sessionToken });
});
router.get('/profile/:username', (req, res) => {
  const users = readJson('users.json');
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const requester = users.find(u => u.username === req.headers['x-username']);
  const leaderboard = readJson('leaderboard.json');
  const ranking = leaderboard.findIndex(e => e.username === user.username) + 1 || null;
  res.json({ user: { ...publicUser(user, Boolean(requester?.isAdmin)), achievements: achievementsFor(user), ranking } });
});
router.patch('/profile/:username', async (req, res) => {
  const allowed = ['favoriteGame','favorites','recentGames','theme'];
  let updated;
  await updateJson('users.json', users => users.map(u => {
    if (u.username !== req.params.username) return u;
    updated = { ...u }; allowed.forEach(k => { if (req.body[k] !== undefined) updated[k] = req.body[k]; }); return updated;
  }));
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(updated) });
});
module.exports = router;
