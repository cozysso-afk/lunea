'use strict';

/* LUNEA THAI PERIOD DATE CENTER V54
   iOS Safari keeps the visible date inside WebKit shadow controls. Center the
   host and every visible date-value wrapper so the two period fields match.
*/
(() => {
  if (window.__LUNEA_THAI_DATE_CENTER_V54__) return;
  window.__LUNEA_THAI_DATE_CENTER_V54__ = true;

  const id = 'luneaThaiDateCenterV54Style';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .thai-v33-dates{
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      gap:10px!important;
      align-items:stretch!important;
    }
    .thai-v33-field{
      min-width:0!important;
      overflow:hidden!important;
      text-align:center!important;
    }
    .thai-v33-field input[type="date"]{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
      text-align:center!important;
      text-align-last:center!important;
      line-height:1.2!important;
      padding-left:8px!important;
      padding-right:8px!important;
    }
    .thai-v33-field input[type="date"]::-webkit-date-and-time-value{
      width:100%!important;
      min-width:100%!important;
      text-align:center!important;
      margin:0!important;
    }
    .thai-v33-field input[type="date"]::-webkit-datetime-edit{
      width:100%!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      padding:0!important;
    }
    .thai-v33-field input[type="date"]::-webkit-datetime-edit-fields-wrapper{
      width:100%!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
    }
    @media(max-width:360px){
      .thai-v33-dates{grid-template-columns:1fr!important;gap:8px!important}
      .thai-v33-field{overflow:visible!important}
    }
  `;
  document.head.appendChild(style);
})();
