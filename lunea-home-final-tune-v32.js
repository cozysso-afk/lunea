'use strict';

/* LUNEA HOME FINAL TUNE V32
   Screenshot-driven Home-only micro polish.
   - keeps MEIHUA / INTIMACY compact at the current size
   - moves AI SPREAD chips away from subtitles
   - separates CAREER amber from THAI violet-gold
   - slightly improves subtitle contrast and compact rhythm
   No reading/RNG/archive/AI logic changes. */
(() => {
  const W = window;
  if (W.__LUNEA_HOME_FINAL_TUNE_V32__) return;
  W.__LUNEA_HOME_FINAL_TUNE_V32__ = true;

  const STYLE_ID = 'luneaHomeFinalTuneV32Style';

  function addStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-grid{gap:8px!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-sub{color:#bdc1cf!important;font-weight:500!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v20-ai-chip{top:10px!important;right:31px!important;bottom:auto!important;padding:2px 5px!important;border-radius:999px!important;font-size:6.3px!important;line-height:1.15!important;letter-spacing:.55px!important;color:#c9cbd7!important;border-color:rgba(215,219,235,.17)!important;background:rgba(9,11,24,.38)!important;opacity:.82!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="career"]{border-color:rgba(203,151,73,.34)!important;background:radial-gradient(circle at 12% 5%,rgba(190,132,54,.22),transparent 31%),radial-gradient(circle at 95% 95%,rgba(76,112,147,.10),transparent 37%),linear-gradient(148deg,rgba(39,30,25,.96),rgba(9,12,22,.995))!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="career"] .lunea-v8-object{border-color:rgba(218,166,88,.38)!important;background:linear-gradient(145deg,rgba(181,121,48,.30),rgba(68,102,139,.16))!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="career"] .lunea-v8-open{color:#d6a85f!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile{border-color:rgba(207,164,81,.38)!important;background:radial-gradient(circle at 13% 6%,rgba(126,78,170,.22),transparent 31%),radial-gradient(circle at 94% 94%,rgba(210,155,63,.11),transparent 37%),linear-gradient(148deg,rgba(39,24,55,.97),rgba(13,11,27,.995))!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{border-color:rgba(226,184,94,.42)!important;background:linear-gradient(145deg,rgba(120,77,167,.31),rgba(190,133,49,.18))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 0 20px rgba(206,158,69,.07)!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{color:#fff9ef!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{color:#c1b9ca!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{color:#dfb35f!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{min-height:78px!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{min-height:86px!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection .category-header{min-height:78px!important}
      @media(max-width:390px){html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v20-ai-chip{top:9px!important;right:29px!important;font-size:6px!important}html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{min-height:76px!important}html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{min-height:84px!important}}
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function apply(){document.documentElement.classList.add('lunea-home-final-tune-v32');addStyles();}
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  W.addEventListener('pageshow', apply, {passive:true});
  W.LUNEA_HOME_FINAL_TUNE_V32 = Object.freeze({version:32, apply});
})();
