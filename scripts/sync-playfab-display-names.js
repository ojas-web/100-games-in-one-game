#!/usr/bin/env node
const { ensureDataFiles, readJson, updateJson } = require('../utils/storage');
const { syncDisplayNameForUser, hasTitleId } = require('../utils/playfab');
async function main() {
  ensureDataFiles();
  if (!hasTitleId()) {
    console.error('PLAYFAB_TITLE_ID is required to migrate PlayFab display names.');
    process.exitCode = 1;
    return;
  }
  const results = [];
  await updateJson('users.json', async users => {
    const updated = [];
    for (const user of users) {
      try {
        const playfab = await syncDisplayNameForUser(user);
        const next = playfab.playFabId ? { ...user, playFabId: playfab.playFabId, displayName: playfab.displayName || user.username } : { ...user, displayName: user.displayName || user.username };
        updated.push(next);
        results.push({ username: user.username, playFabId: next.playFabId, displayName: next.displayName, ok: true });
      } catch (error) {
        console.warn(`Failed to sync ${user.username}: ${error.message}`);
        updated.push(user);
        results.push({ username: user.username, ok: false, error: error.message });
      }
    }
    return updated;
  });
  console.table(results);
  const failed = results.filter(r => !r.ok).length;
  if (failed) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exit(1); });
