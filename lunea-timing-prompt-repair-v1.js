'use strict';

/*
  LUNEA TIMING PROMPT REPAIR V1
  =============================
  Final prompt safety net for Timing Oracle support cards.

  Why this exists:
  - Timing Oracle V1 keeps its draw state inside a closure.
  - Its original prompt wrapper also requires an exact question-state match.
  - In mixed wrapper/load states the timing card can be visible in the current
    reading while the final prompt accidentally omits the Timing Oracle block.

  Policy:
  - The current reading UI is the final fallback source of truth.
  - If a support timing result is visibly attached to the current reading and
    the final prompt has no Timing Oracle block, reconstruct that block.
  - Also repair the interpretation engine ledger so it cannot say "없음" while
    a timing block is actually present.
  - Does not draw cards, change RNG, or create timing values.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_PROMPT_REPAIR_V1__) return;
  W.__LUNEA_TIMING_PROMPT_REPAIR_V1__ = true;

  const $ = id => document.getElementById(id);
  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();

  function readSingleTimingFromUI() {
    const inline = $('luneaTimingInline');
    if (!inline || !inline.isConnected) return null;
    const label = clean(inline.querySelector('b')?.textContent);
    const meaning = clean(inline.querySelector('span')?.textContent);
    if (!label) return null;
    return {type:'single', label, meaning};
  }

  function readABTimingFromUI() {
    const panel = $('luneaTimingABPanel');
    if (!panel || !panel.isConnected || !panel.classList.contains('show')) return null;
    const cards = [...panel.querySelectorAll('.tab-card')].slice(0, 2).map((el, i) => ({
      target: i === 0 ? 'A' : 'B',
      label: clean(el.querySelector('b')?.textContent),
      english: clean(el.querySelector('em')?.textContent),
      meaning: clean(el.querySelector('p')?.textContent)
    })).filter(x => x.label);
    if (cards.length !== 2) return null;
    return {type:'ab', cards};
  }

  function currentTimingUI() {
    return readABTimingFromUI() || readSingleTimingFromUI();
  }

  function makeBlock(snapshot) {
    if (!snapshot) return '';
    if (snapshot.type === 'ab') {
      const A = snapshot.cards[0], B = snapshot.cards[1];
      return `[LUNEA TIMING ORACLE A/B — 두 대상 독립 시기 보조 · 프롬프트 복구]\n- A: ${A.label}${A.english ? ` / ${A.english}` : ''}${A.meaning ? ` — ${A.meaning}` : ''}\n- B: ${B.label}${B.english ? ` / ${B.english}` : ''}${B.meaning ? ` — ${B.meaning}` : ''}\n- 현재 리딩 화면에 실제 생성되어 있는 두 시기 카드다. A/B를 합치지 말고 각각 읽은 뒤 마지막에만 비교한다. 시기 카드만으로 사건 발생을 확정하지 않는다.`;
    }
    return `[LUNEA TIMING ORACLE — 별도 시기 보조 덱 · 프롬프트 복구]\n- 현재 리딩에 실제 생성된 시기 카드: ${snapshot.label}\n${snapshot.meaning ? `- 카드 의미: ${snapshot.meaning}\n` : ''}- 이 값은 현재 리딩 화면에 실제 표시된 Timing Oracle 결과다. 사건 성립 가능성과 시기를 분리하고, 메인 타로의 사건 가능성을 뒤집는 근거로 사용하지 않는다.`;
  }

  function repairLedger(prompt) {
    const present = prompt.includes('[LUNEA TIMING ORACLE');
    if (!present) return prompt;
    const line = '- Timing Oracle(시기 오라클): 현재 프롬프트에 있음 → 사용 가능';
    if (/- Timing Oracle\(시기 오라클\):[^\n]*/.test(prompt)) {
      return prompt.replace(/- Timing Oracle\(시기 오라클\):[^\n]*/, line);
    }
    return prompt;
  }

  function repairPrompt(prompt) {
    let p = String(prompt || '');
    if (!p.includes('[LUNEA TIMING ORACLE')) {
      const snap = currentTimingUI();
      const block = makeBlock(snap);
      if (block) {
        const ledgerMarker = '[현재 리딩에서 실제 사용 가능한 보조 엔진 — 자동 감지]';
        if (p.includes(ledgerMarker)) p = p.replace(ledgerMarker, `${block}\n\n${ledgerMarker}`);
        else p += `\n\n${block}`;
      }
    }
    return repairLedger(p);
  }

  function install() {
    if (W.__LUNEA_TIMING_PROMPT_REPAIR_INSTALLED__) return true;
    const prior = W.promptString || (typeof promptString === 'function' ? promptString : null);
    if (typeof prior !== 'function') return false;

    const wrapped = function() {
      return repairPrompt(prior.apply(this, arguments));
    };
    wrapped.__luneaTimingPromptRepairV1 = true;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    W.__LUNEA_TIMING_PROMPT_REPAIR_INSTALLED__ = true;
    console.info('⏳ LUNEA Timing Prompt Repair V1 installed');
    return true;
  }

  W.LUNEA_TIMING_PROMPT_REPAIR_V1 = {
    version:1,
    diagnose:() => currentTimingUI(),
    repair:repairPrompt
  };

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 80) clearInterval(timer);
    }, 100);
    install();
  }

  // Structural loader runs before the top-level Timing/Gloss scripts. Installing
  // at window load guarantees this wrapper becomes the last prompt wrapper.
  if (document.readyState === 'complete') setTimeout(boot, 0);
  else W.addEventListener('load', boot, {once:true});
})();
