import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_WS_PEERS,
  clearOpfsStorage,
  createModuleConfig,
  hasOpfs,
  hasSharedArrayBuffer,
  isCrossOriginIsolated,
  isOpfsReadonlyError,
  listOpfsEntries,
  markOpfsNeedsReset,
  opfsNeedsReset,
  prepareOpfsForStart,
  recoverOpfsStorage,
  resolveWsPeers,
  startWasmNode,
  terminateWasmWorkers,
} from '../lib/wasmNode.js';
import {
  OFFICIAL1,
  localDevWsBridgeUrl,
  isLocalDevHost,
  probeBridgeHttp,
  probeBridgeWs,
  resolveDefaultWsPeers,
} from '../lib/bridge.js';
import { formatHashrate, shortAddr } from '../lib/presets.js';
import './NodeDashboard.css';

const MAX_LOG = 400;
const MAX_ROWS = 50;

export default function WasmBrowserNode() {
  const [isolated, setIsolated] = useState(false);
  const [sab, setSab] = useState(false);
  const [opfsOk, setOpfsOk] = useState(false);
  const [wsPeers, setWsPeers] = useState(DEFAULT_WS_PEERS);
  const [peersInput, setPeersInput] = useState(DEFAULT_WS_PEERS);

  const [status, setStatus] = useState('Ready — click Start full node');
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  /** True when SQLite/OPFS failed mid-run — node is not healthy even if workers still exist. */
  const [storageFatal, setStorageFatal] = useState(false);
  const [clearingOpfs, setClearingOpfs] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const [bridgeHttp, setBridgeHttp] = useState({ state: 'idle' });
  const [bridgeWs, setBridgeWs] = useState({ state: 'idle' });
  const [bridgeStream, setBridgeStream] = useState({ state: 'idle' });

  const [chain, setChain] = useState(null);
  const [peerCount, setPeerCount] = useState(0);
  const [peers, setPeers] = useState([]);
  const [mempoolCount, setMempoolCount] = useState(0);
  const [mempool, setMempool] = useState([]);
  const [logLines, setLogLines] = useState([]);

  const startedRef = useRef(false);
  /** Sync flag for OPFS fatal during boot (state updates are async). */
  const storageFatalRef = useRef(false);
  const consoleRef = useRef(null);

  const appendLog = useCallback((text) => {
    setLogLines((prev) => {
      const next = [...prev, `${new Date().toLocaleTimeString()}  ${text}`];
      return next.length > MAX_LOG ? next.slice(-MAX_LOG) : next;
    });
  }, []);

  const runBridgeProbes = useCallback(async (wsUrl, { probeP2pWs = false, probeStream = false } = {}) => {
    setBridgeHttp({ state: 'checking' });
    // Defaults on page load: HTTP only.
    // - /ws  = P2P bridge (rate-limit/ban risk) — never auto
    // - /stream = RPC dashboard feed — not used by full WASM node
    if (probeP2pWs) {
      setBridgeWs({ state: 'checking' });
    } else {
      setBridgeWs({
        state: 'skipped',
        detail: 'not auto-probed (protects handshake slot)',
      });
    }
    if (probeStream) {
      setBridgeStream({ state: 'checking' });
    } else {
      setBridgeStream({
        state: 'skipped',
        detail: 'optional RPC feed — not used by full WASM node',
      });
    }

    appendLog(`Probing Official1 HTTP ${OFFICIAL1.httpBase}/chain/head …`);
    const http = await probeBridgeHttp(OFFICIAL1.httpBase);
    if (http.ok) {
      setBridgeHttp({
        state: 'ok',
        height: http.height ?? http.data?.height,
        synced: http.synced ?? http.data?.synced,
      });
      appendLog(
        `Official1 HTTP OK — height ${http.height ?? http.data?.height ?? '?'} `
        + `synced=${http.synced ?? http.data?.synced ?? '?'}`,
      );
    } else {
      setBridgeHttp({ state: 'bad', error: http.error });
      appendLog(`Official1 HTTP FAIL — ${http.error}`);
    }

    if (probeP2pWs) {
      appendLog(
        `⚠ Probing P2P ${wsUrl} — this burns Official1’s per-IP connect slot (~30s). `
        + 'Wait ≥30s before Start full WASM node.',
      );
      const ws = await probeBridgeWs(wsUrl, { protocol: 'binary', timeoutMs: 10000 });
      if (ws.ok) {
        setBridgeWs({ state: 'ok', detail: ws.detail, openedMs: ws.openedMs });
        appendLog(`Official1 /ws OPEN (${ws.openedMs ?? '?'}ms) — wait 30s before Start`);
      } else {
        setBridgeWs({ state: 'bad', detail: ws.detail });
        appendLog(`Official1 /ws FAIL — ${ws.detail}`);
      }
    } else {
      appendLog(
        `P2P /ws (${wsUrl}) not auto-probed — protects Official1 handshake slot. `
        + 'Start full WASM node does the real GRUNT handshake.',
      );
    }

    if (probeStream) {
      // Optional: RPC event stream (dashboards). Full WASM node does not use this.
      appendLog(`Probing RPC stream ${OFFICIAL1.wsStream} (optional) …`);
      const stream = await probeBridgeWs(OFFICIAL1.wsStream, { protocol: null, timeoutMs: 10000 });
      if (stream.ok) {
        setBridgeStream({ state: 'ok', detail: stream.detail, openedMs: stream.openedMs });
        appendLog(`Official1 /stream OPEN (${stream.openedMs ?? '?'}ms)`);
      } else {
        setBridgeStream({ state: 'bad', detail: stream.detail });
        appendLog(`Official1 /stream FAIL (optional) — ${stream.detail}`);
      }
    } else {
      appendLog(
        `/stream is optional (RPC dashboards only). Full WASM node uses /ws via Start — not needed on page load.`,
      );
    }

    appendLog(
      'If Isolation OK + HTTP OK → click Start full WASM node (real GRUNT on /ws). '
      + 'VPS: journalctl -u warthog-api.service -f | grep -iE \'websocket|webrtc\'',
    );
  }, [appendLog]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsolated(isCrossOriginIsolated());
      setSab(hasSharedArrayBuffer());
      setOpfsOk(hasOpfs());
      const peers = resolveWsPeers();
      setWsPeers(peers);
      setPeersInput(peers);

      // Wait for head bootstrap wipe (?resetDb / session flag) before probes / Start.
      try {
        const boot = await window.__wartOpfsBootstrap;
        if (cancelled) return;
        if (boot && boot.skipped !== true) {
          if (boot.ok) {
            storageFatalRef.current = false;
            setStorageFatal(false);
            appendLog(
              `OPFS bootstrap wipe OK — removed: ${boot.removed?.length ? boot.removed.join(', ') : '(empty)'}`,
            );
            setStatus('OPFS reset OK — click Start full WASM node once');
          } else if (boot.failed?.length || boot.error) {
            storageFatalRef.current = true;
            setStorageFatal(true);
            appendLog(
              `OPFS bootstrap wipe FAILED — ${boot.failed?.join('; ') || boot.error}. `
              + 'Close EVERY other tab/window on this host:port (including duplicates), then Recover again. '
              + 'Or: DevTools → Application → Storage → Clear site data.',
            );
            setStatus('OPFS still locked by another tab — close all tabs for this origin');
          }
          try {
            const clean = new URL(window.location.href);
            if (clean.searchParams.has('resetDb') || clean.searchParams.has('resetdb')) {
              clean.searchParams.delete('resetDb');
              clean.searchParams.delete('resetdb');
              window.history.replaceState({}, '', clean.toString());
            }
          } catch {
            // ignore
          }
        }
      } catch (e) {
        appendLog(`OPFS bootstrap error: ${e?.message || e}`);
      }

      if (cancelled) return;

      // Second-pass clear if bootstrap left residue or session still dirty
      if (opfsNeedsReset()) {
        appendLog('Session still marked dirty — second OPFS clear (workers already dead on fresh load)…');
        const r = await clearOpfsStorage({
          terminateWorkers: false,
          retries: 5,
          log: appendLog,
        });
        if (cancelled) return;
        if (r.ok) {
          storageFatalRef.current = false;
          setStorageFatal(false);
          appendLog(`Second clear OK — ${r.removed?.join(', ') || '(empty)'}`);
          setStatus('OPFS clear OK — Start full WASM node once');
        } else {
          storageFatalRef.current = true;
          setStorageFatal(true);
          appendLog(`Second clear FAILED: ${r.error}`);
        }
      }

      if (!cancelled) {
        runBridgeProbes(peers);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runBridgeProbes, appendLog]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logLines]);

  /** Healthy run only — storage fatal unblocks Clear OPFS / Recover even if workers linger. */
  const nodeHealthy = running && !storageFatal;

  const canStart = useMemo(
    () => isolated && sab && !running && !starting && !storageFatal && !clearingOpfs,
    [isolated, sab, running, starting, storageFatal, clearingOpfs],
  );

  /** Allow clear while broken; block only during a healthy run or mid-start. */
  const canClearOpfs = useMemo(
    () => opfsOk && !starting && !clearingOpfs && (!running || storageFatal),
    [opfsOk, starting, clearingOpfs, running, storageFatal],
  );

  const handleOpfsReadonly = useCallback((sourceText) => {
    markOpfsNeedsReset();
    storageFatalRef.current = true;
    setStorageFatal(true);
    setRunning(false);
    startedRef.current = false;
    // Drop pthread locks immediately so Clear/Recover can delete db files.
    try {
      terminateWasmWorkers(appendLog);
    } catch {
      // ignore
    }
    setError(
      'SQLite readonly / OPFS lock — close every other tab on this host:port, '
      + 'then click Recover (clear OPFS + reload). Do not spam Start.',
    );
    setStatus('OPFS / SQLite write failed — use Recover');
    appendLog(
      `[storage] readonly/OPFS lock${sourceText ? `: ${String(sourceText).slice(0, 120)}` : ''}`,
    );
  }, [appendLog]);

  const applyPeers = () => {
    const v = peersInput.trim() || DEFAULT_WS_PEERS;
    setWsPeers(v);
    try {
      localStorage.setItem('wsPeers', v);
    } catch {
      // ignore
    }
    appendLog(`Bridge peers set → ${v}`);
    runBridgeProbes(v);
  };

  const useOfficial1 = () => {
    setPeersInput(OFFICIAL1.wsBridge);
    setWsPeers(OFFICIAL1.wsBridge);
    try {
      localStorage.setItem('wsPeers', OFFICIAL1.wsBridge);
    } catch {
      // ignore
    }
    appendLog(`Reset to public Official1 → ${OFFICIAL1.wsBridge}`);
    runBridgeProbes(OFFICIAL1.wsBridge);
  };

  /** Local Vite proxy — browser only opens ws://this-host/ws-bridge (Node dials Official1). */
  const useLocalProxy = () => {
    const url = localDevWsBridgeUrl();
    setPeersInput(url);
    setWsPeers(url);
    try {
      localStorage.setItem('wsPeers', url);
    } catch {
      // ignore
    }
    appendLog(
      `Using local dev WS proxy → ${url} `
      + '(requires restarted `npm run dev` with /ws-bridge proxy). '
      + 'Do not Probe /ws on public URL before Start.',
    );
    runBridgeProbes(url, { probeP2pWs: false });
  };

  /** Raw open test (no GRUNT) — success = onopen. Uses current peers field. */
  const testRawWs = async () => {
    const url = (peersInput.trim() || wsPeers || resolveDefaultWsPeers()).split(';')[0].trim();
    appendLog(`Raw WSS open test → ${url} (success = onopen; close after open is OK for bare client)`);
    const result = await probeBridgeWs(url, { protocol: 'binary', timeoutMs: 12000 });
    if (result.ok) {
      appendLog(`Raw open OK in ${result.openedMs ?? '?'}ms — bridge reachable from this browser`);
      setBridgeWs({ state: 'ok', detail: result.detail, openedMs: result.openedMs });
    } else {
      appendLog(`Raw open FAIL — ${result.detail}`);
      setBridgeWs({ state: 'bad', detail: result.detail });
    }
  };

  const onChain = useCallback((event) => {
    if (!event) return;
    setChain({
      height: event.length ?? event.height ?? 0,
      difficulty: event.difficulty,
      worksum: event.worksum,
    });
  }, []);

  const onConnect = useCallback((event) => {
    if (!event) return;
    setPeerCount(event.total ?? 0);
    setPeers((prev) => {
      const row = {
        id: event.id,
        inbound: event.inbound,
        type: event.type,
        address: event.address,
        since: event.since,
      };
      const next = [row, ...prev.filter((p) => p.id !== event.id)];
      return next.slice(0, MAX_ROWS);
    });
  }, []);

  const onDisconnect = useCallback((event) => {
    if (!event) return;
    setPeerCount(event.total ?? 0);
    setPeers((prev) => prev.filter((p) => p.id !== event.id));
  }, []);

  const onMempoolAdd = useCallback((event) => {
    if (!event) return;
    setMempoolCount(event.total ?? 0);
    setMempool((prev) => {
      const row = {
        id: event.id,
        fromAddress: event.fromAddress,
        toAddress: event.toAddress,
        amount: event.amount,
        fee: event.fee,
        txHash: event.txHash,
      };
      const next = [row, ...prev.filter((p) => p.id !== event.id)];
      return next.slice(0, MAX_ROWS);
    });
  }, []);

  const onMempoolErase = useCallback((event) => {
    if (!event) return;
    setMempoolCount(event.total ?? 0);
    setMempool((prev) => prev.filter((p) => p.id !== event.id));
  }, []);

  const clearOpfs = async () => {
    if (!canClearOpfs) return;
    setClearingOpfs(true);
    setError(null);
    appendLog('Terminating WASM workers, then clearing OPFS…');
    try {
      terminateWasmWorkers(appendLog);
      const before = await listOpfsEntries();
      appendLog(`OPFS before: ${before.length ? before.join(', ') : '(empty)'}`);
      const result = await clearOpfsStorage({ terminateWorkers: true, log: appendLog });
      if (result.ok) {
        storageFatalRef.current = false;
        setStorageFatal(false);
        startedRef.current = false;
        setRunning(false);
        appendLog(`OPFS cleared — removed: ${result.removed?.join(', ') || '(already empty)'}`);
        setStatus('OPFS cleared — click Start full WASM node (one tab only)');
      } else {
        setError(result.error || 'OPFS clear failed');
        appendLog(`OPFS clear FAILED: ${result.error}`);
        setStatus('OPFS clear failed — use Recover, or close all tabs for this origin');
      }
    } catch (err) {
      setError(err.message || String(err));
      appendLog(`OPFS clear ERROR: ${err.message || err}`);
    } finally {
      setClearingOpfs(false);
    }
  };

  /**
   * Hard recovery: kill pthreads → wipe OPFS → hard reload.
   * Next document runs bootstrap wipe before React/WASM can re-lock files.
   */
  const recoverOpfs = async () => {
    if (starting || clearingOpfs) return;
    setClearingOpfs(true);
    setError(null);
    startedRef.current = false;
    setRunning(false);
    markOpfsNeedsReset();
    appendLog('Recover: kill workers → clear OPFS → reload (?resetDb=1)…');
    try {
      // reload:true always navigates away; may not return
      await recoverOpfsStorage({ reload: true, log: appendLog });
    } catch (err) {
      appendLog(`Recover error: ${err.message || err}`);
      // Force navigation even if helper threw
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('resetDb', '1');
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    }
  };

  const start = async () => {
    if (startedRef.current || starting || storageFatal || storageFatalRef.current) return;
    setStarting(true);
    setError(null);
    storageFatalRef.current = false;
    setStorageFatal(false);
    setStatus('Loading WASM full node…');
    appendLog('Starting Warthog WASM full node…');
    appendLog(
      `crossOriginIsolated=${isCrossOriginIsolated()} SharedArrayBuffer=${hasSharedArrayBuffer()} OPFS=${hasOpfs()}`,
    );
    if (opfsNeedsReset()) {
      appendLog('Prior OPFS failure flagged — clearing storage before boot…');
    }

    try {
      if (!hasOpfs()) {
        throw new Error(
          'OPFS is not available. Use Chrome/Edge (or Chromium) on http://127.0.0.1 or https. '
          + 'The full node stores chain.db3 under /opfs via createSyncAccessHandle.',
        );
      }

      const prep = await prepareOpfsForStart({ forceClear: opfsNeedsReset() });
      if (!prep.ok) {
        throw new Error(prep.error || 'OPFS prepare failed');
      }
      if (prep.cleared) {
        appendLog(`OPFS pre-cleared: ${prep.removed?.join(', ') || '(empty)'}`);
      }
      appendLog(
        `OPFS entries: ${prep.entries?.length ? prep.entries.join(', ') : '(empty — will create DBs)'}`,
      );

      appendLog(`Using WS_PEERS=${wsPeers}`);
      appendLog(`Official1 bridge flags expected: ${OFFICIAL1.flags?.join(' ')}`);
      appendLog('Booting public/node WASM (expect log: Warthog Node v0.7.x / Adding websocket peer …)');
      appendLog(
        'Handshake v4: settle ~250ms after open, then C++ sends WARTHOG GRUNT? on the wire '
        + '(same as CLI tester). Official1: 1 connect/IP (~30s) — do not probe /ws first.',
      );
      appendLog(
        'Storage: chain/peers use OPFS (/opfs/*.db3). Only one tab per origin. '
        + 'If readonly database → Recover (clear + reload), then Start once.',
      );
      // Brief settle so any prior sockets are fully closed.
      await new Promise((r) => setTimeout(r, 400));
      const moduleConfig = createModuleConfig({
        wsPeers,
        print: (text) => {
          appendLog(text);
          // WASM throws inside the worker — surface recovery when SQLite fails
          if (isOpfsReadonlyError(text)) {
            handleOpfsReadonly(text);
          }
        },
        setStatus,
        onChain,
        onConnect,
        onDisconnect,
        onMempoolAdd,
        onMempoolErase,
        onProgress: setProgress,
      });

      const instance = await startWasmNode(moduleConfig);
      // Live Module instance only — never assign the constructor config.
      window.wartNode = instance;
      window.Module = instance;
      // If SQLite already failed during init, do not paint healthy "running".
      // (print → handleOpfsReadonly may have fired; state is async — use ref.)
      if (storageFatalRef.current) {
        appendLog('Runtime returned but storage is fatal — use Recover, do not trust peer state');
        setStatus('OPFS / SQLite write failed — use Recover');
        setRunning(false);
        startedRef.current = false;
      } else {
        startedRef.current = true;
        setRunning(true);
        setStatus('Full node runtime started — watch peers / chain / console for GRUNT');
        appendLog('Emscripten runtime ready — full node is running in this tab');
        appendLog('Expect: [ws-handshake] … GRUNT complete · Adding websocket peer …');
        appendLog('VPS: journalctl -u warthog-api.service -f | grep -iE \'websocket|webrtc\'');
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || String(err);
      if (isOpfsReadonlyError(err)) {
        handleOpfsReadonly(msg);
      } else {
        setError(msg);
        setStatus('Failed to start');
      }
      appendLog(`ERROR: ${msg}`);
      startedRef.current = false;
      setRunning(false);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="dash">
      <header className="dash__header">
        <div className="dash__brand">
          <img src="/img/main_logo.png" alt="" className="dash__logo" />
          <div>
            <h1>Warthog Browser Full Node</h1>
            <p className="dash__subtitle">
              WASM · pthreads · in-tab full node (not a remote RPC client)
            </p>
          </div>
        </div>
        <div className={`dash__badge ${storageFatal ? 'is-bad' : nodeHealthy ? 'is-ok' : isolated && sab ? 'is-ok' : 'is-bad'}`}>
          {storageFatal
            ? 'OPFS locked'
            : nodeHealthy
              ? 'Node running'
              : isolated && sab
                ? 'Isolation OK'
                : 'Need COOP/COEP'}
        </div>
      </header>

      <section className="panel">
        <h2>Runtime checks</h2>
        <div className="chain-grid">
          <Stat label="crossOriginIsolated" value={isolated ? 'true' : 'false'} />
          <Stat label="SharedArrayBuffer" value={sab ? 'available' : 'missing'} />
          <Stat label="OPFS" value={opfsOk ? 'available' : 'missing'} />
          <Stat label="Mode" value="Full WASM node" />
        </div>
        {(!isolated || !sab) && (
          <div className="dash__error" style={{ marginTop: '0.75rem' }}>
            This page must be served with{' '}
            <code>Cross-Origin-Opener-Policy: same-origin</code> and{' '}
            <code>Cross-Origin-Embedder-Policy: require-corp</code> so pthreads can use
            SharedArrayBuffer. Use <code>npm run dev</code> (headers enabled) or deploy via
            Netlify (<code>netlify.toml</code>). Open with <code>localhost</code>, not a bare IP,
            when testing locally.
          </div>
        )}
        {isolated && sab && !opfsOk && (
          <div className="dash__error" style={{ marginTop: '0.75rem' }}>
            OPFS is missing — the node cannot write <code>/opfs/chain.db3</code>. Use a Chromium
            browser on a secure origin (<code>http://127.0.0.1</code> or HTTPS).
          </div>
        )}
      </section>

      <section className="panel panel--controls">
        <h2 style={{ margin: 0 }}>Official1 bridge (upgraded)</h2>
        <p className="muted small" style={{ margin: 0 }}>
          <strong>{OFFICIAL1.name}</strong> (<code className="mono">{OFFICIAL1.host}</code>) —
          full node + <code>/ws</code> P2P bridge
          {OFFICIAL1.webrtc ? ' + WebRTC' : ''}.
          Default <code className="mono">WS_PEERS={OFFICIAL1.wsBridge}</code>
          {' '}· override <code className="mono">?peers=wss://…</code>
          {' '}(multiple peers: <code className="mono">;</code>-separated).
        </p>
        <div className="status-row" style={{ marginBottom: 0 }}>
          <div className="status-card">
            <span className="label">HTTP /chain/head</span>
            <span>
              {bridgeHttp.state === 'ok' && (
                <>OK · #{bridgeHttp.height ?? '—'}{bridgeHttp.synced != null ? ` · synced=${String(bridgeHttp.synced)}` : ''}</>
              )}
              {bridgeHttp.state === 'bad' && `Down · ${bridgeHttp.error}`}
              {bridgeHttp.state === 'checking' && 'Checking…'}
              {bridgeHttp.state === 'idle' && '—'}
            </span>
          </div>
          <div className="status-card">
            <span className="label">/ws P2P bridge</span>
            <span>
              {bridgeWs.state === 'ok' && `OPEN · ${bridgeWs.openedMs ?? '?'}ms`}
              {bridgeWs.state === 'bad' && `Not ready · ${bridgeWs.detail}`}
              {bridgeWs.state === 'skipped' && 'Skip probe · Start uses real GRUNT'}
              {bridgeWs.state === 'checking' && 'Checking…'}
              {bridgeWs.state === 'idle' && '—'}
            </span>
          </div>
          <div className="status-card">
            <span className="label">/stream (optional RPC)</span>
            <span>
              {bridgeStream.state === 'ok' && `OPEN · ${bridgeStream.openedMs ?? '?'}ms`}
              {bridgeStream.state === 'bad' && `Fail · ${bridgeStream.detail}`}
              {bridgeStream.state === 'skipped' && 'Skipped · not used by WASM full node'}
              {bridgeStream.state === 'checking' && 'Checking…'}
              {bridgeStream.state === 'idle' && '—'}
            </span>
          </div>
        </div>
        {(bridgeWs.state === 'skipped' || bridgeWs.state === 'ok') && bridgeHttp.state === 'ok' && (
          <div className="dash__ok">
            Official1 HTTP OK
            {bridgeHttp.height != null ? ` · height #${bridgeHttp.height}` : ''}.
            {bridgeWs.state === 'skipped'
              ? ' P2P /ws is not auto-probed (Official1 allows ~1 connect per IP; probing would steal the WASM handshake slot).'
              : ` /ws probe OPEN (${bridgeWs.openedMs ?? '?'}ms) — wait ≥30s before Start if you just probed.`}
            {isolated && sab
              ? ' Isolation OK → click Start full WASM node.'
              : ' Fix COOP/COEP (Isolation) before starting WASM.'}
            {isLocalDevHost() && (
              <>
                {' '}On localhost prefer <strong>Use local /ws-bridge</strong> so the browser
                dials same-origin and Vite proxies to Official1 (restart <code className="mono">npm run dev</code> once).
              </>
            )}
            {' '}Terminal GRUNT:{' '}
            <code className="mono">npm run test:handshake</code>
            {' '}· VPS:{' '}
            <code className="mono">journalctl -u warthog-api.service -f | grep -iE &apos;websocket|webrtc&apos;</code>
          </div>
        )}
        {bridgeWs.state === 'bad' && (
          <div className="dash__error">
            Probe could not open <code>{wsPeers || OFFICIAL1.wsBridge}</code>
            {bridgeWs.detail ? ` (${bridgeWs.detail})` : ''}.
            {' '}You can still click <strong>Start full WASM node</strong> if Isolation is OK.
            {' '}If Start also fails:
            <ul className="dash__checklist">
              <li>
                Wait <strong>20 minutes</strong> if a prior failed handshake banned your IP, or unban on VPS.
              </li>
              <li>
                <strong>Node</strong>:{' '}
                <code className="mono">--ws-port=10001 --ws-bind-localhost --ws-x-forwarded-for --enable-webrtc</code>
              </li>
              <li>
                <strong>Nginx</strong> <code className="mono">location /ws</code> →{' '}
                <code className="mono">http://127.0.0.1:10001/</code> (trailing slash) with Upgrade +{' '}
                <code className="mono">X-Forwarded-For</code>. No ACAO on the 101.
              </li>
              <li>
                Laptop: <code className="mono">bash docs/vps-handoff/verify-bridge.sh</code>
                {' '}then <code className="mono">node scripts/test-grunt-handshake.mjs</code>
              </li>
            </ul>
          </div>
        )}
        {bridgeHttp.state === 'bad' && (
          <div className="dash__error" style={{ opacity: 0.9 }}>
            HTTP probe failed ({bridgeHttp.error}). WASM may still reach <code>/ws</code>.
            HTTP checks use <code>/api/proxy</code> (required under COEP).
          </div>
        )}
        <details className="dash__help">
          <summary>What does WASM need? (app vs nginx vs node)</summary>
          <ol className="dash__checklist">
            <li>
              <strong>This project (browser)</strong> — COOP/COEP isolation, WASM triad under{' '}
              <code className="mono">/node/</code>, <code className="mono">WS_PEERS=wss://…/ws</code>. You already have Isolation OK.
            </li>
            <li>
              <strong>Node flags (VPS)</strong> — enable the P2P websocket server and honor proxy IPs:{' '}
              <code className="mono">{OFFICIAL1.flags?.join(' ')}</code>
            </li>
            <li>
              <strong>Nginx (VPS)</strong> — terminate TLS and proxy browser upgrades to localhost:10001.
              Repo sketch: <code className="mono">nginx-official1-bridge.conf</code>.
            </li>
          </ol>
          <p className="muted small" style={{ marginBottom: 0 }}>
            <code>/stream</code> is only for RPC dashboards (uWebSockets). The full WASM node only needs{' '}
            <code>/ws</code>. Bare clients often close with 1006 after open — that is normal; success is onopen.
          </p>
        </details>
        <div className="controls__custom">
          <input
            type="text"
            value={peersInput}
            onChange={(e) => setPeersInput(e.target.value)}
            disabled={running || starting}
            placeholder={OFFICIAL1.wsBridge}
          />
          <button type="button" className="btn" onClick={applyPeers} disabled={running || starting}>
            Save + re-probe
          </button>
          <button type="button" className="btn btn--ghost" onClick={useOfficial1} disabled={running || starting}>
            Use public Official1
          </button>
          {isLocalDevHost() && (
            <button type="button" className="btn btn--ghost" onClick={useLocalProxy} disabled={running || starting}>
              Use local /ws-bridge
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={testRawWs}
            disabled={running || starting}
            title="Open WebSocket only — burns public /ws slot if pointed at Official1"
          >
            Test raw open
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => runBridgeProbes(wsPeers, { probeP2pWs: false, probeStream: false })}
            disabled={running || starting}
          >
            Re-probe HTTP
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => runBridgeProbes(wsPeers, { probeP2pWs: true })}
            disabled={running || starting}
            title="Opens P2P /ws — burns Official1 per-IP slot for ~30s"
          >
            Probe /ws (burns slot)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={clearOpfs}
            disabled={!canClearOpfs}
            title="Delete /opfs chain+peers DBs for this origin (fixes readonly SQLite locks)"
          >
            {clearingOpfs ? 'Clearing OPFS…' : 'Clear OPFS'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={recoverOpfs}
            disabled={starting || clearingOpfs || !opfsOk}
            title="Clear OPFS if possible, then hard-reload so pthread locks die (best fix for readonly DB)"
          >
            Recover (clear + reload)
          </button>
        </div>
        {storageFatal && (
          <div className="dash__error" style={{ marginTop: '0.75rem' }}>
            <strong>Storage locked</strong> (OPFS exclusive handles on{' '}
            <code className="mono">chain.db3 / peers_v2.db3 / rxtx.db3</code>).
            <ol className="dash__checklist" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              <li>
                Close <strong>every</strong> other tab/window on this same host:port
                (duplicates count — only this one tab may stay open).
              </li>
              <li>
                Click <strong>Recover (clear + reload)</strong> once. Wait for console line{' '}
                <code className="mono">OPFS bootstrap wipe OK</code>.
              </li>
              <li>
                If wipe still fails: F12 → <strong>Application</strong> → Storage →{' '}
                <strong>Clear site data</strong> → hard-refresh → Start once.
              </li>
              <li>
                Do <strong>not</strong> click Probe /ws before Start (burns Official1 handshake slot).
              </li>
            </ol>
          </div>
        )}
        <div className="controls__meta">
          <span className="mono muted small">WS_PEERS={wsPeers}</span>
          <button
            type="button"
            className="btn btn--active"
            onClick={start}
            disabled={!canStart}
          >
            {starting
              ? 'Starting…'
              : storageFatal
                ? 'Fix OPFS first'
                : nodeHealthy
                  ? 'Node running'
                  : 'Start full WASM node'}
          </button>
        </div>
        {error && <div className="dash__error">{error}</div>}
        <div className="status-card" style={{ marginTop: '0.5rem' }}>
          <span className="label">Status</span>
          <span>{status}</span>
          {progress && (
            <progress value={progress.value} max={progress.max} style={{ width: '100%' }} />
          )}
        </div>
      </section>

      <section className="panel chain-panel">
        <h2>
          Chain
          {chain?.height != null && <span className="chain-height"> #{chain.height}</span>}
        </h2>
        {chain ? (
          <div className="chain-grid">
            <Stat label="Height" value={String(chain.height)} />
            <Stat label="Difficulty" value={formatHashrate(chain.difficulty)} />
            <Stat label="Worksum" value={formatHashrate(chain.worksum)} />
          </div>
        ) : (
          <p className="muted">Waiting for onChain events from the in-browser node…</p>
        )}
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>Peers ({peerCount || peers.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>In</th>
                  <th>Type</th>
                  <th>Address</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                {peers.length === 0 && (
                  <tr><td colSpan={4} className="muted">No peers yet</td></tr>
                )}
                {peers.map((p) => (
                  <tr key={String(p.id)}>
                    <td>{String(p.inbound ?? '—')}</td>
                    <td>{String(p.type ?? '—')}</td>
                    <td className="mono">{String(p.address ?? '—')}</td>
                    <td>{String(p.since ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>Mempool ({mempoolCount || mempool.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {mempool.length === 0 && (
                  <tr><td colSpan={4} className="muted">Empty</td></tr>
                )}
                {mempool.map((tx) => (
                  <tr key={String(tx.id ?? tx.txHash)}>
                    <td className="mono">{shortAddr(tx.fromAddress)}</td>
                    <td className="mono">{shortAddr(tx.toAddress)}</td>
                    <td>{tx.amount ?? '—'}</td>
                    <td>{tx.fee ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Node console</h2>
        <textarea
          ref={consoleRef}
          className="console"
          readOnly
          value={logLines.join('\n')}
          spellCheck={false}
        />
      </section>

      <footer className="dash__footer">
        <p>
          This runs the real <code>wart-node</code> binary compiled to WebAssembly in your browser
          (see <code>public/node/wart-node.&#123;js,wasm,worker.js&#125;</code>).
          It is a <strong>full node process in-tab</strong>, not a dashboard talking to someone else&apos;s
          HTTP API. Peers reach the network through the WS bridge above.
        </p>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}
