import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const baseURL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844}});
const errors = [];
page.on('pageerror', error => errors.push(String(error?.message || error)));

try {
  await page.goto(baseURL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(() => !!window.LUNEA_MEIHUA_ENGINE_V1 && !!window.LUNEA_MEIHUA_V1,{timeout:20000});
  await page.waitForSelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]',{timeout:20000});

  const tile = await page.locator('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]');
  assert.equal(await tile.getAttribute('aria-pressed'),'false');
  await tile.click();
  await page.waitForSelector('#luneaMeihuaOverlay.show',{timeout:5000});

  const question = '다음 달 안에 이 계획이 실제로 움직일까?';
  await page.fill('#mhQuestion',question);
  await page.click('#mhCast');
  await page.waitForSelector('#mhBoard.show',{timeout:5000});

  const snap = await page.evaluate(() => window.LUNEA_MEIHUA_V1.snapshot());
  assert.equal(snap.question,question);
  assert.ok(snap.result?.primary?.number >= 1 && snap.result.primary.number <= 64);
  assert.ok(snap.result?.mutual?.number >= 1 && snap.result.mutual.number <= 64);
  assert.ok(snap.result?.changed?.number >= 1 && snap.result.changed.number <= 64);
  assert.ok(snap.result?.movingLine >= 1 && snap.result.movingLine <= 6);
  assert.ok(snap.result?.questionTime?.timeZone);
  assert.equal(snap.result?.method,'YEAR_MONTH_DAY_HOUR');

  const ui = await page.evaluate(() => ({
    cards:document.querySelectorAll('#mhFlow .mh-hex').length,
    moving:document.querySelectorAll('#mhFlow .mh-line.moving').length,
    evidence:document.querySelector('#mhEvidence')?.textContent || '',
    relation:document.querySelector('#mhRelation')?.textContent || '',
    provenance:document.querySelector('#mhProvenance')?.textContent || ''
  }));
  assert.equal(ui.cards,3,'본괘/호괘/변괘 3개가 보여야 함');
  assert.equal(ui.moving,1,'본괘에 동효 표시는 정확히 1개여야 함');
  assert.match(ui.evidence,/질문 시각/);
  assert.match(ui.evidence,/체 · 용/);
  assert.match(ui.relation,/현재:/);
  assert.match(ui.provenance,/연·월·일·시 기괘법/);

  await page.click('#mhSave');
  const saved = await page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]');
    return rows.find(item => item?.meihua?.version === 1) || null;
  });
  assert.ok(saved,'매화역수 기록이 LUNEA_ARCHIVE_V3에 저장되어야 함');
  assert.equal(saved.q,question);
  assert.ok(saved.meihua?.calculation?.primary?.number);
  assert.equal(saved.cards?.length,4);

  await page.click('#mhClose');
  await page.waitForFunction(() => !document.querySelector('#luneaMeihuaOverlay')?.classList.contains('show'));

  const relevantErrors = errors.filter(message => /meihua|uncaught|syntax|referenceerror/i.test(message));
  assert.deepEqual(relevantErrors,[],'Meihua 관련 pageerror가 없어야 함');
  console.log('Meihua V1 mobile WebKit E2E: PASS');
} finally {
  await browser.close();
}
