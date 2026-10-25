import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../lunea-reading-polish-v14.js',import.meta.url),'utf8');
const start=code.indexOf('  const AB_DEFAULT_AXES = ');
const end=code.indexOf('  function previewLines()',start);
assert.ok(start>0 && end>start,'A/B preview builder source missing');
const context={
  console:{warn(){},error(){}},
  W:{},
  stripNum:v=>String(v||'').replace(/^\s*\d{1,2}\s*[.)]\s*/,'').trim(),
  clean:v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim()
};
vm.createContext(context);
vm.runInContext(code.slice(start,end)+'\nthis.pair24=pair24FromSpread;this.prepare24=preparePair24;',context);

const old22={
  spreadTitle:'A/B 완전 대칭 비교 · 11축 × 2',
  layoutType:'dual-compare-exact',
  positions:[
    ...Array.from({length:11},(_,i)=>(i+1)+'. A · 축 '+(i+1)+' · 사용자 요구축 '+(i+1)),
    ...Array.from({length:11},(_,i)=>(i+12)+'. B · 축 '+(i+1)+' · 사용자 요구축 '+(i+1))
  ]
};
const old12={
  spreadTitle:'A/B 대칭 비교 · 6축 × 2',
  positions:[
    ...Array.from({length:6},(_,i)=>'A — 공통 축 '+(i+1)),
    ...Array.from({length:6},(_,i)=>'B — 공통 축 '+(i+1))
  ]
};
const check=spread=>{
  assert.equal(spread.positions.length,24,'must have 12+12 positions');
  assert.equal(spread.__luneaAB24,true);
  assert.equal(spread.__luneaABAxes.length,12);
  assert.equal(new Set(spread.__luneaABAxes).size,12);
  for(let i=0;i<12;i++){
    const left=spread.positions[i].replace(/^\d+\. A · 축 \d+ · /,'');
    const right=spread.positions[i+12].replace(/^\d+\. B · 축 \d+ · /,'');
    assert.equal(left,right,'A and B must share axis order');
  }
};
const pair22=context.pair24(old22,'A와 B 두 사람을 비교해줘');
check(pair22);
assert.match(pair22.positions[10],/사용자 요구축 11/,'eleventh user axis must survive');
assert.match(pair22.positions[11],/현재 관계의 상태와 거리감/,'only missing axis is supplemented');
check(context.pair24(old12,'A와 B 두 사람을 비교해줘'));
const expected24=context.pair24(pair22,'A와 B 두 사람을 비교해줘');
check(expected24);
assert.deepEqual([...expected24.positions],[...pair22.positions],'already symmetric 24 must remain stable');
const local=context.pair24(null,'A와 B 두 사람을 비교해줘');
check(local);
assert.equal(local.__luneaABLocalFallback,true);

context.W.designSpread=async()=>old22;
check(await context.prepare24('A와 B 두 사람을 비교해줘'));
context.W.designSpread=async()=>{throw Error('Gemini unavailable')};
check(await context.prepare24('A와 B 두 사람을 비교해줘'));
context.W.designSpread=async()=>({positions:[],spreadTitle:'broken upstream'});
check(await context.prepare24('A와 B 두 사람을 비교해줘'));
assert.match(code,/return original|return previousStartSpread|W\.startSpread\(/,'normal reading start remains available');
assert.ok(!/W\.startSpread\s*=/.test(code),'V14 must not wrap startSpread');
console.log('LUNEA A/B 24-card preflight recovery regression PASS');
