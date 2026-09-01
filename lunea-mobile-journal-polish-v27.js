'use strict';

/* LUNEA Mobile Journal + Long Question Polish V27
   ------------------------------------------------------------
   UI-only patch based on iPhone screenshots.
   - Keeps long reading questions compact with explicit expand/collapse.
   - Collapses technical Structural Routing / design rationale by default.
   - Hard-wraps long technical tokens so mobile layouts do not overflow.
   - Strengthens the tarot journal's opal teal / rose / gold visual hierarchy.
   - Does not alter draw logic, AI prompts, archive persistence, IndexedDB,
     Horary, Timing, Transit, Return, or Thai calculation behavior.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MOBILE_JOURNAL_POLISH_V27__) return;
  W.__LUNEA_MOBILE_JOURNAL_POLISH_V27__ = true;

  const $ = id => document.getElementById(id);
  const LONG_QUESTION_CHARS = 96;
  const CATEGORY_RE = /(?:^|\s|·)(GENERAL|LOVE|CAREER|STOCK|DAILY)(?:\s|$|·)/i;

  function addStyles() {
    if ($('luneaMobileJournalPolishV27Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaMobileJournalPolishV27Style';
    s.textContent = `
      #spreadOverlay .modal{overflow-x:hidden!important}
      #spreadOverlay #spreadType,
      #spreadOverlay #spreadQuestion,
      #spreadOverlay #spreadRationale{
        max-width:100%!important;white-space:normal!important;
        overflow-wrap:anywhere!important;word-break:break-word!important
      }
      #spreadOverlay #spreadType{
        display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2;
        overflow:hidden!important;padding-right:36px!important;line-height:1.45!important
      }
      #spreadOverlay #spreadQuestion.lunea-v27-question{
        position:relative;margin-bottom:8px!important;
        font-size:clamp(18px,5.15vw,22px)!important;line-height:1.48!important;
        letter-spacing:-.35px!important;text-wrap:pretty
      }
      #spreadOverlay #spreadQuestion.lunea-v27-question.is-collapsed{
        display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:4;overflow:hidden!important
      }
      #spreadOverlay #spreadQuestion.lunea-v27-question.is-expanded{
        display:block!important;max-height:38dvh!important;overflow-y:auto!important;
        overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-right:5px!important
      }
      #luneaV27CompactControls{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0 0 10px}
      #luneaV27CompactControls:empty{display:none}
      #luneaV27CompactControls button{
        min-height:32px!important;padding:6px 10px!important;border-radius:999px!important;
        border:1px solid rgba(180,211,225,.17)!important;
        background:linear-gradient(145deg,rgba(113,194,205,.09),rgba(185,151,221,.055))!important;
        color:#cbd8df!important;font-size:10px!important;font-weight:700!important;
        letter-spacing:-.1px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important
      }
      #luneaV27QuestionToggle::before{content:'✦';margin-right:5px;color:#91e8dc}
      #luneaV27RationaleToggle::before{content:'⌁';margin-right:5px;color:#d7b7f0}
      #spreadOverlay #spreadRationale.lunea-v27-rationale{
        position:relative;margin-top:0!important;overflow:hidden!important;
        transition:max-height .24s ease,opacity .24s ease,padding .24s ease,margin .24s ease!important
      }
      #spreadOverlay #spreadRationale.lunea-v27-rationale.is-collapsed{
        display:block!important;max-height:0!important;padding-top:0!important;padding-bottom:0!important;
        margin-bottom:0!important;opacity:0!important;border-width:0!important
      }
      #spreadOverlay #spreadRationale.lunea-v27-rationale.is-expanded{
        display:block!important;max-height:32dvh!important;overflow-y:auto!important;opacity:1!important;
        margin-bottom:12px!important;border-width:1px!important;-webkit-overflow-scrolling:touch
      }
      #spreadOverlay #spreadRationale.lunea-v27-rationale.is-structural{
        background:radial-gradient(circle at 0 0,rgba(112,221,210,.08),transparent 36%),linear-gradient(145deg,rgba(15,25,34,.76),rgba(22,17,35,.72))!important;
        border-color:rgba(119,218,209,.16)!important;color:#a9b9c2!important
      }
      @media(max-width:480px){
        #spreadOverlay .modal{padding-top:15px!important}
        #spreadOverlay #spreadType{font-size:8.7px!important;letter-spacing:1.05px!important}
        #spreadOverlay #spreadQuestion.lunea-v27-question{margin-top:8px!important}
        #spreadOverlay .actionbar{margin-top:8px!important}
      }

      #archiveOverlay{
        --v27-teal:#84f0df;--v27-teal2:#4fd0c5;--v27-rose:#ff9bc6;
        --v27-rose2:#e97aa8;--v27-gold:#ffd58b;--v27-lilac:#cbb7ff
      }
      #archiveOverlay .archive-modal{
        position:relative!important;overflow:hidden!important;
        background:radial-gradient(circle at 8% 0%,rgba(76,215,200,.23),transparent 27%),radial-gradient(circle at 96% 8%,rgba(255,139,190,.18),transparent 25%),radial-gradient(circle at 48% 110%,rgba(190,156,255,.10),transparent 34%),linear-gradient(164deg,#101824 0%,#10131f 43%,#181220 100%)!important;
        border-color:rgba(120,231,218,.34)!important;
        box-shadow:0 28px 80px rgba(0,0,0,.75),0 0 0 1px rgba(255,161,200,.055),0 0 42px rgba(74,205,193,.10)!important
      }
      #archiveOverlay .archive-modal::before{
        content:'';position:absolute;inset:0 0 auto 0;height:2px;pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(115,239,223,.85),rgba(255,167,202,.75),rgba(255,215,143,.55),transparent);opacity:.75
      }
      #archiveOverlay .sub{color:#aaf5e8!important;text-shadow:0 0 15px rgba(78,215,202,.22)!important}
      #archiveOverlay .modal-h{color:#fff8fd!important;letter-spacing:-.35px!important}
      #archiveOverlay .modal-h::after{
        content:'';display:block;width:74px;height:1px;margin-top:9px;
        background:linear-gradient(90deg,var(--v27-teal),rgba(255,155,198,.8),transparent);box-shadow:0 0 12px rgba(89,224,210,.3)
      }
      #archiveOverlay .lj-stats{gap:8px!important;margin:12px 0 10px!important}
      #archiveOverlay .lj-stat{
        min-height:76px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;
        border-radius:16px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 8px 24px rgba(0,0,0,.12)!important
      }
      #archiveOverlay .lj-stat:nth-child(1){border-color:rgba(113,237,220,.31)!important;background:linear-gradient(145deg,rgba(70,207,194,.17),rgba(93,104,174,.07))!important}
      #archiveOverlay .lj-stat:nth-child(2){border-color:rgba(255,213,139,.32)!important;background:linear-gradient(145deg,rgba(255,203,111,.14),rgba(157,118,70,.045))!important}
      #archiveOverlay .lj-stat:nth-child(3){border-color:rgba(255,143,190,.38)!important;background:linear-gradient(145deg,rgba(245,113,167,.18),rgba(121,72,138,.07))!important}
      #archiveOverlay .lj-stat:nth-child(4){border-color:rgba(190,171,255,.28)!important;background:linear-gradient(145deg,rgba(164,139,239,.14),rgba(83,97,153,.055))!important}
      #archiveOverlay .lj-stat b{font-size:19px!important;line-height:1!important;margin-bottom:8px!important}
      #archiveOverlay .lj-stat:nth-child(1) b{color:#d9fffa!important}
      #archiveOverlay .lj-stat:nth-child(2) b{color:#ffe9bd!important}
      #archiveOverlay .lj-stat:nth-child(3) b{color:#ffacd0!important}
      #archiveOverlay .lj-stat:nth-child(4) b{color:#e7deff!important}
      #archiveOverlay .lj-stat span{font-size:9.4px!important;color:#abb7c2!important}
      #archiveOverlay .lj-note{
        margin:0 0 12px!important;padding:10px 11px!important;border-radius:13px!important;
        border:1px solid rgba(100,226,212,.12)!important;border-left:3px solid rgba(105,235,219,.68)!important;
        background:linear-gradient(90deg,rgba(65,194,181,.10),rgba(255,150,193,.045))!important;color:#acc2c6!important;font-size:9.3px!important
      }
      #archiveOverlay .archive-toolbar{gap:8px!important}
      #archiveOverlay .archive-toolbar input,#archiveOverlay .lj-filter select{
        border-radius:14px!important;border-color:rgba(117,229,216,.17)!important;
        background:rgba(5,12,20,.67)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important
      }
      #archiveOverlay .archive-toolbar input:focus,#archiveOverlay .lj-filter select:focus{
        border-color:rgba(105,235,219,.58)!important;box-shadow:0 0 0 3px rgba(74,207,194,.08),0 0 18px rgba(74,207,194,.055)!important
      }
      #archiveOverlay .archive-toolbar button,#archiveOverlay .lj-tools button{border-radius:13px!important}
      #archiveOverlay #copyAllArchive{color:#dbfff9!important;border-color:rgba(96,224,210,.31)!important;background:linear-gradient(145deg,rgba(61,192,180,.14),rgba(125,100,190,.08))!important}
      #archiveOverlay .lj-tools button:first-child{color:#ffe9bd!important;border-color:rgba(255,211,137,.24)!important;background:rgba(255,203,112,.055)!important}
      #archiveOverlay .lj-tools button:nth-child(2){color:#f3d9ff!important;border-color:rgba(208,169,244,.22)!important;background:rgba(179,129,221,.055)!important}
      #archiveOverlay .archive-item{
        position:relative!important;overflow:hidden!important;padding:14px 13px 13px!important;border-radius:18px!important;
        border:1px solid rgba(129,223,214,.18)!important;
        background:radial-gradient(circle at 0 0,rgba(94,222,209,.09),transparent 34%),radial-gradient(circle at 100% 0,rgba(255,145,189,.065),transparent 31%),linear-gradient(145deg,rgba(20,29,43,.91),rgba(18,19,33,.94))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 10px 28px rgba(0,0,0,.15)!important
      }
      #archiveOverlay .archive-item::before{content:'';position:absolute;left:0;top:13px;bottom:13px;width:3px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,var(--v27-teal),var(--v27-lilac));opacity:.72}
      #archiveOverlay .archive-item[data-lunea-category='LOVE']::before{background:linear-gradient(180deg,#ff9cc8,#de78a4)}
      #archiveOverlay .archive-item[data-lunea-category='STOCK']::before{background:linear-gradient(180deg,#7beadf,#62a8e9)}
      #archiveOverlay .archive-item[data-lunea-category='CAREER']::before{background:linear-gradient(180deg,#ffd58b,#d1b27d)}
      #archiveOverlay .archive-item[data-lunea-category='DAILY']::before{background:linear-gradient(180deg,#c9b5ff,#8bb8e7)}
      #archiveOverlay .archive-item[data-lunea-category='GENERAL']::before{background:linear-gradient(180deg,#9be9dc,#c8b4ff)}
      #archiveOverlay .archive-meta{color:#9bded6!important;font-size:9.6px!important;letter-spacing:.15px!important;margin-bottom:6px!important}
      #archiveOverlay .archive-item[data-lunea-category='LOVE'] .archive-meta{color:#f6a4c7!important}
      #archiveOverlay .archive-item[data-lunea-category='CAREER'] .archive-meta{color:#e8c98e!important}
      #archiveOverlay .archive-item[data-lunea-category='DAILY'] .archive-meta{color:#c7b7f7!important}
      #archiveOverlay .archive-title{
        padding-right:0!important;color:#fffafe!important;font-size:14.4px!important;line-height:1.38!important;
        overflow-wrap:anywhere!important;word-break:break-word!important;display:block!important;margin-bottom:7px!important
      }
      #archiveOverlay .archive-q{
        color:#c4c8d3!important;font-size:11px!important;line-height:1.58!important;
        display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:4;
        overflow:hidden!important;overflow-wrap:anywhere!important;word-break:break-word!important
      }
      #archiveOverlay .lj-badge{
        float:none!important;display:inline-flex!important;align-items:center!important;vertical-align:middle!important;
        margin-left:7px!important;transform:translateY(-1px);padding:4px 8px!important;border-radius:999px!important;background:rgba(7,15,23,.66)!important
      }
      #archiveOverlay .lj-badge[data-s='pending']{color:#b7c4d0!important;border-color:rgba(156,181,197,.25)!important}
      #archiveOverlay .lj-badge[data-s='hit']{color:#a5ffe4!important;border-color:rgba(112,244,205,.42)!important;background:rgba(65,190,156,.08)!important}
      #archiveOverlay .lj-badge[data-s='partial']{color:#ffe1a1!important;border-color:rgba(255,210,119,.42)!important;background:rgba(213,166,70,.07)!important}
      #archiveOverlay .lj-badge[data-s='miss']{color:#ff9fb4!important;border-color:rgba(255,128,155,.42)!important;background:rgba(209,78,113,.07)!important}
      #archiveOverlay .lj-badge[data-s='unverifiable']{color:#d6caef!important;border-color:rgba(190,169,229,.28)!important}
      #archiveOverlay .archive-actions{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin-top:10px!important}
      #archiveOverlay .archive-actions .mini{min-width:0!important;padding:7px 4px!important;border-radius:12px!important;font-size:9.7px!important;white-space:nowrap!important}
      #archiveOverlay .archive-actions .mini:nth-child(1){color:#d9fff8!important;border-color:rgba(99,231,214,.30)!important;background:linear-gradient(145deg,rgba(60,203,187,.13),rgba(104,95,177,.06))!important}
      #archiveOverlay .archive-actions .mini:nth-child(2){color:#eadfff!important;border-color:rgba(190,165,237,.24)!important;background:rgba(159,126,218,.055)!important}
      #archiveOverlay .archive-actions .mini:nth-child(3){color:#ffe9bb!important;border-color:rgba(244,204,128,.22)!important;background:rgba(222,177,88,.045)!important}
      #archiveOverlay .archive-actions .mini:nth-child(4){color:#ffafc0!important;border-color:rgba(239,113,144,.29)!important;background:rgba(211,73,108,.055)!important}
      #archiveOverlay .archive-detail{max-width:100%!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important;color:#bdc8d1!important}
      #archiveOverlay .lj-review{
        border-radius:15px!important;border-color:rgba(255,148,192,.18)!important;
        background:radial-gradient(circle at 0 0,rgba(76,215,200,.09),transparent 38%),linear-gradient(145deg,rgba(7,24,28,.82),rgba(28,15,30,.78))!important
      }
      #archiveOverlay .lj-statuses .on{box-shadow:0 0 0 1px rgba(106,234,218,.12),0 0 16px rgba(74,207,194,.08)!important}
      #archiveOverlay .lj-save{color:#f7fffd!important;border-color:rgba(104,234,217,.42)!important;background:linear-gradient(110deg,rgba(61,201,185,.23),rgba(229,111,163,.14))!important;box-shadow:0 0 18px rgba(61,201,185,.055)!important}
      #archiveOverlay #clearArchive{color:#ffb3c3!important;border-color:rgba(232,103,136,.32)!important;background:rgba(189,58,95,.045)!important}
      @media(max-width:390px){
        #archiveOverlay .archive-modal{padding-left:13px!important;padding-right:13px!important}
        #archiveOverlay .lj-stat{min-height:68px!important}
        #archiveOverlay .archive-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #archiveOverlay .archive-actions .mini{font-size:10px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureCompactControls() {
    const question = $('spreadQuestion');
    const rationale = $('spreadRationale');
    if (!question || !rationale) return false;
    question.classList.add('lunea-v27-question');
    rationale.classList.add('lunea-v27-rationale');
    let controls = $('luneaV27CompactControls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'luneaV27CompactControls';
      rationale.parentNode?.insertBefore(controls, rationale);
    }
    let qBtn = $('luneaV27QuestionToggle');
    if (!qBtn) {
      qBtn = document.createElement('button');
      qBtn.id = 'luneaV27QuestionToggle';qBtn.type = 'button';qBtn.className = 'mini';
      qBtn.addEventListener('click', () => {
        const expanded = question.classList.toggle('is-expanded');
        question.classList.toggle('is-collapsed', !expanded);
        qBtn.textContent = expanded ? '질문 접기' : '질문 전체 보기';
      });
      controls.appendChild(qBtn);
    }
    let rBtn = $('luneaV27RationaleToggle');
    if (!rBtn) {
      rBtn = document.createElement('button');
      rBtn.id = 'luneaV27RationaleToggle';rBtn.type = 'button';rBtn.className = 'mini';
      rBtn.addEventListener('click', () => {
        const expanded = rationale.classList.toggle('is-expanded');
        rationale.classList.toggle('is-collapsed', !expanded);
        const structural = rationale.classList.contains('is-structural');
        rBtn.textContent = expanded ? (structural ? '질문 구조 접기' : '설계 근거 접기') : (structural ? '질문 구조 보기' : '설계 근거 보기');
      });
      controls.appendChild(rBtn);
    }
    return true;
  }

  function refreshSpreadCompactness(forceCollapse = false) {
    const question = $('spreadQuestion');
    const rationale = $('spreadRationale');
    const qBtn = $('luneaV27QuestionToggle');
    const rBtn = $('luneaV27RationaleToggle');
    if (!question || !rationale || !qBtn || !rBtn) return;
    const qText = String(question.textContent || '').trim();
    const rText = String(rationale.textContent || '').trim();
    const longQuestion = qText.length >= LONG_QUESTION_CHARS;
    qBtn.style.display = longQuestion ? '' : 'none';
    if (forceCollapse || !longQuestion) {
      question.classList.remove('is-expanded');
      question.classList.toggle('is-collapsed', longQuestion);
      qBtn.textContent = '질문 전체 보기';
    } else if (!question.classList.contains('is-expanded')) question.classList.add('is-collapsed');
    const structural = /STRUCTURAL ROUTING|requested_axes=|target_count|candidate_flow|coverage=/i.test(rText);
    rationale.classList.toggle('is-structural', structural);
    rBtn.style.display = rText ? '' : 'none';
    if (rText) {
      if (forceCollapse || (!rationale.classList.contains('is-expanded') && !rationale.classList.contains('is-collapsed'))) {
        rationale.classList.remove('is-expanded');rationale.classList.add('is-collapsed');
      }
      rBtn.textContent = rationale.classList.contains('is-expanded') ? (structural ? '질문 구조 접기' : '설계 근거 접기') : (structural ? '질문 구조 보기' : '설계 근거 보기');
    } else rationale.classList.remove('is-expanded','is-collapsed','is-structural');
  }

  function decorateJournalItems() {
    const list = $('archiveList');
    if (!list) return;
    list.querySelectorAll('.archive-item').forEach(item => {
      const meta = item.querySelector('.archive-meta')?.textContent || '';
      const match = meta.match(CATEGORY_RE);
      item.dataset.luneaCategory = (match?.[1] || 'GENERAL').toUpperCase();
    });
  }

  function installObservers() {
    const question = $('spreadQuestion');
    const rationale = $('spreadRationale');
    const spreadOverlay = $('spreadOverlay');
    const archiveList = $('archiveList');
    if (question && !question.__luneaV27Observed) {
      question.__luneaV27Observed = true;
      new MutationObserver(() => refreshSpreadCompactness(true)).observe(question,{childList:true,characterData:true,subtree:true});
    }
    if (rationale && !rationale.__luneaV27Observed) {
      rationale.__luneaV27Observed = true;
      new MutationObserver(() => refreshSpreadCompactness(true)).observe(rationale,{childList:true,characterData:true,subtree:true});
    }
    if (spreadOverlay && !spreadOverlay.__luneaV27Observed) {
      spreadOverlay.__luneaV27Observed = true;
      new MutationObserver(() => {
        if (spreadOverlay.classList.contains('show')) requestAnimationFrame(() => refreshSpreadCompactness(true));
      }).observe(spreadOverlay,{attributes:true,attributeFilter:['class']});
    }
    if (archiveList && !archiveList.__luneaV27Observed) {
      archiveList.__luneaV27Observed = true;
      new MutationObserver(() => decorateJournalItems()).observe(archiveList,{childList:true,subtree:true});
    }
  }

  function boot() {
    addStyles();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ready = ensureCompactControls();
      installObservers();decorateJournalItems();
      if (ready) refreshSpreadCompactness(true);
      if ((ready && $('archiveOverlay')) || tries > 160) clearInterval(timer);
    },80);
    ensureCompactControls();installObservers();decorateJournalItems();refreshSpreadCompactness(true);
    console.info('✨ LUNEA V27 mobile long-question + journal polish active');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
