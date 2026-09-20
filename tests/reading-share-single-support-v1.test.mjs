import assert from 'node:assert/strict';
import fs from 'node:fs';

const oraclePages = fs.readFileSync(new URL('../lunea-reading-share-oracle-pages-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');

assert.doesNotThrow(() => new Function(oraclePages), 'standalone Oracle share pages must remain valid JavaScript');
assert.match(oraclePages, /function oraclePageIndexes\(payload\)/, 'Oracle page positions must be derived from the owner output');
assert.match(oraclePages, /payload\?\.a\?\.timing/, 'Timing Oracle must get a dedicated page');
assert.match(oraclePages, /payload\?\.a\?\.messageOracle/, 'Message Oracle must get a dedicated page');
assert.match(oraclePages, /payload\?\.intimacy\?\.cards\?\.length/, 'INTIMACY Oracle must get a dedicated page');
assert.match(oraclePages, /standaloneOraclePages:true/, 'final compose result must mark standalone Oracle pagination');
assert.match(oraclePages, /extraPages\(tarot\.filter\(isExtra\)\)/, 'additional Tarot cards must remain separate from Oracle pages');

assert.match(loader, /lunea-reading-share-oracle-pages-v1\.js/, 'stable share loader must load standalone Oracle pagination');
assert.ok(
  loader.indexOf('lunea-reading-share-oracle-pages-v1.js') < loader.indexOf('lunea-reading-share-ui-v6.js'),
  'standalone Oracle pagination must load before Share UI V6'
);
assert.doesNotMatch(loader, /lunea-reading-share-single-support-v1\.js/, 'retired single-cell enlargement must stay disconnected');
assert.doesNotMatch(loader, /lunea-reading-share-message-content-v1\.js/, 'retired compact Message Oracle renderer must stay disconnected');

console.log('reading-share standalone Oracle pages contract OK');
