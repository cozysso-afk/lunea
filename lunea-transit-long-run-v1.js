'use strict';

/*
  LUNEA TRANSIT LONG RUN V1
  =========================
  Safe compatibility layer for Transit Scanner ranges > 120 days.

  Design:
  - Does NOT permanently replace window.fetch.
  - Waits until the existing Transit button has been fully installed/wrapped.
  - For <=120 days, delegates untouched to the original handler.
  - For >120 days, temporarily intercepts only the one Transit POST initiated
    by the existing handler, splits it into <=120-day requests, merges the
    results, returns a normal Response to the existing renderer, then restores
    window.fetch immediately.
  - Preserves Lag Guard / Astro Stability because chunk requests call the
    already-installed fetch chain.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TRANSIT_LONG_RUN_V1__) return;
  W.__LUNEA_TRANSIT_LONG_RUN_V1__ = true;

  const $ = id => document.getElementById(id);
  const MAX_CHUNK = 120;
  const OVERLAP = 2;
  const DAY_MS = 86400000;

  function errorText(data, status, statusText) {
    const detail = data?.detail ?? data?.message ?? data?.error;
    if (Array.isArray(detail)) {
      const t = detail.map(x => {
        if (typeof x === 'string') return x;
        return x?.msg || x?.message || x?.detail || JSON.stringify(x);
      }).filter(Boolean).join(' / ');
      if (t) return t;
    }
    if (detail && typeof detail === 'object') {
      return detail.msg || detail.message || detail.detail || JSON.stringify(detail);
    }
    if (detail != null) return String(detail);
    return `${status || ''} ${statusText || 'Transit API error'}`.trim();
  }

  function shiftIso(iso, days) {
    const d = new Date(iso || Date.now());
    const ms = Number.isFinite(d.getTime()) ? d.getTime() : Date.now();
    return new Date(ms + Number(days || 0) * DAY_MS).toISOString();
  }

  function plan(totalDays) {
    const total = Math.max(1, Math.round(Number(totalDays) || 1));
    if (total <= MAX_CHUNK) return [{startOffset:0, days:total}];
    const out = [];
    let coveredTo = 0;
    while (coveredTo < total) {
      const startOffset = out.length ? Math.max(0, coveredTo - OVERLAP) : 0;
      const endOffset = Math.min(total, startOffset + MAX_CHUNK);
      out.push({startOffset, days:endOffset - startOffset});
      if (endOffset >= total) break;
      coveredTo = endOffset;
    }
    return out;
  }

  function uniq(rows, keyFn) {
    const seen = new Set();
    const out = [];
    for (const row of rows || []) {
      const key = keyFn(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
    return out;
  }

  function avg(values, fallback = 0) {
    const xs = (values || []).map(Number).filter(Number.isFinite);
    if (!xs.length) return fallback;
    return Math.round(xs.reduce((a,b) => a + b, 0) / xs.length);
  }

  function merge(parts, body, chunks) {
    if (!parts.length) throw new Error('장기 트랜짓 결과가 비어 있어.');

    const timeline = uniq(
      parts.flatMap(p => p?.timeline || [])
        .sort((a,b) => String(a?.time || '').localeCompare(String(b?.time || ''))),
      x => x?.time || ''
    );
    const acts = timeline.map(x => Number(x?.activation)).filter(Number.isFinite);
    const favs = timeline.map(x => Number(x?.favorability)).filter(Number.isFinite);
    const maxActivation = acts.length ? Math.max(...acts) : 0;

    const peaks = uniq(
      parts.flatMap(p => p?.peak_windows || [])
        .sort((a,b) => (Number(b?.peak_activation)||0) - (Number(a?.peak_activation)||0)
          || (Number(b?.peak_favorability)||0) - (Number(a?.peak_favorability)||0)),
      x => x?.peak || `${x?.start || ''}|${x?.end || ''}`
    ).slice(0,5);

    const cautions = uniq(
      parts.flatMap(p => p?.caution_windows || [])
        .sort((a,b) => (Number(b?.peak_activation)||0) - (Number(a?.peak_activation)||0)),
      x => x?.peak || `${x?.start || ''}|${x?.end || ''}`
    ).slice(0,4);

    const hits = uniq(
      parts.flatMap(p => p?.exact_hits || [])
        .sort((a,b) => (Number(b?.score)||0) - (Number(a?.score)||0)
          || (Number(a?.orb)||999) - (Number(b?.orb)||999)),
      x => `${x?.time || ''}|${x?.transit || ''}|${x?.target || ''}|${x?.aspect || ''}`
    ).slice(0,12);

    const topPoints = uniq(
      parts.flatMap(p => p?.top_points || [])
        .sort((a,b) => (Number(b?.activation)||0) - (Number(a?.activation)||0)
          || (Number(b?.favorability)||0) - (Number(a?.favorability)||0)),
      x => x?.time || ''
    ).slice(0,5);

    const first = parts[0];
    const last = parts[parts.length - 1];
    return {
      schema:'LUNEA_TRANSIT_SCAN_V1',
      topic:first?.topic || body.topic || 'general',
      topic_label:first?.topic_label || body.topic || '전체 흐름',
      range:{
        start:first?.range?.start || body.start_iso,
        end:last?.range?.end || shiftIso(body.start_iso, body.days),
        days:Number(body.days),
        timezone:body.timezone || first?.range?.timezone || 'Asia/Seoul',
        sample_step_hours:Math.max(24, ...parts.map(p => Number(p?.range?.sample_step_hours)||0)),
        client_chunks:chunks.length,
        client_overlap_days:OVERLAP
      },
      overall:{
        max_activation:maxActivation,
        average_activation:avg(acts,0),
        average_favorability:avg(favs,50),
        strong_signal:maxActivation >= 45
      },
      peak_windows:peaks,
      caution_windows:cautions,
      exact_hits:hits,
      top_points:topPoints,
      timeline,
      rules:{
        ...(first?.rules || {}),
        extended_client_chunking:true,
        note:(first?.rules?.note || 'Transit activation is a timing/activation signal, not a guaranteed event outcome.')
          + ` Long range merged from ${chunks.length} server scans.`
      }
    };
  }

  async function chunkedResponse(baseFetch, input, init, body) {
    const chunks = plan(body.days);
    const parts = [];
    const status = $('astroTransitStatus');

    for (let i = 0; i < chunks.length; i += 1) {
      const c = chunks[i];
      if (status) status.textContent = `장기 트랜짓 계산 중 · ${i + 1}/${chunks.length} 구간 · 전체 ${body.days}일`;
      const chunkBody = {
        ...body,
        start_iso:shiftIso(body.start_iso, c.startOffset),
        days:c.days
      };
      const res = await baseFetch(input, {
        ...(init || {}),
        body:JSON.stringify(chunkBody)
      });
      let data = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        throw new Error(`${i + 1}/${chunks.length} 구간 실패 · ${errorText(data, res.status, res.statusText)}`);
      }
      if (data?.schema !== 'LUNEA_TRANSIT_SCAN_V1') {
        throw new Error(`${i + 1}/${chunks.length} 구간의 응답 형식이 예상과 달라.`);
      }
      parts.push(data);
    }

    const merged = merge(parts, body, chunks);
    return new Response(JSON.stringify(merged), {
      status:200,
      headers:{'Content-Type':'application/json'}
    });
  }

  function install() {
    const btn = $('astroTransitRun');
    if (!btn || btn.__luneaLongRunV1) return !!btn;
    const original = btn.onclick;
    if (typeof original !== 'function') return false;

    btn.__luneaLongRunV1 = true;
    btn.onclick = async function(event) {
      const days = Number($('astroTransitDays')?.value || 0);
      if (!(days > MAX_CHUNK)) return original.call(this, event);

      const previousFetch = W.fetch;
      const baseFetch = previousFetch.bind(W);
      let intercepted = false;

      W.fetch = async function(input, init) {
        let url = '';
        try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch {}
        if (intercepted || !/\/v1\/transits\/scan(?:\?|$)/i.test(url)) {
          return baseFetch(input, init);
        }

        let body = null;
        try {
          if (typeof init?.body === 'string') body = JSON.parse(init.body);
        } catch {}
        if (!body || Number(body.days || 0) <= MAX_CHUNK) return baseFetch(input, init);

        intercepted = true;
        return chunkedResponse(baseFetch, input, init, body);
      };

      try {
        return await original.call(this, event);
      } finally {
        W.fetch = previousFetch;
      }
    };

    console.info('🌌 LUNEA Transit Long Run V1 installed · >120d uses safe chunk runner');
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 160) clearInterval(timer);
    }, 50);
    setTimeout(install, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
