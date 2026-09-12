'use strict';
(() => {
  const W = window;
  if (W.__LUNEA_TAROT_EXPERT_ENGINE_V1__) return;
  W.__LUNEA_TAROT_EXPERT_ENGINE_V1__ = true;

  const MARKER = '[LUNEA TAROT EXPERT ENGINE V1 · 동적 해석 프로토콜]';
  const END = '[END LUNEA TAROT EXPERT ENGINE V1]';
  const AXES = [
    ['feelings','감정/호감','감정의 질·강도·개방성. 호감과 행동을 분리한다.'],
    ['thoughts','생각/인식','상대가 무엇을 어떻게 인식하는지. 감정이나 행동으로 자동 확장하지 않는다.'],
    ['intentions','의도','하고 싶거나 계획하는 방향. 실제 실행과 분리한다.'],
    ['contact','연락/소식','접촉 의향·전달 방식·장벽·속도. 호감만으로 연락을 확정하지 않는다.'],
    ['reconciliation','재회/관계 재개','과거 연결의 지속성과 실제 재접근 조건을 분리한다. 그리움만으로 재회를 확정하지 않는다.'],
    ['action','행동/실행','실제로 취할 가능성이 있는 행동 양식과 실행 장벽. 의도와 분리한다.'],
    ['outcome','결과/귀결','현재 배열이 가리키는 조건부 귀결. 결과 포지션이 없으면 결과를 새로 만들지 않는다.'],
    ['advice','조언/대응','질문자가 통제할 수 있는 대응과 확인할 현실 조건. 타인의 행동을 조언으로 위장하지 않는다.'],
    ['comparison','비교/선택','A/B가 같은 기준에서 비교되도록 읽고 질문자가 말하지 않은 우선순위를 추정하지 않는다.'],
    ['observation','관찰/확인','상징적 지지·반증의 우세만 말한다. 디지털 행동이나 사실을 카드로 객관 증명하지 않는다.'],
    ['timing','시기/속도','정확한 날짜 대신 활성 조건·지연·가속·전조를 읽는다.'],
  ];

  const SUITS = {
    Wands: '행동·추진·열정·외부 실행',
    Cups: '감정·관계·정서적 교류',
    Swords: '생각·판단·말·갈등·경계',
    Pentacles: '현실·자원·노력·안정·지속성',
  };
  const RANKS = {
    '01':'씨앗·시작·가능성', '02':'선택·균형·대응', '03':'전개·성장·첫 결과',
    '04':'안정·유지·기반', '05':'마찰·변화 압력·충돌', '06':'조정·회복·교류·이동',
    '07':'전략·방어·시험', '08':'움직임·전달·숙련', '09':'문턱·지속·마지막 방어',
    '10':'완결·누적·부담·한 사이클의 끝',
    '11':'Page: 학습·새 소식·미숙하지만 열린 역할',
    '12':'Knight: 추구·이동·행동화하는 역할',
    '13':'Queen: 내면화된 숙련·태도·관리',
    '14':'King: 외부화된 숙련·판단·결정',
  };
  const WORD_RANKS={Ace:'01',Two:'02',Three:'03',Four:'04',Five:'05',Six:'06',Seven:'07',Eight:'08',Nine:'09',Ten:'10',Page:'11',Knight:'12',Queen:'13',King:'14'};

  function clean(v){ return String(v ?? '').replace(/\s+/g,' ').trim(); }
  function question(prompt){
    const m = String(prompt || '').match(/\[질문 원문\]\s*\n["“]?([\s\S]*?)["”]?\s*\n\s*\[질문 유형\]/);
    return clean(m?.[1] || '');
  }
  function type(prompt){
    const m = String(prompt || '').match(/\[질문 유형\]\s*\n([^\n]+)/);
    return clean(m?.[1] || '');
  }
  function cards(prompt){
    const s = String(prompt || '');
    const block = s.split('[뽑힌 카드]')[1]?.split(/\n\s*\[/)[0] || '';
    const out=[];
    const re=/(\d+)\.\s*\[([^\]]+)\]\s*\n-\s*Card:\s*([^\n]+)\n-\s*Orientation:\s*([^\n]+)([\s\S]*?)(?=\n\s*\d+\.\s*\[|$)/g;
    let m;
    while((m=re.exec(block))){
      const tail=m[5]||'';
      const sub=(tail.match(/보조 카드:\s*([^\n]+)/)?.[1]||'').trim();
      out.push({index:Number(m[1]),position:clean(m[2]),name:clean(m[3]),orientation:/reversed|역방향/i.test(m[4])?'reversed':'upright',clarifier:sub});
    }
    return out;
  }
  function axisMatches(q){
    const s=String(q||'').toLowerCase();
    const hits=[];
    const patterns={
      feelings:/(좋아|호감|마음|감정|그리움|애정|끌림|설렘|사랑)/,
      thoughts:/(생각|인식|어떻게\s*보|무슨\s*생각|판단)/,
      intentions:/(의도|하려|할\s*생각|마음먹|계획)/,
      contact:/(연락|답장|메시지|소식|전화|접촉|찾아오)/,
      reconciliation:/(재회|다시\s*만|돌아오|관계\s*재개|다시\s*시작)/,
      action:/(행동|실제로|움직|할까|하는\s*행동|실행)/,
      outcome:/(결과|어떻게\s*될|전망|귀결|성공|합격|결말)/,
      advice:/(어떻게\s*해야|조언|내가\s*뭘|어떻게\s*대응|선택|결정)/,
      comparison:/(a안|b안|a와\s*b|어느\s*쪽|둘\s*중|비교)/,
      observation:/(봤|확인|읽었|스토리|사진|프로필|숨기|몰래|관찰)/,
      timing:/(언제|시기|타이밍|빠르|늦|속도|얼마나\s*걸)/,
    };
    for(const [k,re] of Object.entries(patterns)) if(re.test(s)) hits.push(k);
    return hits.length?hits:['neutral'];
  }
  function suitRank(name){
    const n=clean(name).replace(/\([^)]*\)/g,'').trim();
    const compact=n.match(/^(Wands|Cups|Swords|Pents|Pentacles)(0?[1-9]|1[0-4])$/i);
    const words=n.match(/^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Wands|Cups|Swords|Pents|Pentacles)$/i);
    if(!compact && !words) return null;
    const rawSuit=(compact?.[1] || words[2]).toLowerCase();
    const suit=/^(pents|pentacles)$/.test(rawSuit)?'Pentacles':Object.keys(SUITS).find(x=>x.toLowerCase()===rawSuit);
    const rank=compact?String(Number(compact[2])).padStart(2,'0'):WORD_RANKS[Object.keys(WORD_RANKS).find(x=>x.toLowerCase()===words[1].toLowerCase())];
    return {suit,rank,domain:SUITS[suit],stage:RANKS[rank]};
  }

  function courtRole(name,position,q){
    const sr=suitRank(name);
    if(!sr || Number(sr.rank)<11) return '';
    const p=String(position||'');
    const other=/(상대|그\s*사람|타인|상대방)/.test(q||'') || /(상대|그\s*사람|인물)/.test(p);
    if(/누가|어떤\s*사람|인물|상대/.test(p) && other) return '실제 인물 후보가 아니라 질문 속 역할을 수행하는 사람의 스타일/역할로 우선 읽고, 인물 특정은 하지 않는다.';
    if(/태도|방식|행동|의사소통|주도성|반응|역할/.test(p)) return '사람을 특정하기보다 해당 포지션의 행동 양식·역할·대응 스타일로 우선 읽는다.';
    return '인물/역할/행동 스타일 중 어느 층인지 포지션과 질문으로 결정한다. 성별·신원·특정 제3자를 카드만으로 만들지 않는다.';
  }
  function reversalRule(c){
    if(c.orientation!=='reversed') return '';
    return '역방향 후보 모드: 과잉/과소·감소, 내면화, 막힘·지연, 또는 제한적 반대 중 하나를 선택한다. 정방향의 단순 반대가 아니다. 선택 이유를 포지션과 인접 카드에서 설명한다.';
  }
  function build(prompt){
    const q=question(prompt), t=type(prompt), cs=cards(prompt), axes=axisMatches(q);
    const lines=[MARKER,
      'A. 해석의 고정 순서',
      '1) 질문 원문 → 2) 포지션의 기능 → 3) 해당 카드의 정/역방향과 장면 → 4) 보조/인접 카드 → 5) 수트·숫자·배열 패턴 → 6) 보조 오라클/점성·명리. 앞 단계의 직접 근거가 뒤 단계의 일반론보다 우선한다.',
      '2) 다수결 금지: 카드 수가 많은 방향으로 결론을 밀지 않는다. 서로 충돌하면 어떤 포지션의 근거가 더 직접적인지 설명하고 미결정 영역을 남긴다.',
      '',
      'B. 질문 축 분리',
      `현재 질문 축: ${axes.map(a=>AXES.find(x=>x[0]===a)?.[1]||a).join(' + ')}${t?` (라우팅: ${t})`:''}`,
      ...axes.filter(a=>a!=='neutral').map(a=>`- ${AXES.find(x=>x[0]===a)?.[1]}: ${AXES.find(x=>x[0]===a)?.[2]}`),
      '- 특히 감정/호감 → 연락 → 실제 행동 → 재회/관계 성립은 서로 다른 증거 축이다. 한 축의 긍정 카드만으로 다음 축을 자동 확정하지 않는다.',
      '',
      'C. 현재 카드 지도',
      ...cs.map(c=>`- ${c.index}번 [${c.position}] ${c.name} · ${c.orientation==='reversed'?'역방향':'정방향'}${c.clarifier?` · 연결 보조: ${c.clarifier}`:''}`),
      '',
      'D. 역방향 선택 규칙',
      '역방향은 먼저 포지션을 본 뒤 과잉/과소·감소, 내면화, 막힘·지연, 제한적 반대 중 가장 적은 가정을 요구하는 모드를 선택한다. 주변 카드가 그 모드를 지지하지 않으면 의미를 과장하지 않는다.',
      ...cs.filter(c=>c.orientation==='reversed').map(c=>`- ${c.index}번 [${c.position}] ${c.name}: ${reversalRule(c)}`),
      '',
      'E. 마이너 아르카나 조합 규칙',
      '마이너는 카드 키워드 하나로 끝내지 않는다. 수트가 다루는 영역과 숫자/궁정 단계가 만드는 과정의 위치를 결합하고, 실제 포지션과 장면이 최종 의미를 좁힌다.',
      ...cs.map(c=>{const sr=suitRank(c.name);return sr?`- ${c.index}번 ${c.name}: 수트=${sr.suit}(${sr.domain}); 단계=${sr.stage}. 이 조합을 포지션의 문제에 번역하고, 숫자만으로 사건을 예언하지 않는다.`:null}).filter(Boolean),
      '',
      'F. 궁정 카드 규칙',
      '궁정 카드는 자동으로 특정 남자/여자를 뜻하지 않는다. 포지션이 사람을 묻는지, 역할·태도·행동 양식을 묻는지 판정한 뒤 그 층에서 읽는다. 성별·신원·특정 제3자를 카드만으로 만들지 않는다.',
      ...cs.map(c=>{const x=courtRole(c.name,c.position,q);return x?`- ${c.index}번 ${c.name}: ${x}`:null}).filter(Boolean),
      '',
      'G. 보조 카드와 반증',
      '보조 카드는 연결된 본 카드의 의미를 좁히는 용도로만 쓴다. 보조 카드의 위치를 다른 포지션으로 이동시키지 않는다. 각 핵심 결론에는 지지 근거와 제한/반증 근거를 함께 점검한다.',
      '',
      'H. 최종 답변 형식',
      '첫 문장에 질문에 대한 직접 결론을 쓴다. 그다음 포지션별 근거를 카드명+방향+포지션으로 연결한다. 이어서 반증/제한을 한 번 명시한다. 마지막으로 필요한 경우에만 보조 오라클을 짧게 교차참고한다. 날짜·확률·제3자·실제 디지털 행동을 카드에서 새로 만들지 않는다.'
    ];
    return [...lines,END].join('\n');
  }

  function install(){
    const prior=W.promptString || (typeof promptString==='function'?promptString:null);
    if(typeof prior!=='function') return false;
    if(prior.__luneaTarotExpertEngineV1) return true;
    const wrapped=function(){
      const p=String(prior.apply(this,arguments)||'');
      const markerAt=p.indexOf(MARKER);
      const endAt=markerAt>=0?p.indexOf(END,markerAt):-1;
      // Legacy blocks had no end marker: preserve the next top-level section.
      const legacyTail=markerAt>=0?p.slice(markerAt+MARKER.length).search(/\n\s*\[/):-1;
      const stop=endAt>=0?endAt+END.length:legacyTail>=0?markerAt+MARKER.length+legacyTail:p.length;
      const without=(markerAt>=0?p.slice(0,markerAt)+p.slice(stop):p).trimEnd();
      const block=build(without);
      return `${without}${block ? `\n\n${block}`:''}`;
    };
    wrapped.__luneaTarotExpertEngineV1=true;
    wrapped.__luneaTarotExpertEngineV1Base=prior;
    W.promptString=wrapped;
    try{promptString=wrapped;}catch{}
    W.LUNEA_TAROT_EXPERT_ENGINE_V1={version:1,build,install,axes:AXES,suitDomains:SUITS,rankStages:RANKS};
    return true;
  }
  W.LUNEA_TAROT_EXPERT_ENGINE_V1={version:1,build,install,axes:AXES,suitDomains:SUITS,rankStages:RANKS};
  let tries=0;
  const boot=()=>{if(install()) return; if(++tries<100) W.setTimeout(boot,100);};
  boot();
})();
