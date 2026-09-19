import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const finalPromptSource = fs.readFileSync(new URL('../lunea-final-prompt-priority-v1.js', import.meta.url), 'utf8');
const dailySource = fs.readFileSync(new URL('../lunea-daily-orbit6-v21.js', import.meta.url), 'utf8');
const loaderSource = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');

const listeners = new Map();
const intervals = [];
const window = {
  LUNEA_MESSAGE_ORACLE_SUPPORT_V1: {
    promptBlock: () => '[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조]\n카드: Eight of Wands · 정방향'
  },
  addEventListener(type, fn) {
    const rows = listeners.get(type) || [];
    rows.push(fn);
    listeners.set(type, rows);
  }
};
window.window = window;

const context = vm.createContext({
  window,
  console,
  setInterval(fn) { intervals.push(fn); return intervals.length; },
  clearInterval() {},
  setTimeout(fn) { fn(); return 1; },
  promptString() {
    return '[질문 원문]\n"오늘의 흐름"\n\n[질문 유형]\nadvice\n\n[뽑힌 카드]\n1. The Star';
  }
});

vm.runInContext(finalPromptSource, context);
for (const interval of intervals) interval();

// Reproduce the production load order: a later profile/gloss module replaces
// the bare binding after Final Prompt Priority first installed.
const earlier = context.promptString;
context.promptString = function lateProfileWrapper() {
  return earlier() + '\n\n[CELESTIAL PROFILE V3]';
};
for (const listener of listeners.get('load') || []) listener();

const prompt = context.promptString();
assert.match(prompt, /\[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조\]/,
  'late prompt wrappers must not drop the exact-reading Message Oracle block');
assert.match(prompt, /Message Oracle\(연락·소식 메시지 오라클\): 현재 리딩에 연결된 실제 결과/,
  'final policy must recognize and require the attached Message Oracle evidence');
assert.equal(window.promptString, context.promptString,
  'window and bare prompt bindings must be resynchronized after late wrappers');

assert.match(dailySource, /function matchingDailyDraft\(/,
  'DAILY ORBIT must validate the autosaved exact-reading draft');
assert.match(dailySource, /restoreExactDailyDraft\(stored\)/,
  'same-day DAILY reopen must prefer exact draft restoration');
assert.match(dailySource, /LUNEA_READING_DRAFT_V1\?\.snapshot\?\.\(\)/,
  'DAILY draw/restore must explicitly refresh the shared draft');
assert.equal((loaderSource.match(/lunea-daily-orbit6-v21\.js\?v=2102/g) || []).length, 2,
  'both loader paths must use the refreshed DAILY ORBIT cache key');

console.log('DAILY Message Oracle + draft prompt regression tests: PASS');
