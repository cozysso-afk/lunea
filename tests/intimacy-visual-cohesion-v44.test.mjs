import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL(`../${n}`,import.meta.url),'utf8');
const sector=read('lunea-sector-color-system-v28.js'), burgundy=read('lunea-intimacy-burgundy-v40.js'), oracle=read('lunea-intimacy-oracle-ui-v36.js');
test('INTIMACY owns a burgundy sector instead of GENERAL mint',()=>{assert.match(sector,/SECTORS[^\n]+intimacy/);assert.match(sector,/return 'intimacy'/);assert.match(sector,/data-lunea-sector=\"intimacy\"/);assert.match(sector,/--sec-rgb:211,91,139/)});
test('sector art is zoom-cropped and late icons stay synchronized',()=>{assert.match(burgundy,/transform:scale\(1\.20\)/);assert.match(burgundy,/function observeUi\(\)/);assert.match(burgundy,/MutationObserver/);assert.match(burgundy,/const RELEASE = '40\.4'/)});
test('reading chrome overrides opal mint while INTIMACY is active',()=>{assert.match(burgundy,/body\.lunea-intimacy-reading #spreadOverlay \.actionbar/);assert.match(burgundy,/body\.lunea-intimacy-reading #sheet\[data-lunea-sector=\"intimacy\"\]/)});
test('Oracle panel lifts black levels without changing art assets',()=>{assert.match(oracle,/backgroundSize='100% 100%'/);assert.match(oracle,/filter:none/);assert.match(oracle,/rgba\(31,8,18,\.64\)/);assert.match(oracle,/oracle_back_intimacy_final\.png/)});
