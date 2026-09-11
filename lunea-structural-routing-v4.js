'use strict';
/* LUNEA deterministic recovery loader.
   Stage 1 lazy-runtime recovery: boot only the stable Home/Daily shell, then
   load feature groups only when the user enters the related surface.
   No document.write, nested loader, timestamp cache-bump, or background feature flood. */
(()=>{
  const W=window;
  if(W.__LUNEA_DETERMINISTIC_LOADER_V2__) return;
  W.__LUNEA_DETERMINISTIC_LOADER_V2__=true;

  try{clearTimeout(W.__LUNEA_BOOT_FAILSAFE__)}catch{}
  document.documentElement.classList.add('lunea-booting');
  document.documentElement.classList.remove('lunea-ui-ready');

  /* Final Home owners first. The boot curtain can lift as soon as this set is
     complete; feature/runtime helpers continue without holding first paint. */
  const HOME_VISUAL_SOURCES=[
    './lunea-luminous-theme-v1.js?v=101',
    './lunea-luminous-layout-v2.js?v=201',
    './lunea-luminous-polish-v3.js?v=301',
    './lunea-top-spacing-v4.js?v=401',
    './lunea-daily-lock-v1.js?v=101',
    './lunea-home-portal-v8.js?v=801',
    './lunea-intimacy-v34.js?v=d2198d8c5779',
    './lunea-intimacy-clean-v39.js?v=3901',
    './lunea-thai-standalone-v24.js?v=2401',
    './lunea-thai-art-v25.js?v=2501',
    './lunea-thai-art-polish-v26.js?v=2601',
    './lunea-home-timing-polish-v9.js?v=901',
    './lunea-category-art-v10.js?v=1001',
    './lunea-daily-orbit6-v21.js?v=2101',
    './lunea-daily-celestial-v22.js?v=2201',
    './lunea-sector-color-system-v28.js?v=2801',
    './lunea-profile-natal-v45.js?v=4501'
  ];

  const HOME_RUNTIME_SOURCES=[
    './lunea-gemini-model-picker-v1.js?v=101',
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-card-motion-timing-v7.js?v=701',
    './lunea-thai-tarot-bridge-v32.js?v=d2198d8c5779',
    './lunea-thai-range-v33.js?v=d2198d8c5779'
  ];

  // Audited UI only. No journal migration, timing fetch, AI or global observer.
  const SHELL_SOURCES=[
    './lunea-reading-draft-v1.js?v=101',
    './lunea-journal-header-fix-v1.js?v=101',
    './lunea-mobile-journal-polish-v27.js?v=2701',
    './lunea-journal-detail-v51.js?v=5101',
    './lunea-sheet-scroll-fix-v1.js?v=106',
    './lunea-cardback-restore-v19.js?v=d2198d8c5779',
    './lunea-cardback-sector-v20.js?v=2001'
  ];
  let shellPromise;
  let homeRuntimePromise;
  const readyGroups=new Set();

  const GROUPS={
    reading:[
      './lunea-runtime-state-v56.js?v=5601',
      './lunea-question-casebook-v1.js?v=101',
      './lunea-question-casebook-web-v1.js?v=101',
      './lunea-question-casebook-ranker-v1.js?v=101',
      './lunea-user-spread-learning-v1.js?v=108',
      './lunea-learning-success-gate-v1.js?v=101',
      './lunea-ai-spread-preflight-v2.js?v=105',
      './lunea-reading-flow-v5.js?v=501',
      './lunea-mobile-reading-controls-v12.js?v=1201',
      './lunea-opal-light-polish-v13.js?v=1301',
      './lunea-reading-polish-v14.js?v=1401',
      './lunea-flip-all-fix-v1.js?v=102',
      './lunea-universal-ai-opal-v20.js?v=2003',
      './lunea-fixed-spread-depth-v30.js?v=3003',
      './lunea-general-order-v30-5.js?v=3005',
      './lunea-reading-boundary-reset-v31.js?v=3102',
      './lunea-reading-action-order-v33.js?v=d2198d8c5779',
      './lunea-manual-structure-v1.js?v=105',
      './lunea-manual-everywhere-v1.js?v=103',
      './lunea-manual-library-v1.js?v=101',
      './lunea-manual-limit20-v17.js?v=1705',
      './lunea-final-prompt-priority-v1.js?v=d2198d8c5779'
    ],
    journal:[
      './lunea-manual-structure-v1.js?v=105',
      './lunea-manual-everywhere-v1.js?v=103',
      './lunea-manual-library-v1.js?v=101',
      './lunea-reading-journal-v2.js?v=201',
      './lunea-archive-search-v1.js?v=101',
      './lunea-manual-limit20-v17.js?v=1705'
    ],
    learning:[
      './lunea-question-casebook-v1.js?v=101',
      './lunea-question-casebook-web-v1.js?v=101',
      './lunea-question-casebook-ranker-v1.js?v=101',
      './lunea-user-spread-learning-v1.js?v=108',
      './lunea-learning-cloud-sync-v1.js?v=104',
      './lunea-learning-success-gate-v1.js?v=101'
    ],
    intimacy:[
      './lunea-intimacy-ai-bridge-v34.js?v=d2198d8c5779',
      './lunea-intimacy-legacy-v35.js?v=d2198d8c5779',
      './lunea-intimacy-oracle-v35.js?v=352',
      './lunea-intimacy-oracle-ui-v36.js?v=3614',
      './lunea-intimacy-readability-v36.js?v=d2198d8c5779',
      './lunea-intimacy-burgundy-v40.js?v=4005',
      './lunea-intimacy-repair-v43.js?v=4301'
    ],
    timing:[
      './lunea-timing-ab-v1.js?v=102',
      './lunea-timing-prompt-repair-v1.js?v=101',
      './lunea-timing-result-copy-v35.js?v=3501',
      './lunea-timing-moondial-sync-v15.js?v=1502',
      './lunea-timing-image-assets-v16.js?v=1602',
      './lunea-timing-ab-inline-v16.js?v=1601',
      './lunea-daily-timing-v49.js?v=4901',
      './lunea-draft-timing-v50.js?v=5001',
      './lunea-timing-uploaded-art-v58.js?v=5801',
      './lunea-recovery-ui-v65.js?v=6502'
    ],
    astro:[
      './lunea-horary-ab-v1.js?v=104',
      './lunea-horary-balance-v19-5.js?v=1905',
      './lunea-horary-question-modes-v37.js?v=3701',
      './lunea-horary-hardening-v38.js?v=3801',
      './lunea-horary-location-button-v39.js?v=3901',
      './lunea-horary-traditional-core-v40.js?v=4001',
      './lunea-horary-balance-guard-v41.js?v=4101',
      './lunea-horary-mobile-stability-v42.js?v=4201',
      './lunea-transit-range-v1.js?v=103',
      './lunea-transit-long-run-v1.js?v=102',
      './lunea-astro-job-queue-v56.js?v=5601',
      './lunea-astro-origin-failover-v57.js?v=5701',
      './lunea-astro-resume-v23.js?v=2301'
    ],
    finish:[
      './lunea-thai-date-display-v57.js?v=5701',
      './lunea-timing-result-copy-v35.js?v=3501',
      './lunea-recovery-finish-v59.js?v=5901'
    ]
  };

  const loaded=new Map();
  const groupPromises=new Map();

  function load(src){
    if(loaded.has(src)) return loaded.get(src);
    const promise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.async=false;
      s.dataset.luneaDeterministic='1';
      s.onload=()=>resolve(true);
      s.onerror=()=>{loaded.delete(src);s.remove();reject(new Error('Script failed: '+src))};
      (document.head||document.documentElement).appendChild(s);
    });
    loaded.set(src,promise);
    return promise;
  }

  async function loadGroup(name){
    if(groupPromises.has(name)) return groupPromises.get(name);
    if(!Object.hasOwn(GROUPS,name)) return false;
    const sources=GROUPS[name];
    const promise=(async()=>{
      await shellPromise;
      if(name!=='journal'&&name!=='learning') await homeRuntimePromise;
      document.documentElement.dataset.luneaLoadingGroup=name;
      for(const src of sources) await load(src);
      if(name==='timing'){
        const timingReady=await W.LUNEA_RECOVERY_UI_V65?.ready;
        if(!timingReady) throw new Error('Timing authoritative artwork unavailable');
      }
      W.LUNEA_FINAL_PROMPT_PRIORITY_V1?.ensure?.();
      if(document.documentElement.dataset.luneaLoadingGroup===name) delete document.documentElement.dataset.luneaLoadingGroup;
      readyGroups.add(name);
      W.dispatchEvent(new CustomEvent('lunea:feature-group-ready',{detail:{name}}));
      return true;
    })().catch(err=>{
      groupPromises.delete(name);
      console.error('[LUNEA deterministic group]',name,err);
      if(document.documentElement.dataset.luneaLoadingGroup===name) delete document.documentElement.dataset.luneaLoadingGroup;
      return false;
    });
    groupPromises.set(name,promise);
    return promise;
  }

  W.LUNEA_LOAD_FEATURE_GROUP=loadGroup;
  W.LUNEA_FEATURE_GROUPS=Object.freeze(Object.keys(GROUPS));

  const homeLooksReady=()=>!!(
    document.querySelector('#luneaHomePortalV8 .lunea-v8-tile') &&
    document.querySelector('.daily.lunea-daily-orbit6 .lunea-daily-six-grid') &&
    document.querySelector('.daily.lunea-daily-orbit6 .lunea-v22-sky') &&
    document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]') &&
    document.querySelector('.daily[data-lunea-sector="daily"]') &&
    W.__LUNEA_PROFILE_NATAL_V45__ &&
    /DAILY ORBIT 6/i.test(document.querySelector('.daily h3')?.textContent||'')
  );

  function applyStaticHomeBranding(){
    const holder=document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object');
    if(!holder) return false;
    let img=holder.querySelector('img');
    if(!img){
      img=document.createElement('img');
      img.alt='';
      img.setAttribute('aria-hidden','true');
      holder.replaceChildren(img);
    }
    const src='./assets/intimacy-oracle/intimacy_sector_final.png?v=lazy-shell-1';
    if(img.getAttribute('src')!==src) img.setAttribute('src',src);
    img.style.width='100%';
    img.style.height='100%';
    img.style.objectFit='cover';
    img.style.borderRadius='inherit';
    img.style.transform='scale(1.20)';
    return true;
  }

  function revealHome(){
    if(!homeLooksReady()) return false;
    document.documentElement.dataset.luneaHomeReady='1';
    document.documentElement.classList.remove('lunea-booting');
    document.documentElement.classList.add('lunea-ui-ready');
    try{clearTimeout(W.__LUNEA_BOOT_FAILSAFE__)}catch{}
    W.dispatchEvent(new CustomEvent('lunea:home-ready'));
    return true;
  }

  function groupForTarget(target){
    const el=target?.closest?.('button,[role="button"],a,.lunea-v8-tile,#profileStrip');
    if(!el) return null;
    const id=String(el.id||'');
    const key=String(el.dataset?.key||'').toLowerCase();
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim();

    if(id==='luneaDraftRestore' || id==='drawBtn' || id==='aiRead' || id==='copyPrompt') return 'reading';
    /* Profile shell, V45 picker and the eager Natal client are Home-ready.
       Only genuinely lazy astrology surfaces should enter the Astro group. */
    if(id==='luneaThaiHomeTileV24' || /Thai|태국점성술|Taksa/i.test(text)) return 'finish';
    if(key==='timing' || /TIMING ORACLE|Astro Timing|시기 오라클/i.test(text)) return 'timing';
    if(key==='horary' || /HORARY|호라리|Returns?|Transit/i.test(text)) return 'astro';
    if(key==='intimacy' || /INTIMACY/i.test(text)) return 'intimacy';
    if(/기록함|JOURNAL|ARCHIVE|LIBRARY|저장 기록/i.test(text) || /journal|archive|library/i.test(id)) return 'journal';
    if(/학습|LEARNING|CASEBOOK/i.test(text) || /learn|casebook/i.test(id)) return 'learning';
    if(el.closest('#luneaHomePortalV8') || el.closest('#spreadOverlay') || el.closest('.category')) return 'reading';
    return null;
  }

  function installLazyTriggers(){
    const ensure=name=>name==='journal'||name==='learning'||name==='finish'
      ? loadGroup(name)
      : loadGroup('reading').then(ok=>ok&&loadGroup(name));
    const ready=name=>name==='journal'||name==='learning'||name==='finish'
      ? readyGroups.has(name)
      : readyGroups.has('reading')&&(name==='reading'||readyGroups.has(name));
    const replaying=new WeakSet();
    const pending=new WeakSet();
    const prime=e=>{
      const name=groupForTarget(e.target);
      if(name) ensure(name);
    };
    const gate=e=>{
      const target=e.target instanceof Element?e.target:null;
      const trigger=target?.closest?.('button,[role="button"],a,.lunea-v8-tile,#profileStrip');
      if(!trigger||replaying.has(trigger)) return;
      const name=groupForTarget(trigger);
      if(!name) return;
      /* Opening a category is navigation, not a reading. Prime its runtime on
         pointerdown, but let the first tap reveal the category immediately. */
      if(name==='reading' && (trigger.matches('#luneaHomePortalV8 .lunea-v8-tile') || trigger.matches('.category-header'))) return;
      if(ready(name)){
        W.LUNEA_FINAL_PROMPT_PRIORITY_V1?.ensure?.();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if(pending.has(trigger)) return;
      pending.add(trigger);
      trigger.setAttribute('aria-busy','true');
      let pendingOverlay=null;
      if(name==='journal' && trigger.id==='archiveBtn'){
        pendingOverlay=document.getElementById('archiveOverlay');
        W.showOverlay?.('archiveOverlay');
        pendingOverlay?.setAttribute('aria-busy','true');
      }
      ensure(name).then(ok=>{
        pending.delete(trigger);
        trigger.removeAttribute('aria-busy');
        pendingOverlay?.removeAttribute('aria-busy');
        if(!ok||!trigger.isConnected){
          if(pendingOverlay?.classList.contains('show')) W.hideOverlay?.(pendingOverlay.id);
          return;
        }
        if(pendingOverlay && !pendingOverlay.classList.contains('show')) return;
        W.LUNEA_FINAL_PROMPT_PRIORITY_V1?.ensure?.();
        replaying.add(trigger);
        trigger.click();
        queueMicrotask(()=>replaying.delete(trigger));
      });
    };
    document.addEventListener('pointerdown',prime,{capture:true,passive:true});
    document.addEventListener('focusin',prime,true);
    document.addEventListener('click',gate,true);
  }

  async function boot(){
    if(document.readyState==='loading') await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));

    /* async=false preserves insertion-order execution for these dynamic classic
       scripts; start their fetches together so Home readiness is not gated by
       seventeen serial network round trips. */
    await Promise.all(HOME_VISUAL_SOURCES.map(load));
    if(!homeLooksReady()) console.warn('[LUNEA deterministic] home readiness markers incomplete; keeping legacy shell hidden');
    applyStaticHomeBranding();
    revealHome();

    shellPromise=(async()=>{
      for(const src of SHELL_SOURCES) await load(src);
      applyStaticHomeBranding();
      document.documentElement.dataset.luneaShellReady='1';
      W.dispatchEvent(new CustomEvent('lunea:shell-ready'));
    })();
    homeRuntimePromise=(async()=>{
      for(const src of HOME_RUNTIME_SOURCES) await load(src);
      document.documentElement.dataset.luneaHomeRuntimeReady='1';
      W.dispatchEvent(new CustomEvent('lunea:home-runtime-ready'));
    })();
    installLazyTriggers();
    await Promise.all([shellPromise,homeRuntimePromise]);
    /* Stop after the finite shell. Feature groups require user intent. */
    document.documentElement.dataset.luneaDeterministicReady='1';
    document.documentElement.dataset.luneaLazyRuntime='1';
    W.dispatchEvent(new CustomEvent('lunea:deterministic-ready'));
  }

  boot().catch(err=>{
    console.error('[LUNEA deterministic]',err);
  });
})();
