'use strict';

/* LUNEA HORARY + PRASHNA MOBILE ACTION OWNER V45
   ---------------------------------------------------------------
   iOS/PWA can suppress the synthetic click that normally follows a tap inside
   a long, momentum-scrolled fixed modal. These controls live below the Horary
   result, so they must not depend on click delivery alone.

   V45 owns pointer/touch release for:
   - Prashna independent calculation
   - Horary AI interpretation
   - Horary full-result copy
   - Horary archive save

   It resolves the intended button both from event.target and from the tap
   coordinates, so a transparent/stale hit-test layer cannot make a visible
   button inert. A short movement threshold prevents activation after scrolling.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_MOBILE_ACTIONS_V45__) return;
  W.__LUNEA_HORARY_MOBILE_ACTIONS_V45__ = true;

  const IDS = ['luneaPrashnaRunV1','astroHoraryAI','astroHoraryCopy','astroHorarySave'];
  const SELECTOR = IDS.map(id => `#${id}`).join(',');
  const starts = new Map();
  let touchStart = null;

  const $ = id => document.getElementById(id);
  const pointInRect = (x,y,r) => !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const visible = node => {
    if (!node || node.disabled) return false;
    const r = node.getBoundingClientRect?.();
    if (!r || r.width <= 0 || r.height <= 0) return false;
    const style = W.getComputedStyle?.(node);
    return !style || (style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none');
  };

  function candidate(rawTarget,x,y) {
    const direct = rawTarget?.closest?.(SELECTOR);
    if (direct && visible(direct)) return direct;
    for (const id of IDS) {
      const node = $(id);
      if (!visible(node)) continue;
      if (pointInRect(x,y,node.getBoundingClientRect())) return node;
    }
    return null;
  }

  function makeInteractive() {
    const actions = $('astroHoraryActions');
    const prashna = $('luneaPrashnaV1Card');
    for (const node of [actions,prashna]) {
      if (!node) continue;
      node.style.setProperty('position','relative','important');
      node.style.setProperty('z-index','80','important');
      node.style.setProperty('pointer-events','auto','important');
      node.style.setProperty('isolation','isolate','important');
    }
    for (const id of IDS) {
      const node = $(id);
      if (!node) continue;
      try { node.type = 'button'; } catch {}
      node.style.setProperty('position','relative','important');
      node.style.setProperty('z-index','81','important');
      node.style.setProperty('pointer-events','auto','important');
      node.style.setProperty('touch-action','manipulation','important');
      node.style.setProperty('-webkit-tap-highlight-color','transparent','important');
    }
  }

  function setPrashnaError(message) {
    const node = $('luneaPrashnaV1Status');
    if (!node) return;
    node.textContent = message;
    node.className = 'prashna-v1-status err';
  }

  function resultReady() {
    const node = $('astroHoraryResult');
    return !!(node?.classList?.contains('show') && String(node.innerText || node.textContent || '').trim());
  }

  async function writeClipboard(text) {
    const value = String(text || '');
    if (!value) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly','');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0,area.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  async function runPrashna(button) {
    const fn = W.LUNEA_PRASHNA_V1?.run;
    if (typeof fn !== 'function') {
      setPrashnaError('Prashna 실행 모듈을 불러오지 못했어. 화면을 다시 열어줘.');
      return;
    }
    return fn.call(W.LUNEA_PRASHNA_V1,button);
  }

  async function runAI(button) {
    const v44 = W.LUNEA_HORARY_POST_ACTIONS_V44;
    const prompt = String(v44?.aiPrompt?.() || '');
    if (!prompt || !resultReady()) {
      alert('먼저 호라리 차트를 계산해줘.');
      return;
    }
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) {
      alert('LUNEA API 설정을 먼저 해줘.');
      return;
    }
    const output = $('astroHoraryAIText');
    const old = button.textContent || '🔮 호라리 AI 해석';
    button.disabled = true;
    button.textContent = '🔮 해석 중…';
    if (output) {
      output.classList.add('show');
      output.textContent = '계산 근거를 질문 원문에 맞춰 판정하는 중…';
    }
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.35,topP:.86}})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.error?.message || `HTTP ${response.status}`);
      const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!text) throw new Error('AI 응답이 비어 있어.');
      if (output) output.textContent = text;
    } catch (error) {
      if (output) output.textContent = `AI 해석 실패: ${error?.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  async function copyResult(button) {
    const text = String(W.LUNEA_HORARY_POST_ACTIONS_V44?.copyPayload?.() || '');
    if (!text || !resultReady()) {
      alert('먼저 호라리 차트를 계산해줘.');
      return;
    }
    const old = button.textContent || '📋 결과 전체 복사';
    button.disabled = true;
    button.textContent = '복사 중…';
    const ok = await writeClipboard(text);
    button.disabled = false;
    button.textContent = ok ? '✓ 전체 복사 완료' : old;
    if (ok) setTimeout(() => { if (button.isConnected) button.textContent = old; },1500);
    else alert('복사 권한을 확인해줘.');
  }

  async function saveResult(button) {
    if (!resultReady()) {
      alert('먼저 호라리 차트를 계산해줘.');
      return;
    }
    const old = button.textContent || '💾 기록';
    button.disabled = true;
    button.textContent = '저장 중…';
    try {
      const repair = W.LUNEA_HORARY_POST_ACTIONS_V44?.repairLatestHoraryArchive;
      if (typeof repair === 'function') {
        await repair();
      } else if (typeof button.onclick === 'function') {
        await button.onclick.call(button,{preventDefault(){},stopPropagation(){}});
      } else {
        throw new Error('호라리 기록 모듈을 불러오지 못했어.');
      }
      button.textContent = '✓ 기록 저장';
      setTimeout(() => { if (button.isConnected) button.textContent = old; },1500);
    } catch (error) {
      button.textContent = old;
      alert(`기록 저장 실패: ${error?.message || error}`);
    } finally {
      button.disabled = false;
    }
  }

  function activate(button) {
    if (!button || button.disabled) return Promise.resolve();
    if (button.id === 'luneaPrashnaRunV1') return Promise.resolve(runPrashna(button));
    if (button.id === 'astroHoraryAI') return Promise.resolve(runAI(button));
    if (button.id === 'astroHoraryCopy') return Promise.resolve(copyResult(button));
    if (button.id === 'astroHorarySave') return Promise.resolve(saveResult(button));
    return Promise.resolve();
  }

  function swallow(event) {
    try { event.preventDefault(); } catch {}
    try { event.stopPropagation(); } catch {}
    try { event.stopImmediatePropagation(); } catch {}
  }

  function pointerStart(event) {
    if (event.pointerType && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    makeInteractive();
    const x = Number(event.clientX || 0), y = Number(event.clientY || 0);
    const button = candidate(event.target,x,y);
    if (!button) return;
    starts.set(event.pointerId ?? 1,{button,x,y});
  }

  function pointerEnd(event) {
    if (event.pointerType && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const key = event.pointerId ?? 1;
    const start = starts.get(key);
    starts.delete(key);
    if (!start) return;
    const x = Number(event.clientX || 0), y = Number(event.clientY || 0);
    const endButton = candidate(event.target,x,y) || start.button;
    if (endButton !== start.button || Math.hypot(x-start.x,y-start.y) > 18) return;
    swallow(event);
    activate(start.button).catch(error => console.error('[LUNEA V45 mobile action]',error));
  }

  function touchPoint(touch) {
    return {x:Number(touch?.clientX || 0),y:Number(touch?.clientY || 0)};
  }

  function touchStartHandler(event) {
    if ('PointerEvent' in W) return;
    makeInteractive();
    const p = touchPoint(event.touches?.[0]);
    const button = candidate(event.target,p.x,p.y);
    touchStart = button ? {button,...p} : null;
  }

  function touchEndHandler(event) {
    if ('PointerEvent' in W || !touchStart) return;
    const start = touchStart;
    touchStart = null;
    const p = touchPoint(event.changedTouches?.[0]);
    const endButton = candidate(event.target,p.x,p.y) || start.button;
    if (endButton !== start.button || Math.hypot(p.x-start.x,p.y-start.y) > 18) return;
    swallow(event);
    activate(start.button).catch(error => console.error('[LUNEA V45 mobile action]',error));
  }

  function install() {
    makeInteractive();
    document.addEventListener('pointerdown',pointerStart,true);
    document.addEventListener('pointerup',pointerEnd,true);
    document.addEventListener('touchstart',touchStartHandler,{capture:true,passive:true});
    document.addEventListener('touchend',touchEndHandler,{capture:true,passive:false});
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(makeInteractive);
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      makeInteractive();
      if (tries >= 40) clearInterval(timer);
    },150);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  W.LUNEA_HORARY_MOBILE_ACTIONS_V45 = Object.freeze({
    version:'45.0',activate,candidate,makeInteractive,runPrashna,runAI,copyResult,saveResult
  });
  console.info('✦ LUNEA Horary + Prashna Mobile Action Owner V45 active');
})();
