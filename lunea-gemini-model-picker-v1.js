'use strict';

/*
  LUNEA Gemini Model Picker V1
  ----------------------------
  - keeps the existing browser-local API key / LUNEA_MODEL contract
  - discovers generateContent-capable Gemini models from the current API key
  - one shared model choice automatically applies to Tarot / AI spread / Horary / Timing modules
  - does NOT guess free-vs-paid status because the Models API does not expose billing tier
*/
(() => {
  if (window.__LUNEA_GEMINI_MODEL_PICKER_V1__) return;
  window.__LUNEA_GEMINI_MODEL_PICKER_V1__ = true;

  const MODEL_KEY = 'LUNEA_MODEL';
  const API_KEY = 'LUNEA_API_KEY';
  const CATALOG_KEY = 'LUNEA_GEMINI_MODEL_CATALOG_V1';
  const DEFAULT_MODEL = 'gemini-3.8-flash';
  const $ = id => document.getElementById(id);

  const CATALOG_TTL_MS = 3 * 24 * 60 * 60 * 1000;
  const CATALOG_AS_OF = '2026-11';
  // Current Gemini API text lineup (ai.google.dev/gemini-api/docs/models, 2026-11).
  // Shown before the key's own catalog is loaded; the live models.list result always wins.
  const CURATED_MODELS = [
    { id:'gemini-3.8-flash', displayName:'Gemini 3.8 Flash', note:'추천 · LUNEA 기본' },
    { id:'gemini-4-argon', displayName:'Gemini 4 Argon', note:'최상위 추론 · 느리고 비쌈' },
    { id:'gemini-3.7-flash', displayName:'Gemini 3.7 Flash', note:'' },
    { id:'gemini-3.6-flash', displayName:'Gemini 3.6 Flash', note:'' },
    { id:'gemini-3.1-pro-preview', displayName:'Gemini 3.1 Pro Preview', note:'Preview' },
    { id:'gemini-3.5-flash-lite', displayName:'Gemini 3.5 Flash-Lite', note:'경량 · 저비용' },
    { id:'gemini-3.1-flash-lite', displayName:'Gemini 3.1 Flash-Lite', note:'경량' }
  ];
  // Older generations: restricted to projects that used them before (new keys get 404).
  const LEGACY_RE = /^gemini-(?:1\.|2\.0|2\.5)/i;

  const normalizeId = value => String(value || '').replace(/^models\//, '').trim();
  const currentModel = () => normalizeId(localStorage.getItem(MODEL_KEY)) || DEFAULT_MODEL;

  function isTextGemini(model) {
    const id = normalizeId(model?.name || '');
    const methods = Array.isArray(model?.supportedGenerationMethods) ? model.supportedGenerationMethods : [];
    if (!id || !methods.includes('generateContent') || !/^gemini-/i.test(id)) return false;
    return !/(embedding|imagen|veo|tts|live|native-audio|robotics|computer-use|image|nano-banana|omni|transcribe|translate|aqa|deep-research|antigravity|lyria)/i.test(id);
  }

  function modelScore(model) {
    const id = normalizeId(model?.name || model || '');
    const version = id.match(/gemini-(\d+)(?:\.(\d+))?/i);
    const major = Number(version?.[1] || 0);
    const minor = Number(version?.[2] || 0);
    let score = major * 10000 + minor * 100;
    if (LEGACY_RE.test(id)) score -= 100000;
    if (/argon|ultra/i.test(id)) score += 90;
    else if (/pro/i.test(id)) score += 70;
    else if (/flash/i.test(id)) score += 45;
    if (/lite/i.test(id)) score -= 20;
    if (/preview/i.test(id)) score -= 4;
    if (/exp|experimental/i.test(id)) score -= 8;
    if (/latest/i.test(id)) score -= 2;
    return score;
  }

  function qualityLabel(id) {
    if (LEGACY_RE.test(id)) return '구버전 · 신규 키 사용 불가';
    if (/argon|ultra/i.test(id)) return '최상위 추론';
    if (/pro/i.test(id)) return '상위 품질';
    if (/flash.*lite|lite.*flash/i.test(id)) return '경량';
    if (/flash/i.test(id)) return '빠른 응답';
    return 'Gemini';
  }

  function cachedCatalogEntry() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CATALOG_KEY) || 'null');
      return parsed && Array.isArray(parsed.models) ? parsed : null;
    } catch { return null; }
  }
  function cachedCatalog() { return cachedCatalogEntry()?.models || []; }
  function catalogIsStale() {
    const entry = cachedCatalogEntry();
    if (!entry || !entry.models.length) return true;
    if (entry.asOf !== CATALOG_AS_OF) return true;
    return !(Number(entry.at) > Date.now() - CATALOG_TTL_MS);
  }

  function saveCatalog(models) {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify({ at: Date.now(), asOf: CATALOG_AS_OF, models }));
    } catch {}
  }

  async function fetchCatalog(apiKey) {
    const key = String(apiKey || '').trim();
    if (!key) throw new Error('API Key를 먼저 입력해줘.');
    const models = [];
    let pageToken = '';
    do {
      const params = new URLSearchParams({ key, pageSize: '1000' });
      if (pageToken) params.set('pageToken', pageToken);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error?.message || `모델 목록 조회 실패 (${res.status})`);
      (data.models || []).forEach(model => { if (isTextGemini(model)) models.push(model); });
      pageToken = String(data.nextPageToken || '');
    } while (pageToken);

    const deduped = [...new Map(models.map(model => [normalizeId(model.name), {
      id: normalizeId(model.name),
      displayName: String(model.displayName || normalizeId(model.name)),
      description: String(model.description || ''),
      inputTokenLimit: Number(model.inputTokenLimit || 0),
      outputTokenLimit: Number(model.outputTokenLimit || 0)
    }])).values()].sort((a, b) => modelScore(b.id) - modelScore(a.id) || a.id.localeCompare(b.id));

    saveCatalog(deduped);
    return deduped;
  }

  // Retired-model fallback: Google retires Gemini model IDs over time (e.g. gemini-2.5-flash
  // now returns 404 "no longer available"). Every LUNEA generateContent call goes through
  // window.fetch, so one wrapper here retries once with a live model and saves it.
  const RETIRED_KEY = 'LUNEA_GEMINI_RETIRED_MODELS_V1';
  const RETIRED_RE = /no longer available|is not found|not found for api version|not supported for generatecontent|has been deprecated|decommission/i;
  const GEN_URL_RE = /^(https:\/\/generativelanguage\.googleapis\.com\/v1(?:beta|alpha)?\/models\/)([^:/?]+)(:(?:stream)?[Gg]enerateContent.*)$/;
  const retiredModels = () => { try { return JSON.parse(localStorage.getItem(RETIRED_KEY) || '[]') || []; } catch { return []; } };
  const markRetired = id => { try { const list = new Set(retiredModels()); list.add(id); localStorage.setItem(RETIRED_KEY, JSON.stringify([...list].slice(-20))); } catch {} };

  function apiKeyFrom(url, init) {
    try { const k = new URL(url).searchParams.get('key'); if (k) return k; } catch {}
    try {
      const h = init?.headers;
      const v = h instanceof Headers ? h.get('x-goog-api-key') : (h && (h['x-goog-api-key'] || h['X-Goog-Api-Key']));
      if (v) return v;
    } catch {}
    return localStorage.getItem(API_KEY) || '';
  }

  async function replacementFor(failed, key) {
    const blocked = new Set([failed, ...retiredModels()]);
    let list = cachedCatalog();
    if (!list.length && key) { try { list = await fetchCatalog(key); } catch {} }
    if (!list.length) list = CURATED_MODELS;
    const usable = list.map(m => m.id).filter(id => id && !blocked.has(id) && !LEGACY_RE.test(id) && !/preview|exp|experimental|lite|argon|ultra/i.test(id));
    const sameTier = usable.filter(id => (/pro/i.test(failed) ? /pro/i : /flash/i).test(id));
    const pick = [...(sameTier.length ? sameTier : usable)].sort((a, b) => modelScore(b) - modelScore(a))[0];
    if (pick) return pick;
    return blocked.has(DEFAULT_MODEL) ? '' : DEFAULT_MODEL;
  }

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch && !window.__LUNEA_GEMINI_RETIRED_FALLBACK__) {
    window.__LUNEA_GEMINI_RETIRED_FALLBACK__ = true;
    window.fetch = async function luneaGeminiFetch(input, init) {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : '');
      const match = url && url.match(GEN_URL_RE);
      if (!match) return nativeFetch(input, init);
      const res = await nativeFetch(input, init);
      if (res.status !== 404 && res.status !== 400) return res;
      let message = '';
      try { message = String((await res.clone().json())?.error?.message || ''); } catch {}
      if (!RETIRED_RE.test(message)) return res;
      const failed = normalizeId(decodeURIComponent(match[2]));
      markRetired(failed);
      const next = await replacementFor(failed, apiKeyFrom(url, init));
      if (!next || next === failed) return res;
      const saved = normalizeId(localStorage.getItem(MODEL_KEY));
      if (!saved || saved === failed) { try { localStorage.setItem(MODEL_KEY, next); } catch {} }
      console.warn(`[LUNEA Gemini] ${failed} 사용 불가 → ${next}로 자동 전환`);
      try { window.dispatchEvent(new CustomEvent('lunea:gemini-model-fallback', { detail: { from: failed, to: next } })); } catch {}
      return nativeFetch(match[1] + encodeURIComponent(next) + match[3], init);
    };
  }

  window.LuneaGemini = Object.assign(window.LuneaGemini || {}, {
    defaultModel: DEFAULT_MODEL,
    curatedModels: CURATED_MODELS.map(m => ({ ...m })),
    isLegacy: id => LEGACY_RE.test(normalizeId(id)),
    getModel: currentModel,
    setModel(id) {
      const model = normalizeId(id);
      if (model) localStorage.setItem(MODEL_KEY, model);
      return model;
    },
    fetchModels: fetchCatalog,
    getCachedModels: cachedCatalog,
    recommend(models) {
      const list = Array.isArray(models) ? models : cachedCatalog();
      return [...list].sort((a, b) => modelScore(b.id || b.name) - modelScore(a.id || a.name))[0] || null;
    }
  });

  function installPicker() {
    const input = $('modelId');
    const apiKeyInput = $('apiKey');
    const saveButton = $('saveApi');
    if (!input || !apiKeyInput || !saveButton) return false;
    if ($('luneaGeminiModelSelect')) return true;

    const field = input.closest('.field');
    if (!field) return false;
    const label = field.querySelector('label');
    if (label) label.textContent = 'Gemini 모델';

    input.type = 'hidden';
    input.autocomplete = 'off';

    const select = document.createElement('select');
    select.id = 'luneaGeminiModelSelect';
    select.setAttribute('aria-label', 'Gemini 모델 선택');

    const controls = document.createElement('div');
    controls.className = 'lunea-model-controls';
    controls.innerHTML = `
      <button type="button" class="mini" id="luneaLoadGeminiModels">모델 목록 새로고침</button>
      <button type="button" class="mini" id="luneaRecommendGeminiModel">추천 모델 선택</button>
    `;

    const status = document.createElement('p');
    status.id = 'luneaGeminiModelStatus';
    status.className = 'footnote lunea-model-status';

    field.appendChild(select);
    field.appendChild(controls);
    field.appendChild(status);

    if (!$('luneaGeminiModelPickerStyle')) {
      const style = document.createElement('style');
      style.id = 'luneaGeminiModelPickerStyle';
      style.textContent = `
        .lunea-model-controls{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}
        .lunea-model-controls .mini{min-height:38px;padding:8px 9px}
        .lunea-model-status{margin:7px 2px 0!important;line-height:1.5!important}
        #luneaGeminiModelSelect{min-height:44px}
        @media(max-width:390px){.lunea-model-controls{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    }

    let models = [];

    function render(list, preferred) {
      models = Array.isArray(list) ? list : [];
      const live = models.length > 0;
      const selected = normalizeId(preferred || input.value || currentModel());
      const notes = new Map(CURATED_MODELS.map(m => [m.id, m.note]));
      const base = live ? models : CURATED_MODELS;
      const ids = new Set(base.map(model => model.id));
      const rows = [...base].sort((a, b) => (a.id === DEFAULT_MODEL ? -1 : b.id === DEFAULT_MODEL ? 1 : modelScore(b.id) - modelScore(a.id)));
      if (selected && !ids.has(selected)) rows.unshift({ id:selected, displayName:selected, inputTokenLimit:0, outputTokenLimit:0 });
      if (!rows.length) rows.push({ id:selected || DEFAULT_MODEL, displayName:selected || DEFAULT_MODEL });

      select.innerHTML = '';
      rows.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        const preview = /preview|exp|experimental/i.test(model.id) ? ' · Preview' : '';
        const note = notes.get(model.id);
        option.textContent = `${model.displayName || model.id} · ${note || qualityLabel(model.id)}${note ? '' : preview}`;
        select.appendChild(option);
      });
      select.value = rows.some(row => row.id === selected) ? selected : rows[0].id;
      input.value = select.value;
      const legacyNote = LEGACY_RE.test(select.value) ? ' ⚠ 선택한 모델은 구버전이라 새 API 키에서는 404가 나. Gemini 3.8 Flash를 권장해.' : '';
      status.textContent = (live
        ? `이 키에서 쓸 수 있는 ${models.length}개 텍스트 모델 · 선택값은 타로/AI 배열/호라리/시기 해석에 공통 적용돼. 무료/유료 여부는 Google 프로젝트 요금 정책에 따라 달라.`
        : `현행 Gemini 텍스트 모델(${CATALOG_AS_OF} 기준)을 표시 중이야. API Key 입력 후 새로고침하면 이 키에서 실제로 쓸 수 있는 목록으로 바뀌어.`) + legacyNote;
    }

    async function loadModels({ quiet=false } = {}) {
      const key = String(apiKeyInput.value || localStorage.getItem(API_KEY) || '').trim();
      if (!key) {
        if (!quiet) status.textContent = 'API Key를 먼저 입력해줘.';
        return [];
      }
      const button = $('luneaLoadGeminiModels');
      if (button) { button.disabled = true; button.textContent = '조회 중…'; }
      if (!quiet) status.textContent = '현재 API Key에서 generateContent 가능한 Gemini 모델을 확인 중…';
      try {
        const list = await fetchCatalog(key);
        render(list, currentModel());
        return list;
      } catch (err) {
        status.textContent = `[모델 목록 오류] ${err.message}`;
        return [];
      } finally {
        if (button) { button.disabled = false; button.textContent = '모델 목록 새로고침'; }
      }
    }

    select.addEventListener('change', () => { input.value = normalizeId(select.value); render(models, input.value); });
    $('luneaLoadGeminiModels').addEventListener('click', () => loadModels());
    $('luneaRecommendGeminiModel').addEventListener('click', async () => {
      if (!models.length) await loadModels();
      const pool = models.length ? models : CURATED_MODELS;
      const ids = new Set(pool.map(model => model.id));
      const best = ids.has(DEFAULT_MODEL)
        ? pool.find(model => model.id === DEFAULT_MODEL)
        : [...pool].filter(model => !LEGACY_RE.test(model.id) && /flash/i.test(model.id) && !/lite|preview|exp/i.test(model.id)).sort((a,b) => modelScore(b.id)-modelScore(a.id))[0]
          || [...pool].sort((a,b) => modelScore(b.id)-modelScore(a.id))[0];
      if (!best) return;
      select.value = best.id;
      input.value = best.id;
      status.textContent = `추천 선택: ${best.displayName || best.id} (${best.id}) · 무료 여부는 Google 프로젝트 정책을 확인해야 해.`;
    });

    saveButton.addEventListener('click', () => { input.value = normalizeId(select.value) || currentModel(); }, true);

    const cached = cachedCatalog();
    render(cached, currentModel());

    const apiButton = $('apiBtn');
    if (apiButton) apiButton.addEventListener('click', () => {
      setTimeout(() => {
        render(cachedCatalog(), currentModel());
        const key = String(apiKeyInput.value || localStorage.getItem(API_KEY) || '').trim();
        if (key && catalogIsStale()) loadModels({ quiet:true });
      }, 30);
    });

    return true;
  }

  const boot = () => {
    if (installPicker()) return;
    [150, 500, 1200, 2500].forEach(ms => setTimeout(installPicker, ms));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
