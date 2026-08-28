'use strict';

/*
  LUNEA Luminous Layout V2
  Screenshot-driven visual refinement for the live mobile UI.
  Visual / copy-density changes only. No tarot, Horary, astrology,
  spread, draw, archive, or profile behavior is changed.
*/
(() => {
  if (window.__LUNEA_LUMINOUS_LAYOUT_V2__) return;
  window.__LUNEA_LUMINOUS_LAYOUT_V2__ = true;
  document.documentElement.classList.add('lunea-luminous-layout-v2');

  const svg = (body, viewBox='0 0 24 24') => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const ICONS = {
    api: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.55 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.4V9.6h.1A1.7 1.7 0 0 0 4.2 8.55a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.55 4.2a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.4h4v.1A1.7 1.7 0 0 0 15 4.2a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.55a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/>'),
    user: svg('<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>'),
    archive: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>'),
    sparkle: svg('<path d="M12 2.8c.55 4.65 2.55 6.65 7.2 7.2-4.65.55-6.65 2.55-7.2 7.2-.55-4.65-2.55-6.65-7.2-7.2 4.65-.55 6.65-2.55 7.2-7.2Z"/><path d="M19 16.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z"/>'),
    career: svg('<path d="M4 20h16"/><path d="M6 17V9h12v8"/><path d="M8 17v-6M12 17v-6M16 17v-6"/><path d="M4 9h16L12 4 4 9Z"/>'),
    love: svg('<path d="M20.4 4.6a5.2 5.2 0 0 0-7.4 0L12 5.7l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 20.5l8.4-8.5a5.2 5.2 0 0 0 0-7.4Z"/>'),
    stock: svg('<path d="M4 18V6"/><path d="M4 18h16"/><path d="m7 15 4-5 3 3 5-7"/><path d="M16 6h3v3"/>'),
    timing: svg('<path d="M7 3h10M7 21h10"/><path d="M8 3c0 4 1 6 4 9-3 3-4 5-4 9M16 3c0 4-1 6-4 9 3 3 4 5 4 9"/><path d="M9 18h6"/>'),
    moon: svg('<path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8a8.5 8.5 0 1 0 11.5 11.5Z"/><path d="M16.5 4.2v2.6M15.2 5.5h2.6"/>'),
    orbit: svg('<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9" ry="4.4"/><ellipse cx="12" cy="12" rx="4.4" ry="9" transform="rotate(45 12 12)"/>')
  };

  const style = document.createElement('style');
  style.id = 'luneaLuminousLayoutV2Style';
  style.textContent = `
    html.lunea-luminous-layout-v2 .app{
      padding-top:14px!important;
    }

    /* Brand: cleaner, calmer, more editorial */
    html.lunea-luminous-layout-v2 header{
      min-height:58px;
      margin:0 0 16px!important;
      padding:0 1px!important;
      align-items:center!important;
    }
    html.lunea-luminous-layout-v2 .brand{gap:11px!important;min-width:0}
    html.lunea-luminous-layout-v2 .moon-logo{
      width:44px!important;height:44px!important;
      flex:0 0 44px!important;
      font-size:0!important;
      color:#f5f2ff!important;
      display:grid!important;place-items:center!important;
      overflow:hidden;
      background:
        radial-gradient(circle at 32% 25%,rgba(255,255,255,.82),transparent 19%),
        radial-gradient(circle at 55% 62%,rgba(196,180,255,.23),transparent 45%),
        linear-gradient(145deg,rgba(227,226,248,.22),rgba(111,91,177,.38))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.38),
        inset 0 0 22px rgba(199,184,255,.16),
        0 0 0 1px rgba(207,210,231,.13),
        0 0 26px rgba(145,120,218,.20)!important;
    }
    html.lunea-luminous-layout-v2 .moon-logo svg{width:25px;height:25px;filter:drop-shadow(0 0 7px rgba(214,204,255,.35))}
    html.lunea-luminous-layout-v2 .brand h1{
      font-size:21px!important;line-height:1!important;letter-spacing:3.4px!important;
      margin-bottom:5px!important;
    }
    html.lunea-luminous-layout-v2 .brand p{
      font-size:7.8px!important;letter-spacing:1.75px!important;color:#8f91a7!important;
    }

    html.lunea-luminous-layout-v2 .head-actions{gap:6px!important;align-items:center}
    html.lunea-luminous-layout-v2 .head-actions .icon-btn{
      width:38px;height:38px;padding:0!important;border-radius:13px!important;
      display:grid;place-items:center;font-size:0!important;
      color:#d9dbe7!important;
      background:linear-gradient(145deg,rgba(25,28,49,.74),rgba(11,13,27,.70))!important;
      border-color:rgba(213,217,236,.14)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 8px 20px rgba(0,0,0,.15)!important;
    }
    html.lunea-luminous-layout-v2 .head-actions .icon-btn svg{width:17px;height:17px}
    html.lunea-luminous-layout-v2 #apiBtn::after{
      content:'API';font:700 7px/1 'Pretendard',sans-serif;position:absolute;transform:translateY(14px);color:#7e8297;letter-spacing:.35px;
    }
    html.lunea-luminous-layout-v2 #apiBtn{position:relative}

    /* Profile strip: secondary metadata, not a hero block */
    html.lunea-luminous-layout-v2 .profile-strip{
      min-height:48px!important;margin:0 0 10px!important;padding:8px 11px!important;
      border-radius:17px!important;
      background:linear-gradient(145deg,rgba(24,26,47,.60),rgba(12,14,27,.63))!important;
      border-color:rgba(212,216,234,.12)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
    }
    html.lunea-luminous-layout-v2 .profile-tags{gap:6px!important}
    html.lunea-luminous-layout-v2 .tag{
      padding:4px 8px!important;border-radius:999px!important;font-size:9.6px!important;
      background:rgba(208,209,229,.055)!important;border-color:rgba(218,220,236,.09)!important;
      color:#c5c5d2!important;
    }
    html.lunea-luminous-layout-v2 .profile-strip>b{
      font-size:9.5px!important;color:#aaa2c8!important;font-weight:650!important;
    }

    /* Engine strip becomes a quiet trust badge */
    html.lunea-luminous-layout-v2 .engine-strip{
      min-height:34px!important;margin:0 0 11px!important;padding:7px 10px!important;border-radius:14px!important;
      color:#9fa6b8!important;font-size:8.9px!important;line-height:1.25!important;
      background:rgba(9,12,23,.48)!important;border-color:rgba(164,207,195,.11)!important;
      box-shadow:none!important;
    }
    html.lunea-luminous-layout-v2 .engine-strip b{color:#c9d5d1!important;font-weight:650!important}
    html.lunea-luminous-layout-v2 .engine-dot{width:6px!important;height:6px!important}

    /* LAST READING: compact utility strip */
    html.lunea-luminous-layout-v2 #luneaReadingDraftResume{
      margin:0 0 12px!important;padding:9px 10px!important;min-height:52px!important;border-radius:16px!important;
      border-color:rgba(196,205,221,.12)!important;
      background:linear-gradient(145deg,rgba(18,24,38,.64),rgba(12,14,27,.68))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
    }
    html.lunea-luminous-layout-v2 .lrd-kicker{font-size:7.8px!important;color:#94cdbd!important;letter-spacing:1.05px!important}
    html.lunea-luminous-layout-v2 .lrd-title{font-size:10.4px!important;color:#dedee8!important;margin-top:3px!important}
    html.lunea-luminous-layout-v2 .lrd-q{font-size:8.8px!important;color:#85879b!important}
    html.lunea-luminous-layout-v2 .lrd-actions button{padding:6px 8px!important;border-radius:10px!important}

    /* Daily is the actual hero */
    html.lunea-luminous-layout-v2 .daily{
      min-height:118px!important;margin:0 0 31px!important;padding:19px 18px!important;border-radius:28px!important;
      background:
        radial-gradient(circle at 86% 18%,rgba(192,170,255,.28),transparent 31%),
        radial-gradient(circle at 72% 92%,rgba(108,161,216,.15),transparent 36%),
        radial-gradient(circle at 10% 10%,rgba(234,231,255,.08),transparent 28%),
        linear-gradient(135deg,rgba(41,34,77,.80),rgba(13,15,32,.91) 64%,rgba(9,12,25,.96))!important;
      border-color:rgba(225,227,241,.23)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.11),
        0 21px 46px rgba(0,0,0,.28),
        0 0 34px rgba(135,105,207,.07)!important;
    }
    html.lunea-luminous-layout-v2 .daily::before{
      width:210px!important;height:210px!important;right:-75px!important;top:-105px!important;
      background:
        radial-gradient(circle at 42% 42%,rgba(242,241,255,.20),transparent 14%),
        radial-gradient(circle,rgba(159,139,225,.16),rgba(102,133,186,.05) 48%,transparent 70%)!important;
    }
    html.lunea-luminous-layout-v2 .daily::after{right:24px!important;top:19px!important;font-size:12px!important}
    html.lunea-luminous-layout-v2 .daily h3{
      font:500 18px/1.2 'Cinzel','Noto Serif KR',serif!important;letter-spacing:1px!important;margin-bottom:8px!important;
    }
    html.lunea-luminous-layout-v2 .daily p{font-size:10.5px!important;line-height:1.65!important;color:#9d9db0!important}
    html.lunea-luminous-layout-v2 .daily .primary{
      flex:0 0 auto;min-width:95px!important;padding:11px 13px!important;border-radius:15px!important;
      font-size:11.5px!important;
      background:linear-gradient(115deg,rgba(175,147,239,.95),rgba(117,112,203,.95) 55%,rgba(93,139,187,.92))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.30),0 9px 24px rgba(89,72,161,.27),0 0 18px rgba(171,151,235,.12)!important;
    }

    /* Reading title block gets more breathing room */
    html.lunea-luminous-layout-v2 .eyebrow{
      margin:0 0 7px!important;font-size:9px!important;letter-spacing:2.7px!important;color:#aaa0c7!important;
    }
    html.lunea-luminous-layout-v2 .section-title{
      margin:0 0 20px!important;font-size:19px!important;font-weight:500!important;letter-spacing:-.15px!important;
    }

    /* Categories: less boxed, more premium */
    html.lunea-luminous-layout-v2 .category{
      margin-bottom:14px!important;border-radius:25px!important;
      border-color:rgba(213,217,234,.14)!important;
      background:
        radial-gradient(circle at 8% 20%,rgba(162,139,223,.06),transparent 25%),
        linear-gradient(145deg,rgba(19,22,41,.74),rgba(9,11,24,.78))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 14px 30px rgba(0,0,0,.12)!important;
    }
    html.lunea-luminous-layout-v2 .category-header{
      min-height:76px!important;padding:16px 17px!important;
    }
    html.lunea-luminous-layout-v2 .cat-left{gap:14px!important;min-width:0}
    html.lunea-luminous-layout-v2 .cat-icon{
      width:43px!important;height:43px!important;flex:0 0 43px!important;border-radius:50%!important;
      color:#dcdbea!important;font-size:0!important;
      background:
        radial-gradient(circle at 30% 24%,rgba(255,255,255,.12),transparent 24%),
        linear-gradient(145deg,rgba(151,130,208,.18),rgba(83,113,160,.08))!important;
      border-color:rgba(218,219,235,.15)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 20px rgba(145,119,207,.07)!important;
    }
    html.lunea-luminous-layout-v2 .cat-icon svg{width:21px;height:21px}
    html.lunea-luminous-layout-v2 .cat-text{min-width:0}
    html.lunea-luminous-layout-v2 .cat-text h3{
      font-size:14.5px!important;line-height:1.2!important;letter-spacing:.95px!important;font-weight:650!important;
    }
    html.lunea-luminous-layout-v2 .cat-text p{
      margin-top:5px!important;font-size:9.9px!important;line-height:1.35!important;color:#8e90a3!important;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:265px;
    }
    html.lunea-luminous-layout-v2 .toggle{
      width:28px;height:28px;display:grid;place-items:center;font-size:18px!important;font-weight:300!important;color:#85889c!important;
    }
    html.lunea-luminous-layout-v2 .category.active{
      border-color:rgba(198,187,229,.25)!important;
      background:linear-gradient(145deg,rgba(26,27,50,.82),rgba(10,12,25,.84))!important;
    }

    /* Details inside opened categories */
    html.lunea-luminous-layout-v2 .category-content{padding:0 17px 9px!important}
    html.lunea-luminous-layout-v2 .reading-item{padding:13px 1px!important}
    html.lunea-luminous-layout-v2 .reading-item h4{font-size:12.3px!important;font-weight:600!important}
    html.lunea-luminous-layout-v2 .reading-item p{font-size:9.6px!important}

    @media(max-width:390px){
      html.lunea-luminous-layout-v2 .moon-logo{width:42px!important;height:42px!important;flex-basis:42px!important}
      html.lunea-luminous-layout-v2 .brand h1{font-size:19px!important;letter-spacing:2.9px!important}
      html.lunea-luminous-layout-v2 .brand p{font-size:7px!important;letter-spacing:1.45px!important}
      html.lunea-luminous-layout-v2 .head-actions{gap:4px!important}
      html.lunea-luminous-layout-v2 .head-actions .icon-btn{width:35px;height:35px;border-radius:12px!important}
      html.lunea-luminous-layout-v2 .daily{min-height:112px!important;padding:17px 15px!important}
      html.lunea-luminous-layout-v2 .daily h3{font-size:16.8px!important}
      html.lunea-luminous-layout-v2 .daily .primary{min-width:89px!important;padding:10px 11px!important;font-size:10.8px!important}
      html.lunea-luminous-layout-v2 .category-header{min-height:72px!important;padding:15px!important}
      html.lunea-luminous-layout-v2 .cat-icon{width:40px!important;height:40px!important;flex-basis:40px!important}
      html.lunea-luminous-layout-v2 .cat-text h3{font-size:13.5px!important}
      html.lunea-luminous-layout-v2 .cat-text p{max-width:230px;font-size:9.4px!important}
    }
  `;
  document.head.appendChild(style);

  function cleanVisualChrome() {
    const logo = document.querySelector('.moon-logo');
    if (logo) {
      logo.innerHTML = ICONS.moon;
      logo.setAttribute('aria-hidden', 'true');
    }

    const brandSub = document.querySelector('.brand p');
    if (brandSub) brandSub.textContent = 'TAROT · HORARY · ASTROLOGY';

    const apiBtn = document.getElementById('apiBtn');
    const profileBtn = document.getElementById('profileBtn');
    const archiveBtn = document.getElementById('archiveBtn');
    if (apiBtn) { apiBtn.innerHTML = ICONS.api; apiBtn.title = 'API 설정'; apiBtn.setAttribute('aria-label','API 설정'); }
    if (profileBtn) { profileBtn.innerHTML = ICONS.user; profileBtn.title = '프로필'; profileBtn.setAttribute('aria-label','프로필'); }
    if (archiveBtn) { archiveBtn.innerHTML = ICONS.archive; archiveBtn.title = '리딩 기록'; archiveBtn.setAttribute('aria-label','리딩 기록'); }

    const engine = document.querySelector('.engine-strip');
    if (engine && !engine.dataset.luminousV2) {
      const full = engine.textContent.trim();
      engine.title = full;
      engine.dataset.luminousV2 = '1';
      engine.innerHTML = '<span class="engine-dot"></span><span><b>Secure Engine</b> · Spread V7.4 · Structural V4 · Manual Spread</span>';
    }

    document.querySelectorAll('.category').forEach(category => {
      const title = category.querySelector('.cat-text h3')?.textContent?.toUpperCase() || '';
      const icon = category.querySelector('.cat-icon');
      if (!icon) return;
      let markup = ICONS.sparkle;
      if (/CAREER|EXAM/.test(title)) markup = ICONS.career;
      else if (/LOVE|INNER HEART|RELATION/.test(title)) markup = ICONS.love;
      else if (/STOCK|TRADING/.test(title)) markup = ICONS.stock;
      else if (/TIMING/.test(title)) markup = ICONS.timing;
      else if (/HORARY/.test(title)) markup = ICONS.orbit;
      else if (/ASTRO|NATAL|TRANSIT|RETURN/.test(title)) markup = ICONS.moon;
      icon.innerHTML = markup;
      icon.setAttribute('aria-hidden','true');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanVisualChrome, {once:true});
  } else {
    cleanVisualChrome();
  }

  /* Some feature modules append UI after DOMContentLoaded. Re-apply only to new category icons. */
  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.category .cat-icon').forEach(icon => {
        if (icon.querySelector('svg')) return;
        const category = icon.closest('.category');
        const title = category?.querySelector('.cat-text h3')?.textContent?.toUpperCase() || '';
        let markup = ICONS.sparkle;
        if (/CAREER|EXAM/.test(title)) markup = ICONS.career;
        else if (/LOVE|INNER HEART|RELATION/.test(title)) markup = ICONS.love;
        else if (/STOCK|TRADING/.test(title)) markup = ICONS.stock;
        else if (/TIMING/.test(title)) markup = ICONS.timing;
        else if (/HORARY/.test(title)) markup = ICONS.orbit;
        else if (/ASTRO|NATAL|TRANSIT|RETURN/.test(title)) markup = ICONS.moon;
        icon.innerHTML = markup;
      });
    });
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});

  console.info('✦ LUNEA Luminous Layout V2 active');
})();
