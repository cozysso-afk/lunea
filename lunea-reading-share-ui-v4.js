'use strict';
(() => {
  const W = window;
  if (W.__LUNEA_READING_SHARE_UI_V4__) return;
  W.__LUNEA_READING_SHARE_UI_V4__ = true;

  const BTN = 'luneaShareReadingPng';
  const OV = 'luneaSharePreviewOverlayV4';
  const TRACK = 'luneaSharePreviewTrackV4';
  const COUNT = 'luneaSharePreviewCountV4';
  const STATUS = 'luneaShareStatusV4';
  const SHARE = 'luneaShareOpenV4';
  let prepared = null;
  let urls = [];
  let busy = false;

  const $ = id => document.getElementById(id);
  const renderer = () => W.LUNEA_READING_SHARE_POLISH_V3 || null;

  function revoke() {
    urls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
    urls = [];
  }

  function style() {
    if ($('luneaReadingShareUiV4Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaReadingShareUiV4Style';
    s.textContent = `
      #${OV}{
        position:fixed;inset:0;z-index:12350;display:none;
        align-items:flex-end;justify-content:center;
        padding:0;background:rgba(5,4,10,.72);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)
      }
      #${OV}[data-open="true"]{display:flex}
      #${OV} *{box-sizing:border-box}
      #${OV} .panel{
        width:min(100%,480px);max-height:94dvh;overflow:hidden;
        border:1px solid rgba(218,202,245,.18);
        border-bottom:0;border-radius:28px 28px 0 0;
        background:linear-gradient(180deg,#181220 0%,#100c16 100%);
        color:#f7f3fb;box-shadow:0 -20px 70px rgba(0,0,0,.42)
      }
      #${OV} .grab{width:42px;height:4px;border-radius:99px;background:rgba(255,255,255,.17);margin:10px auto 2px}
      #${OV} .head{display:flex;align-items:center;justify-content:space-between;padding:10px 18px 8px;gap:14px}
      #${OV} .eyebrow{font-size:10px;font-weight:800;letter-spacing:.14em;color:#bdaee0;margin-bottom:3px}
      #${OV} h3{margin:0;font-size:18px;line-height:1.2;letter-spacing:-.02em}
      #${OV} .close{width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:50%;background:rgba(255,255,255,.055);color:#c9bfd5;font-size:26px;line-height:1}
      #${STATUS}{padding:0 18px 9px;font-size:11px;color:#9f95ac;min-height:25px}
      #${TRACK}{
        display:flex;gap:12px;overflow-x:auto;overscroll-behavior-x:contain;
        scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;
        scrollbar-width:none;padding:0 18px 12px
      }
      #${TRACK}::-webkit-scrollbar{display:none}
      #${TRACK} .slide{flex:0 0 calc(100% - 30px);scroll-snap-align:center;display:flex;justify-content:center}
      #${TRACK} img{display:block;width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;border-radius:18px;border:1px solid rgba(255,255,255,.11);background:#08070d;box-shadow:0 14px 34px rgba(0,0,0,.30)}
      #${OV} .meta{display:flex;align-items:center;justify-content:center;gap:10px;min-height:28px;padding:0 18px 7px;color:#a99fba;font-size:11px}
      #${OV} .dots{display:flex;gap:5px;align-items:center;justify-content:center;max-width:170px;overflow:hidden}
      #${OV} .dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.18);transition:.18s ease}
      #${OV} .dot.on{width:17px;border-radius:99px;background:#baa5ef}
      #${OV} .actions{padding:8px 18px calc(14px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(16,12,22,.45),#100c16 28%)}
      #${SHARE}{width:100%;min-height:54px;border:1px solid rgba(214,197,255,.44);border-radius:16px;background:linear-gradient(135deg,#9b7ce0,#69539b);color:white;font-size:16px;font-weight:850;letter-spacing:-.01em;box-shadow:0 10px 28px rgba(88,65,135,.25)}
      #${SHARE}:disabled{opacity:.45;box-shadow:none}
      @media (min-width:700px){#${OV}{align-items:center;padding:18px}#${OV} .panel{border-bottom:1px solid rgba(218,202,245,.18);border-radius:28px}}
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function overlay() {
    let o = $(OV);
    if (o) return o;
    o = document.createElement('div');
    o.id = OV;
    o.setAttribute('role','dialog');
    o.setAttribute('aria-modal','true');
    o.innerHTML = `
      <section class="panel">
        <div class="grab"></div>
        <div class="head">
          <div><div class="eyebrow">LUNEA · SHARE</div><h3>공유용 PNG</h3></div>
          <button class="close" type="button" aria-label="닫기">×</button>
        </div>
        <div id="${STATUS}"></div>
        <div id="${TRACK}"></div>
        <div class="meta"><div class="dots"></div><span id="${COUNT}">0 / 0</span></div>
        <div class="actions"><button id="${SHARE}" type="button" disabled>공유창 열기</button></div>
      </section>`;
    document.body.appendChild(o);
    o.querySelector('.close').onclick = close;
    o.addEventListener('pointerup', e => { if (e.target === o) close(); });
    $(SHARE).onclick = share;
    $(TRACK).addEventListener('scroll', onScroll, {passive:true});
    return o;
  }

  function status(v) { const e = $(STATUS); if (e) e.textContent = v || ''; }

  function close() {
    const o = $(OV); if (o) o.dataset.open = 'false';
    prepared = null; revoke();
  }

  function updateIndex(i, total) {
    const n = $(COUNT); if (n) n.textContent = total ? `${i + 1} / ${total}` : '0 / 0';
    const dots = overlay().querySelectorAll('.dot');
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  }

  function onScroll() {
    const t = $(TRACK); if (!t || !prepared?.files?.length) return;
    const slides = [...t.querySelectorAll('.slide')];
    if (!slides.length) return;
    let best = 0, dist = Infinity;
    slides.forEach((s,i) => { const d = Math.abs(s.offsetLeft - t.scrollLeft - 18); if (d < dist) {dist=d;best=i;} });
    updateIndex(best, slides.length);
  }

  function show(result) {
    const o = overlay(), track = $(TRACK), dots = o.querySelector('.dots');
    prepared = result; revoke(); track.replaceChildren(); dots.replaceChildren();
    const files = result?.files || [];
    files.forEach((file,i) => {
      const u = URL.createObjectURL(file); urls.push(u);
      const slide = document.createElement('div'); slide.className = 'slide';
      const im = new Image(); im.src = u; im.alt = `LUNEA 공유 이미지 ${i+1}`;
      slide.appendChild(im); track.appendChild(slide);
      const d = document.createElement('span'); d.className = 'dot' + (i===0?' on':''); dots.appendChild(d);
    });
    track.scrollLeft = 0;
    const can = !!(navigator.share && (!navigator.canShare || navigator.canShare({files})));
    $(SHARE).disabled = !can;
    $(SHARE).textContent = can ? `공유창 열기 · ${files.length}장` : '이 기기에서는 파일 공유를 지원하지 않음';
    status(`1080 × 1350 · ${files.length}장`);
    updateIndex(0, files.length);
    o.dataset.open = 'true';
  }

  async function prepare() {
    if (busy) return;
    const r = renderer();
    if (!r?.compose) { status('공유 렌더러 준비 중이야. 잠깐 후 다시 눌러줘.'); return; }
    busy = true;
    const b = $(BTN), old = b?.textContent;
    const o = overlay(); o.dataset.open = 'true';
    $(TRACK).replaceChildren(); o.querySelector('.dots').replaceChildren();
    $(SHARE).disabled = true; updateIndex(0,0);
    status('카드와 오라클 이미지를 정리하는 중…');
    if (b) { b.disabled = true; b.textContent = 'PNG 만드는 중…'; }
    try { show(await r.compose()); }
    catch (e) { console.error('[LUNEA share UI V4]', e); status(e?.message || 'PNG 생성 실패'); }
    finally { busy = false; if (b) { b.disabled = false; b.textContent = old || '🖼 공유 PNG'; } }
  }

  async function share() {
    const files = prepared?.files || [];
    if (!files.length) return;
    try {
      await navigator.share({files, title: prepared?.payload?.question || 'LUNEA Reading', text:'LUNEA 타로 · 오라클 리딩 결과'});
      status('공유창에서 “사진에 저장”을 선택하면 돼.');
    } catch (e) {
      if (e?.name !== 'AbortError') { console.error(e); status('공유창을 열지 못했어.'); }
    }
  }

  function intercept(e) {
    const b = e.target?.closest?.(`#${BTN}`);
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    prepare();
  }

  function boot() {
    style(); overlay();
    document.addEventListener('click', intercept, true);
    W.LUNEA_READING_SHARE_UI_V4 = Object.freeze({version:'4.0',prepare,close});
    console.info('✨ LUNEA Reading Share UI V4 ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
