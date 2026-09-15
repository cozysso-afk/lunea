/* Standalone Home entry for Message Oracle. Restores approved SIGNAL · MESSAGE surface. */
(() => {
  'use strict';
  const W = window;
  if (W.__LUNEA_MESSAGE_ORACLE_HOME_V1__) return;
  W.__LUNEA_MESSAGE_ORACLE_HOME_V1__ = true;

  const SECTION_ID = 'luneaSignalMessageSection';
  const ENTRY_ID = 'luneaMessageOracleEntry';
  const STATUS_ID = 'luneaMessageOracleLoadStatus';
  const LOGO_SRC = './assets/message-oracle/message_oracle_logo.png?v=101';

  function installStyle() {
    if (document.getElementById('luneaMessageOracleHomeV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaMessageOracleHomeV1Style';
    style.textContent = `
      #${SECTION_ID} .category-header{padding:24px 16px}
      #${SECTION_ID} .cat-left{min-width:0;gap:13px;align-items:center}
      #${SECTION_ID} .cat-text{min-width:0}
      #${SECTION_ID} .message-oracle-logo{display:block;object-fit:contain;background:transparent;filter:none}
      #${SECTION_ID} .message-oracle-home-logo{width:56px;height:56px;flex:0 0 56px}
      #${SECTION_ID} .cat-text h3{font-size:15.5px;line-height:1.25}
      #${SECTION_ID} .cat-text p{font-size:12px;line-height:1.35;margin-top:3px}
      #${SECTION_ID} .message-oracle-home-contexts{display:block;margin-top:3px;color:#aaa0b8;font-size:10.5px;line-height:1.35;white-space:normal;overflow-wrap:anywhere}
      #${SECTION_ID} .toggle{flex:0 0 auto}
      #${ENTRY_ID}{display:block;width:100%;max-width:100%;box-sizing:border-box;text-align:left;padding:12px;border-radius:13px;border:1px solid rgba(189,164,248,.22);background:rgba(189,164,248,.06);color:var(--text);white-space:normal}
      #${ENTRY_ID} strong,#${ENTRY_ID} span,#${ENTRY_ID} small{display:block;overflow-wrap:anywhere}
      #${ENTRY_ID} strong{font-size:13px;color:var(--moon)}
      #${ENTRY_ID} span{font-size:12px;margin:4px 0}
      #${ENTRY_ID} small{font-size:11px;line-height:1.55;color:var(--dim)}
      #${STATUS_ID}{margin:7px 0 2px;color:var(--dim);font-size:10.5px;line-height:1.45}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function setExpanded(section, expanded) {
    section.classList.toggle('active', expanded);
    const header = section.querySelector('.category-header');
    const toggle = section.querySelector('.toggle');
    header?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (toggle) toggle.textContent = expanded ? '×' : '+';
  }

  function bindHeader(section) {
    const header = section.querySelector('.category-header');
    if (!header || header.dataset.luneaMessageHomeBound === '1') return;
    header.dataset.luneaMessageHomeBound = '1';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', section.classList.contains('active') ? 'true' : 'false');
    const toggle = () => {
      const next = !section.classList.contains('active');
      document.querySelectorAll('.category.active').forEach(node => {
        if (node !== section) node.classList.remove('active');
      });
      setExpanded(section, next);
    };
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  }

  function bindEntry(section) {
    const entry = section.querySelector('#' + ENTRY_ID);
    if (!entry || entry.dataset.luneaMessageHomeBound === '1') return;
    entry.dataset.luneaMessageHomeBound = '1';
    entry.disabled = false;
    entry.addEventListener('click', async event => {
      // Once the lazy UI module exists it owns the click; avoid a double open.
      if (W.LUNEA_MESSAGE_ORACLE_UI_V1?.open) return;
      event.preventDefault();
      const status = document.getElementById(STATUS_ID);
      if (status) status.textContent = '메시지 오라클을 불러오는 중…';
      const ok = await W.LUNEA_LOAD_FEATURE_GROUP?.('message');
      const ui = W.LUNEA_MESSAGE_ORACLE_UI_V1;
      if (!ok || !ui?.open) {
        if (status) status.textContent = '메시지 오라클을 불러오지 못했어요. 다시 눌러 주세요.';
        return;
      }
      const ready = await ui.ready?.();
      if (ready === false) {
        if (status) status.textContent = '승인된 카드 이미지를 불러오지 못했어요. 다시 눌러 주세요.';
        return;
      }
      if (status) status.textContent = '';
      ui.open();
    });
  }

  function createSection() {
    const section = document.createElement('section');
    section.className = 'category';
    section.id = SECTION_ID;
    section.setAttribute('aria-label', 'SIGNAL · MESSAGE');
    section.innerHTML = `
      <div class="category-header">
        <div class="cat-left">
          <img class="message-oracle-logo message-oracle-home-logo" src="${LOGO_SRC}" alt="" aria-hidden="true" width="1254" height="1254">
          <div class="cat-text">
            <h3>SIGNAL · MESSAGE</h3>
            <p>연락 · 소식 · 응답</p>
            <small class="message-oracle-home-contexts">연애 · 재회 · 결과 · 업무 · SNS</small>
          </div>
        </div>
        <div class="toggle" aria-hidden="true">+</div>
      </div>
      <div class="category-content">
        <button id="${ENTRY_ID}" type="button">
          <strong>MESSAGE ORACLE</strong>
          <span>연락 · 소식 · 응답</span>
          <small>연애·재회·공적 결과·업무·SNS·지인 소식까지<br>한 장으로 빠르게 확인</small>
        </button>
        <p id="${STATUS_ID}" role="status"></p>
      </div>`;
    return section;
  }

  function ensure() {
    installStyle();
    let section = document.getElementById(SECTION_ID);
    if (!section) {
      const app = document.querySelector('.app');
      if (!app) return null;
      section = createSection();
      const categories = [...app.children].filter(node => node.classList?.contains('category'));
      const stock = categories.find(node => /STOCK\s*&\s*TRADING/i.test(node.textContent || ''));
      const anchor = stock || categories[categories.length - 1];
      if (anchor) anchor.insertAdjacentElement('afterend', section);
      else app.appendChild(section);
    }
    bindHeader(section);
    bindEntry(section);
    return section;
  }

  ensure();
  W.addEventListener('pageshow', ensure);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ensure(); });

  W.LUNEA_MESSAGE_ORACLE_HOME_V1 = Object.freeze({ensure});
})();