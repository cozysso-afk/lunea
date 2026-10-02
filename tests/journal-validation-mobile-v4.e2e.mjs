import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const BUILD = 'journal-validation-mobile-v5-e2e';

const browser = await webkit.launch({headless:true});
const context = await browser.newContext({
  viewport:{width:390,height:844},
  isMobile:true,
  hasTouch:true,
  deviceScaleFactor:3,
  locale:'ko-KR',
  serviceWorkers:'block',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
});
const page = await context.newPage();
page.setDefaultTimeout(25000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
page.on('dialog', async dialog => dialog.dismiss());

await context.route('**/lunea-build.json?*', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({version:BUILD})
}));
await context.route(/https:\/\/fonts\.googleapis\.com\//, route => route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
await context.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//, route => route.fulfill({status:204,body:''}));
await context.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i, route => route.fulfill({
  status:200,
  contentType:'application/json',
  headers:{'access-control-allow-origin':'*'},
  body:JSON.stringify({ok:true})
}));

try {
  await page.goto(BASE_URL, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForFunction(() => !!window.LUNEA_READING_JOURNAL && document.documentElement.dataset.luneaJournalFix === 'v5');

  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('LUNEA_READING_DB', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('journal', 'readwrite');
      const store = tx.objectStore('journal');
      store.clear();
      const now = Date.now();
      for (let i = 0; i < 18; i += 1) {
        const n = String(i + 1).padStart(2, '0');
        store.put({
          id:`journal-mobile-${n}`,
          sourceArchiveId:`archive-mobile-${n}`,
          createdAt:now - i * 60000,
          updatedAt:now - i * 60000,
          category:i % 2 ? 'LOVE' : 'GENERAL',
          status:'pending',
          resultDate:'',
          dueDate:'',
          outcome:'',
          note:'',
          tags:[],
          signature:`mobile-fixture-${n}`,
          reading:{
            id:`archive-mobile-${n}`,
            createdAt:now - i * 60000,
            date:`2026-09-28 02:${n}`,
            category:i % 2 ? 'LOVE' : 'GENERAL',
            title:`모바일 검증 기록 ${n}`,
            q:`검증 상태 선택 스크롤 보존 ${n}`,
            cards:[{name:'The Star',position:'현재',isReversed:false}],
            ai:'모바일 기록함 회귀 테스트'
          }
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  });

  await page.evaluate(() => window.LUNEA_READING_JOURNAL.open());
  await page.waitForSelector('#archiveOverlay.show');
  await page.waitForFunction(() => document.querySelectorAll('#archiveList > .archive-item').length === 18);
  await page.waitForFunction(() => [...document.querySelectorAll('#archiveList > .archive-item')].every(card => !!card.dataset.luneaJournalId));

  const target = page.locator('#archiveList > .archive-item').nth(10);
  await target.scrollIntoViewIfNeeded();
  const openBefore = await target.evaluate(() => {
    const modal = document.querySelector('#archiveOverlay .archive-modal');
    return modal?.scrollTop || 0;
  });
  const reviewButton = target.locator('.archive-actions button').first();
  assert.equal(await reviewButton.getAttribute('type'), 'button', 'review button must never submit/navigate');
  await reviewButton.click();
  await target.locator('.lj-review.open').waitFor();
  await page.waitForTimeout(90);
  const verdictLabels = await target.locator('.lj-statuses button').allTextContents();
  assert.deepEqual(verdictLabels.map(x => x.trim()), ['맞', '애', '틀'], 'review must expose exactly 맞 / 애 / 틀');
  const openAfter = await target.evaluate(() => {
    const modal = document.querySelector('#archiveOverlay .archive-modal');
    return modal?.scrollTop || 0;
  });
  assert.ok(Math.abs(openAfter - openBefore) <= 2, `opening validation moved archive-modal scroll (${openBefore} -> ${openAfter})`);

  const dateLayout = await target.evaluate(card => {
    const fields = [...card.querySelectorAll('.lj-grid .lj-field')];
    const inputs = [...card.querySelectorAll('.lj-grid input[type="date"]')];
    const cardRect = card.getBoundingClientRect();
    const fieldRects = fields.map(el => el.getBoundingClientRect());
    const inputRects = inputs.map(el => el.getBoundingClientRect());
    return {
      fieldTops:fieldRects.map(rect => rect.top),
      widths:inputRects.map(rect => rect.width),
      heights:inputRects.map(rect => rect.height),
      textAligns:inputs.map(el => getComputedStyle(el).textAlign),
      rightEdges:inputRects.map(rect => rect.right),
      cardRight:cardRect.right,
      viewportWidth:innerWidth,
      documentWidth:document.documentElement.scrollWidth
    };
  });
  assert.equal(dateLayout.widths.length, 2, 'journal must expose both result/due date controls');
  assert.ok(Math.abs(dateLayout.fieldTops[0] - dateLayout.fieldTops[1]) < 3, `date controls must stay in one compact row on 390px iPhone: ${JSON.stringify(dateLayout)}`);
  assert.ok(Math.abs(dateLayout.widths[0] - dateLayout.widths[1]) <= 2, `date controls must use equal columns: ${JSON.stringify(dateLayout.widths)}`);
  assert.ok(dateLayout.heights.every(height => height <= 40.5), `date controls are still too tall: ${JSON.stringify(dateLayout.heights)}`);
  assert.ok(dateLayout.textAligns.every(value => value === 'center'), `date values must be centered: ${JSON.stringify(dateLayout.textAligns)}`);
  assert.ok(dateLayout.rightEdges.every(right => right <= dateLayout.cardRight + 1), 'date controls overflow their journal card');
  assert.ok(dateLayout.documentWidth <= dateLayout.viewportWidth + 1, `journal created horizontal viewport overflow: ${JSON.stringify(dateLayout)}`);

  const before = await target.evaluate(card => {
    const modal = document.querySelector('#archiveOverlay .archive-modal');
    card.__luneaJournalIdentitySentinel = 'preserve-me';
    return {
      scrollTop:modal?.scrollTop || 0,
      reviewOpen:card.querySelector('.lj-review')?.classList.contains('open') || false,
      id:card.dataset.luneaJournalId
    };
  });
  assert.ok(before.scrollTop > 0, `test must exercise a genuinely scrolled journal position, got ${before.scrollTop}`);
  assert.equal(before.reviewOpen, true, 'review panel must be open before status change');

  await target.locator('.lj-statuses button', {hasText:'맞'}).click();
  await page.waitForFunction(id => {
    const card = [...document.querySelectorAll('#archiveList > .archive-item')].find(node => node.dataset.luneaJournalId === id);
    return card?.querySelector('.lj-badge')?.textContent?.trim() === '맞' &&
      document.documentElement.dataset.luneaJournalValidationUpdate === 'in-place-v5';
  }, before.id);
  await page.waitForTimeout(120);

  const after = await target.evaluate(card => {
    const modal = document.querySelector('#archiveOverlay .archive-modal');
    const resultDate = card.querySelector('.lj-grid input[type="date"]');
    return {
      scrollTop:modal?.scrollTop || 0,
      reviewOpen:card.querySelector('.lj-review')?.classList.contains('open') || false,
      sentinel:card.__luneaJournalIdentitySentinel || '',
      badge:card.querySelector('.lj-badge')?.textContent || '',
      resultDate:resultDate?.value || '',
      statVerified:document.querySelector('#ljStats .lj-stat:nth-child(2) b')?.textContent || '',
      statPending:document.querySelector('#ljStats .lj-stat:nth-child(4) b')?.textContent || ''
    };
  });

  assert.ok(Math.abs(after.scrollTop - before.scrollTop) <= 2, `status change moved archive-modal scroll (${before.scrollTop} -> ${after.scrollTop})`);
  assert.equal(after.reviewOpen, true, 'status change closed the open review panel');
  assert.equal(after.sentinel, 'preserve-me', 'status change replaced the journal card DOM instead of patching it in place');
  assert.equal(after.badge.trim(), '맞', 'status badge did not update in place');
  assert.match(after.resultDate, /^\d{4}-\d{2}-\d{2}$/, 'first verification must fill actual result date');
  assert.equal(after.statVerified, '1', 'verified statistic did not update in place');
  assert.equal(after.statPending, '17', 'pending statistic did not update in place');

  const persisted = await page.evaluate(async id => {
    const rows = await window.LUNEA_READING_JOURNAL.getAll();
    const row = rows.find(item => item.id === id);
    return row ? {status:row.status,resultDate:row.resultDate} : null;
  }, before.id);
  assert.equal(persisted?.status, 'hit', 'in-place status update was not persisted to IndexedDB');
  assert.match(persisted?.resultDate || '', /^\d{4}-\d{2}-\d{2}$/, 'persisted result date missing');

  const relevantErrors = pageErrors.filter(line => !/onrender\.com\/health|access control checks/i.test(line));
  assert.deepEqual(relevantErrors, [], `browser page errors:\n${relevantErrors.join('\n')}`);

  console.log('Journal mobile three-state verdict + in-place validation E2E: PASS');
  console.log(JSON.stringify({before, after, dateLayout, persisted}, null, 2));
} finally {
  await browser.close();
}
