'use strict';

/* Fill the printed Message Oracle frame in shared PNGs with the same
   score/message/detail/context data shown in the live Message Oracle UI. */
(() => {
  const W = window;
  if (W.__LUNEA_READING_SHARE_MESSAGE_CONTENT_V1__) return;
  W.__LUNEA_READING_SHARE_MESSAGE_CONTENT_V1__ = true;

  const CELL_W = 446, CELL_H = 472, GAP_X = 32, GAP_Y = 34;
  const FRAME_W = 200, FRAME_H = 326;
  const EXTRA_RE = /추가\s*카드|additional|clarifier|보조\s*카드/i;

  function extra(card) {
    return EXTRA_RE.test(String(card?.position || card?.role || ''));
  }

  function supportMeta(payload) {
    const tarot = Array.isArray(payload?.tarot) ? payload.tarot : [];
    const timing = payload?.a?.timing;
    const before = tarot.filter(extra).length + (timing?.primary ? 1 : 0) + (timing?.refine ? 1 : 0);
    const main = tarot.filter(card => !extra(card));
    const source = main.length ? main : tarot;
    return {index:before, start:1 + Math.ceil(source.length / 6)};
  }

  function xs(count) {
    const total = count * CELL_W + Math.max(0, count - 1) * GAP_X;
    const start = (1080 - total) / 2;
    return Array.from({length:count}, (_,i) => start + i * (CELL_W + GAP_X));
  }

  function itemPosition(index,total) {
    const pageItem = index % 4;
    const pageBase = Math.floor(index / 4) * 4;
    const onPage = Math.min(4, total - pageBase);
    const row = Math.floor(pageItem / 2);
    const rowStart = row * 2;
    const rowCount = Math.min(2, onPage - rowStart);
    const col = pageItem - rowStart;
    const x = xs(rowCount)[col];
    const y = 245 + row * (CELL_H + GAP_Y);
    return {x:x + (CELL_W - FRAME_W) / 2, y:y + 52};
  }

  function fitLines(ctx,value,maxWidth,maxLines) {
    const out = [];
    let line = '';
    for (const ch of [...String(value || '')]) {
      const next = line + ch;
      if (line && ctx.measureText(next).width > maxWidth) {
        out.push(line);
        line = ch;
        if (out.length >= maxLines) break;
      } else line = next;
    }
    if (out.length < maxLines && line) out.push(line);
    return out;
  }

  function centered(ctx,value,x,y,w,h,size,weight=600,maxLines=2,lineHeight=1.2) {
    ctx.save();
    ctx.font = `${weight} ${size}px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif`;
    ctx.fillStyle = '#493747';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = fitLines(ctx,value,w,maxLines);
    const step = size * lineHeight;
    const start = y + h/2 - (lines.length - 1) * step/2;
    lines.forEach((line,i) => ctx.fillText(line,x+w/2,start+i*step));
    ctx.restore();
  }

  function fillMessageFrame(canvas,value) {
    if (!canvas?.width || !canvas?.height || !value) return;
    const meta = supportMeta(value.__payload);
    const total = meta.index + 1;
    const pos = itemPosition(meta.index,total);
    const x = canvas.getContext('2d');
    if (!x) return;
    const fx = pos.x, fy = pos.y, fw = FRAME_W, fh = FRAME_H;

    centered(x, `${value.score ?? ''}%`, fx+fw*.42435, fy+fh*.06362, fw*.14894, fh*.09006, 13, 700, 1, 1);
    centered(x, value.cardName || value.cardCode || '', fx+fw*.21, fy+fh*.549, fw*.58, fh*.054, 7.2, 650, 2, 1.05);
    centered(x, value.shortMessage || value.fullMessage || '', fx+fw*.11939, fy+fh*.62545, fw*.76005, fh*.14367, 8, 550, 4, 1.28);

    const details = Array.isArray(value.details) ? value.details.slice(0,4) : [];
    const dx = fx+fw*.133, dy = fy+fh*.794, dw = fw*.734, dh = fh*.065;
    const gap = fw*.028;
    const cellW = (dw - gap*3) / 4;
    details.forEach((item,i) => {
      const cx = dx + i*(cellW+gap);
      centered(x,item?.label || '',cx,dy,cellW,dh*.45,4.8,500,1,1);
      centered(x,item?.value || '',cx,dy+dh*.40,cellW,dh*.60,5.8,700,2,1.02);
    });
    centered(x,value.contextLabel || '',fx+fw*.34634,fy+fh*.89635,fw*.30615,fh*.03717,5.8,600,1,1);
  }

  function repair(result) {
    const payload = result?.payload;
    const message = payload?.a?.messageOracle;
    const pages = Array.isArray(result?.pages) ? [...result.pages] : null;
    if (!message || !pages?.length) return result;
    const meta = supportMeta(payload);
    const index = meta.start + Math.floor(meta.index / 4);
    if (!pages[index]) return result;
    fillMessageFrame(pages[index], {...message,__payload:payload});
    return {...result,pages,messageOracleFrameFilled:true};
  }

  function install() {
    const base = W.LUNEA_READING_SHARE_POLISH_V3;
    if (!base?.compose) return false;
    if (base.messageOracleFrameFilledV1) return true;
    const compose = base.compose.bind(base);
    W.LUNEA_READING_SHARE_POLISH_V3 = Object.freeze({
      ...base,
      version:`${base.version || '3.0'}+message-content-v1`,
      messageOracleFrameFilledV1:true,
      compose:async (...args) => repair(await compose(...args))
    });
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 80) clearInterval(timer);
  },100);
})();
