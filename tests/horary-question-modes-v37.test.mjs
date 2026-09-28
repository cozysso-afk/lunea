import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-horary-question-modes-v37.js', import.meta.url), 'utf8');
const cache = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');

assert.match(source, /forceTopic:'lost_object'/, 'lost-object mode must force the 2H route');
assert.match(source, /분실물·위치/, 'lost-object/location mode label missing');
assert.match(source, /DESCRIPTIVE \/ PERCEPTION/, 'descriptive Horary mode prompt missing');
assert.match(source, /OPTION COMPARISON/, 'non-person option comparison mode prompt missing');
assert.match(source, /직접 성사각 없음.*물건이 없다는 뜻/s, 'location prompt must forbid perfection=no misuse');
assert.match(source, /Regiomontanus 하우스 커스프 12개/, 'full cusp payload missing from AI/copy bridge');
assert.match(source, /Ptolemaic 주요각/, 'full traditional aspect payload missing from AI/copy bridge');
assert.match(cache, /lunea-horary-question-modes-v37\.js/, 'build-scoped Horary V37 loader missing');

console.log('Horary Question Modes V37 contract tests passed');
