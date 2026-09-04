from pathlib import Path
p=Path('lunea-learning-cloud-sync-v1.js')
s=p.read_text()
old="for(const raw of Array.isArray(local)?local:[]){const k=questionKey(raw);if(!k||!validRow(raw))continue;const old=map.get(k);if(!old||rowTime(raw)>=rowTime(old))map.set(k,{...raw,questionKey:k})}"
new="for(const raw of Array.isArray(local)?local:[]){const k=questionKey(raw);if(!k||!validRow(raw))continue;const old=map.get(k);if(!old||rowTime(raw)>=rowTime(old))map.set(k,{...raw,questionKey:rawQuestionKey(raw),category:rowCategory(raw)})}"
if s.count(old)!=1: raise SystemExit('cloud local merge pattern missing')
s=s.replace(old,new,1)
old2="payload:{...row,questionKey:k,updatedAt:updated}"
new2="payload:{...row,questionKey:rawQuestionKey(row),category:rowCategory(row),updatedAt:updated}"
if s.count(old2)!=1: raise SystemExit('cloud push payload pattern missing')
s=s.replace(old2,new2,1)
p.write_text(s)
print('cloud category key followup applied')
