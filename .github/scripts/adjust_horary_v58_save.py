from pathlib import Path

# Prevent Journal repair/import from downgrading a full Horary record to a lightweight localStorage mirror.
p = Path('lunea-horary-post-actions-v44.js')
s = p.read_text()
old = """      const row = {
        id:String(existing?.id || uid()),
        sourceArchiveId:sourceId,
        createdAt:Number(reading.createdAt || existing?.createdAt || Date.now()),
        updatedAt:Date.now(),
        category:String(existing?.category || reading?.category || categoryFor(`${reading?.title || ''} ${reading?.q || ''}`)).toUpperCase(),
        status:['pending','hit','partial','miss','unverifiable'].includes(existing?.status) ? existing.status : 'pending',
        resultDate:String(existing?.resultDate || ''),
        dueDate:String(existing?.dueDate || ''),
        outcome:String(existing?.outcome || ''),
        note:String(existing?.note || ''),
        tags:Array.isArray(existing?.tags) ? existing.tags : [],
        signature:sig,
        reading:JSON.parse(JSON.stringify(reading))
      };"""
new = """      const preserveFullHorary = !!(
        reading?.horary?.lightweight &&
        existing?.reading?.horary &&
        !existing.reading.horary.lightweight
      );
      const storedReading = preserveFullHorary ? existing.reading : reading;
      const row = {
        id:String(existing?.id || uid()),
        sourceArchiveId:sourceId,
        createdAt:Number(reading.createdAt || existing?.createdAt || Date.now()),
        updatedAt:Date.now(),
        category:String(existing?.category || reading?.category || categoryFor(`${reading?.title || ''} ${reading?.q || ''}`)).toUpperCase(),
        status:['pending','hit','partial','miss','unverifiable'].includes(existing?.status) ? existing.status : 'pending',
        resultDate:String(existing?.resultDate || ''),
        dueDate:String(existing?.dueDate || ''),
        outcome:String(existing?.outcome || ''),
        note:String(existing?.note || ''),
        tags:Array.isArray(existing?.tags) ? existing.tags : [],
        signature:sig,
        reading:JSON.parse(JSON.stringify(storedReading))
      };"""
if 'const preserveFullHorary = !!(' not in s:
    if old not in s: raise SystemExit('V44 upsert marker not found')
    s = s.replace(old,new,1)
p.write_text(s)

# Mobile/PWA owner must use the same hardened save path instead of legacy repair.
p = Path('lunea-horary-mobile-actions-v45.js')
s = p.read_text()
old = """      const repair = W.LUNEA_HORARY_POST_ACTIONS_V44?.repairLatestHoraryArchive;
      if (typeof repair === 'function') {
        await repair();
      } else if (typeof button.onclick === 'function') {
        await button.onclick.call(button,{preventDefault(){},stopPropagation(){}});
      } else {
        throw new Error('호라리 기록 모듈을 불러오지 못했어.');
      }
      button.textContent = '✓ 기록 저장';"""
new = """      const hardened = W.LUNEA_HORARY_POST_ACTIONS_V44?.saveStandaloneHardened;
      const repair = W.LUNEA_HORARY_POST_ACTIONS_V44?.repairLatestHoraryArchive;
      if (typeof hardened === 'function') {
        await hardened(button);
      } else if (typeof repair === 'function') {
        await repair();
      } else if (typeof button.onclick === 'function') {
        await button.onclick.call(button,{preventDefault(){},stopPropagation(){}});
      } else {
        throw new Error('호라리 기록 모듈을 불러오지 못했어.');
      }
      button.textContent = '✓ 기록 저장';"""
if 'const hardened = W.LUNEA_HORARY_POST_ACTIONS_V44?.saveStandaloneHardened;' not in s:
    if old not in s: raise SystemExit('V45 save marker not found')
    s = s.replace(old,new,1)
s = s.replace("version:'45.1'","version:'45.2'")
s = s.replace('V45.1 active','V45.2 active')
p.write_text(s)

# Fresh mobile owner asset URL.
p = Path('lunea-astro-origin-failover-v57.js')
s = p.read_text().replace('./lunea-horary-mobile-actions-v45.js?v=451','./lunea-horary-mobile-actions-v45.js?v=452')
p.write_text(s)

# Update V45 runtime regression to exercise the hardened path explicitly.
p = Path('tests/horary-mobile-actions-v45.test.mjs')
s = p.read_text().replace('v=451','v=452')
s = s.replace("const calls = {prashna:0, save:0};","const calls = {prashna:0, save:0, legacySave:0};")
old = """context.LUNEA_HORARY_POST_ACTIONS_V44 = {
  aiPrompt:()=> 'prompt',
  copyPayload:()=> 'copy text',
  repairLatestHoraryArchive:async()=>{calls.save += 1;}
};"""
new = """context.LUNEA_HORARY_POST_ACTIONS_V44 = {
  aiPrompt:()=> 'prompt',
  copyPayload:()=> 'copy text',
  saveStandaloneHardened:async()=>{calls.save += 1;},
  repairLatestHoraryArchive:async()=>{calls.legacySave += 1;}
};"""
if 'saveStandaloneHardened:async()=>{calls.save += 1;}' not in s:
    if old not in s: raise SystemExit('V45 test mock marker not found')
    s=s.replace(old,new,1)
s=s.replace("assert.equal(calls.save,1,'Horary save tap must invoke Journal/archive repair directly');","assert.equal(calls.save,1,'Horary save tap must invoke hardened IndexedDB-first save directly');\nassert.equal(calls.legacySave,0,'Horary save tap must not fall back to legacy repair when hardened save exists');")
p.write_text(s)

# Extend V58 static contract.
p = Path('tests/horary-future-window-save-v58.test.mjs')
s = p.read_text()
if "mobile = fs.readFileSync" not in s:
    s = s.replace("const index = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');", "const index = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');\nconst mobile = fs.readFileSync(new URL('../lunea-horary-mobile-actions-v45.js', import.meta.url),'utf8');")
    s = s.replace("assert.match(loader,/lunea-horary-post-actions-v44\\.js\\?v=442/);", "assert.match(loader,/lunea-horary-post-actions-v44\\.js\\?v=442/);\nassert.match(loader,/lunea-horary-mobile-actions-v45\\.js\\?v=452/);\nassert.match(post,/preserveFullHorary/);\nassert.match(mobile,/saveStandaloneHardened/);")
p.write_text(s)
