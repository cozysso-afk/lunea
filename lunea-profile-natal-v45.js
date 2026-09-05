'use strict';

/* LUNEA PROFILE + NATAL RECOVERY V45
   - Adds 중화신약 to the Four Pillars strength selector.
   - Replaces the partial birthplace list with a two-step nationwide Korea
     selector (2026-07-01 administrative structure, 230 시·군·구).
   - Resolves representative coordinates from the same 2026 administrative
     boundary data used by astro-app and sends lat/lon with Natal requests.
   - Keeps previously saved birthplace values and canonical Render origin.
*/
(() => {
  if (window.__LUNEA_PROFILE_NATAL_V45__) return;
  window.__LUNEA_PROFILE_NATAL_V45__ = true;

  const PLACE_KEY = 'LUNEA_BIRTH_PLACE';
  const LAT_KEY = 'LUNEA_BIRTH_LAT';
  const LON_KEY = 'LUNEA_BIRTH_LON';
  const REGION_KEY = 'LUNEA_BIRTH_REGION_V45';
  const DISTRICT_KEY = 'LUNEA_BIRTH_DISTRICT_V45';
  const DATA_VERSION = '20260701';
  const ADMIN_COUNT = 230;
  const GEO_URLS = [
    'https://raw.githubusercontent.com/DevMinGeonPark/mapcn-kr/main/data/sgg.json',
    'https://cdn.jsdelivr.net/gh/DevMinGeonPark/mapcn-kr@main/data/sgg.json'
  ];

  const ADMIN = {
    '서울특별시': ['종로구','중구','용산구','성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구','은평구','서대문구','마포구','양천구','강서구','구로구','금천구','영등포구','동작구','관악구','서초구','강남구','송파구','강동구'],
    '부산광역시': ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'],
    '대구광역시': ['중구','동구','서구','남구','북구','수성구','달서구','달성군','군위군'],
    '인천광역시': ['강화군','옹진군','제물포구','영종구','미추홀구','연수구','남동구','부평구','계양구','서해구','검단구'],
    '광주광역시': ['동구','서구','남구','북구','광산구'],
    '대전광역시': ['동구','중구','서구','유성구','대덕구'],
    '울산광역시': ['중구','남구','동구','북구','울주군'],
    '세종특별자치시': ['세종특별자치시'],
    '경기도': ['수원시','성남시','의정부시','안양시','부천시','광명시','평택시','동두천시','안산시','고양시','과천시','구리시','남양주시','오산시','시흥시','군포시','의왕시','하남시','용인시','파주시','이천시','안성시','김포시','화성시','광주시','양주시','포천시','여주시','연천군','가평군','양평군'],
    '강원특별자치도': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'],
    '충청북도': ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
    '충청남도': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
    '전북특별자치도': ['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
    '전라남도': ['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
    '경상북도': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
    '경상남도': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
    '제주특별자치도': ['제주시','서귀포시']
  };

  // Stable city-centre overrides for places already verified in Astro Core.
  const KNOWN = {
    '전라남도::여수시': [34.7604,127.6622],
    '전라남도::순천시': [34.9507,127.4872],
    '전라남도::광양시': [34.9407,127.6959],
    '광주광역시::동구': [35.1461,126.9231],
    '세종특별자치시::세종특별자치시': [36.4800,127.2890],
    '제주특별자치도::제주시': [33.4996,126.5312],
    '제주특별자치도::서귀포시': [33.2541,126.5601]
  };

  let coordinatePromise = null;
  let coordinateMap = {...KNOWN};

  const $ = id => document.getElementById(id);
  const clean = value => String(value ?? '').trim();

  function ensureStrengthOption() {
    const select = $('sajuStrength');
    if (!select) return false;
    if ([...select.options].some(o => clean(o.value || o.textContent) === '중화신약')) return true;
    const option = new Option('중화신약','중화신약');
    const weak = [...select.options].find(o => clean(o.value || o.textContent) === '신약');
    if (weak) select.insertBefore(option, weak); else select.appendChild(option);
    return true;
  }

  function normalizeRegion(region, district='') {
    const r = clean(region);
    const d = clean(district);
    if (r === '전남광주통합특별시') {
      return ['동구','서구','남구','북구','광산구'].includes(d) ? '광주광역시' : '전라남도';
    }
    if (r === '강원도') return '강원특별자치도';
    if (r === '전라북도') return '전북특별자치도';
    return r;
  }

  function ringCentroid(ring) {
    let twiceArea=0,cx=0,cy=0;
    for (let i=0;i<(ring?.length||0)-1;i+=1) {
      const [x1,y1]=ring[i]||[], [x2,y2]=ring[i+1]||[];
      if (![x1,y1,x2,y2].every(Number.isFinite)) continue;
      const cross=x1*y2-x2*y1;
      twiceArea+=cross; cx+=(x1+x2)*cross; cy+=(y1+y2)*cross;
    }
    if (Math.abs(twiceArea)<1e-12) {
      const valid=(ring||[]).filter(p=>Number.isFinite(p?.[0])&&Number.isFinite(p?.[1]));
      if (!valid.length) return null;
      return {area:0,lon:valid.reduce((s,p)=>s+p[0],0)/valid.length,lat:valid.reduce((s,p)=>s+p[1],0)/valid.length};
    }
    return {area:Math.abs(twiceArea/2),lon:cx/(3*twiceArea),lat:cy/(3*twiceArea)};
  }

  function representativePoint(geometry) {
    if (!geometry?.coordinates) return null;
    const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
    let best=null;
    for (const poly of polys) {
      const c=ringCentroid(poly?.[0]);
      if (c && (!best || c.area>best.area)) best=c;
    }
    return best && Number.isFinite(best.lat) && Number.isFinite(best.lon) ? [best.lat,best.lon] : null;
  }

  async function loadCoordinateMap() {
    if (coordinatePromise) return coordinatePromise;
    coordinatePromise=(async()=>{
      let collection=null;
      for (const url of GEO_URLS) {
        try {
          const res=await fetch(url,{cache:'force-cache'});
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          collection=await res.json();
          if (Array.isArray(collection?.features)) break;
        } catch (e) { console.warn('[LUNEA V45] boundary source failed', url, e); }
      }
      if (Array.isArray(collection?.features)) {
        for (const feature of collection.features) {
          const p=feature?.properties||{};
          const district=clean(p.sggnm);
          const region=normalizeRegion(p.sidonm,district);
          if (!region || !district) continue;
          const point=representativePoint(feature.geometry);
          if (point) coordinateMap[`${region}::${district}`]=point;
        }
      }
      updateCoordinateStatus();
      syncCoordinateForSelection();
      return coordinateMap;
    })();
    return coordinatePromise;
  }

  function inferSaved(saved) {
    const regionSaved=clean(localStorage.getItem(REGION_KEY));
    const districtSaved=clean(localStorage.getItem(DISTRICT_KEY));
    if (ADMIN[regionSaved]?.includes(districtSaved)) return {region:regionSaved,district:districtSaved};
    const s=clean(saved).replace(/\s+/g,' ');
    if (s.includes('::')) {
      const [r,d]=s.split('::');
      if (ADMIN[r]?.includes(d)) return {region:r,district:d};
    }
    for (const [region,districts] of Object.entries(ADMIN)) {
      const district=districts.find(d => s===d || s===d.replace(/[시군구]$/,'') || s===`${region} ${d}` || s.includes(`${region} ${d}`));
      if (district) return {region,district};
    }
    const aliases={
      '서울':['서울특별시','종로구'],'부산':['부산광역시','중구'],'대구':['대구광역시','중구'],
      '인천':['인천광역시','미추홀구'],'광주':['광주광역시','동구'],'대전':['대전광역시','중구'],
      '울산':['울산광역시','남구'],'세종':['세종특별자치시','세종특별자치시'],
      '여수':['전라남도','여수시'],'순천':['전라남도','순천시'],'광양':['전라남도','광양시'],
      '제주':['제주특별자치도','제주시'],'서귀포':['제주특별자치도','서귀포시']
    };
    const a=aliases[s];
    return a?{region:a[0],district:a[1]}:{region:'',district:''};
  }

  function fullPlace(region,district) {
    if (!region || !district) return '';
    return `${region} ${district}`;
  }

  function updateDistricts(region,selected='') {
    const d=$('birthDistrictV45');
    if (!d) return;
    d.replaceChildren(new Option('시·군·구 선택',''));
    for (const name of (ADMIN[region]||[])) d.appendChild(new Option(name,name));
    d.disabled=!region;
    if (selected && ADMIN[region]?.includes(selected)) d.value=selected;
  }

  function setStoredSelection(region,district) {
    const hidden=$('birthPlace');
    const place=fullPlace(region,district);
    if (hidden) hidden.value=place;
    if (place) localStorage.setItem(PLACE_KEY,place); else localStorage.removeItem(PLACE_KEY);
    if (region) localStorage.setItem(REGION_KEY,region); else localStorage.removeItem(REGION_KEY);
    if (district) localStorage.setItem(DISTRICT_KEY,district); else localStorage.removeItem(DISTRICT_KEY);
    syncCoordinateForSelection();
  }

  function syncCoordinateForSelection() {
    const region=clean($('birthRegionV45')?.value || localStorage.getItem(REGION_KEY));
    const district=clean($('birthDistrictV45')?.value || localStorage.getItem(DISTRICT_KEY));
    const point=coordinateMap[`${region}::${district}`];
    if (point && point.every(Number.isFinite)) {
      localStorage.setItem(LAT_KEY,String(point[0]));
      localStorage.setItem(LON_KEY,String(point[1]));
      updateCoordinateStatus('ready');
      return point;
    }
    localStorage.removeItem(LAT_KEY); localStorage.removeItem(LON_KEY);
    updateCoordinateStatus(coordinatePromise?'loading':'loading');
    return null;
  }

  function updateCoordinateStatus(forced='') {
    const el=$('birthPlaceStatusV45');
    if (!el) return;
    const lat=Number(localStorage.getItem(LAT_KEY)),lon=Number(localStorage.getItem(LON_KEY));
    const ready=Number.isFinite(lat)&&Number.isFinite(lon)&&lat>0&&lon>0;
    el.className=`lunea-place-status-v45 ${ready||forced==='ready'?'ready':'loading'}`;
    el.innerHTML=`<span>${DATA_VERSION.slice(0,4)}.${DATA_VERSION.slice(4,6)}.${DATA_VERSION.slice(6)} · 전국 ${ADMIN_COUNT}개 시·군·구</span><b>${ready?'대표좌표 적용 완료':'대표좌표 불러오는 중'}</b>`;
  }

  function ensureBirthPlacePicker() {
    const current=$('birthPlace');
    if (!current) return false;
    if (current.type==='hidden' && current.dataset.luneaPlaceV45==='1') return true;
    const field=current.closest('.field');
    if (!field) return false;

    const saved=clean(localStorage.getItem(PLACE_KEY) || current.value);
    const inferred=inferSaved(saved);
    const label=field.querySelector('label');
    if (label) label.textContent='출생지';

    const hidden=document.createElement('input');
    hidden.type='hidden'; hidden.id='birthPlace'; hidden.dataset.luneaPlaceV45='1';
    hidden.value=fullPlace(inferred.region,inferred.district) || saved;

    const wrap=document.createElement('div');
    wrap.className='lunea-place-picker-v45';
    wrap.innerHTML=`
      <select id="birthRegionV45" aria-label="출생 시·도"><option value="">시·도 선택</option></select>
      <select id="birthDistrictV45" aria-label="출생 시·군·구" disabled><option value="">시·군·구 선택</option></select>
      <div class="lunea-place-status-v45" id="birthPlaceStatusV45"></div>`;

    current.replaceWith(hidden);
    hidden.insertAdjacentElement('afterend',wrap);
    const r=$('birthRegionV45'),d=$('birthDistrictV45');
    for (const name of Object.keys(ADMIN)) r.appendChild(new Option(name,name));
    if (inferred.region) {
      r.value=inferred.region; updateDistricts(inferred.region,inferred.district);
      setStoredSelection(inferred.region,inferred.district);
    } else updateDistricts('');

    r.addEventListener('change',()=>{updateDistricts(r.value,'');setStoredSelection(r.value,'');});
    d.addEventListener('change',()=>setStoredSelection(r.value,d.value));
    updateCoordinateStatus();
    loadCoordinateMap();
    return true;
  }

  function addStyle() {
    if ($('luneaProfileNatalV45Style')) return;
    const s=document.createElement('style'); s.id='luneaProfileNatalV45Style';
    s.textContent=`
      #profileOverlay .lunea-place-picker-v45{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;width:100%;min-width:0}
      #profileOverlay .lunea-place-picker-v45 select{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;background:rgba(255,255,255,.055)!important}
      #profileOverlay .lunea-place-status-v45{grid-column:1/-1;display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:1px;padding:6px 8px;border-radius:9px;border:1px solid rgba(189,164,248,.11);background:rgba(189,164,248,.035);font-size:8.2px;line-height:1.35;color:var(--dim)}
      #profileOverlay .lunea-place-status-v45 b{font-size:8px;color:#cabbea;white-space:nowrap}.lunea-place-status-v45.ready b{color:#bfe7d2!important}
      @media(max-width:390px){#profileOverlay .lunea-place-picker-v45{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function installNatalCoordinateInjection() {
    if (window.__LUNEA_NATAL_COORDS_V45__ || typeof window.fetch!=='function') return;
    window.__LUNEA_NATAL_COORDS_V45__=true;
    const prior=window.fetch.bind(window);
    window.fetch=async function(input,init={}) {
      let raw='';
      try { raw=typeof input==='string'?input:String(input?.url||''); } catch {}
      if (!/\/v1\/natal(?:\?|$)/i.test(raw)) return prior(input,init);

      let nextInit={...init};
      try {
        let lat=Number(localStorage.getItem(LAT_KEY)),lon=Number(localStorage.getItem(LON_KEY));
        if (!(Number.isFinite(lat)&&Number.isFinite(lon)&&lat>0&&lon>0)) {
          await loadCoordinateMap();
          const point=syncCoordinateForSelection();
          lat=Number(point?.[0]); lon=Number(point?.[1]);
        }
        if (Number.isFinite(lat)&&Number.isFinite(lon)&&lat>0&&lon>0) {
          let body=nextInit.body;
          if (typeof body==='string') {
            const json=JSON.parse(body);
            json.lat=lat; json.lon=lon;
            if (!json.place) json.place=clean(localStorage.getItem(PLACE_KEY));
            nextInit.body=JSON.stringify(json);
          }
        }
      } catch (e) { console.warn('[LUNEA V45] natal coordinate injection skipped',e); }
      return prior(input,nextInit);
    };
  }

  function repair() { addStyle(); ensureStrengthOption(); ensureBirthPlacePicker(); }

  installNatalCoordinateInjection();
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',repair,{once:true}); else repair();
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair();});};
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
  console.info('✦ LUNEA PROFILE + NATAL RECOVERY V45 loaded · nationwide 230 selector');
})();
