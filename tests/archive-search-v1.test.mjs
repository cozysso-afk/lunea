import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-archive-search-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');

assert.match(source, /archiveDateFrom/);
assert.match(source, /archiveDateTo/);
assert.match(source, /archiveCategoryFilter/);
assert.match(source, /archiveStatusFilter/);
assert.match(source, /archiveSearchReset/);
assert.match(source, /MutationObserver/);
assert.match(source, /requestAnimationFrame/);
assert.match(source, /질문·스프레드·카드·AI 해석·메모·태그 검색/);
assert.match(source, /20\\d\{2\}/);
assert.match(source, /INTIMACY/);
assert.doesNotMatch(source, /localStorage\.removeItem\(/);
assert.doesNotMatch(source, /indexedDB\.(deleteDatabase|open)\(/);

const refs = loader.match(/lunea-archive-search-v1\.js\?v=101/g) || [];
assert.equal(refs.length, 2, 'archive search must load in both loader paths');
assert.ok(loader.indexOf('lunea-reading-journal-v2.js?v=201') < loader.indexOf('lunea-archive-search-v1.js?v=101'));

console.log('LUNEA archive advanced search/date filter contract: PASS');
