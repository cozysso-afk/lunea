'use strict';

/*
  LUNEA INTIMACY AI BRIDGE V34.2
  ===============================
  Integration bridge for the existing V34 78-card intimacy layer.

  - adds an AI custom-spread entry to the dedicated INTIMACY cabinet;
  - preserves INTIMACY interpretation after the AI designer replaces the title;
  - recognizes restored AI intimacy readings from their question text;
  - keeps the legacy anatomical 9-card reading hidden;
  - loads the canonical V35.2 Oracle data + V36 runtime only after the late
    reading-action wrappers are installed, preserving final wrapper order.
*/
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_AI_BRIDGE_V34__) return;
  W.__LUNEA_INTIMACY_AI_BRIDGE_V34__ = true;

  const RELEASE = '34.2';
  const ACK_KEY = 'LUNEA_INTIMACY_ADULT_ACK_V1';
  const ORACLE_SOURCES = Object.freeze([
    './lunea-intimacy-oracle-v35.js?v=352',
    './lunea-intimacy-oracle-ui-v36.js?v=3612'
  ]);
  let active = false;
  let oracleLoadPromise = null;

  function api() { return W.LUNEA_INTIMACY_V34 || null; }
  function isIntimacyQuestion(input) {
    return /속궁합|잠자리|섹스|성적\s*(?:궁합|끌림|욕구|텐션)|신체적\s*(?:궁합|끌림|밀착)|친밀감|육체적\s*(?:끌림|케미)|욕구\s*(?:방식|차이)|스킨십/i.test(String(input || '').normalize('NFKC'));
  }
  function acknowledged() { try { return localStorage.getItem(ACK_KEY) === '1'; } catch { return false; } }
  function requestAdultAcknowledgement() {
    if (acknowledged()) return true;
    const ok = typeof confirm === 'function' ? confirm('INTIMACY 18+는 성인 사용자 전용 친밀감 리딩이야. 성인 간의 합의된 관계와 친밀감 질문에만 사용해줘. 계속할까?') : true;
    if (!ok) return false;
    try { localStorage.setItem(ACK_KEY, '1'); } catch {}
    return true;
  }
  function setActive(value) {
    active = !!value;
    W.__LUNEA_INTIMACY_ACTIVE__ = active;
    document.body?.classList?.toggle('lunea-intimacy-reading', active);
  }
  function isActiveContext() {
    try {
      const title = String(state?.title || '');
      const fixed = !!api()?.getSpread?.(title);
      return active || String(state?.category || '').toUpperCase() === 'INTIMACY' || fixed || isIntimacyQuestion(state?.question || '');
    } catch { return active; }
  }

  function hideLegacy() {
    const legacy = document.querySelector('.reading-item[data-title="속궁합 · 19+"]');
    if (!legacy) return;
    legacy.hidden = true;
    legacy.style.setProperty('display', 'none', 'important');
    legacy.dataset.luneaLegacyIntimacyHidden = '1';
  }

  function installAiEntry() {
    const content = document.querySelector('.lunea-intimacy-category .category-content');
    if (!content || content.querySelector('[data-intimacy-ai="1"]')) return;
    const item = document.createElement('div');
    item.className = 'reading-item lunea-intimacy-ai-item';
    item.dataset.cat = 'INTIMACY';
    item.dataset.intimacyAi = '1';
    item.dataset.title = 'AI 맞춤 INTIMACY 배열';
    item.dataset.desc = '질문의 친밀감 초점을 분석해 기존 배열 학습 데이터를 활용한 맞춤 포지션을 설계합니다.';
    item.dataset.count = '0';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = '<div><h4>AI 맞춤 INTIMACY 배열</h4><p>질문 맞춤 · 끌림 · 리듬 · 경계 · 만족</p></div><div class="count">AI</div>';
    const open = () => {
      if (!requestAdultAcknowledgement()) return;
      setActive(true);
      if (typeof openSheet !== 'function') return;
      openSheet('INTIMACY', item.dataset.title, item.dataset.desc, 0);
      try {
        state.category = 'INTIMACY';
        state.__luneaIntimacyReading = true;
      } catch {}
      const sheetCat = document.getElementById('sheetCat');
      if (sheetCat) sheetCat.textContent = 'INTIMACY 18+';
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    content.prepend(item);
  }

  function installContextTracking() {
    if (document.documentElement.dataset.luneaIntimacyContextV34 === '1') return;
    document.documentElement.dataset.luneaIntimacyContextV34 = '1';
    document.addEventListener('click', event => {
      const item = event.target?.closest?.('.reading-item');
      if (!item) return;
      const isIntimacy = String(item.dataset.cat || '').toUpperCase() === 'INTIMACY';
      setActive(isIntimacy);
      if (isIntimacy) {
        try { state.category = 'INTIMACY'; } catch {}
      }
    }, true);
  }

  function patchPrompt() {
    if (typeof promptString !== 'function' || promptString.__luneaIntimacyAiBridgeV34) return;
    const base = promptString;
    const wrapped = function() {
      const master = base();
      if (!isActiveContext()) return master;
      if (/\[LUNEA INTIMACY 18\+ INTERPRETATION LAYER/.test(master)) return master;
      const intimacy = api();
      if (!intimacy?.buildPromptLayer) return master;
      let drawn = [], title = '', question = '';
      try { drawn = state?.drawn || []; title = state?.title || ''; question = state?.question || ''; } catch {}
      return `${master}\n\n${intimacy.buildPromptLayer(drawn, title, question)}`;
    };
    wrapped.__luneaIntimacyAiBridgeV34 = true;
    promptString = wrapped;
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const clean = String(src).split('?')[0].replace(/^\.\//, '');
      const existing = Array.from(document.scripts || []).find(script => String(script.src || '').includes(clean));
      if (existing) {
        if (existing.dataset.luneaLoaded === '1' || existing.readyState === 'complete') return resolve();
        existing.addEventListener('load', resolve, {once:true});
        existing.addEventListener('error', () => reject(new Error('Failed to load ' + src)), {once:true});
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.luneaIntimacyOracleRuntime = '1';
      script.addEventListener('load', () => { script.dataset.luneaLoaded = '1'; resolve(); }, {once:true});
      script.addEventListener('error', () => reject(new Error('Failed to load ' + src)), {once:true});
      document.head.appendChild(script);
    });
  }

  function ensureOracleRuntime() {
    if (W.LUNEA_INTIMACY_ORACLE_UI_V36) return Promise.resolve();
    if (oracleLoadPromise) return oracleLoadPromise;
    oracleLoadPromise = ORACLE_SOURCES.reduce((promise, src) => promise.then(() => loadScriptOnce(src)), Promise.resolve()).catch(err => {
      oracleLoadPromise = null;
      console.error('[LUNEA INTIMACY] Oracle runtime load failed', err);
      throw err;
    });
    return oracleLoadPromise;
  }

  function scheduleOracleRuntimeLoad() {
    let tries = 0;
    const attempt = () => {
      tries += 1;
      if (W.__LUNEA_READING_ACTION_ORDER_V33__ || tries >= 160) {
        ensureOracleRuntime().catch(() => {});
        return;
      }
      setTimeout(attempt, 25);
    };
    attempt();
  }

  function boot() {
    hideLegacy();
    installAiEntry();
    installContextTracking();
    patchPrompt();
    scheduleOracleRuntimeLoad();
    W.LUNEA_INTIMACY_AI_BRIDGE_V34 = Object.freeze({ version: RELEASE, isIntimacyQuestion, isActiveContext, installAiEntry, ensureOracleRuntime, oracleSources:[...ORACLE_SOURCES] });
    console.info(`🌹 LUNEA INTIMACY AI bridge V${RELEASE} ready`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
