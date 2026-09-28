import assert from 'node:assert/strict';
import {webkit} from 'playwright';

const baseURL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const expected = ['general','love','career','stock','timing','intimacy','signal','divider','lenormand','meihua','horary','thai'];
const browser = await webkit.launch({headless:true});
const context = await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:3});
const page = await context.newPage();

const delayed = new Map([
  ['lunea-lenormand-v1.js', 180],
  ['lunea-meihua-v1.js', 320],
  ['lunea-mobile-interaction-hotfix-v1.js', 120],
  ['lunea-thai-standalone-v24.js', 260],
]);
await page.route('**/*.js*', async route => {
  const pathname = new URL(route.request().url()).pathname;
  const wait = [...delayed].find(([name]) => pathname.endsWith(`/${name}`))?.[1] || 0;
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  await route.continue();
});

function orderInPage() {
  const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
  if (!grid) return [];
  return [...grid.children].map(node => {
    if (node.id === 'luneaSignalMessageSection') return 'signal';
    if (node.classList.contains('lunea-v36-system-divider')) return 'divider';
    if (node.classList.contains('lunea-thai-home-tile')) return 'thai';
    return node.dataset.key || '';
  }).filter(Boolean);
}

async function waitForStableOrder(label) {
  await page.waitForFunction(wanted => {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid) return false;
    const actual = [...grid.children].map(node => {
      if (node.id === 'luneaSignalMessageSection') return 'signal';
      if (node.classList.contains('lunea-v36-system-divider')) return 'divider';
      if (node.classList.contains('lunea-thai-home-tile')) return 'thai';
      return node.dataset.key || '';
    }).filter(Boolean);
    return JSON.stringify(actual.slice(0, wanted.length)) === JSON.stringify(wanted);
  }, expected, {timeout:20000});
  const actual = await page.evaluate(orderInPage);
  assert.deepEqual(actual.slice(0, expected.length), expected, label);
  assert.equal(actual.indexOf('intimacy'), actual.indexOf('timing') + 1, `${label}: TIMING and INTIMACY must remain adjacent`);
  assert.ok(actual.indexOf('meihua') > actual.indexOf('divider'), `${label}: MEIHUA must remain in secondary systems`);
}

try {
  await page.goto(baseURL, {waitUntil:'domcontentloaded', timeout:30000});
  await page.waitForFunction(() => !!window.LUNEA_HOME_LAYOUT_V36, {timeout:20000});

  // A + F: first entry remains deterministic even when secondary scripts arrive late.
  await waitForStableOrder('initial delayed load');

  // B: enter and leave another system modal.
  await page.click('#luneaHomePortalV8 [data-key="lenormand"]');
  await page.waitForSelector('#luneaLenormandOverlay.show');
  await page.click('#lnClose');
  await page.waitForSelector('#luneaLenormandOverlay', {state:'hidden', timeout:3000});
  await waitForStableOrder('modal return');

  // C: BFCache-style pageshow.
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true})));
  await waitForStableOrder('pageshow');

  // D: hidden -> visible lifecycle.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable:true, value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', {configurable:true, value:false});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await waitForStableOrder('visibility return');

  // F: the owner must absorb genuinely late, scrambled secondary tiles.
  await page.evaluate(async () => {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    const tiles = ['meihua','thai','lenormand','horary'].map(key =>
      key === 'thai' ? grid.querySelector('.lunea-thai-home-tile') : grid.querySelector(`[data-key="${key}"]`)
    );
    tiles.forEach(tile => tile.remove());
    window.LUNEA_HOME_LAYOUT_V36.requestLayout();
    for (const tile of tiles) {
      await new Promise(resolve => setTimeout(resolve, 45));
      grid.appendChild(tile);
      window.dispatchEvent(new CustomEvent('lunea:home-tile-ready', {detail:{key:tile.dataset.key}}));
    }
  });
  await waitForStableOrder('late secondary tiles');

  // E: repeated restore events must neither duplicate nor move tiles.
  for (let index = 0; index < 6; index += 1) {
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitForStableOrder(`repeat ${index + 1}`);
  }

  const diagnostics = await page.evaluate(() => {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    const primary = grid.querySelector('[data-key="general"]');
    const secondary = grid.querySelector('[data-key="meihua"]');
    const daily = document.querySelector('.daily.lunea-daily-orbit6');
    const signalTitle = document.querySelector('#luneaSignalMessageSection .cat-text h3');
    const thai = grid.querySelector('[data-key="thai"]');
    const thaiTitle = thai?.querySelector('.thai-v24-copy b');
    const thaiSub = thai?.querySelector('.thai-v24-copy span');
    const primaryStyle = getComputedStyle(primary);
    const secondaryStyle = getComputedStyle(secondary);
    const signalAfter = signalTitle ? getComputedStyle(signalTitle, '::after') : null;
    const thaiTitleStyle = thaiTitle ? getComputedStyle(thaiTitle) : null;
    const thaiSubStyle = thaiSub ? getComputedStyle(thaiSub) : null;
    const thaiRect = thai?.getBoundingClientRect();
    const thaiTitleRect = thaiTitle?.getBoundingClientRect();
    const thaiSubRect = thaiSub?.getBoundingClientRect();
    return {
      v36:document.documentElement.classList.contains('lunea-home-visual-v36'),
      oldV35:document.documentElement.classList.contains('lunea-home-ia-v35'),
      version:window.LUNEA_HOME_LAYOUT_V36?.version,
      dividerCount:grid.querySelectorAll('.lunea-v36-system-divider').length,
      keys:[...grid.querySelectorAll('[data-key]')].map(node => node.dataset.key),
      primaryBackground:primaryStyle.backgroundImage,
      primaryBackdrop:primaryStyle.webkitBackdropFilter || primaryStyle.backdropFilter,
      primaryAnimation:getComputedStyle(primary, '::before').animationDuration,
      primaryAuroraZ:getComputedStyle(primary, '::before').zIndex,
      secondaryAnimation:getComputedStyle(secondary, '::before').animationDuration,
      signalText:signalTitle?.textContent?.trim() || '',
      signalAfterContent:signalAfter?.content || '',
      thaiTitleWhiteSpace:thaiTitleStyle?.whiteSpace || '',
      thaiTitleOverflow:thaiTitleStyle?.overflow || '',
      thaiSubWhiteSpace:thaiSubStyle?.whiteSpace || '',
      thaiSubOverflow:thaiSubStyle?.overflow || '',
      thaiTitleContained:!!(thaiRect && thaiTitleRect && thaiTitleRect.right <= thaiRect.right + .5),
      thaiSubContained:!!(thaiRect && thaiSubRect && thaiSubRect.right <= thaiRect.right + .5),
      thaiStacked:!!(thaiTitleRect && thaiSubRect && thaiTitleRect.bottom <= thaiSubRect.top + 1),
      dailyPresent:!!daily,
      dailyClass:document.documentElement.classList.contains('lunea-daily-celestial-v22'),
    };
  });
  assert.equal(diagnostics.v36, true);
  assert.equal(diagnostics.oldV35, false);
  assert.equal(diagnostics.version, 36.1);
  assert.equal(diagnostics.dividerCount, 1, 'restore events must not duplicate the divider');
  for (const key of ['general','love','career','stock','timing','intimacy','lenormand','meihua','horary','thai']) {
    assert.equal(diagnostics.keys.filter(value => value === key).length, 1, `${key} tile must not duplicate`);
  }
  assert.match(diagnostics.primaryBackground, /radial-gradient/);
  assert.notEqual(diagnostics.primaryBackdrop, 'none');
  assert.equal(diagnostics.primaryAnimation, '12s');
  assert.equal(diagnostics.primaryAuroraZ, '0', 'aurora must remain in the visible glass stack');
  assert.equal(diagnostics.secondaryAnimation, '14s');
  assert.equal(diagnostics.signalText, 'SIGNAL · MESSAGE', 'SIGNAL must render one canonical title');
  assert.ok(diagnostics.signalAfterContent === 'none' || diagnostics.signalAfterContent === 'normal', 'SIGNAL pseudo title must be removed');
  assert.equal(diagnostics.thaiTitleWhiteSpace, 'nowrap', 'Thai title must not wrap into its description');
  assert.equal(diagnostics.thaiTitleOverflow, 'hidden', 'Thai title must stay inside the card');
  assert.equal(diagnostics.thaiSubWhiteSpace, 'nowrap', 'Thai description must remain one contained line');
  assert.equal(diagnostics.thaiSubOverflow, 'hidden', 'Thai description must stay inside the card');
  assert.equal(diagnostics.thaiTitleContained, true, 'Thai title must not escape the tile');
  assert.equal(diagnostics.thaiSubContained, true, 'Thai description must not escape the tile');
  assert.equal(diagnostics.thaiStacked, true, 'Thai title and description must not overlap');
  assert.equal(diagnostics.dailyPresent, true);
  assert.equal(diagnostics.dailyClass, true, 'DAILY ORBIT celestial layer must remain active');

  const reduced = await browser.newContext({viewport:{width:393,height:852}, reducedMotion:'reduce'});
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(baseURL, {waitUntil:'domcontentloaded', timeout:30000});
  await reducedPage.waitForFunction(() => !!window.LUNEA_HOME_LAYOUT_V36 && !!document.querySelector('[data-key="general"]'), {timeout:20000});
  const reducedAnimation = await reducedPage.$eval('[data-key="general"]', node => getComputedStyle(node, '::before').animationName);
  assert.equal(reducedAnimation, 'none', 'reduced motion must stop V36 aurora animation');
  await reduced.close();

  console.log('Home layout and Visual V36.1 iPhone WebKit E2E passed');
} finally {
  await browser.close();
}
