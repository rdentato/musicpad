# Musicpad Notation — Reference for Parser Implementation

Musicpad is a textual music notation that compiles to MIDI. This document
specifies its syntax, lexical rules, semantics, and the order in which a
parser/interpreter must evaluate constructs. It is derived from the official
help and tutorial documents and cross-checked with the original Perl
implementation (`musicpad.perl`).

---

## 1. General Lexical Rules

### 1.1 Case sensitivity

The notation is **case-insensitive**, with three exceptions:

- `dEbUg` and `dEbUgMaX` — must match exactly (case-sensitive).
- Macro names — `m$Foo` and `m$foo` are distinct.
- The letters of note names accept both cases (`C`, `c` — same).

### 1.2 Whitespace

- Whitespace (spaces, tabs, newlines) is a **token separator**, but any amount
  is equivalent to a single space (the source string is normalized:
  `\s+ → single space`).
- Whitespace is **not allowed inside a single command** (e.g. `tempo 120` is
  illegal — must be `tempo120`).
- Whitespace is generally **not required around** these operators, which the
  preprocessor "explodes":
  `x`, `-`, `=`, `(`, `)`. So `xxx-x=x` is a valid token sequence.

### 1.3 Comments

A `#` character preceded by whitespace begins a comment that runs to the end
of the line. Note that bare `#` after a note letter means *sharp*, not a
comment (e.g. `C#` is C-sharp). Comment stripping is applied as the very
first preprocessing step: pattern `\s#.*\n` is removed.

### 1.4 Preprocessing pipeline (must be applied in this order)

1. **Strip comments** (`\s#…\n`).
2. **Normalize whitespace** to single spaces.
3. **Explode parentheses**: insert spaces around `(` and `)`.
4. **Compact whitespace** again.
5. **Extract macro definitions** (`m$name(…)` and `mrnd$name(…)`) and remove
   them from the source. Definitions can appear anywhere; macros are scanned
   left-to-right with balanced-paren matching.
6. **Expand macro calls** (`$name`) recursively until a fixed point. Random
   macros pick one of their listed sub-macros at expansion time. (Hard cap at
   ~500 expansions to prevent self-reference loops.)
7. **Expand repeats** (`*N` and `(...)*N`) — see §6.
8. **Split into tracks** on `|` (with the optional track-jump form `|N`).
9. **Per-track tokenization**: explode `x`, `-`, `=` patterns and reapply
   targeted re-compactions (e.g. re-merge `'x`, `,x`, `sysex`, `A-`, `T-`,
   `N-`, `[-`, `,-,`, `g:-,`, …).
10. **Evaluate tokens** sequentially; each token is matched against a
    priority-ordered table of command patterns.

> Implementation note: the original Perl is regex-based. A modern parser may
> tokenize first, but must reproduce the same precedence (longer/more specific
> patterns before shorter ones — see §10).

---

## 2. Notes

### 2.1 Note letters

Pitch letters are `A B C D E F G` (case-insensitive). The pitch-class table
(semitone offset from C within an octave) is:

| Token              | Semitone |
|--------------------|----------|
| `C-`, `Cb`         | -1 (= B of previous octave) |
| `C`                | 0        |
| `C+`, `C#`         | 1        |
| `D-`, `Db`         | 1        |
| `D`                | 2        |
| `D+`, `D#`         | 3        |
| `E-`, `Eb`         | 3        |
| `E`                | 4        |
| `E+`, `E#`         | 5        |
| `F-`, `Fb`         | 4        |
| `F`                | 5        |
| `F+`, `F#`         | 6        |
| `G-`, `Gb`         | 6        |
| `G`                | 7        |
| `G+`, `G#`         | 8        |
| `A-`, `Ab`         | 8        |
| `A`                | 9        |
| `A+`, `A#`         | 10       |
| `B-`, `Bb`         | 10       |
| `B`                | 11       |
| `B+`, `B#`         | 12 (= C of next octave) |

Accidentals: `+` or `#` for sharp, `-` or `b` for flat. Note that `b`
following a note letter is *flat*; bare `B` (when not following another note
letter) is the note B. The parser strips at most one accidental per note.

### 2.2 Octave

- Octaves are integers; default is `4`.
- Octave can be embedded inside a note token: `C5` = C, octave 5.
- Standalone `/` (token by itself) raises the running octave by 1.
- Standalone `\` lowers the running octave by 1.
- MIDI mapping: `midi_note = pitch_class + 12 * octave`. So `C5` → 60 (the
  conventional "middle C5" for this notation, i.e. the GM standard).

### 2.3 Duration

- Duration is given as `1/N` where N follows a `/` inside the note token:
  `A/8` means A as an eighth note. Default is `1/4`.
- A bare integer (e.g. `8`) is interpreted as a duration **in normal mode
  only**. In guitar mode it means "temporary transpose by N semitones"; in
  tom mode it selects a tom number 1..6 (see §8).
- Duration scaling — see §5 (`Ra/b`, `R1`).

### 2.4 The full note token

A note in normal mode has the shape:

```
[NoteLetter][Accidental]?[Octave]?[ "/" Length]?
```

Examples: `A`, `A#`, `Bb5`, `C/8`, `C#5/16`, `Eb3/2`.

If any of `letter`, `octave`, or `length` is omitted, the **previous value
is reused**. So `C/4 E G/2 F/8 eb d# c` is valid: each token only specifies
what changes.

### 2.5 The `O` placeholder ("don't play")

`O` (capital or lowercase letter O — distinct from digit `0`) is a non-playing
"set defaults" token. It accepts the same suffixes as a note (octave,
duration, accidental). Examples:

- `oA5/16` — set default note to A5 and default duration to 1/16, do not play.
- `o/16` — set default duration to 1/16.
- `o5` — set default octave to 5.

Subsequent tokens that omit fields fill them from these defaults.

### 2.6 Repeating the previous note

- `x` (or `X`) — play the same note (and chord, and current params) again.
- A bare integer `N` — play the same note with new duration `1/N`
  (normal mode only).
- `=` — *hold* the previous note: extend its duration by 1 unit. Multiple
  `=` stack: `x==` is 3× duration, `x===` is 4× duration. Implemented as a
  `$hold` counter incremented for each `=` in the current command.

### 2.7 Pauses

- `P` — explicit pause; accepts `/length` and reuses defaults like a note:
  `P/8`, `P` (= same duration as previous).
- `-` (when used as a token, not as accidental) — pause of the same duration
  as the previous note/pause.
- Disambiguation: `F---` is parsed as `F-` followed by two `-` pauses (the
  first `-` is an accidental because it directly follows the letter; the
  remaining `-`s become pauses after explosion). To force three pauses after
  a plain F, write `F ---`.

### 2.8 Absolute and relative MIDI notes

- `Nxx` — absolute MIDI note number (e.g. `N60` = C5).
- `N+x` / `N-x` — new note `x` semitones above/below the previous note.
  Updates the running reference note.
- `NT+x` / `NT-x` — same as `N+/-` but **does not update** the reference;
  use for one-off ornaments.

### 2.9 Stress / soft markers

A note may be prefixed (no whitespace) by:

- `'` — *stress*: this single note is louder by `stress%` (default 0).
- `,` — *soft*: this single note is softer by `soft%` (default 0).

Examples: `'C`, `,A4/8`, `'x`. The marker attaches to the very next note
token. Stress/soft levels are set by the `stressNN` and `softNN` commands.

---

## 3. Chords

A chord is written as `[ ... ]`, with **no whitespace inside the brackets**.
Four chord forms exist; the parser must try them in this order (the regex
patterns are mutually distinguishable but the order matters because form 4
is the catch-all):

### 3.1 Form 1 — Numeric (relative) chord

```
[s1,s2,s3,...]
```

Each `sN` is a semitone offset (signed integer, may be negative) added to the
**current running note**. The first element must be a (possibly negative)
integer followed by a comma — this is what disambiguates form 1 from form 4.

Example: with default note C4, `[0,4,7,12]` plays C, E, G, C-octave-up.

### 3.2 Form 2 — Guitar fret chord

```
[g:f1,f2,f3,f4,f5,f6]
```

Six elements, each either a fret number (integer ≥ 0) or `-` for
"string not played". Frets are added to the strings of the current
**guitar tuning** (see §9.4). Default tuning is standard:
`E3 A3 D4 G4 B4 E5` → MIDI `40 45 50 55 59 64`.

Example: `[g:-,0,2,2,2,0]` is an Amaj guitar chord.

### 3.3 Form 3 — Named guitar chord

```
[g:NAME]      e.g. [g:Amaj], [g:Em], [g:G7:2]
```

Looks up `NAME` in a guitar-chord dictionary. The base note may use only
`A`–`G` and `b` for flat (no `#`/`+`/`-` accidentals here). A `:N` suffix
selects a chord variation (1, 2, … up to ~5 depending on the chord).
Variations beyond `:1` are valid but specific to each chord; `:` with
unknown suffix falls back to the un-suffixed entry.

### 3.4 Form 4 — Named keyboard chord

```
[NAME]        e.g. [Amin], [min], [Cmaj7:2], [F#m]
```

If `NAME` starts with a note letter (`A`–`G` plus optional `#`/`+`/`b`/`-`),
that letter is the chord root and the remainder is the chord type. If no
root is given, the **current running note** is the root. `:N` selects a
variation.

### 3.5 Strumming

Chords are played as a single instantaneous "block" by default. The
`strum` command introduces a delay between strings:

```
strumA           — delay only (ms between strings)
strumA,B         — delay + max delay before triggering an upstrike (ms)
strumA,B,C       — delay + upstrike-trigger + upstrike volume (% of normal)
```

When the time between two consecutive chord plays is less than `B` ms, the
parser plays the chord in **reverse string order** at `C%` volume (an
upstrike). Recommended rhythm-guitar setting: `strum10,300,80`.

### 3.6 Tuning

```
tuning[E3,A3,D4,G4,B4,E5]
```

Six absolute pitches (note + octave) defining the open-string MIDI numbers.
Used by chord forms 2 and 3. Independent from guitar mode (§8.1).

---

## 4. Tracks

A song has one or more **independent tracks**. Each track is a sequential
stream of notes, with its own running state (octave, duration, channel,
instrument, transpose, pitch, etc.).

- `|` — start a new track.
- `|0` — go back to track 0 (the first track). New tokens append to it.
- `|N` — jump to/append to track N (no whitespace between `|` and `N`).
  Track numbering is 0-based per the docs (the help reference uses 1-based,
  but `|0` is documented as "back to first track" and is the conventional
  index in macros). Implementations should accept both; what matters is that
  same-number references attach to the same track.

Tracks are independent: there is no automatic synchronization between them.
If you want two tracks aligned, you must produce equal total time on each.

> When `m$` macros are defined, they typically include their own `|N`
> directives so that calling the macro deposits notes into a specific track
> regardless of context.

---

## 5. Time, Tempo, Resolution

### 5.1 Tempo and resolution (global)

- `tempoNN` — quarter notes per minute (default 60).
- `resolutionN` — MIDI ticks per quarter (PPQN). Mapping:
  `0=96`, `1=192` (default), `2=384`, `3=1536`.

### 5.2 Duration ratio

- `Ra/b` — multiply subsequent durations by `a/b`. Used for triplets
  (`R2/3`) and polyrhythms.
- `R1` — restore normal duration.

So a quarter note under `R2/3` lasts `(1/4) × (2/3) × ppqn × 4` ticks.

### 5.3 Note hold

`=` increments a per-note `hold` counter. Final length is
`(1/N) × ratio × (1 + hold_count)` (effectively `(1/N) × ratio × hold` where
`hold` starts at 1 and `=` adds 1 each time, per the implementation).

### 5.4 Loose / velvar (humanization)

- `looseW,Q` — vary note start time by ±W milliseconds. `Q` is a centering
  exponent: 1 = uniform random, higher = more centered, `g` (literal letter)
  = Gaussian distribution. Example: `loose20,2`.
- `velvarW,Q` — vary note velocity by ±W % of its base value. Same `Q`
  semantics. Example: `velvar10,2`.
- `globaloose W,Q` and `globalvelvar W,Q` set defaults for all tracks.

### 5.5 Duty (note-on portion)

- `uNN` — this note plays for NN% of its slot length (1..100).
  10 = staccato, 98 = default, 100 = legato.
- `dutyNN` — global default duty.

### 5.6 Velocity

- `vNN` — set velocity to NN (0..127).
- `velocityNN` — global default velocity (default 100).
- `stressNN` — `'`-prefixed notes are NN% louder.
- `softNN` — `,`-prefixed notes are NN% softer.

### 5.7 Pitch bend

- `pitch+NN` / `pitch-NN` — change pitch by ±NN% (100% ≈ 2 semitones).
- `pitch0` — center pitch.

The pitch is computed as `8192 + 8192 × NN/100` (clamped to 0..16383)
and emitted as a MIDI pitch-bend event on the current channel.

---

## 6. Repetition

### 6.1 The `*` operator

`*N` repeats the preceding token (or parenthesized group) N times.

- After a single token: `iBD 8 *8` ≡ `iBD 8 8 8 8 8 8 8 8`. A token is
  delimited by whitespace.
- After `)`: the matching `(...)` group is repeated. `iBD (8 4) *4` ≡
  `iBD 8 4 8 4 8 4 8 4`.
- No whitespace is allowed between `*` and the count.
- A whitespace **may** appear between the preceding token/group and `*`.

For pattern strings without spaces (like `xxx-x*4`), the `*4` repeats the
whole preceding contiguous non-whitespace blob.

### 6.2 Nested repeats

Repeats are expanded recursively until none remain. Repeats may be combined
with macros; expansion order is: macros first, then repeats.

---

## 7. Macros

### 7.1 Definition

```
m$name(  body  )           — deterministic macro
mrnd$name( $a $b $c ... )  — random macro: at expansion, picks one of the
                             listed macro names (or any tokens, but the
                             documented usage lists alternative macros)
```

- `name` may contain letters, digits, `-`, `_` (case-sensitive — see §1.1).
- The keyword `m$` / `mrnd$` is **lowercase only** (verbatim).
- Definitions are matched with balanced parentheses. Nested `(` and `)`
  inside the body are tracked.
- A definition may appear anywhere in the source; all definitions are
  collected before any expansion.
- A macro body may itself reference other macros (recursive expansion until
  no `$name` remains). Self-reference is detected via an iteration cap.

### 7.2 Invocation

`$name` — substitutes the macro body in place. For random macros, one of
the alternatives is chosen each time the song is rendered.

### 7.3 Convention

Macros typically begin with a `|N` directive so they always deposit into the
same track regardless of the active track at the call site.

---

## 8. Modes

### 8.1 Guitar mode

- `guiton` — turn on for the current track.
- `guitoff` — turn off.
- `globalguiton` — turn on by default for all tracks.

In guitar mode, a bare integer means **temporary transpose** in semitones
relative to the running reference note (like `NT+N` / `NT-N`). The reference
is *not* updated. Useful for guitar tab transcription where each fret number
is an offset from the open-string tuning of that track.

### 8.2 Tom mode

- `tomson` — activate. Automatically sets MIDI channel to 10.
- `tomsoff` — deactivate.

In tom mode, a bare integer 1..6 selects tom drum number (1 = highest,
6 = lowest), looked up as `T1..T6` in the drum map.

### 8.3 Mode interaction with bare integers

Order of interpretation for a bare `N`:

1. If guitar mode: temporary transpose (`temptrans = N`).
2. Else if tom mode: tom number (look up `T<N>` in the drum map).
3. Else: new duration (`length = 1/N`, replay previous note).

---

## 9. Channels, Instruments, Drums

### 9.1 Channel

- `chN` — set MIDI channel for the current track (1-based; emitted as
  `N-1`, masked to 4 bits).

### 9.2 Instrument

- `iNN` — General MIDI program change (1..128). Emitted as program `NN-1`
  on the current channel.
- `iXX` — drum instrument: `XX` is two letters/digits, looked up in the
  drum map. Selecting a drum instrument:
  - sets the channel to 10,
  - sets the default note (and chord) to the corresponding drum MIDI note.

The drum map (`code → MIDI note`):

```
BD 36   B2 35   SD 38   S2 40   RS 37   HH 44   OH 46   CH 42
TA 54   T1 50   T2 48   T3 47   T4 45   T5 43   T6 41   CC 49
C2 57   TC 52   RC 51   R2 59   RB 53   SC 55   CB 56   HC 39
```

(See help PDF for full GM instrument names.)

### 9.3 Transpose

- `t+N` / `t-N` — permanent transpose by N semitones (applied to every
  subsequent note on this track until changed).
- `t0` — clear transpose.

### 9.4 Tuning

- `tuning[E3,A3,D4,G4,B4,E5]` — set guitar tuning (six pitches with
  octave). Affects guitar chord forms 2 and 3.

---

## 10. Command Recognition Order (token-level)

When evaluating a single space-delimited token, patterns must be tried in
this order so that more specific commands win over more general ones. (This
mirrors the Perl source.)

1. `tuning[…]`
2. Chord `[ … ]` — try Form 1 (`-?\d+,…`), then Form 2 (`g:(-|\d+),…`),
   then Form 3 (`g:NAME`), then Form 4 (`NAME`).
3. `strumA,B,C` → `strumA,B` → `strumA`
4. `tomson`, `tomsoff`
5. `guiton`, `guitoff`
6. `stressNN`, `softNN`
7. `looseW,Q`, `velvarW,Q`
8. `ctrlA,B`
9. `sysexA,B,C,…`
10. `pitch+N`, `pitch-N`, `pitch0`
11. `chN`
12. `iNN` (digits → program), `iXX` (two alpha-numeric chars → drum)
13. `nt+N`, `nt-N`
14. `rA/B`, `r1`
15. `uN` (duty), `vN` (velocity)
16. `t+N`, `t0`, `t-N`
17. Standalone `/` and `\` (octave shift)
18. `/N` (length suffix)
19. `<NoteLetter><accidental>?<octave_digit>` (consumes octave)
20. `<NoteLetter><accidental>?` (consumes note)
21. `N+N`, `N-N`, `Nxx` (absolute MIDI)
22. `o` / `O` (don't play marker — must come after note matching)
23. `=` (counted into hold)
24. `P` and `-` (both → pause; `-` here only matches if the accidental
    capture above has not already consumed it)
25. `'` (stress flag), `,` (soft flag)
26. Bare integer — interpreted per current mode (§8.3)

After all matching is done, the token's effects are applied: a note (or
chord) is emitted with the accumulated state (note, octave, length, ratio,
hold, duty, velocity, transpose, pitch, stress, soft, pause flag).

> The "explode/re-compact" preprocessing (§1.4 step 9) is what makes
> non-spaced patterns like `xxx-xx*4` parseable: each `x`, `-`, `=` is split
> into its own token, then targeted patterns (`'x`, `,x`, `A-`, `T-`, `N-`,
> `g:-,`, `,-,`, `[-`, `sysex`, etc.) are merged back so they aren't
> mis-parsed.

---

## 11. Global vs Track Commands

### 11.1 Global (apply to whole song)

These are stripped from the input before track processing:

- `dEbUg`, `dEbUgMaX` (case-sensitive)
- `tempoNN`
- `resolutionN`
- `dutyNN` (default duty)
- `velocityNN` (default velocity)
- `globaloose W,Q`
- `globalvelvar W,Q`
- `globalguiton`

### 11.2 Track-local

Everything else is processed per-track, in token order, mutating that
track's state machine.

---

## 12. MIDI Output (semantic notes)

For implementers writing the MIDI back-end:

- **Time base**: `ticks_per_quarter = ppqn` (from `resolution`). A note of
  length `1/N` with ratio `r` and hold count `h` lasts
  `length_ticks = (1/N) × r × h × ppqn × 4`.
- **Note on/off**: each note emits `0x90 | channel`, then after
  `duty × length_ticks` emits `0x80 | channel`. The remainder
  `(1 − duty) × length_ticks` is silent before the next event.
- **Chord**: all notes share the same time slot; with strumming, successive
  strings are offset by `strumDelay` ms (converted to ticks via
  `ms × ppqn × tempo / 60000`).
- **Stress / soft / velvar**: combine multiplicatively on the base velocity:
  `v × (1 + velvarw × rndq(velvarq)/100) × (stress?1+stress%/100:1) × (soft?1−soft%/100:1)`.
  Final velocity is clamped to 0..127.
- **Loose**: jitter the note-on time by `loosew × rndq(looseq)` ms.
  `rndq` is rectangular for q=1, more peaked for higher q, Gaussian for `g`.
- **Pitch bend**: `pitch+NN` → `8192 + 8192 × NN / 100`, clamped 0..16383,
  emitted on the channel as a 14-bit value (LSB then MSB in the standard
  MIDI pitch-bend encoding).
- **Drum instruments** force channel 10 (zero-based 9) and set the default
  note to the mapped MIDI drum number.
- **Track 0** typically holds tempo / meta-events (the first MTrk in the
  output).

---

## 13. Worked Examples (sanity checks)

### 13.1 Chromatic line

```
o/8 a d e f g a b / c
```

Eight 1/8 notes ascending. The lone `/` raises the octave for the final `c`.

### 13.2 Rhythm pattern

```
iB2 o/16 xx-xxx--*4
| iS2 o/16 --x---xx*4
| iHH o/16 -x-x-x-x*4
```

Three drum tracks, each playing 8 sixteenth-notes repeated 4 times.
`o/16` sets the default duration without emitting a note. The `*4` repeats
the entire non-whitespace blob preceding it.

### 13.3 Polyrhythm 17 over 15

```
iBD r16/17 16*17 | iCH r16/15 16*15
```

The first track plays 17 hits in the time of 16 sixteenth-notes; the
second plays 15 in the same span. Equivalent shorthand:
`iBD 17*17 | iCH 15*15` (each duration scaled to fit one bar).

### 13.4 Chord arpeggio with strum

```
tempo120
m$rythm( o/16 x = x x 'x x x x = x x x 'x x x x )
i25 strum10,300,80 loose10,2 velvar10,1
oE3/8 o[0,7,12,16,19,24] $rythm*2
o[Amaj] $rythm*2 p/4
```

Sets tempo, defines a 16-step rhythm macro, picks the nylon guitar with
strumming and humanization, then plays a numeric chord over the rhythm
followed by a named A-major chord.

### 13.5 Guitar tab via guitar mode

```
tempo100
|0 ch1 i25 guiton | ch1 guiton | ch1 guiton
( |0 oE5/16 ------5=7=====7=8=====8=2=====2=0=========0=====
  | oB4/16 ----5==---5====---5====---3====---1===1=====1===0=
  | oG4/16 --5====-----5==-----5==-----2==-----2=========2=0= ) *2
```

Each track represents one string. The `o<note>/16` sets the open-string
default and the bare integers become temporary transposes (frets) above
that string. `=` extends a held fret, `-` is a rest of the same length.

---

## 14. Quick Token Reference

```
Notes      A B C D E F G   accidentals: + # for sharp, - b for flat
Octave     trailing digit on note (C5), or standalone / and \
Duration   /N suffix (default 1/4), bare N reuses note
Hold       =  (each = adds one length unit)
Repeat     X or x  (same note again)
Pause      P  (with optional /N)   |   - (same length as previous)
Pitch ref  N60 absolute  |  N+/-k  | NT+/-k (no ref change)
Don't play O / o (set defaults, no emission)
Track      |  next track  |  |N  jump to track N
Channel    chN
Instrument iNN  (1..128)  | iXX (drum code, forces ch10)
Velocity   vNN | velocityNN
Duty       uNN | dutyNN
Transpose  t+N | t-N | t0
Pitch bend pitch+NN | pitch-NN | pitch0
Ratio      rA/B | r1
Tempo      tempoNN
Resolution resolutionN  (0=96, 1=192, 2=384, 3=1536)
Stress     'X stronger by stressNN%
Soft       ,X softer by softNN%
Loose      looseW,Q  (W ms jitter, Q centering or 'g')
Velvar     velvarW,Q
Globals    globaloose, globalvelvar, globalguiton, dEbUg, dEbUgMaX
Macro def  m$name(...)          mrnd$name($a $b $c)
Macro use  $name
Repeat op  *N    (...)*N
Chord      [s,s,...]  (numeric, relative)
           [g:f,f,f,f,f,f]  (guitar frets)
           [g:NAME[:V]]    (named guitar)
           [NAME[:V]]      (named keyboard)
Strum      strumA[,B[,C]]
Tuning     tuning[N,N,N,N,N,N]
Ctrl       ctrlA,B   (MIDI controller)
Sysex      sysexA,B,C,...
Comment    # to end of line (must follow whitespace)
```

---

## 15. Edge Cases & Gotchas

- `F---` is `F-` then two pauses, not three pauses after `F`. To get three
  pauses use `F ---`. The first dash always binds to a preceding note letter
  as a flat. (After preprocessing, `F-` is re-compacted from the exploded
  ` F - `.)
- `b` after a note letter is *flat*; bare `B` is the note B.
- `O` is the letter, not the digit `0`. The two are distinct tokens.
- Macro names are case-sensitive; everything else (commands, note letters)
  is not.
- Track-jump `|N` requires no whitespace between `|` and `N`.
- `*` cannot have whitespace between itself and the count.
- `'` and `,` (stress / soft) attach to the **next note** with no space.
- The `o` / `O` "don't play" marker must be matched **after** the note
  letter on the same token, otherwise an isolated `o` will set defaults
  for the next note.
- Drum instrument codes (`iBD`, `iSD`, etc.) must be exactly two characters
  matching the drum map. They override channel and default note; do not
  combine with `chN` on the same track.
- Tom mode and guitar mode are mutually exclusive in their interpretation
  of bare integers; only one should be active per track at a time.
- A `dEbUg` token anywhere in the source flips the global debug flag;
  `dEbUgMaX` enables an even more verbose debug. Both are case-sensitive
  and stripped before the rest of preprocessing.
