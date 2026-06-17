const { readJson } = require('../utils/storage');
function requireAdmin(req, res, next) {
  const username = req.header('x-username') || req.query.username;
  const user = readJson('users.json').find(u => u.username === username);
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
}
module.exports = { requireAdmin };
