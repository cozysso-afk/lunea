'use strict';
/* ============================================================
   LUNEA TIMING ORACLE V1
   - Separate 60-card timing deck (NO RWS cards inside this deck)
   - Existing RWS / Spread V7.4 / archive / RNG remain intact
   - Upright only
   - Default 1 timing card
   - Question-aware candidate filtering
   - One optional refine draw
   - RWS + Timing prompt integration
   - Existing LUNEA_ARCHIVE_V3 preserved
   ============================================================ */
(() => {
  if (window.__LUNEA_TIMING_ORACLE_V1__) return;
  window.__LUNEA_TIMING_ORACLE_V1__ = true;

  const TIMING_CARDS = [{"id":"LT-001","group":"short_range","label_ko":"아주 가까운 때","label_en":"Near Now","meaning":"이미 움직임이 시작됐거나 바로 앞에 닿아 있는 매우 가까운 시기","filename":"timing_001_near_now.png","weight":1.0,"visual_motif":"문턱 바로 앞에 떠오른 작은 별","relative_type":"days","min_days":0,"max_days":1,"refine_group":"short"},{"id":"LT-002","group":"short_range","label_ko":"몇 시간 안","label_en":"Within Hours","meaning":"같은 날 안에서 비교적 빠르게 체감될 수 있는 구간","filename":"timing_002_within_hours.png","weight":1.0,"visual_motif":"모래가 거의 다 내려간 작은 모래시계","relative_type":"days","min_days":0,"max_days":0.5,"refine_group":"short"},{"id":"LT-003","group":"short_range","label_ko":"오늘 안","label_en":"Within Today","meaning":"현재 날짜가 끝나기 전까지의 범위","filename":"timing_003_within_today.png","weight":1.0,"visual_motif":"해가 떠서 지는 하나의 원형 궤적","relative_type":"days","min_days":0,"max_days":1,"refine_group":"short"},{"id":"LT-004","group":"short_range","label_ko":"오늘 밤","label_en":"Tonight","meaning":"현재 날짜의 저녁부터 자정 전후까지","filename":"timing_004_tonight.png","weight":1.0,"visual_motif":"초승달과 하나의 밝은 창","relative_type":"days","min_days":0,"max_days":1,"refine_group":"short"},{"id":"LT-005","group":"short_range","label_ko":"24시간 전후","label_en":"Around 24 Hours","meaning":"지금부터 약 하루 안팎","filename":"timing_005_around_24h.png","weight":1.0,"visual_motif":"하루를 상징하는 태양과 달의 이중 원","relative_type":"days","min_days":0.75,"max_days":1.25,"refine_group":"short"},{"id":"LT-006","group":"short_range","label_ko":"2~3일 안","label_en":"Within 2–3 Days","meaning":"지금부터 약 2~3일 범위","filename":"timing_006_2_3_days.png","weight":1.0,"visual_motif":"세 개의 작은 별이 순서대로 켜지는 장면","relative_type":"days","min_days":2,"max_days":3,"refine_group":"short"},{"id":"LT-007","group":"short_range","label_ko":"4~5일 안","label_en":"Within 4–5 Days","meaning":"지금부터 약 4~5일 범위","filename":"timing_007_4_5_days.png","weight":1.0,"visual_motif":"다섯 개의 금빛 점이 이어진 짧은 별자리","relative_type":"days","min_days":4,"max_days":5,"refine_group":"short"},{"id":"LT-008","group":"short_range","label_ko":"이번 주 안","label_en":"Within This Week","meaning":"현재 주기가 끝나기 전까지","filename":"timing_008_this_week.png","weight":1.0,"visual_motif":"일곱 점의 별이 원을 이루는 주간 고리","relative_type":"days","min_days":0,"max_days":7,"refine_group":"short"},{"id":"LT-009","group":"short_range","label_ko":"7~10일 전후","label_en":"Around 7–10 Days","meaning":"약 1주에서 열흘 사이","filename":"timing_009_7_10_days.png","weight":1.0,"visual_motif":"일곱 별과 열 개의 작은 빛점이 교차","relative_type":"days","min_days":7,"max_days":10,"refine_group":"short"},{"id":"LT-010","group":"short_range","label_ko":"2주 전후","label_en":"Around 2 Weeks","meaning":"약 12~16일 정도의 범위","filename":"timing_010_around_2_weeks.png","weight":1.0,"visual_motif":"두 겹의 달무리","relative_type":"days","min_days":12,"max_days":16,"refine_group":"short"},{"id":"LT-011","group":"short_range","label_ko":"3주 전후","label_en":"Around 3 Weeks","meaning":"약 18~24일 정도의 범위","filename":"timing_011_around_3_weeks.png","weight":1.0,"visual_motif":"세 개의 달무리가 차례로 확장","relative_type":"days","min_days":18,"max_days":24,"refine_group":"short"},{"id":"LT-012","group":"short_range","label_ko":"한 달 안팎","label_en":"Around 1 Month","meaning":"대략 25~35일 범위","filename":"timing_012_around_1_month.png","weight":1.0,"visual_motif":"한 번 완성되는 달의 순환","relative_type":"days","min_days":25,"max_days":35,"refine_group":"short"},{"id":"LT-013","group":"short_range","label_ko":"4~6주","label_en":"Within 4–6 Weeks","meaning":"약 28~42일 범위","filename":"timing_013_4_6_weeks.png","weight":1.0,"visual_motif":"네 개의 별과 여섯 개의 별이 양쪽에 배치","relative_type":"days","min_days":28,"max_days":42,"refine_group":"short"},{"id":"LT-014","group":"short_range","label_ko":"다음 주 초반","label_en":"Early Next Week","meaning":"다음 주의 앞쪽 구간","filename":"timing_014_early_next_week.png","weight":1.0,"visual_motif":"새 주기의 문이 막 열리는 장면","relative_type":"days","min_days":7,"max_days":11,"refine_group":"short"},{"id":"LT-015","group":"short_range","label_ko":"다음 주 후반","label_en":"Late Next Week","meaning":"다음 주의 뒤쪽 구간","filename":"timing_015_late_next_week.png","weight":1.0,"visual_motif":"주기의 후반을 향해 기우는 달","relative_type":"days","min_days":11,"max_days":14,"refine_group":"short"},{"id":"LT-016","group":"short_range","label_ko":"주말 창구","label_en":"Weekend Window","meaning":"가까운 토·일요일 또는 주말성 휴식 구간","filename":"timing_016_weekend_window.png","weight":1.0,"visual_motif":"금빛 별 두 개가 나란히 쉬는 듯한 장면","relative_type":"days","min_days":0,"max_days":14,"refine_group":"short"},{"id":"LT-017","group":"day_window","label_ko":"새벽","label_en":"Dawn","meaning":"현지 시각 기준 대략 03:00~06:00","filename":"timing_017_dawn.png","weight":1.0,"visual_motif":"푸른 새벽빛과 지평선 아래 별","relative_type":"daypart","start_hour":3,"end_hour":6,"refine_group":"daypart"},{"id":"LT-018","group":"day_window","label_ko":"이른 아침","label_en":"Early Morning","meaning":"대략 06:00~09:00","filename":"timing_018_early_morning.png","weight":1.0,"visual_motif":"옅은 분홍 하늘과 떠오르는 태양","relative_type":"daypart","start_hour":6,"end_hour":9,"refine_group":"daypart"},{"id":"LT-019","group":"day_window","label_ko":"오전","label_en":"Morning","meaning":"대략 09:00~12:00","filename":"timing_019_morning.png","weight":1.0,"visual_motif":"맑은 햇살과 금빛 원","relative_type":"daypart","start_hour":9,"end_hour":12,"refine_group":"daypart"},{"id":"LT-020","group":"day_window","label_ko":"정오 무렵","label_en":"Around Noon","meaning":"대략 11:30~13:30","filename":"timing_020_noon.png","weight":1.0,"visual_motif":"하늘 정점의 작은 태양","relative_type":"daypart","start_hour":11.5,"end_hour":13.5,"refine_group":"daypart"},{"id":"LT-021","group":"day_window","label_ko":"오후","label_en":"Afternoon","meaning":"대략 13:00~16:00","filename":"timing_021_afternoon.png","weight":1.0,"visual_motif":"부드러운 낮빛과 긴 창문 그림자","relative_type":"daypart","start_hour":13,"end_hour":16,"refine_group":"daypart"},{"id":"LT-022","group":"day_window","label_ko":"늦은 오후","label_en":"Late Afternoon","meaning":"대략 16:00~18:00","filename":"timing_022_late_afternoon.png","weight":1.0,"visual_motif":"기울어진 금빛 햇살","relative_type":"daypart","start_hour":16,"end_hour":18,"refine_group":"daypart"},{"id":"LT-023","group":"day_window","label_ko":"해질 무렵","label_en":"Dusk","meaning":"계절에 따라 달라지는 일몰 전후","filename":"timing_023_dusk.png","weight":1.0,"visual_motif":"라벤더와 살구빛이 섞인 지평선","relative_type":"daypart","start_hour":null,"end_hour":null,"refine_group":"daypart"},{"id":"LT-024","group":"day_window","label_ko":"저녁","label_en":"Evening","meaning":"대략 19:00~22:00","filename":"timing_024_evening.png","weight":1.0,"visual_motif":"첫 별과 따뜻한 실내 불빛","relative_type":"daypart","start_hour":19,"end_hour":22,"refine_group":"daypart"},{"id":"LT-025","group":"day_window","label_ko":"늦은 밤","label_en":"Late Night","meaning":"대략 22:00~24:00","filename":"timing_025_late_night.png","weight":1.0,"visual_motif":"짙은 남색 하늘과 금빛 초승달","relative_type":"daypart","start_hour":22,"end_hour":24,"refine_group":"daypart"},{"id":"LT-026","group":"day_window","label_ko":"자정 너머","label_en":"After Midnight","meaning":"대략 00:00~02:30","filename":"timing_026_after_midnight.png","weight":1.0,"visual_motif":"자정의 시계와 은빛 별가루","relative_type":"daypart","start_hour":0,"end_hour":2.5,"refine_group":"daypart"},{"id":"LT-027","group":"seasonal","label_ko":"초봄","label_en":"Early Spring","meaning":"다가오는 봄의 시작 구간","filename":"timing_027_early_spring.png","weight":1.0,"visual_motif":"연한 새싹과 작은 별","relative_type":"season","season":"spring","season_phase":"early","refine_group":"seasonal"},{"id":"LT-028","group":"seasonal","label_ko":"늦봄","label_en":"Late Spring","meaning":"봄이 무르익고 여름으로 넘어가기 전","filename":"timing_028_late_spring.png","weight":1.0,"visual_motif":"꽃잎과 따뜻한 바람의 궤적","relative_type":"season","season":"spring","season_phase":"late","refine_group":"seasonal"},{"id":"LT-029","group":"seasonal","label_ko":"초여름","label_en":"Early Summer","meaning":"여름이 시작되는 구간","filename":"timing_029_early_summer.png","weight":1.0,"visual_motif":"옅은 태양과 푸른 잎","relative_type":"season","season":"summer","season_phase":"early","refine_group":"seasonal"},{"id":"LT-030","group":"seasonal","label_ko":"늦여름","label_en":"Late Summer","meaning":"더위가 누그러지고 계절이 기우는 구간","filename":"timing_030_late_summer.png","weight":1.0,"visual_motif":"황금빛 풀과 길어진 그림자","relative_type":"season","season":"summer","season_phase":"late","refine_group":"seasonal"},{"id":"LT-031","group":"seasonal","label_ko":"초가을","label_en":"Early Autumn","meaning":"가을이 시작되는 구간","filename":"timing_031_early_autumn.png","weight":1.0,"visual_motif":"연보라 하늘과 첫 낙엽","relative_type":"season","season":"autumn","season_phase":"early","refine_group":"seasonal"},{"id":"LT-032","group":"seasonal","label_ko":"늦가을","label_en":"Late Autumn","meaning":"가을이 깊어지고 겨울로 넘어가기 전","filename":"timing_032_late_autumn.png","weight":1.0,"visual_motif":"말린 잎과 은빛 바람","relative_type":"season","season":"autumn","season_phase":"late","refine_group":"seasonal"},{"id":"LT-033","group":"seasonal","label_ko":"초겨울","label_en":"Early Winter","meaning":"겨울이 시작되는 구간","filename":"timing_033_early_winter.png","weight":1.0,"visual_motif":"첫 눈결정과 푸른 달빛","relative_type":"season","season":"winter","season_phase":"early","refine_group":"seasonal"},{"id":"LT-034","group":"seasonal","label_ko":"늦겨울","label_en":"Late Winter","meaning":"겨울이 끝나고 새 계절 직전","filename":"timing_034_late_winter.png","weight":1.0,"visual_motif":"녹기 시작한 눈과 작은 새싹","relative_type":"season","season":"winter","season_phase":"late","refine_group":"seasonal"},{"id":"LT-035","group":"seasonal","label_ko":"월초","label_en":"Start of Month","meaning":"달력 기준 해당 월의 앞부분","filename":"timing_035_month_start.png","weight":1.0,"visual_motif":"초승달 같은 얇은 금빛 호","relative_type":"month_position","season":null,"season_phase":null,"refine_group":"seasonal"},{"id":"LT-036","group":"seasonal","label_ko":"월중","label_en":"Middle of Month","meaning":"해당 월의 중간 구간","filename":"timing_036_month_middle.png","weight":1.0,"visual_motif":"반달과 균형 잡힌 두 별","relative_type":"month_position","season":null,"season_phase":null,"refine_group":"seasonal"},{"id":"LT-037","group":"seasonal","label_ko":"월말","label_en":"End of Month","meaning":"해당 월의 마지막 구간","filename":"timing_037_month_end.png","weight":1.0,"visual_motif":"거의 찬 달과 닫히는 원","relative_type":"month_position","season":null,"season_phase":null,"refine_group":"seasonal"},{"id":"LT-038","group":"seasonal","label_ko":"계절 전환점","label_en":"Season Turn","meaning":"계절이 바뀌는 경계 구간","filename":"timing_038_season_turn.png","weight":1.0,"visual_motif":"두 계절의 식물이 한 원 안에서 교차","relative_type":"season_transition","season":null,"season_phase":null,"refine_group":"seasonal"},{"id":"LT-039","group":"mid_range","label_ko":"1~2개월","label_en":"1–2 Months","meaning":"약 30~60일 범위","filename":"timing_039_1_2_months.png","weight":1.0,"visual_motif":"두 개의 큰 달무리","relative_type":"days","min_days":30,"max_days":60,"refine_group":"mid"},{"id":"LT-040","group":"mid_range","label_ko":"2~3개월","label_en":"2–3 Months","meaning":"약 60~90일 범위","filename":"timing_040_2_3_months.png","weight":1.0,"visual_motif":"세 겹으로 깊어지는 별빛 고리","relative_type":"days","min_days":60,"max_days":90,"refine_group":"mid"},{"id":"LT-041","group":"mid_range","label_ko":"3~4개월","label_en":"3–4 Months","meaning":"약 90~120일 범위","filename":"timing_041_3_4_months.png","weight":1.0,"visual_motif":"네 개의 계단형 별빛","relative_type":"days","min_days":90,"max_days":120,"refine_group":"mid"},{"id":"LT-042","group":"mid_range","label_ko":"4~5개월","label_en":"4–5 Months","meaning":"약 120~150일 범위","filename":"timing_042_4_5_months.png","weight":1.0,"visual_motif":"다섯 개의 얇은 달 호","relative_type":"days","min_days":120,"max_days":150,"refine_group":"mid"},{"id":"LT-043","group":"mid_range","label_ko":"5~6개월","label_en":"5–6 Months","meaning":"약 150~180일 범위","filename":"timing_043_5_6_months.png","weight":1.0,"visual_motif":"반년을 향해 차오르는 달","relative_type":"days","min_days":150,"max_days":180,"refine_group":"mid"},{"id":"LT-044","group":"mid_range","label_ko":"6~8개월","label_en":"6–8 Months","meaning":"약 180~240일 범위","filename":"timing_044_6_8_months.png","weight":1.0,"visual_motif":"긴 곡선을 따라 이동하는 여덟 별","relative_type":"days","min_days":180,"max_days":240,"refine_group":"mid"},{"id":"LT-045","group":"mid_range","label_ko":"8~10개월","label_en":"8–10 Months","meaning":"약 240~300일 범위","filename":"timing_045_8_10_months.png","weight":1.0,"visual_motif":"멀리 이어진 금빛 별자리","relative_type":"days","min_days":240,"max_days":300,"refine_group":"mid"},{"id":"LT-046","group":"mid_range","label_ko":"10~12개월","label_en":"10–12 Months","meaning":"약 300~365일 범위","filename":"timing_046_10_12_months.png","weight":1.0,"visual_motif":"완성을 앞둔 큰 원형 궤도","relative_type":"days","min_days":300,"max_days":365,"refine_group":"mid"},{"id":"LT-047","group":"mid_range","label_ko":"1년 안","label_en":"Within a Year","meaning":"현재부터 1년 범위 안에서 현실화될 가능성","filename":"timing_047_within_a_year.png","weight":1.0,"visual_motif":"한 해의 사계절을 한 원으로 추상화","relative_type":"days","min_days":0,"max_days":365,"refine_group":"mid"},{"id":"LT-048","group":"mid_range","label_ko":"1년 전후","label_en":"Around One Year","meaning":"약 11~14개월 범위","filename":"timing_048_around_one_year.png","weight":1.0,"visual_motif":"한 바퀴를 마치고 다시 시작되는 궤도","relative_type":"days","min_days":335,"max_days":425,"refine_group":"mid"},{"id":"LT-049","group":"long_range","label_ko":"12~18개월","label_en":"12–18 Months","meaning":"약 1년~1년 반 범위","filename":"timing_049_12_18_months.png","weight":1.0,"visual_motif":"멀리 이어지는 두 겹의 궤도","relative_type":"days","min_days":365,"max_days":548,"refine_group":"long"},{"id":"LT-050","group":"long_range","label_ko":"1.5~2년","label_en":"1.5–2 Years","meaning":"약 18~24개월 범위","filename":"timing_050_1_5_2_years.png","weight":1.0,"visual_motif":"두 개의 큰 별문이 연속된 장면","relative_type":"days","min_days":548,"max_days":730,"refine_group":"long"},{"id":"LT-051","group":"long_range","label_ko":"2~3년","label_en":"2–3 Years","meaning":"약 2~3년 범위","filename":"timing_051_2_3_years.png","weight":1.0,"visual_motif":"세 개의 먼 별섬","relative_type":"days","min_days":730,"max_days":1095,"refine_group":"long"},{"id":"LT-052","group":"long_range","label_ko":"3~5년","label_en":"3–5 Years","meaning":"약 3~5년 범위","filename":"timing_052_3_5_years.png","weight":1.0,"visual_motif":"긴 은하수 길","relative_type":"days","min_days":1095,"max_days":1825,"refine_group":"long"},{"id":"LT-053","group":"long_range","label_ko":"먼 미래","label_en":"Distant Future","meaning":"현재 기준으로 구체적 날짜보다 장기 변화가 먼저 필요한 먼 시기","filename":"timing_053_distant_future.png","weight":1.0,"visual_motif":"안개 너머 아주 먼 금빛 별","relative_type":"days","min_days":1825,"max_days":null,"refine_group":"long"},{"id":"LT-054","group":"delay_non_event","label_ko":"아직 때가 아님","label_en":"Not Yet","meaning":"사건 가능성을 곧바로 날짜로 좁히기보다 조건이 더 무르익어야 함","filename":"timing_054_not_yet.png","weight":1.0,"visual_motif":"닫힌 꽃봉오리와 희미한 달","relative_type":"state","state_flag":"delay","refine_group":"delay"},{"id":"LT-055","group":"delay_non_event","label_ko":"조건이 먼저","label_en":"Conditions First","meaning":"시간보다 선행 조건·합의·환경 정리가 먼저 필요한 상태","filename":"timing_055_conditions_first.png","weight":1.0,"visual_motif":"잠긴 문 앞의 금빛 열쇠","relative_type":"state","state_flag":"delay","refine_group":"delay"},{"id":"LT-056","group":"delay_non_event","label_ko":"예상보다 늦게","label_en":"Later Than Expected","meaning":"사용자가 예상한 속도보다 늦어질 가능성이 큰 흐름","filename":"timing_056_later_than_expected.png","weight":1.0,"visual_motif":"천천히 내려가는 모래시계","relative_type":"state","state_flag":"delay","refine_group":"delay"},{"id":"LT-057","group":"delay_non_event","label_ko":"질문한 기간 밖","label_en":"Outside the Asked Window","meaning":"질문자가 지정한 시간 범위 안에서는 성립이 약하고 그 이후로 밀릴 수 있음","filename":"timing_057_outside_window.png","weight":1.0,"visual_motif":"테두리 밖으로 넘어간 작은 별","relative_type":"state","state_flag":"non_event_window","refine_group":"delay"},{"id":"LT-058","group":"delay_non_event","label_ko":"현재 발생 신호 약함","label_en":"Weak Event Signal","meaning":"현 시점에서는 사건 자체가 성립하는 쪽의 신호가 약함","filename":"timing_058_weak_event_signal.png","weight":1.0,"visual_motif":"희미하게 꺼지는 별빛","relative_type":"state","state_flag":"non_event","refine_group":"delay"},{"id":"LT-059","group":"delay_non_event","label_ko":"시기 특정 어려움","label_en":"Timing Unclear","meaning":"변수가 많거나 흐름이 분산돼 한 구간으로 좁히기 어려움","filename":"timing_059_timing_unclear.png","weight":1.0,"visual_motif":"여러 갈래로 퍼지는 안개 속 길","relative_type":"state","state_flag":"unclear","refine_group":"delay"},{"id":"LT-060","group":"delay_non_event","label_ko":"적절한 타이밍이 지남","label_en":"Window Has Passed","meaning":"현재 질문 조건에서는 가장 자연스러운 기회 창이 이미 지나갔을 가능성","filename":"timing_060_window_passed.png","weight":1.0,"visual_motif":"닫힌 금빛 문과 뒤쪽에 남은 빛","relative_type":"state","state_flag":"passed","refine_group":"delay"}];
  const HISTORY_KEY = 'LUNEA_TIMING_HISTORY_V1';
  const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

  const GROUP_LABELS = {
    short_range: 'SHORT RANGE · 가까운 시기',
    day_window: 'DAY WINDOW · 하루 시간대',
    seasonal: 'SEASONAL · 계절/월 위치',
    mid_range: 'MID RANGE · 중기',
    long_range: 'LONG RANGE · 장기',
    delay_non_event: 'DELAY / NON-EVENT · 지연/불발'
  };

  const timingState = {
    mode: null,            // standalone | support
    question: '',
    primary: null,
    refine: null,
    aiText: '',
    analysis: null
  };

  const byId = id => document.getElementById(id);

  function secureInt(maxExclusive) {
    if (typeof secureRandomInt === 'function') return secureRandomInt(maxExclusive);
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError('invalid max');
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const buf = new Uint32Array(1);
    let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % maxExclusive;
  }

  function pick(arr) {
    if (!arr.length) return null;
    return arr[secureInt(arr.length)];
  }

  function normalizeQuestion(s) {
    return String(s || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function questionSignature(s) {
    return normalizeQuestion(s).replace(/[^\p{L}\p{N}]+/gu, '');
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
  }

  function saveHistory(entry) {
    const h = getHistory();
    h.unshift(entry);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 80))); } catch {}
  }

  function recentSameQuestion(q) {
    const sig = questionSignature(q);
    const now = Date.now();
    return getHistory().find(x => x.sig === sig && now - x.at < REPEAT_WINDOW_MS) || null;
  }

  function daysToEndOfWeek(now = new Date()) {
    const d = now.getDay();
    return d === 0 ? 1 : (7 - d) + 1;
  }

  function daysToEndOfMonth(now = new Date()) {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return Math.max(1, Math.ceil((end - now) / 86400000));
  }

  function daysToEndOfYear(now = new Date()) {
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return Math.max(1, Math.ceil((end - now) / 86400000));
  }

  function unitDays(n, unit) {
    if (/시간/.test(unit)) return n / 24;
    if (/일/.test(unit)) return n;
    if (/주/.test(unit)) return n * 7;
    if (/개월|달/.test(unit)) return n * 30.4375;
    if (/년/.test(unit)) return n * 365.25;
    return null;
  }

  function parseExplicitRange(q) {
    const s = normalizeQuestion(q);
    let m;

    // "3개월 후" = centered window rather than 0~3 months.
    m = s.match(/(\d+(?:\.\d+)?)\s*(시간|일|주(?:일)?|개월|달|년)\s*후/);
    if (m) {
      const d = unitDays(Number(m[1]), m[2]);
      const tol = Math.max(1, d * 0.18);
      return { explicit: true, minDays: Math.max(0, d - tol), maxDays: d + tol, type: 'around' };
    }

    const regs = [
      /(\d+(?:\.\d+)?)\s*(시간|일|주(?:일)?|개월|달|년)\s*(?:안|내|이내|동안)?/
    ];
    for (const re of regs) {
      m = s.match(re);
      if (m) {
        const d = unitDays(Number(m[1]), m[2]);
        if (Number.isFinite(d)) return { explicit: true, minDays: 0, maxDays: d, type: 'within' };
      }
    }

    if (/24\s*시간|하루\s*(?:안|내|이내)/.test(s)) return {explicit:true,minDays:0,maxDays:1,type:'within'};
    if (/오늘/.test(s)) return {explicit:true,minDays:0,maxDays:1,type:'within'};
    if (/내일/.test(s)) return {explicit:true,minDays:0,maxDays:2,type:'within'};
    if (/이번\s*주/.test(s)) return {explicit:true,minDays:0,maxDays:daysToEndOfWeek(),type:'within'};
    if (/이번\s*달/.test(s)) return {explicit:true,minDays:0,maxDays:daysToEndOfMonth(),type:'within'};
    if (/올해/.test(s)) return {explicit:true,minDays:0,maxDays:daysToEndOfYear(),type:'within'};
    if (/반년/.test(s)) return {explicit:true,minDays:0,maxDays:183,type:'within'};
    if (/한\s*달/.test(s)) return {explicit:true,minDays:0,maxDays:31,type:'within'};
    if (/일\s*년|한\s*해|1\s*년/.test(s)) return {explicit:true,minDays:0,maxDays:365,type:'within'};

    return { explicit: false, minDays: null, maxDays: null, type: null };
  }

  function analyzeQuestion(q) {
    const s = normalizeQuestion(q);
    const range = parseExplicitRange(s);

    const asksDaypart = /(몇\s*시|시간대|새벽|이른\s*아침|아침|오전|정오|오후|해질|저녁|늦은\s*밤|밤\s*몇|자정)/.test(s);
    const asksSeason = /(어느\s*계절|계절|초봄|늦봄|초여름|늦여름|초가을|늦가을|초겨울|늦겨울|월초|월중|월말)/.test(s);

    const nearEvent = /(연락|답장|카톡|문자|전화|디엠|dm|소개팅|애프터|면접\s*(?:연락|제안)?|합격\s*발표|결과\s*발표|재회|약속|만남|배송|도착)/.test(s);
    const longEvent = /(결혼|출산|임신|이민|정착|내\s*집|집\s*매수|주택\s*구입|창업|은퇴|장기\s*정착)/.test(s);

    return { text:s, ...range, asksDaypart, asksSeason, nearEvent, longEvent };
  }

  function cardHasDays(c) {
    return c.relative_type === 'days' && Number.isFinite(c.min_days);
  }

  function nextApproxSeasonDistance(card, now = new Date()) {
    const map = {
      'LT-027':[2,10],   // early spring
      'LT-028':[4,15],   // late spring
      'LT-029':[5,10],   // early summer
      'LT-030':[7,15],   // late summer
      'LT-031':[8,10],   // early autumn
      'LT-032':[10,15],  // late autumn
      'LT-033':[11,10],  // early winter
      'LT-034':[1,15]    // late winter
    };
    if (!map[card.id]) return null;
    const [m,d] = map[card.id];
    let y = now.getFullYear();
    let target = new Date(y,m,d,12,0,0);
    if (target < now) target = new Date(y+1,m,d,12,0,0);
    return Math.ceil((target-now)/86400000);
  }

  function delayCandidates(explicit) {
    // Outside asked window makes sense only when the user actually declared a window.
    const ids = explicit
      ? ['LT-054','LT-055','LT-056','LT-057','LT-058','LT-059','LT-060']
      : ['LT-054','LT-055','LT-056','LT-058','LT-059','LT-060'];
    return TIMING_CARDS.filter(c => ids.includes(c.id));
  }

  function fitByExplicitRange(a) {
    let time = TIMING_CARDS.filter(c => cardHasDays(c));

    if (a.type === 'around') {
      time = time.filter(c => {
        const cmax = Number.isFinite(c.max_days) ? c.max_days : Infinity;
        return cmax >= a.minDays && c.min_days <= a.maxDays;
      });
    } else {
      time = time.filter(c => {
        const cmax = Number.isFinite(c.max_days) ? c.max_days : Infinity;
        return c.min_days <= a.maxDays && cmax <= Math.max(a.maxDays * 1.12, a.maxDays + 1);
      });
    }

    // Add seasonal/month-position cards only when the declared window is long enough.
    if (a.maxDays >= 60) {
      const seasonal = TIMING_CARDS.filter(c => c.group === 'seasonal').filter(c => {
        if (['LT-035','LT-036','LT-037','LT-038'].includes(c.id)) return true;
        const dist = nextApproxSeasonDistance(c);
        return dist !== null && dist <= a.maxDays;
      });
      time = time.concat(seasonal);
    }
    return [...new Map(time.map(c => [c.id,c])).values()];
  }

  function chooseGroupWeighted(groups) {
    const entries = Object.entries(groups).filter(([,v]) => v.cards.length && v.weight > 0);
    const total = entries.reduce((s,[,v]) => s + v.weight, 0);
    if (!total) return [];
    const scale = 1000;
    const ticket = secureInt(Math.max(1, Math.round(total * scale)));
    let acc = 0;
    for (const [,v] of entries) {
      acc += Math.round(v.weight * scale);
      if (ticket < acc) return v.cards;
    }
    return entries[entries.length-1][1].cards;
  }

  function candidatePool(q) {
    const a = analyzeQuestion(q);
    const delay = delayCandidates(a.explicit);

    if (a.asksDaypart) {
      return { analysis:a, mode:'daypart', primary:TIMING_CARDS.filter(c => c.group === 'day_window'), delay };
    }

    if (a.asksSeason) {
      return { analysis:a, mode:'seasonal', primary:TIMING_CARDS.filter(c => c.group === 'seasonal'), delay };
    }

    if (a.explicit) {
      return { analysis:a, mode:'explicit', primary:fitByExplicitRange(a), delay };
    }

    const groups = {
      short: {cards:TIMING_CARDS.filter(c=>c.group==='short_range'), weight:a.longEvent ? 5 : (a.nearEvent ? 45 : 30)},
      mid: {cards:TIMING_CARDS.filter(c=>c.group==='mid_range'), weight:a.longEvent ? 30 : (a.nearEvent ? 20 : 25)},
      season: {cards:TIMING_CARDS.filter(c=>c.group==='seasonal'), weight:a.longEvent ? 20 : (a.nearEvent ? 10 : 15)},
      long: {cards:TIMING_CARDS.filter(c=>c.group==='long_range'), weight:a.longEvent ? 25 : (a.nearEvent ? 5 : 10)},
      delay: {cards:delay, weight:20}
    };
    return { analysis:a, mode:'weighted', groups };
  }

  function drawPrimary(q, excludeIds=[]) {
    const info = candidatePool(q);
    let chosen;

    if (info.mode === 'weighted') {
      const cards = chooseGroupWeighted(info.groups).filter(c => !excludeIds.includes(c.id));
      chosen = pick(cards.length ? cards : TIMING_CARDS.filter(c => !excludeIds.includes(c.id)));
    } else {
      const nonDelay = info.primary.filter(c => !excludeIds.includes(c.id));
      const delay = info.delay.filter(c => !excludeIds.includes(c.id));

      // Timing states are meaningful but should not dominate a bounded time question.
      const chooseDelay = delay.length && secureInt(100) < 20;
      const pool = chooseDelay ? delay : nonDelay;
      chosen = pick(pool.length ? pool : (delay.length ? delay : TIMING_CARDS));
    }

    return { card:chosen, analysis:info.analysis, poolMode:info.mode };
  }

  function refineCandidates(primary, q) {
    if (!primary || primary.group === 'delay_non_event') return [];

    if (primary.group === 'day_window') return [];

    if (primary.group === 'seasonal') {
      // A season can be narrowed by month position.
      return TIMING_CARDS.filter(c => ['LT-035','LT-036','LT-037'].includes(c.id));
    }

    if (primary.group === 'short_range') {
      // One non-contradictory second layer: likely time-of-day within that range.
      return TIMING_CARDS.filter(c => c.group === 'day_window');
    }

    if (primary.group === 'mid_range' || primary.group === 'long_range') {
      const max = Number.isFinite(primary.max_days) ? primary.max_days : 3650;
      const min = Number.isFinite(primary.min_days) ? primary.min_days : 0;
      const seasonal = TIMING_CARDS.filter(c => c.group === 'seasonal').filter(c => {
        if (['LT-035','LT-036','LT-037','LT-038'].includes(c.id)) return true;
        const dist = nextApproxSeasonDistance(c);
        return dist !== null && dist >= Math.max(0,min-45) && dist <= max+45;
      });
      return seasonal;
    }
    return [];
  }

  function groupLabel(c) {
    return GROUP_LABELS[c?.group] || 'TIMING ORACLE';
  }

  function cardImg(c) {
    return `./${encodeURIComponent(c.filename)}`;
  }

  function addStyles() {
    if (byId('luneaTimingStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaTimingStyle';
    style.textContent = `
      .lunea-timing-category{border-color:rgba(255,210,125,.34)!important;background:
        linear-gradient(145deg,rgba(255,245,228,.10),rgba(189,164,248,.10)),var(--panel)!important}
      .lunea-timing-category .cat-icon{background:rgba(255,210,125,.12)!important;border-color:rgba(255,210,125,.28)!important;color:var(--gold)!important}
      #timingOverlay{background:rgba(8,6,14,.88);backdrop-filter:blur(16px)}
      #timingOverlay .timing-modal{
        color:#3a3042;border-color:rgba(208,171,103,.45);
        background:
          linear-gradient(rgba(255,252,248,.84),rgba(255,250,247,.88)),
          url('./bg.png') center top / cover no-repeat;
        box-shadow:0 24px 70px rgba(0,0,0,.55);
      }
      .timing-modal .sub{color:#9d7d4a}
      .timing-modal .modal-h{color:#3c3344}
      .timing-modal .close{color:#8e7f94}
      .timing-modal textarea{background:rgba(255,255,255,.70);color:#3b3341;border-color:rgba(169,133,72,.25)}
      .timing-help{font-size:10.5px;line-height:1.55;color:#7d7182;margin:4px 0 11px}
      .timing-stage{display:flex;flex-direction:column;align-items:center;gap:10px;min-height:280px}
      .timing-flip{width:174px;height:290px;perspective:1000px;cursor:pointer;display:none}
      .timing-flip.show{display:block}
      .timing-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
      .timing-inner.flipped{transform:rotateY(180deg)}
      .timing-face{position:absolute;inset:0;border-radius:18px;overflow:hidden;backface-visibility:hidden;box-shadow:0 13px 30px rgba(80,51,89,.24)}
      .timing-back{display:grid;place-items:center;background:linear-gradient(150deg,#fdf8f1,#e8dcfa 52%,#dceff0);border:1px solid rgba(199,158,84,.55)}
      .timing-back::before{content:'☾ ✦ ☽';font-size:25px;letter-spacing:8px;color:#c69c58;text-shadow:0 0 16px rgba(255,211,136,.65)}
      .timing-front{transform:rotateY(180deg);background:#fff;border:1px solid rgba(199,158,84,.55)}
      .timing-front img{width:100%;height:100%;object-fit:cover;display:block}
      .timing-card-label{
        position:absolute;left:9px;right:9px;bottom:10px;padding:8px 8px 7px;border-radius:12px;
        background:rgba(255,252,247,.84);backdrop-filter:blur(8px);
        border:1px solid rgba(202,164,96,.34);text-align:center;color:#46394c
      }
      .timing-card-label b{display:block;font:700 14px 'Noto Serif KR',serif;color:#44364c}
      .timing-card-label span{font:700 8.5px 'Cinzel',serif;letter-spacing:1.1px;color:#9b7a45}
      .timing-result{width:100%;padding:12px 13px;border-radius:15px;background:rgba(255,255,255,.64);border:1px solid rgba(197,158,92,.24);display:none}
      .timing-result.show{display:block}
      .timing-result .group{font:700 9px 'Cinzel',serif;letter-spacing:1.1px;color:#9e7d47}
      .timing-result h4{margin:4px 0 5px;font-size:15px;color:#403346}
      .timing-result p{margin:0;font-size:11px;line-height:1.55;color:#756a79}
      .timing-actions{display:none;gap:6px;flex-wrap:wrap;justify-content:center;width:100%}
      .timing-actions.show{display:flex}
      .timing-actions .mini{color:#6d5679;background:rgba(255,255,255,.66);border-color:rgba(165,130,190,.28)}
      .timing-ai{width:100%;display:none;margin-top:2px;padding:13px;border-radius:14px;background:rgba(255,255,255,.68);border:1px solid rgba(157,126,180,.23);white-space:pre-wrap;font:400 12px 'Noto Serif KR',serif;line-height:1.75;color:#493e50}
      .timing-ai.show{display:block}
      .timing-inline{
        margin:8px auto 12px;padding:10px 11px;border-radius:14px;max-width:360px;
        background:linear-gradient(145deg,rgba(255,246,230,.12),rgba(189,164,248,.09));
        border:1px solid rgba(255,210,125,.28);display:flex;gap:9px;align-items:center;text-align:left
      }
      .timing-inline img{width:45px;height:75px;object-fit:cover;border-radius:7px;border:1px solid rgba(255,210,125,.4)}
      .timing-inline .txt{min-width:0}.timing-inline .txt small{display:block;color:var(--gold);font-size:8.5px;letter-spacing:.7px}
      .timing-inline .txt b{display:block;margin:2px 0;color:#f5efff;font-size:12px}
      .timing-inline .txt span{font-size:9.5px;color:var(--dim);line-height:1.4}
      @media(max-width:390px){.timing-flip{width:160px;height:267px}}
    `;
    document.head.appendChild(style);
  }

  function injectCategory() {
    if (byId('luneaTimingCategory')) return;
    const existing = [...document.querySelectorAll('.category')];
    if (!existing.length) return;

    const cat = document.createElement('div');
    cat.id = 'luneaTimingCategory';
    cat.className = 'category lunea-timing-category';
    cat.innerHTML = `
      <div class="category-header">
        <div class="cat-left"><div class="cat-icon">⏳</div>
          <div class="cat-text"><h3>TIMING ORACLE</h3><p>시기 · 시간대 · 계절 · 지연/불발</p></div>
        </div><div class="toggle">+</div>
      </div>
      <div class="category-content">
        <div class="reading-item" id="timingStandaloneItem">
          <div><h4>WHEN · ONE CARD</h4><p>시기 질문 하나에 타이밍 전용 카드 1장.</p></div><div class="count">1</div>
        </div>
      </div>
    `;
    existing[existing.length-1].insertAdjacentElement('afterend', cat);

    cat.querySelector('.category-header').addEventListener('click', () => {
      document.querySelectorAll('.category').forEach(x => { if (x !== cat) x.classList.remove('active'); });
      cat.classList.toggle('active');
    });
    cat.querySelector('#timingStandaloneItem').addEventListener('click', () => openTimingModal('standalone',''));
  }

  function injectModal() {
    if (byId('timingOverlay')) return;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'timingOverlay';
    ov.setAttribute('aria-hidden','true');
    ov.innerHTML = `
      <div class="modal timing-modal">
        <button class="close" id="timingClose">×</button>
        <div class="sub">LUNEA · TIME SIGNAL</div>
        <h3 class="modal-h">Timing Oracle</h3>
        <div class="field" id="timingQuestionField">
          <label>시기를 묻는 질문</label>
          <textarea id="timingQuestion" placeholder="예: 그 사람에게 연락이 온다면 언제쯤일까?"></textarea>
        </div>
        <p class="timing-help" id="timingHelp">질문에 기간을 직접 적으면 그 범위를 우선해 후보를 좁혀. 기본은 한 질문에 한 장이야.</p>
        <button class="primary full-btn" id="timingDraw">⏳ 시기 카드 한 장 뽑기</button>
        <div class="timing-stage">
          <div class="timing-flip" id="timingFlip">
            <div class="timing-inner" id="timingInner">
              <div class="timing-face timing-back"></div>
              <div class="timing-face timing-front">
                <img id="timingImage" alt="">
                <div class="timing-card-label"><span id="timingLabelEn"></span><b id="timingLabelKo"></b></div>
              </div>
            </div>
          </div>
          <div class="timing-result" id="timingResult"></div>
          <div class="timing-actions" id="timingActions">
            <button class="mini" id="timingRefine">✦ 시기 더 좁히기</button>
            <button class="mini" id="timingAI">🔮 AI 시기 해석</button>
            <button class="mini" id="timingSave">💾 기록</button>
          </div>
          <div class="timing-ai" id="timingAIText"></div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    byId('timingClose').onclick = closeTimingModal;
    ov.addEventListener('pointerup', e => { if (e.target === ov) closeTimingModal(); });
    byId('timingDraw').onclick = () => performTimingDraw(false);
    byId('timingRefine').onclick = performRefineDraw;
    byId('timingAI').onclick = standaloneAIRead;
    byId('timingSave').onclick = saveStandaloneTiming;
    byId('timingFlip').onclick = () => byId('timingInner')?.classList.add('flipped');
  }

  function openTimingModal(mode, question) {
    timingState.mode = mode;
    timingState.question = question || '';
    timingState.primary = null;
    timingState.refine = null;
    timingState.aiText = '';
    timingState.analysis = null;

    byId('timingQuestion').value = timingState.question;
    byId('timingQuestionField').style.display = mode === 'support' ? 'none' : 'block';
    byId('timingHelp').textContent = mode === 'support'
      ? `현재 RWS 질문의 “언제?”를 별도 타이밍 덱 1장으로 보조해. 메인 타로의 사건 가능성을 뒤집지는 않아.`
      : `질문에 기간을 직접 적으면 그 범위를 우선해 후보를 좁혀. 기본은 한 질문에 한 장이야.`;

    resetTimingUI();

    const ov = byId('timingOverlay');
    ov.classList.add('show');
    ov.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  }

  function closeTimingModal() {
    const ov = byId('timingOverlay');
    ov.classList.remove('show');
    ov.setAttribute('aria-hidden','true');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  function resetTimingUI() {
    byId('timingFlip').classList.remove('show');
    byId('timingInner').classList.remove('flipped');
    byId('timingResult').classList.remove('show');
    byId('timingActions').classList.remove('show');
    byId('timingAIText').classList.remove('show');
    byId('timingAIText').textContent = '';
    byId('timingRefine').style.display = '';
  }

  function currentQuestionForModal() {
    if (timingState.mode === 'support') return String(timingState.question || '').trim();
    return String(byId('timingQuestion').value || '').trim();
  }

  function performTimingDraw(skipRepeatWarning) {
    const q = currentQuestionForModal();
    if (!q) return alert('시기를 묻는 질문을 적어줘.');

    if (!skipRepeatWarning) {
      const recent = recentSameQuestion(q);
      if (recent) {
        const ok = confirm(`최근 24시간 안에 같은 시기 질문을 이미 뽑았어.\n기존 결과: ${recent.label}\n\n그래도 새로 뽑을까?`);
        if (!ok) return;
      }
    }

    const {card,analysis} = drawPrimary(q);
    if (!card) return alert('타이밍 후보를 만들지 못했어.');

    timingState.question = q;
    timingState.primary = card;
    timingState.refine = null;
    timingState.aiText = '';
    timingState.analysis = analysis;

    saveHistory({sig:questionSignature(q),at:Date.now(),cardId:card.id,label:card.label_ko});

    renderTimingCard(card, false);
    if (timingState.mode === 'support') renderSupportInline();
  }

  function renderTimingCard(card, isRefine) {
    const flip = byId('timingFlip');
    flip.classList.add('show');
    byId('timingInner').classList.remove('flipped');

    byId('timingImage').src = cardImg(card);
    byId('timingImage').alt = card.label_ko;
    byId('timingLabelKo').textContent = card.label_ko;
    byId('timingLabelEn').textContent = card.label_en;

    const extra = isRefine ? `<br><b style="color:#8a6cab">정밀화 카드</b>` : '';
    byId('timingResult').innerHTML =
      `<div class="group">${groupLabel(card)}</div>` +
      `<h4>${card.label_ko} · ${card.label_en}</h4>` +
      `<p>${card.meaning}${extra}</p>`;
    byId('timingResult').classList.add('show');
    byId('timingActions').classList.add('show');
    byId('timingAIText').classList.remove('show');

    const ref = refineCandidates(timingState.primary, timingState.question);
    byId('timingRefine').style.display = (!isRefine && ref.length) ? '' : 'none';

    setTimeout(() => byId('timingInner').classList.add('flipped'), 120);
  }

  function performRefineDraw() {
    if (!timingState.primary || timingState.refine) return;
    const candidates = refineCandidates(timingState.primary, timingState.question);
    if (!candidates.length) return alert('이 결과는 더 좁히기보다 그대로 읽는 편이 좋아.');

    const card = pick(candidates.filter(c => c.id !== timingState.primary.id));
    if (!card) return;
    timingState.refine = card;
    renderTimingCard(card, true);
    if (timingState.mode === 'support') renderSupportInline();
  }

  function timingSummaryText() {
    if (!timingState.primary) return '';
    let t = `${timingState.primary.label_ko} (${timingState.primary.label_en}) — ${timingState.primary.meaning}`;
    if (timingState.refine) t += ` / 정밀화: ${timingState.refine.label_ko} (${timingState.refine.label_en}) — ${timingState.refine.meaning}`;
    return t;
  }

  function renderSupportInline() {
    const cardsEl = byId('cards');
    if (!cardsEl || !timingState.primary) return;
    let el = byId('luneaTimingInline');
    if (!el) {
      el = document.createElement('div');
      el.id = 'luneaTimingInline';
      el.className = 'timing-inline';
      cardsEl.insertAdjacentElement('afterend', el);
      el.addEventListener('click', () => openTimingModal('support', timingState.question));
    }
    el.innerHTML = `
      <img src="${cardImg(timingState.primary)}" alt="">
      <div class="txt"><small>LUNEA TIME SIGNAL</small>
        <b>${timingState.primary.label_ko}${timingState.refine ? ' · '+timingState.refine.label_ko : ''}</b>
        <span>${timingState.primary.meaning}${timingState.refine ? '<br>정밀화: '+timingState.refine.meaning : ''}</span>
      </div>`;
    const btn = byId('timingSupportBtn');
    if (btn) btn.textContent = `⏳ ${timingState.primary.label_ko}`;
  }

  function clearSupportTiming() {
    timingState.mode = null;
    timingState.question = '';
    timingState.primary = null;
    timingState.refine = null;
    timingState.aiText = '';
    timingState.analysis = null;
    byId('luneaTimingInline')?.remove();
    const btn = byId('timingSupportBtn');
    if (btn) btn.textContent = '⏳ 시기 카드';
  }

  function injectSupportButton() {
    if (byId('timingSupportBtn')) return;
    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (!bar) return;
    const btn = document.createElement('button');
    btn.className = 'mini';
    btn.id = 'timingSupportBtn';
    btn.textContent = '⏳ 시기 카드';
    const save = byId('saveReading');
    if (save) bar.insertBefore(btn, save);
    else bar.appendChild(btn);
    btn.onclick = () => {
      let q = '';
      try { q = state?.question || ''; } catch {}
      openTimingModal('support', q);
    };
  }

  function installStartSpreadReset() {
    try {
      if (typeof startSpread !== 'function' || window.__LUNEA_TIMING_START_WRAPPED__) return;
      window.__LUNEA_TIMING_START_WRAPPED__ = true;
      const original = startSpread;
      startSpread = function(...args) {
        clearSupportTiming();
        return original.apply(this,args);
      };
    } catch (e) { console.warn('[Timing] startSpread wrap skipped', e); }
  }

  function installPromptIntegration() {
    try {
      if (typeof promptString !== 'function' || window.__LUNEA_TIMING_PROMPT_WRAPPED__) return;
      window.__LUNEA_TIMING_PROMPT_WRAPPED__ = true;
      const original = promptString;
      promptString = function() {
        let p = original();
        let q = '';
        try { q = state?.question || ''; } catch {}
        if (!timingState.primary || timingState.mode !== 'support' || timingState.question !== q) return p;

        p += `

[LUNEA TIMING ORACLE — 별도 시기 보조 덱]
- 1차 시기 카드: ${timingState.primary.label_ko} / ${timingState.primary.label_en}
- 의미: ${timingState.primary.meaning}
${timingState.refine ? `- 정밀화 카드: ${timingState.refine.label_ko} / ${timingState.refine.label_en}
- 정밀화 의미: ${timingState.refine.meaning}` : ''}

[타이밍 통합 해석 규칙]
1. Timing Oracle은 RWS와 별도의 시기 전용 덱이다. RWS 카드 이름이나 의미로 취급하지 않는다.
2. 메인 RWS 배열이 사건 발생 가능성 자체를 약하게 보이면, 타이밍 카드가 나왔다고 사건 발생을 확정하지 않는다.
3. 이 경우 해당 시기는 사건 자체보다 생각·감정·간접 신호·조건 변화가 움직이는 구간일 수 있음을 구분한다.
4. 지연/불발 카드라면 억지 날짜를 만들어내지 않는다.
5. 사용자가 질문에 기간을 지정했다면 그 범위를 우선하며, 그 기간 밖이라는 카드가 나오면 기간 내 성립이 약하다고 명확히 말한다.
6. 첫 결론 이후 '⏳ 시기 결론'을 별도 소제목으로 짧고 명확하게 정리한다.
7. 타로를 객관적 사실 확인이나 확정적 미래 예언으로 표현하지 않는다.`;

        return p;
      };
    } catch (e) { console.warn('[Timing] prompt integration skipped', e); }
  }

  async function standaloneAIRead() {
    if (!timingState.primary) return alert('먼저 시기 카드를 뽑아줘.');
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) return alert('LUNEA API 설정을 먼저 해줘.');

    const btn = byId('timingAI');
    btn.disabled = true;
    btn.textContent = '🔮 해석 중…';
    byId('timingAIText').classList.add('show');
    byId('timingAIText').textContent = '시기 신호와 질문 범위를 맞춰보는 중…';

    const prompt = `당신은 타로의 시기 질문을 과장 없이 읽는 숙련된 리더다.

[질문]
"${timingState.question}"

[LUNEA TIMING ORACLE]
1차: ${timingState.primary.label_ko} (${timingState.primary.label_en})
의미: ${timingState.primary.meaning}
${timingState.refine ? `정밀화: ${timingState.refine.label_ko} (${timingState.refine.label_en})
의미: ${timingState.refine.meaning}` : ''}

[규칙]
- 이 카드는 별도의 시기 전용 오라클 결과이며 RWS 카드가 아니다.
- 첫 문장에서 예상 시기를 가장 간단히 말한다.
- 그다음 이 시기를 어떻게 이해해야 하는지 2~4문단으로 설명한다.
- 지연/불발/불명 카드면 날짜를 억지로 만들지 않는다.
- 사건 발생 자체를 객관적 사실처럼 확정하지 않는다.
- 질문에 명시된 기간이 있으면 그 기간을 최우선으로 존중한다.
- 같은 말을 반복하거나 희망고문하지 않는다.`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.72,topP:.92}})
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '응답이 비어 있어.';
      timingState.aiText = text;
      byId('timingAIText').textContent = text;
    } catch (err) {
      byId('timingAIText').textContent = '[API 오류] ' + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = '🔮 AI 시기 해석';
    }
  }

  function timingArchiveObject() {
    if (!timingState.primary) return null;
    return {
      deck:'LUNEA_TIMING_ORACLE_V1',
      primary:{
        id:timingState.primary.id,
        label_ko:timingState.primary.label_ko,
        label_en:timingState.primary.label_en,
        meaning:timingState.primary.meaning,
        filename:timingState.primary.filename
      },
      refine: timingState.refine ? {
        id:timingState.refine.id,
        label_ko:timingState.refine.label_ko,
        label_en:timingState.refine.label_en,
        meaning:timingState.refine.meaning,
        filename:timingState.refine.filename
      } : null
    };
  }

  function installArchiveIntegration() {
    // Existing saveReading remains the source of truth. After it saves, enrich only the newest item.
    try {
      const saveBtn = byId('saveReading');
      if (saveBtn && !window.__LUNEA_TIMING_SAVE_WRAPPED__) {
        window.__LUNEA_TIMING_SAVE_WRAPPED__ = true;
        const old = saveBtn.onclick;
        saveBtn.onclick = function(e) {
          if (old) old.call(this,e);
          let q = '';
          try { q = state?.question || ''; } catch {}
          if (!timingState.primary || timingState.mode !== 'support' || timingState.question !== q) return;
          try {
            const a = getArchive();
            if (a.length) {
              a[0].timing = timingArchiveObject();
              setArchive(a);
            }
          } catch (err) { console.warn('[Timing] archive enrich failed', err); }
        };
      }
    } catch {}

    try {
      if (typeof archiveText === 'function' && !window.__LUNEA_TIMING_ARCHIVE_TEXT_WRAPPED__) {
        window.__LUNEA_TIMING_ARCHIVE_TEXT_WRAPPED__ = true;
        const oldArchiveText = archiveText;
        archiveText = function(item) {
          let t = oldArchiveText(item);
          if (item?.timing?.primary) {
            t += `

[Timing Oracle]
${item.timing.primary.label_ko} (${item.timing.primary.label_en})
${item.timing.primary.meaning}`;
            if (item.timing.refine) {
              t += `
정밀화: ${item.timing.refine.label_ko} (${item.timing.refine.label_en})
${item.timing.refine.meaning}`;
            }
          }
          return t;
        };
      }
    } catch {}
  }

  function saveStandaloneTiming() {
    if (!timingState.primary) return alert('먼저 시기 카드를 뽑아줘.');
    try {
      const a = getArchive();
      const id = (typeof secureId === 'function') ? secureId() : String(Date.now());
      a.unshift({
        id,
        createdAt:Date.now(),
        date:new Date().toLocaleString('ko-KR'),
        title:'TIMING ORACLE · ONE CARD',
        q:timingState.question,
        rationale:'질문 범위를 분석해 적합한 시기 후보군에서 별도 타이밍 덱 1장을 추출',
        cards:[],
        timing:timingArchiveObject(),
        ai:timingState.aiText || ''
      });
      setArchive(a);
      alert('✨ 타이밍 리딩을 기존 기록함에 저장했어.');
    } catch (err) {
      console.error(err);
      alert('기록 저장 중 오류가 났어.');
    }
  }

  function boot() {
    addStyles();
    injectCategory();
    injectModal();
    injectSupportButton();
    installStartSpreadReset();
    installPromptIntegration();
    installArchiveIntegration();
    console.info('✦ LUNEA TIMING ORACLE V1 loaded', {cards:TIMING_CARDS.length});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
