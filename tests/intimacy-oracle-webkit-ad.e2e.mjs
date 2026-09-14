import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const BASE_URL=process.env.LUNEA_E2E_URL||'http://127.0.0.1:4173/index.html';
const browser=await webkit.launch({headless:true});
const results=[];

function record(name,fn){
  return (async()=>{
    try{await fn();results.push({name,ok:true});console.log(`${name}: PASS`)}
    catch(err){results.push({name,ok:false,error:String(err?.stack||err)});console.error(`${name}: FAIL\n${err?.stack||err}`)}
  })();
}

async function makePage({mode='1',instrument=true}={}){
  const context=await browser.newContext({
    viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3,locale:'ko-KR',
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('dialog',async d=>d.accept());
  await page.route(/https:\/\/fonts\.googleapis\.com\//,r=>r.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
  await page.route(/https:\/\/(?:fonts\.gstatic\.com|commons\.wikimedia\.org)\//,r=>r.fulfill({status:204,body:''}));
  await page.route(/lunea-astro-api[^/]*\.onrender\.com\/health/i,r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true})}));
  if(instrument){
    await page.route(/lunea-intimacy-oracle-ui-v36\.js\?/,async route=>{
      const response=await route.fetch();
      let body=await response.text();
      body=body.replace('function secureRandomInt(max){','function secureRandomInt(max){W.__LUNEA_WEBKIT_RNG_CALLS__=(W.__LUNEA_WEBKIT_RNG_CALLS__||0)+1;');
      body=body.replace('function restoreSerializedOracle(snapshot){','function restoreSerializedOracle(snapshot){W.__LUNEA_WEBKIT_RESTORE_CALLS__=(W.__LUNEA_WEBKIT_RESTORE_CALLS__||0)+1;');
      await route.fulfill({response,body,contentType:'application/javascript; charset=utf-8'});
    });
  }
  await page.addInitScript(({mode})=>{
    try{
      localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1','1');
      if(!localStorage.getItem('LUNEA_INTIMACY_ORACLE_MODE_V1'))localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1',mode);
    }catch{}
  },{mode});
  return {context,page};
}

async function openIntimacyAndDraw(page,question){
  const portal=page.locator('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
  await portal.waitFor({state:'visible'}); await portal.click();
  const item=page.locator('.reading-item[data-title="신체적 속궁합 · CORE 5"]');
  await item.waitFor({state:'visible'}); await item.click();
  await page.locator('#question').fill(question);
  await page.locator('#drawBtn').click();
  await page.waitForFunction(()=>document.getElementById('spreadOverlay')?.classList.contains('show')&&Array.isArray(state?.drawn)&&state.drawn.length>0);
}

async function waitOracle(page,{base,extra=0,mode}={}){
  await page.waitForFunction(({base,extra,mode})=>{
    const api=window.LUNEA_INTIMACY_ORACLE_UI_V36;
    if(!api)return false;
    const s=api.getState();
    return (base==null||s.cards.length===base)&&(extra==null||s.extraCards.length===extra)&&(mode==null||s.mode===mode);
  },{base,extra,mode});
}

async function forceSnapshot(page){
  await page.waitForFunction(()=>!!window.LUNEA_READING_DRAFT_V1?.snapshot);
  await page.evaluate(()=>window.LUNEA_READING_DRAFT_V1.snapshot());
  await page.waitForFunction(()=>{try{return !!JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')||'null')}catch{return false}});
}

async function restoreLastReading(page){
  await page.waitForFunction(()=>!!window.LUNEA_READING_DRAFT_V1?.restoreDraft);
  await page.waitForFunction(()=>!!document.getElementById('luneaDraftRestore'));
  await page.evaluate(()=>{window.__LUNEA_WEBKIT_RNG_CALLS__=0;window.__LUNEA_WEBKIT_RESTORE_CALLS__=0;localStorage.removeItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1')});
  await page.locator('#luneaDraftRestore').click();
}

await record('A stale V36.4 boundary -> fresh V36.5',async()=>{
  const {context,page}=await makePage({mode:'1',instrument:false});
  try{
    let releaseRuntime; const gate=new Promise(r=>releaseRuntime=r); let first=true;
    await page.route(/lunea-intimacy-oracle-ui-v36\.js\?/,async route=>{
      if(first){
        first=false; await gate;
        const stale=`(()=>{window.__LUNEA_INTIMACY_ORACLE_UI_V36__=1;window.__OLD_ORACLE_SYNC_CALLS__=0;window.LUNEA_INTIMACY_ORACLE_UI_V36=Object.freeze({version:'36.4',sync(){window.__OLD_ORACLE_SYNC_CALLS__+=1}});})();`;
        await route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:stale}); return;
      }
      await route.continue();
    });
    await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
    await openIntimacyAndDraw(page,'stale V36.4 경계 검증');
    const beforeUrl=page.url();
    await page.route(/lunea-build\.json\?t=/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:'webkit-ad-test'})}));
    releaseRuntime();
    await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.4');
    await page.waitForTimeout(700);
    assert.equal(page.url(),beforeUrl,'must not refresh while spread is open');
    const stale=await page.evaluate(()=>({sync:window.__OLD_ORACLE_SYNC_CALLS__,marker:window.__LUNEA_INTIMACY_ORACLE_STALE__||''}));
    assert.equal(stale.sync,0,'stale V36.4 sync must never run');
    assert.match(stale.marker,/36\.4/);
    await Promise.all([
      page.waitForURL(/lunea_v=webkit-ad-test/,{timeout:15000}),
      page.evaluate(()=>{document.getElementById('spreadOverlay')?.classList.remove('show');document.body.classList.remove('modal-open')})
    ]);
    const afterFresh=await page.evaluate(()=>{
      let draft=null;try{draft=JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')||'null')}catch{}
      return {url:location.href,bodyClass:document.body.className,category:window.state?.category||null,question:window.state?.question||'',draftCategory:draft?.category||null,draftQuestion:draft?.question||'',bridgeActive:window.LUNEA_INTIMACY_AI_BRIDGE_V34?.isActiveContext?.()??null,oracleVersion:window.LUNEA_INTIMACY_ORACLE_UI_V36?.version||null,oracleScripts:[...document.scripts].filter(s=>/lunea-intimacy-oracle-ui-v36\.js/.test(s.src||'')).length};
    });
    console.log('A DIAG AFTER FRESH '+JSON.stringify(afterFresh));
    await openIntimacyAndDraw(page,'fresh V36.5 버튼 검증');
    await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.5',{timeout:15000});
    await page.waitForFunction(()=>!!document.getElementById('luneaOracleAddExtra'));
    const fresh=await page.evaluate(()=>{
      const b=document.getElementById('luneaOracleAddExtra'),r=b?.getBoundingClientRect();
      return {label:b?.textContent||'',rect:r?{w:r.width,h:r.height}:null,scripts:[...document.scripts].filter(s=>/lunea-intimacy-oracle-ui-v36\.js/.test(s.src||'')).length,cardsFlag:document.getElementById('cards')?.__lio36Observed||0,overlayFlag:document.getElementById('spreadOverlay')?.__lio36Observed||0};
    });
    console.log('A DIAG AFTER REENTER '+JSON.stringify(fresh));
    assert.match(fresh.label,/오라클 추가 \(0\/3\)/);
    assert.ok((fresh.rect?.w||0)>0&&(fresh.rect?.h||0)>0,JSON.stringify(fresh));
    assert.equal(fresh.scripts,1,'fresh document must have one V36 script');
    assert.equal(fresh.cardsFlag,1); assert.equal(fresh.overlayFlag,1);
  }finally{await context.close()}
});

await browser.close();
console.log('\nWEBKIT A-ONLY SUMMARY');
for(const r of results)console.log(`${r.ok?'PASS':'FAIL'} ${r.name}`);
if(!results[0]?.ok){
  console.error('\nBlocking failure:\n'+(results[0]?.error||'unknown A failure'));
  process.exit(1);
}
console.log('ALL WEBKIT A-ONLY: PASS');
process.exit(0);

await record('B LAST READING exact Oracle 3+2 roundtrip RNG=0',async()=>{
  const {context,page}=await makePage({mode:'3'});
  try{
    await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
    await openIntimacyAndDraw(page,'LAST READING 3+2 exact roundtrip');
    await waitOracle(page,{base:3,extra:0,mode:3});
    await page.locator('#luneaOracleAddExtra').click(); await page.locator('#luneaOracleAddExtra').click();
    await waitOracle(page,{base:3,extra:2,mode:3});
    await page.locator('.lio-base-row .lio-card').first().click();
    await page.locator('.lio-extra-row .lio-card').first().click();
    await forceSnapshot(page);
    const expected=await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1'));return{tarot:d.drawn.map(x=>x.code),oracle:d.intimacyOracle}});
    assert.equal(expected.oracle.mode,3); assert.equal(expected.oracle.cards.length,3); assert.equal(expected.oracle.extraCards.length,2);
    await page.evaluate(()=>localStorage.removeItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1'));
    await page.reload({waitUntil:'domcontentloaded'});
    await restoreLastReading(page);
    await waitOracle(page,{base:3,extra:2,mode:3});
    const got=await page.evaluate(()=>{const s=window.LUNEA_INTIMACY_ORACLE_UI_V36.getState();return{tarot:state.drawn.map(x=>x.code),base:s.cards.map(x=>x.code),extra:s.extraCards.map(x=>x.code),revealed:[...s.revealed],extraRevealed:[...s.extraRevealed],mode:s.mode,rng:window.__LUNEA_WEBKIT_RNG_CALLS__||0,restores:window.__LUNEA_WEBKIT_RESTORE_CALLS__||0}});
    assert.deepEqual(got.tarot,expected.tarot);
    assert.deepEqual(got.base,expected.oracle.cards.map(x=>x.code)); assert.deepEqual(got.extra,expected.oracle.extraCards.map(x=>x.code));
    assert.deepEqual(got.revealed,expected.oracle.revealed); assert.deepEqual(got.extraRevealed,expected.oracle.extraRevealed);
    assert.equal(got.mode,3); assert.equal(got.rng,0,'restore interval must not draw RNG'); assert.equal(got.restores,1,'exact hydrate must apply once');
  }finally{await context.close()}
});

await record('C mode=0 beats preference=3 with RNG=0',async()=>{
  const {context,page}=await makePage({mode:'0'});
  try{
    await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
    await openIntimacyAndDraw(page,'mode zero exact restore');
    await waitOracle(page,{base:0,extra:0,mode:0});
    await forceSnapshot(page);
    const draftMode=await page.evaluate(()=>JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')).intimacyOracle?.mode);
    assert.equal(draftMode,0);
    await page.evaluate(()=>{localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1','3');localStorage.removeItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1')});
    await page.reload({waitUntil:'domcontentloaded'});
    await restoreLastReading(page);
    await waitOracle(page,{base:0,extra:0,mode:0});
    const got=await page.evaluate(()=>{const s=window.LUNEA_INTIMACY_ORACLE_UI_V36.getState();return{mode:s.mode,base:s.cards.length,extra:s.extraCards.length,pref:localStorage.getItem('LUNEA_INTIMACY_ORACLE_MODE_V1'),rng:window.__LUNEA_WEBKIT_RNG_CALLS__||0,restores:window.__LUNEA_WEBKIT_RESTORE_CALLS__||0}});
    assert.deepEqual(got,{mode:0,base:0,extra:0,pref:'3',rng:0,restores:1});
  }finally{await context.close()}
});

await record('D delayed Oracle runtime pending hydrate exactly once',async()=>{
  const {context,page}=await makePage({mode:'3'});
  try{
    let block=false,release; let gate=Promise.resolve();
    await page.unroute(/lunea-intimacy-oracle-ui-v36\.js\?/);
    await page.route(/lunea-intimacy-oracle-ui-v36\.js\?/,async route=>{
      if(block)await gate;
      const response=await route.fetch();let body=await response.text();
      body=body.replace('function secureRandomInt(max){','function secureRandomInt(max){W.__LUNEA_WEBKIT_RNG_CALLS__=(W.__LUNEA_WEBKIT_RNG_CALLS__||0)+1;');
      body=body.replace('function restoreSerializedOracle(snapshot){','function restoreSerializedOracle(snapshot){W.__LUNEA_WEBKIT_RESTORE_CALLS__=(W.__LUNEA_WEBKIT_RESTORE_CALLS__||0)+1;');
      await route.fulfill({response,body,contentType:'application/javascript; charset=utf-8'});
    });
    await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
    await openIntimacyAndDraw(page,'delayed runtime source draft');
    await waitOracle(page,{base:3,extra:0,mode:3});
    await page.locator('#luneaOracleAddExtra').click(); await page.locator('#luneaOracleAddExtra').click();
    await waitOracle(page,{base:3,extra:2,mode:3});
    await forceSnapshot(page);
    const expected=await page.evaluate(()=>JSON.parse(localStorage.getItem('LUNEA_LAST_READING_DRAFT_V1')).intimacyOracle);
    await page.evaluate(()=>localStorage.removeItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1'));
    block=true; gate=new Promise(r=>release=r);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.LUNEA_INTIMACY_AI_BRIDGE_V34);
    assert.equal(await page.evaluate(()=>!!window.LUNEA_INTIMACY_ORACLE_UI_V36),false,'Oracle runtime must still be blocked');
    await page.evaluate(()=>{window.__LUNEA_WEBKIT_RNG_CALLS__=0;window.__LUNEA_WEBKIT_RESTORE_CALLS__=0;localStorage.removeItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1')});
    await page.locator('#luneaDraftRestore').click();
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>!!window.LUNEA_INTIMACY_ORACLE_UI_V36),false);
    block=false; release();
    await page.waitForFunction(()=>window.LUNEA_INTIMACY_ORACLE_UI_V36?.version==='36.5',{timeout:15000});
    await waitOracle(page,{base:3,extra:2,mode:3});
    let got=await page.evaluate(()=>{const s=window.LUNEA_INTIMACY_ORACLE_UI_V36.getState();return{base:s.cards.map(x=>x.code),extra:s.extraCards.map(x=>x.code),rng:window.__LUNEA_WEBKIT_RNG_CALLS__||0,restores:window.__LUNEA_WEBKIT_RESTORE_CALLS__||0}});
    assert.deepEqual(got.base,expected.cards.map(x=>x.code)); assert.deepEqual(got.extra,expected.extraCards.map(x=>x.code));
    assert.equal(got.rng,0); assert.equal(got.restores,1);
    await page.evaluate(()=>{window.LUNEA_INTIMACY_ORACLE_UI_V36.sync();window.LUNEA_INTIMACY_ORACLE_UI_V36.sync()});
    got=await page.evaluate(()=>({rng:window.__LUNEA_WEBKIT_RNG_CALLS__||0,restores:window.__LUNEA_WEBKIT_RESTORE_CALLS__||0}));
    assert.deepEqual(got,{rng:0,restores:1},'later sync must not rehydrate or redraw');
  }finally{await context.close()}
});

await browser.close();
console.log('\nWEBKIT A-D SUMMARY');
for(const r of results)console.log(`${r.ok?'PASS':'FAIL'} ${r.name}`);
const failed=results.filter(r=>!r.ok);
if(failed.length){
  console.error('\nBlocking failures:\n'+failed.map(r=>`--- ${r.name} ---\n${r.error}`).join('\n'));
  process.exitCode=1;
}else{
  console.log('ALL WEBKIT A-D: PASS');
}
