from pathlib import Path
for name in ('tests/horary-post-actions-v44.test.mjs','tests/horary-mobile-actions-v45.test.mjs'):
    p=Path(name)
    if not p.exists():
        continue
    s=p.read_text().replace('v=441','v=442')
    p.write_text(s)
