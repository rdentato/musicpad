# STATE.md

## Current Branch
main

## Active Task
Download-only Musicpad web app: convert Musicpad notation to downloadable MIDI.

## Last Stop
Implemented `src/musicpad.js` MIDI generator and `src/musicpad.html` UI with textarea plus Generate button. In-browser playback was removed from scope.

## Open Questions
1. Which automated test coverage is sufficient before final packaging?
2. When should separate `src/` files be bundled into one self-contained HTML file?

## Last Decision
Removed in-browser playback; users listen through the downloaded `.mid` file in an external MIDI player.

## Pointers
- PLAN.md
- src/musicpad.js
- src/musicpad.html
- docs/musicpad.md
- docs/musicpad.perl
- docs/songs/*.mpd
- journal/2026-05-12-js-port.md
