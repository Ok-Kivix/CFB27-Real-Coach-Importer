// CFB27 franchise-save opener for the Real Coaches tool.
// Vendored from test/src/openSave.js (schema 809_0). Tables are resolved ONLY by
// stable uniqueId (see /CLAUDE.md §3) — display names are not unique and tableId
// shifts between saves. The bootstrap-only name lookup is deliberately omitted here.
const path = require('path');
const { FranchiseFile } = require('madden-franchise');

const fs = require('fs');
const SCHEMA_DIR = process.env.RG_SCHEMA_DIR || path.resolve(__dirname, 'schema');

/**
 * Choose a schema file for a save. Prefer an exact version match
 * (CFB27_<major>_<minor>.gz or C27_<major>_<minor>.gz); otherwise fall back to the
 * newest schema in the folder.
 *
 * A save's reported version (e.g. 814) is a build number that bumps with every game
 * patch, but the CFB27 table layouts this tool reads/writes are stable across those
 * patches — verified: an 809 save parses byte-identically under the 809 and 472
 * schemas (coach/team/CareerCoachStats all match). So one bundled schema safely
 * handles saves whose exact build number we don't ship a file for. (We still supply
 * the path explicitly, because madden-franchise's built-in picker silently falls
 * back to an unrelated Madden/old-CFB schema, which mis-parses.)
 *
 * Returns { path, exact, name }.
 */
function schemaFileFor(meta) {
  for (const name of [`CFB27_${meta.major}_${meta.minor}.gz`, `C27_${meta.major}_${meta.minor}.gz`]) {
    const p = path.join(SCHEMA_DIR, name);
    if (fs.existsSync(p)) return { path: p, exact: true, name };
  }
  let files = [];
  try { files = fs.readdirSync(SCHEMA_DIR).filter((f) => /\.gz$/i.test(f)); } catch {}
  if (files.length) {
    // Newest by modification time — dropping a fresh schema into the folder makes it
    // the one used for any save whose exact version isn't bundled.
    const newest = files
      .map((f) => ({ f, t: fs.statSync(path.join(SCHEMA_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0].f;
    return { path: path.join(SCHEMA_DIR, newest), exact: false, name: newest };
  }
  throw new Error(
    `No schema files found in "${SCHEMA_DIR}".\n`
    + `The "schema" folder must sit next to Real-Coaches.exe. If it's missing, re-download the release zip.`,
  );
}

/**
 * Open a CFB27 dynasty save; resolves once tables are parsed. The schema is chosen
 * from the version the save declares, falling back to the newest bundled schema so
 * saves from any game patch work.
 */
function openSave(savePath, { autoUnempty = false, onSchema } = {}) {
  return new Promise((resolve, reject) => {
    let f;
    try {
      // autoParse:false lets us read the save's own schema version (computed in the
      // constructor) before parsing, then supply the schema file path explicitly.
      f = new FranchiseFile(savePath, { autoParse: false, schemaDirectory: SCHEMA_DIR, autoUnempty });
      const expected = f.expectedSchemaVersion;
      const chosen = schemaFileFor(expected);
      if (typeof onSchema === 'function') onSchema({ expected, ...chosen });
      f.settings.schemaOverride = {
        major: expected.major, minor: expected.minor, gameYear: expected.gameYear,
        path: chosen.path,
      };
    } catch (err) { reject(err); return; }
    f.on('ready', () => resolve(f));
    f.on('error', reject);
    f.parse();
  });
}

// Confirmed against DYNASTY-BASELINE / DYNASTY-REALCOACHES with schema 809_0.
// uniqueId is stable across schema versions; see docs/reference/TABLES.md.
const TABLE_UNIQUE_ID = {
  team: 3359508968, // per-school Team table (DisplayName/TeamIndex). NOT 431958913 (singleton).
  coach: 1860529246,
  owner: 2357578975,
  franchiseUser: 3429237668,
  careerCoachStats: 1758861850, // Coach.CareerStats target — career-cumulative counters
  seasonCoachStats: 564984853, // Coach.SeasonStats target — current-season W/L
};

/** Resolve a table by its stable uniqueId. Throws if not catalogued or not found. */
function tableByUniqueId(file, key) {
  const uniqueId = TABLE_UNIQUE_ID[key];
  if (uniqueId === undefined) throw new Error(`No uniqueId catalogued for "${key}".`);
  const table = file.getTableByUniqueId(uniqueId);
  if (!table) throw new Error(`Could not find table "${key}" by uniqueId ${uniqueId}. Schema may have changed.`);
  return table;
}

async function readTable(file, key) {
  const t = tableByUniqueId(file, key);
  await t.readRecords();
  return t;
}

/** Decode a 32-char binary-string reference into {tableId, row}, or null if empty/invalid. */
function parseRef(bin) {
  if (typeof bin !== 'string' || bin.length < 32 || !/[1-9]/.test(bin)) return null;
  return { tableId: parseInt(bin.slice(0, 15), 2), row: parseInt(bin.slice(15), 2) };
}

/**
 * Follow a Coach's CareerStats/SeasonStats reference to its record, verifying the
 * target table's uniqueId so a shifted tableId can never send a write to the wrong
 * table. This is §3's one sanctioned use of getTableById (following a decoded ref).
 * Returns { table, record } or null if the ref is empty/unresolvable.
 */
async function followStatsRef(file, ref, expectedUniqueId) {
  const parsed = parseRef(ref);
  if (!parsed) return null;
  const table = file.getTableById(parsed.tableId);
  if (!table) return null;
  if (table.header.uniqueId !== expectedUniqueId) {
    throw new Error(`Stats ref resolved to table uniqueId ${table.header.uniqueId}, expected ${expectedUniqueId}. Refusing.`);
  }
  await table.readRecords();
  const record = table.records[parsed.row];
  if (!record || record.isEmpty) return null;
  return { table, record };
}

/** Safe field read (schema mismatches / free rows throw otherwise). */
const sf = (rec, field) => { try { return rec[field]; } catch { return undefined; } };

module.exports = {
  openSave, tableByUniqueId, readTable, parseRef, followStatsRef, sf,
  SCHEMA_DIR, TABLE_UNIQUE_ID,
  CAREER_COACH_STATS_UID: TABLE_UNIQUE_ID.careerCoachStats,
  SEASON_COACH_STATS_UID: TABLE_UNIQUE_ID.seasonCoachStats,
};
