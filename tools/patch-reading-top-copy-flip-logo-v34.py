from pathlib import Path

# 1) Universal reading action order + top prompt-copy shortcut.
p=Path('lunea-reading-action-order-v33.js')
s=p.read_text()
s=s.replace('LUNEA READING ACTION ORDER V33.3','LUNEA READING ACTION ORDER V33.4',1)
s=s.replace("  1) AI 해석 · 저장 · 다시 뽑기\n  2) 전체 뒤집기 · 추가 카드 · 시기 오라클", "  1) 전체 뒤집기 · AI 해석 · 저장\n  2) 다시 뽑기 · 추가 카드 · 시기 오라클",1)
s=s.replace("  Also adds small AI 해석 / 저장 shortcuts directly below the prompt-copy\n  control for long spreads.", "  Also mirrors the master prompt-copy control above the action grid for every\n  sector/spread/question, while keeping the existing bottom copy control.\n\n  Small AI 해석 / 저장 shortcuts remain directly below the bottom prompt-copy\n  control for long spreads.",1)
s=s.replace("  V33.3 loads the isolated INTIMACY V43 repair layer after the existing clean\n  and burgundy layers. It does not change RNG, AI interpretation, or storage.", "  V33.3 loads the isolated INTIMACY V43 repair layer after the existing clean\n  and burgundy layers. V33.4 only changes reading-control placement; it does\n  not change RNG, AI interpretation, prompt generation, or storage.",1)
old_order="""  const ORDER = [
    'aiRead',
    'saveReading',
    'retry',
    'flipAll',
    'extraCard',
"""
new_order="""  const ORDER = [
    'flipAll',
    'aiRead',
    'saveReading',
    'retry',
    'extraCard',
"""
if old_order not in s: raise SystemExit('ORDER block not found')
s=s.replace(old_order,new_order,1)
needle="""  const BOTTOM_ID = 'luneaBottomReadingActions';
  const BOTTOM_AI_ID = 'luneaBottomAiRead';
  const BOTTOM_SAVE_ID = 'luneaBottomSaveReading';
  const BOTTOM_STYLE_ID = 'luneaBottomReadingActionsStyle';
"""
replacement="""  const TOP_COPYBOX_ID = 'luneaTopPromptCopyBox';
  const TOP_COPY_ID = 'luneaTopCopyPrompt';
  const BOTTOM_ID = 'luneaBottomReadingActions';
  const BOTTOM_AI_ID = 'luneaBottomAiRead';
  const BOTTOM_SAVE_ID = 'luneaBottomSaveReading';
  const BOTTOM_STYLE_ID = 'luneaBottomReadingActionsStyle';
"""
if needle not in s: raise SystemExit('constants block not found')
s=s.replace(needle,replacement,1)
style_needle="""    style.textContent = `
      #${BOTTOM_ID}{
"""
style_replacement="""    style.textContent = `
      #${TOP_COPYBOX_ID}{
        margin:10px 0 9px!important;padding:0!important;
      }
      #${TOP_COPY_ID}{
        width:100%!important;min-height:43px!important;margin:0!important;padding:10px 12px!important;
        border-radius:13px!important;border:1px solid rgba(215,218,233,.13)!important;
        background:linear-gradient(145deg,rgba(167,145,217,.10),rgba(91,125,168,.06))!important;
        color:#e9e3ef!important;font:650 11.5px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
        -webkit-tap-highlight-color:transparent;
      }
      #${TOP_COPY_ID}:active{transform:translateY(1px);opacity:.84}
      #${TOP_COPY_ID}:disabled{opacity:.42;pointer-events:none}
      body.lunea-intimacy-reading #${TOP_COPY_ID}{
        color:#f8edf2!important;border-color:rgba(225,132,168,.22)!important;
        background:linear-gradient(145deg,rgba(112,34,69,.16),rgba(67,22,55,.09))!important;
      }

      #${BOTTOM_ID}{
"""
if style_needle not in s: raise SystemExit('style block not found')
s=s.replace(style_needle,style_replacement,1)
insert_before="""  function clickSource(id) {
"""
helper="""  function syncTopPromptCopy() {
    const top = document.getElementById(TOP_COPY_ID);
    const source = document.getElementById('copyPrompt');
    if (top) top.disabled = !source || !!source.disabled;
  }

  function ensureTopPromptCopy() {
    ensureBottomStyle();
    const source = document.getElementById('copyPrompt');
    const bar = actionBar();
    if (!source || !bar || !bar.parentNode) return false;

    let box = document.getElementById(TOP_COPYBOX_ID);
    let top = document.getElementById(TOP_COPY_ID);
    if (!box || !top) {
      box = document.createElement('div');
      box.id = TOP_COPYBOX_ID;
      box.className = 'copybox lunea-top-prompt-copybox';
      box.setAttribute('aria-label', '상단 마스터 리딩 프롬프트 복사');

      top = document.createElement('button');
      top.id = TOP_COPY_ID;
      top.type = 'button';
      top.className = 'primary full-btn';
      top.textContent = '📋 마스터 리딩 프롬프트 복사';
      top.title = '아래 프롬프트 복사와 같은 내용';
      top.addEventListener('click', () => {
        const live = document.getElementById('copyPrompt');
        if (!live || live.disabled) return;
        live.click();
      });
      box.appendChild(top);
    }

    if (box.parentNode !== bar.parentNode || box.nextElementSibling !== bar) {
      bar.parentNode.insertBefore(box, bar);
    }
    syncTopPromptCopy();
    return true;
  }

"""
if insert_before not in s: raise SystemExit('clickSource anchor not found')
s=s.replace(insert_before,helper+insert_before,1)
s=s.replace("    reorder();\n    ensureBottomActions();", "    reorder();\n    ensureTopPromptCopy();\n    ensureBottomActions();",1)
s=s.replace("          reorder();\n          syncBottomButtons();", "          reorder();\n          syncTopPromptCopy();\n          syncBottomButtons();",1)
s=s.replace("      reorder();\n      ensureBottomActions();", "      reorder();\n      ensureTopPromptCopy();\n      ensureBottomActions();",1)
s=s.replace("      const ready = ORDER.slice(0,9).every(id => !!document.getElementById(id));\n      if ((ready && document.getElementById(BOTTOM_ID)) || tries > 80) clearInterval(timer);", "      const ready = ORDER.slice(0,9).every(id => !!document.getElementById(id));\n      if ((ready && document.getElementById(TOP_COPY_ID) && document.getElementById(BOTTOM_ID)) || tries > 80) clearInterval(timer);",1)
s=s.replace("    version:'33.3',", "    version:'33.4',",1)
s=s.replace("    reorder,\n    ensureBottomActions,", "    reorder,\n    ensureTopPromptCopy,\n    syncTopPromptCopy,\n    ensureBottomActions,",1)
p.write_text(s)

# 2) INTIMACY: keep current Home tile art, but restore the old celestial emblem only in opened category list.
p=Path('lunea-intimacy-burgundy-v40.js')
s=p.read_text()
s=s.replace('burgundy cabinet + tarot skin V40.4','burgundy cabinet + tarot skin V40.5',1)
s=s.replace("  const RELEASE = '40.4';","  const RELEASE = '40.5';",1)
old="""  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
  const TAROT_BACK_SRC = `./assets/intimacy-oracle/tarot_back_intimacy_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
"""
new="""  const HOME_ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
  const CATEGORY_ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v37.svg?v=${encodeURIComponent(SELF_VERSION)}`;
  const TAROT_BACK_SRC = `./assets/intimacy-oracle/tarot_back_intimacy_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
"""
if old not in s: raise SystemExit('V40 icon constants not found')
s=s.replace(old,new,1)
old_css="""      .lunea-intimacy-category .cat-icon img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;
        transform:scale(1.20)!important;transform-origin:center!important;
        border-radius:inherit!important;pointer-events:none!important
      }
"""
new_css="""      .lunea-intimacy-category .cat-icon img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;
        transform:none!important;transform-origin:center!important;
        border-radius:inherit!important;pointer-events:none!important
      }
"""
if old_css not in s: raise SystemExit('V40 category img CSS not found')
s=s.replace(old_css,new_css,1)
s=s.replace("  function forceIcon(root) {", "  function forceIcon(root, src) {",1)
s=s.replace("    if (img.getAttribute('src') !== ICON_SRC) img.setAttribute('src', ICON_SRC);", "    if (img.getAttribute('src') !== src) img.setAttribute('src', src);",1)
s=s.replace("      forceIcon($('.cat-icon', category));", "      forceIcon($('.cat-icon', category), CATEGORY_ICON_SRC);",1)
s=s.replace("      forceIcon($('.lunea-v8-object', tile));", "      forceIcon($('.lunea-v8-object', tile), HOME_ICON_SRC);",1)
p.write_text(s)

# 3) Fresh client cache for V33.4; nested V40 inherits the same release token.
p=Path('lunea-structural-routing-v4.js')
s=p.read_text()
old_token='lunea-reading-action-order-v33.js?v=b6d6dbf9d7fb'
if s.count(old_token)!=2: raise SystemExit(f'unexpected action-order loader count: {s.count(old_token)}')
s=s.replace(old_token,'lunea-reading-action-order-v33.js?v=3404')
p.write_text(s)

# 4) Update the existing action-order regression contract to the new requested order/version/cache.
p=Path('tests/thai-range-action-order-v33.test.mjs')
s=p.read_text()
old="""const expectedOrder = [
  'aiRead','saveReading','retry',
  'flipAll','extraCard','timingSupportBtn',
"""
new="""const expectedOrder = [
  'flipAll','aiRead','saveReading',
  'retry','extraCard','timingSupportBtn',
"""
if old not in s: raise SystemExit('existing expected order not found')
s=s.replace(old,new,1)
s=s.replace("assert.match(orderSource, /LUNEA READING ACTION ORDER V33\\.2/);","assert.match(orderSource, /LUNEA READING ACTION ORDER V33\\.4/);",1)
s=s.replace("assert.match(orderSource, /version:'33\\.2'/);","assert.match(orderSource, /version:'33\\.4'/);",1)
s=s.replace("console.log('Thai range V33 + reading action order V33.2 regression tests: PASS');","console.log('Thai range V33 + reading action order V33.4 regression tests: PASS');",1)
p.write_text(s)

print('patched universal top prompt copy, flip-first order, and opened INTIMACY legacy logo')
