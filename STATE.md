# STATE.md

## Current Branch
main

## Active Task
M5 planning complete; next session should begin Phase 1 baseline tests for a rich internal representation before MusicXML.

## Last Stop
The first MusicXML attempt was reverted. A tighter multi-session plan was recorded: baseline tests, rich IR design, MIDI-from-IR with stable output, then MusicXML from IR. No implementation changes are pending beyond planning docs.

## Open Questions
1. What exact IR shape should preserve both performance and notation intent?
2. Which current Musicpad examples should become regression fixtures for chords, guitar chords, strum, dynamics, rests/holds, macros, and controllers?
3. What default MusicXML notation policy should be used later for time signature/measures?

## Last Decision
MusicXML must not be reconstructed from MIDI bytes/note-ons alone. The IR must preserve symbolic intent such as `[g:Am]`, chord source, strum, note spelling, stress/soft/dynamics, and explicit rests/holds, while also preserving exact played timing for MIDI.

## Pointers
- PLAN.md M5
- src/musicpad.js (`MusicpadEngine.addTrack` currently emits MIDI directly)
- tests/musicpad.test.js
- project-docs/musicpad.md
- project-docs/musicpad.perl
- project-docs/songs/*.mpd
- src/musicpad-html.html
- src/build
- journal/2026-05-17-soundfont-playback.md
