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
    #luneaMessageOracleOverlay .mo-score[data-digits="3"]{font-size:18px}
    #luneaMessageOracleOverlay .mo-image-slot{left:29.8%;top:18%;width:40.3%;height:33.1%}
    #luneaMessageOracleOverlay .mo-image{display:block;width:100%;height:100%;object-fit:contain;filter:none;transform:none;background:transparent;margin:0}
    #luneaMessageOracleOverlay .mo-identity{left:21%;top:54.9%;width:58%;height:5.4%;flex-direction:column;gap:1px;font:600 12.5px/1.15 'Noto Serif KR',serif}
    #luneaMessageOracleOverlay .mo-name-ko{font-size:12px;font-weight:500}
    #luneaMessageOracleOverlay .mo-message{left:11.938534%;top:62.544675%;width:76.004728%;height:14.367405%;display:flex;align-items:center;justify-content:center;text-align:center;margin:0;padding:2px 5px;font:500 14px/1.34 'Noto Serif KR',serif;word-break:keep-all}
    #luneaMessageOracleOverlay .mo-details{position:absolute;left:13.3%;top:79.4%;width:73.4%;height:6.5%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3.8%;margin:0}
    #luneaMessageOracleOverlay .mo-detail{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:3px;line-height:1.25}
    #luneaMessageOracleOverlay .mo-detail-label{font-size:10px;color:#75604a;font-weight:500}
    #luneaMessageOracleOverlay .mo-detail-value{font-size:12px;font-weight:650;color:#493747;word-break:keep-all}
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
        <strong class="mo-slot mo-score" aria-label="카드 기반 연락 신호 점수"></strong>
        <div class="mo-slot mo-image-slot"><img class="mo-image" alt=""></div>
        <h3 class="mo-slot mo-identity"><span class="mo-name-en"></span><span class="mo-name-ko"></span></h3>
        <p class="mo-slot mo-message"></p><div class="mo-details"></div><div class="mo-slot mo-bottom"></div>
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
  const DETAIL_LABELS={
    LOVE:['감정','연락','행동','흐름'],REUNION:['감정','연락','행동','흐름'],
    OFFICIAL:['통지','경로','진행','속도'],WORK_BIZ:['회신','진행','제약','속도'],
    SOCIAL:['SNS','관찰','직접 반응','행동'],PERSONAL:['관계','소식','행동','흐름'],GENERAL:['응답','경로','행동','흐름']
  };
  const NON_ROMANTIC_CONTEXTS=new Set(['OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL']);
  const CONTEXT_COPY=Object.freeze({
    LOVE:Object.freeze({signal:'연락·응답',caveat:'연락 신호와 관계의 방향은 별개예요.'}),
    REUNION:Object.freeze({signal:'재접촉·소식',caveat:'재접촉과 관계 회복은 별개예요.'}),
    OFFICIAL:Object.freeze({signal:'공식 통지·소식',caveat:'통지와 승인·선정 여부는 별개예요.'}),
    WORK_BIZ:Object.freeze({signal:'업무 회신·소식',caveat:'회신과 채용·제안 결과는 별개예요.'}),
    SOCIAL:Object.freeze({signal:'온라인 반응·메시지',caveat:'확인·반응과 직접 연락은 별개예요.'}),
    PERSONAL:Object.freeze({signal:'개인 연락·소식',caveat:'소식 도착과 관계 변화는 별개예요.'}),
    GENERAL:Object.freeze({signal:'연락·소식',caveat:'소식 전달과 결과의 긍정·부정은 별개예요.'})
  });
  const CONTEXT_SAFE_STYLE=Object.freeze({
    '집착성 반복 접촉':'압박이 얽힌 반복 확인','감정의 첫 인사':'조심스러운 첫 안내',
    '익숙한 인연의 안부':'오래된 연결의 안부','수줍은 마음의 메시지':'조심스러운 첫 메시지','감정을 조절한 답':'절제된 답'
  });
  const FORM_COPY=Object.freeze({
    direct:Object.freeze({DEFAULT:'직접 메시지·통화',OFFICIAL:'담당자의 직접 회신',WORK_BIZ:'메일·메신저·통화 회신',SOCIAL:'DM·댓글 같은 직접 반응'}),
    formal:Object.freeze({DEFAULT:'정해진 창구·문서 안내',LOVE:'신중하고 형식적인 연락',REUNION:'중간자나 정해진 경로',SOCIAL:'공개 공지·계정 알림',PERSONAL:'가족·모임의 전달'}),
    online:Object.freeze({DEFAULT:'SNS·온라인 알림',OFFICIAL:'온라인 공지·접수 알림',WORK_BIZ:'메일·업무 메신저',PERSONAL:'온라인 안부·소식'}),
    mediated:Object.freeze({DEFAULT:'제3자·중간 전달',OFFICIAL:'기관·담당 경로',WORK_BIZ:'담당자 간 전달',SOCIAL:'공통 계정·간접 반응',PERSONAL:'공통 지인·가족 전달'}),
    recontact:Object.freeze({DEFAULT:'오래된 채널의 재접촉',OFFICIAL:'보류 건의 재통지',WORK_BIZ:'이전 문의·제안 재회신',SOCIAL:'예전 계정·대화의 재반응',PERSONAL:'오래된 지인의 안부'}),
    work:Object.freeze({DEFAULT:'실무 문의·회신',LOVE:'일정·현실 조건을 묻는 연락',REUNION:'현실 조건을 확인하는 연락',OFFICIAL:'처리 담당자의 회신',SOCIAL:'운영·협업 관련 반응',PERSONAL:'일정·생활 관련 소식'}),
    schedule:Object.freeze({DEFAULT:'초대·일정 제안',OFFICIAL:'일정·절차 안내',WORK_BIZ:'미팅·일정 조율',SOCIAL:'온라인 초대·약속',PERSONAL:'모임·약속 소식'}),
    community:Object.freeze({DEFAULT:'가족·모임을 통한 소식',OFFICIAL:'조직·단체 안내',WORK_BIZ:'팀·조직의 공지',SOCIAL:'커뮤니티·그룹 반응'}),
    sudden:Object.freeze({DEFAULT:'갑작스러운 메시지·알림',OFFICIAL:'예고 없는 결과·변경 통지',WORK_BIZ:'급한 회신·일정 변경',SOCIAL:'갑작스러운 알림·DM'}),
    checkin:Object.freeze({DEFAULT:'안부·확인 연락',OFFICIAL:'상태 확인·안내',WORK_BIZ:'진행 확인·후속 회신',SOCIAL:'가벼운 반응·안부',PERSONAL:'안부·생활 소식'}),
    indirect:Object.freeze({DEFAULT:'간접 확인·추가 조율',OFFICIAL:'내부 확인·절차 조율',WORK_BIZ:'검토·일정 조율',SOCIAL:'조회·관찰 같은 간접 신호',PERSONAL:'주변을 통한 간접 소식'})
  });
  const NON_ROMANTIC_GUIDANCE=Object.freeze({
    OFFICIAL:'공식 통지의 발생과 승인·선정 여부는 별도로 확인해요.',
    WORK_BIZ:'업무 회신과 최종 수락·선정 여부는 별도로 확인해요.',
    SOCIAL:'온라인 확인·관찰과 직접 메시지 행동은 별도로 확인해요.',
    PERSONAL:'소식의 도착과 관계의 긍정적 변화는 별도로 확인해요.',
    GENERAL:'연락·소식의 전달과 결과의 긍정·부정은 별도로 확인해요.'
  });
  function messageFormGroup(d){
    const signals=new Set([...d.card.tags,...d.card.channels]),has=(...values)=>values.some(value=>signals.has(value));
    if(d.context==='SOCIAL'&&has('SNS/온라인'))return 'online';
    if(d.context==='REUNION'&&has('재접촉','재개'))return 'recontact';
    if(has('업무 회신'))return 'work';
    if((d.context==='OFFICIAL'||d.context==='WORK_BIZ')&&has('공식 경로','문서/결과','결과 통보','공개 안내','결정권자'))return 'formal';
    if(has('재접촉','재개'))return 'recontact';
    if(has('SNS/온라인'))return 'online';
    if(has('제3자/중간 전달'))return 'mediated';
    if(has('초대/약속'))return 'schedule';
    if(has('가족/모임'))return 'community';
    if(has('직접 연락'))return 'direct';
    if(has('갑작스러운 소식','변경/충격'))return 'sudden';
    if(has('안부'))return 'checkin';
    return 'indirect';
  }
  function messageStrength(d){
    const signal=CONTEXT_COPY[d.context].signal;
    // signalLevel is computed after the engine's card-profile context adjustment.
    return d.signalLevel==='강한 신호'?`${signal} 신호가 강해요.`
      :d.signalLevel==='연결 가능성'?`${signal} 신호는 중간 이상이에요.`
      :d.signalLevel==='간접 · 조율'?`${signal} 신호는 제한적이며 조율이 먼저예요.`
      :`${signal} 신호는 약하고 관망·지연 쪽이에요.`;
  }
  function messageCaveat(d){
    const tags=d.card.tags,has=(...values)=>values.some(value=>tags.includes(value));
    if(has('관망'))return '인지·관찰과 직접 행동은 별개예요.';
    if(has('불확실'))return '간접 신호만으로 연락을 확정하지 말아요.';
    if(has('차단/제약','지연'))return '제약이나 지연이 실제 전달을 늦출 수 있어요.';
    if(has('갑작스러운 소식','변경/충격'))return '갑작스러운 전달과 긍정적인 내용은 별개예요.';
    if(has('마무리'))return '마무리 통지가 새로운 시작을 뜻하지는 않아요.';
    return CONTEXT_COPY[d.context].caveat;
  }
  function visibleMessage(d){
    if(d.context==='WORK_BIZ'&&d.cardCode==='Devil')return '연락·결과 통지 신호는 중간 이상이에요. 내부 제약과 압박으로 검토가 반복될 수 있으며, 연락과 긍정 결과는 별개예요.';
    const group=messageFormGroup(d),forms=FORM_COPY[group],form=forms[d.context]||forms.DEFAULT;
    const style=NON_ROMANTIC_CONTEXTS.has(d.context)&&(CONTEXT_SAFE_STYLE[d.card.contactStyle]||d.card.contactStyle)||d.card.contactStyle;
    return `${messageStrength(d)} ${form} 형태로, ${style} 흐름이 보여요. ${messageCaveat(d)}`;
  }
  function visibleContextMessage(d){return NON_ROMANTIC_CONTEXTS.has(d.context)?NON_ROMANTIC_GUIDANCE[d.context]:d.contextMessage}
  // Compact presentation of existing engine tags; these never change its score or meaning.
  const shortTag=t=>({'직접 연락':'직접','SNS/온라인':'온라인','공식 경로':'공식','제3자/중간 전달':'중간 전달','갑작스러운 소식':'돌발',
    '상호 호응':'호응','차단/제약':'제약','문서/결과':'문서','거리/선택':'거리','조심스러운 시작':'조심','변경/충격':'변경',
    '빠른 진행':'빠름','초대/약속':'약속','가족/모임':'모임','업무 회신':'실무','결과 통보':'통지','반복 연락':'반복'})[t]||t;
  function detailCells(d){
    const tags=d.card.tags, has=t=>tags.includes(t);
    const signal=d.score>=75?'강함':d.score>=55?'중간 이상':d.score>=35?'제한적':'약함';
    const path=shortTag(d.card.channels[0]||tags[0]);
    const action=has('관망')?'관망':has('차단/제약')?'제약 큼':has('상호 호응')?'상호 응답':has('직접 연락')?'직접':'확인 필요';
    const flow=has('지연')||has('차단/제약')||has('반복 연락')?'지연 가능':has('빠른 진행')?'빠름':has('갑작스러운 소식')?'돌발':has('조율')?'조율 중':has('마무리')?'마무리':'변동 가능';
    const affect=has('상호 호응')?'호응':has('안부')?'관심':has('관망')?'유보':'단정 불가';
    const progress=has('반복 연락')?'반복 검토':has('마무리')?'마무리':has('문서/결과')||has('결과 통보')?'결과 검토':has('조율')?'조율 중':has('공식 경로')?'절차 진행':has('상호 호응')?'협의 진행':has('관망')?'확인 중':has('변경/충격')?'변경 가능':has('차단/제약')?'보류 가능':'진행 가능';
    const constraint=has('차단/제약')?'큼':has('불확실')||has('지연')?'있음':'낮음';
    let values=[signal,path,action,flow];
    if(d.context==='LOVE'||d.context==='REUNION')values=[affect,signal,action,flow];
    if(d.context==='SOCIAL')values=[has('SNS/온라인')?'온라인':'별도 확인',has('관망')?'관찰':'불명확',has('직접 연락')?signal:'미확정',action];
    if(d.context==='PERSONAL')values=[has('재접촉')?'옛 인연':affect,signal,action,flow];
    if(d.context==='OFFICIAL')values=[signal,path,progress,flow];
    if(d.context==='WORK_BIZ')values=[signal,progress,constraint,flow];
    return DETAIL_LABELS[d.context].map((label,i)=>({label,value:values[i]}));
  }
  function displayNames(id){
    const match=id.name.match(/^(.*?)\s*\((.*?)\)$/);
    let english=(match?.[1]||id.name).replace(/^(?:[IVX]+|0)\.\s*/,'').replace(/ of Pents$/,' of Pentacles');
    let korean=match?.[2]||id.code;
    const court=id.code.match(/^(Wands|Cups|Swords|Pents)(11|12|13|14)$/);
    if(court)korean=({Wands:'완드',Cups:'컵',Swords:'검',Pents:'펜타클'})[court[1]]+' '+({'11':'시종','12':'기사','13':'여왕','14':'왕'})[court[2]];
    return {english,korean};
  }
  function copyResultText(value){
    const d=E.describe(value),id=d&&E.identity(d.cardCode,deck);if(!d||!id)return '';
    return `LUNEA MESSAGE ORACLE\n질문: ${d.question}\n맥락: ${E.CONTEXTS[d.context]}\n카드: ${id.name} (${d.cardCode}) · 정방향\n카드 기반 연락·소식 발생·전달 신호 강도: ${d.score}%\n합격·승인·긍정 결과 확률이 아니라 카드 상징을 연락·소식 관점으로 환산한 지표\n핵심 메시지: ${visibleMessage(d)}\n${visibleContextMessage(d)}\nKey Details: ${d.card.keyDetails.join(' · ')}`;
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
  function renderScore(score){const node=$('.mo-score');node.textContent=`${score}%`;node.dataset.digits=String(String(score).length);node.setAttribute('aria-label',`카드 기반 연락·소식 발생·전달 신호 강도 ${score}퍼센트. 결과 성공 확률이 아님`);}
  function render(animate=false){
    const d=E.describe(current);$('.mo-result').hidden=!d;$('.mo-actions').hidden=!d;$('.mo-form').hidden=!!d;$('.mo-result-context').hidden=!d;
    if(!d){reveal(false);return}
    const id=E.identity(d.cardCode,deck),names=displayNames(id);
    renderScore(d.score);
    $('.mo-name-en').textContent=names.english;$('.mo-name-ko').textContent=names.korean;
    const img=$('.mo-image');img.src=id.img;img.alt=id.name;
    const message=visibleMessage(d);
    $('.mo-message').textContent=message;
    $('.mo-details').replaceChildren(...detailCells(d).map(({label,value})=>{const cell=document.createElement('div');cell.className='mo-detail';
      const l=document.createElement('span');l.className='mo-detail-label';l.textContent=label;
      const v=document.createElement('span');v.className='mo-detail-value';v.textContent=value;cell.appendChild(l);cell.appendChild(v);return cell}));
    $('.mo-bottom').textContent=E.CONTEXTS[d.context];
    $('.mo-question-summary').textContent=`질문: ${d.question}\n${E.CONTEXTS[d.context]} · 연락·소식 신호 ${d.score}% · 결과 방향과 별도`;
    $('.mo-full-text').textContent=`${message}\n${visibleContextMessage(d)}\nKey Details: ${d.card.keyDetails.join(' · ')}`;
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
