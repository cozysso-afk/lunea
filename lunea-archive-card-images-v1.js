'use strict';

/*
  LUNEA ARCHIVE CARD IMAGES V1
  ============================
  - Stores only tarot card asset references (code + img URL), never base64 blobs.
  - Backfills older LUNEA_ARCHIVE_V3 entries by matching saved card names/codes
    against the live 78-card RWS deck.
  - Adds a compact horizontal card gallery to each archive entry.
  - Keeps the existing archive text/copy/delete/search flow untouched.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ARCHIVE_CARD_IMAGES_V1__) return;
  W.__LUNEA_ARCHIVE_CARD_IMAGES_V1__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const VERSION = 1;
  const $ = id => document.getElementById(id);

  function readArchive() {
    try {
      const value = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeArchive(rows) {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify((Array.isArray(rows) ? rows : []).slice(0, 100)));
      return true;
    } catch (error) {
      console.info('[LUNEA archive card images] archive write skipped', error?.message || error);
      return false;
    }
  }

  function deckRows() {
    try {
      return Array.isArray(TAROT_DECK) ? TAROT_DECK : [];
    } catch {
      return [];
    }
  }

  function deckMatch(card) {
    if (!card) return null;
    const code = String(card.code || '').trim();
    const name = String(card.name || '').trim();
    return deckRows().find(row => (code && row.code === code) || (name && row.name === name)) || null;
  }

  function enrichCard(saved, live) {
    const fallback = live || deckMatch(saved) || null;
    const next = {...(saved || {})};
    if (!next.code && fallback?.code) next.code = fallback.code;
    if (!next.name && fallback?.name) next.name = fallback.name;
    if (!next.img && fallback?.img) next.img = fallback.img;

    const savedSubs = Array.isArray(saved?.subCards) ? saved.subCards : [];
    const liveSubs = Array.isArray(live?.subCards) ? live.subCards : [];
    next.subCards = savedSubs.map((sub, index) => enrichCard(sub, liveSubs[index] || null));
    return next;
  }

  function currentDrawn() {
    try {
      return Array.isArray(state?.drawn) ? state.drawn : [];
    } catch {
      return [];
    }
  }

  function migrateArchive() {
    const rows = readArchive();
    let changed = false;
    rows.forEach(item => {
      if (!Array.isArray(item?.cards)) return;
      const upgraded = item.cards.map(card => enrichCard(card, null));
      const before = JSON.stringify(item.cards);
      const after = JSON.stringify(upgraded);
      if (before !== after || item.cardImagesVersion !== VERSION) {
        item.cards = upgraded;
        item.cardImagesVersion = VERSION;
        changed = true;
      }
    });
    if (changed) writeArchive(rows);
    return changed;
  }

  function patchNewlySaved(beforeIds) {
    const liveCards = currentDrawn();
    if (!liveCards.length) return false;

    const rows = readArchive();
    if (!rows.length) return false;
    let item = rows.find(row => !beforeIds.has(String(row?.id || '')));
    if (!item) item = rows[0];
    if (!item || !Array.isArray(item.cards)) return false;

    item.cards = item.cards.map((saved, index) => enrichCard(saved, liveCards[index] || null));
    item.cardImagesVersion = VERSION;
    return writeArchive(rows);
  }

  function installSaveHook() {
    const button = $('saveReading');
    if (!button) return false;
    const prior = button.onclick;
    if (typeof prior !== 'function') return false;
    if (prior.__luneaArchiveCardImagesV1) return true;

    const wrapped = function(event) {
      const beforeIds = new Set(readArchive().map(row => String(row?.id || '')));
      let result;
      try {
        result = prior.call(this, event);
      } finally {
        Promise.resolve(result).catch(() => {}).finally(() => {
          queueMicrotask(() => patchNewlySaved(beforeIds));
        });
      }
      return result;
    };
    wrapped.__luneaArchiveCardImagesV1 = true;
    wrapped.__luneaPriorSave = prior;
    button.onclick = wrapped;
    return true;
  }

  function installStyles() {
    if ($('luneaArchiveCardImagesV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaArchiveCardImagesV1Style';
    style.textContent = `
      .lunea-archive-card-strip{
        display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;
        margin:8px -2px 10px;padding:2px 2px 7px;
        -webkit-overflow-scrolling:touch;scrollbar-width:none;
        overscroll-behavior-x:contain;touch-action:pan-x;
      }
      .lunea-archive-card-strip::-webkit-scrollbar{display:none}
      .lunea-archive-card-thumb{
        flex:0 0 70px;min-width:70px;text-align:center;
        color:#cfc7dc;font-size:8.4px;line-height:1.28;
      }
      .lunea-archive-card-frame{
        width:70px;height:115px;border-radius:9px;overflow:hidden;
        border:1px solid rgba(220,210,245,.18);
        background:linear-gradient(145deg,rgba(42,34,64,.88),rgba(11,10,19,.97));
        box-shadow:0 7px 18px rgba(0,0,0,.28);position:relative;
      }
      .lunea-archive-card-frame img{
        display:block;width:100%;height:100%;object-fit:cover;
        transform-origin:50% 50%;
      }
      .lunea-archive-card-thumb.is-reversed .lunea-archive-card-frame img{transform:rotate(180deg)}
      .lunea-archive-card-position{
        display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;
        overflow:hidden;margin-top:4px;min-height:21px;color:#aaa2b8;
      }
      .lunea-archive-card-direction{
        position:absolute;right:4px;bottom:4px;padding:2px 4px;border-radius:999px;
        background:rgba(8,7,13,.76);border:1px solid rgba(255,255,255,.12);
        color:#eee9f6;font-size:7px;font-weight:700;line-height:1;
      }
      .lunea-archive-card-missing{
        width:100%;height:100%;display:grid;place-items:center;
        color:#8e849f;font-size:20px;
      }
      @media(max-width:390px){
        .lunea-archive-card-thumb{flex-basis:64px;min-width:64px}
        .lunea-archive-card-frame{width:64px;height:105px}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function safeText(value) {
    return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function resolvedCard(card) {
    const match = deckMatch(card);
    return {
      ...(card || {}),
      code: card?.code || match?.code || '',
      name: card?.name || match?.name || '',
      img: card?.img || match?.img || ''
    };
  }

  function makeStrip(item) {
    const cards = Array.isArray(item?.cards) ? item.cards : [];
    if (!cards.length) return null;

    const strip = document.createElement('div');
    strip.className = 'lunea-archive-card-strip';
    strip.dataset.horizontalScroll = '1';
    strip.setAttribute('aria-label', '저장된 타로 카드 이미지');

    cards.forEach(card => {
      const data = resolvedCard(card);
      const thumb = document.createElement('div');
      thumb.className = 'lunea-archive-card-thumb' + (data.isReversed ? ' is-reversed' : '');
      const label = data.position || data.name || '카드';
      const direction = data.isReversed ? '역' : '정';
      thumb.innerHTML = `
        <div class="lunea-archive-card-frame">
          ${data.img ? `<img loading="lazy" decoding="async" src="${safeText(data.img)}" alt="${safeText(data.name || label)}">` : '<div class="lunea-archive-card-missing">✦</div>'}
          <span class="lunea-archive-card-direction">${direction}</span>
        </div>
        <div class="lunea-archive-card-position">${safeText(label)}</div>`;
      const image = thumb.querySelector('img');
      if (image) image.addEventListener('error', () => {
        image.replaceWith(Object.assign(document.createElement('div'), {className:'lunea-archive-card-missing', textContent:'✦'}));
      }, {once:true});
      strip.appendChild(thumb);
    });
    return strip;
  }

  function filteredArchiveRows() {
    const q = String($('archiveSearch')?.value || '').trim().toLowerCase();
    return readArchive().filter(item => !q || [item?.title, item?.q, item?.ai].join(' ').toLowerCase().includes(q));
  }

  function decorateArchive() {
    const list = $('archiveList');
    if (!list) return false;
    const rows = filteredArchiveRows();
    const nodes = [...list.querySelectorAll(':scope > .archive-item')];
    nodes.forEach((node, index) => {
      if (node.dataset.luneaArchiveCardImagesV1 === '1') return;
      const item = rows[index];
      if (!item) return;
      const strip = makeStrip(item);
      if (!strip) return;
      node.dataset.luneaArchiveCardImagesV1 = '1';
      const actions = node.querySelector('.archive-actions');
      if (actions) node.insertBefore(strip, actions);
      else node.appendChild(strip);
    });
    return true;
  }

  function observeArchive() {
    const list = $('archiveList');
    if (!list || list.__luneaArchiveCardImagesObserver) return !!list;
    list.__luneaArchiveCardImagesObserver = true;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        decorateArchive();
      });
    };
    new MutationObserver(schedule).observe(list, {childList:true});
    $('archiveSearch')?.addEventListener('input', () => requestAnimationFrame(decorateArchive));
    schedule();
    return true;
  }

  function boot() {
    installStyles();
    migrateArchive();
    installSaveHook();
    observeArchive();

    // Some legacy modules reassign button handlers late. Re-check briefly without
    // keeping a permanent polling loop alive.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      installSaveHook();
      observeArchive();
      if (tries >= 20) clearInterval(timer);
    }, 120);

    W.LUNEA_ARCHIVE_CARD_IMAGES_V1 = Object.freeze({
      version: VERSION,
      migrateArchive,
      decorateArchive,
      patchNewlySaved
    });
    console.info('🃏 LUNEA Archive Card Images V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
