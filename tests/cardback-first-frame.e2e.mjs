import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});

async function verify(label, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  try {
    await page.goto(url, {waitUntil:'domcontentloaded', timeout:30000});
    await page.waitForFunction(() => typeof makeCardWrapper === 'function' && typeof deckBackFile === 'function', null, {timeout:15000});
    const rows = await page.evaluate(() => {
      const cases = [
        ['DAILY','tarot_back_general.jpeg'],
        ['GENERAL','tarot_back_general.jpeg'],
        ['LOVE','tarot_back_love.jpeg'],
        ['STOCK','tarot_back_stock.jpeg'],
        ['CAREER','tarot_back_career_study.jpeg'],
        ['STUDY','tarot_back_career_study.jpeg'],
        ['INTIMACY','assets/intimacy-oracle/tarot_back_intimacy_final.png']
      ];
      return cases.map(([category, expected], index) => {
        state.category = category;
        const wrapper = makeCardWrapper(900 + index, TAROT_DECK[0], false);
        const img = wrapper.querySelector('.back > img');
        return {
          category, expected,
          src: img?.getAttribute('src') || '',
          marker: img?.dataset?.luneaCardbackFirstFrame || ''
        };
      });
    });
    for (const row of rows) {
      const cleanSrc = row.src.split(/[?#]/)[0].replace(/^\.\//,'');
      assert.equal(cleanSrc, row.expected, label + ' ' + row.category + ': wrong first-frame back');
      assert.equal(row.marker, '1', label + ' ' + row.category + ': first-frame marker missing');
      assert.doesNotMatch(cleanSrc, /^back_(?:daily|love|stock|career|general)\.PNG$/i, label + ' ' + row.category + ': legacy back flashed first');
    }
  } finally {
    await context.close();
  }
}

try {
  await verify('desktop-webkit');
  await verify('iphone-webkit', {
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
    viewport:{width:390,height:844},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true
  });
  console.log('Tarot card-back first-frame WebKit E2E: PASS');
} finally {
  await browser.close();
}
