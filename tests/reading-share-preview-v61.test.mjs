import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../lunea-reading-share-ui-v6.js', import.meta.url), 'utf8');

assert.match(ui, /data-horizontal-scroll="true"/, 'PNG preview track must opt out of global horizontal-drag blocking');
assert.match(ui, /touch-action:pan-x/, 'PNG preview track must explicitly allow horizontal pan gestures');
assert.match(ui, /pointer-events:none/, 'preview image should not capture the swipe gesture');
assert.match(ui, /buildOverviewCover/, 'share UI must rebuild the cover instead of reusing representative tarot cards');
assert.match(ui, /카드 이미지는 2페이지부터 중복 없이 전체 배열로 표시/, 'cover must explain that tarot artwork starts on the next page without duplication');
assert.match(ui, /coverDeduplicated:true/, 'normalized export must mark the deduplicated cover contract');

console.log('reading-share-preview-v61 contract OK');
