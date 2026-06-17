const https = require('https');
const TITLE_ID = process.env.PLAYFAB_TITLE_ID || '';
const SECRET_KEY = process.env.PLAYFAB_SECRET_KEY || '';
function isConfigured() { return Boolean(TITLE_ID && SECRET_KEY); }
function request(path, body) {
  if (!isConfigured()) return Promise.resolve({ skipped: true, reason: 'PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY are not configured' });
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: `${TITLE_ID}.playfabapi.com`, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SecretKey': SECRET_KEY, 'Content-Length': Buffer.byteLength(payload) } }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => {
        let parsed = {}; try { parsed = JSON.parse(data || '{}'); } catch (_) {}
        if (res.statusCode >= 400) return reject(new Error(parsed.errorMessage || `PlayFab request failed (${res.statusCode})`));
        resolve(parsed);
      });
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}
async function syncUser(user) {
  return request('/Server/SetTitleData', { Key: `gameverseUser:${user.username.toLowerCase()}`, Value: JSON.stringify({ id: user.id, username: user.username, joinDate: user.joinDate }) });
}
async function publishStudioGame(game) {
  return request('/Server/SetTitleData', { Key: `studioGame:${game.id}`, Value: JSON.stringify(game) });
}
module.exports = { isConfigured, syncUser, publishStudioGame };
