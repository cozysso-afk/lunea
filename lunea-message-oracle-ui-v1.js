/* Final presentation is installed before the lazy entry click is replayed. */
(() => {
  'use strict';
  const W=window, E=W.LUNEA_MESSAGE_ORACLE_V1;
  if(W.LUNEA_MESSAGE_ORACLE_UI_V1) return;
  if(!E) throw new Error('Message Oracle engine unavailable');
  const deck=typeof TAROT_DECK!=='undefined'?TAROT_DECK:[];
  if(deck.length!==78 || E.cards.some(c=>!E.identity(c.code,deck))) throw new Error('Canonical Tarot identities unavailable');
  // Design-locked JPEG originals; no crop, re-encoding, or color treatment.
  const ASSETS=Object.freeze({logo:'./assets/message-oracle/message_oracle_logo.png?v=101',front:'./assets/message-oracle/message_oracle_front_frame.jpeg?v=101',back:'./assets/message-oracle/message_oracle_back.jpeg?v=101',frontMask:'./assets/message-oracle/message_oracle_front_mask.png?v=101',backMask:'./assets/message-oracle/message_oracle_back_mask.png?v=101'});
  let assetsPromise;
  function ready(){
    if(!assetsPromise) assetsPromise=Promise.all(Object.values(ASSETS).map(src=>new Promise((resolve,reject)=>{
      const image=new Image(); const timeout=setTimeout(()=>reject(new Error('Artwork timeout')),12000);
      image.onload=async()=>{try{if(image.decode)await image.decode();clearTimeout(timeout);resolve(true)}catch(e){clearTimeout(timeout);reject(e)}};
      image.onerror=()=>{clearTimeout(timeout);reject(new Error('Artwork unavailable'))};image.src=src;
    }))).then(()=>true).catch(()=>{assetsPromise=null;return false});
    return assetsPromise;
  }
  const style=document.createElement('style'); style.id='luneaMessageOracleStyle';
  style.textContent=`
    body.lunea-message-open{overflow:hidden}
    #luneaMessageOracleOverlay{position:fixed;inset:0;z-index:10050;background:rgba(9,7,18,.76);padding:12px;display:none;align-items:center;justify-content:center;overscroll-behavior:contain}
    #luneaMessageOracleOverlay[data-open="true"]{display:flex}
    #luneaMessageOracleOverlay,#luneaMessageOracleOverlay *{box-sizing:border-box;min-width:0}
    #luneaMessageOracleOverlay .mo-sheet{width:100%;max-width:470px;max-height:calc(100dvh - 24px);overflow-y:auto;overscroll-behavior:contain;border:1px solid #ad96bd;border-radius:23px;padding:20px;background:linear-gradient(155deg,#f4eee9,#e9e2f0);color:#393140;box-shadow:0 20px 70px #0005;text-align:left}
    #luneaMessageOracleOverlay .mo-header{display:flex;align-items:start;gap:10px;justify-content:space-between}
    #luneaMessageOracleOverlay .mo-heading{display:flex;align-items:flex-start;gap:9px;flex:1}
    #luneaMessageOracleOverlay .mo-symbol{flex:0 0 36px;width:36px;height:36px;margin-top:0}
    #luneaMessageOracleOverlay .mo-heading-copy{flex:1}
    #luneaMessageOracleOverlay .mo-kicker{font-size:10px;letter-spacing:1.1px;color:#756079;font-weight:700}
    #luneaMessageOracleOverlay h2{font:600 19px/1.45 'Noto Serif KR',serif;margin:8px 0}
    #luneaMessageOracleOverlay .mo-sub{font-size:11px;line-height:1.6;color:#716673;margin:0 0 17px}
    #luneaMessageOracleOverlay button{font:600 12px/1.45 'Noto Sans KR',sans-serif;color:#514050;background:#f1eaf2;border:1px solid #b7a3b8;border-radius:11px;padding:10px 12px;min-height:42px;white-space:normal;overflow-wrap:anywhere;cursor:pointer}
    #luneaMessageOracleOverlay button:focus-visible,#luneaMessageOracleOverlay textarea:focus-visible{outline:2px solid #80658c;outline-offset:2px}
    #luneaMessageOracleOverlay button:active{background:#ddd0e5}
    #luneaMessageOracleOverlay .mo-close{flex:0 0 40px;font-size:23px;padding:2px}
    #luneaMessageOracleOverlay label{display:block;font-size:13px;font-weight:650;margin-bottom:7px;color:#493d51}
    #luneaMessageOracleOverlay textarea{display:block;width:100%;max-width:100%;min-height:88px;resize:vertical;font-size:16px;line-height:1.5;padding:11px;border:1px solid #b5a6b9!important;border-radius:12px;color:#393140!important;-webkit-text-fill-color:#393140!important;caret-color:#60476d;background:#f8f2f6!important;box-shadow:inset 0 1px 2px #7057790a!important;color-scheme:light}
    #luneaMessageOracleOverlay #moQuestion::placeholder{color:#807284!important;-webkit-text-fill-color:#807284!important;opacity:1}
    #luneaMessageOracleOverlay #moQuestion:focus{color:#393140!important;-webkit-text-fill-color:#393140!important;background:#f8f2f6!important;border-color:#947ba1!important;box-shadow:0 0 0 3px #947ba11c!important}
    #luneaMessageOracleOverlay .mo-question-summary,#luneaMessageOracleOverlay .mo-full-text{color:#453649;-webkit-text-fill-color:#453649}
    #luneaMessageOracleOverlay .mo-chips{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0 13px}
    #luneaMessageOracleOverlay .mo-chips button{padding:7px 9px;min-height:36px;font-size:11px}
    #luneaMessageOracleOverlay .mo-chips button[aria-pressed="true"]{background:#705779;color:#fff;border-color:#705779}
    #luneaMessageOracleOverlay .mo-context{font-size:11px;margin-top:9px;color:#705a75}
    #luneaMessageOracleOverlay .mo-primary{width:100%;background:linear-gradient(110deg,#796184,#5c506e);color:#fff;border-color:#796184}
    /* Source-space slot map on the 846 x 1399 approved front; percentages
       refer to its unmodified full canvas, not the RWS image dimensions. */
    #luneaMessageOracleOverlay .mo-card{position:relative;width:330px;max-width:100%;aspect-ratio:846/1399;margin:18px auto 10px;perspective:1100px}
    #luneaMessageOracleOverlay .mo-card-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transform:rotateY(0deg)}
    #luneaMessageOracleOverlay .mo-card[data-face="front"] .mo-card-inner{transform:rotateY(180deg)}
    #luneaMessageOracleOverlay .mo-card-back,#luneaMessageOracleOverlay .mo-card-front{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
    #luneaMessageOracleOverlay .mo-card-front{transform:rotateY(180deg);background:transparent;color:#493747}
    #luneaMessageOracleOverlay .mo-frame-art,#luneaMessageOracleOverlay .mo-back-art{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:none;background:transparent;pointer-events:none;-webkit-mask-size:contain;mask-size:contain;-webkit-mask-position:center;mask-position:center;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
    /* Lossless external alpha silhouettes remove only edge-connected export
       white. The approved JPEG pixels and the frame coordinate system stay intact. */
    #luneaMessageOracleOverlay .mo-frame-art{-webkit-mask-image:url('${ASSETS.frontMask}');mask-image:url('${ASSETS.frontMask}')}
    #luneaMessageOracleOverlay .mo-back-art{-webkit-mask-image:url('${ASSETS.backMask}');mask-image:url('${ASSETS.backMask}')}
    #luneaMessageOracleOverlay .mo-slot{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;margin:0;overflow-wrap:anywhere}
    /* Measured usable rectangles in the unmodified 846 x 1399 front:
       score 359,89 126x126; message 101,875 643x201; bottom 293,1254 259x52.
       The bottom rectangle follows the optically even ivory core so every
       context label shares one font-metric correction through slot geometry. */
    #luneaMessageOracleOverlay .mo-score{left:42.434988%;top:6.361687%;width:14.893617%;height:9.006433%;display:flex;align-items:center;justify-content:center;text-align:center;font:600 23px/1 'Noto Serif KR',serif;font-variant-numeric:lining-nums tabular-nums;letter-spacing:-.04em;white-space:nowrap;color:#745832}
    #luneaMessageOracleOverlay .mo-score-text{display:grid;place-items:center;width:100%;height:100%;text-align:center;line-height:1;transform:translateY(-1px)}
    #luneaMessageOracleOverlay .mo-score[data-digits="3"] .mo-score-text{font-size:18px}
    #luneaMessageOracleOverlay .mo-image-slot{left:29.8%;top:18%;width:40.3%;height:33.1%}
    #luneaMessageOracleOverlay .mo-image{display:block;width:100%;height:100%;object-fit:contain;filter:none;transform:none;background:transparent;margin:0}
    #luneaMessageOracleOverlay .mo-identity{left:21%;top:54.9%;width:58%;height:5.4%;display:grid;grid-template: minmax(0,1fr)/minmax(0,1fr);place-items:stretch;font:600 12.5px/1.12 'Noto Serif KR',serif}
    #luneaMessageOracleOverlay .mo-identity-inner{display:grid;place-content:center;place-self:stretch;width:auto;height:auto;margin:0 4%;text-align:center;gap:0;min-width:0;min-height:0}
    #luneaMessageOracleOverlay .mo-name-en,#luneaMessageOracleOverlay .mo-name-ko{display:block;margin:0;line-height:1.12}
    #luneaMessageOracleOverlay .mo-name-ko{font-size:12px;font-weight:500}
    #luneaMessageOracleOverlay .mo-message{left:11.938534%;top:62.544675%;width:76.004728%;height:14.367405%;display:flex;align-items:center;justify-content:center;text-align:center;margin:0;padding:0}
    #luneaMessageOracleOverlay .mo-message-inner{display:flex;align-items:center;justify-content:center;width:88%;height:100%;max-height:100%;margin:auto;text-align:center}
    #luneaMessageOracleOverlay .mo-message-text{margin:0;font:500 14px/1.46 'Noto Serif KR',serif;text-align:center;word-break:keep-all}
    #luneaMessageOracleOverlay .mo-details{position:absolute;left:13.3%;top:79.4%;width:73.4%;height:6.5%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3.8%;margin:0}
    #luneaMessageOracleOverlay .mo-detail{display:grid;grid-template-rows:auto auto;place-content:center;place-items:center;text-align:center;gap:1px;line-height:1;min-height:0}
    #luneaMessageOracleOverlay .mo-detail-label{display:block;margin:0;font-size:10px;line-height:1.08;color:#75604a;font-weight:500}
    #luneaMessageOracleOverlay .mo-detail-value{display:block;margin:0;font-size:12px;line-height:1.1;font-weight:650;color:#493747;word-break:keep-all}
    #luneaMessageOracleOverlay .mo-bottom{left:34.633570%;top:89.635454%;width:30.614657%;height:3.716941%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;line-height:1;color:#6d5439}
    #luneaMessageOracleOverlay .mo-full-reading{font-size:12px;line-height:1.7;margin:12px 0}
    #luneaMessageOracleOverlay .mo-full-reading summary{cursor:pointer}
    #luneaMessageOracleOverlay .mo-full-text{white-space:pre-wrap}
    #luneaMessageOracleOverlay .mo-question-summary{white-space:pre-wrap}
    @media(prefers-reduced-motion:reduce){#luneaMessageOracleOverlay .mo-card-inner{animation:none!important;transition:none!important}}
    #luneaMessageOracleOverlay .mo-note{font-size:11px;line-height:1.65;color:#746774;overflow-wrap:anywhere}
    #luneaMessageOracleOverlay .mo-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
    #luneaMessageOracleOverlay .mo-actions button{flex:1 1 95px}
    #luneaMessageOracleOverlay .mo-saved{margin-top:16px;font-size:12px}
    #luneaMessageOracleOverlay .mo-saved button{display:block;width:100%;text-align:left;margin-top:7px}
    #luneaMessageOracleOverlay [hidden]{display:none!important}
    #luneaMessageOracleOverlay .mo-status{font-size:12px;line-height:1.6;color:#72465e;margin:9px 0 0}
    @media(max-width:430px){#luneaMessageOracleOverlay .mo-sheet{padding:16px}}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement('div'); overlay.id='luneaMessageOracleOverlay';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','moTitle');overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<section class="mo-sheet" tabindex="-1"><div class="mo-header"><div class="mo-heading"><img class="message-oracle-logo mo-symbol" src="${ASSETS.logo}" alt="" aria-hidden="true" width="1254" height="1254"><div class="mo-heading-copy"><div class="mo-kicker">LUNEA · MESSAGE ORACLE</div><h2 id="moTitle">연락 · 소식 메시지 카드</h2></div></div><button class="mo-close" aria-label="닫기">×</button></div><p class="mo-sub">연애 · 재회 · 공적 결과 · 업무 · SNS · 지인 소식</p>
    <form class="mo-form"><label for="moQuestion">어떤 연락이나 소식이 궁금해?</label><textarea id="moQuestion" maxlength="2000" required placeholder="예: 회사에서 면접 결과를 알려줄까?"></textarea><div class="mo-context" aria-live="polite"></div><div class="mo-chips" role="group" aria-label="연락 맥락"></div><button class="mo-primary" type="submit">✉️ 메시지 카드 한 장 뽑기</button></form>
    <div class="mo-card" data-face="back"><div class="mo-card-inner">
      <div class="mo-card-back" aria-hidden="true"><img class="mo-back-art" src="${ASSETS.back}" alt="" width="1024" height="1536"></div>
      <article class="mo-card-front mo-result" hidden aria-label="메시지 카드 결과" aria-describedby="moScoreNote">
        <img class="mo-frame-art" src="${ASSETS.front}" alt="" aria-hidden="true" width="846" height="1399">
        <strong class="mo-slot mo-score" aria-label="카드 기반 연락 신호 점수"><span class="mo-score-text"></span></strong>
        <div class="mo-slot mo-image-slot"><img class="mo-image" alt=""></div>
        <h3 class="mo-slot mo-identity"><span class="mo-identity-inner"><span class="mo-name-en"></span><span class="mo-name-ko"></span></span></h3>
        <div class="mo-slot mo-message"><div class="mo-message-inner"><p class="mo-message-text"></p></div></div><div class="mo-details"></div><div class="mo-slot mo-bottom"></div>
      </article>
    </div></div>
    <p class="mo-note" id="moScoreNote"><strong>연락·소식 발생·전달 신호 강도</strong> · 합격·승인·긍정 결과 확률이 아니며, 카드 상징을 환산한 지표예요.</p>
    <div class="mo-result-context" hidden><p class="mo-note mo-question-summary"></p><details class="mo-full-reading"><summary>전체 메시지 · 맥락</summary><div class="mo-full-text"></div></details></div>
    <div class="mo-actions" hidden><button data-action="copy">📋 결과 복사</button><button data-action="save">💾 저장</button><button data-action="redraw">↻ 다시 뽑기</button></div><div class="mo-actions"><button data-action="new">새 질문</button></div><p class="mo-status" role="status"></p><details class="mo-saved"><summary>이 기기에 저장한 메시지 카드</summary><div class="mo-saved-list"></div></details></section>`;
  document.body.appendChild(overlay);
  const $=s=>overlay.querySelector(s), question=$('#moQuestion'),chips=$('.mo-chips');
  let backing; try{backing=W.localStorage}catch{backing={getItem(){return null},setItem(){throw new Error('Storage unavailable')},removeItem(){throw new Error('Storage unavailable')}}}
  const store=E.storage(backing);
  let current=null, override='AUTO', returnFocus=null, flipAnimation=null, openRequest=0;
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
  /* The semantic owner composes every visible message and detail. These thin
     adapters remain only for the existing UI test hook and legacy callers. */
  function interpretation(value){
    if(!value)return null;
    return E.interpret({question:value.question,context:value.context,cardCode:value.cardCode,createdAt:value.createdAt});
  }
  function visibleMessage(value){return interpretation(value)?.shortMessage||''}
  function visibleContextMessage(value){return interpretation(value)?.fullMessage||''}
  function detailCells(value){return interpretation(value)?.details||[]}
  function displayNames(id){
    const match=id.name.match(/^(.*?)\s*\((.*?)\)$/);
    let english=(match?.[1]||id.name).replace(/^(?:[IVX]+|0)\.\s*/,'').replace(/ of Pents$/,' of Pentacles');
    let korean=match?.[2]||id.code;
    const court=id.code.match(/^(Wands|Cups|Swords|Pents)(11|12|13|14)$/);
    if(court)korean=({Wands:'완드',Cups:'컵',Swords:'검',Pents:'펜타클'})[court[1]]+' '+({'11':'시종','12':'기사','13':'여왕','14':'왕'})[court[2]];
    return {english,korean};
  }
  function copyResultText(value){
    return E.copyText(value,deck);
  }
  function stopFlip(){
    const previous=flipAnimation;flipAnimation=null;previous?.cancel();
    $('.mo-card').removeAttribute('aria-busy');$('[data-action="redraw"]').disabled=false;
  }
  function reveal(animate){
    stopFlip();$('.mo-card').dataset.face=current?'front':'back';
    if(!current||!animate||W.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const inner=$('.mo-card-inner');if(!inner.animate)return;
    const animation=inner.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:640,easing:'cubic-bezier(.22,.61,.36,1)'});
    flipAnimation=animation;$('.mo-card').setAttribute('aria-busy','true');$('[data-action="redraw"]').disabled=true;
    const finish=()=>{if(flipAnimation===animation){flipAnimation=null;$('.mo-card').removeAttribute('aria-busy');$('[data-action="redraw"]').disabled=false}};
    animation.finished.then(finish,finish);
  }
  function renderScore(score){const node=$('.mo-score');$('.mo-score-text').textContent=`${score}%`;node.dataset.digits=String(String(score).length);node.setAttribute('aria-label',`카드 기반 연락·소식 발생·전달 신호 강도 ${score}퍼센트. 결과 성공 확률이 아님`);}
  function render(animate=false){
    const d=E.describe(current),reading=E.interpret(current);$('.mo-result').hidden=!reading;$('.mo-actions').hidden=!reading;$('.mo-form').hidden=!!reading;$('.mo-result-context').hidden=!reading;
    if(!d||!reading){reveal(false);return}
    const id=E.identity(d.cardCode,deck),names=displayNames(id);
    renderScore(d.score);
    $('.mo-name-en').textContent=names.english;$('.mo-name-ko').textContent=names.korean;
    const img=$('.mo-image');img.src=id.img;img.alt=id.name;
    $('.mo-message-text').textContent=reading.shortMessage;
    $('.mo-details').replaceChildren(...reading.details.map(({label,value})=>{const cell=document.createElement('div');cell.className='mo-detail';
      const l=document.createElement('span');l.className='mo-detail-label';l.textContent=label;
      const v=document.createElement('span');v.className='mo-detail-value';v.textContent=value;cell.appendChild(l);cell.appendChild(v);return cell}));
    $('.mo-bottom').textContent=reading.contextLabel;
    $('.mo-question-summary').textContent=`질문: ${d.question}\n${reading.contextLabel} · ${E.INTENTS[reading.intent]} · 연락·소식 신호 ${d.score}% · 결과 방향과 별도`;
    $('.mo-full-text').textContent=`${reading.fullMessage}\nKey Details: ${reading.details.map(item=>`${item.label} ${item.value}`).join(' · ')}`;
    reveal(animate);
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
    if(flipAnimation)return;
    try{current=E.draw(q,context);render(true);announce(store.remember(current)?'카드 한 장을 정방향으로 읽었어요.':'카드는 뽑았지만 이 기기에 저장하지 못했어요. 결과를 복사해 주세요.')}
    catch{announce('카드를 뽑지 못했어요. 질문과 브라우저의 보안 연결을 확인해 주세요.')}
  }
  question.addEventListener('input',syncContext);
  $('.mo-form').addEventListener('submit',e=>{e.preventDefault();if(!question.value.trim()){announce('궁금한 연락이나 소식을 입력해 주세요.');question.focus();return}commitDraw(question.value,override)});
  $('[data-action="redraw"]').addEventListener('click',()=>{if(!flipAnimation&&current&&W.confirm('같은 질문으로 새 카드를 다시 뽑을까?'))commitDraw(current.question,current.context)});
  $('[data-action="new"]').addEventListener('click',()=>{const cleared=store.clear();current=null;question.value='';override='AUTO';syncContext();render();announce(cleared?'': '현재 화면은 초기화했지만 기기 저장소를 지우지 못했어요.');question.focus()});
  $('[data-action="save"]').addEventListener('click',()=>{announce(store.save(current)?'이 기기의 메시지 카드 목록에 저장했어요.':'저장 공간을 사용할 수 없어요. 결과를 복사해 주세요.');renderSaved()});
  $('[data-action="copy"]').addEventListener('click',async()=>{try{await W.navigator.clipboard.writeText(copyResultText(current));announce('결과를 복사했어요.')}catch{announce('복사를 허용하지 않은 브라우저예요. 결과 텍스트를 선택해 복사해 주세요.')}});
  async function open(){
    const request=++openRequest;
    if(!await ready()){
      const note=document.getElementById('luneaMessageOracleLoadStatus');if(note)note.textContent='승인된 카드 이미지를 불러오지 못했어요. 다시 눌러 주세요.';
      return;
    }
    if(request!==openRequest)return;
    returnFocus=document.activeElement;current=current||store.last();
    if(current){question.value=current.question;override=current.context}
    syncContext();render();renderSaved();announce('');document.body.classList.add('lunea-message-open');overlay.dataset.open='true';overlay.setAttribute('aria-hidden','false');$('.mo-sheet').focus();
  }
  function close(){++openRequest;stopFlip();document.body.classList.remove('lunea-message-open');delete overlay.dataset.open;overlay.setAttribute('aria-hidden','true');returnFocus?.focus?.()}
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
  W.LUNEA_MESSAGE_ORACLE_UI_V1=Object.freeze({open,close,ready});
})();
