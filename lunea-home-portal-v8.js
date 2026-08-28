'use strict';

/*
  LUNEA HOME PORTAL V8
  ====================
  Home-only visual/navigation redesign inspired by LUNEA's pearl / opal /
  celestial-object identity. Existing category nodes and their handlers remain
  the source of truth; this module only adds launcher tiles and shows the real
  category panel after a tile is chosen.

  No draw, RNG, spread, archive, Horary, Timing, profile or AI logic changes.
  No broad DOM MutationObserver: installation uses a few bounded retries only.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HOME_PORTAL_V8__) return;
  W.__LUNEA_HOME_PORTAL_V8__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICONS = {
    general: svg('<path d="M12 2.8c.55 4.65 2.55 6.65 7.2 7.2-4.65.55-6.65 2.55-7.2 7.2-.55-4.65-2.55-6.65-7.2-7.2 4.65-.55 6.65-2.55 7.2-7.2Z"/><path d="M19 16.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z"/>'),
    career: svg('<path d="M4 20h16"/><path d="M6 17V9h12v8"/><path d="M8 17v-6M12 17v-6M16 17v-6"/><path d="M4 9h16L12 4 4 9Z"/>'),
    love: svg('<path d="M20.4 4.6a5.2 5.2 0 0 0-7.4 0L12 5.7l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 20.5l8.4-8.5a5.2 5.2 0 0 0 0-7.4Z"/>'),
    stock: svg('<path d="M4 18V6"/><path d="M4 18h16"/><path d="m7 15 4-5 3 3 5-7"/><path d="M16 6h3v3"/>'),
    timing: svg('<circle cx="12" cy="12" r="8.4"/><path d="M12 5.5v6.5l4 2.3"/><path d="M5.8 5.8 4.4 4.4M18.2 5.8l1.4-1.4"/>'),
    horary: svg('<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="9" ry="4.1"/><ellipse cx="12" cy="12" rx="4.1" ry="9" transform="rotate(45 12 12)"/>')
  };

  const META = [
    {key:'general', match:/GENERAL|AI CUSTOM/i, title:'GENERAL & AI', sub:'자유 질문 · AI 맞춤 배열'},
    {key:'career', match:/CAREER|EXAM/i, title:'CAREER & EXAM', sub:'시험 · 직장 · 진로 · 금전'},
    {key:'love', match:/LOVE|INNER HEART/i, title:'LOVE & HEART', sub:'속마음 · 연락 · 재회 · 관계'},
    {key:'stock', match:/STOCK|TRADING/i, title:'STOCK & TRADING', sub:'매수 · 보유 · 익절 · 매도'},
    {key:'timing', match:/TIMING ORACLE/i, title:'TIMING ORACLE', sub:'시기 · 시간대 · 계절 · 지연'},
    {key:'horary', match:/HORARY/i, title:'HORARY', sub:'성사 · 상황 · 리셉션 · 타이밍'}
  ];

  function addStyles(){
    if ($('#luneaHomePortalV8Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHomePortalV8Style';
    style.textContent = `
      html.lunea-home-portal-v8 .app{position:relative}

      /* Pearl-light accent under the utility header: keeps the dark identity
         but borrows the opal / crystal mood from the new icon references. */
      html.lunea-home-portal-v8 header::after{
        content:'';position:absolute;left:5%;right:5%;bottom:-13px;height:1px;pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(227,214,255,.16),rgba(183,225,235,.13),rgba(255,222,231,.10),transparent);
        filter:blur(.2px)
      }
      html.lunea-home-portal-v8 header{position:relative}

      /* DAILY becomes the home's visual relic / hero instead of a generic panel. */
      html.lunea-home-portal-v8 .daily{
        position:relative!important;display:block!important;overflow:hidden!important;
        min-height:154px!important;padding:20px 124px 20px 20px!important;margin-bottom:26px!important;
        border-radius:30px!important;
        background:
          radial-gradient(circle at 76% 18%,rgba(233,212,255,.20),transparent 24%),
          radial-gradient(circle at 95% 68%,rgba(155,227,231,.11),transparent 30%),
          radial-gradient(circle at 16% 100%,rgba(255,206,220,.065),transparent 35%),
          linear-gradient(142deg,rgba(42,34,75,.86),rgba(14,17,35,.95) 58%,rgba(7,10,23,.98))!important;
        border-color:rgba(231,233,245,.19)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 22px 48px rgba(0,0,0,.26),0 0 38px rgba(134,108,202,.07)!important;
      }
      html.lunea-home-portal-v8 .daily::before{
        content:''!important;position:absolute!important;inset:auto -48px -88px auto!important;width:230px!important;height:230px!important;border-radius:50%!important;
        background:radial-gradient(circle,rgba(201,188,240,.13),rgba(111,157,194,.05) 46%,transparent 70%)!important;
        pointer-events:none
      }
      html.lunea-home-portal-v8 .daily::after{display:none!important}
      html.lunea-home-portal-v8 .daily h3{position:relative;z-index:4;font-size:19px!important;margin:0 0 8px!important}
      html.lunea-home-portal-v8 .daily p{position:relative;z-index:4;margin:0!important;font-size:10px!important;line-height:1.65!important;color:#a4a4b7!important}
      html.lunea-home-portal-v8 .daily .primary{
        position:absolute!important;z-index:5;right:18px!important;bottom:16px!important;min-width:104px!important;
        padding:11px 13px!important;border-radius:16px!important;
        color:#28203f!important;font-weight:750!important;
        background:linear-gradient(115deg,rgba(247,239,255,.96),rgba(210,191,248,.94) 43%,rgba(174,217,232,.91) 72%,rgba(246,214,226,.90))!important;
        border:1px solid rgba(255,255,255,.38)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.60),0 9px 25px rgba(106,83,167,.26),0 0 24px rgba(207,188,247,.10)!important;
      }

      .lunea-daily-relic-v8{
        position:absolute;z-index:2;right:20px;top:12px;width:88px;height:101px;pointer-events:none;
        filter:drop-shadow(0 12px 20px rgba(0,0,0,.28)) drop-shadow(0 0 14px rgba(207,190,249,.11));
      }
      .lunea-daily-relic-v8 .v8-arch{
        position:absolute;inset:0;border-radius:45px 45px 22px 22px;
        border:1px solid rgba(235,236,247,.24);
        background:
          radial-gradient(circle at 50% 18%,rgba(255,255,255,.25),transparent 17%),
          linear-gradient(155deg,rgba(238,229,255,.15),rgba(135,168,211,.07) 48%,rgba(255,218,231,.05));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 0 22px rgba(217,204,250,.07)
      }
      .lunea-daily-relic-v8 .v8-pearl{
        position:absolute;left:50%;top:5px;transform:translateX(-50%);width:16px;height:16px;border-radius:50%;
        background:radial-gradient(circle at 34% 28%,#fff 0 12%,#ebe5f6 27%,#c9c6dc 58%,#8f8aa7 100%);
        box-shadow:0 0 13px rgba(235,225,255,.33),0 0 0 2px rgba(220,214,239,.12)
      }
      .lunea-daily-relic-v8 .v8-card{
        position:absolute;left:50%;top:28px;width:43px;height:61px;transform:translateX(-50%) rotate(-5deg);border-radius:8px;
        border:1px solid rgba(244,245,251,.45);
        background:
          radial-gradient(circle at 30% 18%,rgba(255,255,255,.46),transparent 18%),
          linear-gradient(150deg,rgba(235,228,252,.94),rgba(190,211,232,.82) 48%,rgba(206,184,233,.82));
        box-shadow:inset 0 0 0 3px rgba(255,255,255,.15),0 7px 15px rgba(0,0,0,.18)
      }
      .lunea-daily-relic-v8 .v8-card::before{
        content:'';position:absolute;left:50%;top:50%;width:22px;height:22px;transform:translate(-50%,-53%);border-radius:50%;
        border:1px solid rgba(113,100,155,.35);box-shadow:0 0 0 5px rgba(255,255,255,.10)
      }
      .lunea-daily-relic-v8 .v8-card::after{
        content:'☾';position:absolute;inset:0;display:grid;place-items:center;color:rgba(75,65,112,.70);font-size:17px;text-shadow:0 0 9px rgba(255,255,255,.55)
      }
      .lunea-daily-relic-v8 .v8-crystal{
        position:absolute;left:50%;bottom:2px;width:18px;height:12px;transform:translateX(-50%) rotate(45deg);
        border:1px solid rgba(255,255,255,.34);border-radius:2px;
        background:linear-gradient(135deg,rgba(246,232,255,.86),rgba(164,226,232,.72),rgba(248,211,224,.72));
        box-shadow:0 0 12px rgba(203,197,244,.25)
      }

      /* Hide the old list overview; the real category nodes are shown only when
         a portal tile is opened, so their original click handlers stay intact. */
      html.lunea-home-portal-v8 .category.lunea-v8-source-category{display:none!important}
      html.lunea-home-portal-v8 .category.lunea-v8-source-category.lunea-v8-source-active{
        display:block!important;margin:13px 0 18px!important;border-radius:24px!important;
        animation:luneaV8PanelIn .28s ease both
      }
      @keyframes luneaV8PanelIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

      #luneaHomePortalV8{margin:2px 0 15px}
      #luneaHomePortalV8 .v8-eyebrow{
        color:#b9afcf;font:700 8.5px/1 'Cinzel',serif;letter-spacing:2.6px;margin:0 0 7px
      }
      #luneaHomePortalV8 .v8-title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:14px}
      #luneaHomePortalV8 h2{margin:0;color:#f5f3fa;font:500 20px/1.2 'Noto Serif KR',serif;letter-spacing:-.3px}
      #luneaHomePortalV8 .v8-title-note{color:#77798d;font-size:8.5px;white-space:nowrap;padding-bottom:2px}
      .lunea-v8-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .lunea-v8-tile{
        position:relative;overflow:hidden;min-height:122px;padding:13px 12px 12px;border-radius:23px;text-align:left;appearance:none;
        color:#f4f4fa;border:1px solid rgba(226,229,242,.13);
        background:
          radial-gradient(circle at 14% 6%,rgba(225,212,255,.10),transparent 26%),
          radial-gradient(circle at 92% 96%,rgba(144,207,220,.055),transparent 34%),
          linear-gradient(148deg,rgba(20,22,42,.85),rgba(8,10,23,.96));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 10px 26px rgba(0,0,0,.14);
        -webkit-tap-highlight-color:transparent
      }
      .lunea-v8-tile::after{
        content:'';position:absolute;left:12px;right:12px;top:0;height:1px;pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(235,232,249,.21),rgba(192,223,235,.10),transparent)
      }
      .lunea-v8-tile:active{transform:scale(.985)}
      .lunea-v8-tile[aria-pressed="true"]{border-color:rgba(214,202,246,.27);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 0 1px rgba(174,152,226,.06),0 12px 30px rgba(0,0,0,.16)}
      .lunea-v8-object{
        width:46px;height:46px;border-radius:16px;display:grid;place-items:center;margin-bottom:12px;color:#f6f4fb;
        border:1px solid rgba(236,238,247,.22);
        background:
          radial-gradient(circle at 32% 23%,rgba(255,255,255,.43),transparent 20%),
          radial-gradient(circle at 73% 73%,rgba(154,218,228,.14),transparent 37%),
          linear-gradient(145deg,rgba(224,208,248,.25),rgba(119,104,176,.17) 54%,rgba(245,210,225,.09));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.20),inset 0 0 15px rgba(255,255,255,.035),0 6px 17px rgba(0,0,0,.16),0 0 17px rgba(181,155,232,.07)
      }
      .lunea-v8-object svg{width:23px;height:23px;filter:drop-shadow(0 0 7px rgba(224,215,250,.20))}
      .lunea-v8-tile[data-key="love"] .lunea-v8-object{background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.42),transparent 20%),linear-gradient(145deg,rgba(236,205,228,.21),rgba(151,114,186,.16),rgba(199,170,233,.15))}
      .lunea-v8-tile[data-key="timing"] .lunea-v8-object{background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.45),transparent 20%),linear-gradient(145deg,rgba(195,230,237,.20),rgba(116,157,194,.14),rgba(189,168,225,.15))}
      .lunea-v8-tile[data-key="stock"] .lunea-v8-object{background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.40),transparent 20%),linear-gradient(145deg,rgba(188,222,230,.16),rgba(100,144,178,.14),rgba(177,159,219,.12))}
      .lunea-v8-label{display:block;color:#f2f1f7;font:600 11.8px/1.2 'Cinzel','Pretendard',sans-serif;letter-spacing:.25px;margin-bottom:5px}
      .lunea-v8-sub{display:block;color:#85869a;font-size:8.9px;line-height:1.45;word-break:keep-all}
      .lunea-v8-open{position:absolute;right:12px;top:14px;color:#77798d;font-size:15px;font-weight:300}

      html.lunea-home-portal-v8 .lunea-v8-old-heading{display:none!important}

      @media(max-width:390px){
        html.lunea-home-portal-v8 .daily{min-height:148px!important;padding-right:114px!important}
        .lunea-daily-relic-v8{right:16px;width:82px;height:96px}
        .lunea-v8-grid{gap:9px}
        .lunea-v8-tile{min-height:116px;padding:12px 11px}
        .lunea-v8-object{width:43px;height:43px;border-radius:15px;margin-bottom:10px}
        .lunea-v8-label{font-size:10.8px}
        .lunea-v8-sub{font-size:8.4px}
      }

      @media(prefers-reduced-motion:reduce){
        html.lunea-home-portal-v8 .category.lunea-v8-source-category.lunea-v8-source-active{animation:none}
        .lunea-v8-tile:active{transform:none}
      }
    `;
    document.head.appendChild(style);
  }

  function categoryTitle(cat){
    return cat?.querySelector('.cat-text h3,h3')?.textContent?.trim() || '';
  }

  function categoryFor(meta){
    return $$('.category').find(cat => meta.match.test(categoryTitle(cat))) || null;
  }

  function hideOldHeading(){
    const eyebrow = $$('.eyebrow').find(el => /CHOOSE A READING/i.test(el.textContent || ''));
    if (eyebrow) eyebrow.classList.add('lunea-v8-old-heading');
    const title = $$('h1,h2,h3').find(el => /탐색할 스프레드/.test(el.textContent || ''));
    if (title) title.classList.add('lunea-v8-old-heading');
  }

  function ensureDailyRelic(){
    const daily = $('.daily');
    if (!daily || $('.lunea-daily-relic-v8', daily)) return;
    const relic = document.createElement('div');
    relic.className = 'lunea-daily-relic-v8';
    relic.setAttribute('aria-hidden','true');
    relic.innerHTML = '<div class="v8-arch"></div><div class="v8-pearl"></div><div class="v8-card"></div><div class="v8-crystal"></div>';
    daily.appendChild(relic);
  }

  function ensurePortal(){
    let portal = $('#luneaHomePortalV8');
    if (portal) return portal;
    const firstCat = $('.category');
    if (!firstCat?.parentElement) return null;
    portal = document.createElement('section');
    portal.id = 'luneaHomePortalV8';
    portal.innerHTML = `
      <div class="v8-eyebrow">CELESTIAL READING CABINET</div>
      <div class="v8-title-row"><h2>오늘 열어볼 리딩</h2><span class="v8-title-note">6 ORACLES</span></div>
      <div class="lunea-v8-grid" role="navigation" aria-label="LUNEA 리딩 카테고리"></div>`;
    firstCat.parentElement.insertBefore(portal, firstCat);
    return portal;
  }

  function openSource(meta, cat, tile){
    const all = $$('.category.lunea-v8-source-category');
    all.forEach(c => c.classList.toggle('lunea-v8-source-active', c === cat));
    $$('.lunea-v8-tile').forEach(btn => btn.setAttribute('aria-pressed', btn === tile ? 'true' : 'false'));

    const toggle = cat.querySelector('.toggle');
    const header = cat.querySelector('.category-header');
    const looksClosed = !toggle || toggle.textContent.trim() === '+';
    if (header && looksClosed) header.click();

    setTimeout(() => cat.scrollIntoView({behavior:'smooth',block:'start'}), 90);
  }

  function ensureTile(grid, meta, cat){
    let tile = grid.querySelector(`.lunea-v8-tile[data-key="${meta.key}"]`);
    if (tile) return tile;
    cat.classList.add('lunea-v8-source-category');
    tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'lunea-v8-tile';
    tile.dataset.key = meta.key;
    tile.setAttribute('aria-pressed','false');
    tile.innerHTML = `<span class="lunea-v8-object">${ICONS[meta.key]}</span><span class="lunea-v8-label">${meta.title}</span><span class="lunea-v8-sub">${meta.sub}</span><span class="lunea-v8-open">＋</span>`;
    tile.addEventListener('click', () => openSource(meta, cat, tile));
    grid.appendChild(tile);
    return tile;
  }

  function refresh(){
    const portal = ensurePortal();
    if (!portal) return false;
    const grid = $('.lunea-v8-grid', portal);
    if (!grid) return false;
    META.forEach(meta => {
      const cat = categoryFor(meta);
      if (cat) ensureTile(grid, meta, cat);
    });
    const count = grid.querySelectorAll('.lunea-v8-tile').length;
    const note = $('.v8-title-note', portal);
    if (note) note.textContent = count ? `${count} ORACLES` : 'ORACLE CABINET';
    hideOldHeading();
    ensureDailyRelic();
    return count >= 4;
  }

  function boot(){
    document.documentElement.classList.add('lunea-home-portal-v8');
    addStyles();
    refresh();
    [220,650,1250,2200,3600].forEach(ms => setTimeout(refresh, ms));
    W.addEventListener('pageshow', () => setTimeout(refresh,80));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(refresh,80); });
    console.info('🌙 LUNEA Home Portal V8 loaded · celestial object cabinet');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
