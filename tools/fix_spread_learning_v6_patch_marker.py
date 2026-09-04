from pathlib import Path
p=Path('tools/apply_spread_learning_v6.py')
s=p.read_text()
old="""old=\"\"\"    W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null};\n\"\"\"\n"""
new="""old=\"\"\"    W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,learnedLong:learnedLongSpread,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null};\n\"\"\"\n"""
if old not in s: raise SystemExit('v6 patch marker source not found')
s=s.replace(old,new,1)
p.write_text(s)
print('v6 public API marker fixed')
