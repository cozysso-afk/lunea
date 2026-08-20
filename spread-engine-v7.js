'use strict';
/* LUNEA Spread Engine V7
   - intent-first question parsing
   - broad domain routing
   - explicit multi-slot preservation
   - 3+ candidate generation and local scoring
   - recent-spread semantic diversity
   - Gemini structured-output candidates (optional)
   - fixed spreads / secure card draw untouched
*/
(() => {
  const W = window;
  const MEMORY_KEY = 'LUNEA_SPREAD_MEMORY_V7';
  const MAX_MEMORY = 36;

  const V7_ARCHS = {
    evidence: {label:'증거 ↔ 반증 판별형', hint:'가설을 지지하는 단서와 반대 단서를 같이 놓고 최종 판단'},
    perception: {label:'인식 지도형', hint:'상대가 각각의 대상을 어떻게 보고 있는지 1:1로 추적'},
    mirror: {label:'양쪽 시점 대칭형', hint:'두 사람 또는 두 선택지를 같은 기준으로 대칭 비교'},
    layers: {label:'겉·속·행동 분리형', hint:'표면 판단, 내면 감정, 실제 행동을 분리'},
    threshold: {label:'행동 임계점형', hint:'마음이 실제 행동으로 넘어가는 문턱과 촉발 조건을 추적'},
    trigger: {label:'트리거 체인형', hint:'잠복 상태에서 실제 사건까지 이어지는 방아쇠를 순서대로 추적'},
    timeline: {label:'전조→행동→후속형', hint:'시간순으로 전조, 첫 움직임, 후속 반응을 배치'},
    causal: {label:'원인→증폭→전환형', hint:'시작 원인, 악화/강화 요인, 흐름을 바꾸는 지점을 추적'},
    fork: {label:'A/B 분기형', hint:'두 선택의 이득·대가·후회를 같은 기준으로 비교'},
    matrix: {label:'현실 판단 매트릭스형', hint:'욕구, 현실성, 비용, 리스크, 결정 기준을 교차 검토'},
    loop: {label:'반복 패턴 해부형', hint:'되풀이되는 관계/행동의 고리와 끊는 지점을 분석'},
    resource: {label:'자원 ↔ 리스크형', hint:'쓸 수 있는 강점과 소모되는 비용/위험을 같이 본다'},
    blindspot: {label:'맹점 교정형', hint:'이미 보는 것, 놓치는 것, 오판 가능성을 분리'},
    social: {label:'관계 역학형', hint:'나-상대-주변 맥락에서 관계의 실제 역학을 본다'},
    fit: {label:'적합도 검증형', hint:'끌림과 현실 적합성을 분리해 조건별로 본다'},
    decision: {label:'결정 검증형', hint:'행동했을 때와 하지 않았을 때의 차이를 비교'},
    wellbeing: {label:'회복 자원형', hint:'의학적 진단이 아니라 체감 상태·생활 부담·회복 자원을 본다'}
  };

  const CONCEPTS = [
    ['my_status','내 근황',/(내\s*)?(근황|요즘\s*(생활|상태|일상)|어떻게\s*지내|뭐하고\s*지내)/i],
    ['my_emotion','내 감정',/(내\s*)?(감정|심정|마음\s*상태|마음이\s*어떤)/i],
    ['my_romance','내 이성관계',/(내\s*)?(이성\s*관계|연애\s*상태|새\s*사람|새로운\s*사람|썸|남자\s*관계|여자\s*관계)/i],
    ['their_feeling','상대의 감정',/(상대|그|그녀|그사람).*(감정|마음|속마음|미련|호감|그리움)/i],
    ['their_thought','상대의 생각',/(상대|그|그녀|그사람).*(생각|판단|인식|평가|추측|짐작)/i],
    ['their_action','상대의 행동',/(상대|그|그녀|그사람).*(행동|움직임|반응|태도)/i],
    ['contact','연락',/(연락|카톡|문자|전화|디엠|dm)/i],
    ['reunion','재회',/(재회|다시\s*만나|다시\s*사귀|관계\s*회복|돌아오)/i],
    ['new_connection','새 인연',/(새\s*인연|새로운\s*인연|새\s*연애|새로운\s*연애|새\s*사람이\s*들어)/i],
    ['profile_photo','카톡 프사',/(카톡\s*)?(프사|프로필\s*사진|프로필사진)/i],
    ['profile_music','카톡 프뮤',/(카톡\s*)?(프뮤|프로필\s*(뮤직|음악)|프로필음악)/i],
    ['status_message','카톡 상메',/(카톡\s*)?(상메|상태\s*메시지|상태메시지)/i],
    ['instagram_story','인스타 스토리',/((인스타|인스타그램).*(스토리))|(스토리\s*(봤|확인|열어))/i],
    ['social_post','SNS 게시물',/(인스타|sns|피드|게시물|릴스|스토리)/i],
    ['appearance','외모/인상',/(외모|얼굴|인상|분위기|아우라|예뻐|잘생|매력)/i],
    ['body','몸매/피지컬',/(몸매|체형|피지컬|몸|실루엣)/i],
    ['intimacy','신체적 궁합',/(속궁합|잠자리|섹스|성적\s*궁합|신체적\s*(궁합|끌림|밀착)|성적\s*끌림)/i],
    ['friendship','친구/지인 관계',/(친구|지인|동료|모임|인간관계|대인관계)/i],
    ['family','가족 관계',/(가족|부모|엄마|아빠|형제|자매|남매|친척)/i],
    ['exam','시험/합격',/(시험|합격|공시|자격증|수능|면접\s*시험|필기\s*시험)/i],
    ['study','공부/학습',/(공부|학습|강의|복습|회독|진도|성적)/i],
    ['career','직장/커리어',/(직장|회사|커리어|직업|업무|상사|팀장|평판|승진|인사)/i],
    ['job_change','이직/퇴사',/(이직|퇴사|전직|직장\s*옮|회사\s*옮)/i],
    ['job_search','취업/면접',/(취업|구직|채용|면접|입사)/i],
    ['money','돈/재물',/(돈|재물|금전|현금|수입|지출|재정|월급|매출)/i],
    ['debt','부채/상환',/(대출|빚|부채|상환|이자|카드값)/i],
    ['stock','투자/주식',/(주식|종목|매수|매도|익절|손절|코인|투자|보유)/i],
    ['business','사업/프로젝트',/(사업|창업|프로젝트|서비스|제품|고객|매출|런칭|출시)/i],
    ['move','이사/주거',/(이사|집\s*옮|주거|아파트|전세|월세|매매\s*집|집\s*계약|주택\s*계약|부동산|매물)/i],
    ['travel','여행/이동',/(여행|휴가|출장|해외|국내여행|출국|입국)/i],
    ['purchase','구매/결제',/(살까|구매|결제|사도|바꿀까|기기|제품)/i],
    ['self','내 심리/상태',/(내\s*(심리|마음|상태|무의식)|나는\s*왜|내가\s*왜|자기\s*이해|자존감)/i],
    ['health','컨디션/건강',/(건강|컨디션|피로|수면|회복|몸상태|스트레스)/i],
    ['result','결과/전망',/(결과|어떻게\s*될|앞으로|전망|성공|가능성)/i],
    ['cause','원인/이유',/(왜|이유|원인|때문|의도)/i]
  ].map(([id,label,re])=>({id,label,re}));

  const STOP_SLOT = /^(그|그가|그는|상대|상대가|내가|나는|그리고|또|또는|혹은|그런데|근데)$/i;

  function normalizeQuestion(input){
    return String(input||'')
      .normalize('NFKC')
      .replace(/봣/g,'봤').replace(/보앗/g,'보았')
      .replace(/들엇/g,'들었').replace(/햇/g,'했')
      .replace(/됫/g,'됐').replace(/댓/g,'됐')
      .replace(/잇/g,'있').replace(/없엇/g,'없었')
      .replace(/됬/g,'됐').replace(/어떻해/g,'어떻게')
      .replace(/프뮤직/g,'프뮤').replace(/프로필뮤직/g,'프로필 뮤직')
      .replace(/\s+/g,' ').trim();
  }

  function conceptHits(q){
    return CONCEPTS.filter(c=>c.re.test(q)).map(c=>({id:c.id,label:c.label}));
  }

  function relationContext(q){
    if(/헤어진|전남친|전여친|전애인|이별한|구남친|구여친|전\s*연인|ex\b/i.test(q))return'ex';
    if(/남친|여친|애인|연인|배우자|남편|아내/i.test(q))return'partner';
    if(/짝사랑|썸남|썸녀|썸|호감\s*있는/i.test(q))return'crush';
    if(/친구|지인|동료|상사|팀장/i.test(q))return'social';
    if(/가족|부모|엄마|아빠|형제|자매/i.test(q))return'family';
    return'unspecified';
  }

  function extractExplicitSlots(q, targets){
    const found=[];
    const push=(s)=>{
      s=String(s||'').replace(/^[\s·,;:+-]+|[\s·,;:+-]+$/g,'').trim();
      s=s.replace(/^(그리고|또|및|혹은|또는)\s*/,'').trim();
      if(!s||s.length<2||s.length>42||STOP_SLOT.test(s))return;
      if(!found.some(x=>semanticTextSimilarity(x,s)>.76))found.push(s);
    };
    // Slash/semicolon delimiters are treated as strong user-declared slots.
    if(/[\/；;]/.test(q)){
      q.split(/[\/；;]/).forEach(seg=>{
        let s=seg.trim();
        // If the first segment contains a perception verb, keep only the requested object after it.
        const m=s.match(/(?:추측(?:하는|하나|할까)|짐작(?:하는|하나)|생각(?:하는|하나)|어떻게\s*(?:보는|볼|생각하는|판단하는|평가하는))\s+(.+)$/i);
        if(m&&m[1])s=m[1].trim();
        s=s.replace(/^(헤어진\s*)?(그\s*사람|그|그가|그는|상대|상대가|상대방이)\s*/,'');
        s=s.replace(/^(추측하는|생각하는|보는|느끼는|알고\s*있는)\s*/,'');
        s=s.replace(/[?.!]+$/g,'').trim();
        push(s);
      });
    }
    // Strong concept labels are safer than guessing noun chunks.
    targets.forEach(t=>{
      if(['my_status','my_emotion','my_romance','new_connection','profile_photo','profile_music','status_message','instagram_story','appearance','body','exam','study','career','job_change','money','debt','stock','business','move','travel','purchase'].includes(t.id)) push(t.label);
    });
    return found.slice(0,7);
  }

  function detectDomains(q){
    const d=[];
    const add=(x)=>{if(!d.includes(x))d.push(x)};
    if(/속궁합|잠자리|섹스|성적\s*(궁합|끌림)|신체적\s*(궁합|밀착)/i.test(q))add('intimacy');
    if(/외모|얼굴|인상|분위기|아우라|몸매|체형|피지컬|실루엣|매력/i.test(q))add('appearance');
    if(/전남친|전여친|전애인|헤어진|재회|연락|썸|남친|여친|연인|호감|속마음|좋아하|미련|그리워|새\s*인연|새로운\s*인연|새\s*연애/i.test(q))add('love');
    if(/친구|지인|동료|모임|인간관계|대인관계/i.test(q))add('social');
    if(/가족|부모|엄마|아빠|형제|자매|친척/i.test(q))add('family');
    if(/시험|합격|공시|자격증|공부|학습|강의|복습|회독|성적/i.test(q))add('exam');
    if(/이직|퇴사|취업|면접|직장|회사|커리어|직업|업무|승진|인사/i.test(q))add('career');
    if(/주식|매수|매도|익절|손절|코인|투자|종목/i.test(q))add('stock');
    if(/사업|창업|프로젝트|서비스|제품|런칭|출시|고객|매출\s*목표/i.test(q))add('project');
    if(/돈|재물|금전|수입|지출|대출|빚|부채|상환|재정|월급|매출/i.test(q))add('money');
    if(/이사|주거|전세|월세|아파트|집\s*옮|집\s*계약|주택\s*계약|부동산|매물/i.test(q))add('move');
    if(/여행|휴가|출장|출국|해외/i.test(q))add('travel');
    if(/살까|구매|결제|사도|바꿀까/i.test(q))add('purchase');
    if(/건강|컨디션|피로|수면|회복|몸상태|스트레스/i.test(q))add('wellbeing');
    if(/내\s*(심리|마음|무의식)|나는\s*왜|내가\s*왜|자존감|내가.{0,12}(방향|집중|만족|원하는\s*삶)/i.test(q))add('self');
    if(!d.length)add('general');
    return d;
  }

  function analyze(input){
    const q=normalizeQuestion(input);
    const targets=conceptHits(q);
    const domains=detectDomains(q);
    const observation=/(봤|보았|확인했|확인한|들었|재생했|읽었|열어봤|눌러봤|들어봤|들어보았|봤을까|봤나요|봤어|들었을까|들었나요|읽었나|확인했나)/i.test(q)
      && /(프사|프로필|프뮤|음악|스토리|게시물|피드|카톡|메시지|문자|디엠|dm)/i.test(q);
    const perception=/(추측|짐작|어떻게\s*(볼|보고|여길|생각|판단|평가)|어떤\s*(느낌|인상).{0,6}(볼|보|느낄|느껴)|무슨\s*사람으로\s*볼|알고\s*있을까|믿고\s*있을까)/i.test(q);
    const feeling=/(속마음|감정|호감|좋아하|사랑|미련|그리워|끌림|싫어하|서운|질투)/i.test(q);
    const action=/(연락.{0,5}(오|올|온|오는|왔|하|할|해|해도)|고백.{0,4}(할|하|해)|다가올|접근|만나자고|행동\s*할|움직일)/i.test(q);
    const reunion=/(재회|다시\s*만나|다시\s*사귀|돌아오|관계\s*회복)/i.test(q);
    const timing=/(언제|언제쯤|언제즘|시기|타이밍|몇\s*(일|주|달|개월)|얼마나\s*있다가)/i.test(q);
    const timeWindow=/(이번\s*(주|달)|오늘|내일|올해|내년|이번달|이번\s*달|\d+\s*(일|주|개월)\s*(안|내))/i.test(q);
    const choice=/(할까\s*말까|하는\s*게\s*(나을|좋을)|나을까|낫나|어느\s*쪽|둘\s*중|vs\b|A\s*\/\s*B|선택|비교|남을까|옮길까|살까\s*말까|살까.{0,14}기다릴까|지금\s*살까|계약해도\s*(괜찮|될)|계약할까|유지해야\s*할까|유지할까|끊을까|계속.{0,8}유지)/i.test(q);
    const contactDecision=/(내가|제가).{0,12}(먼저\s*)?연락.{0,8}(해도|할까|하는\s*게|보내도|해볼)/i.test(q);
    const cause=/(왜|이유|원인|의도|무슨\s*뜻|왜\s*그랬)/i.test(q);
    const outcome=/(결과|어떻게\s*될|앞으로|성공할|합격할|가능성|전망|반응.{0,6}(어떨|어떤)|만족도|잘\s*될까)/i.test(q);
    const advice=/(어떻게\s*해야|뭘\s*해야|조언|주의|유의|대응|전략)/i.test(q);
    const conditionalReaction=/(봤다면|보았다면|들었다면|읽었다면|확인했다면|그렇다면).*(생각|느낌|감정|반응|인상)/i.test(q);
    const feelingActionGap=feeling && /(연락|행동|표현)/i.test(q) && /(왜|안\s*(하|오)|못\s*(하|오)|없)/i.test(q);
    const thirdParty=/(다른\s*(여자|남자|이성|사람)|새\s*(여자|남자)|양다리|제3자).*(있|만나|관계|썸)|((여자|남자|이성)\s*문제)/i.test(q);
    const thoughtFrequency=/(나를|내\s*생각).*(떠올릴|떠올려|떠오르|생각나|생각하나|생각할까|생각할|자꾸\s*생각)|떠올릴까|자주.{0,8}(생각|떠오)/i.test(q);
    const signalIntent=/(프뮤|프로필\s*(뮤직|음악)|프사|프로필\s*사진|상메|상태\s*메시지|스토리|게시물).*(왜|이유|무슨\s*뜻|의미|나한테|내게|나를\s*의식|신호)|(?:왜|무슨\s*뜻|의미).*(프뮤|프사|프로필|스토리|게시물)/i.test(q);
    const newConnection=/(새\s*인연|새로운\s*인연|새\s*연애|새로운\s*연애).*(어떤|누구|타입|특징|언제|어디|가능|들어|만나)|(?:어떤|누구|타입|특징).*(새\s*인연|새로운\s*인연)/i.test(q);
    const slots=extractExplicitSlots(q,targets);
    const intentTags=[];
    if(observation)intentTags.push('observation');
    if(signalIntent)intentTags.push('signal_intent');
    if(newConnection)intentTags.push('new_connection');
    if(thirdParty)intentTags.push('third_party');
    if(thoughtFrequency)intentTags.push('thought_frequency');
    if(feelingActionGap)intentTags.push('feeling_action_gap');
    if(perception)intentTags.push('perception');
    if(choice)intentTags.push('choice');
    if(reunion)intentTags.push('reunion');
    if(action)intentTags.push('action');
    if(timing)intentTags.push('timing');
    if(feeling)intentTags.push('feeling');
    if(cause)intentTags.push('cause');
    if(outcome)intentTags.push('outcome');
    if(advice)intentTags.push('advice');

    let kind='general';
    // Verb/intent outranks relationship context.
    if(observation)kind='observation';
    else if(signalIntent)kind='signal_intent';
    else if(newConnection)kind='new_connection';
    else if(perception)kind='perception';
    else if(contactDecision)kind='contact_decision';
    else if(thirdParty)kind='third_party';
    else if(thoughtFrequency)kind='thought_frequency';
    else if(feelingActionGap)kind='feeling_action_gap';
    else if(choice)kind='choice';
    else if(reunion&&timing)kind='reunion_timing';
    else if(action&&timing)kind='action_timing';
    else if(reunion)kind='reunion';
    else if(action)kind='action';
    else if(timing)kind='timing';
    else if(feeling)kind='feeling';
    else if(cause)kind='cause';
    else if(outcome)kind='outcome';
    else if(advice)kind='advice';

    const compound = /[\/；;]/.test(q) && new Set(intentTags).size>=2;
    if(compound && !['observation','signal_intent','new_connection','perception'].includes(kind)) kind='compound';

    return {question:q,kind,intentTags,domains,targets,slots,relation:relationContext(q),conditionalReaction,
      observation,perception,choice,contactDecision,reunion,action,timing,timeWindow,feeling,cause,outcome,advice,conditionalReaction,feelingActionGap,thirdParty,thoughtFrequency,signalIntent,newConnection};
  }

  function normalizeTokens(s){
    const stop=new Set(['카드','질문','상황','현재','미래','조언','결과','핵심','흐름','상대','상대방','그가','그는','내가','나는','것','가능성','부분','정도']);
    return new Set(String(s||'').toLowerCase().replace(/[0-9()[\]{}.,!?·:;/'"“”‘’_+\-↔→]/g,' ').split(/\s+/).filter(x=>x.length>=2&&!stop.has(x)));
  }
  function semanticTextSimilarity(a,b){
    const A=normalizeTokens(a), B=normalizeTokens(b); if(!A.size&&!B.size)return 1;
    let inter=0; A.forEach(x=>{if(B.has(x))inter++});
    const union=new Set([...A,...B]).size; return union?inter/union:0;
  }
  function signature(sp){return [sp.spreadTitle||'',...(sp.positions||[])].join(' ')}
  function memory(){try{return JSON.parse(localStorage.getItem(MEMORY_KEY)||'[]')||[]}catch{return[]}}
  function remember(question,sp,sem,score){
    const m=memory();
    m.unshift({id:(typeof W.secureId==='function'?W.secureId():Date.now().toString(36)),at:Date.now(),q:question,kind:sem.kind,domains:sem.domains,arch:sp.layoutType,spreadTitle:sp.spreadTitle,positions:sp.positions,score});
    localStorage.setItem(MEMORY_KEY,JSON.stringify(m.slice(0,MAX_MEMORY)));
  }
  function recentSimilarity(sp){
    const sig=signature(sp); let max=0;
    memory().slice(0,16).forEach(old=>{max=Math.max(max,semanticTextSimilarity(sig,signature(old)))}); return max;
  }

  function positionCoversSlot(pos,slot){
    const p=normalizeTokens(pos), s=normalizeTokens(slot); if(!s.size)return true;
    let hit=0;s.forEach(x=>{if(p.has(x)||[...p].some(y=>x.length>=2&&(y.startsWith(x)||x.startsWith(y))))hit++});
    if(hit>0)return true;
    const synonymPairs=[
      [/근황|생활|일상|지내/,/근황|생활|일상|지내/],
      [/감정|마음|심정/,/감정|마음|심정/],
      [/이성|연애|썸/,/이성|연애|썸|새\s*사람/],
      [/프사|프로필\s*사진/,/프사|프로필\s*사진|사진/],
      [/프뮤|뮤직|음악/,/프뮤|뮤직|음악/],
      [/시험|합격/,/시험|합격|점수/],
      [/직장|회사|커리어/,/직장|회사|커리어|업무/],
      [/돈|재물|금전/,/돈|재물|금전|재정|자금/]
    ];
    return synonymPairs.some(([a,b])=>a.test(slot)&&b.test(pos));
  }

  function expectedCount(sem){
    if(sem.kind==='observation')return sem.conditionalReaction?4:3;
    if(sem.kind==='signal_intent')return 5;
    if(sem.kind==='new_connection')return 6;
    if(sem.kind==='perception')return Math.min(7,Math.max(4,(sem.slots.length||2)+2));
    if(sem.kind==='choice')return 5;
    if(sem.kind==='contact_decision')return 7;
    if(sem.kind==='feeling_action_gap')return 5;
    if(sem.kind==='third_party')return 4;
    if(sem.kind==='thought_frequency')return 4;
    if(sem.kind==='timing')return 5;
    if(sem.kind==='compound')return Math.min(8,Math.max(4,sem.slots.length+2));
    if(['reunion_timing','action_timing'].includes(sem.kind))return 6;
    if(['action','reunion','feeling'].includes(sem.kind))return 5;
    return 5;
  }

  function forbiddenDrift(sem,positions){
    const joined=positions.join(' ');
    let penalty=0, reasons=[];
    if(['observation','perception'].includes(sem.kind) && !sem.action && !sem.reunion){
      if(/재회|다시\s*만나|연락\s*(할|올|오게)|행동\s*문턱|재접촉/.test(joined)){penalty+=30;reasons.push('질문에 없는 재회/연락으로 이탈')}
    }
    if(sem.kind==='observation' && /미련|애착|관계\s*미래|궁합/.test(joined)){penalty+=20;reasons.push('관찰 여부를 감정/관계 리딩으로 과잉 확장')}
    if(!sem.timing && /정확한\s*날짜|몇\s*월\s*몇\s*일|시기\s*확정/.test(joined)){penalty+=10;reasons.push('묻지 않은 시기 추가')}
    if(!sem.advice && positions.filter(p=>/조언|해야\s*할|행동\s*지침/.test(p)).length>=2){penalty+=8;reasons.push('조언 자리 과다')}
    return {penalty,reasons};
  }

  function scoreCandidate(sp,sem){
    if(!sp||!Array.isArray(sp.positions))return{score:-999,reasons:['positions 없음']};
    const pos=sp.positions.map(x=>String(x||'').trim()).filter(Boolean);
    if(pos.length<2||pos.length>9)return{score:-999,reasons:['카드 수 2~9 범위 위반']};
    let score=45; const reasons=[];
    const expected=expectedCount(sem);
    score += Math.max(0,12-Math.abs(pos.length-expected)*4);

    const generic=/현재 상황|미래 결과|숨겨진 변수|핵심 조언|최종 결과|현재의 흐름|과거 현재 미래|조언 카드|전체적인 흐름/;
    const genericN=pos.filter(p=>generic.test(p)).length;
    score-=genericN*9; if(genericN)reasons.push(`범용 포지션 ${genericN}개`);

    // Explicit requested slots are the strongest requirement.
    if(sem.slots.length){
      const covered=sem.slots.filter(s=>pos.some(p=>positionCoversSlot(p,s))).length;
      score += (covered/sem.slots.length)*28;
      if(covered<sem.slots.length)reasons.push(`명시 슬롯 ${sem.slots.length-covered}개 누락`);
    } else score+=8;

    // Intent-specific anchors.
    const joined=pos.join(' ');
    const anchors={
      observation:[/지지|확인|접근|노출|봤|들었|읽/,/반대|미확인|우연|반증/,/판단|우세|결론|가르는/],
      signal_intent:[/바꾼|올린|선택|게시|설정|변경/,/나에게|나를|대상|수신자|의도/,/다른\s*설명|우연|일반적|반증/,/판별|기준|우세/],
      new_connection:[/새\s*인연|새로운\s*사람|만남/,/특징|성향|타입|분위기/,/경로|장소|계기|들어오/,/관계|발전|속도|리듬/],
      perception:[/추측|인식|생각|판단|평가/,/단서|근거|기억|편견|필터/,/어긋|왜곡|확신|정확|우려|강점/],
      choice:[/A|선택\s*1|첫\s*선택|남을|하는\s*경우/,/B|선택\s*2|두\s*번째|옮길|하지\s*않는/,/기준|비용|대가|후회/],
      action:[/행동|연락|움직|접근|반응/,/막|장벽|문턱|억제/,/촉발|트리거|조건/],
      action_timing:[/지연|아직|막|장벽/,/전조|신호/,/방아쇠|촉발|트리거/,/행동|움직|연락/],
      reunion:[/이별|관계|재회|재접촉/,/반복|패턴|장벽|문턱/,/조건|지속|현실/],
      reunion_timing:[/지연|장벽|아직/,/전조|신호/,/재접촉|연락|행동/,/지속|반복|조건/],
      feeling:[/감정|마음|호감|미련|끌림/,/억제|두려|경계|망설/,/행동|표현|태도/]
    };
    const arr=anchors[sem.kind]||[];
    if(arr.length){const hits=arr.filter(r=>r.test(joined)).length;score+=(hits/arr.length)*18;if(hits<arr.length)reasons.push('질문 의도 핵심축 일부 약함')}

    // Duplicate semantics inside one spread.
    let dup=0;
    for(let i=0;i<pos.length;i++)for(let j=i+1;j<pos.length;j++)if(semanticTextSimilarity(pos[i],pos[j])>.68)dup++;
    if(dup){score-=Math.min(24,dup*8);reasons.push(`포지션 의미 중복 ${dup}쌍`)}

    // Specificity bonus.
    const specific=pos.filter(p=>p.length>=13 && !generic.test(p)).length;
    score+=Math.min(10,specific*1.5);

    const drift=forbiddenDrift(sem,pos);score-=drift.penalty;reasons.push(...drift.reasons);
    const recent=recentSimilarity(sp); if(recent>.52){const pen=Math.round((recent-.52)*70);score-=pen;reasons.push(`최근 배열과 유사 ${Math.round(recent*100)}%`)}
    if(memory().slice(0,3).some(x=>x.arch===sp.layoutType)){score-=5;reasons.push('최근 구조 반복')}
    return {score:Math.round(score),reasons};
  }

  function numbered(arr){return arr.map((x,i)=>`${i+1}. ${x}`)}
  function makeSp(title,why,arch,positions){return{spreadTitle:title,designRationale:why,layoutType:arch,positions:numbered(positions.map(x=>String(x).replace(/^\d+[.)]\s*/,'')))}}
  function withObjectParticle(text){
    const raw=String(text||'');
    const ch=[...raw].at(-1);
    if(!ch)return raw;
    const code=ch.charCodeAt(0);
    if(code>=0xAC00&&code<=0xD7A3){
      const hasBatchim=((code-0xAC00)%28)!==0;
      return `‘${raw}’${hasBatchim?'을':'를'}`;
    }
    return `‘${raw}’을`;
  }

  function observationCandidates(sem){
    const target=sem.targets.find(x=>['profile_photo','profile_music','status_message','instagram_story','social_post'].includes(x.id));
    const t=target?.label || '질문한 온라인 흔적';
    const obj=withObjectParticle(t);
    const verb=target?.id==='profile_music'?'직접 들어본 사실':target?.id==='profile_photo'?'직접 보거나 확인한 사실':target?.id==='status_message'?'직접 읽거나 확인한 사실':'직접 확인한 사실';
    const reaction=sem.conditionalReaction?`실제로 ${obj} 확인했다면 그 순간 받은 인상·생각`:null;
    return [
      makeSp(`${t} 확인 여부 · 증거/반증 판별`,'관계 맥락보다 실제 확인 여부를 먼저 판별하고, 지지 신호와 반대 신호를 같은 무게로 비교','evidence',[
        `${obj} ${verb}을 지지하는 카드상 신호`,
        `${obj} 확인하지 않았거나 우연히 노출됐을 가능성을 지지하는 반대 신호`,
        `두 가능성 중 어느 쪽이 더 우세한지 가르는 최종 판별 기준`,...(reaction?[reaction]:[])
      ]),
      makeSp(`${t} 접근 흔적 · 의도성 검증`,'봤다/안 봤다를 바로 단정하지 않고 접근 가능성→의도성→반증 순서로 좁힌다','threshold',[
        `최근 상대에게 ‘${t}’이 실제로 노출되거나 접근 가능했을 가능성`,
        `노출됐다면 상대가 의도적으로 ‘${t}’에 주의를 기울였을 가능성`,
        `단순 우연·자동 노출·미확인 쪽을 지지하는 가장 강한 반증`,
        `전체 신호를 합쳤을 때 직접 확인 쪽인지 미확인 쪽인지 가르는 결론`,...(reaction?[reaction]:[])
      ]),
      makeSp(`${t} 관찰 여부 · 3단 필터`,'접근 기회, 실제 주의, 반대 증거를 분리해 과잉해석을 줄인다','blindspot',[
        `상대가 ‘${t}’을 접할 현실적 기회가 있었는지`,
        `기회가 있었다면 실제로 멈춰서 확인했음을 시사하는 집중 신호`,
        `내가 '봤을 것'이라고 과대해석하게 만들 수 있는 반대 변수`,
        `세 신호를 비교했을 때 가장 타당한 판별`,...(reaction?[reaction]:[])
      ])
    ];
  }

  function signalIntentCandidates(sem){
    const target=sem.targets.find(x=>['profile_music','profile_photo','status_message','instagram_story','social_post'].includes(x.id));
    const t=target?.label||'온라인 표현';
    const obj=withObjectParticle(t);
    return [
      makeSp(`${t} 변경 의도 · 나를 향한 신호인가`,'콘텐츠를 바꾼 이유와 특정 수신자를 향한 의도를 분리하고, 나와 무관한 설명도 반증으로 남긴다','evidence',[
        `상대가 최근 ${obj} 선택·변경한 가장 직접적인 심리적 이유`,
        `${t}에 특정 누군가에게 전달하고 싶은 메시지가 실려 있을 가능성`,
        `그 메시지의 대상이 나일 가능성을 지지하는 연결 신호`,
        `나와 무관한 취향·기분·일상적 변경으로 설명되는 반대 신호`,
        `전체를 합쳤을 때 '나를 의식한 신호'인지 가르는 최종 판별 기준`
      ]),
      makeSp(`${t} · 표현 동기/수신자 분리`,'왜 바꿨는지와 누구를 향한 표현인지를 한 카드에 섞지 않고 단계별로 분리한다','layers',[
        `${t} 변경 당시 상대의 정서적 배경`,
        `상대가 스스로 인식한 변경 이유`,
        `본인도 명확히 의식하지 못한 표현 욕구`,
        `특정 수신자를 염두에 뒀다면 그 대상과 나의 연결 정도`,
        `이 표현을 나와 연결해 해석할 때 가장 조심해야 할 과대해석 지점`
      ]),
      makeSp(`${t} 신호 판독 · 의도/반증형`,'상징적 메시지와 단순 취향 변경을 경쟁 가설로 두고 판별한다','blindspot',[
        `${t}에 개인적 메시지가 담겼음을 지지하는 신호`,
        `그 메시지가 과거 관계 또는 나와 연결됨을 지지하는 신호`,
        `단순 취향·유행·현재 기분으로도 충분히 설명되는 반증`,
        `상대가 이 표현으로 얻고 싶어 하는 반응 또는 자기표현 효과`,
        `어느 해석이 더 타당한지 가르는 핵심 기준`
      ])
    ];
  }

  function newConnectionCandidates(sem){
    const asksType=/(어떤|타입|특징|성격|외모|직업|누구)/i.test(sem.question);
    const typeFirst=makeSp('새 인연 · 사람의 특징/관계 방식','질문이 사람의 타입을 묻는 만큼 인물 특징을 중심에 두고, 만남 경로와 실제 적합도를 보정한다','fit',[
      '새 인연의 첫인상과 눈에 띄는 외형·분위기',
      '대화하며 드러나는 성격과 감정 표현 방식',
      '일·생활 패턴 또는 사회적 환경에서 두드러질 특징',
      '나와 자연스럽게 잘 맞는 관계 방식',
      '처음 연결될 가능성이 높은 경로·장소·계기',
      '이 인연이 가벼운 만남을 넘어 관계로 발전하는지 가르는 조건'
    ]);
    const list = [
      makeSp('새 인연 · 어떤 사람으로 들어오는가','막연한 연애운 대신 유입 조건, 인물 특징, 만남 경로, 관계 속도를 분리한다','timeline',[
        '새 인연이 들어오기 쉬워지는 내 생활·감정 상태의 변화',
        '새 인연의 첫인상과 겉으로 드러나는 분위기',
        '그 사람의 성격·관계 방식에서 가장 두드러질 특징',
        '처음 연결될 가능성이 높은 경로·장소·계기',
        '서로 호감이 생길 때 관계가 진행되는 속도와 리듬',
        '이 인연이 실제 관계로 발전하는지 가르는 현실 조건'
      ]),
      makeSp('새로운 사람 · 특징/경로/적합도','외형적 매력과 실제 관계 적합성을 분리해 본다','fit',[
        '처음 눈에 들어오는 외형·분위기 또는 스타일',
        '대화하면서 드러나는 핵심 성향과 가치관',
        '나와 자연스럽게 잘 맞는 부분',
        '초반에 부딪힐 수 있는 차이 또는 경계점',
        '이 사람을 만나게 되는 생활권·활동·소개 경로',
        '가벼운 인연이 아니라 연애로 이어질 가능성을 가르는 신호'
      ]),
      makeSp('새 인연 유입 · 문이 열리는 조건','새 사람이 언제 들어오느냐를 날짜보다 실제 유입 조건과 전조로 본다','trigger',[
        '지금 새 인연 유입을 막거나 늦추는 가장 큰 조건',
        '새로운 만남이 가까워질 때 먼저 바뀌는 생활 패턴',
        '실제 만남을 만드는 외부 계기 또는 연결 고리',
        '상대가 나에게 처음 관심을 갖게 되는 포인트',
        '내가 그 사람을 알아보게 되는 특징',
        '관계를 이어가기 위해 초반에 필요한 현실 조건'
      ])
    ];
    if(asksType) list.unshift(typeFirst);
    return list;
  }

  function perceptionCandidates(sem){
    const q=sem.question;
    if(sem.domains.includes('career') && /면접|채용|입사|구직/i.test(q))return [
      makeSp('면접 평가 · 강점/우려/적합도','면접관의 인상을 연애식 추측 템플릿으로 읽지 않고 실제 평가 축으로 분리한다','perception',[
        '면접관이 나를 보고 형성한 첫 전체 평가',
        '면접 답변·태도에서 가장 긍정적으로 본 역량 또는 장점',
        '면접관이 망설이거나 우려했을 수 있는 지점',
        '직무·팀·조직과의 적합도를 어떻게 판단했을 가능성이 큰지',
        '최종 채용 판단에 가장 크게 작용할 평가 요소'
      ]),
      makeSp('면접관 시선 · 증거/반증형','좋게 봤다는 가정과 우려했다는 반대 신호를 함께 둔다','evidence',[
        '긍정적 평가를 지지하는 면접상의 신호',
        '부정적 또는 보류 평가를 지지하는 반대 신호',
        '경쟁자 대비 내가 돋보였을 가능성이 큰 포인트',
        '경쟁자 대비 약하게 보였을 수 있는 포인트',
        '면접관의 최종 인상을 가장 잘 설명하는 기준'
      ])
    ];
    if(sem.domains.includes('career') && /상사|팀장|회사|직장|업무|평판|평가/i.test(q))return [
      makeSp('상사가 보는 내 업무 · 평가 지도','사적인 인식이 아니라 업무 수행, 신뢰, 기대, 우려를 각각 나눈다','perception',[
        '상사가 보는 내 현재 업무 수행 수준과 전체 인상',
        '상사가 특히 강점으로 평가하는 업무 태도·역량',
        '상사가 보완이 필요하다고 느끼는 부분 또는 우려',
        '상사가 나에게 맡겨도 된다고 보는 책임·역할의 범위',
        '앞으로 내게 기대하는 변화나 성장 포인트',
        '내 자기평가와 상사의 평가가 가장 어긋날 수 있는 지점'
      ]),
      makeSp('직장 평판 · 강점/경계 신호','잘한다/못한다 한줄평보다 신뢰 자산과 경계 요소를 나눈다','evidence',[
        '업무 신뢰도가 높음을 지지하는 신호',
        '평가를 깎을 수 있는 반대 신호',
        '주변이 나를 찾게 되는 강점',
        '업무 관계에서 오해받기 쉬운 태도나 스타일',
        '평판이 좋아지거나 나빠지는 것을 가를 현실 신호'
      ])
    ];
    if(sem.domains.includes('appearance'))return [
      makeSp('상대가 보는 내 외모 · 인상/취향 지도','객관적 미모 판정이 아니라 상대가 실제로 인식하는 분위기와 개인 취향을 분리한다','perception',[
        '상대가 느끼는 내 전체 분위기와 첫 시각적 인상',
        '상대의 시선이 가장 먼저 머무는 외형적 포인트',
        '상대가 개인적으로 매력적이라고 느끼는 특징',
        '상대 취향과 특히 잘 맞는 부분',
        '매력과 별개로 낯설거나 호불호가 생길 수 있는 부분'
      ]),
      makeSp('외모 인식 · 매력/거리감 분리','끌림이 생기는 포인트와 거리감을 느끼는 포인트를 같이 본다','fit',[
        '상대에게 내가 주는 시각적 캐릭터와 아우라',
        '호감 또는 신체적 끌림을 강화하는 요소',
        '상대가 나를 기억하게 되는 독특한 포인트',
        '상대 취향과 덜 맞을 수 있는 요소',
        '전체적으로 상대가 나를 어떤 스타일의 사람으로 인식하는지'
      ])
    ];
    const slots=sem.slots.length?sem.slots:sem.targets.filter(x=>['my_status','my_emotion','my_romance','appearance','body'].includes(x.id)).map(x=>x.label);
    const actual=slots.length?slots:['내 최근 생활과 상태','내 현재 감정','내 주변 이성관계'];
    const core=actual.slice(0,5).map(s=>`상대가 현재 ‘${s}’에 대해 어떻게 추측·인식하고 있는지`);
    return [
      makeSp('상대의 추측 지도 · 항목 직결형','사용자가 나열한 항목을 각각 독립 카드로 두고 추측의 근거와 왜곡 가능성만 보정한다','perception',[
        ...core,`상대가 이런 추측을 만들게 된 기억·단서·편견`,`상대의 추측 중 실제 나와 가장 어긋날 가능성이 큰 부분`
      ].slice(0,9)),
      makeSp('상대 머릿속의 나 · 인식 필터형','무엇을 추측하는지뿐 아니라 어떤 정보 필터를 통해 그렇게 보는지 확인한다','layers',[
        ...core,`상대가 내 상태를 판단할 때 가장 크게 의존하는 과거 기억 또는 최근 단서`,`상대가 확신하고 있지만 실제로는 오판일 수 있는 지점`
      ].slice(0,9)),
      makeSp('상대의 현재 판단 · 확신도 점검','질문 항목별 인식과 그 인식의 신뢰도를 분리한다','evidence',[
        ...core,`상대가 자기 추측을 맞다고 믿게 만드는 근거`,`그 추측을 흔들 수 있는 반대 정보 또는 놓친 사실`
      ].slice(0,9))
    ];
  }

  function domainCandidates(sem){
    const d=sem.domains[0]||'general', k=sem.kind;
    if(k==='observation')return observationCandidates(sem);
    if(k==='signal_intent')return signalIntentCandidates(sem);
    if(k==='new_connection')return newConnectionCandidates(sem);
    if(k==='perception')return perceptionCandidates(sem);

    if(k==='feeling_action_gap')return[
      makeSp('감정은 있는데 왜 행동하지 않을까 · 불일치형','감정의 존재 여부와 행동이 없는 이유를 별개로 검증해 희망회로를 줄인다','layers',[
        '상대에게 현재 실제로 남아 있는 감정의 성격과 무게',
        '그 감정을 상대가 스스로 어느 정도 인정하고 있는지',
        '감정이 있어도 연락·표현을 막는 가장 큰 심리적 또는 현실적 장벽',
        '그 장벽을 넘어 실제 행동으로 전환시키는 조건',
        '가까운 흐름에서 감정이 행동으로 바뀔지 생각에만 머물지 가르는 신호']),
      makeSp('마음 ↔ 행동 · 증거/반증','호감 신호와 행동 부재의 반대 신호를 동시에 본다','evidence',[
        '상대에게 감정이 남아 있음을 지지하는 신호',
        '감정을 과대해석하고 있을 수 있음을 보여주는 반대 신호',
        '현재 행동이 없는 가장 직접적인 이유',
        '행동이 시작될 수 있는 촉발 조건',
        '감정과 행동 중 지금 실제 관계를 더 잘 설명하는 쪽'])
    ];

    if(k==='third_party')return[
      makeSp('다른 이성 여부 · 증거/반증형','제3자의 존재를 기정사실로 두지 않고 지지 신호와 반대 신호를 같이 본다','evidence',[
        '상대 주변에 연애적 관심 대상이 있음을 지지하는 신호',
        '다른 이성이 없거나 관계 의미가 약함을 지지하는 반대 신호',
        '있다면 그 관계의 실제 성격과 깊이',
        '전체 카드에서 제3자 가능성을 최종적으로 가르는 기준']),
      makeSp('제3자 변수 · 관계 강도 점검','누군가 있다는 가정과 실제 관계의 강도를 분리한다','blindspot',[
        '상대의 현재 이성관계 환경',
        '특정 제3자에게 관심이 집중돼 있을 가능성',
        '단순 지인·가벼운 관심을 연애관계로 오해할 가능성',
        '제3자가 현재 관계 판단에 실제로 영향을 주는 정도'])
    ];

    if(k==='thought_frequency')return[
      makeSp('나를 떠올리는가 · 생각의 빈도/질감','단순 yes/no보다 얼마나 자발적으로, 어떤 맥락에서 떠올리는지 본다','layers',[
        '상대의 일상에서 내가 자발적으로 떠오를 가능성을 지지하는 신호',
        '나를 떠올릴 때 가장 강하게 연결되는 기억이나 감정',
        '생각이 일시적 스침인지 반복적으로 돌아오는지 가르는 신호',
        '떠올림이 실제 행동 욕구와 연결되는지 별개의 생각에 머무는지']),
      makeSp('기억 속의 나 · 지지/반증','내가 자주 떠오른다는 가설을 지지·반증으로 나눠 본다','evidence',[
        '최근 내가 상대 머릿속에 떠오름을 지지하는 신호',
        '현재 상대의 관심이 다른 곳에 쏠려 있음을 지지하는 반대 신호',
        '나를 떠올리게 만드는 가장 강한 트리거',
        '떠올림의 정서적 톤과 실제 의미'])
    ];

    if(k==='contact_decision')return[
      makeSp('내가 먼저 연락해도 될까 · 반응/결정형','먼저 연락했을 때 상대의 생각·감정·실제 반응과 내가 감수할 리스크를 분리해 결정한다','decision',[
        '내 연락을 받았을 때 상대가 먼저 떠올릴 현실적인 판단',
        '상대가 그런 판단을 하게 되는 관계의 배경 또는 기억',
        '연락을 받는 순간 상대에게 올라오는 감정',
        '감정과 별개로 실제 겉반응이 어떻게 나타나기 쉬운지',
        '내가 먼저 연락했을 때 얻을 수 있는 가장 큰 이점',
        '내가 먼저 연락했을 때 감수해야 할 가장 큰 리스크',
        '지금 연락할지 보류할지 가르는 최종 현실 기준']),
      makeSp('선연락 · 기대/반증/후속 흐름','연락하고 싶은 마음보다 실제 반응의 지지·반대 신호를 같이 본다','evidence',[
        '내가 먼저 연락해도 관계가 열릴 가능성을 지지하는 신호',
        '지금 연락하면 부담 또는 거리감이 커질 수 있다는 반대 신호',
        '상대가 연락을 받았을 때 느낄 즉각적인 감정',
        '상대가 실제로 보일 답변·행동의 톤',
        '연락 이후 대화가 이어지기 위한 조건',
        '연락을 미루는 편이 더 나은 경우 나타나는 신호',
        '두 선택 중 후회를 줄일 결정 기준'])
    ];

    if(k==='timing')return[
      makeSp('시기 · 전조→방아쇠→현실화','날짜를 억지로 찍지 않고 질문한 사건이 가까워질 때 나타날 단계와 조건을 추적','timeline',[
        '아직 사건이 현실화되지 않는 핵심 지연 요인',
        '흐름이 움직이기 시작할 때 먼저 나타나는 전조',
        '실제 변화를 촉발하는 가장 강한 방아쇠',
        '사건이 현실화되기 직전에 확인할 수 있는 신호',
        '지연되거나 무산될 경우 가장 큰 이유']),
      makeSp('시기 · 임계조건 판별','언제라는 질문을 지금→가까워짐→발생의 조건 변화로 바꿔 본다','threshold',[
        '현재 시점에서 아직 충족되지 않은 조건',
        '가장 먼저 충족될 가능성이 있는 조건',
        '사건을 현실화시키는 결정적 조건',
        '발생이 가까워졌음을 알리는 현실 신호',
        '예상보다 늦어질 때 확인해야 할 변수'])
    ];

    if(k==='cause' && d==='exam')return[
      makeSp('공부가 막히는 이유 · 행동패턴 해부','의지 부족으로 뭉뚱그리지 않고 시작 저항·인지 부담·보상 구조를 분리','causal',[
        '공부를 시작하려 할 때 가장 먼저 생기는 저항의 정체',
        '집중을 끊거나 미루게 만드는 핵심 생각·감정 패턴',
        '현재 공부 방식에서 부담을 불필요하게 키우는 요소',
        '반대로 이미 잘 작동하고 있는 학습 자원',
        '미루기 패턴을 끊는 데 가장 효과적인 전환점']),
      makeSp('학습 정체 · 부담/보상 구조','왜 미루는지와 어떤 조건에서 다시 움직이는지를 함께 본다','resource',[
        '지금 공부가 버겁게 느껴지는 가장 큰 부담',
        '당장 공부보다 다른 행동을 선택하게 만드는 즉각적 보상',
        '실제로는 충분히 해낼 수 있게 도와주는 현재 자원',
        '시작 장벽을 가장 작게 만드는 조건',
        '공부 리듬이 살아나고 있음을 확인할 현실 신호'])
    ];

    if(k==='cause' && d==='wellbeing')return[
      makeSp('컨디션 저하 · 생활 부담/회복 자원','질병 원인을 카드로 진단하지 않고, 최근 컨디션을 소모시키는 생활 요인과 회복 자원을 안전하게 분리한다','wellbeing',[
        '최근 내가 가장 크게 체감하는 컨디션 변화의 양상',
        '에너지를 소모시키는 생활 리듬·일정·환경 부담',
        '회복을 방해하는 반복 습관 또는 과부하 신호',
        '지금 활용할 수 있는 가장 현실적인 회복 자원',
        '생활 조정만으로 넘기지 말고 객관적 확인이나 전문가 상담을 고려할 기준'
      ]),
      makeSp('회복이 막히는 지점 · 안전형','타로는 진단 대신 체감 부담과 관리 필요 신호를 정리하는 데만 사용한다','resource',[
        '현재 회복력을 가장 많이 소모시키는 영역',
        '수면·휴식·활동 리듬 중 우선 점검할 부분',
        '내가 무시하거나 과소평가하고 있을 수 있는 몸의 신호',
        '부담을 줄였을 때 회복에 가장 도움이 될 변화',
        '상태 변화 여부를 현실적으로 확인할 기준'
      ])
    ];

    if(k==='cause' && (d==='social'||d==='family') && /자꾸|반복|맨날|계속.*싸|같은\s*문제/i.test(sem.question))return[
      makeSp(`${d==='family'?'가족':'관계'} 갈등 · 반복패턴 해부`,'한 번의 감정이 아니라 같은 문제가 반복되는 구조와 서로 다른 욕구를 분리한다','loop',[
        '매번 갈등이 시작되는 표면적 촉발점',
        '그 아래에서 계속 충돌하는 서로의 핵심 욕구',
        '내가 같은 방식으로 반응하게 되는 자동 패턴',
        '상대가 같은 방식으로 반응하게 되는 자동 패턴',
        '둘의 반응이 서로를 더 자극하는 연결 고리',
        '반복을 끊기 위해 한쪽에서 먼저 달라져야 할 지점'
      ]),
      makeSp(`${d==='family'?'가족':'관계'} 반복 갈등 · 트리거/브레이크`,'싸움의 방아쇠와 반복을 멈추는 브레이크를 분리한다','causal',[
        '최근 갈등을 촉발하는 가장 흔한 상황',
        '그 상황이 유독 예민하게 느껴지는 오래된 이유',
        '갈등이 커지는 순간 서로 놓치는 정보',
        '싸움이 반복될 때 얻고 있는 숨은 이득 또는 방어',
        '다음번 같은 상황에서 패턴을 끊을 현실적 브레이크'
      ])
    ];

    if(k==='cause' && (d==='social'||d==='family'))return[
      makeSp(`${d==='family'?'가족':'관계'} 갈등 · 반복패턴 해부`,'한 번의 감정이 아니라 같은 문제가 반복되는 구조와 서로 다른 욕구를 분리한다','loop',[
        '겉으로 싸움이 시작되는 직접적인 촉발점',
        '그 촉발점 아래에서 반복되는 서로의 핵심 욕구 충돌',
        '상대가 내 태도를 오해하는 지점',
        '내가 상대의 태도를 오해하는 지점',
        '갈등을 계속 되풀이하게 만드는 자동 반응',
        '같은 패턴을 끊을 수 있는 가장 현실적인 전환점'
      ]),
      makeSp(`${d==='family'?'가족':'관계'} 태도 변화 · 겉/속 원인`,'차가워짐이나 거리두기의 겉태도와 실제 배경을 분리한다','layers',[
        '상대가 겉으로 보이는 태도가 바뀐 직접적 계기',
        '그 태도 뒤에 있는 감정 또는 필요',
        '나와 직접 관련된 원인과 상대 개인 사정의 비중',
        '지금 관계에서 서로 경계하고 있는 지점',
        '태도가 풀리거나 관계가 안정될 때 먼저 보일 신호'
      ])
    ];

    if(k==='cause' && d==='project')return[
      makeSp('프로젝트 문제 · 원인/병목 해부','실행·시장·자원 문제를 한데 섞지 않고 어디서 막히는지 분리한다','causal',[
        '현재 프로젝트가 기대만큼 움직이지 않는 가장 직접적인 원인',
        '성과를 계속 제한하는 핵심 병목',
        '팀·시간·예산·제품 중 실제로 가장 소모가 큰 자원',
        '고객 반응을 잘못 읽고 있을 수 있는 가정',
        '흐름을 바꾸기 위해 가장 먼저 검증할 변화',
        '문제가 풀리고 있음을 확인할 성과 신호'
      ])
    ];

    if(k==='cause')return[
      makeSp('왜 이런가 · 원인 해부' ,'표면 원인과 근본 원인, 이 상태를 유지하는 요인을 분리','causal',[
        '겉으로 드러난 가장 직접적인 이유',
        '그 아래에 있는 더 근본적인 동기 또는 욕구',
        '이 상태를 계속 유지시키는 반복 요인',
        '원인처럼 보이지만 실제로는 부차적일 수 있는 요소',
        '이 흐름을 바꿀 수 있는 전환점']),
      makeSp('이유/의도 · 겉과 속','보이는 행동 이유와 내면 동기, 환경 영향을 층별로 분리','layers',[
        '겉으로 설명 가능한 행동의 이유',
        '본인이 스스로 인정하고 있는 동기',
        '본인도 명확히 인식하지 못하는 욕구 또는 감정',
        '상황·환경이 행동에 끼친 영향',
        '여러 이유 중 가장 핵심적인 것을 가르는 기준'])
    ];

    if(k==='choice' && d==='stock')return[
      makeSp('매수 지금 vs 기다림 · 조건 비교','지금 진입과 대기의 장단점을 같은 기준으로 비교하고 가격 예언 대신 확인 조건을 남긴다','fork',[
        '지금 매수하는 선택을 지지하는 근거','지금 매수할 때 감수해야 할 핵심 리스크','기다리는 선택을 지지하는 근거','기다릴 때 놓칠 수 있는 기회비용','둘 중 어느 쪽이 더 합리적인지 가르는 현실 확인 조건']),
      makeSp('투자 선택 · 실행/대기 매트릭스','충동과 근거를 분리하고 실행 조건을 검증','matrix',[
        '지금 들어가고 싶은 욕구가 생긴 이유','실제 매수 근거의 강도','대기해야 한다는 반대 근거','내 판단을 흐리는 편향','실행 또는 대기를 결정할 객관적 조건'])
    ];

    if(k==='choice' && d==='career')return[
      makeSp('남기 vs 이직 · 대칭 비교','현 직장 유지와 이동을 동일 기준으로 비교','fork',[
        '현재 회사에 남을 때 얻는 가장 큰 이점','현재 회사에 남을 때 계속 감수할 비용','이직할 때 얻는 가장 큰 변화','이직할 때 감수할 현실적 비용과 불확실성','두 선택 중 장기 만족도를 가르는 핵심 기준']),
      makeSp('커리어 선택 · 후회 최소화','감정적 탈출 욕구와 실제 커리어 이득을 분리','decision',[
        '지금 이직하고 싶은 진짜 이유','현 직장에서 아직 활용할 수 있는 자원','이직이 실제로 해결해줄 문제','이직해도 남을 문제','결정 전에 확인해야 할 현실 신호'])
    ];

    if(k==='choice' && d==='move' && /계약|매물|부동산|집\s*사|전세|월세/i.test(sem.question))return[
      makeSp('이 집 계약 · 적합도/리스크 검증','집 자체의 끌림과 계약·생활 리스크를 분리해 확인한다','fit',[
        '이 집이 내 현재 생활에 잘 맞는 가장 큰 이유',
        '입지·동선·공간에서 실제 만족도가 높을 부분',
        '계약 후 예상보다 불편할 수 있는 요소',
        '비용·계약조건·관리 측면에서 놓치기 쉬운 리스크',
        '이 집을 선택해도 되는지 최종적으로 가를 현실 확인 기준'
      ]),
      makeSp('주거 계약 · 지지/반대 신호','좋아 보인다는 느낌과 실제 계약 적합성을 따로 본다','evidence',[
        '이 계약을 진행해도 된다는 지지 신호',
        '계약을 서두르면 안 된다는 반대 신호',
        '현장에서 다시 확인해야 할 공간·환경 요소',
        '금전·조건에서 다시 검토해야 할 요소',
        '최종 계약 전 반드시 충족돼야 할 기준'
      ])
    ];

    if(k==='choice' && (d==='social'||d==='family'))return[
      makeSp('이 관계를 유지할까 · 가치/비용/경계','관계를 이어갈지 끊을지를 감정 하나가 아니라 상호성, 소모, 회복 가능성으로 본다','decision',[
        '이 관계를 계속 유지할 가치가 있는 가장 큰 이유',
        '관계를 유지할 때 내가 반복해서 감수할 정서적 비용',
        '상대가 관계를 함께 지킬 의지·상호성을 보이는 정도',
        '적정 거리두기 또는 정리가 더 나을 수 있음을 보여주는 신호',
        '유지·거리두기·정리 중 어느 쪽이 맞는지 가르는 경계 기준'
      ]),
      makeSp('관계 지속 여부 · 증거/반증','좋았던 기억과 현재 관계 품질을 분리한다','evidence',[
        '관계를 이어가도 된다는 현재의 지지 신호',
        '관계를 재조정하거나 멀어져야 한다는 반대 신호',
        '이 관계에서 실제로 회복 가능한 문제',
        '반복될 가능성이 높은 문제',
        '결정 후 후회를 줄일 최종 기준'
      ])
    ];

    if(k==='choice' && d==='move')return[
      makeSp('현재 집 vs 이사 · 생활 적합도' ,'남는 선택과 이동하는 선택의 실제 생활 이득과 비용을 대칭 비교','fork',[
        '현재 집에 남을 때 유지되는 가장 큰 안정','현재 집에 남을 때 계속 감수할 불편','이사할 때 얻을 가장 큰 생활 변화','이사할 때 새로 생길 비용·불편','내 생활 만족도를 가장 크게 좌우할 최종 기준']),
      makeSp('주거 선택 · 현실 검증','이사 욕구와 실제 개선 가능성을 분리','fit',[
        '지금 이사를 원하는 진짜 이유','새 집이 실제로 해결할 가능성이 큰 문제','이사해도 해결되지 않을 문제','비용·동선·환경에서 놓치기 쉬운 리스크','계약/이동 전에 확인할 결정 신호'])
    ];

    if(k==='choice' && d==='purchase')return[
      makeSp('지금 구매 vs 기다림 · 가치 비교','즉시 구매와 대기를 같은 기준으로 비교해 충동과 실제 효용을 분리한다','fork',[
        '지금 사는 선택에서 바로 얻는 핵심 효용',
        '지금 살 때 감수할 비용·아쉬움·후회 위험',
        '기다리는 선택에서 얻는 핵심 이점',
        '기다릴 때 생기는 실제 불편 또는 기회비용',
        '지금 구매와 대기 중 후회를 줄이는 최종 판단 기준'
      ]),
      makeSp('구매 타이밍 · 필요/대체재 검증','새 제품 기대감과 현재 필요도를 분리하고 다음 모델/대체재의 가치를 비교한다','matrix',[
        '현재 제품을 바꾸고 싶은 진짜 이유',
        '지금 구매해야만 해결되는 실제 필요',
        '기다려도 문제없는 부분',
        '다음 모델·대체재를 기다릴 가치가 커지는 조건',
        '결제 전에 반드시 확인할 현실 기준'
      ])
    ];

    if(k==='choice')return[
      makeSp('양자택일 · 같은 기준 비교' ,'두 선택을 서로 다른 질문으로 보지 않고 동일 기준에서 이득·비용·후회를 비교','fork',['선택 A가 지금 나와 맞는 이유','선택 A의 가장 큰 이득과 대가','선택 B가 지금 나와 맞는 이유','선택 B의 가장 큰 이득과 대가','두 선택 중 장기 후회를 줄이는 결정 기준']),
      makeSp('A/B 결정 매트릭스','끌리는 쪽과 현실적으로 유리한 쪽이 같은지 검증','matrix',['내가 A에 끌리는 진짜 이유','A를 택했을 때 현실적으로 감수할 비용','내가 B에 끌리거나 B를 망설이는 진짜 이유','B를 택했을 때 현실적으로 감수할 비용','감정이 아니라 결과를 가를 핵심 기준']),
      makeSp('선택 후 시나리오 비교','각 선택을 했을 때 생기는 변화와 후회 포인트를 대칭 배치','decision',['A를 선택한 직후 가장 먼저 바뀌는 것','A 선택에서 나중에 후회할 수 있는 지점','B를 선택한 직후 가장 먼저 바뀌는 것','B 선택에서 나중에 후회할 수 있는 지점','지금 결정 전에 꼭 확인해야 할 현실 신호'])
    ];

    if(['action_timing','reunion_timing'].includes(k))return[
      makeSp('행동 시기 · 전조→방아쇠','날짜를 억지로 확정하지 않고 행동이 나오기까지 단계별 조건을 본다','trigger',['아직 실제 행동이 나오지 않는 핵심 지연 요인','생각이 행동 쪽으로 기울 때 먼저 나타나는 전조','실제 움직임을 만드는 외부·내부 방아쇠','행동 직전에 마지막으로 확인하는 심리적 조건','첫 행동이 어떤 방식으로 나타나기 쉬운지','첫 행동 뒤 흐름이 이어질지 가르는 반응']),
      makeSp('시기 임계점 · 행동 전환','감정의 크기보다 행동 문턱이 언제 낮아지는지 본다','threshold',['현재 행동 의향의 실제 강도','지금 가장 높은 행동 문턱','그 문턱을 낮추는 사건 또는 감정 변화','행동 직전 나타날 간접 신호','행동이 현실화될 상대적 단계','지연될 경우 가장 유력한 이유']),
      makeSp('접촉 타임라인 · 단계형','현재부터 첫 움직임 이후까지 서사를 시간 순으로 나눈다','timeline',['현재 잠복기의 심리 상태','행동 생각이 구체화되는 첫 변화','실제 접촉 직전의 전조','첫 움직임 또는 연락의 형태','첫 접촉 직후의 반응','그다음 관계가 이어지거나 멈추는 조건'])
    ];

    if(k==='action')return[
      makeSp('생각→행동 전환 · 임계점','상대의 마음이 실제 행동으로 넘어가는 조건을 분리','threshold',['현재 실제 행동 욕구의 강도','행동하고 싶어도 멈추게 하는 가장 큰 장벽','장벽보다 강해질 수 있는 촉발 요인','행동한다면 가장 먼저 취할 방식','행동 후 상대가 확인하고 싶어 하는 나의 반응']),
      makeSp('행동 가능성 · 증거/반증','행동 쪽 신호와 비행동 쪽 신호를 함께 검토','evidence',['실제 행동으로 이어질 가능성을 지지하는 신호','생각에만 머물 가능성을 지지하는 반대 신호','외부 환경에서 행동을 돕는 조건','행동을 무산시키기 쉬운 조건','현재 더 우세한 쪽을 가르는 기준'])
    ];

    if(k==='reunion')return[
      makeSp('재회 · 반복 패턴 검증','미련의 유무보다 다시 만났을 때 같은 문제가 반복되는지까지 본다','loop',['이별을 만든 관계의 핵심 반복 패턴','상대에게 아직 남아 있는 감정의 성격','재접촉을 막는 현실 장벽','재회를 실제로 촉발할 수 있는 조건','다시 만나면 가장 먼저 반복될 위험','이번에는 달라질 수 있음을 보여주는 현실 신호']),
      makeSp('재회 가능성 · 감정과 현실 분리','감정이 남았다는 사실과 재회 행동 가능성을 동일시하지 않는다','layers',['상대가 스스로 인정하는 남은 감정','상대가 인정하고 싶지 않은 감정','재회를 생각하게 만드는 이유','재회를 포기하게 만드는 현실 이유','재회가 행동으로 넘어가기 위한 필수 조건','재회 후 지속 가능성을 가르는 기준'])
    ];

    if(k==='feeling')return[
      makeSp('속마음 · 감정/행동 불일치','좋아하는 마음과 실제 행동 가능성을 분리해 읽는다','layers',['겉으로 드러내는 태도','스스로 인정하고 있는 감정','인정하지 않으려는 욕구 또는 미련','나에게 끌리면서도 경계하는 지점','감정과 실제 행동 사이의 가장 큰 불일치']),
      makeSp('상대 마음 · 끌림과 저항','호감의 강도만이 아니라 반대 방향의 감정도 같이 본다','evidence',['나에게 끌리는 감정의 핵심','그 감정을 약화시키거나 억누르는 반대 감정','나를 생각할 때 가장 먼저 떠오르는 기억/이미지','관계를 상상할 때 느끼는 기대','관계를 상상할 때 느끼는 부담 또는 두려움']),
      makeSp('속마음 · 관계 욕구 구조','감정을 관계에서 원하는 형태와 연결해 본다','fit',['나에 대한 현재 감정의 성격','나에게서 얻고 싶어 하는 정서적 경험','나와 가까워질 때 두려운 점','현재 원하는 관계의 거리감','말/태도와 실제 욕구가 어긋나는 부분'])
    ];

    if(d==='intimacy')return[
      makeSp('신체적 궁합 · 감각/리듬형','고정 19+ 배열과 겹치지 않게 현재 질문의 초점에 맞춰 욕구·감각·리듬을 압축','fit',['상대의 본능적 욕구와 주도 성향','내가 느끼는 신체적 수용감과 긴장도','둘 사이의 신체적 밀착감과 에너지 강도','서로 맞거나 어긋나는 속도·완급 리듬','지속력과 체력의 조화','숨겨진 판타지 또는 표현하지 않은 욕구','신체적 만족과 정서적 여운이 연결되는 방식']),
      makeSp('신체적 끌림 · 양쪽 감각 비교','상대와 나의 감각을 대칭으로 비교하고 중간의 궁합 포인트를 본다','mirror',['상대가 느끼는 내 신체적 매력','내가 느끼는 상대의 신체적 매력','상대가 원하는 리드/반응 방식','내가 편안하게 받아들이는 방식','둘의 템포가 가장 잘 맞는 지점','둘의 템포가 어긋날 수 있는 지점','행위 후 정서적 거리감 또는 친밀감'])
    ];

    if(d==='appearance')return[
      makeSp('상대가 보는 나 · 인상/매력 지도','외모·몸매를 단순 예쁘다/아니다로 줄이지 않고 시선이 머무는 포인트와 취향 적합도를 분리','perception',[
        '상대가 처음 또는 전체적으로 느끼는 내 분위기와 아우라',
        '상대의 시선이 가장 먼저 머무는 외형적 포인트',
        '상대가 개인적으로 매력적이라고 느끼는 특징',
        '상대 취향과 내가 잘 맞는 부분',
        '상대 취향과 내가 덜 맞거나 낯설게 느껴지는 부분']),
      makeSp('외모/피지컬 · 끌림과 취향','객관적 평가가 아니라 상대의 개인 취향 안에서 어떤 매력이 작동하는지 본다','fit',[
        '상대가 보는 전체 실루엣 또는 첫인상',
        '상대가 강하게 인식하는 얼굴/스타일 포인트',
        '상대가 느끼는 신체적 끌림의 성격',
        '그 끌림을 강화하는 취향 요소',
        '매력과 별개로 상대가 거리감을 느낄 수 있는 요소'])
    ];

    if(d==='love' && ['general','outcome','advice','compound'].includes(k))return[
      makeSp('관계 흐름 · 욕구/긴장/다음 변화','과거-현재-미래의 뻔한 3장 대신 두 사람의 욕구와 실제 긴장, 다음 변화를 본다','social',[
        '지금 이 관계에서 내가 가장 원하는 것',
        '상대가 지금 이 관계에서 원하는 것',
        '두 사람 사이에 실제로 남아 있는 연결점',
        '관계가 앞으로 움직이는 것을 막는 핵심 긴장',
        '가까운 흐름에서 먼저 변할 가능성이 큰 부분',
        '관계 방향이 좋아지거나 멀어지는 것을 가를 현실 신호']),
      makeSp('관계 전망 · 지지/반대 신호','좋은 카드만 미래로 읽지 않고 발전을 지지하는 신호와 반대 신호를 같이 본다','evidence',[
        '관계 발전을 지지하는 현재 신호',
        '관계 발전을 막거나 약화시키는 반대 신호',
        '상대의 감정과 실제 행동 사이의 차이',
        '내 쪽에서 관계 흐름에 영향을 크게 주는 요소',
        '가까운 변화가 나타날 때 가장 먼저 보일 신호'])
    ];

    if(d==='exam')return[
      makeSp('시험 · 합격권 진입 구조','막연한 합격운보다 현재 실력과 점수 손실 변수를 분리','resource',['현재 가장 점수로 연결되는 실력 자원','공부 시간 대비 효율이 낮은 병목 영역','시험에서 점수를 깎을 가능성이 큰 변수','가장 빠르게 점수로 전환할 수 있는 보완점','실전에서 반드시 살려야 할 강점','지금부터 버려야 할 비효율']),
      makeSp('시험 · 증거/반증 점검','합격을 지지하는 근거와 불합격 위험을 같은 무게로 본다','evidence',['합격 가능성을 지지하는 현재 준비 상태','합격 가능성을 낮추는 가장 강한 반대 요인','실력 외에 당일 결과를 흔들 변수','막판 상승폭이 가장 큰 영역','현재 계획에서 과대평가한 부분','합격권 판단에 사용할 현실 신호'])
    ];

    if(d==='career')return[
      makeSp('커리어 · 현재 위치와 다음 문','평판·기회·이동 가능성을 한 흐름 안에서 보되 각각 분리','matrix',['현재 직장에서 내가 실제로 차지하는 위치','주변이 나를 평가하는 핵심 기준','다가오는 기회 또는 역할 변화','현재 커리어를 막는 가장 현실적인 병목','남는 선택과 옮기는 선택의 핵심 차이','다음 결정을 내리기 전에 확인할 신호']),
      makeSp('이직/직장 · 자원과 비용','이동 욕구가 감정 반응인지 실질적 필요인지 검증','resource',['현재 직장에서 아직 활용 가능한 자원','현재 환경이 소모시키는 가장 큰 비용','새 환경으로 옮겼을 때 얻는 핵심 이점','이동 시 감수해야 할 현실적 대가','지금 이동을 서두르게 만드는 감정적 편향','결정 시 가장 우선할 기준'])
    ];

    if(d==='stock')return[
      makeSp('투자 판단 · 근거/편향/리스크','가격 예언 대신 의사결정 구조와 확인 조건을 본다','matrix',['현재 이 판단을 지지하는 가장 강한 근거','판단을 흐릴 수 있는 욕심·공포·확증편향','지금 감수하는 핵심 하방 리스크','추가 행동 전에 확인해야 할 현실 신호','예상과 다를 때 판단을 바꿔야 할 조건','현재 가장 일관된 대응 원칙']),
      makeSp('투자 · 증거 vs 반증','매수/보유/매도 가설을 지지하는 신호와 깨는 신호를 동시에 본다','evidence',['현재 전략을 유지해도 된다는 지지 신호','현재 전략을 재검토해야 한다는 반대 신호','내가 과대평가하는 기대 요인','내가 과소평가하는 리스크','행동 전 확인할 객관적 조건','판단이 틀렸음을 인정할 기준'])
    ];

    if(d==='money')return[
      makeSp('재정 · 현금흐름 해부','돈이 들어오고 나가는 구조, 압박, 회복 레버를 분리','resource',['현재 재정에서 가장 안정적인 자원','돈이 새거나 과소평가되는 지출/부담','가까운 흐름에서 키울 수 있는 수입 기회','부채·고정비가 만드는 압박','예상 밖 지출이나 변동 위험','재정 안정성을 가장 빠르게 높일 행동']),
      makeSp('금전 · 원인→회복 레버','현재 돈 문제의 원인과 개선 지점을 인과 구조로 본다','causal',['현재 금전 흐름을 만든 핵심 원인','문제를 더 키우는 반복 소비/판단 패턴','실제로는 통제 가능한 변수','수입 또는 지출 흐름을 바꿀 전환점','전환점을 현실화할 구체적 조건','안정화됐는지 판단할 신호'])
    ];

    if(d==='social'||d==='family')return[
      makeSp('관계 역학 · 나/상대/경계','호감·갈등을 한 감정으로 뭉개지 않고 서로의 욕구와 경계를 본다','social',['이 관계에서 내가 실제로 원하는 것','상대가 이 관계에서 원하는 것','서로 자연스럽게 맞는 지점','갈등이나 거리감을 만드는 핵심 오해','지켜야 할 경계 또는 선','관계가 좋아질 때 먼저 나타날 현실 신호']),
      makeSp('관계 · 겉태도와 속원인','상대의 표현과 그 배경을 분리해 본다','layers',['상대가 겉으로 보여주는 태도','그 태도 뒤의 실제 감정/동기','내가 상대 태도를 오해할 수 있는 지점','상대가 나를 오해할 수 있는 지점','관계를 불편하게 만드는 반복 패턴','관계 회복 또는 적정 거리의 기준'])
    ];

    if(d==='project' && sem.slots.length>=2)return[
      makeSp('사업/프로젝트 · 질문 항목 직결형','사용자가 직접 나열한 목표·병목·행동을 각각 독립 카드로 보존하고 공통 변수만 최소 추가한다','matrix',[
        ...sem.slots.filter(s=>!['돈/재물','사업/프로젝트'].includes(s)).slice(0,5).map(s=>`${s}에 대한 가장 직접적인 카드상 판단 포인트`),
        '각 항목에 공통으로 영향을 주는 시장·실행 변수',
        '전체 목표 달성 여부를 가르는 가장 현실적인 확인 기준'
      ].slice(0,8)),
      makeSp('프로젝트 목표 · 성과/병목/실행','목표 달성 전망을 막연히 보지 않고 성과 근거, 병목, 다음 행동을 분리한다','evidence',[
        '목표 달성을 지지하는 현재 성과·자원 신호',
        '목표 달성을 방해하는 가장 큰 병목',
        '고객·시장 반응에서 가장 유리한 요소',
        '현재 전략에서 과대평가하고 있는 가정',
        '가장 먼저 실행해야 할 구체적 변화',
        '목표 달성 여부를 판단할 현실 성과 기준'
      ])
    ];

    if(d==='project' && /고객|사용자|시장.*반응|반응.*어떨/i.test(sem.question))return[
      makeSp('출시 후 고객 반응 · 기대/저항/전환','고객이 좋아할지 한 장으로 뭉개지 않고 첫 반응, 가치 인식, 저항, 재사용/구매 전환을 분리한다','evidence',[
        '출시 직후 고객이 가장 먼저 주목할 포인트',
        '고객이 실제 가치로 느낄 가능성이 큰 기능·경험',
        '초기 반응을 약하게 만들 수 있는 거부감·불편·혼란',
        '호기심이 실제 사용·구매로 전환되는 조건',
        '기대와 실제 반응이 어긋날 수 있는 맹점',
        '제품-시장 적합도가 좋아지고 있음을 보여줄 현실 신호'
      ])
    ];

    if(d==='project')return[
      makeSp('프로젝트 · 성공조건 점검' ,'아이디어의 매력보다 실행 자원, 병목, 시장 반응을 분리','resource',['현재 프로젝트의 가장 강한 자원','실행을 늦추는 핵심 병목','사용자/고객이 실제로 반응할 포인트','내가 과대평가하는 가정','다음에 가장 작게 검증할 실험','계속 투자할지 판단할 성과 기준']),
      makeSp('사업/프로젝트 · 전환점 구조','현재 상태에서 다음 단계로 가는 인과 구조를 본다','causal',['프로젝트를 움직이게 한 원래 목적','지금 성장을 막는 원인','겉으로 문제처럼 보이지만 부차적인 것','흐름을 바꿀 전환점','전환점에 필요한 외부/내부 자원','성과가 나기 시작할 때 보일 신호'])
    ];

    if(d==='move')return[
      makeSp('이사/주거 · 적합도 검증','새 장소에 대한 기대와 현실 비용을 분리','fit',['지금 이사를 원하는 진짜 이유','새 환경이 해결해줄 가능성이 큰 문제','새 환경에서도 남을 문제','비용·거리·생활동선의 현실 리스크','새 장소와 내 생활 리듬의 적합도','결정 전에 확인할 조건']),
      makeSp('주거 선택 · 현재 vs 이동','남는 경우와 이동하는 경우를 대칭 비교','fork',['현재 자리에 남을 때 얻는 안정','현재 자리에 남을 때 감수할 불편','옮길 때 얻는 변화','옮길 때 감수할 비용','둘 중 생활 만족도를 더 크게 좌우할 기준'])
    ];

    if(d==='travel')return[
      makeSp('여행 · 기대/리스크/경험','여행의 목적과 실제 컨디션·일정 리스크를 분리','resource',['이번 여행에서 내가 가장 얻고 싶은 경험','여행 흐름을 좋게 만드는 조건','체력·일정·비용에서 주의할 변수','예상 밖에 얻을 좋은 경험','계획을 유연하게 바꿔야 할 신호','여행 후 가장 크게 남을 것']),
      makeSp('여행 선택 · 적합도','지금 이 여행이 내 상황과 맞는지 현실적으로 점검','fit',['지금 떠나고 싶은 욕구의 정체','현재 컨디션과 여행 강도의 적합도','비용 대비 얻는 가치','일정에서 가장 취약한 부분','현지에서 흐름이 풀리는 포인트','갈지 미룰지 가르는 기준'])
    ];

    if(d==='purchase')return[
      makeSp('구매 결정 · 필요/욕구 분리','사고 싶은 감정과 실제 효용을 분리','decision',['이 물건을 사고 싶은 진짜 이유','구매 후 실제로 자주 쓰게 될 가치','구매 전에 놓치기 쉬운 비용/단점','대체재 또는 기다림이 더 나을 가능성','지금 사도 후회가 적을지 가르는 기준']),
      makeSp('구매 · 가치 검증','즉시 만족과 장기 효용을 비교','matrix',['지금 얻는 즉각적 만족','장기적으로 남는 실용 가치','가격 외의 숨은 비용','사지 않았을 때 실제로 생기는 불편','결제 전 마지막 확인 기준'])
    ];

    if(d==='wellbeing')return[
      makeSp('컨디션 · 부담/회복 자원','타로로 질병을 진단하지 않고 체감 상태와 생활 부담, 회복 자원만 상징적으로 본다','wellbeing',['지금 내가 가장 크게 체감하는 에너지 상태','컨디션을 소모시키는 생활 패턴 또는 환경 부담','회복에 도움이 되는 현재 자원','내가 무시하고 있을 수 있는 휴식/관리 필요 신호','상태를 객관적으로 확인하거나 전문가 도움을 고려할 기준']),
      makeSp('회복 흐름 · 생활 리듬','증상 예측이 아니라 생활 리듬과 회복 포인트를 본다','resource',['현재 회복력을 가장 많이 쓰는 영역','수면·휴식·일정에서 부담이 큰 지점','회복을 돕는 작은 변화','무리하면 악화될 수 있는 패턴','컨디션이 회복되고 있음을 확인할 현실 신호'])
    ];

    if(d==='self' && ['outcome','advice','general'].includes(k))return[
      makeSp('앞으로 집중할 방향 · 가치/에너지 적합도','무엇이 좋아 보이는지가 아니라 어떤 방향이 실제 만족과 지속성을 높이는지 본다','fit',[
        '내가 앞으로 가장 크게 충족하고 싶은 핵심 가치',
        '시간을 쓸수록 에너지가 살아나는 활동·방향',
        '겉으로 좋아 보여도 나를 소모시킬 가능성이 큰 방향',
        '이미 가진 강점 중 앞으로 더 키울 가치가 큰 자원',
        '선택한 방향이 나와 맞다는 것을 확인할 현실 신호',
        '다음 단계에서 가장 먼저 집중할 우선순위'
      ]),
      makeSp('삶의 방향 · 욕구/현실/지속성','원하는 것과 현실 조건, 장기 지속성을 교차 검토한다','matrix',[
        '지금 내가 진짜 원하는 변화',
        '현재 현실에서 활용 가능한 자원',
        '욕구는 크지만 장기적으로 소모될 수 있는 선택',
        '만족도를 높이면서 지속 가능한 선택의 조건',
        '방향을 바꿔야 할 때 나타날 경고 신호',
        '가장 작은 첫 실행 단위'
      ])
    ];

    if(d==='self')return[
      makeSp('내 마음 · 표면/뿌리/전환' ,'현재 감정과 그 아래의 욕구, 회피 패턴을 분리','layers',['겉으로 가장 크게 느끼는 감정','그 감정 아래에 있는 진짜 욕구','내가 인정하기 싫어 피하고 있는 부분','반복해서 나를 같은 상태로 돌려놓는 패턴','이미 가지고 있는 회복/변화 자원','다음 전환을 만드는 작은 행동']),
      makeSp('자기이해 · 맹점 교정','자기평가와 실제 욕구가 어긋나는 지점을 본다','blindspot',['내가 현재 나 자신에 대해 맞게 보고 있는 부분','내가 과하게 부정적으로 보는 부분','반대로 과대평가하거나 합리화하는 부분','지금 가장 충족되지 않은 욕구','변화를 막는 자동 반응','새로운 패턴이 자리 잡았음을 보여줄 신호'])
    ];

    if(k==='cause')return[
      makeSp('왜 이런가 · 원인 해부','표면 원인과 근본 원인, 유지 요인을 분리','causal',['겉으로 드러난 직접 원인','그 아래의 더 근본적인 동기/원인','이 상태를 계속 유지시키는 요인','내가 원인이라고 착각할 수 있는 부차적 요소','흐름을 바꾸는 전환점']),
      makeSp('의도/이유 · 겉과 속','행동의 보이는 이유와 숨은 동기를 층별로 본다','layers',['겉으로 설명 가능한 이유','본인이 스스로 인정하는 동기','본인도 명확히 인식하지 못하는 욕구','상황/환경이 행동에 끼친 영향','가장 핵심적인 이유를 가르는 기준'])
    ];

    // Multi-slot questions get a direct slot-mapped candidate before generic ones.
    const slots=sem.slots.length?sem.slots.slice(0,6):[];
    const mapped=slots.length?makeSp('질문 직결 · 항목별 맞춤 배열','사용자가 직접 나열한 세부 질문을 카드 자리와 1:1로 연결하고 보정 카드만 최소 추가','perception',[
      ...slots.map(s=>`${s}에 대해 지금 가장 직접적으로 읽어야 할 핵심`),
      '각 항목을 함께 볼 때 공통으로 작용하는 연결 요인',
      '전체 해석에서 가장 과대해석하기 쉬운 맹점'
    ].slice(0,8)):null;

    const general=[
      makeSp('질문 해부 · 원인/긴장/레버','범용 과거-현재-미래 대신 이 질문을 실제로 움직이는 구조를 본다','causal',['이 문제를 만든 가장 직접적인 원인','지금 문제를 유지하거나 증폭하는 요인','내가 원인으로 착각하기 쉬운 부차 요소','흐름을 바꿀 수 있는 가장 큰 레버','레버가 작동했는지 확인할 현실 신호']),
      makeSp('질문 해부 · 맹점/검증','내 해석의 맹점을 줄이고 현실적으로 검증 가능한 신호를 남긴다','blindspot',['내가 이미 정확하게 보고 있는 부분','내가 과대평가하는 요소','내가 놓치고 있는 변수','상황을 바꿀 수 있는 숨은 자원','결론을 검증할 현실 신호']),
      makeSp('질문 해부 · 욕구/현실/대가','원하는 것과 가능한 것, 감수할 대가를 분리','matrix',['내가 진짜 원하는 결과','현재 현실이 허용하는 범위','목표를 방해하는 가장 큰 조건','목표를 얻기 위해 감수해야 할 대가','결정을 바꿔야 할 신호'])
    ];
    return mapped?[mapped,...general]:general;
  }

  function dedupeCandidates(cands){
    const out=[];
    for(const c of cands){
      if(!c||!Array.isArray(c.positions))continue;
      if(out.some(x=>semanticTextSimilarity(signature(x),signature(c))>.76))continue;
      out.push(c);
    }
    return out;
  }

  function localCandidates(sem){
    let c=domainCandidates(sem);
    // For true compound questions, add an explicit slot-preserving candidate first.
    if(sem.kind==='compound'&&sem.slots.length){
      c.unshift(makeSp('복합 질문 · 항목 보존형','슬래시/세미콜론으로 나눈 사용자의 질문 항목을 빠뜨리지 않고 각각 독립 카드로 배치','matrix',[
        ...sem.slots.slice(0,6).map(s=>`${s}에 대한 직접 답변 포인트`),
        '각 항목 사이를 연결하는 공통 원인 또는 변수',
        '전체 결론을 내릴 때 가장 주의할 오판 가능성'
      ].slice(0,9)));
    }
    return dedupeCandidates(c);
  }

  function recentSummary(){
    return memory().slice(0,8).map((x,i)=>`${i+1}) ${x.arch} | ${x.positions.join(' / ')}`).join('\n')||'없음';
  }

  async function geminiCandidates(sem){
    const key=localStorage.getItem('LUNEA_API_KEY');
    if(!key)return[];
    const model=localStorage.getItem('LUNEA_MODEL')||'gemini-2.5-flash';
    const prompt=`너는 타로 해석자가 아니라 '질문을 카드 포지션으로 번역하는 스프레드 설계 엔진'이다.\n\n[원문]\n${sem.question}\n\n[앱의 구조 분석]\n- 핵심 의도: ${sem.kind}\n- 의도 태그: ${sem.intentTags.join(', ')||'general'}\n- 주제 도메인: ${sem.domains.join(', ')}\n- 관계 맥락: ${sem.relation}\n- 질문에 명시된 기간 창: ${sem.timeWindow?'있음':'없음'}\n- 사용자가 직접 나열한 세부 항목: ${sem.slots.join(' / ')||'없음'}\n- 탐지된 개념: ${sem.targets.map(x=>x.label).join(' / ')||'없음'}\n\n[절대 규칙]\n1) 관계 맥락보다 질문의 동사와 목적어를 우선한다. '헤어진 그'가 나와도 프사를 봤는지 묻는다면 재회 스프레드로 바꾸지 않는다.\n2) 사용자가 슬래시(/), 세미콜론 등으로 나열한 항목은 각 항목을 최소 1개의 독립 포지션으로 보존한다.\n3) 질문에 없는 재회·연락·미련·제3자·미래·조언을 임의로 추가하지 않는다.\n4) '현재 상황 / 숨겨진 변수 / 미래 결과 / 핵심 조언' 같은 범용 문구를 피한다. 각 포지션은 무엇을 판별하는지 구체적으로 쓴다.\n5) 2~9장. 단순 사실 확인은 3~4장, 복합 질문은 필요한 만큼만 쓴다.\n6) 같은 뜻을 말만 바꿔 반복하지 않는다.\n7) 후보 3개는 구조가 서로 달라야 한다. 제목만 바꾸고 포지션 의미가 같으면 안 된다.\n8) 관찰 여부(봤나/들었나/읽었나)는 증거-반증-판별을 포함하고, '봤다면 무슨 생각?'이 원문에 있을 때만 반응 카드를 추가한다.\n9) 추측/인식 질문은 사용자가 묻는 항목을 1:1로 배치하고, 왜 그렇게 추측하는지/어디서 틀릴 수 있는지 정도만 보정한다.\n10) 감정과 행동은 구분한다. 감정이 있다고 곧바로 연락/재회 포지션을 만들지 않는다.\n11) 시기 질문은 근거 없는 날짜 확정 대신 지연요인→전조→방아쇠→행동 단계로 설계한다.\n12) 건강은 진단/예후 대신 체감 상태·생활 부담·회복 자원·전문가 확인 필요 신호만 다룬다.\n13) 투자 질문은 가격 예언보다 판단 근거·편향·리스크·확인 조건을 다룬다.\n\n[최근 사용 배열 — 의미 중복 피하기]\n${recentSummary()}\n\n서로 다른 3개의 후보 스프레드를 JSON으로만 반환하라.`;
    const schema={type:'OBJECT',properties:{candidates:{type:'ARRAY',items:{type:'OBJECT',properties:{spreadTitle:{type:'STRING'},designRationale:{type:'STRING'},layoutType:{type:'STRING'},positions:{type:'ARRAY',items:{type:'STRING'}}},required:['spreadTitle','designRationale','layoutType','positions']}}},required:['candidates']};
    try{
      const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.74,topP:.9,responseMimeType:'application/json',responseSchema:schema}})
      });
      const data=await res.json(); if(data.error)throw new Error(data.error.message);
      const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text; if(!raw)return[];
      const parsed=JSON.parse(raw); return (parsed.candidates||[]).slice(0,3).map((sp,i)=>({
        spreadTitle:String(sp.spreadTitle||`AI 후보 ${i+1}`),
        designRationale:String(sp.designRationale||'질문 구조 기반 AI 후보'),
        layoutType:String(sp.layoutType||`ai-${i+1}`),
        positions:(sp.positions||[]).map(x=>String(x))
      }));
    }catch(err){console.warn('[LUNEA V7] candidate API fallback',err);return[]}
  }

  async function repairCandidate(sem,best,reasons){
    const key=localStorage.getItem('LUNEA_API_KEY');if(!key)return null;
    const model=localStorage.getItem('LUNEA_MODEL')||'gemini-2.5-flash';
    const prompt=`다음 타로 스프레드는 품질 검사에서 약점이 발견됐다. 원문 질문의 의도와 세부 항목을 보존하면서 딱 한 번 수정하라.\n\n원문: ${sem.question}\n의도: ${sem.kind}\n세부 항목: ${sem.slots.join(' / ')||'없음'}\n현재 후보: ${JSON.stringify(best)}\n문제점: ${reasons.join('; ')||'점수 부족'}\n\n2~9장, 중복 의미 금지, 범용 문구 금지, 질문에 없는 주제 추가 금지. JSON만 반환.`;
    const schema={type:'OBJECT',properties:{spreadTitle:{type:'STRING'},designRationale:{type:'STRING'},layoutType:{type:'STRING'},positions:{type:'ARRAY',items:{type:'STRING'}}},required:['spreadTitle','designRationale','layoutType','positions']};
    try{
      const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.55,topP:.85,responseMimeType:'application/json',responseSchema:schema}})});
      const data=await res.json();if(data.error)throw new Error(data.error.message);const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;return raw?JSON.parse(raw):null;
    }catch(err){console.warn('[LUNEA V7] repair failed',err);return null}
  }

  async function designSpreadV7(question){
    const sem=analyze(question);
    W.LUNEA_V7_LAST_SEMANTIC=sem;
    let candidates=localCandidates(sem);

    // High-confidence micro questions are deliberately local-first. Gemini may add alternatives,
    // but cannot replace the intent-safe local candidates unless it scores higher.
    const ai=await geminiCandidates(sem);
    candidates=dedupeCandidates([...candidates,...ai]);
    if(!candidates.length)throw new Error('스프레드 후보 생성 실패');

    let ranked=candidates.map(sp=>({sp,...scoreCandidate(sp,sem)})).sort((a,b)=>b.score-a.score);
    let best=ranked[0];
    if(best.score<66 && localStorage.getItem('LUNEA_API_KEY')){
      const repaired=await repairCandidate(sem,best.sp,best.reasons);
      if(repaired){
        const rr={sp:repaired,...scoreCandidate(repaired,sem)};
        ranked.push(rr);ranked.sort((a,b)=>b.score-a.score);best=ranked[0];
      }
    }

    const result={...best.sp};
    result.positions=(result.positions||[]).map((p,i)=>String(p).match(/^\d+[.)]\s*/)?String(p):`${i+1}. ${p}`);
    result.designRationale=`${result.designRationale||'질문 구조 기반 설계'} · V7 후보 ${ranked.length}개 비교 후 선택 (적합도 ${Math.max(0,best.score)}점)`;
    remember(sem.question,result,sem,best.score);
    console.info('[LUNEA V7] semantic',sem,'ranked',ranked.map(x=>({title:x.sp.spreadTitle,score:x.score,reasons:x.reasons})));
    return result;
  }

  function readingDirectiveV7(){
    let sem;
    try{sem=W.LUNEA_V7_LAST_SEMANTIC||analyze(document.getElementById('spreadQuestion')?.textContent||'')}catch{sem={kind:'general',domains:['general']}}
    const k=sem.kind;
    if(k==='signal_intent')return `\n[온라인 표현 의도 판정 규칙]\n- 프사·프뮤·상태메시지 같은 변경을 특정인에게 보낸 메시지라고 기정사실화하지 않는다.\n- 변경 자체의 동기, 특정 수신자 의도, 나와의 연결 신호, 나와 무관한 반증을 비교한다.\n- 결론은 '나를 의식한 신호가 우세 / 일반적 자기표현이 우세 / 판단 보류'처럼 조건부로 말한다.`;
    if(k==='new_connection')return `\n[새 인연 해석 규칙]\n- 새 인연의 존재를 운명처럼 확정하지 않는다. 카드상 유입 조건, 사람의 특징, 만남 경로, 관계 속도를 구분해 읽는다.\n- 외모·직업 같은 세부 특징은 카드 조합이 반복해서 지지할 때만 구체화하고 단정하지 않는다.`;
    if(k==='observation')return `
[이 질문 전용 판정 규칙]
- 실제 디지털 행동을 카드로 객관적 사실처럼 증명하지 않는다. 확인 쪽 신호와 미확인·우연 노출 쪽 반증을 비교해 상징적으로 어느 쪽이 더 우세한지만 말한다.
- 첫 결론은 "확인 쪽이 우세 / 미확인 쪽이 우세 / 상쇄되어 판단 보류" 중 하나로 제시한다.
- 질문에 없는 재회·연락·미련·관계 미래를 끌어오지 않는다.`;
    if(k==='perception')return `
[이 질문 전용 해석 규칙]
- 실제 사용자의 상태와 상대의 추측을 분리한다.
- 질문에 나열된 항목을 각각 독립적으로 답하고, 추측의 근거·왜곡 가능성을 마지막에 정리한다.
- 질문하지 않은 연락·재회·행동 계획으로 확장하지 않는다.`;
    if(k==='contact_decision')return `
[이 질문 전용 해석 규칙]
- 상대의 생각, 감정, 실제 겉반응을 서로 다른 층으로 분리한다.
- "상대가 반가워할 수 있음"과 "실제로 관계가 좋아짐"을 같은 뜻으로 취급하지 않는다.
- 사용자가 먼저 연락하는 선택의 이점과 리스크를 모두 비교한 뒤, 카드상 어느 선택이 더 자연스러운지 조건부로 결론낸다.`;
    if(k==='third_party')return `
[이 질문 전용 판정 규칙]
- 제3자가 실제로 존재한다고 전제하지 않는다. 존재 가능성을 지지하는 신호와 반증을 같은 무게로 비교한다.
- 카드로 타인의 사생활을 객관적 사실처럼 확정하지 않는다.
- 결론은 존재 가능성의 우세/열세/판단 보류와, 있다면 관계의 성격을 상징적으로 구분한다.`;
    if(k==='thought_frequency')return `
[이 질문 전용 해석 규칙]
- 상대가 떠올리는 빈도·반복성과 실제 연락 의도는 분리한다.
- 순간적 연상인지 반복적으로 되돌아오는 생각인지 카드 조합으로 구분하고, 행동 의향은 별도 근거가 있을 때만 언급한다.`;
    if(k==='feeling_action_gap')return `
[이 질문 전용 해석 규칙]
- 감정의 존재·강도와 실제 행동 가능성을 분리한다.
- 연락/표현을 막는 장벽과 행동으로 전환시키는 조건을 각각 설명한다.
- 감정 카드만으로 연락이나 재회를 확정하지 않는다.`;
    if(k==='action_timing'||k==='reunion_timing'||k==='timing')return `
[이 질문 전용 해석 규칙]
- 근거 없는 날짜를 확정하지 않는다. 지연 요인→전조→방아쇠→행동 직전 신호 순서로 읽는다.
- 시간 표현은 카드가 일관되게 지지할 때만 상대적 범위로 제시한다.`;
    if(k==='action'||k==='reunion')return `
[이 질문 전용 해석 규칙]
- 감정과 실제 행동을 구분하고, 행동을 막는 문턱과 촉발 조건을 중심으로 읽는다.
- 재회는 재접촉 자체와 재회 후 지속 가능성을 따로 판단한다.`;
    if(k==='choice')return `
[이 질문 전용 해석 규칙]
- 두 선택을 동일한 기준으로 비교한다. 한쪽만 장점, 다른 쪽만 단점으로 편향되게 읽지 않는다.
- 최종 결론은 카드상 더 유리한 선택과 그 선택이 유리해지는 조건을 함께 말한다.`;
    if(k==='feeling')return `
[이 질문 전용 해석 규칙]
- 표면 태도, 스스로 인정하는 감정, 무의식적 욕구, 행동과의 불일치를 구분한다.
- 호감·미련이 있다고 해서 곧바로 연락·재회 의향으로 확대하지 않는다.`;
    if(sem.domains?.includes('stock'))return `
[투자 질문 해석 규칙]
- 타로를 가격·수익률 예측 도구처럼 표현하지 않는다. 판단 근거, 편향, 리스크, 확인 조건 중심으로 해석한다.`;
    if(sem.domains?.includes('wellbeing'))return `
[컨디션 질문 해석 규칙]
- 질병명·진단·예후를 카드로 단정하지 않는다. 체감 상태, 생활 부담, 회복 자원, 현실적으로 확인할 신호 중심으로 읽는다.`;
    if(sem.domains?.includes('exam'))return `
[시험·공부 질문 해석 규칙]
- 합격을 운명처럼 확정하지 않는다. 현재 준비도, 병목, 실전 변수, 점수로 연결할 행동을 구분한다.`;
    return '';
  }

  // Replace only AI custom spread functions. Fixed presets and draw engine stay untouched.
  W.normalizeKoreanTypos = normalizeQuestion;
  W.cleanQuestion = normalizeQuestion;
  W.analyzeQuestionIntent = analyze;
  W.designSpread = designSpreadV7;
  W.readingDirective = readingDirectiveV7;
  W.LUNEA_SPREAD_ENGINE_V7 = {analyze,scoreCandidate,localCandidates,designSpread:designSpreadV7,memory};

  // UI badge so the user can tell V7 actually loaded.
  const badge=document.querySelector('.engine-strip span:last-child');
  if(badge)badge.innerHTML='<b>Secure Draw + Spread V7</b> · 질문 동사 우선 · 다주제 분류 · 후보 3~6개 자동채점 · 최근 배열 의미중복 방지';
  const aiItem=[...document.querySelectorAll('.reading-item')].find(x=>x.dataset?.title==='질문 맞춤 AI 배열');
  if(aiItem){
    aiItem.dataset.desc='V7이 질문의 동사·목적어·세부 항목을 먼저 분해하고 서로 다른 후보 배열을 비교해 가장 자연스러운 2~9장 배열을 선택합니다.';
    const p=aiItem.querySelector('p');if(p)p.textContent='질문해부 → 후보 생성 → 범위이탈/중복 검사 → 최적 배열 선택.';
  }
  console.info('🌙 LUNEA Spread Engine V7 loaded');
})();
