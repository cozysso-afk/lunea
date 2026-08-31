import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const manual = read('lunea-manual-structure-v1.js');
const manual20 = read('lunea-manual-limit20-v17.js');
const universal = read('lunea-universal-ai-opal-v20.js');
const preflight = read('lunea-ai-spread-preflight-v2.js');
const learning = read('lunea-user-spread-learning-v1.js');
const cloud = read('lunea-learning-cloud-sync-v1.js');
const gate = read('lunea-learning-success-gate-v1.js');
const loader = read('lunea-structural-routing-v4.js');
const migration = read('supabase/migrations/20260831_spread_learning_1000_common_scaffold.sql');

assert.match(manual, /LUNEA_SPREAD_LEARNING_V1\?\.recordManual/, 'base manual spread must feed learning memory');
assert.match(manual20, /LUNEA_SPREAD_LEARNING_V1\?\.recordManual/, '20-card manual spread must feed learning memory');
assert.match(universal, /LUNEA_SPREAD_LEARNING_V1\?\.record/, 'Universal AI preview edits must still enter the guarded correction path');

assert.match(preflight, /__luneaLearningCapture=true/, 'base preflight must disable the legacy confirm-click capture');
assert.match(preflight, /_luneaPendingCorrection/, 'base AI preview edits must be staged until a real draw starts');
assert.match(preflight, /commitCorrectionAfterStart/, 'base AI correction must commit after startSpread');
const baseStart = preflight.indexOf('const started=start(');
const baseCommit = preflight.indexOf('await commitCorrectionAfterStart(confirmed)');
assert.ok(baseStart >= 0 && baseCommit > baseStart, 'base AI learning commit must occur after startSpread');

assert.match(gate, /deferred_until_draw/, 'V20 preview correction must be deferred while preview is open');
assert.match(gate, /api\.record\(hit\.payload\)/, 'V20 gate must commit through the live learning API after start');
assert.match(loader, /lunea-universal-ai-opal-v20\.js[\s\S]*lunea-learning-success-gate-v1\.js/, 'V20 success gate must load after V20');

assert.match(preflight, /book\.formatForPrompt\(question,4\)/, 'AI preflight must consume the casebook bridge that includes learned corrections');
assert.match(preflight, /totalLearned/, 'AI preflight should carry cumulative learning stats');
assert.match(learning, /const MAX=1000/, 'local learning cap must be 1000');
assert.match(cloud, /const MAX=1000/, 'cloud learning cap must match local 1000');
assert.match(loader, /lunea-learning-cloud-sync-v1\.js\?v=102/, 'agreed optional private cloud sync must remain loaded');

assert.match(migration, /offset 1000/, 'release migration must raise server retention to 1000');
assert.match(migration, /spread_learning_common_candidates/, 'release migration must prepare separated common-promotion candidates');
assert.match(migration, /distinct_question_count >= 3/, 'common promotion must require at least three distinct questions');
assert.match(migration, /auto_check_passed/, 'common promotion must require automatic validation');
assert.match(migration, /user_confirmed/, 'common promotion must require user confirmation');
assert.match(migration, /pii_scrubbed/, 'common promotion must require de-identification');
assert.match(migration, /spread_learning_common_cases/, 'approved common cases must be stored separately');

console.log('spread-learning integration contract tests: PASS');
