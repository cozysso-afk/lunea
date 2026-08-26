'use strict';

/*
  LUNEA LAST READING DRAFT V1
  ===========================
  Crash / accidental-close recovery for the active RWS reading.

  - Saves automatically as soon as cards exist.
  - Updates after flips, clarifiers, extra cards and AI text changes.
  - Persists across reload / PWA termination via localStorage.
  - Restores the exact question, spread positions, cards, reversals,
    clarifiers, revealed state and AI text without re-drawing RNG.
  - Separate from the permanent Archive; only the latest active reading is kept.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_DRAFT_V1__) return;
  W.__LUNEA_READING_DRAFT_V1__ = true;

  const KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  const $ = id => document.getElementById(id);
  let restoring = false;
  let saveTimer = 0;
  let observersInstalled = false;

  function getState() {
    try { return state; } catch { return null; }
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return null; }
  }

  function readDraft() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && Array.isArray(v.drawn) && v.drawn.length ? v : null;
    } catch { return null; }
  }

  function draftDate(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString('ko-KR', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}); }
    catch { return ''; }
  }

  function currentFlipped() {
    return [...document.querySelectorAll('#cards .tarot-card.flipped')]
      .map(el => Number(String(el.id || '').replace('card-', '')))
      .filter(Number.isInteger);
  }

  function currentAIText() {
    const el = $('aiText');
    if (!el) return '';
    const text = String(el.textContent || '').trim();
    if (!text || /카드 간 중첩과 반증을 확인하는 중/.test(text)) return '';
    return text;
  }

  function snapshot() {
    if (restoring) return;
    const s = getState();
    if (!s || !Array.isArray(s.drawn) || !s.drawn.length) return;

    const drawn = clone(s.drawn);
    if (!drawn?.length) return;

    const payload = {
      version: 1,
      savedAt: Date.now(),
      category: String(s.category || 'GENERAL'),
      title: String(s.title || ''),
      desc: String(s.desc || ''),
      count: Number(s.count || s.positions?.length || drawn.length || 1),
      isAi: !!s.isAi,
      allowReversed: !!s.allowReversed,
      positions: clone(Array.isArray(s.positions) ? s.positions : []) || [],
      rationale: String(s.rationale || ''),
      question: String(s.question || ''),
      drawn,
      flipped: currentFlipped(),
      aiText: currentAIText(),
      manualReading: !!s.__luneaManualReading,
      manualMode: !!s.__luneaManualMode,
      manualPositions: clone(s.__luneaManualPositions || null)
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
      renderResumeBar();
    } catch (err) {
      console.warn('[LUNEA Draft] auto-save failed', err);
    }
  }

  function scheduleSave(delay = 60) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(snapshot, delay);
  }

  function clearDraft() {
    try { localStorage.removeItem(KEY); } catch {}
    renderResumeBar();
  }

  function addStyles() {
    if ($('luneaReadingDraftStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaReadingDraftStyle';
    style.textContent = `
      #luneaReadingDraftResume{
        display:none;align-items:center;gap:9px;margin:-7px 0 14px;padding:10px 11px;
        border:1px solid rgba(157,228,193,.22);border-radius:13px;
        background:linear-gradient(145deg,rgba(157,228,193,.075),rgba(189,164,248,.07));
        color:#e8e1f1;text-align:left
      }
      #luneaReadingDraftResume.show{display:flex}
      .lrd-copy{min-width:0;flex:1}
      .lrd-kicker{font-size:8.5px;font-weight:750;color:#9de4c1;letter-spacing:.5px}
      .lrd-title{margin:2px 0 1px;font-size:10.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .lrd-q{font-size:9px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .lrd-actions{display:flex;gap:5px;flex:0 0 auto}
      .lrd-actions button{padding:6px 8px;font-size:9.5px}
      #luneaDraftSavedBadge{
        position:absolute;top:10px;left:14px;z-index:5;display:none;
        padding:4px 7px;border-radius:8px;background:rgba(15,12,23,.72);
        border:1px solid rgba(157,228,193,.18);color:#bfe7d2;font-size:8.5px;
        pointer-events:none
      }
      #spreadOverlay.show #luneaDraftSavedBadge{display:block}
    `;
    document.head.appendChild(style);
  }

  function ensureResumeBar() {
    let bar = $('luneaReadingDraftResume');
    if (bar) return bar;
    const anchor = document.querySelector('.engine-strip') || document.querySelector('.daily');
    if (!anchor) return null;

    bar = document.createElement('div');
    bar.id = 'luneaReadingDraftResume';
    bar.innerHTML = `
      <div class="lrd-copy">
        <div class="lrd-kicker">자동 임시저장 · LAST READING</div>
        <div class="lrd-title" id="luneaDraftTitle"></div>
        <div class="lrd-q" id="luneaDraftQuestion"></div>
      </div>
      <div class="lrd-actions">
        <button type="button" class="mini" id="luneaDraftRestore">↩ 복원</button>
        <button type="button" class="mini danger" id="luneaDraftDiscard">삭제</button>
      </div>`;
    anchor.insertAdjacentElement('afterend', bar);
    $('luneaDraftRestore').onclick = restoreDraft;
    $('luneaDraftDiscard').onclick = () => {
      if (confirm('마지막 임시 리딩을 삭제할까? 기록함에 저장된 리딩은 건드리지 않아.')) clearDraft();
    };
    return bar;
  }

  function ensureSavedBadge() {
    if ($('luneaDraftSavedBadge')) return;
    const modal = document.querySelector('#spreadOverlay .modal');
    if (!modal) return;
    const badge = document.createElement('div');
    badge.id = 'luneaDraftSavedBadge';
    badge.textContent = '✓ 자동 임시저장';
    modal.appendChild(badge);
  }

  function renderResumeBar() {
    const bar = ensureResumeBar();
    if (!bar) return;
    const draft = readDraft();
    const readingOpen = $('spreadOverlay')?.classList.contains('show');
    bar.classList.toggle('show', !!draft && !readingOpen);
    if (!draft) return;
    const title = draft.title || '마지막 리딩';
    const when = draftDate(draft.savedAt);
    $('luneaDraftTitle').textContent = `${title}${when ? ' · ' + when : ''}`;
    $('luneaDraftQuestion').textContent = draft.question || '질문 원문 없음';
  }

  function setStateFromDraft(d) {
    const s = getState();
    if (!s) throw new Error('리딩 상태를 찾지 못했어.');

    s.category = d.category || 'GENERAL';
    s.title = d.title || '복원된 리딩';
    s.desc = d.desc || '';
    s.count = Number(d.count || d.positions?.length || d.drawn.length || 1);
    s.isAi = !!d.isAi;
    s.allowReversed = !!d.allowReversed;
    s.positions = Array.isArray(d.positions) ? clone(d.positions) : [];
    s.rationale = d.rationale || '';
    s.question = d.question || '현재 나에게 필요한 흐름';
    s.drawn = clone(d.drawn) || [];
    s.used = new Set();
    s.__luneaManualReading = !!d.manualReading;
    s.__luneaManualMode = !!d.manualMode;
    if (d.manualPositions) s.__luneaManualPositions = clone(d.manualPositions);

    s.drawn.forEach(card => {
      if (card?.code) s.used.add(card.code);
      (card?.subCards || []).forEach(sub => { if (sub?.code) s.used.add(sub.code); });
    });
    return s;
  }

  function appendSavedClarifiers(i) {
    const s = getState();
    const item = s?.drawn?.[i];
    if (!item?.subCards?.length) return;
    const cont = $('clar-' + i);
    const btn = $('clarBtn-' + i);
    if (!cont) return;
    cont.replaceChildren();
    cont.style.display = 'flex';
    item.subCards.forEach((c, idx) => {
      const div = document.createElement('div');
      div.className = 'clar';
      const strong = document.createElement('b');
      strong.textContent = `보조 #${idx + 1}`;
      div.append('↳ ', strong, ` ${c.name || ''} (${c.isReversed ? '역' : '정'}) · ${c.keyword || ''}`);
      cont.appendChild(div);
    });
    if (btn) {
      btn.textContent = `+ 보조 (${item.subCards.length}/3)`;
      btn.disabled = item.subCards.length >= 3;
    }
  }

  function restoreAI(text) {
    const box = $('aiBox');
    if (!box) return;
    box.replaceChildren();
    if (!text) return;
    const card = document.createElement('div');
    card.className = 'ai-card';
    const h = document.createElement('h4');
    h.textContent = '🔮 AI 심층 리딩 · 복원됨';
    const body = document.createElement('div');
    body.className = 'ai-body';
    body.id = 'aiText';
    body.textContent = text;
    card.append(h, body);
    box.appendChild(card);
  }

  function restoreDraft() {
    const d = readDraft();
    if (!d) return alert('복원할 임시 리딩이 없어.');
    if (!Array.isArray(d.drawn) || !d.drawn.length) return alert('임시 리딩 카드 정보가 비어 있어.');

    try {
      restoring = true;
      const s = setStateFromDraft(d);
      $('cards')?.replaceChildren();
      $('results')?.replaceChildren();
      $('aiBox')?.replaceChildren();

      if ($('spreadType')) $('spreadType').textContent = s.title;
      if ($('spreadQuestion')) $('spreadQuestion').textContent = '“' + s.question + '”';
      if ($('spreadRationale')) {
        $('spreadRationale').style.display = s.rationale ? 'block' : 'none';
        $('spreadRationale').textContent = s.rationale || '';
      }

      s.drawn.forEach((card, i) => {
        let wrapper = null;
        try {
          const fn = W.makeCardWrapper || makeCardWrapper;
          wrapper = fn(i, card, !!card.isReversed);
        } catch {}
        if (wrapper) $('cards')?.appendChild(wrapper);
      });

      try {
        const show = W.showOverlay || showOverlay;
        show('spreadOverlay');
      } catch {
        $('spreadOverlay')?.classList.add('show');
        document.body.classList.add('modal-open');
      }

      requestAnimationFrame(() => {
        const flipped = new Set((d.flipped || []).map(Number));
        s.drawn.forEach((_, i) => {
          if (!flipped.has(i)) return;
          try {
            const fn = W.flipAt || flipAt;
            fn(i);
          } catch {
            $('card-' + i)?.classList.add('flipped');
          }
          appendSavedClarifiers(i);
        });
        restoreAI(d.aiText || '');
        restoring = false;
        renderResumeBar();
        scheduleSave(120);
      });
    } catch (err) {
      restoring = false;
      console.error('[LUNEA Draft] restore failed', err);
      alert('마지막 리딩 복원 중 오류가 났어: ' + (err?.message || err));
    }
  }

  function installObservers() {
    if (observersInstalled) return true;
    const overlay = $('spreadOverlay');
    const cards = $('cards');
    const results = $('results');
    const ai = $('aiBox');
    if (!overlay || !cards || !results || !ai) return false;
    observersInstalled = true;

    const mutationSave = new MutationObserver(() => scheduleSave());
    mutationSave.observe(cards, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
    mutationSave.observe(results, {childList:true, subtree:true, characterData:true});
    mutationSave.observe(ai, {childList:true, subtree:true, characterData:true});

    new MutationObserver(() => {
      if (overlay.classList.contains('show')) scheduleSave(90);
      else scheduleSave(0);
      setTimeout(renderResumeBar, 0);
    }).observe(overlay, {attributes:true, attributeFilter:['class']});

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#extraCard,#flipAll,[data-clarify],#aiRead,#retry')) scheduleSave(120);
    }, true);

    window.addEventListener('pagehide', snapshot);
    window.addEventListener('beforeunload', snapshot);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) snapshot();
      else renderResumeBar();
    });

    ensureSavedBadge();
    renderResumeBar();
    return true;
  }

  function boot() {
    addStyles();
    ensureResumeBar();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installObservers() || tries > 100) clearInterval(timer);
    }, 100);
    installObservers();
    W.LUNEA_READING_DRAFT_V1 = {readDraft, snapshot, restoreDraft, clearDraft};
    console.info('💾 LUNEA Last Reading Draft V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
