'use strict';

/* LUNEA SECTOR COLOR SYSTEM V28
   UI-only sector tint layer. Keeps LUNEA's dark opal base while giving each
   reading family a subtle, continuous color identity across home tile,
   question sheet, AI preview, and final reading. */
(() => {
  const W = window;
  if (W.__LUNEA_SECTOR_COLOR_SYSTEM_V28__) return;
  W.__LUNEA_SECTOR_COLOR_SYSTEM_V28__ = true;

  const $ = id => document.getElementById(id);
  const SECTORS = ['general','career','love','stock','timing','horary','daily','thai','intimacy'];

  function normalize(raw='') {
    const s = String(raw || '').trim().toLowerCase();
    if (/daily|orbit/.test(s)) return 'daily';
    if (/thai|taksa|태국/.test(s)) return 'thai';
    if (/horary|호라리/.test(s)) return 'horary';
    if (/timing|타이밍|시기/.test(s)) return 'timing';
    if (/stock|trading|주식|매수|매도/.test(s)) return 'stock';
    if (/intimacy|속궁합|친밀감|신체적\s*궁합|성적\s*(?:궁합|끌림)/.test(s)) return 'intimacy';
    if (/love|heart|연애|재회|관계|속마음/.test(s)) return 'love';
    if (/career|exam|직장|시험|진로|취업/.test(s)) return 'career';
    if (/general|ai|자유/.test(s)) return 'general';
    return '';
  }

  function stateSector() {
    try {
      const s = normalize(state?.category);
      if (s) return s;
    } catch {}
    return normalize($('sheetCat')?.textContent || $('spreadType')?.textContent || '');
  }

  function setSector(el, sector) {
    if (!el) return;
    const s = SECTORS.includes(sector) ? sector : 'general';
    if (el.dataset.luneaSector !== s) el.dataset.luneaSector = s;
  }

  function categorySector(cat) {
    const text = [cat?.querySelector('.cat-text h3')?.textContent,cat?.querySelector('.category-header')?.textContent,cat?.textContent].filter(Boolean).join(' ');
    return normalize(text) || 'general';
  }

  function decorateHome() {
    document.querySelectorAll('.lunea-v8-tile[data-key]').forEach(tile => setSector(tile, normalize(tile.dataset.key)));
    const thai = $('luneaThaiHomeTileV24'); if (thai) setSector(thai, 'thai');
    const daily = document.querySelector('.daily'); if (daily) setSector(daily, 'daily');
    document.querySelectorAll('.category').forEach(cat => {
      const sector = categorySector(cat); setSector(cat, sector);
      cat.querySelectorAll('.spread-item,.spread,.spread-row,[data-cat]').forEach(item => setSector(item, normalize(item.dataset?.cat || '') || sector));
    });
  }

  function decorateReadingFlow() {
    let sector = stateSector() || 'general';
    const spread = $('spreadOverlay');
    if (spread?.dataset?.dailyOrbit) sector = 'daily';
    setSector($('sheet'), sector);
    setSector($('luneaSpreadPreviewOverlay'), sector);
    setSector($('luneaV20PreviewOverlay'), sector);
    setSector(spread, sector);
    setSector($('luneaManualPanel'), sector);
    setSector($('luneaThaiStandaloneOverlay'), 'thai');
  }

  function addStyles() {
    if ($('luneaSectorColorSystemV28Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaSectorColorSystemV28Style';
    style.textContent = `
      [data-lunea-sector]{--sec-rgb:139,229,218;--sec2-rgb:197,181,255;--sec-text:#dffcf7;--sec-soft:rgba(var(--sec-rgb),.12);--sec-line:rgba(var(--sec-rgb),.25);--sec-glow:rgba(var(--sec-rgb),.12)}
      [data-lunea-sector="general"]{--sec-rgb:132,234,220;--sec2-rgb:198,179,255;--sec-text:#dffcf7}
      [data-lunea-sector="career"]{--sec-rgb:241,201,126;--sec2-rgb:104,154,219;--sec-text:#ffedc5}
      [data-lunea-sector="love"]{--sec-rgb:255,145,191;--sec2-rgb:190,153,242;--sec-text:#ffdceb}
      [data-lunea-sector="intimacy"]{--sec-rgb:211,91,139;--sec2-rgb:119,41,82;--sec-text:#ffe6ef}
      [data-lunea-sector="stock"]{--sec-rgb:95,224,211;--sec2-rgb:105,181,238;--sec-text:#d8fffa}
      [data-lunea-sector="timing"]{--sec-rgb:192,171,255;--sec2-rgb:185,215,238;--sec-text:#eee7ff}
      [data-lunea-sector="horary"]{--sec-rgb:104,197,219;--sec2-rgb:125,116,225;--sec-text:#dcf8ff}
      [data-lunea-sector="daily"]{--sec-rgb:198,185,255;--sec2-rgb:154,204,235;--sec-text:#eee9ff}
      [data-lunea-sector="thai"]{--sec-rgb:237,186,104;--sec2-rgb:177,121,218;--sec-text:#ffe7b8}

      .lunea-v8-tile[data-lunea-sector]{border-color:rgba(var(--sec-rgb),.20)!important;background:radial-gradient(circle at 13% 4%,rgba(var(--sec-rgb),.15),transparent 29%),radial-gradient(circle at 96% 96%,rgba(var(--sec2-rgb),.08),transparent 36%),linear-gradient(148deg,rgba(20,22,42,.87),rgba(8,10,23,.97))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 11px 28px rgba(0,0,0,.15),0 0 20px rgba(var(--sec-rgb),.025)!important}
      .lunea-v8-tile[data-lunea-sector]::after{background:linear-gradient(90deg,transparent,rgba(var(--sec-rgb),.38),rgba(var(--sec2-rgb),.18),transparent)!important}
      .lunea-v8-tile[data-lunea-sector] .lunea-v8-object{color:var(--sec-text)!important;border-color:rgba(var(--sec-rgb),.31)!important;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.34),transparent 19%),radial-gradient(circle at 74% 78%,rgba(var(--sec2-rgb),.18),transparent 38%),linear-gradient(145deg,rgba(var(--sec-rgb),.22),rgba(var(--sec2-rgb),.12))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 0 20px rgba(var(--sec-rgb),.08)!important}
      .lunea-v8-tile[data-lunea-sector] h3,.lunea-v8-tile[data-lunea-sector] b{color:#fbfaff!important}
      .lunea-v8-tile[data-lunea-sector][aria-pressed="true"]{border-color:rgba(var(--sec-rgb),.42)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1px rgba(var(--sec-rgb),.07),0 14px 34px rgba(0,0,0,.18),0 0 28px rgba(var(--sec-rgb),.08)!important}

      .category.lunea-v8-source-active[data-lunea-sector]{position:relative!important;overflow:hidden!important;border-color:rgba(var(--sec-rgb),.24)!important;background:radial-gradient(circle at 7% 0%,rgba(var(--sec-rgb),.12),transparent 31%),radial-gradient(circle at 100% 100%,rgba(var(--sec2-rgb),.06),transparent 38%),linear-gradient(155deg,rgba(18,20,36,.91),rgba(10,12,25,.97))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 13px 30px rgba(0,0,0,.14)!important}
      .category.lunea-v8-source-active[data-lunea-sector]::before{content:'';position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 5px 5px 0;background:linear-gradient(180deg,rgba(var(--sec-rgb),.9),rgba(var(--sec2-rgb),.55));box-shadow:0 0 15px rgba(var(--sec-rgb),.2)}
      .category.lunea-v8-source-active[data-lunea-sector] .category-header,.category.lunea-v8-source-active[data-lunea-sector] .cat-text h3{color:var(--sec-text)!important}

      #sheet[data-lunea-sector]{border-top-color:rgba(var(--sec-rgb),.30)!important;background:radial-gradient(circle at 8% 0%,rgba(var(--sec-rgb),.16),transparent 29%),radial-gradient(circle at 100% 12%,rgba(var(--sec2-rgb),.08),transparent 31%),linear-gradient(175deg,#111523 0%,#0b0d18 72%)!important;box-shadow:0 -24px 65px rgba(0,0,0,.62),0 -2px 28px rgba(var(--sec-rgb),.045)!important}
      #sheet[data-lunea-sector] .sub,#sheet[data-lunea-sector] #sheetCat{color:var(--sec-text)!important}
      #sheet[data-lunea-sector] .sheet-title{text-shadow:0 0 18px rgba(var(--sec-rgb),.10)!important}
      #sheet[data-lunea-sector] textarea,#sheet[data-lunea-sector] input{border-color:rgba(var(--sec-rgb),.20)!important;background:rgba(6,10,18,.67)!important}
      #sheet[data-lunea-sector] textarea:focus,#sheet[data-lunea-sector] input:focus{border-color:rgba(var(--sec-rgb),.56)!important;box-shadow:0 0 0 3px rgba(var(--sec-rgb),.07)!important}
      #sheet[data-lunea-sector] .radio-box.selected{border-color:rgba(var(--sec-rgb),.42)!important;background:linear-gradient(145deg,rgba(var(--sec-rgb),.12),rgba(var(--sec2-rgb),.055))!important}
      #sheet[data-lunea-sector] #drawBtn{border-color:rgba(var(--sec-rgb),.34)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 10px 28px rgba(var(--sec-rgb),.09)!important}

      #luneaSpreadPreviewOverlay[data-lunea-sector] #luneaSpreadPreviewModal,#luneaV20PreviewOverlay[data-lunea-sector] #luneaV20PreviewModal{border-color:rgba(var(--sec-rgb),.30)!important;background:radial-gradient(circle at 8% 0%,rgba(var(--sec-rgb),.16),transparent 31%),radial-gradient(circle at 100% 0%,rgba(var(--sec2-rgb),.08),transparent 29%),linear-gradient(165deg,#121624,#100e1b)!important;box-shadow:0 26px 70px rgba(0,0,0,.72),0 0 30px rgba(var(--sec-rgb),.06)!important}
      #luneaSpreadPreviewOverlay[data-lunea-sector] .lsp-kicker,#luneaV20PreviewOverlay[data-lunea-sector] .v20-kicker,#luneaV20PreviewOverlay[data-lunea-sector] .sub{color:var(--sec-text)!important}
      #luneaSpreadPreviewOverlay[data-lunea-sector] textarea,#luneaSpreadPreviewOverlay[data-lunea-sector] input,#luneaV20PreviewOverlay[data-lunea-sector] textarea,#luneaV20PreviewOverlay[data-lunea-sector] input{border-color:rgba(var(--sec-rgb),.18)!important}

      #spreadOverlay[data-lunea-sector] .modal{border-color:rgba(var(--sec-rgb),.24)!important;background:radial-gradient(circle at 7% 0%,rgba(var(--sec-rgb),.115),transparent 28%),radial-gradient(circle at 100% 1%,rgba(var(--sec2-rgb),.055),transparent 27%),linear-gradient(165deg,rgba(17,19,34,.985),rgba(7,9,18,.995))!important;box-shadow:0 28px 76px rgba(0,0,0,.73),0 0 32px rgba(var(--sec-rgb),.045)!important}
      #spreadOverlay[data-lunea-sector] #spreadType{color:var(--sec-text)!important}
      #spreadOverlay[data-lunea-sector] #spreadType::after{content:'';display:inline-block;width:26px;height:1px;margin-left:8px;vertical-align:middle;background:linear-gradient(90deg,rgba(var(--sec-rgb),.8),transparent);box-shadow:0 0 9px rgba(var(--sec-rgb),.22)}
      #spreadOverlay[data-lunea-sector] #spreadQuestion{text-shadow:0 0 18px rgba(var(--sec-rgb),.065)!important}
      #spreadOverlay[data-lunea-sector] #luneaV27CompactControls button{border-color:rgba(var(--sec-rgb),.20)!important;background:linear-gradient(145deg,rgba(var(--sec-rgb),.085),rgba(var(--sec2-rgb),.045))!important}
      #spreadOverlay[data-lunea-sector] #luneaV27QuestionToggle::before{color:rgb(var(--sec-rgb))!important}
      #spreadOverlay[data-lunea-sector] .actionbar{border-color:rgba(var(--sec-rgb),.13)!important;background:linear-gradient(145deg,rgba(var(--sec-rgb),.035),rgba(255,255,255,.018))!important}

      .daily[data-lunea-sector="daily"]{border-color:rgba(var(--sec-rgb),.28)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 22px 48px rgba(0,0,0,.26),0 0 38px rgba(var(--sec-rgb),.075)!important}
      #luneaThaiStandaloneOverlay[data-lunea-sector="thai"] #luneaThaiStandaloneModal{border-color:rgba(var(--sec-rgb),.30)!important;box-shadow:0 28px 75px rgba(0,0,0,.74),0 0 34px rgba(var(--sec-rgb),.065)!important}
      @media(max-width:390px){.lunea-v8-tile[data-lunea-sector]{min-height:120px}#sheet[data-lunea-sector]{padding-bottom:calc(18px + env(safe-area-inset-bottom))!important}}
    `;
    document.head.appendChild(style);
  }

  function installObservers() {
    const targets = [$('sheet'),$('spreadOverlay'),$('luneaSpreadPreviewOverlay'),$('luneaV20PreviewOverlay'),$('luneaThaiStandaloneOverlay'),document.querySelector('#luneaHomePortalV8')].filter(Boolean);
    targets.forEach(el => {
      if (el.__luneaSectorV28Observed) return;
      el.__luneaSectorV28Observed = true;
      new MutationObserver(() => requestAnimationFrame(refresh)).observe(el,{attributes:true,attributeFilter:['class','aria-hidden','data-daily-orbit'],childList:true,subtree:false});
    });
    const sheetCat = $('sheetCat');
    if (sheetCat && !sheetCat.__luneaSectorV28Observed) { sheetCat.__luneaSectorV28Observed = true; new MutationObserver(() => requestAnimationFrame(refresh)).observe(sheetCat,{childList:true,characterData:true,subtree:true}); }
    const spreadType = $('spreadType');
    if (spreadType && !spreadType.__luneaSectorV28Observed) { spreadType.__luneaSectorV28Observed = true; new MutationObserver(() => requestAnimationFrame(refresh)).observe(spreadType,{childList:true,characterData:true,subtree:true}); }
  }

  function refresh() { decorateHome(); decorateReadingFlow(); installObservers(); }

  function boot() {
    addStyles(); refresh();
    let tries = 0;
    const timer = setInterval(() => { tries += 1; refresh(); if ((document.querySelector('.lunea-v8-tile') && $('sheet') && $('spreadOverlay')) || tries > 160) clearInterval(timer); },90);
    W.addEventListener('click', () => setTimeout(refresh,0), true);
    console.info('🎨 LUNEA Sector Color System V28 active · subtle palette continuity across reading flow');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();