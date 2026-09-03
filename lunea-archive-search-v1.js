'use strict';
(() => {
  if (window.__LUNEA_ARCHIVE_SEARCH_V1__) return;
  window.__LUNEA_ARCHIVE_SEARCH_V1__ = true;

  const $ = id => document.getElementById(id);
  const norm = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const STATUS_TEXT = {
    pending: ['미확인', 'pending'],
    hit: ['맞음', 'hit'],
    partial: ['부분', 'partial'],
    miss: ['틀림', 'miss'],
    unverifiable: ['판정불가', 'unverifiable']
  };
  const CATEGORY_TEXT = {
    GENERAL: ['general', '일반'],
    LOVE: ['love', '연애', '사랑', '재회', '궁합'],
    CAREER: ['career', '직장', '취업', '이직', '시험', '진로'],
    STOCK: ['stock', '주식', '매수', '매도'],
    DAILY: ['daily', '데일리', '오늘'],
    INTIMACY: ['intimacy', '친밀감', '속궁합']
  };

  function canonicalDate(value) {
    const s = String(value || '');
    let m = s.match(/(20\d{2})[-\/.]\s*(\d{1,2})[-\/.]\s*(\d{1,2})/);
    if (!m) m = s.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (!m) return '';
    const y = m[1], mo = String(m[2]).padStart(2, '0'), d = String(m[3]).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  function itemDate(item) {
    return canonicalDate(item?.dataset?.createdDate || item?.dataset?.date || item?.textContent || '');
  }

  function itemMatches(item) {
    const text = norm(item.textContent);
    const from = $('archiveDateFrom')?.value || '';
    const to = $('archiveDateTo')?.value || '';
    const category = $('archiveCategoryFilter')?.value || '';
    const status = $('archiveStatusFilter')?.value || '';
    const date = itemDate(item);

    if (from && (!date || date < from)) return false;
    if (to && (!date || date > to)) return false;
    if (category) {
      const keys = CATEGORY_TEXT[category] || [category];
      if (!keys.some(key => text.includes(norm(key)))) return false;
    }
    if (status) {
      const keys = STATUS_TEXT[status] || [status];
      if (!keys.some(key => text.includes(norm(key)))) return false;
    }
    return true;
  }

  function applyFilters() {
    const list = $('archiveList');
    if (!list) return;
    const items = [...list.querySelectorAll('.archive-item')];
    let visible = 0;
    items.forEach(item => {
      const show = itemMatches(item);
      item.hidden = !show;
      item.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });
    const summary = $('archiveSearchSummary');
    if (summary) summary.textContent = items.length ? `${visible}건 표시` : '검색 결과 없음';
  }

  function rerenderThenFilter() {
    try {
      if (typeof window.renderArchive === 'function') window.renderArchive();
    } catch {}
    requestAnimationFrame(() => requestAnimationFrame(applyFilters));
  }

  function clearFilters() {
    const search = $('archiveSearch');
    if (search) search.value = '';
    ['archiveDateFrom', 'archiveDateTo', 'archiveCategoryFilter', 'archiveStatusFilter'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    rerenderThenFilter();
  }

  function addStyles() {
    if ($('archiveSearchV1Style')) return;
    const style = document.createElement('style');
    style.id = 'archiveSearchV1Style';
    style.textContent = `
      #archiveOverlay .archive-search-advanced{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:7px 0 6px}
      #archiveOverlay .archive-search-advanced input,#archiveOverlay .archive-search-advanced select{min-width:0;min-height:39px;padding:8px 9px;border-radius:12px;border:1px solid rgba(130,234,220,.18);background:rgba(7,13,21,.62);color:#eefafa;font-size:10px}
      #archiveOverlay .archive-search-advanced input:focus,#archiveOverlay .archive-search-advanced select:focus{outline:none;border-color:rgba(130,234,220,.58);box-shadow:0 0 0 2px rgba(130,234,220,.08)}
      #archiveOverlay .archive-search-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 9px}
      #archiveOverlay #archiveSearchSummary{font-size:9px;color:#8fded4}
      #archiveOverlay #archiveSearchReset{flex:0 0 auto}
      @media(max-width:430px){#archiveOverlay .archive-search-advanced{grid-template-columns:1fr}.archive-search-foot{position:sticky;top:0;z-index:2}}
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    const overlay = $('archiveOverlay');
    const toolbar = overlay?.querySelector('.archive-toolbar');
    const list = $('archiveList');
    if (!overlay || !toolbar || !list) return false;
    if ($('archiveSearchAdvanced')) return true;

    addStyles();
    const search = $('archiveSearch');
    if (search) {
      search.placeholder = '질문·스프레드·카드·AI 해석·메모·태그 검색';
      search.setAttribute('autocomplete', 'off');
      search.addEventListener('input', () => requestAnimationFrame(applyFilters));
    }

    const advanced = document.createElement('div');
    advanced.id = 'archiveSearchAdvanced';
    advanced.className = 'archive-search-advanced';
    advanced.innerHTML = `
      <input id="archiveDateFrom" type="date" aria-label="기록 시작 날짜" title="시작 날짜">
      <input id="archiveDateTo" type="date" aria-label="기록 종료 날짜" title="종료 날짜">
      <select id="archiveCategoryFilter" aria-label="기록 카테고리">
        <option value="">전체 카테고리</option><option value="GENERAL">일반</option><option value="LOVE">연애</option><option value="CAREER">직업·시험</option><option value="STOCK">주식</option><option value="DAILY">데일리</option><option value="INTIMACY">친밀감</option>
      </select>
      <select id="archiveStatusFilter" aria-label="검증 상태">
        <option value="">전체 판정</option><option value="pending">미확인</option><option value="hit">맞음</option><option value="partial">부분</option><option value="miss">틀림</option><option value="unverifiable">판정불가</option>
      </select>`;
    toolbar.insertAdjacentElement('afterend', advanced);

    const foot = document.createElement('div');
    foot.className = 'archive-search-foot';
    foot.innerHTML = '<span id="archiveSearchSummary">검색 준비</span><button type="button" class="mini" id="archiveSearchReset">검색 초기화</button>';
    advanced.insertAdjacentElement('afterend', foot);

    advanced.querySelectorAll('input,select').forEach(el => el.addEventListener('change', rerenderThenFilter));
    $('archiveSearchReset')?.addEventListener('click', clearFilters);

    const observer = new MutationObserver(() => requestAnimationFrame(applyFilters));
    observer.observe(list, { childList: true, subtree: true, characterData: true });

    overlay.addEventListener('click', event => {
      if (event.target?.closest?.('.archive-item button')) requestAnimationFrame(applyFilters);
    });
    requestAnimationFrame(applyFilters);
    return true;
  }

  if (!enhance()) {
    const observer = new MutationObserver(() => {
      if (enhance()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
