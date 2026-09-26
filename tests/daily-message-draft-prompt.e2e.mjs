import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const BUILD = 'daily-message-draft-e2e';
const MESSAGE_MARKER = '[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조]';
const QUESTION = '오늘 연락과 소식 흐름에서 내가 확인해야 할 핵심은 무엇일까?';
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
page.setDefaultTimeout(20000);

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

await page.addInitScript(() => {
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
});

function stateSnapshot() {
  return page.evaluate(() => {
    let s = null;
    try { s = state; } catch { s = window.state || null; }
    return {
      category:String(s?.category || ''),
      title:String(s?.title || ''),
      question:String(s?.question || ''),
      drawn:Array.isArray(s?.drawn) ? s.drawn.map(card => ({code:card?.code,isReversed:!!card?.isReversed})) : [],
      positions:Array.isArray(s?.positions) ? [...s.positions] : [],
      message:window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.capture?.() || null,
      prompt:typeof window.promptString === 'function' ? window.promptString() : '',
      draft:(() => { try { return JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1') || 'null'); } catch { return null; } })()
    };
  });
}

try {
  await page.goto(BASE_URL, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForFunction(() =>
    !!window.LUNEA_READING_DRAFT_V1 &&
    !!window.LUNEA_READING_ATTACHMENTS_V1 &&
    !!window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1 &&
    typeof window.LUNEA_LOAD_FEATURE_GROUP === 'function'
  );

  const seeded = await page.evaluate(async ({question, positions, codes}) => {
    const loaded = await window.LUNEA_LOAD_FEATURE_GROUP('message');
    if (!loaded || !window.LUNEA_MESSAGE_ORACLE_V1) return {ok:false, reason:'message engine did not load'};

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
      desc:'DAILY ORBIT 6 browser E2E fixture',
      count:6,
      isAi:false,
      allowReversed:false,
      positions:[...positions],
      rationale:'DAILY ORBIT 6 · exact-reading Message Oracle draft regression',
      question,
      drawn,
      used:new Set(codes)
    });

    const registry = window.LUNEA_READING_ATTACHMENTS_V1;
    const support = window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1;
    const signature = registry.signature(s);
    const payload = {
      version:1,
      mode:'support',
      readingSignature:signature,
      question,
      context:'GENERAL',
      cardCode:'Sun',
      score:1,
      createdAt:new Date().toISOString()
    };
    if (!support.restore(payload)) return {ok:false, reason:'Message Oracle exact-reading restore rejected fixture'};
    if (!registry.notifyChanged('messageOracle')) return {ok:false, reason:'attachment registry did not capture Message Oracle'};

    window.LUNEA_READING_DRAFT_V1.snapshot();
    const draft = window.LUNEA_READING_DRAFT_V1.readDraft();
    if (!draft) return {ok:false, reason:'draft snapshot missing'};

    const now = new Date();
    const day = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    localStorage.setItem('LUNEA_DAILY_ORBIT_V1', JSON.stringify({
      day,
      savedAt:Date.now(),
      category:'DAILY',
      title:'DAILY ORBIT 6',
      question,
      positions:[...positions],
      drawn:JSON.parse(JSON.stringify(drawn))
    }));

    return {ok:true, signature, draft};
  }, {question:QUESTION, positions:POSITIONS, codes:CODES});

  assert.equal(seeded.ok, true, seeded.reason || 'failed to seed Daily + Message Oracle');
  assert.equal(seeded.draft.category, 'DAILY');
  assert.equal(seeded.draft.drawn.length, 6, 'Daily draft must retain all six Orbit cards');
  assert.equal(seeded.draft.attachments?.readingSignature, seeded.signature, 'draft attachment signature must match exact Daily reading');
  assert.equal(seeded.draft.attachments?.messageOracle?.readingSignature, seeded.signature, 'Message Oracle entry must be bound to exact Daily reading');
  assert.equal(seeded.draft.attachments?.messageOracle?.data?.cardCode, 'Sun', 'Message Oracle card must persist in temporary draft');

  const beforeReload = await stateSnapshot();
  assert.ok(beforeReload.prompt.includes(MESSAGE_MARKER), 'current Daily AI prompt must include Message Oracle before reload');
  assert.ok(beforeReload.prompt.includes('카드:') && beforeReload.prompt.includes('Sun'), 'prompt must carry the real Message Oracle card evidence');

  // Simulate PWA/browser termination and reopen. DAILY ORBIT boot should choose
  // the exact autosaved draft because its six locked cards match today's lock.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForFunction(({question, codes}) => {
    let s = null;
    try { s = state; } catch { s = window.state || null; }
    const actual = Array.isArray(s?.drawn) ? s.drawn.slice(0,6).map(card => String(card?.code || '')) : [];
    return s?.category === 'DAILY' && s?.question === question && JSON.stringify(actual) === JSON.stringify(codes);
  }, {question:QUESTION,codes:CODES}, {timeout:25000});
  await page.waitForFunction(() => !!window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.capture?.(), null, {timeout:25000});
  await page.waitForFunction(() => typeof window.promptString === 'function' && window.promptString().includes('[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조]'), null, {timeout:25000});

  const restored = await stateSnapshot();
  assert.equal(restored.category, 'DAILY');
  assert.equal(restored.question, QUESTION);
  assert.deepEqual(restored.positions.slice(0,6), POSITIONS, 'exact Daily positions must restore');
  assert.deepEqual(restored.drawn.slice(0,6).map(card => card.code), CODES, 'exact Daily cards must restore without re-draw');
  assert.equal(restored.message?.cardCode, 'Sun', 'Message Oracle must restore with exact Daily draft');
  assert.equal(restored.message?.readingSignature, seeded.signature, 'restored Message Oracle signature must stay bound to original Daily reading');
  assert.ok(restored.prompt.includes(MESSAGE_MARKER), 'restored Daily AI prompt must include Message Oracle');
  assert.ok(restored.prompt.includes('실제 통계 확률이나 합격·승인·긍정 결과 확률이 아니다'), 'Message Oracle probability guard must survive final prompt assembly');

  // A stale Message Oracle result must never leak after the reading identity changes.
  const staleCheck = await page.evaluate(marker => {
    let s = null;
    try { s = state; } catch { s = window.state || null; }
    s.question = '다른 질문으로 바뀐 새 리딩';
    const block = window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.promptBlock?.() || '';
    const prompt = typeof window.promptString === 'function' ? window.promptString() : '';
    return {block, prompt, markerPresent:prompt.includes(marker)};
  }, MESSAGE_MARKER);
  assert.equal(staleCheck.block, '', 'stale Message Oracle adapter must return no prompt block');
  assert.equal(staleCheck.markerPresent, false, 'stale Message Oracle must not leak into a different reading prompt');

  const relevantErrors = pageErrors.filter(line => !/onrender\.com\/health|access control checks/i.test(line));
  assert.deepEqual(relevantErrors, [], `browser page errors:\n${relevantErrors.join('\n')}`);

  console.log('DAILY + Message Oracle exact-draft browser E2E: PASS');
  console.log(JSON.stringify({signature:seeded.signature,cards:CODES,messageCard:restored.message.cardCode}, null, 2));
} finally {
  await browser.close();
}
