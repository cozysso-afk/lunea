import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {execFileSync} from 'node:child_process';

const sourcePath = new URL('../lunea-lenormand-v1.js', import.meta.url);
const loaderPath = new URL('../lunea-cache-refresh-v1.js', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const loader = fs.readFileSync(loaderPath, 'utf8');

function makeElement() {
  return {
    value: '', textContent: '', className: '', innerHTML: '', disabled: false,
    dataset: {},
    classList: {add(){}, remove(){}, toggle(){}},
  };
}

test('Lenormand direct prompt compares real structural limits and keeps inference, safety, and request boundaries', async () => {
  execFileSync(process.execPath, ['--check', sourcePath.pathname], {stdio: 'pipe'});
  assert.match(loader, /function loadLenormandV1\(\).*lunea-lenormand-v1\.js/s, 'the active loader must own the tested core');
  assert.match(loader, /loadLenormandV1\(\);\s*\n\s*loadLenormandPolishV1\(\);/, 'core must load before Lenormand polish');

  const elements = new Map(['lnQuestion', 'lnStatus', 'lnCards', 'lnStructure', 'lnAIText', 'lnBoard', 'lnAI'].map(id => [id, makeElement()]));
  let seed = 0x12345678;
  const crypto = {
    getRandomValues(array) {
      for (let i = 0; i < array.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        array[i] = seed;
      }
      return array;
    }
  };
  const requests = [];
  const fetch = async (url, options) => {
    requests.push({url, options});
    return {
      ok: true,
      status: 200,
      async json() {
        return {candidates: [{content: {parts: [{text: '모의 해석'}]}}]};
      }
    };
  };
  const document = {
    readyState: 'loading',
    addEventListener(){},
    getElementById(id) { return elements.get(id) || null; },
    querySelector(){ return null; },
    querySelectorAll(){ return []; },
  };
  const localStorage = {
    getItem(key) {
      return key === 'LUNEA_API_KEY' ? 'test-key' : null;
    }
  };
  const window = {addEventListener(){}};
  window.window = window;
  const instrumented = source.replace(
    '  W.LUNEA_LENORMAND_V1 = Object.freeze({',
    '  W.__LUNEA_LENORMAND_TEST__ = {runDraw, runAI, setReading:(question,cards)=>{state.question=question;state.count=cards.length;state.cards=cards;state.structure=analyze(cards);state.ai=\'\';}};\n\n  W.LUNEA_LENORMAND_V1 = Object.freeze({'
  );
  assert.notEqual(instrumented, source, 'the VM hook must be installed only in the in-memory source copy');
  const context = vm.createContext({
    window, document, localStorage, fetch, crypto, console, Math, Date, JSON,
    Uint8Array, Uint32Array, Number, Object, String, Array, RangeError,
  });
  vm.runInContext(instrumented, context, {filename: 'lunea-lenormand-v1.js'});

  const api = window.LUNEA_LENORMAND_V1;
  const runtime = window.__LUNEA_LENORMAND_TEST__;
  assert.ok(api && runtime, 'the direct core API and only in-memory test hook must initialize');
  elements.get('lnQuestion').value = '상대가 내 동의 없이 행동할까요? 지금 위험한 상황인가요?';
  runtime.runDraw();

  const snapshot = api.snapshot();
  assert.equal(snapshot.cards.length, 5, 'the actual draw path must still create the default five-card structure');
  assert.equal(new Set(snapshot.cards).size, 5, 'the prompt must use a draw without replacement');
  runtime.setReading(elements.get('lnQuestion').value, api.cards.slice(0, 9));
  const prompt = api.buildPrompt();
  assert.equal(api.snapshot().cards.length, 9, 'the prompt must preserve a supplied nine-card reading rather than alter extraction');
  assert.match(prompt, /\[LENORMAND STRUCTURE V1\]/);
  assert.match(prompt, /\[인접 조합\]/);
  assert.match(prompt, /\[미러링\]/);
  assert.match(prompt, /\[행\]/);
  assert.match(prompt, /\[열\]/);
  assert.match(prompt, /\[대각선\]/);
  assert.match(prompt, /인접 카드 조합이 단일 카드 사전 의미보다 우선한다/);
  assert.match(prompt, /중심 카드가 질문의 핵심 축이다/);
  assert.match(prompt, /9장 박스는 가운데 행·가운데 열을 우선하고, 나머지 행·열·대각선은 보조 근거로 사용한다/);
  assert.match(prompt, /Man\/Woman은 실제 성별을 멋대로 단정하지 말고 질문 맥락의 인물 표지로 사용한다/);
  assert.match(prompt, /결론을 쓰기 전에 핵심 조합과 같은 구조 우선순위로 그 결론을 제한하거나 반증할 수 있는 실제 카드·구조 단서를 찾고/);
  assert.match(prompt, /실제 반대·제한 단서가 없으면 '구조상 뚜렷한 반대 단서는 약함'이라고만 말하며, 균형을 위해 반대 서사를 창작하지 않는다/);
  assert.match(prompt, /긍정과 부정을 기계적으로 평균 내거나 50:50으로 맞추지 말고/);
  assert.match(prompt, /다른 사람의 비공개 내면·의도·동의·위험 여부를 확인된 사실로 단정하지 않는다/);
  assert.match(prompt, /카드상 추정과 관찰 가능한 행동, 사용자의 선택·경계를 구분한다/);
  assert.match(prompt, /질문이 폭력·강압·자해 또는 즉시 위험을 명시할 때에만/);
  assert.match(prompt, /그런 문맥이 없으면 이 안전 문구를 일반 조언으로 덧붙이지 않는다/);
  assert.match(prompt, /### 반대·제한 근거 점검/);
  assert.match(prompt, /실제 인접·중심·미러링.*근거가 있으면 인용하고 영향까지 설명/);
  assert.match(prompt, /타인의 속마음·의도·동의는 확인된 사실이 아니라 카드상 추정으로 구분한다/);

  await runtime.runAI();
  assert.equal(requests.length, 1, 'the VM test must capture one mocked request rather than call an external LLM');
  const request = requests[0];
  assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=test-key');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  const body = JSON.parse(request.options.body);
  assert.equal(body.contents[0].parts[0].text, prompt, 'runAI must send buildPrompt output unchanged on the active direct path');
  assert.deepEqual(body.generationConfig, {temperature: 0.72, topP: 0.92}, 'prompt work must not change model sampling settings');
  assert.equal(api.snapshot().ai, '모의 해석');
});
