'use strict';

/* LUNEA THAI PERIOD DATE CENTER V54
   iOS Safari keeps date text inside a WebKit shadow value box, so centering the
   input alone is not enough. Center both the host control and its date value.
*/
(() => {
  if (window.__LUNEA_THAI_DATE_CENTER_V54__) return;
  window.__LUNEA_THAI_DATE_CENTER_V54__ = true;

  const id = 'luneaThaiDateCenterV54Style';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .thai-v33-field input[type="date"]{
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
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
    }
  `;
  document.head.appendChild(style);
})();
