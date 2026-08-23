'use strict';

/*
  LUNEA ASTRO NATAL CLIENT V1
  Load AFTER celestial-profile-v3.js and BEFORE interpretation-gloss-v1.js.

  - Fixes iOS birth date/time grid overlap.
  - Uses the deployed LUNEA Astro Core service by default.
  - Still allows the URL to be edited and persisted in localStorage.
  - Adds Natal automatic calculation button.
  - Saves deterministic calculation output to LUNEA_ASTRO_NATAL_V3.
*/
(() => {
  if (window.__LUNEA_ASTRO_NATAL_CLIENT_V1__) return;
  window.__LUNEA_ASTRO_NATAL_CLIENT_V1__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';

  /*
    render.yaml service name is "lunea-astro-api".
    Render's standard service hostname is therefore this URL.
    If a custom/different Render hostname is ever used, the field below
    remains editable and the edited URL is saved.
  */
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
      .lunea-astro-btn:disabled{opacity:.45;cursor:wait}
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
        LUNEA Astro Core 서버를 사용해 출생정보로 행성·ASC·MC·Whole Sign·Placidus를 자동 계산해.
      </div>
    `;
    natalSection.appendChild(box);

    const input = $('luneaAstroApiUrl');
    input.value = currentApiUrl();

    /* Persist the working/default URL immediately so Transit/Return/Thai share it. */
    if (!localStorage.getItem(API_KEY)) {
      localStorage.setItem(API_KEY, input.value);
    }

    input.addEventListener('change', () => {
      const url = normalizeApiUrl(input.value);
      if (url) localStorage.setItem(API_KEY, url);
      else {
        input.value = DEFAULT_API_URL;
        localStorage.setItem(API_KEY, DEFAULT_API_URL);
      }
    });

    $('luneaNatalCalcBtn').addEventListener('click', calculateNatal);
  }

  function setStatus(message, kind='') {
    const el = $('luneaAstroStatus');
    if (!el) return;
    el.textContent = message;
    el.className = `lunea-astro-status ${kind}`.trim();
  }

  async function calculateNatal() {
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

    btn.disabled = true;
    setStatus('Astro Core 연결 중… 무료 서버가 잠들어 있었다면 첫 계산은 조금 더 걸릴 수 있어.');

    try {
      const res = await fetch(`${api}/v1/natal`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          place: birthPlace,
          timezone: 'Asia/Seoul'
        })
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const detail = data?.detail || `${res.status} ${res.statusText}`;
        throw new Error(detail);
      }
      if (!data?.planets?.Sun || !data?.angles?.ASC) {
        throw new Error('Natal 응답 형식이 예상과 달라.');
      }

      localStorage.setItem(NATAL_KEY, JSON.stringify(data));

      if (typeof loadProfileForm === 'function') loadProfileForm();

      setStatus(
        `계산 완료 · ${data.meta?.ephemeris || 'ephemeris'} · ` +
        `${data.birth?.place_resolved || birthPlace} · ` +
        `Sect: ${data.sect === 'day' ? '주간' : '야간'}`,
        'ok'
      );
    } catch (err) {
      const msg = String(err?.message || err);
      setStatus(
        `계산 실패: ${msg}` +
        (/fetch|network|load failed/i.test(msg)
          ? ' · 서버가 배포 중이거나 잠든 상태일 수 있어. 잠시 후 한 번 더 눌러줘.'
          : ''),
        'err'
      );
    } finally {
      btn.disabled = false;
    }
  }

  function boot() {
    addStyles();
    installUI();
    console.info('✦ LUNEA ASTRO NATAL CLIENT V1 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
