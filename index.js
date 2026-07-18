#!/usr/bin/env node
// Real Coaches — correct a CFB27 dynasty save's head coaches to their real-life
// identities: name + shipped likeness (portrait + 3D head recipe) + real historic
// career stats. Writes to a SIBLING COPY (<save>-REALCOACHES); the source is never
// touched. Tables resolved by stable uniqueId only (CLAUDE.md §3); the CareerCoachStats
// row is reached by following Coach.CareerStats and verifying the target's uniqueId.
//
// Safety: only CPU coaches are edited. The user's own head coach is skipped (the
// in-game coach editor has crashed on an edited coach — see docs/vision/REAL_COACHES.md).
// The name+likeness swap is in-game validated; the historic-stat write is NOT yet
// validated in-game — pass --names-only for the proven-safe path.
//
// Usage: node index.js [savePath] [--dry-run] [--names-only] [--out=<path>] [--json]
const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const { resolveSavePath } = require('./savePicker');
const {
  openSave, readTable, followStatsRef, sf, CAREER_COACH_STATS_UID,
} = require('./openSave');

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const namesOnly = args.includes('--names-only');
const asJson = args.includes('--json');
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

// dataset stat key -> CareerCoachStats field name (RecentYearNCWon intentionally
// omitted: it is a dynasty-relative index, not a real calendar year).
const STAT_FIELDS = {
  wins: 'Wins', losses: 'Losses',
  bowlWins: 'BowlWins', bowlLosses: 'BowlLosses',
  confChampWins: 'ConfChampWins', confChampLosses: 'ConfChampLosses',
  playoffWins: 'PlayoffWins', playoffLosses: 'PlayoffLosses',
  ncWins: 'NCWins', ncLosses: 'NCLosses',
  top25Wins: 'Top25Wins', top25Losses: 'Top25Losses',
  timesFired: 'TimesFired',
};

const displayName = (first, last) => `${first.charAt(0)}. ${last}`;
const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();
function assertFits(value, max, label) {
  if (String(value).length > max) throw new Error(`${label} "${value}" exceeds maxLength ${max}.`);
}
function clamp(v, min, max) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.max(min, Math.min(max, Math.round(v)));
}

async function main() {
  if (!asJson) {
    console.log(`\n${c.bold}Real Coaches — CFB27 head-coach corrector${c.reset}`);
    console.log(`${c.dim}────────────────────────────────────────────${c.reset}\n`);
  }

  if (!process.env.RG_SCHEMA_DIR) process.env.RG_SCHEMA_DIR = paths.SCHEMA_DIR;
  const dataset = JSON.parse(fs.readFileSync(paths.COACHES_JSON, 'utf8'));

  const savePath = await resolveSavePath(positional, c);
  if (!asJson) {
    console.log(`${c.cyan}Save:${c.reset} ${savePath}`);
    console.log(`${c.dim}Mode: ${dryRun ? 'dry run (no writes)' : 'apply'}${namesOnly ? ', names+faces only (no stats)' : ''}${c.reset}\n`);
  }

  const file = await openSave(savePath, { autoUnempty: false });
  const teamTable = await readTable(file, 'team');
  const coachTable = await readTable(file, 'coach');

  // team DisplayName (lowercased) -> TeamIndex
  const teamIndexByName = new Map();
  for (const rec of teamTable.records) {
    if (rec.isEmpty) continue;
    teamIndexByName.set(norm(sf(rec, 'DisplayName')), sf(rec, 'TeamIndex'));
  }
  // TeamIndex -> HeadCoach record
  const hcByTeamIndex = new Map();
  for (const rec of coachTable.records) {
    if (rec.isEmpty || sf(rec, 'Position') !== 'HeadCoach') continue;
    hcByTeamIndex.set(sf(rec, 'TeamIndex'), rec);
  }

  // Field ranges for stat clamping (read once from the schema).
  const careerStatsTable = file.getTableByUniqueId(CAREER_COACH_STATS_UID);
  const statRange = {};
  for (const attr of careerStatsTable.schema.attributes) statRange[attr.name] = { min: attr.minValue, max: attr.maxValue };

  const plan = [];
  const skipped = [];
  for (const d of dataset.coaches) {
    const teamIndex = teamIndexByName.get(norm(d.team));
    if (teamIndex === undefined) { skipped.push({ team: d.team, reason: 'team not in this save' }); continue; }
    const rec = hcByTeamIndex.get(teamIndex);
    if (!rec) { skipped.push({ team: d.team, reason: 'no head coach on this team' }); continue; }
    if (sf(rec, 'IsUserControlled') === true) { skipped.push({ team: d.team, reason: 'user-controlled — your coach, left alone' }); continue; }

    const curFirst = sf(rec, 'FirstName'), curLast = sf(rec, 'LastName');
    const nameMatches = norm(curFirst) === norm(d.firstName) && norm(curLast) === norm(d.lastName);
    const curAsset = sf(rec, 'AssetName');
    const assetMatches = d.asset ? curAsset === d.asset.assetName : true;

    plan.push({
      team: d.team, teamIndex, rec, data: d,
      before: { first: curFirst, last: curLast, asset: curAsset, isNIL: sf(rec, 'IsNIL') },
      nameMatches, assetMatches,
      classification: (nameMatches && assetMatches) ? 'already-correct' : 'correcting',
    });
  }

  // Resolve each stats target now (before writing) so the report is accurate.
  for (const p of plan) {
    p.statsRef = null;
    if (!p.data.stats) continue;
    try {
      p.statsRef = await followStatsRef(file, sf(p.rec, 'CareerStats'), CAREER_COACH_STATS_UID);
    } catch (e) { p.statsError = e.message; }
  }

  // ---- Report ----
  const correcting = plan.filter((p) => p.classification === 'correcting');
  const alreadyOk = plan.filter((p) => p.classification === 'already-correct');
  if (asJson) {
    console.log(JSON.stringify({
      save: savePath, dryRun, namesOnly,
      counts: { matched: plan.length, correcting: correcting.length, alreadyCorrect: alreadyOk.length, skipped: skipped.length },
      correcting: correcting.map((p) => ({ team: p.team, from: `${p.before.first} ${p.before.last}`, to: `${p.data.firstName} ${p.data.lastName}`, asset: p.data.asset ? p.data.asset.assetName : null, hasStats: !!p.data.stats && !!p.statsRef })),
      skipped,
    }, null, 2));
  } else {
    console.log(`${c.bold}Audit — ${plan.length} FBS coaches matched in this save${c.reset}\n`);
    if (correcting.length) {
      console.log(`${c.yellow}${c.bold}Coaches to correct (${correcting.length}):${c.reset}`);
      for (const p of correcting) {
        const face = p.data.asset ? `${c.green}face✓${c.reset}` : `${c.gray}no asset${c.reset}`;
        const stats = !p.data.stats ? `${c.gray}no stats${c.reset}` : (p.statsRef ? `${c.green}stats✓${c.reset}` : `${c.red}stats-ref empty${c.reset}`);
        console.log(`  ${c.bold}${p.team.padEnd(18)}${c.reset} ${p.before.first} ${p.before.last} ${c.dim}→${c.reset} ${c.green}${p.data.firstName} ${p.data.lastName}${c.reset}  [${face}, ${namesOnly ? c.gray + 'stats skipped' + c.reset : stats}]`);
      }
      console.log();
    }
    console.log(`${c.dim}Already correct (name+face): ${alreadyOk.length}${namesOnly ? '' : ` — historic stats ${dryRun ? 'would be' : 'will be'} (re)written where available`}${c.reset}`);
    if (skipped.length) {
      console.log(`${c.dim}Skipped: ${skipped.length}${c.reset}`);
      for (const s of skipped) console.log(`  ${c.gray}${s.team}: ${s.reason}${c.reset}`);
    }
  }

  if (dryRun) {
    if (!asJson) console.log(`\n${c.yellow}Dry run — no changes written.${c.reset}`);
    return;
  }

  // ---- Apply ----
  let idCount = 0, statCount = 0;
  for (const p of plan) {
    const d = p.data;
    // Identity (only when something differs — but always ensure Name matches convention).
    if (!p.nameMatches || !p.assetMatches) {
      const name = displayName(d.firstName, d.lastName);
      assertFits(d.firstName, 17, 'FirstName');
      assertFits(d.lastName, 21, 'LastName');
      assertFits(name, 18, 'Name');
      p.rec.FirstName = d.firstName;
      p.rec.LastName = d.lastName;
      p.rec.Name = name;
      if (d.asset) {
        assertFits(d.asset.assetName, 33, 'GenericHeadAssetName');
        assertFits(d.asset.assetName, 41, 'AssetName');
        p.rec.AssetName = d.asset.assetName;
        p.rec.GenericHeadAssetName = d.asset.assetName;
        p.rec.PresentationId = d.asset.presentationId;
        p.rec.Portrait = d.asset.portrait;
        p.rec.IsNIL = d.asset.isNIL !== false;
        p.rec.Portrait_Force_Silhouette = false;
      }
      idCount++;
    }
    // Historic stats.
    if (!namesOnly && d.stats && p.statsRef) {
      const cr = p.statsRef.record;
      for (const [key, field] of Object.entries(STAT_FIELDS)) {
        if (d.stats[key] == null) continue;
        const r = statRange[field] || { min: 0, max: 1024 };
        const val = clamp(d.stats[key], r.min, r.max);
        if (val != null) cr[field] = val;
      }
      statCount++;
    }
  }

  const outPath = flag('out') || `${savePath}-REALCOACHES`;
  if (fs.existsSync(outPath)) {
    fs.copyFileSync(outPath, `${outPath}.backup`);
    if (!asJson) console.log(`\n${c.dim}Existing output backed up to ${outPath}.backup${c.reset}`);
  }
  await file.save(outPath);
  if (!asJson) {
    console.log(`\n${c.green}${c.bold}Saved:${c.reset} ${outPath}`);
    console.log(`${c.dim}Corrected ${idCount} coach identities; wrote historic stats to ${statCount}.${c.reset}`);
    console.log(`${c.dim}Source save untouched. Load the -REALCOACHES copy in CFB27 to verify sidelines/menus.${c.reset}`);
  } else {
    console.log(JSON.stringify({ saved: outPath, identitiesChanged: idCount, statsWritten: statCount }));
  }
}

// Run directly (`node index.js`); when required by entry.js the packaged exe
// drives main() itself so it can pause before the console window closes.
if (require.main === module) {
  main().catch((err) => {
    console.error(`\n${c.red}Error: ${err.message || err}${c.reset}`);
    process.exit(1);
  });
}

module.exports = { main };
