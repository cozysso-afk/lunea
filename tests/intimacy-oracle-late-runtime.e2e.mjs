import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL=process.env.LUNEA_E2E_URL||'http://127.0.0.1:4173/index.html';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3,locale:'ko-KR',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
});
const page=await context.newPage();
page.setDefaultTimeout(20000);
const pageErrors=[];
const consoleErrors=[];
const dialogs=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
page.on('dialog',async d=>{dialogs.push(`${d.type()}: ${d.message()}`);await d.accept()});

await page.addInitScript(()=>{
  const nativeAppendChild=Node.prototype.appendChild;
  const held=[];
  let released=false;
  Node.prototype.appendChild=function(node){
    const src=String(node?.src||'');
    if(!released&&node?.tagName==='SCRIPT'&&/lunea-intimacy-oracle-ui-v36\.js(?:\?|$)/.test(src)){
      held.push({parent:this,node});
      return node;
    }
    return nativeAppendChild.call(this,node);
  };
  window.__LUNEA_E2E_HELD_ORACLE_RUNTIME__={
    count:()=>held.length,
    release:()=>{
      if(released)return held.length;
      released=true;
      Node.prototype.appendChild=nativeAppendChild;
      held.splice(0).forEach(({parent,node})=>nativeAppendChild.call(parent,node));
      return 1;
    }
  };
});

await page.route(/https:\/\/fonts\.googleapis\.com\//,route=>route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//,route=>route.fulfill({status:204,body:''}));
await page.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i,route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}));
await page.addInitScript(()=>{
  try{localStorage.clear();localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1','1');localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1','1')}catch{}
  try{sessionStorage.clear()}catch{}
});

try{
  await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
  const intimacyTile=page.locator('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
  await intimacyTile.waitFor({state:'visible'});
  await intimacyTile.click();
  const sourceHeader=page.locator('.lunea-intimacy-category.lunea-v8-source-active > .category-header');
  const sourceContent=page.locator('.lunea-intimacy-category.lunea-v8-source-active > .category-content');
  await sourceHeader.waitFor({state:'visible'});
  await sourceContent.waitFor({state:'visible'});
  assert.equal(await intimacyTile.isVisible(),true,'Home INTIMACY portal tile must remain visible when opened');
  assert.equal(await sourceHeader.isVisible(),true,'INTIMACY source header must remain visible under the Home tile');
  const sourceIcon=sourceHeader.locator('.cat-icon');
  assert.equal((await sourceIcon.textContent())?.trim(),'♡','opened INTIMACY source header must use the approved small heart');

  const item=page.locator('.reading-item[data-title="신체적 속궁합 · CORE 5"]');
  await item.waitFor({state:'visible'});
  await item.click();
  await page.locator('#question').fill('E2E late Oracle exact restore source reading');
  await page.locator('#drawBtn').click();
  await page.waitForFunction(()=>document.getElementById('spreadOverlay')?.classList.contains('show')&&Array.isArray(state?.drawn)&&state.drawn.length>0);

  const draftSeed=await page.evaluate(()=>{
    const copy=v=>JSON.parse(JSON.stringify(v));
    return {
      version:2,savedAt:Date.now(),category:'INTIMACY',title:String(state.title||''),desc:String(state.desc||''),
      count:Number(state.count||state.positions?.length||state.drawn?.length||1),isAi:!!state.isAi,allowReversed:!!state.allowReversed,
      positions:copy(state.positions||[]),rationale:String(state.rationale||''),question:'E2E · 늦은 Oracle runtime에서도 O01 exact draft를 보존한다',
      drawn:copy(state.drawn||[]),flipped:[],aiText:'',manualReading:!!state.__luneaManualReading,manualMode:!!state.__luneaManualMode,
      manualPositions:copy(state.__luneaManualPositions||null),
      intimacyOracle:{version:2,runtimeVersion:'36.5',mode:1,cards:[{code:'O01',lens:'전체 리딩 렌즈'}],extraCards:[],revealed:[0],extraRevealed:[],stamp:''}
    };
  });

  const heldBefore=await page.evaluate(()=>window.__LUNEA_E2E_HELD_ORACLE_RUNTIME__?.count?.()||0);
  assert.ok(heldBefore>=1,'test harness must hold the canonical Oracle UI script before restore');
  assert.equal(await page.evaluate(()=>!!window.LUNEA_INTIMACY_ORACLE_UI_V36),false,'test must hold Oracle runtime before restore');
  await page.evaluate(()=>document.querySelector('[data-close="spread"]')?.click());
  await page.waitForFunction(()=>!document.getElementById('spreadOverlay')?.classList.contains('show'));
  await page.waitForFunction(()=>!!document.getElementById('luneaDraftRestore')&&!!window.LUNEA_READING_DRAFT_V1?.restoreDraft);

  await page.evaluate(seed=>{
    localStorage.setItem('LUNEA_LAST_READING_DRAFT_V1',JSON.stringify(seed));
    state.category='GENERAL';state.question='E2E stale state before restore';
    document.getElementById('luneaDraftRestore').click();
  },draftSeed);
  await page.waitForTimeout(500);

  const pre=await page.evaluate(()=>{
    const d=JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')||'null');
    return {
      overlay:document.getElementById('spreadOverlay')?.classList.contains('show')||false,
      session:Number(document.documentElement.dataset.luneaReadingSession||0),
      reason:document.documentElement.dataset.luneaReadingReason||'',
      category:String(state?.category||''),question:String(state?.question||''),drawn:Array.isArray(state?.drawn)?state.drawn.length:-1,
      savedOracle:d?.intimacyOracle||null,guard:window.__LUNEA_DRAFT_RESTORING_INTIMACY_ORACLE__===true,
      oracleReady:!!window.LUNEA_INTIMACY_ORACLE_UI_V36,
      heldOracleRuntime:window.__LUNEA_E2E_HELD_ORACLE_RUNTIME__?.count?.()||0
    };
  });
  console.log('PRE_RELEASE',JSON.stringify(pre,null,2));
  assert.equal(pre.overlay,true,'real restore-button path must reopen spread');
  assert.equal(pre.reason,'luneaDraftRestore','V59 must establish a fresh restore session');
  assert.equal(pre.question,draftSeed.question);
  assert.equal(pre.oracleReady,false);
  assert.ok(pre.heldOracleRuntime>=1,'Oracle UI node must remain held before release');
  assert.equal(pre.guard,true,'exact restore guard must remain active while runtime is late');
  assert.equal(pre.savedOracle?.cards?.[0]?.code,'O01','old 120ms save window must preserve O01 while runtime is late');

  await page.evaluate(()=>window.__LUNEA_E2E_HELD_ORACLE_RUNTIME__?.release?.());
  await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.5',{timeout:15000});
  await page.waitForFunction(()=>window.__LUNEA_DRAFT_RESTORING_INTIMACY_ORACLE__!==true,{timeout:15000});
  await page.waitForTimeout(180);

  const post=await page.evaluate(()=>{
    const ui=window.LUNEA_INTIMACY_ORACLE_UI_V36;
    const d=JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')||'null');
    return {
      marker:window.__LUNEA_INTIMACY_ORACLE_UI_V36__,
      version:ui?.version||'',
      methods:{sync:typeof ui?.sync,serialize:typeof ui?.serializeOracleDraft,restore:typeof ui?.restoreSerializedOracle},
      stale:window.__LUNEA_INTIMACY_ORACLE_STALE__||'',
      scripts:[...document.scripts].map(s=>s.src).filter(src=>/intimacy-oracle-ui-v36/.test(src)),
      oracleCodes:ui?.getState?.().cards?.map(c=>c.code)||[],
      extraCodes:ui?.getState?.().extraCards?.map(c=>c.code)||[],
      revealed:ui?.getState?[...ui.getState().revealed]:[],
      savedOracle:d?.intimacyOracle||null,
      guard:window.__LUNEA_DRAFT_RESTORING_INTIMACY_ORACLE__===true,
      panelHidden:document.getElementById('luneaIntimacyOraclePanel')?.hidden,
      addButton:document.getElementById('luneaOracleAddExtra')?.textContent||''
    };
  });
  console.log('POST_RELEASE',JSON.stringify({post,pageErrors,consoleErrors,dialogs},null,2));

  assert.deepEqual(pageErrors,[],`page errors after Oracle release:\n${pageErrors.join('\n')}`);
  assert.equal(post.version,'36.5',`Oracle UI failed to boot: ${JSON.stringify(post)}`);
  assert.equal(post.methods.serialize,'function');
  assert.equal(post.methods.restore,'function');
  assert.deepEqual(post.oracleCodes,['O01'],'late runtime must restore exact O01 rather than redraw');
  assert.deepEqual(post.revealed,[0]);
  assert.equal(post.savedOracle?.cards?.[0]?.code,'O01','post-runtime draft must retain exact O01');
  assert.equal(post.guard,false,'restore guard must be released after exact restore');
  assert.equal(post.panelHidden,false);
  assert.match(post.addButton,/오라클 추가 \(0\/3\)/);

  await page.evaluate(()=>document.getElementById('luneaOracleAddExtra')?.click());
  const extraCount=await page.evaluate(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.getState?.().extraCards?.length||0);
  assert.equal(extraCount,1,'supplemental Oracle must still work after late exact restore');
  console.log('INTIMACY late Oracle runtime exact-draft regression: PASS');
}finally{
  try{await page.evaluate(()=>window.__LUNEA_E2E_HELD_ORACLE_RUNTIME__?.release?.())}catch{}
  await browser.close();
}
