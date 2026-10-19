import assert from 'node:assert/strict';
import {webkit, chromium} from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const origin = new URL(url).origin;
const browser = process.env.LUNEA_E2E_BROWSER === 'chromium'
  ? await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox']})
  : await webkit.launch({headless:true});
const finalMarker = '[FINAL READING PRIORITY · 최종 근거 우선순위]';
const failures = [];
const HORARY_FIXTURE = {
  schema:'LUNEA_HORARY_V1',
  question:{text:'그 사람이 나에게 먼저 연락할까요?',topic:'contact',topic_label_ko:'연락·메시지'},
  moment:{local_iso:'2026-09-26T18:30:00+09:00',place_resolved:'Seoul',latitude:37.5665,longitude:126.978},
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
    perfection:{perfects:true,reason_ko:'유효 오브 안 적용각이 완성됨',exact_local:'2026-09-27T03:00:00+09:00'},
    reception:{has_reception:true,mutual_reception:false,same_significator:false},
    moon_course:{void_of_course:false,next_aspects:[{body_ko:'화성',aspect_ko:'Trine(삼합)'}],hours_to_sign_exit:11.2},
    potential_prohibition:[]
  },
  meta:{engine:'E2E fixture'}
};

async function setup() {
  const context = await browser.newContext({viewport:{width:393,height:852}, isMobile:true, hasTouch:true, locale:'ko-KR', serviceWorkers:'block'});
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('dialog', dialog => dialog.accept());
  page.on('crash', () => console.error('renderer crash', page.url()));
  const requests = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const target = new URL(request.url());
    if (target.hostname === 'generativelanguage.googleapis.com') {
      requests.push(request.postDataJSON());
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({candidates:[{content:{parts:[{text:'### 한줄 결론\n모의 응답입니다.\n근거: 입력 검증용.'}]},finishReason:'STOP'}]})});
    }
    if (target.origin === origin) return route.continue();
    return route.fulfill({status:200, contentType:target.pathname.endsWith('.css') ? 'text/css' : 'application/json', body:target.hostname.includes('fonts') ? '' : '{}'});
  });
  await page.addInitScript(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1', '1');
    localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1', '1');
  });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.LUNEA_FINAL_PROMPT_PRIORITY_V1 && window.LUNEA_INTIMACY_ORACLE_UI_V36 && window.LUNEA_DAILY_INTERPRETATION_CONTRACT_V2 && window.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47 && window.LUNEA_HORARY_ANSWER_VALIDATOR_V48 && window.LUNEA_LENORMAND_V1 && window.LUNEA_MEIHUA_V1);
  return {context,page,requests};
}

async function draw(page, category, question) {
  await page.evaluate(cat => {
    const item = cat === 'INTIMACY'
      ? document.querySelector('.reading-item[data-title="신체적 속궁합 · CORE 5"]')
      : [...document.querySelectorAll(`.reading-item[data-cat="${cat}"]`)].find(node => Number(node.dataset.count) > 0 && !node.dataset.luneaManual);
    if (!item) throw new Error('missing category '+cat);
    item.click();
  }, category);
  await page.locator('#question').fill(question);
  await page.locator('#drawBtn').dispatchEvent('click');
  await page.waitForFunction(() => state.drawn?.length > 0 && document.getElementById('spreadOverlay')?.classList.contains('show'));
}
async function check(name, fn) {
  console.log('RUN:',name);
  const instance = await setup();
  try { await fn(instance); console.log('PASS:',name); }
  catch (error) { failures.push(name+': '+error.message); console.error(error.stack); }
  finally { await instance.context.close(); }
}

try {
  await check('RWS+Horary support preserves actual cards even when user quotes provenance', async ({page,requests}) => {
    await draw(page, 'LOVE', '"[LUNEA HORARY AI REQUEST V47]"라는 문구를 봤는데 그는 나를 어떻게 생각할까?');
    const result = await page.evaluate(async () => {
      const base = promptString();
      const support = base + '\n\n[HORARY V1 · 질문시각 점성술 계산 결과]\n보조 참고만 한다.';
      await fetch('https://generativelanguage.googleapis.com/v1beta/models/test:generateContent?key=mock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:support}]}]})});
      return {base,support,cards:state.drawn.map(row => row.name)};
    });
    assert.equal(result.base.split(finalMarker).length-1,1);
    assert.match(result.base,/카드상 가설/);
    assert.match(result.base,/반증이나 50:50 균형을 위해 없는 대안을 생성하지 않는다/);
    for (const card of result.cards) assert.ok(result.base.includes(card),'real card stays in prompt: '+card);
    assert.equal(requests.length,1,'general Tarot is not retried by Horary validator');
    assert.equal(requests[0].contents[0].parts[0].text,result.support);
  });
  await check('INTIMACY paired text evidence and late Oracle retain one final policy', async ({page}) => {
    await draw(page, 'INTIMACY', '그와의 신체적 속궁합은 어떨까?');
    await page.waitForFunction(() => window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().cards.length > 0);
    const prompt = await page.evaluate(() => {
      window.LUNEA_FINAL_PROMPT_PRIORITY_V1.ensure();
      return promptString();
    });
    assert.match(prompt,/정방향도 core만으로 결론내리지/);
    assert.match(prompt,/역방향도 자동 부정이 아니며/);
    assert.match(prompt,/상대 관련 포지션은 카드상 가설/);
    assert.doesNotMatch(prompt,/focus axes:|risk axes:/);
    assert.equal(prompt.split(finalMarker).length-1,1);
    await page.evaluate(() => {document.querySelector('[data-close="spread"]').click();document.getElementById('dailyBtn').click();});
    await page.waitForFunction(() => state.category === 'DAILY' && state.drawn?.length > 0);
    const daily = await page.evaluate(() => promptString());
    assert.match(daily,/\[방향성 중립\]/);
    assert.match(daily,/허위 균형은 금지/);
    assert.equal(daily.split(finalMarker).length-1,1);
  });
  await check('A/B timing keeps images and conditional event language', async ({page}) => {
    await draw(page, 'LOVE', 'A와 B는 각각 언제 연락할까?');
    await page.evaluate(() => document.getElementById('timingSupportBtn').click());
    await page.waitForFunction(() => document.getElementById('timingOverlay')?.classList.contains('show'));
    await page.locator('#timingDraw').dispatchEvent('click');
    await page.waitForSelector('#luneaTimingABInline .lunea-tabi-card');
    assert.equal(await page.locator('#luneaTimingABInline img').count(),2);
    assert.equal(await page.locator('#luneaTimingABInline .lunea-tabi-conditional').count(),2);
    assert.match(await page.locator('#luneaTimingABInline').innerText(),/성립한다면/);
    assert.match(await page.evaluate(() => promptString()),/성립/);
  });
  await check('standalone Lenormand and Meihua retain their own evidence contracts', async ({page}) => {
    await page.evaluate(() => window.LUNEA_LENORMAND_V1.open());
    await page.locator('#lnQuestion').fill('이 계약은 어떤 흐름일까?');
    await page.locator('#lnDraw').dispatchEvent('click');
    const lenormand = await page.evaluate(() => window.LUNEA_LENORMAND_V1.buildPrompt());
    assert.match(lenormand,/실제 반대·제한 단서가 없으면/);
    assert.match(lenormand,/긍정과 부정을 기계적으로 평균/);
    assert.doesNotMatch(lenormand,/FINAL READING PRIORITY/);
    await page.evaluate(() => {window.LUNEA_LENORMAND_V1.close();window.LUNEA_MEIHUA_V1.open();});
    await page.locator('#mhQuestion').fill('이 계약은 어떤 흐름일까?');
    await page.evaluate(() => window.LUNEA_MEIHUA_V1.castNow());
    const meihua = await page.evaluate(() => window.LUNEA_MEIHUA_V1.buildPrompt());
    assert.match(meihua,/경쟁|제한/);
    assert.match(meihua,/기계|50:50|허위/);
    assert.doesNotMatch(meihua,/FINAL READING PRIORITY/);
  });
  await check('all main sectors reveal local direction-aware descriptions', async ({page,requests}) => {
    for (const category of ['GENERAL','LOVE','CAREER','STOCK']) {
      await draw(page, category, '현재 이 선택을 어떻게 봐야 할까?');
      assert.equal(await page.locator('.lunea-card-meaning').count(),0,'face-down cards disclose no description');
      await page.locator('#flipAll').dispatchEvent('click');
      await page.waitForFunction(() => document.querySelectorAll('#results .lunea-card-meaning').length === state.drawn.length);
      const rows = await page.evaluate(() => state.drawn.map((card,i) => ({actual:document.querySelector('#info-'+i+' .lunea-card-meaning')?.textContent,expected:window.LUNEA_CARD_MEANINGS_V1.meaning(card)})));
      assert.ok(rows.every(row => row.actual === row.expected));
      await page.evaluate(() => document.querySelector('[data-close="spread"]').click());
    }
    await page.locator('#dailyBtn').dispatchEvent('click');
    await page.waitForFunction(() => state.category === 'DAILY' && state.drawn.length > 0);
    await page.locator('#flipAll').dispatchEvent('click');
    await page.waitForFunction(() => document.querySelectorAll('#results .lunea-card-meaning').length === state.drawn.length);
    assert.equal(requests.length,0,'local card descriptions need no Gemini requests');
  });
  await check('actual Tarot AI button preserves cards after calculating Horary support', async ({page,requests}) => {
    const question = '그 사람이 나에게 먼저 연락할까요?';
    await draw(page, 'LOVE', question);
    await page.evaluate(fixture => {
      const prior = window.fetch.bind(window);
      window.fetch = (input,init) => {
        const url = typeof input === 'string' ? input : input.url;
        const path = new URL(url,location.href).pathname;
        if (/\/health\/?$/.test(path)) return Promise.resolve(new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}}));
        if (path === '/v1/horary') return Promise.resolve(new Response(JSON.stringify(fixture),{headers:{'Content-Type':'application/json'}}));
        return prior(input,init);
      };
      localStorage.setItem('LUNEA_API_KEY','mock-key');
    }, HORARY_FIXTURE);
    await page.locator('#horarySupportBtn').dispatchEvent('click');
    await page.waitForSelector('#astroHoraryOverlay.show');
    await page.locator('#astroHoraryPlace').fill('Seoul');
    await page.locator('#astroHoraryRun').dispatchEvent('click');
    await page.waitForFunction(() => window.LUNEA_ASTRO_HORARY_V1.getCurrent()?.schema === 'LUNEA_HORARY_V1');
    await page.locator('#astroHoraryClose').dispatchEvent('click');
    const drawn = await page.evaluate(() => state.drawn.map(card => ({name:card.name,position:card.position,isReversed:card.isReversed})));
    await page.locator('#aiRead').dispatchEvent('click');
    await page.waitForFunction(() => document.getElementById('aiText')?.textContent?.includes('모의 응답입니다.'));
    assert.equal(requests.length,1,'Tarot output never enters Horary retry/hold');
    const actual = requests[0].contents[0].parts[0].text;
    assert.match(actual,/^\[LUNEA TAROT READING · HORARY SUPPORT\]/);
    assert.match(actual,/\[LUNEA TAROT HORARY SUPPORT · 계산 결과\]/);
    assert.doesNotMatch(actual,/\[HORARY V1 · 질문시각 점성술 계산 결과\]|FINAL VERDICT LOCK|HORARY ANSWER VALIDATOR/);
    for (const card of drawn) {
      assert.ok(actual.includes(card.name),'actual card name retained');
      assert.ok(actual.includes(card.position),'actual position retained');
    }
    assert.match(actual,/먼저 실제로 뽑힌 타로 카드/);
    assert.match(actual,/그 사람이 나에게 먼저 연락할까요/);
    await page.evaluate(() => document.querySelector('[data-close="spread"]').click());
    await draw(page,'GENERAL','다음 선택은 어떨까?');
    assert.doesNotMatch(await page.evaluate(() => promptString()),/LUNEA TAROT HORARY SUPPORT/,'previous support cannot leak into the next reading');
  });
  assert.deepEqual(failures,[],'Mobile balanced interpretation regressions failed');
} finally { await browser.close(); }
