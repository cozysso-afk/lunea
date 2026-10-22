import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filepath=path.resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
  if(!filepath.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',mime[path.extname(filepath)]||'application/octet-stream');
  const stream=fs.createReadStream(filepath);
  stream.on('error',()=>{if(!res.headersSent)res.writeHead(404);res.end();});
  stream.pipe(res);
});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const port=18765,chromePort=19377;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lunea-browser-'));
const browser=spawn(process.env.CHROME_BINARY||'google-chrome',[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--remote-debugging-port='+chromePort,
  '--user-data-dir='+dir,'about:blank'
],{stdio:'ignore'});
let socket,seq=0;
const pending=new Map();
async function checkEventually(f,ms=20000){
  const start=Date.now();let last;
  while(Date.now()-start<ms){
    try{const x=await f();if(x)return x;}catch(e){last=e;}
    await delay(150);
  }
  throw Error('Timeout: '+String(last||''));
}
async function cdp(method,params={}){
  const id=++seq;
  const waiting=new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
  socket.send(JSON.stringify({id,method,params}));
  return waiting;
}
async function js(expression){
  const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('Browser eval error: '+JSON.stringify(r.exceptionDetails));
  return r.result?.value;
}
try{
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  const tab=await checkEventually(async()=>{
    const resp=await fetch('http://127.0.0.1:'+chromePort+'/json');
    if(!resp.ok)return null;
    return (await resp.json()).find(x=>x.type==='page');
  });
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=e=>{
    const result=JSON.parse(String(e.data));
    if(!result.id)return;
    const job=pending.get(result.id);
    if(!job)return;
    pending.delete(result.id);
    if(result.error)job.reject(Error(result.error.message));
    else job.resolve(result.result);
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Page.navigate',{url:'http://127.0.0.1:'+port+'/index.html'});
  await checkEventually(()=>js("document.readyState==='complete' && !!window.LUNEA_READING_CONSISTENCY_V1"));
  assert.equal(await js("!!document.getElementById('aiRead')"),true);
  assert.equal(await js("!!document.getElementById('saveReading')"),true);
  const script=[
    '(async()=>{',
    "  const answer='[LUNEA_VERDICT:UNCERTAIN]\\n카드의 연락 신호는 확정되지 않았습니다. 감정적 가능성과 실제 연락 행동을 나누어 검토하며, 반대 근거도 함께 확인합니다. 최종적으로 이 배열은 판단 보류입니다.\\n[LUNEA_END:UNCERTAIN]';",
    '  window.alert=()=>{};window.confirm=()=>true;',
    '  window.__testFetchCount=0;',
    '  window.fetch=async()=>{window.__testFetchCount++;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:answer}]}}]})};};',
    "  localStorage.setItem('LUNEA_API_KEY','smoke-key');",
    "  state.question='2026-12-31까지 상대가 새 화제로 선톡할까?';",
    "  state.category='LOVE';state.title='연락 행동';state.rationale='행동 기준';state.positions=['실제 연락 결과'];",
    "  state.drawn=[{code:'Swords02',name:'Two of Swords (검 2)',isReversed:false,position:'실제 연락 결과',subCards:[],gdAttribution:'Moon in Libra',primaryType:'Minor',classicalRuler:'Air',keyword:'교착'}];",
    "  await document.getElementById('aiRead').onclick();",
    "  const first=document.getElementById('aiText')?.textContent||'';",
    '  const before=window.__testFetchCount;',
    "  await document.getElementById('aiRead').onclick();",
    "  const second=document.getElementById('aiText')?.textContent||'';",
    "  document.getElementById('saveReading').onclick();",
    "  const rows=JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3')||'[]');",
    "  const c=window.LUNEA_READING_CONSISTENCY_V1;",
    "  return {first,second,before,after:window.__testFetchCount,saved:rows[0]?.conclusion?.verdict,fingerprint:!!rows[0]?.readingFingerprint,cached:!!c.get(c.fingerprint(state,profile))};",
    '})()'
  ].join('\n');
  const result=await js(script);
  assert.ok(result.first.includes('연락 신호'),JSON.stringify(result));
  assert.equal(result.before,1,'initial model fetch');
  assert.equal(result.after,1,'repeat should reuse accepted text');
  assert.equal(result.first,result.second,'repeat text should match');
  assert.equal(result.saved,'UNCERTAIN','original verdict saved');
  assert.equal(result.fingerprint,true,'original fingerprint saved');
  assert.equal(result.cached,true,'cache present');

  const shared=await js([
    '(async()=>{',
    "  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__lastPrompt=text;}}});",
    "  await document.getElementById('copyPrompt').onclick();",
    "  const firstCopy=window.__lastPrompt||'';",
    "  state.question='2027-01-31까지 새 화제로 먼저 선톡할까?';",
    "  await document.getElementById('copyPrompt').onclick();",
    "  const secondCopy=window.__lastPrompt||'';",
    "  const api=window.LUNEA_READING_CONSISTENCY_V1;",
    "  const target=api.readingId(api.fingerprint(state,profile));",
    "  document.getElementById('importChatgptReading').onclick();",
    "  const field=document.getElementById('luneaChatgptPasteText');",
    "  const answer='이 질문은 감정과 행동 근거가 상반되어 실제로 상대가 먼저 선톡할지 명확히 확정할 수 없습니다. 결과 카드는 여전히 판단 유보로 보는 것이 합리적입니다.';",
    "  const bad='[LUNEA_READING_ID:wrong]\\n[LUNEA_VERDICT:UNCERTAIN]\\n'+answer+'\\n[LUNEA_END:UNCERTAIN]';",
    "  field.value=bad;document.getElementById('luneaChatgptPasteAccept').onclick();",
    "  const rejected=!!document.getElementById('luneaChatgptImportModal');",
    "  field.value='[LUNEA_READING_ID:'+target+']\\n[LUNEA_VERDICT:UNCERTAIN]\\n'+answer+'\\n[LUNEA_END:UNCERTAIN]';",
    "  document.getElementById('luneaChatgptPasteAccept').onclick();",
    "  const afterImport=window.__testFetchCount;",
    "  await document.getElementById('aiRead').onclick();",
    "  const afterAI=window.__testFetchCount;",
    "  document.getElementById('saveReading').onclick();",
    "  const archive=JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3')||'[]');",
    "  return {",
    "    firstPinned:firstCopy.includes('기존 판정 코드: UNCERTAIN'),",
    "    firstHasBody:firstCopy.includes('카드의 연락 신호는 확정되지 않았습니다.'),",
    "    secondEmpty:secondCopy.includes('저장된 최초 결론이 없습니다.'),",
    "    idInSecond:secondCopy.includes('[LUNEA_READING_ID:'+target+']'),",
    "    rejected,afterImport,afterAI,",
    "    source:archive[0]?.conclusion?.source,",
    "    verdict:archive[0]?.conclusion?.verdict,",
    "    sameAnswer:document.getElementById('aiText')?.textContent===answer",
    "  };",
    '})()'
  ].join('\n'));
  assert.equal(shared.firstPinned,true,'Gemini-first prompt must include original verdict');
  assert.equal(shared.firstHasBody,true,'Gemini-first prompt must include original text');
  assert.equal(shared.secondEmpty,true,'ChatGPT-first prompt needs no existing conclusion');
  assert.equal(shared.idInSecond,true,'prompt must give a matching reading ID');
  assert.equal(shared.rejected,true,'mismatched reading ID must be blocked');
  assert.equal(shared.afterAI,shared.afterImport,'ChatGPT-first reading should not call Gemini');
  assert.equal(shared.source,'chatgpt','archive must preserve external provider');
  assert.equal(shared.verdict,'UNCERTAIN');
  assert.equal(shared.sameAnswer,true,'copied answer must be reused verbatim');

  console.log('LUNEA real browser UI smoke PASS');
}finally{
  if(socket)socket.close();
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>browser.once('exit',resolve)),delay(1200)]);
  await new Promise(resolve=>server.close(resolve));
  // Chrome can write its last profile files during shutdown; retry cleanup.
  // Runner teardown clears /tmp. A Chrome child can still write during exit;
  // never turn successful browser assertions into a failed check for temp cleanup.
  try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
  catch(err){console.warn('Chrome temp cleanup skipped:',err.code||err.message);}
}
