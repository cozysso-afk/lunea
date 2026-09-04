from pathlib import Path

# 1) Learning engine: expose a single canonical row upgrader.
p=Path('lunea-user-spread-learning-v1.js')
s=p.read_text()
old="""  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(x))return[];
      return x.map(row=>{
        if(!row||typeof row!=='object')return row;
        const category=rowCategory(row);
        const meta={intentSummary:row.intentSummary,primaryIntent:row.primaryIntent,targetStructure:row.targetStructure,requestedAxes:row.requestedAxes,category};
        const structureProfile=!row.structureProfile||Number(row.structureProfile.version||0)<3?profile(row.question||'',meta):row.structureProfile;
        return {...row,category,structureProfile};
      });
    }catch{return[]}
  }
"""
new="""  function upgradeRow(row){
    if(!row||typeof row!=='object')return row;
    const category=rowCategory(row);
    const meta={intentSummary:row.intentSummary,primaryIntent:row.primaryIntent,targetStructure:row.targetStructure,requestedAxes:row.requestedAxes,category};
    const structureProfile=!row.structureProfile||Number(row.structureProfile.version||0)<3?profile(row.question||'',meta):row.structureProfile;
    return {...row,category,structureProfile};
  }
  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(x))return[];
      return x.map(upgradeRow);
    }catch{return[]}
  }
"""
if old not in s: raise SystemExit('learning read block not found')
s=s.replace(old,new,1)
old="""    compatibility,
    formatForPrompt,
    categoryOf:rowCategory,
"""
new="""    compatibility,
    formatForPrompt,
    upgradeRow,
    categoryOf:rowCategory,
"""
if old not in s: raise SystemExit('learning export block not found')
s=s.replace(old,new,1)
p.write_text(s)

# 2) Cloud sync: upgrade both local and remote records before merge and before every push.
p=Path('lunea-learning-cloud-sync-v1.js')
s=p.read_text()
needle="""  const learning=()=>W.LUNEA_SPREAD_LEARNING_V1||null;
  const localKey=()=>learning()?.key||'LUNEA_SPREAD_CORRECTION_MEMORY_V1';
"""
replacement="""  const learning=()=>W.LUNEA_SPREAD_LEARNING_V1||null;
  function upgradeRow(row){const api=learning();return typeof api?.upgradeRow==='function'?api.upgradeRow(row):row}
  const localKey=()=>learning()?.key||'LUNEA_SPREAD_CORRECTION_MEMORY_V1';
"""
if needle not in s: raise SystemExit('cloud learning helper block not found')
s=s.replace(needle,replacement,1)
s=s.replace("    return payload;\n  }\n  function mergeRows", "    return upgradeRow(payload);\n  }\n  function mergeRows",1)
old="""    for(const raw of Array.isArray(local)?local:[]){const k=questionKey(raw);if(!k||!validRow(raw))continue;const old=map.get(k);if(!old||rowTime(raw)>=rowTime(old))map.set(k,{...raw,questionKey:rawQuestionKey(raw),category:rowCategory(raw)})}
"""
new="""    for(const raw0 of Array.isArray(local)?local:[]){const raw=upgradeRow(raw0),k=questionKey(raw);if(!k||!validRow(raw))continue;const old=map.get(k);if(!old||rowTime(raw)>=rowTime(old))map.set(k,{...raw,questionKey:rawQuestionKey(raw),category:rowCategory(raw)})}
"""
if old not in s: raise SystemExit('cloud local merge loop not found')
s=s.replace(old,new,1)
old="""    const body=rows.map(row=>{const updated=rowTime(row)||Date.now(),k=questionKey(row);return{user_id:s.user.id,question_key:k,source:row.source==='manual'?'manual':'ai_correction',payload:{...row,questionKey:rawQuestionKey(row),category:rowCategory(row),updatedAt:updated},updated_at:new Date(updated).toISOString()}});
"""
new="""    const body=rows.map(raw=>{const row=upgradeRow(raw),updated=rowTime(row)||Date.now(),k=questionKey(row);return{user_id:s.user.id,question_key:k,source:row.source==='manual'?'manual':'ai_correction',payload:{...row,questionKey:rawQuestionKey(row),category:rowCategory(row),updatedAt:updated},updated_at:new Date(updated).toISOString()}});
"""
if old not in s: raise SystemExit('cloud push body not found')
s=s.replace(old,new,1)
old="""  async function pushRows(s,rows){const safe=rows.filter(validRow).slice(0,MAX);for(let i=0;i<safe.length;i+=100)await pushBatch(s,safe.slice(i,i+100))}
"""
new="""  async function pushRows(s,rows){const safe=rows.map(upgradeRow).filter(validRow).slice(0,MAX);for(let i=0;i<safe.length;i+=100)await pushBatch(s,safe.slice(i,i+100))}
"""
if old not in s: raise SystemExit('cloud pushRows not found')
s=s.replace(old,new,1)
s=s.replace("W.LUNEA_LEARNING_CLOUD_SYNC_V1={version:1,max:MAX,mergeRows,normalizeCloudRow,questionKey,localRows", "W.LUNEA_LEARNING_CLOUD_SYNC_V1={version:2,max:MAX,upgradeRow,mergeRows,normalizeCloudRow,questionKey,localRows",1)
p.write_text(s)

# 3) Cache-bust both scripts in both loader paths.
p=Path('lunea-structural-routing-v4.js')
s=p.read_text()
if s.count('lunea-user-spread-learning-v1.js?v=107') != 2: raise SystemExit('unexpected learning cache count')
if s.count('lunea-learning-cloud-sync-v1.js?v=103') != 2: raise SystemExit('unexpected cloud cache count')
s=s.replace('lunea-user-spread-learning-v1.js?v=107','lunea-user-spread-learning-v1.js?v=108')
s=s.replace('lunea-learning-cloud-sync-v1.js?v=103','lunea-learning-cloud-sync-v1.js?v=104')
p.write_text(s)
print('patched cloud profile v3 upgrade path')
