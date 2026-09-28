'use strict';
(() => {
  const W = window;
  if (W.__LUNEA_READING_SHARE_UI_V5__) return;
  W.__LUNEA_READING_SHARE_UI_V5__ = true;

  const BTN = 'luneaShareReadingPng';
  const OV = 'luneaSharePreviewOverlayV5';
  const TRACK = 'luneaSharePreviewTrackV5';
  const COUNT = 'luneaSharePreviewCountV5';
  const STATUS = 'luneaShareStatusV5';
  const SHARE = 'luneaShareOpenV5';
  let prepared = null;
  let urls = [];
  let busy = false;
  let previousOverflow = '';

  const $ = id => document.getElementById(id);
  const renderer = () => W.LUNEA_READING_SHARE_POLISH_V3 || null;

  function revoke() {
    urls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
    urls = [];
  }

  function hideLegacy() {
    ['luneaSharePreviewOverlayV3','luneaSharePreviewOverlayV4'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.dataset.open = 'false';
        el.style.display = 'none';
      }
    });
  }

  function lockBody() {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function unlockBody() {
    document.body.style.overflow = previousOverflow || '';
  }

  function style() {
    if ($('luneaReadingShareUiV5Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaReadingShareUiV5Style';
    s.textContent = `
      #luneaSharePreviewOverlayV3,#luneaSharePreviewOverlayV4{display:none!important}
      #${OV}{
        position:fixed;inset:0;z-index:12450;display:none;
        background:
          radial-gradient(circle at 50% 14%,rgba(124,92,181,.18),transparent 30%),
          linear-gradient(180deg,#08070d 0%,#06050a 100%);
        color:#f7f3fb;
        -webkit-tap-highlight-color:transparent;
      }
      #${OV}[data-open="true"]{display:block}
      #${OV} *{box-sizing:border-box}
      #${OV} .topbar{
        position:absolute;left:0;right:0;top:0;z-index:3;
        display:flex;align-items:center;justify-content:space-between;
        padding:calc(14px + env(safe-area-inset-top)) 18px 10px;
        background:linear-gradient(180deg,rgba(7,6,11,.96),rgba(7,6,11,.52),transparent)
      }
      #${OV} .titlebox{min-width:0}
      #${OV} .eyebrow{font-size:10px;font-weight:850;letter-spacing:.17em;color:#c7b5ee;margin-bottom:4px}
      #${OV} .titleline{display:flex;align-items:baseline;gap:9px;min-width:0}
      #${OV} h3{margin:0;font-size:17px;line-height:1.15;letter-spacing:-.02em;white-space:nowrap}
      #${COUNT}{font-size:12px;color:#9e94ab;white-space:nowrap}
      #${OV} .close{
        width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;
        border:1px solid rgba(255,255,255,.08);border-radius:50%;
        background:rgba(255,255,255,.055);color:#d4c9df;font-size:27px;line-height:1
      }
      #${STATUS}{
        position:absolute;z-index:3;left:18px;right:18px;top:calc(72px + env(safe-area-inset-top));
        text-align:center;font-size:11px;color:#948a9f;min-height:18px;pointer-events:none
      }
      #${TRACK}{
        position:absolute;inset:0;
        display:flex;overflow-x:auto;overflow-y:hidden;gap:0;
        scroll-snap-type:x mandatory;overscroll-behavior-x:contain;
        -webkit-overflow-scrolling:touch;scrollbar-width:none
      }
      #${TRACK}::-webkit-scrollbar{display:none}
      #${TRACK} .slide{
        flex:0 0 100%;width:100%;height:100%;scroll-snap-align:center;
        display:flex;align-items:center;justify-content:center;
        padding:calc(104px + env(safe-area-inset-top)) 18px calc(126px + env(safe-area-inset-bottom))
      }
      #${TRACK} img{
        display:block;width:auto;height:auto;
        max-width:min(92vw,620px);max-height:calc(100dvh - 250px);
        aspect-ratio:4/5;object-fit:contain;
        border-radius:22px;border:1px solid rgba(255,255,255,.10);
        background:#0a0810;
        box-shadow:0 26px 70px rgba(0,0,0,.48),0 0 0 1px rgba(198,176,238,.04)
      }
      #${OV} .bottom{
        position:absolute;left:0;right:0;bottom:0;z-index:4;
        padding:10px 18px calc(14px + env(safe-area-inset-bottom));
        background:linear-gradient(180deg,transparent,rgba(7,6,11,.82) 24%,#07060b 58%)
      }
      #${OV} .meta{display:flex;align-items:center;justify-content:center;min-height:22px;margin-bottom:8px}
      #${OV} .dots{display:flex;gap:6px;align-items:center;justify-content:center;max-width:190px;overflow:hidden}
      #${OV} .dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.18);transition:.18s ease}
      #${OV} .dot.on{width:20px;border-radius:99px;background:#c5adff}
      #${SHARE}{
        width:100%;min-height:56px;border:1px solid rgba(220,205,255,.40);border-radius:18px;
        background:linear-gradient(135deg,#9f7de7 0%,#6c55a2 100%);
        color:#fff;font-size:17px;font-weight:850;letter-spacing:-.015em;
        box-shadow:0 14px 34px rgba(85,63,134,.28)
      }
      #${SHARE}:disabled{opacity:.42;box-shadow:none}
      @media (min-width:700px){
        #${OV} .topbar{padding-left:26px;padding-right:26px}
        #${OV} .bottom{padding-left:26px;padding-right:26px}
        #${SHARE}{max-width:520px;display:block;margin:0 auto}
      }
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
      <div class="topbar">
        <div class="titlebox">
          <div class="eyebrow">LUNEA · SHARE</div>
          <div class="titleline"><h3>PNG 미리보기</h3><span id="${COUNT}">0 / 0</span></div>
        </div>
        <button class="close" type="button" aria-label="닫기">×</button>
      </div>
      <div id="${STATUS}"></div>
      <div id="${TRACK}"></div>
      <div class="bottom">
        <div class="meta"><div class="dots"></div></div>
        <button id="${SHARE}" type="button" disabled>공유창 열기</button>
      </div>`;
    document.body.appendChild(o);
    o.querySelector('.close').onclick = close;
    $(SHARE).onclick = share;
    $(TRACK).addEventListener('scroll', onScroll, {passive:true});
    return o;
  }

  function status(v) { const e = $(STATUS); if (e) e.textContent = v || ''; }

  function close() {
    const o = $(OV);
    if (o) o.dataset.open = 'false';
    prepared = null;
    revoke();
    unlockBody();
  }

  function updateIndex(i,total) {
    const n = $(COUNT);
    if (n) n.textContent = total ? `${i+1} / ${total}` : '0 / 0';
    overlay().querySelectorAll('.dot').forEach((d,k)=>d.classList.toggle('on',k===i));
  }

  function onScroll() {
    const t = $(TRACK);
    if (!t || !prepared?.files?.length) return;
    const w = t.clientWidth || 1;
    const i = Math.max(0,Math.min(prepared.files.length-1,Math.round(t.scrollLeft / w)));
    updateIndex(i,prepared.files.length);
  }

  function show(result) {
    hideLegacy();
    const o = overlay(), t = $(TRACK), dots = o.querySelector('.dots');
    prepared = result;
    revoke();
    t.replaceChildren();
    dots.replaceChildren();
    const files = result?.files || [];
    files.forEach((file,i)=>{
      const u = URL.createObjectURL(file);
      urls.push(u);
      const slide = document.createElement('div');
      slide.className = 'slide';
      const im = new Image();
      im.src = u;
      im.alt = `LUNEA 공유 이미지 ${i+1}`;
      slide.appendChild(im);
      t.appendChild(slide);
      const d = document.createElement('span');
      d.className = 'dot' + (i===0?' on':'');
      dots.appendChild(d);
    });
    t.scrollLeft = 0;
    const can = !!(navigator.share && (!navigator.canShare || navigator.canShare({files})));
    $(SHARE).disabled = !can;
    $(SHARE).textContent = can ? `공유창 열기 · ${files.length}장` : '이 기기에서는 파일 공유를 지원하지 않음';
    status(files.length ? '좌우로 넘겨서 확인할 수 있어.' : '생성된 PNG가 없어.');
    updateIndex(0,files.length);
    lockBody();
    o.dataset.open = 'true';
  }

  async function prepare() {
    if (busy) return;
    hideLegacy();
    const r = renderer();
    if (!r?.compose) return;
    busy = true;
    const b = $(BTN), old = b?.textContent;
    const o = overlay();
    lockBody();
    o.dataset.open = 'true';
    $(TRACK).replaceChildren();
    o.querySelector('.dots').replaceChildren();
    $(SHARE).disabled = true;
    updateIndex(0,0);
    status('PNG 만드는 중…');
    if (b) { b.disabled = true; b.textContent = 'PNG 만드는 중…'; }
    try { show(await r.compose()); }
    catch (e) {
      console.error('[LUNEA share UI V5]',e);
      status(e?.message || 'PNG 생성 실패');
    } finally {
      busy = false;
      if (b) { b.disabled = false; b.textContent = old || '🖼 공유 PNG'; }
    }
  }

  async function share() {
    const files = prepared?.files || [];
    if (!files.length) return;
    try {
      await navigator.share({files,title:prepared?.payload?.question || 'LUNEA Reading',text:'LUNEA 타로 · 오라클 리딩 결과'});
      status('공유창에서 “사진에 저장”을 선택하면 돼.');
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        status('공유창을 열지 못했어.');
      }
    }
  }

  function intercept(e) {
    const b = e.target?.closest?.(`#${BTN}`);
    if (!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    prepare();
  }

  function boot() {
    style();
    hideLegacy();
    overlay();
    document.addEventListener('click',intercept,true);
    W.LUNEA_READING_SHARE_UI_V5 = Object.freeze({version:'5.0',prepare,close});
    console.info('✨ LUNEA Reading Share UI V5 ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
