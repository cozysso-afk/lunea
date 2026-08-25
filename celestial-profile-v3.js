'use strict';

/*
  LUNEA CELESTIAL PROFILE V3
  Load order:
  profile-advanced-v2.js
  profile-select-ui-v2.1.js
  celestial-profile-v3.js
  interpretation-gloss-v1.js  <-- keep last

  Phase 1:
  - Split CELESTIAL PROFILE UI into WESTERN / SAJU / THAI tabs.
  - Preserve all existing input IDs and existing save handlers.
  - Move birth details to WESTERN without changing their IDs.
  - Keep detailed Saju UI intact.
  - Move Thai weekday data into an independent THAI tab.
  - Add Western house/return preferences.
  - Prepare a read-only Natal snapshot area for future Astro Core API.
  - Rewrite the prompt's profile section into separated systems.
*/
(() => {
  if (window.__LUNEA_CELESTIAL_PROFILE_V3__) return;
  window.__LUNEA_CELESTIAL_PROFILE_V3__ = true;

  const SETTINGS_KEY = 'LUNEA_ASTRO_PROFILE_V3_SETTINGS';
  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const ACTIVE_TAB_KEY = 'LUNEA_PROFILE_V3_ACTIVE_TAB';

  const DEFAULT_SETTINGS = {
    zodiac: 'tropical',
    housePrimary: 'whole_sign',
    placidusSecondary: true,
    returns: {
      solar: 'on',
      lunar: 'on',
      mercury: 'auto',
      venus: 'auto',
      mars: 'auto',
      jupiter: 'milestone',
      saturn: 'milestone'
    }
  };

  const $ = id => document.getElementById(id);

  function safeJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '');
      return v && typeof v === 'object' ? v : fallback;
    } catch {
      return fallback;
    }
  }

  function readSettings() {
    const raw = safeJSON(SETTINGS_KEY, {});
    return {
      ...DEFAULT_SETTINGS,
      ...raw,
      returns: {...DEFAULT_SETTINGS.returns, ...(raw.returns || {})}
    };
  }

  function saveSettings() {
    const settings = {
      zodiac: 'tropical',
      housePrimary: 'whole_sign',
      placidusSecondary: $('astroV3Placidus')?.checked !== false,
      returns: {
        solar: 'on',
        lunar: 'on',
        mercury: $('astroV3MercuryReturn')?.value || 'auto',
        venus: $('astroV3VenusReturn')?.value || 'auto',
        mars: $('astroV3MarsReturn')?.value || 'auto',
        jupiter: $('astroV3JupiterReturn')?.value || 'milestone',
        saturn: $('astroV3SaturnReturn')?.value || 'milestone'
      }
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  function addStyles() {
    if ($('luneaCelestialProfileV3Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaCelestialProfileV3Style';
    s.textContent = `
      .cpv3-tabs{
        position:sticky;top:-18px;z-index:5;
        display:grid;grid-template-columns:repeat(3,1fr);gap:5px;
        margin:10px 0 13px;padding:5px;
        background:rgba(20,15,33,.96);
        border:1px solid rgba(189,164,248,.18);
        border-radius:14px;
        backdrop-filter:blur(14px)
      }
      .cpv3-tab{
        border:1px solid transparent;background:transparent;color:var(--dim);
        border-radius:10px;padding:9px 5px;font-size:10px;font-weight:750;
        cursor:pointer;touch-action:manipulation;white-space:nowrap
      }
      .cpv3-tab.active{
        color:#fff;background:linear-gradient(135deg,rgba(165,130,255,.25),rgba(255,210,125,.12));
        border-color:rgba(189,164,248,.30)
      }
      .cpv3-panel{display:none}
      .cpv3-panel.active{display:block}
      .cpv3-section{
        margin:9px 0 12px;padding:12px;border-radius:15px;
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.075)
      }
      .cpv3-kicker{
        color:var(--gold);font:700 9.5px 'Cinzel','Noto Serif KR',serif;
        letter-spacing:1.1px;margin:0 0 7px
      }
      .cpv3-note{color:var(--dim);font-size:9.7px;line-height:1.55;margin:0 0 9px}
      .cpv3-grid2{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .cpv3-grid2>.wide{grid-column:1/-1}
      .cpv3-policy{
        display:flex;align-items:center;justify-content:space-between;gap:10px;
        border-top:1px solid rgba(255,255,255,.06);padding:9px 0
      }
      .cpv3-policy:first-of-type{border-top:0}
      .cpv3-policy strong{display:block;font-size:11px;color:#eee8f8}
      .cpv3-policy small{display:block;margin-top:2px;color:var(--dim);font-size:9px;line-height:1.4}
      .cpv3-lock{
        flex:0 0 auto;padding:4px 7px;border-radius:8px;
        border:1px solid rgba(157,228,193,.24);background:rgba(157,228,193,.07);
        color:#cdebdc;font-size:9px;font-weight:700
      }
      .cpv3-switch{display:flex;align-items:center;gap:6px;font-size:9px;color:#d8d0e3}
      .cpv3-switch input{width:auto;accent-color:#a582ff}
      .cpv3-return-row{
        display:grid;grid-template-columns:minmax(0,1fr) 112px;
        gap:8px;align-items:center;padding:7px 0;border-top:1px solid rgba(255,255,255,.055)
      }
      .cpv3-return-row:first-of-type{border-top:0}
      .cpv3-return-row b{font-size:10.5px;color:#e9e4f5}
      .cpv3-return-row span{display:block;margin-top:1px;font-size:8.8px;color:var(--dim);line-height:1.35}
      .cpv3-return-row select{padding:7px 8px;font-size:10px}
      .cpv3-natal-grid{
        display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px
      }
      .cpv3-natal-item{
        border:1px solid rgba(189,164,248,.13);background:rgba(189,164,248,.045);
        border-radius:11px;padding:8px
      }
      .cpv3-natal-item .name{font-size:9px;color:var(--moon);font-weight:750}
      .cpv3-natal-item .value{font-size:10.5px;color:#eee8f8;margin-top:2px;line-height:1.4}
      .cpv3-empty{
        grid-column:1/-1;text-align:center;color:var(--dim);font-size:10px;
        line-height:1.55;padding:15px 8px;border:1px dashed rgba(189,164,248,.17);
        border-radius:12px
      }
      .cpv3-thai-preview{
        margin-top:9px;padding:10px;border-radius:12px;
        background:rgba(255,210,125,.045);border:1px solid rgba(255,210,125,.12);
        font-size:10px;line-height:1.6;color:#ddd4e7
      }
      .cpv3-system-badge{
        display:inline-block;margin:2px 3px 2px 0;padding:3px 7px;border-radius:8px;
        background:rgba(189,164,248,.08);border:1px solid rgba(189,164,248,.13);
        color:#d8caff;font-size:9px
      }
      #profileOverlay #saveProfile{margin-top:13px}
      @media(max-width:360px){
        .cpv3-tab{font-size:9.2px;padding-left:2px;padding-right:2px}
        .cpv3-grid2{grid-template-columns:1fr}
        .cpv3-grid2>.wide{grid-column:auto}
        .cpv3-return-row{grid-template-columns:1fr 104px}
      }
    `;
    document.head.appendChild(s);
  }

  function createTabShell(modal, saveBtn) {
    if ($('cpv3Tabs')) {
      return {
        western: $('cpv3PanelWestern'),
        saju: $('cpv3PanelSaju'),
        thai: $('cpv3PanelThai')
      };
    }

    const tabs = document.createElement('div');
    tabs.id = 'cpv3Tabs';
    tabs.className = 'cpv3-tabs';
    tabs.innerHTML = `
      <button type="button" class="cpv3-tab active" data-cpv3-tab="western">🌌 서양점성술</button>
      <button type="button" class="cpv3-tab" data-cpv3-tab="saju">🧧 사주</button>
      <button type="button" class="cpv3-tab" data-cpv3-tab="thai">🇹🇭 태국점성술</button>
    `;

    const western = document.createElement('div');
    western.id = 'cpv3PanelWestern';
    western.className = 'cpv3-panel active';

    const saju = document.createElement('div');
    saju.id = 'cpv3PanelSaju';
    saju.className = 'cpv3-panel';

    const thai = document.createElement('div');
    thai.id = 'cpv3PanelThai';
    thai.className = 'cpv3-panel';

    saveBtn.insertAdjacentElement('beforebegin', tabs);
    saveBtn.insertAdjacentElement('beforebegin', western);
    saveBtn.insertAdjacentElement('beforebegin', saju);
    saveBtn.insertAdjacentElement('beforebegin', thai);

    tabs.querySelectorAll('[data-cpv3-tab]').forEach(btn => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.cpv3Tab));
    });

    return {western, saju, thai};
  }

  function setActiveTab(name) {
    const valid = ['western','saju','thai'];
    const target = valid.includes(name) ? name : 'western';

    document.querySelectorAll('.cpv3-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.cpv3Tab === target);
    });
    document.querySelectorAll('.cpv3-panel').forEach(p => {
      p.classList.toggle('active', p.id === `cpv3Panel${target[0].toUpperCase()+target.slice(1)}`);
    });

    localStorage.setItem(ACTIVE_TAB_KEY, target);
  }

  function fieldContainer(id) {
    return $(id)?.closest('.field') || null;
  }

  function removeOldBirthDetailHeading(advanced) {
    if (!advanced) return;
    const title = [...advanced.querySelectorAll('.lunea-profile-v2-title')]
      .find(x => /BIRTH DETAIL/i.test(x.textContent || ''));
    if (!title) return;

    const divider = title.previousElementSibling?.classList?.contains('lunea-profile-v2-divider')
      ? title.previousElementSibling : null;
    const next = title.nextElementSibling;
    if (next?.classList?.contains('lunea-profile-grid') && !next.children.length) next.remove();
    title.remove();
    if (divider) divider.remove();
  }

  function buildWestern(panel) {
    if ($('cpv3WesternBuilt')) return;

    const marker = document.createElement('div');
    marker.id = 'cpv3WesternBuilt';

    const birthSection = document.createElement('section');
    birthSection.className = 'cpv3-section';
    birthSection.innerHTML = `
      <div class="cpv3-kicker">WESTERN · BIRTH DATA</div>
      <p class="cpv3-note">서양점성술 계산의 기준 출생정보. Natal(네이탈·출생차트) 계산 API가 연결되면 아래 정보로 행성·하우스를 자동 계산해.</p>
      <div class="cpv3-grid2" id="cpv3BirthGrid"></div>
    `;

    panel.append(marker, birthSection);

    const grid = $('cpv3BirthGrid');
    const birthDateField = fieldContainer('birthDate');
    const birthTimeField = fieldContainer('birthTime');
    const birthPlaceField = fieldContainer('birthPlace');
    const zodiacField = fieldContainer('zodiac');

    if (birthDateField) grid.appendChild(birthDateField);
    if (birthTimeField) grid.appendChild(birthTimeField);
    if (birthPlaceField) {
      birthPlaceField.classList.add('wide');
      grid.appendChild(birthPlaceField);
    }

    if (zodiacField) {
      const label = zodiacField.querySelector('label');
      if (label) label.textContent = '태양궁 · 현재 기본값';
      birthSection.appendChild(zodiacField);
      const note = document.createElement('p');
      note.className = 'cpv3-note';
      note.textContent = 'Astro Core 연결 후에는 태양궁을 포함한 모든 행성 위치를 계산값으로 우선 사용하고, 이 선택값은 호환용 기본값으로 남겨.';
      birthSection.appendChild(note);
    }

    const policy = document.createElement('section');
    policy.className = 'cpv3-section';
    policy.innerHTML = `
      <div class="cpv3-kicker">HOUSE POLICY · 하우스 체계</div>
      <div class="cpv3-policy">
        <div>
          <strong>Whole Sign(홀사인)</strong>
          <small>사건·주제 영역의 기본 뼈대</small>
        </div>
        <span class="cpv3-lock">PRIMARY · 고정</span>
      </div>
      <div class="cpv3-policy">
        <div>
          <strong>Placidus(플라시두스)</strong>
          <small>각도·커스프·현대/심리적 체감 보조</small>
        </div>
        <label class="cpv3-switch"><input type="checkbox" id="astroV3Placidus" checked> SECONDARY</label>
      </div>
      <p class="cpv3-note">호라리(Horary·질문시각 점성술)는 출생차트 설정과 분리돼. 홈의 HORARY ASTROLOGY에서 질문 시각·장소를 기준으로 Regiomontanus(레지오몬타누스) 하우스를 계산해.</p>
    `;
    panel.appendChild(policy);

    const natal = document.createElement('section');
    natal.className = 'cpv3-section';
    natal.innerHTML = `
      <div class="cpv3-kicker">NATAL CORE · 출생차트 핵심</div>
      <p class="cpv3-note">계산값은 직접 타이핑하지 않아. 향후 Astro Core가 산출한 값만 읽기 전용으로 표시해.</p>
      <div class="cpv3-natal-grid" id="cpv3NatalGrid"></div>
    `;
    panel.appendChild(natal);

    const returns = document.createElement('section');
    returns.className = 'cpv3-section';
    returns.innerHTML = `
      <div class="cpv3-kicker">RETURN ROUTER · 리턴 사용 설정</div>
      <p class="cpv3-note">Solar/Lunar는 기본축. Mercury/Venus/Mars는 질문에 맞을 때만 자동 호출하고, Jupiter/Saturn은 장기 전환 질문에서만 사용해.</p>

      <div class="cpv3-return-row">
        <div><b>☉ Solar Return(솔라리턴·태양회귀)</b><span>연간 큰 배경</span></div>
        <span class="cpv3-lock">ON · CORE</span>
      </div>
      <div class="cpv3-return-row">
        <div><b>☽ Lunar Return(루나리턴·달회귀)</b><span>월간 체감·단기 배경</span></div>
        <span class="cpv3-lock">ON · CORE</span>
      </div>
      <div class="cpv3-return-row">
        <div><b>☿ Mercury Return(수성회귀)</b><span>연락·답장·시험·문서</span></div>
        <select id="astroV3MercuryReturn"><option value="auto">AUTO</option><option value="manual">MANUAL</option><option value="off">OFF</option></select>
      </div>
      <div class="cpv3-return-row">
        <div><b>♀ Venus Return(금성회귀)</b><span>연애·재회·호감·가치</span></div>
        <select id="astroV3VenusReturn"><option value="auto">AUTO</option><option value="manual">MANUAL</option><option value="off">OFF</option></select>
      </div>
      <div class="cpv3-return-row">
        <div><b>♂ Mars Return(화성회귀)</b><span>행동·갈등·추진력·신체 에너지</span></div>
        <select id="astroV3MarsReturn"><option value="auto">AUTO</option><option value="manual">MANUAL</option><option value="off">OFF</option></select>
      </div>
      <div class="cpv3-return-row">
        <div><b>♃ Jupiter Return(목성회귀)</b><span>약 12년 · 장기 성장/확장</span></div>
        <select id="astroV3JupiterReturn"><option value="milestone">MILESTONE</option><option value="manual">MANUAL</option><option value="off">OFF</option></select>
      </div>
      <div class="cpv3-return-row">
        <div><b>♄ Saturn Return(토성회귀)</b><span>약 29.5년 · 구조/책임 전환</span></div>
        <select id="astroV3SaturnReturn"><option value="milestone">MILESTONE</option><option value="manual">MANUAL</option><option value="off">OFF</option></select>
      </div>
    `;
    panel.appendChild(returns);
  }

  function buildSaju(panel) {
    if ($('cpv3SajuBuilt')) return;
    const marker = document.createElement('div');
    marker.id = 'cpv3SajuBuilt';

    const intro = document.createElement('section');
    intro.className = 'cpv3-section';
    intro.innerHTML = `
      <div class="cpv3-kicker">SAJU / FOUR PILLARS · 사주명리</div>
      <p class="cpv3-note">서양점성술과 별도 체계로 저장·해석해. 카드 결론을 사주가 덮어쓰지 않고, 입력된 원국 정보만 보조 조응으로 사용해.</p>
    `;
    panel.append(marker, intro);

    const sajuField = fieldContainer('saju');
    const advanced = $('luneaProfileV2Fields');
    if (sajuField) panel.appendChild(sajuField);
    if (advanced) {
      panel.appendChild(advanced);
      removeOldBirthDetailHeading(advanced);
    }
  }

  function updateThaiPreview() {
    const thai = $('thai');
    const box = $('cpv3ThaiPreview');
    if (!thai || !box) return;
    const [day='', ruler='', direct='', ruled=''] = String(thai.value || '').split('|');

    box.replaceChildren();

    const traditional = document.createElement('div');
    traditional.innerHTML = `
      <span class="cpv3-system-badge">출생요일 · ${escapeHTML(day || '미입력')}</span>
      <span class="cpv3-system-badge">요일 행성 · ${escapeHTML(ruler || '미입력')}</span>
    `;
    box.appendChild(traditional);

    const resonance = document.createElement('div');
    resonance.style.marginTop = '7px';
    resonance.textContent =
      `LUNEA 교차 조응: ${direct || '없음'} / ${ruled || '없음'}. ` +
      '이 카드 대응은 태국 전통 원전의 고유 타로 대응이 아니라 LUNEA의 보조 상징 레이어야.';
    box.appendChild(resonance);
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function buildThai(panel) {
    if ($('cpv3ThaiBuilt')) return;
    const marker = document.createElement('div');
    marker.id = 'cpv3ThaiBuilt';

    const section = document.createElement('section');
    section.className = 'cpv3-section';
    section.innerHTML = `
      <div class="cpv3-kicker">THAI ASTROLOGY · 태국점성술</div>
      <p class="cpv3-note">서양점성술과 분리된 전통 체계로 취급해. 현재는 출생요일·요일 행성을 저장하고, 향후 검증된 태국식 계산 규칙은 이 탭에만 확장해.</p>
      <div id="cpv3ThaiFieldSlot"></div>
      <div class="cpv3-thai-preview" id="cpv3ThaiPreview"></div>
      <p class="cpv3-note" style="margin-top:9px">Mahabote(마하보테)는 미얀마 요일 점성술이므로 이 태국점성술 탭에 섞지 않아.</p>
    `;
    panel.append(marker, section);

    const thaiField = fieldContainer('thai');
    if (thaiField) $('cpv3ThaiFieldSlot').appendChild(thaiField);
    $('thai')?.addEventListener('change', updateThaiPreview);
    updateThaiPreview();
  }

  function renderNatalSnapshot() {
    const grid = $('cpv3NatalGrid');
    if (!grid) return;
    const natal = safeJSON(NATAL_KEY, null);
    grid.replaceChildren();

    if (!natal || !Object.keys(natal).length) {
      const empty = document.createElement('div');
      empty.className = 'cpv3-empty';
      empty.innerHTML =
        '아직 Astro Core 계산값이 연결되지 않았어.<br>' +
        '다음 단계에서 Sun(태양) · Moon(달) · ASC(상승점) · MC(중천점) · Mercury(수성) · Venus(금성) · Mars(화성) 등을 자동 표시해.';
      grid.appendChild(empty);
      return;
    }

    const sources = [
      ['Sun','태양'],['Moon','달'],['ASC','상승점'],['MC','중천점'],
      ['Mercury','수성'],['Venus','금성'],['Mars','화성'],
      ['Jupiter','목성'],['Saturn','토성'],['Vertex','버텍스']
    ];

    const planets = natal.planets || natal;
    const angles = natal.angles || {};
    for (const [key, ko] of sources) {
      const v = planets[key] ?? angles[key];
      if (!v) continue;
      const item = document.createElement('div');
      item.className = 'cpv3-natal-item';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = `${key}(${ko})`;
      const value = document.createElement('div');
      value.className = 'value';
      value.textContent = formatNatalValue(v);
      item.append(name, value);
      grid.appendChild(item);
    }

    if (!grid.children.length) {
      const empty = document.createElement('div');
      empty.className = 'cpv3-empty';
      empty.textContent = 'Natal 계산 데이터 형식을 확인해야 해.';
      grid.appendChild(empty);
    }
  }

  function formatNatalValue(v) {
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (!v || typeof v !== 'object') return '—';

    const sign = v.sign || v.sign_ko || '';
    const degree = v.degree ?? v.deg;
    const ws = v.whole_house ?? v.wholeSignHouse ?? v.house_ws;
    const pl = v.placidus_house ?? v.placidusHouse ?? v.house_placidus;

    const parts = [];
    if (sign) parts.push(sign);
    if (degree !== undefined && degree !== null && degree !== '') parts.push(`${degree}°`);
    if (ws) parts.push(`WS ${ws}H`);
    if (pl) parts.push(`Placidus ${pl}H`);
    return parts.join(' · ') || JSON.stringify(v);
  }

  function loadSettingsToUI() {
    const s = readSettings();
    if ($('astroV3Placidus')) $('astroV3Placidus').checked = s.placidusSecondary !== false;
    if ($('astroV3MercuryReturn')) $('astroV3MercuryReturn').value = s.returns.mercury;
    if ($('astroV3VenusReturn')) $('astroV3VenusReturn').value = s.returns.venus;
    if ($('astroV3MarsReturn')) $('astroV3MarsReturn').value = s.returns.mars;
    if ($('astroV3JupiterReturn')) $('astroV3JupiterReturn').value = s.returns.jupiter;
    if ($('astroV3SaturnReturn')) $('astroV3SaturnReturn').value = s.returns.saturn;
    renderNatalSnapshot();
    updateThaiPreview();
  }

  function wrapLoadProfileForm() {
    if (typeof loadProfileForm !== 'function' || window.__LUNEA_CPV3_LOAD_WRAPPED__) return;
    window.__LUNEA_CPV3_LOAD_WRAPPED__ = true;
    const original = loadProfileForm;
    loadProfileForm = function() {
      original.apply(this, arguments);
      loadSettingsToUI();
      setActiveTab(localStorage.getItem(ACTIVE_TAB_KEY) || 'western');
    };
  }

  function wrapSaveButton() {
    const btn = $('saveProfile');
    if (!btn || window.__LUNEA_CPV3_SAVE_WRAPPED__) return;
    window.__LUNEA_CPV3_SAVE_WRAPPED__ = true;
    const original = btn.onclick;
    btn.onclick = function(e) {
      saveSettings();
      if (original) return original.call(this, e);
    };
    btn.textContent = '프로필 전체 저장';
  }

  function reorderSummary() {
    const tags = document.querySelector('.profile-tags');
    if (!tags) return;

    const z = $('sumZodiac');
    const s = $('sumSaju');
    const t = $('sumThai');
    if (z) tags.appendChild(z);
    if (s) tags.appendChild(s);
    if (t) tags.appendChild(t);
  }

  function wrapSyncProfile() {
    if (typeof syncProfile !== 'function' || window.__LUNEA_CPV3_SYNC_WRAPPED__) return;
    window.__LUNEA_CPV3_SYNC_WRAPPED__ = true;
    const original = syncProfile;
    syncProfile = function() {
      original.apply(this, arguments);
      try {
        const raw = safeJSON('LUNEA_USER_PROFILE', {});
        const detail = raw.sajuDetail || {};
        const dayPillar = detail?.pillars?.day || '';

        if ($('sumZodiac')) {
          const z = raw.zodiac || '';
          $('sumZodiac').textContent = `서양: ${String(z).split(' ')[0] || '미입력'}`;
        }
        if ($('sumSaju')) {
          $('sumSaju').textContent = dayPillar
            ? `사주: ${dayPillar}`
            : `사주: ${raw.saju || '미입력'}`;
        }
        if ($('sumThai')) {
          $('sumThai').textContent = `태국: ${raw.thaiDay || '미입력'}`;
        }
        reorderSummary();
      } catch {}
    };
  }

  function profileLine(label, value) {
    const v = String(value ?? '').trim();
    return v ? `- ${label}: ${v}` : '';
  }

  function elementSummary(e={}) {
    const rows = [
      ['목 木',e.wood],['화 火',e.fire],['토 土',e.earth],
      ['금 金',e.metal],['수 水',e.water]
    ].filter(([,v]) => String(v ?? '').trim() !== '');
    return rows.map(([k,v]) => `${k} ${v}`).join(' / ');
  }

  function natalPromptSummary() {
    const natal = safeJSON(NATAL_KEY, null);
    if (!natal || !Object.keys(natal).length) return '';

    const planets = natal.planets || natal;
    const angles = natal.angles || {};
    const keys = [
      ['Sun','태양'],['Moon','달'],['ASC','상승점'],['MC','중천점'],
      ['Mercury','수성'],['Venus','금성'],['Mars','화성'],
      ['Jupiter','목성'],['Saturn','토성'],['Vertex','버텍스']
    ];

    return keys.map(([k,ko]) => {
      const v = planets[k] ?? angles[k];
      return v ? `- ${k}(${ko}): ${formatNatalValue(v)}` : '';
    }).filter(Boolean).join('\n');
  }

  function buildSeparatedProfileBlock() {
    const p = safeJSON('LUNEA_USER_PROFILE', {});
    const d = p.sajuDetail || {};
    const pi = d.pillars || {};
    const settings = readSettings();
    const natalLines = natalPromptSummary();

    return [
      `[CELESTIAL PROFILE V3 — 서로 다른 체계를 분리해서 참고]`,
      ``,
      `[WESTERN ASTROLOGY · 서양점성술]`,
      profileLine('기본 황도', 'Tropical(열대황도)'),
      profileLine('하우스 정책', `Whole Sign(홀사인) Primary / Placidus(플라시두스) ${settings.placidusSecondary ? 'Secondary ON' : 'Secondary OFF'}`),
      profileLine('태양궁 호환값', p.zodiac),
      natalLines || `- Natal(네이탈·출생차트) 상세 계산값: 아직 Astro Core 미연결`,
      ``,
      `[SAJU / FOUR PILLARS · 사주명리]`,
      profileLine('일간', p.saju),
      profileLine('원국 年/月/日/時', [pi.year,pi.month,pi.day,pi.hour].map(x=>String(x||'미입력')).join(' / ')),
      profileLine('오행 분포', elementSummary(d.elements || {})),
      profileLine('신강·신약', d.strength),
      profileLine('주요 십성·특징', d.tenGods),
      profileLine('용신', d.yongshin),
      profileLine('희신', d.heeshin),
      profileLine('기신', d.gishin),
      profileLine('기타 확인사항', d.special),
      ``,
      `[THAI ASTROLOGY · 태국점성술]`,
      profileLine('출생 요일', p.thaiDay),
      profileLine('요일 행성', p.thaiRuler),
      profileLine('LUNEA Tarot 교차 조응', [p.thaiDirect,p.thaiRuled].filter(Boolean).join(' / ')),
      `※ 위 Tarot 교차 조응은 태국 전통 원전의 고유 타로 대응이 아니라 LUNEA의 보조 상징 레이어다.`,
      ``,
      `[프로필 체계 사용 규칙]`,
      `1. Western Astrology(서양점성술), Saju(사주명리), Thai Astrology(태국점성술)를 서로 다른 전통 체계로 취급한다.`,
      `2. 서로 다른 체계의 개념을 같은 개념처럼 1:1 치환하지 않는다.`,
      `3. 질문 원문·스프레드 포지션·실제 뽑힌 RWS 카드가 기본이며, 프로필은 이를 보조한다.`,
      `4. 계산되지 않은 행성 위치·하우스·각·리턴·트랜짓을 추정하거나 지어내지 않는다.`,
      `5. 사주에서 사용자가 입력하지 않은 대운·세운·합충형파·용희신을 임의 생성하지 않는다.`,
      `6. 태국점성술 정보는 서양점성술 행성 해석으로 자동 변환하지 않는다.`,
      `7. 실제 질문과 직접 관련 있는 프로필 정보만 사용하며 관련이 약하면 억지로 끼워 넣지 않는다.`,
      `8. 서로 다른 체계가 같은 방향을 가리키면 '교차 보조 신호'로 표현하고, 다르면 차이를 숨기지 않는다.`
    ].filter(x => x !== '').join('\n');
  }

  function wrapPromptString() {
    if (typeof promptString !== 'function' || window.__LUNEA_CPV3_PROMPT_WRAPPED__) return;
    window.__LUNEA_CPV3_PROMPT_WRAPPED__ = true;
    const original = promptString;

    promptString = function() {
      let text = String(original.apply(this, arguments));
      const block = buildSeparatedProfileBlock();

      const v2 = /\[CELESTIAL PROFILE V2[\s\S]*?(?=\n\n\[뽑힌 카드\])/;
      if (v2.test(text)) return text.replace(v2, block);

      const v3 = /\[CELESTIAL PROFILE V3[\s\S]*?(?=\n\n\[뽑힌 카드\])/;
      if (v3.test(text)) return text.replace(v3, block);

      const marker = '\n\n[뽑힌 카드]';
      if (text.includes(marker)) return text.replace(marker, `\n\n${block}${marker}`);
      return `${text}\n\n${block}`;
    };
  }

  function migrateAndBuild() {
    const overlay = $('profileOverlay');
    const modal = overlay?.querySelector('.modal');
    const saveBtn = $('saveProfile');
    if (!overlay || !modal || !saveBtn) {
      console.warn('[LUNEA Profile V3] profile modal not found');
      return;
    }

    addStyles();
    const panels = createTabShell(modal, saveBtn);

    buildWestern(panels.western);
    buildSaju(panels.saju);
    buildThai(panels.thai);

    wrapLoadProfileForm();
    wrapSaveButton();
    wrapSyncProfile();
    wrapPromptString();

    loadSettingsToUI();
    setActiveTab(localStorage.getItem(ACTIVE_TAB_KEY) || 'western');

    try { if (typeof syncProfile === 'function') syncProfile(); } catch {}

    console.info('✦ LUNEA CELESTIAL PROFILE V3 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', migrateAndBuild, {once:true});
  } else {
    migrateAndBuild();
  }
})();
