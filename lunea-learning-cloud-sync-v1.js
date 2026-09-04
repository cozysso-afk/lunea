'use strict';

/* LUNEA LEARNING CLOUD SYNC V1
   Optional account sync for LUNEA_SPREAD_LEARNING_V1.
   Local learning stays available while signed out. Signed-in users merge at most
   1000 rows through owner-only Supabase RLS. Remote DELETE is intentionally absent. */
(() => {
  const W=window;
  if(W.__LUNEA_LEARNING_CLOUD_SYNC_V1__)return;
  W.__LUNEA_LEARNING_CLOUD_SYNC_V1__=true;

  const URL='https://safcnvwojjthhursiers.supabase.co';
  const KEY='sb_publishable_NQ0pSTq8gE8JrKDrIyXJww_HTapFg_x';
  const TABLE='spread_learning_memories';
  const SESSION_KEY='LUNEA_SUPABASE_SESSION_V1';
  const MAX=1000,MIN_ON_QUOTA=80;
  const $=id=>document.getElementById(id);
  let syncing=null,hooked=false,lastMessage='',pushTimer=0;

  const clean=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim();
  function readJSON(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x==null?fallback:x}catch{return fallback}}
  const learning=()=>W.LUNEA_SPREAD_LEARNING_V1||null;
  function upgradeRow(row){const api=learning();return typeof api?.upgradeRow==='function'?api.upgradeRow(row):row}
  const localKey=()=>learning()?.key||'LUNEA_SPREAD_CORRECTION_MEMORY_V1';
  function localRows(){const api=learning();if(typeof api?.list==='function')return api.list().slice(0,MAX);const x=readJSON(localKey(),[]);return Array.isArray(x)?x.slice(0,MAX):[]}
  function rowTime(row){const n=Number(row?.updatedAt||row?.createdAt||0);return Number.isFinite(n)&&n>0?n:0}
  function rawQuestionKey(row){const k=clean(row?.questionKey);if(k)return k.slice(0,980);return clean(row?.question).toLowerCase().replace(/[^0-9a-z가-힣]+/g,'').slice(0,980)}
  function rowCategory(row){const direct=clean(row?.category).toUpperCase();if(['GENERAL','LOVE','INTIMACY','CAREER','STOCK'].includes(direct))return direct;const domain=clean(row?.structureProfile?.domain).toLowerCase();if(domain==='intimacy')return'INTIMACY';if(domain==='relationship')return'LOVE';if(domain==='stock')return'STOCK';if(['career','study','money'].includes(domain))return'CAREER';return'GENERAL'}
  function questionKey(row){const raw=rawQuestionKey(row);return `${rowCategory(row)}::${raw}`.slice(0,1024)}
  const validRow=row=>!!row&&typeof row==='object'&&!!rawQuestionKey(row)&&Array.isArray(row.positions)&&row.positions.length>=2;

  function writeLocal(rows){
    let kept=rows.filter(validRow).sort((a,b)=>rowTime(b)-rowTime(a)).slice(0,MAX);
    while(kept.length){
      try{localStorage.setItem(localKey(),JSON.stringify(kept));return kept.length}
      catch(e){if(kept.length<=MIN_ON_QUOTA){console.warn('[LUNEA Cloud Sync] local merge save failed',e);return 0}kept=kept.slice(0,Math.max(MIN_ON_QUOTA,Math.floor(kept.length*.8)))}
    }
    try{localStorage.setItem(localKey(),'[]')}catch{}
    return 0;
  }
  function normalizeCloudRow(remote){
    const payload=remote?.payload&&typeof remote.payload==='object'?{...remote.payload}:{};
    const remoteKey=clean(remote?.question_key);
    const sep=remoteKey.indexOf('::');
    if(!payload.category&&sep>0)payload.category=remoteKey.slice(0,sep).toUpperCase();
    if(!payload.questionKey){const raw=sep>0?remoteKey.slice(sep+2):remoteKey;payload.questionKey=clean(raw).slice(0,980)}
    payload.source=remote?.source==='manual'||payload.source==='manual'?'manual':'ai_correction';
    const serverMs=Date.parse(remote?.updated_at||'')||0;
    if(!rowTime(payload)||serverMs>rowTime(payload))payload.updatedAt=serverMs||Date.now();
    return upgradeRow(payload);
  }
  function mergeRows(local,remote){
    const map=new Map();
    for(const raw of Array.isArray(remote)?remote:[]){const row=normalizeCloudRow(raw),k=questionKey(row);if(!k||!validRow(row))continue;const old=map.get(k);if(!old||rowTime(row)>rowTime(old))map.set(k,row)}
    for(const raw0 of Array.isArray(local)?local:[]){const raw=upgradeRow(raw0),k=questionKey(raw);if(!k||!validRow(raw))continue;const old=map.get(k);if(!old||rowTime(raw)>=rowTime(old))map.set(k,{...raw,questionKey:rawQuestionKey(raw),category:rowCategory(raw)})}
    return [...map.values()].sort((a,b)=>rowTime(b)-rowTime(a)).slice(0,MAX);
  }

  const loadSession=()=>{const s=readJSON(SESSION_KEY,null);return s&&typeof s==='object'?s:null};
  function saveSession(data){
    if(!data?.access_token||!data?.refresh_token)return null;
    const raw=Number(data.expires_at||0),expiresAt=raw?(raw<1e12?raw*1000:raw):(Date.now()+Number(data.expires_in||3600)*1000);
    const s={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:expiresAt,user:data.user?{id:data.user.id,email:data.user.email||''}:null};
    localStorage.setItem(SESSION_KEY,JSON.stringify(s));return s;
  }
  const clearSession=()=>{try{localStorage.removeItem(SESSION_KEY)}catch{}};
  const errorText=(data,status)=>clean(data?.msg||data?.message||data?.error_description||data?.error||`HTTP ${status}`)||'요청에 실패했어.';
  function headers(token,json=true){const h={apikey:KEY};if(json)h['Content-Type']='application/json';if(token)h.Authorization=`Bearer ${token}`;return h}
  async function jsonRequest(url,options={}){const res=await fetch(url,options);let data=null;try{data=await res.json()}catch{}if(!res.ok)throw new Error(errorText(data,res.status));return data}
  function auth(path,body,token){return jsonRequest(`${URL}/auth/v1/${path}`,{method:body==null?'GET':'POST',headers:headers(token,body!=null),...(body==null?{}:{body:JSON.stringify(body)})})}
  async function refreshSession(){const old=loadSession();if(!old?.refresh_token)return null;try{return saveSession(await auth('token?grant_type=refresh_token',{refresh_token:old.refresh_token}))}catch(e){console.warn('[LUNEA Cloud Sync] session refresh failed',e);clearSession();return null}}
  async function session(){let s=loadSession();if(!s)return null;if(!s.expires_at||Number(s.expires_at)<=Date.now()+60000)s=await refreshSession();return s}
  async function userSession(){let s=await session();if(!s?.access_token)return null;if(s.user?.id)return s;try{const u=await auth('user',null,s.access_token);s={...s,user:{id:u.id,email:u.email||''}};localStorage.setItem(SESSION_KEY,JSON.stringify(s));return s}catch{return refreshSession()}}
  async function signIn(email,password){const s=saveSession(await auth('token?grant_type=password',{email:clean(email),password:String(password||'')}));if(!s)throw new Error('로그인 세션을 만들지 못했어.');return s}
  async function signUp(email,password){const d=await auth('signup',{email:clean(email),password:String(password||'')});return{session:d?.access_token?saveSession(d):null,user:d?.user||null}}
  async function signOut(){const s=loadSession();try{if(s?.access_token)await auth('logout',{},s.access_token)}catch(e){console.warn('[LUNEA Cloud Sync] remote logout failed',e)}finally{clearSession();updateUI()}}

  async function pullRemote(s){const data=await jsonRequest(`${URL}/rest/v1/${TABLE}?select=question_key,source,payload,updated_at&order=updated_at.desc&limit=${MAX}`,{method:'GET',headers:{...headers(s.access_token,false),Accept:'application/json'}});return Array.isArray(data)?data:[]}
  async function pushBatch(s,rows){
    if(!rows.length)return;
    const body=rows.map(raw=>{const row=upgradeRow(raw),updated=rowTime(row)||Date.now(),k=questionKey(row);return{user_id:s.user.id,question_key:k,source:row.source==='manual'?'manual':'ai_correction',payload:{...row,questionKey:rawQuestionKey(row),category:rowCategory(row),updatedAt:updated},updated_at:new Date(updated).toISOString()}});
    const res=await fetch(`${URL}/rest/v1/${TABLE}?on_conflict=user_id,question_key`,{method:'POST',headers:{...headers(s.access_token,true),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
    if(!res.ok){let data=null;try{data=await res.json()}catch{}throw new Error(errorText(data,res.status))}
  }
  async function pushRows(s,rows){const safe=rows.map(upgradeRow).filter(validRow).slice(0,MAX);for(let i=0;i<safe.length;i+=100)await pushBatch(s,safe.slice(i,i+100))}
  async function syncAll(options={}){
    if(syncing)return syncing;
    syncing=(async()=>{
      const s=await userSession();if(!s?.user?.id){if(!options.silent)openModal('로그인하면 기기 간 학습 동기화를 사용할 수 있어.');return{ok:false,reason:'signed_out'}}
      setBusy(true,'동기화 중…');
      try{const before=localRows(),remote=await pullRemote(s),merged=mergeRows(before,remote);writeLocal(merged);await pushRows(s,merged);lastMessage=`동기화 완료 · 이 기기 ${merged.length}개 · 계정에서 ${remote.length}개 확인`;updateUI(lastMessage);return{ok:true,localBefore:before.length,remoteBefore:remote.length,merged:merged.length}}
      catch(error){lastMessage=`동기화 실패 · ${error.message||error}`;updateUI(lastMessage,true);if(!options.silent)openModal(lastMessage);return{ok:false,error}}
      finally{setBusy(false)}
    })();
    try{return await syncing}finally{syncing=null}
  }
  function queuePush(row){updateUI();clearTimeout(pushTimer);pushTimer=setTimeout(async()=>{const s=await userSession();if(!s?.user?.id)return;try{setBusy(true,'새 학습 저장 중…');await pushRows(s,[row]);lastMessage=`새 교정 학습 저장 완료 · ${localRows().length}/${MAX}`}catch(e){console.warn('[LUNEA Cloud Sync] background push failed',e);lastMessage='새 학습은 이 기기에 저장됨 · 계정 동기화는 나중에 다시 시도'}finally{setBusy(false);updateUI(lastMessage)}},280)}

  function hookLearning(){
    const api=learning();if(!api||hooked)return!!api;hooked=true;
    if(typeof api.record==='function'){const prior=api.record.bind(api);api.record=function(payload){const r=prior(payload);if(r?.saved&&r.row)queuePush(r.row);else updateUI();return r}}
    if(typeof api.recordManual==='function'){const prior=api.recordManual.bind(api);api.recordManual=function(payload){const r=prior(payload);if(r?.saved&&r.row)queuePush(r.row);else updateUI();return r}}
    if(typeof api.clear==='function'){const prior=api.clear.bind(api);api.clear=function(){const out=prior();lastMessage='이 기기의 학습 메모리만 비웠어. 계정 보관본은 삭제하지 않아.';updateUI(lastMessage);return out}}
    return true;
  }

  function ensureStyles(){if($('luneaLearningCloudSyncStyle'))return;const s=document.createElement('style');s.id='luneaLearningCloudSyncStyle';s.textContent=`
    #luneaLearningSyncBar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:-8px 0 16px;padding:8px 10px;border-radius:12px;background:rgba(189,164,248,.055);border:1px solid rgba(189,164,248,.14);font-size:10px;color:#d9d0e9}#luneaLearningSyncBar b{color:#efe9fb}#luneaLearningSyncStatus{color:var(--dim);font-size:9.5px;margin-top:2px;line-height:1.35}#luneaLearningSyncBtn{flex:0 0 auto;padding:6px 9px}
    #luneaLearningSyncOverlay{z-index:430}#luneaLearningSyncOverlay .modal{max-width:420px}#luneaLearningAuthState{margin:2px 0 12px;padding:10px 11px;border-radius:12px;background:rgba(157,228,193,.06);border:1px solid rgba(157,228,193,.16);font-size:10.5px;line-height:1.5;color:#dfeae5}#luneaLearningAuthActions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.lunea-learning-sync-actions{display:flex;gap:7px;margin-top:9px}.lunea-learning-sync-actions button{flex:1}#luneaLearningSyncMessage{min-height:18px;margin:9px 2px 0;color:var(--dim);font-size:10px;line-height:1.45}#luneaLearningSyncMessage.error{color:#ffc0ca}.lunea-learning-privacy{margin:12px 1px 0;color:var(--dim);font-size:9.5px;line-height:1.55}@media(max-width:360px){#luneaLearningSyncBar{align-items:flex-start}#luneaLearningAuthActions{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }
  function ensureUI(){
    ensureStyles();
    if(!$('luneaLearningSyncBar')){const engine=document.querySelector('.engine-strip');if(engine){const bar=document.createElement('div');bar.id='luneaLearningSyncBar';bar.innerHTML=`<div><b>🧠 자동 배열 학습 <span id="luneaLearningLocalCount">0/${MAX}</span></b><div id="luneaLearningSyncStatus">이 기기에 안전하게 학습 중</div></div><button class="mini" id="luneaLearningSyncBtn">☁ 동기화</button>`;engine.insertAdjacentElement('afterend',bar);$('luneaLearningSyncBtn')?.addEventListener('click',()=>openModal())}}
    if(!$('luneaLearningSyncOverlay')){const o=document.createElement('div');o.className='overlay profile-modal';o.id='luneaLearningSyncOverlay';o.setAttribute('aria-hidden','true');o.innerHTML=`<div class="modal"><button class="close" id="luneaLearningSyncClose">×</button><div class="sub">PRIVATE LEARNING SYNC</div><h3 class="modal-h">자동 배열 학습 동기화</h3><div id="luneaLearningAuthState">상태 확인 중…</div><div id="luneaLearningSignedOut"><div class="field"><label>이메일</label><input type="email" id="luneaLearningEmail" autocomplete="email" placeholder="you@example.com"></div><div class="field"><label>비밀번호</label><input type="password" id="luneaLearningPassword" autocomplete="current-password" placeholder="6자 이상"></div><div id="luneaLearningAuthActions"><button class="mini" id="luneaLearningSignUp">계정 만들기</button><button class="primary" id="luneaLearningSignIn">로그인 + 동기화</button></div></div><div id="luneaLearningSignedIn" style="display:none"><div class="lunea-learning-sync-actions"><button class="primary" id="luneaLearningSyncNow">지금 동기화</button><button class="mini" id="luneaLearningSignOut">로그아웃</button></div></div><div id="luneaLearningSyncMessage"></div><p class="lunea-learning-privacy">로그인하지 않아도 기존 로컬 학습은 그대로 작동해. 로그인한 경우에만 질문 원문과 네가 확정한 스프레드 구조가 <b>본인 계정 전용</b> 저장소에 동기화돼. 다른 사용자는 조회할 수 없고, 앱에서는 원격 학습 삭제 기능을 두지 않았어.</p></div>`;document.body.appendChild(o);$('luneaLearningSyncClose')?.addEventListener('click',closeModal);o.addEventListener('click',e=>{if(e.target===o)closeModal()});$('luneaLearningSignIn')?.addEventListener('click',handleSignIn);$('luneaLearningSignUp')?.addEventListener('click',handleSignUp);$('luneaLearningSyncNow')?.addEventListener('click',()=>syncAll());$('luneaLearningSignOut')?.addEventListener('click',signOut)}
    updateUI();
  }
  function updateUI(message,isError=false){const count=localRows().length;if($('luneaLearningLocalCount'))$('luneaLearningLocalCount').textContent=`${count}/${MAX}`;const s=loadSession();if($('luneaLearningSyncStatus'))$('luneaLearningSyncStatus').textContent=s?.user?.email?`계정 동기화 · ${s.user.email}`:'이 기기에 안전하게 학습 중 · 로그인 시 기기 간 동기화';if($('luneaLearningAuthState'))$('luneaLearningAuthState').textContent=s?.user?.email?`로그인됨 · ${s.user.email} · 이 기기 학습 ${count}/${MAX}`:`로그아웃 상태 · 이 기기 학습 ${count}/${MAX}`;if($('luneaLearningSignedOut'))$('luneaLearningSignedOut').style.display=s?.access_token?'none':'block';if($('luneaLearningSignedIn'))$('luneaLearningSignedIn').style.display=s?.access_token?'block':'none';const m=$('luneaLearningSyncMessage');if(m&&(message!=null||lastMessage)){m.textContent=message!=null?message:lastMessage;m.classList.toggle('error',!!isError)}}
  function setBusy(busy,label=''){['luneaLearningSignIn','luneaLearningSignUp','luneaLearningSyncNow','luneaLearningSignOut','luneaLearningSyncBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=!!busy});if(busy&&label&&$('luneaLearningSyncMessage'))$('luneaLearningSyncMessage').textContent=label}
  function openModal(message=''){ensureUI();const o=$('luneaLearningSyncOverlay');if(!o)return;o.classList.add('show');o.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');updateUI(message||undefined)}
  function closeModal(){const o=$('luneaLearningSyncOverlay');if(!o)return;o.classList.remove('show');o.setAttribute('aria-hidden','true');if(!document.querySelector('.overlay.show'))document.body.classList.remove('modal-open')}
  function credentials(){const email=clean($('luneaLearningEmail')?.value),password=String($('luneaLearningPassword')?.value||'');if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('이메일 형식을 확인해줘.');if(password.length<6)throw new Error('비밀번호는 6자 이상 입력해줘.');return{email,password}}
  async function handleSignIn(){setBusy(true,'로그인 중…');try{const c=credentials();await signIn(c.email,c.password);lastMessage='로그인 완료. 이 기기 학습과 계정 보관본을 합치는 중…';updateUI(lastMessage);await syncAll()}catch(e){lastMessage=`로그인 실패 · ${e.message||e}`;updateUI(lastMessage,true)}finally{setBusy(false)}}
  async function handleSignUp(){setBusy(true,'계정 만드는 중…');try{const c=credentials(),r=await signUp(c.email,c.password);if(r.session){lastMessage='계정 생성 + 로그인 완료. 학습을 동기화할게.';updateUI(lastMessage);await syncAll()}else{lastMessage='계정을 만들었어. 확인 메일이 왔다면 인증한 뒤 여기서 로그인해줘.';updateUI(lastMessage)}}catch(e){lastMessage=`가입 실패 · ${e.message||e}`;updateUI(lastMessage,true)}finally{setBusy(false)}}
  async function boot(){ensureUI();let tries=0;const t=setInterval(()=>{tries++;if(hookLearning()||tries>160)clearInterval(t);updateUI()},80);hookLearning();const s=await userSession();updateUI();if(s?.user?.id)syncAll({silent:true})}

  W.LUNEA_LEARNING_CLOUD_SYNC_V1={version:2,max:MAX,upgradeRow,mergeRows,normalizeCloudRow,questionKey,localRows,session:userSession,signIn,signUp,signOut,sync:syncAll,open:openModal};
  if(document.readyState==='loading')W.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
  console.info('☁️ LUNEA Learning Cloud Sync V1 loaded · opt-in account sync · successful records only · RLS owner-only · no remote delete');
})();
