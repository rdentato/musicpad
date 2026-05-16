# 2026-05-15 webmidi playback

- Worked on adding an alternate WebMIDI playback page without changing existing source files.
- Decision: create `src/musicpad-wm.html` as a separate browser page that depends on local `musicpad.js` and `webmidi.iife.min.js` rather than altering the completed single-file `musicpad.html`.
- Completed `src/musicpad-wm.html` with WebMIDI enable/output selection, Play/Stop, `.mpd` load, and MIDI download.
- Verified the inline JavaScript parses and converts a generated sample MIDI into timed playback messages under Node with browser mocks.
- Improved WebMIDI availability detection after browser reported missing `navigator.requestMIDIAccess`; page now reports unsupported browser/context before calling WebMidi.enable().
- User decided WebMIDI is a dead end; removed only `src/musicpad-wm.html` and left the downloaded WebMIDI library untouched.
