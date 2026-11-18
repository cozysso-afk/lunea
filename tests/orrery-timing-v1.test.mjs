import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {getItem:k => store.has(k) ? store.get(k) : null, setItem:(k,v) => store.set(k,String(v)), removeItem:k => store.delete(k)};
console.info = () => {};
console.warn = () => {};
window.addEventListener = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
(0, eval)(read('vendor/orrery-core-0.6.0.js'));
(0, eval)(read('lunea-orrery-engine-v1.js'));
(0, eval)(read('lunea-orrery-timing-v1.js'));
const E = window.LUNEA_ORRERY_ENGINE_V1;
const T = window.LUNEA_ORRERY_TIMING_V1;

// Reference values match an independent reading prompt computed with the
// same library (2026-11-17 13:19 KST snapshot).
const now = new Date('2026-11-17T04:19:00Z');
const me = await E.fourPillars({birthDate:'1991-03-21', birthTime:'07:26', birthPlace:'여수', gender:'F'});
store.set('LUNEA_SAJU_AUTO_V1', JSON.stringify({birthDate:'1991-03-21', birthTime:'07:26', birthPlace:'여수', gender:'F', data:me}));

// 1. Saju timing
const saju = T.sajuTimingLines({year:'辛未', month:'辛卯', day:'庚寅', hour:'己卯'}, now).join('\n');
assert.match(saju, /2026-11-17 13:19 한국시간 스냅샷/);
assert.match(saju, /세운 丙午\(천간 偏官 · 지지 정기 正官\) \/ 월운 己亥\(천간 正印 · 지지 정기 食神\) \/ 일진 乙未\(천간 正財 · 지지 정기 正印\)/);
assert.match(saju, /일진↔일주 庚寅: 천간 合\(금\), 지지 鬼門/);
assert.match(saju, /일진↔월주 辛卯: 천간 沖, 지지 半合\(목\)/);
assert.match(saju, /일진↔년주 辛未: 천간 沖/);
assert.doesNotMatch(saju, /metal|tree|fire|water|earth/);
assert.match(T.userSajuLines().join('\n'), /오늘 운\(엔진 계산/);

// 2. Natal from the engine, stored separately from the Astro Core natal
const nat = await T.ensureUserNatal();
assert.equal(nat.schema, 'LUNEA_NATAL_ENGINE_V1');
assert.deepEqual([nat.planets.Sun.sign, nat.planets.Sun.degree, nat.planets.Sun.placidus_house, nat.planets.Sun.whole_house], ['Pisces', 29.8, 12, 12]);
assert.deepEqual([nat.planets.Moon.sign, nat.planets.Moon.degree], ['Taurus', 29.3]);
assert.deepEqual([nat.angles.ASC.sign, nat.angles.ASC.degree, nat.angles.MC.sign, nat.angles.MC.degree], ['Aries', 18.7, 'Capricorn', 11.1]);
assert.equal(store.get('LUNEA_ASTRO_NATAL_V3'), undefined, 'Astro Core natal is never written');
const w = T.userWesternLines();
assert.match(w.natal, /- Sun\(태양\): Pisces · 29\.8° · WS 12H · Placidus 12H/);
assert.match(w.extra[0], /수성 사각 해왕성 \(0\.2°\)/);

// With an Astro Core natal saved, the engine natal lines step aside.
store.set('LUNEA_ASTRO_NATAL_V3', JSON.stringify({planets:{Sun:{sign:'Pisces',degree:29.8}}}));
assert.equal(T.userWesternLines().natal, '');
store.delete('LUNEA_ASTRO_NATAL_V3');

// 3. Transit snapshot
const tc = await T.refreshTransits(now);
const top = tc.items.map(x => `${x.t}-${x.ko}-${x.n}`);
assert.ok(top.includes('Venus-삼각-Mars') && top.includes('Pluto-충-Jupiter') && top.includes('Uranus-삼각-Saturn'));
assert.ok(tc.items.every(x => x.orb <= 3));

// 4+5. Partner (unknown time): range-checked signs, aspects, synastry
const pl = (await T.computePartnerWestern({id:'p', birthDate:'1992-02-29', birthTime:'', timeUnknown:true, birthPlace:'광주'})).join('\n');
assert.match(pl, /태양 물고기자리 \/ 달 염소자리 \/ 수성 물고기자리 \/ 금성 물병자리/);
assert.match(pl, /목성 처녀자리\(역행\)/);
assert.match(pl, /금성 합 토성/);
assert.match(pl, /태양 충 목성/);
assert.match(pl, /두 사람 궁합 각\(엔진 계산, 3° 이내·상대 출생일 전체에서 유지\): 내 해왕성 합 상대 천왕성/);
assert.match(pl, /ASC·MC·하우스·달의 정확한 도수는 계산하지 않았다/);
assert.doesNotMatch(pl, /ASC [A-Z]|상승점/);

// Policies wired in the last-mile prompt block
(0, eval)(read('lunea-final-prompt-priority-v1.js'));
const fp = window.LUNEA_FINAL_PROMPT_PRIORITY_V1;
const built = fp.build(`[질문 원문]\n"오늘 흐름 어때?"\n\n[뽑힌 카드]\n1. X\n\n[WESTERN ASTROLOGY · 서양점성술]\n${w.natal}\n${w.extra.join('\n')}\n- 오늘 트랜짓 스냅샷(엔진 계산, 2026-11-17 13:19 한국시간, 3° 이내): 운행 금성 삼각 출생 화성 (0.2°)`);
assert.match(built, /- 오늘 트랜짓 스냅샷\(엔진 계산\): 표시된 시각의 행성 위치/);
assert.match(read('lunea-final-prompt-priority-v1.js'), /「오늘 운」과 「오늘 운과 원국의 관계」는 계산 시각의 스냅샷/);

console.log('orrery-timing-v1 ok');

// Sun sign follows the computed Sun, never the legacy 3/21 → Aries date table.
store.set('LUNEA_USER_PROFILE', JSON.stringify({zodiac:'Aries ♈ (양자리)'}));
globalThis.document = {getElementById: id => id === 'zodiac' ? zodiacSel : null};
const zodiacSel = {value:'Aries ♈ (양자리)', options:['Aries ♈ (양자리)','Pisces ♓ (물고기자리)'].map(v => ({value:v, textContent:v}))};
assert.equal(T.syncSunSign(nat), true);
assert.equal(zodiacSel.value, 'Pisces ♓ (물고기자리)');
assert.equal(JSON.parse(store.get('LUNEA_USER_PROFILE')).zodiac, 'Pisces ♓ (물고기자리)');
delete globalThis.document;

// Birth place resolution: region-qualified names and added cities keep real coordinates.
assert.equal(E.resolveCity('광주(경기도)').label, '광주 (경기도)');
assert.ok(Math.abs(E.resolveCity('광주').lat - 35.1595) < 0.01);
assert.equal(E.resolveCity('나주').label, '나주 (전라남도)');
assert.equal(E.resolveCity('없는도시').fallback, true);
console.log('sun sign + place ok');
