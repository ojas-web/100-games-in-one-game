const https = require('https');
const TITLE_ID = process.env.PLAYFAB_TITLE_ID || '';
const SECRET_KEY = process.env.PLAYFAB_SECRET_KEY || '';
function hasTitleId() { return Boolean(TITLE_ID); }
function isConfigured() { return Boolean(TITLE_ID && SECRET_KEY); }
function callPlayFab(path, body, headers = {}) {
  if (!hasTitleId()) return Promise.resolve({ skipped: true, reason: 'PLAYFAB_TITLE_ID is not configured' });
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: `${TITLE_ID}.playfabapi.com`, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers } }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => {
        let parsed = {}; try { parsed = JSON.parse(data || '{}'); } catch (_) {}
        if (res.statusCode >= 400 || parsed.code === 400) return reject(new Error(parsed.errorMessage || `PlayFab request failed (${res.statusCode})`));
        resolve(parsed);
      });
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}
function serverRequest(path, body) {
  if (!isConfigured()) return Promise.resolve({ skipped: true, reason: 'PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY are not configured' });
  return callPlayFab(path, body, { 'X-SecretKey': SECRET_KEY });
}
async function ensurePlayer(user) {
  const login = await callPlayFab('/Client/LoginWithCustomID', { TitleId: TITLE_ID, CustomId: user.id, CreateAccount: true });
  if (login.skipped) return login;
  const data = login.data || {};
  const playFabId = data.PlayFabId;
  const sessionTicket = data.SessionTicket;
  if (sessionTicket) {
    await callPlayFab('/Client/UpdateUserData', { Data: { username: user.username, gameverseUserId: user.id, joinDate: user.joinDate } }, { 'X-Authorization': sessionTicket });
  }
  return { playFabId, newlyCreated: data.NewlyCreated, synced: true };
}
async function syncUser(user) {
  const player = await ensurePlayer(user);
  if (player.skipped) return player;
  if (isConfigured()) await serverRequest('/Server/SetTitleData', { Key: `gameverseUser:${user.username.toLowerCase()}`, Value: JSON.stringify({ id: user.id, playFabId: player.playFabId, username: user.username, joinDate: user.joinDate }) });
  return player;
}
async function publishStudioGame(game) {
  return serverRequest('/Server/SetTitleData', { Key: `studioGame:${game.id}`, Value: JSON.stringify(game) });
}
module.exports = { hasTitleId, isConfigured, ensurePlayer, syncUser, publishStudioGame };
