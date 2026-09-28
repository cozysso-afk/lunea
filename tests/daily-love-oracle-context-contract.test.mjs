import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context = fs.readFileSync(new URL('../lunea-reading-context-v1.js', import.meta.url), 'utf8');
const contract = fs.readFileSync(new URL('../lunea-daily-interpretation-contract-v2.js', import.meta.url), 'utf8');
const boot = fs.readFileSync(new URL('../lunea-boot-reveal-v29.js', import.meta.url), 'utf8');

for (const label of ['솔로','썸','짝사랑','재회','연애중','기혼']) {
  assert.ok(context.includes(`'${label}'`) || context.includes(label), `missing love status: ${label}`);
}

assert.match(context, /복수 선택 가능/);
assert.match(context, /소개팅 · 새 인연 · 새로운 만남 포함/);
assert.match(context, /여러 상태를 하나의 '연애운' 문단으로 합치거나/);
assert.match(context, /먼저 「대인관계」를 별도 소제목으로 해석한다/);
assert.match(context, /\[\['AUTO', '자동 분류'\], \.\.\.TIMING_SECTORS\]/);
assert.match(context, /기본은 질문을 보고 자동 분류해요/);
assert.match(context, /기본은 자동 분류예요/);
assert.match(context, /data-context="AUTO"/);
assert.match(boot, /lunea-reading-context-v1\.js\?v=20260922-1/);

// Daily Interpretation Contract V2 must answer the actual DAILY questions rather
// than collapsing reunion into generic relationship advice or money into warnings.
for (const phrase of [
  '연락·재접촉 신호',
  '실제 대화가 이어질 신호',
  '관계 회복·재결합 신호',
  '현재 연락 중이라고 가정하지 않는다',
  '수익실현 쪽 우세',
  '일부 수익실현 쪽 우세',
  '보유 쪽 우세',
  '추가 확인 후 판단',
  '판단 보류',
  '조언·주의사항만으로 포지션 질문을 대체하지 않는다',
  '공적·결과/업무/일반 소식이라면 그것을 재회 상대의 연락 근거로 전용하지 않는다',
  '섹터가 「금전 · 투자」라면 그 시기를 재회 연락 시기로 바꾸지 않는다'
]) {
  assert.ok(contract.includes(phrase), `missing Daily V2 contract phrase: ${phrase}`);
}
assert.match(boot, /lunea-daily-interpretation-contract-v2\.js\?v=20260928-1/);
assert.match(boot, /script\.onload=ensureDailyInterpretationContract/);

// Execute only the isolated V2 module with light browser stubs and verify that
// wrapper stacking cannot leave duplicate DAILY/TIMING blocks in the final prompt.
const storage = new Map();
const noop = () => {};
const sandbox = {
  console: {info:noop, warn:noop, error:noop},
  localStorage: {
    getItem:key => storage.get(key) ?? null,
    setItem:(key,value) => storage.set(key, String(value)),
    removeItem:key => storage.delete(key)
  },
  setInterval: () => 1,
  clearInterval: noop,
  Date,
  JSON,
  Object,
  String,
  RegExp,
  Map,
  Set
};
sandbox.window = {
  addEventListener: noop,
  fetch: () => Promise.resolve({ok:true})
};
vm.runInNewContext(contract, sandbox, {filename:'lunea-daily-interpretation-contract-v2.js'});

const api = sandbox.window.LUNEA_DAILY_INTERPRETATION_CONTRACT_V2;
assert.equal(api?.version, 2, 'Daily V2 API must install');

const oldDaily = `[DAILY ORBIT · CONNECTION 세부 해설]\n- 사용자가 선택한 애정 상태: 솔로, 재회\n- 재회는 과거 인연의 재접촉과 실제 관계 회복을 구분한다.`;
const timing = `[TIMING ORACLE · 질문 섹터]\n- 섹터 선택 방식: 직접 선택\n- 해석 섹터: 금전 · 투자\n- 이 섹터는 질문의 맥락을 좁히는 정보다.`;
const sample = `[질문 원문]\n"오늘 하루 흐름"\n\n[스프레드]\nDAILY ORBIT 6\n\n[뽑힌 카드]\n1. TEST\n\n${oldDaily}\n\n${timing}\n\n${oldDaily}\n\n${timing}\n\n[FINAL READING PRIORITY · 최종 근거 우선순위]\n1. 질문 원문 우선\n\n${oldDaily}\n\n${timing}`;

const normalized = api.canonicalizePrompt(sample);
const dailyCount = (normalized.match(/\[DAILY ORBIT · CONNECTION 세부 해설\]/g) || []).length;
const timingCount = (normalized.match(/\[TIMING ORACLE · 질문 섹터\]/g) || []).length;
assert.equal(dailyCount, 1, 'final Daily prompt must contain exactly one connection contract');
assert.equal(timingCount, 1, 'final Daily prompt must contain exactly one timing-sector block');
assert.match(normalized, /사용자가 선택한 애정 상태: 솔로, 재회/);
assert.match(normalized, /① 연락·재접촉 신호 ② 실제 대화가 이어질 신호 ③ 관계 회복·재결합 신호/);
assert.match(normalized, /수익실현 쪽 우세 \/ 일부 수익실현 쪽 우세 \/ 보유 쪽 우세/);
assert.match(normalized, /해석 섹터: 금전 · 투자/);

console.log('daily love / oracle context + Daily Interpretation Contract V2: PASS');
