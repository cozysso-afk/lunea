/* Final presentation is installed before the lazy entry click is replayed. */
(() => {
  'use strict';
  const W=window, E=W.LUNEA_MESSAGE_ORACLE_V1;
  if(W.LUNEA_MESSAGE_ORACLE_UI_V1) return;
  if(!E) throw new Error('Message Oracle engine unavailable');
  const deck=typeof TAROT_DECK!=='undefined'?TAROT_DECK:[];
  if(deck.length!==78 || E.cards.some(c=>!E.identity(c.code,deck))) throw new Error('Canonical Tarot identities unavailable');
  const style=document.createElement('style'); style.id='luneaMessageOracleStyle';
  style.textContent=`
    body.lunea-message-open{overflow:hidden}
    #luneaMessageOracleOverlay{position:fixed;inset:0;z-index:10050;background:rgba(9,7,18,.76);padding:12px;display:none;align-items:center;justify-content:center;overscroll-behavior:contain}
    #luneaMessageOracleOverlay[data-open="true"]{display:flex}
    #luneaMessageOracleOverlay,#luneaMessageOracleOverlay *{box-sizing:border-box;min-width:0}
    #luneaMessageOracleOverlay .mo-sheet{width:100%;max-width:470px;max-height:calc(100dvh - 24px);overflow-y:auto;overscroll-behavior:contain;border:1px solid #ad96bd;border-radius:23px;padding:20px;background:linear-gradient(155deg,#f4eee9,#e9e2f0);color:#393140;box-shadow:0 20px 70px #0005;text-align:left}
    #luneaMessageOracleOverlay .mo-header{display:flex;align-items:start;gap:12px;justify-content:space-between}
    #luneaMessageOracleOverlay .mo-kicker{font-size:10px;letter-spacing:1.7px;color:#756079;font-weight:700}
    #luneaMessageOracleOverlay h2{font:600 20px/1.45 'Noto Serif KR',serif;margin:8px 0}
    #luneaMessageOracleOverlay .mo-sub{font-size:11px;line-height:1.6;color:#716673;margin:0 0 17px}
    #luneaMessageOracleOverlay button{font:600 12px/1.45 'Noto Sans KR',sans-serif;color:#514050;background:#fff8;border:1px solid #b7a3b8;border-radius:11px;padding:10px 12px;min-height:42px;white-space:normal;overflow-wrap:anywhere;cursor:pointer}
    #luneaMessageOracleOverlay button:focus-visible,#luneaMessageOracleOverlay textarea:focus-visible{outline:2px solid #80658c;outline-offset:2px}
    #luneaMessageOracleOverlay button:active{background:#ddd0e5}
    #luneaMessageOracleOverlay .mo-close{flex:0 0 40px;font-size:23px;padding:2px}
    #luneaMessageOracleOverlay label{display:block;font-size:13px;font-weight:650;margin-bottom:7px;color:#493d51}
    #luneaMessageOracleOverlay textarea{display:block;width:100%;max-width:100%;min-height:88px;resize:vertical;font-size:16px;line-height:1.5;padding:11px;border:1px solid #b5a6b9;border-radius:12px;color:#393140;background:#fff9}
    #luneaMessageOracleOverlay .mo-chips{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0 13px}
    #luneaMessageOracleOverlay .mo-chips button{padding:7px 9px;min-height:36px;font-size:11px}
    #luneaMessageOracleOverlay .mo-chips button[aria-pressed="true"]{background:#705779;color:#fff;border-color:#705779}
    #luneaMessageOracleOverlay .mo-context{font-size:11px;margin-top:9px;color:#705a75}
    #luneaMessageOracleOverlay .mo-primary{width:100%;background:linear-gradient(110deg,#796184,#5c506e);color:#fff;border-color:#796184}
    #luneaMessageOracleOverlay .mo-result{margin-top:18px;padding:17px;border:1px solid #b89e68;outline:1px solid #c7b681;outline-offset:-6px;border-radius:18px;background:linear-gradient(145deg,#fffaf0,#f4edf4);color:#423949}
    #luneaMessageOracleOverlay .mo-scoreline{display:flex;gap:12px;justify-content:space-between;align-items:center;color:#776041;font-size:11px}
    #luneaMessageOracleOverlay .mo-score{font:600 35px/1.1 'Noto Serif KR',serif;color:#775b7b}
    #luneaMessageOracleOverlay .mo-identity{font-size:14px;line-height:1.6;margin:12px 0;text-align:center}
    #luneaMessageOracleOverlay .mo-image{display:block;width:112px;max-width:100%;height:auto;margin:0 auto 13px;object-fit:contain;filter:none;border-radius:5px}
    #luneaMessageOracleOverlay .mo-message{font:500 14px/1.8 'Noto Serif KR',serif;margin:13px 0;overflow-wrap:anywhere}
    #luneaMessageOracleOverlay .mo-detail-label{font-size:10px;letter-spacing:1.8px;color:#846e4c;margin-top:15px}
    #luneaMessageOracleOverlay .mo-details{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 12px}
    #luneaMessageOracleOverlay .mo-details span{font-size:11px;line-height:1.6;padding:4px 7px;border:1px solid #c7b89b;border-radius:7px;background:#fff6}
    #luneaMessageOracleOverlay .mo-note{font-size:11px;line-height:1.65;color:#746774;overflow-wrap:anywhere}
    #luneaMessageOracleOverlay .mo-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
    #luneaMessageOracleOverlay .mo-actions button{flex:1 1 95px}
    #luneaMessageOracleOverlay .mo-saved{margin-top:16px;font-size:12px}
    #luneaMessageOracleOverlay .mo-saved button{display:block;width:100%;text-align:left;margin-top:7px}
    #luneaMessageOracleOverlay [hidden]{display:none!important}
    #luneaMessageOracleOverlay .mo-status{font-size:12px;line-height:1.6;color:#72465e;margin:9px 0 0}
    @media(max-width:430px){#luneaMessageOracleOverlay .mo-sheet{padding:16px}#luneaMessageOracleOverlay .mo-result{padding:15px}}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement('div'); overlay.id='luneaMessageOracleOverlay';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','moTitle');overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<section class="mo-sheet" tabindex="-1"><div class="mo-header"><div><div class="mo-kicker">LUNEA · MESSAGE ORACLE</div><h2 id="moTitle">연락 · 소식 메시지 카드</h2></div><button class="mo-close" aria-label="닫기">×</button></div><p class="mo-sub">연애 · 재회 · 공적 결과 · 업무 · SNS · 지인 소식</p>
    <form class="mo-form"><label for="moQuestion">어떤 연락이나 소식이 궁금해?</label><textarea id="moQuestion" maxlength="2000" required placeholder="예: 회사에서 면접 결과를 알려줄까?"></textarea><div class="mo-context" aria-live="polite"></div><div class="mo-chips" role="group" aria-label="연락 맥락"></div><button class="mo-primary" type="submit">✉️ 메시지 카드 한 장 뽑기</button></form>
    <article class="mo-result" hidden aria-label="메시지 카드 결과"><div class="mo-scoreline"><span>카드 기반 연락 신호<br><span class="mo-level"></span></span><strong class="mo-score"></strong></div><h3 class="mo-identity"></h3><img class="mo-image" alt=""><p class="mo-message"></p><div class="mo-detail-label">KEY DETAILS</div><div class="mo-details"></div><p class="mo-result-context mo-note"></p><p class="mo-note">실제 확률이 아니라 카드 상징을 연락·소식 관점으로 환산한 지표</p></article>
    <div class="mo-actions" hidden><button data-action="copy">📋 결과 복사</button><button data-action="save">💾 저장</button><button data-action="redraw">↻ 다시 뽑기</button></div><div class="mo-actions"><button data-action="new">새 질문</button></div><p class="mo-status" role="status"></p><details class="mo-saved"><summary>이 기기에 저장한 메시지 카드</summary><div class="mo-saved-list"></div></details></section>`;
  document.body.appendChild(overlay);
  const $=s=>overlay.querySelector(s), question=$('#moQuestion'),chips=$('.mo-chips');
  let backing; try{backing=W.localStorage}catch{backing={getItem(){return null},setItem(){throw new Error('Storage unavailable')},removeItem(){throw new Error('Storage unavailable')}}}
  const store=E.storage(backing);
  let current=null, override='AUTO', returnFocus=null;
  const announce=text=>{$('.mo-status').textContent=text};
  for(const [code,label] of [['AUTO','자동'],...Object.entries(E.CONTEXTS)]){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.context=code;
    button.addEventListener('click',()=>{override=code;syncContext()});chips.appendChild(button);
  }
  function syncContext(){
    const context=E.resolveContext(question.value,override);
    $('.mo-context').textContent=`${override==='AUTO'?'AUTO CONTEXT · 자동 분류':'직접 선택'} · ${E.CONTEXTS[context]}`;
    chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.context===override)));
  }
  function render(){
    const d=E.describe(current);$('.mo-result').hidden=!d;$('.mo-actions').hidden=!d;$('.mo-form').hidden=!!d;
    if(!d) return;
    const id=E.identity(d.cardCode,deck);
    $('.mo-score').textContent=`${d.score}%`;$('.mo-level').textContent=d.signalLevel;
    $('.mo-identity').textContent=`${id.name} · 정방향`;
    const img=$('.mo-image');img.src=id.img;img.alt=id.name;
    $('.mo-message').textContent=d.message;
    $('.mo-details').replaceChildren(...d.card.keyDetails.map(t=>{const s=document.createElement('span');s.textContent=t;return s}));
    $('.mo-result-context').textContent=`질문: ${d.question}\n${E.CONTEXTS[d.context]} · ${d.contextMessage}`;
  }
  function renderSaved(){
    const list=$('.mo-saved-list');list.replaceChildren();
    for(const value of store.saved()){
      const b=document.createElement('button');b.textContent=`${E.CONTEXTS[value.context]} · ${value.question} · ${E.identity(value.cardCode,deck).name}`;
      b.addEventListener('click',()=>{current=value;question.value=value.question;override=value.context;syncContext();render();announce(store.remember(value)?'저장한 결과를 열었어요.':'결과는 열었지만 다시 열기 저장은 사용할 수 없어요.')});list.appendChild(b);
    }
    if(!list.children.length)list.textContent='아직 저장한 메시지 카드가 없어요.';
  }
  function commitDraw(q,context){
    try{current=E.draw(q,context);render();announce(store.remember(current)?'카드 한 장을 정방향으로 읽었어요.':'카드는 뽑았지만 이 기기에 저장하지 못했어요. 결과를 복사해 주세요.')}
    catch{announce('카드를 뽑지 못했어요. 질문과 브라우저의 보안 연결을 확인해 주세요.')}
  }
  question.addEventListener('input',syncContext);
  $('.mo-form').addEventListener('submit',e=>{e.preventDefault();if(!question.value.trim()){announce('궁금한 연락이나 소식을 입력해 주세요.');question.focus();return}commitDraw(question.value,override)});
  $('[data-action="redraw"]').addEventListener('click',()=>{if(current&&W.confirm('같은 질문으로 새 카드를 다시 뽑을까?'))commitDraw(current.question,current.context)});
  $('[data-action="new"]').addEventListener('click',()=>{const cleared=store.clear();current=null;question.value='';override='AUTO';syncContext();render();announce(cleared?'': '현재 화면은 초기화했지만 기기 저장소를 지우지 못했어요.');question.focus()});
  $('[data-action="save"]').addEventListener('click',()=>{announce(store.save(current)?'이 기기의 메시지 카드 목록에 저장했어요.':'저장 공간을 사용할 수 없어요. 결과를 복사해 주세요.');renderSaved()});
  $('[data-action="copy"]').addEventListener('click',async()=>{try{await W.navigator.clipboard.writeText(E.copyText(current,deck));announce('결과를 복사했어요.')}catch{announce('복사를 허용하지 않은 브라우저예요. 결과 텍스트를 선택해 복사해 주세요.')}});
  function open(){
    returnFocus=document.activeElement;current=current||store.last();
    if(current){question.value=current.question;override=current.context}
    syncContext();render();renderSaved();announce('');document.body.classList.add('lunea-message-open');overlay.dataset.open='true';overlay.setAttribute('aria-hidden','false');$('.mo-sheet').focus();
  }
  function close(){document.body.classList.remove('lunea-message-open');delete overlay.dataset.open;overlay.setAttribute('aria-hidden','true');returnFocus?.focus?.()}
  $('.mo-close').addEventListener('click',close);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  overlay.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();close()}
    if(e.key==='Tab'){
      const focusable=[...overlay.querySelectorAll('button,textarea,summary')].filter(el=>el.getClientRects().length&&!el.disabled);
      const first=focusable[0],last=focusable.at(-1);
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('.mo-sheet'))){e.preventDefault();last?.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    }
  });
  document.getElementById('luneaMessageOracleEntry').addEventListener('click',open);
  W.LUNEA_MESSAGE_ORACLE_UI_V1=Object.freeze({open,close});
})();
