# STATE.md

## Current Branch
main

## Active Task
Non-gated `BUG-TO-FIX.md` batch is implemented and verified; no active implementation task remains.

## Last Stop
Fixed engine parser/validation bugs, app-shell playback/status issues, UTF-8 MIDI title/author meta encoding, README typos/example drums, and `.gitignore` entries for maintainer-local `old/` and `xxx/`. Ran `bash src/build`, refreshed `docs/index.html` from `src/musicpad.html`, confirmed they match, and `node tests/musicpad.test.js` passes. Gated MAJ7/AUG compatibility changes were not implemented.

## Open Questions
1. Should a browser smoke test be run manually for editor playback, tutorial volume preservation, and cross-page error visibility?
2. Should external MusicXML rendering verification be the next validation task?
3. Should the pushed typo commit message `Optimizatins` be left as-is, or amended only with explicit approval for the required force-push?

## Last Decision
Leave the gated MAJ7/AUG interval changes untouched because they alter byte compatibility and require explicit maintainer approval.

## Pointers
- BUG-TO-FIX.md non-gated tasks
- PLAN.md Decision Log
- journal/2026-07-04-bug-fixes.md
- src/musicpad.js
- src/musicpad-html.html
- tests/musicpad.test.js
- docs/index.html rebuilt from src/musicpad.html
