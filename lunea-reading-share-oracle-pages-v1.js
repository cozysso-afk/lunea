'use strict';

/*
  LUNEA Reading Share Oracle Pages V1
  -----------------------------------
  Message / Timing / INTIMACY Oracle results each keep their own full 4:5 page.
  Additional Tarot cards remain separate support pages. The older compact
  support-grid oracle cells are discarded from the final export.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_SHARE_ORACLE_PAGES_V1__) return;
  W.__LUNEA_READING_SHARE_ORACLE_PAGES_V1__ = true;

  const BW = 1080, BH = 1350, M = 64;
  const EXTRA_RE = /추가\s*카드|additional|clarifier|보조\s*카드/i;
  const imageCache = new Map();

  function owner() { return W.LUNEA_READING_SHARE_V1 || null; }
  function isExtra(card) { return EXTRA_RE.test(String(card?.position || card?.role || '')); }
  function deck() { try { return Array.isArray(TAROT_DECK) ? TAROT_DECK : []; } catch { return []; } }
  function tarotSrc(card) {
    if (card?.img) return card.img;
    const found = deck().find(v => String(v.code) === String(card?.code) || String(v.name) === String(card?.name));
    return found?.img || '';
  }
  function absolute(raw) { try { return new URL(String(raw || ''), location.href).href; } catch { return String(raw || ''); } }

  async function loadImage(raw) {
    if (!raw) return null;
    const key = absolute(raw);
    if (imageCache.has(key)) return imageCache.get(key);
    const promise = (async () => {
      let safe = key;
      try { safe = await W.LUNEA_READING_SHARE_POLISH_V3?.resolveWiki?.(key) || key; } catch {}
      return await new Promise(resolve => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        const timer = setTimeout(() => resolve(null), 12000);
        im.onload = () => { clearTimeout(timer); resolve(im); };
        im.onerror = () => { clearTimeout(timer); resolve(null); };
        im.src = safe;
      });
    })();
    imageCache.set(key, promise);
    return promise;
  }

  function page() {
    const c = document.createElement('canvas');
    c.width = BW; c.height = BH;
    const x = c.getContext('2d', {alpha:false});
    const g = x.createLinearGradient(0,0,BW,BH);
    g.addColorStop(0,'#1a1228'); g.addColorStop(.5,'#0d0a14'); g.addColorStop(1,'#050408');
    x.fillStyle = g; x.fillRect(0,0,BW,BH);
    const r = x.createRadialGradient(160,110,0,160,110,520);
    r.addColorStop(0,'rgba(182,150,255,.14)'); r.addColorStop(1,'rgba(182,150,255,0)');
    x.fillStyle = r; x.fillRect(0,0,760,690);
    return [c,x];
  }

  function font(x,size,weight=500,serif=false) {
    x.font = `${weight} ${size}px ${serif?'"Noto Serif KR",Georgia,serif':'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'}`;
    x.textBaseline = 'top';
  }
  function wrap(x,value,maxWidth) {
    const out=[]; let line='';
    for (const ch of [...String(value || '')]) {
      const next=line+ch;
      if (line && x.measureText(next).width > maxWidth) { out.push(line); line=ch; }
      else line=next;
    }
    if (line) out.push(line);
    return out;
  }
  function text(x,value,a,b,w,{size=20,weight=500,color='#f7f3fb',align='left',max=3,lineHeight=1.35,serif=false}={}) {
    font(x,size,weight,serif); x.fillStyle=color; x.textAlign=align;
    const lines=wrap(x,value,w).slice(0,max), px=align==='center'?a+w/2:align==='right'?a+w:a;
    lines.forEach((line,i)=>x.fillText(line,px,b+i*size*lineHeight)); x.textAlign='left';
  }
  function rounded(x,a,b,w,h,r,fill,stroke) {
    x.beginPath(); x.roundRect(a,b,w,h,r);
    if (fill) { x.fillStyle=fill; x.fill(); }
    if (stroke) { x.strokeStyle=stroke; x.lineWidth=1.5; x.stroke(); }
  }
  function contain(x,im,a,b,w,h,rot=0) {
    if (!im?.naturalWidth) return false;
    const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight), dw=im.naturalWidth*scale, dh=im.naturalHeight*scale;
    x.save(); x.translate(a+w/2,b+h/2); if(rot)x.rotate(rot); x.drawImage(im,-dw/2,-dh/2,dw,dh); x.restore();
    return true;
  }
  function header(x,index,total) {
    font(x,22,800); x.fillStyle='#d7c4ff'; x.fillText('☾  L U N E A',M,42);
    font(x,16,700); x.fillStyle='#b7aec3'; x.textAlign='right'; x.fillText(total>1?`EXTRA ${index+1}`:'EXTRA',BW-M,48); x.textAlign='left';
    text(x,'SUPPORT CARD',M,104,BW-2*M,{size:16,weight:800,color:'#ead3a1',max:1});
    text(x,'추가 카드',M,140,BW-2*M,{size:37,weight:780,serif:true,max:1});
  }
  function footer(x,i,total) {
    x.fillStyle='#050408'; x.fillRect(0,1274,BW,76);
    x.strokeStyle='rgba(255,255,255,.09)'; x.beginPath(); x.moveTo(M,1284); x.lineTo(BW-M,1284); x.stroke();
    font(x,14,650); x.fillStyle='#8f879c'; x.fillText('LUNEA · SHARE',M,1300);
    x.textAlign='right'; x.fillText(`${i}/${total}`,BW-M,1300); x.textAlign='left';
  }

  async function drawExtraCard(x,card,a,b,w,h) {
    rounded(x,a,b,w,h,22,'#0c0a11','rgba(225,211,246,.24)');
    const im=await loadImage(tarotSrc(card));
    if (!contain(x,im,a+7,b+7,w-14,h-14,card?.isReversed?Math.PI:0)) throw Error(`추가 카드 이미지 로딩 실패: ${card?.name || card?.code || 'unknown'}`);
    rounded(x,a+w-52,b+h-32,40,22,11,'rgba(5,4,9,.86)','rgba(255,255,255,.15)');
    text(x,card?.isReversed?'역':'정',a+w-52,b+h-29,40,{size:11,weight:800,align:'center',max:1,lineHeight:1});
    text(x,card?.position || '추가 카드',a-10,b+h+22,w+20,{size:16,weight:760,align:'center',max:2});
    text(x,card?.name || '',a-10,b+h+70,w+20,{size:14,color:'#b7aec3',align:'center',max:2});
  }

  async function extraPages(cards) {
    const out=[];
    for (let off=0; off<cards.length; off+=2) {
      const group=cards.slice(off,off+2), [c,x]=page();
      header(x,Math.floor(off/2),Math.ceil(cards.length/2));
      const w=group.length===1?350:310, h=Math.round(w*1.63), gap=70;
      const total=group.length*w+Math.max(0,group.length-1)*gap, start=(BW-total)/2, y=290;
      for (let i=0;i<group.length;i++) await drawExtraCard(x,group[i],start+i*(w+gap),y,w,h);
      out.push(c);
    }
    return out;
  }

  function oraclePageIndexes(payload) {
    const baseTarotPages=Math.ceil((payload?.tarot?.length || 0)/8);
    let index=1+baseTarotPages;
    const timing=payload?.a?.timing ? index++ : -1;
    const message=payload?.a?.messageOracle ? index++ : -1;
    const intimacy=payload?.intimacy?.cards?.length ? index++ : -1;
    return {timing,message,intimacy,tail:index};
  }

  function requirePage(pages,index,label) {
    if (index < 0) return null;
    const page=pages?.[index];
    if (!page) throw Error(`${label} 공유 페이지를 만들지 못했어.`);
    return page;
  }

  function renumber(pages) {
    pages.forEach((canvas,index) => {
      const x=canvas?.getContext?.('2d');
      if (x) footer(x,index+1,pages.length);
    });
  }

  function install() {
    const base=W.LUNEA_READING_SHARE_POLISH_V3;
    const own=owner();
    if (!base?.compose || !own?.renderFiles) return false;
    if (base.standaloneOraclePagesV1) return true;
    const compose=base.compose.bind(base);
    W.LUNEA_READING_SHARE_POLISH_V3=Object.freeze({
      ...base,
      version:`${base.version || '3.0'}+oracle-pages-v1`,
      standaloneOraclePagesV1:true,
      compose:async (...args) => {
        const polished=await compose(...args);
        const payload=polished?.payload || own.buildPayload?.();
        const tarot=Array.isArray(payload?.tarot)?payload.tarot:[];
        const main=tarot.filter(card=>!isExtra(card));
        const mainSource=main.length?main:tarot;
        const coreCount=1+Math.ceil(mainSource.length/6);
        const core=(polished?.pages || []).slice(0,coreCount);
        if (!core.length) throw Error('공유용 메인 페이지를 만들지 못했어.');

        const original=await own.renderFiles();
        const ownerPages=Array.isArray(original?.pages)?original.pages:[];
        const idx=oraclePageIndexes(payload);
        const pages=[...core, ...(await extraPages(tarot.filter(isExtra)))];
        const timing=requirePage(ownerPages,idx.timing,'시기 오라클');
        const message=requirePage(ownerPages,idx.message,'메시지 오라클');
        const intimacy=requirePage(ownerPages,idx.intimacy,'INTIMACY 오라클');
        if (timing) pages.push(timing);
        if (message) pages.push(message);
        if (intimacy) pages.push(intimacy);
        pages.push(...ownerPages.slice(idx.tail));
        renumber(pages);
        return {...polished,pages,files:[],standaloneOraclePages:true};
      }
    });
    console.info('✨ LUNEA standalone Oracle share pages V1 ready');
    return true;
  }

  if (install()) return;
  let tries=0;
  const timer=setInterval(()=>{tries+=1;if(install()||tries>100)clearInterval(timer)},100);
})();
