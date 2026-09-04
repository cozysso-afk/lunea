from pathlib import Path

p = Path('tests/intimacy-tarot-visual-v40.test.mjs')
s = p.read_text(encoding='utf-8')
old = """test('shared restore cannot overwrite the final INTIMACY Tarot back', () => {\n  const restoreAt = source.indexOf('repairVisibleReading?.()');\n  const finalAt = source.indexOf('wrappers.forEach(repairTarotWrapper)', restoreAt);\n  assert.ok(restoreAt >= 0 && finalAt > restoreAt);\n  assert.match(source, /backImg\\.setAttribute\\('src', TAROT_BACK_SRC\\)/);\n});"""
new = """test('INTIMACY Tarot back has one owner without an intermediate shared restore paint', () => {\n  const repair = source.slice(source.indexOf('function repairTarotCards'), source.indexOf('function wrapCardFactory'));\n  assert.doesNotMatch(repair, /repairVisibleReading/);\n  assert.match(source, /backImg\\.setAttribute\\('src', TAROT_BACK_SRC\\)/);\n});"""
if old not in s:
    raise SystemExit('stale tarot visual contract pattern not found')
p.write_text(s.replace(old, new, 1), encoding='utf-8')
