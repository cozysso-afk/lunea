import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-astro-request-v1.js', import.meta.url), 'utf8');

test('long Astro calculations use resumable jobs while Horary stays direct', () => {
  assert.match(source, /\/v1\/jobs\/astro/);
  assert.match(source, /LUNEA_ASTRO_PENDING_JOB_V1/);
  assert.match(source, /endpointKind/);
  assert.doesNotMatch(source, /return 'horary'/);
  assert.match(source, /return 'transit'/);
  assert.match(source, /return 'return'/);
  assert.match(source, /Horary stays on the direct \/v1\/horary fast path/);
});

test('pending jobs survive iOS suspension and are polled after resume', () => {
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /localStorage\.getItem/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /pollServerJob/);
  assert.match(source, /JOB_TIMEOUT_MS = 30 \* 60 \* 1000/);
});

test('rolling deploy keeps old direct request fallback', () => {
  assert.match(source, /httpStatus === 404/);
  assert.match(source, /directRequest\(url, options, fetcher, signal\)/);
});
