'use strict';

/*
  LUNEA HORARY V1
  ----------------
  Separate question-moment astrology.
  - no natal dependency
  - Tropical zodiac + Regiomontanus houses
  - standalone home entry + optional RWS support layer
  - deterministic Astro Core result + separate AI interpretation
*/
(() => {
  if (window.__LUNEA_ASTRO_HORARY_V1__) return;
  window.__LUNEA_ASTRO_HORARY_V1__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const PLACE_KEY = 'LUNEA_HORARY_PLACE';
  const DEFAULT_API_URL = 'https://lunea-astro-api.onrender.com';
  const $ = id => document.getElementById(id);

  const TOPICS = {
    general: '일반·특정 상대',
    relationship: '연애·상대방',
    reconciliation: '재회·관계 회복',
    contact: '연락·메시지',
    career: '직장·이직·커리어',
    exam: '시험·합격',
    money: '금전·재물',
    stock: '주식·투기적 투자',
    home: '집·부동산·가족 기반',
    health: '건강·회복',
    legal: '법률·소송·공적 판단'
  };

  const stateHorary = {
    mode: null,
    question: '',
    topic: 'general',
    result: null,
    aiText: ''
  };

  function safeJSON(key, fallback=null) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; }
    catch { return fallback; }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[char]));
  }

  function apiUrl() {
    const saved = String(localStorage.getItem(API_KEY) || '').trim().replace(/\/+$/, '');
    return saved || DEFAULT_API_URL;
  }

  function currentQuestion() {
    let q = '';
    try { q = state?.question || ''; } catch {}
    return String(q || '').trim();
  }

  function inferTopic(question) {
    const q = String(question || '');
    if (/재회|다시\s*만나|관계\s*회복|구남친|구여친/.test(q)) return 'reconciliation';
    if (/연락|카톡|메시지|답장|전화|DM|디엠/.test(q)) return 'contact';
    if (/연애|호감|썸|사귀|데이트|상대방/.test(q)) return 'relationship';
    if (/시험|합격|불합격|면접|성적|점수/.test(q)) return 'exam';
    if (/이직|퇴사|직장|회사|승진|커리어|업무/.test(q)) return 'career';
    if (/주식|코인|매수|매도|익절|손절|종목|투자/.test(q)) return 'stock';
    if (/돈|금전|재물|수입|지출|대출|재정/.test(q)) return 'money';
    if (/집|이사|부동산|토지|가족/.test(q)) return 'home';
    if (/건강|회복|질병|병원|치료|수술/.test(q)) return 'health';
    if (/법률|소송|재판|판결|고소|계약\s*분쟁/.test(q)) return 'legal';
    return 'general';
  }

  function seoulNowInput() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone:'Asia/Seoul',
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hour12:false
    }).formatToParts(new Date()).reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function defaultPlace() {
    const saved = String(localStorage.getItem(PLACE_KEY) || '').trim();
    if (saved) return saved;
    const natal = safeJSON('LUNEA_ASTRO_NATAL_V3', {});
    return String(
      natal?.birth?.place_resolved ||
      natal?.birth?.place_input ||
      $('birthPlace')?.value ||
      ''
    ).trim();
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        year:'numeric', month:'numeric', day:'numeric',
        hour:'2-digit', minute:'2-digit', hour12:false,
        timeZone:'Asia/Seoul'
      }).format(new Date(iso));
    } catch { return String(iso); }
  }

  function planetText(row) {
    if (!row) return '—';
    return `${row.name_ko || ''} ${row.sign || ''} ${row.degree ?? '—'}° · ${row.house || '—'}H · ${row.direction || ''} · ${row.dignity_ko || ''}`;
  }

  function addStyles() {
    if ($('luneaHoraryStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryStyle';
    style.textContent = `
      .lunea-horary-category{
        border-color:rgba(124,211,255,.30)!important;
        background:linear-gradient(145deg,rgba(82,153,196,.11),rgba(189,164,248,.09)),var(--panel)!important
      }
      .lunea-horary-category .cat-icon{
        color:#bfeaff!important;background:rgba(124,211,255,.10)!important;
        border-color:rgba(124,211,255,.26)!important
      }
      #astroHoraryOverlay{background:rgba(5,5,12,.93);backdrop-filter:blur(16px)}
      .horary-modal{max-width:448px}
      .horary-help{font-size:10px;line-height:1.55;color:var(--dim);margin:3px 0 10px}
      .horary-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .horary-now{
        margin-top:5px;border:1px solid rgba(124,211,255,.22);
        background:rgba(124,211,255,.07);color:#c9edff
      }
      .horary-status{margin:8px 0 2px;font-size:9.7px;line-height:1.5;color:var(--dim)}
      .horary-status.err{color:#ffc0ca}.horary-status.ok{color:#bfe7d2}
      .horary-result{display:none;margin-top:11px}.horary-result.show{display:block}
      .horary-summary{
        padding:12px;border-radius:14px;
        background:linear-gradient(145deg,rgba(124,211,255,.08),rgba(189,164,248,.10));
        border:1px solid rgba(124,211,255,.18)
      }
      .horary-summary small{display:block;color:#bfeaff;font-size:8.5px;letter-spacing:.8px}
      .horary-summary h4{margin:4px 0 5px;font-size:14px;color:#f4f0fb}
      .horary-summary p{margin:0;color:var(--dim);font-size:9.7px;line-height:1.5}
      .horary-card{
        margin-top:7px;padding:10px 11px;border-radius:12px;
        background:rgba(255,255,255,.035);border:1px solid rgba(189,164,248,.13)
      }
      .horary-card h5{margin:0 0 5px;font-size:11px;color:#eee8f8}
      .horary-card p{margin:3px 0;color:var(--dim);font-size:9.5px;line-height:1.5}
      .horary-warning{
        margin-top:6px;padding:7px 9px;border-radius:10px;
        background:rgba(255,141,161,.06);border-left:3px solid rgba(255,141,161,.55);
        color:#e7dbe6;font-size:9.3px;line-height:1.5
      }
      .horary-actions{display:none;gap:6px;flex-wrap:wrap;margin-top:9px}
      .horary-actions.show{display:flex}.horary-actions button{flex:1}
      .horary-ai{
        margin-top:8px;padding:12px;border-radius:13px;background:rgba(189,164,248,.07);
        border:1px solid rgba(189,164,248,.17);white-space:pre-wrap;
        font:400 12px 'Noto Serif KR',serif;line-height:1.75;display:none
      }
      .horary-ai.show{display:block}
      .horary-inline{
        margin:8px auto 12px;max-width:360px;padding:10px 11px;border-radius:14px;
        background:linear-gradient(145deg,rgba(124,211,255,.08),rgba(189,164,248,.08));
        border:1px solid rgba(124,211,255,.20);text-align:left
      }
      .horary-inline small{display:block;color:#bfeaff;font-size:8.5px;letter-spacing:.7px}
      .horary-inline b{display:block;margin:3px 0;color:#f4effb;font-size:11.5px}
      .horary-inline span{font-size:9.3px;color:var(--dim);line-height:1.45}
      @media(max-width:370px){.horary-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectCategory() {
    if ($('luneaHoraryCategory')) return;
    const categories = [...document.querySelectorAll('.category')];
    if (!categories.length) return;

    const category = document.createElement('div');
    category.id = 'luneaHoraryCategory';
    category.className = 'category lunea-horary-category';
    category.innerHTML = `
      <div class="category-header" role="button" tabindex="0" aria-expanded="false">
        <div class="cat-left"><div class="cat-icon">☿</div>
          <div class="cat-text"><h3>HORARY ASTROLOGY</h3><p>질문 시각 · 성사각 · 리셉션 · 달의 진행</p></div>
        </div><div class="toggle">+</div>
      </div>
      <div class="category-content">
        <div class="reading-item" id="horaryStandaloneItem" role="button" tabindex="0">
          <div><h4>질문시각 차트 계산</h4><p>출생차트가 아닌 질문을 이해한 순간의 하늘로 판단 보조.</p></div><div class="count">별도</div>
        </div>
      </div>
    `;
    categories[categories.length - 1].insertAdjacentElement('afterend', category);

    const header = category.querySelector('.category-header');
    const item = category.querySelector('#horaryStandaloneItem');
    const toggle = () => {
      document.querySelectorAll('.category').forEach(x => {
        if (x !== category) {
          x.classList.remove('active');
          x.querySelector('.category-header')?.setAttribute('aria-expanded', 'false');
        }
      });
      category.classList.toggle('active');
      header.setAttribute('aria-expanded', category.classList.contains('active') ? 'true' : 'false');
    };
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    item.addEventListener('click', () => openModal('standalone', ''));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal('standalone', '');
      }
    });
  }

  function injectModal() {
    if ($('astroHoraryOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'astroHoraryOverlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="modal horary-modal">
        <button class="close" id="astroHoraryClose">×</button>
        <div class="sub">LUNEA · TRADITIONAL HORARY</div>
        <h3 class="modal-h">☿ Horary(호라리·질문시각 점성술)</h3>
        <p class="horary-help">출생정보는 사용하지 않아. 질문을 처음 분명하게 이해한 시각과 그때 질문자가 있던 장소를 기준으로 Regiomontanus(레지오몬타누스) 하우스를 계산해.</p>
        <div class="field"><label>질문 원문</label>
          <textarea id="astroHoraryQuestion" placeholder="예: 그와 나는 올해 한 번은 대면해서 대화를 나눌 수 있을까요?"></textarea>
        </div>
        <div class="horary-grid">
          <div class="field"><label>질문을 이해한 시각 · 한국시간</label>
            <input id="astroHoraryMoment" type="datetime-local" step="60">
          </div>
          <div class="field"><label>그때 있던 장소</label>
            <input id="astroHoraryPlace" placeholder="예: 여수">
          </div>
        </div>
        <button class="mini horary-now" id="astroHoraryNow">지금 시각으로 다시 맞추기</button>
        <div class="field" style="margin-top:10px"><label>질문 주제 · 하우스 선택 기준</label>
          <select id="astroHoraryTopic"></select>
        </div>
        <p class="horary-help">같은 질문을 불안해서 반복 계산하지 마. 질문이 실제로 바뀌었거나 상황이 본질적으로 달라진 경우에만 새 차트를 쓰는 게 원칙이야.</p>
        <button class="primary full-btn" id="astroHoraryRun">☿ 호라리 차트 계산</button>
        <div class="horary-status" id="astroHoraryStatus"></div>
        <div class="horary-result" id="astroHoraryResult"></div>
        <div class="horary-actions" id="astroHoraryActions">
          <button class="mini" id="astroHoraryAI">🔮 호라리 AI 해석</button>
          <button class="mini" id="astroHorarySave">💾 기록</button>
        </div>
        <div class="horary-ai" id="astroHoraryAIText"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const topic = $('astroHoraryTopic');
    Object.entries(TOPICS).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      topic.appendChild(option);
    });

    $('astroHoraryClose').onclick = closeModal;
    overlay.addEventListener('pointerup', e => { if (e.target === overlay) closeModal(); });
    $('astroHoraryNow').onclick = () => {
      $('astroHoraryMoment').value = seoulNowInput();
      $('astroHoraryStatus').textContent = '질문을 처음 명확하게 이해한 순간이 지금이 맞는지 확인해줘.';
    };
    $('astroHoraryRun').onclick = runHorary;
    $('astroHoraryAI').onclick = runAI;
    $('astroHorarySave').onclick = saveStandalone;
  }

  function openModal(mode, question) {
    stateHorary.mode = mode;
    const q = String(question || '').trim();
    const changed = q && q !== stateHorary.question;
    if (changed) {
      stateHorary.result = null;
      stateHorary.aiText = '';
    }
    stateHorary.question = q;
    stateHorary.topic = inferTopic(q);

    $('astroHoraryQuestion').readOnly = mode === 'support';
    $('astroHoraryQuestion').value = q;
    if (!$('astroHoraryMoment').value || changed || mode === 'standalone') {
      $('astroHoraryMoment').value = seoulNowInput();
    }
    $('astroHoraryPlace').value = defaultPlace();
    $('astroHoraryTopic').value = stateHorary.topic;
    $('astroHoraryStatus').textContent = mode === 'support'
      ? '현재 RWS 질문을 그대로 사용해 별도의 호라리 차트를 계산해.'
      : '질문 원문·시각·장소를 확인한 뒤 계산해.';

    if (!stateHorary.result || changed) {
      $('astroHoraryResult').classList.remove('show');
      $('astroHoraryResult').innerHTML = '';
      $('astroHoraryActions').classList.remove('show');
      $('astroHoraryAIText').classList.remove('show');
      $('astroHoraryAIText').textContent = '';
    } else {
      renderResult();
    }
    $('astroHorarySave').style.display = mode === 'standalone' ? '' : 'none';
    $('astroHoraryOverlay').classList.add('show');
    $('astroHoraryOverlay').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    $('astroHoraryOverlay')?.classList.remove('show');
    $('astroHoraryOverlay')?.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  async function fetchWithTimeout(url, options, timeoutMs=120000) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try { controller.abort('horary-timeout'); } catch { controller.abort(); }
    }, timeoutMs);
    try {
      return await fetch(url, {...options, signal:controller.signal});
    } finally {
      clearTimeout(timer);
    }
  }

  async function runHorary() {
    const question = $('astroHoraryQuestion').value.trim();
    const moment = $('astroHoraryMoment').value;
    const place = $('astroHoraryPlace').value.trim();
    const topic = $('astroHoraryTopic').value;
    if (!question) {
      $('astroHoraryStatus').textContent = '질문 원문을 먼저 입력해줘.';
      $('astroHoraryStatus').className = 'horary-status err';
      $('astroHoraryQuestion').focus();
      return;
    }
    if (!moment) {
      $('astroHoraryStatus').textContent = '질문을 이해한 시각을 입력해줘.';
      $('astroHoraryStatus').className = 'horary-status err';
      return;
    }
    if (!place) {
      $('astroHoraryStatus').textContent = '질문 당시 있던 장소를 입력해줘.';
      $('astroHoraryStatus').className = 'horary-status err';
      $('astroHoraryPlace').focus();
      return;
    }

    const button = $('astroHoraryRun');
    button.disabled = true;
    button.textContent = '☿ 계산 중…';
    $('astroHoraryStatus').className = 'horary-status';
    $('astroHoraryStatus').textContent = '질문 시각의 행성·레지오몬타누스 하우스·적용각을 계산하고 있어…';
    localStorage.setItem(PLACE_KEY, place);

    try {
      if (window.LUNEA_ASTRO_STABILITY?.ensureReady) {
        try { await window.LUNEA_ASTRO_STABILITY.ensureReady(false); } catch {}
      }
      const response = await fetchWithTimeout(`${apiUrl()}/v1/horary`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          question_text:question,
          question_iso:moment,
          topic,
          timezone:'Asia/Seoul',
          place
        })
      });
      let data = null;
      try { data = await response.json(); } catch {}
      if (!response.ok) throw new Error(data?.detail || `${response.status} ${response.statusText}`);
      if (data?.schema !== 'LUNEA_HORARY_V1') throw new Error('Horary 응답 형식이 예상과 달라.');

      stateHorary.question = question;
      stateHorary.topic = topic;
      stateHorary.result = data;
      stateHorary.aiText = '';
      renderResult();
      if (stateHorary.mode === 'support') renderInline();
      $('astroHoraryStatus').className = 'horary-status ok';
      $('astroHoraryStatus').textContent = `계산 완료 · ${data.moment?.place_resolved || place} · Regiomontanus(레지오몬타누스)`;
    } catch (error) {
      $('astroHoraryStatus').className = 'horary-status err';
      $('astroHoraryStatus').textContent = '계산 실패: ' + (error?.message || error);
      $('astroHoraryResult').classList.remove('show');
      $('astroHoraryActions').classList.remove('show');
    } finally {
      button.disabled = false;
      button.textContent = '☿ 호라리 차트 계산';
    }
  }

  function conclusionText(data) {
    const j = data?.judgment_support || {};
    const perfection = j.perfection || {};
    const reception = j.reception || {};
    if (perfection.perfects && reception.has_reception) return '성사각 후보와 리셉션이 함께 확인됨';
    if (perfection.perfects) return '주인행성 사이 성사각 후보가 확인됨';
    if (reception.has_reception) return '직접 성사각은 약하지만 리셉션 보조가 있음';
    return '직접 성사를 지지하는 핵심 연결이 뚜렷하지 않음';
  }

  function receptionText(reception) {
    if (!reception) return '—';
    if (reception.same_significator) return '양쪽 주인행성이 같아 상호 리셉션을 별도 판정하지 않음';
    if (reception.mutual_reception) return '상호 리셉션 있음';
    if (reception.has_reception) return '한쪽 또는 부분 리셉션 있음';
    return '주요 도머사일·고양 리셉션 없음';
  }

  function renderResult() {
    const data = stateHorary.result;
    if (!data) return;
    const sig = data.significators || {};
    const j = data.judgment_support || {};
    const connection = j.primary_connection;
    const perfection = j.perfection || {};
    const moon = j.moon_course || {};
    const event = sig.event;

    let html = `
      <div class="horary-summary">
        <small>HORARY · ${esc(data.question?.topic_label_ko)}</small>
        <h4>${esc(conclusionText(data))}</h4>
        <p>${esc(fmtDate(data.moment?.local_iso))} · ${esc(data.moment?.place_resolved)}<br>
        ASC(상승점) ${esc(data.angles?.ASC?.sign)} ${data.angles?.ASC?.degree}° · MC(중천점) ${esc(data.angles?.MC?.sign)} ${data.angles?.MC?.degree}°</p>
      </div>
      <div class="horary-card">
        <h5>주요 시그니피케이터(상징 행성)</h5>
        <p>질문자 · 1H 주인 ${esc(sig.querent?.ruler)}(${esc(sig.querent?.ruler_ko)}): ${esc(planetText(sig.querent?.planet))}</p>
        <p>대상 · ${sig.quesited?.house}H 주인 ${esc(sig.quesited?.ruler)}(${esc(sig.quesited?.ruler_ko)}): ${esc(planetText(sig.quesited?.planet))}</p>
        ${event ? `<p>사건 보조 · ${event.house}H 주인 ${esc(event.ruler)}(${esc(event.ruler_ko)}): ${esc(planetText(event.planet))}</p>` : ''}
        <p>Moon(달) · 공동 시그니피케이터: ${esc(planetText(sig.moon))}</p>
      </div>
      <div class="horary-card">
        <h5>성사각 · 리셉션</h5>
        <p>주 연결: ${connection
          ? `${esc(connection.aspect_ko)} · 오브 ${connection.orb}° · ${esc(connection.phase_ko)}`
          : '양쪽 주인행성이 같아 별도 각 판정 없음'}</p>
        <p>성사 후보: ${esc(perfection.reason_ko || '확인되지 않음')}${perfection.exact_local ? ` · ${esc(fmtDate(perfection.exact_local))}` : ''}</p>
        <p>Reception(리셉션·수용 관계): ${esc(receptionText(j.reception))}</p>
      </div>
      <div class="horary-card">
        <h5>Moon(달)의 다음 진행</h5>
        <p>${moon.void_of_course
          ? 'Void of Course(보이드 오브 코스·공전달): 별자리 이탈 전 완성 주요각 없음'
          : `다음 적용각 ${moon.next_aspects?.length || 0}개 확인 · 첫 각 ${esc(moon.next_aspects?.[0]?.body_ko || '')} ${esc(moon.next_aspects?.[0]?.aspect_ko || '')}`}</p>
        <p>현재 별자리 이탈까지 약 ${moon.hours_to_sign_exit ?? '—'}시간</p>
      </div>
    `;

    if (j.potential_prohibition?.length) {
      html += `<div class="horary-card"><h5>잠재 개입각</h5>${j.potential_prohibition.slice(0,3).map(row =>
        `<p>${esc(row.intervening_ko)} → ${esc(row.target_ko)} ${esc(row.aspect_ko)} · 약 ${row.estimated_days}일 뒤 후보<br>※ 고전적 금지·프로히비션 확정이 아닌 검토 신호</p>`
      ).join('')}</div>`;
    }

    (j.warnings || []).forEach(warning => {
      html += `<div class="horary-warning">${esc(warning.text_ko)}</div>`;
    });
    html += `<p class="horary-help" style="margin-top:9px">※ 이 화면은 전통 호라리 판정에 필요한 계산 근거를 정리해. 현실 사건을 자동 확정하거나 질문을 반복할수록 정확해지는 기능은 아니야.</p>`;

    $('astroHoraryResult').innerHTML = html;
    $('astroHoraryResult').classList.add('show');
    $('astroHoraryActions').classList.add('show');
    $('astroHoraryAIText').classList.toggle('show', !!stateHorary.aiText);
    $('astroHoraryAIText').textContent = stateHorary.aiText;
  }

  function horaryPromptBlock(data) {
    if (!data) return '';
    const sig = data.significators || {};
    const j = data.judgment_support || {};
    const p = j.perfection || {};
    const c = j.primary_connection;
    const moon = j.moon_course || {};
    const warnings = (j.warnings || []).map(w => '- ' + w.text_ko).join('\n') || '- 없음';
    const moonNext = (moon.next_aspects || []).slice(0,4).map(x =>
      `- ${x.time_local}: Moon(달) ${x.body}(${x.body_ko}) ${x.aspect_ko}, orb ${x.orb}°`
    ).join('\n') || '- 별자리 이탈 전 완성 주요각 없음';
    const interventions = (j.potential_prohibition || []).slice(0,4).map(x =>
      `- ${x.intervening}(${x.intervening_ko}) → ${x.target}(${x.target_ko}) ${x.aspect_ko}, 약 ${x.estimated_days}일 후보 · 잠재 개입각일 뿐 확정 금지 아님`
    ).join('\n') || '- 없음';

    return `[HORARY V1 · 질문시각 점성술 계산 결과]
[질문 원문]
"${data.question?.text}"

- 질문 시각: ${data.moment?.local_iso}
- 질문 장소: ${data.moment?.place_resolved} (${data.moment?.latitude}, ${data.moment?.longitude})
- 황도/하우스: Tropical(열대황도) / Regiomontanus(레지오몬타누스)
- 질문 주제: ${data.question?.topic_label_ko}
- 하우스 선택 근거: ${data.question?.topic_note_ko}
- ASC(상승점): ${data.angles?.ASC?.sign} ${data.angles?.ASC?.degree}°
- MC(중천점): ${data.angles?.MC?.sign} ${data.angles?.MC?.degree}°
- 질문자 시그니피케이터: ${sig.querent?.ruler}(${sig.querent?.ruler_ko}) · ${planetText(sig.querent?.planet)}
- 대상 시그니피케이터: ${sig.quesited?.ruler}(${sig.quesited?.ruler_ko}) · ${planetText(sig.quesited?.planet)}
${sig.event ? `- 사건 보조 시그니피케이터: ${sig.event.ruler}(${sig.event.ruler_ko}) · ${planetText(sig.event.planet)}` : ''}
- Moon(달): ${planetText(sig.moon)}
- 주 연결각: ${c ? `${c.aspect_ko}, orb ${c.orb}°, ${c.phase_ko}` : '같은 주인행성 또는 별도 연결각 없음'}
- Perfection(퍼펙션·성사각): ${p.reason_ko || '확인되지 않음'}${p.exact_local ? ` / 후보 ${p.exact_local}` : ''}
- Reception(리셉션·수용 관계): ${receptionText(j.reception)}
- Void of Course(보이드 오브 코스·공전달): ${moon.void_of_course ? '해당' : '아님'}

[Moon(달)의 다음 적용각]
${moonNext}

[잠재 개입각]
${interventions}

[판정 전 고려사항]
${warnings}

[호라리 해석 규칙]
1. 질문 원문을 바꾸거나 더 넓은 질문으로 확장하지 않는다.
2. Natal(네이탈·출생차트), Transit(트랜짓), 사주, 태국점성술을 호라리 계산값처럼 섞지 않는다.
3. 질문자·대상 주인행성, Moon(달), 적용/분리, 성사각, 리셉션, 존귀·손상, 잠재 개입각 순으로 판정한다.
4. 잠재 개입각은 자동 계산 근거만으로 prohibition(프로히비션·금지)이라고 확정하지 않는다.
5. ASC 초·말도수, 7하우스 Saturn(토성), 공전달 등 고려사항이 있어도 차트를 기계적으로 폐기하지 말고 판정 신뢰도를 낮추는 근거로 설명한다.
6. 첫 문단에서 질문에 대한 결론을 먼저 말한다. 성사 근거와 불성사·지연 근거를 분리한다.
7. 정확 시각 후보는 점성술적 성사각 시각이지 현실 사건의 보장 시각이 아니다.
8. 희망고문과 단정 모두 금지한다. 계산 근거가 엇갈리면 애매하다고 명확히 말한다.
9. 위 계산값을 수정하거나 새로운 행성 위치·하우스·각·날짜를 지어내지 않는다.`;
  }

  async function runAI() {
    if (!stateHorary.result) return alert('먼저 호라리 차트를 계산해줘.');
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) return alert('LUNEA API 설정을 먼저 해줘.');
    const button = $('astroHoraryAI');
    button.disabled = true;
    button.textContent = '🔮 해석 중…';
    $('astroHoraryAIText').classList.add('show');
    $('astroHoraryAIText').textContent = '계산 근거를 질문 원문에 맞춰 판정하는 중…';
    const prompt = `당신은 Regiomontanus(레지오몬타누스) 하우스와 전통 7행성 체계에 익숙한 숙련된 Horary(호라리·질문시각 점성술) 리더다.

${horaryPromptBlock(stateHorary.result)}

[출력]
- 첫 문단: 결론
- 다음: 성사 근거 / 제한·지연 근거
- 다음: Moon(달)의 전개와 시기 후보
- 마지막: 신뢰도와 반드시 남는 불확실성
- 길게 돌려 말하지 말고 질문에 직접 답한다.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts:[{text:prompt}]}],
          generationConfig:{temperature:.45, topP:.88}
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      stateHorary.aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '응답이 비어 있어.';
      $('astroHoraryAIText').textContent = stateHorary.aiText;
    } catch (error) {
      stateHorary.aiText = '';
      $('astroHoraryAIText').textContent = '[API 오류] ' + (error?.message || error);
    } finally {
      button.disabled = false;
      button.textContent = '🔮 호라리 AI 해석';
    }
  }

  function summaryText(data) {
    const j = data?.judgment_support || {};
    const p = j.perfection || {};
    const c = j.primary_connection;
    return `${conclusionText(data)} · ${c ? `${c.aspect_ko} ${c.phase_ko} orb ${c.orb}°` : '주 연결각 별도 판정 없음'}${p.exact_local ? ` · 후보 ${fmtDate(p.exact_local)}` : ''}`;
  }

  function renderInline() {
    const cards = $('cards');
    if (!cards || !stateHorary.result) return;
    let inline = $('luneaHoraryInline');
    if (!inline) {
      inline = document.createElement('div');
      inline.id = 'luneaHoraryInline';
      inline.className = 'horary-inline';
      const anchor =
        $('luneaThaiTaksaInline') ||
        $('luneaReturnInline') ||
        $('luneaAstroTransitInline') ||
        $('luneaTimingInline');
      if (anchor) anchor.insertAdjacentElement('afterend', inline);
      else cards.insertAdjacentElement('afterend', inline);
      inline.onclick = () => openModal('support', stateHorary.question);
    }
    inline.innerHTML = `<small>TRADITIONAL HORARY · REGIOMONTANUS</small>
      <b>${esc(summaryText(stateHorary.result))}</b>
      <span>출생차트와 분리된 질문 시각 계산 · RWS 결론을 덮어쓰지 않는 보조 근거</span>`;
    const button = $('astroHoraryBtn');
    if (button) button.textContent = '☿ Horary 완료';
  }

  function clearSupport() {
    stateHorary.mode = null;
    stateHorary.question = '';
    stateHorary.topic = 'general';
    stateHorary.result = null;
    stateHorary.aiText = '';
    $('luneaHoraryInline')?.remove();
    const button = $('astroHoraryBtn');
    if (button) button.textContent = '☿ Horary';
  }

  function injectSupportButton() {
    if ($('astroHoraryBtn')) return;
    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (!bar) return;
    const button = document.createElement('button');
    button.className = 'mini';
    button.id = 'astroHoraryBtn';
    button.textContent = '☿ Horary';
    const save = $('saveReading');
    if (save) bar.insertBefore(button, save);
    else bar.appendChild(button);
    button.onclick = () => {
      const q = currentQuestion();
      if (!q) return alert('현재 RWS 질문을 찾지 못했어.');
      openModal('support', q);
    };
  }

  function archiveObject() {
    const data = stateHorary.result;
    if (!data) return null;
    return {
      schema:data.schema,
      question:data.question,
      moment:data.moment,
      house_system:data.house_system,
      angles:data.angles,
      significators:data.significators,
      judgment_support:{
        primary_connection:data.judgment_support?.primary_connection,
        perfection:data.judgment_support?.perfection,
        reception:data.judgment_support?.reception,
        moon_course:data.judgment_support?.moon_course,
        potential_prohibition:data.judgment_support?.potential_prohibition,
        warnings:data.judgment_support?.warnings
      }
    };
  }

  function saveStandalone() {
    if (!stateHorary.result) return alert('먼저 호라리 차트를 계산해줘.');
    if (stateHorary.mode !== 'standalone') return;
    try {
      const archive = getArchive();
      archive.unshift({
        id: typeof secureId === 'function' ? secureId() : String(Date.now()),
        createdAt:Date.now(),
        date:new Date().toLocaleString('ko-KR'),
        title:'HORARY · 질문시각 점성술',
        q:stateHorary.question,
        rationale:'질문을 처음 명확하게 이해한 시각과 장소의 Regiomontanus(레지오몬타누스) 차트',
        cards:[],
        horary:archiveObject(),
        ai:stateHorary.aiText || ''
      });
      setArchive(archive);
      alert('✨ 호라리 리딩을 기록함에 저장했어.');
    } catch (error) {
      console.error('[Horary] standalone save failed', error);
      alert('호라리 기록 저장 중 오류가 났어.');
    }
  }

  function installStartReset() {
    try {
      if (typeof startSpread !== 'function' || window.__LUNEA_HORARY_START_WRAPPED__) return;
      window.__LUNEA_HORARY_START_WRAPPED__ = true;
      const old = startSpread;
      startSpread = function(...args) {
        clearSupport();
        return old.apply(this, args);
      };
    } catch (error) {
      console.warn('[Horary] start reset skipped', error);
    }
  }

  function installPromptIntegration() {
    try {
      if (typeof promptString !== 'function' || window.__LUNEA_HORARY_PROMPT_WRAPPED__) return;
      window.__LUNEA_HORARY_PROMPT_WRAPPED__ = true;
      const old = promptString;
      promptString = function() {
        let prompt = old.apply(this, arguments);
        const q = currentQuestion();
        if (!stateHorary.result || stateHorary.mode !== 'support' || stateHorary.question !== q) return prompt;
        prompt += '\n\n' + horaryPromptBlock(stateHorary.result);
        prompt += `\n\n[타로·호라리 통합 경계]
1. RWS 타로와 Horary(호라리)는 서로 다른 체계다.
2. 각 체계의 결론을 먼저 독립적으로 제시한 뒤, 같은 방향이면 교차 보조 신호로만 말한다.
3. 서로 다르면 차이를 숨기지 말고 어떤 근거가 충돌하는지 설명한다.
4. 호라리가 타로 카드 포지션을 덮어쓰거나, 타로가 호라리 행성 계산을 바꾸게 하지 않는다.`;
        return prompt;
      };
    } catch (error) {
      console.warn('[Horary] prompt integration skipped', error);
    }
  }

  function installArchiveIntegration() {
    try {
      const save = $('saveReading');
      if (save && !window.__LUNEA_HORARY_SAVE_WRAPPED__) {
        window.__LUNEA_HORARY_SAVE_WRAPPED__ = true;
        const old = save.onclick;
        save.onclick = function(event) {
          if (old) old.call(this, event);
          const q = currentQuestion();
          if (!stateHorary.result || stateHorary.mode !== 'support' || stateHorary.question !== q) return;
          try {
            const archive = getArchive();
            if (archive.length) {
              archive[0].horary = archiveObject();
              setArchive(archive);
            }
          } catch (error) {
            console.warn('[Horary] archive enrich failed', error);
          }
        };
      }
    } catch {}

    try {
      if (typeof archiveText === 'function' && !window.__LUNEA_HORARY_ARCHIVE_TEXT_WRAPPED__) {
        window.__LUNEA_HORARY_ARCHIVE_TEXT_WRAPPED__ = true;
        const oldArchiveText = archiveText;
        archiveText = function(item) {
          let text = oldArchiveText(item);
          if (item?.horary) {
            const data = item.horary;
            text += `\n\n[Horary · 질문시각 점성술]
${data.moment?.local_iso || ''} · ${data.moment?.place_resolved || ''}
${summaryText(data)}`;
          }
          return text;
        };
      }
    } catch {}
  }

  function boot() {
    addStyles();
    injectCategory();
    injectModal();
    injectSupportButton();
    installStartReset();
    installPromptIntegration();
    installArchiveIntegration();
    console.info('✦ LUNEA HORARY V1 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
