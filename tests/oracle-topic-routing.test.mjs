import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function classifier(file, reading, readOnly = true) {
  const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const window = {state:reading};
  const document = {
    readyState:'loading',
    addEventListener(){},
    getElementById(id){return id === 'astroHoraryQuestion' ? {readOnly} : null;}
  };
  const context = vm.createContext({window, document, console, state:reading});
  // Expose the existing closure function only inside the isolated test VM.
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'window.testInferTopic = inferTopic; })();'), context);
  return window.testInferTopic;
}

const thaiFile = 'lunea-thai-tarot-bridge-v32.js';
const horaryFile = 'lunea-horary-balance-v19-5.js';

test('Thai uses supported API topics and the exact active reading sector', () => {
  const question = '그는 나를 어떻게 생각할까?';
  for (const [category, topic] of Object.entries({LOVE:'연애', INTIMACY:'연애', STOCK:'투자심리', CAREER:'직장', STUDY:'학업', GENERAL:'general'})) {
    const infer = classifier(thaiFile, {category, question});
    assert.equal(infer(question), topic, category);
    assert.equal(infer('별다른 일이 있을까?'), 'general', 'unrelated question must not inherit the sector');
    assert.equal(infer(''), 'general', 'empty question must not inherit the sector');
    assert.equal(infer('이번 시험 결과 연락이 올까?'), '시험');
    assert.equal(infer('그와 성적 끌림은 어떤가?'), '연애');
    assert.equal(infer('그와 속궁합은 어떤가?'), '연애');
    assert.equal(infer('전남친과 다시 만나게 될까?'), '재회');
    assert.equal(infer('이 종목은 언제 오를까?'), '투자심리');
    assert.equal(infer('취업은 언제 할 수 있을까?'), '직장');
  }
});

test('Horary inherits a sector only in support mode with an identical question', () => {
  const question = '그는 나를 어떻게 생각할까?';
  for (const [category, topic] of Object.entries({LOVE:'relationship', INTIMACY:'relationship', STOCK:'stock', CAREER:'career', STUDY:'exam', GENERAL:'general'})) {
    assert.equal(classifier(horaryFile, {category, question})(question), topic, category);
    assert.equal(classifier(horaryFile, {category, question}, false)(question), 'general', 'standalone must not inherit stale tarot');
    assert.equal(classifier(horaryFile, {category, question})('별다른 일이 있을까?'), 'general');
  }
  const infer = classifier(horaryFile, {category:'LOVE', question});
  assert.equal(infer('시험 결과 연락이 올까?'), 'exam');
  assert.equal(infer('그와 성적 끌림은 어떤가?'), 'relationship');
  assert.equal(infer('전남친과 다시 만나게 될까?'), 'reconciliation');
  assert.equal(infer('취업은 언제 할 수 있을까?'), 'career');
});
