import assert from 'node:assert/strict';
import fs from 'node:fs';

const v44 = fs.readFileSync(new URL('../lunea-horary-post-actions-v44.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url), 'utf8');

// Active build-scoped loader must own V44 delivery.
assert.match(loader, /HORARY POST ACTIONS V44 LOADER/);
assert.match(loader, /lunea-horary-post-actions-v44\.js\?v=441/);

// AI/copy are intercepted at capture phase and no longer depend solely on
// closed-over Horary state handlers.
assert.match(v44, /#astroHoraryAI/);
assert.match(v44, /#astroHoraryCopy/);
assert.match(v44, /stopImmediatePropagation/);
assert.match(v44, /generativelanguage\.googleapis\.com/);
assert.match(v44, /AI 해석 실패:/);
assert.match(v44, /navigator\.clipboard\?\.writeText/);
assert.match(v44, /document\.execCommand\('copy'\)/);
assert.match(v44, /resultNode\(\)/);
assert.match(v44, /classList\.contains\('show'\)/);

// AI interpretation itself must not create a new archive record.
assert.doesNotMatch(v44, /await repairLatestHoraryArchive\(\{forceAI:text\}\)/);

// Horary Save is bridged from legacy archive storage into Journal V2 IndexedDB.
assert.match(v44, /LUNEA_ARCHIVE_V3/);
assert.match(v44, /LUNEA_READING_DB/);
assert.match(v44, /const STORE = 'journal'/);
assert.match(v44, /indexedDB\.open\(DB_NAME,DB_VERSION\)/);
assert.match(v44, /sourceArchiveId/);
assert.match(v44, /repairLatestHoraryArchive/);
assert.match(v44, /repairSavedHoraryRows/);
assert.match(v44, /LUNEA_READING_JOURNAL\?\.render/);

// Non-card systems must not render as fake Tarot backs in the records view.
assert.match(v44, /function isMeihua/);
assert.match(v44, /function isHorary/);
assert.match(v44, /lunea-archive-card-strip/);
assert.match(v44, /\.remove\(\)/);
assert.match(v44, /lunea-narrative-summary-v44/);
assert.match(v44, /본괘/);
assert.match(v44, /Tropical · Regiomontanus/);

console.log('LUNEA Horary Post Actions V44 + Journal/Meihua archive contract: PASS');
