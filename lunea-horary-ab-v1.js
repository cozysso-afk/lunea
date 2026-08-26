'use strict';

/*
  LUNEA HORARY MULTI-TARGET GUARD V2
  ==================================
  Traditional-method safety layer for compound person questions.

  - A/B or multi-person questions are NOT split into artificial 5H/7H roles.
  - Same-category people at one question moment are NOT given separate significators without a non-arbitrary basis.
  - Re-asking A and B seconds/minutes apart merely to manufacture separate charts is discouraged.
  - Automatic horary calculation is skipped for compound multi-person comparisons.
  - Single-person horary remains completely unchanged.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_MULTI_GUARD_V2__) return;
  W.__LUNEA_HORARY_MULTI_GUARD_V2__ = true;

  const $ = id => document.getElementById(id);
  const norm = v => String(v || '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function isMultiPersonQuestion(question) {
    const q = norm(question);
    if (!q) return false;

    const explicitPair = /(?:\bA\s*(?:와|과|랑|\/|·|및|,|그리고)\s*B\b|A와B|A\/B|A·B|두\s*(?:사람|명|인연|상대)|2\s*(?:사람|명)|둘\s*(?:다|은|이|의)?|각각)/i.test(q);
    const parallelNames = /(?:A[^\n]{0,45}B|B[^\n]{0,45}A)/i.test(q);
    const relational = /(상대|사람|인연|전남친|전여친|전애인|구남친|구여친|연인|이성|썸|친구|지인|동료|직장동료|상사|부하|배우자|남편|아내)/i.test(q);
    const personPredicate = /(생각|떠올|의식|기억|마음|감정|정서|호감|그리움|후회|궁금|연락|카톡|메시지|전화|만나|재회|관계|나를\s*보|내게\s*느끼|나한테\s*느끼)/i.test(q);
    return (explicitPair || parallelNames) && (relational || personPredicate);
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

  function reasonFor(question) {
    const roles = roleClassSummary(question);
    if (roles.length <= 1) {
      return 'A와 B가 질문자에게 동일하거나 구분 근거가 불분명한 관계 범주의 두 대상이므로, 이름 순서만으로 7하우스와 다른 하우스를 임의 배정할 수 없어.';
    }
    return 'A와 B의 관계 역할이 서로 다를 가능성은 있지만, 현재 자동 엔진은 복합 질문에서 파생 하우스를 비임의적으로 확정하는 규칙을 갖고 있지 않아. 잘못된 자동 배정보다 개별 판정을 생략하는 편이 안전해.';
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
    const panel = ensureGuardPanel();
    if (!panel) return;
    const q = norm($('astroHoraryQuestion')?.value || '');
    const multi = isMultiPersonQuestion(q);
    panel.classList.toggle('show', multi);
    if (!multi) {
      panel.innerHTML = '';
      return;
    }
    panel.innerHTML = `<b>☿ 다중 대상 호라리 · 개별 비교 자동 판정 생략</b>
      ${reasonFor(q)}
      <div class="hg-small">같은 시각의 한 차트에서 두 사람을 하나의 7하우스 대상처럼 뭉개거나, A=7하우스 / B=5하우스처럼 이름 순서만으로 갈라놓지 않아. 또한 비교 결과를 만들기 위해 몇 초·몇 분 차이로 같은 질문을 반복해 별도 차트를 만드는 방식도 사용하지 않아.<br><br>권장: 이 질문은 A/B 대칭 타로로 비교하고, 호라리는 “A가 오늘 나를 의식하는가?”처럼 한 사람에 대한 독립 질문이 실제로 생겼을 때 그 질문 시각으로 계산해.</div>`;
  }

  function installRunGuard() {
    const run = $('astroHoraryRun');
    if (!run || run.__luneaMultiTargetGuard) return !!run;
    const original = run.onclick;
    if (typeof original !== 'function') return false;

    run.onclick = function(event) {
      const q = norm($('astroHoraryQuestion')?.value || '');
      if (isMultiPersonQuestion(q)) {
        event?.preventDefault?.();
        clearComputedUI();
        syncGuard();
        const status = $('astroHoraryStatus');
        if (status) {
          status.className = 'horary-status err';
          status.textContent = '개별 비교 판정 생략 · 다중 동일/복합 대상에 비임의적인 시그니피케이터 분리 근거가 부족해. A/B 대칭 타로를 사용하거나 한 사람씩 실제 독립 질문으로 물어봐.';
        }
        return;
      }
      return original.call(this, event);
    };
    run.__luneaMultiTargetGuard = true;

    const q = $('astroHoraryQuestion');
    q?.addEventListener('input', syncGuard);
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
    W.LUNEA_HORARY_MULTI_GUARD = { isMultiPersonQuestion, roleClassSummary };
    console.info('☿ LUNEA Horary Multi-Target Guard V2 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
