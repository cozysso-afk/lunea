import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const BUILD = 'message-oracle-persistence-v2-e2e';
const QUESTION = '오늘 연락과 소식 흐름은 어떨까?';
const POSITIONS = ['전체 흐름','컨디션','학업·업무','대인·연애','금전','변수'];
const CODES = ['Sun','Moon','Star','Magician','Justice','World'];

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
page.setDefaultTimeout(25000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
page.on('dialog', async dialog => dialog.dismiss());

await page.route('**/lunea-build.json?*', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({version:BUILD})
}));
await page.route(/https:\/\/fonts\.googleapis\.com\//, route => route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//, route => route.fulfill({status:204,body:''}));
await page.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i, route => route.fulfill({
  status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify({ok:true})
}));

try {
  await page.goto(BASE_URL, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForFunction(() =>
    !!window.LUNEA_MESSAGE_ORACLE_HOME_V1 &&
    !!window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1 &&
    !!window.LUNEA_READING_ATTACHMENTS_V1 &&
    !!window.LUNEA_READING_DRAFT_V1 &&
    typeof window.LUNEA_LOAD_FEATURE_GROUP === 'function'
  );

  // 1) Home SIGNAL · MESSAGE must self-heal if a late Home rebuild removes it.
  await page.waitForSelector('#luneaSignalMessageSection');
  await page.evaluate(() => document.getElementById('luneaSignalMessageSection')?.remove());
  await page.waitForSelector('#luneaSignalMessageSection');
  await page.waitForFunction(() => {
    const section = document.getElementById('luneaSignalMessageSection');
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    return !!section && (!grid || section.parentElement === grid || !window.LUNEA_HOME_IA_V35);
  });

  const seeded = await page.evaluate(async ({question, positions, codes}) => {
    const loaded = await window.LUNEA_LOAD_FEATURE_GROUP('message');
    if (!loaded || !window.LUNEA_MESSAGE_ORACLE_V1) return {ok:false, reason:'message feature group did not load'};

    let s = null;
    try { s = state; } catch { s = window.state || null; }
    if (!s) return {ok:false, reason:'reading state unavailable'};

    const deck = typeof TAROT_DECK !== 'undefined' ? TAROT_DECK : [];
    const drawn = codes.map((code, index) => {
      const card = deck.find(row => String(row?.code) === code) || {code, name:code, keyword:''};
      return {
        code,
        name:String(card.name || code),
        keyword:String(card.keyword || ''),
        isReversed:false,
        position:positions[index],
        subCards:[]
      };
    });

    Object.assign(s, {
      category:'DAILY',
      title:'DAILY ORBIT 6',
      desc:'Message Oracle persistence fixture',
      count:6,
      isAi:false,
      allowReversed:false,
      positions:[...positions],
      rationale:'message persistence regression',
      question,
      drawn,
      used:new Set(codes)
    });

    const registry = window.LUNEA_READING_ATTACHMENTS_V1;
    const support = window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1;
    const signature = registry.signature(s);
    const raw = window.LUNEA_MESSAGE_ORACLE_V1.result(question, 'GENERAL', 'Sun');
    const payload = {
      version:1,
      mode:'support',
      readingSignature:signature,
      question,
      context:raw.context,
      cardCode:raw.cardCode,
      score:raw.score,
      createdAt:raw.createdAt
    };
    if (!support.restore(payload)) return {ok:false, reason:'support restore rejected fixture'};
    if (!registry.notifyChanged('messageOracle')) return {ok:false, reason:'attachment registry capture failed'};
    window.LUNEA_READING_DRAFT_V1.snapshot();
    support.ensureButton();
    return {ok:true, signature, drawn};
  }, {question:QUESTION, positions:POSITIONS, codes:CODES});
  assert.equal(seeded.ok, true, seeded.reason || 'failed to seed message support');

  // 2) Action button and inline result must self-heal after DOM churn.
  await page.waitForSelector('#luneaMessageOracleSupportBtn');
  await page.waitForSelector('#luneaMessageOracleInline');
  await page.evaluate(() => {
    document.getElementById('luneaMessageOracleSupportBtn')?.remove();
    document.getElementById('luneaMessageOracleInline')?.remove();
  });
  await page.waitForSelector('#luneaMessageOracleSupportBtn');
  await page.waitForSelector('#luneaMessageOracleInline');

  // 3) A transient incomplete state must not make the Message Oracle disappear forever.
  // Reproduce the current failure mode by explicitly calling the legacy sync while
  // drawn cards are temporarily unavailable, then restore the same reading state.
  await page.evaluate(({drawn}) => {
    let s = null;
    try { s = state; } catch { s = window.state || null; }
    s.drawn = [];
    window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1.sync();
    s.drawn = drawn;
    document.getElementById('luneaMessageOracleSupportBtn')?.remove();
  }, {drawn:seeded.drawn});

  await page.waitForFunction(() => !!window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.capture?.());
  await page.waitForSelector('#luneaMessageOracleSupportBtn');
  await page.waitForSelector('#luneaMessageOracleInline');

  const final = await page.evaluate(() => {
    let s = null;
    try { s = state; } catch { s = window.state || null; }
    const signature = window.LUNEA_READING_ATTACHMENTS_V1?.signature?.(s) || '';
    const capture = window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.capture?.() || null;
    const draft = window.LUNEA_READING_DRAFT_V1?.readDraft?.() || null;
    return {
      signature,
      capture,
      draftSignature:draft?.attachments?.readingSignature || '',
      home:!!document.getElementById('luneaSignalMessageSection'),
      button:!!document.getElementById('luneaMessageOracleSupportBtn'),
      inline:!!document.getElementById('luneaMessageOracleInline')
    };
  });

  assert.equal(final.signature, seeded.signature, 'reading identity must remain unchanged');
  assert.equal(final.capture?.readingSignature, seeded.signature, 'Message Oracle must recover for the same exact reading');
  assert.equal(final.draftSignature, seeded.signature, 'draft attachment must remain exact-reading scoped');
  assert.equal(final.home, true, 'Home SIGNAL section must remain present');
  assert.equal(final.button, true, 'Message Oracle action button must remain present');
  assert.equal(final.inline, true, 'Message Oracle inline result must remain present');

  const relevantErrors = pageErrors.filter(line => !/onrender\.com\/health|access control checks/i.test(line));
  assert.deepEqual(relevantErrors, [], `browser page errors:\n${relevantErrors.join('\n')}`);

  console.log('Message Oracle persistence E2E: PASS');
  console.log(JSON.stringify({signature:seeded.signature, recoveredCard:final.capture?.cardCode}, null, 2));
} finally {
  await browser.close();
}
