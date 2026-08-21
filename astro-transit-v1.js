'use strict';

/*
  LUNEA ASTRO TRANSIT V1
  Load order:
  celestial-profile-v3.js
  astro-natal-client-v1.js
  astro-transit-v1.js
  interpretation-gloss-v1.js (LAST)

  Uses:
  - LUNEA_ASTRO_NATAL_V3
  - LUNEA_ASTRO_API_URL
  Adds:
  - 🌌 Astro Timing button to RWS result actionbar
  - adaptive 1~120 day Transit scan
  - peak / caution / exact-hit UI
  - prompt integration + archive enrichment
*/
(() => {
  if (window.__LUNEA_ASTRO_TRANSIT_V1__) return;
  window.__LUNEA_ASTRO_TRANSIT_V1__ = true;

  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const $ = id => document.getElementById(id);

  const transitState = {
    question:'',
    topic:'general',
    days:30,
    result:null
  };

  const TOPIC_LABEL = {
    general:'전체 흐름', 연락:'연락·메시지', 재회:'재회·과거 인연',
    연애:'연애·호감', 시험:'시험·합격', 학업:'학업·공부',
    직장:'직장·업무', 이직:'이직·커리어 전환', 금전:'금전·재물',
    소식:'소식·문서', 투자심리:'투자 판단·심리'
  };

  function safeJSON(key, fallback=null) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; }
    catch { return fallback; }
  }

  function apiUrl() {
    return String(localStorage.getItem(API_KEY) || '').trim().replace(/\/+$/,'');
  }

  function currentQuestion() {
    let q='';
    try { q = state?.question || ''; } catch {}
    return String(q||'').trim();
  }

  function inferTopic(q) {
    const s=String(q||'');
    if (/재회|다시\s*만나|과거\s*인연|구남친|구여친/.test(s)) return '재회';
    if (/연락|카톡|메시지|답장|전화|DM|디엠/.test(s)) return '연락';
    if (/소개팅|연애|호감|썸|좋아하|사귀|데이트|이성/.test(s)) return '연애';
    if (/시험|합격|불합격|점수|모의고사|면접/.test(s)) return '시험';
    if (/공부|학업|강의|암기|복습|회독/.test(s)) return '학업';
    if (/이직|퇴사|커리어\s*전환|옮길/.test(s)) return '이직';
    if (/직장|회사|업무|승진|평판/.test(s)) return '직장';
    if (/주식|코인|매수|매도|익절|손절|투자/.test(s)) return '투자심리';
    if (/금전|재물|돈|수입|지출|재정/.test(s)) return '금전';
    if (/소식|통보|문서|메일|결과\s*발표/.test(s)) return '소식';
    return 'general';
  }

  function inferDays(q) {
    const s=String(q||'');
    let m;
    if ((m=s.match(/(\d+)\s*일\s*(?:안|이내|동안|간)?/))) return clampDays(+m[1]);
    if ((m=s.match(/(\d+)\s*주\s*(?:안|이내|동안|간)?/))) return clampDays(+m[1]*7);
    if ((m=s.match(/(\d+)\s*(?:개월|달)\s*(?:안|이내|동안|간)?/))) return clampDays(+m[1]*30);
    if (/이번\s*주|일주일|1주/.test(s)) return 7;
    if (/2주|두\s*주/.test(s)) return 14;
    if (/이번\s*달|한\s*달|1개월/.test(s)) return 30;
    if (/두\s*달|2개월/.test(s)) return 60;
    if (/세\s*달|3개월/.test(s)) return 90;
    return 30;
  }

  function clampDays(n) { return Math.max(1,Math.min(120,Math.round(n||30))); }

  function esc(s) {
    return String(s??'').replace(/[&<>"']/g,c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function fmtDate(iso, withTime=false) {
    if (!iso) return '—';
    const d=new Date(iso);
    const opt=withTime
      ? {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}
      : {month:'numeric',day:'numeric'};
    return new Intl.DateTimeFormat('ko-KR',opt).format(d);
  }

  function evidenceText(e) {
    if (!e) return '';
    const motion = e.motion ? ` · ${e.motion}` : '';
    const dir = e.direction ? ` · ${e.direction}` : '';
    return `${e.transit_ko||e.transit} → ${targetKo(e.target)} ${e.aspect} · orb(오브) ${e.best_orb ?? e.orb}°${motion}${dir}`;
  }

  function targetKo(t) {
    const m={
      Sun:'태양',Moon:'달',Mercury:'수성',Venus:'금성',Mars:'화성',
      Jupiter:'목성',Saturn:'토성',Uranus:'천왕성',Neptune:'해왕성',
      Pluto:'명왕성',ASC:'상승점',MC:'중천점',Vertex:'버텍스',
      PartOfFortune:'포르투나·행운점'
    };
    return m[t] ? `${t}(${m[t]})` : t;
  }

  function addStyles() {
    if ($('luneaTransitStyle')) return;
    const s=document.createElement('style');
    s.id='luneaTransitStyle';
    s.textContent=`
      #astroTransitOverlay{background:rgba(7,5,13,.92);backdrop-filter:blur(16px)}
      .astro-transit-modal{max-width:440px}
      .astro-transit-head{color:#d9c8ff}
      .astro-transit-help{font-size:10px;line-height:1.55;color:var(--dim);margin:0 0 10px}
      .astro-transit-controls{display:grid;grid-template-columns:1fr 105px;gap:7px}
      .astro-transit-controls select{font-size:11px}
      .astro-range-chips{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0 4px}
      .astro-range-chip{border:1px solid rgba(189,164,248,.22);background:rgba(255,255,255,.04);color:#d8d0e3;border-radius:9px;padding:6px 8px;font-size:9.5px;cursor:pointer}
      .astro-range-chip.active{border-color:rgba(157,228,193,.4);background:rgba(157,228,193,.10);color:#d9f3e5}
      .astro-scan-status{font-size:9.5px;color:var(--dim);margin:7px 0;line-height:1.5}
      .astro-result{display:none;margin-top:10px}.astro-result.show{display:block}
      .astro-summary{padding:12px;border-radius:14px;background:linear-gradient(145deg,rgba(157,228,193,.07),rgba(189,164,248,.10));border:1px solid rgba(157,228,193,.17)}
      .astro-summary .kicker{font:700 9px 'Cinzel',serif;color:#bfe7d2;letter-spacing:1px}
      .astro-summary h4{margin:4px 0 6px;font-size:14px;color:#f2edfa}
      .astro-summary p{margin:0;color:var(--dim);font-size:10.5px;line-height:1.55}
      .astro-window{margin-top:7px;padding:10px 11px;border-radius:12px;background:rgba(255,255,255,.035);border-left:3px solid rgba(157,228,193,.55)}
      .astro-window.caution{border-left-color:rgba(255,141,161,.65)}
      .astro-window b{font-size:11px;color:#eee8f8}.astro-window small{display:block;color:var(--dim);font-size:9px;margin-top:3px;line-height:1.45}
      .astro-hit{margin-top:5px;padding:7px 9px;border-radius:10px;background:rgba(255,210,125,.055);border:1px solid rgba(255,210,125,.12);font-size:9.5px;line-height:1.45;color:#ddd4e7}
      .astro-inline{margin:8px auto 12px;max-width:360px;padding:10px 11px;border-radius:14px;background:linear-gradient(145deg,rgba(157,228,193,.08),rgba(189,164,248,.08));border:1px solid rgba(157,228,193,.20);text-align:left}
      .astro-inline small{display:block;color:#bfe7d2;font-size:8.5px;letter-spacing:.7px}.astro-inline b{display:block;margin:3px 0;color:#f4effb;font-size:11.5px}.astro-inline span{font-size:9.5px;color:var(--dim);line-height:1.45}
      @media(max-width:360px){.astro-transit-controls{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function injectModal() {
    if ($('astroTransitOverlay')) return;
    const ov=document.createElement('div');
    ov.className='overlay'; ov.id='astroTransitOverlay';
    ov.innerHTML=`
      <div class="modal astro-transit-modal">
        <button class="close" id="astroTransitClose">×</button>
        <div class="sub astro-transit-head">LUNEA · WESTERN ASTROLOGY</div>
        <h3 class="modal-h">🌌 Transit Scanner</h3>
        <p class="astro-transit-help">Transit(트랜짓·현재 천체 이동)을 Natal(네이탈·출생차트)과 비교해서 질문 범위 안의 활성 구간을 계산해. 사건 발생을 확정하는 기능은 아니야.</p>
        <div class="field"><label>현재 질문</label><textarea id="astroTransitQuestion" readonly></textarea></div>
        <div class="astro-transit-controls">
          <div class="field"><label>주제</label><select id="astroTransitTopic"></select></div>
          <div class="field"><label>기간</label><select id="astroTransitDays">
            <option value="3">3일</option><option value="7">7일</option><option value="14">14일</option>
            <option value="30">30일</option><option value="60">60일</option><option value="90">90일</option><option value="120">120일</option>
          </select></div>
        </div>
        <div class="astro-range-chips">
          <button type="button" class="astro-range-chip" data-days="7">1주</button>
          <button type="button" class="astro-range-chip" data-days="30">1개월</button>
          <button type="button" class="astro-range-chip" data-days="60">2개월</button>
          <button type="button" class="astro-range-chip" data-days="90">3개월</button>
        </div>
        <button class="primary full-btn" id="astroTransitRun">🌌 트랜짓 스캔</button>
        <div class="astro-scan-status" id="astroTransitStatus"></div>
        <div class="astro-result" id="astroTransitResult"></div>
      </div>`;
    document.body.appendChild(ov);

    const topic=$('astroTransitTopic');
    Object.entries(TOPIC_LABEL).forEach(([v,label])=>{
      const o=document.createElement('option'); o.value=v;o.textContent=label;topic.appendChild(o);
    });
    $('astroTransitClose').onclick=closeModal;
    ov.addEventListener('pointerup',e=>{if(e.target===ov)closeModal()});
    $('astroTransitRun').onclick=runScan;
    $('astroTransitDays').onchange=syncRangeChips;
    document.querySelectorAll('.astro-range-chip').forEach(b=>{
      b.onclick=()=>{$('astroTransitDays').value=b.dataset.days;syncRangeChips()}
    });
  }

  function openModal() {
    const natal=safeJSON(NATAL_KEY);
    if (!natal) return alert('먼저 서양점성술 프로필에서 Natal 자동 계산을 완료해줘.');
    if (!apiUrl()) return alert('Astro Core API 주소가 없어. 서양점성술 프로필에서 서버 주소를 확인해줘.');
    const q=currentQuestion();
    if (!q) return alert('현재 RWS 질문을 찾지 못했어.');

    transitState.question=q;
    transitState.topic=inferTopic(q);
    transitState.days=inferDays(q);
    transitState.result=null;

    $('astroTransitQuestion').value=q;
    $('astroTransitTopic').value=transitState.topic;
    setDaysSelect(transitState.days);
    $('astroTransitResult').classList.remove('show');
    $('astroTransitResult').innerHTML='';
    $('astroTransitStatus').textContent=`질문에서 ${transitState.days}일 범위를 우선 감지했어. 필요하면 바꿔도 돼.`;
    syncRangeChips();

    $('astroTransitOverlay').classList.add('show');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    $('astroTransitOverlay')?.classList.remove('show');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  function setDaysSelect(days) {
    const sel=$('astroTransitDays');
    const allowed=[3,7,14,30,60,90,120];
    const nearest=allowed.reduce((a,b)=>Math.abs(b-days)<Math.abs(a-days)?b:a,allowed[0]);
    sel.value=String(nearest);
    transitState.days=nearest;
  }

  function syncRangeChips() {
    const d=+$('astroTransitDays').value;
    transitState.days=d;
    document.querySelectorAll('.astro-range-chip').forEach(b=>b.classList.toggle('active',+b.dataset.days===d));
  }

  async function runScan() {
    const natal=safeJSON(NATAL_KEY);
    const api=apiUrl();
    const btn=$('astroTransitRun');
    transitState.topic=$('astroTransitTopic').value;
    transitState.days=+$('astroTransitDays').value;

    btn.disabled=true;btn.textContent='🌌 계산 중…';
    $('astroTransitStatus').textContent='현재 천체와 출생차트를 겹쳐보고 있어. 정확각 후보도 별도로 정밀화 중…';

    try{
      const res=await fetch(`${api}/v1/transits/scan`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          natal,
          topic:transitState.topic,
          start_iso:new Date().toISOString(),
          days:transitState.days,
          timezone:'Asia/Seoul'
        })
      });
      let data=null;try{data=await res.json()}catch{}
      if(!res.ok)throw new Error(data?.detail||`${res.status} ${res.statusText}`);
      if(data?.schema!=='LUNEA_TRANSIT_SCAN_V1')throw new Error('Transit 응답 형식이 예상과 달라.');
      transitState.result=data;
      renderResult();
      renderInline();
      $('astroTransitStatus').textContent=`계산 완료 · ${data.range.sample_step_hours}시간 간격 기본 스캔 + 정확각 별도 정밀화`;
    }catch(err){
      $('astroTransitStatus').textContent='계산 실패: '+(err?.message||err);
      $('astroTransitResult').classList.remove('show');
    }finally{
      btn.disabled=false;btn.textContent='🌌 트랜짓 스캔';
    }
  }

  function renderResult() {
    const d=transitState.result;if(!d)return;
    const peaks=d.peak_windows||[];
    const cautions=d.caution_windows||[];
    const hits=d.exact_hits||[];
    const strongest=d.top_points?.[0];

    let html=`<div class="astro-summary">
      <div class="kicker">TRANSIT SCAN · ${esc(d.topic_label)}</div>
      <h4>${d.overall.strong_signal?'활성 피크가 잡혔어':'강한 피크는 뚜렷하지 않아'}</h4>
      <p>${fmtDate(d.range.start)} ~ ${fmtDate(d.range.end)} · 최대 활성도 ${d.overall.max_activation}/100 · 평균 우호도 ${d.overall.average_favorability}/100</p>
    </div>`;

    if(peaks.length){
      html+=`<div class="sub" style="margin-top:11px">PEAK WINDOWS · 활성 구간</div>`;
      peaks.slice(0,3).forEach((w,i)=>{
        html+=`<div class="astro-window"><b>${i+1}순위 · ${fmtDate(w.start)} ~ ${fmtDate(w.end)} · 피크 ${fmtDate(w.peak,true)}</b>
        <small>활성도 ${w.peak_activation}/100 · 우호도 ${w.peak_favorability}/100${w.evidence?.length?'<br>'+w.evidence.slice(0,2).map(evidenceText).map(esc).join('<br>'):''}</small></div>`;
      });
    }else if(strongest){
      html+=`<div class="astro-window"><b>상대적으로 가장 움직이는 지점 · ${fmtDate(strongest.time,true)}</b>
      <small>활성도 ${strongest.activation}/100. 다만 강한 활성 구간 기준에는 못 미쳐서 사건 시기로 과장하지 않아.</small></div>`;
    }

    if(hits.length){
      html+=`<div class="sub" style="margin-top:11px">EXACT HITS · 정확각/근접각</div>`;
      hits.slice(0,6).forEach(h=>{
        html+=`<div class="astro-hit"><b>${fmtDate(h.time,true)}</b> · ${esc(h.transit)}(${esc(h.transit_ko)}) → ${esc(targetKo(h.target))} ${esc(h.aspect)}
        · orb(오브) ${h.orb}° · ${h.precision==='exact'?'정확각':'근접 정확각'} · ${esc(h.direction)}</div>`;
      });
    }

    if(cautions.length){
      html+=`<div class="sub" style="margin-top:11px">CAUTION · 활성은 높지만 마찰 가능</div>`;
      cautions.slice(0,2).forEach(w=>{
        html+=`<div class="astro-window caution"><b>${fmtDate(w.start)} ~ ${fmtDate(w.end)}</b>
        <small>활성도 ${w.peak_activation}/100 · 우호도 ${w.peak_favorability}/100. 움직임이 크다는 뜻과 편안하게 풀린다는 뜻은 구분해서 봐.</small></div>`;
      });
    }

    html+=`<p class="astro-transit-help" style="margin-top:10px">※ Transit(트랜짓)은 점성술적 활성 시점을 구조화하는 계산이야. 이 값만으로 연락·재회·합격·가격 움직임 같은 사건을 확정하지 않아.</p>`;
    const el=$('astroTransitResult');el.innerHTML=html;el.classList.add('show');
  }

  function supportSummary() {
    const d=transitState.result;if(!d)return '';
    const p=d.peak_windows?.[0];
    if(p)return `${fmtDate(p.start)}~${fmtDate(p.end)} · 피크 ${fmtDate(p.peak,true)} · 활성 ${p.peak_activation}/100`;
    const t=d.top_points?.[0];
    return t?`${fmtDate(t.time,true)} 상대적 고점 · 활성 ${t.activation}/100`:'뚜렷한 활성 피크 없음';
  }

  function renderInline() {
    const cards=$('cards');if(!cards||!transitState.result)return;
    let el=$('luneaAstroTransitInline');
    if(!el){
      el=document.createElement('div');el.id='luneaAstroTransitInline';el.className='astro-inline';
      const timing=$('luneaTimingInline');
      if(timing)timing.insertAdjacentElement('afterend',el); else cards.insertAdjacentElement('afterend',el);
      el.onclick=openModal;
    }
    el.innerHTML=`<small>WESTERN ASTROLOGY · TRANSIT</small><b>${esc(transitState.result.topic_label)} · ${esc(supportSummary())}</b>
      <span>Whole Sign(홀사인) Primary + Placidus(플라시두스) Secondary · 정확각 별도 정밀화</span>`;
    const b=$('astroTransitBtn');if(b)b.textContent='🌌 '+(transitState.result.overall.strong_signal?'Astro 피크':'Astro 완료');
  }

  function clearTransit() {
    transitState.question='';transitState.topic='general';transitState.days=30;transitState.result=null;
    $('luneaAstroTransitInline')?.remove();
    const b=$('astroTransitBtn');if(b)b.textContent='🌌 Astro Timing';
  }

  function injectButton() {
    if($('astroTransitBtn'))return;
    const bar=document.querySelector('#spreadOverlay .actionbar');if(!bar)return;
    const b=document.createElement('button');b.className='mini';b.id='astroTransitBtn';b.textContent='🌌 Astro Timing';
    const timing=$('timingSupportBtn');
    const save=$('saveReading');
    if(timing&&timing.nextSibling)bar.insertBefore(b,timing.nextSibling);
    else if(save)bar.insertBefore(b,save);
    else bar.appendChild(b);
    b.onclick=openModal;
  }

  function installStartReset() {
    try{
      if(typeof startSpread!=='function'||window.__LUNEA_TRANSIT_START_WRAPPED__)return;
      window.__LUNEA_TRANSIT_START_WRAPPED__=true;
      const old=startSpread;
      startSpread=function(...args){clearTransit();return old.apply(this,args)};
    }catch(e){console.warn('[Transit] startSpread wrap skipped',e)}
  }

  function promptTransitText() {
    const d=transitState.result;if(!d)return '';
    const peaks=(d.peak_windows||[]).slice(0,3).map((w,i)=>
      `${i+1}. ${fmtDate(w.start)}~${fmtDate(w.end)} / 피크 ${fmtDate(w.peak,true)} / 활성 ${w.peak_activation}/100 / 우호 ${w.peak_favorability}/100`
    ).join('\n');
    const hits=(d.exact_hits||[]).slice(0,6).map(h=>
      `- ${fmtDate(h.time,true)}: ${h.transit}(${h.transit_ko}) → ${targetKo(h.target)} ${h.aspect}, orb ${h.orb}°, ${h.precision==='exact'?'정확각':'근접각'}, ${h.direction}`
    ).join('\n');
    return `
[WESTERN ASTROLOGY — TRANSIT SCANNER · 계산 결과]
- 질문 주제: ${d.topic_label}
- 계산 범위: ${fmtDate(d.range.start)} ~ ${fmtDate(d.range.end)}
- 최대 활성도: ${d.overall.max_activation}/100
- 평균 우호도: ${d.overall.average_favorability}/100
- 강한 활성 신호: ${d.overall.strong_signal?'있음':'뚜렷하지 않음'}
${peaks?`[활성 구간]\n${peaks}`:'[활성 구간]\n강한 피크 기준을 넘는 구간 없음'}
${hits?`[정확각/근접 정확각]\n${hits}`:''}

[Transit 통합 규칙]
1. 위 값은 천문 계산 엔진이 산출한 Tropical(열대황도) Transit 결과다. AI가 행성 위치·하우스·각·날짜를 새로 계산하거나 수정하지 않는다.
2. Whole Sign(홀사인)은 사건/주제 영역의 Primary, Placidus(플라시두스)는 Secondary 보조 신호로 읽는다.
3. 활성도는 '움직임의 강도'이고 우호도는 '편안하게 풀릴 가능성의 톤'이다. 둘을 같은 뜻으로 취급하지 않는다.
4. 활성도가 높아도 RWS에서 사건 성립 가능성이 약하면 사건 발생 확정일로 말하지 않는다.
5. Timing Oracle이 있다면 broad range(넓은 시기 범위), Transit은 그 안의 activation window(활성 창)로 역할을 나눈다.
6. 정확각은 점성술적 피크이지 연락·재회·합격·주가 등 현실 사건의 확정 시각이 아니다.
7. 결과가 서로 다르면 억지로 일치시키지 말고 왜 신호가 갈리는지 설명한다.
8. 최종 해석에 필요하면 '🌌 점성술 타이밍 보강' 소제목을 두고 가장 강한 1~3개 구간만 간결하게 설명한다.`;
  }

  function installPromptIntegration() {
    try{
      if(typeof promptString!=='function'||window.__LUNEA_TRANSIT_PROMPT_WRAPPED__)return;
      window.__LUNEA_TRANSIT_PROMPT_WRAPPED__=true;
      const old=promptString;
      promptString=function(){
        let p=old.apply(this,arguments);
        const q=currentQuestion();
        if(!transitState.result||transitState.question!==q)return p;
        return p+'\n\n'+promptTransitText();
      };
    }catch(e){console.warn('[Transit] prompt wrap skipped',e)}
  }

  function archiveObject() {
    const d=transitState.result;if(!d)return null;
    return {
      schema:d.schema,topic:d.topic,topic_label:d.topic_label,range:d.range,
      overall:d.overall,peak_windows:d.peak_windows?.slice(0,5)||[],
      caution_windows:d.caution_windows?.slice(0,3)||[],
      exact_hits:d.exact_hits?.slice(0,8)||[]
    };
  }

  function installArchiveIntegration() {
    try{
      const save=$('saveReading');
      if(!save||window.__LUNEA_TRANSIT_SAVE_WRAPPED__)return;
      window.__LUNEA_TRANSIT_SAVE_WRAPPED__=true;
      const old=save.onclick;
      save.onclick=function(e){
        if(old)old.call(this,e);
        const q=currentQuestion();
        if(!transitState.result||transitState.question!==q)return;
        try{
          if(typeof getArchive==='function'&&typeof setArchive==='function'){
            const a=getArchive();
            if(a.length){a[0].astroTransit=archiveObject();setArchive(a)}
          }
        }catch(err){console.warn('[Transit] archive enrich failed',err)}
      };
    }catch{}
  }

  function boot(){
    addStyles();injectModal();injectButton();installStartReset();installPromptIntegration();installArchiveIntegration();
    console.info('✦ LUNEA ASTRO TRANSIT V1 loaded');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
