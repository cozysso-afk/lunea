'use strict';

(() => {
  if (window.__LUNEA_ASTRO_RETURN_V1__) return;
  window.__LUNEA_ASTRO_RETURN_V1__ = true;

  const NATAL_KEY='LUNEA_ASTRO_NATAL_V3';
  const API_KEY='LUNEA_ASTRO_API_URL';
  const $=id=>document.getElementById(id);

  const BODY_META={
    Sun:{symbol:'☉',label:'Solar Return',ko:'태양회귀'},
    Moon:{symbol:'☽',label:'Lunar Return',ko:'달회귀'},
    Mercury:{symbol:'☿',label:'Mercury Return',ko:'수성회귀'},
    Venus:{symbol:'♀',label:'Venus Return',ko:'금성회귀'},
    Mars:{symbol:'♂',label:'Mars Return',ko:'화성회귀'},
    Jupiter:{symbol:'♃',label:'Jupiter Return',ko:'목성회귀'},
    Saturn:{symbol:'♄',label:'Saturn Return',ko:'토성회귀'}
  };

  const stateReturn={question:'',selected:[],place:'',result:null};

  function safeJSON(k,f=null){try{return JSON.parse(localStorage.getItem(k)||'')||f}catch{return f}}
  function apiUrl(){return String(localStorage.getItem(API_KEY)||'').trim().replace(/\/+$/,'')}
  function question(){let q='';try{q=state?.question||''}catch{}return String(q||'').trim()}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmt(iso,time=true){
    if(!iso)return '—';
    const opt=time
      ? {year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}
      : {year:'numeric',month:'numeric',day:'numeric'};
    return new Intl.DateTimeFormat('ko-KR',opt).format(new Date(iso));
  }

  function autoBodies(q){
    const s=String(q||'');
    const bodies=['Sun','Moon'];
    const add=x=>{if(!bodies.includes(x))bodies.push(x)};
    if(/연락|답장|카톡|메시지|전화|소식|문서|시험|공부|학업|면접|계약/.test(s))add('Mercury');
    if(/연애|재회|호감|썸|데이트|매력|미용|관계/.test(s))add('Venus');
    if(/행동|갈등|경쟁|성적|육체|운동|돌파|먼저\s*움직/.test(s))add('Mars');
    if(/올해|장기|인생|큰\s*기회|유학|확장|몇\s*년|전환기/.test(s))add('Jupiter');
    if(/올해|장기|책임|성숙|구조|인생|몇\s*년|전환기/.test(s))add('Saturn');
    return bodies;
  }

  function addStyle(){
    if($('luneaReturnStyle'))return;
    const s=document.createElement('style');s.id='luneaReturnStyle';s.textContent=`
      #astroReturnOverlay{background:rgba(7,5,13,.92);backdrop-filter:blur(16px)}
      .return-checks{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 10px}
      .return-check{display:flex;align-items:center;gap:7px;border:1px solid rgba(189,164,248,.17);border-radius:11px;padding:8px;background:rgba(255,255,255,.035);font-size:10px}
      .return-check input{width:auto;accent-color:#a582ff}
      .return-card{margin-top:8px;padding:11px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid rgba(189,164,248,.14)}
      .return-card h4{margin:0 0 5px;color:#f0eaf8;font-size:12px}.return-card p{margin:3px 0;color:var(--dim);font-size:9.7px;line-height:1.5}
      .return-pass{margin-top:5px;padding:6px 8px;border-radius:9px;background:rgba(255,210,125,.05);font-size:9px;color:#ddd4e7}
      .return-inline{margin:8px auto 12px;max-width:360px;padding:10px 11px;border-radius:14px;background:linear-gradient(145deg,rgba(255,210,125,.07),rgba(189,164,248,.08));border:1px solid rgba(255,210,125,.18)}
      .return-inline small{display:block;color:var(--gold);font-size:8.5px}.return-inline b{display:block;margin:3px 0;color:#f4effb;font-size:11px}.return-inline span{font-size:9.3px;color:var(--dim)}
    `;document.head.appendChild(s);
  }

  function inject(){
    if($('astroReturnOverlay'))return;
    const ov=document.createElement('div');ov.className='overlay';ov.id='astroReturnOverlay';
    ov.innerHTML=`<div class="modal">
      <button class="close" id="astroReturnClose">×</button>
      <div class="sub">LUNEA · PLANETARY CYCLES</div>
      <h3 class="modal-h">↻ Return Context</h3>
      <p class="astro-transit-help">Return(리턴·회귀)은 각 행성이 네 출생차트의 같은 경도로 돌아오는 주기야. 이전·다음 회귀는 연도까지 표시하고, 단기 사건 확정일이 아니라 질문의 배경 주기로 사용해.</p>
      <div class="field"><label>현재 질문</label><textarea id="astroReturnQuestion" readonly></textarea></div>
      <div class="return-checks" id="astroReturnChecks"></div>
      <div class="field"><label>리턴 차트 위치</label><input id="astroReturnPlace" placeholder="예: 여수"></div>
      <p class="astro-transit-help">ASC(상승점)·하우스는 회귀 순간의 장소에 따라 달라져. 현재 버전은 기본값으로 Natal(네이탈·출생차트) 장소를 넣어두니, 실제 회귀 순간 다른 지역에 있으면 바꿔줘.</p>
      <button class="primary full-btn" id="astroReturnRun">↻ 리턴 계산</button>
      <div class="astro-scan-status" id="astroReturnStatus"></div>
      <div id="astroReturnResult"></div>
    </div>`;
    document.body.appendChild(ov);

    const checks=$('astroReturnChecks');
    Object.entries(BODY_META).forEach(([body,m])=>{
      const l=document.createElement('label');l.className='return-check';
      l.innerHTML=`<input type="checkbox" value="${body}"><span>${m.symbol} ${m.label}(${m.ko})</span>`;
      checks.appendChild(l);
    });
    $('astroReturnClose').onclick=()=>close();
    ov.addEventListener('pointerup',e=>{if(e.target===ov)close()});
    $('astroReturnRun').onclick=run;
  }

  function injectButton(){
    if($('astroReturnBtn'))return;
    const bar=document.querySelector('#spreadOverlay .actionbar');if(!bar)return;
    const b=document.createElement('button');b.className='mini';b.id='astroReturnBtn';b.textContent='↻ Returns';
    const astro=$('astroTransitBtn'),save=$('saveReading');
    if(astro&&astro.nextSibling)bar.insertBefore(b,astro.nextSibling);
    else if(save)bar.insertBefore(b,save); else bar.appendChild(b);
    b.onclick=open;
  }

  function open(){
    const q=question();if(!q)return alert('현재 질문을 찾지 못했어.');
    const changed=stateReturn.question!==q;
    const hasSavedResult=!changed&&!!stateReturn.result;
    const natal=safeJSON(NATAL_KEY);
    if(!hasSavedResult&&!natal)return alert('먼저 Natal 자동 계산을 완료해줘.');
    if(!hasSavedResult&&!apiUrl())return alert('Astro Core API 주소를 확인해줘.');
    if(changed){stateReturn.question=q;stateReturn.selected=autoBodies(q);stateReturn.place='';stateReturn.result=null}
    $('astroReturnQuestion').value=q;
    document.querySelectorAll('#astroReturnChecks input').forEach(x=>x.checked=stateReturn.selected.includes(x.value));
    $('astroReturnPlace').value=stateReturn.place||natal?.birth?.place_resolved||natal?.birth?.place_input||'';
    if(stateReturn.result){render();$('astroReturnStatus').textContent='현재 질문에 저장된 리턴 계산 결과야.'}
    else{$('astroReturnResult').innerHTML='';$('astroReturnStatus').textContent=`질문 기준 AUTO: ${stateReturn.selected.map(x=>BODY_META[x].ko).join(' · ')}`}
    $('astroReturnOverlay').classList.add('show');document.body.classList.add('modal-open');
  }
  function close(){$('astroReturnOverlay')?.classList.remove('show');if(!document.querySelector('.overlay.show'))document.body.classList.remove('modal-open')}

  async function run(){
    const natal=safeJSON(NATAL_KEY),api=apiUrl();
    const bodies=[...document.querySelectorAll('#astroReturnChecks input:checked')].map(x=>x.value);
    if(!bodies.length)return alert('리턴을 하나 이상 선택해줘.');
    const requestEpoch=window.LUNEA_ASTRO_REQUEST_V1.generation('reading'),startedQuestion=question();
    const current=()=>requestEpoch===window.LUNEA_ASTRO_REQUEST_V1.generation('reading')&&startedQuestion===question();
    const selectedPlace=$('astroReturnPlace').value.trim();
    const btn=$('astroReturnRun');btn.disabled=true;btn.textContent='↻ 계산 중…';
    $('astroReturnStatus').textContent='회귀 경도를 탐색하고 정확 통과 시각을 정밀화 중…';
    try{
      const {data}=await window.LUNEA_ASTRO_REQUEST_V1.json(`${api}/v1/returns/context`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        natal,bodies,center_iso:new Date().toISOString(),timezone:'Asia/Seoul',place:selectedPlace||null
      })});
      if(!current())return;
      if(!data?.returns||typeof data.returns!=='object'||!Object.keys(data.returns).length)throw new Error('리턴 계산 결과가 비어 있어. 다시 시도해줘.');
      stateReturn.selected=bodies;stateReturn.place=selectedPlace;stateReturn.result=data;render();renderInline();notifyAttachmentChanged();
      $('astroReturnStatus').textContent=`계산 완료 · ${data.location?.place_resolved||'위치'} 기준`;
    }catch(e){if(!current())return;$('astroReturnStatus').textContent='계산 실패: '+(e?.message||e)}
    finally{if(requestEpoch===window.LUNEA_ASTRO_REQUEST_V1.generation('reading')){btn.disabled=false;btn.textContent='↻ 리턴 계산';if(!current())$('astroReturnStatus').textContent='질문이 바뀌어 이전 계산을 사용하지 않았어. 다시 계산해줘.';}}
  }

  function render(){
    const d=stateReturn.result;if(!d)return;
    let html='';
    Object.entries(d.returns||{}).forEach(([body,r])=>{
      const m=BODY_META[body]||{symbol:'',label:body,ko:r.return_label_ko};
      const nxt=r.next,prev=r.previous,chart=r.anchor_chart;
      const focus=chart?.planets?.[body],asc=chart?.angles?.ASC,mc=chart?.angles?.MC;
      html+=`<div class="return-card"><h4>${m.symbol} ${m.label}(${m.ko})</h4>
        <p>이전: ${prev?`${fmt(prev.time)} · ${esc(prev.pass_label_ko)} · ${esc(prev.direction)}`:'없음'}</p>
        <p>다음: ${nxt?`${fmt(nxt.time)} · ${esc(nxt.pass_label_ko)} · ${esc(nxt.direction)}`:'없음'}</p>`;
      if(focus)html+=`<p>Anchor chart(기준 회귀차트): ${esc(focus.sign)} ${focus.degree}° · WS ${focus.whole_house}H · Placidus ${focus.placidus_house}H</p>`;
      if(asc&&mc)html+=`<p>ASC(상승점) ${esc(asc.sign)} ${asc.degree}° · MC(중천점) ${esc(mc.sign)} ${mc.degree}°</p>`;
      (r.all_passes||[]).filter(x=>x.pass_type!=='single_pass').slice(0,4).forEach(x=>{
        html+=`<div class="return-pass">${fmt(x.time)} · ${esc(x.pass_label_ko)} · ${esc(x.direction)}</div>`;
      });
      html+='</div>';
    });
    $('astroReturnResult').innerHTML=html;
  }

  function summary(){
    const d=stateReturn.result;if(!d)return '';
    return Object.entries(d.returns||{}).map(([body,r])=>{
      const n=r.next||r.previous;return n?`${BODY_META[body]?.ko||body}: ${fmt(n.time,false)}`:'';
    }).filter(Boolean).join(' · ');
  }

  function renderInline(){
    const cards=$('cards');if(!cards||!stateReturn.result)return;
    let el=$('luneaReturnInline');if(!el){el=document.createElement('div');el.id='luneaReturnInline';el.className='return-inline';
      const a=$('luneaAstroTransitInline');if(a)a.insertAdjacentElement('afterend',el);else cards.insertAdjacentElement('afterend',el);el.onclick=open}
    el.innerHTML=`<small>PLANETARY RETURN CONTEXT</small><b>${esc(summary())}</b><span>질문별 AUTO 선택 · 회귀는 배경 주기, Transit(트랜짓)은 세부 활성 창</span>`;
    const b=$('astroReturnBtn');if(b)b.textContent='↻ Return 완료';
  }

  function clearReturn(){
    stateReturn.question='';stateReturn.selected=[];stateReturn.place='';stateReturn.result=null;
    $('luneaReturnInline')?.remove();
    const button=$('astroReturnBtn');if(button)button.textContent='↻ Returns';
    if($('astroReturnResult'))$('astroReturnResult').innerHTML='';
  }

  function archiveObject(){
    const data=stateReturn.result;if(!data)return null;
    const returns={};
    Object.entries(data.returns||{}).slice(0,7).forEach(([body,row])=>{
      const chart=row?.anchor_chart||{};
      returns[body]={
        return_label_ko:row?.return_label_ko,
        previous:row?.previous||null,
        next:row?.next||null,
        all_passes:(row?.all_passes||[]).slice(0,8),
        anchor_chart:{planets:{[body]:chart.planets?.[body]||null},angles:{ASC:chart.angles?.ASC||null,MC:chart.angles?.MC||null}}
      };
    });
    return {schema:data.schema,location:data.location||null,returns};
  }

  function attachmentSnapshot(){
    const q=question();
    if(!stateReturn.result||stateReturn.question!==q)return null;
    return {version:1,question:q,selected:stateReturn.selected.slice(0,7),place:stateReturn.place,result:archiveObject()};
  }

  function restoreAttachment(snapshot){
    const q=question();
    if(!snapshot||String(snapshot.question||'').trim()!==q||!snapshot.result?.returns)return false;
    stateReturn.question=q;
    stateReturn.selected=Array.isArray(snapshot.selected)?snapshot.selected.filter(body=>BODY_META[body]).slice(0,7):Object.keys(snapshot.result.returns).filter(body=>BODY_META[body]);
    stateReturn.place=String(snapshot.place||snapshot.result.location?.place_resolved||snapshot.result.location?.place_input||'').slice(0,240);
    stateReturn.result=snapshot.result;
    if($('astroReturnQuestion'))$('astroReturnQuestion').value=q;
    document.querySelectorAll('#astroReturnChecks input').forEach(input=>{input.checked=stateReturn.selected.includes(input.value)});
    if($('astroReturnPlace'))$('astroReturnPlace').value=stateReturn.place;
    render();renderInline();
    return true;
  }

  function registerAttachment(){
    const adapter={group:'astro',capture:attachmentSnapshot,restore:restoreAttachment,toArchive:s=>s?.result||null,clear:clearReturn};
    const registry=window.LUNEA_READING_ATTACHMENTS_V1;
    if(registry?.register)registry.register('astroReturns',adapter);
    else (window.__LUNEA_READING_ATTACHMENT_QUEUE_V1||=[]).push({name:'astroReturns',adapter});
  }

  function notifyAttachmentChanged(){window.LUNEA_READING_ATTACHMENTS_V1?.notifyChanged?.('astroReturns')}

  function promptBlock(){
    const d=stateReturn.result;if(!d)return '';
    const rows=Object.entries(d.returns||{}).map(([body,r])=>{
      const m=BODY_META[body];const n=r.next,p=r.previous,focus=r.anchor_chart?.planets?.[body],asc=r.anchor_chart?.angles?.ASC;
      return `- ${m?.label||body}(${m?.ko||r.return_label_ko}): 이전 ${p?fmt(p.time):'없음'} / 다음 ${n?fmt(n.time):'없음'}${n?` (${n.pass_label_ko}, ${n.direction})`:''}${focus?` / 기준차트 ${focus.sign} ${focus.degree}°, WS ${focus.whole_house}H, Placidus ${focus.placidus_house}H`:''}${asc?` / ASC ${asc.sign} ${asc.degree}°`:''}`;
    }).join('\n');
    return `[PLANETARY RETURNS · 회귀 계산 결과]
- 회귀차트 위치: ${d.location?.place_resolved||d.location?.place_input||'미상'}
${rows}

[Return 해석 규칙]
1. Solar Return(솔라리턴·태양회귀)은 연간 배경, Lunar Return(루나리턴·달회귀)은 월간 체감 배경으로 읽는다.
2. Mercury Return(수성회귀)은 연락·문서·학습, Venus Return(금성회귀)은 관계·호감·가치, Mars Return(화성회귀)은 행동·욕구·갈등 주제에 질문 관련성이 있을 때만 강조한다.
3. Jupiter Return(목성회귀)과 Saturn Return(토성회귀)은 장기 인생 주기일 때만 중요도를 높인다.
4. first/retrograde/final pass(1차/역행/최종 통과)가 있으면 같은 주제의 재검토·반복·최종 정리 가능성을 구분한다.
5. Return은 사건 확정 날짜가 아니다. 구체적인 activation window(활성 창)는 Transit 계산을 우선한다.
6. AI는 위 계산값을 수정하거나 새로운 회귀 시각을 지어내지 않는다.`;
  }

  function wrapPrompt(){
    try{if(typeof promptString!=='function'||window.__LUNEA_RETURN_PROMPT_WRAPPED__)return;
      window.__LUNEA_RETURN_PROMPT_WRAPPED__=true;const old=promptString;
      promptString=function(){let p=old.apply(this,arguments);if(!stateReturn.result||stateReturn.question!==question())return p;return p+'\n\n'+promptBlock()}}
    catch(e){console.warn('[Return] prompt wrap skipped',e)}
  }

  function wrapSave(){
    try{const save=$('saveReading');if(!save||window.__LUNEA_RETURN_SAVE_WRAPPED__)return;
      window.__LUNEA_RETURN_SAVE_WRAPPED__=true;const old=save.onclick;
      save.onclick=function(e){if(old)old.call(this,e);if(window.LUNEA_READING_ATTACHMENTS_V1)return;if(!stateReturn.result||stateReturn.question!==question())return;
        try{if(typeof getArchive==='function'&&typeof setArchive==='function'){const a=getArchive();if(a.length){a[0].astroReturns=stateReturn.result;setArchive(a)}}}catch{}}}
    catch{}
  }

  function boot(){addStyle();inject();injectButton();wrapPrompt();wrapSave();registerAttachment();console.info('✦ LUNEA RETURN CONTEXT V1 loaded')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
