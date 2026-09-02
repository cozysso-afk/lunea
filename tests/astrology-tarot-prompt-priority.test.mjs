import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-final-prompt-priority-v1.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

const window = {
  addEventListener() {},
};
window.window = window;
const document = {readyState:'loading'};

vm.runInNewContext(source, {
  window,
  document,
  console,
  String,
  RegExp,
  Object,
  Array,
  setInterval() { return 1; },
  clearInterval() {},
  setTimeout() { return 1; },
});

const api = window.LUNEA_FINAL_PROMPT_PRIORITY_V1;
assert.ok(api, 'final prompt priority API missing');
assert.equal(api.version, 2, 'astrology-aware prompt policy must be V2');

const natal = `
[CELESTIAL PROFILE V3 — 서로 다른 체계를 분리해서 참고]

[WESTERN ASTROLOGY · 서양점성술]
- 기본 황도: Tropical(열대황도)
- 하우스 정책: Whole Sign(홀사인) Primary / Placidus(플라시두스) Secondary ON
- Sun(태양): Pisces 12.4° · 5H
- Moon(달): Gemini 3.2° · 8H
- ASC(상승점): Libra 18.1°
- Venus(금성): Aquarius 27.5° · 4H

[SAJU / FOUR PILLARS · 사주명리]
- 일간: 庚金(경금)

[THAI ASTROLOGY · 태국점성술]
- 출생 요일: 목요일

[프로필 체계 사용 규칙]
- 각 체계는 독립적으로 보조한다.
`;

const selfPrompt = `[질문 원문]\n"내가 이직하는 게 좋을까?"\n\n[질문 유형]\ncareer\n${natal}\n\n[뽑힌 카드]\n1. [현재] The Hermit`;
assert.equal(api.hasWesternNatal(selfPrompt), true, 'computed natal placements must be detected');
const selfPolicy = api.build(selfPrompt);
assert.match(selfPolicy, /서양점성 보조/);
assert.match(selfPolicy, /최소 1회 실질적으로 반영/);
assert.match(selfPolicy, /Sun\/Moon\/ASC\/MC\/Mercury\/Venus\/Mars/);
assert.match(selfPolicy, /카드 결론이나 사건 성립 여부를 대신하지 않는다/);

const otherPrompt = `[질문 원문]\n"그 사람은 나를 어떻게 생각해?"\n\n[질문 유형]\nlove\n${natal}\n\n[뽑힌 카드]\n1. [상대의 현재 마음] Two of Swords`;
const otherPolicy = api.build(otherPrompt);
assert.match(otherPolicy, /서양점성 보조/);
assert.match(otherPolicy, /상대의 속마음·연락 발생·행동 증거로 쓰지 않는다/);
assert.match(otherPolicy, /사용자의 관계 체감·반응 패턴·경계 또는 선택 기준/);

const noNatalPrompt = `[질문 원문]\n"내 진로 흐름은?"\n\n[질문 유형]\ncareer\n[WESTERN ASTROLOGY · 서양점성술]\n- 태양궁 호환값: Pisces ♓\n- Natal(네이탈·출생차트) 상세 계산값: 아직 Astro Core 미연결\n\n[뽑힌 카드]\n1. [현재] The Star`;
assert.equal(api.hasWesternNatal(noNatalPrompt), false, 'compatibility zodiac alone is not a computed natal chart');
assert.match(api.build(noNatalPrompt), /태양궁 호환값이나 출생정보만으로 상세 출생차트를 지어내지 않는다/);

const transitPrompt = `${selfPrompt}\n\n[WESTERN ASTROLOGY — TRANSIT SCANNER · 계산 결과]\n- peak: 2026-09-10 · Transit Venus trine Natal Moon`;
assert.equal(api.hasTransit(transitPrompt), true);
assert.match(api.build(transitPrompt), /peak\/caution\/exact-hit 중 관련 근거를 최소 1개/);
assert.match(api.build(selfPrompt), /실제 계산 결과 블록이 없으면 트랜짓을 참고했다고 말하거나/);

const returnPrompt = `${selfPrompt}\n\n[PLANETARY RETURNS · 회귀 계산 결과]\n- Venus Return: 2026-10-01`;
assert.equal(api.hasReturns(returnPrompt), true);
assert.match(api.build(returnPrompt), /질문과 직접 관련된 회귀 1개를 배경 주기로 짧게 교차참고/);

const thaiPrompt = `${selfPrompt}\n\n[THAI ASTROLOGY · MAHA TAKSA 계산 결과]\n- current_day: Sri · Venus`;
assert.equal(api.hasThaiComputed(thaiPrompt), true);
assert.match(api.build(thaiPrompt), /태국점성 보조/);
assert.match(api.build(thaiPrompt), /Taksa 영역\/행성 1개/);

const finalPromptOccurrences = (workflow.match(/lunea-final-prompt-priority-v1\.js/g) || []).length;
assert.ok(finalPromptOccurrences >= 1, 'Pages cache stamp must include the final prompt policy asset');
assert.match(workflow, /Could not stamp both nested loader paths/);

console.log('Astrology-aware tarot prompt priority regression tests: PASS');
