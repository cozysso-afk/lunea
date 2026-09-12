import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
function harness(){const c={console,document:{readyState:'loading'},addEventListener(){},setTimeout(){},setInterval(){},clearInterval(){}};c.window=c;vm.createContext(c);const html=read('index.html');vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('// State / profile / storage'))+'this.deck=TAROT_DECK;',c);vm.runInContext(read('lunea-tarot-reference-v1.js'),c);return c}
test('all 78 live deck identities and archive names resolve, with distinct upright/reversed meanings',()=>{
 const h=harness(),api=h.LUNEA_TAROT_REFERENCE_V1;assert.equal(Object.keys(api.cards).length,78);
 for(const card of h.deck){assert.equal(api.identify(card),card.code);assert.equal(api.identify({name:card.name}),card.code);const row=api.cards[card.code];assert.notEqual(row.upright,row.reversed);
 for(const isReversed of [false,true]){const text=api.build({drawn:[{...card,position:'対象',isReversed}]});assert.ok(text.includes(row[isReversed?'reversed':'upright']));assert.ok(!text.includes(row[isReversed?'upright':'reversed']));assert.ok(text.includes(row.limit));assert.doesNotMatch(text,/資料未|資料未接|undefined/);}}
});
test('clarifiers retain exact parent, identity and direction without mutating cards',()=>{
 const h=harness(),api=h.LUNEA_TAROT_REFERENCE_V1;const reading={drawn:[{name:'The Lovers',position:'감정',subCards:[{name:'Two of Swords',isReversed:true}]},{name:'Four of Cups',position:'행동',subCards:[]}]};const before=JSON.stringify(reading),text=api.build(reading);assert.ok(text.includes('1번 본 카드의 보조 1'));assert.ok(text.includes(api.cards.Swords02.reversed));assert.ok(text.includes(api.cards.Cups04.upright));assert.equal(JSON.stringify(reading),before);
});
test('unknown and inconsistent identities receive no substitute reference; empty reading has no block',()=>{
 const api=harness().LUNEA_TAROT_REFERENCE_V1;assert.equal(api.build({drawn:[]}), '');assert.equal(api.identify({code:'Sun',name:'The Moon'}),null);assert.match(api.build({drawn:[{name:'Unknown custom card'}]}),/자료 미연결/);
});
test('final prompt replaces old reference with current cards, never leaking a previous reading',()=>{
 const h=harness();h.state={drawn:[{name:'The Moon',position:'감정'}]};h.promptString=()=> '[질문 원문]\n질문\n\n[질문 유형]\nlove';vm.runInContext(read('lunea-final-prompt-priority-v1.js'),h);
 const first=h.promptString();assert.match(first,/모호한 정보 속/);const before=h.LUNEA_TAROT_REFERENCE_V1.strip(first);h.promptString=()=>first;h.state={drawn:[{name:'The Sun',position:'행동'}]};h.LUNEA_FINAL_PROMPT_PRIORITY_V1.ensure();const next=h.promptString();assert.equal(next.match(/\[RWS REFERENCE V1 ·/g).length,1);assert.doesNotMatch(next,/모호한 정보 속/);assert.match(next,/명료함과 활력/);assert.ok(before);
});
test('reference loads before final assembler in production feature group',()=>{const s=read('lunea-structural-routing-v4.js');assert.ok(s.indexOf("'./lunea-tarot-reference-v1.js")<s.indexOf("'./lunea-final-prompt-priority-v1.js"))});
test('12 expert-evaluation cases resolve all main and clarifier cards and remain explicitly unscored',()=>{
 const h=harness(),f=JSON.parse(read('tests/fixtures/tarot-expert-evaluation-v1.json'));assert.equal(f.status,'not_generated_not_scored');assert.equal(f.cases.length,12);
 for(const row of f.cases){for(const [code] of row.cards)assert.ok(h.LUNEA_TAROT_REFERENCE_V1.cards[code],row.id+code);for(const sub of row.clarifiers||[]){assert.ok(row.cards[sub.parent]);assert.ok(h.LUNEA_TAROT_REFERENCE_V1.cards[sub.card]);}}
});
