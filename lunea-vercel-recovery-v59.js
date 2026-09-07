'use strict';

/* LUNEA Vercel Recovery V59
   Host-only bridge: keep the recovered cabinet intact while restoring the
   current verification journal, uploaded sector card backs, and saved/copyable
   Timing + astrology support results. No service worker, no cache/storage wipe. */
(() => {
  const W = window;
  if (W.__LUNEA_VERCEL_RECOVERY_V59__) return;
  W.__LUNEA_VERCEL_RECOVERY_V59__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const DB_NAME = 'LUNEA_READING_DB';
  const STORE = 'journal';
  const MAIN_PIN = 'd5266c54d0519cf47758f6c871d99ce919e7f58a';
  const clean = v => String(v || '').replace(/\s+/g, ' ').trim();
  const block = v => String(v || '').replace(/\r/g,'').replace(/\n{3,}/g,'\n\n').trim();
  const $ = id => document.getElementById(id);

  function loadScript(src, key) {
    if (key && W[key]) return Promise.resolve();
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      (document.head || document.documentElement).appendChild(s);
    });
  }

  async function ensureSectorBacks() {
    if (W.__LUNEA_SECTOR_CARD_BACKS_V20__) return;
    await loadScript(
      `https://cdn.jsdelivr.net/gh/cozysso-afk/lunea@${MAIN_PIN}/lunea-cardback-sector-v20.js?v=20260907-v59`,
      '__LUNEA_SECTOR_CARD_BACKS_V20__'
    );
    try { W.LUNEA_SECTOR_CARD_BACKS_V20?.repairAll?.(); } catch {}
  }

  async function ensureJournal() {
    if (W.LUNEA_READING_JOURNAL?.open) return true;
    await loadScript(
      `https://cdn.jsdelivr.net/gh/cozysso-afk/lunea@${MAIN_PIN}/lunea-reading-journal-v2.js?v=20260907-v59`,
      '__LUNEA_JOURNAL_V2__'
    );
    return !!W.LUNEA_READING_JOURNAL?.open;
  }

  function currentQuestion() {
    return clean($('spreadQuestion')?.textContent || $('timingQuestion')?.value || W.state?.question || '');
  }

  function sameQuestion(text, q) {
    if (!text || !q) return true;
    const t = clean(text).toLowerCase();
    const key = clean(q).toLowerCase();
    return !/\[질문\]/.test(text) || t.includes(key);
  }

  function buildAuxSnapshot() {
    const q = currentQuestion();
    let timing = '';
    const astrology = [];
    try {
      const api = W.LUNEA_TIMING_COPY_V35;
      timing = block(api?.buildCopyText?.() || '');
      const builders = [
        api?.buildTransitText,
        api?.buildReturnText,
        api?.buildThaiStandaloneRangeText,
        api?.buildThaiTarotRangeText
      ];
      for (const fn of builders) {
        if (typeof fn !== 'function') continue;
        const text = block(fn.call(api) || '');
        if (text && sameQuestion(text, q)) astrology.push(text);
      }
    } catch {}

    const known = [
      ['HORARY', 'astroHoraryResult'],
      ['HORARY', 'luneaHoraryResult'],
      ['THAI MAHA TAKSA', 'luneaThaiStandaloneResult']
    ];
    for (const [label, id] of known) {
      const el = $(id);
      const text = block(el?.innerText || el?.textContent || '');
      if (text && !astrology.some(x => x.includes(text))) astrology.push(`[LUNEA · ${label} 결과]\n${text}`);
    }

    return {
      capturedAt: Date.now(),
      question: q,
      timing: timing && sameQuestion(timing, q) ? timing : '',
      astrology: [...new Set(astrology)].filter(Boolean)
    };
  }

  function readArchive() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function writeArchive(rows) {
    try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify((rows || []).slice(0, 100))); } catch {}
  }

  function openJournalDB() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function getJournalRows() {
    try {
      const db = await openJournalDB();
      return await new Promise(resolve => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch { return []; }
  }

  async function persistAux(aux) {
    if (!aux?.timing && !aux?.astrology?.length) return;
    const archive = readArchive();
    const reading = archive[0];
    if (!reading) return;
    reading.luneaAux = aux;
    archive[0] = reading;
    writeArchive(archive);

    try {
      const db = await openJournalDB();
      const rows = await new Promise(resolve => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
      const rid = String(reading.id || '');
      const q = clean(reading.q).toLowerCase();
      const title = clean(reading.title).toLowerCase();
      const row = rows.find(x => rid && String(x?.sourceArchiveId || '') === rid) ||
        rows.sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0)).find(x => {
          const r = x?.reading || {};
          return (!q || clean(r.q).toLowerCase() === q) && (!title || clean(r.title).toLowerCase() === title);
        });
      if (!row) return;
      row.reading = row.reading || {};
      row.reading.luneaAux = aux;
      row.updatedAt = Date.now();
      await new Promise(resolve => {
        const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(row);
        req.onsuccess = req.onerror = () => resolve();
      });
    } catch {}
  }

  function auxText(aux) {
    if (!aux) return '';
    const out = [];
    if (aux.timing) out.push(`[시기 오라클]\n${aux.timing}`);
    if (Array.isArray(aux.astrology) && aux.astrology.length) out.push(`[점성술 보조 결과]\n${aux.astrology.join('\n\n')}`);
    return out.join('\n\n');
  }

  async function enrichJournalClipboard(text) {
    const raw = String(text || '');
    if (!raw || /\[시기 오라클\]|\[점성술 보조 결과\]/.test(raw)) return raw;
    if (!/\[검증\]/.test(raw) && !/────────────/.test(raw)) return raw;
    const rows = await getJournalRows();
    if (!rows.length) return raw;
    const chunks = raw.split(/\n\n────────────\n\n/);
    const enriched = chunks.map(chunk => {
      const row = rows.find(x => {
        const r = x?.reading || {};
        const q = clean(r.q);
        const title = clean(r.title);
        return (q && chunk.includes(q)) || (title && chunk.includes(title));
      });
      const extra = auxText(row?.reading?.luneaAux);
      return extra ? `${chunk}\n\n${extra}` : chunk;
    });
    return enriched.join('\n\n────────────\n\n');
  }

  function wrapClipboard() {
    const clip = navigator.clipboard;
    if (!clip?.writeText || clip.writeText.__luneaV59Wrapped) return;
    const original = clip.writeText.bind(clip);
    const wrapped = async text => original(await enrichJournalClipboard(text));
    wrapped.__luneaV59Wrapped = true;
    try { clip.writeText = wrapped; } catch {}
  }

  function bindSaveCapture() {
    document.addEventListener('click', event => {
      if (!event.target?.closest?.('#saveReading')) return;
      const aux = buildAuxSnapshot();
      setTimeout(() => persistAux(aux), 180);
      setTimeout(() => persistAux(aux), 520);
    }, true);
  }

  function bindJournalOpenGuard() {
    document.addEventListener('click', event => {
      if (!event.target?.closest?.('#archiveBtn')) return;
      setTimeout(async () => {
        if (await ensureJournal()) {
          try { await W.LUNEA_READING_JOURNAL.open(); } catch {}
        }
      }, 0);
    }, true);
  }

  function markFinalReady() {
    const root = document.documentElement;
    root.dataset.luneaFinalReady = '59';
    root.classList.add('lunea-final-ready-v59');
  }

  async function boot() {
    bindSaveCapture();
    bindJournalOpenGuard();
    wrapClipboard();
    await Promise.all([ensureJournal(), ensureSectorBacks()]);
    wrapClipboard();
    setTimeout(() => { wrapClipboard(); try { W.LUNEA_SECTOR_CARD_BACKS_V20?.repairAll?.(); } catch {} }, 300);
    markFinalReady();
  }

  W.LUNEA_VERCEL_RECOVERY_V59 = Object.freeze({version:'59.0', buildAuxSnapshot, persistAux, enrichJournalClipboard});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
