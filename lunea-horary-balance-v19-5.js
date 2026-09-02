'use strict';

/*
  LUNEA HORARY BALANCE V19.5
  ==========================
  Single frontend bridge for Horary Balance V3.1 with V3 fallback.

  - Routes by question subject before generic actions such as contact.
  - A manual topic selection always wins until the question itself changes.
  - Captures /v1/horary once and renders Balance V3.1 evidence once.
  - Adds only the newest available Balance evidence to the single-Horary Gemini prompt.
  - Keeps V3 fallback compatibility while V3.1 is rolled out.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_BALANCE_V195__) return;
  W.__LUNEA_HORARY_BALANCE_V195__ = true;

  const EXTRA_TOPICS = {
    friend: ['친구·지인·커뮤니티', /친구|지인|동창|모임|커뮤니티|동호회|친분/],
    travel: ['여행·유학·장거리 이동', /여행|유학|출국|입국|해외|비행|장거리\s*이동/],
    contract: ['계약·협상', /계약|협상|서명|합의서|제안서|거래\s*성사/],
    purchase: ['구매·소유', /구매|구입|살까|사도\s*될|물건|제품|자동차\s*구매/],
    communication: ['문서·소식·일반 연락', /문서|우편|소식|통지|공지|결과\s*통보/]
  };

  let latestHorary = null;
  let lastQuestion = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function inferTopic(question) {
    const q = String(question || '');
    if (/법률|소송|재판|판결|고소|계약\s*분쟁/.test(q)) return 'legal';
    if (/재회|다시\s*만나|관계\s*회복|구남친|구여친/.test(q)) return 'reconciliation';
    if (EXTRA_TOPICS.contract[1].test(q)) return 'contract';
    if (EXTRA_TOPICS.friend[1].test(q)) return 'friend';
    if (EXTRA_TOPICS.travel[1].test(q)) return 'travel';
    if (EXTRA_TOPICS.purchase[1].test(q)) return 'purchase';
    if (/시험|합격|불합격|면접|성적|점수/.test(q)) return 'exam';
    if (/이직|퇴사|직장|회사|승진|커리어|업무/.test(q)) return 'career';
    if (/주식|코인|매수|매도|익절|손절|종목|투자/.test(q)) return 'stock';
    if (/돈|금전|재물|수입|지출|대출|재정/.test(q)) return 'money';
    if (/집|이사|부동산|토지|가족/.test(q)) return 'home';
    if (/건강|회복|질병|병원|치료|수술/.test(q)) return 'health';
    if (EXTRA_TOPICS.communication[1].test(q)) return 'communication';
    if (/연락|카톡|메시지|답장|전화|DM|디엠/.test(q)) return 'contact';
    if (/연애|호감|썸|사귀|데이트|상대방/.test(q)) return 'relationship';
    return 'general';
  }

  function ensureOptions() {
    const select = document.getElementById('astroHoraryTopic');
    if (!select) return;
    Object.entries(EXTRA_TOPICS).forEach(([value, [label]]) => {
      if (select.querySelector(`option[value="${value}"]`)) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function syncTopic() {
    ensureOptions();
    const input = document.getElementById('astroHoraryQuestion');
    const select = document.getElementById('astroHoraryTopic');
    if (!input || !select) return;

    const q = String(input.value || '').trim();
    if (q !== lastQuestion) {
      lastQuestion = q;
      delete select.dataset.luneaTopicManualV195;
    }
    if (select.dataset.luneaTopicManualV195 === '1') return;

    const next = inferTopic(q);
    if (select.querySelector(`option[value="${next}"]`)) {
      select.value = next;
      select.dataset.luneaAutoTopicV195 = '1';
    }
  }

  function getBalance(data = latestHorary) {
    return data?.judgment_support?.balance_v31
      || data?.judgment_support?.balance_v3
      || data?.judgment_support?.balance_v2
      || null;
  }

  function isV31(balance) {
    return String(balance?.version || '').includes('V3_1')
      || !!balance?.reception_v31
      || !!balance?.indirect_perfection
      || !!balance?.confirmed_obstructions;
  }

  function ensureStyle() {
    if (document.getElementById('luneaHoraryV195Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryV195Style';
    style.textContent = `
      #luneaHoraryBalanceEvidence,#luneaHoraryBalanceEvidenceV19,#luneaHoraryBalanceEvidenceV194{display:none!important}
      #luneaHoraryBalanceEvidenceV195{margin-top:8px;padding:12px;border-radius:14px;border:1px solid rgba(124,211,255,.22);background:linear-gradient(145deg,rgba(124,211,255,.055),rgba(189,164,248,.07))}
      #luneaHoraryBalanceEvidenceV195 .hv195-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      #luneaHoraryBalanceEvidenceV195 .hv195-k{font-size:9px;font-weight:850;letter-spacing:1.05px;color:#c9eaff}
      #luneaHoraryBalanceEvidenceV195 .hv195-score{font-size:8.7px;color:#9693a8;white-space:nowrap}
      #luneaHoraryBalanceEvidenceV195 .hv195-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px}
      #luneaHoraryBalanceEvidenceV195 .hv195-col{padding:8px;border-radius:10px;background:rgba(5,7,18,.24);border:1px solid rgba(210,220,255,.08);min-width:0}
      #luneaHoraryBalanceEvidenceV195 b{display:block;margin-bottom:4px;font-size:10px;color:#f0edf9}
      #luneaHoraryBalanceEvidenceV195 p{margin:3px 0;font-size:9.7px;line-height:1.48;color:#aaa7ba}
      #luneaHoraryBalanceEvidenceV195 .sup p::before{content:'＋ ';color:#9de4c1}.mov p::before{content:'↗ ';color:#9ddcff}.lim p::before{content:'· ';color:#e5b9d2}
      #luneaHoraryBalanceEvidenceV195 .empty{color:#777587!important}
      #luneaHoraryBalanceEvidenceV195 .hv195-detail{margin-top:8px;padding:8px;border-radius:10px;border:1px solid rgba(189,164,248,.13);background:rgba(189,164,248,.035)}
      #luneaHoraryBalanceEvidenceV195 .hv195-detail p{font-size:9.3px}
      @media(max-width:520px){#luneaHoraryBalanceEvidenceV195 .hv195-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function v31DetailRows(balance) {
    if (!isV31(balance)) return [];
    const out = [];
    const reception = balance.reception_v31 || {};
    if (reception.label_ko && reception.grade !== 'none') {
      const a = reception.a_received_by_b || {};
      const b = reception.b_received_by_a || {};
      const parts = [];
      if ((a.dignities_ko || []).length) parts.push(`${a.guest || 'A'}→${a.receiver || 'B'}: ${(a.dignities_ko || []).join('/')}`);
      if ((b.dignities_ko || []).length) parts.push(`${b.guest || 'B'}→${b.receiver || 'A'}: ${(b.dignities_ko || []).join('/')}`);
      out.push(`리셉션: ${reception.label_ko}${parts.length ? ` · ${parts.join(' · ')}` : ''}`);
    }
    const indirect = balance.indirect_perfection || {};
    const translation = indirect.translation_of_light || [];
    const collection = indirect.collection_of_light || [];
    if (translation.length) {
      const row = translation[0];
      out.push(`Translation of Light: ${row.translator_ko || row.translator} · ${row.from_ko || row.from} → ${row.to_ko || row.to}${row.frictional ? ' · 마찰 포함' : ''}`);
    }
    if (collection.length) {
      const row = collection[0];
      out.push(`Collection of Light: ${row.collector_ko || row.collector}${row.frictional ? ' · 마찰 포함' : ''}`);
    }
    const obs = balance.confirmed_obstructions || {};
    (obs.prohibition_or_frustration || []).slice(0,2).forEach(row => {
      const label = row.type === 'prohibition' ? 'Prohibition' : 'Frustration';
      out.push(`${label}: ${row.intervening_ko || row.intervening || '제3행성'} · 주 성사각보다 ${row.days_before_main ?? '?'}일 먼저 개입`);
    });
    if (obs.refranation) {
      const row = obs.refranation;
      out.push(`Refranation: ${row.body_ko || row.body || '주인행성'} · 정확각 전 정지/역행 전환`);
    }
    return out;
  }

  function renderBalance() {
    const balance = getBalance();
    const result = document.getElementById('astroHoraryResult');
    const summary = result?.querySelector('.horary-summary');
    if (!balance || !summary) return;

    const heading = summary.querySelector('h4');
    if (heading && balance.headline_ko) heading.textContent = balance.headline_ko;

    let box = document.getElementById('luneaHoraryBalanceEvidenceV195');
    if (!box) {
      box = document.createElement('div');
      box.id = 'luneaHoraryBalanceEvidenceV195';
      summary.insertAdjacentElement('afterend', box);
    }

    const support = (balance.supporting_evidence_ko || []).filter(Boolean);
    const movement = (balance.movement_evidence_ko || []).filter(Boolean);
    const limits = (balance.constraints_ko || []).filter(Boolean);
    const details = v31DetailRows(balance);
    const versionLabel = isV31(balance) ? 'BALANCE V3.1' : 'BALANCE V3';
    const score = Number.isFinite(Number(balance.support_score))
      ? `근거 ${Number(balance.support_score).toFixed(1)} · 제한 ${Number(balance.constraint_score || 0).toFixed(1)}`
      : '근거 구조 판정';
    const sig = JSON.stringify([balance.version, balance.tier, support, movement, limits, details, score]);
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    const rows = (arr, empty) => arr.length
      ? arr.map(x => `<p>${esc(x)}</p>`).join('')
      : `<p class="empty">${empty}</p>`;

    box.innerHTML = `<div class="hv195-top"><span class="hv195-k">HORARY EVIDENCE · ${versionLabel}</span><span class="hv195-score">${esc(score)}</span></div><div class="hv195-grid"><div class="hv195-col sup"><b>성사·수용 근거</b>${rows(support,'뚜렷한 지지 근거 없음')}</div><div class="hv195-col mov"><b>전개·움직임</b>${rows(movement,'별도 전개 근거 없음')}</div><div class="hv195-col lim"><b>제한·마찰</b>${rows(limits,'핵심 제한 근거 없음')}</div></div>${details.length ? `<div class="hv195-detail"><b>V3.1 전통 세부 판정</b>${rows(details,'')}</div>` : ''}`;
  }

  function promptAddon(data) {
    const balance = getBalance(data);
    if (!balance) return '';
    const v31 = isV31(balance);
    const label = v31 ? 'V3.1' : 'V3';
    const support = (balance.supporting_evidence_ko || []).map(x => `- ${x}`).join('\n') || '- 없음';
    const movement = (balance.movement_evidence_ko || []).map(x => `- ${x}`).join('\n') || '- 없음';
    const limits = (balance.constraints_ko || []).map(x => `- ${x}`).join('\n') || '- 없음';
    const eventRows = (balance.event_connections || []).map(row => {
      const p = row?.perfection || {};
      const r = row?.reception || {};
      return `- ${row.label}: ${row.a} ↔ ${row.b} · ${p.reason_ko || '별도 성사각 없음'} · reception=${!!r.has_reception}`;
    }).join('\n') || '- 없음';
    const moonRows = (balance.moon_relevant_next_aspects || []).map(x =>
      `- Moon → ${x.body_ko || x.body} ${x.aspect_ko || x.aspect} · ${x.time_local || ''}`
    ).join('\n') || '- 없음';
    const potential = (balance.potential_interventions || []).map(x =>
      `- ${x.intervening_ko || x.intervening || '제3행성'} → ${x.target_ko || x.target || '관련 행성'} ${x.aspect_ko || x.aspect || ''} · potential_only · 확정 prohibition 아님`
    ).join('\n') || '- 없음';

    const reception = balance.reception_v31 || {};
    const receptionRows = v31 ? [
      `- grade: ${reception.grade || 'none'} · ${reception.label_ko || '리셉션 없음'} · weight=${reception.weight ?? 0}`,
      `- A received by B: ${(reception.a_received_by_b?.dignities_ko || []).join(', ') || '없음'}`,
      `- B received by A: ${(reception.b_received_by_a?.dignities_ko || []).join(', ') || '없음'}`
    ].join('\n') : '- V3 fallback';

    const indirect = balance.indirect_perfection || {};
    const translationRows = (indirect.translation_of_light || []).map(x =>
      `- translator=${x.translator_ko || x.translator} · from=${x.from_ko || x.from} · to=${x.to_ko || x.to} · frictional=${!!x.frictional}`
    ).join('\n') || '- 없음';
    const collectionRows = (indirect.collection_of_light || []).map(x =>
      `- collector=${x.collector_ko || x.collector} · q=${x.days_to_querent_contact ?? '?'}d · target=${x.days_to_quesited_contact ?? '?'}d · frictional=${!!x.frictional}`
    ).join('\n') || '- 없음';

    const confirmed = balance.confirmed_obstructions || {};
    const obstructionRows = (confirmed.prohibition_or_frustration || []).map(x =>
      `- ${x.type} · ${x.intervening_ko || x.intervening || '제3행성'} · days_before_main=${x.days_before_main ?? '?'}`
    ).join('\n') || '- 없음';
    const refranation = confirmed.refranation
      ? `- ${confirmed.refranation.body_ko || confirmed.refranation.body} · ${confirmed.refranation.days_from_question ?? '?'}일 후 정지/역행 전환`
      : '- 없음';

    return `\n\n[HORARY BALANCE ${label} · 최종 판정 근거]\n- evidence tier: ${balance.tier || 'unknown'}\n- 균형 결론: ${balance.headline_ko || '—'}\n- support score: ${balance.support_score ?? '—'} / constraint score: ${balance.constraint_score ?? '—'}\n- 주의: 이 점수는 확률이 아니라 근거의 상대적 강도다.\n\n[성사·수용 근거]\n${support}\n\n[전개·움직임 근거]\n${movement}\n\n[제한·마찰 근거]\n${limits}\n\n[사건 보조축 연결]\n${eventRows}\n\n[Moon 관련 다음 적용각]\n${moonRows}\n\n[V3.1 Reception 단계]\n${receptionRows}\n\n[Translation of Light]\n${translationRows}\n\n[Collection of Light]\n${collectionRows}\n\n[확정 Prohibition / Frustration]\n${obstructionRows}\n\n[Refranation]\n${refranation}\n\n[잠재 개입 후보 — 확정 방해와 별도]\n${potential}\n\n[판정 규칙]\n- 직접 주인행성 성사각 부재만으로 자동 NO/불성사를 선언하지 않는다.\n- 현재 오브 밖이어도 별자리 변경 전에 미래 정확각이 완성되면 직접 성사 근거로 인정한다.\n- Translation/Collection이 확정 패턴이면 직접각 부재 상황의 간접 성사 근거로 인정하되 직접 성사각보다 낮은 강도로 평가한다.\n- domicile/exaltation은 major reception, triplicity/term/face는 단계화된 minor reception이다. term/face 단독으로 확정 YES를 만들지 않는다.\n- 같은 주인행성(shared ruler)은 불성사가 아니라 직접 2행성 각으로 판정할 수 없는 구조다.\n- 사건 보조축과 Moon은 보조/전개 근거이며 단독 확정 YES가 아니다.\n- 사분위/충은 정확각이 완성되면 성사 가능성을 지우지 않고 마찰·조건으로 함께 평가한다.\n- potential_only intervention은 확정 prohibition/frustration과 동일시하지 않는다.\n- confirmed prohibition/frustration/refranation은 실제 제한 패턴으로 별도 가중한다.\n- 지지와 제한을 함께 비교해 강한 지지/지지/조건부/유보/약함을 구분한다.`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_V31_FETCH_V195__) return;
    W.__LUNEA_HORARY_V31_FETCH_V195__ = true;
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
              if (/HORARY BALANCE V3(?:\.1)? · 최종 판정 근거/.test(part.text)) return;
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
            W.__LUNEA_LAST_HORARY_BALANCE_V31__ = data;
            W.__LUNEA_LAST_HORARY_BALANCE_V3__ = data;
            setTimeout(renderBalance, 0);
            setTimeout(renderBalance, 120);
          }).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function bind() {
    ensureOptions();
    const q = document.getElementById('astroHoraryQuestion');
    const select = document.getElementById('astroHoraryTopic');
    const run = document.getElementById('astroHoraryRun');
    const overlay = document.getElementById('astroHoraryOverlay');

    if (q && !q.dataset.hv195Bound) {
      q.dataset.hv195Bound = '1';
      q.addEventListener('input', syncTopic);
    }
    if (select && !select.dataset.hv195Bound) {
      select.dataset.hv195Bound = '1';
      select.addEventListener('change', event => {
        if (event.isTrusted) select.dataset.luneaTopicManualV195 = '1';
      });
    }
    if (run && !run.dataset.hv195Bound) {
      run.dataset.hv195Bound = '1';
      run.addEventListener('click', syncTopic, true);
    }
    if (overlay && !overlay.dataset.hv195Bound) {
      overlay.dataset.hv195Bound = '1';
      const overlayObserver = new MutationObserver(() => {
        if (overlay.classList.contains('show')) setTimeout(syncTopic, 0);
      });
      overlayObserver.observe(overlay, {attributes:true, attributeFilter:['class']});
    }
  }

  function boot() {
    ensureStyle();
    installFetchBridge();
    bind();
    [80, 300, 800, 1600].forEach(ms => setTimeout(() => { bind(); syncTopic(); renderBalance(); }, ms));

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        bind();
        renderBalance();
      });
    });
    observer.observe(document.documentElement, {subtree:true, childList:true});

    W.LUNEA_HORARY_TOPIC_V19 = {version:19.5, inferTopic, syncTopic, getBalance};
    console.info('☿ LUNEA Horary Balance V19.5 loaded · V3.1 first / V3 fallback');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
