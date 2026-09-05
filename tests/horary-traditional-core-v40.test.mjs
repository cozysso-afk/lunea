import assert from 'node:assert/strict';
import fs from 'node:fs';

const v40 = fs.readFileSync('lunea-horary-traditional-core-v40.js', 'utf8');
const loader = fs.readFileSync('lunea-cache-refresh-v1.js', 'utf8');
const legacy = fs.readFileSync('lunea-horary-balance-v19-5.js', 'utf8');

assert.match(v40, /traditional_core_v6/, 'V40 must consume backend Traditional Core V6');
assert.match(v40, /closest_geometric_aspect/, 'geometric aspect must be rendered separately');
assert.match(v40, /traditional_valid_aspect/, 'operative traditional aspect must be separate');
assert.match(v40, /유효 오브 밖\(out_of_orb\).*직접 Perfection/s, 'out-of-orb must be barred from direct perfection');
assert.match(v40, /Reception은 의향\/수용성 보조층이며 직접·간접 성사각을 대체하지 않는다/, 'reception cannot replace perfection');
assert.match(v40, /derived_house_policy/, 'derived event house policy must be exposed');
assert.match(v40, /quesited ↔ event/, 'quesited-to-event axis must be separate');
assert.match(v40, /event ↔ querent/, 'event-to-querent axis must be separate');
assert.match(v40, /전통 7행성 기준 VOC/, 'traditional VOC policy must be visible');
assert.match(v40, /last_major_separating_aspect/, 'Moon last separating aspect must be exposed');
assert.match(v40, /next_major_applying_aspect/, 'Moon next applying aspect must be exposed');
assert.match(v40, /Early\/Late ASC는 경고만/, 'ASC considerations must not invalidate the chart');
assert.match(v40, /Modern Supplemental/, 'modern supplemental layer must be visually separate');
assert.match(v40, /Local \/ UTC \/ Regiomontanus/, 'local and UTC debug evidence must be visible');
assert.match(v40, /HORARY BALANCE V3\.1 · 최종 판정 근거 · STRICT V6/, 'strict prompt marker missing');
assert.match(v40, /TRADITIONAL CORE V6 · authoritative/, 'authoritative V6 prompt block missing');
assert.match(v40, /NON_OUTCOME\.has\(mode\)/, 'non-outcome question modes must stay protected');

// V19.5 skips its legacy Gemini addon when this marker is already present.
assert.match(legacy, /HORARY BALANCE V3\(\?:\\\.1\)\? · 최종 판정 근거/, 'legacy skip guard changed unexpectedly');
assert.ok(v40.includes('HORARY BALANCE V3.1 · 최종 판정 근거'), 'V40 marker must trigger legacy skip guard');

assert.match(loader, /luneaHoraryTraditionalCoreV40Loader/, 'cache loader must load V40');
assert.match(loader, /lunea-horary-traditional-core-v40\.js/, 'V40 filename missing from build-scoped loader');

console.log('Horary Traditional Core V40 contract OK');
