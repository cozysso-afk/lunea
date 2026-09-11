'use strict';

/*
  LUNEA THAI ART POLISH V26
  =========================
  Small-tile refinement for the generated Thai Astrology artwork.
  Visual only: enlarges the central celestial wheel, lifts gold luminance,
  and reduces the visual weight of edge detail through cropping/glass masking.

  V27 bridge:
  - Loads Thai result copy/archive actions.
  - Loads per-question Timing Oracle state isolation.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_ART_POLISH_V26__) return;
  W.__LUNEA_THAI_ART_POLISH_V26__ = true;
  document.documentElement.classList.add('lunea-thai-art-polish-v26');

  const $ = id => document.getElementById(id);

  function addStyle(){
    if ($('luneaThaiArtPolishV26Style')) return;
    const s=document.createElement('style');
    s.id='luneaThaiArtPolishV26Style';
    s.textContent=`
      /* Shared final Thai sheet theme: standalone support and period calendar. */
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay){
        --dim:#bfb09a;--text:#f4e9d5;--gold:#efd39b;--gold2:#d8aa5b;
        box-sizing:border-box;background:rgba(12,8,5,.95)!important;color:#f4e9d5;
      }
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) *{box-sizing:border-box;min-width:0}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) .modal{
        width:100%;max-width:448px!important;
        background:radial-gradient(ellipse at 90% 0%,rgba(216,170,91,.10),transparent 40%),linear-gradient(160deg,#1d1510,#17110d)!important;
        border-color:rgba(216,170,91,.30)!important;
        box-shadow:inset 0 1px 0 rgba(239,211,155,.06),0 24px 64px rgba(0,0,0,.55)!important;
      }
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.modal-h,.thai-v24-title,.thai-v24-kicker,.thai-v33-range-kicker,b,strong,label,small){color:#efd39b!important}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.modal-h,.thai-v24-title){padding-right:28px;overflow-wrap:anywhere}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(p,.thai-v24-sub,.thai-v24-status,.thai-v33-status,.thai-v33-field,.thai-v24-cell span,.thai-v24-summary span,.thai-v33-main span){color:#bfb09a!important}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.thai-v24-summary,.thai-v24-cell,.thai-v24-now,.thai-v33-range-panel,.thai-v33-day,.thai-v33-summary span){
        background:rgba(216,170,91,.055)!important;border-color:rgba(216,170,91,.24)!important;color:#e0cfaf!important;
      }
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.thai-v24-cell.focus,.thai-v33-day.supportive){border-color:rgba(216,170,91,.45)!important}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.thai-v24-cell.kala,.thai-v33-day.caution){border-color:rgba(199,139,116,.42)!important}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(input,select,textarea){
        width:100%!important;max-width:100%!important;min-width:0!important;
        background:#17110d!important;border-color:rgba(216,170,91,.28)!important;color:#f4e9d5!important;color-scheme:dark;
      }
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(input,select,textarea):focus{border-color:#d8aa5b!important;outline-color:#d8aa5b;box-shadow:0 0 0 2px rgba(216,170,91,.14)!important}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) button{
        min-width:0;max-width:100%;white-space:normal;overflow-wrap:anywhere;
        background:linear-gradient(145deg,#302319,#211810)!important;border-color:rgba(216,170,91,.28)!important;color:#efd39b!important;
        box-shadow:inset 0 1px 0 rgba(239,211,155,.06)!important;
      }
      #luneaThaiStandaloneOverlay #luneaThaiStandaloneRun,
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) .thai-v33-run{
        background:linear-gradient(120deg,#efd39b,#d8aa5b)!important;color:#21170d!important;
      }
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.thai-v24-topic.active,.thai-v33-chip.active){background:#49341f!important;border-color:#d8aa5b!important;color:#fff0d0!important}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) :is(.thai-v24-grid,.thai-v33-dates){grid-template-columns:repeat(2,minmax(0,1fr))}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) .thai-v33-quick{grid-template-columns:repeat(3,minmax(0,1fr))}
      :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) .modal *{overflow-wrap:anywhere}
      #luneaThaiTarotBridgeInline{box-sizing:border-box;max-width:100%;overflow-wrap:anywhere;background:#1d1510!important;border-color:rgba(216,170,91,.28)!important}
      #luneaThaiTarotBridgeInline :is(small,b){color:#efd39b!important}
      #luneaThaiTarotBridgeInline span{color:#bfb09a!important}
      @media(max-width:420px){
        :is(#luneaThaiStandaloneOverlay,#luneaThaiRangeOverlay) .thai-v33-dates{grid-template-columns:minmax(0,1fr)}
      }
      #luneaThaiHomeTileV24 .thai-v24-orb{
        overflow:hidden!important;
        isolation:isolate;
        border-color:rgba(238,219,157,.30)!important;
        background:linear-gradient(145deg,rgba(24,29,59,.96),rgba(7,11,29,.99))!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.18),
          inset 0 0 0 1px rgba(179,160,224,.08),
          0 0 0 1px rgba(213,190,127,.055),
          0 0 18px rgba(222,188,94,.11),
          0 8px 18px rgba(0,0,0,.22)!important;
      }
      #luneaThaiHomeTileV24 .thai-v24-orb img,
      #luneaThaiHomeTileV24 .thai-v25-img,
      #luneaThaiHomeTileV24 img[data-lunea-thai-art]{
        width:100%!important;
        height:100%!important;
        display:block!important;
        object-fit:cover!important;
        object-position:50% 48%!important;
        transform:scale(1.20)!important;
        transform-origin:50% 50%!important;
        filter:brightness(1.16) contrast(1.09) saturate(1.08) drop-shadow(0 0 5px rgba(255,213,117,.18))!important;
      }
      #luneaThaiHomeTileV24 .thai-v24-orb::before{
        content:'';position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;
        background:
          radial-gradient(circle at 50% 47%,rgba(255,226,151,.16),transparent 38%),
          linear-gradient(132deg,rgba(255,255,255,.15),transparent 22%,transparent 73%,rgba(155,188,224,.08));
        mix-blend-mode:screen;
      }
      #luneaThaiHomeTileV24 .thai-v24-orb::after{
        content:'';position:absolute;inset:1px;z-index:3;pointer-events:none;border-radius:inherit;
        border:1px solid rgba(255,240,197,.16);
        box-shadow:inset 0 0 12px rgba(8,12,35,.24);
      }
      #luneaThaiHomeTileV24{
        border-color:rgba(220,207,166,.20)!important;
        background:
          radial-gradient(circle at 13% 28%,rgba(213,183,101,.09),transparent 24%),
          radial-gradient(circle at 89% 82%,rgba(115,160,185,.055),transparent 27%),
          linear-gradient(148deg,rgba(29,31,49,.96),rgba(8,12,27,.99))!important;
      }
      #luneaThaiHomeTileV24 .thai-v24-copy small{color:#c8b681!important}
      #luneaThaiHomeTileV24 .thai-v24-arrow{color:#d1bd82!important;filter:drop-shadow(0 0 5px rgba(229,197,111,.14))}
      @media(max-width:380px){
        #luneaThaiHomeTileV24 .thai-v24-orb img,
        #luneaThaiHomeTileV24 .thai-v25-img,
        #luneaThaiHomeTileV24 img[data-lunea-thai-art]{transform:scale(1.22)!important}
      }
      @media(prefers-reduced-motion:no-preference){
        #luneaThaiHomeTileV24 .thai-v24-orb{transition:box-shadow .25s ease,transform .25s ease}
        #luneaThaiHomeTileV24:active .thai-v24-orb{transform:scale(.97)}
      }
    `;
    document.head.appendChild(s);
  }

  function tagImage(){
    const orb=document.querySelector('#luneaThaiHomeTileV24 .thai-v24-orb');
    if(!orb) return false;
    const img=orb.querySelector('img');
    if(img){
      img.setAttribute('data-lunea-thai-art','v26');
      img.draggable=false;
      return true;
    }
    return false;
  }

  function loadV27(){
    if(W.__LUNEA_THAI_ARCHIVE_TIMING_ISOLATION_V27__) return;
    if(document.querySelector('script[data-lunea-v27-loader]')) return;
    const s=document.createElement('script');
    s.src='./lunea-thai-archive-timing-isolation-v27.js?v=2701';
    s.dataset.luneaV27Loader='1';
    s.onerror=()=>console.error('[LUNEA V26] Failed to load V27');
    document.head.appendChild(s);
  }

  function boot(){
    addStyle();
    loadV27();
    if(tagImage()) return;
    const mo=new MutationObserver(()=>{ if(tagImage()) mo.disconnect(); });
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),10000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
