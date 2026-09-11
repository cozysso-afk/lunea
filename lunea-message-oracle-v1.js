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
    return Object.freeze({code,baseSignalScore,signalLevel:level(baseSignalScore),profile,contactStyle,
      channels:Object.freeze(tags.filter(t=>/연락|경로|전달|온라인|통보|문서|안부|회신/.test(t))),tags:Object.freeze(tags),
      baseMessageKo,keyDetails:Object.freeze(tags),contextAdjustments:Object.freeze(contextAdjustments),
      contextMessages:Object.freeze(Object.fromEntries(Object.keys(CONTEXTS).map(c=>[c,`${subjects[c]}의 ${contactStyle} 신호로 읽어요. ${contextNotes[c]}`])))});
  });
  const byCode = new Map(cards.map(c=>[c.code,c]));
  const INTENTS=Object.freeze({
    CONTACT_ARRIVAL:'연락 도착',REPLY:'회신',RESULT_NOTICE:'결과 통지',APPROVAL:'승인·선정 통지',
    RECONTACT:'재접촉',SOCIAL_OBSERVE:'온라인 관찰',SOCIAL_ACTION:'온라인 직접 반응',SCHEDULE:'일정 확정',
    PERSONAL_NEWS:'지인 소식',GENERAL_NEWS:'일반 소식'
  });
  const AXIS_LEVELS=Object.freeze(['LOW','MEDIUM','HIGH']);
  const PROFILE_AXES=Object.freeze({
    direct:[2,2,0,0,1,0,1,0,0,0],reciprocal:[2,1,0,0,2,0,0,0,1,0],
    formal:[1,1,2,0,0,0,0,2,0,1],observe:[0,0,0,2,0,1,0,0,0,2],
    past:[1,1,0,1,1,0,0,1,1,1],pause:[0,0,0,1,0,2,0,0,0,2],
    sudden:[2,2,0,0,0,0,2,0,0,0],practical:[1,1,1,0,1,0,0,1,1,1],
    conflict:[1,1,0,0,0,2,1,0,2,1],warm:[1,1,0,0,2,0,0,0,0,0],
    completion:[1,1,2,0,0,1,0,2,0,1]
  });
  const AXIS_KEYS=Object.freeze(['directness','speed','formality','observation','reciprocity','restriction','suddenness','completion','repetition','delay']);
  const NON_ROMANTIC_CONTEXTS=new Set(['OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL']);
  const CONTEXT_COPY=Object.freeze({
    LOVE:Object.freeze({signal:'연락·응답',caveat:'연락 신호와 관계의 방향은 별개예요.'}),
    REUNION:Object.freeze({signal:'재접촉·소식',caveat:'재접촉과 관계 회복은 별개예요.'}),
    OFFICIAL:Object.freeze({signal:'공식 통지·소식',caveat:'통지와 승인·선정 여부는 별개예요.'}),
    WORK_BIZ:Object.freeze({signal:'업무 회신·소식',caveat:'회신과 채용·제안 결과는 별개예요.'}),
    SOCIAL:Object.freeze({signal:'온라인 반응·메시지',caveat:'확인·반응과 직접 연락은 별개예요.'}),
    PERSONAL:Object.freeze({signal:'개인 연락·소식',caveat:'소식 도착과 관계 변화는 별개예요.'}),
    GENERAL:Object.freeze({signal:'연락·소식',caveat:'소식 전달과 결과의 긍정·부정은 별개예요.'})
  });
  const SAFE_PROFILE_STYLE=Object.freeze({
    direct:'용건이 분명한 직접 전달',reciprocal:'상호 확인이 오가는 전달',formal:'기준과 절차를 따른 전달',
    observe:'확인·관찰이 앞서는 간접 신호',past:'이전 사안이 다시 이어지는 전달',pause:'보류·대기가 앞서는 흐름',
    sudden:'예고 없이 움직이는 전달',practical:'실무·조건을 확인하는 전달',conflict:'압박·이견이 얽힌 전달',
    warm:'수용적인 응답',completion:'종결·완료를 알리는 전달'
  });
  const FORM_COPY=Object.freeze({
    direct:Object.freeze({DEFAULT:'직접 메시지·통화',OFFICIAL:'담당자의 직접 회신',WORK_BIZ:'메일·업무 메신저',SOCIAL:'DM·댓글 같은 직접 반응'}),
    formal:Object.freeze({DEFAULT:'정해진 창구·문서',LOVE:'신중하고 형식적인 연락',REUNION:'중간자나 정해진 경로',SOCIAL:'공개 공지·계정 알림',PERSONAL:'가족·모임의 전달'}),
    online:Object.freeze({DEFAULT:'SNS·온라인 알림',OFFICIAL:'온라인 공지·접수 알림',WORK_BIZ:'메일·업무 메신저',PERSONAL:'온라인 안부·소식'}),
    mediated:Object.freeze({DEFAULT:'제3자·중간 전달',OFFICIAL:'기관·담당 경로',WORK_BIZ:'담당자 간 전달',SOCIAL:'공통 계정·간접 반응',PERSONAL:'공통 지인·가족 전달'}),
    recontact:Object.freeze({DEFAULT:'오래된 채널의 재접촉',OFFICIAL:'보류 건의 재통지',WORK_BIZ:'이전 문의·제안 재회신',SOCIAL:'예전 계정의 재반응',PERSONAL:'오래된 지인의 안부'}),
    work:Object.freeze({DEFAULT:'실무 문의·회신',LOVE:'일정·현실 조건 연락',REUNION:'현실 조건 확인 연락',OFFICIAL:'처리 담당자의 회신',SOCIAL:'운영·협업 관련 반응',PERSONAL:'일정·생활 관련 소식'}),
    schedule:Object.freeze({DEFAULT:'초대·일정 제안',OFFICIAL:'일정·절차 안내',WORK_BIZ:'미팅·일정 조율',SOCIAL:'온라인 초대·약속',PERSONAL:'모임·약속 소식'}),
    community:Object.freeze({DEFAULT:'가족·모임 소식',OFFICIAL:'조직·단체 안내',WORK_BIZ:'팀·조직 공지',SOCIAL:'커뮤니티·그룹 반응'}),
    sudden:Object.freeze({DEFAULT:'갑작스러운 메시지·알림',OFFICIAL:'예고 없는 결과·변경 통지',WORK_BIZ:'급한 회신·일정 변경',SOCIAL:'갑작스러운 알림·DM'}),
    checkin:Object.freeze({DEFAULT:'안부·확인 연락',OFFICIAL:'상태 확인·안내',WORK_BIZ:'진행 확인·후속 회신',SOCIAL:'가벼운 반응·안부',PERSONAL:'안부·생활 소식'}),
    indirect:Object.freeze({DEFAULT:'간접 확인·추가 조율',OFFICIAL:'내부 확인·절차 조율',WORK_BIZ:'검토·일정 조율',SOCIAL:'조회·관찰 신호',PERSONAL:'주변을 통한 간접 소식'})
  });
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
  function classifyIntent(question,context=classify(question)){
    const q=String(question||'').normalize('NFKC').replace(/\s+/g,' ').trim();
    const c=Object.hasOwn(CONTEXTS,context)?context:classify(q);
    if(c==='REUNION'||/전남친|전여친|전애인|헤어진|재회|다시\s*연락|끊긴\s*인연|재접촉/.test(q))return'RECONTACT';
    if(/\bDM\b|디엠|좋아요|팔로우|댓글/i.test(q)&&/보낼|할까|올까|누를|남길|반응|연락/.test(q))return'SOCIAL_ACTION';
    if(/스토리|게시물|피드|계정|인스타|SNS|조회/i.test(q)&&/보(?:고|는|았|게)|확인|조회|관찰|염탐/.test(q))return'SOCIAL_OBSERVE';
    if(/승인|선정|수락|허가|통과|계약|당첨/.test(q))return'APPROVAL';
    if(/면접|시험|심사|채용|합격|불합격|발표|결과/.test(q)&&/결과|발표|통지|연락|알려|소식/.test(q))return'RESULT_NOTICE';
    if(/일정|약속|미팅|면담|예약|날짜|시간/.test(q)&&/확정|연락|회신|알려|잡힐|정해/.test(q))return'SCHEDULE';
    if(/답장|답변|회신|응답|카톡|문자|메일/.test(q)&&/올까|줄까|할까|오나|기다|보낸|했을/.test(q))return'REPLY';
    if(c==='PERSONAL'||/친구|가족|지인|부모|형제|자매/.test(q))return'PERSONAL_NEWS';
    if(/연락|메시지|전화|소식|알림/.test(q)&&/올까|할까|오나|오는|도착|받을|줄까/.test(q))return'CONTACT_ARRIVAL';
    return'GENERAL_NEWS';
  }
  function semanticProfile(value){
    const card=typeof value==='string'?byCode.get(value):value;
    if(!card)return null;
    const numbers=[...(PROFILE_AXES[card.profile]||PROFILE_AXES.practical)];
    const set=(key,value)=>{numbers[AXIS_KEYS.indexOf(key)]=Math.max(numbers[AXIS_KEYS.indexOf(key)],value)};
    const tags=new Set(card.tags),has=(...values)=>values.some(value=>tags.has(value));
    if(has('직접 연락'))set('directness',2);
    if(has('빠른 진행')){set('speed',2);set('directness',2)}
    if(has('공식 경로','문서/결과','결과 통보','결정권자','공개 안내'))set('formality',2);
    if(has('관망','SNS/온라인'))set('observation',2);
    if(has('상호 호응'))set('reciprocity',2);
    if(has('차단/제약'))set('restriction',2);
    if(has('갑작스러운 소식','변경/충격')){set('suddenness',2);set('speed',2)}
    if(has('마무리','결과 통보'))set('completion',2);
    if(has('반복 연락'))set('repetition',2);
    if(has('지연','관망','차단/제약'))set('delay',2);
    const minor=card.code.match(/^(Wands|Cups|Swords|Pents)(\d{2})$/);
    const suit=minor?.[1]||'Major',rank=minor?Number(minor[2]):null;
    if(suit==='Wands'){set('speed',1);set('directness',1)}
    if(suit==='Cups')set('reciprocity',1);
    if(suit==='Swords')set('formality',1);
    if(suit==='Pents'){set('formality',1);set('delay',1)}
    if(rank===11){set('observation',1);set('speed',1)}
    if(rank===12){set('directness',2);set('speed',2)}
    if(rank===13)set('reciprocity',2);
    if(rank===14){set('directness',2);set('formality',2)}
    const courtRole=rank===11?'PAGE':rank===12?'KNIGHT':rank===13?'QUEEN':rank===14?'KING':rank===1?'ACE':rank?`NUMBER_${rank}`:'MAJOR';
    return Object.freeze(Object.fromEntries([...AXIS_KEYS.map((key,index)=>[key,AXIS_LEVELS[numbers[index]]]),['suit',suit],['rank',rank],['courtRole',courtRole]]));
  }
  function formGroup(card,context,intent,axes){
    const signals=new Set([...card.tags,...card.channels]),has=(...values)=>values.some(value=>signals.has(value));
    if(intent==='SOCIAL_OBSERVE'||intent==='SOCIAL_ACTION')return'online';
    if(intent==='SCHEDULE')return'schedule';
    if(intent==='RECONTACT')return'recontact';
    if((intent==='RESULT_NOTICE'||intent==='APPROVAL')&&axes.suddenness==='HIGH')return'sudden';
    if((intent==='RESULT_NOTICE'||intent==='APPROVAL')&&axes.formality==='HIGH')return'formal';
    if(has('업무 회신'))return'work';
    if((context==='OFFICIAL'||context==='WORK_BIZ')&&has('공식 경로','문서/결과','결과 통보','공개 안내','결정권자'))return'formal';
    if(has('재접촉','재개'))return'recontact';
    if(has('SNS/온라인'))return'online';
    if(has('제3자/중간 전달'))return'mediated';
    if(has('초대/약속'))return'schedule';
    if(has('가족/모임'))return'community';
    if(has('직접 연락'))return'direct';
    if(has('갑작스러운 소식','변경/충격'))return'sudden';
    if(has('안부'))return'checkin';
    return'indirect';
  }
  function safeStyle(card,context){
    if(!NON_ROMANTIC_CONTEXTS.has(context))return card.contactStyle;
    return /사랑|호감|마음|연애|감정|집착|수줍|그리움|아쉬움/.test(card.contactStyle)?SAFE_PROFILE_STYLE[card.profile]:card.contactStyle;
  }
  function signalName(intent,context){
    const names={REPLY:'회신',RESULT_NOTICE:'결과 통지',APPROVAL:'승인·선정 통지',RECONTACT:'재접촉',SOCIAL_OBSERVE:'온라인 관찰·확인',SOCIAL_ACTION:'온라인 직접 반응',SCHEDULE:'일정 확정 연락',PERSONAL_NEWS:'지인 소식',GENERAL_NEWS:CONTEXT_COPY[context].signal};
    return names[intent]||CONTEXT_COPY[context].signal;
  }
  function strengthSentence(signal,score){
    return score>=75?`${signal} 신호가 강해요.`:score>=55?`${signal} 신호는 중간 이상이에요.`:score>=35?`${signal} 신호는 제한적이고 조율이 필요해요.`:`${signal} 신호는 약하며 대기·지연 쪽이에요.`;
  }
  function caveatFor(card,context,intent){
    if(intent==='RESULT_NOTICE')return'연락 강도와 결과의 유불리는 별개예요.';
    if(intent==='APPROVAL')return'통지 신호와 승인·선정 여부는 별개예요.';
    if(intent==='SOCIAL_OBSERVE')return'보고 있는 것과 DM 같은 직접 행동은 별개예요.';
    if(intent==='SOCIAL_ACTION')return'온라인 반응과 지속적인 연락 의사는 별개예요.';
    if(intent==='RECONTACT')return'재접촉과 실제 관계 회복은 별개예요.';
    if(intent==='SCHEDULE')return'연락이 와도 최종 확정 전에는 변경될 수 있어요.';
    const has=(...values)=>values.some(value=>card.tags.includes(value));
    if(has('관망'))return'인지·관찰과 직접 행동은 별개예요.';
    if(has('불확실'))return'간접 신호만으로 연락을 확정하지 말아요.';
    if(has('차단/제약','지연'))return'제약이나 지연이 실제 전달을 늦출 수 있어요.';
    if(has('갑작스러운 소식','변경/충격'))return'갑작스러운 전달과 긍정적인 내용은 별개예요.';
    if(has('마무리'))return'마무리 통지가 새로운 시작을 뜻하지는 않아요.';
    return CONTEXT_COPY[context].caveat;
  }
  const SPECIAL_MESSAGES=Object.freeze({
    'High Priestess|LOVE|CONTACT_ARRIVAL':'상대를 의식하고 지켜보는 신호는 있지만 직접 연락 행동은 약해요. 생각과 실제 행동을 구분해서 봐야 해요.',
    'High Priestess|SOCIAL|SOCIAL_OBSERVE':'온라인 관찰·확인 신호는 강한 편이에요. 다만 보고 있는 것과 직접 DM하는 것은 별개예요.',
    'High Priestess|WORK_BIZ|RESULT_NOTICE':'내부 확인이나 비공개 검토가 이어지는 흐름이에요. 직접 결과 통지까지는 시간이 더 필요할 수 있어요.',
    'Justice|OFFICIAL|RESULT_NOTICE':'결정·통지 신호는 강한 편이에요. 공식 기준과 절차를 거친 안내에 가깝지만, 결과의 유불리는 카드 점수와 별개예요.',
    'Swords11|SOCIAL|SOCIAL_OBSERVE':'확인·관찰 신호가 강해요. 직접 메시지보다 먼저 지켜보거나 정보를 확인하는 흐름이에요.',
    'Swords11|SOCIAL|SOCIAL_ACTION':'온라인 관심은 있지만 직접 DM 행동은 그보다 약해요. 관찰과 실제 접촉을 구분해서 봐야 해요.',
    'Tower|WORK_BIZ|RESULT_NOTICE':'갑작스러운 연락이나 변경 통지 신호가 강해요. 빠른 소식일 수 있지만 긍정 결과를 뜻하지는 않아요.',
    'Devil|WORK_BIZ|RESULT_NOTICE':'연락·결과 통지 신호는 중간 이상이에요. 내부 제약과 압박으로 검토가 반복될 수 있으며, 연락과 긍정 결과는 별개예요.'
  });
  const shortTag=value=>({'직접 연락':'직접','SNS/온라인':'온라인','공식 경로':'공식','제3자/중간 전달':'중간 전달','갑작스러운 소식':'돌발','상호 호응':'호응','차단/제약':'제약','문서/결과':'문서','거리/선택':'거리','조심스러운 시작':'조심','변경/충격':'변경','빠른 진행':'빠름','초대/약속':'약속','가족/모임':'모임','업무 회신':'실무','결과 통보':'통지','반복 연락':'반복'})[value]||value;
  const signalValue=score=>score>=75?'강함':score>=55?'중간 이상':score>=35?'제한적':'약함';
  const axisValue=value=>value==='HIGH'?'강함':value==='MEDIUM'?'중간':'약함';
  const restrictionValue=value=>value==='HIGH'?'큼':value==='MEDIUM'?'있음':'낮음';
  const speedValue=axes=>axes.delay==='HIGH'?'지연 가능':axes.suddenness==='HIGH'?'돌발':axes.speed==='HIGH'?'빠름':axes.speed==='MEDIUM'?'보통':'느림';
  function progressValue(card,axes){
    if(axes.repetition==='HIGH')return'반복 가능';
    if(axes.completion==='HIGH')return'완료 단계';
    if(axes.observation==='HIGH')return'확인 중';
    if(axes.restriction==='HIGH')return'보류 가능';
    return'진행 중';
  }
  function detailsFor(card,context,intent,score,axes,form){
    const path=shortTag(card.channels[0]||card.tags[0]||form);
    const signal=signalValue(score),speed=speedValue(axes),restriction=restrictionValue(axes.restriction);
    const direct=axisValue(axes.directness),observe=axisValue(axes.observation),reciprocity=axisValue(axes.reciprocity);
    const action=axes.observation==='HIGH'&&axes.directness!=='HIGH'?'지켜봄':axes.restriction==='HIGH'?'제약 큼':axes.directness==='HIGH'?'직접':'확인 필요';
    if(intent==='RESULT_NOTICE')return[{label:'통지',value:signal},{label:'검토',value:progressValue(card,axes)},{label:'제약',value:restriction},{label:'속도',value:speed}];
    if(intent==='APPROVAL')return[{label:'통지',value:signal},{label:'절차',value:progressValue(card,axes)},{label:'제약',value:restriction},{label:'속도',value:speed}];
    if(intent==='SOCIAL_OBSERVE')return[{label:'관찰',value:observe},{label:'직접 반응',value:direct},{label:'채널',value:'SNS'},{label:'행동',value:action}];
    if(intent==='SOCIAL_ACTION')return[{label:'온라인',value:signal},{label:'직접 반응',value:direct},{label:'속도',value:speed},{label:'제약',value:restriction}];
    if(intent==='REPLY')return[{label:'회신',value:signal},{label:'경로',value:path},{label:'속도',value:speed},{label:'제약',value:restriction}];
    if(intent==='RECONTACT')return[{label:'재접촉',value:signal},{label:'직접성',value:direct},{label:'제약',value:restriction},{label:'회복',value:reciprocity}];
    if(intent==='SCHEDULE')return[{label:'확정',value:signal},{label:'경로',value:path},{label:'속도',value:speed},{label:'변수',value:restriction}];
    if(intent==='PERSONAL_NEWS')return[{label:'소식',value:signal},{label:'경로',value:path},{label:'속도',value:speed},{label:'호응',value:reciprocity}];
    if(context==='LOVE')return[{label:'호응',value:reciprocity},{label:'연락',value:signal},{label:'행동',value:action},{label:'흐름',value:speed}];
    return[{label:'응답',value:signal},{label:'경로',value:path},{label:'행동',value:action},{label:'흐름',value:speed}];
  }
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
  function interpret(value){
    const candidate=value&&typeof value==='object'&&!value.createdAt?{...value,createdAt:'1970-01-01T00:00:00.000Z'}:value;
    const d=describe(candidate);if(!d)return null;
    const intent=classifyIntent(d.question,d.context),axes=semanticProfile(d.card),group=formGroup(d.card,d.context,intent,axes);
    const form=FORM_COPY[group][d.context]||FORM_COPY[group].DEFAULT;
    const style=safeStyle(d.card,d.context),signal=signalName(intent,d.context),caveat=caveatFor(d.card,d.context,intent);
    const specialKey=`${d.cardCode}|${d.context}|${intent}`;
    const shortMessage=SPECIAL_MESSAGES[specialKey]||`${strengthSentence(signal,d.score)} ${form} 쪽의 ${style} 흐름이에요. ${caveat}`;
    const strength=d.score>=75?'전달 동력이 강한 편이에요':d.score>=55?'전달 가능성이 중간 이상이에요':d.score>=35?'추가 확인과 조율이 필요해요':'지금은 대기와 지연 쪽이 강해요';
    const fullMessage=`이 질문은 ${INTENTS[intent]} 흐름으로 읽어요. ${style} 성격과 ${form} 신호를 함께 보면 ${strength}. ${caveat}`;
    return Object.freeze({
      question:d.question,context:d.context,contextLabel:CONTEXTS[d.context],cardCode:d.cardCode,score:d.score,
      signalLevel:d.signalLevel,intent,axes,shortMessage,fullMessage,
      details:Object.freeze(detailsFor(d.card,d.context,intent,d.score,axes,form).map(item=>Object.freeze(item))),
      caveat,specialOverride:Object.hasOwn(SPECIAL_MESSAGES,specialKey),keyDetails:d.card.keyDetails
    });
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
  function copyText(value,deck){
    const d=interpret(value);if(!d)return '';const id=identity(d.cardCode,deck);
    const details=d.details.map(item=>`${item.label} ${item.value}`).join(' · ');
    return `LUNEA MESSAGE ORACLE\n질문: ${d.question}\n맥락: ${d.contextLabel}\n질문 의도: ${INTENTS[d.intent]}\n카드: ${id?.name||d.cardCode} (${d.cardCode}) · 정방향\n카드 기반 연락·소식 발생·전달 신호 강도: ${d.score}%\n실제 통계 확률이 아니며, 합격·승인·긍정 결과 확률이 아니라 연락·소식 신호를 카드 상징으로 환산한 지표예요.\n핵심 메시지: ${d.shortMessage}\n전체 메시지: ${d.fullMessage}\nKey Details: ${details}`;
  }
  root.LUNEA_MESSAGE_ORACLE_V1=Object.freeze({
    cards:Object.freeze(cards),CONTEXTS,INTENTS,AXIS_LEVELS,classify,resolveContext,classifyIntent,semanticProfile,
    result,draw,restore,describe,interpret,storage,identity,copyText,LAST_KEY,SAVED_KEY,
    diagnostics:Object.freeze({specialOverrideCount:Object.keys(SPECIAL_MESSAGES).length,fallbackCount:0})
  });
})();
