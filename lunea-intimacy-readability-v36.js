'use strict';

/* LUNEA INTIMACY touch-safe layout + category artwork V36.5 */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_READABILITY_V36__) return;
  W.__LUNEA_INTIMACY_READABILITY_V36__ = true;

  const RELEASE = '36.5';
  const SCRIPT_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3650';
    } catch {
      return '3650';
    }
  })();
  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v37.svg?v=${encodeURIComponent(SCRIPT_VERSION)}`;
  const $ = (selector, root = document) => root.querySelector(selector);

  function addStyles() {
    if ($('#luneaIntimacyReadabilityV36Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyReadabilityV36Style';
    style.textContent = `
      .lunea-intimacy-category .category-header,
      .lunea-intimacy-category .reading-item{
        pointer-events:auto!important;
        touch-action:manipulation!important;
        -webkit-tap-highlight-color:transparent;
      }
      .lunea-intimacy-category .reading-item > *,
      .lunea-intimacy-category .reading-item .count,
      .lunea-intimacy-category .cat-icon > *{
        pointer-events:none!important;
      }
      .lunea-intimacy-category .cat-icon{
        min-width:72px!important;
        min-height:72px!important;
        width:72px!important;
        height:72px!important;
        padding:0!important;
        overflow:hidden!important;
        border-radius:20px!important;
        border:1px solid rgba(239,185,211,.34)!important;
        background:#181329!important;
        box-shadow:0 0 0 3px rgba(222,160,192,.04),0 0 22px rgba(175,107,159,.14),inset 0 1px rgba(255,255,255,.05)!important;
      }
      .lunea-intimacy-category .cat-icon::after{
        inset:0!important;
        border-radius:19px!important;
        border:1px solid rgba(255,223,236,.08)!important;
        box-shadow:inset 0 0 16px rgba(229,176,210,.05)!important;
        pointer-events:none!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-art-v37{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        border-radius:19px!important;
        filter:saturate(.98) contrast(1.03) brightness(1.02);
      }
      .lunea-intimacy-category .category-content{
        padding:10px 10px 14px!important;
        gap:8px!important;
      }
      .lunea-intimacy-category .reading-item{
        min-height:76px!important;
        padding:13px 46px 13px 13px!important;
        border-radius:14px!important;
        border-color:rgba(232,174,200,.16)!important;
      }
      .lunea-intimacy-category .reading-item > div:first-child{
        min-width:0!important;
        max-width:100%!important;
      }
      .lunea-intimacy-category .reading-item h4{
        margin:0 0 5px!important;
        font-size:14.3px!important;
        line-height:1.32!important;
        color:#f8f2f7!important;
      }
      .lunea-intimacy-category .reading-item p{
        display:block!important;
        margin:0!important;
        color:rgba(218,210,224,.78)!important;
        font-size:10.8px!important;
        line-height:1.52!important;
        overflow:visible!important;
        -webkit-line-clamp:unset!important;
        word-break:keep-all!important;
      }
      .lunea-intimacy-category .reading-item .count{
        position:absolute!important;
        top:13px!important;
        right:11px!important;
        transform:none!important;
        width:28px!important;
        height:28px!important;
        min-width:28px!important;
        display:grid!important;
        place-items:center!important;
        font-size:10.5px!important;
        border-color:rgba(239,168,198,.28)!important;
        background:rgba(121,66,105,.13)!important;
        color:#f6eaf1!important;
        z-index:2;
      }
      .lunea-intimacy-category .reading-item .count.lunea-count-label{
        width:auto!important;
        min-width:40px!important;
        padding:0 7px!important;
        border-radius:999px!important;
        font-size:10px!important;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:84px!important;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{
        display:flex!important;
        flex-wrap:wrap!important;
        align-items:center!important;
        gap:5px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-legacy-badge{
        margin-left:0!important;
        padding:3px 6px!important;
        font-size:8.2px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-list-label{
        margin:8px 4px 1px!important;
        font-size:9px!important;
        line-height:1.3!important;
        color:rgba(229,181,204,.72)!important;
      }
      @media(max-width:380px){
        .lunea-intimacy-category .cat-icon{
          min-width:66px!important;
          min-height:66px!important;
          width:66px!important;
          height:66px!important;
          border-radius:18px!important;
        }
        .lunea-intimacy-category .lunea-intimacy-sector-art-v37,
        .lunea-intimacy-category .cat-icon::after{border-radius:17px!important}
        .lunea-intimacy-category .reading-item{padding:12px 44px 12px 12px!important}
        .lunea-intimacy-category .reading-item h4{font-size:13.9px!important}
        .lunea-intimacy-category .reading-item p{font-size:10.5px!important}
      }
      @media(prefers-reduced-motion:reduce){
        .lunea-intimacy-category .cat-icon{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon) return;
    let img = $('.lunea-intimacy-sector-art-v37', icon);
    if (!img) {
      icon.innerHTML = '';
      img = document.createElement('img');
      img.className = 'lunea-intimacy-sector-art-v37';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      icon.appendChild(img);
    }
    if (img.getAttribute('src') !== ICON_SRC) img.setAttribute('src', ICON_SRC);
  }

  function classifyCounts(category) {
    category.querySelectorAll('.reading-item .count').forEach(count => {
      const text = String(count.textContent || '').trim();
      count.classList.toggle('lunea-count-label', !/^\d+$/.test(text));
    });
  }

  function install() {
    addStyles();
    const category = $('.lunea-intimacy-category');
    if (!category) return false;
    installIcon(category);
    classifyCounts(category);
    return true;
  }

  if (install()) {
    console.info(`🌹 LUNEA INTIMACY touch-safe V${RELEASE} ready`);
    return;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) {
      clearInterval(timer);
      if (tries <= 160) console.info(`🌹 LUNEA INTIMACY touch-safe V${RELEASE} ready`);
    }
  }, 50);
})();