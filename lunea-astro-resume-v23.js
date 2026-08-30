'use strict';

/*
  LUNEA ASTRO PERSISTENT RESUME V23
  =================================
  Keeps Transit / Return jobs recoverable when their overlay is closed or the
  iOS/PWA page is backgrounded. Browsers may suspend JavaScript while an app is
  truly in the background, so this module does not promise background CPU time;
  instead it persists the requested job and resumes it automatically on return.

  - Persists Transit topic/range and Return bodies/place before a calculation.
  - Keeps a compact global running badge visible even after closing the overlay.
  - On pageshow / visibility restore, automatically re-runs an unfinished job.
  - Works with the existing Astro Job Queue, so Transit and Return remain serialized.
  - Clears persistence only after a real rendered result is detected.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_RESUME_V23__) return;
  W.__LUNEA_ASTRO_RESUME_V23__ = true;

  const KEY = 'LUNEA_ASTRO_PENDING_V23';
  const MAX_AGE = 12 * 60 * 60 * 1000;
  const MAX_AUTO_ATTEMPTS = 4;
  const $ = id => document.getElementById(id);
  let autoLaunching = false;

  function readAll() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  function writeAll(value) {
    try { localStorage.setItem(KEY, JSON.stringify(value || {})); } catch {}
  }

  function cleanOld(rows) {
    const now = Date.now();
    let changed = false;
    ['transit','returns'].forEach(kind => {
      const row = rows[kind];
      if (row && now - Number(row.updatedAt || row.createdAt || 0) > MAX_AGE) {
        delete rows[kind];
        changed = true;
      }
    });
    if (changed) writeAll(rows);
    return rows;
  }

  function getPending(kind) {
    const rows = cleanOld(readAll());
    return rows[kind] || null;
  }

  function setPending(kind, spec, preserveAttempts = false) {
    const rows = cleanOld(readAll());
    const previous = rows[kind] || {};
    rows[kind] = {
      kind,
      ...spec,
      createdAt: Number(previous.createdAt || Date.now()),
      updatedAt: Date.now(),
      autoAttempts: preserveAttempts ? Number(previous.autoAttempts || 0) : 0
    };
    writeAll(rows);
    paintBadge();
    return rows[kind];
  }

  function bumpAttempt(kind) {
    const rows = cleanOld(readAll());
    if (!rows[kind]) return null;
    rows[kind].autoAttempts = Number(rows[kind].autoAttempts || 0) + 1;
    rows[kind].updatedAt = Date.now();
    writeAll(rows);
    return rows[kind];
  }

  function clearPending(kind) {
    const rows = readAll();
    if (rows[kind]) {
      delete rows[kind];
      writeAll(rows);
    }
    paintBadge();
  }

  function transitSpec() {
    return {
      topic: String($('astroTransitTopic')?.value || 'general'),
      days: Math.max(1, Number($('astroTransitDays')?.value || 30)),
      question: String($('astroTransitQuestion')?.value || '').trim()
    };
  }

  function returnSpec() {
    return {
      bodies: [...document.querySelectorAll('#astroReturnChecks input:checked')].map(x => String(x.value)),
      place: String($('astroReturnPlace')?.value || '').trim(),
      question: String($('astroReturnQuestion')?.value || '').trim()
    };
  }

  function succeeded(kind) {
    if (kind === 'transit') {
      const result = $('astroTransitResult');
      return !!(result && result.classList.contains('show') && String(result.textContent || '').trim());
    }
    const result = $('astroReturnResult');
    const status = String($('astroReturnStatus')?.textContent || '');
    return !!(result && String(result.textContent || '').trim() && /계산\s*완료/.test(status));
  }

  function activeState() {
    try { return W.LUNEA_ASTRO_JOB_QUEUE?.getState?.() || {}; }
    catch { return {}; }
  }

  function restoreInputs(kind, row) {
    if (!row) return false;
    if (kind === 'transit') {
      const topic = $('astroTransitTopic');
      const days = $('astroTransitDays');
      if (!topic || !days || !$('astroTransitRun')) return false;
      if ([...topic.options].some(o => o.value === row.topic)) topic.value = row.topic;
      if (![...days.options].some(o => Number(o.value) === Number(row.days))) {
        const o = document.createElement('option');
        o.value = String(row.days);
        o.textContent = `${row.days}일`;
        days.appendChild(o);
      }
      days.value = String(row.days);
      if ($('astroTransitQuestion') && row.question) $('astroTransitQuestion').value = row.question;
      topic.dispatchEvent(new Event('change', {bubbles:true}));
      days.dispatchEvent(new Event('change', {bubbles:true}));
      return true;
    }

    const btn = $('astroReturnRun');
    const checks = [...document.querySelectorAll('#astroReturnChecks input')];
    if (!btn || !checks.length) return false;
    const wanted = new Set(Array.isArray(row.bodies) ? row.bodies : []);
    checks.forEach(x => { x.checked = wanted.has(String(x.value)); });
    if ($('astroReturnPlace')) $('astroReturnPlace').value = row.place || '';
    if ($('astroReturnQuestion') && row.question) $('astroReturnQuestion').value = row.question;
    return true;
  }

  function invoke(kind, row) {
    if (!restoreInputs(kind, row)) return false;
    if (succeeded(kind)) {
      clearPending(kind);
      return true;
    }

    const queue = activeState();
    if (queue.active === kind || queue.queued === kind) return true;
    if (Number(row.autoAttempts || 0) >= MAX_AUTO_ATTEMPTS) {
      paintBadge();
      return false;
    }

    const btn = $(kind === 'transit' ? 'astroTransitRun' : 'astroReturnRun');
    if (!btn || typeof btn.onclick !== 'function') return false;
    bumpAttempt(kind);

    const event = {
      __luneaAutoResumeV23: true,
      preventDefault() {},
      stopPropagation() {}
    };
    try {
      autoLaunching = true;
      Promise.resolve(btn.onclick.call(btn, event)).finally(() => {
        autoLaunching = false;
        setTimeout(checkSuccess, 80);
      });
      return true;
    } catch (err) {
      autoLaunching = false;
      console.warn(`[LUNEA Astro Resume] ${kind} auto resume skipped`, err);
      return false;
    }
  }

  function resumePending() {
    if (document.hidden || autoLaunching) return;
    const rows = cleanOld(readAll());
    if (succeeded('transit')) clearPending('transit');
    if (succeeded('returns')) clearPending('returns');

    const queue = activeState();
    if (queue.active) {
      paintBadge();
      return;
    }

    const transit = rows.transit;
    const returns = rows.returns;
    if (transit && Number(transit.autoAttempts || 0) < MAX_AUTO_ATTEMPTS) {
      invoke('transit', transit);
      return;
    }
    if (returns && Number(returns.autoAttempts || 0) < MAX_AUTO_ATTEMPTS) {
      invoke('returns', returns);
    }
  }

  function checkSuccess() {
    if (succeeded('transit')) clearPending('transit');
    if (succeeded('returns')) clearPending('returns');
    paintBadge();
  }

  function wrap(kind) {
    const id = kind === 'transit' ? 'astroTransitRun' : 'astroReturnRun';
    const btn = $(id);
    if (!btn || btn.dataset.luneaAstroResumeV23 === '1' || typeof btn.onclick !== 'function') return false;

    // Wait until the job queue is outermost, then make persistence the new outermost layer.
    if (btn.dataset.luneaAstroJobQueueV1 !== '1') return false;
    const previous = btn.onclick;
    btn.dataset.luneaAstroResumeV23 = '1';
    btn.onclick = function(event) {
      if (!event?.__luneaAutoResumeV23) {
        setPending(kind, kind === 'transit' ? transitSpec() : returnSpec(), false);
      }
      const out = previous.call(this, event);
      Promise.resolve(out).finally(() => setTimeout(checkSuccess, 100));
      return out;
    };
    return true;
  }

  function ensureBadge() {
    let badge = $('luneaAstroJobBadgeV23');
    if (badge) return badge;
    badge = document.createElement('button');
    badge.type = 'button';
    badge.id = 'luneaAstroJobBadgeV23';
    badge.setAttribute('aria-live', 'polite');
    badge.innerHTML = '<span class="v23-orbit"></span><span class="v23-copy"><b>ASTRO</b><small>계산 상태</small></span>';
    badge.onclick = () => {
      const q = activeState();
      const rows = cleanOld(readAll());
      const kind = q.active || q.queued || (rows.transit ? 'transit' : rows.returns ? 'returns' : null);
      const overlay = $(kind === 'returns' ? 'astroReturnOverlay' : 'astroTransitOverlay');
      if (overlay) {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
      }
    };
    document.body.appendChild(badge);
    return badge;
  }

  function paintBadge() {
    const badge = ensureBadge();
    if (!badge) return;
    const queue = activeState();
    const rows = cleanOld(readAll());
    const pendingKind = rows.transit ? 'transit' : rows.returns ? 'returns' : null;
    const kind = queue.active || queue.queued || pendingKind;
    if (!kind) {
      badge.classList.remove('show','waiting');
      return;
    }

    const isActive = !!queue.active;
    const label = kind === 'returns' ? 'RETURN' : 'TRANSIT';
    let small = isActive ? '계산 계속 진행 중' : '복귀 시 자동 재개';
    const row = rows[kind];
    if (!isActive && row && Number(row.autoAttempts || 0) >= MAX_AUTO_ATTEMPTS) small = '자동 재개 한도 · 탭해서 확인';
    badge.querySelector('b').textContent = label;
    badge.querySelector('small').textContent = small;
    badge.classList.toggle('waiting', !isActive);
    badge.classList.add('show');
  }

  function addStyles() {
    if ($('luneaAstroResumeV23Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaAstroResumeV23Style';
    s.textContent = `
      @keyframes luneaAstroV23Orbit{to{transform:rotate(360deg)}}
      #luneaAstroJobBadgeV23{
        position:fixed;z-index:185;right:max(13px,env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));
        display:flex;align-items:center;gap:9px;min-width:132px;padding:9px 12px 9px 10px;border-radius:18px;
        opacity:0;transform:translateY(14px) scale(.96);pointer-events:none;
        color:#f1eef9;border:1px solid rgba(218,220,241,.18);
        background:linear-gradient(145deg,rgba(23,27,52,.94),rgba(9,12,28,.97));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 12px 34px rgba(0,0,0,.34),0 0 26px rgba(153,126,220,.11);
        backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:.28s ease
      }
      #luneaAstroJobBadgeV23.show{opacity:1;transform:none;pointer-events:auto}
      #luneaAstroJobBadgeV23 .v23-orbit{width:25px;height:25px;border-radius:50%;border:1px solid rgba(210,196,245,.38);position:relative;flex:0 0 auto}
      #luneaAstroJobBadgeV23 .v23-orbit::before{content:'';position:absolute;inset:4px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#f7f3ff,#b8a9df 42%,#5f5b82 100%);box-shadow:0 0 14px rgba(199,180,241,.25)}
      #luneaAstroJobBadgeV23 .v23-orbit::after{content:'';position:absolute;inset:-4px;border-radius:50%;border-top:1px solid rgba(159,210,226,.58);border-right:1px solid transparent;animation:luneaAstroV23Orbit 2.5s linear infinite}
      #luneaAstroJobBadgeV23.waiting .v23-orbit::after{animation-duration:5s;opacity:.55}
      #luneaAstroJobBadgeV23 .v23-copy{text-align:left;line-height:1.12}
      #luneaAstroJobBadgeV23 .v23-copy b{display:block;color:#ddd2f5;font:700 8.5px 'Cinzel',serif;letter-spacing:1.1px}
      #luneaAstroJobBadgeV23 .v23-copy small{display:block;margin-top:3px;color:#aaa9ba;font-size:9.2px;white-space:nowrap}
      @media(prefers-reduced-motion:reduce){#luneaAstroJobBadgeV23 .v23-orbit::after{animation:none}}
    `;
    document.head.appendChild(s);
  }

  function observeResults() {
    ['astroTransitResult','astroReturnResult','astroTransitStatus','astroReturnStatus'].forEach(id => {
      const el = $(id);
      if (!el || el.dataset.luneaResumeObserved === '1') return;
      el.dataset.luneaResumeObserved = '1';
      new MutationObserver(checkSuccess).observe(el, {childList:true,subtree:true,attributes:true,characterData:true});
    });
  }

  function install() {
    const a = wrap('transit');
    const b = wrap('returns');
    observeResults();
    paintBadge();
    return a && b;
  }

  function boot() {
    addStyles();
    ensureBadge();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      install();
      if (($('astroTransitRun')?.dataset.luneaAstroResumeV23 === '1' && $('astroReturnRun')?.dataset.luneaAstroResumeV23 === '1') || tries > 260) {
        clearInterval(timer);
        setTimeout(resumePending, 180);
      }
    }, 60);

    W.addEventListener('lunea:astro-job-state', () => {
      paintBadge();
      setTimeout(checkSuccess, 80);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(resumePending, 180);
    });
    W.addEventListener('pageshow', () => setTimeout(resumePending, 220));
    W.addEventListener('online', () => setTimeout(resumePending, 300));
  }

  W.LUNEA_ASTRO_RESUME_V23 = {
    resume:resumePending,
    pending:() => cleanOld(readAll()),
    clear:() => { try { localStorage.removeItem(KEY); } catch {} paintBadge(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
