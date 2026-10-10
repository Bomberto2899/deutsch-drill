# TODO

Workflow: new requests are added here first, then checked off when done. Every change also updates the README where relevant.

## Done — v0.1 (2026-10-10)

### Foundation
- [x] Project scaffold: Vite + Svelte 5 + TypeScript frontend, tiny Node backend, Vitest
- [x] Modular architecture: each module has shared / server / client parts plus registries
- [x] Hash router: menu → module → module settings, global settings
- [x] Run as a desktop app: `deutsch-drill` launcher, Chromium `--app` window with its own profile, server stops when the window closes
- [x] `npm run install-app`: build, `~/.local/bin` symlink, desktop entry and icon
- [x] Launcher logged in `~/Documents/omarchy-cosmic-setup.md`

### Config (Omarchy-style)
- [x] TOML config in `~/.config/deutsch-drill/`, seeded on first run, never overwritten
- [x] `config.toml`: answer checking (case, ß/ss), theme, font size
- [x] `verbs.toml`: tenses and persons, order, what the card shows, tag/verb filters
- [x] One file per verb in `verbs/`, all with the same 4 principal forms
- [x] Settings pages write back to the TOML files (autosave)
- [x] Live reload when a config file changes on disk
- [x] Error banner for invalid files (file, line, message); bad values fall back to defaults
- [x] `npm run check` validates all config from the terminal
- [x] Progress (seen verbs, per-form right/wrong) in `~/.local/state/deutsch-drill/`

### Verbs module
- [x] Conjugation engine: forms derived from the principal forms, with per-verb `[overrides]`
- [x] Präsens: stem changes, -t/-d stems, s-sounds, -eln/-ern, separable verbs, modals/wissen, werden/haben
- [x] Pluggable tense groups (adding a tense = one file)
- [x] 127 verbs, each with meaning and example sentence (all modals, common irregulars, everyday and separable verbs)
- [x] Derived tags: regular, irregular, mixed, separable, stem-change (+ `modal` in files)
- [x] Drill page: verb card, principal forms for new verbs (always/unseen/never + Alt+H hint), input grid
- [x] Keyboard flow: Enter next field / check / next verb, Alt+N skip, Esc back
- [x] Answer checking: case-insensitive, umlauts required, ss for ß, typed pronoun ignored, alternatives (`a|b`)
- [x] Session score; order modes random / alphabetical / weakest-first
- [x] Tests: Präsens tables for every rule class, derived tags, answer checking

## Done — v0.2 (2026-10-10)
- [x] ← Back button in the top bar on every page except the menu (module settings → module → menu; Esc does the same)
- [x] English translations for all example sentences (`example_translation` in verb files), shown as a tooltip on hover or keyboard focus

## Done — v0.3 (2026-10-10)
- [x] 📊 Stats page in the verbs module: verbs practised, answers, accuracy (all time / measured), accuracy by person and by verb type (bar charts with hover detail), weakest verbs table with weakest form and last practised, "show all"
- [x] Module sub-pages: modules can register pages (`#/m/<id>/<page>`) that get a top-bar button; settings moved to this mechanism
- [x] `[progress]` settings in `verbs.toml` and the GUI: `recent_answers`, `only_enabled_forms`, `unseen_weakness`
- [x] Progress keeps the last 50 results per form (older progress files still work, using all-time counts)
- [x] Reset actions with confirmation dialogs: forget seen verbs, reset all progress; both back up `verbs.json` first
- [x] English translation on hover for German titles and labels (page titles, breadcrumbs, menu, principal-form labels, tense names, result verdict)
- [x] Tests for the progress logic
- [x] `only_enabled_forms` only filters when calculating; progress for disabled forms is kept and counts again when re-enabled (tested, documented in the setting)

## Done — v0.4 (2026-10-10)
- [x] Präteritum: derived from the `praeteritum` principal form (weak/strong endings, linking -e-, separable verbs)
- [x] Perfekt: conjugated haben/sein from the `perfekt` principal form + participle
- [x] Drill shows enabled tenses side by side (correct answer under the input); drill page widens for this
- [x] Stats: accuracy by tense chart
- [x] Tests: Präteritum and Perfekt tables (every shipped verb checked by hand)
- [x] New tense sections added to the existing `verbs.toml` (off by default)

## Done — v0.5 (2026-10-10)
- [x] Imperativ: du / ihr / Sie / wir (gib!, lies!, fahr!, mach/mache!, fang an!, sei!, seid!); modals and wissen have none and are skipped; trailing "!" accepted
- [x] Konjunktiv II: würde-form as main answer with the one-word form accepted; one-word only for sein/haben/werden, modals, wissen
- [x] Plusquamperfekt (hatte/war + participle), Futur I (werden + infinitive), Konjunktiv II Vergangenheit (hätte/wäre + participle)
- [x] Tenses can define their own persons and labels (Imperativ: "Sie"); verbs without any enabled form are left out of the pool
- [x] Verb files: optional `konjunktiv_ii` field; `auxiliary` tag on sein/haben/werden; empty override removes a form
- [x] Wrong answers show the accepted alternatives ("würde gehen · also ginge")
- [x] Tests for all five; every shipped verb checked by hand; new sections added to the existing `verbs.toml`

## Done — v0.6 (2026-10-10)
- [x] Futur II (werden + participle + haben/sein)
- [x] Konjunktiv I (er gehe, er habe, er sei; -eln/-ern handled) and Konjunktiv I Vergangenheit (habe/sei + participle); only `er` on by default
- [x] Passive as its own section: Passiv Präsens, Präteritum, Perfekt, Plusquamperfekt, Futur I, Konjunktiv II, Konjunktiv II Vergangenheit, and Zustandspassiv; only for verbs tagged `transitive` (67 shipped verbs tagged); `er` + `sie` on by default
- [x] Tenses grouped into Indikativ / Imperativ / Konjunktiv / Passiv (settings page and `verbs.toml`); tenses can set default persons
- [x] Tense heading always shown above the inputs; stats tense chart shows only enabled tenses or tenses with answers
- [x] Tests for all new forms; new sections added to the existing `verbs.toml`

## Next

- [ ] Portability: make it work on Windows (for a friend). A setup script is fine, but nothing in the repo should be Linux-only. Known Linux-only parts today:
  - `bin/deutsch-drill` (bash) and `scripts/install-app.sh` (sh, `~/.local/bin`, `.desktop` entry, hicolor icon)
  - Launcher assumes a `chromium` binary on PATH (Windows: Chrome/Edge, found via the registry or the usual install paths)
  - Uses `curl` and `notify-send` in the launcher
  - Config/state paths follow XDG (Windows should use `%APPDATA%` / `%LOCALAPPDATA%`)
  - Plan: move the launcher logic into a cross-platform Node script (`bin/deutsch-drill.ts`) with thin per-OS shims, a `setup` script per OS (Windows: Start-menu shortcut), and a test run on Windows

## Ideas / later
- [ ] Verbs with both auxiliaries (fahren: ist/hat gefahren; ziehen, treten): accept either in Perfekt
- [ ] In-app verb editor / adder
- [ ] Follow the Omarchy theme
- [ ] Reflexive verbs (sich freuen → freue mich)
- [ ] Next modules: prepositions + case, articles / adjective endings
