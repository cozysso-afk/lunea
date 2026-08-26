'use strict';

/*
  LUNEA HORARY A/B V1
  ==================
  Additive two-person horary comparison layer.

  Principles:
  - A and B are NEVER merged into one 7H target.
  - A and B are two independent horary questions, each with its own question moment.
  - Each chart uses querent=1H and that chart's person=7H via the existing /v1/horary relationship route.
  - Compare only after each chart is judged independently.
  - Horary is not treated as CCTV proof of another person's literal thoughts.
  - Existing single-question Horary V1 calculations remain untouched.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_AB_V1__) return;
  W.__LUNEA_HORARY_AB_V1__ = true;

  const $ = id => document.getElementById(id);
  const DEFAULT_API_URL = 'https://lunea-astro-api.onrender.com';
  const FIXED = {
    A:'오늘 현재 과거 인연 A가 나를 의식하거나 떠올리는 흐름이 있는가? 있다면 그 정서의 성격은 무엇인가?',
    B:'오늘 현재 과거 인연 B가 나를 의식하거나 떠올리는 흐름이 있는가? 있다면 그 정서의 성격은 무엇인가?'
  };
  const dual = { A:null, B:null, ai:'', original:'' };

  const norm = value => String(value || '').normalize('NFKC').replace(/\s+/g,' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function isABQuestion(question) {
    const manual = W.LUNEA_MANUAL_SPREAD_V1?.isRecallTonePairQuestion;
    if (typeof manual === 'function') {
      try { if (manual(question)) return true; } catch {}
    }
    const q = norm(question);
    const pair = /(A\s*(?:와|과|랑|\/|·|및)\s*B|A와B|두\s*(?:사람|명|인연|상대)|2\s*(?:사람|명)|둘|각각)/i.test(q);
    const thought = /(생각하|생각나|떠올|의식하|머릿속|기억하)/i.test(q);
    const emotion = /(감정|정서|마음|결\s*차이|감정의\s*결|호감|그리움|후회|궁금|거리두기)/i.test(q);
    return pair && thought && emotion;
  }

  function apiUrl() {
    return String(localStorage.getItem('LUNEA_ASTRO_API_URL') || DEFAULT_API_URL).trim().replace(/\/+$/,'');
  }

  function seoulNowSeconds() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    }).formatToParts(new Date()).reduce((a,p)=>{ a[p.type]=p.value; return a; },{});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function dignityText(planet) {
    if (!planet) return '—';
    const degree = planet.degree ?? '—';
    return `${planet.name_ko || planet.name || ''} ${planet.sign || ''} ${degree}° · ${planet.house || '—'}H · ${planet.direction || ''} · ${planet.dignity_ko || ''}`.trim();
  }

  function receptionText(r) {
    if (!r) return '—';
    if (r.same_significator) return '같은 주인행성이라 상호 리셉션 별도 판정 없음';
    if (r.mutual_reception) return '상호 리셉션 있음';
    if (r.has_reception) return '한쪽 또는 부분 리셉션 있음';
    return '주요 도머사일·고양 리셉션 없음';
  }

  function conclusionText(data) {
    const j = data?.judgment_support || {};
    const p = j.perfection || {};
    const r = j.reception || {};
    if (p.perfects && r.has_reception) return '성사각 후보와 리셉션이 함께 확인됨';
    if (p.perfects) return '주인행성 사이 성사각 후보가 확인됨';
    if (r.has_reception) return '직접 성사각은 약하지만 리셉션 보조가 있음';
    return '직접 연결을 지지하는 핵심 신호가 뚜렷하지 않음';
  }

  function firstMoonAspect(data) {
    const moon = data?.judgment_support?.moon_course || {};
    if (moon.void_of_course) return 'Void of Course(보이드 오브 코스·공전달)';
    const n = moon.next_aspects?.[0];
    return n ? `${n.body_ko || n.body || '—'} ${n.aspect_ko || '—'} · orb(오브) ${n.orb ?? '—'}°` : '별자리 이탈 전 다음 주요각 없음';
  }

  function addStyles() {
    if ($('luneaHoraryABStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryABStyle';
    style.textContent = `
      #luneaHoraryABPanel{display:none;margin:10px 0;padding:11px;border-radius:14px;background:rgba(124,211,255,.055);border:1px solid rgba(124,211,255,.20)}
      #luneaHoraryABPanel.show{display:block}
      .hab-note{margin:0 0 9px;color:var(--dim);font-size:9.8px;line-height:1.55}
      .hab-question{margin:7px 0;padding:9px;border-radius:11px;background:rgba(255,255,255,.035);border:1px solid rgba(189,164,248,.12)}
      .hab-question b{display:block;margin-bottom:4px;color:#f4effb;font-size:10.5px}.hab-question p{margin:0;color:var(--dim);font-size:9.5px;line-height:1.5}
      .hab-time{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;margin-top:7px}.hab-time input{min-width:0}.hab-time button{white-space:nowrap}
      .hab-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.hab-actions button{flex:1;min-width:110px}
      #luneaHoraryABResult{margin-top:9px}.hab-result{margin-top:7px;padding:10px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(189,164,248,.14);font-size:9.7px;line-height:1.55;color:var(--dim)}
      .hab-result small{display:block;color:#bfeaff;letter-spacing:.5px}.hab-result b{color:#f4effb}.hab-warning{margin-top:7px;padding:8px 9px;border-radius:10px;border-left:3px solid rgba(255,210,125,.7);background:rgba(255,210,125,.055);font-size:9.4px;line-height:1.5;color:#e8dfcb}
      #luneaHoraryABAI{display:none;margin-top:8px;padding:11px;border-radius:12px;background:rgba(189,164,248,.07);border:1px solid rgba(189,164,248,.17);white-space:pre-wrap;font:400 11.5px 'Noto Serif KR',serif;line-height:1.72}
      #luneaHoraryABAI.show{display:block}
      @media(max-width:390px){.hab-time{grid-template-columns:minmax(0,1fr)}.hab-time button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    if ($('luneaHoraryABPanel')) return $('luneaHoraryABPanel');
    const run = $('astroHoraryRun');
    if (!run) return null;

    const panel = document.createElement('div');
    panel.id = 'luneaHoraryABPanel';
    panel.innerHTML = `
      <p class="hab-note"><b>A/B 독립 호라리 모드</b><br>A와 B를 한 차트의 7하우스 대상에 합치지 않아. 아래 두 질문을 각각 따로 확정한 순간으로 계산하고, 두 판정을 끝낸 뒤에만 비교해.</p>
      <div class="hab-question"><b>A 질문</b><p>${esc(FIXED.A)}</p><div class="hab-time"><input id="luneaHoraryABMomentA" type="datetime-local" step="1"><button type="button" class="mini" id="luneaHoraryABNowA">A 지금 확정</button></div></div>
      <div class="hab-question"><b>B 질문</b><p>${esc(FIXED.B)}</p><div class="hab-time"><input id="luneaHoraryABMomentB" type="datetime-local" step="1"><button type="button" class="mini" id="luneaHoraryABNowB">B 지금 확정</button></div></div>
      <p class="hab-note">장소는 위의 ‘그때 있던 장소’를 공통 사용해. A와 B를 실제로 각각 질문으로 마음속에서 확정했을 때 버튼을 눌러. 같은 시각을 복사해 넣으면 차트가 같아져 비교 의미가 약해질 수 있어.</p>
      <div class="hab-actions"><button type="button" class="primary" id="luneaHoraryABRun">☿ A/B 독립 계산</button><button type="button" class="mini" id="luneaHoraryABCompare" disabled>🔮 A/B 비교 해석</button><button type="button" class="mini" id="luneaHoraryABCopy" disabled>📋 전체 복사</button></div>
      <div id="luneaHoraryABResult"></div><div id="luneaHoraryABAI"></div>`;
    run.insertAdjacentElement('afterend', panel);

    $('luneaHoraryABNowA').onclick = () => { $('luneaHoraryABMomentA').value = seoulNowSeconds(); };
    $('luneaHoraryABNowB').onclick = () => { $('luneaHoraryABMomentB').value = seoulNowSeconds(); };
    $('luneaHoraryABRun').onclick = runDual;
    $('luneaHoraryABCompare').onclick = compareAI;
    $('luneaHoraryABCopy').onclick = copyAll;

    const q = $('astroHoraryQuestion');
    q?.addEventListener('input', syncVisibility);
    return panel;
  }

  function syncVisibility() {
    const panel = ensurePanel();
    if (!panel) return;
    const q = norm($('astroHoraryQuestion')?.value || '');
    const visible = isABQuestion(q);
    panel.classList.toggle('show', visible);
    if (visible) dual.original = q;
  }

  async function fetchChart(question, moment, place) {
    const response = await fetch(`${apiUrl()}/v1/horary`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question_text:question, question_iso:moment, topic:'relationship', timezone:'Asia/Seoul', place})
    });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data?.detail || `${response.status} ${response.statusText}`);
    if (data?.schema !== 'LUNEA_HORARY_V1') throw new Error('Horary 응답 형식이 예상과 달라.');
    return data;
  }

  function resultCard(label, data) {
    const sig = data?.significators || {};
    const j = data?.judgment_support || {};
    const c = j.primary_connection;
    const p = j.perfection || {};
    return `<div class="hab-result"><small>${label} · INDEPENDENT HORARY(독립 호라리)</small><b>${esc(conclusionText(data))}</b><br>
      질문 시각: ${esc(data?.moment?.local_iso || '—')}<br>
      질문자 · 1H: ${esc(sig.querent?.ruler || '—')}(${esc(sig.querent?.ruler_ko || '—')}) · ${esc(dignityText(sig.querent?.planet))}<br>
      ${label} · 7H: ${esc(sig.quesited?.ruler || '—')}(${esc(sig.quesited?.ruler_ko || '—')}) · ${esc(dignityText(sig.quesited?.planet))}<br>
      대표 연결: ${c ? `${esc(c.aspect_ko || '—')} · ${esc(c.phase_ko || '—')} · orb(오브) ${c.orb ?? '—'}°` : '별도 연결각 없음'}<br>
      Perfection(퍼펙션·성사각): ${esc(p.reason_ko || '확인되지 않음')}<br>
      Reception(리셉션·수용 관계): ${esc(receptionText(j.reception))}<br>
      Moon(달): ${esc(dignityText(sig.moon))}<br>
      Moon(달)의 다음 적용각: ${esc(firstMoonAspect(data))}</div>`;
  }

  function chartFingerprint(data) {
    return [
      data?.angles?.ASC?.sign, Math.round((data?.angles?.ASC?.degree || 0) * 100),
      data?.significators?.querent?.ruler, data?.significators?.quesited?.ruler,
      data?.judgment_support?.primary_connection?.aspect,
      data?.judgment_support?.primary_connection?.phase_ko
    ].join('|');
  }

  async function runDual() {
    const original = norm($('astroHoraryQuestion')?.value || '');
    if (!isABQuestion(original)) return alert('A/B 두 사람의 현재 의식·감정 비교 질문에서만 사용하는 모드야.');
    const momentA = $('luneaHoraryABMomentA')?.value;
    const momentB = $('luneaHoraryABMomentB')?.value;
    const place = norm($('astroHoraryPlace')?.value || '');
    if (!momentA || !momentB) return alert('A와 B 질문을 각각 확정한 시각을 둘 다 입력해줘.');
    if (!place) return alert('질문 당시 장소를 입력해줘.');

    const btn = $('luneaHoraryABRun');
    btn.disabled = true; btn.textContent = '☿ A/B 각각 계산 중…';
    $('luneaHoraryABResult').textContent = 'A와 B를 서로 다른 질문으로 독립 계산하고 있어…';
    $('luneaHoraryABAI').classList.remove('show'); $('luneaHoraryABAI').textContent = '';
    $('luneaHoraryABCompare').disabled = true; $('luneaHoraryABCopy').disabled = true;

    try {
      const [A,B] = await Promise.all([fetchChart(FIXED.A, momentA, place), fetchChart(FIXED.B, momentB, place)]);
      dual.A = A; dual.B = B; dual.ai = ''; dual.original = original;
      W.LUNEA_HORARY_AB_LAST = {original, momentA, momentB, place, A, B};
      let html = resultCard('A', A) + resultCard('B', B);
      if (chartFingerprint(A) === chartFingerprint(B)) {
        html += '<div class="hab-warning">A/B 차트의 핵심 구조가 사실상 같아. 이 경우 억지로 차이를 만들지 않고 “호라리상 구별 신호가 약함”으로 처리해야 해.</div>';
      }
      html += '<div class="hab-warning">판정 순서: A 독립 판정 → B 독립 판정 → 마지막 비교. 한 차트의 7H 대표 행성을 A/B에게 동시에 배정하지 않아. 또한 이 결과는 상대 머릿속 사실을 증명하는 CCTV가 아니라 점성술적 상징 판정이야.</div>';
      $('luneaHoraryABResult').innerHTML = html;
      $('luneaHoraryABCompare').disabled = false; $('luneaHoraryABCopy').disabled = false;
    } catch (error) {
      dual.A = dual.B = null;
      $('luneaHoraryABResult').textContent = 'A/B 독립 호라리 계산 실패: ' + (error?.message || error);
    } finally {
      btn.disabled = false; btn.textContent = '☿ A/B 독립 계산';
    }
  }

  function compactChart(label, data) {
    const sig = data?.significators || {}, j = data?.judgment_support || {}, c = j.primary_connection, p = j.perfection || {}, moon = j.moon_course || {};
    return `[${label} 독립 호라리]\n질문: ${data?.question?.text || FIXED[label]}\n시각: ${data?.moment?.local_iso || '—'}\n질문자 1H: ${sig.querent?.ruler || '—'}(${sig.querent?.ruler_ko || '—'}) · ${dignityText(sig.querent?.planet)}\n${label} 7H: ${sig.quesited?.ruler || '—'}(${sig.quesited?.ruler_ko || '—'}) · ${dignityText(sig.quesited?.planet)}\n대표 연결: ${c ? `${c.aspect_ko || '—'} · ${c.phase_ko || '—'} · orb ${c.orb ?? '—'}°` : '없음'}\nPerfection(성사각): ${p.reason_ko || '확인되지 않음'}\nReception(리셉션): ${receptionText(j.reception)}\nMoon(달): ${dignityText(sig.moon)}\nMoon 다음 적용각: ${firstMoonAspect(data)}\nVoid of Course(공전달): ${moon.void_of_course ? '해당' : '아님'}\nWarnings: ${(j.warnings || []).map(x=>x.text_ko).join(' / ') || '없음'}`;
  }

  function comparePrompt() {
    return `당신은 Regiomontanus(레지오몬타누스) 하우스와 전통 7행성 체계에 익숙한 숙련된 Horary(호라리·질문시각 점성술) 리더다.\n\n[원 질문]\n${dual.original}\n\n${compactChart('A', dual.A)}\n\n${compactChart('B', dual.B)}\n\n[호라리 구조]\n- A와 B는 서로 다른 독립 호라리 판정이다. 하나의 7하우스 대상에 합치지 않는다.\n- 각 차트에서 질문자는 1하우스, 해당 인연은 7하우스다.\n- A를 먼저 독립 판정하고, B를 따로 독립 판정한 뒤 마지막에만 비교한다.\n- 대표 행성, Moon(달), 적용/분리각, Perfection(성사각), Reception(리셉션·수용 관계), 존귀/손상을 각각 검토한다.\n- 한 차트의 상대 Significator(시그니피케이터·대표 행성)를 A와 B에게 동시에 사용하지 않는다.\n- 두 차트가 사실상 같거나 근거가 비슷하면 차이를 억지로 만들지 말고 “구별 신호가 약하다”고 말한다.\n- “생각하나요?”를 실제 머릿속 사건의 객관적 증명으로 단정하지 않는다. “의식하거나 떠올리는 흐름”의 점성술적 지지/반증으로 표현한다.\n- 연락·재회 여부는 질문하지 않았으므로 자동으로 확장하지 않는다.\n- 어느 사람을 선택하라는 결론으로 바꾸지 않는다.\n- 위 계산값을 수정하거나 새로운 행성 위치·하우스·각·날짜를 지어내지 않는다.\n\n[출력]\n1. A: 의식/회상 흐름과 정서의 성격\n2. B: 의식/회상 흐름과 정서의 성격\n3. A/B 차이: 어느 쪽이 더 강한지보다 “결이 어떻게 다른지” 중심\n4. 불확실성: 호라리로 확인할 수 없는 부분을 명시\n첫 문단에서 비교 결론을 짧게 먼저 말한다.`;
  }

  async function compareAI() {
    if (!dual.A || !dual.B) return alert('먼저 A/B 독립 차트를 계산해줘.');
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) return alert('LUNEA API 설정을 먼저 해줘.');
    const btn = $('luneaHoraryABCompare'); btn.disabled = true; btn.textContent = '🔮 비교 중…';
    const out = $('luneaHoraryABAI'); out.classList.add('show'); out.textContent = 'A와 B를 각각 판정한 뒤 차이를 비교하는 중…';
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:comparePrompt()}]}], generationConfig:{temperature:.38, topP:.86}})
      });
      const data = await res.json(); if (data.error) throw new Error(data.error.message);
      dual.ai = data?.candidates?.[0]?.content?.parts?.[0]?.text || '응답이 비어 있어.';
      out.textContent = dual.ai;
    } catch (error) {
      dual.ai = ''; out.textContent = '[API 오류] ' + (error?.message || error);
    } finally {
      btn.disabled = false; btn.textContent = '🔮 A/B 비교 해석';
    }
  }

  function allText() {
    if (!dual.A || !dual.B) return '';
    return `LUNEA · A/B INDEPENDENT HORARY(독립 호라리 비교)\n\n[원 질문]\n${dual.original}\n\n[구조]\nA와 B를 하나의 7하우스 대상에 합치지 않음. A/B 각각 질문자=1H, 해당 인연=7H로 독립 계산 후 마지막 비교.\n\n${compactChart('A', dual.A)}\n\n${compactChart('B', dual.B)}${dual.ai ? `\n\n[A/B 비교 AI 해석]\n${dual.ai}` : ''}\n\n※ 실제 머릿속 사건을 증명하는 도구가 아니라 점성술적 흐름 판정.`;
  }

  async function copyAll() {
    const text = allText(); if (!text) return alert('먼저 A/B 독립 차트를 계산해줘.');
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) {
      const area = document.createElement('textarea'); area.value = text; area.setAttribute('readonly',''); area.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(area); area.select(); area.setSelectionRange(0, area.value.length);
      try { ok = document.execCommand('copy'); } catch {} area.remove();
    }
    if (ok) {
      const b = $('luneaHoraryABCopy'), old = b.textContent; b.textContent='✓ 전체 복사 완료'; setTimeout(()=>{b.textContent=old;},1600);
    } else alert('복사 권한을 확인해줘.');
  }

  function boot() {
    addStyles(); ensurePanel(); syncVisibility();
    const overlay = $('astroHoraryOverlay');
    if (overlay) new MutationObserver(syncVisibility).observe(overlay,{attributes:true,attributeFilter:['class']});
    console.info('☿ LUNEA Horary A/B V1 loaded');
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if ($('astroHoraryRun')) {
      clearInterval(timer); boot();
    } else if (tries >= 120) {
      clearInterval(timer); console.warn('[LUNEA Horary A/B V1] Horary V1 UI not found');
    }
  }, 100);
})();
