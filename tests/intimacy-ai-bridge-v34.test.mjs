import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

const window = { LUNEA_INTIMACY_V34: {} };
window.window = window;
const document = {
  readyState: 'complete',
  documentElement: { dataset: {} },
  body: { classList: { toggle() {} } },
  querySelector() { return null; },
  addEventListener() {},
  getElementById() { return null; }
};

vm.runInNewContext(source, {
  window,
  document,
  console,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  JSON
});

const api = window.LUNEA_INTIMACY_AI_BRIDGE_V34;

test('exposes AI bridge and intimacy question detector without exam-grade false positive', () => {
  assert.ok(api, 'INTIMACY AI bridge API missing');
  assert.equal(api.version, '34.1');
  assert.equal(api.isIntimacyQuestion('둘의 속궁합과 친밀감 리듬이 궁금해'), true);
  assert.equal(api.isIntimacyQuestion('이번 시험 성적이 궁금해'), false);
});

test('AI entry uses the existing LOVE engine while preserving dedicated INTIMACY identity', () => {
  assert.match(source, /data-intimacy-ai/);
  assert.match(source, /AI 맞춤 INTIMACY 배열/);
  assert.match(source, /openSheet\('LOVE'/);
  assert.match(source, /sheetCat\.textContent = 'INTIMACY 18\+'/);
  assert.match(source, /buildPromptLayer/);
  assert.match(source, /LUNEA INTIMACY 18\\\+ INTERPRETATION LAYER/);
});

test('loader and cache workflow stamp both V34 modules in both loader paths', () => {
  assert.equal((loader.match(/lunea-intimacy-v34\.js\?v=3401/g) || []).length, 2);
  assert.equal((loader.match(/lunea-intimacy-ai-bridge-v34\.js\?v=3402/g) || []).length, 2);
  assert.match(workflow, /'lunea-intimacy-v34\.js'/);
  assert.match(workflow, /'lunea-intimacy-ai-bridge-v34\.js'/);
});

console.log('LUNEA INTIMACY AI bridge V34 tests: PASS');
