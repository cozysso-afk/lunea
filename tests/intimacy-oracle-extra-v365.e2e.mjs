import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';

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

const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
page.on('dialog',async dialog=>dialog.accept());

await page.route('**/lunea-build.json?*', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:'intimacy-oracle-extra-e2e'})}));
await page.route(/https:\/\/fonts\.googleapis\.com\//, route => route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//, route => route.fulfill({status:204,body:''}));
await page.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i, route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}));
await page.addInitScript(()=>{
  try{
    localStorage.clear();
    localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1','1');
    localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1','1');
  }catch{}
  try{sessionStorage.clear()}catch{}
});

try {
  await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.readyState==='complete');
  await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_V35 && window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.5',null,{timeout:20000});

  const initial=await page.evaluate(()=>{
    state.category='INTIMACY';
    state.title='신체적 속궁합 · CORE 5';
    state.question='E2E · 추가 INTIMACY 오라클 최대 3장 검증';
    state.drawn=[{...TAROT_DECK[0],isReversed:false,position:'현재 친밀감 핵심',subCards:[]}];
    window.__LUNEA_INTIMACY_ACTIVE__=true;
    document.body.classList.add('lunea-intimacy-reading','modal-open');
    document.getElementById('spreadOverlay')?.classList.add('show');
    const before=window.LUNEA_READING_LIFECYCLE_V59?.currentSessionId?.()||0;
    window.LUNEA_INTIMACY_ORACLE_UI_V36.performOracleDraw();
    const now=window.LUNEA_INTIMACY_ORACLE_UI_V36.getState();
    return {before,base:now.cards.map(c=>c.code),extra:now.extraCards.map(c=>c.code),panelHidden:document.getElementById('luneaIntimacyOraclePanel')?.hidden};
  });
  assert.equal(initial.base.length,1,'configured INTIMACY mode should draw one base Oracle');
  assert.equal(initial.extra.length,0,'new base draw must start without supplemental Oracle');
  assert.equal(initial.panelHidden,false,'Oracle panel should be visible');

  await page.evaluate(()=>{
    const box=document.getElementById('aiBox');
    box.innerHTML='<div class="ai-card"><div class="ai-body" id="aiText">OLD AI INTERPRETATION</div></div>';
  });
  await page.locator('#luneaOracleAddExtra').click();
  const afterOne=await page.evaluate(()=>({
    state:window.LUNEA_INTIMACY_ORACLE_UI_V36.getState(),
    ai:document.getElementById('aiBox')?.textContent||'',
    sidecar:JSON.parse(localStorage.getItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1')||'null'),
    session:window.LUNEA_READING_LIFECYCLE_V59?.currentSessionId?.()||0
  }));
  assert.equal(afterOne.state.extraCards.length,1,'first supplemental draw missing');
  assert.match(afterOne.ai,/다시 눌러줘/,'existing AI interpretation must be invalidated after supplemental draw');
  assert.equal(afterOne.sidecar?.extraCards?.length,1,'sidecar must persist supplemental card');
  assert.equal(afterOne.session,initial.before,'supplemental Oracle must not start a new reading session');

  await page.locator('#luneaOracleAddExtra').click();
  await page.locator('#luneaOracleAddExtra').click();
  const afterThree=await page.evaluate(()=>{
    const api=window.LUNEA_INTIMACY_ORACLE_UI_V36;
    const now=api.getState();
    const prompt=api.buildOraclePromptLayer();
    const serialized=api.serializeOracle();
    const button=document.getElementById('luneaOracleAddExtra');
    return {
      base:now.cards.map(c=>c.code),
      extra:now.extraCards.map(c=>c.code),
      prompt,
      serialized,
      disabled:!!button?.disabled,
      label:button?.textContent||'',
      session:window.LUNEA_READING_LIFECYCLE_V59?.currentSessionId?.()||0
    };
  });
  assert.equal(afterThree.extra.length,3,'supplemental Oracle must stop at three');
  assert.equal(new Set([...afterThree.base,...afterThree.extra]).size,4,'base/supplemental Oracle cards must not duplicate');
  assert.equal(afterThree.disabled,true,'add button must disable at max 3');
  assert.match(afterThree.label,/3\/3/);
  assert.match(afterThree.prompt,/\[BASE ORACLE\]/);
  assert.match(afterThree.prompt,/\[SUPPLEMENTAL ORACLE DRAW\]/);
  assert.match(afterThree.prompt,/\[SUPPLEMENTAL INTERPRETATION CONTRACT\]/);
  assert.equal(afterThree.serialized?.extraCards?.length,3,'archive serialization must include all supplemental cards');
  assert.equal(afterThree.session,initial.before,'three supplemental draws must remain in the same reading session');

  const apiFourth=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.addSupplementalOracle());
  assert.equal(apiFourth,false,'fourth supplemental draw must be rejected');
  assert.equal((await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().extraCards.length)),3);

  const beforeRestore=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().extraCards.map(c=>c.code));
  await page.evaluate(()=>{
    window.LUNEA_INTIMACY_ORACLE_UI_V36.clear();
    window.LUNEA_INTIMACY_ORACLE_UI_V36.sync();
  });
  const afterRestore=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().extraCards.map(c=>c.code));
  assert.deepEqual(afterRestore,beforeRestore,'supplemental cards must restore from sidecar in the same reading');

  await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.performOracleDraw());
  const reset=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.getState());
  assert.equal(reset.extraCards.length,0,'a genuinely new base Oracle draw must clear supplemental cards');

  const relevantErrors=pageErrors.filter(line=>!/onrender\.com\/health|access control checks/i.test(line));
  assert.deepEqual(relevantErrors,[],`unexpected page errors:\n${relevantErrors.join('\n')}`);
  console.log('INTIMACY Oracle V36.5 supplemental max-3 WebKit runtime regression: PASS');
} finally {
  await browser.close();
}
