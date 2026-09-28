'use strict';

/* LUNEA HORARY RESULT UI / EVIDENCE V2
   ---------------------------------------------------------------
   Presentation-only hierarchy layer for Horary + Prashna results.

   Contract:
   - never recalculates Horary / Prashna / Cross facts
   - never changes grades, scores, routing, aspects, timing or archive data
   - only decorates already-rendered DOM and provides mobile result navigation
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_RESULT_UI_V2__) return;
  W.__LUNEA_HORARY_RESULT_UI_V2__ = true;

  const STYLE_ID = 'luneaHoraryResultUiV2Style';
  const MAP_ID = 'luneaHoraryResultMapV2';
  const $ = id => document.getElementById(id);
  let queued = false;
  let observer = null;

  const SECTION_LABELS = Object.freeze([
    {
      target:'luneaPrashnaV1Card',
      id:'luneaResultV2PrashnaBand',
      kicker:'INDEPENDENT CROSS-CHECK',
      title:'Prashna · 독립 교차체계',
      note:'Horary 계산값을 바꾸지 않고 Sidereal / Lahiri 기준을 별도로 확인해.'
    },
    {
      target:'luneaHoraryPrashnaCrossV2',
      id:'luneaResultV2CrossBand',
      kicker:'SYSTEM CROSS-READ',
      title:'Horary ↔ Prashna · 일치 / 충돌',
      note:'두 체계의 결론을 합산하지 않고 같은 방향과 다른 방향을 분리해서 보여줘.'
    },
    {
      target:'astroHoraryAIText',
      id:'luneaResultV2AiBand',
      kicker:'AI EXPLANATION',
      title:'AI 해설 · 계산값 이후의 설명',
      note:'아래 문장은 엔진 계산값이 아니라, 이미 확정된 근거를 읽기 쉽게 풀어쓴 해설이야.'
    }
  ]);

  function addStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${MAP_ID}{display:none;margin:8px 0 10px;padding:6px;border:1px solid rgba(184,170,224,.16);border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(118,91,170,.05));overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      #${MAP_ID}::-webkit-scrollbar{display:none}
      #${MAP_ID}.show{display:flex;gap:6px}
      #${MAP_ID} button{flex:0 0 auto;min-height:31px;padding:0 10px;border:1px solid rgba(213,205,234,.12);border-radius:10px;background:rgba(255,255,255,.035);color:#c9c2d4;font-size:8.8px;font-weight:760;letter-spacing:.15px;touch-action:manipulation}
      #${MAP_ID} button:first-child{color:#f3edf8;border-color:rgba(173,213,242,.2);background:linear-gradient(135deg,rgba(116,193,230,.09),rgba(159,126,213,.08))}
      #${MAP_ID} button:disabled{opacity:.34}

      .lunea-result-v2-band{margin:11px 1px 5px;padding-top:9px;border-top:1px solid rgba(225,220,240,.075)}
      .lunea-result-v2-band[hidden]{display:none!important}
      .lunea-result-v2-band small{display:block;color:#a9a0b8;font:750 7.8px/1.25 'Cinzel',serif;letter-spacing:1px}
      .lunea-result-v2-band b{display:block;margin-top:3px;color:#eee8f4;font-size:10.4px;line-height:1.4}
      .lunea-result-v2-band span{display:block;margin-top:2px;color:#8f8a99;font-size:8.5px;line-height:1.45}

      #astroHoraryResult.result-ui-v2-active{display:block}
      #astroHoraryResult.result-ui-v2-active .horary-summary{position:relative;margin-top:3px;padding:14px 14px 13px;border-radius:16px;border:1px solid rgba(160,211,238,.22);background:linear-gradient(145deg,rgba(102,185,220,.09),rgba(142,103,194,.075));box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 12px 30px rgba(0,0,0,.08)}
      #astroHoraryResult.result-ui-v2-active .horary-summary::before{content:'ENGINE CONCLUSION · 계산 결론';display:block;margin-bottom:5px;color:#bfeaff;font:760 7.8px/1.2 'Cinzel',serif;letter-spacing:.95px}
      #astroHoraryResult.result-ui-v2-active .horary-summary small{font-size:8.7px}
      #astroHoraryResult.result-ui-v2-active .horary-summary h4{margin:5px 0 6px;font-size:14.5px;line-height:1.38}
      #astroHoraryResult.result-ui-v2-active .horary-summary p{font-size:9.6px;line-height:1.58}

      #luneaHoraryTraditionalCoreV40.result-v2-primary-evidence{margin-top:10px!important;border-color:rgba(125,210,243,.25)!important;background:linear-gradient(145deg,rgba(73,155,191,.075),rgba(151,119,205,.065))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)}
      #luneaHoraryTraditionalCoreV40.result-v2-primary-evidence::before{content:'PRIMARY EVIDENCE · 핵심 판정 근거';display:block;margin-bottom:6px;color:#a9ddf3;font:760 7.7px/1.2 'Cinzel',serif;letter-spacing:.9px}
      #luneaHoraryBalanceGuardV41.result-v2-limit-evidence{margin-top:8px!important;border-color:rgba(226,191,128,.18)!important;background:linear-gradient(145deg,rgba(202,157,85,.05),rgba(119,91,158,.045))!important}
      #luneaHoraryBalanceGuardV41.result-v2-limit-evidence::before{content:'LIMITS & CONFIDENCE · 제한 / 신뢰도';display:block;margin-bottom:6px;color:#d9bd86;font:760 7.6px/1.2 'Cinzel',serif;letter-spacing:.85px}

      #astroHoraryResult.result-ui-v2-active .horary-card.result-v2-evidence-card{border-color:rgba(213,204,231,.095);background:rgba(255,255,255,.026)}
      #astroHoraryResult.result-ui-v2-active #luneaHoraryModeEvidenceV37,
      #astroHoraryResult.result-ui-v2-active #luneaHoraryManualEvidenceV38,
      #astroHoraryResult.result-ui-v2-active #luneaHoraryConditionEvidenceV38{opacity:.94}
      #astroHoraryResult.result-ui-v2-active #luneaHoraryModernSupplementalV40,
      #astroHoraryResult.result-ui-v2-active #luneaHoraryDebugV40,
      #astroHoraryResult.result-ui-v2-active #luneaHoraryAdvancedLocationV38{border-color:rgba(200,195,218,.10)!important;background:rgba(7,8,16,.18)!important}

      #luneaPrashnaV1Card.result-v2-prashna{border-color:rgba(219,179,108,.2)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
      #luneaHoraryPrashnaCrossV2.result-v2-cross{border-color:rgba(157,228,193,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
      #astroHoraryActions.result-v2-actions{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr) minmax(0,1fr);gap:6px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(225,220,240,.08)}
      #astroHoraryActions.result-v2-actions button{min-height:38px!important;margin:0!important;white-space:normal;line-height:1.25}
      #astroHoraryActions.result-v2-actions #astroHoraryAI{border-color:rgba(159,199,234,.2);background:linear-gradient(135deg,rgba(102,174,214,.09),rgba(141,101,194,.09))}
      #astroHoraryAIText.result-v2-ai{margin-top:6px!important;padding:12px 13px!important;border-radius:14px!important;border:1px solid rgba(167,194,232,.14)!important;border-left:3px solid rgba(150,200,232,.34)!important;background:linear-gradient(145deg,rgba(85,138,174,.05),rgba(119,88,166,.045))!important;font-size:9.7px!important;line-height:1.62!important;white-space:pre-wrap}

      @media(max-width:520px){
        #${MAP_ID}{margin-left:0;margin-right:0}
        #astroHoraryResult.result-ui-v2-active .horary-summary{padding:13px 12px}
        #astroHoraryResult.result-ui-v2-active .horary-summary h4{font-size:14px}
        #astroHoraryResult.result-ui-v2-active .horary-summary p{font-size:9.8px}
        #luneaHoraryTraditionalCoreV40.result-v2-primary-evidence .v40-section p,
        #luneaHoraryTraditionalCoreV40.result-v2-primary-evidence .v40-cell b{font-size:9.6px!important;line-height:1.55!important}
        #astroHoraryActions.result-v2-actions{grid-template-columns:1fr 1fr}
        #astroHoraryActions.result-v2-actions #astroHoraryAI{grid-column:1 / -1}
        .lunea-result-v2-band b{font-size:10.8px}.lunea-result-v2-band span{font-size:8.8px}
      }
      @media(prefers-reduced-motion:reduce){#${MAP_ID} button{scroll-behavior:auto}}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function hasText(node) {
    return !!String(node?.innerText || node?.textContent || '').trim();
  }

  function isShown(node) {
    if (!node || node.hidden) return false;
    if (node.id === 'astroHoraryResult') return node.classList?.contains('show') && hasText(node);
    if (node.id === 'astroHoraryAIText') return node.classList?.contains('show') && hasText(node);
    if (node.id === 'luneaHoraryPrashnaCrossV2') return !node.hidden && hasText(node);
    return true;
  }

  function ensureBand(config) {
    const target = $(config.target);
    let band = $(config.id);
    if (!target) {
      if (band) band.hidden = true;
      return null;
    }
    if (!band) {
      band = document.createElement('div');
      band.id = config.id;
      band.className = 'lunea-result-v2-band';
      target.insertAdjacentElement('beforebegin', band);
    }
    const html = `<small>${config.kicker}</small><b>${config.title}</b><span>${config.note}</span>`;
    if (band.innerHTML !== html) band.innerHTML = html;
    band.hidden = config.target === 'astroHoraryAIText' ? !isShown(target) : (config.target === 'luneaHoraryPrashnaCrossV2' ? !isShown(target) : false);
    return band;
  }

  function decorateResult() {
    const result = $('astroHoraryResult');
    if (!result) return false;
    const active = result.classList?.contains('show') && hasText(result);
    result.classList.toggle('result-ui-v2-active', active);
    if (active) {
      result.setAttribute('role','region');
      result.setAttribute('aria-label','Horary 계산 결과');
    }

    const summary = result.querySelector?.('.horary-summary');
    if (summary) {
      summary.dataset.resultV2Section = 'conclusion';
      summary.setAttribute('aria-label','계산 결론');
    }

    const primary = $('luneaHoraryTraditionalCoreV40');
    if (primary) {
      primary.classList.add('result-v2-primary-evidence');
      primary.dataset.resultV2Section = 'evidence';
    }
    const limits = $('luneaHoraryBalanceGuardV41');
    if (limits) {
      limits.classList.add('result-v2-limit-evidence');
      limits.dataset.resultV2Section = 'limits';
    }

    for (const card of result.querySelectorAll?.('.horary-card') || []) card.classList.add('result-v2-evidence-card');
    for (const id of ['luneaHoraryModernSupplementalV40','luneaHoraryDebugV40','luneaHoraryAdvancedLocationV38']) {
      const node = $(id);
      if (node) node.dataset.resultV2Section = 'advanced';
    }
    return active;
  }

  function decorateSiblings() {
    const prashna = $('luneaPrashnaV1Card');
    if (prashna) {
      prashna.classList.add('result-v2-prashna');
      prashna.setAttribute('aria-label','Prashna 독립 교차계산');
    }
    const cross = $('luneaHoraryPrashnaCrossV2');
    if (cross) {
      cross.classList.add('result-v2-cross');
      cross.setAttribute('aria-label','Horary와 Prashna 교차판정');
    }
    const actions = $('astroHoraryActions');
    if (actions) {
      actions.classList.add('result-v2-actions');
      actions.setAttribute('aria-label','결과 후속 작업');
    }
    const ai = $('astroHoraryAIText');
    if (ai) {
      ai.classList.add('result-v2-ai');
      ai.setAttribute('aria-label','AI 해설');
    }
    SECTION_LABELS.forEach(ensureBand);
  }

  function targetState(id) {
    const node = $(id);
    if (!node) return false;
    if (id === 'astroHoraryResult' || id === 'astroHoraryAIText' || id === 'luneaHoraryPrashnaCrossV2') return isShown(node);
    if (id === 'luneaPrashnaV1Card') return !!$('luneaPrashnaV1Result') && hasText($('luneaPrashnaV1Result'));
    return true;
  }

  function ensureMap() {
    const result = $('astroHoraryResult');
    if (!result) return null;
    let map = $(MAP_ID);
    if (!map) {
      map = document.createElement('nav');
      map.id = MAP_ID;
      map.setAttribute('aria-label','결과 빠른 이동');
      map.innerHTML = `
        <button type="button" data-target="astroHoraryResult">결론 · 근거</button>
        <button type="button" data-target="luneaPrashnaV1Card">Prashna</button>
        <button type="button" data-target="luneaHoraryPrashnaCrossV2">교차판정</button>
        <button type="button" data-target="astroHoraryAIText">AI 해설</button>`;
      result.insertAdjacentElement('beforebegin', map);
      map.addEventListener('click', event => {
        const button = event.target?.closest?.('button[data-target]');
        if (!button || button.disabled) return;
        const target = $(button.dataset.target);
        if (!target) return;
        const reduced = W.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        try { target.scrollIntoView({behavior:reduced ? 'auto' : 'smooth',block:'start'}); }
        catch { target.scrollIntoView(); }
      });
    }

    const active = $('astroHoraryResult')?.classList?.contains('show') && hasText($('astroHoraryResult'));
    map.classList.toggle('show', !!active);
    for (const button of map.querySelectorAll?.('button[data-target]') || []) button.disabled = !targetState(button.dataset.target);
    return map;
  }

  function sync() {
    queued = false;
    addStyles();
    decorateResult();
    decorateSiblings();
    ensureMap();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    const run = () => sync();
    if (typeof W.requestAnimationFrame === 'function') W.requestAnimationFrame(run);
    else setTimeout(run,0);
  }

  function install() {
    sync();
    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(schedule);
      observer.observe(document.documentElement,{
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:['class','hidden']
      });
    }
    document.addEventListener('lunea:horary-result',schedule);
    W.addEventListener?.('pageshow',schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  W.LUNEA_HORARY_RESULT_UI_V2 = Object.freeze({
    version:'2.0',
    sync,
    schedule,
    mapId:MAP_ID
  });
  console.info('✦ LUNEA Horary Result UI / Evidence V2 active · presentation only');
})();
