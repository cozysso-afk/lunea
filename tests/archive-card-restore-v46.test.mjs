import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-archive-card-restore-v46.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

// Regression: auxiliary horary data attached to a Tarot/Daily reading must not
// classify the whole reading as standalone Horary. Standalone is title-owned.
assert.match(source, /function isStandaloneHorary\(reading\)\s*\{\s*return \/\^HORARY\\b\/i\.test\(clean\(reading\?\.title\)\);\s*\}/s);
assert.doesNotMatch(source, /isStandaloneHorary[\s\S]{0,180}reading\?\.horary/);

// Only explicit standalone Horary and Meihua are non-card presentation rows.
assert.match(source, /return isStandaloneHorary\(reading\) \|\| isMeihua\(reading\)/);

// Valid card-bearing rows must have the over-broad V44 marker/summary removed,
// after the canonical card-image decorator rebuilds their strips.
assert.match(source, /LUNEA_ARCHIVE_CARD_IMAGES_V1\?\.decorateArchive\?\.\(\)/);
assert.match(source, /delete row\.dataset\.luneaNoncardV44/);
assert.match(source, /lunea-narrative-summary-v44/);

// Explicit Horary/Meihua rows still remove generic card strips.
assert.match(source, /if \(isExplicitNonCard\(reading\)\)[\s\S]{0,180}lunea-archive-card-strip/s);

// The repair is actually bootstrapped by an already-loaded runtime owner.
assert.match(loader, /lunea-archive-card-restore-v46\.js/);
assert.match(loader, /luneaArchiveCardRestoreV46Loader/);

console.log('archive card restore V46 regression contract: ok');
