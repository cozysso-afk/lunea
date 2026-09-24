'use strict';

/* LUNEA VEDIC PROFILE V1 CLIENT
   Independent sidereal/Lahiri profile calculation.
   Uses the shared birth-data source created by Celestial Profile V4.
*/
(() => {
  if (window.__LUNEA_VEDIC_PROFILE_V1__) return;
  window.__LUNEA_VEDIC_PROFILE_V1__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const STORAGE_KEY = 'LUNEA_VEDIC_PROFILE_V1';
  const DEFAULT_API = 'https://lunea-astro-api.onrender.com';
  const $ = id => document.getElementById(id);

  function addStyles() {
    if ($('luneaVedicProfileV1Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaVedicProfileV1Style';
    s.textContent = `
      .vedic-v1-card{margin-top:10px;padding:11px;border-radius:14px;border:1px solid rgba(211,170,255,.16);background:linear-gradient(145deg,rgba(130,84,183,.09),rgba(255,196,112,.045))}
      .vedic-v1-btn{width:100%;border:1px solid rgba(211,170,255,.30);background:linear-gradient(135deg,rgba(161,111,220,.20),rgba(255,192,102,.13));color:#f7edff;border-radius:12px;padding:11px;font-size:10.8px;font-weight:800;cursor:pointer;touch-action:manipulation}
      .vedic-v1-btn:disabled{opacity:.52;cursor:wait}
      .vedic-v1-status{margin-top:7px;font-size:9.2px;line-height:1.5;color:var(--dim)}
      .vedic-v1-status.ok{color:#c9edda}.vedic-v1-status.err{color:#ffc0ca}
      .vedic-v1-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}
      .vedic-v1-item{padding:9px;border-radius:11px;border:1px solid rgba(211,170,255,.12);background:rgba(255,255,255,.028)}
      .vedic-v1-item small{display:block;color:#a99abf;font-size:8px;margin-bottom:3px}.vedic-v1-item b{display:block;color:#f4ebfb;font-size:10.5px;line-height:1.4}.vedic-v1-item span{display:block;color:#cbbbd9;font-size:8.5px;line-height:1.4;margin-top:2px}
      .vedic-v1-planets{margin-top:8px;border-top:1px solid rgba(255,255,255,.055);padding-top:7px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
      .vedic-v1-planet{padding:7px 4px;text-align:center;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.055)}
      .vedic-v1-planet b{display:block;font-size:8px;color:#bcabd2}.vedic-v1-planet span{display:block;margin-top:2px;font-size:8.5px;color:#eee4f6;line-height:1.3}
      @media(max-width:360px){.vedic-v1-grid{grid-template-columns:1fr}.vedic-v1-planets{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(s);
  }

  function status(text, kind='') {
    const el = $('vedicV1Status');
    if (!el) return;
    el.textContent = text;
    el.className = `vedic-v1-status ${kind}`.trim();
  }

  function apiUrl() {
    return String(localStorage.getItem(API_KEY) || DEFAULT_API).trim().replace(/\/+$/, '');
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function render(data) {
    if (!data?.d1_rashi?.lagna) return;
    const lagna = data.d1_rashi.lagna;
    const moon = data.d1_rashi.planets?.Moon || {};
    const sun = data.d1_rashi.planets?.Sun || {};
    const p = data.panchanga || {};
    const result = $('vedicV1Result');
    if (!result) return;

    result.innerHTML = `
      <div class="vedic-v1-grid">
        <div class="vedic-v1-item"><small>LAGNA · 상승점</small><b>${esc(lagna.rashi)} · ${esc(lagna.rashi_ko)}</b><span>${esc(lagna.degree)}° · ${esc(lagna.nakshatra?.name)} Pada ${esc(lagna.nakshatra?.pada)}</span></div>
        <div class="vedic-v1-item"><small>MOON · 달</small><b>${esc(moon.rashi)} · ${esc(moon.rashi_ko)}</b><span>${esc(moon.nakshatra?.name)} Pada ${esc(moon.nakshatra?.pada)}</span></div>
        <div class="vedic-v1-item"><small>SUN · 태양</small><b>${esc(sun.rashi)} · ${esc(sun.rashi_ko)}</b><span>${esc(sun.degree)}° · H${esc(sun.whole_sign_house)}</span></div>
        <div class="vedic-v1-item"><small>AYANAMSHA</small><b>Lahiri ${esc(data.ayanamsha?.degree)}°</b><span>Sidereal · Whole Sign</span></div>
        <div class="vedic-v1-item"><small>TITHI</small><b>${esc(p.tithi?.paksha)} ${esc(p.tithi?.paksha_number)}</b><span>Tithi ${esc(p.tithi?.index)} / 30</span></div>
        <div class="vedic-v1-item"><small>PANCHANGA</small><b>${esc(p.vara?.name)} · ${esc(p.yoga?.name)}</b><span>${esc(p.karana?.name)} · ${esc(p.nakshatra?.name)}</span></div>
      </div>
      <div class="vedic-v1-planets">${Object.entries(data.d1_rashi.planets || {}).map(([name, planet]) => `<div class="vedic-v1-planet"><b>${esc(name)}</b><span>${esc(planet.rashi)} ${esc(planet.degree)}°<br>H${esc(planet.whole_sign_house)} · ${esc(planet.nakshatra?.name)} P${esc(planet.nakshatra?.pada)}</span></div>`).join('')}</div>
    `;

    const prov = data.provenance || {};
    const varaBoundary = prov.panchanga_vara_boundary === 'civil_midnight_v1' ? ' · Vara=현지 날짜 기준 V1' : '';
    status(`계산 완료 · ${prov.engine || 'Swiss Ephemeris'} · ${prov.ayanamsha || 'Lahiri'} · Node ${prov.node_policy || ''}${varaBoundary} · D9/Dasha는 V2에서 추가`, 'ok');
  }

  async function calculate() {
    const birthDate = $('birthDate')?.value || '';
    const birthTime = $('birthTime')?.value || '';
    const birthPlace = $('birthPlace')?.value?.trim() || '';
    if (!birthDate || !birthTime || !birthPlace) {
      status('공통 출생정보의 생년월일 · 출생시각 · 출생지를 먼저 입력해.', 'err');
      return;
    }

    const btn = $('vedicV1Calc');
    btn.disabled = true;
    btn.textContent = '🕉️ 베딕 계산 중…';
    status('Sidereal · Lahiri 기준으로 D1 / Nakshatra / Panchanga를 계산 중…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const api = apiUrl();
      await fetch(`${api}/health`, {cache:'no-store', signal:controller.signal});
      const res = await fetch(`${api}/v1/vedic/profile`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({birth_date:birthDate,birth_time:birthTime,place:birthPlace,timezone:'Asia/Seoul'}),
        signal:controller.signal,
      });
      let data = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      const record = {birthDate,birthTime,birthPlace,data,savedAt:new Date().toISOString()};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      render(data);
    } catch (err) {
      status(`베딕 계산 실패: ${err?.name === 'AbortError' ? '서버 응답 시간 초과' : (err?.message || err)}`, 'err');
    } finally {
      clearTimeout(timer);
      btn.disabled = false;
      btn.textContent = '🕉️ Vedic V1 자동 계산';
    }
  }

  function install() {
    const panel = $('cpv4PanelVedic');
    if (!panel || $('vedicV1Card')) return !!$('vedicV1Card');
    addStyles();
    const card = document.createElement('section');
    card.id = 'vedicV1Card';
    card.className = 'vedic-v1-card';
    card.innerHTML = `
      <div class="cpv3-kicker">VEDIC CORE V1 · 실제 계산</div>
      <p class="cpv3-note">공통 출생정보를 사용해 Swiss Ephemeris에서 Sidereal/Lahiri 값을 직접 계산해. Western Tropical 값의 단순 보정값을 사용하지 않아.</p>
      <p class="cpv3-note">Panchanga의 Vara(요일)는 V1에서 현지 날짜 자정 기준으로 표시하고, 일출 경계 판정은 후속 버전에서 별도 계산해.</p>
      <button type="button" class="vedic-v1-btn" id="vedicV1Calc">🕉️ Vedic V1 자동 계산</button>
      <div class="vedic-v1-status" id="vedicV1Status">미계산 · D1/Rāśi, Lagna, Graha, Nakshatra/Pada, Panchanga V1</div>
      <div id="vedicV1Result"></div>`;
    panel.appendChild(card);
    $('vedicV1Calc').addEventListener('click', calculate);

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
    const sameBirth = saved && saved.birthDate === ($('birthDate')?.value || '') && saved.birthTime === ($('birthTime')?.value || '') && saved.birthPlace === ($('birthPlace')?.value?.trim() || '');
    if (sameBirth && saved.data) render(saved.data);
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) clearInterval(timer);
  }, 100);
})();
