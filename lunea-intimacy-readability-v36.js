'use strict';

/* LUNEA INTIMACY mobile readability + category-style artwork V36.2 */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_READABILITY_V36__) return;
  W.__LUNEA_INTIMACY_READABILITY_V36__ = true;

  const RELEASE = '36.2';
  const SCRIPT_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3620';
    } catch {
      return '3620';
    }
  })();
  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v37.svg?v=${encodeURIComponent(SCRIPT_VERSION)}`;
  const $ = (selector, root = document) => root.querySelector(selector);

  function addStyles() {
    if ($('#luneaIntimacyReadabilityV36Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyReadabilityV36Style';
    style.textContent = `
      .lunea-intimacy-category .cat-icon{
        min-width:78px!important;
        min-height:78px!important;
        width:78px!important;
        height:78px!important;
        padding:0!important;
        overflow:hidden!important;
        border-radius:22px!important;
        border:1px solid rgba(239,185,211,.34)!important;
        background:#181329!important;
        box-shadow:0 0 0 3px rgba(222,160,192,.04),0 0 24px rgba(175,107,159,.15),inset 0 1px rgba(255,255,255,.05)!important;
      }
      .lunea-intimacy-category .cat-icon::after{
        inset:0!important;
        border-radius:21px!important;
        border:1px solid rgba(255,223,236,.08)!important;
        box-shadow:inset 0 0 16px rgba(229,176,210,.05)!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-art-v37{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        border-radius:21px!important;
        transform:scale(1.01);
        filter:saturate(.98) contrast(1.03) brightness(1.02);
      }
      .lunea-intimacy-category.active .cat-icon{
        animation:luneaIntimacyBreath 3.8s ease-in-out infinite;
      }
      .lunea-intimacy-category .category-content{
        padding:12px 13px 16px!important;
        gap:10px!important;
      }
      .lunea-intimacy-category .reading-item{
        min-height:84px!important;
        padding:15px 62px 15px 16px!important;
        border-radius:16px!important;
      }
      .lunea-intimacy-category .reading-item > div:first-child{
        min-width:0!important;
        max-width:100%!important;
      }
      .lunea-intimacy-category .reading-item h4{
        margin:0 0 6px!important;
        font-size:15.3px!important;
        line-height:1.34!important;
        letter-spacing:-.12px!important;
        color:#fbf6fa!important;
      }
      .lunea-intimacy-category .reading-item p{
        margin:0!important;
        color:rgba(225,217,230,.82)!important;
        font-size:11.6px!important;
        line-height:1.56!important;
        -webkit-line-clamp:3!important;
        overflow-wrap:anywhere;
        word-break:keep-all;
      }
      .lunea-intimacy-category .reading-item .count{
        top:14px!important;
        right:13px!important;
        transform:none!important;
        width:35px!important;
        height:35px!important;
        min-width:35px!important;
        font-size:11.5px!important;
        z-index:2;
      }
      .lunea-intimacy-category .reading-item .count.lunea-count-label{
        width:auto!important;
        min-width:45px!important;
        padding:0 9px!important;
        border-radius:999px!important;
        font-size:10.8px!important;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:98px!important;
        padding-top:16px!important;
        padding-bottom:16px!important;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{
        display:flex!important;
        flex-wrap:wrap!important;
        align-items:center!important;
        gap:6px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-legacy-badge{
        margin-left:0!important;
        padding:3px 7px!important;
        font-size:8.4px!important;
        letter-spacing:.62px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-list-label{
        margin:9px 5px 2px!important;
        color:rgba(238,190,213,.78)!important;
        font-size:9.4px!important;
        line-height:1.3!important;
        letter-spacing:1.25px!important;
      }
      @media(max-width:430px){
        .lunea-intimacy-category .category-header{
          min-height:116px!important;
        }
        .lunea-intimacy-category .cat-icon{
          min-width:72px!important;
          min-height:72px!important;
          width:72px!important;
          height:72px!important;
          border-radius:20px!important;
        }
        .lunea-intimacy-category .cat-icon::after,
        .lunea-intimacy-category .lunea-intimacy-sector-art-v37{border-radius:19px!important}
        .lunea-intimacy-category .cat-text h3{
          font-size:18.5px!important;
          line-height:1.15!important;
        }
        .lunea-intimacy-category .cat-text p{
          margin-top:6px!important;
          font-size:11.8px!important;
          line-height:1.48!important;
          color:rgba(222,214,226,.77)!important;
        }
        .lunea-intimacy-category .category-content{
          padding:12px 12px 15px!important;
          gap:10px!important;
        }
        .lunea-intimacy-category .reading-item{
          min-height:88px!important;
          padding:15px 58px 15px 15px!important;
          border-radius:16px!important;
        }
        .lunea-intimacy-category .reading-item h4{
          margin-bottom:7px!important;
          font-size:15.6px!important;
          line-height:1.34!important;
        }
        .lunea-intimacy-category .reading-item p{
          font-size:11.7px!important;
          line-height:1.58!important;
          color:rgba(229,221,233,.84)!important;
          -webkit-line-clamp:3!important;
        }
        .lunea-intimacy-category .reading-item .count{
          top:14px!important;
          right:12px!important;
          width:34px!important;
          height:34px!important;
          min-width:34px!important;
        }
        .lunea-intimacy-category .reading-item .count.lunea-count-label{
          min-width:44px!important;
          padding:0 8px!important;
        }
        .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{min-height:104px!important}
        .lunea-intimacy-category .lunea-intimacy-list-label{
          margin:10px 5px 1px!important;
          font-size:9.3px!important;
        }
      }
      @media(max-width:380px){
        .lunea-intimacy-category .cat-icon{
          min-width:66px!important;
          min-height:66px!important;
          width:66px!important;
          height:66px!important;
          border-radius:18px!important;
        }
        .lunea-intimacy-category .cat-icon::after,
        .lunea-intimacy-category .lunea-intimacy-sector-art-v37{border-radius:17px!important}
        .lunea-intimacy-category .cat-text h3{font-size:17.5px!important}
        .lunea-intimacy-category .cat-text p{font-size:11.2px!important}
        .lunea-intimacy-category .reading-item{padding:14px 54px 14px 14px!important}
        .lunea-intimacy-category .reading-item h4{font-size:15px!important}
        .lunea-intimacy-category .reading-item p{font-size:11.25px!important;line-height:1.55!important}
        .lunea-intimacy-category .reading-item .count{right:10px!important}
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
    const existing = $('.lunea-intimacy-sector-art-v37', icon);
    if (existing) {
      if (existing.getAttribute('src') !== ICON_SRC) existing.setAttribute('src', ICON_SRC);
      return;
    }
    icon.innerHTML = '';
    const img = document.createElement('img');
    img.className = 'lunea-intimacy-sector-art-v37';
    img.src = ICON_SRC;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    icon.appendChild(img);
  }

  function guardIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon || icon.dataset.intimacyLogoGuard === '1') return;
    icon.dataset.intimacyLogoGuard = '1';
    const observer = new MutationObserver(() => {
      const art = $('.lunea-intimacy-sector-art-v37', icon);
      if (!art || art.getAttribute('src') !== ICON_SRC) installIcon(category);
    });
    observer.observe(icon, { childList: true, subtree: false });
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
    guardIcon(category);
    classifyCounts(category);
    return true;
  }

  if (install()) {
    console.info(`🌹 LUNEA INTIMACY readability V${RELEASE} ready`);
    return;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) {
      clearInterval(timer);
      if (tries <= 160) console.info(`🌹 LUNEA INTIMACY readability V${RELEASE} ready`);
    }
  }, 50);
})();