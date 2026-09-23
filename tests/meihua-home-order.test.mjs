import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../lunea-meihua-v1.js', import.meta.url),'utf8');
const hotfix = fs.readFileSync(new URL('../lunea-mobile-interaction-hotfix-v1.js', import.meta.url),'utf8');

assert.match(ui,/data-key=\\?"meihua\\?"|dataset\.key\s*=\s*['"]meihua['"]/,'Meihua home tile key must exist');
assert.match(ui,/grid-column:1\/-1/,'Meihua V1 should remain full-width until a paired oracle is added');
assert.match(ui,/insertBefore\(tile,intimacy\s*\|\|\s*null\)/,'Meihua tile should place before Intimacy');
assert.ok(!/meihua\s*:\s*\d+/.test(hotfix),'Legacy portal normalizer should not pretend to own Meihua until explicitly integrated');

console.log('Meihua home order contract: PASS');
