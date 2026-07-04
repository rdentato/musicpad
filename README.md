# Musicpad

Musicpad is a compact text notation  created by Loïc Prot. It is intended for writing musical ideas and generating MIDI files. It lets you describe notes, rhythms, pauses, chords, tracks, instruments, drums, macros, repeats, and expressive MIDI controls using plain text.

This repository contains a JavaScript port of Musicpad. It runs locally in the browser, it plays back Musicpad notation and converts it into downloadable MIDI files without requiring a server. Just download the HTML file on your PC and open it.

## Features

- Plain-text music notation
- MIDI file generation in the browser
- Playback
- Multiple independent tracks
- General MIDI instruments by number or name
- Drum shortcuts and drum names
- Chords, guitar-oriented notation, and strumming
- Macros, repeats, polyrhythms, velocity, timing variation, and pitch bends
- Single-file HTML application in `src/musicpad.html`

## Using it

The live version is available at <https://rdentato.github.io/musicpad>.

You can also open `src/musicpad.html` locally in a browser, write or load Musicpad text, then listen to it or generate a MIDI file.

Example:

```text
tempo120
ch1 iAcousticGrandPiano C E G C5
| iBassDrum o/16 x---x---
| iSnareDrum o/16 ----x---
```

## JavaScript port

The MIDI engine is implemented in `src/musicpad.js` and embedded into `src/musicpad.html` for browser use.
