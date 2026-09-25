import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url), 'utf8');

assert.match(source, /V57\.4/);
assert.match(source, /FULL_SERVICE_PATH=/);
assert.match(source, /prashna/);
assert.match(source, /vedic\\\/profile/);
assert.match(source, /profile\\\/four-pillars/);
assert.match(source, /jobs\\\/astro/);
assert.match(source, /if\(requiresFullService\(path\)\)return \[FULL,V2\]/);
assert.match(source, /method!==\'POST\'\|\|!\[404,405\]\.includes/);
assert.ok(source.includes('return /^\\/v1\\//i.test(path);'));
assert.match(source, /if\(response\.ok&&!requiresFullService\(path\)\)lastHealthyOrigin=origin/);
assert.match(source, /fullService:FULL/);

console.log('LUNEA Astro Origin Failover V57.4 contract: PASS');
