'use strict';

/*
  LUNEA UNIVERSAL AI SPREAD + OPAL LIGHT V20
  ==========================================
  - Adds AI custom spread entry to GENERAL / CAREER / LOVE / STOCK tarot cabinets.
  - Reuses the existing casebook-grounded AI spread designer.
  - AI proposes a concise 2~12-card structure; user can manually extend the
    confirmed preview up to 20 cards before RNG draw.
  - Explicit two-person A/B questions keep the existing 12+12 = 24-card route.
  - User edits are forwarded to the existing local spread-correction learning memory.
  - DAILY / Timing Oracle / Horary behavior is untouched.
  - Adds a restrained opal / moonlight shimmer layer without changing reading logic.
*/
(() => {
  const W = window;
  if (W.__LUNEA_UNIVERSAL_AI_OPAL_V20__) return;
  W.__LUNEA_UNIVERSAL_AI_OPAL_V20__ = true;
  document.documentElement.classList.add('lunea-universal-ai-opal-v20');

  const MAX_USER = 20;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const byId = id => document.getElementById(id);
  const clean = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const stripNum = value => String(value || '').replace(/^\s*\d{1,2}\s*[.)]\s*/, '').trim();
  const getState = () => { try { return state; } catch { return null; } };

  const CATEGORY_META = [
    {
      key: 'GENERAL', match: /GENERAL|AI CUSTOM/i,
      title: '질문 맞춤 AI 배열',
      desc: '질문 구조를 분석해 필요한 카드 수와 포지션을 자동 설계'
    },
    {
      key: 'CAREER', match: /CAREER|EXAM/i,
      title: '진로·시험 AI 맞춤 배열',
      desc: '시험·직장·진로·금전 질문에 맞춰 필요한 축을 자동 설계'
    },
    {
      key: 'LOVE', match: /LOVE|HEART/i,
      title: '연애·관계 AI 맞춤 배열',
      desc: '속마음·연락·재회·관계 질문을 분석해 필요한 축을 자동 설계'
    },
    {
      key: 'STOCK', match: /STOCK|TRADING/i,
      title: '투자 AI 맞춤 배열',
      desc: '매수·보유·익절·매도 질문의 근거·반증·리스크 축을 자동 설계'
    }
  ];

  function isExplicitPairQuestion(question) {
    const q = clean(question);
    const explicitPair = /(?:\bA\s*(?:와|과|랑|\/|·|및|,|그리고)\s*B\b|A와B|A\/B|A·B|두\s*(?:사람|명|인연|상대|대상)|2\s*(?:사람|명|인연|상대|대상))/i.test(q);
    const peopleCue = /(사람|상대|인연|전남친|전여친|전애인|구남친|구여친|구썸|썸남|썸녀|연인|이성|지인|동료|대상)/i.test(q);
    return explicitPair && peopleCue;
  }

  function linesFrom(value, limit = Infinity) {
    return String(value || '')
      .split(/\n+/)
      .map(stripNum)
      .filter(Boolean)
      .slice(0, limit);
  }

  function samePositions(a, b) {
    const A = (Array.isArray(a) ? a : []).map(stripNum).filter(Boolean);
    const B = (Array.isArray(b) ? b : []).map(stripNum).filter(Boolean);
    return A.length === B.length && A.every((x, i) => x === B[i]);
  }

  function addStyles() {
    if (byId('luneaUniversalAiOpalV20Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaUniversalAiOpalV20Style';
    style.textContent = `
      @keyframes luneaV20OpalSweep{
        0%,14%{transform:translateX(-145%) skewX(-16deg);opacity:0}
        24%{opacity:.12}
        45%{opacity:.42}
        64%{opacity:.10}
        72%,100%{transform:translateX(160%) skewX(-16deg);opacity:0}
      }
      @keyframes luneaV20PearlBreath{
        0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 10px 28px rgba(0,0,0,.16),0 0 16px rgba(167,139,226,.04)}
        50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.085),0 12px 31px rgba(0,0,0,.17),0 0 30px rgba(175,147,235,.10),0 0 22px rgba(116,183,213,.055)}
      }
      @keyframes luneaV20ButtonGlow{
        0%,100%{background-position:0% 50%;filter:saturate(.96) brightness(.98)}
        50%{background-position:100% 50%;filter:saturate(1.05) brightness(1.045)}
      }

      /* Home cabinet: more luminous, still dark and restrained. */
      html.lunea-universal-ai-opal-v20 .lunea-v8-tile{
        border-color:rgba(226,230,244,.16)!important;
        background:
          radial-gradient(circle at 18% 5%,rgba(239,229,255,.145),transparent 27%),
          radial-gradient(circle at 91% 90%,rgba(129,207,223,.075),transparent 33%),
          radial-gradient(circle at 58% 105%,rgba(247,207,230,.040),transparent 35%),
          linear-gradient(148deg,rgba(21,23,45,.91),rgba(7,9,22,.985))!important;
        animation:luneaV20PearlBreath 8s ease-in-out infinite;
      }
      html.lunea-universal-ai-opal-v20 .lunea-v8-object{
        border-color:rgba(240,241,250,.28)!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.18),
          inset 0 0 21px rgba(224,215,250,.07),
          0 0 20px rgba(184,160,236,.085)!important;
      }
      html.lunea-universal-ai-opal-v20 .daily{
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.12),
          0 22px 50px rgba(0,0,0,.27),
          0 0 38px rgba(145,119,210,.095),
          0 0 26px rgba(103,174,205,.04)!important;
      }
      html.lunea-universal-ai-opal-v20 .daily .primary,
      html.lunea-universal-ai-opal-v20 #drawBtn,
      html.lunea-universal-ai-opal-v20 #luneaV20PreviewConfirm{
        background-size:240% 240%!important;
        background-image:linear-gradient(112deg,#e7d8ff 0%,#bba3ee 24%,#dce5f3 48%,#91c6e0 68%,#efd5ee 84%,#c9b5f5 100%)!important;
        animation:luneaV20ButtonGlow 8.5s ease-in-out infinite!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.62),
          0 11px 30px rgba(89,74,151,.27),
          0 0 26px rgba(195,173,244,.15),
          0 0 17px rgba(133,197,220,.08)!important;
      }

      /* Universal AI entry inside each real tarot cabinet. */
      .lunea-v20-ai-entry{
        position:relative!important;overflow:hidden!important;
        margin:5px -4px 7px!important;padding:13px 12px!important;border-radius:16px!important;
        border:1px solid rgba(222,224,242,.14)!important;
        background:
          radial-gradient(circle at 8% 12%,rgba(226,211,255,.14),transparent 27%),
          radial-gradient(circle at 92% 78%,rgba(119,190,215,.08),transparent 32%),
          linear-gradient(145deg,rgba(43,37,70,.42),rgba(12,15,31,.58))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 0 22px rgba(155,127,216,.055)!important;
      }
      .lunea-v20-ai-entry::after{
        content:'';position:absolute;top:-35%;bottom:-35%;left:-28%;width:34%;pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.20),rgba(201,227,241,.10),transparent);
        filter:blur(3px);animation:luneaV20OpalSweep 7.2s ease-in-out infinite;
      }
      .lunea-v20-ai-entry h4{color:#f5f2fb!important;font-size:13.5px!important}
      .lunea-v20-ai-entry p{color:#aaa8bc!important;font-size:10.8px!important;line-height:1.45!important}
      .lunea-v20-ai-entry .count{
        color:#eee8ff!important;border-color:rgba(211,197,244,.22)!important;
        background:linear-gradient(145deg,rgba(185,158,235,.14),rgba(104,156,194,.075))!important;
        box-shadow:0 0 15px rgba(172,144,226,.07)!important;
      }
      .lunea-v20-ai-chip{
        position:absolute;right:11px;bottom:10px;z-index:3;padding:3px 6px;border-radius:999px;
        color:#cfc5e8;font:700 7px 'Cinzel',serif;letter-spacing:.7px;
        border:1px solid rgba(225,227,241,.12);background:rgba(224,214,249,.045);
        pointer-events:none
      }

      /* 20-card editable AI preflight. */
      #luneaV20PreviewOverlay{
        position:fixed;inset:0;z-index:470;display:none;align-items:center;justify-content:center;
        padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));
        background:
          radial-gradient(circle at 50% 0%,rgba(127,100,191,.14),transparent 34%),
          rgba(3,4,12,.955);
        backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)
      }
      #luneaV20PreviewOverlay.show{display:flex}
      #luneaV20PreviewModal{
        width:100%;max-width:440px;max-height:calc(100dvh - 24px);overflow-y:auto;-webkit-overflow-scrolling:touch;
        position:relative;padding:21px 16px calc(25px + env(safe-area-inset-bottom));border-radius:28px;
        color:#f5f3fa;border:1px solid rgba(230,232,245,.18);
        background:
          radial-gradient(circle at 88% 0%,rgba(193,164,239,.16),transparent 26%),
          radial-gradient(circle at 10% 28%,rgba(104,175,207,.08),transparent 26%),
          linear-gradient(163deg,#12152b 0%,#090c1b 66%,#070915 100%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.085),0 30px 76px rgba(0,0,0,.72),0 0 42px rgba(148,119,215,.085)
      }
      #luneaV20PreviewModal::before{
        content:'';position:absolute;inset:0;pointer-events:none;opacity:.36;border-radius:inherit;
        background-image:
          radial-gradient(circle at 10% 12%,rgba(255,255,255,.75) 0 1px,transparent 1.5px),
          radial-gradient(circle at 89% 18%,rgba(209,224,248,.62) 0 1px,transparent 1.5px),
          radial-gradient(circle at 78% 68%,rgba(207,184,244,.55) 0 1px,transparent 1.5px),
          radial-gradient(circle at 20% 82%,rgba(255,255,255,.35) 0 1px,transparent 1.4px)
      }
      #luneaV20PreviewClose{
        position:absolute;right:14px;top:12px;z-index:3;width:34px;height:34px;border-radius:50%;
        display:grid;place-items:center;border:1px solid rgba(225,228,241,.10);background:rgba(255,255,255,.04);
        color:#b9bac9;font-size:21px
      }
      .lunea-v20-kicker{position:relative;z-index:1;color:#c8bae9;font:700 9px 'Cinzel',serif;letter-spacing:1.8px;margin-right:40px}
      .lunea-v20-title{position:relative;z-index:1;margin:6px 40px 15px 0;color:#faf8fd;font:500 23px/1.3 'Noto Serif KR',serif}
      .lunea-v20-intent{
        position:relative;z-index:1;margin-bottom:13px;padding:13px 14px;border-radius:17px;
        border:1px solid rgba(192,225,222,.12);
        background:linear-gradient(145deg,rgba(101,165,157,.075),rgba(111,112,173,.045))
      }
      .lunea-v20-intent b{display:block;margin-bottom:4px;color:#c9eadf;font-size:11px}
      .lunea-v20-intent span{display:block;color:#e9e8f1;font-size:12.5px;line-height:1.55}
      .lunea-v20-intent small{display:block;margin-top:5px;color:#9697aa;font-size:10.5px;line-height:1.5}
      #luneaV20PreviewModal label{display:block;position:relative;z-index:1;margin:12px 1px 6px;color:#dcdbe7;font-size:12px;font-weight:700}
      #luneaV20PreviewTitle,
      #luneaV20PreviewPositions{
        position:relative;z-index:1;width:100%;color:#f5f4fa;border:1px solid rgba(225,227,241,.12);
        background:rgba(255,255,255,.038);border-radius:15px;outline:none
      }
      #luneaV20PreviewTitle{min-height:46px;padding:11px 13px;font-size:13px}
      #luneaV20PreviewPositions{min-height:270px;padding:13px 14px;resize:vertical;font-size:13px;line-height:1.62}
      #luneaV20PreviewTitle:focus,#luneaV20PreviewPositions:focus{border-color:rgba(205,187,244,.42);box-shadow:0 0 0 3px rgba(166,137,226,.06)}
      #luneaV20PreviewCount{position:relative;z-index:1;margin:7px 2px 0;color:#c6b7e8;font-size:11px;font-weight:700}
      #luneaV20PreviewCount.over{color:#ff9eb2}
      .lunea-v20-actions{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1.28fr;gap:8px;margin-top:13px}
      .lunea-v20-actions button{min-height:49px;border-radius:15px;font-size:12.5px;font-weight:700}
      #luneaV20PreviewRegenerate{color:#d9d7e6;border:1px solid rgba(222,224,239,.11);background:rgba(255,255,255,.04)}
      #luneaV20PreviewConfirm{color:#28203f;border:1px solid rgba(255,255,255,.36)}
      .lunea-v20-note{position:relative;z-index:1;margin:10px 2px 0;color:#8f90a3;font-size:10.5px;line-height:1.58}
      .lunea-v20-limit{color:#d7c9f2}

      /* Reading table catches a little moonlight around the actual cards. */
      html.lunea-universal-ai-opal-v20 #cards{
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.025),
          inset 0 0 48px rgba(84,62,133,.035),
          0 0 28px rgba(115,91,176,.028)!important;
      }
      html.lunea-universal-ai-opal-v20 .tarot-card-wrapper .back{
        box-shadow:inset 0 0 20px rgba(164,137,219,.055),0 0 14px rgba(151,124,210,.045)!important
      }
      html.lunea-universal-ai-opal-v20 .tarot-card-wrapper .back img{
        filter:saturate(.98) brightness(.99) contrast(1.015)
      }

      @media(max-width:390px){
        #luneaV20PreviewModal{padding-left:15px;padding-right:15px}
        .lunea-v20-title{font-size:21px}
        #luneaV20PreviewPositions{min-height:245px;font-size:12.5px}
        .lunea-v20-actions{grid-template-columns:1fr}
        .lunea-v20-actions button{min-height:48px}
      }
      @media(prefers-reduced-motion:reduce){
        html.lunea-universal-ai-opal-v20 .lunea-v8-tile,
        html.lunea-universal-ai-opal-v20 .daily .primary,
        html.lunea-universal-ai-opal-v20 #drawBtn,
        html.lunea-universal-ai-opal-v20 #luneaV20PreviewConfirm,
        .lunea-v20-ai-entry::after{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePreview() {
    let overlay = byId('luneaV20PreviewOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'luneaV20PreviewOverlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div id="luneaV20PreviewModal" role="dialog" aria-modal="true" aria-labelledby="luneaV20PreviewHeading">
        <button type="button" id="luneaV20PreviewClose" aria-label="배열 확인 닫기">×</button>
        <div class="lunea-v20-kicker">LUNEA · AI SPREAD STUDIO</div>
        <h3 class="lunea-v20-title" id="luneaV20PreviewHeading">카드 뽑기 전 배열 확인</h3>
        <div class="lunea-v20-intent">
          <b>AI가 이해한 질문의 핵심</b>
          <span id="luneaV20PreviewIntent"></span>
          <small id="luneaV20PreviewMeta"></small>
        </div>
        <label for="luneaV20PreviewTitle">스프레드 이름</label>
        <input id="luneaV20PreviewTitle" autocomplete="off">
        <label for="luneaV20PreviewPositions">카드 포지션 · 한 줄에 한 자리</label>
        <textarea id="luneaV20PreviewPositions"></textarea>
        <div id="luneaV20PreviewCount"></div>
        <div class="lunea-v20-actions">
          <button type="button" id="luneaV20PreviewRegenerate">↻ 다른 배열</button>
          <button type="button" id="luneaV20PreviewConfirm">✦ 이 배열로 카드 뽑기</button>
        </div>
        <div class="lunea-v20-note">AI는 필요한 만큼 간결하게 제안하고, 네가 직접 줄을 추가하거나 지워 <span class="lunea-v20-limit">최대 ${MAX_USER}장</span>까지 확장할 수 있어. 확정 전에는 RNG 카드가 생성되지 않아.</div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function previewMeta(sp) {
    const meta = sp?._luneaPreflight || {};
    const bits = [
      meta.targetStructure,
      meta.primaryIntent,
      meta.timeScope && meta.timeScope !== '미지정' ? `기간: ${meta.timeScope}` : '',
      `AI 제안 ${Math.min(12, Array.isArray(sp?.positions) ? sp.positions.length : 0)}장 · 수동 확장 최대 ${MAX_USER}장`
    ].filter(Boolean);
    return bits.join(' · ');
  }

  function openV20Preview(question, initial) {
    const overlay = ensurePreview();
    const title = byId('luneaV20PreviewTitle');
    const positions = byId('luneaV20PreviewPositions');
    const intent = byId('luneaV20PreviewIntent');
    const meta = byId('luneaV20PreviewMeta');
    const count = byId('luneaV20PreviewCount');
    const close = byId('luneaV20PreviewClose');
    const regenerate = byId('luneaV20PreviewRegenerate');
    const confirm = byId('luneaV20PreviewConfirm');
    let current = initial;
    let baseline = {
      spreadTitle: clean(initial?.spreadTitle),
      positions: (initial?.positions || []).map(stripNum).filter(Boolean)
    };

    const syncCount = () => {
      const all = linesFrom(positions.value);
      count.textContent = `현재 ${all.length}/${MAX_USER}장 · AI 제안은 최대 12장, 네 수정은 최대 ${MAX_USER}장`;
      count.classList.toggle('over', all.length > MAX_USER);
    };

    const fill = sp => {
      current = sp || current;
      title.value = clean(current?.spreadTitle) || '질문 맞춤 배열';
      positions.value = (current?.positions || []).map(stripNum).filter(Boolean).join('\n');
      intent.textContent = clean(current?._luneaPreflight?.intentSummary) || 'LUNEA 질문 구조 분석 결과';
      meta.textContent = previewMeta(current);
      baseline = {
        spreadTitle: clean(current?.spreadTitle),
        positions: (current?.positions || []).map(stripNum).filter(Boolean)
      };
      syncCount();
    };

    fill(initial);
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    return new Promise(resolve => {
      let done = false;
      const finish = value => {
        if (done) return;
        done = true;
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
        resolve(value);
      };

      positions.oninput = syncCount;
      close.onclick = () => finish(null);
      overlay.onclick = event => { if (event.target === overlay) finish(null); };

      regenerate.onclick = async () => {
        regenerate.disabled = true;
        confirm.disabled = true;
        const old = regenerate.textContent;
        regenerate.textContent = '질문 다시 분석 중…';
        try {
          const designer = W.LUNEA_AI_SPREAD_PREFLIGHT?.design;
          if (typeof designer !== 'function') throw new Error('AI spread designer unavailable');
          const avoid = linesFrom(positions.value, MAX_USER);
          const next = await designer(question, {regenerate:true, avoid});
          if (!next || !Array.isArray(next.positions) || next.positions.length < 2) throw new Error('empty spread');
          fill(next);
        } catch (error) {
          console.error('[LUNEA V20] regenerate failed', error);
          alert('다른 배열 생성에 실패했어. 현재 배열은 그대로 둘게.');
        } finally {
          regenerate.disabled = false;
          confirm.disabled = false;
          regenerate.textContent = old;
        }
      };

      confirm.onclick = () => {
        const all = linesFrom(positions.value);
        if (all.length < 2) return alert('카드 포지션을 최소 2개는 남겨줘.');
        if (all.length > MAX_USER) return alert(`AI 맞춤 배열을 네가 수정할 때는 총 ${MAX_USER}장까지 가능해. 지금 ${all.length}장이야.`);
        const finalTitle = clean(title.value) || clean(current?.spreadTitle) || '질문 맞춤 배열';
        const numbered = all.map((x, i) => `${i + 1}. ${x}`);
        const rationale = `${String(current?.designRationale || 'LUNEA AI 질문 구조 기반 설계')} · PRE-DRAW USER CONFIRMED · USER_EDIT_MAX_${MAX_USER}`;

        const changed = finalTitle !== baseline.spreadTitle || !samePositions(baseline.positions, all);
        if (changed && W.LUNEA_SPREAD_LEARNING_V1?.record) {
          try {
            W.LUNEA_SPREAD_LEARNING_V1.record({
              question,
              originalSpread:{spreadTitle:baseline.spreadTitle, positions:baseline.positions},
              correctedSpread:{spreadTitle:finalTitle, positions:numbered},
              meta:current?._luneaPreflight || {}
            });
          } catch (error) {
            console.warn('[LUNEA V20] correction learning failed', error);
          }
        }

        finish({...current, spreadTitle:finalTitle, positions:numbered, designRationale:rationale});
      };
    });
  }

  function categoryFromHeader(category) {
    const text = clean(category.querySelector('.cat-text h3')?.textContent || category.querySelector('.category-header')?.textContent || '');
    return CATEGORY_META.find(meta => meta.match.test(text)) || null;
  }

  function markExistingAI(category, meta) {
    const items = $$('.reading-item', category);
    const existing = items.find(item => item.dataset.count === '0' || /AI.*(?:맞춤|배열)|맞춤.*AI/i.test(clean(item.textContent)));
    if (!existing) return false;
    existing.classList.add('lunea-v20-ai-entry');
    existing.dataset.luneaUniversalAi = '1';
    if (!existing.querySelector('.count')) {
      const badge = document.createElement('span');
      badge.className = 'count';
      badge.textContent = 'AI · 2~12 → 20';
      existing.appendChild(badge);
    } else {
      existing.querySelector('.count').textContent = 'AI · 2~12 → 20';
    }
    return true;
  }

  function addAIEntry(category, meta) {
    const content = category.querySelector('.category-content');
    if (!content || content.querySelector('[data-lunea-universal-ai="1"]')) return false;
    const item = document.createElement('div');
    item.className = 'reading-item lunea-v20-ai-entry';
    item.dataset.cat = meta.key;
    item.dataset.title = meta.title;
    item.dataset.desc = meta.desc;
    item.dataset.count = '0';
    item.dataset.luneaUniversalAi = '1';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `<div><h4>✦ ${meta.title}</h4><p>${meta.desc}</p></div><span class="count">AI · 2~12 → 20</span>`;

    const open = event => {
      event?.preventDefault?.();
      const s = getState();
      if (s) {
        s.__luneaUniversalAI = true;
        s.__luneaManualMode = false;
      }
      try {
        if (typeof openSheet === 'function') openSheet(meta.key, meta.title, meta.desc, 0);
        else if (typeof W.openSheet === 'function') W.openSheet(meta.key, meta.title, meta.desc, 0);
      } catch (error) {
        console.error('[LUNEA V20] open AI sheet failed', error);
      }
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') open(event);
    });
    content.insertBefore(item, content.firstChild);
    return true;
  }

  function installCategoryEntries() {
    let touched = 0;
    $$('.category').forEach(category => {
      const meta = categoryFromHeader(category);
      if (!meta) return;
      if (markExistingAI(category, meta) || addAIEntry(category, meta)) touched += 1;
    });
    return touched >= 4;
  }

  function decorateHomeTiles() {
    $$('.lunea-v8-tile').forEach(tile => {
      const text = clean(tile.textContent);
      if (!CATEGORY_META.some(meta => meta.match.test(text))) return;
      if (tile.querySelector('.lunea-v20-ai-chip')) return;
      const chip = document.createElement('span');
      chip.className = 'lunea-v20-ai-chip';
      chip.textContent = 'AI SPREAD';
      tile.appendChild(chip);
    });
  }

  function installOpenTracking() {
    if (document.documentElement.dataset.luneaV20Tracking) return;
    document.documentElement.dataset.luneaV20Tracking = '1';
    document.addEventListener('click', event => {
      const item = event.target.closest?.('.reading-item');
      if (!item) return;
      const s = getState();
      if (!s) return;
      const universal = item.dataset.luneaUniversalAi === '1' || item.dataset.count === '0';
      // Let the original reading-item handler update state first.
      queueMicrotask(() => {
        const next = getState();
        if (!next) return;
        next.__luneaUniversalAI = universal;
      });
    });
  }

  function installDrawWrapper() {
    const btn = byId('drawBtn');
    if (!btn || !W.LUNEA_AI_SPREAD_PREFLIGHT?.design) return false;
    if (btn.onclick?.__luneaUniversalV20Wrapped) return true;

    const prior = btn.onclick;
    const wrapped = async function(event) {
      const s = getState();
      const universal = !!s?.__luneaUniversalAI && !!s?.isAi && !s?.__luneaManualMode;
      if (!universal) return typeof prior === 'function' ? prior.call(this, event) : undefined;

      const question = clean(byId('question')?.value || '');
      if (!question) {
        alert('질문 원문을 먼저 입력해줘.');
        byId('question')?.focus();
        return;
      }

      // Preserve the dedicated A/B 12+12 = 24-card engine from V14.
      if (isExplicitPairQuestion(question)) {
        return typeof prior === 'function' ? prior.call(this, event) : undefined;
      }

      event?.preventDefault?.();
      const label = byId('drawLabel');
      const oldLabel = label?.textContent || '질문 분석 & 맞춤 배열 설계';
      btn.disabled = true;
      if (label) label.textContent = '질문 구조 분석 & 배열 설계 중…';

      try {
        const designer = W.LUNEA_AI_SPREAD_PREFLIGHT?.design;
        const spread = await designer(question);
        if (!spread || !Array.isArray(spread.positions) || spread.positions.length < 2) throw new Error('AI spread result empty');
        const confirmed = await openV20Preview(question, spread);
        if (!confirmed) return;
        const start = W.startSpread || (typeof startSpread === 'function' ? startSpread : null);
        if (typeof start !== 'function') throw new Error('startSpread unavailable');
        const now = getState();
        if (now) now.__luneaUniversalAI = false;
        start(question, confirmed.positions, confirmed.spreadTitle, confirmed.designRationale);
      } catch (error) {
        console.error('[LUNEA V20] universal AI spread failed', error);
        alert('AI 맞춤 배열을 만드는 중 오류가 났어. 질문 내용은 그대로 유지돼.');
      } finally {
        btn.disabled = false;
        if (label) label.textContent = oldLabel.includes('질문') ? oldLabel : '질문 분석 & 맞춤 배열 설계';
      }
    };
    wrapped.__luneaUniversalV20Wrapped = true;
    wrapped.__luneaPriorDraw = prior;
    btn.onclick = wrapped;
    return true;
  }

  function boot() {
    addStyles();
    ensurePreview();
    installOpenTracking();

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const categories = installCategoryEntries();
      decorateHomeTiles();
      const draw = installDrawWrapper();
      if ((categories && draw) || tries > 150) clearInterval(timer);
    }, 80);

    installCategoryEntries();
    decorateHomeTiles();
    installDrawWrapper();
    W.LUNEA_UNIVERSAL_AI_MAX_USER_CARDS = MAX_USER;
    console.info(`✨ LUNEA Universal AI + Opal V20 loaded · AI 2~12 / user edit max ${MAX_USER} · A/B 24 preserved`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
