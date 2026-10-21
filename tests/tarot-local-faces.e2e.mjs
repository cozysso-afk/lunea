import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless: true});

async function verify(label, options = {}) {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 30_000});
    await page.waitForFunction(() => typeof startSpread === 'function' && TAROT_DECK?.length === 78);
    await page.evaluate(() => {
      state.category = 'LOVE';
      state.allowReversed = false;
      startSpread('카드 이미지 확인', ['1','2','3','4','5','6','7'], 'RWS FACE TEST');
    });
    await page.waitForFunction(() => {
      const faces = [...document.querySelectorAll('#cards .front > img')];
      return faces.length === 7 && faces.every(img => img.complete && img.naturalWidth > 0);
    }, null, {timeout: 25_000});
    const srcs = await page.locator('#cards .front > img').evaluateAll(imgs => imgs.map(x => x.getAttribute('src')));
    assert.ok(srcs.every(s => /^assets\/rws\/[^/]+\.jpg$/.test(s)), label + ': remote card face');
    const backs = await page.locator('#cards .back > img').count();
    assert.equal(backs, 7, label + ': card backs not present');

    await page.locator('#flipAll').evaluate(button => button.click());
    await page.waitForFunction(() => document.querySelectorAll('#cards .tarot-card.flipped').length === 7,
      null, {timeout: 10_000});

    // An impossible image URL must show the card name, not a blank white card.
    const img = page.locator('#cards .front > img').first();
    await img.evaluate(el => el.src = './assets/rws/__missing__.jpg');
    await page.waitForFunction(() => document.querySelector('#cards .front')?.classList.contains('lunea-card-art-missing'));
    const fallback = await page.locator('#cards .front .lunea-card-art-fallback').first();
    assert.ok((await fallback.textContent()).trim().length > 2, label + ': empty fallback');

    assert.ok(!errors.some(s => /tarot|card|flip/i.test(s)), label + ': unexpected runtime error: ' + errors.join('; '));
    console.log(label + ': PASS (seven local face images, flip all, readable fallback)');
  } finally {
    await ctx.close();
  }
}

try {
  await verify('desktop-webkit');
  await verify('iphone-webkit', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
    viewport: {width: 390,height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true
  });
} finally {
  await browser.close();
}
