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
2. Compares each to the real coach for that school (bundled in `coaches.json`).
3. For any coach that's generic/wrong **and** has a real likeness in the game,
   sets the correct name + face.
4. Writes each coach's real **career record** (wins/losses, bowls, conference
   titles, national titles) into the save's coach stats.
5. Saves everything to a **new copy** named `<yoursave>-REALCOACHES`. Your
   original save is never touched — load the copy in the game.

The correct game **schema is auto-detected** from each save, so the tool works
across game patches as long as a matching schema file is bundled (both the
pre-patch and current schemas ship in the release).

## Coaches covered

138 FBS coaches are bundled, matched to their team. 137 of 138 have a real in-game likeness shipped by EA (face + portrait); the rest get the correct name but keep a generic face, noted below.

<details>
<summary>Full list (click to expand)</summary>

| Team | Coach | Real likeness |
|---|---|---|
| Air Force | Troy Calhoun | Yes |
| Akron | Joe Moorhead | Yes |
| Alabama | Kalen DeBoer | Yes |
| App St. | Dowell Loggains | Yes |
| Arizona | Brent Brennan | Yes |
| Arizona State | Kenny Dillingham | Yes |
| Arkansas | Ryan Silverfield | Yes |
| Arkansas State | Butch Jones | Yes |
| Army | Jeff Monken | Yes |
| Auburn | Alex Golesh | Yes |
| Ball State | Mike Uremovich | Yes |
| Baylor | Dave Aranda | Yes |
| Boise State | Spencer Danielson | Yes |
| Boston College | Bill O'Brien | Yes |
| Bowling Green | Eddie George | Yes |
| Buffalo | Pete Lembo | Yes |
| BYU | Kalani Sitake | Yes |
| C. Carolina | Ryan Beard | Yes |
| C. Michigan | Matt Drinkall | Yes |
| California | Tosh Lupoi | Yes |
| Charlotte | Tim Albin | Yes |
| Cincinnati | Scott Satterfield | Yes |
| Clemson | Dabo Swinney | Yes |
| Colorado | Deion Sanders | Yes |
| Colorado State | Jim Mora | Yes |
| Delaware | Ryan Carty | Yes |
| Duke | Manny Diaz | Yes |
| E. Michigan | Chris Creighton | Yes |
| East Carolina | Blake Harrell | Yes |
| FIU | Willie Simmons | Yes |
| FLA Atlantic | Zach Kittley | Yes |
| Florida | Jon Sumrall | Yes |
| Florida State | Mike Norvell | Yes |
| Fresno State | Matthew Entz | Yes |
| Ga Southern | Clay Helton | Yes |
| Georgia | Kirby Smart | Yes |
| Georgia State | Dell McGee | Yes |
| Georgia Tech | Brent Key | Yes |
| Hawai'i | Timmy Chang | Yes |
| Houston | Willie Fritz | Yes |
| Illinois | Bret Bielema | Yes |
| Indiana | Curt Cignetti | Yes |
| Iowa | Kirk Ferentz | Yes |
| Iowa State | Jimmy Rogers | Yes |
| James Madison | Billy Napier | Yes |
| Jax State | Charles Kelly | Yes |
| Kansas | Lance Leipold | Yes |
| Kansas State | Collin Klein | Yes |
| Kennesaw St. | Jerry Mack | Yes |
| Kent State | Mark Carney | Yes |
| Kentucky | Will Stein | Yes |
| Liberty | Jamey Chadwell | Yes |
| Louisiana | Michael Desormeaux | Yes |
| Louisiana Tech | Sonny Cumbie | Yes |
| Louisville | Jeff Brohm | Yes |
| LSU | Lane Kiffin | Yes |
| Marshall | Tony Gibson | Yes |
| Maryland | Mike Locksley | Yes |
| Memphis | Charles Huff | Yes |
| Miami | Mario Cristobal | Yes |
| Miami (OH) | Chuck Martin | Yes |
| Michigan | Kyle Whittingham | Yes |
| Michigan State | Pat Fitzgerald | Yes |
| Middle Tenn | Derek Mason | Yes |
| Minnesota | P. J. Fleck | Yes |
| Mississippi St | Jeff Lebby | Yes |
| Missouri | Eliah Drinkwitz | Yes |
| Missouri State | Casey Woods | Yes |
| Navy | Brian Newberry | Yes |
| NC State | Dave Doeren | Yes |
| NDSU | Tim Polasek | Yes |
| Nebraska | Matt Rhule | Yes |
| Nevada | Jeff Choate | Yes |
| New Mexico | Jason Eck | Yes |
| New Mexico St. | Tony Sanchez | Yes |
| NIU | Rob Harley | Yes |
| North Carolina | Bill Belichick | Yes |
| North Texas | Neal Brown | No — generic face |
| Northwestern | David Braun | Yes |
| Notre Dame | Marcus Freeman | Yes |
| Ohio | John Hauser | Yes |
| Ohio State | Ryan Day | Yes |
| Oklahoma | Brent Venables | Yes |
| Oklahoma State | Eric Morris | Yes |
| Old Dominion | Ricky Rahne | Yes |
| Ole Miss | Pete Golding | Yes |
| Oregon | Dan Lanning | Yes |
| Oregon State | JaMarcus Shephard | Yes |
| Penn State | Matt Campbell | Yes |
| Pittsburgh | Pat Narduzzi | Yes |
| Purdue | Barry Odom | Yes |
| Rice | Scott Abell | Yes |
| Rutgers | Greg Schiano | Yes |
| Sac State | Alonzo Carter | Yes |
| Sam Houston | Phil Longo | Yes |
| San Diego St. | Sean Lewis | Yes |
| San Jose State | Ken Niumatalolo | Yes |
| SMU | Rhett Lashlee | Yes |
| South Alabama | Major Applewhite | Yes |
| South Carolina | Shane Beamer | Yes |
| Southern Miss | Blake Anderson | Yes |
| Stanford | Tavita Pritchard | Yes |
| Syracuse | Fran Brown | Yes |
| TCU | Sonny Dykes | Yes |
| Temple | K.C. Keeler | Yes |
| Tennessee | Josh Heupel | Yes |
| Texas | Steve Sarkisian | Yes |
| Texas A&M | Mike Elko | Yes |
| Texas State | G. J. Kinne | Yes |
| Texas Tech | Joey McGuire | Yes |
| Toledo | Mike Jacobs | Yes |
| Troy | Gerad Parker | Yes |
| Tulane | Will Hall | Yes |
| Tulsa | Tre Lamb | Yes |
| UAB | Alex Mortensen | Yes |
| UCF | Scott Frost | Yes |
| UCLA | Bob Chesney | Yes |
| UConn | Jason Candle | Yes |
| UL Monroe | Bryant Vincent | Yes |
| UMass | Joe Harasymiak | Yes |
| UNLV | Dan Mullen | Yes |
| USC | Lincoln Riley | Yes |
| USF | Brian Hartline | Yes |
| Utah | Morgan Scalley | Yes |
| Utah State | Bronco Mendenhall | Yes |
| UTEP | Scotty Walden | Yes |
| UTSA | Jeff Traylor | Yes |
| Vanderbilt | Clark Lea | Yes |
| Virginia | Tony Elliott | Yes |
| Virginia Tech | James Franklin | Yes |
| W. Kentucky | Ty Helton | Yes |
| W. Michigan | Lance Taylor | Yes |
| Wake Forest | Jake Dickert | Yes |
| Washington | Jedd Fisch | Yes |
| Washington St. | Kirby Moore | Yes |
| West Virginia | Rich Rodriguez | Yes |
| Wisconsin | Luke Fickell | Yes |
| Wyoming | Jay Sawvel | Yes |

</details>

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
  [Coaches covered](#coaches-covered) — so he gets the correct name but keeps a
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

### Adding a schema for a new game patch

Drop the new schema file into `schema\`, named `CFB27_<major>_<minor>.gz` (the
tool also accepts `C27_<major>_<minor>.gz`), and rebuild. A save whose version
has no bundled schema gets a clear error naming the exact file to add.

### Regenerating the dataset (optional)

`coaches.json` is generated from `stats-source.json` (hand-collected career
records, cited inside the file) plus likeness assets read from a clean save:

```
node build-dataset.mjs path\to\a\clean\DYNASTY-save
```

Edit `stats-source.json` (records) or `GENERIC_FILLS` in `build-dataset.mjs`
(which real coach belongs at a generic school) and re-run.

## Credits & disclaimer

Built on the [`madden-franchise`](https://github.com/bep713/madden-franchise)
save library. This is an unofficial fan tool and is not affiliated with or
endorsed by EA Sports. Use at your own risk; always keep backups of your saves.
