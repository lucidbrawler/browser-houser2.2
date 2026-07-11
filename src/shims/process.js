/** Minimal process shim for browser crypto polyfills. */
const processShim = {
  env: {},
  browser: true,
  version: '',
  versions: {},
  nextTick: (fn, ...args) => queueMicrotask(() => fn(...args)),
  cwd: () => '/',
};

export default processShim;
