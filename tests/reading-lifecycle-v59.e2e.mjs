import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const BUILD = 'fc71ade9bd12';

// This sequence intentionally crosses sectors and modes in one long-lived WebKit
// page. The bug under test is global reading lifecycle corruption after reading #1,
// not a LOVE-only or AI-only problem.
const runs = [
  {category:'GENERAL', mode:'fixed', title:'YES / NO', question:'E2E 01 · 첫 질문 GENERAL 고정 배열은 정상적으로 펼쳐지는가?', expected:5},
  {category:'CAREER', mode:'fixed', title:'시험 합격운', question:'E2E 02 · 두 번째 질문을 CAREER로 바꿔도 정상적으로 펼쳐지는가?', expected:6},
  {category:'CAREER', mode:'fixed', title:'직장 내 대인관계 & 평판', question:'E2E 03 · 같은 CAREER에서 연속 질문을 바꿔도 정상인가?', expected:6},
  {category:'STOCK', mode:'fixed', title:'매수 판단', question:'E2E 04 · STOCK 고정 배열 전환 후에도 정상인가?', expected:5},
  {category:'LOVE', mode:'fixed', title:'상대 속마음', question:'E2E 05 · LOVE 고정 배열 전환 후에도 정상인가?', expected:7},
  {category:'GENERAL', mode:'ai', question:'E2E 06 · GENERAL AI 맞춤 배열을 간단한 현재 흐름 질문으로 설계해줘.'},
  {category:'LOVE', mode:'ai', question:'E2E 07 · LOVE AI 배열에서 상대와 나 사이의 현재 감정 차이를 비교해줘.'},
  {category:'STOCK', mode:'ai', question:'E2E 08 · STOCK AI 배열에서 지금 판단의 근거와 리스크를 분리해줘.'},
  {category:'CAREER', mode:'manual', question:'E2E 09 · CAREER 직접 입력 배열이 이전 리딩 뒤에도 정상인가?', expected:3,
    positions:['현재 준비 완성도','가장 큰 방해 변수','지금 바꿀 핵심 행동']},
  {category:'LOVE', mode:'fixed', title:'연락운 & 시기', question:'E2E 10 · 열 번째 LOVE 고정 배열까지 같은 세션에서 정상인가?', expected:7},
];

const browser = await webkit.launch({headless:true});
const context = await browser.newContext({
  viewport:{width:393,height:852},
  isMobile:true,
  hasTouch:true,
  deviceScaleFactor:3,
  locale:'ko-KR',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
});
const page = await context.newPage();
page.setDefaultTimeout(18000);

const pageErrors = [];
const consoleErrors = [];
const dialogs = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('dialog', async dialog => {
  dialogs.push(`${dialog.type()}: ${dialog.message()}`);
  await dialog.dismiss();
});

await page.route('**/lunea-build.json?*', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({version:BUILD})
}));
await page.route(/https:\/\/fonts\.googleapis\.com\//, route => route.fulfill({
  status:200,
  contentType:'text/css; charset=utf-8',
  body:''
}));
await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//, route =>
  route.fulfill({status:204, body:''})
);
// Background Astro health warming is unrelated to card lifecycle and otherwise
// produces local-origin CORS noise in WebKit. Keep the boot probe deterministic.
await page.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i, route => route.fulfill({
  status:200,
  contentType:'application/json',
  headers:{'access-control-allow-origin':'*'},
  body:JSON.stringify({ok:true})
}));

await page.addInitScript(() => {
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
});

async function openEntry(run) {
  const result = await page.evaluate(({category, mode, title}) => {
    const items = [...document.querySelectorAll('.reading-item')];
    const item = items.find(el => {
      if (String(el.dataset.cat || '').toUpperCase() !== category) return false;
      if (mode === 'ai') return el.dataset.luneaUniversalAi === '1';
      if (mode === 'manual') return el.dataset.manualSpread === '1';
      return el.dataset.title === title;
    });
    if (!item) {
      return {
        ok:false,
        available:items.map(el => ({cat:el.dataset.cat,title:el.dataset.title,ai:el.dataset.luneaUniversalAi,manual:el.dataset.manualSpread}))
      };
    }
    item.click();
    return {ok:true, text:(item.textContent || '').replace(/\s+/g,' ').trim(), declaredCount:Number(item.dataset.count || 0)};
  }, run);
  assert.equal(result.ok, true, `entry missing for ${run.category}/${run.mode}/${run.title || ''}\n${JSON.stringify(result.available || [], null, 2)}`);
  await page.waitForSelector('#sheet.open');
  await page.locator('#question').fill(run.question);

  if (run.mode === 'manual') {
    await page.waitForSelector('#luneaManualPanel.show');
    await page.locator('#luneaManualTitle').fill('E2E 직접 입력 3카드');
    await page.locator('#luneaManualPositions').fill(run.positions.join('\n'));
  }
  return result;
}

async function snapshot() {
  return page.evaluate(() => {
    let s = null;
    try { s = state; } catch {}
    const html = document.documentElement;
    const draw = document.getElementById('drawBtn');
    let startStable = null;
    try { startStable = startSpread === window.__LUNEA_E2E_START_REF__; } catch {}
    return {
      session:Number(html.dataset.luneaReadingSession || 0),
      reason:html.dataset.luneaReadingReason || '',
      category:String(s?.category || ''),
      title:String(s?.title || ''),
      question:String(s?.question || ''),
      stateCount:Number(s?.count || 0),
      positions:Array.isArray(s?.positions) ? s.positions.length : -1,
      drawn:Array.isArray(s?.drawn) ? s.drawn.length : -1,
      used:s?.used?.size ?? -1,
      cardDom:document.querySelectorAll('#cards .tarot-card-wrapper').length,
      spreadVisible:document.getElementById('spreadOverlay')?.classList.contains('show') || false,
      sheetOpen:document.getElementById('sheet')?.classList.contains('open') || false,
      previewVisible:document.getElementById('luneaV20PreviewOverlay')?.classList.contains('show') || false,
      drawDisabled:!!draw?.disabled,
      drawHandlerStable:draw?.onclick === window.__LUNEA_E2E_DRAW_REF__,
      startStable,
      modalOpen:document.body.classList.contains('modal-open'),
      coreRows:html.dataset.luneaCoreSpreadEntries || '',
      aiRows:document.querySelectorAll('.category-content [data-lunea-universal-ai="1"]').length,
      manualRows:document.querySelectorAll('.category-content [data-manual-spread="1"]').length,
    };
  });
}

const results = [];
try {
  await page.goto(BASE_URL, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForFunction(() => {
    const root = document.documentElement;
    const draw = document.getElementById('drawBtn');
    return root.classList.contains('lunea-ui-ready') &&
      root.dataset.luneaCoreSpreadEntries === 'ready' &&
      document.querySelectorAll('.category-content [data-lunea-universal-ai="1"]').length === 4 &&
      document.querySelectorAll('.category-content [data-manual-spread="1"]').length === 4 &&
      document.getElementById('luneaManualPanel') &&
      draw?.onclick?.__luneaUniversalV20Wrapped;
  }, null, {timeout:20000});

  // Let all one-shot DOMContentLoaded installers settle. A handler change after
  // this point is a regression toward the old wrapper/polling race.
  await page.waitForTimeout(1200);

  const initialRows = await page.evaluate(() => {
    const out = {};
    for (const category of ['GENERAL','CAREER','LOVE','STOCK']) {
      const items = [...document.querySelectorAll(`.category-content .reading-item[data-cat="${category}"]`)];
      out[category] = {
        ai:items.filter(el => el.dataset.luneaUniversalAi === '1').length,
        manual:items.filter(el => el.dataset.manualSpread === '1').length,
        order:items.slice(0,2).map(el => el.dataset.luneaUniversalAi === '1' ? 'AI' : (el.dataset.manualSpread === '1' ? 'MANUAL' : el.dataset.title || 'FIXED'))
      };
    }
    return out;
  });
  for (const category of ['GENERAL','CAREER','LOVE','STOCK']) {
    assert.deepEqual(initialRows[category], {ai:1, manual:1, order:['AI','MANUAL']}, `${category} first-render AI/Manual rows invalid`);
  }
  await page.waitForTimeout(1500);
  const laterRows = await page.evaluate(() => {
    const out = {};
    for (const category of ['GENERAL','CAREER','LOVE','STOCK']) {
      const items = [...document.querySelectorAll(`.category-content .reading-item[data-cat="${category}"]`)];
      out[category] = {
        ai:items.filter(el => el.dataset.luneaUniversalAi === '1').length,
        manual:items.filter(el => el.dataset.manualSpread === '1').length,
        order:items.slice(0,2).map(el => el.dataset.luneaUniversalAi === '1' ? 'AI' : (el.dataset.manualSpread === '1' ? 'MANUAL' : el.dataset.title || 'FIXED'))
      };
    }
    return out;
  });
  assert.deepEqual(laterRows, initialRows, 'core rows changed after first render; late-injection race remains');

  await page.evaluate(() => {
    try { window.__LUNEA_E2E_START_REF__ = startSpread; } catch { window.__LUNEA_E2E_START_REF__ = null; }
    window.__LUNEA_E2E_DRAW_REF__ = document.getElementById('drawBtn')?.onclick || null;
  });

  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    const entry = await openEntry(run);
    const before = await snapshot();
    assert.equal(before.drawDisabled, false, `run ${i + 1}: draw button disabled before draw`);
    if (run.mode === 'fixed') {
      assert.equal(entry.declaredCount, run.expected, `run ${i + 1}: menu depth does not match intended V30 preset`);
      assert.equal(before.stateCount, run.expected, `run ${i + 1}: openSheet state count does not match intended V30 preset`);
    }

    await page.locator('#drawBtn').click();

    if (run.mode === 'ai') {
      await page.waitForSelector('#luneaV20PreviewOverlay.show', {timeout:18000});
      const previewText = await page.locator('#luneaV20PreviewPositions').inputValue();
      assert.ok(previewText.split(/\n+/).filter(Boolean).length >= 2, `run ${i + 1}: AI preview has <2 positions`);
      await page.locator('#luneaV20PreviewConfirm').click();
    }

    await page.waitForSelector('#spreadOverlay.show', {timeout:18000});
    if (run.mode === 'ai') await page.waitForFunction(() => !document.getElementById('drawBtn')?.disabled);

    const after = await snapshot();
    const expectedSession = before.session + 1;
    assert.equal(after.session, expectedSession, `run ${i + 1}: readingSessionId should advance exactly once (${before.session} -> ${expectedSession}), got ${after.session}`);
    assert.equal(after.question, run.question, `run ${i + 1}: stale question leaked`);
    assert.equal(after.category, run.category, `run ${i + 1}: category leaked`);
    assert.equal(after.spreadVisible, true, `run ${i + 1}: spread overlay not visible`);
    assert.equal(after.sheetOpen, false, `run ${i + 1}: sheet remained open`);
    assert.equal(after.previewVisible, false, `run ${i + 1}: AI preview remained open`);
    assert.equal(after.drawHandlerStable, true, `run ${i + 1}: draw handler changed during long-lived session`);
    assert.equal(after.startStable, true, `run ${i + 1}: startSpread was re-wrapped/replaced during session`);
    assert.equal(after.coreRows, 'ready', `run ${i + 1}: core row readiness regressed`);
    assert.equal(after.aiRows, 4, `run ${i + 1}: AI row count changed`);
    assert.equal(after.manualRows, 4, `run ${i + 1}: Manual row count changed`);
    assert.ok(after.drawn > 0, `run ${i + 1}: no cards drawn`);
    assert.equal(after.used, after.drawn, `run ${i + 1}: used/drawn mismatch`);
    assert.equal(after.cardDom, after.drawn, `run ${i + 1}: card DOM/drawn mismatch`);
    assert.equal(after.positions, after.drawn, `run ${i + 1}: positions/drawn mismatch`);

    if (Number.isInteger(run.expected)) {
      assert.equal(after.drawn, run.expected, `run ${i + 1}: expected ${run.expected} cards, got ${after.drawn}`);
    } else {
      assert.ok(after.drawn >= 2 && after.drawn <= 20, `run ${i + 1}: AI card count out of range: ${after.drawn}`);
    }

    results.push({run:i + 1, mode:run.mode, category:run.category, title:after.title, session:after.session, drawn:after.drawn});

    await page.evaluate(() => document.querySelector('[data-close="spread"]')?.click());
    await page.waitForFunction(() => !document.getElementById('spreadOverlay')?.classList.contains('show'));
    await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
    const closed = await snapshot();
    assert.equal(closed.drawDisabled, false, `run ${i + 1}: draw button stuck disabled after close`);
  }

  assert.equal(results.length, 10, 'did not complete all 10 readings');
  const relevantPageErrors = pageErrors.filter(line => !/onrender\.com\/health|access control checks/i.test(line));
  assert.equal(relevantPageErrors.length, 0, `relevant page errors:\n${relevantPageErrors.join('\n')}`);
  assert.equal(dialogs.length, 0, `unexpected dialogs:\n${dialogs.join('\n')}`);

  console.log('\nLUNEA mixed-sector 10-run WebKit regression: PASS');
  console.table(results);
  if (pageErrors.length !== relevantPageErrors.length) {
    console.log('Ignored background Astro health probe errors:', pageErrors.length - relevantPageErrors.length);
  }
  if (consoleErrors.length) {
    console.log('Non-fatal console.error messages observed:');
    consoleErrors.forEach(line => console.log(' -', line));
  }
} catch (error) {
  console.error('\nLUNEA mixed-sector 10-run WebKit regression: FAIL');
  console.error(error?.stack || error);
  console.error('Completed runs:', JSON.stringify(results, null, 2));
  console.error('Page errors:', JSON.stringify(pageErrors, null, 2));
  console.error('Dialogs:', JSON.stringify(dialogs, null, 2));
  console.error('Console errors:', JSON.stringify(consoleErrors, null, 2));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
