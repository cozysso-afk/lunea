from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageDraw
import numpy as np
import zipfile
import tempfile

BRANCH_NOTE = 'INTIMACY Oracle V46 display/flip repair'
ROOT = Path('.')
ZIP = ROOT / 'lunea-intimacy-oracle-36-cards-png.zip'
CARD_DIR = ROOT / 'assets' / 'intimacy-oracle' / 'cards'


def replace_once(path, old, new):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    if old not in s:
        raise SystemExit(f'missing pattern in {path}: {old[:160]!r}')
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


def visual_stats(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    lum = .2126 * a[:, :, 0] + .7152 * a[:, :, 1] + .0722 * a[:, :, 2]
    mx = a.max(2)
    mn = a.min(2)
    sat = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 1e-6)
    return float(lum.mean()), float(sat.mean())


# 1) Rebuild all displayed Oracle cards from the untouched user-uploaded ZIP.
#    The original decks use inconsistent footer/title geometry; remove that from
#    the display asset and remount every artwork into one identical viewport.
if not ZIP.exists():
    raise SystemExit(f'missing source ZIP: {ZIP}')
CARD_DIR.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as td:
    td = Path(td)
    with zipfile.ZipFile(ZIP) as z:
        z.extractall(td)

    for i in range(1, 37):
        src = td / f'oracle_{i:02d}.png'
        if not src.exists():
            raise SystemExit(f'missing source Oracle: {src.name}')
        im = Image.open(src).convert('RGB')
        if im.size != (150, 250):
            raise SystemExit(f'unexpected source size {src.name}: {im.size}')

        # Card 01 has a uniquely tall printed title/description block. The rest
        # share a lower footer boundary. Strip printed footer text before app UI
        # adds its own consistent title overlay.
        bottom = 187 if i == 1 else 207
        art = im.crop((7, 7, 143, bottom))

        # First pass: restrained grading from the untouched source artwork.
        lum, sat = visual_stats(art)
        brightness = max(.78, min(1.28, .145 / max(lum, .01)))
        color = max(.90, min(1.12, .58 / max(sat, .01)))
        art = ImageEnhance.Brightness(art).enhance(brightness)
        art = ImageEnhance.Color(art).enhance(color)
        art = ImageEnhance.Contrast(art).enhance(1.02)

        # Every card gets exactly the same 140x205 artwork viewport. The crop
        # ratios are already almost identical, so this removes frame/footer
        # geometry differences instead of arbitrarily zooming individual cards.
        art = ImageOps.fit(art, (140, 205), method=Image.Resampling.LANCZOS, centering=(.5, .5))

        # Second pass: normalize *after* remounting, because resampling changes
        # the measured visual balance. This keeps all 36 displayed artworks in a
        # much tighter brightness/saturation band without crushing highlights.
        lum, sat = visual_stats(art)
        brightness2 = max(.90, min(1.12, .145 / max(lum, .01)))
        color2 = max(.94, min(1.08, .58 / max(sat, .01)))
        art = ImageEnhance.Brightness(art).enhance(brightness2)
        art = ImageEnhance.Color(art).enhance(color2)

        canvas = Image.new('RGB', (150, 250), (20, 6, 13))
        canvas.paste(art, (5, 5))
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((3, 3, 146, 246), radius=8, outline=(136, 68, 91), width=2)
        draw.rounded_rectangle((5, 5, 144, 210), radius=6, outline=(102, 53, 70), width=1)
        draw.line((8, 216, 142, 216), fill=(93, 45, 63), width=1)
        canvas.save(CARD_DIR / f'oracle_{i:02d}.png', format='PNG', optimize=True)


# 2) Oracle runtime: true two-sided 3D flip and the same 110ms stagger used by
#    the Tarot 'flip all' behavior. Do not rerender during reveal; rerendering
#    destroys the CSS transition.
replace_once(
    'lunea-intimacy-oracle-ui-v36.js',
    "CARD_ROOT='./assets/intimacy-oracle/cards',CARD_ASSET_VERSION='v45';",
    "CARD_ROOT='./assets/intimacy-oracle/cards',CARD_ASSET_VERSION='v46',ORACLE_FLIP_GAP=110;",
)
replace_once(
    'lunea-intimacy-oracle-ui-v36.js',
    "W.LUNEA_INTIMACY_ORACLE_UI_V36_CORE=Object.freeze({version:RELEASE,secureRandomInt,drawOracleCards,assignOracleForTarotIndex,fallbackQuestions,lensesFor,backAsset:BACK_ASSET,cardRoot:CARD_ROOT});",
    "W.LUNEA_INTIMACY_ORACLE_UI_V36_CORE=Object.freeze({version:RELEASE,secureRandomInt,drawOracleCards,assignOracleForTarotIndex,fallbackQuestions,lensesFor,backAsset:BACK_ASSET,cardRoot:CARD_ROOT,flipGap:ORACLE_FLIP_GAP});",
)
old_visual = "function cardVisual(card){const d=document.createElement('div');d.className='lio-card-face';const n=String(card?.code||'').match(/^O(\\d{2})$/)?.[1];const src=n?`${CARD_ROOT}/oracle_${n}.png?${CARD_ASSET_VERSION}`:'';d.style.backgroundImage=src?`url(\"${src}\")`:'none';d.style.backgroundSize='contain';d.style.backgroundPosition='center';d.style.backgroundColor='#14060d';d.style.backgroundRepeat='no-repeat';return d}"
new_visual = "function cardVisual(card){const flip=document.createElement('div');flip.className='lio-card-flip';const back=document.createElement('div');back.className='lio-card-side lio-card-back';const front=document.createElement('div');front.className='lio-card-side lio-card-front';const n=String(card?.code||'').match(/^O(\\d{2})$/)?.[1];const src=n?`${CARD_ROOT}/oracle_${n}.png?${CARD_ASSET_VERSION}`:'';front.style.backgroundImage=src?`url(\"${src}\")`:'none';front.style.backgroundSize='100% 100%';front.style.backgroundPosition='center';front.style.backgroundColor='#14060d';front.style.backgroundRepeat='no-repeat';flip.append(back,front);return flip}"
replace_once('lunea-intimacy-oracle-ui-v36.js', old_visual, new_visual)

old_render = "function renderOraclePanel(){const host=$('luneaIntimacyOraclePanel');if(!host)return;host.replaceChildren();if(!reading.cards.length){host.hidden=true;return}host.hidden=false;const h=document.createElement('div');h.className='lio-head';h.innerHTML='<b>✦ INTIMACY ORACLE</b><button type=\"button\" class=\"mini\" id=\"luneaOracleRevealAll\">오라클 공개</button>';host.appendChild(h);const row=document.createElement('div');row.className='lio-row';reading.cards.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='lio-card'+(reading.revealed.has(i)?' revealed':'');b.appendChild(cardVisual(c));const meta=document.createElement('span');meta.innerHTML=`<em>${c.lens}</em><strong>${c.enTitle}</strong><small>${c.koTitle}</small>`;b.appendChild(meta);b.onclick=()=>{reading.revealed.add(i);b.classList.add('revealed');saveSidecar()};row.appendChild(b)});host.appendChild(row);$('luneaOracleRevealAll').onclick=()=>{reading.cards.forEach((_,i)=>reading.revealed.add(i));renderOraclePanel();saveSidecar()}}"
new_render = "function revealOracleButton(b,i){if(!b||reading.revealed.has(i))return false;reading.revealed.add(i);b.classList.add('revealed');saveSidecar();return true}\nfunction renderOraclePanel(){const host=$('luneaIntimacyOraclePanel');if(!host)return;host.replaceChildren();if(!reading.cards.length){host.hidden=true;return}host.hidden=false;const h=document.createElement('div');h.className='lio-head';h.innerHTML='<b>✦ INTIMACY ORACLE</b><button type=\"button\" class=\"mini\" id=\"luneaOracleRevealAll\">오라클 공개</button>';host.appendChild(h);const row=document.createElement('div');row.className='lio-row';reading.cards.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.dataset.oracleIndex=String(i);b.className='lio-card'+(reading.revealed.has(i)?' revealed':'');b.appendChild(cardVisual(c));const meta=document.createElement('span');meta.innerHTML=`<em>${c.lens}</em><strong>${c.enTitle}</strong><small>${c.koTitle}</small>`;b.appendChild(meta);b.onclick=()=>revealOracleButton(b,i);row.appendChild(b)});host.appendChild(row);const all=$('luneaOracleRevealAll');all.onclick=()=>{const pending=[...row.querySelectorAll('.lio-card:not(.revealed)')];if(!pending.length)return;all.disabled=true;all.textContent='공개 중…';pending.forEach((b,seq)=>{const i=+b.dataset.oracleIndex;setTimeout(()=>{revealOracleButton(b,i);if(seq===pending.length-1)setTimeout(()=>{all.disabled=false;all.textContent='오라클 공개'},640)},seq*ORACLE_FLIP_GAP)})}}"
replace_once('lunea-intimacy-oracle-ui-v36.js', old_render, new_render)

old_css = ".lio-card:only-child{grid-column:2;min-width:112px}.lio-card-face{position:absolute;inset:0;background-repeat:no-repeat;filter:none}.lio-card:not(.revealed) .lio-card-face{background-image:url('${BACK_ASSET}')!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}.lio-card span{"
new_css = ".lio-card:only-child{grid-column:2;min-width:112px}.lio-card{perspective:900px}.lio-card-flip{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .62s cubic-bezier(.22,.72,.24,1);will-change:transform}.lio-card.revealed .lio-card-flip{transform:rotateY(180deg);-webkit-transform:rotateY(180deg)}.lio-card-side{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-repeat:no-repeat;background-position:center}.lio-card-back{background:url('${BACK_ASSET}') center/cover no-repeat}.lio-card-front{transform:rotateY(180deg) translateZ(1px);-webkit-transform:rotateY(180deg) translateZ(1px);filter:none}.lio-card span{"
replace_once('lunea-intimacy-oracle-ui-v36.js', old_css, new_css)
replace_once(
    'lunea-intimacy-oracle-ui-v36.js',
    "@media(max-width:390px){.lio-tools",
    "@media(prefers-reduced-motion:reduce){.lio-card-flip{transition:none!important}}@media(max-width:390px){.lio-tools",
)

# 3) Force the browser/PWA to request the new Oracle runtime.
replace_once('lunea-intimacy-ai-bridge-v34.js', 'lunea-intimacy-oracle-ui-v36.js?v=3613', 'lunea-intimacy-oracle-ui-v36.js?v=3614')

# 4) Align stale contracts with V46 and add a dedicated flip/stagger contract.
for test_path in ['tests/intimacy-ai-bridge-v34.test.mjs', 'tests/intimacy-oracle-ui-v36.test.mjs']:
    p = Path(test_path)
    s = p.read_text(encoding='utf-8')
    if '3613' not in s:
        raise SystemExit(f'missing cache contract in {test_path}')
    p.write_text(s.replace('3613', '3614'), encoding='utf-8')

p = Path('tests/intimacy-oracle-ui-v36.test.mjs')
s = p.read_text(encoding='utf-8')
s = s.replace("assert.ok(core); assert.equal(core.version,'36.2');", "assert.ok(core); assert.equal(core.version,'36.2'); assert.equal(core.flipGap,110);")
p.write_text(s, encoding='utf-8')

p = Path('tests/intimacy-v45-root-regression.test.mjs')
s = p.read_text(encoding='utf-8')
s = s.replace("CARD_ASSET_VERSION='v45'", "CARD_ASSET_VERSION='v46'")
s = s.replace("backgroundSize='contain'", "backgroundSize='100% 100%'")
p.write_text(s, encoding='utf-8')

p = Path('tests/intimacy-visual-cohesion-v44.test.mjs')
s = p.read_text(encoding='utf-8').replace("backgroundSize='contain'", "backgroundSize='100% 100%'")
p.write_text(s, encoding='utf-8')

Path('tests/intimacy-oracle-flip-v46.test.mjs').write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../lunea-intimacy-oracle-ui-v36.js',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js',import.meta.url),'utf8');
test('Oracle V46 uses one standardized 3:5 display asset without browser crop',()=>{
  assert.match(source,/CARD_ASSET_VERSION='v46'/);
  assert.match(source,/backgroundSize='100% 100%'/);
  assert.match(source,/lio-card-front/);
});
test('Oracle cards are true two-sided 3D flips on iOS-safe CSS',()=>{
  assert.match(source,/perspective:900px/);
  assert.match(source,/transform-style:preserve-3d/);
  assert.match(source,/-webkit-transform-style:preserve-3d/);
  assert.match(source,/backface-visibility:hidden/);
  assert.match(source,/-webkit-backface-visibility:hidden/);
  assert.match(source,/rotateY\(180deg\)/);
  assert.match(source,/transition:transform \.62s/);
});
test('Reveal all staggers Oracle flips at the Tarot 110ms rhythm without rerender',()=>{
  assert.match(source,/ORACLE_FLIP_GAP=110/);
  assert.match(source,/seq\*ORACLE_FLIP_GAP/);
  const render=source.slice(source.indexOf('function renderOraclePanel'),source.indexOf('function performOracleDraw'));
  assert.doesNotMatch(render,/renderOraclePanel\(\);saveSidecar/);
  assert.match(render,/revealOracleButton\(b,i\)/);
});
test('Oracle runtime cache token advances for PWA refresh',()=>{
  assert.match(bridge,/lunea-intimacy-oracle-ui-v36\.js\?v=3614/);
});
''', encoding='utf-8')

print(BRANCH_NOTE, 'applied')
