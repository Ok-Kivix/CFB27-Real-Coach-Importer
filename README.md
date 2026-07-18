# CFB27 Real Coach Importer

A small Windows tool that fixes the **generic / missing head coaches** in an
**EA Sports College Football 27** dynasty save. It gives each affected coach
their real name, their real in-game **likeness** (3D head + portrait, using the
game's own coach art), and their real-life **historic career record** — all as a
pure save edit. No game files are modified; nothing is installed globally.

On a fresh CFB27 roster, EA ships most head coaches as real, correct likenesses,
but leaves a handful as generic placeholders — for example **Deion Sanders,
Kirk Ferentz, Mario Cristobal, Bill Belichick, Bronco Mendenhall, Blake
Anderson**. This tool detects those and restores them.

## Setup (once)

1. Install [Node.js 20+](https://nodejs.org) if you don't have it.
2. Double-click **`setup.cmd`**. It installs the dependencies and bundles a local
   copy of Node so the tool runs on its own afterward.

## Use

Double-click **`run.cmd`**, or from a command prompt in this folder:

```
run.cmd                 pick your save, then it corrects a COPY
run.cmd --dry-run       audit only — show what would change, write nothing
run.cmd --names-only    rename + face only; skip historic stats
run.cmd --json          machine-readable audit
run.cmd "C:\full\path\to\DYNASTY-MYSAVE"
```

With no path given, it auto-detects your saves folder at
`Documents\EA SPORTS College Football 27\saves` (including a OneDrive-redirected
Documents), lists your dynasty saves, and lets you pick one by number. If none
are found it asks for a full path.

## What it does

1. Reads every FBS head coach in the save.
2. Compares each to the real coach for that school (bundled in `coaches.json`).
3. For any coach that's generic/wrong **and** has a real likeness in the game,
   sets the correct name + face.
4. Writes each coach's real **career record** (wins/losses, bowls, conference
   titles, national titles) into the save's coach stats.
5. Saves everything to a **new copy** named `<yoursave>-REALCOACHES`. Your
   original save is never touched — load the copy in the game.

## Safety notes

- **Writes a copy, never your original.** Load the `-REALCOACHES` file in-game.
- **Your own coach is left alone** (only CPU coaches are edited).
- The **name + face** swap is confirmed working in-game. The **historic-stat**
  write has not been fully game-tested yet — if a save misbehaves, re-run with
  `--names-only` for the proven-safe path.
- A few coaches have no likeness shipped in the game (e.g. Neal Brown) — they get
  the correct name but keep a generic face. Some replaced coaches also have no
  career-stat slot in the save, so their record can't be attached (the audit
  labels these `stats-ref empty`).

## How the data is built (optional)

`coaches.json` is generated from `stats-source.json` (hand-collected career
records, cited inside the file) plus the likeness assets. To regenerate it you
need a clean CFB27 save to read likeness data from:

```
node build-dataset.mjs path\to\a\clean\DYNASTY-save
```

Edit `stats-source.json` (records) or `GENERIC_FILLS` in `build-dataset.mjs`
(which real coach belongs at a generic school) and re-run.

## Credits & disclaimer

Built on the [`madden-franchise`](https://github.com/bep713/madden-franchise)
save library. This is an unofficial fan tool and is not affiliated with or
endorsed by EA Sports. Use at your own risk; always keep backups of your saves.
