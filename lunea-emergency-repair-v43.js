'use strict';

/*
  LUNEA EMERGENCY REPAIR V43
  ==========================
  2026-09-05 iPhone / Render recovery layer.

  Goals:
  - Stabilize astrology API calls and retry transient 429/5xx responses.
  - Normalize iOS date/time inputs and Thai range boxes.
  - Make uploaded Timing Oracle art authoritative in BOTH large and inline cards.
  - Remove the white Timing card matte and raise text contrast.
  - Keep sector card backs authoritative after late iOS card-constructor patches.
  - Protect LUNEA_ARCHIVE_V3 from accidental overwrite and render ALL attached
    evidence (Transit / Returns / Thai / Horary / Timing) in the archive.
  - Offer clipboard import for records copied from the old GitHub Pages origin.
*/
(() => {
  const W = window;
  if (W.__LUNEA_EMERGENCY_REPAIR_V43__) return;
  W.__LUNEA_EMERGENCY_REPAIR_V43__ = true;

  const RELEASE = '43.0';
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const ARCHIVE_BACKUP_KEY = 'LUNEA_ARCHIVE_V3_BACKUP_V43';
  const OLD_ARCHIVE_KEYS = ['LUNEA_ARCHIVE', 'LUNEA_ARCHIVE_V2'];
  const ASTRO_RE = /\/v1\/(?:natal|transits\/scan|returns\/context|thai\/taksa(?:\/range)?|horary)(?:\?|$)/i;
  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function safeJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function stableId() {
    try {
      if (typeof W.secureId === 'function') return String(W.secureId());
    } catch {}
    try { return crypto.randomUUID(); } catch {}
    return `v43-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function addStyle() {
    if ($('luneaEmergencyRepairV43Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaEmergencyRepairV43Style';
    style.textContent = `
      #profileOverlay input[type="date"],
      #profileOverlay input[type="time"],
      #luneaThaiStandaloneOverlay input[type="date"],
      #luneaThaiRangeOverlay input[type="date"],
      .thai-v33-field input[type="date"]{
        -webkit-appearance:none!important;appearance:none!important;
        box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;
        padding-left:14px!important;padding-right:14px!important;border-radius:12px!important;
        background-image:none!important;text-align:center!important;overflow:hidden!important;
      }
      #profileOverlay input[type="date"]::-webkit-calendar-picker-indicator,
      #profileOverlay input[type="time"]::-webkit-calendar-picker-indicator,
      #luneaThaiStandaloneOverlay input[type="date"]::-webkit-calendar-picker-indicator,
      #luneaThaiRangeOverlay input[type="date"]::-webkit-calendar-picker-indicator,
      .thai-v33-field input[type="date"]::-webkit-calendar-picker-indicator{
        display:none!important;opacity:0!important;width:0!important;min-width:0!important;margin:0!important;padding:0!important;
      }
      #profileOverlay input[type="date"]::-webkit-date-and-time-value,
      #profileOverlay input[type="time"]::-webkit-date-and-time-value,
      #luneaThaiStandaloneOverlay input[type="date"]::-webkit-date-and-time-value,
      #luneaThaiRangeOverlay input[type="date"]::-webkit-date-and-time-value,
      .thai-v33-field input[type="date"]::-webkit-date-and-time-value{
        margin:0!important;padding:0!important;min-width:100%!important;text-align:center!important;
      }
      #profileOverlay .modal,#luneaThaiStandaloneModal,#luneaThaiRangeOverlay .modal{scrollbar-width:none!important;}
      #profileOverlay .modal::-webkit-scrollbar,#luneaThaiStandaloneModal::-webkit-scrollbar,#luneaThaiRangeOverlay .modal::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;}
      .thai-v33-dates{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:9px!important;width:100%!important;overflow:visible!important;}
      .thai-v33-field{min-width:0!important;width:100%!important;}.thai-v33-field input{width:100%!important;min-width:0!important;max-width:none!important;border-radius:12px!important;}.thai-v33-run{border-radius:13px!important;overflow:hidden!important;}
      #timingOverlay .timing-front{background:transparent!important;border:0!important;box-shadow:none!important;overflow:hidden!important;}
      #timingOverlay .timing-front>img{position:absolute!important;width:108%!important;height:108%!important;left:-4%!important;top:-4%!important;right:auto!important;bottom:auto!important;object-fit:cover!important;object-position:center!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:14px!important;background:transparent!important;}
      #luneaTimingInline.timing-inline img,.timing-inline img{display:block!important;object-fit:cover!important;object-position:center!important;background:transparent!important;border:0!important;opacity:1!important;visibility:visible!important;}
      #luneaTimingInline .txt small,.timing-inline .txt small{color:#d9c7ad!important;opacity:1!important;}
      #luneaTimingInline .txt b,.timing-inline .txt b{color:#f5efe7!important;opacity:1!important;}
      #luneaTimingInline .txt span,.timing-inline .txt span{color:#d9d2ca!important;opacity:1!important;}
      #timingOverlay .timing-info,#timingOverlay .timing-result,#timingOverlay .timing-meta{color:#e9e2dc!important;}
      .lunea-v43-archive-note{margin:8px 0 10px;padding:9px 10px;border-radius:11px;border:1px solid rgba(193,171,238,.16);background:rgba(157,127,216,.06);color:#aaa4b8;font-size:9px;line-height:1.5;}
      .lunea-v43-archive-extra{margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.07);color:#d8d2df;font-size:9px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
      .lunea-v43-archive-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.lunea-v43-archive-badges{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0}.lunea-v43-archive-badges span{padding:3px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.09);color:#bbb3c8;background:rgba(255,255,255,.025);font-size:7.8px;}
    `;
    document.head.appendChild(style);
  }

  function installAstroRetry() {
    if (W.__LUNEA_ASTRO_RETRY_V43__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_ASTRO_RETRY_V43__ = true;
    const prior = W.fetch.bind(W);
    W.fetch = async function(input, init) {
      const rawUrl = typeof input === 'string' ? input : String(input?.url || '');
      if (!ASTRO_RE.test(rawUrl)) return prior(input, init);
      const delays = [0, 700, 1600];
      let lastResponse = null, lastError = null;
      for (let attempt = 0; attempt < delays.length; attempt += 1) {
        if (delays[attempt]) await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        try {
          const response = await prior(input, init);
          lastResponse = response;
          if (![429, 502, 503, 504].includes(response.status)) return response;
          if (attempt < delays.length - 1) {
            let retryMs = 0;
            try { const h = response.headers?.get?.('retry-after'); if (h && /^\d+(?:\.\d+)?$/.test(h)) retryMs = Math.min(2500, Math.max(250, Number(h) * 1000)); } catch {}
            if (retryMs) await new Promise(resolve => setTimeout(resolve, retryMs));
            continue;
          }
          return response;
        } catch (error) {
          lastError = error;
          const name = String(error?.name || '');
          if (name === 'AbortError' || attempt === delays.length - 1) throw error;
        }
      }
      if (lastResponse) return lastResponse;
      throw lastError || new Error('Astro API 요청 실패');
    };
  }

  function timingIndexFromSource(value) { const m=String(value||'').match(/timing_(\d{3})/i); if(!m)return null; const n=Number(m[1]); return Number.isInteger(n)&&n>=1&&n<=60?n:null; }
  function timingAsset(n) { if (W.LUNEA_TIMING_UPLOADED_ART_V16?.assetPath) { try { return W.LUNEA_TIMING_UPLOADED_ART_V16.assetPath(n); } catch {} } const ext=n>=41&&n<=50?'PNG':'jpg'; return `./timing_${String(n).padStart(3,'0')}.${ext}?v=20260905-2239-v43`; }
  function currentTimingAsset() { const candidates=[document.querySelector('#timingOverlay .timing-front>img[src*="timing_" i]'),document.querySelector('#timingOverlay img[data-lunea-timing-asset-v16]'),document.querySelector('#luneaTimingABPanel img[src*="timing_" i]')].filter(Boolean); for(const img of candidates){const n=timingIndexFromSource(img.getAttribute('src')||img.currentSrc||'');if(n)return {n,src:timingAsset(n)}} return null; }
  function syncTimingArt() {
    try { W.LUNEA_TIMING_UPLOADED_ART_V16?.upgradeAll?.(); } catch {}
    const current=currentTimingAsset(); if(!current)return false;
    const large=document.querySelector('#timingOverlay .timing-front>img'); if(large){large.dataset.luneaTimingAsset=String(current.n);if(timingIndexFromSource(large.getAttribute('src'))!==current.n)large.src=current.src;}
    document.querySelectorAll('#luneaTimingInline img,.timing-inline img,#luneaTimingABPanel .tab-card>img').forEach(img=>{img.dataset.luneaTimingAsset=String(current.n);const n=timingIndexFromSource(img.getAttribute('src')||'');if(n!==current.n||!/timing_\d{3}/i.test(img.getAttribute('src')||''))img.src=current.src;});
    document.querySelectorAll('#luneaTimingInline .lunea-v7-time-art,#luneaTimingInline .lunea-v15-time-art,.timing-inline .lunea-v7-time-art,.timing-inline .lunea-v15-time-art').forEach(node=>node.remove());
    return true;
  }
  function installTimingGuard(){const root=document.documentElement;if(!root||root.__luneaV43TimingObserved)return;root.__luneaV43TimingObserved=true;let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncTimingArt()})};new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class']});document.addEventListener('click',e=>{if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')){setTimeout(syncTimingArt,60);setTimeout(syncTimingArt,220)}},{passive:true});setTimeout(syncTimingArt,250)}
  function reinforceCardBacks(){try{W.LUNEA_SECTOR_CARD_BACKS_V20?.repairAll?.()}catch{}}

  function readRows(key=ARCHIVE_KEY){const v=safeJSON(key,[]);return Array.isArray(v)?v:[]}
  function dedupeRows(rows){const seen=new Set(),out=[];for(const row of rows||[]){if(!row||typeof row!=='object')continue;const key=String(row.id||`${row.createdAt||''}|${row.date||''}|${row.q||''}|${row.title||''}`);if(seen.has(key))continue;seen.add(key);out.push(row)}out.sort((a,b)=>Number(b?.createdAt||0)-Number(a?.createdAt||0));return out.slice(0,100)}
  function archiveEvidenceBadges(item){const tags=[];if(item?.astroTransit)tags.push('Transit');if(item?.astroReturns)tags.push('Returns');if(item?.thaiTaksa)tags.push('Thai');if(item?.thaiTaksaRange||item?.thaiRange)tags.push('Thai 기간');if(item?.horary)tags.push('Horary');if(item?.timing)tags.push('Timing');return tags}
  function jsonText(v){try{return JSON.stringify(v,null,2)}catch{return String(v??'')}}
  function appendSection(parts,label,value){if(value==null)return;if(typeof value==='object'&&!Array.isArray(value)&&!Object.keys(value).length)return;parts.push(`\n\n[${label}]\n${jsonText(value)}`)}
  function unifiedArchiveText(item){const cards=(item?.cards||[]).map(card=>card?.text||`${card?.position||''}: ${card?.name||''} (${card?.isReversed?'역':'정'})`+(card?.subCards?.length?` / 보조 ${card.subCards.map(x=>x?.name||'').join(', ')}`:'')).join('\n');const parts=[item?.date||(item?.createdAt?new Date(item.createdAt).toLocaleString('ko-KR'):''),item?.title||'',item?.q?`질문: ${item.q}`:'',cards?`\n${cards}`:'',item?.ai?`\n\n[AI 해석]\n${item.ai}`:''];appendSection(parts,'Transit · 트랜짓',item?.astroTransit);appendSection(parts,'Returns · 리턴',item?.astroReturns);appendSection(parts,'Thai Astrology · 태국점성술',item?.thaiTaksa);appendSection(parts,'Thai Period · 태국 기간',item?.thaiTaksaRange||item?.thaiRange);appendSection(parts,'Horary · 호라리',item?.horary);appendSection(parts,'Timing Oracle · 시기 오라클',item?.timing);if(item?.legacyImportedText)appendSection(parts,'기존 주소에서 가져온 기록',item.legacyImportedText);return parts.filter(Boolean).join('\n').trim()}

  function installArchiveProtection(){const currentRaw=localStorage.getItem(ARCHIVE_KEY),current=readRows(ARCHIVE_KEY);if(current.length){const backup=readRows(ARCHIVE_BACKUP_KEY);localStorage.setItem(ARCHIVE_BACKUP_KEY,JSON.stringify(dedupeRows([...current,...backup])))}if(currentRaw==null){const legacy=OLD_ARCHIVE_KEYS.flatMap(readRows);if(legacy.length)localStorage.setItem(ARCHIVE_KEY,JSON.stringify(dedupeRows(legacy)))}const baseGet=typeof W.getArchive==='function'?W.getArchive:null,baseSet=typeof W.setArchive==='function'?W.setArchive:null;if(!baseGet||!baseSet||W.__LUNEA_ARCHIVE_FUNCS_V43__)return;W.__LUNEA_ARCHIVE_FUNCS_V43__=true;const guardedGet=function(){let rows;try{rows=baseGet.apply(this,arguments)}catch{rows=readRows(ARCHIVE_KEY)}return Array.isArray(rows)?rows:[]};const guardedSet=function(rows){const before=guardedGet();if(before.length){const oldBackup=readRows(ARCHIVE_BACKUP_KEY);localStorage.setItem(ARCHIVE_BACKUP_KEY,JSON.stringify(dedupeRows([...before,...oldBackup])))}const clean=dedupeRows(Array.isArray(rows)?rows:[]);const result=baseSet.call(this,clean);if(clean.length){const oldBackup=readRows(ARCHIVE_BACKUP_KEY);localStorage.setItem(ARCHIVE_BACKUP_KEY,JSON.stringify(dedupeRows([...clean,...oldBackup])))}return result};W.getArchive=guardedGet;W.setArchive=guardedSet;try{getArchive=guardedGet}catch{}try{setArchive=guardedSet}catch{}const oldArchiveText=typeof W.archiveText==='function'?W.archiveText:null;W.archiveText=function(item){const unified=unifiedArchiveText(item);if(!oldArchiveText)return unified;try{const base=String(oldArchiveText(item)||'');return archiveEvidenceBadges(item).length?unified:(base||unified)}catch{return unified}};try{archiveText=W.archiveText}catch{}}

  function renderUnifiedArchive(){const list=$('archiveList'),count=$('archiveCount'),search=$('archiveSearch');if(!list||!count)return;const all=typeof W.getArchive==='function'?W.getArchive():readRows(ARCHIVE_KEY),query=String(search?.value||'').trim().toLowerCase();const rows=all.filter(item=>{if(!query)return true;return [item?.title,item?.q,item?.ai,...archiveEvidenceBadges(item),item?.legacyImportedText].join(' ').toLowerCase().includes(query)});count.textContent=`${all.length}건`;list.innerHTML='';if(!all.length&&location.hostname.includes('onrender.com')){const note=document.createElement('div');note.className='lunea-v43-archive-note';note.textContent='현재 Render 주소는 예전 GitHub Pages 홈화면 앱과 저장공간이 달라. 예전 기록이 삭제된 게 아니라 기존 주소의 localStorage에 남아 있을 수 있어. 기존 앱을 지우지 말고, 거기서 “전체 복사” 후 여기의 “기존 기록 붙여넣기”를 사용해.';list.appendChild(note)}rows.forEach(item=>{const el=document.createElement('div');el.className='archive-item';const badges=archiveEvidenceBadges(item);el.innerHTML=`<div class="archive-meta">${esc(item?.date||(item?.createdAt?new Date(item.createdAt).toLocaleString('ko-KR'):''))}</div><div class="archive-title">${esc(item?.title||'LUNEA 기록')}</div><div class="archive-q">${esc(item?.q||'')}</div>${badges.length?`<div class="lunea-v43-archive-badges">${badges.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}<div class="lunea-v43-archive-actions"><button class="mini" data-v43="detail">전체 근거 펼치기</button><button class="mini" data-v43="copy">복사</button><button class="mini danger" data-v43="delete">삭제</button></div><div class="archive-detail lunea-v43-archive-extra"></div>`;const detail=el.querySelector('.archive-detail');el.addEventListener('click',async event=>{const button=event.target?.closest?.('[data-v43]');if(!button)return;const action=button.dataset.v43;if(action==='detail'){const opening=!detail.classList.contains('open');if(opening&&!detail.dataset.loaded){detail.textContent=unifiedArchiveText(item);detail.dataset.loaded='1'}detail.classList.toggle('open',opening);button.textContent=opening?'접기':'전체 근거 펼치기'}else if(action==='copy'){try{await navigator.clipboard.writeText(unifiedArchiveText(item));alert('기록 전체를 복사했어.')}catch{alert('복사 권한을 확인해줘.')}}else if(action==='delete'){if(!confirm('이 기록을 삭제할까?'))return;const next=all.filter(x=>x?.id!==item?.id);if(typeof W.setArchive==='function')W.setArchive(next);else localStorage.setItem(ARCHIVE_KEY,JSON.stringify(next));renderUnifiedArchive()}});list.appendChild(el)})}
  function parseLegacyClipboard(text){const raw=String(text||'').trim();if(!raw)return[];const chunks=raw.split(/\n\s*[─━—-]{6,}\s*\n/g).map(x=>x.trim()).filter(Boolean);return chunks.map((chunk,index)=>{const lines=chunk.split('\n').map(x=>x.trim()).filter(Boolean),qLine=lines.find(x=>/^질문\s*:/.test(x));return{id:stableId(),createdAt:Date.now()-index,date:lines[0]||new Date().toLocaleString('ko-KR'),title:lines[1]||'기존 LUNEA 기록',q:qLine?qLine.replace(/^질문\s*:\s*/,''):'',cards:[],ai:'',legacyImportedText:chunk,importedFrom:'legacy-origin-clipboard-v43'}})}
  async function importLegacyClipboard(){let text='';try{text=await navigator.clipboard.readText()}catch{}if(!text)text=prompt('기존 LUNEA 기록함에서 “전체 복사”한 내용을 여기에 붙여넣어줘.')||'';const imported=parseLegacyClipboard(text);if(!imported.length)return alert('가져올 기록 텍스트를 찾지 못했어.');const current=typeof W.getArchive==='function'?W.getArchive():readRows(ARCHIVE_KEY),merged=dedupeRows([...imported,...current]);if(typeof W.setArchive==='function')W.setArchive(merged);else localStorage.setItem(ARCHIVE_KEY,JSON.stringify(merged));renderUnifiedArchive();alert(`기존 기록 ${imported.length}건을 가져왔어.`)}
  function restoreSafetyBackup(){const backup=readRows(ARCHIVE_BACKUP_KEY);if(!backup.length)return alert('이 주소에 남아 있는 안전 백업이 없어.');const current=typeof W.getArchive==='function'?W.getArchive():readRows(ARCHIVE_KEY),merged=dedupeRows([...backup,...current]);if(typeof W.setArchive==='function')W.setArchive(merged);else localStorage.setItem(ARCHIVE_KEY,JSON.stringify(merged));renderUnifiedArchive();alert(`안전 백업에서 ${backup.length}건을 확인해서 합쳤어.`)}
  function installArchiveUI(){const archiveBtn=$('archiveBtn'),overlay=$('archiveOverlay'),search=$('archiveSearch'),copyAll=$('copyAllArchive'),clear=$('clearArchive');if(archiveBtn&&overlay){archiveBtn.onclick=()=>{renderUnifiedArchive();overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}}if(search)search.oninput=renderUnifiedArchive;if(copyAll)copyAll.onclick=async()=>{const rows=typeof W.getArchive==='function'?W.getArchive():readRows(ARCHIVE_KEY),text=rows.map(unifiedArchiveText).join('\n\n────────────\n\n');if(!text)return alert('기록이 없어.');try{await navigator.clipboard.writeText(text);alert('기록함 전체를 복사했어.')}catch{alert('복사 권한을 확인해줘.')}};if(clear)clear.onclick=()=>{if(!confirm('현재 주소의 기록함을 비울까? 안전 백업은 V43에 남겨둘게.'))return;if(typeof W.setArchive==='function')W.setArchive([]);else localStorage.setItem(ARCHIVE_KEY,'[]');renderUnifiedArchive()};const toolbar=document.querySelector('#archiveOverlay .archive-toolbar');if(toolbar&&!$('#luneaV43LegacyImport')){const importBtn=document.createElement('button');importBtn.type='button';importBtn.className='mini';importBtn.id='luneaV43LegacyImport';importBtn.textContent='기존 기록 붙여넣기';importBtn.onclick=importLegacyClipboard;const backupBtn=document.createElement('button');backupBtn.type='button';backupBtn.className='mini';backupBtn.id='luneaV43BackupRestore';backupBtn.textContent='안전 백업 복구';backupBtn.onclick=restoreSafetyBackup;toolbar.append(importBtn,backupBtn)}W.renderArchive=renderUnifiedArchive;try{renderArchive=renderUnifiedArchive}catch{}}
  function repairSaveChain(){const save=$('saveReading');if(!save||save.__luneaV43SaveGuard)return;save.__luneaV43SaveGuard=true;save.addEventListener('click',()=>{setTimeout(()=>{try{const rows=typeof W.getArchive==='function'?W.getArchive():readRows(ARCHIVE_KEY);if(rows.length){const backup=readRows(ARCHIVE_BACKUP_KEY);localStorage.setItem(ARCHIVE_BACKUP_KEY,JSON.stringify(dedupeRows([...rows,...backup])))}}catch{}},180)})}

  function boot(){addStyle();installAstroRetry();installArchiveProtection();installArchiveUI();repairSaveChain();installTimingGuard();reinforceCardBacks();setTimeout(()=>{installArchiveProtection();installArchiveUI();repairSaveChain();reinforceCardBacks();syncTimingArt()},500);W.addEventListener('pageshow',()=>{reinforceCardBacks();syncTimingArt();setTimeout(installArchiveUI,50)},{passive:true});W.LUNEA_EMERGENCY_REPAIR_V43=Object.freeze({version:RELEASE,renderArchive:renderUnifiedArchive,archiveText:unifiedArchiveText,syncTimingArt,importLegacyClipboard,restoreSafetyBackup});console.info('🛟 LUNEA Emergency Repair V43 loaded')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();