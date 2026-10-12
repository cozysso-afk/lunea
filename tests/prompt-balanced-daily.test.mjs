import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const finalSource = fs.readFileSync(new URL('../lunea-final-prompt-priority-v1.js', import.meta.url), 'utf8');
const dailySource = fs.readFileSync(new URL('../lunea-daily-interpretation-contract-v2.js', import.meta.url), 'utf8');

const FINAL_MARKER = '[FINAL READING PRIORITY · 최종 근거 우선순위]';
const DAILY_MARKER = '[DAILY ORBIT · CONNECTION 세부 해설]';
const TIMING_MARKER = '[TIMING ORACLE · 질문 섹터]';

function count(text, marker) {
  return text.split(marker).length - 1;
}

function createPromptRuntime(basePrompt) {
  const listeners = new Map();
  const noop = () => {};
  const window = {
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    fetch: noop
  };
  window.window = window;

  return vm.createContext({
    window,
    console: {info: noop, warn: noop, error: noop},
    localStorage: {getItem: () => null},
    setInterval: () => 1,
    clearInterval: noop,
    promptString() {
      return basePrompt;
    }
  });
}

test('DAILY canonical tail keeps evidence-proportional direction after Final across repeated prompt assembly', () => {
  const oldDaily = `${DAILY_MARKER}\n- 사용자가 선택한 애정 상태: 솔로, 재회\n- 재회는 과거 인연의 재접촉과 실제 관계 회복을 구분한다.`;
  const timing = `${TIMING_MARKER}\n- 섹터 선택 방식: 직접 선택\n- 해석 섹터: 금전 · 투자\n- 이 섹터는 질문의 맥락을 좁히는 정보다.`;
  const basePrompt = `[질문 원문]\n"오늘의 흐름"\n\n[질문 유형]\nadvice\n\n[스프레드]\nDAILY ORBIT 6\n\n[뽑힌 카드]\n1. The Star\n\n${oldDaily}\n\n${timing}\n\n${oldDaily}\n\n${timing}`;
  const runtime = createPromptRuntime(basePrompt);

  // This is the active wrapper order: common Final policy first, then the late
  // DAILY V2 canonicalizer that owns the final DAILY tail.
  vm.runInContext(finalSource, runtime, {filename: 'lunea-final-prompt-priority-v1.js'});
  vm.runInContext(dailySource, runtime, {filename: 'lunea-daily-interpretation-contract-v2.js'});

  const first = runtime.promptString();
  const second = runtime.promptString();

  assert.equal(second, first, 'repeated promptString assembly must remain canonical');
  assert.equal(count(first, FINAL_MARKER), 1, 'one common Final policy must remain');
  assert.equal(count(first, DAILY_MARKER), 1, 'duplicate DAILY context must collapse to one canonical contract');
  assert.equal(count(first, TIMING_MARKER), 1, 'duplicate Timing context must remain sector-scoped once');
  assert.ok(first.indexOf(FINAL_MARKER) < first.indexOf(DAILY_MARKER),
    'the canonical DAILY contract must remain after the common Final policy');
  assert.equal(runtime.window.promptString, runtime.promptString,
    'bare promptString and window.promptString must stay synchronized');

  assert.match(first, /\[방향성 중립\] 긍정·부정 어느 쪽도 기본값으로 두지 않는다/);
  assert.match(first, /근거 강도·반복성·독립성·반증에 비례해 결론의 방향과 강도를 정한다/);
  assert.match(first, /실제로 경쟁하는 해석만 비교하고, 약한 근거를 보태 긍·부정을 기계적으로 맞추는 허위 균형은 금지한다/);

  // Keep role-specific positive and limiting evidence available; neutrality is
  // not a mechanical 50:50 result and must not erase reunion or money choices.
  assert.match(first, /① 연락·재접촉 신호 ② 실제 대화가 이어질 신호 ③ 관계 회복·재결합 신호 ④ 지연·거리·불발·반증 신호/);
  assert.match(first, /수익실현 쪽 우세 \/ 일부 수익실현 쪽 우세 \/ 보유 쪽 우세 \/ 추가 확인 후 판단 \/ 판단 보류/);
  assert.match(first, /① 수익실현을 지지·제한하는 근거 ② 보유를 지지·제한하는 근거/);
  assert.match(first, /해석 섹터: 금전 · 투자/);
});
