'use strict';

/*
  LUNEA SHARE LINKS V1
  ====================
  Header button that shares the web app addresses with a friend.
  - LUNEA: the address this page is actually served from (always current).
  - Thai/Vedic astrology app: the separate GitHub Pages site.
  Uses the native share sheet when the phone offers one, otherwise copies.
*/
(() => {
  const W = window;
  if (W.__LUNEA_SHARE_LINKS_V1__) return;
  W.__LUNEA_SHARE_LINKS_V1__ = true;

  const $ = id => document.getElementById(id);

  function luneaUrl(){
    try {
      const u = new URL(W.location.href);
      return `${u.origin}${u.pathname.replace(/index\.html$/,'')}`;
    } catch { return 'https://cozysso-afk.github.io/lunea/'; }
  }

  const APPS = () => [
    {
      id:'lunea',
      title:'LUNEA',
      desc:'타로 · 사주 · 태국 점성술 통합 리딩',
      text:'LUNEA — 타로·사주·점성술 리딩 웹앱이야. 열어서 공유 버튼 → "홈 화면에 추가"하면 앱처럼 쓸 수 있어.',
      url:luneaUrl()
    },
    {
      id:'thai',
      title:'태국 · 베딕 점성술',
      desc:'태국 점성술 시기별 운세',
      text:'태국·베딕 점성술 웹앱이야. "홈 화면에 추가"하면 앱처럼 쓸 수 있어.',
      url:'https://cozysso-afk.github.io/thai-vedic-astro-site/'
    }
  ];

  function addStyles(){
    if ($('luneaShareV1Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaShareV1Style';
    s.textContent = `
      .ls1-list{display:grid;gap:8px;margin:10px 0 8px}
      .ls1-item{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:11px 12px;border-radius:14px;border:1px solid rgba(189,164,248,.2);background:rgba(255,255,255,.04)}
      .ls1-item b{font-size:12.5px;color:var(--text)}
      .ls1-item small{display:block;font-size:9.6px;color:var(--dim);margin-top:2px;word-break:break-all}
      .ls1-item button{border:1px solid rgba(189,164,248,.3);background:linear-gradient(135deg,rgba(189,164,248,.18),rgba(127,222,211,.14));color:var(--text);border-radius:11px;padding:9px 11px;font-size:10.5px;font-weight:800;cursor:pointer;touch-action:manipulation;white-space:nowrap}
      .ls1-note{font-size:9.6px;line-height:1.55;color:var(--dim);margin:6px 0 0}
      .ls1-status{font-size:9.8px;color:#bfe7d2;min-height:14px;margin-top:6px}
      .engine-strip.ls1-has-share{display:flex!important;align-items:center;gap:8px}
      .engine-strip.ls1-has-share > span:not(.engine-dot){flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #shareAppBtn{flex-shrink:0;display:inline-flex;align-items:center;gap:4px;border:1px solid rgba(213,217,236,.18);background:rgba(255,255,255,.05);color:#d9dbe7;border-radius:999px;padding:4px 9px;font:700 9.5px/1 'Pretendard',sans-serif;cursor:pointer;touch-action:manipulation}
      #shareAppBtn svg{width:11px;height:11px}
    `;
    document.head.appendChild(s);
  }

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function ensureOverlay(){
    if ($('shareOverlay')) return;
    const el = document.createElement('div');
    el.className = 'overlay profile-modal';
    el.id = 'shareOverlay';
    el.setAttribute('aria-hidden','true');
    el.innerHTML = `
      <div class="modal">
        <button class="close" id="ls1Close" type="button">×</button>
        <div class="sub">SHARE</div>
        <h3 class="modal-h">친구에게 웹앱 공유</h3>
        <div class="ls1-list">${APPS().map(a => `
          <div class="ls1-item">
            <div><b>${esc(a.title)}</b><small>${esc(a.desc)}<br>${esc(a.url)}</small></div>
            <button type="button" data-share="${esc(a.id)}">공유</button>
          </div>`).join('')}
        </div>
        <p class="ls1-note">친구 기기에서는 프로필·기록·상대방 정보가 따로 저장돼서 내 데이터는 보이지 않아. LUNEA의 AI 해석은 친구가 ⚙️ API에 자기 Gemini API 키를 넣어야 돌아가고, 키가 없어도 프롬프트 복사는 쓸 수 있어.</p>
        <div class="ls1-status" id="ls1Status"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('pointerup', e => { if (e.target === el) close(); });
    $('ls1Close').onclick = close;
    el.querySelector('.ls1-list').addEventListener('click', e => {
      const b = e.target.closest('button[data-share]');
      if (b) share(b.dataset.share);
    });
  }

  async function copy(text){
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly',''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }

  async function share(id){
    const app = APPS().find(a => a.id === id);
    if (!app) return;
    const st = $('ls1Status');
    if (navigator.share) {
      try { await navigator.share({title:app.title, text:app.text, url:app.url}); if (st) st.textContent = ''; return; }
      catch (err) { if (err?.name === 'AbortError') return; }
    }
    const ok = await copy(`${app.text}\n${app.url}`);
    if (st) st.textContent = ok ? `${app.title} 주소를 복사했어. 카톡에 붙여넣으면 돼.` : `복사가 안 됐어. 주소: ${app.url}`;
  }

  function open(){
    ensureOverlay();
    const st = $('ls1Status'); if (st) st.textContent = '';
    if (typeof W.showOverlay === 'function') W.showOverlay('shareOverlay');
    else { $('shareOverlay').classList.add('show'); $('shareOverlay').setAttribute('aria-hidden','false'); }
  }
  function close(){
    if (typeof W.hideOverlay === 'function') W.hideOverlay('shareOverlay');
    else { $('shareOverlay').classList.remove('show'); $('shareOverlay').setAttribute('aria-hidden','true'); }
  }

  // Lives on the engine status row: the header already holds four buttons
  // and a fifth pushes into the brand subtitle on phones.
  function ensureButton(){
    const host = document.querySelector('.engine-strip');
    if (!host) return false;
    if (!$('shareAppBtn')) {
      const b = document.createElement('button');
      b.id = 'shareAppBtn';
      b.type = 'button';
      b.title = '친구에게 공유';
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.7 7.4-4.4M8.3 13.3l7.4 4.4"/></svg><span>공유</span>';
      b.addEventListener('click', e => { e.stopPropagation(); open(); });
      host.classList.add('ls1-has-share');
      host.appendChild(b);
    }
    return true;
  }

  W.LUNEA_SHARE_LINKS_V1 = {version:1, apps:APPS, open, share};

  function boot(){ addStyles(); return ensureButton(); }
  // Theme modules may rebuild the engine row after boot; put the button back.
  let tries = 0;
  const keep = setInterval(() => { tries += 1; if (typeof document !== 'undefined') ensureButton(); if (tries > 40) clearInterval(keep); }, 250);
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if (!boot()) setTimeout(boot, 300); }, {once:true});
  else if (!boot()) setTimeout(boot, 300);
})();
