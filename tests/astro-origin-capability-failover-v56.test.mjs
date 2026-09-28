import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-astro-origin-failover-v56.js', import.meta.url), 'utf8');

// Missing routes on one official service must fail over instead of surfacing 404/405.
assert.match(source, /RECOVERABLE = new Set\(\[404, 405, 408, 425, 429, 500, 502, 503, 504\]\)/);
assert.match(source, /if \(!RECOVERABLE\.has\(firstResponse\.status\)\) return firstResponse/);

// Extended APIs live on the full Docker service and should skip the lightweight v2 first hop.
assert.match(source, /\\\/v1\\\/prashna/);
assert.match(source, /\\\/v1\\\/vedic\\\/profile/);
assert.match(source, /\\\/v1\\\/profile\\\/four-pillars/);
assert.match(source, /\\\/v1\\\/jobs\\\/astro/);
assert.match(source, /function needsFullService/);
assert.match(source, /fullService: LEGACY/);

// Custom / Gemini endpoints remain outside the official-origin interceptor.
assert.match(source, /if \(!origin\) return previousFetch\(input, init\)/);

console.log('LUNEA Astro origin capability failover V56.1 contract: PASS');
