'use strict';

/* LUNEA INTIMACY original 9-card restore + sector branding V35.2 */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_LEGACY_V35__) return;
  W.__LUNEA_INTIMACY_LEGACY_V35__ = true;

  const RELEASE = '35.2';
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

  const SECTOR_MARK = `
    <svg class="lunea-intimacy-sector-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="luneaIntimacyRose" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffe0d4"/>
          <stop offset=".42" stop-color="#efb0bd"/>
          <stop offset=".78" stop-color="#d99fc9"/>
          <stop offset="1" stop-color="#b596ef"/>
        </linearGradient>
      </defs>
      <path class="lunea-intimacy-orbit orbit-a" d="M34 12C22 13 14 21 14 32s8 19 20 20c-7-4-11-11-11-20s4-16 11-20Z"/>
      <path class="lunea-intimacy-orbit orbit-b" d="M30 12c12 1 20 9 20 20s-8 19-20 20c7-4 11-11 11-20s-4-16-11-20Z"/>
      <path class="lunea-intimacy-star" d="M32 23.3 34.8 29l5.9 3-5.9 3-2.8 5.7L29.2 35l-5.9-3 5.9-3L32 23.3Z"/>
      <circle class="lunea-intimacy-dot dot-a" cx="32" cy="16" r="1.45"/>
      <circle class="lunea-intimacy-dot dot-b" cx="32" cy="48" r="1.45"/>
    </svg>`;

  const $ = (selector, root = document) => root.querySelector(selector);

  function addStyles() {
    if ($('#luneaIntimacyLegacyV35Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyLegacyV35Style';
    style.textContent = `
      .lunea-intimacy-category{
        --intimacy-rose:#efa4c1;
        --intimacy-rose-soft:#ffd2df;
        --intimacy-gold:#e8ad94;
        --intimacy-wine:#8f3f68;
        --intimacy-plum:#21172b;
        --intimacy-lilac:#a995e6;
        --intimacy-line:rgba(229,163,190,.18);
      }
      .lunea-intimacy-category .category-header{
        position:relative;
        overflow:hidden;
        border-color:rgba(218,154,185,.23)!important;
        background:
          radial-gradient(circle at 11% 38%,rgba(181,119,170,.16),transparent 31%),
          radial-gradient(circle at 76% 0%,rgba(120,74,126,.08),transparent 38%),
          linear-gradient(135deg,rgba(36,25,49,.96),rgba(12,14,27,.96) 64%,rgba(22,13,27,.96))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.025),0 12px 32px rgba(7,7,18,.12);
        isolation:isolate;
      }
      .lunea-intimacy-category .category-header::before{
        content:'';
        position:absolute;
        inset:auto 7% -1px 7%;
        height:1px;
        background:linear-gradient(90deg,transparent,rgba(226,145,183,.18),rgba(218,170,210,.22),transparent);
        opacity:.65;
        pointer-events:none;
      }
      .lunea-intimacy-category .category-header::after{
        content:'';
        position:absolute;
        z-index:-1;
        width:34%;
        height:180%;
        top:-42%;
        left:-46%;
        transform:rotate(18deg);
        background:linear-gradient(90deg,transparent,rgba(255,210,224,.13),rgba(189,145,225,.12),transparent);
        filter:blur(2px);
        opacity:0;
        pointer-events:none;
      }
      .lunea-intimacy-category.active .category-header{
        border-color:rgba(236,158,190,.42)!important;
        box-shadow:0 15px 38px rgba(60,18,49,.22),0 0 0 1px rgba(142,106,183,.06),inset 0 1px rgba(255,255,255,.03);
      }
      .lunea-intimacy-category.active .category-header::after{animation:luneaIntimacySweep .82s cubic-bezier(.2,.7,.2,1) 1 both}
      .lunea-intimacy-category .cat-icon{
        position:relative!important;
        display:grid!important;
        place-items:center!important;
        overflow:visible!important;
        border-color:rgba(236,176,197,.42)!important;
        background:
          radial-gradient(circle at 33% 26%,rgba(255,255,255,.25),transparent 19%),
          radial-gradient(circle at 50% 58%,rgba(121,73,154,.36),transparent 72%),
          linear-gradient(145deg,rgba(114,78,139,.52),rgba(41,29,62,.82))!important;
        box-shadow:0 0 0 4px rgba(221,157,189,.035),0 0 28px rgba(174,112,160,.18),inset 0 0 18px rgba(202,156,226,.09)!important;
      }
      .lunea-intimacy-category .cat-icon::after{
        content:'';
        position:absolute;
        inset:-5px;
        border-radius:inherit;
        border:1px solid rgba(234,170,199,.08);
        box-shadow:0 0 24px rgba(205,116,172,.08);
        opacity:.8;
        pointer-events:none;
      }
      .lunea-intimacy-sector-mark{width:66%;height:66%;display:block;overflow:visible;filter:drop-shadow(0 0 5px rgba(239,164,193,.17))}
      .lunea-intimacy-sector-mark .lunea-intimacy-orbit{fill:url(#luneaIntimacyRose);opacity:.93;transform-origin:32px 32px}
      .lunea-intimacy-sector-mark .orbit-b{opacity:.76}
      .lunea-intimacy-sector-mark .lunea-intimacy-star{fill:#ffe1d2;filter:drop-shadow(0 0 4px rgba(239,164,193,.45));transform-origin:32px 32px}
      .lunea-intimacy-sector-mark .lunea-intimacy-dot{fill:#e8b2c7;opacity:.82}
      .lunea-intimacy-category.active .cat-icon{animation:luneaIntimacyBreath 3.8s ease-in-out infinite}
      .lunea-intimacy-category.active .lunea-intimacy-sector-mark .orbit-a{animation:luneaIntimacyOrbitA 5.4s ease-in-out infinite}
      .lunea-intimacy-category.active .lunea-intimacy-sector-mark .orbit-b{animation:luneaIntimacyOrbitB 5.4s ease-in-out infinite}
      .lunea-intimacy-category.active .lunea-intimacy-sector-mark .lunea-intimacy-star{animation:luneaIntimacyStar 2.8s ease-in-out infinite}
      .lunea-intimacy-category .cat-text h3{letter-spacing:.45px;color:#f6edf4!important;text-shadow:0 0 18px rgba(232,171,201,.06)}
      .lunea-intimacy-category .cat-text p{line-height:1.45!important;color:rgba(210,202,217,.70)!important}
      .lunea-intimacy-category .lunea-intimacy-18-badge{
        border-color:rgba(232,142,179,.42)!important;
        background:linear-gradient(180deg,rgba(94,35,66,.30),rgba(72,27,54,.20))!important;
        color:#efb0c8!important;
        box-shadow:inset 0 1px rgba(255,255,255,.035),0 0 15px rgba(139,55,95,.08);
      }
      .lunea-intimacy-category .toggle{
        color:rgba(225,186,205,.76)!important;
        transition:transform .32s cubic-bezier(.2,.8,.2,1),color .25s ease,text-shadow .25s ease!important;
      }
      .lunea-intimacy-category.active .toggle{
        color:#ebb3c9!important;
        transform:rotate(45deg) scale(1.03)!important;
        text-shadow:0 0 12px rgba(236,158,190,.22);
      }
      .lunea-intimacy-category .category-content{padding:10px 12px 15px!important;gap:8px!important}
      .lunea-intimacy-category .reading-item{
        position:relative;
        box-sizing:border-box;
        min-height:78px;
        margin:0!important;
        padding:13px 48px 13px 13px!important;
        border:1px solid rgba(224,167,192,.12)!important;
        border-radius:15px!important;
        background:
          radial-gradient(circle at 0 50%,rgba(145,77,117,.055),transparent 43%),
          linear-gradient(120deg,rgba(132,75,110,.075),rgba(80,66,113,.04) 58%,rgba(255,255,255,.018))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.018);
        transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease,opacity .25s ease;
      }
      .lunea-intimacy-category.active .reading-item{animation:luneaIntimacyRise .34s cubic-bezier(.2,.72,.2,1) both}
      .lunea-intimacy-category.active .reading-item:nth-of-type(2){animation-delay:.035s}
      .lunea-intimacy-category.active .reading-item:nth-of-type(3){animation-delay:.07s}
      .lunea-intimacy-category.active .reading-item:nth-of-type(4){animation-delay:.105s}
      .lunea-intimacy-category.active .reading-item:nth-of-type(5){animation-delay:.14s}
      .lunea-intimacy-category.active .reading-item:nth-of-type(6){animation-delay:.175s}
      .lunea-intimacy-category.active .reading-item:nth-of-type(7){animation-delay:.21s}
      .lunea-intimacy-category.active .reading-item:nth-of-type(8){animation-delay:.245s}
      .lunea-intimacy-category .reading-item + .reading-item{border-top-width:1px!important}
      .lunea-intimacy-category .reading-item:hover,
      .lunea-intimacy-category .reading-item:focus-visible{
        transform:translateY(-1px);
        border-color:rgba(239,164,193,.34)!important;
        background:linear-gradient(120deg,rgba(147,78,119,.12),rgba(87,67,120,.065))!important;
        box-shadow:0 8px 22px rgba(20,10,25,.18),inset 0 1px rgba(255,255,255,.025);
        outline:none;
      }
      .lunea-intimacy-category .reading-item h4{margin:0 0 5px!important;color:#f7f1f5!important;font-size:14.2px!important;line-height:1.28!important;letter-spacing:-.1px}
      .lunea-intimacy-category .reading-item p{margin:0!important;color:rgba(210,201,216,.72)!important;font-size:10.4px!important;line-height:1.5!important;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
      .lunea-intimacy-category .reading-item .count{
        position:absolute!important;right:12px!important;top:50%!important;transform:translateY(-50%)!important;
        width:32px!important;height:32px!important;min-width:32px!important;display:grid!important;place-items:center!important;
        border-radius:999px!important;border:1px solid rgba(224,164,192,.24)!important;background:rgba(126,80,117,.13)!important;
        color:#eee5ed!important;font-size:11px!important;font-weight:700!important;box-shadow:inset 0 1px rgba(255,255,255,.025);transition:border-color .18s ease,background .18s ease,color .18s ease,box-shadow .18s ease!important
      }
      .lunea-intimacy-category .reading-item:hover .count,.lunea-intimacy-category .reading-item:focus-visible .count{border-color:rgba(239,164,193,.42)!important;background:rgba(139,62,105,.22)!important;color:#ffd6e5!important;box-shadow:0 0 14px rgba(205,100,151,.09),inset 0 1px rgba(255,255,255,.03)}
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:91px;
        border-color:rgba(238,156,191,.34)!important;
        background:
          radial-gradient(circle at 94% 8%,rgba(224,127,177,.14),transparent 35%),
          radial-gradient(circle at 4% 70%,rgba(117,74,151,.11),transparent 40%),
          linear-gradient(120deg,rgba(108,43,81,.25),rgba(47,34,67,.18))!important;
        box-shadow:inset 3px 0 rgba(229,145,181,.64),0 9px 24px rgba(38,10,30,.14);
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{color:#ffdbe9!important}
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 p{color:rgba(231,210,221,.82)!important}
      .lunea-intimacy-legacy-badge{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 6px;transform:translateY(-1px);border:1px solid rgba(241,149,190,.38);border-radius:999px;color:#f3abc9;background:rgba(121,50,86,.23);font-size:8px;font-weight:700;letter-spacing:.55px;vertical-align:middle;box-shadow:inset 0 1px rgba(255,255,255,.025)}
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 .count{border-color:rgba(242,154,191,.46)!important;color:#ffd7e7!important;background:rgba(142,53,98,.26)!important}
      .lunea-intimacy-category .lunea-intimacy-list-label{margin:5px 3px 2px;color:rgba(229,181,204,.66);font-size:8.4px;font-weight:700;letter-spacing:1.15px;text-transform:uppercase}
      @keyframes luneaIntimacySweep{0%{left:-46%;opacity:0}18%{opacity:.72}100%{left:112%;opacity:0}}
      @keyframes luneaIntimacyBreath{0%,100%{box-shadow:0 0 0 4px rgba(221,157,189,.035),0 0 24px rgba(174,112,160,.14),inset 0 0 18px rgba(202,156,226,.08)}50%{box-shadow:0 0 0 4px rgba(221,157,189,.045),0 0 34px rgba(190,104,163,.23),inset 0 0 22px rgba(204,157,232,.13)}}
      @keyframes luneaIntimacyOrbitA{0%,100%{transform:translateX(-.2px) rotate(-1deg)}50%{transform:translateX(.8px) rotate(2deg)}}
      @keyframes luneaIntimacyOrbitB{0%,100%{transform:translateX(.2px) rotate(1deg)}50%{transform:translateX(-.8px) rotate(-2deg)}}
      @keyframes luneaIntimacyStar{0%,100%{transform:scale(.93);opacity:.82}50%{transform:scale(1.08);opacity:1}}
      @keyframes luneaIntimacyRise{0%{opacity:0;transform:translateY(7px)}100%{opacity:1;transform:translateY(0)}}
      @media(max-width:430px){
        .lunea-intimacy-category .category-content{padding:9px 9px 13px!important;gap:7px!important}
        .lunea-intimacy-category .reading-item{min-height:75px;padding:12px 45px 12px 12px!important;border-radius:14px!important}
        .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{min-height:90px}
        .lunea-intimacy-category .reading-item h4{font-size:13.8px!important}
        .lunea-intimacy-category .reading-item p{font-size:10.15px!important;line-height:1.47!important}
        .lunea-intimacy-category .reading-item .count{right:10px!important;width:31px!important;height:31px!important;min-width:31px!important}
        .lunea-intimacy-category .cat-icon{box-shadow:0 0 0 3px rgba(221,157,189,.035),0 0 22px rgba(174,112,160,.16)!important}
      }
      @media(prefers-reduced-motion:reduce){
        .lunea-intimacy-category *,.lunea-intimacy-category *::before,.lunea-intimacy-category *::after{animation:none!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}
        .lunea-intimacy-category.active .toggle{transform:rotate(45deg)!important}
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

  function installSectorMark(category) {
    const icon = $('.cat-icon', category);
    if (!icon) return;
    if (!$('.lunea-intimacy-sector-mark', icon)) icon.innerHTML = SECTOR_MARK;
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('lunea-intimacy-branded-icon');
  }

  function polishExisting(category) {
    installSectorMark(category);
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
    console.info(`🌹 LUNEA INTIMACY original spread + sector brand V${RELEASE} ready`);
    return;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) {
      clearInterval(timer);
      if (tries <= 160) console.info(`🌹 LUNEA INTIMACY original spread + sector brand V${RELEASE} ready`);
    }
  }, 50);
})();
