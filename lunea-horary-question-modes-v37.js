'use strict';

/*
  LUNEA HORARY QUESTION MODES V37
  ===============================
  Adds question-shape routing on top of the existing traditional Horary core.

  Goals:
  - Do not treat every Horary question as an event-perfection YES/NO question.
  - Lost-object/location questions use the movable-possession 2H route.
  - Descriptive/perception questions prioritize condition/reception, not perfection.
  - Non-person option comparisons compare one chart against the listed alternatives.
  - Timing questions keep perfection/Moon timing logic.
  - Genuine multi-person comparisons remain blocked by the existing non-arbitrary guard.
  - External/AI prompt gets the full traditional 7-planet placements, Regiomontanus cusps,
    and all currently in-orb Ptolemaic planet aspects so the model is not trapped by a
    narrow summary sentence.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_QUESTION_MODES_V37__) return;
  W.__LUNEA_HORARY_QUESTION_MODES_V37__ = true;

  const $ = id => document.getElementById(id);
  const MODE_CHIP_ID = 'luneaHoraryModeChipV37';
  const MODE_BOX_ID = 'luneaHoraryModeEvidenceV37';
  const MODE_HEAD_ID = 'luneaHoraryModeHeadlineV37';
  const STYLE_ID = 'luneaHoraryQuestionModesV37Style';
  const RELEASE = '37.0';

  const SIGN_KO = ['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
  const SIGN_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ELEMENT = ['불','흙','공기','물','불','흙','공기','물','불','흙','공기','물'];
  const MODALITY = ['활동','고정','변통','활동','고정','변통','활동','고정','변통','활동','고정','변통'];
  const TRAD_RULER = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const PLANET_KO = {Sun:'태양',Moon:'달',Mercury:'수성',Venus:'금성',Mars:'화성',Jupiter:'목성',Saturn:'토성'};
  const ASPECTS = [
    ['conjunction','합',0],
    ['sextile','육십분위',60],
    ['square','사분위',90],
    ['trine','삼분위',120],
    ['opposition','충',180],
  ];

  let latestHorary = null;
  let latestQuestion = '';
  let modeState = {key:'outcome', label:'성사·결과', subject:'event', forceTopic:null};

  const clean = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function currentQuestion() {
    return clean($('astroHoraryQuestion')?.value || latestHorary?.question?.text || '');
  }

  function isMultiPerson(question) {
    try {
      const fn = W.LUNEA_HORARY_MULTI_GUARD?.isMultiPersonQuestion;
      if (typeof fn === 'function') return !!fn(question);
    } catch {}
    const q = clean(question);
    const pair = /(?:\bA\s*(?:와|과|랑|\/|·|및|,|그리고)\s*B\b|두\s*(?:사람|명|인연|상대|대상)|2\s*(?:사람|명|인연|상대|대상)|둘\s*(?:다|은|이|의)?)/i.test(q);
    const people = /(사람|상대|인연|전남친|전여친|전애인|구남친|구여친|연인|이성|썸|친구|지인|동료|상사|부하|배우자|남편|아내)/i.test(q);
    return pair && people;
  }

  function classifyQuestion(question) {
    const q = clean(question);
    if (!q) return {key:'outcome', label:'성사·결과', subject:'event', forceTopic:null};
    if (isMultiPerson(q)) return {key:'multi_person', label:'다중 인물 비교', subject:'people', forceTopic:null};

    const locationIntent = /(어디(?:에|서|쯤)?|위치|행방|분실|잃어(?:버|버렸|버린|버렸던)?|못\s*찾|찾(?:을|는|아|고\s*있)|수납|서랍|베란다|창고|보관|어느\s*(?:곳|장소|범주)|집\s*안|방\s*안)/i.test(q);
    const objectIntent = /(물건|소지품|소유물|분실물|카메라|디카|쿨픽스|휴대폰|핸드폰|스마트폰|폰\b|지갑|열쇠|키\b|가방|반지|목걸이|귀걸이|시계|서류|전자기기|기기|충전기|이어폰|에어팟|책\b|옷\b|신발|안경|카드|USB|메모리|사진기)/i.test(q);
    const personIntent = /(사람|상대|남자|여자|남친|여친|남편|아내|배우자|친구|지인|동료|상사|부하|전남친|전여친|구남친|구여친|연인|썸|그\s*사람|그녀|그가|그는)/i.test(q);
    const domesticStorage = /(수납|서랍|베란다|창고|보관|잡동사니|전자기기|서류|옷장|침실|내\s*방|집\s*안)/i.test(q);

    if (locationIntent && (objectIntent || domesticStorage) && !personIntent) {
      return {key:'location', label:'분실물·위치', subject:'object', forceTopic:'lost_object'};
    }
    if (locationIntent && personIntent) {
      return {key:'location', label:'위치·행방', subject:'person', forceTopic:null};
    }

    const compareIntent = /(둘\s*중|셋\s*중|세\s*(?:곳|개|가지)\s*중|어느\s*(?:쪽|것|곳|범주)|비교|더\s*(?:강|낫|유력|적합)|가장\s*(?:강|유력|가까)|\bvs\.?\b|A\s*\/\s*B)/i.test(q);
    const timingIntent = /(언제|시기|타이밍|몇\s*시|시간대|날짜|며칠|몇\s*주|몇\s*달|월초|월중|월말|이번\s*주|이번\s*달|올해\s*안)/i.test(q);
    const descriptiveIntent = /(어떻게\s*(?:보|느끼|생각)|어떤\s*(?:이미지|인상|사람|상태|감정|매력)|인상|이미지|외모|매력|속마음|마음|감정|정서|호감|그리움|후회|인식|추측|기억|생각하고|느끼고)/i.test(q);
    const outcomeIntent = /(될까|되나|가능|불가능|성사|합격|연락(?:이|을)?\s*(?:올|하|할)|답장(?:이|을)?\s*(?:올|하|할)|만날\s*수|재회|사귀|헤어|결혼|돌아올|찾을\s*수|회수|발견|구매|계약|이직|합격|통과|승인)/i.test(q);

    if (compareIntent) return {key:'comparison', label:'선택지·비교', subject:'options', forceTopic:null};
    if (timingIntent) return {key:'timing', label:'시기·전개', subject:'event', forceTopic:null};
    if (descriptiveIntent && !outcomeIntent) return {key:'descriptive', label:'상태·묘사', subject:'state', forceTopic:null};
    return {key:'outcome', label:'성사·결과', subject:'event', forceTopic:null};
  }

  function ensureLostObjectOption() {
    const select = $('astroHoraryTopic');
    if (!select) return false;
    if (!select.querySelector('option[value="lost_object"]')) {
      const option = document.createElement('option');
      option.value = 'lost_object';
      option.textContent = '분실물·소유물 위치';
      select.appendChild(option);
    }
    return true;
  }

  function modeHelp(mode) {
    if (mode.key === 'location' && mode.subject === 'object') return '2H 소유물 주인행성 · 별자리/원소 · 하우스 배치 · 주변 환경 단서 우선';
    if (mode.key === 'location') return '대상 주인행성의 별자리·하우스·환경 단서 우선';
    if (mode.key === 'descriptive') return '행성 상태·하우스·존귀/손상·리셉션을 우선하고 성사각은 보조로만 사용';
    if (mode.key === 'comparison') return '한 차트의 동일 근거로 후보를 나란히 비교 · 임의 시그니피케이터 분할 금지';
    if (mode.key === 'timing') return '적용각·Moon(달) 진행·별자리 변경·각도성을 이용해 시기 범위를 읽음';
    if (mode.key === 'multi_person') return '두 사람을 임의 하우스로 갈라놓지 않는 보호 모드';
    return '직접/간접 성사각 · 리셉션 · Moon 진행 · 방해 패턴을 함께 판정';
  }

  function syncMode() {
    ensureLostObjectOption();
    const question = currentQuestion();
    const select = $('astroHoraryTopic');
    const overlay = $('astroHoraryOverlay');

    if (question !== latestQuestion) {
      latestQuestion = question;
      if (select?.dataset.luneaModeAutoV37 === '1') {
        delete select.dataset.luneaModeAutoV37;
        delete select.dataset.luneaTopicManualV195;
      }
    }

    modeState = classifyQuestion(question);
    if (overlay) overlay.dataset.horaryMode = modeState.key;

    if (select && modeState.forceTopic === 'lost_object') {
      const manuallyOverridden = select.dataset.luneaTopicManualV195 === '1' && select.dataset.luneaModeAutoV37 !== '1';
      if (!manuallyOverridden) {
        select.value = 'lost_object';
        select.dataset.luneaTopicManualV195 = '1';
        select.dataset.luneaModeAutoV37 = '1';
      }
    } else if (select?.dataset.luneaModeAutoV37 === '1') {
      delete select.dataset.luneaModeAutoV37;
      delete select.dataset.luneaTopicManualV195;
    }

    renderModeChip();
    return modeState;
  }

  function renderModeChip() {
    const select = $('astroHoraryTopic');
    const field = select?.closest?.('.field');
    if (!field) return false;
    let chip = $(MODE_CHIP_ID);
    if (!chip) {
      chip = document.createElement('div');
      chip.id = MODE_CHIP_ID;
      chip.className = 'horary-mode-v37';
      field.insertAdjacentElement('afterend', chip);
    }
    chip.innerHTML = `<small>AUTO QUESTION MODE · V37</small><b>${esc(modeState.label)}</b><span>${esc(modeHelp(modeState))}</span>`;
    return true;
  }

  function addStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .horary-mode-v37{margin:7px 0 10px;padding:9px 10px;border-radius:12px;border:1px solid rgba(145,211,239,.16);background:linear-gradient(145deg,rgba(97,164,196,.055),rgba(178,151,224,.055))}
      .horary-mode-v37 small{display:block;color:#9ccfe8;font-size:7.7px;font-weight:800;letter-spacing:1px}.horary-mode-v37 b{display:block;color:#eeeaf6;font-size:10.8px;margin:3px 0}.horary-mode-v37 span{display:block;color:#9492a4;font-size:9.2px;line-height:1.45}
      #${MODE_HEAD_ID}{display:none;margin:4px 0 5px;font-size:14px;line-height:1.45;color:#f4f0fb;font-weight:700}
      #${MODE_BOX_ID}{margin-top:8px;padding:11px 12px;border-radius:14px;border:1px solid rgba(130,202,230,.18);background:linear-gradient(145deg,rgba(97,165,195,.055),rgba(189,164,248,.055))}
      #${MODE_BOX_ID} small{display:block;color:#a7d9ed;font-size:8px;font-weight:800;letter-spacing:.9px}#${MODE_BOX_ID} b{display:block;color:#f0edf7;font-size:11px;margin:4px 0}#${MODE_BOX_ID} p{margin:4px 0;color:#aaa7b7;font-size:9.7px;line-height:1.5}
      #astroHoraryOverlay[data-horary-mode="location"] .horary-summary h4,
      #astroHoraryOverlay[data-horary-mode="descriptive"] .horary-summary h4,
      #astroHoraryOverlay[data-horary-mode="comparison"] .horary-summary h4{display:none!important}
      #astroHoraryOverlay[data-horary-mode="location"] #${MODE_HEAD_ID},
      #astroHoraryOverlay[data-horary-mode="descriptive"] #${MODE_HEAD_ID},
      #astroHoraryOverlay[data-horary-mode="comparison"] #${MODE_HEAD_ID}{display:block}
      #astroHoraryOverlay[data-horary-mode="location"] #luneaHoraryBalanceEvidenceV195,
      #astroHoraryOverlay[data-horary-mode="descriptive"] #luneaHoraryBalanceEvidenceV195,
      #astroHoraryOverlay[data-horary-mode="comparison"] #luneaHoraryBalanceEvidenceV195{display:none!important}
      .lunea-horary-perfection-secondary-v37{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function signIndex(row) {
    if (Number.isFinite(Number(row?.sign_index))) return Number(row.sign_index);
    if (Number.isFinite(Number(row?.longitude))) return Math.floor((((Number(row.longitude) % 360) + 360) % 360) / 30);
    const idx = SIGN_KO.indexOf(String(row?.sign || ''));
    return idx >= 0 ? idx : 0;
  }

  function signTextFromLon(lon) {
    const value = (((Number(lon) || 0) % 360) + 360) % 360;
    const idx = Math.floor(value / 30);
    const degree = value % 30;
    return `${SIGN_EN[idx]}(${SIGN_KO[idx]}) ${degree.toFixed(2)}°`;
  }

  function houseClue(house) {
    const map = {
      1:'질문자의 바로 곁·개인 공간·자주 손대는 곳',
      2:'개인 소유품 수납·서랍·보관함·돈/귀중품 주변',
      3:'책상·서류·책·통신기기·가까운 선반·통로 주변',
      4:'집 안쪽·바닥 가까운 곳·오래된 가족 물건·깊은 수납',
      5:'취미·오락·장식·침실/휴식과 연결된 개인 공간',
      6:'생활용품·작업/관리 공간·정리함·반복해서 쓰는 물건 주변',
      7:'다른 사람의 자리·방 맞은편·공용/상대 영역',
      8:'깊이 숨긴 곳·닫힌 상자·공동 물건·잘 열지 않는 수납',
      9:'책·학습·여행용품·높은 선반·멀리 치워둔 곳',
      10:'눈에 띄는 곳·높거나 공개된 위치·업무 공간',
      11:'공용 선반·친구/모임 물건·전자/네트워크 물품 주변',
      12:'가려진 곳·뒤/아래·잡동사니·오래 손대지 않은 수납',
    };
    return map[Number(house)] || '하우스 환경 단서를 별도 확인';
  }

  function elementClue(element) {
    if (element === '흙') return '낮고 안정된 곳·서랍/상자·건조하고 실용적인 수납';
    if (element === '공기') return '선반·책/서류·창가/통풍 지점·전자/통신 물품과 가까운 곳';
    if (element === '물') return '낮거나 안쪽·가려진 용기·습기/물과 가까운 생활 공간';
    return '비교적 높거나 드러난 곳·빛/열·활동적인 공간';
  }

  function receptionLabel(rec) {
    if (!rec) return '—';
    if (rec.same_significator) return '같은 주인행성 공유';
    if (rec.mutual_reception) return '상호 주요 리셉션';
    if (rec.has_reception) return '한쪽 주요 리셉션';
    return '주요 도머사일·고양 리셉션 없음';
  }

  function locationDetails(data) {
    const sig = data?.significators || {};
    const target = sig.quesited || {};
    const row = target.planet || {};
    const idx = signIndex(row);
    return {
      house: Number(row.house || 0),
      ruler: target.ruler || '—',
      rulerKo: target.ruler_ko || PLANET_KO[target.ruler] || '—',
      sign: row.sign || SIGN_KO[idx],
      degree: row.degree,
      element: ELEMENT[idx],
      modality: MODALITY[idx],
      dignity: row.dignity_ko || row.dignity || '—',
      dispositor: TRAD_RULER[idx],
      houseClue: houseClue(row.house),
      elementClue: elementClue(ELEMENT[idx]),
    };
  }

  function modeHeadline(mode) {
    if (mode.key === 'location') return '위치·환경 단서를 읽는 질문 · 성사각 부재는 위치 판정의 부정 근거가 아님';
    if (mode.key === 'descriptive') return '상태·인식·감정 묘사형 질문 · 행성 상태와 수용 관계를 우선';
    if (mode.key === 'comparison') return '선택지 비교형 질문 · 같은 차트 근거로 후보를 나란히 비교';
    return '';
  }

  function renderModeResult() {
    const data = latestHorary || W.__LUNEA_LAST_HORARY_BALANCE_V31__;
    const result = $('astroHoraryResult');
    const summary = result?.querySelector('.horary-summary');
    if (!data || !summary || !result.classList.contains('show')) return false;

    const q = clean(data.question?.text || currentQuestion());
    const mode = classifyQuestion(q);
    modeState = mode;
    const overlay = $('astroHoraryOverlay');
    if (overlay) overlay.dataset.horaryMode = mode.key;
    renderModeChip();

    let headline = $(MODE_HEAD_ID);
    if (!headline) {
      headline = document.createElement('div');
      headline.id = MODE_HEAD_ID;
      const h4 = summary.querySelector('h4');
      if (h4) h4.insertAdjacentElement('afterend', headline);
      else summary.appendChild(headline);
    }
    const nextHeadline = modeHeadline(mode);
    if (headline.textContent !== nextHeadline) headline.textContent = nextHeadline;

    const secondary = mode.key === 'location' || mode.key === 'descriptive' || mode.key === 'comparison';
    [...result.querySelectorAll('.horary-card')].forEach(card => {
      const title = clean(card.querySelector('h5')?.textContent || '');
      card.classList.toggle('lunea-horary-perfection-secondary-v37', secondary && /^성사각\s*·\s*리셉션/.test(title));
    });

    let box = $(MODE_BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = MODE_BOX_ID;
      summary.insertAdjacentElement('afterend', box);
    }

    let boxHtml = '';
    if (mode.key === 'location') {
      const d = locationDetails(data);
      const subjectLabel = mode.subject === 'object' ? '물건 시그니피케이터' : '대상 시그니피케이터';
      boxHtml = `<small>HORARY MODE · LOCATION</small><b>${esc(subjectLabel)} · ${esc(d.ruler)}(${esc(d.rulerKo)}) · ${esc(d.sign)} ${d.degree ?? '—'}° · ${d.house || '—'}H</b><p>원소/양상: ${esc(d.element)} · ${esc(d.modality)} · 상태 ${esc(d.dignity)}</p><p>하우스 환경 단서: ${esc(d.houseClue)}</p><p>원소 환경 단서: ${esc(d.elementClue)}</p><p>전통 디스포지터: ${esc(d.dispositor)}(${esc(PLANET_KO[d.dispositor] || d.dispositor)}) · 후보 장소가 여러 개면 AI 해석에서 각 후보와 이 단서를 하나씩 대조해 순위를 낸다.</p>`;
    } else if (mode.key === 'descriptive') {
      const sig = data.significators || {};
      const j = data.judgment_support || {};
      boxHtml = `<small>HORARY MODE · DESCRIPTIVE</small><b>성사 여부가 아니라 현재 상태·인식·감정을 묘사하는 질문</b><p>질문자: ${esc(sig.querent?.ruler || '—')}(${esc(sig.querent?.ruler_ko || '—')}) · ${esc(sig.querent?.planet?.sign || '—')} ${sig.querent?.planet?.degree ?? '—'}° · ${sig.querent?.planet?.house ?? '—'}H · ${esc(sig.querent?.planet?.dignity_ko || '—')}</p><p>대상: ${esc(sig.quesited?.ruler || '—')}(${esc(sig.quesited?.ruler_ko || '—')}) · ${esc(sig.quesited?.planet?.sign || '—')} ${sig.quesited?.planet?.degree ?? '—'}° · ${sig.quesited?.planet?.house ?? '—'}H · ${esc(sig.quesited?.planet?.dignity_ko || '—')}</p><p>Reception(리셉션): ${esc(receptionLabel(j.reception))} · 직접 성사각이 없다는 이유만으로 감정/인식이 없다고 판정하지 않는다.</p>`;
    } else if (mode.key === 'comparison') {
      boxHtml = `<small>HORARY MODE · COMPARISON</small><b>선택지를 같은 차트 근거로 비교</b><p>후보마다 임의로 새 하우스·새 시그니피케이터를 만들어내지 않는다. 질문의 주 대상/사건 하우스를 고정한 뒤, 사용자가 제시한 각 후보가 그 행성의 별자리·하우스·상태·Moon 전개와 얼마나 맞는지 나란히 대조한다.</p><p>사람 A/B처럼 동일 범주의 여러 사람을 비교하는 질문은 기존 Multi-Target Guard가 자동 계산을 막는다.</p>`;
    } else if (mode.key === 'timing') {
      boxHtml = `<small>HORARY MODE · TIMING</small><b>시기형 질문 · 성사각/Moon 진행/별자리 변경을 우선</b><p>정확각 시각은 점성술적 후보 시각이며 현실 사건 보장 시각이 아니다. 적용각이 없으면 Moon의 다음 진행과 다른 전통 근거를 함께 확인한다.</p>`;
    } else if (mode.key === 'multi_person') {
      boxHtml = `<small>HORARY MODE · MULTI PERSON</small><b>다중 인물 비교 보호 모드</b><p>동일 관계 범주의 두 사람을 이름 순서만으로 5H/7H 등에 임의 배정하지 않는다. 기존 다중 대상 가드의 안내를 따른다.</p>`;
    } else {
      boxHtml = `<small>HORARY MODE · OUTCOME</small><b>성사·결과형 질문</b><p>직접/간접 성사각, 리셉션, Moon 전개, 확정 방해 패턴을 함께 판정한다.</p>`;
    }
    const boxSig = `${mode.key}|${mode.subject}|${boxHtml}`;
    if (box.dataset.sig !== boxSig) {
      box.dataset.sig = boxSig;
      box.innerHTML = boxHtml;
    }
    box.style.display = mode.key === 'outcome' ? 'none' : '';

    const inline = $('luneaHoraryInline');
    if (inline && mode.key !== 'outcome') {
      const b = inline.querySelector('b');
      const span = inline.querySelector('span');
      if (b) b.textContent = modeHeadline(mode) || `${mode.label} 질문형`;
      if (span) span.textContent = `${mode.label} 자동 판정 · 성사형 근거를 질문 유형에 맞게 재배치한 보조 계산`;
    }
    return true;
  }

  function aspectLimit(a, b, key) {
    const base = {conjunction:8,sextile:5,square:7,trine:7,opposition:8}[key] || 6;
    if (a === 'Moon' || b === 'Moon') return base + 2;
    if (a === 'Sun' || b === 'Sun') return base + 1;
    return base;
  }

  function angularSeparation(a, b) {
    const delta = (((Number(a) - Number(b) + 180) % 360) + 360) % 360 - 180;
    return Math.abs(delta);
  }

  function currentAspects(data) {
    const planets = data?.planets || {};
    const bodies = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].filter(x => planets[x]);
    const out = [];
    for (let i=0;i<bodies.length;i++) {
      for (let k=i+1;k<bodies.length;k++) {
        const a = bodies[i], b = bodies[k], ra = planets[a], rb = planets[b];
        const sep = angularSeparation(ra.longitude, rb.longitude);
        let best = null;
        ASPECTS.forEach(([key,label,angle]) => {
          const orb = Math.abs(sep-angle);
          if (!best || orb < best.orb) best = {key,label,angle,orb};
        });
        const limit = aspectLimit(a,b,best.key);
        if (!best || best.orb > limit) continue;
        const hours = (a === 'Moon' || b === 'Moon') ? 1 : 3;
        const f = hours / 24;
        const sepPast = angularSeparation(Number(ra.longitude)-Number(ra.speed_deg_per_day || 0)*f, Number(rb.longitude)-Number(rb.speed_deg_per_day || 0)*f);
        const sepFuture = angularSeparation(Number(ra.longitude)+Number(ra.speed_deg_per_day || 0)*f, Number(rb.longitude)+Number(rb.speed_deg_per_day || 0)*f);
        const pastOrb = Math.abs(sepPast-best.angle), futureOrb = Math.abs(sepFuture-best.angle);
        let phase = '유효 오브';
        if (best.orb <= .05) phase = '정확';
        else if (futureOrb + .005 < best.orb) phase = '적용';
        else if (pastOrb + .005 < best.orb) phase = '분리';
        out.push({a,b,label:best.label,orb:best.orb,phase});
      }
    }
    return out.sort((x,y)=>x.orb-y.orb);
  }

  function rawChartBlock(data) {
    const planets = data?.planets || {};
    const planetRows = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].map(body => {
      const p = planets[body] || {};
      return `- ${body}(${PLANET_KO[body]}): ${p.sign_en || ''}${p.sign_en ? '/' : ''}${p.sign || ''} ${Number(p.degree ?? 0).toFixed(2)}° · H${p.house ?? '—'} · ${p.direction || '—'} · ${p.dignity_ko || p.dignity || '—'} · lon ${Number(p.longitude ?? 0).toFixed(4)}°`;
    }).join('\n');
    const cuspRows = (data?.cusps || []).map((lon,index) => `- House ${index+1}: ${signTextFromLon(lon)} · lon ${Number(lon).toFixed(4)}°`).join('\n');
    const aspectRows = currentAspects(data).map(x => `- ${x.a}(${PLANET_KO[x.a]}) ${x.label} ${x.b}(${PLANET_KO[x.b]}) · orb ${x.orb.toFixed(2)}° · ${x.phase}`).join('\n') || '- 현재 유효 오브 안의 전통 주요각 없음';
    return `[전통 7행성 전체 위치]\n${planetRows}\n\n[Regiomontanus 하우스 커스프 12개]\n${cuspRows}\n\n[현재 유효 오브 안의 Ptolemaic 주요각]\n${aspectRows}`;
  }

  function modePromptRules(data) {
    const mode = classifyQuestion(data?.question?.text || currentQuestion());
    if (mode.key === 'location') {
      const object = mode.subject === 'object';
      return `[HORARY QUESTION MODE V37 · ${object ? 'LOST OBJECT / LOCATION' : 'PERSON LOCATION'}]\n- 이 질문은 현재 위치·환경·후보 장소를 묻는 위치형 질문이다. 사건 성사 여부를 묻는 질문으로 바꾸지 않는다.\n- ${object ? '질문자 소유의 이동 가능한 물건은 2하우스와 그 주인행성을 핵심 시그니피케이터로 사용한다.' : '사람의 위치를 묻는 경우 현재 선택된 관계 주제의 대상 하우스/주인행성을 유지한다.'}\n- 대상 주인행성의 별자리, 원소, 양상, 실제 하우스 위치, 본질적 존귀/손상, 전통 디스포지터와 Moon(달)을 위치 단서로 읽는다. 집 안이라는 조건이 질문에 있으면 4하우스/IC는 집 내부 맥락 보조로만 본다.\n- "직접 성사각 없음", "Balance weak evidence", "리셉션 없음"을 물건이 없다는 뜻이나 특정 장소가 아니라는 뜻으로 사용하지 않는다. Perfection(성사각)은 사용자가 '찾을 수 있는가/회수되는가'까지 물었을 때만 회수 가능성의 보조 근거다.\n- 질문에 후보 장소/범주가 여러 개 있으면 각 후보를 하나씩 대조해 1순위 → 2순위 → 가장 약한 후보 순으로 답한다. 후보마다 임의의 새 하우스나 별도 차트를 만들지 않는다.\n- 최종 답은 '가장 강한 범주', '그다음', '약한 범주', '차트상 위치 단서', '불확실성' 순서로 직접 답한다.\n\n${rawChartBlock(data)}`;
    }
    if (mode.key === 'descriptive') {
      return `[HORARY QUESTION MODE V37 · DESCRIPTIVE / PERCEPTION]\n- 이 질문은 현재 상태·감정·인식·매력·인상을 묘사하는 질문이다. 미래 성사 여부로 바꾸지 않는다.\n- 대상 주인행성과 질문자 주인행성의 별자리·하우스·존귀/손상, 그리고 Reception(리셉션)을 우선한다. Moon은 전개/정서 보조다.\n- 직접 Perfection(성사각) 부재를 '감정 없음/관심 없음/매력 없음'으로 번역하지 않는다.\n- 사용자가 물은 속성만 항목별로 답하고, 연락/재회/행동 계획을 묻지 않았다면 확장하지 않는다.\n- 상대의 인식과 객관적 사실을 구분한다.\n\n${rawChartBlock(data)}`;
    }
    if (mode.key === 'comparison') {
      return `[HORARY QUESTION MODE V37 · OPTION COMPARISON]\n- 이 질문은 복수의 비인물 선택지/시나리오를 한 차트 안에서 비교하는 질문이다.\n- 하나의 주제 하우스와 시그니피케이터를 유지하고, 각 후보가 그 차트의 행성 상태·하우스·Moon 진행과 얼마나 일치하는지 같은 기준으로 대조한다.\n- 후보마다 임의로 별도 하우스를 배정하거나 새 차트를 만들어 차이를 제조하지 않는다.\n- 여러 '사람' 비교라면 자동 호라리로 강제 분리하지 말고 다중 대상 가드 원칙을 따른다.\n- 결론은 후보별 근거를 나란히 제시하고 가장 강한 후보/차선/애매한 부분을 명확히 말한다.\n\n${rawChartBlock(data)}`;
    }
    if (mode.key === 'timing') {
      return `[HORARY QUESTION MODE V37 · TIMING]\n- 이 질문은 시기형이다. Perfection 정확각, Moon의 다음 적용각, 별자리 변경 전 완성 여부, 각도성을 중심으로 시기 범위를 읽는다.\n- 점성술적 정확각 시각을 현실 사건 보장 시각으로 표현하지 않는다.\n- 직접각이 없으면 Moon과 다른 전통 근거를 검토하되 억지 날짜를 만들지 않는다.\n\n${rawChartBlock(data)}`;
    }
    return '';
  }

  function enrichedCopyText(data) {
    const mode = classifyQuestion(data?.question?.text || currentQuestion());
    const ai = clean($('astroHoraryAIText')?.classList.contains('show') ? $('astroHoraryAIText')?.textContent : '');
    const sig = data?.significators || {};
    const j = data?.judgment_support || {};
    const p = j.perfection || {};
    const c = j.primary_connection;
    return `LUNEA · TRADITIONAL HORARY · QUESTION MODE V37\n\n[질문 원문]\n${data?.question?.text || currentQuestion()}\n\n[자동 질문형]\n${mode.label} (${mode.key})\n${modeHelp(mode)}\n\n[차트 기준]\n- 질문 시각: ${data?.moment?.local_iso || '—'}\n- 질문 장소: ${data?.moment?.place_resolved || '—'}\n- 질문 주제: ${data?.question?.topic_label_ko || '—'}\n- 하우스 선택 근거: ${data?.question?.topic_note_ko || '—'}\n- Tropical(열대황도) / Regiomontanus(레지오몬타누스)\n- ASC: ${data?.angles?.ASC?.sign || '—'} ${data?.angles?.ASC?.degree ?? '—'}°\n- MC: ${data?.angles?.MC?.sign || '—'} ${data?.angles?.MC?.degree ?? '—'}°\n\n[핵심 시그니피케이터]\n- 질문자: ${sig.querent?.ruler || '—'}(${sig.querent?.ruler_ko || '—'}) · ${sig.querent?.planet?.sign || '—'} ${sig.querent?.planet?.degree ?? '—'}° · H${sig.querent?.planet?.house ?? '—'} · ${sig.querent?.planet?.dignity_ko || '—'}\n- 대상: ${sig.quesited?.ruler || '—'}(${sig.quesited?.ruler_ko || '—'}) · ${sig.quesited?.planet?.sign || '—'} ${sig.quesited?.planet?.degree ?? '—'}° · H${sig.quesited?.planet?.house ?? '—'} · ${sig.quesited?.planet?.dignity_ko || '—'}\n- Moon: ${sig.moon?.sign || '—'} ${sig.moon?.degree ?? '—'}° · H${sig.moon?.house ?? '—'}\n\n[성사 구조 — 질문형에 따라 보조]\n- 주 연결: ${c ? `${c.aspect_ko || '—'} · orb ${c.orb ?? '—'}° · ${c.phase_ko || '—'}` : '별도 연결각 없음'}\n- Perfection: ${p.reason_ko || '확인되지 않음'}${p.exact_local ? ` · ${p.exact_local}` : ''}\n- Reception: ${receptionLabel(j.reception)}\n\n${rawChartBlock(data)}\n\n${modePromptRules(data)}${ai && !/^계산 근거를/.test(ai) && !/^\[API 오류\]/.test(ai) ? `\n\n[호라리 AI 해석]\n${ai}` : ''}`;
  }

  async function writeClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly','');
    area.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  function installCopyOverride() {
    const button = $('astroHoraryCopy');
    if (!button || button.dataset.hqm37Copy === '1') return !!button;
    button.dataset.hqm37Copy = '1';
    button.addEventListener('click', async event => {
      const data = latestHorary || W.__LUNEA_LAST_HORARY_BALANCE_V31__;
      const mode = classifyQuestion(data?.question?.text || currentQuestion());
      if (!data || mode.key === 'outcome') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const original = button.textContent;
      button.disabled = true;
      const ok = await writeClipboard(enrichedCopyText(data));
      button.disabled = false;
      button.textContent = ok ? '✓ 질문형 전체 복사' : original;
      if (!ok) alert('복사 권한을 확인해줘.');
      if (ok) setTimeout(() => { button.textContent = original; }, 1600);
    }, true);
    return true;
  }

  function injectModePromptIntoRequest(init) {
    if (!latestHorary || !init?.body) return init;
    const mode = classifyQuestion(latestHorary?.question?.text || currentQuestion());
    if (mode.key === 'outcome' || mode.key === 'multi_person') return init;
    try {
      const body = JSON.parse(init.body);
      let touched = false;
      (body.contents || []).forEach(content => {
        (content.parts || []).forEach(part => {
          if (typeof part.text !== 'string') return;
          if (!part.text.includes('[HORARY V1 · 질문시각 점성술 계산 결과]')) return;
          if (part.text.includes('[HORARY QUESTION MODE V37')) return;
          part.text += `\n\n${modePromptRules(latestHorary)}\n\n[출력 우선순위]\n- 위 QUESTION MODE V37 규칙이 성사형 기본 템플릿보다 우선한다.\n- 질문 원문에 직접 답하고, 해당 질문형에서 불필요한 성사/불성사 문단은 만들지 않는다.`;
          touched = true;
        });
      });
      return touched ? {...init, body:JSON.stringify(body)} : init;
    } catch {
      return init;
    }
  }

  function scheduleRender() {
    [0,80,180,360].forEach(ms => setTimeout(() => {
      syncMode();
      renderModeResult();
      installCopyOverride();
    }, ms));
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_MODE_FETCH_V37__) return;
    W.__LUNEA_HORARY_MODE_FETCH_V37__ = true;
    const priorFetch = W.fetch.bind(W);
    W.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      const nextInit = /generativelanguage\.googleapis\.com/i.test(url) ? injectModePromptIntoRequest(init) : init;
      const response = await priorFetch(input, nextInit);
      if (/\/v1\/horary(?:\?|$)/.test(url) && response?.ok) {
        try {
          response.clone().json().then(data => {
            if (data?.schema !== 'LUNEA_HORARY_V1') return;
            latestHorary = data;
            W.__LUNEA_LAST_HORARY_MODE_V37__ = data;
            scheduleRender();
          }).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function bind() {
    ensureLostObjectOption();
    const q = $('astroHoraryQuestion');
    const select = $('astroHoraryTopic');
    const run = $('astroHoraryRun');
    const overlay = $('astroHoraryOverlay');

    if (q && q.dataset.hqm37Bound !== '1') {
      q.dataset.hqm37Bound = '1';
      q.addEventListener('input', syncMode);
    }
    if (select && select.dataset.hqm37Bound !== '1') {
      select.dataset.hqm37Bound = '1';
      select.addEventListener('change', event => {
        if (event.isTrusted) {
          delete select.dataset.luneaModeAutoV37;
          select.dataset.luneaTopicManualV195 = '1';
        }
      });
    }
    if (run && run.dataset.hqm37Bound !== '1') {
      run.dataset.hqm37Bound = '1';
      run.addEventListener('click', syncMode, true);
    }
    if (overlay && overlay.dataset.hqm37Bound !== '1') {
      overlay.dataset.hqm37Bound = '1';
      new MutationObserver(() => {
        if (overlay.classList.contains('show')) setTimeout(() => { syncMode(); renderModeResult(); }, 0);
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
    }
    const result = $('astroHoraryResult');
    if (result && result.dataset.hqm37Observed !== '1') {
      result.dataset.hqm37Observed = '1';
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        const run = () => {
          queued = false;
          if (result.classList.contains('show')) renderModeResult();
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 16);
      }).observe(result, {subtree:true, childList:true});
    }
    installCopyOverride();
  }

  function boot() {
    addStyles();
    installFetchBridge();
    bind();
    syncMode();

    [100,350,900,1800].forEach(ms => setTimeout(() => { bind(); syncMode(); renderModeResult(); }, ms));
    W.LUNEA_HORARY_QUESTION_MODES_V37 = Object.freeze({
      version:RELEASE,
      classifyQuestion,
      currentAspects,
      rawChartBlock,
      modePromptRules,
      syncMode,
      renderModeResult,
    });
    console.info('☿ LUNEA Horary Question Modes V37 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
