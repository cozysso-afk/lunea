import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL(`../${n}`,import.meta.url),'utf8');
const ios=read('lunea-ios-performance-v3.js'), burgundy=read('lunea-intimacy-burgundy-v40.js'), oracle=read('lunea-intimacy-oracle-ui-v36.js'), manual=read('lunea-manual-structure-v1.js'), everywhere=read('lunea-manual-everywhere-v1.js'), manual20=read('lunea-manual-limit20-v17.js');
test('initial iOS INTIMACY back is dedicated',()=>{assert.match(ios,/tarot_back_intimacy_final\.png/);assert.match(burgundy,/const RELEASE = '40\.4'/);assert.match(burgundy,/makeCardWrapper = wrapped/)});
test('direct sheet exposes Oracle controls',()=>{assert.match(oracle,/prepareSheetTools/);assert.match(everywhere,/prepareSheetTools/);assert.match(manual,/prepareSheetTools/)});
test('manual <=12 and 13-20 attach Tarot repair and Oracle draw',()=>{for(const s of [manual,manual20]){assert.match(s,/repairTarotCards/);assert.match(s,/performOracleDraw/)}});
