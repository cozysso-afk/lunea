'use strict';
/* LUNEA deterministic contact action policy V1.
 * This is a reproducible symbolic verdict, NOT an empirical probability.
 * No card redraw, no prior-reading dependence, no astrology/oracle inputs.
 */
(() => {
  const W = typeof window !== 'undefined' ? window : null;
  if (!W || W.LUNEA_CONTACT_PREDICTION_V1) return;
  const VERSION = 'contact-prediction-v1.0.0';
  const MAJOR = Object.freeze({
    Fool:1, Magician:2, 'High Priestess':-1, Empress:0, Emperor:0,
    Hierophant:0, Lovers:0, Chariot:2, Strength:-1, Hermit:-2,
    Wheel:1, Justice:0, 'Hanged Man':-2, Death:-2, Temperance:-1,
    Devil:0, Tower:0, Star:0, Moon:-1, Sun:1, Judgement:2, World:-1
  });
  // Ace, Two..Ten, Page, Knight, Queen, King. Zero is neutral for
  // a CONTACT ACTION even when a card is positive about feelings.
  const MINOR = Object.freeze({
    Wands:[1,0,1,0,-1,1,-1,2,-1,-1,2,2,0,1],
    Cups:[1,1,1,-1,-1,0,-1,-2,0,0,2,2,0,0],
    Swords:[1,-1,-1,-2,-1,-1,0,-2,-2,-2,1,2,0,0],
    Pents:[1,0,1,-1,-1,0,-1,0,0,0,1,1,0,0]
  });
  const OVERRIDES = {
    reply:{World:-2,Cups08:-2,Swords04:-2,Swords02:-1,Cups11:1,Wands08:2},
    new_topic:{World:0,Cups08:-1,Cups11:2,Wands11:2,Swords02:-1},
    call:{Cups11:0,Wands11:0,Swords11:0,Wands08:1,Swords12:2,Cups12:1}
  };
  const LABEL={reply:'기존 메시지 답장',new_topic:'새 화제 선연락',call:'먼저 전화'};
  const norm=x=>String(x??'').normalize('NFKC').replace(/\s+/g,' ').trim();

  function cardCode(card) {
    const code=norm(card?.code);
    if(Object.prototype.hasOwnProperty.call(MAJOR,code) || /^(Wands|Cups|Swords|Pents)(0[1-9]|1[0-4])$/.test(code)) return code;
    const n=norm(card?.name||card?.text);
    for(const m of Object.keys(MAJOR)) if(n.includes(m)) return m;
    const names=['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
    const match=n.match(/(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King)\s+of\s+(Wands|Cups|Swords|Pents)/i);
    if(!match) return '';
    const suit=Object.keys(MINOR).find(s=>s.toLowerCase()===match[2].toLowerCase());
    const r=names.findIndex(x=>x.toLowerCase()===match[1].toLowerCase())+1;
    return suit && r?suit+String(r).padStart(2,'0'):'';
  }
  function eventFromQuestion(q) {
    q=norm(q);
    if(!/(카톡|문자|메시지|답장|회신|연락|전화|선톡)/.test(q)) return null;
    if(/(새(?:로운)?\s*화제|다른\s*화제|새\s*주제|새\s*대화|선톡|먼저\s*(?:연락|카톡|문자|메시지)|연락을\s*먼저)/.test(q)) return 'new_topic';
    if(/(답장|회신|읽고\s*답|메시지에\s*답)/.test(q)) return 'reply';
    if(/(먼저\s*전화|전화를\s*걸|전화(?:를)?\s*먼저)/.test(q)) return 'call';
    return null;
  }
  function dateValue(y,m,d) {
    const date=new Date(Date.UTC(y,m-1,d));
    return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date.toISOString().slice(0,10):'';
  }
  function parseDeadline(q,asOf) {
    q=norm(q);
    const now=new Date(asOf);
    if(!Number.isFinite(now.getTime())) return null;
    const hits=[];
    for(const m of q.matchAll(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/g)) {
      const d=dateValue(+m[1],+m[2],+m[3]);if(d)hits.push(d);
    }
    for(const m of q.matchAll(/(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/g)) {
      const d=dateValue(+m[1],+m[2],+m[3]);if(d)hits.push(d);
    }
    if(hits.length)return {date:hits.sort().at(-1),source:'explicit'};
    for(const m of q.matchAll(/(?:(20\d{2})년\s*)?(\d{1,2})월\s*(말일|말까지|말)/g)){
      const month=+m[2];if(month<1||month>12)continue;
      const year=m[1]?+m[1]:(month<now.getMonth()+1?now.getFullYear()+1:now.getFullYear());
      const last=new Date(Date.UTC(year,month,0)).getUTCDate();
      hits.push(dateValue(year,month,last));
    }
    if(hits.length)return {date:hits.sort().at(-1),source:'month_end'};
    const hours=q.match(/(\d{1,3})\s*시간\s*(?:안|내|이내)/);
    if(hours)return {instant:new Date(now.getTime()+Number(hours[1])*3600000).toISOString(),source:'relative_hours'};
    const days=q.match(/(\d{1,3})\s*일\s*(?:안|내|이내)/);
    if(days)return {instant:new Date(now.getTime()+Number(days[1])*86400000).toISOString(),source:'relative_days'};
    return null;
  }
  function positionRole(p) {
    p=norm(p);
    if(/(전체\s*추가|추가\s*카드|extra)/i.test(p))return 'extra';
    if(/(시기별|시기\s*비교|타이밍|언제|(?:1[0-2]|[1-9])월)/.test(p))return 'timing';
    if(/(연락\s*수단|방법\s*비교|카카오톡|일반\s*문자|문자\s*연락|연락\s*방법)/.test(p))return 'channel';
    if(/(걸림돌|장벽|방해|제약|장애|반대\s*(?:근거|판단)|지연\s*요인)/.test(p))return 'obstacle';
    if(/(실제\s*(?:답장|선연락|연락|전화|행동|실행)|연락할\s*가능성|선연락\s*가능성|답장\s*여부|최종\s*(?:결과|판정)|결과\s*(?:및|·|\/|$)|실현\s*신호|YES\s*\/\s*NO)/i.test(p))return 'outcome';
    if(/(행동\s*의지|직접\s*(?:연락|실행)|실행\s*의향|먼저\s*(?:연락|전화|답장)|연락\s*의향)/.test(p))return 'action';
    if(/(긍정\s*(?:판단|근거)|유리한\s*근거)/.test(p))return 'support_positive';
    return 'context';
  }
  function scoreCard(card,kind) {
    const code=cardCode(card);
    // Reversals require their own validated rules; NEVER simply invert.
    if(card?.isReversed)return {code,score:null,reason:'역방향 행동 점수 미정'};
    if(!code)return {code:'',score:null,reason:'카드 식별 불가'};
    const base=Object.prototype.hasOwnProperty.call(MAJOR,code)?MAJOR[code]:MINOR[code.slice(0,-2)]?.[+code.slice(-2)-1];
    if(!Number.isFinite(base))return {code,score:null,reason:'카드 점수 미정'};
    const overrides=OVERRIDES[kind]||{};
    return {code,score:Object.prototype.hasOwnProperty.call(overrides,code)?overrides[code]:base};
  }
  function evaluate({question='',cards=[],asOf=new Date().toISOString(),spreadTitle=''}={}) {
    const kind=eventFromQuestion(question);
    if(!kind)return {eligible:false,version:VERSION,reason:'지원하는 연락 행동 질문이 아님'};
    const deadline=parseDeadline(question,asOf);
    if(!deadline)return {eligible:false,version:VERSION,kind,reason:'검증 가능한 종료일이 없음'};
    const evidence=[],skipped=[];
    for(const [index,card] of (Array.isArray(cards)?cards:[]).entries()) {
      const role=positionRole(card.position),sc=scoreCard(card,kind);
      const row={index:index+1,position:norm(card.position),role,code:sc.code,score:sc.score,isReversed:!!card.isReversed};
      if(['outcome','action','support_positive'].includes(role)&&sc.score!==null) {
        row.weight=role==='outcome'?3:role==='action'?1:0.5;
        if(role==='support_positive'&&row.score<0)row.score=0;
        evidence.push(row);
      } else skipped.push(row);
    }
    const hasOutcome=evidence.some(x=>x.role==='outcome');
    let verdict='UNDETERMINED',weightedScore=null,reason='채점 가능한 직접 결과 포지션이 없음';
    if(hasOutcome){
      const denom=evidence.reduce((s,x)=>s+x.weight,0);
      weightedScore=evidence.reduce((s,x)=>s+x.score*x.weight,0)/denom;
      verdict=weightedScore>=0.75?'YES':weightedScore<=-0.75?'NO':'UNDETERMINED';
      reason=verdict==='UNDETERMINED'?'행동 지지와 제한 신호가 결정적이지 않음':'결과 포지션 우선 고정 규칙 판정';
    }
    return {eligible:true,version:VERSION,kind,eventLabel:LABEL[kind],question:norm(question),
      spreadTitle:norm(spreadTitle),asOf:new Date(asOf).toISOString(),deadline,
      verdict,reason,weightedScore:weightedScore===null?null:Number(weightedScore.toFixed(4)),
      evidence,skipped,note:'상징적 리딩 판정이며 검증된 실제 사건 발생 확률이 아님'};
  }
  function attachPrompt(prompt,prediction) {
    if(!prediction?.eligible)return String(prompt||'');
    const label=prediction.verdict==='YES'?'YES 우세':prediction.verdict==='NO'?'NO 우세':'불확실';
    const details=prediction.evidence.map(e=>e.index+'번 '+e.code+' ['+e.role+'] ('+e.score+')').join(' / ');
    return String(prompt||'')+'\n\n[연락 행동 판정 엔진 · 읽기 전용]\n'
      +'버전: '+prediction.version+'\n검증 사건: '+prediction.eventLabel
      +'\n기한: '+(prediction.deadline.date||prediction.deadline.instant)
      +'\n사전 판정: '+label+'\n판정 근거: '+details
      +'\n지시: 사전 판정을 절대 바꾸지 말 것. AI는 카드별 지지·반대 근거만 설명할 것. '
      +'감정 카드로 실제 발신 행동을 단정하지 말 것. 시기 카드와 보조 오라클로 최종 판정을 변경하지 말 것. '
      +'고정 판정은 실제 미래 사건의 검증된 확률이 아님.';
  }
  function renderPanel(parent,prediction) {
    if(!parent||!prediction?.eligible||!W.document?.createElement)return;
    const label=prediction.verdict==='YES'?'YES 우세':prediction.verdict==='NO'?'NO 우세':'불확실';
    const box=W.document.createElement('div'),heading=W.document.createElement('h4'),body=W.document.createElement('div');
    box.className='ai-card lunea-prediction-v1';box.dataset.version=VERSION;
    box.style.cssText='margin-bottom:10px;border:1px solid rgba(130,234,220,.36);padding:10px;border-radius:12px';
    heading.textContent='📌 고정 판정 V1 · '+label;
    body.className='ai-body';
    body.textContent=prediction.eventLabel+' · 기한 '+(prediction.deadline.date||prediction.deadline.instant)
      +'\n'+prediction.reason+'\nAI 해석과 분리된 상징적 판정입니다.';
    box.append(heading,body);parent.prepend(box);
  }
  W.LUNEA_CONTACT_PREDICTION_V1=Object.freeze({
    version:VERSION,cardCode,eventFromQuestion,parseDeadline,positionRole,scoreCard,evaluate,attachPrompt,renderPanel
  });
})();