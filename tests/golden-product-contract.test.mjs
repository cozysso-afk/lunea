import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = path => fs.existsSync(new URL(`../${path}`, import.meta.url));

const expectedOrder = [
  'flipAll',
  'extraCard',
  'saveReading',
  'luneaShareReadingPng',
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

const attachmentOwners = new Map([
  ['astro-transit-v1.js','astroTransit'],
  ['astro-return-v1.js','astroReturns'],
  ['lunea-thai-tarot-bridge-v32.js','thaiTaksa'],
  ['lunea-thai-range-v33.js','thaiTaksaRange'],
  ['astro-horary-v1.js','horary'],
  ['timing-oracle-v1.js','timing'],
]);

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

test('all approved support owners register exact-reading attachment adapters', () => {
  for (const [file, name] of attachmentOwners) {
    const source = read(file);
    assert.match(source, new RegExp(`register\\('${name}'`), `${file} must register ${name}`);
    assert.match(source, new RegExp(`notifyChanged\\?\\.\\('${name}'\\)|notifyChanged\\('${name}'\\)`), `${file} must notify ${name}`);
    assert.match(source, /capture:/, `${file} must expose attachment capture`);
    if (name !== 'timing') assert.match(source, /restore:/, `${file} must expose attachment restore`);
  }
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
  assert.match(source, /captureDraft\?\.\(s\)/,
    'draft snapshot must capture exact-reading attachments');
  assert.match(source, /prepareRestore\?\.\(\)/,
    'draft restore must clear stale attachment state before restoring');
  assert.match(source, /await W\.LUNEA_READING_ATTACHMENTS_V1\?\.restoreDraft\?\.\(d\)/,
    'attachment restore must complete inside the restore transaction');
});

test('draft never arms autosave while an exact restore transaction is active', () => {
  const source = read('lunea-reading-draft-v1.js');
  const schedule = source.match(/function scheduleSave\([^)]*\) \{([\s\S]*?)\n  \}/);
  assert.ok(schedule, 'scheduleSave missing');
  assert.match(schedule[1], /saveTimer = 0/);
  assert.match(schedule[1], /if \(restoring\) return/);
  assert.match(source, /requestAnimationFrame\(async \(\) =>/);
  const awaitOracle = source.indexOf('await Promise.resolve(bridge.restoreOracleDraftExact');
  const awaitAttachments = source.indexOf('await W.LUNEA_READING_ATTACHMENTS_V1?.restoreDraft?.(d)');
  const release = source.indexOf('restoring = false;', awaitAttachments);
  assert.ok(awaitOracle > 0 && awaitAttachments > awaitOracle && release > awaitAttachments,
    'restore order must be Oracle exact restore -> attachments -> autosave release');
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

test('INTIMACY cabinet uses the approved small visible source symbol without duplicate artwork', () => {
  const source = read('lunea-intimacy-clean-v39.js');
  assert.match(source, /icon\.textContent !== '♡'/,
    'opened INTIMACY source header must keep the small shared symbol');
  assert.doesNotMatch(source, /icon\.replaceChildren\(img\)/,
    'opened source header must not be replaced by a large square artwork');
  assert.doesNotMatch(source, /lunea-v8-source-active[^\n]*> \.category-header\{\s*display:none!important;/,
    'opened INTIMACY source header must remain visible');
  assert.match(source, /\.lunea-intimacy-category \.category-header\{[\s\S]*padding:15px 16px!important;/,
    'visible source header presentation must remain owned by V39');
  assert.match(source, /classList\.toggle\('lunea-v8-source-active',\s*wasOpen\)/,
    'source active state must be derived from the actual open state and clear stale state');
});

test('loader exposes reading attachments and lazy Message group without eager Message UI', () => {
  const source = read('lunea-structural-routing-v4.js');
  assert.match(source, /lunea-reading-draft-v1\.js[\s\S]*lunea-reading-attachments-v1\.js[\s\S]*lunea-message-oracle-support-v1\.js/);
  assert.match(source, /message:\s*\[/);
  assert.match(source, /lunea-message-oracle-v1\.js/);
  assert.match(source, /lunea-message-oracle-ui-v1\.js/);
  assert.match(source, /LUNEA_LOAD_FEATURE_GROUP/);
  const writes = source.match(/document\.write\([^\n]+lunea-message-oracle-(?:v1|ui-v1)\.js/g) || [];
  assert.equal(writes.length, 0, 'Message engine/UI must remain lazy, not document.write eagerly');
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
