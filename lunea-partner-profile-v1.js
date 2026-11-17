'use strict';

/*
  LUNEA PARTNER PROFILE V1
  ========================
  Saved birth profiles for the other person in a reading (상대방 출생정보).

  - Several partners can be saved on this device (localStorage only).
  - One partner can be "connected" to readings at a time.
  - Birth time may be unknown. Then the hour pillar is never used, and the
    year/month/day pillars are kept only when the day's first and last
    sample times give the same pillar (the same idea as a range check).
  - Sun sign and Thai weekday come from the date; cusp dates and
    unknown-time Wednesdays are marked instead of guessed.
  - The prompt block is pulled by lunea-final-prompt-priority-v1.js
    (assembleEvidence), so no promptString wrapper is added here.
*/
(() => {
  const W = window;
  if (W.__LUNEA_PARTNER_PROFILE_V1__) return;
  W.__LUNEA_PARTNER_PROFILE_V1__ = true;

  const STORE_KEY = 'LUNEA_PARTNERS_V1';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const DEFAULT_API = 'https://lunea-astro-api.onrender.com';
  const MARKER = '[PARTNER PROFILE · 상대방 출생 명식]';
  const $ = id => document.getElementById(id);

  // ---------- storage ----------
  function load(){
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && Array.isArray(raw.partners)) return {partners:raw.partners, activeId:raw.activeId || ''};
    } catch {}
    return {partners:[], activeId:''};
  }
  function save(store){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
  }
  function active(){
    const s = load();
    return s.partners.find(p => p.id === s.activeId) || null;
  }

  // ---------- date-only derivations ----------
  const SIGNS = [
    // [start month, start day, name]
    [1,20,'물병자리'],[2,19,'물고기자리'],[3,21,'양자리'],[4,20,'황소자리'],
    [5,21,'쌍둥이자리'],[6,22,'게자리'],[7,23,'사자자리'],[8,23,'처녀자리'],
    [9,23,'천칭자리'],[10,23,'전갈자리'],[11,22,'사수자리'],[12,22,'염소자리']
  ];
  function sunSign(dateStr){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    if (!m) return '';
    const mo = +m[2], d = +m[3];
    let name = '염소자리', cusp = false;
    for (let i = SIGNS.length - 1; i >= 0; i--) {
      const [sm, sd, n] = SIGNS[i];
      if (mo > sm || (mo === sm && d >= sd)) { name = n; break; }
    }
    // Ingress dates move by a day or so between years: mark the two days
    // around every boundary instead of guessing.
    for (const [sm, sd] of SIGNS) {
      if (mo === sm && (d === sd || d === sd - 1)) cusp = true;
    }
    return cusp ? `${name} (별자리 경계일 — 정확한 별자리는 확인 필요)` : name;
  }

  const WEEK = [
    ['일요일','Sun ☉'],['월요일','Moon ☽'],['화요일','Mars ♂'],['수요일','Mercury ☿'],
    ['목요일','Jupiter ♃'],['금요일','Venus ♀'],['토요일','Saturn ♄']
  ];
  function thaiDay(dateStr, timeStr, timeUnknown){
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return '';
    const idx = new Date(`${dateStr}T12:00:00`).getDay();
    const [day, ruler] = WEEK[idx];
    if (idx !== 3) return `${day} · ${ruler}`;
    if (timeUnknown || !timeStr) return '수요일 (낮 Mercury / 밤 Rahu 구분은 출생시간 미상으로 미정)';
    const h = +timeStr.slice(0,2);
    return h >= 6 && h < 18 ? '수요일 낮 · Mercury ☿' : '수요일 밤 · Rahu';
  }

  // ---------- saju via Astro Core ----------
  async function fourPillars(api, birthDate, birthTime, place, signal){
    const res = await fetch(`${api}/v1/profile/four-pillars`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({birth_date:birthDate, birth_time:birthTime, place, timezone:'Asia/Seoul'}),
      signal
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
    return data;
  }

  function pillarSummary(p){
    if (!p) return null;
    return {display:p.display || '', ten_god_stem:p.ten_god_stem || ''};
  }

  async function calcSaju(partner){
    if (!partner.birthDate || !partner.birthPlace) throw new Error('생년월일과 출생지가 필요해.');
    const api = String(localStorage.getItem(API_KEY) || DEFAULT_API).replace(/\/+$/,'');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    try {
      await fetch(`${api}/health`, {cache:'no-store', signal:controller.signal}).catch(() => {});
      if (!partner.timeUnknown && partner.birthTime) {
        const d = await fourPillars(api, partner.birthDate, partner.birthTime, partner.birthPlace, controller.signal);
        const pl = d.pillars || {};
        return {
          mode:'exact',
          pillars:{year:pillarSummary(pl.year), month:pillarSummary(pl.month), day:pillarSummary(pl.day), hour:pillarSummary(pl.hour)},
          dayStem:d.day_master?.stem || '',
          trueSolar:!!d.provenance?.true_solar_time_correction
        };
      }
      // Unknown time: sample early and late in the day; keep only stable pillars.
      const a = await fourPillars(api, partner.birthDate, '00:35', partner.birthPlace, controller.signal);
      const b = await fourPillars(api, partner.birthDate, '23:55', partner.birthPlace, controller.signal);
      const out = {};
      const unstable = [];
      for (const key of ['year','month','day']) {
        const pa = a.pillars?.[key], pb = b.pillars?.[key];
        if (pa?.display && pa.display === pb?.display) out[key] = pillarSummary(pa);
        else { out[key] = null; unstable.push(key); }
      }
      out.hour = null;
      return {
        mode:'range',
        pillars:out,
        unstable,
        dayStem: out.day ? (a.day_master?.stem || '') : '',
        trueSolar:!!a.provenance?.true_solar_time_correction
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- prompt block ----------
  const LABEL = {year:'년주', month:'월주', day:'일주', hour:'시주'};
  function promptBlock(){
    const p = active();
    if (!p) return '';
    const unknown = p.timeUnknown || !p.birthTime;
    const rows = [MARKER];
    rows.push(`- 이름/호칭: ${p.name || '상대방'}${p.relation ? ` (${p.relation})` : ''}`);
    if (p.gender) rows.push(`- 성별: ${p.gender}`);
    rows.push(`- 생년월일: ${p.birthDate || '미입력'}${unknown ? ' · 출생시간 모름' : ` ${p.birthTime}`}`);
    if (p.birthPlace) rows.push(`- 출생지: ${p.birthPlace}`);
    const sign = sunSign(p.birthDate);
    if (sign) rows.push(`- 태양궁(날짜 기준): ${sign}`);
    const thai = thaiDay(p.birthDate, p.birthTime, unknown);
    if (thai) rows.push(`- 태국 출생 요일: ${thai}`);
    const s = p.saju;
    if (s?.pillars) {
      const keys = s.mode === 'exact' ? ['year','month','day','hour'] : ['year','month','day'];
      const parts = keys.map(k => s.pillars[k]?.display ? `${LABEL[k]} ${s.pillars[k].display}` : `${LABEL[k]} 미확정`);
      rows.push(`- 사주 원국(Astro Core 계산): ${parts.join(' / ')}`);
      if (s.dayStem) rows.push(`- 사주 일간: ${s.dayStem}`);
      if (s.mode === 'range') {
        rows.push('- 출생시간 미상: 하루의 처음·끝 두 시점에서 같은 값이 나온 기둥만 표시했다. 시주는 제외했다.');
        if (s.unstable?.length) rows.push(`- 경계일로 미확정: ${s.unstable.map(k => LABEL[k]).join(', ')}`);
      }
    } else {
      rows.push('- 사주 원국: 계산 안 됨 (일간·기둥을 새로 만들어내지 않는다)');
    }
    if (p.memo) rows.push(`- 사용자 메모(사실 확인 안 된 사용자 진술): ${String(p.memo).slice(0,300)}`);
    if (unknown) rows.push('- 시간 의존 항목 제외: 시주·대운 시작 시점·ASC·MC·하우스·달의 정확한 도수·자미두수 명반은 사용하지 않는다.');
    return rows.join('\n');
  }

  function policyLine(prompt){
    if (!String(prompt || '').includes(MARKER)) return '';
    return '- Partner Profile(상대방 출생 명식): 질문 대상이 이 사람일 때만 짧게 사용하고, 관련 없으면 0문장으로 생략한다. 상대의 평소 성향·관계에서 중요하게 여기는 것·감정 표현과 결정 방식을 설명하는 데만 쓰고, 지금의 속마음·연락 여부·사건 성립은 RWS 카드로 판단한다. 평소 성향과 현재 심리를 구분하고, 명식으로 속마음을 확인한 것처럼 쓰지 않는다. 제공된 값만 쓰며 미확정·제외 항목, 두 사람 사이의 정확한 각도, 대운·세운은 새로 만들지 않는다. 두 사람 일간·오행의 관계는 제공된 원국 범위에서 1~2문장까지만 다룬다.';
  }

  // ---------- UI ----------
  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function addStyles(){
    if ($('luneaPartnerV1Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaPartnerV1Style';
    s.textContent = `
      .lp1-list{display:grid;gap:7px;margin:8px 0 12px}
      .lp1-item{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;padding:10px 11px;border-radius:13px;border:1px solid rgba(189,164,248,.18);background:rgba(255,255,255,.035)}
      .lp1-item.on{border-color:rgba(255,190,214,.5);background:linear-gradient(135deg,rgba(255,170,205,.10),rgba(189,164,248,.08))}
      .lp1-item b{font-size:12px;color:var(--text)}
      .lp1-item small{display:block;font-size:9.5px;color:var(--dim);margin-top:2px;line-height:1.45}
      .lp1-actions{display:flex;gap:4px}
      .lp1-actions button,.lp1-btn{border:1px solid rgba(189,164,248,.22);background:rgba(255,255,255,.04);color:var(--text);border-radius:10px;padding:7px 8px;font-size:10px;font-weight:700;cursor:pointer;touch-action:manipulation}
      .lp1-actions button.on{border-color:rgba(255,190,214,.55);color:#ffd6e6}
      .lp1-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .lp1-row .field{min-width:0;margin:0 0 8px}
      .lp1-row input,.lp1-row select{width:100%;min-width:0;box-sizing:border-box}
      .lp1-check{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--dim);margin:-2px 0 10px}
      .lp1-check input{width:auto}
      .lp1-status{font-size:9.6px;line-height:1.5;color:var(--dim);margin-top:7px;min-height:14px}
      .lp1-status.ok{color:#bfe7d2}.lp1-status.err{color:#ffc0ca}
      .lp1-empty{font-size:10.5px;color:var(--dim);padding:8px 2px}
      .lp1-form-actions{display:grid;grid-template-columns:1fr auto;gap:7px}
      #partnerStripTag{cursor:pointer}
      /* Four header buttons: keep clear of the brand subtitle on phones. */
      header .head-actions.lp1-four{gap:4px!important}
      header .head-actions.lp1-four .icon-btn{width:34px!important;height:34px!important;border-radius:12px!important}
    `;
    document.head.appendChild(s);
  }

  function ensureOverlay(){
    if ($('partnerOverlay')) return;
    const el = document.createElement('div');
    el.className = 'overlay profile-modal';
    el.id = 'partnerOverlay';
    el.setAttribute('aria-hidden','true');
    el.innerHTML = `
      <div class="modal">
        <button class="close" id="lp1Close" type="button">×</button>
        <div class="sub">PARTNER PROFILE</div>
        <h3 class="modal-h">상대방 출생정보</h3>
        <p class="cpv4-note" style="font-size:9.6px;line-height:1.5;color:var(--dim);margin:0 0 6px">이 기기에만 저장돼. '리딩에 연결'한 사람 한 명의 명식이 리딩 프롬프트에 보조 자료로 들어가.</p>
        <div class="lp1-list" id="lp1List"></div>
        <div class="sub" id="lp1FormTitle" style="margin-top:6px">새 사람 추가</div>
        <input type="hidden" id="lp1Id">
        <div class="lp1-row">
          <div class="field"><label>이름/호칭</label><input type="text" id="lp1Name" maxlength="30" placeholder="예: 진"></div>
          <div class="field"><label>관계</label><input type="text" id="lp1Relation" maxlength="30" placeholder="예: 썸, 전 연인"></div>
        </div>
        <div class="lp1-row">
          <div class="field"><label>생년월일</label><input type="date" id="lp1Date"></div>
          <div class="field"><label>출생시각</label><input type="time" id="lp1Time"></div>
        </div>
        <label class="lp1-check"><input type="checkbox" id="lp1Unknown"> 태어난 시간 모름</label>
        <div class="lp1-row">
          <div class="field"><label>출생지</label><input type="text" id="lp1Place" maxlength="60" placeholder="예: 광주"></div>
          <div class="field"><label>성별</label><select id="lp1Gender"><option value="">선택 안 함</option><option>남성</option><option>여성</option></select></div>
        </div>
        <div class="field"><label>메모 (선택)</label><input type="text" id="lp1Memo" maxlength="300" placeholder="리딩에 참고할 짧은 맥락"></div>
        <div class="lp1-form-actions">
          <button class="primary full-btn" id="lp1Save" type="button">저장 + 사주 계산</button>
          <button class="lp1-btn" id="lp1Reset" type="button">새로 입력</button>
        </div>
        <div class="lp1-status" id="lp1Status"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('pointerup', e => { if (e.target === el) close(); });
    $('lp1Close').onclick = close;
    $('lp1Unknown').onchange = () => { $('lp1Time').disabled = $('lp1Unknown').checked; if ($('lp1Unknown').checked) $('lp1Time').value = ''; };
    $('lp1Save').onclick = onSave;
    $('lp1Reset').onclick = () => fillForm(null);
    $('lp1List').addEventListener('click', onListClick);
  }

  function open(){
    ensureOverlay();
    renderList();
    fillForm(null);
    if (typeof W.showOverlay === 'function') W.showOverlay('partnerOverlay');
    else { $('partnerOverlay').classList.add('show'); $('partnerOverlay').setAttribute('aria-hidden','false'); }
  }
  function close(){
    if (typeof W.hideOverlay === 'function') W.hideOverlay('partnerOverlay');
    else { $('partnerOverlay').classList.remove('show'); $('partnerOverlay').setAttribute('aria-hidden','true'); }
  }

  function describe(p){
    const time = p.timeUnknown || !p.birthTime ? '시간 모름' : p.birthTime;
    const pillars = p.saju?.pillars
      ? ['year','month','day','hour'].map(k => p.saju.pillars[k]?.display).filter(Boolean).join(' ')
      : '사주 미계산';
    return `${p.birthDate || '날짜 없음'} ${time}${p.birthPlace ? ' · '+p.birthPlace : ''} · ${pillars}`;
  }

  function renderList(){
    const box = $('lp1List');
    if (!box) return;
    const s = load();
    if (!s.partners.length) { box.innerHTML = '<div class="lp1-empty">아직 저장된 사람이 없어.</div>'; return; }
    box.innerHTML = s.partners.map(p => {
      const on = p.id === s.activeId;
      return `<div class="lp1-item${on ? ' on' : ''}">
        <div><b>${esc(p.name || '이름 없음')}${p.relation ? ` · ${esc(p.relation)}` : ''}</b><small>${esc(describe(p))}</small></div>
        <div class="lp1-actions">
          <button type="button" data-act="toggle" data-id="${esc(p.id)}" class="${on ? 'on' : ''}">${on ? '연결됨' : '리딩에 연결'}</button>
          <button type="button" data-act="edit" data-id="${esc(p.id)}">수정</button>
          <button type="button" data-act="delete" data-id="${esc(p.id)}">삭제</button>
        </div></div>`;
    }).join('');
  }

  function fillForm(p){
    $('lp1Id').value = p?.id || '';
    $('lp1Name').value = p?.name || '';
    $('lp1Relation').value = p?.relation || '';
    $('lp1Date').value = p?.birthDate || '';
    $('lp1Time').value = p?.birthTime || '';
    $('lp1Unknown').checked = !!p?.timeUnknown;
    $('lp1Time').disabled = !!p?.timeUnknown;
    $('lp1Place').value = p?.birthPlace || '';
    $('lp1Gender').value = p?.gender || '';
    $('lp1Memo').value = p?.memo || '';
    $('lp1FormTitle').textContent = p ? `수정 중 · ${p.name || '이름 없음'}` : '새 사람 추가';
    status('');
  }

  function status(text, kind=''){
    const el = $('lp1Status');
    if (el) { el.textContent = text; el.className = `lp1-status ${kind}`.trim(); }
  }

  function onListClick(e){
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const s = load();
    const p = s.partners.find(x => x.id === id);
    if (!p) return;
    if (btn.dataset.act === 'toggle') {
      s.activeId = s.activeId === id ? '' : id;
      save(s); renderList(); syncStrip();
    } else if (btn.dataset.act === 'edit') {
      fillForm(p);
    } else if (btn.dataset.act === 'delete') {
      if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = '정말 삭제'; return; }
      s.partners = s.partners.filter(x => x.id !== id);
      if (s.activeId === id) s.activeId = '';
      save(s); renderList(); syncStrip();
      if ($('lp1Id').value === id) fillForm(null);
    }
  }

  async function onSave(){
    const name = $('lp1Name').value.trim();
    const birthDate = $('lp1Date').value;
    const timeUnknown = $('lp1Unknown').checked;
    const birthTime = timeUnknown ? '' : $('lp1Time').value;
    if (!name) return status('이름이나 호칭을 넣어줘.', 'err');
    if (!birthDate) return status('생년월일을 넣어줘.', 'err');
    if (!timeUnknown && !birthTime) return status("출생시각을 넣거나 '태어난 시간 모름'을 체크해줘.", 'err');

    const s = load();
    const id = $('lp1Id').value || `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
    const prev = s.partners.find(x => x.id === id);
    const partner = {
      id, name,
      relation:$('lp1Relation').value.trim(),
      gender:$('lp1Gender').value,
      birthDate, birthTime, timeUnknown,
      birthPlace:$('lp1Place').value.trim(),
      memo:$('lp1Memo').value.trim(),
      saju:null,
      createdAt:prev?.createdAt || new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    const sameBirth = prev && prev.birthDate === birthDate && prev.birthTime === birthTime && !!prev.timeUnknown === timeUnknown && prev.birthPlace === partner.birthPlace;
    if (sameBirth) partner.saju = prev.saju;

    // Save first so nothing is lost if the server is slow or down.
    s.partners = prev ? s.partners.map(x => x.id === id ? partner : x) : [...s.partners, partner];
    if (!s.activeId) s.activeId = id;
    save(s); renderList(); syncStrip();
    $('lp1Id').value = id;
    $('lp1FormTitle').textContent = `수정 중 · ${name}`;

    if (partner.saju || !partner.birthPlace) {
      return status(partner.birthPlace ? '저장 완료.' : '저장 완료. 출생지를 넣으면 사주도 계산할 수 있어.', 'ok');
    }
    const btn = $('lp1Save');
    btn.disabled = true;
    status(timeUnknown ? '저장 완료 · 시간 모름이라 두 시점으로 사주를 계산 중… (서버가 자고 있으면 1분쯤 걸려)' : '저장 완료 · 사주 계산 중… (서버가 자고 있으면 1분쯤 걸려)');
    try {
      const saju = await calcSaju(partner);
      const s2 = load();
      s2.partners = s2.partners.map(x => x.id === id ? {...x, saju} : x);
      save(s2); renderList();
      const note = saju.mode === 'range' && saju.unstable?.length ? ` · 경계일이라 ${saju.unstable.map(k => LABEL[k]).join(', ')} 미확정` : '';
      status(`저장 + 사주 계산 완료${saju.mode === 'range' ? ' (시주 제외)' : ''}${note}`, 'ok');
    } catch (err) {
      status(`저장은 됐고, 사주 계산은 실패했어: ${err?.name === 'AbortError' ? '서버 응답 시간 초과' : (err?.message || err)}. 다시 저장을 누르면 재시도해.`, 'err');
    } finally {
      btn.disabled = false;
    }
  }

  function syncStrip(){
    const tags = document.querySelector('#profileStrip .profile-tags');
    const p = active();
    let tag = $('partnerStripTag');
    if (!tags) return;
    if (!p) { tag?.remove(); return; }
    if (!tag) {
      tag = document.createElement('span');
      tag.className = 'tag';
      tag.id = 'partnerStripTag';
      tag.addEventListener('click', e => { e.stopPropagation(); open(); });
      tags.appendChild(tag);
    }
    tag.textContent = `💞 ${p.name || '상대'}`;
  }

  function ensureButton(){
    const actions = document.querySelector('header .head-actions');
    if (!actions) return false;
    if (!$('partnerBtn')) {
      const b = document.createElement('button');
      b.className = 'icon-btn';
      b.id = 'partnerBtn';
      b.type = 'button';
      b.title = '상대방 출생정보';
      b.setAttribute('aria-label','상대방 출생정보');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="8" r="3.2"/><path d="M2.8 20a5.3 5.3 0 0 1 10.4 0"/><path d="M16.5 19.8c-2.6-1.6-3.7-2.9-3.7-4.3a1.9 1.9 0 0 1 3.7-.6 1.9 1.9 0 0 1 3.7.6c0 1.4-1.1 2.7-3.7 4.3Z"/></svg>';
      b.onclick = open;
      const profileBtn = $('profileBtn');
      actions.classList.add('lp1-four');
      if (profileBtn) profileBtn.insertAdjacentElement('afterend', b);
      else actions.appendChild(b);
    }
    return true;
  }

  W.LUNEA_PARTNER_PROFILE_V1 = {
    version:1, marker:MARKER, storeKey:STORE_KEY,
    load, active, promptBlock, policyLine, sunSign, thaiDay, open
  };

  function boot(){
    addStyles();
    if (!ensureButton()) return false;
    syncStrip();
    return true;
  }
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if (!boot()) setTimeout(boot, 300); }, {once:true});
  else if (!boot()) setTimeout(boot, 300);
})();
