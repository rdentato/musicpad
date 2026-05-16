# Musicpad

Musicpad is a compact text notation for writing musical ideas and generating MIDI files. It lets you describe notes, rhythms, pauses, chords, tracks, instruments, drums, macros, repeats, and expressive MIDI controls using plain text.

This repository contains a JavaScript port of Musicpad. It runs locally in the browser and converts Musicpad notation into downloadable MIDI files without requiring a server.

## Features

- Plain-text music notation
- MIDI file generation in the browser
- Multiple independent tracks
- General MIDI instruments by number or name
- Drum shortcuts and drum names
- Chords, guitar-oriented notation, and strumming
- Macros, repeats, polyrhythms, velocity, timing variation, and pitch bends
- Single-file HTML application in `src/musicpad.html`

## Using it

Open `src/musicpad.html` in a browser, write or load Musicpad text, then generate a MIDI file.

Example:

```text
tempo120
ch1 iAcousticGrandPiano C E G C5
| ch2 iBassDrum o/16 x---x---
| ch10 iSnareDrum o/16 ----x---
```

## JavaScript port

The MIDI engine is implemented in `src/musicpad.js` and embedded into `src/musicpad.html` for browser use.

Credits: Musicpad was originally created by Loïc Prot.
