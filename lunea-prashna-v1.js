'use strict';

/* LUNEA PRASHNA V1
   Independent Jyotisha question-moment cross-check for the Horary modal.
   It never reuses Tropical Horary positions and never auto-overwrites Horary judgment.
*/
(() => {
  const W = window;
  if (W.__LUNEA_PRASHNA_V1__) return;
  W.__LUNEA_PRASHNA_V1__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const STORAGE_KEY = 'LUNEA_PRASHNA_V1_LAST';
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

  function currentInputs() {
    return {
      question: String($('astroHoraryQuestion')?.value || '').trim(),
      moment: String($('astroHoraryMoment')?.value || ''),
      place: String($('astroHoraryPlace')?.value || '').trim(),
      topic: String($('astroHoraryTopic')?.value || 'general'),
    };
  }

  function signatureOf(input=currentInputs()) {
    return JSON.stringify([input.question, input.moment, input.place, input.topic]);
  }

  function status(text, kind='') {
    const node = $('luneaPrashnaV1Status');
    if (!node) return;
    node.textContent = text;
    node.className = `prashna-v1-status${kind ? ` ${kind}` : ''}`;
  }

  function addStyles() {
    if ($('luneaPrashnaV1Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaPrashnaV1Style';
    s.textContent = `
      #luneaPrashnaV1Card{margin-top:9px;padding:11px;border-radius:14px;border:1px solid rgba(219,179,108,.18);background:linear-gradient(145deg,rgba(190,146,72,.07),rgba(104,78,164,.055))}
      .prashna-v1-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
      .prashna-v1-kicker{color:#d8bd82;font:750 8px/1.3 'Cinzel',serif;letter-spacing:1.15px}
      .prashna-v1-note{margin:4px 0 9px;color:var(--dim);font-size:9.2px;line-height:1.5}
      #luneaPrashnaRunV1{width:100%;min-height:40px;border:1px solid rgba(221,185,112,.25);border-radius:11px;background:linear-gradient(135deg,rgba(206,168,96,.13),rgba(131,93,184,.10));color:#f4ead3;font-size:10px;font-weight:800;touch-action:manipulation}
      #luneaPrashnaRunV1:disabled{opacity:.52}
      .prashna-v1-status{margin:7px 1px 0;color:var(--dim);font-size:9px;line-height:1.5}.prashna-v1-status.ok{color:#c9ead4}.prashna-v1-status.err{color:#ffbdc7}
      .prashna-v1-summary{margin-top:8px;padding:10px;border-radius:12px;border:1px solid rgba(221,185,112,.14);background:rgba(255,255,255,.025)}
      .prashna-v1-summary small{display:block;color:#bca97d;font-size:8px}.prashna-v1-summary b{display:block;margin-top:3px;color:#f2edf5;font-size:11px}.prashna-v1-summary span{display:block;margin-top:4px;color:#9d9aaa;font-size:8.9px;line-height:1.45}
      .prashna-v1-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
      .prashna-v1-cell{min-width:0;padding:8px 9px;border-radius:11px;border:1px solid rgba(213,204,229,.09);background:rgba(255,255,255,.02)}
      .prashna-v1-cell small{display:block;color:#a9a1b7;font-size:7.8px}.prashna-v1-cell b{display:block;margin-top:3px;color:#eee9f3;font-size:9.5px;line-height:1.35}.prashna-v1-cell span{display:block;margin-top:3px;color:#92909d;font-size:8.3px;line-height:1.4}
      .prashna-v1-factors{margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.055)}
      .prashna-v1-factor{margin:3px 0;color:#a7a3ae;font-size:8.6px;line-height:1.45}.prashna-v1-factor strong{color:#ddd4e5;font-weight:700}
      .prashna-v1-warning{margin-top:7px;padding:7px 8px;border-left:3px solid rgba(226,180,94,.5);border-radius:8px;background:rgba(218,173,88,.045);color:#b8b1bd;font-size:8.5px;line-height:1.45}
      @media(max-width:390px){.prashna-v1-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function bandLabel(j) {
    const ko = j?.support_band_ko || '—';
    const score = Number.isFinite(Number(j?.support_score)) ? Number(j.support_score) : '—';
    return `구조적 지원 ${ko} · score ${score}`;
  }

  function localClock(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone:'Asia/Seoul', hour:'2-digit', minute:'2-digit', hour12:false,
      }).format(new Date(iso));
    } catch { return String(iso); }
  }

  function render(data) {
    const out = $('luneaPrashnaV1Result');
    if (!out || !data) return;
    const d1 = data.d1_rashi || {};
    const lagna = d1.lagna || {};
    const planets = d1.planets || {};
    const moon = planets.Moon || {};
    const sun = planets.Sun || {};
    const p = data.panchanga || {};
    const j = data.judgment_support || {};
    const vara = p.vara || {};
    const route = j.route || {};
    const factors = Array.isArray(j.factors) ? j.factors : [];
    const flags = Array.isArray(j.confidence_flags) ? j.confidence_flags : [];

    out.innerHTML = `
      <div class="prashna-v1-summary">
        <small>PRASHNA V1 · SIDEREAL / LAHIRI</small>
        <b>${esc(bandLabel(j))}</b>
        <span>${esc(route.note_ko || '')}<br>Horary Tropical 좌표와 독립 계산 · 자동 YES/NO 없음</span>
      </div>
      <div class="prashna-v1-grid">
        <div class="prashna-v1-cell"><small>LAGNA</small><b>${esc(lagna.rashi)} · ${esc(lagna.rashi_ko)} ${esc(lagna.degree)}°</b><span>${esc(lagna.nakshatra?.name)} · Pada ${esc(lagna.nakshatra?.pada)}</span></div>
        <div class="prashna-v1-cell"><small>MOON</small><b>${esc(moon.rashi)} · ${esc(moon.rashi_ko)} ${esc(moon.degree)}°</b><span>${esc(moon.nakshatra?.name)} · Pada ${esc(moon.nakshatra?.pada)}</span></div>
        <div class="prashna-v1-cell"><small>SUN</small><b>${esc(sun.rashi)} · ${esc(sun.rashi_ko)} ${esc(sun.degree)}°</b><span>Lahiri ${esc(data.ayanamsha?.degree)}°</span></div>
        <div class="prashna-v1-cell"><small>VARA · 일출 경계</small><b>${esc(vara.name)} · ${esc(vara.label_ko)}</b><span>Vedic day ${esc(vara.vedic_day_date)} · 일출 ${esc(localClock(vara.today_sunrise_local))}</span></div>
        <div class="prashna-v1-cell"><small>TITHI / NAKSHATRA</small><b>${esc(p.tithi?.paksha)} ${esc(p.tithi?.paksha_number)} · ${esc(p.nakshatra?.name)}</b><span>Pada ${esc(p.nakshatra?.pada)} · Tithi ${esc(p.tithi?.index)}/30</span></div>
        <div class="prashna-v1-cell"><small>ROUTE</small><b>${esc(route.subject_house)}H → ${esc(route.event_house ?? '—')}H</b><span>${esc(route.subject_lord || '—')} / ${esc(route.event_lord || '—')}</span></div>
      </div>
      ${factors.length ? `<div class="prashna-v1-factors">${factors.map(row => `<div class="prashna-v1-factor"><strong>${row.score > 0 ? '+' : ''}${esc(row.score)}</strong> · ${esc(row.label_ko)} — ${esc(row.detail_ko)}</div>`).join('')}</div>` : ''}
      ${flags.map(row => `<div class="prashna-v1-warning">${esc(row.detail_ko)}</div>`).join('')}
      <div class="prashna-v1-warning">※ 이 support band는 LUNEA_PRASHNA_RULESET_V1의 구조적 보조값이야. Horary 결론을 덮어쓰거나 프라슈나 전체 유파의 보편 판정으로 취급하지 않아.</div>
    `;
    status(`계산 완료 · ${data.moment?.place_resolved || ''} · Vara=${vara.label_ko || '—'}(일출 경계)`, 'ok');
  }

  function clearDisplayed(message='입력이 바뀌어서 이전 Prashna 계산을 사용하지 않아.') {
    state.data = null;
    state.signature = '';
    const out = $('luneaPrashnaV1Result');
    if (out) out.innerHTML = '';
    if ($('luneaPrashnaV1Status')) status(message);
  }

  function restoreIfMatching() {
    const sig = signatureOf();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
    if (saved?.signature === sig && saved?.data?.schema === 'LUNEA_PRASHNA_V1') {
      state.signature = sig;
      state.data = saved.data;
      render(saved.data);
      return true;
    }
    if (state.signature && state.signature !== sig) clearDisplayed();
    return false;
  }

  async function run() {
    if (state.busy) return;
    const input = currentInputs();
    if (!input.question || !input.moment || !input.place) {
      status('호라리 질문 · 질문시각 · 장소를 먼저 확인해.', 'err');
      return;
    }

    const btn = $('luneaPrashnaRunV1');
    state.busy = true;
    if (btn) { btn.disabled = true; btn.textContent = '🕉️ Prashna 계산 중…'; }
    status('같은 질문시각·장소를 Sidereal/Lahiri로 독립 계산 중…');
    const sig = signatureOf(input);

    try {
      const body = JSON.stringify({
        question_text: input.question,
        question_iso: input.moment,
        topic: input.topic,
        timezone: 'Asia/Seoul',
        place: input.place,
      });
      let data;
      if (W.LUNEA_ASTRO_REQUEST_V1?.json) {
        const response = await W.LUNEA_ASTRO_REQUEST_V1.json(`${apiUrl()}/v1/prashna`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body,
        }, {scope:'prashna'});
        data = response?.data;
      } else {
        const response = await fetch(`${apiUrl()}/v1/prashna`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body,
        });
        const parsed = await response.json();
        if (!response.ok) throw new Error(parsed?.detail || `HTTP ${response.status}`);
        data = parsed;
      }
      if (sig !== signatureOf()) throw new Error('입력이 계산 중 변경됨');
      if (data?.schema !== 'LUNEA_PRASHNA_V1') throw new Error('Prashna 응답 형식이 예상과 달라.');
      state.signature = sig;
      state.data = data;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({signature:sig,data,savedAt:new Date().toISOString()})); } catch {}
      render(data);
    } catch (error) {
      if (sig === signatureOf()) status(`Prashna 계산 실패: ${error?.message || error}`, 'err');
    } finally {
      state.busy = false;
      if (btn) { btn.disabled = false; btn.textContent = '🕉️ Prashna 교차계산'; }
    }
  }

  function promptBlock() {
    const data = state.data;
    if (!data || state.signature !== signatureOf()) return '';
    const d1 = data.d1_rashi || {};
    const p = data.panchanga || {};
    const j = data.judgment_support || {};
    const route = j.route || {};
    const factors = (j.factors || []).map(row => `- ${row.score > 0 ? '+' : ''}${row.score} · ${row.label_ko}: ${row.detail_ko}`).join('\n') || '- 없음';
    const flags = (j.confidence_flags || []).map(row => `- ${row.detail_ko}`).join('\n') || '- 없음';
    return `[PRASHNA V1 · 독립 질문시각 Jyotisha 계산]
- 질문 원문: "${data.question?.text || ''}"
- 질문 시각: ${data.moment?.local_iso || ''}
- 질문 장소: ${data.moment?.place_resolved || ''} (${data.moment?.latitude}, ${data.moment?.longitude})
- 황도/아야남샤: Sidereal / Lahiri ${data.ayanamsha?.degree ?? '—'}°
- 하우스: Whole Sign from sidereal Lagna
- Lagna: ${d1.lagna?.rashi || ''} ${d1.lagna?.degree ?? '—'}° · ${d1.lagna?.nakshatra?.name || ''} Pada ${d1.lagna?.nakshatra?.pada || '—'}
- Moon: ${d1.planets?.Moon?.rashi || ''} ${d1.planets?.Moon?.degree ?? '—'}° · ${d1.planets?.Moon?.nakshatra?.name || ''} Pada ${d1.planets?.Moon?.nakshatra?.pada || '—'}
- Sun: ${d1.planets?.Sun?.rashi || ''} ${d1.planets?.Sun?.degree ?? '—'}°
- Vara: ${p.vara?.name || ''}(${p.vara?.label_ko || ''}) · 일출 경계 · Vedic day ${p.vara?.vedic_day_date || ''} · 당일 일출 ${p.vara?.today_sunrise_local || '—'}
- Tithi: ${p.tithi?.paksha || ''} ${p.tithi?.paksha_number || '—'} / 15
- Nakshatra: ${p.nakshatra?.name || ''} Pada ${p.nakshatra?.pada || '—'}
- Yoga/Karana: ${p.yoga?.name || ''} / ${p.karana?.name || ''}
- 질문 라우팅: ${route.note_ko || ''}
- 대상/사건 하우스: ${route.subject_house ?? '—'}H / ${route.event_house ?? '—'}H
- 대상/사건 주인행성: ${route.subject_lord || '—'} / ${route.event_lord || '—'}
- 구조적 지원: ${j.support_band_ko || '—'} · score ${j.support_score ?? '—'}

[Prashna V1 구조 근거]
${factors}

[Prashna V1 신뢰도 플래그]
${flags}

[Prashna 해석 제한]
1. 이 값은 Tropical Horary 좌표를 재사용하지 않은 독립 Sidereal/Lahiri 계산이다.
2. LUNEA_PRASHNA_RULESET_V1은 Whole Sign D1·하우스 주인·고전 Graha Drishti·기본 존귀·Moon 연결을 쓰는 명시적 보조 규칙셋이며 모든 프라슈나 유파의 보편 규칙이 아니다.
3. support band를 자동 YES/NO로 바꾸지 않는다.
4. Horary의 Perfection/Reception/VOC 규칙을 Prashna에 복사하지 않는다.
5. 두 체계가 다르면 충돌을 숨기지 않는다.`;
  }

  function install() {
    const result = $('astroHoraryResult');
    if (!result) return false;
    addStyles();
    if (!$('luneaPrashnaV1Card')) {
      const card = document.createElement('section');
      card.id = 'luneaPrashnaV1Card';
      card.innerHTML = `
        <div class="prashna-v1-head"><div><div class="prashna-v1-kicker">PRASHNA · 독립 교차계산</div><div class="prashna-v1-note">같은 질문·시각·장소를 Sidereal/Lahiri로 별도 계산해. 호라리 결과를 덮어쓰지 않아.</div></div></div>
        <button type="button" id="luneaPrashnaRunV1">🕉️ Prashna 교차계산</button>
        <div class="prashna-v1-status" id="luneaPrashnaV1Status">미계산 · Vara는 현지 일출 경계 기준</div>
        <div id="luneaPrashnaV1Result"></div>`;
      result.insertAdjacentElement('afterend', card);
      $('luneaPrashnaRunV1')?.addEventListener('click', run);
      ['astroHoraryQuestion','astroHoraryMoment','astroHoraryPlace','astroHoraryTopic'].forEach(id => {
        const node = $(id);
        node?.addEventListener('input', () => {
          if (state.signature && state.signature !== signatureOf()) clearDisplayed();
        });
        node?.addEventListener('change', () => {
          if (state.signature && state.signature !== signatureOf()) clearDisplayed();
        });
      });
      const overlay = $('astroHoraryOverlay');
      if (overlay && typeof MutationObserver === 'function') {
        new MutationObserver(() => {
          if (overlay.classList.contains('show')) setTimeout(restoreIfMatching, 0);
        }).observe(overlay, {attributes:true, attributeFilter:['class']});
      }
    }
    restoreIfMatching();
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) clearInterval(timer);
  }, 100);
  install();

  W.LUNEA_PRASHNA_V1 = Object.freeze({
    getCurrent: () => state.data,
    promptBlock,
    isCurrent: () => !!state.data && state.signature === signatureOf(),
    restoreIfMatching,
    run,
  });
})();
