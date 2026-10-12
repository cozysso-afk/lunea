import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import vm from 'node:vm';

const finalFile = 'lunea-final-prompt-priority-v1.js';
const spreadFile = 'lunea-fixed-spread-depth-v30.js';
const finalSource = fs.readFileSync(finalFile, 'utf8');
const spreadSource = fs.readFileSync(spreadFile, 'utf8');
const MARKER = '[FINAL READING PRIORITY · 최종 근거 우선순위]';
const quietConsole = {info() {}, warn() {}};

for (const file of [finalFile, spreadFile]) {
  execFileSync(process.execPath, ['--check', file], {stdio: 'pipe'});
}

function createFinalRuntime(cards) {
  const window = {
    addEventListener() {},
  };
  window.window = window;
  const basePrompt = () => `[질문 원문]\n"상대와의 관계 흐름을 어떻게 읽어야 할까?"\n\n[질문 유형]\nlove\n\n[뽑힌 카드]\n${cards}`;
  const context = vm.createContext({
    window,
    document: {readyState: 'loading'},
    console: quietConsole,
    String,
    RegExp,
    Object,
    Array,
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout() { return 1; },
    promptString: basePrompt,
  });
  window.promptString = basePrompt;
  vm.runInContext(finalSource, context, {filename: finalFile});

  const api = window.LUNEA_FINAL_PROMPT_PRIORITY_V1;
  assert.ok(api, 'final priority API must install in the active VM runtime');
  assert.equal(context.promptString, window.promptString, 'bare and window prompt bindings must stay synchronized');

  // Simulate a late wrapper, then require the final policy to recapture it.
  const beforeLateWrapper = context.promptString;
  const lateWrapper = () => `${beforeLateWrapper()}\n\n[LATE RELATION CONTEXT] 관찰 신호를 우선한다.`;
  context.promptString = lateWrapper;
  window.promptString = lateWrapper;
  assert.equal(api.ensure(), true, 'final policy must recapture a late prompt wrapper');

  return context.promptString();
}

const evidenceFixtures = [
  {
    name: 'positive',
    cards: '1. [현재] Two of Cups (upright)\n2. [흐름] Ace of Cups (upright)',
  },
  {
    name: 'negative',
    cards: '1. [현재] Five of Pentacles (upright)\n2. [흐름] Eight of Cups (upright)',
  },
  {
    name: 'mixed',
    cards: '1. [지지] The Star (upright)\n2. [제한] Two of Swords (upright)',
  },
];

for (const fixture of evidenceFixtures) {
  const assembled = createFinalRuntime(fixture.cards);
  assert.ok(assembled.includes(fixture.cards), `${fixture.name} RWS evidence must be preserved through active assembly`);
  assert.equal(assembled.split(MARKER).length - 1, 1, `${fixture.name} assembly must retain exactly one final policy block`);
  assert.ok(assembled.lastIndexOf(MARKER) > assembled.indexOf('[LATE RELATION CONTEXT]'), `${fixture.name} final wrapper must remain last after late wrapping`);
  assert.match(assembled, /긍정과 부정 어느 방향도 기본값으로 삼지 않는다/, `${fixture.name} must retain evidence-proportional direction`);
  assert.match(assembled, /긍정 근거가 더 강하면 긍정 결론을, 부정 근거가 더 강하면 부정 결론/, `${fixture.name} must retain non-mechanical positive\/negative handling`);
  assert.match(assembled, /혼합 신호는 혼합으로 말한다/, `${fixture.name} must retain mixed-evidence handling`);
  assert.match(assembled, /타인의 내면은 카드상 가설로만 표현하고, 확인된 관찰·표현·행동과 구분한다/, `${fixture.name} must separate inner-state hypotheses from observations`);
  assert.match(assembled, /가장 강한 경쟁 해석은 실제 RWS 근거가 있을 때만 검토/, `${fixture.name} must not invent a competing interpretation`);
  assert.match(assembled, /반증이나 50:50 균형을 위해 없는 대안을 생성하지 않는다/, `${fixture.name} must not force false balance`);
  assert.match(assembled, /보조 체계 전체 분량은 최종 해석 본문의 최대 20% 이하/, `${fixture.name} must retain the auxiliary cap`);
}

function fixedSpreadRuntime() {
  const window = {};
  window.window = window;
  const legacyFixedPositions = (title, count) => [`legacy:${title}:${count}`];
  const context = vm.createContext({
    window,
    document: {
      readyState: 'complete',
      querySelectorAll() { return []; },
    },
    console: quietConsole,
    String,
    Object,
    Array,
    setTimeout() { return 1; },
    fixedPositions: legacyFixedPositions,
  });
  vm.runInContext(spreadSource, context, {filename: spreadFile});
  return context;
}

const spreadContext = fixedSpreadRuntime();
const spreadApi = spreadContext.window.LUNEA_FIXED_SPREAD_DEPTH_V30;
assert.ok(spreadApi, 'fixed spread runtime API must install');
const relationshipPositions = spreadContext.fixedPositions('상대 속마음', 7);
assert.equal(relationshipPositions.length, 7, 'relationship preset must keep its seven-card structure');
assert.match(relationshipPositions[0], /카드상.*가설과 관찰할 신호/, 'relationship recognition must be framed as a hypothesis and observation');
assert.match(relationshipPositions[2], /카드상 추정되는 비공개 요인 또는 판단 보류/, 'hidden-state position must allow an unconfirmed factor or suspended judgment');
assert.match(relationshipPositions[3], /호감·매력·정서적 끌림 또는 무관심·판단 보류/, 'attraction must not be assumed as an existing fact');
assert.doesNotMatch(relationshipPositions.join('\n'), /숨기는 무의식적 감정/, 'legacy assumed hidden unconscious emotion wording must be absent');
assert.deepEqual([...spreadContext.fixedPositions('unknown preset', 3)], ['legacy:unknown preset:3'], 'unknown presets must continue to delegate to the legacy implementation');

console.log('Balanced common relationship prompt VM contract: PASS');
