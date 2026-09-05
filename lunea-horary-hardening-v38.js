'use strict';

/*
  LUNEA HORARY HARDENING V38
  ==========================
  Additive safety/UX layer over Horary V1 + Balance V19.5 + Question Modes V37.

  - Prevents event-perfection Balance text from leaking into location/descriptive/comparison AI prompts.
  - Adds an explicit manual question-mode override while keeping AUTO as the default.
  - Enriches saved Horary records with full chart evidence instead of the legacy narrow summary.
  - Adds optional timezone/lat/lon controls for questions asked outside Korea.
  - Adds missing traditional topic routes in the UI (pets, children/pregnancy, shared money/inheritance, hidden matters).
  - Surfaces backend V4 accidental-condition / Part of Fortune evidence when available.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_HARDENING_V38__) return;
  W.__LUNEA_HORARY_HARDENING_V38__ = true;

  const $ = id => document.getElementById(id);
  const RELEASE = '38.0';
  const MANUAL_SELECT_ID = 'luneaHoraryManualModeV38';
  const MANUAL_BOX_ID = 'luneaHoraryManualEvidenceV38';
  const CONDITION_BOX_ID = 'luneaHoraryConditionEvidenceV38';
  const ADVANCED_ID = 'luneaHoraryAdvancedLocationV38';
  const STYLE_ID = 'luneaHoraryHardeningV38Style';
  const NON_OUTCOME_BALANCE_BLOCK = new Set(['location', 'descriptive', 'comparison']);

  const MODE_LABELS = {
    outcome: '성사·결과',
    location: '위치·행방',
    descriptive: '상태·묘사',
    comparison: '선택지·비교',
    timing: '시기·전개',
  };

  const TOPIC_EXTENSIONS = {
    pet: ['반려동물·작은 동물', /반려동물|반려견|반려묘|강아지|고양이|개\b|애완동물|작은\s*동물/i],
    children: ['자녀·임신·출산', /자녀|아이|아기|임신|임신운|출산|태아|수태/i],
    shared_money: ['상속·타인의 돈·공동재산', /상속|유산|보험금|공동재산|공동\s*자금|배우자\s*(?:돈|재산)|상대(?:방)?\s*(?:돈|재산)|타인의\s*(?:돈|재산)/i],
    hidden: ['비밀·숨겨진 일', /비밀|숨긴\s*(?:일|사실|문제)|감춘\s*(?:일|사실)|은폐|몰래\s*하는|뒤에서\s*하는/i],
  };

  let latestHorary = null;
  let manualOverride = null;

  const clean = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function currentQuestion() {
    return clean($('astroHoraryQuestion')?.value || latestHorary?.question?.text || '');
  }

  function autoMode(question) {
    try {
      const fn = W.LUNEA_HORARY_QUESTION_MODES_V37?.classifyQuestion;
      if (typeof fn === 'function') return fn(question);
    } catch {}
    return {key:'outcome', label:'성사·결과', subject:'event', forceTopic:null};
  }

  function inferLocationSubject(question) {
    const auto = autoMode(question);
    if (auto?.key === 'location' && auto?.subject) return auto.subject;
    const q = clean(question);
    const objectish = /물건|소지품|소유물|분실물|카메라|디카|쿨픽스|휴대폰|핸드폰|지갑|열쇠|가방|반지|목걸이|귀걸이|시계|서류|전자기기|충전기|이어폰|에어팟|책\b|옷\b|신발|안경|카드|USB|메모리|수납|서랍|보관/i.test(q);
    const personish = /사람|상대|남자|여자|남친|여친|남편|아내|배우자|친구|지인|동료|전남친|전여친|구남친|구여친|연인|썸/i.test(q);
    return objectish && !personish ? 'object' : 'person';
  }

  function effectiveMode(question = currentQuestion()) {
    const q = clean(question);
    if (manualOverride && q && manualOverride.question === q) {
      const subject = manualOverride.key === 'location' ? inferLocationSubject(q) : 'manual';
      return {
        key:manualOverride.key,
        label:MODE_LABELS[manualOverride.key] || manualOverride.key,
        subject,
        forceTopic:manualOverride.key === 'location' && subject === 'object' ? 'lost_object' : null,
        manual:true,
      };
    }
    return {...autoMode(q), manual:false};
  }

  function addStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .horary-v38-field{margin:7px 0 10px}.horary-v38-field label{display:block;margin-bottom:5px;color:#aaa7ba;font-size:9px}
      #${MANUAL_SELECT_ID}{width:100%;min-height:38px;border-radius:11px;border:1px solid rgba(170,205,230,.17);background:#10111b;color:#ece9f3;padding:7px 9px;font-size:10px}
      #${MANUAL_BOX_ID},#${CONDITION_BOX_ID}{display:none;margin-top:8px;padding:10px 11px;border-radius:13px;border:1px solid rgba(155,211,235,.18);background:linear-gradient(145deg,rgba(85,151,183,.055),rgba(179,149,222,.05));font-size:9.6px;line-height:1.5;color:#aaa7b7}
      #${MANUAL_BOX_ID}.show,#${CONDITION_BOX_ID}.show{display:block}#${MANUAL_BOX_ID} b,#${CONDITION_BOX_ID} b{display:block;margin-bottom:4px;color:#f0edf7;font-size:10.5px}#${MANUAL_BOX_ID} small,#${CONDITION_BOX_ID} small{display:block;color:#9ed6ec;font-size:7.8px;font-weight:800;letter-spacing:.9px;margin-bottom:3px}
      #astroHoraryOverlay[data-horary-manual-v38="1"] #luneaHoraryModeEvidenceV37{display:none!important}
      #${ADVANCED_ID}{margin:7px 0 10px;border:1px solid rgba(180,190,220,.12);border-radius:12px;padding:8px 9px;background:rgba(9,10,18,.2)}
      #${ADVANCED_ID} summary{cursor:pointer;color:#9d9aac;font-size:9.2px}#${ADVANCED_ID} .v38-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}#${ADVANCED_ID} .v38-grid .full{grid-column:1/-1}
      #${ADVANCED_ID} input{width:100%;box-sizing:border-box;border:1px solid rgba(170,180,210,.15);border-radius:9px;background:#0e0f18;color:#ece9f2;padding:7px 8px;font-size:9.5px}#${ADVANCED_ID} .v38-help{margin-top:6px;color:#777587;font-size:8.5px;line-height:1.45}
      @media(max-width:520px){#${ADVANCED_ID} .v38-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureManualModeControl() {
    if ($(MANUAL_SELECT_ID)) return true;
    const chip = $('luneaHoraryModeChipV37');
    const topic = $('astroHoraryTopic');
    const anchor = chip || topic?.closest?.('.field');
    if (!anchor) return false;
    const wrap = document.createElement('div');
    wrap.className = 'horary-v38-field';
    wrap.innerHTML = `<label>질문 판독 모드 · 자동 권장 / 필요할 때만 수동 지정</label>
      <select id="${MANUAL_SELECT_ID}">
        <option value="auto">자동 판독</option>
        <option value="outcome">성사·결과형</option>
        <option value="location">위치·행방형</option>
        <option value="descriptive">상태·묘사형</option>
        <option value="comparison">선택지·비교형</option>
        <option value="timing">시기·전개형</option>
      </select>`;
    anchor.insertAdjacentElement('afterend', wrap);
    const select = $(MANUAL_SELECT_ID);
    select.addEventListener('change', () => {
      const q = currentQuestion();
      if (select.value === 'auto' || !q) {
        manualOverride = null;
        select.value = 'auto';
      } else {
        manualOverride = {key:select.value, question:q};
      }
      applyModeUI();
      syncExtendedTopic();
    });
    return true;
  }

  function ensureAdvancedLocation() {
    if ($(ADVANCED_ID)) return true;
    const now = $('astroHoraryNow');
    if (!now) return false;
    const details = document.createElement('details');
    details.id = ADVANCED_ID;
    details.innerHTML = `<summary>해외·현재위치 고급 설정 · 한국에서 쓰면 열 필요 없음</summary>
      <div class="v38-grid">
        <div class="full"><label>Timezone(타임존)</label><input id="luneaHoraryTimezoneV38" value="Asia/Seoul" placeholder="예: America/New_York"></div>
        <div><label>Latitude(위도)</label><input id="luneaHoraryLatV38" inputmode="decimal" placeholder="예: 40.7128"></div>
        <div><label>Longitude(경도)</label><input id="luneaHoraryLonV38" inputmode="decimal" placeholder="예: -74.0060"></div>
        <div class="full"><button class="mini" type="button" id="luneaHoraryCurrentLocationV38">⌖ 현재 위치 채우기</button></div>
      </div>
      <div class="v38-help">해외에서는 질문 순간의 현지 시각 + 실제 위경도를 함께 써야 해. 현재 위치 버튼은 브라우저 위치 권한을 요청할 수 있어.</div>`;
    now.insertAdjacentElement('beforebegin', details);
    $('luneaHoraryCurrentLocationV38')?.addEventListener('click', () => {
      if (!navigator.geolocation) return alert('이 브라우저에서는 현재 위치를 사용할 수 없어.');
      const btn = $('luneaHoraryCurrentLocationV38');
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⌖ 위치 확인 중…';
      navigator.geolocation.getCurrentPosition(pos => {
        $('luneaHoraryLatV38').value = Number(pos.coords.latitude).toFixed(6);
        $('luneaHoraryLonV38').value = Number(pos.coords.longitude).toFixed(6);
        try { $('luneaHoraryTimezoneV38').value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'; } catch {}
        if (!$('astroHoraryPlace')?.value.trim()) $('astroHoraryPlace').value = '현재 위치';
        btn.disabled = false;
        btn.textContent = '✓ 현재 위치 입력됨';
        setTimeout(() => { btn.textContent = old; }, 1400);
      }, err => {
        btn.disabled = false;
        btn.textContent = old;
        alert('현재 위치를 가져오지 못했어: ' + (err?.message || err));
      }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
    });
    now.addEventListener('click', () => setTimeout(() => {
      const tz = clean($('luneaHoraryTimezoneV38')?.value || 'Asia/Seoul');
      if (tz && tz !== 'Asia/Seoul') {
        const value = localDateTimeForZone(new Date(), tz);
        if (value && $('astroHoraryMoment')) $('astroHoraryMoment').value = value;
      }
    }, 0));
    return true;
  }

  function localDateTimeForZone(date, timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', hourCycle:'h23'
      }).formatToParts(date).reduce((acc, row) => (acc[row.type] = row.value, acc), {});
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    } catch { return ''; }
  }

  function ensureTopicOptions() {
    const select = $('astroHoraryTopic');
    if (!select) return false;
    Object.entries(TOPIC_EXTENSIONS).forEach(([value, [label]]) => {
      if (select.querySelector(`option[value="${value}"]`)) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    return true;
  }

  function inferExtendedTopic(question) {
    const q = clean(question);
    for (const [value, [, regex]] of Object.entries(TOPIC_EXTENSIONS)) {
      if (regex.test(q)) return value;
    }
    return null;
  }

  function syncExtendedTopic() {
    ensureTopicOptions();
    const select = $('astroHoraryTopic');
    if (!select) return;
    const q = currentQuestion();
    const mode = effectiveMode(q);
    if (mode.forceTopic === 'lost_object' && select.querySelector('option[value="lost_object"]')) {
      select.value = 'lost_object';
      return;
    }
    const ext = inferExtendedTopic(q);
    if (!ext) return;
    const userManual = select.dataset.luneaTopicManualV195 === '1' && select.dataset.luneaModeAutoV37 !== '1';
    if (userManual) return;
    if (select.querySelector(`option[value="${ext}"]`)) {
      select.value = ext;
      select.dataset.luneaTopicHardeningAutoV38 = '1';
    }
  }

  function applyModeUI() {
    ensureManualModeControl();
    const q = currentQuestion();
    const mode = effectiveMode(q);
    const overlay = $('astroHoraryOverlay');
    if (overlay) {
      overlay.dataset.horaryMode = mode.key;
      overlay.dataset.horaryManualV38 = mode.manual ? '1' : '0';
    }
    const select = $(MANUAL_SELECT_ID);
    if (select && !mode.manual) select.value = 'auto';
    let box = $(MANUAL_BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = MANUAL_BOX_ID;
      const anchor = $('luneaHoraryModeEvidenceV37') || $('astroHoraryResult')?.querySelector('.horary-summary');
      if (anchor) anchor.insertAdjacentElement('afterend', box);
    }
    if (box) {
      if (mode.manual) {
        box.classList.add('show');
        box.innerHTML = `<small>HORARY MODE · MANUAL V38</small><b>${esc(mode.label)} 수동 지정</b>${manualModeDescription(mode)}`;
      } else {
        box.classList.remove('show');
        box.innerHTML = '';
      }
    }
    renderConditionEvidence();
  }

  function manualModeDescription(mode) {
    if (mode.key === 'location') return `<div>성사 여부보다 위치·환경 단서를 우선해. ${mode.subject === 'object' ? '내 이동 가능한 소유물로 판정되어 2하우스 경로를 사용해.' : '사람의 위치라면 현재 관계 주제의 대상 하우스를 유지해.'}</div>`;
    if (mode.key === 'descriptive') return '<div>현재 상태·인식·감정·인상을 읽고, 직접 성사각 부재를 감정 부재로 번역하지 않아.</div>';
    if (mode.key === 'comparison') return '<div>비인물 선택지를 같은 차트 근거로 비교하고 후보마다 임의 하우스를 새로 만들지 않아.</div>';
    if (mode.key === 'timing') return '<div>Perfection(성사각), Moon(달)의 다음 적용각, 별자리 변경 전 완성 여부를 시기 근거로 우선해.</div>';
    return '<div>직접/간접 성사, Reception(리셉션), Moon(달), 실제 방해 패턴을 종합하는 기본 성사형 판정이야.</div>';
  }

  function renderConditionEvidence() {
    const data = latestHorary || W.__LUNEA_LAST_HORARY_MODE_V37__ || W.__LUNEA_LAST_HORARY_BALANCE_V31__;
    const result = $('astroHoraryResult');
    if (!data || !result?.classList.contains('show')) return;
    const mode = effectiveMode(data.question?.text || currentQuestion());
    let box = $(CONDITION_BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = CONDITION_BOX_ID;
      const anchor = $(MANUAL_BOX_ID) || $('luneaHoraryModeEvidenceV37') || result.querySelector('.horary-summary');
      if (anchor) anchor.insertAdjacentElement('afterend', box);
    }
    if (!box) return;
    if (!['location','descriptive'].includes(mode.key)) {
      box.classList.remove('show');
      box.innerHTML = '';
      return;
    }
    const sig = data.significators || {};
    const conditions = data.judgment_support?.planet_conditions_v4 || {};
    const pof = data.points?.PartOfFortune || null;
    const target = sig.quesited || {};
    const targetCond = conditions[target.ruler] || target.planet || {};
    const qCond = conditions[sig.querent?.ruler] || sig.querent?.planet || {};
    const dispo = target.planet?.traditional_dispositor || targetCond.traditional_dispositor;
    const dispoRow = dispo ? data.planets?.[dispo] : null;
    const fmtCond = row => [row?.solar_condition_ko, row?.house_strength_ko, row?.retrograde ? '역행' : ''].filter(Boolean).join(' · ') || '추가 상태값 없음';
    const pofText = pof ? `Part of Fortune(포르투나): ${pof.sign || '—'} ${pof.degree ?? '—'}° · ${pof.house ?? '—'}H` : 'Part of Fortune(포르투나): 백엔드 V4 배포 후 표시';
    const dispoText = dispoRow ? `${dispo}(${dispoRow.name_ko || dispo}) · ${dispoRow.sign || '—'} ${dispoRow.degree ?? '—'}° · ${dispoRow.house ?? '—'}H` : (dispo ? `${dispo} · 실제 배치값 확인 필요` : '—');
    box.classList.add('show');
    if (mode.key === 'location') {
      box.innerHTML = `<small>TRADITIONAL CONDITION · V38</small><b>위치형 보강 근거</b><div>물건/대상 주인행성 ${esc(target.ruler || '—')}: ${esc(fmtCond(targetCond))}</div><div>${esc(pofText)}</div><div>대상 행성의 전통 디스포지터 실제 위치: ${esc(dispoText)}</div><div>※ 포르투나와 디스포지터는 2H 주인행성·Moon·4H/IC 단서를 보강하며 단독으로 장소를 확정하지 않아.</div>`;
    } else {
      box.innerHTML = `<small>TRADITIONAL CONDITION · V38</small><b>상태·묘사형 보강 근거</b><div>질문자 주인행성 ${esc(sig.querent?.ruler || '—')}: ${esc(fmtCond(qCond))}</div><div>대상 주인행성 ${esc(target.ruler || '—')}: ${esc(fmtCond(targetCond))}</div><div>※ Cazimi(카지미)·Combustion(연소)·Under the Beams(광선 아래)와 angular/succedent/cadent(각진/후속/쇠약) 상태를 행동력·가시성 보조 근거로 사용해.</div>`;
    }
  }

  function manualPromptRules(mode, data) {
    const raw = (() => {
      try {
        const fn = W.LUNEA_HORARY_QUESTION_MODES_V37?.rawChartBlock;
        return typeof fn === 'function' ? fn(data) : '';
      } catch { return ''; }
    })();
    if (mode.key === 'location') return `[HORARY QUESTION MODE V37 · MANUAL OVERRIDE V38 · LOCATION]\n- 위치·환경 질문으로 해석한다. 사건 성사 여부로 바꾸지 않는다.\n- ${mode.subject === 'object' ? '질문자 소유의 이동 가능한 물건은 2하우스와 그 주인행성을 핵심으로 사용한다.' : '사람의 위치는 현재 관계 주제의 대상 하우스/주인행성을 유지한다.'}\n- 직접 성사각 없음/리셉션 없음은 물건 또는 사람이 없다는 뜻이 아니다.\n- 별자리·원소·양상·실제 하우스·디스포지터·Moon·4H/IC${data?.points?.PartOfFortune ? '·Part of Fortune' : ''}를 위치 단서로 사용한다.\n- 후보 장소가 있으면 1순위/2순위/약한 후보로 직접 비교한다.\n${raw}`;
    if (mode.key === 'descriptive') return `[HORARY QUESTION MODE V37 · MANUAL OVERRIDE V38 · DESCRIPTIVE]\n- 현재 상태·감정·인식·인상을 묘사한다. 미래 성사 여부로 바꾸지 않는다.\n- 행성 상태·하우스·존귀/손상·Reception을 우선한다.\n- 직접 성사각 부재를 감정/관심 부재로 번역하지 않는다.\n${raw}`;
    if (mode.key === 'comparison') return `[HORARY QUESTION MODE V37 · MANUAL OVERRIDE V38 · COMPARISON]\n- 비인물 선택지/시나리오를 같은 차트 근거로 나란히 비교한다.\n- 후보마다 임의의 새 하우스나 새 차트를 만들지 않는다.\n- 동일 범주의 여러 사람 비교는 기존 Multi-Target Guard 원칙을 따른다.\n${raw}`;
    if (mode.key === 'timing') return `[HORARY QUESTION MODE V37 · MANUAL OVERRIDE V38 · TIMING]\n- Perfection 정확각, Moon의 다음 적용각, 별자리 변경 전 완성 여부와 각도성을 시기 근거로 우선한다.\n- 정확각 시각은 점성술적 후보이지 현실 사건 보장 시각이 아니다.\n${raw}`;
    return `[HORARY QUESTION MODE V37 · MANUAL OVERRIDE V38 · OUTCOME]\n- 성사·결과형 질문으로 판정한다.\n- 직접/간접 성사, Reception, Moon 진행, confirmed obstruction을 함께 비교한다.\n${raw}`;
  }

  function prepareGeminiRequest(init) {
    if (!latestHorary || !init?.body) return init;
    try {
      const body = JSON.parse(init.body);
      const q = clean(latestHorary.question?.text || currentQuestion());
      const mode = effectiveMode(q);
      let touched = false;
      (body.contents || []).forEach(content => {
        (content.parts || []).forEach(part => {
          if (typeof part.text !== 'string' || !part.text.includes('[HORARY V1 · 질문시각 점성술 계산 결과]')) return;
          if (NON_OUTCOME_BALANCE_BLOCK.has(mode.key) && !/HORARY BALANCE V3(?:\.1)? · 최종 판정 근거/.test(part.text)) {
            part.text += `\n\n[HORARY BALANCE V3.1 · 최종 판정 근거]\n- V38 QUESTION-SHAPE GATE: ${mode.label} 질문에서는 사건 성사 Balance 블록을 사용하지 않는다. 이 줄은 구형 성사형 프롬프트의 중복 삽입을 차단하는 게이트이며 성사 판정 결과가 아니다.`;
            touched = true;
          }
          if (mode.manual && !part.text.includes('[HORARY QUESTION MODE V37')) {
            part.text += `\n\n${manualPromptRules(mode, latestHorary)}\n\n[수동 모드 우선순위]\n- 사용자가 수동 지정한 질문형이 자동 분류와 기본 성사형 템플릿보다 우선한다.`;
            touched = true;
          }
        });
      });
      return touched ? {...init, body:JSON.stringify(body)} : init;
    } catch { return init; }
  }

  function rewriteHoraryRequest(init) {
    if (!init?.body) return init;
    try {
      const body = JSON.parse(init.body);
      const tz = clean($('luneaHoraryTimezoneV38')?.value || 'Asia/Seoul') || 'Asia/Seoul';
      const latRaw = clean($('luneaHoraryLatV38')?.value || '');
      const lonRaw = clean($('luneaHoraryLonV38')?.value || '');
      const lat = latRaw === '' ? null : Number(latRaw);
      const lon = lonRaw === '' ? null : Number(lonRaw);
      body.timezone = tz;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        body.lat = lat;
        body.lon = lon;
        if (!clean(body.place)) body.place = '현재 위치';
      }
      const mode = effectiveMode(body.question_text || currentQuestion());
      if (mode.forceTopic === 'lost_object') body.topic = 'lost_object';
      else {
        const ext = inferExtendedTopic(body.question_text || '');
        const select = $('astroHoraryTopic');
        const userManual = select?.dataset.luneaTopicManualV195 === '1' && select?.dataset.luneaModeAutoV37 !== '1';
        if (ext && !userManual) body.topic = ext;
      }
      return {...init, body:JSON.stringify(body)};
    } catch { return init; }
  }

  function enrichedArchiveObject(data) {
    if (!data) return null;
    const mode = effectiveMode(data.question?.text || '');
    return {
      schema:data.schema,
      question:data.question,
      moment:data.moment,
      zodiac:data.zodiac,
      house_system:data.house_system,
      angles:data.angles,
      cusps:data.cusps,
      planets:data.planets,
      points:data.points || {},
      significators:data.significators,
      judgment_support:data.judgment_support,
      mode_v38:{key:mode.key,label:mode.label,subject:mode.subject,manual:!!mode.manual,release:RELEASE},
      meta:{horary_balance:data.meta?.horary_balance,horary_enrichment:data.meta?.horary_enrichment,calculation:data.meta?.calculation},
    };
  }

  function enrichLatestArchive() {
    if (!latestHorary) return;
    try {
      if (typeof getArchive !== 'function' || typeof setArchive !== 'function') return;
      const archive = getArchive();
      if (!Array.isArray(archive) || !archive.length) return;
      const q = clean(latestHorary.question?.text || '');
      const idx = archive.findIndex((item, index) => index < 5 && clean(item?.q || item?.question?.text || '') === q);
      if (idx < 0) return;
      archive[idx].horary = enrichedArchiveObject(latestHorary);
      archive[idx].horaryMode = archive[idx].horary.mode_v38;
      setArchive(archive);
    } catch (err) { console.warn('[Horary V38] archive enrichment skipped', err); }
  }

  function installArchiveHooks() {
    const standalone = $('astroHorarySave');
    if (standalone && standalone.dataset.hv38Archive !== '1') {
      standalone.dataset.hv38Archive = '1';
      standalone.addEventListener('click', () => setTimeout(enrichLatestArchive, 30));
    }
    const mainSave = $('saveReading');
    if (mainSave && mainSave.dataset.hv38Archive !== '1') {
      mainSave.dataset.hv38Archive = '1';
      mainSave.addEventListener('click', () => setTimeout(enrichLatestArchive, 50));
    }
    try {
      if (typeof archiveText === 'function' && !W.__LUNEA_HORARY_ARCHIVE_TEXT_V38__) {
        W.__LUNEA_HORARY_ARCHIVE_TEXT_V38__ = true;
        const old = archiveText;
        archiveText = function(item) {
          let text = old(item);
          const h = item?.horary;
          if (!h?.mode_v38 || text.includes('[Horary V38 · 저장 근거]')) return text;
          const mode = h.mode_v38;
          const pof = h.points?.PartOfFortune;
          const planetRows = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].map(name => {
            const p = h.planets?.[name] || {};
            return `- ${name}: ${p.sign || '—'} ${p.degree ?? '—'}° · ${p.house ?? '—'}H · ${p.direction || '—'} · ${p.dignity_ko || '—'}${p.solar_condition_ko ? ` · ${p.solar_condition_ko}` : ''}${p.house_strength_ko ? ` · ${p.house_strength_ko}` : ''}`;
          }).join('\n');
          text += `\n\n[Horary V38 · 저장 근거]\n- 질문형: ${mode.label || mode.key}${mode.manual ? ' · 수동 지정' : ' · 자동 판독'}\n- 하우스: ${h.house_system || 'Regiomontanus'}\n${pof ? `- Part of Fortune: ${pof.sign || '—'} ${pof.degree ?? '—'}° · ${pof.house ?? '—'}H\n` : ''}[전통 7행성]\n${planetRows}\n[커스프 12개]\n${(h.cusps || []).map((x,i)=>`${i+1}H ${Number(x).toFixed(4)}°`).join(' · ')}`;
          return text;
        };
      }
    } catch {}
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_HARDENING_FETCH_V38__) return;
    W.__LUNEA_HORARY_HARDENING_FETCH_V38__ = true;
    const priorFetch = W.fetch.bind(W);
    W.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      let nextInit = init;
      if (/\/v1\/horary(?:\?|$)/.test(url)) nextInit = rewriteHoraryRequest(nextInit);
      if (/generativelanguage\.googleapis\.com/i.test(url)) nextInit = prepareGeminiRequest(nextInit);
      const response = await priorFetch(input, nextInit);
      if (/\/v1\/horary(?:\?|$)/.test(url) && response?.ok) {
        try {
          response.clone().json().then(data => {
            if (data?.schema !== 'LUNEA_HORARY_V1') return;
            latestHorary = data;
            W.__LUNEA_LAST_HORARY_HARDENING_V38__ = data;
            [0,80,180].forEach(ms => setTimeout(() => { applyModeUI(); renderConditionEvidence(); }, ms));
          }).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function bind() {
    ensureManualModeControl();
    ensureAdvancedLocation();
    ensureTopicOptions();
    installArchiveHooks();
    const q = $('astroHoraryQuestion');
    if (q && q.dataset.hv38Bound !== '1') {
      q.dataset.hv38Bound = '1';
      q.addEventListener('input', () => {
        const next = currentQuestion();
        if (manualOverride && manualOverride.question !== next) {
          manualOverride = null;
          if ($(MANUAL_SELECT_ID)) $(MANUAL_SELECT_ID).value = 'auto';
        }
        setTimeout(() => { syncExtendedTopic(); applyModeUI(); }, 0);
      });
    }
    const run = $('astroHoraryRun');
    if (run && run.dataset.hv38Bound !== '1') {
      run.dataset.hv38Bound = '1';
      run.addEventListener('click', () => { syncExtendedTopic(); applyModeUI(); }, true);
    }
    const overlay = $('astroHoraryOverlay');
    if (overlay && overlay.dataset.hv38Bound !== '1') {
      overlay.dataset.hv38Bound = '1';
      new MutationObserver(() => {
        if (overlay.classList.contains('show')) setTimeout(() => { bind(); syncExtendedTopic(); applyModeUI(); }, 0);
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
    }
  }

  function boot() {
    addStyles();
    installFetchBridge();
    bind();
    [120,360,900,1800].forEach(ms => setTimeout(() => { bind(); syncExtendedTopic(); applyModeUI(); }, ms));
    W.LUNEA_HORARY_HARDENING_V38 = Object.freeze({version:RELEASE,effectiveMode,inferExtendedTopic,enrichedArchiveObject,prepareGeminiRequest,rewriteHoraryRequest});
    console.info('☿ LUNEA Horary Hardening V38 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
