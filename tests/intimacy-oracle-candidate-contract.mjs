import assert from 'node:assert/strict';
import fs from 'node:fs';

const oracle=fs.readFileSync('lunea-intimacy-oracle-ui-v36.js','utf8');
const bridge=fs.readFileSync('lunea-intimacy-ai-bridge-v34.js','utf8');
const draft=fs.readFileSync('lunea-reading-draft-v1.js','utf8');
const cache=fs.readFileSync('lunea-cache-refresh-v1.js','utf8');
const loader=fs.readFileSync('lunea-structural-routing-v4.js','utf8');
const workflow=fs.readFileSync('.github/workflows/bump-lunea-loader-413.yml','utf8');

assert.match(oracle,/function serializeOracleDraft\(/);
assert.match(oracle,/function restoreSerializedOracle\(/);
assert.match(oracle,/restoreSerializedOracle,prepareSheetTools/);
assert.doesNotMatch(oracle,/startSpread\s*=/);
assert.doesNotMatch(oracle,/beginSession\s*\(/);

assert.match(bridge,/EXPECTED_ORACLE_VERSION = '36\.5'/);
assert.match(bridge,/SELF_BUILD/);
assert.match(bridge,/oracleRuntimeReady/);
assert.match(bridge,/restoreOracleDraft/);
assert.match(bridge,/requestFreshDocument/);
assert.doesNotMatch(bridge,/startSpread\s*=/);

assert.match(draft,/version: 2/);
assert.match(draft,/intimacyOracle: currentIntimacyOracle/);
assert.match(draft,/restoreOracleDraft/);
assert.match(draft,/luneaOracleAddExtra/);

assert.match(cache,/pageshow/);
assert.match(cache,/visibilitychange/);
assert.match(cache,/readingBusy/);
assert.match(cache,/requestFreshDocument/);

assert.equal((loader.match(/lunea-reading-draft-v1\.js\?v=[0-9a-f]{12}/g)||[]).length,2);
assert.match(workflow,/'lunea-reading-draft-v1\.js'/);

console.log('INTIMACY candidate source contract: PASS');
