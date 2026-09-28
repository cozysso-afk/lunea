'use strict';

/* LUNEA JOURNAL DETAIL + TOOLBAR V51
   - "카드/해석" becomes a complete saved-reading detail view.
   - Shows attached Transit / Returns / Thai / Horary / Timing evidence when present.
   - Normalizes duplicated legacy recovery controls on iPhone.
   - Keeps one category/status filter set; advanced search retains date range only.
*/
(() => {
  const W = window;
  if (W.__LUNEA_JOURNAL_DETAIL_V51__) return;
  W.__LUNEA_JOURNAL_DETAIL_V51__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const STATUS = {
    pending: '○ 미확인', hit: '✓ 맞음', partial: '△ 부분',
    miss: '× 틀림', unverifiable: '? 판정불가'
  };
  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function readArchive() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function itemTitle(item) {
    const title = item?.querySelector('.archive-title');
    if (!title) return '';
    const clone = title.cloneNode(true);
    clone.querySelectorAll('.lj-badge').forEach(n => n.remove());
    return norm(clone.textContent || '');
  }

  function itemQuestion(item) {
    return norm(item?.querySelector('.archive-q')?.textContent || '');
  }

  function evidenceScore(row) {
    if (!row || typeof row !== 'object') return 0;
    const keys = ['astroNatal','astroTransit','astroReturns','thaiTaksa','thaiTaksaRange','thaiRange','horary','timing','messageOracle','legacyImportedText'];
    return keys.reduce((n, key) => n + (row[key] != null && row[key] !== '' ? 1 : 0), 0)
      + (row.ai ? 1 : 0)
      + (Array.isArray(row.cards) ? Math.min(2, row.cards.length) : 0);
  }

  function bestArchiveFor(rows, title, q, sourceArchiveId = '') {
    const source = String(sourceArchiveId || '');
    if (source) {
      const byId = rows.find(r => String(r?.id || '') === source);
      if (byId) return byId;
    }
    const exact = rows.filter(r => norm(r?.title) === title && norm(r?.q) === q);
    if (exact.length) return exact.sort((a,b) => evidenceScore(b) - evidenceScore(a))[0];
    const qMatches = q ? rows.filter(r => norm(r?.q) === q) : [];
    if (qMatches.length) return qMatches.sort((a,b) => evidenceScore(b) - evidenceScore(a))[0];
    const titleMatches = title ? rows.filter(r => norm(r?.title) === title) : [];
    if (titleMatches.length) return titleMatches.sort((a,b) => evidenceScore(b) - evidenceScore(a))[0];
    return null;
  }

  function bestArchiveMatch(item) {
    const rows = readArchive().slice().sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    return bestArchiveFor(rows, itemTitle(item), itemQuestion(item), item?.dataset?.sourceArchiveId || item?.dataset?.archiveId || '');
  }

  async function journalEntryMatch(item) {
    try {
      const rows = await W.LUNEA_READING_JOURNAL?.getAll?.();
      if (!Array.isArray(rows)) return null;
      const title = itemTitle(item), q = itemQuestion(item);
      const sourceArchiveId = String(item?.dataset?.sourceArchiveId || item?.dataset?.archiveId || '');
      const bySource = sourceArchiveId && rows.find(x => String(x?.sourceArchiveId || '') === sourceArchiveId);
      if (bySource?.reading) return bySource;
      const exact = rows.find(x => norm(x?.reading?.title) === title && norm(x?.reading?.q) === q);
      if (exact?.reading) return exact;
      const byQ = q && rows.find(x => norm(x?.reading?.q) === q);
      if (byQ?.reading) return byQ;
      const byTitle = title && rows.find(x => norm(x?.reading?.title) === title);
      return byTitle?.reading ? byTitle : null;
    } catch { return null; }
  }

  function jsonText(v) {
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v, null, 2); }
    catch { return String(v ?? ''); }
  }

  function fallbackRichText(reading) {
    if (!reading) return '저장된 상세 정보를 찾지 못했어.';
    const cards = (reading.cards || []).map(card =>
      card?.text || `${card?.position || ''}: ${card?.name || ''} (${card?.isReversed ? '역' : '정'})` +
      (card?.subCards?.length ? ` / 보조 ${card.subCards.map(x => x?.name || '').join(', ')}` : '')
    ).filter(Boolean).join('\n');
    const parts = [
      reading.date || (reading.createdAt ? new Date(reading.createdAt).toLocaleString('ko-KR') : ''),
      reading.title || '',
      reading.q ? `질문: ${reading.q}` : '',
      cards,
      reading.ai ? `[AI 해석]\n${reading.ai}` : ''
    ].filter(Boolean);
    const sections = [
      ['Natal / Astrology · 점성술', reading.astroNatal],
      ['Transit · 트랜짓', reading.astroTransit],
      ['Returns · 리턴', reading.astroReturns],
      ['Thai Astrology · 태국점성술', reading.thaiTaksa],
      ['Thai Period · 태국 기간', reading.thaiTaksaRange || reading.thaiRange],
      ['Horary · 호라리', reading.horary],
      ['Timing Oracle · 시기 오라클', reading.timing],
      ['Message Oracle · 연락/소식', messageText(reading.messageOracle)],
      ['기존 주소에서 가져온 기록', reading.legacyImportedText]
    ];
    for (const [label, value] of sections) {
      if (value == null || value === '') continue;
      if (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length) continue;
      parts.push(`[${label}]\n${jsonText(value)}`);
    }
    return parts.join('\n\n').trim();
  }

  function richText(reading) {
    try {
      const fn = W.LUNEA_EMERGENCY_REPAIR_V43?.archiveText;
      const text = fn?.(reading);
      if (text) return String(text) + (reading?.messageOracle ? '\n\n[Message Oracle · 연락/소식]\n' + messageText(reading.messageOracle) : '');
    } catch {}
    return fallbackRichText(reading);
  }

  function messageText(value) {
    if (!value) return '';
    return ['질문: ' + String(value.question || ''),
      '맥락: ' + String(value.contextLabel || value.context || ''),
      '카드: ' + String(value.cardName || value.cardCode || ''),
      '연락·소식 신호: ' + Number(value.score || 0) + '% · 결과 성공 확률 아님',
      value.fullMessage || value.shortMessage || ''].join('\n');
  }

  async function resolveRichRecord(item) {
    const local = bestArchiveMatch(item);
    const entry = await journalEntryMatch(item);
    const journal = entry?.reading || null;
    if (!local) return {reading:journal, entry};
    if (!journal) return {reading:local, entry:null};
    const reading = evidenceScore(local) >= evidenceScore(journal)
      ? {...journal, ...local}
      : {...local, ...journal};
    return {reading, entry};
  }

  async function resolveRichReading(item) {
    return (await resolveRichRecord(item)).reading;
  }

  function validationText(entry) {
    if (!entry) return '';
    const lines = [`판정: ${STATUS[entry.status] || entry.status || STATUS.pending}`];
    if (entry.resultDate) lines.push(`실제 결과 날짜: ${entry.resultDate}`);
    if (entry.dueDate) lines.push(`확인 예정일: ${entry.dueDate}`);
    if (entry.outcome) lines.push(`실제 결과: ${entry.outcome}`);
    if (entry.note) lines.push(`메모: ${entry.note}`);
    if (entry.tags?.length) lines.push(`태그: ${entry.tags.join(', ')}`);
    return `[검증]\n${lines.join('\n')}`;
  }

  function richCopyText(reading, entry) {
    return [richText(reading), validationText(entry)].filter(Boolean).join('\n\n');
  }

  async function copyText(text, success) {
    if (!text) { alert('복사할 기록이 없어.'); return false; }
    try {
      await navigator.clipboard.writeText(text);
      alert(success);
      return true;
    } catch { alert('복사 권한을 확인해줘.'); return false; }
  }

  async function copyRichItem(item, btn) {
    const {reading, entry} = await resolveRichRecord(item);
    const copied = await copyText(richCopyText(reading, entry), '복사했어.');
    if (copied && btn) {
      btn.textContent = '✓ 복사됨';
      setTimeout(() => { if (btn.isConnected) btn.textContent = '복사'; }, 800);
    }
  }

  async function allRichCopyText() {
    const locals = readArchive().slice().sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    let entries = [];
    try {
      const rows = await W.LUNEA_READING_JOURNAL?.getAll?.();
      if (Array.isArray(rows)) entries = rows;
    } catch {}
    if (!entries.length) {
      return locals.map(reading => richText(reading)).filter(Boolean).join('\n\n────────────\n\n');
    }
    const used = new Set();
    const records = entries.map(entry => {
      const journal = entry?.reading || null;
      const local = bestArchiveFor(
        locals,
        norm(journal?.title),
        norm(journal?.q),
        entry?.sourceArchiveId
      );
      if (local) used.add(local);
      const reading = !local ? journal : evidenceScore(local) >= evidenceScore(journal)
        ? {...journal, ...local}
        : {...local, ...journal};
      return richCopyText(reading, entry);
    });
    locals.filter(reading => !used.has(reading)).forEach(reading => records.push(richText(reading)));
    return records.filter(Boolean).join('\n\n────────────\n\n');
  }

  function isDetailButton(btn) {
    if (!btn?.closest?.('#archiveOverlay .archive-item .archive-actions')) return false;
    const actions = btn.parentElement;
    const buttons = [...actions.querySelectorAll(':scope > button')];
    return /카드\s*[/·]?\s*해석|리딩\s*상세/.test(norm(btn.textContent)) ||
      (buttons.length >= 4 && buttons.indexOf(btn) === 1);
  }

  async function openRichDetail(item, btn) {
    const detail = item?.querySelector('.archive-detail');
    if (!detail) return;
    if (detail.classList.contains('open')) {
      detail.classList.remove('open');
      return;
    }
    detail.classList.add('open');
    detail.textContent = '저장된 리딩 전체 내용을 불러오는 중…';
    const reading = await resolveRichReading(item);
    detail.textContent = richText(reading);
    detail.dataset.luneaRichDetailV51 = '1';
    if (btn) btn.textContent = '리딩 상세';
  }

  function addStyles() {
    if ($('luneaJournalDetailV51Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaJournalDetailV51Style';
    s.textContent = `
      #archiveOverlay .archive-detail{
        white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important;
        line-height:1.64!important;font-size:10.5px!important;color:#d7d5df!important;
        max-height:46dvh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch
      }
      #archiveOverlay{pointer-events:none}
      #archiveOverlay.show{pointer-events:auto!important}
      #archiveOverlay [data-close="archive"]{pointer-events:auto!important;z-index:80!important;touch-action:manipulation!important}
      #archiveOverlay .lunea-v51-recovery-row{
        display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:7px!important;margin:8px 0 10px!important;width:100%!important
      }
      #archiveOverlay .lunea-v51-recovery-row button{
        min-width:0!important;width:100%!important;min-height:37px!important;padding:7px 8px!important;
        white-space:normal!important;line-height:1.25!important;font-size:9.6px!important;border-radius:12px!important
      }
      #archiveOverlay #luneaV43LegacyImport{color:#e1fdf8!important;border-color:rgba(99,231,214,.25)!important;background:rgba(60,203,187,.07)!important}
      #archiveOverlay #luneaV43BackupRestore{color:#eee3ff!important;border-color:rgba(190,165,237,.25)!important;background:rgba(159,126,218,.06)!important}
      #archiveOverlay .archive-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:7px!important;align-items:center!important}
      #archiveOverlay .archive-toolbar>#copyAllArchive{width:auto!important;min-width:76px!important;white-space:nowrap!important}
      #archiveOverlay #archiveSearchAdvanced #archiveCategoryFilter,
      #archiveOverlay #archiveSearchAdvanced #archiveStatusFilter{display:none!important}
      @media(max-width:390px){
        #archiveOverlay .lunea-v51-recovery-row{grid-template-columns:1fr 1fr!important}
        #archiveOverlay .lunea-v51-recovery-row button{font-size:9px!important;padding:7px 5px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function recoveryApi(name) {
    return () => {
      const api = W.LUNEA_EMERGENCY_REPAIR_V43;
      if (typeof api?.[name] === 'function') return api[name]();
      alert('기록 복구 기능을 아직 불러오는 중이야. 잠시 후 다시 눌러줘.');
    };
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

  function normalizeToolbar() {
    const overlay = $('archiveOverlay');
    const toolbar = overlay?.querySelector('.archive-toolbar');
    if (!overlay || !toolbar) return false;

    // Remove every legacy recovery control first, including accidentally duplicated IDs/text.
    [...overlay.querySelectorAll('button')].forEach(btn => {
      const text = norm(btn.textContent);
      if (btn.id === 'luneaV43LegacyImport' || btn.id === 'luneaV43BackupRestore' ||
          /기존 기록.*붙여넣|이전 기록.*가져오기|안전 백업.*복구/.test(text)) {
        btn.remove();
      }
    });

    // The primary toolbar is intentionally only search + whole-record copy.
    [...toolbar.querySelectorAll(':scope > button')].forEach(btn => {
      if (btn.id !== 'copyAllArchive') btn.remove();
    });
    const copy = $('copyAllArchive');
    if (copy) copy.textContent = '전체 복사';

    let row = overlay.querySelector('.lunea-v51-recovery-row');
    const recovery = W.LUNEA_EMERGENCY_REPAIR_V43;
    if (typeof recovery?.importLegacyClipboard !== 'function' || typeof recovery?.restoreSafetyBackup !== 'function') {
      row?.remove();
      return true;
    }
    if (!row) {
      row = document.createElement('div');
      row.className = 'lunea-v51-recovery-row';
      toolbar.insertAdjacentElement('afterend', row);
    } else {
      row.replaceChildren();
    }

    const legacy = document.createElement('button');
    legacy.type = 'button'; legacy.className = 'mini'; legacy.id = 'luneaV43LegacyImport';
    legacy.textContent = '이전 기록 가져오기';
    legacy.onclick = recoveryApi('importLegacyClipboard');

    const backup = document.createElement('button');
    backup.type = 'button'; backup.className = 'mini'; backup.id = 'luneaV43BackupRestore';
    backup.textContent = '안전 백업 복구';
    backup.onclick = recoveryApi('restoreSafetyBackup');
    row.append(legacy, backup);
    return true;
  }

  function normalizeRows() {
    document.querySelectorAll('#archiveOverlay .archive-item').forEach(item => {
      const actions = item.querySelector('.archive-actions');
      if (!actions) return;
      const buttons = [...actions.querySelectorAll(':scope > button')];
      const detail = buttons.find(btn => /카드\s*[/·]?\s*해석|리딩\s*상세/.test(norm(btn.textContent))) ||
        (buttons.length >= 4 ? buttons[1] : null);
      if (detail && detail.textContent !== '리딩 상세') detail.textContent = '리딩 상세';
    });
  }

  let queued = false;
  function normalizeSoon() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      addStyles();
      syncArchivePointerState();
      normalizeToolbar();
      normalizeRows();
    });
  }

  function install() {
    const overlay = $('archiveOverlay');
    if (!overlay) return false;
    addStyles();
    syncArchivePointerState();
    normalizeToolbar();
    normalizeRows();

    if (!overlay.__luneaJournalDetailV51Observed) {
      overlay.__luneaJournalDetailV51Observed = true;
      new MutationObserver(normalizeSoon).observe(overlay, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
    }

    overlay.addEventListener('click', event => {
      if (event.target?.closest?.('[data-close="archive"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeArchive();
        return;
      }
      const copyAll = event.target?.closest?.('#copyAllArchive');
      if (copyAll) {
        event.preventDefault();
        event.stopImmediatePropagation();
        allRichCopyText().then(text => copyText(text, '전체 기록 복사 완료'));
        return;
      }
      const btn = event.target?.closest?.('.archive-item .archive-actions button');
      if (btn && (/^복사$/.test(norm(btn.textContent)) || btn.dataset.a === 'copy')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        copyRichItem(btn.closest('.archive-item'), btn);
        return;
      }
      if (!isDetailButton(btn)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openRichDetail(btn.closest('.archive-item'), btn);
    }, true);

    W.addEventListener('pageshow', () => setTimeout(normalizeSoon, 80), {passive:true});
    W.LUNEA_JOURNAL_DETAIL_V51 = Object.freeze({version:'51.0', normalize:normalizeSoon, closeArchive, syncArchivePointerState});
    console.info('📚 LUNEA Journal Detail V51 loaded · full evidence + clean toolbar');
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 100) clearInterval(timer);
    }, 100);
    install();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
