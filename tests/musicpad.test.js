#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { musicpadToMidi, musicpadToIr, musicpadIrToMidi, musicpadToMusicXml } = require('../src/musicpad.js');
const IR_FIXTURES = require('./fixtures/musicpad-ir-cases.js');

const ROOT = path.resolve(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'project-docs', 'songs');

const EXPECTED_SONGS = {
  'Bird I.mpd': { bytes: 10112, sha256: '0faff69ded0849fad05924adace9b50603be889535cef30b3f781fd3781aa314' },
  'Cool PolyRythm.mpd': { bytes: 5068, sha256: '9a71af2f765f79ff546ed741ee562fdbcb89070acf55a2ab13fd4422411cdf6b' },
  'MBV-Demo with Pitch.mpd': { bytes: 4488, sha256: 'c9ff35eb6f4184e92365ffded1852c554c465dc40793c0cfc0346ec4803b9bd2' },
  'MBV-When you sleep.mpd': { bytes: 4119, sha256: '7d7c94943a6489dccff1a243f27963b242e8116b2d191cc64d73ee301522965c' },
  'Meshuggah - War.mpd': { bytes: 57125, sha256: '0188ebd1313757c3d24eff2a4b83ff3f519e33b6bdb61d98593673a279533593' },
  'Polyfun1.mpd': { bytes: 81691, sha256: 'e2d534b4c6d29287a786780199072ee3217287c5f0ee87d082798b0ec03a7fb2' },
  'Polyfun2.mpd': { bytes: 57082, sha256: 'ad45d6dfbca6977a96c8ddb931d331ed17dc8cc53006cbe5bca3e95d5c0749c7' },
  'Polyjazz.mpd': { bytes: 34980, sha256: '346a3a4181eb9543abfa8b75772f7d4113e3f25dc494f1d4bab33f2568e2cd08' },
  'drum solo.mpd': { bytes: 4958, sha256: '134fa3314918d0bdc58c03d2ca3324c362356daf5dde9e791818f64eb370b5f7' },
  'just like heaven.mpd': { bytes: 17181, sha256: '32ecd3ae260af85a3a44569eadb7b9e12ca4818d52d089e8c08e90835292fd25' },
  'melo1.mpd': { bytes: 63549, sha256: 'e29c6c35b89fc0519bf4f850cc47673e489d7bc7cfb7cddf47a433e1b2f4bcf8' },
  'midi test.mpd': { bytes: 8903, sha256: 'f06cd008ac131dbd0ad1cabc5011c10d72587caeab06ce31b5ec788887fd894a' },
  'random fun.mpd': { bytes: 8253, sha256: 'c0d94ff25b3dfccaff68367e723e838fb74f9c6f389d942803be91180b33e7a6' },
  'Starways to Heaven.mpd': { bytes: 822, sha256: '674ed740bd63e117e56f6e9f3965b2bd0c0f3c85f9b4a90fe65dc431776cf915' },
  'weird polyrythm.mpd': { bytes: 2596, sha256: 'a68dc5ccefc7ba14b3cc7058690d1ae4e17f542a6998183af856969153202f5e' }
};

const EXPECTED_FOCUSED_CASES = {
  'numeric chord': {
    source: 'tempo120 [0,4,7]/4',
    bytes: 83,
    sha256: '43e25e1dced52549140ce19b823fbf1e399c0b8fe934627ed189f060875be917'
  },
  'named keyboard chord': {
    source: 'tempo120 [Amin]/4 [Cmaj7:2]/4',
    bytes: 116,
    sha256: 'f596a72ce6bae5025528f4eb597c606c33b7843cf00946577a56f1b42c5b1a0f'
  },
  'guitar fret chord': {
    source: 'tempo120 [g:-,0,2,2,2,0]/4',
    bytes: 99,
    sha256: '63fdd40b3fa380e9a5f104978c698f362c81412c4647df1df9ff236919a4aa77'
  },
  'named guitar chord': {
    source: 'tempo120 [g:Amaj]/4 [g:Emin]/4',
    bytes: 156,
    sha256: '82a38be3d6ef619c55a5d6044fe8ec57af0cd910696004c4ad805ada3d913a4f'
  },
  'strummed guitar chord': {
    source: 'tempo120 strum10,300,80 [g:Amaj]/8 [g:Amaj]/8',
    bytes: 154,
    sha256: 'bc6baa2ee67e29860f9526d0832c645ca129a5f273b07fe4bc7f8dcb583bf641'
  },
  'stress and soft': {
    source: 'tempo120 stress50 soft25 v80 \'c ,d e',
    bytes: 85,
    sha256: '1df71ddf9f6cdf6c7c88785d154eba7ba2d869f6af7016f57ebcef4fb20ff8ce'
  },
  'rests and holds': {
    source: 'tempo120 c/8 = - d/4 p e/8',
    bytes: 85,
    sha256: '62d83067880946fe27508fc891fdb89b59c2211f324f0df7844a4a9d8517665a'
  },
  'macros and repeats': {
    source: 'tempo120 m$riff(c e g) $riff*2 (a b)*2',
    bytes: 148,
    sha256: '5067a323b99f9b67f9ba3286b1d324f4fa74cf3bbde4267ff796a73e8dc7db5d'
  },
  'pitch and controller': {
    source: 'tempo120 ch2 ctrl7,100 pitch+50 c pitch-25 d pitch0 e',
    bytes: 101,
    sha256: 'd628701c2775100221c811948dabe2c30bc0c3cefbed72b9df5c33812d5326c0'
  },
  'drum and pitch events': {
    source: 'tempo120 iBD x/8 iSD x/8 pitch0',
    bytes: 95,
    sha256: '22410cea5771d2498ca3b02c602fb7a643dfabd7d87eec38f50a6159dd8f4e7c'
  },
  'program and drum instrument changes': {
    source: 'tempo120 ch3 i25 c iBD 8',
    bytes: 78,
    sha256: 'ef8e8acb1c60a6ffb09283ccd60ea36a3dfc0cea3170dd2539d0fed1d38dc355'
  }
};

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readAscii(bytes, offset, length) {
  return Buffer.from(bytes.slice(offset, offset + length)).toString('ascii');
}

function readUint16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function assertValidMidi(bytes, label) {
  assert(bytes instanceof Uint8Array, `${label}: result must be Uint8Array`);
  assert.strictEqual(readAscii(bytes, 0, 4), 'MThd', `${label}: missing MIDI header`);
  assert.strictEqual(readUint32(bytes, 4), 6, `${label}: unexpected header length`);
  assert.strictEqual(readUint16(bytes, 8), 1, `${label}: expected format 1`);

  const trackCount = readUint16(bytes, 10);
  assert(trackCount > 0, `${label}: expected at least one track`);

  let offset = 14;
  for (let i = 0; i < trackCount; i += 1) {
    assert.strictEqual(readAscii(bytes, offset, 4), 'MTrk', `${label}: track ${i} missing MTrk`);
    const length = readUint32(bytes, offset + 4);
    offset += 8 + length;
    assert(offset <= bytes.length, `${label}: track ${i} exceeds file length`);
  }
  assert.strictEqual(offset, bytes.length, `${label}: MIDI chunk lengths do not add up`);
}

function firstMidiTrackBody(bytes) {
  const length = readUint32(bytes, 18);
  return bytes.slice(22, 22 + length);
}

function seededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function assertDeepIncludes(actual, expected, label) {
  if (Array.isArray(expected)) {
    assert(Array.isArray(actual), `${label}: expected an array`);
    assert.strictEqual(actual.length, expected.length, `${label}: array length changed`);
    for (let i = 0; i < expected.length; i += 1) {
      assertDeepIncludes(actual[i], expected[i], `${label}[${i}]`);
    }
    return;
  }

  if (expected && typeof expected === 'object') {
    assert(actual && typeof actual === 'object', `${label}: expected an object`);
    for (const key of Object.keys(expected)) {
      assertDeepIncludes(actual[key], expected[key], `${label}.${key}`);
    }
    return;
  }

  assert.strictEqual(actual, expected, `${label}: value changed`);
}

function testTrackSplitting() {
  const implicit = musicpadToMidi('A | B', { rng: () => 0.5 });
  const explicit = musicpadToMidi('|0 A | B', { rng: () => 0.5 });
  assert.deepStrictEqual(Buffer.from(implicit), Buffer.from(explicit), 'A | B should be equivalent to |0 A | B');
}

function testInlineExamples() {
  const examples = [
    'c e g g+',
    'tempo120 i25 [Cmaj]/4 [Dmin]/4',
    'iBD o/16 xx-xxx--*4',
    'm$a(c e g) $a*2',
    '|0 ch1 c/8 e g | ch2 c3/4'
  ];

  for (const source of examples) {
    const midi = musicpadToMidi(source, { rng: () => 0.5 });
    assertValidMidi(midi, source);
  }
}

function testTitleCommand() {
  const title = 'My Piece';
  const source = `title"${title}" tempo120 c`;
  const midi = musicpadToMidi(source, { rng: () => 0.5 });
  const track = Buffer.from(firstMidiTrackBody(midi));
  const expectedMeta = Buffer.from([0x00, 0xFF, 0x03, title.length, ...Buffer.from(title, 'ascii')]);
  assert.deepStrictEqual(track.slice(0, expectedMeta.length), expectedMeta, 'title command should emit FF 03 at tick 0 of first MIDI track');

  const ir = musicpadToIr(source, { rng: () => 0.5 });
  assert.strictEqual(ir.title, title, 'title command should be preserved in IR');

  const xml = musicpadToMusicXml(source, { rng: () => 0.5 });
  assert(xml.includes('<work-title>My Piece</work-title>'), 'title command should set MusicXML work title');
}

function testAuthorCommand() {
  const author = 'Me and myself';
  const source = `author"${author}" tempo120 c`;
  const midi = musicpadToMidi(source, { rng: () => 0.5 });
  const track = Buffer.from(firstMidiTrackBody(midi));
  const expectedMeta = Buffer.from([0x00, 0xFF, 0x02, author.length, ...Buffer.from(author, 'ascii')]);
  assert.deepStrictEqual(track.slice(0, expectedMeta.length), expectedMeta, 'author command should emit FF 02 copyright at tick 0 of first MIDI track');

  const ir = musicpadToIr(source, { rng: () => 0.5 });
  assert.strictEqual(ir.author, author, 'author command should be preserved in IR');

  const xml = musicpadToMusicXml(source, { rng: () => 0.5 });
  assert(xml.includes('<creator type="composer">Me and myself</creator>'), 'author command should set MusicXML composer');
}

function testMeterAndKeyCommands() {
  const source = 'meter"7/8" key"D# maj" tempo120 c/8 d/8 e/8 f/8 g/8 a/8 b/8 c/8';
  const midi = musicpadToMidi(source, { rng: () => 0.5 });
  const track = Buffer.from(firstMidiTrackBody(midi));
  assert(track.indexOf(Buffer.from([0x00, 0xFF, 0x58, 0x04, 0x07, 0x03, 0x18, 0x08])) !== -1, 'meter command should emit MIDI time signature');
  assert(track.indexOf(Buffer.from([0x00, 0xFF, 0x59, 0x02, 0x09, 0x00])) !== -1, 'key command should emit MIDI key signature');

  const ir = musicpadToIr(source, { rng: () => 0.5 });
  assert.deepStrictEqual(ir.tracks[0].events[0], { kind: 'timeSignature', sourceToken: 'meter"7/8"', tick: 0, beats: 7, beatType: 8 }, 'meter command should be preserved in IR');
  assert.deepStrictEqual(ir.tracks[0].events[1], { kind: 'keySignature', sourceToken: 'key"D# maj"', tick: 0, root: 'D#', mode: 'major', fifths: 9 }, 'key command should be preserved in IR');

  const xml = musicpadToMusicXml(source, { rng: () => 0.5 });
  assert(xml.includes('<time><beats>7</beats><beat-type>8</beat-type></time>'), 'meter command should set MusicXML time signature');
  assert(xml.includes('<key><fifths>9</fifths><mode>major</mode></key>'), 'key command should set MusicXML key signature');
  assert.deepStrictEqual(musicXmlMeasureDurations(xml), [672, 672], 'MusicXML 7/8 measures should be filled');

  for (const spelling of ['C major', 'C maj']) {
    const aliasXml = musicpadToMusicXml(`key"${spelling}" c`, { rng: () => 0.5 });
    assert(aliasXml.includes('<mode>major</mode>'), `${spelling}: should be accepted as major`);
  }
  for (const spelling of ['A minor', 'A min']) {
    const aliasXml = musicpadToMusicXml(`key"${spelling}" c`, { rng: () => 0.5 });
    assert(aliasXml.includes('<mode>minor</mode>'), `${spelling}: should be accepted as minor`);
  }
}

function testFocusedRegressionCases() {
  for (const [label, expected] of Object.entries(EXPECTED_FOCUSED_CASES)) {
    const midi = musicpadToMidi(expected.source, { rng: () => 0.5 });
    assertValidMidi(midi, label);
    assert.strictEqual(midi.length, expected.bytes, `${label}: byte length changed`);
    assert.strictEqual(sha256(midi), expected.sha256, `${label}: MIDI hash changed`);
  }
}

function countMatches(value, pattern) {
  const matches = value.match(pattern);
  return matches ? matches.length : 0;
}

function musicXmlPartBodies(xml) {
  return [...xml.matchAll(/<part id="[^"]+">([\s\S]*?)<\/part>/g)].map((match) => match[1]);
}

function musicXmlMeasureBodies(xml) {
  return [...xml.matchAll(/<measure number="\d+">([\s\S]*?)<\/measure>/g)].map((match) => match[1]);
}

function musicXmlPartMeasureCounts(xml) {
  return musicXmlPartBodies(xml).map((part) => countMatches(part, /<measure number="/g));
}

function musicXmlPartMeasures(xml) {
  return new Map(musicXmlPartBodies(xml).map((part, index) => {
    const measures = new Map([...part.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)].map((match) => [Number(match[1]), match[2]]));
    return [`P${index + 1}`, measures];
  }));
}

function musicXmlMeasureDuration(body) {
  let total = 0;
  const notes = [...body.matchAll(/<note>([\s\S]*?)<\/note>/g)];
  for (const note of notes) {
    if (note[1].includes('<chord/>')) continue;
    const duration = note[1].match(/<duration>(\d+)<\/duration>/);
    if (duration) total += Number(duration[1]);
  }
  return total;
}

function musicXmlMeasureDurations(xml) {
  return musicXmlMeasureBodies(xml).map((body) => {
    return musicXmlMeasureDuration(body);
  });
}

function testMusicXmlExport() {
  const simple = musicpadToMusicXml('tempo120 c/4 - d/4', { rng: () => 0.5 });
  assert(simple.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'MusicXML: missing XML declaration');
  assert(simple.includes('<score-partwise version="3.1">'), 'MusicXML: missing score-partwise root');
  assert(simple.includes('<divisions>192</divisions>'), 'MusicXML: missing divisions');
  assert(simple.includes('<time><beats>4</beats><beat-type>4</beat-type></time>'), 'MusicXML: missing default time signature');
  assert(simple.includes('<step>C</step>'), 'MusicXML: missing C note');
  assert(simple.includes('<rest/>'), 'MusicXML: missing rest');

  const tied = musicpadToMusicXml('tempo120 c/1=', { rng: () => 0.5 });
  assert(countMatches(tied, /<measure number="/g) >= 2, 'MusicXML: tied long note should span measures');
  assert(tied.includes('<tie type="start"/>'), 'MusicXML: missing tie start');
  assert(tied.includes('<tie type="stop"/>'), 'MusicXML: missing tie stop');
  assert(tied.includes('<tied type="start"/>'), 'MusicXML: missing tied notation start');
  assert(tied.includes('<tied type="stop"/>'), 'MusicXML: missing tied notation stop');

  const chord = musicpadToMusicXml('tempo120 [Amin]/4', { rng: () => 0.5 });
  assert(chord.includes('<harmony>'), 'MusicXML: missing harmony for named chord');
  assert(chord.includes('<root-step>A</root-step>'), 'MusicXML: missing harmony root');
  assert(chord.includes('<kind text="min">minor</kind>'), 'MusicXML: missing minor harmony kind');
  assert(countMatches(chord, /<chord\/>/g) >= 2, 'MusicXML: missing chord note markers');

  const strum = musicpadToMusicXml('tempo120 strum10,300,80 [g:Amaj]/8', { rng: () => 0.5 });
  assert(strum.includes('<root-step>A</root-step>'), 'MusicXML: missing guitar chord harmony root');
  assert(strum.includes('strum down'), 'MusicXML: missing strum direction text');
  assert(strum.includes('<arpeggiate/>'), 'MusicXML: missing arpeggiate notation');

  const expressive = musicpadToMusicXml("tempo120 stress50 soft25 'c ,d ctrl7,100 pitch+50 sysex", { rng: () => 0.5 });
  assert(expressive.includes('<dynamics><f/></dynamics>'), 'MusicXML: missing stress dynamic');
  assert(expressive.includes('<dynamics><p/></dynamics>'), 'MusicXML: missing soft dynamic');
  assert(!expressive.includes('<words>ctrl'), 'MusicXML: controller events should not be visible text');
  assert(!expressive.includes('<words>pitch'), 'MusicXML: pitch events should not be visible text');
  assert(!expressive.includes('<words>sysex'), 'MusicXML: sysex events should not be visible text');

  const mergedRests = musicpadToMusicXml('tempo120 c/4 - - d/4', { rng: () => 0.5 });
  const firstMeasure = musicXmlMeasureBodies(mergedRests)[0];
  assert.strictEqual(countMatches(firstMeasure, /<rest\/>/g), 1, 'MusicXML: adjacent rests should be merged within a measure');
  assert(firstMeasure.includes('<duration>384</duration>'), 'MusicXML: merged rest should preserve combined duration');

  const exactMeasures = musicpadToMusicXml('tempo120 c/4 d/4 e/4 f/4 g/4', { rng: () => 0.5 });
  assert.deepStrictEqual(musicXmlMeasureDurations(exactMeasures), [768, 768], 'MusicXML: measures should be exactly filled');

  const tiedMeasures = musicpadToMusicXml('tempo120 c/1=', { rng: () => 0.5 });
  assert.deepStrictEqual(musicXmlMeasureDurations(tiedMeasures), [768, 768], 'MusicXML: tied notes should split at bar boundaries');

  const parts = musicpadToMusicXml('c | e', { rng: () => 0.5 });
  assert(parts.includes('<score-part id="P1">'), 'MusicXML: missing first part');
  assert(parts.includes('<score-part id="P2">'), 'MusicXML: missing second part');

  const paddedParts = musicpadToMusicXml('c/1 c/1 | e/4', { rng: () => 0.5 });
  assert.deepStrictEqual(musicXmlPartMeasureCounts(paddedParts), [2, 2], 'MusicXML: shorter parts should be padded to the global measure count');
}

function testMusicXmlStarwaysMeasures() {
  const source = fs.readFileSync(path.join(SONGS_DIR, 'Starways to Heaven.mpd'), 'utf8');
  const xml = musicpadToMusicXml(source, { rng: () => 0.5 });
  const measures = musicXmlPartMeasures(xml);
  const complained = {
    P1: [3, 7],
    P2: [1, 2, 5, 6],
    P3: [1, 2, 3, 5, 6, 7]
  };

  for (const [partId, measureNumbers] of Object.entries(complained)) {
    for (const measureNumber of measureNumbers) {
      const body = measures.get(partId).get(measureNumber);
      assert.strictEqual(musicXmlMeasureDuration(body), 768, `Starways ${partId} measure ${measureNumber}: duration is not 4/4`);
      for (const note of body.matchAll(/<note>([\s\S]*?)<\/note>/g)) {
        assert(note[1].includes('<type>'), `Starways ${partId} measure ${measureNumber}: note/rest missing type`);
      }
    }
  }
}

function testMusicXmlSongsHaveFilledMeasures() {
  for (const name of Object.keys(EXPECTED_SONGS).sort()) {
    const source = fs.readFileSync(path.join(SONGS_DIR, name), 'utf8');
    const xml = musicpadToMusicXml(source, { rng: () => 0.5 });
    const measureCounts = musicXmlPartMeasureCounts(xml);
    assert(measureCounts.every((count) => count === measureCounts[0]), `${name}: MusicXML parts have different measure counts`);
    for (const [index, duration] of musicXmlMeasureDurations(xml).entries()) {
      assert.strictEqual(duration, 768, `${name}: MusicXML measure ${index + 1} duration is not 4/4`);
    }
  }
}

function testSongs() {
  for (const [name, expected] of Object.entries(EXPECTED_SONGS).sort()) {
    const source = fs.readFileSync(path.join(SONGS_DIR, name), 'utf8');
    const midi = musicpadToMidi(source, { rng: () => 0.5 });
    const irMidi = musicpadIrToMidi(musicpadToIr(source, { rng: () => 0.5 }));
    assertValidMidi(midi, name);
    assert.strictEqual(midi.length, expected.bytes, `${name}: byte length changed`);
    assert.strictEqual(sha256(midi), expected.sha256, `${name}: MIDI hash changed`);
    assert.deepStrictEqual(Buffer.from(irMidi), Buffer.from(midi), `${name}: IR MIDI differs from direct MIDI`);
  }
}

function testIrFixtures() {
  for (const fixture of IR_FIXTURES.cases) {
    const ir = musicpadToIr(fixture.source, { rng: () => 0.5 });
    assertDeepIncludes(ir, fixture.expected, fixture.name);
  }
}

function testMidiFromIrFixtures() {
  for (const fixture of IR_FIXTURES.cases) {
    const directMidi = musicpadToMidi(fixture.source, { rng: () => 0.5 });
    const ir = musicpadToIr(fixture.source, { rng: () => 0.5 });
    const irMidi = musicpadIrToMidi(ir);
    assert.deepStrictEqual(Buffer.from(irMidi), Buffer.from(directMidi), `${fixture.name}: IR MIDI differs from direct MIDI`);
  }
}

function testMidiFromIrHumanization() {
  const examples = [
    'tempo120 loose10,1 c d e f',
    'tempo120 velvar20,1 c d e f',
    'tempo120 loose10,1 velvar20,1 strum10,300,80 [g:Amaj]/8 [g:Amaj]/8',
    'tempo120 globaloose10,1 globalvelvar20,1 c d e f'
  ];

  for (const source of examples) {
    const directMidi = musicpadToMidi(source, { rng: seededRng(123) });
    const ir = musicpadToIr(source, { rng: seededRng(123) });
    const irMidi = musicpadIrToMidi(ir);
    assert.deepStrictEqual(Buffer.from(irMidi), Buffer.from(directMidi), `${source}: humanized IR MIDI differs from direct MIDI`);
  }
}

function main() {
  testTrackSplitting();
  testInlineExamples();
  testTitleCommand();
  testAuthorCommand();
  testMeterAndKeyCommands();
  testFocusedRegressionCases();
  testIrFixtures();
  testMidiFromIrFixtures();
  testMidiFromIrHumanization();
  testMusicXmlExport();
  testMusicXmlStarwaysMeasures();
  testMusicXmlSongsHaveFilledMeasures();
  testSongs();
  console.log('musicpad tests passed');
}

main();
