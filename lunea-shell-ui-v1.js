'use strict';

/* LUNEA UI-only shell, extracted from Journal V2/V51 and Recovery UI V65.
   No startup storage migration, fetch, polling, body/root observer.
   LUNEA JOURNAL DETAIL + TOOLBAR V51
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
    const keys = ['astroTransit','astroReturns','thaiTaksa','thaiTaksaRange','thaiRange','horary','timing','legacyImportedText'];
    return keys.reduce((n, key) => n + (row[key] != null && row[key] !== '' ? 1 : 0), 0)
      + (row.ai ? 1 : 0)
      + (Array.isArray(row.cards) ? Math.min(2, row.cards.length) : 0);
  }

  function bestArchiveMatch(item) {
    const title = itemTitle(item);
    const q = itemQuestion(item);
    const rows = readArchive().slice().sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    const exact = rows.filter(r => norm(r?.title) === title && norm(r?.q) === q);
    if (exact.length) return exact.sort((a,b) => evidenceScore(b) - evidenceScore(a))[0];
    const qMatches = q ? rows.filter(r => norm(r?.q) === q) : [];
    if (qMatches.length) return qMatches.sort((a,b) => evidenceScore(b) - evidenceScore(a))[0];
    const titleMatches = title ? rows.filter(r => norm(r?.title) === title) : [];
    if (titleMatches.length) return titleMatches.sort((a,b) => evidenceScore(b) - evidenceScore(a))[0];
    return null;
  }

  async function journalMatch(item) {
    try {
      const rows = await W.LUNEA_READING_JOURNAL?.getAll?.();
      if (!Array.isArray(rows)) return null;
      const title = itemTitle(item), q = itemQuestion(item);
      const exact = rows.find(x => norm(x?.reading?.title) === title && norm(x?.reading?.q) === q);
      if (exact?.reading) return exact.reading;
      const byQ = q && rows.find(x => norm(x?.reading?.q) === q);
      if (byQ?.reading) return byQ.reading;
      const byTitle = title && rows.find(x => norm(x?.reading?.title) === title);
      return byTitle?.reading || null;
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
      ['Transit · 트랜짓', reading.astroTransit],
      ['Returns · 리턴', reading.astroReturns],
      ['Thai Astrology · 태국점성술', reading.thaiTaksa],
      ['Thai Period · 태국 기간', reading.thaiTaksaRange || reading.thaiRange],
      ['Horary · 호라리', reading.horary],
      ['Timing Oracle · 시기 오라클', reading.timing],
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
      if (text) return String(text);
    } catch {}
    return fallbackRichText(reading);
  }

  async function resolveRichReading(item) {
    const local = bestArchiveMatch(item);
    const journal = await journalMatch(item);
    if (!local) return journal;
    if (!journal) return local;
    return evidenceScore(local) >= evidenceScore(journal) ? {...journal, ...local} : {...local, ...journal};
  }

  function isDetailButton(btn) {
    if (!btn?.closest?.('#archiveOverlay .archive-item .archive-actions')) return false;
    const actions = btn.parentElement;
    const buttons = [...actions.querySelectorAll(':scope > button')];
    return /카드\s*[/·]?\s*해석|리딩\s*상세/.test(norm(btn.textContent)) || buttons.indexOf(btn) === 1;
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
      #archiveOverlay #archiveSearchAdvanced{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
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
      if (buttons[1] && buttons[1].textContent !== '리딩 상세') buttons[1].textContent = '리딩 상세';
    });
  }

  let detailObserver;
  function normalizeSoon() {
    // Ignore our own toolbar writes; watch the archive only, never body/root.
    detailObserver?.disconnect();
    addStyles();normalizeToolbar();normalizeRows();
    const overlay=$('archiveOverlay');
    if(overlay) detailObserver?.observe(overlay,{childList:true,subtree:true});
  }

  function install() {
    const overlay=$('archiveOverlay');
    if(!overlay) return;
    detailObserver=new MutationObserver(normalizeSoon);
    normalizeSoon();

    overlay.addEventListener('click', event => {
      const btn = event.target?.closest?.('.archive-item .archive-actions button');
      if (!isDetailButton(btn)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openRichDetail(btn.closest('.archive-item'), btn);
    }, true);

    W.addEventListener('pageshow', normalizeSoon, {passive:true});
    W.LUNEA_JOURNAL_DETAIL_V51 = Object.freeze({version:'51.0', normalize:normalizeSoon});
    console.info('📚 LUNEA Journal Detail V51 loaded · full evidence + clean toolbar');
    return true;
  }

  // Styling only from V2; its IndexedDB boot/migration stays in the journal group.
  function journalShell() {
    const style=document.createElement('style');
    style.id='luneaJournalShellStyle';
    style.textContent=`
      #archiveOverlay{
        --journal-teal:#82eadc;
        --journal-teal2:#54cdbf;
        --journal-rose:#ff9fc6;
        --journal-gold:#ffd98f;
        --journal-ink:#0b1118;
      }
      #archiveOverlay .archive-modal{
        max-width:480px;
        background:
          radial-gradient(circle at 7% -4%,rgba(130,234,220,.18),transparent 34%),
          radial-gradient(circle at 96% 3%,rgba(255,159,198,.13),transparent 30%),
          linear-gradient(165deg,#121824 0%,#111421 43%,#171322 100%);
        border:1px solid rgba(130,234,220,.30);
        box-shadow:0 26px 72px rgba(0,0,0,.72),0 0 34px rgba(84,205,191,.08);
      }
      #archiveOverlay .sub{color:var(--journal-teal);letter-spacing:1.8px}
      #archiveOverlay .modal-h{
        color:#fffafc;
        text-shadow:0 0 18px rgba(130,234,220,.12);
      }
      #archiveOverlay .archive-toolbar input,
      #archiveOverlay .lj-filter select,
      #archiveOverlay .lj-field input,
      #archiveOverlay .lj-field textarea{
        background:rgba(7,13,21,.62);
        border-color:rgba(130,234,220,.18);
      }
      #archiveOverlay .archive-toolbar input:focus,
      #archiveOverlay .lj-filter select:focus,
      #archiveOverlay .lj-field input:focus,
      #archiveOverlay .lj-field textarea:focus{
        border-color:rgba(130,234,220,.62);
        box-shadow:0 0 0 2px rgba(130,234,220,.08);
      }
      .lj-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:9px 0}
      .lj-stat{
        padding:9px 4px;text-align:center;border-radius:12px;
        border:1px solid rgba(130,234,220,.14);
        background:linear-gradient(145deg,rgba(130,234,220,.07),rgba(255,159,198,.035));
      }
      .lj-stat:nth-child(2){border-color:rgba(255,217,143,.18)}
      .lj-stat:nth-child(3){
        border-color:rgba(255,159,198,.22);
        background:linear-gradient(145deg,rgba(255,159,198,.08),rgba(130,234,220,.04));
      }
      .lj-stat b{display:block;font-size:14px;color:#f7ffff}
      .lj-stat:nth-child(3) b{color:var(--journal-rose)}
      .lj-stat span{font-size:8.6px;color:#9eabb7}
      .lj-note{
        margin:-2px 0 8px;padding:7px 9px;border-radius:10px;
        background:rgba(130,234,220,.055);border-left:2px solid rgba(130,234,220,.48);
        color:#9fb8bb;font-size:8.7px;line-height:1.55
      }
      .lj-filter{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:7px}
      .lj-filter select{min-height:39px;padding:7px;font-size:10px}
      .lj-tools{display:flex;gap:5px;margin-bottom:10px}
      .lj-tools button{flex:1}
      #archiveOverlay .archive-item{
        background:
          linear-gradient(145deg,rgba(130,234,220,.045),rgba(255,159,198,.035)),
          rgba(255,255,255,.025);
        border-color:rgba(130,234,220,.13);
      }
      #archiveOverlay .archive-item:hover{border-color:rgba(130,234,220,.28)}
      #archiveOverlay .archive-meta{color:#8bded5}
      #archiveOverlay .archive-title{color:#f8fbff}
      .lj-badge{
        float:right;padding:3px 8px;border-radius:999px;
        border:1px solid rgba(130,234,220,.20);font-size:8.5px;color:#9eabb7;
        background:rgba(8,15,22,.48)
      }
      .lj-badge[data-s=hit]{color:#8ff2d5;border-color:rgba(143,242,213,.35)}
      .lj-badge[data-s=partial]{color:var(--journal-gold);border-color:rgba(255,217,143,.34)}
      .lj-badge[data-s=miss]{color:#ff9bad;border-color:rgba(255,155,173,.35)}
      .lj-badge[data-s=unverifiable]{color:#bfc3cf}
      .lj-review{
        display:none;margin-top:9px;padding:10px;border-radius:12px;
        background:linear-gradient(145deg,rgba(9,20,26,.74),rgba(28,16,29,.70));
        border:1px solid rgba(255,159,198,.15)
      }
      .lj-review.open{display:block}
      .lj-statuses{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
      .lj-statuses button{padding:6px 2px;font-size:8px}
      .lj-statuses .on{
        color:#fff;border-color:rgba(130,234,220,.55);
        background:linear-gradient(135deg,rgba(84,205,191,.24),rgba(255,159,198,.12))
      }
      .lj-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .lj-field{margin-top:7px}
      .lj-field label{display:block;font-size:8.8px;color:#cddcde;margin-bottom:3px}
      .lj-field textarea{height:64px;font-size:11px}
      .lj-field input{min-height:36px;font-size:11px}
      .lj-hidden{display:none!important}
      .lj-save{
        width:100%;margin-top:8px!important;color:#eafffb!important;
        border-color:rgba(130,234,220,.36)!important;
        background:linear-gradient(135deg,rgba(84,205,191,.18),rgba(255,159,198,.09))!important
      }
      @media(max-width:390px){
        .lj-stats{grid-template-columns:1fr 1fr}
        .lj-statuses{grid-template-columns:repeat(3,1fr)}
        .lj-grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
    const modal=$('archiveOverlay')?.querySelector('.archive-modal');
    const sub=modal?.querySelector('.sub');
    const heading=modal?.querySelector('.modal-h');
    if(sub) sub.textContent='LUNEA TAROT DIARY · REVIEW';
    if(heading?.firstChild) heading.firstChild.textContent='✧ 타로 기록 · 검증 일지 ';
  }

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
    [...bar.children]
      .sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 999) - (rank.has(b.id) ? rank.get(b.id) : 999))
      .forEach((node,index) => { if(bar.children[index]!==node) bar.insertBefore(node,bar.children[index]||null); });
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

  function addRecoveryStyle() {
    if ($('luneaRecoveryUiV65Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaRecoveryUiV65Style';
    style.textContent = `

      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{
        position:relative!important;overflow:hidden!important;
        border-color:rgba(235,132,169,.40)!important;
        background:
          radial-gradient(circle at 10% 17%,rgba(232,92,145,.23),transparent 31%),
          radial-gradient(circle at 91% 4%,rgba(158,54,112,.18),transparent 36%),
          linear-gradient(145deg,rgba(91,19,50,.96),rgba(54,13,40,.97) 48%,rgba(25,10,29,.99))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 12px 30px rgba(70,8,39,.24)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]::before{
        content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;
        pointer-events:none!important;
        background:linear-gradient(105deg,rgba(255,192,214,.055),transparent 34%,rgba(138,53,108,.045))!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{
        background:#310b20!important;border-color:rgba(250,176,202,.38)!important;overflow:hidden!important;
        box-shadow:0 7px 20px rgba(80,9,45,.30),inset 0 1px 0 rgba(255,255,255,.10)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;
        transform:scale(1.20)!important;transform-origin:center!important;
        border-radius:inherit!important;pointer-events:none!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-label{color:#fff4f7!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-sub{color:rgba(229,199,210,.76)!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-open{color:#efb3c9!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v39-adult-badge{
        border-color:rgba(243,139,178,.46)!important;background:rgba(130,28,70,.27)!important;color:#f5b0c9!important
      }


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



  journalShell();
  install();
  addRecoveryStyle();
  reorderActions();
  syncArchivePointerState();
  const archive=$('archiveOverlay');
  if(archive) new MutationObserver(syncArchivePointerState).observe(archive,{attributes:true,attributeFilter:['class']});
  // V65's UI is supplied here; original V65 remains lazy for timing artwork.
  // Prevent its unconditional appendChild observer from being installed later.
  const bar=document.querySelector('#spreadOverlay .actionbar');
  if(bar){
    bar.__luneaV65Observed=true;
    new MutationObserver(reorderActions).observe(bar,{childList:true});
  }
  document.addEventListener('click',event=>{
    if(!event.target?.closest?.('#archiveOverlay [data-close="archive"]')) return;
    event.preventDefault();event.stopImmediatePropagation();closeArchive();
  },true);
  W.addEventListener('pageshow',syncArchivePointerState,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) syncArchivePointerState()});
})();
