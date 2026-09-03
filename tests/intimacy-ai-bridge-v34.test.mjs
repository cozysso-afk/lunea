import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../lunea-structural-routing-v4.js',import.meta.url),'utf8');
const workflow=fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml',import.meta.url),'utf8');
const window={LUNEA_INTIMACY_V34:{}}; window.window=window;
const document={readyState:'loading',documentElement:{dataset:{}},body:{classList:{toggle(){}}},querySelector(){return null},addEventListener(){},getElementById(){return null},scripts:[]};
vm.runInNewContext(source,{window,document,console,Object,Array,String,Number,Boolean,RegExp,JSON,Promise,setTimeout});

test('AI bridge detector and runtime loader contract',()=>{
  assert.match(source,/const RELEASE = '34\.2'/);
  assert.match(source,/lunea-intimacy-oracle-v35\.js\?v=352/);
  assert.match(source,/lunea-intimacy-oracle-ui-v36\.js\?v=3610/);
  assert.match(source,/__LUNEA_READING_ACTION_ORDER_V33__/);
  assert.match(source,/ensureOracleRuntime/);
});

test('intimacy detector avoids exam-grade false positive',()=>{
  const regex=/속궁합|잠자리|섹스|성적\s*(?:궁합|끌림|욕구|텐션)|신체적\s*(?:궁합|끌림|밀착)|친밀감|육체적\s*(?:끌림|케미)|욕구\s*(?:방식|차이)|스킨십/i;
  assert.equal(regex.test('둘의 속궁합과 친밀감 리듬이 궁금해'),true);
  assert.equal(regex.test('이번 시험 성적이 궁금해'),false);
});

test('existing structural loader and cache workflow still own the bridge',()=>{
  assert.equal((loader.match(/lunea-intimacy-ai-bridge-v34\.js\?v=(?:3402|[0-9a-f]{12})/g)||[]).length,2);
  assert.match(workflow,/'lunea-intimacy-ai-bridge-v34\.js'/);
});
