# 2026-05-22 — WebMIDI plan

- Worked on
  - Planned a Web MIDI playback-output feature after M6 completion.
  - Inspected the existing playback path in `src/musicpad-html.html`: editor Play generates MIDI bytes, parses them into timed events, and drives `MidiPlayer` with `SoundFontSynth` over WebAudio.

- Decisions
  - Treat WebMIDI as a UI/playback feature layered on generated MIDI bytes; do not change `src/musicpad.js` public APIs for the MVP.
  - Keep WebAudio SoundFont playback as the default dependable path.
  - Add a playback sink boundary so parsed MIDI events can drive either WebAudio or a selected Web MIDI output.
  - Treat SysEx as out of MVP scope unless explicitly approved because it requires stronger browser permission.

- Planned
  - Added M7 to `PLAN.md` with phases for playback abstraction, Web MIDI discovery/selection UI, Web MIDI sink, UI/docs updates, and verification.

- Open questions
  - Exact output selector UI shape.
  - Whether to persist the selected MIDI output in `localStorage`.
  - Whether WebMIDI playback should support SysEx in the first version.
  - Whether the volume control should remain WebAudio-only for MIDI-port playback or map to MIDI CC7.

## Implementation start

- Worked on
  - Began M7 after approval to use the recommended defaults: compact selector, no persistence, no SysEx, WebAudio-only volume.
  - Added a playback target selector to `src/musicpad-html.html`.
  - Refactored browser playback around sink objects so `MidiPlayer` can drive WebAudio or Web MIDI from the same parsed MIDI events.
  - Added Web MIDI output discovery, device-change refresh, no-output/unsupported messages, and defensive Stop behavior with pending-send clear plus all-sound/all-notes-off messages.
  - Updated tutorial/about wording to mention WebAudio and optional Web MIDI playback.

- Completed
  - Ran `node tests/musicpad.test.js`; passed.
  - Ran `bash -n src/build`; passed.
  - Rebuilt `src/musicpad.html` with `src/build` and copied it to `docs/index.html`.
  - Parsed generated inline JavaScript blocks with Node; all parse.
  - Confirmed `docs/index.html` matches rebuilt `src/musicpad.html` with `cmp`.

- Pending
  - Browser verification still needs real WebAudio/Web MIDI testing.
  - After browser verification, decide whether to commit and push M7 as one commit.

## Postponed

- Decision
  - Postponed direct browser MIDI/Web MIDI output access to a future release.
  - Firefox exposing `navigator.requestMIDIAccess` inconsistently from `file://` made the direct-MIDI path unsuitable for the current release expectations.

- Completed
  - Restored tracked app and generated docs files to the current git version.
  - Recorded the postponement in `PLAN.md` and `STATE.md`.

- Current supported paths
  - Embedded WebAudio playback remains the browser playback path.
  - MIDI and MusicXML downloads remain available for external tools.

## Checkpoint

- Completed
  - Ended the Web MIDI/direct MIDI thread for this session.
  - Left app source and generated docs restored to the current git version.
  - Kept the postponement decision in `PLAN.md` and `STATE.md`.

- Pending
  - Choose the next scoped task in a future session.
  - Candidate next tasks: external MusicXML rendering verification, benchmark automation, or explicit decision on whether to leave the pushed typo commit message unchanged.

- Notes
  - `old/` and `xxx/` remain untracked and untouched.
  - The journal is closed for this session.
