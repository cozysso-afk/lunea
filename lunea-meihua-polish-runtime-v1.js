'use strict';

/*
  LUNEA MEIHUA POLISH V1
  ======================
  - Restores saved Meihua readings without recalculating them.
  - Reuses the existing journal detail action; no nested archive overlay.
  - Exports a deterministic 1080x1350 summary PNG with no image assets.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MEIHUA_POLISH_V1__) return;
  W.__LUNEA_MEIHUA_POLISH_V1__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const BW = 1080, BH = 1350, M = 64;
  const $ = id => document.getElementById(id);
  const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  let restoredReading = null;
  let preparedFile = null;
  let previewUrl = '';

  function isMeihua(reading) {
    return !!(
      reading?.meihua?.version === 1 ||
      reading?.meihua?.calculation?.primary?.number ||
      /^MEIHUA\b/i.test(String(reading?.title || ''))
    );
  }

  function readArchive() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function rowTitle(row) {
    const node = row?.querySelector?.('.archive-title');
    if (!node) return '';
    const clone = node.cloneNode(true);
    clone.querySelectorAll('.lj-badge').forEach(n => n.remove());
    return norm(clone.textContent);
  }

  function rowQuestion(row) {
    return norm(row?.querySelector?.('.archive-q')?.textContent || '');
  }

  function archiveReadingForRow(row) {
    const rows = readArchive().slice().sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    const sourceId = String(row?.dataset?.sourceArchiveId || row?.dataset?.archiveId || '');
    if (sourceId) {
      const byId = rows.find(item => String(item?.id || '') === sourceId && isMeihua(item));
      if (byId) return byId;
    }
    const title = rowTitle(row), question = rowQuestion(row);
    return rows.find(item => isMeihua(item) && norm(item?.title) === title && norm(item?.q) === question)
      || rows.find(item => isMeihua(item) && question && norm(item?.q) === question)
      || null;
  }

  function detailButton(row) {
    const actions = row?.querySelector?.('.archive-actions');
    if (!actions) return null;
    const buttons = [...actions.querySelectorAll(':scope > button')];
    return buttons.find(btn => /카드\s*[/·]?\s*해석|리딩\s*상세|매화역수\s*상세/.test(norm(btn.textContent)))
      || (buttons.length >= 4 ? buttons[1] : null);
  }

  function closeArchiveOverlay() {
    const overlay = $('archiveOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    overlay.style.pointerEvents = 'none';
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function lineMarkup(hex, movingLine=0) {
    return (hex?.lines || []).map((value,index) => {
      const cls = value ? 'yang' : 'yin';
      const moving = movingLine === index + 1 ? ' moving' : '';
      return `<div class="mh-line ${cls}${moving}" data-line="${index+1}">${value?'<span class="seg"></span>':'<span class="seg"></span><span class="seg"></span>'}</div>`;
    }).join('');
  }

  function hexCard(kind, hex, movingLine=0) {
    if (!hex) return '';
    return `<div class="mh-hex" data-kind="${esc(kind)}"><div class="mh-kind">${esc(kind)}</div><div class="mh-symbols"><span>${esc(hex.upper?.symbol || '')}</span><span>${esc(hex.lower?.symbol || '')}</span></div><div class="mh-name">${Number(hex.number || 0)}. ${esc(hex.ko || '')}</div><div class="mh-hanja">${esc(hex.hanja || '')}</div><div class="mh-lines">${lineMarkup(hex,movingLine)}</div></div>`;
  }

  function formatLocal(result) {
    const q = result?.questionTime;
    const l = q?.local;
    if (!q || !l) return '';
    return `${l.year}.${String(l.month).padStart(2,'0')}.${String(l.day).padStart(2,'0')} ${String(l.hour).padStart(2,'0')}:${String(l.minute).padStart(2,'0')} · ${q.timeZone || ''}`;
  }

  function ensureArchiveCopyButton() {
    const actions = $('mhSave')?.closest?.('.mh-actions');
    if (!actions) return null;
    let button = $('mhArchiveCopy');
    if (!button) {
      button = document.createElement('button');
      button.id = 'mhArchiveCopy';
      button.type = 'button';
      button.className = 'mini';
      button.textContent = '📋 기록 복사';
      button.hidden = true;
      button.onclick = async () => {
        const reading = restoredReading;
        if (!reading) return;
        const r = reading.meihua?.calculation;
        const text = [
          'LUNEA · MEIHUA · 매화역수',
          '', '[질문]', reading.q || '', '',
          `[본괘] ${r?.primary?.number || ''} ${r?.primary?.hanja || ''} (${r?.primary?.ko || ''})`,
          `[호괘] ${r?.mutual?.number || ''} ${r?.mutual?.hanja || ''} (${r?.mutual?.ko || ''})`,
          `[변괘] ${r?.changed?.number || ''} ${r?.changed?.hanja || ''} (${r?.changed?.ko || ''})`,
          `[동효] ${r?.movingLine || ''}효`,
          `[體] ${r?.bodyUse?.body?.hanja || ''} ${r?.bodyUse?.body?.elementKo || ''}`,
          `[用] ${r?.bodyUse?.use?.hanja || ''} ${r?.bodyUse?.use?.elementKo || ''}`,
          `[체용] ${r?.bodyUse?.primaryRelation?.hanja || ''} ${r?.bodyUse?.primaryRelation?.ko || ''}`,
          reading.ai ? `\n[AI 해석]\n${reading.ai}` : ''
        ].filter(v => v !== null && v !== undefined).join('\n');
        try {
          await navigator.clipboard.writeText(text);
          const old = button.textContent;
          button.textContent = '✓ 복사 완료';
          setTimeout(() => { if (button.isConnected) button.textContent = old; }, 1000);
        } catch { alert('복사 권한을 확인해줘.'); }
      };
      actions.appendChild(button);
    }
    return button;
  }

  function ensurePngButton() {
    const actions = $('mhSave')?.closest?.('.mh-actions');
    if (!actions) return null;
    let button = $('mhPng');
    if (!button) {
      button = document.createElement('button');
      button.id = 'mhPng';
      button.type = 'button';
      button.className = 'mini';
      button.textContent = '🖼 PNG 저장';
      button.onclick = preparePng;
      actions.appendChild(button);
    }
    return button;
  }

  function resetRestoreMode() {
    restoredReading = null;
    const overlay = $('luneaMeihuaOverlay');
    overlay?.removeAttribute('data-meihua-restore');
    const q = $('mhQuestion');
    if (q) q.readOnly = false;
    for (const id of ['mhCast','mhAI','mhCopy','mhSave']) {
      const node = $(id);
      if (node) node.hidden = false;
    }
    const archiveCopy = ensureArchiveCopyButton();
    if (archiveCopy) archiveCopy.hidden = true;
  }

  function renderRestoredReading(reading) {
    const r = reading?.meihua?.calculation;
    if (!r?.primary || !r?.mutual || !r?.changed) throw new Error('저장된 매화역수 계산값이 불완전해.');
    restoredReading = reading;
    const overlay = $('luneaMeihuaOverlay');
    overlay?.setAttribute('data-meihua-restore','1');
    const q = $('mhQuestion');
    if (q) { q.value = String(reading.q || ''); q.readOnly = true; }
    $('mhFlow').innerHTML = hexCard('PRIMARY · 本卦',r.primary,r.movingLine) + hexCard('MUTUAL · 互卦',r.mutual,0) + hexCard('CHANGED · 變卦',r.changed,0);
    const qt = r.questionTime || {};
    const bu = r.bodyUse || {};
    $('mhEvidence').innerHTML = `
      <div class="mh-panel"><h4>기괘 계산</h4><p><strong>질문 시각</strong> ${esc(formatLocal(r))}</p><p><strong>음력</strong> ${esc(qt.lunar?.relatedYear || '')}년 ${qt.lunar?.isLeapMonth?'윤':''}${esc(qt.lunar?.month || '')}월 ${esc(qt.lunar?.day || '')}일</p><p><strong>연지 / 시지</strong> ${esc(qt.yearBranch?.hanja || '')}${esc(qt.yearBranch?.ko || '')} ${esc(qt.yearBranch?.n || '')} · ${esc(qt.hourBranch?.hanja || '')}${esc(qt.hourBranch?.ko || '')} ${esc(qt.hourBranch?.n || '')}</p><p><strong>동효</strong> ${esc(r.movingLine)}효</p></div>
      <div class="mh-panel"><h4>체 · 용</h4><p><strong>體</strong> ${esc(bu.body?.hanja || '')}${esc(bu.body?.symbol || '')} ${esc(bu.body?.ko || '')} · ${esc(bu.body?.elementKo || '')}</p><p><strong>用</strong> ${esc(bu.use?.hanja || '')}${esc(bu.use?.symbol || '')} ${esc(bu.use?.ko || '')} · ${esc(bu.use?.elementKo || '')}</p><p><strong>움직이는 쪽</strong> ${bu.movingSide === 'upper' ? '상괘' : '하괘'} = 用</p><p><strong>변화 후 用</strong> ${esc(bu.changedUse?.hanja || '')}${esc(bu.changedUse?.symbol || '')} · ${esc(bu.changedUse?.elementKo || '')}</p></div>`;
    $('mhRelation').innerHTML = `<b>${esc(bu.primaryRelation?.hanja || '')} · ${esc(bu.primaryRelation?.ko || '')}</b><span>현재: ${esc(bu.primaryRelation?.summary || '')} → 변화 후: ${esc(bu.changedRelation?.hanja || '')} ${esc(bu.changedRelation?.ko || '')} · ${esc(bu.changedRelation?.summary || '')}</span>`;
    $('mhProvenance').textContent = `저장된 계산 · ${r.methodKo || '연·월·일·시 기괘법'} · ${r.provenance?.trigramNumbering || ''} · ${r.provenance?.branchNumbering || ''} · ${r.provenance?.remainderRule || ''} · ${r.provenance?.dayBoundary || ''} · ${r.provenance?.timeZone || qt.timeZone || ''}`;
    const ai = $('mhAIText');
    if (ai) {
      ai.textContent = String(reading.ai || '');
      ai.classList.toggle('show',!!reading.ai);
    }
    $('mhBoard')?.classList.add('show');
    const status = $('mhStatus');
    if (status) { status.textContent = '기록함에서 불러온 매화역수 · 저장된 계산 그대로 표시'; status.className = 'mh-status ok'; }
    for (const id of ['mhCast','mhAI','mhCopy','mhSave']) {
      const node = $(id);
      if (node) node.hidden = true;
    }
    const archiveCopy = ensureArchiveCopyButton();
    if (archiveCopy) archiveCopy.hidden = false;
    ensurePngButton();
  }

  function openArchiveReading(reading) {
    if (!isMeihua(reading)) throw new Error('매화역수 기록이 아니야.');
    closeArchiveOverlay();
    const api = W.LUNEA_MEIHUA_V1;
    if (!api?.open) throw new Error('매화역수 화면을 불러오는 중이야.');
    api.open();
    setTimeout(() => {
      try { renderRestoredReading(reading); }
      catch (error) { console.error('[Meihua archive restore]',error); alert(error?.message || '기록 복원에 실패했어.'); }
    },0);
  }

  function currentReading() {
    if (restoredReading) return restoredReading;
    const snap = W.LUNEA_MEIHUA_V1?.snapshot?.();
    if (!snap?.result) return null;
    return {
      title:`MEIHUA · ${snap.result.primary?.ko || ''} → ${snap.result.changed?.ko || ''}`,
      q:snap.question || '', ai:snap.ai || '',
      meihua:{version:1,calculation:snap.result,questionTime:snap.result.questionTime}
    };
  }

  function canvasPage() {
    const canvas = document.createElement('canvas');
    canvas.width = BW; canvas.height = BH;
    const x = canvas.getContext('2d',{alpha:false});
    const g = x.createLinearGradient(0,0,BW,BH);
    g.addColorStop(0,'#14241f'); g.addColorStop(.52,'#090b11'); g.addColorStop(1,'#050408');
    x.fillStyle = g; x.fillRect(0,0,BW,BH);
    const r = x.createRadialGradient(155,95,0,155,95,520);
    r.addColorStop(0,'rgba(132,206,163,.13)'); r.addColorStop(1,'rgba(132,206,163,0)');
    x.fillStyle = r; x.fillRect(0,0,760,650);
    return [canvas,x];
  }

  function font(x,size,weight=500,serif=false) {
    x.font = `${weight} ${size}px ${serif?'"Noto Serif KR",Georgia,serif':'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'}`;
    x.textBaseline = 'top';
  }

  function wrap(x,value,width,max=99) {
    const out = [];
    for (const p of String(value || '').replace(/\r/g,'').split('\n')) {
      if (!p) { out.push(''); continue; }
      let line = '';
      for (const ch of p) {
        if (line && x.measureText(line + ch).width > width) { out.push(line); line = ch; }
        else line += ch;
        if (out.length >= max) break;
      }
      if (out.length >= max) break;
      if (line) out.push(line);
    }
    return out.slice(0,max);
  }

  function drawText(x,value,a,b,width,{size=24,weight=500,color='#f4f1e8',max=99,lh=1.4,serif=false,align='left'}={}) {
    font(x,size,weight,serif); x.fillStyle = color; x.textAlign = align;
    const lines = wrap(x,value,width,max);
    const px = align === 'center' ? a + width/2 : align === 'right' ? a + width : a;
    lines.forEach((line,i) => x.fillText(line,px,b + i*size*lh));
    x.textAlign = 'left';
    return lines.length*size*lh;
  }

  function rounded(x,a,b,w,h,r,fill,stroke) {
    x.beginPath(); x.roundRect(a,b,w,h,r);
    if (fill) { x.fillStyle = fill; x.fill(); }
    if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1.5; x.stroke(); }
  }

  function drawHexLines(x,hex,movingLine,a,b,w) {
    const lines = hex?.lines || [];
    const lineW = Math.min(118,w - 38), gap = 17, h = 9;
    const start = a + (w-lineW)/2;
    for (let visual=0; visual<6; visual++) {
      const idx = 5 - visual;
      const value = lines[idx];
      const y = b + visual*gap;
      x.fillStyle = movingLine === idx+1 ? '#edc879' : '#dbe5da';
      if (value) {
        x.beginPath(); x.roundRect(start,y,lineW,h,5); x.fill();
      } else {
        const seg = (lineW - 18)/2;
        x.beginPath(); x.roundRect(start,y,seg,h,5); x.roundRect(start+seg+18,y,seg,h,5); x.fill();
      }
      if (movingLine === idx+1) {
        font(x,12,800); x.fillStyle = '#edc879'; x.fillText('動',start+lineW+9,y-3);
      }
    }
  }

  function drawHexCard(x,kind,hex,movingLine,a,b,w,h) {
    rounded(x,a,b,w,h,22,'rgba(255,255,255,.028)','rgba(184,218,195,.18)');
    drawText(x,kind,a+18,b+18,w-36,{size:13,weight:800,color:'#9fd1b4',max:1,align:'center'});
    drawText(x,`${hex?.upper?.symbol || ''} ${hex?.lower?.symbol || ''}`,a+18,b+50,w-36,{size:46,weight:600,color:'#eef0e7',max:1,align:'center',lh:1});
    drawText(x,`${hex?.number || ''}. ${hex?.ko || ''}`,a+15,b+103,w-30,{size:23,weight:760,serif:true,max:1,align:'center'});
    drawText(x,hex?.hanja || '',a+15,b+136,w-30,{size:15,weight:600,color:'#9fa6a0',max:1,align:'center'});
    drawHexLines(x,hex,movingLine,a,b+180,w);
  }

  async function renderPngFile(reading=currentReading()) {
    if (!isMeihua(reading)) throw new Error('PNG로 저장할 매화역수 결과가 없어.');
    const r = reading.meihua?.calculation;
    if (!r?.primary || !r?.mutual || !r?.changed) throw new Error('매화역수 계산값이 불완전해.');
    const [canvas,x] = canvasPage();
    font(x,22,800); x.fillStyle = '#d5e7d9'; x.fillText('☾  L U N E A',M,42);
    font(x,16,700); x.fillStyle = '#9ba69f'; x.textAlign = 'right'; x.fillText('MEIHUA · 梅花易數',BW-M,48); x.textAlign = 'left';
    drawText(x,'매화역수',M,92,BW-2*M,{size:39,weight:800,serif:true,max:1});
    rounded(x,M,145,BW-2*M,152,22,'rgba(255,255,255,.026)','rgba(184,218,195,.14)');
    drawText(x,'QUESTION',M+24,165,BW-2*M-48,{size:13,weight:800,color:'#e4c989',max:1});
    drawText(x,reading.q || '질문 없음',M+24,194,BW-2*M-48,{size:25,weight:690,serif:true,max:3,lh:1.35});
    drawText(x,formatLocal(r),M+24,266,BW-2*M-48,{size:13,weight:550,color:'#929d96',max:1});

    const gap = 16, cardW = (BW-2*M-gap*2)/3, y = 322, cardH = 375;
    drawHexCard(x,'PRIMARY · 本卦',r.primary,r.movingLine,M,y,cardW,cardH);
    drawHexCard(x,'MUTUAL · 互卦',r.mutual,0,M+cardW+gap,y,cardW,cardH);
    drawHexCard(x,'CHANGED · 變卦',r.changed,0,M+(cardW+gap)*2,y,cardW,cardH);

    const bu = r.bodyUse || {};
    rounded(x,M,722,BW-2*M,160,22,'rgba(92,155,117,.07)','rgba(155,210,175,.16)');
    drawText(x,'體 · 用 / FIVE ELEMENTS',M+24,742,BW-2*M-48,{size:13,weight:800,color:'#a7d9ba',max:1});
    drawText(x,`體  ${bu.body?.hanja || ''}${bu.body?.symbol || ''} ${bu.body?.ko || ''} · ${bu.body?.elementKo || ''}    /    用  ${bu.use?.hanja || ''}${bu.use?.symbol || ''} ${bu.use?.ko || ''} · ${bu.use?.elementKo || ''}`,M+24,774,BW-2*M-48,{size:22,weight:700,max:2});
    drawText(x,`${bu.primaryRelation?.hanja || ''} · ${bu.primaryRelation?.ko || ''} — ${bu.primaryRelation?.summary || ''}`,M+24,820,BW-2*M-48,{size:17,weight:600,color:'#d9dfd8',max:2,lh:1.35});

    rounded(x,M,905,BW-2*M,308,22,'rgba(151,119,190,.055)','rgba(193,167,222,.14)');
    drawText(x,reading.ai ? 'AI READING' : 'CALCULATION NOTE',M+24,926,BW-2*M-48,{size:13,weight:800,color:'#d2b6e6',max:1});
    const fallback = `동효 ${r.movingLine}효 · ${r.methodKo || '연·월·일·시 기괘법'}\n본괘 ${r.primary?.hanja || ''} → 호괘 ${r.mutual?.hanja || ''} → 변괘 ${r.changed?.hanja || ''}\n변화 후 체용: ${bu.changedRelation?.hanja || ''} ${bu.changedRelation?.ko || ''} · ${bu.changedRelation?.summary || ''}`;
    drawText(x,reading.ai || fallback,M+24,960,BW-2*M-48,{size:18,weight:500,serif:!!reading.ai,color:'#e7e4eb',max:10,lh:1.5});

    x.strokeStyle = 'rgba(255,255,255,.09)'; x.beginPath(); x.moveTo(M,1284); x.lineTo(BW-M,1284); x.stroke();
    font(x,14,650); x.fillStyle = '#88928c'; x.fillText('LUNEA · MEIHUA V1',M,1300);
    x.textAlign = 'right'; x.fillText('1080 × 1350',BW-M,1300); x.textAlign = 'left';

    const blob = await new Promise((resolve,reject) => canvas.toBlob(v => v ? resolve(v) : reject(new Error('PNG 생성 실패')),'image/png'));
    return new File([blob],`LUNEA_MEIHUA_${new Date().toISOString().slice(0,10)}.png`,{type:'image/png'});
  }

  function installPreviewStyle() {
    if ($('luneaMeihuaPngStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaMeihuaPngStyle';
    style.textContent = `
      #mhPng{border-color:rgba(160,210,178,.25)!important;background:rgba(87,152,111,.09)!important}
      #luneaMeihuaPngPreview{position:fixed;inset:0;z-index:10140;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(5,7,9,.91);backdrop-filter:blur(16px)}
      #luneaMeihuaPngPreview[data-open="true"]{display:flex}
      #luneaMeihuaPngPreview *{box-sizing:border-box}
      #luneaMeihuaPngPreview .mhp-sheet{width:min(100%,420px);max-height:calc(100dvh - 28px);overflow:auto;padding:15px;border:1px solid rgba(176,218,190,.21);border-radius:22px;background:#111916;color:#f4f1e8}
      #luneaMeihuaPngPreview .mhp-head{display:flex;justify-content:space-between;gap:12px}.mhp-head h3{margin:2px 0 4px;font-size:16px}.mhp-head p{margin:0;color:#9ca69f;font-size:10.5px;line-height:1.5}
      #luneaMeihuaPngPreview .mhp-x{border:0;background:none;color:#b8c2bb;font-size:25px}
      #luneaMeihuaPngPreview img{display:block;width:min(100%,300px);aspect-ratio:4/5;object-fit:cover;margin:14px auto;border-radius:13px;border:1px solid rgba(255,255,255,.11);background:#080c0a}
      #luneaMeihuaPngPreview .mhp-share,#luneaMeihuaPngPreview .mhp-down{width:100%;min-height:44px;border-radius:13px;margin-top:8px;font-weight:800}
      #luneaMeihuaPngPreview .mhp-share{border:1px solid rgba(176,218,190,.5);background:linear-gradient(135deg,#547d63,#49415f);color:#fff}
      #luneaMeihuaPngPreview .mhp-down{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#dedfd9}
      #luneaMeihuaOverlay[data-meihua-restore="1"] #mhPng{display:block!important}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function previewOverlay() {
    let overlay = $('luneaMeihuaPngPreview');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'luneaMeihuaPngPreview';
    overlay.innerHTML = `<section class="mhp-sheet"><div class="mhp-head"><div><small>LUNEA · MEIHUA PNG</small><h3>매화역수 이미지 준비 완료</h3><p>괘 계산과 체용 근거를 4:5 PNG 한 장으로 저장합니다.</p></div><button class="mhp-x" type="button" aria-label="닫기">×</button></div><img alt="매화역수 PNG 미리보기"><button class="mhp-share" type="button">공유창 열기</button><button class="mhp-down" type="button">PNG 파일 저장</button></section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.mhp-x').onclick = closePreview;
    overlay.addEventListener('pointerup',event => { if (event.target === overlay) closePreview(); });
    overlay.querySelector('.mhp-share').onclick = sharePrepared;
    overlay.querySelector('.mhp-down').onclick = downloadPrepared;
    return overlay;
  }

  function closePreview() {
    const overlay = $('luneaMeihuaPngPreview');
    if (overlay) overlay.dataset.open = 'false';
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch {} previewUrl = ''; }
    preparedFile = null;
  }

  async function preparePng() {
    const button = $('mhPng');
    if (button?.disabled) return;
    const old = button?.textContent || '🖼 PNG 저장';
    if (button) { button.disabled = true; button.textContent = 'PNG 만드는 중…'; }
    try {
      const file = await renderPngFile();
      preparedFile = file;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      const overlay = previewOverlay();
      overlay.querySelector('img').src = previewUrl;
      const share = overlay.querySelector('.mhp-share');
      share.hidden = !(navigator.share && navigator.canShare && navigator.canShare({files:[file]}));
      overlay.dataset.open = 'true';
    } catch (error) {
      console.error('[Meihua PNG]',error);
      alert(error?.message || 'PNG 생성 중 오류가 발생했어.');
    } finally {
      if (button) { button.disabled = false; button.textContent = old; }
    }
  }

  function sharePrepared() {
    const file = preparedFile;
    if (!file) return;
    if (!(navigator.share && navigator.canShare && navigator.canShare({files:[file]}))) return downloadPrepared();
    navigator.share({files:[file],title:'LUNEA · 매화역수',text:'LUNEA 매화역수 결과'}).catch(error => {
      if (error?.name !== 'AbortError') console.error('[Meihua share]',error);
    });
  }

  function downloadPrepared() {
    const file = preparedFile;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url),2500);
  }

  function onArchiveClick(event) {
    const button = event.target?.closest?.('#archiveOverlay .archive-item .archive-actions button');
    if (!button) return;
    const row = button.closest('.archive-item');
    const reading = archiveReadingForRow(row);
    if (!reading || detailButton(row) !== button) return;
    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation(); } catch {}
    openArchiveReading(reading);
  }

  function markArchiveRows() {
    document.querySelectorAll('#archiveOverlay .archive-item').forEach(row => {
      const reading = archiveReadingForRow(row);
      if (!reading) return;
      row.dataset.luneaMeihuaRow = '1';
      const button = detailButton(row);
      if (button) {
        button.dataset.meihuaDetail = '1';
        button.style.borderColor = 'rgba(158,210,178,.28)';
        button.style.background = 'rgba(83,151,111,.08)';
      }
    });
  }

  function install() {
    installPreviewStyle();
    previewOverlay();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ready = !!W.LUNEA_MEIHUA_V1 && !!$('luneaMeihuaOverlay');
      if (ready) {
        ensurePngButton();
        ensureArchiveCopyButton();
        clearInterval(timer);
      } else if (tries >= 120) clearInterval(timer);
    },100);

    document.addEventListener('click',onArchiveClick,true);
    document.addEventListener('pointerdown',event => {
      if (event.target?.closest?.('#archiveBtn')) [30,100,220,420].forEach(ms => setTimeout(markArchiveRows,ms));
      if (event.target?.closest?.('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]')) resetRestoreMode();
      if (event.target?.closest?.('#mhCast')) resetRestoreMode();
    },true);
    W.addEventListener('pageshow',() => { ensurePngButton(); markArchiveRows(); },{passive:true});

    W.LUNEA_MEIHUA_POLISH_V1 = Object.freeze({
      version:1,
      openArchiveReading,
      renderPngFile,
      preparePng,
      currentReading,
      markArchiveRows,
      resetRestoreMode
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();