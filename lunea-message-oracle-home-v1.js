/* Standalone Home entry for Message Oracle. Restores approved SIGNAL · MESSAGE surface. */
(() => {
  'use strict';
  const W = window;
  if (W.__LUNEA_MESSAGE_ORACLE_HOME_V1__) return;
  W.__LUNEA_MESSAGE_ORACLE_HOME_V1__ = true;

  const SECTION_ID = 'luneaSignalMessageSection';
  const ENTRY_ID = 'luneaMessageOracleEntry';
  const STATUS_ID = 'luneaMessageOracleLoadStatus';
  const LOGO_SRC = './assets/message-oracle/message_oracle_logo.png?v=101';
  const DRAFT_KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  let appObserver = null;
  let spreadObserver = null;
  let observedApp = null;
  let observedSpread = null;
  let syncQueued = false;
  let supportRecovery = null;

  function installStyle() {
    if (document.getElementById('luneaMessageOracleHomeV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaMessageOracleHomeV1Style';
    style.textContent = `
      #${SECTION_ID} .category-header{padding:24px 16px}
      #${SECTION_ID} .cat-left{min-width:0;gap:13px;align-items:center}
      #${SECTION_ID} .cat-text{min-width:0}
      #${SECTION_ID} .message-oracle-logo{display:block;object-fit:contain;background:transparent;filter:none}
      #${SECTION_ID} .message-oracle-home-logo{width:56px;height:56px;flex:0 0 56px}
      #${SECTION_ID} .cat-text h3{font-size:15.5px;line-height:1.25}
      #${SECTION_ID} .cat-text p{font-size:12px;line-height:1.35;margin-top:3px}
      #${SECTION_ID} .message-oracle-home-contexts{display:block;margin-top:3px;color:#aaa0b8;font-size:10.5px;line-height:1.35;white-space:normal;overflow-wrap:anywhere}
      #${SECTION_ID} .toggle{flex:0 0 auto}
      #${ENTRY_ID}{display:block;width:100%;max-width:100%;box-sizing:border-box;text-align:left;padding:12px;border-radius:13px;border:1px solid rgba(189,164,248,.22);background:rgba(189,164,248,.06);color:var(--text);white-space:normal}
      #${ENTRY_ID} strong,#${ENTRY_ID} span,#${ENTRY_ID} small{display:block;overflow-wrap:anywhere}
      #${ENTRY_ID} strong{font-size:13px;color:var(--moon)}
      #${ENTRY_ID} span{font-size:12px;margin:4px 0}
      #${ENTRY_ID} small{font-size:11px;line-height:1.55;color:var(--dim)}
      #${STATUS_ID}{margin:7px 0 2px;color:var(--dim);font-size:10.5px;line-height:1.45}

      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active){
        --signal-gold:235,205,143;--signal-violet:183,151,238;
        height:82px!important;min-height:82px!important;border-radius:23px!important;
        border:1px solid rgba(244,241,255,.24)!important;
        background:
          radial-gradient(92% 190% at 3% -10%,rgba(var(--signal-gold),.25),transparent 50%),
          radial-gradient(72% 160% at 98% 118%,rgba(var(--signal-violet),.22),transparent 55%),
          linear-gradient(146deg,rgba(255,255,255,.135),rgba(255,255,255,.038) 38%,rgba(8,10,30,.34) 76%,rgba(4,6,20,.46)),
          rgba(12,15,39,.43)!important;
        -webkit-backdrop-filter:blur(9px) saturate(132%)!important;backdrop-filter:blur(9px) saturate(132%)!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.36),
          inset 1px 0 0 rgba(var(--signal-gold),.14),
          inset -1px 0 0 rgba(var(--signal-violet),.10),
          inset 0 -1px 0 rgba(1,3,14,.50),
          inset 0 -18px 30px rgba(2,4,18,.12),
          0 10px 24px rgba(0,1,13,.22),0 2px 5px rgba(0,0,0,.14)!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active)::before{
        content:'';position:absolute;z-index:0;pointer-events:none;inset:-58% -22%;
        background:
          radial-gradient(ellipse at 18% 43%,rgba(var(--signal-gold),.34),transparent 29%),
          radial-gradient(ellipse at 80% 64%,rgba(var(--signal-violet),.25),transparent 32%);
        opacity:.88;transform:translate3d(-3%,1%,0) rotate(-1deg);
        animation:luneaSignalMessageAurora 13s ease-in-out infinite alternate
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active)::after{
        content:'';position:absolute;z-index:3;pointer-events:none;inset:1px;border-radius:21px;
        border:1px solid rgba(255,255,255,.055);border-top-color:rgba(255,255,255,.26);
        background:linear-gradient(110deg,transparent 8%,rgba(255,255,255,.105) 30%,transparent 47%,rgba(var(--signal-violet),.04) 76%,transparent 92%);
        opacity:.88
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .category-header{
        height:80px!important;min-height:80px!important;padding:12px 15px!important;position:relative;z-index:4
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .cat-left{
        gap:13px!important;min-width:0!important;overflow:hidden!important;align-items:center!important
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .message-oracle-home-logo{
        width:50px!important;height:50px!important;flex:0 0 50px!important;padding:2px;box-sizing:border-box;
        border-radius:17px!important;border:1px solid rgba(var(--signal-gold),.34)!important;
        background:
          radial-gradient(circle at 30% 20%,rgba(255,255,255,.25),transparent 32%),
          linear-gradient(145deg,rgba(var(--signal-gold),.16),rgba(var(--signal-violet),.06))!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.31),
          inset -1px -1px 0 rgba(var(--signal-violet),.10),
          inset 0 -8px 16px rgba(2,4,20,.16),
          0 6px 15px rgba(0,0,0,.15),0 0 16px rgba(var(--signal-gold),.08)!important;
        opacity:.92!important;filter:saturate(.90) brightness(.98) contrast(.96)!important
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .cat-text{min-width:0!important;overflow:hidden!important}
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .cat-text h3{
        margin:0!important;min-width:0;font-size:14.6px!important;line-height:1.08!important;color:#fbfaff!important;font-weight:650!important;letter-spacing:.1px!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .cat-text p{
        display:block!important;margin-top:5px!important;color:#c1c5d8!important;font-size:9.7px!important;line-height:1.18!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .message-oracle-home-contexts{display:none!important}
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .toggle{
        width:34px!important;height:34px!important;flex:0 0 34px!important;border-radius:999px!important;
        display:grid!important;place-items:center!important;align-self:center!important;margin-left:10px!important;
        border:1px solid rgba(var(--signal-gold),.25)!important;
        background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(var(--signal-violet),.055))!important;
        color:rgb(var(--signal-gold))!important;font-size:19px!important;line-height:1!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.23),inset 0 -5px 10px rgba(3,5,20,.12),0 4px 12px rgba(0,0,0,.12)!important
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active):active{
        transform:scale(.985)!important;border-color:rgba(var(--signal-gold),.40)!important
      }
      @keyframes luneaSignalMessageAurora{
        0%{transform:translate3d(-4%,2%,0) rotate(-1deg);opacity:.72}
        55%{transform:translate3d(2%,-2%,0) rotate(1deg);opacity:.92}
        100%{transform:translate3d(5%,1%,0) rotate(2deg);opacity:.78}
      }
      @media(max-width:390px){
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active){height:78px!important;min-height:78px!important}
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .category-header{height:76px!important;min-height:76px!important;padding:10px 13px!important}
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .message-oracle-home-logo{width:47px!important;height:47px!important;flex-basis:47px!important}
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .cat-text h3{font-size:13.8px!important}
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .cat-text p{font-size:9.3px!important}
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active) .toggle{width:32px!important;height:32px!important;flex-basis:32px!important;margin-left:8px!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.lunea-home-visual-v36 #luneaHomePortalV8 #${SECTION_ID}:not(.active)::before{animation:none!important;transform:none!important}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function setExpanded(section, expanded) {
    section.classList.toggle('active', expanded);
    const header = section.querySelector('.category-header');
    const toggle = section.querySelector('.toggle');
    header?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (toggle) toggle.textContent = expanded ? '×' : '+';
  }

  function bindHeader(section) {
    const header = section.querySelector('.category-header');
    if (!header || header.dataset.luneaMessageHomeBound === '1') return;
    header.dataset.luneaMessageHomeBound = '1';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', section.classList.contains('active') ? 'true' : 'false');
    const toggle = () => {
      const next = !section.classList.contains('active');
      document.querySelectorAll('.category.active').forEach(node => {
        if (node !== section) node.classList.remove('active');
      });
      setExpanded(section, next);
    };
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  }

  async function openFreshStandalone(status) {
    let ui = W.LUNEA_MESSAGE_ORACLE_UI_V1;
    if (!ui?.open) {
      if (status) status.textContent = '메시지 오라클을 불러오는 중…';
      const ok = await W.LUNEA_LOAD_FEATURE_GROUP?.('message');
      ui = W.LUNEA_MESSAGE_ORACLE_UI_V1;
      if (!ok || !ui?.open) {
        if (status) status.textContent = '메시지 오라클을 불러오지 못했어요. 다시 눌러 주세요.';
        return false;
      }
    }
    const ready = await ui.ready?.();
    if (ready === false) {
      if (status) status.textContent = '승인된 카드 이미지를 불러오지 못했어요. 다시 눌러 주세요.';
      return false;
    }
    if (status) status.textContent = '';
    await ui.open();
    // Standalone Home is a new-question entry. Reuse the UI's own reset path so
    // explicit saved cards stay available while the remembered last draw clears.
    document.querySelector('#luneaMessageOracleOverlay [data-action="new"]')?.click();
    return true;
  }

  function bindEntry(section) {
    const entry = section.querySelector('#' + ENTRY_ID);
    if (!entry || entry.dataset.luneaMessageHomeBound === '1') return;
    entry.dataset.luneaMessageHomeBound = '1';
    entry.disabled = false;
    entry.addEventListener('click', async event => {
      // Own the standalone click even after the lazy UI installs its legacy
      // entry listener; otherwise that listener can restore the previous draw.
      event.preventDefault();
      event.stopImmediatePropagation();
      const status = document.getElementById(STATUS_ID);
      await openFreshStandalone(status);
    });
  }

  function createSection() {
    const section = document.createElement('section');
    section.className = 'category';
    section.id = SECTION_ID;
    section.setAttribute('aria-label', 'SIGNAL · MESSAGE');
    section.innerHTML = `
      <div class="category-header">
        <div class="cat-left">
          <img class="message-oracle-logo message-oracle-home-logo" src="${LOGO_SRC}" alt="" aria-hidden="true" width="1254" height="1254">
          <div class="cat-text">
            <h3>SIGNAL · MESSAGE</h3>
            <p>연락 · 소식 · 응답</p>
            <small class="message-oracle-home-contexts">연애 · 재회 · 결과 · 업무 · SNS</small>
          </div>
        </div>
        <div class="toggle" aria-hidden="true">+</div>
      </div>
      <div class="category-content">
        <button id="${ENTRY_ID}" type="button">
          <strong>MESSAGE ORACLE</strong>
          <span>연락 · 소식 · 응답</span>
          <small>연애·재회·공적 결과·업무·SNS·지인 소식까지<br>한 장으로 빠르게 확인</small>
        </button>
        <p id="${STATUS_ID}" role="status"></p>
      </div>`;
    return section;
  }

  function ensure() {
    installStyle();
    let section = document.getElementById(SECTION_ID);
    if (!section) {
      const app = document.querySelector('.app');
      if (!app) return null;
      section = createSection();
      const categories = [...app.children].filter(node => node.classList?.contains('category'));
      const stock = categories.find(node => /STOCK\s*&\s*TRADING/i.test(node.textContent || ''));
      const anchor = stock || categories[categories.length - 1];
      if (anchor) anchor.insertAdjacentElement('afterend', section);
      else app.appendChild(section);
    }
    // SIGNAL is a standalone supplemental strip, never one of the hidden source categories.
    section.classList.remove('lunea-v8-source-category', 'lunea-v8-source-active');
    section.hidden = false;
    section.removeAttribute('aria-hidden');
    bindHeader(section);
    bindEntry(section);
    return section;
  }

  function readingState() {
    try { return W.state || state || null; } catch { return W.state || null; }
  }

  function readingSignature() {
    const value = readingState();
    if (!value?.drawn?.length || !String(value.question || '').trim()) return '';
    return String(W.LUNEA_READING_ATTACHMENTS_V1?.signature?.(value) || '');
  }

  function readDraft() {
    try {
      const apiValue = W.LUNEA_READING_DRAFT_V1?.readDraft?.();
      if (apiValue && typeof apiValue === 'object') return apiValue;
    } catch {}
    try {
      const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch { return null; }
  }

  async function recoverReadingSupport() {
    const support = W.LUNEA_MESSAGE_ORACLE_SUPPORT_V1;
    if (!support) return false;
    support.ensureButton?.();

    const signature = readingSignature();
    if (!signature) return false;

    const live = support.capture?.() || null;
    if (live) {
      if (!document.getElementById('luneaMessageOracleInline')) {
        if (!W.LUNEA_MESSAGE_ORACLE_V1) await W.LUNEA_LOAD_FEATURE_GROUP?.('message');
        if (readingSignature() === signature) support.restore?.({...live});
      }
      return true;
    }

    if (supportRecovery) return supportRecovery;
    const draft = readDraft();
    const container = draft?.attachments;
    const entry = container?.messageOracle;
    const data = entry?.data;
    if (!container || container.readingSignature !== signature || entry?.readingSignature !== signature || data?.readingSignature !== signature) return false;

    supportRecovery = (async() => {
      try {
        if (!W.LUNEA_MESSAGE_ORACLE_V1) {
          const ok = await W.LUNEA_LOAD_FEATURE_GROUP?.('message');
          if (!ok) return false;
        }
        if (readingSignature() !== signature || support.capture?.()) return false;
        return support.restore?.({...data}) !== false;
      } catch (error) {
        console.warn('[LUNEA Message Home] support recovery skipped', error);
        return false;
      } finally {
        supportRecovery = null;
      }
    })();
    return supportRecovery;
  }

  function placeSignalInCurrentHome(section) {
    if (!section) return false;
    W.dispatchEvent(new CustomEvent('lunea:home-tile-ready', {detail:{key:'signal'}}));
    W.LUNEA_HOME_LAYOUT_V36?.requestLayout?.();
    return true;
  }

  function attachObservers() {
    const app = document.querySelector('.app');
    if (app && app !== observedApp) {
      appObserver?.disconnect();
      observedApp = app;
      appObserver = new MutationObserver(scheduleSync);
      appObserver.observe(app, {childList:true, subtree:true});
    }

    const spread = document.getElementById('spreadOverlay');
    if (spread && spread !== observedSpread) {
      spreadObserver?.disconnect();
      observedSpread = spread;
      spreadObserver = new MutationObserver(scheduleSync);
      spreadObserver.observe(spread, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
    }
  }

  function syncPresence() {
    const section = ensure();
    if (section) placeSignalInCurrentHome(section);
    attachObservers();
    void recoverReadingSupport();
    return !!section;
  }

  function scheduleSync() {
    if (syncQueued) return;
    syncQueued = true;
    const run = () => {
      syncQueued = false;
      syncPresence();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 16);
  }

  syncPresence();
  [80, 320, 900].forEach(ms => setTimeout(syncPresence, ms));
  W.addEventListener('pageshow', scheduleSync);
  W.addEventListener('lunea:feature-group-ready', scheduleSync);
  W.addEventListener('lunea:reading-attachments-restored', scheduleSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleSync(); });

  W.LUNEA_MESSAGE_ORACLE_HOME_V1 = Object.freeze({ensure, sync:syncPresence, recoverReadingSupport});
})();