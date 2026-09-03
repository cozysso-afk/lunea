import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-legacy-v35.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

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
  assert.match(source, /const RELEASE = '35\.2'/);
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

test('INTIMACY has a dedicated sector mark and restrained palette', () => {
  assert.match(source, /lunea-intimacy-sector-mark/);
  assert.match(source, /lunea-intimacy-orbit/);
  assert.match(source, /lunea-intimacy-star/);
  assert.match(source, /--intimacy-wine:#8f3f68/);
  assert.match(source, /--intimacy-lilac:#a995e6/);
  assert.match(source, /installSectorMark\(category\)/);
});

test('cabinet motion is scoped, staggered, mobile-aware and reduced-motion safe', () => {
  assert.match(source, /\.lunea-intimacy-category \.reading-item/);
  assert.match(source, /\.lunea-intimacy-legacy9/);
  assert.match(source, /@keyframes luneaIntimacySweep/);
  assert.match(source, /@keyframes luneaIntimacyBreath/);
  assert.match(source, /@keyframes luneaIntimacyRise/);
  assert.match(source, /animation-delay:\.245s/);
  assert.match(source, /@media\(max-width:430px\)/);
  assert.match(source, /@media\(prefers-reduced-motion:reduce\)/);
});

test('loader and release cache workflow own the restored intimacy layer', () => {
  assert.equal((loader.match(/lunea-intimacy-legacy-v35\.js\?v=[^'"\],]+/g) || []).length, 2);
  assert.match(workflow, /'lunea-intimacy-legacy-v35\.js'/);
});

console.log('LUNEA INTIMACY original 9-card restore / sector branding V35.2: PASS');
