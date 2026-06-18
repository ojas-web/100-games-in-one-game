const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { readJson, writeJson, updateJson } = require('../utils/storage');
const { syncDisplayNameForUser } = require('../utils/playfab');
const router = express.Router();
router.use(requireAdmin);
router.get('/dashboard', (req,res)=>{ const users=readJson('users.json'), scores=readJson('scores.json'), stats=readJson('gameStats.json'), q=String(req.query.q||'').toLowerCase(); const visibleUsers=q?users.filter(u=>u.username.toLowerCase().includes(q)):users; const popular=Object.entries(stats.gamePlays||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||'None'; res.json({ users: visibleUsers.map(u=>({ ...u, displayName: u.displayName || u.username })), scores, stats:{...stats,totalUsers:users.length,totalGamesPlayed:scores.length,totalScoresSubmitted:scores.length,mostPopularGame:popular} }); });
router.delete('/users/:username', async (req,res)=>{ await updateJson('users.json', users => users.filter(u=>u.username!==req.params.username)); res.json({ ok:true }); });
router.post('/leaderboard/reset', (req,res)=>{ writeJson('leaderboard.json', []); res.json({ ok:true }); });
router.post('/playfab/sync-display-names', async (req, res) => {
  const results = [];
  await updateJson('users.json', async users => {
    const updated = [];
    for (const user of users) {
      try {
        const playfab = await syncDisplayNameForUser(user);
        const next = playfab.playFabId ? { ...user, playFabId: playfab.playFabId, displayName: playfab.displayName || user.username } : { ...user, displayName: user.displayName || user.username };
        results.push({ username: user.username, ok: true, playFabId: next.playFabId || null, displayName: next.displayName, skipped: Boolean(playfab.skipped) });
        updated.push(next);
      } catch (error) {
        console.warn(`Admin PlayFab DisplayName sync failed for ${user.username}:`, error.message);
        results.push({ username: user.username, ok: false, error: error.message });
        updated.push(user);
      }
    }
    return updated;
  });
  res.json({ ok: true, results });
});
module.exports = router;
