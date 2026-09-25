'use strict';

/* LUNEA HORARY ANSWER VALIDATOR V48
   ---------------------------------------------------------------
   Runtime guard for Horary AI prose only.
   - validates the generated answer against the deterministic Horary prompt/result
   - retries once with explicit correction instructions when a hard contradiction is found
   - returns a safe verification-hold answer if the retry still violates the contract
   - never touches Tarot / Daily / other Gemini requests
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_ANSWER_VALIDATOR_V48__) return;
  W.__LUNEA_HORARY_ANSWER_VALIDATOR_V48__ = true;

  const RELEASE = '48.0';
  const RETRY_TAG = '[HORARY ANSWER VALIDATOR V48 · RETRY]';
  const MARKERS = [
    '[HORARY V1 · 질문시각 점성술 계산 결과]',
    '[HORARY V1 · 계산 결과]',
    '[HORARY ENGINE RESULT · AUTHORITATIVE]',
    'LUNEA HORARY INTERPRETATION ENGINE V2',
    'LUNEA의 전통 Horary'
  ];

  const clean = value => String(value ?? '').replace(/\r/g, '').trim();
  const compact = value => clean(value).replace(/\s+/g, ' ');

  function isGeminiGenerate(url) {
    return /generativelanguage\.googleapis\.com\/.+:generateContent(?:\?|$)/i.test(String(url || ''));
  }

  function requestUrl(input) {
    try {
      return typeof input === 'string'
        ? input
        : (input instanceof URL ? input.href : String(input?.url || ''));
    } catch { return ''; }
  }

  function requestPrompt(init = {}) {
    if (!init?.body || typeof init.body !== 'string') return '';
    try {
      const body = JSON.parse(init.body);
      return String(body?.contents?.[0]?.parts?.[0]?.text || '');
    } catch { return ''; }
  }

  function isHoraryPrompt(prompt) {
    const value = String(prompt || '');
    return MARKERS.some(marker => value.includes(marker));
  }

  function canonicalPrompt(requestText = '') {
    let prompt = '';
    try { prompt = String(W.LUNEA_HORARY_INTERPRETATION_V47?.aiPrompt?.() || '').trim(); } catch {}
    if (!prompt) prompt = String(requestText || '').trim();
    try {
      const lock = W.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47?.qualityLockedPrompt;
      if (typeof lock === 'function') prompt = String(lock(prompt) || prompt);
    } catch {}
    return prompt;
  }

  function section(text, marker, endings = []) {
    const source = String(text || '');
    const start = source.indexOf(marker);
    if (start < 0) return '';
    const from = start + marker.length;
    let end = source.length;
    for (const token of endings) {
      const index = source.indexOf(token, from);
      if (index >= 0 && index < end) end = index;
    }
    return source.slice(from, end).trim();
  }

  function engineBlock(prompt) {
    const v2 = section(prompt, '[HORARY ENGINE RESULT · AUTHORITATIVE]', [
      '\n[절대 금지]', '\n[PRASHNA', '\n[질문 유형별 판독 규칙]', '\n[FINAL VERDICT LOCK'
    ]);
    if (v2) return v2;
    return section(prompt, '[HORARY V1 · 질문시각 점성술 계산 결과]', [
      '\n[해석 원칙]', '\n[PRASHNA', '\n[출력]'
    ]) || section(prompt, '[HORARY V1 · 계산 결과]', ['\n[해석 원칙]', '\n[PRASHNA', '\n[출력]']);
  }

  function questionBlock(prompt) {
    return section(prompt, '[질문 원문]', [
      '\n[질문 분류]', '\n[HORARY ENGINE RESULT', '\n[HORARY V1', '\n[절대 금지]'
    ]);
  }

  function familyKey(prompt) {
    const match = String(prompt || '').match(/-\s*family:\s*([a-z_]+)/i);
    return String(match?.[1] || 'general').toLowerCase();
  }

  function conclusionBlock(answer) {
    const value = String(answer || '');
    const hit = value.match(/###\s*(?:한줄 결론|한줄 요약)\s*\n([\s\S]*?)(?=\n###\s|$)/i);
    if (hit?.[1]) return hit[1].trim();
    return value.slice(0, 700);
  }

  function candidateText(data) {
    return String(data?.candidates?.[0]?.content?.parts?.map?.(part => part?.text || '').join('') || '').trim();
  }

  function strongPositive(text) {
    const sentences = String(text || '').split(/(?<=[.!?。]|\n)/).map(compact).filter(Boolean);
    const positive = /(?:성사\s*(?:된다|될\s*가능성이\s*(?:높|크)|가능성이\s*(?:높|크))|재회\s*(?:한다|할\s*수\s*있|가능성이\s*(?:높|크))|관계\s*회복\s*(?:이\s*된다|된다|가능성이\s*(?:높|크))|연락\s*(?:이\s*온다|이\s*올\s*가능성이\s*(?:높|크)|할\s*가능성이\s*(?:높|크))|답장\s*(?:이\s*온다|이\s*올\s*가능성이\s*(?:높|크))|합격\s*(?:한다|할\s*가능성이\s*(?:높|크))|채용\s*(?:된다|될\s*가능성이\s*(?:높|크))|계약\s*(?:이\s*성사된다|성사\s*가능성이\s*(?:높|크)))/i;
    const hedge = /(높지\s*않|크지\s*않|어렵|낮|부족|불확실|단정(?:할\s*수)?\s*없|아니|못\s*한|보류|근거가\s*약)/i;
    return sentences.some(sentence => positive.test(sentence) && !hedge.test(sentence));
  }

  function positiveReconciliation(text) {
    const sentences = String(text || '').split(/(?<=[.!?。]|\n)/).map(compact).filter(Boolean);
    const positive = /(재회|다시\s*(?:만나|만날|사귀|사귈)|관계\s*회복)[^.!?\n]{0,45}(?:된다|가능성이\s*(?:높|크)|할\s*수\s*있)/i;
    const hedge = /(높지\s*않|크지\s*않|어렵|낮|부족|불확실|단정(?:할\s*수)?\s*없|아니|보류)/i;
    return sentences.some(sentence => positive.test(sentence) && !hedge.test(sentence));
  }

  function extractPercentTokens(text) {
    return [...String(text || '').matchAll(/\b\d{1,3}(?:\.\d+)?\s*%/g)].map(match => match[0].replace(/\s+/g, ''));
  }

  function extractTimeTokens(text) {
    const source = String(text || '');
    const tokens = [];
    const patterns = [
      /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g,
      /\d{1,2}월\s*\d{1,2}일(?=$|[\s,.;!?])/g,
      /\d+(?:\.\d+)?\s*(?:일|주|개월|달)(?=$|[\s,.;!?])/g
    ];
    for (const regex of patterns) {
      for (const match of source.matchAll(regex)) tokens.push(match[0].replace(/\s+/g, ''));
    }
    return [...new Set(tokens)];
  }

  function hasNoObstruction(engine) {
    return /(confirmed\s+obstruction\s*:\s*none|별도\s*경고\s*없음|prohibition[^\n]{0,35}(?:없음|none)|frustration[^\n]{0,35}(?:없음|none)|refranation[^\n]{0,35}(?:없음|none|해당\s*없음))/i.test(engine);
  }

  function inventedObstruction(answer) {
    const rows = String(answer || '').split(/\n|(?<=[.!?。])/).map(compact).filter(Boolean);
    return rows.some(row => {
      if (!/(prohibition|frustration|refranation|금지각|좌절각|굴절)/i.test(row)) return false;
      if (/(없|아니|해당\s*없|확인되지|근거\s*없)/i.test(row)) return false;
      return /(있|발생|작동|방해|막|끊|성립)/i.test(row);
    });
  }

  function outOfOrbPromoted(engine, answer) {
    if (!/(out[- ]?of[- ]?orb|유효\s*오브\s*밖|성사각\s*미채택)/i.test(engine)) return false;
    const rows = String(answer || '').split(/\n|(?<=[.!?。])/).map(compact).filter(Boolean);
    return rows.some(row => {
      if (!/(유효\s*오브\s*밖|out[- ]?of[- ]?orb|기하학적|nearest)/i.test(row)) return false;
      if (/(미채택|아니|채택하지\s*않|채택하지\s*못|성사각으로\s*볼\s*수\s*없|근거로\s*쓰지|승격하지)/i.test(row)) return false;
      return /(적용각|성사각|perfection|성사\s*근거)/i.test(row);
    });
  }

  function validate(answer, prompt) {
    const value = String(answer || '').trim();
    const canonical = String(prompt || '');
    const engine = engineBlock(canonical);
    const question = questionBlock(canonical);
    const numericEvidence = `${question}\n${engine}`;
    const family = familyKey(canonical);
    const conclusion = conclusionBlock(value);
    const violations = [];

    if (!value) violations.push({code:'empty_answer', message:'AI 응답이 비어 있음'});
    if (/PRIVATE SELF-CHECK|FINAL VERDICT LOCK|HORARY ANSWER VALIDATOR V48 · RETRY/i.test(value)) {
      violations.push({code:'private_instruction_leak', message:'내부 검증 지시문이 사용자 답변에 노출됨'});
    }

    const authoritativeNegative = /(AUTHORITATIVE\s+JUDGMENT\s*:\s*(?:NO|NEGATIVE|INSUFFICIENT)|(?:staged|overall)[^\n]{0,50}(?:NO|부정|근거\s*부족|성사\s*어려움|불성사)|(?:결론|성사)[^\n]{0,45}(?:근거\s*부족|어려움|불성사))/i.test(engine);
    if (authoritativeNegative && strongPositive(conclusion)) {
      violations.push({code:'verdict_direction', message:'엔진의 부정/근거부족 판정을 강한 긍정 결론으로 뒤집음'});
    }

    const directAbsent = /(direct\s+perfection\s*:\s*(?:NO|NONE|FALSE)|직접\s*성사[^\n]{0,25}(?:없음|미성립)|성사각\s*미채택)/i.test(engine);
    const derivedPresent = /(derived(?:[- ]event)?\s+axis\s*:\s*(?:VALID|YES|TRUE)|보조\s*성사\s*있음|derived[^\n]{0,35}perfects?\s*[:=]\s*(?:true|yes))/i.test(engine);
    if (directAbsent && derivedPresent && ['reconciliation','relationship'].includes(family) && positiveReconciliation(conclusion)) {
      violations.push({code:'derived_scope', message:'파생 사건 성사를 재회/관계 자체의 성사로 확대함'});
    }

    if (hasNoObstruction(engine) && inventedObstruction(value)) {
      violations.push({code:'invented_obstruction', message:'엔진이 없다고 한 prohibition/frustration/refranation을 새로 만듦'});
    }
    if (outOfOrbPromoted(engine, value)) {
      violations.push({code:'out_of_orb_promotion', message:'유효 오브 밖 기하학적 각을 성사각/적용각으로 승격함'});
    }

    const promptPercents = new Set(extractPercentTokens(numericEvidence));
    for (const token of extractPercentTokens(value)) {
      if (!promptPercents.has(token)) {
        violations.push({code:'invented_probability', message:`엔진에 없는 확률 수치 생성: ${token}`});
      }
    }

    const promptTimes = new Set(extractTimeTokens(numericEvidence));
    for (const token of extractTimeTokens(value)) {
      if (!promptTimes.has(token)) {
        violations.push({code:'invented_timing', message:`질문/엔진에 없는 시기 수치 생성: ${token}`});
      }
    }

    if (/\[PRASHNA|Prashna result|HORARY ↔ PRASHNA/i.test(canonical) && /(평균|절충|합산|종합\s*점수)/i.test(value)) {
      violations.push({code:'prashna_averaging', message:'Horary와 Prashna를 평균/합산/절충함'});
    }

    if (value && !/근거\s*:/.test(value)) {
      violations.push({code:'missing_evidence_labels', message:'핵심 판단에 “근거:” 표기가 없음'});
    }

    const unique = [];
    const seen = new Set();
    for (const row of violations) {
      const key = `${row.code}|${row.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
    }
    return {ok:unique.length === 0, violations:unique, family, engine};
  }

  function correctionPrompt(basePrompt, violations) {
    const rows = (violations || []).map(row => `- ${row.code}: ${row.message}`).join('\n') || '- 자동 검증 실패';
    return `${String(basePrompt || '').trim()}\n\n${RETRY_TAG}\n직전 AI 답변은 아래 이유로 폐기됐다. 같은 계산값만 사용해 전체 답변을 처음부터 다시 작성하라.\n${rows}\n\n[재작성 강제 규칙]\n- 위반 사항을 해명하지 말고 조용히 수정한 최종 해설만 출력한다.\n- deterministic Horary 엔진의 방향을 바꾸지 않는다.\n- 새 날짜·기간·확률·하우스·aspect·방해요소를 발명하지 않는다.\n- 파생 사건 근거는 그 사건 범위 밖으로 확대하지 않는다.\n- 핵심 판단마다 반드시 “근거:”를 붙인다.\n- 이 RETRY 지시문은 사용자에게 출력하지 않는다.`;
  }

  function rewriteBody(init, prompt) {
    try {
      const body = JSON.parse(init.body);
      if (!body?.contents?.[0]?.parts?.[0]) return init;
      const next = typeof structuredClone === 'function'
        ? structuredClone(body)
        : JSON.parse(JSON.stringify(body));
      next.contents[0].parts[0].text = prompt;
      return {...init, body:JSON.stringify(next)};
    } catch { return init; }
  }

  function safeHoldText(check) {
    const reasons = (check?.violations || []).map(row => `- ${row.message}`).join('\n') || '- 자동 검증 기준 불일치';
    const engine = String(check?.engine || '').trim();
    const evidence = engine ? engine.slice(0, 2600) : '계산 결과는 화면의 Horary 결과를 기준으로 확인해줘.';
    return `### 한줄 결론\nAI 해설이 계산 엔진과의 자동 검증을 두 번 통과하지 못해 이번 해설은 보류했어. 계산 결과 자체는 변경되지 않았고, 검증되지 않은 추가 단정은 표시하지 않아.\n\n### 검증 사유\n${reasons}\n\n### 계산 엔진 근거\n근거: ${evidence}\n\n### 신뢰도와 불확실성\n검증 실패 답변 대신 deterministic Horary 계산값만 유지했어. 다시 AI 해석을 눌러 새 응답을 받을 수 있어.`;
  }

  function safeResponse(check) {
    const text = safeHoldText(check);
    const payload = {
      candidates:[{content:{parts:[{text}], role:'model'}, finishReason:'STOP'}],
      lunea_validator:{version:RELEASE, status:'held', violations:(check?.violations || []).map(row => row.code)}
    };
    return new Response(JSON.stringify(payload), {
      status:200,
      headers:{'Content-Type':'application/json; charset=utf-8', 'X-LUNEA-Horary-Validator':'held'}
    });
  }

  function note(stage, check) {
    W.__LUNEA_LAST_HORARY_VALIDATION_V48__ = {
      version:RELEASE,
      stage,
      ok:!!check?.ok,
      violations:(check?.violations || []).map(row => ({code:row.code, message:row.message})),
      checkedAt:Date.now()
    };
  }

  function installFetchGuard() {
    if (W.__LUNEA_HORARY_ANSWER_VALIDATOR_V48_FETCH__) return true;
    if (typeof W.fetch !== 'function') return false;
    const priorFetch = W.fetch.bind(W);
    W.__LUNEA_HORARY_ANSWER_VALIDATOR_V48_FETCH__ = true;

    W.fetch = async function luneaHoraryAnswerValidatorV48(input, init = {}) {
      const url = requestUrl(input);
      const method = String(init?.method || input?.method || 'GET').toUpperCase();
      const originalPrompt = requestPrompt(init);
      const owns = method === 'POST' && isGeminiGenerate(url) && isHoraryPrompt(originalPrompt);
      if (!owns) return priorFetch(input, init);

      const canonical = canonicalPrompt(originalPrompt);
      const firstResponse = await priorFetch(input, init);
      if (!firstResponse?.ok) return firstResponse;

      let firstData = null;
      try { firstData = await firstResponse.clone().json(); } catch { return firstResponse; }
      const firstCheck = validate(candidateText(firstData), canonical);
      note('first', firstCheck);
      if (firstCheck.ok) return firstResponse;

      const retryInit = rewriteBody(init, correctionPrompt(canonical, firstCheck.violations));
      const retryResponse = await priorFetch(input, retryInit);
      if (!retryResponse?.ok) return retryResponse;

      let retryData = null;
      try { retryData = await retryResponse.clone().json(); } catch { return retryResponse; }
      const retryCheck = validate(candidateText(retryData), canonical);
      note('retry', retryCheck);
      if (retryCheck.ok) return retryResponse;

      note('held', retryCheck);
      return safeResponse(retryCheck);
    };
    return true;
  }

  W.LUNEA_HORARY_ANSWER_VALIDATOR_V48 = Object.freeze({
    version:RELEASE,
    validate,
    correctionPrompt,
    engineBlock,
    familyKey,
    isHoraryPrompt,
    install:installFetchGuard
  });

  installFetchGuard();
  console.info('✦ LUNEA Horary Answer Validator V48 active · retry-once guard ON');
})();