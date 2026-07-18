// CFB27 franchise-save opener for the Real Coaches tool.
// Vendored from test/src/openSave.js (schema 809_0). Tables are resolved ONLY by
// stable uniqueId (see /CLAUDE.md §3) — display names are not unique and tableId
// shifts between saves. The bootstrap-only name lookup is deliberately omitted here.
const path = require('path');
const { FranchiseFile } = require('madden-franchise');

const SCHEMA_DIR = process.env.RG_SCHEMA_DIR || path.resolve(__dirname, 'schema');
const SCHEMA_OVERRIDE = () => ({ major: 809, minor: 0, gameYear: 27, path: path.join(SCHEMA_DIR, 'CFB27_809_0.gz') });

/** Open a CFB27 dynasty save; resolves once tables are parsed. */
function openSave(savePath, { autoUnempty = false } = {}) {
  return new Promise((resolve, reject) => {
    const f = new FranchiseFile(savePath, {
      autoParse: true,
      schemaDirectory: SCHEMA_DIR,
      schemaOverride: SCHEMA_OVERRIDE(),
      autoUnempty,
    });
    f.on('ready', () => resolve(f));
    f.on('error', reject);
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
