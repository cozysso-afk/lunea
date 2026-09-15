/* Exact-reading Message Oracle adapter. No deck, storage or calculation fork. */
(() => {
  'use strict';
  const W = window;
  if (W.LUNEA_MESSAGE_ORACLE_SUPPORT_V1) return;
  const registry = W.LUNEA_READING_ATTACHMENTS_V1;
  if (!registry) throw new Error('Reading attachments unavailable');
  const BUTTON_ID = 'luneaMessageOracleSupportBtn';
  const LOGO_SRC = './assets/message-oracle/message_oracle_logo.png?v=101';
  let saved = null, opening = 0;
  const engine = () => W.LUNEA_MESSAGE_ORACLE_V1;
  function reading() {
    try { return W.state || state || null; } catch { return W.state || null; }
  }
  function identity() {
    const value = reading();
    if (!value?.drawn?.length || !String(value.question || '').trim()) return null;
    return {signature:registry.signature(value), question:String(value.question)};
  }
  function capture() {
    const active = identity();
    return active && saved?.readingSignature === active.signature ? saved : null;
  }
  function clear() {
    ++opening;
    saved = null;
    document.getElementById('luneaMessageOracleInline')?.remove();
    W.LUNEA_MESSAGE_ORACLE_UI_V1?.closeSupport?.();
  }
  function sync() {
    if (saved && !capture()) clear();
  }
  function promptBlock() {
    const value = capture();
    const result = value && engine()?.interpret(value);
    if (!result) return '';
    return ['[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조]',
      '질문: ' + value.question,
      '맥락: ' + result.contextLabel,
      '질문 의도: ' + (engine().INTENTS[result.intent] || result.intent),
      '카드: ' + names(value.cardCode) + ' · 정방향',
      '카드 기반 연락·소식 전달 신호: ' + result.score + '%',
      result.fullMessage || result.shortMessage,
      ...(result.details || []).map(item => item.label + ': ' + item.value),
      '※ 이 점수는 실제 통계 확률이나 합격·승인·긍정 결과 확률이 아니다.',
      '※ RWS 포지션을 바꾸지 말고 연락·소식 관점의 보조로만 참고한다. 다른 체계와 상충하면 차이를 명시한다.'
    ].join('\n');
  }
  function installPrompt() {
    const previous = W.promptString || (typeof promptString === 'function' ? promptString : null);
    if (typeof previous !== 'function' || previous.__luneaMessageSupportPrompt) return;
    const wrapped = function() {
      const original = previous.apply(this, arguments), block = promptBlock();
      return block ? original + '\n\n' + block : original;
    };
    wrapped.__luneaMessageSupportPrompt = true;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
  }
  function names(code) {
    const deck = typeof TAROT_DECK !== 'undefined' ? TAROT_DECK : [];
    return engine()?.identity(code, deck)?.name || code;
  }
  function renderInline() {
    const value = capture();
    if (!value) { document.getElementById('luneaMessageOracleInline')?.remove(); return; }
    const result = engine().interpret(value);
    const cards = document.getElementById('cards');
    if (!result || !cards?.parentNode) return;
    let node = document.getElementById('luneaMessageOracleInline');
    if (!node) {
      node = document.createElement('button');
      node.id = 'luneaMessageOracleInline';
      node.type = 'button';
      node.addEventListener('click', open);
      cards.parentNode.insertBefore(node, cards.nextSibling);
    }
    const logo = document.createElement('img');
    logo.src = LOGO_SRC;
    logo.alt = '';
    const text = document.createElement('span');
    const heading = document.createElement('small');
    heading.textContent = 'LUNEA MESSAGE SIGNAL';
    const title = document.createElement('b');
    title.textContent = names(value.cardCode) + ' · 연락·소식 신호 ' + result.score + '%';
    const message = document.createElement('span');
    message.textContent = result.shortMessage;
    const context = document.createElement('small');
    context.textContent = result.contextLabel + ' · ' + engine().INTENTS[result.intent] + ' · 결과 성공 확률 아님';
    text.appendChild(heading); text.appendChild(title); text.appendChild(message); text.appendChild(context);
    node.replaceChildren(logo, text);
    W.LUNEA_READING_ACTION_ORDER_V33?.reorder?.();
  }
  function accept(result, expected) {
    const active = identity();
    if (!active || active.signature !== expected.signature || result.question !== active.question.trim()) return false;
    const valid = engine().describe(result);
    if (!valid) return false;
    saved = {version:1, mode:'support', readingSignature:active.signature, question:active.question,
      context:valid.context, cardCode:valid.cardCode, score:valid.score, createdAt:valid.createdAt};
    registry.notifyChanged('messageOracle');
    renderInline();
    return true;
  }
  function restore(value) {
    const active = identity();
    if (!active || value?.mode !== 'support' || value.version !== 1 ||
      value.readingSignature !== active.signature || value.question !== active.question ||
      !engine()?.describe(value)) return false;
    saved = {...value};
    renderInline();
    return true;
  }
  async function open() {
    const active = identity(), request = ++opening;
    if (!active) return false;
    if (!await W.LUNEA_LOAD_FEATURE_GROUP('message')) return false;
    if (request !== opening || identity()?.signature !== active.signature) return false;
    return W.LUNEA_MESSAGE_ORACLE_UI_V1.openSupport({
      question:active.question, result:capture(),
      isCurrent:() => identity()?.signature === active.signature,
      onResult:result => accept(result, active)
    });
  }
  registry.register('messageOracle', {group:'message', capture, restore, clear,
    toArchive:value => {
      const result = engine()?.interpret(value);
      return result ? {...value, cardName:names(value.cardCode), intent:result.intent,
        contextLabel:result.contextLabel, shortMessage:result.shortMessage,
        fullMessage:result.fullMessage, details:result.details} : null;
    }});
  const style = document.createElement('style');
  style.id = 'luneaMessageSupportStyle';
  style.textContent = '#luneaMessageOracleInline{display:flex;align-items:center;gap:10px;width:100%;max-width:400px;min-width:0;box-sizing:border-box;margin:10px auto;padding:12px;text-align:left;white-space:normal;border:1px solid #a68aae55;border-radius:14px;background:#231d31;color:#eee4f1;cursor:pointer}#luneaMessageOracleInline img{width:38px;height:38px;object-fit:contain;flex:0 0 38px;background:transparent}#luneaMessageOracleInline span{min-width:0;overflow-wrap:anywhere}#luneaMessageOracleInline small,#luneaMessageOracleInline b,#luneaMessageOracleInline span span{display:block;line-height:1.45;margin:0}#luneaMessageOracleInline small{font-size:10px;color:#baabc9}#luneaMessageOracleInline b{font-size:12px}#luneaMessageOracleInline span span{font-size:12px;margin:3px 0}#luneaMessageOracleSupportBtn{gap:5px!important}#luneaMessageOracleSupportBtn .lunea-message-oracle-mini-logo{width:20px!important;height:20px!important;object-fit:contain!important;flex:0 0 20px!important;background:transparent!important;pointer-events:none!important}#luneaMessageOracleSupportBtn .lunea-message-oracle-label{min-width:0!important;line-height:1.18!important}';
  document.head.appendChild(style);

  function decorateButton(button) {
    if (!button) return null;
    let logo = button.querySelector('.lunea-message-oracle-mini-logo');
    if (!logo) {
      logo = document.createElement('img');
      logo.className = 'lunea-message-oracle-mini-logo';
      logo.alt = '';
      logo.src = LOGO_SRC;
    }
    let label = button.querySelector('.lunea-message-oracle-label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'lunea-message-oracle-label';
      label.textContent = '메시지 오라클';
    }
    if (button.childNodes.length !== 2 || button.firstChild !== logo || button.lastChild !== label) {
      button.replaceChildren(logo, label);
    }
    return button;
  }

  function ensureButton() {
    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (!bar) return null;
    let button = document.getElementById(BUTTON_ID);
    let created = false;
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = BUTTON_ID;
      button.className = 'mini';
      button.addEventListener('click', open);
      bar.appendChild(button);
      created = true;
    } else if (button.parentElement !== bar) {
      bar.appendChild(button);
    }
    decorateButton(button);
    if (created) W.LUNEA_READING_ACTION_ORDER_V33?.reorder?.();
    return button;
  }

  let ensureQueued = false;
  function queueEnsureButton() {
    if (ensureQueued) return;
    ensureQueued = true;
    queueMicrotask(() => {
      ensureQueued = false;
      const bar = document.querySelector('#spreadOverlay .actionbar');
      if (!bar) return;
      const button = document.getElementById(BUTTON_ID);
      if (!button || button.parentElement !== bar) ensureButton();
    });
  }

  ensureButton();
  const spread = document.getElementById('spreadOverlay');
  const actionbar = document.querySelector('#spreadOverlay .actionbar');
  if (spread) {
    new MutationObserver(() => {
      if (spread.classList.contains('show')) ensureButton();
    }).observe(spread, {attributes:true, attributeFilter:['class']});
  }
  if (actionbar) {
    new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID)) queueEnsureButton();
    }).observe(actionbar, {childList:true});
  }
  const root = document.body || document.documentElement;
  if (root) {
    new MutationObserver(mutations => {
      if (!mutations.some(mutation => mutation.type === 'childList' && (mutation.addedNodes.length || mutation.removedNodes.length))) return;
      queueEnsureButton();
    }).observe(root, {childList:true, subtree:true});
  }
  W.addEventListener('pageshow', ensureButton);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ensureButton(); });

  installPrompt();
  W.LUNEA_MESSAGE_ORACLE_SUPPORT_V1 = Object.freeze({open, capture, restore, sync, promptBlock, ensureButton});
})();
