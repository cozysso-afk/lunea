'use strict';

/*
 LUNEA CELESTIAL PROFILE SELECT UI V2.1
 Load AFTER the advanced profile module

 Converts typing-heavy fields into mobile-friendly selectors:
 - Four Pillars: 60 Gan-Zhi dropdowns
 - Five Elements: 0~8 dropdowns
 - Ten Gods: multi-select chips
 - Yongshin / Heeshin / Gishin: Five Element multi-select chips

 Existing IDs are preserved so profile-advanced-v2.js save/load logic keeps working.
*/
(() => {
  if (window.__LUNEA_PROFILE_SELECT_UI_V21__) return;
  window.__LUNEA_PROFILE_SELECT_UI_V21__ = true;

  const GANZHI = ["甲(갑)子(자)", "乙(을)丑(축)", "丙(병)寅(인)", "丁(정)卯(묘)", "戊(무)辰(진)", "己(기)巳(사)", "庚(경)午(오)", "辛(신)未(미)", "壬(임)申(신)", "癸(계)酉(유)", "甲(갑)戌(술)", "乙(을)亥(해)", "丙(병)子(자)", "丁(정)丑(축)", "戊(무)寅(인)", "己(기)卯(묘)", "庚(경)辰(진)", "辛(신)巳(사)", "壬(임)午(오)", "癸(계)未(미)", "甲(갑)申(신)", "乙(을)酉(유)", "丙(병)戌(술)", "丁(정)亥(해)", "戊(무)子(자)", "己(기)丑(축)", "庚(경)寅(인)", "辛(신)卯(묘)", "壬(임)辰(진)", "癸(계)巳(사)", "甲(갑)午(오)", "乙(을)未(미)", "丙(병)申(신)", "丁(정)酉(유)", "戊(무)戌(술)", "己(기)亥(해)", "庚(경)子(자)", "辛(신)丑(축)", "壬(임)寅(인)", "癸(계)卯(묘)", "甲(갑)辰(진)", "乙(을)巳(사)", "丙(병)午(오)", "丁(정)未(미)", "戊(무)申(신)", "己(기)酉(유)", "庚(경)戌(술)", "辛(신)亥(해)", "壬(임)子(자)", "癸(계)丑(축)", "甲(갑)寅(인)", "乙(을)卯(묘)", "丙(병)辰(진)", "丁(정)巳(사)", "戊(무)午(오)", "己(기)未(미)", "庚(경)申(신)", "辛(신)酉(유)", "壬(임)戌(술)", "癸(계)亥(해)"];
  const TEN_GODS = [
    '비견','겁재','식신','상관','편재',
    '정재','편관','정관','편인','정인'
  ];
  const FIVE = ['목 木','화 火','토 土','금 金','수 水'];

  function addStyles(){
    if(document.getElementById('luneaProfileSelectV21Style')) return;
    const s=document.createElement('style');
    s.id='luneaProfileSelectV21Style';
    s.textContent=`
      .lunea-chip-wrap{
        display:flex;flex-wrap:wrap;gap:6px;margin-top:6px
      }
      .lunea-choice-chip{
        appearance:none;border:1px solid rgba(189,164,248,.23);
        background:rgba(255,255,255,.045);color:#d8d0e3;
        border-radius:10px;padding:7px 9px;font-size:10.5px;font-weight:650;
        cursor:pointer;touch-action:manipulation
      }
      .lunea-choice-chip.active{
        color:#fff3d3;border-color:rgba(255,210,125,.52);
        background:linear-gradient(135deg,rgba(189,164,248,.19),rgba(255,210,125,.13));
        box-shadow:0 0 12px rgba(189,164,248,.09)
      }
      .lunea-select-help{
        margin:5px 0 1px;font-size:9px;line-height:1.45;color:var(--dim)
      }
      .lunea-hidden-source{
        position:absolute!important;width:1px!important;height:1px!important;
        opacity:0!important;pointer-events:none!important;overflow:hidden!important
      }
      .lunea-pillar-select{font-size:12px!important}
      .lunea-element-select{text-align:center;padding-left:4px!important;padding-right:4px!important}
    `;
    document.head.appendChild(s);
  }

  function replaceInputWithSelect(id, options, className=''){
    const old=document.getElementById(id);
    if(!old || old.tagName==='SELECT') return old;
    const select=document.createElement('select');
    select.id=id;
    select.className=className;
    select.innerHTML=`<option value="">미입력</option>`+
      options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('');
    const previous=(old.value||'').trim();
    old.replaceWith(select);
    if(previous){
      const exact=[...select.options].find(o=>o.value===previous);
      if(exact){
        select.value=exact.value;
      }else{
        const han=previous.replace(/[^甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g,'');
        const ko=previous.replace(/[^가-힣]/g,'');
        const match=[...select.options].find(o=>{
          const oh=o.value.replace(/[^甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g,'');
          const ok=o.value.replace(/[^가-힣]/g,'');
          return (han && oh===han) || (ko && ok===ko);
        });
        if(match) select.value=match.value;
      }
    }
    return select;
  }

  function installPillarSelectors(){
    const opts=GANZHI.map(x=>({value:x,label:x}));
    ['sajuYearPillar','sajuMonthPillar','sajuDayPillar','sajuHourPillar']
      .forEach(id=>replaceInputWithSelect(id,opts,'lunea-pillar-select'));
  }

  function installElementSelectors(){
    const opts=[
      {value:'0',label:'0 · 없음'},
      {value:'1',label:'1'},
      {value:'2',label:'2'},
      {value:'3',label:'3'},
      {value:'4',label:'4'},
      {value:'5',label:'5'},
      {value:'6',label:'6'},
      {value:'7',label:'7'},
      {value:'8',label:'8'}
    ];
    ['elemWood','elemFire','elemEarth','elemMetal','elemWater']
      .forEach(id=>replaceInputWithSelect(id,opts,'lunea-element-select'));

    const first=document.getElementById('elemWood')?.closest('.lunea-profile-grid');
    if(first && !first.nextElementSibling?.classList?.contains('lunea-element-count-help')){
      const p=document.createElement('p');
      p.className='lunea-select-help lunea-element-count-help';
      p.textContent='만세력에서 표시된 목·화·토·금·수 개수를 그대로 선택해. 모르면 미입력으로 둬도 돼.';
      first.insertAdjacentElement('afterend',p);
    }
  }

  function parseSelected(raw, allowed){
    const s=String(raw||'').trim();
    if(!s) return [];
    return allowed.filter(x=>s.includes(x.split(' ')[0]) || s.includes(x));
  }

  function makeChipEditor(sourceId, values, multi=true){
    const source=document.getElementById(sourceId);
    if(!source || source.dataset.chipEnhanced==='1') return;
    source.dataset.chipEnhanced='1';

    const existing=source.value||'';
    source.classList.add('lunea-hidden-source');

    const box=document.createElement('div');
    box.className='lunea-chip-wrap';
    box.dataset.for=sourceId;

    function sync(){
      const selected=[...box.querySelectorAll('.lunea-choice-chip.active')]
        .map(b=>b.dataset.value);
      source.value=selected.join(', ');
      source.dispatchEvent(new Event('change',{bubbles:true}));
    }

    values.forEach(v=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='lunea-choice-chip';
      b.dataset.value=v;
      b.textContent=v;
      const key=v.split(' ')[0];
      if(existing.includes(v)||existing.includes(key)) b.classList.add('active');
      b.addEventListener('click',()=>{
        if(!multi){
          box.querySelectorAll('.lunea-choice-chip').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
        }else{
          b.classList.toggle('active');
        }
        sync();
      });
      box.appendChild(b);
    });

    source.insertAdjacentElement('afterend',box);
  }

  function installChipEditors(){
    makeChipEditor('sajuTenGods',TEN_GODS,true);

    const tg=document.querySelector('[data-for="sajuTenGods"]');
    if(tg && !tg.previousElementSibling?.classList?.contains('lunea-ten-god-help')){
      const p=document.createElement('p');
      p.className='lunea-select-help lunea-ten-god-help';
      p.textContent='만세력에서 실제로 두드러진 십성만 여러 개 선택해.';
      tg.insertAdjacentElement('beforebegin',p);
    }

    ['sajuYongshin','sajuHeeshin','sajuGishin'].forEach(id=>{
      makeChipEditor(id,FIVE,true);
    });
  }

  function refreshChipsFromLoadedValues(){
    document.querySelectorAll('.lunea-chip-wrap').forEach(box=>{
      const source=document.getElementById(box.dataset.for);
      if(!source) return;
      const raw=source.value||'';
      box.querySelectorAll('.lunea-choice-chip').forEach(b=>{
        const key=b.dataset.value.split(' ')[0];
        b.classList.toggle('active', raw.includes(b.dataset.value)||raw.includes(key));
      });
    });
  }

  function wrapLoadProfile(){
    if(typeof loadProfileForm!=='function' || window.__LUNEA_PROFILE_SELECT_LOAD_WRAPPED__) return;
    window.__LUNEA_PROFILE_SELECT_LOAD_WRAPPED__=true;
    const old=loadProfileForm;
    loadProfileForm=function(){
      old.apply(this,arguments);
      setTimeout(refreshChipsFromLoadedValues,0);
    };
  }

  function boot(){
    addStyles();
    installPillarSelectors();
    installElementSelectors();
    installChipEditors();
    wrapLoadProfile();

    // profile V2 may have already populated values before this patch booted.
    try{
      if(typeof loadAdvancedFields==='function') loadAdvancedFields();
    }catch{}
    refreshChipsFromLoadedValues();

    console.info('✦ LUNEA PROFILE SELECT UI V2.1 loaded');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
