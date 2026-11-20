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

  // Cities the engine lacks, with city-hall coordinates (needed for houses/ASC).
  const EXTRA_CITIES = [
    ['나주','전라남도',35.0160,126.7108],['광양','전라남도',34.9407,127.6959],['보성','전라남도',34.7715,127.0800],
    ['정읍','전라북도',35.5699,126.8559],['남원','전라북도',35.4164,127.3904],['김제','전라북도',35.8036,126.8809],
    ['서산','충청남도',36.7848,126.4503],['당진','충청남도',36.8898,126.6459],['공주','충청남도',36.4466,127.1190],
    ['논산','충청남도',36.1872,127.0987],['보령','충청남도',36.3333,126.6128],
    ['김천','경상북도',36.1398,128.1136],['영주','경상북도',36.8057,128.6240],['경산','경상북도',35.8251,128.7414],
    ['양산','경상남도',35.3350,129.0373],['거제','경상남도',34.8806,128.6211],['통영','경상남도',34.8544,128.4331],
    ['사천','경상남도',35.0037,128.0642],['밀양','경상남도',35.5038,128.7464],
    ['동해','강원도',37.5247,129.1143],['삼척','강원도',37.4500,129.1650]
  ].map(([name, region, lat, lon]) => ({name, region, lat, lon, extra:true}));

  // "광주(경기도)" style values pick the region when a name repeats.
  function findCity(C, place){
    const q = String(place || '').trim();
    if (!q) return null;
    const m = /^(.+?)\s*\((.+)\)$/.exec(q);
    const all = [...(C.KOREAN_CITIES || []), ...EXTRA_CITIES];
    if (m) {
      const hit = all.find(c => c.name === m[1].trim() && c.region === m[2].trim());
      if (hit) return hit;
    }
    const exact = all.find(c => c.name === q) || C.WORLD_CITIES?.find?.(c => c.name === q);
    return exact || C.filterCities(q)[0] || null;
  }
  function cityLabel(C, city){
    if (!city) return '';
    return city.extra ? `${city.name} (${city.region})` : C.formatCityName(city);
  }
  // Sync resolver for other modules (engine must be loaded). Falls back to Seoul.
  function resolveCity(place){
    const C = W.LUNEA_ORRERY_CORE;
    if (!C) return null;
    const city = findCity(C, place);
    return city
      ? {lat:city.lat, lon:city.lon, label:cityLabel(C, city), fallback:false}
      : {lat:37.5665, lon:126.978, label:`서울 좌표로 대체 (입력: ${String(place || '').trim() || '없음'})`, fallback:true};
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
  // Representative clock time (KST) inside each 시진 under the Korean
  // 30-minute convention the engine uses for the hour pillar.
  const HOUR_REP = {子:'00:30',丑:'02:30',寅:'04:30',卯:'06:30',辰:'08:30',巳:'10:30',午:'12:30',未:'14:30',申:'16:30',酉:'18:30',戌:'20:30',亥:'22:30'};
  const HOUR_RANGE = {子:'23:30~01:30',丑:'01:30~03:30',寅:'03:30~05:30',卯:'05:30~07:30',辰:'07:30~09:30',巳:'09:30~11:30',午:'11:30~13:30',未:'13:30~15:30',申:'15:30~17:30',酉:'17:30~19:30',戌:'19:30~21:30',亥:'21:30~23:30'};

  async function fourPillars(input){
    const C = await load();
    if (input.hourBranch && HOUR_REP[input.hourBranch]) {
      input = {...input, birthTime: HOUR_REP[input.hourBranch], unknownTime: false, hourOverride: input.hourBranch};
    }
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
      place_resolved: city ? cityLabel(C, city) : '',
      hour_override: input.hourOverride || ''
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

  // ---------- 자미두수 (sync; engine must already be loaded) ----------
  // The 시진 always matches the saju hour pillar: an explicit hourBranch, or
  // the branch the saju engine gives for the clock time (Korean 30-minute
  // convention). The engine's own ziwei default uses whole-hour boundaries,
  // which would put 07:15 in 辰 while saju says 卯; feeding the 시진's
  // representative time keeps both systems on one 시진.
  function ziweiChart(input){
    const C = W.LUNEA_ORRERY_CORE;
    const d = parseDate(input.birthDate);
    if (!C || !d) return null;
    let branch = HOUR_REP[input.hourBranch] ? input.hourBranch : '';
    let t = parseTime(input.birthTime);
    if (!branch) {
      if (!t) return null;
      branch = C.getFourPillars(d.year, d.month, d.day, t.hour, t.minute, 'split')[3][1];
    }
    // Keep a real 23:30-24:00 birth as entered; otherwise use the 시진's middle.
    const useActual = !input.hourBranch && branch === '子' && t && t.hour === 23;
    const [hh, mm] = useActual ? [t.hour, t.minute] : HOUR_REP[branch].split(':').map(Number);
    const g = genderCode(input.gender);
    const chart = C.createChart(d.year, d.month, d.day, hh, mm, g === 'M');
    return {chart, branch, gender:g, overridden: !!HOUR_REP[input.hourBranch]};
  }

  const PALACE_KO = {命宮:'명궁',兄弟:'형제',夫妻:'부처',子女:'자녀',財帛:'재백',疾厄:'질액',遷移:'천이',交友:'교우',官祿:'관록',田宅:'전택',福德:'복덕',父母:'부모'};
  function ziweiLines(input, now = new Date(), opts = {}){
    const C = W.LUNEA_ORRERY_CORE;
    const z = ziweiChart(input);
    if (!C || !z) return [];
    const {chart} = z;
    const lines = [];
    lines.push(`- 기준: 음력 ${chart.lunarYear}년 ${chart.isLeapMonth ? '윤' : ''}${chart.lunarMonth}월 ${chart.lunarDay}일 · ${z.branch}시(${HOUR_RANGE[z.branch]})${z.overridden ? ' · 사용자가 직접 지정한 시진' : ' · 사주 시주와 같은 시진'}`);
    lines.push(`- 명궁 ${chart.mingGongZhi} · 신궁 ${chart.shenGongZhi} · 오행국 ${chart.wuXingJu.name}`);
    const star = s => s.name + (s.siHua ? `(${s.siHua})` : '');
    const order = opts.palaces || Object.keys(chart.palaces);
    for (const name of order) {
      const p = chart.palaces[name];
      if (!p) continue;
      lines.push(`- ${name}(${p.ganZhi}${p.isShenGong ? '·身' : ''}): ${p.stars.length ? p.stars.map(star).join(', ') : '주성 없음'}`);
    }
    const kst = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'}).format(now).split('-').map(Number);
    const ly = C.getLunarYear(kst[0], kst[1], kst[2]);
    const ln = C.calculateLiunian(chart, ly);
    lines.push(`- 유년(${ly} 음력년, 큰 흐름): 유년 명궁 ${ln.mingGongZhi}, 본명 ${ln.natalPalaceAtMing}에 위치 · 유년 사화 ${Object.entries(ln.siHua).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (z.gender) lines.push(`- 현재 대한: ${ln.daxianPalaceName} (${ln.daxianAgeStart}~${ln.daxianAgeEnd}세)`);
    else lines.push('- 대한: 성별 미입력으로 계산하지 않음');
    return lines;
  }

  // ---------- 출생지 선택 목록 ----------
  // Static copy of the engine's Korean city list (so the picker works before
  // the engine loads) plus EXTRA_CITIES, grouped by region.
  const ENGINE_CITY_NAMES = [["서울","서울특별시"],["부산","부산광역시"],["인천","인천광역시"],["대구","대구광역시"],["대전","대전광역시"],["광주","광주광역시"],["울산","울산광역시"],["세종","세종특별자치시"],["수원","경기도"],["고양","경기도"],["용인","경기도"],["성남","경기도"],["부천","경기도"],["안산","경기도"],["안양","경기도"],["남양주","경기도"],["화성","경기도"],["평택","경기도"],["의정부","경기도"],["시흥","경기도"],["파주","경기도"],["김포","경기도"],["광명","경기도"],["이천","경기도"],["군포","경기도"],["하남","경기도"],["오산","경기도"],["양주","경기도"],["구리","경기도"],["안성","경기도"],["포천","경기도"],["의왕","경기도"],["여주","경기도"],["양평","경기도"],["동두천","경기도"],["과천","경기도"],["광주","경기도"],["연천","경기도"],["가평","경기도"],["춘천","강원도"],["원주","강원도"],["강릉","강원도"],["속초","강원도"],["청주","충청북도"],["천안","충청남도"],["충주","충청북도"],["제천","충청북도"],["아산","충청남도"],["전주","전라북도"],["목포","전라남도"],["여수","전라남도"],["순천","전라남도"],["군산","전라북도"],["익산","전라북도"],["포항","경상북도"],["경주","경상북도"],["김해","경상남도"],["창원","경상남도"],["진주","경상남도"],["구미","경상북도"],["안동","경상북도"],["제주","제주특별자치도"],["서귀포","제주특별자치도"]];
  const REGION_ORDER = ['서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시','경기도','강원도','충청북도','충청남도','전라북도','전라남도','경상북도','경상남도','제주특별자치도'];
  function placeOptions(){
    const seen = new Set();
    const rows = [...ENGINE_CITY_NAMES.map(([n, r]) => ({name:n, region:r})), ...EXTRA_CITIES];
    const dupNames = new Set(rows.filter((c, i) => rows.findIndex(x => x.name === c.name) !== i).map(c => c.name));
    const groups = new Map(REGION_ORDER.map(r => [r, []]));
    for (const c of rows) {
      const isMetro = /특별시|광역시|특별자치시/.test(c.region);
      const value = dupNames.has(c.name) && !isMetro ? `${c.name}(${c.region})` : c.name;
      if (seen.has(value)) continue;
      seen.add(value);
      if (!groups.has(c.region)) groups.set(c.region, []);
      groups.get(c.region).push({value, label: isMetro ? c.region : c.name});
    }
    groups.forEach(list => list.sort((a, b) => a.label.localeCompare(b.label, 'ko')));
    return groups;
  }

  function attachPlacePicker(input){
    if (!input || typeof document === 'undefined' || input.dataset.placePicker === '1') return null;
    input.dataset.placePicker = '1';
    if (!document.getElementById('luneaPlacePickerStyle')) {
      const st = document.createElement('style');
      st.id = 'luneaPlacePickerStyle';
      st.textContent = '.lunea-place-picker{width:100%;min-width:0;max-width:100%;box-sizing:border-box}'
        + 'input[data-place-picker="1"][hidden]{display:none!important}'
        + 'input[data-place-picker="1"]:not([hidden]){margin-top:7px}';
      document.head.appendChild(st);
    }
    const sel = document.createElement('select');
    sel.className = 'lunea-place-picker';
    sel.setAttribute('aria-label', '출생지 선택');
    const groups = placeOptions();
    let html = '<option value="">출생지 선택</option>';
    const metro = [];
    groups.forEach((list, region) => {
      if (/특별시|광역시|특별자치시/.test(region)) { metro.push(...list); return; }
      if (list.length) html += `<optgroup label="${region}">` + list.map(o => `<option value="${o.value}">${o.label}</option>`).join('') + '</optgroup>';
    });
    html = '<option value="">출생지 선택</option><optgroup label="특별시·광역시">' + metro.map(o => `<option value="${o.value}">${o.label}</option>`).join('') + '</optgroup>' + html.replace('<option value="">출생지 선택</option>', '');
    html += '<option value="__custom__">기타 · 직접 입력 (해외 포함)</option>';
    sel.innerHTML = html;
    const values = new Set([...sel.options].map(o => o.value).filter(v => v && v !== '__custom__'));
    const sync = () => {
      const v = String(input.value || '').trim();
      if (!v) { sel.value = ''; input.hidden = true; }
      else if (values.has(v)) { sel.value = v; input.hidden = true; }
      else { sel.value = '__custom__'; input.hidden = false; }
    };
    sel.addEventListener('change', () => {
      if (sel.value === '__custom__') {
        input.hidden = false;
        if (values.has(String(input.value || '').trim())) input.value = '';
        input.placeholder = '도시 이름 (목록에 없으면 서울 좌표로 대체)';
        input.focus();
        return;
      }
      input.value = sel.value;
      input.hidden = true;
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
    });
    input.addEventListener('lunea:place-sync', sync);
    input.insertAdjacentElement('beforebegin', sel);
    sync();
    // Values restored later by other modules (profile load) without events.
    setTimeout(sync, 400); setTimeout(sync, 1500);
    return sel;
  }
  W.LUNEA_PLACE_PICKER = {attach:attachPlacePicker, options:placeOptions, sync:input => input?.dispatchEvent(new Event('lunea:place-sync'))};

  W.LUNEA_ORRERY_ENGINE_V1 = {
    version: 1, engineVersion: VERSION, genderKey: GENDER_KEY,
    load, fourPillars, currentDaewoon, daewoonText, userDaewoonLine, ziweiChart, ziweiLines,
    HOUR_REP, HOUR_RANGE, resolveCity, EXTRA_CITIES,
    isLoaded: () => !!W.LUNEA_ORRERY_CORE
  };
})();
