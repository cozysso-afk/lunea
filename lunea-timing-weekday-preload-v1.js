'use strict';

/* LUNEA TIMING ORACLE · WEEKDAY PRELOAD V1 */
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_WEEKDAYS_PRELOAD_V1__) return;
  W.__LUNEA_TIMING_WEEKDAYS_PRELOAD_V1__ = true;

  const RELEASE = '20260922-weekday-v1';
  const WEEKDAY_CARDS = Object.freeze([
    {id:'LT-061',group:'weekday',label_ko:'월요일',label_en:'Monday',meaning:'현재 시점에서 가장 가까운 월요일 전후의 시기 창구',filename:'timing_061_monday.jpg',weight:1.0,visual_motif:'초승달과 새로 떠오르는 작은 별',relative_type:'weekday',weekday:1,refine_group:'weekday'},
    {id:'LT-062',group:'weekday',label_ko:'화요일',label_en:'Tuesday',meaning:'현재 시점에서 가장 가까운 화요일 전후의 시기 창구',filename:'timing_062_tuesday.jpg',weight:1.0,visual_motif:'앞으로 뻗는 밝은 별빛의 궤적',relative_type:'weekday',weekday:2,refine_group:'weekday'},
    {id:'LT-063',group:'weekday',label_ko:'수요일',label_en:'Wednesday',meaning:'현재 시점에서 가장 가까운 수요일 전후의 시기 창구',filename:'timing_063_wednesday.jpg',weight:1.0,visual_motif:'두 빛을 잇는 부드러운 천체의 선',relative_type:'weekday',weekday:3,refine_group:'weekday'},
    {id:'LT-064',group:'weekday',label_ko:'목요일',label_en:'Thursday',meaning:'현재 시점에서 가장 가까운 목요일 전후의 시기 창구',filename:'timing_064_thursday.jpg',weight:1.0,visual_motif:'넓게 퍼지는 광륜을 두른 천체',relative_type:'weekday',weekday:4,refine_group:'weekday'},
    {id:'LT-065',group:'weekday',label_ko:'금요일',label_en:'Friday',meaning:'현재 시점에서 가장 가까운 금요일 전후의 시기 창구',filename:'timing_065_friday.jpg',weight:1.0,visual_motif:'따뜻하게 빛나는 별과 부드러운 광채',relative_type:'weekday',weekday:5,refine_group:'weekday'},
    {id:'LT-066',group:'weekday',label_ko:'토요일',label_en:'Saturday',meaning:'현재 시점에서 가장 가까운 토요일 전후의 시기 창구',filename:'timing_066_saturday.jpg',weight:1.0,visual_motif:'고요한 달과 넓은 휴식의 하늘',relative_type:'weekday',weekday:6,refine_group:'weekday'},
    {id:'LT-067',group:'weekday',label_ko:'일요일',label_en:'Sunday',meaning:'현재 시점에서 가장 가까운 일요일 전후의 시기 창구',filename:'timing_067_sunday.jpg',weight:1.0,visual_motif:'잔잔한 금빛 태양과 넓은 광륜',relative_type:'weekday',weekday:0,refine_group:'weekday'}
  ]);

  function appendWeekdays(cards) {
    const list = Array.isArray(cards) ? cards.slice() : [];
    const ids = new Set(list.map(card => card?.id));
    for (const card of WEEKDAY_CARDS) if (!ids.has(card.id)) list.push({...card});
    return list;
  }

  const nativeFetch = typeof W.fetch === 'function' ? W.fetch.bind(W) : null;
  if (nativeFetch && !W.__LUNEA_TIMING_WEEKDAY_FETCH_PATCHED__) {
    W.__LUNEA_TIMING_WEEKDAY_FETCH_PATCHED__ = true;
    W.fetch = async function(input, init) {
      const response = await nativeFetch(input, init);
      let url = '';
      try { url = String(typeof input === 'string' ? input : input?.url || ''); } catch {}
      if (!/lunea_timing_oracle_v1\.json(?:[?#]|$)/i.test(url) || !response?.ok) return response;
      try {
        const data = await response.clone().json();
        if (!Array.isArray(data?.cards) || data.cards.some(card => card?.id === 'LT-061')) return response;
        const patched = {
          ...data,
          version: String(data.version || '1.0') + '+weekday.1',
          card_count: 67,
          groups: {...(data.groups || {}), weekday: 7},
          cards: appendWeekdays(data.cards)
        };
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.set('content-type','application/json; charset=utf-8');
        return new Response(JSON.stringify(patched), {status:response.status,statusText:response.statusText,headers});
      } catch (error) {
        console.warn('[Timing Weekday V1] JSON manifest patch skipped', error);
        return response;
      }
    };
  }

  function mustReplace(source, before, after, label) {
    if (!source.includes(before)) throw new Error(`Timing weekday patch marker missing: ${label}`);
    return source.replace(before, after);
  }

  function patchTimingSource(source) {
    let src = String(source || '');
    const cardPrefix = '  const TIMING_CARDS = ';
    const start = src.indexOf(cardPrefix);
    const arrayStart = start + cardPrefix.length;
    const endMarker = ';\n  const HISTORY_KEY';
    const arrayEnd = src.indexOf(endMarker, arrayStart);
    if (start < 0 || arrayEnd < 0) throw new Error('Timing card manifest boundary missing');

    const existingCards = JSON.parse(src.slice(arrayStart, arrayEnd));
    const patchedCards = appendWeekdays(existingCards);
    if (patchedCards.length !== 67) throw new Error(`Expected 67 Timing cards, got ${patchedCards.length}`);
    src = src.slice(0, arrayStart) + JSON.stringify(patchedCards) + src.slice(arrayEnd);
    src = src.replace('Separate 60-card timing deck', 'Separate 67-card timing deck');

    src = mustReplace(src,
      "    seasonal: 'SEASONAL · 계절/월 위치',\n    mid_range:",
      "    seasonal: 'SEASONAL · 계절/월 위치',\n    weekday: 'WEEKDAY · 요일',\n    mid_range:",
      'group label');

    const seasonLine = "    const asksSeason = /(어느\\s*계절|계절|초봄|늦봄|초여름|늦여름|초가을|늦가을|초겨울|늦겨울|월초|월중|월말)/.test(s);\n";
    src = mustReplace(src, seasonLine,
      seasonLine + "    const asksWeekday = /(?:(?:무슨|어느|몇)\\s*요일|요일\\s*(?:언제|언제쯤|일까|인가|쯤)|day\\s*of\\s*(?:the\\s*)?week|weekday)/i.test(s);\n",
      'weekday question analysis');

    src = mustReplace(src,
      '    return { text:s, ...range, asksDaypart, asksSeason, nearEvent, longEvent };',
      '    return { text:s, ...range, asksDaypart, asksSeason, asksWeekday, nearEvent, longEvent };',
      'analysis return');

    const seasonBranch = "    if (a.asksSeason) {\n      return { analysis:a, mode:'seasonal', primary:TIMING_CARDS.filter(c => c.group === 'seasonal'), delay };\n    }\n\n";
    src = mustReplace(src, seasonBranch,
      seasonBranch + "    if (a.asksWeekday) {\n      return { analysis:a, mode:'weekday', primary:TIMING_CARDS.filter(c => c.group === 'weekday'), delay };\n    }\n\n",
      'weekday candidate pool');

    const shortRangeBlock = "    if (primary.group === 'short_range') {\n      // One non-contradictory second layer: likely time-of-day within that range.\n      return TIMING_CARDS.filter(c => c.group === 'day_window');\n    }";
    src = mustReplace(src, shortRangeBlock,
      "    if (primary.group === 'short_range') {\n      // One non-contradictory second layer: likely time-of-day or weekday within that range.\n      return TIMING_CARDS.filter(c => c.group === 'day_window' || c.group === 'weekday');\n    }",
      'short-range refine');

    src = mustReplace(src,
      "    if (primary.group === 'day_window') return [];\n\n",
      "    if (primary.group === 'day_window') return [];\n\n    if (primary.group === 'weekday') {\n      return TIMING_CARDS.filter(c => c.group === 'day_window');\n    }\n\n",
      'weekday refine');

    src = mustReplace(src,
      '<div class="cat-text"><h3>TIMING ORACLE</h3><p>시기 · 시간대 · 계절 · 지연/불발</p></div>',
      '<div class="cat-text"><h3>TIMING ORACLE</h3><p>시기 · 요일 · 시간대 · 계절 · 지연/불발</p></div>',
      'category subtitle');

    return src;
  }

  function loadPatchedTimingCore() {
    if (W.__LUNEA_TIMING_ORACLE_V1__) return true;
    const xhr = new XMLHttpRequest();
    const build = encodeURIComponent(RELEASE);
    xhr.open('GET', `./timing-oracle-v1.js?v=${build}`, false);
    try { xhr.send(null); }
    catch (error) { console.error('[Timing Weekday V1] core request failed', error); return false; }
    if (xhr.status && (xhr.status < 200 || xhr.status >= 300)) {
      console.error('[Timing Weekday V1] core request failed', xhr.status);
      return false;
    }
    try {
      const patched = patchTimingSource(xhr.responseText);
      (0, eval)(patched + `\n//# sourceURL=timing-oracle-v1.weekday-patched.js?v=${build}`);
      return !!W.__LUNEA_TIMING_ORACLE_V1__;
    } catch (error) {
      console.error('[Timing Weekday V1] patch failed; original Timing core will load normally', error);
      return false;
    }
  }

  W.LUNEA_TIMING_WEEKDAYS_V1 = Object.freeze({version:1,release:RELEASE,cards:WEEKDAY_CARDS.map(card=>Object.freeze({...card})),appendWeekdays});
  const loaded = loadPatchedTimingCore();
  console.info(`🗓 LUNEA Timing Weekday V1 ${loaded ? 'loaded' : 'deferred to original core'}`, {cards:67});
})();
