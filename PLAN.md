# PLAN.md

## Objective
Create a Musicpad web application that lets users write in Musicpad Notation, then generate and download MIDI files. Playback is intentionally out of scope; users listen with their downloaded `.mid` file in an external MIDI player.

Development is currently done with separate source files under `src/` (`musicpad.js`, `musicpad.html`). Only at the end, after the behavior is complete and verified, will these be bundled or copied into a single self-contained HTML file.

## Status
Download-only UI implemented; verification and final packaging remain.

## Milestones

### M1: JavaScript MIDI Engine (core port)
Port `docs/musicpad.perl` to JavaScript 1:1.
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
- [ ] Final packaging into one self-contained HTML file

### M3: Polish & Verify
- [x] Add automated tests for sample Musicpad strings and selected `docs/songs/*.mpd`
- [x] Test generated output has valid MIDI header/chunk lengths
- [ ] Browser-check that download produces a playable `.mid` file

## Risks
- **Variable-length MIDI encoding**: must match Perl `pack 'w'` exactly.
- **Chord parsing edge cases**: the Perl regex logic is intricate; need careful testing.
- **External playback quality**: playback depends on the user's MIDI player/synth.

## Decision Log
- 2026-05-12: Port 1:1 from Perl, preserving all notation features
- 2026-05-12: `musicpadToMidi` returns `Uint8Array` for direct Blob/download and Node file output.
- 2026-05-12: Removed in-browser playback; scope is MIDI generation/download only.

## Next Step
Add automated tests for the MIDI engine and download output validity.
