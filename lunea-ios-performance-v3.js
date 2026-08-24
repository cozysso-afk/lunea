'use strict';

/*
  LUNEA iOS Performance V3 — consolidated interaction recovery V305
  ---------------------------------------------------------------
  Fixes the current known iPhone/PWA "tap does nothing" classes in one pass:
  - card flip repaint delay
  - profile second-open failure
  - archive pre-render stall
  - stale overlay/body pointer lock
  - API/Gemini requests that can leave buttons waiting indefinitely

  Preserves:
  - original 3D rotateY flip
  - RNG / card draw
  - spread routing
  - Timing / Natal / Transit / Return calculations
  - archive / prompts
*/
(() => {
  if (window.__LUNEA_IOS_PERFORMANCE_V3__) return;
  window.__LUNEA_IOS_PERFORMANCE_V3__ = true;

  const W = window;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  const isiOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isiOS) {
    console.info('✦ LUNEA iOS Performance V3 skipped (non-iOS)');
    return;
  }

  document.documentElement.classList.add('lunea-ios-performance-v3');

  const style = document.createElement('style');
  style.id = 'luneaIOSPerformanceV3Style';
  style.textContent = `
    html.lunea-ios-performance-v3 body{
      background-attachment:scroll!important;
    }

    /*
      One overlay rule for the whole app.
      This prevents stale inline pointer state from making Profile / Archive /
      API / Timing / Transit / Return / Thai look open but untouchable.
    */
    html.lunea-ios-performance-v3 .overlay{
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
    }
    html.lunea-ios-performance-v3 .overlay.show{
      pointer-events:auto!important;
    }
    html.lunea-ios-performance-v3 .overlay:not(.show){
      pointer-events:none!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay{
      background:rgba(5,3,10,.96)!important;
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .cards{
      perspective:1000px!important;
      -webkit-perspective:1000px!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card{
      transform-style:preserve-3d!important;
      -webkit-transform-style:preserve-3d!important;
      -webkit-backface-visibility:hidden!important;
      backface-visibility:hidden!important;
      transition:transform .68s cubic-bezier(.3,.8,.2,1)!important;
      will-change:transform;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .back,
    html.lunea-ios-performance-v3 #spreadOverlay .front{
      -webkit-backface-visibility:hidden!important;
      backface-visibility:hidden!important;
    }

    /* Critical: nested 3D must not sit inside paint containment on iOS. */
    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
      contain:none!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .front img,
    html.lunea-ios-performance-v3 #spreadOverlay .back img{
      image-rendering:auto;
      -webkit-user-drag:none;
    }

    /* Keep profile hit targets explicit, but do not alter its scroll/compositor layout. */
    html.lunea-ios-performance-v3 #profileBtn,
    html.lunea-ios-performance-v3 #profileStrip,
    html.lunea-ios-performance-v3 #profileOverlay button{
      touch-action:manipulation!important;
    }

    @media (prefers-reduced-motion:reduce){
      html.lunea-ios-performance-v3 #spreadOverlay .tarot-card{
        transition-duration:.01ms!important;
      }
      html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
        animation-duration:.01ms!important;
      }
    }
  `;
  document.head.appendChild(style);

  function thumbURL(url, width = 360) {
    const raw = String(url || '');
    if (!raw) return raw;

    if (
      /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:(?:FilePath|Redirect\/file)\//i.test(raw)
    ) {
      try {
        const u = new URL(raw);
        u.searchParams.set('width', String(width));
        return u.toString();
      } catch {
        return raw + (raw.includes('?') ? '&' : '?') + 'width=' + width;
      }
    }
    return raw;
  }

  function tuneImg(img) {
    if (!img) return;
    try {
      img.decoding = 'async';
      img.draggable = false;
      img.loading = 'eager';
      if ('fetchPriority' in img) img.fetchPriority = 'low';
    } catch {}
  }

  /*
    Keep the original flipAt(). Only replace card construction so iPhone
    decodes smaller Wikimedia images.
  */
  const oldMakeCardWrapper = W.makeCardWrapper;
  if (typeof oldMakeCardWrapper === 'function') {
    W.makeCardWrapper = function(i, card, isReversed) {
      const wrapper = document.createElement('div');
      wrapper.className = 'tarot-card-wrapper';
      wrapper.dataset.index = String(i);
      wrapper.style.animationDelay = (i * 0.07) + 's';

      let prefix = 'back_general';
      try {
        if (typeof W.deckBackPrefix === 'function') prefix = W.deckBackPrefix();
      } catch {}

      const tarot = document.createElement('div');
      tarot.className = 'tarot-card' + (isReversed ? ' reversed' : '');
      tarot.id = 'card-' + i;

      const back = document.createElement('div');
      back.className = 'back';

      const backImg = document.createElement('img');
      backImg.src = prefix + '.PNG';
      backImg.alt = '';
      tuneImg(backImg);
      backImg.addEventListener('error', () => {
        backImg.style.display = 'none';
      }, {once:true});
      back.appendChild(backImg);

      const front = document.createElement('div');
      front.className = 'front';

      const frontImg = document.createElement('img');
      frontImg.src = thumbURL(card?.img, 360);
      frontImg.alt = String(card?.name || '');
      tuneImg(frontImg);
      frontImg.addEventListener('error', () => {
        frontImg.style.opacity = '.15';
      }, {once:true});
      front.appendChild(frontImg);

      tarot.appendChild(back);
      tarot.appendChild(front);
      wrapper.appendChild(tarot);
      return wrapper;
    };

    console.info('✦ LUNEA iOS Performance V3 patched makeCardWrapper');
  }

  /*
    Generic stale-lock repair.
    The base app's hideOverlay removes modal-open, but iOS resume/re-entry can
    leave inline pointer state or a body lock out of sync with .show.
  */
  function repairOverlayState() {
    const overlays = [...document.querySelectorAll('.overlay')];
    let anyShown = false;

    overlays.forEach(overlay => {
      const shown = overlay.classList.contains('show');
      anyShown ||= shown;

      overlay.setAttribute('aria-hidden', shown ? 'false' : 'true');

      /*
        Critical V305 change:
        never leave pointer-events as an inline value.
        The app's .overlay / .overlay.show CSS remains the single source of truth.
      */
      overlay.style.removeProperty('pointer-events');
    });

    if (anyShown) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('touch-action');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
    }
  }

  /*
    IMPORTANT re-entry fix:
    Main index originally does:
      loadProfileForm(); showOverlay('profileOverlay')
    If any profile wrapper throws on a later open, showOverlay is never reached.
    On iOS we reverse that order: make the modal interactive first, then refresh
    its form inside try/catch. A profile refresh error can no longer freeze
    access to the modal.
  */
  let openingProfile = false;

  function openProfileSafely() {
    if (openingProfile) return;
    openingProfile = true;

    const overlay = document.getElementById('profileOverlay');
    if (!overlay) {
      openingProfile = false;
      return;
    }

    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const modal = overlay.querySelector('.modal');
    if (modal) modal.scrollTop = 0;

    requestAnimationFrame(() => {
      try {
        if (typeof W.loadProfileForm === 'function') W.loadProfileForm();
      } catch (err) {
        console.error('[LUNEA Profile re-entry] loadProfileForm failed but modal kept open', err);
      } finally {
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        openingProfile = false;
      }
    });
  }

  const profileBtn = document.getElementById('profileBtn');
  const profileStrip = document.getElementById('profileStrip');

  if (profileBtn) profileBtn.onclick = openProfileSafely;
  if (profileStrip) profileStrip.onclick = openProfileSafely;

  /*
    After the existing close handler runs, normalize body/overlay locks.
    We don't replace the close handler.
  */
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('[data-close="profile"]')) return;
    requestAnimationFrame(repairOverlayState);
  }, {passive:true});

  /*
    If the user taps the dimmed profile backdrop to close, base index closes
    it on pointerup. Normalize locks one frame later.
  */
  const profileOverlay = document.getElementById('profileOverlay');
  profileOverlay?.addEventListener('pointerup', event => {
    if (event.target !== profileOverlay) return;
    requestAnimationFrame(repairOverlayState);
  }, {passive:true});


  /*
    ARCHIVE recovery:
    Base index calls renderArchive() before showOverlay('archiveOverlay').
    With many saved readings, building every full detail text synchronously can
    block iOS long enough that the tap looks dead. Open first, then render rows
    in small frame batches. Detail text is created lazily only when expanded.
  */
  let archiveRenderEpoch = 0;

  function readArchive() {
    try {
      const raw = JSON.parse(localStorage.getItem('LUNEA_ARCHIVE_V3') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function writeArchive(rows) {
    try {
      localStorage.setItem('LUNEA_ARCHIVE_V3', JSON.stringify((rows || []).slice(0, 100)));
    } catch (err) {
      console.error('[LUNEA Archive] save failed', err);
    }
  }

  function archiveTextLocal(item) {
    const cards = (item?.cards || []).map(c =>
      c?.text ||
      `${c?.position || ''}: ${c?.name || ''} (${c?.isReversed ? '역' : '정'})` +
      (c?.subCards?.length ? ' / 보조 ' + c.subCards.map(s => s?.name || '').join(', ') : '')
    ).join('\n');

    return `${item?.date || ''}\n${item?.title || ''}\n${item?.q || ''}\n\n${cards}` +
      (item?.ai ? `\n\n[AI 해석]\n${item.ai}` : '');
  }

  function makeArchiveRow(item) {
    const el = document.createElement('div');
    el.className = 'archive-item';

    const meta = document.createElement('div');
    meta.className = 'archive-meta';
    meta.textContent = item?.date || (item?.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '');

    const title = document.createElement('div');
    title.className = 'archive-title';
    title.textContent = item?.title || '';

    const q = document.createElement('div');
    q.className = 'archive-q';
    q.textContent = item?.q || '';

    const actions = document.createElement('div');
    actions.className = 'archive-actions';

    const detailBtn = document.createElement('button');
    detailBtn.className = 'mini';
    detailBtn.type = 'button';
    detailBtn.textContent = '카드/해석 펼치기';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'mini';
    copyBtn.type = 'button';
    copyBtn.textContent = '복사';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'mini danger';
    deleteBtn.type = 'button';
    deleteBtn.textContent = '삭제';

    actions.append(detailBtn, copyBtn, deleteBtn);

    const detail = document.createElement('div');
    detail.className = 'archive-detail';

    detailBtn.addEventListener('click', () => {
      const opening = !detail.classList.contains('open');
      if (opening && !detail.dataset.loaded) {
        detail.textContent = archiveTextLocal(item);
        detail.dataset.loaded = '1';
      }
      detail.classList.toggle('open', opening);
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(archiveTextLocal(item));
        alert('복사했어.');
      } catch {
        alert('복사 권한을 확인해줘.');
      }
    });

    deleteBtn.addEventListener('click', () => {
      if (!confirm('이 기록을 삭제할까?')) return;
      const next = readArchive().filter(x => x?.id !== item?.id);
      writeArchive(next);
      renderArchiveSafely();
    });

    el.append(meta, title, q, actions, detail);
    return el;
  }

  function renderArchiveSafely() {
    const list = document.getElementById('archiveList');
    const count = document.getElementById('archiveCount');
    const search = document.getElementById('archiveSearch');
    if (!list || !count) return;

    const epoch = ++archiveRenderEpoch;
    const all = readArchive();
    const query = String(search?.value || '').trim().toLowerCase();

    const rows = all.filter(item => {
      if (!query) return true;
      return [item?.title, item?.q, item?.ai]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    count.textContent = `${all.length}개`;
    list.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = '저장된 리딩이 없거나 검색 결과가 없어.';
      list.appendChild(empty);
      return;
    }

    let index = 0;
    const CHUNK = 6;

    function appendChunk() {
      if (epoch !== archiveRenderEpoch) return;

      const frag = document.createDocumentFragment();
      const end = Math.min(index + CHUNK, rows.length);

      for (; index < end; index += 1) {
        frag.appendChild(makeArchiveRow(rows[index]));
      }
      list.appendChild(frag);

      if (index < rows.length) requestAnimationFrame(appendChunk);
    }

    requestAnimationFrame(appendChunk);
  }

  function openArchiveSafely() {
    repairOverlayState();

    const overlay = document.getElementById('archiveOverlay');
    if (!overlay) return;

    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const modal = overlay.querySelector('.modal');
    if (modal) modal.scrollTop = 0;

    requestAnimationFrame(renderArchiveSafely);
  }

  const archiveBtn = document.getElementById('archiveBtn');
  if (archiveBtn) archiveBtn.onclick = openArchiveSafely;

  const archiveSearch = document.getElementById('archiveSearch');
  if (archiveSearch) {
    let archiveSearchFrame = 0;
    archiveSearch.oninput = () => {
      cancelAnimationFrame(archiveSearchFrame);
      archiveSearchFrame = requestAnimationFrame(renderArchiveSafely);
    };
  }

  const clearArchive = document.getElementById('clearArchive');
  if (clearArchive) {
    clearArchive.onclick = () => {
      if (!confirm('기록함 전체를 비울까? 되돌릴 수 없어.')) return;
      writeArchive([]);
      renderArchiveSafely();
    };
  }

  const copyAllArchive = document.getElementById('copyAllArchive');
  if (copyAllArchive) {
    copyAllArchive.onclick = async () => {
      const rows = readArchive();
      if (!rows.length) return alert('기록이 없어.');
      try {
        await navigator.clipboard.writeText(rows.map(archiveTextLocal).join('\n\n────────────\n\n'));
        alert('전체 기록 복사 완료');
      } catch {
        alert('복사 권한을 확인해줘.');
      }
    };
  }


  /*
    Remote request watchdog.
    Every current async calculation already uses try/catch/finally. The missing
    piece was a bounded wait. If a provider hangs, this wrapper rejects so the
    existing finally block can re-enable the button instead of looking frozen.

    It does NOT change request bodies/results and does NOT wrap unrelated fetches.
  */
  function installRequestWatchdog() {
    if (W.__LUNEA_REQUEST_WATCHDOG_V305__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_REQUEST_WATCHDOG_V305__ = true;

    const previousFetch = W.fetch.bind(W);

    W.fetch = function(input, init) {
      let url = '';
      try {
        url = typeof input === 'string' ? input : String(input?.url || '');
      } catch {}

      const isGemini = /generativelanguage\.googleapis\.com/i.test(url);
      const isAstro = /\/v1\/(?:natal|transits\/scan|returns\/context|thai\/taksa)(?:$|\?)/i.test(url);

      if (!isGemini && !isAstro) return previousFetch(input, init);

      const timeoutMs = isGemini ? 40000 : 60000;

      return new Promise((resolve, reject) => {
        let settled = false;

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error(
            isGemini
              ? 'AI 요청 시간이 너무 길어 중단했어. 다시 눌러줘.'
              : '점성술 계산 서버 응답 시간이 너무 길어 중단했어. 다시 눌러줘.'
          ));
        }, timeoutMs);

        Promise.resolve()
          .then(() => previousFetch(input, init))
          .then(
            value => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              resolve(value);
            },
            error => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              reject(error);
            }
          );
      });
    };
  }


  /*
    Last-resort UI recovery. We do not swallow errors; we only repair stale
    modal locks one frame later so one module error cannot leave the whole app
    untouchable.
  */
  window.addEventListener('error', () => {
    requestAnimationFrame(repairOverlayState);
  });

  window.addEventListener('unhandledrejection', () => {
    requestAnimationFrame(repairOverlayState);
  });

  window.addEventListener('pageshow', () => {
    document.querySelectorAll('#cards .tarot-card img').forEach(tuneImg);
    repairOverlayState();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestAnimationFrame(repairOverlayState);
  });

  installRequestWatchdog();
  repairOverlayState();
  console.info('✦ LUNEA iOS Performance V3 loaded · consolidated V305 active');
})();
