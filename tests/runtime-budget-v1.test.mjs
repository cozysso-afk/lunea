import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('<script id="luneaRuntimeBudgetV1">');
const gate = html.indexOf('<script id="luneaBootGateV29">');
assert.ok(start > 0 && start < gate, 'runtime budget runs before the boot gate and every module');
assert.ok(html.indexOf('<script', 0) === start, 'runtime budget is the first script in the document');
const block = html.slice(start, html.indexOf('</script>', start));

for (const marker of ['__LUNEA_DOM_WRITE_GUARD_V1__', '__LUNEA_MOTION_BUDGET_V1__', '__LUNEA_FEATURE_DEFER_V1__'])
  assert.ok(block.includes(marker), marker);

// The write guard never swallows src/href writes or textContent that would remove child elements.
assert.match(block, /n!=='src'&&n!=='href'/);
assert.match(block, /kids\.length===1&&kids\[0\]\.nodeType===3/);

// Deferred families: feature modules only; home, boot and core modules load as before.
const pattern = block.match(/const DEFER=(\/.*?\/i);/)[1];
const DEFER = eval(pattern);
for (const file of ['lunea-horary-ai-explanation-v2.js', 'astro-horary-v1.js', 'lunea-prashna-v1.js', 'lunea-intimacy-clean-v39.js', 'lunea-meihua-v1.js', 'lunea-lenormand-polish-v1.js'])
  assert.ok(DEFER.test(`http://x/${file}?v=1`), file);
for (const file of ['lunea-boot-reveal-v29.js', 'spread-engine-v7.4.js', 'lunea-structural-routing-v4.js', 'lunea-daily-orbit6-v21.js', 'timing-oracle-v1.js', 'thai-taksa-v1.js', 'lunea-home-portal-v8.js', 'lunea-reading-context-v1.js'])
  assert.ok(!DEFER.test(`http://x/${file}?v=1`), file);

// Held modules keep an inert placeholder with the same id and src, and are released after reveal.
assert.match(block, /ph\.type='text\/x-lunea-deferred'/);
assert.match(block, /if\(node\.id\)ph\.id=node\.id/);
assert.match(block, /lunea-ui-ready/);
assert.match(block, /setTimeout\(release,9000\)/);

// Motion budget only settles costly loops.
assert.match(block, /COSTLY=\['boxShadow','filter','backgroundPosition','backdropFilter','webkitBackdropFilter','textShadow'\]/);
assert.match(block, /body\.modal-open>\.app/);

console.log('runtime budget V1 contract ok');
