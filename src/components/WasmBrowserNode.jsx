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
  /** True while killing workers and waiting for OPFS/socket settle. */
  const [stopping, setStopping] = useState(false);
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
    () => isolated && sab && !running && !starting && !stopping && !storageFatal && !clearingOpfs,
    [isolated, sab, running, starting, stopping, storageFatal, clearingOpfs],
  );

  /** Stop only while a node is (or was) running — not mid-start or mid-recover. */
  const canStop = useMemo(
    () => running && !starting && !stopping && !clearingOpfs,
    [running, starting, stopping, clearingOpfs],
  );

  /** Allow clear while broken; block only during a healthy run or mid-start. */
  const canClearOpfs = useMemo(
    () => opfsOk && !starting && !stopping && !clearingOpfs && (!running || storageFatal),
    [opfsOk, starting, stopping, clearingOpfs, running, storageFatal],
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
    if (starting || stopping || clearingOpfs) return;
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

  /**
   * Hard-stop this tab's WASM node: kill workers, reset live UI state.
   * Leaves OPFS (chain/peers DBs) intact so Start can resume without reload.
   */
  const stop = async () => {
    if (!running || starting || stopping || clearingOpfs) return;
    setStopping(true);
    setError(null);
    setStatus('Stopping…');
    appendLog('Stopping node — terminating workers (local chain data kept)…');
    try {
      terminateWasmWorkers(appendLog);
    } catch (err) {
      appendLog(`Stop warning: ${err?.message || err}`);
    }
    startedRef.current = false;
    setRunning(false);
    setProgress(null);
    setChain(null);
    setPeerCount(0);
    setPeers([]);
    setMempoolCount(0);
    setMempool([]);
    // OPFS exclusive handles + bridge sockets release slightly after worker death.
    await new Promise((r) => setTimeout(r, 600));
    setStatus('Stopped — click Start to run again');
    appendLog('Node stopped. OPFS unchanged. You can Start again (wait a few seconds if reconnect fails).');
    setStopping(false);
  };

  const start = async () => {
    if (startedRef.current || starting || stopping || storageFatal || storageFatalRef.current) return;
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
      appendLog('Booting public/node WASM (expect log: Warthog Node v0.9.6 / Adding websocket peer …)');
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

  const browserReady = isolated && sab && opfsOk;
  const badgeClass = storageFatal
    ? 'is-bad'
    : nodeHealthy
      ? 'is-ok'
      : browserReady
        ? 'is-ok'
        : 'is-warn';
  const badgeLabel = storageFatal
    ? 'Needs fix'
    : nodeHealthy
      ? 'Running'
      : browserReady
        ? 'Ready'
        : 'Setup needed';

  const friendlyStatus = (() => {
    if (storageFatal) {
      return 'Storage is locked. Close other tabs on this site, then use Recover below.';
    }
    if (stopping) return 'Stopping your node…';
    if (nodeHealthy) {
      if (chain?.height != null) {
        return `Your node is live on the network · block #${chain.height}`;
      }
      return 'Your node is running — connecting to the network…';
    }
    if (starting) return 'Starting your node — this can take a moment…';
    if (!isolated || !sab) {
      return 'This page needs a special browser mode. Use Chrome/Edge via the normal site link, not a bare IP.';
    }
    if (!opfsOk) {
      return 'This browser cannot store the chain. Please use Chrome or Edge on HTTPS (or localhost).';
    }
    if (status?.startsWith('Stopped')) {
      return 'Node stopped. Local data is kept — press Start when you want to run again.';
    }
    if (bridgeHttp.state === 'ok') {
      return `Network is reachable${bridgeHttp.height != null ? ` (height #${bridgeHttp.height})` : ''}. Press Start to run a full node in this tab.`;
    }
    if (bridgeHttp.state === 'checking') return 'Checking network…';
    if (bridgeHttp.state === 'bad') {
      return 'Could not reach the public network probe — you can still try Start.';
    }
    return status || 'Ready when you are.';
  })();

  const displayPeerCount = peerCount || peers.length;
  const displayMempoolCount = mempoolCount || mempool.length;

  return (
    <div className="dash">
      <header className="dash__header">
        <div className="dash__brand">
          <img src="/img/main_logo.png" alt="" className="dash__logo" />
          <div>
            <h1>Warthog in your browser</h1>
            <p className="dash__subtitle">
              Run a full node in this tab — no install required
            </p>
          </div>
        </div>
        <div className={`dash__badge ${badgeClass}`}>{badgeLabel}</div>
      </header>

      <section className="panel hero">
        <p className="hero__status">{friendlyStatus}</p>
        <div className="hero__actions">
          <button
            type="button"
            className={`btn btn--start${nodeHealthy ? ' is-running' : ''}`}
            onClick={start}
            disabled={!canStart}
          >
            {starting
              ? 'Starting…'
              : stopping
                ? 'Please wait…'
                : storageFatal
                  ? 'Fix storage first'
                  : nodeHealthy
                    ? 'Node is running'
                    : 'Start node'}
          </button>
          {(running || stopping) && (
            <button
              type="button"
              className="btn btn--stop"
              onClick={stop}
              disabled={!canStop}
              title="Stop the node in this tab (keeps local chain data)"
            >
              {stopping ? 'Stopping…' : 'Stop node'}
            </button>
          )}
        </div>
        {progress && (
          <progress
            className="hero__progress"
            value={progress.value}
            max={progress.max}
          />
        )}
        {!nodeHealthy && !storageFatal && !stopping && browserReady && (
          <p className="hero__hint">
            Keep this tab open. Only one tab per site can run the node at a time.
          </p>
        )}
        {error && <div className="dash__error" style={{ marginTop: '0.85rem', textAlign: 'left' }}>{error}</div>}
        {storageFatal && (
          <div className="dash__error" style={{ marginTop: '0.85rem', textAlign: 'left' }}>
            <strong>Storage locked</strong> — another tab may still be using this site&apos;s data.
            <ol className="dash__checklist">
              <li>Close every other tab or window on this same site.</li>
              <li>
                Open <strong>Advanced</strong> below and click <strong>Recover</strong> once.
              </li>
              <li>If that fails: clear site data in the browser, refresh, then Start once.</li>
            </ol>
            <div className="controls__actions" style={{ marginTop: '0.65rem' }}>
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={recoverOpfs}
                disabled={starting || clearingOpfs || !opfsOk}
              >
                {clearingOpfs ? 'Recovering…' : 'Recover & reload'}
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="snapshot" aria-label="Network snapshot">
        <div className="snapshot__card">
          <span className="snapshot__label">Block height</span>
          <span className="snapshot__value">
            {chain?.height != null ? `#${chain.height}` : '—'}
          </span>
          {chain?.difficulty != null && (
            <span className="snapshot__sub">{formatHashrate(chain.difficulty)}</span>
          )}
        </div>
        <div className="snapshot__card">
          <span className="snapshot__label">Connections</span>
          <span className="snapshot__value">{nodeHealthy || peers.length ? displayPeerCount : '—'}</span>
          <span className="snapshot__sub">
            {nodeHealthy ? (displayPeerCount === 1 ? 'peer' : 'peers') : 'after start'}
          </span>
        </div>
        <div className="snapshot__card">
          <span className="snapshot__label">Pending txs</span>
          <span className="snapshot__value">{nodeHealthy || mempool.length ? displayMempoolCount : '—'}</span>
          <span className="snapshot__sub">mempool</span>
        </div>
      </div>

      {(!isolated || !sab) && (
        <div className="dash__error">
          This site must load with secure isolation headers so the node can run in-browser.
          Open it via the normal HTTPS link (or <code>npm run dev</code> locally on localhost), not a raw IP address.
        </div>
      )}
      {isolated && sab && !opfsOk && (
        <div className="dash__error">
          Storage is unavailable. Use Chrome or Edge on HTTPS (or <code>http://127.0.0.1</code>).
        </div>
      )}

      <div className="lists-row">
        <section className="panel">
          <div className="panel__head">
            <h2>Connections</h2>
            <span className="panel__count">{displayPeerCount}</span>
          </div>
          <div className="list">
            {peers.length === 0 ? (
              <p className="list__empty">
                {nodeHealthy ? 'Waiting for peers…' : 'Start the node to connect'}
              </p>
            ) : (
              peers.map((p) => {
                const inbound = p.inbound === true || p.inbound === 'true' || p.inbound === 1 || p.inbound === '1';
                const addr = String(p.address ?? '—');
                return (
                  <div className="list-item" key={String(p.id)}>
                    <div className="list-item__row">
                      <span className="list-item__main">
                        {String(p.type || 'peer')}
                      </span>
                      <span className={`tag ${inbound ? 'tag--in' : 'tag--out'}`}>
                        {inbound ? 'in' : 'out'}
                      </span>
                    </div>
                    <div className="list-item__addr" title={addr}>
                      {shortAddr(addr, 10)}
                    </div>
                    {p.since != null && p.since !== '' && (
                      <div className="list-item__amounts">
                        <span className="muted">since {String(p.since)}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Pending transactions</h2>
            <span className="panel__count">{displayMempoolCount}</span>
          </div>
          <div className="list">
            {mempool.length === 0 ? (
              <p className="list__empty">
                {nodeHealthy ? 'No pending transactions' : 'Empty until the node is running'}
              </p>
            ) : (
              mempool.map((tx) => (
                <div className="list-item" key={String(tx.id ?? tx.txHash)}>
                  <div className="list-item__row">
                    <span className="list-item__main" title={String(tx.fromAddress || '')}>
                      {shortAddr(tx.fromAddress, 5)}
                      {' → '}
                      {shortAddr(tx.toAddress, 5)}
                    </span>
                  </div>
                  <div className="list-item__amounts">
                    <span>
                      <span className="muted">amount </span>
                      {tx.amount ?? '—'}
                    </span>
                    <span>
                      <span className="muted">fee </span>
                      {tx.fee ?? '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <details className="advanced">
        <summary>
          Advanced
          <span className="advanced__hint">Network settings, diagnostics &amp; logs</span>
        </summary>
        <div className="advanced__body">
          <div className="advanced__section">
            <h3>Browser readiness</h3>
            <div className="checks-grid">
              <Stat label="Isolation" value={isolated ? 'OK' : 'Missing'} />
              <Stat label="Shared memory" value={sab ? 'OK' : 'Missing'} />
              <Stat label="Storage" value={opfsOk ? 'OK' : 'Missing'} />
              <Stat label="Mode" value="Full node" />
            </div>
          </div>

          <div className="advanced__section">
            <h3>Public network</h3>
            <p className="muted small" style={{ margin: '0 0 0.5rem' }}>
              Connected via <strong>{OFFICIAL1.name}</strong>
              {bridgeHttp.state === 'ok' && bridgeHttp.height != null
                ? ` · network height #${bridgeHttp.height}`
                : ''}
            </p>
            <div className="status-row">
              <div className="status-card">
                <span className="label">Network HTTP</span>
                <span>
                  {bridgeHttp.state === 'ok' && (
                    <>OK{bridgeHttp.height != null ? ` · #${bridgeHttp.height}` : ''}</>
                  )}
                  {bridgeHttp.state === 'bad' && `Down · ${bridgeHttp.error}`}
                  {bridgeHttp.state === 'checking' && 'Checking…'}
                  {bridgeHttp.state === 'idle' && '—'}
                </span>
              </div>
              <div className="status-card">
                <span className="label">P2P bridge</span>
                <span>
                  {bridgeWs.state === 'ok' && `Open · ${bridgeWs.openedMs ?? '?'}ms`}
                  {bridgeWs.state === 'bad' && `Not ready · ${bridgeWs.detail}`}
                  {bridgeWs.state === 'skipped' && 'Not probed (safer)'}
                  {bridgeWs.state === 'checking' && 'Checking…'}
                  {bridgeWs.state === 'idle' && '—'}
                </span>
              </div>
              <div className="status-card">
                <span className="label">RPC stream</span>
                <span>
                  {bridgeStream.state === 'ok' && `Open · ${bridgeStream.openedMs ?? '?'}ms`}
                  {bridgeStream.state === 'bad' && `Fail · ${bridgeStream.detail}`}
                  {bridgeStream.state === 'skipped' && 'Optional · not used'}
                  {bridgeStream.state === 'checking' && 'Checking…'}
                  {bridgeStream.state === 'idle' && '—'}
                </span>
              </div>
            </div>
            {bridgeHttp.state === 'bad' && (
              <div className="dash__error" style={{ marginTop: '0.5rem' }}>
                Network probe failed ({bridgeHttp.error}). Starting the node may still work.
              </div>
            )}
            {bridgeWs.state === 'bad' && (
              <div className="dash__error" style={{ marginTop: '0.5rem' }}>
                Bridge probe failed for <code className="mono">{wsPeers || OFFICIAL1.wsBridge}</code>
                {bridgeWs.detail ? ` (${bridgeWs.detail})` : ''}.
                You can still try Start if the browser is Ready.
              </div>
            )}
          </div>

          {chain && (
            <div className="advanced__section">
              <h3>Chain detail</h3>
              <div className="chain-grid">
                <Stat label="Height" value={String(chain.height)} />
                <Stat label="Difficulty" value={formatHashrate(chain.difficulty)} />
                <Stat label="Worksum" value={formatHashrate(chain.worksum)} />
              </div>
            </div>
          )}

          <div className="advanced__section">
            <h3>Peer endpoint</h3>
            <div className="controls__custom">
              <input
                type="text"
                value={peersInput}
                onChange={(e) => setPeersInput(e.target.value)}
                disabled={running || starting}
                placeholder={OFFICIAL1.wsBridge}
                aria-label="WebSocket peer URL"
              />
              <div className="controls__actions">
                <button type="button" className="btn" onClick={applyPeers} disabled={running || starting}>
                  Save
                </button>
                <button type="button" className="btn btn--ghost" onClick={useOfficial1} disabled={running || starting}>
                  Official1
                </button>
                {isLocalDevHost() && (
                  <button type="button" className="btn btn--ghost" onClick={useLocalProxy} disabled={running || starting}>
                    Local proxy
                  </button>
                )}
              </div>
            </div>
            <div className="controls__meta" style={{ marginTop: '0.5rem' }}>
              <span className="mono muted small" title={wsPeers}>WS_PEERS={wsPeers}</span>
            </div>
          </div>

          <div className="advanced__section">
            <h3>Tools</h3>
            <div className="controls__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => runBridgeProbes(wsPeers, { probeP2pWs: false, probeStream: false })}
                disabled={running || starting}
              >
                Re-check network
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={testRawWs}
                disabled={running || starting}
                title="Open WebSocket only — burns public /ws slot if pointed at Official1"
              >
                Test connection
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => runBridgeProbes(wsPeers, { probeP2pWs: true })}
                disabled={running || starting}
                title="Opens P2P /ws — burns Official1 per-IP slot for ~30s"
              >
                Probe P2P (caution)
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={clearOpfs}
                disabled={!canClearOpfs}
                title="Delete local chain databases for this site"
              >
                {clearingOpfs ? 'Clearing…' : 'Clear local data'}
              </button>
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={recoverOpfs}
                disabled={starting || clearingOpfs || !opfsOk}
                title="Clear storage and reload the page"
              >
                Recover &amp; reload
              </button>
            </div>
          </div>

          <details className="dash__help">
            <summary>For operators (VPS / nginx)</summary>
            <ol className="dash__checklist">
              <li>
                Browser needs isolation headers (COOP/COEP), WASM under{' '}
                <code className="mono">/node/</code>, and{' '}
                <code className="mono">WS_PEERS=wss://…/ws</code>.
              </li>
              <li>
                Node flags:{' '}
                <code className="mono">{OFFICIAL1.flags?.join(' ') || '—'}</code>
              </li>
              <li>
                Nginx: proxy <code className="mono">/ws</code> to localhost with Upgrade + X-Forwarded-For.
              </li>
            </ol>
          </details>
        </div>
      </details>

      <section className="panel">
        <div className="panel__head">
          <h2>Activity log</h2>
          <span className="panel__count muted small" title={status}>
            {status}
          </span>
        </div>
        <textarea
          ref={consoleRef}
          className="console"
          readOnly
          value={logLines.join('\n')}
          spellCheck={false}
          aria-label="Node console log"
        />
      </section>

      <footer className="dash__footer">
        <p>
          A full Warthog node runs inside this browser tab via WebAssembly.
          Leave the tab open while it syncs and stays connected.
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
