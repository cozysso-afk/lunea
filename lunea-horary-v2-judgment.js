'use strict';

/*
  LUNEA HORARY V2 JUDGMENT BRIDGE
  ===============================
  Read-only frontend bridge for backend judgment_support.horary_v2.
  - no chart recalculation
  - no grade/threshold mutation
  - no Prashna/Cross mutation
  - adds ruleset traceability and authoritative evidence to the AI prompt
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_V2_JUDGMENT__) return;
  W.__LUNEA_HORARY_V2_JUDGMENT__ = true;

  const RELEASE = '2.0';
  const MARKER = '[HORARY V2 JUDGMENT · authoritative evidence]';
  const UI_ID = 'luneaHoraryV2RulesetTrace';
  let queued = false;

  function current() {
    try { return W.LUNEA_ASTRO_HORARY_V1?.getCurrent?.() || W.__LUNEA_LAST_HORARY_V41__ || null; }
    catch { return W.__LUNEA_LAST_HORARY_V41__ || null; }
  }

  function v2Of(data = current()) {
    const v2 = data?.judgment_support?.horary_v2;
    return v2?.version === 'LUNEA_HORARY_V2_JUDGMENT_SCHEMA' ? v2 : null;
  }

  function compact(v2) {
    return {
      version: v2.version,
      horaryRuleset: v2.horaryRuleset,
      questionIntent: v2.questionIntent,
      judgmentAxis: v2.judgmentAxis,
      currentJudgment: v2.currentJudgment,
      aspectApplications: v2.aspectApplications,
      voc: v2.voc,
      perfection: v2.perfection,
      moonFlow: v2.moonFlow,
      reception: v2.reception,
      dignity: v2.dignity,
      obstruction: v2.obstruction,
      futureDevelopment: v2.futureDevelopment,
      eventQuality: v2.eventQuality,
      confidence: v2.confidence,
      separationContract: v2.separationContract,
      aiInterpretationGuardrails: v2.aiInterpretationGuardrails,
    };
  }

  function promptAddon(data = current()) {
    const v2 = v2Of(data);
    if (!v2) return '';
    return `\n\n${MARKER}\n${JSON.stringify(compact(v2))}\n\n` +
      `[HORARY V2 AI 해석 계약]\n` +
      `1. 너는 계산기가 아니라 해설자다. 위 JSON에 없는 aspect, timing, reception, dignity, obstruction을 생성하지 않는다.\n` +
      `2. 출력 순서는 질문 유형 → 현재 radical judgment → 직접 perfection 경로 → Moon event flow → reception → dignity → obstruction → Future Window → 반증 근거 → 불확실성 → 한줄 결론이다.\n` +
      `3. currentJudgment/radicalJudgment는 질문 시각 판정이다. futureDevelopment의 orb entry/exact perfection을 현재 perfection이나 현재 grade로 표현하지 않는다.\n` +
      `4. voc.isVoid=true는 voc.signExitAt까지의 현재 sign 상태다. VOC를 자동 불성사로 번역하거나 sign ingress 이후 목표기간 전체로 확장하지 않는다.\n` +
      `5. reception은 수용·협력·관계 조건이고 Perfection은 사건 성사 연결이다. reception을 시장/상대가 질문자의 통제 또는 이익 방향으로 움직인다는 뜻으로 과장하지 않는다.\n` +
      `6. dignity는 행성의 상태·행동 역량 보조정보다. fall/detriment/peregrine을 사건 실패·확정 손실·성사 불가능과 동일시하지 않는다.\n` +
      `7. aspectApplications와 moonFlow의 eventAxisRelation이 supportive/unrelated이면 직접 사건 성사 근거로 승격하지 않는다.\n` +
      `8. currentJudgment.grade가 NONE/D여도 자동 NO라고 쓰지 않는다. 엔진이 제공한 overallState와 perfection 경로를 그대로 설명한다.\n` +
      `9. Future Window가 범위이면 futureDevelopment.start~end와 dailySnapshots 전체를 다룬다. 일부 날짜만 보고 기간 전체를 단정하거나 임의 순위를 만들지 않는다.\n` +
      `10. obstruction.applicable=false이면 무의미한 obstruction 서사를 만들지 않는다. candidate와 confirmed를 구분한다.\n` +
      `11. confidence는 근거 명료도이며 확률 %가 아니다. 임의 %를 생성하지 않는다.\n` +
      `12. 핵심 결론 문장마다 사용한 engine field 경로를 짧게 괄호로 표시한다. 예: (근거: horary_v2.perfection.current).\n`;
  }

  function renderTrace(data = current()) {
    const v2 = v2Of(data);
    const root = document.getElementById('luneaHoraryBalanceGuardV41') || document.getElementById('astroHoraryResult');
    if (!v2 || !root) return;
    let row = document.getElementById(UI_ID);
    if (!row) {
      row = document.createElement('div');
      row.id = UI_ID;
      row.style.cssText = 'margin-top:7px;padding-top:7px;border-top:1px solid rgba(220,230,240,.07);font-size:8px;line-height:1.45;color:#8d98a0';
      root.appendChild(row);
    }
    const rules = v2.horaryRuleset || {};
    row.textContent = `RULESET · ${rules.id || '—'} · ${rules.aspectSystem || '—'} · ${rules.orbPolicy?.method || '—'} · VOC ${rules.vocPolicy || '—'}`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_V2_JUDGMENT_FETCH__) return;
    W.__LUNEA_HORARY_V2_JUDGMENT_FETCH__ = true;
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
            if (touched) nextInit = {...init, body: JSON.stringify(body)};
          }
        } catch (error) {
          console.info('[HORARY V2] prompt bridge skipped', error?.message || error);
        }
      }
      return priorFetch(input, nextInit);
    };
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      renderTrace();
    });
  }

  function boot() {
    installFetchBridge();
    new MutationObserver(schedule).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
    [120,350,800,1500].forEach(ms => setTimeout(schedule, ms));
    W.LUNEA_HORARY_V2_JUDGMENT = Object.freeze({version:RELEASE,v2Of,promptAddon,render:renderTrace});
    console.info('☿ LUNEA HORARY V2 Judgment bridge loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
