import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const lifecycle = read('lunea-reading-lifecycle-v59.js');
const cache = read('lunea-cache-refresh-v1.js');
const learning = read('lunea-learning-success-gate-v1.js');
const boundary = read('lunea-reading-boundary-reset-v31.js');
const runtimeState = read('lunea-runtime-state-v56.js');
const universal = read('lunea-universal-ai-opal-v20.js');
const manual = read('lunea-manual-structure-v1.js');
const manualEverywhere = read('lunea-manual-everywhere-v1.js');
const manual20 = read('lunea-manual-limit20-v17.js');
const polish = read('lunea-reading-polish-v14.js');
const timingIsolation = read('lunea-thai-archive-timing-isolation-v27.js');
const mobile = read('lunea-mobile-runtime-fixes-v57.js');
const lagGuard = read('lunea-lag-guard-v1.js');
const intimacy = read('lunea-intimacy-oracle-ui-v36.js');
const bootReveal = read('lunea-boot-reveal-v29.js');

const noStartAssignment = (source, label) => {
  assert.ok(!/W\.startSpread\s*=/.test(source), `${label} must not replace window.startSpread`);
  assert.ok(!/(?:^|[^.\w])startSpread\s*=\s*function/m.test(source), `${label} must not replace bare startSpread`);
};

// V59 is now a real session boundary, not a marker-suppression layer.
noStartAssignment(lifecycle, 'V59');
assert.ok(!/setInterval\s*\(/.test(lifecycle), 'V59 must not poll');
assert.ok(!/__luneaMobileV57Yield/.test(lifecycle), 'V59 must not fake V57 installation markers');
assert.ok(!/__luneaV14Wrapped/.test(lifecycle), 'V59 must not fake V14 installation markers');
assert.ok(!/__luneaV27Wrapped/.test(lifecycle), 'V59 must not fake V27 installation markers');
assert.ok(!/markStableStartSpread/.test(lifecycle), 'V59 must not stamp startSpread compatibility markers');
assert.match(lifecycle, /let readingSessionId = 0/);
assert.match(lifecycle, /function beginSession\(/);
assert.match(lifecycle, /readingSessionId \+= 1/);
assert.match(lifecycle, /function isCurrent\(id\)/);
assert.match(lifecycle, /function guard\(id, fn\)/);
assert.match(lifecycle, /LUNEA_LAG_GUARD_V1\?\.reset/);
assert.match(lifecycle, /luneaDraftRestore/);
assert.match(lifecycle, /__LUNEA_AI_REPEAT_FLOW_V58__ = true/);

// V31 is synchronous DOM/source reset only: no Timing-open reset, no wrapper,
// no polling, and no delayed cleanup that can cross reading sessions.
assert.ok(!/onclick\.call\(/.test(boundary), 'V31 must not open Timing via button handler');
noStartAssignment(boundary, 'V31');
assert.ok(!/function\s+wrappedStartSpread/.test(boundary), 'V31 must not create startSpread wrapper');
assert.ok(!/setInterval\s*\(/.test(boundary), 'V31 must not poll/re-wrap');
assert.ok(!/queueMicrotask\s*\(/.test(boundary), 'V31 cleanup must not outlive its boundary');
assert.ok(!/requestAnimationFrame\s*\(/.test(boundary), 'V31 cleanup must not outlive its boundary');
assert.match(boundary, /resetTimingBoundary\('question-change'\)/);

// V56 delayed aux cleanup is epoch + question guarded.
assert.match(runtimeState, /let boundaryEpoch = 0/);
assert.match(runtimeState, /const epoch = \+\+boundaryEpoch/);
assert.match(runtimeState, /if \(epoch !== boundaryEpoch\) return/);
assert.match(runtimeState, /if \(currentQuestion\(\) !== questionAtBoundary\) return/);

// Legacy wrapper-growth sources must no longer own startSpread or polling.
for (const [label, source] of [
  ['V14', polish],
  ['V27', timingIsolation],
  ['V57', mobile],
  ['Manual V1', manual],
  ['Manual V17', manual20],
  ['Lag Guard', lagGuard],
  ['Learning Gate', learning],
  ['Intimacy V36', intimacy],
]) {
  noStartAssignment(source, label);
  assert.ok(!/setInterval\s*\(/.test(source), `${label} must not poll/re-wrap`);
}
assert.ok(!/wrapStartSpread/.test(polish), 'V14 wrapStartSpread must be removed');
assert.ok(!/installStartSpreadYield/.test(mobile), 'V57 global async yield installer must be removed');
assert.ok(!/installStartSpreadReset/.test(lagGuard), 'Lag Guard startSpread wrapper must be removed');
assert.ok(!/installStartGate/.test(learning), 'Learning gate startSpread wrapper must be removed');
assert.ok(!/function\s+patchStart/.test(intimacy), 'Intimacy startSpread wrapper must be removed');
assert.match(lagGuard, /LUNEA_LAG_GUARD_V1 = Object\.freeze/);
assert.match(timingIsolation, /version:27\.1/);
assert.match(manual20, /Manual Limit V17\.1/);
assert.match(intimacy, /RELEASE='36\.5'/);

// V14 delayed A/B work must use the V59 session-aware scheduler.
assert.match(polish, /currentSessionId/);
assert.match(polish, /sessionTimeout/);
assert.match(polish, /isCurrent\(mySession\)/);
assert.ok(!/\[250,\s*800,\s*1800\]/.test(polish), 'V14 wrapper retry schedule must be gone');

// Universal AI is hydrate-only, owns local paint yielding, calls start once,
// awaits it, and commits learning only after successful start.
assert.ok(!/function\s+addAIEntry/.test(universal), 'V20 must not create visible category rows');
assert.ok(!/setInterval\s*\(/.test(universal), 'V20 must not poll for rows/draw wrapper');
assert.match(universal, /function hydrateCategoryEntries/);
assert.match(universal, /async function yieldForAiStart/);
assert.match(universal, /const started = start\(/);
assert.match(universal, /await Promise\.resolve\(started\)/);
assert.match(universal, /__luneaLearningCorrection/);
assert.match(universal, /gate\?\.commit/);

// Learning gate is a post-success commit helper only.
assert.ok(!/\.record\s*=/.test(learning), 'learning gate must not replace learning.record');
assert.match(learning, /function commit\(payload\)/);

// Manual entries are hydrate-only. Manual renderers keep one shuffle but run
// behind the V59 capture boundary. No global AI-row dependency or polling remains.
assert.ok(!/ensureManualReadingItem/.test(manual), 'Manual V1 must not dynamically create its menu row');
assert.ok(!/dataset\?\.title === '질문 맞춤 AI 배열'/.test(manual), 'Manual V1 must not depend on first AI row');
assert.match(manual, /dataset\.luneaLifecycleBound/);
assert.match(manual, /function startManualSpread/);
assert.match(manual, /const shuffled = secureShuffle\(TAROT_DECK\)/);
assert.match(manual20, /currentSessionId/);
assert.match(manual20, /isCurrent\(session\)/);
assert.match(manual20, /secureShuffle\(TAROT_DECK\)\.slice/);

assert.ok(!/function\s+makeManualItem/.test(manualEverywhere), 'Manual Everywhere must not create rows');
assert.ok(!/insertAdjacentElement/.test(manualEverywhere), 'Manual Everywhere must not insert rows');
assert.ok(!/MutationObserver/.test(manualEverywhere), 'Manual Everywhere must not late-insert via observer');
assert.ok(!/setInterval\s*\(/.test(manualEverywhere), 'Manual Everywhere must not poll');
assert.match(manualEverywhere, /dataset\.luneaLifecycleBound/);
assert.match(manualEverywhere, /hydrateCategories/);

// Intimacy post-draw behavior observes committed card DOM and uses session-aware
// timers rather than wrapping startSpread or scheduling stale retry callbacks.
assert.match(intimacy, /const sessionTimeout=/);
assert.match(intimacy, /function syncOracleToCards/);
assert.match(intimacy, /new MutationObserver\(syncOracleToCards\)/);
assert.ok(!/setTimeout\(\(\)=>\{if\(intimacy\(\)\)performOracleDraw/.test(intimacy), 'Intimacy old post-start timer must be gone');

// Core rows are parser-time and deterministically ordered. V29 refuses to reveal
// a menu without them even if auxiliary boot work is late.
for (const key of ['GENERAL','CAREER','LOVE','STOCK']) assert.match(lifecycle, new RegExp(`key:'${key}'`));
assert.match(lifecycle, /content\.insertBefore\(manual, content\.firstElementChild/);
assert.match(lifecycle, /content\.insertBefore\(ai, manual\)/);
assert.match(lifecycle, /dataset\.count = '0'/);
assert.match(lifecycle, /dataset\.manualSpread = '1'/);
assert.match(bootReveal, /const coreRowsReady=/);
assert.match(bootReveal, /if\(done\|\|!coreRowsReady\(\)\)return false/);
assert.ok(!/readyEnough\(\) \|\| performance\.now\(\)-start>2600/.test(bootReveal), 'V29 may not time out into a partial menu');

// Loader contract: parser-time lifecycle, V58 retired, V57.1 support retained,
// and no obsolete startSpread marker stamping.
assert.match(cache, /loadReadingLifecycleV59/);
assert.match(cache, /document\.write\(`/);
assert.ok(!/loadAiRepeatFlowV58\s*\(/.test(cache), 'V58 repeated-AI wrapper must not load');
assert.ok(!/markStableStartSpread/.test(cache), 'loader must not fake wrapper markers');
assert.match(cache, /loadMobileRuntimeFixesV57\(\)/);

console.log('reading-lifecycle-v59 source invariants: OK');