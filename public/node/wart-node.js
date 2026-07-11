
var Module = (() => {
  var _scriptName = import.meta.url;
  
  return (
function(moduleArg = {}) {
  var moduleRtn;

// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function GROWABLE_HEAP_I8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP8;
}
function GROWABLE_HEAP_U8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU8;
}
function GROWABLE_HEAP_I16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP16;
}
function GROWABLE_HEAP_U16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU16;
}
function GROWABLE_HEAP_I32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP32;
}
function GROWABLE_HEAP_U32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU32;
}
function GROWABLE_HEAP_F32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF32;
}
function GROWABLE_HEAP_F64() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF64;
}

var Module = Object.assign({}, moduleArg);

var readyPromiseResolve, readyPromiseReject;

var readyPromise = new Promise((resolve, reject) => {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});

[ "getExceptionMessage", "incrementExceptionRefcount", "decrementExceptionRefcount", "___indirect_function_table", "_virtual_get_request", "_virtual_post_request", "_stream_control", "__emscripten_proxy_main", "_main", "onRuntimeInitialized" ].forEach(prop => {
  if (!Object.getOwnPropertyDescriptor(readyPromise, prop)) {
    Object.defineProperty(readyPromise, prop, {
      get: () => abort("You are getting " + prop + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"),
      set: () => abort("You are setting " + prop + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js")
    });
  }
});

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
  throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && self.name == "em-pthread";

if (ENVIRONMENT_IS_PTHREAD) {
  assert(!globalThis.moduleLoaded, "module should only be loaded once on each pthread worker");
  globalThis.moduleLoaded = true;
}

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

var read_, readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {
  if ((typeof process == "object" && typeof require === "function") || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
} else  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (_scriptName) {
    scriptDirectory = _scriptName;
  }
  if (scriptDirectory.startsWith("blob:")) {
    scriptDirectory = "";
  } else {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  }
  if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  {
    read_ = url => {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText;
    };
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = (url, onload, onerror) => {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => {
        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
          onload(xhr.response);
          return;
        }
        onerror();
      };
      xhr.onerror = onerror;
      xhr.send(null);
    };
  }
} else  {
  throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

checkIncomingModuleAPI();

if (Module["arguments"]) arguments_ = Module["arguments"];

legacyModuleProp("arguments", "arguments_");

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

legacyModuleProp("thisProgram", "thisProgram");

if (Module["quit"]) quit_ = Module["quit"];

legacyModuleProp("quit", "quit_");

assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["read"] == "undefined", "Module.read option was removed (modify read_ in JS)");

assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");

assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");

assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");

assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

legacyModuleProp("asm", "wasmExports");

legacyModuleProp("read", "read_");

legacyModuleProp("readAsync", "readAsync");

legacyModuleProp("readBinary", "readBinary");

legacyModuleProp("setWindowTitle", "setWindowTitle");

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";

var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";

var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";

var OPFS = "OPFS is no longer included by default; build with -lopfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

assert(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_NODE, "Pthreads do not work in this environment yet (need Web Workers, or an alternative to them)");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add `node` to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");

var workerID = 0;

if (ENVIRONMENT_IS_PTHREAD) {
  var wasmPromiseResolve;
  var wasmPromiseReject;
  var receivedWasmModule;
  var initializedJS = false;
  function threadPrintErr(...args) {
    var text = args.join(" ");
    console.error(text);
  }
  if (!Module["printErr"]) err = threadPrintErr;
  dbg = threadPrintErr;
  function threadAlert(...args) {
    var text = args.join(" ");
    postMessage({
      cmd: "alert",
      text: text,
      threadId: _pthread_self()
    });
  }
  self.alert = threadAlert;
  Module["instantiateWasm"] = (info, receiveInstance) => new Promise((resolve, reject) => {
    wasmPromiseResolve = module => {
      var instance = new WebAssembly.Instance(module, getWasmImports());
      receiveInstance(instance);
      resolve();
    };
    wasmPromiseReject = reject;
  });
  self.onunhandledrejection = e => {
    throw e.reason || e;
  };
  function handleMessage(e) {
    try {
      var msgData = e["data"];
      var cmd = msgData["cmd"];
      if (cmd === "load") {
        workerID = msgData["workerID"];
        let messageQueue = [];
        self.onmessage = e => messageQueue.push(e);
        self.startWorker = instance => {
          postMessage({
            "cmd": "loaded"
          });
          for (let msg of messageQueue) {
            handleMessage(msg);
          }
          self.onmessage = handleMessage;
        };
        for (const handler of msgData["handlers"]) {
          if (!Module[handler] || Module[handler].proxy) {
            Module[handler] = (...args) => {
              postMessage({
                cmd: "callHandler",
                handler: handler,
                args: args
              });
            };
            if (handler == "print") out = Module[handler];
            if (handler == "printErr") err = Module[handler];
          }
        }
        wasmMemory = msgData["wasmMemory"];
        updateMemoryViews();
        wasmPromiseResolve(msgData["wasmModule"]);
      } else if (cmd === "run") {
        __emscripten_thread_init(msgData["pthread_ptr"], /*is_main=*/ 0, /*is_runtime=*/ 0, /*can_block=*/ 1, 0, 0);
        __emscripten_thread_mailbox_await(msgData["pthread_ptr"]);
        assert(msgData["pthread_ptr"]);
        establishStackSpace();
        PThread.receiveObjectTransfer(msgData);
        PThread.threadInitTLS();
        if (!initializedJS) {
          initializedJS = true;
        }
        try {
          invokeEntryPoint(msgData["start_routine"], msgData["arg"]);
        } catch (ex) {
          if (ex != "unwind") {
            throw ex;
          }
        }
      } else if (cmd === "cancel") {
        if (_pthread_self()) {
          __emscripten_thread_exit(-1);
        }
      } else if (msgData.target === "setimmediate") {} else  if (cmd === "checkMailbox") {
        if (initializedJS) {
          checkMailbox();
        }
      } else if (cmd) {
        err(`worker: received unknown command ${cmd}`);
        err(msgData);
      }
    } catch (ex) {
      err(`worker: onmessage() captured an uncaught exception: ${ex}`);
      if (ex?.stack) err(ex.stack);
      __emscripten_thread_crashed();
      throw ex;
    }
  }
  self.onmessage = handleMessage;
}

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

legacyModuleProp("wasmBinary", "wasmBinary");

if (typeof WebAssembly != "object") {
  err("no native wasm support detected");
}

var wasmMemory;

var wasmModule;

var ABORT = false;

var EXITSTATUS;

/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

var HEAP, /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /* BigInt64Array type is not correctly defined in closure
/** not-@type {!BigInt64Array} */ HEAP64, /* BigUInt64Array type is not correctly defined in closure
/** not-t@type {!BigUint64Array} */ HEAPU64, /** @type {!Float64Array} */ HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module["HEAP8"] = HEAP8 = new Int8Array(b);
  Module["HEAP16"] = HEAP16 = new Int16Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
  Module["HEAP32"] = HEAP32 = new Int32Array(b);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
  Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
  Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
}

assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");

assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");

if (!ENVIRONMENT_IS_PTHREAD) {
  if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"];
  } else {
    var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 8388608;
    legacyModuleProp("INITIAL_MEMORY", "INITIAL_MEMORY");
    assert(INITIAL_MEMORY >= 4194304, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 4194304 + ")");
    wasmMemory = new WebAssembly.Memory({
      "initial": INITIAL_MEMORY / 65536,
      "maximum": 805306368 / 65536,
      "shared": true
    });
    if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
      err("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
      if (ENVIRONMENT_IS_NODE) {
        err("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)");
      }
      throw Error("bad memory");
    }
  }
  updateMemoryViews();
}

function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  if (max == 0) {
    max += 4;
  }
  GROWABLE_HEAP_U32()[((max) >> 2)] = 34821223;
  GROWABLE_HEAP_U32()[(((max) + (4)) >> 2)] = 2310721022;
  GROWABLE_HEAP_U32()[((0) >> 2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  if (max == 0) {
    max += 4;
  }
  var cookie1 = GROWABLE_HEAP_U32()[((max) >> 2)];
  var cookie2 = GROWABLE_HEAP_U32()[(((max) + (4)) >> 2)];
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  if (GROWABLE_HEAP_U32()[((0) >> 2)] != 1668509029) /* 'emsc' */ {
    abort("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}

(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
  assert(!ENVIRONMENT_IS_PTHREAD);
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  if (ENVIRONMENT_IS_PTHREAD) return;
  checkStackCookie();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  if (ENVIRONMENT_IS_PTHREAD) return;
  callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
  checkStackCookie();
  if (ENVIRONMENT_IS_PTHREAD) return;
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != "undefined") {
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err("still waiting on run dependencies:");
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err("(end of list)");
        }
      }, 1e4);
    }
  } else {
    err("warning: run dependency added without ID");
  }
}

function removeRunDependency(id) {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err("warning: run dependency removed without ID");
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

/** @param {string|number=} what */ function abort(what) {
  Module["onAbort"]?.(what);
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  readyPromiseReject(e);
  throw e;
}

var FS = {
  error() {
    abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
  },
  init() {
    FS.error();
  },
  createDataFile() {
    FS.error();
  },
  createPreloadedFile() {
    FS.error();
  },
  createLazyFile() {
    FS.error();
  },
  open() {
    FS.error();
  },
  mkdev() {
    FS.error();
  },
  registerDevice() {
    FS.error();
  },
  analyzePath() {
    FS.error();
  },
  ErrnoError() {
    FS.error();
  }
};

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

var dataURIPrefix = "data:application/octet-stream;base64,";

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */ var isDataURI = filename => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

class EmscriptenEH extends Error {}

class EmscriptenSjLj extends EmscriptenEH {}

class CppException extends EmscriptenEH {
  constructor(excPtr) {
    super(excPtr);
    this.excPtr = excPtr;
    const excInfo = getExceptionMessage(excPtr);
    this.name = excInfo[0];
    this.message = excInfo[1];
  }
}

function findWasmBinary() {
  if (Module["locateFile"]) {
    var f = "wart-node.wasm";
    if (!isDataURI(f)) {
      return locateFile(f);
    }
    return f;
  }
  return new URL("wart-node.wasm", import.meta.url).href;
}

var wasmBinaryFile;

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise(binaryFile) {
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == "function") {
      return fetch(binaryFile, {
        credentials: "same-origin"
      }).then(response => {
        if (!response["ok"]) {
          throw `failed to load wasm binary file at '${binaryFile}'`;
        }
        return response["arrayBuffer"]();
      }).catch(() => getBinarySync(binaryFile));
    }
  }
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(receiver, reason => {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && typeof fetch == "function") {
    return fetch(binaryFile, {
      credentials: "same-origin"
    }).then(response => {
      /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
      return result.then(callback, function(reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
        return instantiateArrayBuffer(binaryFile, imports, callback);
      });
    });
  }
  return instantiateArrayBuffer(binaryFile, imports, callback);
}

function getWasmImports() {
  assignWasmImports();
  return {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
}

function createWasm() {
  var info = getWasmImports();
  /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    registerTLSInit(wasmExports["_emscripten_tls_init"]);
    wasmTable = wasmExports["__indirect_function_table"];
    assert(wasmTable, "table not found in wasm exports");
    addOnInit(wasmExports["__wasm_call_ctors"]);
    wasmModule = module;
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  addRunDependency("wasm-instantiate");
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    receiveInstance(result["instance"], result["module"]);
  }
  if (Module["instantiateWasm"]) {
    try {
      return Module["instantiateWasm"](info, receiveInstance);
    } catch (e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
      readyPromiseReject(e);
    }
  }
  if (!wasmBinaryFile) wasmBinaryFile = findWasmBinary();
  instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
  return {};
}

function legacyModuleProp(prop, newName, incoming = true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incoming ? " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)" : "";
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);
      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || name === "removeRunDependency";
}

function missingGlobal(sym, msg) {
  if (typeof globalThis != "undefined") {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
        return undefined;
      }
    });
  }
}

missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");

missingGlobal("asm", "Please use wasmExports instead");

function missingLibrarySymbol(sym) {
  if (typeof globalThis != "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
        var librarySymbol = sym;
        if (!librarySymbol.startsWith("_")) {
          librarySymbol = "$" + sym;
        }
        msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (ENVIRONMENT_IS_PTHREAD) {
    return;
  }
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      }
    });
  }
}

function dbg(...args) {
  console.warn(...args);
}

/** @constructor */ function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = `Program terminated with exit(${status})`;
  this.status = status;
}

Module["ExitStatus"] = ExitStatus;

var terminateWorker = worker => {
  worker.terminate();
  worker.onmessage = e => {
    var cmd = e["data"]["cmd"];
    err(`received "${cmd}" command from terminated worker: ${worker.workerID}`);
  };
};

Module["terminateWorker"] = terminateWorker;

var killThread = pthread_ptr => {
  assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! killThread() can only ever be called from main application thread!");
  assert(pthread_ptr, "Internal Error! Null pthread_ptr in killThread!");
  var worker = PThread.pthreads[pthread_ptr];
  delete PThread.pthreads[pthread_ptr];
  terminateWorker(worker);
  __emscripten_thread_free_data(pthread_ptr);
  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
  worker.pthread_ptr = 0;
};

Module["killThread"] = killThread;

var cancelThread = pthread_ptr => {
  assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! cancelThread() can only ever be called from main application thread!");
  assert(pthread_ptr, "Internal Error! Null pthread_ptr in cancelThread!");
  var worker = PThread.pthreads[pthread_ptr];
  worker.postMessage({
    "cmd": "cancel"
  });
};

Module["cancelThread"] = cancelThread;

var cleanupThread = pthread_ptr => {
  assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! cleanupThread() can only ever be called from main application thread!");
  assert(pthread_ptr, "Internal Error! Null pthread_ptr in cleanupThread!");
  var worker = PThread.pthreads[pthread_ptr];
  assert(worker);
  PThread.returnWorkerToPool(worker);
};

Module["cleanupThread"] = cleanupThread;

var zeroMemory = (address, size) => {
  GROWABLE_HEAP_U8().fill(0, address, address + size);
  return address;
};

Module["zeroMemory"] = zeroMemory;

var spawnThread = threadParams => {
  assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! spawnThread() can only ever be called from main application thread!");
  assert(threadParams.pthread_ptr, "Internal error, no pthread ptr!");
  var worker = PThread.getNewWorker();
  if (!worker) {
    return 6;
  }
  assert(!worker.pthread_ptr, "Internal error!");
  PThread.runningWorkers.push(worker);
  PThread.pthreads[threadParams.pthread_ptr] = worker;
  worker.pthread_ptr = threadParams.pthread_ptr;
  var msg = {
    "cmd": "run",
    "start_routine": threadParams.startRoutine,
    "arg": threadParams.arg,
    "pthread_ptr": threadParams.pthread_ptr
  };
  worker.postMessage(msg, threadParams.transferList);
  return 0;
};

Module["spawnThread"] = spawnThread;

var runtimeKeepaliveCounter = 0;

Module["runtimeKeepaliveCounter"] = runtimeKeepaliveCounter;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

Module["keepRuntimeAlive"] = keepRuntimeAlive;

var stackSave = () => _emscripten_stack_get_current();

Module["stackSave"] = stackSave;

var stackRestore = val => __emscripten_stack_restore(val);

Module["stackRestore"] = stackRestore;

var stackAlloc = sz => __emscripten_stack_alloc(sz);

Module["stackAlloc"] = stackAlloc;

var MAX_INT53 = 9007199254740992;

Module["MAX_INT53"] = MAX_INT53;

var MIN_INT53 = -9007199254740992;

Module["MIN_INT53"] = MIN_INT53;

var bigintToI53Checked = num => (num < MIN_INT53 || num > MAX_INT53) ? NaN : Number(num);

Module["bigintToI53Checked"] = bigintToI53Checked;

/** @type{function(number, (number|boolean), ...number)} */ var proxyToMainThread = (funcIndex, emAsmAddr, sync, ...callArgs) => {
  var serializedNumCallArgs = callArgs.length * 2;
  var sp = stackSave();
  var args = stackAlloc(serializedNumCallArgs * 8);
  var b = ((args) >> 3);
  for (var i = 0; i < callArgs.length; i++) {
    var arg = callArgs[i];
    if (typeof arg == "bigint") {
      HEAP64[b + 2 * i] = 1n;
      HEAP64[b + 2 * i + 1] = arg;
    } else {
      HEAP64[b + 2 * i] = 0n;
      GROWABLE_HEAP_F64()[b + 2 * i + 1] = arg;
    }
  }
  var rtn = __emscripten_run_on_main_thread_js(funcIndex, emAsmAddr, serializedNumCallArgs, args, sync);
  stackRestore(sp);
  return rtn;
};

Module["proxyToMainThread"] = proxyToMainThread;

function _proc_exit(code) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 1, code);
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    PThread.terminateAllThreads();
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}

Module["_proc_exit"] = _proc_exit;

var handleException = e => {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 4194304)");
    }
  }
  quit_(1, e);
};

Module["handleException"] = handleException;

var runtimeKeepalivePop = () => {
  assert(runtimeKeepaliveCounter > 0);
  runtimeKeepaliveCounter -= 1;
};

Module["runtimeKeepalivePop"] = runtimeKeepalivePop;

function exitOnMainThread(returnCode) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 0, returnCode);
  runtimeKeepalivePop();
  _exit(returnCode);
}

Module["exitOnMainThread"] = exitOnMainThread;

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  if (ENVIRONMENT_IS_PTHREAD) {
    assert(!implicit);
    exitOnMainThread(status);
    throw "unwind";
  }
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    readyPromiseReject(msg);
    err(msg);
  }
  _proc_exit(status);
};

Module["exitJS"] = exitJS;

var _exit = exitJS;

Module["_exit"] = _exit;

var ptrToString = ptr => {
  assert(typeof ptr === "number");
  ptr >>>= 0;
  return "0x" + ptr.toString(16).padStart(8, "0");
};

Module["ptrToString"] = ptrToString;

var PThread = {
  unusedWorkers: [],
  runningWorkers: [],
  tlsInitFunctions: [],
  pthreads: {},
  nextWorkerID: 1,
  debugInit() {
    function pthreadLogPrefix() {
      var t = 0;
      if (runtimeInitialized && typeof _pthread_self != "undefined") {
        t = _pthread_self();
      }
      return "w:" + workerID + ",t:" + ptrToString(t) + ": ";
    }
    var origDbg = dbg;
    dbg = (...args) => origDbg(pthreadLogPrefix() + args.join(" "));
  },
  init() {
    PThread.debugInit();
    if (ENVIRONMENT_IS_PTHREAD) {
      PThread.initWorker();
    } else {
      PThread.initMainThread();
    }
  },
  initMainThread() {
    var pthreadPoolSize = 4;
    while (pthreadPoolSize--) {
      PThread.allocateUnusedWorker();
    }
    addOnPreRun(() => {
      addRunDependency("loading-workers");
      PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"));
    });
  },
  initWorker() {
    noExitRuntime = false;
  },
  setExitStatus: status => EXITSTATUS = status,
  terminateAllThreads__deps: [ "$terminateWorker" ],
  terminateAllThreads: () => {
    assert(!ENVIRONMENT_IS_PTHREAD, "Internal Error! terminateAllThreads() can only ever be called from main application thread!");
    for (var worker of PThread.runningWorkers) {
      terminateWorker(worker);
    }
    for (var worker of PThread.unusedWorkers) {
      terminateWorker(worker);
    }
    PThread.unusedWorkers = [];
    PThread.runningWorkers = [];
    PThread.pthreads = [];
  },
  returnWorkerToPool: worker => {
    var pthread_ptr = worker.pthread_ptr;
    delete PThread.pthreads[pthread_ptr];
    PThread.unusedWorkers.push(worker);
    PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
    worker.pthread_ptr = 0;
    __emscripten_thread_free_data(pthread_ptr);
  },
  receiveObjectTransfer(data) {},
  threadInitTLS() {
    PThread.tlsInitFunctions.forEach(f => f());
  },
  loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
    worker.onmessage = e => {
      var d = e["data"];
      var cmd = d["cmd"];
      if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
        var targetWorker = PThread.pthreads[d["targetThread"]];
        if (targetWorker) {
          targetWorker.postMessage(d, d["transferList"]);
        } else {
          err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d["targetThread"]}, but that thread no longer exists!`);
        }
        return;
      }
      if (cmd === "checkMailbox") {
        checkMailbox();
      } else if (cmd === "spawnThread") {
        spawnThread(d);
      } else if (cmd === "cleanupThread") {
        cleanupThread(d["thread"]);
      } else if (cmd === "killThread") {
        killThread(d["thread"]);
      } else if (cmd === "cancelThread") {
        cancelThread(d["thread"]);
      } else if (cmd === "loaded") {
        worker.loaded = true;
        onFinishedLoading(worker);
      } else if (cmd === "alert") {
        alert(`Thread ${d["threadId"]}: ${d["text"]}`);
      } else if (d.target === "setimmediate") {
        worker.postMessage(d);
      } else if (cmd === "callHandler") {
        Module[d["handler"]](...d["args"]);
      } else if (cmd) {
        err(`worker sent an unknown command ${cmd}`);
      }
    };
    worker.onerror = e => {
      var message = "worker sent an error!";
      if (worker.pthread_ptr) {
        message = `Pthread ${ptrToString(worker.pthread_ptr)} sent an error!`;
      }
      err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
      throw e;
    };
    assert(wasmMemory instanceof WebAssembly.Memory, "WebAssembly memory should have been loaded by now!");
    assert(wasmModule instanceof WebAssembly.Module, "WebAssembly Module should have been loaded by now!");
    var handlers = [];
    var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
    for (var handler of knownHandlers) {
      if (Module.propertyIsEnumerable(handler)) {
        handlers.push(handler);
      }
    }
    worker.workerID = PThread.nextWorkerID++;
    worker.postMessage({
      "cmd": "load",
      "handlers": handlers,
      "wasmMemory": wasmMemory,
      "wasmModule": wasmModule,
      "workerID": worker.workerID
    });
  }),
  loadWasmModuleToAllWorkers(onMaybeReady) {
    if (ENVIRONMENT_IS_PTHREAD) {
      return onMaybeReady();
    }
    let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
    pthreadPoolReady.then(onMaybeReady);
  },
  allocateUnusedWorker() {
    var worker;
    var workerOptions = {
      "type": "module",
      "name": "em-pthread"
    };
    worker = new Worker(new URL(import.meta.url), workerOptions);
    PThread.unusedWorkers.push(worker);
  },
  getNewWorker() {
    if (PThread.unusedWorkers.length == 0) {
      PThread.allocateUnusedWorker();
      PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
    }
    return PThread.unusedWorkers.pop();
  }
};

Module["PThread"] = PThread;

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
};

Module["callRuntimeCallbacks"] = callRuntimeCallbacks;

var establishStackSpace = () => {
  var pthread_ptr = _pthread_self();
  var stackHigh = GROWABLE_HEAP_U32()[(((pthread_ptr) + (52)) >> 2)];
  var stackSize = GROWABLE_HEAP_U32()[(((pthread_ptr) + (56)) >> 2)];
  var stackLow = stackHigh - stackSize;
  assert(stackHigh != 0);
  assert(stackLow != 0);
  assert(stackHigh > stackLow, "stackHigh must be higher then stackLow");
  _emscripten_stack_set_limits(stackHigh, stackLow);
  stackRestore(stackHigh);
  writeStackCookie();
};

Module["establishStackSpace"] = establishStackSpace;

/**
     * @param {number} ptr
     * @param {string} type
     */ function getValue(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    return GROWABLE_HEAP_I8()[ptr];

   case "i8":
    return GROWABLE_HEAP_I8()[ptr];

   case "i16":
    return GROWABLE_HEAP_I16()[((ptr) >> 1)];

   case "i32":
    return GROWABLE_HEAP_I32()[((ptr) >> 2)];

   case "i64":
    return HEAP64[((ptr) >> 3)];

   case "float":
    return GROWABLE_HEAP_F32()[((ptr) >> 2)];

   case "double":
    return GROWABLE_HEAP_F64()[((ptr) >> 3)];

   case "*":
    return GROWABLE_HEAP_U32()[((ptr) >> 2)];

   default:
    abort(`invalid type for getValue: ${type}`);
  }
}

Module["getValue"] = getValue;

var wasmTableMirror = [];

Module["wasmTableMirror"] = wasmTableMirror;

/** @type {WebAssembly.Table} */ var wasmTable;

Module["wasmTable"] = wasmTable;

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
    wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
  return func;
};

Module["getWasmTableEntry"] = getWasmTableEntry;

var invokeEntryPoint = (ptr, arg) => {
  runtimeKeepaliveCounter = 0;
  var result = getWasmTableEntry(ptr)(arg);
  checkStackCookie();
  function finish(result) {
    if (keepRuntimeAlive()) {
      PThread.setExitStatus(result);
    } else {
      __emscripten_thread_exit(result);
    }
  }
  finish(result);
};

Module["invokeEntryPoint"] = invokeEntryPoint;

var noExitRuntime = Module["noExitRuntime"] || true;

Module["noExitRuntime"] = noExitRuntime;

var registerTLSInit = tlsInitFunc => PThread.tlsInitFunctions.push(tlsInitFunc);

Module["registerTLSInit"] = registerTLSInit;

var runtimeKeepalivePush = () => {
  runtimeKeepaliveCounter += 1;
};

Module["runtimeKeepalivePush"] = runtimeKeepalivePush;

/**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */ function setValue(ptr, value, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    GROWABLE_HEAP_I8()[ptr] = value;
    break;

   case "i8":
    GROWABLE_HEAP_I8()[ptr] = value;
    break;

   case "i16":
    GROWABLE_HEAP_I16()[((ptr) >> 1)] = value;
    break;

   case "i32":
    GROWABLE_HEAP_I32()[((ptr) >> 2)] = value;
    break;

   case "i64":
    HEAP64[((ptr) >> 3)] = BigInt(value);
    break;

   case "float":
    GROWABLE_HEAP_F32()[((ptr) >> 2)] = value;
    break;

   case "double":
    GROWABLE_HEAP_F64()[((ptr) >> 3)] = value;
    break;

   case "*":
    GROWABLE_HEAP_U32()[((ptr) >> 2)] = value;
    break;

   default:
    abort(`invalid type for setValue: ${type}`);
  }
}

Module["setValue"] = setValue;

var warnOnce = text => {
  warnOnce.shown ||= {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
};

Module["warnOnce"] = warnOnce;

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

Module["UTF8Decoder"] = UTF8Decoder;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.buffer instanceof SharedArrayBuffer ? heapOrArray.slice(idx, endPtr) : heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

Module["UTF8ArrayToString"] = UTF8ArrayToString;

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => {
  assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
  return ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : "";
};

Module["UTF8ToString"] = UTF8ToString;

var ___assert_fail = (condition, filename, line, func) => {
  abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
};

Module["___assert_fail"] = ___assert_fail;

var exceptionCaught = [];

Module["exceptionCaught"] = exceptionCaught;

var uncaughtExceptionCount = 0;

Module["uncaughtExceptionCount"] = uncaughtExceptionCount;

var ___cxa_begin_catch = ptr => {
  var info = new ExceptionInfo(ptr);
  if (!info.get_caught()) {
    info.set_caught(true);
    uncaughtExceptionCount--;
  }
  info.set_rethrown(false);
  exceptionCaught.push(info);
  ___cxa_increment_exception_refcount(info.excPtr);
  return info.get_exception_ptr();
};

Module["___cxa_begin_catch"] = ___cxa_begin_catch;

var exceptionLast = 0;

Module["exceptionLast"] = exceptionLast;

var ___cxa_end_catch = () => {
  _setThrew(0, 0);
  assert(exceptionCaught.length > 0);
  var info = exceptionCaught.pop();
  ___cxa_decrement_exception_refcount(info.excPtr);
  exceptionLast = 0;
};

Module["___cxa_end_catch"] = ___cxa_end_catch;

class ExceptionInfo {
  constructor(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - 24;
  }
  set_type(type) {
    GROWABLE_HEAP_U32()[(((this.ptr) + (4)) >> 2)] = type;
  }
  get_type() {
    return GROWABLE_HEAP_U32()[(((this.ptr) + (4)) >> 2)];
  }
  set_destructor(destructor) {
    GROWABLE_HEAP_U32()[(((this.ptr) + (8)) >> 2)] = destructor;
  }
  get_destructor() {
    return GROWABLE_HEAP_U32()[(((this.ptr) + (8)) >> 2)];
  }
  set_caught(caught) {
    caught = caught ? 1 : 0;
    GROWABLE_HEAP_I8()[(this.ptr) + (12)] = caught;
  }
  get_caught() {
    return GROWABLE_HEAP_I8()[(this.ptr) + (12)] != 0;
  }
  set_rethrown(rethrown) {
    rethrown = rethrown ? 1 : 0;
    GROWABLE_HEAP_I8()[(this.ptr) + (13)] = rethrown;
  }
  get_rethrown() {
    return GROWABLE_HEAP_I8()[(this.ptr) + (13)] != 0;
  }
  init(type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
  }
  set_adjusted_ptr(adjustedPtr) {
    GROWABLE_HEAP_U32()[(((this.ptr) + (16)) >> 2)] = adjustedPtr;
  }
  get_adjusted_ptr() {
    return GROWABLE_HEAP_U32()[(((this.ptr) + (16)) >> 2)];
  }
  get_exception_ptr() {
    var isPointer = ___cxa_is_pointer_type(this.get_type());
    if (isPointer) {
      return GROWABLE_HEAP_U32()[((this.excPtr) >> 2)];
    }
    var adjusted = this.get_adjusted_ptr();
    if (adjusted !== 0) return adjusted;
    return this.excPtr;
  }
}

Module["ExceptionInfo"] = ExceptionInfo;

var ___resumeException = ptr => {
  if (!exceptionLast) {
    exceptionLast = new CppException(ptr);
  }
  throw exceptionLast;
};

Module["___resumeException"] = ___resumeException;

var setTempRet0 = val => __emscripten_tempret_set(val);

Module["setTempRet0"] = setTempRet0;

var findMatchingCatch = args => {
  var thrown = exceptionLast?.excPtr;
  if (!thrown) {
    setTempRet0(0);
    return 0;
  }
  var info = new ExceptionInfo(thrown);
  info.set_adjusted_ptr(thrown);
  var thrownType = info.get_type();
  if (!thrownType) {
    setTempRet0(0);
    return thrown;
  }
  for (var arg in args) {
    var caughtType = args[arg];
    if (caughtType === 0 || caughtType === thrownType) {
      break;
    }
    var adjusted_ptr_addr = info.ptr + 16;
    if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
      setTempRet0(caughtType);
      return thrown;
    }
  }
  setTempRet0(thrownType);
  return thrown;
};

Module["findMatchingCatch"] = findMatchingCatch;

var ___cxa_find_matching_catch_2 = () => findMatchingCatch([]);

Module["___cxa_find_matching_catch_2"] = ___cxa_find_matching_catch_2;

var ___cxa_find_matching_catch_3 = arg0 => findMatchingCatch([ arg0 ]);

Module["___cxa_find_matching_catch_3"] = ___cxa_find_matching_catch_3;

var ___cxa_find_matching_catch_4 = (arg0, arg1) => findMatchingCatch([ arg0, arg1 ]);

Module["___cxa_find_matching_catch_4"] = ___cxa_find_matching_catch_4;

var ___cxa_rethrow = () => {
  var info = exceptionCaught.pop();
  if (!info) {
    abort("no exception to throw");
  }
  var ptr = info.excPtr;
  if (!info.get_rethrown()) {
    exceptionCaught.push(info);
    info.set_rethrown(true);
    info.set_caught(false);
    uncaughtExceptionCount++;
  }
  exceptionLast = new CppException(ptr);
  throw exceptionLast;
};

Module["___cxa_rethrow"] = ___cxa_rethrow;

var ___cxa_throw = (ptr, type, destructor) => {
  var info = new ExceptionInfo(ptr);
  info.init(type, destructor);
  exceptionLast = new CppException(ptr);
  uncaughtExceptionCount++;
  throw exceptionLast;
};

Module["___cxa_throw"] = ___cxa_throw;

var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;

Module["___cxa_uncaught_exceptions"] = ___cxa_uncaught_exceptions;

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
  return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

Module["pthreadCreateProxied"] = pthreadCreateProxied;

var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
  if (typeof SharedArrayBuffer == "undefined") {
    err("Current environment does not support SharedArrayBuffer, pthreads are not available!");
    return 6;
  }
  var transferList = [];
  var error = 0;
  if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
    return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
  }
  if (error) return error;
  var threadParams = {
    startRoutine: startRoutine,
    pthread_ptr: pthread_ptr,
    arg: arg,
    transferList: transferList
  };
  if (ENVIRONMENT_IS_PTHREAD) {
    threadParams.cmd = "spawnThread";
    postMessage(threadParams, transferList);
    return 0;
  }
  return spawnThread(threadParams);
};

Module["___pthread_create_js"] = ___pthread_create_js;

var ___pthread_kill_js = (thread, signal) => {
  if (signal === 33) {
    if (!ENVIRONMENT_IS_PTHREAD) cancelThread(thread); else postMessage({
      "cmd": "cancelThread",
      "thread": thread
    });
  } else {
    if (!ENVIRONMENT_IS_PTHREAD) killThread(thread); else postMessage({
      "cmd": "killThread",
      "thread": thread
    });
  }
  return 0;
};

Module["___pthread_kill_js"] = ___pthread_kill_js;

var __abort_js = () => {
  abort("native code called abort()");
};

Module["__abort_js"] = __abort_js;

var nowIsMonotonic = 1;

Module["nowIsMonotonic"] = nowIsMonotonic;

var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;

Module["__emscripten_get_now_is_monotonic"] = __emscripten_get_now_is_monotonic;

var __emscripten_init_main_thread_js = tb => {
  __emscripten_thread_init(tb, /*is_main=*/ !ENVIRONMENT_IS_WORKER, /*is_runtime=*/ 1, /*can_block=*/ !ENVIRONMENT_IS_WEB, /*default_stacksize=*/ 4194304, /*start_profiling=*/ false);
  PThread.threadInitTLS();
};

Module["__emscripten_init_main_thread_js"] = __emscripten_init_main_thread_js;

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS); else _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

Module["maybeExit"] = maybeExit;

var callUserCallback = func => {
  if (ABORT) {
    err("user callback triggered after runtime exited or application aborted.  Ignoring.");
    return;
  }
  try {
    func();
    maybeExit();
  } catch (e) {
    handleException(e);
  }
};

Module["callUserCallback"] = callUserCallback;

var __emscripten_thread_mailbox_await = pthread_ptr => {
  if (typeof Atomics.waitAsync === "function") {
    var wait = Atomics.waitAsync(GROWABLE_HEAP_I32(), ((pthread_ptr) >> 2), pthread_ptr);
    assert(wait.async);
    wait.value.then(checkMailbox);
    var waitingAsync = pthread_ptr + 128;
    Atomics.store(GROWABLE_HEAP_I32(), ((waitingAsync) >> 2), 1);
  }
};

Module["__emscripten_thread_mailbox_await"] = __emscripten_thread_mailbox_await;

var checkMailbox = () => {
  var pthread_ptr = _pthread_self();
  if (pthread_ptr) {
    __emscripten_thread_mailbox_await(pthread_ptr);
    callUserCallback(__emscripten_check_mailbox);
  }
};

Module["checkMailbox"] = checkMailbox;

var __emscripten_notify_mailbox_postmessage = (targetThreadId, currThreadId, mainThreadId) => {
  if (targetThreadId == currThreadId) {
    setTimeout(checkMailbox);
  } else if (ENVIRONMENT_IS_PTHREAD) {
    postMessage({
      "targetThread": targetThreadId,
      "cmd": "checkMailbox"
    });
  } else {
    var worker = PThread.pthreads[targetThreadId];
    if (!worker) {
      err(`Cannot send message to thread with ID ${targetThreadId}, unknown thread ID!`);
      return;
    }
    worker.postMessage({
      "cmd": "checkMailbox"
    });
  }
};

Module["__emscripten_notify_mailbox_postmessage"] = __emscripten_notify_mailbox_postmessage;

var proxiedJSCallArgs = [];

Module["proxiedJSCallArgs"] = proxiedJSCallArgs;

var __emscripten_receive_on_main_thread_js = (funcIndex, emAsmAddr, callingThread, numCallArgs, args) => {
  numCallArgs /= 2;
  proxiedJSCallArgs.length = numCallArgs;
  var b = ((args) >> 3);
  for (var i = 0; i < numCallArgs; i++) {
    if (HEAP64[b + 2 * i]) {
      proxiedJSCallArgs[i] = HEAP64[b + 2 * i + 1];
    } else {
      proxiedJSCallArgs[i] = GROWABLE_HEAP_F64()[b + 2 * i + 1];
    }
  }
  assert(!emAsmAddr);
  var func = proxiedFunctionTable[funcIndex];
  assert(!(funcIndex && emAsmAddr));
  assert(func.length == numCallArgs, "Call args mismatch in _emscripten_receive_on_main_thread_js");
  PThread.currentProxiedOperationCallerThread = callingThread;
  var rtn = func(...proxiedJSCallArgs);
  PThread.currentProxiedOperationCallerThread = 0;
  assert(typeof rtn != "bigint");
  return rtn;
};

Module["__emscripten_receive_on_main_thread_js"] = __emscripten_receive_on_main_thread_js;

var __emscripten_thread_cleanup = thread => {
  if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
    "cmd": "cleanupThread",
    "thread": thread
  });
};

Module["__emscripten_thread_cleanup"] = __emscripten_thread_cleanup;

var __emscripten_thread_set_strongref = thread => {};

Module["__emscripten_thread_set_strongref"] = __emscripten_thread_set_strongref;

function __gmtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  GROWABLE_HEAP_I32()[((tmPtr) >> 2)] = date.getUTCSeconds();
  GROWABLE_HEAP_I32()[(((tmPtr) + (4)) >> 2)] = date.getUTCMinutes();
  GROWABLE_HEAP_I32()[(((tmPtr) + (8)) >> 2)] = date.getUTCHours();
  GROWABLE_HEAP_I32()[(((tmPtr) + (12)) >> 2)] = date.getUTCDate();
  GROWABLE_HEAP_I32()[(((tmPtr) + (16)) >> 2)] = date.getUTCMonth();
  GROWABLE_HEAP_I32()[(((tmPtr) + (20)) >> 2)] = date.getUTCFullYear() - 1900;
  GROWABLE_HEAP_I32()[(((tmPtr) + (24)) >> 2)] = date.getUTCDay();
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  GROWABLE_HEAP_I32()[(((tmPtr) + (28)) >> 2)] = yday;
}

Module["__gmtime_js"] = __gmtime_js;

var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

Module["isLeapYear"] = isLeapYear;

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

Module["MONTH_DAYS_LEAP_CUMULATIVE"] = MONTH_DAYS_LEAP_CUMULATIVE;

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

Module["MONTH_DAYS_REGULAR_CUMULATIVE"] = MONTH_DAYS_REGULAR_CUMULATIVE;

var ydayFromDate = date => {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  return yday;
};

Module["ydayFromDate"] = ydayFromDate;

function __localtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  GROWABLE_HEAP_I32()[((tmPtr) >> 2)] = date.getSeconds();
  GROWABLE_HEAP_I32()[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
  GROWABLE_HEAP_I32()[(((tmPtr) + (8)) >> 2)] = date.getHours();
  GROWABLE_HEAP_I32()[(((tmPtr) + (12)) >> 2)] = date.getDate();
  GROWABLE_HEAP_I32()[(((tmPtr) + (16)) >> 2)] = date.getMonth();
  GROWABLE_HEAP_I32()[(((tmPtr) + (20)) >> 2)] = date.getFullYear() - 1900;
  GROWABLE_HEAP_I32()[(((tmPtr) + (24)) >> 2)] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  GROWABLE_HEAP_I32()[(((tmPtr) + (28)) >> 2)] = yday;
  GROWABLE_HEAP_I32()[(((tmPtr) + (36)) >> 2)] = -(date.getTimezoneOffset() * 60);
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  GROWABLE_HEAP_I32()[(((tmPtr) + (32)) >> 2)] = dst;
}

Module["__localtime_js"] = __localtime_js;

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | (u1 & 1023);
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
};

Module["stringToUTF8Array"] = stringToUTF8Array;

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  return stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);
};

Module["stringToUTF8"] = stringToUTF8;

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};

Module["lengthBytesUTF8"] = lengthBytesUTF8;

var __tzset_js = (timezone, daylight, std_name, dst_name) => {
  var currentYear = (new Date).getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  GROWABLE_HEAP_U32()[((timezone) >> 2)] = stdTimezoneOffset * 60;
  GROWABLE_HEAP_I32()[((daylight) >> 2)] = Number(winterOffset != summerOffset);
  var extractZone = date => date.toLocaleTimeString(undefined, {
    hour12: false,
    timeZoneName: "short"
  }).split(" ")[1];
  var winterName = extractZone(winter);
  var summerName = extractZone(summer);
  assert(winterName);
  assert(summerName);
  assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
  assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
  if (summerOffset < winterOffset) {
    stringToUTF8(winterName, std_name, 17);
    stringToUTF8(summerName, dst_name, 17);
  } else {
    stringToUTF8(winterName, dst_name, 17);
    stringToUTF8(summerName, std_name, 17);
  }
};

Module["__tzset_js"] = __tzset_js;

var __wasmfs_copy_preloaded_file_data = (index, buffer) => GROWABLE_HEAP_U8().set(wasmFSPreloadedFiles[index].fileData, buffer);

Module["__wasmfs_copy_preloaded_file_data"] = __wasmfs_copy_preloaded_file_data;

var wasmFSPreloadedDirs = [];

Module["wasmFSPreloadedDirs"] = wasmFSPreloadedDirs;

var __wasmfs_get_num_preloaded_dirs = () => wasmFSPreloadedDirs.length;

Module["__wasmfs_get_num_preloaded_dirs"] = __wasmfs_get_num_preloaded_dirs;

var wasmFSPreloadedFiles = [];

Module["wasmFSPreloadedFiles"] = wasmFSPreloadedFiles;

var wasmFSPreloadingFlushed = false;

Module["wasmFSPreloadingFlushed"] = wasmFSPreloadingFlushed;

var __wasmfs_get_num_preloaded_files = () => {
  wasmFSPreloadingFlushed = true;
  return wasmFSPreloadedFiles.length;
};

Module["__wasmfs_get_num_preloaded_files"] = __wasmfs_get_num_preloaded_files;

var __wasmfs_get_preloaded_child_path = (index, childNameBuffer) => {
  var s = wasmFSPreloadedDirs[index].childName;
  var len = lengthBytesUTF8(s) + 1;
  stringToUTF8(s, childNameBuffer, len);
};

Module["__wasmfs_get_preloaded_child_path"] = __wasmfs_get_preloaded_child_path;

var __wasmfs_get_preloaded_file_mode = index => wasmFSPreloadedFiles[index].mode;

Module["__wasmfs_get_preloaded_file_mode"] = __wasmfs_get_preloaded_file_mode;

var __wasmfs_get_preloaded_file_size = index => wasmFSPreloadedFiles[index].fileData.length;

Module["__wasmfs_get_preloaded_file_size"] = __wasmfs_get_preloaded_file_size;

var __wasmfs_get_preloaded_parent_path = (index, parentPathBuffer) => {
  var s = wasmFSPreloadedDirs[index].parentPath;
  var len = lengthBytesUTF8(s) + 1;
  stringToUTF8(s, parentPathBuffer, len);
};

Module["__wasmfs_get_preloaded_parent_path"] = __wasmfs_get_preloaded_parent_path;

var __wasmfs_get_preloaded_path_name = (index, fileNameBuffer) => {
  var s = wasmFSPreloadedFiles[index].pathName;
  var len = lengthBytesUTF8(s) + 1;
  stringToUTF8(s, fileNameBuffer, len);
};

Module["__wasmfs_get_preloaded_path_name"] = __wasmfs_get_preloaded_path_name;

class HandleAllocator {
  constructor() {
    this.allocated = [ undefined ];
    this.freelist = [];
  }
  get(id) {
    assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
    return this.allocated[id];
  }
  has(id) {
    return this.allocated[id] !== undefined;
  }
  allocate(handle) {
    var id = this.freelist.pop() || this.allocated.length;
    this.allocated[id] = handle;
    return id;
  }
  free(id) {
    assert(this.allocated[id] !== undefined);
    this.allocated[id] = undefined;
    this.freelist.push(id);
  }
}

Module["HandleAllocator"] = HandleAllocator;

var wasmfsOPFSAccessHandles = new HandleAllocator;

Module["wasmfsOPFSAccessHandles"] = wasmfsOPFSAccessHandles;

var wasmfsOPFSProxyFinish = ctx => {
  _emscripten_proxy_finish(ctx);
};

Module["wasmfsOPFSProxyFinish"] = wasmfsOPFSProxyFinish;

async function __wasmfs_opfs_close_access(ctx, accessID, errPtr) {
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  try {
    await accessHandle.close();
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSAccessHandles.free(accessID);
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_close_access"] = __wasmfs_opfs_close_access;

var wasmfsOPFSBlobs = new HandleAllocator;

Module["wasmfsOPFSBlobs"] = wasmfsOPFSBlobs;

var __wasmfs_opfs_close_blob = blobID => {
  wasmfsOPFSBlobs.free(blobID);
};

Module["__wasmfs_opfs_close_blob"] = __wasmfs_opfs_close_blob;

async function __wasmfs_opfs_flush_access(ctx, accessID, errPtr) {
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  try {
    await accessHandle.flush();
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_flush_access"] = __wasmfs_opfs_flush_access;

var wasmfsOPFSDirectoryHandles = new HandleAllocator;

Module["wasmfsOPFSDirectoryHandles"] = wasmfsOPFSDirectoryHandles;

var __wasmfs_opfs_free_directory = dirID => {
  wasmfsOPFSDirectoryHandles.free(dirID);
};

Module["__wasmfs_opfs_free_directory"] = __wasmfs_opfs_free_directory;

var wasmfsOPFSFileHandles = new HandleAllocator;

Module["wasmfsOPFSFileHandles"] = wasmfsOPFSFileHandles;

var __wasmfs_opfs_free_file = fileID => {
  wasmfsOPFSFileHandles.free(fileID);
};

Module["__wasmfs_opfs_free_file"] = __wasmfs_opfs_free_file;

async function wasmfsOPFSGetOrCreateFile(parent, name, create) {
  let parentHandle = wasmfsOPFSDirectoryHandles.get(parent);
  let fileHandle;
  try {
    fileHandle = await parentHandle.getFileHandle(name, {
      create: create
    });
  } catch (e) {
    if (e.name === "NotFoundError") {
      return -20;
    }
    if (e.name === "TypeMismatchError") {
      return -31;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
  return wasmfsOPFSFileHandles.allocate(fileHandle);
}

Module["wasmfsOPFSGetOrCreateFile"] = wasmfsOPFSGetOrCreateFile;

async function wasmfsOPFSGetOrCreateDir(parent, name, create) {
  let parentHandle = wasmfsOPFSDirectoryHandles.get(parent);
  let childHandle;
  try {
    childHandle = await parentHandle.getDirectoryHandle(name, {
      create: create
    });
  } catch (e) {
    if (e.name === "NotFoundError") {
      return -20;
    }
    if (e.name === "TypeMismatchError") {
      return -54;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
  return wasmfsOPFSDirectoryHandles.allocate(childHandle);
}

Module["wasmfsOPFSGetOrCreateDir"] = wasmfsOPFSGetOrCreateDir;

async function __wasmfs_opfs_get_child(ctx, parent, namePtr, childTypePtr, childIDPtr) {
  let name = UTF8ToString(namePtr);
  let childType = 1;
  let childID = await wasmfsOPFSGetOrCreateFile(parent, name, false);
  if (childID == -31) {
    childType = 2;
    childID = await wasmfsOPFSGetOrCreateDir(parent, name, false);
  }
  GROWABLE_HEAP_I32()[((childTypePtr) >> 2)] = childType;
  GROWABLE_HEAP_I32()[((childIDPtr) >> 2)] = childID;
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_get_child"] = __wasmfs_opfs_get_child;

async function __wasmfs_opfs_get_entries(ctx, dirID, entriesPtr, errPtr) {
  let dirHandle = wasmfsOPFSDirectoryHandles.get(dirID);
  try {
    let iter = dirHandle.entries();
    for (let entry; entry = await iter.next(), !entry.done; ) {
      let [name, child] = entry.value;
      let sp = stackSave();
      let namePtr = stringToUTF8OnStack(name);
      let type = child.kind == "file" ? 1 : 2;
      __wasmfs_opfs_record_entry(entriesPtr, namePtr, type);
      stackRestore(sp);
    }
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_get_entries"] = __wasmfs_opfs_get_entries;

async function __wasmfs_opfs_get_size_access(ctx, accessID, sizePtr) {
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  let size;
  try {
    size = await accessHandle.getSize();
  } catch {
    size = -29;
  }
  HEAP64[((sizePtr) >> 3)] = BigInt(size);
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_get_size_access"] = __wasmfs_opfs_get_size_access;

var __wasmfs_opfs_get_size_blob = blobID => wasmfsOPFSBlobs.get(blobID).size;

Module["__wasmfs_opfs_get_size_blob"] = __wasmfs_opfs_get_size_blob;

async function __wasmfs_opfs_get_size_file(ctx, fileID, sizePtr) {
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let size;
  try {
    size = (await fileHandle.getFile()).size;
  } catch {
    size = -29;
  }
  HEAP64[((sizePtr) >> 3)] = BigInt(size);
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_get_size_file"] = __wasmfs_opfs_get_size_file;

async function __wasmfs_opfs_init_root_directory(ctx) {
  if (wasmfsOPFSDirectoryHandles.allocated.length == 1) {
    /** @suppress {checkTypes} */ let root = await navigator.storage.getDirectory();
    wasmfsOPFSDirectoryHandles.allocated.push(root);
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_init_root_directory"] = __wasmfs_opfs_init_root_directory;

async function __wasmfs_opfs_insert_directory(ctx, parent, namePtr, childIDPtr) {
  let name = UTF8ToString(namePtr);
  let childID = await wasmfsOPFSGetOrCreateDir(parent, name, true);
  GROWABLE_HEAP_I32()[((childIDPtr) >> 2)] = childID;
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_insert_directory"] = __wasmfs_opfs_insert_directory;

async function __wasmfs_opfs_insert_file(ctx, parent, namePtr, childIDPtr) {
  let name = UTF8ToString(namePtr);
  let childID = await wasmfsOPFSGetOrCreateFile(parent, name, true);
  GROWABLE_HEAP_I32()[((childIDPtr) >> 2)] = childID;
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_insert_file"] = __wasmfs_opfs_insert_file;

async function __wasmfs_opfs_move_file(ctx, fileID, newParentID, namePtr, errPtr) {
  let name = UTF8ToString(namePtr);
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let newDirHandle = wasmfsOPFSDirectoryHandles.get(newParentID);
  try {
    await fileHandle.move(newDirHandle, name);
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_move_file"] = __wasmfs_opfs_move_file;

async function __wasmfs_opfs_open_access(ctx, fileID, accessIDPtr) {
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let accessID;
  try {
    let accessHandle;
    /** @suppress {checkTypes} */ var len = FileSystemFileHandle.prototype.createSyncAccessHandle.length;
    if (len == 0) {
      accessHandle = await fileHandle.createSyncAccessHandle();
    } else {
      accessHandle = await fileHandle.createSyncAccessHandle({
        mode: "in-place"
      });
    }
    accessID = wasmfsOPFSAccessHandles.allocate(accessHandle);
  } catch (e) {
    if (e.name === "InvalidStateError" || e.name === "NoModificationAllowedError") {
      accessID = -2;
    } else {
      err("unexpected error:", e, e.stack);
      accessID = -29;
    }
  }
  GROWABLE_HEAP_I32()[((accessIDPtr) >> 2)] = accessID;
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_open_access"] = __wasmfs_opfs_open_access;

async function __wasmfs_opfs_open_blob(ctx, fileID, blobIDPtr) {
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let blobID;
  try {
    let blob = await fileHandle.getFile();
    blobID = wasmfsOPFSBlobs.allocate(blob);
  } catch (e) {
    if (e.name === "NotAllowedError") {
      blobID = -2;
    } else {
      err("unexpected error:", e, e.stack);
      blobID = -29;
    }
  }
  GROWABLE_HEAP_I32()[((blobIDPtr) >> 2)] = blobID;
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_open_blob"] = __wasmfs_opfs_open_blob;

function __wasmfs_opfs_read_access(accessID, bufPtr, len, pos) {
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  let data = GROWABLE_HEAP_U8().subarray(bufPtr, bufPtr + len);
  try {
    return accessHandle.read(data, {
      at: pos
    });
  } catch (e) {
    if (e.name == "TypeError") {
      return -28;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
}

Module["__wasmfs_opfs_read_access"] = __wasmfs_opfs_read_access;

async function __wasmfs_opfs_read_blob(ctx, blobID, bufPtr, len, pos, nreadPtr) {
  let blob = wasmfsOPFSBlobs.get(blobID);
  let slice = blob.slice(pos, pos + len);
  let nread = 0;
  try {
    let buf = await slice.arrayBuffer();
    let data = new Uint8Array(buf);
    GROWABLE_HEAP_U8().set(data, bufPtr);
    nread += data.length;
  } catch (e) {
    if (e instanceof RangeError) {
      nread = -21;
    } else {
      err("unexpected error:", e, e.stack);
      nread = -29;
    }
  }
  GROWABLE_HEAP_I32()[((nreadPtr) >> 2)] = nread;
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_read_blob"] = __wasmfs_opfs_read_blob;

async function __wasmfs_opfs_remove_child(ctx, dirID, namePtr, errPtr) {
  let name = UTF8ToString(namePtr);
  let dirHandle = wasmfsOPFSDirectoryHandles.get(dirID);
  try {
    await dirHandle.removeEntry(name);
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_remove_child"] = __wasmfs_opfs_remove_child;

async function __wasmfs_opfs_set_size_access(ctx, accessID, size, errPtr) {
  size = bigintToI53Checked(size);
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  try {
    await accessHandle.truncate(size);
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_set_size_access"] = __wasmfs_opfs_set_size_access;

async function __wasmfs_opfs_set_size_file(ctx, fileID, size, errPtr) {
  size = bigintToI53Checked(size);
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  try {
    let writable = await fileHandle.createWritable({
      keepExistingData: true
    });
    await writable.truncate(size);
    await writable.close();
  } catch {
    let err = -29;
    GROWABLE_HEAP_I32()[((errPtr) >> 2)] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

Module["__wasmfs_opfs_set_size_file"] = __wasmfs_opfs_set_size_file;

function __wasmfs_opfs_write_access(accessID, bufPtr, len, pos) {
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  let data = GROWABLE_HEAP_U8().subarray(bufPtr, bufPtr + len);
  try {
    return accessHandle.write(data, {
      at: pos
    });
  } catch (e) {
    if (e.name == "TypeError") {
      return -28;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
}

Module["__wasmfs_opfs_write_access"] = __wasmfs_opfs_write_access;

var FS_stdin_getChar_buffer = [];

Module["FS_stdin_getChar_buffer"] = FS_stdin_getChar_buffer;

/** @type {function(string, boolean=, number=)} */ function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

Module["intArrayFromString"] = intArrayFromString;

var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (typeof window != "undefined" && typeof window.prompt == "function") {
      result = window.prompt("Input: ");
      if (result !== null) {
        result += "\n";
      }
    } else {}
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};

Module["FS_stdin_getChar"] = FS_stdin_getChar;

var __wasmfs_stdin_get_char = () => {
  var c = FS_stdin_getChar();
  if (typeof c === "number") {
    return c;
  }
  return -1;
};

Module["__wasmfs_stdin_get_char"] = __wasmfs_stdin_get_char;

var __wasmfs_thread_utils_heartbeat = queue => {
  var intervalID = setInterval(() => {
    if (ABORT) {
      clearInterval(intervalID);
    } else {
      _emscripten_proxy_execute_queue(queue);
    }
  }, 50);
};

Module["__wasmfs_thread_utils_heartbeat"] = __wasmfs_thread_utils_heartbeat;

var _emscripten_check_blocking_allowed = () => {
  if (ENVIRONMENT_IS_WORKER) return;
  warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");
};

Module["_emscripten_check_blocking_allowed"] = _emscripten_check_blocking_allowed;

var _emscripten_date_now = () => Date.now();

Module["_emscripten_date_now"] = _emscripten_date_now;

var _emscripten_err = str => err(UTF8ToString(str));

Module["_emscripten_err"] = _emscripten_err;

var _emscripten_exit_with_live_runtime = () => {
  runtimeKeepalivePush();
  throw "unwind";
};

Module["_emscripten_exit_with_live_runtime"] = _emscripten_exit_with_live_runtime;

var getHeapMax = () =>  805306368;

Module["getHeapMax"] = getHeapMax;

var _emscripten_get_heap_max = () => getHeapMax();

Module["_emscripten_get_heap_max"] = _emscripten_get_heap_max;

var _emscripten_get_now;

_emscripten_get_now = () => performance.timeOrigin + performance.now();

Module["_emscripten_get_now"] = _emscripten_get_now;

var _emscripten_has_asyncify = () => 0;

Module["_emscripten_has_asyncify"] = _emscripten_has_asyncify;

var _emscripten_num_logical_cores = () => navigator["hardwareConcurrency"];

Module["_emscripten_num_logical_cores"] = _emscripten_num_logical_cores;

var _emscripten_out = str => out(UTF8ToString(str));

Module["_emscripten_out"] = _emscripten_out;

var growMemory = size => {
  var b = wasmMemory.buffer;
  var pages = (size - b.byteLength + 65535) / 65536;
  try {
    wasmMemory.grow(pages);
    updateMemoryViews();
    return 1;
  } /*success*/ catch (e) {
    err(`growMemory: Attempted to grow heap from ${b.byteLength} bytes to ${size} bytes, but got error: ${e}`);
  }
};

Module["growMemory"] = growMemory;

var _emscripten_resize_heap = requestedSize => {
  var oldSize = GROWABLE_HEAP_U8().length;
  requestedSize >>>= 0;
  if (requestedSize <= oldSize) {
    return false;
  }
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
    return false;
  }
  var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
  return false;
};

Module["_emscripten_resize_heap"] = _emscripten_resize_heap;

var _emscripten_runtime_keepalive_check = keepRuntimeAlive;

Module["_emscripten_runtime_keepalive_check"] = _emscripten_runtime_keepalive_check;

var _emscripten_unwind_to_js_event_loop = () => {
  throw "unwind";
};

Module["_emscripten_unwind_to_js_event_loop"] = _emscripten_unwind_to_js_event_loop;

var webSockets = new HandleAllocator;

Module["webSockets"] = webSockets;

var WS = {
  socketEvent: null,
  getSocket(socketId) {
    if (!webSockets.has(socketId)) {
      return 0;
    }
    return webSockets.get(socketId);
  },
  getSocketEvent(socketId) {
    this.socketEvent ||= _malloc(524);
    GROWABLE_HEAP_U32()[((this.socketEvent) >> 2)] = socketId;
    return this.socketEvent;
  }
};

Module["WS"] = WS;

function _emscripten_websocket_close(socketId, code, reason) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 0, 1, socketId, code, reason);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  var reasonStr = reason ? UTF8ToString(reason) : undefined;
  if (reason) socket.close(code || undefined, UTF8ToString(reason)); else if (code) socket.close(code); else socket.close();
  return 0;
}

Module["_emscripten_websocket_close"] = _emscripten_websocket_close;

function _emscripten_websocket_delete(socketId) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 0, 1, socketId);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  socket.onopen = socket.onerror = socket.onclose = socket.onmessage = null;
  webSockets.free(socketId);
  return 0;
}

Module["_emscripten_websocket_delete"] = _emscripten_websocket_delete;

function _emscripten_websocket_new(createAttributes) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 0, 1, createAttributes);
  if (typeof WebSocket == "undefined") {
    return -1;
  }
  if (!createAttributes) {
    return -5;
  }
  var url = UTF8ToString(GROWABLE_HEAP_U32()[((createAttributes) >> 2)]);
  var protocols = GROWABLE_HEAP_U32()[(((createAttributes) + (4)) >> 2)];
  var socket = protocols ? new WebSocket(url, UTF8ToString(protocols).split(",")) : new WebSocket(url);
  socket.binaryType = "arraybuffer";
  var socketId = webSockets.allocate(socket);
  return socketId;
}

Module["_emscripten_websocket_new"] = _emscripten_websocket_new;

function _emscripten_websocket_send_binary(socketId, binaryData, dataLength) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1, socketId, binaryData, dataLength);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  socket.send(new Uint8Array(GROWABLE_HEAP_U8().subarray((binaryData), binaryData + dataLength)));
  return 0;
}

Module["_emscripten_websocket_send_binary"] = _emscripten_websocket_send_binary;

function _emscripten_websocket_set_onclose_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 0, 1, socketId, userData, callbackFunc, thread);
  var eventPtr = WS.getSocketEvent(socketId);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  socket.onclose = function(e) {
    GROWABLE_HEAP_I32()[(((eventPtr) + (4)) >> 2)] = e.wasClean, GROWABLE_HEAP_I16()[(((eventPtr) + (4)) >> 1)] = e.code, 
    stringToUTF8(e.reason, eventPtr + 10, 512);
    getWasmTableEntry(callbackFunc)(0, /*TODO*/ eventPtr, userData);
  };
  return 0;
}

Module["_emscripten_websocket_set_onclose_callback_on_thread"] = _emscripten_websocket_set_onclose_callback_on_thread;

function _emscripten_websocket_set_onerror_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 0, 1, socketId, userData, callbackFunc, thread);
  var eventPtr = WS.getSocketEvent(socketId);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  socket.onerror = function(e) {
    getWasmTableEntry(callbackFunc)(0, /*TODO*/ eventPtr, userData);
  };
  return 0;
}

Module["_emscripten_websocket_set_onerror_callback_on_thread"] = _emscripten_websocket_set_onerror_callback_on_thread;

var stringToNewUTF8 = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8(str, ret, size);
  return ret;
};

Module["stringToNewUTF8"] = stringToNewUTF8;

function _emscripten_websocket_set_onmessage_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 0, 1, socketId, userData, callbackFunc, thread);
  var eventPtr = WS.getSocketEvent(socketId);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  socket.onmessage = function(e) {
    var isText = typeof e.data == "string";
    if (isText) {
      var buf = stringToNewUTF8(e.data);
      var len = lengthBytesUTF8(e.data) + 1;
    } else {
      var len = e.data.byteLength;
      var buf = _malloc(len);
      GROWABLE_HEAP_I8().set(new Uint8Array(e.data), buf);
    }
    GROWABLE_HEAP_U32()[(((eventPtr) + (4)) >> 2)] = buf, GROWABLE_HEAP_I32()[(((eventPtr) + (8)) >> 2)] = len, 
    GROWABLE_HEAP_I32()[(((eventPtr) + (12)) >> 2)] = isText, getWasmTableEntry(callbackFunc)(0, /*TODO*/ eventPtr, userData);
    _free(buf);
  };
  return 0;
}

Module["_emscripten_websocket_set_onmessage_callback_on_thread"] = _emscripten_websocket_set_onmessage_callback_on_thread;

function _emscripten_websocket_set_onopen_callback_on_thread(socketId, userData, callbackFunc, thread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, socketId, userData, callbackFunc, thread);
  var eventPtr = WS.getSocketEvent(socketId);
  var socket = WS.getSocket(socketId);
  if (!socket) {
    return -3;
  }
  socket.onopen = function(e) {
    getWasmTableEntry(callbackFunc)(0, /*TODO*/ eventPtr, userData);
  };
  return 0;
}

Module["_emscripten_websocket_set_onopen_callback_on_thread"] = _emscripten_websocket_set_onopen_callback_on_thread;

var ENV = {};

Module["ENV"] = ENV;

var getExecutableName = () => thisProgram || "./this.program";

Module["getExecutableName"] = getExecutableName;

var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    var lang = ((typeof navigator == "object" && navigator.languages && navigator.languages[0]) || "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    for (var x in ENV) {
      if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};

Module["getEnvStrings"] = getEnvStrings;

var stringToAscii = (str, buffer) => {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === (str.charCodeAt(i) & 255));
    GROWABLE_HEAP_I8()[buffer++] = str.charCodeAt(i);
  }
  GROWABLE_HEAP_I8()[buffer] = 0;
};

Module["stringToAscii"] = stringToAscii;

var _environ_get = function(__environ, environ_buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 0, 1, __environ, environ_buf);
  var bufSize = 0;
  getEnvStrings().forEach((string, i) => {
    var ptr = environ_buf + bufSize;
    GROWABLE_HEAP_U32()[(((__environ) + (i * 4)) >> 2)] = ptr;
    stringToAscii(string, ptr);
    bufSize += string.length + 1;
  });
  return 0;
};

Module["_environ_get"] = _environ_get;

var _environ_sizes_get = function(penviron_count, penviron_buf_size) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 0, 1, penviron_count, penviron_buf_size);
  var strings = getEnvStrings();
  GROWABLE_HEAP_U32()[((penviron_count) >> 2)] = strings.length;
  var bufSize = 0;
  strings.forEach(string => bufSize += string.length + 1);
  GROWABLE_HEAP_U32()[((penviron_buf_size) >> 2)] = bufSize;
  return 0;
};

Module["_environ_sizes_get"] = _environ_sizes_get;

var initRandomFill = () => {
  if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
    return view => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 
    view);
  } else  abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: (array) => { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };");
};

Module["initRandomFill"] = initRandomFill;

var randomFill = view => (randomFill = initRandomFill())(view);

Module["randomFill"] = randomFill;

var _getentropy = (buffer, size) => {
  randomFill(GROWABLE_HEAP_U8().subarray(buffer, buffer + size));
  return 0;
};

Module["_getentropy"] = _getentropy;

var _llvm_eh_typeid_for = type => type;

Module["_llvm_eh_typeid_for"] = _llvm_eh_typeid_for;

var VIRTUALSTATE = {
  dataChannelsMap: {},
  nextId: 1,
  getId: function() {
    var ret = VIRTUALSTATE.nextId++;
    if (VIRTUALSTATE.nextId > 1e9) VIRTUALSTATE.nextId = 1;
    return ret;
  },
  getPromise: function(id) {
    var p = new Promise((resolve, reject) => {
      if (VIRTUALSTATE[id]) {
        VIRTUALSTATE[id].reject();
      }
      VIRTUALSTATE[id] = {
        resolve: resolve,
        reject: reject
      };
    });
    return p;
  },
  resolvePromise: function(id, json) {
    if (VIRTUALSTATE[id]) {
      VIRTUALSTATE[id].resolve(json);
      delete VIRTUALSTATE[id];
    }
  }
};

Module["VIRTUALSTATE"] = VIRTUALSTATE;

function virtual_get(url) {
  var id = VIRTUALSTATE.getId();
  Module._virtual_get_request(id, stringToNewUTF8(url));
  return VIRTUALSTATE.getPromise(id);
}

Module["virtual_get"] = virtual_get;

function virtual_post(url, postdata) {
  var id = VIRTUALSTATE.postId();
  Module._virtual_post_request(id, stringToNewUTF8(url), stringToNewUTF8(postdata));
  return VIRTUALSTATE.getPromise(id);
}

Module["virtual_post"] = virtual_post;

function _onAPIResult(id, json) {
  VIRTUALSTATE.resolvePromise(id, JSON.parse(UTF8ToString(json)));
}

Module["_onAPIResult"] = _onAPIResult;

var _onChain = json => {
  if (typeof Module["onChain"] == "function") {
    Module["onChain"](JSON.parse(UTF8ToString(json)));
  }
};

Module["_onChain"] = _onChain;

var _onConnect = json => {
  if (typeof Module["onConnect"] == "function") {
    Module["onConnect"](JSON.parse(UTF8ToString(json)));
  }
};

Module["_onConnect"] = _onConnect;

var _onDisconnect = json => {
  if (typeof Module["onDisconnect"] == "function") {
    Module["onDisconnect"](JSON.parse(UTF8ToString(json)));
  }
};

Module["_onDisconnect"] = _onDisconnect;

var _onMempoolAdd = json => {
  if (typeof Module["onMempoolAdd"] == "function") {
    Module["onMempoolAdd"](JSON.parse(UTF8ToString(json)));
  }
};

Module["_onMempoolAdd"] = _onMempoolAdd;

var _onMempoolErase = json => {
  if (typeof Module["onMempoolErase"] == "function") {
    Module["onMempoolErase"](JSON.parse(UTF8ToString(json)));
  }
};

Module["_onMempoolErase"] = _onMempoolErase;

function stream_control(msg) {
  Module._stream_control(stringToNewUTF8(JSON.stringify(msg)));
}

Module["stream_control"] = stream_control;

var _onStream = json => {
  var f = Module["onStream"];
  if (typeof f == "function") {
    f(JSON.parse(UTF8ToString(json)));
  }
};

Module["_onStream"] = _onStream;

var WEBRTC = {
  peerConnectionsMap: {},
  dataChannelsMap: {},
  nextId: 1,
  allocUTF8FromString: function(str) {
    var strLen = lengthBytesUTF8(str);
    var strOnHeap = _malloc(strLen + 1);
    stringToUTF8(str, strOnHeap, strLen + 1);
    return strOnHeap;
  },
  registerPeerConnection: function(peerConnection) {
    var pc = WEBRTC.nextId++;
    WEBRTC.peerConnectionsMap[pc] = peerConnection;
    peerConnection.onnegotiationneeded = function() {
      peerConnection.createOffer().then(function(offer) {
        return WEBRTC.handleDescription(peerConnection, offer);
      }).catch(function(err) {
        console.error(err);
      });
    };
    peerConnection.onicecandidate = function(evt) {
      if (evt.candidate && evt.candidate.candidate) WEBRTC.handleCandidate(peerConnection, evt.candidate);
    };
    peerConnection.onconnectionstatechange = function() {
      WEBRTC.handleConnectionStateChange(peerConnection, peerConnection.connectionState);
    };
    peerConnection.oniceconnectionstatechange = function() {
      WEBRTC.handleIceStateChange(peerConnection, peerConnection.iceConnectionState);
    };
    peerConnection.onicegatheringstatechange = function() {
      WEBRTC.handleGatheringStateChange(peerConnection, peerConnection.iceGatheringState);
    };
    peerConnection.onsignalingstatechange = function() {
      WEBRTC.handleSignalingStateChange(peerConnection, peerConnection.signalingState);
    };
    return pc;
  },
  registerDataChannel: function(dataChannel) {
    var dc = WEBRTC.nextId++;
    WEBRTC.dataChannelsMap[dc] = dataChannel;
    dataChannel.binaryType = "arraybuffer";
    return dc;
  },
  handleDescription: function(peerConnection, description) {
    return peerConnection.setLocalDescription(description).then(function() {
      if (peerConnection.rtcUserDeleted) return;
      if (!peerConnection.rtcDescriptionCallback) return;
      var desc = peerConnection.localDescription;
      var pSdp = WEBRTC.allocUTF8FromString(desc.sdp);
      var pType = WEBRTC.allocUTF8FromString(desc.type);
      var callback = peerConnection.rtcDescriptionCallback;
      var userPointer = peerConnection.rtcUserPointer || 0;
      getWasmTableEntry(callback)(pSdp, pType, userPointer);
      _free(pSdp);
      _free(pType);
    });
  },
  handleCandidate: function(peerConnection, candidate) {
    if (peerConnection.rtcUserDeleted) return;
    if (!peerConnection.rtcCandidateCallback) return;
    var pCandidate = WEBRTC.allocUTF8FromString(candidate.candidate);
    var pSdpMid = WEBRTC.allocUTF8FromString(candidate.sdpMid);
    var candidateCallback = peerConnection.rtcCandidateCallback;
    var userPointer = peerConnection.rtcUserPointer || 0;
    getWasmTableEntry(candidateCallback)(pCandidate, pSdpMid, userPointer);
    _free(pCandidate);
    _free(pSdpMid);
  },
  handleConnectionStateChange: function(peerConnection, connectionState) {
    if (peerConnection.rtcUserDeleted) return;
    if (!peerConnection.rtcStateChangeCallback) return;
    var map = {
      "new": 0,
      "connecting": 1,
      "connected": 2,
      "disconnected": 3,
      "failed": 4,
      "closed": 5
    };
    if (connectionState in map) {
      var stateChangeCallback = peerConnection.rtcStateChangeCallback;
      var userPointer = peerConnection.rtcUserPointer || 0;
      getWasmTableEntry(stateChangeCallback)(map[connectionState], userPointer);
    }
  },
  handleIceStateChange: function(peerConnection, iceConnectionState) {
    if (peerConnection.rtcUserDeleted) return;
    if (!peerConnection.rtcIceStateChangeCallback) return;
    var map = {
      "new": 0,
      "checking": 1,
      "connected": 2,
      "completed": 3,
      "failed": 4,
      "disconnected": 5,
      "closed": 6
    };
    if (iceConnectionState in map) {
      var iceStateChangeCallback = peerConnection.rtcIceStateChangeCallback;
      var userPointer = peerConnection.rtcUserPointer || 0;
      getWasmTableEntry(iceStateChangeCallback)(map[iceConnectionState], userPointer);
    }
  },
  handleGatheringStateChange: function(peerConnection, iceGatheringState) {
    if (peerConnection.rtcUserDeleted) return;
    if (!peerConnection.rtcGatheringStateChangeCallback) return;
    var map = {
      "new": 0,
      "gathering": 1,
      "complete": 2
    };
    if (iceGatheringState in map) {
      var gatheringStateChangeCallback = peerConnection.rtcGatheringStateChangeCallback;
      var userPointer = peerConnection.rtcUserPointer || 0;
      getWasmTableEntry(gatheringStateChangeCallback)(map[iceGatheringState], userPointer);
    }
  },
  handleSignalingStateChange: function(peerConnection, signalingState) {
    if (peerConnection.rtcUserDeleted) return;
    if (!peerConnection.rtcSignalingStateChangeCallback) return;
    var map = {
      "stable": 0,
      "have-local-offer": 1,
      "have-remote-offer": 2,
      "have-local-pranswer": 3,
      "have-remote-pranswer": 4
    };
    if (signalingState in map) {
      var signalingStateChangeCallback = peerConnection.rtcSignalingStateChangeCallback;
      var userPointer = peerConnection.rtcUserPointer || 0;
      getWasmTableEntry(signalingStateChangeCallback)(map[signalingState], userPointer);
    }
  }
};

Module["WEBRTC"] = WEBRTC;

function _rtcCreateDataChannel(pc, pLabel, unordered, maxRetransmits, maxPacketLifeTime) {
  if (!pc) return 0;
  var label = UTF8ToString(pLabel);
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  var datachannelInit = {
    ordered: !unordered
  };
  if (maxRetransmits >= 0) datachannelInit.maxRetransmits = maxRetransmits; else if (maxPacketLifeTime >= 0) datachannelInit.maxPacketLifeTime = maxPacketLifeTime;
  var channel = peerConnection.createDataChannel(label, datachannelInit);
  return WEBRTC.registerDataChannel(channel);
}

Module["_rtcCreateDataChannel"] = _rtcCreateDataChannel;

function _rtcCreatePeerConnection(pUrls, pUsernames, pPasswords, nIceServers) {
  if (!window.RTCPeerConnection) return 0;
  var iceServers = [];
  for (var i = 0; i < nIceServers; ++i) {
    var heap = Module["HEAPU32"];
    var pUrl = heap[pUrls / heap.BYTES_PER_ELEMENT + i];
    var url = UTF8ToString(pUrl);
    var pUsername = heap[pUsernames / heap.BYTES_PER_ELEMENT + i];
    var username = UTF8ToString(pUsername);
    var pPassword = heap[pPasswords / heap.BYTES_PER_ELEMENT + i];
    var password = UTF8ToString(pPassword);
    if (username == "") {
      iceServers.push({
        urls: [ url ]
      });
    } else {
      iceServers.push({
        urls: [ url ],
        username: username,
        credential: password
      });
    }
  }
  var config = {
    iceServers: iceServers
  };
  return WEBRTC.registerPeerConnection(new RTCPeerConnection(config));
}

Module["_rtcCreatePeerConnection"] = _rtcCreatePeerConnection;

function _rtcDeleteDataChannel(dc) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  if (dataChannel) {
    dataChannel.rtcUserDeleted = true;
    delete WEBRTC.dataChannelsMap[dc];
  }
}

Module["_rtcDeleteDataChannel"] = _rtcDeleteDataChannel;

function _rtcDeletePeerConnection(pc) {
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  if (peerConnection) {
    peerConnection.close();
    peerConnection.rtcUserDeleted = true;
    delete WEBRTC.peerConnectionsMap[pc];
  }
}

Module["_rtcDeletePeerConnection"] = _rtcDeletePeerConnection;

function _rtcGetBufferedAmount(dc) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  return dataChannel.bufferedAmount;
}

Module["_rtcGetBufferedAmount"] = _rtcGetBufferedAmount;

function _rtcGetDataChannelLabel(dc, pBuffer, size) {
  var label = WEBRTC.dataChannelsMap[dc].label;
  stringToUTF8(label, pBuffer, size);
  return lengthBytesUTF8(label);
}

Module["_rtcGetDataChannelLabel"] = _rtcGetDataChannelLabel;

function _rtcGetLocalDescription(pc) {
  if (!pc) return 0;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  var localDescription = peerConnection.localDescription;
  if (!localDescription) return 0;
  var sdp = WEBRTC.allocUTF8FromString(localDescription.sdp);
  return sdp;
}

Module["_rtcGetLocalDescription"] = _rtcGetLocalDescription;

function _rtcGetLocalDescriptionType(pc) {
  if (!pc) return 0;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  var localDescription = peerConnection.localDescription;
  if (!localDescription) return 0;
  var type = WEBRTC.allocUTF8FromString(localDescription.type);
  return type;
}

Module["_rtcGetLocalDescriptionType"] = _rtcGetLocalDescriptionType;

function _rtcSendMessage(dc, pBuffer, size) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  if (dataChannel.readyState != "open") return -1;
  if (size >= 0) {
    var heapBytes = new Uint8Array(Module["HEAPU8"].buffer, pBuffer, size);
    if (heapBytes.buffer instanceof ArrayBuffer) {
      dataChannel.send(heapBytes);
    } else {
      var byteArray = new Uint8Array(new ArrayBuffer(size));
      byteArray.set(heapBytes);
      dataChannel.send(byteArray);
    }
    return size;
  } else {
    var str = UTF8ToString(pBuffer);
    dataChannel.send(str);
    return lengthBytesUTF8(str);
  }
}

Module["_rtcSendMessage"] = _rtcSendMessage;

function _rtcSetBufferedAmountLowCallback(dc, bufferedAmountLowCallback) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  var cb = function(evt) {
    if (dataChannel.rtcUserDeleted) return;
    var userPointer = dataChannel.rtcUserPointer || 0;
    getWasmTableEntry(bufferedAmountLowCallback)(userPointer);
  };
  dataChannel.onbufferedamountlow = cb;
}

Module["_rtcSetBufferedAmountLowCallback"] = _rtcSetBufferedAmountLowCallback;

function _rtcSetBufferedAmountLowThreshold(dc, threshold) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  dataChannel.bufferedAmountLowThreshold = threshold;
}

Module["_rtcSetBufferedAmountLowThreshold"] = _rtcSetBufferedAmountLowThreshold;

function _rtcSetDataChannelCallback(pc, dataChannelCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.ondatachannel = function(evt) {
    if (peerConnection.rtcUserDeleted) return;
    var dc = WEBRTC.registerDataChannel(evt.channel);
    var userPointer = peerConnection.rtcUserPointer || 0;
    getWasmTableEntry(dataChannelCallback)(dc, userPointer);
  };
}

Module["_rtcSetDataChannelCallback"] = _rtcSetDataChannelCallback;

function _rtcSetErrorCallback(dc, errorCallback) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  var cb = function(evt) {
    if (dataChannel.rtcUserDeleted) return;
    var userPointer = dataChannel.rtcUserPointer || 0;
    var pError = evt.message ? WEBRTC.allocUTF8FromString(evt.message) : 0;
    getWasmTableEntry(errorCallback)(pError, userPointer);
    _free(pError);
  };
  dataChannel.onerror = cb;
}

Module["_rtcSetErrorCallback"] = _rtcSetErrorCallback;

function _rtcSetGatheringStateChangeCallback(pc, gatheringStateChangeCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.rtcGatheringStateChangeCallback = gatheringStateChangeCallback;
}

Module["_rtcSetGatheringStateChangeCallback"] = _rtcSetGatheringStateChangeCallback;

function _rtcSetIceStateChangeCallback(pc, iceStateChangeCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.rtcIceStateChangeCallback = iceStateChangeCallback;
}

Module["_rtcSetIceStateChangeCallback"] = _rtcSetIceStateChangeCallback;

function _rtcSetLocalCandidateCallback(pc, candidateCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.rtcCandidateCallback = candidateCallback;
}

Module["_rtcSetLocalCandidateCallback"] = _rtcSetLocalCandidateCallback;

function _rtcSetLocalDescriptionCallback(pc, descriptionCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.rtcDescriptionCallback = descriptionCallback;
}

Module["_rtcSetLocalDescriptionCallback"] = _rtcSetLocalDescriptionCallback;

function _rtcSetMessageCallback(dc, messageCallback) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  dataChannel.onmessage = function(evt) {
    if (dataChannel.rtcUserDeleted) return;
    var userPointer = dataChannel.rtcUserPointer || 0;
    if (typeof evt.data == "string") {
      var pStr = WEBRTC.allocUTF8FromString(evt.data);
      getWasmTableEntry(messageCallback)(pStr, -1, userPointer);
      _free(pStr);
    } else {
      var byteArray = new Uint8Array(evt.data);
      var size = byteArray.length;
      var pBuffer = _malloc(size);
      var heapBytes = new Uint8Array(Module["HEAPU8"].buffer, pBuffer, size);
      heapBytes.set(byteArray);
      getWasmTableEntry(messageCallback)(pBuffer, size, userPointer);
      _free(pBuffer);
    }
  };
  dataChannel.onclose = function() {
    if (dataChannel.rtcUserDeleted) return;
    var userPointer = dataChannel.rtcUserPointer || 0;
    getWasmTableEntry(messageCallback)(0, 0, userPointer);
  };
}

Module["_rtcSetMessageCallback"] = _rtcSetMessageCallback;

function _rtcSetOpenCallback(dc, openCallback) {
  var dataChannel = WEBRTC.dataChannelsMap[dc];
  var cb = function() {
    if (dataChannel.rtcUserDeleted) return;
    var userPointer = dataChannel.rtcUserPointer || 0;
    getWasmTableEntry(openCallback)(userPointer);
  };
  dataChannel.onopen = cb;
  if (dataChannel.readyState == "open") setTimeout(cb, 0);
}

Module["_rtcSetOpenCallback"] = _rtcSetOpenCallback;

function _rtcSetRemoteDescription(pc, pSdp, pType) {
  var description = new RTCSessionDescription({
    sdp: UTF8ToString(pSdp),
    type: UTF8ToString(pType)
  });
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.setRemoteDescription(description).then(function() {
    if (peerConnection.rtcUserDeleted) return;
    if (description.type == "offer") {
      peerConnection.createAnswer().then(function(answer) {
        return WEBRTC.handleDescription(peerConnection, answer);
      }).catch(function(err) {
        console.error(err);
      });
    }
  }).catch(function(err) {
    console.error(err);
  });
}

Module["_rtcSetRemoteDescription"] = _rtcSetRemoteDescription;

function _rtcSetSignalingStateChangeCallback(pc, signalingStateChangeCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.rtcSignalingStateChangeCallback = signalingStateChangeCallback;
}

Module["_rtcSetSignalingStateChangeCallback"] = _rtcSetSignalingStateChangeCallback;

function _rtcSetStateChangeCallback(pc, stateChangeCallback) {
  if (!pc) return;
  var peerConnection = WEBRTC.peerConnectionsMap[pc];
  peerConnection.rtcStateChangeCallback = stateChangeCallback;
}

Module["_rtcSetStateChangeCallback"] = _rtcSetStateChangeCallback;

function _rtcSetUserPointer(i, ptr) {
  if (WEBRTC.peerConnectionsMap[i]) WEBRTC.peerConnectionsMap[i].rtcUserPointer = ptr;
  if (WEBRTC.dataChannelsMap[i]) WEBRTC.dataChannelsMap[i].rtcUserPointer = ptr;
}

Module["_rtcSetUserPointer"] = _rtcSetUserPointer;

var arraySum = (array, index) => {
  var sum = 0;
  for (var i = 0; i <= index; sum += array[i++]) {}
  return sum;
};

Module["arraySum"] = arraySum;

var MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

Module["MONTH_DAYS_LEAP"] = MONTH_DAYS_LEAP;

var MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

Module["MONTH_DAYS_REGULAR"] = MONTH_DAYS_REGULAR;

var addDays = (date, days) => {
  var newDate = new Date(date.getTime());
  while (days > 0) {
    var leap = isLeapYear(newDate.getFullYear());
    var currentMonth = newDate.getMonth();
    var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
    if (days > daysInCurrentMonth - newDate.getDate()) {
      days -= (daysInCurrentMonth - newDate.getDate() + 1);
      newDate.setDate(1);
      if (currentMonth < 11) {
        newDate.setMonth(currentMonth + 1);
      } else {
        newDate.setMonth(0);
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
    } else {
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }
  }
  return newDate;
};

Module["addDays"] = addDays;

var writeArrayToMemory = (array, buffer) => {
  assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
  GROWABLE_HEAP_I8().set(array, buffer);
};

Module["writeArrayToMemory"] = writeArrayToMemory;

var _strftime = (s, maxsize, format, tm) => {
  var tm_zone = GROWABLE_HEAP_U32()[(((tm) + (40)) >> 2)];
  var date = {
    tm_sec: GROWABLE_HEAP_I32()[((tm) >> 2)],
    tm_min: GROWABLE_HEAP_I32()[(((tm) + (4)) >> 2)],
    tm_hour: GROWABLE_HEAP_I32()[(((tm) + (8)) >> 2)],
    tm_mday: GROWABLE_HEAP_I32()[(((tm) + (12)) >> 2)],
    tm_mon: GROWABLE_HEAP_I32()[(((tm) + (16)) >> 2)],
    tm_year: GROWABLE_HEAP_I32()[(((tm) + (20)) >> 2)],
    tm_wday: GROWABLE_HEAP_I32()[(((tm) + (24)) >> 2)],
    tm_yday: GROWABLE_HEAP_I32()[(((tm) + (28)) >> 2)],
    tm_isdst: GROWABLE_HEAP_I32()[(((tm) + (32)) >> 2)],
    tm_gmtoff: GROWABLE_HEAP_I32()[(((tm) + (36)) >> 2)],
    tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
  };
  var pattern = UTF8ToString(format);
  var EXPANSION_RULES_1 = {
    "%c": "%a %b %d %H:%M:%S %Y",
    "%D": "%m/%d/%y",
    "%F": "%Y-%m-%d",
    "%h": "%b",
    "%r": "%I:%M:%S %p",
    "%R": "%H:%M",
    "%T": "%H:%M:%S",
    "%x": "%m/%d/%y",
    "%X": "%H:%M:%S",
    "%Ec": "%c",
    "%EC": "%C",
    "%Ex": "%m/%d/%y",
    "%EX": "%H:%M:%S",
    "%Ey": "%y",
    "%EY": "%Y",
    "%Od": "%d",
    "%Oe": "%e",
    "%OH": "%H",
    "%OI": "%I",
    "%Om": "%m",
    "%OM": "%M",
    "%OS": "%S",
    "%Ou": "%u",
    "%OU": "%U",
    "%OV": "%V",
    "%Ow": "%w",
    "%OW": "%W",
    "%Oy": "%y"
  };
  for (var rule in EXPANSION_RULES_1) {
    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
  }
  var WEEKDAYS = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
  var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
  function leadingSomething(value, digits, character) {
    var str = typeof value == "number" ? value.toString() : (value || "");
    while (str.length < digits) {
      str = character[0] + str;
    }
    return str;
  }
  function leadingNulls(value, digits) {
    return leadingSomething(value, digits, "0");
  }
  function compareByDay(date1, date2) {
    function sgn(value) {
      return value < 0 ? -1 : (value > 0 ? 1 : 0);
    }
    var compare;
    if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
      if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
        compare = sgn(date1.getDate() - date2.getDate());
      }
    }
    return compare;
  }
  function getFirstWeekStartDate(janFourth) {
    switch (janFourth.getDay()) {
     case 0:
      return new Date(janFourth.getFullYear() - 1, 11, 29);

     case 1:
      return janFourth;

     case 2:
      return new Date(janFourth.getFullYear(), 0, 3);

     case 3:
      return new Date(janFourth.getFullYear(), 0, 2);

     case 4:
      return new Date(janFourth.getFullYear(), 0, 1);

     case 5:
      return new Date(janFourth.getFullYear() - 1, 11, 31);

     case 6:
      return new Date(janFourth.getFullYear() - 1, 11, 30);
    }
  }
  function getWeekBasedYear(date) {
    var thisDate = addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
    var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
    var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
    if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
      if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
        return thisDate.getFullYear() + 1;
      }
      return thisDate.getFullYear();
    }
    return thisDate.getFullYear() - 1;
  }
  var EXPANSION_RULES_2 = {
    "%a": date => WEEKDAYS[date.tm_wday].substring(0, 3),
    "%A": date => WEEKDAYS[date.tm_wday],
    "%b": date => MONTHS[date.tm_mon].substring(0, 3),
    "%B": date => MONTHS[date.tm_mon],
    "%C": date => {
      var year = date.tm_year + 1900;
      return leadingNulls((year / 100) | 0, 2);
    },
    "%d": date => leadingNulls(date.tm_mday, 2),
    "%e": date => leadingSomething(date.tm_mday, 2, " "),
    "%g": date => getWeekBasedYear(date).toString().substring(2),
    "%G": getWeekBasedYear,
    "%H": date => leadingNulls(date.tm_hour, 2),
    "%I": date => {
      var twelveHour = date.tm_hour;
      if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
      return leadingNulls(twelveHour, 2);
    },
    "%j": date => leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon - 1), 3),
    "%m": date => leadingNulls(date.tm_mon + 1, 2),
    "%M": date => leadingNulls(date.tm_min, 2),
    "%n": () => "\n",
    "%p": date => {
      if (date.tm_hour >= 0 && date.tm_hour < 12) {
        return "AM";
      }
      return "PM";
    },
    "%S": date => leadingNulls(date.tm_sec, 2),
    "%t": () => "\t",
    "%u": date => date.tm_wday || 7,
    "%U": date => {
      var days = date.tm_yday + 7 - date.tm_wday;
      return leadingNulls(Math.floor(days / 7), 2);
    },
    "%V": date => {
      var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
      if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
        val++;
      }
      if (!val) {
        val = 52;
        var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
        if (dec31 == 4 || (dec31 == 5 && isLeapYear(date.tm_year % 400 - 1))) {
          val++;
        }
      } else if (val == 53) {
        var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
        if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year))) val = 1;
      }
      return leadingNulls(val, 2);
    },
    "%w": date => date.tm_wday,
    "%W": date => {
      var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
      return leadingNulls(Math.floor(days / 7), 2);
    },
    "%y": date => (date.tm_year + 1900).toString().substring(2),
    "%Y": date => date.tm_year + 1900,
    "%z": date => {
      var off = date.tm_gmtoff;
      var ahead = off >= 0;
      off = Math.abs(off) / 60;
      off = (off / 60) * 100 + (off % 60);
      return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
    },
    "%Z": date => date.tm_zone,
    "%%": () => "%"
  };
  pattern = pattern.replace(/%%/g, "\0\0");
  for (var rule in EXPANSION_RULES_2) {
    if (pattern.includes(rule)) {
      pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
    }
  }
  pattern = pattern.replace(/\0\0/g, "%");
  var bytes = intArrayFromString(pattern, false);
  if (bytes.length > maxsize) {
    return 0;
  }
  writeArrayToMemory(bytes, s);
  return bytes.length - 1;
};

Module["_strftime"] = _strftime;

var _strftime_l = (s, maxsize, format, tm, loc) => _strftime(s, maxsize, format, tm);

Module["_strftime_l"] = _strftime_l;

var stringToUTF8OnStack = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
};

Module["stringToUTF8OnStack"] = stringToUTF8OnStack;

var incrementExceptionRefcount = ptr => ___cxa_increment_exception_refcount(ptr);

Module["incrementExceptionRefcount"] = incrementExceptionRefcount;

var decrementExceptionRefcount = ptr => ___cxa_decrement_exception_refcount(ptr);

Module["decrementExceptionRefcount"] = decrementExceptionRefcount;

var getExceptionMessageCommon = ptr => {
  var sp = stackSave();
  var type_addr_addr = stackAlloc(4);
  var message_addr_addr = stackAlloc(4);
  ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
  var type_addr = GROWABLE_HEAP_U32()[((type_addr_addr) >> 2)];
  var message_addr = GROWABLE_HEAP_U32()[((message_addr_addr) >> 2)];
  var type = UTF8ToString(type_addr);
  _free(type_addr);
  var message;
  if (message_addr) {
    message = UTF8ToString(message_addr);
    _free(message_addr);
  }
  stackRestore(sp);
  return [ type, message ];
};

Module["getExceptionMessageCommon"] = getExceptionMessageCommon;

var getExceptionMessage = ptr => getExceptionMessageCommon(ptr);

Module["getExceptionMessage"] = getExceptionMessage;

PThread.init();

var proxiedFunctionTable = [ _proc_exit, exitOnMainThread, pthreadCreateProxied, _emscripten_websocket_close, _emscripten_websocket_delete, _emscripten_websocket_new, _emscripten_websocket_send_binary, _emscripten_websocket_set_onclose_callback_on_thread, _emscripten_websocket_set_onerror_callback_on_thread, _emscripten_websocket_set_onmessage_callback_on_thread, _emscripten_websocket_set_onopen_callback_on_thread, _environ_get, _environ_sizes_get ];

function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
}

var wasmImports;

function assignWasmImports() {
  wasmImports = {
    /** @export */ __assert_fail: ___assert_fail,
    /** @export */ __cxa_begin_catch: ___cxa_begin_catch,
    /** @export */ __cxa_end_catch: ___cxa_end_catch,
    /** @export */ __cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
    /** @export */ __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
    /** @export */ __cxa_find_matching_catch_4: ___cxa_find_matching_catch_4,
    /** @export */ __cxa_rethrow: ___cxa_rethrow,
    /** @export */ __cxa_throw: ___cxa_throw,
    /** @export */ __cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
    /** @export */ __pthread_create_js: ___pthread_create_js,
    /** @export */ __pthread_kill_js: ___pthread_kill_js,
    /** @export */ __resumeException: ___resumeException,
    /** @export */ _abort_js: __abort_js,
    /** @export */ _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
    /** @export */ _emscripten_init_main_thread_js: __emscripten_init_main_thread_js,
    /** @export */ _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
    /** @export */ _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
    /** @export */ _emscripten_thread_cleanup: __emscripten_thread_cleanup,
    /** @export */ _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
    /** @export */ _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
    /** @export */ _gmtime_js: __gmtime_js,
    /** @export */ _localtime_js: __localtime_js,
    /** @export */ _tzset_js: __tzset_js,
    /** @export */ _wasmfs_copy_preloaded_file_data: __wasmfs_copy_preloaded_file_data,
    /** @export */ _wasmfs_get_num_preloaded_dirs: __wasmfs_get_num_preloaded_dirs,
    /** @export */ _wasmfs_get_num_preloaded_files: __wasmfs_get_num_preloaded_files,
    /** @export */ _wasmfs_get_preloaded_child_path: __wasmfs_get_preloaded_child_path,
    /** @export */ _wasmfs_get_preloaded_file_mode: __wasmfs_get_preloaded_file_mode,
    /** @export */ _wasmfs_get_preloaded_file_size: __wasmfs_get_preloaded_file_size,
    /** @export */ _wasmfs_get_preloaded_parent_path: __wasmfs_get_preloaded_parent_path,
    /** @export */ _wasmfs_get_preloaded_path_name: __wasmfs_get_preloaded_path_name,
    /** @export */ _wasmfs_opfs_close_access: __wasmfs_opfs_close_access,
    /** @export */ _wasmfs_opfs_close_blob: __wasmfs_opfs_close_blob,
    /** @export */ _wasmfs_opfs_flush_access: __wasmfs_opfs_flush_access,
    /** @export */ _wasmfs_opfs_free_directory: __wasmfs_opfs_free_directory,
    /** @export */ _wasmfs_opfs_free_file: __wasmfs_opfs_free_file,
    /** @export */ _wasmfs_opfs_get_child: __wasmfs_opfs_get_child,
    /** @export */ _wasmfs_opfs_get_entries: __wasmfs_opfs_get_entries,
    /** @export */ _wasmfs_opfs_get_size_access: __wasmfs_opfs_get_size_access,
    /** @export */ _wasmfs_opfs_get_size_blob: __wasmfs_opfs_get_size_blob,
    /** @export */ _wasmfs_opfs_get_size_file: __wasmfs_opfs_get_size_file,
    /** @export */ _wasmfs_opfs_init_root_directory: __wasmfs_opfs_init_root_directory,
    /** @export */ _wasmfs_opfs_insert_directory: __wasmfs_opfs_insert_directory,
    /** @export */ _wasmfs_opfs_insert_file: __wasmfs_opfs_insert_file,
    /** @export */ _wasmfs_opfs_move_file: __wasmfs_opfs_move_file,
    /** @export */ _wasmfs_opfs_open_access: __wasmfs_opfs_open_access,
    /** @export */ _wasmfs_opfs_open_blob: __wasmfs_opfs_open_blob,
    /** @export */ _wasmfs_opfs_read_access: __wasmfs_opfs_read_access,
    /** @export */ _wasmfs_opfs_read_blob: __wasmfs_opfs_read_blob,
    /** @export */ _wasmfs_opfs_remove_child: __wasmfs_opfs_remove_child,
    /** @export */ _wasmfs_opfs_set_size_access: __wasmfs_opfs_set_size_access,
    /** @export */ _wasmfs_opfs_set_size_file: __wasmfs_opfs_set_size_file,
    /** @export */ _wasmfs_opfs_write_access: __wasmfs_opfs_write_access,
    /** @export */ _wasmfs_stdin_get_char: __wasmfs_stdin_get_char,
    /** @export */ _wasmfs_thread_utils_heartbeat: __wasmfs_thread_utils_heartbeat,
    /** @export */ emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
    /** @export */ emscripten_date_now: _emscripten_date_now,
    /** @export */ emscripten_err: _emscripten_err,
    /** @export */ emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
    /** @export */ emscripten_get_heap_max: _emscripten_get_heap_max,
    /** @export */ emscripten_get_now: _emscripten_get_now,
    /** @export */ emscripten_has_asyncify: _emscripten_has_asyncify,
    /** @export */ emscripten_num_logical_cores: _emscripten_num_logical_cores,
    /** @export */ emscripten_out: _emscripten_out,
    /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */ emscripten_runtime_keepalive_check: _emscripten_runtime_keepalive_check,
    /** @export */ emscripten_unwind_to_js_event_loop: _emscripten_unwind_to_js_event_loop,
    /** @export */ emscripten_websocket_close: _emscripten_websocket_close,
    /** @export */ emscripten_websocket_delete: _emscripten_websocket_delete,
    /** @export */ emscripten_websocket_new: _emscripten_websocket_new,
    /** @export */ emscripten_websocket_send_binary: _emscripten_websocket_send_binary,
    /** @export */ emscripten_websocket_set_onclose_callback_on_thread: _emscripten_websocket_set_onclose_callback_on_thread,
    /** @export */ emscripten_websocket_set_onerror_callback_on_thread: _emscripten_websocket_set_onerror_callback_on_thread,
    /** @export */ emscripten_websocket_set_onmessage_callback_on_thread: _emscripten_websocket_set_onmessage_callback_on_thread,
    /** @export */ emscripten_websocket_set_onopen_callback_on_thread: _emscripten_websocket_set_onopen_callback_on_thread,
    /** @export */ environ_get: _environ_get,
    /** @export */ environ_sizes_get: _environ_sizes_get,
    /** @export */ exit: _exit,
    /** @export */ getentropy: _getentropy,
    /** @export */ invoke_dii: invoke_dii,
    /** @export */ invoke_diii: invoke_diii,
    /** @export */ invoke_fiii: invoke_fiii,
    /** @export */ invoke_i: invoke_i,
    /** @export */ invoke_ii: invoke_ii,
    /** @export */ invoke_iid: invoke_iid,
    /** @export */ invoke_iii: invoke_iii,
    /** @export */ invoke_iiii: invoke_iiii,
    /** @export */ invoke_iiiii: invoke_iiiii,
    /** @export */ invoke_iiiiid: invoke_iiiiid,
    /** @export */ invoke_iiiiii: invoke_iiiiii,
    /** @export */ invoke_iiiiiii: invoke_iiiiiii,
    /** @export */ invoke_iiiiiiii: invoke_iiiiiiii,
    /** @export */ invoke_iiiiiiiiiii: invoke_iiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiii: invoke_iiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiii: invoke_iiiiiiiiiiiii,
    /** @export */ invoke_iiiiij: invoke_iiiiij,
    /** @export */ invoke_iiij: invoke_iiij,
    /** @export */ invoke_iiijiii: invoke_iiijiii,
    /** @export */ invoke_iij: invoke_iij,
    /** @export */ invoke_iiji: invoke_iiji,
    /** @export */ invoke_ij: invoke_ij,
    /** @export */ invoke_j: invoke_j,
    /** @export */ invoke_ji: invoke_ji,
    /** @export */ invoke_jii: invoke_jii,
    /** @export */ invoke_jiii: invoke_jiii,
    /** @export */ invoke_jiiii: invoke_jiiii,
    /** @export */ invoke_v: invoke_v,
    /** @export */ invoke_vi: invoke_vi,
    /** @export */ invoke_vii: invoke_vii,
    /** @export */ invoke_viii: invoke_viii,
    /** @export */ invoke_viiii: invoke_viiii,
    /** @export */ invoke_viiiii: invoke_viiiii,
    /** @export */ invoke_viiiiii: invoke_viiiiii,
    /** @export */ invoke_viiiiiii: invoke_viiiiiii,
    /** @export */ invoke_viiiiiiii: invoke_viiiiiiii,
    /** @export */ invoke_viiiiiiiiii: invoke_viiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiiiii: invoke_viiiiiiiiiiiiiii,
    /** @export */ invoke_viiiiij: invoke_viiiiij,
    /** @export */ invoke_viiiij: invoke_viiiij,
    /** @export */ invoke_viiij: invoke_viiij,
    /** @export */ invoke_viij: invoke_viij,
    /** @export */ invoke_viiji: invoke_viiji,
    /** @export */ invoke_viijj: invoke_viijj,
    /** @export */ invoke_viijjj: invoke_viijjj,
    /** @export */ invoke_vij: invoke_vij,
    /** @export */ invoke_viji: invoke_viji,
    /** @export */ invoke_vijj: invoke_vijj,
    /** @export */ invoke_vji: invoke_vji,
    /** @export */ llvm_eh_typeid_for: _llvm_eh_typeid_for,
    /** @export */ memory: wasmMemory,
    /** @export */ onAPIResult: _onAPIResult,
    /** @export */ onChain: _onChain,
    /** @export */ onConnect: _onConnect,
    /** @export */ onDisconnect: _onDisconnect,
    /** @export */ onMempoolAdd: _onMempoolAdd,
    /** @export */ onMempoolErase: _onMempoolErase,
    /** @export */ onStream: _onStream,
    /** @export */ rtcCreateDataChannel: _rtcCreateDataChannel,
    /** @export */ rtcCreatePeerConnection: _rtcCreatePeerConnection,
    /** @export */ rtcDeleteDataChannel: _rtcDeleteDataChannel,
    /** @export */ rtcDeletePeerConnection: _rtcDeletePeerConnection,
    /** @export */ rtcGetBufferedAmount: _rtcGetBufferedAmount,
    /** @export */ rtcGetDataChannelLabel: _rtcGetDataChannelLabel,
    /** @export */ rtcGetLocalDescription: _rtcGetLocalDescription,
    /** @export */ rtcGetLocalDescriptionType: _rtcGetLocalDescriptionType,
    /** @export */ rtcSendMessage: _rtcSendMessage,
    /** @export */ rtcSetBufferedAmountLowCallback: _rtcSetBufferedAmountLowCallback,
    /** @export */ rtcSetBufferedAmountLowThreshold: _rtcSetBufferedAmountLowThreshold,
    /** @export */ rtcSetDataChannelCallback: _rtcSetDataChannelCallback,
    /** @export */ rtcSetErrorCallback: _rtcSetErrorCallback,
    /** @export */ rtcSetGatheringStateChangeCallback: _rtcSetGatheringStateChangeCallback,
    /** @export */ rtcSetIceStateChangeCallback: _rtcSetIceStateChangeCallback,
    /** @export */ rtcSetLocalCandidateCallback: _rtcSetLocalCandidateCallback,
    /** @export */ rtcSetLocalDescriptionCallback: _rtcSetLocalDescriptionCallback,
    /** @export */ rtcSetMessageCallback: _rtcSetMessageCallback,
    /** @export */ rtcSetOpenCallback: _rtcSetOpenCallback,
    /** @export */ rtcSetRemoteDescription: _rtcSetRemoteDescription,
    /** @export */ rtcSetSignalingStateChangeCallback: _rtcSetSignalingStateChangeCallback,
    /** @export */ rtcSetStateChangeCallback: _rtcSetStateChangeCallback,
    /** @export */ rtcSetUserPointer: _rtcSetUserPointer,
    /** @export */ strftime: _strftime,
    /** @export */ strftime_l: _strftime_l
  };
}

var wasmExports = createWasm();

var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);

var ___cxa_free_exception = createExportWrapper("__cxa_free_exception", 1);

var _free = createExportWrapper("free", 1);

var _malloc = createExportWrapper("malloc", 1);

var _emscripten_main_runtime_thread_id = createExportWrapper("emscripten_main_runtime_thread_id", 0);

var _virtual_get_request = Module["_virtual_get_request"] = createExportWrapper("virtual_get_request", 2);

var _virtual_post_request = Module["_virtual_post_request"] = createExportWrapper("virtual_post_request", 3);

var _stream_control = Module["_stream_control"] = createExportWrapper("stream_control", 1);

var _main = Module["_main"] = createExportWrapper("__main_argc_argv", 2);

var _fflush = createExportWrapper("fflush", 1);

var _pthread_self = () => (_pthread_self = wasmExports["pthread_self"])();

var __emscripten_tls_init = createExportWrapper("_emscripten_tls_init", 0);

var __emscripten_proxy_main = Module["__emscripten_proxy_main"] = createExportWrapper("_emscripten_proxy_main", 2);

var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"])();

var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"])();

var __emscripten_thread_init = createExportWrapper("_emscripten_thread_init", 6);

var __emscripten_thread_crashed = createExportWrapper("_emscripten_thread_crashed", 0);

var _emscripten_main_thread_process_queued_calls = createExportWrapper("emscripten_main_thread_process_queued_calls", 0);

var _emscripten_proxy_execute_queue = createExportWrapper("emscripten_proxy_execute_queue", 1);

var _emscripten_proxy_finish = createExportWrapper("emscripten_proxy_finish", 1);

var __emscripten_run_on_main_thread_js = createExportWrapper("_emscripten_run_on_main_thread_js", 5);

var __emscripten_thread_free_data = createExportWrapper("_emscripten_thread_free_data", 1);

var __emscripten_thread_exit = createExportWrapper("_emscripten_thread_exit", 1);

var __emscripten_check_mailbox = createExportWrapper("_emscripten_check_mailbox", 0);

var _setThrew = createExportWrapper("setThrew", 2);

var __emscripten_tempret_set = createExportWrapper("_emscripten_tempret_set", 1);

var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports["emscripten_stack_init"])();

var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"])(a0, a1);

var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"])();

var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);

var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);

var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();

var ___cxa_decrement_exception_refcount = createExportWrapper("__cxa_decrement_exception_refcount", 1);

var ___cxa_increment_exception_refcount = createExportWrapper("__cxa_increment_exception_refcount", 1);

var ___get_exception_message = createExportWrapper("__get_exception_message", 3);

var ___cxa_can_catch = createExportWrapper("__cxa_can_catch", 3);

var ___cxa_is_pointer_type = createExportWrapper("__cxa_is_pointer_type", 1);

var __wasmfs_opfs_record_entry = createExportWrapper("_wasmfs_opfs_record_entry", 3);

var _wasmfs_flush = createExportWrapper("wasmfs_flush", 0);

function invoke_vii(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index, a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ji(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_ij(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiji(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iij(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vij(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiij(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijj(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijj(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiij(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijjj(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iid(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiij(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vji(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_j(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

var calledRun;

dependenciesFulfilled = function runCaller() {
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain(args = []) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
  var entryFunction = __emscripten_proxy_main;
  runtimeKeepalivePush();
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv;
  args.forEach(arg => {
    GROWABLE_HEAP_U32()[((argv_ptr) >> 2)] = stringToUTF8OnStack(arg);
    argv_ptr += 4;
  });
  GROWABLE_HEAP_U32()[((argv_ptr) >> 2)] = 0;
  try {
    var ret = entryFunction(argc, argv);
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  assert(!ENVIRONMENT_IS_PTHREAD);
  _emscripten_stack_init();
  writeStackCookie();
}

function run(args = arguments_) {
  if (runDependencies > 0) {
    return;
  }
  if (!ENVIRONMENT_IS_PTHREAD) stackCheckInit();
  if (ENVIRONMENT_IS_PTHREAD) {
    readyPromiseResolve(Module);
    initRuntime();
    startWorker(Module);
    return;
  }
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    readyPromiseResolve(Module);
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    if (shouldRunNow) callMain(args);
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    _wasmfs_flush();
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
    warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
  }
}

if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}

var shouldRunNow = true;

if (Module["noInitialRun"]) shouldRunNow = false;

run();

moduleRtn = readyPromise;

for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`);
      }
    });
  }
}


  return moduleRtn;
}
);
})();
export default Module;
var isPthread = globalThis.self?.name === 'em-pthread';
// When running as a pthread, construct a new instance on startup
isPthread && Module();
