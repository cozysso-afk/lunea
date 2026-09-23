import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');

const sectorUrl = new URL('../assets/intimacy-oracle/intimacy_sector_final.png', import.meta.url);
const tarotBackUrl = new URL('../assets/intimacy-oracle/tarot_back_intimacy_final.png', import.meta.url);

test('V40 uses separate final PNGs for branding and Tarot back', () => {
  assert.equal(fs.existsSync(sectorUrl), true);
  assert.equal(fs.existsSync(tarotBackUrl), true);
  for (const url of [sectorUrl, tarotBackUrl]) {
    const bytes = fs.readFileSync(url);
    assert.deepEqual([...bytes.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    assert.ok(bytes.length > 100_000, 'final PNG must not be a tiny placeholder');
  }
  assert.match(source, /intimacy_sector_final\.png/);
  assert.match(source, /tarot_back_intimacy_final\.png/);
  assert.doesNotMatch(source, /oracle_back_v2\.png/);
  assert.match(source, /backImg\.setAttribute\('src', TAROT_BACK_SRC\)/);
});

test('INTIMACY Tarot back has one owner without an intermediate shared restore paint', () => {
  const repair = source.slice(source.indexOf('function repairTarotCards'), source.indexOf('function wrapCardFactory'));
  assert.doesNotMatch(repair, /repairVisibleReading/);
  assert.match(repair, /wrappers\.forEach\(repairTarotWrapper\)/);
});

test('V40 gives the INTIMACY tile a dedicated burgundy wine palette', () => {
  assert.match(source, /linear-gradient\(155deg,rgba\(69,16,40/);
  assert.match(source, /rgba\(222,126,164/);
  assert.match(source, /#19070f/);
  assert.match(source, /luneaIntimacyBurgundyV40Style/);
});

test('late action-order module loads V40 through the shared cache-token loader', () => {
  assert.match(order, /INTIMACY_BURGUNDY_LOADER_ID/);
  assert.match(order, /ensureScript\(INTIMACY_BURGUNDY_LOADER_ID, '\.\/lunea-intimacy-burgundy-v40\.js'/);
  assert.match(order, /script\.src = `\$\{src\}\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}`/);
  assert.match(order, /ensureIntimacyBurgundyUi\(\)/);
});