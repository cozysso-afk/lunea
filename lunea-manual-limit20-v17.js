'use strict';

/*
  LUNEA MANUAL SPREAD LIMIT 20 V17.1
  ==================================
  Extends user-authored/manual spreads from 12 to 20 total cards.

  - No polling installer.
  - No startSpread wrapper.
  - The one draw-button extension is installed deterministically after Manual V1.
  - Reading Lifecycle V59 owns the session boundary before drawBtn executes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MANUAL_LIMIT20_V17__) return;
  W.__LUNEA_MANUAL_LIMIT20_V17__ = true;

  const MAX = 20;
  const DRAFT_KEY = 'LUNEA_MANUAL_SPREAD_DRAFT_V1';
  const $ = id => document.getElementById(id);
  const life = () => W.LUNEA_READING_LIFECYCLE_V59 || null;
  const currentSessionId = () => life()?.currentSessionId?.() || 0;
  const isCurrent = id => !life()?.isCurrent || life().isCurrent(id);

  function parsed() {
    try { return W.LUNEA_MANUAL_SPREAD_V1?.parseManualPositions?.() || {positions:[],symmetric:false,axes:[]}; }
    catch { return {positions:[],symmetric:false,axes:[]}; }
  }

  function refreshCount() {
    const out = $('luneaManualCount');
    if (!out) return;
    const p = parsed();
    if (!p.positions.length) {
      out.textContent = `포지션을 한 줄에 하나씩 입력해줘. · 최대 ${MAX}장`;
      out.style.color = '';
      return;
    }
    const base = p.symmetric ? `공통 축 ${p.axes.length}개 → A/B 총 ${p.positions.length}장` : `총 ${p.positions.length}장`;
    out.textContent = `${base} · 최대 ${MAX}장`;
    out.style.color = p.positions.length > MAX ? '#ff9eb2' : '';
  }

  function persistDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title:$('luneaManualTitle')?.value || '',
        positions:$('luneaManualPositions')?.value || '',
        symmetric:!!$('luneaManualAB')?.checked
      }));
    } catch {}
  }

  function launchManual(question, p, session) {
    if (!isCurrent(session)) return;
    const rawTitle = String($('luneaManualTitle')?.value || '').trim();
    const title = rawTitle || (p.symmetric
      ? `A/B 직접 대칭 배열 · ${p.axes.length}축 · ${p.positions.length}카드`
      : `직접 입력 배열 · ${p.positions.length}카드`);
    const rationale = p.symmetric
      ? `[USER MANUAL SPREAD] · 사용자 직접 지정 · A/B same axes, same order · 축 ${p.axes.length}개 · AI 재설계 금지`
      : `[USER MANUAL SPREAD] · 사용자 직접 지정 · 포지션 ${p.positions.length}개 · AI 재설계 금지`;

    const originCategory = String(state?.__luneaManualOriginCategory || state?.category || 'GENERAL').trim().toUpperCase() || 'GENERAL';
    try {
      state.__luneaManualOriginCategory = originCategory;
      state.category = originCategory;
      state.__luneaIntimacyReading = originCategory === 'INTIMACY';
      state.__luneaManualReading = true;
      state.question = question || '현재 나에게 필요한 흐름';
      state.positions = [...p.positions];
      state.title = title;
      state.rationale = rationale;
      state.drawn = [];
      state.used = new Set();
    } catch (e) {
      console.error('[LUNEA Manual 20] state init failed', e);
      return;
    }

    $('cards')?.replaceChildren();
    $('results')?.replaceChildren();
    $('aiBox')?.replaceChildren();
    if ($('spreadType')) $('spreadType').textContent = title;
    if ($('spreadQuestion')) $('spreadQuestion').textContent = '“' + state.question + '”';
    if ($('spreadRationale')) {
      $('spreadRationale').style.display = rationale ? 'block' : 'none';
      $('spreadRationale').textContent = rationale || '';
    }
    $('luneaStructuralV4Pager')?.classList.remove('show');

    try {
      if (typeof secureShuffle !== 'function' || typeof TAROT_DECK === 'undefined' || typeof makeCardWrapper !== 'function') throw new Error('tarot draw primitives unavailable');
      const selected = secureShuffle(TAROT_DECK).slice(0, p.positions.length);
      selected.forEach((card, i) => {
        const isReversed = !!state.allowReversed && (typeof secureBool === 'function' ? secureBool() : false);
        state.used.add(card.code);
        state.drawn.push({...card,isReversed,position:p.positions[i],subCards:[]});
        $('cards')?.appendChild(makeCardWrapper(i, card, isReversed));
      });
      if (originCategory === 'INTIMACY') {
        W.__LUNEA_INTIMACY_ACTIVE__ = true;
        document.body?.classList?.add('lunea-intimacy-reading');
        W.LUNEA_INTIMACY_BURGUNDY_V40?.repairTarotCards?.();
        W.LUNEA_INTIMACY_ORACLE_UI_V36?.performOracleDraw?.();
      }
    } catch (e) {
      console.error('[LUNEA Manual 20] draw failed', e);
      alert('수동 배열을 펼치는 중 문제가 생겼어. 페이지를 새로고침한 뒤 다시 시도해줘.');
      return;
    }

    if (!isCurrent(session)) return;
    if (W.LUNEA_SPREAD_LEARNING_V1?.recordManual) {
      try {
        W.LUNEA_SPREAD_LEARNING_V1.recordManual({question:state.question,spreadTitle:title,positions:p.positions,symmetric:!!p.symmetric,axes:p.axes,category:originCategory});
      } catch (error) { console.warn('[LUNEA Manual 20] manual spread learning failed', error); }
    }

    persistDraft();
    $('sheet')?.classList.remove('open');
    try { if (typeof showOverlay === 'function') showOverlay('spreadOverlay'); } catch {}
  }

  function wrapDrawButton() {
    const btn = $('drawBtn');
    if (!btn || !W.LUNEA_MANUAL_SPREAD_V1) return false;
    if (btn.onclick?.__luneaManual20Wrapped) return true;

    const prior = btn.onclick;
    const wrapped = async function(event) {
      let manual = false;
      try { manual = !!state?.__luneaManualMode; } catch {}
      if (!manual) return typeof prior === 'function' ? prior.call(this, event) : undefined;

      const p = parsed();
      if (p.positions.length <= 12) return typeof prior === 'function' ? prior.call(this, event) : undefined;

      if (p.positions.length > MAX) {
        alert(`직접 배열은 총 ${MAX}장까지 펼칠 수 있어. 지금 ${p.positions.length}장이야.`);
        $('luneaManualPositions')?.focus();
        refreshCount();
        return;
      }

      const q = String($('question')?.value || '').trim();
      if (!q) {
        alert('질문 원문을 먼저 입력해줘.');
        $('question')?.focus();
        return;
      }

      event?.preventDefault?.();
      launchManual(q, p, currentSessionId());
    };
    wrapped.__luneaManual20Wrapped = true;
    wrapped.__luneaPriorDraw = prior;
    btn.onclick = wrapped;
    return true;
  }

  function decorateUI() {
    const panel = $('luneaManualPanel');
    if (!panel) return false;
    const help = panel.querySelector('.manual-help');
    if (help && !help.dataset.limit20) {
      help.dataset.limit20 = '1';
      help.textContent += ` · 직접 배열은 총 ${MAX}장까지 가능해.`;
    }
    ['luneaManualPositions','luneaManualAB'].forEach(id => {
      const el = $(id);
      if (!el || el.dataset.limit20) return;
      el.dataset.limit20 = '1';
      el.addEventListener('input', refreshCount);
      el.addEventListener('change', refreshCount);
    });
    refreshCount();
    return true;
  }

  function installAll() {
    const a = wrapDrawButton();
    const b = decorateUI();
    return a && b;
  }

  function boot() {
    installAll();
    if (document.readyState !== 'complete') W.addEventListener('load', installAll, {once:true});
    W.LUNEA_MANUAL_MAX_CARDS = MAX;
    console.info(`🌙 LUNEA Manual Limit V17.1 loaded · max ${MAX} cards · no polling`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();