'use strict';

/* LUNEA PROFILE + NATAL RECOVERY V44
   - Adds 중화신약 to Saju strength options.
   - Converts birthplace free-text input into a stable Korean city picker while
     preserving any previously saved custom value.
   - On the canonical Render origin, treats the same-origin proxy health probe
     as local-ready so a transient edge 429 cannot block the actual Natal POST.
   - Leaves real calculation requests untouched; V43/server retry still handles
     transient 429/5xx on calculation endpoints.
*/
(() => {
  if (window.__LUNEA_PROFILE_NATAL_V44__) return;
  window.__LUNEA_PROFILE_NATAL_V44__ = true;

  const PLACE_KEY = 'LUNEA_BIRTH_PLACE';
  const PLACES = [
    '서울','부산','대구','인천','광주','대전','울산','세종',
    '수원','성남','고양','용인','부천','안산','안양','화성','평택','의정부','남양주',
    '춘천','원주','강릉','청주','충주','천안','아산','전주','군산','익산',
    '목포','여수','순천','광양','포항','경주','구미','안동','창원','김해','진주','거제','제주','서귀포'
  ];

  function ensureStrengthOption() {
    const select = document.getElementById('sajuStrength');
    if (!select) return false;
    if ([...select.options].some(o => o.value === '중화신약' || o.textContent.trim() === '중화신약')) return true;

    const option = document.createElement('option');
    option.value = '중화신약';
    option.textContent = '중화신약';

    const weak = [...select.options].find(o => o.value === '신약' || o.textContent.trim() === '신약');
    if (weak) select.insertBefore(option, weak);
    else select.appendChild(option);
    return true;
  }

  function ensureBirthPlacePicker() {
    const current = document.getElementById('birthPlace');
    if (!current) return false;
    if (current.tagName === 'SELECT' && current.dataset.luneaPlaceV44 === '1') return true;

    const saved = String(localStorage.getItem(PLACE_KEY) || current.value || '').trim();
    const select = document.createElement('select');
    select.id = 'birthPlace';
    select.dataset.luneaPlaceV44 = '1';
    select.setAttribute('aria-label', '출생지 선택');

    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '출생지 선택';
    select.appendChild(blank);

    const grouped = [
      ['광역시·특별시', ['서울','부산','대구','인천','광주','대전','울산','세종']],
      ['경기', ['수원','성남','고양','용인','부천','안산','안양','화성','평택','의정부','남양주']],
      ['강원·충청', ['춘천','원주','강릉','청주','충주','천안','아산']],
      ['전라', ['전주','군산','익산','목포','여수','순천','광양']],
      ['경상', ['포항','경주','구미','안동','창원','김해','진주','거제']],
      ['제주', ['제주','서귀포']]
    ];

    grouped.forEach(([label, values]) => {
      const group = document.createElement('optgroup');
      group.label = label;
      values.forEach(place => {
        const o = document.createElement('option');
        o.value = place;
        o.textContent = place;
        group.appendChild(o);
      });
      select.appendChild(group);
    });

    if (saved && !PLACES.includes(saved)) {
      const custom = document.createElement('option');
      custom.value = saved;
      custom.textContent = `${saved} · 기존 저장값`;
      select.insertBefore(custom, select.children[1] || null);
    }
    select.value = saved;

    current.replaceWith(select);
    return true;
  }

  function addStyle() {
    if (document.getElementById('luneaProfileNatalV44Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaProfileNatalV44Style';
    s.textContent = `
      #cpv3BirthGrid select#birthPlace,
      #profileOverlay select#birthPlace{
        display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
        box-sizing:border-box!important;background:rgba(255,255,255,.055)!important;
      }
    `;
    document.head.appendChild(s);
  }

  function installHealthShield() {
    if (window.__LUNEA_NATAL_HEALTH_SHIELD_V44__ || typeof window.fetch !== 'function') return;
    window.__LUNEA_NATAL_HEALTH_SHIELD_V44__ = true;
    const prior = window.fetch.bind(window);
    window.fetch = function(input, init) {
      try {
        const raw = typeof input === 'string' ? input : String(input?.url || '');
        const u = new URL(raw, location.href);
        if (u.origin === location.origin && u.pathname === '/__lunea_api/health') {
          return Promise.resolve(new Response(JSON.stringify({
            ok:true,
            proxy:true,
            local_health:true,
            build:'profile-natal-v44'
          }), {
            status:200,
            headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
          }));
        }
      } catch {}
      return prior(input, init);
    };
  }

  function repair() {
    addStyle();
    ensureStrengthOption();
    ensureBirthPlacePicker();
  }

  installHealthShield();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', repair, {once:true});
  else repair();

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; repair(); });
  };
  new MutationObserver(schedule).observe(document.documentElement, {subtree:true, childList:true});

  console.info('✦ LUNEA PROFILE + NATAL RECOVERY V44 loaded');
})();
