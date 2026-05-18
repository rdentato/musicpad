# PLAN.md

## Objective
Create a Musicpad web application that lets users write in Musicpad Notation, then generate/download MIDI files and optionally play them in-browser using the bundled `A320U.sf2` SoundFont.

The app is delivered as a generated single self-contained `src/musicpad.html`. Build inputs are `src/musicpad-html.html`, `src/musicpad.js`, `src/songlist.js`, and `src/A320U.sf2`; `src/build` assembles the generated HTML.

## Status
Complete. MIDI generation, browser playback, and build-source split are committed and pushed.

## Milestones

### M1: JavaScript MIDI Engine (core port)
Port `project-docs/musicpad.perl` to JavaScript 1:1.
- [x] Data tables: `notemap`, `drummap`, `keychords`, `guitchords`
- [x] `MusicpadEngine` class with parse pipeline
- [x] Macro storage + expansion (`m$name(...)`, `mrnd$name(...)`, `$name`)
- [x] Multiplier expansion (`*N`)
- [x] Track splitting (`|`)
- [x] Track-to-MIDI-events (`addTrack` logic)
- [x] MIDI binary assembly (header + tracks → `Uint8Array`)
- [x] Random functions (`rndQ` with Gaussian + power-law modes)

### M2: Download UI
Build and verify the UI as separate files first. Final single-file HTML packaging happens after functionality is complete.
- [x] `src/musicpad.html` includes `src/musicpad.js`
- [x] Central textarea with placeholder/example
- [x] Download button → generate MIDI → trigger Blob download
- [x] Load menu with Local file loading and bundled Song List loading
- [x] Save button → download textarea content as `musicpad.mpd`
- [x] Tutorial and reference content bundled into `src/musicpad.html` and toggled with page buttons
- [x] Final packaging into one self-contained HTML file

### M3: Polish & Verify
- [x] Add automated tests for sample Musicpad strings and selected `project-docs/songs/*.mpd`
- [x] Test generated output has valid MIDI header/chunk lengths
- [x] Browser-check that download produces a playable `.mid` file (removed from earlier scope; later superseded by SoundFont playback work)

### M4: SoundFont Playback and Build Split
- [x] Add in-browser Play/Stop toggle using embedded `A320U.sf2`
- [x] Add playback volume popup with vertical slider
- [x] Merge Save/Generate into Download menu: Source (.mpd), MIDI (.mid)
- [x] Split build inputs from generated `src/musicpad.html`
- [x] Extract bundled song lists into `src/songlist.js`
- [x] Ignore generated `src/musicpad.html`

### M5: Rich Intermediate Representation, then MusicXML
Goal: refactor Musicpad so parsing/interpreting produces a rich internal representation that can generate the current MIDI output first, then MusicXML later. MusicXML must represent the score as Musicpad intends it, not a lossy reconstruction from MIDI bytes.

#### Phase 1 — Baseline and invariants
- [x] Capture current MIDI behavior with regression tests before refactoring.
- [x] Add focused tests for track splitting, chords, guitar chords, strum, dynamics/stress/soft, rests/holds, macros/repeats, pitch/controller events.
- [x] Keep `musicpadToMidi(source, options)` public API and output stable unless a specific bug fix is approved.

#### Phase 2 — IR design
- [x] Define IR shape in code-adjacent comments/tests before broad implementation.
- [x] IR must preserve performance data: track index, absolute ticks, duration, note MIDI pitches, channel, program, velocity, controller/pitch events.
- [x] IR must preserve notation intent where available: original command token, note spelling, chord source (`[Amin]`, `[g:Am]`, `[0,4,7]`), guitar chord/frets, strum settings/direction, stress/soft/accent, explicit holds/rests.
- [x] IR must represent grouped score events separately from emitted MIDI note-ons so strummed chords can remain notated as chords/arpeggios.

#### Phase 3 — MIDI from IR
- [x] Convert existing direct MIDI emission into IR emission plus a MIDI writer, in small reversible steps.
- [x] After each step run `node tests/musicpad.test.js` and compare representative MIDI hashes/lengths.
- [x] Keep random/humanization deterministic under injected `rng`.

#### Phase 4 — MusicXML from IR
- [x] Implement MusicXML only after MIDI-from-IR is stable.
- [x] MusicXML writer should prioritize printable score: parts, measures, rests, ties, chords, arpeggios/strum marks, approximate dynamics/articulations, and useful text directions for playback-only events.
- [x] Add `Download → MusicXML (.musicxml)` only after automated XML tests pass.
- [ ] Verify with external score rendering (MuseScore or equivalent) when available.

## Risks
- **Variable-length MIDI encoding**: must match Perl `pack 'w'` exactly.
- **Chord parsing edge cases**: the Perl regex logic is intricate; need careful testing.
- **In-browser playback quality**: playback depends on the small Web Audio SoundFont synth and browser behavior.
- **Generated artifact drift**: `src/musicpad.html` is ignored; run `src/build` after source changes before manual testing or distribution.
- **MusicXML mismatch risk**: Musicpad is playback-oriented while MusicXML is score-oriented; preserve both performance data and notation intent in the IR.
- **Semantic loss risk**: A MIDI-like event list loses `[g:Am]`, strum, note spelling, explicit dynamics, and other score intent; do not build MusicXML from MIDI bytes or note-ons alone.
- **Notation layout choices**: Musicpad has no required barlines/time signatures; MusicXML export will need explicit defaults and may require later user-facing options.

## Decision Log
- 2026-05-12: Port 1:1 from Perl, preserving all notation features
- 2026-05-12: `musicpadToMidi` returns `Uint8Array` for direct Blob/download and Node file output.
- 2026-05-12: Removed in-browser playback; scope is MIDI generation/download only.
- 2026-05-13: Removed browser playback-verification requirement; external MIDI player is the intended listener.
- 2026-05-17: Reintroduced optional browser playback using embedded `A320U.sf2`.
- 2026-05-17: Treat `src/musicpad.html` as generated; build from `src/musicpad-html.html`, `src/musicpad.js`, `src/songlist.js`, and `src/A320U.sf2` with `src/build`.
- 2026-05-17: Plan MusicXML around a reusable interpreted event model rather than a separate parser, so exports represent what Musicpad plays.
- 2026-05-17: Discarded a first MusicXML attempt because it was too MIDI-like and lost notation intent such as guitar chord identity, strum, and explicit dynamics.
- 2026-05-17: New M5 order is IR first, MIDI-from-IR second, MusicXML third.

## Next Step
Verify MusicXML with an external score renderer (MuseScore or equivalent) when available, then decide whether to polish notation defaults before committing. Do not update deployment/generated copies such as `docs/index.html` unless explicitly requested.
