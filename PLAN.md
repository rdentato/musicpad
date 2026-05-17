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

### M5: MusicXML Export
Goal: export the interpreted Musicpad piece as score-oriented MusicXML, using the same played events/timelines that MIDI playback uses.
- [ ] Define a minimal intermediate event model for interpreted tracks: notes, rests/gaps, chords, timing, channel, instrument, velocity where useful.
- [ ] Refactor MIDI generation in small steps so `musicpadToMidi(source)` remains unchanged but structured events can also be collected/reused.
- [ ] Add tests proving the event model preserves current MIDI output for representative examples, including implicit track splitting (`A | B` = `|0 A | B`).
- [ ] Implement first MusicXML writer: one Musicpad track per MusicXML part; default 4/4 measure grid; divisions derived from PPQN; notes, rests, chords, ties as needed.
- [ ] Add `Download → MusicXML (.musicxml)` to the UI template and rebuild flow.
- [ ] Verify with automated XML structure tests and at least one external score-rendering smoke test if available.

## Risks
- **Variable-length MIDI encoding**: must match Perl `pack 'w'` exactly.
- **Chord parsing edge cases**: the Perl regex logic is intricate; need careful testing.
- **In-browser playback quality**: playback depends on the small Web Audio SoundFont synth and browser behavior.
- **Generated artifact drift**: `src/musicpad.html` is ignored; run `src/build` after source changes before manual testing or distribution.
- **MusicXML mismatch risk**: Musicpad is playback-oriented while MusicXML is score-oriented; use a shared interpreted event model to prevent MIDI and MusicXML divergence.
- **Notation layout choices**: Musicpad has no required barlines/time signatures; first MusicXML export will need explicit defaults and may prioritize faithful timing over polished engraving.

## Decision Log
- 2026-05-12: Port 1:1 from Perl, preserving all notation features
- 2026-05-12: `musicpadToMidi` returns `Uint8Array` for direct Blob/download and Node file output.
- 2026-05-12: Removed in-browser playback; scope is MIDI generation/download only.
- 2026-05-13: Removed browser playback-verification requirement; external MIDI player is the intended listener.
- 2026-05-17: Reintroduced optional browser playback using embedded `A320U.sf2`.
- 2026-05-17: Treat `src/musicpad.html` as generated; build from `src/musicpad-html.html`, `src/musicpad.js`, `src/songlist.js`, and `src/A320U.sf2` with `src/build`.
- 2026-05-17: Plan MusicXML around a reusable interpreted event model rather than a separate parser, so exports represent what Musicpad plays.

## Next Step
Start M5 by designing the minimal interpreted event model and identifying the smallest engine refactor that exposes it without changing `musicpadToMidi(source)` output. Do not update deployment/generated copies such as `docs/index.html` unless explicitly requested.
