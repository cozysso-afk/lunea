'use strict';

/*
  LUNEA ASTRO NATAL CLIENT V1
  Load AFTER celestial-profile-v3.js and BEFORE interpretation-gloss-v1.js.

  - Fixes iOS birth date/time grid overlap.
  - Adds Astro Core API URL setting.
  - Adds Natal automatic calculation button.
  - Saves deterministic calculation output to LUNEA_ASTRO_NATAL_V3.
  - celestial-profile-v3.js already reads that key into UI + interpretation prompt.
*/
(() => {
  if (window.__LUNEA_ASTRO_NATAL_CLIENT_V1__) return;
  window.__LUNEA_ASTRO_NATAL_CLIENT_V1__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';

  const $ = id => document.getElementById(id);

  function addStyles() {
    if ($('luneaAstroNatalClientStyle')) return;
    const s = document.createElement('style');
    s.id = 'luneaAstroNatalClientStyle';
    s.textContent = `
      /* iOS Safari: date/time intrinsic width can overflow a 2-col grid. */
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
        color:#f8f5ff;border-radius:12px;padding:11px;font-size:11px;font-weight:800;cursor:pointer
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
             placeholder="https://your-astro-api.example.com">
      <button type="button" class="lunea-astro-btn" id="luneaNatalCalcBtn">
        ✦ Natal(네이탈·출생차트) 자동 계산
      </button>
      <div class="lunea-astro-status" id="luneaAstroStatus">
        계산 서버가 연결되면 출생정보로 행성·ASC·MC·Whole Sign(홀사인)·Placidus(플라시두스)를 자동 계산해.
      </div>
    `;
    natalSection.appendChild(box);

    $('luneaAstroApiUrl').value = localStorage.getItem(API_KEY) || '';
    $('luneaAstroApiUrl').addEventListener('change', () => {
      const url = normalizeApiUrl($('luneaAstroApiUrl').value);
      if (url) localStorage.setItem(API_KEY, url);
      else localStorage.removeItem(API_KEY);
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
    const api = normalizeApiUrl($('luneaAstroApiUrl')?.value || localStorage.getItem(API_KEY));
    const birthDate = $('birthDate')?.value || '';
    const birthTime = $('birthTime')?.value || '';
    const birthPlace = $('birthPlace')?.value.trim() || '';

    if (!api) {
      setStatus('Astro Core API 주소가 아직 없어. 계산 서버 배포 후 주소를 한 번만 넣으면 돼.', 'err');
      return;
    }
    if (!birthDate || !birthTime || !birthPlace) {
      setStatus('생년월일 · 출생 시각 · 출생지를 먼저 입력해줘.', 'err');
      return;
    }

    localStorage.setItem(API_KEY, api);
    btn.disabled = true;
    setStatus('천문 계산 중… DE440s 우선으로 Natal 값을 계산하고 있어.');

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

      // V3의 wrapped loader가 새 Natal 데이터를 다시 그려준다.
      if (typeof loadProfileForm === 'function') loadProfileForm();

      setStatus(
        `계산 완료 · ${data.meta?.ephemeris || 'ephemeris'} · ` +
        `${data.birth?.place_resolved || birthPlace} · ` +
        `Sect(주·야간 차트 구분): ${data.sect === 'day' ? '주간' : '야간'}`,
        'ok'
      );
    } catch (err) {
      setStatus(`계산 실패: ${err?.message || err}`, 'err');
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
