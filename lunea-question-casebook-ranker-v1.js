'use strict';

/*
  LUNEA QUESTION CASEBOOK RANKER V1
  ==================================
  Precision ranking layer for Casebook V1.
  Uses longer Korean character n-grams + explicit structural cues so generic
  phrases such as "있는지" do not outrank the actual intent.
*/
(() => {
  const W=window;
  const book=W.LUNEA_QUESTION_CASEBOOK_V1;
  if(!book||!Array.isArray(book.cases)||W.__LUNEA_QUESTION_CASEBOOK_RANKER_V1__)return;
  W.__LUNEA_QUESTION_CASEBOOK_RANKER_V1__=true;

  function norm(v){
    return String(v||'').normalize('NFKC').toLowerCase()
      .replace(/디엠/g,'dm').replace(/카톡/g,'메시지')
      .replace(/선톡/g,'먼저연락').replace(/프사/g,'프로필사진')
      .replace(/프뮤/g,'프로필음악').replace(/상메/g,'상태메시지')
      .replace(/[^0-9a-z가-힣]+/g,'');
  }
  function words(v){
    return new Set(String(v||'').normalize('NFKC').toLowerCase()
      .replace(/[^0-9a-z가-힣]+/g,' ').split(/\s+/).filter(x=>x.length>=2));
  }
  function grams(v,n){
    const s=norm(v),o=new Set();
    for(let i=0;i<=s.length-n;i++)o.add(s.slice(i,i+n));
    return o;
  }
  function jac(a,b){
    if(!a.size||!b.size)return 0;let h=0;a.forEach(x=>b.has(x)&&h++);
    return h/Math.max(1,new Set([...a,...b]).size);
  }
  function overlap(a,b){
    if(!a.size||!b.size)return 0;let h=0;a.forEach(x=>b.has(x)&&h++);
    return h/Math.max(1,Math.min(a.size,b.size));
  }
  function countMatches(q,arr){return arr.reduce((n,re)=>n+(re.test(q)?1:0),0)}
  function cueBoost(id, raw){
    const q=String(raw||'').normalize('NFKC').toLowerCase();
    const has=(re)=>re.test(q);
    let b=0;

    if(id==='romance_reply_timing_scenarios'){
      const times=countMatches(q,[/지금|바로/,/몇\s*시간|좀\s*있다/,/내일/,/더\s*늦|나중/]);
      if(has(/답장|디엠|dm|메시지/)&&times>=2)b+=1.25;
    }
    if(id==='scenario_message_tone'&&has(/답장|메시지/)&&countMatches(q,[/길게/,/짧게/,/이모티콘|ㅋㅋ|ㅎㅎ/,/말투|톤/])>=2)b+=1.1;
    if(id==='scenario_contact_channel'&&countMatches(q,[/카톡|메시지/,/디엠|dm/,/전화/,/문자/])>=2)b+=1.1;

    const thought=has(/생각|떠올|기억/), feeling=has(/감정|마음|좋아|그리|미련/), action=has(/연락|행동|움직|다가|답장/);
    if(id==='compound_romance'&&[thought,feeling,action].filter(Boolean).length>=2)b+=.95;
    if(id==='romance_thought_frequency'&&thought)b+=.48;
    if(id==='romance_feeling_action_gap'&&feeling&&action&&has(/왜|안\s*하|없|못|않/))b+=.85;
    if(id==='romance_contact_decision'&&has(/내가|먼저|선톡/)&&has(/연락|메시지|디엠|dm/))b+=.75;
    if(id==='romance_why_no_contact'&&has(/왜/)&&has(/연락|선톡/)&&has(/안|없|못|않/))b+=.9;

    if(id==='romance_observation_profile'&&has(/프사|프로필\s*사진/)&&has(/봤|확인|보았|봤을/))b+=1.1;
    if(id==='romance_signal_intent'&&has(/프뮤|프로필\s*음악|상메|상태\s*메시지|노래|게시|스토리/)&&has(/바꾼|올린|나\s*보라고|의식|신호/))b+=1.0;
    if(id==='social_stalking_observation'&&has(/부계|익명\s*계정|염탐\s*계정|계정/)&&has(/누구|걔|전남|전여|그\s*사람/))b+=1.0;
    if(id==='romance_third_party'&&has(/제3자|다른\s*(여자|남자|이성|사람)|새\s*사람\s*(있|생)|양다리/))b+=1.25;

    const pair=has(/a\s*(?:와|과|랑|\/|vs)\s*b|a\/b|두\s*(?:사람|명|대상)|둘\s*다/i);
    if(id==='romance_ab_people_compare'&&pair&&has(/사람|상대|감정|마음|생각|연락|행동|인연/))b+=1.2;
    if(id==='choice_ab_options'&&has(/a|b|둘\s*중|vs|선택/)&&has(/회사|직장|안\b|선택지|어디|뭐가\s*나|고르/))b+=1.05;
    if(id==='romance_unknown_past_count'&&has(/과거|옛|전남|전여|인연/)&&has(/몇\s*(명|사람|인연)|한\s*명인지|여러\s*명/))b+=1.15;

    if(id==='event_post_date'&&has(/소개팅|데이트|만나/)&&has(/보고\s*왔|하고\s*왔|끝났|끝남|만나고|했는데/))b+=1.0;
    if(id==='career_interview_post'&&has(/면접/)&&has(/보고\s*왔|끝났|끝남|봤는데|이후|잘\s*본/))b+=1.25;
    if(id==='event_pre_scheduled'&&has(/소개팅|면접|약속|미팅/)&&has(/예정|내일|모레|이번\s*주|잡혀|앞두/)&&!has(/보고\s*왔|끝났/))b+=1.0;
    if(id==='event_pre_opportunity'&&has(/소개팅|면접|제안|기회/)&&has(/들어올|생길|잡힐|제안|아직/)&&!has(/예정|잡혀|보고\s*왔/))b+=.85;
    if(id==='career_offer_opportunity'&&has(/이직|헤드헌터|프로젝트|직장/)&&has(/제안|연락\s*올|기회|오퍼/))b+=1.0;

    if(id==='career_job_change'&&has(/이직|퇴사|옮길|지금\s*회사|현\s*직장/)&&has(/남|유지|비교|말까|옮/))b+=1.0;
    if(id==='career_reputation'&&has(/회사|직장|상사|동료/)&&has(/평판|평가|어떻게\s*보|인상/))b+=.95;
    if(id==='career_manager_intent'&&has(/상사|팀장|부장/)&&has(/왜|이유|태도|일\s*더/))b+=.9;
    if(id==='exam_outcome'&&has(/시험|합격/)&&has(/붙|합격|결과|가능성/))b+=1.0;
    if(id==='exam_strategy'&&has(/시험|공부/)&&has(/남았|보완|전략|점수|버릴/))b+=.85;
    if(id==='study_procrastination'&&has(/공부|책/)&&has(/미루|딴짓|집중|왜/))b+=.95;

    if(id==='stock_hold_sell'&&has(/주식|종목|보유/)&&has(/팔|매도|들고|보유|정리/))b+=1.0;
    if(id==='stock_add_position'&&has(/추매|물타기|추가\s*매수/))b+=1.2;
    if(id==='business_launch'&&has(/출시|런칭|서비스|제품/)&&has(/지금|미룰|진행|결정/))b+=.9;
    if(id==='business_problem_cause'&&has(/프로젝트|서비스|사업/)&&has(/왜|병목|막히|안\s*굴|반응\s*없/))b+=.95;
    if(id==='move_choice'&&has(/이사|집|주거/)&&has(/갈까|옮|유지|살까/))b+=.9;
    if(id==='travel_choice'&&has(/여행/)&&has(/갈까|미룰|컨디션|비용/))b+=.9;
    if(id==='purchase_decision'&&has(/살까|구매|바꾸|폰|제품/)&&has(/후회|충동|쓸|가치|말까/))b+=.85;

    if(id==='self_emotion'&&has(/나|내/)&&has(/예민|감정|마음|왜\s*이|이해\s*안/))b+=.8;
    if(id==='wellbeing_safe'&&has(/피곤|컨디션|몸\s*상태|회복|수면/))b+=.95;
    if(id==='family_conflict_loop'&&has(/엄마|아빠|부모|가족/)&&has(/싸|갈등|반복|맨날/))b+=1.0;
    if(id==='social_conflict_cause'&&has(/친구|지인|동료/)&&has(/차가|피하|싸|갈등|왜/))b+=.9;
    if(id==='social_perception'&&has(/모임|사람들|처음\s*만난/)&&has(/인상|이미지|어떻게\s*보/))b+=.85;

    if(id==='general_timing'&&has(/언제|시기|타이밍|전조|방아쇠/))b+=.65;
    if(id==='yesno_evidence'&&has(/될까|올까|성사|가능|불가능|yes|no/)&&has(/근거|지지|반증|확정\s*말고/))b+=.75;
    if(id==='advice_only'&&has(/조언|내\s*대응|뭘\s*해야|덜\s*후회/)&&has(/상대\s*마음\s*말고|대응|행동/))b+=.85;
    return b;
  }

  function score(question,c){
    const q3=grams(question,3),q4=grams(question,4),qw=words(question);
    let best=0,sample=c.queries[0]||'';
    for(const s of c.queries){
      const sc=jac(q3,grams(s,3))*.82+jac(q4,grams(s,4))*.58+overlap(qw,words(s))*.25;
      if(sc>best){best=sc;sample=s}
    }
    const axisText=[c.intent,c.target,...c.axes].join(' ');
    const semantic=jac(q3,grams(axisText,3))*.24;
    return {score:best+semantic+cueBoost(c.id,question),sample};
  }
  function find(question,limit=4){
    if(!String(question||'').trim())return[];
    return book.cases.map(c=>({case:c,...score(question,c)}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,Math.max(1,Math.min(8,Number(limit)||4)))
      .filter(x=>x.score>.06);
  }
  function formatForPrompt(question,limit=4){
    const rows=find(question,limit);
    if(!rows.length)return '관련 사례 없음';
    return rows.map((r,i)=>`[사례 ${i+1}]\n사용자 표현 예: ${r.sample}\n정확한 구조: ${r.case.intent}\n대상 구조: ${r.case.target}\n보존할 축: ${r.case.axes.join(' / ')}\n금지 오분류: ${r.case.avoid.join(' / ')}`).join('\n\n');
  }

  book.find=find;
  book.formatForPrompt=formatForPrompt;
  book.rankerVersion=1;
  console.info('🎯 LUNEA Question Casebook Ranker V1 installed');
})();
