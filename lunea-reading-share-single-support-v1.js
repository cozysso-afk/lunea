'use strict';

/*
  LUNEA Reading Share Single Support V1
  -------------------------------------
  Enlarges a support page when that page contains only one support item.
  The V3 renderer intentionally uses a 2-column support grid, which leaves a
  lone Message/Timing/extra card visually tiny on a 1080x1350 export.

  This post-layout step keeps the existing renderer/data contract intact and
  only replaces the affected canvas before Share UI V6 flattens it to PNG.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_SHARE_SINGLE_SUPPORT_V1__) return;
  W.__LUNEA_READING_SHARE_SINGLE_SUPPORT_V1__ = true;

  const SOURCE = Object.freeze({x:317, y:245, w:446, h:472});
  const TARGET_W = 800;
  const TARGET_H = Math.round(SOURCE.h * TARGET_W / SOURCE.w);
  const TARGET_X = Math.round((1080 - TARGET_W) / 2);
  const TARGET_Y = 230;

  function isExtra(card) {
    return /추가\s*카드|additional|clarifier|보조\s*카드/i.test(String(card?.position || card?.role || ''));
  }

  function supportCount(payload) {
    const tarot = Array.isArray(payload?.tarot) ? payload.tarot : [];
    const timing = payload?.a?.timing;
    return tarot.filter(isExtra).length
      + (timing?.primary ? 1 : 0)
      + (timing?.refine ? 1 : 0)
      + (payload?.a?.messageOracle ? 1 : 0);
  }

  function supportStart(payload) {
    const tarot = Array.isArray(payload?.tarot) ? payload.tarot : [];
    const main = tarot.filter(card => !isExtra(card));
    const source = main.length ? main : tarot;
    return 1 + Math.ceil(source.length / 6);
  }

  function enlargePage(source) {
    if (!source?.width || !source?.height) return source;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d', {alpha:false});
    if (!ctx) return source;
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = 'high'; } catch {}
    ctx.drawImage(source, 0, 0);
    ctx.drawImage(
      source,
      SOURCE.x, SOURCE.y, SOURCE.w, SOURCE.h,
      TARGET_X, TARGET_Y, TARGET_W, TARGET_H
    );
    return canvas;
  }

  function repair(result) {
    const pages = Array.isArray(result?.pages) ? [...result.pages] : null;
    if (!pages?.length) return result;
    const count = supportCount(result?.payload);
    if (!count) return result;

    const start = supportStart(result.payload);
    const supportPages = Math.ceil(count / 4);
    for (let page = 0; page < supportPages; page += 1) {
      const itemsOnPage = Math.min(4, count - page * 4);
      if (itemsOnPage !== 1) continue;
      const index = start + page;
      if (pages[index]) pages[index] = enlargePage(pages[index]);
    }
    return {...result, pages, singleSupportExpanded:true};
  }

  function install() {
    const base = W.LUNEA_READING_SHARE_POLISH_V3;
    if (!base?.compose) return false;
    if (base.singleSupportExpandedV1) return true;
    const compose = base.compose.bind(base);
    W.LUNEA_READING_SHARE_POLISH_V3 = Object.freeze({
      ...base,
      version:`${base.version || '3.0'}+single-support-v1`,
      singleSupportExpandedV1:true,
      compose:async (...args) => repair(await compose(...args))
    });
    console.info('✨ LUNEA single-support share layout V1 ready');
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 80) clearInterval(timer);
  }, 100);
})();
