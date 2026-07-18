#!/usr/bin/env node
// DEV-TIME dataset builder (not shipped in the standalone folder). Regenerates the
// ASSET + name half of coaches.json by harvesting a reference save, then merges:
//   - GENERIC_FILLS: teams EA ships with a GENERIC head coach, mapped to the real
//     coach + the shipped Unique_C_ likeness (assetName / presentationId / portrait),
//     resolved via frosty-cli portrait-slots (see docs/vision/REAL_COACHES.md).
//   - stats.json: hand-researched real-life career stats, keyed by team.
//
// Coach identity in a fresh EA roster is ALREADY real for ~131/138 FBS teams (their
// Coach records carry correct {AssetName, PresentationId, Portrait} triples) — so the
// asset half is harvested for free and only the generics need manual asset data.
//
// Usage: node build-dataset.mjs [referenceSavePath]
//   default reference save: ../../Saves/DYNASTY-REALCOACHES
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.RG_SCHEMA_DIR = path.join(__dirname, 'schema');
const { openSave, readTable, sf } = require('./openSave');

// Teams EA ships as a GENERIC coach → the real coach + shipped likeness asset.
// asset:null means the real coach has NO shipped Unique_C_ likeness (rename only).
const GENERIC_FILLS = {
  'Iowa':           { firstName: 'Kirk',   lastName: 'Ferentz',    asset: { assetName: 'Unique_C_FerentzKirk_551',    presentationId: 551, portrait: 645, isNIL: true } },
  'Miami':          { firstName: 'Mario',  lastName: 'Cristobal',  asset: { assetName: 'Unique_C_CristobalMario_602', presentationId: 602, portrait: 610, isNIL: true } },
  'Utah State':     { firstName: 'Bronco', lastName: 'Mendenhall', asset: { assetName: 'Unique_C_MendenhallBronco_791', presentationId: 791, portrait: 775, isNIL: true } },
  'North Carolina': { firstName: 'Bill',   lastName: 'Belichick',  asset: { assetName: 'Unique_C_BelichickBill_647',   presentationId: 647, portrait: 563, isNIL: true } },
  'Colorado':       { firstName: 'Deion',  lastName: 'Sanders',    asset: { assetName: 'Unique_C_SandersDeion_494',    presentationId: 494, portrait: 846, isNIL: true } },
  'North Texas':    { firstName: 'Neal',   lastName: 'Brown',      asset: null }, // no shipped likeness (Neal Brown, from West Virginia/Troy)
  'Southern Miss':  { firstName: 'Blake',  lastName: 'Anderson',   asset: { assetName: 'Unique_C_AndersonBlake_720',   presentationId: 720, portrait: 536, isNIL: true } },
};

// Optional corrections where EA's shipped placement disagrees with the real-world
// current season. Keyed by team → { firstName, lastName, asset? }. Empty for now
// (EA's 27 roster placements match the current landscape for the harvested set).
const OVERRIDES = {};

const isFCS = (t) => /^FCS /i.test(t || '') || !t;

async function main() {
  const refSave = process.argv[2] || path.join(__dirname, 'reference-save');
  console.log(`Harvesting reference save: ${refSave}`);
  const file = await openSave(refSave, { autoUnempty: false });
  const teamTable = await readTable(file, 'team');
  const coachTable = await readTable(file, 'coach');

  const teamName = new Map();
  for (const rec of teamTable.records) {
    if (rec.isEmpty) continue;
    teamName.set(sf(rec, 'TeamIndex'), sf(rec, 'DisplayName'));
  }

  // team -> { firstName, lastName, asset }  (real coaches already placed by EA)
  const byTeam = new Map();
  for (const rec of coachTable.records) {
    if (rec.isEmpty || sf(rec, 'Position') !== 'HeadCoach') continue;
    const team = teamName.get(sf(rec, 'TeamIndex'));
    if (isFCS(team)) continue;
    const assetName = sf(rec, 'AssetName');
    const hasUnique = typeof assetName === 'string' && /Unique_C_/i.test(assetName);
    byTeam.set(team, {
      firstName: sf(rec, 'FirstName'), lastName: sf(rec, 'LastName'),
      asset: hasUnique ? { assetName, presentationId: sf(rec, 'PresentationId'), portrait: sf(rec, 'Portrait'), isNIL: true } : null,
      _generic: !hasUnique,
    });
  }

  // Merge generic fills + overrides.
  for (const [team, fill] of Object.entries(GENERIC_FILLS)) byTeam.set(team, { ...fill });
  for (const [team, ov] of Object.entries(OVERRIDES)) byTeam.set(team, { ...(byTeam.get(team) || {}), ...ov });

  // Merge hand-researched stats, keyed by coach NAME (records follow the coach, not
  // the school — see stats-source.json._note).
  const statsPath = path.join(__dirname, 'stats-source.json');
  const statsSrc = existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, 'utf8')) : { coaches: {}, _source: null };
  const normName = (s) => String(s || '').trim().toLowerCase().replace(/[.\s]+/g, ' ').replace(/\s+/g, ' ');
  const statByName = new Map();
  for (const [name, rec] of Object.entries(statsSrc.coaches || {})) statByName.set(normName(name), rec);

  let matched = 0;
  const unmatched = [];
  const records = [...byTeam.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([team, v]) => {
    const stat = statByName.get(normName(`${v.firstName} ${v.lastName}`));
    if (stat) matched++; else unmatched.push(`${v.firstName} ${v.lastName} (${team})`);
    return {
      team,
      firstName: v.firstName,
      lastName: v.lastName,
      asset: v.asset || null,
      stats: stat ? { ...stat } : null,
      source: stat ? statsSrc._source : null,
      approx: stat ? ['overall career HC W-L through 2025 season (July 2026), the era CFB27 reflects; bowl/conf/NC left to EA unless noted'] : null,
    };
  });

  const out = { generatedFrom: path.basename(refSave), generatedAt: new Date().toISOString().slice(0, 10), count: records.length, coaches: records };
  const outPath = path.join(__dirname, 'coaches.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  const withAsset = records.filter((r) => r.asset).length;
  const withStats = records.filter((r) => r.stats).length;
  console.log(`Wrote ${records.length} FBS coaches -> coaches.json`);
  console.log(`  with likeness asset: ${withAsset}/${records.length}`);
  console.log(`  with historic stats: ${withStats}/${records.length}`);
  const noAsset = records.filter((r) => !r.asset).map((r) => `${r.team} (${r.firstName} ${r.lastName})`);
  if (noAsset.length) console.log(`  NO shipped likeness: ${noAsset.join(', ')}`);
  if (unmatched.length) console.log(`  NO stats matched (${unmatched.length}): ${unmatched.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
