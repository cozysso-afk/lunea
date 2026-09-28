import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-home-visual-v36.js', import.meta.url), 'utf8');

assert.match(source, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
assert.match(source, /'general','love','career','stock','timing','intimacy','signal','divider','lenormand','meihua','horary','thai'/);
assert.match(source, /DIVINATION · ASTROLOGY/);
assert.match(source, /new MutationObserver\(requestLayout\)/);
assert.doesNotMatch(source, /stablePasses|settleTries|setInterval\(/);
assert.match(source, /version:36/);

console.log('LUNEA Home V36 single-owner grid race regression: PASS');
