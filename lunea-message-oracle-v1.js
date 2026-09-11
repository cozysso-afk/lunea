/* LUNEA MESSAGE ORACLE V1 — independent, upright-only, local symbolic reading. */
(() => {
  'use strict';
  const root = globalThis;
  if (root.LUNEA_MESSAGE_ORACLE_V1) return;
  const CONTEXTS = Object.freeze({LOVE:'연애', REUNION:'재회', OFFICIAL:'공적 · 결과', WORK_BIZ:'업무', SOCIAL:'SNS', PERSONAL:'지인', GENERAL:'일반'});
  const subjects = {LOVE:'상대',REUNION:'이전 인연',OFFICIAL:'기관이나 담당자',WORK_BIZ:'회사나 업무 상대',SOCIAL:'온라인 상대나 계정',PERSONAL:'친구·가족·지인',GENERAL:'연락 주체'};
  const contextNotes = {
    LOVE:'감정의 크기와 실제 답장 행동을 구분해 읽어 주세요.',
    REUNION:'재접촉 신호와 관계 회복의 확정은 서로 달라요.',
    OFFICIAL:'승인 여부를 단정하지 말고 공식 공지와 담당 창구를 확인하세요.',
    WORK_BIZ:'업무 회신과 제안의 최종 수락은 구분해서 확인하세요.',
    SOCIAL:'조회·반응은 직접 메시지나 관계 의사와 같지 않아요.',
    PERSONAL:'익숙한 관계여도 현재의 일정과 연락 여유를 함께 고려하세요.',
    GENERAL:'실제 응답 여부는 상대의 상황과 선택에 따라 달라져요.'
  };
  // Adjustments are editorial symbolic weights, never measured probabilities.
  const profiles = {
    direct: [8,4,0,6,4,5,0], reciprocal:[15,12,-12,7,3,9,0],
    formal:[-9,-7,19,15,-9,0,0], observe:[-8,-4,-6,-3,20,-4,0],
    past:[2,20,0,-3,4,12,0], pause:[-3,-2,-4,-2,2,-1,0],
    sudden:[3,7,6,6,9,3,0], practical:[-3,-5,12,15,-7,4,0],
    conflict:[-7,-5,2,0,4,-4,0], warm:[10,5,-5,0,5,12,0],
    completion:[-4,1,17,12,2,3,0]
  };
  // code | score | profile | delivery style | channels / details | original Korean message
  const rows = [
    ['Fool',65,'sudden','가벼운 첫 접촉','직접 연락,갑작스러운 소식','계획에 없던 짧은 인사나 가벼운 제안이 문을 두드리는 상징이에요. 순간적인 시작일 수 있어 지속성은 다음 행동에서 확인해요.'],
    ['Magician',79,'direct','주도적 발신','직접 연락,새 채널','연락할 수단을 갖추고 먼저 말문을 여는 흐름이에요. 여러 채널을 넘나들기보다 목적이 분명한 한 통에 힘이 실려요.'],
    ['High Priestess',30,'observe','조용한 인지','관망,SNS/온라인,지연','소식은 알아도 바로 표현하지 않는 모습이에요. 침묵을 거절로 단정하기보다 인지와 행동 사이의 간격을 읽어 주세요.'],
    ['Empress',72,'warm','편안한 응답','상호 호응,직접 연락','안부와 배려가 자연스럽게 이어지는 신호예요. 재촉하는 말보다 편안하게 답할 수 있는 분위기가 대화를 열어요.'],
    ['Emperor',65,'formal','통제된 전달','공식 경로,결정권자','연락의 시점과 내용을 결정권자가 관리하는 모습이에요. 즉흥적인 메시지보다 정리된 지시나 책임 있는 답변에 가까워요.'],
    ['Hierophant',63,'formal','절차를 통한 회신','공식 경로,제3자/중간 전달','정해진 절차나 소개자를 거쳐 말이 전달되는 상징이에요. 개인적인 돌발 연락보다 승인된 창구와 약속된 방식에 무게가 있어요.'],
    ['Lovers',74,'reciprocal','선택을 확인하는 대화','상호 호응,직접 연락','서로의 의사를 확인하며 연락 방향을 선택하는 흐름이에요. 호응은 보여도 결론은 대화 속에서 조율해야 해요.'],
    ['Chariot',81,'direct','목적 있는 접근','직접 연락,빠른 진행','목표를 향해 직접 접근하는 메시지예요. 용건이 명확하고 추진력이 있지만 상대의 속도를 압박하지 않는지도 살펴요.'],
    ['Strength',58,'warm','절제된 접근','상호 호응,조심스러운 시작','마음을 누르기보다 부드럽게 조절하며 접근하는 모습이에요. 강한 요구 대신 차분한 한마디로 연결을 이어갈 수 있어요.'],
    ['Hermit',23,'pause','혼자 정리하는 시간','관망,지연','외부 대화보다 스스로 생각을 정리하는 기운이 커요. 즉각적인 회신보다 충분히 숙고한 뒤의 짧은 답에 가까워요.'],
    ['Wheel',64,'sudden','상황 전환의 소식','갑작스러운 소식,재개','외부 일정이나 우연한 계기가 연락의 흐름을 바꿀 수 있어요. 고정된 패턴보다 상황이 움직이는 순간에 주목해요.'],
    ['Justice',66,'formal','결정과 통지','공식 경로,문서/결과','검토한 사실을 바탕으로 결정이나 결과가 전달되는 상징이에요. 감정적인 표현보다 조건·문서·정확한 문구가 중요해요.'],
    ['Hanged Man',22,'pause','보류된 회신','지연,관망','결론을 내리지 못해 연락이 매달려 있는 모습이에요. 기다림 자체를 좋은 답이나 나쁜 답으로 미리 해석하지 않아요.'],
    ['Death',39,'completion','종료와 채널 전환','마무리,새 채널','기존 방식의 대화를 끝내거나 연락 경로를 바꾸는 신호예요. 과거의 패턴을 그대로 되살리기보다 달라진 조건을 확인해요.'],
    ['Temperance',62,'practical','간격을 조율하는 회신','제3자/중간 전달,조율','서로 다른 일정과 입장을 맞추며 말이 오가는 흐름이에요. 한 번의 큰 답보다 몇 차례의 조정으로 소식이 완성돼요.'],
    ['Devil',67,'conflict','집착성 반복 접촉','반복 연락,차단/제약','강한 관심이 반복 확인이나 부담스러운 접촉으로 나타날 수 있어요. 연락의 양보다 경계와 동의가 존중되는지 살펴요.'],
    ['Tower',76,'sudden','예상을 깨는 통보','갑작스러운 소식,변경/충격','예상 밖의 연락이나 급한 변경 소식이 끼어드는 상징이에요. 갑작스럽다는 이유만으로 좋은 소식이라고 단정하지 않아요.'],
    ['Star',61,'warm','부담 낮은 연결','SNS/온라인,안부','거리를 둔 채 안부나 응원을 전하는 잔잔한 신호예요. 강한 약속보다 연결 가능성을 열어 두는 표현에 가까워요.'],
    ['Moon',38,'observe','불분명한 간접 신호','관망,SNS/온라인,불확실','흘러나오는 정보와 추측이 섞이기 쉬운 흐름이에요. 간접 반응을 확답으로 키우지 말고 직접 확인된 내용만 구분해요.'],
    ['Sun',85,'direct','명료한 소식','직접 연락,공개 안내','숨기기보다 드러내고 분명하게 알리는 신호예요. 애매한 눈치보다 확인할 수 있는 답변이나 공개된 소식에 힘이 있어요.'],
    ['Judgement',77,'past','다시 부르는 연락','재접촉,공식 경로,결과 통보','잠잠했던 사안이 다시 호출되거나 결과가 알려지는 상징이에요. 과거의 연락이 돌아와도 지금의 조건을 새로 확인해야 해요.'],
    ['World',72,'completion','완료를 알리는 통지','공식 경로,문서/결과,마무리','진행 중인 일이 마무리되어 최종 안내가 도착하는 흐름이에요. 연락의 도착과 새 대화의 시작은 같지 않을 수 있어요.'],
    ['Wands01',78,'direct','새로운 발신','직접 연락,새 채널','하고 싶은 말이 생겨 먼저 연결을 시도하는 불씨예요. 길고 완성된 설명보다 짧고 적극적인 시작에 가까워요.'],
    ['Wands02',49,'observe','발신 전 계획','관망,거리/선택','연락할 방향과 타이밍을 비교하는 단계예요. 관심이 행동으로 옮겨지기 전 선택지를 살피는 시간이 보여요.'],
    ['Wands03',62,'practical','보낸 말의 답을 기다림','업무 회신,거리/선택','이미 보낸 제안이나 문의가 상대 쪽에서 돌아오는 과정을 상징해요. 새 발신보다 진행 상황을 확인하는 회신에 초점이 있어요.'],
    ['Wands04',77,'warm','초대와 일정 확정','초대/약속,상호 호응','함께 모일 자리나 확정된 일정을 알려 주는 소식이에요. 막연한 관심보다 시간과 장소가 담긴 연락이 어울려요.'],
    ['Wands05',48,'conflict','엇갈리는 의견','조율,반복 연락','여러 의견이 부딪혀 답변이 한 번에 정리되지 않는 모습이에요. 연락이 와도 최종 합의까지는 추가 대화가 필요해요.'],
    ['Wands06',83,'direct','성과를 알리는 소식','공개 안내,결과 통보','주목받는 결과나 성취를 밖으로 알리는 신호예요. 개인 답장뿐 아니라 공지나 공개 반응으로 소식을 접할 수 있어요.'],
    ['Wands07',42,'conflict','입장을 지키는 답','차단/제약,조심스러운 시작','응답하더라도 자신의 입장을 먼저 방어하는 흐름이에요. 더 많은 말을 요구하기보다 받아들일 수 있는 범위를 확인해요.'],
    ['Wands08',91,'direct','빠른 메시지','직접 연락,SNS/온라인,빠른 진행','멈춰 있던 대화가 짧은 메시지나 알림으로 빠르게 움직이는 상징이에요. 속도는 강하지만 내용의 좋고 나쁨은 별도로 읽어요.'],
    ['Wands09',38,'pause','경계하며 확인','관망,차단/제약','이전 경험 때문에 연락을 확인하면서도 쉽게 답하지 않는 모습이에요. 완전한 단절보다는 조심스러운 거리 유지에 가까워요.'],
    ['Wands10',34,'pause','업무에 밀린 회신','지연,업무 회신','해야 할 일이 쌓여 답장이 뒤로 밀리는 흐름이에요. 침묵을 개인적인 의도로만 해석하기보다 처리 부담을 고려해요.'],
    ['Wands11',80,'sudden','호기심 어린 소식','새 채널,직접 연락','새로운 이야기나 제안을 가볍게 던지는 전령이에요. 흥미로운 첫 메시지 뒤에 구체적인 실행이 붙는지 지켜봐요.'],
    ['Wands12',85,'sudden','급하게 다가오는 연락','갑작스러운 소식,직접 연락','기세 좋게 연락하고 빠르게 움직이는 방식이에요. 즉각적인 열기는 강해도 일정과 지속성은 다시 확인할 필요가 있어요.'],
    ['Wands13',74,'warm','자신감 있는 반응','SNS/온라인,상호 호응','존재감을 드러내며 자연스럽게 반응하는 모습이에요. 관심을 숨기기보다 대화가 이어질 여지를 만드는 표현이 어울려요.'],
    ['Wands14',76,'direct','방향을 제시하는 발신','결정권자,업무 회신','다음 행동을 정하고 제안하는 주도적인 연락이에요. 짧은 말 안에도 목표나 요청이 분명하게 담길 수 있어요.'],
    ['Cups01',76,'warm','감정의 첫 인사','안부,새 채널','호의나 고마움을 담은 말이 새롭게 흐르기 시작해요. 관계의 결론보다 마음을 표현할 작은 통로가 열리는 신호예요.'],
    ['Cups02',79,'reciprocal','서로 주고받는 응답','상호 호응,직접 연락','한쪽의 발신에 다른 쪽이 응답하며 대화가 맞물리는 상징이에요. 서로의 의사를 확인하는 짧고 균형 잡힌 교환에 힘이 있어요.'],
    ['Cups03',74,'warm','모임을 통한 소식','제3자/중간 전달,초대/약속','친목이나 공통 지인을 통해 소식이 닿는 흐름이에요. 개인적인 장문의 연락보다 함께하는 자리에서 말문이 열릴 수 있어요.'],
    ['Cups04',29,'pause','제안에 미온적 반응','관망,지연','연락을 받아도 즉시 흥미를 보이기 어려운 모습이에요. 반응이 약하다는 사실과 최종 거절은 구분해서 읽어요.'],
    ['Cups05',32,'past','아쉬움 속 망설임','지연,재접촉','지난 일의 아쉬움이 현재의 발신을 무겁게 만드는 흐름이에요. 그리움이 있어도 실제 연락으로 이어지는 힘은 따로 필요해요.'],
    ['Cups06',68,'past','익숙한 인연의 안부','재접촉,안부','오래된 기억이나 익숙한 계기가 안부를 불러오는 상징이에요. 추억을 나누는 연락과 관계를 새로 약속하는 일은 구별해요.'],
    ['Cups07',39,'observe','여러 가능성만 떠올림','불확실,관망','하고 싶은 말과 기대가 많지만 구체적인 메시지는 정해지지 않은 모습이에요. 상상한 반응보다 실제 발신을 기준으로 읽어요.'],
    ['Cups08',24,'pause','연락에서 물러남','거리/선택,지연','대화를 계속하기보다 거리를 두고 다른 방향을 찾는 흐름이에요. 추격하는 연락보다 현재의 거리와 경계를 존중해요.'],
    ['Cups09',63,'warm','만족스러운 짧은 반응','상호 호응,안부','기분 좋은 답이나 원하는 한마디를 받는 상징이에요. 반가운 반응을 장기적인 약속으로 확대하지 않으면 더 선명하게 읽혀요.'],
    ['Cups10',79,'warm','공동체의 따뜻한 소식','가족/모임,상호 호응','가족이나 가까운 집단 안에서 편안한 소식이 오가는 흐름이에요. 개인의 속마음보다 함께 나눌 일과 안부에 초점이 있어요.'],
    ['Cups11',77,'warm','수줍은 마음의 메시지','안부,조심스러운 시작','조심스러운 호의나 사과를 짧게 전하는 전령이에요. 완벽한 문장보다 솔직하지만 아직 서툰 표현을 읽어 주세요.'],
    ['Cups12',82,'reciprocal','정중한 제안','초대/약속,직접 연락','마음을 담아 다가오거나 제안을 건네는 방식이에요. 표현의 아름다움과 약속의 실행은 각각 확인하는 편이 좋아요.'],
    ['Cups13',60,'warm','잘 듣고 반응함','상호 호응,조심스러운 시작','말을 먼저 쏟기보다 내용을 받아들이고 공감하는 모습이에요. 발신 속도보다 답변의 배려와 정서적인 여유가 두드러져요.'],
    ['Cups14',63,'warm','감정을 조절한 답','직접 연락,조율','감정은 있어도 차분하고 절제된 말로 전달하는 흐름이에요. 과장된 표현이 없어도 안정적으로 응답하는지 살펴요.'],
    ['Swords01',79,'direct','명확한 한마디','직접 연락,문서/결과','애매했던 문제를 한 문장으로 정리하는 연락이에요. 듣기 좋은 말만 기대하기보다 핵심 사실과 결론에 주목해요.'],
    ['Swords02',28,'pause','결정을 미루는 침묵','지연,관망','어느 쪽으로 답할지 정하지 못해 말문이 멈춘 모습이에요. 침묵 속에서 임의의 답을 만들기보다 결정이 필요한 지점을 구분해요.'],
    ['Swords03',46,'conflict','불편한 사실 전달','직접 연락,변경/충격','듣기 어려운 사실이나 실망스러운 말이 전달되는 상징이에요. 연락 신호가 있다는 것과 좋은 내용이라는 것은 같지 않아요.'],
    ['Swords04',18,'pause','대화의 휴식','지연,관망','지금은 말을 더하기보다 쉬고 회복하는 흐름이에요. 즉각적인 움직임이 약하다고 관계의 모든 가능성이 끝난 것은 아니에요.'],
    ['Swords05',43,'conflict','말의 신경전','반복 연락,차단/제약','이기려는 말이나 날 선 응답이 대화를 흐릴 수 있어요. 연락이 오더라도 논쟁을 계속할 필요는 없어요.'],
    ['Swords06',47,'practical','차분한 전환 안내','변경/충격,조율','복잡했던 대화를 정리하고 다음 단계로 옮기는 소식이에요. 뜨거운 반응보다 이동·변경·정리 사항이 중심이 될 수 있어요.'],
    ['Swords07',35,'observe','우회하는 전달','제3자/중간 전달,불확실','정면으로 설명하기보다 일부만 전하거나 우회하는 모습이에요. 빠진 내용을 추측으로 채우지 말고 확인할 질문을 남겨요.'],
    ['Swords08',19,'pause','움직임의 제약','차단/제약,지연','두려움이나 조건의 제약 때문에 직접 발신하기 어려운 흐름이에요. 생각이 없어서인지 행동이 막힌 것인지 구분할 필요가 있어요.'],
    ['Swords09',25,'pause','걱정으로 미루는 답','지연,불확실','무슨 말을 해야 할지 걱정하며 답장을 미루는 상징이에요. 불안한 상상과 확인된 연락 사실을 분리해 읽어요.'],
    ['Swords10',21,'completion','대화의 종료 통지','마무리,차단/제약','기존 대화가 한계에 닿거나 더 이어지기 어려운 모습이에요. 마지막 말의 유무보다 종료된 조건을 받아들이는 데 초점을 둬요.'],
    ['Swords11',47,'observe','확인과 관찰','SNS/온라인,관망','계정이나 게시물을 확인하고 정보를 모으는 호기심이 보여요. 관찰 신호는 강해도 먼저 직접 연락하는 힘과는 다를 수 있어요.'],
    ['Swords12',84,'direct','빠르고 직설적인 연락','직접 연락,빠른 진행','질문이나 요구가 빠르게 날아오는 전달 방식이에요. 속도와 명확함은 강하지만 거친 어조는 내용과 분리해서 읽어요.'],
    ['Swords13',60,'formal','경계가 분명한 답','문서/결과,차단/제약','필요한 말만 정확히 하고 선을 정하는 응답이에요. 친근한 수식어보다 조건과 허용 범위가 명료한지 살펴요.'],
    ['Swords14',69,'formal','판단을 정리한 통보','결정권자,공식 경로','근거와 기준에 따라 판단한 내용을 전달하는 모습이에요. 감정적 호응보다 명확한 결정과 설명에 무게가 있어요.'],
    ['Pents01',73,'practical','실질적인 기회의 소식','문서/결과,새 채널','실행 가능한 제안이나 접수의 첫 확인이 들어오는 상징이에요. 막연한 기대보다 구체적인 조건이 있는 연락에 가까워요.'],
    ['Pents02',48,'practical','일정 사이의 회신','조율,지연','여러 일을 번갈아 처리하며 답변 시간을 조정하는 흐름이에요. 짧은 응답이 오가더라도 한 번에 마무리되지는 않을 수 있어요.'],
    ['Pents03',69,'practical','협업의 확인','업무 회신,제3자/중간 전달','여러 담당자가 역할을 맞추며 연락하는 모습이에요. 한 사람의 답보다 함께 검토한 내용과 다음 절차가 중요해요.'],
    ['Pents04',31,'pause','정보를 아끼는 답','차단/제약,관망','필요 이상으로 정보를 내놓지 않고 기존 입장을 지키는 흐름이에요. 연락이 짧더라도 무엇을 확정해 주었는지 구분해요.'],
    ['Pents05',24,'pause','연결 통로의 어려움','차단/제약,지연','연락할 여건이나 접근할 창구가 부족한 모습이에요. 개인적인 거절로만 읽기보다 실제 전달 경로가 열려 있는지 확인해요.'],
    ['Pents06',67,'practical','요청에 대한 응답','공식 경로,상호 호응','문의나 도움 요청에 필요한 만큼 답이 주어지는 흐름이에요. 응답 주체의 권한과 제공 가능한 범위 안에서 소식이 전해져요.'],
    ['Pents07',37,'practical','검토 중인 결과','지연,문서/결과','노력을 들인 일이 아직 검토나 확인 단계에 있는 상징이에요. 소식이 늦다는 이유만으로 결과를 미리 단정하지 않아요.'],
    ['Pents08',54,'practical','처리 과정의 안내','업무 회신,문서/결과','실무 처리가 차근차근 진행되며 필요한 내용이 전달돼요. 감정적인 긴 대화보다 확인 요청이나 작업 안내에 가까워요.'],
    ['Pents09',51,'practical','여유를 둔 독립적 답','조심스러운 시작,안부','자기 생활의 리듬을 유지하며 필요한 연락에 응답하는 모습이에요. 늘 연결되어 있기보다 선택적으로 답하는 방식이 어울려요.'],
    ['Pents10',74,'formal','조직의 확정 안내','공식 경로,가족/모임','조직이나 가족처럼 지속되는 체계를 통해 소식이 전해져요. 개인의 순간적인 마음보다 제도와 공동 결정이 중심이 돼요.'],
    ['Pents11',68,'practical','구체적인 첫 확인','문서/결과,새 채널','배우거나 지원한 일에 대한 첫 안내를 받는 전령이에요. 작아 보여도 다음에 무엇을 해야 하는지 담긴 실용적인 소식이에요.'],
    ['Pents12',55,'practical','느리지만 꾸준한 회신','지연,업무 회신','정해진 순서대로 처리한 뒤 답하는 전달 방식이에요. 빠르지는 않아도 확인 가능한 진행과 이행 여부가 중요해요.'],
    ['Pents13',62,'practical','생활을 돌보는 응답','안부,상호 호응','필요한 도움과 현실적인 안부를 챙기는 연락이에요. 화려한 표현보다 일정·건강·생활의 구체적인 배려로 연결돼요.'],
    ['Pents14',70,'formal','책임 있는 확답','결정권자,문서/결과','자원과 조건을 확인한 뒤 책임질 수 있는 말을 전하는 모습이에요. 즉흥적인 약속보다 실행 가능한 확답에 무게가 있어요.']
  ];
  const level = score => score >= 75 ? '강한 신호' : score >= 55 ? '연결 가능성' : score >= 35 ? '간접 · 조율' : '관망 · 지연';
  const cards = rows.map(([code,baseSignalScore,profile,contactStyle,details,baseMessageKo]) => {
    const tags = details.split(',');
    const contextAdjustments = Object.fromEntries(Object.keys(CONTEXTS).map((c,i)=>[c,profiles[profile][i]]));
    // Judgement also represents official announcements, independent of its return motif.
    if(code==='Judgement') contextAdjustments.OFFICIAL=14;
    return Object.freeze({code,baseSignalScore,signalLevel:level(baseSignalScore),contactStyle,
      channels:Object.freeze(tags.filter(t=>/연락|경로|전달|온라인|통보|문서|안부|회신/.test(t))),tags:Object.freeze(tags),
      baseMessageKo,keyDetails:Object.freeze(tags),contextAdjustments:Object.freeze(contextAdjustments),
      contextMessages:Object.freeze(Object.fromEntries(Object.keys(CONTEXTS).map(c=>[c,`${subjects[c]}의 ${contactStyle} 신호로 읽어요. ${contextNotes[c]}`])))});
  });
  const byCode = new Map(cards.map(c=>[c.code,c]));
  function classify(question){
    const q=String(question||'').normalize('NFKC');
    // Explicit subjects outrank generic "결과"; work-result questions remain WORK_BIZ.
    if(/전남친|전여친|전애인|헤어진|재회|다시\s*연락|끊긴\s*인연/.test(q)) return 'REUNION';
    if(/SNS|인스타|스토리|\bDM\b|디엠|좋아요|팔로우|게시물|조회/i.test(q)) return 'SOCIAL';
    if(/회사|면접|직장|업무|거래처|고객|협업|미팅|일정|제안|클라이언트|채용/.test(q)) return 'WORK_BIZ';
    if(/합격|발표|결과|승인|선정|심사|기관|학교|병원|접수|통과|계약|공모|당첨/.test(q)) return 'OFFICIAL';
    if(/친구|가족|지인|부모|형제|자매/.test(q)) return 'PERSONAL';
    if(/좋아하는\s*사람|썸|연인|남친|여친|호감|연애/.test(q)) return 'LOVE';
    return 'GENERAL';
  }
  const resolveContext=(question,override='AUTO')=>Object.hasOwn(CONTEXTS,override)?override:classify(question);
  function result(question, context, code, createdAt=new Date().toISOString()){
    const card=byCode.get(code);
    if(!card || !Object.hasOwn(CONTEXTS,context)) throw new Error('메시지 카드 정보를 확인할 수 없어요.');
    const score=Math.max(0,Math.min(100,card.baseSignalScore+card.contextAdjustments[context]));
    return {question:String(question).trim().slice(0,2000),context,cardCode:code,score,createdAt};
  }
  function draw(question,override='AUTO',random=root.crypto){
    if(!String(question||'').trim()) throw new Error('궁금한 연락이나 소식을 입력해 주세요.');
    if(!random?.getRandomValues) throw new Error('안전한 카드 뽑기를 사용할 수 없어요.');
    // Reject the incomplete upper bucket to avoid modulo bias; no Tarot state is read/written.
    const bucket=Math.floor(0x100000000/cards.length)*cards.length;
    const buffer=new Uint32Array(1); let value;
    do { random.getRandomValues(buffer); value=buffer[0]; } while(value>=bucket);
    return result(question,resolveContext(question,override),cards[value%cards.length].code);
  }
  function restore(value){
    if(!value || typeof value!=='object' || typeof value.question!=='string' || !value.question.trim() || value.question.length>2000 || !byCode.has(value.cardCode) || !Object.hasOwn(CONTEXTS,value.context) || typeof value.createdAt!=='string' || !Number.isFinite(Date.parse(value.createdAt))) return null;
    return result(value.question,value.context,value.cardCode,value.createdAt); // recompute, never trust stored score
  }
  function describe(value){
    const r=restore(value); if(!r) return null;
    const card=byCode.get(r.cardCode);
    return {...r,card,signalLevel:level(r.score),message:card.baseMessageKo,contextMessage:card.contextMessages[r.context]};
  }
  const LAST_KEY='LUNEA_MESSAGE_ORACLE_LAST_V1', SAVED_KEY='LUNEA_MESSAGE_ORACLE_SAVED_V1';
  function storage(store){
    const read=key=>{try{return JSON.parse(store.getItem(key)||'null')}catch{return null}};
    const write=(key,value)=>{try{store.setItem(key,JSON.stringify(value));return true}catch{return false}};
    return {
      last:()=>restore(read(LAST_KEY)),
      remember:value=>{const r=restore(value);return !!r&&write(LAST_KEY,r)},
      clear:()=>{try{store.removeItem(LAST_KEY);return true}catch{return false}},
      saved:()=>{const items=read(SAVED_KEY);return Array.isArray(items)?items.slice(0,100).map(restore).filter(Boolean):[]},
      save(value){const r=restore(value);if(!r)return false;const old=this.saved();return write(SAVED_KEY,[r,...old.filter(x=>!(x.createdAt===r.createdAt&&x.cardCode===r.cardCode&&x.question===r.question))].slice(0,100))}
    };
  }
  function identity(code,deck){return Array.isArray(deck)?deck.find(c=>c.code===code)||null:null}
  function copyText(value,deck){const d=describe(value);if(!d)return '';const id=identity(d.cardCode,deck);return `LUNEA MESSAGE ORACLE\n질문: ${d.question}\n맥락: ${CONTEXTS[d.context]}\n카드: ${id?.name||d.cardCode} (${d.cardCode}) · 정방향\n카드 기반 연락 신호 점수: ${d.score}%\n실제 확률이 아니라 카드 상징을 연락·소식 관점으로 환산한 지표\n핵심 메시지: ${d.message}\n${d.contextMessage}\nKey Details: ${d.card.keyDetails.join(' · ')}`}
  root.LUNEA_MESSAGE_ORACLE_V1=Object.freeze({cards:Object.freeze(cards),CONTEXTS,classify,resolveContext,result,draw,restore,describe,storage,identity,copyText,LAST_KEY,SAVED_KEY});
})();
