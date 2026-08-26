'use strict';

/*
  LUNEA MANUAL SPREAD LIBRARY V1
  ==============================
  Persistent reusable presets for user-authored spreads.

  - Keeps existing last-draft autosave untouched.
  - Explicitly stores multiple named presets in localStorage.
  - Each preset keeps question, spread title, positions, A/B symmetry,
    tarot category and upright/reversed setting.
  - Saved presets are not overwritten when the current draft changes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MANUAL_LIBRARY_V1__) return;
  W.__LUNEA_MANUAL_LIBRARY_V1__ = true;

  const LIB_KEY = 'LUNEA_MANUAL_SPREAD_LIBRARY_V1';
  const MAX_ITEMS = 60;
  const $ = id => document.getElementById(id);

  function norm(v) {
    return String(v || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  }

  function uid() {
    try {
      if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
    } catch {}
    return `manual-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  }

  function readLibrary() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LIB_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(x => x && x.id) : [];
    } catch { return []; }
  }

  function writeLibrary(items) {
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
      return true;
    } catch {
      alert('수동 스프레드 보관함 저장 공간을 사용할 수 없어. 브라우저 저장공간 설정을 확인해줘.');
      return false;
    }
  }

  function currentCategory() {
    const text = norm($('sheetCat')?.textContent || 'GENERAL').toUpperCase();
    return text || 'GENERAL';
  }

  function currentReversed() {
    const selected = document.querySelector('.radio-box.selected[data-rev]');
    return selected?.dataset?.rev === '1';
  }

  function snapshot() {
    const question = norm($('question')?.value || '');
    const title = norm($('luneaManualTitle')?.value || '');
    const positionsRaw = String($('luneaManualPositions')?.value || '').trim();
    const symmetric = !!$('luneaManualAB')?.checked;
    const category = currentCategory();
    const allowReversed = currentReversed();
    const firstPosition = positionsRaw.split(/\n+/).map(norm).filter(Boolean)[0] || '';
    const fallback = question || firstPosition || '수동 스프레드';
    const name = title || (fallback.length > 26 ? fallback.slice(0, 26) + '…' : fallback);
    return {question, title, positionsRaw, symmetric, category, allowReversed, name};
  }

  function applyReversed(value) {
    const wanted = value ? '1' : '0';
    const boxes = [...document.querySelectorAll('.radio-box[data-rev]')];
    const target = boxes.find(x => x.dataset.rev === wanted);
    if (!target) return;
    boxes.forEach(x => x.classList.toggle('selected', x === target));
    try { state.allowReversed = !!value; } catch {}
    target.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function openManualCategory(category) {
    const cat = norm(category || 'GENERAL').toUpperCase() || 'GENERAL';
    const opener = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof opener === 'function') {
      opener(
        cat,
        '직접 입력 배열',
        '보관함에서 불러온 수동 스프레드입니다. 저장된 질문과 포지션을 그대로 다시 사용할 수 있습니다.',
        1
      );
    }
    try {
      state.__luneaManualMode = true;
      state.__luneaManualReading = false;
      state.isAi = false;
    } catch {}
    $('luneaManualPanel')?.classList.add('show');
    const label = $('drawLabel');
    if (label) label.textContent = '직접 배열로 카드 펼치기';
  }

  function fireDraftEvents() {
    ['question','luneaManualTitle','luneaManualPositions','luneaManualAB'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }

  function libraryLabel(item) {
    const category = item.category || 'GENERAL';
    const ab = item.symmetric ? ' · A/B' : '';
    return `${item.name || item.title || '이름 없는 배열'} · ${category}${ab}`;
  }

  function renderLibrary(selectedId='') {
    const select = $('luneaManualLibrarySelect');
    const count = $('luneaManualLibraryCount');
    if (!select) return;
    const items = readLibrary();
    select.replaceChildren();

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = items.length ? '저장된 배열 선택…' : '아직 저장된 배열이 없어';
    select.appendChild(empty);

    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = libraryLabel(item);
      select.appendChild(option);
    });
    if (selectedId && items.some(x => x.id === selectedId)) select.value = selectedId;
    if (count) count.textContent = `${items.length}개 보관 중 · 최대 ${MAX_ITEMS}개`;
    syncButtons();
  }

  function syncButtons() {
    const hasSelection = !!$('luneaManualLibrarySelect')?.value;
    if ($('luneaManualLibraryLoad')) $('luneaManualLibraryLoad').disabled = !hasSelection;
    if ($('luneaManualLibraryDelete')) $('luneaManualLibraryDelete').disabled = !hasSelection;
  }

  function saveCurrent() {
    const data = snapshot();
    if (!data.positionsRaw) return alert('보관할 카드 포지션을 먼저 입력해줘.');

    const items = readLibrary();
    const same = items.find(x => norm(x.name) === norm(data.name));
    const now = Date.now();
    let selectedId = '';

    if (same) {
      const overwrite = confirm(`“${data.name}” 이름의 저장본이 이미 있어.\n\n기존 저장본을 현재 내용으로 업데이트할까?\n취소를 누르면 새 복사본으로 저장해.`);
      if (overwrite) {
        Object.assign(same, data, {updatedAt:now});
        selectedId = same.id;
      } else {
        const item = {...data, id:uid(), createdAt:now, updatedAt:now, name:`${data.name} · 복사본`};
        items.unshift(item);
        selectedId = item.id;
      }
    } else {
      const item = {...data, id:uid(), createdAt:now, updatedAt:now};
      items.unshift(item);
      selectedId = item.id;
    }

    items.sort((a,b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    if (!writeLibrary(items)) return;
    renderLibrary(selectedId);
    const btn = $('luneaManualLibrarySave');
    if (btn) {
      const old = btn.textContent;
      btn.textContent = '✓ 보관 완료';
      setTimeout(() => { btn.textContent = old; }, 1300);
    }
  }

  function loadSelected() {
    const id = $('luneaManualLibrarySelect')?.value;
    const item = readLibrary().find(x => x.id === id);
    if (!item) return alert('불러올 저장본을 선택해줘.');

    openManualCategory(item.category || 'GENERAL');
    if ($('question')) $('question').value = item.question || '';
    if ($('luneaManualTitle')) $('luneaManualTitle').value = item.title || '';
    if ($('luneaManualPositions')) $('luneaManualPositions').value = item.positionsRaw || '';
    if ($('luneaManualAB')) $('luneaManualAB').checked = !!item.symmetric;
    applyReversed(!!item.allowReversed);
    fireDraftEvents();

    const items = readLibrary();
    const stored = items.find(x => x.id === id);
    if (stored) stored.lastUsedAt = Date.now();
    writeLibrary(items);

    const note = $('luneaManualLibraryNotice');
    if (note) note.textContent = `불러옴 · ${item.name} · 질문/배열/설정 복원 완료`;
    setTimeout(() => $('luneaManualPositions')?.focus(), 0);
  }

  function deleteSelected() {
    const id = $('luneaManualLibrarySelect')?.value;
    const items = readLibrary();
    const item = items.find(x => x.id === id);
    if (!item) return;
    if (!confirm(`“${item.name}” 저장본을 보관함에서 삭제할까?\n현재 작성 중인 내용은 지워지지 않아.`)) return;
    writeLibrary(items.filter(x => x.id !== id));
    renderLibrary();
    const note = $('luneaManualLibraryNotice');
    if (note) note.textContent = '저장본만 삭제했어. 현재 작성 중인 배열은 그대로야.';
  }

  function newDraft() {
    const hasContent = norm($('question')?.value) || norm($('luneaManualTitle')?.value) || norm($('luneaManualPositions')?.value);
    if (hasContent && !confirm('현재 작성 중인 질문/배열 입력칸을 비울까?\n보관함에 저장한 배열은 삭제되지 않아.')) return;
    if ($('question')) $('question').value = '';
    if ($('luneaManualTitle')) $('luneaManualTitle').value = '';
    if ($('luneaManualPositions')) $('luneaManualPositions').value = '';
    if ($('luneaManualAB')) $('luneaManualAB').checked = false;
    fireDraftEvents();
    const select = $('luneaManualLibrarySelect');
    if (select) select.value = '';
    syncButtons();
    const note = $('luneaManualLibraryNotice');
    if (note) note.textContent = '새 작업 시작 · 보관함 저장본은 그대로 유지돼.';
    setTimeout(() => $('question')?.focus(), 0);
  }

  function addStyles() {
    if ($('luneaManualLibraryStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaManualLibraryStyle';
    style.textContent = `
      #luneaManualLibrary{margin:10px 0 2px;padding:10px;border-radius:13px;background:rgba(189,164,248,.055);border:1px solid rgba(189,164,248,.17)}
      #luneaManualLibrary .ml-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}
      #luneaManualLibrary .ml-head b{font-size:10.5px;color:#eee8f8}
      #luneaManualLibraryCount{font-size:8.8px;color:var(--dim)}
      #luneaManualLibrarySelect{width:100%;min-height:42px;margin:0;background:rgba(15,12,23,.78);color:#eee8f8;border:1px solid rgba(189,164,248,.20);border-radius:10px;padding:8px;font-size:10px}
      #luneaManualLibrary .ml-actions{display:grid;grid-template-columns:1.15fr 1fr 1fr;gap:6px;margin-top:7px}
      #luneaManualLibrary .ml-actions2{display:grid;grid-template-columns:1fr;gap:6px;margin-top:6px}
      #luneaManualLibrary button{min-height:38px}
      #luneaManualLibraryNotice{margin-top:6px;min-height:14px;color:var(--gold);font-size:8.9px;line-height:1.45}
      #luneaManualLibrary .ml-help{margin:5px 0 0;color:var(--dim);font-size:8.8px;line-height:1.48}
      @media(max-width:390px){#luneaManualLibrary .ml-actions{grid-template-columns:1fr 1fr}.ml-save{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI() {
    if ($('luneaManualLibrary')) return true;
    const panel = $('luneaManualPanel');
    if (!panel) return false;
    addStyles();

    const box = document.createElement('div');
    box.id = 'luneaManualLibrary';
    box.innerHTML = `
      <div class="ml-head"><b>☆ 수동 스프레드 보관함</b><span id="luneaManualLibraryCount"></span></div>
      <select id="luneaManualLibrarySelect" aria-label="저장된 수동 스프레드"></select>
      <div class="ml-actions">
        <button type="button" class="mini ml-save" id="luneaManualLibrarySave">☆ 현재 보관</button>
        <button type="button" class="mini" id="luneaManualLibraryLoad">↩ 불러오기</button>
        <button type="button" class="mini" id="luneaManualLibraryDelete">삭제</button>
      </div>
      <div class="ml-actions2"><button type="button" class="mini" id="luneaManualLibraryNew">＋ 새 작업</button></div>
      <div id="luneaManualLibraryNotice"></div>
      <p class="ml-help">‘마지막 작업본 자동저장’과 별개야. ☆ 보관한 저장본은 새 질문/배열을 써도 덮어쓰지 않아.</p>`;

    panel.appendChild(box);
    $('luneaManualLibrarySave').onclick = saveCurrent;
    $('luneaManualLibraryLoad').onclick = loadSelected;
    $('luneaManualLibraryDelete').onclick = deleteSelected;
    $('luneaManualLibraryNew').onclick = newDraft;
    $('luneaManualLibrarySelect').addEventListener('change', syncButtons);
    renderLibrary();
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (ensureUI() || tries > 100) clearInterval(timer);
    }, 80);
    ensureUI();
    W.LUNEA_MANUAL_LIBRARY = {
      read: readLibrary,
      saveCurrent,
      loadSelected,
      key: LIB_KEY
    };
    console.info('☆ LUNEA Manual Spread Library V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
