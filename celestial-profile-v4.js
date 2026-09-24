'use strict';

/* LUNEA CELESTIAL PROFILE V4 · AUTO CALC
   - one shared birth-data block for Western / Saju / Thai / Vedic
   - Four Pillars auto calculation via Astro Core
   - existing detailed Saju fields remain as explicit manual override
   - Vedic tab locks sidereal/Lahiri policy without faking calculations
*/
(() => {
  if (window.__LUNEA_CELESTIAL_PROFILE_V4__) return;
  window.__LUNEA_CELESTIAL_PROFILE_V4__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const AUTO_KEY = 'LUNEA_SAJU_AUTO_V1';
  const DEFAULT_API = 'https://lunea-astro-api.onrender.com';
  const $ = id => document.getElementById(id);

  const elementField = Object.freeze({목:'elemWood',화:'elemFire',토:'elemEarth',금:'elemMetal',수:'elemWater'});

  function addStyles() {
    if ($('luneaCelestialProfileV4Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaCelestialProfileV4Style';
    s.textContent = `
      #cpv3Tabs.cpv4-tabs{grid-template-columns:repeat(4,minmax(0,1fr))}
      #cpv3Tabs.cpv4-tabs .cpv3-tab{font-size:9.2px;padding:9px 2px}
      .cpv4-shared-birth{margin:9px 0 12px;padding:12px;border-radius:16px;background:linear-gradient(145deg,rgba(127,222,211,.07),rgba(189,164,248,.07));border:1px solid rgba(127,222,211,.18)}
      .cpv4-shared-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
      .cpv4-shared-head b{font:700 10px 'Cinzel','Noto Serif KR',serif;color:#b8eee5;letter-spacing:1px}
      .cpv4-shared-head span{font-size:8.5px;color:#b6a8cb;border:1px solid rgba(189,164,248,.16);border-radius:999px;padding:3px 6px}
      .cpv4-birth-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      .cpv4-birth-grid .field{min-width:0;margin:0}
      .cpv4-birth-grid .field:last-child{grid-column:1/-1}
      .cpv4-birth-grid input,.cpv4-birth-grid select{width:100%;min-width:0;box-sizing:border-box}
      .cpv4-note{font-size:9.4px;line-height:1.5;color:var(--dim);margin:4px 0 0}
      .cpv4-auto{margin:9px 0 12px;padding:12px;border-radius:15px;border:1px solid rgba(255,210,125,.17);background:linear-gradient(145deg,rgba(255,210,125,.055),rgba(189,164,248,.05))}
      .cpv4-auto-actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:9px}
      .cpv4-auto button{border-radius:11px;padding:10px 9px;font-size:10.5px;font-weight:800;cursor:pointer;touch-action:manipulation}
      #cpv4SajuCalc{border:1px solid rgba(255,210,125,.28);background:linear-gradient(135deg,rgba(255,210,125,.16),rgba(165,130,255,.18));color:#fff4da}
      #cpv4SajuManual{border:1px solid rgba(189,164,248,.18);background:rgba(255,255,255,.035);color:#cfc4df}
      #cpv4SajuCalc:disabled{opacity:.52;cursor:wait}
      .cpv4-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:9px}
      .cpv4-pillar{padding:8px 5px;border-radius:11px;text-align:center;border:1px solid rgba(189,164,248,.13);background:rgba(255,255,255,.03)}
      .cpv4-pillar small{display:block;color:var(--dim);font-size:8px;margin-bottom:4px}
      .cpv4-pillar b{display:block;color:#fff3d7;font-size:12px}
      .cpv4-pillar em{display:block;color:#baacd0;font-size:8.5px;font-style:normal;margin-top:3px}
      .cpv4-elements{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
      .cpv4-elements span{font-size:8.8px;padding:3px 6px;border-radius:999px;background:rgba(127,222,211,.055);border:1px solid rgba(127,222,211,.12);color:#bfe9e2}
      .cpv4-status{font-size:9px;line-height:1.5;color:var(--dim);margin-top:7px}
      .cpv4-status.ok{color:#bfe7d2}.cpv4-status.err{color:#ffc0ca}
      .cpv4-manual-hidden{display:none!important}
      .cpv4-vedic-policy{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}
      .cpv4-vedic-policy div{padding:9px;border-radius:11px;border:1px solid rgba(189,164,248,.13);background:rgba(189,164,248,.04)}
      .cpv4-vedic-policy b{display:block;font-size:9.5px;color:#e8defa}.cpv4-vedic-policy span{display:block;margin-top:2px;font-size:8.6px;color:var(--dim)}
      @media(max-width:380px){#cpv3Tabs.cpv4-tabs .cpv3-tab{font-size:8.4px}.cpv4-pillars{grid-template-columns:1fr 1fr}.cpv4-birth-grid{grid-template-columns:1fr}.cpv4-birth-grid .field:last-child{grid-column:auto}.cpv4-auto-actions{grid-template-columns:1fr}.cpv4-vedic-policy{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function fieldContainer(id) { return $(id)?.closest('.field') || null; }

  function ensureSharedBirth() {
    const tabs = $('cpv3Tabs');
    if (!tabs || $('cpv4SharedBirth')) return !!$('cpv4SharedBirth');
    const section = document.createElement('section');
    section.id = 'cpv4SharedBirth';
    section.className = 'cpv4-shared-birth';
    section.innerHTML = `
      <div class="cpv4-shared-head"><b>COMMON · 출생정보</b><span>한 번 입력 · 모든 체계 공유</span></div>
      <p class="cpv4-note">생년월일 · 출생시각 · 출생지를 한 번만 입력해. Western, 사주, Thai, Vedic 계산이 이 값을 공통 원본으로 사용해.</p>
      <div class="cpv4-birth-grid" id="cpv4BirthGrid"></div>
    `;
    tabs.insertAdjacentElement('beforebegin', section);
    const grid = $('cpv4BirthGrid');
    ['birthDate','birthTime','birthPlace'].forEach(id => {
      const field = fieldContainer(id);
      if (field) grid.appendChild(field);
    });

    const oldGrid = $('cpv3BirthGrid');
    if (oldGrid) oldGrid.hidden = true;
    const westernBirth = oldGrid?.closest('.cpv3-section');
    if (westernBirth) {
      const kicker = westernBirth.querySelector('.cpv3-kicker');
      const note = westernBirth.querySelector('.cpv3-note');
      if (kicker) kicker.textContent = 'WESTERN · 기본 설정';
      if (note) note.textContent = '위 공통 출생정보를 사용해 Natal을 계산해. 아래 값은 Western 전용 호환 설정이야.';
    }
    return true;
  }

  function activateTab(name) {
    document.querySelectorAll('#cpv3Tabs .cpv3-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.cpv3Tab === name));
    document.querySelectorAll('.cpv3-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.cpv4Name === name || panel.id === `cpv3Panel${name[0].toUpperCase()+name.slice(1)}`));
    try { localStorage.setItem('LUNEA_PROFILE_V3_ACTIVE_TAB', name); } catch {}
  }

  function ensureVedicTab() {
    const tabs = $('cpv3Tabs');
    const thai = $('cpv3PanelThai');
    if (!tabs || !thai) return false;
    tabs.classList.add('cpv4-tabs');
    if (!$('cpv4VedicTab')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'cpv4VedicTab';
      btn.className = 'cpv3-tab';
      btn.dataset.cpv3Tab = 'vedic';
      btn.textContent = '🕉️ 베딕';
      btn.addEventListener('click', () => activateTab('vedic'));
      tabs.appendChild(btn);
    }
    if (!$('cpv4PanelVedic')) {
      const panel = document.createElement('div');
      panel.id = 'cpv4PanelVedic';
      panel.className = 'cpv3-panel';
      panel.dataset.cpv4Name = 'vedic';
      panel.innerHTML = `
        <section class="cpv3-section">
          <div class="cpv3-kicker">VEDIC / JYOTISHA · 베딕점성술</div>
          <p class="cpv3-note">Western Tropical 계산을 이름만 바꿔 재사용하지 않아. Vedic은 별도 Sidereal 계산 결과만 저장·해석해.</p>
          <div class="cpv4-vedic-policy">
            <div><b>ZODIAC</b><span>Sidereal · 고정</span></div>
            <div><b>AYANAMSHA</b><span>Lahiri · V1 기본</span></div>
            <div><b>V1 OUTPUT</b><span>D1 / Rāśi · Lagna</span></div>
            <div><b>LUNAR</b><span>Nakshatra · Pada</span></div>
          </div>
          <p class="cpv4-note" style="margin-top:9px">현재 단계는 프로필/계산 정책 기반공사. 계산되지 않은 Vedic 값은 AI 프롬프트에 보내지 않아.</p>
        </section>`;
      thai.insertAdjacentElement('afterend', panel);
    }
    return true;
  }

  function pillarLegacyValue(pillar) {
    return `${pillar.stem}(${pillar.stem_hangul})${pillar.branch}(${pillar.branch_hangul})`;
  }

  function setSelectByHanja(id, pillar) {
    const el = $(id);
    if (!el || !pillar) return;
    const legacy = pillarLegacyValue(pillar);
    const exact = [...el.options].find(o => o.value === legacy);
    const byHanja = [...el.options].find(o => String(o.value).replace(/[^甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g,'') === pillar.hanja);
    el.value = exact?.value || byHanja?.value || el.value;
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function setSimple(id, value) {
    const el = $(id);
    if (!el) return;
    const target = String(value ?? '');
    if (el.tagName === 'SELECT') {
      const option = [...el.options].find(o => o.value === target || o.textContent.trim() === target);
      if (option) el.value = option.value;
    } else {
      el.value = target;
    }
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function syncTenGodChips() {
    const source = $('sajuTenGods');
    const box = document.querySelector('[data-for="sajuTenGods"]');
    if (!source || !box) return;
    const raw = source.value || '';
    box.querySelectorAll('.lunea-choice-chip').forEach(b => b.classList.toggle('active', raw.includes(b.dataset.value)));
  }

  function applyAutoResult(data, writeFields=true) {
    if (!data?.pillars) return;
    const ids = {year:'sajuYearPillar',month:'sajuMonthPillar',day:'sajuDayPillar',hour:'sajuHourPillar'};
    if (writeFields) {
      Object.entries(ids).forEach(([key,id]) => setSelectByHanja(id, data.pillars[key]));
      Object.entries(elementField).forEach(([element,id]) => setSimple(id, data.visible_elements?.[element] ?? ''));
      const tenGods = [...new Set(Object.values(data.pillars).map(p => p.ten_god_stem).filter(x => x && x !== '일간'))];
      const tg = $('sajuTenGods');
      if (tg) { tg.value = tenGods.join(', '); tg.dispatchEvent(new Event('change',{bubbles:true})); syncTenGodChips(); }
      const dayStem = data.day_master?.stem;
      const saju = $('saju');
      if (saju && dayStem && saju.tagName === 'SELECT') {
        const option = [...saju.options].find(o => String(o.value).startsWith(dayStem));
        if (option) { saju.value = option.value; saju.dispatchEvent(new Event('change',{bubbles:true})); }
      }
    }

    const labels = {year:'년주',month:'월주',day:'일주',hour:'시주'};
    const box = $('cpv4Pillars');
    if (box) box.innerHTML = Object.entries(labels).map(([key,label]) => {
      const p = data.pillars[key];
      return `<div class="cpv4-pillar"><small>${label}</small><b>${p?.display || '—'}</b><em>${p?.ten_god_stem || ''}</em></div>`;
    }).join('');
    const ebox = $('cpv4Elements');
    if (ebox) ebox.innerHTML = ['목','화','토','금','수'].map(k => `<span>${k} ${data.visible_elements?.[k] ?? '—'}</span>`).join('');
    const provenance = data.provenance || {};
    setSajuStatus(`자동계산 완료 · ${provenance.library || 'engine'} ${provenance.library_version || ''} · ${provenance.timezone || ''} · 진태양시 보정 ${provenance.true_solar_time_correction ? '적용' : '미적용'}`, 'ok');
  }

  function setSajuStatus(text, kind='') {
    const el = $('cpv4SajuStatus');
    if (!el) return;
    el.textContent = text;
    el.className = `cpv4-status ${kind}`.trim();
  }

  function manualTargets() {
    return [fieldContainer('saju'), $('luneaProfileV2Fields')].filter(Boolean);
  }

  function setManualVisible(show) {
    manualTargets().forEach(el => el.classList.toggle('cpv4-manual-hidden', !show));
    const btn = $('cpv4SajuManual');
    if (btn) btn.textContent = show ? '자동 결과만 보기' : '직접 수정';
    if (btn) btn.dataset.open = show ? '1' : '0';
  }

  async function calculateSaju() {
    const birthDate = $('birthDate')?.value || '';
    const birthTime = $('birthTime')?.value || '';
    const birthPlace = $('birthPlace')?.value?.trim() || '';
    if (!birthDate || !birthTime || !birthPlace) {
      setSajuStatus('공통 출생정보의 생년월일 · 출생시각 · 출생지를 먼저 입력해.', 'err');
      return;
    }
    const btn = $('cpv4SajuCalc');
    const api = String(localStorage.getItem(API_KEY) || DEFAULT_API).replace(/\/+$/,'');
    btn.disabled = true;
    btn.textContent = '사주 계산 중…';
    setSajuStatus('Astro Core에서 절기 기준 Four Pillars를 계산 중…');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90000);
      try {
        await fetch(`${api}/health`, {cache:'no-store', signal:controller.signal});
        const res = await fetch(`${api}/v1/profile/four-pillars`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({birth_date:birthDate,birth_time:birthTime,place:birthPlace,timezone:'Asia/Seoul'}),
          signal:controller.signal
        });
        let data = null;
        try { data = await res.json(); } catch {}
        if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
        const record = {birthDate,birthTime,birthPlace,data,savedAt:new Date().toISOString()};
        localStorage.setItem(AUTO_KEY, JSON.stringify(record));
        applyAutoResult(data, true);
        setManualVisible(false);
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      setSajuStatus(`자동계산 실패: ${err?.name === 'AbortError' ? '서버 응답 시간 초과' : (err?.message || err)}`, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = '✦ 사주 4주 자동 계산';
    }
  }

  function ensureSajuAuto() {
    const panel = $('cpv3PanelSaju');
    if (!panel || $('cpv4SajuAuto')) return !!$('cpv4SajuAuto');
    const intro = $('cpv3SajuBuilt')?.nextElementSibling;
    const section = document.createElement('section');
    section.id = 'cpv4SajuAuto';
    section.className = 'cpv4-auto';
    section.innerHTML = `
      <div class="cpv3-kicker">AUTO CALC · 사주 원국 자동입력</div>
      <p class="cpv4-note">공통 출생정보로 연주·월주·일주·시주를 자동 계산해. 신강/신약·용신·희신·기신처럼 학파 차이가 큰 판정은 자동으로 만들지 않아.</p>
      <div class="cpv4-pillars" id="cpv4Pillars"><div class="cpv4-pillar"><small>년주</small><b>—</b></div><div class="cpv4-pillar"><small>월주</small><b>—</b></div><div class="cpv4-pillar"><small>일주</small><b>—</b></div><div class="cpv4-pillar"><small>시주</small><b>—</b></div></div>
      <div class="cpv4-elements" id="cpv4Elements"></div>
      <div class="cpv4-auto-actions"><button type="button" id="cpv4SajuCalc">✦ 사주 4주 자동 계산</button><button type="button" id="cpv4SajuManual">직접 수정</button></div>
      <div class="cpv4-status" id="cpv4SajuStatus">자동 계산 전 · 기존 수동 입력값은 삭제하지 않아.</div>
    `;
    if (intro?.parentElement === panel) intro.insertAdjacentElement('afterend', section);
    else panel.prepend(section);
    $('cpv4SajuCalc').addEventListener('click', calculateSaju);
    $('cpv4SajuManual').addEventListener('click', () => setManualVisible($('cpv4SajuManual').dataset.open !== '1'));

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(AUTO_KEY) || 'null'); } catch {}
    const sameBirth = saved && saved.birthDate === ($('birthDate')?.value || '') && saved.birthTime === ($('birthTime')?.value || '') && saved.birthPlace === ($('birthPlace')?.value?.trim() || '');
    if (sameBirth && saved.data) applyAutoResult(saved.data, false);
    setManualVisible(false);
    return true;
  }

  function bootOnce() {
    addStyles();
    if (!ensureSharedBirth()) return false;
    if (!ensureVedicTab()) return false;
    if (!ensureSajuAuto()) return false;
    console.info('✦ LUNEA CELESTIAL PROFILE V4 · AUTO CALC ready');
    return true;
  }

  if (bootOnce()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (bootOnce() || tries > 120) clearInterval(timer);
  }, 100);
})();
