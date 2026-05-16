# 2026-05-15 MIDI embed experiment

- Worked on an additive `musicpad-play.html` experiment using legacy `<embed>` MIDI playback.
- Created `src/musicpad-play.html` as a sibling copy of the self-contained app, leaving `src/musicpad.html` unchanged.
- Added a toolbar MIDI menu with Generate, Play, and Stop Player actions.
- Play generates MIDI bytes in memory, creates an `audio/midi` Blob URL, and injects an `<embed>` with legacy autoplay/autostart hints plus a fallback open/download link.
- Verification: syntax-checked extracted non-JSON scripts and generated a small MIDI header via `src/musicpad.js`.
- Note: first syntax-check attempt using Node with process substitution failed due `/proc` pipe handling; retried through stdin successfully.

- Decision: abandon legacy `<embed>` MIDI playback experiment; do not use embedded playback path. Awaiting instruction on whether to delete `src/musicpad-play.html` or leave it as an untracked artifact.

- Removed `src/musicpad-play.html` after explicit instruction to delete the abandoned embed experiment.

- Removed empty npm artifact files (`package.json`, `package-lock.json`) after confirming this is not an npm project.
