import assert from 'node:assert/strict';
import fs from 'node:fs';

const reveal = fs.readFileSync(new URL('../lunea-boot-reveal-v29.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

assert.match(reveal, /option\[value="365"\]/, 'boot reveal must wait for the 1-year transit option');
assert.match(reveal, /data-lunea-long-days="365"/, 'boot reveal must wait for the 1-year transit quick chip');
assert.match(reveal, /5 CARD · CORE FLOW/, 'boot reveal must wait for the late GENERAL 5-card preset');
assert.match(reveal, /6 CARD · FULL VIEW/, 'boot reveal must wait for the late GENERAL 6-card preset');
assert.match(reveal, /LUNEA_FIXED_SPREAD_DEPTH_V30/, 'boot reveal must wait for fixed-spread patching');
assert.match(reveal, /LUNEA_GENERAL_ORDER/, 'boot reveal must wait for final GENERAL ordering');
assert.match(reveal, /data-lunea-universal-ai="1"/, 'boot reveal must wait for universal AI sector entries');
assert.match(reveal, /performance\.now\(\)-start>2600/, 'boot reveal must retain a bounded fail-open timeout');

for (const asset of [
  'lunea-transit-range-v1.js',
  'lunea-fixed-spread-depth-v30.js',
  'lunea-general-order-v30-5.js',
  'lunea-universal-ai-opal-v20.js',
  'lunea-boot-reveal-v29.js',
]) {
  assert.ok(workflow.includes(`'${asset}'`), `build stamp must refresh ${asset}`);
}

console.log('startup final UI gate contract: ok');
