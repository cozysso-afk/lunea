import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

function runtime(){
  const values=new Map();
  const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const document={readyState:'loading',getElementById(){return null},querySelector(){return null},addEventListener(){},body:{appendChild(){},classList:{add(){},remove(){}}},head:{appendChild(){}}};
  const window={addEventListener(){}};window.window=window;
  const base={window,document,localStorage,console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},clearTimeout(){},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},Date,Math,Set,Map,JSON,String,Array,Number,Error,fetch:async()=>({ok:true,json:async()=>[]})};
  vm.runInNewContext(read('lunea-user-spread-learning-v1.js'),base);
  vm.runInNewContext(read('lunea-learning-cloud-sync-v1.js'),base);
  return {learning:window.LUNEA_SPREAD_LEARNING_V1,cloud:window.LUNEA_LEARNING_CLOUD_SYNC_V1};
}

test('canonical upgrader converts legacy v2 cloud payloads to v3 before merge',()=>{
  const {learning,cloud}=runtime();
  assert.equal(typeof learning.upgradeRow,'function');
  assert.equal(cloud.version,2);
  const old={
    question:'이미 끝난 만남에서 상대는 그날을 어떻게 받아들이고 있나?',
    questionKey:'이미끝난만남에서상대는그날을어떻게받아들이고있나',
    category:'LOVE',positions:['당시 인식','현재 의미'],source:'manual',updatedAt:100,
    structureProfile:{version:2,domain:'relationship',target:'single_or_unspecified',modes:['general'],stage:'current_or_unspecified'}
  };
  const upgraded=cloud.normalizeCloudRow({question_key:`LOVE::${old.questionKey}`,source:'manual',payload:old,updated_at:'2026-09-04T00:00:00Z'});
  assert.equal(upgraded.structureProfile.version,3);
  assert.equal(upgraded.structureProfile.domain,'relationship');
  assert.equal(upgraded.structureProfile.stage,'after');
  assert.ok(upgraded.structureProfile.modes.includes('perception'));
});

test('remote-newer merge still returns v3 timing/cause/outcome profiles',()=>{
  const {cloud}=runtime();
  const remote=[{
    question_key:'LOVE::legacy',source:'ai_correction',updated_at:'2026-09-04T10:00:00Z',payload:{
      question:'이번 달 안에 연락이 올 가능성과 연락을 막는 장애물, 결국 관계가 어떻게 정리되는지?',
      questionKey:'legacy',category:'LOVE',positions:['가능성','장애물','결과'],updatedAt:200,
      structureProfile:{version:2,domain:'relationship',target:'single_or_unspecified',modes:['action'],stage:'current_or_unspecified'}
    }
  }];
  const merged=cloud.mergeRows([],remote);
  assert.equal(merged.length,1);
  const p=merged[0].structureProfile;
  assert.equal(p.version,3);
  assert.ok(p.modes.includes('timing'));
  assert.ok(p.modes.includes('cause'));
  assert.ok(p.modes.includes('outcome'));
});

test('loader cache keys force v3 learning and cloud sync code onto clients',()=>{
  const loader=read('lunea-structural-routing-v4.js');
  assert.equal((loader.match(/lunea-user-spread-learning-v1\.js\?v=108/g)||[]).length,2);
  assert.equal((loader.match(/lunea-learning-cloud-sync-v1\.js\?v=104/g)||[]).length,2);
});
