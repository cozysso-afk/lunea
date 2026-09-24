import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-home-final-tune-v32.js', import.meta.url), 'utf8');

assert.match(source, /grid-template-columns', 'repeat\(6,minmax\(0,1fr\)\)', 'important'/);
assert.match(source, /thai\.style\.setProperty\('grid-column', 'span 3', 'important'\)/);
assert.match(source, /thai\.style\.setProperty\('width', 'auto', 'important'\)/);
assert.match(source, /pick\('lenormand'\), pick\('meihua'\)/);
assert.match(source, /pick\('horary'\), portal\.querySelector\('\.lunea-thai-home-tile'\)/);
assert.match(source, /DIVINATION · ASTROLOGY/);
assert.match(source, /stablePasses >= 5/);
assert.match(source, /settleTries >= 80/);
assert.match(source, /version:35\.1/);

console.log('LUNEA Home V35 system grid race regression: PASS');
