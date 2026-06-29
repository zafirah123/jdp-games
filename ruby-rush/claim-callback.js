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
    const title = (pageTitle || '').trim();
    if (!title) {
      return;
    }

    document.title = title;
    const el = document.getElementById(headingId || 'menuTitle');
    if (el) {
      el.textContent = title;
    }
  }

  function resolveCallbackUrl(claimContext, fallbackUrl) {
    try {
      const qs = new URLSearchParams(window.location.search);
      const candidate = qs.get('callback_url');
      if (candidate) {
        const url = new URL(candidate);
        if (url.protocol === 'https:') {
          return url.toString();
        }
      }
    } catch (_) {}

    if (claimContext && claimContext.tokenCallbackUrl) {
      return claimContext.tokenCallbackUrl;
    }

    if (typeof window !== 'undefined' && window.__JDP_CALLBACK_URL__) {
      return window.__JDP_CALLBACK_URL__;
    }

    return fallbackUrl || null;
  }

  function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      return JSON.parse(base64UrlDecode(parts[1]));
    } catch (_) {
      return null;
    }
  }

  function base64UrlDecode(input) {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
  }

  function bytesToBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) {
      bin += String.fromCharCode(bytes[i]);
    }

    return btoa(bin);
  }

  async function encryptGenetPayload(aesKey, payloadObj) {
    if (!crypto || !crypto.subtle) {
      throw new Error('WebCrypto unavailable');
    }

    const keyBytes = new TextEncoder().encode(aesKey);
    if (keyBytes.length !== 16) {
      throw new Error('Invalid AES key length');
    }

    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const plain = new TextEncoder().encode(JSON.stringify(payloadObj));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, plain);

    return {
      dd: bytesToBase64(new Uint8Array(cipher)),
      dv: bytesToBase64(iv),
    };
  }

  function newToken() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function buildClaimUrl(options) {
    try {
      const ctx = options.claimContext || getClaimContext();
      const score = Math.max(0, options.score | 0);
      const extraData = options.extraData || null;

      if (ctx.launchToken && ctx.resKey && ctx.tokenCallbackUrl) {
        const encrypted = await encryptGenetPayload(ctx.resKey, {
          score,
          is_suspicious: false,
          ...(extraData ? { data: extraData } : {}),
        });

        const target = new URL(ctx.tokenCallbackUrl);
        target.searchParams.set('token', ctx.launchToken);
        target.searchParams.set('dd', encrypted.dd);
        target.searchParams.set('dv', encrypted.dv);
        return target.toString();
      }

      const callbackUrl = resolveCallbackUrl(ctx, options.fallbackUrl);
      if (!callbackUrl) {
        return null;
      }

      const target = new URL(callbackUrl);
      target.searchParams.set('game', String(options.gameName || 'unknown-game'));
      target.searchParams.set('score', String(score));
      target.searchParams.set('token', newToken());

      const extraQuery = options.extraQuery || null;
      if (extraQuery && typeof extraQuery === 'object') {
        Object.entries(extraQuery).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            target.searchParams.set(k, String(v));
          }
        });
      }

      return target.toString();
    } catch (err) {
      console.warn('[ruby-rush] buildClaimUrl failed', err);
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
