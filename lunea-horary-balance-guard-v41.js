'use strict';

/*
  LUNEA HORARY BALANCE GUARD V41.1
  =================================
  Frontend companion for backend Horary Engine V7 + Judgment Hierarchy V8.

  - Prefer Traditional Core V8 when present, then V7/V6 fallback.
  - Keep V7 dignity, Moon relevance and confirmed-obstruction evidence.
  - Consume V8 action/intention/event-state separation so reception-only D is
    not flattened into an automatic negative verdict.
  - Honor the narrow V8 Moon co-significator rule only when backend V8 itself
    confirmed application to the quesited/event ruler.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_BALANCE_GUARD_V41__) return;
  W.__LUNEA_HORARY_BALANCE_GUARD_V41__ = true;

  const RELEASE = '41.1';
  const BOX_ID = 'luneaHoraryBalanceGuardV41';
  const STYLE_ID = 'luneaHoraryBalanceGuardV41Style';
  let latestHorary = null;
  let queued = false;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function coreOf(data = latestHorary) {
    const j = data?.judgment_support || {};
    return j.traditional_core_v8 || j.traditional_core_v7 || j.traditional_core_v6 || null;
  }

  function hierarchyOf(data = latestHorary) {
    return data?.judgment_support?.judgment_hierarchy_v8 || null;
  }

  function gradeOf(data = latestHorary) {
    const core = coreOf(data) || {};
    const hierarchy = hierarchyOf(data) || {};
    return {
      code: hierarchy.qualified_evidence_grade_v8 || core.qualified_evidence_grade_v8 || core.qualified_evidence_grade_v7 || core.evidence_grade || 'NONE',
      label: hierarchy.qualified_evidence_grade_ko_v8 || core.qualified_evidence_grade_ko_v8 || core.qualified_evidence_grade_ko_v7 || core.evidence_grade_ko || core.evidence_grade || '—'
    };
  }

  function dignityRows(data = latestHorary) {
    const j = data?.judgment_support || {};
    const profiles = j.essential_dignities_v7 || {};
    const sig = data?.significators || {};
    const names = [];
    [['querent','질문자'],['quesited','대상'],['event','사건']].forEach(([key,label]) => {
      const ruler = sig?.[key]?.ruler;
      if (ruler && !names.some(x => x.ruler === ruler)) names.push({ruler,label});
    });
    return names.map(({ruler,label}) => ({label,ruler,profile:profiles[ruler] || null}));
  }

  function addStyle() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BOX_ID}{margin-top:8px;padding:10px 11px;border-radius:13px;border:1px solid rgba(151,214,205,.18);background:linear-gradient(145deg,rgba(72,151,146,.055),rgba(169,145,220,.05))}
      #${BOX_ID} .v41-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;color:#bfe8dc;font-size:8.5px;font-weight:850;letter-spacing:.8px}
      #${BOX_ID} .v41-grade{color:#d6cfe2;font-size:8.5px;letter-spacing:0;text-align:right}
      #${BOX_ID} .v41-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}
      #${BOX_ID} .v41-cell{padding:8px 9px;border-radius:10px;background:rgba(3,8,13,.24);border:1px solid rgba(205,230,225,.07)}
      #${BOX_ID} .v41-cell small{display:block;color:#8d98a0;font-size:7.7px;margin-bottom:3px}#${BOX_ID} .v41-cell b{display:block;color:#ebe8f0;font-size:9.7px;line-height:1.45}
      #${BOX_ID} .v41-dignity{margin-top:8px;padding-top:7px;border-top:1px solid rgba(220,230,240,.07)}#${BOX_ID} .v41-dignity p{margin:4px 0;color:#aaa7b6;font-size:9px;line-height:1.48}
      #${BOX_ID} .v41-note{margin-top:8px;color:#9c98a8;font-size:8.8px;line-height:1.5}
      @media(max-width:520px){#${BOX_ID} .v41-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function patchV40Labels(core, data = latestHorary) {
    const box = $('luneaHoraryTraditionalCoreV40');
    if (!box || !core) return;
    const kicker = box.querySelector('.v40-kicker span:first-child');
    if (kicker) kicker.textContent = hierarchyOf(data) ? 'TRADITIONAL CORE · HIERARCHY V8' : 'TRADITIONAL CORE · STRICT V7';
    const grade = box.querySelector('.v40-grade');
    if (grade) grade.textContent = gradeOf(data).label;
  }

  function render() {
    const data = latestHorary;
    const core = coreOf(data);
    const result = $('astroHoraryResult');
    const anchor = $('luneaHoraryTraditionalCoreV40') || result?.querySelector('.horary-summary');
    if (!data || !core || !result?.classList.contains('show') || !anchor) return;
    addStyle();
    patchV40Labels(core, data);

    let box = $(BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = BOX_ID;
      anchor.insertAdjacentElement('afterend', box);
    }

    const j = data.judgment_support || {};
    const hierarchy = hierarchyOf(data) || {};
    const moon = j.moon_relevance_v7 || core.moon_relevance_v7 || {};
    const moonEvent = hierarchy.moon_event_testimony_v8 || core.moon_event_testimony_v8 || {};
    const obstructions = core.confirmed_obstructions_v7 || [];
    const action = hierarchy.action_state_v8 || core.action_state_v8 || {};
    const intention = hierarchy.intention_reception_v8 || core.intention_reception_v8 || {};
    const overall = hierarchy.overall_ko_v8 || core.overall_ko_v8 || '';
    const grade = gradeOf(data);
    const rows = dignityRows(data);
    const dignityHtml = rows.length ? rows.map(row => {
      const p = row.profile || {};
      return `<p><b>${esc(row.label)} · ${esc(row.ruler)}</b> — ${esc(p.label_ko || '상태 미확인')} · 점수 ${esc(p.score ?? '—')}</p>`;
    }).join('') : '<p>질문축 존귀 정보 없음</p>';

    box.innerHTML = `
      <div class="v41-head"><span>${hierarchy.version ? 'JUDGMENT HIERARCHY · V8' : 'BALANCE GUARD · V7'}</span><span class="v41-grade">${esc(grade.label)}</span></div>
      <div class="v41-grid">
        <div class="v41-cell"><small>실제 사건·행동 근거</small><b>${esc(action.label_ko || 'V8 사건 판정 없음')}</b></div>
        <div class="v41-cell"><small>의향·수용성</small><b>${esc(intention.label_ko || 'V8 수용성 판정 없음')}</b></div>
        <div class="v41-cell"><small>Moon(달) 사건축</small><b>${esc(moonEvent.label_ko || moon.label_ko || '별도 판정 없음')}</b></div>
        <div class="v41-cell"><small>확인된 선행 방해</small><b>${obstructions.length ? `${obstructions.length}건 · 성사 근거와 별도 표시` : '없음'}</b></div>
      </div>
      ${overall ? `<div class="v41-note"><b>판정 상태</b> · ${esc(overall)}</div>` : ''}
      <div class="v41-dignity"><p><strong>Essential Dignity(본질적 존귀) · 질문축</strong></p>${dignityHtml}</div>
      <div class="v41-note">V8에서는 D를 자동 NO로 읽지 않아. Reception은 의향·수용성이고 사건 성사각과 분리한다. Moon도 단순 non-VOC나 질문자 쪽 적용만으로 승격하지 않고, 백엔드가 대상/파생 사건 주인행성으로의 실제 다음 주요 적용각을 확인한 경우에만 C급 공동 시그니피케이터 근거로 사용해.</div>`;
  }

  function dignityPrompt(data) {
    return dignityRows(data).map(row => {
      const p = row.profile || {};
      return `- ${row.label} ${row.ruler}: ${p.label_ko || 'unknown'} · classification=${p.classification || 'unknown'} · score=${p.score ?? '—'}`;
    }).join('\n') || '- 해당 없음';
  }

  function promptAddon(data) {
    const core = coreOf(data);
    if (!core) return '';
    const j = data.judgment_support || {};
    const hierarchy = hierarchyOf(data) || {};
    const grade = gradeOf(data);
    const moon = j.moon_relevance_v7 || core.moon_relevance_v7 || {};
    const moonEvent = hierarchy.moon_event_testimony_v8 || core.moon_event_testimony_v8 || {};
    const action = hierarchy.action_state_v8 || core.action_state_v8 || {};
    const intention = hierarchy.intention_reception_v8 || core.intention_reception_v8 || {};
    const obstructions = core.confirmed_obstructions_v7 || [];
    const route = j.route_contract_v7 || {};
    const bias = j.bias_guard_v8 || j.bias_guard_v7 || {};
    const hasV8 = !!(j.traditional_core_v8 || hierarchy.version);

    return `\n\n[HORARY BALANCE · 최종 판정 근거 · ${hasV8 ? 'JUDGMENT V8' : 'STRICT V7'}]\n${hasV8 ? '[TRADITIONAL CORE V8 · authoritative]\n' : ''}[TRADITIONAL CORE V7 · authoritative]\n[TRADITIONAL CORE V6 · authoritative]\n- ${hasV8 ? 'V8 judgment block이 V7/V6 해석 블록보다 우선한다. V7/V6 표시는 계산 provenance와 중복 삽입 차단용이다.' : '이 V7 블록이 V6/V3.1 구형 해석 블록보다 우선한다.'}\n- qualified evidence: ${grade.code} · ${grade.label}\n- V8 overall state: ${hierarchy.overall_state_v8 || core.overall_state_v8 || 'not_available'} · ${hierarchy.overall_ko_v8 || core.overall_ko_v8 || ''}\n- action/event state: ${action.state || 'not_available'} · ${action.label_ko || ''}\n- intention/reception state: ${intention.state || 'not_available'} · ${intention.label_ko || ''}\n- Moon event testimony: confirmed=${!!moonEvent.confirmed} · target=${moonEvent.target_role || 'none'} · tone=${moonEvent.tone || 'none'} · ${moonEvent.label_ko || ''}\n- Moon relevance V7: ${moon.status || 'unknown'} · question_relevant=${!!moon.question_relevant} · ${moon.label_ko || ''}\n- confirmed obstruction count: ${obstructions.length}\n- route contract: topic=${route.topic || data.question?.topic || '—'} · expected=${route.quesited_house_expected ?? '—'}H/${route.event_house_expected ?? '—'}H · actual=${route.quesited_house_actual ?? '—'}H/${route.event_house_actual ?? '—'}H · matches=${route.matches_spec ?? '—'}\n\n[Essential Dignity V7 · 질문축]\n${dignityPrompt(data)}\n\n[V8/V7 판정 규칙]\n1. authoritative V8가 있으면 qualified_evidence_grade_v8과 action/intention state를 최종 해설의 기준으로 사용한다. AI가 자체 점수로 다시 판정하지 않는다.\n2. D는 자동 NO가 아니다. D/receptive_but_unperfected는 '수용성·의향 근거는 있으나 사건 성사각은 확인되지 않음'으로 읽고, 긍정 확정도 부정 확정도 과장하지 않는다.\n3. Reception은 Perfection 대체재가 아니다. 강한 상호 reception도 실제 사건 성사로 자동 승격하지 않는다.\n4. Moon은 백엔드 V8의 moon_event_testimony_v8.confirmed=true이고 target_role이 quesited/event일 때만 C급 공동 시그니피케이터 사건 근거로 인정한다.\n5. Moon이 VOC가 아니라는 이유만으로 Moon support=YES로 판정하지 않는다. Moon→querent only나 질문과 무관한 움직임도 사건 성사로 승격하지 않는다.\n6. direct Perfection과 confirmed Prohibition/Frustration/Refranation이 함께 있으면 둘 다 사실로 유지한다. 성사 근거를 지우지도, 방해를 숨긴 채 단순 YES로 압축하지도 않는다.\n7. square/opposition은 과정의 마찰을 뜻할 수 있지만 유효 applying perfection 자체를 자동 NO로 뒤집지 않는다.\n8. domicile/exaltation뿐 아니라 triplicity/term/face도 본질적 존귀 정보로 표시한다. 소존귀가 있는 행성을 단순 Peregrine으로 부르지 않는다.\n9. Dignity/Debility는 행동능력·상태·실행 품질의 보조층이며 사건 성립 여부를 단독 결정하지 않는다.\n10. route_contract_v7.matches_spec가 false면 해석을 진행하지 말고 하우스 라우팅 불일치를 계산 경고로 명시한다.\n11. direct/indirect/derived event/Moon/reception/obstruction을 한 문장 YES/NO로 뭉개지 말고 단계별로 보고한다.\n12. ${JSON.stringify(bias)}\n`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_V41_FETCH__) return;
    W.__LUNEA_HORARY_V41_FETCH__ = true;
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
              if (part.text.includes('[TRADITIONAL CORE V8 · authoritative]') || part.text.includes('[TRADITIONAL CORE V7 · authoritative]')) return;
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
            W.__LUNEA_LAST_HORARY_V41__ = data;
            schedule();
          }).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      render();
    });
  }

  function boot() {
    addStyle();
    installFetchBridge();
    new MutationObserver(schedule).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
    [150,450,1000,1800].forEach(ms => setTimeout(schedule, ms));
    W.LUNEA_HORARY_BALANCE_GUARD_V41 = Object.freeze({version:RELEASE,coreOf,hierarchyOf,gradeOf,promptAddon,render});
    console.info('☿ LUNEA Horary Balance Guard V41.1 · V8 hierarchy loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
