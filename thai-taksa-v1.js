'use strict';

(() => {
  if(window.__LUNEA_THAI_TAKSA_V1__)return;
  window.__LUNEA_THAI_TAKSA_V1__=true;

  const NATAL_KEY='LUNEA_ASTRO_NATAL_V3',API_KEY='LUNEA_ASTRO_API_URL';
  const $=id=>document.getElementById(id);
  const st={question:'',topic:'general',result:null};

  function safeJSON(k,f=null){try{return JSON.parse(localStorage.getItem(k)||'')||f}catch{return f}}
  function api(){return String(localStorage.getItem(API_KEY)||'').trim().replace(/\/+$/,'')}
  function q(){let x='';try{x=state?.question||''}catch{}return String(x||'').trim()}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function topic(s){
    if(/재회|다시\s*만나|구남친|구여친/.test(s))return '재회';
    if(/연락|카톡|답장|메시지|전화/.test(s))return '연락';
    if(/연애|소개팅|호감|썸|데이트/.test(s))return '연애';
    if(/시험|합격|면접/.test(s))return '시험';
    if(/공부|학업|복습|강의/.test(s))return '학업';
    if(/이직|퇴사|커리어/.test(s))return '이직';
    if(/직장|회사|업무|승진/.test(s))return '직장';
    if(/주식|투자|매수|매도/.test(s))return '투자심리';
    if(/금전|돈|재물|수입|지출/.test(s))return '금전';
    if(/소식|문서|발표|통보/.test(s))return '소식';
    return 'general';
  }

  function addStyle(){
    if($('luneaThaiTaksaStyle'))return;const s=document.createElement('style');s.id='luneaThaiTaksaStyle';s.textContent=`
      #thaiTaksaOverlay{background:rgba(7,5,13,.92);backdrop-filter:blur(16px)}
      .taksa-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
      .taksa-cell{padding:9px;border-radius:11px;background:rgba(255,255,255,.035);border:1px solid rgba(255,210,125,.12)}
      .taksa-cell.focus{border-color:rgba(157,228,193,.34);background:rgba(157,228,193,.06)}
      .taksa-cell.kala{border-color:rgba(255,141,161,.30)}
      .taksa-cell b{display:block;color:#eee7f5;font-size:10.5px}.taksa-cell small{display:block;margin-top:3px;color:var(--dim);font-size:8.7px;line-height:1.4}
      .taksa-now{margin-top:9px;padding:10px;border-radius:12px;background:rgba(189,164,248,.07);border:1px solid rgba(189,164,248,.15);font-size:9.5px;line-height:1.5;color:#ddd5e6}
      .thai-inline{margin:8px auto 12px;max-width:360px;padding:10px 11px;border-radius:14px;background:linear-gradient(145deg,rgba(255,210,125,.06),rgba(157,228,193,.07));border:1px solid rgba(255,210,125,.16)}
      .thai-inline small{display:block;color:#e7c884;font-size:8.5px}.thai-inline b{display:block;margin:3px 0;color:#f4effb;font-size:11px}.thai-inline span{font-size:9.2px;color:var(--dim)}
    `;document.head.appendChild(s)
  }

  function inject(){
    if($('thaiTaksaOverlay'))return;
    const ov=document.createElement('div');ov.className='overlay';ov.id='thaiTaksaOverlay';
    ov.innerHTML=`<div class="modal">
      <button class="close" id="thaiTaksaClose">×</button>
      <div class="sub">LUNEA · THAI ASTROLOGY</div>
      <h3 class="modal-h">🇹🇭 Maha Taksa</h3>
      <p class="astro-transit-help">Taksa(탁사)는 출생요일을 기준으로 8개 영역에 행성 번호를 배치하는 태국 전통 체계야. 여기서는 Western Astrology(서양점성술)의 정밀 시기 계산과 섞지 않고 별도 보조 구조로 읽어.</p>
      <button class="primary full-btn" id="thaiTaksaRun">🇹🇭 태국점성술 계산</button>
      <div class="astro-scan-status" id="thaiTaksaStatus"></div>
      <div id="thaiTaksaResult"></div>
    </div>`;document.body.appendChild(ov);
    $('thaiTaksaClose').onclick=()=>close();ov.addEventListener('pointerup',e=>{if(e.target===ov)close()});
    $('thaiTaksaRun').onclick=run;
  }

  function injectButton(){
    if($('thaiTaksaBtn'))return;const bar=document.querySelector('#spreadOverlay .actionbar');if(!bar)return;
    const b=document.createElement('button');b.className='mini';b.id='thaiTaksaBtn';b.textContent='🇹🇭 Thai Taksa';
    const ret=$('astroReturnBtn'),save=$('saveReading');
    if(ret&&ret.nextSibling)bar.insertBefore(b,ret.nextSibling);else if(save)bar.insertBefore(b,save);else bar.appendChild(b);b.onclick=open;
  }

  function open(){
    if(!safeJSON(NATAL_KEY))return alert('먼저 Natal 자동 계산을 완료해줘.');
    if(!api())return alert('Astro Core API 주소를 확인해줘.');
    st.question=q();if(!st.question)return alert('현재 질문을 찾지 못했어.');
    st.topic=topic(st.question);st.result=null;$('thaiTaksaResult').innerHTML='';
    $('thaiTaksaStatus').textContent=`질문 주제: ${st.topic} · 출생요일은 06:00 경계 규칙으로 자동 계산`;
    $('thaiTaksaOverlay').classList.add('show');document.body.classList.add('modal-open');
  }
  function close(){$('thaiTaksaOverlay')?.classList.remove('show');if(!document.querySelector('.overlay.show'))document.body.classList.remove('modal-open')}

  async function run(){
    const btn=$('thaiTaksaRun');btn.disabled=true;btn.textContent='🇹🇭 계산 중…';
    try{
      const res=await fetch(`${api()}/v1/thai/taksa`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        natal:safeJSON(NATAL_KEY),topic:st.topic,current_iso:new Date().toISOString(),timezone:'Asia/Seoul'
      })});
      let d=null;try{d=await res.json()}catch{}
      if(!res.ok)throw new Error(d?.detail||`${res.status} ${res.statusText}`);
      st.result=d;render();inline();$('thaiTaksaStatus').textContent='계산 완료 · Taksa 8영역 + 현재 요일 보조 조응';
    }catch(e){$('thaiTaksaStatus').textContent='계산 실패: '+(e?.message||e)}
    finally{btn.disabled=false;btn.textContent='🇹🇭 태국점성술 계산'}
  }

  function render(){
    const d=st.result;if(!d)return;const focus=new Set(d.question?.focus_positions||[]);
    let h=`<div class="return-card"><h4>출생요일 · ${esc(d.birth.weekday_label)} · ${esc(d.birth.ruler.ko)}(${esc(d.birth.ruler.key)})</h4>
      <p>Taksa day boundary(탁사 날짜 경계): 06:00 현지시각 · 출생 행성번호 ${d.birth.planet_number}</p></div><div class="taksa-grid">`;
    (d.grid||[]).forEach(r=>{
      h+=`<div class="taksa-cell ${focus.has(r.position)?'focus':''} ${r.position==='Kalakini'?'kala':''}">
        <b>${esc(r.position)}(${esc(r.position_ko)}) · ${r.planet_number} ${esc(r.planet_ko)}</b>
        <small>${esc(r.position_thai)} · ${esc(r.meaning_ko)}</small></div>`;
    });h+='</div>';
    const now=d.current_day?.falls_in_natal_taksa;
    if(now)h+=`<div class="taksa-now">오늘의 요일 행성 ${esc(d.current_day.ruler.ko)}(${esc(d.current_day.ruler.key)})은 네 Natal Taksa(출생 탁사)에서 <b>${esc(now.position)}(${esc(now.position_ko)})</b> 위치야.<br>이건 LUNEA의 일일 상징 보조층이고 사건 확정 타이밍으로 쓰지 않아.</div>`;
    h+=`<p class="astro-transit-help" style="margin-top:9px">질문에서 강조할 Taksa 영역: ${(d.question.focus_rows||[]).map(x=>esc(x.position_ko)).join(' · ')}. 정밀 날짜는 Western Transit/Return 계산을 우선해.</p>`;
    $('thaiTaksaResult').innerHTML=h;
  }

  function inline(){
    const cards=$('cards');if(!cards||!st.result)return;let el=$('luneaThaiInline');
    if(!el){el=document.createElement('div');el.id='luneaThaiInline';el.className='thai-inline';
      const r=$('luneaReturnInline')||$('luneaAstroTransitInline');if(r)r.insertAdjacentElement('afterend',el);else cards.insertAdjacentElement('afterend',el);el.onclick=open}
    const f=st.result.question?.focus_rows||[];
    el.innerHTML=`<small>THAI ASTROLOGY · MAHA TAKSA</small><b>${esc(st.result.birth.weekday_label)} · ${esc(st.result.birth.ruler.ko)} · 질문 강조 ${f.map(x=>x.position_ko).join(' / ')}</b><span>06:00 경계 · 수요일 밤 Rahu(라후) 분리 · 정밀 시기 예측과는 역할 분리</span>`;
    const b=$('thaiTaksaBtn');if(b)b.textContent='🇹🇭 Thai 완료';
  }

  function promptBlock(){
    const d=st.result;if(!d)return '';
    const grid=(d.grid||[]).map(r=>`- ${r.position}(${r.position_ko}; ${r.position_thai}): ${r.planet_number} ${r.planet}(${r.planet_ko}) — ${r.meaning_ko}`).join('\n');
    const f=(d.question?.focus_rows||[]).map(r=>`${r.position}(${r.position_ko})`).join(', ');
    const now=d.current_day?.falls_in_natal_taksa;
    return `[THAI ASTROLOGY · MAHA TAKSA 계산 결과]
- 출생요일: ${d.birth.weekday_label}
- 출생요일 행성: ${d.birth.ruler.key}(${d.birth.ruler.ko}) · 번호 ${d.birth.planet_number}
- 날짜 경계: 06:00 현지시각
${grid}
- 이번 질문의 LUNEA 보조 초점: ${f}
${now?`- 현재 요일 행성 ${d.current_day.ruler.key}(${d.current_day.ruler.ko})은 출생 Taksa에서 ${now.position}(${now.position_ko}) 위치`:''}

[Thai Taksa 해석 규칙]
1. Taksa(탁사)는 Western Astrology(서양점성술)와 독립된 태국 전통 체계로 읽는다.
2. 수요일 18:00~목요일 05:59는 Rahu(라후·8) 규칙을 적용한다.
3. Boriwan/Ayu/Dech/Sri/Mula/Utsaha/Montri/Kalakini의 8영역을 그대로 유지한다.
4. '이번 질문의 보조 초점'은 LUNEA가 질문과 Taksa 영역을 연결하는 합성 레이어이지 태국 원전의 고정 사건 공식이라고 주장하지 않는다.
5. 현재 요일 행성 위치는 일일 상징 보조 신호일 뿐 정확한 사건 날짜로 해석하지 않는다.
6. 구체적인 시기는 Western Transit(트랜짓)과 Return(회귀), Timing Oracle을 우선한다.
7. Mahabote(마하보테)는 미얀마 요일 점성술이므로 Thai Taksa와 혼합하지 않는다.`;
  }

  function wrapPrompt(){
    try{if(typeof promptString!=='function'||window.__LUNEA_THAI_PROMPT_WRAPPED__)return;window.__LUNEA_THAI_PROMPT_WRAPPED__=true;const old=promptString;
      promptString=function(){let p=old.apply(this,arguments);if(!st.result||st.question!==q())return p;return p+'\n\n'+promptBlock()}}
    catch(e){console.warn('[Thai] prompt wrap skipped',e)}
  }

  function wrapSave(){
    try{const save=$('saveReading');if(!save||window.__LUNEA_THAI_SAVE_WRAPPED__)return;window.__LUNEA_THAI_SAVE_WRAPPED__=true;const old=save.onclick;
      save.onclick=function(e){if(old)old.call(this,e);if(!st.result||st.question!==q())return;try{if(typeof getArchive==='function'&&typeof setArchive==='function'){const a=getArchive();if(a.length){a[0].thaiTaksa=st.result;setArchive(a)}}}catch{}}}
    catch{}
  }

  function boot(){addStyle();inject();injectButton();wrapPrompt();wrapSave();console.info('✦ LUNEA THAI TAKSA V1 loaded')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
