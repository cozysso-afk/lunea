import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('lunea-horary-balance-guard-v41.js', 'utf8');
const loader = fs.readFileSync('lunea-cache-refresh-v1.js', 'utf8');

assert.match(source, /traditional_core_v8\s*\|\|\s*j\.traditional_core_v7\s*\|\|\s*j\.traditional_core_v6/, 'V41.1 must prefer V8 with V7/V6 fallback');
assert.match(source, /judgment_hierarchy_v8/, 'V8 judgment hierarchy must be consumed');
assert.match(source, /qualified_evidence_grade_v8/, 'V8 qualified evidence must be visible');
assert.match(source, /action_state_v8/, 'V8 action/event state must be visible');
assert.match(source, /intention_reception_v8/, 'V8 intention/reception state must be visible');
assert.match(source, /moon_event_testimony_v8/, 'V8 Moon event testimony must be consumed');
assert.match(source, /D는 자동 NO가 아니다/, 'D must not be flattened into automatic NO');
assert.match(source, /target_role이 quesited\/event일 때만 C급 공동 시그니피케이터/, 'Moon promotion must be narrowly target/event scoped');
assert.match(source, /essential_dignities_v7/, 'V7 dignity evidence must remain consumed');
assert.match(source, /moon_relevance_v7/, 'Moon question relevance must remain consumed');
assert.match(source, /confirmed_obstructions_v7/, 'confirmed obstructions must remain separate');
assert.match(source, /Moon이 VOC가 아니라는 이유만으로 Moon support=YES로 판정하지 않는다/, 'non-VOC must not equal Moon support');
assert.match(source, /square\/opposition은 과정의 마찰.*자동 NO/s, 'hard aspects must not be automatic NO');
assert.match(source, /triplicity\/term\/face.*Peregrine/s, 'minor dignity must prevent false peregrine');
assert.match(source, /direct Perfection과 confirmed Prohibition\/Frustration\/Refranation.*둘 다 사실/s, 'direct perfection and obstruction must remain separate facts');
assert.match(source, /TRADITIONAL CORE V8 · authoritative/, 'V8 authoritative prompt marker missing');
assert.match(source, /TRADITIONAL CORE V7 · authoritative/, 'V7 provenance marker missing');
assert.match(source, /TRADITIONAL CORE V6 · authoritative/, 'V6 compatibility marker must suppress V40 duplicate injection');
assert.match(source, /route_contract_v7\.matches_spec/, 'route mismatch must stop interpretation');
assert.match(loader, /luneaHoraryBalanceGuardV41Loader/, 'cache loader must load V41');
assert.match(loader, /lunea-horary-balance-guard-v41\.js/, 'V41 asset missing from build-scoped loader');

console.log('Horary Balance Guard V41.1 · V8 hierarchy contract OK');
