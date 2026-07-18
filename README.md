# CFB27 Real Coach Importer

A small Windows tool that fixes the **generic / missing head coaches** in an
**EA Sports College Football 27** dynasty save. It gives each affected coach
their real name, their real in-game **likeness** (3D head + portrait, using the
game's own coach art), and their real-life **historic career record** — all as a
pure save edit. No game files are modified; your original save is never touched.

On a fresh CFB27 roster, EA ships most head coaches as real, correct likenesses,
but leaves a handful as generic placeholders — for example **Deion Sanders,
Kirk Ferentz, Mario Cristobal, Bill Belichick, Bronco Mendenhall, Blake
Anderson**. This tool detects those and restores them.

## Download & use (no install)

1. Download **`CFB27-Real-Coaches.zip`** from the
   [latest release](https://github.com/KivJoy/CFB27-Real-Coach-Importer/releases/latest).
2. Unzip it anywhere.
3. Make sure CFB27 is closed, then double-click **`Real-Coaches.exe`**.
4. Pick your dynasty save from the list (or paste a path).
5. Load the newly created **`<yoursave>-REALCOACHES`** copy in CFB27.

**Node.js is not required** — the `.exe` is self-contained. Keep the files that
ship next to it (`coaches.json`, `schema\`, `runtime\`) in the same folder; the
tool reads them at startup.

### Options

Open a Command Prompt in the unzipped folder to pass flags:

```
Real-Coaches.exe                 pick your save, then correct a COPY
Real-Coaches.exe --dry-run       audit only — show what would change, write nothing
Real-Coaches.exe --names-only    rename + face only; skip historic stats
Real-Coaches.exe --json          machine-readable audit
Real-Coaches.exe "C:\path\to\DYNASTY-MYSAVE"
```

With no path given, it auto-detects your saves folder at
`Documents\EA SPORTS College Football 27\saves` (including a OneDrive-redirected
Documents), lists your dynasty saves, and lets you pick one by number.

## What it does

1. Reads every FBS head coach in the save.
2. Compares each to who should be coaching that school.
3. For any coach that's generic/wrong **and** has a real likeness in the game,
   sets the correct name + face.
4. For those corrected coaches only, writes their real **career record**
   (wins/losses, bowls, conference titles, national titles) — because a replaced
   generic inherited the placeholder's empty `0-0` record. Coaches EA already
   ships correctly are **left untouched**; the game already gives them their real
   career stats, so there's nothing to fix.
5. Saves everything to a **new copy** named `<yoursave>-REALCOACHES`. Your
   original save is never touched — load the copy in the game.

The game **schema is auto-selected** from each save (falling back to the newest
bundled schema for versions it doesn't recognize), so the tool works across game
patches without needing an update for every new patch.

## Coaches actually imported

EA ships a fresh CFB27 roster with real, correct coaches for almost every FBS
team already — the tool only needs to *replace* the handful shipped as generic
placeholders. This is the full list of that correction:

| Team | Placeholder replaced with | Real likeness | Career record |
|---|---|---|---|
| Colorado | Deion Sanders | Yes | 16–21 |
| Iowa | Kirk Ferentz | Yes | 213–128 |
| Miami | Mario Cristobal | Yes | 97–79 |
| North Carolina | Bill Belichick | Yes | 4–8 (college only) |
| North Texas | Neal Brown | No — no shipped likeness, name only | 72–51 |
| Southern Miss | Blake Anderson | Yes | 74–54 |
| Utah State | Bronco Mendenhall | Yes | 146–95 |

These seven are the only coaches ever changed. Everyone else on the roster is
already correct as EA shipped them — name, face, and career stats — and is left
untouched.

> Career records are **college** head-coaching records (the game only tracks
> college coaching). Bill Belichick's is his 2025 UNC record, not his NFL career.

## Editing the coach data

`coaches.json` sits next to the `.exe` and is plain, editable JSON. Open it in
Notepad to add or change a coach, save, and re-run the tool — no rebuild needed.

## Safety notes

- **Writes a copy, never your original.** Load the `-REALCOACHES` file in-game.
- **Your own coach is left alone** (only CPU coaches are edited).
- The **name + face** swap is confirmed working in-game. The **historic-stat**
  write has not been fully game-tested yet — if a save misbehaves, re-run with
  `--names-only` for the proven-safe path.
- One coach (Neal Brown) has no likeness shipped in the game — see
  [Coaches actually imported](#coaches-actually-imported) — so he gets the correct name but keeps a
  generic face. Some replaced coaches also have no career-stat slot in the save,
  so their record can't be attached (the audit labels these `stats-ref empty`).

## Building from source (developers)

Requires [Node.js 20+](https://nodejs.org).

```
npm install
npm start                        run against a save (same flags as above)
node index.js --dry-run          audit only
npm run build-exe                produce build\dist\CFB27-Real-Coaches.zip
```

`npm run build-exe` bundles a Node runtime into a single Windows `.exe` (via
[`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg)) and assembles the distributable
folder + zip. It preflights first — validating `coaches.json` and loading every
bundled schema — so a broken asset fails the build rather than a user's run.

### Schemas & game patches

The CFB27 table layouts this tool reads and writes (coach identity, likeness, and
career stats) are stable across game patches — three different schema versions
(468, 472, 809) parse the same save byte-identically. So the tool prefers an exact
version match but otherwise falls back to the newest bundled schema, and a save
from a brand-new patch still works.

If you ever need to force a specific schema, drop a `CFB27_<major>_<minor>.gz` (or
`C27_<major>_<minor>.gz`) file into the `schema\` folder next to the exe — the
newest file there is used for any save whose version isn't an exact match.

### Regenerating the dataset (optional)

`coaches.json` is generated from two hand-curated sources — `GENERIC_FILLS` in
`build-dataset.mjs` (which real coach + likeness belongs at each generic school)
and `stats-source.json` (their cited college career records). No game save is
needed:

```
node build-dataset.mjs
```

Edit either source and re-run to regenerate `coaches.json`.

## Credits & disclaimer

Built on the [`madden-franchise`](https://github.com/bep713/madden-franchise)
save library. This is an unofficial fan tool and is not affiliated with or
endorsed by EA Sports. Use at your own risk; always keep backups of your saves.
