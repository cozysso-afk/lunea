'use strict';

/* LUNEA HORARY BALANCE V19.3 · UI / topic-routing companion for API Balance V3. */
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_BALANCE_V19_UI__) return;
  W.__LUNEA_HORARY_BALANCE_V19_UI__ = true;

  const EXTRA_TOPICS = {
    friend: ['친구·지인·커뮤니티', /친구|지인|동창|모임|커뮤니티|동호회|친분/],
    travel: ['여행·유학·장거리 이동', /여행|유학|출국|입국|해외|비행|장거리\s*이동/],
    contract: ['계약·협상', /계약|협상|서명|합의서|제안서|거래\s*성사/],
    purchase: ['구매·소유', /구매|구입|살까|사도\s*될|물건|제품|자동차\s*구매/],
    communication: ['문서·소식·일반 연락', /문서|우편|소식|통지|공지|결과\s*통보/]
  };

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

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

  function inferTopic(question) {
    const q = String(question || '');
    // Route by the SUBJECT first, then by a generic action such as "연락".
    // Otherwise "친구가 연락할까", "시험 결과 연락", "회사 연락" can all
    // collapse into the generic 7H/contact route even though their houses differ.
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

  function syncTopic() {
    ensureOptions();
    const input = document.getElementById('astroHoraryQuestion');
    const select = document.getElementById('astroHoraryTopic');
    if (!input || !select) return;
    if (select.value !== 'general' && !select.dataset.luneaAutoTopicV19) return;
    const next = inferTopic(input.value);
    if (select.querySelector(`option[value="${next}"]`)) {
      select.value = next;
      if (next !== 'general') select.dataset.luneaAutoTopicV19 = '1';
      else delete select.dataset.luneaAutoTopicV19;
    }
  }

  function ensureStyle() {
    if (document.getElementById('luneaHoraryV19UiStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryV19UiStyle';
    style.textContent = `
      #luneaHoraryBalanceEvidence{display:none!important}
      #luneaHoraryBalanceEvidenceV19{margin-top:8px;padding:12px;border-radius:14px;border:1px solid rgba(124,211,255,.22);background:linear-gradient(145deg,rgba(124,211,255,.055),rgba(189,164,248,.07))}
      #luneaHoraryBalanceEvidenceV19 .hv19-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      #luneaHoraryBalanceEvidenceV19 .hv19-k{font-size:9px;font-weight:850;letter-spacing:1.05px;color:#c9eaff}
      #luneaHoraryBalanceEvidenceV19 .hv19-score{font-size:8.7px;color:#9693a8;white-space:nowrap}
      #luneaHoraryBalanceEvidenceV19 .hv19-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px}
      #luneaHoraryBalanceEvidenceV19 .hv19-col{padding:8px;border-radius:10px;background:rgba(5,7,18,.24);border:1px solid rgba(210,220,255,.08);min-width:0}
      #luneaHoraryBalanceEvidenceV19 b{display:block;margin-bottom:4px;font-size:10px;color:#f0edf9}
      #luneaHoraryBalanceEvidenceV19 p{margin:3px 0;font-size:9.7px;line-height:1.48;color:#aaa7ba}
      #luneaHoraryBalanceEvidenceV19 .sup p::before{content:'＋ ';color:#9de4c1}.mov p::before{content:'↗ ';color:#9ddcff}.lim p::before{content:'· ';color:#e5b9d2}
      #luneaHoraryBalanceEvidenceV19 .empty{color:#777587!important}
      @media(max-width:520px){#luneaHoraryBalanceEvidenceV19 .hv19-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderV3() {
    const data = W.__LUNEA_LAST_HORARY_BALANCE_V18__;
    const balance = data?.judgment_support?.balance_v3;
    const result = document.getElementById('astroHoraryResult');
    const summary = result?.querySelector('.horary-summary');
    if (!balance || !summary) return;

    const heading = summary.querySelector('h4');
    if (heading && balance.headline_ko) heading.textContent = balance.headline_ko;

    let box = document.getElementById('luneaHoraryBalanceEvidenceV19');
    if (!box) {
      box = document.createElement('div');
      box.id = 'luneaHoraryBalanceEvidenceV19';
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
    const rows = (arr, empty) => arr.length ? arr.map(x => `<p>${esc(x)}</p>`).join('') : `<p class="empty">${empty}</p>`;
    box.innerHTML = `<div class="hv19-top"><span class="hv19-k">HORARY EVIDENCE · BALANCE V3</span><span class="hv19-score">${esc(score)}</span></div><div class="hv19-grid"><div class="hv19-col sup"><b>성사·수용 근거</b>${rows(support,'뚜렷한 지지 근거 없음')}</div><div class="hv19-col mov"><b>전개·움직임</b>${rows(movement,'별도 전개 근거 없음')}</div><div class="hv19-col lim"><b>제한·마찰</b>${rows(limits,'핵심 제한 근거 없음')}</div></div>`;
  }

  function bind() {
    ensureOptions();
    const q = document.getElementById('astroHoraryQuestion');
    const select = document.getElementById('astroHoraryTopic');
    const run = document.getElementById('astroHoraryRun');
    if (q && !q.dataset.hv19Bound) { q.dataset.hv19Bound='1'; q.addEventListener('input', syncTopic); }
    if (select && !select.dataset.hv19Bound) {
      select.dataset.hv19Bound='1';
      select.addEventListener('change', () => { delete select.dataset.luneaAutoTopicV19; });
    }
    if (run && !run.dataset.hv19Bound) { run.dataset.hv19Bound='1'; run.addEventListener('click', syncTopic, true); }
  }

  function boot() {
    ensureStyle(); bind();
    [80,300,800,1600].forEach(ms => setTimeout(() => { bind(); syncTopic(); renderV3(); }, ms));
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued=false; bind(); renderV3(); });
    });
    observer.observe(document.documentElement,{subtree:true,childList:true});
    W.LUNEA_HORARY_TOPIC_V19 = {version:19.3,inferTopic};
    console.info('☿ LUNEA Horary Balance V19.3 UI loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
