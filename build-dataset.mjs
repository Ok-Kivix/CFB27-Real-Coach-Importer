#!/usr/bin/env node
// DEV-TIME dataset builder (not shipped in the standalone folder). Regenerates
// coaches.json — the list of coaches this tool imports — from two hand-curated
// sources, with NO game save required:
//   - GENERIC_FILLS: the teams EA ships with a GENERIC placeholder head coach,
//     mapped to the real coach + their shipped Unique_C_ likeness (assetName /
//     presentationId / portrait), resolved via frosty-cli portrait-slots
//     (see docs/vision/REAL_COACHES.md).
//   - stats-source.json: their real-life COLLEGE career records, cited inline.
//
// EA already ships every other FBS coach correctly (name, face, and career
// stats), so the tool only needs these — nothing is harvested from a save.
//
// Usage: node build-dataset.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function main() {
  // Real-life career records, keyed by coach NAME.
  const statsPath = path.join(__dirname, 'stats-source.json');
  const statsSrc = existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, 'utf8')) : { coaches: {}, _source: null };
  const normName = (s) => String(s || '').trim().toLowerCase().replace(/[.\s]+/g, ' ').replace(/\s+/g, ' ');
  const statByName = new Map();
  for (const [name, rec] of Object.entries(statsSrc.coaches || {})) statByName.set(normName(name), rec);

  const unmatched = [];
  const records = Object.entries(GENERIC_FILLS)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([team, v]) => {
      const stat = statByName.get(normName(`${v.firstName} ${v.lastName}`));
      if (!stat) unmatched.push(`${v.firstName} ${v.lastName} (${team})`);
      return {
        team,
        firstName: v.firstName,
        lastName: v.lastName,
        asset: v.asset || null,
        stats: stat ? { ...stat } : null,
        source: stat ? statsSrc._source : null,
        approx: stat ? ['overall COLLEGE career HC W-L through 2025 season (July 2026), the era CFB27 reflects'] : null,
      };
    });

  const out = { generatedAt: new Date().toISOString().slice(0, 10), count: records.length, coaches: records };
  const outPath = path.join(__dirname, 'coaches.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  const withAsset = records.filter((r) => r.asset).length;
  const withStats = records.filter((r) => r.stats).length;
  console.log(`Wrote ${records.length} coaches -> coaches.json`);
  console.log(`  with likeness asset: ${withAsset}/${records.length}`);
  console.log(`  with historic stats: ${withStats}/${records.length}`);
  const noAsset = records.filter((r) => !r.asset).map((r) => `${r.team} (${r.firstName} ${r.lastName})`);
  if (noAsset.length) console.log(`  NO shipped likeness: ${noAsset.join(', ')}`);
  if (unmatched.length) console.log(`  NO stats (${unmatched.length}): ${unmatched.join(', ')}`);
}

main();
