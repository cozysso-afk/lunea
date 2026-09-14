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

let releaseOracleRuntime=()=>{};
const oracleGate=new Promise(resolve=>{releaseOracleRuntime=resolve;});
await page.route(/lunea-intimacy-oracle-ui-v36\.js\?/,async route=>{
  await oracleGate;
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

  const portal=page.locator('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
  await portal.waitFor({state:'visible'});
  await portal.click();

  const item=page.locator('.reading-item[data-title="신체적 속궁합 · CORE 5"]');
  await item.waitFor({state:'visible'});
  await item.click();
  await page.locator('#question').fill('실제 사용자 경로에서 늦게 로드된 오라클 UI가 현재 리딩과 동기화되는가?');
  await page.locator('#drawBtn').click();
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

  const draftSeed=await page.evaluate(()=>{
    const copy=value=>JSON.parse(JSON.stringify(value));
    return {
      version:2,
      savedAt:Date.now(),
      category:'INTIMACY',
      title:String(state.title||''),
      desc:String(state.desc||''),
      count:Number(state.count||state.positions?.length||state.drawn?.length||1),
      isAi:!!state.isAi,
      allowReversed:!!state.allowReversed,
      positions:copy(state.positions||[]),
      rationale:String(state.rationale||''),
      question:'E2E · 늦은 Oracle runtime에서도 O01 exact draft를 보존한다',
      drawn:copy(state.drawn||[]),
      flipped:[],
      aiText:'',
      manualReading:!!state.__luneaManualReading,
      manualMode:!!state.__luneaManualMode,
      manualPositions:copy(state.__luneaManualPositions||null),
      intimacyOracle:{
        version:2,
        runtimeVersion:'36.5',
        mode:1,
        cards:[{code:'O01',lens:'전체 리딩 렌즈'}],
        extraCards:[],
        revealed:[0],
        extraRevealed:[],
        stamp:''
      }
    };
  });

  await page.evaluate(()=>document.querySelector('[data-close="spread"]')?.click());
  await page.waitForFunction(()=>!document.getElementById('spreadOverlay')?.classList.contains('show'));
  await page.waitForTimeout(180);
  await page.waitForFunction(()=>!!window.LUNEA_READING_DRAFT_V1?.restoreDraft);

  await page.evaluate(seed=>{
    localStorage.setItem('LUNEA_LAST_READING_DRAFT_V1',JSON.stringify(seed));
    state.category='GENERAL';
    state.question='E2E stale state before restore';
    window.LUNEA_READING_DRAFT_V1.restoreDraft();
  },draftSeed);
  await page.waitForFunction(()=>document.getElementById('spreadOverlay')?.classList.contains('show'));
  await page.waitForTimeout(300);

  const beforeRelease=await page.evaluate(()=>{
    const d=JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')||'null');
    return {
      question:String(state?.question||''),
      savedOracle:d?.intimacyOracle||null,
      restoringOracle:window.__LUNEA_DRAFT_RESTORING_INTIMACY_ORACLE__===true,
      oracleReady:!!window.LUNEA_INTIMACY_ORACLE_UI_V36
    };
  });
  assert.equal(beforeRelease.question,draftSeed.question,'draft question must restore before Oracle runtime arrives');
  assert.equal(beforeRelease.oracleReady,false,'Oracle runtime must still be held after the old 120ms race window');
  assert.equal(beforeRelease.restoringOracle,true,'exact Oracle restore guard must remain active while runtime is pending');
  assert.equal(beforeRelease.savedOracle?.cards?.[0]?.code,'O01','120ms autosave must not overwrite pending exact Oracle draft with null');

  releaseOracleRuntime();
  await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.5',{timeout:15000});
  await page.waitForFunction(()=>document.getElementById('luneaOracleAddExtra') && !document.getElementById('luneaIntimacyOraclePanel')?.hidden,{timeout:5000});
  await page.waitForFunction(()=>window.__LUNEA_DRAFT_RESTORING_INTIMACY_ORACLE__!==true,{timeout:5000});
  await page.waitForTimeout(180);

  const afterRuntime=await page.evaluate(()=>{
    const button=document.getElementById('luneaOracleAddExtra');
    const panel=document.getElementById('luneaIntimacyOraclePanel');
    const overlay=document.getElementById('spreadOverlay');
    const rect=button?.getBoundingClientRect();
    const style=button?getComputedStyle(button):null;
    const panelStyle=panel?getComputedStyle(panel):null;
    const d=JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')||'null');
    const oracle=window.LUNEA_INTIMACY_ORACLE_UI_V36.getState();
    return {
      oracleCodes:oracle.cards.map(card=>card.code),
      extraCodes:oracle.extraCards.map(card=>card.code),
      revealed:[...oracle.revealed],
      savedOracle:d?.intimacyOracle||null,
      label:button?.textContent||'',
      hidden:panel?.hidden,
      overlayShow:!!overlay?.classList.contains('show'),
      buttonRect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null,
      buttonDisplay:style?.display||'',
      buttonVisibility:style?.visibility||'',
      buttonOpacity:style?.opacity||'',
      panelDisplay:panelStyle?.display||'',
      panelVisibility:panelStyle?.visibility||''
    };
  });
  assert.deepEqual(afterRuntime.oracleCodes,['O01'],'late runtime must restore the exact saved Oracle instead of re-drawing');
  assert.deepEqual(afterRuntime.extraCodes,[]);
  assert.deepEqual(afterRuntime.revealed,[0]);
  assert.equal(afterRuntime.savedOracle?.cards?.[0]?.code,'O01','post-restore autosave must keep exact Oracle snapshot');
  assert.match(afterRuntime.label,/오라클 추가 \(0\/3\)/);
  assert.equal(afterRuntime.hidden,false);
  assert.equal(afterRuntime.overlayShow,true,'spread overlay must remain open after Oracle runtime arrives');
  assert.notEqual(afterRuntime.buttonDisplay,'none',`supplemental button display:none: ${JSON.stringify(afterRuntime)}`);
  assert.notEqual(afterRuntime.buttonVisibility,'hidden',`supplemental button visibility:hidden: ${JSON.stringify(afterRuntime)}`);
  assert.ok((afterRuntime.buttonRect?.width||0)>0 && (afterRuntime.buttonRect?.height||0)>0,`supplemental button must have visible geometry: ${JSON.stringify(afterRuntime)}`);

  await page.evaluate(()=>document.getElementById('luneaOracleAddExtra')?.click());
  const afterExtra=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36.getState());
  assert.equal(afterExtra.extraCards.length,1,'supplemental button must work after late-runtime synchronization');

  const relevant=pageErrors.filter(x=>!/onrender\.com\/health|access control checks/i.test(x));
  assert.deepEqual(relevant,[],`unexpected page errors:\n${relevant.join('\n')}`);
  console.log('INTIMACY late Oracle runtime exact-draft regression: PASS');
}finally{
  releaseOracleRuntime();
  await browser.close();
}