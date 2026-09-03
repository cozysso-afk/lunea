import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-depth-v42.js', import.meta.url), 'utf8');
const window = {};
window.window = window;
const document = {
  readyState: 'loading',
  addEventListener() {},
  body: { classList: { contains() { return false; } } },
};

vm.runInNewContext(source, {
  window,
  document,
  console,
  Object,
  Array,
  String,
  RegExp,
  Set,
  Map,
  JSON,
  setInterval() { return 0; },
  clearInterval() {},
});

const api = window.LUNEA_INTIMACY_DEPTH_V42;

test('exposes stable intimacy taxonomy', () => {
  assert.ok(api);
  assert.equal(api.version, '42.0');
  assert.equal(api.classify('우리는 성적으로 잘 맞을까?', ''), 'physical_compatibility');
  assert.equal(api.classify('상대는 나에게 신체적으로 끌리는 걸까?', ''), 'attraction');
  assert.equal(api.classify('상대는 어떤 방식의 친밀감을 원할까?', ''), 'desire_style');
  assert.equal(api.classify('둘의 리듬과 경계는 어디서 어긋나?', ''), 'rhythm_boundary');
  assert.equal(api.classify('이 텐션이 실제 행동으로 이어질까?', ''), 'tension_action');
  assert.equal(api.classify('관계 후 상대에게 애착이나 여운이 남을까?', ''), 'attachment_afterglow');
  assert.equal(api.classify('다시 만나면 친밀감은 예전과 달라질까?', '재회 후 친밀감'), 'reunion_intimacy');
  assert.equal(api.classify('A와 B 중 누구와 속궁합이 더 자연스럽게 맞아?', ''), 'comparison');
});

test('physical compatibility directive keeps distinct evidence layers separate', () => {
  const d = api.directive('physical_compatibility', '우리는 성적으로 잘 맞을까?', '신체적 속궁합 · CORE 5');
  assert.match(d, /끌림·욕구/);
  assert.match(d, /compatibility\(맞음\)/);
  assert.match(d, /satisfaction\(만족\)/);
  assert.match(d, /attachment\(애착\)/);
  assert.match(d, /강한 끌림이나 집착을 좋은 속궁합으로 환산하지 않는다/);
  assert.match(d, /최소 5층으로 읽는다/);
  assert.match(d, /장기 지속성은 별도 카드 점수로 날조하지 않는다/);
});

test('comparison directive requires symmetric evidence', () => {
  const d = api.directive('comparison', 'A와 B 중 누구와 더 잘 맞아?', 'A/B 친밀감 비교');
  assert.match(d, /동일한 기준으로 대칭 비교/);
  assert.match(d, /끌림 \/ 리듬·방식 \/ 안전·경계 \/ 만족 \/ 여운·지속 조건/);
});
