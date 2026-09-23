import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const baseURL = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page = await context.newPage();

try {
  await page.goto(baseURL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(() => !!window.LUNEA_LENORMAND_V1 && !!window.LUNEA_LENORMAND_POLISH_V1,{timeout:20000});
  await page.waitForSelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]',{timeout:20000});
  await page.waitForSelector('#luneaHomePortalV8 .lunea-thai-home-tile',{timeout:20000});

  const deck = await page.evaluate(() => ({
    count:window.LUNEA_LENORMAND_V1.cards.length,
    ids:window.LUNEA_LENORMAND_V1.cards.map(c=>c.id),
    images:window.LUNEA_LENORMAND_V1.cards.map(c=>c.image),
  }));
  assert.equal(deck.count,36);
  assert.equal(new Set(deck.ids).size,36);
  assert.equal(new Set(deck.images).size,36);

  await page.waitForFunction(() => {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    const lenormand = grid?.querySelector('.lunea-v8-tile[data-key="lenormand"]');
    const thai = grid?.querySelector('.lunea-thai-home-tile');
    if (!grid || !lenormand || !thai) return false;
    const children = [...grid.children];
    const li = children.indexOf(lenormand);
    const ti = children.indexOf(thai);
    return li >= 0 && ti === li + 1 && Math.abs(lenormand.getBoundingClientRect().top - thai.getBoundingClientRect().top) < 4;
  },{timeout:10000});

  const home = await page.evaluate(() => {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    const children = [...grid.children];
    const lenormand = grid.querySelector('.lunea-v8-tile[data-key="lenormand"]');
    const thai = grid.querySelector('.lunea-thai-home-tile');
    return {
      lenormandIndex:children.indexOf(lenormand),
      thaiIndex:children.indexOf(thai),
      sameRow:Math.abs(lenormand.getBoundingClientRect().top - thai.getBoundingClientRect().top) < 4,
      iconSrc:lenormand.querySelector('.lunea-v8-object img')?.getAttribute('src') || '',
      thaiTitle:thai.querySelector('.thai-v24-copy b')?.textContent?.trim() || '',
    };
  });
  assert.equal(home.thaiIndex,home.lenormandIndex + 1,'Lenormand and Thai should stay adjacent in the Home grid');
  assert.ok(home.sameRow,'Lenormand and Thai should share the same Home grid row');
  assert.equal(home.iconSrc,'./assets/lenormand/lunea_lenormand_home_icon_v1.svg');
  assert.equal(home.thaiTitle,'THAI ASTROLOGY');

  await page.click('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]');
  await page.waitForSelector('#luneaLenormandOverlay.show');
  await page.waitForSelector('#lnPng',{state:'attached',timeout:5000});
  assert.equal(await page.isVisible('#lnPng'),false,'PNG action should stay hidden until a result exists');

  await page.fill('#lnQuestion','그에게서 세 달 안으로 연락이 올까요?');
  await page.click('#lnDraw');
  await page.waitForFunction(() => document.querySelectorAll('#lnCards .ln-card').length === 5);
  await page.waitForSelector('#lnPng',{state:'visible',timeout:5000});
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards .ln-card img')].every(img => img.complete && img.naturalWidth > 0),{timeout:10000});
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards .ln-card')].every(node => node.classList.contains('ln-reveal-v1')),{timeout:5000});

  const five = await page.evaluate(() => {
    const root = document.querySelector('#lnCards');
    const cards = [...root.querySelectorAll('.ln-card')];
    const rootRect = root.getBoundingClientRect();
    const rects = cards.map(node=>node.getBoundingClientRect());
    return {
      count:cards.length,
      srcs:cards.map(node=>node.querySelector('img')?.getAttribute('src')),
      widths:cards.map(node=>node.querySelector('img')?.naturalWidth || 0),
      layout:getComputedStyle(root).display,
      overflow:getComputedStyle(root).overflowX,
      cols:getComputedStyle(root).gridTemplateColumns.split(' ').length,
      objectFits:cards.map(node=>getComputedStyle(node.querySelector('img')).objectFit),
      allInside:rects.every(rect => rect.left >= rootRect.left - 1 && rect.right <= rootRect.right + 1),
      reveal:cards.every(node=>node.classList.contains('ln-reveal-v1')),
    };
  });
  assert.equal(five.count,5);
  assert.equal(new Set(five.srcs).size,5,'5-card draw must be unique');
  assert.ok(five.widths.every(Boolean),'all card images should load');
  assert.equal(five.layout,'grid','5-card mobile layout should keep all cards in one grid row');
  assert.equal(five.cols,5,'5-card mobile layout should show five columns at once');
  assert.equal(five.overflow,'visible','5-card row should not rely on hidden horizontal scrolling');
  assert.ok(five.objectFits.every(value=>value === 'contain'),'card artwork should never be cropped');
  assert.ok(five.allInside,'all five cards should fit inside the visible card row');
  assert.ok(five.reveal,'drawn cards should receive reveal motion class');

  const prompt = await page.evaluate(() => window.LUNEA_LENORMAND_V1.buildPrompt());
  assert.ok(prompt.includes('그에게서 세 달 안으로 연락이 올까요?'));
  assert.ok(prompt.includes('[인접 조합]'));
  assert.ok(prompt.includes('[미러링]'));
  assert.ok(prompt.includes('카드 뜻을 따로따로 나열하지 말고'));
  assert.ok(prompt.includes('근거 없는 날짜를 창작하지 않는다'));

  const png = await page.evaluate(async () => {
    const files = await window.LUNEA_LENORMAND_POLISH_V1.renderFiles();
    let width = 0;
    let height = 0;
    if (files[0]) {
      const url = URL.createObjectURL(files[0]);
      try {
        const image = new Image();
        await new Promise((resolve,reject) => { image.onload=resolve; image.onerror=reject; image.src=url; });
        width = image.naturalWidth;
        height = image.naturalHeight;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    return {files:files.map(file=>({name:file.name,size:file.size,type:file.type})),width,height};
  });
  assert.ok(png.files.length >= 1);
  assert.ok(png.files.every(file=>file.type === 'image/png' && file.size > 10000));
  assert.ok(png.files[0].name.startsWith('lunea_lenormand_'));
  assert.equal(png.width,1080);
  assert.equal(png.height,1350);

  await page.click('#lnSave');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]')[0]);
  assert.ok(saved?.lenormand);
  assert.equal(saved.lenormand.cards.length,5);
  assert.equal(saved.cards.length,5);

  await page.fill('#lnQuestion','새 질문 테스트');
  await page.waitForFunction(() => window.LUNEA_LENORMAND_V1.snapshot().cards.length === 0);
  assert.equal(await page.isVisible('#lnBoard'),false,'changing question must clear old result board');

  await page.click('#lnSpreads [data-count="3"]');
  await page.click('#lnDraw');
  await page.waitForFunction(() => document.querySelectorAll('#lnCards .ln-card').length === 3);
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards img')].every(img => img.complete && img.naturalWidth > 0),{timeout:10000});
  const three = await page.evaluate(() => {
    const root = document.querySelector('#lnCards');
    const rootRect = root.getBoundingClientRect();
    const cards = [...root.querySelectorAll('.ln-card')];
    return {
      count:window.LUNEA_LENORMAND_V1.snapshot().cards.length,
      cols:getComputedStyle(root).gridTemplateColumns.split(' ').length,
      objectFits:cards.map(node=>getComputedStyle(node.querySelector('img')).objectFit),
      allInside:cards.every(node => {
        const rect=node.getBoundingClientRect();
        return rect.left >= rootRect.left - 1 && rect.right <= rootRect.right + 1;
      }),
    };
  });
  assert.equal(three.count,3);
  assert.equal(three.cols,3);
  assert.ok(three.objectFits.every(value=>value === 'contain'));
  assert.ok(three.allInside,'3-card line should fit fully inside the visible row');

  await page.click('#lnSpreads [data-count="9"]');
  await page.fill('#lnQuestion','9장 박스 테스트');
  await page.click('#lnDraw');
  await page.waitForFunction(() => document.querySelectorAll('#lnCards .ln-card').length === 9);
  await page.waitForFunction(() => [...document.querySelectorAll('#lnCards img')].every(img => img.complete && img.naturalWidth > 0),{timeout:10000});
  const nine = await page.evaluate(() => {
    const snap=window.LUNEA_LENORMAND_V1.snapshot();
    const root=document.querySelector('#lnCards');
    const rootRect=root.getBoundingClientRect();
    const cards=[...root.querySelectorAll('.ln-card')];
    return {
      count:snap.cards.length,
      center:snap.structure?.center?.id,
      rows:snap.structure?.rows?.length,
      columns:snap.structure?.columns?.length,
      diagonals:snap.structure?.diagonals?.length,
      cols:getComputedStyle(root).gridTemplateColumns.split(' ').length,
      objectFits:cards.map(node=>getComputedStyle(node.querySelector('img')).objectFit),
      allInside:cards.every(node => {
        const rect=node.getBoundingClientRect();
        return rect.left >= rootRect.left - 1 && rect.right <= rootRect.right + 1;
      }),
    };
  });
  assert.equal(nine.count,9);
  assert.ok(nine.center);
  assert.equal(nine.rows,3);
  assert.equal(nine.columns,3);
  assert.equal(nine.diagonals,2);
  assert.equal(nine.cols,3);
  assert.ok(nine.objectFits.every(value=>value === 'contain'));
  assert.ok(nine.allInside,'9-card box should fit inside its 3-column board');

  await page.click('#lnSave');
  const archiveItem = await page.evaluate(() => JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]')[0]);
  await page.evaluate(item => window.LUNEA_LENORMAND_POLISH_V1.openArchiveItem(item),archiveItem);
  await page.waitForSelector('#luneaLenormandArchiveOverlay.show');
  assert.equal(await page.locator('#lnArchiveCards .ln-archive-card').count(),9);
  assert.ok(await page.isVisible('#lnArchivePng'));
  const archiveFits = await page.evaluate(() => [...document.querySelectorAll('#lnArchiveCards .ln-archive-card img')].map(img=>getComputedStyle(img).objectFit));
  assert.ok(archiveFits.every(value=>value === 'contain'),'archive card artwork should not be cropped');

  await page.click('#lnArchiveClose');
  await page.click('#lnClose');
  await page.click('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]');
  await page.waitForSelector('#luneaLenormandOverlay.show');
  assert.equal(await page.inputValue('#lnQuestion'),'','home entry should open as a fresh question');
  assert.equal(await page.evaluate(() => window.LUNEA_LENORMAND_V1.snapshot().cards.length),0);

  console.log('Lenormand V1 mobile WebKit E2E passed');
} finally {
  await browser.close();
}
