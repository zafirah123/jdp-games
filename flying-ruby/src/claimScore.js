const GAME_NAME = 'flying-ruby';
const CLAIMS_KEY = 'flying-ruby:claims';

let claimLocked = false;
const claimContext = getClaimContext();
if (claimContext.pageTitle) {
  try { document.title = claimContext.pageTitle; } catch (_) {}
}

function getClaimContext() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const launchToken = qs.get('token');
    const pageTitle = qs.get('page_title');
    const jwtPayload = decodeJwtPayload(launchToken);
    return {
      launchToken,
      pageTitle,
      resKey: (jwtPayload && typeof jwtPayload.res === 'string') ? jwtPayload.res : null,
      tokenCallbackUrl: (jwtPayload && typeof jwtPayload.callback_url === 'string')
        ? jwtPayload.callback_url
        : null,
    };
  } catch (_) {
    return { launchToken: null, pageTitle: null, resKey: null, tokenCallbackUrl: null };
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try { return JSON.parse(base64UrlDecode(parts[1])); } catch (_) { return null; }
}

function base64UrlDecode(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function encryptGenetPayload(aesKey, payloadObj) {
  if (!crypto || !crypto.subtle) throw new Error('WebCrypto unavailable');
  const keyBytes = new TextEncoder().encode(aesKey);
  if (keyBytes.length !== 16) throw new Error('Invalid AES key length');
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const plain = new TextEncoder().encode(JSON.stringify(payloadObj));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, plain);
  return { dd: bytesToBase64(new Uint8Array(cipher)), dv: bytesToBase64(iv) };
}

function newToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toHttpsUrl(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  try {
    const target = new URL(candidate);
    return target.protocol === 'https:' ? target : null;
  } catch (_) {
    return null;
  }
}

export function resolveCallbackUrl() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const candidate = qs.get('callback_url');
    if (candidate) {
      const u = toHttpsUrl(candidate);
      if (u) return u.toString();
    }
  } catch (_) {}

  const tokenCallbackUrl = toHttpsUrl(claimContext.tokenCallbackUrl);
  if (tokenCallbackUrl) return tokenCallbackUrl.toString();

  const fallbackCallbackUrl = toHttpsUrl(typeof window !== 'undefined' ? window.__JDP_CALLBACK_URL__ : null);
  if (fallbackCallbackUrl) return fallbackCallbackUrl.toString();

  return null;
}

export function canClaimScore() {
  return !!resolveCallbackUrl();
}

export function buildClaimUrl(callbackUrl, payload) {
  const u = new URL(callbackUrl);
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

function recordClaim(payload) {
  try {
    const raw = window.localStorage.getItem(CLAIMS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(payload);
    window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(list));
  } catch (_) {}
}

export async function claimScore(score, { timeUsedMs, cause } = {}) {
  if (claimLocked) return { status: 'locked', payload: null };
  claimLocked = true;

  const token = newToken();
  const payload = {
    game: GAME_NAME,
    score: Math.max(0, score | 0),
    token,
    timeUsedMs: timeUsedMs ?? null,
    cause: cause ?? null,
    claimedAt: Date.now(),
  };
  recordClaim(payload);

  try {
    if (payload.score <= 0) {
      claimLocked = false;
      return { status: 'missing_callback', payload };
    }

    const callbackUrl = resolveCallbackUrl();
    if (!callbackUrl) {
      console.info('[flying-ruby] claimScore (no callback_url configured):', payload);
      claimLocked = false;
      return { status: 'missing_callback', payload };
    }

    if (claimContext.launchToken && claimContext.resKey && claimContext.tokenCallbackUrl) {
      const tokenCallbackUrl = toHttpsUrl(claimContext.tokenCallbackUrl);
      if (!tokenCallbackUrl) {
        claimLocked = false;
        return { status: 'missing_callback', payload };
      }

      const encrypted = await encryptGenetPayload(claimContext.resKey, {
        score: payload.score,
        is_suspicious: false,
        data: {
          time_used_ms: payload.timeUsedMs,
          cause: payload.cause,
          claimed_at: payload.claimedAt,
        },
      });
      tokenCallbackUrl.searchParams.set('token', claimContext.launchToken);
      tokenCallbackUrl.searchParams.set('dd', encrypted.dd);
      tokenCallbackUrl.searchParams.set('dv', encrypted.dv);
      window.location.href = tokenCallbackUrl.toString();
      return { status: 'redirecting', payload };
    }

    window.location.href = buildClaimUrl(callbackUrl, payload);
    return { status: 'redirecting', payload };
  } catch (e) {
    console.warn('[flying-ruby] claim submit failed:', e);
    claimLocked = false;
    return { status: 'failed', payload, error: e };
  }
}

export function getRecordedClaims() {
  try { return JSON.parse(window.localStorage.getItem(CLAIMS_KEY) || '[]'); }
  catch (_) { return []; }
}

export function clearRecordedClaims() {
  try { window.localStorage.removeItem(CLAIMS_KEY); }
  catch (_) {}
}
