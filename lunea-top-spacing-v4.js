'use strict';

/* LUNEA Top Spacing V4
   Visual-only adjustment based on iPhone PWA screenshot.
   Gives the brand/header more breathing room below the iOS status area.
*/
(() => {
  if (window.__LUNEA_TOP_SPACING_V4__) return;
  window.__LUNEA_TOP_SPACING_V4__ = true;
  document.documentElement.classList.add('lunea-top-spacing-v4');

  const style = document.createElement('style');
  style.id = 'luneaTopSpacingV4Style';
  style.textContent = `
    html.lunea-top-spacing-v4 .app{
      padding-top:32px!important;
    }

    html.lunea-top-spacing-v4 header{
      margin-bottom:18px!important;
    }

    html.lunea-top-spacing-v4 .profile-strip{
      margin-top:3px!important;
    }

    @media(max-width:390px){
      html.lunea-top-spacing-v4 .app{
        padding-top:30px!important;
      }
    }
  `;

  document.head.appendChild(style);
  console.info('✦ LUNEA Top Spacing V4 active');
})();
