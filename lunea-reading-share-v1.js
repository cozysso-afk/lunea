'use strict';
(()=>{
  const W=window;
  if(W.__LUNEA_READING_SHARE_V1__)return;
  W.__LUNEA_READING_SHARE_V1__=1;

  const BW=1080,BH=1350,M=64;
  const BTN='luneaShareReadingPng';
  const OV='luneaSharePreviewOverlay';
  const INT_ROOT='./assets/intimacy-oracle/cards';
  const MSG_FRAME='./assets/message-oracle/message_oracle_front_frame.jpeg?v=101';
  const COMMONS_API='https://commons.wikimedia.org/w/api.php';
  const C={
    bg:'#0a0810',panel:'#17121f',text:'#f7f3fb',dim:'#b8afc5',moon:'#d7c4ff',
    gold:'#ead3a1',rose:'#dda8bc',line:'rgba(225,211,246,.22)',soft:'rgba(255,255,255,.035)'
  };

  let prepared=null,urls=[];
  const imageCache=new Map();
  const resolvedSourceCache=new Map();
  const $=id=>document.getElementById(id);

  function st(){try{return W.state||state||null}catch{return W.state||null}}
  function deck(){try{return Array.isArray(TAROT_DECK)?TAROT_DECK:[]}catch{return[]}}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
  function attachments(s){try{return clone(W.LUNEA_READING_ATTACHMENTS_V1?.captureArchive?.(s)||{})||{}}catch{return{}}}
  function intimacy(){try{return clone(W.LUNEA_INTIMACY_ORACLE_UI_V36?.serializeOracle?.()||null)}catch{return null}}

  function payload(){
    const s=st();
    if(!s?.drawn?.length)throw Error('현재 리딩 카드가 없어.');
    return{
      title:String(s.title||'LUNEA TAROT'),
      category:String(s.category||'GENERAL'),
      question:String(s.question||''),
      rationale:String(s.rationale||''),
      tarot:clone(s.drawn)||[],
      ai:String($('aiText')?.textContent||'').trim(),
      a:attachments(s),
      intimacy:intimacy()
    };
  }

  function page(){
    const c=document.createElement('canvas');
    c.width=BW;c.height=BH;
    const x=c.getContext('2d',{alpha:false});
    const g=x.createLinearGradient(0,0,BW,BH);
    g.addColorStop(0,'#1d142c');g.addColorStop(.52,C.bg);g.addColorStop(1,'#050408');
    x.fillStyle=g;x.fillRect(0,0,BW,BH);
    const r=x.createRadialGradient(145,90,0,145,90,540);
    r.addColorStop(0,'rgba(190,162,255,.12)');r.addColorStop(1,'rgba(190,162,255,0)');
    x.fillStyle=r;x.fillRect(0,0,760,650);
    return[c,x];
  }

  function rr(x,a,b,w,h,r,fill,stroke){
    x.beginPath();x.roundRect(a,b,w,h,r);
    if(fill){x.fillStyle=fill;x.fill()}
    if(stroke){x.strokeStyle=stroke;x.lineWidth=1.5;x.stroke()}
  }
  function font(x,n,w=500,serif=false){
    x.font=`${w} ${n}px ${serif?'"Noto Serif KR",Georgia,serif':'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'}`;
    x.textBaseline='top';
  }
  function lines(x,t,w,max=99){
    const out=[];
    for(const p of String(t||'').replace(/\r/g,'').split('\n')){
      if(!p){out.push('');continue}
      let l='';
      for(const ch of p){
        if(l&&x.measureText(l+ch).width>w){out.push(l);l=ch}else l+=ch;
        if(out.length>=max)break;
      }
      if(out.length>=max)break;
      if(l)out.push(l);
    }
    return out.slice(0,max);
  }
  function text(x,t,a,b,w,o={}){
    const n=o.size||26,lh=n*(o.lh||1.42);
    font(x,n,o.weight||500,!!o.serif);
    x.fillStyle=o.color||C.text;
    x.textAlign=o.align||'left';
    const ls=lines(x,t,w,o.max||99),px=o.align==='center'?a+w/2:o.align==='right'?a+w:a;
    ls.forEach((l,i)=>x.fillText(l,px,b+i*lh));
    x.textAlign='left';
    return ls.length*lh;
  }
  function brand(x,right='READING'){
    font(x,22,800);x.fillStyle=C.moon;x.fillText('☾  L U N E A',M,42);
    font(x,16,650);x.fillStyle=C.dim;x.textAlign='right';x.fillText(right,BW-M,47);x.textAlign='left';
  }
  function head(x,k,t,p=''){
    brand(x,p);
    text(x,k.toUpperCase(),M,95,BW-2*M,{size:15,weight:800,color:C.gold,max:1});
    return 130+text(x,t,M,129,BW-2*M,{size:36,weight:800,lh:1.18,max:3,serif:true});
  }
  function foot(x,i,n){
    x.strokeStyle='rgba(255,255,255,.09)';x.beginPath();x.moveTo(M,1284);x.lineTo(BW-M,1284);x.stroke();
    font(x,14,600);x.fillStyle='#8f879c';x.fillText('LUNEA · SHARE',M,1300);
    x.textAlign='right';x.fillText(`${i}/${n}`,BW-M,1300);x.textAlign='left';
  }

  function src(v){if(!v)return'';try{return new URL(String(v),location.href).href}catch{return String(v)}}
  function commonsFilename(v){
    try{
      const u=new URL(String(v),location.href);
      if(u.hostname!=='commons.wikimedia.org')return'';
      const mark='/wiki/Special:FilePath/';
      const i=u.pathname.indexOf(mark);
      if(i<0)return'';
      return decodeURIComponent(u.pathname.slice(i+mark.length)).replace(/ /g,'_');
    }catch{return''}
  }
  async function resolveImageSource(v){
    const raw=src(v);
    if(!raw)return'';
    if(resolvedSourceCache.has(raw))return resolvedSourceCache.get(raw);
    const p=(async()=>{
      const file=commonsFilename(raw);
      if(!file)return raw;
      try{
        const q=new URL(COMMONS_API);
        q.searchParams.set('action','query');q.searchParams.set('format','json');q.searchParams.set('origin','*');
        q.searchParams.set('prop','imageinfo');q.searchParams.set('iiprop','url');q.searchParams.set('titles',`File:${file}`);
        const r=await fetch(q.href,{mode:'cors',cache:'force-cache'});
        if(!r.ok)throw Error(`commons ${r.status}`);
        const j=await r.json();
        const pg=Object.values(j?.query?.pages||{})[0];
        const direct=pg?.imageinfo?.[0]?.url||'';
        return direct||raw;
      }catch(e){
        console.info('[LUNEA share] commons direct-url resolve fallback',file,e?.message||e);
        return raw;
      }
    })();
    resolvedSourceCache.set(raw,p);
    return p;
  }
  function loadImageUrl(k){
    return new Promise(resolve=>{
      const im=new Image();im.crossOrigin='anonymous';
      const tm=setTimeout(()=>resolve(null),12000);
      im.onload=async()=>{clearTimeout(tm);try{await im.decode?.()}catch{}resolve(im)};
      im.onerror=()=>{clearTimeout(tm);resolve(null)};
      im.src=k;
    });
  }
  function img(v){
    const raw=src(v);
    if(!raw)return Promise.resolve(null);
    if(imageCache.has(raw))return imageCache.get(raw);
    const p=(async()=>{
      const safe=await resolveImageSource(raw);
      let im=await loadImageUrl(safe);
      if(!im&&safe!==raw)im=await loadImageUrl(raw);
      return im;
    })();
    imageCache.set(raw,p);
    return p;
  }
  function contain(x,im,a,b,w,h,rot=0){
    if(!im?.naturalWidth)return;
    const s=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;
    x.save();x.translate(a+w/2,b+h/2);if(rot)x.rotate(rot);x.drawImage(im,-dw/2,-dh/2,dw,dh);x.restore();
  }
  function tarotSrc(c){
    if(c?.img)return c.img;
    const d=deck().find(v=>String(v.code)===String(c?.code)||String(v.name)===String(c?.name));
    return d?.img||'';
  }
  async function assertTarotArtwork(cards){
    const rows=await Promise.all((cards||[]).map(async c=>{
      const s=tarotSrc(c),im=s?await img(s):null;
      return im?null:(c?.name||c?.code||'unknown');
    }));
    const missing=rows.filter(Boolean);
    if(missing.length)throw Error(`타로 카드 이미지 ${missing.length}장을 불러오지 못했어. 네트워크 확인 후 다시 눌러줘.`);
  }
  async function tarotCard(x,c,a,b,w,h,caption=true){
    rr(x,a,b,w,h,18,'#0d0b12',C.line);
    const im=await img(tarotSrc(c));
    if(im)contain(x,im,a+5,b+5,w-10,h-10,c?.isReversed?Math.PI:0);
    else text(x,'✦',a,b+h/2-25,w,{size:40,weight:800,color:'#897a9d',align:'center'});
    rr(x,a+w-42,b+h-28,32,19,9,'rgba(5,4,9,.82)','rgba(255,255,255,.14)');
    text(x,c?.isReversed?'역':'정',a+w-42,b+h-26,32,{size:10,weight:800,align:'center',lh:1});
    if(caption){
      text(x,c?.position||'',a-3,b+h+10,w+6,{size:13,weight:760,align:'center',lh:1.22,max:2});
      text(x,c?.name||'',a-3,b+h+48,w+6,{size:11.5,color:C.dim,align:'center',lh:1.22,max:2});
    }
  }

  function timingSrc(c){
    if(!c)return'';
    try{const s=W.LUNEA_RECOVERY_UI_V65?.artworkForCard?.(c);if(s)return s}catch{}
    return c.img||c.imgSrc||c.src||(c.filename?`./${encodeURIComponent(c.filename)}`:'');
  }
  function intSrc(c){
    const n=String(c?.code||'').match(/^O(\d{2})$/)?.[1];
    return n?`${INT_ROOT}/oracle_${n}.png?v47`:'';
  }

  async function cover(p){
    const[c,x]=page();
    brand(x,'READING');
    text(x,p.category.toUpperCase(),M,98,BW-2*M,{size:15,weight:800,color:C.gold,max:1});
    let y=132;
    const qh=text(x,p.question||p.title,M,y,BW-2*M,{size:33,weight:780,lh:1.23,max:4,serif:true});
    y+=qh+12;
    text(x,p.title,M,y,BW-2*M,{size:18,weight:650,color:C.dim,max:2});
    y+=48;

    rr(x,M,y,BW-2*M,116,22,C.soft,C.line);
    text(x,'SPREAD NOTE',M+24,y+18,BW-2*M-48,{size:13,weight:800,color:C.gold,max:1});
    text(x,p.rationale||'저장된 현재 리딩',M+24,y+45,BW-2*M-48,{size:16.5,color:C.text,lh:1.42,max:3});
    y+=154;

    const cs=p.tarot.slice(0,3),w=235,h=382,gap=36,total=cs.length*w+Math.max(0,cs.length-1)*gap,a=(BW-total)/2;
    for(let i=0;i<cs.length;i++){
      await tarotCard(x,cs[i],a+i*(w+gap),y,w,h,false);
      text(x,cs[i]?.name||'',a+i*(w+gap),y+h+15,w,{size:12.5,weight:680,color:C.dim,align:'center',lh:1.2,max:2});
    }

    const sy=Math.min(1165,y+h+80);
    rr(x,M,sy,BW-2*M,74,18,'rgba(255,255,255,.026)','rgba(225,211,246,.13)');
    const extras=Math.max(0,p.tarot.length-Number((p.title.match(/(\d+)\s*카드/)||[])[1]||p.tarot.length));
    const summary=[`${p.tarot.length} TAROT`,extras?`+${extras} 추가 카드`:'',p.a?.timing?'TIMING 포함':'',p.ai?'AI 해석 포함':''].filter(Boolean).join('   ·   ');
    text(x,summary,M+20,sy+24,BW-2*M-40,{size:15,weight:680,color:C.dim,align:'center',max:1});
    return c;
  }

  function tarotLayout(count){
    if(count<=3)return{cols:count||1,w:250,h:407,gx:38,gy:0};
    if(count<=6)return{cols:3,w:252,h:410,gx:42,gy:105};
    return{cols:4,w:214,h:348,gx:24,gy:105};
  }
  async function tarotPages(p){
    const out=[];
    for(let off=0;off<p.tarot.length;off+=8){
      const cs=p.tarot.slice(off,off+8),[c,x]=page();
      let y=head(x,'TAROT CARDS',`카드 배열 · ${cs.length}장`,`TAROT ${Math.floor(off/8)+1}`)+8;
      text(x,p.title,M,y,BW-2*M,{size:16,weight:620,color:C.dim,max:1});
      y+=42;
      const L=tarotLayout(cs.length),total=L.cols*L.w+(L.cols-1)*L.gx;
      const rows=Math.ceil(cs.length/L.cols);
      const blockH=rows*L.h+(rows-1)*L.gy+82*rows;
      const available=1235-y;
      if(blockH<available)y+=Math.max(0,(available-blockH)*.22);
      for(let i=0;i<cs.length;i++){
        const row=Math.floor(i/L.cols),col=i%L.cols;
        const rowCount=Math.min(L.cols,cs.length-row*L.cols);
        const rowWidth=rowCount*L.w+(rowCount-1)*L.gx;
        const rowStart=(BW-rowWidth)/2;
        await tarotCard(x,cs[i],rowStart+col*(L.w+L.gx),y+row*(L.h+L.gy+82),L.w,L.h,true);
      }
      out.push(c);
    }
    return out;
  }

  async function timingPage(v){
    const[c,x]=page();
    let y=head(x,'TIMING ORACLE','시기 오라클','ORACLE')+12;
    const cs=[v?.primary,v?.refine].filter(Boolean),w=cs.length>1?330:390,h=w*1.62,g=48,total=cs.length*w+(cs.length-1)*g,a=(BW-total)/2;
    y+=10;
    for(let i=0;i<cs.length;i++){
      const q=cs[i],xx=a+i*(w+g);
      rr(x,xx,y,w,h,22,'#0d0b12',C.line);
      const im=await img(timingSrc(q));if(im)contain(x,im,xx+5,y+5,w-10,h-10);
      text(x,i?'REFINE':'PRIMARY',xx,y+h+25,w,{size:14,weight:800,color:C.gold,align:'center',max:1});
      text(x,q.label_ko||q.label_en||'',xx,y+h+53,w,{size:23,weight:800,align:'center',lh:1.2,max:2});
      text(x,q.meaning||'',xx+5,y+h+111,w-10,{size:15.5,color:C.dim,align:'center',lh:1.38,max:4});
    }
    return c;
  }

  async function messagePage(v){
    const[c,x]=page(),y=head(x,'MESSAGE ORACLE','연락 · 소식 메시지','ORACLE')+16,w=398,h=660,a=(BW-w)/2;
    rr(x,a,y,w,h,22,'#ece4e8','rgba(255,255,255,.22)');
    const frame=await img(MSG_FRAME);if(frame)contain(x,frame,a,y,w,h);
    let card=null;try{card=W.LUNEA_MESSAGE_ORACLE_V1?.identity?.(v?.cardCode,deck())}catch{}
    card=card||deck().find(d=>String(d.code)===String(v?.cardCode));
    const ci=await img(card?.img);if(ci)contain(x,ci,a+w*.30,y+h*.18,w*.40,h*.33);
    text(x,`${v?.score??''}%`,a+w*.425,y+h*.065,w*.15,{size:30,weight:800,color:'#745832',align:'center',max:1,lh:1});
    text(x,v?.cardName||card?.name||v?.cardCode||'',a+w*.18,y+h*.55,w*.64,{size:20,weight:750,color:'#493747',align:'center',lh:1.2,max:2});
    text(x,v?.shortMessage||v?.fullMessage||'',a+w*.12,y+h*.66,w*.76,{size:17.5,weight:600,color:'#493747',align:'center',lh:1.42,max:4});
    text(x,v?.contextLabel||'',M,y+h+35,BW-2*M,{size:17,weight:700,color:C.rose,align:'center',max:1});
    text(x,v?.fullMessage||v?.shortMessage||'',M,y+h+70,BW-2*M,{size:17,color:C.dim,align:'center',lh:1.45,max:5});
    return c;
  }

  async function intimacyPage(s){
    const[c,x]=page(),y=head(x,'INTIMACY ORACLE','친밀감 오라클','ORACLE')+14,cs=[...(s?.cards||[]),...(s?.extraCards||[])].slice(0,6),cols=3,gx=28,gy=78,w=(BW-2*M-gx*2)/3,h=w*5/3;
    for(let i=0;i<cs.length;i++){
      const q=cs[i],a=M+(i%3)*(w+gx),b=y+Math.floor(i/3)*(h+gy);
      rr(x,a,b,w,h,17,'#13080e','rgba(224,170,191,.28)');
      const im=await img(intSrc(q));if(im)contain(x,im,a+4,b+4,w-8,h-8);
      text(x,q.lens||'Oracle',a,b+h+8,w,{size:15,weight:750,color:C.rose,align:'center',lh:1.2,max:2});
      text(x,[q.enTitle,q.koTitle].filter(Boolean).join(' · '),a,b+h+43,w,{size:12,color:C.dim,align:'center',lh:1.2,max:2});
    }
    return c;
  }

  function imageRows(v,out=[]){
    if(out.length>=8||v==null)return out;
    if(Array.isArray(v)){v.forEach(q=>imageRows(q,out));return out}
    if(typeof v!=='object')return out;
    const raw=v.img||v.imgSrc||v.image||v.src||v.filename||'';
    if(raw&&/\.(png|jpe?g|webp)(?:[?#].*)?$/i.test(String(raw))){
      let s=String(raw);if(!/^(https?:|data:|blob:|\.\.?\/)/i.test(s))s='./'+encodeURIComponent(s);
      out.push({src:s,label:String(v.label_ko||v.label_en||v.name||v.title||v.id||'ORACLE')});
    }
    for(const[k,q]of Object.entries(v))if(!['img','imgSrc','image','src','filename'].includes(k))imageRows(q,out);
    return out;
  }
  async function genericImages(k,v){
    const cs=imageRows(v).slice(0,6);if(!cs.length)return null;
    const[c,x]=page(),y=head(x,k.replace(/([A-Z])/g,' $1').toUpperCase(),'오라클 이미지','ORACLE')+14,cols=3,g=30,w=(BW-2*M-g*2)/3,h=w*1.55;
    for(let i=0;i<cs.length;i++){
      const a=M+(i%3)*(w+g),b=y+Math.floor(i/3)*(h+70);
      rr(x,a,b,w,h,16,'#0d0b12',C.line);const im=await img(cs[i].src);if(im)contain(x,im,a+4,b+4,w-8,h-8);
      text(x,cs[i].label,a,b+h+9,w,{size:14,weight:750,align:'center',lh:1.2,max:2});
    }
    return c;
  }
  function flatten(v,p='',out=[]){
    if(out.length>=20||v==null)return out;
    if(['string','number','boolean'].includes(typeof v)){const s=String(v).trim();if(s)out.push([p||'결과',s]);return out}
    if(Array.isArray(v)){v.slice(0,7).forEach((q,i)=>flatten(q,p?`${p} · ${i+1}`:`${i+1}`,out));return out}
    if(typeof v==='object')for(const[k,q]of Object.entries(v)){
      if(['filename','img','imgSrc','src','createdAt','savedAt','readingSignature','version','deck'].includes(k))continue;
      flatten(q,p?`${p} · ${k}`:k,out);
    }
    return out;
  }
  async function supportText(k,v){
    const[c,x]=page();let y=head(x,'SUPPORT',k.replace(/([A-Z])/g,' $1'),'DATA')+12;
    for(const[l,t]of flatten(v).slice(0,13)){
      const h=Math.min(142,54+Math.ceil(String(t).length/40)*23);if(y+h>1240)break;
      rr(x,M,y,BW-2*M,h,18,C.soft,C.line);
      text(x,l,M+20,y+16,230,{size:14,weight:800,color:C.gold,max:2});
      text(x,t,M+265,y+15,BW-2*M-285,{size:17,lh:1.4,max:4});y+=h+11;
    }
    return c;
  }
  function split(t,n=900){
    let s=String(t||'').trim(),a=[];
    while(s){
      if(s.length<=n){a.push(s);break}
      let p=s.lastIndexOf('\n',n);if(p<n*.55)p=s.lastIndexOf(' ',n);if(p<n*.55)p=n;
      a.push(s.slice(0,p).trim());s=s.slice(p).trim();
    }
    return a;
  }
  async function aiPage(t,i,n){
    const[c,x]=page(),y=head(x,'AI READING','AI 심층 리딩',`AI ${i+1}/${n}`)+12;
    rr(x,M,y,BW-2*M,1010,24,C.soft,C.line);
    text(x,t,M+30,y+30,BW-2*M-60,{size:21,lh:1.6,max:29,serif:true});
    return c;
  }

  async function render(){
    const p=payload();
    await assertTarotArtwork(p.tarot);
    const ps=[await cover(p),...(await tarotPages(p))],a=p.a||{};
    if(a.timing)ps.push(await timingPage(a.timing));
    if(a.messageOracle)ps.push(await messagePage(a.messageOracle));
    if(p.intimacy?.cards?.length)ps.push(await intimacyPage(p.intimacy));
    for(const[k,v]of Object.entries(a)){
      if(['timing','messageOracle'].includes(k)||v==null)continue;
      const g=await genericImages(k,v);if(g)ps.push(g);ps.push(await supportText(k,v));
    }
    const chunks=split(p.ai);
    for(let i=0;i<chunks.length;i++)ps.push(await aiPage(chunks[i],i,chunks.length));
    ps.forEach((q,i)=>foot(q.getContext('2d'),i+1,ps.length));
    const files=[];
    for(let i=0;i<ps.length;i++){
      const b=await new Promise((r,j)=>ps[i].toBlob(v=>v?r(v):j(Error('PNG 생성 실패')),'image/png'));
      files.push(new File([b],`LUNEA_${String(i+1).padStart(2,'0')}.png`,{type:'image/png'}));
    }
    return{files,payload:p,pages:ps};
  }

  function revoke(){urls.forEach(u=>{try{URL.revokeObjectURL(u)}catch{}});urls=[]}
  function style(){
    if($('luneaReadingShareV1Style'))return;
    const s=document.createElement('style');s.id='luneaReadingShareV1Style';
    s.textContent=`#${BTN}{border-color:rgba(210,190,255,.28)!important;background:rgba(145,112,210,.13)!important;order:9999!important}#${OV}{position:fixed;inset:0;z-index:10120;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(5,4,10,.9);backdrop-filter:blur(16px)}#${OV}[data-open="true"]{display:flex}#${OV} *{box-sizing:border-box}#${OV} .s{width:min(100%,430px);max-height:calc(100dvh - 28px);overflow:auto;border:1px solid rgba(218,202,245,.22);border-radius:22px;background:#15111e;color:#f5f1fa;padding:16px}#${OV} .h{display:flex;justify-content:space-between;gap:12px}#${OV} h3{font-size:17px;margin:3px 0 5px}#${OV} p{margin:0;color:#aaa1b7;font-size:11px;line-height:1.5}#${OV} .x{border:0;background:none;color:#b9afc6;font-size:25px}#${OV} .g{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0}#${OV} .g img,#${OV} .more{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:9px;border:1px solid rgba(255,255,255,.11);background:#08070d}#${OV} .more{display:grid;place-items:center;color:#a99db8;font-size:11px}#${OV} .share,#${OV} .down{width:100%;min-height:46px;border-radius:13px;margin-top:8px;font-weight:800}#${OV} .share{border:1px solid #bca8e7;background:linear-gradient(135deg,#9072d7,#5e4b8f);color:#fff}#${OV} .down{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#ddd5e7}#${OV} .status{margin-top:8px;color:#ac9fba;font-size:10.5px;min-height:18px}`;
    document.head.appendChild(s);
  }
  function overlay(){
    let o=$(OV);if(o)return o;
    o=document.createElement('div');o.id=OV;o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    o.innerHTML=`<section class="s"><div class="h"><div><small>LUNEA · SHARE PNG</small><h3>공유용 이미지 준비 완료</h3><p>4:5 PNG를 만들었어. 아래 버튼을 한 번 더 눌러 공유창에서 ‘사진에 저장’을 선택하면 돼.</p></div><button class="x" aria-label="닫기">×</button></div><div class="g"></div><button class="share">공유창 열기</button><button class="down">PNG 파일 저장</button><div class="status"></div></section>`;
    document.body.appendChild(o);o.querySelector('.x').onclick=close;o.addEventListener('pointerup',e=>{if(e.target===o)close()});o.querySelector('.share').onclick=share;o.querySelector('.down').onclick=download;return o;
  }
  function close(){const o=$(OV);if(o)o.dataset.open='false';prepared=null;revoke()}
  function preview(r){
    const o=overlay(),g=o.querySelector('.g');prepared=r;revoke();g.replaceChildren();
    const fs=r.files||[],n=Math.min(fs.length,6);
    for(let i=0;i<n;i++){const u=URL.createObjectURL(fs[i]);urls.push(u);const q=new Image();q.src=u;q.alt=`공유 이미지 ${i+1}`;g.appendChild(q)}
    if(fs.length>n){const d=document.createElement('div');d.className='more';d.textContent=`+ ${fs.length-n}장`;g.appendChild(d)}
    const ok=!!(navigator.share&&navigator.canShare&&navigator.canShare({files:fs}));o.querySelector('.share').hidden=!ok;o.querySelector('.status').textContent=`총 ${fs.length}장 · 1080 × 1350 PNG`;o.dataset.open='true';
  }
  async function prepare(){
    const b=$(BTN);if(!b||b.disabled)return;const old=b.textContent;b.disabled=true;b.textContent='PNG 만드는 중…';
    try{preview(await render())}catch(e){console.error('[LUNEA share]',e);alert(e?.message||'PNG 생성 중 오류가 발생했어.')}finally{b.disabled=false;b.textContent=old}
  }
  function share(){
    const fs=prepared?.files||[],s=$(OV)?.querySelector('.status');if(!fs.length)return;
    if(!(navigator.share&&navigator.canShare&&navigator.canShare({files:fs}))){if(s)s.textContent='파일 공유를 지원하지 않아. PNG 파일 저장을 사용해줘.';return}
    navigator.share({files:fs,title:'LUNEA Reading',text:'LUNEA 타로 · 오라클 리딩 결과'}).catch(e=>{if(e?.name!=='AbortError'){console.error(e);if(s)s.textContent='공유창을 열지 못했어.'}});
  }
  function download(){
    (prepared?.files||[]).forEach((f,i)=>setTimeout(()=>{const u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500)},i*180));
  }
  function button(){
    const bar=document.querySelector('#spreadOverlay .actionbar');if(!bar)return false;
    let b=$(BTN);
    if(!b){b=document.createElement('button');b.id=BTN;b.type='button';b.className='mini';b.textContent='🖼 공유 PNG';b.onclick=prepare;bar.appendChild(b)}
    else if(b.parentElement!==bar)bar.appendChild(b);
    W.LUNEA_READING_ACTION_ORDER_V33?.reorder?.();return true;
  }
  function boot(){
    style();overlay();button();
    const bar=document.querySelector('#spreadOverlay .actionbar');if(bar)new MutationObserver(()=>{if(!$(BTN))button()}).observe(bar,{childList:true});
    W.addEventListener('pageshow',button);document.addEventListener('visibilitychange',()=>{if(!document.hidden)button()});
    W.LUNEA_READING_SHARE_V1=Object.freeze({version:'1.1',buildPayload:payload,renderFiles:render,prepareShare:prepare,sharePrepared:share,ensureButton:button,resolveImageSource});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
