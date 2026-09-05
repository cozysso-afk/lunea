'use strict';

/*
  LUNEA HORARY TRADITIONAL CORE V40
  =================================
  Frontend authority layer for backend Horary Engine V6.

  - Separates nearest geometric aspect from a valid traditional aspect.
  - Never presents an out-of-orb aspect as active direct perfection.
  - Displays direct / indirect / derived-event / reception evidence by tier.
  - Shows Moon last separating, next applying, VOC policy and sign ingress.
  - Keeps Early/Late ASC as considerations, never chart-invalid switches.
  - Separates Traditional Core from Modern Supplemental bodies.
  - Adds local/timezone/UTC and Regiomontanus cusp debug evidence.
  - Replaces the legacy V3.1 Gemini addon with strict V6 rules.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_TRADITIONAL_CORE_V40__) return;
  W.__LUNEA_HORARY_TRADITIONAL_CORE_V40__ = true;

  const RELEASE = '40.0';
  const BOX_ID = 'luneaHoraryTraditionalCoreV40';
  const MODERN_ID = 'luneaHoraryModernSupplementalV40';
  const DEBUG_ID = 'luneaHoraryDebugV40';
  const STYLE_ID = 'luneaHoraryTraditionalCoreV40Style';
  const NON_OUTCOME = new Set(['location', 'descriptive', 'comparison']);
  let latestHorary = null;
  let queued = false;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function clean(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function getCore(data = latestHorary) {
    return data?.judgment_support?.traditional_core_v6 || null;
  }

  function getModern(data = latestHorary) {
    return data?.judgment_support?.modern_supplemental_v6 || null;
  }

  function questionMode(data = latestHorary) {
    const question = data?.question?.text || $('astroHoraryQuestion')?.value || '';
    try {
      const row = W.LUNEA_HORARY_HARDENING_V38?.effectiveMode?.(question);
      if (row?.key) return row.key;
    } catch {}
    try {
      const row = W.LUNEA_HORARY_QUESTION_MODES_V37?.classifyQuestion?.(question);
      if (row?.key) return row.key;
    } catch {}
    return 'outcome';
  }

  function addStyle() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #astroHoraryResult[data-v40="1"] #luneaHoraryBalanceEvidenceV195{display:none!important}
      #astroHoraryResult[data-v40="1"] .horary-card[data-v40-legacy-hidden="1"]{display:none!important}
      #${BOX_ID}{margin-top:8px;padding:12px;border-radius:14px;border:1px solid rgba(124,211,255,.25);background:linear-gradient(145deg,rgba(70,154,190,.07),rgba(170,145,222,.075))}
      #${BOX_ID} .v40-kicker{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;color:#c8eafe;font-size:8.6px;font-weight:850;letter-spacing:.9px}
      #${BOX_ID} .v40-grade{white-space:nowrap;color:#b7b1c8;font-size:8.5px;letter-spacing:0}
      #${BOX_ID} .v40-stage{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}
      #${BOX_ID} .v40-cell{padding:8px 9px;border-radius:10px;background:rgba(4,7,16,.28);border:1px solid rgba(205,220,255,.08);min-width:0}
      #${BOX_ID} .v40-cell small{display:block;color:#8e8aa1;font-size:7.8px;letter-spacing:.55px;margin-bottom:3px}
      #${BOX_ID} .v40-cell b{display:block;color:#f1edf8;font-size:10.2px;line-height:1.42}
      #${BOX_ID} .v40-section{margin-top:9px;padding-top:8px;border-top:1px solid rgba(210,220,255,.08)}
      #${BOX_ID} .v40-section h6{margin:0 0 5px;color:#efeaf7;font-size:10.5px}
      #${BOX_ID} .v40-section p{margin:4px 0;color:#aaa7b8;font-size:9.4px;line-height:1.52}
      #${BOX_ID} .v40-geometric{color:#8f8b9e!important}
      #${BOX_ID} .v40-valid{color:#bfe8d5!important}
      #${BOX_ID} .v40-invalid{color:#e0bfd0!important}
      #${BOX_ID} .v40-overall{margin-top:9px;padding:10px 11px;border-radius:11px;background:rgba(124,211,255,.055);border-left:3px solid rgba(124,211,255,.45);color:#e7e1ef;font-size:9.8px;line-height:1.55}
      #${MODERN_ID},#${DEBUG_ID}{margin-top:8px;border:1px solid rgba(190,190,220,.12);border-radius:12px;background:rgba(7,8,16,.22);padding:8px 9px}
      #${MODERN_ID} summary,#${DEBUG_ID} summary{cursor:pointer;color:#9995a8;font-size:9px}
      #${MODERN_ID} p,#${DEBUG_ID} p{margin:5px 0;color:#8e8a9d;font-size:8.8px;line-height:1.5;word-break:break-word}
      #${DEBUG_ID} code{font-size:8px;color:#b7b1c8;white-space:normal;word-break:break-all}
      #${BOX_ID}.v40-compact .v40-stage{display:none}
      #${BOX_ID}.v40-compact .v40-section{display:none}
      @media(max-width:520px){#${BOX_ID} .v40-stage{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function fmtIso(iso, timezone) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone: timezone || undefined,
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }).format(new Date(iso));
    } catch {
      return String(iso);
    }
  }

  function aspectPhrase(state) {
    if (!state) return {geometric:'—', valid:'유효 주요각 없음'};
    const g = state.closest_geometric_aspect || {};
    const geometric = `${g.aspect_ko || state.aspect_ko || '—'} · orb ${g.orb ?? state.orb ?? '—'}°`;
    const valid = state.traditional_valid_aspect
      ? `${state.traditional_valid_aspect_ko || state.aspect_ko} · ${state.traditional_state_ko || state.phase_ko || ''} · 허용 ${state.max_orb ?? '—'}°`
      : `전통 유효 오브 밖 → 성사각 미채택 · ${state.traditional_state_ko || state.phase_ko || ''}`;
    return {geometric, valid};
  }

  function receptionPhrase(row) {
    if (!row) return '없음';
    if (row.same_significator) return '같은 주인행성 공유';
    if (row.label_ko) return `${row.label_ko} · 성사각 대체 불가`;
    if (row.mutual_reception) return '상호 주요 리셉션 · 성사각 대체 불가';
    if (row.has_reception) return '한쪽 주요 리셉션 · 성사각 대체 불가';
    if (row.has_minor_reception) return '약식 리셉션 · 성사각 대체 불가';
    return '리셉션 없음';
  }

  function eventAxisPhrase(row) {
    if (!row) return '해당 없음';
    if (row.shared_ruler) return `${row.a} = ${row.b} · 같은 주인행성`;
    const p = row.perfection || {};
    const state = row.aspect_state || p.aspect || {};
    const parts = aspectPhrase(state);
    return `${row.a} ↔ ${row.b} · ${p.perfects ? '보조 성사 있음' : '보조 성사 없음'} · ${parts.valid}`;
  }

  function moonEventPhrase(row, direction) {
    if (!row) return direction === 'last' ? '이전 별자리 진입 후 확인된 주요 분리각 없음' : '별자리 이탈 전 다음 주요 적용각 없음';
    const when = row.time_local || row.exact_local || row.exact_utc || '';
    return `Moon(달) ↔ ${row.body_ko || row.body || '행성'} ${row.aspect_ko || row.aspect || ''}${when ? ` · ${when}` : ''}`;
  }

  function hideLegacyCards(result) {
    [...result.querySelectorAll('.horary-card')].forEach(card => {
      const title = clean(card.querySelector('h5')?.textContent);
      if (title === '성사각 · 리셉션' || title === 'Moon(달)의 다음 진행' || title === '잠재 개입각') card.dataset.v40LegacyHidden = '1';
    });
  }

  function renderModern(data, anchor) {
    const modern = getModern(data);
    let box = $(MODERN_ID);
    if (!modern) {
      box?.remove();
      return;
    }
    if (!box) {
      box = document.createElement('details');
      box.id = MODERN_ID;
      anchor.insertAdjacentElement('afterend', box);
    }
    const planets = modern.planets || {};
    const rows = Object.entries(planets).map(([name, row]) => {
      if (row?.error) return `<p>${esc(name)} · 계산 참고 생략</p>`;
      return `<p>${esc(name)}(${esc(row?.name_ko || '')}) · ${esc(row?.sign || '')} ${row?.degree ?? '—'}° · ${row?.house ?? '—'}H · ${esc(row?.direction || '')}</p>`;
    }).join('');
    box.innerHTML = `<summary>Modern Supplemental(현대 보조정보) · 전통 성사/VOC 계산에서 제외</summary>${rows}<p>${esc(modern.note_ko || '')}</p>`;
  }

  function renderDebug(data, anchor) {
    const core = getCore(data);
    if (!core) return;
    let box = $(DEBUG_ID);
    if (!box) {
      box = document.createElement('details');
      box.id = DEBUG_ID;
      anchor.insertAdjacentElement('afterend', box);
    }
    const t = core.time_debug || {};
    const cusps = (data.cusps || []).map((x, i) => `${i + 1}H ${Number(x).toFixed(6)}°`).join(' · ');
    const policy = data.meta?.aspect_orb_policy || {};
    box.innerHTML = `<summary>계산 검증 · Local / UTC / Regiomontanus</summary>
      <p>Local: <code>${esc(t.local_iso || data.moment?.local_iso || '—')}</code><br>Timezone: <code>${esc(t.timezone || data.moment?.timezone || '—')}</code><br>UTC: <code>${esc(t.utc_iso || data.moment?.utc_iso || '—')}</code></p>
      <p>좌표: <code>${esc(t.latitude ?? data.moment?.latitude ?? '—')}, ${esc(t.longitude ?? data.moment?.longitude ?? '—')}</code></p>
      <p>ASC ${esc(data.angles?.ASC?.sign || '')} ${data.angles?.ASC?.degree ?? '—'}° · MC ${esc(data.angles?.MC?.sign || '')} ${data.angles?.MC?.degree ?? '—'}°</p>
      <p>12 cusps: <code>${esc(cusps || '—')}</code></p>
      <p>Aspect orb: <code>${esc(policy.method || 'planetary_moiety_sum')}</code> · Traditional planetary moiety orb 사용</p>`;
  }

  function renderCore() {
    const data = latestHorary;
    const core = getCore(data);
    const result = $('astroHoraryResult');
    const summary = result?.querySelector('.horary-summary');
    if (!data || !core || !result?.classList.contains('show') || !summary) return;

    addStyle();
    result.dataset.v40 = '1';
    hideLegacyCards(result);

    const mode = questionMode(data);
    const nonOutcome = NON_OUTCOME.has(mode);
    const direct = core.direct_axis || {};
    const p = direct.perfection || data.judgment_support?.perfection || {};
    const state = direct.aspect_state || p.aspect || data.judgment_support?.primary_connection || {};
    const aspect = aspectPhrase(state);
    const moon = core.moon || data.judgment_support?.moon_course || {};
    const staged = core.staged_judgment || {};
    const eventAxes = core.derived_event_axes || {};
    const indirect = core.indirect_perfection || {};
    const interventions = core.interventions || {};
    const considerations = core.considerations || {};
    const tz = core.time_debug?.timezone || data.moment?.timezone;

    const heading = summary.querySelector('h4');
    if (heading && !nonOutcome && staged.overall_ko) heading.textContent = staged.overall_ko;

    let box = $(BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = BOX_ID;
      summary.insertAdjacentElement('afterend', box);
    }
    box.classList.toggle('v40-compact', nonOutcome);

    if (nonOutcome) {
      box.innerHTML = `<div class="v40-kicker"><span>TRADITIONAL CORE · STRICT V6</span><span class="v40-grade">${esc(mode)}</span></div><div class="v40-overall">이 질문은 ${esc(mode)}형이라 성사/불성사 계층을 메인 결론으로 쓰지 않아. 계산 엔진에는 ‘유효 오브 밖 각 ≠ 성사각’ 규칙과 전통 7행성 VOC 정책이 그대로 적용돼.</div>`;
      renderModern(data, box);
      renderDebug(data, $(MODERN_ID) || box);
      return;
    }

    const translations = indirect.translation_of_light || [];
    const collections = indirect.collection_of_light || [];
    const obs = interventions.prohibition_or_frustration || [];
    const ref = interventions.refranation;
    const warningRows = considerations.warnings || [];
    const derivedPolicy = core.derived_house_policy;

    box.innerHTML = `
      <div class="v40-kicker"><span>TRADITIONAL CORE · STRICT V6</span><span class="v40-grade">${esc(core.evidence_grade_ko || core.evidence_grade || '—')}</span></div>
      <div class="v40-stage">
        <div class="v40-cell"><small>직접 성사</small><b>${esc(staged.direct_perfection || (p.perfects ? '있음' : '없음'))}</b></div>
        <div class="v40-cell"><small>보조 성사</small><b>${esc(staged.secondary_perfection || '없음')}</b></div>
        <div class="v40-cell"><small>Moon support</small><b>${esc(staged.moon_support || (moon.void_of_course ? '없음 · VOC' : '있음'))}</b></div>
        <div class="v40-cell"><small>Reception</small><b>${esc(staged.reception || receptionPhrase(direct.reception))}</b></div>
        <div class="v40-cell"><small>Intervention</small><b>${esc(staged.intervention || '없음')}</b></div>
        <div class="v40-cell"><small>Chart validity</small><b>${core.chart_invalid ? '무효' : '유효 · Early/Late ASC는 경고만'}</b></div>
      </div>

      <div class="v40-section">
        <h6>1. 주 시그니피케이터 직접 연결</h6>
        <p class="v40-geometric">가장 가까운 기하학적 각: ${esc(aspect.geometric)}</p>
        <p class="${state.traditional_valid_aspect ? 'v40-valid' : 'v40-invalid'}">전통 유효각: ${esc(aspect.valid)}</p>
        <p>Perfection(퍼펙션): ${esc(p.reason_ko || '직접 성사각 없음')}${p.exact_local ? ` · ${esc(fmtIso(p.exact_local, tz))}` : ''}</p>
        <p>Applying 판정: ${esc(state.motion_method || '—')} · 과거/현재/미래 오차 ${state.error_past_deg ?? '—'}° / ${state.error_now_deg ?? state.orb ?? '—'}° / ${state.error_future_deg ?? '—'}°</p>
      </div>

      <div class="v40-section">
        <h6>2. 파생 사건축 · 직접축과 별도</h6>
        ${derivedPolicy ? `<p>${esc(derivedPolicy.note_ko || '')}</p>` : ''}
        <p>대상 ↔ 사건: ${esc(eventAxisPhrase(eventAxes.quesited_to_event))}</p>
        <p>사건 ↔ 질문자: ${esc(eventAxisPhrase(eventAxes.event_to_querent))}</p>
      </div>

      <div class="v40-section">
        <h6>3. Moon(달) 진행 · 전통 7행성 기준 VOC</h6>
        <p>마지막 separating 주요각: ${esc(moonEventPhrase(moon.last_major_separating_aspect, 'last'))}</p>
        <p>다음 applying 주요각: ${esc(moonEventPhrase(moon.next_major_applying_aspect, 'next'))}</p>
        <p>${moon.void_of_course ? 'VOC: 해당 · 별자리 이탈 전 주요 적용각 없음' : 'VOC: 아님'} · sign ingress까지 ${moon.hours_to_sign_exit ?? '—'}시간${moon.sign_exit_local ? ` · ${esc(fmtIso(moon.sign_exit_local, tz))}` : ''}</p>
        <p>${esc(moon.policy_ko || '전통 7행성 + Ptolemaic 5각만 사용')}</p>
      </div>

      <div class="v40-section">
        <h6>4. Reception / 간접 성사 / 방해</h6>
        <p>Reception: ${esc(receptionPhrase(direct.reception))}</p>
        <p>Translation of Light: ${translations.length ? `${translations.length}건 확인` : '없음'}</p>
        <p>Collection of Light: ${collections.length ? `${collections.length}건 확인` : '없음'}</p>
        <p>Prohibition / Frustration: ${obs.length ? `${obs.length}건 확인` : '없음'} · Refranation: ${ref ? '확인' : '없음'}</p>
      </div>

      <div class="v40-section">
        <h6>5. Considerations(고려사항)</h6>
        ${warningRows.length ? warningRows.map(x => `<p>· ${esc(x.text_ko || '')}</p>`).join('') : '<p>별도 경고 없음</p>'}
      </div>

      <div class="v40-overall">${esc(staged.overall_ko || '직접 성사와 보조 신호를 분리해 판단합니다.')}</div>`;

    renderModern(data, box);
    renderDebug(data, $(MODERN_ID) || box);
  }

  function pairPrompt(label, row) {
    if (!row) return `- ${label}: 해당 없음`;
    const p = row.perfection || {};
    const state = row.aspect_state || p.aspect || {};
    const g = state.closest_geometric_aspect || {};
    return `- ${label}: ${row.a || '?'} ↔ ${row.b || '?'} · geometric=${g.aspect_ko || state.aspect_ko || 'none'} orb=${g.orb ?? state.orb ?? '—'}° · valid=${state.traditional_valid_aspect_ko || 'none'} · state=${state.traditional_state || state.phase || '—'} · perfection=${p.perfects ? 'YES' : 'NO'} (${p.reason || '—'})`;
  }

  function promptAddon(data) {
    const core = getCore(data);
    if (!core) return '';
    const mode = questionMode(data);
    const direct = core.direct_axis || {};
    const p = direct.perfection || data.judgment_support?.perfection || {};
    const state = direct.aspect_state || p.aspect || data.judgment_support?.primary_connection || {};
    const g = state.closest_geometric_aspect || {};
    const moon = core.moon || {};
    const axes = core.derived_event_axes || {};
    const reception = direct.reception || {};
    const indirect = core.indirect_perfection || {};
    const interventions = core.interventions || {};
    const warnings = (core.considerations?.warnings || []).map(x => `- ${x.code}: ${x.text_ko}`).join('\n') || '- 없음';
    const modern = getModern(data);

    return `\n\n[HORARY BALANCE V3.1 · 최종 판정 근거 · STRICT V6]\n[TRADITIONAL CORE V6 · authoritative]\n- 질문형: ${mode}\n- local datetime: ${data.moment?.local_iso}\n- timezone: ${data.moment?.timezone}\n- UTC datetime: ${data.moment?.utc_iso}\n- coordinates: ${data.moment?.latitude}, ${data.moment?.longitude}\n- house system: Regiomontanus\n- orb policy: Traditional planetary moiety sum\n\n[직접 시그니피케이터]\n- closest geometric aspect: ${g.aspect_ko || state.aspect_ko || 'none'} · orb ${g.orb ?? state.orb ?? '—'}°\n- traditional valid aspect: ${state.traditional_valid_aspect_ko || 'none'}\n- aspect state: ${state.traditional_state || state.phase || '—'}\n- applying calculation: ${state.motion_method || '—'} · past/current/future error=${state.error_past_deg ?? '—'}/${state.error_now_deg ?? state.orb ?? '—'}/${state.error_future_deg ?? '—'}°\n- direct perfection: ${p.perfects ? 'YES' : 'NO'} · ${p.reason_ko || p.reason || '—'}\n- perfection pipeline started: ${!!p.perfection_check_started}\n- interruption type: ${p.interruption_type || 'none'} · refranation=${!!p.is_refranation}\n\n[파생 사건축]\n${pairPrompt('quesited ↔ event', axes.quesited_to_event)}\n${pairPrompt('event ↔ querent', axes.event_to_querent)}\n- derived house policy: ${core.derived_house_policy?.derivation || '해당 없음'}\n\n[Moon]\n- VOC: ${moon.void_of_course ? 'YES' : 'NO'}\n- policy: ${moon.policy_ko || moon.policy || 'traditional 7 planets / Ptolemaic 5 aspects'}\n- last separating: ${moonEventPhrase(moon.last_major_separating_aspect, 'last')}\n- next applying before ingress: ${moonEventPhrase(moon.next_major_applying_aspect, 'next')}\n- sign ingress: ${moon.sign_exit_local || moon.sign_exit_utc || '—'} · ${moon.hours_to_sign_exit ?? '—'}h\n\n[Reception / indirect / intervention]\n- reception: ${receptionPhrase(reception)}\n- Translation of Light: ${(indirect.translation_of_light || []).length}\n- Collection of Light: ${(indirect.collection_of_light || []).length}\n- Prohibition/Frustration: ${(interventions.prohibition_or_frustration || []).length}\n- Refranation: ${interventions.refranation ? 'YES' : 'NO'}\n- evidence grade: ${core.evidence_grade || 'NONE'} · ${core.evidence_grade_ko || ''}\n\n[Considerations]\n${warnings}\n- chart_invalid=false. Early/Late ASC is caution only.\n\n[STRICT 판정 규칙]\n1. closest_geometric_aspect와 traditional_valid_aspect를 절대 동일시하지 않는다.\n2. 유효 오브 밖(out_of_orb)은 applying처럼 접근 중이어도 직접 Perfection 파이프라인에 넣지 않는다.\n3. direct Perfection은 현재 유효 오브 안의 applying/exact 주요각에서만 시작한다.\n4. applying/separating은 실제 단기 ephemeris 오차 감소/증가를 우선한다. 역행 여부를 포함한 실제 진행을 따른다.\n5. sign ingress 중단과 Refranation을 구분한다. Refranation은 유효 applying 이후 station/direction change가 정확각을 깨는 경우에만 쓴다.\n6. Moon VOC는 전통 7행성 + conjunction/sextile/square/trine/opposition만 사용한다. Uranus/Neptune/Pluto, Node, Chiron, Lilith, Vertex, Fortune은 VOC에 넣지 않는다.\n7. 연락 질문은 상대=7H, 상대의 연락=7H의 3H=radical 9H다. 상대 자체와 연락행위를 별도 축으로 읽는다.\n8. A등급=직접 적용 성사, B등급=Translation/Collection, C등급=derived event 연결, D등급=Reception only. 이 계층을 합쳐 하나의 YES로 뭉개지 않는다.\n9. Reception은 의향/수용성 보조층이며 직접·간접 성사각을 대체하지 않는다. Dignity/Debility는 행동능력·상태의 질이지 자동 YES/NO가 아니다.\n10. exact aspect / sign ingress / station / prohibition·frustration의 시간 순서를 비교한다. 먼저 발생하는 실제 이벤트를 우선한다.\n11. '직접 성사각 없음'을 '사건 가능성 0'으로 번역하지 않는다. 구조 판정과 절대 미래 단정을 분리한다.\n12. Traditional Core와 Modern Supplemental을 섞지 않는다.${NON_OUTCOME.has(mode) ? '\n13. 이 질문은 비성사형이므로 위 성사 계층을 메인 결론으로 사용하지 말고 질문유형별 위치/묘사/비교 규칙을 우선한다.' : ''}\n\n[MODERN SUPPLEMENTAL · core 판정에서 제외]\n- used_in_traditional_core=${!!modern?.used_in_traditional_core}\n- Uranus/Neptune/Pluto는 참고층만 허용.\n`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_V40_FETCH__) return;
    W.__LUNEA_HORARY_V40_FETCH__ = true;
    const priorFetch = W.fetch.bind(W);

    W.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      let nextInit = init;

      if (latestHorary && /generativelanguage\.googleapis\.com/i.test(url) && init?.body) {
        try {
          const body = JSON.parse(init.body);
          let touched = false;
          (body.contents || []).forEach(content => {
            (content.parts || []).forEach(part => {
              if (typeof part.text !== 'string') return;
              if (!part.text.includes('[HORARY V1 · 질문시각 점성술 계산 결과]')) return;
              if (part.text.includes('[TRADITIONAL CORE V6 · authoritative]')) return;
              part.text += promptAddon(latestHorary);
              touched = true;
            });
          });
          if (touched) nextInit = {...init, body:JSON.stringify(body)};
        } catch {}
      }

      const response = await priorFetch(input, nextInit);
      if (/\/v1\/horary(?:\?|$)/.test(url) && response?.ok) {
        try {
          response.clone().json().then(data => {
            if (data?.schema !== 'LUNEA_HORARY_V1') return;
            latestHorary = data;
            W.__LUNEA_LAST_HORARY_V40__ = data;
            scheduleRender();
          }).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function scheduleRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      renderCore();
    });
  }

  function boot() {
    addStyle();
    installFetchBridge();
    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
    [120,400,900,1800].forEach(ms => setTimeout(scheduleRender, ms));
    W.LUNEA_HORARY_TRADITIONAL_CORE_V40 = Object.freeze({
      version: RELEASE,
      getCore,
      renderCore,
      promptAddon,
      questionMode,
    });
    console.info('☿ LUNEA Horary Traditional Core V40 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
