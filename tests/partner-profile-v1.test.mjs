import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Minimal browser stand-ins: no DOM, in-memory localStorage.
const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem:k => store.has(k) ? store.get(k) : null,
  setItem:(k,v) => store.set(k, String(v)),
  removeItem:k => store.delete(k)
};
window.addEventListener = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};
console.info = () => {};

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
(0, eval)(read('lunea-partner-profile-v1.js'));
(0, eval)(read('lunea-final-prompt-priority-v1.js'));

const partner = window.LUNEA_PARTNER_PROFILE_V1;
const priority = window.LUNEA_FINAL_PROMPT_PRIORITY_V1;
assert.ok(partner && priority);

// Date-only derivations stay honest about edges.
assert.equal(partner.sunSign('1992-02-29'), '물고기자리');
assert.match(partner.sunSign('2002-03-21'), /경계일/);
assert.match(partner.thaiDay('1992-03-04', '', true), /낮 Mercury \/ 밤 Rahu 구분은 출생시간 미상/);
assert.equal(partner.thaiDay('1992-02-29', '', true), '토요일 · Saturn ♄');

// Nothing connected → no block, no policy line.
assert.equal(partner.promptBlock(), '');
const base = '[질문 원문]\n"상대방에게서 다시 연락이 올까?"\n\n[질문 유형]\n연애\n\n[뽑힌 카드]\n1. TEST';
assert.doesNotMatch(priority.build(base), /Partner Profile/);

// Connected partner with unknown birth time.
localStorage.setItem(partner.storeKey, JSON.stringify({
  activeId:'p1',
  partners:[{id:'p1', name:'진', relation:'썸', gender:'남성', birthDate:'1992-02-29', birthTime:'', timeUnknown:true, birthPlace:'광주',
    saju:{mode:'range', pillars:{year:{display:'壬申'}, month:{display:'壬寅'}, day:{display:'乙亥'}, hour:null}, unstable:[], dayStem:'乙'}}]
}));
const block = partner.promptBlock();
assert.ok(block.startsWith(partner.marker));
assert.match(block, /출생시간 모름/);
assert.match(block, /년주 壬申 \/ 월주 壬寅 \/ 일주 乙亥/);
assert.doesNotMatch(block, /시주 /, 'hour pillar is never listed when birth time is unknown');
assert.match(block, /시간 의존 항목 제외/);

const withPartner = `${base}\n\n${block}`;
const final = priority.build(withPartner);
assert.match(final, /Partner Profile\(상대방 출생 명식\)/);
assert.match(final, /지금의 속마음·연락 여부·사건 성립은 RWS 카드로 판단/);
assert.ok(final.trim().endsWith('관련 없는 보조 체계는 0문장으로 생략한다.'), 'final output line stays last');

// Share links: LUNEA uses the served address, Thai app points at GitHub Pages.
globalThis.location = {href:'https://cozysso-afk.github.io/lunea/index.html?x=1'};
(0, eval)(read('lunea-share-links-v1.js'));
const apps = window.LUNEA_SHARE_LINKS_V1.apps();
assert.equal(apps.find(a => a.id === 'lunea').url, 'https://cozysso-afk.github.io/lunea/');
assert.equal(apps.find(a => a.id === 'thai').url, 'https://cozysso-afk.github.io/thai-vedic-astro-site/');

console.log('partner-profile-v1 ok');
