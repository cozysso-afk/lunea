import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../lunea-intimacy-oracle-ui-v36.js',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js',import.meta.url),'utf8');
test('Oracle V46 uses one standardized 3:5 display asset without browser crop',()=>{
  assert.match(source,/CARD_ASSET_VERSION='v46'/);
  assert.match(source,/backgroundSize='100% 100%'/);
  assert.match(source,/lio-card-front/);
});
test('Oracle cards are true two-sided 3D flips on iOS-safe CSS',()=>{
  assert.match(source,/perspective:900px/);
  assert.match(source,/transform-style:preserve-3d/);
  assert.match(source,/-webkit-transform-style:preserve-3d/);
  assert.match(source,/backface-visibility:hidden/);
  assert.match(source,/-webkit-backface-visibility:hidden/);
  assert.match(source,/rotateY\(180deg\)/);
  assert.match(source,/transition:transform \.62s/);
});
test('Reveal all staggers Oracle flips at the Tarot 110ms rhythm without rerender',()=>{
  assert.match(source,/ORACLE_FLIP_GAP=110/);
  assert.match(source,/seq\*ORACLE_FLIP_GAP/);
  const render=source.slice(source.indexOf('function renderOraclePanel'),source.indexOf('function performOracleDraw'));
  assert.doesNotMatch(render,/renderOraclePanel\(\);saveSidecar/);
  assert.match(render,/revealOracleButton\(b,i\)/);
});
test('Oracle runtime cache token advances for PWA refresh',()=>{
  assert.match(bridge,/lunea-intimacy-oracle-ui-v36\.js\?v=3614/);
});
