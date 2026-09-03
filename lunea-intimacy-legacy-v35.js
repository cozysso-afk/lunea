'use strict';

/* LUNEA INTIMACY legacy 9-card restore + cabinet polish V35.1 */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_LEGACY_V35__) return;
  W.__LUNEA_INTIMACY_LEGACY_V35__ = true;

  const RELEASE = '35.1';
  const TITLE = '속궁합 · 19+';
  const DESC = '기존 9장 신체적 속궁합 배열 · 욕구와 리드, 물리적 압박감과 밀착감, 템포, 지속성, 판타지, 만족도와 행위 후 교감까지 세밀하게 봅니다.';
  const ACK_KEY = 'LUNEA_INTIMACY_ADULT_ACK_V1';
  const POSITIONS = Object.freeze([
    '상대의 본능적 욕구 & 리드 성향',
    '나의 신체적 감각 & 수용 상태',
    '상대방의 성기 굵기 & 물리적 압박감',
    '내 성기의 타이트함(밀도) & 나와의 밀착감',
    '속도감 & 완급 조절(템포)',
    '체력 & 지구력(지속성)',
    '숨겨진 성적 판타지 & 페티시',
    '절정 도달 & 신체적 만족도',
    '행위 후의 여운 & 정서적 교감'
  ]);

  const $ = (selector, root = document) => root.querySelector(selector);

  function addStyles() {
    if ($('#luneaIntimacyLegacyV35Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyLegacyV35Style';
    style.textContent = `
      .lunea-intimacy-category{
        --intimacy-rose:#efa4c1;
        --intimacy-wine:#8f3f68;
        --intimacy-plum:#21172b;
        --intimacy-line:rgba(229,163,190,.18);
      }
      .lunea-intimacy-category .category-header{
        position:relative;
        overflow:hidden;
        border-color:rgba(218,154,185,.20)!important;
        background:
          radial-gradient(circle at 12% 35%,rgba(184,114,165,.12),transparent 28%),
          linear-gradient(135deg,rgba(35,25,48,.94),rgba(12,14,27,.94))!important;
      }
      .lunea-intimacy-category.active .category-header{
        border-color:rgba(236,158,190,.34)!important;
        box-shadow:0 12px 34px rgba(57,21,48,.22),inset 0 1px rgba(255,255,255,.025);
      }
      .lunea-intimacy-category .cat-icon{
        border-color:rgba(232,166,196,.32)!important;
        background:
          radial-gradient(circle at 34% 28%,rgba(255,255,255,.22),transparent 21%),
          linear-gradient(145deg,rgba(126,91,151,.42),rgba(43,31,65,.72))!important;
        box-shadow:0 0 0 4px rgba(221,157,189,.035),0 0 28px rgba(174,112,160,.16)!important;
      }
      .lunea-intimacy-category .cat-text h3{letter-spacing:.4px}
      .lunea-intimacy-category .cat-text p{line-height:1.45!important}
      .lunea-intimacy-category .category-content{
        padding:10px 12px 15px!important;
        gap:8px!important;
      }
      .lunea-intimacy-category .reading-item{
        position:relative;
        box-sizing:border-box;
        min-height:78px;
        margin:0!important;
        padding:13px 48px 13px 13px!important;
        border:1px solid rgba(224,167,192,.11)!important;
        border-radius:15px!important;
        background:
          linear-gradient(120deg,rgba(132,75,110,.065),rgba(80,66,113,.035) 55%,rgba(255,255,255,.018))!important;
        transition:transform .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease;
      }
      .lunea-intimacy-category .reading-item + .reading-item{border-top-width:1px!important}
      .lunea-intimacy-category .reading-item:hover,
      .lunea-intimacy-category .reading-item:focus-visible{
        transform:translateY(-1px);
        border-color:rgba(239,164,193,.30)!important;
        background:linear-gradient(120deg,rgba(147,78,119,.105),rgba(87,67,120,.055))!important;
        box-shadow:0 8px 22px rgba(20,10,25,.18);
        outline:none;
      }
      .lunea-intimacy-category .reading-item h4{
        margin:0 0 5px!important;
        color:#f7f1f5!important;
        font-size:14.2px!important;
        line-height:1.28!important;
        letter-spacing:-.1px;
      }
      .lunea-intimacy-category .reading-item p{
        margin:0!important;
        color:rgba(210,201,216,.72)!important;
        font-size:10.4px!important;
        line-height:1.5!important;
        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;
        overflow:hidden;
      }
      .lunea-intimacy-category .reading-item .count{
        position:absolute!important;
        right:12px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        width:32px!important;
        height:32px!important;
        min-width:32px!important;
        display:grid!important;
        place-items:center!important;
        border-radius:999px!important;
        border:1px solid rgba(224,164,192,.22)!important;
        background:rgba(126,80,117,.12)!important;
        color:#eee5ed!important;
        font-size:11px!important;
        font-weight:700!important;
        box-shadow:inset 0 1px rgba(255,255,255,.025);
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:91px;
        border-color:rgba(238,156,191,.30)!important;
        background:
          radial-gradient(circle at 96% 10%,rgba(224,127,177,.13),transparent 34%),
          linear-gradient(120deg,rgba(108,43,81,.22),rgba(47,34,67,.17))!important;
        box-shadow:inset 3px 0 rgba(229,145,181,.58),0 9px 24px rgba(38,10,30,.12);
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{color:#ffdbe9!important}
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 p{color:rgba(231,210,221,.80)!important}
      .lunea-intimacy-legacy-badge{
        display:inline-flex;
        align-items:center;
        gap:4px;
        margin-left:6px;
        padding:2px 6px;
        transform:translateY(-1px);
        border:1px solid rgba(241,149,190,.34);
        border-radius:999px;
        color:#f1a8c7;
        background:rgba(121,50,86,.20);
        font-size:8px;
        font-weight:700;
        letter-spacing:.55px;
        vertical-align:middle;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 .count{
        border-color:rgba(242,154,191,.42)!important;
        color:#ffd7e7!important;
        background:rgba(142,53,98,.24)!important;
      }
      .lunea-intimacy-category .lunea-intimacy-list-label{
        margin:5px 3px 2px;
        color:rgba(229,181,204,.66);
        font-size:8.4px;
        font-weight:700;
        letter-spacing:1.15px;
        text-transform:uppercase;
      }
      @media(max-width:430px){
        .lunea-intimacy-category .category-content{padding:9px 9px 13px!important;gap:7px!important}
        .lunea-intimacy-category .reading-item{min-height:75px;padding:12px 45px 12px 12px!important;border-radius:14px!important}
        .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{min-height:90px}
        .lunea-intimacy-category .reading-item h4{font-size:13.8px!important}
        .lunea-intimacy-category .reading-item p{font-size:10.15px!important;line-height:1.47!important}
        .lunea-intimacy-category .reading-item .count{right:10px!important;width:31px!important;height:31px!important;min-width:31px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function adultAcknowledged() {
    try { return localStorage.getItem(ACK_KEY) === '1'; } catch { return false; }
  }

  function requestAdultAcknowledgement() {
    if (adultAcknowledged()) return true;
    const ok = typeof confirm === 'function'
      ? confirm('INTIMACY 18+는 성인 사용자 전용 친밀감 리딩이야. 성인 간의 합의된 관계와 친밀감 질문에만 사용해줘. 계속할까?')
      : true;
    if (!ok) return false;
    try { localStorage.setItem(ACK_KEY, '1'); } catch {}
    return true;
  }

  function patchFixedPositions() {
    try {
      if (typeof fixedPositions !== 'function' || fixedPositions.__luneaLegacyIntimacyV35) return;
      const base = fixedPositions;
      const wrapped = function(title, count) {
        if (String(title || '') === TITLE) return [...POSITIONS];
        return base(title, count);
      };
      wrapped.__luneaLegacyIntimacyV35 = true;
      fixedPositions = wrapped;
    } catch (err) {
      console.warn('[LUNEA INTIMACY legacy] fixedPositions patch skipped', err);
    }
  }

  function openLegacy() {
    if (!requestAdultAcknowledgement()) return;
    if (typeof openSheet !== 'function') return;
    document.body.classList.add('lunea-intimacy-reading');
    openSheet('LOVE', TITLE, DESC, 9);
    try {
      if (typeof state !== 'undefined' && state) state.category = 'INTIMACY';
    } catch {}
    const sheetCat = document.getElementById('sheetCat');
    if (sheetCat) sheetCat.textContent = 'INTIMACY 18+';
  }

  function buildLegacyItem() {
    const item = document.createElement('div');
    item.className = 'reading-item lunea-intimacy-legacy9';
    item.dataset.cat = 'INTIMACY';
    item.dataset.intimacyId = 'legacy_intimacy_9';
    item.dataset.title = TITLE;
    item.dataset.desc = DESC;
    item.dataset.count = '9';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `${TITLE} 9장 배열`);
    item.innerHTML = `<div><h4>${TITLE}<span class="lunea-intimacy-legacy-badge">ORIGINAL · 9</span></h4><p>욕구·리드 · 굵기/압박감 · 타이트함/밀착감 · 템포 · 지속성 · 판타지 · 만족 · 여운</p></div><div class="count">9</div>`;
    item.addEventListener('click', openLegacy);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLegacy();
      }
    });
    return item;
  }

  function polishExisting(category) {
    const content = $('.category-content', category);
    if (!content) return;
    const fixedFirst = $('.reading-item[data-title="신체적 속궁합 · CORE 5"]', content);
    if (!$('.lunea-intimacy-list-label', content) && fixedFirst) {
      const label = document.createElement('div');
      label.className = 'lunea-intimacy-list-label';
      label.textContent = 'INTIMACY FIXED SPREADS';
      content.insertBefore(label, fixedFirst);
    }
  }

  function install() {
    patchFixedPositions();
    addStyles();
    const category = $('.lunea-intimacy-category');
    if (!category) return false;
    const content = $('.category-content', category);
    if (!content) return false;

    if (!$('.lunea-intimacy-legacy9', content)) {
      const core = $('.reading-item[data-title="신체적 속궁합 · CORE 5"]', content);
      const item = buildLegacyItem();
      if (core) content.insertBefore(item, core);
      else content.appendChild(item);
    }
    polishExisting(category);
    return true;
  }

  if (install()) {
    console.info(`🌹 LUNEA INTIMACY legacy spread V${RELEASE} ready`);
    return;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) {
      clearInterval(timer);
      if (tries <= 160) console.info(`🌹 LUNEA INTIMACY legacy spread V${RELEASE} ready`);
    }
  }, 50);
})();
