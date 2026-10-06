import assert from 'node:assert/strict';
import { webkit } from 'playwright';

const url = process.env.LUNEA_E2E_URL || 'http://127.0.0.1:4173/index.html';
const browser = await webkit.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844}});

try {
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() =>
    !!window.LUNEA_TIMING_ORACLE_V1 &&
    !!window.LUNEA_TIMING_UPLOADED_ART_V16 &&
    !!window.LUNEA_RECOVERY_UI_V65 &&
    !!window.LUNEA_READING_BOUNDARY_V31,
    null,
    {timeout:10000}
  );

  const result = await page.evaluate(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const core = window.LUNEA_TIMING_ORACLE_V1;
    const v65 = window.LUNEA_RECOVERY_UI_V65;

    const primary = core.canonicalTimingAsset({id:'LT-004', filename:'timing_004_tonight.png'});
    const weekday = core.canonicalTimingAsset({id:'LT-061', filename:'timing_061_monday.jpg'});
    const weekdayV65 = v65.artworkForCard({id:'LT-061', filename:'timing_061_monday.jpg'});

    const probe = document.createElement('img');
    probe.id = 'luneaTimingArtworkRaceProbe';
    probe.dataset.luneaTimingArtworkV65 = '1';
    probe.dataset.luneaTimingCardId = 'LT-003';
    probe.src = './timing_004_tonight.png';
    document.body.appendChild(probe);
    await sleep(450);
    const probePath = new URL(probe.src).pathname;
    const probeCardId = probe.dataset.luneaTimingCardId;

    document.getElementById('luneaTimingInline')?.remove();
    const cards = document.getElementById('cards');
    const inline = document.createElement('div');
    inline.id = 'luneaTimingInline';
    inline.className = 'timing-inline';
    inline.dataset.luneaTimingCardId = 'LT-004';
    inline.innerHTML = '<img src="./timing_004_tonight.png" data-lunea-timing-card-id="LT-004"><div class="txt"><b>오늘 밤</b></div>';
    cards?.insertAdjacentElement('afterend', inline);

    const modalImage = document.getElementById('timingImage');
    modalImage?.setAttribute('src', './timing_004_tonight.png');
    if (modalImage) {
      modalImage.dataset.luneaTimingCardId = 'LT-004';
      modalImage.dataset.luneaTimingArtworkV65 = '1';
    }
    const ko = document.getElementById('timingLabelKo');
    const en = document.getElementById('timingLabelEn');
    if (ko) ko.textContent = '오늘 밤';
    if (en) en.textContent = 'Tonight';

    window.__LUNEA_INTIMACY_ACTIVE__ = true;
    document.body.classList.add('lunea-intimacy-reading');

    const love = document.querySelector('.reading-item[data-cat="LOVE"]');
    if (!love) throw new Error('LOVE reading entry missing');
    love.click();
    await sleep(60);

    return {
      primary,
      weekday,
      weekdayV65,
      probePath,
      probeCardId,
      inlineGone: !document.getElementById('luneaTimingInline'),
      modalSrc: modalImage?.getAttribute('src') ?? null,
      modalCardId: modalImage?.dataset?.luneaTimingCardId ?? null,
      ko: ko?.textContent || '',
      en: en?.textContent || '',
      boundary: document.documentElement.dataset.luneaTimingBoundary || '',
      intimacyFlag: !!window.__LUNEA_INTIMACY_ACTIVE__,
      intimacyClass: document.body.classList.contains('lunea-intimacy-reading')
    };
  });

  assert.match(result.primary, /assets\/timing-oracle\/cards\/LT-004\.png$/, 'LT-004 must use the current canonical image');
  assert.match(result.weekday, /assets\/timing-oracle\/cards\/timing_061_monday\.jpg$/, 'weekday card must stay inside canonical Timing assets');
  assert.match(result.weekdayV65, /assets\/timing-oracle\/cards\/timing_061_monday\.jpg/, 'V65 must understand weekday artwork');
  assert.match(result.probePath, /\/assets\/timing-oracle\/cards\/LT-004\.png$/, 'stale V65 marker must not pin the previous/legacy face');
  assert.equal(result.probeCardId, 'LT-004', 'semantic card id must follow the newly assigned source');
  assert.equal(result.inlineGone, true, 'INTIMACY Timing inline must disappear before LOVE reading starts');
  assert.equal(result.modalSrc, null, 'old modal Timing image must be cleared at the reading boundary');
  assert.equal(result.modalCardId, null, 'old modal Timing semantic id must be cleared');
  assert.equal(result.ko, '', 'old Timing Korean label must be cleared');
  assert.equal(result.en, '', 'old Timing English label must be cleared');
  assert.equal(result.boundary, 'reading-item-entry', 'LOVE reading item must establish a fresh Timing boundary');
  assert.equal(result.intimacyFlag, false, 'LOVE entry must clear the INTIMACY active flag');
  assert.equal(result.intimacyClass, false, 'LOVE entry must clear the INTIMACY body class');

  console.log('Timing Oracle INTIMACY -> LOVE artwork/session E2E: PASS');
} finally {
  await browser.close();
}
