import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader = fs.readFileSync('lunea-horary-location-loader-v39.js', 'utf8');
assert.match(loader, /lunea-horary-location-button-v39\.js/);
console.log('horary location loader v39 contract ok');
