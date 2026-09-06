'use strict';
(()=>{
  const W=window;
  if(W.__LUNEA_UI_FREEZE_V57__)return;
  W.__LUNEA_UI_FREEZE_V57__=true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function apply(){
    const daily=$('.daily');
    const grid=daily&&$('.lunea-daily-six-grid',daily);
    const btn=daily&&$('#dailyBtn',daily);
    const portal=$('#luneaHomePortalV8');
    if(!daily||!grid||!btn||!portal)return false;

    daily.classList.add('lunea-daily-orbit6','lunea-daily-celestial-card');
    const h3=$('h3',daily); if(h3)h3.textContent='DAILY ORBIT 6';

    const oldEyebrow=$$('.eyebrow').find(x=>/CHOOSE A READING/i.test(x.textContent||''));
    if(oldEyebrow)oldEyebrow.classList.add('lunea-v57-hide-old-home');
    const oldTitle=$$('h1,h2,h3').find(x=>/탐색할 스프레드/.test(x.textContent||''));
    if(oldTitle)oldTitle.classList.add('lunea-v57-hide-old-home');

    document.documentElement.classList.add('lunea-v57-ui-frozen');
    return true;
  }

  const s=document.createElement('style');
  s.id='luneaUiFreezeV57Style';
  s.textContent=`
    .lunea-v57-hide-old-home{display:none!important}
    html.lunea-v57-ui-frozen #luneaHomePortalV8{display:block!important;opacity:1!important;visibility:visible!important}
    html.lunea-v57-ui-frozen #luneaHomePortalV8 .lunea-v8-grid{display:grid!important}
    html.lunea-v57-ui-frozen .daily.lunea-daily-orbit6>#dailyBtn{max-width:100%!important}
  `;
  (document.head||document.documentElement).appendChild(s);

  let tries=0;
  const t=setInterval(()=>{tries++;if(apply()||tries>120)clearInterval(t)},80);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  W.addEventListener('pageshow',()=>setTimeout(apply,0));
})();