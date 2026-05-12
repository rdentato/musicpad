/*
 * Musicpad notation to MIDI bytes.
 * Exposes musicpadToMidi(source, options) -> Uint8Array.
 */
(function (root) {
  'use strict';

  const VERSION = 'made with musicpad-js';

  const DRUM_MAP = numberMap('BD 36 B2 35 SD 38 S2 40 RS 37 HH 44 OH 46 CH 42 TA 54 T1 50 T2 48 T3 47 T4 45 T5 43 T6 41 CC 49 C2 57 TC 52 RC 51 R2 59 RB 53 SC 55 CB 56 HC 39');
  const NOTE_MAP = numberMap('C- -1 CB -1 C 0 C+ 1 C# 1 D- 1 DB 1 D 2 D# 3 D+ 3 EB 3 E- 3 E 4 E+ 5 E# 5 F- 4 FB 4 F 5 F+ 6 F# 6 G- 6 GB 6 G 7 G+ 8 G# 8 A- 8 AB 8 A 9 A+ 10 A# 10 B- 10 BB 10 B 11 B+ 12 B# 12');

  const GUITAR_CHORDS = {
    'A/AB': [null, 0, 2, 1, 2, 0],
    'A/B': [0, 0, 2, 4, 2, 0],
    'A/B:1': [null, 0, 7, 6, 0, 0],
    'A/D': [null, 0, 0, 2, 2, 0],
    'A/D:1': [null, null, 0, 2, 2, 0],
    'A/D:2': [null, null, 0, 6, 5, 5],
    'A/D:3': [null, null, 0, 9, 10, 9],
    'A/G': [3, null, 2, 2, 2, 0],
    'A/G:1': [null, 0, 2, 0, 2, 0],
    'A/G:2': [null, 0, 2, 2, 2, 3],
    'A/GB': [0, 0, 2, 2, 2, 2],
    'A/GB:1': [0, null, 4, 2, 2, 0],
    'A/GB:2': [2, null, 2, 2, 2, 0],
    'A/GB:3': [null, 0, 4, 2, 2, 0],
    'A/GB:4': [null, null, 2, 2, 2, 2],
    'A5': [5, 7, 7, null, null, 5],
    'A5:1': [null, 0, 2, 2, null, 0],
    'A5:2': [5, 7, 7, null, null, 0],
    'A6': [0, 0, 2, 2, 2, 2],
    'A6:1': [0, null, 4, 2, 2, 0],
    'A6:2': [2, null, 2, 2, 2, 0],
    'A6:3': [null, 0, 4, 2, 2, 0],
    'A6:4': [null, null, 2, 2, 2, 2],
    'A6/7': [0, 0, 2, 0, 2, 2],
    'A6/7:1': [5, 5, 4, 0, 3, 0],
    'A6/7:2': [null, 0, 2, 0, 3, 2],
    'A7': [3, null, 2, 2, 2, 0],
    'A7:1': [null, 0, 2, 0, 2, 0],
    'A7:2': [null, 0, 2, 2, 2, 3],
    'A7{#5}': [1, 0, 3, 0, 2, 1],
    'A7/ADD11': [null, 0, 0, 0, 2, 0],
    'A7SUS4': [null, 0, 2, 0, 3, 0],
    'A7SUS4:1': [null, 0, 2, 0, 3, 3],
    'A7SUS4:2': [null, 0, 2, 2, 3, 3],
    'A7SUS4:3': [5, null, 0, 0, 3, 0],
    'A7SUS4:4': [null, 0, 0, 0, null, 0],
    'AADD9': [0, 0, 2, 4, 2, 0],
    'AADD9:1': [null, 0, 7, 6, 0, 0],
    'AAUG': [null, 0, 3, 2, 2, 1],
    'AAUG:1': [null, 0, null, 2, 2, 1],
    'AAUG/D': [null, null, 0, 2, 2, 1],
    'AAUG/G': [1, 0, 3, 0, 2, 1],
    'ADIM/AB': [null, null, 1, 2, 1, 4],
    'ADIM/E': [0, 3, null, 2, 4, 0],
    'ADIM/F': [null, null, 1, 2, 1, 1],
    'ADIM/F:1': [null, null, 3, 5, 4, 5],
    'ADIM/G': [null, null, 1, 2, 1, 3],
    'ADIM/GB': [null, null, 1, 2, 1, 2],
    'ADIMIN7': [null, null, 1, 2, 1, 2],
    'AMIN': [null, 0, 2, 2, 1, 0],
    'AMIN:1': [null, 0, 7, 5, 5, 5],
    'AMIN:2': [null, 3, 2, 2, 1, 0],
    'AMIN:3': [8, 12, null, null, null, 0],
    'AMIN/B': [0, 0, 7, 5, 0, 0],
    'AMIN/B:1': [null, 3, 2, 2, 0, 0],
    'AMIN/D': [null, null, 0, 2, 1, 0],
    'AMIN/D:1': [null, null, 0, 5, 5, 5],
    'AMIN/EB': [0, 3, null, 2, 4, 0],
    'AMIN/F': [0, 0, 3, 2, 1, 0],
    'AMIN/F:1': [1, 3, 3, 2, 1, 0],
    'AMIN/F:2': [1, null, 2, 2, 1, 0],
    'AMIN/F:3': [null, null, 2, 2, 1, 1],
    'AMIN/F:4': [null, null, 3, 2, 1, 0],
    'AMIN/G': [0, 0, 2, 0, 1, 3],
    'AMIN/G:1': [null, 0, 2, 0, 1, 0],
    'AMIN/G:2': [null, 0, 2, 2, 1, 3],
    'AMIN/G:3': [null, 0, 5, 5, 5, 8],
    'AMIN/GB': [null, 0, 2, 2, 1, 2],
    'AMIN/GB:1': [null, null, 2, 2, 1, 2],
    'AM6': [null, 0, 2, 2, 1, 2],
    'AM6:1': [null, null, 2, 2, 1, 2],
    'AMIN7': [0, 0, 2, 0, 1, 3],
    'AMIN7:1': [null, 0, 2, 0, 1, 0],
    'AMIN7:2': [null, 0, 2, 2, 1, 3],
    'AMIN7:3': [null, 0, 5, 5, 5, 8],
    'AMIN7{B5}': [null, null, 1, 2, 1, 3],
    'AMIN7/ADD11': [null, 5, 7, 5, 8, 0],
    'AMAJ': [0, 0, 2, 2, 2, 0],
    'AMAJ:1': [0, 4, null, 2, 5, 0],
    'AMAJ:2': [5, 7, 7, 6, 5, 5],
    'AMAJ:3': [null, 0, 2, 2, 2, 0],
    'AMAJ:4': [null, 4, 7, null, null, 5],
    'AMAJ7': [null, 0, 2, 1, 2, 0],
    'AMIN/MAJ9': [null, 0, 6, 5, 5, 7],
    'ASUS': [0, 0, 2, 2, 3, 0],
    'ASUS:1': [null, 0, 2, 2, 3, 0],
    'ASUS:2': [5, 5, 7, 7, null, 0],
    'ASUS:3': [null, 0, 0, 2, 3, 0],
    'ASUS2': [0, 0, 2, 2, 0, 0],
    'ASUS2:1': [0, 0, 2, 4, 0, 0],
    'ASUS2:2': [0, 2, 2, 2, 0, 0],
    'ASUS2:3': [null, 0, 2, 2, 0, 0],
    'ASUS2:4': [null, null, 2, 2, 0, 0],
    'ASUS2/AB': [null, 0, 2, 1, 0, 0],
    'ASUS2/C': [0, 0, 7, 5, 0, 0],
    'ASUS2/C:1': [null, 3, 2, 2, 0, 0],
    'ASUS2/D': [0, 2, 0, 2, 0, 0],
    'ASUS2/D:1': [null, 2, 0, 2, 3, 0],
    'ASUS2/DB': [0, 0, 2, 4, 2, 0],
    'ASUS2/DB:1': [null, 0, 7, 6, 0, 0],
    'ASUS2/EB': [null, 2, 1, 2, 0, 0],
    'ASUS2/F': [0, 0, 3, 2, 0, 0],
    'ASUS2/G': [3, null, 2, 2, 0, 0],
    'ASUS2/G:1': [null, 0, 2, 0, 0, 0],
    'ASUS2/G:2': [null, 0, 5, 4, 5, 0],
    'ASUS2/GB': [null, 0, 4, 4, 0, 0],
    'ASUS2/GB:1': [null, 2, 4, 2, 5, 2],
    'ASUS4/AB': [4, null, 0, 2, 3, 0],
    'ASUS4/B': [0, 2, 0, 2, 0, 0],
    'ASUS4/BB': [0, 1, null, 2, 3, 0],
    'ASUS4/C': [null, null, 0, 2, 1, 0],
    'ASUS4/C:1': [null, null, 0, 5, 5, 5],
    'ASUS4/DB': [null, 0, 0, 2, 2, 0],
    'ASUS4/DB:1': [null, null, 0, 2, 2, 0],
    'ASUS4/DB:2': [null, null, 0, 6, 5, 5],
    'ASUS4/DB:3': [null, null, 0, 9, 10, 9],
    'ASUS4/F': [null, null, 7, 7, 6, 0],
    'ASUS4/G': [null, 0, 2, 0, 3, 0],
    'ASUS4/G:1': [null, 0, 2, 0, 3, 3],
    'ASUS4/G:2': [null, 0, 2, 2, 3, 3],
    'ASUS4/G:3': [null, 0, 0, 0, null, 0],
    'ASUS4/GB': [0, 0, 0, 2, 3, 2],
    'ASUS4/GB:1': [0, 0, 4, 2, 3, 0],
    'ASUS4/GB:2': [2, null, 0, 2, 3, 0],
    'ASUS4/GB:3': [null, 0, 2, 2, 3, 2],
    'ASUS4/GB:4': [null, null, 2, 2, 3, 2],
    'ASUS4/GB:5': [null, 5, 4, 2, 3, 0],
    'ASUS4/GB:6': [null, 9, 7, 7, null, 0],
    'AB/A': [null, null, 1, 2, 1, 4],
    'AB/F': [null, 8, 10, 8, 9, 8],
    'AB/F:1': [null, null, 1, 1, 1, 1],
    'AB/GB': [null, null, 1, 1, 1, 2],
    'AB/GB:1': [null, null, 4, 5, 4, 4],
    'AB5': [4, 6, 6, null, null, 4],
    'AB6': [null, 8, 10, 8, 9, 8],
    'AB6:1': [null, null, 1, 1, 1, 1],
    'AB7': [null, null, 1, 1, 1, 2],
    'AB7:1': [null, null, 4, 5, 4, 4],
    'ABAUG': [null, 3, 2, 1, 1, 0],
    'ABDIM/E': [0, 2, 0, 1, 0, 0],
    'ABDIM/E:1': [0, 2, 2, 1, 3, 0],
    'ABDIM/E:2': [null, 2, 0, 1, 3, 0],
    'ABDIM/E:3': [null, null, 0, 1, 0, 0],
    'ABDIM/EB': [null, null, 0, 4, 4, 4],
    'ABDIM/F': [null, 2, 0, 1, 0, 1],
    'ABDIM/F:1': [null, null, 0, 1, 0, 1],
    'ABDIM/F:2': [null, null, 3, 4, 3, 4],
    'ABDIMIN7': [null, 2, 0, 1, 0, 1],
    'ABDIMIN7:1': [null, null, 0, 1, 0, 1],
    'ABDIMIN7:2': [null, null, 3, 4, 3, 4],
    'ABMIN': [null, null, 6, 4, 4, 4],
    'ABMIN/D': [null, null, 0, 4, 4, 4],
    'ABMIN/E': [0, 2, 1, 1, 0, 0],
    'ABMIN/E:1': [0, null, 6, 4, 4, 0],
    'ABMIN/E:2': [null, null, 1, 1, 0, 0],
    'ABMIN/GB': [null, null, 4, 4, 4, 4],
    'ABMIN7': [null, null, 4, 4, 4, 4],
    'ABMAJ': [4, 6, 6, 5, 4, 4],
    'ABSUS': [null, null, 6, 6, 4, 4],
    'ABSUS2/F': [null, 1, 3, 1, 4, 1],
    'B/A': [2, null, 1, 2, 0, 2],
    'B/A:1': [null, 0, 1, 2, 0, 2],
    'B/A:2': [null, 2, 1, 2, 0, 2],
    'B/A:3': [null, 2, 4, 2, 4, 2],
    'B/AB': [null, null, 4, 4, 4, 4],
    'B/E': [null, 2, 2, 4, 4, 2],
    'B/E:1': [null, null, 4, 4, 4, 0],
    'B5': [7, 9, 9, null, null, 2],
    'B5:1': [null, 2, 4, 4, null, 2],
    'B6': [null, null, 4, 4, 4, 4],
    'B7': [2, null, 1, 2, 0, 2],
    'B7:1': [null, 0, 1, 2, 0, 2],
    'B7:2': [null, 2, 1, 2, 0, 2],
    'B7:3': [null, 2, 4, 2, 4, 2],
    'B7/ADD11': [0, 0, 4, 4, 4, 0],
    'B7/ADD11:1': [0, 2, 1, 2, 0, 2],
    'B7SUS4': [null, 0, 4, 4, 0, 0],
    'B7SUS4:1': [null, 2, 4, 2, 5, 2],
    'BAUG': [3, 2, 1, 0, 0, 3],
    'BAUG:1': [3, null, 1, 0, 0, 3],
    'BAUG/E': [3, null, 1, 0, 0, 0],
    'BAUG/E:1': [null, null, 1, 0, 0, 0],
    'BB': [null, null, 0, 3, null, 0],
    'BBAUG': [null, null, 0, 3, 3, 2],
    'BBMAJ': [1, 1, 3, 3, 3, 1],
    'BBMAJ:1': [null, 1, 3, 3, 3, 1],
    'BBMAJ:2': [null, null, 0, 3, 3, 1],
    'BDIM/A': [1, 2, 3, 2, 3, 1],
    'BDIM/A:1': [null, 2, 0, 2, 0, 1],
    'BDIM/A:2': [null, null, 0, 2, 0, 1],
    'BDIM/AB': [null, 2, 0, 1, 0, 1],
    'BDIM/AB:1': [null, null, 0, 1, 0, 1],
    'BDIM/AB:2': [null, null, 3, 4, 3, 4],
    'BDIM/G': [1, null, 0, 0, 0, 3],
    'BDIM/G:1': [3, 2, 0, 0, 0, 1],
    'BDIM/G:2': [null, null, 0, 0, 0, 1],
    'BDIMIN7': [null, 2, 0, 1, 0, 1],
    'BDIMIN7:1': [null, null, 0, 1, 0, 1],
    'BDIMIN7:2': [null, null, 3, 4, 3, 4],
    'BMIN': [2, 2, 4, 4, 3, 2],
    'BMIN:1': [null, 2, 4, 4, 3, 2],
    'BMIN:2': [null, null, 0, 4, 3, 2],
    'BMIN/A': [null, 0, 4, 4, 3, 2],
    'BMIN/A:1': [null, 2, 0, 2, 0, 2],
    'BMIN/A:2': [null, 2, 0, 2, 3, 2],
    'BMIN/A:3': [null, 2, 4, 2, 3, 2],
    'BMIN/A:4': [null, null, 0, 2, 0, 2],
    'BMIN/G': [2, 2, 0, 0, 0, 3],
    'BMIN/G:1': [2, 2, 0, 0, 3, 3],
    'BMIN/G:2': [3, 2, 0, 0, 0, 2],
    'BMIN/G:3': [null, null, 4, 4, 3, 3],
    'BMIN7': [null, 0, 4, 4, 3, 2],
    'BMIN7:1': [null, 2, 0, 2, 0, 2],
    'BMIN7:2': [null, 2, 0, 2, 3, 2],
    'BMIN7:3': [null, 2, 4, 2, 3, 2],
    'BMIN7:4': [null, null, 0, 2, 0, 2],
    'BMIN7{B5}': [1, 2, 3, 2, 3, 1],
    'BMIN7{B5}:1': [null, 2, 0, 2, 0, 1],
    'BMIN7{B5}:2': [null, null, 0, 2, 0, 1],
    'BMIN7/ADD11': [0, 0, 2, 4, 3, 2],
    'BMIN7/ADD11:1': [0, 2, 0, 2, 0, 2],
    'BMAJ': [null, 2, 4, 4, 4, 2],
    'BMAJ7/#11': [null, 2, 3, 3, 4, 2],
    'BSUS': [7, 9, 9, null, null, 0],
    'BSUS:1': [null, 2, 4, 4, null, 0],
    'BSUS2': [null, 4, 4, 4, null, 2],
    'BSUS2:1': [null, null, 4, 4, 2, 2],
    'BSUS2/E': [null, 4, 4, 4, null, 0],
    'BSUS4/A': [null, 0, 4, 4, 0, 0],
    'BSUS4/A:1': [null, 2, 4, 2, 5, 2],
    'BSUS4/AB': [0, 2, 2, 1, 0, 2],
    'BSUS4/AB:1': [0, null, 4, 1, 0, 0],
    'BSUS4/AB:2': [2, 2, 2, 1, 0, 0],
    'BSUS4/DB': [null, 4, 4, 4, null, 0],
    'BSUS4/EB': [null, 2, 2, 4, 4, 2],
    'BSUS4/EB:1': [null, null, 4, 4, 4, 0],
    'BSUS4/G': [0, 2, 2, 0, 0, 2],
    'BSUS4/G:1': [0, 2, 4, 0, 0, 0],
    'BSUS4/G:2': [0, null, 4, 0, 0, 0],
    'BSUS4/G:3': [2, 2, 2, 0, 0, 0],
    'BB/A': [1, 1, 3, 2, 3, 1],
    'BB/AB': [null, 1, 3, 1, 3, 1],
    'BB/AB:1': [null, null, 3, 3, 3, 4],
    'BB/DB': [null, null, 0, 6, 6, 6],
    'BB/E': [null, 1, 3, 3, 3, 0],
    'BB/G': [3, 5, 3, 3, 3, 3],
    'BB/G:1': [null, null, 3, 3, 3, 3],
    'BB5': [6, 8, 8, null, null, 6],
    'BB5:1': [null, 1, 3, 3, null, 6],
    'BB6': [3, 5, 3, 3, 3, 3],
    'BB6:1': [null, null, 3, 3, 3, 3],
    'BB6/ADD9': [null, 3, 3, 3, 3, 3],
    'BB7': [null, 1, 3, 1, 3, 1],
    'BB7:1': [null, null, 3, 3, 3, 4],
    'BB7SUS4': [null, 1, 3, 1, 4, 1],
    'BBADD#11': [null, 1, 3, 3, 3, 0],
    'BBAUG/E': [2, null, 4, 3, 3, 0],
    'BBDIM/C': [null, 3, null, 3, 2, 0],
    'BBDIM/D': [null, null, 0, 3, 2, 0],
    'BBDIM/G': [null, 1, 2, 0, 2, 0],
    'BBDIM/G:1': [null, null, 2, 3, 2, 3],
    'BBDIM/GB': [2, 4, 2, 3, 2, 2],
    'BBDIM/GB:1': [null, null, 4, 3, 2, 0],
    'BBDIMIN7': [null, 1, 2, 0, 2, 0],
    'BBDIMIN7:1': [null, null, 2, 3, 2, 3],
    'BBMIN': [1, 1, 3, 3, 2, 1],
    'BBMIN/AB': [null, 1, 3, 1, 2, 1],
    'BBMIN/D': [null, null, 0, 6, 6, 6],
    'BBMIN/GB': [null, null, 3, 3, 2, 2],
    'BBMIN7': [null, 1, 3, 1, 2, 1],
    'BBMAJ7': [1, 1, 3, 2, 3, 1],
    'BBMAJ9': [null, 3, 3, 3, 3, 5],
    'BBSUS2': [null, null, 3, 3, 1, 1],
    'BBSUS2/G': [null, 3, 5, 3, 6, 3],
    'BBSUS4/AB': [null, 1, 3, 1, 4, 1],
    'C/A': [0, 0, 2, 0, 1, 3],
    'C/A:1': [null, 0, 2, 0, 1, 0],
    'C/A:2': [null, 0, 2, 2, 1, 3],
    'C/A:3': [null, 0, 5, 5, 5, 8],
    'C/B': [0, 3, 2, 0, 0, 0],
    'C/B:1': [null, 2, 2, 0, 1, 0],
    'C/B:2': [null, 3, 5, 4, 5, 3],
    'C/BB': [null, 3, 5, 3, 5, 3],
    'C/D': [3, null, 0, 0, 1, 0],
    'C/D:1': [null, 3, 0, 0, 1, 0],
    'C/D:2': [null, 3, 2, 0, 3, 0],
    'C/D:3': [null, 3, 2, 0, 3, 3],
    'C/D:4': [null, null, 0, 0, 1, 0],
    'C/D:5': [null, null, 0, 5, 5, 3],
    'C/D:6': [null, 10, 12, 12, 13, 0],
    'C/D:7': [null, 5, 5, 5, null, 0],
    'C/F': [null, 3, 3, 0, 1, 0],
    'C/F:1': [null, null, 3, 0, 1, 0],
    'C5': [null, 3, 5, 5, null, 3],
    'C6': [0, 0, 2, 0, 1, 3],
    'C6:1': [null, 0, 2, 0, 1, 0],
    'C6:2': [null, 0, 2, 2, 1, 3],
    'C6:3': [null, 0, 5, 5, 5, 8],
    'C6/ADD9': [null, 5, 7, 5, 8, 0],
    'C7': [null, 3, 5, 3, 5, 3],
    'C7SUS4': [null, 3, 5, 3, 6, 3],
    'C9(B5)': [0, 3, null, 3, 3, 2],
    'CADD9': [3, null, 0, 0, 1, 0],
    'CADD9:1': [null, 3, 0, 0, 1, 0],
    'CADD9:2': [null, 3, 2, 0, 3, 0],
    'CADD9:3': [null, 3, 2, 0, 3, 3],
    'CADD9:4': [null, null, 0, 0, 1, 0],
    'CADD9:5': [null, null, 0, 5, 5, 3],
    'CADD9:6': [null, 10, 12, 12, 13, 0],
    'CADD9:7': [null, 3, 2, 0, 3, 0],
    'CADD9:8': [null, 5, 5, 5, null, 0],
    'CAUG': [null, null, 4, 5, null, 0],
    'CAUG:1': [null, 3, 2, 1, 1, 0],
    'CDIM/A': [null, null, 1, 2, 1, 2],
    'CDIM/AB': [null, null, 1, 1, 1, 2],
    'CDIM/AB:1': [null, null, 4, 5, 4, 4],
    'CDIM/D': [null, 5, 4, 5, 4, 2],
    'CDIMIN7': [null, null, 1, 2, 1, 2],
    'CMIN': [null, 3, 5, 5, 4, 3],
    'CMIN:1': [null, null, 5, 5, 4, 3],
    'CMIN/A': [null, null, 1, 2, 1, 3],
    'CMIN/BB': [null, 3, 5, 3, 4, 3],
    'CM6': [null, null, 1, 2, 1, 3],
    'CMIN7': [null, 3, 5, 3, 4, 3],
    'CMAJ': [0, 3, 2, 0, 1, 0],
    'CMAJ:1': [0, 3, 5, 5, 5, 3],
    'CMAJ:2': [3, 3, 2, 0, 1, 0],
    'CMAJ:3': [3, null, 2, 0, 1, 0],
    'CMAJ:4': [null, 3, 2, 0, 1, 0],
    'CMAJ:5': [null, 3, 5, 5, 5, 0],
    'CMAJ7': [0, 3, 2, 0, 0, 0],
    'CMAJ7:1': [null, 2, 2, 0, 1, 0],
    'CMAJ7:2': [null, 3, 5, 4, 5, 3],
    'CMAJ9': [null, 3, 0, 0, 0, 0],
    'CSUS': [null, 3, 3, 0, 1, 1],
    'CSUS:1': [null, null, 3, 0, 1, 1],
    'CSUS2': [null, 10, 12, 12, 13, 3],
    'CSUS2:1': [null, 5, 5, 5, null, 3],
    'CSUS2:2': [null, 3, 0, 0, 3, 3],
    'CSUS2:3': [null, 3, 5, 5, 3, 3],
    'CSUS2/A': [null, 5, 7, 5, 8, 3],
    'CSUS2/A:1': [null, null, 0, 2, 1, 3],
    'CSUS2/B': [3, 3, 0, 0, 0, 3],
    'CSUS2/B:1': [null, 3, 0, 0, 0, 3],
    'CSUS2/E': [3, null, 0, 0, 1, 0],
    'CSUS2/E:1': [null, 3, 0, 0, 1, 0],
    'CSUS2/E:2': [null, 3, 2, 0, 3, 0],
    'CSUS2/E:3': [null, 3, 2, 0, 3, 3],
    'CSUS2/E:4': [null, null, 0, 0, 1, 0],
    'CSUS2/E:5': [null, null, 0, 5, 5, 3],
    'CSUS2/E:6': [null, 10, 12, 12, 13, 0],
    'CSUS2/E:7': [null, 5, 5, 5, null, 0],
    'CSUS2/F': [3, 3, 0, 0, 1, 1],
    'CSUS4/A': [3, null, 3, 2, 1, 1],
    'CSUS4/A:1': [null, null, 3, 2, 1, 3],
    'CSUS4/B': [null, 3, 3, 0, 0, 3],
    'CSUS4/BB': [null, 3, 5, 3, 6, 3],
    'CSUS4/D': [3, 3, 0, 0, 1, 1],
    'CSUS4/E': [null, 3, 3, 0, 1, 0],
    'CSUS4/E:1': [null, null, 3, 0, 1, 0],
    'D/B': [null, 0, 4, 4, 3, 2],
    'D/B:1': [null, 2, 0, 2, 0, 2],
    'D/B:2': [null, 2, 0, 2, 3, 2],
    'D/B:3': [null, 2, 4, 2, 3, 2],
    'D/B:4': [null, null, 0, 2, 0, 2],
    'D/C': [null, 5, 7, 5, 7, 2],
    'D/C:1': [null, 0, 0, 2, 1, 2],
    'D/C:2': [null, 3, null, 2, 3, 2],
    'D/C:3': [null, 5, 7, 5, 7, 5],
    'D/DB': [null, null, 0, 14, 14, 14],
    'D/DB:1': [null, null, 0, 2, 2, 2],
    'D/E': [0, 0, 0, 2, 3, 2],
    'D/E:1': [0, 0, 4, 2, 3, 0],
    'D/E:2': [2, null, 0, 2, 3, 0],
    'D/E:3': [null, 0, 2, 2, 3, 2],
    'D/E:4': [null, null, 2, 2, 3, 2],
    'D/E:5': [null, 5, 4, 2, 3, 0],
    'D/E:6': [null, 9, 7, 7, null, 0],
    'D/G': [5, null, 4, 0, 3, 5],
    'D/G:1': [3, null, 0, 2, 3, 2],
    'D5': [5, 5, 7, 7, null, 5],
    'D5:1': [null, 0, 0, 2, 3, 5],
    'D6': [null, 0, 4, 4, 3, 2],
    'D6:1': [null, 2, 0, 2, 0, 2],
    'D6:2': [null, 2, 0, 2, 3, 2],
    'D6:3': [null, 2, 4, 2, 3, 2],
    'D6:4': [null, null, 0, 2, 0, 2],
    'D6/ADD9': [0, 0, 2, 4, 3, 2],
    'D6/ADD9:1': [0, 2, 0, 2, 0, 2],
    'D7': [null, 5, 7, 5, 7, 2],
    'D7:1': [null, 0, 0, 2, 1, 2],
    'D7:2': [null, 3, null, 2, 3, 2],
    'D7:3': [null, 5, 7, 5, 7, 5],
    'D7SUS4': [null, 5, 7, 5, 8, 3],
    'D7SUS4:1': [null, null, 0, 2, 1, 3],
    'D9': [0, 0, 0, 2, 1, 2],
    'D9:1': [2, null, 0, 2, 1, 0],
    'D9:2': [null, 5, 7, 5, 7, 0],
    'D9(#5)': [0, 3, null, 3, 3, 2],
    'DADD9': [0, 0, 0, 2, 3, 2],
    'DADD9:1': [0, 0, 4, 2, 3, 0],
    'DADD9:2': [2, null, 0, 2, 3, 0],
    'DADD9:3': [null, 0, 2, 2, 3, 2],
    'DADD9:4': [null, null, 2, 2, 3, 2],
    'DADD9:5': [null, 5, 4, 2, 3, 0],
    'DADD9:6': [null, 9, 7, 7, null, 0],
    'DAUG': [null, null, 0, 3, 3, 2],
    'DAUG/E': [2, null, 4, 3, 3, 0],
    'DDIM/B': [null, 2, 0, 1, 0, 1],
    'DDIM/B:1': [null, null, 0, 1, 0, 1],
    'DDIM/B:2': [null, null, 3, 4, 3, 4],
    'DDIM/BB': [null, 1, 3, 1, 3, 1],
    'DDIM/BB:1': [null, null, 3, 3, 3, 4],
    'DDIM/C': [null, null, 0, 1, 1, 1],
    'DDIMIN7': [null, 2, 0, 1, 0, 1],
    'DDIMIN7:1': [null, null, 0, 1, 0, 1],
    'DDIMIN7:2': [null, null, 3, 4, 3, 4],
    'DMIN': [null, 0, 0, 2, 3, 1],
    'DMIN/B': [1, 2, 3, 2, 3, 1],
    'DMIN/B:1': [null, 2, 0, 2, 0, 1],
    'DMIN/B:2': [null, null, 0, 2, 0, 1],
    'DMIN/BB': [1, 1, 3, 2, 3, 1],
    'DMIN/C': [null, 5, 7, 5, 6, 5],
    'DMIN/C:1': [null, null, 0, 2, 1, 1],
    'DMIN/C:2': [null, null, 0, 5, 6, 5],
    'DMIN/DB': [null, null, 0, 2, 2, 1],
    'DMIN/E': [null, null, 7, 7, 6, 0],
    'DM6': [1, 2, 3, 2, 3, 1],
    'DM6:1': [null, 2, 0, 2, 0, 1],
    'DM6:2': [null, null, 0, 2, 0, 1],
    'DMIN7': [null, 5, 7, 5, 6, 5],
    'DMIN7:1': [null, null, 0, 2, 1, 1],
    'DMIN7:2': [null, null, 0, 5, 6, 5],
    'DMIN7(B5)': [null, null, 0, 1, 1, 1],
    'DMIN7/ADD11': [3, null, 0, 2, 1, 1],
    'DMAJ': [null, 5, 4, 2, 3, 2],
    'DMAJ:1': [null, 9, 7, 7, null, 2],
    'DMAJ:2': [2, 0, 0, 2, 3, 2],
    'DMAJ:3': [null, 0, 0, 2, 3, 2],
    'DMAJ:4': [null, 0, 4, 2, 3, 2],
    'DMAJ:5': [null, null, 0, 2, 3, 2],
    'DMAJ:6': [null, null, 0, 7, 7, 5],
    'DMAJ7': [null, null, 0, 14, 14, 14],
    'DMAJ7:1': [null, null, 0, 2, 2, 2],
    'DMIN/MAJ7': [null, null, 0, 2, 2, 1],
    'DSUS': [5, null, 0, 0, 3, 5],
    'DSUS:1': [3, 0, 0, 0, 3, 3],
    'DSUS:2': [null, 0, 0, 0, 3, 3],
    'DSUS:3': [null, null, 0, 2, 3, 3],
    'DSUS2': [5, 5, 7, 7, null, 0],
    'DSUS2:1': [null, 0, 0, 2, 3, 0],
    'DSUS2:2': [0, 0, 2, 2, 3, 0],
    'DSUS2:3': [null, 0, 2, 2, 3, 0],
    'DSUS2:4': [null, null, 0, 2, 3, 0],
    'DSUS2/AB': [4, null, 0, 2, 3, 0],
    'DSUS2/B': [0, 2, 0, 2, 0, 0],
    'DSUS2/B:1': [null, 2, 0, 2, 3, 0],
    'DSUS2/BB': [0, 1, null, 2, 3, 0],
    'DSUS2/C': [null, null, 0, 2, 1, 0],
    'DSUS2/C:1': [null, null, 0, 5, 5, 5],
    'DSUS2/DB': [null, 0, 0, 2, 2, 0],
    'DSUS2/DB:1': [null, null, 0, 2, 2, 0],
    'DSUS2/DB:2': [null, null, 0, 6, 5, 5],
    'DSUS2/DB:3': [null, null, 0, 9, 10, 9],
    'DSUS2/F': [null, null, 7, 7, 6, 0],
    'DSUS2/G': [null, 0, 2, 0, 3, 0],
    'DSUS2/G:1': [null, 0, 2, 0, 3, 3],
    'DSUS2/G:2': [null, 0, 2, 2, 3, 3],
    'DSUS2/G:3': [5, null, 0, 0, 3, 0],
    'DSUS2/G:4': [null, 0, 0, 0, null, 0],
    'DSUS2/GB': [0, 0, 0, 2, 3, 2],
    'DSUS2/GB:1': [0, 0, 4, 2, 3, 0],
    'DSUS2/GB:2': [2, null, 0, 2, 3, 0],
    'DSUS2/GB:3': [null, 0, 2, 2, 3, 2],
    'DSUS2/GB:4': [null, null, 2, 2, 3, 2],
    'DSUS2/GB:5': [null, 5, 4, 2, 3, 0],
    'DSUS2/GB:6': [null, 9, 7, 7, null, 0],
    'DSUS4/B': [3, 0, 0, 0, 0, 3],
    'DSUS4/B:1': [3, 2, 0, 2, 0, 3],
    'DSUS4/C': [null, 5, 7, 5, 8, 3],
    'DSUS4/C:1': [null, null, 0, 2, 1, 3],
    'DSUS4/E': [null, 0, 2, 0, 3, 0],
    'DSUS4/E:1': [null, 0, 2, 0, 3, 3],
    'DSUS4/E:2': [null, 0, 2, 2, 3, 3],
    'DSUS4/E:3': [5, null, 0, 0, 3, 0],
    'DSUS4/E:4': [null, 0, 0, 0, null, 0],
    'DSUS4/GB': [5, null, 4, 0, 3, 5],
    'DSUS4/GB:1': [3, null, 0, 2, 3, 2],
    'DB/B': [null, 4, 3, 4, 0, 4],
    'DB/BB': [null, 1, 3, 1, 2, 1],
    'DB/C': [null, 3, 3, 1, 2, 1],
    'DB/C:1': [null, 4, 6, 5, 6, 4],
    'DB5': [null, 4, 6, 6, null, 4],
    'DB6': [null, 1, 3, 1, 2, 1],
    'DB7': [null, 4, 3, 4, 0, 4],
    'DBAUG': [null, null, 3, 0, 2, 1],
    'DBAUG:1': [null, 0, 3, 2, 2, 1],
    'DBAUG:2': [null, 0, null, 2, 2, 1],
    'DBAUG/D': [null, null, 0, 2, 2, 1],
    'DBAUG/G': [1, 0, 3, 0, 2, 1],
    'DBDIM/A': [3, null, 2, 2, 2, 0],
    'DBDIM/A:1': [null, 0, 2, 0, 2, 0],
    'DBDIM/A:2': [null, 0, 2, 2, 2, 3],
    'DBDIM/B': [0, 2, 2, 0, 2, 0],
    'DBDIM/BB': [null, 1, 2, 0, 2, 0],
    'DBDIM/BB:1': [null, null, 2, 3, 2, 3],
    'DBDIM/D': [3, null, 0, 0, 2, 0],
    'DBDIM/D:1': [null, null, 0, 0, 2, 0],
    'DBDIMIN7': [null, 1, 2, 0, 2, 0],
    'DBDIMIN7:1': [null, null, 2, 3, 2, 3],
    'DBMIN': [null, 4, 6, 6, 5, 4],
    'DBMIN:1': [null, null, 2, 1, 2, 0],
    'DBMIN:2': [null, 4, 6, 6, null, 0],
    'DBMIN/A': [null, 0, 2, 1, 2, 0],
    'DBMIN/B': [0, 2, 2, 1, 2, 0],
    'DBMIN/B:1': [null, 4, 6, 4, 5, 4],
    'DBMIN7': [0, 2, 2, 1, 2, 0],
    'DBMIN7:1': [null, 4, 6, 4, 5, 4],
    'DBMIN7(B5)': [0, 2, 2, 0, 2, 0],
    'DBMAJ': [4, 4, 6, 6, 6, 4],
    'DBMAJ:1': [null, 4, 3, 1, 2, 1],
    'DBMAJ:2': [null, 4, 6, 6, 6, 4],
    'DBMAJ:3': [null, null, 3, 1, 2, 1],
    'DBMAJ:4': [null, null, 6, 6, 6, 4],
    'DBMAJ7': [null, 3, 3, 1, 2, 1],
    'DBMAJ7:1': [null, 4, 6, 5, 6, 4],
    'DBSUS2': [null, null, 6, 6, 4, 4],
    'DBSUS4/BB': [null, null, 4, 3, 2, 4],
    'E/A': [null, 0, 2, 1, 0, 0],
    'E/D': [0, 2, 0, 1, 0, 0],
    'E/D:1': [0, 2, 2, 1, 3, 0],
    'E/D:2': [null, 2, 0, 1, 3, 0],
    'E/D:3': [null, null, 0, 1, 0, 0],
    'E/DB': [0, 2, 2, 1, 2, 0],
    'E/DB:1': [null, 4, 6, 4, 5, 4],
    'E/EB': [0, 2, 1, 1, 0, 0],
    'E/EB:1': [0, null, 6, 4, 4, 0],
    'E/EB:2': [null, null, 1, 1, 0, 0],
    'E/GB': [0, 2, 2, 1, 0, 2],
    'E/GB:1': [0, null, 4, 1, 0, 0],
    'E/GB:2': [2, 2, 2, 1, 0, 0],
    'E11/B9': [0, 0, 3, 4, 3, 4],
    'E5': [0, 2, null, null, null, 0],
    'E5:1': [null, 7, 9, 9, null, 0],
    'E6': [0, 2, 2, 1, 2, 0],
    'E6:1': [null, 4, 6, 4, 5, 4],
    'E7': [0, 2, 0, 1, 0, 0],
    'E7:1': [0, 2, 2, 1, 3, 0],
    'E7:2': [null, 2, 0, 1, 3, 0],
    'E7:3': [null, null, 0, 1, 0, 0],
    'E7/ADD11': [null, 0, 0, 1, 0, 0],
    'E7/B9(B5)': [0, 1, 3, 1, 3, 1],
    'E7SUS4': [0, 2, 0, 2, 0, 0],
    'E9': [0, 2, 0, 1, 0, 2],
    'E9:1': [2, 2, 0, 1, 0, 0],
    'EADD9': [0, 2, 2, 1, 0, 2],
    'EADD9:1': [0, null, 4, 1, 0, 0],
    'EADD9:2': [2, 2, 2, 1, 0, 0],
    'EAUG': [null, 3, 2, 1, 1, 0],
    'EDIM/C': [null, 3, 5, 3, 5, 3],
    'EDIM/D': [3, null, 0, 3, 3, 0],
    'EDIM/DB': [null, 1, 2, 0, 2, 0],
    'EDIM/DB:1': [null, null, 2, 3, 2, 3],
    'EDIM/EB': [null, null, 5, 3, 4, 0],
    'EDIMIN7': [null, 1, 2, 0, 2, 0],
    'EDIMIN7:1': [null, null, 2, 3, 2, 3],
    'EMIN': [0, 2, 2, 0, 0, 0],
    'EMIN:1': [3, null, 2, 0, 0, 0],
    'EMIN:2': [null, 2, 5, null, null, 0],
    'EMIN/A': [3, null, 2, 2, 0, 0],
    'EMIN/A:1': [null, 0, 2, 0, 0, 0],
    'EMIN/A:2': [null, 0, 5, 4, 5, 0],
    'EMIN/C': [0, 3, 2, 0, 0, 0],
    'EMIN/C:1': [null, 2, 2, 0, 1, 0],
    'EMIN/C:2': [null, 3, 5, 4, 5, 3],
    'EMIN/D': [0, 2, 0, 0, 0, 0],
    'EMIN/D:1': [0, 2, 0, 0, 3, 0],
    'EMIN/D:2': [0, 2, 2, 0, 3, 0],
    'EMIN/D:3': [0, 2, 2, 0, 3, 3],
    'EMIN/D:4': [null, null, 0, 12, 12, 12],
    'EMIN/D:5': [null, null, 0, 9, 8, 7],
    'EMIN/D:6': [null, null, 2, 4, 3, 3],
    'EMIN/D:7': [0, null, 0, 0, 0, 0],
    'EMIN/D:8': [null, 10, 12, 12, 12, 0],
    'EMIN/DB': [0, 2, 2, 0, 2, 0],
    'EMIN/EB': [3, null, 1, 0, 0, 0],
    'EMIN/EB:1': [null, null, 1, 0, 0, 0],
    'EMIN/GB': [0, 2, 2, 0, 0, 2],
    'EMIN/GB:1': [0, 2, 4, 0, 0, 0],
    'EMIN/GB:2': [0, null, 4, 0, 0, 0],
    'EMIN/GB:3': [2, 2, 2, 0, 0, 0],
    'EM6': [0, 2, 2, 0, 2, 0],
    'EMIN7': [0, 2, 0, 0, 0, 0],
    'EMIN7:1': [0, 2, 0, 0, 3, 0],
    'EMIN7:2': [0, 2, 2, 0, 3, 0],
    'EMIN7:3': [0, 2, 2, 0, 3, 3],
    'EMIN7:4': [null, null, 0, 0, 0, 0],
    'EMIN7:5': [null, null, 0, 12, 12, 12],
    'EMIN7:6': [null, null, 0, 9, 8, 7],
    'EMIN7:7': [null, null, 2, 4, 3, 3],
    'EMIN7:8': [0, null, 0, 0, 0, 0],
    'EMIN7:9': [null, 10, 12, 12, 12, 0],
    'EMIN7(B5)': [3, null, 0, 3, 3, 0],
    'EMIN7/ADD11': [0, 0, 0, 0, 0, 0],
    'EMIN7/ADD11:1': [0, 0, 0, 0, 0, 3],
    'EMIN7/ADD11:2': [3, null, 0, 2, 0, 0],
    'EM9': [0, 2, 0, 0, 0, 2],
    'EM9:1': [0, 2, 0, 0, 3, 2],
    'EM9:2': [2, 2, 0, 0, 0, 0],
    'EMAJ': [0, 2, 2, 1, 0, 0],
    'EMAJ:1': [null, 7, 6, 4, 5, 0],
    'EMAJ7': [0, 2, 1, 1, 0, 0],
    'EMAJ7:1': [0, null, 6, 4, 4, 0],
    'EMAJ7:2': [null, null, 1, 1, 0, 0],
    'EMAJ9': [0, 2, 1, 1, 0, 2],
    'EMAJ9:1': [4, null, 4, 4, 4, 0],
    'EMIN/MAJ7': [3, null, 1, 0, 0, 0],
    'EMIN/MAJ7:1': [null, null, 1, 0, 0, 0],
    'EMIN/MAJ9': [0, 6, 4, 0, 0, 0],
    'ESUS': [0, 0, 2, 2, 0, 0],
    'ESUS:1': [0, 0, 2, 4, 0, 0],
    'ESUS:2': [0, 2, 2, 2, 0, 0],
    'ESUS:3': [null, 0, 2, 2, 0, 0],
    'ESUS:4': [null, null, 2, 2, 0, 0],
    'ESUS2': [7, 9, 9, null, null, 0],
    'ESUS2:1': [null, 2, 4, 4, null, 0],
    'ESUS2/A': [null, 0, 4, 4, 0, 0],
    'ESUS2/A:1': [null, 2, 4, 2, 5, 2],
    'ESUS2/AB': [0, 2, 2, 1, 0, 2],
    'ESUS2/AB:1': [0, null, 4, 1, 0, 0],
    'ESUS2/AB:2': [2, 2, 2, 1, 0, 0],
    'ESUS2/DB': [null, 4, 4, 4, null, 0],
    'ESUS2/EB': [null, 2, 2, 4, 4, 2],
    'ESUS2/EB:1': [null, null, 4, 4, 4, 0],
    'ESUS2/G': [0, 2, 2, 0, 0, 2],
    'ESUS2/G:1': [0, 2, 4, 0, 0, 0],
    'ESUS2/G:2': [0, null, 4, 0, 0, 0],
    'ESUS2/G:3': [2, 2, 2, 0, 0, 0],
    'ESUS4/AB': [null, 0, 2, 1, 0, 0],
    'ESUS4/C': [0, 0, 7, 5, 0, 0],
    'ESUS4/C:1': [null, 3, 2, 2, 0, 0],
    'ESUS4/D': [0, 2, 0, 2, 0, 0],
    'ESUS4/D:1': [null, 2, 0, 2, 3, 0],
    'ESUS4/DB': [0, 0, 2, 4, 2, 0],
    'ESUS4/DB:1': [null, 0, 7, 6, 0, 0],
    'ESUS4/EB': [null, 2, 1, 2, 0, 0],
    'ESUS4/F': [0, 0, 3, 2, 0, 0],
    'ESUS4/G': [3, null, 2, 2, 0, 0],
    'ESUS4/G:1': [null, 0, 2, 0, 0, 0],
    'ESUS4/G:2': [null, 0, 5, 4, 5, 0],
    'ESUS4/GB': [null, 0, 4, 4, 0, 0],
    'ESUS4/GB:1': [null, 2, 4, 2, 5, 2],
    'EB/C': [null, 3, 5, 3, 4, 3],
    'EB/D': [null, 6, 8, 7, 8, 6],
    'EB/DB': [null, 1, 1, 3, 2, 3],
    'EB/DB:1': [null, 6, 8, 6, 8, 6],
    'EB/DB:2': [null, null, 1, 3, 2, 3],
    'EB/E': [null, null, 5, 3, 4, 0],
    'EB5': [null, 6, 8, 8, null, 6],
    'EB6': [null, 3, 5, 3, 4, 3],
    'EB7': [null, 1, 1, 3, 2, 3],
    'EB7:1': [null, 6, 8, 6, 8, 6],
    'EB7:2': [null, null, 1, 3, 2, 3],
    'EBAUG': [3, 2, 1, 0, 0, 3],
    'EBAUG:1': [3, null, 1, 0, 0, 3],
    'EBAUG/E': [3, null, 1, 0, 0, 0],
    'EBAUG/E:1': [null, null, 1, 0, 0, 0],
    'EBDIM/B': [2, null, 1, 2, 0, 2],
    'EBDIM/B:1': [null, 0, 1, 2, 0, 2],
    'EBDIM/B:2': [null, 2, 1, 2, 0, 2],
    'EBDIM/B:3': [null, 2, 4, 2, 4, 2],
    'EBDIM/C': [null, null, 1, 2, 1, 2],
    'EBDIMIN7': [null, null, 1, 2, 1, 2],
    'EBMIN': [null, null, 4, 3, 4, 2],
    'EBMIN/DB': [null, null, 1, 3, 2, 2],
    'EBMIN7': [null, null, 1, 3, 2, 2],
    'EBMAJ': [null, 1, 1, 3, 4, 3],
    'EBMAJ:1': [null, null, 1, 3, 4, 3],
    'EBMAJ:2': [null, null, 5, 3, 4, 3],
    'EBMAJ7': [null, 6, 8, 7, 8, 6],
    'EBSUS2/AB': [null, 1, 3, 1, 4, 1],
    'EBSUS4/F': [null, 1, 3, 1, 4, 1],
    'F/D': [null, 5, 7, 5, 6, 5],
    'F/D:1': [null, null, 0, 2, 1, 1],
    'F/D:2': [null, null, 0, 5, 6, 5],
    'F/E': [0, 0, 3, 2, 1, 0],
    'F/E:1': [1, 3, 3, 2, 1, 0],
    'F/E:2': [1, null, 2, 2, 1, 0],
    'F/E:3': [null, null, 2, 2, 1, 1],
    'F/E:4': [null, null, 3, 2, 1, 0],
    'F/EB': [null, null, 1, 2, 1, 1],
    'F/EB:1': [null, null, 3, 5, 4, 5],
    'F/G': [3, null, 3, 2, 1, 1],
    'F/G:1': [null, null, 3, 2, 1, 3],
    'F5': [1, 3, 3, null, null, 1],
    'F5:1': [null, 8, 10, null, null, 1],
    'F6': [null, 5, 7, 5, 6, 5],
    'F6:1': [null, null, 0, 2, 1, 1],
    'F6:2': [null, null, 0, 5, 6, 5],
    'F6/ADD9': [3, null, 0, 2, 1, 1],
    'F7': [null, null, 1, 2, 1, 1],
    'F7:1': [null, null, 3, 5, 4, 5],
    'FADD9': [3, null, 3, 2, 1, 1],
    'FADD9:1': [null, null, 3, 2, 1, 3],
    'FAUG': [null, 0, 3, 2, 2, 1],
    'FAUG:1': [null, 0, null, 2, 2, 1],
    'FAUG/D': [null, null, 0, 2, 2, 1],
    'FAUG/G': [1, 0, 3, 0, 2, 1],
    'FDIM/D': [null, 2, 0, 1, 0, 1],
    'FDIM/D:1': [null, null, 0, 1, 0, 1],
    'FDIM/D:2': [null, null, 3, 4, 3, 4],
    'FDIM/DB': [null, 4, 3, 4, 0, 4],
    'FDIMIN7': [null, 2, 0, 1, 0, 1],
    'FDIMIN7:1': [null, null, 0, 1, 0, 1],
    'FDIMIN7:2': [null, null, 3, 4, 3, 4],
    'FMIN': [null, 3, 3, 1, 1, 1],
    'FMIN:1': [null, null, 3, 1, 1, 1],
    'FMIN/D': [null, null, 0, 1, 1, 1],
    'FMIN/DB': [null, 3, 3, 1, 2, 1],
    'FMIN/DB:1': [null, 4, 6, 5, 6, 4],
    'FMIN/EB': [null, 8, 10, 8, 9, 8],
    'FMIN/EB:1': [null, null, 1, 1, 1, 1],
    'FM6': [null, null, 0, 1, 1, 1],
    'FMIN7': [null, 8, 10, 8, 9, 8],
    'FMIN7:1': [null, null, 1, 1, 1, 1],
    'FMAJ': [1, 3, 3, 2, 1, 1],
    'FMAJ:1': [null, 0, 3, 2, 1, 1],
    'FMAJ:2': [null, 3, 3, 2, 1, 1],
    'FMAJ:3': [null, null, 3, 2, 1, 1],
    'FMAJ7': [0, 0, 3, 2, 1, 0],
    'FMAJ7:1': [1, 3, 3, 2, 1, 0],
    'FMAJ7:2': [1, null, 2, 2, 1, 0],
    'FMAJ7:3': [null, null, 2, 2, 1, 1],
    'FMAJ7:4': [null, null, 3, 2, 1, 0],
    'FMAJ7/#11': [0, 2, 3, 2, 1, 0],
    'FMAJ7/#11:1': [1, 3, 3, 2, 0, 0],
    'FMAJ9': [0, 0, 3, 0, 1, 3],
    'FSUS': [null, null, 3, 3, 1, 1],
    'FSUS2': [null, 3, 3, 0, 1, 1],
    'FSUS2:1': [null, null, 3, 0, 1, 1],
    'FSUS2/A': [3, null, 3, 2, 1, 1],
    'FSUS2/A:1': [null, null, 3, 2, 1, 3],
    'FSUS2/B': [null, 3, 3, 0, 0, 3],
    'FSUS2/BB': [null, 3, 5, 3, 6, 3],
    'FSUS2/D': [3, 3, 0, 0, 1, 1],
    'FSUS2/E': [null, 3, 3, 0, 1, 0],
    'FSUS2/E:1': [null, null, 3, 0, 1, 0],
    'FSUS4/G': [null, 3, 5, 3, 6, 3],
    'G/A': [3, 0, 0, 0, 0, 3],
    'G/A:1': [3, 2, 0, 2, 0, 3],
    'G/C': [3, 3, 0, 0, 0, 3],
    'G/C:1': [null, 3, 0, 0, 0, 3],
    'G/E': [0, 2, 0, 0, 0, 0],
    'G/E:1': [0, 2, 0, 0, 3, 0],
    'G/E:2': [0, 2, 2, 0, 3, 0],
    'G/E:3': [0, 2, 2, 0, 3, 3],
    'G/E:4': [null, null, 0, 12, 12, 12],
    'G/E:5': [null, null, 0, 9, 8, 7],
    'G/E:6': [null, null, 2, 4, 3, 3],
    'G/E:7': [0, null, 0, 0, 0, 0],
    'G/E:8': [null, 10, 12, 12, 12, 0],
    'G/F': [1, null, 0, 0, 0, 3],
    'G/F:1': [3, 2, 0, 0, 0, 1],
    'G/F:2': [null, null, 0, 0, 0, 1],
    'G/GB': [2, 2, 0, 0, 0, 3],
    'G/GB:1': [2, 2, 0, 0, 3, 3],
    'G/GB:2': [3, 2, 0, 0, 0, 2],
    'G/GB:3': [null, null, 4, 4, 3, 3],
    'G5': [3, 5, 5, null, null, 3],
    'G5:1': [3, null, 0, 0, 3, 3],
    'G6': [0, 2, 0, 0, 0, 0],
    'G6:1': [0, 2, 0, 0, 3, 0],
    'G6:2': [0, 2, 2, 0, 3, 0],
    'G6:3': [0, 2, 2, 0, 3, 3],
    'G6:4': [null, null, 0, 12, 12, 12],
    'G6:5': [null, null, 0, 9, 8, 7],
    'G6:6': [null, null, 2, 4, 3, 3],
    'G6:7': [0, null, 0, 0, 0, 0],
    'G6:8': [null, 10, 12, 12, 12, 0],
    'G6/ADD9': [0, 0, 0, 0, 0, 0],
    'G6/ADD9:1': [0, 0, 0, 0, 0, 3],
    'G6/ADD9:2': [3, null, 0, 2, 0, 0],
    'G7': [1, null, 0, 0, 0, 3],
    'G7:1': [3, 2, 0, 0, 0, 1],
    'G7:2': [null, null, 0, 0, 0, 1],
    'G7/ADD11': [null, 3, 0, 0, 0, 1],
    'G7SUS4': [3, 3, 0, 0, 1, 1],
    'G9': [null, 0, 0, 0, 0, 1],
    'G9:1': [null, 2, 3, 2, 3, 3],
    'GADD9': [3, 0, 0, 0, 0, 3],
    'GADD9:1': [3, 2, 0, 2, 0, 3],
    'GAUG': [3, 2, 1, 0, 0, 3],
    'GAUG:1': [3, null, 1, 0, 0, 3],
    'GAUG/E': [3, null, 1, 0, 0, 0],
    'GAUG/E:1': [null, null, 1, 0, 0, 0],
    'GDIM/E': [null, 1, 2, 0, 2, 0],
    'GDIM/E:1': [null, null, 2, 3, 2, 3],
    'GDIM/EB': [null, 1, 1, 3, 2, 3],
    'GDIM/EB:1': [null, 6, 8, 6, 8, 6],
    'GDIM/EB:2': [null, null, 1, 3, 2, 3],
    'GDIMIN7': [null, 1, 2, 0, 2, 0],
    'GDIMIN7:1': [null, null, 2, 3, 2, 3],
    'GMIN': [3, 5, 5, 3, 3, 3],
    'GMIN:1': [null, null, 0, 3, 3, 3],
    'GMIN/E': [3, null, 0, 3, 3, 0],
    'GMIN/EB': [null, 6, 8, 7, 8, 6],
    'GMIN/F': [3, 5, 3, 3, 3, 3],
    'GMIN/F:1': [null, null, 3, 3, 3, 3],
    'GM13': [0, 0, 3, 3, 3, 3],
    'GM6': [3, null, 0, 3, 3, 0],
    'GMIN7': [3, 5, 3, 3, 3, 3],
    'GMIN7:1': [null, null, 3, 3, 3, 3],
    'GMIN7/ADD11': [null, 3, 3, 3, 3, 3],
    'GM9': [3, 5, 3, 3, 3, 5],
    'GMAJ': [null, 10, 12, 12, 12, 10],
    'GMAJ:1': [3, 2, 0, 0, 0, 3],
    'GMAJ:2': [3, 2, 0, 0, 3, 3],
    'GMAJ:3': [3, 5, 5, 4, 3, 3],
    'GMAJ:4': [3, null, 0, 0, 0, 3],
    'GMAJ:5': [null, 5, 5, 4, 3, 3],
    'GMAJ:6': [null, null, 0, 4, 3, 3],
    'GMAJ:7': [null, null, 0, 7, 8, 7],
    'GMAJ7': [2, 2, 0, 0, 0, 3],
    'GMAJ7:1': [2, 2, 0, 0, 3, 3],
    'GMAJ7:2': [3, 2, 0, 0, 0, 2],
    'GMAJ7:3': [null, null, 4, 4, 3, 3],
    'GSUS': [null, 10, 12, 12, 13, 3],
    'GSUS:1': [null, 3, 0, 0, 3, 3],
    'GSUS:2': [null, 3, 5, 5, 3, 3],
    'GSUS:3': [null, 5, 5, 5, 3, 3],
    'GSUS2': [5, null, 0, 0, 3, 5],
    'GSUS2:1': [3, 0, 0, 0, 3, 3],
    'GSUS2:2': [null, 0, 0, 0, 3, 3],
    'GSUS2:3': [null, null, 0, 2, 3, 3],
    'GSUS2/B': [3, 0, 0, 0, 0, 3],
    'GSUS2/B:1': [3, 2, 0, 2, 0, 3],
    'GSUS2/C': [null, 5, 7, 5, 8, 3],
    'GSUS2/C:1': [null, null, 0, 2, 1, 3],
    'GSUS2/E': [null, 0, 2, 0, 3, 0],
    'GSUS2/E:1': [null, 0, 2, 0, 3, 3],
    'GSUS2/E:2': [null, 0, 2, 2, 3, 3],
    'GSUS2/E:3': [5, 0, 0, 0, 3, 0],
    'GSUS2/GB': [5, null, 4, 0, 3, 5],
    'GSUS2/GB:1': [3, null, 0, 2, 3, 2],
    'GSUS4/A': [null, 5, 7, 5, 8, 3],
    'GSUS4/A:1': [null, null, 0, 2, 1, 3],
    'GSUS4/B': [3, 3, 0, 0, 0, 3],
    'GSUS4/B:1': [null, 3, 0, 0, 0, 3],
    'GSUS4/E': [3, null, 0, 0, 1, 0],
    'GSUS4/E:1': [null, 3, 0, 0, 1, 0],
    'GSUS4/E:2': [null, 3, 2, 0, 3, 0],
    'GSUS4/E:3': [null, 3, 2, 0, 3, 3],
    'GSUS4/E:4': [null, null, 0, 0, 1, 0],
    'GSUS4/E:5': [null, null, 0, 5, 5, 3],
    'GSUS4/E:6': [null, 10, 12, 12, 13, 0],
    'GSUS4/E:7': [null, 5, 5, 5, null, 0],
    'GSUS4/F': [3, 3, 0, 0, 1, 1],
    'GB/AB': [null, null, 4, 3, 2, 4],
    'GB/E': [2, 4, 2, 3, 2, 2],
    'GB/E:1': [null, null, 4, 3, 2, 0],
    'GB/EB': [null, null, 1, 3, 2, 2],
    'GB/F': [null, null, 3, 3, 2, 2],
    'GB6': [null, null, 1, 3, 2, 2],
    'GB7': [2, 4, 2, 3, 2, 2],
    'GB7:1': [null, null, 4, 3, 2, 0],
    'GB7(#5)': [2, null, 4, 3, 3, 0],
    'GB7/#9': [null, 0, 4, 3, 2, 0],
    'GB7SUS4': [null, 4, 4, 4, null, 0],
    'GBADD9': [null, null, 4, 3, 2, 4],
    'GBAUG': [null, null, 0, 3, 3, 2],
    'GBAUG/E': [2, null, 4, 3, 3, 0],
    'GBDIM/D': [null, 5, 7, 5, 7, 2],
    'GBDIM/D:1': [null, 0, 0, 2, 1, 2],
    'GBDIM/D:2': [null, 3, null, 2, 3, 2],
    'GBDIM/D:3': [null, 5, 7, 5, 7, 5],
    'GBDIM/E': [null, 0, 2, 2, 1, 2],
    'GBDIM/E:1': [null, null, 2, 2, 1, 2],
    'GBDIM/EB': [null, null, 1, 2, 1, 2],
    'GBDIMIN7': [null, null, 1, 2, 1, 2],
    'GBMIN': [2, 4, 4, 2, 2, 2],
    'GBMIN:1': [null, 4, 4, 2, 2, 2],
    'GBMIN:2': [null, null, 4, 2, 2, 2],
    'GBMIN/D': [null, null, 0, 14, 14, 14],
    'GBMIN/D:1': [null, null, 0, 2, 2, 2],
    'GBMIN/E': [0, 0, 2, 2, 2, 2],
    'GBMIN/E:1': [0, null, 4, 2, 2, 0],
    'GBMIN/E:2': [2, null, 2, 2, 2, 0],
    'GBMIN/E:3': [null, 0, 4, 2, 2, 0],
    'GBMIN/E:4': [null, null, 2, 2, 2, 2],
    'GBMIN7': [0, 0, 2, 2, 2, 2],
    'GBMIN7:1': [0, null, 4, 2, 2, 0],
    'GBMIN7:2': [2, null, 2, 2, 2, 0],
    'GBMIN7:3': [null, 0, 4, 2, 2, 0],
    'GBMIN7:4': [null, null, 2, 2, 2, 2],
    'GBMIN7(B5)': [null, 0, 2, 2, 1, 2],
    'GBMIN7(B5):1': [null, null, 2, 2, 1, 2],
    'GBMIN7/B9': [0, 0, 2, 0, 2, 2],
    'GBMAJ': [2, 4, 4, 3, 2, 2],
    'GBMAJ:1': [null, 4, 4, 3, 2, 2],
    'GBMAJ:2': [null, null, 4, 3, 2, 2],
    'GBMAJ7': [null, null, 3, 3, 2, 2],
    'GBSUS': [null, 4, 4, 4, 2, 2],
    'GBSUS2/BB': [null, null, 4, 3, 2, 4],
    'GBSUS4/E': [null, 4, 4, 4, null, 0]
  };

  const KEY_CHORDS = {
    'MAJ': [0, 4, 7],
    'MIN': [0, 3, 7],
    '7': [0, 4, 7, 10],
    'MIN7': [0, 3, 7, 10],
    'MAJ7': [0, 3, 7, 11],
    '6': [0, 4, 7, 9],
    'MIN6': [0, 3, 7, 9],
    'AUG': [0, 3, 8],
    'AUG7': [0, 4, 8, 11],
    'DIM': [0, 3, 6],
    'DIM7': [0, 3, 6, 9],
    '7{5B}': [0, 4, 6, 10],
    'MIN7{5B}': [0, 3, 6, 10],
    '9': [0, 4, 7, 10, 14],
    'MIN9': [0, 3, 7, 10, 14],
    'MAJ9': [0, 4, 7, 11, 14],
    '11': [0, 4, 7, 10, 14, 17],
    'DIM9': [0, 4, 7, 10, 13],
    '{9}': [0, 4, 7, 14],
    '{4}': [0, 4, 7, 17],
    'SUS': [0, 5, 7],
    'SUS9': [0, 7, 14],
    '7SUS': [0, 5, 7, 10],
    '7SUS9': [0, 2, 7, 10],
    '5': [0, 7],
    'MAJ:1': [0, 4, -5],
    'MIN:1': [0, 3, -5],
    '7:1': [0, 4, 7, -2],
    'MIN7:1': [0, 3, 7, -2],
    'MAJ7:1': [0, 3, 7, -1],
    '6:1': [0, 4, 7, -3],
    'MIN6:1': [0, 3, 7, -3],
    'AUG:1': [0, 3, -4],
    'AUG7:1': [0, 4, 8, -1],
    'DIM:1': [0, 3, -6],
    'DIM7:1': [0, 3, 6, -3],
    '7{5B}:1': [0, 4, 6, -2],
    'MIN7{5B}:1': [0, 3, 6, -2],
    '9:1': [0, 4, 7, 10, 2],
    'MIN9:1': [0, 3, 7, 10, 2],
    'MAJ9:1': [0, 4, 7, 11, 2],
    '11:1': [0, 4, 7, 10, 14, 5],
    'DIM9:1': [0, 4, 7, 10, 1],
    '{9}:1': [0, 4, 7, 2],
    '{4}:1': [0, 4, 7, 5],
    'SUS:1': [0, 5, -5],
    'SUS9:1': [0, 7, 2],
    '7SUS:1': [0, 5, 7, -2],
    '7SUS9:1': [0, 2, 7, -2],
    '5:1': [0, -5],
    'MAJ:2': [12, 4, 7],
    'MIN:2': [12, 3, 7],
    '7:2': [12, 4, 7, 10],
    'MIN7:2': [12, 3, 7, 10],
    'MAJ7:2': [12, 3, 7, 11],
    '6:2': [12, 4, 7, 9],
    'MIN6:2': [12, 3, 7, 9],
    'AUG:2': [12, 3, 8],
    'AUG7:2': [12, 4, 8, 11],
    'DIM:2': [12, 3, 6],
    'DIM7:2': [12, 3, 6, 9],
    '7{5B}:2': [12, 4, 6, 10],
    'MIN7{5B}:2': [12, 3, 6, 10],
    '9:2': [12, 4, 7, 10, 14],
    'MIN9:2': [12, 3, 7, 10, 14],
    'MAJ9:2': [12, 4, 7, 11, 14],
    '11:2': [12, 4, 7, 10, 14, 17],
    'DIM9:2': [12, 4, 7, 10, 13],
    '{9}:2': [12, 4, 7, 14],
    '{4}:2': [12, 4, 7, 17],
    'SUS:2': [12, 5, 7],
    'SUS9:2': [12, 7, 14],
    '7SUS:2': [12, 5, 7, 10],
    '7SUS9:2': [12, 2, 7, 10],
    '5:2': [12, 7],
    '7:3': [0, 4, -5, -2],
    'MIN7:3': [0, 3, -5, -2],
    'MAJ7:3': [0, 3, -5, -1],
    '6:3': [0, 4, -5, -3],
    'MIN6:3': [0, 3, -5, -3],
    'AUG7:3': [0, 4, -4, -1],
    'DIM7:3': [0, 3, -6, -3],
    '7{5B}:3': [0, 4, -6, -2],
    'MIN7{5B}:3': [0, 3, -6, -2],
    '9:3': [0, 4, 7, -2, 2],
    'MIN9:3': [0, 3, 7, -2, 2],
    'MAJ9:3': [0, 4, 7, -1, 2],
    '11:3': [0, 4, 7, 10, 2, 5],
    'DIM9:3': [0, 4, 7, -2, 1],
    '{9}:3': [0, 4, -5, 2],
    '{4}:3': [0, 4, -5, 5],
    '7SUS:3': [0, 5, -5, -2],
    '7SUS9:3': [0, 2, -5, -2],
    '9:4': [0, 4, -5, -2, 2],
    'MIN9:4': [0, 3, -5, -2, 2],
    'MAJ9:4': [0, 4, -5, -1, 2],
    '11:4': [0, 4, 7, -2, 2, 5],
    'DIM9:4': [0, 4, -5, -2, 1],
    '11:5': [0, 4, -5, -2, 2, 5]
  };

  const NUMBER_LIST_CACHE = new Map();
  const GUITAR_FRET_CACHE = new Map();

  function musicpadToMidi(source, options) {
    return new MusicpadEngine(options).render(source);
  }

  class MusicpadEngine {
    constructor(options) {
      this.options = options || {};
      this.rng = this.options.rng || Math.random;
      this.gaussPhase = 0;
      this.gaussV1 = 0;
      this.gaussV2 = 0;
      this.gaussS = 1;
      this.reset();
    }

    reset() {
      this.tempo = valueOr(this.options.tempo, 60);
      this.ppqn = valueOr(this.options.ppqn, 192);
      this.gduty = valueOr(valueOr(this.options.duty, this.options.gduty), 100);
      this.gvel = valueOr(valueOr(valueOr(this.options.velocity, this.options.vel), this.options.gvel), 100);
      this.debug = 0;
      this.gloosew = 0;
      this.glooseq = 1;
      this.gvelvarw = 0;
      this.gvelvarq = 1;
      this.globalguitmode = 0;
      this.string = '';
      this.mtracks = [];
    }

    render(source) {
      this.reset();
      if (source == null) source = 'c e g g+';

      this.string = ` ${String(source)} \n`;
      this.string = this.string.replace(/\s#.*\n/g, ' \n ');
      this.string = this.string.replace(/\s#.*\n/g, ' \n ');

      this.globalSettings();

      this.string = this.string.replace(/\s/g, ' ');
      this.string = this.string.replace(/\(/gi, ' ( ');
      this.string = this.string.replace(/\)/gi, ' ) ');
      this.string = compactSpaces(this.string);

      this.processMacro();
      const tracks = this.expandTracks();

      for (const track of tracks) {
        if (track == null || /^\s*$/.test(track)) continue;
        this.addTrack(track);
      }

      return this.postOut();
    }

    globalSettings() {
      let match;
      if (this.string.includes('dEbUgMaX')) {
        this.debug = 2;
        this.string = this.string.replace('dEbUgMaX', '');
      }
      if (this.string.includes('dEbUg')) {
        this.debug = 1;
        this.string = this.string.replace('dEbUg', '');
      }
      if ((match = this.string.match(/tempo(\d+)/i))) {
        this.tempo = Number(match[1]);
        this.string = this.string.replace(/tempo(\d+)/i, '');
      }
      if ((match = this.string.match(/resolution(\d+)/i))) {
        const mode = Number(match[1]);
        if (mode === 0) this.ppqn = 96;
        else if (mode === 1) this.ppqn = 192;
        else if (mode === 2) this.ppqn = 384;
        else if (mode === 3) this.ppqn = 1536;
        else this.ppqn = mode;
        this.string = this.string.replace(/resolution(\d+)/i, '');
      }
      if ((match = this.string.match(/duty(\d+)/i))) {
        this.gduty = Number(match[1]);
        this.string = this.string.replace(/duty(\d+)/i, '');
      }
      if ((match = this.string.match(/velocity(\d+)/i))) {
        this.gvel = Number(match[1]);
        this.string = this.string.replace(/velocity(\d+)/i, '');
      }
      if ((match = this.string.match(/globaloose(\d+),(\d+|G)/i))) {
        this.gloosew = Number(match[1]);
        this.glooseq = match[2];
        this.string = this.string.replace(/globaloose(\d+),(\d+|G)/i, '');
      }
      if ((match = this.string.match(/globalvelvar(\d+),(\d+|G)/i))) {
        this.gvelvarw = Number(match[1]);
        this.gvelvarq = match[2];
        this.string = this.string.replace(/globalvelvar(\d+),(\d+|G)/i, '');
      }
      if (/globalguiton/i.test(this.string)) {
        this.globalguitmode = 1;
        this.string = this.string.replace(/globalguiton/i, '');
      }
    }

    processMacro() {
      const macro = Object.create(null);
      const macrornd = Object.create(null);
      let foundmacro = false;
      let macpos;

      while ((macpos = this.string.indexOf('m$')) !== -1) {
        foundmacro = true;
        const macstart = this.string.indexOf('(', macpos);
        if (macstart === -1) this.error('macro definition missing opening parenthesis');
        const macend = this.getBound(this.string, macstart, '(', ')');
        const key = this.string.slice(macpos + 2, macstart).replace(/\s+/g, '');
        macro[key] = ` ${this.string.slice(macstart, macend + 1)} `;
        this.string = this.string.slice(0, macpos) + this.string.slice(macend + 1);
      }
      this.string = compactSpaces(this.string);

      while ((macpos = this.string.indexOf('mrnd$')) !== -1) {
        foundmacro = true;
        const macstart = this.string.indexOf('(', macpos);
        if (macstart === -1) this.error('random macro definition missing opening parenthesis');
        const macend = this.getBound(this.string, macstart, '(', ')');
        const key = this.string.slice(macpos + 5, macstart).replace(/\s+/g, '');
        macrornd[key] = this.string.slice(macstart + 1, macend).replace(/^\s+/, '').replace(/\s+$/, '');
        this.string = this.string.slice(0, macpos) + this.string.slice(macend + 1);
      }
      this.string = compactSpaces(this.string);

      let expSomething = true;
      let amokcount = 0;
      while (expSomething) {
        expSomething = false;
        if (500 < amokcount++) this.error('macro expansion ran amok. self-reference?');
        this.expandMul();
        this.string = compactSpaces(this.string);
        if (foundmacro) {
          this.string = this.string.replace(/\$([a-z0-9\-_]+)/gi, (_all, name) => {
            expSomething = true;
            if (macro[name] == null && macrornd[name] == null) this.error(`macro ${name} not defined`);
            return this.writeMac(name, macro, macrornd);
          });
        }
        this.string = compactSpaces(this.string);
      }
    }

    writeMac(which, macro, macrornd) {
      if (macro[which] != null) return macro[which];
      if (macrornd[which] != null) {
        const choices = macrornd[which].split(/\s+/).filter(Boolean);
        return choices[Math.floor(this.rng() * choices.length)];
      }
      this.error(`strange, I can't find macro ${which} !!!`);
    }

    expandMul() {
      let starpos;
      while ((starpos = this.string.indexOf('*')) !== -1) {
        let pre = this.string.slice(0, starpos);
        let post = this.string.slice(starpos + 1);

        let factorStart = 0;
        while (factorStart < post.length && /\s/.test(post[factorStart])) factorStart += 1;
        let factorEnd = factorStart;
        while (factorEnd < post.length && /[\d.*]/.test(post[factorEnd])) factorEnd += 1;
        if (factorEnd === factorStart) this.error("illegal repeat: can't find factor");
        const rpt = parseInt(post.slice(factorStart, factorEnd), 10);
        if (!Number.isFinite(rpt) || rpt < 0) this.error('illegal repeat factor');
        post = post.slice(factorEnd);

        let what;
        let preEnd = pre.length - 1;
        while (preEnd >= 0 && /\s/.test(pre[preEnd])) preEnd -= 1;
        if (preEnd >= 0 && pre[preEnd] === ')') {
          pre = pre.slice(0, preEnd + 1);
          const whatstart = pre.length;
          const whatend = this.getBoundRev(pre, whatstart, ')', '(');
          what = pre.slice(whatend);
          pre = pre.slice(0, whatend - 1);
        } else {
          let tokenEnd = preEnd;
          while (tokenEnd >= 0 && /\s/.test(pre[tokenEnd])) tokenEnd -= 1;
          let tokenStart = tokenEnd;
          while (tokenStart >= 0 && !/\s/.test(pre[tokenStart])) tokenStart -= 1;
          if (tokenEnd < 0 || tokenStart < 0) this.error("illegal repeat: can't find what to repeat");
          what = pre.slice(tokenStart + 1, tokenEnd + 1);
          pre = pre.slice(0, tokenStart);
        }
        this.string = pre + (` ${what} `.repeat(rpt)) + post;
      }
    }

    expandTracks() {
      let curtrack = 0;
      const tracks = [];
      let rest = `${this.string} |`;
      let pipe;
      while ((pipe = rest.indexOf('|')) !== -1) {
        let temptrack = rest.slice(0, pipe);
        rest = rest.slice(pipe + 1);
        const jump = temptrack.match(/^(\d+)/);
        if (jump) {
          curtrack = Number(jump[1]);
          temptrack = temptrack.replace(/^(\d+)/, '');
        } else {
          curtrack += 1;
        }
        tracks[curtrack] = (tracks[curtrack] || '') + temptrack;
      }
      return tracks;
    }

    addTrack(trackSource) {
      let seqtime = 0;
      let abstime = 0;
      let nlength = 4;
      let octave = 4;
      let note = 65;
      let chord = [note];
      let chan = 0;
      let nratio = 1;
      let nduty = this.gduty / 100;
      let vel = this.gvel;
      let trans = 0;
      let nivstress = 50;
      let nivsoft = 25;
      let loosew = this.timeToTick(this.gloosew);
      let looseq = this.glooseq;
      let velvarw = this.gvelvarw;
      let velvarq = this.gvelvarq;
      let guitmode = this.globalguitmode;
      let strumdelay = 0;
      let strumup = 0;
      let strumhitdown = 0;
      let strumupvel = 100;
      let tuning = [40, 45, 50, 55, 59, 64];
      let tommode = 0;
      let previousnotetime = 0;
      const track = [];

      const values = tokenizeTrackSource(trackSource);
      for (let command of values) {
        let pause = 0;
        let stress = 0;
        let soft = 0;
        let hold = 1;
        let deltanote = 0;
        let temptrans = 0;
        let match;

        if (command.length === 0) continue;
        const lower = command.toLowerCase();

        if (lower.includes('tuning[') && (match = command.match(/tuning\[(.*)\]/i))) {
          const tuningcommand = match[1];
          tuning = tuningcommand.split(',').map((part) => {
            const tun = part.match(/([A-G][b#\+-]?)(\d)/i);
            if (!tun) this.error(`tuning definition problem in ${tuningcommand} : I don't understand ${part}`);
            const mapped = NOTE_MAP[tun[1].toUpperCase()];
            if (mapped == null) this.error(`tuning definition problem in ${tuningcommand} : I don't understand ${part}`);
            return mapped + 12 * Number(tun[2]);
          });
          continue;
        }

        if (command.includes('[')) {
          if ((match = command.match(/\[(-?\d+,.*)\]/i))) {
            command = command.replace(/\[(-?\d+,.*)\]/i, '');
            chord = numberList(match[1]).map((n) => n + note);
          }

          if ((match = command.match(/\[g:((-|\d+),.*)\]/i))) {
            command = command.replace(/\[g:((-|\d+),.*)\]/i, '');
            chord = guitarChord(match[1], tuning);
          }

          if ((match = command.match(/\[g:(.*)\]/i))) {
            command = command.replace(/\[g:(.*)\]/i, '');
            let keycommand = match[1];
            if (GUITAR_CHORDS[keycommand.toUpperCase()] == null) {
              keycommand = keycommand.replace(/:.*/i, '');
              if (GUITAR_CHORDS[keycommand.toUpperCase()] == null) this.error(`I don't know guitar chord ${match[1]}`);
            }
            chord = guitarChord(GUITAR_CHORDS[keycommand.toUpperCase()], tuning);
          }

          if ((match = command.match(/\[(.*)\]/i))) {
            command = command.replace(/\[(.*)\]/i, '');
            let keycommand = match[1];
            const keycommand2 = match[1];
            if (KEY_CHORDS[keycommand.toUpperCase()] == null) {
              const root = keycommand.match(/^([A-G][b#\+-]?)/i);
              if (root) {
                const keynote = root[1];
                keycommand = keycommand.replace(/^([A-G][b#\+-]?)/i, '');
                if (KEY_CHORDS[keycommand.toUpperCase()] == null) {
                  keycommand = keycommand.replace(/:.*/i, '');
                  if (KEY_CHORDS[keycommand.toUpperCase()] == null) this.error(`I don't know chord ${keycommand} in ${keycommand2}`);
                }
                const mapped = NOTE_MAP[keynote.toUpperCase()];
                if (mapped == null) this.error(`I don't know note ${keynote} in ${keycommand2}`);
                note = mapped + 12 * octave;
              } else {
                keycommand = keycommand.replace(/:.*/i, '');
                if (KEY_CHORDS[keycommand.toUpperCase()] == null) this.error(`I don't know chord ${keycommand2}`);
              }
            }
            chord = KEY_CHORDS[keycommand.toUpperCase()].map((n) => n + note);
          }
        }

        if (lower.startsWith('strum')) {
          const strum = lower.slice(5).split(',');
          strumdelay = this.timeToTick(Number(strum[0]));
          if (strum.length > 1) strumup = this.timeToTick(Number(strum[1]));
          if (strum.length > 2) strumupvel = Number(strum[2]);
          continue;
        }
        if (lower.startsWith('tomson')) {
          tommode = 1;
          chan = (10 - 1) & 0xF;
          note = DRUM_MAP.T4;
          chord = [note];
          continue;
        }
        if (lower.startsWith('tomsoff')) {
          tommode = 0;
          continue;
        }
        if (lower.startsWith('guiton')) {
          guitmode = 1;
          continue;
        }
        if (lower.startsWith('guitoff')) {
          guitmode = 0;
          continue;
        }
        if (lower.startsWith('stress') && hasDigit(command)) {
          nivstress = Number(command.slice(6));
          continue;
        }
        if (lower.startsWith('soft') && hasDigit(command)) {
          nivsoft = Number(command.slice(4));
          continue;
        }
        if (lower.startsWith('loose')) {
          const parts = command.slice(5).split(',');
          loosew = this.timeToTick(Number(parts[0]));
          looseq = parts[1];
          continue;
        }
        if (lower.startsWith('velvar')) {
          const parts = command.slice(6).split(',');
          velvarw = Number(parts[0]);
          velvarq = parts[1];
          continue;
        }
        if (lower.startsWith('ctrl')) {
          const parts = command.slice(4).split(',');
          pushVarLen(track, round(abstime - seqtime));
          pushBytes(track, 0xB0 | chan, Number(parts[0]), Number(parts[1]));
          seqtime = abstime;
          continue;
        }
        if (lower.startsWith('sysex')) {
          const sysex = command.slice(5).split(',').filter((v) => v.length).map(Number);
          pushVarLen(track, round(abstime - seqtime));
          pushBytes(track, 240);
          pushVarLen(track, sysex.length);
          for (const sys of sysex) pushBytes(track, sys);
          pushBytes(track, 247);
          seqtime = abstime;
          continue;
        }
        if (lower.startsWith('pitch+')) {
          const pitch = clamp((8192 * Number(command.slice(6)) / 100) + 8192, 0, 16383);
          pushVarLen(track, round(abstime - seqtime));
          pushBytes(track, 0xE0 | chan, pitch & 0x7F, (pitch >> 7) & 0x7F);
          seqtime = abstime;
          continue;
        }
        if (lower.startsWith('pitch-')) {
          const pitch = clamp(8192 - (8192 * Number(command.slice(6)) / 100), 0, 16383);
          pushVarLen(track, round(abstime - seqtime));
          pushBytes(track, 0xE0 | chan, pitch & 0x7F, (pitch >> 7) & 0x7F);
          seqtime = abstime;
          continue;
        }
        if (lower.startsWith('pitch0')) {
          const pitch = 8192;
          pushVarLen(track, round(abstime - seqtime));
          pushBytes(track, 0xE0 | chan, pitch & 0x7F, (pitch >> 7) & 0x7F);
          seqtime = abstime;
          continue;
        }

        if (lower.startsWith('ch') && hasDigit(command)) {
          chan = (Number(command.slice(2)) - 1) & 0xF;
          continue;
        }
        if (lower[0] === 'i' && isDigitCode(lower.charCodeAt(1))) {
          pushVarLen(track, 0);
          pushBytes(track, 0xC0 | chan, Number(command.slice(1)) - 1);
          continue;
        }
        if (lower[0] === 'i' && command.length >= 3) {
          const drum = DRUM_MAP[command.slice(1, 3).toUpperCase()];
          if (drum != null) {
            note = drum;
            chan = (10 - 1) & 0xF;
            chord = [note];
          }
          continue;
        }
        if (lower.startsWith('nt+') && isDigitCode(lower.charCodeAt(3))) {
          temptrans = Number(command[3]);
          command = command.slice(0, 0) + command.slice(4);
        }
        if (lower.startsWith('nt-') && isDigitCode(lower.charCodeAt(3))) {
          temptrans = -Number(command[3]);
          command = command.slice(0, 0) + command.slice(4);
        }

        const currentLower = command.toLowerCase();
        if (currentLower[0] === 'r') {
          const slash = command.indexOf('/');
          if (slash > 1) {
            nratio = Number(command.slice(1, slash)) / Number(command.slice(slash + 1));
            continue;
          }
        }
        if (currentLower.startsWith('r1')) {
          nratio = 1;
          continue;
        }
        if (currentLower[0] === 'u' && hasDigit(command)) {
          nduty = Number(command.slice(1)) / 100;
          continue;
        }
        if (currentLower[0] === 'v' && hasDigit(command)) {
          vel = Number(command.slice(1));
          continue;
        }
        if (currentLower.startsWith('t+')) {
          trans = Number(command.slice(2));
          continue;
        }
        if (currentLower.startsWith('t0')) {
          trans = 0;
          continue;
        }
        if (currentLower.startsWith('t-')) {
          trans = -Number(command.slice(2));
          continue;
        }

        if (command === '/') {
          octave += 1;
          continue;
        }
        if (command === '\\') {
          octave -= 1;
          continue;
        }

        if (command.includes('/') && (match = command.match(/\/(\d+)/i))) {
          nlength = Number(match[1]);
          command = command.replace(/\/(\d+)/i, '');
        }
        if (hasNoteOrO(command) && (match = command.match(/([A-GO][b#\+-]?)(\d)/i))) {
          octave = Number(match[2]);
          command = command.replace(/([A-GO][b#\+-]?)(\d)/i, match[1]);
        }
        if (hasNote(command) && (match = command.match(/([A-G][b#\+-]?)/i))) {
          const mapped = NOTE_MAP[match[1].toUpperCase()];
          if (mapped != null) {
            note = mapped + 12 * octave;
            chord = [note];
          }
          command = command.replace(/([A-G][b#\+-]?)/i, '');
        }
        if (lower.includes('n+') && (match = command.match(/N\+(\d)/i))) {
          deltanote = Number(match[1]);
          command = command.replace(/N\+(\d)/i, '');
        }
        if (lower.includes('n-') && (match = command.match(/N-(\d)/i))) {
          deltanote = -Number(match[1]);
          command = command.replace(/N-(\d)/i, '');
        }
        if (lower.includes('n') && (match = command.match(/N(\d+)/i))) {
          note = Number(match[1]);
          chord = [note];
          command = command.replace(/N(\d+)/i, '');
        }

        if (command.includes('o') || command.includes('O')) continue;

        if (command.includes('=')) {
          hold += countChar(command, '=');
          command = command.replace(/=/g, '');
        }
        if (command.includes('P') || command.includes('p')) {
          pause = 1;
          command = command.replace(/P/i, '');
        }
        if (command.includes('-')) {
          pause = 1;
          command = command.replace('-', '');
        }
        if (command.includes("'")) {
          stress = 1;
          command = command.replace("'", '');
        }
        if (command.includes(',')) {
          soft = 1;
          command = command.replace(',', '');
        }
        if (hasDigit(command) && (match = command.match(/(\d+)/i))) {
          if (guitmode) {
            temptrans = Number(match[1]);
          } else if (tommode) {
            const drum = DRUM_MAP[`T${match[1]}`];
            if (drum != null) {
              note = drum;
              chord = [note];
            }
          } else {
            nlength = Number(match[1]);
          }
        }

        if (!nlength) this.error("You seem to be trying to play a note of length 1/0 ... Haven't you mixed the guitar mode with normal mode ?");
        let length = (1 / nlength) * nratio * hold;
        length *= this.ppqn * 4;
        if (deltanote) {
          note += deltanote;
          chord = [note];
        }
        if (pause) {
          abstime += length;
          continue;
        }

        let chordtemp;
        if (strumup && (abstime - previousnotetime) < strumup && strumhitdown) {
          chordtemp = [...chord].reverse();
          strumhitdown = 0;
        } else {
          chordtemp = [...chord];
          strumhitdown = 1;
        }

        let lvel = vel * (1 + velvarw * this.rndq(velvarq) / 100) * (strumhitdown ? 1 : strumupvel / 100);
        if (stress) lvel *= (1 + nivstress / 100);
        if (soft) lvel *= (1 - nivsoft / 100);
        lvel = clamp(round(lvel), 0, 127);

        const ticksOn = nduty * length;
        const ticksOff = (1 - nduty) * length;
        let firstnote = true;
        let abstimetemp = abstime;
        previousnotetime = abstime;

        for (const chnote of chordtemp) {
          const fnote = clamp(chnote + trans + temptrans, 0, 127);
          let deltaOn;
          if (firstnote) {
            abstimetemp = abstime + loosew * this.rndq(looseq);
            deltaOn = round(abstimetemp) - seqtime;
            if (deltaOn <= round(loosew) * 2) {
              abstimetemp -= deltaOn;
              deltaOn = 0;
            }
            firstnote = false;
          } else {
            abstimetemp += strumdelay;
            deltaOn = round(abstimetemp) - seqtime;
          }
          pushVarLen(track, deltaOn);
          pushBytes(track, 0x90 | chan, fnote, lvel);
          seqtime += deltaOn;
        }

        abstime += ticksOn;
        firstnote = true;

        for (const chnote of chordtemp) {
          const fnote = clamp(chnote + trans + temptrans, 0, 127);
          let deltaOff;
          if (firstnote) {
            deltaOff = round(abstime + loosew * this.rndq(looseq)) - seqtime;
            if (deltaOff < 0) deltaOff = 0;
            firstnote = false;
          } else {
            deltaOff = 0;
          }
          pushVarLen(track, deltaOff);
          pushBytes(track, 0x80 | chan, fnote, 0);
          seqtime += deltaOff;
        }

        abstime += ticksOff;
      }

      let lastDelta = round(abstime) - seqtime;
      if (lastDelta < 0) lastDelta = 0;
      pushVarLen(track, lastDelta);
      pushBytes(track, 0xFF, 0x2F, 0);
      this.mtracks.push(track);
    }

    rndq(q) {
      const text = String(q).toUpperCase();
      if (text === 'G') {
        let x;
        if (this.gaussPhase === 0) {
          while (true) {
            const u1 = this.rng();
            const u2 = this.rng();
            this.gaussV1 = 2 * u1 - 1;
            this.gaussV2 = 2 * u2 - 1;
            this.gaussS = this.gaussV1 * this.gaussV1 + this.gaussV2 * this.gaussV2;
            if (!(this.gaussS >= 1 || this.gaussS === 0)) break;
          }
          x = this.gaussV1 * Math.sqrt(-2 * Math.log(this.gaussS) / this.gaussS);
        } else {
          x = this.gaussV2 * Math.sqrt(-2 * Math.log(this.gaussS) / this.gaussS);
        }
        this.gaussPhase = 1 - this.gaussPhase;
        return x / 2;
      }
      const r = this.rng();
      const power = Number(q);
      return (Math.abs(r - 0.5) * 2) ** power * (r > 0.5 ? 1 : -1);
    }

    postOut() {
      const pretrack = [];
      pushAscii(pretrack, 'MThd');
      pushUint32(pretrack, 6);
      pushUint16(pretrack, 1);
      pushUint16(pretrack, this.mtracks.length);
      pushUint16(pretrack, this.ppqn);

      let wholetrack = [...pretrack];
      const tempoMicros = 1000000 * 60 / this.tempo;
      let pretrackOutput = false;
      const meta = [];
      pushBytes(meta, 0, 0xFF, 1, VERSION.length);
      pushAscii(meta, VERSION);
      pushBytes(meta, 0, 0xFF, 0x51, 3, (tempoMicros >> 16) & 0xFF, (tempoMicros >> 8) & 0xFF, tempoMicros & 0xFF);

      for (const mtrack of this.mtracks) {
        if (!pretrackOutput) {
          const first = meta.concat(mtrack);
          pushAscii(wholetrack, 'MTrk');
          pushUint32(wholetrack, first.length);
          wholetrack = wholetrack.concat(first);
          pretrackOutput = true;
        } else {
          pushAscii(wholetrack, 'MTrk');
          pushUint32(wholetrack, mtrack.length);
          wholetrack = wholetrack.concat(mtrack);
        }
      }
      return new Uint8Array(wholetrack);
    }

    getBound(stringa, startp, opendelim, closedelim) {
      let loc = stringa.indexOf(opendelim, startp);
      if (loc === -1) return -1;
      let level = 1;
      let notover = true;
      while (level && notover) {
        const locopen = stringa.indexOf(opendelim, loc + 1);
        const locclose = stringa.indexOf(closedelim, loc + 1);
        if (locopen + locclose === -2) {
          notover = false;
          continue;
        }
        if (locopen < locclose && locopen !== -1) {
          loc = locopen;
          level += 1;
        } else {
          loc = locclose;
          level -= 1;
        }
      }
      if (level) this.error(`matching ${opendelim}/${closedelim} error`);
      return loc;
    }

    getBoundRev(stringa, startp, opendelim, closedelim) {
      let loc = stringa.lastIndexOf(opendelim, startp);
      if (loc === -1) return -1;
      let level = 1;
      let notover = true;
      while (level && notover) {
        const locopen = stringa.lastIndexOf(opendelim, loc - 1);
        const locclose = stringa.lastIndexOf(closedelim, loc - 1);
        if (locopen + locclose === -2) {
          notover = false;
          continue;
        }
        if (locopen > locclose) {
          loc = locopen;
          level += 1;
        } else {
          loc = locclose;
          level -= 1;
        }
      }
      if (level) this.error(`matching ${opendelim}/${closedelim} error`);
      return loc;
    }

    timeToTick(ms) {
      return (ms / 1000) * (this.tempo / 60) * this.ppqn;
    }

    error(message) {
      throw new Error(`Musicpad error: ${message}`);
    }
  }

  function valueOr(value, fallback) {
    return value == null ? fallback : value;
  }

  function tokenizeTrackSource(value) {
    const raw = splitWhitespace(explodeTrackChars(value));
    const tokens = [];

    for (let i = 0; i < raw.length; i += 1) {
      const token = raw[i];
      const lastIndex = tokens.length - 1;
      const last = tokens[lastIndex];

      if ((token === 'x' || token === 'X') && last) {
        if (last === "'" || last === ',') {
          tokens[lastIndex] = `${last}x`;
          continue;
        }
        if (last.toLowerCase() === 'syse') {
          tokens[lastIndex] = 'sysex';
          continue;
        }
      }

      if (token === '=' && last) {
        tokens[lastIndex] = `${last}=`;
        continue;
      }

      if (token === '-' && shouldMergeDash(last)) {
        tokens[lastIndex] = `${last}-`;
        const next = raw[i + 1];
        if (shouldConsumeAfterDash(last, next)) {
          tokens[lastIndex] += next;
          i += 1;
        }
        continue;
      }

      tokens.push(token);
    }

    return tokens;
  }

  function explodeTrackChars(value) {
    let out = '';
    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
      const lower = char.toLowerCase();
      if (char === '(' || char === ')') continue;
      if (lower === 'x' || char === '-' || char === '=') out += ` ${char} `;
      else out += char;
    }
    return out;
  }

  function shouldMergeDash(token) {
    if (!token) return false;
    const lower = token.toLowerCase();
    const code = lower.charCodeAt(lower.length - 1);
    return (code >= 97 && code <= 103) || code === 104 || code === 110 || code === 116 || token.endsWith(',') || token.endsWith('[') || lower.endsWith('g:');
  }

  function shouldConsumeAfterDash(token, next) {
    if (!next || next === '-') return false;
    const lower = token.toLowerCase();
    if (token.endsWith(',') || token.endsWith('[') || lower.endsWith('g:')) return true;

    const code = lower.charCodeAt(lower.length - 1);
    if (code === 104 || code === 110 || code === 116) return true;
    if (code >= 97 && code <= 103) {
      const nextCode = next.charCodeAt(0);
      return next[0] === '/' || isDigitCode(nextCode);
    }
    return false;
  }

  function compactSpaces(value) {
    return value.replace(/\s+/g, ' ');
  }

  function splitWhitespace(value) {
    const tokens = [];
    let tokenStart = -1;
    for (let i = 0; i <= value.length; i += 1) {
      const code = i < value.length ? value.charCodeAt(i) : 32;
      const isSpace = code === 32 || code === 9 || code === 10 || code === 13 || code === 12;
      if (isSpace) {
        if (tokenStart !== -1) {
          tokens.push(value.slice(tokenStart, i));
          tokenStart = -1;
        }
      } else if (tokenStart === -1) {
        tokenStart = i;
      }
    }
    return tokens;
  }

  function round(value) {
    return Math.trunc(value + 0.5);
  }

  function clamp(value, min, max) {
    value = Math.trunc(value);
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function numberMap(text) {
    const parts = text.trim().split(/\s+/);
    const out = Object.create(null);
    for (let i = 0; i < parts.length; i += 2) out[parts[i]] = Number(parts[i + 1]);
    return out;
  }

  function hasNoteOrO(value) {
    for (let i = 0; i < value.length; i += 1) {
      const code = value.charCodeAt(i) | 32;
      if ((code >= 97 && code <= 103) || code === 111) return true;
    }
    return false;
  }

  function hasNote(value) {
    for (let i = 0; i < value.length; i += 1) {
      const code = value.charCodeAt(i) | 32;
      if (code >= 97 && code <= 103) return true;
    }
    return false;
  }

  function hasDigit(value) {
    for (let i = 0; i < value.length; i += 1) {
      if (isDigitCode(value.charCodeAt(i))) return true;
    }
    return false;
  }

  function isDigitCode(code) {
    return code >= 48 && code <= 57;
  }

  function countChar(value, char) {
    let count = 0;
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === char) count += 1;
    }
    return count;
  }

  function numberList(text) {
    let list = NUMBER_LIST_CACHE.get(text);
    if (!list) {
      list = text.split(',').map(Number);
      NUMBER_LIST_CACHE.set(text, list);
    }
    return list;
  }

  function guitarFretList(text) {
    let list = GUITAR_FRET_CACHE.get(text);
    if (!list) {
      list = text.split(',').map((part) => part === '-' ? null : Number(part));
      GUITAR_FRET_CACHE.set(text, list);
    }
    return list;
  }

  function guitarChord(subchord, tuning) {
    const frets = Array.isArray(subchord) ? subchord : guitarFretList(subchord);
    const chord = [];
    for (let i = 0; i < 6; i += 1) {
      const fret = frets[i];
      if (fret != null) chord.push(tuning[i] + fret);
    }
    return chord;
  }

  function pushBytes(out, ...bytes) {
    for (const byte of bytes) out.push(Math.trunc(byte) & 0xFF);
  }

  function pushAscii(out, text) {
    for (let i = 0; i < text.length; i += 1) out.push(text.charCodeAt(i) & 0xFF);
  }

  function pushUint16(out, value) {
    value = Math.trunc(value);
    out.push((value >> 8) & 0xFF, value & 0xFF);
  }

  function pushUint32(out, value) {
    value = Math.trunc(value);
    out.push((value >>> 24) & 0xFF, (value >>> 16) & 0xFF, (value >>> 8) & 0xFF, value & 0xFF);
  }

  function pushVarLen(out, value) {
    value = Math.trunc(value);
    if (!Number.isFinite(value) || value < 0) throw new Error(`Musicpad error: invalid MIDI delta ${value}`);
    let buffer = value & 0x7F;
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= ((value & 0x7F) | 0x80);
    }
    while (true) {
      out.push(buffer & 0xFF);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
  }

  root.musicpadToMidi = musicpadToMidi;
  root.MusicpadEngine = MusicpadEngine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { musicpadToMidi, MusicpadEngine };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
