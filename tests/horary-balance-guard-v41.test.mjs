import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('lunea-horary-balance-guard-v41.js', 'utf8');
const loader = fs.readFileSync('lunea-cache-refresh-v1.js', 'utf8');

assert.match(source, /traditional_core_v7\s*\|\|\s*j\.traditional_core_v6/, 'V41 must prefer V7 with V6 fallback');
assert.match(source, /essential_dignities_v7/, 'V7 dignity evidence must be consumed');
assert.match(source, /moon_relevance_v7/, 'Moon question relevance must be consumed');
assert.match(source, /qualified_evidence_grade_v7/, 'qualified direct/obstruction evidence must be visible');
assert.match(source, /confirmed_obstructions_v7/, 'confirmed obstructions must be separate');
assert.match(source, /Moon이 VOC가 아니라는 이유만으로 Moon support=YES로 판정하지 않는다/, 'non-VOC must not equal Moon support');
assert.match(source, /square\/opposition은 과정의 마찰.*자동 NO/s, 'hard aspects must not be automatic NO');
assert.match(source, /triplicity\/term\/face.*Peregrine/s, 'minor dignity must prevent false peregrine');
assert.match(source, /direct Perfection과 confirmed Prohibition\/Frustration\/Refranation.*둘 다 사실/s, 'direct perfection and obstruction must remain separate facts');
assert.match(source, /TRADITIONAL CORE V7 · authoritative/, 'V7 authoritative prompt marker missing');
assert.match(source, /TRADITIONAL CORE V6 · authoritative/, 'V6 compatibility marker must suppress V40 duplicate injection');
assert.match(source, /route_contract_v7\.matches_spec/, 'route mismatch must stop interpretation');
assert.match(loader, /luneaHoraryBalanceGuardV41Loader/, 'cache loader must load V41');
assert.match(loader, /lunea-horary-balance-guard-v41\.js/, 'V41 asset missing from build-scoped loader');

console.log('Horary Balance Guard V41 contract OK');
