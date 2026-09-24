'use strict';

/*
  LUNEA HORARY LOCATION BUTTON V39.3
  ==================================
  - Explicit one-tap browser geolocation for Horary.
  - Keeps the actual IANA timezone internally, but shows Asia/Seoul as
    "한국시간 (UTC+9)" in user-facing status text.
  - Injects GPS coordinates into direct /v1/horary and /v1/prashna requests,
    plus legacy resumable Horary job requests, so a label like
    "현재 위치 (lat, lon)" is never mistaken for a city name by the API.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_LOCATION_BUTTON_V39__) return;
  W.__LUNEA_HORARY_LOCATION_BUTTON_V39__ = true;

  const $ = id => document.getElementById(id);
  const BUTTON_ID = 'luneaHoraryLocationNowV39';
  const STYLE_ID = 'luneaHoraryLocationNowV39Style';

  function ensureStyle() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .lunea-horary-place-row-v39{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:end}
      #${BUTTON_ID}{min-height:38px;white-space:nowrap;padding-inline:11px}
      @media(max-width:520px){.lunea-horary-place-row-v39{grid-template-columns:1fr}#${BUTTON_ID}{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureAdvancedFields() {
    try { W.LUNEA_HORARY_HARDENING_V38?.ensureAdvancedLocation?.(); } catch {}
  }

  function setAdvancedValue(id, value) {
    const el = $(id);
    if (el) el.value = value;
  }

  function updateStatus(text, ok = true) {
    const status = $('astroHoraryStatus');
    if (!status) return;
    status.textContent = text;
    status.className = `horary-status ${ok ? 'ok' : 'err'}`;
  }

  function displayTimezone(timezone) {
    const tz = String(timezone || '').trim();
    if (tz === 'Asia/Seoul') return '한국시간 (UTC+9)';
    return tz || '시간대 미확인';
  }

  function readCurrentGeo() {
    const latRaw = String($('luneaHoraryLatV38')?.value || '').trim();
    const lonRaw = String($('luneaHoraryLonV38')?.value || '').trim();
    let lat = latRaw === '' ? NaN : Number(latRaw);
    let lon = lonRaw === '' ? NaN : Number(lonRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      const place = String($('astroHoraryPlace')?.value || '').trim();
      const match = place.match(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
      if (match) {
        lat = Number(match[1]);
        lon = Number(match[2]);
      }
    }

    let timezone = String($('luneaHoraryTimezoneV38')?.value || '').trim();
    if (!timezone) {
      try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'; }
      catch { timezone = 'Asia/Seoul'; }
    }
    return {lat, lon, timezone};
  }

  function enrichPayload(payload) {
    const next = {...(payload || {})};
    const geo = readCurrentGeo();
    if (geo.timezone) next.timezone = geo.timezone;
    if (Number.isFinite(geo.lat) && Number.isFinite(geo.lon)) {
      next.lat = geo.lat;
      next.lon = geo.lon;
    }
    return next;
  }

  function rewriteHoraryJob(init) {
    if (!init?.body || typeof init.body !== 'string') return init;
    try {
      const envelope = JSON.parse(init.body);
      if (String(envelope?.kind || '').toLowerCase() !== 'horary' || !envelope?.payload) return init;
      return {
        ...init,
        body: JSON.stringify({...envelope, payload: enrichPayload(envelope.payload)})
      };
    } catch {
      return init;
    }
  }

  function rewriteHoraryDirect(init) {
    if (!init?.body || typeof init.body !== 'string') return init;
    try {
      const payload = JSON.parse(init.body);
      return {...init, body: JSON.stringify(enrichPayload(payload))};
    } catch {
      return init;
    }
  }

  function installHoraryGeoBridge() {
    if (W.__LUNEA_HORARY_GEO_JOB_BRIDGE_V39__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_HORARY_GEO_JOB_BRIDGE_V39__ = true;
    const priorFetch = W.fetch.bind(W);

    W.fetch = function(input, init = {}) {
      let url = '';
      const method = String(init?.method || input?.method || 'GET').toUpperCase();
      try {
        url = typeof input === 'string'
          ? input
          : (input instanceof URL ? input.href : String(input?.url || ''));
      } catch {}

      let nextInit = init;
      if (method === 'POST' && /\/v1\/(?:horary|prashna)(?:\?|$)/i.test(url)) {
        nextInit = rewriteHoraryDirect(init);
      } else if (method === 'POST' && /\/v1\/jobs\/astro(?:\?|$)/i.test(url)) {
        nextInit = rewriteHoraryJob(init);
      }
      return priorFetch(input, nextInit);
    };
  }

  function resolveCurrentLocation() {
    const btn = $(BUTTON_ID);
    if (!btn) return;
    if (!navigator.geolocation) {
      updateStatus('이 브라우저에서는 현재 위치를 사용할 수 없어.', false);
      return;
    }

    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⌖ 위치 확인 중…';

    navigator.geolocation.getCurrentPosition(pos => {
      const lat = Number(pos.coords.latitude);
      const lon = Number(pos.coords.longitude);
      const tz = (() => {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'; }
        catch { return 'Asia/Seoul'; }
      })();

      ensureAdvancedFields();
      setAdvancedValue('luneaHoraryLatV38', lat.toFixed(6));
      setAdvancedValue('luneaHoraryLonV38', lon.toFixed(6));
      setAdvancedValue('luneaHoraryTimezoneV38', tz);

      const place = $('astroHoraryPlace');
      if (place) {
        place.value = `현재 위치 (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        place.dataset.luneaGeoV39 = '1';
      }

      btn.disabled = false;
      btn.textContent = '✓ 현재 위치 인식됨';
      updateStatus(`현재 위치 반영 완료 · ${lat.toFixed(4)}, ${lon.toFixed(4)} · ${displayTimezone(tz)}`);
      setTimeout(() => { if (btn) btn.textContent = old; }, 1800);
    }, err => {
      btn.disabled = false;
      btn.textContent = old;
      const message = err?.code === 1
        ? '위치 권한이 거부됐어. 아이폰 설정에서 이 사이트의 위치 접근을 허용하거나 장소를 직접 입력해줘.'
        : `현재 위치를 가져오지 못했어: ${err?.message || err}`;
      updateStatus(message, false);
    }, {enableHighAccuracy:true, timeout:12000, maximumAge:30000});
  }

  function ensureButton() {
    if ($(BUTTON_ID)) return true;
    const place = $('astroHoraryPlace');
    if (!place) return false;
    const field = place.closest('.field') || place.parentElement;
    if (!field) return false;

    ensureStyle();
    const parent = field.parentElement;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini';
    btn.id = BUTTON_ID;
    btn.textContent = '⌖ 현재 위치 인식';
    btn.addEventListener('click', resolveCurrentLocation);

    if (parent?.classList?.contains('horary-grid')) {
      const row = document.createElement('div');
      row.className = 'lunea-horary-place-row-v39';
      parent.insertBefore(row, field);
      row.appendChild(field);
      row.appendChild(btn);
      return true;
    }

    field.insertAdjacentElement('afterend', btn);
    return true;
  }

  function boot() {
    installHoraryGeoBridge();
    ensureButton();
    const observer = new MutationObserver(() => ensureButton());
    observer.observe(document.documentElement, {childList:true, subtree:true});
    W.LUNEA_HORARY_LOCATION_BUTTON_V39 = Object.freeze({
      version:'39.3', readCurrentGeo, rewriteHoraryJob, rewriteHoraryDirect, displayTimezone
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

/* Prashna UI loader: stays coupled to the Horary location bridge so both
   question-moment systems receive identical location/timezone context. */
(() => {
  const W = window;
  if (W.__LUNEA_PRASHNA_UI_LOADER_V1__) return;
  W.__LUNEA_PRASHNA_UI_LOADER_V1__ = true;

  const version = (() => {
    try {
      const src = document.currentScript?.src || '';
      return src ? (new URL(src, location.href).searchParams.get('v') || '1') : '1';
    } catch { return '1'; }
  })();

  function load() {
    if (document.getElementById('luneaPrashnaV1Loader')) return;
    const script = document.createElement('script');
    script.id = 'luneaPrashnaV1Loader';
    script.src = `./lunea-prashna-v1.js?v=${encodeURIComponent(version)}`;
    script.async = false;
    script.onerror = () => console.info('[LUNEA] Prashna V1 UI skipped');
    (document.head || document.documentElement).appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, {once:true});
  else load();
})();
