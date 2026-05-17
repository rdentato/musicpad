# 2026-05-17 SoundFont playback

- Worked on: add `src/musicpad-play.htm` with the full existing Musicpad UI plus browser playback.
- Decision: regenerate `musicpad-play.htm` from `musicpad.html`, then inject Play/Stop controls, playback code, and embedded `A320U.sf2` base64 data so it works as a single HTML file.
- Verification: inline JavaScript syntax checks; generated MIDI parses; embedded `A320U.sf2` decodes/parses with usable piano zones. Full existing test suite is blocked by missing `docs/songs/Bird I.mpd` in this worktree.
- Update: replaced separate Play/Stop buttons with one toggle button whose label/title switch between Play and Stop.
- Update: added a Vol button after Play/Stop; it opens a vertical volume slider, closes on outside click, and updates current playback volume.
- Update: merged Save and Generate into a Download menubutton with Source (.mpd) and MIDI (.mid) actions.
- Update: split the single-file playback page into `src/musicpad-html.html` with placeholders and executable `src/build`, which combines the template, `src/musicpad.js`, and `src/A320U.sf2` into `src/musicpad.html`.
- Verification: ran `src/build`; generated `src/musicpad.html` is ~13 MiB, embeds the engine and SoundFont, and inline JavaScript parses successfully.
- Git staging: removed generated `src/musicpad.html` from the index while keeping it on disk; staged build inputs `src/musicpad-html.html`, `src/build`, `src/A320U.sf2`, and `src/A320U-license.txt`.
- Update: added `src/musicpad.html` to `.gitignore` as a generated build output.
- Update: extracted inline song lists into `src/songlist.js`; `src/build` now inlines `musicpad.js`, `songlist.js`, and `A320U.sf2` into generated `src/musicpad.html`.
- Verification: ran `src/build`; generated HTML has three inline JS scripts, song lists initialize as 15 bundled + 14 project songs, MIDI parsing and SoundFont zone smoke tests pass.
