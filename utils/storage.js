const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const defaults = {
  'users.json': [],
  'scores.json': [],
  'leaderboard.json': [],
  'gameStats.json': { dailyActiveUsers: {}, gamePlays: {}, ratings: {}, comments: {}, screenshots: [], dailyChallenges: [], recentActivity: [] },
  'studioGames.json': []
};
const locks = new Map();

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [file, value] of Object.entries(defaults)) {
    const full = path.join(DATA_DIR, file);
    if (!fs.existsSync(full)) writeJson(file, value);
    else readJson(file);
  }
}

function readJson(file) {
  const full = path.join(DATA_DIR, file);
  try {
    if (!fs.existsSync(full)) return structuredClone(defaults[file]);
    return JSON.parse(fs.readFileSync(full, 'utf8') || 'null') ?? structuredClone(defaults[file]);
  } catch (error) {
    const corrupt = `${full}.corrupt-${Date.now()}`;
    try { fs.renameSync(full, corrupt); } catch (_) {}
    const fallback = structuredClone(defaults[file]);
    writeJson(file, fallback);
    return fallback;
  }
}

function writeJson(file, data) {
  const full = path.join(DATA_DIR, file);
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

async function updateJson(file, updater) {
  const previous = locks.get(file) || Promise.resolve();
  let release;
  const current = new Promise(resolve => { release = resolve; });
  locks.set(file, previous.then(() => current));
  await previous;
  try {
    const data = readJson(file);
    const updated = await updater(data);
    writeJson(file, updated ?? data);
    return updated ?? data;
  } finally {
    release();
    if (locks.get(file) === current) locks.delete(file);
  }
}

module.exports = { ensureDataFiles, readJson, writeJson, updateJson };
