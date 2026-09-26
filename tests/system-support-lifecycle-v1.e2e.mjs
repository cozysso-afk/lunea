import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';

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

const PRASHNA_FIXTURE = {
  schema:'LUNEA_PRASHNA_V1',
  question:{text:'그 사람이 나에게 먼저 연락할까요?'},
  moment:{local_iso:'2026-09-26T18:30:00+09:00',place_resolved:'Seoul',latitude:37.5665,longitude:126.978},
  ayanamsha:{degree:24.2},
  d1_rashi:{
    lagna:{rashi:'Kanya',rashi_ko:'처녀자리',degree:8.2,nakshatra:{name:'Uttara Phalguni',pada:4}},
    planets:{
      Moon:{rashi:'Kumbha',rashi_ko:'물병자리',degree:4.1,nakshatra:{name:'Dhanishta',pada:4}},
      Sun:{rashi:'Kanya',rashi_ko:'처녀자리',degree:9.5}
    }
  },
  panchanga:{
    vara:{name:'Shukravara',label_ko:'금요일',vedic_day_date:'2026-09-26',today_sunrise_local:'2026-09-26T06:22:00+09:00'},
    tithi:{paksha:'Shukla',paksha_number:15,index:15},
    nakshatra:{name:'Dhanishta',pada:4}
  },
  judgment_support:{
    support_band_ko:'중간',support_score:2,
    route:{note_ko:'연락 사건축을 독립적으로 확인',subject_house:7,event_house:9,subject_lord:'Guru',event_lord:'Shani'},
    factors:[{score:1,label_ko:'Moon 연결',detail_ko:'사건축과 연결'}],confidence_flags:[]
  }
};

const THAI_FIXTURE = {
  birth:{weekday_label:'금요일',ruler:{key:'Venus',ko:'금성'},planet_number:6},
  question:{focus_positions:['Sri'],focus_rows:[{position:'Sri',position_ko:'스리'}]},
  grid:[
    {position:'Boriwan',position_ko:'보리완',position_thai:'บริวาร',planet:'Moon',planet_ko:'달',meaning_ko:'주변 인연'},
    {position:'Sri',position_ko:'스리',position_thai:'ศรี',planet:'Venus',planet_ko:'금성',meaning_ko:'매력과 호의'},
    {position:'Kalakini',position_ko:'칼라키니',position_thai:'กาลกิณี',planet:'Saturn',planet_ko:'토성',meaning_ko:'주의 요소'}
  ],
  current_day:{ruler:{key:'Saturn',ko:'토성'},falls_in_natal_taksa:{position:'Sri',position_ko:'스리',meaning_ko:'오늘의 보조 흐름'}}
};

const VEDIC_FIXTURE = {
  ayanamsha:{degree:24.2},
  d1_rashi:{
    lagna:{rashi:'Kanya',rashi_ko:'처녀자리',degree:8.2,nakshatra:{name:'Uttara Phalguni',pada:4}},
    planets:{
      Sun:{rashi:'Kanya',rashi_ko:'처녀자리',degree:9.5,whole_sign_house:1,nakshatra:{name:'Uttara Phalguni',pada:4}},
      Moon:{rashi:'Kumbha',rashi_ko:'물병자리',degree:4.1,whole_sign_house:6,nakshatra:{name:'Dhanishta',pada:4}},
      Mercury:{rashi:'Kanya',rashi_ko:'처녀자리',degree:17.2,whole_sign_house:1,nakshatra:{name:'Hasta',pada:1}}
    }
  },
  panchanga:{
    tithi:{paksha:'Shukla',paksha_number:15,index:15},
    vara:{name:'Shukravara'},
    yoga:{name:'Siddhi'},karana:{name:'Bava'},nakshatra:{name:'Dhanishta'}
  },
  provenance:{engine:'Swiss Ephemeris',ayanamsha:'Lahiri',node_policy:'true',panchanga_vara_boundary:'civil_midnight_v1'}
};

async function makePage(browser, {seedNatal=false}={}) {
  const context = await browser.newContext({
    viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3,
    locale:'ko-KR',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const dialogs=[];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });
  const pageErrors=[];
  page.on('pageerror', e => pageErrors.push(String(e?.stack || e)));

  await page.addInitScript(({seedNatal}) => {
    try {
      localStorage.setItem('LUNEA_ASTRO_API_URL','https://e2e.invalid');
      localStorage.setItem('LUNEA_API_KEY','e2e-key');
      if (seedNatal) {
        localStorage.setItem('LUNEA_ASTRO_NATAL_V3', JSON.stringify({
          schema:'LUNEA_ASTRO_NATAL_V3',birth:{date:'1990-05-12',time:'10:30',place_input:'Seoul',place_resolved:'Seoul'}
        }));
      }
    } catch {}
    try {
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text => { window.__LUNEA_E2E_CLIPBOARD__=String(text); }}});
    } catch {}
  }, {seedNatal});

  await page.route('**/lunea-build.json?*', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:'e2e-system-lifecycle-v1'})}));
  await page.route(/https:\/\/fonts\.googleapis\.com\//, route => route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//, route => route.fulfill({status:204,body:''}));
  await page.route(/\/health(?:\?|$)/, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}));
  await page.route(/\/v1\/horary(?:\?|$)/, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(HORARY_FIXTURE)}));
  await page.route(/\/v1\/prashna(?:\?|$)/, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(PRASHNA_FIXTURE)}));
  await page.route(/\/v1\/thai\/taksa(?:\?|$)/, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(THAI_FIXTURE)}));
  await page.route(/\/v1\/vedic\/profile(?:\?|$)/, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(VEDIC_FIXTURE)}));

  await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForFunction(() => document.documentElement.classList.contains('lunea-ui-ready'), null, {timeout:25000});
  return {context,page,dialogs,pageErrors};
}

async function testHoraryPrashna(browser) {
  const {context,page,dialogs,pageErrors}=await makePage(browser);
  const horaryTile=page.locator('#luneaHomePortalV8 .lunea-v8-tile[data-key="horary"]');
  await horaryTile.waitFor({state:'visible'});
  await horaryTile.click();
  await page.waitForSelector('#horaryStandaloneItem',{state:'visible'});
  await page.locator('#horaryStandaloneItem').click();
  await page.waitForSelector('#astroHoraryOverlay.show');
  await page.locator('#astroHoraryQuestion').fill('그 사람이 나에게 먼저 연락할까요?');
  await page.locator('#astroHoraryMoment').fill('2026-09-26T18:30');
  await page.locator('#astroHoraryPlace').fill('Seoul');
  await page.locator('#astroHoraryTopic').selectOption('contact');
  await page.locator('#astroHoraryRun').click();
  await page.waitForFunction(() => document.getElementById('astroHoraryStatus')?.textContent?.includes('계산 완료'));
  assert.equal(await page.locator('#astroHoraryResult').evaluate(el => el.classList.contains('show')), true);
  assert.match(await page.locator('#astroHoraryResult').innerText(), /성사각|주요 시그니피케이터/);

  await page.waitForSelector('#luneaPrashnaRunV1');
  await page.locator('#luneaPrashnaRunV1').click();
  await page.waitForFunction(() => document.getElementById('luneaPrashnaV1Status')?.textContent?.includes('계산 완료'));
  assert.match(await page.locator('#luneaPrashnaV1Result').innerText(), /PRASHNA V1|구조적 지원/);
  const prashnaStored = await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_PRASHNA_V1_LAST') || 'null'));
  assert.equal(prashnaStored?.data?.schema,'LUNEA_PRASHNA_V1');

  await page.locator('#astroHoraryCopy').click();
  await page.waitForFunction(() => String(window.__LUNEA_E2E_CLIPBOARD__ || '').includes('LUNEA · HORARY'));
  const copied = await page.evaluate(() => window.__LUNEA_E2E_CLIPBOARD__ || '');
  assert.match(copied,/질문: 그 사람이 나에게 먼저 연락할까요/);

  await page.locator('#astroHorarySave').click();
  await page.waitForFunction(() => {
    try { return (JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]')[0]?.horary?.schema) === 'LUNEA_HORARY_V1'; } catch { return false; }
  });
  const archive = await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]'));
  assert.equal(archive[0].title,'HORARY · 질문시각 점성술');
  assert.equal(archive[0].q,'그 사람이 나에게 먼저 연락할까요?');

  await page.locator('#astroHoraryClose').click();
  await page.locator('#archiveBtn').click({force:true});
  await page.waitForSelector('#archiveOverlay.show');
  const archiveText=await page.locator('#archiveList').innerText();
  assert.match(archiveText,/HORARY|질문시각 점성술/);
  assert.match(archiveText,/그 사람이 나에게 먼저 연락할까요/);
  assert.ok(dialogs.some(x => /호라리 리딩을 기록함에 저장/.test(x)), 'Horary save confirmation missing');
  assert.equal(pageErrors.length,0,`Horary/Prashna page errors:\n${pageErrors.join('\n')}`);
  await context.close();
  console.log('Horary + Prashna calculate/copy/save/archive lifecycle: PASS');
}

async function testThai(browser) {
  const {context,page,pageErrors}=await makePage(browser,{seedNatal:true});
  const thaiTile=page.locator('#luneaHomePortalV8 .lunea-thai-home-tile');
  await thaiTile.waitFor({state:'visible',timeout:25000});
  await thaiTile.click();
  await page.waitForSelector('#luneaThaiStandaloneOverlay.show');
  await page.locator('#luneaThaiStandaloneRun').click();
  await page.waitForFunction(() => document.getElementById('luneaThaiStandaloneStatus')?.textContent?.includes('계산 완료'));
  assert.match(await page.locator('#luneaThaiStandaloneResult').innerText(),/금요일|스리|Thai|Taksa/i);
  const stored=await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_THAI_STANDALONE_V24_LAST') || 'null'));
  assert.equal(stored?.topic,'general');
  assert.equal(stored?.result?.birth?.ruler?.key,'Venus');

  await page.locator('#luneaThaiStandaloneClose').click();
  await thaiTile.click();
  await page.waitForFunction(() => document.getElementById('luneaThaiStandaloneStatus')?.textContent?.includes('다시 불러왔어'));
  assert.match(await page.locator('#luneaThaiStandaloneResult').innerText(),/금요일|스리/);
  assert.equal(pageErrors.length,0,`Thai page errors:\n${pageErrors.join('\n')}`);
  await context.close();
  console.log('Thai standalone calculate/persist/restore lifecycle: PASS');
}

async function testVedic(browser) {
  const {context,page,pageErrors}=await makePage(browser);
  await page.waitForSelector('#profileBtn');
  await page.locator('#profileBtn').click({force:true});
  await page.waitForSelector('#profileOverlay.show');
  await page.waitForSelector('#cpv4VedicTab',{timeout:25000});
  await page.locator('#birthDate').fill('1990-05-12');
  await page.locator('#birthTime').fill('10:30');
  await page.locator('#birthPlace').fill('Seoul');
  await page.locator('#cpv4VedicTab').click();
  await page.waitForSelector('#vedicV1Calc');
  await page.locator('#vedicV1Calc').click();
  await page.waitForFunction(() => document.getElementById('vedicV1Status')?.textContent?.includes('계산 완료'));
  assert.match(await page.locator('#vedicV1Result').innerText(),/LAGNA|Kanya|Dhanishta/);
  const stored=await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_VEDIC_PROFILE_V1') || 'null'));
  assert.equal(stored?.birthDate,'1990-05-12');
  assert.equal(stored?.birthTime,'10:30');
  assert.equal(stored?.birthPlace,'Seoul');
  assert.equal(stored?.data?.d1_rashi?.lagna?.rashi,'Kanya');
  assert.equal(pageErrors.length,0,`Vedic page errors:\n${pageErrors.join('\n')}`);
  await context.close();
  console.log('Vedic profile calculate/cache lifecycle: PASS');
}

const browser=await webkit.launch({headless:true});
try {
  await testHoraryPrashna(browser);
  await testThai(browser);
  await testVedic(browser);
  console.log('\nLUNEA system support lifecycle E2E: PASS');
} finally {
  await browser.close();
}
