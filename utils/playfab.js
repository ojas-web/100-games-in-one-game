const https = require('https');
const TITLE_ID = process.env.PLAYFAB_TITLE_ID || '';
const SECRET_KEY = process.env.PLAYFAB_SECRET_KEY || '';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
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
async function retryPlayFab(label, operation, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(); }
    catch (error) { lastError = error; console.warn(`${label} failed on attempt ${attempt}:`, error.message); if (attempt < attempts) await wait(250 * attempt); }
  }
  throw lastError;
}
async function updateDisplayName(sessionTicket, username) {
  return retryPlayFab(`PlayFab DisplayName update for ${username}`, async () => {
    const response = await callPlayFab('/Client/UpdateUserTitleDisplayName', { DisplayName: username }, { 'X-Authorization': sessionTicket });
    return response.data?.DisplayName || username;
  });
}
async function updateDisplayName(sessionTicket, username) {
  return retryPlayFab(`PlayFab DisplayName update for ${username}`, async () => {
    console.log('Attempting DisplayName update:', username);

    const response = await callPlayFab(
      '/Client/UpdateUserTitleDisplayName',
      { DisplayName: username },
      { 'X-Authorization': sessionTicket }
    );

    console.log('DisplayName response:', JSON.stringify(response));

    return response.data?.DisplayName || username;
  });
}
async function ensurePlayer(user) {
  const login = await callPlayFab('/Client/LoginWithCustomID', { TitleId: TITLE_ID, CustomId: user.id, CreateAccount: true, InfoRequestParameters: { GetPlayerProfile: true, ProfileConstraints: { ShowDisplayName: true } } });
  if (login.skipped) return login;
  const data = login.data || {};
  const playFabId = data.PlayFabId;
  const sessionTicket = data.SessionTicket;
  let displayName = data.InfoResultPayload?.PlayerProfile?.DisplayName || user.displayName || '';
  if (sessionTicket) {
    await callPlayFab('/Client/UpdateUserData', { Data: { username: user.username, gameverseUserId: user.id, joinDate: user.joinDate || user.createdAt || '' } }, { 'X-Authorization': sessionTicket });
    if (displayName !== user.username) {
      try { displayName = await updateDisplayName(sessionTicket, user.username); }
      catch (error) { console.warn(`PlayFab DisplayName sync failed for ${user.username}:`, error.message); displayName = displayName || user.username; }
    }
  }
  return { playFabId, displayName: displayName || user.username, newlyCreated: data.NewlyCreated, synced: true };
}
async function syncUser(user) {
  const player = await ensurePlayer(user);
  if (player.skipped) return player;
  if (isConfigured()) await serverRequest('/Server/SetTitleData', { Key: `gameverseUser:${user.username.toLowerCase()}`, Value: JSON.stringify({ id: user.id, playFabId: player.playFabId, username: user.username, displayName: player.displayName, joinDate: user.joinDate || user.createdAt }) });
  return player;
}
async function syncDisplayNameForUser(user) {
  return syncUser(user);
}
async function publishStudioGame(game) {
  return serverRequest('/Server/SetTitleData', { Key: `studioGame:${game.id}`, Value: JSON.stringify(game) });
}
module.exports = { hasTitleId, isConfigured, ensurePlayer, syncUser, syncDisplayNameForUser, publishStudioGame };
