import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-final-assets-v41.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');

test('final art layer keeps tarot, oracle back, and oracle faces separate', () => {
  assert.match(source, /const RELEASE = '41\.1'/);
  assert.match(source, /tarot_back_final\.png/);
  assert.match(source, /oracle_back_final\.png/);
  assert.match(source, /oracle_atlas_final\.png/);
  assert.match(source, /FALLBACK_TAROT_BACK/);
  assert.match(source, /FALLBACK_ORACLE_BACK/);
  assert.match(source, /FALLBACK_ORACLE_ATLAS/);
});

test('oracle remains hidden until revealed and then uses 6x6 final atlas', () => {
  assert.match(source, /node\.classList\.contains\('revealed'\)/);
  assert.match(source, /paintOracleBack\(face\)/);
  assert.match(source, /paintOracleFront\(face, idx\)/);
  assert.match(source, /background-size', '600% 600%'/);
  assert.match(source, /idx % 6/);
  assert.match(source, /Math\.floor\(idx \/ 6\)/);
});

test('final art patch is scoped to INTIMACY and observes reveal class changes', () => {
  assert.match(source, /lunea-intimacy-reading/);
  assert.match(source, /category \|\| ''\)\.toUpperCase\(\) === 'INTIMACY'/);
  assert.match(source, /attributeFilter: \['class'\]/);
  assert.doesNotMatch(source, /querySelectorAll\('\.tarot-card \.back'\)/, 'must not patch every category globally');
});

test('reading action loader installs final art layer', () => {
  assert.match(order, /luneaIntimacyFinalAssetsV41Loader/);
  assert.match(order, /lunea-intimacy-final-assets-v41\.js/);
  assert.match(order, /ensureIntimacyFinalAssets/);
});
