import assert from 'node:assert/strict';
import fs from 'node:fs';

const horary = fs.readFileSync(new URL('../astro-horary-v1.js', import.meta.url),'utf8');
const post = fs.readFileSync(new URL('../lunea-horary-post-actions-v44.js', import.meta.url),'utf8');
const loader = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url),'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');

assert.match(horary,/future_window_v1/);
assert.match(horary,/목표기간 전 상태변화 · Future Window/);
assert.match(horary,/현재 Moon VOC를 목표기간 전체로 확장 금지/);
assert.match(horary,/current_reception_not_guaranteed_through_target/);
assert.match(post,/async function saveStandaloneHardened/);
assert.match(post,/IndexedDB Journal is the canonical full-fidelity store/);
assert.match(post,/saveStandaloneHardened\(saveButton\)/);
assert.match(post,/event\.stopImmediatePropagation/);
assert.match(index,/astro-horary-v1\.js\?v=104/);
assert.match(loader,/lunea-horary-post-actions-v44\.js\?v=442/);
console.log('Horary future-window + save V58 contract PASS');
