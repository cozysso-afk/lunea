'use strict';

/*
  LUNEA INTIMACY DEPTH V42.0
  ==========================
  A thin interpretation-depth layer over the existing V34 78-card database.

  It intentionally does NOT rewrite card meanings, RNG, fixed spreads, or
  Oracle data. It classifies the user's intimacy question and tells the final
  interpreter which already-existing evidence dimensions must stay separate.
*/
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_DEPTH_V42__) return;
  W.__LUNEA_INTIMACY_DEPTH_V42__ = true;

  const RELEASE = '42.0';
  const MARKER = '[LUNEA INTIMACY DEPTH ROUTER';

  const TYPES = Object.freeze({
    attraction: Object.freeze({
      label: '성적·신체적 끌림',
      required: ['attraction','desire','mutuality'],
    }),
    physical_compatibility: Object.freeze({
      label: '신체적 속궁합',
      required: ['attraction','desire','initiative','receptivity','pace','communication','emotionalSafety','mutuality','satisfaction','boundary','avoidance','instability','attachment'],
    }),
    desire_style: Object.freeze({
      label: '욕구·친밀감 방식',
      required: ['desire','initiative','receptivity','pace','communication','boundary'],
    }),
    tension_action: Object.freeze({
      label: '성적 텐션·행동 전환',
      required: ['attraction','desire','initiative','avoidance','boundary','instability'],
    }),
    rhythm_boundary: Object.freeze({
      label: '리듬·경계·조율',
      required: ['initiative','receptivity','pace','communication','emotionalSafety','mutuality','boundary','avoidance'],
    }),
    satisfaction: Object.freeze({
      label: '만족 가능성',
      required: ['mutuality','satisfaction','emotionalSafety','communication','boundary','instability'],
    }),
    attachment_afterglow: Object.freeze({
      label: '관계 후 애착·여운',
      required: ['attachment','emotionalSafety','mutuality','avoidance','obsession','instability'],
    }),
    reunion_intimacy: Object.freeze({
      label: '재회 후 친밀감',
      required: ['attraction','desire','communication','emotionalSafety','mutuality','satisfaction','attachment','avoidance','instability'],
    }),
    comparison: Object.freeze({
      label: 'A/B 친밀감 비교',
      required: ['attraction','desire','pace','communication','emotionalSafety','mutuality','satisfaction','attachment','boundary','avoidance','instability'],
    }),
    general_intimacy: Object.freeze({
      label: '종합 친밀감',
      required: ['attraction','desire','pace','communication','emotionalSafety','mutuality','satisfaction','attachment','boundary','avoidance','instability'],
    }),
  });

  const norm = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function currentState() {
    try {
      if (typeof state !== 'undefined') return state;
    } catch {}
    return W.state || null;
  }

  function intimacyContext(question = '', title = '') {
    const q = norm(question);
    const t = norm(title);
    if (W.__LUNEA_INTIMACY_ACTIVE__) return true;
    if (document.body?.classList?.contains('lunea-intimacy-reading')) return true;
    if (W.LUNEA_INTIMACY_V34?.getSpread?.(t)) return true;
    return /속궁합|잠자리|섹스|성적\s*(?:궁합|끌림|욕구|텐션)|신체적\s*(?:궁합|끌림|밀착)|육체적\s*(?:궁합|끌림|케미)|친밀감|스킨십|욕구\s*(?:방식|차이)|애프터글로|관계\s*후\s*(?:감정|여운|애착)/i.test(q);
  }

  function looksLikeComparison(q, title) {
    const s = `${q} ${title}`;
    const namedAB = /(?:^|\s|[,(])a(?:와|와\s*b|\/b|\s*vs\.?\s*b)|a\/b|a\s*(?:vs\.?|대|와)\s*b/i.test(s);
    const compareWords = /비교|각각|누가\s*더|어느\s*쪽|둘\s*중|두\s*사람\s*중/i.test(s);
    return namedAB || compareWords || /A\/B\s*친밀감\s*비교/i.test(title);
  }

  function classify(question = '', title = '') {
    const q = norm(question);
    const t = norm(title);
    const s = `${q} ${t}`;

    if (looksLikeComparison(q, t)) return 'comparison';
    if (/재회|다시\s*(?:만나|이어|가까워|잠자리|관계)|헤어(?:진|졌다).*친밀|전(?:남친|여친|애인)/i.test(s)) return 'reunion_intimacy';
    if (/관계\s*후|끝난\s*뒤|후의\s*(?:감정|여운|애착)|애착|여운|afterglow/i.test(s)) return 'attachment_afterglow';
    if (/만족|만족도|충족|잘\s*맞(?:아|을까)|속궁합/i.test(s)) return 'physical_compatibility';
    if (/리듬|템포|완급|속도|경계|조율|맞춰|엇갈|어긋/i.test(s)) return 'rhythm_boundary';
    if (/욕구\s*(?:방식|스타일|차이)|어떤\s*방식|리드|주도|수용|먼저\s*(?:다가|시작)/i.test(s)) return 'desire_style';
    if (/텐션|행동으로|실제로\s*(?:다가|움직)|참고\s*있|억누|유혹/i.test(s)) return 'tension_action';
    if (/만족|충족/i.test(s)) return 'satisfaction';
    if (/끌림|매력|원하|욕망|성적\s*관심/i.test(s)) return 'attraction';
    return 'general_intimacy';
  }

  function directive(type, question = '', title = '') {
    const meta = TYPES[type] || TYPES.general_intimacy;
    const common = [
      `${MARKER} · V${RELEASE}]`,
      `- 질문 유형: ${type} / ${meta.label}`,
      `- 우선 확인 근거: ${meta.required.join(', ')}`,
      '- attraction/desire(끌림·욕구), compatibility(맞음), satisfaction(만족), attachment(애착), obsession(집착)은 서로 다른 결론이다. 한 신호를 다른 신호의 증거로 대체하지 않는다.',
      '- 강한 끌림이나 집착을 좋은 속궁합으로 환산하지 않는다. 반대로 편안함이 높다고 성적 끌림까지 자동으로 높다고 말하지 않는다.',
      '- A/B 또는 나/상대가 분리된 포지션이면 양쪽을 먼저 독립 해석한 뒤 공통점·차이·조율 가능성을 합친다.',
      '- pace는 단순 빠름/느림 평가가 아니라 두 사람의 템포가 실제로 맞는지, 조율 가능한 차이인지, 반복 시 피로가 되는 차이인지 구분한다.',
      '- 장기 지속성은 별도 카드 점수로 날조하지 않는다. emotionalSafety + communication + mutuality + attachment와 avoidance/instability의 결합으로만 조건부 판단한다.',
      '- 결론에서 반드시 “끌림”, “실제 맞는 방식/리듬”, “불편·충돌 위험”, “만족 가능성”을 같은 문장으로 뭉개지 말고 구분한다.',
    ];

    const specific = {
      attraction: [
        '- 이 질문은 끌림 자체가 본체다. 성적 관심이 보이더라도 실제 행동·관계 성립·속궁합까지 확장 단정하지 않는다.',
      ],
      physical_compatibility: [
        '- 속궁합은 최소 5층으로 읽는다: ① 서로의 끌림/욕구 ② 원하는 친밀감 방식과 주도·수용 ③ 템포·완급·반응의 맞물림 ④ 소통·안전감·경계 ⑤ 실제 상호 만족과 관계 후 여운.',
        '- 처음의 강렬함과 반복 관계의 편안함이 다르면 둘을 따로 결론낸다.',
      ],
      desire_style: [
        '- “원한다/원하지 않는다”만 말하지 말고 먼저 다가가는 방식, 반응을 기다리는 방식, 속도, 표현·소통 필요도를 나눠 설명한다.',
      ],
      tension_action: [
        '- 텐션의 크기와 행동 가능성을 분리한다. desire가 높아도 avoidance/boundary/instability가 크면 행동 전환은 낮거나 불규칙할 수 있다.',
      ],
      rhythm_boundary: [
        '- 차이가 발견되면 즉시 불일치로 닫지 말고 자연히 맞는 차이 / 대화로 조율 가능한 차이 / 반복 시 만족을 깎는 구조적 차이로 구분한다.',
      ],
      satisfaction: [
        '- 만족은 mutuality와 satisfaction뿐 아니라 emotionalSafety·communication·boundary 위험까지 확인한 뒤 결론낸다.',
      ],
      attachment_afterglow: [
        '- 관계 후 가까워짐, 안도감, 집착, 후퇴를 같은 “애착”으로 묶지 않는다. attachment / obsession / avoidance를 따로 본다.',
      ],
      reunion_intimacy: [
        '- 과거의 익숙한 끌림이 살아나는 것과 예전 패턴이 실제로 개선되는 것은 별개다. attraction 회복과 safety/communication/instability 개선을 각각 판정한다.',
      ],
      comparison: [
        '- A와 B는 동일한 기준으로 대칭 비교한다. 한쪽만 끌림을 보고 다른 쪽은 안정성을 보는 식의 비대칭 비교를 금지한다.',
        '- 최종 비교는 최소 끌림 / 리듬·방식 / 안전·경계 / 만족 / 여운·지속 조건의 같은 축으로 나란히 정리한다.',
      ],
      general_intimacy: [
        '- 종합 질문은 끌림 → 방식/리듬 → 경계/소통 → 만족 → 관계 후 감정 순서로 층을 나눠 읽는다.',
      ],
    };

    return [...common, ...(specific[type] || specific.general_intimacy), `- 질문 원문: ${norm(question) || '(없음)'}`, `- 배열: ${norm(title) || '(AI/기타)'}`].join('\n');
  }

  function patchPrompt() {
    if (typeof promptString !== 'function' || promptString.__luneaIntimacyDepthV42) return false;
    const base = promptString;
    const wrapped = function(...args) {
      const master = base.apply(this, args);
      if (String(master || '').includes(MARKER)) return master;
      const s = currentState();
      const question = s?.question || '';
      const title = s?.title || '';
      if (!intimacyContext(question, title)) return master;
      const type = classify(question, title);
      return `${master}\n\n${directive(type, question, title)}`;
    };
    wrapped.__luneaIntimacyDepthV42 = true;
    wrapped.__luneaPriorPromptString = base;
    promptString = wrapped;
    try { W.promptString = wrapped; } catch {}
    return true;
  }

  function boot() {
    patchPrompt();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (patchPrompt() || tries >= 80) clearInterval(timer);
    }, 100);
  }

  W.LUNEA_INTIMACY_DEPTH_V42 = Object.freeze({
    version: RELEASE,
    types: TYPES,
    classify,
    directive,
    intimacyContext,
    patchPrompt,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
