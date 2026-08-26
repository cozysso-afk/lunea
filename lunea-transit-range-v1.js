'use strict';

/*
  LUNEA TRANSIT RANGE V2
  ======================
  Long-range UI + compatibility layer for Transit Scanner.

  - Adds 180 / 270 / 365 day choices and 6개월 / 9개월 / 1년 chips.
  - Detects explicit long ranges from the question.
  - For requests >120 days, automatically splits the scan into <=120-day
    overlapping chunks and merges them client-side.
  - This keeps 1-year scans working even while an older Astro Core deployment
    still enforces the historical 120-day API limit.
  - Normalizes FastAPI validation errors so the UI never shows [object Object].
*/
(() => {
  const W = window;
  if (W.__LUNEA_TRANSIT_RANGE_V2__) return;
  W.__LUNEA_TRANSIT_RANGE_V2__ = true;
  W.__LUNEA_TRANSIT_RANGE_V1__ = true;

  const $ = id => document.getElementById(id);
  const MAX_SERVER_CHUNK_DAYS = 120;
  const CHUNK_OVERLAP_DAYS = 2;
  const DAY_MS = 86400000;
  const LONG = [
    [180, '180일 · 약 6개월', '6개월'],
    [270, '270일 · 약 9개월', '9개월'],
    [365, '365일 · 1년', '1년']
  ];

  function inferLongDays(question) {
    const q = String(question || '').normalize('NFKC').replace(/\s+/g, ' ');
    if (/(?:1\s*년|일\s*년|한\s*해|12\s*(?:개월|달))/.test(q)) return 365;
    if (/(?:9\s*(?:개월|달)|아홉\s*(?:개월|달))/.test(q)) return 270;
    if (/(?:반\s*년|6\s*(?:개월|달)|여섯\s*(?:개월|달))/.test(q)) return 180;
    return 0;
  }

  function ensureLongOptions() {
    const select = $('astroTransitDays');
    if (!select) return false;
    LONG.forEach(([days, label]) => {
      if (select.querySelector(`option[value="${days}"]`)) return;
      const option = document.createElement('option');
      option.value = String(days);
      option.textContent = label;
      select.appendChild(option);
    });
    return true;
  }

  function ensureLongChips() {
    const wrap = document.querySelector('#astroTransitOverlay .astro-range-chips');
    const select = $('astroTransitDays');
    if (!wrap || !select) return false;
    LONG.forEach(([days, , chipLabel]) => {
      if (wrap.querySelector(`[data-lunea-long-days="${days}"]`)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'astro-range-chip';
      button.dataset.luneaLongDays = String(days);
      button.dataset.days = String(days);
      button.textContent = chipLabel;
      button.addEventListener('click', () => {
        select.value = String(days);
        select.dispatchEvent(new Event('change', {bubbles:true}));
      });
      wrap.appendChild(button);
    });
    return true;
  }

  function selectFromQuestion() {
    const select = $('astroTransitDays');
    if (!select) return;
    const days = inferLongDays($('astroTransitQuestion')?.value || '');
    if (!days) return;
    select.value = String(days);
    select.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function updateLongChipState() {
    const select = $('astroTransitDays');
    if (!select) return;
    const current = Number(select.value || 0);
    document.querySelectorAll('[data-lunea-long-days]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.luneaLongDays) === current);
    });
  }

  function errorDetail(data, status, statusText) {
    const detail = data?.detail ?? data?.message ?? data?.error;
    if (Array.isArray(detail)) {
      const text = detail.map(row => {
        if (typeof row === 'string') return row;
        return row?.msg || row?.message || row?.detail || JSON.stringify(row);
      }).filter(Boolean).join(' / ');
      if (text) return text;
    }
    if (detail && typeof detail === 'object') {
      return detail.msg || detail.message || detail.detail || JSON.stringify(detail);
    }
    if (detail) return String(detail);
    return `${status || ''} ${statusText || 'Transit API error'}`.trim();
  }

  function buildChunkPlan(totalDays) {
    const total = Math.max(1, Math.round(Number(totalDays) || 1));
    if (total <= MAX_SERVER_CHUNK_DAYS) return [{startOffset:0, days:total}];

    const out = [];
    let coveredTo = 0;
    while (coveredTo < total) {
      const startOffset = out.length
        ? Math.max(0, coveredTo - CHUNK_OVERLAP_DAYS)
        : 0;
      const endOffset = Math.min(total, startOffset + MAX_SERVER_CHUNK_DAYS);
      out.push({startOffset, days:endOffset - startOffset});
      if (endOffset >= total) break;
      coveredTo = endOffset;
    }
    return out;
  }

  function shiftIso(baseIso, days) {
    const base = new Date(baseIso || Date.now());
    const time = Number.isFinite(base.getTime()) ? base.getTime() : Date.now();
    return new Date(time + Number(days || 0) * DAY_MS).toISOString();
  }

  function uniqBy(rows, keyFn) {
    const seen = new Set();
    const out = [];
    (rows || []).forEach(row => {
      const key = keyFn(row);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(row);
    });
    return out;
  }

  function mergeTransitParts(parts, requestBody, plan) {
    if (!parts.length) throw new Error('장기 트랜짓 결과가 비어 있어.');

    const timeline = uniqBy(
      parts.flatMap(p => p?.timeline || []).sort((a,b) => String(a.time).localeCompare(String(b.time))),
      row => row?.time || ''
    );
    const activationValues = timeline.map(x => Number(x.activation)).filter(Number.isFinite);
    const favorabilityValues = timeline.map(x => Number(x.favorability)).filter(Number.isFinite);
    const maxActivation = activationValues.length ? Math.max(...activationValues) : 0;
    const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0) / arr.length) : 0;

    const peaks = uniqBy(
      parts.flatMap(p => p?.peak_windows || [])
        .sort((a,b) => (Number(b?.peak_activation)||0) - (Number(a?.peak_activation)||0)
          || (Number(b?.peak_favorability)||0) - (Number(a?.peak_favorability)||0)),
      row => row?.peak || `${row?.start || ''}|${row?.end || ''}`
    ).slice(0,5);

    const cautions = uniqBy(
      parts.flatMap(p => p?.caution_windows || [])
        .sort((a,b) => (Number(b?.peak_activation)||0) - (Number(a?.peak_activation)||0)),
      row => row?.peak || `${row?.start || ''}|${row?.end || ''}`
    ).slice(0,4);

    const hits = uniqBy(
      parts.flatMap(p => p?.exact_hits || [])
        .sort((a,b) => (Number(b?.score)||0) - (Number(a?.score)||0)
          || (Number(a?.orb)||999) - (Number(b?.orb)||999)),
      row => `${row?.time || ''}|${row?.transit || ''}|${row?.target || ''}|${row?.aspect || ''}`
    ).slice(0,12);

    const topPoints = uniqBy(
      parts.flatMap(p => p?.top_points || [])
        .sort((a,b) => (Number(b?.activation)||0) - (Number(a?.activation)||0)
          || (Number(b?.favorability)||0) - (Number(a?.favorability)||0)),
      row => row?.time || ''
    ).slice(0,5);

    const first = parts[0];
    const last = parts[parts.length - 1];
    return {
      schema:'LUNEA_TRANSIT_SCAN_V1',
      topic:first.topic,
      topic_label:first.topic_label,
      range:{
        start:first?.range?.start || requestBody.start_iso,
        end:last?.range?.end || shiftIso(requestBody.start_iso, requestBody.days),
        days:Number(requestBody.days),
        timezone:requestBody.timezone || first?.range?.timezone || 'Asia/Seoul',
        sample_step_hours:Math.max(...parts.map(p => Number(p?.range?.sample_step_hours)||0), 24),
        client_chunks:plan.length,
        client_overlap_days:CHUNK_OVERLAP_DAYS
      },
      overall:{
        max_activation:maxActivation,
        average_activation:avg(activationValues),
        average_favorability:favorabilityValues.length ? avg(favorabilityValues) : 50,
        strong_signal:maxActivation >= 45
      },
      peak_windows:peaks,
      caution_windows:cautions,
      exact_hits:hits,
      top_points:topPoints,
      timeline,
      rules:{
        ...(first.rules || {}),
        extended_client_chunking:true,
        note:(first?.rules?.note || 'Transit activation is a timing/activation signal, not a guaranteed event outcome.')
          + ` Long range merged from ${plan.length} server scans.`
      }
    };
  }

  function installFetchCompatibility() {
    if (W.__LUNEA_TRANSIT_CHUNK_FETCH_V2__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_TRANSIT_CHUNK_FETCH_V2__ = true;
    const baseFetch = W.fetch.bind(W);

    W.fetch = async function(input, init) {
      let url = '';
      try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch {}
      if (!/\/v1\/transits\/scan(?:\?|$)/i.test(url)) return baseFetch(input, init);

      let body = null;
      try {
        if (typeof init?.body === 'string') body = JSON.parse(init.body);
      } catch {}
      if (!body || Number(body.days || 0) <= MAX_SERVER_CHUNK_DAYS) {
        return baseFetch(input, init);
      }

      const totalDays = Number(body.days);
      const plan = buildChunkPlan(totalDays);
      const parts = [];
      const status = $('astroTransitStatus');

      for (let i = 0; i < plan.length; i += 1) {
        const chunk = plan[i];
        if (status) status.textContent = `장기 범위 계산 중 · ${i + 1}/${plan.length} 구간 (${totalDays}일 전체)`;
        const chunkBody = {
          ...body,
          start_iso:shiftIso(body.start_iso, chunk.startOffset),
          days:chunk.days
        };
        const res = await baseFetch(input, {
          ...(init || {}),
          body:JSON.stringify(chunkBody)
        });
        let data = null;
        try { data = await res.json(); } catch {}
        if (!res.ok) {
          throw new Error(`트랜짓 ${i + 1}/${plan.length} 구간 실패 · ${errorDetail(data, res.status, res.statusText)}`);
        }
        if (data?.schema !== 'LUNEA_TRANSIT_SCAN_V1') {
          throw new Error(`트랜짓 ${i + 1}/${plan.length} 구간 응답 형식이 예상과 달라.`);
        }
        parts.push(data);
      }

      const merged = mergeTransitParts(parts, body, plan);
      return new Response(JSON.stringify(merged), {
        status:200,
        headers:{'Content-Type':'application/json'}
      });
    };
  }

  function install() {
    if (!ensureLongOptions()) return false;
    ensureLongChips();
    const select = $('astroTransitDays');
    if (select && !select.__luneaLongRangeBound) {
      select.addEventListener('change', () => setTimeout(updateLongChipState, 0));
      select.__luneaLongRangeBound = true;
    }

    const overlay = $('astroTransitOverlay');
    if (overlay && !overlay.__luneaLongRangeObserved) {
      new MutationObserver(() => {
        if (!overlay.classList.contains('show')) return;
        setTimeout(() => {
          ensureLongOptions();
          ensureLongChips();
          selectFromQuestion();
          updateLongChipState();
        }, 0);
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
      overlay.__luneaLongRangeObserved = true;
    }
    updateLongChipState();
    return true;
  }

  function boot() {
    installFetchCompatibility();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 200) clearInterval(timer);
    }, 100);

    const bodyObserver = new MutationObserver(() => {
      if (install()) bodyObserver.disconnect();
    });
    if (document.body) bodyObserver.observe(document.body, {childList:true, subtree:true});
    else document.addEventListener('DOMContentLoaded', () => bodyObserver.observe(document.body, {childList:true, subtree:true}), {once:true});

    install();
    W.LUNEA_TRANSIT_RANGE_V1 = {inferLongDays, buildChunkPlan, mergeTransitParts};
    W.LUNEA_TRANSIT_RANGE_V2 = W.LUNEA_TRANSIT_RANGE_V1;
    console.info('🌌 LUNEA Transit Range V2 loaded · >120d client chunk compatibility ON');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
