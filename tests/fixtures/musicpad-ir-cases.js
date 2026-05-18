#!/usr/bin/env node
'use strict';

// Fixtures for the planned rich intermediate representation (IR).
// These are intentionally data-only until an IR-producing API exists.
// Later tests should require this file and compare generated IR against the
// relevant expected fields while keeping MIDI hash tests stable.

module.exports = {
  schema: 'musicpad-ir-fixtures-v1',
  contract: {
    piece: {
      ppqn: 'number',
      tempoBpm: 'number',
      tracks: 'Track[]'
    },
    track: {
      index: 'zero-based Musicpad track index',
      events: 'ScoreEvent[] in source/performance order'
    },
    events: {
      noteGroup: {
        kind: 'noteGroup',
        sourceToken: 'original token after macro/repeat expansion',
        tick: 'absolute start tick',
        durationTicks: 'score duration before duty/strum shortening',
        channel: 'zero-based MIDI channel',
        velocity: 'final note-on velocity for the group before per-note overrides',
        midiPitches: 'played MIDI pitches in notated/group order',
        emittedNotes: 'individual MIDI note performance, including strum offsets',
        notation: 'symbolic intent such as note spelling, chord source, strum, stress, soft, hold'
      },
      rest: {
        kind: 'rest',
        sourceToken: 'explicit rest/pause token',
        tick: 'absolute start tick',
        durationTicks: 'rest duration',
        notation: 'explicit rest/hold/pause intent'
      },
      controlChange: {
        kind: 'controlChange',
        sourceToken: 'ctrlA,B',
        tick: 'absolute tick',
        channel: 'zero-based MIDI channel',
        controller: 'MIDI controller number',
        value: 'MIDI controller value'
      },
      pitchBend: {
        kind: 'pitchBend',
        sourceToken: 'pitch+N, pitch-N, or pitch0',
        tick: 'absolute tick',
        channel: 'zero-based MIDI channel',
        value14: '14-bit MIDI pitch-bend value, centered at 8192'
      },
      sysex: {
        kind: 'sysex',
        sourceToken: 'sysex byte list',
        tick: 'absolute tick',
        data: 'system-exclusive payload bytes, excluding F0/F7 wrapper'
      },
      programChange: {
        kind: 'programChange',
        sourceToken: 'iN or named melodic instrument command',
        tick: 'absolute tick',
        channel: 'zero-based MIDI channel',
        program: 'zero-based MIDI program number'
      },
      drumInstrument: {
        kind: 'drumInstrument',
        sourceToken: 'drum instrument command such as iBD',
        tick: 'absolute tick',
        channel: 'zero-based MIDI drum channel',
        drumCode: 'Musicpad drum code',
        midiPitch: 'selected drum MIDI pitch'
      }
    }
  },
  cases: [
    {
      name: 'track splitting keeps Musicpad track indices',
      source: 'A | B',
      expected: {
        ppqn: 192,
        tempoBpm: 60,
        tracks: [
          {
            index: 0,
            events: [
              {
                kind: 'noteGroup',
                sourceToken: 'A',
                tick: 0,
                durationTicks: 192,
                channel: 0,
                velocity: 100,
                midiPitches: [57],
                emittedNotes: [{ midiPitch: 57, startTick: 0, endTick: 192, channel: 0, velocity: 100 }],
                notation: { noteSpelling: 'A', lengthDenominator: 4 }
              }
            ]
          },
          {
            index: 1,
            events: [
              {
                kind: 'noteGroup',
                sourceToken: 'B',
                tick: 0,
                durationTicks: 192,
                channel: 0,
                velocity: 100,
                midiPitches: [59],
                emittedNotes: [{ midiPitch: 59, startTick: 0, endTick: 192, channel: 0, velocity: 100 }],
                notation: { noteSpelling: 'B', lengthDenominator: 4 }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'accidental note spelling is preserved',
      source: 'tempo120 c#4 eb4 gb4',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'noteGroup', sourceToken: 'c#4', tick: 0, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [49], notation: { noteSpelling: 'C#', lengthDenominator: 4 } },
              { kind: 'noteGroup', sourceToken: 'eb4', tick: 192, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [51], notation: { noteSpelling: 'EB', lengthDenominator: 4 } },
              { kind: 'noteGroup', sourceToken: 'gb4', tick: 384, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [54], notation: { noteSpelling: 'GB', lengthDenominator: 4 } }
            ]
          }
        ]
      }
    },
    {
      name: 'numeric chord preserves chord source and grouped notes',
      source: 'tempo120 [0,4,7]/4',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              {
                kind: 'noteGroup',
                sourceToken: '[0,4,7]/4',
                tick: 0,
                durationTicks: 192,
                channel: 0,
                velocity: 100,
                midiPitches: [65, 69, 72],
                emittedNotes: [
                  { midiPitch: 65, startTick: 0, endTick: 192, channel: 0, velocity: 100 },
                  { midiPitch: 69, startTick: 0, endTick: 192, channel: 0, velocity: 100 },
                  { midiPitch: 72, startTick: 0, endTick: 192, channel: 0, velocity: 100 }
                ],
                notation: { chordKind: 'numeric', chordSource: '[0,4,7]', intervals: [0, 4, 7], lengthDenominator: 4 }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'named keyboard chord preserves root and variation',
      source: 'tempo120 [Amin]/4 [Cmaj7:2]/4',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              {
                kind: 'noteGroup',
                sourceToken: '[Amin]/4',
                tick: 0,
                durationTicks: 192,
                channel: 0,
                velocity: 100,
                midiPitches: [57, 60, 64],
                notation: { chordKind: 'keyboardNamed', chordSource: '[Amin]', root: 'A', chordType: 'min', lengthDenominator: 4 }
              },
              {
                kind: 'noteGroup',
                sourceToken: '[Cmaj7:2]/4',
                tick: 192,
                durationTicks: 192,
                channel: 0,
                velocity: 100,
                midiPitches: [60, 51, 55, 59],
                notation: { chordKind: 'keyboardNamed', chordSource: '[Cmaj7:2]', root: 'C', chordType: 'maj7:2', lengthDenominator: 4 }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'explicit guitar fret chord preserves frets and muted strings',
      source: 'tempo120 [g:-,0,2,2,2,0]/4',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              {
                kind: 'noteGroup',
                sourceToken: '[g:-,0,2,2,2,0]/4',
                tick: 0,
                durationTicks: 192,
                channel: 0,
                velocity: 100,
                midiPitches: [45, 52, 57, 61, 64],
                notation: { chordKind: 'guitarFrets', chordSource: '[g:-,0,2,2,2,0]', frets: [null, 0, 2, 2, 2, 0], lengthDenominator: 4 }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'strummed guitar chord preserves frets and emitted note offsets',
      source: 'tempo120 strum10,300,80 [g:Amaj]/8 [g:Amaj]/8',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              {
                kind: 'noteGroup',
                sourceToken: '[g:Amaj]/8',
                tick: 0,
                durationTicks: 96,
                channel: 0,
                velocity: 100,
                midiPitches: [40, 45, 52, 57, 61, 64],
                emittedNotes: [
                  { midiPitch: 40, startTick: 0, endTick: 96, channel: 0, velocity: 100 },
                  { midiPitch: 45, startTick: 4, endTick: 96, channel: 0, velocity: 100 },
                  { midiPitch: 52, startTick: 8, endTick: 96, channel: 0, velocity: 100 },
                  { midiPitch: 57, startTick: 12, endTick: 96, channel: 0, velocity: 100 },
                  { midiPitch: 61, startTick: 15, endTick: 96, channel: 0, velocity: 100 },
                  { midiPitch: 64, startTick: 19, endTick: 96, channel: 0, velocity: 100 }
                ],
                notation: { chordKind: 'guitarNamed', chordSource: '[g:Amaj]', frets: [0, 0, 2, 2, 2, 0], strumDirection: 'down', strumDelayTicks: 3.84, lengthDenominator: 8 }
              },
              {
                kind: 'noteGroup',
                sourceToken: '[g:Amaj]/8',
                tick: 96,
                durationTicks: 96,
                channel: 0,
                velocity: 80,
                midiPitches: [40, 45, 52, 57, 61, 64],
                emittedNotes: [
                  { midiPitch: 64, startTick: 96, endTick: 192, channel: 0, velocity: 80 },
                  { midiPitch: 61, startTick: 100, endTick: 192, channel: 0, velocity: 80 },
                  { midiPitch: 57, startTick: 104, endTick: 192, channel: 0, velocity: 80 },
                  { midiPitch: 52, startTick: 108, endTick: 192, channel: 0, velocity: 80 },
                  { midiPitch: 45, startTick: 111, endTick: 192, channel: 0, velocity: 80 },
                  { midiPitch: 40, startTick: 115, endTick: 192, channel: 0, velocity: 80 }
                ],
                notation: { chordKind: 'guitarNamed', chordSource: '[g:Amaj]', frets: [0, 0, 2, 2, 2, 0], strumDirection: 'up', strumDelayTicks: 3.84, lengthDenominator: 8 }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'stress and soft preserve notation intent and final velocity',
      source: "tempo120 stress50 soft25 v80 'c ,d e",
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'noteGroup', sourceToken: "'c", tick: 0, durationTicks: 192, channel: 0, velocity: 120, midiPitches: [48], notation: { noteSpelling: 'C', stress: true, stressPercent: 50 } },
              { kind: 'noteGroup', sourceToken: ',d', tick: 192, durationTicks: 192, channel: 0, velocity: 60, midiPitches: [50], notation: { noteSpelling: 'D', soft: true, softPercent: 25 } },
              { kind: 'noteGroup', sourceToken: 'e', tick: 384, durationTicks: 192, channel: 0, velocity: 80, midiPitches: [52], notation: { noteSpelling: 'E' } }
            ]
          }
        ]
      }
    },
    {
      name: 'rests and holds preserve explicit tokens',
      source: 'tempo120 c/8 = - d/4 p e/8',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'noteGroup', sourceToken: 'c/8=', tick: 0, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [48], notation: { noteSpelling: 'C', explicitHold: true, holdCount: 1, lengthDenominator: 8 } },
              { kind: 'rest', sourceToken: '-', tick: 192, durationTicks: 96, notation: { explicitRest: true, lengthDenominator: 8 } },
              { kind: 'noteGroup', sourceToken: 'd/4', tick: 288, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [50], notation: { noteSpelling: 'D', lengthDenominator: 4 } },
              { kind: 'rest', sourceToken: 'p', tick: 480, durationTicks: 192, notation: { explicitPause: true, lengthDenominator: 4 } },
              { kind: 'noteGroup', sourceToken: 'e/8', tick: 672, durationTicks: 96, channel: 0, velocity: 100, midiPitches: [52], notation: { noteSpelling: 'E', lengthDenominator: 8 } }
            ]
          }
        ]
      }
    },
    {
      name: 'macro and repeat expansion exposes expanded source tokens',
      source: 'tempo120 m$riff(c e g) $riff*2 (a b)*2',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'noteGroup', sourceToken: 'c', tick: 0, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [48], notation: { noteSpelling: 'C' } },
              { kind: 'noteGroup', sourceToken: 'e', tick: 192, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [52], notation: { noteSpelling: 'E' } },
              { kind: 'noteGroup', sourceToken: 'g', tick: 384, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [55], notation: { noteSpelling: 'G' } },
              { kind: 'noteGroup', sourceToken: 'c', tick: 576, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [48], notation: { noteSpelling: 'C' } },
              { kind: 'noteGroup', sourceToken: 'e', tick: 768, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [52], notation: { noteSpelling: 'E' } },
              { kind: 'noteGroup', sourceToken: 'g', tick: 960, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [55], notation: { noteSpelling: 'G' } },
              { kind: 'noteGroup', sourceToken: 'a', tick: 1152, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [57], notation: { noteSpelling: 'A' } },
              { kind: 'noteGroup', sourceToken: 'b', tick: 1344, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [59], notation: { noteSpelling: 'B' } },
              { kind: 'noteGroup', sourceToken: 'a', tick: 1536, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [57], notation: { noteSpelling: 'A' } },
              { kind: 'noteGroup', sourceToken: 'b', tick: 1728, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [59], notation: { noteSpelling: 'B' } }
            ]
          }
        ]
      }
    },
    {
      name: 'program and drum instrument changes are timeline events',
      source: 'tempo120 ch3 i25 c iBD 8',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'programChange', sourceToken: 'i25', tick: 0, channel: 2, program: 24 },
              { kind: 'noteGroup', sourceToken: 'c', tick: 0, durationTicks: 192, channel: 2, velocity: 100, midiPitches: [48], notation: { noteSpelling: 'C' } },
              { kind: 'drumInstrument', sourceToken: 'iBD', tick: 192, channel: 9, drumCode: 'BD', midiPitch: 36 },
              { kind: 'noteGroup', sourceToken: '8', tick: 192, durationTicks: 96, channel: 9, velocity: 100, midiPitches: [36], notation: { lengthDenominator: 8 } }
            ]
          }
        ]
      }
    },
    {
      name: 'sysex is a timeline event',
      source: 'tempo120 sysex c',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'sysex', sourceToken: 'sysex', tick: 0, data: [] },
              { kind: 'noteGroup', sourceToken: 'c', tick: 0, durationTicks: 192, channel: 0, velocity: 100, midiPitches: [48], notation: { noteSpelling: 'C' } }
            ]
          }
        ]
      }
    },
    {
      name: 'controller and pitch bend are timeline events',
      source: 'tempo120 ch2 ctrl7,100 pitch+50 c pitch-25 d pitch0 e',
      expected: {
        ppqn: 192,
        tempoBpm: 120,
        tracks: [
          {
            index: 0,
            events: [
              { kind: 'controlChange', sourceToken: 'ctrl7,100', tick: 0, channel: 1, controller: 7, value: 100 },
              { kind: 'pitchBend', sourceToken: 'pitch+50', tick: 0, channel: 1, value14: 12288 },
              { kind: 'noteGroup', sourceToken: 'c', tick: 0, durationTicks: 192, channel: 1, velocity: 100, midiPitches: [48], notation: { noteSpelling: 'C' } },
              { kind: 'pitchBend', sourceToken: 'pitch-25', tick: 192, channel: 1, value14: 6144 },
              { kind: 'noteGroup', sourceToken: 'd', tick: 192, durationTicks: 192, channel: 1, velocity: 100, midiPitches: [50], notation: { noteSpelling: 'D' } },
              { kind: 'pitchBend', sourceToken: 'pitch0', tick: 384, channel: 1, value14: 8192 },
              { kind: 'noteGroup', sourceToken: 'e', tick: 384, durationTicks: 192, channel: 1, velocity: 100, midiPitches: [52], notation: { noteSpelling: 'E' } }
            ]
          }
        ]
      }
    }
  ]
};
