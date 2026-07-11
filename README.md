# Warthog Browser Full Node (WASM)

Run a real **Warthog full node in the browser** (Emscripten WASM + pthreads + OPFS), not a remote RPC dashboard.

| Piece | Location |
|--------|----------|
| WASM triad | `public/node/wart-node.{js,wasm,worker.js}` (v0.7.58) |
| UI | `src/components/WasmBrowserNode.jsx` |
| Boot + WS glue | `src/lib/wasmNode.js` |
| Official1 defaults | `src/lib/bridge.js` → `wss://warthognode.duckdns.org/ws` |

## Requirements

Page must be **cross-origin isolated**:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Set in `netlify.toml`, `public/_headers`, and `astro.config.mjs` (dev).

## Local development

```bash
npm install
npm run dev
# open http://127.0.0.1:4321/
# Isolation badge must be OK → click "Start full WASM node" once
```

### Peer URL

| Environment | Default `WS_PEERS` |
|-------------|-------------------|
| **localhost** | `ws://…/ws-bridge` (Vite proxies to Official1) |
| **Netlify / production** | `wss://warthognode.duckdns.org/ws` (direct) |

Override anytime:

```text
?peers=wss://warthognode.duckdns.org/ws
```

Or UI buttons: **Use public Official1** / **Use local /ws-bridge**.

### CLI GRUNT test (network truth)

```bash
npm run test:handshake
npm run test:handshake:wait   # 35s cool-down then handshake
```

Wire format (outbound client):

```text
→ 24B  WARTHOG GRUNT? + u32be version + port
← 22B  WARTHOG GRUNT! + u32be version
→ 1B   0x00 ACK
```

Do **not** spam Probe /ws on Official1 (rate-limit / ban).

## Deploy to Netlify + GitHub

1. Create a GitHub repo and push this folder:

```bash
cd warthog-browser-node
git init
git add .
git commit -m "Initial Warthog browser full node (WASM)"
git branch -M main
git remote add origin git@github.com:YOUR_USER/warthog-browser-node.git
git push -u origin main
```

2. [Netlify](https://app.netlify.com) → **Add new site** → **Import from Git** → pick the repo.

3. Build settings (usually auto from `netlify.toml`):

   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node: `22`

4. Deploy. Open the site → **Isolation OK** → **Start full WASM node**.

5. Production uses **public** `wss://warthognode.duckdns.org/ws` (no `/ws-bridge`).

### Netlify checklist

After deploy, hard-refresh the live URL and confirm:

- [ ] Badge is **Isolation OK** (not “Need COOP/COEP”)
- [ ] Runtime: `crossOriginIsolated` = **true**, SharedArrayBuffer = **available**
- [ ] DevTools → Network → first document → response headers include:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- [ ] Console after Start shows `installed v4`
- [ ] Production uses public `wss://warthognode.duckdns.org/ws` (no `/ws-bridge`)

**If isolation is still false:** headers never reached the HTML. This repo sets them in
`src/middleware.js` (SSR), `netlify.toml`, and `public/_headers`. Redeploy the latest
commit; do not use a static-only publish that drops SSR.

## Known behavior

- OPFS stores chain DBs in the browser; **one tab** per origin.
- Official1 may rate-limit ~1 `/ws` connect per public IP (~30s); failed GRUNT can ban longer.
- If GRUNT succeeds then socket closes after first Init (`tx 61B` → `1006`), that is a **post-handshake** issue (not “can’t connect”).

## License / assets

WASM binary is built from Warthog core; ship only what your project license allows.
