// CLAIM SCORE — end-of-game handoff to the Pandai platform.
//
// Implements the callback contract from the root CLAUDE.md §6.5. The game
// does NOT hardcode a public callback URL — instead it reads
//
//   ?callback_url=<https-url>     (preferred, set by the launcher)
//   window.__JDP_CALLBACK_URL__   (platform fallback, set by the host)
//
// at submit time, appends the payload as query params, and redirects.
// Submission via redirect (rather than fetch) survives the in-app WebViews
// Pandai uses on mobile.
//
// Payload (per §6.5):
//   game     — kebab-case folder name, matches the games.js path
//   score    — non-negative integer
//   token    — fresh per-run nonce
//   (optional) cause / timeUsedMs — lightweight run diagnostics, no PII

const GAME_NAME  = 'ruby-breaker-v2';        // must match the folder name in games.js
const CLAIMS_KEY = 'ruby-breaker-v2:claims';

// Per-run nonce required by §6.5. Falls back to a short hex string when
// crypto.randomUUID is unavailable (older mobile browsers).
function newToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Resolves the callback target per §6.5 precedence: query param first, then
// the platform-managed global. Only https: URLs from the query param are
// accepted (so a malicious link can't redirect the player to an http target).
// Returns null when no callback is configured — caller decides what to do.
export function resolveCallbackUrl() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const candidate = qs.get('callback_url');
    if (candidate) {
      const u = new URL(candidate);
      if (u.protocol === 'https:') return u.toString();
    }
  } catch { /* malformed query string or URL — fall through */ }

  if (typeof window !== 'undefined' && window.__JDP_CALLBACK_URL__) {
    return window.__JDP_CALLBACK_URL__;
  }
  return null;
}

// Appends payload fields as query params to the (possibly already-
// parameterized) callback URL, preserving any params the platform set.
export function buildClaimUrl(callbackUrl, payload) {
  const u = new URL(callbackUrl);
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

// Mirrors the claim into localStorage so backend devs / QA can inspect
// captured runs during local play. Wrapped in try/catch because sandboxed
// webviews make storage throw. A dropped mirror is non-fatal — production
// reads score from the redirect URL, not from this queue.
function recordClaim(payload) {
  try {
    const raw  = window.localStorage.getItem(CLAIMS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(payload);
    window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(list));
  } catch { /* storage unavailable — drop the mirror */ }
}

// Submit a finished run. Records the claim locally, resolves the callback
// URL per §6.5, appends payload params, and redirects. Returns the payload.
//
// If no callback URL is configured (direct play with no launcher), the
// function records the claim and logs the would-be URL instead of
// redirecting — so dev runs don't bounce the player to a 404.
export function claimScore(score, { timeUsedMs, cause } = {}) {
  const payload = {
    game:       GAME_NAME,
    score:      Math.max(0, score | 0),
    token:      newToken(),
    cause:      cause      ?? null,
    timeUsedMs: timeUsedMs ?? null,
    claimedAt:  Date.now(),
  };
  recordClaim(payload);

  const callbackUrl = resolveCallbackUrl();
  if (!callbackUrl) {
    console.info('[ruby-breaker-v2] claimScore (no callback_url configured):', payload);
    return payload;
  }

  window.location.href = buildClaimUrl(callbackUrl, payload);
  return payload;
}

// Dev/debug helpers: inspect or clear the local mirror queue from the console.
export function getRecordedClaims() {
  try { return JSON.parse(window.localStorage.getItem(CLAIMS_KEY) || '[]'); }
  catch { return []; }
}
export function clearRecordedClaims() {
  try { window.localStorage.removeItem(CLAIMS_KEY); }
  catch { /* nothing to clear */ }
}
