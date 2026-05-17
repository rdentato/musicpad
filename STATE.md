# STATE.md

## Current Branch
main

## Active Task
None — latest playback/build refactor is committed and pushed.

## Last Stop
Added browser playback with embedded `A320U.sf2`, split the generated app into build inputs, extracted song lists, rebuilt `src/musicpad.html`, committed, and pushed.

## Open Questions
1. What to do with untracked `old/` and `xxx/`? (`old/` should be ignored by convention.)
2. Any further UI/playback polish?
3. Should generated `src/musicpad.html` be distributed outside git releases?

## Last Decision
`src/musicpad.html` is generated and ignored; source of truth is `src/musicpad-html.html` + `src/musicpad.js` + `src/songlist.js` + `src/A320U.sf2`, built by `src/build`.

## Pointers
- PLAN.md
- src/build
- src/musicpad-html.html
- src/musicpad.js
- src/songlist.js
- src/A320U.sf2
- src/musicpad.html (generated, ignored)
- project-docs/musicpad.md
- project-docs/musicpad.perl
- project-docs/songs/*.mpd
- journal/2026-05-17-soundfont-playback.md
