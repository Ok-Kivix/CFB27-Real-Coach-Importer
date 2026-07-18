// Resolves the tool's loose, editable assets (coaches.json, schema/, the native
// zstd binary) so they can live BESIDE the packaged .exe — not frozen inside it.
//
// From source (`node index.js`), assets resolve to the project dir, exactly as
// before. Inside a packaged .exe, `__dirname` points into the read-only pkg
// snapshot, so we resolve against the executable's own folder instead. That is
// what lets a user open coaches.json in Notepad and edit it.
const path = require('path');

// pkg sets process.pkg; keep a Node-SEA check too in case we ever switch packagers.
function isSea() {
  try { return require('node:sea').isSea(); } catch { return false; }
}
const PACKAGED = typeof process.pkg !== 'undefined' || isSea();

// Folder to read loose assets from: beside the .exe when packaged, else the repo.
const BASE = PACKAGED ? path.dirname(process.execPath) : __dirname;

module.exports = {
  PACKAGED,
  BASE,
  COACHES_JSON: path.join(BASE, 'coaches.json'),
  SCHEMA_DIR: path.join(BASE, 'schema'),
  // Prebuilt @toondepauw/node-zstd addon, shipped beside the exe and pointed to
  // via NAPI_RS_NATIVE_LIBRARY_PATH (see entry.js). Only used when packaged.
  NATIVE_ZSTD: path.join(BASE, 'runtime', 'node-zstd.win32-x64-msvc.node'),
};
