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

      @media(max-width:390px){
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb img,
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v25-img,
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 img[data-lunea-thai-art]{transform:scale(1.22)!important}
      }
      @media(prefers-reduced-motion:no-preference){
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24 .thai-v24-orb{transition:box-shadow .25s ease,transform .25s ease}
        html:not(.lunea-home-visual-v36) #luneaThaiHomeTileV24:active .thai-v24-orb{transform:scale(.97)}
      }
    `;
    document.head.appendChild(s);
  }

  function normalizeHomeTile(){
    const tile=$('luneaThaiHomeTileV24');
    if(!tile) return false;
    if(!document.documentElement.classList.contains('lunea-home-visual-v36')) return false;

    tile.dataset.key='thai';
    tile.setAttribute('aria-pressed','false');
    tile.classList.remove('lunea-thai-home-tile');
    tile.classList.add('lunea-v8-tile');

    const alreadyNormalized =
      tile.children.length === 4 &&
      tile.children[0]?.classList.contains('lunea-v8-object') &&
      tile.children[1]?.classList.contains('lunea-v8-label') &&
      tile.children[2]?.classList.contains('lunea-v8-sub') &&
      tile.children[3]?.classList.contains('lunea-v8-open');

    if(alreadyNormalized){
      tile.children[1].textContent='THAI ASTROLOGY';
      tile.children[2].textContent='출생운 · 8영역 · 보조 흐름';
      tile.children[3].textContent='＋';
      return true;
    }

    const oldOrb=tile.querySelector('.thai-v24-orb,.lunea-v8-object');
    if(!oldOrb) return false;
    const art=oldOrb.innerHTML;

    tile.innerHTML =
      `<span class="lunea-v8-object thai-v24-orb">${art}</span>` +
      '<span class="lunea-v8-label thai-v24-title">THAI ASTROLOGY</span>' +
      '<span class="lunea-v8-sub thai-v24-home-sub">출생운 · 8영역 · 보조 흐름</span>' +
      '<span class="lunea-v8-open thai-v24-arrow">＋</span>';
    tile.dataset.thaiV8Normalized='1';
    return true;
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
    return !!orb.querySelector('svg');
  }

  function prepareHomeTile(){
    const normalized=normalizeHomeTile();
    const tagged=tagImage();
    return normalized && tagged;
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
    if(prepareHomeTile()) return;
    const mo=new MutationObserver(()=>{ if(prepareHomeTile()) mo.disconnect(); });
    mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    setTimeout(()=>mo.disconnect(),10000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
