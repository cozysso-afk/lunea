'use strict';
/* LUNEA RECOVERY FINISH V59
   Targeted recovery-only patch:
   1) keep legacy shell hidden until Daily 6 + Cabinet are ready
   2) re-assert final sector card backs
   3) re-sync uploaded Timing artwork from semantic labels
   4) enrich archive/result copy with Timing + Astrology evidence
*/
(()=>{
  const W=window;
  if(W.__LUNEA_RECOVERY_FINISH_V59__) return;
  W.__LUNEA_RECOVERY_FINISH_V59__=true;

  const root=document.documentElement;
  try{ clearTimeout(W.__LUNEA_BOOT_FAILSAFE__); }catch{}
  root.classList.add('lunea-booting');
  root.classList.remove('lunea-ui-ready');

  const norm=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
  const jsonText=v=>{
    if(v==null||v==='') return '';
    if(typeof v==='string') return v;
    try{return JSON.stringify(v,null,2)}catch{return String(v)}
  };
  const readArchive=()=>{try{const x=JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3')||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const evidenceScore=r=>['astroTransit','astroReturns','thaiTaksa','thaiTaksaRange','thaiRange','horary','timing','legacyImportedText'].reduce((n,k)=>n+(r?.[k]!=null&&r[k]!==''?1:0),0)+(r?.ai?1:0);

  function richText(r){
    if(!r) return '';
    try{
      const t=W.LUNEA_EMERGENCY_REPAIR_V43?.archiveText?.(r);
      if(t) return String(t);
    }catch{}
    const cards=(r.cards||[]).map(c=>c?.text||`${c?.position||''}: ${c?.name||''} (${c?.isReversed?'역':'정'})`+(c?.subCards?.length?` / 보조 ${c.subCards.map(x=>x?.name||'').join(', ')}`:'')).filter(Boolean).join('\n');
    const out=[r.date||(r.createdAt?new Date(r.createdAt).toLocaleString('ko-KR'):''),r.title||'',r.q?`질문: ${r.q}`:'',cards,r.ai?`[AI 해석]\n${r.ai}`:''].filter(Boolean);
    for(const [label,key] of [
      ['Timing Oracle · 시기 오라클','timing'],
      ['Natal / Astrology · 점성술','astroNatal'],
      ['Transit · 트랜짓','astroTransit'],
      ['Returns · 리턴','astroReturns'],
      ['Horary · 호라리','horary'],
      ['Thai Astrology · 태국점성술','thaiTaksa'],
      ['Thai Period · 태국 기간','thaiTaksaRange'],
      ['Thai Period · 태국 기간','thaiRange']
    ]){
      const v=r?.[key]; if(v==null||v==='') continue;
      if(typeof v==='object'&&!Array.isArray(v)&&!Object.keys(v).length) continue;
      out.push(`[${label}]\n${jsonText(v)}`);
    }
    return out.join('\n\n').trim();
  }

  function itemMeta(item){
    const titleNode=item?.querySelector('.archive-title');
    const title=norm(titleNode?.textContent||'');
    const q=norm(item?.querySelector('.archive-q')?.textContent||'');
    return {title,q};
  }
  function bestArchiveForItem(item){
    const {title,q}=itemMeta(item);
    const rows=readArchive().slice().sort((a,b)=>Number(b?.createdAt||0)-Number(a?.createdAt||0));
    const exact=rows.filter(r=>norm(r?.title)===title&&norm(r?.q)===q);
    if(exact.length) return exact.sort((a,b)=>evidenceScore(b)-evidenceScore(a))[0];
    const qRows=q?rows.filter(r=>norm(r?.q)===q):[];
    if(qRows.length) return qRows.sort((a,b)=>evidenceScore(b)-evidenceScore(a))[0];
    const tRows=title?rows.filter(r=>norm(r?.title)===title):[];
    return tRows.sort((a,b)=>evidenceScore(b)-evidenceScore(a))[0]||null;
  }
  async function copy(text){
    if(!text) return alert('복사할 내용이 없어.');
    try{await navigator.clipboard.writeText(text);alert('복사했어.')}catch{alert('복사 권한을 확인해줘.')}
  }

  function installCopyBridge(){
    if(document.__luneaRecoveryCopyV59) return;
    document.__luneaRecoveryCopyV59=true;
    document.addEventListener('click',e=>{
      const btn=e.target?.closest?.('#archiveOverlay button');
      if(!btn) return;
      if(btn.id==='copyAllArchive'){
        e.preventDefault();e.stopImmediatePropagation();
        const text=readArchive().map(r=>richText(r)).filter(Boolean).join('\n\n────────────\n\n');
        copy(text); return;
      }
      const actions=btn.closest('.archive-item .archive-actions');
      if(actions&&/^복사$/.test(norm(btn.textContent))){
        const item=btn.closest('.archive-item'); const r=bestArchiveForItem(item);
        if(!r) return;
        e.preventDefault();e.stopImmediatePropagation();copy(richText(r));
      }
    },true);
  }

  function repairVisuals(){
    try{W.LUNEA_SECTOR_CARD_BACKS_V20?.repairAll?.()}catch{}
    try{W.LUNEA_TIMING_UPLOADED_ART_V58?.syncAll?.()}catch{}
    try{W.LUNEA_JOURNAL_DETAIL_V51?.normalize?.()}catch{}
  }

  const ready=()=>!!(
    document.querySelector('.daily.lunea-daily-orbit6 .lunea-daily-six-grid') &&
    /DAILY ORBIT 6/i.test(document.querySelector('.daily h3')?.textContent||'') &&
    document.querySelector('#luneaHomePortalV8 .lunea-v8-tile')
  );
  function reveal(){
    if(!ready()) return false;
    root.dataset.luneaHomeReady='1';
    root.classList.remove('lunea-booting');
    root.classList.add('lunea-ui-ready');
    return true;
  }

  function settle(){
    installCopyBridge();repairVisuals();
    if(reveal()){
      setTimeout(repairVisuals,80);setTimeout(repairVisuals,260);setTimeout(repairVisuals,700);
    }
  }
  W.addEventListener('lunea:home-ready',settle);
  W.addEventListener('lunea:deterministic-ready',settle);
  W.addEventListener('pageshow',()=>setTimeout(settle,60),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(settle,60)});
  const mo=new MutationObserver(()=>queueMicrotask(settle));
  if(document.documentElement) mo.observe(document.documentElement,{childList:true,subtree:true});
  settle();
})();
