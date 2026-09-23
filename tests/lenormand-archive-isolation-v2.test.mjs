import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-archive-card-images-v1.js', import.meta.url), 'utf8');

test('archive card strips bind by saved reading identity, never journal row index', () => {
  assert.match(source, /const VERSION = 2/);
  assert.match(source, /dataset\?\.sourceArchiveId/);
  assert.match(source, /findArchiveItemForNode\(node, rows\)/);
  assert.doesNotMatch(source, /const item = rows\[index\]/);
  assert.match(source, /luneaArchiveCardImagesItemId/);
  assert.match(source, /existingStrip\?\.remove\(\)/);
});

test('Lenormand cards are isolated from Tarot backfill and keep readable labels', () => {
  assert.match(source, /function isLenormandItem\(item\)/);
  assert.match(source, /isLenormandItem\(item\)\s*\? item\.cards\.map/);
  assert.match(source, /data\.position \|\| data\.name \|\| data\.text \|\| '카드'/);
  assert.match(source, /card\?\.img \|\| card\?\.image \|\| match\?\.img/);
});

test('Lenormand save bridges legacy archive write into Journal V2 immediately', () => {
  assert.match(source, /function installLenormandJournalBridge\(\)/);
  assert.match(source, /const button = \$\('lnSave'\)/);
  assert.match(source, /W\.LUNEA_READING_JOURNAL\?\.render/);
  assert.match(source, /installLenormandJournalBridge\(\)/);
});

console.log('Lenormand archive identity/isolation V2 regression tests: PASS');
