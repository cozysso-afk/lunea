import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {webkit, chromium} from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = process.env.LUNEA_E2E_BROWSER === 'chromium'
  ? await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox']})
  : await webkit.launch({headless:true});
const failures = [];

async function setup() {
  const context = await browser.newContext({viewport:{width:393,height:852}, isMobile:true, hasTouch:true, locale:'ko-KR', serviceWorkers:'block'});
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/*', route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === new URL(url).origin) return route.continue();
    return route.fulfill({status:200, contentType:requestUrl.pathname.endsWith('.css') ? 'text/css' : 'application/json', body:requestUrl.hostname.includes('fonts') ? '' : '{}'});
  });
  if (process.env.LUNEA_TEST_BASELINE === '1') {
    for (const file of ['lunea-timing-ab-inline-v16.js', 'lunea-thai-tarot-bridge-v32.js', 'lunea-horary-balance-v19-5.js', 'lunea-intimacy-ai-bridge-v34.js', 'lunea-intimacy-repair-v43.js']) {
      const source = execFileSync('git', ['show', `origin/main:${file}`], {encoding:'utf8'});
      await page.route(`**/${file}?*`, route => route.fulfill({status:200, contentType:'application/javascript', body:source}));
    }
  }
  await page.addInitScript(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1', '1');
    localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1', '1');
  });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.LUNEA_INTIMACY_ORACLE_UI_V36?.version === '36.6' && window.LUNEA_THAI_RANGE_V33 && window.LUNEA_HORARY_TOPIC_V19 && window.LUNEA_TIMING_AB && window.LUNEA_INTIMACY_REPAIR_V43);
  return {context, page};
}

async function draw(page, category, question) {
  await page.evaluate(cat => {
    const item = cat === 'INTIMACY'
      ? document.querySelector('.reading-item[data-title="신체적 속궁합 · CORE 5"]')
      : [...document.querySelectorAll(`.reading-item[data-cat="${cat}"]`)].find(node => Number(node.dataset.count) > 0 && !node.dataset.luneaManual);
    if (!item) throw new Error('Reading entry missing: ' + cat);
    item.click();
  }, category);
  await page.locator('#question').fill(question);
  await page.locator('#drawBtn').dispatchEvent('click');
  await page.waitForFunction(() => document.getElementById('spreadOverlay')?.classList.contains('show') && state.drawn?.length > 0);
}

async function check(name, fn) {
  if (process.env.LUNEA_E2E_CASE && !name.startsWith(process.env.LUNEA_E2E_CASE)) return;
  const {context, page} = await setup();
  try { await fn(page); console.log('PASS:', name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL:', name, error.message); }
  finally { await context.close(); }
}

try {
  await check('A/B support shows two real, correctly matched card images', async page => {
    await draw(page, 'LOVE', 'A와 B 두 사람은 각각 언제 나에게 연락할까요?');
    await page.evaluate(() => document.getElementById('timingSupportBtn').click());
    await page.waitForFunction(() => document.getElementById('timingOverlay')?.classList.contains('show'));
    await page.locator('#timingDraw').dispatchEvent('click');
    await page.waitForFunction(() => window.LUNEA_TIMING_AB_LAST?.A && window.LUNEA_TIMING_AB_LAST?.B);
    // Wait on the result block, not on images: the baseline intentionally has no images.
    await page.waitForSelector('#luneaTimingABInline .lunea-tabi-card');
    await page.waitForTimeout(1000);
    const result = await page.evaluate(() => ({
      drawn:[window.LUNEA_TIMING_AB_LAST.A.id, window.LUNEA_TIMING_AB_LAST.B.id],
      images:[...document.querySelectorAll('#luneaTimingABInline img')].map(img => ({id:img.dataset.luneaTimingCardId, src:img.src, loaded:img.complete && img.naturalWidth > 0, fit:getComputedStyle(img).objectFit})),
      labels:[...document.querySelectorAll('#luneaTimingABInline .lunea-tabi-ko')].map(node => node.textContent)
    }));
    assert.equal(result.images.length, 2, 'main spread must contain actual images, not decorative Moon Dials');
    assert.deepEqual(result.images.map(img => img.id), result.drawn);
    assert.ok(result.images.every(img => img.loaded && /assets\/timing-oracle\/cards\//.test(img.src) && img.fit === 'contain'), JSON.stringify(result));
    assert.equal(result.labels.length, 2);
    await page.evaluate(() => document.getElementById('timingClose').click());
    assert.equal(await page.locator('#luneaTimingABInline img').count(), 2, 'images remain after support overlay closes');
  });

  await check('Thai support/range and Horary inherit the exact LOVE question, preserving manual selection', async page => {
    const requests = [];
    await page.route(/\/v1\/thai\/taksa(?:\/range)?(?:\?|$)/, async route => {
      const body = route.request().postDataJSON(); requests.push({url:route.request().url(), body});
      const response = route.request().url().includes('/range')
        ? {schema:'LUNEA_THAI_TAKSA_RANGE_V1', start_date:body.start_iso, days:body.days, summary:{}, calendar:[]}
        : {schema:'LUNEA_THAI_TAKSA_V1', birth:{}, grid:[], question:{topic:body.topic, focus_rows:[]}};
      await route.fulfill({status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify(response)});
    });
    await draw(page, 'LOVE', '그는 나를 어떻게 생각할까?');
    await page.evaluate(() => {
      localStorage.setItem('LUNEA_ASTRO_NATAL_V3', JSON.stringify({birth:{}}));
      localStorage.setItem('LUNEA_ASTRO_API_URL', location.origin);
      window.LUNEA_THAI_TAROT_BRIDGE_V32.run();
    });
    await page.waitForFunction(() => !!window.LUNEA_THAI_TAROT_BRIDGE_V32.getResult());
    await page.evaluate(() => window.LUNEA_THAI_RANGE_V33.openTarot());
    await page.locator('#luneaThaiTarotRangeRun').dispatchEvent('click');
    await page.waitForFunction(() => !!window.LUNEA_THAI_RANGE_V33.getTarotResult());
    assert.equal(requests.length, 2);
    assert.ok(requests.every(request => request.body.topic === '연애'), JSON.stringify(requests));
    await page.evaluate(() => document.getElementById('luneaThaiRangeClose').click());
    await page.evaluate(() => document.getElementById('astroHoraryBtn').click());
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#astroHoraryTopic').inputValue(), 'relationship');
    // A real keyboard change is trusted. selectOption() dispatches a synthetic
    // change, which the production manual-override guard intentionally ignores.
    await page.locator('#astroHoraryTopic').focus();
    await page.keyboard.press('Home');
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.evaluate(() => window.LUNEA_HORARY_TOPIC_V19.syncTopic());
    assert.equal(await page.locator('#astroHoraryTopic').inputValue(), 'career', 'manual topic selection must win');
    await page.evaluate(() => {
      document.getElementById('astroHoraryClose').click();
      document.getElementById('horaryStandaloneItem').click();
    });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#astroHoraryTopic').inputValue(), 'general', 'standalone must not inherit the old LOVE sector');
    await page.locator('#astroHoraryQuestion').fill('취업은 언제 할 수 있을까?');
    assert.equal(await page.locator('#astroHoraryTopic').inputValue(), 'career');
  });

  await check('INTIMACY Oracle cannot reappear in DAILY after reveal, DOM mutations or pageshow', async page => {
    await draw(page, 'INTIMACY', '그와의 신체적 속궁합은 어떨까?');
    await page.waitForFunction(() => window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().cards.length > 0);
    assert.equal(await page.locator('#luneaIntimacyOraclePanel').evaluate(node => node.hidden), false);
    await page.evaluate(() => {
      document.getElementById('luneaOracleRevealAll')?.click();
      document.querySelector('[data-close="spread"]').click();
      document.getElementById('dailyBtn').click();
    });
    await page.waitForFunction(() => state.category === 'DAILY' && state.drawn?.length > 0);
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await page.waitForTimeout(3500);
    const result = await page.evaluate(() => ({
      category:state.category, active:!!window.__LUNEA_INTIMACY_ACTIVE__,
      body:document.body.classList.contains('lunea-intimacy-reading'),
      hidden:document.getElementById('luneaIntimacyOraclePanel')?.hidden,
      children:document.getElementById('luneaIntimacyOraclePanel')?.childElementCount,
      cards:window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().cards.length,
      saved:!!localStorage.getItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1')
    }));
    assert.equal(result.category, 'DAILY');
    assert.equal(result.active, false); assert.equal(result.body, false);
    assert.equal(result.hidden, true); assert.equal(result.children, 0); assert.equal(result.cards, 0);
    assert.equal(result.saved, true, 'leaving must not delete saved Oracle data');
  });

  await check('INTIMACY to ordinary LOVE preserves sector and clears Oracle memory', async page => {
    await draw(page, 'INTIMACY', '그와의 신체적 속궁합은 어떨까?');
    await page.waitForFunction(() => window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().cards.length > 0);
    await page.evaluate(() => document.querySelector('[data-close="spread"]').click());
    await draw(page, 'LOVE', '그는 나를 어떻게 생각할까?');
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => state.category), 'LOVE');
    assert.equal(await page.evaluate(() => window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().cards.length), 0);
    assert.equal(await page.locator('#luneaIntimacyOraclePanel').evaluate(node => node.hidden), true);
  });
  assert.deepEqual(failures, [], 'Mobile Oracle regressions failed:\n' + failures.join('\n'));
} finally {
  await browser.close();
}
