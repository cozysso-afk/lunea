import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {getItem:k => store.has(k) ? store.get(k) : null, setItem:(k,v) => store.set(k,String(v)), removeItem:k => store.delete(k)};
window.addEventListener = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};
console.info = () => {}; console.warn = () => {};
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
(0, eval)(read('vendor/orrery-core-0.6.0.js'));
(0, eval)(read('lunea-orrery-engine-v1.js'));
(0, eval)(read('lunea-orrery-timing-v1.js'));
const E = window.LUNEA_ORRERY_ENGINE_V1;
const T = window.LUNEA_ORRERY_TIMING_V1;
const now = new Date('2026-11-17T04:19:00Z');

// Default: the ziwei 시진 follows the saju hour pillar (07:26 → 卯), so the
// chart matches the reference reading (명궁 子, 土五局, 夫妻 太陰·擎羊).
const def = E.ziweiLines({birthDate:'1991-03-21', birthTime:'07:26', gender:'F'}, now).join('\n');
assert.match(def, /음력 1991년 2월 6일 · 卯시\(05:30~07:30\) · 사주 시주와 같은 시진/);
assert.match(def, /- 명궁 子 · 신궁 午 · 오행국 土五局/);
assert.match(def, /- 命宮\(庚子\): 巨門\(化祿\), 火星/);
assert.match(def, /- 夫妻\(戊戌\): 太陰, 擎羊/);
assert.match(def, /- 유년\(2026 음력년, 큰 흐름\): 유년 명궁 午, 본명 遷移에 위치 · 유년 사화 天同 化祿, 天機 化權, 文昌 化科, 廉貞 化忌/);
assert.match(def, /- 현재 대한: 田宅 \(35~44세\)/);

// Explicit 시진 (rectified 辰) drives both the hour pillar and the ziwei chart.
const zr = E.ziweiLines({birthDate:'1991-03-21', birthTime:'07:26', gender:'F', hourBranch:'辰'}, now).join('\n');
assert.match(zr, /辰시\(07:30~09:30\) · 사용자가 직접 지정한 시진/);
assert.match(zr, /- 명궁 亥 · 신궁 未 · 오행국 木三局/);
const sp = await E.fourPillars({birthDate:'1991-03-21', birthTime:'07:26', birthPlace:'여수', gender:'F', hourBranch:'辰'});
assert.equal(sp.pillars.hour.hanja, '庚辰');
assert.equal(sp.pillars.day.hanja, '庚寅');
assert.equal(sp.provenance.hour_override, '辰');

// No gender → no 대한 line.
assert.match(E.ziweiLines({birthDate:'1991-03-21', birthTime:'07:26'}, now).join('\n'), /대한: 성별 미입력으로 계산하지 않음/);

// User prompt providers read the saved record (with override and provenance).
store.set('LUNEA_SAJU_AUTO_V1', JSON.stringify({birthDate:'1991-03-21', birthTime:'07:26', birthPlace:'여수', gender:'F', hourBranch:'辰', data:sp}));
assert.match(T.userZiweiLines(now).join('\n'), /명궁 亥/);
assert.match(T.userSajuLines().join('\n'), /계산 기준\(엔진\): 한국 만세력 관례 · KST 시계 기준\(역사적 서머타임 반영\) · 야자시\(split\) · 경도 진태양시 보정 없음 · 시진 직접 지정 辰시/);

// Partner: ziwei only with an exact birth time, limited palaces.
assert.deepEqual(T.partnerZiweiLines({birthDate:'1992-02-29', timeUnknown:true, gender:'남성'}, now), []);
const pz = T.partnerZiweiLines({birthDate:'1992-02-29', birthTime:'14:10', gender:'남성'}, now).join('\n');
assert.match(pz, /- 자미두수 명궁 /);
assert.match(pz, /- 자미두수 夫妻\(/);
assert.doesNotMatch(pz, /- 자미두수 (兄弟|子女|財帛)\(/);

// Final policy line appears with the block, and changes for other-focused questions.
(0, eval)(read('lunea-final-prompt-priority-v1.js'));
const fp = window.LUNEA_FINAL_PROMPT_PRIORITY_V1;
const mk = q => `[질문 원문]\n"${q}"\n\n[질문 유형]\n연애\n\n[뽑힌 카드]\n1. X\n\n[ZIWEI DOUSHU · 자미두수]\n${def}`;
assert.match(fp.build(mk('올해 일 흐름 어때?')), /- Ziwei Doushu\(자미두수\): 질문과 직접 관련된 궁 1~2개/);
assert.match(fp.build(mk('그 사람 속마음이 뭘까?')), /- Ziwei Doushu\(자미두수\): 질문자의 명반이다/);
assert.doesNotMatch(fp.build('[질문 원문]\n"x"\n\n[뽑힌 카드]\n1. X'), /Ziwei Doushu/);

console.log('orrery-ziwei-v1 ok');
