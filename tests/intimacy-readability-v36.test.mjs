import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-readability-v36.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const icon = fs.readFileSync(new URL('../assets/intimacy-oracle/intimacy_sector_v37.svg', import.meta.url), 'utf8');

test('INTIMACY uses a category-style rounded-square celestial artwork asset', () => {
  assert.match(source, /const RELEASE = '36\.1'/);
  assert.match(source, /intimacy_sector_v37\.svg/);
  assert.match(source, /lunea-intimacy-sector-art-v37/);
  assert.match(source, /border-radius:22px!important/);
  assert.match(source, /object-fit:cover!important/);
  assert.match(icon, /viewBox="0 0 180 180"/);
  assert.match(icon, /radialGradient id="opal"/);
  assert.match(icon, /linearGradient id="roseGold"/);
});

test('mobile spread cards reserve space for count pills instead of overlapping text', () => {
  assert.match(source, /padding:15px 58px 15px 15px!important/);
  assert.match(source, /top:14px!important/);
  assert.match(source, /transform:none!important/);
  assert.match(source, /-webkit-line-clamp:3!important/);
  assert.match(source, /font-size:11\.7px!important/);
});

test('direct and AI text badges are distinguished from numeric count circles', () => {
  assert.match(source, /lunea-count-label/);
  assert.match(source, /!\/\^\\d\+\$\//);
  assert.match(source, /min-width:45px!important/);
});

test('structural loader loads readability repair after legacy INTIMACY layer in both paths', () => {
  const legacy = 'lunea-intimacy-legacy-v35.js';
  const repair = 'lunea-intimacy-readability-v36.js?v=3601';
  assert.equal((loader.match(/lunea-intimacy-readability-v36\.js\?v=3601/g) || []).length, 2);
  const firstLegacy = loader.indexOf(legacy);
  const firstRepair = loader.indexOf(repair);
  const lastLegacy = loader.lastIndexOf(legacy);
  const lastRepair = loader.lastIndexOf(repair);
  assert.ok(firstLegacy >= 0 && firstRepair > firstLegacy);
  assert.ok(lastLegacy >= 0 && lastRepair > lastLegacy);
});

console.log('LUNEA INTIMACY readability / category artwork V36.1: PASS');
