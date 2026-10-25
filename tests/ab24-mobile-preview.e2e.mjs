import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const base=process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const useChromium=process.env.LUNEA_E2E_BROWSER==='chromium';
const browser=useChromium
  ? await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
  : await webkit.launch({headless:true});

const question='A와 B 두 사람 중 누가 언제 나에게 먼저 연락할까요?';
async function scenario(designerFails) {
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const unexpected=[];
  page.on('dialog',async dialog=>{
    if(dialog.message().includes('24장 배열을 만드는 중 오류')) unexpected.push(dialog.message());
    await dialog.accept();
  });
  await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===new URL(base).origin)return route.continue();
    return route.fulfill({status:200,contentType:u.pathname.endsWith('.css')?'text/css':'application/json',body:'{}'});
  });
  try {
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.LUNEA_READING_POLISH_V14 !== undefined || document.documentElement.classList.contains('lunea-reading-polish-v14'));
    await page.waitForFunction(()=>typeof window.designSpread==='function' &&
      !!document.getElementById('luneaSpreadPreviewOverlay') &&
      !!document.getElementById('drawBtn')?.__luneaAB24Capture &&
      !!document.querySelector('.reading-item[data-cat="LOVE"][data-lunea-universal-ai="1"]'));
    await page.evaluate(()=>{
      document.querySelector('.reading-item[data-cat="LOVE"][data-lunea-universal-ai="1"]').click();
    });
    await page.waitForFunction(()=>state.isAi && document.getElementById('sheet')?.classList.contains('open'));
    await page.locator('#question').fill(question);
    await page.evaluate(({fails})=>{
      const old22={spreadTitle:'A/B 완전 대칭 비교 · 11축 × 2',layoutType:'dual-compare',
        positions:[
          ...Array.from({length:11},(_,i)=>(i+1)+'. A · 축 '+(i+1)+' · 비교축 '+(i+1)),
          ...Array.from({length:11},(_,i)=>(i+12)+'. B · 축 '+(i+1)+' · 비교축 '+(i+1))
        ]};
      window.designSpread=async()=>{if(fails)throw new Error('simulated upstream failure');return old22;};
      document.getElementById('drawBtn').click();
    },{fails:designerFails});
    await page.locator('#drawBtn').dispatchEvent('click');
    try {
      await page.waitForFunction(()=>document.getElementById('luneaSpreadPreviewOverlay')?.classList.contains('show'),null,{timeout:15000});
    } catch(error) {
      const detail=await page.evaluate(()=>({
        isAi:state.isAi,
        question:document.getElementById('question')?.value,
        disabled:document.getElementById('drawBtn')?.disabled,
        sheet:document.getElementById('sheet')?.classList.contains('open'),
        legacyPreview:document.getElementById('luneaSpreadPreviewOverlay')?.classList.contains('show'),
        otherPreview:document.getElementById('luneaV20PreviewOverlay')?.classList.contains('show'),
        cards:state.drawn?.length,
        session:window.LUNEA_READING_LIFECYCLE_V59?.currentSessionId?.()
      }));
      throw new Error('A/B preflight did not open: '+JSON.stringify(detail)+'; alerts='+unexpected.join('; ')+'; '+error.message);
    }
    const preview=await page.evaluate(()=>{
      const input=document.getElementById('luneaSpreadPreviewPositions');
      const lines=input.value.split('\n').filter(Boolean);
      return {lines,question:document.getElementById('question').value,hasError:!!document.querySelector('#luneaSpreadPreviewOverlay .error')};
    });
    assert.equal(preview.lines.length,24);
    assert.equal(preview.question,question,'question must be preserved');
    for(let i=0;i<12;i++){
      const a=preview.lines[i].replace(/^\d+\.\s*A · 축 \d+ · /,'');
      const b=preview.lines[i+12].replace(/^\d+\.\s*B · 축 \d+ · /,'');
      assert.equal(a,b,'both targets need identical axes');
    }
    if(!designerFails)assert.ok(preview.lines[10].includes('비교축 11'),'existing source axes must survive');
    await page.locator('#luneaSpreadPreviewConfirm').dispatchEvent('click');
    await page.waitForFunction(()=>state.drawn?.length===24 && document.getElementById('spreadOverlay')?.classList.contains('show'));
    const actual=await page.evaluate(()=>({
      question:state.question,positions:state.positions.length,drawn:state.drawn.length,
      unique:new Set(state.drawn.map(c=>c.code)).size,
      wrappers:document.querySelectorAll('#cards .tarot-card-wrapper').length,
      groupLabels:document.querySelectorAll('#cards .lunea-ab-group-label').length
    }));
    assert.equal(actual.question,question);
    assert.equal(actual.positions,24);
    assert.equal(actual.drawn,24,'24 genuine card draws must be committed');
    assert.equal(actual.unique,24,'a physical card must not be duplicated');
    assert.equal(actual.wrappers,24);
    assert.equal(actual.groupLabels,2,'A and B group labels must appear exactly once');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#cards .lunea-ab-group-label').count(),2,'group-label observer must not continuously mutate');
    assert.deepEqual(unexpected,[]);
  } finally {await context.close();}
}
try {
  await scenario(false);
  await scenario(true);
  console.log('A/B 24-card mobile preview/draw '+(useChromium?'Chromium':'WebKit')+' E2E PASS');
} finally {await browser.close();}
