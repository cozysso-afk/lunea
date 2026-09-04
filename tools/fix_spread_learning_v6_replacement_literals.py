from pathlib import Path
p=Path('tools/apply_spread_learning_v6.py')
s=p.read_text()
old="s2,n=re.subn(pattern,replacement,s,count=1)"
new="s2,n=re.subn(pattern,lambda m: replacement,s,count=1)"
count=s.count(old)
if count<1:
    raise SystemExit('v6 runtime replacement marker not found')
s=s.replace(old,new)
p.write_text(s)
print(f'v6 JS replacement escaping fixed in {count} location(s)')
