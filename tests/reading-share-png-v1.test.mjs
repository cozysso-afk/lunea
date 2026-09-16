import assert from 'node:assert/strict';
import fs from 'node:fs';

const share = fs.readFileSync(new URL('../lunea-reading-share-v1.js', import.meta.url), 'utf8');
const cache = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');
const touch = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

assert.match(share, /BW=1080,BH=1350/, 'share pages must stay 4:5 at 1080x1350');
assert.match(share, /LUNEA_READING_ATTACHMENTS_V1\?\.captureArchive/, 'exact-reading support attachments must be captured');
assert.match(share, /LUNEA_INTIMACY_ORACLE_UI_V36\?\.serializeOracle/, 'INTIMACY Oracle must be captured');
assert.match(share, /assets\/intimacy-oracle\/cards/, 'INTIMACY artwork root must be used');
assert.match(share, /message_oracle_front_frame\.jpeg/, 'Message Oracle approved frame must be rendered');
assert.match(share, /LUNEA_MESSAGE_ORACLE_V1\?\.identity/, 'Message Oracle RWS identity artwork must be resolved');
assert.match(share, /LUNEA_RECOVERY_UI_V65\?\.artworkForCard/, 'Timing Oracle authoritative artwork resolver must be used');
assert.match(share, /filename/, 'generic image-bearing support data must accept filenames');
assert.match(share, /commons\.wikimedia\.org\/w\/api\.php/, 'RWS export must resolve Commons Special:FilePath through the CORS-capable MediaWiki API');
assert.match(share, /searchParams\.set\('origin','\*'\)/, 'Commons image lookup must opt into cross-origin API access');
assert.match(share, /searchParams\.set\('prop','imageinfo'\)/, 'Commons image lookup must request direct image URLs');
assert.match(share, /async function assertTarotArtwork/, 'PNG export must preflight tarot artwork rather than silently saving blank card frames');
assert.match(share, /if\(count<=6\)return\{cols:3/, 'up to six tarot cards must use the roomier 3-column share layout');
assert.match(share, /p\.tarot\.slice\(0,3\)/, 'share cover must use three larger representative cards');
assert.match(share, /navigator\.share\(\{files:fs/, 'native file share sheet must be used');
assert.match(share, /공유창 열기/, 'share must be a second explicit user tap');
assert.match(share, /PNG 만드는 중/, 'PNG rendering must happen before the share-sheet tap');
assert.match(cache, /lunea-reading-share-v1\.js/, 'cache owner must load the PNG share module');
assert.doesNotMatch(touch, /lunea-reading-share-png-v1\.js/, 'horizontal touch helper must not load the retired duplicate PNG share owner');
assert.match(touch, /#luneaShareReadingPng\s*\{[\s\S]*?order:9999!important/, 'PNG share action must stay at the very end of the reading action grid');

console.log('reading-share-png-v1 contract OK');
