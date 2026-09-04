from pathlib import Path
import re


def replace(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    actual=s.count(old)
    if actual != count:
        raise SystemExit(f'{path}: expected {count} occurrences, found {actual}: {old[:100]!r}')
    p.write_text(s.replace(old,new,count))

# 1) 13-20 manual runtime scope + category-aware learning payload.
replace('lunea-manual-limit20-v17.js',
"    try {\n      const originCategory = String(state?.__luneaManualOriginCategory || state?.category || 'GENERAL').trim().toUpperCase() || 'GENERAL';\n      state.__luneaManualOriginCategory = originCategory;",
"    const originCategory = String(state?.__luneaManualOriginCategory || state?.category || 'GENERAL').trim().toUpperCase() || 'GENERAL';\n    try {\n      state.__luneaManualOriginCategory = originCategory;")
replace('lunea-manual-limit20-v17.js',
"          axes:p.axes\n        });",
"          axes:p.axes,\n          category:originCategory\n        });")
replace('lunea-manual-structure-v1.js',
"          axes:parseManualPositions().axes\n        });",
"          axes:parseManualPositions().axes,\n          category:originCategory\n        });")

# 2) Learning V1.5/V5: category-isolated memory + INTIMACY domain + legacy migration.
p=Path('lunea-user-spread-learning-v1.js'); s=p.read_text()
s=s.replace('LUNEA USER SPREAD LEARNING V1.4','LUNEA USER SPREAD LEARNING V1.5')
s=s.replace("  function samePositions(a,b){const A=positions(a),B=positions(b);return A.length===B.length&&A.every((x,i)=>x===B[i])}\n\n  function profile(question,meta={}){",
"  function samePositions(a,b){const A=positions(a),B=positions(b);return A.length===B.length&&A.every((x,i)=>x===B[i])}\n  const KNOWN_CATEGORIES=new Set(['GENERAL','LOVE','INTIMACY','CAREER','STOCK']);\n  function explicitCategory(v){const c=clean(v).toUpperCase();return KNOWN_CATEGORIES.has(c)?c:''}\n  function inferredCategory(question,meta={}){\n    const explicit=explicitCategory(meta.category||meta.cat);\n    if(explicit)return explicit;\n    const p=profile(question,meta);\n    if(p.domain==='intimacy')return 'INTIMACY';\n    if(p.domain==='relationship')return 'LOVE';\n    if(p.domain==='stock')return 'STOCK';\n    if(['career','study','money'].includes(p.domain))return 'CAREER';\n    return 'GENERAL';\n  }\n  function currentCategory(){try{return explicitCategory(state?.category)||''}catch{return ''}}\n  function rowCategory(row){return explicitCategory(row?.category)||inferredCategory(row?.question||'',{intentSummary:row?.intentSummary,primaryIntent:row?.primaryIntent,targetStructure:row?.targetStructure,requestedAxes:row?.requestedAxes})}\n\n  function profile(question,meta={}){")
old="""    const hint=[meta.intentSummary,meta.primaryIntent,meta.targetStructure,...(Array.isArray(meta.requestedAxes)?meta.requestedAxes:[])].map(clean).join(' ').toLowerCase();
    const all=`${q} ${hint}`;
    const domain=/(주식|종목|매수|매도|익절|손절|추매|보유)/.test(all)?'stock'
      :/(시험|합격|공부|학습|강의|점수)/.test(all)?'study'
      :/(직장|회사|이직|퇴사|상사|동료|면접|커리어)/.test(all)?'career'
      :/(돈|금전|재정|지출|수입|부채)/.test(all)?'money'
      :/(건강|몸|컨디션|피곤|회복|수면)/.test(all)?'wellbeing'
      :/(상대|연애|사랑|감정|마음|연락|재회|이별|썸|전남|전여|남친|여친)/.test(all)?'relationship'
      :'general';"""
new="""    const categoryHint=explicitCategory(meta.category||meta.cat);
    const hint=[meta.intentSummary,meta.primaryIntent,meta.targetStructure,...(Array.isArray(meta.requestedAxes)?meta.requestedAxes:[])].map(clean).join(' ').toLowerCase();
    const all=`${q} ${hint}`;
    const domain=categoryHint==='INTIMACY'||/(속궁합|성적\s*(?:궁합|끌림|욕구|리듬|텐션|만족)|신체적\s*(?:끌림|친밀|궁합)|성관계|섹스|키스|애무|첫\s*관계|잠자리|19\+|18\+)/.test(all)?'intimacy'
      :/(주식|종목|매수|매도|익절|손절|추매|보유)/.test(all)?'stock'
      :/(시험|합격|공부|학습|강의|점수)/.test(all)?'study'
      :/(직장|회사|이직|퇴사|상사|동료|면접|커리어)/.test(all)?'career'
      :/(돈|금전|재정|지출|수입|부채)/.test(all)?'money'
      :/(건강|몸|컨디션|피곤|회복|수면)/.test(all)?'wellbeing'
      :categoryHint==='LOVE'||/(상대|연애|사랑|감정|마음|연락|재회|이별|썸|전남|전여|남친|여친)/.test(all)?'relationship'
      :'general';"""
if old not in s: raise SystemExit('learning domain block not found')
s=s.replace(old,new,1)
s=s.replace("    return {version:1,domain,target,modes:[...new Set(modes)].sort(),stage};",
            "    return {version:2,domain,target,modes:[...new Set(modes)].sort(),stage};",1)
old_read="""  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(x)?x:[];
    }catch{return[]}
  }"""
new_read="""  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(x))return[];
      return x.map(row=>{
        if(!row||typeof row!=='object')return row;
        const category=rowCategory(row);
        const meta={intentSummary:row.intentSummary,primaryIntent:row.primaryIntent,targetStructure:row.targetStructure,requestedAxes:row.requestedAxes,category};
        const structureProfile=!row.structureProfile||Number(row.structureProfile.version||0)<2?profile(row.question||'',meta):row.structureProfile;
        return {...row,category,structureProfile};
      });
    }catch{return[]}
  }"""
if old_read not in s: raise SystemExit('learning read block not found')
s=s.replace(old_read,new_read,1)
s=s.replace("    const meta=payload.meta||corrected._luneaPreflight||{};\n    const now=Date.now();",
            "    const meta=payload.meta||corrected._luneaPreflight||{};\n    const category=explicitCategory(payload.category||meta.category)||inferredCategory(q,meta);\n    const now=Date.now();",1)
s=s.replace("      questionKey:compact(q),\n      spreadTitle:title||'사용자 교정 배열',",
            "      questionKey:compact(q),\n      category,\n      spreadTitle:title||'사용자 교정 배열',",1)
s=s.replace("      structureProfile:profile(q,meta),",
            "      structureProfile:profile(q,{...meta,category}),",1)
s=s.replace("    const idx=rows.findIndex(x=>x&&x.questionKey===row.questionKey);",
            "    const idx=rows.findIndex(x=>x&&x.questionKey===row.questionKey&&rowCategory(x)===row.category);",1)
s=s.replace("      source:'manual',\n      meta:{",
            "      source:'manual',\n      category:payload.category,\n      meta:{\n        category:payload.category,",1)
old_score="""  function score(q,row){
    const exact=compact(q)===String(row.questionKey||'')?3:0;
    const q3=grams(q,3),q4=grams(q,4),qw=words(q);
    const r3=grams(row.question,3),r4=grams(row.question,4),rw=words(row.question);
    const base=jac(q3,r3)*1.0+jac(q4,r4)*.72+overlap(qw,rw)*.42;
    const axes=[row.intentSummary,row.primaryIntent,row.targetStructure,...(row.requestedAxes||[]),...(row.positions||[])].join(' ');
    const semantic=jac(q3,grams(axes,3))*.30;
    const queryProfile=profile(q);
    const rowProfile=row.structureProfile||profile(row.question,{intentSummary:row.intentSummary,primaryIntent:row.primaryIntent,targetStructure:row.targetStructure,requestedAxes:row.requestedAxes});
    const fit=compatibility(queryProfile,rowProfile);
    return {value:exact+base+semantic+fit.boost,blocked:fit.blocked,reason:fit.reason,queryProfile,rowProfile};
  }

  function find(question,limit=3){
    const q=clean(question);if(!q)return[];
    return read().map(row=>{const ranked=score(q,row);return {row,score:ranked.value,blocked:ranked.blocked,reason:ranked.reason,queryProfile:ranked.queryProfile,rowProfile:ranked.rowProfile}})
      .filter(x=>!x.blocked)
      .sort((a,b)=>b.score-a.score)
      .slice(0,Math.max(1,Math.min(5,Number(limit)||3)))
      .filter(x=>x.score>.20);
  }

  function formatForPrompt(question,limit=3){
    const rows=find(question,limit);"""
new_score="""  function score(q,row,options={}){
    const exact=compact(q)===String(row.questionKey||'')?3:0;
    const q3=grams(q,3),q4=grams(q,4),qw=words(q);
    const r3=grams(row.question,3),r4=grams(row.question,4),rw=words(row.question);
    const base=jac(q3,r3)*1.0+jac(q4,r4)*.72+overlap(qw,rw)*.42;
    const axes=[row.intentSummary,row.primaryIntent,row.targetStructure,...(row.requestedAxes||[]),...(row.positions||[])].join(' ');
    const semantic=jac(q3,grams(axes,3))*.30;
    const requestedCategory=explicitCategory(options.category);
    const storedCategory=rowCategory(row);
    if(requestedCategory&&storedCategory!==requestedCategory)return {value:-99,blocked:true,reason:'category_mismatch',queryProfile:profile(q,{category:requestedCategory}),rowProfile:row.structureProfile,exact:!!exact};
    const queryProfile=profile(q,{category:requestedCategory});
    const rowProfile=!row.structureProfile||Number(row.structureProfile.version||0)<2?profile(row.question,{intentSummary:row.intentSummary,primaryIntent:row.primaryIntent,targetStructure:row.targetStructure,requestedAxes:row.requestedAxes,category:storedCategory}):row.structureProfile;
    const fit=compatibility(queryProfile,rowProfile);
    return {value:exact+base+semantic+fit.boost,blocked:fit.blocked,reason:fit.reason,queryProfile,rowProfile,exact:!!exact};
  }

  function find(question,limit=3,options={}){
    const q=clean(question);if(!q)return[];
    const opts=typeof options==='string'?{category:options}:(options||{});
    return read().map(row=>{const ranked=score(q,row,opts);return {row,score:ranked.value,blocked:ranked.blocked,reason:ranked.reason,queryProfile:ranked.queryProfile,rowProfile:ranked.rowProfile,exact:ranked.exact}})
      .filter(x=>!x.blocked)
      .sort((a,b)=>b.score-a.score)
      .slice(0,Math.max(1,Math.min(5,Number(limit)||3)))
      .filter(x=>x.score>.20);
  }

  function formatForPrompt(question,limit=3,options={}){
    const rows=find(question,limit,options);"""
if old_score not in s: raise SystemExit('learning score/find block not found')
s=s.replace(old_score,new_score,1)
s=s.replace("      const learned=formatForPrompt(question,Math.min(3,limit));",
            "      const learned=formatForPrompt(question,Math.min(3,limit),{category:currentCategory()});",1)
s=s.replace("    version:4,","    version:5,",1)
s=s.replace("    compatibility,\n    formatForPrompt,",
            "    compatibility,\n    formatForPrompt,\n    categoryOf:rowCategory,",1)
s=s.replace("LUNEA User Spread Learning V1.4 loaded", "LUNEA User Spread Learning V1.5 loaded",1)
p.write_text(s)

# 3) Cloud sync: use category-qualified server/merge keys while payload keeps raw questionKey.
p=Path('lunea-learning-cloud-sync-v1.js'); s=p.read_text()
old="""  function questionKey(row){const k=clean(row?.questionKey);if(k)return k.slice(0,1024);return clean(row?.question).toLowerCase().replace(/[^0-9a-z가-힣]+/g,'').slice(0,1024)}
  const validRow=row=>!!row&&typeof row==='object'&&!!questionKey(row)&&Array.isArray(row.positions)&&row.positions.length>=2;"""
new="""  function rawQuestionKey(row){const k=clean(row?.questionKey);if(k)return k.slice(0,980);return clean(row?.question).toLowerCase().replace(/[^0-9a-z가-힣]+/g,'').slice(0,980)}
  function rowCategory(row){const direct=clean(row?.category).toUpperCase();if(['GENERAL','LOVE','INTIMACY','CAREER','STOCK'].includes(direct))return direct;const domain=clean(row?.structureProfile?.domain).toLowerCase();if(domain==='intimacy')return'INTIMACY';if(domain==='relationship')return'LOVE';if(domain==='stock')return'STOCK';if(['career','study','money'].includes(domain))return'CAREER';return'GENERAL'}
  function questionKey(row){const raw=rawQuestionKey(row);return `${rowCategory(row)}::${raw}`.slice(0,1024)}
  const validRow=row=>!!row&&typeof row==='object'&&!!rawQuestionKey(row)&&Array.isArray(row.positions)&&row.positions.length>=2;"""
if old not in s: raise SystemExit('cloud questionKey block not found')
s=s.replace(old,new,1)
old="""    payload.questionKey=clean(remote?.question_key||payload.questionKey).slice(0,1024);
    payload.source=remote?.source==='manual'||payload.source==='manual'?'manual':'ai_correction';"""
new="""    const remoteKey=clean(remote?.question_key);
    const sep=remoteKey.indexOf('::');
    if(!payload.category&&sep>0)payload.category=remoteKey.slice(0,sep).toUpperCase();
    if(!payload.questionKey){const raw=sep>0?remoteKey.slice(sep+2):remoteKey;payload.questionKey=clean(raw).slice(0,980)}
    payload.source=remote?.source==='manual'||payload.source==='manual'?'manual':'ai_correction';"""
if old not in s: raise SystemExit('cloud normalize block not found')
s=s.replace(old,new,1)
p.write_text(s)

# 4) AI preflight: category-aware retrieval + conservative 13-20 learned exact/strong reuse.
p=Path('lunea-ai-spread-preflight-v2.js'); s=p.read_text()
s=s.replace("  function getState(){ try{return state}catch{return null} }",
            "  function getState(){ try{return state}catch{return null} }\n  function activeCategory(){const c=String(getState()?.category||'GENERAL').trim().toUpperCase();return ['GENERAL','LOVE','INTIMACY','CAREER','STOCK'].includes(c)?c:'GENERAL'}",1)
s=s.replace("  function plainPositions(items){return (Array.isArray(items)?items:[]).map(stripNum).filter(Boolean).slice(0,12)}",
            "  function plainPositions(items){return (Array.isArray(items)?items:[]).map(stripNum).filter(Boolean).slice(0,20)}",1)
s=s.replace("      positions:(sp?.positions||[]).map(String).slice(0,12)",
            "      positions:(sp?.positions||[]).map(String).slice(0,20)",1)
s=s.replace("  function caseContext(question){",
            "  function caseContext(question){",1)
s=s.replace("      const learned=learning&&typeof learning.find==='function'?learning.find(question,3):[];",
            "      const learned=learning&&typeof learning.find==='function'?learning.find(question,3,{category:activeCategory()}):[];",1)
marker="""  async function smartDesign(question,options={}){
    const q=clean(question);
    if(!q||typeof baseDesign!=='function')return baseDesign?.call(this,q);
    const baseline=await baseDesign.call(this,q);"""
replacement="""  function learnedLongSpread(question){
    const learning=W.LUNEA_SPREAD_LEARNING_V1;
    if(!learning||typeof learning.find!=='function')return null;
    const hit=learning.find(question,1,{category:activeCategory()})?.[0];
    const row=hit?.row;
    const positions=Array.isArray(row?.positions)?row.positions.map(stripNum).filter(Boolean).slice(0,20):[];
    if(positions.length<13||positions.length>20)return null;
    if(!hit.exact&&Number(hit.score||0)<1.10)return null;
    return {
      spreadTitle:String(row.spreadTitle||`학습된 직접 배열 · ${positions.length}카드`),
      designRationale:`[LEARNED LONG SPREAD V5] · 사용자 확정 ${positions.length}장 구조 재사용 · category=${activeCategory()} · similarity=${Number(hit.score||0).toFixed(2)}`,
      layoutType:'learned-user-spread-v5',
      positions:positions.map((x,i)=>`${i+1}. ${x}`),
      _luneaPreflight:{version:2,intentSummary:'과거에 사용자가 직접 확정한 긴 배열과 높은 구조 유사도',primaryIntent:String(row.primaryIntent||'사용자 학습 배열 재사용'),targetStructure:String(row.targetStructure||'사용자 확정 구조'),requestedAxes:Array.isArray(row.requestedAxes)?row.requestedAxes.slice(0,20):positions,timeScope:'미지정',usedBaseline:false,usedLearnedLong:true,learnedMatches:[{id:row.id||'',score:Number(hit.score||0),question:String(row.question||''),spreadTitle:String(row.spreadTitle||''),profile:hit.rowProfile||row.structureProfile||{}}],casebookMatches:[],casebookStats:{learned:1,totalLearned:typeof learning.count==='function'?learning.count():0}}
    };
  }

  async function smartDesign(question,options={}){
    const q=clean(question);
    if(!q||typeof baseDesign!=='function')return baseDesign?.call(this,q);
    if(!options.regenerate){const learned=learnedLongSpread(q);if(learned){W.LUNEA_AI_SPREAD_PREFLIGHT_LAST={question:q,baseline:null,ai:null,result:safeBaseline(learned)};return learned}}
    const baseline=await baseDesign.call(this,q);"""
if marker not in s: raise SystemExit('preflight smartDesign marker not found')
s=s.replace(marker,replacement,1)
s=s.replace("  function textareaLines(){return String($('luneaSpreadPreviewPositions')?.value||'').split(/\\n+/).map(stripNum).filter(Boolean).slice(0,12)}",
            "  function textareaLines(){return String($('luneaSpreadPreviewPositions')?.value||'').split(/\\n+/).map(stripNum).filter(Boolean).slice(0,20)}",1)
s=s.replace("          question,\n          originalSpread:{spreadTitle:baseline.spreadTitle,positions:baseline.positions},",
            "          question,\n          category:activeCategory(),\n          originalSpread:{spreadTitle:baseline.spreadTitle,positions:baseline.positions},",1)
s=s.replace("W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null};",
            "W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,learnedLong:learnedLongSpread,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null};",1)
p.write_text(s)

# 5) Universal preview edits retain category when staged through success gate.
replace('lunea-universal-ai-opal-v20.js',
"            W.LUNEA_SPREAD_LEARNING_V1.record({\n              question,",
"            W.LUNEA_SPREAD_LEARNING_V1.record({\n              question,\n              category:String(getState()?.category||'GENERAL').trim().toUpperCase()||'GENERAL',")

# 6) Cache bust all modified runtime modules in both loader paths.
p=Path('lunea-structural-routing-v4.js'); s=p.read_text()
for old,new in [
 ('lunea-manual-structure-v1.js?v=104','lunea-manual-structure-v1.js?v=105'),
 ('lunea-user-spread-learning-v1.js?v=106','lunea-user-spread-learning-v1.js?v=107'),
 ('lunea-learning-cloud-sync-v1.js?v=102','lunea-learning-cloud-sync-v1.js?v=103'),
 ('lunea-ai-spread-preflight-v2.js?v=103','lunea-ai-spread-preflight-v2.js?v=104'),
 ('lunea-manual-limit20-v17.js?v=1704','lunea-manual-limit20-v17.js?v=1705'),
 ('lunea-universal-ai-opal-v20.js?v=2002','lunea-universal-ai-opal-v20.js?v=2003')]:
    n=s.count(old)
    if n!=2: raise SystemExit(f'loader expected 2 {old}, found {n}')
    s=s.replace(old,new)
p.write_text(s)

# 7) Existing tests contract updates.
for test in ['tests/spread-learning.test.mjs','tests/spread-learning-bridge.test.mjs']:
    p=Path(test); x=p.read_text(); x=x.replace('learning.version, 4','learning.version, 5'); p.write_text(x)
p=Path('tests/manual-category-preservation.test.mjs'); x=p.read_text().replace("lunea-manual-structure-v1\\.js\\?v=104","lunea-manual-structure-v1\\.js\\?v=105").replace("lunea-manual-limit20-v17\\.js\\?v=1704","lunea-manual-limit20-v17\\.js\\?v=1705"); p.write_text(x)
p=Path('tests/spread-learning-integration-contract.test.mjs'); x=p.read_text().replace("lunea-learning-cloud-sync-v1\\.js\\?v=102","lunea-learning-cloud-sync-v1\\.js\\?v=103"); p.write_text(x)

print('spread learning v5 patch applied')
