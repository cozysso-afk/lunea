from pathlib import Path
import re

p=Path('lunea-ai-spread-preflight-v2.js')
s=p.read_text()

old="""  function normalizePositions(items){
    const out=[];
    for(const x of Array.isArray(items)?items:[]){
      const t=stripNum(x); if(!t||out.includes(t))continue; out.push(t);
    }
    return out.slice(0,12).map((x,i)=>`${i+1}. ${x}`);
  }
"""
new="""  function normalizePositions(items,max=20){
    const out=[];
    for(const x of Array.isArray(items)?items:[]){
      const t=stripNum(x); if(!t||out.includes(t))continue; out.push(t);
    }
    const cap=Math.max(2,Math.min(20,Number(max)||20));
    return out.slice(0,cap).map((x,i)=>`${i+1}. ${x}`);
  }
"""
if old not in s: raise SystemExit('normalizePositions marker missing')
s=s.replace(old,new,1)

marker="""  function caseContext(question){
"""
helpers=r"""  function questionSegments(question){
    const q=clean(question);
    if(!q)return[];
    let prepared=q
      .replace(/\r?\n+/g,'\n')
      .replace(/\s+(?:그리고|또한|추가로|마지막으로|그다음(?:으로)?|한편)\s+/g,'\n');
    let chunks=prepared.split(/\n+|[?？!！;；]+/).map(clean).filter(Boolean);
    const expanded=[];
    for(const chunk of chunks){
      if(chunk.length>120&&chunk.includes(','))expanded.push(...chunk.split(/,\s*/).map(clean).filter(Boolean));
      else expanded.push(chunk);
    }
    if(expanded.length<2&&q.length>=90){
      chunks=q.split(/,\s*|\s+(?:그리고|또한|추가로|마지막으로|그다음(?:으로)?|반면|반대로)\s+/).map(clean).filter(Boolean);
    }else chunks=expanded;
    const out=[],seen=new Set();
    for(let item of chunks){
      item=clean(item.replace(/^[-*•·\s]+/,'').replace(/^\d{1,2}\s*[.)]\s*/,''));
      item=item.replace(/[?？]+$/,'').trim();
      if(item.length<4)continue;
      const key=item.toLowerCase().replace(/[^0-9a-z가-힣]+/g,'');
      if(!key||seen.has(key))continue;
      seen.add(key);out.push(item.slice(0,120));
      if(out.length>=20)break;
    }
    return out;
  }
  function baselineLooksGeneric(sp){
    const pos=plainPositions(sp?.positions||[]);
    if(!pos.length)return true;
    const generic=/^(현재\s*(?:상황|흐름)|숨은\s*변수|핵심\s*조언|미래\s*(?:결과|흐름)|전체\s*흐름|과거|현재|미래)$/;
    return pos.filter(x=>generic.test(clean(x))).length>=Math.min(2,pos.length);
  }
  function detailedFallback(question,baseline=null,reason='fallback'){
    const segments=questionSegments(question);
    if(segments.length<2)return baseline;
    const basePos=plainPositions(baseline?.positions||[]);
    const needsFallback=!basePos.length||(segments.length>=4&&(basePos.length<Math.min(segments.length,4)||baselineLooksGeneric(baseline)));
    if(!needsFallback)return baseline;
    const positions=segments.slice(0,20).map((x,i)=>`${i+1}. ${x}`);
    return {
      ...(baseline||{}),
      spreadTitle:String(baseline?.spreadTitle||'질문 분해 맞춤 배열'),
      designRationale:`[QUESTION SEGMENT FALLBACK V6] · 상세 질문 요구축 ${positions.length}개 보존 · reason=${reason}`,
      layoutType:'question-segment-fallback-v6',
      positions,
      _luneaPreflight:{
        version:2,category:activeCategory(),intentSummary:'상세 질문을 의미 단위로 분해해 누락 없이 배열화',primaryIntent:'질문 원문의 명시 요구축 보존',targetStructure:'질문 분해 fallback',requestedAxes:segments.slice(0,20),timeScope:'미지정',usedBaseline:false,usedQuestionSegments:true,casebookMatches:[],learnedMatches:[],casebookStats:{}
      }
    };
  }

"""
if marker not in s: raise SystemExit('caseContext marker missing')
s=s.replace(marker,helpers+marker,1)

pattern=r"  function caseContext\(question\)\{[\s\S]*?\n  \}\n  function schema\(\)\{"
replacement=r"""  function caseContext(question){
    try{
      const book=W.LUNEA_QUESTION_CASEBOOK_V1;
      const learning=W.LUNEA_SPREAD_LEARNING_V1;
      const learned=learning&&typeof learning.find==='function'?learning.find(question,3,{category:activeCategory()}):[];
      const learnedMatches=learned.map(x=>({
        id:x.row?.id||'',score:Number(x.score||0),exact:!!x.exact,question:String(x.row?.question||''),spreadTitle:String(x.row?.spreadTitle||''),category:String(x.row?.category||activeCategory()),source:String(x.row?.source||''),targetStructure:String(x.row?.targetStructure||''),requestedAxes:Array.isArray(x.row?.requestedAxes)?x.row.requestedAxes.slice(0,20):[],positions:Array.isArray(x.row?.positions)?x.row.positions.slice(0,20):[],profile:x.rowProfile||x.row?.structureProfile||{}
      }));
      const learnedText=learnedMatches.length?learnedMatches.map((x,i)=>{
        const axes=x.requestedAxes.length?x.requestedAxes:x.positions;
        return `[사용자 학습 참고 ${i+1} · 유사도 ${x.score.toFixed(2)} · ${x.category}]\n과거 질문: ${x.question}\n당시 구조명: ${x.spreadTitle}\n대상 구조: ${x.targetStructure||'미지정'}\n참고 가능한 축: ${axes.join(' / ')||'없음'}\n당시 카드 수: ${x.positions.length}`;
      }).join('\n\n'):'사용자 학습 사례 없음';
      const text=book&&typeof book.formatForPrompt==='function'?book.formatForPrompt(question,4):'관련 사례 없음';
      const matches=book&&typeof book.find==='function'?book.find(question,4):[];
      return {text,matches,learnedText,learnedMatches,stats:{families:book?.familyCount||0,utterances:book?.utteranceCount||0,learned:learned.length,totalLearned:typeof learning?.count==='function'?learning.count():0}};
    }catch(e){console.warn('[LUNEA Preflight V2] casebook lookup failed',e)}
    return {text:'관련 사례 없음',learnedText:'사용자 학습 사례 없음',matches:[],learnedMatches:[],stats:{families:0,utterances:0,learned:0,totalLearned:0}};
  }
  function schema(){"""
s2,n=re.subn(pattern,replacement,s,count=1)
if n!=1: raise SystemExit('caseContext replacement failed')
s=s2

old_prompt="""[이 질문과 가까운 LUNEA 내부 사례집]\\n${cases.text}\\n\\n사례는 정답을 복사하라는 뜻이 아니다. 사례의 '대상 구조 / 보존할 축 / 금지 오분류'를 참고해 현재 질문을 독립적으로 판정한다."""
new_prompt="""[이 질문과 가까운 LUNEA 내부 사례집]\\n${cases.text}\\n\\n[사용자가 과거에 확정한 학습 사례 — 복사 금지]\\n${cases.learnedText}\\n\\n사례는 정답 템플릿이 아니다. 먼저 현재 질문을 독립적으로 분류하고, 과거 사례에서는 현재 질문과 실제로 겹치는 '대상 구조 / 필요한 축 / 대칭 방식 / 카드 수 경향'만 취사선택한다. 과거 포지션 문구나 카드 수를 통째로 따라 하지 않는다."""
if old_prompt not in s: raise SystemExit('prompt learning marker missing')
s=s.replace(old_prompt,new_prompt,1)

old_rules="""- 투자 질문은 가격 예언보다 근거·반증·리스크·판단 기준을 다룬다.\\n- 2~12장. 복잡도 때문에 필요한 경우만 늘리고 같은 뜻 반복은 금지한다."""
new_rules="""- 투자 질문은 가격 예언보다 근거·반증·리스크·판단 기준을 다룬다.\\n- 과거 학습 배열은 '정답 복사본'이 아니다. 현재 질문에 필요한 축만 선택하고 불필요한 축은 버린다.\\n- 질문이 길고 여러 요구를 포함하면 먼저 의미 단위로 쪼개 requestedAxes를 만든 뒤 포지션에 배치한다. 명시된 요구를 카드 수 제한 때문에 임의 삭제하지 않는다.\\n- 기본은 2~12장. 다만 현재 질문 자체에 서로 다른 명시 요구축이 13개 이상 분명한 경우에만 최대 20장까지 허용한다. 과거에 15장/20장을 썼다는 이유만으로 긴 배열을 재사용하지 않는다."""
if old_rules not in s: raise SystemExit('prompt card limit marker missing')
s=s.replace(old_rules,new_rules,1)

s=s.replace("out._luneaPreflight={\n      version:2,","out._luneaPreflight={\n      version:2,\n      category:activeCategory(),",1)

pattern=r"\n  function learnedLongSpread\(question\)\{[\s\S]*?\n  \}\n\n  async function smartDesign\(question,options=\{\}\)\{[\s\S]*?\n  \}\n\n  function addStyles\(\)\{"
replacement=r"""
  async function smartDesign(question,options={}){
    const q=clean(question);
    if(!q)return typeof baseDesign==='function'?baseDesign.call(this,q):null;
    let baseline=null,baseError=null;
    if(typeof baseDesign==='function'){
      try{baseline=await baseDesign.call(this,q)}catch(err){baseError=err;console.warn('[LUNEA Preflight V2] base spread failed; trying question segmentation',err)}
    }
    const segmented=detailedFallback(q,baseline,baseError?'base_error':'baseline_check');
    const editorBase=segmented||baseline||{spreadTitle:'질문 분해 맞춤 배열',designRationale:'fallback seed',layoutType:'question-segment-seed',positions:questionSegments(q).map((x,i)=>`${i+1}. ${x}`)};
    const ai=await askEditor(q,editorBase,options);
    let result=merge(editorBase,ai);
    if(!result||!Array.isArray(result.positions)||result.positions.length<2)result=detailedFallback(q,baseline,'ai_invalid');
    if(!result||!Array.isArray(result.positions)||result.positions.length<2){if(baseError)throw baseError;return baseline}
    if(!ai&&segmented)result=segmented;
    W.LUNEA_AI_SPREAD_PREFLIGHT_LAST={question:q,baseline:safeBaseline(baseline),ai,result:safeBaseline(result)};
    return result;
  }

  function addStyles(){"""
s2,n=re.subn(pattern,replacement,s,count=1)
if n!=1: raise SystemExit('learnedLong/smartDesign replacement failed')
s=s2

# expose non-paid fallback helpers for regression diagnostics
old="""    W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null};
"""
new="""    W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null,segmentQuestion:questionSegments,fallbackSpread:detailedFallback};
"""
if old not in s: raise SystemExit('public API marker missing')
s=s.replace(old,new,1)

p.write_text(s)

# cache bust preflight loader on both parser paths
lp=Path('lunea-structural-routing-v4.js')
ls=lp.read_text()
if 'lunea-ai-spread-preflight-v2.js?v=104' not in ls: raise SystemExit('preflight loader 104 missing')
ls=ls.replace('lunea-ai-spread-preflight-v2.js?v=104','lunea-ai-spread-preflight-v2.js?v=105')
lp.write_text(ls)

# replace the old direct-copy runtime test with guidance + fallback runtime tests
tp=Path('tests/spread-learning-v5-runtime.test.mjs')
t=tp.read_text()
pat=r"test\('preflight resolves only strong 13-20 learned structures and preserves category filter',[\s\S]*?\n\}\);\n\ntest\('cloud sync key separates same question by category'"
rep=r"""test('preflight uses learned memory as classified guidance instead of direct spread copying', () => {
  const source=read('lunea-ai-spread-preflight-v2.js');
  assert.doesNotMatch(source,/learnedLongSpread|LEARNED LONG SPREAD V5/,'learned long spreads must not bypass AI classification');
  assert.match(source,/사용자가 과거에 확정한 학습 사례 — 복사 금지/);
  assert.match(source,/과거 포지션 문구나 카드 수를 통째로 따라 하지 않는다/);
  assert.match(source,/cases\.learnedText/);
});

test('detailed question fallback splits explicit requirements when normal spread design is insufficient', () => {
  let source=read('lunea-ai-spread-preflight-v2.js').replace(/\n\}\)\(\);\s*$/, '\nwindow.__auditSegments=questionSegments;window.__auditFallback=detailedFallback;\n})();');
  const state={category:'LOVE'};
  const window={addEventListener(){}};window.window=window;
  vm.runInNewContext(source,{window,state,localStorage:{getItem(){return null}},document:{readyState:'loading',getElementById(){return null},addEventListener(){},head:{appendChild(){}},body:{appendChild(){},classList:{add(){},remove(){}}}},console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},fetch(){throw new Error('network should not run')},JSON,String,Array,Number,Error,Set});
  const q='A가 지금 나를 어떻게 생각하는지, 그리고 아직 감정이 남았는지, 추가로 실제 연락 의도가 있는지, 마지막으로 연락을 막는 현실적 이유가 무엇인지 알고 싶다';
  const seg=window.__auditSegments(q);
  assert.ok(seg.length>=4,`expected >=4 semantic segments, got ${seg.length}`);
  const base={spreadTitle:'기본',positions:['현재 상황','숨은 변수','핵심 조언']};
  const fallback=window.__auditFallback(q,base,'test');
  assert.equal(fallback.layoutType,'question-segment-fallback-v6');
  assert.ok(fallback.positions.length>=4&&fallback.positions.length<=20);
  assert.equal(fallback._luneaPreflight.category,'LOVE');
});

test('cloud sync key separates same question by category'"""
t2,n=re.subn(pat,rep,t,count=1)
if n!=1: raise SystemExit('runtime test replacement failed')
tp.write_text(t2)

# strengthen integration contract around guidance/fallback and loader cache
ip=Path('tests/spread-learning-integration-contract.test.mjs')
i=ip.read_text()
i=i.replace("assert.match(preflight, /totalLearned/, 'AI preflight should carry cumulative learning stats');","assert.match(preflight, /totalLearned/, 'AI preflight should carry cumulative learning stats');\nassert.match(preflight, /learnedText/, 'AI preflight must expose learned cases as classified guidance');\nassert.doesNotMatch(preflight, /learnedLongSpread|LEARNED LONG SPREAD V5/, 'learned layouts must not bypass classification by direct copy');\nassert.match(preflight, /QUESTION SEGMENT FALLBACK V6/, 'detailed questions need a no-extra-API segmentation fallback');\nassert.match(loader, /lunea-ai-spread-preflight-v2\\.js\\?v=105/, 'preflight cache must be bumped for V6 behavior');")
ip.write_text(i)

print('spread learning v6 guidance + segmentation patch applied')
