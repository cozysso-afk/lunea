import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-user-spread-learning-v1.js', import.meta.url), 'utf8');
const values = new Map();
const localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};
const window = {addEventListener() {}};
window.window = window;

vm.runInNewContext(source, {
  window,
  localStorage,
  document: {readyState:'loading', addEventListener() {}, getElementById() { return null; }},
  console: {info() {}, warn() {}, error() {}},
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout() { return 0; },
  requestAnimationFrame(fn) { fn(); },
  MutationObserver: class { observe() {} },
  Date,
  Math,
  Set,
  JSON
});

const learning = window.LUNEA_SPREAD_LEARNING_V1;
assert.ok(learning, 'learning API should be exposed');
assert.equal(learning.version, 4);
assert.equal(learning.max, 500);

const scenario = learning.record({
  question:'그 사람한테 답장을 지금 할지 내일 할지 각각 반응을 보고 싶어',
  originalSpread:{spreadTitle:'기본',positions:['현재 상황','미래 결과']},
  correctedSpread:{
    spreadTitle:'답장 시점 비교',
    positions:['지금 답장했을 때의 즉각 반응','내일 답장했을 때의 즉각 반응','두 시점의 후속 흐름 차이']
  },
  meta:{primaryIntent:'한 사람에 대한 시간 시나리오 비교',targetStructure:'특정 1인 + 시간 시나리오'}
});
assert.equal(scenario.saved, true);
assert.equal(scenario.row.structureProfile.target, 'single_scenarios');

const paraphrase = learning.find('같은 상대에게 바로 답장하는 경우와 하루 뒤 답장하는 경우를 비교해줘', 3);
assert.equal(paraphrase[0]?.row.id, scenario.row.id, 'one correction should generalize to a structural paraphrase');

const pair = learning.record({
  question:'A와 B 두 사람의 현재 감정과 실제 행동 가능성을 같은 축으로 비교해줘',
  originalSpread:{spreadTitle:'기본 비교',positions:['A 마음','B 마음']},
  correctedSpread:{
    spreadTitle:'두 사람 대칭 비교',
    positions:['A의 현재 감정','A의 실제 행동 가능성','B의 현재 감정','B의 실제 행동 가능성']
  },
  meta:{primaryIntent:'두 사람 대칭 비교',targetStructure:'두 사람'}
});
assert.equal(pair.row.structureProfile.target, 'pair');

const singleScenarioMatches = learning.find('한 사람에게 카톡을 지금 보낼 때와 내일 보낼 때 반응 차이', 5);
assert.ok(singleScenarioMatches.every(x => x.row.id !== pair.row.id), 'pair correction must not leak into one-person scenarios');

const postEvent = learning.record({
  question:'면접 보고 왔는데 실제 평가와 합격 가능성을 봐줘',
  originalSpread:{spreadTitle:'면접',positions:['준비','조언']},
  correctedSpread:{spreadTitle:'면접 사후 평가',positions:['실제 평가','긍정 신호','반대 신호','결과를 가르는 변수']},
  meta:{primaryIntent:'면접 이후 평가',targetStructure:'단일 사건'}
});
assert.equal(postEvent.row.structureProfile.stage, 'after');
const scheduled = learning.find('내일 예정된 면접에서 준비할 점과 진행 흐름', 5);
assert.ok(scheduled.every(x => x.row.id !== postEvent.row.id), 'post-event correction must not leak into a scheduled event');

const unchanged = learning.record({
  question:'변경 없는 배열',
  originalSpread:{spreadTitle:'동일',positions:['하나','둘']},
  correctedSpread:{spreadTitle:'동일',positions:['하나','둘']}
});
assert.equal(unchanged.saved, false);
assert.equal(unchanged.reason, 'unchanged');

const manual = learning.recordManual({
  question:'내가 직접 짠 재회 질문 배열',
  spreadTitle:'직접 재회 구조',
  positions:['현재 감정','현실 장벽','행동 촉발 조건','재접촉 후 반복 위험'],
  symmetric:false
});
assert.equal(manual.saved, true);
assert.equal(manual.row.source, 'manual');
assert.equal(manual.row.primaryIntent, '사용자 직접 설계 배열');

const prompt = learning.formatForPrompt('답장을 바로 할지 내일 할지 반응 비교', 3);
assert.match(prompt, /사용자 교정 정답/);
assert.match(prompt, /질문 구조:/);

console.log('spread-learning tests: PASS');
