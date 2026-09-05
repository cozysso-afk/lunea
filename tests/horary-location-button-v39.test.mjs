import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync('lunea-horary-location-button-v39.js', 'utf8');
const cache = fs.readFileSync('lunea-cache-refresh-v1.js', 'utf8');

assert.match(src, /현재 위치 인식/);
assert.match(src, /navigator\.geolocation\.getCurrentPosition/);
assert.match(src, /luneaHoraryLatV38/);
assert.match(src, /luneaHoraryLonV38/);
assert.match(src, /luneaHoraryTimezoneV38/);
assert.match(src, /astroHoraryPlace/);
assert.match(src, /addEventListener\('click', resolveCurrentLocation\)/);
assert.match(cache, /lunea-horary-location-button-v39\.js/, 'build-scoped Horary location loader missing');

console.log('horary location button v39 contract ok');
