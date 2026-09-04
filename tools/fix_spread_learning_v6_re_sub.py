from pathlib import Path
p=Path('tools/apply_spread_learning_v6.py')
s=p.read_text()
old="t2,n=re.subn(pat,rep,t,count=1)"
new="t2,n=re.subn(pat,lambda m: rep,t,count=1)"
if old not in s:
    raise SystemExit('v6 re.subn marker not found')
p.write_text(s.replace(old,new,1))
print('v6 test replacement escaping fixed')
