'use strict';

/*
  LUNEA TIMING ORACLE A/B V2
  ==========================
  Multi-target companion for Timing Oracle V1.

  - Single-target Timing Oracle remains unchanged.
  - A/B or genuinely two-person questions draw one independent Timing Oracle card per target.
  - Scenario words such as "각각" do NOT by themselves mean multiple people.
  - Both targets use the same question-derived candidate policy; neither is forced to differ.
  - No artificial comparison winner and no event-certainty claim.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_AB_V2__) return;
  W.__LUNEA_TIMING_AB_V2__ = true;

  const $ = id => document.getElementById(id);
  const HISTORY_KEY = 'LUNEA_TIMING_AB_HISTORY_V1';
  const REPEAT_MS = 24 * 60 * 60 * 1000;
  const abState = {question:'', mode:null, A:null, B:null, ai:'', analysis:null};
  let deckPromise = null;

  const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function isPairQuestion(question) {
    const guard = W.LUNEA_HORARY_MULTI_GUARD?.isMultiPersonQuestion;
    if (typeof guard === 'function') {
      try { return !!guard(question); } catch {}
    }

    // Fallback only when the shared guard is unavailable.
    // IMPORTANT: "각각" is intentionally excluded because it frequently
    // describes multiple timings/options for ONE person.
    const q = norm(question);
    const pair = /(?:\ba\s*(?:와|과|랑|\/|·|및|,|그리고)\s*b\b|a와b|a\/b|a·b|두\s*(?:사람|명|인연|상대|대상)|2\s*(?:사람|명|인연|상대|대상)|둘\s*(?:다|은|이|의)?)/i.test(q);
    const people = /(사람|상대|인연|전남친|전여친|전애인|구남친|구여친|연인|이성|썸|친구|지인|동료|대상)/i.test(q);
    return pair && people;
  }

  function secureInt(max) {
    if (!Number.isInteger(max) || max <= 0) return 0;
    try {
      const limit = Math.floor(0x100000000 / max) * max;
      const a = new Uint32Array(1);
      do { crypto.getRandomValues(a); } while (a[0] >= limit);
      return a[0] % max;
    } catch { return Math.floor(Math.random() * max); }
  }

  function pick(list) {
    return list?.length ? list[secureInt(list.length)] : null;
  }

  async function loadDeck() {
    if (!deckPromise) {
      deckPromise = fetch('./lunea_timing_oracle_v1.json?v=102', {cache:'no-cache'})
        .then(r => { if (!r.ok) throw new Error('Timing Oracle deck load failed'); return r.json(); })
        .then(data => Array.isArray(data?.cards) ? data.cards : []);
    }
    return deckPromise;
  }

  function daysToEndOfWeek(now=new Date()) {
    const d = now.getDay();
    return d === 0 ? 1 : (7 - d) + 1;
  }
  function daysToEndOfMonth(now=new Date()) {
    const end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59);
    return Math.max(1, Math.ceil((end-now)/86400000));
  }
  function daysToEndOfYear(now=new Date()) {
    const end = new Date(now.getFullYear(), 11, 31, 23,59,59);
    return Math.max(1, Math.ceil((end-now)/86400000));
  }
  function unitDays(n, unit) {
    if (/시간/.test(unit)) return n/24;
    if (/일/.test(unit)) return n;
    if (/주/.test(unit)) return n*7;
    if (/개월|달/.test(unit)) return n*30.4375;
    if (/년/.test(unit)) return n*365.25;
    return null;
  }
  function parseExplicitRange(question) {
    const s = norm(question);
    let m = s.match(/(\d+(?:\.\d+)?)\s*(시간|일|주(?:일)?|개월|달|년)\s*후/);
    if (m) {
      const d = unitDays(Number(m[1]), m[2]);
      const tol = Math.max(1, d*.18);
      return {explicit:true,minDays:Math.max(0,d-tol),maxDays:d+tol,type:'around'};
    }
    m = s.match(/(\d+(?:\.\d+)?)\s*(시간|일|주(?:일)?|개월|달|년)\s*(?:안|내|이내|동안)?/);
    if (m) {
      const d = unitDays(Number(m[1]),m[2]);
      if (Number.isFinite(d)) return {explicit:true,minDays:0,maxDays:d,type:'within'};
    }
    if (/24\s*시간|하루\s*(?:안|내|이내)/.test(s)) return {explicit:true,minDays:0,maxDays:1,type:'within'};
    if (/오늘/.test(s)) return {explicit:true,minDays:0,maxDays:1,type:'within'};
    if (/내일/.test(s)) return {explicit:true,minDays:0,maxDays:2,type:'within'};
    if (/이번\s*주/.test(s)) return {explicit:true,minDays:0,maxDays:daysToEndOfWeek(),type:'within'};
    if (/이번\s*달/.test(s)) return {explicit:true,minDays:0,maxDays:daysToEndOfMonth(),type:'within'};
    if (/올해/.test(s)) return {explicit:true,minDays:0,maxDays:daysToEndOfYear(),type:'within'};
    if (/반년/.test(s)) return {explicit:true,minDays:0,maxDays:183,type:'within'};
    if (/한\s*달/.test(s)) return {explicit:true,minDays:0,maxDays:31,type:'within'};
    if (/일\s*년|한\s*해|1\s*년/.test(s)) return {explicit:true,minDays:0,maxDays:365,type:'within'};
    return {explicit:false,minDays:null,maxDays:null,type:null};
  }
  function analyzeQuestion(question) {
    const s = norm(question);
    const range = parseExplicitRange(s);
    return {
      text:s, ...range,
      asksDaypart:/(몇\s*시|시간대|새벽|이른\s*아침|아침|오전|정오|오후|해질|저녁|늦은\s*밤|밤\s*몇|자정)/.test(s),
      asksSeason:/(어느\s*계절|계절|초봄|늦봄|초여름|늦여름|초가을|늦가을|초겨울|늦겨울|월초|월중|월말)/.test(s),
      nearEvent:/(연락|답장|카톡|문자|전화|디엠|dm|소개팅|애프터|면접\s*(?:연락|제안)?|합격\s*발표|결과\s*발표|재회|약속|만남|배송|도착)/.test(s),
      longEvent:/(결혼|출산|임신|이민|정착|내\s*집|집\s*매수|주택\s*구입|창업|은퇴|장기\s*정착)/.test(s)
    };
  }
  function cardHasDays(c) { return c.relative_type === 'days' && Number.isFinite(c.min_days); }
  function nextApproxSeasonDistance(card, now=new Date()) {
    const map={'LT-027':[2,10],'LT-028':[4,15],'LT-029':[5,10],'LT-030':[7,15],'LT-031':[8,10],'LT-032':[10,15],'LT-033':[11,10],'LT-034':[1,15]};
    if (!map[card.id]) return null;
    const [m,d]=map[card.id]; let y=now.getFullYear(); let t=new Date(y,m,d,12,0,0);
    if (t < now) t=new Date(y+1,m,d,12,0,0);
    return Math.ceil((t-now)/86400000);
  }
  function delayCandidates(cards, explicit) {
    const ids = explicit
      ? ['LT-054','LT-055','LT-056','LT-057','LT-058','LT-059','LT-060']
      : ['LT-054','LT-055','LT-056','LT-058','LT-059','LT-060'];
    return cards.filter(c=>ids.includes(c.id));
  }
  function fitExplicit(cards, a) {
    let time = cards.filter(cardHasDays);
    if (a.type === 'around') {
      time = time.filter(c => (Number.isFinite(c.max_days)?c.max_days:Infinity) >= a.minDays && c.min_days <= a.maxDays);
    } else {
      time = time.filter(c => c.min_days <= a.maxDays && (Number.isFinite(c.max_days)?c.max_days:Infinity) <= Math.max(a.maxDays*1.12,a.maxDays+1));
    }
    if (a.maxDays >= 60) {
      time = time.concat(cards.filter(c=>c.group==='seasonal').filter(c => {
        if (['LT-035','LT-036','LT-037','LT-038'].includes(c.id)) return true;
        const dist=nextApproxSeasonDistance(c); return dist!==null && dist<=a.maxDays;
      }));
    }
    return [...new Map(time.map(c=>[c.id,c])).values()];
  }
  function chooseWeightedGroup(groups) {
    const entries=Object.values(groups).filter(v=>v.cards.length&&v.weight>0);
    const total=entries.reduce((s,v)=>s+v.weight,0);
    let ticket=secureInt(Math.max(1,Math.round(total*1000))), acc=0;
    for (const v of entries) { acc += Math.round(v.weight*1000); if (ticket < acc) return v.cards; }
    return entries.at(-1)?.cards || [];
  }
  function candidatePool(cards, question) {
    const a=analyzeQuestion(question), delay=delayCandidates(cards,a.explicit);
    if (a.asksDaypart) return {analysis:a,primary:cards.filter(c=>c.group==='day_window'),delay,mode:'focused'};
    if (a.asksSeason) return {analysis:a,primary:cards.filter(c=>c.group==='seasonal'),delay,mode:'focused'};
    if (a.explicit) return {analysis:a,primary:fitExplicit(cards,a),delay,mode:'focused'};
    const groups={
      short:{cards:cards.filter(c=>c.group==='short_range'),weight:a.longEvent?5:(a.nearEvent?45:30)},
      mid:{cards:cards.filter(c=>c.group==='mid_range'),weight:a.longEvent?30:(a.nearEvent?20:25)},
      season:{cards:cards.filter(c=>c.group==='seasonal'),weight:a.longEvent?20:(a.nearEvent?10:15)},
      long:{cards:cards.filter(c=>c.group==='long_range'),weight:a.longEvent?25:(a.nearEvent?5:10)},
      delay:{cards:delay,weight:20}
    };
    return {analysis:a,groups,mode:'weighted'};
  }
  function drawOne(cards, question) {
    const info=candidatePool(cards,question);
    let pool;
    if (info.mode==='weighted') pool=chooseWeightedGroup(info.groups);
    else {
      const chooseDelay=info.delay.length && secureInt(100)<20;
      pool=chooseDelay?info.delay:info.primary;
      if (!pool.length) pool=info.delay.length?info.delay:cards;
    }
    return {card:pick(pool),analysis:info.analysis};
  }

  function addStyles() {
    if ($('luneaTimingABStyle')) return;
    const style=document.createElement('style');
    style.id='luneaTimingABStyle';
    style.textContent=`
      #luneaTimingABPanel{display:none;width:100%;margin-top:4px}
      #luneaTimingABPanel.show{display:block}
      .tab-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;width:100%}
      .tab-card{padding:9px;border-radius:14px;background:rgba(255,255,255,.65);border:1px solid rgba(197,158,92,.25);text-align:center;color:#493e50}
      .tab-card small{display:block;margin-bottom:5px;color:#9e7d47;font:700 9px 'Cinzel',serif;letter-spacing:1px}
      .tab-card img{display:block;width:100%;max-width:132px;aspect-ratio:3/5;margin:0 auto 7px;object-fit:cover;border-radius:11px;border:1px solid rgba(199,158,84,.45);box-shadow:0 8px 18px rgba(80,51,89,.16)}
      .tab-card b{display:block;font:700 13px 'Noto Serif KR',serif;color:#403346}
      .tab-card em{display:block;margin:2px 0 5px;font-style:normal;font-size:8.5px;color:#9b7a45;letter-spacing:.4px}
      .tab-card p{margin:0;font-size:9.5px;line-height:1.48;color:#756a79}
      .tab-note{margin:9px 0 0;padding:9px 10px;border-radius:12px;background:rgba(255,252,247,.62);border:1px solid rgba(165,130,190,.18);font-size:9.3px;line-height:1.5;color:#756a79;text-align:left}
      .tab-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}.tab-actions button{flex:1;min-width:110px}
      #luneaTimingABAI{display:none;margin-top:8px;padding:11px;border-radius:12px;background:rgba(255,255,255,.68);border:1px solid rgba(157,126,180,.23);white-space:pre-wrap;font:400 11.5px 'Noto Serif KR',serif;line-height:1.7;color:#493e50;text-align:left}
      #luneaTimingABAI.show{display:block}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    let panel=$('luneaTimingABPanel');
    if (panel) return panel;
    const stage=document.querySelector('#timingOverlay .timing-stage');
    if (!stage) return null;
    panel=document.createElement('div'); panel.id='luneaTimingABPanel';
    panel.innerHTML='<div id="luneaTimingABCards"></div><div class="tab-actions"><button class="mini" id="luneaTimingABAIButton">🔮 A/B 시기 해석</button><button class="mini" id="luneaTimingABCopy">📋 A/B 결과 복사</button></div><div id="luneaTimingABAI"></div>';
    stage.insertAdjacentElement('afterbegin',panel);
    $('luneaTimingABAIButton').onclick=runAI;
    $('luneaTimingABCopy').onclick=copyResult;
    return panel;
  }

  function currentQuestion() { return String($('timingQuestion')?.value || '').trim(); }
  function isSupportMode() { return $('timingQuestionField')?.style.display === 'none'; }
  function clearAB() {
    abState.question=''; abState.mode=null; abState.A=null; abState.B=null; abState.ai=''; abState.analysis=null;
    const p=$('luneaTimingABPanel'); if (p) p.classList.remove('show');
    const out=$('luneaTimingABAI'); if (out) {out.classList.remove('show');out.textContent='';}
    W.LUNEA_TIMING_AB_LAST = null;
  }
  function setBaseStageVisible(visible) {
    ['timingFlip','timingResult','timingActions','timingAIText'].forEach(id=>{const el=$(id); if(el) el.style.display=visible?'':'none';});
  }
  function syncMode() {
    const q=currentQuestion(), pair=isPairQuestion(q), panel=ensurePanel();
    if (!panel) return;
    const btn=$('timingDraw'), help=$('timingHelp');
    panel.classList.toggle('show', pair && !!abState.A && abState.question===q);
    if (pair) {
      if (btn) btn.textContent='⏳ A/B 시기 카드 2장 뽑기';
      if (help) help.textContent='두 사람 질문은 한 장에 합치지 않고 A와 B에 시기 카드 1장씩 독립 추출해. 같은 카드가 둘 다 나올 수도 있어.';
      setBaseStageVisible(false);
    } else {
      clearAB();
      if (btn) btn.textContent='⏳ 시기 카드 한 장 뽑기';
      if (help) help.textContent='질문 범위에 맞는 시기 카드 1장을 뽑아. 한 사람에 대한 여러 시나리오/시점 비교는 두 사람 질문으로 보지 않아.';
      setBaseStageVisible(true);
      panel.classList.remove('show');
    }
  }

  function sig(question) { return norm(question).replace(/[^\p{L}\p{N}]+/gu,''); }
  function recent(question) {
    try { return (JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')).find(x=>x.sig===sig(question)&&Date.now()-x.at<REPEAT_MS); } catch { return null; }
  }
  function saveHistory(question,A,B) {
    try { const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); h.unshift({sig:sig(question),at:Date.now(),A:A.id,B:B.id}); localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,60))); } catch {}
  }

  function render() {
    const panel=ensurePanel(); if (!panel || !abState.A || !abState.B) return;
    setBaseStageVisible(false); panel.classList.add('show');
    const cardHTML=(label,c)=>`<div class="tab-card"><small>대상 ${label} · TIMING ORACLE</small><img src="./${encodeURIComponent(c.filename)}" alt="${esc(c.label_ko)}"><b>${esc(c.label_ko)}</b><em>${esc(c.label_en)}</em><p>${esc(c.meaning)}</p></div>`;
    $('luneaTimingABCards').innerHTML=`<div class="tab-grid">${cardHTML('A',abState.A)}${cardHTML('B',abState.B)}</div><div class="tab-note">A/B는 같은 질문 범위에서 각각 독립 추출했어. 동일 카드가 나와도 정상이며, 억지로 서로 다른 시기를 만들지 않아. 메인 타로가 사건 발생 자체를 약하게 보이면 이 카드만으로 연락·재회·행동을 확정하지 않아.</div>`;
    $('luneaTimingABAI').classList.remove('show'); $('luneaTimingABAI').textContent='';
  }

  async function performABDraw() {
    const q=currentQuestion();
    if (!q) return alert('시기를 묻는 질문을 적어줘.');
    if (!isPairQuestion(q)) return false;
    const old=recent(q);
    if (old && !confirm('최근 24시간 안에 같은 A/B 시기 질문을 이미 뽑았어.\n같은 질문을 불안해서 반복하기보다 기존 결과를 쓰는 편이 좋아.\n\n그래도 새로 뽑을까?')) return true;

    const btn=$('timingDraw'); if (btn){btn.disabled=true;btn.textContent='⏳ A/B 각각 추출 중…';}
    try {
      const cards=await loadDeck(); if (!cards.length) throw new Error('오라클 카드 데이터를 읽지 못했어.');
      const a=drawOne(cards,q), b=drawOne(cards,q);
      if (!a.card || !b.card) throw new Error('A/B 후보 카드 추출에 실패했어.');
      abState.question=q; abState.mode=isSupportMode()?'support':'standalone'; abState.A=a.card; abState.B=b.card; abState.ai=''; abState.analysis=a.analysis;
      W.LUNEA_TIMING_AB_LAST={question:q,mode:abState.mode,A:a.card,B:b.card,at:Date.now()};
      saveHistory(q,a.card,b.card); render();
      return true;
    } catch(e) { alert('A/B 시기 카드 오류: '+(e?.message||e)); return true; }
    finally { if(btn){btn.disabled=false;btn.textContent='⏳ A/B 시기 카드 2장 뽑기';} }
  }

  function resultText() {
    if (!abState.A || !abState.B) return '';
    return `LUNEA · TIMING ORACLE A/B\n\n[질문]\n${abState.question}\n\n[A]\n${abState.A.label_ko} (${abState.A.label_en})\n${abState.A.meaning}\n\n[B]\n${abState.B.label_ko} (${abState.B.label_en})\n${abState.B.meaning}${abState.ai?`\n\n[A/B AI 해석]\n${abState.ai}`:''}\n\n※ 각 대상 독립 추출. 동일 카드 가능. 사건 발생 자체를 확정하는 도구가 아님.`;
  }
  async function copyResult() {
    const text=resultText(); if(!text) return alert('먼저 A/B 시기 카드를 뽑아줘.');
    try { await navigator.clipboard.writeText(text); const b=$('luneaTimingABCopy'),old=b.textContent;b.textContent='✓ 복사 완료';setTimeout(()=>b.textContent=old,1400); }
    catch { alert('복사 권한을 확인해줘.'); }
  }
  async function runAI() {
    if (!abState.A || !abState.B) return alert('먼저 A/B 시기 카드를 뽑아줘.');
    const key=localStorage.getItem('LUNEA_API_KEY'), model=localStorage.getItem('LUNEA_MODEL')||'gemini-2.5-flash';
    if(!key) return alert('LUNEA API 설정을 먼저 해줘.');
    const btn=$('luneaTimingABAIButton'),out=$('luneaTimingABAI');btn.disabled=true;btn.textContent='🔮 해석 중…';out.classList.add('show');out.textContent='A/B 시기 신호를 각각 읽는 중…';
    const prompt=`당신은 타로의 시기 질문을 과장 없이 읽는 숙련된 리더다.\n\n[질문]\n${abState.question}\n\n[A 시기 카드]\n${abState.A.label_ko} (${abState.A.label_en}) — ${abState.A.meaning}\n\n[B 시기 카드]\n${abState.B.label_ko} (${abState.B.label_en}) — ${abState.B.meaning}\n\n[규칙]\n- A와 B를 각각 독립적으로 읽은 뒤 마지막에만 비교한다.\n- 어느 한 사람을 선택하라는 결론으로 바꾸지 않는다.\n- 같은 카드나 비슷한 시기가 나왔으면 억지 차이를 만들지 않는다.\n- 메인 타로가 사건 가능성을 약하게 보면 시기 카드만으로 사건을 확정하지 않는다.\n- 연락·재회·행동 여부를 질문하지 않았다면 자동 확장하지 않는다.\n- 지연/불발 신호면 날짜를 억지로 만들지 않는다.\n\n[출력]\n1. A 시기 신호\n2. B 시기 신호\n3. 공통점/차이\n4. 불확실성`;
    try { const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.55,topP:.9}})});const d=await r.json();if(d.error)throw new Error(d.error.message);abState.ai=d?.candidates?.[0]?.content?.parts?.[0]?.text||'응답이 비어 있어.';out.textContent=abState.ai; }
    catch(e){abState.ai='';out.textContent='[API 오류] '+(e?.message||e);} finally{btn.disabled=false;btn.textContent='🔮 A/B 시기 해석';}
  }

  function installPromptWrap() {
    if (W.__LUNEA_TIMING_AB_PROMPT_WRAPPED__) return;
    const prior=W.promptString || (typeof promptString==='function'?promptString:null);
    if(typeof prior!=='function') return;
    const wrapped=function(){let p=String(prior.apply(this,arguments)||'');let q='';try{q=String(state?.question||'').trim();}catch{}
      if(abState.mode==='support'&&abState.A&&abState.B&&abState.question===q&&isPairQuestion(q)){p+=`\n\n[LUNEA TIMING ORACLE A/B — 두 대상 독립 시기 보조]\n- A: ${abState.A.label_ko} / ${abState.A.label_en} — ${abState.A.meaning}\n- B: ${abState.B.label_ko} / ${abState.B.label_en} — ${abState.B.meaning}\n- A/B를 한 장으로 합치지 말고 각각 읽은 뒤 마지막에만 비교한다. 동일/유사 신호면 차이를 억지로 만들지 않는다. 시기 카드만으로 사건 발생을 확정하지 않는다.`;}return p;};
    wrapped.__luneaTimingABWrapped=true; W.promptString=wrapped; try{promptString=wrapped;}catch{} W.__LUNEA_TIMING_AB_PROMPT_WRAPPED__=true;
  }

  function install() {
    const draw=$('timingDraw'); if(!draw||draw.__luneaTimingABWrapped) return false;
    const original=draw.onclick; if(typeof original!=='function') return false;
    addStyles(); ensurePanel();
    draw.onclick=async function(event){const q=currentQuestion();if(isPairQuestion(q)){event?.preventDefault?.();return performABDraw();}clearAB();setBaseStageVisible(true);return original.call(this,event);};
    draw.__luneaTimingABWrapped=true;
    $('timingQuestion')?.addEventListener('input',()=>{if(abState.question!==currentQuestion()){$('luneaTimingABPanel')?.classList.remove('show');}syncMode();});
    const ov=$('timingOverlay');if(ov&&!ov.__luneaTimingABObserved){new MutationObserver(()=>{if(ov.classList.contains('show'))setTimeout(syncMode,0);}).observe(ov,{attributes:true,attributeFilter:['class']});ov.__luneaTimingABObserved=true;}
    installPromptWrap(); syncMode(); return true;
  }

  function boot(){let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(timer);},120);install();W.LUNEA_TIMING_AB={isPairQuestion,state:abState};console.info('⏳ LUNEA Timing Oracle A/B V2 loaded');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
