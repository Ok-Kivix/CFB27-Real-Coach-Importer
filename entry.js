#!/usr/bin/env node
// Packaged-exe entry point. Must run BEFORE index.js/openSave.js are required so
// that environment variables are in place when their module-level constants read
// them. Wires the loose, editable assets that ship beside the .exe:
//   - RG_SCHEMA_DIR            -> schema/ folder (openSave.js reads this)
//   - NAPI_RS_NATIVE_LIBRARY_PATH -> the native zstd .node (node-zstd reads this)
// From source this file is unused (npm start runs index.js directly).
const fs = require('fs');
const readline = require('readline');
const paths = require('./paths');

// Point node-zstd straight at the prebuilt addon beside the exe. This bypasses
// its platform-package auto-detection, which cannot see inside the pkg snapshot.
if (paths.PACKAGED && !process.env.NAPI_RS_NATIVE_LIBRARY_PATH && fs.existsSync(paths.NATIVE_ZSTD)) {
  process.env.NAPI_RS_NATIVE_LIBRARY_PATH = paths.NATIVE_ZSTD;
}
// Make madden-franchise load schemas from the folder beside the exe.
if (!process.env.RG_SCHEMA_DIR) process.env.RG_SCHEMA_DIR = paths.SCHEMA_DIR;

const c = { reset: '\x1b[0m', red: '\x1b[31m', dim: '\x1b[2m' };

// Keep the console window open after a double-click so the user can read output.
function pause() {
  if (!paths.PACKAGED || !process.stdout.isTTY) return Promise.resolve();
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\nDone. Press Enter to close this window...', () => { rl.close(); resolve(); });
  });
}

const { main } = require('./index.js');
main()
  .then(pause)
  .catch(async (err) => {
    console.error(`\n${c.red}Error: ${err && err.message ? err.message : err}${c.reset}`);
    await pause();
    process.exit(1);
  });
