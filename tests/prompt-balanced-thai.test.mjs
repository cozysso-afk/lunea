import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const rangeSource = fs.readFileSync(new URL('../lunea-thai-range-v33.js', import.meta.url), 'utf8');
const loaderSource = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');

function makeElement(id = '') {
  const attributes = new Map();
  return {
    id,
    value:'',
    textContent:'',
    innerHTML:'',
    disabled:false,
    dataset:{},
    style:{},
    classList:{add() {}, remove() {}, toggle() {}},
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) || null; },
    removeAttribute(name) { attributes.delete(name); },
    addEventListener() {},
    appendChild(node) { return node; },
    insertAdjacentElement(_position, node) { return node; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    remove() {},
  };
}

function createRangeVm(responseData) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  };
  const fetchCalls = [];
  const basePrompt = () => '[질문 원문]\n"연락이 올까?"\n\n[뽑힌 카드]\n1. [현재] Two of Pentacles';
  const window = {
    state:{question:'연락이 올까?'},
    promptString:basePrompt,
  };
  window.window = window;

  const context = vm.createContext({
    window,
    document:{
      readyState:'complete',
      head:makeElement('head'),
      body:makeElement('body'),
      getElementById:id => element(id),
      createElement:() => makeElement(),
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
    },
    localStorage:{
      getItem(key) {
        if (key === 'LUNEA_ASTRO_NATAL_V3') return JSON.stringify({birth_date:'1990-01-01'});
        if (key === 'LUNEA_ASTRO_API_URL') return 'https://astro.example';
        return null;
      },
    },
    fetch:async (url, options) => {
      fetchCalls.push({url, options});
      return {ok:true, json:async () => responseData};
    },
    MutationObserver:class { observe() {} },
    alert() {},
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout() { return 1; },
    requestAnimationFrame() {},
    console,
    promptString:basePrompt,
  });

  vm.runInContext(rangeSource, context, {filename:'lunea-thai-range-v33.js'});
  element('luneaThaiTarotRangeStart').value = '2026-10-01';
  element('luneaThaiTarotRangeEnd').value = '2026-10-30';
  return {context, element, fetchCalls};
}

const completeResponse = {
  schema:'thai-taksa-range-v1',
  start_date:'2026-10-01',
  end_date:'2026-10-30',
  days:30,
  summary:{
    supportive_segments:2,
    neutral_segments:24,
    caution_segments:4,
    focus_match_segments:1,
    supportive_dates:['2026-10-02'],
    caution_dates:['2026-10-03'],
    focus_match_dates:['2026-10-02'],
  },
  calendar:[
    {date:'2026-10-01', daytime:{ruler:{ko:'태양'}, position_ko:'중립', tone:{key:'neutral'}, focus_match:false}},
    {date:'2026-10-02', daytime:{ruler:{ko:'금성'}, position_ko:'Sri', tone:{key:'supportive'}, focus_match:true}},
    {date:'2026-10-03', daytime:{ruler:{ko:'토성'}, position_ko:'Kalakini', tone:{key:'caution'}, focus_match:false}},
  ],
};

// Execute the actual V33 range request and its promptString wrapper. This
// verifies that the compacted period rows retain their neutral denominator.
const current = createRangeVm(completeResponse);
await current.context.window.LUNEA_THAI_RANGE_V33.runTarot();
const prompt = current.context.promptString();
assert.match(prompt, /\[질문 원문\]/, 'V33 must preserve the existing RWS prompt');
assert.match(prompt, /- 중립 세그먼트: 24/);
assert.match(prompt, /- 지원\/중립\/주의 분류 세그먼트 전체: 30/);
assert.match(prompt, /지원·주의 또는 질문 초점 행을 우선 전달한 압축본/);
assert.match(prompt, /개별 지원·주의 행을 기간 전체의 지배적 흐름으로 확대하지 않는다/);
assert.match(prompt, /2026-10-02 낮: 금성→Sri\(지원, 질문초점\)/);
assert.match(prompt, /2026-10-03 낮: 토성→Kalakini\(주의\)/);
assert.doesNotMatch(prompt, /2026-10-01 낮:/, 'neutral rows may be compressed only when their context remains explicit');
assert.equal(current.fetchCalls.length, 1, 'period calculation remains one explicit user action');
assert.equal(current.fetchCalls[0].url, 'https://astro.example/v1/thai/taksa/range');
assert.deepEqual(JSON.parse(current.fetchCalls[0].options.body), {
  natal:{birth_date:'1990-01-01'},
  topic:'연락',
  start_iso:'2026-10-01',
  days:30,
  timezone:'Asia/Seoul',
}, 'prompt balance work must not change the range API payload');

// Older cached/API responses can lack neutral_segments. They must still build
// a prompt, preserve the base prompt, and never silently turn missing into zero.
const legacyResponse = {
  ...completeResponse,
  summary:{
    supportive_segments:1,
    caution_segments:2,
    focus_match_segments:0,
    supportive_dates:['2026-10-02'],
    caution_dates:['2026-10-03'],
    focus_match_dates:[],
  },
};
const legacy = createRangeVm(legacyResponse);
await legacy.context.window.LUNEA_THAI_RANGE_V33.runTarot();
const legacyPrompt = legacy.context.promptString();
assert.match(legacyPrompt, /\[질문 원문\]/, 'older range responses keep the original prompt wrapper behavior');
assert.match(legacyPrompt, /- 지원 세그먼트: 1/);
assert.match(legacyPrompt, /- 중립 세그먼트: 응답에 없음/);
assert.match(legacyPrompt, /- 지원\/중립\/주의 분류 세그먼트 전체: 응답에 없음/);
assert.match(legacyPrompt, /중립\/전체 수가 '응답에 없음'이면 0으로 가정하지 않는다/);
assert.doesNotMatch(legacyPrompt, /undefined|null/);

for (const [instance, neutral] of [[legacy, null], [current, 24]]) {
  const adapter = instance.context.window.__LUNEA_READING_ATTACHMENT_QUEUE_V1.find(item => item.name === 'thaiTaksaRange').adapter;
  const snapshot = JSON.parse(JSON.stringify(adapter.capture()));
  assert.equal(snapshot.result.summary.neutral_segments, neutral, 'JSON snapshot preserves absent versus numeric count');
  adapter.clear();
  assert.equal(adapter.restore(snapshot), true);
  const restoredPrompt = instance.context.promptString();
  assert.match(restoredPrompt, neutral === null ? /- 중립 세그먼트: 응답에 없음/ : /- 중립 세그먼트: 24/);
  if (neutral === null) assert.match(restoredPrompt, /- 지원\/중립\/주의 분류 세그먼트 전체: 응답에 없음/);
}

// V33 is the live prompt bridge: it loads after the Thai bridge and before the
// final RWS-priority wrapper on both parser and sequential loader paths.
const bridgeToken = 'lunea-thai-tarot-bridge-v32.js?v=';
const rangeToken = 'lunea-thai-range-v33.js?v=';
const finalToken = 'lunea-final-prompt-priority-v1.js?v=';
assert.equal((loaderSource.match(/lunea-thai-range-v33\.js\?v=[^"']+/g) || []).length, 2);
for (let offset = 0; offset < loaderSource.length;) {
  const bridgeIndex = loaderSource.indexOf(bridgeToken, offset);
  if (bridgeIndex < 0) break;
  const rangeIndex = loaderSource.indexOf(rangeToken, bridgeIndex + 1);
  const finalIndex = loaderSource.indexOf(finalToken, rangeIndex + 1);
  assert.ok(bridgeIndex < rangeIndex && rangeIndex < finalIndex, 'Thai period balance context must remain inside the final RWS policy');
  offset = finalIndex + 1;
}

console.log('Thai period prompt balance VM regression: PASS');
