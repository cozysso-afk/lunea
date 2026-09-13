import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const lifecycle = read('lunea-reading-lifecycle-v59.js');
const cache = read('lunea-cache-refresh-v1.js');
const learning = read('lunea-learning-success-gate-v1.js');
const boundary = read('lunea-reading-boundary-reset-v31.js');
const universal = read('lunea-universal-ai-opal-v20.js');
const manualEverywhere = read('lunea-manual-everywhere-v1.js');

// V59 must stabilize the existing startSpread function, never add another wrapper.
assert.ok(!/W\.startSpread\s*=/.test(lifecycle), 'V59 must not replace window.startSpread');
assert.ok(!/setInterval\s*\(/.test(lifecycle), 'V59 must not poll/re-wrap with setInterval');
assert.match(lifecycle, /__luneaMobileV57Yield\s*=\s*true/);
assert.match(lifecycle, /__luneaAiRepeatFlowV58\s*=\s*true/);
assert.match(lifecycle, /__luneaReadingBoundaryV31\s*=\s*true/);
assert.match(lifecycle, /__luneaV14Wrapped\s*=\s*true/);
assert.match(lifecycle, /__luneaV27Wrapped\s*=\s*true/);

// V31.2 is a synchronous DOM/source reset only. It must never open Timing just
// to clear it, never own startSpread, and never poll to become the outer wrapper.
assert.ok(!/onclick\.call\(/.test(boundary), 'V31 must not open Timing via button handler');
assert.ok(!/W\.startSpread\s*=/.test(boundary), 'V31 must not replace window.startSpread');
assert.ok(!/function\s+wrappedStartSpread/.test(boundary), 'V31 must not create a startSpread wrapper');
assert.ok(!/setInterval\s*\(/.test(boundary), 'V31 must not poll/re-wrap');
assert.ok(!/queueMicrotask\s*\(/.test(boundary), 'V31 cleanup must not outlive the boundary in a microtask');
assert.ok(!/requestAnimationFrame\s*\(/.test(boundary), 'V31 cleanup must not outlive the boundary in a frame callback');
assert.match(boundary, /resetTimingBoundary\('question-change'\)/);
assert.match(boundary, /resetTimingBoundary\('direct-reading-entry'\)/);

// The learning gate may wrap exactly once, but it must preserve the lifecycle
// markers and must not keep polling/re-wrapping after load.
assert.ok(!/setInterval\s*\(/.test(learning), 'learning gate must install one-shot');
assert.match(learning, /START_MARKERS/);
assert.match(learning, /if\(prior\?\.\[marker\]\)wrapped\[marker\]=true/);

// Core cabinets must receive deterministic AI + Manual rows before late feature hydration.
for (const key of ['GENERAL','CAREER','LOVE','STOCK']) {
  assert.match(lifecycle, new RegExp(`key:'${key}'`));
}
assert.match(lifecycle, /content\.insertBefore\(manual, content\.firstElementChild/);
assert.match(lifecycle, /content\.insertBefore\(ai, manual\)/);
assert.match(lifecycle, /dataset\.count\s*=\s*'0'/, 'AI placeholder must be recognized by V20');
assert.match(lifecycle, /lunea-manual-anywhere-item/, 'Manual placeholder must be recognized by Manual Everywhere');

// Existing feature modules must recognize the parser-time rows instead of duplicating them.
assert.match(universal, /item\.dataset\.count\s*===\s*'0'/);
assert.match(manualEverywhere, /content\.querySelector\('\.lunea-manual-anywhere-item'\)/);

// Loader contract: V59 is parser-time, V58 wrapper is retired, V57 support remains.
assert.match(cache, /loadReadingLifecycleV59/);
assert.match(cache, /document\.write\(`/);
assert.match(cache, /loadReadingLifecycleV59\(\);[\s\S]*DOMContentLoaded/);
assert.ok(!/loadAiRepeatFlowV58\s*\(/.test(cache), 'V58 repeated-AI wrapper must not load');
assert.match(cache, /loadMobileRuntimeFixesV57\(\)/, 'V57 non-startSpread support must remain loaded');

console.log('reading-lifecycle-v59 source invariants: OK');
