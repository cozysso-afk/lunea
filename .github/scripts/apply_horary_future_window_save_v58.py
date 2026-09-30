from pathlib import Path

# 1) Surface backend future-window evidence in Horary UI + AI prompt.
p = Path('astro-horary-v1.js')
s = p.read_text()

old = """    const moon = j.moon_course || {};
    const event = sig.event;

    let html = `"""
new = """    const moon = j.moon_course || {};
    const event = sig.event;
    const futureWindow = j.future_window_v1 || null;
    const futureIngress = futureWindow?.active ? (futureWindow.ingresses || []) : [];

    let html = `"""
if 'const futureWindow = j.future_window_v1 || null;' not in s:
    if old not in s: raise SystemExit('renderResult marker not found')
    s = s.replace(old, new, 1)

old = """        <p>현재 별자리 이탈까지 약 ${moon.hours_to_sign_exit ?? '—'}시간</p>
      </div>
    `;"""
new = """        <p>현재 별자리 이탈까지 약 ${moon.hours_to_sign_exit ?? '—'}시간</p>
      </div>
      ${futureWindow?.active ? `<div class=\"horary-card\">
        <h5>목표기간 전 상태변화 · Future Window</h5>
        <p>질문에서 읽은 목표일: ${esc(futureWindow.target_date || '—')}</p>
        ${futureIngress.length ? futureIngress.map(row => `<p>${esc(row.body_ko || row.body)} · ${esc(row.from_sign_ko || row.from_sign_en)} → ${esc(row.to_sign_ko || row.to_sign_en)} · ${esc(fmtDate(row.time_local || row.utc))}${row.before_target_start ? ' · 목표일 시작 전' : row.within_target_date ? ' · 목표일 중' : ''}</p>`).join('') : '<p>목표기간 전 주요 시그니피케이터 별자리 이동 없음</p>'}
        ${futureWindow.moon_voc_scope_ends_before_target_end ? '<p>※ 현재 Moon VOC는 별자리 이탈 전까지만 유효하므로 목표기간 전체로 확장하지 않음.</p>' : ''}
        ${futureWindow.current_reception_not_guaranteed_through_target ? '<p>※ 주요 시그니피케이터 ingress가 있어 현재 dignity/reception 조건이 목표기간까지 그대로 유지된다고 가정하지 않음.</p>' : ''}
        <p>※ ingress 자체는 Perfection(성사각)이 아니며 기존 판정을 자동으로 뒤집지 않음.</p>
      </div>` : ''}
    `;"""
if '목표기간 전 상태변화 · Future Window' not in s:
    if old not in s: raise SystemExit('future-window UI insertion marker not found')
    s = s.replace(old, new, 1)

old = """    const interventions = (j.potential_prohibition || []).slice(0,4).map(x =>
      `- ${x.intervening}(${x.intervening_ko}) → ${x.target}(${x.target_ko}) ${x.aspect_ko}, 약 ${x.estimated_days}일 후보 · 잠재 개입각일 뿐 확정 금지 아님`
    ).join('\\n') || '- 없음';

    return `[HORARY V1 · 질문시각 점성술 계산 결과]"""
new = """    const interventions = (j.potential_prohibition || []).slice(0,4).map(x =>
      `- ${x.intervening}(${x.intervening_ko}) → ${x.target}(${x.target_ko}) ${x.aspect_ko}, 약 ${x.estimated_days}일 후보 · 잠재 개입각일 뿐 확정 금지 아님`
    ).join('\\n') || '- 없음';
    const futureWindow = j.future_window_v1 || {};
    const futureIngress = futureWindow.active ? (futureWindow.ingresses || []).map(x =>
      `- ${x.time_local || x.utc}: ${x.body}(${x.body_ko || x.body}) ${x.from_sign_ko || x.from_sign_en} → ${x.to_sign_ko || x.to_sign_en} · 역할 ${(x.roles || []).join('/') || '—'}${x.before_target_start ? ' · 목표일 시작 전' : x.within_target_date ? ' · 목표일 중' : ''}`
    ).join('\\n') || '- 없음' : '- 질문에서 별도 미래 목표일을 확정하지 못함';
    const futureRules = futureWindow.active ? (futureWindow.interpretation_rules_ko || []).map(x => `- ${x}`).join('\\n') : '- 없음';

    return `[HORARY V1 · 질문시각 점성술 계산 결과]"""
if 'const futureRules = futureWindow.active' not in s:
    if old not in s: raise SystemExit('prompt variables marker not found')
    s = s.replace(old, new, 1)

old = """- Void of Course(보이드 오브 코스·공전달): ${moon.void_of_course ? '해당' : '아님'}

[Moon(달)의 다음 적용각]
${moonNext}"""
new = """- Void of Course(보이드 오브 코스·공전달): ${moon.void_of_course ? '해당' : '아님'}

[미래 목표기간 상태변화 · Future Window]
- 목표일: ${futureWindow.active ? futureWindow.target_date : '별도 인식 없음'}
- 현재 Moon VOC를 목표기간 전체로 확장 금지: ${futureWindow.moon_voc_scope_ends_before_target_end ? '예' : '해당 없음'}
- 현재 reception/dignity 조건 유지 보장 안 됨: ${futureWindow.current_reception_not_guaranteed_through_target ? '예' : '해당 없음'}
${futureIngress}

[미래기간 해석 규칙]
${futureRules}

[Moon(달)의 다음 적용각]
${moonNext}"""
if '[미래 목표기간 상태변화 · Future Window]' not in s:
    if old not in s: raise SystemExit('prompt future block marker not found')
    s = s.replace(old, new, 1)

p.write_text(s)

# 2) Make standalone Horary save IndexedDB-first and stop the fragile base localStorage save handler.
p = Path('lunea-horary-post-actions-v44.js')
s = p.read_text()
marker = "\n  async function repairLatestHoraryArchive() {\n"
if 'async function saveStandaloneHardened(' not in s:
    helper = r'''

  function lightweightHorarySnapshot(fullResult, runtime) {
    const j = fullResult?.judgment_support || {};
    return {
      schema:'LUNEA_HORARY_V1',
      lightweight:true,
      question:fullResult?.question || {text:currentQuestion()},
      moment:fullResult?.moment || {local_iso:currentMoment(),place_resolved:currentPlace()},
      angles:fullResult?.angles || null,
      significators:fullResult?.significators || null,
      judgment_support:{
        perfection:j.perfection || null,
        reception:j.reception || null,
        moon_course:j.moon_course || null,
        future_window_v1:j.future_window_v1 || null,
        traditional_core_v6:j.traditional_core_v6 ? {evidence_grade:j.traditional_core_v6.evidence_grade,staged_judgment:j.traditional_core_v6.staged_judgment} : null
      },
      screenSnapshot:runtime
    };
  }

  async function saveStandaloneHardened(button) {
    const fullResult = W.LUNEA_ASTRO_HORARY_V1?.getCurrent?.();
    if (!fullResult || !resultText()) {
      alert('먼저 호라리 차트를 계산해줘.');
      return null;
    }
    const old = button?.textContent || '💾 기록';
    if (button) { button.disabled = true; button.textContent = '💾 저장 중…'; }
    try {
      const cross = W.LUNEA_HORARY_PRASHNA_CROSS_V2?.archiveSnapshot?.() || null;
      const runtime = archiveSnapshot();
      const id = uid();
      const ai = currentAIText();
      const fullHorary = JSON.parse(JSON.stringify(fullResult));
      fullHorary.ai_text = ai;
      fullHorary.prashna_v1 = cross?.prashna_v1 || null;
      fullHorary.cross_interpretation_v2 = cross?.cross_interpretation_v2 || null;
      const fullReading = {
        id, createdAt:Date.now(), date:new Date().toLocaleString('ko-KR'),
        title:'HORARY · 질문시각 점성술', q:currentQuestion(),
        rationale:'질문을 처음 명확하게 이해한 시각과 장소의 Tropical · Regiomontanus 차트',
        cards:[], ai, category:categoryFor(currentQuestion()),
        horary:fullHorary, horaryRuntimeV44:runtime
      };

      // IndexedDB Journal is the canonical full-fidelity store for Horary.
      await upsertJournalReading(fullReading);

      // Keep only a lightweight compatibility row in localStorage so iPhone quota
      // pressure cannot destroy an otherwise successful Journal save.
      const rows = readArchive().filter(row => String(row?.id || '') !== id);
      const lightReading = {
        ...fullReading,
        ai:String(ai || '').slice(0,2000),
        horary:lightweightHorarySnapshot(fullResult,runtime)
      };
      rows.unshift(lightReading);
      const localOk = writeArchive(rows);
      try { await Promise.resolve(W.LUNEA_READING_JOURNAL?.render?.()); } catch {}
      try { repairArchivePresentation(); } catch {}
      if (button) button.textContent = localOk ? '✓ 기록 저장' : '✓ 기록 저장 · DB';
      alert(localOk ? '✨ 호라리 리딩을 기록함에 저장했어.' : '✨ 호라리 리딩을 기록함 DB에 저장했어. 기기 캐시 용량 때문에 목록 호환 저장은 줄였어.');
      return fullReading;
    } catch (error) {
      console.error('[LUNEA Horary V44] hardened save failed', error);
      alert('호라리 기록 저장 중 오류가 났어: ' + (error?.message || error));
      return null;
    } finally {
      if (button) {
        button.disabled = false;
        setTimeout(() => { if (button.isConnected) button.textContent = old; }, 1500);
      }
    }
  }
'''
    if marker not in s: raise SystemExit('repairLatest marker not found')
    s = s.replace(marker, helper + marker, 1)

old = """      const saveButton = event.target?.closest?.('#astroHorarySave');
      if (saveButton) {
        setTimeout(() => repairLatestHoraryArchive(),40);
        setTimeout(() => repairLatestHoraryArchive(),260);
      }"""
new = """      const saveButton = event.target?.closest?.('#astroHorarySave');
      if (saveButton) {
        event.preventDefault();
        event.stopPropagation();
        try { event.stopImmediatePropagation(); } catch {}
        saveStandaloneHardened(saveButton);
        return;
      }"""
if 'saveStandaloneHardened(saveButton);' not in s:
    if old not in s: raise SystemExit('save action marker not found')
    s = s.replace(old, new, 1)

old = """      repairLatestHoraryArchive,
      repairSavedHoraryRows,"""
new = """      repairLatestHoraryArchive,
      saveStandaloneHardened,
      repairSavedHoraryRows,"""
if '      saveStandaloneHardened,\n' not in s:
    if old not in s: raise SystemExit('export marker not found')
    s = s.replace(old, new, 1)
p.write_text(s)

# 3) Cache-bust the two changed runtime assets.
p = Path('index.html')
s = p.read_text()
s = s.replace('./astro-horary-v1.js?v=103', './astro-horary-v1.js?v=104')
p.write_text(s)

p = Path('lunea-astro-origin-failover-v57.js')
s = p.read_text().replace('./lunea-horary-post-actions-v44.js?v=441', './lunea-horary-post-actions-v44.js?v=442')
p.write_text(s)

# 4) Add a static regression contract.
t = Path('tests/horary-future-window-save-v58.test.mjs')
t.write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';

const horary = fs.readFileSync(new URL('../astro-horary-v1.js', import.meta.url),'utf8');
const post = fs.readFileSync(new URL('../lunea-horary-post-actions-v44.js', import.meta.url),'utf8');
const loader = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url),'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');

assert.match(horary,/future_window_v1/);
assert.match(horary,/목표기간 전 상태변화 · Future Window/);
assert.match(horary,/현재 Moon VOC를 목표기간 전체로 확장 금지/);
assert.match(horary,/current_reception_not_guaranteed_through_target/);
assert.match(post,/async function saveStandaloneHardened/);
assert.match(post,/IndexedDB Journal is the canonical full-fidelity store/);
assert.match(post,/saveStandaloneHardened\(saveButton\)/);
assert.match(post,/event\.stopImmediatePropagation/);
assert.match(index,/astro-horary-v1\.js\?v=104/);
assert.match(loader,/lunea-horary-post-actions-v44\.js\?v=442/);
console.log('Horary future-window + save V58 contract PASS');
''')
