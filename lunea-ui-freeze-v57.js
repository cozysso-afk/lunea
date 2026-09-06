'use strict';
(()=>{
  const W=window;
  if(W.__LUNEA_UI_FREEZE_V57__)return;
  W.__LUNEA_UI_FREEZE_V57__=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function enforceDaily6Presentation(){
    const daily=$('.daily');
    if(!daily)return false;
    const h3=$('h3',daily), grid=$('.lunea-daily-six-grid',daily), btn=$('#dailyBtn',daily);
    if(!grid||!btn)return false;
    daily.classList.add('lunea-daily-orbit6','lunea-daily-celestial-card');
    if(h3)h3.textContent='DAILY ORBIT 6';
    btn.style.removeProperty('width');
    btn.style.removeProperty('min-width');
    btn.style.maxWidth='100%';
    return true;
  }

  function enforceCabinet(){
    const portal=$('#luneaHomePortalV8');
    if(!portal)return false;
    const grid=$('.lunea-v8-grid',portal);
    if(!grid)return false;
    portal.style.display='';
    const oldEyebrow=$$('.eyebrow').find(x=>/CHOOSE A READING/i.test(x.textContent||''));
    if(oldEyebrow)oldEyebrow.style.display='none';
    const oldTitle=$$('h1,h2,h3').find(x=>/탐색할 스프레드/.test(x.textContent||''));
    if(oldTitle)oldTitle.style.display='none';
    return grid.children.length>0;
  }

  function apply(){
    const d=enforceDaily6Presentation();
    const c=enforceCabinet();
    if(d&&c)document.documentElement.classList.add('lunea-v57-ui-frozen');
    return d&&c;
  }

  const style=document.createElement('style');
  style.id='luneaUiFreezeV57Style';
  style.textContent=`
    html.lunea-v57-ui-frozen .daily.lunea-daily-orbit6>#dailyBtn{
      width:auto!important;min-width:0!important;max-width:100%!important;
      align-self:flex-start!important;margin-left:0!important;margin-right:auto!important;
    }
    html.lunea-v57-ui-frozen #luneaHomePortalV8{display:block!important;opacity:1!important;visibility:visible!important}
    html.lunea-v57-ui-frozen #luneaHomePortalV8 .lunea-v8-grid{display:grid!important}
  `;
  (document.head||document.documentElement).appendChild(style);

  let n=0;
  const t=setInterval(()=>{n++;if(apply()||n>120)clearInterval(t)},80);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  W.addEventListener('pageshow',()=>setTimeout(apply,0));
})();