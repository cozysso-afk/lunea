import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const intimacySource = read('lunea-intimacy-v34.js');
const bridgeSource = read('lunea-intimacy-ai-bridge-v34.js');
const finalSource = read('lunea-final-prompt-priority-v1.js');

function loadIntimacyApi() {
  const window = {};
  window.window = window;
  vm.runInNewContext(intimacySource, {
    window, console, Object, Array, String, Number, Boolean, Map, Set, RegExp, JSON
  });
  return window.LUNEA_INTIMACY_V34;
}

test('VM: V34 sends direction-matched textual evidence, not invariant numeric axes', () => {
  const api = loadIntimacyApi();
  const prompt = api.buildPromptLayer([
    { code: 'Devil', isReversed: false, position: '현재 끌림' },
    { code: 'Temperance', isReversed: true, position: '조율 가능성' }
  ], 'AI 맞춤 INTIMACY 배열', '성인 관계의 친밀감');

  assert.match(prompt, /Devil \/ upright \/ position: 현재 끌림/);
  assert.match(prompt, /정방향 core의 주근거: 강렬한 육체적 끌림/);
  assert.match(prompt, /제한·반증으로 함께 검토할 shadow: 집착·소유·권력 불균형/);
  assert.match(prompt, /Temperance \/ reversed \/ position: 조율 가능성/);
  assert.match(prompt, /역방향 shadow의 주근거: 지나친 양보/);
  assert.match(prompt, /유지·회복 가능성 또는 대안으로 검토할 core: 서로 다른 욕구와 템포/);
  assert.doesNotMatch(prompt, /focus axes:|focus risks:|attraction:2|obsession:3/);
  assert.match(prompt, /축을 기계적으로 반전하거나 긍정\/제한 문장을 50:50으로 맞추지 않는다/);
  assert.match(prompt, /상대 관련 포지션은 카드상 가설로만 쓰고/);
});

test('VM: late dynamic Oracle wrapper is followed by one outer Final Priority wrapper', async () => {
  const window = {
    __LUNEA_READING_ACTION_ORDER_V33__: true,
    addEventListener() {},
  };
  window.window = window;

  const listeners = new Map();
  const document = {
    readyState: 'complete',
    currentScript: { src: 'https://example.test/lunea-intimacy-ai-bridge-v34.js?v=vm' },
    documentElement: { dataset: {} },
    body: { classList: { toggle() {}, contains() { return false; } } },
    scripts: [],
    addEventListener() {},
    querySelector() { return null; },
    getElementById() { return null; },
    createElement(tag) {
      assert.equal(tag, 'script');
      const handlers = new Map();
      return {
        dataset: {},
        addEventListener(type, handler) { handlers.set(type, handler); },
        emit(type) { handlers.get(type)?.(); }
      };
    }
  };
  const context = {
    window,
    document,
    location: { href: 'https://example.test/index.html' },
    URL,
    console,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    Promise,
    Map,
    Set,
    queueMicrotask,
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout() { return 1; },
    promptString: () => '[BASE PROMPT]'
  };

  document.head = {
    appendChild(script) {
      document.scripts.push(script);
      queueMicrotask(() => {
        if (String(script.src).includes('lunea-intimacy-oracle-ui-v36.js')) {
          const prior = context.promptString;
          const oracleWrapper = function oracleLateWrapper() {
            return `${prior()}\n[ORACLE LATE LAYER]`;
          };
          oracleWrapper.__lio36 = 1;
          context.promptString = oracleWrapper;
          window.LUNEA_INTIMACY_ORACLE_UI_V36 = {
            version: '36.6',
            sync() {},
            serializeOracleDraft() { return null; },
            restoreSerializedOracle() { return false; }
          };
        }
        script.emit('load');
      });
      return script;
    }
  };

  vm.runInNewContext(finalSource, context);
  vm.runInNewContext(bridgeSource, context);
  const bridge = window.LUNEA_INTIMACY_AI_BRIDGE_V34;
  assert.ok(bridge, 'bridge must expose its runtime API after boot');
  assert.equal(await bridge.ensureOracleRuntime(), true);

  const finalApi = window.LUNEA_FINAL_PROMPT_PRIORITY_V1;
  assert.equal(finalApi.ensure(), true, 'idempotent ensure must not re-wrap the Final layer');
  const prompt = context.promptString();
  const marker = '[FINAL READING PRIORITY · 최종 근거 우선순위]';
  assert.equal(prompt.split(marker).length - 1, 1, 'Final policy must be installed once, without recursion');
  assert.ok(prompt.indexOf('[ORACLE LATE LAYER]') < prompt.indexOf(marker), 'Final policy must be outermost after the late Oracle layer');
  assert.equal(listeners.size, 0, 'test must use only the fake VM document, not browser listeners');
});
