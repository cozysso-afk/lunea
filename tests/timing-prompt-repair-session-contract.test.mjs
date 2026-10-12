import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const repairSource = read('lunea-timing-prompt-repair-v1.js');
const core = read('timing-oracle-v1.js');
const inlineV16 = read('lunea-timing-ab-inline-v16.js');
const index = read('index.html');

function textNode(textContent = '') {
  return {textContent};
}

function singleInline({question, session, label = '오늘 밤', meaning = '현재 날짜의 저녁부터 자정 전후까지'} = {}) {
  return {
    isConnected: true,
    dataset: {luneaTimingQuestion: question, luneaReadingSessionId: session},
    querySelector(selector) {
      if (selector === 'b') return textNode(label);
      if (selector === 'span') return textNode(meaning);
      return null;
    }
  };
}

function abInline({question, session} = {}) {
  const card = (label, english, meaning) => ({
    querySelector(selector) {
      if (selector === '.lunea-tabi-ko') return textNode(label);
      if (selector === '.lunea-tabi-en') return textNode(english);
      if (selector === '.lunea-tabi-meaning') return textNode(meaning);
      return null;
    }
  });
  return {
    isConnected: true,
    dataset: {luneaTimingQuestion: question, luneaReadingSessionId: session},
    querySelectorAll(selector) {
      return selector === '.lunea-tabi-card'
        ? [card('오늘 밤', 'Tonight', '현재 날짜의 저녁부터 자정 전후까지'), card('2~3일 안', 'Within 2–3 Days', '지금부터 약 2~3일 범위')]
        : [];
    }
  };
}

const nodes = new Map();
const state = {question: '  내일  연락이  올까?  '};
let sessionId = 'reading-42';
const document = {
  readyState: 'loading',
  getElementById(id) { return nodes.get(id) || null; }
};
const window = {
  LUNEA_READING_LIFECYCLE_V59: {currentSessionId: () => sessionId},
  addEventListener() {}
};
window.window = window;

vm.runInNewContext(repairSource, {window, document, state, console, String, Object, Array});
const api = window.LUNEA_TIMING_PROMPT_REPAIR_V1;
assert.equal(api?.version, 1, 'Prompt Repair public API must load in the VM');

const basePrompt = '[질문 원문]\n"내일 연락이 올까?"\n\n[뽑힌 카드]\n1. The Star';
nodes.set('luneaTimingInline', singleInline({question: '내일 연락이 올까?', session: 'reading-42'}));
let repaired = api.repair(basePrompt);
assert.match(repaired, /현재 리딩에 실제 생성된 시기 카드: 오늘 밤/, 'normalized matching question and session may recover the current single card');
assert.match(repaired, /사건 성립을 보장하지 않으며, 성립한다면 해당 시간 창으로만 읽는다/, 'single recovery must preserve the conditional-window policy');

state.question = '완전히 다른 질문은 언제 풀릴까?';
assert.equal(api.repair(basePrompt), basePrompt, 'a stale single-card DOM node must not cross a question boundary');

state.question = '내일 연락이 올까?';
sessionId = 'reading-43';
assert.equal(api.repair(basePrompt), basePrompt, 'a stale single-card DOM node must not cross a lifecycle-session boundary');

sessionId = 'reading-42';
nodes.get('luneaTimingInline').dataset.luneaReadingSessionId = '';
assert.equal(api.repair(basePrompt), basePrompt, 'missing session IDs must fail closed rather than recover DOM');

nodes.delete('luneaTimingInline');
nodes.set('luneaTimingABInline', abInline({question: '내일 연락이 올까?', session: 'reading-42'}));
repaired = api.repair(basePrompt);
assert.match(repaired, /LUNEA TIMING ORACLE A\/B/, 'only a V16-stamped current A\/B mirror may recover an A\/B block');
assert.match(repaired, /각 사건이 성립한다면 그 창으로만 읽는다/, 'A\/B recovery must preserve the conditional-window policy');

nodes.get('luneaTimingABInline').dataset.luneaTimingQuestion = '이전 질문';
assert.equal(api.repair(basePrompt), basePrompt, 'a stale A\/B mirror must not cross a question boundary');

assert.match(core, /첫 문장은 반드시 "이 카드는 사건 성립을 보장하지 않으며, 성립한다면 이 시간 창으로 읽힌다"/, 'standalone timing prompt must lead with a conditional time window');
assert.match(core, /사건 성립을 보장하지 않으며, 성립한다면 이 시기 창으로 봐/, 'main single Timing UI must visibly separate event certainty from its time window');
assert.match(inlineV16, /luneaTimingQuestion/, 'main A\/B mirror must stamp its source question for session-safe repair');
assert.match(inlineV16, /luneaReadingSessionId/, 'main A\/B mirror must stamp its lifecycle session for session-safe repair');
assert.match(inlineV16, /각 시간 창은 사건 발생을 보장하지 않아/, 'main A\/B UI must visibly separate event certainty from its time windows');
const timingFallback = index.match(/timing:\{trigger:\[(.*?)\],timeline:\[(.*?)\]\}/s)?.[0] || '';
assert.ok(timingFallback, 'timing fallback positions must remain available');
assert.doesNotMatch(timingFallback, /상대가|당신의|연락 욕구|연락 직전/, 'timing fallback must not invent a fixed relationship actor');
assert.match(core, /delay: \{cards:delay, weight:20\}/, 'single-card delay weighting must remain 20');

console.log('Timing Prompt Repair same-question/same-session VM regression tests: PASS');
