# BUG-TO-FIX.md

Instructions for fixing all known bugs and implementing the agreed improvements in
musicpad-js. Written for an LLM (or human) implementer with no prior context on this
repository. Work through the tasks in the order given: they are sorted so that earlier
fixes do not invalidate later ones.

All findings below were reproduced empirically on 2026-07-04 against the current `main`.
Each task lists its repro so you can confirm the bug before and after your change.

---

## 1. Project context

- **What it is**: a JavaScript port of Musicpad (a plain-text music notation by Loïc
  Prot, originally a Perl CGI). It converts Musicpad text to MIDI bytes and MusicXML,
  entirely client-side.
- **Engine**: `src/musicpad.js` (~2800 lines, IIFE, no dependencies). Lines 1–1200 are
  data tables (drum map, instrument map, guitar chords, keyboard chord intervals); the
  parser/renderer starts at `class MusicpadEngine` (~line 1285).
- **App shell**: `src/musicpad-html.html` (editor UI, SoundFont synth, MIDI player).
- **Generated artifact**: `src/musicpad.html` is **generated** — never edit it directly.
  Rebuild it with the bash script `src/build`, which splices `musicpad-docs.html`,
  `musicpad.js`, `songlist.js`, and `A320U.sf2` (base64) into `musicpad-html.html`.
  `docs/index.html` is the published copy of `src/musicpad.html`; after rebuilding,
  verify they should match (they did at the start of this work) and update it too.
- **Reference spec**: `project-docs/musicpad.md` (the authoritative behavior document)
  and `project-docs/musicpad.perl` (the original Perl implementation).
- **Tests**: `node tests/musicpad.test.js`. No test framework; plain asserts. The suite
  includes **byte-hash regression tests** over 15 bundled songs
  (`project-docs/songs/*.mpd`) and 11 focused cases.

### Ground rules

1. **The hash-regression tests are the compatibility contract.** None of the fixes in
   sections 2–4 should change the MIDI bytes produced for any currently-valid input, so
   after every task `node tests/musicpad.test.js` must pass **without touching any
   expected hash**. The only sanctioned exceptions are Task 6 (see its verification
   notes) and the explicitly gated section 5.
2. For every fix, **add a test** to `tests/musicpad.test.js` following the existing
   style (a small function called from `main()`, or a new entry in
   `EXPECTED_FOCUSED_CASES` when byte-exact output is the point).
3. Error messages thrown by the engine go through `MusicpadEngine.error(message)`,
   which prefixes `Musicpad error: `. Keep that convention.
4. After all engine/app changes: run `src/build` (bash) to regenerate
   `src/musicpad.html`, and refresh `docs/index.html` from it.

---

## 2. Engine bugs (fix all, in this order)

### Task 1 — Unbalanced `(` in a macro causes runaway memory growth (hang)

- **Severity**: high (frozen browser tab).
- **Repro**: `musicpadToMidi('m$a( (c e')` → string grows every loop iteration until
  `RangeError: Invalid string length` (in a browser: frozen tab / OOM).
- **Root cause**: `getBound()` (src/musicpad.js ~line 2016). When the close delimiter is
  missing, `locclose` is `-1`; the branch `if (locopen < locclose && locopen !== -1)` is
  false, so the else branch sets `loc = -1` and decrements `level`, eventually returning
  `-1` as if a match was found. `processMacro` then computes `macend = -1` and executes
  `this.string = this.string.slice(0, macpos) + this.string.slice(macend + 1)` — i.e.
  `slice(0)`, appending the entire string to its own prefix. The `m$` marker is still
  present, so the loop repeats and the string doubles each time.
- **Fix**: in `getBound` (and mirror the equivalent hardening in `getBoundRev`), when a
  close delimiter cannot be found while `level > 0`, call
  `this.error('matching (/) error')` instead of continuing with `-1`. Concretely: when
  `locclose === -1` (and `locopen` is not a valid deeper open before it), treat the scan
  as failed. Additionally, in `processMacro`, defensively `this.error(...)` if
  `getBound` returns `-1`.
- **Verify**: the repro above now throws a clear `Musicpad error: matching (/) error`
  quickly; full test suite unchanged.

### Task 2 — `loose`/`velvar` without the quality parameter: NaN crash / silent notes

- **Severity**: high (silent data corruption).
- **Repro**:
  - `musicpadToMidi('tempo120 velvar20 c d e')` → no error, but every note has
    velocity `NaN` in the IR, which the MIDI writer masks to **velocity 0** — players
    treat that as note-off, so the song is silent.
  - `musicpadToMidi('tempo120 loose100 c d e')` → throws the unhelpful
    `Musicpad error: invalid MIDI delta NaN`.
- **Root cause**: in `addTrackIr`, the `loose` handler (~line 1685) does
  `looseq = parts[1]` and the `velvar` handler (~line 1691) does `velvarq = parts[1]`
  with no default. `rndq(undefined)` → `Number(undefined)` = NaN → NaN propagates into
  timing (loose) or velocity (velvar).
- **Fix**: default the quality to `1` when `parts[1]` is missing/empty, i.e.
  `looseq = parts[1] == null || parts[1] === '' ? 1 : parts[1];` (same for `velvarq`).
  Also validate `Number(parts[0])` is finite, else `this.error(...)`. As
  defense-in-depth, make `rndq(q)` throw a clear error if `Number(q)` is NaN and the
  text is not `'G'`.
- **Verify**: both repros produce audible/valid output (`loose100 c d e` renders,
  `velvar20 c d e` has non-zero velocities). Existing humanization tests
  (`testMidiFromIrHumanization`) still pass byte-identically — they always pass the
  quality parameter, so no hashes move.

### Task 3 — Chained repeat factors are silently swallowed (`(c e)*2*3` → 4 notes, not 12)

- **Severity**: high (silent wrong output).
- **Repro**: `musicpadToIr('tempo120 (c e)*2*3')` yields 4 noteGroups; expected 12.
  Also `c*2*3` yields 2, expected 6.
- **Root cause**: `expandMul()` (~line 1473). The factor scanner uses the character
  class `/[\d.*]/`, so for `*2*3` it consumes the whole string `2*3` as "the factor",
  `parseInt('2*3')` returns 2, and the trailing `*3` is discarded from `post`.
- **Fix**: restrict the factor scan to digits only (use `isDigitCode`, not the
  `/[\d.*]/` class). That alone is not enough, though: after expanding `(c e)*2` into
  `c e c e`, a leftover `*3` would bind to the last repeated token (`e`), not to the
  whole group — which is not the intended `((c e)*2)*3` semantics. So combine the
  digits-only scan with factor coalescing: after parsing `what` and `rpt`, check
  whether `post` (the text after the factor) begins with optional whitespace, `*`, and
  another digit run; if so, consume it and multiply the factors (`*2*3` → rpt 6,
  `*2*3*2` → rpt 12), repeating until no further `*<digits>` follows. Then expand once
  with the combined count. This gives the intuitive nesting and avoids blowing up
  intermediate strings.
- **Verify**: `(c e)*2*3` → 12 noteGroups; `c*2*3` → 6. Add both as IR-count tests. All
  existing hashes unchanged (no bundled song uses chained factors — confirm by grepping
  `project-docs/songs/*.mpd` for `\*\d+\*`).

### Task 4 — `[F#m]` (documented) throws "I don't know chord"

- **Severity**: medium (documented feature missing).
- **Repro**: `musicpadToIr('tempo120 [F#m]/4')` → `Musicpad error: I don't know chord m
  in F#m`. But `project-docs/musicpad.md` line 231 lists `[F#m]` as a valid example.
- **Root cause**: `KEY_CHORDS` (src/musicpad.js lines ~1099–1199) has `MIN`, `MIN7`,
  `MIN9`, `MIN6` … but no short `M` aliases. Chord lookup uppercases the suffix, so
  `m` → `M` → not found.
- **Fix**: add alias entries to `KEY_CHORDS` mapping the common short forms to the same
  interval arrays: `'M': KEY_CHORDS['MIN']` equivalents for `M`, `M7`, `M9`, `M6`
  (and their `:1`/`:2`/… inversion variants if you want completeness — at minimum `M`
  and `M7` plus inversions that exist for `MIN`/`MIN7`). Since the table is a literal,
  add the aliases programmatically right after the literal:
  ```js
  for (const [name, value] of Object.entries(KEY_CHORDS)) {
    const alias = name.replace(/^MIN/, 'M');
    if (alias !== name && KEY_CHORDS[alias] == null) KEY_CHORDS[alias] = value;
  }
  ```
  (Guard: this must not collide with existing keys — `M...` keys don't exist today.)
- **Verify**: `[F#m]/4` renders with pitches = root + [0,3,7]; `[Am7]` works too.
  `[MAJ]`, `[MIN]` behavior unchanged; all hashes unchanged.

### Task 5 — `#` comment stripping eats quoted `title"…"` / `author"…"` content

- **Severity**: medium.
- **Repro**: `musicpadToIr('title"my #1 hit" tempo120 c')` → `ir.title` is `''` (and the
  source is left with an unbalanced quote).
- **Root cause**: `prepareSource` (~line 1341) strips comments with
  `this.string.replace(/\s#.*\n/g, ' \n ')` **before** `globalSettings()` extracts
  `title"…"`/`author"…"`. The ` #1 hit"` part matches the comment pattern.
- **Fix**: extract `title"…"` and `author"…"` **before** comment stripping. Concretely:
  move the two quoted-string extractions (`title`, `author`) out of `globalSettings()`
  into `prepareSource()` ahead of the comment-strip `replace` calls (they operate on
  `this.string` and only need the raw text). Keep the rest of `globalSettings()` where
  it is. Alternative (if you prefer one mechanism): make the comment regex skip
  positions inside double quotes — but the move-extraction approach is simpler and
  safer.
- **Watch out**: `title"…"` extraction currently runs after the first newline
  normalization; after moving it, the pattern must tolerate the raw source (it already
  uses `[^"]*` so newlines in titles are the only edge — acceptable to keep requiring
  single-line titles).
- **Verify**: repro yields `title === 'my #1 hit'`; a `# comment` on its own line still
  strips; `testTitleCommand`/`testAuthorCommand` and all hashes unchanged.

### Task 6 — Whitespace-separated `-` after a note letter becomes a flat instead of a rest

- **Severity**: high (silently changes pitches / drops rests). **This is the one task
  allowed to change rendered output — but only for inputs whose current behavior
  contradicts the spec.**
- **Repro**: per `project-docs/musicpad.md` (§2.7 lines 153–161 and the disambiguation
  note at lines 670–671): `F---` must parse as `F-` (F-flat) + two pauses, and
  `F ---` (with a space) must parse as F **natural** + **three** pauses. Actual
  behavior today: both parse identically as F-flat + two pauses. Likewise `c - e`
  yields C-flat then E, silently deleting the intended rest.
- **Root cause**: `explodeTrackChars()` (~line 2149) pads **every** `-` with spaces,
  destroying the adjacency information, and `tokenizeTrackSource()` (~line 2133) then
  re-merges a dash into any previous token that ends with a note letter
  (`shouldMergeDash`, ~line 2169) — regardless of whether the original text had
  whitespace between them.
- **Fix**: make the explosion adjacency-aware instead of re-merging blindly. In
  `explodeTrackChars`, when you encounter `-`, look at the **previous character of the
  original input** (`value[i - 1]`):
  - keep the `-` attached (do NOT pad with spaces) when the previous char is a letter
    `a–z`/`A–Z` (covers note flats `c-`, `pitch-`, `n-`, `t-`, `nt-`), or `,` or `:` or
    `[` (covers guitar fret lists `[g:-,0,2…]` and numeric chord lists);
  - otherwise (previous char is whitespace, start-of-string, `x`, `=`, `-`, a digit, a
    paren, etc.) pad it as today so it becomes a standalone pause token.
  Then **delete** the dash-merging logic from `tokenizeTrackSource`
  (`shouldMergeDash` / `shouldConsumeAfterDash` and the branch that uses them) — it
  exists only to undo the over-eager explosion. Keep the `=` and `'x`/`,x` merging
  behavior exactly as is (space-separated `=` extending the previous note is
  documented, song-exercised behavior).
  - Note one subtlety the old merge handled: `c-4` (flat + octave digit). With
    adjacency-aware explosion `c-4` stays a single token, which the note regexes
    already parse correctly, so nothing extra is needed.
  - Digits before `-`: today `o/4 - x` treats `-` as a pause (previous token ends in a
    digit, `shouldMergeDash` returns false). Keeping "digit → standalone pause" in the
    new rule preserves that.
- **Verify** (all three must hold):
  1. `F---  G` → F-flat(52), pause, pause, G — unchanged.
  2. `F --- G` → F **natural**(53), pause, pause, pause, G — changed, now
     spec-conformant.
  3. `node tests/musicpad.test.js` — **every bundled-song hash must remain
     identical**. I checked the bundled songs: none use a note letter followed by a
     whitespace-separated dash, so hashes must NOT move. If any hash changes, your
     explosion rule is wrong somewhere else (`pitch-`, `n-`, `t-`, `[g:-…]`, `-,x`
     sequences in songs are the likely culprits — `-,x` appears in
     `MBV-When you sleep.mpd`, `o/32 -,x`: the `-` follows whitespace → pause, and the
     `,x` merge must still produce a softened hit). Debug against those songs
     specifically.
  Add IR tests for (1) and (2) and for `pitch-50`, `n-3`, `t-2`, `[g:-,0,2,2,2,0]`,
  `o/32 -,x` token behavior.

### Task 7 — Unknown instrument names are silently ignored

- **Severity**: medium (typos silently do nothing).
- **Repro**: `musicpadToIr('tempo120 iPiano c')` → no error, no programChange event;
  the token is just dropped.
- **Root cause**: the `i…` handling chain in `addTrackIr` (~lines 1731–1765). The last
  branch (2-char drum-code lookup, ~line 1755) ends with an unconditional `continue`
  even when the lookup fails.
- **Fix**: in that final branch, when `command.length > 1` starts with `i`/`I` and
  neither the drum map, instrument map, nor 2-char drum code matched, call
  `this.error(\`I don't know instrument ${command.slice(1)}\`)`.
- **Watch out**: tokens that merely *begin* with `i` but are notes or other commands
  must not be caught. Trace the chain: by the time you reach this branch, the token
  started with `i` and was not `i<number>`, not a full drum name, not an instrument
  name. Check bundled songs still pass (they do not rely on ignored `i…` tokens — the
  hash tests will tell you).
- **Verify**: `iPiano` errors; `i25`, `iBD`, `iAcousticGrandPiano`, `iSnareDrum` all
  still work; all hashes unchanged.

### Task 8 — Channel and small-command validation

- **Severity**: low.
- **Repros**:
  - `ch0 c` → channel 15 (i.e. MIDI channel 16) via `(0-1) & 0xF`; `ch17` wraps to 0.
  - `nt+12c` → transposes by **+1** and treats the leftover `2` as a note length
    (verified: produces pitch 49 instead of an error or +12).
  - `tempo0` → writes a 0-µs tempo meta event (invalid MIDI).
  - `resolution40000` → writes division 40000 (0x9C40) into the SMF header; bit 15 set
    means SMPTE timing per the spec, so the file is corrupt (the app's own
    `parseMidi` rejects it with "SMPTE timing is not supported").
- **Fixes** (all in `MusicpadEngine`):
  - `ch` handler (~line 1727): validate `1 <= n <= 16`, else
    `this.error(\`channel must be 1..16, got ${n}\`)`.
  - `nt+`/`nt-` handlers (~line 1766): after consuming the single digit, if the next
    char is also a digit, `this.error('nt transpose takes a single digit')`. (Single
    digit is the original grammar; erroring beats silent misparse.)
  - `globalSettings()`: after parsing `tempo`, error if `tempo < 1`; after parsing
    `resolution`, error if the resulting `ppqn` is `< 1` or `> 32767`.
- **Verify**: each repro now errors clearly; all hashes unchanged.

---

## 3. App-shell bugs (edit `src/musicpad-html.html`, then rebuild)

### Task 9 — Tutorial Play buttons force the volume to 100%

- **Repro/root cause**: in the tutorial-example click handler
  (src/musicpad-html.html, search for `setPlaybackVolume(1)`), the code resets the
  master volume to full before playing an example, stomping the user's slider setting.
- **Fix**: delete the `setPlaybackVolume(1);` line. Nothing else needed — the synth
  already initializes `masterGain` from `playbackVolume`.

### Task 10 — Playback errors are invisible outside the editor page

- **Repro/root cause**: `stopPlayback(error.message)` and `playMusicpadSource` write to
  `#status`, but that element lives inside `<section id="editorPage">`, which is hidden
  while the tutorial page is active. A failing tutorial example fails silently.
- **Fix** (minimal, keep the current layout): move the `#status` element out of
  `#editorPage` so it is always visible — e.g. place it directly under the header
  inside `<main>`, keep its `role="status" aria-live="polite"`, and adjust CSS so it
  doesn't reserve space awkwardly on doc pages (e.g. hide when empty via
  `#status:empty { display: none; }`). Do not introduce a toast framework; keep it a
  one-line status element.

### Task 11 — Improvement: engine errors should carry a source location

- **Motivation**: for a 21-minute transcription, `I don't know chord X` with no
  position is painful. The engine already tracks the offending token (`sourceToken`) in
  most places.
- **Scope (keep it contained)**:
  1. In `addTrackIr`, wrap per-token error paths so messages include the token and the
     track index: change `this.error(msg)` call sites inside the token loop to append
     `` ` (track ${trackIndex}, token "${sourceToken}")` `` — simplest way: add an
     optional second argument to `error(message, context)` that appends the context
     when present, and pass `{ trackIndex, sourceToken }` from the loop.
  2. Macro/repeat errors (preprocessing) cannot cite a track; cite the nearby source
     text instead: include up to ~30 chars of `this.string` around the failure point.
- **Do not** attempt full line/column mapping to the original source — preprocessing
  (comment stripping, macro expansion) makes that a large project; token + track
  context is the agreed scope.
- **Verify**: trigger a few errors (`[Xfoo]`, `iPiano`, bad `tuning[…]`) and check the
  message includes the token; tests unchanged.

### Task 12 — Improvement: UTF-8 titles/authors in MIDI meta

- **Root cause**: `MidiByteWriter.pushAscii` does `charCodeAt(i) & 0xFF` and the meta
  writer uses `title.length` as the byte length — non-Latin-1 characters are mangled.
- **Fix**: in `midiBytesFromTracks` (src/musicpad.js ~line 2681), encode title/author
  (and the `VERSION` string can stay ASCII) with UTF-8: use `TextEncoder` when
  available, else a small manual UTF-8 encoder (the file must keep working in browsers
  and Node ≥ old LTS — `TextEncoder` is fine in both; in Node it's global). Push the
  encoded byte length as the VarLen and the bytes raw.
- **Verify**: add a test: `title"héllo"` produces a meta event whose length equals the
  UTF-8 byte count (6) and round-trips the bytes. ASCII titles must produce **byte
  identical** output to before (all hashes unchanged — the existing test titles are
  ASCII).

---

## 4. Documentation / housekeeping

### Task 13 — README fixes (`README.md`)

- Fix typo "downaload" → "download".
- In the example, drop the misleading `ch2` before `iBassDrum` (drum shortcuts force
  channel 10 regardless): change `| ch2 iBassDrum o/16 x---x---` to
  `| iBassDrum o/16 x---x---`. Also note the next line uses `ch10 iSnareDrum` — the
  `ch10` is redundant for the same reason; either drop both or keep both consistent.

### Task 14 — Repo hygiene

- `old/` and `xxx/` are untracked working directories at the repo root. Do **not**
  delete them (they are the maintainer's), but add both to `.gitignore` so they stop
  showing up in `git status`.
- Do not amend or rewrite the pushed commit `bdc5fb7 "Optimizatins"` (typo is known;
  amending requires a force-push the maintainer has not approved).

---

## 5. GATED — do NOT implement without explicit maintainer approval

These are **inherited from the original Perl** (verified identical in
`project-docs/musicpad.perl` lines 1651–1658) and are byte-compatibility-affecting.
Fixing them changes the sound of existing `.mpd` files and breaks the hash-regression
contract. Leave the code as is unless the maintainer (rdentato) explicitly opts in.

1. **`MAJ7` interval table is musically wrong**: `KEY_CHORDS['MAJ7'] = [0,3,7,11]`
   (src/musicpad.js ~line 1104) is a *minor*-major-7 chord; a major seventh is
   `[0,4,7,11]`. The inversions `MAJ7:1` `[0,3,7,-1]`, `MAJ7:2` `[12,3,7,11]`,
   `MAJ7:3` `[0,3,-5,-1]` carry the same wrong third.
2. **`AUG` is wrong**: `KEY_CHORDS['AUG'] = [0,3,8]` (~line 1107) is a first-inversion
   major triad; an augmented triad is `[0,4,8]`. Same for `AUG:1` `[0,3,-4]` and
   `AUG:2` `[12,3,8]`.

If approval is given: fix the intervals, then regenerate the affected expected hashes
in `tests/musicpad.test.js` (`EXPECTED_FOCUSED_CASES` and any `EXPECTED_SONGS` entries
whose songs use `[…maj7…]`/`[…aug…]` chords — grep the songs first), and record the
compatibility break in `PLAN.md`'s Decision Log. If not approved, optionally document
the quirk in `project-docs/musicpad.md` instead.

---

## 6. Final checklist (run after all tasks)

1. `node tests/musicpad.test.js` → passes; **no expected hash was modified** (except
   under section 5 with approval).
2. New tests added for: macro paren error, loose/velvar defaults, chained repeats,
   `M`/`M7` chord aliases, `#` in titles, dash/rest disambiguation (both `F---` and
   `F ---` plus the `pitch-`/`n-`/`t-`/`[g:-…]`/`-,x` non-regression tokens), unknown
   instrument error, `ch`/`nt`/`tempo`/`resolution` validation, UTF-8 title meta.
3. `bash src/build` regenerates `src/musicpad.html` without warnings; copy/refresh
   `docs/index.html` from it.
4. Open `src/musicpad.html` in a browser: editor plays the default song; a tutorial
   example plays **at the current slider volume**; an intentionally broken source
   (e.g. `iPiano c`) shows the error while on any page.
5. Update `STATE.md` (current task → done, pointers) and add a dated entry to
   `PLAN.md`'s Decision Log summarizing the fixes, per the repo's working conventions
   in `AGENTS.md`.
