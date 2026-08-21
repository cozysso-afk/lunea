'use strict';

/*
  LUNEA CELESTIAL PROFILE V2
  - Extends existing LUNEA_USER_PROFILE without deleting legacy fields
  - Adds verified Four Pillars / Five Elements / strength / Ten Gods / useful-favorable-unfavorable elements
  - Keeps Thai weekday + Western zodiac fields
  - Replaces the old one-line profile prompt with a structured auxiliary layer
  - Does NOT calculate Four Pillars automatically; user enters verified 만세력 values
  - Existing archive / RWS / Spread V7.4 / Timing Oracle / General 5-6 remain untouched
*/
(() => {
  if (window.__LUNEA_PROFILE_ADVANCED_V2__) return;
  window.__LUNEA_PROFILE_ADVANCED_V2__ = true;

  const PROFILE_KEY = 'LUNEA_USER_PROFILE';
  const BIRTH_TIME_KEY = 'LUNEA_BIRTH_TIME';
  const BIRTH_PLACE_KEY = 'LUNEA_BIRTH_PLACE';

  const FALLBACK = {
    thaiDay: '목요일',
    thaiRuler: 'Jupiter ♃',
    thaiDirect: 'Wheel',
    thaiRuled: 'Temperance,Moon',
    saju: '庚(경금)',
    zodiac: 'Pisces ♓ (물고기자리)'
  };

  function readProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch {
      return {};
    }
  }

  function writeProfile(p) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }

  function isOldHardcodedFallback(p) {
    return (!localStorage.getItem(PROFILE_KEY)) ||
      (
        p &&
        p.saju === '癸(계수)' &&
        /^Scorpio/.test(p.zodiac || '') &&
        p.thaiDay === '화요일'
      );
  }

  function applySafeFallbackOnlyIfUnsaved() {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) return;
      if (typeof profile !== 'undefined' && isOldHardcodedFallback(profile)) {
        profile = {...profile, ...FALLBACK};
        writeProfile(profile);
        if (typeof syncProfile === 'function') syncProfile();
      }
    } catch (e) {
      console.warn('[Profile V2] fallback migration skipped', e);
    }
  }

  function addStyles() {
    if (document.getElementById('luneaProfileV2Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaProfileV2Style';
    s.textContent = `
      .lunea-profile-v2-section{
        margin:14px 0 12px;padding:12px;border-radius:15px;
        background:linear-gradient(145deg,rgba(189,164,248,.07),rgba(255,210,125,.045));
        border:1px solid rgba(189,164,248,.17)
      }
      .lunea-profile-v2-title{font:700 10px 'Cinzel','Noto Serif KR',serif;color:var(--gold);letter-spacing:1.15px;margin-bottom:8px}
      .lunea-profile-v2-note{font-size:9.5px;line-height:1.5;color:var(--dim);margin:-2px 0 10px}
      .lunea-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .lunea-profile-grid.five{grid-template-columns:repeat(5,1fr);gap:5px}
      .lunea-profile-grid .field{margin-bottom:6px}
      .lunea-profile-grid.five label{text-align:center;font-size:9.5px}
      .lunea-profile-grid.five input{text-align:center;padding:8px 4px}
      .lunea-profile-v2-section input,.lunea-profile-v2-section select{
        background:rgba(255,255,255,.055)
      }
      .lunea-profile-v2-divider{height:1px;background:rgba(255,255,255,.07);margin:9px 0 10px}
      .lunea-profile-chip{
        display:inline-block;padding:3px 7px;margin:2px 3px 2px 0;border-radius:8px;
        background:rgba(255,210,125,.08);border:1px solid rgba(255,210,125,.16);color:#ead6ae;font-size:9px
      }
      @media(max-width:360px){.lunea-profile-grid.five{grid-template-columns:repeat(3,1fr)}}
    `;
    document.head.appendChild(s);
  }

  function fieldHtml(id, label, placeholder='') {
    return `<div class="field"><label>${label}</label><input id="${id}" placeholder="${placeholder}"></div>`;
  }

  function injectAdvancedFields() {
    if (document.getElementById('luneaProfileV2Fields')) return;
    const saju = document.getElementById('saju');
    if (!saju) return;

    const wrap = document.createElement('div');
    wrap.id = 'luneaProfileV2Fields';
    wrap.className = 'lunea-profile-v2-section';
    wrap.innerHTML = `
      <div class="lunea-profile-v2-title">FOUR PILLARS · 명리 상세</div>
      <div class="lunea-profile-v2-note">
        자동 계산값이 아니라 <b>만세력에서 직접 확인한 값</b>을 넣는 영역이야.
        모르는 칸은 비워도 되고, 비어 있는 정보는 AI가 임의로 만들어내지 않게 제한해.
      </div>

      <div class="lunea-profile-grid">
        ${fieldHtml('sajuYearPillar','년주','예: 辛未')}
        ${fieldHtml('sajuMonthPillar','월주','예: 辛卯')}
        ${fieldHtml('sajuDayPillar','일주','예: 庚○')}
        ${fieldHtml('sajuHourPillar','시주','예: 庚辰')}
      </div>

      <div class="lunea-profile-v2-divider"></div>
      <div class="lunea-profile-v2-title">FIVE ELEMENTS · 오행 분포</div>
      <div class="lunea-profile-grid five">
        ${fieldHtml('elemWood','목 木','')}
        ${fieldHtml('elemFire','화 火','')}
        ${fieldHtml('elemEarth','토 土','')}
        ${fieldHtml('elemMetal','금 金','')}
        ${fieldHtml('elemWater','수 水','')}
      </div>

      <div class="field">
        <label>신강 · 신약</label>
        <select id="sajuStrength">
          <option value="">미입력</option>
          <option>매우 신강</option>
          <option>신강</option>
          <option>중화</option>
          <option>신약</option>
          <option>매우 신약</option>
        </select>
      </div>

      ${fieldHtml('sajuTenGods','주요 십성 / 특징','예: 정관 강함, 식신 발달')}
      <div class="lunea-profile-grid">
        ${fieldHtml('sajuYongshin','용신','예: 火')}
        ${fieldHtml('sajuHeeshin','희신','예: 木')}
        ${fieldHtml('sajuGishin','기신','예: 金·水')}
        ${fieldHtml('sajuSpecial','기타 확인사항','예: 합·충·형 등 직접 확인한 내용')}
      </div>

      <div class="lunea-profile-v2-divider"></div>
      <div class="lunea-profile-v2-title">BIRTH DETAIL · 선택 입력</div>
      <div class="lunea-profile-grid">
        <div class="field"><label>출생 시각</label><input type="time" id="birthTime"></div>
        ${fieldHtml('birthPlace','출생지','예: 여수')}
      </div>
    `;

    saju.closest('.field').insertAdjacentElement('afterend', wrap);
  }

  function getDetailFromForm() {
    const val = id => (document.getElementById(id)?.value || '').trim();
    return {
      pillars: {
        year: val('sajuYearPillar'),
        month: val('sajuMonthPillar'),
        day: val('sajuDayPillar'),
        hour: val('sajuHourPillar')
      },
      elements: {
        wood: val('elemWood'),
        fire: val('elemFire'),
        earth: val('elemEarth'),
        metal: val('elemMetal'),
        water: val('elemWater')
      },
      strength: val('sajuStrength'),
      tenGods: val('sajuTenGods'),
      yongshin: val('sajuYongshin'),
      heeshin: val('sajuHeeshin'),
      gishin: val('sajuGishin'),
      special: val('sajuSpecial')
    };
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  }

  function loadAdvancedFields() {
    const p = readProfile();
    const d = p.sajuDetail || {};
    const pillars = d.pillars || {};
    const elements = d.elements || {};

    setValue('sajuYearPillar', pillars.year);
    setValue('sajuMonthPillar', pillars.month);
    setValue('sajuDayPillar', pillars.day);
    setValue('sajuHourPillar', pillars.hour);

    setValue('elemWood', elements.wood);
    setValue('elemFire', elements.fire);
    setValue('elemEarth', elements.earth);
    setValue('elemMetal', elements.metal);
    setValue('elemWater', elements.water);

    setValue('sajuStrength', d.strength);
    setValue('sajuTenGods', d.tenGods);
    setValue('sajuYongshin', d.yongshin);
    setValue('sajuHeeshin', d.heeshin);
    setValue('sajuGishin', d.gishin);
    setValue('sajuSpecial', d.special);

    setValue('birthTime', localStorage.getItem(BIRTH_TIME_KEY) || '');
    setValue('birthPlace', localStorage.getItem(BIRTH_PLACE_KEY) || '');
  }

  function installLoadWrapper() {
    if (typeof loadProfileForm !== 'function' || window.__LUNEA_PROFILE_V2_LOAD_WRAPPED__) return;
    window.__LUNEA_PROFILE_V2_LOAD_WRAPPED__ = true;
    const original = loadProfileForm;
    loadProfileForm = function() {
      original.apply(this, arguments);
      loadAdvancedFields();
    };
  }

  function installSaveHandler() {
    const btn = document.getElementById('saveProfile');
    if (!btn || window.__LUNEA_PROFILE_V2_SAVE_INSTALLED__) return;
    window.__LUNEA_PROFILE_V2_SAVE_INSTALLED__ = true;

    btn.onclick = () => {
      const thai = document.getElementById('thai');
      const t = (thai?.value || '').split('|');
      const existing = readProfile();

      const next = {
        ...existing,
        thaiDay: t[0] || existing.thaiDay || FALLBACK.thaiDay,
        thaiRuler: t[1] || existing.thaiRuler || FALLBACK.thaiRuler,
        thaiDirect: t[2] || existing.thaiDirect || FALLBACK.thaiDirect,
        thaiRuled: t[3] || existing.thaiRuled || FALLBACK.thaiRuled,
        saju: document.getElementById('saju')?.value || existing.saju || FALLBACK.saju,
        zodiac: document.getElementById('zodiac')?.value || existing.zodiac || FALLBACK.zodiac,
        sajuDetail: getDetailFromForm(),
        profileSchema: 2
      };

      writeProfile(next);

      try { profile = next; } catch {}

      const birthDate = document.getElementById('birthDate')?.value || '';
      const birthTime = document.getElementById('birthTime')?.value || '';
      const birthPlace = document.getElementById('birthPlace')?.value || '';

      if (birthDate) localStorage.setItem('LUNEA_BIRTH_DATE', birthDate);
      else localStorage.removeItem('LUNEA_BIRTH_DATE');

      if (birthTime) localStorage.setItem(BIRTH_TIME_KEY, birthTime);
      else localStorage.removeItem(BIRTH_TIME_KEY);

      if (birthPlace) localStorage.setItem(BIRTH_PLACE_KEY, birthPlace);
      else localStorage.removeItem(BIRTH_PLACE_KEY);

      if (typeof syncProfile === 'function') syncProfile();
      if (typeof hideOverlay === 'function') hideOverlay('profileOverlay');
      alert('✨ 상세 명리 프로필 저장 완료');
    };
  }

  function installSyncWrapper() {
    if (typeof syncProfile !== 'function' || window.__LUNEA_PROFILE_V2_SYNC_WRAPPED__) return;
    window.__LUNEA_PROFILE_V2_SYNC_WRAPPED__ = true;
    const original = syncProfile;
    syncProfile = function() {
      original.apply(this, arguments);
      try {
        const p = readProfile();
        const d = p.sajuDetail || {};
        const day = d?.pillars?.day || '';
        const el = document.getElementById('sumSaju');
        if (el) {
          el.textContent = day
            ? `사주: ${day} · ${p.saju || ''}`
            : `일간: ${p.saju || ''}`;
        }
      } catch {}
    };
  }

  function clean(v) {
    return String(v ?? '').trim();
  }

  function line(label, value) {
    const v = clean(value);
    return v ? `- ${label}: ${v}` : '';
  }

  function elementSummary(e={}) {
    const pairs = [
      ['목 木', e.wood], ['화 火', e.fire], ['토 土', e.earth],
      ['금 金', e.metal], ['수 水', e.water]
    ].filter(([,v]) => clean(v));
    return pairs.length ? pairs.map(([k,v]) => `${k} ${v}`).join(' / ') : '';
  }

  function buildProfileBlock() {
    const p = readProfile();
    const d = p.sajuDetail || {};
    const pi = d.pillars || {};
    const elems = elementSummary(d.elements || {});
    const birthTime = localStorage.getItem(BIRTH_TIME_KEY) || '';
    const birthPlace = localStorage.getItem(BIRTH_PLACE_KEY) || '';

    const rows = [
      `[CELESTIAL PROFILE V2 — 카드보다 아래에 놓이는 보조 조응]`,
      line('태국 출생 요일', `${p.thaiDay || ''}${p.thaiRuler ? ' · '+p.thaiRuler : ''}`),
      line('태국 직접/연계 조응', [p.thaiDirect,p.thaiRuled].filter(Boolean).join(' / ')),
      line('태양궁', p.zodiac),
      line('사주 일간', p.saju),
      line('사주 원국 年/月/日/時', [pi.year,pi.month,pi.day,pi.hour].map(x=>clean(x)||'미입력').join(' / ')),
      line('오행 분포', elems),
      line('신강·신약', d.strength),
      line('주요 십성·특징', d.tenGods),
      line('용신', d.yongshin),
      line('희신', d.heeshin),
      line('기신', d.gishin),
      line('기타 직접 확인사항', d.special),
      line('출생 시각/출생지', [birthTime,birthPlace].filter(Boolean).join(' / ')),
      ``,
      `[프로필 사용 규칙]`,
      `1. 질문 원문 → 스프레드 포지션 → 실제 뽑힌 RWS 카드가 항상 최우선이다. 프로필은 결론을 뒤집지 않는다.`,
      `2. 제공되지 않은 사주 정보는 추정·보완·자동 계산하지 않는다. 대운·세운·합충형파·용신 등을 입력값 밖에서 새로 만들어내지 않는다.`,
      `3. 사주는 성향·반응 방식·오행/십성 조응을 설명하는 보조층으로만 사용한다. 타로 카드와 사주 체계를 1:1 동일 체계라고 주장하지 않는다.`,
      `4. 연애 질문에서는 원국의 관계/감정 반응과 사용자가 직접 입력한 십성·오행 정보를 우선 참고하고, 시험·직업 질문에서는 관성·인성·식상 관련 입력이 있을 때만 활용한다.`,
      `5. 재물·투자 질문에서는 재성·식상·비겁 관련 입력이 있을 때만 보조로 활용하며, 투자 결과나 가격 움직임을 사주로 확정하지 않는다.`,
      `6. Golden Dawn의 행성·별자리·원소 조응과 프로필이 실제로 직접 맞닿을 때는 그 조응을 명시한다. 억지 대응은 금지한다.`,
      `7. 태양궁/태국 요일 조응도 카드 의미를 강화하는 보조 신호일 뿐이며, 카드 결론보다 우선하지 않는다.`,
      `8. 직접 조응이 약하면 '이번 배열에서는 직접 조응이 약하다'고 짧게 말해도 된다.`,
      `9. 최종 해석 끝에는 필요할 때만 '프로필 보조 조응'을 1~3문장으로 붙인다. 관련이 약하면 장황하게 끼워 넣지 않는다.`
    ].filter(Boolean);

    return rows.join('\n');
  }

  function installPromptWrapper() {
    if (typeof promptString !== 'function' || window.__LUNEA_PROFILE_V2_PROMPT_WRAPPED__) return;
    window.__LUNEA_PROFILE_V2_PROMPT_WRAPPED__ = true;
    const original = promptString;

    promptString = function() {
      let p = original.apply(this, arguments);
      const replacement = buildProfileBlock();

      // Replace current compact profile block from the original app.
      const compact = /\[프로필 — 보조 참고만 사용\][\s\S]*?※ 프로필은 카드\/질문 해석을 덮어쓰지 말고 보조 조응으로만 한두 문장 활용한다\./;
      if (compact.test(p)) return p.replace(compact, replacement);

      // Replace an older profile resonance patch if one somehow exists.
      const oldV75 = /\[프로필 — 반드시 검토하되 카드보다 우선하지 않는 보조 조응\][\s\S]*?(?=\n\n\[뽑힌 카드\])/;
      if (oldV75.test(p)) return p.replace(oldV75, replacement);

      // Fallback: insert immediately before drawn cards.
      const marker = '\n\n[뽑힌 카드]';
      if (p.includes(marker)) return p.replace(marker, `\n\n${replacement}${marker}`);

      return p + `\n\n${replacement}`;
    };
  }

  function boot() {
    addStyles();
    injectAdvancedFields();
    applySafeFallbackOnlyIfUnsaved();
    installLoadWrapper();
    installSaveHandler();
    installSyncWrapper();
    installPromptWrapper();
    try { if (typeof syncProfile === 'function') syncProfile(); } catch {}
    console.info('✦ LUNEA CELESTIAL PROFILE V2 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
