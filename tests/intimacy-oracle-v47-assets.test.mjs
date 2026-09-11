import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const ui=fs.readFileSync(new URL('../lunea-intimacy-oracle-ui-v36.js',import.meta.url),'utf8');
assert.match(ui,/oracle_back_v2\.png/);
assert.match(ui,/CARD_ASSET_VERSION='final36-20260911'/);
assert.match(ui,/backgroundSize='contain'/);
assert.doesNotMatch(ui,/brightness\(|saturate\(|min-height:26%/);
assert.match(ui,/filter:none/);
assert.match(ui,/lio-card-meta\{position:static/);
const approved=JSON.parse(fs.readFileSync(new URL('./fixtures/intimacy-final-faces.json',import.meta.url),'utf8'));
assert.equal(approved.length,36);
for(let i=1;i<=36;i++){
  const n=String(i).padStart(2,'0');
  const b=fs.readFileSync(new URL(`../assets/intimacy-oracle/cards/oracle_${n}.png`,import.meta.url));
  const expected=approved[i-1];
  assert.equal(expected.card_code,`O${n}`);
  assert.equal(b.length,expected.bytes);
  assert.equal(createHash('sha256').update(b).digest('hex'),expected.sha256);
  assert.equal(createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex'),expected.git_blob_sha1);
  assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],expected.dimensions);
  assert.deepEqual([...b.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
}
const back=fs.readFileSync(new URL('../assets/intimacy-oracle/oracle_back_v2.png',import.meta.url));
assert.ok(back.length>20_000);
console.log('INTIMACY approved 36-face hash and display contract PASS (static, not rendered)');
