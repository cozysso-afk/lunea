import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-legacy-v35.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');

const positions = [
  '상대의 본능적 욕구 & 리드 성향',
  '나의 신체적 감각 & 수용 상태',
  '상대방의 성기 굵기 & 물리적 압박감',
  '내 성기의 타이트함(밀도) & 나와의 밀착감',
  '속도감 & 완급 조절(템포)',
  '체력 & 지구력(지속성)',
  '숨겨진 성적 판타지 & 페티시',
  '절정 도달 & 신체적 만족도',
  '행위 후의 여운 & 정서적 교감'
];

test('restores the original 9-card intimacy spread verbatim', () => {
  assert.match(source, /const RELEASE = '35\.1'/);
  assert.match(source, /const TITLE = '속궁합 · 19\+'/);
  for (const position of positions) assert.ok(source.includes(position), `missing legacy position: ${position}`);
  assert.match(source, /dataset\.count = '9'/);
  assert.match(source, /ORIGINAL · 9/);
});

test('legacy spread opens inside INTIMACY and preserves prompt context', () => {
  assert.match(source, /openSheet\('LOVE', TITLE, DESC, 9\)/);
  assert.match(source, /state\.category = 'INTIMACY'/);
  assert.match(source, /sheetCat\.textContent = 'INTIMACY 18\+'/);
  assert.match(source, /fixedPositions = wrapped/);
});

test('cabinet polish is scoped and mobile-aware', () => {
  assert.match(source, /\.lunea-intimacy-category \.reading-item/);
  assert.match(source, /\.lunea-intimacy-legacy9/);
  assert.match(source, /@media\(max-width:430px\)/);
});

test('structural loader owns the legacy layer in both loading paths', () => {
  assert.equal((loader.match(/lunea-intimacy-legacy-v35\.js\?v=351/g) || []).length, 2);
});

console.log('LUNEA INTIMACY original 9-card restore / cabinet polish V35.1: PASS');
