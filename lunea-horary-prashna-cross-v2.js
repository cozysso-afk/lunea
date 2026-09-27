'use strict';

/* LUNEA HORARY ↔ PRASHNA CROSS INTERPRETATION V2
   Comparison-only UI/storage layer. It never recalculates either chart and
   never changes the Horary grade or Prashna support band.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_PRASHNA_CROSS_V2__) return;
  W.__LUNEA_HORARY_PRASHNA_CROSS_V2__ = true;

  const SCHEMA = 'LUNEA_HORARY_PRASHNA_CROSS_V2';
  const STORAGE_KEY = 'LUNEA_HORARY_PRASHNA_CROSS_V2_LAST';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const DEFAULT_API = 'https://lunea-astro-api.onrender.com';
  const $ = id => document.getElementById(id);
  const state = {data:null, signature:'', busy:false};

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function apiUrl() {
    return String(localStorage.getItem(API_KEY) || DEFAULT_API).trim().replace(/\/+$/, '');
  }

  function inputSignature() {
    return JSON.stringify([
      String($('astroHoraryQuestion')?.value || '').trim(),
      String($('astroHoraryMoment')?.value || ''),
      String($('astroHoraryPlace')?.value || '').trim(),
      String($('astroHoraryTopic')?.value || 'general'),
    ]);
  }

  function currentHorary() {
    return W.LUNEA_ASTRO_HORARY_V1?.getCurrent?.() || null;
  }

  function currentPrashna() {
    return W.LUNEA_PRASHNA_V1?.isCurrent?.() ? W.LUNEA_PRASHNA_V1.getCurrent() : null;
  }

  function relationshipLabel(value) {
    return ({agreement:'일치', partial_agreement:'부분 일치', conflict:'충돌', insufficient:'판정 보류'})[value] || '판정 보류';
  }

  function factLabels(rows) {
    return (Array.isArray(rows) ? rows : []).map(row => row?.label_ko).filter(Boolean);
  }

  function addStyles() {
    if ($('luneaHoraryPrashnaCrossV2Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryPrashnaCrossV2Style';
    style.textContent = `
      #luneaHoraryPrashnaCrossV2{margin-top:8px;padding:11px;border-radius:14px;border:1px solid rgba(157,228,193,.18);background:linear-gradient(145deg,rgba(70,126,107,.075),rgba(104,78,164,.055))}
      .cross-v2-kicker{color:#9de4c1;font:750 8px/1.3 'Cinzel',serif;letter-spacing:1.05px}.cross-v2-title{margin:4px 0 8px;color:#f0ebf5;font-size:11px}.cross-v2-note{color:var(--dim);font-size:8.6px;line-height:1.5}
      .cross-v2-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.cross-v2-pane{padding:8px 9px;border-radius:11px;border:1px solid rgba(255,255,255,.075);background:rgba(255,255,255,.02)}
      .cross-v2-pane small{display:block;color:#aaa1b8;font-size:7.8px}.cross-v2-pane b{display:block;margin-top:3px;color:#eee9f3;font-size:9.6px}.cross-v2-pane p{margin:4px 0 0;color:#9c98a5;font-size:8.3px;line-height:1.45}
      .cross-v2-section{margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.055)}.cross-v2-section b{color:#d8d0e1;font-size:8.8px}.cross-v2-section p{margin:3px 0;color:#a7a3ae;font-size:8.5px;line-height:1.45}
      .cross-v2-conflict{color:#ffc2ca!important}.cross-v2-uncertain{color:#c3b58f!important}@media(max-width:390px){.cross-v2-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureContainer() {
    addStyles();
    let node = $('luneaHoraryPrashnaCrossV2');
    if (node) return node;
    const anchor = $('luneaPrashnaV1Card');
    if (!anchor) return null;
    node = document.createElement('section');
    node.id = 'luneaHoraryPrashnaCrossV2';
    node.hidden = true;
    anchor.insertAdjacentElement('afterend', node);
    return node;
  }

  function render(data) {
    const node = ensureContainer();
    if (!node) return;
    if (!data || data.schema !== SCHEMA) {
      node.hidden = true;
      node.innerHTML = '';
      return;
    }
    const h = data.horary || {};
    const p = data.prashna || {};
    const c = data.cross || {};
    const hEvidence = [
      ...factLabels(h.event_perfection_evidence),
      ...factLabels(h.intention_disposition),
      ...factLabels(h.moon_timing_evidence),
    ];
    const pEvidence = factLabels(p.supporting_evidence);
    node.innerHTML = `
      <div class="cross-v2-kicker">HORARY ↔ PRASHNA · CROSS V2</div>
      <div class="cross-v2-title">${esc(relationshipLabel(c.relationship))} · 독립 결론 보존</div>
      <div class="cross-v2-grid">
        <div class="cross-v2-pane"><small>HORARY 결론</small><b>${esc(h.conclusion?.grade || '—')} · ${esc(h.conclusion?.label_ko || '근거 부족')}</b><p>${esc(hEvidence.join(' · ') || '별도 사건/의향 근거 없음')}</p></div>
        <div class="cross-v2-pane"><small>PRASHNA 결론</small><b>${esc(p.conclusion?.label_ko || '미계산')}</b><p>${esc(pEvidence.join(' · ') || '별도 지원 근거 없음')}</p></div>
      </div>
      <div class="cross-v2-section"><b>일치</b>${(c.agreements || []).map(row => `<p>${esc(row)}</p>`).join('') || '<p>명시할 일치 영역 없음</p>'}</div>
      <div class="cross-v2-section"><b>충돌</b>${(c.conflicts || []).map(row => `<p class="cross-v2-conflict">${esc(row)}</p>`).join('') || '<p>명시할 충돌 영역 없음</p>'}</div>
      <div class="cross-v2-section"><b>이유</b><p>${esc(c.explanation || '')}</p></div>
      <div class="cross-v2-section"><b>불확실성</b>${(c.uncertainty || []).map(row => `<p class="cross-v2-uncertain">${esc(row)}</p>`).join('') || '<p>별도 불확실성 없음</p>'}</div>
      <div class="cross-v2-note">두 체계의 점수·등급은 합산하지 않으며 어느 체계도 다른 체계를 덮어쓰지 않아.</div>`;
    node.hidden = false;
  }

  function save(data, signature=inputSignature()) {
    state.data = data;
    state.signature = signature;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({signature,data,savedAt:new Date().toISOString()})); } catch {}
    render(data);
  }

  function clear() {
    state.data = null;
    state.signature = '';
    render(null);
  }

  async function refresh() {
    if (state.busy) return state.data;
    const horary = currentHorary();
    const prashna = currentPrashna();
    if (!horary || !prashna) {
      clear();
      return null;
    }
    const signature = inputSignature();
    state.busy = true;
    try {
      const request = {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({horary, prashna}),
      };
      let data;
      if (W.LUNEA_ASTRO_REQUEST_V1?.json) {
        data = (await W.LUNEA_ASTRO_REQUEST_V1.json(`${apiUrl()}/v1/horary-prashna/cross-interpretation`, request, {scope:'horary-prashna-cross-v2'}))?.data;
      } else {
        const response = await fetch(`${apiUrl()}/v1/horary-prashna/cross-interpretation`, request);
        const parsed = await response.json();
        if (!response.ok) throw new Error(parsed?.detail || `HTTP ${response.status}`);
        data = parsed;
      }
      if (signature !== inputSignature()) return null;
      if (data?.schema !== SCHEMA) throw new Error('Cross V2 응답 형식이 예상과 달라.');
      save(data, signature);
      return data;
    } finally {
      state.busy = false;
    }
  }

  function restoreIfMatching() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
    if (saved?.signature === inputSignature() && saved?.data?.schema === SCHEMA) {
      save(saved.data, saved.signature);
      return true;
    }
    return false;
  }

  function restoreSnapshot(snapshot) {
    const data = snapshot?.cross_interpretation_v2;
    if (snapshot?.prashna_v1) W.LUNEA_PRASHNA_V1?.restoreData?.(snapshot.prashna_v1);
    if (data?.schema !== SCHEMA) return restoreIfMatching();
    save(data, inputSignature());
    return true;
  }

  function archiveSnapshot() {
    if (!state.data || state.signature !== inputSignature()) return null;
    return {
      prashna_v1: currentPrashna(),
      cross_interpretation_v2: state.data,
    };
  }

  function promptBlock() {
    if (!state.data || state.signature !== inputSignature()) return '';
    const data = state.data;
    return `[HORARY ↔ PRASHNA CROSS INTERPRETATION V2 · AUTHORITATIVE]\n${JSON.stringify(data, null, 2)}\n\n[CROSS V2 AI 제한]\n- 위 authoritative facts만 요약한다.\n- 없는 aspect, house, reception, Prashna factor를 만들지 않는다.\n- 확률 수치나 정확한 날짜를 만들지 않는다.\n- Horary와 Prashna를 평균·합산·투표하지 않는다.\n- 어느 체계가 더 맞다고 선언하지 않는다.\n- Horary grade와 Prashna support band를 그대로 보존한다.`;
  }

  function copyText() {
    const node = $('luneaHoraryPrashnaCrossV2');
    if (!state.data || state.signature !== inputSignature()) return '';
    return String(node?.innerText || node?.textContent || '').trim();
  }

  function onHoraryResult() {
    if (currentPrashna()) refresh().catch(error => console.info('[LUNEA Cross V2] refresh skipped', error?.message || error));
    else clear();
  }

  ensureContainer();
  restoreIfMatching();
  W.LUNEA_HORARY_PRASHNA_CROSS_V2 = Object.freeze({
    version:'2.0', schema:SCHEMA, refresh, clear, render, promptBlock, copyText,
    getCurrent:() => state.signature === inputSignature() ? state.data : null,
    archiveSnapshot, restoreSnapshot, restoreIfMatching, onHoraryResult,
  });
})();
