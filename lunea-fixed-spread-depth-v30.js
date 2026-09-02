'use strict';

/*
  LUNEA FIXED SPREAD DEPTH V30.2
  ==============================
  Deepens fixed presets that were too shallow for evidence-based use.

  - No RNG / card identity / reversal changes.
  - No AI custom spread changes.
  - No learning-memory changes.
  - Keeps already-deep specialist presets (Celtic Cross, Deep Flow, 19+ etc.) intact.
*/
(() => {
  const W = window;
  if (W.__LUNEA_FIXED_SPREAD_DEPTH_V30__) return;
  W.__LUNEA_FIXED_SPREAD_DEPTH_V30__ = true;

  const PRESETS = {
    'YES / NO': {
      count: 5,
      desc: '찬성·반대 근거를 같은 무게로 보고, 숨은 변수와 현실 검증 조건까지 분리합니다.',
      subtitle: '긍정 근거 · 반대 근거 · 숨은 변수 · 결정 조건 · 최종 판단',
      positions: [
        '긍정 판단을 가장 강하게 지지하는 현재 근거',
        '반대 판단을 가장 강하게 지지하는 현재 근거',
        '예/아니오를 뒤집을 수 있는 숨은 변수 또는 누락 정보',
        '결론이 성립하려면 현실에서 확인되어야 할 결정 조건',
        '지금 시점의 종합 판단과 다음에 확인할 현실 신호'
      ]
    },
    'TIMELINE': {
      count: 5,
      desc: '단순 과거·현재·미래 대신 시작 원인, 최근 변화, 현재 분기점과 가까운·후속 흐름을 나눕니다.',
      subtitle: '시작 원인 · 최근 변화 · 현재 분기점 · 가까운 전개 · 후속 흐름',
      positions: [
        '현재 상황을 시작시킨 가장 직접적인 과거 원인',
        '최근 흐름을 실제로 바꾼 변화나 사건',
        '지금 결과를 가르는 현재의 핵심 분기점',
        '가까운 기간 가장 먼저 나타날 현실적 전개',
        '그 전개가 이어질 경우의 다음 방향과 확인 신호'
      ]
    },
    '시험 합격운': {
      count: 6,
      desc: '막연한 합격운 대신 현재 실력, 점수 손실 변수, 당일 변수와 막판 보완점을 분리합니다.',
      subtitle: '실력 · 병목 · 실전 변수 · 강점 · 보완 · 합격권 신호',
      positions: [
        '현재 가장 점수로 연결되는 학습 완성도와 실력 자원',
        '공부 시간 대비 효율을 떨어뜨리는 가장 큰 병목 영역',
        '시험 당일 점수를 깎을 가능성이 가장 큰 실전 변수',
        '합격 가능성을 실제로 끌어올리는 현재의 강점',
        '지금부터 시험 전까지 가장 빠르게 점수로 전환할 보완점',
        '합격권 진입 여부를 판단할 현실적인 최종 신호와 전략'
      ]
    },
    '직장 내 대인관계 & 평판': {
      count: 6,
      desc: '현재 이미지뿐 아니라 우호·경계 세력, 갈등 촉발점과 평판 회복 행동까지 조직적으로 봅니다.',
      subtitle: '현재 이미지 · 우호 · 경계 · 갈등 · 숨은 역학 · 대응',
      positions: [
        '조직 안에서 현재 가장 강하게 형성된 나의 이미지',
        '나를 우호적으로 보거나 실제로 지지하는 흐름',
        '나를 경계하거나 부정적으로 해석하는 흐름',
        '갈등이나 평판 손상을 촉발할 가능성이 큰 변수',
        '겉으로 드러나지 않은 조직 내 이해관계와 숨은 역학',
        '평판과 관계를 가장 효과적으로 지키거나 회복할 행동'
      ]
    },
    '이직 & 커리어 전환': {
      count: 7,
      desc: '잔류와 이동을 같은 축으로 비교하고 단기 이득보다 비용·지속 흐름과 결정 조건을 봅니다.',
      subtitle: '잔류 이득·비용·흐름 ↔ 이동 이득·비용·흐름 · 결정 조건',
      positions: [
        '현 직장에 남을 때 얻는 가장 현실적인 이점',
        '현 직장에 남을 때 감수해야 할 숨은 비용과 정체 요인',
        '잔류를 선택했을 때 가까운 기간의 커리어 흐름',
        '이직·이동을 선택할 때 얻는 가장 현실적인 이점',
        '이직·이동을 선택할 때 감수해야 할 비용과 리스크',
        '이동을 선택했을 때 가까운 기간의 커리어 흐름',
        '두 선택지 중 결정을 내릴 때 반드시 확인할 현실 조건'
      ]
    },
    '일반 금전운 & 재물 흐름': {
      count: 6,
      desc: '현재 현금흐름, 새는 돈, 수익 기회, 외부 변수와 재정 안정 행동을 분리합니다.',
      subtitle: '현금흐름 · 누수 · 수익 기회 · 외부 변수 · 리스크 · 안정 행동',
      positions: [
        '현재 돈의 유입과 유출을 결정하는 핵심 흐름',
        '내가 과소평가하고 있는 지출·누수·고정비 위험',
        '가까운 기간 새롭게 열릴 수 있는 수익 또는 절약 기회',
        '내 통제 밖에서 재정에 영향을 줄 외부 변수',
        '현재 재정 판단에서 가장 조심해야 할 리스크나 편향',
        '재정 안정성을 실제로 높일 우선 행동과 확인 신호'
      ]
    },
    '친구·지인 관계 & 주변 인연운': {
      count: 6,
      desc: '기존 관계와 새 인연을 한 덩어리로 보지 않고 우호·거리감·새 연결·검증 신호를 나눕니다.',
      subtitle: '현재 관계망 · 우호 · 거리감 · 새 인연 · 변화 조건 · 조언',
      positions: [
        '현재 주변 인간관계 전체에서 가장 강한 분위기',
        '나와 가까워지거나 실제로 도움을 주는 우호적 관계',
        '거리감·오해·갈등을 만드는 가장 큰 관계 변수',
        '새롭게 들어오거나 성격이 바뀔 가능성이 큰 인연',
        '관계 변화가 실제로 시작됐다고 볼 수 있는 현실 신호',
        '기존 관계와 새 인연을 건강하게 운영할 행동 기준'
      ]
    },
    '상대 속마음': {
      count: 7,
      desc: '감정 하나로 단정하지 않고 인식·의식적 감정·무의식·끌림·장벽·행동 의지·관계 욕구를 분리합니다.',
      subtitle: '인식 · 의식 감정 · 무의식 · 끌림 · 장벽 · 행동 의지 · 관계 욕구',
      positions: [
        '상대가 현재 나와 관계를 어떻게 인식하고 있는지',
        '상대가 스스로 인정하고 있는 의식적인 감정',
        '상대가 아직 인정하지 않거나 숨기는 무의식적 감정',
        '나에게 느끼는 호감·매력·정서적 끌림의 성격',
        '가까워지는 것을 망설이게 하는 가장 큰 장벽',
        '감정이 실제 행동으로 이어질 현재 의지와 가능성',
        '상대가 현실적으로 원하는 관계의 형태와 다음 신호'
      ]
    },
    '연락운 & 시기': {
      count: 7,
      desc: '연락 생각과 실제 행동을 분리하고 촉발점·장벽·전조·시기감·첫 연락 이후 흐름까지 봅니다.',
      subtitle: '의향 · 장벽 · 촉발점 · 전조 · 시기감 · 실제 행동 · 이후 흐름',
      positions: [
        '상대에게 현재 실제 연락 의향이 있는지',
        '연락하고 싶어도 행동을 막는 가장 큰 장벽',
        '연락 충동을 현실 행동으로 바꿀 촉발 사건이나 감정',
        '연락 전에 먼저 나타날 가능성이 높은 현실 전조',
        '가까운 시기 흐름에서 연락 가능성이 강해지는 구간의 성격',
        '생각이 아니라 실제 연락 행동으로 넘어갈 가능성과 조건',
        '첫 접촉이 이루어진 뒤 관계가 이어지는 방향'
      ]
    },
    '재회운': {
      count: 7,
      desc: '미련의 존재보다 이별 원인, 양쪽의 현재 상태, 현실 장벽, 재접촉 조건과 재회 후 지속 가능성을 봅니다.',
      subtitle: '이별 원인 · 내 상태 · 상대 상태 · 장벽 · 재접촉 · 반복 위험 · 지속 조건',
      positions: [
        '이별 또는 단절을 만든 가장 본질적인 원인',
        '현재 내가 관계 회복을 바라보는 실제 상태와 동기',
        '현재 상대에게 남아 있는 감정·미련 또는 거리두기의 성격',
        '재회를 막는 가장 강한 현실 장벽이나 다른 변수',
        '실제 재접촉·대화·관계 회복을 시작하게 할 조건',
        '재회하더라도 다시 반복될 가능성이 큰 과거 패턴',
        '재회가 일시적 복귀가 아니라 지속 가능한 관계가 되기 위한 기준'
      ]
    },
    '매수 판단': {
      count: 5,
      desc: '진입 욕구와 실제 매수 근거를 분리하고 반대 근거·대기 조건·손실 관리 기준까지 봅니다.',
      subtitle: '매수 근거 · 반대 근거 · 심리 편향 · 대기 조건 · 리스크 기준',
      positions: [
        '지금 매수를 지지하는 가장 강한 근거 또는 흐름',
        '지금 매수를 반대하는 가장 강한 위험 신호',
        '판단을 흐릴 수 있는 조급함·FOMO·확증편향',
        '지금 바로 들어가지 않는다면 기다려야 할 현실 확인 조건',
        '진입 여부를 결정할 최종 리스크 관리 기준'
      ]
    },
    '보유 / 익절': {
      count: 7,
      desc: '보유와 수익 실현을 같은 기준으로 비교하고 시장 신호와 심리 편향, 분할 대응 기준까지 나눕니다.',
      subtitle: '보유 근거 · 익절 근거 · 상승 신호 · 위험 신호 · 편향 · 분할 대응 · 최종 기준',
      positions: [
        '계속 보유를 지지하는 가장 강한 현재 근거',
        '지금 일부 또는 전부 익절을 지지하는 가장 강한 근거',
        '추가 상승 가능성을 확인할 현실적 신호',
        '보유 논리를 무너뜨릴 수 있는 핵심 위험 신호',
        '욕심·공포·본전심리 등 판단을 흐리는 심리 편향',
        '분할 익절·비중 조절 등 리스크를 줄일 현실적 대응',
        '보유와 익절 중 최종 결정을 가를 확인 기준'
      ]
    },
    '매도 타이밍': {
      count: 7,
      desc: '매도 충동과 실제 청산 근거를 분리하고 보유 대안, 손실 방어, 반등·악화 신호와 실행 조건을 봅니다.',
      subtitle: '매도 근거 · 보유 근거 · 편향 · 반등 신호 · 악화 신호 · 방어 원칙 · 실행 조건',
      positions: [
        '지금 매도를 지지하는 가장 강한 현실 근거',
        '조금 더 보유하는 것을 지지하는 가장 강한 현실 근거',
        '공포·후회·본전심리 등 매도 판단을 흐리는 편향',
        '매도를 미루어도 된다고 볼 수 있는 반등·회복 신호',
        '더 이상 버티면 안 된다고 볼 수 있는 악화 신호',
        '손실과 기회비용을 함께 고려한 방어 원칙',
        '실제 매도 실행 여부와 시점을 가를 최종 조건'
      ]
    }
  };

  function patchFixedPositions() {
    if (typeof fixedPositions !== 'function') {
      console.warn('[LUNEA V30] fixedPositions() not found');
      return false;
    }
    if (W.__LUNEA_FIXED_SPREAD_DEPTH_V30_WRAPPED__) return true;
    W.__LUNEA_FIXED_SPREAD_DEPTH_V30_WRAPPED__ = true;

    const previous = fixedPositions;
    fixedPositions = function(title, count) {
      const preset = PRESETS[String(title || '')];
      if (preset) return preset.positions.slice();
      return previous.apply(this, arguments);
    };
    return true;
  }

  function patchMenuItem(title, preset) {
    const items = [...document.querySelectorAll('.reading-item')]
      .filter(el => el.dataset.title === title);
    items.forEach(el => {
      el.dataset.count = String(preset.count);
      el.dataset.desc = preset.desc;
      const p = el.querySelector('p');
      const badge = el.querySelector('.count');
      if (p) p.textContent = preset.subtitle;
      if (badge) badge.textContent = String(preset.count);
      el.dataset.luneaDepthV30 = '1';
      el.setAttribute('aria-label', `${title} · ${preset.count}장 · ${preset.subtitle}`);
    });
  }

  function patchMenus() {
    Object.entries(PRESETS).forEach(([title, preset]) => patchMenuItem(title, preset));
  }

  function boot() {
    patchFixedPositions();
    patchMenus();

    [120, 500, 1200].forEach(ms => setTimeout(() => {
      patchFixedPositions();
      patchMenus();
    }, ms));

    W.LUNEA_FIXED_SPREAD_DEPTH_V30 = {
      version: 30.2,
      presets: Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, {
        count: v.count,
        positions: v.positions.slice()
      }]))
    };
    console.info('✦ LUNEA Fixed Spread Depth V30.2 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
