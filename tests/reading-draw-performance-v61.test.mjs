import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const ai = read('lunea-universal-ai-opal-v20.js');
const runtime = read('lunea-runtime-regression-v60.js');
const manual = read('lunea-manual-limit20-v17.js');
const attachments = read('lunea-reading-attachments-v1.js');

const yieldBody = ai.match(/async function yieldForAiStart\(id\) \{([\s\S]*?)\n  \}/)?.[1] || '';
assert.equal((yieldBody.match(/await nextPaint\(\);/g) || []).length, 1, 'AI confirm should yield exactly one paint frame');
assert.doesNotMatch(yieldBody, /setTimeout/, 'AI confirm should not add an extra zero-delay timer');

assert.doesNotMatch(runtime, /function watchAiTransition\(/, 'V60 must not poll every animation frame');
assert.match(runtime, /new MutationObserver\(\(\) => settleAiTransitionIfDrawn\(true\)\)/, 'MutationObserver remains the primary completion signal');
assert.match(runtime, /requestAnimationFrame\(\(\) => \{\s*if \(epoch === aiEpoch\) settleAiTransitionIfDrawn\(\);\s*\}\);/, 'one-frame safety check remains');

assert.match(manual, /document\.createDocumentFragment\(\)/, 'manual cards should build off-DOM');
assert.match(manual, /fragment\.appendChild\(makeCardWrapper/, 'manual card wrappers should append to the fragment');
assert.match(manual, /cards\?\.appendChild\(fragment\)/, 'manual cards should enter the live DOM in one append');

assert.match(attachments, /if \(!W\.LUNEA_READING_LIFECYCLE_V59\) clearForNewReading\(\);/, 'attachment cleanup wrapper must defer to V59 when present');

console.log('Reading draw performance V61 source invariants: PASS');
