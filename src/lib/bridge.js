/**
 * Official Warthog bridge nodes for browser WASM full nodes.
 *
 * Official1 (warthognode.duckdns.org) is the public full node that exposes
 * a long-lived WebSocket at /ws for browser P2P / WebRTC signaling:
 *
 *   wss://warthognode.duckdns.org/ws
 *
 * Stack (all three required for a live bridge):
 *
 *   1. Node flags (VPS):
 *        --rpc=127.0.0.1:3000
 *        --ws-port=10001 --ws-bind-localhost --ws-x-forwarded-for
 *        --enable-webrtc
 *
 *   2. Nginx (VPS): location /ws → http://127.0.0.1:10001
 *        with Upgrade + Connection + X-Forwarded-For (required by flag above).
 *        Do NOT attach Access-Control-Allow-Origin on the 101 response.
 *
 *   3. This website: COOP/COEP isolation + WS_PEERS pointing at wss://…/ws
 *        (WASM client speaks Sec-WebSocket-Protocol: binary).
 *
 * Note: bare wscat/ws clients may close with 1006 — they are not Warthog P2P.
 * A real WASM browser node is the correct client test.
 *
 * COEP note: this page uses Cross-Origin-Embedder-Policy: require-corp for
 * SharedArrayBuffer. Cross-origin fetch() to Official1 fails unless the node
 * sends Cross-Origin-Resource-Policy. HTTP probes must go through /api/proxy
 * (same-origin). WebSockets are not blocked by COEP.
 */

/** Official public full node + browser bridge (mainnet). */
export const OFFICIAL1 = {
  id: 'official1',
  name: 'Official1',
  host: 'warthognode.duckdns.org',
  /** HTTPS base for JSON RPC */
  httpBase: 'https://warthognode.duckdns.org',
  /**
   * P2P / browser-node WebSocket bridge path.
   * WASM nodes set ENV.WS_PEERS to this URL (semicolon-separated if multiple).
   */
  wsBridge: 'wss://warthognode.duckdns.org/ws',
  /** Client RPC subscription stream (dashboards) — not the P2P bridge. */
  wsStream: 'wss://warthognode.duckdns.org/stream',
  webrtc: true,
  flags: [
    '--rpc=127.0.0.1:3000',
    '--ws-port=10001',
    '--ws-bind-localhost',
    '--ws-x-forwarded-for',
    '--enable-webrtc',
    '--stratum=0.0.0.0:3456',
  ],
};

/** DeFi testnet public node (not the primary Official1 bridge). */
export const DEFI_TESTNET = {
  id: 'defi',
  name: 'DeFi testnet',
  host: 'warthog-defitestnet.duckdns.org',
  httpBase: 'https://warthog-defitestnet.duckdns.org',
  wsBridge: 'wss://warthog-defitestnet.duckdns.org/ws',
  wsStream: 'wss://warthog-defitestnet.duckdns.org/stream',
  webrtc: false,
};

/** Public Official1 bridge (production / Netlify). */
export const DEFAULT_WS_PEERS = OFFICIAL1.wsBridge;

/**
 * Same-origin dev proxy path (Vite → Official1). Only works with `npm run dev`
 * after astro.config proxy is loaded (restart dev server if you just added it).
 */
export const LOCAL_WS_BRIDGE_PATH = '/ws-bridge';

/** True when the page is served from a loopback host. */
export function isLocalDevHost(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '[::1]'
    || hostname === '::1';
}

/**
 * ws(s)://<this-host>/ws-bridge — preferred for local Astro dev so the browser
 * only talks to the dev server; Node makes the outbound wss:// to Official1.
 */
export function localDevWsBridgeUrl(
  loc = typeof window !== 'undefined' ? window.location : null,
) {
  if (!loc) return `ws://127.0.0.1:4321${LOCAL_WS_BRIDGE_PATH}`;
  const scheme = loc.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${loc.host}${LOCAL_WS_BRIDGE_PATH}`;
}

/**
 * Default WS_PEERS for this page:
 * - localhost / 127.0.0.1 → same-origin /ws-bridge (dev proxy)
 * - otherwise → public Official1 wss
 */
export function resolveDefaultWsPeers(
  loc = typeof window !== 'undefined' ? window.location : null,
) {
  if (loc && isLocalDevHost(loc.hostname)) {
    return localDevWsBridgeUrl(loc);
  }
  return DEFAULT_WS_PEERS;
}

export const BRIDGE_PRESETS = [OFFICIAL1, DEFI_TESTNET];

const PROXY_URL = '/api/proxy';

/**
 * HTTP health via same-origin proxy so COEP require-corp pages work.
 * Direct browser fetch to Official1 fails without CORP on the node.
 */
export async function probeBridgeHttp(httpBase = OFFICIAL1.httpBase, { timeoutMs = 12000 } = {}) {
  const base = String(httpBase || '').replace(/\/$/, '');
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Prefer same-origin proxy (works under COEP). Fall back to direct only if proxy missing.
    let res;
    try {
      res = await fetch(PROXY_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nodeBase: base,
          nodePath: 'chain/head',
          method: 'GET',
        }),
      });
    } catch {
      // Dev edge case: try direct (will fail under COEP on Official1)
      res = await fetch(`${base}/chain/head`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    }

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `Non-JSON from chain/head (HTTP ${res.status}). Under COEP, use /api/proxy.`,
      };
    }
    if (!res.ok || json?.code !== 0) {
      return { ok: false, error: json?.error || `HTTP ${res.status}`, data: json?.data };
    }
    return {
      ok: true,
      data: json.data,
      height: json.data?.height,
      synced: json.data?.synced,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.name === 'AbortError' ? 'timeout' : (err.message || String(err)),
    };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Probe a WebSocket URL. Resolves { ok, detail, openedMs } — never throws.
 *
 * ⚠ Official1 P2P `/ws` side effects (core PeerServer::AuthenticateInbound):
 * - Successful upgrade rate-limits that public IP ~30s (ECONNRATELIMIT)
 * - Incomplete GRUNT that times out (5s) can ban the IP ~20 minutes (ETIMEOUT)
 * So default UI must NOT open `/ws` on every page load — it steals the slot
 * from Start full WASM node. Prefer HTTP-only health, or terminal
 * `scripts/test-grunt-handshake.mjs`.
 *
 * `/stream` (RPC) is a different backend and is safe to probe.
 *
 * Success = onopen. Bare clients often close with 1006 after that.
 */
export function probeBridgeWs(wsUrl = OFFICIAL1.wsBridge, { timeoutMs = 14000, protocol = 'binary' } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let opened = false;
    let ws;
    const start = Date.now();

    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close();
        }
      } catch {
        // ignore
      }
      resolve(result);
    };

    const timer = setTimeout(
      () => done({
        ok: false,
        detail: opened
          ? 'timeout after open (unexpected)'
          : 'timeout waiting for open — nginx /ws missing or node not on :10001',
        layer: 'nginx-or-node',
      }),
      timeoutMs,
    );

    try {
      // Match core browser client (emscripten_wsconnection.hpp: protocols = "binary")
      ws = protocol
        ? new WebSocket(wsUrl, protocol)
        : new WebSocket(wsUrl);
    } catch (err) {
      done({ ok: false, detail: err.message || String(err), layer: 'client' });
      return;
    }

    ws.onopen = () => {
      opened = true;
      const openedMs = Date.now() - start;
      // Settle immediately on open — close afterward is normal for bare clients.
      done({ ok: true, detail: 'open', openedMs, protocol: ws.protocol || protocol || '' });
    };

    ws.onerror = () => {
      // Browsers often fire error then close; only fail if we never opened.
      if (!opened) {
        done({
          ok: false,
          detail: 'WebSocket error before open (502 / refused / blocked)',
          layer: 'nginx-or-node',
          hint:
            '502 usually means nginx location /ws → 127.0.0.1:10001 is wrong, '
            + 'or wart-node is missing --ws-port=10001 (and --ws-x-forwarded-for so XFF is required).',
        });
      }
    };

    ws.onclose = (ev) => {
      if (!settled && !opened) {
        done({
          ok: false,
          detail: `closed before open code=${ev.code}${ev.reason ? ` ${ev.reason}` : ''}`,
          layer: 'nginx-or-node',
        });
      }
      // If already opened, close is fine (1006 common for non-protocol clients).
    };
  });
}

/**
 * Safe page-load health: HTTP only (+ optional /stream).
 * Does NOT open P2P `/ws` (avoids Official1 per-IP rate limit / ban).
 */
export async function probeOfficial1Safe() {
  const http = await probeBridgeHttp(OFFICIAL1.httpBase);
  let stream = { ok: false, detail: 'skipped' };
  try {
    stream = await probeBridgeWs(OFFICIAL1.wsStream, { protocol: null, timeoutMs: 8000 });
  } catch {
    // ignore
  }
  return {
    http,
    ws: {
      ok: null,
      skipped: true,
      detail:
        'P2P /ws not auto-probed (Official1 rate-limits 1 handshake/IP). '
        + 'Use Start full WASM node or: node scripts/test-grunt-handshake.mjs',
    },
    stream,
    official1: OFFICIAL1,
  };
}

/** Full probe including /ws — burns Official1 rate-limit slot; manual only. */
export async function probeOfficial1() {
  const http = await probeBridgeHttp(OFFICIAL1.httpBase);
  const ws = await probeBridgeWs(OFFICIAL1.wsBridge, { protocol: 'binary' });
  const stream = await probeBridgeWs(OFFICIAL1.wsStream, { protocol: null });
  return { http, ws, stream, official1: OFFICIAL1 };
}
