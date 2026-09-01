'use strict';

/*
  LUNEA FIXED SPREAD DEPTH V30
  ============================
  Deepens only the fixed presets that were too shallow for evidence-based use.

  - No RNG / card identity / reversal changes.
  - No AI custom spread changes.
  - No learning-memory changes.
  - Keeps already-deep presets (Celtic Cross, Deep Flow, Love 5/7/9, etc.) intact.
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
      version: 30,
      presets: Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, {
        count: v.count,
        positions: v.positions.slice()
      }]))
    };
    console.info('✦ LUNEA Fixed Spread Depth V30 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
