# Deutsch Drill

Drill German grammar: verb conjugation, and prepositions with their cases. Svelte frontend, tiny Node backend,
runs as a browser app window (Edge/Chrome/Chromium `--app`) with its own profile, so your normal browser is
untouched. Everything is configured through TOML files. Works on Linux, Windows and macOS.

## Install

Needs [Node.js](https://nodejs.org) 22.18 or newer, git, and a Chromium-based browser (Edge, Chrome, Chromium
or Brave — on Windows, Edge is always there).

### Windows

Step by step, starting from a fresh Windows 10/11 machine:

1. **Open PowerShell.** Press the Windows key, type `PowerShell` and open **Windows PowerShell** (no need to run
   it as administrator).

2. **Install git** (skip if `git --version` already prints a version):

   ```powershell
   winget install --id Git.Git -e
   ```

   Then **close PowerShell and open a new one**, so it finds `git`.

3. **Download the app.** This puts it in a `deutsch-drill` folder in your user folder (`C:\Users\<you>\deutsch-drill`):

   ```powershell
   cd ~
   git clone https://github.com/Bomberto2899/deutsch-drill.git
   cd deutsch-drill
   ```

4. **Run the setup script:**

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
   ```

   It installs Node.js (via `winget`) if it's missing or too old, installs the app's dependencies, builds it and
   adds **Deutsch Drill** to the Start menu. Windows may ask for administrator permission once while Node.js is
   installed — that's expected. Add `-Desktop` at the end for a desktop shortcut too.

5. **Start it:** open the Start menu and launch **Deutsch Drill**. It opens in its own Microsoft Edge window
   (separate from your normal browser). If Edge shows a welcome screen the first time, just close it.

**Updating:** in PowerShell, `cd ~\deutsch-drill`, then `.\update.ps1` (or double-click `update.cmd` in the folder).
It downloads the new version (`git pull`), reinstalls dependencies if needed, rebuilds and refreshes the shortcut;
`-Force` rebuilds even when nothing new was downloaded. If the app is open, close it and start it again afterwards.
If PowerShell says "running scripts is disabled on this system", use `.\update.cmd` instead. (First update from a
version without these files: run `git pull` once, then the setup script again — step 4.)

**Uninstalling:** run the setup script with `-Uninstall` to remove the shortcuts, then delete the
`deutsch-drill` folder. Your settings and progress stay in `%APPDATA%\deutsch-drill` and
`%LOCALAPPDATA%\deutsch-drill` — delete those too to remove everything.

**Without git:** on the GitHub page click **Code → Download ZIP**, extract it, open PowerShell in the extracted
folder (Windows 11: right-click inside the folder → *Open in Terminal*; Windows 10: Shift + right-click →
*Open PowerShell window here*) and continue with step 4. Updating then
means downloading the ZIP again.

**If something goes wrong:**

| Problem | Fix |
| --- | --- |
| `winget` is not recognized | Install **App Installer** from the Microsoft Store, or install [Node.js LTS](https://nodejs.org) and [Git](https://git-scm.com) by hand, then repeat. |
| "Node.js … still isn't available" | Close PowerShell, open a new one, `cd ~\deutsch-drill` and run the script again. |
| "running scripts is disabled on this system" | Use the exact command from step 4 (with `-ExecutionPolicy Bypass`). |
| The app window doesn't open | Check `%LOCALAPPDATA%\deutsch-drill\state\server.log`, and that Microsoft Edge or Google Chrome is installed. |

### Linux

```sh
git clone https://github.com/Bomberto2899/deutsch-drill.git && cd deutsch-drill
npm ci
npm run install-app   # build + ~/.local/bin/deutsch-drill + desktop entry + icon
deutsch-drill         # or launch "Deutsch Drill" from the app launcher
```

To update: `npm run update` (git pull, `npm ci` if dependencies changed, build, refresh the launcher; `--force`
rebuilds even when nothing new was pulled). Remove with `node scripts/install-app.ts --uninstall`.

### macOS

`npm ci && npm run build`, then start it with `npm run launch` (no Dock/Launchpad entry yet). To update: `npm run update`.

### How it runs

The launcher (`bin/deutsch-drill.ts`, with `bin/deutsch-drill` and `bin/deutsch-drill.cmd` as shims) starts the
backend on `127.0.0.1:47321` if it isn't running and opens the app window. The backend stops by itself about
15 seconds after the last app window closes. Env overrides: `DEUTSCH_DRILL_PORT`, `DEUTSCH_DRILL_BROWSER`
(path or command), `DEUTSCH_DRILL_CONFIG`, `DEUTSCH_DRILL_STATE`.

| | Linux / macOS | Windows |
| --- | --- | --- |
| Settings, verb and preposition files | `~/.config/deutsch-drill/` | `%APPDATA%\deutsch-drill\` |
| Progress, server log | `~/.local/state/deutsch-drill/` | `%LOCALAPPDATA%\deutsch-drill\state\` |
| Browser profile | `~/.local/share/deutsch-drill/` | `%LOCALAPPDATA%\deutsch-drill\` |

## Develop

`npm run dev` (Vite on :5173 with HMR, backend on :47322). Tests: `npm test`.
Validate your config: `npm run check`. Type-check: `npm run typecheck`.

Roadmap and progress: [TODO.md](TODO.md).

Navigation: every page has a **← Back** button (Esc does the same): module page (stats, settings) → module → menu.
German titles and labels show their English translation on hover (or keyboard focus).

## Prepositions

Each round shows a few sentences (3 by default) that share one gap. Type the preposition that fits all of them;
one sentence alone can be ambiguous, but together only one preposition works. After checking, the gaps are filled
in (contractions like *ins*, *zum*, *am* included), and a panel shows the preposition's meaning, the case it takes
and usage notes. For two-way prepositions (*in, an, auf, hinter, neben, über, unter, vor, zwischen*) each sentence
gets an `Akk · wohin?` / `Dat · wo?` label, and a round always mixes both. If your wrong answer is itself a
preposition, its meaning is shown too, so you see why it doesn't fit.

Keys: Enter checks, Enter again goes on, Alt+N skips, Esc goes back. Progress (right/wrong per preposition, last 50
results) is stored in `prepositions.json` in the progress folder and drives `order = "weakest-first"`.

29 prepositions ship: Akkusativ (durch, für, gegen, ohne, um, bis, entlang), Dativ (aus, bei, mit, nach, seit, von,
zu, gegenüber, ab), two-way (an, auf, hinter, in, neben, über, unter, vor, zwischen) and Genitiv (wegen, trotz,
während, statt).

## Stats & progress

Every checked answer is recorded per verb, tense and person in `verbs.json` in the progress folder (see the table above)
(totals plus the last 50 results per form). The **📊 Statistics** page of the verbs module shows verbs practised,
accuracy (all time and as measured by your settings), accuracy by person and by verb type, and the weakest verbs
with their weakest form.

"Weakness" (used by the stats page and `order = "weakest-first"`) is configured in `[progress]` in `verbs.toml`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `recent_answers` | `10` | Judge each form on its last N answers; `0` = all answers ever (max 50) |
| `only_enabled_forms` | `true` | Don't count answers for tenses/persons you've turned off. They're kept and count again when re-enabled |
| `unseen_weakness` | `0.5` | How weak a never-practised verb counts (0 = known verbs first, 1 = new verbs first) |

Weakest-first sorts verbs by weakness (1 − accuracy) and picks randomly from the weakest third.
The settings page can **forget seen verbs** (principal forms show again, scores kept) or **reset all progress**.
Both ask for confirmation and first save a backup as `verbs.json.bak.<unix-time>` next to the progress file.

## Config — `~/.config/deutsch-drill/` (Windows: `%APPDATA%\deutsch-drill\`)

Seeded on first run; existing files are never overwritten. Edits are picked up live.

| File | What |
| --- | --- |
| `config.toml` | Global: answer checking (case, ß/ss), theme, font size |
| `verbs.toml` | Verb module: tenses + persons to drill, order, what to show, filters, how weakness is measured |
| `verbs/*.toml` | One file per verb |
| `prepositions.toml` | Preposition module: sentences per round, order, translations, which cases/prepositions, weakness |
| `prepositions/*.toml` | One file per preposition, with its sentences |

The settings pages write back to `config.toml`, `verbs.toml` and `prepositions.toml` (comments in those files are regenerated).

### Verb files

```toml
infinitive   = "anfangen"
third_person = "fängt an"      # reveals stem changes and separable prefixes
praeteritum  = "fing an"
perfekt      = "hat angefangen"
meaning      = "to start, to begin"
example      = "Wann fängt der Kurs an?"   # optional
example_translation = "When does the course start?"   # optional, shown on hover
# konjunktiv_ii = "finge an"   # optional, only when the Konjunktiv II rule doesn't fit
tags         = ["my-list"]                 # optional, on top of derived tags

# Optional: exact forms where the rules don't fit. "a|b" or ["a", "b"] = several accepted answers.
[overrides.praesens]
ich = "wandere|wandre"
```

All forms are derived from the four principal forms:

| Tense | Derived from | Example (anfangen) |
| --- | --- | --- |
| Präsens | `infinitive` + `third_person` (stem changes, separable prefix) | ich fange an, du fängst an |
| Präteritum | `praeteritum` (ich = er; -st/-en/-t endings, -e- after t/d and in du after s-sounds) | ich fing an, du fingst an |
| Perfekt | `perfekt` (`hat`/`ist` conjugated + participle) | ich habe angefangen |
| Plusquamperfekt | `perfekt` (hatte/war + participle) | ich hatte angefangen |
| Futur I | `infinitive` (werden + infinitive) | ich werde anfangen |
| Futur II | `perfekt` (werden + participle + haben/sein) | ich werde angefangen haben |
| Imperativ | `infinitive` + `third_person`: du keeps e→i (gib, lies) but drops umlauts (fahr); -e optional (mach/mache); ihr = Präsens; Sie/wir = infinitive + pronoun | fang an!, fangt an!, fangen Sie an!, fangen wir an! |
| Konjunktiv II | würde + infinitive (main answer); the one-word form from `praeteritum` + umlaut + -e is accepted too (ginge, käme) | ich würde anfangen / ich finge an |
| Konjunktiv I | `infinitive`: stem + -e, -est, -e, -en, -et, -en | er fange an |
| Konjunktiv I Vergangenheit | `perfekt` (habe/sei + participle) | er habe angefangen |
| Konjunktiv II Vergangenheit | `perfekt` (hätte/wäre + participle) | ich hätte angefangen |
| Passiv (Präsens, Präteritum, Perfekt, Plusquamperfekt, Futur I, Konjunktiv II, Konjunktiv II Vergangenheit) | participle from `perfekt` + werden/wurde/ist … worden/… | es wird angefangen, es ist angefangen worden |
| Zustandspassiv | sein + participle | es ist angefangen |

Details:
- **Imperativ** has only du, ihr, Sie, wir (`persons = ["du", "ihr", "sie", "wir"]`, where `sie` = Sie). Modals and wissen
  have no imperative and are skipped when it's the only form enabled. A typed "!" is ignored.
- **Konjunktiv II**: for sein, haben, werden (tagged `auxiliary`), modals and wissen only the one-word form counts
  (wäre, hätte, würde, könnte, wüsste). For other verbs "würde …" is the main answer and the one-word form is accepted.
  When a wrong answer is shown, the accepted alternatives are listed too.
- Optional verb-file field `konjunktiv_ii = "stürbe"` sets the one-word Konjunktiv II (3rd person) where the rule
  doesn't fit; `"a|b"` accepts both (`"hülfe|hälfe"`).
- **Konjunktiv I** is mostly used for reported speech in the 3rd person, so only `er` is on by default.
- **Passive** forms exist only for verbs tagged `transitive` in their file (67 of the shipped verbs); add the tag to
  your own verbs to drill their passive. Only `er` and `sie` are on by default ("es wird gebaut", "sie werden gebaut").
- The settings page and `verbs.toml` group the tenses into Indikativ, Imperativ, Konjunktiv and Passiv.
- An override set to `""` removes a form for that verb.

Tense ids: `praesens`, `praeteritum`, `perfekt`, `plusquamperfekt`, `futur1`, `futur2`, `imperativ`, `konjunktiv1`,
`konjunktiv1_past`, `konjunktiv2`, `konjunktiv2_past`, `passiv_praesens`, `passiv_praeteritum`, `passiv_perfekt`,
`passiv_plusquamperfekt`, `passiv_futur1`, `passiv_konjunktiv2`, `passiv_konjunktiv2_past`, `zustandspassiv`.
Turn tenses on in `[tenses.<id>]` in `verbs.toml` or in the settings page (Präsens is on by default).
With several tenses on, the drill shows them side by side; the stats page has accuracy by tense.
Overrides work per tense: `[overrides.<tense id>]`. Derived tags: `regular`, `irregular`, `mixed`,
`separable`, `stem-change`. Tags set in the files: `modal`, `auxiliary` (sein/haben/werden), `transitive` (enables passive).

### Preposition files

```toml
preposition = "in"                 # the answer
meaning     = "in; into"
case        = "wechsel"            # akkusativ | dativ | genitiv | wechsel (two-way)
notes       = "wohin? → Akkusativ, wo? → Dativ. Contractions: im = in dem, ins = in das."   # optional
accept      = []                   # optional: other answers that count, e.g. ["anstatt"] for statt
tags        = []                   # optional, for the [filter]

[[sentences]]
text        = "Wir gehen heute Abend [ins] Kino."   # exactly one [gap]
translation = "We're going to the cinema tonight."  # optional, shown on hover
case        = "akkusativ"          # required for two-way prepositions; otherwise the file's case
```

- The gap holds the word as it appears in the sentence, so contractions (`[ins]`, `[zum]`, `[am]`) are fine. The
  answer is always `preposition` (or one of `accept`).
- Write sentences where the gap isn't the first word (the answer is lower case), and that point to this one
  preposition. The drill shows several at once, so each one alone may still fit another preposition.
- Two-way prepositions need Akkusativ and Dativ sentences, since every round with 2+ sentences shows both.

## Adding a module

Each module has a shared, a server and a client half:

1. `src/shared/modules/<id>/` — pure logic (types, rules, settings defaults).
2. `src/server/modules/<id>.ts` — a `ServerModule` (default settings, commented TOML renderer, validation,
   data loader); register in `src/server/modules/registry.ts`. Data ships in `defaults/<id>/`.
3. `src/web/modules/<id>/` — a `Drill` component plus any sub-pages (settings, stats, …, each served at
   `#/m/<id>/<page>` with a top-bar button); register in `src/web/modules/registry.ts`.

Adding a tense to the verb module = one `TenseGroup` in `src/shared/modules/verbs/tenses/` registered
in `tenses/index.ts`; it shows up in the settings page and `verbs.toml` automatically.
