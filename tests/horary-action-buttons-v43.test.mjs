import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = fs.readFileSync(new URL('../astro-horary-v1.js', import.meta.url), 'utf8');
const guard = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url), 'utf8');

// The base Horary modal still owns the real action callbacks.
assert.match(base, /\$\('astroHoraryAI'\)\.onclick = runAI/);
assert.match(base, /\$\('astroHoraryCopy'\)\.onclick = copyHoraryResult/);
assert.match(base, /\$\('astroHorarySave'\)\.onclick = saveStandalone/);

// Mobile/PWA guard remembers those callbacks and restores them if a later
// runtime patch replaces a node or drops its property handler.
assert.match(guard, /HORARY ACTION BUTTON GUARD V43/);
assert.match(guard, /astroHoraryAI/);
assert.match(guard, /astroHoraryCopy/);
assert.match(guard, /astroHorarySave/);
assert.match(guard, /savedHandlers\.set\(id,node\.onclick\)/);
assert.match(guard, /node\.onclick=savedHandlers\.get\(id\)/);
assert.match(guard, /new MutationObserver\(\(\)=>repair\(\)\)/);

// Action layer remains tappable above later-injected Horary/Prashna blocks.
assert.match(guard, /pointer-events','auto','important'/);
assert.match(guard, /touch-action','manipulation','important'/);
assert.match(guard, /z-index','50','important'/);
assert.match(guard, /z-index','51','important'/);
assert.match(guard, /addEventListener\('pointerdown'/);
assert.match(guard, /addEventListener\('touchstart'/);

console.log('LUNEA Horary action buttons V43 mobile guard contract: PASS');
