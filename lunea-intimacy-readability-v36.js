'use strict';

/* LUNEA INTIMACY stable sector-aligned UI V38.0 */
(() => {
  const W = window;
  const RELEASE = '38.0';
  const RUNTIME_KEY = '__LUNEA_INTIMACY_UI_RELEASE__';
  if (W[RUNTIME_KEY] === RELEASE) return;
  W[RUNTIME_KEY] = RELEASE;

  const SCRIPT_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3800';
    } catch {
      return '3800';
    }
  })();
  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v37.svg?v=${encodeURIComponent(SCRIPT_VERSION)}`;
  const $ = (selector, root = document) => root.querySelector(selector);

  const COPY = Object.freeze([
    ['직접 입력 배열', '포지션을 직접 고정하고, 필요하면 A/B 대칭 배열로 복제'],
    ['AI 맞춤 INTIMACY 배열', '질문에 맞춰 끌림 · 리듬 · 경계 · 만족 포지션을 자동 설계'],
    ['속궁합 · 19+', '욕구·리드 · 압박/밀착 · 템포 · 지속성 · 판타지 · 만족 · 여운'],
    ['신체적 속궁합 · CORE 5', '신체적 끌림 · 나의 방식/리듬 · 상대의 방식/리듬 · 어긋남 · 조율 핵심'],
    ['성적 끌림 & 텐션', '상호 끌림 · 실제 케미/긴장 · 숨긴 욕구 · 표현을 막는 요인 · 긴장의 방향'],
    ['리듬 · 경계 · 조율', '나의 템포 · 상대의 템포 · 편안함 조건 · 경계 · 조율 포인트 · 이후 흐름'],
    ['재회 후 친밀감', '남은 끌림 · 정서적 애착 · 다시 가까워질 동기 · 반복 문제 · 재접촉 리듬 · 관계 영향'],
    ['A/B 친밀감 비교', 'A의 끌림·리듬·안전감 · B의 끌림·리듬·안전감 · 공통 욕구 · 만족 비교']
  ]);

  function addStyles() {
    if ($('#luneaIntimacyUiV37Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyUiV37Style';
    style.textContent = `
      .lunea-intimacy-category .category-header,
      .lunea-intimacy-category .reading-item{
        pointer-events:auto!important;
        touch-action:manipulation!important;
        -webkit-tap-highlight-color:transparent;
      }
      .lunea-intimacy-category .cat-icon{
        width:62px!important;
        height:62px!important;
        min-width:62px!important;
        min-height:62px!important;
        padding:0!important;
        overflow:hidden!important;
        border-radius:18px!important;
        border:1px solid rgba(230,184,207,.28)!important;
        background:#181329 url('${ICON_SRC}') center/cover no-repeat!important;
        box-shadow:0 6px 18px rgba(24,10,31,.16),inset 0 1px rgba(255,255,255,.05)!important;
      }
      .lunea-intimacy-category .cat-icon::before,
      .lunea-intimacy-category .cat-icon::after{pointer-events:none!important}
      .lunea-intimacy-category .lunea-intimacy-sector-art-v37{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;
        border-radius:17px!important;pointer-events:none!important
      }
      .lunea-intimacy-category .lunea-intimacy-sector-mark-v37-sentinel{
        display:none!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important
      }
      .lunea-intimacy-category .category-content{
        padding:9px 12px 14px!important;
        gap:10px!important;
      }
      .lunea-intimacy-category .reading-item{
        min-height:72px!important;
        padding:13px 46px 13px 14px!important;
        border-radius:15px!important;
      }
      .lunea-intimacy-category .reading-item > div:first-child{min-width:0!important;max-width:100%!important}
      .lunea-intimacy-category .reading-item h4{
        margin:0 0 6px!important;
        font-size:14.6px!important;
        line-height:1.32!important;
        letter-spacing:-.08px!important;
      }
      .lunea-intimacy-category .reading-item p{
        margin:0!important;
        display:-webkit-box!important;
        -webkit-box-orient:vertical!important;
        -webkit-line-clamp:2!important;
        overflow:hidden!important;
        font-size:10.9px!important;
        line-height:1.52!important;
        color:rgba(224,216,229,.8)!important;
        word-break:keep-all!important;
      }
      .lunea-intimacy-category .reading-item .count{
        top:14px!important;right:12px!important;transform:none!important;
        width:27px!important;height:27px!important;min-width:27px!important;
        font-size:10.3px!important;pointer-events:none!important;z-index:2!important
      }
      .lunea-intimacy-category .reading-item .count.lunea-count-label{
        width:auto!important;min-width:39px!important;height:27px!important;padding:0 7px!important;
        border-radius:999px!important;font-size:9.8px!important
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:78px!important;padding-top:14px!important;padding-bottom:14px!important
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{
        display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:5px!important
      }
      .lunea-intimacy-category .lunea-intimacy-legacy-badge{
        margin-left:0!important;padding:3px 6px!important;font-size:8.2px!important;line-height:1.1!important
      }
      .lunea-intimacy-category .lunea-intimacy-list-label{
        margin:7px 4px 0!important;
        font-size:9px!important;
        line-height:1.3!important;
        letter-spacing:.85px!important;
        color:rgba(229,181,204,.76)!important;
      }
      @media(max-width:380px){
        .lunea-intimacy-category .cat-icon{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;border-radius:17px!important}
        .lunea-intimacy-category .reading-item{padding:12px 43px 12px 12px!important}
        .lunea-intimacy-category .reading-item h4{font-size:14.1px!important}
        .lunea-intimacy-category .reading-item p{font-size:10.6px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon) return;
    const img = document.createElement('img');
    img.className = 'lunea-intimacy-sector-art-v37';
    img.src = ICON_SRC;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');

    // legacy-v35 only injects its old orbit mark when this class is absent.
    // Keep a hidden sentinel with the legacy class so late legacy timers cannot overwrite V37 artwork.
    const sentinel = document.createElement('span');
    sentinel.className = 'lunea-intimacy-sector-mark lunea-intimacy-sector-mark-v37-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');

    icon.replaceChildren(img, sentinel);
    icon.classList.add('lunea-intimacy-v37-icon');
  }

  function normalizeCopy(category) {
    category.querySelectorAll('.reading-item').forEach(item => {
      const title = String($('h4', item)?.textContent || '').replace(/\s+/g, ' ').trim();
      const body = $('p', item);
      if (!body) return;
      const hit = COPY.find(([key]) => title.includes(key));
      if (hit) body.textContent = hit[1];
    });
    const label = $('.lunea-intimacy-list-label', category);
    if (label) label.textContent = 'INTIMACY · 고정 배열';
  }

  function classifyCounts(category) {
    category.querySelectorAll('.reading-item .count').forEach(count => {
      count.classList.toggle('lunea-count-label', !/^\d+$/.test(String(count.textContent || '').trim()));
    });
  }

  function apply() {
    const category = $('.lunea-intimacy-category');
    if (!category) return false;
    category.dataset.luneaIntimacyUiRelease = RELEASE;
    addStyles();
    installIcon(category);
    normalizeCopy(category);
    classifyCounts(category);
    return true;
  }

  if (!apply()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (apply() || tries >= 80) clearInterval(timer);
    }, 50);
  }

  [350, 1200, 3000].forEach(ms => setTimeout(apply, ms));
  W.addEventListener('pageshow', () => setTimeout(apply, 40));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(apply, 40);
  });

  console.info(`🌹 LUNEA INTIMACY stable UI V${RELEASE} ready`);
})();