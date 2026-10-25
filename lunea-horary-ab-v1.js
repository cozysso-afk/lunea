'use strict';

/*
  LUNEA HORARY MULTI-TARGET GUARD V3
  ==================================
  Traditional-method safety layer for compound person questions.

  - A/B or genuinely multi-person questions are NOT split into artificial 5H/7H roles.
  - Same-category people at one question moment are NOT given separate significators without a non-arbitrary basis.
  - Scenario words such as "각각" do NOT by themselves mean multiple people.
  - Re-asking A and B seconds/minutes apart merely to manufacture separate charts is discouraged.
  - A shared chart may be calculated, but individual judgments require justified distinct house roles.
  - Single-person horary remains completely unchanged.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_MULTI_GUARD_V3__) return;
  W.__LUNEA_HORARY_MULTI_GUARD_V3__ = true;

  const $ = id => document.getElementById(id);
  const norm = v => String(v || '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function isMultiPersonQuestion(question) {
    const q = norm(question);
    if (!q) return false;

    // IMPORTANT: "각각" is intentionally NOT a multi-person marker.
    // It often describes multiple timings/options for one person, e.g.
    // "지금/몇 시간 뒤/내일 각각 A의 반응은?"
    const explicitPair = /(?:\bA\s*(?:와|과|랑|\/|·|및|,|그리고)\s*B\b|A와B|A\/B|A·B|두\s*(?:사람|명|인연|상대|대상)|2\s*(?:사람|명|인연|상대|대상)|둘\s*(?:다|은|이|의)?)/i.test(q);

    // A and B must both appear as actual target labels in a compact relationship/comparison phrase.
    // A lone "A" plus unrelated Latin text must never trigger this branch.
    const parallelLabels = /(?:\bA\b[^\n]{0,55}\bB\b|\bB\b[^\n]{0,55}\bA\b)/i.test(q);
    const comparisonConnector = /(?:비교|둘|두\s*(?:사람|명|대상)|각\s*(?:사람|대상)|서로|A\s*(?:와|과|랑|\/|·|및|,|그리고)\s*B)/i.test(q);

    const relational = /(상대|사람|인연|전남친|전여친|전애인|구남친|구여친|연인|이성|썸|친구|지인|동료|직장동료|상사|부하|배우자|남편|아내)/i.test(q);
    const personPredicate = /(생각|떠올|의식|기억|마음|감정|정서|호감|그리움|후회|궁금|연락|카톡|메시지|전화|dm|디엠|답장|만나|재회|관계|나를\s*보|내게\s*느끼|나한테\s*느끼)/i.test(q);

    const twoTargets = explicitPair || (parallelLabels && comparisonConnector);
    return twoTargets && (relational || personPredicate);
  }

  function roleClassSummary(question) {
    const q = norm(question);
    const classes = [];
    if (/(전남친|전여친|전애인|구남친|구여친|과거\s*인연|연인|이성\s*인연|썸)/i.test(q)) classes.push('연애·과거 이성 인연');
    if (/(친구|지인)/i.test(q)) classes.push('친구·지인');
    if (/(직장동료|동료|상사|부하|직장)/i.test(q)) classes.push('직장 관계');
    if (/(배우자|남편|아내)/i.test(q)) classes.push('배우자');
    return [...new Set(classes)];
  }


  // Only explicit labelled roles count. The name order never assigns houses.
  // Conservative conventional relation categories: spouse/partner=7H, friend=11H.
  function resolveTargets(question) {
    const q=norm(question);
    const map={배우자:7,남편:7,아내:7,연인:7,전남친:7,전여친:7,전애인:7,친구:11,지인:11};
    const one=label=>{
      const match=q.match(new RegExp(label+'\\s*(?:는|은|[:=：])\\s*(?:내\\s*)?(배우자|남편|아내|연인|전남친|전여친|전애인|친구|지인)(?![가-힣])','i'));
      return match?{label,role:match[1],house:map[match[1]]}:null;
    };
    const A=one('A'),B=one('B');
    return {A,B,assignable:!!(A && B && A.house!==B.house),multi:isMultiPersonQuestion(q)};
  }

  function reasonFor(question) {
    const roles=resolveTargets(question);
    if(roles.assignable) return '질문에 명시된 관계 역할이 달라 7H와 11H를 각각 검토할 수 있어. 이는 이름 순서가 아닌 실제 역할에 따른 배정이야.';
    return 'A/B가 같은 관계 범주이거나 질문에서 각각의 역할이 확정되지 않았어. 한 시각의 차트는 계산하지만 두 사람에게 임의 하우스를 배정하거나 누가 연락할지를 판정하지 않아.';
  }

  const RULERS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  function houseEvidence(data,house){
    const lon=Number(data?.cusps?.[house-1]);
    if(!Number.isFinite(lon))return null;
    const ruler=RULERS[Math.floor((((lon%360)+360)%360)/30)];
    const p=data?.planets?.[ruler]||{};
    return {ruler,sign:p.sign||p.sign_en||'—',degree:p.degree??'—',house:p.house??'—',dignity:p.dignity_ko||p.dignity||'—'};
  }
  function renderRoleEvidence(question) {
    const panel=$('luneaHoraryMultiGuard');
    if(!panel)return;
    panel.querySelector('#luneaHoraryABEvidence')?.remove();
    const roles=resolveTargets(question);
    if(!roles.multi)return;
    const data=W.LUNEA_ASTRO_HORARY_V1?.getCurrent?.();
    if(!data || !$('astroHoraryResult')?.classList.contains('show'))return;
    const evidence=document.createElement('div');
    evidence.id='luneaHoraryABEvidence';
    evidence.className='hg-small';
    if(!roles.assignable) {
      evidence.textContent='차트 계산 완료 · 이 결과는 질문 시각의 공통 배경 근거야. A/B 각각의 연락·시기·승패로 해석할 수는 없어.';
    } else {
      const segments=[roles.A,roles.B].map(target=>{
        const e=houseEvidence(data,target.house);
        return e?`${target.label}(${target.role}) · ${target.house}H 주인성 ${e.ruler} · ${e.sign} ${e.degree}° · 배치 ${e.house}H · 상태 ${e.dignity}`
          :`${target.label}(${target.role}) · ${target.house}H · 차트 주인성 근거 없음`;
      });
      evidence.textContent='관계 역할에 따른 개별 시그니피케이터(승패·연락 확정 판정 아님): '+segments.join(' / ');
    }
    panel.appendChild(evidence);
  }

  function addStyles() {
    if ($('luneaHoraryMultiGuardStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryMultiGuardStyle';
    style.textContent = `
      #luneaHoraryMultiGuard{display:none;margin:9px 0 10px;padding:11px 12px;border-radius:13px;background:rgba(255,210,125,.055);border:1px solid rgba(255,210,125,.24);font-size:9.8px;line-height:1.58;color:#e8dfcb}
      #luneaHoraryMultiGuard.show{display:block}
      #luneaHoraryMultiGuard b{display:block;margin-bottom:4px;color:var(--gold);font-size:10.5px}
      #luneaHoraryMultiGuard .hg-small{margin-top:6px;color:var(--dim);font-size:9.2px;line-height:1.55}
    `;
    document.head.appendChild(style);
  }

  function ensureGuardPanel() {
    let panel = $('luneaHoraryMultiGuard');
    if (panel) return panel;
    const run = $('astroHoraryRun');
    if (!run) return null;
    panel = document.createElement('div');
    panel.id = 'luneaHoraryMultiGuard';
    run.insertAdjacentElement('beforebegin', panel);
    return panel;
  }

  function clearComputedUI() {
    const result = $('astroHoraryResult');
    const actions = $('astroHoraryActions');
    const ai = $('astroHoraryAIText');
    if (result) { result.classList.remove('show'); result.innerHTML = ''; }
    if (actions) actions.classList.remove('show');
    if (ai) { ai.classList.remove('show'); ai.textContent = ''; }
    $('luneaHoraryInline')?.remove();
  }


  function syncGuard() {
    const panel=ensureGuardPanel();
    if(!panel)return;
    const question=norm($('astroHoraryQuestion')?.value||'');
    const multi=isMultiPersonQuestion(question);
    panel.classList.toggle('show',multi);
    if(!multi){
      panel.replaceChildren();
      return;
    }
    const roles=resolveTargets(question);
    const header=document.createElement('b');
    header.textContent=roles.assignable?'☿ A/B 역할별 호라리 근거 · 한 차트':'☿ A/B 공통 차트 · 개별 인물 판정 보류';
    const note=document.createElement('div');
    note.textContent=reasonFor(question);
    const guidance=document.createElement('div');
    guidance.className='hg-small';
    guidance.textContent='같은 시각의 질문은 한 차트만 계산해. 별도 하우스나 몇 분 차이로 새 차트를 만들어 A/B 결과를 조작하지 않아. 구별 가능한 관계 역할을 질문에 명시하면 하우스별 행성 근거를 보여줘.';
    panel.replaceChildren(header,note,guidance);
    renderRoleEvidence(question);
  }

  function installRunGuard() {
    const run = $('astroHoraryRun');
    if (!run || run.__luneaMultiTargetGuard) return !!run;
    const original = run.onclick;
    if (typeof original !== 'function') return false;


    run.onclick=function(event){
      syncGuard();
      return original.call(this,event);
    };
    run.__luneaMultiTargetGuard = true;

    const q = $('astroHoraryQuestion');
    q?.addEventListener('input', syncGuard);
    const result=$('astroHoraryResult');
    if(result && !result.__luneaMultiEvidenceObserved){
      new MutationObserver(()=>{if(result.classList.contains('show'))syncGuard();}).observe(result,{attributes:true,attributeFilter:['class'],childList:true});
      result.__luneaMultiEvidenceObserved=true;
    }
    const overlay = $('astroHoraryOverlay');
    if (overlay && !overlay.__luneaMultiGuardObserved) {
      new MutationObserver(syncGuard).observe(overlay, {attributes:true, attributeFilter:['class']});
      overlay.__luneaMultiGuardObserved = true;
    }
    syncGuard();
    return true;
  }

  function boot() {
    addStyles();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installRunGuard() || tries > 80) clearInterval(timer);
    }, 125);
    installRunGuard();
    W.LUNEA_HORARY_MULTI_GUARD = { isMultiPersonQuestion, roleClassSummary, resolveTargets };
    console.info('☿ LUNEA Horary Multi-Target Guard V3 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
