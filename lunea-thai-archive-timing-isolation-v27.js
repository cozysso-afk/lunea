'use strict';

/*
  LUNEA THAI ARCHIVE + TIMING QUESTION ISOLATION V27
  ==================================================
  1) Standalone Thai Maha Taksa gets Copy / Save to LUNEA Archive / Open Archive.
  2) Timing Oracle UI/result state is isolated per tarot question.
     Old A/B source cards are cleared before a new spread or timing draw so the
     V16 mirror cannot resurrect a previous question's two cards beside a new
     single Timing card.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_ARCHIVE_TIMING_ISOLATION_V27__) return;
  W.__LUNEA_THAI_ARCHIVE_TIMING_ISOLATION_V27__ = true;
  document.documentElement.classList.add('lunea-v27');

  const $ = id => document.getElementById(id);
  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();

  // ----------------------------------------------------------
  // Thai standalone: copy + archive save/open
  // ----------------------------------------------------------
  function addStyles() {
    if ($('luneaV27Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaV27Style';
    s.textContent = `
      #luneaThaiActionsV27{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}
      #luneaThaiActionsV27 .thai-v27-action{
        min-height:43px;border-radius:13px;border:1px solid rgba(226,211,166,.16);
        background:linear-gradient(145deg,rgba(205,174,101,.075),rgba(77,125,119,.045));
        color:#ded7c7;font-size:10.5px;font-weight:700;letter-spacing:.1px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04)
      }
      #luneaThaiActionsV27 .thai-v27-action:disabled{opacity:.36}
      #luneaThaiActionsV27 #luneaThaiArchiveOpenV27{grid-column:1/-1;color:#b8b6c5;border-color:rgba(210,207,226,.10);background:rgba(255,255,255,.025)}
      #luneaThaiSaveV27.saved{color:#bfe4d7;border-color:rgba(120,190,169,.25);background:rgba(99,164,146,.07)}
    `;
    document.head.appendChild(s);
  }

  function thaiTopic() {
    return clean(document.querySelector('#luneaThaiTopicGrid .thai-v24-topic.active')?.textContent || '오늘 전체');
  }

  function thaiResultText() {
    const el = $('luneaThaiStandaloneResult');
    return clean(el?.innerText || el?.textContent || '');
  }

  function thaiSignature() {
    return `${thaiTopic()}|${thaiResultText()}`;
  }

  function thaiCopyText() {
    const text = thaiResultText();
    if (!text) return '';
    return `LUNEA · THAI ASTROLOGY · MAHA TAKSA\n주제: ${thaiTopic()}\n\n${text}`;
  }

  function readArchiveFallback() {
    try { return JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]') || []; }
    catch { return []; }
  }

  function writeArchiveFallback(rows) {
    try { localStorage.setItem('LUNEA_ARCHIVE_V3', JSON.stringify((rows || []).slice(0, 100))); }
    catch {}
  }

  function makeId() {
    try { if (typeof W.secureId === 'function') return W.secureId(); } catch {}
    try {
      const a = new Uint8Array(12); crypto.getRandomValues(a);
      return [...a].map(x => x.toString(16).padStart(2, '0')).join('');
    } catch { return `thai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
  }

  async function copyThai() {
    const text = thaiCopyText();
    if (!text) return alert('먼저 태국점성술 결과를 계산해줘.');
    try {
      await navigator.clipboard.writeText(text);
      alert('✨ 태국점성술 결과를 복사했어.');
    } catch { alert('복사 권한을 확인해줘.'); }
  }

  function saveThai() {
    const text = thaiCopyText();
    if (!text) return alert('먼저 태국점성술 결과를 계산해줘.');
    const sig = thaiSignature();
    const btn = $('luneaThaiSaveV27');
    if (btn?.dataset.savedSig === sig) return alert('이 결과는 이미 저장했어.');

    let rows;
    try { rows = typeof W.getArchive === 'function' ? W.getArchive() : readArchiveFallback(); }
    catch { rows = readArchiveFallback(); }
    if (!Array.isArray(rows)) rows = [];

    rows.unshift({
      id: makeId(),
      createdAt: Date.now(),
      date: new Date().toLocaleString('ko-KR'),
      title: '태국점성술 · Maha Taksa',
      q: `주제: ${thaiTopic()}`,
      rationale: 'Standalone Thai Astrology · Maha Taksa',
      cards: [{text}],
      ai: ''
    });

    try {
      if (typeof W.setArchive === 'function') W.setArchive(rows);
      else writeArchiveFallback(rows);
    } catch { writeArchiveFallback(rows); }

    if (btn) {
      btn.dataset.savedSig = sig;
      btn.classList.add('saved');
      btn.textContent = '✓ 저장됨';
    }
    alert('✨ LUNEA 저장함에 저장했어.');
  }

  function openArchive() {
    try { W.renderArchive?.(); } catch {}
    const thai = $('luneaThaiStandaloneOverlay');
    if (thai) {
      thai.classList.remove('show');
      thai.setAttribute('aria-hidden', 'true');
    }
    if (typeof W.showOverlay === 'function') W.showOverlay('archiveOverlay');
    else {
      const archive = $('archiveOverlay');
      if (archive) {
        archive.classList.add('show');
        archive.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
      }
    }
  }

  function syncThaiActions() {
    const bar = $('luneaThaiActionsV27');
    if (!bar) return;
    const has = !!thaiResultText();
    const copy = $('luneaThaiCopyV27');
    const save = $('luneaThaiSaveV27');
    if (copy) copy.disabled = !has;
    if (save) {
      save.disabled = !has;
      const sig = thaiSignature();
      if (save.dataset.savedSig !== sig) {
        save.classList.remove('saved');
        save.textContent = '💾 저장함 저장';
      }
    }
  }

  function installThaiActions() {
    const result = $('luneaThaiStandaloneResult');
    if (!result) return false;
    let bar = $('luneaThaiActionsV27');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'luneaThaiActionsV27';
      bar.innerHTML = `
        <button type="button" class="thai-v27-action" id="luneaThaiCopyV27">📋 결과 복사</button>
        <button type="button" class="thai-v27-action" id="luneaThaiSaveV27">💾 저장함 저장</button>
        <button type="button" class="thai-v27-action" id="luneaThaiArchiveOpenV27">↶ LUNEA 저장함 열기</button>`;
      result.insertAdjacentElement('afterend', bar);
      $('luneaThaiCopyV27').onclick = copyThai;
      $('luneaThaiSaveV27').onclick = saveThai;
      $('luneaThaiArchiveOpenV27').onclick = openArchive;
    }
    if (!result.__luneaV27Observed) {
      result.__luneaV27Observed = true;
      new MutationObserver(syncThaiActions).observe(result, {childList:true,subtree:true,characterData:true,attributes:true});
    }
    const topics = $('luneaThaiTopicGrid');
    if (topics && !topics.__luneaV27Observed) {
      topics.__luneaV27Observed = true;
      topics.addEventListener('click', () => setTimeout(syncThaiActions, 0));
    }
    syncThaiActions();
    return true;
  }

  // ----------------------------------------------------------
  // Timing Oracle: hard isolate visual/source state per question
  // ----------------------------------------------------------
  function resetTimingDOM() {
    // Main reading mirrors.
    $('luneaTimingABInline')?.remove();
    $('luneaTimingInline')?.remove();

    // A/B source DOM. V16 mirrors this node, so it MUST be empty when the
    // question changes; hiding the panel alone is not enough.
    const cards = $('luneaTimingABCards');
    if (cards) cards.replaceChildren();

    const panel = $('luneaTimingABPanel');
    panel?.classList.remove('show');

    const ai = $('luneaTimingABAI');
    if (ai) { ai.classList.remove('show'); ai.textContent = ''; }

    try { W.LUNEA_TIMING_AB_LAST = null; } catch {}
  }

  function wrapStartSpread() {
    const fn = W.startSpread;
    if (typeof fn !== 'function' || fn.__luneaV27Wrapped) return false;
    function wrappedStartSpread(...args) {
      resetTimingDOM();
      return fn.apply(this, args);
    }
    wrappedStartSpread.__luneaV27Wrapped = true;
    wrappedStartSpread.__luneaV27Original = fn;
    W.startSpread = wrappedStartSpread;
    return true;
  }

  function wrapTimingDraw() {
    const btn = $('timingDraw');
    if (!btn || btn.__luneaV27Wrapped || typeof btn.onclick !== 'function') return false;
    const previous = btn.onclick;
    btn.onclick = function(event) {
      resetTimingDOM();
      return previous.call(this, event);
    };
    btn.__luneaV27Wrapped = true;
    return true;
  }

  function observeQuestionBoundaries() {
    const spreadQ = $('spreadQuestion');
    if (spreadQ && !spreadQ.__luneaV27Observed) {
      spreadQ.__luneaV27Observed = true;
      let last = clean(spreadQ.textContent || '');
      new MutationObserver(() => {
        const now = clean(spreadQ.textContent || '');
        if (now !== last) {
          last = now;
          resetTimingDOM();
        }
      }).observe(spreadQ, {childList:true,subtree:true,characterData:true});
    }

    const timingQ = $('timingQuestion');
    if (timingQ && !timingQ.__luneaV27Observed) {
      timingQ.__luneaV27Observed = true;
      let last = clean(timingQ.value || '');
      timingQ.addEventListener('input', () => {
        const now = clean(timingQ.value || '');
        if (now !== last) {
          last = now;
          resetTimingDOM();
        }
      });
    }
  }

  function boot() {
    addStyles();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      installThaiActions();
      wrapStartSpread();
      wrapTimingDraw();
      observeQuestionBoundaries();
      if (tries > 240 || (
        $('luneaThaiActionsV27') &&
        W.startSpread?.__luneaV27Wrapped &&
        $('timingDraw')?.__luneaV27Wrapped
      )) clearInterval(timer);
    }, 80);

    installThaiActions();
    wrapStartSpread();
    wrapTimingDraw();
    observeQuestionBoundaries();
  }

  W.LUNEA_V27 = { resetTimingDOM, installThaiActions };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
