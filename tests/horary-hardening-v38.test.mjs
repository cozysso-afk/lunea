import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-horary-hardening-v38.js', import.meta.url), 'utf8');
const cache = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');

assert.match(source, /NON_OUTCOME_BALANCE_BLOCK = new Set\(\['location', 'descriptive', 'comparison'\]\)/, 'non-outcome Balance gate set missing');
assert.match(source, /HORARY BALANCE V3\.1 · 최종 판정 근거/, 'Balance duplicate-block sentinel missing');
assert.match(source, /MANUAL OVERRIDE V38/, 'manual Horary mode prompt missing');
assert.match(source, /질문 판독 모드 · 자동 권장/, 'manual mode UI missing');
assert.match(source, /enrichedArchiveObject/, 'full Horary archive enrichment missing');
assert.match(source, /cusps:data\.cusps/, 'Horary archive must retain 12 cusps');
assert.match(source, /planets:data\.planets/, 'Horary archive must retain all planet rows');
assert.match(source, /judgment_support:data\.judgment_support/, 'Horary archive must retain full judgment support');
assert.match(source, /Timezone\(타임존\)/, 'overseas timezone control missing');
assert.match(source, /navigator\.geolocation/, 'current-location coordinate helper missing');
assert.match(source, /body\.lat = lat/, 'Horary request latitude rewrite missing');
assert.match(source, /body\.timezone = tz/, 'Horary request timezone rewrite missing');
assert.match(source, /pet: \['반려동물·작은 동물'/, 'pet topic route missing');
assert.match(source, /children: \['자녀·임신·출산'/, 'children topic route missing');
assert.match(source, /shared_money: \['상속·타인의 돈·공동재산'/, 'shared money topic route missing');
assert.match(source, /hidden: \['비밀·숨겨진 일'/, 'hidden-matters route missing');
assert.match(source, /planet_conditions_v4/, 'backend accidental-condition evidence bridge missing');
assert.match(source, /PartOfFortune/, 'Part of Fortune evidence bridge missing');
assert.match(cache, /lunea-horary-hardening-v38\.js/, 'build-scoped Horary V38 loader missing');

console.log('Horary Hardening V38 contract tests passed');
