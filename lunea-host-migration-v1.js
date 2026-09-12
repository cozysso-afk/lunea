/* Explicit, user-triggered host transfer. No network, auth, calculation or storage patch. */
(function (W) {
  'use strict';
  if (W.LUNEA_HOST_MIGRATION_V1) return;
  const KEYS = Object.freeze([
    'LUNEA_ARCHIVE','LUNEA_ARCHIVE_V2','LUNEA_ARCHIVE_V3','LUNEA_ARCHIVE_V3_BACKUP_V43',
    'LUNEA_READING_JOURNAL_V1','LUNEA_LAST_READING_DRAFT_V1',
    'LUNEA_DAILY_ORBIT_V1','LUNEA_DAILY_TIMING_V49','LUNEA_TIMING_ORACLE_V1',
    'LUNEA_TIMING_HISTORY_V1','LUNEA_TIMING_AB_HISTORY_V1',
    'LUNEA_SPREAD_CORRECTION_MEMORY_V1','LUNEA_SPREAD_USAGE_MEMORY_V1',
    'LUNEA_SPREAD_MEMORY','LUNEA_SPREAD_MEMORY_V7','LUNEA_SPREAD_MEMORY_V72','LUNEA_SPREAD_MEMORY_V8',
    'LUNEA_MANUAL_SPREAD_LIBRARY_V1','LUNEA_MANUAL_SPREAD_DRAFT_V1',
    'LUNEA_USER_PROFILE','LUNEA_BIRTH_DATE','LUNEA_BIRTH_TIME','LUNEA_BIRTH_PLACE',
    'LUNEA_BIRTH_LAT','LUNEA_BIRTH_LON','LUNEA_BIRTH_REGION_V45','LUNEA_BIRTH_DISTRICT_V45',
    'LUNEA_ASTRO_NATAL_V3','LUNEA_ASTRO_PROFILE_V3_SETTINGS','LUNEA_PROFILE_V3_ACTIVE_TAB',
    'LUNEA_MODEL','LUNEA_MESSAGE_ORACLE_LAST_V1','LUNEA_MESSAGE_ORACLE_SAVED_V1',
    'LUNEA_INTIMACY_ADULT_ACK_V1','LUNEA_INTIMACY_ORACLE_DRAFT_V1','LUNEA_INTIMACY_ORACLE_MODE_V1',
    'LUNEA_HORARY_PLACE','LUNEA_HORARY_V1','LUNEA_TRANSIT_SCAN_V1','LUNEA_THAI_STANDALONE_V24_LAST'
  ]);
  const LIMIT = 20 * 1024 * 1024;
  const secretKey = /^(?:__proto__|prototype|constructor|api[_-]?key|password|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret)$/i;
  function inspect(value, depth = 0) {
    if (depth > 40) throw Error('백업 데이터 중첩이 너무 깊어.');
    if (typeof value === 'string' && /(?:AIza[\w-]{30,}|Bearer\s+\S+|(?:api_key|client_secret|access_token|refresh_token|password)\s*[=:]\s*\S+)/i.test(value)) throw Error('백업에 인증 정보로 보이는 값이 있어. 해당 값은 제거한 뒤 다시 시도해줘.');
    if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
      if (secretKey.test(key)) throw Error('백업에 인증 정보 필드가 있어. 인증 정보는 이전하지 않아.');
      inspect(item, depth + 1);
    }
  }
  function decode(value) { try { return JSON.parse(value); } catch { return value; } }
  function portable(value, base, field = '') {
    if (typeof value === 'string' && /^(?:imgSrc|src|img|image|imageUrl|image_url|front|back)$/i.test(field) && value.startsWith(base)) {
      const relative = value.slice(base.length);
      if (/^(?:assets\/[\w/.-]+|[\w.-]+)\.(?:png|jpe?g|svg|webp)(?:\?[\w=.-]+)?$/i.test(relative)) return './' + relative;
    }
    if (Array.isArray(value)) return value.map(item => portable(item,base,field));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,portable(item,base,key)]));
    return value;
  }
  function validate(data) {
    if (!data || data.format !== 'lunea-host-transfer' || data.version !== 1 || !data.localStorage || Array.isArray(data.localStorage) || !Array.isArray(data.journal)) throw Error('LUNEA 사이트 이전 백업 파일이 아니야.');
    if (JSON.stringify(data).length > LIMIT || data.journal.length > 20000) throw Error('백업이 허용 크기를 초과했어.');
    for (const [key, value] of Object.entries(data.localStorage)) {
      if (!KEYS.includes(key) || typeof value !== 'string') throw Error('이전할 수 없는 저장 항목이 있어.');
      inspect(decode(value));
    }
    const ids = new Set();
    for (const row of data.journal) {
      if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id) || !row.reading || typeof row.reading !== 'object') throw Error('Journal 항목을 확인해줘.');
      ids.add(row.id); inspect(row);
    }
    return data;
  }
  function database() {
    return new Promise((resolve, reject) => {
      const request = W.indexedDB.open('LUNEA_READING_DB', 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('journal', {keyPath:'id'});
        for (const key of ['createdAt','sourceArchiveId','signature']) store.createIndex(key,key,{unique:false});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = request.onblocked = () => reject(Error('Journal 저장소를 열지 못했어. 다른 LUNEA 탭을 닫고 다시 시도해줘.'));
    });
  }
  async function capture(storage = W.localStorage) {
    const local = {};
    for (const key of KEYS) { const value = storage.getItem(key); if (value !== null) local[key] = value; }
    const db = await database();
    const journal = await new Promise((resolve,reject) => {
      const req = db.transaction('journal','readonly').objectStore('journal').getAll();
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(Error('Journal 백업 읽기 실패'));
    }).finally(() => db.close());
    const base = new URL('./',W.location.href).href;
    for (const key of Object.keys(local)) { const parsed = decode(local[key]); if (typeof parsed === 'object' && parsed !== null) local[key] = JSON.stringify(portable(parsed,base)); }
    const data = validate({format:'lunea-host-transfer',version:1,createdAt:Date.now(),sourceOrigin:W.location.origin,localStorage:local,journal:portable(journal,base)});
    // Fail closed if a known locally configured credential was copied into a note/payload.
    const secrets = [storage.getItem('LUNEA_API_KEY')];
    const session = decode(storage.getItem('LUNEA_SUPABASE_SESSION_V1') || '{}');
    if (session && typeof session === 'object') secrets.push(session.access_token,session.refresh_token);
    const text = JSON.stringify(data);
    if (secrets.some(s => typeof s === 'string' && s.length >= 8 && text.includes(s))) throw Error('저장된 기록에 인증 정보가 포함돼 있어 백업을 중단했어.');
    return data;
  }
  function merge(oldValue, incoming) {
    const old = decode(oldValue), next = decode(incoming);
    if (!Array.isArray(old) || !Array.isArray(next)) return incoming;
    const identity = row => row && row.id ? 'id:' + row.id : JSON.stringify(row);
    const seen = new Set(next.map(identity));
    return JSON.stringify([...next,...old.filter(row => !seen.has(identity(row)))]);
  }
  async function restore(input, storage = W.localStorage) {
    const data = validate(input); // Validate everything before opening a write transaction.
    const db = await database(), previous = new Map();
    try {
      await new Promise((resolve,reject) => {
        const tx = db.transaction('journal','readwrite');
        let failure;
        tx.oncomplete = resolve;
        tx.onabort = () => {
          try { for (const [key,value] of previous) value === null ? storage.removeItem(key) : storage.setItem(key,value); }
          catch { return reject(Error('복원 중 저장 공간 오류. 내려받은 이전 전 백업을 보관해줘.')); }
          reject(failure || Error('Journal 복원이 취소됐어. 기존 데이터를 유지했어.'));
        };
        // No clear(): destination-only records survive; matching IDs use the imported snapshot.
        try {
          for (const row of data.journal) tx.objectStore('journal').put(row);
          for (const [key,value] of Object.entries(data.localStorage)) {
            const old = storage.getItem(key); previous.set(key,old); storage.setItem(key,merge(old,value));
          }
        } catch (error) { failure = Error('저장 공간 부족 또는 복원 오류. 기존 데이터를 유지했어.'); tx.abort(); }
      });
    } finally { db.close(); }
    return {keys:Object.keys(data.localStorage).length,journal:data.journal.length};
  }
  function download(data, prefix) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = W.document.createElement('a'); a.href = url; a.download = prefix + '-' + Date.now() + '.json'; a.click();
    W.setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  async function exportFile() {
    try { download(await capture(),'lunea-host-transfer'); W.alert('사이트 이전 백업을 내려받았어. 질문·출생 정보가 포함되므로 안전하게 보관해줘. API 키와 로그인은 새 사이트에서 다시 입력해야 해.'); }
    catch { W.alert('백업하지 못했어. 저장소 접근·용량 또는 기록 내 인증 정보를 확인해줘. 기존 데이터는 그대로야.'); }
  }
  async function importFile(file) {
    if (!file) return;
    try {
      if (file.size > LIMIT) throw Error('백업이 너무 커.');
      const data = validate(JSON.parse(await file.text()));
      const safety = await capture(); download(safety,'lunea-before-host-import');
      if (!W.confirm('이전 전 백업을 내려받았어. 파일 저장을 확인했니? 가져오는 초안·프로필·동일 ID 기록을 적용하고, 다른 기록은 유지할게. API 키와 로그인은 그대로 유지돼. 계속할까?')) return;
      await restore(data);
      W.alert('복원 완료. 자동 재계산은 하지 않았어. 열린 편집을 멈추고 페이지를 새로고침한 뒤 초안·기록을 확인해줘.');
    } catch { W.alert('가져오기를 완료하지 못했어. 올바른 사이트 이전 백업인지와 저장 공간을 확인해줘. 이전 전 백업은 보관해줘.'); }
  }
  W.LUNEA_HOST_MIGRATION_V1 = Object.freeze({version:1,keys:KEYS,validate,capture,restore,merge,portable,exportFile,importFile});
})(typeof window === 'undefined' ? globalThis : window);
