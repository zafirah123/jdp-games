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
      const tokenUrl = toHttpsUrl(claimContext.tokenCallbackUrl);
      if (tokenUrl) {
        return tokenUrl.toString();
      }
    }

    if (typeof window !== 'undefined' && window.__JDP_CALLBACK_URL__) {
      const runtimeUrl = toHttpsUrl(window.__JDP_CALLBACK_URL__);
      if (runtimeUrl) {
        return runtimeUrl.toString();
      }
    }

    const fallback = toHttpsUrl(fallbackUrl);
    return fallback ? fallback.toString() : null;
  }

  function toHttpsUrl(candidate) {
    if (!candidate || typeof candidate !== 'string') {
      return null;
    }

    try {
      const target = new URL(candidate);
      return target.protocol === 'https:' ? target : null;
    } catch (_) {
      return null;
    }
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

      if (score <= 0) {
        return null;
      }

      if (ctx.launchToken && ctx.resKey && ctx.tokenCallbackUrl) {
        const tokenCallbackUrl = toHttpsUrl(ctx.tokenCallbackUrl);
        if (!tokenCallbackUrl) {
          return null;
        }

        const encrypted = await encryptGenetPayload(ctx.resKey, {
          score,
          is_suspicious: false,
          ...(extraData ? { data: extraData } : {}),
        });

        tokenCallbackUrl.searchParams.set('token', ctx.launchToken);
        tokenCallbackUrl.searchParams.set('dd', encrypted.dd);
        tokenCallbackUrl.searchParams.set('dv', encrypted.dv);
        return tokenCallbackUrl.toString();
      }

      const callbackUrl = resolveCallbackUrl(ctx, options.fallbackUrl);
      const target = toHttpsUrl(callbackUrl);
      if (!target) {
        return null;
      }

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
