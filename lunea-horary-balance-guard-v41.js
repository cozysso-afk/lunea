'use strict';

/*
  LUNEA HORARY BALANCE GUARD V41
  ===============================
  Frontend companion for backend Horary Engine V7.

  - Prefer Traditional Core V7 when present while retaining V40/V6 fallback.
  - Do not call a planet peregrine when V7 found triplicity/term/face dignity.
  - Separate Moon movement from question-relevant Moon testimony.
  - Show direct perfection and confirmed obstruction as two simultaneous facts.
  - Inject one V7-authoritative AI prompt block and suppress older V6/V3.1 duplication.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_BALANCE_GUARD_V41__) return;
  W.__LUNEA_HORARY_BALANCE_GUARD_V41__ = true;

  const RELEASE = '41.0';
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
    return j.traditional_core_v7 || j.traditional_core_v6 || null;
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

  function patchV40Labels(core) {
    const box = $('luneaHoraryTraditionalCoreV40');
    if (!box || !core) return;
    const kicker = box.querySelector('.v40-kicker span:first-child');
    if (kicker) kicker.textContent = 'TRADITIONAL CORE · STRICT V7';
    const grade = box.querySelector('.v40-grade');
    if (grade) grade.textContent = core.qualified_evidence_grade_ko_v7 || core.evidence_grade_ko || core.evidence_grade || '—';
  }

  function render() {
    const data = latestHorary;
    const core = coreOf(data);
    const result = $('astroHoraryResult');
    const anchor = $('luneaHoraryTraditionalCoreV40') || result?.querySelector('.horary-summary');
    if (!data || !core || !result?.classList.contains('show') || !anchor) return;
    addStyle();
    patchV40Labels(core);

    let box = $(BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = BOX_ID;
      anchor.insertAdjacentElement('afterend', box);
    }

    const moon = data.judgment_support?.moon_relevance_v7 || core.moon_relevance_v7 || {};
    const obstructions = core.confirmed_obstructions_v7 || [];
    const rows = dignityRows(data);
    const dignityHtml = rows.length ? rows.map(row => {
      const p = row.profile || {};
      return `<p><b>${esc(row.label)} · ${esc(row.ruler)}</b> — ${esc(p.label_ko || '상태 미확인')} · 점수 ${esc(p.score ?? '—')}</p>`;
    }).join('') : '<p>질문축 존귀 정보 없음</p>';

    box.innerHTML = `
      <div class="v41-head"><span>BALANCE GUARD · V7</span><span class="v41-grade">${esc(core.qualified_evidence_grade_ko_v7 || core.evidence_grade_ko || '—')}</span></div>
      <div class="v41-grid">
        <div class="v41-cell"><small>Moon(달) 질문 관련성</small><b>${esc(moon.label_ko || '별도 판정 없음')}</b></div>
        <div class="v41-cell"><small>확인된 선행 방해</small><b>${obstructions.length ? `${obstructions.length}건 · 직접 성사와 별도 표시` : '없음'}</b></div>
      </div>
      <div class="v41-dignity"><p><strong>Essential Dignity(본질적 존귀) · 질문축</strong></p>${dignityHtml}</div>
      <div class="v41-note">Moon이 VOC가 아니라는 사실만으로 질문 관련 지원으로 올리지 않아. Triplicity/Term/Face가 있으면 단순 Peregrine(페레그린)으로 표시하지 않고, Dignity는 행동능력·상태의 질로만 사용해.</div>`;
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
    const moon = j.moon_relevance_v7 || core.moon_relevance_v7 || {};
    const obstructions = core.confirmed_obstructions_v7 || [];
    const route = j.route_contract_v7 || {};
    const bias = j.bias_guard_v7 || {};

    return `\n\n[HORARY BALANCE V3.1 · 최종 판정 근거 · STRICT V7]\n[TRADITIONAL CORE V7 · authoritative]\n[TRADITIONAL CORE V6 · authoritative]\n- 이 V7 블록이 V6/V3.1 구형 해석 블록보다 우선한다. V6 표시는 중복 삽입 차단용 호환 마커다.\n- qualified evidence: ${core.qualified_evidence_grade_v7 || core.evidence_grade || 'NONE'} · ${core.qualified_evidence_grade_ko_v7 || core.evidence_grade_ko || ''}\n- direct aspect tone: ${core.direct_aspect_tone_v7 || 'none'}\n- confirmed obstruction count: ${obstructions.length}\n- Moon relevance: ${moon.status || 'unknown'} · question_relevant=${!!moon.question_relevant} · ${moon.label_ko || ''}\n- route contract: topic=${route.topic || data.question?.topic || '—'} · expected=${route.quesited_house_expected ?? '—'}H/${route.event_house_expected ?? '—'}H · actual=${route.quesited_house_actual ?? '—'}H/${route.event_house_actual ?? '—'}H · matches=${route.matches_spec ?? '—'}\n\n[Essential Dignity V7 · 질문축]\n${dignityPrompt(data)}\n\n[V7 판정 규칙]\n1. Moon이 VOC가 아니라는 이유만으로 Moon support=YES로 판정하지 않는다. 다음 적용각이 질문자/대상/파생 사건 주인행성과 실제로 연결되는지 따로 본다.\n2. Moon의 다음 각이 질문축과 무관하면 '움직임은 있으나 질문 관련 지원 아님'으로 표현한다. 마찰성 각이면 지원과 마찰을 동시에 적는다.\n3. direct Perfection과 confirmed Prohibition/Frustration/Refranation이 함께 있으면 둘 다 사실로 유지한다. A등급을 지우지도 말고, 방해를 숨긴 채 단순 YES로 압축하지도 않는다.\n4. square/opposition은 과정의 마찰을 뜻할 수 있지만 유효 applying perfection 자체를 자동 NO로 뒤집지 않는다.\n5. domicile/exaltation뿐 아니라 triplicity/term/face도 본질적 존귀 정보로 표시한다. 소존귀가 있는 행성을 단순 Peregrine으로 부르지 않는다.\n6. Dignity/Debility는 행동능력·상태·실행 품질의 보조층이며 사건 성립 여부를 단독 결정하지 않는다.\n7. Reception은 Perfection 대체재가 아니며, Early/Late ASC와 VOC도 단독 자동 NO가 아니다.\n8. route_contract_v7.matches_spec가 false면 해석을 진행하지 말고 하우스 라우팅 불일치를 계산 경고로 명시한다.\n9. direct/indirect/derived event/Moon/reception/obstruction을 한 문장 YES/NO로 뭉개지 말고 단계별로 보고한다.\n10. ${JSON.stringify(bias)}\n`;
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
              if (part.text.includes('[TRADITIONAL CORE V7 · authoritative]')) return;
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
    W.LUNEA_HORARY_BALANCE_GUARD_V41 = Object.freeze({version:RELEASE,coreOf,promptAddon,render});
    console.info('☿ LUNEA Horary Balance Guard V41 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
