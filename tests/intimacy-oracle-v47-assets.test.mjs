import fs from 'node:fs';
import assert from 'node:assert/strict';
const ui=fs.readFileSync(new URL('../lunea-intimacy-oracle-ui-v36.js',import.meta.url),'utf8');
assert.match(ui,/oracle_back_v2\.png/);
assert.match(ui,/CARD_ASSET_VERSION='v47'/);
assert.match(ui,/backgroundSize='cover'/);
assert.match(ui,/brightness\(1\.14\)/);
assert.match(ui,/min-height:26%/);
for(let i=1;i<=36;i++){
  const n=String(i).padStart(2,'0');
  const b=fs.readFileSync(new URL(`../assets/intimacy-oracle/cards/oracle_${n}.png`,import.meta.url));
  assert.ok(b.length>20_000,`oracle_${n}.png too small`);
  assert.deepEqual([...b.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
}
const back=fs.readFileSync(new URL('../assets/intimacy-oracle/oracle_back_v2.png',import.meta.url));
assert.ok(back.length>20_000);
console.log('INTIMACY Oracle V47 assets/display contract PASS');
