'use strict';

/* LUNEA THAI PERIOD DATE CENTER V54.1
   iOS Safari renders date text inside WebKit shadow controls. Keep the two
   period fields visually centered both horizontally and vertically.
*/
(() => {
  if (window.__LUNEA_THAI_DATE_CENTER_V54__) return;
  window.__LUNEA_THAI_DATE_CENTER_V54__ = true;

  const id = 'luneaThaiDateCenterV54Style';
  document.getElementById(id)?.remove();

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
      height:48px!important;
      min-height:48px!important;
      box-sizing:border-box!important;
      padding:0 8px!important;
      text-align:center!important;
      text-align-last:center!important;
      line-height:48px!important;
      -webkit-appearance:none!important;
      appearance:none!important;
    }
    .thai-v33-field input[type="date"]::-webkit-date-and-time-value{
      width:100%!important;
      min-width:100%!important;
      height:46px!important;
      min-height:46px!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      line-height:1!important;
      text-align:center!important;
    }
    .thai-v33-field input[type="date"]::-webkit-datetime-edit{
      width:100%!important;
      height:46px!important;
      min-height:46px!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      line-height:1!important;
    }
    .thai-v33-field input[type="date"]::-webkit-datetime-edit-fields-wrapper{
      width:100%!important;
      height:46px!important;
      min-height:46px!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      line-height:1!important;
    }
    .thai-v33-field input[type="date"]::-webkit-datetime-edit-year-field,
    .thai-v33-field input[type="date"]::-webkit-datetime-edit-month-field,
    .thai-v33-field input[type="date"]::-webkit-datetime-edit-day-field,
    .thai-v33-field input[type="date"]::-webkit-datetime-edit-text{
      padding-top:0!important;
      padding-bottom:0!important;
      line-height:1.1!important;
    }
    @media(max-width:360px){
      .thai-v33-dates{grid-template-columns:1fr!important;gap:8px!important}
      .thai-v33-field{overflow:visible!important}
    }
  `;
  document.head.appendChild(style);
})();
