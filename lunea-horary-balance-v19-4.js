'use strict';

/*
  LUNEA HORARY BALANCE V19.4
  ==========================
  Single frontend bridge for Horary Balance V3.

  - Routes by question subject before generic actions such as contact.
  - A manual topic selection always wins until the question itself changes.
  - Captures /v1/horary once and renders Balance V3 evidence once.
  - Adds only Balance V3 evidence to the single-Horary Gemini prompt.
  - Replaces the old V18 + V19 duplicate observer/fetch bridge pair.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_BALANCE_V194__) return;
  W.__LUNEA_HORARY_BALANCE_V194__ = true;

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
      delete select.dataset.luneaTopicManualV194;
    }
    if (select.dataset.luneaTopicManualV194 === '1') return;

    const next = inferTopic(q);
    if (select.querySelector(`option[value="${next}"]`)) {
      select.value = next;
      select.dataset.luneaAutoTopicV194 = '1';
    }
  }

  function getBalance(data = latestHorary) {
    return data?.judgment_support?.balance_v3 || data?.judgment_support?.balance_v2 || null;
  }

  function ensureStyle() {
    if (document.getElementById('luneaHoraryV194Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryV194Style';
    style.textContent = `
      #luneaHoraryBalanceEvidence,#luneaHoraryBalanceEvidenceV19{display:none!important}
      #luneaHoraryBalanceEvidenceV194{margin-top:8px;padding:12px;border-radius:14px;border:1px solid rgba(124,211,255,.22);background:linear-gradient(145deg,rgba(124,211,255,.055),rgba(189,164,248,.07))}
      #luneaHoraryBalanceEvidenceV194 .hv194-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      #luneaHoraryBalanceEvidenceV194 .hv194-k{font-size:9px;font-weight:850;letter-spacing:1.05px;color:#c9eaff}
      #luneaHoraryBalanceEvidenceV194 .hv194-score{font-size:8.7px;color:#9693a8;white-space:nowrap}
      #luneaHoraryBalanceEvidenceV194 .hv194-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px}
      #luneaHoraryBalanceEvidenceV194 .hv194-col{padding:8px;border-radius:10px;background:rgba(5,7,18,.24);border:1px solid rgba(210,220,255,.08);min-width:0}
      #luneaHoraryBalanceEvidenceV194 b{display:block;margin-bottom:4px;font-size:10px;color:#f0edf9}
      #luneaHoraryBalanceEvidenceV194 p{margin:3px 0;font-size:9.7px;line-height:1.48;color:#aaa7ba}
      #luneaHoraryBalanceEvidenceV194 .sup p::before{content:'＋ ';color:#9de4c1}.mov p::before{content:'↗ ';color:#9ddcff}.lim p::before{content:'· ';color:#e5b9d2}
      #luneaHoraryBalanceEvidenceV194 .empty{color:#777587!important}
      @media(max-width:520px){#luneaHoraryBalanceEvidenceV194 .hv194-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderV3() {
    const balance = getBalance();
    const result = document.getElementById('astroHoraryResult');
    const summary = result?.querySelector('.horary-summary');
    if (!balance || !summary) return;

    const heading = summary.querySelector('h4');
    if (heading && balance.headline_ko) heading.textContent = balance.headline_ko;

    let box = document.getElementById('luneaHoraryBalanceEvidenceV194');
    if (!box) {
      box = document.createElement('div');
      box.id = 'luneaHoraryBalanceEvidenceV194';
      summary.insertAdjacentElement('afterend', box);
    }

    const support = (balance.supporting_evidence_ko || []).filter(Boolean);
    const movement = (balance.movement_evidence_ko || []).filter(Boolean);
    const limits = (balance.constraints_ko || []).filter(Boolean);
    const score = Number.isFinite(Number(balance.support_score))
      ? `근거 ${Number(balance.support_score).toFixed(1)} · 제한 ${Number(balance.constraint_score || 0).toFixed(1)}`
      : '근거 구조 판정';
    const sig = JSON.stringify([balance.tier, support, movement, limits, score]);
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    const rows = (arr, empty) => arr.length
      ? arr.map(x => `<p>${esc(x)}</p>`).join('')
      : `<p class="empty">${empty}</p>`;

    box.innerHTML = `<div class="hv194-top"><span class="hv194-k">HORARY EVIDENCE · BALANCE V3</span><span class="hv194-score">${esc(score)}</span></div><div class="hv194-grid"><div class="hv194-col sup"><b>성사·수용 근거</b>${rows(support,'뚜렷한 지지 근거 없음')}</div><div class="hv194-col mov"><b>전개·움직임</b>${rows(movement,'별도 전개 근거 없음')}</div><div class="hv194-col lim"><b>제한·마찰</b>${rows(limits,'핵심 제한 근거 없음')}</div></div>`;
  }

  function promptAddon(data) {
    const balance = getBalance(data);
    if (!balance) return '';
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
    const interventions = (balance.potential_interventions || []).map(x =>
      `- ${x.intervening_ko || x.intervening || '제3행성'} → ${x.target_ko || x.target || '관련 행성'} ${x.aspect_ko || x.aspect || ''} · 확정 prohibition 아님`
    ).join('\n') || '- 없음';

    return `\n\n[HORARY BALANCE V3 · 최종 판정 근거]\n- evidence tier: ${balance.tier || 'unknown'}\n- 균형 결론: ${balance.headline_ko || '—'}\n- support score: ${balance.support_score ?? '—'} / constraint score: ${balance.constraint_score ?? '—'}\n- 주의: 이 점수는 확률이 아니라 근거의 상대적 강도다.\n\n[성사·수용 근거]\n${support}\n\n[전개·움직임 근거]\n${movement}\n\n[제한·마찰 근거]\n${limits}\n\n[사건 보조축 연결]\n${eventRows}\n\n[Moon 관련 다음 적용각]\n${moonRows}\n\n[잠재 개입 후보]\n${interventions}\n\n[판정 규칙]\n- 직접 주인행성 성사각 부재만으로 자동 NO/불성사를 선언하지 않는다.\n- 현재 오브 밖이어도 별자리 변경 전에 미래 정확각이 완성되면 직접 성사 근거로 인정한다.\n- 같은 주인행성(shared ruler)은 불성사가 아니라 직접 2행성 각으로 판정할 수 없는 구조다.\n- 사건 보조축과 Moon은 보조/전개 근거이며 단독 확정 YES가 아니다.\n- 사분위/충은 정확각이 완성되면 성사 가능성을 지우지 않고 마찰·조건으로 함께 평가한다.\n- potential intervention은 확정 prohibition과 동일시하지 않는다.\n- 지지와 제한을 함께 비교해 강한 지지/지지/조건부/유보/약함을 구분한다.`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_V3_FETCH_V194__) return;
    W.__LUNEA_HORARY_V3_FETCH_V194__ = true;
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
              if (/HORARY BALANCE V3/.test(part.text)) return;
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
            W.__LUNEA_LAST_HORARY_BALANCE_V3__ = data;
            setTimeout(renderV3, 0);
            setTimeout(renderV3, 120);
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

    if (q && !q.dataset.hv194Bound) {
      q.dataset.hv194Bound = '1';
      q.addEventListener('input', syncTopic);
    }
    if (select && !select.dataset.hv194Bound) {
      select.dataset.hv194Bound = '1';
      select.addEventListener('change', event => {
        if (event.isTrusted) select.dataset.luneaTopicManualV194 = '1';
      });
    }
    if (run && !run.dataset.hv194Bound) {
      run.dataset.hv194Bound = '1';
      run.addEventListener('click', syncTopic, true);
    }
    if (overlay && !overlay.dataset.hv194Bound) {
      overlay.dataset.hv194Bound = '1';
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
    [80, 300, 800, 1600].forEach(ms => setTimeout(() => { bind(); syncTopic(); renderV3(); }, ms));

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        bind();
        renderV3();
      });
    });
    observer.observe(document.documentElement, {subtree:true, childList:true});

    W.LUNEA_HORARY_TOPIC_V19 = {version:19.4, inferTopic, syncTopic};
    console.info('☿ LUNEA Horary Balance V19.4 loaded · single V3 bridge');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
