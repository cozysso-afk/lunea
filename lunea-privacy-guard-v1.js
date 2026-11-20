/* LUNEA Privacy Guard V1: minimise identifying details sent to Gemini.
   Astrology calculations and locally stored profiles are not changed. */
(() => {
  'use strict';
  if (window.__LUNEA_PRIVACY_GUARD_V1__) return;
  const originalFetch = window.fetch.bind(window);
  const read = key => localStorage.getItem(key) || '';
  const json = key => JSON.parse(read(key) || 'null');
  const escapeRe = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function identities() {
    const names = [];
    const places = [];
    const add = (array, value) => {
      const s = String(value || '').trim();
      if (s.length >= 1 && !array.includes(s)) array.push(s);
    };
    add(places, read('LUNEA_BIRTH_PLACE'));
    const auto = json('LUNEA_SAJU_AUTO_V1');
    add(places, auto?.birthPlace);
    const slots = json('LUNEA_PROFILE_SLOTS_V1');
    if (Array.isArray(slots?.slots)) for (const slot of slots.slots) {
      add(places, slot?.birthPlace);
      add(names, slot?.name);
      add(places, slot?.data?.LUNEA_BIRTH_PLACE);
      add(places, slot?.data?.birthPlace);
    }
    const partners = json('LUNEA_PARTNERS_V1');
    for (const partner of (Array.isArray(partners) ? partners : partners?.partners || [])) {
      add(names, partner?.name);
      add(places, partner?.birthPlace);
    }
    return {names, places};
  }
  function redact(input) {
    let result = String(input);
    const {names, places} = identities();
    // Remove identifying profile fields while retaining calculated chart data.
    result = result.replace(/^\s*[-•]?\s*(?:이름\/호칭|출생지|출생 시각\/출생지|생년월일|사용자 메모).*$/gm, '[개인 식별정보 비공개]');
    result = result.replace(/\b(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])\b/g, '[생년월일 비공개]');
    result = result.replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\b/g, '[출생시각 비공개]');
    result = result.replace(/(?:19|20)\d{2}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/g, '[생년월일 비공개]');
    result = result.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[이메일 비공개]');
    result = result.replace(/\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b/g, '[연락처 비공개]');
    for (const name of names.sort((a,b) => b.length-a.length)) {
      result = result.replace(new RegExp(escapeRe(name), 'g'), '[상대방]');
    }
    for (const place of places.sort((a,b) => b.length-a.length)) {
      result = result.replace(new RegExp(escapeRe(place), 'g'), '[출생지 비공개]');
    }
    return result;
  }
  let calculationConsent;
  function sanitizeMessage(message) {
    if (!Array.isArray(message.parts) || !message.parts.length ||
        Object.keys(message).some(key => !['role', 'parts'].includes(key)) ||
        (message.role && !['user', 'model'].includes(message.role))) throw new Error();
    for (const part of message.parts) {
      if (Object.keys(part).length !== 1 || typeof part.text !== 'string') throw new Error();
      part.text = redact(part.text);
    }
  }

  window.fetch = async function(input, init) {
    const url = new URL(input?.url || input, document.baseURI);
    const method = (init?.method || input?.method || 'GET').toUpperCase();
    if (url.hostname !== 'generativelanguage.googleapis.com') {
      if (/^lunea-astro-api(?:-v2)?\.onrender\.com$/.test(url.hostname) &&
          url.pathname.startsWith('/v1/') && method !== 'OPTIONS') {
        calculationConsent ??= window.confirm('이번 페이지에서 루니아 계산 서버에 계산을 요청할까요? 기능에 따라 본인 또는 상대의 출생일·시각·장소, 질문 정보가 전송됩니다. 취소하면 서버 계산을 차단합니다.');
        if (!calculationConsent) throw new Error('외부 계산 서버 전송을 차단했습니다.');
      }
      return originalFetch(input, init);
    }
    try {
      if (url.protocol !== 'https:' || [...url.searchParams.keys()].some(k => !['key','pageSize','pageToken'].includes(k))) throw new Error();
      if (method === 'GET' && url.pathname === '/v1beta/models') return originalFetch(input, init);
      if (method !== 'POST' || !/^\/v1beta\/models\/[\w.-]+:generateContent$/.test(url.pathname) || typeof init?.body !== 'string') throw new Error();
      const body = JSON.parse(init.body);
      if (!Array.isArray(body.contents) || Object.keys(body).some(k => !['contents','systemInstruction','generationConfig'].includes(k))) throw new Error();
      body.contents.forEach(sanitizeMessage);
      if (body.systemInstruction) sanitizeMessage(body.systemInstruction);
      if (body.generationConfig) {
        // Schema descriptions and other string-valued options can contain prompt text.
        body.generationConfig = JSON.parse(JSON.stringify(body.generationConfig, (_, v) => typeof v === 'string' ? redact(v) : v));
      }
      return originalFetch(input, {...init, body:JSON.stringify(body)});
    } catch {
      throw new Error('개인정보 보호: AI 요청을 확인할 수 없어 전송을 차단했습니다.');
    }
  };
  window.LUNEA_PRIVACY_GUARD_V1 = Object.freeze({redact});
  window.__LUNEA_PRIVACY_GUARD_V1__ = true;
})();
