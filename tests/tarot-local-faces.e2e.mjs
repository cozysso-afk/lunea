import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+ZKCZAAAAAElFTkSuQmCC','base64');

async function verify(label, options = {}) {
  const {failRemote = false, ...device} = options;
  const ctx = await browser.newContext({...device, reducedMotion:'reduce', serviceWorkers:'block', locale:'ko-KR'});
  let externalRequests=0, localRequests=0;
  ctx.on('request', request => {
    const u=request.url();
    if(u.includes('commons.wikimedia.org/wiki/Special:FilePath/')) externalRequests++;
    if(u.includes('/assets/rws/')) localRequests++;
  });
  await ctx.route(/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//, route =>
    failRemote
      ? route.fulfill({status:429,contentType:'text/plain',body:'rate limited'})
      : route.fulfill({status:200,contentType:'image/png',body:TINY_PNG})
  );
  // This test checks faces; prevent heavy decorative backs and Google Fonts
  // from exhausting headless WebKit's compositor during repeated scenarios.
  await ctx.route(/\/tarot_back_[^/?]+\.jpe?g(?:\?|$)/i, route =>
    route.fulfill({status:200,contentType:'image/png',body:TINY_PNG}));
  await ctx.route(/https:\/\/fonts\.googleapis\.com\//, route =>
    route.fulfill({status:200,contentType:'text/css',body:''}));
  const page = await ctx.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(() => typeof startSpread==='function'
      && TAROT_DECK?.length===78 && document.documentElement.classList.contains('lunea-ui-ready'),
      null,{timeout:15000});
    await page.evaluate(()=>{
      state.category='LOVE';
      state.allowReversed=false;
      startSpread('카드 이미지 확인',['1','2','3','4','5','6','7'],'RWS IMAGE TEST');
    });
    await page.waitForFunction(()=>{
      const faces=[...document.querySelectorAll('#cards .front > img')];
      return faces.length===7 && faces.every(img=>img.complete&&img.naturalWidth>0);
    },null,{timeout:25000});
    const rows=await page.locator('#cards .front > img').evaluateAll(imgs=>imgs.map(img=>({
      src:img.getAttribute('src'),usedLocal:img.dataset.luneaTriedLocal==='1'
    })));
    if(failRemote){
      assert.ok(rows.every(r=>r.usedLocal&&/^assets\/rws\/[^/]+\.jpg$/.test(r.src)),
        label+': remote 429 must fall back to local art');
      assert.ok(localRequests>=7,label+': local assets not fetched after simulated failure');
    }else{
      assert.ok(rows.every(r=>!r.usedLocal&&r.src.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/')),
        label+': remote primary unexpectedly replaced');
      assert.equal(localRequests,0,label+': local artwork fetched despite successful remote loads');
    }
    assert.ok(externalRequests>=7,label+': Wikimedia primary was bypassed');
    assert.equal(await page.locator('#cards .back > img').count(),7);

    await page.waitForFunction(()=>document.querySelector('#spreadOverlay')?.classList.contains('show'));
    await page.locator('#flipAll').click({timeout:15000});
    await page.waitForFunction(()=>document.querySelectorAll('#cards .tarot-card.flipped').length===7,
      null,{timeout:15000});
    const revealed=await page.locator('#cards .tarot-card.flipped .front > img').evaluateAll(imgs=>imgs.filter(img=>img.naturalWidth>0).length);
    assert.equal(revealed,7,label+': not all seven faces remain decoded after flip');

    // Simulate both image origins failing: show readable card title, never blank.
    const image=page.locator('#cards .front > img').first();
    await image.evaluate(img=>{img.dataset.luneaTriedLocal='1';img.src='./assets/rws/__missing__.jpg'});
    await page.waitForFunction(()=>document.querySelector('#cards .front')?.classList.contains('lunea-card-art-missing'));
    assert.ok(((await page.locator('#cards .front .lunea-card-art-fallback').first().textContent())||'').trim().length>2);
    assert.ok(!errors.some(s=>/tarot|card|flip/i.test(s)),label+': console errors: '+errors.join('; '));
    console.log(label+': PASS (remote-first='+(!failRemote)+', error fallback, 7-card flip, text backup)');
  }finally{
    await ctx.close();
  }
}

try{
  const iphone={
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
    viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true
  };
  await verify('desktop-remote');
  await verify('iphone-remote',iphone);
  await verify('iphone-rate-limited',{...iphone,failRemote:true});
}finally{
  await browser.close();
}
