'use strict';

/* LUNEA READING ATTACHMENTS V1
   Exact-reading persistence for bounded, already-computed support evidence.
   Timing draft restoration remains owned by V50; this owner supplies one
   archive enrichment path and a registry future support tools can join.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_ATTACHMENTS_V1__) return;
  W.__LUNEA_READING_ATTACHMENTS_V1__ = true;

  const VERSION = 1;
  const DRAFT_KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const MAX_ATTACHMENT_BYTES = 220000;
  const MAX_DRAFT_ATTACHMENT_BYTES = 700000;
  const INLINE_IDS = [
    'luneaTimingInline',
    'luneaMessageOracleInline',
    'luneaAstroTransitInline',
    'luneaReturnInline',
    'luneaThaiTarotBridgeInline',
    'luneaThaiTaksaInline',
    'luneaThaiRangeInline',
    'luneaHoraryInline'
  ];
  const KNOWN_ARCHIVE_KEYS = [
    'astroTransit', 'astroReturns', 'thaiTaksa', 'thaiTaksaRange',
    'thaiRange', 'horary', 'timing', 'messageOracle'
  ];
  const DEFAULTS = Object.freeze({
    astroTransit:{archiveKey:'astroTransit',group:'astro'},
    astroReturns:{archiveKey:'astroReturns',group:'astro'},
    thaiTaksa:{archiveKey:'thaiTaksa',group:'finish'},
    thaiTaksaRange:{archiveKey:'thaiTaksaRange',group:'finish'},
    horary:{archiveKey:'horary',group:'astro'},
    timing:{archiveKey:'timing',group:'timing',draft:false},
    messageOracle:{archiveKey:'messageOracle',group:'message'}
  });
  const adapters = new Map();
  const live = new Map();
  const enqueue = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn);
  const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function clone(value, maxBytes = MAX_ATTACHMENT_BYTES) {
    try {
      const json = JSON.stringify(value);
      if (!json || json.length > maxBytes) return null;
      return JSON.parse(json);
    } catch { return null; }
  }

  function getState() {
    try { return W.state || state || null; } catch { return W.state || null; }
  }

  function positionKey(position) {
    if (position == null) return '';
    if (typeof position === 'string' || typeof position === 'number') return norm(position);
    return norm(position.id || position.code || position.position || position.title || position.name || position.label || position.question || '');
  }

  function cardKey(card, fallbackPosition = '') {
    if (!card) return '';
    const identity = norm(card.code || card.id || card.name || card.title || '');
    const direction = card.isReversed ? 'R' : 'U';
    const position = positionKey(card.position || fallbackPosition);
    const subs = Array.isArray(card.subCards)
      ? card.subCards.map(sub => `${norm(sub?.code || sub?.id || sub?.name || '')}:${sub?.isReversed ? 'R' : 'U'}`).join(',')
      : '';
    return [position, identity, direction, subs].join('~');
  }

  function readingSignature(value) {
    const drawn = Array.isArray(value?.drawn) ? value.drawn : [];
    const cards = Array.isArray(value?.cards) ? value.cards : drawn;
    if (!cards.length) return '';
    const positions = Array.isArray(value?.positions) ? value.positions : [];
    const canonical = {
      category:norm(value?.category || 'GENERAL'),
      title:norm(value?.title),
      question:norm(value?.question ?? value?.q),
      positions:positions.map(positionKey),
      cards:cards.map((card, index) => cardKey(card, positions[index]))
    };
    return `r1:${JSON.stringify(canonical)}`;
  }

  function currentReading() {
    const state = getState();
    if (!state || !Array.isArray(state.drawn) || !state.drawn.length) return null;
    return state;
  }

  function sameReading(a, b) {
    const left = readingSignature(a);
    return !!left && left === readingSignature(b);
  }

  function readDraftRaw() {
    try {
      const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch { return null; }
  }

  function readArchive() {
    try {
      if (typeof W.getArchive === 'function') {
        const rows = W.getArchive();
        return Array.isArray(rows) ? rows : [];
      }
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function writeArchive(rows) {
    try {
      if (typeof W.setArchive === 'function') W.setArchive(rows);
      else localStorage.setItem(ARCHIVE_KEY, JSON.stringify(rows.slice(0, 100)));
      return true;
    } catch (error) {
      console.warn('[LUNEA Attachments] archive write failed', error);
      return false;
    }
  }

  function definition(name, adapter = {}) {
    const defaults = DEFAULTS[name] || {};
    return {
      name,
      archiveKey:adapter.archiveKey || defaults.archiveKey || name,
      group:adapter.group || defaults.group || '',
      draft:adapter.draft !== false && defaults.draft !== false,
      capture:adapter.capture,
      restore:adapter.restore,
      toArchive:adapter.toArchive,
      clear:adapter.clear
    };
  }

  function register(name, adapter) {
    const key = String(name || '').trim();
    if (!/^[a-z][A-Za-z0-9]{0,39}$/.test(key) || !adapter || typeof adapter.capture !== 'function') return false;
    const registered = definition(key, adapter);
    adapters.set(key, registered);
    const context = currentReading();
    const signature = readingSignature(context);
    if (signature) {
      try {
        const data = clone(registered.capture());
        if (data) live.set(key, {readingSignature:signature, savedAt:Date.now(), data});
      } catch {}
    }
    return true;
  }

  function notifyChanged(name) {
    const adapter = adapters.get(name);
    const context = currentReading();
    const signature = readingSignature(context);
    if (!adapter || !signature) return false;
    let data = null;
    try { data = clone(adapter.capture()); } catch (error) { console.warn('[LUNEA Attachments] capture failed', name, error); }
    if (!data) return false;
    live.set(name, {readingSignature:signature, savedAt:Date.now(), data});
    enqueue(() => {
      try { W.LUNEA_READING_DRAFT_V1?.snapshot?.(); } catch {}
    });
    return true;
  }

  function existingAttachmentContainer(signature) {
    const draft = readDraftRaw();
    const container = draft?.attachments;
    if (!draft || !sameReading(draft, currentReading())) return null;
    if (!container || container.version !== VERSION || container.readingSignature !== signature) return null;
    return container;
  }

  function captureDraft(context = currentReading()) {
    const signature = readingSignature(context);
    if (!signature) return null;
    const container = {version:VERSION, readingSignature:signature};
    let count = 0;
    const old = existingAttachmentContainer(signature);
    for (const [name, adapter] of adapters) {
      if (!adapter.draft) continue;
      const entry = live.get(name);
      if (entry?.readingSignature === signature) {
        const data = clone(entry.data);
        if (!data) continue;
        container[name] = {version:VERSION, readingSignature:signature, savedAt:entry.savedAt, data};
        count += 1;
      } else if (old?.[name]?.readingSignature === signature) {
        const preserved = clone(old[name]);
        if (!preserved) continue;
        container[name] = preserved;
        count += 1;
      }
    }
    if (!count) return null;
    return clone(container, MAX_DRAFT_ATTACHMENT_BYTES);
  }

  function captureArchive(context = currentReading()) {
    const signature = readingSignature(context);
    if (!signature) return {};
    const fields = {};
    for (const [name, adapter] of adapters) {
      const entry = live.get(name);
      if (!entry || entry.readingSignature !== signature) continue;
      let value = entry.archiveValue;
      if (value == null) {
        try { value = typeof adapter.toArchive === 'function' ? adapter.toArchive(clone(entry.data)) : entry.data; }
        catch { value = null; }
      }
      const bounded = clone(value);
      if (bounded != null) fields[adapter.archiveKey] = bounded;
    }
    return fields;
  }

  function clearInlineBlocks() {
    for (const id of INLINE_IDS) document.getElementById(id)?.remove?.();
  }

  function prepareRestore() {
    live.clear();
    for (const adapter of adapters.values()) {
      try { adapter.clear?.(); } catch {}
    }
    clearInlineBlocks();
  }

  function clearForNewReading() {
    live.clear();
    for (const adapter of adapters.values()) {
      try { adapter.clear?.(); } catch {}
    }
    clearInlineBlocks();
  }

  function legacyTimingArchive(snapshot) {
    if (!snapshot?.imgSrc) return null;
    const match = String(snapshot.imgSrc).match(/timing_(\d{3})/i);
    return {
      deck:'LUNEA_TIMING_ORACLE_V1',
      primary:{
        id:match ? `LT-${match[1]}` : '',
        label_ko:norm(snapshot.label || '시기 오라클'),
        label_en:'',
        meaning:norm(snapshot.meaning),
        filename:String(snapshot.imgSrc || '')
      },
      refine:null
    };
  }

  async function loadRestoreGroups(container) {
    const groups = new Set();
    for (const name of Object.keys(container || {})) {
      if (!container?.[name] || name === 'version' || name === 'readingSignature') continue;
      const group = adapters.get(name)?.group || DEFAULTS[name]?.group || '';
      if (group) groups.add(group);
    }
    if (typeof W.LUNEA_LOAD_FEATURE_GROUP !== 'function') return;
    await Promise.all([...groups].map(group => W.LUNEA_LOAD_FEATURE_GROUP(group)));
  }

  async function restoreDraft(draft) {
    const context = currentReading();
    const signature = readingSignature(context);
    if (!draft || !signature || !sameReading(draft, context)) return false;
    const container = draft.attachments;
    if (draft.timingSupport && !W.LUNEA_DRAFT_TIMING_V50 && typeof W.LUNEA_LOAD_FEATURE_GROUP === 'function') {
      await W.LUNEA_LOAD_FEATURE_GROUP('timing');
    }
    if (container && container.version === VERSION && container.readingSignature === signature) {
      await loadRestoreGroups(container);
      for (const [name, adapter] of adapters) {
        const entry = container[name];
        if (!entry || entry.version !== VERSION || entry.readingSignature !== signature) continue;
        const data = clone(entry.data);
        if (!data) continue;
        let restored = false;
        try { restored = adapter.restore ? await adapter.restore(data) !== false : true; }
        catch (error) { console.warn('[LUNEA Attachments] restore failed', name, error); }
        if (restored) live.set(name, {readingSignature:signature, savedAt:Number(entry.savedAt || Date.now()), data});
      }
    }
    if (draft.timingSupport && !live.has('timing')) {
      const archiveValue = legacyTimingArchive(draft.timingSupport);
      if (archiveValue) live.set('timing', {
        readingSignature:signature,
        savedAt:Number(draft.timingSupport.savedAt || draft.savedAt || Date.now()),
        data:{legacyTimingSupport:true},
        archiveValue
      });
    }
    if (draft.timingSupport) {
      try { W.LUNEA_DRAFT_TIMING_V50?.restore?.(draft); } catch (error) {
        console.warn('[LUNEA Attachments] legacy Timing restore failed', error);
      }
    }
    W.dispatchEvent?.(new CustomEvent('lunea:reading-attachments-restored', {detail:{readingSignature:signature}}));
    return true;
  }

  function archiveCardKey(card) {
    const subs = Array.isArray(card?.subCards)
      ? card.subCards.map(sub => `${norm(sub?.name || sub?.code || '')}:${sub?.isReversed ? 'R' : 'U'}`).join(',')
      : '';
    return [positionKey(card?.position), norm(card?.name || card?.code || ''), card?.isReversed ? 'R' : 'U', subs].join('~');
  }

  function archiveMatchesReading(row, context) {
    if (!row || !context) return false;
    if (norm(row.title) !== norm(context.title) || norm(row.q) !== norm(context.question)) return false;
    const saved = Array.isArray(row.cards) ? row.cards.map(archiveCardKey) : [];
    const current = Array.isArray(context.drawn) ? context.drawn.map(archiveCardKey) : [];
    return saved.length === current.length && saved.every((value, index) => value === current[index]);
  }

  function enrichNewArchive(beforeIds, context, fields = captureArchive(context)) {
    const rows = readArchive();
    const before = beforeIds instanceof Set ? beforeIds : new Set(beforeIds || []);
    const candidates = rows.filter(row => !before.has(String(row?.id || '')));
    const target = candidates.find(row => archiveMatchesReading(row, context));
    if (!target) return false;
    for (const key of KNOWN_ARCHIVE_KEYS) delete target[key];
    Object.assign(target, clone(fields, MAX_DRAFT_ATTACHMENT_BYTES) || {});
    target.category = norm(context.category || 'GENERAL');
    target.readingSignature = readingSignature(context);
    target.attachmentSchema = 'LUNEA_READING_ATTACHMENTS_V1';
    if (!writeArchive(rows)) return false;
    W.dispatchEvent?.(new CustomEvent('lunea:reading-archive-enriched', {detail:{id:String(target.id || '')}}));
    return true;
  }

  function installArchiveEnrichment() {
    document.addEventListener('click', event => {
      if (!event.target?.closest?.('#saveReading')) return;
      const context = clone(currentReading(), 100000);
      if (!context || !readingSignature(context)) return;
      const beforeIds = new Set(readArchive().map(row => String(row?.id || '')));
      const fields = captureArchive(context);
      enqueue(() => enrichNewArchive(beforeIds, context, fields));
    }, true);
  }

  function installStartBoundary() {
    let current = null;
    try { current = W.startSpread || startSpread; } catch { current = W.startSpread; }
    if (typeof current !== 'function' || current.__luneaReadingAttachmentsV1) return false;
    const wrapped = function() {
      clearForNewReading();
      return current.apply(this, arguments);
    };
    wrapped.__luneaReadingAttachmentsV1 = true;
    W.startSpread = wrapped;
    try { startSpread = wrapped; } catch {}
    return true;
  }

  function consumePendingAdapters() {
    const pending = Array.isArray(W.__LUNEA_READING_ATTACHMENT_QUEUE_V1)
      ? W.__LUNEA_READING_ATTACHMENT_QUEUE_V1.splice(0)
      : [];
    for (const item of pending) register(item?.name, item?.adapter);
  }

  const api = Object.freeze({
    version:VERSION,
    register,
    notifyChanged,
    signature:readingSignature,
    sameReading,
    captureDraft,
    captureArchive,
    prepareRestore,
    restoreDraft,
    clearForNewReading,
    enrichNewArchive,
    archiveMatchesReading,
    registered:() => [...adapters.keys()]
  });
  W.LUNEA_READING_ATTACHMENTS_V1 = api;
  consumePendingAdapters();
  installArchiveEnrichment();
  if (document.documentElement?.dataset?.luneaHomeRuntimeReady === '1') installStartBoundary();
  else W.addEventListener?.('lunea:home-runtime-ready', installStartBoundary, {once:true});
  W.addEventListener?.('pagehide', () => { try { W.LUNEA_READING_DRAFT_V1?.snapshot?.(); } catch {} }, {passive:true});
  W.addEventListener?.('beforeunload', () => { try { W.LUNEA_READING_DRAFT_V1?.snapshot?.(); } catch {} });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { try { W.LUNEA_READING_DRAFT_V1?.snapshot?.(); } catch {} }
  });
  console.info('🧩 LUNEA Reading Attachments V1 loaded');
})();
