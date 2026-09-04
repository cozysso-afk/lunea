from pathlib import Path

# Harden the learning engine: profile v4 + structure-only guidance.
p=Path('lunea-user-spread-learning-v1.js')
s=p.read_text()
s=s.replace('LUNEA USER SPREAD LEARNING V1.6','LUNEA USER SPREAD LEARNING V1.7',1)

old="""    const explicitPair=/(?:\\ba\\s*(?:와|과|랑|\\/|·|vs|및|그리고)\\s*b\\b|a와b|a\\/b|a·b|두\\s*(?:사람|명|인연|상대|대상)|2\\s*(?:사람|명|인연|상대|대상)|대칭\\s*비교)/i.test(all);
"""
new="""    const role='(?:전남친|전여친|썸남|썸녀|소개팅남|소개팅녀|남친|여친|남자|여자|상대|후보\\s*\\d+)';
    const rolePair=new RegExp(`${role}\\\\s*(?:와|과|랑|\\\\/|·|vs|및|그리고)\\\\s*${role}`,'i').test(all);
    const latinPair=/\\b[a-z]\\s*(?:와|과|랑|\\/|·|vs|및|그리고)\\s*[a-z]\\b/i.test(all);
    const userTwoAlias=/(?:나와|내가|나는)\\s*[가-힣]{1,3}\\s*[·/]\\s*[가-힣]{1,3}/.test(q);
    const shortAliasPair=/(?:^|[\\s,])(?!나(?:와|과|랑))(?!내(?:가|와|랑))([가-힣]{1,2})(?:와|과|랑)\\s*([가-힣]{1,2})(?:에게|한테|의\\s*(?:관계|감정|미련)|\\s*(?:중|각각|둘))/i.test(q);
    const genericPair=/(?:두\\s*(?:사람|명|인연|상대|대상|남자|여자|전남친|전여친|후보)|2\\s*(?:사람|명|인연|상대|대상|남자|여자|후보)|둘\\s*중|대칭\\s*비교)/i.test(all);
    const explicitPair=/(?:\\ba\\s*(?:와|과|랑|\\/|·|vs|및|그리고)\\s*b\\b|a와b|a\\/b|a·b)/i.test(all)||latinPair||rolePair||userTwoAlias||shortAliasPair||genericPair;
"""
if old not in s: raise SystemExit('explicitPair block not found')
s=s.replace(old,new,1)
s=s.replace("    return {version:3,domain,target,modes:[...new Set(modes)].sort(),stage};","    return {version:4,domain,target,modes:[...new Set(modes)].sort(),stage};",1)
s=s.replace("Number(row.structureProfile.version||0)<3?profile", "Number(row.structureProfile.version||0)<4?profile",1)

old="""        requestedAxes:axes.length?axes:finalPos
"""
new="""        requestedAxes:axes.length?axes:[]
"""
if old not in s: raise SystemExit('manual requestedAxes fallback not found')
s=s.replace(old,new,1)

insert_after="""  function recordManual(payload={}){
    const finalPos=positions(payload.positions);
    const axes=positions(payload.axes);
    return record({
      question:payload.question,
      originalSpread:{spreadTitle:'',positions:[]},
      correctedSpread:{spreadTitle:clean(payload.spreadTitle)||'사용자 직접 배열',positions:finalPos},
      source:'manual',
      category:payload.category,
      meta:{
        category:payload.category,
        intentSummary:'사용자가 질문에 맞춰 처음부터 직접 설계한 최종 배열',
        primaryIntent:'사용자 직접 설계 배열',
        targetStructure:payload.symmetric?'두 사람 A/B 대칭 비교':'사용자 지정 대상 구조',
        requestedAxes:axes.length?axes:[]
      }
    });
  }
"""
helper="""

  const MODE_GUIDANCE={observation:'사실·관찰',perception:'인식·평가',thought:'생각·기억',feeling:'감정·끌림',action:'행동·연락',timing:'시기·타이밍',cause:'원인·계기',compare:'대칭 비교',choice:'선택지',advice:'조언·대응',outcome:'결과·흐름',general:'핵심 요구'};
  function guidanceAxes(row,rowProfile=null){
    const requested=positions(row?.requestedAxes||[]);
    const finalPos=positions(row?.positions||[]);
    if(requested.length&&!samePositions(requested,finalPos))return requested.slice(0,10);
    const p=rowProfile||row?.structureProfile||{};
    const out=[];
    for(const mode of Array.isArray(p.modes)?p.modes:[]){const label=MODE_GUIDANCE[mode];if(label&&!out.includes(label))out.push(label)}
    if(!out.length)out.push('핵심 요구');
    return out.slice(0,10);
  }
"""
if insert_after not in s: raise SystemExit('recordManual full block not found')
s=s.replace(insert_after,insert_after+helper,1)

old="""    const axes=[row.intentSummary,row.primaryIntent,row.targetStructure,...(row.requestedAxes||[]),...(row.positions||[])].join(' ');
"""
new="""    const axes=[row.intentSummary,row.primaryIntent,row.targetStructure,...(row.requestedAxes||[])].join(' ');
"""
if old not in s: raise SystemExit('score axes block not found')
s=s.replace(old,new,1)
s=s.replace("Number(row.structureProfile.version||0)<2?profile(row.question", "Number(row.structureProfile.version||0)<4?profile(row.question",1)

start=s.index('  function formatForPrompt(question,limit=3,options={}){')
end=s.index('\n  function installCasebookBridge(){',start)
new_format="""  function formatForPrompt(question,limit=3,options={}){
    const rows=find(question,limit,options);
    if(!rows.length)return '사용자 교정 사례 없음';
    return rows.map((x,i)=>{
      const r=x.row;
      const p=x.rowProfile||r.structureProfile||{};
      const structure=[p.domain,p.target,...(p.modes||[]),p.stage].filter(Boolean).join(' · ');
      const axes=guidanceAxes(r,p);
      return `[사용자 학습 구조 참고 ${i+1} · 구조 유사도 ${x.score.toFixed(2)}]\\n질문 구조: ${structure||'미분류'}\\n대상 구조 메모: ${clean(r.targetStructure)||'미지정'}\\n핵심 의도 메모: ${clean(r.primaryIntent)||'미지정'}\\n참고 가능한 요구축: ${axes.join(' / ')}`;
    }).join('\\n\\n');
  }
"""
s=s[:start]+new_format+s[end:]

old="""      return `[최우선 · 이 사용자가 직접 고친 과거 정답]\\n아래 사용자 교정 사례가 현재 질문과 충분히 유사하면 정적 사례보다 우선 참고한다.\\n질문 구조가 다르면 포지션 문구를 그대로 복사하지 않는다.\\n\\n${learned}\\n\\n[정적 LUNEA 사례집]\\n${staticCases}`;
"""
new="""      return `[사용자가 확정한 과거 구조 참고]\\n아래에는 과거 질문 원문·배열명·포지션 원문·카드 수를 제공하지 않는다. 현재 질문의 구조와 겹치는 요구축만 참고한다.\\n\\n${learned}\\n\\n[정적 LUNEA 사례집]\\n${staticCases}`;
"""
if old not in s: raise SystemExit('casebook bridge wording not found')
s=s.replace(old,new,1)

s=s.replace('    version:5,\n', '    version:6,\n',1)
s=s.replace('    formatForPrompt,\n    upgradeRow,', '    formatForPrompt,\n    guidanceAxes,\n    upgradeRow,',1)
s=s.replace('LUNEA User Spread Learning V1.5 loaded', 'LUNEA User Spread Learning V1.7 loaded',1)
p.write_text(s)

# Harden preflight: structured learning guidance only, never prior position/count/question text.
p=Path('lunea-ai-spread-preflight-v2.js')
s=p.read_text()
old="""      const learnedMatches=learned.map(x=>({
        id:x.row?.id||'',score:Number(x.score||0),exact:!!x.exact,question:String(x.row?.question||''),spreadTitle:String(x.row?.spreadTitle||''),category:String(x.row?.category||activeCategory()),source:String(x.row?.source||''),targetStructure:String(x.row?.targetStructure||''),requestedAxes:Array.isArray(x.row?.requestedAxes)?x.row.requestedAxes.slice(0,20):[],positions:Array.isArray(x.row?.positions)?x.row.positions.slice(0,20):[],profile:x.rowProfile||x.row?.structureProfile||{}
      }));
      const learnedText=learnedMatches.length?learnedMatches.map((x,i)=>{
        const axes=x.requestedAxes.length?x.requestedAxes:x.positions;
        return `[사용자 학습 참고 ${i+1} · 유사도 ${x.score.toFixed(2)} · ${x.category}]\\n과거 질문: ${x.question}\\n당시 구조명: ${x.spreadTitle}\\n대상 구조: ${x.targetStructure||'미지정'}\\n참고 가능한 축: ${axes.join(' / ')||'없음'}\\n당시 카드 수: ${x.positions.length}`;
      }).join('\\n\\n'):'사용자 학습 사례 없음';
"""
new="""      const learnedMatches=learned.map(x=>{
        const profile=x.rowProfile||x.row?.structureProfile||{};
        const axes=typeof learning?.guidanceAxes==='function'?learning.guidanceAxes(x.row,profile):[];
        return {id:x.row?.id||'',score:Number(x.score||0),exact:!!x.exact,category:String(x.row?.category||activeCategory()),source:String(x.row?.source||''),targetStructure:String(x.row?.targetStructure||''),guidanceAxes:axes.slice(0,10),profile};
      });
      const learnedText=learnedMatches.length?learnedMatches.map((x,i)=>{
        const p=x.profile||{};
        const structure=[p.domain,p.target,...(Array.isArray(p.modes)?p.modes:[]),p.stage].filter(Boolean).join(' · ');
        return `[사용자 학습 구조 참고 ${i+1} · 유사도 ${x.score.toFixed(2)} · ${x.category}]\\n구조 프로필: ${structure||'미분류'}\\n대상 구조 메모: ${x.targetStructure||'미지정'}\\n참고 가능한 요구축: ${x.guidanceAxes.join(' / ')||'핵심 요구'}`;
      }).join('\\n\\n'):'사용자 학습 사례 없음';
"""
if old not in s: raise SystemExit('preflight learned block not found')
s=s.replace(old,new,1)
s=s.replace("'대상 구조 / 필요한 축 / 대칭 방식 / 카드 수 경향'", "'대상 구조 / 필요한 축 / 대칭 방식 / 복잡도'",1)
needle="""- 과거 학습 배열은 '정답 복사본'이 아니다. 현재 질문에 필요한 축만 선택하고 불필요한 축은 버린다.\\n- 질문이 길고 여러 요구를 포함하면 먼저 의미 단위로 쪼개 requestedAxes를 만든 뒤 포지션에 배치한다. 명시된 요구를 카드 수 제한 때문에 임의 삭제하지 않는다.\\n"""
replacement="""- 과거 학습 배열은 '정답 복사본'이 아니다. 현재 질문에 필요한 축만 선택하고 불필요한 축은 버린다.\\n- 과거 학습의 질문 원문·포지션 원문·배열명·카드 수는 현재 배열 설계 근거로 사용하지 않는다. 카드 수는 오직 현재 질문의 requestedAxes와 구조 복잡도로 결정한다.\\n- 질문이 길고 여러 요구를 포함하면 먼저 의미 단위로 쪼개 requestedAxes를 만든 뒤 포지션에 배치한다. 명시된 요구를 카드 수 제한 때문에 임의 삭제하지 않는다.\\n"""
if needle not in s: raise SystemExit('preflight prompt learning rule block not found')
s=s.replace(needle,replacement,1)
p.write_text(s)

# Cache bust runtime modules.
p=Path('lunea-structural-routing-v4.js')
s=p.read_text()
if s.count('lunea-user-spread-learning-v1.js?v=108')!=2: raise SystemExit('unexpected learning cache count')
if s.count('lunea-ai-spread-preflight-v2.js?v=105')!=2: raise SystemExit('unexpected preflight cache count')
s=s.replace('lunea-user-spread-learning-v1.js?v=108','lunea-user-spread-learning-v1.js?v=109')
s=s.replace('lunea-ai-spread-preflight-v2.js?v=105','lunea-ai-spread-preflight-v2.js?v=106')
p.write_text(s)

# Exact version/cache contracts: v4 profiles, new runtime cache keys.
p=Path('tests/cloud-profile-reprofiling-v3.test.mjs')
s=p.read_text()
s=s.replace("legacy v2 cloud payloads to v3 before merge","legacy cloud payloads to v4 before merge")
s=s.replace("assert.equal(upgraded.structureProfile.version,3);","assert.equal(upgraded.structureProfile.version,4);")
s=s.replace("remote-newer merge still returns v3 timing/cause/outcome profiles","remote-newer merge returns v4 timing/cause/outcome profiles")
s=s.replace("assert.equal(p.version,3);","assert.equal(p.version,4);")
s=s.replace("loader cache keys force v3 learning and cloud sync code onto clients","loader cache keys force v4 learning and cloud sync code onto clients")
s=s.replace("lunea-user-spread-learning-v1\\.js\\?v=108","lunea-user-spread-learning-v1\\.js\\?v=109")
p.write_text(s)

p=Path('tests/spread-learning-integration-contract.test.mjs')
s=p.read_text()
s=s.replace("lunea-ai-spread-preflight-v2\\.js\\?v=105","lunea-ai-spread-preflight-v2\\.js\\?v=106")
p.write_text(s)
print('patched learning retrieval hardening v7')
