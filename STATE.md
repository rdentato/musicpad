# STATE.md

## Current Branch
main

## Active Task
M6 optimization pass plus direct-MIDI cleanup implemented, verified, and rebuilt; awaiting review/commit decision next session.

## Last Stop
Implemented M6 Steps 1–4 in `src/musicpad.js`, then removed unused legacy direct-MIDI path from `MusicpadEngine`: `addTrack()`, `postOut()`, `this.mtracks`, and old array MIDI helper functions. Current app uses top-level `musicpadToMidi()` / `musicpadToMusicXml()` through the IR path. `node tests/musicpad.test.js` passed after cleanup, and `src/build` rebuilt ignored `src/musicpad.html`.

## Open Questions
1. Should the optimization/cleanup changes be committed as one commit or split into optimization + cleanup commits?
2. Should benchmarking become an automated script before deeper parser optimizations?
3. Are `old/` and `xxx/` intentionally untracked and to remain untouched?

## Last Decision
Remove legacy `MusicpadEngine.addTrack()` / `postOut()` direct-MIDI methods because the current app does not call them and there are no external consumers.

## Pointers
- PLAN.md M6
- journal/2026-05-20-optimization-plan.md
- baseline, Step 1, and Step 2 timing comparisons in journal
- src/musicpad.js (`musicXmlDurationComponents`, `irTrackToMidiTrack`, `midiBytesFromTracks`, `musicXmlMeasureIndexForTick`, per-measure segment sorting)
- tests/musicpad.test.js
- project-docs/songs/*.mpd
