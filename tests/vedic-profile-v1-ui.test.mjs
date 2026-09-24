import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync(new URL('../vedic-profile-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../profile-select-ui-v2.1.js', import.meta.url), 'utf8');
const profile = fs.readFileSync(new URL('../celestial-profile-v4.js', import.meta.url), 'utf8');

assert.match(profile, /cpv4PanelVedic/);
assert.match(profile, /Sidereal · 고정/);
assert.match(profile, /Lahiri · V1 기본/);
assert.match(client, /\/v1\/vedic\/profile/);
assert.match(client, /LUNEA_VEDIC_PROFILE_V1/);
assert.match(client, /D1\/Rāśi/);
assert.match(client, /Nakshatra\/Pada/);
assert.match(client, /Panchanga V1/);
assert.match(client, /Western Tropical 값의 단순 보정값을 사용하지 않아/);
assert.match(client, /LUNEA_ASTRO_API_URL/);
assert.match(client, /birthDate/);
assert.match(client, /birthTime/);
assert.match(client, /birthPlace/);
assert.match(loader, /vedic-profile-v1\.js\?v=101/);
assert.match(loader, /data-lunea-vedic-profile-v1/);

console.log('LUNEA Vedic Profile V1 UI contract: PASS');
