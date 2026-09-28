import assert from 'node:assert/strict';
import fs from 'node:fs';

const oraclePages = fs.readFileSync(new URL('../lunea-reading-share-oracle-pages-v1.js', import.meta.url), 'utf8');
const owner = fs.readFileSync(new URL('../lunea-reading-share-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');

assert.match(oraclePages, /const original=await own\.renderFiles\(\)/, 'standalone flow must recover the owner Oracle pages');
assert.match(oraclePages, /if \(timing\) pages\.push\(timing\)/, 'Timing Oracle must be appended as its own page');
assert.match(oraclePages, /if \(message\) pages\.push\(message\)/, 'Message Oracle must be appended as its own page');
assert.match(oraclePages, /if \(intimacy\) pages\.push\(intimacy\)/, 'INTIMACY Oracle must be appended as its own page');
assert.match(owner, /async function timingPage\(/, 'owner must retain the full Timing Oracle renderer');
assert.match(owner, /async function messagePage\(/, 'owner must retain the full Message Oracle renderer');
assert.match(owner, /async function intimacyPage\(/, 'owner must retain the full INTIMACY Oracle renderer');
assert.match(loader, /lunea-reading-share-oracle-pages-v1\.js/, 'runtime must use the standalone Oracle page wrapper');
assert.doesNotMatch(loader, /message-content-v1/, 'compact Message Oracle text overlay must no longer own runtime output');
assert.doesNotMatch(loader, /single-support-v1/, 'compact support enlargement must no longer own runtime output');

console.log('reading-share readable standalone Oracle export contract OK');
