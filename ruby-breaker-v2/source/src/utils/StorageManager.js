const KEY_HIGH = 'rubybreaker_highscore';
const KEY_PREFS = 'rubybreaker_prefs';

const StorageManager = {
  getHighScore() {
    try { return parseInt(localStorage.getItem(KEY_HIGH) || '0', 10); }
    catch { return 0; }
  },

  saveHighScore(score) {
    try {
      const current = this.getHighScore();
      if (score > current) {
        localStorage.setItem(KEY_HIGH, String(score));
        return true;
      }
    } catch {}
    return false;
  },

  getPrefs() {
    try { return JSON.parse(localStorage.getItem(KEY_PREFS) || '{}'); }
    catch { return {}; }
  },

  setPref(key, value) {
    try {
      const prefs = this.getPrefs();
      prefs[key] = value;
      localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
    } catch {}
  },
};

export default StorageManager;
