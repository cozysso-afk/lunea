import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const action = read('lunea-reading-action-order-v33.js');
const burgundy = read('lunea-intimacy-burgundy-v40.js');
const loader = read('lunea-structural-routing-v4.js');

const homeIcon = new URL('../assets/intimacy-oracle/intimacy_sector_final.png', import.meta.url);

test('reading action grid starts with flip-all while preserving the approved main controls', () => {
  assert.match(action, /LUNEA READING ACTION ORDER V33\.6/);
  assert.match(action, /version:'33\.6'/);
  const order = ['flipAll','extraCard','saveReading','luneaShareReadingPng','retry','timingSupportBtn','luneaMessageOracleSupportBtn','astroTransitBtn','astroReturnBtn','astroHoraryBtn','thaiTaksaBtn','luneaThaiTarotRangeBtn','aiRead','luneaTopCopyPrompt'];
  for (let i = 0; i < order.length - 1; i += 1) {
    assert.ok(action.indexOf(`'${order[i]}'`) < action.indexOf(`'${order[i+1]}'`), `bad order around ${order[i]}`);
  }
});

test('every reading gets a top prompt-copy control that delegates to the existing master copy path', () => {
  assert.match(action, /TOP_COPYBOX_ID = 'luneaTopPromptCopyBox'/);
  assert.match(action, /TOP_COPY_ID = 'luneaTopCopyPrompt'/);
  assert.match(action, /top\.textContent = '📋 마스터 리딩 프롬프트 복사'/);
  assert.match(action, /const live = document\.getElementById\('copyPrompt'\)/);
  assert.match(action, /live\.click\(\)/, 'top copy must delegate to the canonical bottom copy handler');
  assert.match(action, /bar\.parentNode\.insertBefore\(box, bar\)/, 'copy box must sit immediately above the action grid');
  assert.match(action, /ensureTopPromptCopy\(\)/);
  assert.ok(!action.includes("document.getElementById('copyPrompt').onclick"), 'canonical prompt-copy behavior must not be replaced');
});

test('opened INTIMACY list keeps the small shared heart while Home keeps the final artwork', () => {
  assert.equal(fs.existsSync(homeIcon), true);
  assert.match(burgundy, /RELEASE = '40\.5'/);
  assert.match(burgundy, /HOME_ICON_SRC = `\.\/assets\/intimacy-oracle\/intimacy_sector_final\.png/);
  assert.match(burgundy, /categoryIcon:'♡'/);
  assert.doesNotMatch(burgundy, /intimacy_sector_v37\.svg/);
  assert.doesNotMatch(burgundy, /CATEGORY_ICON_SRC/);
});

test('structural loader cache-busts the universal action module on both loading paths', () => {
  const matches = loader.match(/lunea-reading-action-order-v33\.js\?v=(?:3306|[0-9a-f]{12})/g) || [];
  assert.equal(matches.length, 2);
});