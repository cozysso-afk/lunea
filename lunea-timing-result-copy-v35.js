'use strict';

/* LUNEA result-copy bridge V36.0
   - Timing Oracle single-card copy
   - Transit Scanner copy
   - Planetary Return copy
   - Thai Taksa period copy (standalone + tarot support)
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_COPY_V35__) return;
  W.__LUNEA_TIMING_COPY_V35__ = true;

  const COPY_ID = 'timingCopy';
  const RELEASE = '36.0';
  let snapshots = [];
  let questionKey = '';

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const blockText = value => String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const $ = id => document.getElementById(id);

  function currentQuestion() {
    return clean($('timingQuestion')?.value || $('spreadQuestion')?.textContent || '');
  }

  function resetSnapshots() {
    snapshots = [];
    questionKey = currentQuestion();
  }

  function captureVisibleResult() {
    const result = $('timingResult');
    if (!result?.classList?.contains('show')) return false;
    const text = clean(result.innerText || result.textContent);
    if (!text) return false;

    const q = currentQuestion();
    if (q !== questionKey) {
      snapshots = [];
      questionKey = q;
    }
    if (snapshots[snapshots.length - 1] !== text) snapshots.push(text);
    return true;
  }

  function buildCopyText() {
    captureVisibleResult();
    if (!snapshots.length) return '';

    const q = currentQuestion();
    const out = ['[LUNEA · TIMING ORACLE 결과]'];
    if (q) out.push(`\n[질문]\n${q}`);

    if (snapshots.length === 1) {
      out.push(`\n[시기 결과]\n${snapshots[0]}`);
    } else {
      snapshots.forEach((text, index) => {
        out.push(`\n[${index === 0 ? '1차 시기 카드' : `정밀화 카드 ${index}`}]\n${text}`);
      });
    }

    const ai = $('timingAIText');
    const aiText = clean(ai?.innerText || ai?.textContent || '');
    if (ai?.classList?.contains('show') && aiText && !/^시기 신호와 질문 범위를 맞춰보는 중/.test(aiText) && !/^\[API 오류\]/.test(aiText)) {
      out.push(`\n[AI 시기 해석]\n${aiText}`);
    }
    return out.join('\n');
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  async function writeClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else if (!fallbackCopy(text)) throw new Error('clipboard unavailable');
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }

  async function copyTimingResult() {
    const text = buildCopyText();
    if (!text) return alert('먼저 시기 카드를 뽑아줘.');
    const ok = await writeClipboard(text);
    alert(ok ? '시기 오라클 결과를 복사했어.' : '복사 권한을 확인해줘.');
  }

  function ensureCopyButton() {
    const actions = $('timingActions');
    if (!actions) return false;
    if ($(COPY_ID)) return true;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mini';
    button.id = COPY_ID;
    button.textContent = '📋 결과 복사';
    button.title = '질문 · 시기 카드 · 정밀화 카드 · AI 시기 해석을 복사';
    button.addEventListener('click', copyTimingResult);

    const save = $('timingSave');
    if (save?.parentNode === actions) actions.insertBefore(button, save);
    else actions.appendChild(button);
    return true;
  }

  function ensureStyles() {
    if ($('luneaIndependentCopyV36Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIndependentCopyV36Style';
    style.textContent = `
      .lunea-independent-copybar{display:none;gap:7px;margin-top:9px;width:100%}
      .lunea-independent-copybar.show{display:flex}
      .lunea-independent-copybar .mini{flex:1;min-height:42px}
      #luneaThaiStandaloneRangeV33 .lunea-independent-copybar,
      #luneaThaiRangeOverlay .lunea-independent-copybar{margin-top:8px}
    `;
    document.head.appendChild(style);
  }

  function selectedText(selectId) {
    const el = $(selectId);
    return clean(el?.selectedOptions?.[0]?.textContent || el?.value || '');
  }

  function visibleResultText(resultId) {
    const el = $(resultId);
    return blockText(el?.innerText || el?.textContent || '');
  }

  function spreadQuestion() {
    let q = clean($('spreadQuestion')?.textContent || '');
    if (!q) {
      try { q = clean(W.state?.question || ''); } catch {}
    }
    return q;
  }

  function buildTransitText() {
    const result = visibleResultText('astroTransitResult');
    if (!result) return '';
    const out = ['[LUNEA · TRANSIT SCANNER 결과]'];
    const q = clean($('astroTransitQuestion')?.value || spreadQuestion());
    if (q) out.push(`\n[질문]\n${q}`);
    const topic = selectedText('astroTransitTopic');
    const days = selectedText('astroTransitDays');
    if (topic || days) out.push(`\n[계산 범위]\n${[topic, days].filter(Boolean).join(' · ')}`);
    out.push(`\n[트랜짓 결과]\n${result}`);
    return out.join('\n');
  }

  function buildReturnText() {
    const result = visibleResultText('astroReturnResult');
    if (!result) return '';
    const out = ['[LUNEA · PLANETARY RETURNS 결과]'];
    const q = clean($('astroReturnQuestion')?.value || spreadQuestion());
    if (q) out.push(`\n[질문]\n${q}`);
    const place = clean($('astroReturnPlace')?.value || '');
    const bodies = [...document.querySelectorAll('#astroReturnChecks input:checked')]
      .map(input => clean(input.closest('label')?.textContent || input.value))
      .filter(Boolean);
    const context = [];
    if (place) context.push(`위치: ${place}`);
    if (bodies.length) context.push(`선택: ${bodies.join(' · ')}`);
    if (context.length) out.push(`\n[계산 조건]\n${context.join('\n')}`);
    out.push(`\n[리턴 결과]\n${result}`);
    return out.join('\n');
  }

  function activeThaiTopic() {
    return clean(document.querySelector('#luneaThaiTopicGrid .thai-v24-topic.active')?.textContent || '');
  }

  function buildThaiStandaloneRangeText() {
    const result = visibleResultText('luneaThaiStandaloneRangeResult');
    if (!result) return '';
    const out = ['[LUNEA · THAI TAKSA PERIOD 결과]'];
    const topic = activeThaiTopic();
    if (topic) out.push(`\n[주제]\n${topic}`);
    const start = clean($('luneaThaiStandaloneRangeStart')?.value || '');
    const end = clean($('luneaThaiStandaloneRangeEnd')?.value || '');
    if (start || end) out.push(`\n[기간]\n${start || '—'} ~ ${end || '—'}`);
    out.push(`\n[기간 흐름]\n${result}`);
    return out.join('\n');
  }

  function buildThaiTarotRangeText() {
    const result = visibleResultText('luneaThaiTarotRangeResult');
    if (!result) return '';
    const out = ['[LUNEA · THAI TAKSA PERIOD SUPPORT 결과]'];
    const q = spreadQuestion();
    if (q) out.push(`\n[질문]\n${q}`);
    const start = clean($('luneaThaiTarotRangeStart')?.value || '');
    const end = clean($('luneaThaiTarotRangeEnd')?.value || '');
    if (start || end) out.push(`\n[기간]\n${start || '—'} ~ ${end || '—'}`);
    out.push(`\n[기간 흐름]\n${result}`);
    return out.join('\n');
  }

  const independentTargets = [
    {
      key:'transit', resultId:'astroTransitResult', barId:'luneaTransitCopyBarV36', buttonId:'astroTransitCopyV36',
      label:'📋 트랜짓 결과 복사', empty:'먼저 트랜짓 스캔을 실행해줘.', success:'트랜짓 결과를 복사했어.', build:buildTransitText
    },
    {
      key:'return', resultId:'astroReturnResult', barId:'luneaReturnCopyBarV36', buttonId:'astroReturnCopyV36',
      label:'📋 리턴 결과 복사', empty:'먼저 리턴 계산을 실행해줘.', success:'리턴 결과를 복사했어.', build:buildReturnText
    },
    {
      key:'thai-standalone-range', resultId:'luneaThaiStandaloneRangeResult', barId:'luneaThaiStandaloneRangeCopyBarV36', buttonId:'luneaThaiStandaloneRangeCopyV36',
      label:'📋 기간 결과 복사', empty:'먼저 Thai 기간 흐름을 계산해줘.', success:'Thai 기간 결과를 복사했어.', build:buildThaiStandaloneRangeText
    },
    {
      key:'thai-tarot-range', resultId:'luneaThaiTarotRangeResult', barId:'luneaThaiTarotRangeCopyBarV36', buttonId:'luneaThaiTarotRangeCopyV36',
      label:'📋 기간 결과 복사', empty:'먼저 Thai 기간 흐름을 계산해줘.', success:'Thai 기간 결과를 복사했어.', build:buildThaiTarotRangeText
    }
  ];

  async function copyIndependent(target) {
    const text = target.build();
    if (!text) return alert(target.empty);
    const button = $(target.buttonId);
    if (button) button.disabled = true;
    const ok = await writeClipboard(text);
    if (button) button.disabled = false;
    alert(ok ? target.success : '복사 권한을 확인해줘.');
  }

  function ensureIndependentTarget(target) {
    const result = $(target.resultId);
    if (!result) return false;

    let bar = $(target.barId);
    if (!bar) {
      bar = document.createElement('div');
      bar.id = target.barId;
      bar.className = 'lunea-independent-copybar';
      const button = document.createElement('button');
      button.type = 'button';
      button.id = target.buttonId;
      button.className = 'mini';
      button.textContent = target.label;
      button.addEventListener('click', () => copyIndependent(target));
      bar.appendChild(button);
      result.insertAdjacentElement('afterend', bar);
    }

    const hasResult = !!visibleResultText(target.resultId);
    bar.classList.toggle('show', hasResult);
    const button = $(target.buttonId);
    if (button) button.disabled = !hasResult;
    return true;
  }

  function ensureIndependentCopyButtons() {
    ensureStyles();
    independentTargets.forEach(ensureIndependentTarget);
  }

  function boot() {
    ensureCopyButton();
    ensureIndependentCopyButtons();

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw')) resetSnapshots();
      if (event.target?.closest?.('#timingRefine')) setTimeout(captureVisibleResult, 30);
    }, true);

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      const run = () => {
        queued = false;
        ensureCopyButton();
        captureVisibleResult();
        ensureIndependentCopyButtons();
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else setTimeout(run, 16);
    });
    observer.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class']});

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      ensureCopyButton();
      ensureIndependentCopyButtons();
      if (tries > 120) clearInterval(timer);
    }, 250);
  }

  W.LUNEA_TIMING_COPY_V35 = Object.freeze({
    version:RELEASE,
    ensureCopyButton,
    buildCopyText,
    resetSnapshots,
    ensureIndependentCopyButtons,
    buildTransitText,
    buildReturnText,
    buildThaiStandaloneRangeText,
    buildThaiTarotRangeText
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
