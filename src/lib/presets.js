/**
 * Presets for optional HTTP/RPC tooling (not the WASM P2P path).
 * Official browser-node bridge is always Official1 — see bridge.js.
 */

import { DEFI_TESTNET, OFFICIAL1 } from './bridge.js';

export const PRESETS = {
  public: {
    id: 'public',
    label: 'Official1 (warthognode)',
    httpBase: OFFICIAL1.httpBase,
    streamUrl: OFFICIAL1.wsStream,
    wsBridge: OFFICIAL1.wsBridge,
    note: 'Official1 full node + browser bridge (wss://…/ws)',
  },
  defi: {
    id: 'defi',
    label: 'DeFi testnet',
    httpBase: DEFI_TESTNET.httpBase,
    streamUrl: DEFI_TESTNET.wsStream,
    wsBridge: DEFI_TESTNET.wsBridge,
    note: 'DeFi testnet',
  },
  local: {
    id: 'local',
    label: 'Local node',
    httpBase: 'http://127.0.0.1:3000',
    streamUrl: 'ws://127.0.0.1:10001/stream',
    wsBridge: 'ws://127.0.0.1:10001',
    note: 'Local full node: HTTP :3000, bridge WS :10001',
  },
};

/** Always start on public so Netlify and first-run demos show live data. Switch to Local when you have a node. */
export const DEFAULT_PRESET_ID = 'public';

/** Derive stream URL from an HTTP base when user enters a custom node. */
export function streamUrlFromHttp(httpBase) {
  try {
    const u = new URL(httpBase);
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${u.host}/stream`;
  } catch {
    return '';
  }
}

export function formatHashrate(N) {
  let n = Number(N) || 0;
  let i = 0;
  while (n >= 1000 && i <= 10) {
    n /= 1000;
    i += 1;
  }
  return `${n.toFixed(2)} ${['h', 'kh', 'Mh', 'Gh', 'Th', 'Ph', 'Eh', 'Zh', 'Yh', 'Rh', 'Qh'][i]}`;
}

export function shortAddr(addr, n = 6) {
  if (!addr || typeof addr !== 'string') return '—';
  if (addr.length <= n * 2 + 1) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}
