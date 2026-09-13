import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL=process.env.LUNEA_E2E_URL||'http://127.0.0.1:4173/index.html';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:393,height:852},
  isMobile:true,
  hasTouch:true,
  deviceScaleFactor:3,
  locale:'ko-KR',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
});
const page=await context.newPage();
page.setDefaultTimeout(20000);
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('dialog',async d=>d.accept());

await page.route(/lunea-intimacy-oracle-ui-v36\.js\?/,async route=>{
  await new Promise(resolve=>setTimeout(resolve,5000));
  await route.continue();
});
await page.route(/https:\/\/fonts\.googleapis\.com\//,route=>route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//,route=>route.fulfill({status:204,body:''}));
await page.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i,route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}));
await page.addInitScript(()=>{
  try{
    localStorage.clear();
    localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1','1');
    localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1','1');
  }catch{}
  try{sessionStorage.clear()}catch{}
});

try{
  await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
  const item=page.locator('.reading-item[data-title="신체적 속궁합 · CORE 5"]');
  await item.waitFor({state:'attached'});
  await item.click({force:true});
  await page.locator('#question').fill('실제 사용자 경로에서 늦게 로드된 오라클 UI가 현재 리딩과 동기화되는가?');
  await page.locator('#drawBtn').click({force:true});
  await page.waitForFunction(()=>document.getElementById('spreadOverlay')?.classList.contains('show') && Array.isArray(state?.drawn) && state.drawn.length>0);

  const beforeRuntime=await page.evaluate(()=>({
    title:state.title,
    category:state.category,
    drawn:state.drawn.length,
    oracleReady:!!window.LUNEA_INTIMACY_ORACLE_UI_V36,
    panelButton:!!document.getElementById('luneaOracleAddExtra')
  }));
  assert.equal(beforeRuntime.category,'INTIMACY');
  assert.ok(beforeRuntime.drawn>0,'INTIMACY tarot reading must already be open before Oracle runtime arrives');
  assert.equal(beforeRuntime.oracleReady,false,'test must reproduce the late-runtime window');
  assert.equal(beforeRuntime.panelButton,false,'supplemental button should not exist before Oracle runtime loads');

  await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.5',{timeout:15000});
  await page.waitForFunction(()=>document.getElementById('luneaOracleAddExtra') && !document.getElementById('luneaIntimacyOraclePanel')?.hidden,{timeout:5000});

  const afterRuntime=await page.evaluate(()=>({
    oracle:window.LUNEA_INTIMACY_ORACLE_UI_V36.getState(),
    label:document.getElementById('luneaOracleAddExtra')?.textContent||'',
    hidden:document.getElementById('luneaIntimacyOraclePanel')?.hidden
  }));
  assert.equal(afterRuntime.oracle.cards.length,1,'late runtime must draw/restore the configured base Oracle for the current reading');
  assert.equal(afterRuntime.oracle.extraCards.length,0);
  assert.match(afterRuntime.label,/오라클 추가 \(0\/3\)/);
  assert.equal(afterRuntime.hidden,false);

  await page.locator('#luneaOracleAddExtra').click();
  const afterExtra=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.getState());
  assert.equal(afterExtra.extraCards.length,1,'supplemental button must work after late-runtime synchronization');

  const relevant=pageErrors.filter(x=>!/onrender\.com\/health|access control checks/i.test(x));
  assert.deepEqual(relevant,[],`unexpected page errors:\n${relevant.join('\n')}`);
  console.log('INTIMACY late Oracle runtime sync WebKit regression: PASS');
}finally{
  await browser.close();
}
