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
  const DEFAULT_MODEL = 'gemini-2.5-flash';
  const $ = id => document.getElementById(id);

  const normalizeId = value => String(value || '').replace(/^models\//, '').trim();
  const currentModel = () => normalizeId(localStorage.getItem(MODEL_KEY)) || DEFAULT_MODEL;

  function isTextGemini(model) {
    const id = normalizeId(model?.name || '');
    const methods = Array.isArray(model?.supportedGenerationMethods) ? model.supportedGenerationMethods : [];
    if (!id || !methods.includes('generateContent') || !/^gemini-/i.test(id)) return false;
    return !/(embedding|imagen|veo|tts|live|native-audio|robotics|computer-use|image-generation)/i.test(id);
  }

  function modelScore(model) {
    const id = normalizeId(model?.name || model || '');
    const version = id.match(/gemini-(\d+)(?:\.(\d+))?/i);
    const major = Number(version?.[1] || 0);
    const minor = Number(version?.[2] || 0);
    let score = major * 10000 + minor * 100;
    if (/pro/i.test(id)) score += 70;
    else if (/flash/i.test(id)) score += 45;
    if (/lite/i.test(id)) score -= 20;
    if (/preview/i.test(id)) score -= 4;
    if (/exp|experimental/i.test(id)) score -= 8;
    if (/latest/i.test(id)) score -= 2;
    return score;
  }

  function qualityLabel(id) {
    if (/pro/i.test(id)) return '상위 품질';
    if (/flash.*lite|lite.*flash/i.test(id)) return '경량';
    if (/flash/i.test(id)) return '빠른 응답';
    return 'Gemini';
  }

  function cachedCatalog() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CATALOG_KEY) || 'null');
      return Array.isArray(parsed?.models) ? parsed.models : [];
    } catch { return []; }
  }

  function saveCatalog(models) {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify({ at: Date.now(), models }));
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

  window.LuneaGemini = Object.assign(window.LuneaGemini || {}, {
    defaultModel: DEFAULT_MODEL,
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
      <button type="button" class="mini" id="luneaRecommendGeminiModel">상위 Pro 선택</button>
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
      const selected = normalizeId(preferred || input.value || currentModel());
      const ids = new Set(models.map(model => model.id));
      const rows = [...models];
      if (selected && !ids.has(selected)) rows.unshift({ id:selected, displayName:selected, inputTokenLimit:0, outputTokenLimit:0 });
      if (!rows.length) rows.push({ id:selected || DEFAULT_MODEL, displayName:selected || DEFAULT_MODEL });

      select.innerHTML = '';
      rows.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        const preview = /preview|exp|experimental/i.test(model.id) ? ' · Preview' : '';
        option.textContent = `${model.displayName || model.id} · ${qualityLabel(model.id)}${preview}`;
        select.appendChild(option);
      });
      select.value = rows.some(row => row.id === selected) ? selected : rows[0].id;
      input.value = select.value;
      status.textContent = models.length
        ? `${models.length}개 generateContent 모델 확인 · 선택값은 타로/AI 배열/호라리/시기 해석에 공통 적용돼. 무료/유료 여부는 Google 프로젝트의 현재 요금 정책에 따라 달라.`
        : '현재 저장된 모델을 표시 중이야. API Key 입력 후 목록을 불러오면 이 키에서 사용 가능한 모델을 확인할 수 있어.';
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

    select.addEventListener('change', () => { input.value = normalizeId(select.value); });
    $('luneaLoadGeminiModels').addEventListener('click', () => loadModels());
    $('luneaRecommendGeminiModel').addEventListener('click', async () => {
      if (!models.length) await loadModels();
      if (!models.length) return;
      const pro = models.filter(model => /pro/i.test(model.id)).sort((a,b) => modelScore(b.id)-modelScore(a.id))[0];
      const best = pro || [...models].sort((a,b) => modelScore(b.id)-modelScore(a.id))[0];
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
        if (key && !cachedCatalog().length) loadModels({ quiet:true });
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
