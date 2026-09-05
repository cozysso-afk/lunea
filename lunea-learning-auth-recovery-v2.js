'use strict';

/* LUNEA LEARNING AUTH RECOVERY V2
   Adds a safe password-recovery path on top of the existing private learning sync UI.
   No existing learning/session semantics are removed.
*/
(() => {
  const W = window;
  if (W.__LUNEA_LEARNING_AUTH_RECOVERY_V2__) return;
  W.__LUNEA_LEARNING_AUTH_RECOVERY_V2__ = true;

  const URL = 'https://safcnvwojjthhursiers.supabase.co';
  const KEY = 'sb_publishable_NQ0pSTq8gE8JrKDrIyXJww_HTapFg_x';
  const SESSION_KEY = 'LUNEA_SUPABASE_SESSION_V1';
  const $ = id => document.getElementById(id);
  const clean = v => String(v || '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function setMessage(text, isError = false) {
    const el = $('luneaLearningSyncMessage');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('error', !!isError);
  }

  function currentEmail() {
    return clean($('luneaLearningEmail')?.value || '');
  }

  async function jsonRequest(url, options = {}) {
    const res = await fetch(url, options);
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const msg = clean(data?.msg || data?.message || data?.error_description || data?.error || `HTTP ${res.status}`);
      throw new Error(msg || '요청에 실패했어.');
    }
    return data;
  }

  function authHeaders(token) {
    const h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }

  function redirectTarget() {
    return `${location.origin}${location.pathname}`;
  }

  async function sendRecovery() {
    const email = currentEmail();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage('비밀번호를 재설정할 이메일을 먼저 확인해줘.', true);
      return;
    }
    const btn = $('luneaLearningResetPassword');
    if (btn) btn.disabled = true;
    setMessage('비밀번호 재설정 메일을 보내는 중…');
    try {
      const redirect = encodeURIComponent(redirectTarget());
      await jsonRequest(`${URL}/auth/v1/recover?redirect_to=${redirect}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email })
      });
      setMessage('재설정 메일을 보냈어. 메일의 링크를 이 기기에서 열고 새 비밀번호를 정해줘.');
    } catch (e) {
      setMessage(`재설정 메일 전송 실패 · ${e.message || e}`, true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function addRecoveryButton() {
    const signedOut = $('luneaLearningSignedOut');
    const actions = $('luneaLearningAuthActions');
    if (!signedOut || !actions || $('luneaLearningResetPassword')) return false;

    const wrap = document.createElement('div');
    wrap.id = 'luneaLearningRecoveryActionsV2';
    wrap.style.cssText = 'display:flex;justify-content:flex-end;margin-top:8px';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'luneaLearningResetPassword';
    btn.className = 'mini';
    btn.textContent = '비밀번호 재설정 메일';
    btn.addEventListener('click', sendRecovery);
    wrap.appendChild(btn);
    actions.insertAdjacentElement('afterend', wrap);
    return true;
  }

  function saveSessionFromHash(params) {
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    if (!access || !refresh) return null;
    const expiresIn = Number(params.get('expires_in') || 3600);
    const session = {
      access_token: access,
      refresh_token: refresh,
      expires_at: Date.now() + Math.max(60, expiresIn) * 1000,
      user: null
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async function updatePassword(accessToken, password) {
    return jsonRequest(`${URL}/auth/v1/user`, {
      method: 'PUT',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ password })
    });
  }

  function showResetPrompt(accessToken) {
    let overlay = $('luneaLearningPasswordResetOverlayV2');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'luneaLearningPasswordResetOverlayV2';
      overlay.className = 'overlay profile-modal show';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <button class="close" id="luneaLearningPasswordResetCloseV2">×</button>
          <div class="sub">PRIVATE LEARNING SYNC</div>
          <h3 class="modal-h">새 비밀번호 설정</h3>
          <div class="field"><label>새 비밀번호</label><input type="password" id="luneaLearningNewPasswordV2" autocomplete="new-password" placeholder="6자 이상"></div>
          <div class="field"><label>새 비밀번호 확인</label><input type="password" id="luneaLearningNewPasswordConfirmV2" autocomplete="new-password" placeholder="한 번 더 입력"></div>
          <button class="primary full-btn" id="luneaLearningSavePasswordV2">새 비밀번호 저장</button>
          <div id="luneaLearningPasswordResetMessageV2" style="margin-top:9px;font-size:10px;color:var(--dim)"></div>
        </div>`;
      document.body.appendChild(overlay);
    } else {
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');

    const msg = $('luneaLearningPasswordResetMessageV2');
    const close = () => {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
    };
    $('luneaLearningPasswordResetCloseV2').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };
    $('luneaLearningSavePasswordV2').onclick = async () => {
      const a = String($('luneaLearningNewPasswordV2')?.value || '');
      const b = String($('luneaLearningNewPasswordConfirmV2')?.value || '');
      if (a.length < 6) { if (msg) msg.textContent = '새 비밀번호는 6자 이상이어야 해.'; return; }
      if (a !== b) { if (msg) msg.textContent = '두 비밀번호가 서로 달라.'; return; }
      const button = $('luneaLearningSavePasswordV2');
      button.disabled = true;
      if (msg) msg.textContent = '저장 중…';
      try {
        const user = await updatePassword(accessToken, a);
        const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        if (raw && user?.id) {
          raw.user = { id: user.id, email: user.email || '' };
          localStorage.setItem(SESSION_KEY, JSON.stringify(raw));
        }
        if (msg) msg.textContent = '비밀번호를 바꿨어. 이제 이 계정으로 로그인할 수 있어.';
        history.replaceState(null, '', `${location.pathname}${location.search}`);
        setTimeout(() => location.reload(), 700);
      } catch (e) {
        if (msg) msg.textContent = `저장 실패 · ${e.message || e}`;
        button.disabled = false;
      }
    };
  }

  async function consumeRecoveryHash() {
    if (!location.hash || !/access_token=/.test(location.hash)) return;
    const params = new URLSearchParams(location.hash.slice(1));
    const type = clean(params.get('type')).toLowerCase();
    const session = saveSessionFromHash(params);
    if (!session) return;
    if (type === 'recovery') {
      showResetPrompt(session.access_token);
    } else {
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      setTimeout(() => location.reload(), 100);
    }
  }

  function improveInvalidCredentialsMessage() {
    const el = $('luneaLearningSyncMessage');
    if (!el || el.__luneaRecoveryObservedV2) return;
    el.__luneaRecoveryObservedV2 = true;
    new MutationObserver(() => {
      if (/Invalid login credentials/i.test(el.textContent || '')) {
        el.textContent = '로그인 실패 · 계정은 이미 존재하지만 지금 입력한 비밀번호가 일치하지 않아. 아래 비밀번호 재설정을 사용해줘.';
        el.classList.add('error');
      }
    }).observe(el, { childList: true, subtree: true, characterData: true });
  }

  function install() {
    addRecoveryButton();
    improveInvalidCredentialsMessage();
  }

  function boot() {
    install();
    consumeRecoveryHash().catch(e => console.warn('[LUNEA Auth Recovery V2] recovery hash failed', e));
    const observer = new MutationObserver(install);
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
    [250, 800, 1800, 3500].forEach(ms => setTimeout(install, ms));
    console.info('🔐 LUNEA learning auth recovery V2 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
