'use strict';

/* LUNEA HORARY POST ACTIONS V44
   ---------------------------------------------------------------
   - Replaces the two fragile post-result actions (AI / copy) with DOM-backed
     handlers that read the already-rendered deterministic Horary result.
   - Keeps Horary archive writes synchronized into Journal V2 IndexedDB.
   - Repairs previously saved Horary rows that never reached Journal V2.
   - Keeps non-card systems (Meihua / Horary / text-only evidence rows) out of
     the generic Tarot card-thumbnail decorator and renders compact summaries.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_POST_ACTIONS_V44__) return;
  W.__LUNEA_HORARY_POST_ACTIONS_V44__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const DB_NAME = 'LUNEA_READING_DB';
  const DB_VERSION = 1;
  const STORE = 'journal';
  const $ = id => document.getElementById(id);
  const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const uid = () => {
    try { return crypto.randomUUID(); }
    catch { return `hv44-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  };

  function currentQuestion() { return clean($('astroHoraryQuestion')?.value || ''); }
  function currentMoment() { return String($('astroHoraryMoment')?.value || '').trim(); }
  function currentPlace() { return clean($('astroHoraryPlace')?.value || ''); }
  function currentTopic() { return String($('astroHoraryTopic')?.value || 'general').trim(); }
  function resultNode() { return $('astroHoraryResult'); }
  function aiNode() { return $('astroHoraryAIText'); }

  function resultText() {
    const node = resultNode();
    if (!node || !node.classList.contains('show')) return '';
    return String(node.innerText || node.textContent || '').trim();
  }

  function prashnaText() {
    const block = String(W.LUNEA_PRASHNA_V1?.promptBlock?.() || '').trim();
    if (block) return block;
    const node = $('luneaPrashnaV1Result');
    return String(node?.innerText || node?.textContent || '').trim();
  }

  function currentAIText() {
    const node = aiNode();
    if (!node?.classList.contains('show')) return '';
    const text = String(node.textContent || '').trim();
    if (!text || /판정하는 중|해석 중|AI 해석 실패/.test(text)) return '';
    return text;
  }

  function categoryFor(text='') {
    const topic = currentTopic();
    if (['relationship','reconciliation','contact'].includes(topic)) return 'LOVE';
    if (['career','exam'].includes(topic)) return 'CAREER';
    if (['stock','money'].includes(topic)) return 'STOCK';
    const t = `${text} ${currentQuestion()}`;
    if (/재회|연애|사랑|상대|궁합|연락|love/i.test(t)) return 'LOVE';
    if (/직장|취업|이직|시험|진로|career/i.test(t)) return 'CAREER';
    if (/주식|매수|매도|익절|손절|stock/i.test(t)) return 'STOCK';
    return 'GENERAL';
  }

  async function writeClipboard(text) {
    const value = String(text || '');
    if (!value) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly','');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  function copyPayload() {
    const result = resultText();
    if (!result) return '';
    const lines = [
      'LUNEA · HORARY · 질문시각 점성술',
      '',
      `[질문]\n${currentQuestion() || '—'}`,
      `[질문 시각]\n${currentMoment() || '—'}`,
      `[장소]\n${currentPlace() || '—'}`,
      '',
      '[HORARY V1 · 계산 결과]',
      result
    ];
    const p = prashnaText();
    if (p) lines.push('', '[PRASHNA · 독립 교차계산]', p);
    const ai = currentAIText();
    if (ai) lines.push('', '[AI 해석]', ai);
    return lines.join('\n');
  }

  async function copyNow(button) {
    const text = copyPayload();
    if (!text) {
      alert('먼저 호라리 차트를 계산해줘.');
      return;
    }
    const old = button?.textContent || '📋 결과 전체 복사';
    if (button) { button.disabled = true; button.textContent = '복사 중…'; }
    const ok = await writeClipboard(text);
    if (button) {
      button.disabled = false;
      button.textContent = ok ? '✓ 전체 복사 완료' : old;
      if (ok) setTimeout(() => { if (button.isConnected) button.textContent = old; }, 1500);
    }
    if (!ok) alert('복사 권한을 확인해줘.');
  }

  function aiPrompt() {
    const result = resultText();
    if (!result) return '';
    const prashna = prashnaText();
    return `당신은 LUNEA의 전통 Horary(호라리·질문시각 점성술) 해석자다.
아래 화면에 표시된 계산값은 엔진이 이미 확정했다. 계산값을 수정하거나 새 행성 위치·하우스·각·날짜를 만들지 마라.

[질문 원문]
${currentQuestion()}

[HORARY V1 · 질문시각 점성술 계산 결과]
${result}

${prashna ? `${prashna}\n` : ''}[해석 원칙]
1. Horary 본체는 Tropical + Regiomontanus 계산을 기준으로 한다.
2. 화면에 제공된 Significator(대표 행성), Perfection(성사각), Reception(리셉션), Moon 진행, VOC, prohibition/frustration/refranation 등만 사용한다. 제공되지 않은 값은 추정하지 않는다.
3. 기하학적 각이 보여도 화면에서 유효 성사각으로 채택되지 않았다면 성사 근거로 승격하지 않는다.
4. 질문자/상대/파생하우스는 엔진에 표시된 라우팅을 우선한다.
5. 정확각 시각은 점성술적 후보이지 현실 사건의 보장 시각이 아니다.
6. 근거가 엇갈리면 애매함과 제한을 명시한다. 희망고문과 단정 모두 금지한다.
7. Prashna 블록이 있으면 독립적인 Sidereal/Lahiri 보조층으로만 읽는다. Horary 결론을 덮어쓰거나 점수를 합산하지 않는다. 같은 방향은 교차 보조, 다른 방향은 체계 간 충돌로 표시한다.
8. 질문 원문에 직접 답하고 전문용어 뒤에 쉬운 한국어 설명을 붙인다.

[출력]
### 한줄 결론
질문에 직접 답하는 1~2문장.

### 핵심 판정 근거
질문자/상대 또는 사건 대표 행성, 성사각, 리셉션을 우선순위대로 설명.

### Moon과 전개
달의 다음 적용각과 사건 흐름, 시기 후보가 있을 때만 설명.

### 제한·방해 요소
VOC, 개입각, prohibition/frustration/refranation, 손상·역행 등 실제 제공된 요소만 설명.

${prashna ? '### Horary ↔ Prashna 교차\n두 체계가 같은 방향인지 충돌하는지 분리해서 설명.\n\n' : ''}### 신뢰도와 불확실성
무엇이 강한 근거이고 무엇이 아직 불확실한지 명시.`;
  }

  async function runAI(button) {
    const prompt = aiPrompt();
    if (!prompt) {
      alert('먼저 호라리 차트를 계산해줘.');
      return;
    }
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) {
      alert('LUNEA API 설정을 먼저 해줘.');
      return;
    }
    const output = aiNode();
    const old = button?.textContent || '🔮 호라리 AI 해석';
    if (button) { button.disabled = true; button.textContent = '🔮 해석 중…'; }
    if (output) {
      output.classList.add('show');
      output.textContent = '계산 근거를 질문 원문에 맞춰 판정하는 중…';
    }
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts:[{text:prompt}]}],
          generationConfig:{temperature:.35, topP:.86}
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.error?.message || `HTTP ${response.status}`);
      const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!text) throw new Error('AI 응답이 비어 있어.');
      if (output) output.textContent = text;
      await repairLatestHoraryArchive({forceAI:text});
    } catch (error) {
      if (output) output.textContent = `AI 해석 실패: ${error?.message || error}`;
    } finally {
      if (button) { button.disabled = false; button.textContent = old; }
    }
  }

  function readArchive() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function writeArchive(rows) {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify((rows || []).slice(0,100)));
      return true;
    } catch (error) {
      console.error('[LUNEA Horary V44] archive write failed', error);
      return false;
    }
  }

  function isHorary(reading) {
    return !!(reading?.horary || /^HORARY\b/i.test(String(reading?.title || '')));
  }

  function isMeihua(reading) {
    return !!(reading?.meihua?.version === 1 || /^MEIHUA\b/i.test(String(reading?.title || '')));
  }

  function isNarrativeCards(reading) {
    const cards = Array.isArray(reading?.cards) ? reading.cards : [];
    return !!cards.length && cards.every(card =>
      !!String(card?.text || '').trim() &&
      !card?.code && !card?.name && !card?.img && !card?.image && !card?.position
    );
  }

  function signature(reading) {
    return [
      clean(reading?.title).toLowerCase(),
      clean(reading?.q).toLowerCase(),
      ...(reading?.cards || []).map(card => `${clean(card?.name || card?.text).toLowerCase()}:${card?.isReversed ? 'r' : 'u'}`)
    ].join('|');
  }

  function archiveSnapshot() {
    return {
      resultText: resultText(),
      prashnaText: prashnaText(),
      moment: currentMoment(),
      place: currentPlace(),
      topic: currentTopic()
    };
  }

  async function openJournalDB() {
    return new Promise((resolve,reject) => {
      if (!('indexedDB' in W)) return reject(new Error('IndexedDB unavailable'));
      const req = indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        const store = db.objectStoreNames.contains(STORE)
          ? req.transaction.objectStore(STORE)
          : db.createObjectStore(STORE,{keyPath:'id'});
        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt','createdAt');
        if (!store.indexNames.contains('sourceArchiveId')) store.createIndex('sourceArchiveId','sourceArchiveId');
        if (!store.indexNames.contains('signature')) store.createIndex('signature','signature');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Journal DB open failed'));
    });
  }

  async function journalRows(db) {
    return new Promise((resolve,reject) => {
      const req = db.transaction(STORE,'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function putJournal(db,row) {
    return new Promise((resolve,reject) => {
      const req = db.transaction(STORE,'readwrite').objectStore(STORE).put(row);
      req.onsuccess = () => resolve(row);
      req.onerror = () => reject(req.error);
    });
  }

  async function upsertJournalReading(reading) {
    if (!reading?.id) return null;
    const db = await openJournalDB();
    try {
      const rows = await journalRows(db);
      const sourceId = String(reading.id);
      const sig = signature(reading);
      const existing = rows.find(row => String(row?.sourceArchiveId || '') === sourceId)
        || rows.find(row => row?.signature === sig && Math.abs(Number(row?.createdAt || 0) - Number(reading.createdAt || 0)) < 86400000);
      const row = {
        id:String(existing?.id || uid()),
        sourceArchiveId:sourceId,
        createdAt:Number(reading.createdAt || existing?.createdAt || Date.now()),
        updatedAt:Date.now(),
        category:String(existing?.category || reading?.category || categoryFor(`${reading?.title || ''} ${reading?.q || ''}`)).toUpperCase(),
        status:['pending','hit','partial','miss','unverifiable'].includes(existing?.status) ? existing.status : 'pending',
        resultDate:String(existing?.resultDate || ''),
        dueDate:String(existing?.dueDate || ''),
        outcome:String(existing?.outcome || ''),
        note:String(existing?.note || ''),
        tags:Array.isArray(existing?.tags) ? existing.tags : [],
        signature:sig,
        reading:JSON.parse(JSON.stringify(reading))
      };
      return await putJournal(db,row);
    } finally {
      try { db.close(); } catch {}
    }
  }

  async function repairLatestHoraryArchive({forceAI=''}={}) {
    const rows = readArchive();
    const q = currentQuestion();
    let index = rows.findIndex(row => isHorary(row) && (!q || clean(row?.q) === q));
    if (index < 0 && resultText()) {
      rows.unshift({
        id:uid(),
        createdAt:Date.now(),
        date:new Date().toLocaleString('ko-KR'),
        title:'HORARY · 질문시각 점성술',
        q:q,
        rationale:'질문을 처음 명확하게 이해한 시각과 장소의 Tropical · Regiomontanus 차트',
        cards:[],
        ai:forceAI || currentAIText(),
        category:categoryFor(q),
        horary:{version:44,screenSnapshot:archiveSnapshot()}
      });
      index = 0;
    }
    if (index < 0) return null;
    const reading = {...rows[index]};
    reading.category = reading.category || categoryFor(`${reading.title || ''} ${reading.q || ''}`);
    reading.cards = Array.isArray(reading.cards) ? reading.cards : [];
    const runtime = archiveSnapshot();
    reading.horaryRuntimeV44 = runtime;
    const ai = forceAI || currentAIText();
    if (ai) reading.ai = ai;
    rows[index] = reading;
    writeArchive(rows);
    try { await upsertJournalReading(reading); }
    catch (error) { console.error('[LUNEA Horary V44] Journal sync failed', error); }
    try { await Promise.resolve(W.LUNEA_READING_JOURNAL?.render?.()); } catch {}
    return reading;
  }

  async function repairSavedHoraryRows() {
    const rows = readArchive().filter(isHorary).slice(0,30);
    for (const reading of rows) {
      try { await upsertJournalReading(reading); }
      catch (error) { console.error('[LUNEA Horary V44] historical Journal repair skipped', error); }
    }
    try { await Promise.resolve(W.LUNEA_READING_JOURNAL?.render?.()); } catch {}
  }

  function findReadingForRow(row, rows) {
    const sourceId = String(row?.dataset?.sourceArchiveId || row?.dataset?.archiveId || '');
    if (sourceId) {
      const byId = rows.find(item => String(item?.id || '') === sourceId);
      if (byId) return byId;
    }
    const titleNode = row?.querySelector?.('.archive-title');
    const titleClone = titleNode?.cloneNode?.(true);
    titleClone?.querySelectorAll?.('.lj-badge')?.forEach?.(node => node.remove());
    const title = clean(titleClone?.textContent || '');
    const question = clean(row?.querySelector?.('.archive-q')?.textContent || '');
    return rows.find(item => clean(item?.title) === title && clean(item?.q) === question) || null;
  }

  function addNarrativeStyle() {
    if ($('luneaNarrativeArchiveV44Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaNarrativeArchiveV44Style';
    style.textContent = `
      #archiveOverlay .lunea-narrative-summary-v44{display:flex;gap:6px;overflow-x:auto;margin:8px 0 10px;padding:1px 0 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      #archiveOverlay .lunea-narrative-summary-v44::-webkit-scrollbar{display:none}
      #archiveOverlay .lunea-narrative-chip-v44{flex:0 0 auto;padding:7px 9px;border-radius:10px;border:1px solid rgba(137,216,191,.16);background:rgba(73,129,109,.065);color:#cbd9d1;font-size:8.6px;line-height:1.35;white-space:nowrap}
      #archiveOverlay .archive-item[data-lunea-noncard-v44='1']>.lunea-archive-card-strip{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function narrativeSummary(reading) {
    if (isMeihua(reading)) {
      const r = reading?.meihua?.calculation || {};
      const bu = r.bodyUse || {};
      return [
        `본괘 · ${r.primary?.number || '—'} ${r.primary?.hanja || ''} ${r.primary?.ko || ''}`,
        `호괘 · ${r.mutual?.number || '—'} ${r.mutual?.hanja || ''} ${r.mutual?.ko || ''}`,
        `변괘 · ${r.changed?.number || '—'} ${r.changed?.hanja || ''} ${r.changed?.ko || ''}`,
        `體 ${bu.body?.hanja || '—'} · 用 ${bu.use?.hanja || '—'} · ${bu.primaryRelation?.hanja || ''}`
      ];
    }
    if (isHorary(reading)) {
      const runtime = reading?.horaryRuntimeV44 || {};
      return [
        'Tropical · Regiomontanus',
        runtime.moment ? `질문시각 · ${runtime.moment.replace('T',' ')}` : '질문시각 차트',
        runtime.place ? `장소 · ${runtime.place}` : '독립 호라리 기록'
      ];
    }
    return [];
  }

  function repairArchivePresentation() {
    addNarrativeStyle();
    const list = $('archiveList');
    if (!list) return;
    const rows = readArchive();
    list.querySelectorAll(':scope > .archive-item').forEach(row => {
      const reading = findReadingForRow(row,rows);
      if (!reading || (!isMeihua(reading) && !isHorary(reading) && !isNarrativeCards(reading))) return;
      row.dataset.luneaNoncardV44 = '1';
      row.querySelector(':scope > .lunea-archive-card-strip')?.remove();
      row.querySelector(':scope > .lunea-narrative-summary-v44')?.remove();
      const summary = narrativeSummary(reading);
      if (!summary.length) return;
      const box = document.createElement('div');
      box.className = 'lunea-narrative-summary-v44';
      summary.forEach(text => {
        const chip = document.createElement('div');
        chip.className = 'lunea-narrative-chip-v44';
        chip.textContent = text;
        box.appendChild(chip);
      });
      const actions = row.querySelector(':scope > .archive-actions');
      if (actions) row.insertBefore(box,actions);
      else row.appendChild(box);
    });
  }

  function installArchivePresentationRepair() {
    addNarrativeStyle();
    const list = $('archiveList');
    if (!list || list.__luneaNarrativeV44Observer) return false;
    list.__luneaNarrativeV44Observer = true;
    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; repairArchivePresentation(); });
    };
    new MutationObserver(schedule).observe(list,{childList:true,subtree:false});
    ['archiveSearch','ljStatus','ljCat','archiveCategoryFilter','archiveStatusFilter'].forEach(id => {
      $(id)?.addEventListener('input',schedule,{passive:true});
      $(id)?.addEventListener('change',schedule,{passive:true});
    });
    schedule();
    return true;
  }

  function installActions() {
    document.addEventListener('click', event => {
      const aiButton = event.target?.closest?.('#astroHoraryAI');
      if (aiButton) {
        event.preventDefault();
        event.stopPropagation();
        try { event.stopImmediatePropagation(); } catch {}
        runAI(aiButton);
        return;
      }
      const copyButton = event.target?.closest?.('#astroHoraryCopy');
      if (copyButton) {
        event.preventDefault();
        event.stopPropagation();
        try { event.stopImmediatePropagation(); } catch {}
        copyNow(copyButton);
        return;
      }
      const saveButton = event.target?.closest?.('#astroHorarySave');
      if (saveButton) {
        setTimeout(() => repairLatestHoraryArchive(),40);
        setTimeout(() => repairLatestHoraryArchive(),260);
      }
    },true);
  }

  function boot() {
    installActions();
    installArchivePresentationRepair();
    setTimeout(repairSavedHoraryRows,700);
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      installArchivePresentationRepair();
      if (tries >= 30) clearInterval(timer);
    },150);
    W.LUNEA_HORARY_POST_ACTIONS_V44 = Object.freeze({
      version:'44.0',
      copyPayload,
      aiPrompt,
      repairLatestHoraryArchive,
      repairSavedHoraryRows,
      repairArchivePresentation
    });
    console.info('✦ LUNEA Horary Post Actions V44 active · AI/copy/journal sync ON');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
