(function () {
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
        tokenCallbackUrl: (jwtPayload && typeof jwtPayload.callback_url === 'string') ? jwtPayload.callback_url : null,
      };
    } catch (_) {
      return { launchToken: null, pageTitle: null, resKey: null, tokenCallbackUrl: null };
    }
  }

  function applyPageTitleToHeading(pageTitle, headingId) {
    const t = (pageTitle || '').trim();
    if (!t) return;
    document.title = t;
    const el = document.getElementById(headingId || 'menuTitle');
    if (el) el.textContent = t;
  }

  function resolveCallbackUrl(claimContext, fallbackUrl) {
    try {
      const qs = new URLSearchParams(window.location.search);
      const candidate = qs.get('callback_url');
      if (candidate) {
        const u = toHttpsUrl(candidate);
        if (u) return u.toString();
      }
    } catch (_) {}

    if (claimContext && claimContext.tokenCallbackUrl) {
      const tokenUrl = toHttpsUrl(claimContext.tokenCallbackUrl);
      if (tokenUrl) return tokenUrl.toString();
    }
    if (typeof window !== 'undefined' && window.__JDP_CALLBACK_URL__) {
      const runtimeUrl = toHttpsUrl(window.__JDP_CALLBACK_URL__);
      if (runtimeUrl) return runtimeUrl.toString();
    }
    const fallback = toHttpsUrl(fallbackUrl);
    return fallback ? fallback.toString() : null;
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

  function getCryptoApi() {
    if (typeof window === 'undefined') return null;
    return window.crypto || window.msCrypto || null;
  }

  function utf8Encode(value) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
    const encoded = unescape(encodeURIComponent(String(value)));
    const bytes = new Uint8Array(encoded.length);
    for (let i = 0; i < encoded.length; i += 1) bytes[i] = encoded.charCodeAt(i);
    return bytes;
  }

  async function encryptGenetPayload(aesKey, payloadObj) {
    const cryptoApi = getCryptoApi();
    if (!cryptoApi || !cryptoApi.subtle) throw new Error('WebCrypto unavailable');
    const keyBytes = utf8Encode(aesKey);
    if (keyBytes.length !== 16) throw new Error('Invalid AES key length');
    const key = await cryptoApi.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']);
    const iv = cryptoApi.getRandomValues(new Uint8Array(16));
    const plain = utf8Encode(JSON.stringify(payloadObj));
    const cipher = await cryptoApi.subtle.encrypt({ name: 'AES-CBC', iv }, key, plain);
    return { dd: bytesToBase64(new Uint8Array(cipher)), dv: bytesToBase64(iv) };
  }

  function newToken() {
    const cryptoApi = getCryptoApi();
    return (cryptoApi && cryptoApi.randomUUID)
      ? cryptoApi.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function buildClaimUrl(options) {
    try {
      const ctx = options.claimContext || getClaimContext();
      const score = Math.max(0, options.score | 0);
      const extraData = options.extraData || null;

      if (score <= 0) return null;

      if (ctx.launchToken && ctx.resKey && ctx.tokenCallbackUrl) {
        const tokenCallbackUrl = toHttpsUrl(ctx.tokenCallbackUrl);
        if (!tokenCallbackUrl) return null;

        const encrypted = await encryptGenetPayload(ctx.resKey, {
          score,
          is_suspicious: false,
          ...(extraData ? { data: extraData } : {}),
        });
        const response = await fetch(tokenCallbackUrl.toString(), {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            token: ctx.launchToken,
            dd: encrypted.dd,
            dv: encrypted.dv,
          }),
        });

        let data = null;
        try {
          data = await response.json();
        } catch (_) {
          data = null;
        }

        if (!response.ok) {
          const message = data && typeof data.message === 'string' ? data.message : 'Unable to claim score';
          throw new Error(message);
        }

        if (!data || data.success !== true || typeof data.redirect_url !== 'string' || !data.redirect_url.trim()) {
          throw new Error('Unable to claim score');
        }

        return data.redirect_url.trim();
      }

      const callbackUrl = resolveCallbackUrl(ctx, options.fallbackUrl);
      const target = toHttpsUrl(callbackUrl);
      if (!target) return null;

      target.searchParams.set('game', String(options.gameName || 'unknown-game'));
      target.searchParams.set('score', String(score));
      target.searchParams.set('token', newToken());

      const extraQuery = options.extraQuery || null;
      if (extraQuery && typeof extraQuery === 'object') {
        Object.entries(extraQuery).forEach(([k, v]) => {
          if (v !== undefined && v !== null) target.searchParams.set(k, String(v));
        });
      }

      return target.toString();
    } catch (_) {
      return null;
    }
  }

  window.ClaimCallback = {
    getClaimContext,
    applyPageTitleToHeading,
    resolveCallbackUrl,
    buildClaimUrl,
  };
})();


