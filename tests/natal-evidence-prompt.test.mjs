import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
function harness({natal=null,profile={}}={}){
 const map=new Map([['LUNEA_ASTRO_NATAL_V3',JSON.stringify(natal)],['LUNEA_USER_PROFILE',JSON.stringify(profile)]]);
 const c={console,document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>map.get(k)||null},addEventListener(){},setInterval(){},clearInterval(){},setTimeout(){}};c.window=c;
 vm.createContext(c);
 // Expose the real serializers without running unrelated profile UI setup.
 const src=read('celestial-profile-v3.js').replace("  if (document.readyState === 'loading') {", "  window.testProfile={natalPromptSummary,buildSeparatedProfileBlock};\n  if (document.readyState === 'loading') {");
 vm.runInContext(src,c);vm.runInContext(read('lunea-final-prompt-priority-v1.js'),c);vm.runInContext(read('interpretation-gloss-v1.js'),c);
 return c;
}
const body=(extra={})=>({sign:'Aries',degree:0,whole_house:1,placidus_house:12,...extra});
const fixture={schema:'LUNEA_ASTRO_NATAL_V3',sect:'night',planets:{Sun:body({retrograde:false,speed_deg_per_day:1}),Moon:body(),Mercury:body({retrograde:true,speed_deg_per_day:-0.12}),Uranus:body(),Neptune:body(),Pluto:body()},angles:{ASC:body()},aspects:[{a:'Sun',b:'Moon',aspect:'합',angle:0,orb:0},{a:'Mercury',b:'Pluto',aspect:'사분위',angle:90,orb:1.25}]};
test('real backend-shaped natal retains outer planets, retrograde, speed, sect and zero-orb aspects',()=>{
 const h=harness({natal:fixture}),text=h.testProfile.natalPromptSummary();
 for(const expected of ['Uranus(천왕성)','Neptune(해왕성)','Pluto(명왕성)','역행 · 속도 -0.12°/일','순행 · 속도 1°/일','야간','Sun 합 Moon: 각 0° · orb(허용각 차이) 0°','Mercury 사분위 Pluto: 각 90° · orb(허용각 차이) 1.25°','WS 1H','Placidus 12H'])assert.ok(text.includes(expected),expected);
 assert.match(text,/현재 트랜짓이나 연락 시점으로 바꾸지 않는다/);
});
test('missing optional evidence is never invented; malformed and duplicate aspects are excluded',()=>{
 const f=JSON.parse(JSON.stringify(fixture));delete f.sect;f.aspects.push({...f.aspects[0],a:'Moon',b:'Sun'},{a:'Sun',b:'Pluto',aspect:'합',angle:90,orb:0},{a:'Sun',b:'Missing',aspect:'합',angle:0,orb:0},{a:'Sun',b:'Pluto',aspect:'합',angle:0,orb:null});
 const text=harness({natal:f}).testProfile.natalPromptSummary();assert.equal(text.match(/각 0°/g).length,1);assert.doesNotMatch(text,/Missing|Sect|Sun 합 Pluto/);
 const minimal=harness({natal:{planets:{Sun:body(),Moon:body()}}}).testProfile.natalPromptSummary();assert.doesNotMatch(minimal,/역행|순행|속도|Natal aspects|Sect/);
});
test('empty profiles stay unusable in both final policy and refreshed ledger',()=>{
 const h=harness(),block=h.testProfile.buildSeparatedProfileBlock(),prompt=`[질문 원문]\n내가 이직할까?\n\n[질문 유형]\ncareer\n${block}`;
 assert.doesNotMatch(block,/- 원국 年/);assert.equal(h.LUNEA_FINAL_PROMPT_PRIORITY_V1.hasSaju(prompt),false);
 assert.match(h.LUNEA_FINAL_PROMPT_PRIORITY_V1.build(prompt),/유효한 입력값이 없으면 사용하지 않는다/);
 const ledger=h.LUNEA_INTERPRETATION_GLOSS_V2.refreshEngineLedger(prompt);assert.match(ledger,/- Saju\(사주명리\): 없음 → 사용 금지/);assert.match(ledger,/- Western natal profile[^\n]*없음 → 사용 금지/);
});
test('day pillar alone is genuine Saju evidence while placeholder-only rows are not',()=>{
 const h=harness({profile:{sajuDetail:{pillars:{day:'甲子'}}}});assert.equal(h.LUNEA_FINAL_PROMPT_PRIORITY_V1.hasSaju(h.testProfile.buildSeparatedProfileBlock()),true);
 for(const value of ['미입력 / 미입력 / 미입력 / 미입력','미확인','—','N/A'])assert.equal(h.LUNEA_FINAL_PROMPT_PRIORITY_V1.hasSaju(`[SAJU / FOUR PILLARS · 사주명리]\n- 원국 年/月/日/時: ${value}\n[THAI ASTROLOGY]`),false,value);
});
test('final prompt wrapper retains computed natal evidence and marks usable engines accurately',()=>{
 const h=harness({natal:fixture,profile:{sajuDetail:{pillars:{day:'甲子'}}}});
 h.promptString=()=>`[질문 원문]\n내가 이직할까?\n\n[질문 유형]\ncareer\n${h.testProfile.buildSeparatedProfileBlock()}\n\n[뽑힌 카드]\nThe Fool`;
 h.LUNEA_FINAL_PROMPT_PRIORITY_V1.ensure();const prompt=h.promptString();assert.match(prompt,/Sun 합 Moon/);assert.match(prompt,/- Saju\(사주명리\): 현재 프롬프트에 있음/);assert.match(prompt,/- Western natal profile[^\n]*있음 → 질문 관련 항목만 보조 가능/);
});
