'use strict';
// Resumable Astro request owner.
// Transit / Return are submitted as server jobs and then polled so iOS can
// suspend the PWA without killing long calculations. Horary stays direct:
// it is interactive, should fail fast, and must not get stuck behind stale jobs.
(() => {
  const W = window;
  if (W.LUNEA_ASTRO_REQUEST_V1) return;

  const active = new Set(), generations = new Map();
  const PENDING_PREFIX = 'LUNEA_ASTRO_PENDING_JOB_V1:';
  const JOB_TIMEOUT_MS = 30 * 60 * 1000;
  const POLL_MS = 2200;
  const generation = scope => generations.get(scope) || 0;

  function cancelScope(scope) {
    generations.set(scope, generation(scope) + 1);
    for (const job of [...active]) if (job.scope === scope) job.cancel();
  }

  function endpointKind(url) {
    const value = String(url || '');
    if (/\/v1\/transits\/scan(?:\?|$)/.test(value)) return 'transit';
    if (/\/v1\/returns\/context(?:\?|$)/.test(value)) return 'return';
    return '';
  }

  function isHoraryEndpoint(url) {
    return /\/v1\/horary(?:\?|$)/.test(String(url || ''));
  }

  function apiBase(url) {
    try {
      const parsed = new URL(String(url), location.href);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return String(url || '').replace(/\/v1\/.*$/, '').replace(/\/+$/, '');
    }
  }

  function parsePayload(options) {
    const body = options?.body;
    if (body == null) return {};
    if (typeof body === 'string') {
      try { return JSON.parse(body); } catch { return null; }
    }
    return null;
  }

  function fingerprint(kind, payload) {
    const copy = JSON.parse(JSON.stringify(payload || {}));
    if (kind === 'return') delete copy.center_iso;
    if (kind === 'transit') delete copy.start_iso;
    const text = `${kind}|${JSON.stringify(copy)}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function pendingKey(kind) { return PENDING_PREFIX + kind; }

  function readPending(kind, fp) {
    try {
      const row = JSON.parse(localStorage.getItem(pendingKey(kind)) || 'null');
      if (!row || row.kind !== kind || row.fingerprint !== fp || !row.jobId) return null;
      if (Date.now() - Number(row.createdAt || 0) > JOB_TIMEOUT_MS) {
        localStorage.removeItem(pendingKey(kind));
        return null;
      }
      return row;
    } catch { return null; }
  }

  function writePending(kind, row) {
    try { localStorage.setItem(pendingKey(kind), JSON.stringify(row)); } catch {}
  }

  function clearPending(kind, jobId) {
    try {
      const row = JSON.parse(localStorage.getItem(pendingKey(kind)) || 'null');
      if (!row || !jobId || row.jobId === jobId) localStorage.removeItem(pendingKey(kind));
    } catch {}
  }

  function clearLegacyHoraryPending() {
    try { localStorage.removeItem(pendingKey('horary')); } catch {}
  }

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        const error = new Error('계산 대기를 취소했어.');
        error.name = 'AbortError';
        reject(error);
        return;
      }
      let timer = 0;
      const done = () => {
        clearTimeout(timer);
        signal?.removeEventListener?.('abort', aborted);
        resolve();
      };
      const aborted = () => {
        clearTimeout(timer);
        signal?.removeEventListener?.('abort', aborted);
        const error = new Error('계산 대기를 취소했어.');
        error.name = 'AbortError';
        reject(error);
      };
      timer = setTimeout(done, ms);
      signal?.addEventListener?.('abort', aborted, {once:true});
    });
  }

  async function responseJson(response) {
    let data;
    try { data = await response.json(); }
    catch {
      if (!response.ok) throw new Error(`서버 응답 오류: HTTP ${response.status}`);
      throw new Error('서버 계산 결과를 읽지 못했어. 다시 시도해줘.');
    }
    return data;
  }

  async function directRequest(url, options, fetcher, signal) {
    const response = await fetcher(url, {...options, signal});
    const data = await responseJson(response);
    if (!response.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : `서버 응답 오류: HTTP ${response.status}`);
    return {response, data};
  }

  async function createServerJob(base, kind, payload, fetcher, signal) {
    const response = await fetcher(`${base}/v1/jobs/astro`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({kind, payload}),
      cache:'no-store',
      signal
    });
    const data = await responseJson(response);
    if (!response.ok) {
      const error = new Error(typeof data?.detail === 'string' ? data.detail : `서버 작업 생성 실패: HTTP ${response.status}`);
      error.httpStatus = response.status;
      throw error;
    }
    if (!data?.job_id) throw new Error('서버가 계산 작업 ID를 주지 않았어.');
    return data;
  }

  async function pollServerJob(base, kind, jobId, fetcher, signal) {
    while (true) {
      if (!document.hidden) await wait(POLL_MS, signal);
      else await wait(5000, signal);

      const response = await fetcher(`${base}/v1/jobs/astro/${encodeURIComponent(jobId)}`, {
        method:'GET', cache:'no-store', headers:{'Accept':'application/json'}, signal
      });
      const data = await responseJson(response);
      if (response.status === 404) {
        const error = new Error('서버 재시작으로 계산 작업이 사라졌어. 다시 작업을 시작할게.');
        error.jobLost = true;
        throw error;
      }
      if (!response.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : `계산 상태 확인 실패: HTTP ${response.status}`);
      if (data.status === 'done') {
        clearPending(kind, jobId);
        return {response, data:data.result};
      }
      if (data.status === 'error') {
        clearPending(kind, jobId);
        throw new Error(data.error || '서버 계산이 실패했어.');
      }
    }
  }

  async function jobRequest(url, options, fetcher, signal, kind) {
    const payload = parsePayload(options);
    if (!payload) return directRequest(url, options, fetcher, signal);
    const base = apiBase(url);
    const fp = fingerprint(kind, payload);
    let pending = readPending(kind, fp);
    let jobId = pending?.jobId || '';
    let restarted = false;

    while (true) {
      if (!jobId) {
        let created;
        try {
          created = await createServerJob(base, kind, payload, fetcher, signal);
        } catch (error) {
          if (error?.httpStatus === 404 || error?.httpStatus === 405) {
            return directRequest(url, options, fetcher, signal);
          }
          throw error;
        }
        jobId = created.job_id;
        writePending(kind, {kind, jobId, fingerprint:fp, createdAt:Date.now()});
      }

      try {
        return await pollServerJob(base, kind, jobId, fetcher, signal);
      } catch (error) {
        if (error?.jobLost && !restarted) {
          restarted = true;
          clearPending(kind, jobId);
          jobId = '';
          continue;
        }
        throw error;
      }
    }
  }

  function json(url, options={}, config={}) {
    const {timeoutMs=240000, scope='reading', prepare, fetcher=(...args)=>W.fetch(...args)} = config;
    const method = String(options?.method || 'GET').toUpperCase();
    const horary = method === 'POST' && isHoraryEndpoint(url);
    if (horary) clearLegacyHoraryPending();
    const kind = method === 'POST' ? endpointKind(url) : '';
    const effectiveTimeout = kind ? Math.max(timeoutMs, JOB_TIMEOUT_MS) : timeoutMs;
    const controller = new AbortController();
    const upstream = options.signal;

    return new Promise((resolve, reject) => {
      let settled = false, timer;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        active.delete(job);
        upstream?.removeEventListener?.('abort', abort);
        error ? reject(error) : resolve(value);
      };
      const abort = () => {
        const error = new Error('계산 대기를 취소했어.');
        error.name = 'AbortError';
        finish(error);
        try { controller.abort(); } catch {}
      };
      const job = {scope, cancel:abort};
      active.add(job);
      timer = setTimeout(() => {
        const error = new Error(`서버 계산이 ${Math.round(effectiveTimeout/60000)}분 안에 완료되지 않아 대기를 중단했어.`);
        error.name = 'TimeoutError';
        finish(error);
        try { controller.abort(); } catch {}
      }, effectiveTimeout);

      if (upstream?.aborted) { abort(); return; }
      upstream?.addEventListener?.('abort', abort, {once:true});

      Promise.resolve().then(async () => {
        if (prepare) await prepare();
        if (settled) return;
        const value = kind
          ? await jobRequest(url, options, fetcher, controller.signal, kind)
          : await directRequest(url, options, fetcher, controller.signal);
        if (!settled) finish(null, value);
      }).catch(error => finish(error));
    });
  }

  W.LUNEA_ASTRO_REQUEST_V1 = Object.freeze({json, cancelScope, generation});
})();
