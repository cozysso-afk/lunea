import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-meihua-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');

assert.ok(loader.indexOf('loadMeihuaEngineV1();') < loader.indexOf('loadMeihuaV1();'),
  'production loader must load the deterministic engine before the Meihua interpreter');
assert.ok(loader.indexOf('loadMeihuaV1();') < loader.indexOf('loadMeihuaPolishV1();'),
  'production loader must keep the direct Meihua interpreter ahead of its polish shim');

const classList = {add(){}, remove(){}, toggle(){}, contains(){ return false; }};
const nodes = {
  mhQuestion:{value:'그 사람은 왜 연락이 뜸해졌고, 내가 무엇을 확인해야 할까?'},
  mhStatus:{textContent:'', className:''},
  mhFlow:{innerHTML:''},
  mhEvidence:{innerHTML:''},
  mhRelation:{innerHTML:''},
  mhProvenance:{textContent:''},
  mhAIText:{textContent:'', classList},
  mhBoard:{classList},
  mhAI:{disabled:false, textContent:'🔮 AI 해석'}
};

const result = {
  methodKo:'연·월·일·시 기괘법',
  questionTime:{
    timeZone:'Asia/Seoul',
    local:{year:2026,month:10,day:12,hour:19,minute:2},
    lunar:{relatedYear:2026,isLeapMonth:false,month:8,day:13},
    yearBranch:{hanja:'午',n:7},
    hourBranch:{hanja:'未',n:8}
  },
  arithmetic:{upperSum:21,upperRemainder:5,total:30,lowerRemainder:6},
  movingLine:6,
  primary:{number:59,hanja:'風水渙',ko:'풍수환',upper:{hanja:'巽',symbol:'☴'},lower:{hanja:'坎',symbol:'☵'},lines:[0,1,0,0,1,1]},
  mutual:{number:27,hanja:'山雷頤',ko:'산뢰이',upper:{hanja:'艮',symbol:'☶'},lower:{hanja:'震',symbol:'☳'},lines:[1,0,0,0,0,1]},
  changed:{number:29,hanja:'坎爲水',ko:'감위수',upper:{hanja:'坎',symbol:'☵'},lower:{hanja:'坎',symbol:'☵'},lines:[0,1,0,0,1,0]},
  bodyUse:{
    body:{hanja:'坎',symbol:'☵',ko:'감',elementKo:'수'},
    use:{hanja:'巽',symbol:'☴',ko:'손',elementKo:'목'},
    changedUse:{hanja:'坎',symbol:'☵',ko:'감',elementKo:'수'},
    movingSide:'upper',
    primaryRelation:{hanja:'體生用',ko:'체생용',summary:'질문자 쪽의 자원이 외부 작용으로 향한다.'},
    changedRelation:{hanja:'比和',ko:'비화',summary:'변화 후에는 같은 오행의 균형을 본다.'}
  },
  provenance:{
    trigramNumbering:'선천팔괘 수',
    branchNumbering:'자=1',
    remainderRule:'나머지 0은 8/6',
    dayBoundary:'civil midnight 00:00',
    timeZone:'Asia/Seoul'
  }
};

const calls = [];
const window = {
  LUNEA_MEIHUA_ENGINE_V1:{calculateAt(){ return result; }},
  addEventListener(){}
};
window.window = window;
const document = {
  readyState:'loading',
  addEventListener(){},
  getElementById(id){ return nodes[id] || null; }
};
const context = vm.createContext({
  window,
  document,
  localStorage:{
    getItem(key) {
      if (key === 'LUNEA_API_KEY') return 'test-key';
      if (key === 'LUNEA_MODEL') return 'gemini-test';
      return null;
    }
  },
  fetch:async (url, init) => {
    calls.push({url,init});
    return {
      ok:true,
      status:200,
      async json(){ return {candidates:[{content:{parts:[{text:'검증용 해설'}]}}]}; }
    };
  },
  alert(){},
  console:{error(){},info(){}},
  Date,
  Intl,
  JSON,
  Math,
  Object,
  String,
  Array,
  Promise,
  Error,
  encodeURIComponent,
  setTimeout(){}
});

vm.runInContext(source, context, {filename:'lunea-meihua-v1.js'});
const api = window.LUNEA_MEIHUA_V1;
assert.ok(api, 'Meihua public API must be exposed');
assert.equal(typeof api.runAI, 'function', 'minimal runtime hook must exercise the same fetch path as the AI button');

api.castNow();
await api.runAI();

assert.equal(calls.length, 1, 'the active AI path must make exactly one stubbed request');
assert.match(calls[0].url, /models\/gemini-test:generateContent\?key=test-key$/);
const payload = JSON.parse(calls[0].init.body);
assert.deepEqual(payload.generationConfig, {temperature:0.55,topP:0.9},
  'prompt-policy work must not change generation settings');
const prompt = payload.contents?.[0]?.parts?.[0]?.text;
assert.equal(typeof prompt, 'string', 'the actual fetch body must contain the generated Meihua prompt');
assert.match(prompt, /그 사람은 왜 연락이 뜸해졌고, 내가 무엇을 확인해야 할까\?/);
assert.match(prompt, /본괘: 59 風水渙\(풍수환\)/,
  'the prompt must still carry frozen engine evidence rather than recalculate it');
assert.match(prompt, /본괘=현재 구조, 호괘=내부 과정, 변괘=변화 후 흐름/);
assert.match(prompt, /동효 위치.*체·용 관계를 핵심 근거/);
assert.match(prompt, /현재\/변화 후 체용/);
assert.match(prompt, /실제로 제공된 지지·제한·반대 신호를 모두 확인하고 비교/);
assert.match(prompt, /질문 적합성 → 동효가 가리키는 변화 단계 → 체용의 직접성 → 반복\/독립성/);
assert.match(prompt, /결론의 강도와 분량은 근거의 직접성·반복\/독립성·변화 단계에 비례/);
assert.match(prompt, /근거가 비슷하면 혼합\/조건부/);
assert.match(prompt, /허위 균형/);
assert.match(prompt, /구조에서 가능한 가설과 사용자가 확인할 수 있는 관찰 포인트를 구분/);
assert.match(prompt, /질문이 실제 상호작용·연락·만남·행동 조언에 관한 경우에만/);
assert.match(prompt, /안전 모드나 위기 대응을 강제하지 않는다/);
assert.match(prompt, /질문에 사람의 자유의지나 외부 변수가 있으면 조건부로 표현/);
assert.match(prompt, /### 지지·제한 근거 비교/);
assert.doesNotMatch(prompt, /\bRWS\b|20%|20퍼센트/,
  'tarot-specific RWS or 20% policy must not be copied into the standalone Meihua path');
assert.equal(nodes.mhAIText.textContent, '검증용 해설', 'the stubbed response should traverse the live UI completion path');

console.log('Balanced Meihua prompt fetch-body contract: PASS');
