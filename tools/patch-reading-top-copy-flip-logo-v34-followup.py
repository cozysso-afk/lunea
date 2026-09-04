from pathlib import Path

p=Path('lunea-intimacy-burgundy-v40.js')
s=p.read_text()
old="""    icon:ICON_SRC,
    cardBack:TAROT_BACK_SRC,
"""
new="""    icon:HOME_ICON_SRC,
    categoryIcon:CATEGORY_ICON_SRC,
    cardBack:TAROT_BACK_SRC,
"""
if old not in s: raise SystemExit('V40 public icon export anchor not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('tests/intimacy-manual-oracle-back-integration.test.mjs')
s=p.read_text()
old="assert.match(burgundy,/const RELEASE = '40\\.4'/)"
new="assert.match(burgundy,/const RELEASE = '40\\.5'/)"
if old not in s: raise SystemExit('INTIMACY integration version contract not found')
s=s.replace(old,new,1)
p.write_text(s)

print('fixed V40 public icon export and release regression contract')
