import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const context = await browser.newContext({
  viewport:{width:393,height:852},
  isMobile:true,
  hasTouch:true,
  deviceScaleFactor:3,
  reducedMotion:'reduce',
  locale:'ko-KR',
  serviceWorkers:'block',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on('dialog', dialog => dialog.accept());

await context.route(/https:\/\/fonts\.googleapis\.com\//, route => route.fulfill({status:200,contentType:'text/css',body:''}));
await context.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//, route => route.fulfill({status:204,body:''}));
await context.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"ok":true}'}));

try {
  await page.goto(BASE_URL, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.classList.contains('lunea-ui-ready'));
  await page.waitForSelector('.lunea-intimacy-category .category-content');
  await page.waitForFunction(() => {
    const content = document.querySelector('.lunea-intimacy-category .category-content');
    return !!content?.querySelector('[data-intimacy-ai="1"]') && !!content?.querySelector('[data-manual-spread="1"]');
  });

  const order = await page.evaluate(() => {
    const content = document.querySelector('.lunea-intimacy-category .category-content');
    return [...content.querySelectorAll(':scope > .reading-item')]
      .filter(el => !el.hidden && getComputedStyle(el).display !== 'none')
      .slice(0,2)
      .map(el => el.dataset.intimacyAi === '1' ? 'AI' : (el.dataset.manualSpread === '1' ? 'MANUAL' : 'OTHER'));
  });
  assert.deepEqual(order, ['AI','MANUAL'], 'INTIMACY must expose AI then direct-input rows');

  await page.locator('.lunea-intimacy-category [data-manual-spread="1"]').evaluate(el => el.click());
  await page.waitForSelector('#sheet.open');
  await page.waitForSelector('#luneaManualPanel.show');

  const state = await page.evaluate(() => {
    let s = null;
    try { s = state; } catch {}
    return {
      category:String(s?.category || ''),
      manualMode:!!s?.__luneaManualMode,
      intimacy:!!s?.__luneaIntimacyReading,
      positionsVisible:!!document.getElementById('luneaManualPositions')?.offsetParent,
      label:document.getElementById('drawLabel')?.textContent || ''
    };
  });
  assert.equal(state.category, 'INTIMACY');
  assert.equal(state.manualMode, true);
  assert.equal(state.intimacy, true);
  assert.equal(state.positionsVisible, true);
  assert.match(state.label, /직접 배열로 카드 펼치기/);

  console.log('INTIMACY manual entry WebKit E2E: OK');
} finally {
  await browser.close();
}
