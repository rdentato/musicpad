#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { musicpadToMidi } = require('../src/musicpad.js');

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

function testSongs() {
  for (const [name, expected] of Object.entries(EXPECTED_SONGS).sort()) {
    const source = fs.readFileSync(path.join(SONGS_DIR, name), 'utf8');
    const midi = musicpadToMidi(source, { rng: () => 0.5 });
    assertValidMidi(midi, name);
    assert.strictEqual(midi.length, expected.bytes, `${name}: byte length changed`);
    assert.strictEqual(sha256(midi), expected.sha256, `${name}: MIDI hash changed`);
  }
}

function main() {
  testTrackSplitting();
  testInlineExamples();
  testSongs();
  console.log('musicpad tests passed');
}

main();
