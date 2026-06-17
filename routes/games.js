const express = require('express');
const { games, categories } = require('../utils/games');
const { readJson, updateJson } = require('../utils/storage');
const router = express.Router();
router.get('/', (req, res) => { const q = (req.query.q || '').toLowerCase(); res.json({ games: q ? games.filter(g => [g.name,g.category,...g.tags].join(' ').toLowerCase().includes(q)) : games, categories }); });
router.get('/:id', (req, res) => { const game = games.find(g => g.id === req.params.id); game ? res.json({ game }) : res.status(404).json({ error: 'Game not found' }); });
router.post('/:id/rate', async (req, res) => { const rating = Number(req.body.rating); if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' }); await updateJson('gameStats.json', s => { s.ratings[req.params.id] = [...(s.ratings[req.params.id] || []), { username: req.body.username || 'Guest', rating, date: new Date().toISOString() }]; return s; }); res.json({ ok: true }); });
router.post('/:id/comments', async (req, res) => { const text = String(req.body.text || '').trim().slice(0, 300); if (!text) return res.status(400).json({ error: 'Comment required' }); await updateJson('gameStats.json', s => { s.comments[req.params.id] = [...(s.comments[req.params.id] || []), { username: req.body.username || 'Guest', text, date: new Date().toISOString() }]; return s; }); res.json({ ok: true }); });
module.exports = router;
