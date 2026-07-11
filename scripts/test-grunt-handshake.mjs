#!/usr/bin/env node
/**
 * Terminal test: full Warthog P2P GRUNT handshake against Official1 (or any /ws bridge).
 *
 * Usage:
 *   node scripts/test-grunt-handshake.mjs
 *   node scripts/test-grunt-handshake.mjs wss://warthognode.duckdns.org/ws
 *   node scripts/test-grunt-handshake.mjs --wait   # wait 35s first (rate-limit cool-down)
 *
 * Wire (core ConnectionBase, outbound client):
 *   → 24B  "WARTHOG GRUNT?" + u32be version + zeros + u16be port
 *   ← 22B  "WARTHOG GRUNT!" + u32be version + zeros
 *   → 1B   0x00 ack
 *
 * Official1 peer-server gotchas:
 *   - Successful /ws upgrade rate-limits your public IP ~30s
 *   - Failed/timeout handshake can ban IP ~20 minutes (ETIMEOUT/EHANDSHAKE)
 *   - Open→instant close often means still banned/rate-limited
 *   - VPS: journalctl -u warthog-api.service -f | grep -i websocket
 *
 * Also useful (upgrade only, no GRUNT):
 *   bash docs/vps-handoff/verify-bridge.sh
 */

import { createRequire } from 'node:module';
import dns from 'node:dns';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const WebSocket = require('ws');

// Prefer public DNS when local resolver is flaky (common on some LANs).
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

const DEFAULT_URL = 'wss://warthognode.duckdns.org/ws';
const args = process.argv.slice(2);
const waitFirst = args.includes('--wait');
const url = args.find((a) => !a.startsWith('--')) || DEFAULT_URL;

/** Same packing as core NodeVersion(major, minor, patch). */
function packVersion(major, minor, patch) {
  return ((major & 0xff) << 16) | ((minor & 0xff) << 8) | (patch & 0xff);
}

function unpackVersion(u32) {
  const v = u32 >>> 0;
  return `${(v >> 16) & 0xff}.${(v >> 8) & 0xff}.${v & 0xff}`;
}

/** WASM public/node is v0.9.6 (matches Official1 bridge) */
const CLIENT = { major: 0, minor: 9, patch: 6 };

function buildConnectGrunt(version = CLIENT, port = 0) {
  const buf = Buffer.alloc(24);
  Buffer.from('WARTHOG GRUNT?').copy(buf, 0);
  buf.writeUInt32BE(packVersion(version.major, version.minor, version.patch) >>> 0, 14);
  buf.writeUInt16BE(port & 0xffff, 22);
  return buf;
}

function log(...parts) {
  const t = new Date().toISOString().slice(11, 23);
  console.log(t, ...parts);
}

async function main() {
  console.log('=== Warthog GRUNT handshake test ===');
  console.log('URL:', url);
  console.log('Client version:', `${CLIENT.major}.${CLIENT.minor}.${CLIENT.patch}`);
  console.log(
    'Note: each attempt rate-limits your IP on Official1 (~30s).',
    'Failed handshakes may ban ~20min.',
  );

  if (waitFirst) {
    log('waiting 35s for rate-limit cool-down (--wait)…');
    await sleep(35_000);
  }

  const grunt = buildConnectGrunt();
  log('GRUNT hex:', grunt.toString('hex'));
  // Sanity: wrong packing was (9<<16)|(6<<8)|0 → 00090600 (9.6.0)
  // correct 0.9.6 → 00000906
  if (grunt.readUInt32BE(14) !== packVersion(0, 9, 6)) {
    console.error('BUG: version packing mismatch');
    process.exit(3);
  }

  let phase = 'connecting';
  const t0 = Date.now();

  const ws = new WebSocket(url, 'binary');
  ws.binaryType = 'arraybuffer';

  const failTimer = setTimeout(() => {
    log('TIMEOUT after 12s — phase=', phase);
    if (phase === 'connecting') {
      log('Never opened. Check nginx /ws → :10001 and DNS/TLS.');
    } else if (phase === 'wait-accept') {
      log(
        'Opened but no GRUNT!. Often: IP rate-limited/banned, or node not completing handshake.',
      );
      log('If open→close was instant earlier, wait 20min or unban on VPS.');
    }
    try {
      ws.close();
    } catch {
      // ignore
    }
    process.exit(2);
  }, 12_000);

  ws.on('open', () => {
    const ms = Date.now() - t0;
    log(`OPEN protocol=${JSON.stringify(ws.protocol)} after ${ms}ms`);
    // Match browser shim: brief delay so PeerServer authenticate → start_read
    phase = 'wait-start-read';
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        log('socket not open when sending GRUNT (closed early — rate limit?)');
        return;
      }
      phase = 'wait-accept';
      log('→ sending WARTHOG GRUNT? (24B)');
      ws.send(grunt);
    }, 250);
  });

  ws.on('message', (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const magic = buf.subarray(0, Math.min(14, buf.length)).toString('utf8');
    log(`← ${buf.length}B magic=${JSON.stringify(magic)} hex=${buf.toString('hex').slice(0, 64)}`);

    if (phase === 'wait-accept' && buf.length >= 22 && magic === 'WARTHOG GRUNT!') {
      const peer = unpackVersion(buf.readUInt32BE(14));
      log(`peer version v${peer}`);
      log('→ sending ACK 0x00');
      ws.send(Buffer.from([0]));
      phase = 'done';
      log('HANDSHAKE COMPLETE ✓');
      clearTimeout(failTimer);
      setTimeout(() => {
        log('closing cleanly');
        ws.close(1000, 'handshake-ok');
      }, 1500);
    } else if (phase === 'done') {
      log('post-handshake frame (P2P traffic possible)');
    } else {
      log('unexpected frame while phase=', phase);
    }
  });

  ws.on('close', (code, reason) => {
    clearTimeout(failTimer);
    const r = reason?.toString?.() || '';
    log(`CLOSE code=${code} reason=${r || '(none)'} phase=${phase} ms=${Date.now() - t0}`);
    if (phase === 'done') {
      console.log('\nOK — full GRUNT handshake succeeded. Safe to Start full WASM node');
      console.log('(wait ≥30s if you will open another /ws from this IP).');
      process.exit(0);
    }
    if (phase === 'connecting' || phase === 'wait-start-read') {
      console.log('\nFAIL — closed before/during open. Rate-limited/banned or path broken.');
    } else {
      console.log('\nFAIL — no complete GRUNT. See notes above.');
    }
    process.exit(1);
  });

  ws.on('error', (err) => {
    log('ERROR', err.message);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
