'use strict';

/*
  LUNEA ORRERY ENGINE V1
  ======================
  In-browser Four Pillars (and later natal) calculation with @orrery/core 0.6.0
  (MIT), vendored as vendor/orrery-core-0.6.0.js. No server round trip, so no
  Render cold start and no birth data leaving the device.

  - The 590KB engine file is loaded on first use only, never at boot.
  - fourPillars() returns the same shape the Astro Core endpoint
    /v1/profile/four-pillars returns, so existing UI code keeps working, plus
    `daewoon` (대운) when gender and an exact birth time are known.
  - Convention: Korean manseryeok practice (KST wall clock, historical KST
    offsets such as 1987-88 daylight time handled by the engine). No longitude
    true-solar correction, which matches the engine's Asia/Seoul default.
    자시법: split (야자시: 23:00-24:00 keeps the same day pillar).
*/
(() => {
  const W = window;
  if (W.__LUNEA_ORRERY_ENGINE_V1__) return;
  W.__LUNEA_ORRERY_ENGINE_V1__ = true;

  const VERSION = '0.6.0';
  const SRC = './vendor/orrery-core-0.6.0.js?v=orrery-0.6.0';
  const AUTO_KEY = 'LUNEA_SAJU_AUTO_V1';
  const GENDER_KEY = 'LUNEA_BIRTH_GENDER';
  let loading = null;

  function load(timeoutMs = 20000){
    if (W.LUNEA_ORRERY_CORE) return Promise.resolve(W.LUNEA_ORRERY_CORE);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      if (typeof document === 'undefined') return reject(new Error('no document'));
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      const timer = setTimeout(() => { reject(new Error('엔진 로딩 시간 초과')); }, timeoutMs);
      s.onload = () => {
        clearTimeout(timer);
        if (W.LUNEA_ORRERY_CORE) resolve(W.LUNEA_ORRERY_CORE);
        else reject(new Error('엔진 초기화 실패'));
      };
      s.onerror = () => { clearTimeout(timer); reject(new Error('엔진 파일을 불러오지 못했어')); };
      document.head.appendChild(s);
    }).catch(err => { loading = null; throw err; });
    return loading;
  }

  // ---------- helpers ----------
  const STEM_EL = {甲:'목',乙:'목',丙:'화',丁:'화',戊:'토',己:'토',庚:'금',辛:'금',壬:'수',癸:'수'};
  const BRANCH_EL = {子:'수',丑:'토',寅:'목',卯:'목',辰:'토',巳:'화',午:'화',未:'토',申:'금',酉:'금',戌:'토',亥:'수'};
  const STEM_KR = {甲:'갑',乙:'을',丙:'병',丁:'정',戊:'무',己:'기',庚:'경',辛:'신',壬:'임',癸:'계'};
  const BRANCH_KR = {子:'자',丑:'축',寅:'인',卯:'묘',辰:'진',巳:'사',午:'오',未:'미',申:'신',酉:'유',戌:'술',亥:'해'};

  function parseDate(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? {year:+m[1], month:+m[2], day:+m[3]} : null;
  }
  function parseTime(s){
    const m = /^(\d{2}):(\d{2})/.exec(s || '');
    return m ? {hour:+m[1], minute:+m[2]} : null;
  }
  function genderCode(g){
    const v = String(g || '').trim();
    if (/^(M|남|남성|male)$/i.test(v)) return 'M';
    if (/^(F|여|여성|female)$/i.test(v)) return 'F';
    return '';
  }

  function findCity(C, place){
    const q = String(place || '').trim();
    if (!q) return null;
    const exact = C.KOREAN_CITIES.find(c => c.name === q) || C.WORLD_CITIES?.find?.(c => c.name === q);
    return exact || C.filterCities(q)[0] || null;
  }

  function pillarShape(detail){
    const g = detail?.pillar?.ganzi || '';
    if (!g || g.includes('?')) return null;
    const [stem, branch] = [...g];
    return {
      stem, branch,
      stem_hangul: STEM_KR[stem] || '', branch_hangul: BRANCH_KR[branch] || '',
      hanja: g,
      display: g,
      ten_god_stem: detail.stemSipsin === '本元' ? '일간' : detail.stemSipsin,
      ten_god_branch: detail.branchSipsin,
      twelve_stage: detail.unseong
    };
  }

  function visibleElements(pillars){
    const out = {목:0,화:0,토:0,금:0,수:0};
    Object.values(pillars).forEach(p => {
      if (!p) return;
      if (STEM_EL[p.stem]) out[STEM_EL[p.stem]] += 1;
      if (BRANCH_EL[p.branch]) out[BRANCH_EL[p.branch]] += 1;
    });
    return out;
  }

  function daewoonList(result){
    return (result.daewoon || []).map(d => ({
      age: d.age,
      ganzi: d.ganzi,
      start: d.startDate instanceof Date ? d.startDate.toISOString().slice(0,10) : String(d.startDate || '').slice(0,10),
      stem_ten_god: d.stemSipsin,
      branch_ten_god: d.branchSipsin,
      twelve_stage: d.unseong
    }));
  }

  /*
    input: {birthDate:'YYYY-MM-DD', birthTime:'HH:MM'|'' , birthPlace, gender, unknownTime}
    Unknown time: pillars come from the day's 00:35 and 23:55 and are kept only
    when both agree (solar-term and day-boundary edges are left unconfirmed);
    the hour pillar and 대운 are omitted.
  */
  async function fourPillars(input){
    const C = await load();
    const d = parseDate(input.birthDate);
    if (!d) throw new Error('생년월일 형식이 올바르지 않아.');
    const city = findCity(C, input.birthPlace);
    const gender = genderCode(input.gender);
    const base = {...d, gender: gender || 'F', latitude: city?.lat, longitude: city?.lon, jasiMethod: 'split'};
    const unknown = !!input.unknownTime || !parseTime(input.birthTime);
    const provenance = {
      library: '@orrery/core (기기 내 계산)',
      library_version: VERSION,
      timezone: 'Asia/Seoul',
      true_solar_time_correction: false,
      convention: '한국 만세력 관례 · KST 시계 기준(역사적 서머타임 반영) · 야자시(split)',
      place_resolved: city ? C.formatCityName(city) : ''
    };

    if (!unknown) {
      const t = parseTime(input.birthTime);
      const r = C.calculateSaju({...base, ...t});
      const [h, dd, m, y] = r.pillars;
      const pillars = {year:pillarShape(y), month:pillarShape(m), day:pillarShape(dd), hour:pillarShape(h)};
      return {
        mode: 'exact',
        pillars,
        visible_elements: visibleElements(pillars),
        day_master: {stem: pillars.day?.stem || ''},
        daewoon: gender ? daewoonList(r) : [],
        daewoon_needs_gender: !gender,
        provenance
      };
    }

    const a = C.calculateSaju({...base, hour:0, minute:35});
    const b = C.calculateSaju({...base, hour:23, minute:55});
    const pillars = {hour:null};
    const unstable = [];
    [['day',1],['month',2],['year',3]].forEach(([key, i]) => {
      const pa = pillarShape(a.pillars[i]), pb = pillarShape(b.pillars[i]);
      if (pa && pb && pa.hanja === pb.hanja) pillars[key] = pa;
      else { pillars[key] = null; unstable.push(key); }
    });
    return {
      mode: 'range',
      pillars,
      unstable,
      visible_elements: visibleElements(pillars),
      day_master: {stem: pillars.day?.stem || ''},
      daewoon: [],
      provenance
    };
  }

  // ---------- prompt helpers (sync, from saved results) ----------
  function currentDaewoon(list, today = new Date()){
    const iso = today.toISOString().slice(0,10);
    let cur = null;
    for (const item of list || []) if (item.start && item.start <= iso) cur = item;
    return cur;
  }

  function daewoonText(list, today){
    const cur = currentDaewoon(list, today);
    if (!cur) return '';
    const next = (list || []).find(x => x.start > cur.start);
    return `${cur.ganzi} (${cur.age}세~, 천간 ${cur.stem_ten_god}/지지 ${cur.branch_ten_god}${cur.twelve_stage ? ', 12운성 '+cur.twelve_stage : ''})`
      + (next ? ` · 다음 대운 ${next.ganzi} ${next.start.slice(0,4)}년` : '');
  }

  // User's saved auto-calc record, only when it still matches the profile birth data.
  function userDaewoonLine(){
    let rec = null;
    try { rec = JSON.parse(localStorage.getItem(AUTO_KEY) || 'null'); } catch {}
    if (!rec?.data?.daewoon?.length) return '';
    const g = id => (typeof document !== 'undefined' && document.getElementById(id)?.value) || '';
    const birthDate = g('birthDate') || localStorage.getItem('LUNEA_BIRTH_DATE') || '';
    if (birthDate && rec.birthDate && rec.birthDate !== birthDate) return '';
    return daewoonText(rec.data.daewoon);
  }

  W.LUNEA_ORRERY_ENGINE_V1 = {
    version: 1, engineVersion: VERSION, genderKey: GENDER_KEY,
    load, fourPillars, currentDaewoon, daewoonText, userDaewoonLine,
    isLoaded: () => !!W.LUNEA_ORRERY_CORE
  };
})();
