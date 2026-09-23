'use strict';

/* LUNEA HOME READABILITY V31
   Home-only visual polish: clearer type hierarchy, more separated sector colors,
   and shorter full-width utility rows. No reading logic, RNG, archive, or AI changes. */
(() => {
  const W = window;
  if (W.__LUNEA_HOME_READABILITY_V31__) return;
  W.__LUNEA_HOME_READABILITY_V31__ = true;

  const STYLE_ID = 'luneaHomeReadabilityV31Style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html.lunea-home-readability-v31 #luneaHomePortalV8{margin-bottom:12px!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .v8-title-row{margin-bottom:12px!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 h2{
        color:#faf8ff!important;font-size:21px!important;font-weight:560!important;letter-spacing:-.35px!important;
        text-shadow:0 0 18px rgba(205,194,244,.06)!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .v8-title-note{
        color:#9296a8!important;font-size:9px!important;letter-spacing:.35px!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-grid{gap:9px!important}

      /* Core 2-column cards: stronger hierarchy without making the page taller. */
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile{
        min-height:116px!important;padding:13px 13px 12px!important;border-radius:21px!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 9px 22px rgba(0,0,0,.16)!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-object{
        width:49px!important;height:49px!important;margin-bottom:10px!important;border-radius:16px!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-label{
        color:#fbfaff!important;font-size:15px!important;font-weight:650!important;line-height:1.12!important;
        letter-spacing:-.05px!important;text-shadow:0 1px 12px rgba(0,0,0,.18)!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-sub{
        margin-top:5px!important;color:#b1b5c5!important;font-size:10.6px!important;font-weight:500!important;
        line-height:1.34!important;letter-spacing:-.08px!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-open{
        color:#a9adbc!important;font-size:18px!important;opacity:.88!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-ai,
      html.lunea-home-readability-v31 #luneaHomePortalV8 [class*="ai-badge"],
      html.lunea-home-readability-v31 #luneaHomePortalV8 [class*="spread-badge"]{
        color:#c8cad7!important;border-color:rgba(210,214,232,.20)!important;background:rgba(255,255,255,.035)!important
      }

      /* Distinct palette: no neighboring sector shares the same dominant hue. */
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="general"]{
        border-color:rgba(130,145,244,.30)!important;
        background:radial-gradient(circle at 13% 5%,rgba(105,115,230,.20),transparent 31%),radial-gradient(circle at 95% 96%,rgba(173,139,241,.08),transparent 36%),linear-gradient(148deg,rgba(24,25,54,.94),rgba(8,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="general"] .lunea-v8-object{border-color:rgba(144,155,248,.36)!important;background:linear-gradient(145deg,rgba(103,114,224,.30),rgba(140,109,205,.15))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="general"] .lunea-v8-open{color:#aeb7ff!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="career"]{
        border-color:rgba(225,176,91,.30)!important;
        background:radial-gradient(circle at 13% 5%,rgba(221,169,82,.18),transparent 31%),radial-gradient(circle at 94% 94%,rgba(87,132,178,.09),transparent 37%),linear-gradient(148deg,rgba(37,31,31,.94),rgba(9,12,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="career"] .lunea-v8-object{border-color:rgba(230,186,105,.35)!important;background:linear-gradient(145deg,rgba(204,151,70,.28),rgba(78,116,164,.15))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="career"] .lunea-v8-open{color:#e4bd7e!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="love"]{
        border-color:rgba(235,128,175,.31)!important;
        background:radial-gradient(circle at 13% 5%,rgba(223,104,159,.20),transparent 31%),radial-gradient(circle at 95% 95%,rgba(157,112,201,.08),transparent 36%),linear-gradient(148deg,rgba(46,23,43,.94),rgba(9,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="love"] .lunea-v8-object{border-color:rgba(241,145,187,.36)!important;background:linear-gradient(145deg,rgba(218,108,160,.29),rgba(134,93,179,.15))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="love"] .lunea-v8-open{color:#ef9fc2!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="stock"]{
        border-color:rgba(70,194,184,.30)!important;
        background:radial-gradient(circle at 13% 5%,rgba(50,171,162,.19),transparent 31%),radial-gradient(circle at 94% 94%,rgba(64,132,181,.08),transparent 36%),linear-gradient(148deg,rgba(17,42,43,.94),rgba(8,11,22,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="stock"] .lunea-v8-object{border-color:rgba(87,208,198,.34)!important;background:linear-gradient(145deg,rgba(53,177,167,.27),rgba(58,116,161,.14))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="stock"] .lunea-v8-open{color:#78d7cf!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="timing"]{
        border-color:rgba(107,145,211,.31)!important;
        background:radial-gradient(circle at 13% 5%,rgba(84,121,191,.20),transparent 31%),radial-gradient(circle at 94% 94%,rgba(137,167,210,.08),transparent 36%),linear-gradient(148deg,rgba(21,31,53,.95),rgba(8,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="timing"] .lunea-v8-object{border-color:rgba(121,158,222,.35)!important;background:linear-gradient(145deg,rgba(79,119,191,.28),rgba(115,145,187,.14))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="timing"] .lunea-v8-open{color:#91afe7!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="horary"]{
        border-color:rgba(144,107,224,.32)!important;
        background:radial-gradient(circle at 13% 5%,rgba(121,82,209,.20),transparent 31%),radial-gradient(circle at 94% 94%,rgba(86,125,193,.08),transparent 36%),linear-gradient(148deg,rgba(34,24,55,.95),rgba(8,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="horary"] .lunea-v8-object{border-color:rgba(157,121,231,.36)!important;background:linear-gradient(145deg,rgba(126,85,211,.28),rgba(74,108,172,.14))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="horary"] .lunea-v8-open{color:#b198f0!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]{
        border-color:rgba(52,160,169,.34)!important;
        background:radial-gradient(circle at 13% 5%,rgba(37,139,149,.22),transparent 31%),radial-gradient(circle at 94% 94%,rgba(116,105,177,.07),transparent 36%),linear-gradient(148deg,rgba(12,42,46,.96),rgba(8,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"] .lunea-v8-object{border-color:rgba(77,180,188,.38)!important;background:linear-gradient(145deg,rgba(33,145,154,.29),rgba(101,88,160,.13))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"] .lunea-v8-open{color:#76c7cc!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile{
        grid-column:auto!important;min-height:116px!important;padding:13px!important;border-radius:21px!important;
        border-color:rgba(219,169,76,.34)!important;
        background:radial-gradient(circle at 13% 5%,rgba(205,151,61,.20),transparent 31%),radial-gradient(circle at 94% 94%,rgba(130,82,175,.09),transparent 36%),linear-gradient(148deg,rgba(42,33,39,.95),rgba(9,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{border-color:rgba(228,184,100,.38)!important;background:linear-gradient(145deg,rgba(196,145,53,.27),rgba(119,74,164,.15))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{color:#fbf7ef!important;font-size:15px!important;line-height:1.12!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{color:#b8b2c1!important;font-size:10.4px!important;line-height:1.35!important;margin-top:5px!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{color:#e0b766!important}

      /* Full-width secondary tools: shorter and visually quieter than primary 2-column sectors. */
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{
        min-height:80px!important;padding:10px 15px!important;grid-template-columns:54px minmax(0,1fr) 22px!important;
        column-gap:10px!important;border-radius:20px!important;border-color:rgba(80,170,124,.30)!important;
        background:radial-gradient(circle at 8% 18%,rgba(62,155,109,.20),transparent 28%),radial-gradient(circle at 93% 82%,rgba(102,103,166,.06),transparent 34%),linear-gradient(145deg,rgba(14,43,35,.96),rgba(8,10,23,.99))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-object{width:48px!important;height:48px!important;border-color:rgba(103,189,144,.35)!important;background:linear-gradient(145deg,rgba(59,156,108,.27),rgba(81,82,144,.12))!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-label{font-size:14.5px!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-sub{margin-top:3px!important;font-size:10.2px!important;color:#b5c2bb!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-open{color:#84c69e!important}

      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{
        min-height:88px!important;padding:11px 14px!important;grid-template-columns:54px minmax(0,1fr) 22px!important;
        column-gap:11px!important;border-radius:20px!important;border-color:rgba(211,79,132,.36)!important;
        background:radial-gradient(circle at 9% 18%,rgba(194,46,105,.24),transparent 30%),radial-gradient(circle at 92% 8%,rgba(117,35,83,.15),transparent 36%),linear-gradient(145deg,rgba(79,14,45,.97),rgba(45,11,34,.98) 50%,rgba(19,9,26,.995))!important
      }
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{width:52px!important;height:52px!important;border-color:rgba(231,115,160,.40)!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-label{font-size:14.5px!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-sub{font-size:10.2px!important;line-height:1.3!important;color:#d6b7c4!important}
      html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-open{color:#e48bad!important}

      /* SIGNAL · MESSAGE is a category row rather than a V8 tile; align it with the compact utility rows. */
      html.lunea-home-readability-v31 #luneaSignalMessageSection{
        margin-top:9px!important;border-radius:20px!important;border-color:rgba(214,181,106,.28)!important;
        background:radial-gradient(circle at 9% 15%,rgba(190,145,58,.12),transparent 28%),radial-gradient(circle at 90% 85%,rgba(93,91,147,.055),transparent 34%),linear-gradient(145deg,rgba(26,25,37,.96),rgba(8,10,21,.99))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 9px 22px rgba(0,0,0,.14)!important
      }
      html.lunea-home-readability-v31 #luneaSignalMessageSection .category-header{min-height:84px!important;padding:12px 15px!important}
      html.lunea-home-readability-v31 #luneaSignalMessageSection .message-oracle-home-logo{width:50px!important;height:50px!important;flex-basis:50px!important}
      html.lunea-home-readability-v31 #luneaSignalMessageSection .cat-left{gap:11px!important}
      html.lunea-home-readability-v31 #luneaSignalMessageSection .cat-text h3{color:#faf7ef!important;font-size:14.5px!important;line-height:1.15!important}
      html.lunea-home-readability-v31 #luneaSignalMessageSection .cat-text p{color:#c4bda9!important;font-size:10.4px!important;line-height:1.25!important;margin-top:4px!important}
      html.lunea-home-readability-v31 #luneaSignalMessageSection .message-oracle-home-contexts{color:#999aaa!important;font-size:9.8px!important;line-height:1.3!important;margin-top:3px!important}
      html.lunea-home-readability-v31 #luneaSignalMessageSection .toggle{color:#d8b66d!important;font-size:18px!important}

      @media(max-width:390px){
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-grid{gap:8px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile{min-height:112px!important;padding:12px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-object{width:46px!important;height:46px!important;margin-bottom:9px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-label{font-size:14.2px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-sub{font-size:10.1px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:112px!important;padding:12px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{min-height:76px!important;padding:9px 13px!important}
        html.lunea-home-readability-v31 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{min-height:84px!important;padding:10px 13px!important}
        html.lunea-home-readability-v31 #luneaSignalMessageSection .category-header{min-height:80px!important;padding:11px 13px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function apply() {
    document.documentElement.classList.add('lunea-home-readability-v31');
    installStyle();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  W.addEventListener('pageshow', () => setTimeout(apply, 80), {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(apply, 80); });

  W.LUNEA_HOME_READABILITY_V31 = Object.freeze({version:31, apply});
})();
