/* LUNEA Privacy Guard V1: minimise identifying details sent to Gemini.
   Astrology calculations and locally stored profiles are not changed. */
(() => {
  'use strict';
  if (window.__LUNEA_PRIVACY_GUARD_V1__) return;
  window.__LUNEA_PRIVACY_GUARD_V1__ = true;
  const originalFetch = window.fetch.bind(window);
  const read = key => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
  const json = key => { try { return JSON.parse(read(key) || 'null'); } catch { return null; } };
  const escapeRe = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function identities() {
    const names = [];
    const places = [];
    const add = (array, value) => {
      const s = String(value || '').trim();
      if (s.length >= 2 && !array.includes(s)) array.push(s);
    };
    add(places, read('LUNEA_BIRTH_PLACE'));
    const auto = json('LUNEA_SAJU_AUTO_V1');
    add(places, auto?.birthPlace);
    const slots = json('LUNEA_PROFILE_SLOTS_V1');
    if (Array.isArray(slots?.slots)) for (const slot of slots.slots) {
      add(places, slot?.birthPlace);
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
    for (const name of names.sort((a,b) => b.length-a.length)) {
      result = result.replace(new RegExp(escapeRe(name), 'g'), '[상대방]');
    }
    for (const place of places.sort((a,b) => b.length-a.length)) {
      result = result.replace(new RegExp(escapeRe(place), 'g'), '[출생지 비공개]');
    }
    return result;
  }
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!/^https:\/\/generativelanguage\.googleapis\.com\//i.test(url)) {
      return originalFetch(input, init);
    }
    // Fail closed if the payload cannot be inspected; never send an unreviewed body.
    if (!init || typeof init.body !== 'string') {
      return Promise.reject(new Error('개인정보 보호: AI 요청 본문을 확인할 수 없어 전송을 차단했습니다.'));
    }
    try {
      const body = JSON.parse(init.body);
      if (!Array.isArray(body.contents)) throw new Error('invalid contents');
      for (const item of body.contents) {
        for (const part of (item?.parts || [])) {
          if (typeof part.text === 'string') part.text = redact(part.text);
        }
      }
      return originalFetch(input, {...init, body: JSON.stringify(body)});
    } catch {
      return Promise.reject(new Error('개인정보 보호: AI 요청 정제 실패로 전송을 차단했습니다.'));
    }
  };
  window.LUNEA_PRIVACY_GUARD_V1 = Object.freeze({redact});
})();
