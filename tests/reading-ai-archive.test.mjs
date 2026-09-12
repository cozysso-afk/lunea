import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('actual save handler stores completed AI text with cards and question; Journal renders it after serialization',()=>{
 const ai='합성 AI 해설: 제한과 긍정 근거를 함께 확인했어.\n두 번째 문단도 보존.';
 const nodes={saveReading:{},aiText:{textContent:ai}};let saved;
 const sandbox={$:id=>nodes[id],getArchive:()=>[],setArchive:rows=>saved=JSON.parse(JSON.stringify(rows)),secureId:()=> 'test-reading',alert(){},state:{title:'합성 배열',question:'합성 질문',rationale:'합성',drawn:[{position:'현재',name:'The Magician',isReversed:false,subCards:[]}]}};
 vm.runInNewContext(read('index.html').split('\n').find(line=>line.startsWith("$('saveReading').onclick=")),sandbox);
 nodes.saveReading.onclick();assert.equal(saved[0].ai,ai);assert.equal(saved[0].q,'합성 질문');assert.equal(saved[0].cards[0].name,'The Magician');
 const journal=read('lunea-reading-journal-v2.js'),render={};
 vm.runInNewContext(journal.slice(journal.indexOf('  function readingText('),journal.indexOf('  function entryText('))+'this.render=readingText;',render);
 assert.ok(render.render(saved[0]).includes('[AI 해석]\n'+ai));
 delete nodes.aiText;nodes.saveReading.onclick();assert.equal(saved[0].ai,'');
});
