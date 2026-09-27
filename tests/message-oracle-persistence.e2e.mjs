import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const BUILD = 'message-oracle-persistence-v2-e2e';
const QUESTION = '오늘 연락과 소식 흐름은 어떨까?';
const POSITIONS = ['전체 흐름','컨디션','학업·업무','대인·연애','금전','변수'];
const CODES = ['Sun','Moon','Star','Magician','Justice','World'];

const HORARY_FIXTURE = {
  schema:'LUNEA_HORARY_V1',
  question:{text:QUESTION,topic:'contact',topic_label_ko:'연락·메시지'},
  moment:{local_iso:'2026-09-28T02:20:00+09:00',place_resolved:'Seoul',latitude:37.5665,longitude:126.978},
  zodiac:'Tropical',house_system:'Regiomontanus',
  angles:{ASC:{sign:'Libra',degree:12.2},MC:{sign:'Cancer',degree:8.4}},
  cusps:[12,42,72,102,132,162,192,222,252,282,312,342],
  planets:{},points:{},
  significators:{
    querent:{house:1,ruler:'Venus',ruler_ko:'금성',planet:{name_ko:'금성',sign:'Libra',degree:14.2,house:1,direction:'Direct',dignity_ko:'도머사일'}},
    quesited:{house:7,ruler:'Mars',ruler_ko:'화성',planet:{name_ko:'화성',sign:'Gemini',degree:15.1,house:9,direction:'Direct',dignity_ko:'중립'}},
    event:{house:9,ruler:'Mercury',ruler_ko:'수성',planet:{name_ko:'수성',sign:'Libra',degree:18.1,house:1,direction:'Direct',dignity_ko:'중립'}},
    moon:{name_ko:'달',sign:'Aquarius',degree:9.1,house:5,direction:'Direct',dignity_ko:'중립'}
  },
  judgment_support:{
    primary_connection:{aspect_ko:'Trine(삼합)',orb:0.9,phase_ko:'Applying(적용)'},
    perfection:{perfects:true,reason_ko:'유효 오브 안 적용각이 완성됨',exact_local:'2026-09-28T09:00:00+09:00'},
    reception:{has_reception:true,mutual_reception:false,same_significator:false},
    moon_course:{void_of_course:false,next_aspects:[{body:'Mars',body_ko:'화성',aspect_ko:'Trine(삼합)',orb:0.8,time_local:'2026-09-28T06:30:00+09:00'}],hours_to_sign_exit:11.2},
    potential_prohibition:[],warnings:[]
  },
  meta:{engine:'Message Oracle persistence E2E fixture'}
};

const browser = await webkit.launch({headless:true});
const context = await browser.newContext({
  viewport:{width:393,height:852},
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
  status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify({ok:true})
}));
await context.route(/\/v1\/horary(?:\?|$)/, route => route.fulfill({
  status:200,
  contentType:'application/json',
  headers:{'access-control-allow-origin':'*'},
  body:JSON.stringify(HORARY_FIXTURE)
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

    // Put the seeded reading into the same visible overlay state as a completed reading.
    // The support button is intentionally hidden outside #spreadOverlay.show.
    const spread = document.getElementById('spreadOverlay');
    spread?.classList.add('show');
    spread?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

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
    return {ok:true, signature, drawn, cardCode:payload.cardCode};
  }, {question:QUESTION, positions:POSITIONS, codes:CODES});
  assert.equal(seeded.ok, true, seeded.reason || 'failed to seed message support');

  // 2) In an actual visible reading, action button and inline result must self-heal after DOM churn.
  await page.waitForSelector('#spreadOverlay.show');
  await page.waitForSelector('#luneaMessageOracleSupportBtn', {state:'visible'});
  await page.waitForSelector('#luneaMessageOracleInline', {state:'visible'});
  await page.evaluate(() => {
    document.getElementById('luneaMessageOracleSupportBtn')?.remove();
    document.getElementById('luneaMessageOracleInline')?.remove();
  });
  await page.waitForSelector('#luneaMessageOracleSupportBtn', {state:'visible'});
  await page.waitForSelector('#luneaMessageOracleInline', {state:'visible'});

  // 3) Exact support-calculation lifecycle: Message Oracle must survive Horary open → calculate → close.
  // This uses the real Horary support button and real render/attachment path with only the API response stubbed.
  await page.locator('#astroHoraryBtn').click();
  await page.waitForSelector('#astroHoraryOverlay.show');
  assert.equal(await page.locator('#astroHoraryQuestion').inputValue(), QUESTION, 'Horary support must keep the exact reading question');
  await page.locator('#astroHoraryMoment').fill('2026-09-28T02:20');
  await page.locator('#astroHoraryPlace').fill('Seoul');
  await page.locator('#astroHoraryTopic').selectOption('contact');
  await page.locator('#astroHoraryRun').click();
  await page.waitForFunction(() => document.getElementById('astroHoraryStatus')?.textContent?.includes('계산 완료'));
  assert.equal(await page.locator('#astroHoraryResult').evaluate(el => el.classList.contains('show')), true, 'Horary support result must render');
  await page.locator('#astroHoraryClose').click();
  await page.waitForFunction(() => !document.getElementById('astroHoraryOverlay')?.classList.contains('show'));
  await page.waitForSelector('#spreadOverlay.show');
  await page.waitForSelector('#luneaMessageOracleSupportBtn', {state:'visible'});
  await page.waitForSelector('#luneaMessageOracleInline', {state:'visible'});

  const afterHorary = await page.evaluate(() => ({
    message:window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.capture?.() || null,
    horary:window.LUNEA_READING_ATTACHMENTS_V1?.captureAll?.()?.horary || null
  }));
  assert.equal(afterHorary.message?.readingSignature, seeded.signature, 'Horary support calculation must not detach Message Oracle');
  assert.equal(afterHorary.message?.cardCode, seeded.cardCode, 'Horary support calculation must preserve the same Message Oracle card');

  // 4) A transient incomplete reading state during another support-layer DOM rebuild must recover
  // from the exact-reading draft attachment instead of making Message Oracle disappear forever.
  await page.evaluate(({drawn}) => {
    let s = null;
    try { s = state; } catch { s = window.state || null; }
    s.drawn = [];
    window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1.sync();
    s.drawn = drawn;
    document.getElementById('luneaMessageOracleSupportBtn')?.remove();
    document.getElementById('luneaMessageOracleInline')?.remove();
  }, {drawn:seeded.drawn});

  await page.waitForFunction(() => !!window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.capture?.());
  await page.waitForSelector('#luneaMessageOracleSupportBtn', {state:'visible'});
  await page.waitForSelector('#luneaMessageOracleInline', {state:'visible'});

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
      inline:!!document.getElementById('luneaMessageOracleInline'),
      spreadVisible:document.getElementById('spreadOverlay')?.classList.contains('show') || false
    };
  });

  assert.equal(final.signature, seeded.signature, 'reading identity must remain unchanged');
  assert.equal(final.capture?.readingSignature, seeded.signature, 'Message Oracle must recover for the same exact reading');
  assert.equal(final.capture?.cardCode, seeded.cardCode, 'recovery must preserve the original Message Oracle card');
  assert.equal(final.draftSignature, seeded.signature, 'draft attachment must remain exact-reading scoped');
  assert.equal(final.home, true, 'Home SIGNAL section must remain present');
  assert.equal(final.button, true, 'Message Oracle action button must remain present');
  assert.equal(final.inline, true, 'Message Oracle inline result must remain present');
  assert.equal(final.spreadVisible, true, 'reading overlay must remain active after support calculation closes');

  const relevantErrors = pageErrors.filter(line => !/onrender\.com\/health|access control checks/i.test(line));
  assert.deepEqual(relevantErrors, [], `browser page errors:\n${relevantErrors.join('\n')}`);

  console.log('Message Oracle persistence + Horary support lifecycle E2E: PASS');
  console.log(JSON.stringify({signature:seeded.signature, recoveredCard:final.capture?.cardCode}, null, 2));
} finally {
  await browser.close();
}
