from pathlib import Path


def replace_exact(path, old, new, expected=1):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} occurrence(s), found {count}: {old[:100]!r}')
    p.write_text(text.replace(old, new), encoding='utf-8')
    print(f'patched {path}: {expected}')

# 1) INTIMACY Oracle runtime: exact, RNG-free draft hydrate.
path='lunea-intimacy-oracle-ui-v36.js'
old="function serializeOracle(){return reading.cards.length?{version:RELEASE,mode:reading.mode,cards:reading.cards.map(c=>({code:c.code,enTitle:c.enTitle,koTitle:c.koTitle,lens:c.lens})),extraCards:reading.extraCards.map(c=>({code:c.code,enTitle:c.enTitle,koTitle:c.koTitle,lens:c.lens})),revealed:[...reading.revealed],extraRevealed:[...reading.extraRevealed]}:null}\n"
new=old+"function serializeOracleDraft(){const s=stateNow();if(!s||!intimacy())return null;return{version:2,runtimeVersion:RELEASE,mode:reading.mode,cards:reading.cards.map(c=>({code:c.code,lens:c.lens})),extraCards:reading.extraCards.map(c=>({code:c.code,lens:c.lens})),revealed:[...reading.revealed],extraRevealed:[...reading.extraRevealed],stamp:stamp(s)}}\nfunction restoreSerializedOracle(snapshot){const s=stateNow();if(!s||!snapshot||typeof snapshot!=='object')return false;const mode=[0,1,3].includes(+snapshot.mode)?+snapshot.mode:null;if(mode===null)return false;const currentStamp=stamp(s);if(mode===0){reading={mode:0,cards:[],extraCards:[],revealed:new Set(),extraRevealed:new Set(),stamp:currentStamp};renderOraclePanel();syncModeButtons();return true}const cards=hydrateSavedCards(snapshot.cards||[],false);if(cards.length!==mode)return false;const used=new Set(cards.map(c=>String(c.code))),extraCards=[];for(const c of hydrateSavedCards(snapshot.extraCards||[],true)){const code=String(c.code||'');if(!code||used.has(code))continue;used.add(code);extraCards.push(c);if(extraCards.length>=MAX_EXTRA)break}const revealed=new Set((snapshot.revealed||[]).map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<cards.length));const extraRevealed=new Set((snapshot.extraRevealed||[]).map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<extraCards.length));reading={mode,cards,extraCards,revealed,extraRevealed,stamp:currentStamp};renderOraclePanel();syncModeButtons();saveSidecar();return true}\n"
replace_exact(path,old,new)
old="function boot(){reading.mode=readMode();installStyles();ensureSheetTools();ensurePanel();patchTarotBack();patchPrompt();patchArchive();installObservers();document.addEventListener('click',e=>{if(e.target.closest?.('.reading-item'))queueMicrotask(()=>{syncSheet();ensureSheetTools()})},true);syncSheet();W.LUNEA_INTIMACY_ORACLE_UI_V36=Object.freeze({version:RELEASE,performOracleDraw,addSupplementalOracle,buildOraclePromptLayer,serializeOracle,prepareSheetTools,clear:clearOracleState,sync:syncOracleToCards,getState:()=>({mode:reading.mode,cards:[...reading.cards],extraCards:[...reading.extraCards],revealed:new Set(reading.revealed),extraRevealed:new Set(reading.extraRevealed),stamp:reading.stamp})});console.info(`🌹 LUNEA INTIMACY ORACLE UI V${RELEASE} ready · base 1/3 + supplemental max ${MAX_EXTRA} · no startSpread wrapper`)}"
new="function boot(){reading.mode=readMode();installStyles();ensureSheetTools();ensurePanel();patchTarotBack();patchPrompt();patchArchive();installObservers();document.addEventListener('click',e=>{if(e.target.closest?.('.reading-item'))queueMicrotask(()=>{syncSheet();ensureSheetTools()})},true);syncSheet();W.LUNEA_INTIMACY_ORACLE_UI_V36=Object.freeze({version:RELEASE,performOracleDraw,addSupplementalOracle,buildOraclePromptLayer,serializeOracle,serializeOracleDraft,restoreSerializedOracle,prepareSheetTools,clear:clearOracleState,sync:syncOracleToCards,getState:()=>({mode:reading.mode,cards:[...reading.cards],extraCards:[...reading.extraCards],revealed:new Set(reading.revealed),extraRevealed:new Set(reading.extraRevealed),stamp:reading.stamp})});console.info(`🌹 LUNEA INTIMACY ORACLE UI V${RELEASE} ready · base 1/3 + supplemental max ${MAX_EXTRA} · no startSpread wrapper`)}"
replace_exact(path,old,new)

# 2) Bridge: version gate, parent-build token, pending exact restore.
path='lunea-intimacy-ai-bridge-v34.js'
old="""  const RELEASE = '34.4';
  const ACK_KEY = 'LUNEA_INTIMACY_ADULT_ACK_V1';
  const ORACLE_SOURCES = Object.freeze([
    './lunea-intimacy-oracle-v35.js?v=352',
    './lunea-intimacy-oracle-ui-v36.js?v=3615'
  ]);
  let active = false;
  let oracleLoadPromise = null;
"""
new="""  const RELEASE = '34.4';
  const ACK_KEY = 'LUNEA_INTIMACY_ADULT_ACK_V1';
  const EXPECTED_ORACLE_VERSION = '36.5';
  const SELF_BUILD = (() => { try { const src=document.currentScript?.src||''; return src ? (new URL(src,location.href).searchParams.get('v')||'') : ''; } catch { return ''; } })();
  const ORACLE_SOURCES = Object.freeze([
    './lunea-intimacy-oracle-v35.js?v=352',
    `./lunea-intimacy-oracle-ui-v36.js?v=${encodeURIComponent(SELF_BUILD || '3615')}`
  ]);
  let active = false;
  let oracleLoadPromise = null;
  let pendingOracleRestore = null;

  function oracleRuntimeReady(){return W.LUNEA_INTIMACY_ORACLE_UI_V36?.version===EXPECTED_ORACLE_VERSION;}
  function requestFreshDocument(reason='stale-intimacy-oracle'){W.__LUNEA_INTIMACY_ORACLE_STALE__=String(reason);try{W.LUNEA_CACHE_REFRESH_V1?.requestFreshDocument?.(reason)}catch{}}
  function cloneSnapshot(value){try{return JSON.parse(JSON.stringify(value))}catch{return null}}
  function serializeOracleDraft(){if(!isActiveContext())return null;try{return cloneSnapshot(W.LUNEA_INTIMACY_ORACLE_UI_V36?.serializeOracleDraft?.()||null)}catch{return null}}
  function applyPendingOracleRestore(){if(!pendingOracleRestore||!oracleRuntimeReady())return false;const snapshot=pendingOracleRestore;let applied=false;try{applied=!!W.LUNEA_INTIMACY_ORACLE_UI_V36.restoreSerializedOracle?.(snapshot)}catch(err){console.warn('[LUNEA INTIMACY] Oracle exact restore failed',err)}if(applied)pendingOracleRestore=null;return applied}
  function restoreOracleDraft(snapshot){const cloned=cloneSnapshot(snapshot);if(!cloned)return false;pendingOracleRestore=cloned;if(oracleRuntimeReady())return applyPendingOracleRestore();ensureOracleRuntime().catch(()=>{});return true}
"""
replace_exact(path,old,new)
old="""  function syncOracleRuntimeToCurrentReading() {
    try {
      W.LUNEA_INTIMACY_ORACLE_UI_V36?.sync?.();
    } catch (err) {
      console.warn('[LUNEA INTIMACY] Oracle late-runtime sync failed', err);
    }
  }
"""
new="""  function syncOracleRuntimeToCurrentReading() {
    try {
      if(!oracleRuntimeReady())return false;
      if(applyPendingOracleRestore())return true;
      W.LUNEA_INTIMACY_ORACLE_UI_V36?.sync?.();
      return true;
    } catch (err) {
      console.warn('[LUNEA INTIMACY] Oracle late-runtime sync failed', err);
      return false;
    }
  }
"""
replace_exact(path,old,new)
old="""  function ensureOracleRuntime() {
    if (W.LUNEA_INTIMACY_ORACLE_UI_V36) {
      syncOracleRuntimeToCurrentReading();
      return Promise.resolve();
    }
    if (oracleLoadPromise) return oracleLoadPromise;
    oracleLoadPromise = ORACLE_SOURCES
      .reduce((promise, src) => promise.then(() => loadScriptOnce(src)), Promise.resolve())
      .then(() => { syncOracleRuntimeToCurrentReading(); })
      .catch(err => {
        oracleLoadPromise = null;
        console.error('[LUNEA INTIMACY] Oracle runtime load failed', err);
        throw err;
      });
    return oracleLoadPromise;
  }
"""
new="""  function ensureOracleRuntime() {
    if (W.LUNEA_INTIMACY_ORACLE_UI_V36 && !oracleRuntimeReady()) {
      requestFreshDocument(`oracle-${W.LUNEA_INTIMACY_ORACLE_UI_V36?.version||'unknown'}-expected-${EXPECTED_ORACLE_VERSION}`);
      return Promise.resolve(false);
    }
    if (oracleRuntimeReady()) {
      syncOracleRuntimeToCurrentReading();
      return Promise.resolve(true);
    }
    if (oracleLoadPromise) return oracleLoadPromise;
    oracleLoadPromise = ORACLE_SOURCES
      .reduce((promise, src) => promise.then(() => loadScriptOnce(src)), Promise.resolve())
      .then(() => { if(!oracleRuntimeReady()){requestFreshDocument('oracle-runtime-version-mismatch');return false}syncOracleRuntimeToCurrentReading();return true; })
      .catch(err => {
        oracleLoadPromise = null;
        console.error('[LUNEA INTIMACY] Oracle runtime load failed', err);
        throw err;
      });
    return oracleLoadPromise;
  }
"""
replace_exact(path,old,new)
old="""    scheduleOracleRuntimeLoad();
    W.LUNEA_INTIMACY_AI_BRIDGE_V34 = Object.freeze({ version: RELEASE, isIntimacyQuestion, isActiveContext, installAiEntry, ensureOracleRuntime, oracleSources:[...ORACLE_SOURCES] });
"""
new="""    scheduleOracleRuntimeLoad();
    if(W.__LUNEA_PENDING_INTIMACY_ORACLE_DRAFT_V2__){pendingOracleRestore=cloneSnapshot(W.__LUNEA_PENDING_INTIMACY_ORACLE_DRAFT_V2__);delete W.__LUNEA_PENDING_INTIMACY_ORACLE_DRAFT_V2__;}
    W.LUNEA_INTIMACY_AI_BRIDGE_V34 = Object.freeze({ version: RELEASE, expectedOracleVersion:EXPECTED_ORACLE_VERSION, isIntimacyQuestion, isActiveContext, installAiEntry, ensureOracleRuntime, serializeOracleDraft, restoreOracleDraft, oracleSources:[...ORACLE_SOURCES] });
"""
replace_exact(path,old,new)

# 3) LAST READING v2 with first-class INTIMACY Oracle snapshot.
path='lunea-reading-draft-v1.js'
old="""  function currentAIText() {
    const el = $('aiText');
    if (!el) return '';
    const text = String(el.textContent || '').trim();
    if (!text || /카드 간 중첩과 반증을 확인하는 중/.test(text)) return '';
    return text;
  }
"""
new=old+"\n  function currentIntimacyOracle(s){if(String(s?.category||'').toUpperCase()!=='INTIMACY')return null;try{return clone(W.LUNEA_INTIMACY_AI_BRIDGE_V34?.serializeOracleDraft?.()??W.LUNEA_INTIMACY_ORACLE_UI_V36?.serializeOracleDraft?.()??null)}catch{return null}}\n"
replace_exact(path,old,new)
replace_exact(path,"      version: 1,","      version: 2,")
old="      manualPositions: clone(s.__luneaManualPositions || null)\n"
new="      manualPositions: clone(s.__luneaManualPositions || null),\n      intimacyOracle: currentIntimacyOracle(s)\n"
replace_exact(path,old,new)
old="""  function clearDraft() {
    try { localStorage.removeItem(KEY); } catch {}
    renderResumeBar();
  }
"""
new="""  function clearDraft() {
    const d=readDraft();
    try { localStorage.removeItem(KEY); if(d?.intimacyOracle)localStorage.removeItem('LUNEA_INTIMACY_ORACLE_DRAFT_V1'); } catch {}
    renderResumeBar();
  }
"""
replace_exact(path,old,new)
old="        restoreAI(d.aiText || '');\n        restoring = false;"
new="        restoreAI(d.aiText || '');\n        if(d.intimacyOracle){const snapshot=clone(d.intimacyOracle);const bridge=W.LUNEA_INTIMACY_AI_BRIDGE_V34;if(bridge?.restoreOracleDraft)bridge.restoreOracleDraft(snapshot);else W.__LUNEA_PENDING_INTIMACY_ORACLE_DRAFT_V2__=snapshot;}\n        restoring = false;"
replace_exact(path,old,new)
replace_exact(path,"#extraCard,#flipAll,[data-clarify],#aiRead,#retry","#extraCard,#flipAll,[data-clarify],#aiRead,#retry,#luneaOracleAddExtra,#luneaOracleRevealAll,.lio-card,[data-lio-mode]")

# 4) PWA foreground build re-check, deferred until safe UI boundary.
path='lunea-cache-refresh-v1.js'
replace_exact(path,"  const BUILD_FILE = './lunea-build.json';\n","  const BUILD_FILE = './lunea-build.json';\n  let pendingRefresh = null;\n  let checkPromise = null;\n  let lastCheckAt = 0;\n")
old="""  function refreshTo(build) {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('lunea_v') === build) return;
      url.searchParams.set('lunea_v', build);
      url.searchParams.set('fresh', String(Date.now()));
      location.replace(url.toString());
    } catch { location.reload(); }
  }

  async function checkBuild() {
    try {
      const res = await fetch(`${BUILD_FILE}?t=${Date.now()}`, {
        cache:'no-store',
        headers:{'cache-control':'no-cache','accept':'application/json'}
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;
      const remote = String(data?.version || '').trim();
      if (!remote) return;
      const embedded = currentPageBuild();
      if (embedded && embedded !== remote) refreshTo(remote);
    } catch (err) {
      console.info('[LUNEA cache refresh] skipped', err?.message || err);
    }
  }
"""
new="""  function readingBusy(){return !!document.hidden||!!document.getElementById('spreadOverlay')?.classList.contains('show')||!!document.getElementById('sheet')?.classList.contains('open')}
  function refreshTo(build,force=false) {
    try {
      const url = new URL(location.href);
      if (!force && url.searchParams.get('lunea_v') === build) return;
      url.searchParams.set('lunea_v', build);
      url.searchParams.set('fresh', String(Date.now()));
      location.replace(url.toString());
    } catch { location.reload(); }
  }

  function queueRefresh(build,force=false){if(!build)return false;if(readingBusy()){pendingRefresh={build,force:!!force};return false}pendingRefresh=null;refreshTo(build,force);return true}
  function flushPending(){if(!pendingRefresh||readingBusy())return false;const next=pendingRefresh;pendingRefresh=null;refreshTo(next.build,next.force);return true}

  function checkBuild(options={}) {
    const forceRefresh=!!options.forceRefresh,now=Date.now();
    if(checkPromise)return checkPromise;
    if(!forceRefresh&&now-lastCheckAt<1500)return Promise.resolve(false);
    lastCheckAt=now;
    checkPromise=(async()=>{try {
      const res = await fetch(`${BUILD_FILE}?t=${Date.now()}`, {
        cache:'no-store',
        headers:{'cache-control':'no-cache','accept':'application/json'}
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.error) return false;
      const remote = String(data?.version || '').trim();
      if (!remote) return false;
      const embedded = currentPageBuild();
      if (embedded && (embedded !== remote || forceRefresh)) queueRefresh(remote,forceRefresh);
      return true;
    } catch (err) {
      console.info('[LUNEA cache refresh] skipped', err?.message || err);
      return false;
    }finally{checkPromise=null}})();
    return checkPromise;
  }

  function installResumeBuildChecks(){window.addEventListener('pageshow',()=>{checkBuild();flushPending()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkBuild();flushPending()}});for(const id of ['spreadOverlay','sheet']){const el=document.getElementById(id);if(el)new MutationObserver(flushPending).observe(el,{attributes:true,attributeFilter:['class']})}}
  function requestFreshDocument(){return checkBuild({forceRefresh:true})}
"""
replace_exact(path,old,new)
old="""    loadEmergencyRepair();
    loadMobileRuntimeFixesV57();
    checkBuild();
"""
new="""    loadEmergencyRepair();
    loadMobileRuntimeFixesV57();
    installResumeBuildChecks();
    checkBuild();
    W.LUNEA_CACHE_REFRESH_V1=Object.freeze({checkNow:checkBuild,requestFreshDocument,flushPending});
"""
replace_exact(path,old,new)

# 5) Draft cache token now follows build-stamp workflow in both loader paths.
path='lunea-structural-routing-v4.js'
replace_exact(path,'lunea-reading-draft-v1.js?v=101','lunea-reading-draft-v1.js?v=c00880c7b22d',expected=2)

# 6) Keep draft cache token stamped on future main builds.
path='.github/workflows/bump-lunea-loader-413.yml'
old="              'lunea-intimacy-readability-v36.js',\n              'lunea-transit-range-v1.js',"
new="              'lunea-intimacy-readability-v36.js',\n              'lunea-reading-draft-v1.js',\n              'lunea-transit-range-v1.js',"
replace_exact(path,old,new)

print('INTIMACY candidate product patch applied in ephemeral checkout')
