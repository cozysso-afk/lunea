'use strict';

/* LUNEA LENORMAND POLISH V1
   - mobile-first 3/5/9 layouts + reveal motion
   - question-boundary reset so a new question cannot reuse old cards
   - 4:5 PNG export with full AI interpretation pages
   - archive restore overlay for saved Lenormand readings
*/
(() => {
  const W = window;
  if (W.__LUNEA_LENORMAND_POLISH_V1__) return;
  W.__LUNEA_LENORMAND_POLISH_V1__ = true;

  const BW = 1080;
  const BH = 1350;
  const M = 64;
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const palette = Object.freeze({bg:'#080914',panel:'#121421',text:'#f6f0e4',dim:'#b9b3c5',gold:'#e7c879',line:'rgba(231,200,121,.24)'});
  const imageCache = new Map();
  let core = null;
  let cardObserver = null;
  let archiveObserver = null;

  function status(text, kind='') {
    const node = $('lnStatus');
    if (!node) return;
    node.textContent = text;
    node.className = `ln-status${kind ? ` ${kind}` : ''}`;
  }

  function installStyle() {
    if ($('luneaLenormandPolishV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaLenormandPolishV1Style';
    style.textContent = `
      @keyframes lnCardRevealV1{
        from{opacity:0;transform:translateY(16px) scale(.965);filter:brightness(.72)}
        to{opacity:1;transform:none;filter:none}
      }
      #luneaLenormandOverlay .ln-card.ln-reveal-v1{
        animation:lnCardRevealV1 .42s cubic-bezier(.2,.8,.2,1) both;
        animation-delay:calc(var(--ln-i,0) * 70ms);
      }
      #luneaLenormandOverlay .ln-cards[data-count="5"]{
        display:flex;overflow-x:auto;gap:9px;padding:3px 2px 10px;
        scroll-snap-type:x proximity;overscroll-behavior-x:contain;
        -webkit-overflow-scrolling:touch;
      }
      #luneaLenormandOverlay .ln-cards[data-count="5"] .ln-card{
        flex:0 0 clamp(104px,29vw,132px);scroll-snap-align:center;
      }
      #luneaLenormandOverlay .ln-cards[data-count="3"] .ln-card,
      #luneaLenormandOverlay .ln-cards[data-count="9"] .ln-card{min-width:0}
      #luneaLenormandOverlay .ln-card img{background:#0b0c16}
      #luneaLenormandOverlay #lnPng{border-color:rgba(231,200,121,.34)}
      .ln-archive-restore{margin-left:6px}
      #luneaLenormandArchiveOverlay{z-index:10045}
      #luneaLenormandArchiveOverlay .ln-archive-modal{max-width:760px;width:min(94vw,760px);max-height:92vh;overflow:auto;padding:18px;-webkit-overflow-scrolling:touch}
      #luneaLenormandArchiveOverlay .ln-archive-q{font:600 14px/1.62 'Noto Serif KR',serif;margin:8px 0 14px;color:var(--text)}
      #luneaLenormandArchiveOverlay .ln-archive-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      #luneaLenormandArchiveOverlay .ln-archive-card{text-align:center;min-width:0}
      #luneaLenormandArchiveOverlay .ln-archive-card img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:9px;border:1px solid rgba(231,200,121,.24)}
      #luneaLenormandArchiveOverlay .ln-archive-card b{display:block;margin-top:4px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #luneaLenormandArchiveOverlay .ln-archive-ai{margin-top:14px;padding:13px;border-radius:13px;background:rgba(189,164,248,.07);white-space:pre-wrap;font:400 12px/1.75 'Noto Serif KR',serif}
      #luneaLenormandArchiveOverlay .ln-archive-actions{display:flex;gap:8px;margin-top:12px}
      #luneaLenormandArchiveOverlay .ln-archive-actions button{flex:1}
      @media(max-width:520px){
        #luneaLenormandOverlay .ln-cards[data-count="3"]{gap:5px}
        #luneaLenormandOverlay .ln-cards[data-count="3"] .ln-card b{font-size:8.4px}
        #luneaLenormandOverlay .ln-cards[data-count="9"]{gap:5px}
        #luneaLenormandOverlay .ln-cards[data-count="9"] .ln-card b{font-size:7.8px}
        #luneaLenormandArchiveOverlay .ln-archive-cards{gap:5px}
      }
      @media(prefers-reduced-motion:reduce){
        #luneaLenormandOverlay .ln-card.ln-reveal-v1{animation:none!important}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function deckById(id) {
    return core?.cards?.find(card => card.id === id) || null;
  }

  function currentPayload() {
    const snap = core?.snapshot?.();
    if (!snap?.cards?.length) throw new Error('먼저 레노먼드 카드를 뽑아줘.');
    const cards = snap.cards.map(deckById).filter(Boolean);
    return {
      question:String($('lnQuestion')?.value || snap.question || '').trim(),
      count:cards.length,
      spread:core.spreads?.[cards.length]?.label || `${cards.length}장`,
      cards,
      ai:String($('lnAIText')?.textContent || snap.ai || '').trim(),
      date:new Date().toLocaleString('ko-KR')
    };
  }

  function payloadFromArchive(item) {
    const ids = Array.isArray(item?.lenormand?.cards) ? item.lenormand.cards : [];
    const cards = ids.map(deckById).filter(Boolean);
    if (!cards.length) throw new Error('저장된 레노먼드 카드 정보를 찾지 못했어.');
    return {
      question:String(item?.q || '').trim(),
      count:cards.length,
      spread:core.spreads?.[cards.length]?.label || item?.title || `${cards.length}장`,
      cards,
      ai:String(item?.lenormand?.ai || item?.ai || '').trim(),
      date:String(item?.date || '')
    };
  }

  function bindQuestionBoundary() {
    const input = $('lnQuestion');
    if (!input || input.dataset.lnBoundaryV1 === '1') return;
    input.dataset.lnBoundaryV1 = '1';
    input.addEventListener('input', () => {
      const snap = core?.snapshot?.();
      if (!snap?.cards?.length) return;
      if (String(input.value || '').trim() === String(snap.question || '').trim()) return;
      const selected = document.querySelector('#lnSpreads .ln-spread[aria-pressed="true"]');
      selected?.click();
      status('새 질문으로 변경됨 · 이전 카드 결과를 초기화했어.');
    });
  }

  function bindFreshHomeEntry() {
    const tile = document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]');
    if (!tile || tile.dataset.lnFreshV1 === '1') return;
    tile.dataset.lnFreshV1 = '1';
    tile.addEventListener('click', () => {
      const snap = core?.snapshot?.();
      if (!snap?.cards?.length) return;
      document.querySelector('#lnSpreads .ln-spread[aria-pressed="true"]')?.click();
      const input = $('lnQuestion');
      if (input) input.value = '';
    }, true);
  }

  function animateCards() {
    const root = $('lnCards');
    if (!root) return;
    [...root.querySelectorAll('.ln-card')].forEach((node,index) => {
      node.style.setProperty('--ln-i', String(index));
      node.classList.remove('ln-reveal-v1');
      void node.offsetWidth;
      node.classList.add('ln-reveal-v1');
    });
  }

  function bindCardObserver() {
    const root = $('lnCards');
    if (!root || root.dataset.lnRevealObserver === '1') return;
    root.dataset.lnRevealObserver = '1';
    cardObserver = new MutationObserver(() => animateCards());
    cardObserver.observe(root,{childList:true});
  }

  function ensurePngButton() {
    const actions = $('lnActions');
    if (!actions || $('lnPng')) return;
    const button = document.createElement('button');
    button.className = 'mini';
    button.id = 'lnPng';
    button.type = 'button';
    button.textContent = '🖼 결과 PNG';
    button.addEventListener('click', () => prepareShare().catch(error => {
      console.error('[Lenormand PNG]', error);
      status(`PNG 생성 실패: ${error?.message || error}`,'err');
    }));
    actions.appendChild(button);
  }

  function canvasPage() {
    const canvas = document.createElement('canvas');
    canvas.width = BW;
    canvas.height = BH;
    const ctx = canvas.getContext('2d',{alpha:false});
    const gradient = ctx.createLinearGradient(0,0,BW,BH);
    gradient.addColorStop(0,'#171426');
    gradient.addColorStop(.52,palette.bg);
    gradient.addColorStop(1,'#04050b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,BW,BH);
    return [canvas,ctx];
  }

  function setFont(ctx,size,weight=500,serif=false) {
    ctx.font = `${weight} ${size}px ${serif?'"Noto Serif KR",Georgia,serif':'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'}`;
    ctx.textBaseline = 'top';
  }

  function wrapLines(ctx,text,width,max=99) {
    const out = [];
    for (const paragraph of String(text || '').replace(/\r/g,'').split('\n')) {
      if (!paragraph) { out.push(''); continue; }
      let line = '';
      for (const char of paragraph) {
        const next = line + char;
        if (line && ctx.measureText(next).width > width) { out.push(line); line = char; }
        else line = next;
        if (out.length >= max) break;
      }
      if (out.length >= max) break;
      if (line) out.push(line);
    }
    return out.slice(0,max);
  }

  function drawText(ctx,text,x,y,width,options={}) {
    const size = options.size || 24;
    const lh = size * (options.lh || 1.42);
    setFont(ctx,size,options.weight || 500,!!options.serif);
    ctx.fillStyle = options.color || palette.text;
    ctx.textAlign = options.align || 'left';
    const lines = wrapLines(ctx,text,width,options.max || 99);
    const px = options.align === 'center' ? x + width/2 : options.align === 'right' ? x + width : x;
    lines.forEach((line,index) => ctx.fillText(line,px,y + index*lh));
    ctx.textAlign = 'left';
    return lines.length * lh;
  }

  function brand(ctx,right='LENORMAND') {
    setFont(ctx,22,800);
    ctx.fillStyle = '#d9c8ff';
    ctx.fillText('☾  L U N E A',M,42);
    setFont(ctx,16,700);
    ctx.fillStyle = palette.dim;
    ctx.textAlign = 'right';
    ctx.fillText(right,BW-M,48);
    ctx.textAlign = 'left';
  }

  function footer(ctx,index,total) {
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.moveTo(M,1285); ctx.lineTo(BW-M,1285); ctx.stroke();
    setFont(ctx,14,650);
    ctx.fillStyle = '#8f8999';
    ctx.fillText('LUNEA · LENORMAND',M,1302);
    ctx.textAlign = 'right';
    ctx.fillText(`${index}/${total}`,BW-M,1302);
    ctx.textAlign = 'left';
  }

  function loadImage(src) {
    const key = String(src || '');
    if (!key) return Promise.resolve(null);
    if (imageCache.has(key)) return imageCache.get(key);
    const promise = new Promise(resolve => {
      const image = new Image();
      const timer = setTimeout(() => resolve(null),12000);
      image.onload = async () => { clearTimeout(timer); try { await image.decode?.(); } catch {} resolve(image); };
      image.onerror = () => { clearTimeout(timer); resolve(null); };
      image.src = new URL(key,location.href).href;
    });
    imageCache.set(key,promise);
    return promise;
  }

  function drawContained(ctx,image,x,y,w,h) {
    if (!image?.naturalWidth) return;
    const scale = Math.min(w/image.naturalWidth,h/image.naturalHeight);
    const dw = image.naturalWidth*scale;
    const dh = image.naturalHeight*scale;
    ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }

  async function coverPage(payload) {
    const [canvas,ctx] = canvasPage();
    brand(ctx,'LENORMAND');
    drawText(ctx,payload.spread.toUpperCase(),M,98,BW-2*M,{size:15,weight:800,color:palette.gold,max:1});
    let y = 130;
    y += drawText(ctx,payload.question || '질문 없는 저장 리딩',M,y,BW-2*M,{size:34,weight:800,lh:1.22,max:4,serif:true}) + 24;
    drawText(ctx,payload.date || '',M,y,BW-2*M,{size:14,color:palette.dim,max:1});
    y += 42;

    const count = payload.cards.length;
    let cols = count === 9 ? 3 : count;
    let gap = count === 5 ? 18 : 34;
    let cardW = count === 3 ? 250 : count === 5 ? 176 : 160;
    let cardH = Math.round(cardW * 1.5);
    const rows = Math.ceil(count/cols);
    if (count === 9) gap = 24;
    const rowGap = count === 9 ? 40 : 0;
    const blockW = cols*cardW + (cols-1)*gap;
    const startX = (BW-blockW)/2;

    for (let i=0;i<count;i++) {
      const row = Math.floor(i/cols);
      const col = i%cols;
      const x = startX + col*(cardW+gap);
      const cy = y + row*(cardH+rowGap+34);
      ctx.fillStyle = '#0b0c14';
      ctx.fillRect(x,cy,cardW,cardH);
      ctx.strokeStyle = palette.line;
      ctx.strokeRect(x+.5,cy+.5,cardW-1,cardH-1);
      const image = await loadImage(payload.cards[i].image);
      if (image) drawContained(ctx,image,x+3,cy+3,cardW-6,cardH-6);
      drawText(ctx,`${String(payload.cards[i].number).padStart(2,'0')} ${payload.cards[i].en} · ${payload.cards[i].ko}`,x-8,cy+cardH+8,cardW+16,{size:count===9?11:12,weight:700,align:'center',max:1});
    }

    const bottom = y + rows*(cardH+34) + Math.max(0,rows-1)*rowGap;
    if (count !== 9) {
      drawText(ctx,payload.cards.map(c=>c.ko).join('  →  '),M,Math.min(bottom+18,1120),BW-2*M,{size:18,weight:700,color:palette.gold,align:'center',max:2});
      if (payload.ai) drawText(ctx,'AI 조합 해석은 다음 페이지에 이어집니다.',M,1192,BW-2*M,{size:15,color:palette.dim,align:'center',max:1});
    }
    return canvas;
  }

  function aiLinePages(text) {
    if (!text) return [];
    const [,measure] = canvasPage();
    setFont(measure,23,500,true);
    const lines = wrapLines(measure,text,BW-2*M,500);
    const perPage = 27;
    const pages = [];
    for (let i=0;i<lines.length;i+=perPage) pages.push(lines.slice(i,i+perPage));
    return pages;
  }

  function aiPage(lines,pageNo,pageCount) {
    const [canvas,ctx] = canvasPage();
    brand(ctx,`INTERPRETATION ${pageNo}/${pageCount}`);
    drawText(ctx,'AI 조합 해석',M,100,BW-2*M,{size:32,weight:800,serif:true,max:1});
    ctx.strokeStyle = palette.line;
    ctx.beginPath(); ctx.moveTo(M,160); ctx.lineTo(BW-M,160); ctx.stroke();
    let y = 194;
    setFont(ctx,23,500,true);
    ctx.fillStyle = palette.text;
    const lh = 35;
    for (const line of lines) {
      ctx.fillText(line,M,y);
      y += lh;
    }
    return canvas;
  }

  function canvasToFile(canvas,name) {
    return new Promise((resolve,reject) => canvas.toBlob(blob => {
      if (!blob) return reject(new Error('PNG 인코딩에 실패했어.'));
      resolve(new File([blob],name,{type:'image/png'}));
    },'image/png',0.96));
  }

  async function renderFiles(payload=currentPayload()) {
    const pages = [await coverPage(payload)];
    const aiPages = aiLinePages(payload.ai);
    aiPages.forEach((lines,index) => pages.push(aiPage(lines,index+1,aiPages.length)));
    const stamp = new Date().toISOString().slice(0,10).replaceAll('-','');
    const files = [];
    for (let i=0;i<pages.length;i++) files.push(await canvasToFile(pages[i],`lunea_lenormand_${stamp}_${i+1}.png`));
    return files;
  }

  async function deliverFiles(files) {
    if (navigator.share && navigator.canShare?.({files})) {
      try {
        await navigator.share({title:'LUNEA · LENORMAND',files});
        return 'shared';
      } catch (error) {
        if (error?.name === 'AbortError') return 'cancelled';
      }
    }
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url),5000);
      await new Promise(resolve => setTimeout(resolve,120));
    }
    return 'downloaded';
  }

  async function prepareShare(payload=currentPayload()) {
    const button = $('lnPng');
    if (button) { button.disabled = true; button.textContent = 'PNG 생성 중…'; }
    status('4:5 결과 PNG를 만드는 중…');
    try {
      const files = await renderFiles(payload);
      const result = await deliverFiles(files);
      if (result === 'cancelled') status('PNG 공유를 취소했어.');
      else status(`${files.length}장 PNG 준비 완료`,'ok');
      return files;
    } finally {
      if (button) { button.disabled = false; button.textContent = '🖼 결과 PNG'; }
    }
  }

  function archiveRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function createArchiveOverlay() {
    if ($('luneaLenormandArchiveOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'luneaLenormandArchiveOverlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `<div class="modal ln-archive-modal"><button class="close" id="lnArchiveClose" type="button">×</button><div class="sub">LUNEA · LENORMAND · SAVED</div><h3 class="modal-h" id="lnArchiveTitle">저장된 레노먼드</h3><div class="ln-archive-q" id="lnArchiveQuestion"></div><div class="ln-archive-cards" id="lnArchiveCards"></div><div class="ln-archive-ai" id="lnArchiveAI"></div><div class="ln-archive-actions"><button class="mini" id="lnArchivePng" type="button">🖼 PNG 저장</button></div></div>`;
    document.body.appendChild(overlay);
    $('lnArchiveClose').onclick = () => {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
    };
    overlay.addEventListener('pointerup',event => { if (event.target === overlay) $('lnArchiveClose').click(); });
  }

  function openArchiveItem(item) {
    createArchiveOverlay();
    const payload = payloadFromArchive(item);
    $('lnArchiveTitle').textContent = `${payload.spread} · ${item.date || ''}`;
    $('lnArchiveQuestion').textContent = payload.question || '질문 없음';
    $('lnArchiveCards').innerHTML = payload.cards.map(card => `<div class="ln-archive-card"><img src="${esc(card.image)}" alt="${esc(card.ko)}"><b>${String(card.number).padStart(2,'0')} ${esc(card.en)} · ${esc(card.ko)}</b></div>`).join('');
    $('lnArchiveAI').textContent = payload.ai || '저장된 AI 조합 해석 없음';
    $('lnArchivePng').onclick = () => prepareShare(payload).catch(error => alert(error?.message || error));
    const overlay = $('luneaLenormandArchiveOverlay');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  }

  function enhanceArchiveRows() {
    const root = $('archiveList');
    if (!root) return;
    const items = archiveRows().filter(item => item?.lenormand?.cards?.length);
    if (!items.length) return;
    [...root.querySelectorAll('.archive-item')].forEach(row => {
      if (row.querySelector('.ln-archive-restore')) return;
      const text = String(row.textContent || '');
      const item = items.find(candidate => text.includes(String(candidate.title || 'LENORMAND')) && (!candidate.q || text.includes(String(candidate.q))));
      if (!item) return;
      const target = row.querySelector('.archive-actions') || row;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mini ln-archive-restore';
      button.textContent = '레노먼드 다시 보기';
      button.addEventListener('click',event => { event.preventDefault(); event.stopPropagation(); openArchiveItem(item); });
      target.appendChild(button);
    });
  }

  function bindArchiveObserver() {
    const root = $('archiveOverlay') || $('archiveList');
    if (!root || root.dataset.lnArchiveObserver === '1') return;
    root.dataset.lnArchiveObserver = '1';
    archiveObserver = new MutationObserver(() => queueMicrotask(enhanceArchiveRows));
    archiveObserver.observe(root,{childList:true,subtree:true});
    enhanceArchiveRows();
  }

  function enhance() {
    if (!core) core = W.LUNEA_LENORMAND_V1;
    if (!core) return false;
    installStyle();
    bindQuestionBoundary();
    bindFreshHomeEntry();
    bindCardObserver();
    ensurePngButton();
    bindArchiveObserver();
    createArchiveOverlay();
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ready = enhance();
      if ((ready && $('lnPng')) || tries >= 120) clearInterval(timer);
    },100);
    W.addEventListener('pageshow',() => setTimeout(enhance,80),{passive:true});
    document.addEventListener('visibilitychange',() => { if (!document.hidden) setTimeout(enhance,80); });
  }

  W.LUNEA_LENORMAND_POLISH_V1 = Object.freeze({
    version:'1.0',
    enhance,
    currentPayload,
    payloadFromArchive,
    renderFiles,
    prepareShare,
    openArchiveItem,
    enhanceArchiveRows
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
