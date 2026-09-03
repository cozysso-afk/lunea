import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');

const pngUrl = new URL('../assets/intimacy-oracle/intimacy_sector_v40.png', import.meta.url);

test('V40 ships a real PNG and uses it for INTIMACY branding', () => {
  assert.equal(fs.existsSync(pngUrl), true);
  const bytes = fs.readFileSync(pngUrl);
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
  assert.match(source, /intimacy_sector_v40\.png/);
  assert.match(source, /forceIcon\(\$\('\.cat-icon'/);
  assert.match(source, /lunea-v8-tile\[data-key="intimacy"\]/);
});

test('V40 gives the INTIMACY tile a dedicated burgundy wine palette', () => {
  assert.match(source, /linear-gradient\(145deg,rgba\(91,19,50/);
  assert.match(source, /rgba\(232,92,145/);
  assert.match(source, /#310b20/);
  assert.match(source, /luneaIntimacyBurgundyV40Style/);
});

test('late action-order module loads V40 with the release cache token', () => {
  assert.match(order, /INTIMACY_BURGUNDY_LOADER_ID/);
  assert.match(order, /lunea-intimacy-burgundy-v40\.js\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}/);
  assert.match(order, /ensureIntimacyBurgundyUi\(\)/);
});
