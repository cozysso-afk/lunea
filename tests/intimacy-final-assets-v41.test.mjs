import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-final-assets-v41.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');
const sharedBackUrl = new URL('../assets/intimacy-oracle/back_intimacy_final.jpg', import.meta.url);
const atlasUrl = new URL('../assets/intimacy-oracle/oracle_atlas_final.jpg', import.meta.url);

test('V41 parses and initializes its public API in a minimal browser realm', () => {
  const window = {};
  window.window = window;
  const document = {
    readyState: 'loading',
    addEventListener() {},
    body: null,
  };
  assert.doesNotThrow(() => vm.runInNewContext(source, {
    window,
    document,
    console,
    Object,
    Array,
    String,
    URL,
    Promise,
    encodeURIComponent,
    setTimeout() { return 0; },
  }));
  assert.ok(window.LUNEA_INTIMACY_FINAL_ASSETS_V41);
  assert.equal(window.LUNEA_INTIMACY_FINAL_ASSETS_V41.version, '41.3');
});

test('final art layer uses one real shared back for tarot/oracle and the 36-card atlas', () => {
  assert.match(source, /const RELEASE = '41\.3'/);
  assert.match(source, /FINAL_SHARED_BACK/);
  assert.match(source, /back_intimacy_final\.jpg/);
  assert.match(source, /FINAL_TAROT_BACK = FINAL_SHARED_BACK/);
  assert.match(source, /FINAL_ORACLE_BACK = FINAL_SHARED_BACK/);
  assert.match(source, /oracle_atlas_final\.jpg/);
  assert.match(source, /FALLBACK_TAROT_BACK/);
  assert.match(source, /FALLBACK_ORACLE_BACK/);
  assert.match(source, /FALLBACK_ORACLE_ATLAS/);
  assert.doesNotMatch(source, /tarot_back_final\.png|oracle_back_final\.png|oracle_atlas_final\.png/);

  assert.equal(fs.existsSync(sharedBackUrl), true);
  assert.equal(fs.existsSync(atlasUrl), true);
  const back = fs.readFileSync(sharedBackUrl);
  const atlas = fs.readFileSync(atlasUrl);
  assert.deepEqual([...back.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.deepEqual([...atlas.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.ok(back.length > 100000, 'shared back should be the supplied real artwork');
  assert.ok(atlas.length > 100000, 'final atlas should contain the supplied 36-card artwork');
});

test('final asset probe checks the shared back once and reuses it for tarot and oracle', () => {
  assert.match(source, /const \[sharedBack, oracle\] = await Promise\.all/);
  assert.match(source, /assetExists\(FINAL_SHARED_BACK\)/);
  assert.match(source, /finalTarotReady = sharedBack/);
  assert.match(source, /finalOracleBackReady = sharedBack/);
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
  assert.match(source, /currentReadingState/);
  assert.match(source, /typeof state !== 'undefined'/);
  assert.match(source, /attributeFilter: \['class'\]/);
  assert.doesNotMatch(source, /querySelectorAll\('\.tarot-card \.back'\)/, 'must not patch every category globally');
});

test('reading action loader installs final art layer and V41 chains the depth router', () => {
  assert.match(order, /luneaIntimacyFinalAssetsV41Loader/);
  assert.match(order, /lunea-intimacy-final-assets-v41\.js/);
  assert.match(order, /ensureIntimacyFinalAssets/);
  assert.match(source, /lunea-intimacy-depth-v42\.js/);
  assert.match(source, /ensureDepthLayer/);
});
