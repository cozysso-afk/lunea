'use strict';

/*
  LUNEA TRANSIT LONG RUN V2
  =========================
  Resumable compatibility layer for Transit Scanner ranges > 120 days.

  - <=120 days: delegates untouched to the original Transit handler.
  - >120 days: splits into <=120-day chunks and merges the normal V1 responses.
  - Saves every completed chunk to localStorage immediately.
  - If iOS suspends/kills an in-flight request while the app is backgrounded,
    waits for foreground and retries the SAME chunk instead of failing the run.
  - If the page/app reloads, pressing Transit Scan again with the same
    topic/range/natal data resumes from the saved chunk checkpoint.
  - A completed merged result clears the temporary checkpoint.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TRANSIT_LONG_RUN_V2__) return;
  W.__LUNEA_TRANSIT_LONG_RUN_V2__ = true;
  W.__LUNEA_TRANSIT_LONG_RUN_V1__ = true;

  const $ = id => document.getElementById(id);
  const MAX_CHUNK = 120;
  const OVERLAP = 2;
  const DAY_MS = 86400000;
  const CHECKPOINT_KEY = 'LUNEA_TRANSIT_LONG_RUN_V2_CHECKPOINT';
  const CHECKPOINT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

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
        client_overlap_days:OVERLAP,
        resumable_chunks:true
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
        resumable_client_chunking:true,
        note:(first?.rules?.note || 'Transit activation is a timing/activation signal, not a guaranteed event outcome.')
          + ` Long range merged from ${chunks.length} resumable server scans.`
      }
    };
  }

  function signatureFor(body) {
    let raw = '';
    try {
      raw = JSON.stringify({
        days:Number(body?.days || 0),
        topic:String(body?.topic || ''),
        timezone:String(body?.timezone || ''),
        natal:body?.natal || null
      });
    } catch {
      raw = `${body?.days}|${body?.topic}|${body?.timezone}`;
    }
    let h = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function readCheckpoint(body, chunks) {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null');
      if (!saved) return null;
      if (Date.now() - Number(saved.updatedAt || 0) > CHECKPOINT_MAX_AGE_MS) {
        localStorage.removeItem(CHECKPOINT_KEY);
        return null;
      }
      if (saved.signature !== signatureFor(body)) return null;
      if (!Array.isArray(saved.parts) || saved.parts.length > chunks.length) return null;
      return saved;
    } catch {
      return null;
    }
  }

  function writeCheckpoint(body, parts, chunks, startIso) {
    try {
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify({
        version:2,
        signature:signatureFor(body),
        totalDays:Number(body.days),
        startIso,
        parts,
        completed:parts.length,
        totalChunks:chunks.length,
        updatedAt:Date.now()
      }));
    } catch (err) {
      console.warn('[Transit Long V2] checkpoint save skipped', err);
    }
  }

  function clearCheckpoint() {
    try { localStorage.removeItem(CHECKPOINT_KEY); } catch {}
  }

  function waitUntilVisible(status, i, total) {
    if (!document.hidden) return Promise.resolve();
    if (status) status.textContent = `장기 트랜짓 일시정지 · 앱으로 돌아오면 ${i + 1}/${total} 구간부터 자동 재개`;
    return new Promise(resolve => {
      const onVisible = () => {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onVisible);
        if (status) status.textContent = `장기 트랜짓 재개 중 · ${i + 1}/${total} 구간`;
        resolve();
      };
      document.addEventListener('visibilitychange', onVisible);
    });
  }

  function isTransientNetworkError(err) {
    const name = String(err?.name || '');
    const msg = String(err?.message || err || '');
    return name === 'TypeError'
      || /network|load failed|fetch|internet|connection|cancelled|canceled/i.test(msg)
      || (name === 'AbortError' && document.hidden);
  }

  async function fetchOneChunk(baseFetch, input, init, chunkBody, i, total, status) {
    let attempt = 0;
    while (attempt < 4) {
      attempt += 1;
      await waitUntilVisible(status, i, total);
      try {
        const res = await baseFetch(input, {
          ...(init || {}),
          body:JSON.stringify(chunkBody)
        });
        let data = null;
        try { data = await res.json(); } catch {}

        if (!res.ok) {
          // Server-side validation/client errors should surface immediately.
          if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
            throw new Error(`${i + 1}/${total} 구간 실패 · ${errorText(data, res.status, res.statusText)}`);
          }
          throw Object.assign(new Error(`${i + 1}/${total} 구간 일시 오류 · ${errorText(data, res.status, res.statusText)}`), {transient:true});
        }
        if (data?.schema !== 'LUNEA_TRANSIT_SCAN_V1') {
          throw new Error(`${i + 1}/${total} 구간의 응답 형식이 예상과 달라.`);
        }
        return data;
      } catch (err) {
        const transient = err?.transient || isTransientNetworkError(err);
        if (!transient) throw err;

        if (document.hidden) {
          await waitUntilVisible(status, i, total);
        } else if (attempt < 4) {
          if (status) status.textContent = `연결 복구 중 · ${i + 1}/${total} 구간 재시도 ${attempt}/3`;
          await new Promise(r => setTimeout(r, 700 * attempt));
        }

        if (attempt >= 4) {
          throw new Error(`${i + 1}/${total} 구간의 네트워크 연결이 반복해서 끊겼어. 완료된 구간은 저장했으니 다시 스캔하면 여기서 이어서 계산해.`);
        }
      }
    }
    throw new Error(`${i + 1}/${total} 구간 계산을 재개하지 못했어.`);
  }

  async function chunkedResponse(baseFetch, input, init, body) {
    const chunks = plan(body.days);
    const status = $('astroTransitStatus');
    const saved = readCheckpoint(body, chunks);
    const parts = saved?.parts?.slice() || [];
    const startIso = saved?.startIso || body.start_iso || new Date().toISOString();
    const effectiveBody = {...body, start_iso:startIso};

    if (saved && parts.length) {
      if (status) status.textContent = `이전 장기 계산 복원 · ${parts.length}/${chunks.length} 구간 완료 · 다음 구간부터 이어서 계산`;
    } else {
      writeCheckpoint(effectiveBody, parts, chunks, startIso);
    }

    for (let i = parts.length; i < chunks.length; i += 1) {
      const c = chunks[i];
      if (status) status.textContent = `장기 트랜짓 계산 중 · ${i + 1}/${chunks.length} 구간 · 전체 ${body.days}일`;
      const chunkBody = {
        ...effectiveBody,
        start_iso:shiftIso(startIso, c.startOffset),
        days:c.days
      };

      const data = await fetchOneChunk(baseFetch, input, init, chunkBody, i, chunks.length, status);
      parts.push(data);
      writeCheckpoint(effectiveBody, parts, chunks, startIso);
      if (status && i + 1 < chunks.length) {
        status.textContent = `${i + 1}/${chunks.length} 구간 저장 완료 · 다음 구간 계산 준비 중`;
      }
    }

    const merged = merge(parts, effectiveBody, chunks);
    clearCheckpoint();
    return new Response(JSON.stringify(merged), {
      status:200,
      headers:{'Content-Type':'application/json'}
    });
  }

  function install() {
    const btn = $('astroTransitRun');
    if (!btn || btn.__luneaLongRunV2) return !!btn;
    const original = btn.onclick;
    if (typeof original !== 'function') return false;

    btn.__luneaLongRunV2 = true;
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

    console.info('🌌 LUNEA Transit Long Run V2 installed · resumable >120d scans ON');
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
