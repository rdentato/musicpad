# STATE.md

## Current Branch
main

## Active Task
Pending small UI title change: `src/musicpad-html.html` title changed from `Musicpad Playback` to `Musicpad`; generated `src/musicpad.html` was rebuilt but is ignored.

## Last Stop
Checkpoint after title change and process correction. `docs/index.html` unintended refresh was reverted. Current worktree also has a user-owned `AGENTS.md` modification and untracked `old/`, `xxx/`.

## Open Questions
1. Should the title change be committed?
2. What to do with untracked `old/` and `xxx/`? (`old/` should be ignored by convention.)
3. Should generated `src/musicpad.html` be distributed outside git releases?

## Last Decision
Do not perform inferred actions. Only do explicitly requested file changes; generated/deployment copies such as `docs/index.html` require explicit instruction.

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
