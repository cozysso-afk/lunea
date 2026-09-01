'use strict';
(() => {
  if (window.__LUNEA_JOURNAL_V2__) return;
  window.__LUNEA_JOURNAL_V2__ = true;

  const DB_NAME = 'LUNEA_READING_DB';
  const DB_VERSION = 1;
  const STORE = 'journal';
  const OLD_JOURNAL_KEY = 'LUNEA_READING_JOURNAL_V1';
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const STATUS = {
    pending: '○ 미확인',
    hit: '✓ 맞음',
    partial: '△ 부분',
    miss: '× 틀림',
    unverifiable: '? 판정불가'
  };
  let dbPromise = null;
  let renderEpoch = 0;

  const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const clone = v => {
    try { return JSON.parse(JSON.stringify(v)); }
    catch { return null; }
  };
  const uid = () => {
    try { return crypto.randomUUID(); }
    catch { return `j-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  };
  const today = () => {
    const d = new Date();
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  };
  const readLocalArray = key => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };

  function category(reading, explicit = '') {
    if (explicit) return norm(explicit).toUpperCase();
    if (reading?.category) return norm(reading.category).toUpperCase();
    const t = `${reading?.title || ''} ${reading?.q || ''}`;
    if (/주식|매수|매도|익절|손절|stock/i.test(t)) return 'STOCK';
    if (/재회|연애|사랑|상대|궁합|연락|love/i.test(t)) return 'LOVE';
    if (/직장|취업|이직|시험|진로|career/i.test(t)) return 'CAREER';
    if (/오늘|데일리|daily/i.test(t)) return 'DAILY';
    return 'GENERAL';
  }

  function signature(reading) {
    return [
      norm(reading?.title).toLowerCase(),
      norm(reading?.q).toLowerCase(),
      ...(reading?.cards || []).map(c =>
        `${norm(c?.name || c?.text).toLowerCase()}:${c?.isReversed ? 'r' : 'u'}`
      )
    ].join('|');
  }

  function clean(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const reading = clone(entry.reading || entry.source || {});
    if (!reading) return null;
    return {
      id: String(entry.id || uid()),
      sourceArchiveId: String(entry.sourceArchiveId || reading.id || ''),
      createdAt: Number(entry.createdAt || reading.createdAt || Date.now()),
      updatedAt: Number(entry.updatedAt || Date.now()),
      category: category(reading, entry.category),
      status: STATUS[entry.status] ? entry.status : 'pending',
      resultDate: norm(entry.resultDate),
      dueDate: norm(entry.dueDate),
      outcome: String(entry.outcome || ''),
      note: String(entry.note || ''),
      tags: Array.isArray(entry.tags)
        ? [...new Set(entry.tags.map(norm).filter(Boolean))].slice(0, 30)
        : [],
      signature: String(entry.signature || signature(reading)),
      reading
    };
  }

  function toEntry(reading, explicitCategory = '') {
    const r = clone(reading) || {};
    if (explicitCategory && !r.category) r.category = explicitCategory;
    return clean({
      id: uid(),
      sourceArchiveId: String(r.id || ''),
      createdAt: Number(r.createdAt || Date.now()),
      updatedAt: Date.now(),
      category: category(r, explicitCategory),
      status: 'pending',
      resultDate: '',
      dueDate: '',
      outcome: '',
      note: '',
      tags: [],
      signature: signature(r),
      reading: r
    });
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('이 브라우저에서 IndexedDB를 사용할 수 없어.'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        const store = db.objectStoreNames.contains(STORE)
          ? req.transaction.objectStore(STORE)
          : db.createObjectStore(STORE, { keyPath: 'id' });
        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt');
        if (!store.indexNames.contains('sourceArchiveId')) store.createIndex('sourceArchiveId', 'sourceArchiveId');
        if (!store.indexNames.contains('signature')) store.createIndex('signature', 'signature');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB 열기 실패'));
      req.onblocked = () => console.warn('[LUNEA Journal V2] IndexedDB upgrade blocked');
    });
    return dbPromise;
  }

  async function getAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(
        (req.result || []).map(clean).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt)
      );
      req.onerror = () => reject(req.error);
    });
  }

  async function put(entry) {
    const row = clean(entry);
    if (!row) return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(row);
      req.onsuccess = () => resolve(row);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteEntry(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clearJournal() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function upsertReading(reading, explicitCategory = '', quiet = true) {
    if (!reading) return null;
    const incoming = toEntry(reading, explicitCategory);
    const rows = await getAll();
    let existing = rows.find(x =>
      incoming.sourceArchiveId && x.sourceArchiveId === incoming.sourceArchiveId
    );
    if (!existing) {
      existing = rows.find(x =>
        x.signature === incoming.signature &&
        Math.abs(x.createdAt - incoming.createdAt) < 86400000
      );
    }
    if (existing) {
      existing.reading = incoming.reading;
      existing.sourceArchiveId = incoming.sourceArchiveId || existing.sourceArchiveId;
      existing.category = explicitCategory || existing.category;
      existing.signature = incoming.signature;
      existing.updatedAt = Date.now();
      return put(existing);
    }
    try {
      return await put(incoming);
    } catch (err) {
      console.error('[LUNEA Journal V2] save failed', err);
      if (!quiet) alert('검증 기록 저장에 실패했어. 브라우저 저장공간 설정을 확인해줘.');
      return null;
    }
  }

  async function migrateLegacy() {
    const oldJournal = readLocalArray(OLD_JOURNAL_KEY);
    const archive = readLocalArray(ARCHIVE_KEY);
    if (!oldJournal.length && !archive.length) return;

    const existing = await getAll();
    const byId = new Map(existing.filter(x => x.sourceArchiveId).map(x => [x.sourceArchiveId, x]));
    const bySig = new Map(existing.map(x => [x.signature, x]));

    for (const raw of oldJournal) {
      const row = clean(raw);
      if (!row) continue;
      const found = (row.sourceArchiveId && byId.get(row.sourceArchiveId)) || bySig.get(row.signature);
      if (!found) {
        await put(row);
        if (row.sourceArchiveId) byId.set(row.sourceArchiveId, row);
        bySig.set(row.signature, row);
      }
    }

    for (const reading of archive) {
      const id = String(reading?.id || '');
      const sig = signature(reading);
      const found = (id && byId.get(id)) || bySig.get(sig);
      if (found) {
        found.reading = clone(reading) || found.reading;
        found.updatedAt = Date.now();
        await put(found);
      } else {
        const row = toEntry(reading);
        await put(row);
        if (row.sourceArchiveId) byId.set(row.sourceArchiveId, row);
        bySig.set(row.signature, row);
      }
    }

    if (oldJournal.length) {
      try { localStorage.removeItem(OLD_JOURNAL_KEY); } catch {}
    }
  }

  function readingText(reading) {
    const cards = (reading?.cards || []).map(c =>
      c?.text ||
      `${c?.position || ''}: ${c?.name || ''} (${c?.isReversed ? '역' : '정'})` +
      (c?.subCards?.length ? ' / 보조 ' + c.subCards.map(s => s.name).join(', ') : '')
    ).join('\n');
    return [
      reading?.date || '',
      reading?.title || '',
      `질문: ${reading?.q || ''}`,
      cards,
      reading?.ai ? `[AI 해석]\n${reading.ai}` : ''
    ].filter(Boolean).join('\n\n');
  }

  function entryText(entry) {
    return `${readingText(entry.reading)}\n\n[검증]\n판정: ${STATUS[entry.status]}` +
      (entry.resultDate ? `\n실제 결과 날짜: ${entry.resultDate}` : '') +
      (entry.dueDate ? `\n확인 예정일: ${entry.dueDate}` : '') +
      (entry.outcome ? `\n실제 결과: ${entry.outcome}` : '') +
      (entry.note ? `\n메모: ${entry.note}` : '') +
      (entry.tags?.length ? `\n태그: ${entry.tags.join(', ')}` : '');
  }

  function stats(rows) {
    const counts = { pending: 0, hit: 0, partial: 0, miss: 0, unverifiable: 0 };
    rows.forEach(x => { if (counts[x.status] !== undefined) counts[x.status] += 1; });
    const verified = counts.hit + counts.partial + counts.miss;
    const score = verified
      ? Math.round((counts.hit + counts.partial * 0.5) / verified * 100)
      : null;
    return { counts, verified, score };
  }

  function addStyles() {
    if ($('ljStyleV2')) return;
    const style = document.createElement('style');
    style.id = 'ljStyleV2';
    style.textContent = `
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
  }

  function enhanceUI() {
    const overlay = $('archiveOverlay');
    const modal = overlay?.querySelector('.archive-modal');
    const toolbar = overlay?.querySelector('.archive-toolbar');
    if (!overlay || !modal || !toolbar) return false;

    addStyles();
    const sub = modal.querySelector('.sub');
    const heading = modal.querySelector('.modal-h');
    if (sub) sub.textContent = 'LUNEA TAROT DIARY · REVIEW';
    if (heading && !heading.dataset.ljV2) {
      heading.dataset.ljV2 = '1';
      heading.firstChild.textContent = '✧ 타로 기록 · 검증 일지 ';
    }
    if ($('archiveBtn')) $('archiveBtn').textContent = '✧ 기록·검증';
    if ($('archiveSearch')) $('archiveSearch').placeholder = '질문·카드·결과·태그 검색';

    if (!$('ljStats')) {
      const statsBox = document.createElement('div');
      statsBox.id = 'ljStats';
      statsBox.className = 'lj-stats';
      toolbar.before(statsBox);

      const note = document.createElement('div');
      note.id = 'ljNote';
      note.className = 'lj-note';
      statsBox.after(note);

      const filters = document.createElement('div');
      filters.className = 'lj-filter';
      filters.innerHTML =
        '<select id="ljStatus"><option value="">모든 판정</option><option value="pending">미확인</option><option value="hit">맞음</option><option value="partial">부분</option><option value="miss">틀림</option><option value="unverifiable">판정불가</option></select>' +
        '<select id="ljCat"><option value="">모든 분야</option></select>';
      toolbar.after(filters);

      const tools = document.createElement('div');
      tools.className = 'lj-tools';
      tools.innerHTML =
        '<button class="mini" id="ljExport">JSON 백업</button>' +
        '<button class="mini" id="ljImport">JSON 복원</button>' +
        '<input class="lj-hidden" type="file" id="ljFile" accept="application/json,.json">';
      filters.after(tools);
    }

    if ($('clearArchive')) $('clearArchive').textContent = '전체 기록·검증 비우기';
    return true;
  }

  async function patchEntry(id, patch) {
    const rows = await getAll();
    const row = rows.find(x => x.id === id);
    if (!row) return;
    Object.assign(row, patch, { updatedAt: Date.now() });
    await put(row);
  }

  function reviewPanel(entry, rerender) {
    const panel = document.createElement('div');
    panel.className = 'lj-review';

    const statuses = document.createElement('div');
    statuses.className = 'lj-statuses';
    for (const [key, label] of Object.entries(STATUS)) {
      const btn = document.createElement('button');
      btn.className = 'mini' + (entry.status === key ? ' on' : '');
      btn.textContent = label;
      btn.onclick = async () => {
        await patchEntry(entry.id, {
          status: key,
          resultDate: key !== 'pending' && !entry.resultDate ? today() : entry.resultDate
        });
        rerender(entry.id);
      };
      statuses.append(btn);
    }
    panel.append(statuses);

    const makeField = (label, type, value) => {
      const wrap = document.createElement('div');
      wrap.className = 'lj-field';
      const lab = document.createElement('label');
      lab.textContent = label;
      const input = document.createElement('input');
      input.type = type;
      input.value = value || '';
      wrap.append(lab, input);
      return [wrap, input];
    };

    const grid = document.createElement('div');
    grid.className = 'lj-grid';
    const [resultWrap, resultDate] = makeField('실제 결과 날짜', 'date', entry.resultDate);
    const [dueWrap, dueDate] = makeField('확인 예정일', 'date', entry.dueDate);
    grid.append(resultWrap, dueWrap);
    panel.append(grid);

    const makeTextarea = (label, value, placeholder) => {
      const wrap = document.createElement('div');
      wrap.className = 'lj-field';
      const lab = document.createElement('label');
      lab.textContent = label;
      const input = document.createElement('textarea');
      input.value = value || '';
      input.placeholder = placeholder || '';
      wrap.append(lab, input);
      panel.append(wrap);
      return input;
    };

    const outcome = makeTextarea(
      '실제로 무슨 일이 있었는지',
      entry.outcome,
      '예: 연락은 왔지만 실제 만남은 없었음.'
    );
    const note = makeTextarea(
      '검증 메모',
      entry.note,
      '맞은 부분 / 빗나간 부분'
    );
    const [tagWrap, tags] = makeField('태그', 'text', (entry.tags || []).join(', '));
    panel.append(tagWrap);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'mini lj-save';
    saveBtn.textContent = '✓ 검증 내용 저장';
    saveBtn.onclick = async () => {
      await patchEntry(entry.id, {
        resultDate: resultDate.value,
        dueDate: dueDate.value,
        outcome: outcome.value,
        note: note.value,
        tags: [...new Set(tags.value.split(',').map(norm).filter(Boolean))].slice(0, 30)
      });
      saveBtn.textContent = '✓ 저장됨';
      setTimeout(() => rerender(entry.id), 250);
    };
    panel.append(saveBtn);
    return panel;
  }

  function rowElement(entry, rerender, openId) {
    const reading = entry.reading || {};
    const el = document.createElement('div');
    el.className = 'archive-item';

    const badge = document.createElement('span');
    badge.className = 'lj-badge';
    badge.dataset.s = entry.status;
    badge.textContent = STATUS[entry.status];

    const meta = document.createElement('div');
    meta.className = 'archive-meta';
    meta.textContent =
      `${reading.date || new Date(entry.createdAt).toLocaleString('ko-KR')} · ${entry.category}`;

    const title = document.createElement('div');
    title.className = 'archive-title';
    title.textContent = reading.title || '이름 없는 리딩';
    title.append(badge);

    const q = document.createElement('div');
    q.className = 'archive-q';
    q.textContent = reading.q || '질문 원문 없음';

    const actions = document.createElement('div');
    actions.className = 'archive-actions';
    const mk = text => {
      const btn = document.createElement('button');
      btn.className = 'mini';
      btn.textContent = text;
      return btn;
    };
    const reviewBtn = mk(entry.status === 'pending' ? '검증하기' : '검증 수정');
    const detailBtn = mk('카드/해석');
    const copyBtn = mk('복사');
    const deleteBtn = mk('삭제');
    deleteBtn.classList.add('danger');
    actions.append(reviewBtn, detailBtn, copyBtn, deleteBtn);

    const detail = document.createElement('div');
    detail.className = 'archive-detail';

    const review = reviewPanel(entry, rerender);
    if (openId === entry.id) review.classList.add('open');

    reviewBtn.onclick = () => review.classList.toggle('open');
    detailBtn.onclick = () => {
      if (!detail.dataset.loaded) {
        detail.textContent = readingText(reading);
        detail.dataset.loaded = '1';
      }
      detail.classList.toggle('open');
    };
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(entryText(entry));
        copyBtn.textContent = '✓ 복사됨';
        setTimeout(() => { copyBtn.textContent = '복사'; }, 800);
      } catch {
        alert('복사 권한을 확인해줘.');
      }
    };
    deleteBtn.onclick = async () => {
      if (!confirm('이 기록과 검증 내용을 삭제할까?')) return;
      await deleteEntry(entry.id);
      if (entry.sourceArchiveId) {
        try {
          const archive = readLocalArray(ARCHIVE_KEY)
            .filter(x => String(x?.id || '') !== entry.sourceArchiveId)
            .slice(0, 100);
          localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
        } catch {}
      }
      rerender();
    };

    el.append(meta, title, q, actions, detail, review);
    return el;
  }

  async function renderJournal(openId = '') {
    if (!enhanceUI()) return;
    await migrateLegacy();

    const all = await getAll();
    const stat = stats(all);
    const statBox = $('ljStats');
    if (!statBox) return;
    statBox.replaceChildren();

    [
      ['전체', all.length],
      ['확인 완료', stat.verified],
      ['검증 점수', stat.score == null ? '—' : `${stat.score}%`],
      ['미확인', stat.counts.pending]
    ].forEach(([label, value]) => {
      const div = document.createElement('div');
      div.className = 'lj-stat';
      const strong = document.createElement('b');
      strong.textContent = value;
      const span = document.createElement('span');
      span.textContent = label;
      div.append(strong, span);
      statBox.append(div);
    });

    const note = $('ljNote');
    if (note) {
      note.textContent =
        `IndexedDB 장기 보관 · 맞음 ${stat.counts.hit} · 부분 ${stat.counts.partial} · 틀림 ${stat.counts.miss} · ` +
        `판정불가 ${stat.counts.unverifiable} · 점수=(맞음+부분×0.5)/확인 완료`;
    }

    const catSelect = $('ljCat');
    const currentCat = catSelect?.value || '';
    const categories = [...new Set(all.map(x => x.category))].sort();
    if (catSelect) {
      catSelect.replaceChildren();
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '모든 분야';
      catSelect.append(opt);
      categories.forEach(cat => {
        const o = document.createElement('option');
        o.value = cat;
        o.textContent = cat;
        catSelect.append(o);
      });
      if (categories.includes(currentCat)) catSelect.value = currentCat;
    }

    const query = norm($('archiveSearch')?.value).toLowerCase();
    const status = $('ljStatus')?.value || '';
    const cat = catSelect?.value || '';
    const rows = all.filter(entry => {
      if (status && entry.status !== status) return false;
      if (cat && entry.category !== cat) return false;
      if (!query) return true;
      const reading = entry.reading || {};
      return [
        reading.title,
        reading.q,
        reading.ai,
        entry.outcome,
        entry.note,
        (entry.tags || []).join(' '),
        (reading.cards || []).map(c => c.name || c.text).join(' ')
      ].join(' ').toLowerCase().includes(query);
    });

    if ($('archiveCount')) $('archiveCount').textContent = `${all.length}개`;

    const list = $('archiveList');
    if (!list) return;
    list.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = all.length
        ? '필터에 맞는 기록이 없어.'
        : '리딩 화면에서 💾 저장을 누르면 여기에 차곡차곡 쌓여.';
      list.append(empty);
      return;
    }

    const epoch = ++renderEpoch;
    let index = 0;
    const appendChunk = () => {
      if (epoch !== renderEpoch) return;
      const frag = document.createDocumentFragment();
      const end = Math.min(index + 7, rows.length);
      for (; index < end; index += 1) {
        frag.append(rowElement(rows[index], renderJournal, openId));
      }
      list.append(frag);
      if (index < rows.length) requestAnimationFrame(appendChunk);
    };
    requestAnimationFrame(appendChunk);
  }

  async function openJournal() {
    try {
      await migrateLegacy();
      enhanceUI();
      const overlay = $('archiveOverlay');
      if (!overlay) return;
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      const modal = overlay.querySelector('.modal');
      if (modal) modal.scrollTop = 0;
      await renderJournal();
    } catch (err) {
      console.error('[LUNEA Journal V2] open failed', err);
      alert('기록·검증함을 여는 중 오류가 났어.');
    }
  }

  async function exportJournal() {
    const rows = await getAll();
    if (!rows.length) return alert('백업할 기록이 없어.');
    const payload = {
      format: 'lunea-reading-journal',
      version: 2,
      storage: 'indexeddb',
      exportedAt: new Date().toISOString(),
      entries: rows
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunea-reading-journal-${today()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  async function importJournal(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const raw = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(raw)) throw new Error('형식 오류');
      const incoming = raw.map(clean).filter(Boolean);
      if (!incoming.length) throw new Error('빈 백업');
      if (!confirm(`${incoming.length}개 기록을 현재 검증함에 병합할까? 기존 기록은 유지돼.`)) return;

      const current = await getAll();
      const byId = new Map(current.filter(x => x.sourceArchiveId).map(x => [x.sourceArchiveId, x]));
      const bySig = new Map(current.map(x => [x.signature, x]));

      for (const row of incoming) {
        const old = (row.sourceArchiveId && byId.get(row.sourceArchiveId)) || bySig.get(row.signature);
        if (old) {
          row.id = old.id;
          row.createdAt = old.createdAt;
        }
        await put(row);
        if (row.sourceArchiveId) byId.set(row.sourceArchiveId, row);
        bySig.set(row.signature, row);
      }
      alert('검증 기록 복원이 끝났어.');
      await renderJournal();
    } catch (err) {
      console.error('[LUNEA Journal V2] import failed', err);
      alert('루니아 검증 기록 JSON 파일인지 확인해줘.');
    }
  }

  async function clearAll() {
    if (!confirm('타로 기록·검증함을 전부 비울까? JSON 백업이 없다면 되돌릴 수 없어.')) return;
    await clearJournal();
    try { localStorage.setItem(ARCHIVE_KEY, '[]'); } catch {}
    await renderJournal();
  }

  function currentCategory() {
    try { return typeof state === 'undefined' ? '' : String(state.category || ''); }
    catch { return ''; }
  }

  function bindSaveBridge() {
    const btn = $('saveReading');
    if (!btn || btn.dataset.ljV2Bound) return;
    btn.dataset.ljV2Bound = '1';
    btn.addEventListener('click', () => {
      const cat = currentCategory();
      setTimeout(async () => {
        const reading = readLocalArray(ARCHIVE_KEY)[0];
        if (!reading) return;
        const saved = await upsertReading(reading, cat, false);
        if (!saved) return;
        const old = btn.textContent;
        btn.textContent = '✓ 기록·검증 저장';
        setTimeout(() => {
          if (btn.textContent === '✓ 기록·검증 저장') btn.textContent = old || '💾 저장';
        }, 1000);
      }, 120);
    });
  }

  function bindUI() {
    enhanceUI();
    bindSaveBridge();

    const search = $('archiveSearch');
    if (search) search.oninput = () => renderJournal();

    const status = $('ljStatus');
    if (status) status.onchange = () => renderJournal();

    const cat = $('ljCat');
    if (cat) cat.onchange = () => renderJournal();

    const exportBtn = $('ljExport');
    if (exportBtn) exportBtn.onclick = exportJournal;

    const importBtn = $('ljImport');
    const file = $('ljFile');
    if (importBtn && file) {
      importBtn.onclick = () => file.click();
      file.onchange = async () => {
        await importJournal(file.files?.[0]);
        file.value = '';
      };
    }

    const copyAll = $('copyAllArchive');
    if (copyAll) copyAll.onclick = async () => {
      const rows = await getAll();
      if (!rows.length) return alert('기록이 없어.');
      try {
        await navigator.clipboard.writeText(rows.map(entryText).join('\n\n────────────\n\n'));
        alert('전체 기록 복사 완료');
      } catch {
        alert('복사 권한을 확인해줘.');
      }
    };

    const clearBtn = $('clearArchive');
    if (clearBtn) clearBtn.onclick = clearAll;
  }

  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#archiveBtn')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openJournal();
  }, true);

  async function boot() {
    try {
      await openDB();
      await migrateLegacy();
    } catch (err) {
      console.error('[LUNEA Journal V2] IndexedDB init failed', err);
    }

    bindUI();
    if (document.readyState !== 'complete') {
      window.addEventListener('load', bindUI, { once: true });
    }
    setTimeout(bindUI, 800);
    setTimeout(bindUI, 1800);

    window.LUNEA_READING_JOURNAL = {
      version: 2,
      storage: 'indexeddb',
      open: openJournal,
      render: renderJournal,
      getAll,
      export: exportJournal
    };
    console.info('✧ LUNEA Reading Journal V2 loaded · IndexedDB');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();