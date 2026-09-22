import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const baseURL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page = await context.newPage();

try {
  await page.goto(baseURL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(() => !!window.LUNEA_LENORMAND_V1 && !!window.LUNEA_LENORMAND_POLISH_V1,{timeout:20000});
  await page.waitForSelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]',{timeout:20000});

  const deck = await page.evaluate(() => ({
    count:window.LUNEA_LENORMAND_V1.cards.length,
    ids:window.LUNEA_LENORMAND_V1.cards.map(c=>c.id),
    images:window.LUNEA_LENORMAND_V1.cards.map(c=>c.image),
  }));
  assert.equal(deck.count,36);
  assert.equal(new Set(deck.ids).size,36);
  assert.equal(new Set(deck.images).size,36);

  await page.click('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]');
  await page.waitForSelector('#luneaLenormandOverlay.show');
  await page.waitForSelector('#lnPng',{state:'attached',timeout:5000});
  assert.equal(await page.isVisible('#lnPng'),false,'PNG action should stay hidden until a result exists');

  await page.fill('#lnQuestion','그에게서 세 달 안으로 연락이 올까요?');
  await page.click('#lnDraw');
  await page.waitForFunction(() => document.querySelectorAll('#lnCards .ln-card').length === 5);
  await page.waitForSelector('#lnPng',{state:'visible',timeout:5000});
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards .ln-card img')].every(img => img.complete && img.naturalWidth > 0),{timeout:10000});
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards .ln-card')].every(node => node.classList.contains('ln-reveal-v1')),{timeout:5000});

  const five = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#lnCards .ln-card')];
    return {
      count:cards.length,
      srcs:cards.map(node=>node.querySelector('img')?.getAttribute('src')),
      widths:cards.map(node=>node.querySelector('img')?.naturalWidth || 0),
      layout:getComputedStyle(document.querySelector('#lnCards')).display,
      overflow:getComputedStyle(document.querySelector('#lnCards')).overflowX,
      reveal:cards.every(node=>node.classList.contains('ln-reveal-v1')),
    };
  });
  assert.equal(five.count,5);
  assert.equal(new Set(five.srcs).size,5,'5-card draw must be unique');
  assert.ok(five.widths.every(Boolean),'all card images should load');
  assert.equal(five.layout,'flex','5-card mobile layout should be horizontal flex');
  assert.ok(['auto','scroll'].includes(five.overflow));
  assert.ok(five.reveal,'drawn cards should receive reveal motion class');

  const png = await page.evaluate(async () => {
    const files = await window.LUNEA_LENORMAND_POLISH_V1.renderFiles();
    return files.map(file=>({name:file.name,size:file.size,type:file.type}));
  });
  assert.ok(png.length >= 1);
  assert.ok(png.every(file=>file.type === 'image/png' && file.size > 10000));
  assert.ok(png[0].name.startsWith('lunea_lenormand_'));

  await page.click('#lnSave');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]')[0]);
  assert.ok(saved?.lenormand);
  assert.equal(saved.lenormand.cards.length,5);
  assert.equal(saved.cards.length,5);

  await page.fill('#lnQuestion','새 질문 테스트');
  await page.waitForFunction(() => window.LUNEA_LENORMAND_V1.snapshot().cards.length === 0);
  assert.equal(await page.isVisible('#lnBoard'),false,'changing question must clear old result board');

  await page.click('#lnSpreads [data-count="3"]');
  await page.click('#lnDraw');
  await page.waitForFunction(() => document.querySelectorAll('#lnCards .ln-card').length === 3);
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards img')].every(img => img.complete && img.naturalWidth > 0),{timeout:10000});
  assert.equal((await page.evaluate(() => window.LUNEA_LENORMAND_V1.snapshot().cards.length)),3);

  await page.click('#lnSpreads [data-count="9"]');
  await page.fill('#lnQuestion','9장 박스 테스트');
  await page.click('#lnDraw');
  await page.waitForFunction(() => document.querySelectorAll('#lnCards .ln-card').length === 9);
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards img')].every(img => img.complete && img.naturalWidth > 0),{timeout:10000});
  const nine = await page.evaluate(() => {
    const snap=window.LUNEA_LENORMAND_V1.snapshot();
    return {
      count:snap.cards.length,
      center:snap.structure?.center?.id,
      rows:snap.structure?.rows?.length,
      columns:snap.structure?.columns?.length,
      diagonals:snap.structure?.diagonals?.length,
      cols:getComputedStyle(document.querySelector('#lnCards')).gridTemplateColumns.split(' ').length,
    };
  });
  assert.equal(nine.count,9);
  assert.ok(nine.center);
  assert.equal(nine.rows,3);
  assert.equal(nine.columns,3);
  assert.equal(nine.diagonals,2);
  assert.equal(nine.cols,3);

  await page.click('#lnSave');
  const archiveItem = await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]')[0]);
  await page.evaluate(item => window.LUNEA_LENORMAND_POLISH_V1.openArchiveItem(item),archiveItem);
  await page.waitForSelector('#luneaLenormandArchiveOverlay.show');
  assert.equal(await page.locator('#lnArchiveCards .ln-archive-card').count(),9);
  assert.ok(await page.isVisible('#lnArchivePng'));

  await page.click('#lnArchiveClose');
  await page.click('#lnClose');
  await page.click('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]');
  await page.waitForSelector('#luneaLenormandOverlay.show');
  assert.equal(await page.inputValue('#lnQuestion'),'','home entry should open as a fresh question');
  assert.equal(await page.evaluate(() => window.LUNEA_LENORMAND_V1.snapshot().cards.length),0);

  console.log('Lenormand V1 mobile WebKit E2E passed');
} finally {
  await browser.close();
}
