import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-cardback-restore-v19.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');
const back = fs.readFileSync(new URL('../assets/intimacy-oracle/back_intimacy.PNG', import.meta.url));

test('card-back restore V19.2 recognizes INTIMACY as a first-class category', () => {
  assert.match(source, /const RELEASE = '19\.2'/);
  assert.match(source, /const ASSET_KEY = '1920'/);
  assert.match(source, /INTIMACY:\s*'assets\/intimacy-oracle\/back_intimacy\.PNG'/);
  assert.match(source, /return FILES\[value\] \? value : 'GENERAL'/);
});

test('INTIMACY card back asset is a real PNG', () => {
  assert.deepEqual([...back.subarray(1, 4)], [0x50, 0x4e, 0x47]);
  assert.ok(back.length > 10000, 'INTIMACY card back is unexpectedly small');
});

test('dynamic restore still repairs subtree inserts and owns iOS retry behavior', () => {
  assert.ok(!source.includes("root.querySelectorAll?.('#cards .tarot-card .back')"));
  assert.match(source, /root\.querySelectorAll\?\.\('\.tarot-card \.back'\)/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /luneaCardbackAttempts/);
  assert.match(source, /Date\.now\(\)/);
});

test('Pages cache refresh continues stamping the card-back repair module in both loader paths', () => {
  assert.match(workflow, /'lunea-cardback-restore-v19\.js'/);
  assert.match(workflow, /if count != 2:/);
  assert.match(workflow, /Could not stamp both nested loader paths for \{asset\}/);
  assert.match(workflow, /lunea-structural-routing-v4\.js/);
});
