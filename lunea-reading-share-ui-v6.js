'use strict';
(() => {
  const W = window;
  if (W.__LUNEA_READING_SHARE_UI_V6__) return;
  W.__LUNEA_READING_SHARE_UI_V6__ = true;

  const BTN = 'luneaShareReadingPng';
  const OV = 'luneaSharePreviewOverlayV6';
  const TRACK = 'luneaSharePreviewTrackV6';
  const COUNT = 'luneaSharePreviewCountV6';
  const STATUS = 'luneaShareStatusV6';
  const SHARE = 'luneaShareOpenV6';
  const BW = 1080;
  const BH = 1350;

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
    ['luneaSharePreviewOverlayV3','luneaSharePreviewOverlayV4','luneaSharePreviewOverlayV5'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.dataset.open = 'false';
      el.style.display = 'none';
    });
  }

  function lockBody() {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function unlockBody() {
    document.body.style.overflow = previousOverflow || '';
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 생성 실패')), 'image/png');
    });
  }

  function verifyPngBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const im = new Image();
      const done = error => {
        try { URL.revokeObjectURL(url); } catch {}
        error ? reject(error) : resolve();
      };
      const timer = setTimeout(() => done(new Error('PNG 검증 시간 초과')), 12000);
      im.onload = () => {
        clearTimeout(timer);
        if (im.naturalWidth !== BW || im.naturalHeight !== BH) {
          done(new Error(`PNG 크기 오류: ${im.naturalWidth}×${im.naturalHeight}`));
          return;
        }
        done();
      };
      im.onerror = () => {
        clearTimeout(timer);
        done(new Error('PNG 파일 검증 실패'));
      };
      im.src = url;
    });
  }

  function roundedRect(ctx,x,y,w,h,r) {
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
  }

  function setFont(ctx,size,weight=500,serif=false) {
    ctx.font = `${weight} ${size}px ${serif?'"Noto Serif KR",Georgia,serif':'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'}`;
    ctx.textBaseline = 'top';
  }

  function wrapLines(ctx,value,maxWidth) {
    const out = [];
    for (const paragraph of String(value || '').replace(/\r/g,'').split('\n')) {
      if (!paragraph) { out.push(''); continue; }
      let line = '';
      for (const ch of [...paragraph]) {
        const next = line + ch;
        if (line && ctx.measureText(next).width > maxWidth) {
          out.push(line);
          line = ch;
        } else line = next;
      }
      if (line) out.push(line);
    }
    return out;
  }

  function drawText(ctx,value,x,y,w,{size=26,weight=500,color='#f7f3fb',lineHeight=1.42,max=99,align='left',serif=false}={}) {
    setFont(ctx,size,weight,serif);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const lines = wrapLines(ctx,value,w).slice(0,max);
    const px = align === 'center' ? x + w/2 : align === 'right' ? x + w : x;
    lines.forEach((line,i) => ctx.fillText(line,px,y + i*size*lineHeight));
    ctx.textAlign = 'left';
    return lines.length * size * lineHeight;
  }

  function drawFittedText(ctx,value,x,y,w,h,{maxSize=38,minSize=25,weight=780,color='#f7f3fb',lineHeight=1.22,maxLines=6,serif=true}={}) {
    for (let size=maxSize; size>=minSize; size--) {
      setFont(ctx,size,weight,serif);
      const lines = wrapLines(ctx,value,w);
      if (lines.length <= maxLines && lines.length*size*lineHeight <= h) {
        return drawText(ctx,value,x,y,w,{size,weight,color,lineHeight,max:maxLines,serif});
      }
    }
    return drawText(ctx,value,x,y,w,{size:minSize,weight,color,lineHeight,max:maxLines,serif});
  }

  function isExtraCard(card) {
    return /추가\s*카드|additional|clarifier|보조\s*카드/i.test(String(card?.position || card?.role || ''));
  }

  function buildOverviewCover(result,totalPages) {
    const payload = result?.payload || {};
    const tarot = Array.isArray(payload.tarot) ? payload.tarot : [];
    const mainCount = tarot.filter(card => !isExtraCard(card)).length || tarot.length;
    const extraCount = tarot.filter(isExtraCard).length;
    const attachments = payload.a || {};
    const support = [];
    if (extraCount) support.push(`추가 카드 ${extraCount}`);
    if (attachments.timing) support.push('Timing Oracle');
    if (attachments.messageOracle) support.push('Message Oracle');
    if (payload.intimacy?.cards?.length) support.push('Intimacy Oracle');
    if (payload.ai) support.push('AI 해석');

    const c = document.createElement('canvas');
    c.width = BW;
    c.height = BH;
    const x = c.getContext('2d',{alpha:false});

    const g = x.createLinearGradient(0,0,BW,BH);
    g.addColorStop(0,'#1b132a');
    g.addColorStop(.52,'#0d0a14');
    g.addColorStop(1,'#050408');
    x.fillStyle = g;
    x.fillRect(0,0,BW,BH);
    const r = x.createRadialGradient(150,90,0,150,90,540);
    r.addColorStop(0,'rgba(182,150,255,.14)');
    r.addColorStop(1,'rgba(182,150,255,0)');
    x.fillStyle = r;
    x.fillRect(0,0,780,690);

    const M = 64;
    setFont(x,22,800);
    x.fillStyle = '#d7c4ff';
    x.fillText('☾  L U N E A',M,42);
    setFont(x,16,700);
    x.fillStyle = '#b7aec3';
    x.textAlign = 'right';
    x.fillText('READING',BW-M,48);
    x.textAlign = 'left';

    drawText(x,String(payload.category || 'GENERAL').toUpperCase(),M,104,BW-2*M,{size:16,weight:800,color:'#ead3a1',max:1});
    drawFittedText(x,payload.question || payload.title || 'LUNEA Reading',M,145,BW-2*M,235,{maxSize:36,minSize:26,weight:780,lineHeight:1.22,maxLines:6,serif:true});

    roundedRect(x,M,410,BW-2*M,64,20);
    x.fillStyle = 'rgba(255,255,255,.045)';
    x.fill();
    x.strokeStyle = 'rgba(225,211,246,.20)';
    x.lineWidth = 1.5;
    x.stroke();
    drawText(x,String(payload.title || '타로 리딩'),M+24,429,BW-2*M-48,{size:18,weight:720,color:'#c7bdcf',max:1});

    roundedRect(x,M,520,BW-2*M,230,26);
    x.fillStyle = 'rgba(255,255,255,.038)';
    x.fill();
    x.strokeStyle = 'rgba(225,211,246,.18)';
    x.stroke();
    drawText(x,'READING MAP',M+28,548,BW-2*M-56,{size:14,weight:850,color:'#ead3a1',max:1});
    drawText(x,`${mainCount} TAROT`,M+28,594,340,{size:34,weight:820,color:'#f7f3fb',max:1});
    drawText(x,'메인 카드 배열은 다음 페이지에서 전체 확인',M+28,642,430,{size:15,weight:560,color:'#aaa1b7',max:2});
    drawText(x,support.length ? support.join('  ·  ') : '추가 보조 결과 없음',M+500,594,BW-M-(M+500),{size:17,weight:700,color:'#cbbce5',lineHeight:1.5,max:4});

    roundedRect(x,M,800,BW-2*M,250,26);
    x.fillStyle = 'rgba(255,255,255,.038)';
    x.fill();
    x.strokeStyle = 'rgba(225,211,246,.18)';
    x.stroke();
    drawText(x,'SPREAD NOTE',M+28,828,BW-2*M-56,{size:14,weight:850,color:'#ead3a1',max:1});
    drawText(x,payload.rationale || '현재 리딩의 질문과 카드 결과',M+28,870,BW-2*M-56,{size:18,weight:560,color:'#f3eef8',lineHeight:1.52,max:6});

    roundedRect(x,M,1090,BW-2*M,82,22);
    x.fillStyle = 'rgba(255,255,255,.03)';
    x.fill();
    x.strokeStyle = 'rgba(225,211,246,.13)';
    x.stroke();
    drawText(x,'카드 이미지는 2페이지부터 중복 없이 전체 배열로 표시',M+24,1117,BW-2*M-48,{size:16,weight:650,color:'#a99fb5',align:'center',max:2});

    x.fillStyle = '#050408';
    x.fillRect(0,1274,BW,76);
    x.strokeStyle = 'rgba(255,255,255,.09)';
    x.beginPath();
    x.moveTo(M,1284);
    x.lineTo(BW-M,1284);
    x.stroke();
    setFont(x,14,650);
    x.fillStyle = '#8f879c';
    x.fillText('LUNEA · SHARE',M,1300);
    x.textAlign = 'right';
    x.fillText(`1/${totalPages}`,BW-M,1300);
    x.textAlign = 'left';

    return c;
  }

  async function normalizeResult(result) {
    const sourcePages = Array.isArray(result?.pages) ? result.pages : [];
    if (!sourcePages.length) throw new Error('생성된 PNG 페이지가 없어.');

    const pages = [...sourcePages];
    pages[0] = buildOverviewCover(result,pages.length);

    const files = [];
    for (let i = 0; i < pages.length; i += 1) {
      status(`PNG 정리 중… ${i + 1}/${pages.length}`);
      const source = pages[i];
      if (!source || !source.width || !source.height) throw new Error(`PNG ${i + 1}페이지 캔버스 오류`);

      const flat = document.createElement('canvas');
      flat.width = BW;
      flat.height = BH;
      const ctx = flat.getContext('2d', {alpha:false});
      if (!ctx) throw new Error('PNG 캔버스를 만들지 못했어.');
      ctx.imageSmoothingEnabled = true;
      try { ctx.imageSmoothingQuality = 'high'; } catch {}
      ctx.fillStyle = '#07050b';
      ctx.fillRect(0, 0, BW, BH);
      ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, BW, BH);

      const blob = await canvasToBlob(flat);
      await verifyPngBlob(blob);
      files.push(new File([blob], `LUNEA_${String(i + 1).padStart(2, '0')}.png`, {type:'image/png'}));

      flat.width = 1;
      flat.height = 1;
    }

    return {...result, files, pages:[], outputNormalized:true, coverDeduplicated:true};
  }

  function style() {
    if ($('luneaReadingShareUiV6Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaReadingShareUiV6Style';
    s.textContent = `
      #luneaSharePreviewOverlayV3,#luneaSharePreviewOverlayV4,#luneaSharePreviewOverlayV5{display:none!important}
      #${OV}{position:fixed;inset:0;z-index:12480;display:none;background:radial-gradient(circle at 50% 14%,rgba(124,92,181,.16),transparent 30%),linear-gradient(180deg,#08070d 0%,#06050a 100%);color:#f7f3fb;-webkit-tap-highlight-color:transparent}
      #${OV}[data-open="true"]{display:block}
      #${OV} *{box-sizing:border-box}
      #${OV} .topbar{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top)) 18px 10px;background:linear-gradient(180deg,rgba(7,6,11,.96),rgba(7,6,11,.52),transparent)}
      #${OV} .eyebrow{font-size:10px;font-weight:850;letter-spacing:.17em;color:#c7b5ee;margin-bottom:4px}
      #${OV} .titleline{display:flex;align-items:baseline;gap:9px;min-width:0}
      #${OV} h3{margin:0;font-size:17px;line-height:1.15;letter-spacing:-.02em;white-space:nowrap}
      #${COUNT}{font-size:12px;color:#9e94ab;white-space:nowrap}
      #${OV} .close{width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;border:1px solid rgba(255,255,255,.08);border-radius:50%;background:rgba(255,255,255,.055);color:#d4c9df;font-size:27px;line-height:1}
      #${STATUS}{position:absolute;z-index:3;left:18px;right:18px;top:calc(72px + env(safe-area-inset-top));text-align:center;font-size:11px;color:#948a9f;min-height:18px;pointer-events:none}
      #${TRACK}{position:absolute;inset:0;display:flex;overflow-x:auto;overflow-y:hidden;gap:0;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x;}
      #${TRACK}::-webkit-scrollbar{display:none}
      #${TRACK} .slide{flex:0 0 100%;width:100%;height:100%;scroll-snap-align:center;display:flex;align-items:center;justify-content:center;padding:calc(104px + env(safe-area-inset-top)) 18px calc(126px + env(safe-area-inset-bottom))}
      #${TRACK} img{display:block;width:auto;height:auto;max-width:min(92vw,620px);max-height:calc(100dvh - 250px);aspect-ratio:4/5;object-fit:contain;border-radius:22px;border:1px solid rgba(255,255,255,.10);background:#0a0810;box-shadow:0 26px 70px rgba(0,0,0,.48),0 0 0 1px rgba(198,176,238,.04);pointer-events:none;user-select:none;-webkit-user-drag:none}
      #${OV} .bottom{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:10px 18px calc(14px + env(safe-area-inset-bottom));background:linear-gradient(180deg,transparent,rgba(7,6,11,.82) 24%,#07060b 58%)}
      #${OV} .meta{display:flex;align-items:center;justify-content:center;min-height:22px;margin-bottom:8px}
      #${OV} .dots{display:flex;gap:6px;align-items:center;justify-content:center;max-width:190px;overflow:hidden}
      #${OV} .dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.18);transition:.18s ease}
      #${OV} .dot.on{width:20px;border-radius:99px;background:#c5adff}
      #${SHARE}{width:100%;min-height:56px;border:1px solid rgba(220,205,255,.40);border-radius:18px;background:linear-gradient(135deg,#9f7de7 0%,#6c55a2 100%);color:#fff;font-size:17px;font-weight:850;letter-spacing:-.015em;box-shadow:0 14px 34px rgba(85,63,134,.28)}
      #${SHARE}:disabled{opacity:.42;box-shadow:none}
      @media (min-width:700px){#${OV} .topbar{padding-left:26px;padding-right:26px}#${OV} .bottom{padding-left:26px;padding-right:26px}#${SHARE}{max-width:520px;display:block;margin:0 auto}}
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
        <div>
          <div class="eyebrow">LUNEA · SHARE</div>
          <div class="titleline"><h3>공유용 PNG</h3><span id="${COUNT}">0 / 0</span></div>
        </div>
        <button class="close" type="button" aria-label="닫기">×</button>
      </div>
      <div id="${STATUS}"></div>
      <div id="${TRACK}" data-horizontal-scroll="true" aria-label="공유 PNG 미리보기"></div>
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

  function status(v) {
    const e = $(STATUS);
    if (e) e.textContent = v || '';
  }

  function close() {
    const o = $(OV);
    if (o) o.dataset.open = 'false';
    prepared = null;
    revoke();
    unlockBody();
  }

  function updateIndex(i,total) {
    const n = $(COUNT);
    if (n) n.textContent = total ? `${i + 1} / ${total}` : '0 / 0';
    overlay().querySelectorAll('.dot').forEach((d,k) => d.classList.toggle('on',k === i));
  }

  function onScroll() {
    const t = $(TRACK);
    if (!t || !prepared?.files?.length) return;
    const w = t.clientWidth || 1;
    const i = Math.max(0,Math.min(prepared.files.length - 1,Math.round(t.scrollLeft / w)));
    updateIndex(i,prepared.files.length);
  }

  function show(result) {
    hideLegacy();
    const o = overlay();
    const t = $(TRACK);
    const dots = o.querySelector('.dots');
    prepared = result;
    revoke();
    t.replaceChildren();
    dots.replaceChildren();

    const files = result?.files || [];
    files.forEach((file,i) => {
      const u = URL.createObjectURL(file);
      urls.push(u);
      const slide = document.createElement('div');
      slide.className = 'slide';
      const im = new Image();
      im.src = u;
      im.alt = `LUNEA 공유 이미지 ${i + 1}`;
      slide.appendChild(im);
      t.appendChild(slide);
      const d = document.createElement('span');
      d.className = 'dot' + (i === 0 ? ' on' : '');
      dots.appendChild(d);
    });

    t.scrollLeft = 0;
    const can = !!(navigator.share && (!navigator.canShare || navigator.canShare({files})));
    $(SHARE).disabled = !can;
    $(SHARE).textContent = can ? `공유창 열기 · ${files.length}장` : '이 기기에서는 파일 공유를 지원하지 않음';
    status(files.length ? '1080 × 1350 PNG · 좌우로 넘겨서 확인' : '생성된 PNG가 없어.');
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
    const b = $(BTN);
    const old = b?.textContent;
    const o = overlay();
    lockBody();
    o.dataset.open = 'true';
    $(TRACK).replaceChildren();
    o.querySelector('.dots').replaceChildren();
    $(SHARE).disabled = true;
    updateIndex(0,0);
    status('PNG 만드는 중…');
    if (b) { b.disabled = true; b.textContent = 'PNG 만드는 중…'; }

    try {
      const raw = await r.compose();
      show(await normalizeResult(raw));
    } catch (e) {
      console.error('[LUNEA share UI V6]', e);
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
    W.LUNEA_READING_SHARE_UI_V6 = Object.freeze({version:'6.1',prepare,close,normalizeResult});
    console.info('✨ LUNEA Reading Share UI V6.1 ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
