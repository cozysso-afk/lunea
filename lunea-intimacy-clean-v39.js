'use strict';

/*
  LUNEA INTIMACY CLEAN UI V39
  ============================
  Final presentation layer for the INTIMACY cabinet.

  Goals:
  - make INTIMACY a real Home Portal tile instead of leaving the raw source
    category visible beneath the other portal tiles;
  - remove the legacy circular sparkle/orbit artwork from the final DOM and use
    the dedicated square celestial artwork everywhere;
  - align the opened INTIMACY list with LOVE/CAREER/etc: simple divider rows,
    normal-flow count pills, and only the AI entry receiving a contained card;
  - keep all existing click handlers, fixed spread semantics, RNG, and adult
    acknowledgement logic untouched.
*/
(() => {
  const W = window;
  const RELEASE = '39.0';
  const RUNTIME_KEY = '__LUNEA_INTIMACY_CLEAN_UI_RELEASE__';
  const alreadyBound = W[RUNTIME_KEY] === RELEASE;
  W[RUNTIME_KEY] = RELEASE;

  const SCRIPT_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3900';
    } catch {
      return '3900';
    }
  })();
  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_final.png?v=${encodeURIComponent(SCRIPT_VERSION)}`;
  const STYLE_ID = 'luneaIntimacyCleanV39Style';
  const HOME_TILE_ID = 'luneaIntimacyHomeTileV39';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function removeLegacyPresentation() {
    // These layers contain the old circular/orbit branding and the boxed list
    // treatment. Their behavior lives in JS listeners and is intentionally kept.
    document.getElementById('luneaIntimacyLegacyV35Style')?.remove();
    document.getElementById('luneaIntimacyUiV37Style')?.remove();
  }

  function ensureStyles() {
    removeLegacyPresentation();
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    // Always refresh the text. This matters for long-lived iOS/PWA documents:
    // an old style node must never block a newer release from taking effect.
    style.textContent = `
      .lunea-intimacy-category{
        background:var(--panel)!important;
        border-color:var(--border)!important;
        box-shadow:none!important;
      }
      .lunea-intimacy-category .category-header{
        padding:15px 16px!important;
        overflow:visible!important;
        border:0!important;
        background:transparent!important;
        box-shadow:none!important;
        isolation:auto!important;
      }
      .lunea-intimacy-category .category-header::before,
      .lunea-intimacy-category .category-header::after{display:none!important}
      .lunea-intimacy-category .cat-left{gap:11px!important;min-width:0!important}
      .lunea-intimacy-category .cat-icon{
        width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;
        padding:0!important;overflow:hidden!important;border-radius:16px!important;
        display:block!important;position:relative!important;
        border:1px solid rgba(226,211,240,.20)!important;
        background:#151326 url('${ICON_SRC}') center/cover no-repeat!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 6px 17px rgba(0,0,0,.16)!important;
        animation:none!important;
      }
      .lunea-intimacy-category .cat-icon::before,
      .lunea-intimacy-category .cat-icon::after{display:none!important}
      .lunea-intimacy-category .lunea-intimacy-sector-art-v39{
        display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;
        border-radius:15px!important;pointer-events:none!important
      }
      .lunea-intimacy-category .cat-text{min-width:0!important}
      .lunea-intimacy-category .cat-text h3{
        margin:0!important;color:#f2edf5!important;text-shadow:none!important;
        font:700 14px/1.25 'Cinzel','Noto Serif KR',serif!important;letter-spacing:.7px!important
      }
      .lunea-intimacy-category .cat-text p{
        margin:3px 0 0!important;color:var(--dim)!important;font-size:10.5px!important;line-height:1.4!important
      }
      .lunea-intimacy-category .lunea-intimacy-18-badge{
        display:inline-flex!important;align-items:center!important;vertical-align:2px!important;
        margin-left:5px!important;padding:2px 6px!important;border-radius:999px!important;
        border:1px solid rgba(221,129,169,.34)!important;background:rgba(121,48,85,.13)!important;
        color:#e9abc4!important;font-size:8px!important;line-height:1.1!important;letter-spacing:.65px!important;
        box-shadow:none!important
      }
      .lunea-intimacy-category .toggle{color:var(--dim)!important;text-shadow:none!important}
      .lunea-intimacy-category.active .toggle{color:var(--moon)!important;transform:rotate(45deg)!important}

      /* Same information rhythm as LOVE: divider rows, not cards inside cards. */
      .lunea-intimacy-category .category-content{
        padding:0 17px 9px!important;gap:0!important
      }
      .lunea-intimacy-category .reading-item{
        display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;
        min-height:0!important;margin:0!important;padding:13px 1px!important;
        border:0!important;border-top:1px solid rgba(255,255,255,.065)!important;border-radius:0!important;
        background:transparent!important;box-shadow:none!important;
        transform:none!important;animation:none!important;opacity:1!important;
        pointer-events:auto!important;touch-action:manipulation!important
      }
      .lunea-intimacy-category .reading-item:hover,
      .lunea-intimacy-category .reading-item:focus-visible{
        transform:none!important;background:transparent!important;box-shadow:none!important;
        border-color:rgba(255,255,255,.095)!important
      }
      .lunea-intimacy-category .reading-item > div:first-child{min-width:0!important;max-width:calc(100% - 46px)!important}
      .lunea-intimacy-category .reading-item h4{
        margin:0 0 3px!important;color:#eee8f8!important;font-size:13px!important;line-height:1.35!important;
        font-weight:600!important;letter-spacing:0!important
      }
      .lunea-intimacy-category .reading-item p{
        margin:0!important;color:var(--dim)!important;font-size:10.5px!important;line-height:1.45!important;
        display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important;word-break:keep-all!important
      }
      .lunea-intimacy-category .reading-item .count{
        position:static!important;right:auto!important;top:auto!important;transform:none!important;
        width:auto!important;height:auto!important;min-width:34px!important;min-height:0!important;
        padding:4px 9px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;
        border-radius:12px!important;border:1px solid rgba(189,164,248,.30)!important;
        background:rgba(189,164,248,.11)!important;color:#d6c5ff!important;
        font-size:10.5px!important;font-weight:700!important;line-height:1.2!important;box-shadow:none!important;
        pointer-events:none!important;white-space:nowrap!important;flex:0 0 auto!important
      }
      .lunea-intimacy-category .reading-item .count.lunea-count-label{min-width:0!important;padding:4px 9px!important}

      /* Match LOVE's one contained AI row. Everything else stays a simple row. */
      .lunea-intimacy-category .reading-item[data-intimacy-ai="1"]{
        margin:5px -4px 8px!important;padding:12px 11px!important;
        border:1px solid rgba(210,186,229,.14)!important;border-radius:14px!important;
        background:linear-gradient(145deg,rgba(116,86,145,.09),rgba(67,83,116,.045))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important
      }
      .lunea-intimacy-category .reading-item[data-intimacy-ai="1"] .count{
        color:#e9dff4!important;border-color:rgba(205,177,226,.20)!important;background:rgba(154,124,185,.09)!important
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:0!important;padding:13px 1px!important;border-radius:0!important;background:transparent!important;
        box-shadow:none!important;border-left:0!important;border-right:0!important;border-bottom:0!important
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{
        display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px!important;color:#f1e8ef!important
      }
      .lunea-intimacy-category .lunea-intimacy-legacy-badge{
        display:inline-flex!important;margin:0!important;padding:2px 6px!important;transform:none!important;
        border:1px solid rgba(226,144,181,.28)!important;border-radius:999px!important;
        background:rgba(127,54,89,.10)!important;color:#dfa1b9!important;
        font-size:7.8px!important;line-height:1.1!important;letter-spacing:.55px!important;box-shadow:none!important
      }
      .lunea-intimacy-category .lunea-intimacy-list-label{display:none!important}

      /* Home: INTIMACY is a real portal entry, like the other reading sectors. */
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{
        grid-column:1/-1!important;display:grid!important;
        grid-template-columns:58px minmax(0,1fr) 22px!important;grid-template-rows:auto auto!important;
        column-gap:13px!important;row-gap:3px!important;align-items:center!important;
        min-height:102px!important;padding:13px 14px!important;
        border-color:rgba(217,153,187,.18)!important;
        background:radial-gradient(circle at 8% 22%,rgba(196,132,174,.13),transparent 28%),linear-gradient(148deg,rgba(27,19,38,.90),rgba(9,11,24,.97))!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{
        grid-column:1!important;grid-row:1/3!important;width:58px!important;height:58px!important;margin:0!important;
        border-radius:17px!important;overflow:hidden!important;padding:0!important;background:#151326!important;
        border:1px solid rgba(228,207,235,.19)!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object img{
        display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;pointer-events:none!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-label{
        grid-column:2!important;grid-row:1!important;align-self:end!important;margin:0!important;font-size:12px!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-sub{
        grid-column:2!important;grid-row:2!important;align-self:start!important;margin:0!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-open{
        grid-column:3!important;grid-row:1/3!important;position:static!important;align-self:center!important;justify-self:end!important
      }
      .lunea-v39-adult-badge{
        display:inline-flex;align-items:center;margin-left:5px;padding:2px 5px;border-radius:999px;
        border:1px solid rgba(223,137,176,.34);color:#e8a8c0;font:700 7.5px/1 system-ui,sans-serif;letter-spacing:.55px;vertical-align:2px
      }
      @media(max-width:390px){
        .lunea-intimacy-category .cat-icon{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;border-radius:15px!important}
        .lunea-intimacy-category .reading-item{padding:12px 1px!important}
        .lunea-intimacy-category .reading-item h4{font-size:12.7px!important}
        .lunea-intimacy-category .reading-item p{font-size:10.2px!important}
        #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{grid-template-columns:54px minmax(0,1fr) 20px!important;min-height:96px!important;padding:12px!important}
        #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{width:54px!important;height:54px!important;border-radius:16px!important}
      }
    `;
  }

  function ensureCategoryIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon) return false;
    const img = document.createElement('img');
    img.className = 'lunea-intimacy-sector-art-v39';
    img.src = ICON_SRC;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    icon.replaceChildren(img);
    icon.classList.add('lunea-intimacy-v39-icon');
    icon.style.setProperty('background-image', `url("${ICON_SRC}")`, 'important');
    icon.style.setProperty('background-position', 'center', 'important');
    icon.style.setProperty('background-size', 'cover', 'important');
    icon.style.setProperty('background-repeat', 'no-repeat', 'important');
    return true;
  }

  function normalizeCategory(category) {
    category.dataset.luneaIntimacyCleanRelease = RELEASE;
    ensureCategoryIcon(category);
    const label = $('.lunea-intimacy-list-label', category);
    if (label) label.hidden = true;
    const badge = $('.lunea-intimacy-legacy-badge', category);
    if (badge) badge.textContent = 'ORIGINAL';
    $$('.reading-item .count', category).forEach(count => {
      count.classList.toggle('lunea-count-label', !/^\d+$/.test(String(count.textContent || '').trim()));
    });
  }

  function openIntimacySource(category, tile) {
    $$('.category.lunea-v8-source-category').forEach(node => {
      if (node !== category) {
        node.classList.remove('lunea-v8-source-active', 'active');
        node.querySelector('.category-header')?.setAttribute('aria-expanded', 'false');
      }
    });
    $$('#luneaHomePortalV8 .lunea-v8-tile').forEach(node => node.setAttribute('aria-pressed', 'false'));
    category.classList.add('lunea-v8-source-active');
    tile.setAttribute('aria-pressed', 'true');
    const header = $('.category-header', category);
    if (header && !category.classList.contains('active')) header.click();
    setTimeout(() => category.scrollIntoView({behavior:'smooth', block:'start'}), 70);
  }

  function ensureHomeTile(category) {
    const portal = document.getElementById('luneaHomePortalV8');
    const grid = portal?.querySelector('.lunea-v8-grid');
    if (!portal || !grid) return false;

    const wasOpen = category.classList.contains('active');
    category.classList.add('lunea-v8-source-category');
    if (wasOpen) category.classList.add('lunea-v8-source-active');

    let tile = document.getElementById(HOME_TILE_ID) || grid.querySelector('.lunea-v8-tile[data-key="intimacy"]');
    if (!tile) {
      tile = document.createElement('button');
      tile.type = 'button';
      tile.id = HOME_TILE_ID;
      tile.className = 'lunea-v8-tile';
      tile.dataset.key = 'intimacy';
      tile.setAttribute('aria-pressed', wasOpen ? 'true' : 'false');
      tile.innerHTML = `
        <span class="lunea-v8-object"><img src="${ICON_SRC}" alt="" aria-hidden="true"></span>
        <span class="lunea-v8-label">INTIMACY <span class="lunea-v39-adult-badge">18+</span></span>
        <span class="lunea-v8-sub">끌림 · 신체적 속궁합 · 리듬 · 경계 · 재회 후 친밀감</span>
        <span class="lunea-v8-open">＋</span>`;
      tile.addEventListener('click', () => openIntimacySource(category, tile));
      grid.appendChild(tile);
    } else {
      tile.dataset.key = 'intimacy';
      const art = $('.lunea-v8-object img', tile);
      if (art) art.src = ICON_SRC;
    }

    // Thai astrology lives in the same grid but is not one of the oracle count.
    const oracleCount = grid.querySelectorAll('.lunea-v8-tile:not(.lunea-thai-home-tile)').length;
    const note = $('.v8-title-note', portal);
    if (note) note.textContent = `${oracleCount} ORACLES`;
    return true;
  }

  function apply() {
    const category = $('.lunea-intimacy-category');
    if (!category) return false;
    ensureStyles();
    normalizeCategory(category);
    ensureHomeTile(category);
    return true;
  }

  apply();
  [120, 420, 950, 1800, 3400].forEach(ms => setTimeout(apply, ms));

  if (!alreadyBound) {
    W.addEventListener('pageshow', () => setTimeout(apply, 40));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(apply, 40);
    });
  }

  W.LUNEA_INTIMACY_CLEAN_V39 = Object.freeze({
    version: RELEASE,
    icon: ICON_SRC,
    apply,
    ensureHomeTile,
    ensureCategoryIcon,
  });
  console.info(`🌹 LUNEA INTIMACY clean UI V${RELEASE} ready`);
})();
