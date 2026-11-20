'use strict';

/*
  LUNEA PROFILE SLOTS V1
  ======================
  Several "my profile" entries on one device (for example me and a friend
  using the same phone, or a second birth-time hypothesis). Each slot owns the
  storage keys that make up a profile; switching saves the current keys into
  the active slot, writes the chosen slot's keys back and reloads the page so
  every module starts from the same profile.

  Shared across slots on purpose: partners (LUNEA_PARTNERS_V1), reading
  archive, API key/model, display settings.
*/
(() => {
  const W = window;
  if (W.__LUNEA_PROFILE_SLOTS_V1__) return;
  W.__LUNEA_PROFILE_SLOTS_V1__ = true;

  const STORE_KEY = 'LUNEA_PROFILE_SLOTS_V1';
  const KEYS = [
    'LUNEA_USER_PROFILE',
    'LUNEA_BIRTH_DATE', 'LUNEA_BIRTH_TIME', 'LUNEA_BIRTH_PLACE', 'LUNEA_BIRTH_GENDER', 'LUNEA_BIRTH_HOUR_OVERRIDE',
    'LUNEA_SAJU_AUTO_V1', 'LUNEA_NATAL_ENGINE_V1', 'LUNEA_ASTRO_NATAL_V3',
    'LUNEA_VEDIC_PROFILE_V1', 'LUNEA_THAI_STANDALONE_V24_LAST'
  ];
  // A pending server job belongs to the profile it was started for.
  const CLEAR_ON_SWITCH = ['LUNEA_ASTRO_PENDING_V23'];
  const $ = id => document.getElementById(id);

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (v && Array.isArray(v.slots) && v.slots.length) return v;
    } catch {}
    return null;
  }
  function save(store){ try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {} }
  function snapshotKeys(){
    const data = {};
    for (const k of KEYS) { const v = localStorage.getItem(k); if (v !== null) data[k] = v; }
    return data;
  }
  function writeKeys(data){
    for (const k of KEYS) {
      if (data && Object.prototype.hasOwnProperty.call(data, k)) localStorage.setItem(k, data[k]);
      else localStorage.removeItem(k);
    }
    for (const k of CLEAR_ON_SWITCH) localStorage.removeItem(k);
  }
  const newId = () => `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;

  // First run: the current profile becomes slot 1.
  function ensure(){
    let store = load();
    if (!store) {
      const id = newId();
      store = {activeId:id, slots:[{id, name:'내 프로필', data:snapshotKeys(), updatedAt:new Date().toISOString()}]};
      save(store);
    }
    if (!store.slots.some(s => s.id === store.activeId)) { store.activeId = store.slots[0].id; save(store); }
    return store;
  }
  function active(){ const s = ensure(); return s.slots.find(x => x.id === s.activeId); }

  function captureActive(store){
    const cur = store.slots.find(x => x.id === store.activeId);
    if (cur) { cur.data = snapshotKeys(); cur.updatedAt = new Date().toISOString(); }
  }

  function switchTo(id, {reload = true} = {}){
    const store = ensure();
    if (id === store.activeId) return false;
    const target = store.slots.find(x => x.id === id);
    if (!target) return false;
    captureActive(store);
    writeKeys(target.data);
    store.activeId = id;
    save(store);
    if (reload) W.location.reload();
    return true;
  }

  function create(name, {reload = true} = {}){
    const store = ensure();
    captureActive(store);
    const id = newId();
    store.slots.push({id, name:String(name || '').trim().slice(0, 20) || `프로필 ${store.slots.length + 1}`, data:{}, updatedAt:new Date().toISOString()});
    store.activeId = id;
    writeKeys({});
    save(store);
    if (reload) W.location.reload();
    return id;
  }

  function rename(id, name){
    const store = ensure();
    const s = store.slots.find(x => x.id === id);
    const n = String(name || '').trim().slice(0, 20);
    if (!s || !n) return false;
    s.name = n; save(store); return true;
  }

  function remove(id, {reload = true} = {}){
    const store = ensure();
    if (store.slots.length <= 1) return false;
    if (id === store.activeId) {
      const next = store.slots.find(x => x.id !== id);
      writeKeys(next.data);
      store.activeId = next.id;
      store.slots = store.slots.filter(x => x.id !== id);
      save(store);
      if (reload) W.location.reload();
      return true;
    }
    store.slots = store.slots.filter(x => x.id !== id);
    save(store);
    return true;
  }

  function summary(slot){
    const d = slot?.data || {};
    const live = slot && slot.id === ensure().activeId;
    const get = k => live ? localStorage.getItem(k) : d[k];
    let auto = null;
    try { auto = JSON.parse(get('LUNEA_SAJU_AUTO_V1') || 'null'); } catch {}
    const field = id => (live && typeof document !== 'undefined' && document.getElementById(id)?.value) || '';
    const date = field('birthDate') || get('LUNEA_BIRTH_DATE') || auto?.birthDate || '';
    const time = field('birthTime') || get('LUNEA_BIRTH_TIME') || auto?.birthTime || '';
    const place = field('birthPlace') || get('LUNEA_BIRTH_PLACE') || auto?.birthPlace || '';
    return [date, time, place].filter(Boolean).join(' · ') || '출생정보 없음';
  }

  // ---------- UI ----------
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function addStyles(){
    if ($('luneaProfileSlotsStyle')) return;
    const s = document.createElement('style');
    s.id = 'luneaProfileSlotsStyle';
    s.textContent = `
      .lps-bar{margin:4px 0 12px;padding:10px 11px;border-radius:15px;border:1px solid rgba(189,164,248,.2);background:rgba(255,255,255,.035)}
      .lps-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center}
      .lps-row select,.lps-row input{width:100%;min-width:0;box-sizing:border-box}
      .lps-btn{border:1px solid rgba(189,164,248,.24);background:rgba(255,255,255,.05);color:var(--text);border-radius:11px;padding:9px 10px;font-size:10.5px;font-weight:700;cursor:pointer;touch-action:manipulation;white-space:nowrap}
      .lps-btn.warn{color:#ffc0ca}
      .lps-label{display:flex;justify-content:space-between;align-items:baseline;font-size:9.6px;letter-spacing:.08em;color:var(--dim);margin:0 0 6px}
      .lps-label b{color:var(--text);letter-spacing:0;font-size:11px}
      .lps-edit{display:none;margin-top:7px}
      .lps-edit.show{display:grid}
      .lps-note{font-size:9.4px;color:var(--dim);line-height:1.5;margin:6px 0 0}
    `;
    document.head.appendChild(s);
  }

  function render(){
    const bar = $('lpsBar');
    if (!bar) return;
    const store = ensure();
    const cur = store.slots.find(x => x.id === store.activeId);
    $('lpsSelect').innerHTML = store.slots.map(s => `<option value="${esc(s.id)}"${s.id === store.activeId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
    $('lpsSummary').textContent = summary(cur);
    $('lpsDelete').hidden = store.slots.length <= 1;
  }

  function ensureBar(){
    const modal = document.querySelector('#profileOverlay .modal');
    if (!modal) return false;
    if ($('lpsBar')) { render(); return true; }
    const bar = document.createElement('div');
    bar.className = 'lps-bar';
    bar.id = 'lpsBar';
    bar.innerHTML = `
      <div class="lps-label"><span>PROFILE · 프로필 선택</span><b id="lpsSummary"></b></div>
      <div class="lps-row">
        <select id="lpsSelect" aria-label="프로필 선택"></select>
        <button type="button" class="lps-btn" id="lpsAdd">+ 추가</button>
        <button type="button" class="lps-btn" id="lpsRename">이름</button>
      </div>
      <div class="lps-row lps-edit" id="lpsEdit">
        <input type="text" id="lpsName" maxlength="20" placeholder="예: 친구 지민, 내 진시 버전">
        <button type="button" class="lps-btn" id="lpsOk">확인</button>
        <button type="button" class="lps-btn" id="lpsCancel">취소</button>
      </div>
      <div class="lps-row" style="grid-template-columns:1fr auto;margin-top:6px">
        <p class="lps-note">프로필마다 출생정보·사주·차트가 따로 저장돼. 상대방 목록과 리딩 기록은 같이 써.</p>
        <button type="button" class="lps-btn warn" id="lpsDelete">삭제</button>
      </div>`;
    const head = modal.querySelector('.modal-h');
    if (head) head.insertAdjacentElement('afterend', bar); else modal.prepend(bar);
    let mode = '';
    const edit = on => { $('lpsEdit').classList.toggle('show', on); if (on) $('lpsName').focus(); };
    $('lpsSelect').addEventListener('change', e => switchTo(e.target.value));
    $('lpsAdd').onclick = () => { mode = 'add'; $('lpsName').value = ''; $('lpsName').placeholder = '새 프로필 이름 (예: 친구 지민)'; edit(true); };
    $('lpsRename').onclick = () => { mode = 'rename'; $('lpsName').value = active()?.name || ''; edit(true); };
    $('lpsCancel').onclick = () => { mode = ''; edit(false); };
    $('lpsOk').onclick = () => {
      const name = $('lpsName').value.trim();
      if (!name) { $('lpsName').focus(); return; }
      if (mode === 'add') create(name);
      else if (mode === 'rename') { rename(ensure().activeId, name); edit(false); render(); syncStrip(); }
    };
    $('lpsDelete').onclick = e => {
      const b = e.currentTarget;
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = '정말 삭제'; return; }
      remove(ensure().activeId);
    };
    render();
    return true;
  }

  // Strip chip with the active profile name once there is more than one.
  function syncStrip(){
    const tags = document.querySelector('#profileStrip .profile-tags');
    if (!tags) return;
    const store = ensure();
    let chip = $('profileSlotTag');
    if (store.slots.length <= 1) { chip?.remove(); return; }
    if (!chip) {
      chip = document.createElement('span');
      chip.className = 'tag';
      chip.id = 'profileSlotTag';
      tags.prepend(chip);
    }
    chip.textContent = `👤 ${active()?.name || '프로필'}`;
  }

  W.LUNEA_PROFILE_SLOTS_V1 = {version:1, keys:KEYS, storeKey:STORE_KEY, ensure, active, switchTo, create, rename, remove, snapshotKeys};

  function boot(){
    addStyles(); ensure(); ensureBar(); syncStrip();
    // Refresh the summary whenever the profile opens or birth data changes.
    $('profileBtn')?.addEventListener('click', () => setTimeout(render, 60));
    ['birthDate','birthTime','birthPlace'].forEach(id => $(id)?.addEventListener('change', () => setTimeout(render, 60)));
  }
  if (typeof document === 'undefined' || typeof W.addEventListener !== 'function') return;
  const later = () => setTimeout(boot, 700);
  if (document.readyState === 'complete') later();
  else W.addEventListener('load', later, {once:true});
})();
