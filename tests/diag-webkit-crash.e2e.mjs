// Diagnostic only (not a regression test): finds the step at which WebKit's
// renderer crashes in the INTIMACY → reveal → close → DAILY → pageshow flow and
// in the GENERAL → LOVE → CAREER sector flow, and samples page activity until then.
import {webkit, chromium} from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = process.env.LUNEA_E2E_BROWSER === 'chromium'
  ? await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox']})
  : await webkit.launch({headless:true});

async function setup(tag) {
  const context = await browser.newContext({viewport:{width:393,height:852}, isMobile:true, hasTouch:true, locale:'ko-KR', serviceWorkers:'block'});
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  let crashed = false;
  page.on('crash', () => { crashed = true; console.log(`[${tag}] *** RENDERER CRASH ***`); });
  page.on('console', msg => { const t = msg.text(); if (t.startsWith('DIAG ') || msg.type() === 'error') console.log(`[${tag}] ${t.slice(0, 300)}`); });
  page.on('pageerror', e => console.log(`[${tag}] PAGEERROR ${e.message.slice(0, 200)}`));
  page.on('dialog', d => d.accept());
  const blocked = new Set((process.env.LUNEA_DIAG_BLOCK || '').split(',').filter(Boolean));
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    const file = u.pathname.split('/').pop();
    if (blocked.has(file)) return route.fulfill({status:200, contentType:'application/javascript', body:'/* blocked for crash bisect */'});
    if (u.origin === new URL(url).origin) return route.continue();
    return route.fulfill({status:200, contentType:u.pathname.endsWith('.css') ? 'text/css' : 'application/json', body:u.hostname.includes('fonts') ? '' : '{}'});
  });
  if (process.env.LUNEA_DIAG_NO_CV === '1') await page.addInitScript(() => {
    const add = () => { const st = document.createElement('style'); st.textContent = '*,*::before,*::after{content-visibility:visible!important}'; (document.head || document.documentElement).appendChild(st); };
    if (document.documentElement) add(); else document.addEventListener('readystatechange', add, {once:true});
  });
  await page.addInitScript(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('LUNEA_INTIMACY_ADULT_ACK_V1', '1');
    localStorage.setItem('LUNEA_INTIMACY_ORACLE_MODE_V1', '1');
    const c = {timeout:0, interval:0, raf:0, append:0, mo:0, decode:0};
    const wrap = (obj, name, key) => { const o = obj[name]; obj[name] = function (...a) { c[key]++; return o.apply(this, a); }; };
    wrap(window, 'setTimeout', 'timeout'); wrap(window, 'setInterval', 'interval'); wrap(window, 'requestAnimationFrame', 'raf');
    wrap(Node.prototype, 'appendChild', 'append'); wrap(Node.prototype, 'insertBefore', 'append');
    const MO = window.MutationObserver;
    window.MutationObserver = class extends MO { constructor(cb) { super((r, o) => { c.mo++; return cb(r, o); }); } };
    let last = performance.now();
    const tick = () => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      const ls = (() => { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } return n; })();
      const imgs = document.images.length;
      const big = [...document.images].filter(i => i.naturalWidth * i.naturalHeight > 1e6).length;
      console.log('DIAG ' + JSON.stringify({t:Math.round(now), els:document.getElementsByTagName('*').length, imgs, bigImgs:big, sheets:document.styleSheets.length, ls, per_s:Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v / dt)]))}));
      for (const k in c) c[k] = 0;
    };
    const iv = window.setInterval.bind(window);
    window.addEventListener('DOMContentLoaded', () => iv(tick, 500));
  });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.LUNEA_INTIMACY_ORACLE_UI_V36?.version && window.LUNEA_INTIMACY_REPAIR_V43, null, {timeout:30000});
  return {context, page, isCrashed:() => crashed};
}

async function draw(page, category, question) {
  await page.evaluate(cat => {
    const item = cat === 'INTIMACY'
      ? document.querySelector('.reading-item[data-title="신체적 속궁합 · CORE 5"]')
      : [...document.querySelectorAll(`.reading-item[data-cat="${cat}"]`)].find(n => Number(n.dataset.count) > 0 && !n.dataset.luneaManual);
    if (!item) throw new Error('Reading entry missing: ' + cat);
    item.click();
  }, category);
  await page.locator('#question').fill(question);
  await page.locator('#drawBtn').dispatchEvent('click');
  await page.waitForFunction(() => document.getElementById('spreadOverlay')?.classList.contains('show') && state.drawn?.length > 0);
}

async function step(tag, name, fn) {
  console.log(`[${tag}] STEP ${name}`);
  try { await fn(); console.log(`[${tag}] DONE ${name}`); }
  catch (e) { console.log(`[${tag}] STEP FAILED ${name}: ${e.message.split('\n')[0]}`); throw e; }
}

for (const [tag, flow] of [
  ['intimacy-daily', async page => {
    await step('intimacy-daily', 'draw INTIMACY', () => draw(page, 'INTIMACY', '그와의 신체적 속궁합은 어떨까?'));
    await step('intimacy-daily', 'oracle cards ready', () => page.waitForFunction(() => window.LUNEA_INTIMACY_ORACLE_UI_V36.getState().cards.length > 0));
    await page.waitForTimeout(1500);
    await step('intimacy-daily', 'reveal all', () => page.evaluate(() => document.getElementById('luneaOracleRevealAll')?.click()));
    await page.waitForTimeout(1500);
    await step('intimacy-daily', 'close spread', () => page.evaluate(() => document.querySelector('[data-close="spread"]').click()));
    await page.waitForTimeout(1500);
    await step('intimacy-daily', 'daily button', () => page.evaluate(() => document.getElementById('dailyBtn').click()));
    await page.waitForTimeout(3000);
    await step('intimacy-daily', 'pageshow', () => page.evaluate(() => window.dispatchEvent(new Event('pageshow'))));
    await page.waitForTimeout(4000);
  }],
  ['sectors', async page => {
    for (const cat of ['GENERAL', 'LOVE', 'CAREER', 'STOCK']) {
      await step('sectors', `draw ${cat}`, () => draw(page, cat, `${cat} 질문`));
      await page.waitForTimeout(2000);
      await step('sectors', `close ${cat}`, () => page.evaluate(() => document.querySelector('[data-close="spread"]')?.click()));
      await page.waitForTimeout(1500);
    }
  }],
].filter(([tag]) => !process.env.LUNEA_DIAG_FLOW || process.env.LUNEA_DIAG_FLOW === tag)) {
  const {context, page, isCrashed} = await setup(tag);
  try { await flow(page); console.log(`[${tag}] FLOW COMPLETED`); }
  catch (e) { console.log(`[${tag}] FLOW STOPPED crashed=${isCrashed()} ${e.message.split('\n')[0]}`); }
  finally { await context.close().catch(() => {}); }
}
await browser.close();
