'use strict';

/*
  LUNEA READING POLISH V14
  ========================
  Screenshot-driven mobile readability + Timing Oracle polish + A/B symmetry repair.

  - Raises the too-small preflight / reading / card-note typography.
  - Makes Timing Oracle single/A-B/inline presentations consistent with the opal LUNEA theme.
  - Repairs the preflight 12-line truncation for genuine A/B comparisons by using
    A 12 + B 12 = 24 primary cards, with up to 3 overall extra cards.
  - Adds visible A / B group separators in the spread grid.
  - Does NOT alter tarot RNG, card meanings, AI interpretation, archive, Horary,
    astrology calculations, or non-A/B spread counts.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_POLISH_V14__) return;
  W.__LUNEA_READING_POLISH_V14__ = true;
  document.documentElement.classList.add('lunea-reading-polish-v14');

  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const stripNum = value => String(value || '').replace(/^\s*\d{1,2}\s*[.)]\s*/, '').trim();
  const getState = () => { try { return state; } catch { return null; } };

  function addStyles() {
    if ($('luneaReadingPolishV14Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaReadingPolishV14Style';
    style.textContent = `
      /* ======================================================
         PRE-DRAW PREFLIGHT · readable, not micro-typography
         ====================================================== */
      html.lunea-reading-polish-v14 #luneaSpreadPreviewModal{
        padding:22px 17px calc(26px + env(safe-area-inset-bottom))!important;
      }
      html.lunea-reading-polish-v14 .lsp-kicker{
        font-size:10.5px!important;line-height:1.35!important;letter-spacing:1.65px!important;
        color:#c9bee6!important;
      }
      html.lunea-reading-polish-v14 .lsp-title{
        margin-top:6px!important;margin-bottom:16px!important;
        font-size:24px!important;line-height:1.32!important;letter-spacing:-.35px!important;
      }
      html.lunea-reading-polish-v14 .lsp-intent{
        padding:14px 14px 13px 48px!important;border-radius:18px!important;
      }
      html.lunea-reading-polish-v14 .lsp-intent b{font-size:11.5px!important;line-height:1.4!important}
      html.lunea-reading-polish-v14 .lsp-intent div{font-size:13.5px!important;line-height:1.62!important}
      html.lunea-reading-polish-v14 .lsp-intent small{font-size:11px!important;line-height:1.55!important}
      html.lunea-reading-polish-v14 #luneaSpreadPreviewModal label{
        margin:13px 1px 7px!important;font-size:12.5px!important;line-height:1.4!important;
      }
      html.lunea-reading-polish-v14 #luneaSpreadPreviewTitle,
      html.lunea-reading-polish-v14 #luneaSpreadPreviewPositions{
        font-size:13.5px!important;line-height:1.62!important;
      }
      html.lunea-reading-polish-v14 #luneaSpreadPreviewPositions{
        min-height:250px!important;padding:13px 14px!important;
      }
      html.lunea-reading-polish-v14 .lsp-count{
        margin-top:7px!important;font-size:11.5px!important;line-height:1.45!important;
      }
      html.lunea-reading-polish-v14 .lsp-note{
        margin-top:11px!important;font-size:11px!important;line-height:1.58!important;
      }
      html.lunea-reading-polish-v14 .lsp-actions button{
        min-height:48px!important;font-size:13px!important;line-height:1.25!important;
      }
      html.lunea-reading-polish-v14 .lunea-preview-constellation::before{
        font-size:9px!important;letter-spacing:1.45px!important;
      }
      html.lunea-reading-polish-v14 .lunea-mini-card{
        width:21px!important;height:31px!important;font-size:8.5px!important;
      }

      /* ======================================================
         SPREAD RESULT · hierarchy readable on iPhone
         ====================================================== */
      html.lunea-reading-polish-v14 #spreadOverlay .modal{
        padding-left:15px!important;padding-right:15px!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .sub{
        font-size:10.5px!important;line-height:1.45!important;letter-spacing:1.45px!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .modal-h{
        font-size:22px!important;line-height:1.55!important;letter-spacing:-.35px!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .spread-rationale{
        padding:11px 12px!important;font-size:11.5px!important;line-height:1.58!important;
        color:#aaa9bc!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .actionbar .mini{
        min-height:50px!important;font-size:12.5px!important;line-height:1.25!important;
      }
      html.lunea-reading-polish-v14 #cards::before,
      html.lunea-reading-polish-v14 #results:not(:empty)::before{
        font-size:9px!important;letter-spacing:1.6px!important;color:#858799!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .info{
        padding:14px 14px 14px 16px!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .info .pos{
        font-size:11.5px!important;line-height:1.45!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .info h4{
        margin-top:7px!important;font-size:14.5px!important;line-height:1.42!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .info p{
        font-size:12px!important;line-height:1.55!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .info .mini{
        min-height:38px!important;padding:8px 11px!important;font-size:11.5px!important;
      }
      html.lunea-reading-polish-v14 #spreadOverlay .clar{font-size:11.5px!important;line-height:1.5!important}
      html.lunea-reading-polish-v14 #spreadOverlay .res-badge{font-size:10.5px!important}
      html.lunea-reading-polish-v14 #spreadOverlay .ai-body{font-size:13.5px!important;line-height:1.85!important}

      /* A/B 24 main-card grid group headers */
      #cards.lunea-ab24-grid{align-items:flex-start!important}
      #cards .lunea-ab-group-label{
        flex:0 0 100%;width:100%;margin:5px 0 4px;padding:8px 10px;border-radius:12px;
        display:flex;align-items:center;justify-content:space-between;gap:10px;
        color:#d9d5e8;font-size:11px;font-weight:700;letter-spacing:.15px;
        border:1px solid rgba(211,207,235,.10);
        background:linear-gradient(145deg,rgba(178,151,231,.07),rgba(88,126,166,.035));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
      }
      #cards .lunea-ab-group-label small{
        color:#918fa4;font-size:9.5px;font-weight:600;letter-spacing:.35px;
      }
      #cards .lunea-ab-group-label.b{
        margin-top:12px;background:linear-gradient(145deg,rgba(111,147,195,.065),rgba(167,139,217,.038));
      }
      #cards .lunea-ab-group-label.extra{
        margin-top:13px;border-color:rgba(179,213,209,.12);
        background:linear-gradient(145deg,rgba(116,176,165,.06),rgba(132,112,185,.035));
      }

      /* ======================================================
         TIMING ORACLE · one visual language across all states
         ====================================================== */
      html.lunea-reading-polish-v14 #timingOverlay .timing-modal{
        background:
          radial-gradient(circle at 14% 0%,rgba(183,153,239,.14),transparent 27%),
          radial-gradient(circle at 92% 18%,rgba(111,171,209,.10),transparent 29%),
          linear-gradient(165deg,#11152b 0%,#090c1b 62%,#070916 100%)!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .sub{
        color:#cabde8!important;font-size:10.5px!important;letter-spacing:1.65px!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .modal-h{
        color:#f7f4fc!important;font-size:25px!important;line-height:1.3!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-help{
        color:#aaa9ba!important;font-size:12.5px!important;line-height:1.62!important;
      }
      html.lunea-reading-polish-v14 #timingDraw{
        min-height:52px!important;border-radius:16px!important;font-size:14px!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-flip{
        width:min(205px,58vw)!important;height:auto!important;aspect-ratio:3/5!important;
        filter:drop-shadow(0 15px 26px rgba(0,0,0,.35)) drop-shadow(0 0 20px rgba(176,148,232,.10));
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-face{
        border-radius:20px!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-front{
        background:linear-gradient(145deg,#f8f4ff,#e7f1f5)!important;
        border-color:rgba(244,239,255,.58)!important;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.40),0 15px 32px rgba(0,0,0,.30)!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-front img{
        filter:saturate(.92) contrast(1.03) brightness(.97)!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-card-label{
        left:10px!important;right:10px!important;bottom:11px!important;padding:10px 9px 9px!important;
        background:rgba(248,247,253,.90)!important;
        border-color:rgba(176,157,217,.28)!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-card-label b{font-size:16px!important;line-height:1.35!important}
      html.lunea-reading-polish-v14 #timingOverlay .timing-card-label span{font-size:9.5px!important;letter-spacing:1.15px!important}
      html.lunea-reading-polish-v14 #timingOverlay .timing-result{
        padding:14px!important;border-radius:17px!important;
        background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(133,109,189,.035))!important;
      }
      html.lunea-reading-polish-v14 #timingOverlay .timing-result .group{font-size:10px!important}
      html.lunea-reading-polish-v14 #timingOverlay .timing-result h4{font-size:16px!important;line-height:1.4!important}
      html.lunea-reading-polish-v14 #timingOverlay .timing-result p{font-size:12.5px!important;line-height:1.6!important}
      html.lunea-reading-polish-v14 #timingOverlay .timing-actions .mini,
      html.lunea-reading-polish-v14 #timingOverlay .tab-actions .mini{
        min-height:44px!important;font-size:12.5px!important;
      }

      /* A/B Timing: remove the old white-card panel feel. */
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-grid{gap:10px!important}
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card{
        position:relative;overflow:hidden;padding:10px 9px 12px!important;border-radius:18px!important;
        color:#e9e7f0!important;
        background:
          radial-gradient(circle at 22% 0%,rgba(236,226,255,.14),transparent 29%),
          radial-gradient(circle at 85% 86%,rgba(115,180,209,.09),transparent 32%),
          linear-gradient(158deg,rgba(31,32,55,.98),rgba(14,17,33,.99))!important;
        border-color:rgba(226,226,243,.15)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 10px 26px rgba(0,0,0,.24)!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card::before{
        content:'';position:absolute;inset:0;pointer-events:none;opacity:.42;
        background:linear-gradient(115deg,transparent 8%,rgba(255,255,255,.08) 24%,transparent 40%);
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card small{
        position:relative;z-index:1;margin-bottom:7px!important;color:#d1b9ee!important;
        font-size:10px!important;line-height:1.4!important;letter-spacing:.9px!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card img{
        position:relative;z-index:1;max-width:126px!important;margin-bottom:9px!important;border-radius:13px!important;
        border-color:rgba(246,240,255,.42)!important;
        box-shadow:0 10px 25px rgba(0,0,0,.28),0 0 22px rgba(172,146,231,.10)!important;
        filter:saturate(.90) contrast(1.02) brightness(.96)!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card b{
        position:relative;z-index:1;color:#f5f1fb!important;font-size:16px!important;line-height:1.35!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card em{
        position:relative;z-index:1;margin:4px 0 6px!important;color:#c7addd!important;font-size:10px!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card p{
        position:relative;z-index:1;color:#aaa7b8!important;font-size:11.5px!important;line-height:1.55!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-note{
        padding:11px 12px!important;border-radius:14px!important;color:#9d9cad!important;
        background:rgba(255,255,255,.035)!important;border-color:rgba(220,222,238,.09)!important;
        font-size:11.5px!important;line-height:1.58!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingABAI{
        color:#d9d7e5!important;background:rgba(255,255,255,.04)!important;border-color:rgba(220,222,238,.10)!important;
        font-size:12.5px!important;line-height:1.75!important;
      }

      /* Inline timing signal stays compact but readable on small phones. */
      html.lunea-reading-polish-v14 #luneaTimingInline.timing-inline{
        grid-template-columns:90px minmax(0,1fr)!important;gap:14px!important;padding:14px 15px!important;text-align:left!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingInline.timing-inline::before{
        width:84px!important;height:120px!important;
      }
      html.lunea-reading-polish-v14 #luneaTimingInline .txt small{font-size:10px!important;line-height:1.4!important}
      html.lunea-reading-polish-v14 #luneaTimingInline .txt b{font-size:18px!important;line-height:1.35!important}
      html.lunea-reading-polish-v14 #luneaTimingInline .txt span{font-size:12.5px!important;line-height:1.6!important}

      @media(max-width:390px){
        html.lunea-reading-polish-v14 #luneaSpreadPreviewModal{padding-left:15px!important;padding-right:15px!important}
        html.lunea-reading-polish-v14 .lsp-title{font-size:23px!important}
        html.lunea-reading-polish-v14 .lsp-intent div{font-size:13px!important}
        html.lunea-reading-polish-v14 #spreadOverlay .modal-h{font-size:21px!important}
        html.lunea-reading-polish-v14 #spreadOverlay .actionbar .mini{font-size:12.5px!important;min-height:49px!important}
        html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card{padding:9px 7px 11px!important}
        html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card img{max-width:116px!important}
        html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card b{font-size:15px!important}
        html.lunea-reading-polish-v14 #luneaTimingABPanel .tab-card p{font-size:11px!important}
        html.lunea-reading-polish-v14 #luneaTimingInline.timing-inline{
          grid-template-columns:82px minmax(0,1fr)!important;gap:12px!important;padding:13px!important;text-align:left!important;
        }
        html.lunea-reading-polish-v14 #luneaTimingInline.timing-inline::before{width:78px!important;height:112px!important}
        html.lunea-reading-polish-v14 #luneaTimingInline .txt b{font-size:17px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function isPairQuestion(question) {
    const q = clean(question);
    const explicitPair = /(?:\bA\s*(?:와|과|랑|\/|·|및|,|그리고)\s*B\b|A와B|A\/B|A·B|두\s*(?:사람|명|인연|상대|대상)|2\s*(?:사람|명|인연|상대|대상))/i.test(q);
    const peopleCue = /(사람|상대|인연|전남친|전여친|전애인|구남친|구여친|구썸|썸남|썸녀|연인|이성|지인|동료|대상)/i.test(q);
    return explicitPair && peopleCue;
  }

  function pair24FromSpread(spread) {
    const raw = Array.isArray(spread?.positions) ? spread.positions.map(stripNum).filter(Boolean) : [];
    if (!raw.length) return null;

    let a = raw.filter(x => /^A\s*(?:·|\.|:|-)/i.test(x));
    let b = raw.filter(x => /^B\s*(?:·|\.|:|-)/i.test(x));

    if (a.length < 12 || b.length < 12) {
      const half = Math.floor(raw.length / 2);
      if (raw.length >= 24 && half >= 12) {
        a = raw.slice(0, half);
        b = raw.slice(half);
      }
    }
    if (a.length < 12 || b.length < 12) return null;

    a = a.slice(0, 12);
    b = b.slice(0, 12);
    const positions = [...a, ...b].map((x, i) => `${i + 1}. ${x}`);
    const axes = a.map(x => x.replace(/^A\s*(?:·|\.|:|-)\s*/i, '').replace(/^축\s*\d+\s*(?:·|\.|:|-)\s*/i, '').trim());

    let title = String(spread?.spreadTitle || 'A/B 대칭 비교');
    title = title.replace(/\d+\s*축\s*대칭\s*비교\s*·\s*\d+\s*카드/i, '12축 대칭 비교 · 24카드');
    if (!/24\s*카드/.test(title)) title = `${title} · 12축 대칭 비교 · 24카드`;

    let rationale = String(spread?.designRationale || 'A/B 대칭 비교');
    rationale = rationale.replace(/requested_axes=.*?(?=\s*·\s*comparison\s*!=\s*choice)/i, `requested_axes=${axes.join(' / ')}`);
    rationale += ' · pair_axis_count=12 · main_card_count=24 · A/B=12+12 · overall_extra_max=3';

    return {...spread, positions, spreadTitle:title, designRationale:rationale, __luneaAB24:true, __luneaABAxes:axes};
  }

  function previewLines() {
    return String($('luneaSpreadPreviewPositions')?.value || '')
      .split(/\n+/).map(stripNum).filter(Boolean).slice(0, 24);
  }

  function fillPairPreview(pair, question) {
    const overlay = $('luneaSpreadPreviewOverlay');
    if (!overlay) return false;
    const titleInput = $('luneaSpreadPreviewTitle');
    const positionsInput = $('luneaSpreadPreviewPositions');
    const intent = $('luneaSpreadPreviewIntent');
    const meta = $('luneaSpreadPreviewMeta');
    const count = $('luneaSpreadPreviewCount');
    const close = $('luneaSpreadPreviewClose');
    const confirm = $('luneaSpreadPreviewConfirm');
    const regenerate = $('luneaSpreadPreviewRegenerate');
    if (!titleInput || !positionsInput || !confirm) return false;

    titleInput.value = pair.spreadTitle;
    positionsInput.value = pair.positions.map(stripNum).join('\n');
    if (intent) intent.textContent = pair?._luneaPreflight?.intentSummary || 'A/B 두 대상을 같은 12개 축으로 대칭 비교';
    if (meta) meta.textContent = 'A 12장 · B 12장 · 동일 축 / 동일 순서 · 전체 추가 카드 최대 3장';
    if (count) count.textContent = '총 본카드 24장 · A 12 + B 12 · 확정 전 카드 추출 없음';

    const syncCount = () => {
      const lines = previewLines();
      if (count) count.textContent = `현재 ${lines.length}/24장 · A/B 대칭은 24장 고정 · 추가 카드 최대 3장`;
    };
    positionsInput.oninput = syncCount;

    const drawBtn = $('drawBtn');
    const drawLabel = $('drawLabel');
    const finish = () => {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (drawBtn) drawBtn.disabled = false;
      if (drawLabel) drawLabel.textContent = '질문 분석 & 맞춤 배열 설계';
    };

    if (close) close.onclick = () => finish();
    overlay.onclick = event => { if (event.target === overlay) finish(); };

    if (regenerate) {
      regenerate.onclick = async () => {
        regenerate.disabled = true;
        try {
          const next = pair24FromSpread(await W.designSpread(question));
          if (!next) throw new Error('A/B 24-card spread unavailable');
          fillPairPreview(next, question);
        } catch (err) {
          console.warn('[LUNEA V14] A/B regenerate failed', err);
          alert('A/B 대칭 배열을 다시 만드는 중 오류가 났어. 현재 24장 배열은 그대로 유지돼.');
        } finally {
          regenerate.disabled = false;
        }
      };
    }

    confirm.onclick = () => {
      const lines = previewLines();
      if (lines.length !== 24) {
        alert('A/B 대칭 비교는 A 12장 + B 12장, 총 24장을 유지해야 해.');
        return;
      }
      const finalTitle = clean(titleInput.value) || pair.spreadTitle;
      const finalPositions = lines.map((x, i) => `${i + 1}. ${x}`);
      finish();
      W.startSpread(question, finalPositions, finalTitle, pair.designRationale + ' · PRE-DRAW USER CONFIRMED · AB24 FIX');
    };

    document.body.classList.add('modal-open');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    return true;
  }

  function decorateABGrid() {
    const s = getState();
    const cards = $('cards');
    if (!s?.__luneaAB24 || !cards || !Array.isArray(s.positions) || s.positions.length !== 24) return;
    cards.classList.add('lunea-ab24-grid');
    cards.querySelectorAll('.lunea-ab-group-label').forEach(el => el.remove());

    const wrap0 = cards.querySelector('.tarot-card-wrapper[data-index="0"]');
    const wrap12 = cards.querySelector('.tarot-card-wrapper[data-index="12"]');
    const wrap24 = cards.querySelector('.tarot-card-wrapper[data-index="24"]');

    if (wrap0) {
      const label = document.createElement('div');
      label.className = 'lunea-ab-group-label a';
      label.innerHTML = '<span>대상 A · 본카드 12장</span><small>같은 12축 · A</small>';
      cards.insertBefore(label, wrap0);
    }
    if (wrap12) {
      const label = document.createElement('div');
      label.className = 'lunea-ab-group-label b';
      label.innerHTML = '<span>대상 B · 본카드 12장</span><small>같은 12축 · B</small>';
      cards.insertBefore(label, wrap12);
    }
    if (wrap24) {
      const n = Math.max(0, (s.drawn?.length || 0) - 24);
      const label = document.createElement('div');
      label.className = 'lunea-ab-group-label extra';
      label.innerHTML = `<span>전체 보정 · 추가 카드 ${n}/3</span><small>A/B 어느 한쪽에도 귀속되지 않음</small>`;
      cards.insertBefore(label, wrap24);
    }
  }

  function syncABControls() {
    const s = getState();
    const extra = $('extraCard');
    if (!s?.__luneaAB24 || !Array.isArray(s.positions) || s.positions.length !== 24) {
      $('cards')?.classList.remove('lunea-ab24-grid');
      return;
    }
    const n = Math.max(0, (s.drawn?.length || 0) - 24);
    if (extra) {
      extra.textContent = `+ 추가 카드 (${n}/3)`;
      extra.disabled = n >= 3;
    }
    const flip = $('flipAll');
    if (flip && n === 0) flip.textContent = '✦ 본카드 24장 뒤집기';
    decorateABGrid();
  }

  function wrapStartSpread() {
    if (W.startSpread?.__luneaV14Wrapped) return;
    const baseStart = W.startSpread;
    if (typeof baseStart !== 'function') return;
    const wrapped = function(question, positions, title, rationale) {
      const pair24 = Array.isArray(positions) && positions.length === 24 && /target_count=2|A\/B|대칭\s*비교/i.test(String(rationale || '') + ' ' + String(title || ''));
      const result = baseStart.apply(this, arguments);
      const s = getState();
      if (s) s.__luneaAB24 = !!pair24;
      [0, 80, 260, 700].forEach(ms => setTimeout(syncABControls, ms));
      return result;
    };
    wrapped.__luneaV14Wrapped = true;
    W.startSpread = wrapped;
    try { startSpread = wrapped; } catch {}
  }

  function installABDrawIntercept() {
    const drawBtn = $('drawBtn');
    if (!drawBtn || drawBtn.__luneaAB24Capture) return;
    drawBtn.__luneaAB24Capture = true;
    drawBtn.addEventListener('click', async event => {
      const s = getState();
      const q = clean($('question')?.value || '');
      if (!s?.isAi || !q || !isPairQuestion(q)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      drawBtn.disabled = true;
      const label = $('drawLabel');
      if (label) label.textContent = 'A/B 24장 대칭 배열 검수 중…';

      try {
        const spread = await W.designSpread(q);
        const pair = pair24FromSpread(spread);
        if (!pair) throw new Error('A/B structural pair spread not found');
        if (!fillPairPreview(pair, q)) {
          drawBtn.disabled = false;
          if (label) label.textContent = '질문 분석 & 맞춤 배열 설계';
          W.startSpread(q, pair.positions, pair.spreadTitle, pair.designRationale + ' · AB24 FIX');
        }
      } catch (err) {
        console.error('[LUNEA V14] A/B 24-card preflight failed', err);
        drawBtn.disabled = false;
        if (label) label.textContent = '질문 분석 & 맞춤 배열 설계';
        alert('A/B 대칭 24장 배열을 만드는 중 오류가 났어. 질문은 그대로 유지돼.');
      }
    }, true);
  }

  function installExtraCap() {
    const btn = $('extraCard');
    if (!btn || btn.__luneaABExtraCap) return;
    btn.__luneaABExtraCap = true;
    btn.addEventListener('click', event => {
      const s = getState();
      if (!s?.__luneaAB24 || !Array.isArray(s.positions) || s.positions.length !== 24) return;
      const n = Math.max(0, (s.drawn?.length || 0) - 24);
      if (n >= 3) {
        event.preventDefault();
        event.stopImmediatePropagation();
        btn.disabled = true;
        return;
      }
      setTimeout(syncABControls, 0);
      setTimeout(syncABControls, 120);
    }, true);
  }

  function boot() {
    addStyles();
    wrapStartSpread();
    installABDrawIntercept();
    installExtraCap();
    [250, 800, 1800].forEach(ms => setTimeout(() => {
      wrapStartSpread();
      installABDrawIntercept();
      installExtraCap();
      syncABControls();
    }, ms));
    window.addEventListener('pageshow', () => setTimeout(syncABControls, 80));
    console.info('✨ LUNEA Reading Polish V14 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
