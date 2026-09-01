import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.LUNEA_TEST_ROOT || process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('Gemini watchdog allows long readings and aborts timed-out work', () => {
  const source = read('lunea-astro-stability-v2.js');
  assert.match(source, /const GEMINI_TIMEOUT_MS = 75000;/);
  assert.doesNotMatch(source, /\},\s*40000\s*\);/);
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /timeoutController\.abort\('lunea-gemini-timeout'\)/);
  assert.match(source, /AI 요청이 75초를 넘어 중단했어/);
});

test('only the stability layer owns the production request watchdog', () => {
  const source = read('lunea-astro-stability-v2.js');
  assert.match(source, /W\.__LUNEA_REQUEST_WATCHDOG_V305__ = true;/);
  assert.match(source, /W\.__LUNEA_GEMINI_WATCHDOG_V3__ = true;/);
});

test('main-push cache stamping refreshes request watchdog assets', () => {
  const workflow = read('.github/workflows/bump-lunea-loader-413.yml');
  assert.match(workflow, /lunea-astro-stability-v2\.js/);
  assert.match(workflow, /lunea-ios-performance-v3\.js/);
  assert.match(workflow, /re\.subn\(pattern, replacement, s, count=1\)/);
});
