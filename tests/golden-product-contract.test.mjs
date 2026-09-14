import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = path => fs.existsSync(new URL(`../${path}`, import.meta.url));

const expectedOrder = [
  'flipAll',
  'extraCard',
  'saveReading',
  'retry',
  'timingSupportBtn',
  'luneaMessageOracleSupportBtn',
  'astroTransitBtn',
  'astroReturnBtn',
  'astroHoraryBtn',
  'thaiTaksaBtn',
  'luneaThaiTarotRangeBtn',
  'aiRead',
  'luneaTopCopyPrompt',
];

const requiredFiles = [
  'lunea-reading-attachments-v1.js',
  'lunea-message-oracle-v1.js',
  'lunea-message-oracle-ui-v1.js',
  'lunea-message-oracle-support-v1.js',
  'assets/message-oracle/message_oracle_back.jpeg',
  'assets/message-oracle/message_oracle_back_mask.png',
  'assets/message-oracle/message_oracle_front_frame.jpeg',
  'assets/message-oracle/message_oracle_front_mask.png',
  'assets/message-oracle/message_oracle_logo.png',
];

test('approved support sources and original Message Oracle assets exist', () => {
  const missing = requiredFiles.filter(path => !exists(path));
  assert.deepEqual(missing, [], `missing golden product files: ${missing.join(', ')}`);
});

test('reading action grid preserves the approved final order', () => {
  const source = read('lunea-reading-action-order-v33.js');
  const block = source.match(/const ORDER = \[([\s\S]*?)\];/);
  assert.ok(block, 'ORDER contract is missing');
  const actual = [...block[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(actual, expectedOrder);
  assert.match(source, /rank\.set\('luneaThaiTarotBridgeBtn',\s*rank\.get\('thaiTaksaBtn'\)\)/,
    'legacy Thai support button must share the approved Thai support rank');
});

test('exact-reading attachment registry owns support persistence', () => {
  assert.ok(exists('lunea-reading-attachments-v1.js'), 'reading attachment registry missing');
  const source = read('lunea-reading-attachments-v1.js');
  assert.match(source, /function readingSignature\(/);
  assert.match(source, /function captureDraft\(/);
  assert.match(source, /async function restoreDraft\(/);
  assert.match(source, /function captureArchive\(/);
  assert.match(source, /messageOracle/);
  assert.match(source, /notifyChanged/);
});

test('Message Oracle support is exact-reading scoped and prompt-aware', () => {
  assert.ok(exists('lunea-message-oracle-support-v1.js'), 'Message Oracle support adapter missing');
  const source = read('lunea-message-oracle-support-v1.js');
  assert.match(source, /readingSignature/);
  assert.match(source, /registry\.register\('messageOracle'/);
  assert.match(source, /registry\.notifyChanged\('messageOracle'\)/);
  assert.match(source, /\[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조\]/);
  assert.match(source, /active\.signature/);
});

test('draft combines current INTIMACY exact restore with reading attachments', () => {
  const source = read('lunea-reading-draft-v1.js');
  assert.match(source, /intimacyOracleFallback/);
  assert.match(source, /oracleRestoreGeneration/);
  assert.match(source, /restoreOracleDraftExact/);
  assert.match(source, /intimacyOracle:/);
  assert.match(source, /LUNEA_READING_ATTACHMENTS_V1/,
    'current v2 draft must also integrate the exact-reading attachment owner');
  assert.match(source, /captureDraft/,
    'draft snapshot must capture exact-reading attachments');
  assert.match(source, /prepareRestore/,
    'draft restore must clear stale attachment state before restoring');
});

test('final prompt explicitly handles exact-current Message Oracle evidence', () => {
  const source = read('lunea-final-prompt-priority-v1.js');
  assert.match(source, /MESSAGE ORACLE · 현재 리딩의 연락·소식 보조/);
  assert.match(source, /Message Oracle\(연락·소식 메시지 오라클\)/);
  assert.match(source, /LUNEA_MESSAGE_ORACLE_SUPPORT_V1/);
});

test('INTIMACY Oracle keeps base 0\/1\/3, supplemental max 3 and exact restore', () => {
  const source = read('lunea-intimacy-oracle-ui-v36.js');
  assert.match(source, /MAX_EXTRA=3/);
  assert.match(source, /\[0,1,3\]/);
  assert.match(source, /drawSupplementalOracleCard/);
  assert.match(source, /excludedCodes/);
  assert.match(source, /restoreSerializedOracle/);
  assert.match(source, /serializeOracleDraft/);
});

test('INTIMACY cabinet uses the approved small source symbol and duplicate-header guard', () => {
  const source = read('lunea-intimacy-clean-v39.js');
  assert.match(source, /icon\.textContent !== '♡'/,
    'opened INTIMACY source header must keep the small shared symbol');
  assert.doesNotMatch(source, /icon\.replaceChildren\(img\)/,
    'opened source header must not be replaced by a large square artwork');
  assert.match(source, /lunea-v8-source-active[^\n]*> \.category-header|lunea-v8-source-active > \.category-header/,
    'visible Home-backed source must suppress the duplicate source header');
  assert.match(source, /classList\.toggle\('lunea-v8-source-active',\s*wasOpen\)|if \(wasOpen\) category\.classList\.add\('lunea-v8-source-active'\)/,
    'source active state must be derived from the actual open state');
});

test('deterministic loader exposes reading attachments and lazy Message group', () => {
  const source = read('lunea-structural-routing-v4.js');
  assert.match(source, /lunea-reading-attachments-v1\.js/);
  assert.match(source, /lunea-message-oracle-support-v1\.js/);
  assert.match(source, /message:\s*\[/);
  assert.match(source, /lunea-message-oracle-v1\.js/);
  assert.match(source, /lunea-message-oracle-ui-v1\.js/);
  assert.match(source, /LUNEA_LOAD_FEATURE_GROUP/);
});

test('same-build refresh and INTIMACY exact-runtime safeguards remain fixed', () => {
  const cache = read('lunea-cache-refresh-v1.js');
  const bridge = read('lunea-intimacy-ai-bridge-v34.js');
  assert.match(cache, /embedded && embedded !== remote/);
  assert.doesNotMatch(cache, /embedded !== remote \|\| forceRefresh/);
  assert.match(bridge, /restoreOracleDraftExact/);
  assert.match(bridge, /typeof ui\?\.serializeOracleDraft==='function'/);
  assert.match(bridge, /typeof ui\?\.restoreSerializedOracle==='function'/);
});
