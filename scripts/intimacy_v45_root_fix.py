from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import numpy as np


def replace(path, old, new, count=1):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    if old not in s:
        raise SystemExit(f'missing pattern in {path}: {old[:120]!r}')
    p.write_text(s.replace(old, new, count), encoding='utf-8')


# 1) Shared card-back owner: INTIMACY is first-class and never falls through to GENERAL.
replace(
    'lunea-cardback-restore-v19.js',
    "    CAREER: 'back_career.PNG',\n    GENERAL: 'back_general.PNG'\n  };",
    "    CAREER: 'back_career.PNG',\n    GENERAL: 'back_general.PNG',\n    INTIMACY: 'assets/intimacy-oracle/tarot_back_intimacy_final.png'\n  };",
)
replace(
    'lunea-cardback-restore-v19.js',
    "  function categoryNow() {\n    try {\n      const value = String(state?.category || 'GENERAL').toUpperCase();\n      return FILES[value] ? value : 'GENERAL';\n    } catch {\n      return 'GENERAL';\n    }\n  }",
    "  function categoryNow() {\n    try {\n      if (W.__LUNEA_INTIMACY_ACTIVE__ || document.body?.classList?.contains('lunea-intimacy-reading') || String(state?.category || '').toUpperCase() === 'INTIMACY') return 'INTIMACY';\n      const value = String(state?.category || 'GENERAL').toUpperCase();\n      return FILES[value] ? value : 'GENERAL';\n    } catch {\n      return W.__LUNEA_INTIMACY_ACTIVE__ ? 'INTIMACY' : 'GENERAL';\n    }\n  }",
)

# 2) iOS must choose the INTIMACY back before insertion into #cards.
replace(
    'lunea-ios-performance-v3.js',
    "        if (String(state?.category || '').toUpperCase() === 'INTIMACY') backSrc = './assets/intimacy-oracle/tarot_back_intimacy_final.png';",
    "        if (W.__LUNEA_INTIMACY_ACTIVE__ || document.body?.classList?.contains('lunea-intimacy-reading') || String(state?.category || '').toUpperCase() === 'INTIMACY') backSrc = './assets/intimacy-oracle/tarot_back_intimacy_final.png';",
)

# 3) V40 must not force an intermediate shared restore paint.
replace(
    'lunea-intimacy-burgundy-v40.js',
    "    /* Let the shared restore layer do its normal work first; INTIMACY then wins\n       with its own dedicated Tarot back as the final owner. */\n    W.LUNEA_CARD_BACK_RESTORE_V19?.repairVisibleReading?.();\n    wrappers.forEach(repairTarotWrapper);",
    "    /* INTIMACY is already owned by the shared V19 category map. Do not run an\n       intermediate restore paint here; repair only the final wrappers. */\n    wrappers.forEach(repairTarotWrapper);",
)

# 4) Old timed icon writers must use the same final PNG as V40.
replace('lunea-intimacy-readability-v36.js', 'intimacy_sector_v37.svg', 'intimacy_sector_final.png')
replace('lunea-intimacy-clean-v39.js', 'intimacy_sector_v37.svg', 'intimacy_sector_final.png')

# 5) Oracle display: cache-bust normalized cards and never crop/double-grade them.
replace(
    'lunea-intimacy-oracle-ui-v36.js',
    "const RELEASE='36.2',MODE_KEY='LUNEA_INTIMACY_ORACLE_MODE_V1',DRAFT_KEY='LUNEA_INTIMACY_ORACLE_DRAFT_V1',BACK_ASSET='./assets/intimacy-oracle/oracle_back_intimacy_final.png',CARD_ROOT='./assets/intimacy-oracle/cards';",
    "const RELEASE='36.2',MODE_KEY='LUNEA_INTIMACY_ORACLE_MODE_V1',DRAFT_KEY='LUNEA_INTIMACY_ORACLE_DRAFT_V1',BACK_ASSET='./assets/intimacy-oracle/oracle_back_intimacy_final.png',CARD_ROOT='./assets/intimacy-oracle/cards',CARD_ASSET_VERSION='v45';",
)
replace(
    'lunea-intimacy-oracle-ui-v36.js',
    "const src=n?`${CARD_ROOT}/oracle_${n}.png`:'';d.style.backgroundImage=src?`url(\"${src}\")`:'none';d.style.backgroundSize='cover';d.style.backgroundPosition='center';d.style.backgroundRepeat='no-repeat';return d}",
    "const src=n?`${CARD_ROOT}/oracle_${n}.png?${CARD_ASSET_VERSION}`:'';d.style.backgroundImage=src?`url(\"${src}\")`:'none';d.style.backgroundSize='contain';d.style.backgroundPosition='center';d.style.backgroundColor='#14060d';d.style.backgroundRepeat='no-repeat';return d}",
)
replace(
    'lunea-intimacy-oracle-ui-v36.js',
    ".lio-card-face{position:absolute;inset:0;background-repeat:no-repeat;filter:brightness(1.12) saturate(1.06)}",
    ".lio-card-face{position:absolute;inset:0;background-repeat:no-repeat;filter:none}",
)

# 6) Normalize the 36 displayed PNGs. The original uploaded ZIP remains untouched as backup.
def visual_stats(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    h, w = a.shape[:2]
    c = a[int(h * .06):int(h * .94), int(w * .06):int(w * .94)]
    lum = .2126 * c[:, :, 0] + .7152 * c[:, :, 1] + .0722 * c[:, :, 2]
    mx = c.max(2)
    mn = c.min(2)
    sat = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 1e-6)
    return float(lum.mean()), float(sat.mean())

root = Path('assets/intimacy-oracle/cards')
files = [root / f'oracle_{i:02d}.png' for i in range(1, 37)]
missing = [str(p) for p in files if not p.exists()]
if missing:
    raise SystemExit(f'missing oracle cards: {missing}')

target_lum = .145
target_sat = .58
for p in files:
    im = Image.open(p).convert('RGB')
    if im.size != (150, 250):
        im = ImageOps.fit(im, (150, 250), method=Image.Resampling.LANCZOS, centering=(.5, .5))
    lum, sat = visual_stats(im)
    brightness = max(.72, min(1.38, target_lum / max(lum, .01)))
    color = max(.88, min(1.14, target_sat / max(sat, .01)))
    graded = ImageEnhance.Brightness(im).enhance(brightness)
    graded = ImageEnhance.Color(graded).enhance(color)
    graded = ImageEnhance.Contrast(graded).enhance(1.02)
    inner = ImageOps.contain(graded, (142, 237), method=Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (150, 250), (20, 6, 13))
    canvas.paste(inner, ((150 - inner.width) // 2, (250 - inner.height) // 2))
    canvas.save(p, format='PNG', optimize=True)

# 7) Update stale icon / visual contracts.
p = Path('tests/intimacy-readability-v36.test.mjs')
s = p.read_text(encoding='utf-8')
s = s.replace(
    "const icon = fs.readFileSync(new URL('../assets/intimacy-oracle/intimacy_sector_v37.svg', import.meta.url), 'utf8');",
    "const icon = fs.readFileSync(new URL('../assets/intimacy-oracle/intimacy_sector_final.png', import.meta.url));",
)
s = s.replace(r"intimacy_sector_v37\.svg\?v=", r"intimacy_sector_final\.png\?v=")
s = s.replace(
    "  assert.match(icon, /viewBox=\"0 0 180 180\"/);\n  assert.match(icon, /radialGradient id=\"pearl\"/);\n  assert.match(icon, /linearGradient id=\"cres\"/);",
    "  assert.equal(icon.subarray(0,8).toString('hex'), '89504e470d0a1a0a');",
)
p.write_text(s, encoding='utf-8')

p = Path('tests/intimacy-clean-v39.test.mjs')
s = p.read_text(encoding='utf-8').replace(r"intimacy_sector_v37\.svg\?v=", r"intimacy_sector_final\.png\?v=")
p.write_text(s, encoding='utf-8')

p = Path('tests/intimacy-visual-cohesion-v44.test.mjs')
s = p.read_text(encoding='utf-8')
s = s.replace(
    "assert.match(oracle,/brightness\\(1\\.12\\)/);",
    "assert.match(oracle,/backgroundSize='contain'/);assert.match(oracle,/filter:none/);",
)
p.write_text(s, encoding='utf-8')

Path('tests/intimacy-v45-root-regression.test.mjs').write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL(`../${n}`,import.meta.url),'utf8');
const restore=read('lunea-cardback-restore-v19.js');
const ios=read('lunea-ios-performance-v3.js');
const v40=read('lunea-intimacy-burgundy-v40.js');
const v38=read('lunea-intimacy-readability-v36.js');
const v39=read('lunea-intimacy-clean-v39.js');
const oracle=read('lunea-intimacy-oracle-ui-v36.js');
test('shared card-back owner recognizes INTIMACY instead of falling back to GENERAL',()=>{
  assert.match(restore,/INTIMACY: 'assets\/intimacy-oracle\/tarot_back_intimacy_final\.png'/);
  assert.match(restore,/__LUNEA_INTIMACY_ACTIVE__/);
  assert.match(restore,/return 'INTIMACY'/);
});
test('iOS card factory chooses the INTIMACY back before insertion',()=>{
  assert.match(ios,/__LUNEA_INTIMACY_ACTIVE__/);
  assert.match(ios,/tarot_back_intimacy_final\.png/);
});
test('V40 no longer calls shared restore as an intermediate paint',()=>{
  const fn=v40.slice(v40.indexOf('function repairTarotCards'),v40.indexOf('function wrapCardFactory'));
  assert.doesNotMatch(fn,/repairVisibleReading/);
});
test('all live cabinet layers point at the same final sector PNG',()=>{
  assert.match(v38,/intimacy_sector_final\.png/);
  assert.match(v39,/intimacy_sector_final\.png/);
  assert.doesNotMatch(v38,/intimacy_sector_v37\.svg/);
  assert.doesNotMatch(v39,/intimacy_sector_v37\.svg/);
});
test('Oracle cards use normalized assets without CSS crop or double grading',()=>{
  assert.match(oracle,/CARD_ASSET_VERSION='v45'/);
  assert.match(oracle,/backgroundSize='contain'/);
  assert.match(oracle,/filter:none/);
  assert.doesNotMatch(oracle,/brightness\(1\.12\)/);
});
''', encoding='utf-8')
