import fs from 'node:fs';
import assert from 'node:assert/strict';

const context = fs.readFileSync(new URL('../lunea-reading-context-v1.js', import.meta.url), 'utf8');
const boot = fs.readFileSync(new URL('../lunea-boot-reveal-v29.js', import.meta.url), 'utf8');

for (const label of ['솔로','썸','짝사랑','재회','연애중','기혼']) {
  assert.ok(context.includes(`'${label}'`) || context.includes(label), `missing love status: ${label}`);
}

assert.match(context, /복수 선택 가능/);
assert.match(context, /소개팅 · 새 인연 · 새로운 만남 포함/);
assert.match(context, /여러 상태를 하나의 '연애운' 문단으로 합치거나/);
assert.match(context, /먼저 「대인관계」를 별도 소제목으로 해석한다/);
assert.match(context, /\[\['AUTO', '자동 분류'\], \.\.\.TIMING_SECTORS\]/);
assert.match(context, /기본은 질문을 보고 자동 분류해요/);
assert.match(context, /기본은 자동 분류예요/);
assert.match(context, /data-context="AUTO"/);
assert.match(boot, /lunea-reading-context-v1\.js\?v=20260922-1/);

console.log('daily love / oracle context contract: PASS');
