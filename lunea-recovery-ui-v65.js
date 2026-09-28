'use strict';

/* LUNEA RECOVERY UI V65
   Final deterministic repair for the Vercel recovery branch.
   - Keeps Timing labels authoritative and selects final Timing artwork 1:1 by
     the semantic card number from the canonical LT-### PNG asset set.
   Existing readings, IndexedDB, localStorage and draft state are never cleared.
*/
(() => {
  const W = window;
  if (W.__LUNEA_RECOVERY_UI_V65__) return;
  W.__LUNEA_RECOVERY_UI_V65__ = true;

  const RELEASE = '20260911-v65-lt-final60';
  const $ = id => document.getElementById(id);
  const norm = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

  const FINAL_FACE = Object.freeze(Object.fromEntries(
    Array.from({length:60}, (_, index) => {
      const number = index + 1;
      return [number, `assets/timing-oracle/cards/LT-${String(number).padStart(3, '0')}.png`];
    })
  ));

  let cards = [];
  let byLabel = new Map();
  let readyPromise = Promise.resolve(false);

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
    return absoluteAsset(FINAL_FACE[number]);
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

  function boot() {
    readyPromise = loadTimingDeck().then(() => {
      scheduleTiming();
      return cards.length > 0;
    });

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,[data-open="timing"],#luneaTimingABPanel')) scheduleTiming();
    }, true);

    W.addEventListener('pageshow', () => {
      scheduleTiming();
    }, {passive:true});

    W.LUNEA_RECOVERY_UI_V65 = Object.freeze({
      version:65,
      get ready(){return readyPromise},
      uploadedFace:{...FINAL_FACE},
      artworkForCard:artwork,
      syncTiming
    });
    console.info('✅ LUNEA Recovery UI V65 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
