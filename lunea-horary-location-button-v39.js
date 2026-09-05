'use strict';

/*
  LUNEA HORARY LOCATION BUTTON V39
  ================================
  Visible one-tap current-location control for the Horary modal.

  - Adds a main-screen "현재 위치 인식" button beside the place field.
  - Uses browser Geolocation only after an explicit tap.
  - Fills latitude/longitude and timezone controls used by Horary Hardening V38.
  - Keeps the existing manual place input as a fallback and never requests
    location permission automatically on modal open.
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
      updateStatus(`현재 위치 반영 완료 · ${lat.toFixed(4)}, ${lon.toFixed(4)} · ${tz}`);
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
    if (parent?.classList?.contains('horary-grid')) {
      const row = document.createElement('div');
      row.className = 'lunea-horary-place-row-v39';
      parent.insertBefore(row, field);
      row.appendChild(field);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini';
      btn.id = BUTTON_ID;
      btn.textContent = '⌖ 현재 위치 인식';
      row.appendChild(btn);
      btn.addEventListener('click', resolveCurrentLocation);
      return true;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini';
    btn.id = BUTTON_ID;
    btn.textContent = '⌖ 현재 위치 인식';
    field.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', resolveCurrentLocation);
    return true;
  }

  function boot() {
    ensureButton();
    const observer = new MutationObserver(() => ensureButton());
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
