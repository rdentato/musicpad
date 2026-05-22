# 2026-05-20 — Optimization plan

- Worked on
  - Reviewed `src/musicpad.js` for performance and space opportunities.
  - Measured current rough baseline: full tests about 2.5s and about 208 MB max RSS.
  - Sample per-song timings showed IR generation and MusicXML output are the main hotspots; large MusicXML output can reach multi-megabyte size.

- Completed
  - Added M6 plan to `PLAN.md` for four focused optimizations:
    1. Cache MusicXML duration decompositions.
    2. Replace MIDI array/concat writer with a byte writer.
    3. Optimize MusicXML measure lookup.
    4. Avoid unnecessary per-measure sorting.

- Pending
  - Next session should record a clean baseline first, then implement Step 1 only.
  - Keep MIDI byte hashes stable after every step.

- Notes
  - Unrelated uncommitted GUI edits are present in `src/musicpad-html.html` and `docs/index.html`.
  - Untracked `old/` and `xxx/` remain ignored by workflow unless explicitly requested.

## Resume baseline

- Worked on
  - Treated `resum` as a request to resume M6.
  - Checked status before changes: branch `main`; `PLAN.md`, `STATE.md`, and `journal/2026-05-20-optimization-plan.md` are uncommitted workflow updates; `old/` and `xxx/` remain untouched.
  - Recorded clean baseline before source changes.

- Completed
  - `node tests/musicpad.test.js` passed under `/usr/bin/time -v`: 1.68s wall, 2.75s user, 0.57s sys, 213788 KB max RSS.
  - Large-song timings using IR once, then MIDI/XML from IR:
    - `melo1.mpd`: IR 127.01ms, MIDI 35.87ms, MusicXML 178.73ms, 17 tracks, 14702 events, 63549 MIDI bytes, 10153399 XML chars.
    - `Meshuggah - War.mpd`: IR 81.70ms, MIDI 17.65ms, MusicXML 66.11ms, 6 tracks, 24761 events, 57125 MIDI bytes, 1781082 XML chars.
    - `Polyfun1.mpd`: IR 56.00ms, MIDI 5.39ms, MusicXML 32.30ms, 3 tracks, 10203 events, 81691 MIDI bytes, 1909251 XML chars.
    - `Polyfun2.mpd`: IR 40.88ms, MIDI 12.73ms, MusicXML 37.58ms, 7 tracks, 8428 events, 57082 MIDI bytes, 4049687 XML chars.
  - Per-song timing process max RSS: 164508 KB.

- Pending
  - Ask approval before editing `src/musicpad.js` for Step 1 duration caching, because resume/continue is broad and source edits need explicit approval.

## Step 1 implementation

- Worked on
  - Implemented MusicXML duration component caching in `src/musicpad.js` after explicit approval.
  - First tried cloned cached components, but timing regressed due per-call allocations; replaced that with frozen cached component arrays.

- Completed
  - Cache is keyed by `round(duration)`.
  - Cached arrays and component objects are frozen so callers cannot mutate shared cached data.
  - `node tests/musicpad.test.js` passed.
  - Timed full tests after final Step 1 change: 2.04s wall, 3.56s user, 0.77s sys, 240448 KB max RSS.
  - Large-song timing comparison after final Step 1 change:
    - `melo1.mpd`: MusicXML 178.73ms → 156.50ms; process RSS 164508 KB → 155536 KB.
    - `Meshuggah - War.mpd`: MusicXML 66.11ms → 58.73ms.
    - `Polyfun1.mpd`: MusicXML 32.30ms → 25.61ms.
    - `Polyfun2.mpd`: MusicXML 37.58ms → 45.00ms in this sampled run.

- Pending
  - Step 2 requires separate approval before editing `src/musicpad.js`: replace MIDI array/concat assembly with a byte writer while preserving exact MIDI bytes.

## Step 2 implementation

- Worked on
  - Implemented MIDI byte writer in `src/musicpad.js` after explicit approval.
  - Replaced array/concat assembly in `irTrackToMidiTrack()` and `midiBytesFromTracks()` with `MidiByteWriter`.
  - Left the existing array push helpers in place for older internal code paths.

- Completed
  - Avoided `Array.concat()` in final MIDI chunk assembly.
  - Avoided rest-parameter helper calls in the IR MIDI hot path; `MidiByteWriter.pushBytes()` uses `arguments`.
  - `node tests/musicpad.test.js` passed, preserving existing MIDI hash/length fixtures.
  - Timed full tests after Step 2: 1.75s wall, 3.19s user, 0.52s sys, 222444 KB max RSS.
  - Large-song timing comparison against Step 1 sample:
    - `melo1.mpd`: MIDI 32.43ms → 14.21ms.
    - `Meshuggah - War.mpd`: MIDI 15.62ms → 18.17ms in this sampled run.
    - `Polyfun1.mpd`: MIDI 5.88ms → 1.36ms.
    - `Polyfun2.mpd`: MIDI 15.64ms → 2.42ms.
  - Full process RSS for large-song timing run: 155536 KB → 192480 KB in this sampled run.

- Pending
  - Step 3 requires separate approval before editing `src/musicpad.js`: optimize `musicXmlMeasureIndexForTick()` with binary search or a monotonic cursor while preserving measure/key/meter behavior.

## Step 3 implementation

- Worked on
  - Implemented MusicXML measure lookup optimization in `src/musicpad.js` after explicit approval.
  - Replaced the linear `musicXmlMeasureIndexForTick()` scan with a binary search over measure end ticks.

- Completed
  - Kept meter/key change and padding behavior unchanged by only changing lookup strategy.
  - `node tests/musicpad.test.js` passed, including MusicXML measure-duration coverage.
  - Timed full tests after Step 3: 2.38s wall, 4.73s user, 0.69s sys, 228976 KB max RSS.
  - Large-song timing comparison against Step 2 sample:
    - `melo1.mpd`: MusicXML 182.15ms → 235.62ms in this sampled run.
    - `Meshuggah - War.mpd`: MusicXML 55.13ms → 71.16ms in this sampled run.
    - `Polyfun1.mpd`: MusicXML 32.12ms → 38.30ms in this sampled run.
    - `Polyfun2.mpd`: MusicXML 53.45ms → 51.38ms.
  - Additional repeated XML-only timings showed high variance, especially on first `melo1.mpd` run, so the sampled slowdown is not treated as conclusive.

- Pending
  - Step 4 requires separate approval before editing `src/musicpad.js`: prove per-measure segment ordering stability, then remove or gate per-measure sorting only if safe.

## Step 3 slowdown investigation

- Worked on
  - Investigated why the first post-Step-3 timing sample showed slower large-song MusicXML export.
  - Compared current binary lookup against an in-memory linear-lookup variant without editing source files.

- Findings
  - Binary lookup produces identical MusicXML to the linear variant for the sampled large songs.
  - Repeated full XML-export timings were effectively comparable/noisy rather than consistently slower:
    - `melo1.mpd`: linear median 166.46ms, binary median 170.83ms.
    - `Meshuggah - War.mpd`: linear median 84.83ms, binary median 83.95ms.
    - `Polyfun1.mpd`: linear median 50.81ms, binary median 50.80ms.
    - `Polyfun2.mpd`: linear median 64.39ms, binary median 64.27ms.
  - Instrumented lookup counts showed binary search greatly reduces comparisons:
    - `melo1.mpd`: 616465 → 95853 comparisons.
    - `Meshuggah - War.mpd`: 1987256 → 183767 comparisons.
    - `Polyfun1.mpd`: 276215 → 59679 comparisons.
    - `Polyfun2.mpd`: 264606 → 51464 comparisons.
  - Isolated lookup-only cost per XML export is small, so the improvement is mostly hidden by XML string construction, sorting, GC, and runtime variance:
    - `melo1.mpd`: linear 1.456ms/export, binary 0.607ms/export.
    - `Meshuggah - War.mpd`: linear 2.429ms/export, binary 0.558ms/export.
    - `Polyfun1.mpd`: linear 0.333ms/export, binary 0.203ms/export.
    - `Polyfun2.mpd`: linear 0.298ms/export, binary 0.184ms/export.

- Decision context
  - The apparent Step 3 slowdown was a noisy one-shot timing result, not a consistent regression in the lookup itself.
  - Binary search remains safe and marginally faster in isolation, but it is not a major end-to-end MusicXML win.

## Step 4 implementation

- Worked on
  - Checked whether MusicXML measure segments are appended in stable start-tick order.
  - Found that most measures are stable, but not all: `midi test.mpd` has later program-change events whose start ticks are earlier than previously appended note/rest segments in the same measure.

- Completed
  - Implemented gated per-measure sorting in `src/musicpad.js`.
  - Each measure entry tracks `lastStartTick` and `needsSort`; sorting now only runs when an out-of-order segment is detected.
  - Kept existing sort behavior for out-of-order measures, preserving same-tick stable order.
  - `node tests/musicpad.test.js` passed.
  - Compared gated output against an always-sort in-memory variant for all 15 song fixtures; outputs were identical.
  - Instrumented song fixtures: 127 non-empty measures still sorted, 4643 non-empty measures skipped sorting.
  - Timed full tests after Step 4: 2.28s wall, 3.86s user, 0.66s sys, 189264 KB max RSS.
  - Large-song single-run timing after Step 4:
    - `melo1.mpd`: IR 171.47ms, MIDI 23.36ms, MusicXML 226.20ms, RSS run 178928 KB.
    - `Meshuggah - War.mpd`: IR 127.82ms, MIDI 14.87ms, MusicXML 76.42ms.
    - `Polyfun1.mpd`: IR 97.11ms, MIDI 2.76ms, MusicXML 41.27ms.
    - `Polyfun2.mpd`: IR 68.90ms, MIDI 1.70ms, MusicXML 68.44ms.
  - Repeated gated-vs-always-sort XML-only timings showed small/noisy end-to-end effect; the main verified win is avoiding unnecessary sorts while preserving output.

- Pending
  - Review diffs and decide whether to commit.

## Generated HTML rebuild

- Worked on
  - Rebuilt generated `src/musicpad.html` via `src/build` after explicit request.

- Completed
  - Build reported: `wrote musicpad.html`.
  - `src/musicpad.html` remains ignored by git status.

## Direct-MIDI cleanup

- Worked on
  - Confirmed current app usage: `src/musicpad-html.html` calls top-level `musicpadToMidi()` and `musicpadToMusicXml()` only.
  - Confirmed `MusicpadEngine.addTrack()` and `postOut()` are defined but not called by the current program.

- Completed
  - Removed legacy `MusicpadEngine.addTrack()` direct-MIDI implementation.
  - Removed legacy `MusicpadEngine.postOut()`.
  - Removed `this.mtracks` state from `reset()`.
  - Removed old array MIDI helper functions that were only used by the direct-MIDI path.
  - `node tests/musicpad.test.js` passed.
  - Timed full tests after cleanup: 2.29s wall, 3.68s user, 0.70s sys, 210420 KB max RSS.

- Pending
  - Decide whether to rebuild `src/musicpad.html` again after cleanup.
  - Review diffs and decide whether to commit.

## Generated HTML rebuild after cleanup

- Worked on
  - Rebuilt generated `src/musicpad.html` via `src/build` after direct-MIDI cleanup and explicit request.

- Completed
  - Build reported: `wrote musicpad.html`.
  - `src/musicpad.html` remains ignored by git status.

## Checkpoint

- Completed
  - M6 Steps 1–4 are implemented and verified.
  - Direct-MIDI cleanup is implemented and verified.
  - Generated `src/musicpad.html` was rebuilt after cleanup; it remains ignored by git.

- Verification
  - Latest cleanup test: `node tests/musicpad.test.js` passed.
  - Latest cleanup timed run: 2.29s wall, 210420 KB max RSS.

- Pending next session
  - Review diffs.
  - Decide whether to commit as one commit or split optimization and cleanup commits.
  - Leave untracked `old/` and `xxx/` untouched unless explicitly requested.
