import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const runtime = read('lunea-mobile-runtime-fixes-v57.js');
const loader = read('lunea-cache-refresh-v1.js');
const stability = read('lunea-astro-stability-v2.js');
const universal = read('lunea-universal-ai-opal-v20.js');

// Syntax smoke tests for the late-loaded production scripts.
new Function(runtime);
new Function(loader);
new Function(stability);
new Function(universal);

assert.match(loader, /lunea-mobile-runtime-fixes-v57\.js/, 'V57 runtime support must remain build-scoped and loaded');
assert.match(loader, /__LUNEA_ASTRO_RETRY_V43__\s*=\s*true/, 'legacy retry fan-out must stay disabled behind V56 origin failover');

assert.match(runtime, /#luneaV20PreviewConfirm/, 'AI spread confirmation must still be detected for deferred learning I/O');
assert.doesNotMatch(runtime, /installStartSpreadYield|__luneaMobileV57Yield/, 'V57 must not own or re-wrap startSpread');
assert.match(universal, /async function yieldForAiStart/,'AI paint yielding must live locally in Universal AI V20');
assert.match(universal, /requestAnimationFrame/,'AI local yield must cross browser paint frames');
assert.match(universal, /await yieldForAiStart\(/,'AI confirmation path must await the local paint yield before starting cards');
assert.match(universal, /await Promise\.resolve\(started\)/,'AI draw must await the canonical start result without mutating its global contract');
assert.match(runtime, /deferred_mobile_idle/, 'post-draw correction learning must leave the critical paint path');
assert.match(runtime, /365, '365일 · 1년'/, 'one-year Transit option must be available on first open');
assert.match(runtime, /pointerdown', onFastHoraryClose/, 'Horary close must use first pointer contact on iOS');
assert.match(runtime, /LUNEA_LAST_READING_AUX_V57/, 'Timing/Thai auxiliary results must have companion draft persistence');
assert.match(runtime, /RESTORED LAST READING · TIMING ORACLE/, 'restored Timing evidence must return to the AI prompt');
assert.match(runtime, /RESTORED LAST READING · THAI ASTROLOGY/, 'restored Thai evidence must return to the AI prompt');

assert.match(stability, /primeReady\(false\);\s*return original\.call/, 'Astro run buttons must start immediately instead of awaiting health');
assert.match(stability, /ensureReady:\s*primeReady/, 'Horary internal ensureReady await must resolve without serial health delay');
assert.doesNotMatch(stability, /await ensureReady\(false\)/, 'button wrapper must not block behind health probe');

console.log('mobile runtime V57 / local AI-yield smoke tests passed');
