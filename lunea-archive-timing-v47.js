'use strict';

/* LUNEA RUNTIME RECOVERY V48 (kept on the V47 injected filename)
   - preserve full archive copy through V43 unified evidence text
   - survive Render free-tier cold starts for Transit / Returns / Thai / Horary / Natal
   - force the inline Timing Oracle into a non-overlapping mobile layout
*/
(() => {
  const W = window;
  if (W.__LUNEA_ARCHIVE_TIMING_V48__) return;
  W.__LUNEA_ARCHIVE_TIMING_V48__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const ASTRO_RE = /\/v1\/(?:natal|transits\/scan|returns\/context|thai\/taksa(?:\/range)?|horary)(?:\?|$)/i;
  const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function archiveRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function archiveText(row) {
    try {
      if (W.LUNEA_EMERGENCY_REPAIR_V43?.archiveText) {
        return String(W.LUNEA_EMERGENCY_REPAIR_V43.archiveText(row) || '');
      }
    } catch {}
    try { return JSON.stringify(row, null, 2); }
    catch { return String(row || ''); }
  }

  async function copyText(text) {
    const value = String(text || '');
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('clipboard unavailable');
  }

  function titleFromItem(item) {
    const el = item?.querySelector('.archive-title');
    if (!el) return '';
    return norm(Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent || '')
      .join(' '));
  }

  function matchRow(item) {
    const rows = archiveRows().slice().sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    const title = titleFromItem(item);
    const question = norm(item?.querySelector('.archive-q')?.textContent || '');
    return rows.find(row => norm(row?.title) === title && norm(row?.q) === question)
      || rows.find(row => question && norm(row?.q) === question)
      || rows.find(row => title && norm(row?.title) === title)
      || null;
  }

  function validationText(item) {
    const panel = item?.querySelector('.lj-review');
    if (!panel) return '';
    const lines = [];
    const status = norm(panel.querySelector('.lj-statuses .on')?.textContent || '');
    if (status) lines.push(`판정: ${status}`);
    panel.querySelectorAll('.lj-field').forEach(wrap => {
      const label = norm(wrap.querySelector('label')?.textContent || '');
      const field = wrap.querySelector('input,textarea');
      const value = norm(field?.value || '');
      if (label && value) lines.push(`${label}: ${value}`);
    });
    return lines.length ? `[검증]\n${lines.join('\n')}` : '';
  }

  function installArchiveCopyGuard() {
    if (W.__LUNEA_ARCHIVE_COPY_V48__) return;
    W.__LUNEA_ARCHIVE_COPY_V48__ = true;
    document.addEventListener('click', async event => {
      const itemButton = event.target?.closest?.('#archiveOverlay .archive-item .archive-actions button');
      if (itemButton && /복사/.test(norm(itemButton.textContent))) {
        const item = itemButton.closest('.archive-item');
        const row = matchRow(item);
        if (!row) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        try {
          await copyText([archiveText(row), validationText(item)].filter(Boolean).join('\n\n'));
          const old = itemButton.textContent;
          itemButton.textContent = '✓ 전체 근거 복사됨';
          setTimeout(() => { if (itemButton.isConnected) itemButton.textContent = old || '복사'; }, 1100);
        } catch { alert('복사 권한을 확인해줘.'); }
        return;
      }

      const allButton = event.target?.closest?.('#copyAllArchive');
      if (!allButton) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        const text = archiveRows().map(archiveText).filter(Boolean).join('\n\n────────────\n\n');
        if (!text) return alert('복사할 기록이 없어.');
        await copyText(text);
        const old = allButton.textContent;
        allButton.textContent = '✓ 전체 근거 복사됨';
        setTimeout(() => { if (allButton.isConnected) allButton.textContent = old || '전체 복사'; }, 1100);
      } catch { alert('복사 권한을 확인해줘.'); }
    }, true);
  }

  function statusNodeFor(url) {
    if (/transits\/scan/i.test(url)) return document.getElementById('astroTransitStatus');
    if (/returns\/context/i.test(url)) return document.getElementById('astroReturnStatus');
    if (/thai\/taksa/i.test(url)) return document.getElementById('thaiTaksaStatus');
    return null;
  }

  function installColdStartRetry() {
    if (W.__LUNEA_ASTRO_COLDSTART_V48__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_ASTRO_COLDSTART_V48__ = true;
    const prior = W.fetch.bind(W);
    const outerDelays = [0, 3500, 7500, 13000, 19000];

    W.fetch = async function(input, init) {
      const rawUrl = typeof input === 'string' ? input : String(input?.url || '');
      if (!ASTRO_RE.test(rawUrl)) return prior(input, init);

      let lastResponse = null;
      let lastError = null;
      const status = statusNodeFor(rawUrl);

      for (let i = 0; i < outerDelays.length; i += 1) {
        if (outerDelays[i]) await sleep(outerDelays[i]);
        try {
          const response = await prior(input, init);
          lastResponse = response;
          if (!RETRYABLE.has(response.status)) {
            if (status && /엔진 깨우는 중/.test(status.textContent || '')) status.textContent = '';
            return response;
          }
          if (i < outerDelays.length - 1) {
            if (status) status.textContent = '점성술 엔진 깨우는 중… 잠시만 기다려줘.';
            continue;
          }
          return response;
        } catch (error) {
          lastError = error;
          if (String(error?.name || '') === 'AbortError') throw error;
          if (i < outerDelays.length - 1) {
            if (status) status.textContent = '점성술 엔진 연결 중… 잠시만 기다려줘.';
            continue;
          }
        }
      }
      if (lastResponse) return lastResponse;
      throw lastError || new Error('Astro API 요청 실패');
    };
  }

  function installTimingStyle() {
    let style = document.getElementById('luneaArchiveTimingV47Style');
    if (style) style.remove();
    style = document.createElement('style');
    style.id = 'luneaArchiveTimingV47Style';
    style.textContent = `
      html body #spreadOverlay #luneaTimingInline.timing-inline::before,
      html.lunea-reading-polish-v14 body #spreadOverlay #luneaTimingInline.timing-inline::before,
      #luneaTimingInline.timing-inline::before{
        content:none!important;display:none!important;width:0!important;height:0!important;
        min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;
        border:0!important;background:none!important;box-shadow:none!important;
      }
      #luneaTimingInline .lunea-inline-orb,
      #luneaTimingInline .lunea-v7-time-art,
      #luneaTimingInline .lunea-v15-time-art{display:none!important;}
      #luneaTimingInline.timing-inline>img{
        display:block!important;position:static!important;inset:auto!important;float:none!important;
        transform:none!important;width:min(52vw,205px)!important;min-width:170px!important;
        max-width:205px!important;height:auto!important;max-height:none!important;aspect-ratio:auto!important;
        margin:0 auto!important;object-fit:contain!important;object-position:center!important;
        opacity:1!important;visibility:visible!important;border-radius:13px!important;
        border:1px solid rgba(239,226,200,.24)!important;background:transparent!important;
        box-shadow:0 12px 26px rgba(0,0,0,.32)!important;
      }
      #luneaTimingInline.timing-inline>.txt{
        display:block!important;position:static!important;inset:auto!important;transform:none!important;
        width:100%!important;max-width:330px!important;min-width:0!important;margin:0 auto!important;
        padding:0!important;text-align:center!important;z-index:auto!important;
      }
      #luneaTimingInline.timing-inline>.txt small{display:block!important;font-size:9.5px!important;line-height:1.45!important;letter-spacing:1.35px!important;}
      #luneaTimingInline.timing-inline>.txt b{display:block!important;font-size:20px!important;line-height:1.35!important;margin:5px 0 6px!important;}
      #luneaTimingInline.timing-inline>.txt span{display:block!important;font-size:12px!important;line-height:1.62!important;}
    `;
    document.head.appendChild(style);
  }

  function force(el, prop, value) {
    try { el?.style?.setProperty(prop, value, 'important'); } catch {}
  }

  function normalizeTimingInline() {
    const box = document.getElementById('luneaTimingInline');
    if (!box) return false;

    try { W.LUNEA_TIMING_UPLOADED_ART_V16?.upgradeAll?.(); } catch {}
    try { W.LUNEA_EMERGENCY_REPAIR_V43?.syncTimingArt?.(); } catch {}

    installTimingStyle();
    box.querySelectorAll('.lunea-inline-orb,.lunea-v7-time-art,.lunea-v15-time-art').forEach(n => n.remove());

    force(box, 'display', 'flex');
    force(box, 'flex-direction', 'column');
    force(box, 'align-items', 'center');
    force(box, 'justify-content', 'flex-start');
    force(box, 'grid-template-columns', 'none');
    force(box, 'width', '100%');
    force(box, 'max-width', 'none');
    force(box, 'gap', '12px');
    force(box, 'padding', '16px 14px 18px');
    force(box, 'text-align', 'center');
    force(box, 'overflow', 'hidden');

    const img = box.querySelector(':scope > img');
    if (img) {
      force(img, 'display', 'block');
      force(img, 'position', 'static');
      force(img, 'left', 'auto'); force(img, 'right', 'auto'); force(img, 'top', 'auto'); force(img, 'bottom', 'auto');
      force(img, 'transform', 'none'); force(img, 'float', 'none');
      force(img, 'width', 'min(52vw, 205px)');
      force(img, 'min-width', '170px'); force(img, 'max-width', '205px');
      force(img, 'height', 'auto'); force(img, 'max-height', 'none'); force(img, 'aspect-ratio', 'auto');
      force(img, 'margin', '0 auto'); force(img, 'object-fit', 'contain');
    }

    const txt = box.querySelector(':scope > .txt');
    if (txt) {
      force(txt, 'display', 'block'); force(txt, 'position', 'static'); force(txt, 'inset', 'auto');
      force(txt, 'transform', 'none'); force(txt, 'width', '100%'); force(txt, 'max-width', '330px');
      force(txt, 'min-width', '0'); force(txt, 'margin', '0 auto'); force(txt, 'padding', '0');
      force(txt, 'text-align', 'center');
    }
    return true;
  }

  function scheduleTimingRepair() {
    [0, 80, 220, 550, 1100, 2200].forEach(ms => setTimeout(normalizeTimingInline, ms));
  }

  function boot() {
    installArchiveCopyGuard();
    installColdStartRetry();
    installTimingStyle();
    scheduleTimingRepair();

    let queued = false;
    const observer = new MutationObserver(mutations => {
      if (!mutations.some(m => m.target?.id === 'luneaTimingInline' || m.target?.closest?.('#luneaTimingInline') || Array.from(m.addedNodes || []).some(n => n.nodeType === 1 && (n.id === 'luneaTimingInline' || n.querySelector?.('#luneaTimingInline'))))) return;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; normalizeTimingInline(); });
    });
    if (document.body) observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['src','class']});

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')) scheduleTimingRepair();
    }, {passive:true});

    console.info('📚 LUNEA runtime recovery V48 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  W.addEventListener('pageshow', () => setTimeout(() => { installColdStartRetry(); scheduleTimingRepair(); }, 80), {passive:true});
})();
