'use strict';

/*
  LUNEA HORARY BALANCE V18
  ========================
  Presentation/prompt bridge for LUNEA_HORARY_BALANCE_V2 returned by Astro API.

  - Keeps deterministic Horary calculations intact.
  - Replaces the old binary-ish summary with evidence tiers from the API.
  - Shows secondary event/Moon support separately from constraints.
  - Adds the balanced evidence block to the single-Horary Gemini prompt only.
  - Does not force a positive result: weak charts still say direct support is weak.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_BALANCE_V18__) return;
  W.__LUNEA_HORARY_BALANCE_V18__ = true;

  let latestHorary = null;

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function fallbackBalance(data) {
    const j = data?.judgment_support || {};
    const p = j.perfection || {};
    const r = j.reception || {};
    const moon = j.moon_course || {};
    const sig = data?.significators || {};
    const relevant = new Set([
      sig?.querent?.ruler,
      sig?.quesited?.ruler,
      sig?.event?.ruler
    ].filter(Boolean));
    const moonRelevant = (moon.next_aspects || []).filter(x => relevant.has(x?.body));
    const shared = !!r.same_significator || (
      sig?.querent?.ruler && sig?.querent?.ruler === sig?.quesited?.ruler
    );

    if (p.perfects) {
      const hard = ['square','opposition'].includes(j?.primary_connection?.aspect);
      return {
        version:'client-fallback',
        tier: hard ? 'direct_with_friction' : 'direct_support',
        headline_ko: hard
          ? '성사 연결은 있으나 마찰·조건이 큰 차트'
          : '주인행성 사이 직접 성사 연결이 확인됨',
        supporting_evidence_ko:['질문자와 대상 주인행성의 직접 성사각'],
        constraints_ko:hard ? ['직접 성사각이 사분위/충이라 마찰·조건이 큼'] : []
      };
    }
    if (shared) {
      return {
        version:'client-fallback',
        tier:'shared_ruler_open',
        headline_ko:'같은 주인행성 공유 — 단순 예/아니오보다 달·사건축을 함께 봐야 함',
        supporting_evidence_ko:['질문자와 대상이 같은 주인행성을 공유'],
        constraints_ko:[]
      };
    }
    if (r.has_reception || moonRelevant.length) {
      return {
        version:'client-fallback',
        tier:'mixed_support',
        headline_ko:'직접 성사각은 없지만 보조 연결이 남아 있어 조건부로 열려 있음',
        supporting_evidence_ko:[
          ...(r.has_reception ? ['질문자·대상 사이 주요 리셉션'] : []),
          ...(moonRelevant.length ? ['Moon(달)이 관련 주인행성으로 다음 적용각을 형성'] : [])
        ],
        constraints_ko:[]
      };
    }
    return {
      version:'client-fallback',
      tier:'weak_direct_support',
      headline_ko:'현재 차트에서는 직접 성사 근거가 약함',
      supporting_evidence_ko:[],
      constraints_ko:[p.reason_ko || '직접 적용각 근거가 제한적임']
    };
  }

  function getBalance(data=latestHorary) {
    return data?.judgment_support?.balance_v2 || fallbackBalance(data || {});
  }

  function ensureStyles() {
    if (document.getElementById('luneaHoraryBalanceV18Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryBalanceV18Style';
    style.textContent = `
      #luneaHoraryBalanceEvidence{
        margin-top:8px;padding:11px 12px;border-radius:13px;
        border:1px solid rgba(190,210,255,.16);
        background:
          radial-gradient(circle at 15% 0%,rgba(190,168,255,.11),transparent 38%),
          linear-gradient(145deg,rgba(124,211,255,.055),rgba(189,164,248,.065));
      }
      #luneaHoraryBalanceEvidence .hb-kicker{
        color:#c8bdf4;font-size:9.5px;font-weight:800;letter-spacing:1.15px
      }
      #luneaHoraryBalanceEvidence .hb-grid{
        display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:8px
      }
      #luneaHoraryBalanceEvidence .hb-col{
        min-width:0;padding:8px 9px;border-radius:10px;background:rgba(5,7,18,.24);
        border:1px solid rgba(210,220,255,.09)
      }
      #luneaHoraryBalanceEvidence .hb-col b{display:block;margin-bottom:5px;font-size:10.5px;color:#f0edf9}
      #luneaHoraryBalanceEvidence .hb-col p{margin:3px 0;font-size:10px;line-height:1.5;color:#aaa7ba}
      #luneaHoraryBalanceEvidence .hb-support p::before{content:'＋ ';color:#bfe8d8}
      #luneaHoraryBalanceEvidence .hb-limit p::before{content:'· ';color:#d9c3f0}
      #luneaHoraryBalanceEvidence .hb-empty{color:#817f91!important}
      @media(max-width:390px){
        #luneaHoraryBalanceEvidence .hb-grid{grid-template-columns:1fr}
        #luneaHoraryBalanceEvidence .hb-col p{font-size:10.5px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderEvidence() {
    if (!latestHorary) return;
    const result = document.getElementById('astroHoraryResult');
    if (!result) return;
    const summary = result.querySelector('.horary-summary');
    if (!summary) return;

    const balance = getBalance();
    const heading = summary.querySelector('h4');
    if (heading && balance?.headline_ko && heading.textContent !== balance.headline_ko) {
      heading.textContent = balance.headline_ko;
    }

    let box = document.getElementById('luneaHoraryBalanceEvidence');
    if (!box) {
      box = document.createElement('div');
      box.id = 'luneaHoraryBalanceEvidence';
      summary.insertAdjacentElement('afterend', box);
    }

    const support = Array.isArray(balance?.supporting_evidence_ko)
      ? balance.supporting_evidence_ko.filter(Boolean) : [];
    const limits = Array.isArray(balance?.constraints_ko)
      ? balance.constraints_ko.filter(Boolean) : [];
    const signature = JSON.stringify({tier:balance?.tier || '', support, limits});

    if (box.dataset.signature !== signature) {
      box.dataset.signature = signature;
      box.innerHTML = `
        <div class="hb-kicker">HORARY EVIDENCE · BALANCED JUDGMENT</div>
        <div class="hb-grid">
          <div class="hb-col hb-support">
            <b>지지 근거</b>
            ${support.length
              ? support.map(x => `<p>${esc(x)}</p>`).join('')
              : '<p class="hb-empty">뚜렷한 보조 지지 근거 없음</p>'}
          </div>
          <div class="hb-col hb-limit">
            <b>제한·마찰 근거</b>
            ${limits.length
              ? limits.map(x => `<p>${esc(x)}</p>`).join('')
              : '<p class="hb-empty">별도 핵심 제한 근거 없음</p>'}
          </div>
        </div>`;
    }

    const inline = document.querySelector('#luneaHoraryInline b');
    if (inline && balance?.headline_ko) {
      const c = latestHorary?.judgment_support?.primary_connection;
      const text = balance.headline_ko + (c
        ? ` · ${c.aspect_ko || ''} ${c.phase_ko || ''} orb ${c.orb ?? '—'}°`
        : '');
      if (inline.textContent !== text) inline.textContent = text;
    }
  }

  function promptAddon(data) {
    if (!data) return '';
    const balance = getBalance(data);
    const support = (balance?.supporting_evidence_ko || []).map(x => `- ${x}`).join('\n') || '- 없음';
    const limits = (balance?.constraints_ko || []).map(x => `- ${x}`).join('\n') || '- 없음';
    const eventRows = (balance?.event_connections || []).map(row => {
      const p = row?.perfection || {};
      const r = row?.reception || {};
      return `- ${row.label}: ${row.a} ↔ ${row.b} · ${p.reason_ko || '별도 성사각 없음'} · reception=${!!r.has_reception}`;
    }).join('\n') || '- 없음';
    const moonRows = (balance?.moon_relevant_next_aspects || []).map(x =>
      `- Moon → ${x.body_ko || x.body} ${x.aspect_ko || x.aspect} · ${x.time_local || ''}`
    ).join('\n') || '- 없음';

    return `\n\n[HORARY BALANCE V2 · 최종 판정 보정 근거]\n- evidence tier: ${balance?.tier || 'unknown'}\n- 균형 결론: ${balance?.headline_ko || '—'}\n\n[지지 근거]\n${support}\n\n[제한·마찰 근거]\n${limits}\n\n[사건 보조축 연결]\n${eventRows}\n\n[Moon 관련 다음 적용각]\n${moonRows}\n\n[중요 판정 규칙]\n- 직접 주인행성 성사각이 없다는 사실만으로 자동으로 ‘아니오/불성사’라고 결론내리지 않는다.\n- 같은 주인행성(shared ruler)은 불성사가 아니라 직접 2행성 각으로 판정할 수 없는 구조다. Moon·사건축·리셉션을 함께 본다.\n- 사건 보조 주인행성의 성사 연결은 직접 1–7/1–10 연결보다 한 단계 낮은 보조 근거로 사용한다.\n- Moon의 다음 적용각은 사건의 움직임/전개 근거이지 단독 확정 예스가 아니다.\n- 반대로 sign change before perfection, void Moon, hard aspect, potential intervention은 제한 근거로 그대로 남긴다.\n- ‘긍정적으로 맞추기’가 아니라 지지와 제한을 동시에 평가해 강한 지지/지지/조건부/유보/약함을 구분한다.`;
  }

  function installFetchBridge() {
    if (W.__LUNEA_HORARY_BALANCE_FETCH_V18__) return;
    W.__LUNEA_HORARY_BALANCE_FETCH_V18__ = true;
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
              // Single-Horary prompt generated by astro-horary-v1.js. Do not
              // append the last B result to A/B Horary comparison prompts.
              if (!part.text.includes('[HORARY V1 · 질문시각 점성술 계산 결과]')) return;
              if (/HORARY BALANCE V2/.test(part.text)) return;
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
            W.__LUNEA_LAST_HORARY_BALANCE_V18__ = data;
            setTimeout(renderEvidence, 0);
            setTimeout(renderEvidence, 120);
          }).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function boot() {
    ensureStyles();
    installFetchBridge();

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (!latestHorary || scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        renderEvidence();
      });
    });
    observer.observe(document.documentElement, {subtree:true, childList:true});

    console.info('☿ LUNEA Horary Balance V18 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
