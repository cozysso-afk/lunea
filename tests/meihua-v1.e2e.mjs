import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const baseURL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844}});
const errors = [];
page.on('pageerror', error => errors.push(String(error?.message || error)));

try {
  await page.goto(baseURL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(() => !!window.LUNEA_MEIHUA_ENGINE_V1 && !!window.LUNEA_MEIHUA_V1 && !!window.LUNEA_MEIHUA_POLISH_V1,{timeout:20000});
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('lunea-ui-regression-final-v2')),true,'latest main UI regression owner가 활성화되어야 함');
  await page.waitForSelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]',{timeout:20000});
  await page.waitForTimeout(500);

  const home = await page.evaluate(() => {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    const nodes = [...(grid?.children || [])];
    const meihua = grid?.querySelector('.lunea-v8-tile[data-key="meihua"]');
    const intimacy = grid?.querySelector('.lunea-v8-tile[data-key="intimacy"]');
    const signal = document.getElementById('luneaSignalMessageSection');
    const divider = grid?.querySelector('.lunea-v35-system-divider');
    const logo = meihua?.querySelector('.mh-icon img');
    const style = meihua ? getComputedStyle(meihua) : null;
    return {
      meihuaIndex:nodes.indexOf(meihua),
      intimacyIndex:nodes.indexOf(intimacy),
      signalIndex:nodes.indexOf(signal),
      dividerIndex:nodes.indexOf(divider),
      gridColumn:style?.gridColumn || '',
      label:meihua?.querySelector('.lunea-v8-label')?.textContent || '',
      logoSrc:logo?.getAttribute('src') || '',
      logoLoaded:!!logo && logo.complete && logo.naturalWidth > 0
    };
  });
  assert.ok(home.meihuaIndex >= 0 && home.intimacyIndex >= 0,'Meihua와 Intimacy 홈 타일이 모두 있어야 함');
  assert.ok(home.intimacyIndex < home.signalIndex,'Intimacy는 Tarot 관련 영역에서 Signal 앞에 있어야 함');
  assert.ok(home.signalIndex < home.dividerIndex,'Signal은 Tarot 관련 보조 오라클로 시스템 구분선보다 앞에 있어야 함');
  assert.ok(home.dividerIndex < home.meihuaIndex,'Meihua는 DIVINATION · ASTROLOGY 영역에 있어야 함');
  assert.match(home.gridColumn,/span\s*3|3\s*\/\s*span\s*3/i,'Meihua는 V35 시스템 영역의 2열 타일이어야 함');
  assert.equal(home.label.trim(),'MEIHUA');
  assert.match(home.logoSrc,/assets\/meihua\/meihua_logo_v1\.png$/,'생성한 Meihua 로고 자산을 사용해야 함');
  assert.equal(home.logoLoaded,true,'Meihua 로고 이미지가 실제로 로드되어야 함');

  const tile = page.locator('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]');
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
    provenance:document.querySelector('#mhProvenance')?.textContent || '',
    pngButton:document.querySelector('#mhPng')?.textContent || ''
  }));
  assert.equal(ui.cards,3,'본괘/호괘/변괘 3개가 보여야 함');
  assert.equal(ui.moving,1,'본괘에 동효 표시는 정확히 1개여야 함');
  assert.match(ui.evidence,/질문 시각/);
  assert.match(ui.evidence,/체 · 용/);
  assert.match(ui.relation,/현재:/);
  assert.match(ui.provenance,/연·월·일·시 기괘법/);
  assert.match(ui.pngButton,/PNG/,'매화역수 전용 PNG 버튼이 있어야 함');

  await page.click('#mhSave');
  const saved = await page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]');
    return rows.find(item => item?.meihua?.version === 1) || null;
  });
  assert.ok(saved,'매화역수 기록이 LUNEA_ARCHIVE_V3에 저장되어야 함');
  assert.equal(saved.q,question);
  assert.ok(saved.meihua?.calculation?.primary?.number);
  assert.equal(saved.cards?.length,4);

  const png = await page.evaluate(async () => {
    const reading = JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]').find(item => item?.meihua?.version === 1);
    const file = await window.LUNEA_MEIHUA_POLISH_V1.renderPngFile(reading);
    return {name:file.name,type:file.type,size:file.size};
  });
  assert.match(png.name,/LUNEA_MEIHUA_.*\.png$/);
  assert.equal(png.type,'image/png');
  assert.ok(png.size > 5000,'4:5 PNG가 실제 바이트를 가져야 함');

  await page.click('#mhClose');
  await page.waitForFunction(() => !document.querySelector('#luneaMeihuaOverlay')?.classList.contains('show'));

  await page.evaluate(() => {
    const reading = JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]').find(item => item?.meihua?.version === 1);
    window.LUNEA_MEIHUA_POLISH_V1.openArchiveReading(reading);
  });
  await page.waitForSelector('#luneaMeihuaOverlay.show[data-meihua-restore="1"]',{timeout:5000});
  const restored = await page.evaluate(() => ({
    question:document.querySelector('#mhQuestion')?.value || '',
    readOnly:!!document.querySelector('#mhQuestion')?.readOnly,
    cards:document.querySelectorAll('#mhFlow .mh-hex').length,
    status:document.querySelector('#mhStatus')?.textContent || '',
    aiHidden:!!document.querySelector('#mhAI')?.hidden,
    saveHidden:!!document.querySelector('#mhSave')?.hidden,
    pngVisible:!document.querySelector('#mhPng')?.hidden
  }));
  assert.equal(restored.question,question);
  assert.equal(restored.readOnly,true,'기록 복원은 저장된 계산을 변경하지 않는 읽기 전용이어야 함');
  assert.equal(restored.cards,3);
  assert.match(restored.status,/기록함에서 불러온/);
  assert.equal(restored.aiHidden,true);
  assert.equal(restored.saveHidden,true);
  assert.equal(restored.pngVisible,true);

  await page.click('#mhClose');
  await page.waitForFunction(() => !document.querySelector('#luneaMeihuaOverlay')?.classList.contains('show'));

  const relevantErrors = errors.filter(message => /meihua|uncaught|syntax|referenceerror/i.test(message));
  assert.deepEqual(relevantErrors,[],'Meihua 관련 pageerror가 없어야 함');
  console.log('Meihua V1 mobile WebKit E2E: PASS');
} finally {
  await browser.close();
}
