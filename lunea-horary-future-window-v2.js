'use strict';

/*
  LUNEA HORARY FUTURE WINDOW V2
  =============================
  Evidence-only frontend companion for backend LUNEA_HORARY_FUTURE_WINDOW_V2.
  It does not recalculate or mutate Horary grade, dignity, reception,
  perfection, VOC, routing, Prashna, or Cross V2.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_FUTURE_WINDOW_V2__) return;
  W.__LUNEA_HORARY_FUTURE_WINDOW_V2__ = true;

  const RELEASE = '2.1';
  const MARKER = '[HORARY FUTURE WINDOW V2 · authoritative]';
  let queued = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function currentHorary() {
    try { return W.LUNEA_ASTRO_HORARY_V1?.getCurrent?.() || W.__LUNEA_LAST_HORARY_V41__ || null; }
    catch { return W.__LUNEA_LAST_HORARY_V41__ || null; }
  }

  function futureOf(data = currentHorary()) {
    const fw = data?.judgment_support?.future_window_v1 || null;
    return fw?.active && (fw.version === 'LUNEA_HORARY_FUTURE_WINDOW_V2' || fw.targetWindow) ? fw : null;
  }

  function fmt(value) {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (!Number.isFinite(d.getTime())) return String(value);
      return d.toLocaleString('ko-KR', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
    } catch { return String(value); }
  }

  function interruptionLines(exact) {
    const rows = exact?.interruption_events_before_exact || [];
    if (!rows.length) return '';
    return rows.map(row => {
      const kind = row.type === 'station'
        ? (row.stationKind === 'retrograde_station' ? '역행 정지' : '순행 정지')
        : 'sign ingress';
      const breakText = row.type === 'station' && row.breaksApplication !== null && row.breaksApplication !== undefined
        ? ` · application ${row.breaksApplication ? '중단' : '유지'}`
        : '';
      return `<br>중간 변화: ${esc(row.body_ko || row.body)} · ${esc(kind)} · ${esc(fmt(row.time_local))}${esc(breakText)}`;
    }).join('');
  }

  function pairLine(pair) {
    if (!pair || pair.shared_ruler) return '';
    const q = pair.question_time || {};
    const entry = pair.orb_entry;
    const exact = pair.exact_perfection_reference;
    const motion = q.motion === 'applying' ? '접근 중' : q.motion === 'separating' ? '분리 중' : '운동 불명확';
    const currentWithin = pair.currentWithinOrb ?? q.within_orb;
    const targetWithin = pair.targetWindowWithinOrb;
    return `<p><b>${esc(pair.a)} → ${esc(pair.b)} ${esc(pair.aspect_ko || pair.aspect)}</b><br>` +
      `질문 시각 거리 ${esc(q.distance_to_exact_deg ?? '—')}° / 허용 orb ${esc(q.max_orb_deg ?? '—')}° · ${currentWithin ? '현재 orb 안' : '현재 orb 밖'} · ${esc(motion)}` +
      `${targetWithin === true ? '<br>목표기간 상태: 유효 orb 안 진입/체류 확인' : targetWithin === false ? '<br>목표기간 상태: 유효 orb 안 진입 미확인' : ''}` +
      `${entry ? `<br>orb 진입: ${esc(fmt(entry.time_local))} · ${esc(entry.scope || '')}` : ''}` +
      `${exact ? `<br>Exact perfection 참고: ${esc(fmt(exact.time_local))} · ${esc(exact.scope || '')}${exact.traditional_continuity === false ? ' · 중간 sign/station 변화 있음' : ''}${interruptionLines(exact)}` : ''}</p>`;
  }

  function moonEventLine(row) {
    const relation = row.eventAxisRelation || (row.direct_event_axis ? 'direct_event_axis' : 'supportive');
    return `<p>Moon → ${esc(row.body_ko || row.body)} ${esc(row.aspect_ko || row.aspect)} · ${esc(fmt(row.exact_local))} · ${esc(relation)}</p>`;
  }

  function moonVocLine(segment) {
    if (!segment?.vocAfterLastExact || !segment?.vocUntilSignExitAt) return '';
    const last = segment.lastMajorAspectBeforeSignExit;
    const lastText = last
      ? `마지막 주요각 Moon → ${esc(last.body_ko || last.body)} ${esc(last.aspect_ko || last.aspect)} · ${esc(fmt(last.exact_local))}`
      : '남은 주요 exact aspect 없음';
    return `<p>${esc(segment.sign_ko || segment.sign_en)} · ${lastText}<br>VOC 전환: ${esc(fmt(segment.vocAfterLastExactAt))} → sign ingress ${esc(fmt(segment.vocUntilSignExitAt))}</p>`;
  }

  function renderCard(data = currentHorary()) {
    const fw = futureOf(data);
    const result = document.getElementById('astroHoraryResult');
    if (!fw || !result?.classList.contains('show')) return;
    const card = [...result.querySelectorAll('.horary-card')].find(el => /Future Window/i.test(el.textContent || ''));
    if (!card) return;

    const targetMoonEvents = fw.moonFutureFlow?.target_window_aspects || fw.moonFutureFlow?.aspects_after_ingress || [];
    const moonSegments = fw.moonFutureFlow?.sign_segments || [];
    const interruptionCount = (fw.futureAspectDevelopment || []).reduce(
      (sum, pair) => sum + (pair?.exact_perfection_reference?.interruption_events_before_exact || []).length, 0
    );
    const signature = JSON.stringify([
      fw.targetWindow?.start, fw.targetWindow?.end,
      fw.hardeningVersion || fw.version,
      (fw.ingresses || []).length,
      (fw.futureAspectDevelopment || []).length,
      targetMoonEvents.length,
      moonSegments.length,
      interruptionCount,
      (fw.dailySummaries || []).length,
    ]);
    if (card.dataset.futureWindowV2 === signature) return;
    card.dataset.futureWindowV2 = signature;

    const ingresses = (fw.ingresses || []).map(row =>
      `<p>${esc(row.body_ko || row.body)} · ${esc(row.from_sign_ko || row.from_sign_en)} → ${esc(row.to_sign_ko || row.to_sign_en)} · ${esc(fmt(row.time_local || row.utc))}${row.within_target_window ? ' · 목표기간 중' : row.before_target_start ? ' · 목표기간 시작 전' : ''}</p>`
    ).join('') || '<p>목표기간 종료 전 주요 시그니피케이터 sign ingress 없음</p>';

    const pairs = (fw.futureAspectDevelopment || []).map(pairLine).join('') || '<p>추적 가능한 직접 사건축 aspect 없음</p>';
    const moonEvents = targetMoonEvents.map(moonEventLine).join('') || '<p>목표기간 내 Moon 완성 주요각 없음</p>';
    const moonVoc = moonSegments.map(moonVocLine).filter(Boolean).join('');

    const days = (fw.dailySummaries || []).map(day => {
      const moon = day.moon || {};
      const orbit = (day.orb_entries || []).map(x => `${x.pair} ${fmt(x.time_local)}`).join(', ') || '없음';
      const exact = (day.exact_perfections || []).map(x => `${x.pair} ${fmt(x.time_local)}`).join(', ') || '없음';
      const moonAspects = (day.moon_major_aspects || []).map(x => `Moon→${x.body_ko || x.body} ${x.aspect_ko || x.aspect} ${fmt(x.exact_local)}`).join(', ') || '없음';
      const vocTransitions = (day.moon_voc_transitions || []).map(x => `${x.sign_ko || x.sign_en}: ${fmt(x.vocAfterLastExactAt)}→${fmt(x.vocUntilSignExitAt)}`).join(', ') || '없음';
      return `<details><summary>${esc(day.date)}</summary><p>Moon: ${esc(moon.start_sign_ko || moon.start_sign)} → ${esc(moon.end_sign_ko || moon.end_sign)}<br>Moon 주요각: ${esc(moonAspects)}<br>Moon VOC 전환: ${esc(vocTransitions)}<br>orb 진입: ${esc(orbit)}<br>목표기간 내 exact perfection: ${esc(exact)}</p></details>`;
    }).join('');

    card.innerHTML = `
      <h5>목표기간 · Future Window V2</h5>
      <p>질문에서 읽은 범위: ${esc(fw.sourceText || fw.source || '—')}<br>${esc(fmt(fw.targetWindow?.start))} → ${esc(fmt(fw.targetWindow?.end))}</p>
      <p>현재 판정: ${esc(fw.currentJudgment?.grade || '—')} · currentPerfection=${esc(String(fw.currentPerfection?.perfects ?? false))}<br>※ Future Window는 현재 판정을 변경하지 않음.</p>
      <p><b>Sign ingress</b></p>${ingresses}
      <p><b>주 시그니피케이터 진행</b></p>${pairs}
      <p><b>Moon Future Flow</b></p>${moonEvents}${moonVoc ? `<p><b>Moon VOC 전환</b></p>${moonVoc}` : ''}
      ${fw.moon_voc_scope_ends_before_target_end ? '<p>※ 현재 Moon VOC는 현재 sign 이탈 전까지만 유효하며 목표기간 전체로 확장하지 않음.</p>' : ''}
      <p><b>날짜별 객관 요약</b></p>${days}
      <p>※ future orb 진입·접근·exact 시각은 현재 Perfection/grade/YES 판정으로 자동 승격하지 않음.</p>`;
  }

  function compactFuture(fw) {
    return {
      version: fw.version,
      hardeningVersion: fw.hardeningVersion,
      targetWindow: fw.targetWindow,
      currentJudgmentUnchanged: fw.currentJudgmentUnchanged,
      currentJudgment: fw.currentJudgment,
      currentPerfection: fw.currentPerfection,
      ingresses: fw.ingresses,
      futureAspectDevelopment: fw.futureAspectDevelopment,
      moonFutureFlow: fw.moonFutureFlow,
      dailySummaries: fw.dailySummaries,
    };
  }

  function promptAddon(data = currentHorary()) {
    const fw = futureOf(data);
    if (!fw) return '';
    return `\n\n${MARKER}\n` +
      `${JSON.stringify(compactFuture(fw))}\n\n` +
      `[Future Window 해석 계약]\n` +
      `1. 위 targetWindow.start~end 전체가 질문 목표기간이다. 기존 프롬프트에 단일 target_date가 보이면 호환 필드일 뿐이며 이 범위가 authoritative다.\n` +
      `2. currentJudgment/currentPerfection은 질문 시각의 기존 판정이며 Future Window와 절대 합치지 않는다. 미래 접근·orb 진입·exact 시각으로 현재 grade를 올리거나 YES로 바꾸지 않는다.\n` +
      `3. 현재 Moon VOC는 현재 sign 이탈 전까지만 설명한다. 목표기간 시작 전/중 ingress가 있으면 VOC를 목표기간 전체의 정체·불성사로 확장하지 않는다. moonFutureFlow.target_window_aspects와 sign_segments를 시간순으로 설명한다.\n` +
      `4. future aspect마다 eventAxisRelation/direct_event_axis/supportive_only를 구분한다. supportive_only는 보조 흐름이며 사건 성사 근거로 자동 승격하지 않는다.\n` +
      `5. currentWithinOrb=false와 targetWindowWithinOrb=true는 질문 시각과 목표기간의 서로 다른 상태다. 후자는 Future Window 진행 근거로 언급할 수 있지만 current perfection으로 표현하지 않는다.\n` +
      `6. exact_perfection_reference.interruption_events_before_exact가 있으면 body·station/sign ingress·time을 그대로 설명한다. breaksApplication이 false/null이면 임의로 성사 중단이라고 단정하지 않는다.\n` +
      `7. Reception은 기술적 수용성/관계 조건이다. 시장·상대가 질문자의 통제 또는 이익 방향으로 움직인다는 식으로 과장하지 않는다.\n` +
      `8. D/NONE은 확정 근거 부족이지 자동 NO가 아니다. Peregrine/Fall/Detriment도 사건 실패와 1:1로 동일시하지 않는다.\n` +
      `9. 범위 질문은 dailySummaries의 모든 날짜를 다룬다. 엔진이 제공하지 않은 근거로 어느 날짜가 더 좋다고 임의 순위화하지 않는다.\n` +
      `10. 답변 구조는 현재 판정 → 미래기간 변화 → 성사 근거 → 반증 → 불확실성 순서로 분리한다.\n`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_FUTURE_WINDOW_V2_FETCH__) return;
    W.__LUNEA_HORARY_FUTURE_WINDOW_V2_FETCH__ = true;
    const priorFetch = W.fetch.bind(W);
    W.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      let nextInit = init;
      if (/generativelanguage\.googleapis\.com/i.test(url) && init?.body) {
        try {
          const addon = promptAddon();
          if (addon) {
            const body = JSON.parse(init.body);
            let touched = false;
            (body.contents || []).forEach(content => (content.parts || []).forEach(part => {
              if (typeof part.text !== 'string') return;
              if (!part.text.includes('[HORARY V1 · 질문시각 점성술 계산 결과]')) return;
              if (part.text.includes(MARKER)) return;
              part.text += addon;
              touched = true;
            }));
            if (touched) nextInit = {...init, body:JSON.stringify(body)};
          }
        } catch {}
      }
      return priorFetch(input, nextInit);
    };
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      renderCard();
    });
  }

  function boot() {
    installFetchBridge();
    new MutationObserver(schedule).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
    [120,350,800,1500].forEach(ms => setTimeout(schedule, ms));
    W.LUNEA_HORARY_FUTURE_WINDOW_V2 = Object.freeze({version:RELEASE,futureOf,promptAddon,render:renderCard});
    console.info('☿ LUNEA Horary Future Window V2 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
