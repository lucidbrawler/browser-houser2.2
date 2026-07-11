/**
 * Force COOP/COEP on every response (including Netlify SSR function HTML).
 * netlify.toml / _headers alone often miss the serverless document response,
 * which leaves crossOriginIsolated=false and blocks SharedArrayBuffer/WASM.
 */
const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
};

/** @type {import('astro').MiddlewareHandler} */
export async function onRequest(_context, next) {
  const response = await next();
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(ISOLATION_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
