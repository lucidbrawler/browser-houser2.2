/**
 * Boot the Warthog full node compiled to WebAssembly (Emscripten + pthreads).
 *
 * Assets (served from /public/node → /node/):
 *   wart-node.js  ·  wart-node.wasm  ·  wart-node.worker.js
 *
 * Requires cross-origin isolation (COOP same-origin + COEP require-corp)
 * so SharedArrayBuffer is available for pthreads.
 *
 * P2P bridge: Official1 full node at warthognode.duckdns.org must expose /ws
 * (see src/lib/bridge.js and docs/OFFICIAL1-BRIDGE.md).
 *
 * Core reads getenv("WS_PEERS") — semicolon-separated wss:// URLs
 * (core/src/node/config/browser.cpp). Browser client uses WS protocol "binary".
 *
 * IMPORTANT (Emscripten MODULARIZE): after the factory runs, the *constructor
 * argument* (moduleArg) is poisoned for properties that were added on the
 * real Module. Never read/write ENV (or other runtime fields) on the config
 * object you passed in — only on the `mod` passed to preRun, or the instance
 * returned by the factory promise.
 */

import {
  DEFAULT_WS_PEERS as OFFICIAL_WS_PEERS,
  resolveDefaultWsPeers,
} from './bridge.js';

/** Default P2P bridge (public Official1). Prefer resolveWsPeers() at runtime. */
export const DEFAULT_WS_PEERS = OFFICIAL_WS_PEERS;

export const NODE_GLUE_URL = '/node/wart-node.js';

export function isCrossOriginIsolated() {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated === true;
}

export function hasSharedArrayBuffer() {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * OPFS (Origin Private File System) is where the WASM node stores
 * /opfs/chain.db3, peers_v2.db3, rxtx.db3 via Emscripten wasmfs-opfs.
 *
 * "attempt to write a readonly database" almost always means:
 * - another tab/worker still holds createSyncAccessHandle on those files
 * - a crashed Start left the exclusive lock held until the tab is closed
 * - OPFS not available (non-Chromium / insecure context)
 */
export function hasOpfs() {
  return typeof navigator !== 'undefined'
    && navigator.storage
    && typeof navigator.storage.getDirectory === 'function';
}

/** List top-level OPFS entry names (best-effort). */
export async function listOpfsEntries() {
  if (!hasOpfs()) return [];
  try {
    const root = await navigator.storage.getDirectory();
    const names = [];
    // for-await works on FileSystemDirectoryHandle in modern Chromium
    // @ts-ignore
    for await (const [name] of root.entries()) {
      names.push(name);
    }
    return names;
  } catch {
    return [];
  }
}

const OPFS_NEEDS_RESET_KEY = 'wartOpfsNeedsReset';

/** Persist that the last Start hit a locked/readonly OPFS DB. */
export function markOpfsNeedsReset() {
  try {
    sessionStorage.setItem(OPFS_NEEDS_RESET_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearOpfsNeedsResetFlag() {
  try {
    sessionStorage.removeItem(OPFS_NEEDS_RESET_KEY);
  } catch {
    // ignore
  }
}

export function opfsNeedsReset() {
  try {
    return sessionStorage.getItem(OPFS_NEEDS_RESET_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Kill Emscripten pthread workers that hold OPFS createSyncAccessHandle locks.
 * Without this, removeEntry fails with "modifications are not allowed".
 */
export function terminateWasmWorkers(log) {
  const mods = [];
  if (typeof window !== 'undefined') {
    if (window.wartNode) mods.push(window.wartNode);
    if (window.Module && window.Module !== window.wartNode) mods.push(window.Module);
  }

  let terminated = 0;
  for (const mod of mods) {
    try {
      const pt = mod?.PThread;
      if (pt && typeof pt.terminateAllThreads === 'function') {
        const n = (pt.runningWorkers?.length || 0) + (pt.unusedWorkers?.length || 0);
        pt.terminateAllThreads();
        terminated += n || 1;
        log?.(`[opfs] terminated Emscripten pthread pool (${n || '?'} workers)`);
      }
    } catch (e) {
      log?.(`[opfs] PThread.terminateAllThreads failed: ${e?.message || e}`);
    }
    // Best-effort: individual worker.terminate if still listed
    try {
      for (const w of mod?.PThread?.runningWorkers || []) {
        try { w.terminate?.(); } catch { /* ignore */ }
      }
      for (const w of mod?.PThread?.unusedWorkers || []) {
        try { w.terminate?.(); } catch { /* ignore */ }
      }
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined') {
    try { window.wartNode = undefined; } catch { /* ignore */ }
    try { window.Module = undefined; } catch { /* ignore */ }
  }

  return { terminated };
}

/**
 * Delete all OPFS entries for this origin so SQLite can recreate DBs writable.
 *
 * Exclusive createSyncAccessHandle locks (held by pthread workers or other tabs)
 * make removeEntry throw NotAllowedError. Always terminate local workers first.
 */
export async function clearOpfsStorage({
  retries = 6,
  retryDelayMs = 400,
  terminateWorkers = true,
  log,
} = {}) {
  if (!hasOpfs()) {
    return { ok: false, error: 'OPFS not available (need Chromium + secure context)' };
  }

  if (terminateWorkers) {
    terminateWasmWorkers(log);
    // Handles are released asynchronously after worker death.
    await new Promise((r) => setTimeout(r, 500));
  }

  let lastRemoved = [];
  let lastFailed = [];

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const root = await navigator.storage.getDirectory();
      const removed = [];
      const failed = [];
      // Snapshot names first — mutating during async iteration is flaky.
      const names = [];
      // @ts-ignore
      for await (const [name] of root.entries()) {
        names.push(name);
      }
      for (const name of names) {
        try {
          await root.removeEntry(name, { recursive: true });
          removed.push(name);
        } catch (e) {
          failed.push(`${name}: ${e?.message || e}`);
        }
      }
      lastRemoved = removed;
      lastFailed = failed;
      if (!failed.length) {
        // Confirm empty
        const left = await listOpfsEntries();
        if (left.length === 0) {
          clearOpfsNeedsResetFlag();
          return { ok: true, removed, attempts: attempt + 1 };
        }
        lastFailed = left.map((n) => `${n}: still present after remove`);
      }
    } catch (e) {
      lastFailed = [e?.message || String(e)];
    }
    // Re-terminate between retries in case something respawned
    if (terminateWorkers && attempt < retries - 1) {
      terminateWasmWorkers(log);
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
    }
  }

  return {
    ok: false,
    removed: lastRemoved,
    error:
      `Could not remove: ${lastFailed.join('; ')}. `
      + 'Another tab on this same host:port is almost certainly holding the OPFS lock. '
      + 'Close ALL tabs for this origin (check other windows too), then Recover again. '
      + 'Nuclear: DevTools → Application → Storage → "Clear site data".',
  };
}

/**
 * Full recovery path: kill workers → wipe OPFS → optional hard reload.
 * Prefer this over Clear alone when SQLite is readonly mid-run.
 */
export async function recoverOpfsStorage({ reload = true, log } = {}) {
  markOpfsNeedsReset();
  log?.('[opfs] recover: terminating workers…');
  terminateWasmWorkers(log);
  await new Promise((r) => setTimeout(r, 600));

  log?.('[opfs] recover: clearing OPFS…');
  const result = await clearOpfsStorage({
    retries: 8,
    retryDelayMs: 350,
    terminateWorkers: true,
    log,
  });

  if (result.ok) {
    log?.(`[opfs] recover: cleared ${result.removed?.join(', ') || '(empty)'}`);
  } else {
    log?.(`[opfs] recover: clear incomplete — ${result.error}`);
  }

  if (reload && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('resetDb', '1');
    // Always reload: even if clear failed, dead workers free locks on next document.
    // Bootstrap script on next load wipes OPFS before React/WASM mount.
    log?.('[opfs] recover: reloading with ?resetDb=1 …');
    window.location.replace(url.toString());
    return { ...result, reloading: true };
  }

  return { ...result, reloading: false };
}

/**
 * Best-effort prep before booting WASM:
 * - If a prior run marked OPFS dirty, clear it
 * - Empty origin is fine (DBs created on first start)
 */
export async function prepareOpfsForStart({ forceClear = false } = {}) {
  if (!hasOpfs()) {
    return {
      ok: false,
      error:
        'OPFS is not available. Use Chrome/Edge on http://127.0.0.1 or https.',
    };
  }
  const entries = await listOpfsEntries();
  const shouldClear = forceClear || opfsNeedsReset();
  if (!shouldClear) {
    return { ok: true, cleared: false, entries };
  }
  const result = await clearOpfsStorage();
  if (!result.ok) {
    return {
      ok: false,
      cleared: false,
      entries,
      error: result.error,
    };
  }
  return {
    ok: true,
    cleared: true,
    removed: result.removed,
    entries: await listOpfsEntries(),
  };
}

/** True when the exception looks like OPFS/SQLite lock / readonly. */
export function isOpfsReadonlyError(err) {
  const msg = String(err?.message || err || '');
  return /readonly database|NoModificationAllowed|InvalidStateError|SQLITE_READONLY|write a readonly/i.test(msg);
}

/** Resolve bridge peer list: ?peers= wins, else localStorage, else env-aware default. */
export function resolveWsPeers(search = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const params = new URLSearchParams(search);
    const fromQuery = params.get('peers') || params.get('WS_PEERS');
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  } catch {
    // ignore
  }
  try {
    const stored = localStorage.getItem('wsPeers');
    if (stored && stored.trim()) {
      // Old sessions often saved public wss:// while local dev proxy is healthier.
      // Allow override via ?peers=; otherwise prefer loopback proxy on localhost.
      const pageDefault = resolveDefaultWsPeers();
      if (
        typeof window !== 'undefined'
        && pageDefault.includes('/ws-bridge')
        && /warthognode\.duckdns\.org\/ws/.test(stored)
        && !paramsHasForcePublic(search)
      ) {
        return pageDefault;
      }
      return stored.trim();
    }
  } catch {
    // ignore
  }
  return resolveDefaultWsPeers();
}

function paramsHasForcePublic(search) {
  try {
    return new URLSearchParams(search).get('publicWs') === '1';
  } catch {
    return false;
  }
}

/**
 * Stamp WS_PEERS into the live Emscripten ENV (getenv).
 * `mod` must be the runtime Module instance (preRun arg or factory result),
 * NOT the constructor config object.
 */
function applyWsPeersEnv(mod, peers) {
  const value = String(peers || DEFAULT_WS_PEERS);
  if (!mod || typeof mod !== 'object') {
    throw new Error('applyWsPeersEnv: missing runtime Module');
  }
  // Mutate the existing ENV object created by glue (`var ENV = {}; Module.ENV = ENV`).
  if (!mod.ENV) mod.ENV = {};
  mod.ENV.WS_PEERS = value;
  if (mod.getEnvStrings && mod.getEnvStrings.strings) {
    mod.getEnvStrings.strings = undefined;
  }
  return value;
}

/**
 * Build the Emscripten Module *constructor argument* (config).
 * Do not treat this object as the live Module after initModule() returns.
 */
export function createModuleConfig({
  wsPeers,
  print,
  setStatus,
  onChain,
  onConnect,
  onDisconnect,
  onMempoolAdd,
  onMempoolErase,
  onProgress,
} = {}) {
  const peers = wsPeers || DEFAULT_WS_PEERS;
  // Local state for setStatus throttling — never hang fields off the config
  // object after Emscripten poisons moduleArg getters.
  const statusState = { time: Date.now(), text: '' };
  let depTotal = 0;

  const config = {
    /** Used by startWasmNode installLocalBridgeWsRewrite. */
    __wsPeers: peers,

    locateFile(path) {
      if (path.endsWith('.wasm') || path.endsWith('.worker.js') || path.endsWith('.worker.mjs') || path.endsWith('.js')) {
        return `/node/${path.split('/').pop().replace(/\.mjs$/, '.js')}`;
      }
      return `/node/${path}`;
    },

    /**
     * preRun receives the *real* Module. Set ENV here before C main/getenv.
     */
    preRun: [
      (mod) => {
        try {
          const value = applyWsPeersEnv(mod, peers);
          print?.(`[preRun] ENV.WS_PEERS=${value}`);
        } catch (e) {
          print?.(`[preRun] ENV set failed: ${e?.message || e}`);
        }
      },
    ],

    onRuntimeInitialized() {
      // Do NOT touch the constructor config object here (it is poisoned).
      print?.('[runtime] onRuntimeInitialized — C/C++ main will run');
      print?.(`[runtime] WS_PEERS=${peers}`);
      setStatus?.('Runtime initialized — full node starting');
    },

    onChain: (event) => onChain?.(event),
    onConnect: (event) => onConnect?.(event),
    onDisconnect: (event) => onDisconnect?.(event),
    onMempoolAdd: (event) => onMempoolAdd?.(event),
    onMempoolErase: (event) => onMempoolErase?.(event),

    print: (...args) => {
      const text = args.map(String).join(' ');
      console.log(text);
      print?.(text);
    },
    printErr: (...args) => {
      const text = args.map(String).join(' ');
      console.error(text);
      print?.(text);
    },

    setStatus: (text) => {
      if (text === statusState.text) return;
      const m = String(text || '').match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
      const now = Date.now();
      if (m && now - statusState.time < 30) return;
      statusState.time = now;
      statusState.text = text;
      if (m) {
        onProgress?.({
          label: m[1],
          value: parseInt(m[2], 10) * 100,
          max: parseInt(m[4], 10) * 100,
        });
        setStatus?.(m[1].trim());
      } else {
        onProgress?.(null);
        setStatus?.(text || '');
      }
    },

    totalDependencies: 0,
    monitorRunDependencies(left) {
      depTotal = Math.max(depTotal, left);
      this.totalDependencies = depTotal;
      config.setStatus(
        left
          ? `Preparing… (${depTotal - left}/${depTotal})`
          : 'All downloads complete.',
      );
    },
  };

  return config;
}

/**
 * Load modularized Emscripten factory from /public/node without Vite transforming it.
 */
async function loadEmscriptenFactory(glueUrl = NODE_GLUE_URL) {
  const absolute = new URL(glueUrl, window.location.href).href;
  const res = await fetch(absolute, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`Failed to load ${glueUrl}: HTTP ${res.status} ${res.statusText}`);
  }
  const source = await res.text();
  const patched =
    `const __wartGlueMetaUrl = ${JSON.stringify(absolute)};\n`
    + source.replace(/import\.meta\.url/g, '__wartGlueMetaUrl');
  const blob = new Blob([patched], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const mod = await import(/* @vite-ignore */ blobUrl);
    const initModule = mod.default;
    if (typeof initModule !== 'function') {
      throw new Error('wart-node.js did not export a default factory function');
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return initModule;
  } catch (err) {
    URL.revokeObjectURL(blobUrl);
    throw err;
  }
}

/**
 * Pack NodeVersion the same way as core `NodeVersion(major, minor, patch)`:
 *   (major << 16) | (minor << 8) | patch   — network byte order on the wire.
 * WASM public/node build advertises 0.7.58 (see wart-node.wasm strings).
 */
export function packNodeVersion(major, minor, patch) {
  return ((major & 0xff) << 16) | ((minor & 0xff) << 8) | (patch & 0xff);
}

export function unpackNodeVersion(u32) {
  const v = u32 >>> 0;
  return {
    major: (v >> 16) & 0xff,
    minor: (v >> 8) & 0xff,
    patch: v & 0xff,
    text: `${(v >> 16) & 0xff}.${(v >> 8) & 0xff}.${v & 0xff}`,
  };
}

/** This browser WASM node version (must match public/node wart-node build). */
export const WASM_NODE_VERSION = { major: 0, minor: 7, patch: 58 };

/**
 * Build outbound "WARTHOG GRUNT?" (24 bytes) — core ConnectionBase::send_handshake outbound.
 * Layout: magic(14) + u32be version + zeros(4) with u16be listen-port at offset 22.
 */
export function buildConnectGrunt(version = WASM_NODE_VERSION, listenPort = 0) {
  const enc = new TextEncoder();
  const grunt = new Uint8Array(24);
  grunt.set(enc.encode('WARTHOG GRUNT?'), 0);
  const ver = packNodeVersion(version.major, version.minor, version.patch);
  new DataView(grunt.buffer).setUint32(14, ver >>> 0, false);
  // offsets 18–21 already 0; port overwrites 22–23
  new DataView(grunt.buffer).setUint16(22, listenPort & 0xffff, false);
  return grunt;
}

/**
 * Install WebSocket shim for browser full-node P2P:
 * 1) Rewrite legacy localhost:10001 dials → Official1 wss
 * 2) Complete Warthog binary GRUNT handshake in JS before WASM onopen
 *
 * IMPORTANT: do NOT `class X extends WebSocket`. Extending WebSocket is broken
 * in Chromium (and others): the socket often never reaches OPEN and dies with
 * 1006 instantly — which matches "terminal GRUNT works, browser Start fails".
 * We use Proxy + Reflect.construct so the socket is a real native WebSocket.
 *
 * Wire format (outbound client), same as core ConnectionBase:
 *   → 24B  "WARTHOG GRUNT?" + u32be version + 4 zero + u16be port
 *   ← 22B  "WARTHOG GRUNT!" + u32be version + 4 zero
 *   → 1B   0x00 ack
 * then length-prefixed P2P messages.
 */
export function installLocalBridgeWsRewrite(targetWssUrl, log) {
  if (typeof window === 'undefined') return;
  const target = String(targetWssUrl || DEFAULT_WS_PEERS).split(';')[0].trim();
  if (!target) return;

  window.__wartWsRewriteTarget = target;

  // Capture the browser's real WebSocket once. Never capture our own Proxy as "native".
  if (!window.__wartNativeWebSocket) {
    window.__wartNativeWebSocket = window.WebSocket;
  }

  // v4 = delay onopen only; C++ does real wire GRUNT (no JS dual-handshake)
  // v3 = JS wire GRUNT + synthetic SM (completed GRUNT then C++ closed → 1006)
  // v2 = Proxy/native construct (v1 class-extends was broken in Chromium → instant 1006)
  if (window.__wartWsRewriteInstalled && window.__wartWsRewriteVersion === 4) {
    log?.(`[ws-handshake] target updated → ${target}`);
    return;
  }

  const Orig = window.__wartNativeWebSocket || window.WebSocket;
  const localBridge = /^(ws:\/\/)(127\.0\.0\.1|localhost|\[::1\]):10001\/?$/i;
  // Official1 /ws, local Vite /ws-bridge, or legacy localhost:10001
  const isP2pBridge = (u) =>
    typeof u === 'string'
    && (
      /\/ws-bridge\/?(\?|$)/.test(u)
      || /\/ws\/?(\?|$)/.test(u)
      || localBridge.test(u)
    )
    && !/\/stream\/?(\?|$)/.test(u);

  function toU8(data) {
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (data instanceof Uint8Array) return data;
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    return null;
  }

  function normalizeProtocols(protocols, bridge) {
    let protos = protocols;
    if (bridge && (protos === undefined || protos === null || protos === '')) {
      return 'binary';
    }
    // Emscripten passes protocols.split(",") → ["binary"]
    if (Array.isArray(protos) && protos.length === 1) return protos[0];
    return protos;
  }

  /**
   * P2P WebSocket glue (v4) — keep this minimal.
   *
   * Earlier v2/v3 did the full GRUNT in JS, then faked the same handshake for C++.
   * Wire GRUNT succeeded, then C++ hit MessageState and the socket died with 1006
   * (bufferedLeft=0 — client-side abort before peer frames). Dual handshake is wrong.
   *
   * Correct model (matches CLI tester + C++ ConnectionBase):
   *   1) open socket (binary subprotocol)
   *   2) wait ~250ms so PeerServer authenticate/start_read can finish
   *   3) fire WASM onopen → C++ sends GRUNT? on the wire itself
   *   4) forward all messages/sends unchanged
   *
   * We only intercept handler *assignment* so defineProperty can delay onopen;
   * we do not rewrite GRUNT bytes.
   */
  function installP2pWsGlue(ws, finalUrl) {
    let cppOnOpen = null;
    let cppOnMessage = null;
    let cppOnClose = null;
    let cppOnError = null;
    let openedAt = 0;
    let wasmNotified = false;
    let openTimer = null;
    /** @type {MessageEvent[]} */
    const earlyMessages = [];

    ws.binaryType = 'arraybuffer';

    // Capture Emscripten handler assignment. defineProperty also prevents the
    // browser from auto-invoking onopen on the open event (we call it ourselves).
    Object.defineProperty(ws, 'onopen', {
      configurable: true,
      enumerable: true,
      get: () => cppOnOpen,
      set: (fn) => { cppOnOpen = fn; },
    });
    Object.defineProperty(ws, 'onmessage', {
      configurable: true,
      enumerable: true,
      get: () => cppOnMessage,
      set: (fn) => { cppOnMessage = fn; },
    });
    Object.defineProperty(ws, 'onclose', {
      configurable: true,
      enumerable: true,
      get: () => cppOnClose,
      set: (fn) => { cppOnClose = fn; },
    });
    Object.defineProperty(ws, 'onerror', {
      configurable: true,
      enumerable: true,
      get: () => cppOnError,
      set: (fn) => { cppOnError = fn; },
    });

    const hexPrefix = (u8, n = 24) =>
      [...u8.subarray(0, Math.min(n, u8.length))]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    const deliverMessage = (ev) => {
      try {
        cppOnMessage?.(ev);
      } catch (e) {
        log?.(`[ws-handshake] cpp onmessage error: ${e?.message || e}`);
      }
    };

    const notifyWasmOpen = () => {
      if (wasmNotified || ws.readyState !== Orig.OPEN) return;
      wasmNotified = true;
      log?.(
        `[ws-handshake] notifying WASM onopen after settle `
        + `(${Date.now() - openedAt}ms) — C++ will send GRUNT? on wire`,
      );
      try {
        cppOnOpen?.({ type: 'open', target: ws });
      } catch (e) {
        log?.(`[ws-handshake] cpp onopen error: ${e?.message || e}`);
        console.error('[ws-handshake] cpp onopen error', e);
      }
      // Flush anything that arrived in the settle window (should be rare).
      while (earlyMessages.length) {
        deliverMessage(earlyMessages.shift());
      }
    };

    ws.addEventListener('open', () => {
      openedAt = Date.now();
      log?.(
        `[ws-handshake] open (${finalUrl}) — settle 250ms then WASM onopen `
        + '(C++ owns GRUNT; no JS dual-handshake)',
      );
      openTimer = setTimeout(notifyWasmOpen, 250);
    });

    ws.addEventListener('message', (ev) => {
      const u8 = toU8(ev.data) || new Uint8Array(0);
      const magic = new TextDecoder().decode(u8.subarray(0, Math.min(14, u8.length)));
      log?.(
        `[ws-handshake] rx ${u8.length}B magic=${JSON.stringify(magic)} `
        + `hex=${hexPrefix(u8)} wasmOpen=${wasmNotified}`,
      );
      if (!wasmNotified) {
        // Should almost never happen before C++ sends GRUNT.
        earlyMessages.push(ev);
        return;
      }
      deliverMessage(ev);
    });

    ws.addEventListener('close', (ev) => {
      if (openTimer) clearTimeout(openTimer);
      const ms = openedAt ? Date.now() - openedAt : -1;
      log?.(
        `[ws-handshake] close code=${ev.code} wasClean=${ev.wasClean} `
        + `wasmOpen=${wasmNotified} openForMs=${ms} `
        + `reason=${JSON.stringify(ev.reason || '')}`,
      );
      cppOnClose?.(ev);
    });

    ws.addEventListener('error', () => {
      log?.(
        `[ws-handshake] socket error (readyState=${ws.readyState} url=${finalUrl})`,
      );
      cppOnError?.({ type: 'error', target: ws });
    });

    // Log outbound frames (do not rewrite). Helps see Init after GRUNT.
    const protoSend = Orig.prototype.send;
    ws.send = function wartSend(data) {
      const u8 = toU8(data);
      if (u8) {
        const magic = new TextDecoder().decode(u8.subarray(0, Math.min(14, u8.length)));
        log?.(
          `[ws-handshake] tx ${u8.length}B magic=${JSON.stringify(magic)} hex=${hexPrefix(u8)}`,
        );
      } else {
        log?.(`[ws-handshake] tx (non-binary) typeof=${typeof data}`);
      }
      return protoSend.call(this, data);
    };
  }

  // Proxy construct → real native WebSocket (NOT class extends — that breaks Chromium).
  const WartWebSocket = new Proxy(Orig, {
    construct(Target, args) {
      let url = args[0];
      let protocols = args[1];
      let finalUrl = url;

      if (typeof url === 'string' && localBridge.test(url)) {
        finalUrl = window.__wartWsRewriteTarget || target;
        log?.(`[ws-rewrite] ${url} → ${finalUrl}`);
        console.info(`[ws-rewrite] ${url} → ${finalUrl}`);
      }

      const bridge = isP2pBridge(finalUrl);
      const protos = normalizeProtocols(protocols, bridge);

      const constructArgs = protos === undefined || protos === null
        ? [finalUrl]
        : [finalUrl, protos];

      // Real WebSocket instance (correct internal brand / readyState machine).
      const ws = Reflect.construct(Target, constructArgs, Target);

      if (bridge) {
        log?.(`[ws-handshake] dial ${finalUrl} protocol=${JSON.stringify(protos ?? null)}`);
        installP2pWsGlue(ws, finalUrl);
      }

      return ws;
    },
  });

  window.WebSocket = WartWebSocket;
  window.__wartWsRewriteInstalled = true;
  window.__wartWsRewriteVersion = 4;
  log?.(
    '[ws-handshake] installed v4 (delay onopen; C++ wire GRUNT; no JS dual-handshake) — '
    + 'P2P /ws only',
  );
}

/**
 * Dynamically load the modularized Emscripten factory and start the node.
 * @returns {Promise<object>} runtime Module instance (await the ready promise)
 */
export async function startWasmNode(moduleConfig) {
  if (!isCrossOriginIsolated()) {
    throw new Error(
      'Page is not cross-origin isolated. SharedArrayBuffer (pthreads) is unavailable. '
      + 'Serve with Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.',
    );
  }
  if (!hasSharedArrayBuffer()) {
    throw new Error('SharedArrayBuffer is not available in this browser/context.');
  }

  const target = moduleConfig?.__wsPeers || DEFAULT_WS_PEERS;
  installLocalBridgeWsRewrite(target, moduleConfig?.print);

  const initModule = await loadEmscriptenFactory(NODE_GLUE_URL);
  // Factory returns a Promise that resolves to the live Module instance.
  const instance = await initModule(moduleConfig);
  return instance;
}
