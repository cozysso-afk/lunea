'use strict';

/*
  LUNEA ASTRO NATAL CLIENT V1.1
  ------------------------------
  One-tap cold-start recovery for Render-hosted Astro Core.

  Scope:
  - only Natal connection lifecycle
  - no global fetch monkeypatch
  - no MutationObserver
  - no layout/compositor CSS changes
  - no Transit/Return/Thai calculation changes

  Flow:
  1) GET /health to wake/verify server
  2) POST /v1/natal
  3) retry POST once only for network/5xx transient failures
*/
(() => {
  if (window.__LUNEA_ASTRO_NATAL_CLIENT_V11__) return;
  window.__LUNEA_ASTRO_NATAL_CLIENT_V11__ = true;
  window.__LUNEA_ASTRO_NATAL_CLIENT_V1__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const DEFAULT_API_URL = 'https://lunea-astro-api.onrender.com';
  const $ = id => document.getElementById(id);

  function addStyles() {
    if ($('luneaAstroNatalClientStyle')) return;
    const s = document.createElement('style');
    s.id = 'luneaAstroNatalClientStyle';
    s.textContent = `
      #cpv3BirthGrid{grid-template-columns:1fr!important}
      #cpv3BirthGrid .field{min-width:0!important;width:100%!important}
      #cpv3BirthGrid input[type="date"],
      #cpv3BirthGrid input[type="time"],
      #cpv3BirthGrid input[type="text"]{
        display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
        box-sizing:border-box!important
      }
      .lunea-astro-connect{
        margin:10px 0 0;padding:11px;border-radius:13px;
        background:rgba(157,228,193,.045);border:1px solid rgba(157,228,193,.14)
      }
      .lunea-astro-connect label{
        display:block;font-size:9.5px;color:#cdebdc;font-weight:750;margin-bottom:5px
      }
      .lunea-astro-connect input{font-size:11px;padding:9px 10px}
      .lunea-astro-btn{
        width:100%;margin-top:8px;border:1px solid rgba(157,228,193,.28);
        background:linear-gradient(135deg,rgba(157,228,193,.18),rgba(165,130,255,.22));
        color:#f8f5ff;border-radius:12px;padding:11px;font-size:11px;font-weight:800;
        cursor:pointer;touch-action:manipulation
      }
      .lunea-astro-btn:disabled{opacity:.55;cursor:wait}
      .lunea-astro-status{margin-top:7px;font-size:9.5px;line-height:1.5;color:var(--dim)}
      .lunea-astro-status.ok{color:#bfe7d2}
      .lunea-astro-status.err{color:#ffc0ca}
    `;
    document.head.appendChild(s);
  }

  function normalizeApiUrl(raw) {
    return String(raw || '').trim().replace(/\/+$/, '');
  }

  function currentApiUrl() {
    const saved = normalizeApiUrl(localStorage.getItem(API_KEY));
    if (saved && !/your-astro-api\.example\.com/i.test(saved)) return saved;
    return DEFAULT_API_URL;
  }

  function setStatus(message, kind='') {
    const el = $('luneaAstroStatus');
    if (!el) return;
    el.textContent = message;
    el.className = `lunea-astro-status ${kind}`.trim();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fetchWithTimeout(url, options={}, timeoutMs=90000) {
    const controller = new AbortController();
    const upstream = options.signal;

    if (upstream?.aborted) controller.abort(upstream.reason);

    let relay = null;
    if (upstream && !upstream.aborted) {
      relay = () => controller.abort(upstream.reason);
      upstream.addEventListener('abort', relay, {once:true});
    }

    const timer = setTimeout(() => {
      try { controller.abort('lunea-astro-timeout'); } catch { controller.abort(); }
    }, timeoutMs);

    try {
      return await fetch(url, {...options, signal:controller.signal});
    } finally {
      clearTimeout(timer);
      if (upstream && relay) upstream.removeEventListener('abort', relay);
    }
  }

  async function warmAstroCore(api) {
    setStatus('Astro Core 서버 준비 확인 중… 처음 접속이면 서버를 깨우는 데 시간이 걸릴 수 있어.');

    const res = await fetchWithTimeout(`${api}/health`, {
      method:'GET',
      cache:'no-store',
      headers:{'Accept':'application/json'}
    }, 90000);

    if (!res.ok) throw new Error(`서버 준비 확인 실패: HTTP ${res.status}`);

    let data = null;
    try { data = await res.json(); } catch {}

    if (data && data.ok === false) throw new Error('Astro Core health 응답이 정상 상태가 아니야.');
    return data;
  }

  function shouldRetry(err, status) {
    if (status && [500,502,503,504].includes(status)) return true;
    const msg = String(err?.message || err || '');
    return /fetch|network|load failed|abort|timeout|시간/i.test(msg);
  }

  async function postNatal(api, payload) {
    const res = await fetchWithTimeout(`${api}/v1/natal`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    }, 50000);

    let data = null;
    try { data = await res.json(); } catch {}

    if (!res.ok) {
      const e = new Error(data?.detail || `${res.status} ${res.statusText}`);
      e.httpStatus = res.status;
      throw e;
    }
    return data;
  }

  async function postNatalWithSingleRetry(api, payload) {
    try {
      return await postNatal(api, payload);
    } catch (err) {
      if (!shouldRetry(err, err?.httpStatus)) throw err;

      setStatus('서버는 연결됐지만 첫 계산 응답이 불안정해. 자동으로 한 번만 다시 계산 중…');
      await sleep(1200);
      return await postNatal(api, payload);
    }
  }

  function installUI() {
    if ($('luneaAstroConnectBox')) return;
    const natalSection = $('cpv3NatalGrid')?.closest('.cpv3-section');
    if (!natalSection) return;

    const box = document.createElement('div');
    box.id = 'luneaAstroConnectBox';
    box.className = 'lunea-astro-connect';
    box.innerHTML = `
      <label>ASTRO CORE API · 계산 서버 주소</label>
      <input id="luneaAstroApiUrl" type="url" inputmode="url"
             placeholder="${DEFAULT_API_URL}">
      <button type="button" class="lunea-astro-btn" id="luneaNatalCalcBtn">
        ✦ Natal(네이탈·출생차트) 자동 계산
      </button>
      <div class="lunea-astro-status" id="luneaAstroStatus">
        한 번 누르면 서버 준비 확인 → Natal 계산까지 이어서 처리해.
      </div>
    `;
    natalSection.appendChild(box);

    const input = $('luneaAstroApiUrl');
    input.value = currentApiUrl();

    if (!localStorage.getItem(API_KEY)) {
      localStorage.setItem(API_KEY, input.value);
    }

    input.addEventListener('change', () => {
      const url = normalizeApiUrl(input.value);
      input.value = url || DEFAULT_API_URL;
      localStorage.setItem(API_KEY, input.value);
    });

    $('luneaNatalCalcBtn').addEventListener('click', calculateNatal);
  }

  let calculating = false;

  async function calculateNatal() {
    if (calculating) return;

    const btn = $('luneaNatalCalcBtn');
    const input = $('luneaAstroApiUrl');
    const api = normalizeApiUrl(input?.value || currentApiUrl()) || DEFAULT_API_URL;

    const birthDate = $('birthDate')?.value || '';
    const birthTime = $('birthTime')?.value || '';
    const birthPlace = $('birthPlace')?.value.trim() || '';

    if (!birthDate || !birthTime || !birthPlace) {
      setStatus('생년월일 · 출생 시각 · 출생지를 먼저 입력해줘.', 'err');
      return;
    }

    if (input) input.value = api;
    localStorage.setItem(API_KEY, api);

    calculating = true;
    btn.disabled = true;
    btn.setAttribute('aria-busy','true');
    btn.textContent = '✦ 서버 준비 중…';

    const payload = {
      birth_date:birthDate,
      birth_time:birthTime,
      place:birthPlace,
      timezone:'Asia/Seoul'
    };

    try {
      await warmAstroCore(api);

      btn.textContent = '✦ Natal 계산 중…';
      setStatus('서버 준비 완료 · 출생차트를 계산 중…');

      const data = await postNatalWithSingleRetry(api, payload);

      if (!data?.planets?.Sun || !data?.angles?.ASC) {
        throw new Error('Natal 응답 형식이 예상과 달라.');
      }

      localStorage.setItem(NATAL_KEY, JSON.stringify(data));

      if (typeof loadProfileForm === 'function') {
        try { loadProfileForm(); }
        catch (e) { console.warn('[LUNEA Natal] profile refresh skipped', e); }
      }

      setStatus(
        `계산 완료 · ${data.meta?.ephemeris || 'ephemeris'} · ` +
        `${data.birth?.place_resolved || birthPlace} · ` +
        `Sect: ${data.sect === 'day' ? '주간' : '야간'}`,
        'ok'
      );
    } catch (err) {
      const msg = String(err?.message || err);
      setStatus(`계산 실패: ${msg}`, 'err');
    } finally {
      calculating = false;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = '✦ Natal(네이탈·출생차트) 자동 계산';
    }
  }

  function boot() {
    addStyles();
    installUI();
    console.info('✦ LUNEA ASTRO NATAL CLIENT V1.1 loaded · one-tap cold-start recovery');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
