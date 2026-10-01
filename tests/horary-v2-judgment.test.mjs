import assert from 'node:assert/strict';
import fs from 'node:fs';

const bridge = fs.readFileSync(new URL('../lunea-horary-v2-judgment.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');

assert.match(loader, /loadHoraryJudgmentV2/);
assert.match(loader, /lunea-horary-v2-judgment\.js/);
assert.match(bridge, /LUNEA_HORARY_V2_JUDGMENT_SCHEMA/);
assert.match(bridge, /HORARY V2 JUDGMENT · authoritative evidence/);
assert.match(bridge, /currentJudgment/);
assert.match(bridge, /aspectApplications/);
assert.match(bridge, /moonFlow/);
assert.match(bridge, /futureDevelopment/);
assert.match(bridge, /eventQuality/);
assert.match(bridge, /confidence/);
assert.match(bridge, /futureDevelopment의 orb entry\/exact perfection을 현재 perfection이나 현재 grade로 표현하지 않는다/);
assert.match(bridge, /VOC를 자동 불성사로 번역하거나 sign ingress 이후 목표기간 전체로 확장하지 않는다/);
assert.match(bridge, /Moon sign_segments\/target_window_aspects/);
assert.match(bridge, /reception을 시장\/상대가 질문자의 통제 또는 이익 방향으로 움직인다는 뜻으로 과장하지 않는다/);
assert.match(bridge, /fall\/detriment\/peregrine을 사건 실패·확정 손실·성사 불가능과 동일시하지 않는다/);
assert.match(bridge, /NONE\/D여도 자동 NO라고 쓰지 않는다/);
assert.match(bridge, /currentWithinOrb=false와 targetWindowWithinOrb=true/);
assert.match(bridge, /직접 성사각 미확인 · 리셉션 및 미래 접근각 존재/);
assert.match(bridge, /직접 성사각 미확인 · 리셉션 보조 존재/);
assert.doesNotMatch(bridge, /직접 성사각은 약하지만 리셉션 보조가 있음/);
assert.match(bridge, /핵심 결론 문장마다 사용한 engine field 경로/);

console.log('HORARY V2 judgment AI contract PASS');
