import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const manual = read('lunea-manual-structure-v1.js');
const manual20 = read('lunea-manual-limit20-v17.js');
const universal = read('lunea-universal-ai-opal-v20.js');
const preflight = read('lunea-ai-spread-preflight-v2.js');
const learning = read('lunea-user-spread-learning-v1.js');

assert.match(manual, /LUNEA_SPREAD_LEARNING_V1\?\.recordManual/, 'base manual spread must feed learning memory');
assert.match(manual20, /LUNEA_SPREAD_LEARNING_V1\?\.recordManual/, '20-card manual spread must feed learning memory');
assert.match(universal, /LUNEA_SPREAD_LEARNING_V1\?\.record/, 'Universal AI preview edits must feed correction learning');
assert.match(learning, /luneaSpreadPreviewConfirm/, 'base AI preview edits must be captured by learning module');
assert.match(preflight, /book\.formatForPrompt\(question,4\)/, 'AI preflight must consume the casebook bridge that includes learned corrections');
assert.match(preflight, /totalLearned/, 'AI preflight should carry cumulative learning stats');

console.log('spread-learning integration contract tests: PASS');
