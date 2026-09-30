import assert from 'node:assert/strict';
import fs from 'node:fs';

const bridge = fs.readFileSync(new URL('../lunea-horary-future-window-v2.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');

assert.match(loader, /loadHoraryFutureWindowV2/);
assert.match(loader, /lunea-horary-future-window-v2\.js/);
assert.match(bridge, /LUNEA_HORARY_FUTURE_WINDOW_V2/);
assert.match(bridge, /targetWindow/);
assert.match(bridge, /currentJudgmentUnchanged/);
assert.match(bridge, /futureAspectDevelopment/);
assert.match(bridge, /moonFutureFlow/);
assert.match(bridge, /dailySummaries/);
assert.match(bridge, /direct_event_axis/);
assert.match(bridge, /supportive_only/);
assert.match(bridge, /현재 Moon VOC는 현재 sign 이탈 전까지만/);
assert.match(bridge, /미래 접근·orb 진입·exact 시각으로 현재 grade를 올리거나 YES로 바꾸지 않는다/);
assert.match(bridge, /Reception은 기술적 수용성\/관계 조건/);
assert.match(bridge, /D\/NONE은 확정 근거 부족이지 자동 NO가 아니다/);
assert.match(bridge, /현재 판정 → 미래기간 변화 → 성사 근거 → 반증 → 불확실성/);

console.log('Horary Future Window V2 frontend contract PASS');
