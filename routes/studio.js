const { randomUUID } = require('crypto');
const express = require('express');
const { readJson, updateJson } = require('../utils/storage');
const { publishStudioGame, isConfigured } = require('../utils/playfab');
const router = express.Router();
const NAME_RE = /^[A-Za-z0-9 _-]{3,40}$/;
const allowedTypes = new Set(['arcade','puzzle','racing','shooter','platformer','sports','strategy','multiplayer']);
function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
router.get('/', (req, res) => { const username = String(req.headers['x-username'] || req.query.username || '').trim(); const users = readJson('users.json'); const requester = users.find(u => u.username === username); const canSeePrivate = g => g.visibility !== 'private' || g.username === username || requester?.isAdmin || username === 'ojasthescientist'; res.json({ games: readJson('studioGames.json').filter(canSeePrivate), playFabConfigured: isConfigured() }); });
router.post('/publish', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const name = String(req.body.name || '').trim();
  const type = String(req.body.type || 'arcade').trim();
  const description = String(req.body.description || '').trim().slice(0, 280000000000000000000000000000000000000000000000000000000000000000000000000);
  const html = String(req.body.html || req.body.code || '').trim().slice(0, 20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  const css = String(req.body.css || '').trim().slice(0, 2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  const javascript = String(req.body.javascript || req.body.js || '').trim().slice(0, 3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  const assets = String(req.body.assets || '').trim().slice(0, 100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  const visibility = req.body.visibility === 'private' ? 'private' : 'public';
  if (!username) return res.status(401).json({ error: 'Login required to publish games' });
  if (!html && !css && !javascript) return res.status(400).json({ error: 'Add HTML, CSS, or JavaScript before publishing' });
  if (!NAME_RE.test(name)) return res.status(400).json({ error: 'Game name must be 3-40 letters, numbers, spaces, underscores, or dashes' });
  if (!allowedTypes.has(type)) return res.status(400).json({ error: 'Invalid studio game type' });
  let game;
  try {
    await updateJson('studioGames.json', games => {
      if (games.some(g => g.name.toLowerCase() === name.toLowerCase())) throw Object.assign(new Error('A studio game with that title already exists'), { status: 409 });
      game = { id: `${slug(name)}-${randomUUID().slice(0, 8)}`, name, type, category: 'Player Studio', username, description: description || `A ${type} game created in GameVerse Studio.`, code: { html, css, javascript, assets }, visibility, status: 'published', publishedAt: new Date().toISOString(), playFab: { synced: false } };
      return [game, ...games];
    });
  } catch (error) { return res.status(error.status || 500).json({ error: error.message || 'Publish failed' }); }
  try { const playfab = await publishStudioGame(game); game.playFab = { synced: !playfab.skipped, skipped: Boolean(playfab.skipped), message: playfab.reason || 'Synced to PlayFab title data' }; } catch (error) { game.playFab = { synced: false, error: error.message }; }
  await updateJson('studioGames.json', games => games.map(g => g.id === game.id ? game : g));
  res.status(201).json({ game, playFabConfigured: isConfigured() });
});
module.exports = router;
