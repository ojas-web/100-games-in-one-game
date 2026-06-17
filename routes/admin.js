const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { readJson, writeJson, updateJson } = require('../utils/storage');
const router = express.Router();
router.use(requireAdmin);
router.get('/dashboard', (req,res)=>{ const users=readJson('users.json'), scores=readJson('scores.json'), stats=readJson('gameStats.json'); const popular=Object.entries(stats.gamePlays||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||'None'; res.json({ users, scores, stats:{...stats,totalUsers:users.length,totalGamesPlayed:scores.length,totalScoresSubmitted:scores.length,mostPopularGame:popular} }); });
router.delete('/users/:username', async (req,res)=>{ await updateJson('users.json', users => users.filter(u=>u.username!==req.params.username)); res.json({ ok:true }); });
router.post('/leaderboard/reset', (req,res)=>{ writeJson('leaderboard.json', []); res.json({ ok:true }); });
module.exports = router;
