'use strict';

/* LUNEA RECOVERY UI V65
   Final deterministic repair for the Vercel recovery branch.
   - Makes the archive close control reliable after an iOS/PWA resume.
   - Pins the 12 reading actions to the intended 3-column order.
   - Keeps Timing labels authoritative and selects artwork by the number that is
     actually printed on the uploaded card, including the misnamed upload files.
   Existing readings, IndexedDB, localStorage and draft state are never cleared.
*/
(() => {
  const W = window;
  if (W.__LUNEA_RECOVERY_UI_V65__) return;
  W.__LUNEA_RECOVERY_UI_V65__ = true;

  const RELEASE = '20260907-v65';
  const $ = id => document.getElementById(id);
  const norm = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

  const ACTION_ORDER = [
    'flipAll',
    'aiRead',
    'saveReading',
    'retry',
    'extraCard',
    'timingSupportBtn',
    'astroTransitBtn',
    'thaiTaksaBtn',
    'luneaThaiTarotRangeBtn',
    'astroReturnBtn',
    'astroHoraryBtn',
    'luneaTopCopyPrompt'
  ];
  const THAI_ACTION_IDS = ['thaiTaksaBtn', 'luneaThaiTarotBridgeBtn'];

  /* The 2026-09-05 upload contains correct printed faces for 21-37, 39-60,
     but several filenames do not match the number printed on the card. It also
     contains 41-60 duplicated under 001-020, so 1-20 and 38 must use the
     original semantic artwork. */
  const UPLOADED_FACE = Object.freeze({
    21:'timing_021.jpg', 22:'timing_022.jpg', 23:'timing_023.jpg', 24:'timing_024.jpg',
    25:'timing_025.jpg', 26:'timing_026.jpg', 27:'timing_027.jpg', 28:'timing_028.jpg',
    29:'timing_029.jpg', 30:'timing_030.jpg', 31:'timing_031.jpg', 32:'timing_032.jpg',
    33:'timing_033.jpg', 34:'timing_034.jpg', 35:'timing_035.jpg', 36:'timing_036.jpg',
    37:'timing_037.jpg', 39:'timing_038.jpg', 40:'timing_040.jpg',
    41:'timing_041.PNG', 42:'timing_042.PNG', 43:'timing_043.PNG', 44:'timing_044.PNG',
    45:'timing_045.PNG', 46:'timing_046.PNG', 47:'timing_047.PNG', 48:'timing_048.PNG',
    49:'timing_049.PNG', 50:'timing_050.PNG', 51:'timing_051.jpg', 52:'timing_052.jpg',
    53:'timing_053.jpg', 54:'timing_054.jpg', 55:'timing_055.jpg', 56:'timing_058.jpg',
    57:'timing_056.jpg', 58:'timing_057.jpg', 59:'timing_060.jpg', 60:'timing_059.jpg'
  });

  let cards = [];
  let byLabel = new Map();

  function cardNumber(card) {
    const match = String(card?.id || card?.filename || '').match(/(?:LT-|timing_)(\d{3})/i);
    const number = Number(match?.[1] || 0);
    return number >= 1 && number <= 60 ? number : 0;
  }

  function absoluteAsset(filename) {
    if (!filename) return '';
    const url = new URL(`./${String(filename).replace(/^\.\//, '')}`, document.baseURI);
    url.searchParams.set('v', RELEASE);
    return url.href;
  }

  function artwork(card) {
    const number = cardNumber(card);
    return absoluteAsset(UPLOADED_FACE[number] || card?.filename);
  }

  async function loadTimingDeck() {
    try {
      const response = await fetch(`./lunea_timing_oracle_v1.json?v=${RELEASE}`, {cache:'no-cache'});
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      cards = Array.isArray(data?.cards) ? data.cards : [];
      byLabel = new Map();
      cards.forEach(card => {
        [card.label_ko, card.label_en, card.id, card.filename].forEach(value => {
          const key = norm(value);
          if (key) byLabel.set(key, card);
        });
      });
    } catch (error) {
      console.warn('[LUNEA V65] Timing deck unavailable', error);
    }
  }

  function cardFromLabels(ko, en, fallback = '') {
    return byLabel.get(norm(en)) || byLabel.get(norm(ko)) || byLabel.get(norm(fallback)) || null;
  }

  function setArtwork(img, card) {
    const src = artwork(card);
    if (!(img instanceof HTMLImageElement) || !src) return false;
    const number = cardNumber(card);
    img.dataset.luneaTimingCardId = card.id || '';
    img.dataset.luneaTimingSemantic = String(number || '');
    img.dataset.luneaTimingArtworkV65 = '1';
    img.alt = card.label_ko || '';
    if (img.src !== src) img.src = src;
    return true;
  }

  function syncTiming() {
    if (!cards.length) return false;
    let changed = false;
    const main = $('timingImage');
    if (main) {
      const card = cardFromLabels(
        $('timingLabelKo')?.textContent,
        $('timingLabelEn')?.textContent,
        main.dataset.luneaTimingCardId
      );
      if (card) changed = setArtwork(main, card) || changed;
    }

    document.querySelectorAll('#luneaTimingABCards .tab-card').forEach(panel => {
      const img = panel.querySelector('img');
      const card = cardFromLabels(
        panel.querySelector('b')?.textContent,
        panel.querySelector('em')?.textContent,
        img?.dataset?.luneaTimingCardId
      );
      if (card) changed = setArtwork(img, card) || changed;
    });

    const inline = $('luneaTimingInline');
    if (inline) {
      const img = inline.querySelector('img');
      const card = cardFromLabels(
        inline.querySelector('.txt b,b')?.textContent,
        '',
        img?.dataset?.luneaTimingCardId
      );
      if (card) changed = setArtwork(img, card) || changed;
    }
    return changed;
  }

  function scheduleTiming() {
    [0, 90, 240, 520, 900].forEach(ms => setTimeout(syncTiming, ms));
  }

  function ensureThaiRange() {
    let button = $('luneaThaiTarotRangeBtn');
    if (button) return button;
    const bar = document.querySelector('#spreadOverlay .actionbar');
    const thai = THAI_ACTION_IDS.map($).find(Boolean);
    if (!bar || !thai) return null;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'luneaThaiTarotRangeBtn';
    button.className = thai.className || 'mini';
    button.textContent = '🇹🇭 Thai 기간';
    button.onclick = () => {
      const api = W.LUNEA_THAI_RANGE_V33;
      if (typeof api?.openTarot === 'function') api.openTarot();
      else alert('Thai 기간 기능을 불러오는 중이야. 잠시 후 다시 눌러줘.');
    };
    bar.appendChild(button);
    return button;
  }

  function reorderActions() {
    ensureThaiRange();
    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (!bar) return false;
    const rank = new Map(ACTION_ORDER.map((id, index) => [id, index]));
    rank.set('luneaThaiTarotBridgeBtn', rank.get('thaiTaksaBtn'));
    const target = [...bar.children]
      .sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 999) - (rank.has(b.id) ? rank.get(b.id) : 999));
    target.forEach((node, index) => {
      if (bar.children[index] !== node) bar.insertBefore(node, bar.children[index] || null);
    });
    return true;
  }

  function closeArchive() {
    const overlay = $('archiveOverlay');
    if (!overlay) return false;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.pointerEvents = 'none';
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
    document.activeElement?.blur?.();
    return true;
  }

  function syncArchivePointerState() {
    const overlay = $('archiveOverlay');
    if (!overlay) return;
    overlay.style.pointerEvents = overlay.classList.contains('show') ? 'auto' : 'none';
  }

  function addStyle() {
    if ($('luneaRecoveryUiV65Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaRecoveryUiV65Style';
    style.textContent = `
      #archiveOverlay.show{pointer-events:auto!important}
      #archiveOverlay [data-close="archive"]{pointer-events:auto!important;z-index:80!important;touch-action:manipulation!important}
      #spreadOverlay .actionbar>#flipAll{order:1}
      #spreadOverlay .actionbar>#aiRead{order:2}
      #spreadOverlay .actionbar>#saveReading{order:3}
      #spreadOverlay .actionbar>#retry{order:4}
      #spreadOverlay .actionbar>#extraCard{order:5}
      #spreadOverlay .actionbar>#timingSupportBtn{order:6}
      #spreadOverlay .actionbar>#astroTransitBtn{order:7}
      #spreadOverlay .actionbar>#thaiTaksaBtn{order:8}
      #spreadOverlay .actionbar>#luneaThaiTarotBridgeBtn{order:8}
      #spreadOverlay .actionbar>#luneaThaiTarotRangeBtn{order:9}
      #spreadOverlay .actionbar>#astroReturnBtn{order:10}
      #spreadOverlay .actionbar>#astroHoraryBtn{order:11}
      #spreadOverlay .actionbar>#luneaTopCopyPrompt{order:12}
    `;
    document.head.appendChild(style);
  }

  function boot() {
    addStyle();
    reorderActions();
    syncArchivePointerState();
    loadTimingDeck().then(scheduleTiming);

    const archive = $('archiveOverlay');
    if (archive && !archive.__luneaV65Observed) {
      archive.__luneaV65Observed = true;
      new MutationObserver(syncArchivePointerState).observe(archive, {attributes:true, attributeFilter:['class']});
    }

    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (bar && !bar.__luneaV65Observed) {
      bar.__luneaV65Observed = true;
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; reorderActions(); });
      }).observe(bar, {childList:true});
    }

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#archiveOverlay [data-close="archive"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeArchive();
        return;
      }
      if (event.target?.closest?.('#archiveBtn')) setTimeout(syncArchivePointerState, 0);
      if (event.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,[data-open="timing"],#luneaTimingABPanel')) scheduleTiming();
      if (event.target?.closest?.('#spreadOverlay')) setTimeout(reorderActions, 0);
    }, true);

    W.addEventListener('pageshow', () => {
      syncArchivePointerState();
      reorderActions();
      scheduleTiming();
    }, {passive:true});

    W.LUNEA_RECOVERY_UI_V65 = Object.freeze({
      version:65,
      actionOrder:[...ACTION_ORDER],
      uploadedFace:{...UPLOADED_FACE},
      closeArchive,
      reorderActions,
      syncTiming
    });
    console.info('✅ LUNEA Recovery UI V65 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
