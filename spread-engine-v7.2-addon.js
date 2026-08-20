'use strict';
/* LUNEA Spread Engine V7.2 addon
   Broad topic router + 3-axis metadata + specialist micro-spread library.
   Loaded AFTER spread-engine-v7.js. Existing fixed spreads and draw logic stay untouched.
*/
(() => {
  const W = window;
  const BASE = W.LUNEA_SPREAD_ENGINE_V7;
  if(!BASE){console.error('[LUNEA V7.2] V7 base engine missing');return;}

  const oldDesign = W.designSpread;
  const oldDirective = W.readingDirective;
  const MEMORY_KEY = 'LUNEA_SPREAD_MEMORY_V72';

  const LABELS = {
    yesno:'단순 유무/판별', choice:'양자택일', timeline:'시간 흐름', cause:'원인 분석',
    perception:'상대 인식/평가', relationship:'심층 관계', outcome:'결과/전망', decision:'행동 결정',
    observation:'관찰 여부', advice:'조언/대응', yearly:'12개월 연간 흐름', deep:'심층 구조'
  };
  const TIME_LABELS = {
    today:'오늘/당일', week:'이번 주', month:'이번 달', m1_3:'1~3개월', m3_6:'3~6개월',
    m6plus:'6개월 이상', year:'연간/12개월', unspecified:'기간 미지정'
  };
  const TARGET_LABELS = {
    self:'본인 단독', specific:'특정 1인', pair:'두 사람/두 선택지', group:'제3자·집단',
    object:'사물/공간', animal:'반려동물', plant:'반려식물', unspecified:'대상 미지정'
  };

  function norm(s){return String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();}
  function uniq(a){return [...new Set(a.filter(Boolean))];}
  function numberPositions(a){return a.map((x,i)=>`${i+1}. ${String(x).replace(/^\d+[.)]\s*/, '')}`);}
  function makeSp(title,why,layoutType,positions){return {spreadTitle:title,designRationale:why,layoutType,positions:numberPositions(positions)};}
  function safeJSON(k,f){try{return JSON.parse(localStorage.getItem(k)||'')||f}catch{return f}}
  function memory(){return safeJSON(MEMORY_KEY,[])}
  function remember(sem,sp){const m=memory();m.unshift({at:Date.now(),specialty:sem.specialty,structure:sem.structure,title:sp.spreadTitle,positions:sp.positions});localStorage.setItem(MEMORY_KEY,JSON.stringify(m.slice(0,40)));}
  function tokens(s){return new Set(norm(s).toLowerCase().replace(/[0-9()[\]{}.,!?·:;/'"“”‘’_+\-↔→]/g,' ').split(/\s+/).filter(x=>x.length>=2&&!['카드','질문','현재','결과','조언','흐름','상대','가능성','부분','기준'].includes(x)));}
  function sim(a,b){const A=tokens(a),B=tokens(b);if(!A.size&&!B.size)return 1;let i=0;A.forEach(x=>B.has(x)&&i++);return i/(new Set([...A,...B]).size||1);}
  function sig(sp){return [sp.spreadTitle,...sp.positions].join(' ')}
  function choose(cands){
    const recent=memory().slice(0,10);
    let scored=cands.map((sp,idx)=>{
      const max=recent.reduce((m,r)=>Math.max(m,sim(sig(sp),[r.title,...(r.positions||[])].join(' '))),0);
      return {sp,score:100-Math.round(max*38)-idx};
    }).sort((a,b)=>b.score-a.score);
    const top=scored.filter(x=>x.score===scored[0].score);
    const i=typeof W.secureRandomInt==='function'&&top.length>1?W.secureRandomInt(top.length):0;
    return top[i].sp;
  }

  function detectTime(q){
    if(/12\s*개월|연간|1년\s*(운|흐름|전망)|올해\s*월별|내년\s*월별/i.test(q))return'year';
    if(/오늘|당일|지금\s*당장|오늘\s*(밤|아침|오전|오후)/i.test(q))return'today';
    if(/이번\s*주|금주|일주일/i.test(q))return'week';
    if(/이번\s*달|이번달|한\s*달|1개월/i.test(q))return'month';
    if(/1\s*[~～-]\s*3\s*개월|1~3개월|두\s*달|세\s*달|3개월/i.test(q))return'm1_3';
    if(/3\s*[~～-]\s*6\s*개월|반년|6개월/i.test(q))return'm3_6';
    if(/6개월\s*이상|장기|올해|내년|올해\s*안|연말/i.test(q))return'm6plus';
    return'unspecified';
  }
  function detectTarget(q){
    if(/강아지|고양이|반려동물|반려견|반려묘/i.test(q))return'animal';
    if(/반려식물|몬스테라|화분|식물/i.test(q))return'plant';
    if(/에어팟|지갑|물건|가구|액세서리|스마트폰|노트북|자동차|집|매물|침실|방\s*(안|안에|하나|에서|으로|의)/i.test(q)&&!/(상대|그|그녀|친구|상사|부모|형제)/i.test(q))return'object';
    if(/A\s*(회사|대학|지역|집|선택)?\s*(vs|와|과|랑|또는)|둘\s*중|A\s*\/\s*B/i.test(q))return'pair';
    if(/친구들|동료들|사람들|무리|단톡방|팬들|팔로워|심사위원|면접관들|부모님들|양가/i.test(q))return'group';
    if(/상대|그\s*사람|그가|그녀|전남친|전여친|친구|상사|팀장|룸메|동거인|클라이언트|트레이너|디자이너|임대인|동업자/i.test(q))return'specific';
    if(/내가|나는|나의|내\s|저는|제가/i.test(q))return'self';
    return'unspecified';
  }
  function detectStructure(q,b){
    if(/12\s*개월|연간|월별\s*운|월별\s*흐름/i.test(q))return'yearly';
    if(b.kind==='observation')return'observation';
    if(b.kind==='choice'||/vs|둘\s*중|어느\s*쪽|비교|A\s*\/\s*B/i.test(q))return'choice';
    if(b.kind==='perception'||/어떻게\s*(볼|평가|생각)|첫인상|속마음|진심|평판/i.test(q))return'perception';
    if(b.kind==='cause'||/왜|이유|원인|심리|속사정/i.test(q))return'cause';
    if(b.kind==='timing'||b.kind==='action_timing'||b.kind==='reunion_timing'||/언제|시점|타이밍|흐름/i.test(q))return'timeline';
    if(/했을까|있을까|일까|맞을까|생겼을까|풀릴까|성사될까|받을\s*수\s*있을까/i.test(q))return'yesno';
    if(/어떻게\s*해야|대처|처세|조언|전략|주의점/i.test(q))return'advice';
    if(/결과|성공|합격|가능성|전망|오래갈|완주|당첨|승인/i.test(q))return'outcome';
    if(/관계|궁합|갈등|재회|삼각|동거|상견례|가족|친구/i.test(q))return'relationship';
    return'deep';
  }

  function detectSpecialty(q){
    const R=[
      ['message_behavior',/(읽씹|안읽씹|답장\s*텀|연락\s*텀|스토리.{0,8}안\s*보|일부러.{0,8}(안\s*보|무시))/i],
      ['flirting',/(플러팅|친절.{0,8}(매너|호감)|단순\s*매너|이성적\s*호감)/i],
      ['first_date',/(소개팅|첫\s*만남|첫\s*데이트|애프터)/i],
      ['social_opinion',/(친구들이|주변인|주변\s*사람|동료들이).{0,20}(나에|어떻게|이야기|평가)/i],
      ['aftershock',/(후폭풍|공허함|헤어지고.{0,12}(당당|멀쩡|괜찮아)|이별\s*후.{0,8}(후회|공허))/i],
      ['rebound',/(환승|새\s*연애|새로운\s*연인|갈아탄|헤어지자마자)/i],
      ['profile_stimulus',/(프로필|프사|프뮤|상메).{0,18}(바꾸면|자극|연락\s*유도)|연락\s*올\s*때까지.{0,8}기다/i],
      ['relationship_recurrence',/(다시\s*만나도|재회.{0,10}(똑같|같은\s*문제|다시\s*헤어))/i],
      ['secret_relationship',/(사내연애|비밀연애|우리\s*둘\s*사이.{0,18}(눈치|알고)|직장\s*동료.{0,12}눈치)/i],
      ['triangle_compare',/(삼각관계|양다리|나와.{0,12}다른\s*이성|누구에게\s*더\s*마음)/i],
      ['beauty_procedure',/(성형|시술|필러|보톡스|눈\s*수술|코\s*수술|피부\s*시술|부작용)/i],
      ['style_change',/(헤어스타일|염색|숏컷|히피펌|퍼스널\s*컬러|패션\s*스타일|흑발|브라운|타투|피어싱)/i],
      ['diet_fitness',/(다이어트|정체기|바디프로필|체지방|운동\s*강도|웨이트|유산소|pt\s*트레이너|트레이너)/i],
      ['housing_fit',/(풍수|터\s*기운|금전운.{0,8}집|건강운.{0,8}집|이사\s*갈\s*집)/i],
      ['housing_noise',/(층간소음|이웃.{0,10}(스트레스|문제)|새로\s*입주.{0,10}이웃)/i],
      ['deposit_return',/(전세\s*보증금|보증금.{0,12}(돌려|반환)|임대인.{0,12}보증금)/i],
      ['manager_style',/(새로\s*부임|팀장.{0,16}(업무\s*스타일|요구|성향)|상사.{0,16}(업무\s*스타일|요구))/i],
      ['office_politics',/(사내정치|견제|배제|텃세|뒷담화|험담|평판.{0,10}타격)/i],
      ['promotion_salary',/(승진|인사평가|연봉\s*협상|연봉\s*인상)/i],
      ['creator_growth',/(유튜브|인스타|채널|알고리즘|팔로워|구독자).{0,20}(성장|타기|추천|콘텐츠|반응)/i],
      ['creator_deal',/(협찬|광고\s*계약|브랜드\s*제안|스폰서)/i],
      ['overseas',/(유학|워킹홀리데이|워홀|해외\s*취업|비자|현지\s*적응)/i],
      ['dating_app',/(틴더|데이팅\s*앱|소개\s*앱|앱에서\s*만난|앱으로\s*만난|라이크|매칭|원나잇|스폰|고스팅)/i],
      ['fandom_luck',/(티켓팅|팬싸|팬사인회|포도알|당첨|가챠|뽑기|강화운|픽업\s*캐릭터)/i],
      ['friend_jealousy',/(질투|시기심|열등감|(?:친구|지인|단톡방).{0,16}기싸움|단톡방.{0,12}(소외|반응)|나\s*빼고.{0,12}다른\s*방)/i],
      ['small_debt',/(빌려준\s*돈|돈\s*갚|독촉|소액.{0,10}갚)/i],
      ['ex_compare',/(전애인|전남친|전여친).{0,24}(새\s*상대|새로운\s*상대|비교|아쉬워)|지인.{0,12}(근황|물어)/i],
      ['impulse_choice',/(충동구매|장바구니|지르면|후회할까|약속.{0,10}(취소|파토)|오늘\s*저녁.{0,8}모임)/i],
      ['report_timing',/(보고|결재|업무\s*톡).{0,18}(오전|오후|퇴근|지금|내일\s*아침|즉시)/i],
      ['marriage_family',/(상견례|결혼\s*준비|파혼|시댁|처가|결혼.{0,12}(빚|대출|확신))/i],
      ['part_time',/(알바|아르바이트|주휴수당|야간수당|급여.{0,10}지급|악덕\s*고용주)/i],
      ['marketplace',/(당근마켓|중고거래|현장\s*네고|진상\s*구매자|중고\s*물품\s*거래)/i],
      ['roommate',/(룸메이트|룸메|동거인|기숙사|공과금\s*정산|내\s*방.{0,12}(들어|물건))/i],
      ['online_community',/(오픈채팅|디스코드|게임\s*길드|동호회\s*단톡|익명\s*저격|에브리타임|랜선)/i],
      ['freelance',/(프리랜서|클라이언트|거래처|외주|단가\s*인상|비딩|입찰|대행사)/i],
      ['travel_issue',/(여행|출장|게스트하우스).{0,24}(싸우|트러블|소매치기|연착|바가지|현지\s*로맨스|돌발)/i],
      ['creative',/(창작|예술|디자인|영감|슬럼프|표절|카피\s*논란|작품\s*대중성|사이다\s*전개|웹소설|자캐|oc\b|trpg)/i],
      ['inheritance',/(상속|유산|부양\s*책임|병원비|간병|형제.{0,12}돈\s*빌려)/i],
      ['dream_symbolic',/(꿈|악몽|가위눌림|예지몽|조상.{0,10}꿈|꿈속)/i],
      ['intuition_secret',/(쎄한\s*직감|촉.{0,8}(맞|진위)|무언가\s*숨기|비밀.{0,8}(있|감추))/i],
      ['plant',/(반려식물|몬스테라|잎\s*끝|화분|분갈이|물주기|통풍|일조량)/i],
      ['lost_item',/(분실|잃어버린|에어팟|지갑).{0,24}(어디|집\s*안|외부|찾|방위|근처)/i],
      ['object_energy',/(액땜|잔류\s*에너지|부정적인\s*에너지|중고.{0,12}기운|서늘한\s*기운|전생|카르마|동시성|111|777|그림자\s*자아|영혼의\s*메시지|4대\s*원소|원소\s*밸런스)/i],
      ['food_choice',/(마라탕|치킨|야식|치팅데이|웨이팅|맛집|음식.{0,12}(선택|땡기|원하))/i],
      ['digital_detox',/(디지털\s*디톡스|sns.{0,16}삭제|인스타(?:그램)?.{0,20}삭제|쇼츠.{0,12}삭제|쇼츠\s*앱|도파민|피드\s*반응|브이로그)/i],
      ['driving',/(운전|고속도로|졸음운전|문콕|주차|중고차|침수|교체\s*이력|출퇴근길)/i],
      ['social_escape',/(회식|2차\s*탈출|스몰토크|어색한\s*1:1|핑계.{0,8}빠|업무\s*톡.{0,8}읽씹)/i],
      ['exam_day',/(시험장|자리\s*배정|찍기|첫\s*직감|시험\s*당일\s*아침|공복|포도당)/i],
      ['pet',/(강아지|고양이|반려동물|반려견|반려묘).{0,24}(스트레스|바라는|합사|적응|궁합|마음)/i]
    ];
    return (R.find(([,re])=>re.test(q))||[''])[0];
  }

  function detectDomains72(q,baseDomains){
    let d=[...(baseDomains||[])]; const add=x=>!d.includes(x)&&d.push(x);
    // Base V7의 짧은 부분문자열 오탐 보정: '이성적'의 '성적', '헤어지고'의 '헤어' 같은 경우.
    if(/이성적/i.test(q)&&!/시험|합격|공시|자격증|공부|학습|강의|복습|회독|진도|성적\s*(표|향상|점수)/i.test(q)) d=d.filter(x=>x!=='exam');
    if(/(?:연봉|단가|가격|급여)\s*인상/i.test(q)&&!/외모|얼굴|첫인상|이미지|스타일|매력|몸매|체형|아우라/i.test(q)) d=d.filter(x=>x!=='appearance');
    const pairs=[
      ['legal',/(소송|민사|합의|채권|법적|계약\s*분쟁|보증금|주휴수당|야간수당)/i],
      ['beauty',/(성형|시술|헤어(?:스타일|컷|펌|염색|샵|디자인)|염색|패션|타투|피어싱|다이어트|바디프로필)/i],
      ['housing',/(이사|부동산|전세|월세|보증금|층간소음|풍수|매물)/i],
      ['creator',/(유튜브|인스타|크리에이터|인플루언서|콘텐츠|협찬|광고)/i],
      ['overseas',/(유학|워킹홀리데이|워홀|비자|해외\s*취업|현지)/i],
      ['fandom',/(팬싸|팬사인회|티켓팅|아이돌|가챠|픽업\s*캐릭터|동인|코믹|일러스트\s*페어)/i],
      ['roommate',/(룸메|동거인|기숙사)/i],
      ['online',/(오픈채팅|디스코드|게임\s*길드|에브리타임|익명\s*저격|랜선)/i],
      ['freelance',/(프리랜서|클라이언트|거래처|외주|비딩|입찰)/i],
      ['creative',/(창작|예술|디자인|웹소설|자캐|trpg|표절|영감)/i],
      ['inheritance',/(상속|유산|부양|간병)/i],
      ['spiritual_symbolic',/(전생|카르마|액땜|예지몽|영혼|원소\s*밸런스|111|777|서늘한\s*기운)/i],
      ['pet',/(강아지|고양이|반려동물|반려견|반려묘)/i],
      ['plant',/(반려식물|몬스테라|화분|분갈이)/i],
      ['driving',/(운전|고속도로|주차|중고차|출퇴근길)/i]
    ]; pairs.forEach(([x,re])=>re.test(q)&&add(x)); return uniq(d);
  }

  function enrich(base){
    const q=norm(base.question);
    const specialty=detectSpecialty(q);
    const structure=detectStructure(q,base);
    const timeRange=detectTime(q);
    const targetScope=detectTarget(q);
    const domains=detectDomains72(q,base.domains);
    const risk=[];
    if(domains.includes('legal'))risk.push('legal');
    if(domains.includes('stock')||domains.includes('money')||/고가|100만|투자|계약|대출|보증금/i.test(q))risk.push('financial');
    if(/건강|수면|가위눌림|시술|성형|부작용|운전|사고|체지방|다이어트/i.test(q))risk.push('health_safety');
    if(/숨기|양다리|환승|뒷담화|험담|저격|염탐|몰래|내\s*방|침수|교체\s*이력|대출|빚/i.test(q))risk.push('unverified_fact');
    const symbolicMode=/전생|카르마|액땜|예지몽|서늘한\s*기운|잔류\s*에너지|영혼|우주가|111|777|사물\s*에너지|터\s*기운/i.test(q);
    return {...base,question:q,specialty,structure,timeRange,targetScope,domains,risk:uniq(risk),symbolicMode,
      axes:{structure:LABELS[structure]||structure,time:TIME_LABELS[timeRange]||timeRange,target:TARGET_LABELS[targetScope]||targetScope}};
  }

  function yesNoEvidence(title,subject,extra){
    return makeSp(title,'단정형 Yes/No 대신 지지 신호와 반대 신호를 함께 두어 과잉해석을 줄이는 3카드 판별형','v72-evidence',[
      `‘${subject}’ 쪽을 지지하는 가장 강한 카드상 신호`,
      `반대로 ‘${subject}’ 쪽이 아니거나 다른 설명이 더 맞음을 지지하는 반대 신호`,
      `두 가설 중 어느 쪽이 더 우세한지 가르는 최종 판별 기준`,...(extra?[extra]:[])
    ]);
  }
  function twoChoice(title,a,b,axis='현실적 만족도와 리스크'){
    return makeSp(title,'A와 B를 같은 축으로 비교해 한쪽에만 유리하게 설계하지 않는 5카드 양자택일형','v72-choice',[
      `현재 고민을 만든 핵심 욕구·문제`,
      `${a} 선택 시 단기 이점과 가장 큰 리스크`,
      `${b} 선택 시 단기 이점과 가장 큰 리스크`,
      `${a} vs ${b}의 장기적 실익·비용 비교`,
      `${axis}를 기준으로 한 최종 결정 포인트`
    ]);
  }
  function deepFeeling(title){return makeSp(title,'겉태도·본심·장벽·가까운 행동을 분리하는 4카드 초세부 심리형','v72-layers',[
    '겉으로 드러내는 태도와 사회적 페르소나',
    '무의식 또는 말하지 않는 진짜 감정·욕구',
    '표현이나 행동을 가로막는 장애물·자존심·현실 조건',
    '가까운 흐름에서 실제로 드러날 행동 또는 태도 변화'
  ]);}
  function timing5(title,subject){return makeSp(title,'날짜를 억지로 확정하기보다 현재 상태→1개월→3개월→행동 조건을 분리하는 5카드 타이밍형','v72-timing',[
    `현재 ${subject}의 상태·기류`,
    `지금 행동을 늦추는 가장 큰 지연 요인`,
    `1개월 안에 먼저 변할 수 있는 신호·기류`,
    `약 3개월 범위에서 현실화 가능성을 키우거나 낮추는 조건`,
    `내가 취할 포지션 또는 실제 확인해야 할 전조`
  ]);}
  function dayDecision(title,a,b){return makeSp(title,'당일 행동은 거창한 예언보다 지금 실행/미루기의 결과와 에너지 비용을 비교하는 3카드형','v72-day',[
    `${a} 했을 때 오늘의 결과 흐름과 에너지 비용`,
    `${b} 했을 때 오늘의 결과 흐름과 에너지 비용`,
    `오늘 기준 후회를 줄이는 최종 행동 원칙`
  ]);}

  function specialtyCandidates(s){
    const q=s.question, id=s.specialty; const C=[];
    switch(id){
      case'message_behavior':
        C.push(makeSp('읽씹·안읽씹·SNS 반응 · 이유 분해','바쁨/감정 저하/거리 조절 같은 경쟁 가설을 분리해 본다','v72-cause',[
          '답장을 늦추거나 일부러 보지 않는 데 가장 직접적인 현실 이유','나에 대한 감정 변화가 이 행동에 차지하는 비중','바쁨·피로·환경 같은 비관계적 이유의 비중','거리 조절·주도권·회피 욕구가 개입하는 정도','다음 반응에서 어느 가설이 맞는지 확인할 현실 신호'])); break;
      case'flirting':
        C.push(yesNoEvidence('친절은 매너일까 호감일까','상대의 행동을 단순 매너보다 이성적 호감 표현으로 보는 해석', '내가 가볍게 플러팅했을 때 실제 반응에서 확인할 신호'));
        C.push(deepFeeling('플러팅 전 상대 심리 · 4카드')); break;
      case'first_date':
        C.push(makeSp('소개팅·첫 데이트 직후 · 인상/애프터형','첫인상·호감·아쉬움·후속 행동을 분리','v72-first-date',['만남 직후 상대가 받은 전체적인 첫인상','이성적 호감으로 연결된 가장 강한 포인트','아쉬움·거리감 또는 망설임을 만든 포인트','애프터/다음 연락을 실제로 하게 만드는 조건','후속 연락 텀이 길어진다면 가장 가능성 높은 이유'])); break;
      case'social_opinion':
        C.push(makeSp('주변인들이 보는 나 · 집단 시선 지도','집단의 공통 인상과 일부 개인의 반응을 구분','v72-social',['상대 주변 사람들이 공통적으로 형성한 내 이미지','긍정적으로 평가하거나 호감을 느끼는 포인트','경계·오해·질투가 생길 수 있는 포인트','상대가 주변에 나를 어떤 톤으로 설명했을 가능성이 큰지','집단 반응을 실제보다 과대해석하지 않기 위해 확인할 신호'])); break;
      case'aftershock': C.push(timing5('이별 후 후폭풍 · 공허함 타이밍','상대의 이별 후 감정')); break;
      case'rebound':
        C.push(makeSp('환승/새 연애 · 존재와 관계 질 분리','새 사람이 있다는 가정부터 하지 않고 존재 가능성·깊이·지속성을 분리','v72-evidence',['새 연애/새 이성의 존재를 지지하는 신호','단순 지인·가벼운 만남 또는 없음 쪽을 지지하는 반대 신호','있다면 그 관계가 시작된 동기와 현재 깊이','이 관계가 오래 가는 데 필요한 조건과 취약점','과거 관계와 비교가 실제로 작동하는지 가르는 신호'])); break;
      case'profile_stimulus':
        C.push(makeSp('프로필 변화 · 자극 vs 역효과','상대 자극용 연출을 만능 전략으로 보지 않고 반응·오해·내 비용을 같이 본다','v72-decision',['프로필 변화가 상대의 주의를 끌 가능성을 지지하는 신호','상대가 느낄 수 있는 첫 인상·해석','관심 대신 거리감·경계·오해를 키울 위험','내가 얻는 심리적 이득과 소모','프로필을 바꾸거나 기다릴지를 가르는 현실 기준'])); break;
      case'relationship_recurrence':
        C.push(makeSp('재회 후 같은 문제 재발할까 · 반복패턴 7','재접촉과 관계 지속 가능성을 분리해 반복 고리를 본다','v72-loop',['과거 이별을 만든 핵심 반복 패턴','내 쪽에서 다시 나타날 가능성이 큰 반응','상대 쪽에서 다시 나타날 가능성이 큰 반응','재회 초반 잠시 좋아 보여도 남아 있을 구조적 문제','이번엔 달라질 수 있음을 보여주는 실제 변화','변화가 없을 때 다시 깨질 가능성이 큰 지점','재회를 지속 가능한 관계로 만드는 최소 조건'])); break;
      case'secret_relationship':
        if(/눈치|알고\s*있|소문/i.test(q)) C.push(yesNoEvidence('사내 비밀관계 · 주변이 눈치챘을까','직장 동료들이 두 사람의 관계를 이미 눈치챘다는 해석','실제 소문/평판 리스크를 줄이기 위해 확인할 공개적 행동 신호'));
        else C.push(makeSp('고백 후 사내 리스크 · 업무/평판 분리','감정 결과와 업무 환경 파장을 따로 본다','v72-risk',['고백 전 현재 업무 관계의 안정도','고백이 받아들여졌을 때 업무에 생길 변화','거절됐을 때 어색함·업무 협업에 생길 리스크','동료/상사 시선과 평판에 미칠 수 있는 영향','사내 관계를 보호하려면 지켜야 할 경계'])); break;
      case'triangle_compare':
        C.push(makeSp('삼각관계 · 마음 기울기 대칭 비교','나와 다른 이성을 같은 기준으로 비교하되 실제 존재를 기정사실화하지 않는다','v72-mirror',['나에게 느끼는 감정의 성격과 강점','다른 이성에게 느끼는 감정의 성격과 강점','나와의 관계에서 끌리면서도 망설이는 점','다른 이성과의 관계에서 끌리면서도 망설이는 점','현재 행동이 어느 쪽에 더 투자되고 있는지 보여주는 신호','최종적으로 마음의 무게를 가르는 현실 행동 기준'])); break;
      case'beauty_procedure':
        C.push(makeSp('시술/성형 결정 · 기대/리스크/확인','의료 결과를 예언하지 않고 기대·불안·의사소통·객관적 확인 항목을 분리','v72-health',['내가 이번 시술에서 가장 기대하는 변화','기대치가 과해질 수 있는 지점 또는 후회 위험','상담에서 반드시 구체적으로 확인할 디자인·한계·부작용 질문','회복기간·비용·생활 일정에서 감수할 현실 부담','진행/보류를 결정할 객관적 기준'])); break;
      case'style_change':
        if(/vs|흑발.{0,20}브라운|실장.{0,20}부원장|둘\s*중|어느\s*쪽/i.test(q)) C.push(twoChoice('스타일 A vs B · 매력/관리 비교','A 선택','B 선택','매력도·유지관리·후회 가능성'));
        else C.push(makeSp('스타일/헤어 변신 시뮬레이션 3','기대 이미지와 실제 결과, 주변 첫인상을 나눠 본다','v72-style',['내가 기대하는 이상적인 변신 이미지','실제로 내 얼굴·체형·관리 난이도와 만났을 때 나타날 현실 결과','주변 사람들에게 전달될 첫인상과 매력 변화'])); break;
      case'diet_fitness':
        if(/오늘|웨이트|유산소|스트레칭/i.test(q))C.push(dayDecision('오늘 운동 강도 · 고강도 vs 회복','고강도 운동을','가벼운 유산소·스트레칭/회복을'));
        else C.push(makeSp('다이어트/바디프로필 · 정체기 해부','체중 예언보다 행동 지속·회복·환경 변수를 본다','v72-fitness',['현재 정체를 만드는 가장 큰 행동·환경 병목','이미 효과가 있어 유지해야 할 습관','운동 강도·빈도에서 조정 가치가 큰 부분','식사·회복·수면 중 먼저 점검할 요소','지속성을 무너뜨리는 심리적 트리거','목표가 현실적으로 가까워지고 있음을 확인할 객관적 지표'])); break;
      case'housing_fit':
        C.push(makeSp('새 집 · 생활 적합도/공간 체감','풍수의 객관적 효력을 단정하지 않고 생활 편의·안정감·비용·체감 에너지로 번역','v72-fit',['이 집에서 가장 만족도가 높을 생활 요소','동선·채광·소음·공간감 중 실제 적합도가 높은 부분','금전 부담과 관리비·계약 측면의 현실 부담','건강·휴식에 영향을 줄 수 있어 현장에서 확인할 환경 요소','내가 이 공간에서 느낄 정서적 안정감 또는 불편','계약 전 반드시 현실적으로 확인할 항목'])); break;
      case'housing_noise':
        C.push(yesNoEvidence('새 집 이웃/층간소음 · 리스크 점검','생활 소음 스트레스가 의미 있게 발생할','현장 방문·관리실·시간대별 확인으로 검증할 현실 신호')); break;
      case'deposit_return':
        C.push(makeSp('전세보증금 반환 · 절차/리스크 체크','타로로 지급을 보장하지 않고 임대인 여력·일정·문서·법적 보호장치를 점검하는 구조','v72-legal',['반환이 원활하게 진행될 가능성을 지지하는 현재 신호','지연·분쟁 가능성을 높이는 현실 위험요인','임대인과의 소통·일정에서 확인할 신호','계약서·보증·증빙 등 미리 점검할 보호장치','문제가 생길 경우 지체하지 말고 전문가/공식 절차를 검토해야 할 기준'])); break;
      case'manager_style':
        C.push(makeSp('새 팀장 · 업무 스타일/요구 역량','성향 추측을 업무 지시·평가 방식·소통 패턴으로 구체화','v72-career',['팀장이 일을 맡기고 통제하는 기본 스타일','팀장이 성과로 가장 높게 평가하는 기준','나에게 특히 기대할 가능성이 큰 역량','팀장이 예민하게 반응하거나 싫어할 업무 습관','소통할 때 가장 효과적인 방식','초반에 관계를 안정시키기 위해 보여줄 현실 행동'])); break;
      case'office_politics':
        C.push(makeSp('사내 견제/정치 · 사실과 해석 분리','누군가의 악의를 기정사실화하지 않고 관찰 가능한 행동과 대안 설명을 함께 둔다','v72-evidence',['나를 견제·배제하는 패턴이 실제로 반복됨을 지지하는 신호','업무 사정·성향 차이·우연으로 설명되는 반대 신호','상대가 경쟁심을 느낄 수 있는 구조적 이유','내 평판에 실제 영향을 주는 행동과 단순 불쾌감을 구분하는 기준','감정 소모를 줄이면서 기록·소통·경계를 세울 현실 대처'])); break;
      case'promotion_salary':
        C.push(makeSp('승진/연봉협상 · 평가축/협상력','결과를 운명처럼 확정하지 않고 성과 증거·평가자 관점·협상 레버를 본다','v72-career',['현재 승진/인상에 유리하게 작용하는 객관적 성과 자산','평가에서 약점 또는 보완 필요로 보일 부분','의사결정자가 가장 중요하게 보는 기준','내가 협상에서 실제로 사용할 수 있는 레버리지','기대치가 과도할 수 있는 지점','결과 전까지 준비할 증빙·대화 전략'])); break;
      case'creator_growth':
        C.push(makeSp('채널 성장 · 콘텐츠/알고리즘 적합도','알고리즘을 점치기보다 시청자 반응과 실험 가능한 콘텐츠 방향을 분리','v72-creator',['현재 채널에서 이미 반응을 얻는 핵심 요소','새 유입을 막는 가장 큰 콘텐츠/포맷 병목','다음 실험에서 강화할 주제·형식의 방향','반응이 생기기 시작했음을 보여줄 현실 지표','성장 욕심 때문에 브랜드 정체성을 흐릴 위험','다음 4주에 우선 테스트할 한 가지 가설'])); break;
      case'creator_deal': C.push(twoChoice('협찬/광고 수락 vs 거절 · 브랜드 적합도','협찬을 수락하는','협찬을 거절하거나 보류하는','수익·신뢰·채널 이미지의 장기 균형')); break;
      case'overseas':
        C.push(makeSp('해외/유학/워홀 · 적응/승인/취업','비자 승인을 카드로 보장하지 않고 준비도와 현실 리스크를 분리','v72-overseas',['현지 적응에서 가장 빨리 익숙해질 영역','언어·생활·문화·외로움 중 가장 큰 난관','도움을 받을 수 있는 사람·제도·자원','비자/서류 과정에서 반드시 확인할 현실 조건','취업 연결에서 강점으로 작용할 경험·역량','진행 여부를 판단할 공식 일정·서류·채용 신호'])); break;
      case'dating_app':
        C.push(makeSp('데이팅 앱 상대 · 목적/현실 리스크 4','프로필 연출과 실제 목적, 만남 리스크, 1개월 흐름을 분리','v72-dating',['상대가 앱에서 겉으로 어필하는 관계 이미지','실제로 원하는 관계의 성격과 진지함 정도','오프라인에서 확인해야 할 안전·일관성·경계 신호','관계를 진행했을 때 1개월 안에 드러날 현실적 패턴'])); break;
      case'fandom_luck':
        C.push(makeSp('티켓/팬싸/가챠 · 운보다 결정 통제형','무작위 결과를 예언하지 않고 예산·확률·실행 타이밍·후회 가능성을 정리','v72-random',['내가 이번 시도에 기대하는 핵심 보상','실패했을 때 감정·비용 부담의 크기','공식 확률·응모 조건·예산에서 먼저 확인할 현실 정보','추가 지출/재시도 욕구를 키울 심리적 함정','정해둔 한도 안에서 시도/중단을 가를 기준'])); break;
      case'friend_jealousy':
        C.push(makeSp('친구 기싸움/질투 · 태도/해석 분리 4','친구의 내면을 악의로 확정하지 않고 표면 태도·경쟁감·관계 구도·대처를 분리','v72-social',['친구가 겉으로 보이는 태도와 실제 상호성','내 성공/연애/평가가 경쟁감이나 비교심을 자극할 가능성','둘 사이의 보이지 않는 힘겨루기 또는 오해 구조','유지·거리두기·정리 중 후회를 줄일 현실 경계'])); break;
      case'small_debt':
        C.push(makeSp('친구 돈 독촉 · 회수/관계 경계','돈과 우정을 섞지 않고 상환 가능성·소통 방식·관계 경계를 본다','v72-money',['상대가 현재 상환 의무를 얼마나 현실적으로 인식하는지','지급이 늦어지는 이유 중 현실 사정과 회피의 비중','정색하고 기한을 제시했을 때 예상되는 관계 반응','관계를 덜 해치면서도 돈 문제를 분명히 할 문구·방식','추가 차용이나 모호한 약속을 막기 위해 세울 경계'])); break;
      case'ex_compare':
        C.push(makeSp('전애인의 새 연애와 나 비교 · 감정/행동 분리','비교가 있더라도 그것이 재회 행동과 같지 않음을 분리','v72-mirror',['현재 새 상대에게서 만족하는 부분','새 관계에서 아쉽거나 충족되지 않는 부분','과거 나와의 관계를 떠올리게 되는 비교 포인트','그 비교가 단순 추억인지 실제 아쉬움인지 가르는 신호','비교 감정이 실제 연락/행동으로 이어지는지 별도 판단 기준'])); break;
      case'impulse_choice':
        if(/약속|모임|술자리/i.test(q))C.push(dayDecision('오늘 약속 취소 vs 참석 · 에너지 선택','약속에 참석','약속을 취소/축소'));
        else C.push(twoChoice('지금 지르기 vs 보류 · 후회 최소화','지금 구매','며칠 보류','실사용 가치·현금흐름·후회 가능성')); break;
      case'report_timing': C.push(dayDecision('업무 보고/답장 타이밍 · 오늘 선택','지금/오전에 보고·답장','오후/내일로 미루기')); break;
      case'marriage_family':
        if(/파혼|엎|밀고\s*나가|결혼.{0,8}맞을까/i.test(q))C.push(twoChoice('결혼 진행 vs 중단/보류 · 장기 리스크','결혼을 예정대로 진행','일단 보류하거나 중단','신뢰·금전·갈등 해결 가능성'));
        else C.push(makeSp('결혼/상견례 · 숨은 갈등과 현실 조건','양가 감정과 실제 금전·생활 조건을 분리','v72-family',['현재 두 사람/양가가 겉으로 합의된 부분','말하지 않았지만 불만이나 부담으로 남은 부분','금전·빚·주거·가사에서 반드시 명확히 확인할 현실 조건','상견례/준비 과정에서 갈등이 커지는 트리거','갈등이 생겨도 조율 가능함을 보여주는 신호','결혼 전 대화로 확정해야 할 핵심 합의'])); break;
      case'part_time':
        C.push(makeSp('알바/고용주 · 근무환경/급여 체크','사장 속마음보다 근무조건·지급·기록·경계에 초점을 둔다','v72-work',['기존 근무자와의 분위기·적응 난이도','업무 강도와 공지된 조건의 일치 정도','급여·주휴·야간수당 등 지급에서 확인할 문서/기록','부당하거나 애매한 요구가 생길 수 있는 지점','문제가 생겼을 때 증빙을 남기고 도움을 요청할 기준'])); break;
      case'marketplace': C.push(yesNoEvidence('중고거래 · 진상/네고 리스크','거래 중 과도한 네고·약속 변경·분쟁이 발생할','안전결제·장소·증빙으로 리스크를 낮출 현실 조치')); break;
      case'roommate':
        if(/내\s*방|몰래|물건/i.test(q))C.push(yesNoEvidence('룸메 사생활 침해 · 사실/대안설명 판별','룸메가 허락 없이 내 공간이나 물건을 사용했을','의심만 키우지 않고 잠금·합의·확인 가능한 생활 규칙'));
        else C.push(makeSp('룸메/동거 갈등 · 생활/비용/경계','상대 속마음보다 실제 마찰 영역과 해결 가능성을 본다','v72-room',['청소·소음·수면·생활시간 중 가장 큰 마찰 지점','상대가 불편하지만 직접 말하지 않는 부분','내가 상대에게 불편하지만 참고 있는 부분','월세·공과금·공용물품 정산에서 분쟁이 생길 지점','대화로 조정 가능한 것과 구조적으로 안 맞는 것','유지/퇴거/거리두기를 가를 현실 기준'])); break;
      case'online_community':
        if(/저격|나를\s*겨냥|다른\s*방|따돌|뒷이야기/i.test(q))C.push(yesNoEvidence('온라인 집단/익명글 · 나를 겨냥했나','해당 행동이나 글이 실제로 나를 특정해 겨냥했을','직접 증거가 없을 때 다른 설명을 우선 확인할 기준'));
        else C.push(makeSp('랜선 관계 · 온라인 페르소나 vs 현실 4','텍스트 관계의 친밀감과 현실 만남 적합성을 분리','v72-online',['상대가 온라인에서 연출하는 페르소나와 장점','상대의 현실 상황·생활 리듬에서 드러날 수 있는 차이','오프라인 만남 시 가장 크게 느껴질 괴리 또는 확인점','이 관계가 현실에서도 유지되는지 가르는 행동·일관성 신호'])); break;
      case'freelance':
        if(/단가|인상|협상/i.test(q))C.push(makeSp('프리랜서 단가 협상 5','내 가치·상대 예산·강경/유연 반응·최적 포지션을 분리','v72-negotiation',['클라이언트가 현재 내 작업을 평가하는 객관적 가치','상대의 실제 예산 여력과 우선순위','강하게 단가를 요구했을 때 예상되는 반응','유연하게 범위/조건을 조율했을 때 예상되는 반응','계약 유지와 수익을 함께 지키는 최적 협상 포지션']));
        else C.push(makeSp('클라이언트 이탈/계약 파기 · 신호 검증','연락 지연을 곧바로 이탈로 단정하지 않고 일정·예산·대체사 가능성을 분리','v72-evidence',['계약 축소/이탈 가능성을 지지하는 실제 행동 신호','단순 일정 지연·내부 사정으로 설명되는 반대 신호','상대가 현재 가장 불만족하거나 우려하는 지점','다른 대행사/경쟁안으로 이동할 가능성을 높이는 조건','관계를 유지하려면 먼저 확인할 질문·제안'])); break;
      case'travel_issue':
        C.push(makeSp('여행/출장 · 돌발변수/동행 트러블','사고를 예언하지 않고 일정·체력·갈등·안전 준비를 점검','v72-travel',['이번 일정에서 가장 즐거움이 커질 요소','동행자와 성향 차이가 드러날 가능성이 큰 지점','교통·예약·비용에서 계획 B가 필요한 부분','개인 안전·소지품·건강에서 보수적으로 준비할 항목','갈등이나 돌발 상황이 생겼을 때 일정을 지키는 것보다 먼저 조정할 기준','여행 후 관계/만족도를 좌우할 핵심 경험'])); break;
      case'creative':
        if(/vs|대중성|타협|사이다|절망/i.test(q))C.push(twoChoice('창작 방향 A vs B · 작품성/반응 비교','A 방향','B 방향','작품 정체성·독자 반응·지속 가능성'));
        else C.push(makeSp('창작 슬럼프/논란 · 방향/검증','영감과 시장반응을 분리하고 표절 여부는 실제 자료 비교가 필요함을 전제','v72-creative',['지금 가장 만들고 싶은 핵심 정서·주제','작업을 막는 완벽주의·피로·환경 병목','대중성 때문에 과하게 타협할 위험','반대로 독자/사용자 피드백에서 참고할 현실 신호','유사성/카피 우려가 있다면 실제 레퍼런스 비교로 확인할 지점','다음 작업을 다시 움직이게 할 작은 실험'])); break;
      case'inheritance':
        C.push(makeSp('상속/부양/형제 금전 갈등 · 이해관계 지도','가족 마음을 단정하지 않고 이해관계·문서·책임·대화 구조를 본다','v72-family-money',['각 가족 구성원이 가장 중요하게 생각하는 이해관계','돈·재산·부양 책임에서 아직 합의되지 않은 쟁점','감정적 편애로 느껴질 수 있는 부분과 실제 법적/재정 구조를 구분할 지점','갈등이 커질 가능성이 큰 대화 트리거','문서·비용·역할을 명확히 해야 할 항목','전문가 상담이 필요한 법적·재정적 쟁점'])); break;
      case'dream_symbolic':
        C.push(makeSp('꿈/가위눌림 · 상징과 현실 스트레스 4','초자연적 사실을 확정하지 않고 꿈의 상징·현실 고민·회피·오늘의 행동으로 번역','v72-symbolic',['꿈의 표면 장면이 연결되는 최근 현실 고민','무의식이 강조하고 있는 감정·상징적 메시지','내가 현실에서 피하거나 과도하게 걱정하는 부분','오늘 낮에 할 수 있는 현실적 안정·회복 행동'])); break;
      case'intuition_secret':
        C.push(makeSp('쎄한 촉 · 증거/대안설명/확인 4','직감을 팩트로 확정하지 않고 관찰 가능한 증거와 다른 설명을 같이 본다','v72-evidence',['내 직감이 반응한 구체적 행동·상황의 핵심','숨김/불일치를 의심할 만한 실제 반복 신호','불안·과거 경험·오해로도 설명될 수 있는 반대 가능성','추궁보다 먼저 확인할 객관적 정보·대화 방식'])); break;
      case'plant':
        C.push(makeSp('반려식물 · 환경 스트레스 3','식물 상태는 실제 잎·흙·뿌리·빛 조건을 확인하는 것이 우선이며 카드는 관리 우선순위를 정리하는 보조로 사용','v72-plant',['물주기·배수·뿌리 상태에서 먼저 확인할 스트레스 요인','빛·통풍·온습도 중 조정 가치가 큰 환경 요소','분갈이·위치 변경·관찰 중 다음에 취할 관리 우선순위'])); break;
      case'lost_item':
        C.push(makeSp('분실물 탐색 3 · 환경/인접물/회수','카드가 GPS처럼 위치를 증명하지 않는다는 전제에서 검색 범위를 좁히는 상징적 체크리스트','v72-search',['물건이 있을 가능성을 먼저 확인할 공간 특성: 실내/실외·높은/낮은 곳·이동 동선','주변에 있을 법한 물질·물건 특성: 패브릭·금속·가방·틈새 등','다시 찾기 위해 실제로 되짚을 동선과 확인 순서'])); break;
      case'object_energy':
        C.push(makeSp('상징/에너지 질문 · 현실 grounding 4','전생·액땜·사물 기운을 객관적 사실로 확정하지 않고 상징이 현재 감정과 선택에 주는 의미를 탐색','v72-symbolic',['이 상징/물건/공간이 내게 불러일으키는 가장 강한 감정','그 감정이 연결되는 현재의 현실 경험이나 기억','초자연적 설명 없이도 확인 가능한 환경·심리적 요인','이 상징을 도움이 되는 방향으로 해석하고 행동에 옮길 방법'])); break;
      case'food_choice': C.push(twoChoice('오늘 먹을 것 A vs B · 만족/부담 비교','A 메뉴','B 메뉴','만족도·예산·다음날 체감 부담')); break;
      case'digital_detox':
        C.push(makeSp('디지털 디톡스 · 7일 실험','도파민 수치를 카드로 측정하지 않고 습관·집중·불편·대체행동을 점검','v72-habit',['SNS/쇼츠 사용에서 가장 강한 자동 트리거','일주일 삭제 시 초반 가장 불편할 순간','대신 채워야 할 활동·보상','집중력이 회복되고 있음을 확인할 현실 지표','다시 설치했을 때 재발을 막을 사용 규칙'])); break;
      case'driving':
        C.push(makeSp('운전/중고차 · 안전 우선 체크','사고나 숨은 결함을 타로로 판정하지 않고 보수적 안전점검·검사·동선 준비를 우선','v72-safety',['오늘/이번 이동에서 내가 가장 피로하거나 판단이 흔들릴 수 있는 지점','출발 전 실제로 확인할 차량·날씨·경로·휴식 조건','주차/차선/시간대에서 스트레스를 줄일 선택','중고차라면 성능기록부·보험이력·정비점검으로 확인할 항목','불안하거나 이상 신호가 있으면 운전/구매를 보류해야 할 기준'])); break;
      case'social_escape':
        C.push(makeSp('회식/모임 눈치 탈출 3','겉반응·뒤끝/평판·최선의 액션을 분리','v72-social',['빠져나가거나 답장을 미뤘을 때 상대의 겉반응','다음 날 남을 수 있는 실제 업무/평판 영향','멘탈과 관계를 모두 지키는 가장 무리 없는 커뮤니케이션 방식'])); break;
      case'exam_day':
        if(/vs|자리|아침밥|공복|직감|고쳐/i.test(q)) C.push(dayDecision('시험 당일 즉시 선택 · A vs B 3카드','A 선택을','B 선택을'));
        else C.push(makeSp('시험 당일 · 루틴/집중/실수 관리','합격 예언보다 이미 검증한 루틴과 실수 방지에 초점','v72-exam',['시험 전 가장 안정적으로 유지할 루틴','시험장에서 집중을 깨뜨릴 수 있는 변수','시간 배분에서 지킬 원칙','헷갈리는 문제를 바꿀지 유지할 현실 기준','시험 직전 새 시도보다 피해야 할 행동'])); break;
      case'pet':
        C.push(makeSp('반려동물 · 행동/스트레스/적응 4','동물의 마음을 인간 언어로 단정하지 않고 행동 신호·환경 변화·교감·전문가 확인을 분리','v72-pet',['최근 행동에서 스트레스 또는 욕구를 시사할 수 있는 변화','환경·루틴·사람/동물 관계에서 부담이 될 수 있는 요소','안정감과 유대감을 높일 돌봄·놀이·공간 조정','식욕·배변·통증·행동 변화가 지속될 때 수의사에게 확인할 기준'])); break;
    }
    return C;
  }

  function structuralFallback(s){
    const q=s.question;
    if(s.timeRange==='year'){
      return [makeSp('12개월 연간 흐름 · 월별 12카드','연간 질문일 때만 1월~12월을 각각 독립 포지션으로 배치','v72-yearly',Array.from({length:12},(_,i)=>`${i+1}월의 핵심 테마·기회·주의점`))];
    }
    if(s.structure==='choice')return [twoChoice('A/B 양자택일 · 대칭 5카드','A 선택','B 선택','장기 실익·리스크·후회 가능성')];
    if(s.structure==='observation'||s.structure==='yesno')return [yesNoEvidence('단순 유무 · 증거/반증 3카드','질문한 가설이 성립할')];
    if(s.timeRange==='today'&&/(할까|가는\s*게|먹을까|보고|답장|운동|모임|구매)/i.test(q))return [dayDecision('당일 행동 · 실행 vs 보류 3카드','지금 실행','미루거나 보류')];
    if(s.structure==='timeline')return [timing5('시기/흐름 · 5카드 타임라인','질문한 사건')];
    if(s.structure==='perception')return [deepFeeling('상대 인식/심리 · 4카드')];
    if(s.structure==='cause')return [makeSp('원인 분석 · 표면/근본/유지/전환 5','왜 그런지 한 가지 이유로 단정하지 않고 층별로 분리','v72-cause',['겉으로 가장 직접적인 원인','그 아래의 감정·욕구 또는 구조적 원인','상황을 계속 유지시키는 반복 요인','원인처럼 보이지만 실제로는 부차적일 수 있는 요소','흐름을 바꾸는 현실적 전환점'])];
    return [];
  }

  function axesText(s){return `구조 ${s.axes.structure} · 시간 ${s.axes.time} · 대상 ${s.axes.target}${s.specialty?` · 특화 ${s.specialty}`:''}`;}

  async function designSpreadV72(question){
    const baseSem=BASE.analyze(question);
    const sem=enrich(baseSem);
    W.LUNEA_V7_LAST_SEMANTIC=baseSem;
    W.LUNEA_V72_LAST_SEMANTIC=sem;
    let c=specialtyCandidates(sem);
    if(!c.length)c=structuralFallback(sem);
    if(!c.length){
      const r=await oldDesign(question);
      r.designRationale=`${r.designRationale||'V7 기본 설계'} · V7.2 메타: ${axesText(sem)}`;
      return r;
    }
    const result=choose(c);
    result.designRationale=`${result.designRationale} · V7.2 메타: ${axesText(sem)} · 로컬 후보 ${c.length}개 중 최근 의미중복을 피해서 선택`;
    remember(sem,result);
    console.info('[LUNEA V7.2]',sem,result);
    return result;
  }

  function directiveV72(){
    const sem=W.LUNEA_V72_LAST_SEMANTIC;
    let base=''; try{base=oldDirective?oldDirective():''}catch{}
    if(!sem)return base;
    const extra=[];
    extra.push(`\n[V7.2 질문 메타]\n- 질문 구조: ${sem.axes.structure}\n- 시간 범위: ${sem.axes.time}\n- 관계/대상 범위: ${sem.axes.target}`);
    if(sem.risk.includes('unverified_fact'))extra.push(`\n[사실 미확인 질문 규칙]\n- 카드로 타인의 숨은 행동, 외도, 뒷담화, 사생활 침해, 숨은 빚, 결함 등을 객관적 사실처럼 확정하지 않는다.\n- 지지 신호와 반대 설명을 함께 제시하고, 실제 판단은 관찰 가능한 증거·문서·대화로 확인하도록 구분한다.`);
    if(sem.risk.includes('legal'))extra.push(`\n[법률/계약 질문 규칙]\n- 승소, 보증금 반환, 급여 지급, 계약 성사 등을 법적 사실이나 보장처럼 단정하지 않는다.\n- 문서, 기한, 증빙, 공식 절차, 전문가 상담이 필요한 지점을 현실 기준으로 분리한다.`);
    if(sem.risk.includes('financial'))extra.push(`\n[금전 질문 규칙]\n- 타로 결과만으로 고액 구매·투자·대출·계약을 권하지 않는다.\n- 현금흐름, 예산, 계약조건, 손실 가능성 같은 현실 기준을 반드시 같이 본다.`);
    if(sem.risk.includes('health_safety'))extra.push(`\n[건강/안전 질문 규칙]\n- 질병·부작용·사고·수면 문제를 카드로 진단하거나 예측하지 않는다.\n- 안전을 해칠 수 있는 선택은 카드보다 실제 컨디션, 의료상담, 차량점검, 공식 정보가 우선이라고 명확히 구분한다.`);
    if(sem.symbolicMode)extra.push(`\n[영성/초자연 질문 규칙]\n- 전생, 액땜, 예지몽, 영적 존재, 사물의 부정적 에너지 등을 실제 사실로 확인해 주지 않는다.\n- 상징적·심리적 탐색으로 다루고, 현실에서 확인 가능한 환경·감정·행동 요인과 연결한다.`);
    if(sem.domains.includes('pet'))extra.push(`\n[반려동물 질문 규칙]\n- 동물의 속마음을 인간 문장으로 확정하지 말고 행동·환경 변화에서 추론 가능한 범위만 말한다. 지속되는 이상 행동이나 건강 변화는 수의사 확인이 우선이다.`);
    if(sem.domains.includes('plant'))extra.push(`\n[반려식물 질문 규칙]\n- 식물 상태는 잎·흙·뿌리·빛·배수·통풍 같은 실제 조건을 먼저 확인한다. 카드는 관리 우선순위를 정리하는 보조로만 사용한다.`);
    return base+extra.join('');
  }

  W.designSpread = designSpreadV72;
  W.readingDirective = directiveV72;
  W.LUNEA_SPREAD_ENGINE_V72 = {analyze:(q)=>enrich(BASE.analyze(q)),specialtyCandidates,structuralFallback,designSpread:designSpreadV72,memory};

  const badge=document.querySelector('.engine-strip span:last-child');
  if(badge)badge.innerHTML='<b>Secure Draw + Spread V7.2</b> · 3축 Intent 메타 · 초세부 주제 라우팅 · 안전형 사실/반증 분리 · 최근 배열 중복 방지';
  const aiItem=[...document.querySelectorAll('.reading-item')].find(x=>x.dataset?.title==='질문 맞춤 AI 배열');
  if(aiItem){
    aiItem.dataset.desc='V7.2가 질문 구조·시간 범위·관계 대상을 먼저 태깅하고, 연애/재회/직장/뷰티/주거/창작/랜선/가족/펫 등 초세부 템플릿으로 자동 배치합니다.';
    const p=aiItem.querySelector('p');if(p)p.textContent='3축 태깅 → 초세부 주제 매핑 → 후보 비교 → 범위이탈/과잉단정 차단.';
    const cnt=aiItem.querySelector('.count');if(cnt)cnt.textContent='AI 2~12';
  }
  console.info('🌙 LUNEA Spread Engine V7.2 addon loaded');
})();
