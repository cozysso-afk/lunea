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
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb{
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
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb img,
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v25-img,
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 img[data-lunea-thai-art]{
        width:100%!important;
        height:100%!important;
        display:block!important;
        object-fit:cover!important;
        object-position:50% 48%!important;
        transform:scale(1.20)!important;
        transform-origin:50% 50%!important;
        filter:brightness(1.16) contrast(1.09) saturate(1.08) drop-shadow(0 0 5px rgba(255,213,117,.18))!important;
      }
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb::before{
        content:'';position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;
        background:
          radial-gradient(circle at 50% 47%,rgba(255,226,151,.16),transparent 38%),
          linear-gradient(132deg,rgba(255,255,255,.15),transparent 22%,transparent 73%,rgba(155,188,224,.08));
        mix-blend-mode:screen;
      }
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb::after{
        content:'';position:absolute;inset:1px;z-index:3;pointer-events:none;border-radius:inherit;
        border:1px solid rgba(255,240,197,.16);
        box-shadow:inset 0 0 12px rgba(8,12,35,.24);
      }
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24{
        border-color:rgba(220,207,166,.20)!important;
        background:
          radial-gradient(circle at 13% 28%,rgba(213,183,101,.09),transparent 24%),
          radial-gradient(circle at 89% 82%,rgba(115,160,185,.055),transparent 27%),
          linear-gradient(148deg,rgba(29,31,49,.96),rgba(8,12,27,.99))!important;
      }
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-copy small{color:#c8b681!important}
      html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-arrow{color:#d1bd82!important;filter:drop-shadow(0 0 5px rgba(229,197,111,.14))}

      /* Home V36 owns the card material. Thai keeps its own artwork, but the
         icon well must read as the same glass object as Horary / Meihua. */
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v24-orb{
        overflow:hidden!important;
        isolation:isolate!important;
        border:1px solid rgba(var(--v36-a),.31)!important;
        background:
          radial-gradient(circle at 29% 19%,rgba(255,255,255,.22),transparent 31%),
          linear-gradient(145deg,rgba(var(--v36-a),.14),rgba(var(--v36-b),.045))!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.27),
          inset -1px -1px 0 rgba(var(--v36-b),.10),
          inset 0 -8px 15px rgba(2,4,20,.17),
          0 5px 14px rgba(0,0,0,.14),
          0 0 15px rgba(var(--v36-a),.055)!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v24-orb img,
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v25-img,
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 img[data-lunea-thai-art]{
        width:100%!important;
        height:100%!important;
        display:block!important;
        object-fit:cover!important;
        object-position:50% 44%!important;
        border-radius:inherit!important;
        opacity:.91!important;
        filter:saturate(.88) brightness(.96) contrast(.95)!important;
        transform:translateY(-40%) scale(1.42)!important;
        transform-origin:50% 50%!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v24-orb::before{
        content:''!important;
        position:absolute!important;
        inset:0!important;
        z-index:3!important;
        pointer-events:none!important;
        border-radius:inherit!important;
        background:
          radial-gradient(circle at 31% 20%,rgba(255,255,255,.16),transparent 27%),
          linear-gradient(128deg,rgba(255,255,255,.07),transparent 35%,rgba(var(--v36-b),.045))!important;
        mix-blend-mode:screen!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v24-orb::after{
        content:''!important;
        position:absolute!important;
        inset:1px!important;
        z-index:4!important;
        pointer-events:none!important;
        border-radius:13px!important;
        border:0!important;
        border-top:1px solid rgba(255,255,255,.22)!important;
        background:linear-gradient(128deg,rgba(255,255,255,.07),transparent 35%,rgba(var(--v36-b),.045))!important;
        box-shadow:none!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v24-copy b{
        font-family:'Cinzel','Pretendard',sans-serif!important;
      }

      @media(max-width:380px){
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb img,
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v25-img,
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 img[data-lunea-thai-art]{transform:scale(1.22)!important}
        html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v24-orb img,
        html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 .thai-v25-img,
        html.lunea-home-visual-v36 #luneaHomePortalV8 #luneaThaiHomeTileV24 img[data-lunea-thai-art]{transform:translateY(-40%) scale(1.44)!important}
      }
      @media(prefers-reduced-motion:no-preference){
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb{transition:box-shadow .25s ease,transform .25s ease}
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24:active .thai-v24-orb{transform:scale(.97)}
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
