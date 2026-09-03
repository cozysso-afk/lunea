'use strict';

/* LUNEA INTIMACY mobile readability + category-style artwork V36.3 */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_READABILITY_V36__) return;
  W.__LUNEA_INTIMACY_READABILITY_V36__ = true;

  const RELEASE = '36.3';
  const SCRIPT_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3630';
    } catch {
      return '3630';
    }
  })();
  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v37.svg?v=${encodeURIComponent(SCRIPT_VERSION)}`;
  const $ = (selector, root = document) => root.querySelector(selector);

  const DISPLAY_COPY = Object.freeze([
    ['직접 입력 배열', '포지션을 직접 정하고, 필요하면 A/B 대칭 배열도 복제해요.'],
    ['AI 맞춤 INTIMACY 배열', '질문에 맞춰 끌림 · 리듬 · 경계 · 만족 포지션을 자동 설계해요.'],
    ['속궁합 · 19+', '욕구·리드 · 굵기/압박감 · 타이트함/밀착감 · 템포 · 지속성 · 판타지 · 만족 · 여운'],
    ['신체적 속궁합 · CORE 5', '신체적 끌림 · 내가 원하는 방식/리듬 · 상대가 원하는 방식/리듬 · 어긋나기 쉬운 지점 · 맞춰갈 핵심'],
    ['성적 끌림 & 텐션', '상대에게 느끼는 끌림 · 내가 느끼는 끌림 · 실제 케미/긴장 · 숨기는 욕구 · 표현을 막는 요인 · 긴장의 방향'],
    ['리듬 · 경계 · 조율', '내 속도/템포 · 상대 속도/템포 · 나의 편안함 조건 · 상대의 편안함 조건 · 경계 · 조율 포인트 · 이후 흐름'],
    ['재회 후 친밀감', '남은 신체적 끌림 · 남은 정서적 애착 · 다시 가까워지고 싶은 동기 · 반복될 문제 · 재접촉 리듬 · 관계 전체 영향'],
    ['A/B 친밀감 비교', 'A 끌림·리듬·안전감 · B 끌림·리듬·안전감 · 공통 욕구 · A/B의 향후 만족 비교']
  ]);

  function addStyles() {
    if ($('#luneaIntimacyReadabilityV36Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaIntimacyReadabilityV36Style';
    style.textContent = `
      .lunea-intimacy-category .cat-icon{
        min-width:78px!important;
        min-height:78px!important;
        width:78px!important;
        height:78px!important;
        padding:0!important;
        overflow:hidden!important;
        border-radius:22px!important;
        border:1px solid rgba(239,185,211,.34)!important;
        background:#181329!important;
        box-shadow:0 0 0 3px rgba(222,160,192,.04),0 0 24px rgba(175,107,159,.15),inset 0 1px rgba(255,255,255,.05)!important;
      }
      .lunea-intimacy-category .cat-icon::after{
        inset:0!important;
        border-radius:21px!important;
        border:1px solid rgba(255,223,236,.08)!important;
        box-shadow:inset 0 0 16px rgba(229,176,210,.05)!important;
      }
      .lunea-intimacy-category .lunea-intimacy-sector-art-v37{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        border-radius:21px!important;
        transform:scale(1.01);
        filter:saturate(.98) contrast(1.03) brightness(1.02);
      }
      .lunea-intimacy-category.active .cat-icon{animation:luneaIntimacyBreath 3.8s ease-in-out infinite}

      .lunea-intimacy-category .category-content{
        padding:14px 14px 18px!important;
        gap:12px!important;
      }
      .lunea-intimacy-category .reading-item{
        min-height:0!important;
        padding:17px 54px 17px 17px!important;
        border-radius:17px!important;
        border-color:rgba(232,174,200,.18)!important;
      }
      .lunea-intimacy-category .reading-item > div:first-child{
        min-width:0!important;
        max-width:100%!important;
      }
      .lunea-intimacy-category .reading-item h4{
        margin:0 0 8px!important;
        font-size:16.6px!important;
        font-weight:700!important;
        line-height:1.3!important;
        letter-spacing:-.14px!important;
        color:#fffafd!important;
      }
      .lunea-intimacy-category .reading-item p{
        display:block!important;
        margin:0!important;
        color:rgba(239,231,241,.88)!important;
        font-size:12.9px!important;
        font-weight:400!important;
        line-height:1.62!important;
        -webkit-line-clamp:unset!important;
        -webkit-box-orient:initial!important;
        overflow:visible!important;
        overflow-wrap:break-word!important;
        word-break:keep-all!important;
      }
      .lunea-intimacy-category .reading-item .count{
        top:16px!important;
        right:15px!important;
        transform:none!important;
        width:30px!important;
        height:30px!important;
        min-width:30px!important;
        font-size:11.4px!important;
        border-color:rgba(239,168,198,.34)!important;
        background:rgba(121,66,105,.18)!important;
        color:#fff1f7!important;
        z-index:2;
      }
      .lunea-intimacy-category .reading-item .count.lunea-count-label{
        width:auto!important;
        min-width:42px!important;
        height:30px!important;
        padding:0 9px!important;
        border-radius:999px!important;
        font-size:10.8px!important;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
        min-height:0!important;
        padding-top:18px!important;
        padding-bottom:18px!important;
      }
      .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9 h4{
        display:flex!important;
        flex-wrap:wrap!important;
        align-items:center!important;
        gap:7px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-legacy-badge{
        margin-left:0!important;
        padding:4px 8px!important;
        font-size:9.4px!important;
        letter-spacing:.7px!important;
      }
      .lunea-intimacy-category .lunea-intimacy-list-label{
        margin:12px 6px 1px!important;
        color:rgba(247,204,224,.9)!important;
        font-size:10.2px!important;
        font-weight:700!important;
        line-height:1.35!important;
        letter-spacing:1.18px!important;
      }

      @media(max-width:430px){
        .lunea-intimacy-category .category-header{min-height:116px!important}
        .lunea-intimacy-category .cat-icon{
          min-width:72px!important;
          min-height:72px!important;
          width:72px!important;
          height:72px!important;
          border-radius:20px!important;
        }
        .lunea-intimacy-category .cat-icon::after,
        .lunea-intimacy-category .lunea-intimacy-sector-art-v37{border-radius:19px!important}
        .lunea-intimacy-category .cat-text h3{
          font-size:19.5px!important;
          line-height:1.16!important;
        }
        .lunea-intimacy-category .cat-text p{
          margin-top:7px!important;
          font-size:12.5px!important;
          line-height:1.52!important;
          color:rgba(233,225,236,.86)!important;
        }
        .lunea-intimacy-category .category-content{
          padding:14px 13px 18px!important;
          gap:12px!important;
        }
        .lunea-intimacy-category .reading-item{
          min-height:0!important;
          padding:18px 50px 18px 17px!important;
          border-radius:17px!important;
        }
        .lunea-intimacy-category .reading-item h4{
          margin-bottom:9px!important;
          font-size:17.4px!important;
          line-height:1.28!important;
        }
        .lunea-intimacy-category .reading-item p{
          font-size:13.4px!important;
          line-height:1.65!important;
          color:rgba(244,236,246,.9)!important;
        }
        .lunea-intimacy-category .reading-item .count{
          top:17px!important;
          right:13px!important;
          width:30px!important;
          height:30px!important;
          min-width:30px!important;
        }
        .lunea-intimacy-category .reading-item .count.lunea-count-label{
          min-width:42px!important;
          height:30px!important;
          padding:0 8px!important;
          font-size:10.7px!important;
        }
        .lunea-intimacy-category .reading-item.lunea-intimacy-legacy9{
          min-height:0!important;
          padding-top:19px!important;
          padding-bottom:19px!important;
        }
        .lunea-intimacy-category .lunea-intimacy-list-label{
          margin:13px 6px 2px!important;
          font-size:10.6px!important;
          letter-spacing:1.1px!important;
        }
      }

      @media(max-width:380px){
        .lunea-intimacy-category .cat-icon{
          min-width:66px!important;
          min-height:66px!important;
          width:66px!important;
          height:66px!important;
          border-radius:18px!important;
        }
        .lunea-intimacy-category .cat-icon::after,
        .lunea-intimacy-category .lunea-intimacy-sector-art-v37{border-radius:17px!important}
        .lunea-intimacy-category .cat-text h3{font-size:18.3px!important}
        .lunea-intimacy-category .cat-text p{font-size:12.1px!important}
        .lunea-intimacy-category .reading-item{padding:17px 48px 17px 15px!important}
        .lunea-intimacy-category .reading-item h4{font-size:16.7px!important}
        .lunea-intimacy-category .reading-item p{font-size:13px!important;line-height:1.63!important}
        .lunea-intimacy-category .reading-item .count{right:11px!important}
      }
      @media(prefers-reduced-motion:reduce){
        .lunea-intimacy-category .cat-icon{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon) return;
    const existing = $('.lunea-intimacy-sector-art-v37', icon);
    if (existing) {
      if (existing.getAttribute('src') !== ICON_SRC) existing.setAttribute('src', ICON_SRC);
      return;
    }
    icon.innerHTML = '';
    const img = document.createElement('img');
    img.className = 'lunea-intimacy-sector-art-v37';
    img.src = ICON_SRC;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    icon.appendChild(img);
  }

  function guardIcon(category) {
    const icon = $('.cat-icon', category);
    if (!icon || icon.dataset.intimacyLogoGuard === '1') return;
    icon.dataset.intimacyLogoGuard = '1';
    const observer = new MutationObserver(() => {
      const art = $('.lunea-intimacy-sector-art-v37', icon);
      if (!art || art.getAttribute('src') !== ICON_SRC) installIcon(category);
    });
    observer.observe(icon, { childList: true, subtree: false });
  }

  function polishCopy(category) {
    category.querySelectorAll('.reading-item').forEach(item => {
      const title = String($('h4', item)?.textContent || '').replace(/\s+/g, ' ').trim();
      const body = $('p', item);
      if (!body) return;
      const hit = DISPLAY_COPY.find(([key]) => title.includes(key));
      if (hit && body.textContent !== hit[1]) body.textContent = hit[1];
    });
    const label = $('.lunea-intimacy-list-label', category);
    if (label && /INTIMACY\s+FIXED\s+SPREADS/i.test(label.textContent || '')) {
      label.textContent = 'INTIMACY · 고정 배열';
    }
  }

  function classifyCounts(category) {
    category.querySelectorAll('.reading-item .count').forEach(count => {
      const text = String(count.textContent || '').trim();
      count.classList.toggle('lunea-count-label', !/^\d+$/.test(text));
    });
  }

  function install() {
    addStyles();
    const category = $('.lunea-intimacy-category');
    if (!category) return false;
    installIcon(category);
    guardIcon(category);
    polishCopy(category);
    classifyCounts(category);
    return true;
  }

  if (install()) {
    console.info(`🌹 LUNEA INTIMACY readability V${RELEASE} ready`);
    return;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 160) {
      clearInterval(timer);
      if (tries <= 160) console.info(`🌹 LUNEA INTIMACY readability V${RELEASE} ready`);
    }
  }, 50);
})();