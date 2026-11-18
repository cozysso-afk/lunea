'use strict';

/*
  LUNEA ORRERY TIMING V1
  ======================
  Built on lunea-orrery-engine-v1.js (@orrery/core 0.6.0, in the browser).

  Adds to readings, from the engine, without the Astro Core server:
  1. Saju timing: today's 세운 / 월운 / 일진 with ten gods, and their
     합·충·형·파·해·원진·귀문 relations to the natal pillars (user and partner).
  2. Western natal (user): planets, angles, Placidus and Whole Sign houses,
     tight natal aspects. Used for the profile view and the prompt when no
     Astro Core natal is saved. The Astro Core natal (LUNEA_ASTRO_NATAL_V3) is
     never overwritten: Thai, transit and return features post it to the server.
  3. Today's transit snapshot: transit planets to natal planets within 3°.
  4. Partner with unknown birth time: signs, retrograde state and aspects kept
     only when they hold at every sample across the birth day (30-minute steps).
  5. Synastry: aspects between the user's natal planets and the partner's
     planets, kept only when they stay within orb at every partner sample.

  Everything here is a snapshot at the stated time. Prompt policy keeps it to
  short background and forbids stretching it to whole days or future periods.

  The engine loads once, shortly after page load, only when birth data exists.
  Prompt builders read cached results synchronously.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ORRERY_TIMING_V1__) return;
  W.__LUNEA_ORRERY_TIMING_V1__ = true;

  const NATAL_ENGINE_KEY = 'LUNEA_NATAL_ENGINE_V1';
  const SAJU_AUTO_KEY = 'LUNEA_SAJU_AUTO_V1';
  const SERVER_NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const TRANSIT_ORB = 3;
  const SYN_ORB = 3;

  const ASPECTS = [
    ['conjunction', 0, '합'], ['sextile', 60, '육각'], ['square', 90, '사각'],
    ['trine', 120, '삼각'], ['opposition', 180, '충']
  ];
  const MAIN = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const PK = {Sun:'태양',Moon:'달',Mercury:'수성',Venus:'금성',Mars:'화성',Jupiter:'목성',Saturn:'토성',Uranus:'천왕성',Neptune:'해왕성',Pluto:'명왕성',Chiron:'카이론',NorthNode:'북교점'};
  const SIGN_KO = {Aries:'양자리',Taurus:'황소자리',Gemini:'쌍둥이자리',Cancer:'게자리',Leo:'사자자리',Virgo:'처녀자리',Libra:'천칭자리',Scorpio:'전갈자리',Sagittarius:'사수자리',Capricorn:'염소자리',Aquarius:'물병자리',Pisces:'물고기자리'};
  const SIGNS = Object.keys(SIGN_KO);
  const PILLAR_KO = {year:'년주',month:'월주',day:'일주',hour:'시주'};

  const safeJSON = (k, fb=null) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? fb; } catch { return fb; } };
  const engine = () => W.LUNEA_ORRERY_ENGINE_V1;
  const core = () => W.LUNEA_ORRERY_CORE || null;
  const r1 = n => Math.round(n * 10) / 10;

  function sepDeg(a, b){
    const d = Math.abs(((a - b) % 360 + 360) % 360);
    return d > 180 ? 360 - d : d;
  }
  function aspectOf(a, b, maxOrb){
    const s = sepDeg(a, b);
    for (const [type, angle, ko] of ASPECTS) {
      const orb = Math.abs(s - angle);
      if (orb <= maxOrb) return {type, ko, orb};
    }
    return null;
  }
  function ymdhm(date){
    // Wall-clock parts in Asia/Seoul for any device timezone.
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
    }).formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return {year:+parts.year, month:+parts.month, day:+parts.day, hour:+parts.hour, minute:+parts.minute};
  }
  const stamp = t => `${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')} ${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}`;

  // ---------- birth data ----------
  function userBirth(){
    const rec = safeJSON(SAJU_AUTO_KEY);
    const g = id => (typeof document !== 'undefined' && document.getElementById(id)?.value) || '';
    const birthDate = g('birthDate') || rec?.birthDate || localStorage.getItem('LUNEA_BIRTH_DATE') || '';
    const birthTime = g('birthTime') || rec?.birthTime || localStorage.getItem('LUNEA_BIRTH_TIME') || '';
    const birthPlace = (g('birthPlace') || rec?.birthPlace || localStorage.getItem('LUNEA_BIRTH_PLACE') || '').trim();
    return {birthDate, birthTime, birthPlace};
  }
  const birthReady = b => /^\d{4}-\d{2}-\d{2}$/.test(b.birthDate || '') && /^\d{2}:\d{2}/.test(b.birthTime || '') && (b.birthPlace || '').length >= 2;
  const sameBirth = (a, b) => !!a && !!b && a.birthDate === b.birthDate && a.birthTime === b.birthTime && (a.birthPlace || '') === (b.birthPlace || '');

  function userPillars(){
    const rec = safeJSON(SAJU_AUTO_KEY);
    const p = rec?.data?.pillars;
    if (!p?.day?.hanja) return null;
    return {year:p.year?.hanja, month:p.month?.hanja, day:p.day.hanja, hour:p.hour?.hanja || null};
  }

  // ---------- 1. saju timing ----------
  function tenGod(C, dayStem, stem){ return C.getRelation(dayStem, stem)?.hanja || ''; }
  const EL_KO = {tree:'목', wood:'목', fire:'화', earth:'토', metal:'금', water:'수'};
  const detailKo = d => d ? `(${EL_KO[d] || d})` : '';
  function relText(rel){
    const s = (rel.stem || []).map(r => `천간 ${r.type}${detailKo(r.detail)}`);
    const b = (rel.branch || []).map(r => `지지 ${r.type}${detailKo(r.detail)}`);
    return [...s, ...b].join(', ');
  }

  // natal: {year,month,day,hour} hanja (hour may be null). Returns lines or [].
  function sajuTimingLines(natal, now = new Date()){
    const C = core();
    if (!C || !natal?.day) return [];
    const t = ymdhm(now);
    const [yP, mP, dP] = C.getFourPillars(t.year, t.month, t.day, t.hour, t.minute, 'split');
    const ds = natal.day[0];
    const label = (name, g) => `${g}(천간 ${tenGod(C, ds, g[0])} · 지지 정기 ${tenGod(C, ds, C.getJeonggi(g[1]))})`;
    const lines = [`- 오늘 운(엔진 계산, ${stamp(t)} 한국시간 스냅샷): 세운 ${label('세운', yP)} / 월운 ${label('월운', mP)} / 일진 ${label('일진', dP)}`];
    const rels = [];
    for (const [name, g] of [['일진', dP], ['월운', mP], ['세운', yP]]) {
      for (const key of ['day','month','year','hour']) {
        const n = natal[key];
        if (!n) continue;
        const text = relText(C.analyzePillarRelations(g, n));
        if (text) rels.push(`${name}↔${PILLAR_KO[key]} ${n}: ${text}`);
      }
    }
    if (rels.length) lines.push(`- 오늘 운과 원국의 관계(엔진 계산): ${rels.slice(0, 8).join(' / ')}`);
    return lines;
  }

  // ---------- 2. natal (engine) ----------
  async function computeNatal(b){
    const C = await engine().load();
    const city = engine().resolveCity(b.birthPlace);
    const [y, m, d] = b.birthDate.split('-').map(Number);
    const [hh, mm] = b.birthTime.split(':').map(Number);
    const chart = await C.calculateNatal({year:y, month:m, day:d, hour:hh, minute:mm, gender:'F', latitude:city.lat, longitude:city.lon}, 'P');
    const ascSign = chart.angles?.asc?.sign;
    const ascIdx = SIGNS.indexOf(ascSign);
    const planets = {};
    for (const p of chart.planets) {
      if (!PK[p.id]) continue;
      planets[p.id] = {
        sign:p.sign, degree:r1(p.degreeInSign), longitude:p.longitude, retrograde:!!p.isRetrograde,
        placidus_house:p.house || null,
        whole_house: ascIdx >= 0 ? ((SIGNS.indexOf(p.sign) - ascIdx + 12) % 12) + 1 : null
      };
    }
    const angle = a => a ? {sign:a.sign, degree:r1(a.degreeInSign), longitude:a.longitude} : null;
    const aspects = (chart.aspects || [])
      .filter(a => MAIN.includes(a.planet1) && MAIN.includes(a.planet2) && a.orb <= 5)
      .slice(0, 10)
      .map(a => ({a:a.planet1, b:a.planet2, type:a.type, orb:a.orb}));
    return {
      schema:'LUNEA_NATAL_ENGINE_V1',
      birth:{date:b.birthDate, time:b.birthTime, place_input:b.birthPlace, place_resolved:city.label, latitude:city.lat, longitude:city.lon},
      planets,
      angles:{ASC:angle(chart.angles?.asc), MC:angle(chart.angles?.mc)},
      aspects,
      meta:{engine:'@orrery/core 0.6.0 (기기 내 계산)', house_system:chart.houseSystem || 'P', zodiac:'Tropical'}
    };
  }

  async function ensureUserNatal(){
    const b = userBirth();
    if (!birthReady(b) || !engine()) return null;
    const saved = safeJSON(NATAL_ENGINE_KEY);
    if (saved?.chart && sameBirth(saved, b)) { syncSunSign(saved.chart); return saved.chart; }
    const chart = await computeNatal(b);
    try { localStorage.setItem(NATAL_ENGINE_KEY, JSON.stringify({...b, chart, savedAt:new Date().toISOString()})); } catch {}
    syncSunSign(chart);
    return chart;
  }

  // The legacy birthDate handler picks the sun sign from a fixed date table
  // (3/21 → Aries), which is wrong on cusp days. Once the engine natal exists,
  // the computed Sun decides: the #zodiac select and the saved profile follow it.
  function syncSunSign(chart){
    const sign = chart?.planets?.Sun?.sign;
    if (!sign) return false;
    let changed = false;
    const sel = typeof document !== 'undefined' ? document.getElementById('zodiac') : null;
    if (sel) {
      const opt = [...sel.options].find(o => String(o.value || o.textContent).startsWith(sign));
      if (opt && sel.value !== opt.value) { sel.value = opt.value; changed = true; }
    }
    const prof = safeJSON('LUNEA_USER_PROFILE');
    if (prof && typeof prof === 'object' && prof.zodiac && !String(prof.zodiac).startsWith(sign)) {
      const label = sel ? [...sel.options].find(o => String(o.value || o.textContent).startsWith(sign))?.value : '';
      if (label) {
        prof.zodiac = label;
        try { localStorage.setItem('LUNEA_USER_PROFILE', JSON.stringify(prof)); } catch {}
        // index.html keeps `profile` as a top-level let (shared global lexical scope).
        try { if (typeof profile === 'object' && profile) profile.zodiac = label; } catch {}
        try { if (typeof W.syncProfile === 'function') W.syncProfile(); } catch {}
        changed = true;
      }
    }
    return changed;
  }

  function engineNatal(){
    const saved = safeJSON(NATAL_ENGINE_KEY);
    return saved?.chart && sameBirth(saved, userBirth()) ? saved.chart : null;
  }

  // ---------- 3. transit snapshot ----------
  let transitCache = null; // {key, at, items}
  async function refreshTransits(now = new Date()){
    const natal = engineNatal();
    if (!natal) return null;
    const C = await engine().load();
    const t = ymdhm(now);
    const tr = await C.calculateNatal({year:t.year, month:t.month, day:t.day, hour:t.hour, minute:t.minute, gender:'F', latitude:37.5665, longitude:126.978}, 'P');
    const items = [];
    for (const tp of tr.planets) {
      if (!MAIN.includes(tp.id)) continue;
      for (const id of MAIN) {
        const np = natal.planets[id];
        if (!np) continue;
        const a = aspectOf(tp.longitude, np.longitude, TRANSIT_ORB);
        if (a) items.push({t:tp.id, n:id, ko:a.ko, orb:a.orb});
      }
    }
    items.sort((x, y) => x.orb - y.orb);
    transitCache = {key:`${natal.birth.date}|${natal.birth.time}`, at:stamp(t), atMs:now.getTime(), items:items.slice(0, 10)};
    return transitCache;
  }

  // ---------- 4. partner range check + 5. synastry ----------
  const partnerCache = new Map(); // key -> {lines}
  function partnerKey(p, natal){
    return [p.id, p.birthDate, p.birthTime, p.timeUnknown ? 1 : 0, p.birthPlace, natal ? `${natal.birth.date}|${natal.birth.time}` : '-'].join('|');
  }

  async function computePartnerWestern(p){
    const C = await engine().load();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate || '')) return null;
    const city = engine().resolveCity(p.birthPlace);
    const [y, m, d] = p.birthDate.split('-').map(Number);
    const unknown = !!p.timeUnknown || !/^\d{2}:\d{2}/.test(p.birthTime || '');
    const times = unknown
      ? Array.from({length:48}, (_, i) => [Math.floor(i / 2), (i % 2) * 30]).concat([[23, 59]])
      : [p.birthTime.split(':').map(Number)];
    const samples = [];
    for (const [hh, mm] of times) {
      const ch = await C.calculateNatal({year:y, month:m, day:d, hour:hh, minute:mm, gender:'M', latitude:city.lat, longitude:city.lon}, 'P');
      samples.push(Object.fromEntries(ch.planets.filter(x => PK[x.id]).map(x => [x.id, x])));
    }
    const stable = [];
    for (const id of [...MAIN, 'Chiron', 'NorthNode']) {
      const first = samples[0][id];
      if (!first) continue;
      if (samples.every(s => s[id]?.sign === first.sign)) {
        const retro = samples.every(s => !!s[id]?.isRetrograde === !!first.isRetrograde);
        stable.push(`${PK[id]} ${SIGN_KO[first.sign]}${retro && first.isRetrograde ? '(역행)' : ''}${unknown ? '' : ' '+r1(first.degreeInSign)+'°'}`);
      }
    }
    // aspects within the partner chart that hold at every sample
    const inner = [];
    for (let i = 0; i < MAIN.length; i++) for (let j = i + 1; j < MAIN.length; j++) {
      const A = MAIN[i], B = MAIN[j];
      let type = null, lo = 99, hi = -1, ok = true;
      for (const s of samples) {
        const a = s[A] && s[B] ? aspectOf(s[A].longitude, s[B].longitude, 3) : null;
        if (!a || (type && a.ko !== type)) { ok = false; break; }
        type = a.ko; lo = Math.min(lo, a.orb); hi = Math.max(hi, a.orb);
      }
      if (ok && type) inner.push({txt:`${PK[A]} ${type} ${PK[B]}`, lo, hi});
    }
    inner.sort((x, y) => x.hi - y.hi);
    // synastry with the user's natal
    const natal = engineNatal();
    const syn = [];
    if (natal) {
      for (const U of MAIN) {
        const up = natal.planets[U];
        if (!up) continue;
        for (const P of MAIN) {
          let type = null, lo = 99, hi = -1, ok = true;
          for (const s of samples) {
            const a = s[P] ? aspectOf(up.longitude, s[P].longitude, SYN_ORB) : null;
            if (!a || (type && a.ko !== type)) { ok = false; break; }
            type = a.ko; lo = Math.min(lo, a.orb); hi = Math.max(hi, a.orb);
          }
          if (ok && type) syn.push({txt:`내 ${PK[U]} ${type} 상대 ${PK[P]}`, lo, hi});
        }
      }
      syn.sort((x, y) => x.hi - y.hi);
    }
    const range = x => unknown ? `오차 ${r1(x.lo)}~${r1(x.hi)}°` : `오차 ${r1(x.lo)}°`;
    const lines = [];
    if (stable.length) lines.push(`- 서양 출생 배치(엔진 계산${unknown ? ', 출생일 하루 전체 30분 간격 검증에서 유지된 항목만' : ''}): ${stable.join(' / ')}`);
    if (inner.length) lines.push(`- 상대 출생 각(유지된 것만): ${inner.slice(0, 6).map(x => `${x.txt} (${range(x)})`).join(' / ')}`);
    if (natal) lines.push(syn.length
      ? `- 두 사람 궁합 각(엔진 계산, 3° 이내${unknown ? '·상대 출생일 전체에서 유지' : ''}): ${syn.slice(0, 8).map(x => `${x.txt} (${range(x)})`).join(' / ')}`
      : `- 두 사람 궁합 각: 3° 이내로 ${unknown ? '하루 전체에서 유지되는' : ''} 각 없음`);
    if (unknown) lines.push('- 출생시간 미상: ASC·MC·하우스·달의 정확한 도수는 계산하지 않았다.');
    return lines;
  }

  async function warmPartner(){
    const P = W.LUNEA_PARTNER_PROFILE_V1;
    const p = P?.active?.();
    if (!p || !engine()) return;
    const key = partnerKey(p, engineNatal());
    if (partnerCache.has(key)) return;
    try {
      const lines = await computePartnerWestern(p);
      partnerCache.set(key, {lines:lines || []});
    } catch (err) { console.warn('LUNEA timing: partner western failed', err); }
  }

  function partnerPillars(p){
    const pl = p?.saju?.pillars;
    if (!pl?.day?.display) return null;
    return {year:pl.year?.display || null, month:pl.month?.display || null, day:pl.day.display, hour:pl.hour?.display || null};
  }

  // ---------- prompt providers (sync) ----------
  function userSajuLines(){
    const rec = safeJSON(SAJU_AUTO_KEY);
    const lines = [];
    const pv = rec?.data?.provenance;
    if (pv && /orrery/.test(pv.library || '')) {
      lines.push(`- 계산 기준(엔진): ${pv.convention || '한국 만세력 관례'} · 경도 진태양시 보정 없음${pv.hour_override ? ` · 시진 직접 지정 ${pv.hour_override}시(사용자 생시 보정)` : ' · 시주는 출생시각 그대로'}`);
    }
    return [...lines, ...sajuTimingLines(userPillars())];
  }

  function userZiweiLines(now = new Date()){
    const E = engine();
    const rec = safeJSON(SAJU_AUTO_KEY);
    if (!E?.ziweiLines || !core() || !rec?.birthDate) return [];
    const b = userBirth();
    if (b.birthDate !== rec.birthDate) return [];
    return E.ziweiLines({birthDate:rec.birthDate, birthTime:rec.birthTime, gender:rec.gender, hourBranch:rec.hourBranch}, now);
  }

  // Partner: only with an exact birth time (the chart depends on the 시진).
  function partnerZiweiLines(p, now = new Date()){
    const E = engine();
    if (!E?.ziweiLines || !core() || p?.timeUnknown || !/^\d{2}:\d{2}/.test(p?.birthTime || '')) return [];
    const g = /남|^M$/i.test(p.gender || '') ? 'M' : (/여|^F$/i.test(p.gender || '') ? 'F' : '');
    const lines = E.ziweiLines({birthDate:p.birthDate, birthTime:p.birthTime, gender:g}, now, {palaces:['命宮','夫妻','福德','遷移']});
    return lines.map(l => l.replace(/^- /, '- 자미두수 '));
  }

  function userWesternLines(){
    const out = {natal:'', extra:[]};
    const natal = engineNatal();
    if (!natal) return out;
    const fmt = v => [v.sign, `${v.degree}°`, v.whole_house ? `WS ${v.whole_house}H` : '', v.placidus_house ? `Placidus ${v.placidus_house}H` : '', v.retrograde ? '역행' : ''].filter(Boolean).join(' · ');
    const hasServer = !!safeJSON(SERVER_NATAL_KEY);
    if (!hasServer) {
      const keys = [['Sun','태양'],['Moon','달'],['ASC','상승점'],['MC','중천점'],['Mercury','수성'],['Venus','금성'],['Mars','화성'],['Jupiter','목성'],['Saturn','토성']];
      out.natal = keys.map(([k, ko]) => {
        const v = natal.planets[k] || natal.angles[k];
        return v ? `- ${k}(${ko}): ${fmt(v)}` : '';
      }).filter(Boolean).join('\n') + `\n- Natal 출처: ${natal.meta.engine} · ${natal.birth.place_resolved} · Placidus/Whole Sign`;
    }
    if (natal.aspects?.length) out.extra.push(`- 주요 출생 각(엔진 계산, 오차 5° 이내): ${natal.aspects.slice(0, 8).map(a => `${PK[a.a]} ${ASPECTS.find(x => x[0] === a.type)?.[2] || a.type} ${PK[a.b]} (${a.orb}°)`).join(' / ')}`);
    const tc = transitCache;
    if (tc && tc.key === `${natal.birth.date}|${natal.birth.time}` && Date.now() - tc.atMs < 6 * 3600e3) {
      out.extra.push(tc.items.length
        ? `- 오늘 트랜짓 스냅샷(엔진 계산, ${tc.at} 한국시간, 3° 이내): ${tc.items.slice(0, 8).map(x => `운행 ${PK[x.t]} ${x.ko} 출생 ${PK[x.n]} (${r1(x.orb)}°)`).join(' / ')}`
        : `- 오늘 트랜짓 스냅샷(엔진 계산, ${tc.at} 한국시간): 3° 이내 주요 각 없음`);
    }
    // keep the next prompt fresh without blocking this one
    if (!tc || Date.now() - tc.atMs > 3600e3) refreshTransits().catch(() => {});
    return out;
  }

  function partnerLines(p){
    const lines = [];
    const pp = partnerPillars(p);
    if (pp) lines.push(...sajuTimingLines(pp));
    lines.push(...partnerZiweiLines(p));
    const cached = partnerCache.get(partnerKey(p, engineNatal()));
    if (cached) lines.push(...cached.lines);
    else warmPartner().catch(() => {});
    return lines;
  }

  // ---------- warmup ----------
  async function warmup(){
    const b = userBirth();
    const hasPartner = !!W.LUNEA_PARTNER_PROFILE_V1?.active?.();
    if (!birthReady(b) && !hasPartner) return;
    if (!engine()) return;
    try {
      await engine().load();
      if (birthReady(b)) { await ensureUserNatal(); await refreshTransits(); }
      await warmPartner();
    } catch (err) { console.warn('LUNEA timing warmup skipped', err); }
  }

  W.LUNEA_ORRERY_TIMING_V1 = {
    version:1, natalKey:NATAL_ENGINE_KEY,
    sajuTimingLines, userSajuLines, userWesternLines, userZiweiLines, partnerZiweiLines, partnerLines,
    ensureUserNatal, engineNatal, syncSunSign, refreshTransits, computeNatal, computePartnerWestern, warmPartner, warmup,
    _aspectOf:aspectOf
  };

  if (typeof document === 'undefined' || typeof W.addEventListener !== 'function') return;
  const later = () => setTimeout(() => { warmup(); }, 3500);
  if (document.readyState === 'complete') later();
  else W.addEventListener('load', later, {once:true});
})();
