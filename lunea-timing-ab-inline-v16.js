'use strict';

/*
  LUNEA A/B TIMING INLINE V16
  ===========================
  Rendering bridge only.

  Problem fixed:
  - A/B Timing Oracle results were rendered only inside #luneaTimingABPanel.
  - Closing the Timing overlay left no Timing card/result in the main spread reading.

  What this module does:
  - Mirrors the already-drawn A/B Timing results into the main spread modal.
  - Places a compact two-column Moon Dial block immediately after THE SPREAD.
  - Keeps the A/B result visible after the Timing overlay closes.
  - Removes a stale single-target inline Timing card when an A/B result exists.
  - Does NOT draw cards, change Timing RNG/filtering, alter AI prompts, or modify Tarot RNG.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_AB_INLINE_V16__) return;
  W.__LUNEA_TIMING_AB_INLINE_V16__ = true;
  document.documentElement.classList.add('lunea-timing-ab-inline-v16');

  const $ = id => document.getElementById(id);
  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();

  function classify(ko, en) {
    const t = `${ko || ''} ${en || ''}`.toLowerCase();
    if (/지연|보류|불발|미정|기다|정체|delay|pending|unclear|blocked|wait/.test(t)) return {phase:'eclipse', angle:128, label:'ECLIPSE SIGNAL'};
    if (/봄|여름|가을|겨울|계절|월초|월중|월말|spring|summer|autumn|winter|season/.test(t)) return {phase:'full', angle:18, label:'SEASONAL ORBIT'};
    if (/새벽|아침|오전|정오|오후|해질|저녁|밤|자정|dawn|morning|noon|afternoon|dusk|evening|night|midnight/.test(t)) return {phase:'half', angle:74, label:'CELESTIAL CLOCK'};
    if (/장기|오래|long/.test(t)) return {phase:'waning', angle:112, label:'DISTANT ORBIT'};
    if (/주|week|달|month|개월/.test(t)) return {phase:'half', angle:62, label:'LUNAR CYCLE'};
    return {phase:'crescent', angle:28, label:'NEAR ORBIT'};
  }

  function currentQuestion() {
    const raw = clean($('spreadQuestion')?.textContent || '');
    return raw.replace(/^[“\"']+|[”\"']+$/g, '').trim();
  }

  function addStyles() {
    if ($('luneaTimingABInlineV16Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaTimingABInlineV16Style';
    style.textContent = `
      #luneaTimingABInline{
        width:100%;margin:14px 0 16px;padding:14px;border-radius:22px;
        position:relative;overflow:hidden;
        border:1px solid rgba(207,218,237,.14);
        background:
          radial-gradient(circle at 12% 0%,rgba(171,143,228,.12),transparent 30%),
          radial-gradient(circle at 92% 100%,rgba(88,151,194,.09),transparent 32%),
          linear-gradient(154deg,rgba(17,20,40,.94),rgba(8,10,24,.97));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 13px 31px rgba(0,0,0,.20);
      }
      #luneaTimingABInline::after{
        content:'';position:absolute;inset:0;pointer-events:none;opacity:.45;
        background-image:
          radial-gradient(circle at 10% 15%,rgba(255,255,255,.54) 0 1px,transparent 1.4px),
          radial-gradient(circle at 89% 13%,rgba(205,219,246,.43) 0 1px,transparent 1.4px),
          radial-gradient(circle at 72% 82%,rgba(184,166,232,.36) 0 1px,transparent 1.3px);
      }
      .lunea-tabi-head{position:relative;z-index:1;margin-bottom:12px;text-align:left}
      .lunea-tabi-kicker{color:#bcaee0;font:700 9px 'Cinzel',serif;letter-spacing:1.7px;margin-bottom:4px}
      .lunea-tabi-title{color:#f5f3fa;font:600 17px/1.35 'Noto Serif KR',serif;letter-spacing:-.2px}
      .lunea-tabi-sub{margin-top:4px;color:#8f90a4;font-size:10.5px;line-height:1.5}
      .lunea-tabi-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .lunea-tabi-card{
        min-width:0;padding:10px 9px 11px;border-radius:18px;text-align:center;
        border:1px solid rgba(223,226,241,.12);
        background:linear-gradient(155deg,rgba(255,255,255,.040),rgba(132,112,187,.022));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
      }
      .lunea-tabi-target{color:#cdbde9;font:700 9px 'Cinzel',serif;letter-spacing:1px;margin-bottom:8px}
      .lunea-tabi-dial{
        position:relative;width:84px;height:112px;margin:0 auto 9px;border-radius:16px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
        border:1px solid rgba(229,232,245,.22);
        background:
          radial-gradient(circle at 50% 42%,rgba(156,130,220,.16),transparent 31%),
          linear-gradient(155deg,#171a36 0%,#0c1025 59%,#080a18 100%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 9px 21px rgba(0,0,0,.28),0 0 20px rgba(153,126,214,.08);
      }
      .lunea-tabi-dial::before{
        content:'';position:absolute;width:58px;height:58px;border-radius:50%;
        border:1px solid rgba(225,228,242,.24);
        box-shadow:0 0 0 7px rgba(210,202,239,.025),0 0 0 15px rgba(160,141,211,.018);
      }
      .lunea-tabi-dial::after{
        content:'';position:absolute;inset:0;opacity:.62;
        background-image:
          radial-gradient(circle at 20% 16%,rgba(255,255,255,.70) 0 1px,transparent 1.4px),
          radial-gradient(circle at 81% 14%,rgba(213,224,247,.52) 0 1px,transparent 1.4px),
          radial-gradient(circle at 73% 77%,rgba(197,180,239,.46) 0 1px,transparent 1.4px);
      }
      .lunea-tabi-moon{
        position:relative;z-index:2;width:29px;height:29px;border-radius:50%;
        background:linear-gradient(145deg,#f6f6fa,#cbd0dc 43%,#8c89a8);
        box-shadow:inset -5px -5px 8px rgba(69,66,95,.22),inset 3px 3px 7px rgba(255,255,255,.49),0 0 15px rgba(220,214,246,.20);
      }
      .lunea-tabi-moon::before{content:'';position:absolute;width:26px;height:26px;border-radius:50%;background:#0d1022;top:1px;left:9px}
      .lunea-tabi-card[data-phase='full'] .lunea-tabi-moon::before{opacity:0}
      .lunea-tabi-card[data-phase='half'] .lunea-tabi-moon::before{left:15px}
      .lunea-tabi-card[data-phase='waning'] .lunea-tabi-moon::before{left:-5px}
      .lunea-tabi-card[data-phase='eclipse'] .lunea-tabi-moon{background:linear-gradient(145deg,#9481ca,#4d466f 58%,#24243c)}
      .lunea-tabi-card[data-phase='eclipse'] .lunea-tabi-moon::before{left:3px;top:3px;width:23px;height:23px;background:#090b18;opacity:.86}
      .lunea-tabi-hand{
        position:absolute;z-index:3;left:50%;top:50%;width:1px;height:25px;transform-origin:50% 100%;
        transform:translate(-50%,-100%) rotate(var(--dial-angle,34deg));
        background:linear-gradient(180deg,rgba(241,243,250,.92),rgba(190,175,232,.08));box-shadow:0 0 6px rgba(225,215,251,.30);
      }
      .lunea-tabi-orbit{color:#a8a5b8;font:700 7px 'Cinzel',serif;letter-spacing:1.05px;margin-bottom:4px}
      .lunea-tabi-ko{color:#f5f2fa;font:650 15px/1.34 'Noto Serif KR',serif;word-break:keep-all}
      .lunea-tabi-en{margin-top:3px;color:#bca6d3;font-size:9.5px;line-height:1.35}
      .lunea-tabi-meaning{margin-top:5px;color:#9291a4;font-size:10px;line-height:1.45;word-break:keep-all}
      .lunea-tabi-note{position:relative;z-index:1;margin-top:10px;padding-top:10px;border-top:1px solid rgba(221,224,238,.08);color:#858698;font-size:10px;line-height:1.55}
      @media(max-width:390px){
        #luneaTimingABInline{padding:13px 12px 14px;margin:12px 0 14px}
        .lunea-tabi-grid{gap:8px}
        .lunea-tabi-card{padding:9px 7px 10px}
        .lunea-tabi-dial{width:76px;height:102px}
        .lunea-tabi-ko{font-size:14px}
        .lunea-tabi-meaning{font-size:9.6px}
      }
    `;
    document.head.appendChild(style);
  }

  function cardData(node, fallbackLabel) {
    if (!node) return null;
    const small = clean(node.querySelector('small')?.textContent || fallbackLabel || '');
    const ko = clean(node.querySelector('b')?.textContent || '');
    const en = clean(node.querySelector('em')?.textContent || '');
    const meaning = clean(node.querySelector('p')?.textContent || '');
    if (!ko && !en) return null;
    const cfg = classify(ko, en);
    return {small, ko, en, meaning, cfg};
  }

  function makeCard(data, label) {
    const div = document.createElement('div');
    div.className = 'lunea-tabi-card';
    div.dataset.phase = data.cfg.phase;
    div.style.setProperty('--dial-angle', `${data.cfg.angle}deg`);
    div.innerHTML = `
      <div class="lunea-tabi-target">대상 ${label} · TIMING</div>
      <div class="lunea-tabi-dial"><div class="lunea-tabi-moon"></div><i class="lunea-tabi-hand"></i></div>
      <div class="lunea-tabi-orbit">${data.cfg.label}</div>
      <div class="lunea-tabi-ko"></div>
      <div class="lunea-tabi-en"></div>
      <div class="lunea-tabi-meaning"></div>`;
    div.querySelector('.lunea-tabi-ko').textContent = data.ko;
    div.querySelector('.lunea-tabi-en').textContent = data.en;
    div.querySelector('.lunea-tabi-meaning').textContent = data.meaning;
    return div;
  }

  function ensureInline() {
    let block = $('luneaTimingABInline');
    if (block && block.isConnected) return block;
    const cards = $('cards');
    if (!cards || !cards.closest('#spreadOverlay')) return null;
    block = document.createElement('section');
    block.id = 'luneaTimingABInline';
    block.innerHTML = `
      <div class="lunea-tabi-head">
        <div class="lunea-tabi-kicker">LUNEA · CELESTIAL TIME ORACLE</div>
        <div class="lunea-tabi-title">Moon Dial · A/B 시기 신호</div>
        <div class="lunea-tabi-sub">두 대상의 시기 카드를 메인 리딩에 함께 보관해.</div>
      </div>
      <div class="lunea-tabi-grid"></div>
      <div class="lunea-tabi-note">시기 카드는 사건 발생 자체를 확정하는 카드가 아니라, 메인 타로 흐름이 성립할 때의 시간 창을 보조해.</div>`;
    cards.insertAdjacentElement('afterend', block);
    return block;
  }

  function mirrorAB() {
    const source = $('luneaTimingABCards');
    if (!source) return false;
    const nodes = [...source.querySelectorAll('.tab-card')];
    if (nodes.length < 2) return false;
    const A = cardData(nodes[0], '대상 A');
    const B = cardData(nodes[1], '대상 B');
    if (!A || !B) return false;

    const block = ensureInline();
    if (!block) return false;
    const grid = block.querySelector('.lunea-tabi-grid');
    if (!grid) return false;

    const sig = `${A.ko}|${A.en}|${B.ko}|${B.en}`;
    if (block.dataset.sig === sig && grid.children.length === 2) return true;
    block.dataset.sig = sig;
    block.dataset.question = currentQuestion();
    grid.replaceChildren(makeCard(A, 'A'), makeCard(B, 'B'));

    // A/B result supersedes any accidental single-target inline Timing result.
    const single = $('luneaTimingInline');
    if (single && single !== block) single.remove();
    return true;
  }

  function removeIfStale() {
    const block = $('luneaTimingABInline');
    if (!block) return;
    const q = currentQuestion();
    const stored = clean(block.dataset.question || '');
    if (stored && q && stored !== q) block.remove();
  }

  function observeABSource() {
    const source = $('luneaTimingABCards');
    if (!source || source.__luneaInlineV16Observed) return false;
    source.__luneaInlineV16Observed = true;
    const observer = new MutationObserver(() => {
      requestAnimationFrame(mirrorAB);
      setTimeout(mirrorAB, 80);
    });
    observer.observe(source, {childList:true, subtree:true, characterData:true});
    mirrorAB();
    return true;
  }

  function observeReading() {
    const question = $('spreadQuestion');
    if (question && !question.__luneaInlineV16Observed) {
      question.__luneaInlineV16Observed = true;
      new MutationObserver(() => requestAnimationFrame(removeIfStale)).observe(question, {childList:true, subtree:true, characterData:true});
    }
  }

  function boot() {
    addStyles();
    observeReading();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      observeReading();
      if (observeABSource() || tries > 120) clearInterval(timer);
    }, 100);
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#luneaTimingABPanel,#luneaTimingABAIButton,[data-close="timing"],#spreadOverlay')) {
        setTimeout(mirrorAB, 60);
        setTimeout(mirrorAB, 240);
      }
    }, {passive:true});
    console.info('🌙 LUNEA A/B Timing Inline V16 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
