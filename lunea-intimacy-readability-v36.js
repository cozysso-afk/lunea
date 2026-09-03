'use strict';

/* LUNEA INTIMACY mobile readability + icon repair V36.0 */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_READABILITY_V36__) return;
  W.__LUNEA_INTIMACY_READABILITY_V36__ = true;

  const RELEASE = '36.0';
  const $ = (selector, root = document) => root.querySelector(selector);

  const SECTOR_MARK = `
    <svg class="lunea-intimacy-sector-mark lunea-intimacy-sector-mark-v36" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="luneaIntimacyRoseV36" x1="8" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffe6dc"/>
          <stop offset=".38" stop-color="#f4b2c6"/>
          <stop offset=".72" stop-color="#d8a0d0"/>
          <stop offset="1" stop-color="#b9a4f1"/>
        </linearGradient>
      </defs>
      <ellipse class="lunea-intimacy-orbit orbit-a" cx="26.5" cy="32" rx="14.5" ry="20.5"/>
      <ellipse class="lunea-intimacy-orbit orbit-b" cx="37.5" cy="32" rx="14.5" ry="20.5"/>
      <path class="lunea-intimacy-star" d="M32 23.7 34.3 29.7 40.3 32l-6 2.3-2.3 6-2.3-6-6-2.3 6-2.3L32 23.7Z"/>
      <circle class="lunea-intimacy-dot dot-a" cx="32" cy="14.3" r="1.45"/>
      <circle class="lunea-intimacy-dot dot-b" cx="32" cy="49.7" r="1.45"/>
    </svg>`;

  function addStyles() {
    if ($('#luneaIntimacyReadabilityV36Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyReadabilityV36Style';
    style.textContent = `
      .lunea-intimacy-category .cat-icon{
        min-width:78px!important;
        min-height:78px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-mark-v36{
        width:78%!important;
        height:78%!important;
        filter:drop-shadow(0 0 7px rgba(239,164,193,.24))!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-mark-v36 .lunea-intimacy-orbit{
        fill:none!important;
        stroke:url(#luneaIntimacyRoseV36)!important;
        stroke-width:2.8!important;
        opacity:.96!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-mark-v36 .orbit-b{opacity:.82!important}
      .lunea-intimacy-category .lunea-intimacy-sector-mark-v36 .lunea-intimacy-star{
        fill:#ffe5dc!important;
        filter:drop-shadow(0 0 5px rgba(239,164,193,.58))!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-mark-v36 .lunea-intimacy-dot{
        fill:#eeb5ca!important;
        opacity:.9!important;
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
        }
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
        .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
          min-height:104px!important;
        }
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
        }
        .lunea-intimacy-category .cat-text h3{font-size:17.5px!important}
        .lunea-intimacy-category .cat-text p{font-size:11.2px!important}
        .lunea-intimacy-category .reading-item{
          padding:14px 54px 14px 14px!important;
        }
        .lunea-intimacy-category .reading-item h4{font-size:15px!important}
        .lunea-intimacy-category .reading-item p{font-size:11.25px!important;line-height:1.55!important}
        .lunea-intimacy-category .reading-item .count{right:10px!important}
      }
      @media(prefers-reduced-motion:reduce){
        .lunea-intimacy-category .lunea-intimacy-sector-mark-v36 *{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon) return;
    if (!$('.lunea-intimacy-sector-mark-v36', icon)) icon.innerHTML = SECTOR_MARK;
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
